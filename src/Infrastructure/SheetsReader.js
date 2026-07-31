/**
 * Infrastructure/SheetsReader.js
 * -----------------------------------------------------------------------
 * Unico punto di lettura da Google Sheets. Espone un'interfaccia stabile
 * (per nome colonna, mai per indice fisso) usata da Orchestration.
 * Nessuna funzione qui contiene logica di business: solo estrazione dati.
 */

/** @return {Spreadsheet} lo spreadsheet attivo. */
function getSpreadsheetAttivo() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Recupera un foglio per nome, lanciando un errore chiaro se non esiste.
 * @param {string} nomeFoglio
 * @return {Sheet}
 */
function getFoglioObbligatorio(nomeFoglio) {
  var sheet = getSpreadsheetAttivo().getSheetByName(nomeFoglio);
  if (!sheet) {
    throw new Error('Foglio non trovato: "' + nomeFoglio + '". Verificare che il tab esista con questo nome esatto.');
  }
  return sheet;
}

/**
 * Recupera un foglio per nome, creandolo se non esiste (usato per viste derivate).
 * @param {string} nomeFoglio
 * @return {Sheet}
 */
function getOCreaFoglio(nomeFoglio) {
  var ss = getSpreadsheetAttivo();
  return ss.getSheetByName(nomeFoglio) || ss.insertSheet(nomeFoglio);
}

/** Normalizza una stringa per confronti robusti (minuscolo, senza accenti, spazi puliti). */
function normalizzaTesto(valore) {
  if (valore == null) return '';
  return valore.toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Costruisce una mappa {intestazioneNormalizzata -> indice0based} leggendo la riga 1.
 * @param {Sheet} sheet
 * @return {Object<string, number>}
 */
function costruisciIndiceIntestazioni(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var mappa = {};
  header.forEach(function (nome, idx) { mappa[normalizzaTesto(nome)] = idx; });
  return mappa;
}

/**
 * Cerca l'indice (0-based) di una colonna tra vari alias possibili.
 * @param {string[]} alias
 * @param {Object<string, number>} indiceIntestazioni
 * @return {number} indice 0-based, o -1 se non trovata.
 */
function trovaColonna(alias, indiceIntestazioni) {
  for (var i = 0; i < alias.length; i++) {
    var chiave = normalizzaTesto(alias[i]);
    if (Object.prototype.hasOwnProperty.call(indiceIntestazioni, chiave)) return indiceIntestazioni[chiave];
  }
  return -1;
}

/**
 * Se l'intestazione non esiste ancora, crea una nuova colonna in coda con quel titolo.
 * Aggiorna anche la mappa passata. Ritorna sempre l'indice 0-based della colonna.
 * @param {Sheet} sheet
 * @param {Object<string, number>} indiceIntestazioni
 * @param {string} titolo
 * @return {number}
 */
function assicuraColonna(sheet, indiceIntestazioni, titolo) {
  var chiave = normalizzaTesto(titolo);
  if (Object.prototype.hasOwnProperty.call(indiceIntestazioni, chiave)) return indiceIntestazioni[chiave];
  var lastCol = sheet.getLastColumn();
  sheet.insertColumnAfter(lastCol);
  sheet.getRange(1, lastCol + 1).setValue(titolo);
  indiceIntestazioni[chiave] = lastCol; // nuovo indice 0-based == vecchio lastCol (1-based)
  return indiceIntestazioni[chiave];
}

/** Converte in modo robusto un valore di cella (stringa, numero seriale, Date) in Date valida o null. */
function toDataSicura(valore) {
  if (valore instanceof Date && !isNaN(valore)) return valore;
  if (typeof valore === 'number') return new Date(Math.round((valore - 25569) * 86400 * 1000));
  if (typeof valore === 'string') {
    var m = valore.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      var d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
      if (!isNaN(d)) return d;
    }
    var d2 = new Date(valore);
    if (!isNaN(d2)) return d2;
  }
  return null;
}

/**
 * Legge una riga del tab Iscrizioni e la trasforma in un oggetto di dominio.
 * @param {Sheet} sheetIscrizioni
 * @param {Object<string, number>} indiceIntestazioni
 * @param {number} numeroRiga Riga 1-based del foglio (2 = prima riga dati).
 * @return {Object} iscrizione con campi normalizzati, oltre a `_riga` e ai valori grezzi in `_valoriGrezzi`.
 */
function leggiIscrizioneDaRiga(sheetIscrizioni, indiceIntestazioni, numeroRiga) {
  var valori = sheetIscrizioni.getRange(numeroRiga, 1, 1, sheetIscrizioni.getLastColumn()).getValues()[0];
  var get = function (nomeColonna) {
    var idx = trovaColonna([nomeColonna], indiceIntestazioni);
    return idx >= 0 ? valori[idx] : '';
  };

  return {
    _riga: numeroRiga,
    _valoriGrezzi: valori,
    idIscrizione: get(COLONNE_ISCRIZIONI.ID_ISCRIZIONE),
    statoIscrizione: get(COLONNE_ISCRIZIONI.STATO_ISCRIZIONE),
    nome: get(COLONNE_ISCRIZIONI.NOME),
    cognome: get(COLONNE_ISCRIZIONI.COGNOME),
    email: get(COLONNE_ISCRIZIONI.EMAIL),
    zona: get(COLONNE_ISCRIZIONI.ZONA),
    dataNascita: toDataSicura(get(COLONNE_ISCRIZIONI.DATA_NASCITA)),
    dataArrivo: toDataSicura(get(COLONNE_ISCRIZIONI.DATA_ARRIVO)),
    pastoArrivo: get(COLONNE_ISCRIZIONI.PASTO_ARRIVO),
    dataPartenza: toDataSicura(get(COLONNE_ISCRIZIONI.DATA_PARTENZA)),
    pastoPartenza: get(COLONNE_ISCRIZIONI.PASTO_PARTENZA),
    soloPranzoCun: normalizzaTesto(get(COLONNE_ISCRIZIONI.SOLO_PRANZO_CUN)) === 'si',
    parliamoLunedi: get(COLONNE_ISCRIZIONI.PARLIAMO_LUNEDI),
    prezzo: get(COLONNE_ISCRIZIONI.PREZZO)
  };
}

/**
 * Legge tutte le iscrizioni presenti nel tab principale.
 * @param {Sheet} [sheetIscrizioni] Default: tab FOGLI.ISCRIZIONI.
 * @return {Object[]}
 */
function leggiTutteIscrizioni(sheetIscrizioni) {
  var sheet = sheetIscrizioni || getFoglioObbligatorio(FOGLI.ISCRIZIONI);
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var ultimaRiga = sheet.getLastRow();
  var risultato = [];
  for (var riga = 2; riga <= ultimaRiga; riga++) {
    risultato.push(leggiIscrizioneDaRiga(sheet, indiceIntestazioni, riga));
  }
  return risultato;
}

/**
 * Trova il numero di riga (1-based) di un'iscrizione dato il suo ID_ISCRIZIONE.
 * @param {Sheet} sheetIscrizioni
 * @param {Object<string, number>} indiceIntestazioni
 * @param {string} idIscrizione
 * @return {number} numero di riga, o -1 se non trovata.
 */
function trovaRigaPerIdIscrizione(sheetIscrizioni, indiceIntestazioni, idIscrizione) {
  var idxId = trovaColonna([COLONNE_ISCRIZIONI.ID_ISCRIZIONE], indiceIntestazioni);
  if (idxId < 0) return -1;
  var ultimaRiga = sheetIscrizioni.getLastRow();
  if (ultimaRiga < 2) return -1;
  var colonnaId = sheetIscrizioni.getRange(2, idxId + 1, ultimaRiga - 1, 1).getValues();
  for (var i = 0; i < colonnaId.length; i++) {
    if (colonnaId[i][0] === idIscrizione) return i + 2;
  }
  return -1;
}

/**
 * Legge il tab "Configurazione" (CHIAVE/VALORE/DESCRIZIONE) come mappa chiave->valore grezzo.
 * @param {Sheet} [sheetConfigurazione] Default: tab FOGLI.CONFIGURAZIONE.
 * @return {Object<string, *>}
 */
function leggiMappaConfigurazione(sheetConfigurazione) {
  var sheet = sheetConfigurazione || getFoglioObbligatorio(FOGLI.CONFIGURAZIONE);
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var idxChiave = trovaColonna([COLONNE_CONFIGURAZIONE.CHIAVE], indiceIntestazioni);
  var idxValore = trovaColonna([COLONNE_CONFIGURAZIONE.VALORE], indiceIntestazioni);
  if (idxChiave < 0 || idxValore < 0) {
    throw new Error('Il tab "' + sheet.getName() + '" deve avere le colonne CHIAVE e VALORE.');
  }
  var ultimaRiga = sheet.getLastRow();
  var mappa = {};
  for (var riga = 2; riga <= ultimaRiga; riga++) {
    var valori = sheet.getRange(riga, 1, 1, sheet.getLastColumn()).getValues()[0];
    var chiave = (valori[idxChiave] || '').toString().trim().toUpperCase();
    if (chiave) mappa[chiave] = valori[idxValore];
  }
  return mappa;
}

/**
 * Converte la mappa grezza di Configurazione nell'oggetto tipizzato atteso da Domain/Prezzi#calcolaPrezzo.
 * @param {Object<string, *>} mappa Vedi leggiMappaConfigurazione.
 * @return {Object}
 */
function leggiConfigurazioneCalcoloPrezzi(mappa) {
  var numero = function (chiave) {
    var v = mappa[chiave];
    return (v === '' || v == null) ? null : Number(v);
  };
  return {
    dataInizioCun: toDataSicura(mappa[CHIAVI_CONFIGURAZIONE.DATA_INIZIO_CUN]),
    dataFineCun: toDataSicura(mappa[CHIAVI_CONFIGURAZIONE.DATA_FINE_CUN]),
    etaGiovane: numero(CHIAVI_CONFIGURAZIONE.ETA_GIOVANE),
    soloPranzoCun: numero(CHIAVI_CONFIGURAZIONE.SOLO_PRANZO_CUN),
    generale: {
      giornoCompleto: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_GIORNO_COMPLETO),
      notte: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_NOTTE),
      colazione: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_COLAZIONE),
      pastoPrincipale: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_PASTO_PRINCIPALE)
    },
    uninord: {
      giornoCompleto: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_GIORNO_COMPLETO_UNINORD),
      notte: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_NOTTE_UNINORD),
      colazione: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_COLAZIONE_UNINORD),
      pastoPrincipale: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_PASTO_PRINCIPALE_UNINORD),
      soloPranzoCun: numero(CHIAVI_CONFIGURAZIONE.SOLO_PRANZO_CUN_UNINORD),
      tettoMassimo: numero(CHIAVI_CONFIGURAZIONE.TETTO_MASSIMO_UNINORD)
    },
    unisud: {
      giornoCompleto: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_GIORNO_COMPLETO_UNISUD),
      notte: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_NOTTE_UNISUD),
      colazione: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_COLAZIONE_UNISUD),
      pastoPrincipale: numero(CHIAVI_CONFIGURAZIONE.TARIFFA_PASTO_PRINCIPALE_UNISUD),
      soloPranzoCun: numero(CHIAVI_CONFIGURAZIONE.SOLO_PRANZO_CUN_UNISUD),
      tettoMassimo: numero(CHIAVI_CONFIGURAZIONE.TETTO_MASSIMO_UNISUD)
    },
    sconto0_5: numero(CHIAVI_CONFIGURAZIONE.SCONTO_0_5),
    sconto6_8: numero(CHIAVI_CONFIGURAZIONE.SCONTO_6_8),
    sconto9_11: numero(CHIAVI_CONFIGURAZIONE.SCONTO_9_11),
    sconto12_14: numero(CHIAVI_CONFIGURAZIONE.SCONTO_12_14),
    modalitaTestNoInvioEmail: normalizzaTesto(mappa[CHIAVI_CONFIGURAZIONE.MODALITA_TEST_NO_INVIO_EMAIL]) === 'true'
  };
}

/**
 * Legge le righe del tab "Comunicazioni" che sono pronte per l'invio (STATO = DA_INVIARE).
 * @return {Object[]} righe con {_riga, idComm, oggetto, testo}
 */
function leggiComunicazioniDaInviare() {
  var sheet = getFoglioObbligatorio(FOGLI.COMUNICAZIONI);
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var idxId = trovaColonna([COLONNE_COMUNICAZIONI.ID_COMM], indiceIntestazioni);
  var idxOggetto = trovaColonna([COLONNE_COMUNICAZIONI.OGGETTO], indiceIntestazioni);
  var idxTesto = trovaColonna([COLONNE_COMUNICAZIONI.TESTO], indiceIntestazioni);
  var idxStato = trovaColonna([COLONNE_COMUNICAZIONI.STATO], indiceIntestazioni);

  var ultimaRiga = sheet.getLastRow();
  var risultato = [];
  for (var riga = 2; riga <= ultimaRiga; riga++) {
    var valori = sheet.getRange(riga, 1, 1, sheet.getLastColumn()).getValues()[0];
    var stato = normalizzaTesto(valori[idxStato]);
    if (stato === '' || stato === normalizzaTesto(STATO_COMUNICAZIONE.DA_INVIARE)) {
      risultato.push({ _riga: riga, idComm: valori[idxId], oggetto: valori[idxOggetto], testo: valori[idxTesto] });
    }
  }
  return risultato;
}
