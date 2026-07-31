'use strict';
/**
 * tests/legacy-reference/prezziLegacy.js
 * -----------------------------------------------------------------------
 * Porting FEDELE (riga per riga) della logica di calcolo prezzo storica di
 * `AutoCalcolatorePrezzi_tuamadre` (src/legacy/LEGACY_Calcolatore prezzi.js),
 * spogliata di ogni accesso a SpreadsheetApp: riceve valori già estratti.
 *
 * Serve come "verità storica" per i test di parità in tests/prezzi.test.js:
 * se il nuovo Domain/Prezzi.js diverge da questo comportamento (a parità di
 * bug storici noti, vedi sotto), è una regressione da correggere nel refactor.
 *
 * DEVIAZIONE CONCORDATA COL COMMITTENTE (non è una regressione, è un fix):
 * il codice legacy calcolava "oggi" per l'età con l'anno HARDCODED a 2025
 * (`new Date(2025, oggi.getMonth(), oggi.getDate())`), un evidente refuso.
 * Su richiesta esplicita, questa baseline di riferimento usa la data reale
 * iniettata (`oggi`), esattamente come fa il nuovo Domain/Prezzi.js: i test
 * confrontano quindi il comportamento "corretto", non il bug dell'anno fisso.
 *
 * BUG STORICO VOLUTAMENTE PRESERVATO (perché già comunicato agli iscritti):
 * nei rami UNINORD/UNISUD la condizione `(x !== 0 || x !== 3)` è sempre vera
 * (errore di logica: doveva essere `&&` come nel ramo GENERALE). Il porting
 * qui sotto riproduce l'effetto (condizione sempre vera), e Domain/Prezzi.js
 * fa lo stesso esplicitamente (vedi commenti "NOTA STORICA" in quel file).
 */

/** @param {string} valore Testo esatto della cella "Pasto di arrivo". @return {number|undefined} */
function pesoPastoArrivoLegacy(valore) {
  if (valore === 'Colazione') return 3;
  if (valore === 'Pranzo') return 2;
  if (valore === 'Cena') return 1;
  if (valore === 'Dopo cena') return 0;
  return undefined;
}

/** @param {string} valore Testo esatto della cella "Pasto di partenza". @return {number|undefined} */
function pesoPastoPartenzaLegacy(valore) {
  if (valore === 'Colazione') return 2;
  if (valore === 'Pranzo') return 1;
  if (valore === 'Cena') return 0;
  if (valore === 'Prima di colazione') return 3;
  return undefined;
}

/** Applica lo sconto età esattamente come il blocco if/else-if ripetuto 2 volte nel legacy. */
function applicaScontoEtaLegacy(prezzo, eta, t) {
  if (eta <= 5) return prezzo - prezzo * (t.sconto05 / 100);
  if (eta > 5 && eta <= 8) return prezzo - prezzo * (t.sconto68 / 100);
  if (eta > 8 && eta <= 11) return prezzo - prezzo * (t.sconto911 / 100);
  if (eta > 11 && eta <= 14) return prezzo - prezzo * (t.sconto1214 / 100);
  return prezzo;
}

/**
 * Porting del corpo del loop `for (var riga = 1; riga < dati.length; riga++)`.
 *
 * @param {Object} input
 * @param {Date} input.dataNascita
 * @param {Date} input.dataArrivo
 * @param {string} input.pastoArrivo Testo esatto: 'Colazione'|'Pranzo'|'Cena'|'Dopo cena'.
 * @param {Date} input.dataPartenza
 * @param {string} input.pastoPartenza Testo esatto: 'Colazione'|'Pranzo'|'Cena'|'Prima di colazione'.
 * @param {string} input.soloPranzoCun Testo esatto della cella: 'Si' per attivare il ramo, qualsiasi altra cosa altrimenti.
 * @param {Date} input.dataInizioCun
 * @param {Date} input.dataFineCun
 * @param {Date} input.oggi Data di riferimento per l'età (vedi nota in testa al file).
 * @param {Object} input.tariffe {giornoCompleto, notte, colazione, pastoPrincipale, soloPranzoCun, etaGiovane,
 *   giornoCompletoUninord, notteUninord, colazioneUninord, pastoPrincipaleUninord, tettoMassimoUninord,
 *   giornoCompletoUnisud, notteUnisud, colazioneUnisud, pastoPrincipaleUnisud, tettoMassimoUnisud,
 *   sconto05, sconto68, sconto911, sconto1214}
 * @return {number} Prezzo finale arrotondato per eccesso (Math.ceil), come scritto storicamente in cella.
 */
function calcolaPrezzoLegacyPuro(input) {
  const t = input.tariffe;

  const dataInizio = new Date(input.dataArrivo);
  let dataFine = new Date(input.dataPartenza);
  const dataNascita = new Date(input.dataNascita);
  const oggi = input.oggi instanceof Date ? input.oggi : new Date();

  const limiteDataFine = input.dataFineCun;
  const dataInizioCun = input.dataInizioCun;
  const limiteMeno7Giorni = new Date(limiteDataFine);
  limiteMeno7Giorni.setDate(limiteMeno7Giorni.getDate() - 6);

  let pippo = false;
  if (dataFine > limiteDataFine) {
    dataFine = limiteDataFine;
    pippo = true;
  }

  const dataInizioSenzaOra = new Date(dataInizio.getFullYear(), dataInizio.getMonth(), dataInizio.getDate());
  const dataFineSenzaOra = new Date(dataFine.getFullYear(), dataFine.getMonth(), dataFine.getDate());
  const dataNascitaSenzaOra = new Date(dataNascita.getFullYear(), dataNascita.getMonth(), dataNascita.getDate());
  const oggiSenzaOra = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());

  const numeroNotti = Math.round((dataFineSenzaOra - dataInizioSenzaOra) / (1000 * 60 * 60 * 24));
  const eta = Math.round((oggiSenzaOra - dataNascitaSenzaOra) / (1000 * 60 * 60 * 24 * 365.25));

  if (input.soloPranzoCun !== 'Si') {
    const pastoInizio = pesoPastoArrivoLegacy(input.pastoArrivo);
    let pastoPartenza = pippo ? 1 : pesoPastoPartenzaLegacy(input.pastoPartenza);

    if (dataFine.getTime() === limiteDataFine.getTime() && pastoPartenza < 1) {
      pastoPartenza = 1;
    }

    const numeroPasti = 3 * numeroNotti + (pastoInizio - pastoPartenza);
    const giorniCompleti = Math.floor(numeroPasti / 3);
    const nottiEccesso = numeroNotti - giorniCompleti;
    const pastiEccesso = numeroPasti % 3;
    const x = Math.abs(pastoPartenza - pastoInizio);

    let prezzoFinale, y, z;

    if (eta > t.etaGiovane && dataInizio < dataInizioCun) {
      // ramo GENERALE: condizione corretta (&&)
      y = t.giornoCompleto * giorniCompleti;
      if (x !== 0 && x !== 3) {
        z = y + nottiEccesso * t.notte;
        if (pastiEccesso === 1) {
          prezzoFinale = pastoPartenza === 2 ? z + t.colazione : y + t.pastoPrincipale;
        } else if (pastiEccesso === 2) {
          prezzoFinale = (pastoPartenza === 1 || pastoInizio === 1) ? z + t.pastoPrincipale + t.colazione : z + 2 * t.pastoPrincipale;
        } else {
          prezzoFinale = y;
        }
      } else {
        prezzoFinale = y;
      }
    } else if (dataInizio >= dataInizioCun) {
      // ramo UNINORD: condizione (x!==0 || x!==3) sempre vera (bug storico preservato)
      y = t.giornoCompletoUninord * giorniCompleti;
      z = y + nottiEccesso * t.notteUninord;
      if (pastiEccesso === 1) {
        prezzoFinale = pastoPartenza === 2 ? z + t.colazioneUninord : y + t.pastoPrincipaleUninord;
      } else if (pastiEccesso === 2) {
        prezzoFinale = (pastoPartenza === 1 || pastoInizio === 1) ? z + t.pastoPrincipaleUninord + t.colazioneUninord : z + 2 * t.pastoPrincipaleUninord;
      } else {
        prezzoFinale = y;
      }
      if (prezzoFinale > t.tettoMassimoUninord) prezzoFinale = t.tettoMassimoUninord;
    } else {
      // ramo UNISUD: condizione (x!==0 || x!==3) sempre vera (bug storico preservato)
      y = t.giornoCompletoUnisud * giorniCompleti;
      z = y + nottiEccesso * t.notteUnisud;
      if (pastiEccesso === 1) {
        prezzoFinale = pastoPartenza === 2 ? z + t.colazioneUnisud : y + t.pastoPrincipaleUnisud;
      } else if (pastiEccesso === 2) {
        prezzoFinale = (pastoPartenza === 1 || pastoInizio === 1) ? z + t.pastoPrincipaleUnisud + t.colazioneUnisud : z + 2 * t.pastoPrincipaleUnisud;
      } else {
        prezzoFinale = y;
      }
      if (dataInizio < limiteMeno7Giorni && prezzoFinale > t.tettoMassimoUnisud) {
        prezzoFinale = t.tettoMassimoUnisud + 20;
      } else if (prezzoFinale > t.tettoMassimoUnisud) {
        prezzoFinale = t.tettoMassimoUnisud;
      }
    }

    prezzoFinale = applicaScontoEtaLegacy(prezzoFinale, eta, t);
    return Math.ceil(prezzoFinale);
  }

  let prezzoSoloPranzo = t.soloPranzoCun;
  prezzoSoloPranzo = applicaScontoEtaLegacy(prezzoSoloPranzo, eta, t);
  return Math.ceil(prezzoSoloPranzo);
}

module.exports = { calcolaPrezzoLegacyPuro, pesoPastoArrivoLegacy, pesoPastoPartenzaLegacy, applicaScontoEtaLegacy };
