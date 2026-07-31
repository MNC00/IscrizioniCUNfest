'use strict';
/**
 * tests/prezzi.combinazioni.test.js
 * -----------------------------------------------------------------------
 * Complemento a tests/prezzi.test.js (che usa 3000 casi CASUALI).
 *
 * Qui invece enumeriamo ESPLICITAMENTE ed ESAUSTIVAMENTE tutte le
 * combinazioni "di tipo" di iscrizione che il calcolo prezzo può incontrare,
 * cosicché nessuna combinazione dipenda dalla fortuna della randomizzazione:
 *
 *   1) ramo tariffario (GENERALE / UNINORD / UNISUD) × tutti i pasti di
 *      arrivo (4) × tutti i pasti di partenza (4) × numero di notti (0..6)
 *      = 3 x 4 x 4 x 7 = 336 combinazioni, ciascuna confrontata col legacy.
 *   2) ogni fascia di sconto età, ai valori di CONFINE esatti (0,5,6,8,9,
 *      11,12,14,15,...), sia nel ramo soggiorno (UNISUD, unico ramo che
 *      ammette età giovani con importo base "pulito") sia nel ramo
 *      SOLO_PRANZO_CUN — con un valore atteso calcolato A MANO (non solo
 *      confrontato col porting legacy) per intercettare eventuali bug
 *      condivisi da Domain e dal porting.
 *   3) tetto massimo: presenza/assenza del cap per UNINORD e UNISUD, con e
 *      senza il supplemento +20 storico, con importo atteso calcolato a mano.
 *   4) troncamento "pippo" (partenza oltre la fine del CUN) in tutti e tre
 *      i rami tariffari.
 *
 * Obiettivo: poter affermare con certezza (non solo "probabilmente", come
 * con i soli test casuali) che TUTTE le combinazioni note di calcolo prezzo
 * producono lo stesso risultato del codice legacy e che i conti tornano.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');
const { calcolaPrezzoLegacyPuro } = require('./legacy-reference/prezziLegacy');

const contesto = creaContestoDomain();

const TARIFFE_TEST = {
  giornoCompleto: 30, notte: 12, colazione: 4, pastoPrincipale: 10, soloPranzoCun: 15,
  giornoCompletoUninord: 25, notteUninord: 10, colazioneUninord: 3, pastoPrincipaleUninord: 8, tettoMassimoUninord: 120,
  giornoCompletoUnisud: 20, notteUnisud: 8, colazioneUnisud: 3, pastoPrincipaleUnisud: 7, tettoMassimoUnisud: 100,
  sconto05: 100, sconto68: 75, sconto911: 50, sconto1214: 25, etaGiovane: 17
};

const DATA_INIZIO_CUN = new Date(2026, 7, 8); // 8 agosto 2026
const DATA_FINE_CUN = new Date(2026, 7, 11); // 11 agosto 2026
const OGGI_TEST = new Date(2026, 6, 1); // 1 luglio 2026

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
const CONFIGURAZIONE = configurazioneDominioDaTariffe(TARIFFE_TEST);

const PASTI_ARRIVO = ['Colazione', 'Pranzo', 'Cena', 'Dopo cena'];
const PASTI_PARTENZA = ['Colazione', 'Pranzo', 'Cena', 'Prima di colazione'];

/** Data di nascita che produce esattamente `anni` compiuti rispetto a OGGI_TEST. */
function dataNascitaPerEta(anni) {
  return new Date(OGGI_TEST.getFullYear() - anni, OGGI_TEST.getMonth(), OGGI_TEST.getDate());
}

/** Confronta Domain vs legacy per un'iscrizione "da soggiorno" (non solo-pranzo) e ritorna entrambi i prezzi. */
function confrontaSoggiorno(iscrizione) {
  const risultato = contesto.calcolaPrezzo(iscrizione, CONFIGURAZIONE);
  const legacy = calcolaPrezzoLegacyPuro({
    dataNascita: iscrizione.dataNascita, dataArrivo: iscrizione.dataArrivo, pastoArrivo: iscrizione.pastoArrivo,
    dataPartenza: iscrizione.dataPartenza, pastoPartenza: iscrizione.pastoPartenza, soloPranzoCun: 'No',
    dataInizioCun: DATA_INIZIO_CUN, dataFineCun: DATA_FINE_CUN, oggi: OGGI_TEST, tariffe: TARIFFE_TEST
  });
  return { nuovo: risultato.prezzo, legacy, dettagli: risultato.dettagli, errori: risultato.errori };
}

// ---------------------------------------------------------------------
// 1) Esaustivo: ramo x pasto arrivo x pasto partenza x notti
// ---------------------------------------------------------------------
test('calcolaPrezzo: TUTTE le combinazioni ramo x pasti x notti (0..6) coincidono col legacy', () => {
  // Un'età rappresentativa per ciascun ramo, compatibile con la condizione che seleziona il ramo stesso.
  const SCENARI = [
    { ramo: 'GENERALE', eta: 30, dataArrivo: new Date(2026, 6, 20) },          // prima di dataInizioCun, adulto
    { ramo: 'UNINORD', eta: 30, dataArrivo: new Date(2026, 7, 9) },            // dopo/il dataInizioCun, adulto
    { ramo: 'UNINORD', eta: 10, dataArrivo: new Date(2026, 7, 9) },            // dopo dataInizioCun, giovane (verifica sconto applicato anche qui)
    { ramo: 'UNISUD', eta: 16, dataArrivo: new Date(2026, 6, 20) },            // prima di dataInizioCun, <=etaGiovane, niente sconto (16>14)
    { ramo: 'UNISUD', eta: 10, dataArrivo: new Date(2026, 6, 20) }             // prima di dataInizioCun, <=etaGiovane, con sconto
  ];
  const NOTTI = [0, 1, 2, 3, 4, 5, 6];

  const ramiOsservati = new Set();
  let combinazioniTestate = 0;

  SCENARI.forEach((scenario) => {
    const dataNascita = dataNascitaPerEta(scenario.eta);
    PASTI_ARRIVO.forEach((pastoArrivo) => {
      PASTI_PARTENZA.forEach((pastoPartenza) => {
        NOTTI.forEach((notti) => {
          const dataArrivo = scenario.dataArrivo;
          const dataPartenza = new Date(dataArrivo);
          dataPartenza.setDate(dataPartenza.getDate() + notti);

          const iscrizione = { dataNascita, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, soloPranzoCun: false, oggi: OGGI_TEST };
          const { nuovo, legacy, dettagli } = confrontaSoggiorno(iscrizione);

          assert.equal(
            nuovo, legacy,
            `Divergenza [${scenario.ramo} eta=${scenario.eta} arrivo=${pastoArrivo} partenza=${pastoPartenza} notti=${notti}]: nuovo=${nuovo} legacy=${legacy}`
          );
          assert.equal(dettagli.ramo, scenario.ramo, `Ramo inatteso per lo scenario ${scenario.ramo}/eta=${scenario.eta}: ottenuto ${dettagli.ramo}`);
          ramiOsservati.add(dettagli.ramo);
          combinazioniTestate++;
        });
      });
    });
  });

  // Garantisce che il test abbia davvero esercitato tutti e 3 i rami tariffari (nessuna scorciatoia silenziosa).
  assert.deepEqual([...ramiOsservati].sort(), ['GENERALE', 'UNINORD', 'UNISUD']);
  assert.equal(combinazioniTestate, SCENARI.length * PASTI_ARRIVO.length * PASTI_PARTENZA.length * NOTTI.length);
});

// ---------------------------------------------------------------------
// 2) Sconti età ai valori di confine esatti, con verifica aritmetica manuale
// ---------------------------------------------------------------------

/** Percentuale di sconto attesa per età, calcolata INDIPENDENTEMENTE dal porting legacy (stessa fonte: 3_2_dizionario_dati.md / config storica). */
function percentualeScontoAttesa(eta) {
  if (eta <= 5) return TARIFFE_TEST.sconto05;
  if (eta <= 8) return TARIFFE_TEST.sconto68;
  if (eta <= 11) return TARIFFE_TEST.sconto911;
  if (eta <= 14) return TARIFFE_TEST.sconto1214;
  return 0;
}

test('calcolaPrezzo: sconto età ai valori di confine (ramo UNISUD, importo base "pulito" = 40) — verifica aritmetica manuale', () => {
  // pastoArrivo='Colazione' (peso 3) + pastoPartenza='Prima di colazione' (peso 3) + 2 notti
  // => numeroPasti = 3*2 + (3-3) = 6, giorniCompleti = 2, pastiEccesso = 0 => prezzo base = giornoCompletoUnisud * 2 = 40
  // (ben sotto il tetto massimo di 100, quindi nessun capping ad "inquinare" la verifica dello sconto).
  const PREZZO_BASE = TARIFFE_TEST.giornoCompletoUnisud * 2; // 40
  // NOTA: il ramo UNISUD richiede eta <= etaGiovane (17): oltre non è più UNISUD ma GENERALE
  // (comportamento storico corretto, verificato a parte nel test combinatorio sui rami).
  const ETA_DA_TESTARE = [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  ETA_DA_TESTARE.forEach((eta) => {
    const dataNascita = dataNascitaPerEta(eta);
    const dataArrivo = new Date(2026, 6, 20); // prima di dataInizioCun
    const dataPartenza = new Date(dataArrivo);
    dataPartenza.setDate(dataPartenza.getDate() + 2);

    const iscrizione = { dataNascita, dataArrivo, pastoArrivo: 'Colazione', dataPartenza, pastoPartenza: 'Prima di colazione', soloPranzoCun: false, oggi: OGGI_TEST };
    const { nuovo, legacy, dettagli } = confrontaSoggiorno(iscrizione);

    const percentuale = percentualeScontoAttesa(eta);
    const atteso = Math.ceil(PREZZO_BASE - (PREZZO_BASE * (percentuale / 100)));

    assert.equal(dettagli.ramo, 'UNISUD', `Età ${eta}: ramo inatteso ${dettagli.ramo}`);
    assert.equal(nuovo, legacy, `Età ${eta}: Domain(${nuovo}) != legacy(${legacy})`);
    assert.equal(nuovo, atteso, `Età ${eta}: atteso calcolo manuale ${atteso} (sconto ${percentuale}%), ottenuto ${nuovo}`);
  });
});

test('calcolaPrezzo: al confine etaGiovane, età 17 resta UNISUD ed età 18 passa a GENERALE (cambio ramo storico)', () => {
  const dataArrivo = new Date(2026, 6, 20); // prima di dataInizioCun
  const dataPartenza = new Date(dataArrivo); dataPartenza.setDate(dataPartenza.getDate() + 2);
  const base = { dataArrivo, pastoArrivo: 'Colazione', dataPartenza, pastoPartenza: 'Prima di colazione', soloPranzoCun: false, oggi: OGGI_TEST };

  const risultato17 = contesto.calcolaPrezzo(Object.assign({}, base, { dataNascita: dataNascitaPerEta(17) }), CONFIGURAZIONE);
  const risultato18 = contesto.calcolaPrezzo(Object.assign({}, base, { dataNascita: dataNascitaPerEta(18) }), CONFIGURAZIONE);

  assert.equal(risultato17.dettagli.ramo, 'UNISUD');
  assert.equal(risultato18.dettagli.ramo, 'GENERALE');
});

test('calcolaPrezzo: sconto età ai valori di confine (ramo SOLO_PRANZO_CUN, importo base = tariffa fissa) — verifica aritmetica manuale', () => {
  const PREZZO_BASE = TARIFFE_TEST.soloPranzoCun; // 15
  const ETA_DA_TESTARE = [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 25, 60];

  ETA_DA_TESTARE.forEach((eta) => {
    const dataNascita = dataNascitaPerEta(eta);
    const iscrizione = { dataNascita, dataArrivo: null, dataPartenza: null, pastoArrivo: '', pastoPartenza: '', soloPranzoCun: true, oggi: OGGI_TEST };
    const risultato = contesto.calcolaPrezzo(iscrizione, CONFIGURAZIONE);
    const legacy = calcolaPrezzoLegacyPuro({
      dataNascita, dataArrivo: OGGI_TEST, dataPartenza: OGGI_TEST, pastoArrivo: '', pastoPartenza: '',
      soloPranzoCun: 'Si', dataInizioCun: DATA_INIZIO_CUN, dataFineCun: DATA_FINE_CUN, oggi: OGGI_TEST, tariffe: TARIFFE_TEST
    });

    const percentuale = percentualeScontoAttesa(eta);
    const atteso = Math.ceil(PREZZO_BASE - (PREZZO_BASE * (percentuale / 100)));

    assert.equal(risultato.prezzo, legacy, `Età ${eta}: Domain(${risultato.prezzo}) != legacy(${legacy})`);
    assert.equal(risultato.prezzo, atteso, `Età ${eta}: atteso calcolo manuale ${atteso} (sconto ${percentuale}%), ottenuto ${risultato.prezzo}`);
  });
});

// ---------------------------------------------------------------------
// 3) Tetto massimo: tutte le combinazioni presenza/assenza cap x rami x supplemento +20
// ---------------------------------------------------------------------
test('calcolaPrezzo: tetto massimo UNINORD — sotto il tetto NON viene toccato, sopra viene capato esattamente', () => {
  const dataNascita = dataNascitaPerEta(30); // adulto, nessuno sconto età, non interferisce col calcolo
  const dataArrivo = new Date(2026, 7, 9); // >= dataInizioCun => ramo UNINORD

  // La finestra CUN condivisa (8-11 agosto) dura solo 3 giorni: un soggiorno di 10 notti la
  // supererebbe innescando il troncamento "pippo" (che altera pastoPartenza) prima ancora di
  // raggiungere il tetto. Per isolare la sola logica di capping, qui si usa localmente una
  // dataFineCun molto più lontana (stessa dataInizioCun, per non cambiare ramo).
  const dataFineCunAmpia = new Date(2026, 8, 30);
  const configurazioneAmpia = configurazioneDominioDaTariffe(TARIFFE_TEST);
  configurazioneAmpia.dataFineCun = dataFineCunAmpia;

  function confrontaConFineCunAmpia(iscrizione) {
    const risultato = contesto.calcolaPrezzo(iscrizione, configurazioneAmpia);
    const legacy = calcolaPrezzoLegacyPuro({
      dataNascita: iscrizione.dataNascita, dataArrivo: iscrizione.dataArrivo, pastoArrivo: iscrizione.pastoArrivo,
      dataPartenza: iscrizione.dataPartenza, pastoPartenza: iscrizione.pastoPartenza, soloPranzoCun: 'No',
      dataInizioCun: DATA_INIZIO_CUN, dataFineCun: dataFineCunAmpia, oggi: OGGI_TEST, tariffe: TARIFFE_TEST
    });
    return { nuovo: risultato.prezzo, legacy, dettagli: risultato.dettagli };
  }

  // Caso "sotto il tetto": trucco pasti "puliti" (Colazione/Prima di colazione), 2 notti.
  // numeroPasti = 6, giorniCompleti = 2, pastiEccesso = 0 => prezzo = giornoCompletoUninord * 2 = 50 (< tetto 120).
  {
    const dataPartenza = new Date(dataArrivo); dataPartenza.setDate(dataPartenza.getDate() + 2);
    const iscrizione = { dataNascita, dataArrivo, pastoArrivo: 'Colazione', dataPartenza, pastoPartenza: 'Prima di colazione', soloPranzoCun: false, oggi: OGGI_TEST };
    const { nuovo, legacy, dettagli } = confrontaConFineCunAmpia(iscrizione);
    assert.equal(dettagli.ramo, 'UNINORD');
    assert.equal(nuovo, legacy);
    assert.equal(nuovo, TARIFFE_TEST.giornoCompletoUninord * 2, 'sotto il tetto il prezzo non deve essere alterato');
  }

  // Caso "sopra il tetto": 10 notti con lo stesso trucco => prezzo grezzo = 25*10 = 250 > 120 => capato a 120.
  {
    const dataPartenza = new Date(dataArrivo); dataPartenza.setDate(dataPartenza.getDate() + 10);
    const iscrizione = { dataNascita, dataArrivo, pastoArrivo: 'Colazione', dataPartenza, pastoPartenza: 'Prima di colazione', soloPranzoCun: false, oggi: OGGI_TEST };
    const { nuovo, legacy, dettagli } = confrontaConFineCunAmpia(iscrizione);
    assert.equal(dettagli.ramo, 'UNINORD');
    assert.equal(nuovo, legacy);
    assert.equal(nuovo, TARIFFE_TEST.tettoMassimoUninord, 'sopra il tetto il prezzo deve essere capato esattamente al tetto (uninord non ha supplemento +20)');
  }
});

test('calcolaPrezzo: tetto massimo UNISUD — sotto il tetto, sopra ma prenotazione tardiva (solo tetto), sopra e prenotazione anticipata (tetto+20)', () => {
  const dataNascita = dataNascitaPerEta(16); // <=etaGiovane, niente sconto età (16>14): isola l'effetto del tetto

  // "Sotto il tetto": 2 notti, prezzo grezzo = 20*2 = 40 (< 100).
  {
    const dataArrivo = new Date(2026, 6, 20);
    const dataPartenza = new Date(dataArrivo); dataPartenza.setDate(dataPartenza.getDate() + 2);
    const iscrizione = { dataNascita, dataArrivo, pastoArrivo: 'Colazione', dataPartenza, pastoPartenza: 'Prima di colazione', soloPranzoCun: false, oggi: OGGI_TEST };
    const { nuovo, legacy, dettagli } = confrontaSoggiorno(iscrizione);
    assert.equal(dettagli.ramo, 'UNISUD');
    assert.equal(nuovo, legacy);
    assert.equal(nuovo, TARIFFE_TEST.giornoCompletoUnisud * 2);
  }

  // "Sopra il tetto, prenotazione TARDIVA" (arrivo Aug 6, cioè >= limiteMeno7Giorni=Aug5, quindi niente +20):
  // 10 notti, prezzo grezzo = 20*10 = 200 > 100 => capato a 100 (senza supplemento).
  {
    const dataArrivo = new Date(2026, 7, 6);
    const dataPartenza = new Date(dataArrivo); dataPartenza.setDate(dataPartenza.getDate() + 10);
    const iscrizione = { dataNascita, dataArrivo, pastoArrivo: 'Colazione', dataPartenza, pastoPartenza: 'Prima di colazione', soloPranzoCun: false, oggi: OGGI_TEST };
    const { nuovo, legacy, dettagli } = confrontaSoggiorno(iscrizione);
    assert.equal(dettagli.ramo, 'UNISUD');
    assert.equal(nuovo, legacy);
    assert.equal(nuovo, TARIFFE_TEST.tettoMassimoUnisud, 'prenotazione tardiva: capato al tetto SENZA supplemento +20');
  }

  // "Sopra il tetto, prenotazione ANTICIPATA" (arrivo Aug 1, < limiteMeno7Giorni=Aug5): capato a tetto+20.
  {
    const dataArrivo = new Date(2026, 6, 1);
    const dataPartenza = new Date(dataArrivo); dataPartenza.setDate(dataPartenza.getDate() + 15);
    const iscrizione = { dataNascita, dataArrivo, pastoArrivo: 'Cena', dataPartenza, pastoPartenza: 'Colazione', soloPranzoCun: false, oggi: OGGI_TEST };
    const { nuovo, legacy, dettagli } = confrontaSoggiorno(iscrizione);
    assert.equal(dettagli.ramo, 'UNISUD');
    assert.equal(nuovo, legacy);
    assert.equal(nuovo, TARIFFE_TEST.tettoMassimoUnisud + 20, 'prenotazione anticipata: capato al tetto CON supplemento +20');
  }
});

// ---------------------------------------------------------------------
// 4) Troncamento "pippo" (partenza oltre la fine del CUN) in tutti i rami
// ---------------------------------------------------------------------
test('calcolaPrezzo: troncamento "pippo" (dataPartenza > dataFineCun) coincide col legacy in tutti e 3 i rami', () => {
  const SCENARI = [
    { ramo: 'GENERALE', eta: 30, dataArrivo: new Date(2026, 6, 25) },
    { ramo: 'UNINORD', eta: 30, dataArrivo: new Date(2026, 7, 9) },
    { ramo: 'UNISUD', eta: 10, dataArrivo: new Date(2026, 6, 25) }
  ];

  SCENARI.forEach((scenario) => {
    const dataNascita = dataNascitaPerEta(scenario.eta);
    const dataPartenza = new Date(2026, 7, 25); // ben oltre dataFineCun (11 agosto)
    const iscrizione = {
      dataNascita, dataArrivo: scenario.dataArrivo, pastoArrivo: 'Colazione',
      dataPartenza, pastoPartenza: 'Cena', soloPranzoCun: false, oggi: OGGI_TEST
    };
    const { nuovo, legacy, dettagli } = confrontaSoggiorno(iscrizione);
    assert.equal(dettagli.ramo, scenario.ramo, `Scenario ${scenario.ramo}: ramo ottenuto ${dettagli.ramo}`);
    assert.equal(nuovo, legacy, `Scenario ${scenario.ramo} (pippo): Domain(${nuovo}) != legacy(${legacy})`);
  });
});
