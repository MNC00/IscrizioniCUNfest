/**
 * Orchestration/protezioneFogli.js
 * -----------------------------------------------------------------------
 * Protegge i fogli/viste gestiti interamente dallo script contro modifiche
 * manuali accidentali. Usa protezioni di tipo "solo avviso" (warningOnly):
 * chi prova a modificare a mano una cella protetta vede un avviso e può
 * comunque procedere se necessario, ma le azioni da menu (che scrivono via
 * script sotto l'identità dell'operatore che le lancia) NON sono bloccate.
 *
 * Una protezione "restrittiva" (solo il proprietario può modificare) non è
 * praticabile qui: bloccherebbe anche gli operatori quando usano il menu
 * (es. "Registra pagamento"), perché uno script legato a un menu esegue con
 * i permessi di chi lo lancia, non con quelli del proprietario dello script.
 */

/** Testo usato per marcare le protezioni create da questo script, per poterle ritrovare/rimuovere senza toccare eventuali protezioni create manualmente da un utente. */
var TAG_PROTEZIONE_SCRIPT = 'Protezione automatica CUN Fest (non rimuovere manualmente: gestita dal codice)';

/** Fogli interamente gestiti dallo script: nessun input manuale legittimo previsto, solo azioni da menu. */
function fogliDaProteggere_() {
  return [
    FOGLI.ISCRIZIONI_OPERATIVO,
    FOGLI.ISCRIZIONI_ORDINATE,
    FOGLI.PAGAMENTO,
    FOGLI.TABELLA_PASTI,
    FOGLI.DASHBOARD,
    FOGLI.EVENTI
  ];
}

/**
 * Applica (o riapplica) le protezioni "solo avviso" sui fogli gestiti dallo script.
 * Idempotente: rimuove prima eventuali protezioni precedentemente create da questa
 * stessa funzione (identificate dal TAG_PROTEZIONE_SCRIPT) per evitare duplicati,
 * poi le ricrea. Non tocca protezioni create manualmente da un utente su altri fogli.
 * @return {{protetti: string[], mancanti: string[]}}
 */
function applicaProtezioniFogli() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var protetti = [];
  var mancanti = [];

  fogliDaProteggere_().forEach(function (nomeFoglio) {
    var sheet = ss.getSheetByName(nomeFoglio);
    if (!sheet) { mancanti.push(nomeFoglio); return; }

    rimuoviProtezioneScriptSeEsiste_(sheet);

    var protezione = sheet.protect().setDescription(TAG_PROTEZIONE_SCRIPT);
    protezione.setWarningOnly(true); // avviso, non blocco: vedi commento in testa al file

    protetti.push(nomeFoglio);
  });

  return { protetti: protetti, mancanti: mancanti };
}

/** Rimuove, se presente, la protezione dell'intero foglio precedentemente creata da applicaProtezioniFogli. */
function rimuoviProtezioneScriptSeEsiste_(sheet) {
  var protezioni = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  protezioni.forEach(function (p) {
    if (p.getDescription() === TAG_PROTEZIONE_SCRIPT) p.remove();
  });
}

/** Menu: applica le protezioni e mostra un riepilogo. */
function menuApplicaProtezioniFogli() {
  var risultato = applicaProtezioniFogli();
  var ui = SpreadsheetApp.getUi();
  var messaggio = 'Protezione "solo avviso" applicata ai fogli:\n- ' + risultato.protetti.join('\n- ');
  if (risultato.mancanti.length) {
    messaggio += '\n\nFogli non trovati (saltati): ' + risultato.mancanti.join(', ');
  }
  messaggio += '\n\nChi modifica a mano una cella in questi fogli vedrà un avviso, ma potrà comunque procedere: le protezioni servono a prevenire errori accidentali, non sostituiscono i controlli di accesso.';
  ui.alert('Protezione fogli', messaggio, ui.ButtonSet.OK);
}
