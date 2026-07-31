'use strict';
/**
 * tests/pasti.test.js
 * -----------------------------------------------------------------------
 * Verifica che Domain/Pasti.js (calcolaPastiPerGiorno) produca ESATTAMENTE
 * gli stessi conteggi del codice legacy (generaTabellaPasti), su gruppi di
 * iscrizioni generati casualmente ma anche su casi mirati (arrivo=partenza,
 * "parliamo di lunedì", "me ne vado dopo lunedì", solo pranzo CUN).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');
const { calcolaPastiLegacyPuro } = require('./legacy-reference/pastiLegacy');
const { creaRandom, interoTra, elementoCasuale, dataCasualeAttorno } = require('./support/randomData');

const contesto = creaContestoDomain();

const DATA_INIZIO_CUN = new Date(2026, 7, 8);
const DATA_FINE_CUN = new Date(2026, 7, 11);
const CONFIGURAZIONE = { dataInizioCun: DATA_INIZIO_CUN, dataFineCun: DATA_FINE_CUN };

const PASTI_ARRIVO = ['Colazione', 'Pranzo', 'Cena', 'Dopo cena'];
const PASTI_PARTENZA = ['Colazione', 'Pranzo', 'Cena', 'Prima di colazione'];
const RISPOSTE_LUNEDI = ['', '', '', 'Colazione', 'Pranzo', 'Cena', 'Me ne vado dopo lunedì'];

function generaIscrizionePastiCasuale(rand, indice) {
  const dataArrivo = dataCasualeAttorno(rand, DATA_INIZIO_CUN, 10);
  const notti = interoTra(rand, 0, 6);
  const dataPartenza = new Date(dataArrivo);
  dataPartenza.setDate(dataPartenza.getDate() + notti);

  return {
    dataArrivo,
    pastoArrivo: elementoCasuale(rand, PASTI_ARRIVO),
    dataPartenza,
    pastoPartenza: elementoCasuale(rand, PASTI_PARTENZA),
    soloPranzoCun: rand() < 0.15,
    parliamoLunedi: elementoCasuale(rand, RISPOSTE_LUNEDI),
    nome: 'Nome' + indice,
    cognome: 'Cognome' + indice
  };
}

/** Converte la forma "Domain" (data:Date, elencoLunedi:{cognome,nome}) nella forma "legacy" per il confronto.
 *  Il round-trip JSON normalizza anche il "realm" diverso degli oggetti creati dentro la sandbox vm
 *  (altrimenti assert.deepEqual li considera non equivalenti pur avendo lo stesso contenuto). */
function normalizzaTabellaDominio(risultatoDominio) {
  const semplificato = {
    tabellaGiorni: risultatoDominio.tabellaGiorni.map((g) => ({
      data: g.data.toISOString().slice(0, 10),
      colazione: g.colazione, pranzo: g.pranzo, cena: g.cena, dormire: g.dormire
    })),
    soloPranzoCunTotale: risultatoDominio.soloPranzoCunTotale,
    elencoLunedi: risultatoDominio.elencoLunedi.map((p) => [p.cognome, p.nome])
  };
  return JSON.parse(JSON.stringify(semplificato));
}

test('calcolaPastiPerGiorno (Domain) == calcolaPastiLegacyPuro (legacy) su 200 gruppi casuali di iscrizioni', () => {
  const rand = creaRandom(7);

  for (let gruppo = 0; gruppo < 200; gruppo++) {
    const numeroIscrizioni = interoTra(rand, 1, 15);
    const iscrizioni = [];
    for (let i = 0; i < numeroIscrizioni; i++) iscrizioni.push(generaIscrizionePastiCasuale(rand, i));

    const legacyInput = iscrizioni.map((r) => ({
      dataArrivo: r.dataArrivo, pastoArrivo: r.pastoArrivo, dataPartenza: r.dataPartenza, pastoPartenza: r.pastoPartenza,
      soloPranzoCun: r.soloPranzoCun ? 'Si' : 'No', parliamoLunedi: r.parliamoLunedi, nome: r.nome, cognome: r.cognome
    }));

    const risultatoNuovo = normalizzaTabellaDominio(contesto.calcolaPastiPerGiorno(iscrizioni, CONFIGURAZIONE));
    const risultatoLegacy = calcolaPastiLegacyPuro(legacyInput, CONFIGURAZIONE);

    assert.deepEqual(
      risultatoNuovo, risultatoLegacy,
      `Gruppo #${gruppo} divergente.\nIscrizioni: ${JSON.stringify(iscrizioni)}`
    );
  }
});

test('calcolaPastiPerGiorno: arrivo e partenza nello stesso giorno con "Prima di colazione" (0 notti)', () => {
  const iscrizioni = [{
    dataArrivo: new Date(2026, 7, 9), pastoArrivo: 'Pranzo',
    dataPartenza: new Date(2026, 7, 9), pastoPartenza: 'Prima di colazione',
    soloPranzoCun: false, parliamoLunedi: '', nome: 'Mario', cognome: 'Rossi'
  }];
  const legacyInput = [{ ...iscrizioni[0], soloPranzoCun: 'No' }];

  const risultatoNuovo = normalizzaTabellaDominio(contesto.calcolaPastiPerGiorno(iscrizioni, CONFIGURAZIONE));
  const risultatoLegacy = calcolaPastiLegacyPuro(legacyInput, CONFIGURAZIONE);
  assert.deepEqual(risultatoNuovo, risultatoLegacy);
});

test('calcolaPastiPerGiorno: elenco "chi c\'è lunedì" ordinato per cognome poi nome, come storicamente', () => {
  const iscrizioni = [
    { dataArrivo: new Date(2026, 7, 8), pastoArrivo: 'Cena', dataPartenza: DATA_FINE_CUN, pastoPartenza: 'Cena', soloPranzoCun: false, parliamoLunedi: 'Pranzo', nome: 'Anna', cognome: 'Verdi' },
    { dataArrivo: new Date(2026, 7, 8), pastoArrivo: 'Cena', dataPartenza: DATA_FINE_CUN, pastoPartenza: 'Cena', soloPranzoCun: false, parliamoLunedi: 'Cena', nome: 'Bruno', cognome: 'Rossi' },
    { dataArrivo: new Date(2026, 7, 8), pastoArrivo: 'Cena', dataPartenza: DATA_FINE_CUN, pastoPartenza: 'Cena', soloPranzoCun: false, parliamoLunedi: 'Colazione', nome: 'Aldo', cognome: 'Rossi' }
  ];
  const risultato = contesto.calcolaPastiPerGiorno(iscrizioni, CONFIGURAZIONE);
  // Array.from (chiamato come metodo statico del realm principale) ricrea l'array nel realm
  // di Node, evitando il problema di confronto cross-realm con gli array creati nella sandbox vm.
  const nomiOrdinati = Array.from(risultato.elencoLunedi, (p) => p.cognome + ' ' + p.nome);
  assert.deepEqual(nomiOrdinati, ['Rossi Aldo', 'Rossi Bruno', 'Verdi Anna']);
});

test('calcolaPastiPerGiorno: righe senza date valide vengono ignorate (nessuna eccezione)', () => {
  const iscrizioni = [
    { dataArrivo: null, dataPartenza: null, pastoArrivo: '', pastoPartenza: '', soloPranzoCun: false, parliamoLunedi: '', nome: 'X', cognome: 'Y' }
  ];
  assert.doesNotThrow(() => contesto.calcolaPastiPerGiorno(iscrizioni, CONFIGURAZIONE));
});

test('calcolaPastiPerGiorno: "solo pranzo CUN" SENZA date (come nel form reale) viene comunque contato nel totale dedicato (bug trovato in verifica live)', () => {
  // Nel form reale, chi risponde "sì" a "Partecipi SOLO al pranzo del CUN?" NON compila
  // le domande data/pasto di arrivo e partenza (il form le salta): sul foglio quelle celle
  // restano vuote. Il legacy conta comunque questa persona nel riquadro "Solo Pranzo CUN"
  // (soloPranzoCounter++ avviene PRIMA e indipendentemente dal ciclo sulle date).
  const iscrizioni = [
    { // iscrizione "normale" per tutto il periodo, presente a pranzo il giorno di arrivo
      dataArrivo: DATA_INIZIO_CUN, pastoArrivo: 'Colazione',
      dataPartenza: DATA_FINE_CUN, pastoPartenza: 'Cena',
      soloPranzoCun: false, parliamoLunedi: '', nome: 'Mario', cognome: 'Rossi'
    },
    { // iscrizione "solo pranzo CUN": date/pasti vuoti come sul form reale
      dataArrivo: null, pastoArrivo: '', dataPartenza: null, pastoPartenza: '',
      soloPranzoCun: true, parliamoLunedi: '', nome: 'Luigi', cognome: 'Bianchi'
    }
  ];
  const legacyInput = iscrizioni.map((r) => ({ ...r, soloPranzoCun: r.soloPranzoCun ? 'Si' : 'No' }));

  const risultatoNuovo = normalizzaTabellaDominio(contesto.calcolaPastiPerGiorno(iscrizioni, CONFIGURAZIONE));
  const risultatoLegacy = calcolaPastiLegacyPuro(legacyInput, CONFIGURAZIONE);

  assert.equal(risultatoNuovo.soloPranzoCunTotale, 1, 'il "solo pranzo CUN" senza date deve comunque essere contato');
  assert.deepEqual(risultatoNuovo, risultatoLegacy);
});
