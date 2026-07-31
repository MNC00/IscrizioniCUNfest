'use strict';
/**
 * tests/email.annullamento.test.js
 * -----------------------------------------------------------------------
 * Verifica le aggiunte di Domain/Email.js per la Fase D (annullamento
 * self-service): il link di annullamento nelle mail di conferma/aggiornamento
 * è puramente ADDITIVO (non deve alterare l'HTML esistente quando assente,
 * per non rompere la parità con il legacy verificata in email.test.js), e la
 * nuova email di conferma annullamento ha un contenuto minimo corretto.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');

const contesto = creaContestoDomain();

const CONTESTO_BASE = {
  nome: 'Mario', anno: 2026, isSoloPranzo: false, hasPrezzo: true,
  dataArrivoFormattata: 'Sabato 08 Agosto 2026', pastoArrivo: 'Cena',
  dataPartenzaFormattata: 'Lunedì 10 Agosto 2026', pastoPartenza: 'Pranzo', prezzo: 42
};

test('costruisciEmailConferma: senza linkAnnullamento l\'HTML è identico a prima (nessuna regressione)', () => {
  const conLink = contesto.costruisciEmailConferma(CONTESTO_BASE);
  const senzaLinkEsplicito = contesto.costruisciEmailConferma({ ...CONTESTO_BASE, linkAnnullamento: null });
  assert.equal(conLink.html, senzaLinkEsplicito.html);
  assert.doesNotMatch(conLink.html, /Annulla la mia iscrizione/);
});

test('costruisciEmailConferma: con linkAnnullamento aggiunge un paragrafo con il link, senza alterare il resto', () => {
  const base = contesto.costruisciEmailConferma(CONTESTO_BASE);
  const conLink = contesto.costruisciEmailConferma({ ...CONTESTO_BASE, linkAnnullamento: 'https://esempio.test/annulla?token=abc' });
  assert.ok(conLink.html.startsWith(base.html));
  assert.match(conLink.html, /href='https:\/\/esempio\.test\/annulla\?token=abc'/);
  assert.match(conLink.html, /Annulla la mia iscrizione/);
});

test('costruisciEmailAggiornamento: con linkAnnullamento aggiunge lo stesso paragrafo in coda', () => {
  const base = contesto.costruisciEmailAggiornamento(CONTESTO_BASE);
  const conLink = contesto.costruisciEmailAggiornamento({ ...CONTESTO_BASE, linkAnnullamento: 'https://esempio.test/annulla?token=xyz' });
  assert.ok(conLink.html.startsWith(base.html));
  assert.match(conLink.html, /href='https:\/\/esempio\.test\/annulla\?token=xyz'/);
});

test('costruisciEmailAnnullamento: produce oggetto e corpo minimi coerenti', () => {
  const risultato = contesto.costruisciEmailAnnullamento({ nome: 'Giulia' });
  assert.equal(risultato.oggetto, 'Iscrizione annullata - CUN Fest');
  assert.match(risultato.html, /Ciao Giulia\./);
  assert.match(risultato.html, /annullata come richiesto/);
  assert.doesNotMatch(risultato.testo, /<[^>]+>/);
});
