/**
 * Orchestration/migrateLegacyIscrizioni.js
 * -----------------------------------------------------------------------
 * Migrazione UNA TANTUM: assegna ID_ISCRIZIONE e STATO_ISCRIZIONE alle righe
 * già presenti nel tab Iscrizioni (create prima dell'introduzione della
 * macchina a stati), e retro-aggancia per ID_ISCRIZIONE le righe già
 * presenti nel tab Pagamento (altrimenti la prima sincronizzazione basata
 * su ID creerebbe righe duplicate, dato che il vecchio abbinamento era per
 * Nome+Cognome). È idempotente: le righe che hanno già un ID non vengono
 * toccate, quindi si può rilanciare in sicurezza più volte.
 *
 * Da eseguire una sola volta dal menu "Iscrizioni CUN Fest ▸ Migra dati legacy"
 * dopo il primo deploy della nuova architettura.
 */

/**
 * Punto di ingresso della migrazione. Eseguire dal menu operatore.
 * @return {{iscrizioniMigrate: number, pagamentoRiagganciate: number}}
 */
function migraIscrizioniLegacy() {
  var iscrizioniMigrate = migraIdEStatoIscrizioni_();
  var pagamentoRiagganciate = migraIdPagamentoLegacy_();
  return { iscrizioniMigrate: iscrizioniMigrate, pagamentoRiagganciate: pagamentoRiagganciate };
}

/**
 * Assegna ID_ISCRIZIONE (se mancante) e deriva STATO_ISCRIZIONE dalle vecchie colonne
 * ("Mail di conferma inviata", "Stato nuovo invio") per ogni riga del tab Iscrizioni.
 * @private
 * @return {number} numero di righe effettivamente migrate (con ID appena creato).
 */
function migraIdEStatoIscrizioni_() {
  var sheet = getFoglioObbligatorio(FOGLI.ISCRIZIONI);
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  assicuraColonna(sheet, indiceIntestazioni, COLONNE_ISCRIZIONI.ID_ISCRIZIONE);
  assicuraColonna(sheet, indiceIntestazioni, COLONNE_ISCRIZIONI.STATO_ISCRIZIONE);

  var idxId = trovaColonna([COLONNE_ISCRIZIONI.ID_ISCRIZIONE], indiceIntestazioni);
  var idxStato = trovaColonna([COLONNE_ISCRIZIONI.STATO_ISCRIZIONE], indiceIntestazioni);
  var idxMailLegacy = trovaColonna([COLONNE_ISCRIZIONI.MAIL_CONFERMA_INVIATA_LEGACY], indiceIntestazioni);
  var idxStatoNuovoInvioLegacy = trovaColonna([COLONNE_ISCRIZIONI.STATO_NUOVO_INVIO_LEGACY], indiceIntestazioni);

  var ultimaRiga = sheet.getLastRow();
  var migrate = 0;

  for (var riga = 2; riga <= ultimaRiga; riga++) {
    var idAttuale = sheet.getRange(riga, idxId + 1).getValue();
    if (idAttuale) continue; // già migrata: idempotenza

    var nuovoId = generaIdIscrizione();
    sheet.getRange(riga, idxId + 1).setValue(nuovoId);

    var mailLegacy = idxMailLegacy >= 0 ? normalizzaTesto(sheet.getRange(riga, idxMailLegacy + 1).getValue()) : '';
    var statoNuovoInvioLegacy = idxStatoNuovoInvioLegacy >= 0 ? normalizzaTesto(sheet.getRange(riga, idxStatoNuovoInvioLegacy + 1).getValue()) : '';

    var statoDerivato = STATI_ISCRIZIONE.NUOVA;
    if (statoNuovoInvioLegacy.indexOf('nuovo invio con prezzo') >= 0 || mailLegacy === 'prima senza, ora con') {
      statoDerivato = STATI_ISCRIZIONE.REINVIATA;
    } else if (mailLegacy === 'inviata con prezzo' || mailLegacy === 'inviata') {
      statoDerivato = STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO;
    } else if (mailLegacy === 'inviata senza prezzo') {
      statoDerivato = STATI_ISCRIZIONE.MAIL_INVIATA_SENZA_PREZZO;
    }

    sheet.getRange(riga, idxStato + 1).setValue(statoDerivato);
    migrate++;
  }

  return migrate;
}

/**
 * Retro-aggancia ID_ISCRIZIONE alle righe già esistenti nel tab Pagamento,
 * abbinandole per Nome+Cognome normalizzati (unica volta in cui questo
 * abbinamento "storico" viene ancora usato: dopo la migrazione tutta la
 * sincronizzazione futura avviene per ID_ISCRIZIONE).
 * @private
 * @return {number} numero di righe di Pagamento riagganciate.
 */
function migraIdPagamentoLegacy_() {
  var sheetPagamento = getSpreadsheetAttivo().getSheetByName(FOGLI.PAGAMENTO);
  if (!sheetPagamento || sheetPagamento.getLastRow() < 2) return 0;

  var indicePagamento = costruisciIndiceIntestazioni(sheetPagamento);
  var idxIdPagamento = assicuraColonna(sheetPagamento, indicePagamento, COLONNE_PAGAMENTO.ID_ISCRIZIONE);
  var idxCognomePagamento = trovaColonna([COLONNE_PAGAMENTO.COGNOME], indicePagamento);
  var idxNomePagamento = trovaColonna([COLONNE_PAGAMENTO.NOME], indicePagamento);

  var iscrizioni = leggiTutteIscrizioni();
  var indiceByNomeCognome = {};
  iscrizioni.forEach(function (iscr) {
    var chiave = normalizzaTesto(iscr.cognome) + '|' + normalizzaTesto(iscr.nome);
    indiceByNomeCognome[chiave] = iscr.idIscrizione;
  });

  var ultimaRiga = sheetPagamento.getLastRow();
  var riagganciate = 0;
  for (var riga = 2; riga <= ultimaRiga; riga++) {
    var idAttuale = sheetPagamento.getRange(riga, idxIdPagamento + 1).getValue();
    if (idAttuale) continue; // già riagganciata: idempotenza

    var cognome = sheetPagamento.getRange(riga, idxCognomePagamento + 1).getValue();
    var nome = sheetPagamento.getRange(riga, idxNomePagamento + 1).getValue();
    var chiave = normalizzaTesto(cognome) + '|' + normalizzaTesto(nome);
    var idTrovato = indiceByNomeCognome[chiave];
    if (idTrovato) {
      sheetPagamento.getRange(riga, idxIdPagamento + 1).setValue(idTrovato);
      riagganciate++;
    }
  }
  return riagganciate;
}
