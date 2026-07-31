'use strict';
/**
 * tests/import.test.js
 * -----------------------------------------------------------------------
 * Domain/Import.js è nuovo (introdotto con lo strato "Iscrizioni
 * (operativo)", Fase C del refactor di usabilità/robustezza). Questi test
 * verificano la regola più delicata: STATO_ISCRIZIONE e PREZZO non devono
 * mai essere "resettati" da una successiva importazione dal Form, TRANNE
 * alla primissima importazione, dove si eredita quanto già presente sul tab
 * Form (caso della migrazione iniziale dei dati già avanzati prima
 * dell'introduzione del layer operativo).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');

const contesto = creaContestoDomain();
const { STATI_ISCRIZIONE } = contesto;

function datiFormBase(extra) {
  return Object.assign({
    idIscrizione: 'ISCR-TEST01',
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario@example.com',
    dataNascita: new Date(2000, 0, 1),
    zona: 'Nord',
    dataArrivo: new Date(2026, 6, 1),
    pastoArrivo: 'Colazione',
    dataPartenza: new Date(2026, 6, 5),
    pastoPartenza: 'Cena',
    soloPranzoCun: false,
    parliamoLunedi: '',
    statoIscrizione: '',
    prezzo: ''
  }, extra || {});
}

test('prima importazione senza stato pregresso: NUOVA e prezzo nullo', () => {
  const risultato = contesto.fondiIscrizioneDaForm(datiFormBase(), null);
  assert.equal(risultato.statoIscrizione, STATI_ISCRIZIONE.NUOVA);
  assert.equal(risultato.prezzo, null);
  assert.equal(risultato.idIscrizione, 'ISCR-TEST01');
  assert.equal(risultato.nome, 'Mario');
});

test('prima importazione con stato/prezzo già presenti sul tab Form (migrazione iniziale): li eredita', () => {
  const datiForm = datiFormBase({ statoIscrizione: STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO, prezzo: 123 });
  const risultato = contesto.fondiIscrizioneDaForm(datiForm, null);
  assert.equal(risultato.statoIscrizione, STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO);
  assert.equal(risultato.prezzo, 123);
});

test('importazioni successive NON resettano uno stato/prezzo già avanzato nel tab operativo', () => {
  const datiForm = datiFormBase({ pastoArrivo: 'Pranzo' }); // es. l'iscritto ha corretto una risposta
  const esistente = { statoIscrizione: STATI_ISCRIZIONE.PAGATA, prezzo: 250 };
  const risultato = contesto.fondiIscrizioneDaForm(datiForm, esistente);
  assert.equal(risultato.statoIscrizione, STATI_ISCRIZIONE.PAGATA);
  assert.equal(risultato.prezzo, 250);
  // ma i campi anagrafici SI aggiornano dal Form
  assert.equal(risultato.pastoArrivo, 'Pranzo');
});

test('importazioni successive aggiornano sempre i campi anagrafici dal Form', () => {
  const datiForm = datiFormBase({ email: 'nuova-email@example.com', zona: 'Sud' });
  const esistente = { statoIscrizione: STATI_ISCRIZIONE.NUOVA, prezzo: null };
  const risultato = contesto.fondiIscrizioneDaForm(datiForm, esistente);
  assert.equal(risultato.email, 'nuova-email@example.com');
  assert.equal(risultato.zona, 'Sud');
});
