/**
 * Domain/Dashboard.js
 * -----------------------------------------------------------------------
 * Calcolo puro dei dati della dashboard di stato: conteggio iscrizioni per
 * STATO_ISCRIZIONE ed elenco degli ultimi eventi in errore. Nessun accesso
 * a Sheets: riceve elenchi già letti e restituisce solo numeri/liste pronti
 * da visualizzare.
 */

/**
 * @typedef {Object} EventoDashboard
 * @property {Date} timestamp
 * @property {string} idIscrizione
 * @property {string} tipoEvento
 * @property {string} esito 'OK' oppure 'ERRORE'.
 * @property {string} errori
 */

/**
 * @param {Array<{statoIscrizione: string}>} iscrizioni
 * @param {EventoDashboard[]} eventiRecenti Già ordinati dal più recente al meno recente.
 * @param {number} [massimoErroriRecenti] Default 20.
 * @return {{
 *   totaleIscrizioni: number,
 *   conteggiPerStato: Object<string, number>,
 *   eventiInErroreRecenti: EventoDashboard[],
 *   generatoIl: Date
 * }}
 */
function calcolaDashboardStato(iscrizioni, eventiRecenti, massimoErroriRecenti) {
  var conteggiPerStato = {};
  Object.keys(STATI_ISCRIZIONE).forEach(function (chiave) {
    conteggiPerStato[STATI_ISCRIZIONE[chiave]] = 0;
  });
  conteggiPerStato.SCONOSCIUTO = 0;

  (iscrizioni || []).forEach(function (iscrizione) {
    var stato = iscrizione.statoIscrizione;
    var chiaveConteggio = Object.prototype.hasOwnProperty.call(conteggiPerStato, stato) ? stato : 'SCONOSCIUTO';
    conteggiPerStato[chiaveConteggio]++;
  });

  var eventiInErroreRecenti = (eventiRecenti || [])
    .filter(function (evento) { return evento.esito === 'ERRORE'; })
    .slice(0, massimoErroriRecenti || 20);

  return {
    totaleIscrizioni: (iscrizioni || []).length,
    conteggiPerStato: conteggiPerStato,
    eventiInErroreRecenti: eventiInErroreRecenti,
    generatoIl: new Date()
  };
}
