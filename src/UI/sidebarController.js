/**
 * UI/sidebarController.js
 * -----------------------------------------------------------------------
 * Sidebar opzionale per gli operatori: mostra il dettaglio di un'iscrizione
 * (dati principali, stato, ultimi eventi di log) e permette di lanciare le
 * stesse azioni disponibili da menu senza cambiare foglio.
 */

/** Apre la sidebar con il dettaglio della riga selezionata nel tab Iscrizioni. */
function apriSidebarDettaglioIscrizione() {
  var html = HtmlService.createHtmlOutputFromFile('UI/sidebar')
    .setTitle('Dettaglio iscrizione');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Funzione richiamata dal client (google.script.run) per popolare la sidebar.
 * @return {?{iscrizione: Object, eventi: Array}}
 */
function caricaDatiSidebar() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== FOGLI.ISCRIZIONI) return null;
  var riga = sheet.getActiveCell().getRow();
  if (riga <= 1) return null;

  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var iscrizione = leggiIscrizioneDaRiga(sheet, indiceIntestazioni, riga);

  var sheetEventi = getOCreaFoglioEventi();
  var indiceEventi = costruisciIndiceIntestazioni(sheetEventi);
  var ultimaRiga = sheetEventi.getLastRow();
  var eventi = [];
  if (ultimaRiga >= 2) {
    var tutti = sheetEventi.getRange(2, 1, ultimaRiga - 1, sheetEventi.getLastColumn()).getValues();
    eventi = tutti
      .filter(function (r) { return r[trovaColonna([COLONNE_EVENTI.ID_ISCRIZIONE], indiceEventi)] === iscrizione.idIscrizione; })
      .slice(-20)
      .reverse()
      .map(function (r) {
        return {
          timestamp: Utilities.formatDate(new Date(r[trovaColonna([COLONNE_EVENTI.TIMESTAMP], indiceEventi)]), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
          tipoEvento: r[trovaColonna([COLONNE_EVENTI.TIPO_EVENTO], indiceEventi)],
          stato: r[trovaColonna([COLONNE_EVENTI.STATO], indiceEventi)],
          esito: r[trovaColonna([COLONNE_EVENTI.ESITO], indiceEventi)],
          errori: r[trovaColonna([COLONNE_EVENTI.ERRORI], indiceEventi)]
        };
      });
  }

  return {
    iscrizione: {
      idIscrizione: iscrizione.idIscrizione,
      nome: iscrizione.nome,
      cognome: iscrizione.cognome,
      email: iscrizione.email,
      statoIscrizione: iscrizione.statoIscrizione,
      prezzo: iscrizione.prezzo
    },
    eventi: eventi
  };
}
