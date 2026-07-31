/**
 * Orchestration/processaEventi.js
 * -----------------------------------------------------------------------
 * Cuore dell'orchestrazione: legge gli eventi in coda (tab Eventi) e li
 * smista al gestore corretto. Ogni gestore compone Domain (logica pura) e
 * Infrastructure (side effect), e non contiene mai regole di business dirette.
 *
 * Può essere invocato:
 *  - subito dopo l'accodamento, per una risposta rapida (vedi Triggers/onFormSubmit.js);
 *  - periodicamente dal time-driver, come rete di sicurezza per eventi falliti o non ancora elaborati.
 */

/**
 * Elabora fino a `limite` eventi pendenti/in errore dalla coda.
 * @param {number} [limite] Default 50.
 * @return {{elaborati: number, ok: number, errori: number}}
 */
function processaEventiPendenti(limite) {
  var eventi = prendiEventiDaProcessare(limite);
  var ok = 0, errori = 0;

  eventi.forEach(function (evento) {
    try {
      var risultato = smistaEvento_(evento);
      if (risultato && risultato.esito === 'ERRORE') {
        marcaEventoInErrore(evento.numeroRiga, risultato.errori.join('; '));
        errori++;
      } else {
        marcaEventoCompletato(evento.numeroRiga, 'OK');
        ok++;
      }
    } catch (e) {
      marcaEventoInErrore(evento.numeroRiga, e && e.message ? e.message : String(e));
      errori++;
    }
  });

  return { elaborati: eventi.length, ok: ok, errori: errori };
}

/**
 * Smista un evento al gestore corretto in base al tipo.
 * @private
 * @param {{tipoEvento: string, idIscrizione: string, dati: Object}} evento
 * @return {{esito: string, errori: string[]}}
 */
function smistaEvento_(evento) {
  switch (evento.tipoEvento) {
    case EVENTI_ISCRIZIONE.FORM_SUBMITTED:
      return gestisciFormSubmitted(evento.idIscrizione);
    case EVENTI_ISCRIZIONE.RICALCOLA_PREZZO:
      return gestisciRicalcolaPrezzo(evento.idIscrizione);
    case EVENTI_ISCRIZIONE.INVIA_AGGIORNAMENTO:
      return gestisciInviaAggiornamento(evento.idIscrizione, !!(evento.dati && evento.dati.confermaReinvio));
    case EVENTI_ISCRIZIONE.PAGAMENTO_REGISTRATO:
      return gestisciPagamentoRegistrato(evento.idIscrizione);
    case EVENTI_ISCRIZIONE.COMUNICAZIONE_MASSIVA:
      return gestisciComunicazioneMassiva(evento.dati.idComm);
    default:
      return { esito: 'ERRORE', errori: ['Tipo evento sconosciuto: ' + evento.tipoEvento] };
  }
}

/** Contesto comune riusato da più gestori: fogli + configurazione correnti. */
function costruisciContestoElaborazione_() {
  var sheetIscrizioni = getFoglioObbligatorio(FOGLI.ISCRIZIONI);
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheetIscrizioni);
  var configurazione = leggiConfigurazioneCalcoloPrezzi(leggiMappaConfigurazione());
  return { sheetIscrizioni: sheetIscrizioni, indiceIntestazioni: indiceIntestazioni, configurazione: configurazione };
}

/** Costruisce il contesto testuale (date formattate, ecc.) da passare a Domain/Email a partire da un'iscrizione. */
function costruisciContestoEmail_(iscrizione, hasPrezzo) {
  return {
    nome: iscrizione.nome,
    anno: new Date().getFullYear(),
    hasPrezzo: hasPrezzo,
    isSoloPranzo: iscrizione.soloPranzoCun,
    dataArrivoFormattata: iscrizione.dataArrivo ? formattaDataItaliana_(iscrizione.dataArrivo) : '',
    pastoArrivo: iscrizione.pastoArrivo,
    dataPartenzaFormattata: iscrizione.dataPartenza ? formattaDataItaliana_(iscrizione.dataPartenza) : '',
    pastoPartenza: iscrizione.pastoPartenza,
    prezzo: iscrizione.prezzo
  };
}

/** Formatta una data in italiano, es. "Lunedì 04 Agosto 2026". */
function formattaDataItaliana_(data) {
  var giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  var mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  return giorni[data.getDay()] + ' ' + String(data.getDate()).padStart(2, '0') + ' ' + mesi[data.getMonth()] + ' ' + data.getFullYear();
}

/**
 * Gestisce il submit del form: calcola il prezzo (se le tariffe sono disponibili) e invia la mail di conferma.
 * @param {string} idIscrizione
 * @return {{esito: string, errori: string[]}}
 */
function gestisciFormSubmitted(idIscrizione) {
  var ctx = costruisciContestoElaborazione_();
  var riga = trovaRigaPerIdIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, idIscrizione);
  if (riga < 0) return { esito: 'ERRORE', errori: ['Iscrizione non trovata: ' + idIscrizione] };

  var iscrizione = leggiIscrizioneDaRiga(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga);
  if (!iscrizione.nome || !iscrizione.email) {
    return { esito: 'ERRORE', errori: ['Nome o email mancanti: nessuna mail inviata.'] };
  }

  var esitoPrezzo = calcolaPrezzo(iscrizione, ctx.configurazione);
  var hasPrezzo = esitoPrezzo.prezzo !== null;
  if (hasPrezzo) {
    scriviPrezzoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, esitoPrezzo.prezzo);
    iscrizione.prezzo = esitoPrezzo.prezzo;
    var t1 = prossimoStatoIscrizione(iscrizione.statoIscrizione, EVENTI_ISCRIZIONE.RICALCOLA_PREZZO);
    scriviStatoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, t1.stato);
    iscrizione.statoIscrizione = t1.stato;
  }

  var payload = costruisciEmailConferma(costruisciContestoEmail_(iscrizione, hasPrezzo));
  var esitoInvio = inviaEmail({
    to: iscrizione.email, subject: payload.oggetto, html: payload.html, testo: payload.testo,
    idIscrizione: idIscrizione, tipoEvento: 'MAIL_CONFERMA', dryRun: ctx.configurazione.modalitaTestNoInvioEmail
  });

  var transizioneMail = prossimoStatoIscrizione(iscrizione.statoIscrizione, EVENTI_ISCRIZIONE.MAIL_CONFERMA_INVIATA);
  scriviStatoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, transizioneMail.stato);

  if (esitoPrezzo.errori.length) {
    Logger.log('Avviso calcolo prezzo per %s: %s', idIscrizione, esitoPrezzo.errori.join('; '));
  }
  if (esitoInvio.esito === 'ERRORE') return { esito: 'ERRORE', errori: [esitoInvio.errore] };
  return { esito: 'OK', errori: [] };
}

/**
 * Ricalcola il prezzo di un'iscrizione (senza inviare email): usato dal menu operatore.
 * @param {string} idIscrizione
 * @return {{esito: string, errori: string[]}}
 */
function gestisciRicalcolaPrezzo(idIscrizione) {
  var ctx = costruisciContestoElaborazione_();
  var riga = trovaRigaPerIdIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, idIscrizione);
  if (riga < 0) return { esito: 'ERRORE', errori: ['Iscrizione non trovata: ' + idIscrizione] };

  var iscrizione = leggiIscrizioneDaRiga(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga);
  var esitoPrezzo = calcolaPrezzo(iscrizione, ctx.configurazione);
  if (esitoPrezzo.prezzo === null) return { esito: 'ERRORE', errori: esitoPrezzo.errori };

  scriviPrezzoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, esitoPrezzo.prezzo);
  var transizione = prossimoStatoIscrizione(iscrizione.statoIscrizione, EVENTI_ISCRIZIONE.RICALCOLA_PREZZO);
  scriviStatoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, transizione.stato);
  return { esito: 'OK', errori: [] };
}

/**
 * Invia la mail di aggiornamento prezzo (reinvio manuale). Se era già stata inviata una mail
 * "con prezzo" in precedenza, richiede una conferma esplicita (`confermaReinvio=true`) prima di
 * reinviare, per evitare invii doppi accidentali senza però impedire i reinvii intenzionali
 * (es. il prezzo è cambiato una seconda volta, o l'iscritto ha perso la mail precedente).
 * @param {string} idIscrizione
 * @param {boolean} [confermaReinvio] Se true, invia comunque anche se è già stata inviata una mail con prezzo.
 * @return {{esito: string, errori: string[]}} esito può essere 'OK', 'ERRORE' o 'RICHIEDE_CONFERMA'
 *   (quest'ultimo quando serve una conferma esplicita per il reinvio e non è stata ancora data).
 */
function gestisciInviaAggiornamento(idIscrizione, confermaReinvio) {
  var ctx = costruisciContestoElaborazione_();
  var riga = trovaRigaPerIdIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, idIscrizione);
  if (riga < 0) return { esito: 'ERRORE', errori: ['Iscrizione non trovata: ' + idIscrizione] };

  var iscrizione = leggiIscrizioneDaRiga(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga);
  var giaInviataConPrezzo = iscrizione.statoIscrizione === STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO ||
    iscrizione.statoIscrizione === STATI_ISCRIZIONE.REINVIATA;
  if (giaInviataConPrezzo && !confermaReinvio) {
    return { esito: 'RICHIEDE_CONFERMA', errori: ['È già stata inviata una mail con prezzo per questa iscrizione: confermare per reinviarla comunque.'] };
  }
  if (!iscrizione.nome || !iscrizione.email) return { esito: 'ERRORE', errori: ['Nome o email mancanti.'] };

  var esitoPrezzo = calcolaPrezzo(iscrizione, ctx.configurazione);
  var hasPrezzo = esitoPrezzo.prezzo !== null;
  if (hasPrezzo) {
    scriviPrezzoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, esitoPrezzo.prezzo);
    iscrizione.prezzo = esitoPrezzo.prezzo;
  }

  var payload = costruisciEmailAggiornamento(costruisciContestoEmail_(iscrizione, hasPrezzo));
  var esitoInvio = inviaEmail({
    to: iscrizione.email, subject: payload.oggetto, html: payload.html, testo: payload.testo,
    idIscrizione: idIscrizione, tipoEvento: 'MAIL_AGGIORNAMENTO', dryRun: ctx.configurazione.modalitaTestNoInvioEmail
  });

  var transizione = prossimoStatoIscrizione(iscrizione.statoIscrizione, EVENTI_ISCRIZIONE.INVIA_AGGIORNAMENTO);
  scriviStatoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, transizione.stato);

  if (esitoInvio.esito === 'ERRORE') return { esito: 'ERRORE', errori: [esitoInvio.errore] };
  return { esito: 'OK', errori: [] };
}

/**
 * Registra il pagamento di un'iscrizione (transizione a stato PAGATA).
 * @param {string} idIscrizione
 * @return {{esito: string, errori: string[]}}
 */
function gestisciPagamentoRegistrato(idIscrizione) {
  var ctx = costruisciContestoElaborazione_();
  var riga = trovaRigaPerIdIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, idIscrizione);
  if (riga < 0) return { esito: 'ERRORE', errori: ['Iscrizione non trovata: ' + idIscrizione] };

  var iscrizione = leggiIscrizioneDaRiga(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga);
  var transizione = prossimoStatoIscrizione(iscrizione.statoIscrizione, EVENTI_ISCRIZIONE.PAGAMENTO_REGISTRATO);
  scriviStatoIscrizione(ctx.sheetIscrizioni, ctx.indiceIntestazioni, riga, transizione.stato);
  return { esito: 'OK', errori: [] };
}

/**
 * Invia una comunicazione di massa a tutti gli indirizzi email unici delle iscrizioni.
 * @param {string} idComm ID_COMM della riga nel tab Comunicazioni.
 * @return {{esito: string, errori: string[]}}
 */
function gestisciComunicazioneMassiva(idComm) {
  var sheetComunicazioni = getFoglioObbligatorio(FOGLI.COMUNICAZIONI);
  var righe = leggiComunicazioniDaInviare().filter(function (r) { return r.idComm === idComm; });
  if (!righe.length) return { esito: 'ERRORE', errori: ['Comunicazione non trovata o già inviata: ' + idComm] };
  var comunicazione = righe[0];

  var configurazione = leggiConfigurazioneCalcoloPrezzi(leggiMappaConfigurazione());
  var iscrizioni = leggiTutteIscrizioni();
  var emailGiaInviate = {};
  var erroriInvio = [];

  iscrizioni.forEach(function (iscrizione) {
    if (!iscrizione.email || emailGiaInviate[iscrizione.email]) return;
    emailGiaInviate[iscrizione.email] = true;
    var payload = costruisciEmailMassa(iscrizione.nome, comunicazione.oggetto, comunicazione.testo);
    var esito = inviaEmail({
      to: iscrizione.email, subject: payload.oggetto, html: payload.html, testo: payload.testo,
      idIscrizione: iscrizione.idIscrizione, tipoEvento: 'COMUNICAZIONE_MASSIVA', dryRun: configurazione.modalitaTestNoInvioEmail
    });
    if (esito.esito === 'ERRORE') erroriInvio.push(iscrizione.email + ': ' + esito.errore);
  });

  var idOperatore = Session.getActiveUser().getEmail() || 'sconosciuto';
  registraEsitoComunicazione(sheetComunicazioni, comunicazione._riga,
    erroriInvio.length ? STATO_COMUNICAZIONE.ERRORE : STATO_COMUNICAZIONE.INVIATA, new Date(), idOperatore);

  if (erroriInvio.length) return { esito: 'ERRORE', errori: erroriInvio };
  return { esito: 'OK', errori: [] };
}
