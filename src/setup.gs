/**
 * SETUP.gs
 * ---------------------------------------------------------------------------
 * Iterazione 3 del refactoring (2026-07-20) — riprogettazione del workflow
 * (vedi decision log 7_3). Questo file raccoglie tre cose nuove:
 *
 * 1) Menu custom "Iscrizioni CUN Fest" (onOpen, simple trigger — nessuna
 *    installazione manuale richiesta): sposta l'invio massivo su un'azione
 *    esplicita con conferma, invece che su una cella scritta a mano.
 *
 * 2) Rigenerazione "in batch" dei fogli derivati (Ordinato/Pagamento/Pasti/
 *    Stato Iscrizione): invece di rigenerarli ad ogni singolo submit/edit,
 *    li si segna solo come "da aggiornare" (segnaViewsDaRigenerare_) e un
 *    trigger a tempo (rigeneraViewsSeNecessario, da installare UNA VOLTA con
 *    installaTriggerRigenerazionePeriodica) li aggiorna in blocco ogni ~5
 *    minuti. La mail di conferma resta istantanea: solo le "viste" derivate
 *    accettano un ritardo massimo di 5 minuti.
 *
 * 3) configurarValidazioniComandi(): applica dei menu a discesa (Data
 *    Validation) alle celle-comando più usate, per ridurre l'errore umano
 *    dovuto a testo scritto a mano (typo, maiuscole/minuscole, spazi).
 * ---------------------------------------------------------------------------
 */

/************** MENU CUSTOM **************/
/**
 * Simple trigger eseguito automaticamente all'apertura del foglio: non
 * richiede installazione manuale. Se getUi() non è disponibile nel contesto
 * di esecuzione (raro), fallisce silenziosamente senza bloccare l'apertura.
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Iscrizioni CUN Fest')
      .addItem('Invia comunicazione a tutti gli iscritti…', 'avviaInvioComunicazioneDiMassa')
      .addSeparator()
      .addItem('Rigenera ora Ordinato/Pagamento/Pasti/Stato', 'rigeneraViewsOra')
      .addSeparator()
      .addItem('Configura dropdown sulle celle comando (una tantum)', 'configurarValidazioniComandi')
      .addItem('Installa/verifica trigger periodico 5 min (una tantum)', 'installaTriggerRigenerazionePeriodica')
      .addToUi();
  } catch (e) {
    // Contesto senza UI (es. esecuzione da editor Apps Script): nessun problema.
  }
}

/************** INVIO COMUNICAZIONE DI MASSA CON CONFERMA **************/
/**
 * Sostituisce il vecchio "scrivi si in una cella" per l'invio di massa:
 * mostra un riepilogo (oggetto + numero destinatari) e chiede conferma
 * esplicita prima di chiamare sendRecoveryEmails() (email.gs), che resta
 * invariata nella logica di invio/reset.
 */
function avviaInvioComunicazioneDiMassa() {
  var FN = "avviaInvioComunicazioneDiMassa";
  var ui = SpreadsheetApp.getUi();
  var foglioMail, sh;

  try {
    foglioMail = getComunicazioneSheet_(FN);
    sh = getIscrizioniSheet_(FN);
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Impossibile accedere ai fogli comunicazione/iscrizioni.", e);
    ui.alert("Errore: impossibile leggere i fogli necessari. Controlla il tab \"" + CONFIG.SHEETS.LOG + "\".");
    return;
  }
  if (!foglioMail || !sh) {
    ui.alert("Foglio \"" + CONFIG.SHEETS.COMUNICAZIONE + "\" o \"" + CONFIG.SHEETS.ISCRIZIONI + "\" non trovato.");
    return;
  }

  var headerMapMail = buildHeaderIndex(foglioMail);
  var cOggetto = getCol(CONFIG.COLONNE_MAIL.OGGETTO, headerMapMail);
  var cTesto = getCol(CONFIG.COLONNE_MAIL.TESTO, headerMapMail);

  if (cOggetto < 0 || cTesto < 0) {
    ui.alert("Colonne \"Oggetto\"/\"Testo\" non trovate nel tab \"" + CONFIG.SHEETS.COMUNICAZIONE + "\".");
    return;
  }

  var oggetto = foglioMail.getRange(CONFIG.COMUNICAZIONE_RIGA_DATI + 1, cOggetto + 1).getValue();
  var testo = foglioMail.getRange(CONFIG.COMUNICAZIONE_RIGA_DATI + 1, cTesto + 1).getValue();

  if (!oggetto || !testo) {
    ui.alert("Oggetto o testo della mail sono vuoti: compila il tab \"" + CONFIG.SHEETS.COMUNICAZIONE + "\" prima di inviare.");
    return;
  }

  // Conta i destinatari unici plausibili, per mostrare un numero realistico nel riepilogo.
  var headerMap = buildHeaderIndex(sh);
  var cEmail = getCol(CONFIG.COLONNE.EMAIL, headerMap);
  var numDestinatari = 0;
  if (cEmail >= 0 && sh.getLastRow() > 1) {
    var dati = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    var unici = {};
    dati.forEach(function(riga) {
      var em = riga[cEmail];
      if (em && isValidEmail_(em)) unici[em] = true;
    });
    numDestinatari = Object.keys(unici).length;
  }

  var risposta = ui.alert(
    "Conferma invio comunicazione di massa",
    "Stai per inviare questa mail a " + numDestinatari + " indirizzi email unici:\n\n" +
    "Oggetto: " + oggetto + "\n\n" +
    "Questa azione è IRREVERSIBILE e non può essere annullata una volta confermata. Procedere?",
    ui.ButtonSet.YES_NO
  );

  if (risposta !== ui.Button.YES) {
    logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Invio comunicazione di massa annullato dall'operatore prima della conferma.");
    return;
  }

  try {
    sendRecoveryEmails();
    ui.alert("Comunicazione inviata. Controlla il tab \"" + CONFIG.SHEETS.LOG + "\" per il riepilogo di invii riusciti/falliti.");
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Invio comunicazione di massa fallito.", e);
    ui.alert("Invio fallito: controlla il tab \"" + CONFIG.SHEETS.LOG + "\".");
  }
}

/************** RIGENERAZIONE VISTE IN BATCH (flag "dirty") **************/
var REGEN_FLAG_KEY_ = "REGEN_VIEWS_DIRTY";

/**
 * Segna che i fogli derivati (Ordinato/Pagamento/Pasti/Stato Iscrizione) non
 * sono più allineati ai dati e vanno rigenerati al prossimo giro del trigger
 * periodico. Non rigenera nulla subito: è pensata per essere chiamata da
 * mioTrigger()/onEdit() (main.gs) al posto delle chiamate dirette.
 */
function segnaViewsDaRigenerare_() {
  var FN = "segnaViewsDaRigenerare_";
  try {
    PropertiesService.getScriptProperties().setProperty(REGEN_FLAG_KEY_, "true");
  } catch (e) {
    // Se anche questo fallisse, meglio rigenerare subito che perdere l'aggiornamento.
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Impossibile impostare il flag di rigenerazione: rigenero subito come fallback.", e);
    try { creaFoglioOrdinato(); } catch (e2) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Fallback: aggiornamento foglio ordinato fallito.", e2); }
    try { creaFoglioPagamento(); } catch (e2) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Fallback: aggiornamento foglio pagamento fallito.", e2); }
    try { generaTabellaPasti(); } catch (e2) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Fallback: rigenerazione tabella pasti fallita.", e2); }
    try { aggiornaStatoIscrizione(); } catch (e2) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Fallback: aggiornamento Stato Iscrizione fallito.", e2); }
  }
}

/**
 * Trigger a tempo (da installare una volta con installaTriggerRigenerazionePeriodica()):
 * se i fogli derivati sono stati segnati come "da aggiornare", li rigenera
 * tutti in un colpo solo e azzera il flag. Se non c'è nulla da fare, esce
 * subito senza toccare i fogli (nessun costo per le esecuzioni "a vuoto").
 */
function rigeneraViewsSeNecessario() {
  var FN = "rigeneraViewsSeNecessario";
  var props = PropertiesService.getScriptProperties();

  if (props.getProperty(REGEN_FLAG_KEY_) !== "true") return;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    // Un'altra esecuzione sta già rigenerando: ci riproveremo al prossimo giro (max 5 minuti dopo).
    logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Rigenerazione rimandata al prossimo giro: lock occupato.", e);
    return;
  }

  try {
    // Ricontrolla dopo il lock: un'altra esecuzione potrebbe aver già rigenerato nel frattempo.
    if (props.getProperty(REGEN_FLAG_KEY_) !== "true") return;

    props.deleteProperty(REGEN_FLAG_KEY_);

    try { creaFoglioOrdinato(); } catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento foglio ordinato fallito.", e); }
    try { creaFoglioPagamento(); } catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento foglio pagamento fallito.", e); }
    try { generaTabellaPasti(); } catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Rigenerazione tabella pasti fallita.", e); }
    try { aggiornaStatoIscrizione(); } catch (e) { logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento Stato Iscrizione fallito.", e); }

    logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Rigenerazione periodica dei fogli derivati completata.");
  } finally {
    try { lock.releaseLock(); } catch (e) { /* best effort */ }
  }
}

/**
 * Azione manuale da menu: forza subito la rigenerazione, senza aspettare il
 * prossimo giro del trigger periodico. Utile subito dopo una modifica
 * urgente o durante i test.
 */
function rigeneraViewsOra() {
  segnaViewsDaRigenerare_();
  rigeneraViewsSeNecessario();
  try { SpreadsheetApp.getUi().alert("Fogli derivati rigenerati (Ordinato, Pagamento, Pasti, Stato Iscrizione)."); } catch (e) { /* best effort */ }
}

/**
 * Da eseguire UNA VOLTA (dal menu o dall'editor Apps Script) per installare
 * il trigger a tempo che chiama rigeneraViewsSeNecessario() ogni 5 minuti.
 * Idempotente: se il trigger esiste già, non ne crea un duplicato.
 */
function installaTriggerRigenerazionePeriodica() {
  var FN = "installaTriggerRigenerazionePeriodica";

  var esistente = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === "rigeneraViewsSeNecessario";
  });

  if (esistente) {
    logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Trigger periodico già installato: nessuna azione necessaria.");
    try { SpreadsheetApp.getUi().alert("Il trigger periodico è già installato."); } catch (e) { /* best effort */ }
    return;
  }

  ScriptApp.newTrigger("rigeneraViewsSeNecessario")
    .timeBased()
    .everyMinutes(5)
    .create();

  logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Trigger periodico \"rigeneraViewsSeNecessario\" installato (ogni 5 minuti).");
  try {
    SpreadsheetApp.getUi().alert(
      "Trigger periodico installato: da ora Ordinato/Pagamento/Pasti/Stato Iscrizione si aggiornano entro 5 minuti da ogni modifica."
    );
  } catch (e) { /* best effort */ }
}

/************** VALIDAZIONI A DISCESA SULLE CELLE COMANDO **************/
/**
 * Da eseguire UNA VOLTA (dal menu) per trasformare le celle-comando a testo
 * libero in dropdown (Data Validation): colonna "Nuovo invio" nel foglio
 * Iscrizioni e colonna "Pagato" nel foglio Pagamento. Usa setAllowInvalid(true)
 * di proposito: guida l'operatore con un menu a discesa senza bloccare in modo
 * rigido eventuali casi particolari (coerente con i confronti case-insensitive
 * già presenti nel codice).
 */
function configurarValidazioniComandi() {
  var FN = "configurarValidazioniComandi";

  try {
    var sh = getIscrizioniSheet_(FN);
    if (sh) {
      var headerMap = buildHeaderIndex(sh);
      var idxNuovoInvio = ensureColumn(sh, headerMap, CONFIG.COLONNE.NUOVO_INVIO);
      var maxRows = Math.max(sh.getMaxRows() - 1, 1);

      var regolaNuovoInvio = SpreadsheetApp.newDataValidation()
        .requireValueInList(CONFIG.LISTE.NUOVO_INVIO, true)
        .setAllowInvalid(true)
        .build();

      sh.getRange(2, idxNuovoInvio + 1, maxRows, 1).setDataValidation(regolaNuovoInvio);
    } else {
      logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Foglio iscrizioni non trovato: dropdown \"Nuovo invio\" non applicato.");
    }

    var shPagamento = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.PAGAMENTO);
    if (shPagamento && shPagamento.getLastRow() > 0) {
      var headerPagamento = buildHeaderIndex(shPagamento);
      var cPagato = getCol(CONFIG.COLONNE.PAGATO, headerPagamento);

      if (cPagato >= 0) {
        var maxRowsPagamento = Math.max(shPagamento.getMaxRows() - 1, 1);
        var regolaPagato = SpreadsheetApp.newDataValidation()
          .requireValueInList(CONFIG.LISTE.PAGATO, true)
          .setAllowInvalid(true)
          .build();

        shPagamento.getRange(2, cPagato + 1, maxRowsPagamento, 1).setDataValidation(regolaPagato);
      } else {
        logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Colonna \"Pagato\" non trovata nel foglio Pagamento: dropdown non applicato.");
      }
    }

    logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Validazioni a discesa applicate alle colonne comando (\"Nuovo invio\", \"Pagato\").");
    try {
      SpreadsheetApp.getUi().alert("Fatto: le colonne \"Nuovo invio\" e \"Pagato\" ora mostrano un menu a discesa.");
    } catch (e) { /* best effort */ }
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Applicazione delle validazioni a discesa fallita.", e);
    try { SpreadsheetApp.getUi().alert("Errore durante l'applicazione delle validazioni: controlla il tab \"" + CONFIG.SHEETS.LOG + "\"."); } catch (e2) { /* best effort */ }
  }
}
