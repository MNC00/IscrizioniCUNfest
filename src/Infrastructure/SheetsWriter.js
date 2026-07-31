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
 * Recupera (creandolo se necessario) il tab "Iscrizioni (operativo)": lo strato intermedio,
 * a schema fisso e gestito interamente dallo script, tra le risposte grezze del Google Form
 * (tab "Iscrizioni CUN Fest") e le viste derivate. Le colonne qui non dipendono in alcun modo
 * dall'ordine/nomi delle domande del Form: se il Form cambia struttura, solo l'importazione
 * (Orchestration/importaIscrizioni.js) deve adattarsi, non tutta l'elaborazione a valle.
 * @return {Sheet}
 */
function getOCreaFoglioOperativo() {
  var sheet = getOCreaFoglio(FOGLI.ISCRIZIONI_OPERATIVO);
  if (sheet.getLastRow() === 0) {
    var intestazioni = [
      COLONNE_ISCRIZIONI.ID_ISCRIZIONE, COLONNE_ISCRIZIONI.STATO_ISCRIZIONE,
      COLONNE_ISCRIZIONI.NOME, COLONNE_ISCRIZIONI.COGNOME, COLONNE_ISCRIZIONI.EMAIL,
      COLONNE_ISCRIZIONI.DATA_NASCITA, COLONNE_ISCRIZIONI.ZONA,
      COLONNE_ISCRIZIONI.DATA_ARRIVO, COLONNE_ISCRIZIONI.PASTO_ARRIVO,
      COLONNE_ISCRIZIONI.DATA_PARTENZA, COLONNE_ISCRIZIONI.PASTO_PARTENZA,
      COLONNE_ISCRIZIONI.SOLO_PRANZO_CUN, COLONNE_ISCRIZIONI.PARLIAMO_LUNEDI,
      COLONNE_ISCRIZIONI.PREZZO
    ];
    sheet.appendRow(intestazioni);
    sheet.getRange(1, 1, 1, intestazioni.length).setBackground('#d9ead3').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Scrive (creando la riga se assente) un'iscrizione completa nel tab operativo, per nome di
 * colonna: usata dall'importazione per allineare i dati "anagrafici" letti dal Form, lasciando
 * intatti STATO_ISCRIZIONE/PREZZO se già presenti (proprietà esclusiva del layer operativo).
 * @param {Sheet} sheetOperativo
 * @param {Object<string, number>} indiceIntestazioni Mappa intestazioni del tab operativo (verrà aggiornata se si creano colonne).
 * @param {number} numeroRiga Riga 1-based esistente, oppure -1 per aggiungerne una nuova in coda.
 * @param {Object} iscrizione Campi come restituiti da Domain/Import#fondiIscrizioneDaForm.
 * @return {number} numero di riga (1-based) su cui è stata scritta l'iscrizione.
 */
function scriviIscrizioneOperativa(sheetOperativo, indiceIntestazioni, numeroRiga, iscrizione) {
  var riga = numeroRiga > 0 ? numeroRiga : sheetOperativo.getLastRow() + 1;
  var coppieColonnaValore = [
    [COLONNE_ISCRIZIONI.ID_ISCRIZIONE, iscrizione.idIscrizione],
    [COLONNE_ISCRIZIONI.STATO_ISCRIZIONE, iscrizione.statoIscrizione],
    [COLONNE_ISCRIZIONI.NOME, iscrizione.nome],
    [COLONNE_ISCRIZIONI.COGNOME, iscrizione.cognome],
    [COLONNE_ISCRIZIONI.EMAIL, iscrizione.email],
    [COLONNE_ISCRIZIONI.DATA_NASCITA, iscrizione.dataNascita],
    [COLONNE_ISCRIZIONI.ZONA, iscrizione.zona],
    [COLONNE_ISCRIZIONI.DATA_ARRIVO, iscrizione.dataArrivo],
    [COLONNE_ISCRIZIONI.PASTO_ARRIVO, iscrizione.pastoArrivo],
    [COLONNE_ISCRIZIONI.DATA_PARTENZA, iscrizione.dataPartenza],
    [COLONNE_ISCRIZIONI.PASTO_PARTENZA, iscrizione.pastoPartenza],
    [COLONNE_ISCRIZIONI.SOLO_PRANZO_CUN, iscrizione.soloPranzoCun ? 'Si' : 'No'],
    [COLONNE_ISCRIZIONI.PARLIAMO_LUNEDI, iscrizione.parliamoLunedi],
    [COLONNE_ISCRIZIONI.PREZZO, iscrizione.prezzo]
  ];
  // Una sola chiamata setValues per riga (non una per colonna): con centinaia di iscrizioni la
  // differenza è sostanziale, ed è quello che rende accettabile la latenza del trigger di submit.
  var indiciColonna = coppieColonnaValore.map(function (coppia) {
    return assicuraColonna(sheetOperativo, indiceIntestazioni, coppia[0]);
  });
  var ultimaColonna = Math.max(sheetOperativo.getLastColumn(), Math.max.apply(null, indiciColonna) + 1);
  var valoriRigaAttuali = riga <= sheetOperativo.getLastRow()
    ? sheetOperativo.getRange(riga, 1, 1, ultimaColonna).getValues()[0]
    : new Array(ultimaColonna).fill('');
  coppieColonnaValore.forEach(function (coppia, i) {
    var valore = coppia[1];
    valoriRigaAttuali[indiciColonna[i]] = valore == null ? '' : valore;
  });
  sheetOperativo.getRange(riga, 1, 1, ultimaColonna).setValues([valoriRigaAttuali]);
  return riga;
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
 *
 * NOTA IMPORTANTE: i valori vengono sempre scritti cercando la colonna per NOME
 * (mai per posizione fissa), perché l'intestazione di questo tab può provenire da
 * un foglio "Pagamento" legacy preesistente, in cui ID_ISCRIZIONE è stato aggiunto
 * in coda dalla migrazione anziché in prima posizione: scrivere per indice fisso
 * (come in una versione precedente di questa funzione) causava un disallineamento
 * silenzioso di TUTTE le colonne rispetto all'intestazione reale del foglio.
 *
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
  // Risolve l'indice reale di ciascuna colonna cercandola per nome (creandola se assente),
  // così l'ordine effettivo dell'intestazione del foglio non ha importanza.
  var idxPerCampo = {};
  campi.concat([COLONNE_PAGAMENTO.PAGATO]).forEach(function (nomeCampo) {
    idxPerCampo[nomeCampo] = assicuraColonna(sheetPagamento, indiceIntestazioni, nomeCampo);
  });
  var idxIdPagamento = idxPerCampo[COLONNE_PAGAMENTO.ID_ISCRIZIONE];
  var numeroColonneTotali = sheetPagamento.getLastColumn();

  var datiEsistenti = sheetPagamento.getDataRange().getValues();
  // mappa ID_ISCRIZIONE -> numero di riga (1-based) per aggiornamenti O(1) invece di scansione quadratica
  var rigaPerId = {};
  for (var r = 1; r < datiEsistenti.length; r++) {
    var id = datiEsistenti[r][idxIdPagamento];
    if (id) rigaPerId[id] = r + 1;
  }

  iscrizioni.forEach(function (iscrizione) {
    var valorePerCampo = {};
    valorePerCampo[COLONNE_PAGAMENTO.ID_ISCRIZIONE] = iscrizione.idIscrizione;
    valorePerCampo[COLONNE_PAGAMENTO.COGNOME] = iscrizione.cognome;
    valorePerCampo[COLONNE_PAGAMENTO.NOME] = iscrizione.nome;
    valorePerCampo[COLONNE_PAGAMENTO.DATA_NASCITA] = iscrizione.dataNascita;
    valorePerCampo[COLONNE_PAGAMENTO.ZONA] = iscrizione.zona;
    valorePerCampo[COLONNE_PAGAMENTO.DATA_ARRIVO] = iscrizione.dataArrivo;
    valorePerCampo[COLONNE_PAGAMENTO.PASTO_ARRIVO] = iscrizione.pastoArrivo;
    valorePerCampo[COLONNE_PAGAMENTO.DATA_PARTENZA] = iscrizione.dataPartenza;
    valorePerCampo[COLONNE_PAGAMENTO.PASTO_PARTENZA] = iscrizione.pastoPartenza;
    valorePerCampo[COLONNE_PAGAMENTO.PREZZO] = iscrizione.prezzo;

    var numeroRigaEsistente = iscrizione.idIscrizione ? rigaPerId[iscrizione.idIscrizione] : null;
    if (numeroRigaEsistente) {
      // Riparte dai valori attuali della riga (preserva "Pagato" e qualunque altra colonna
      // extra) e sovrascrive solo le colonne note, ciascuna al proprio indice reale.
      var rigaAggiornata = datiEsistenti[numeroRigaEsistente - 1].slice();
      campi.forEach(function (nomeCampo) { rigaAggiornata[idxPerCampo[nomeCampo]] = valorePerCampo[nomeCampo]; });
      sheetPagamento.getRange(numeroRigaEsistente, 1, 1, rigaAggiornata.length).setValues([rigaAggiornata]);
    } else {
      var nuovaRiga = new Array(numeroColonneTotali).fill('');
      campi.forEach(function (nomeCampo) { nuovaRiga[idxPerCampo[nomeCampo]] = valorePerCampo[nomeCampo]; });
      sheetPagamento.appendRow(nuovaRiga);
      rigaPerId[iscrizione.idIscrizione] = sheetPagamento.getLastRow();
    }
  });

  var numRighe = sheetPagamento.getLastRow();
  var numColonne = sheetPagamento.getLastColumn();
  if (numRighe > 1) {
    var idxCognomeOut = idxPerCampo[COLONNE_PAGAMENTO.COGNOME] + 1;
    var idxNomeOut = idxPerCampo[COLONNE_PAGAMENTO.NOME] + 1;
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
 * Rigenera integralmente il tab "Dashboard" a partire dal risultato di Domain/Dashboard#calcolaDashboardStato.
 * Pensata per una lettura rapida "a colpo d'occhio" da parte di un operatore non tecnico:
 * un riquadro con i totali per stato e, sotto, gli ultimi errori da controllare.
 * @param {{totaleIscrizioni: number, conteggiPerStato: Object<string, number>, eventiInErroreRecenti: Array, generatoIl: Date}} dati
 * @param {Sheet} sheetDashboard
 */
function scriviDashboardStato(dati, sheetDashboard) {
  sheetDashboard.clearContents();
  var fuso = Session.getScriptTimeZone();

  sheetDashboard.getRange('A1').setValue('Dashboard di stato — Iscrizioni CUN Fest').setFontWeight('bold').setFontSize(14);
  sheetDashboard.getRange('A2').setValue('Aggiornata il: ' + Utilities.formatDate(dati.generatoIl, fuso, 'dd/MM/yyyy HH:mm'));
  sheetDashboard.getRange('A3').setValue('Totale iscrizioni: ' + dati.totaleIscrizioni).setFontWeight('bold');

  sheetDashboard.getRange('A5:B5').setValues([['Stato iscrizione', 'Numero']]).setBackground('#d9ead3').setFontWeight('bold');
  var righeStato = Object.keys(dati.conteggiPerStato).map(function (stato) {
    return [stato, dati.conteggiPerStato[stato]];
  });
  if (righeStato.length) sheetDashboard.getRange(6, 1, righeStato.length, 2).setValues(righeStato);

  var baseErrori = 6 + righeStato.length + 2;
  sheetDashboard.getRange(baseErrori, 1).setValue('Ultimi eventi in errore (da controllare)').setFontWeight('bold');
  sheetDashboard.getRange(baseErrori + 1, 1, 1, 4)
    .setValues([['Data/ora', 'ID_ISCRIZIONE', 'Tipo evento', 'Errore']])
    .setBackground('#f4cccc').setFontWeight('bold');

  var righeErrori = dati.eventiInErroreRecenti.map(function (evento) {
    var quando = evento.timestamp instanceof Date ? Utilities.formatDate(evento.timestamp, fuso, 'dd/MM/yyyy HH:mm') : String(evento.timestamp || '');
    return [quando, evento.idIscrizione || '', evento.tipoEvento || '', evento.errori || ''];
  });
  if (righeErrori.length) {
    sheetDashboard.getRange(baseErrori + 2, 1, righeErrori.length, 4).setValues(righeErrori);
  } else {
    sheetDashboard.getRange(baseErrori + 2, 1).setValue('Nessun errore recente. 👍');
  }

  for (var c = 1; c <= 4; c++) sheetDashboard.autoResizeColumn(c);
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
