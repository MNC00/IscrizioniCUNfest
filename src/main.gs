/**
 * MAIN.gs
 * ---------------------------------------------------------------------------
 * Punti di ingresso (trigger) del progetto. Ogni funzione qui presente è
 * registrata come trigger installabile in Apps Script (vedi
 * docs/3_3_mappa_automazioni.md) e si limita a orchestrare le chiamate alle
 * funzioni di business definite in pricing.gs, sheets.gs ed email.gs.
 * Nessuna modifica di comportamento rispetto agli originali "Risposta
 * all'iscrizione.js", "Invia con prezzo.js", "InvioRecEmail.js",
 * "Foglio pagamento.js" (coloraPagati) e "InvioStanze.js" (invioStanze).
 * ---------------------------------------------------------------------------
 */

/************** TRIGGER: ON_FORM_SUBMIT — nuova iscrizione **************/
function mioTrigger() {
  var FN = "mioTrigger";

  try { AutoCalcolatorePrezzi_tuamadre(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Calcolo prezzi fallito.", e); }

  try { invioMailIscrizione(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio mail di iscrizione fallito.", e); }

  try { creaFoglioOrdinato(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento foglio ordinato fallito.", e); }

  try { creaFoglioPagamento(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento foglio pagamento fallito.", e); }

  try { generaTabellaPasti(); }
  catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Rigenerazione tabella pasti fallita.", e); }
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
      try { AutoCalcolatorePrezzi_tuamadre(); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Calcolo prezzi fallito (riga " + row + ").", err); }

      try { invioMailAggiornamento(row); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio mail di aggiornamento fallito (riga " + row + ").", err); }

      try { creaFoglioOrdinato(); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento foglio ordinato fallito (riga " + row + ").", err); }

      try { creaFoglioPagamento(); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento foglio pagamento fallito (riga " + row + ").", err); }

      try { generaTabellaPasti(); }
      catch (err) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Rigenerazione tabella pasti fallita (riga " + row + ").", err); }
    }
  }
}

/************** TRIGGER: ON_EDIT — comunicazione di massa **************/
function invioRecovery(e) {
  var FN = "invioRecovery";

  // Controllo preventivo: l'evento deve avere un range valido
  if (!e || !e.range || !e.source) {
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Evento onEdit senza range/source valido: uscita.");
    return;
  }

  var foglio = e.source.getActiveSheet();
  var rigaModificata = e.range.getRow();
  var colonnaModificata = e.range.getColumn();
  var headerMap = buildHeaderIndex(foglio);
  var idxInviaMailATutti = getCol(CONFIG.COLONNE_MAIL.INVIA_A_TUTTI, headerMap);

  // Verifica se la modifica è stata effettuata nella colonna Y (colonna 24) e se il valore è "invia con prezzo".
  if (colonnaModificata === idxInviaMailATutti + 1 && foglio.getRange(rigaModificata, colonnaModificata).getValue() === CONFIG.STATI.COMANDO_INVIA_A_TUTTI) {
    try { sendRecoveryEmails(); }
    catch (e2) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio recovery email fallito.", e2); }
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
  }
}

/************** TRIGGER: ON_EDIT — assegnazione stanze **************/
function invioStanze(e) {
  var FN = "invioStanze";

  // Controllo preventivo: l'evento deve avere un range valido
  if (!e || !e.range || !e.source) {
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Evento onEdit senza range/source valido: uscita.");
    return;
  }

  var sheet = e.source.getActiveSheet();
  var range = e.range;

  // Controlla se la cella modificata è H4 e se il valore è "INVIA"
  if (sheet.getName() === CONFIG.SHEETS.STANZE && range.getA1Notation() === CONFIG.CELLE.STANZE_COMANDO_INVIO && range.getValue() === CONFIG.STATI.COMANDO_INVIA_STANZE) {
    try { sendEmails(); }
    catch (e2) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio email stanze fallito.", e2); }
  }
}
