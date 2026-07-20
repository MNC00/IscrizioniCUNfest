/**
 * MAIN.gs
 * ---------------------------------------------------------------------------
 * Punti di ingresso (trigger) del progetto. Ogni funzione qui presente è
 * registrata come trigger installabile in Apps Script (vedi
 * docs/3_3_mappa_automazioni.md) e si limita a orchestrare le chiamate alle
 * funzioni di business definite in pricing.gs, sheets.gs ed email.gs.
 *
 * ITERAZIONE 3 (2026-07-20) — riprogettazione workflow, vedi decision log:
 * - Rimossa la gestione "Stanze" (non più usata, vedi decision log).
 * - mioTrigger()/onEdit() ora eseguono SUBITO solo calcolo prezzo + invio
 *   mail (percorso "veloce", niente ritardo per l'iscritto); la rigenerazione
 *   dei fogli derivati (Ordinato/Pagamento/Pasti/Stato Iscrizione) non è più
 *   sincrona: viene solo "segnata come da rifare" (segnaViewsDaRigenerare_,
 *   in setup.gs) ed eseguita in batch dal trigger a tempo
 *   rigeneraViewsSeNecessario() ogni ~5 minuti. Riduce drasticamente il
 *   numero di rigenerazioni complete a parità di iscrizioni.
 * - invioRecovery() non invia più direttamente: l'invio massivo, essendo
 *   irreversibile e ad alto impatto, è stato spostato sul menu
 *   "Iscrizioni CUN Fest" con conferma esplicita (vedi setup.gs,
 *   avviaInvioComunicazioneDiMassa()).
 * ---------------------------------------------------------------------------
 */

/************** TRIGGER: ON_FORM_SUBMIT — nuova iscrizione **************/
function mioTrigger() {
  var FN = "mioTrigger";

  try { calcolaPrezziIscrizioni(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Calcolo prezzi fallito.", e); }

  try { invioMailIscrizione(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio mail di iscrizione fallito.", e); }

  // I fogli derivati e la colonna "Stato Iscrizione" non vengono più
  // rigenerati subito: vengono solo segnati come "da aggiornare" e verranno
  // rigenerati in batch entro ~5 minuti da rigeneraViewsSeNecessario().
  segnaViewsDaRigenerare_();
}

/************** TRIGGER: ON_EDIT — reinvio manuale con prezzo **************/
function onEdit(e) {
  var FN = "onEdit";

  // Controllo preventivo: l'evento deve avere un range valido
  if (!e || !e.range) {
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Evento onEdit senza range valido: uscita.");
    return;
  }

  var sheet = e.range.getSheet();
  var editedCol = e.range.getColumn();
  var startRow = e.range.getRow();
  var numRows = sheet.getLastRow();

  // Trova l'indice colonna "nuovo invio" (da buildHeaderIndex)
  var headerMap = buildHeaderIndex(sheet);
  var idxNuovoInvio = getCol(CONFIG.COLONNE.NUOVO_INVIO_ALIAS, headerMap) + 1;

  // Se la colonna modificata è diversa da quella trigger, esci
  if (editedCol !== idxNuovoInvio) return;

  for (var i = 0; i < numRows; i++) {
    var row = startRow + i;
    var triggerVal = String(sheet.getRange(row, editedCol).getValue() || "").toLowerCase().trim();

    if (triggerVal === CONFIG.STATI.COMANDO_INVIA_CON_PREZZO) {
      try { calcolaPrezziIscrizioni(); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Calcolo prezzi fallito (riga " + row + ").", err); }

      try { invioMailAggiornamento(row); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio mail di aggiornamento fallito (riga " + row + ").", err); }

      // Fogli derivati e "Stato Iscrizione" aggiornati in batch entro ~5
      // minuti da rigeneraViewsSeNecessario(), non più subito ad ogni edit.
      segnaViewsDaRigenerare_();
    }
  }
}

/************** TRIGGER: ON_EDIT — comunicazione di massa (guida verso il menu) **************/
function invioRecovery(e) {
  var FN = "invioRecovery";

  // ITERAZIONE 3 (2026-07-20): l'invio massivo è un'azione irreversibile e ad
  // alto impatto (raggiunge TUTTI gli iscritti). Da qui in poi NON parte più
  // scrivendo "si" in una cella: va lanciato dal menu "Iscrizioni CUN Fest ▸
  // Invia comunicazione a tutti gli iscritti…", che mostra un riepilogo e
  // chiede conferma esplicita prima di inviare (vedi setup.gs,
  // avviaInvioComunicazioneDiMassa()). Questa funzione resta installata come
  // trigger solo per intercettare il vecchio comando e guidare l'operatore
  // verso il nuovo percorso, senza inviare nulla automaticamente.
  if (!e || !e.range || !e.source) {
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Evento onEdit senza range/source valido: uscita.");
    return;
  }

  var foglio = e.source.getActiveSheet();
  var rigaModificata = e.range.getRow();
  var colonnaModificata = e.range.getColumn();
  var headerMap = buildHeaderIndex(foglio);
  var idxInviaMailATutti = getCol(CONFIG.COLONNE_MAIL.INVIA_A_TUTTI, headerMap);

  if (colonnaModificata !== idxInviaMailATutti + 1) return;

  var valore = norm(foglio.getRange(rigaModificata, colonnaModificata).getValue());
  if (valore !== "si" && valore !== "sì") return;

  try { foglio.getRange(rigaModificata, colonnaModificata).setValue(""); } catch (e2) { /* best effort */ }

  logEvent(CONFIG.LOG.LIVELLI.WARNING, FN,
    "Comando \"si\" ignorato in \"" + CONFIG.SHEETS.COMUNICAZIONE + "\" (riga " + rigaModificata + "): " +
    "l'invio massivo va avviato dal menu \"Iscrizioni CUN Fest ▸ Invia comunicazione a tutti gli iscritti…\".");

  try {
    SpreadsheetApp.getUi().alert(
      "Per inviare la comunicazione a tutti gli iscritti usa il menu \"Iscrizioni CUN Fest ▸ Invia comunicazione a tutti gli iscritti…\" in alto. " +
      "In questo modo puoi vedere un riepilogo e confermare prima dell'invio."
    );
  } catch (e2) {
    // getUi() può non essere disponibile in tutti i contesti di esecuzione: il log sopra resta comunque scritto.
  }
}

/************** TRIGGER: ON_EDIT — colorazione riga pagata **************/
function coloraPagati(e) {
  var FN = "coloraPagati";

  // Controllo preventivo: l'evento deve avere un range valido
  if (!e || !e.range || !e.source) {
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Evento onEdit senza range/source valido: uscita.");
    return;
  }

  var foglio = e.source.getActiveSheet();
  var rigaModificata = e.range.getRow();
  var colonnaModificata = e.range.getColumn();
  var headerMap = buildHeaderIndex(foglio);
  var idxPagamento = getCol(CONFIG.COLONNE.PAGATO, headerMap);

  // Verifica se la modifica è stata effettuata nella colonna Y (colonna 24) e se il valore è "invia con prezzo".
  if (colonnaModificata === idxPagamento +1) {
    try {
      var riga = foglio.getRange(rigaModificata,1,1,colonnaModificata);
      var val = foglio.getRange(rigaModificata, colonnaModificata).getValue();
      riga.setBackground(val === CONFIG.STATI.PAGATO_X ? CONFIG.COLORI.RIGA_PAGATO_AZZURRO : CONFIG.COLORI.RIGA_NON_PAGATO_BIANCO);
    } catch (e2) {
      logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Colorazione riga pagamento fallita (riga " + rigaModificata + ").", e2);
    }

    // Il pagamento è registrato qui, ma la colonna consolidata "Stato
    // Iscrizione" vive nel foglio Iscrizioni: la segniamo da aggiornare nel
    // prossimo giro batch invece di ricalcolarla subito ad ogni singola "x".
    segnaViewsDaRigenerare_();
  }
}
