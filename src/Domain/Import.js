/**
 * Domain/Import.js
 * -----------------------------------------------------------------------
 * Logica pura di fusione tra i dati "grezzi" letti dal tab Form (Iscrizioni
 * CUN Fest) e un'eventuale riga già presente nel tab operativo (Iscrizioni
 * (operativo)). Nessun accesso a Sheets: riceve due oggetti già letti e
 * restituisce l'oggetto risultante da scrivere nel tab operativo.
 *
 * Regola chiave: STATO_ISCRIZIONE e PREZZO sono proprietà ESCLUSIVE del
 * layer operativo una volta che una riga esiste lì. Un nuovo giro di
 * importazione (es. perché è cambiato il pasto di arrivo dopo una modifica
 * manuale della risposta) deve aggiornare i soli campi "anagrafici" del
 * Form, senza mai resettare un prezzo già calcolato o uno stato già avanzato
 * nel ciclo di vita (altrimenti si perderebbe traccia di mail già inviate).
 *
 * Alla PRIMA importazione di un ID_ISCRIZIONE (nessuna riga ancora presente
 * nel tab operativo) si eredita lo stato/prezzo eventualmente già presenti
 * sul tab Form stesso: questo è il caso della migrazione iniziale, quando le
 * iscrizioni erano state avanzate (mail inviate, prezzo calcolato) prima
 * dell'introduzione del layer operativo. Per una riga Form davvero nuova,
 * questi campi sono vuoti e si ricade correttamente su NUOVA/nessun prezzo.
 */

/**
 * @param {Object} datiForm Iscrizione letta dal tab Form (leggiIscrizioneDaRiga sul tab raw),
 *   con idIscrizione già assegnato.
 * @param {?Object} esistente Iscrizione già presente nel tab operativo per lo stesso
 *   ID_ISCRIZIONE (stesso shape di leggiIscrizioneDaRiga), o null se è la prima importazione.
 * @return {Object} campi da scrivere nel tab operativo (stesso shape di leggiIscrizioneDaRiga,
 *   senza i campi `_riga`/`_valoriGrezzi`).
 */
function fondiIscrizioneDaForm(datiForm, esistente) {
  var statoEreditatoDalForm = datiForm.statoIscrizione || STATI_ISCRIZIONE.NUOVA;
  var prezzoEreditatoDalForm = (datiForm.prezzo !== '' && datiForm.prezzo != null) ? datiForm.prezzo : null;

  return {
    idIscrizione: datiForm.idIscrizione,
    nome: datiForm.nome,
    cognome: datiForm.cognome,
    email: datiForm.email,
    dataNascita: datiForm.dataNascita,
    zona: datiForm.zona,
    dataArrivo: datiForm.dataArrivo,
    pastoArrivo: datiForm.pastoArrivo,
    dataPartenza: datiForm.dataPartenza,
    pastoPartenza: datiForm.pastoPartenza,
    soloPranzoCun: datiForm.soloPranzoCun,
    parliamoLunedi: datiForm.parliamoLunedi,
    // Proprietà esclusiva del layer operativo: non viene mai "resettata" da un nuovo import,
    // tranne alla primissima importazione, dove si eredita l'eventuale stato/prezzo già presente
    // sul tab Form (migrazione iniziale).
    statoIscrizione: esistente ? esistente.statoIscrizione : statoEreditatoDalForm,
    prezzo: esistente ? (esistente.prezzo !== '' && esistente.prezzo != null ? esistente.prezzo : null) : prezzoEreditatoDalForm
  };
}
