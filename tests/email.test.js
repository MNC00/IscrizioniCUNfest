'use strict';
/**
 * tests/email.test.js
 * -----------------------------------------------------------------------
 * Verifica che Domain/Email.js produca esattamente lo stesso HTML/oggetto
 * del codice legacy, per tutte le combinazioni isSoloPranzo x hasPrezzo,
 * sia per l'invio iniziale che per l'aggiornamento, oltre alla mail massiva.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');
const {
  buildEmailContentInizialeLegacy,
  buildEmailContentAggiornamentoLegacy,
  buildEmailContentMassaLegacy
} = require('./legacy-reference/emailLegacy');

const contesto = creaContestoDomain();

const CONTESTO_BASE = {
  nome: 'Mario', anno: 2026, dataArrivoFormattata: 'Sabato 08 Agosto 2026', pastoArrivo: 'Cena',
  dataPartenzaFormattata: 'Lunedì 10 Agosto 2026', pastoPartenza: 'Pranzo', prezzo: 42
};

const COMBINAZIONI = [
  { isSoloPranzo: false, hasPrezzo: false },
  { isSoloPranzo: false, hasPrezzo: true },
  { isSoloPranzo: true, hasPrezzo: false },
  { isSoloPranzo: true, hasPrezzo: true }
];

test('costruisciEmailConferma produce lo stesso oggetto/HTML della funzione legacy buildEmailContentIniziale', () => {
  COMBINAZIONI.forEach(({ isSoloPranzo, hasPrezzo }) => {
    const ctx = { ...CONTESTO_BASE, isSoloPranzo, hasPrezzo };
    const nuovo = contesto.costruisciEmailConferma(ctx);
    const legacy = buildEmailContentInizialeLegacy({
      nome: ctx.nome, anno: ctx.anno, hasPrezzo, isSoloPranzo,
      dataArrivo: ctx.dataArrivoFormattata, pastoArrivo: ctx.pastoArrivo,
      dataPartenza: ctx.dataPartenzaFormattata, pastoPartenza: ctx.pastoPartenza, prezzo: ctx.prezzo
    });

    assert.equal(nuovo.oggetto, legacy.oggetto, `oggetto divergente per isSoloPranzo=${isSoloPranzo} hasPrezzo=${hasPrezzo}`);
    assert.equal(nuovo.html, legacy.corpo, `html divergente per isSoloPranzo=${isSoloPranzo} hasPrezzo=${hasPrezzo}`);
  });
});

test('costruisciEmailAggiornamento produce lo stesso oggetto/HTML della funzione legacy buildEmailContentAggiornamento', () => {
  COMBINAZIONI.forEach(({ isSoloPranzo, hasPrezzo }) => {
    const ctx = { ...CONTESTO_BASE, isSoloPranzo, hasPrezzo };
    const nuovo = contesto.costruisciEmailAggiornamento(ctx);
    const legacy = buildEmailContentAggiornamentoLegacy({
      nome: ctx.nome, anno: ctx.anno, hasPrezzo, isSoloPranzo,
      dataArrivo: ctx.dataArrivoFormattata, pastoArrivo: ctx.pastoArrivo,
      dataPartenza: ctx.dataPartenzaFormattata, pastoPartenza: ctx.pastoPartenza, prezzo: ctx.prezzo
    });

    assert.equal(nuovo.oggetto, legacy.oggetto, `oggetto divergente per isSoloPranzo=${isSoloPranzo} hasPrezzo=${hasPrezzo}`);
    assert.equal(nuovo.html, legacy.corpo, `html divergente per isSoloPranzo=${isSoloPranzo} hasPrezzo=${hasPrezzo}`);
  });
});

test('costruisciEmailMassa produce lo stesso HTML del corpo email di sendRecoveryEmails legacy', () => {
  const nuovo = contesto.costruisciEmailMassa('Giulia', 'Oggetto di prova', 'Testo libero della comunicazione.');
  const corpoLegacy = buildEmailContentMassaLegacy('Giulia', 'Testo libero della comunicazione.');
  assert.equal(nuovo.html, corpoLegacy);
  assert.equal(nuovo.oggetto, 'Oggetto di prova');
});

test('costruisciEmailConferma/Aggiornamento: la versione testo non contiene tag HTML residui', () => {
  const ctx = { ...CONTESTO_BASE, isSoloPranzo: false, hasPrezzo: true };
  const conferma = contesto.costruisciEmailConferma(ctx);
  const aggiornamento = contesto.costruisciEmailAggiornamento(ctx);
  assert.doesNotMatch(conferma.testo, /<[^>]+>/);
  assert.doesNotMatch(aggiornamento.testo, /<[^>]+>/);
});
