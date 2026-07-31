/**
 * Infrastructure/SheetsWriter.js
 * -----------------------------------------------------------------------
 * Unico punto di scrittura su Google Sheets. Ogni funzione qui è un side
 * effect esplicito e idempotente quando possibile (rigenerare una vista due
 * volte di fila con gli stessi dati produce lo stesso risultato).
 */

/** @return {string} un nuovo ID_ISCRIZIONE univoco. */
function generaIdIscrizione() {
  return 'ISCR-' + Utilities.getUuid().split('-')[0].toUpperCase();
}

/**
 * Garantisce che la riga indicata abbia un ID_ISCRIZIONE; lo genera e scrive se assente.
 * @param {Sheet} sheetIscrizioni
 * @param {Object<string, number>} indiceIntestazioni
 * @param {number} numeroRiga
 * @return {string} l'ID_ISCRIZIONE (esistente o appena generato).
 */
function assegnaIdIscrizioneSeMancante(sheetIscrizioni, indiceIntestazioni, numeroRiga) {
  var idxId = assicuraColonna(sheetIscrizioni, indiceIntestazioni, COLONNE_ISCRIZIONI.ID_ISCRIZIONE);
  var cella = sheetIscrizioni.getRange(numeroRiga, idxId + 1);
  var idEsistente = cella.getValue();
  if (idEsistente) return idEsistente;
  var nuovoId = generaIdIscrizione();
  cella.setValue(nuovoId);
  return nuovoId;
}

/**
 * Scrive lo STATO_ISCRIZIONE per la riga indicata (crea la colonna se assente).
 * @param {Sheet} sheetIscrizioni
 * @param {Object<string, number>} indiceIntestazioni
 * @param {number} numeroRiga
 * @param {string} stato
 */
function scriviStatoIscrizione(sheetIscrizioni, indiceIntestazioni, numeroRiga, stato) {
  var idx = assicuraColonna(sheetIscrizioni, indiceIntestazioni, COLONNE_ISCRIZIONI.STATO_ISCRIZIONE);
  sheetIscrizioni.getRange(numeroRiga, idx + 1).setValue(stato);
}

/**
 * Scrive il prezzo calcolato per la riga indicata.
 * @param {Sheet} sheetIscrizioni
 * @param {Object<string, number>} indiceIntestazioni
 * @param {number} numeroRiga
 * @param {number} prezzo
 */
function scriviPrezzoIscrizione(sheetIscrizioni, indiceIntestazioni, numeroRiga, prezzo) {
  var idx = trovaColonna([COLONNE_ISCRIZIONI.PREZZO], indiceIntestazioni);
  if (idx < 0) throw new Error('Colonna "Prezzo" non trovata nel tab Iscrizioni.');
  sheetIscrizioni.getRange(numeroRiga, idx + 1).setValue(prezzo);
}

/**
 * Rigenera integralmente il tab "Iscrizioni ordinate" a partire dall'elenco iscrizioni.
 * È una vista derivata di sola lettura per gli operatori: riscriverla ad ogni ciclo è
 * sicuro (idempotente) perché nessuna modifica manuale è prevista su questo tab.
 * @param {Object[]} iscrizioni Da leggiTutteIscrizioni().
 * @param {Sheet} sheetSorgente Tab "Iscrizioni CUN Fest" (per copiare intestazioni/valori originali).
 * @param {Sheet} sheetDestinazione Tab "Iscrizioni ordinate".
 */
function rigeneraFoglioIscrizioniOrdinate(iscrizioni, sheetSorgente, sheetDestinazione) {
  var datiCompleti = sheetSorgente.getDataRange().getValues();
  if (datiCompleti.length === 0) return;

  sheetDestinazione.clearContents();
  sheetDestinazione.getRange(1, 1, datiCompleti.length, datiCompleti[0].length).setValues(datiCompleti);

  if (datiCompleti.length > 1) {
    var indiceIntestazioni = costruisciIndiceIntestazioni(sheetSorgente);
    var idxCognome = trovaColonna([COLONNE_ISCRIZIONI.COGNOME], indiceIntestazioni) + 1;
    var idxNome = trovaColonna([COLONNE_ISCRIZIONI.NOME], indiceIntestazioni) + 1;
    sheetDestinazione.getRange(2, 1, datiCompleti.length - 1, datiCompleti[0].length)
      .sort([{ column: idxCognome, ascending: true }, { column: idxNome, ascending: true }]);
  }

  sheetDestinazione.getRange(1, 1, 1, datiCompleti[0].length).setBackground('#d9ead3').setFontWeight('bold');
  sheetDestinazione.setFrozenRows(1);
  for (var col = 1; col <= datiCompleti[0].length; col++) sheetDestinazione.autoResizeColumn(col);
}

/**
 * Aggiorna il tab "Pagamento", una riga per iscrizione, agganciata per ID_ISCRIZIONE
 * (non più per Nome+Cognome: elimina il rischio di unire per errore due omonimi).
 * Il campo "Pagato" non viene mai sovrascritto se la riga esiste già.
 * @param {Object[]} iscrizioni Da leggiTutteIscrizioni().
 * @param {Sheet} sheetPagamento
 */
function aggiornaFoglioPagamento(iscrizioni, sheetPagamento) {
  var campi = [
    COLONNE_PAGAMENTO.ID_ISCRIZIONE, COLONNE_PAGAMENTO.COGNOME, COLONNE_PAGAMENTO.NOME,
    COLONNE_PAGAMENTO.DATA_NASCITA, COLONNE_PAGAMENTO.ZONA, COLONNE_PAGAMENTO.DATA_ARRIVO,
    COLONNE_PAGAMENTO.PASTO_ARRIVO, COLONNE_PAGAMENTO.DATA_PARTENZA, COLONNE_PAGAMENTO.PASTO_PARTENZA,
    COLONNE_PAGAMENTO.PREZZO
  ];

  if (sheetPagamento.getLastRow() === 0) {
    sheetPagamento.appendRow(campi.concat(COLONNE_PAGAMENTO.PAGATO));
    sheetPagamento.getRange(1, 1, 1, campi.length + 1).setBackground('#d9ead3').setFontWeight('bold');
    sheetPagamento.setFrozenRows(1);
  }

  var indiceIntestazioni = costruisciIndiceIntestazioni(sheetPagamento);
  var idxIdPagamento = assicuraColonna(sheetPagamento, indiceIntestazioni, COLONNE_PAGAMENTO.ID_ISCRIZIONE);
  var idxPagato = assicuraColonna(sheetPagamento, indiceIntestazioni, COLONNE_PAGAMENTO.PAGATO);

  var datiEsistenti = sheetPagamento.getDataRange().getValues();
  // mappa ID_ISCRIZIONE -> numero di riga (1-based) per aggiornamenti O(1) invece di scansione quadratica
  var rigaPerId = {};
  for (var r = 1; r < datiEsistenti.length; r++) {
    var id = datiEsistenti[r][idxIdPagamento];
    if (id) rigaPerId[id] = r + 1;
  }

  iscrizioni.forEach(function (iscrizione) {
    var nuovaRiga = [
      iscrizione.idIscrizione, iscrizione.cognome, iscrizione.nome, iscrizione.dataNascita,
      iscrizione.zona, iscrizione.dataArrivo, iscrizione.pastoArrivo, iscrizione.dataPartenza,
      iscrizione.pastoPartenza, iscrizione.prezzo
    ];

    var numeroRigaEsistente = iscrizione.idIscrizione ? rigaPerId[iscrizione.idIscrizione] : null;
    if (numeroRigaEsistente) {
      sheetPagamento.getRange(numeroRigaEsistente, 1, 1, nuovaRiga.length).setValues([nuovaRiga]);
      // colonna "Pagato" NON toccata: preserva il valore inserito manualmente dall'operatore
    } else {
      nuovaRiga.push('');
      sheetPagamento.appendRow(nuovaRiga);
      rigaPerId[iscrizione.idIscrizione] = sheetPagamento.getLastRow();
    }
  });

  var numRighe = sheetPagamento.getLastRow();
  var numColonne = sheetPagamento.getLastColumn();
  if (numRighe > 1) {
    var idxCognomeOut = trovaColonna([COLONNE_PAGAMENTO.COGNOME], indiceIntestazioni) + 1;
    var idxNomeOut = trovaColonna([COLONNE_PAGAMENTO.NOME], indiceIntestazioni) + 1;
    sheetPagamento.getRange(2, 1, numRighe - 1, numColonne)
      .sort([{ column: idxCognomeOut, ascending: true }, { column: idxNomeOut, ascending: true }]);
  }
  for (var col = 1; col <= numColonne; col++) {
    sheetPagamento.autoResizeColumn(col);
    if (sheetPagamento.getColumnWidth(col) < 100) sheetPagamento.setColumnWidth(col, 100);
  }
}

/**
 * Cerca la riga (1-based) del tab Pagamento corrispondente a un ID_ISCRIZIONE.
 * @param {Sheet} sheetPagamento
 * @param {string} idIscrizione
 * @return {number} -1 se non trovata.
 */
function trovaRigaPagamentoPerId(sheetPagamento, idIscrizione) {
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheetPagamento);
  var idxId = trovaColonna([COLONNE_PAGAMENTO.ID_ISCRIZIONE], indiceIntestazioni);
  if (idxId < 0) return -1;
  var ultimaRiga = sheetPagamento.getLastRow();
  if (ultimaRiga < 2) return -1;
  var colonna = sheetPagamento.getRange(2, idxId + 1, ultimaRiga - 1, 1).getValues();
  for (var i = 0; i < colonna.length; i++) {
    if (colonna[i][0] === idIscrizione) return i + 2;
  }
  return -1;
}

/**
 * Rigenera integralmente il tab "Tabella Pasti" a partire dal risultato di Domain/Pasti#calcolaPastiPerGiorno.
 * @param {{tabellaGiorni: Array, soloPranzoCunTotale: number, elencoLunedi: Array}} risultato
 * @param {Sheet} sheetPasti
 */
function scriviTabellaPasti(risultato, sheetPasti) {
  sheetPasti.clearContents();
  sheetPasti.getRange('A1:E1').setValues([['Data', 'Colazione', 'Pranzo', 'Cena', 'Dormire']])
    .setBackground('#d9ead3').setFontWeight('bold');

  var righe = risultato.tabellaGiorni.map(function (g) {
    return [Utilities.formatDate(g.data, Session.getScriptTimeZone(), 'dd/MM/yyyy'), g.colazione, g.pranzo, g.cena, g.dormire];
  });
  if (righe.length) sheetPasti.getRange(2, 1, righe.length, 5).setValues(righe);

  sheetPasti.getRange('G1:H1').setValues([['Solo Pranzo CUN', 'Totale']]).setBackground('#d9ead3').setFontWeight('bold');
  sheetPasti.getRange('G2:H2').setValues([['Iscrizioni', risultato.soloPranzoCunTotale]]);

  var baseRiga = righe.length + 4;
  sheetPasti.getRange(baseRiga, 1).setValue("Chi c'è lunedì").setFontWeight('bold').setBackground('#d9ead3');
  var elenco = risultato.elencoLunedi.map(function (p) { return [p.cognome, p.nome]; });
  if (elenco.length) sheetPasti.getRange(baseRiga + 1, 1, elenco.length, 2).setValues(elenco);

  for (var c = 1; c <= 8; c++) sheetPasti.autoResizeColumn(c);
}

/**
 * Registra l'esito di una comunicazione di massa nel tab "Comunicazioni".
 * @param {Sheet} sheetComunicazioni
 * @param {number} numeroRiga
 * @param {string} stato Uno di STATO_COMUNICAZIONE.
 * @param {Date} dataInvio
 * @param {string} idOperatore
 */
function registraEsitoComunicazione(sheetComunicazioni, numeroRiga, stato, dataInvio, idOperatore) {
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheetComunicazioni);
  var idxStato = assicuraColonna(sheetComunicazioni, indiceIntestazioni, COLONNE_COMUNICAZIONI.STATO);
  var idxData = assicuraColonna(sheetComunicazioni, indiceIntestazioni, COLONNE_COMUNICAZIONI.DATA_INVIO);
  var idxOperatore = assicuraColonna(sheetComunicazioni, indiceIntestazioni, COLONNE_COMUNICAZIONI.ID_OPERATORE);
  sheetComunicazioni.getRange(numeroRiga, idxStato + 1).setValue(stato);
  sheetComunicazioni.getRange(numeroRiga, idxData + 1).setValue(dataInvio);
  sheetComunicazioni.getRange(numeroRiga, idxOperatore + 1).setValue(idOperatore);
}
