/**
 * Infrastructure/Versione.js
 * -----------------------------------------------------------------------
 * Marcatore di versione del codice deployato. Serve a rilevare "drift":
 * se qualcuno modifica il codice direttamente dall'editor Apps Script online
 * (bypassando git+clasp), questa costante NON cambia, e diventa evidente
 * confrontando "Info versione" con l'ultimo commit atteso su git.
 *
 * IMPORTANTE: aggiornare VERSIONE_SCRIPT ad ogni `clasp push` rilevante
 * (o almeno ad ogni release), tipicamente nello stesso commit del cambiamento.
 */
var VERSIONE_SCRIPT = Object.freeze({
  NUMERO: '1.3.0',
  DATA: '2026-07-31', // aggiornare alla data dell'ultimo deploy rilevante
  DESCRIZIONE: 'Fase A (a5): validazioni a tendina su celle libere (Pagato, Stato Comunicazioni)'
});

/**
 * Mostra un dialog con la versione corrente del codice, utile per verificare
 * che il codice in esecuzione sul foglio corrisponda a quanto atteso su git
 * (se qualcuno avesse modificato codice a mano dall'editor online, il numero
 * di versione qui mostrato NON rifletterebbe quella modifica: è quindi un
 * segnale indiretto di "drift" da codice non passato da git+clasp).
 */
function menuMostraInfoVersione() {
  var ui = SpreadsheetApp.getUi();
  var messaggio =
    'Versione: ' + VERSIONE_SCRIPT.NUMERO + '\n' +
    'Data ultimo deploy dichiarato: ' + VERSIONE_SCRIPT.DATA + '\n' +
    'Descrizione: ' + VERSIONE_SCRIPT.DESCRIZIONE + '\n\n' +
    'Il codice va sempre modificato SOLO tramite git + "clasp push" dal repository ufficiale.\n' +
    'Se questa versione non corrisponde all\'ultimo commit atteso, segnalarlo prima di procedere.';
  ui.alert('Info versione', messaggio, ui.ButtonSet.OK);
}
