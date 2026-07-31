/**
 * Triggers/onFormSubmit.js
 * -----------------------------------------------------------------------
 * Punto di ingresso installabile per il trigger ON_FORM_SUBMIT. Il trigger
 * importa/allinea subito il tab operativo ("Iscrizioni (operativo)") a
 * partire dall'ultima risposta del Form e accoda un evento FORM_SUBMITTED.
 * L'elaborazione vera (calcolo prezzo + email) avviene in
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
    var ultimaRiga = sheet.getLastRow();
    if (ultimaRiga <= 1) return;

    // Importa/allinea SOLO la riga appena arrivata (non l'intero foglio): con centinaia di
    // iscrizioni una scansione completa ad ogni submit introdurrebbe un ritardo percepibile
    // prima dell'invio della mail di conferma. Il time-driver (rigeneraViste, ogni ~5 minuti)
    // fa comunque una scansione completa come rete di sicurezza.
    var idIscrizione = importaRigaFormSingola(ultimaRiga);

    accodaEvento(idIscrizione, EVENTI_ISCRIZIONE.FORM_SUBMITTED, { riga: ultimaRiga });

    // Elaborazione immediata per esperienza utente reattiva; eventuali errori restano
    // in coda con STATO=ERRORE e vengono ritentati dal time-driver (Triggers/timeDriver.js).
    processaEventiPendenti(5);
  } catch (err) {
    Logger.log('mioTriggerV2 ha fallito: %s', err && err.message ? err.message : String(err));
    registraEventoImmediato('', EVENTI_ISCRIZIONE.FORM_SUBMITTED, {}, 'ERRORE', err && err.message ? err.message : String(err));
  }
}
