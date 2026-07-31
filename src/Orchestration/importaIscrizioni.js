/**
 * Orchestration/importaIscrizioni.js
 * -----------------------------------------------------------------------
 * Sincronizza il tab operativo ("Iscrizioni (operativo)") a partire dal tab
 * grezzo del Google Form ("Iscrizioni CUN Fest"). Questo è il confine tra
 * lo strato "Raw" (risposte del Form, la cui struttura può cambiare se
 * qualcuno modifica le domande) e lo strato "operativo" a schema fisso su
 * cui lavora tutta l'orchestrazione (calcolo prezzo, invio mail, viste).
 *
 * Idempotente: eseguirla più volte di seguito non duplica righe (matching
 * per ID_ISCRIZIONE) e non perde mai uno stato/prezzo già calcolato (vedi
 * Domain/Import#fondiIscrizioneDaForm).
 */

/**
 * Importa/allinea tutte le righe del tab Form nel tab operativo.
 * Pensata per il time-driver (rete di sicurezza, gira su tutto il foglio ogni ~5 minuti):
 * per il trigger di submit, che deve essere veloce, usare invece importaRigaFormSingola().
 * @return {{totale: number, nuove: number, aggiornate: number}}
 */
function importaIscrizioniDaForm() {
  var sheetRaw = getFoglioObbligatorio(FOGLI.ISCRIZIONI);
  var indiceRaw = costruisciIndiceIntestazioni(sheetRaw);
  var ultimaRigaRaw = sheetRaw.getLastRow();

  var sheetOperativo = getOCreaFoglioOperativo();
  var indiceOperativo = costruisciIndiceIntestazioni(sheetOperativo);

  var nuove = 0;
  var aggiornate = 0;

  for (var riga = 2; riga <= ultimaRigaRaw; riga++) {
    var creata = importaRiga_(sheetRaw, indiceRaw, sheetOperativo, indiceOperativo, riga);
    if (creata) nuove++; else aggiornate++;
  }

  return { totale: ultimaRigaRaw > 1 ? ultimaRigaRaw - 1 : 0, nuove: nuove, aggiornate: aggiornate };
}

/**
 * Importa/allinea nel tab operativo la sola riga indicata del tab Form. Pensata per il trigger
 * di submit (Triggers/onFormSubmit.js): evita di ri-scansionare l'intero foglio ad ogni invio,
 * che con centinaia di iscrizioni introdurrebbe un ritardo percepibile prima dell'invio della mail.
 * @param {number} numeroRigaRaw Riga 1-based del tab Form (tipicamente l'ultima).
 * @return {string} l'ID_ISCRIZIONE della riga importata.
 */
function importaRigaFormSingola(numeroRigaRaw) {
  var sheetRaw = getFoglioObbligatorio(FOGLI.ISCRIZIONI);
  var indiceRaw = costruisciIndiceIntestazioni(sheetRaw);
  var sheetOperativo = getOCreaFoglioOperativo();
  var indiceOperativo = costruisciIndiceIntestazioni(sheetOperativo);

  importaRiga_(sheetRaw, indiceRaw, sheetOperativo, indiceOperativo, numeroRigaRaw);
  return sheetRaw.getRange(numeroRigaRaw, trovaColonna([COLONNE_ISCRIZIONI.ID_ISCRIZIONE], indiceRaw) + 1).getValue();
}

/**
 * Importa una singola riga raw nel tab operativo (creando o aggiornando la riga corrispondente).
 * @private
 * @param {Sheet} sheetRaw
 * @param {Object<string, number>} indiceRaw
 * @param {Sheet} sheetOperativo
 * @param {Object<string, number>} indiceOperativo
 * @param {number} rigaRaw
 * @return {boolean} true se è stata creata una nuova riga operativa, false se una esistente è stata aggiornata.
 */
function importaRiga_(sheetRaw, indiceRaw, sheetOperativo, indiceOperativo, rigaRaw) {
  // Il Form non assegna un ID: viene stampigliato qui, sul tab raw, alla prima importazione
  // utile (idempotente: se esiste già non viene toccato). È l'unica scrittura che
  // l'importazione fa sul tab raw, necessaria per far corrispondere in modo stabile una
  // risposta del Form alla sua riga operativa anche a domande del Form riordinate/rinominate.
  var idIscrizione = assegnaIdIscrizioneSeMancante(sheetRaw, indiceRaw, rigaRaw);

  var datiForm = leggiIscrizioneDaRiga(sheetRaw, indiceRaw, rigaRaw);
  datiForm.idIscrizione = idIscrizione;

  var rigaOperativaEsistente = trovaRigaPerIdIscrizione(sheetOperativo, indiceOperativo, idIscrizione);
  var esistente = rigaOperativaEsistente > 0 ? leggiIscrizioneDaRiga(sheetOperativo, indiceOperativo, rigaOperativaEsistente) : null;

  var fuso = fondiIscrizioneDaForm(datiForm, esistente);
  scriviIscrizioneOperativa(sheetOperativo, indiceOperativo, rigaOperativaEsistente, fuso);

  return rigaOperativaEsistente <= 0;
}
