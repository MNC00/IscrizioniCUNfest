/**
 * Domain/Pasti.js
 * -----------------------------------------------------------------------
 * Calcolo del fabbisogno pasti/pernottamenti per giorno, a partire dall'elenco
 * delle iscrizioni. Logica di dominio PURA (nessun accesso a Sheets).
 * Riproduce fedelmente i conteggi storici di `generaTabellaPasti`, con UNA
 * differenza voluta (miglioramento rispetto al legacy, richiesto in verifica
 * live): il totale "Solo Pranzo CUN" viene sommato automaticamente alla
 * colonna Pranzo del giorno di `dataFineCun` (il giorno del pranzo del CUN),
 * cosi' la cucina ha gia' il numero corretto senza calcoli manuali. Nel
 * legacy questo totale restava in un riquadro separato, da sommare a mano.
 */

/**
 * @typedef {Object} IscrizionePasti
 * @property {Date} dataArrivo
 * @property {string} pastoArrivo
 * @property {Date} dataPartenza
 * @property {string} pastoPartenza
 * @property {boolean} soloPranzoCun
 * @property {string} parliamoLunedi Valore libero: '', 'colazione', 'pranzo', 'cena', 'me ne vado dopo lunedì'.
 * @property {string} nome
 * @property {string} cognome
 */

/**
 * @param {IscrizionePasti[]} iscrizioni
 * @param {Object} configurazione
 * @param {Date} configurazione.dataInizioCun
 * @param {Date} configurazione.dataFineCun
 * @return {{
 *   tabellaGiorni: Array<{data: Date, colazione: number, pranzo: number, cena: number, dormire: number}>,
 *   soloPranzoCunTotale: number,
 *   elencoLunedi: Array<{cognome: string, nome: string}>
 * }}
 */
function calcolaPastiPerGiorno(iscrizioni, configurazione) {
  var dataInizioCun = configurazione.dataInizioCun;
  var dataFineCun = configurazione.dataFineCun;

  var dataInizioTabella = new Date(dataInizioCun);
  dataInizioTabella.setDate(dataInizioTabella.getDate() - 8);
  var dataFineTabella = new Date(dataFineCun);
  dataFineTabella.setDate(dataFineTabella.getDate() + 1);

  var conteggi = {}; // chiave: 'yyyy-mm-dd|tipo' -> numero
  var soloPranzoCunTotale = 0;
  var extraDormireUltimoGiorno = 0;
  var pastiLunedi = [0, 0, 0]; // colazione, pranzo, cena
  var elencoLunedi = [];

  (iscrizioni || []).forEach(function (iscrizione) {
    var rispostaLunedi = normalizzaTestoSemplice_(iscrizione.parliamoLunedi);

    // Questi conteggi vanno calcolati per OGNI riga, indipendentemente dalla
    // validita' delle date di arrivo/partenza: nel legacy chi risponde "si" a
    // "Solo pranzo CUN" lascia vuote le date (il form salta quelle domande),
    // ma veniva comunque incluso nel totale "Solo Pranzo CUN" e nell'elenco
    // di chi c'e' lunedi'. Solo il ciclo giorno-per-giorno richiede date valide.
    if (iscrizione.soloPranzoCun) soloPranzoCunTotale++;
    if (rispostaLunedi !== '') {
      elencoLunedi.push({ cognome: iscrizione.cognome, nome: iscrizione.nome });
    }
    if (rispostaLunedi === 'me ne vado dopo lunedi' || rispostaLunedi === 'me ne vado dopo lunedì') {
      extraDormireUltimoGiorno++;
    }

    if (!(iscrizione.dataArrivo instanceof Date) || isNaN(iscrizione.dataArrivo) ||
        !(iscrizione.dataPartenza instanceof Date) || isNaN(iscrizione.dataPartenza)) {
      return; // riga senza date valide: ignorata dal conteggio pasti giorno-per-giorno, come nel comportamento storico
    }

    var arrivo = azzeraOra_(iscrizione.dataArrivo);
    var partenza = azzeraOra_(iscrizione.dataPartenza);
    var pastoArrivo = normalizzaTestoSemplice_(iscrizione.pastoArrivo);
    var pastoPartenza = normalizzaTestoSemplice_(iscrizione.pastoPartenza);

    var giorno = new Date(arrivo);
    while (giorno <= partenza) {
      var chiaveData = formattaChiaveData_(giorno);
      ['colazione', 'pranzo', 'cena', 'dormire'].forEach(function (tipo) {
        var chiave = chiaveData + '|' + tipo;
        if (!conteggi[chiave]) conteggi[chiave] = 0;
      });

      if (giorno.getTime() === arrivo.getTime()) {
        if (pastoArrivo === 'cena') {
          conteggi[chiaveData + '|cena']++;
        } else if (pastoArrivo === 'pranzo') {
          conteggi[chiaveData + '|pranzo']++;
          conteggi[chiaveData + '|cena']++;
        } else if (pastoArrivo === 'colazione') {
          conteggi[chiaveData + '|colazione']++;
          conteggi[chiaveData + '|pranzo']++;
          conteggi[chiaveData + '|cena']++;
        }
      } else if (giorno.getTime() === partenza.getTime() && giorno.getTime() === dataFineCun.getTime() && pastoPartenza === 'cena') {
        conteggi[chiaveData + '|colazione']++;
        conteggi[chiaveData + '|pranzo']++;
        conteggi[chiaveData + '|cena']++;
        if (rispostaLunedi === 'colazione') {
          pastiLunedi[0]++;
        } else if (rispostaLunedi === 'pranzo') {
          pastiLunedi[0]++; pastiLunedi[1]++;
        } else if (rispostaLunedi === 'cena') {
          pastiLunedi[0]++; pastiLunedi[1]++; pastiLunedi[2]++;
        }
      } else if (giorno.getTime() === partenza.getTime()) {
        if (pastoPartenza === 'colazione') {
          conteggi[chiaveData + '|colazione']++;
        } else if (pastoPartenza === 'pranzo') {
          conteggi[chiaveData + '|colazione']++;
          conteggi[chiaveData + '|pranzo']++;
        } else if (pastoPartenza === 'cena') {
          conteggi[chiaveData + '|colazione']++;
          conteggi[chiaveData + '|pranzo']++;
          conteggi[chiaveData + '|cena']++;
        }
      } else {
        conteggi[chiaveData + '|colazione']++;
        conteggi[chiaveData + '|pranzo']++;
        conteggi[chiaveData + '|cena']++;
      }

      var dorme = false;
      if (giorno < partenza) {
        dorme = true;
      } else if (giorno.getTime() === partenza.getTime() && partenza.getTime() === dataFineCun.getTime() &&
                 pastoPartenza === 'cena' && rispostaLunedi !== '') {
        dorme = true;
      }
      if (dorme) conteggi[chiaveData + '|dormire']++;

      giorno.setDate(giorno.getDate() + 1);
    }
  });

  var tabellaGiorni = [];
  var giornoCorrente = new Date(dataInizioTabella);
  var chiaveUltimoGiorno = formattaChiaveData_(dataFineTabella);
  // Il "pranzo del CUN" (a cui partecipano anche i "solo pranzo CUN", senza
  // date di arrivo/partenza compilate) si tiene il giorno di dataFineCun:
  // il loro totale va sommato alla colonna Pranzo di quel giorno, cosi' la
  // cucina ha gia' il numero corretto senza doverlo sommare a mano.
  var chiaveGiornoPranzoCun = formattaChiaveData_(azzeraOra_(dataFineCun));

  while (giornoCorrente <= dataFineTabella) {
    var chiaveData = formattaChiaveData_(giornoCorrente);
    var colazione = conteggi[chiaveData + '|colazione'] || 0;
    var pranzo = conteggi[chiaveData + '|pranzo'] || 0;
    var cena = conteggi[chiaveData + '|cena'] || 0;
    var dormire = conteggi[chiaveData + '|dormire'] || 0;

    if (chiaveData === chiaveUltimoGiorno) {
      colazione += extraDormireUltimoGiorno + pastiLunedi[0];
      pranzo += extraDormireUltimoGiorno + pastiLunedi[1];
      cena += extraDormireUltimoGiorno + pastiLunedi[2];
      dormire += extraDormireUltimoGiorno;
    }

    if (chiaveData === chiaveGiornoPranzoCun) {
      pranzo += soloPranzoCunTotale;
    }

    tabellaGiorni.push({ data: new Date(giornoCorrente), colazione: colazione, pranzo: pranzo, cena: cena, dormire: dormire });
    giornoCorrente.setDate(giornoCorrente.getDate() + 1);
  }

  elencoLunedi.sort(function (a, b) {
    var cognomeA = normalizzaTestoSemplice_(a.cognome);
    var cognomeB = normalizzaTestoSemplice_(b.cognome);
    if (cognomeA < cognomeB) return -1;
    if (cognomeA > cognomeB) return 1;
    return normalizzaTestoSemplice_(a.nome).localeCompare(normalizzaTestoSemplice_(b.nome));
  });

  return { tabellaGiorni: tabellaGiorni, soloPranzoCunTotale: soloPranzoCunTotale, elencoLunedi: elencoLunedi };
}

/** Normalizzazione leggera per confronti case/accent-insensitive, senza dipendenze esterne. */
function normalizzaTestoSemplice_(valore) {
  if (valore == null) return '';
  return valore.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

/** @param {Date} data @return {string} chiave 'yyyy-mm-dd' stabile per l'uso come chiave di mappa. */
function formattaChiaveData_(data) {
  return data.toISOString().slice(0, 10);
}
