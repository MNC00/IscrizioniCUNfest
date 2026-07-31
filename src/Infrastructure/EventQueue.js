/**
 * Infrastructure/EventQueue.js
 * -----------------------------------------------------------------------
 * Coda + log eventi basata sul tab "Eventi". Ogni azione rilevante del
 * sistema (submit form, ricalcolo prezzo, invio email, pagamento...) passa
 * da qui: questo dà tracciabilità completa (chi ha fatto cosa e quando) e
 * disaccoppia i trigger (che devono essere veloci) dall'elaborazione vera
 * e propria, che può essere ritentata dal time-driver in caso di errore.
 */

/** @return {string} un nuovo ID_EVENTO univoco. */
function generaIdEvento() {
  return 'EVT-' + Utilities.getUuid().split('-')[0].toUpperCase();
}

/** @return {Sheet} il tab Eventi, creandolo con le intestazioni corrette se non esiste. */
function getOCreaFoglioEventi() {
  var sheet = getOCreaFoglio(FOGLI.EVENTI);
  if (sheet.getLastRow() === 0) {
    var intestazioni = [
      COLONNE_EVENTI.ID_EVENTO, COLONNE_EVENTI.TIMESTAMP, COLONNE_EVENTI.ID_ISCRIZIONE,
      COLONNE_EVENTI.TIPO_EVENTO, COLONNE_EVENTI.DATI_JSON, COLONNE_EVENTI.STATO,
      COLONNE_EVENTI.ESITO, COLONNE_EVENTI.ERRORI
    ];
    sheet.appendRow(intestazioni);
    sheet.getRange(1, 1, 1, intestazioni.length).setBackground('#d9ead3').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Accoda un nuovo evento da processare (STATO=PENDING).
 * @param {string} idIscrizione
 * @param {string} tipoEvento Uno dei valori di EVENTI_ISCRIZIONE, o un tipo custom (es. 'COMUNICAZIONE_MASSIVA').
 * @param {Object} [dati] Payload aggiuntivo, verrà serializzato in JSON.
 * @return {string} l'ID_EVENTO generato.
 */
function accodaEvento(idIscrizione, tipoEvento, dati) {
  var sheet = getOCreaFoglioEventi();
  var idEvento = generaIdEvento();
  sheet.appendRow([idEvento, new Date(), idIscrizione || '', tipoEvento, JSON.stringify(dati || {}), STATO_EVENTO.PENDING, '', '']);
  return idEvento;
}

/**
 * Registra un evento già concluso (uso tipico: log immediato di un invio email), senza passare da PENDING.
 * @param {string} idIscrizione
 * @param {string} tipoEvento
 * @param {Object} dati
 * @param {string} esito 'OK' oppure 'ERRORE'.
 * @param {string} [errori]
 * @return {string} l'ID_EVENTO generato.
 */
function registraEventoImmediato(idIscrizione, tipoEvento, dati, esito, errori) {
  var sheet = getOCreaFoglioEventi();
  var idEvento = generaIdEvento();
  var stato = esito === 'OK' ? STATO_EVENTO.COMPLETATO : STATO_EVENTO.ERRORE;
  sheet.appendRow([idEvento, new Date(), idIscrizione || '', tipoEvento, JSON.stringify(dati || {}), stato, esito, errori || '']);
  return idEvento;
}

/**
 * Legge gli eventi ancora da processare (PENDING) o falliti da ritentare (ERRORE), in ordine di arrivo.
 * @param {number} [limite] Numero massimo di eventi da restituire (default 50).
 * @return {Array<{numeroRiga: number, idEvento: string, idIscrizione: string, tipoEvento: string, dati: Object}>}
 */
function prendiEventiDaProcessare(limite) {
  var sheet = getOCreaFoglioEventi();
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var idxStato = trovaColonna([COLONNE_EVENTI.STATO], indiceIntestazioni);
  var ultimaRiga = sheet.getLastRow();
  var massimo = limite || 50;
  var risultato = [];

  if (ultimaRiga < 2) return risultato;
  var tutteRighe = sheet.getRange(2, 1, ultimaRiga - 1, sheet.getLastColumn()).getValues();

  for (var i = 0; i < tutteRighe.length && risultato.length < massimo; i++) {
    var riga = tutteRighe[i];
    var stato = riga[idxStato];
    if (stato === STATO_EVENTO.PENDING || stato === STATO_EVENTO.ERRORE) {
      var dati = {};
      try { dati = JSON.parse(riga[trovaColonna([COLONNE_EVENTI.DATI_JSON], indiceIntestazioni)] || '{}'); } catch (e) { dati = {}; }
      risultato.push({
        numeroRiga: i + 2,
        idEvento: riga[trovaColonna([COLONNE_EVENTI.ID_EVENTO], indiceIntestazioni)],
        idIscrizione: riga[trovaColonna([COLONNE_EVENTI.ID_ISCRIZIONE], indiceIntestazioni)],
        tipoEvento: riga[trovaColonna([COLONNE_EVENTI.TIPO_EVENTO], indiceIntestazioni)],
        dati: dati
      });
    }
  }
  return risultato;
}

/**
 * Marca un evento come completato con successo.
 * @param {number} numeroRiga Riga 1-based nel tab Eventi (vedi prendiEventiDaProcessare).
 * @param {string} [esito]
 */
function marcaEventoCompletato(numeroRiga, esito) {
  var sheet = getOCreaFoglioEventi();
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  sheet.getRange(numeroRiga, trovaColonna([COLONNE_EVENTI.STATO], indiceIntestazioni) + 1).setValue(STATO_EVENTO.COMPLETATO);
  sheet.getRange(numeroRiga, trovaColonna([COLONNE_EVENTI.ESITO], indiceIntestazioni) + 1).setValue(esito || 'OK');
}

/**
 * Marca un evento come fallito, salvando il messaggio di errore per la diagnosi.
 * @param {number} numeroRiga
 * @param {string} messaggioErrore
 */
function marcaEventoInErrore(numeroRiga, messaggioErrore) {
  var sheet = getOCreaFoglioEventi();
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  sheet.getRange(numeroRiga, trovaColonna([COLONNE_EVENTI.STATO], indiceIntestazioni) + 1).setValue(STATO_EVENTO.ERRORE);
  sheet.getRange(numeroRiga, trovaColonna([COLONNE_EVENTI.ESITO], indiceIntestazioni) + 1).setValue('ERRORE');
  sheet.getRange(numeroRiga, trovaColonna([COLONNE_EVENTI.ERRORI], indiceIntestazioni) + 1).setValue(messaggioErrore);
}
