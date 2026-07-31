/**
 * Domain/Stati.js
 * -----------------------------------------------------------------------
 * Macchina a stati PURA per il ciclo di vita di un'iscrizione.
 * Nessuna dipendenza da SpreadsheetApp/MailApp: riceve stato+evento, restituisce il nuovo stato.
 * Questo rende la logica testabile in isolamento e riusabile da qualunque orchestratore.
 */

/** Elenco chiuso degli stati che un'iscrizione può assumere. */
var STATI_ISCRIZIONE = Object.freeze({
  NUOVA: 'NUOVA',
  PREZZO_CALCOLATO: 'PREZZO_CALCOLATO',
  MAIL_INVIATA_SENZA_PREZZO: 'MAIL_INVIATA_SENZA_PREZZO',
  MAIL_INVIATA_CON_PREZZO: 'MAIL_INVIATA_CON_PREZZO',
  REINVIATA: 'REINVIATA',
  PAGATA: 'PAGATA',
  ANNULLATA: 'ANNULLATA'
});

/** Elenco chiuso degli eventi di dominio che possono generare una transizione di stato. */
var EVENTI_ISCRIZIONE = Object.freeze({
  FORM_SUBMITTED: 'FORM_SUBMITTED',
  RICALCOLA_PREZZO: 'RICALCOLA_PREZZO',
  MAIL_CONFERMA_INVIATA: 'MAIL_CONFERMA_INVIATA',
  INVIA_AGGIORNAMENTO: 'INVIA_AGGIORNAMENTO',
  PAGAMENTO_REGISTRATO: 'PAGAMENTO_REGISTRATO',
  COMUNICAZIONE_MASSIVA: 'COMUNICAZIONE_MASSIVA',
  ANNULLA: 'ANNULLA'
});

/**
 * Tabella delle transizioni valide: { statoAttuale: { evento: nuovoStato } }.
 * Se una coppia (stato, evento) non è presente, la transizione non è consentita:
 * la funzione prossimoStatoIscrizione restituisce lo stato invariato con `applicata=false`,
 * così il chiamante può decidere se loggare un'anomalia senza mai lanciare eccezioni.
 */
var TRANSIZIONI_STATO_ISCRIZIONE = Object.freeze({
  NUOVA: Object.freeze({
    RICALCOLA_PREZZO: STATI_ISCRIZIONE.PREZZO_CALCOLATO,
    MAIL_CONFERMA_INVIATA: STATI_ISCRIZIONE.MAIL_INVIATA_SENZA_PREZZO,
    INVIA_AGGIORNAMENTO: STATI_ISCRIZIONE.REINVIATA,
    PAGAMENTO_REGISTRATO: STATI_ISCRIZIONE.PAGATA
  }),
  PREZZO_CALCOLATO: Object.freeze({
    RICALCOLA_PREZZO: STATI_ISCRIZIONE.PREZZO_CALCOLATO,
    MAIL_CONFERMA_INVIATA: STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO,
    INVIA_AGGIORNAMENTO: STATI_ISCRIZIONE.REINVIATA,
    PAGAMENTO_REGISTRATO: STATI_ISCRIZIONE.PAGATA
  }),
  MAIL_INVIATA_SENZA_PREZZO: Object.freeze({
    RICALCOLA_PREZZO: STATI_ISCRIZIONE.PREZZO_CALCOLATO,
    INVIA_AGGIORNAMENTO: STATI_ISCRIZIONE.REINVIATA,
    PAGAMENTO_REGISTRATO: STATI_ISCRIZIONE.PAGATA
  }),
  MAIL_INVIATA_CON_PREZZO: Object.freeze({
    RICALCOLA_PREZZO: STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO,
    INVIA_AGGIORNAMENTO: STATI_ISCRIZIONE.REINVIATA,
    PAGAMENTO_REGISTRATO: STATI_ISCRIZIONE.PAGATA
  }),
  REINVIATA: Object.freeze({
    RICALCOLA_PREZZO: STATI_ISCRIZIONE.REINVIATA,
    INVIA_AGGIORNAMENTO: STATI_ISCRIZIONE.REINVIATA,
    PAGAMENTO_REGISTRATO: STATI_ISCRIZIONE.PAGATA
  }),
  // PAGATA e ANNULLATA sono stati terminali per il flusso ordinario:
  // nessuna transizione automatica esce da qui, tranne ANNULLA gestito sotto.
  PAGATA: Object.freeze({}),
  ANNULLATA: Object.freeze({})
});

/**
 * Calcola il prossimo stato di un'iscrizione dato lo stato attuale e un evento di dominio.
 * L'evento ANNULLA è sempre consentito da qualunque stato (eccetto già ANNULLATA).
 *
 * @param {string} statoAttuale Uno dei valori di STATI_ISCRIZIONE (o vuoto/non riconosciuto: trattato come NUOVA).
 * @param {string} evento Uno dei valori di EVENTI_ISCRIZIONE.
 * @return {{stato: string, applicata: boolean}} Il nuovo stato e se la transizione è stata effettivamente applicata.
 */
function prossimoStatoIscrizione(statoAttuale, evento) {
  var statoCorrente = (statoAttuale && STATI_ISCRIZIONE[statoAttuale]) ? statoAttuale : STATI_ISCRIZIONE.NUOVA;

  if (evento === EVENTI_ISCRIZIONE.ANNULLA) {
    if (statoCorrente === STATI_ISCRIZIONE.ANNULLATA) {
      return { stato: statoCorrente, applicata: false };
    }
    return { stato: STATI_ISCRIZIONE.ANNULLATA, applicata: true };
  }

  var transizioniPossibili = TRANSIZIONI_STATO_ISCRIZIONE[statoCorrente] || {};
  if (Object.prototype.hasOwnProperty.call(transizioniPossibili, evento)) {
    return { stato: transizioniPossibili[evento], applicata: true };
  }
  return { stato: statoCorrente, applicata: false };
}

/**
 * Vero se lo stato indicato è uno stato terminale (nessuna ulteriore automazione prevista).
 * @param {string} stato
 * @return {boolean}
 */
function isStatoIscrizioneTerminale(stato) {
  return stato === STATI_ISCRIZIONE.PAGATA || stato === STATI_ISCRIZIONE.ANNULLATA;
}
