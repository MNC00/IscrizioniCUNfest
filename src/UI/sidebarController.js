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
 * @return {{ok: boolean, motivo: ?string, iscrizione: ?Object, eventi: ?Array}}
 */
function caricaDatiSidebar() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== FOGLI.ISCRIZIONI_OPERATIVO) {
    return { ok: false, motivo: 'Seleziona una riga nel tab "' + FOGLI.ISCRIZIONI_OPERATIVO + '" (non nel tab del Form) e riapri questo pannello.' };
  }
  var riga = sheet.getActiveCell().getRow();
  if (riga <= 1) {
    return { ok: false, motivo: 'Seleziona una riga con dei dati (non l\'intestazione).' };
  }

  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var iscrizione = leggiIscrizioneDaRiga(sheet, indiceIntestazioni, riga);
  if (!iscrizione.idIscrizione) {
    return { ok: false, motivo: 'Questa riga non ha un ID_ISCRIZIONE. Esegui prima "Rigenera viste ora" dal menu per sincronizzare questo tab.' };
  }

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
    ok: true,
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

/**
 * Azione "Ricalcola prezzo" lanciata dal pulsante nella sidebar, sulla riga attualmente selezionata.
 * @return {{esito: string, errori: string[]}}
 */
function sidebarRicalcolaPrezzo() {
  var id = idIscrizioneDaRigaSelezionata_();
  if (!id) return { esito: 'ERRORE', errori: ['Seleziona prima una riga valida nel tab "' + FOGLI.ISCRIZIONI_OPERATIVO + '".'] };
  return gestisciRicalcolaPrezzo(id);
}

/**
 * Azione "Invia aggiornamento" lanciata dal pulsante nella sidebar, sulla riga attualmente selezionata.
 * Stessa logica di conferma del menu: se `confermaReinvio` non è true e la mail con prezzo era già
 * stata inviata, l'esito torna 'RICHIEDE_CONFERMA' invece di inviare, cosi' il client puo' chiedere
 * conferma e rilanciare con confermaReinvio=true.
 * @param {boolean} [confermaReinvio]
 * @return {{esito: string, errori: string[]}}
 */
function sidebarInviaAggiornamento(confermaReinvio) {
  var id = idIscrizioneDaRigaSelezionata_();
  if (!id) return { esito: 'ERRORE', errori: ['Seleziona prima una riga valida nel tab "' + FOGLI.ISCRIZIONI_OPERATIVO + '".'] };
  return gestisciInviaAggiornamento(id, !!confermaReinvio);
}
