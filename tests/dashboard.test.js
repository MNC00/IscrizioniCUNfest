'use strict';
/**
 * tests/dashboard.test.js
 * -----------------------------------------------------------------------
 * Domain/Dashboard.js è nuovo (nessun equivalente legacy): la dashboard di
 * stato è una feature aggiunta durante il refactor per dare all'operatore
 * una vista rapida "a colpo d'occhio". Questi test verificano solo la
 * logica pura di conteggio/filtro (calcolaDashboardStato), non l'I/O su
 * Sheets (Infrastructure/SheetsWriter#scriviDashboardStato).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');

const contesto = creaContestoDomain();
const { STATI_ISCRIZIONE } = contesto;

test('conta correttamente le iscrizioni per ciascuno stato', () => {
  const iscrizioni = [
    { statoIscrizione: STATI_ISCRIZIONE.NUOVA },
    { statoIscrizione: STATI_ISCRIZIONE.NUOVA },
    { statoIscrizione: STATI_ISCRIZIONE.PAGATA },
    { statoIscrizione: STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO }
  ];
  const risultato = contesto.calcolaDashboardStato(iscrizioni, []);

  assert.equal(risultato.totaleIscrizioni, 4);
  assert.equal(risultato.conteggiPerStato[STATI_ISCRIZIONE.NUOVA], 2);
  assert.equal(risultato.conteggiPerStato[STATI_ISCRIZIONE.PAGATA], 1);
  assert.equal(risultato.conteggiPerStato[STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO], 1);
  assert.equal(risultato.conteggiPerStato[STATI_ISCRIZIONE.ANNULLATA], 0);
});

test('righe con stato mancante/non riconosciuto finiscono in SCONOSCIUTO senza errori', () => {
  const iscrizioni = [{ statoIscrizione: '' }, { statoIscrizione: 'QUALCOSA_DI_STRANO' }, {}];
  const risultato = contesto.calcolaDashboardStato(iscrizioni, []);
  assert.equal(risultato.conteggiPerStato.SCONOSCIUTO, 3);
});

test('filtra solo gli eventi con esito ERRORE e rispetta il limite massimo', () => {
  const eventi = [
    { esito: 'OK', tipoEvento: 'A' },
    { esito: 'ERRORE', tipoEvento: 'B', errori: 'boom' },
    { esito: 'ERRORE', tipoEvento: 'C', errori: 'crash' },
    { esito: 'OK', tipoEvento: 'D' }
  ];
  const risultato = contesto.calcolaDashboardStato([], eventi, 1);
  assert.equal(risultato.eventiInErroreRecenti.length, 1);
  assert.equal(risultato.eventiInErroreRecenti[0].tipoEvento, 'B');
});

test('con liste vuote non lancia errori e restituisce conteggi tutti a zero', () => {
  const risultato = contesto.calcolaDashboardStato([], []);
  assert.equal(risultato.totaleIscrizioni, 0);
  Object.keys(risultato.conteggiPerStato).forEach((chiave) => {
    assert.equal(risultato.conteggiPerStato[chiave], 0);
  });
  assert.deepEqual(risultato.eventiInErroreRecenti, []);
});
