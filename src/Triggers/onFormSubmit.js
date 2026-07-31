/**
 * Triggers/onFormSubmit.js
 * -----------------------------------------------------------------------
 * Punto di ingresso installabile per il trigger ON_FORM_SUBMIT. Il trigger
 * deve essere velocissimo e non contenere logica di business: si limita ad
 * assegnare un ID_ISCRIZIONE alla nuova riga e ad accodare un evento
 * FORM_SUBMITTED. L'elaborazione vera (calcolo prezzo + email) avviene in
 * Orchestration/processaEventi.js, chiamata subito dopo per dare comunque
 * una risposta rapida, con il time-driver come rete di sicurezza in caso di
 * errore transitorio.
 *
 * Da installare in Apps Script come trigger installabile:
 * Menu Trigger ▸ Aggiungi trigger ▸ funzione "mioTriggerV2" ▸ evento "Al momento dell'invio del modulo".
 */

/**
 * Gestore del submit del Google Form.
 * @param {Object} e Evento di Apps Script (non usato direttamente: si legge sempre l'ultima riga).
 */
function mioTriggerV2(e) {
  try {
    var sheet = getFoglioObbligatorio(FOGLI.ISCRIZIONI);
    var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
    var ultimaRiga = sheet.getLastRow();
    if (ultimaRiga <= 1) return;

    var idIscrizione = assegnaIdIscrizioneSeMancante(sheet, indiceIntestazioni, ultimaRiga);
    var statoAttuale = trovaColonna([COLONNE_ISCRIZIONI.STATO_ISCRIZIONE], indiceIntestazioni) >= 0
      ? sheet.getRange(ultimaRiga, trovaColonna([COLONNE_ISCRIZIONI.STATO_ISCRIZIONE], indiceIntestazioni) + 1).getValue()
      : '';
    if (!statoAttuale) {
      scriviStatoIscrizione(sheet, indiceIntestazioni, ultimaRiga, STATI_ISCRIZIONE.NUOVA);
    }

    accodaEvento(idIscrizione, EVENTI_ISCRIZIONE.FORM_SUBMITTED, { riga: ultimaRiga });

    // Elaborazione immediata per esperienza utente reattiva; eventuali errori restano
    // in coda con STATO=ERRORE e vengono ritentati dal time-driver (Triggers/timeDriver.js).
    processaEventiPendenti(5);
  } catch (err) {
    Logger.log('mioTriggerV2 ha fallito: %s', err && err.message ? err.message : String(err));
    registraEventoImmediato('', EVENTI_ISCRIZIONE.FORM_SUBMITTED, {}, 'ERRORE', err && err.message ? err.message : String(err));
  }
}
