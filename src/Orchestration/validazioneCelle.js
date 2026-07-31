/**
 * Orchestration/validazioneCelle.js
 * -----------------------------------------------------------------------
 * Applica validazioni a tendina sulle poche celle "libere" rimaste per
 * l'operatore, per ridurre il rischio di errori di battitura che
 * confonderebbero una lettura manuale del foglio (queste colonne non sono
 * lette/interpretate dal codice, quindi un typo qui non romperebbe
 * l'elaborazione, ma renderebbe il foglio meno chiaro da consultare).
 *
 * Non è un controllo di sicurezza: è un aiuto per un utente non tecnico,
 * complementare alle protezioni "solo avviso" di Orchestration/protezioneFogli.js.
 */

/** Numero di righe dati su cui applicare le validazioni (oltre l'intestazione). */
var RIGHE_VALIDAZIONE_CELLE = 500;

/**
 * Applica le validazioni a tendina sui tab che hanno celle libere per l'operatore:
 * - "Pagamento" colonna "Pagato": solo vuoto oppure "x".
 * - "Comunicazioni" colonna "STATO": solo i valori di STATO_COMUNICAZIONE.
 * Idempotente: può essere rilanciata quante volte si vuole senza effetti collaterali.
 * @return {{applicate: string[], saltate: string[]}}
 */
function applicaValidazioniCelle() {
  var applicate = [];
  var saltate = [];

  var sheetPagamento = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FOGLI.PAGAMENTO);
  if (sheetPagamento) {
    var indicePagamento = costruisciIndiceIntestazioni(sheetPagamento);
    var idxPagato = assicuraColonna(sheetPagamento, indicePagamento, COLONNE_PAGAMENTO.PAGATO);
    var regolaPagato = SpreadsheetApp.newDataValidation()
      .requireValueInList(['', 'x'], true)
      .setAllowInvalid(true) // avviso, non blocco: coerente con l'approccio "solo avviso" di a4
      .setHelpText('Usare "Registra pagamento" dal menu, oppure scrivere "x" per segnare come pagato.')
      .build();
    sheetPagamento.getRange(2, idxPagato + 1, RIGHE_VALIDAZIONE_CELLE, 1).setDataValidation(regolaPagato);
    applicate.push(FOGLI.PAGAMENTO + ' (colonna "' + COLONNE_PAGAMENTO.PAGATO + '")');
  } else {
    saltate.push(FOGLI.PAGAMENTO);
  }

  var sheetComunicazioni = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FOGLI.COMUNICAZIONI);
  if (sheetComunicazioni) {
    var indiceComunicazioni = costruisciIndiceIntestazioni(sheetComunicazioni);
    var idxStato = assicuraColonna(sheetComunicazioni, indiceComunicazioni, COLONNE_COMUNICAZIONI.STATO);
    var valoriStatoComunicazione = Object.keys(STATO_COMUNICAZIONE).map(function (chiave) { return STATO_COMUNICAZIONE[chiave]; });
    var regolaStato = SpreadsheetApp.newDataValidation()
      .requireValueInList([''].concat(valoriStatoComunicazione), true)
      .setAllowInvalid(true)
      .setHelpText('Lasciare vuoto per una nuova comunicazione da inviare: lo stato lo aggiorna il sistema dopo l\'invio.')
      .build();
    sheetComunicazioni.getRange(2, idxStato + 1, RIGHE_VALIDAZIONE_CELLE, 1).setDataValidation(regolaStato);
    applicate.push(FOGLI.COMUNICAZIONI + ' (colonna "' + COLONNE_COMUNICAZIONI.STATO + '")');
  } else {
    saltate.push(FOGLI.COMUNICAZIONI);
  }

  return { applicate: applicate, saltate: saltate };
}

/** Menu: applica le validazioni a tendina e mostra un riepilogo. */
function menuApplicaValidazioniCelle() {
  var risultato = applicaValidazioniCelle();
  var ui = SpreadsheetApp.getUi();
  var messaggio = 'Validazione applicata su:\n- ' + risultato.applicate.join('\n- ');
  if (risultato.saltate.length) {
    messaggio += '\n\nTab non trovati (saltati): ' + risultato.saltate.join(', ');
  }
  messaggio += '\n\nQueste celle ora mostrano una tendina con i valori ammessi. Scrivere un valore diverso mostra solo un avviso, non blocca: è pensato per aiutare, non per impedire correzioni manuali quando servono davvero.';
  ui.alert('Validazione celle', messaggio, ui.ButtonSet.OK);
}
