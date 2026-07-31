'use strict';
/**
 * tests/prezzi.test.js
 * -----------------------------------------------------------------------
 * Verifica che Domain/Prezzi.js (calcolaPrezzo) produca ESATTAMENTE lo
 * stesso prezzo del codice legacy (tests/legacy-reference/prezziLegacy.js)
 * su un ampio ventaglio di casi, inclusi i bug storici volutamente
 * preservati (fascia Uninord/Unisud) e i rami solo-pranzo/sconti età.
 *
 * Non replica invece l'hardcode "anno 2025" per l'età: per decisione
 * esplicita, la baseline usa la data reale (vedi commento in prezziLegacy.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');
const { calcolaPrezzoLegacyPuro } = require('./legacy-reference/prezziLegacy');
const { creaRandom, interoTra, elementoCasuale, dataCasualeAttorno } = require('./support/randomData');

const contesto = creaContestoDomain();

/** Configurazione tariffaria di test (valori arbitrari ma plausibili). */
const TARIFFE_TEST = {
  giornoCompleto: 30, notte: 12, colazione: 4, pastoPrincipale: 10, soloPranzoCun: 15,
  giornoCompletoUninord: 25, notteUninord: 10, colazioneUninord: 3, pastoPrincipaleUninord: 8, tettoMassimoUninord: 120,
  giornoCompletoUnisud: 20, notteUnisud: 8, colazioneUnisud: 3, pastoPrincipaleUnisud: 7, tettoMassimoUnisud: 100,
  sconto05: 100, sconto68: 75, sconto911: 50, sconto1214: 25, etaGiovane: 17
};

const DATA_INIZIO_CUN = new Date(2026, 7, 8); // 8 agosto 2026
const DATA_FINE_CUN = new Date(2026, 7, 11); // 11 agosto 2026
const OGGI_TEST = new Date(2026, 6, 1); // 1 luglio 2026 (data di riferimento fissa per test riproducibili)

/** Adatta la configurazione "piatta" di test alla forma annidata attesa da Domain/Prezzi.js. */
function configurazioneDominioDaTariffe(t) {
  return {
    dataInizioCun: DATA_INIZIO_CUN,
    dataFineCun: DATA_FINE_CUN,
    etaGiovane: t.etaGiovane,
    soloPranzoCun: t.soloPranzoCun,
    generale: { giornoCompleto: t.giornoCompleto, notte: t.notte, colazione: t.colazione, pastoPrincipale: t.pastoPrincipale },
    uninord: { giornoCompleto: t.giornoCompletoUninord, notte: t.notteUninord, colazione: t.colazioneUninord, pastoPrincipale: t.pastoPrincipaleUninord, tettoMassimo: t.tettoMassimoUninord },
    unisud: { giornoCompleto: t.giornoCompletoUnisud, notte: t.notteUnisud, colazione: t.colazioneUnisud, pastoPrincipale: t.pastoPrincipaleUnisud, tettoMassimo: t.tettoMassimoUnisud },
    sconto0_5: t.sconto05, sconto6_8: t.sconto68, sconto9_11: t.sconto911, sconto12_14: t.sconto1214
  };
}

const PASTI_ARRIVO = ['Colazione', 'Pranzo', 'Cena', 'Dopo cena'];
const PASTI_PARTENZA = ['Colazione', 'Pranzo', 'Cena', 'Prima di colazione'];

/** Genera un'iscrizione casuale valida (date coerenti, pasti riconosciuti). */
function generaIscrizioneCasuale(rand) {
  const dataNascita = dataCasualeAttorno(rand, new Date(2010, 0, 1), 365 * 20);
  const dataArrivo = dataCasualeAttorno(rand, DATA_INIZIO_CUN, 20);
  const notti = interoTra(rand, 0, 10);
  const dataPartenza = new Date(dataArrivo);
  dataPartenza.setDate(dataPartenza.getDate() + notti);

  return {
    dataNascita,
    dataArrivo,
    pastoArrivo: elementoCasuale(rand, PASTI_ARRIVO),
    dataPartenza,
    pastoPartenza: elementoCasuale(rand, PASTI_PARTENZA),
    soloPranzoCun: false,
    oggi: OGGI_TEST
  };
}

test('calcolaPrezzo (Domain) == calcolaPrezzoLegacyPuro (legacy) su 3000 casi casuali', () => {
  const rand = creaRandom(42);
  const configurazioneDominio = configurazioneDominioDaTariffe(TARIFFE_TEST);
  let casiTestati = 0;

  for (let i = 0; i < 3000; i++) {
    const iscrizione = generaIscrizioneCasuale(rand);

    const risultatoNuovo = contesto.calcolaPrezzo(iscrizione, configurazioneDominio);
    const prezzoLegacy = calcolaPrezzoLegacyPuro({
      dataNascita: iscrizione.dataNascita,
      dataArrivo: iscrizione.dataArrivo,
      pastoArrivo: iscrizione.pastoArrivo,
      dataPartenza: iscrizione.dataPartenza,
      pastoPartenza: iscrizione.pastoPartenza,
      soloPranzoCun: 'No',
      dataInizioCun: DATA_INIZIO_CUN,
      dataFineCun: DATA_FINE_CUN,
      oggi: OGGI_TEST,
      tariffe: TARIFFE_TEST
    });

    assert.equal(
      risultatoNuovo.prezzo, prezzoLegacy,
      `Caso #${i} divergente. Iscrizione: ${JSON.stringify(iscrizione)}. Nuovo=${risultatoNuovo.prezzo} Legacy=${prezzoLegacy} Errori=${JSON.stringify(risultatoNuovo.errori)}`
    );
    casiTestati++;
  }

  assert.equal(casiTestati, 3000);
});

test('calcolaPrezzo ramo SOLO_PRANZO_CUN == legacy per tutte le fasce di sconto età', () => {
  const configurazioneDominio = configurazioneDominioDaTariffe(TARIFFE_TEST);
  const eta = [2, 6, 9, 13, 20, 40];

  eta.forEach((anni) => {
    const dataNascita = new Date(OGGI_TEST.getFullYear() - anni, OGGI_TEST.getMonth(), OGGI_TEST.getDate());
    const iscrizione = {
      dataNascita, dataArrivo: null, dataPartenza: null, pastoArrivo: '', pastoPartenza: '',
      soloPranzoCun: true, oggi: OGGI_TEST
    };
    const risultatoNuovo = contesto.calcolaPrezzo(iscrizione, configurazioneDominio);
    const prezzoLegacy = calcolaPrezzoLegacyPuro({
      dataNascita, dataArrivo: OGGI_TEST, dataPartenza: OGGI_TEST, pastoArrivo: '', pastoPartenza: '',
      soloPranzoCun: 'Si', dataInizioCun: DATA_INIZIO_CUN, dataFineCun: DATA_FINE_CUN, oggi: OGGI_TEST, tariffe: TARIFFE_TEST
    });
    assert.equal(risultatoNuovo.prezzo, prezzoLegacy, `Età ${anni}: nuovo=${risultatoNuovo.prezzo} legacy=${prezzoLegacy}`);
  });
});

test('calcolaPrezzo: solo-pranzo CUN non richiede date di arrivo/partenza (regressione già corretta)', () => {
  const configurazioneDominio = configurazioneDominioDaTariffe(TARIFFE_TEST);
  const iscrizione = {
    dataNascita: new Date(2000, 0, 1),
    dataArrivo: null, dataPartenza: null, pastoArrivo: '', pastoPartenza: '',
    soloPranzoCun: true, oggi: OGGI_TEST
  };
  const risultato = contesto.calcolaPrezzo(iscrizione, configurazioneDominio);
  assert.equal(risultato.errori.length, 0);
  assert.ok(typeof risultato.prezzo === 'number');
});

test('calcolaPrezzo: tetto massimo UNISUD con supplemento +20 per prenotazioni anticipate (>6 giorni prima della fine)', () => {
  const configurazioneDominio = configurazioneDominioDaTariffe(TARIFFE_TEST);
  // Arrivo molto presto e soggiorno lungo: prezzo sicuramente sopra il tetto massimo unisud (100).
  const dataArrivo = new Date(2026, 6, 1); // prima di dataInizioCun e ben oltre 7gg da dataFineCun
  const dataPartenza = new Date(dataArrivo);
  dataPartenza.setDate(dataPartenza.getDate() + 15);

  const iscrizione = {
    dataNascita: new Date(2010, 6, 1), dataArrivo, dataPartenza,
    pastoArrivo: 'Cena', pastoPartenza: 'Colazione', soloPranzoCun: false, oggi: OGGI_TEST
  };
  const risultatoNuovo = contesto.calcolaPrezzo(iscrizione, configurazioneDominio);
  const prezzoLegacy = calcolaPrezzoLegacyPuro({
    dataNascita: iscrizione.dataNascita, dataArrivo, dataPartenza, pastoArrivo: 'Cena', pastoPartenza: 'Colazione',
    soloPranzoCun: 'No', dataInizioCun: DATA_INIZIO_CUN, dataFineCun: DATA_FINE_CUN, oggi: OGGI_TEST, tariffe: TARIFFE_TEST
  });
  assert.equal(risultatoNuovo.prezzo, prezzoLegacy);
  assert.equal(prezzoLegacy, TARIFFE_TEST.tettoMassimoUnisud + 20, 'atteso il tetto + supplemento 20 (comportamento storico)');
});

test('calcolaPrezzo: dataPartenza oltre la fine del CUN viene troncata (comportamento storico "pippo")', () => {
  const configurazioneDominio = configurazioneDominioDaTariffe(TARIFFE_TEST);
  const dataArrivo = new Date(2026, 7, 9);
  const dataPartenza = new Date(2026, 7, 20); // ben oltre dataFineCun (11 agosto)

  const iscrizione = {
    dataNascita: new Date(2000, 0, 1), dataArrivo, dataPartenza,
    pastoArrivo: 'Colazione', pastoPartenza: 'Cena', soloPranzoCun: false, oggi: OGGI_TEST
  };
  const risultatoNuovo = contesto.calcolaPrezzo(iscrizione, configurazioneDominio);
  const prezzoLegacy = calcolaPrezzoLegacyPuro({
    dataNascita: iscrizione.dataNascita, dataArrivo, dataPartenza, pastoArrivo: 'Colazione', pastoPartenza: 'Cena',
    soloPranzoCun: 'No', dataInizioCun: DATA_INIZIO_CUN, dataFineCun: DATA_FINE_CUN, oggi: OGGI_TEST, tariffe: TARIFFE_TEST
  });
  assert.equal(risultatoNuovo.prezzo, prezzoLegacy);
});

test('calcolaPrezzo: pasto non riconosciuto produce errore esplicito (miglioramento voluto rispetto al NaN silenzioso storico)', () => {
  const configurazioneDominio = configurazioneDominioDaTariffe(TARIFFE_TEST);
  const iscrizione = {
    dataNascita: new Date(2000, 0, 1), dataArrivo: new Date(2026, 7, 9), dataPartenza: new Date(2026, 7, 10),
    pastoArrivo: 'Merenda???', pastoPartenza: 'Cena', soloPranzoCun: false, oggi: OGGI_TEST
  };
  const risultato = contesto.calcolaPrezzo(iscrizione, configurazioneDominio);
  assert.equal(risultato.prezzo, null);
  assert.ok(risultato.errori.length > 0);
});

test('calcolaPrezzo: configurazione mancante o incompleta restituisce errore esplicito senza eccezioni', () => {
  assert.doesNotThrow(() => {
    const r1 = contesto.calcolaPrezzo({}, null);
    assert.equal(r1.prezzo, null);
    const r2 = contesto.calcolaPrezzo({}, {});
    assert.equal(r2.prezzo, null);
    assert.ok(r2.errori.length > 0);
  });
});
