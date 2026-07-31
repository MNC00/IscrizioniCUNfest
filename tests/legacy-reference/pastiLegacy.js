'use strict';
/**
 * tests/legacy-reference/pastiLegacy.js
 * -----------------------------------------------------------------------
 * Porting FEDELE del loop di conteggio pasti/pernottamenti storico di
 * `generaTabellaPasti` (src/legacy/LEGACY_Tabella pasti.js), spogliato
 * dell'accesso a SpreadsheetApp: riceve un array di iscrizioni già estratte.
 */

/** Normalizzazione testo identica a `norm()` del legacy (e a normalizzaTestoSemplice_ del Domain). */
function norm(s) {
  if (s == null) return '';
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chiaveData(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * @param {Array<Object>} iscrizioni Ognuna: {dataArrivo, pastoArrivo, dataPartenza, pastoPartenza,
 *   soloPranzoCun (stringa 'Si'/'No'/...), parliamoLunedi (stringa libera), nome, cognome}
 * @param {Object} configurazione {dataInizioCun: Date, dataFineCun: Date}
 * @return {{tabellaGiorni: Array<{data:string,colazione:number,pranzo:number,cena:number,dormire:number}>,
 *           soloPranzoCunTotale: number, elencoLunedi: Array<[string,string]>}}
 */
function calcolaPastiLegacyPuro(iscrizioni, configurazione) {
  const dataInizioCUN = configurazione.dataInizioCun;
  const dataFineCUN = configurazione.dataFineCun;

  const dataInizioTabella = new Date(dataInizioCUN);
  dataInizioTabella.setDate(dataInizioTabella.getDate() - 8);
  const dataFineTabella = new Date(dataFineCUN);
  dataFineTabella.setDate(dataFineTabella.getDate() + 1);

  const mappaConteggi = {};
  let soloPranzoCounter = 0;
  let extraDorUltimoGiorno = 0;
  const pastiLunedi = [0, 0, 0];
  const elencoLunedi = [];

  iscrizioni.forEach((riga) => {
    const arrivo = new Date(riga.dataArrivo);
    const pastoArrivo = norm(riga.pastoArrivo);
    const partenza = new Date(riga.dataPartenza);
    const pastoPartenza = norm(riga.pastoPartenza);

    arrivo.setHours(0, 0, 0, 0);
    partenza.setHours(0, 0, 0, 0);

    const giorno = new Date(arrivo);

    const soloPranzo = norm(riga.soloPranzoCun);
    if (soloPranzo === 'si' || soloPranzo === 'sì') soloPranzoCounter++;

    const rispostaLunedi = norm(riga.parliamoLunedi);
    if (rispostaLunedi !== '') {
      elencoLunedi.push([riga.cognome, riga.nome]);
    }

    if (rispostaLunedi === 'me ne vado dopo lunedi' || rispostaLunedi === 'me ne vado dopo lunedì') {
      extraDorUltimoGiorno++;
    }

    while (giorno <= partenza) {
      const keyData = chiaveData(giorno);
      ['colazione', 'pranzo', 'cena', 'dor'].forEach((tipo) => {
        const key = keyData + '|' + tipo;
        if (!mappaConteggi[key]) mappaConteggi[key] = 0;
      });

      if (giorno.getTime() === arrivo.getTime()) {
        if (pastoArrivo === 'cena') {
          mappaConteggi[keyData + '|cena']++;
        } else if (pastoArrivo === 'pranzo') {
          mappaConteggi[keyData + '|pranzo']++;
          mappaConteggi[keyData + '|cena']++;
        } else if (pastoArrivo === 'colazione') {
          mappaConteggi[keyData + '|colazione']++;
          mappaConteggi[keyData + '|pranzo']++;
          mappaConteggi[keyData + '|cena']++;
        }
      } else if (giorno.getTime() === partenza.getTime() && giorno.getTime() === dataFineCUN.getTime() && pastoPartenza === 'cena') {
        mappaConteggi[keyData + '|colazione']++;
        mappaConteggi[keyData + '|pranzo']++;
        mappaConteggi[keyData + '|cena']++;
        if (rispostaLunedi === 'colazione') {
          pastiLunedi[0]++;
        } else if (rispostaLunedi === 'pranzo') {
          pastiLunedi[0]++; pastiLunedi[1]++;
        } else if (rispostaLunedi === 'cena') {
          pastiLunedi[0]++; pastiLunedi[1]++; pastiLunedi[2]++;
        }
      } else if (giorno.getTime() === partenza.getTime()) {
        if (pastoPartenza === 'colazione') {
          mappaConteggi[keyData + '|colazione']++;
        } else if (pastoPartenza === 'pranzo') {
          mappaConteggi[keyData + '|colazione']++;
          mappaConteggi[keyData + '|pranzo']++;
        } else if (pastoPartenza === 'cena') {
          mappaConteggi[keyData + '|colazione']++;
          mappaConteggi[keyData + '|pranzo']++;
          mappaConteggi[keyData + '|cena']++;
        }
      } else {
        mappaConteggi[keyData + '|colazione']++;
        mappaConteggi[keyData + '|pranzo']++;
        mappaConteggi[keyData + '|cena']++;
      }

      let dorme = false;
      if (giorno < partenza) {
        dorme = true;
      } else if (
        giorno.getTime() === partenza.getTime() &&
        partenza.getTime() === dataFineCUN.getTime() &&
        pastoPartenza === 'cena' && rispostaLunedi !== ''
      ) {
        dorme = true;
      }

      if (dorme) mappaConteggi[keyData + '|dor']++;

      giorno.setDate(giorno.getDate() + 1);
    }
  });

  const tabellaGiorni = [];
  const giornoCorrente = new Date(dataInizioTabella);
  const ultimaData = chiaveData(dataFineTabella);

  while (giornoCorrente <= dataFineTabella) {
    const keyData = chiaveData(giornoCorrente);
    let col = mappaConteggi[keyData + '|colazione'] || 0;
    let pra = mappaConteggi[keyData + '|pranzo'] || 0;
    let cen = mappaConteggi[keyData + '|cena'] || 0;
    let dor = mappaConteggi[keyData + '|dor'] || 0;

    if (keyData === ultimaData) {
      col += extraDorUltimoGiorno + pastiLunedi[0];
      pra += extraDorUltimoGiorno + pastiLunedi[1];
      cen += extraDorUltimoGiorno + pastiLunedi[2];
      dor += extraDorUltimoGiorno;
    }

    tabellaGiorni.push({ data: keyData, colazione: col, pranzo: pra, cena: cen, dormire: dor });
    giornoCorrente.setDate(giornoCorrente.getDate() + 1);
  }

  elencoLunedi.sort((a, b) => {
    const cognA = norm(a[0]);
    const cognB = norm(b[0]);
    if (cognA < cognB) return -1;
    if (cognA > cognB) return 1;
    const nomeA = norm(a[1]);
    const nomeB = norm(b[1]);
    return nomeA.localeCompare(nomeB);
  });

  return { tabellaGiorni, soloPranzoCunTotale: soloPranzoCounter, elencoLunedi };
}

module.exports = { calcolaPastiLegacyPuro, norm };
