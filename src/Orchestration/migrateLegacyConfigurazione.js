/**
 * Orchestration/migrateLegacyConfigurazione.js
 * -----------------------------------------------------------------------
 * Migrazione UNA TANTUM: legge il vecchio tab tariffe ("Tabella Costi e
 * Istruzioni Fog"), che il codice storico leggeva per indice di riga fisso
 * (fragile: bastava inserire una riga per rompere tutto), e popola il nuovo
 * tab "Configurazione" con una vera mappa CHIAVE/VALORE/DESCRIZIONE.
 *
 * Dopo questa migrazione, Domain/Prezzi.js e tutta l'orchestrazione leggono
 * SOLO dal nuovo tab "Configurazione" per chiave: nessun indice fisso.
 * Il vecchio tab resta come riferimento storico ma non è più letto dal codice.
 *
 * ATTENZIONE: gli indici di riga qui sotto sono un'istantanea del layout
 * storico del tab tariffe, usati solo per questa migrazione una tantum.
 * Se il layout storico differisce, correggere gli indici prima di lanciare
 * la migrazione (o compilare direttamente il tab "Configurazione" a mano).
 */

/**
 * Esegue la migrazione. Se il tab "Configurazione" contiene già righe, non
 * sovrascrive nulla a meno che `sovrascrivi` sia esplicitamente true.
 * @param {boolean} [sovrascrivi=false]
 * @return {{eseguita: boolean, motivo: (string|null)}}
 */
function migraConfigurazioneLegacy(sovrascrivi) {
  var ss = getSpreadsheetAttivo();
  var sheetLegacy = trovaFoglioTollerante_(ss, FOGLI.CONFIGURAZIONE_LEGACY);
  if (!sheetLegacy) {
    return { eseguita: false, motivo: 'Tab legacy "' + FOGLI.CONFIGURAZIONE_LEGACY + '" non trovato. Nomi tab presenti: ' + ss.getSheets().map(function (s) { return s.getName(); }).join(', ') };
  }

  var sheetNuovo = getOCreaFoglio(FOGLI.CONFIGURAZIONE);
  if (sheetNuovo.getLastRow() > 0 && !sovrascrivi) {
    return { eseguita: false, motivo: 'Il tab "Configurazione" contiene già dei dati: passare sovrascrivi=true per rigenerarlo.' };
  }

  var tariffe = sheetLegacy.getDataRange().getValues();
  var leggi = function (riga, colonna) { return tariffe[riga] ? tariffe[riga][colonna] : ''; };
  var dateCunLegacy = trovaDateCunLegacy_(tariffe);

  var righe = [
    [CHIAVI_CONFIGURAZIONE.TARIFFA_GIORNO_COMPLETO, leggi(1, 1), 'Tariffa giorno completo, fascia generale'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_NOTTE, leggi(2, 1), 'Tariffa singola notte, fascia generale'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_COLAZIONE, leggi(3, 1), 'Tariffa singola colazione, fascia generale'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_PASTO_PRINCIPALE, leggi(4, 1), 'Tariffa pasto principale (pranzo/cena), fascia generale'],
    [CHIAVI_CONFIGURAZIONE.SOLO_PRANZO_CUN, leggi(5, 1), 'Tariffa per chi partecipa solo al pranzo del CUN'],

    [CHIAVI_CONFIGURAZIONE.TARIFFA_GIORNO_COMPLETO_UNINORD, leggi(8, 1), 'Tariffa giorno completo, fascia Uninord'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_NOTTE_UNINORD, leggi(9, 1), 'Tariffa singola notte, fascia Uninord'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_COLAZIONE_UNINORD, leggi(10, 1), 'Tariffa singola colazione, fascia Uninord'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_PASTO_PRINCIPALE_UNINORD, leggi(11, 1), 'Tariffa pasto principale, fascia Uninord'],
    [CHIAVI_CONFIGURAZIONE.SOLO_PRANZO_CUN_UNINORD, leggi(12, 1), 'Tariffa solo pranzo CUN, fascia Uninord'],
    [CHIAVI_CONFIGURAZIONE.TETTO_MASSIMO_UNINORD, leggi(13, 1), 'Tetto massimo di spesa, fascia Uninord'],

    [CHIAVI_CONFIGURAZIONE.TARIFFA_GIORNO_COMPLETO_UNISUD, leggi(16, 1), 'Tariffa giorno completo, fascia Unisud'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_NOTTE_UNISUD, leggi(17, 1), 'Tariffa singola notte, fascia Unisud'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_COLAZIONE_UNISUD, leggi(18, 1), 'Tariffa singola colazione, fascia Unisud'],
    [CHIAVI_CONFIGURAZIONE.TARIFFA_PASTO_PRINCIPALE_UNISUD, leggi(19, 1), 'Tariffa pasto principale, fascia Unisud'],
    [CHIAVI_CONFIGURAZIONE.SOLO_PRANZO_CUN_UNISUD, leggi(20, 1), 'Tariffa solo pranzo CUN, fascia Unisud'],
    [CHIAVI_CONFIGURAZIONE.TETTO_MASSIMO_UNISUD, leggi(21, 1), 'Tetto massimo di spesa, fascia Unisud'],

    [CHIAVI_CONFIGURAZIONE.SCONTO_0_5, leggi(24, 1), 'Percentuale sconto età 0-5 anni'],
    [CHIAVI_CONFIGURAZIONE.SCONTO_6_8, leggi(25, 1), 'Percentuale sconto età 6-8 anni'],
    [CHIAVI_CONFIGURAZIONE.SCONTO_9_11, leggi(26, 1), 'Percentuale sconto età 9-11 anni'],
    [CHIAVI_CONFIGURAZIONE.SCONTO_12_14, leggi(27, 1), 'Percentuale sconto età 12-14 anni'],

    [CHIAVI_CONFIGURAZIONE.ETA_GIOVANE, leggi(1, 4), "Età fino alla quale si è considerati 'giovane'"],
    [CHIAVI_CONFIGURAZIONE.DATA_INIZIO_CUN, dateCunLegacy.dataInizio, 'Data di inizio del CUN'],
    [CHIAVI_CONFIGURAZIONE.DATA_FINE_CUN, dateCunLegacy.dataFine, 'Data di fine del CUN'],
    [CHIAVI_CONFIGURAZIONE.MODALITA_TEST_NO_INVIO_EMAIL, false, 'Se TRUE, le email non vengono inviate realmente (solo log)']
  ];

  sheetNuovo.clearContents();
  sheetNuovo.appendRow([COLONNE_CONFIGURAZIONE.CHIAVE, COLONNE_CONFIGURAZIONE.VALORE, COLONNE_CONFIGURAZIONE.DESCRIZIONE]);
  sheetNuovo.getRange(1, 1, 1, 3).setBackground('#d9ead3').setFontWeight('bold');
  sheetNuovo.setFrozenRows(1);
  sheetNuovo.getRange(2, 1, righe.length, 3).setValues(righe);
  for (var col = 1; col <= 3; col++) sheetNuovo.autoResizeColumn(col);

  return { eseguita: true, motivo: null };
}

/**
 * Cerca un tab per nome tollerando differenze di spazi multipli/maiuscole
 * (es. "Tabella Costi  e Istruzioni Foglio" vs "Tabella Costi e Istruzioni Foglio").
 * Evita che un piccolo refuso nel nome del tab rompa silenziosamente la migrazione.
 * @private
 * @param {Spreadsheet} ss
 * @param {string} nomeAtteso
 * @return {Sheet|null}
 */
function trovaFoglioTollerante_(ss, nomeAtteso) {
  var esatto = ss.getSheetByName(nomeAtteso);
  if (esatto) return esatto;
  var normalizza = function (s) { return (s + '').toLowerCase().trim().replace(/\s+/g, ' '); };
  var atteso = normalizza(nomeAtteso);
  var fogli = ss.getSheets();
  for (var i = 0; i < fogli.length; i++) {
    if (normalizza(fogli[i].getName()) === atteso) return fogli[i];
  }
  return null;
}

/**
 * Cerca nel tab tariffe legacy le celle con testo "data inizio cun"/"data fine cun"
 * e restituisce le date corrispondenti (stessa euristica dello storico `trovaDateCUN`).
 * @private
 * @param {Array<Array<*>>} tariffe
 * @return {{dataInizio: (Date|null), dataFine: (Date|null)}}
 */
function trovaDateCunLegacy_(tariffe) {
  var dataInizio = null, dataFine = null;
  for (var i = 0; i < tariffe.length; i++) {
    for (var j = 0; j < tariffe[i].length; j++) {
      var cella = (tariffe[i][j] + '').toLowerCase().trim();
      if (cella === 'data inizio cun') dataInizio = new Date(tariffe[i][j + 1]);
      if (cella === 'data fine cun') dataFine = new Date(tariffe[i][j + 1]);
    }
  }
  return { dataInizio: dataInizio, dataFine: dataFine };
}
