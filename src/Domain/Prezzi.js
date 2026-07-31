/**
 * Domain/Prezzi.js
 * -----------------------------------------------------------------------
 * Calcolo del prezzo di un'iscrizione. Logica di dominio PURA:
 * non legge/scrive fogli, non invia email. Riceve dati già estratti e una
 * configurazione già interpretata (niente indici fissi di riga/colonna qui).
 *
 * La logica di calcolo (fasce di prezzo, sconti età, tetti massimi) replica
 * fedelmente quella storica di `AutoCalcolatorePrezzi_tuamadre` per non
 * alterare gli importi già comunicati agli iscritti. Le uniche differenze
 * sono: niente accesso diretto al foglio, e restituzione esplicita di
 * errori/dettagli invece di uscite silenziose.
 */

/** Mappa dei valori "pasto" testuali verso il peso numerico usato nel calcolo (arrivo). */
var PESO_PASTO_ARRIVO = Object.freeze({
  'colazione': 3,
  'pranzo': 2,
  'cena': 1,
  'dopo cena': 0
});

/** Mappa dei valori "pasto" testuali verso il peso numerico usato nel calcolo (partenza). */
var PESO_PASTO_PARTENZA = Object.freeze({
  'colazione': 2,
  'pranzo': 1,
  'cena': 0,
  'prima di colazione': 3
});

/**
 * Calcola l'età in anni compiuti a una data di riferimento.
 * @param {Date} dataNascita
 * @param {Date} dataRiferimento
 * @return {number}
 */
function calcolaEta_(dataNascita, dataRiferimento) {
  var msPerAnno = 1000 * 60 * 60 * 24 * 365.25;
  return Math.round((azzeraOra_(dataRiferimento) - azzeraOra_(dataNascita)) / msPerAnno);
}

/** @param {Date} data @return {Date} nuova data con ore/minuti/secondi azzerati. */
function azzeraOra_(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/**
 * Applica lo sconto per fascia di età previsto in configurazione.
 * @param {number} prezzo
 * @param {number} eta
 * @param {Object} configurazione Vedi calcolaPrezzo per la forma attesa.
 * @return {number} prezzo scontato
 */
function applicaScontoEta_(prezzo, eta, configurazione) {
  var percentuale = 0;
  if (eta <= 5) percentuale = configurazione.sconto0_5;
  else if (eta <= 8) percentuale = configurazione.sconto6_8;
  else if (eta <= 11) percentuale = configurazione.sconto9_11;
  else if (eta <= 14) percentuale = configurazione.sconto12_14;
  if (!percentuale) return prezzo;
  return prezzo - (prezzo * (percentuale / 100));
}

/**
 * Calcola il prezzo di soggiorno "standard" (non solo-pranzo) per una fascia tariffaria.
 * Riproduce fedelmente i tre rami storici (generale/uninord/unisud).
 * @private
 */
function calcolaPrezzoSoggiorno_(input, tariffe, tettoMassimo, extraOltreTetto) {
  var y = tariffe.giornoCompleto * input.giorniCompleti;
  var prezzo;

  // NOTA STORICA: nella fascia "generale" la condizione è (x !== 0 && x !== 3) — corretta.
  // Nelle fasce uninord/unisud il codice originale usava (x !== 0 || x !== 3), che è sempre
  // vero (bug preesistente). Per non alterare importi già comunicati, il comportamento viene
  // riprodotto identico passando esplicitamente `condizioneEccesso` dal chiamante.
  if (input.condizioneEccesso) {
    var z = y + input.nottiEccesso * tariffe.notte;
    if (input.pastiEccesso === 1) {
      prezzo = (input.pastoPartenza === 2) ? (z + tariffe.colazione) : (y + tariffe.pastoPrincipale);
    } else if (input.pastiEccesso === 2) {
      prezzo = (input.pastoPartenza === 1 || input.pastoInizio === 1)
        ? (z + tariffe.pastoPrincipale + tariffe.colazione)
        : (z + 2 * tariffe.pastoPrincipale);
    } else {
      prezzo = y;
    }
  } else {
    prezzo = y;
  }

  if (tettoMassimo) {
    if (extraOltreTetto && prezzo > tettoMassimo) {
      prezzo = tettoMassimo + extraOltreTetto;
    } else if (prezzo > tettoMassimo) {
      prezzo = tettoMassimo;
    }
  }
  return prezzo;
}

/**
 * Calcola il prezzo di un'iscrizione.
 *
 * @param {Object} iscrizione
 * @param {Date} iscrizione.dataNascita
 * @param {Date} iscrizione.dataArrivo
 * @param {string} iscrizione.pastoArrivo Uno tra 'Colazione'|'Pranzo'|'Cena'|'Dopo cena'.
 * @param {Date} iscrizione.dataPartenza
 * @param {string} iscrizione.pastoPartenza Uno tra 'Colazione'|'Pranzo'|'Cena'|'Prima di colazione'.
 * @param {boolean} iscrizione.soloPranzoCun
 * @param {Date} [iscrizione.oggi] Data di riferimento per il calcolo dell'età (default: adesso).
 *
 * @param {Object} configurazione Configurazione già interpretata (vedi
 *   Infrastructure/SheetsReader#leggiConfigurazioneCalcoloPrezzi per come viene costruita).
 * @param {Date} configurazione.dataInizioCun
 * @param {Date} configurazione.dataFineCun
 * @param {number} configurazione.etaGiovane
 * @param {number} configurazione.generale.giornoCompleto|notte|colazione|pastoPrincipale
 * @param {number} configurazione.soloPranzoCun
 * @param {Object} configurazione.uninord {giornoCompleto,notte,colazione,pastoPrincipale,soloPranzoCun,tettoMassimo}
 * @param {Object} configurazione.unisud {giornoCompleto,notte,colazione,pastoPrincipale,soloPranzoCun,tettoMassimo}
 * @param {number} configurazione.sconto0_5|sconto6_8|sconto9_11|sconto12_14 (percentuali)
 *
 * @return {{prezzo: (number|null), dettagli: Object, errori: string[]}}
 */
function calcolaPrezzo(iscrizione, configurazione) {
  var errori = [];
  var dettagli = {};

  if (!configurazione) {
    return { prezzo: null, dettagli: dettagli, errori: ['Configurazione mancante.'] };
  }
  var campiTariffariObbligatori = ['generale', 'soloPranzoCun', 'dataInizioCun', 'dataFineCun'];
  campiTariffariObbligatori.forEach(function (campo) {
    if (!configurazione[campo]) errori.push('Configurazione tariffe incompleta (manca "' + campo + '"). Aprire il tab "Configurazione" e verificare che tutte le chiavi tariffarie abbiano un VALORE.');
  });
  if (errori.length) return { prezzo: null, dettagli: dettagli, errori: errori };

  if (!iscrizione || !(iscrizione.dataNascita instanceof Date) || isNaN(iscrizione.dataNascita)) {
    return { prezzo: null, dettagli: dettagli, errori: ['Data di nascita mancante o non valida in questa iscrizione: controllare la colonna "Data di nascita" nel tab Iscrizioni CUN Fest.'] };
  }

  var oggi = iscrizione.oggi instanceof Date ? iscrizione.oggi : new Date();

  // NOTA: chi partecipa SOLO al pranzo del CUN compila un form ridotto (il form storico
  // non richiede/valida arrivo-partenza in questo caso): il ramo va quindi risolto PRIMA
  // di richiedere data arrivo/partenza, usando solo età e configurazione.
  if (iscrizione.soloPranzoCun) {
    var etaSoloPranzo = calcolaEta_(iscrizione.dataNascita, oggi);
    dettagli.eta = etaSoloPranzo;
    dettagli.ramo = 'SOLO_PRANZO_CUN';
    var prezzoSoloPranzo = applicaScontoEta_(configurazione.soloPranzoCun, etaSoloPranzo, configurazione);
    return { prezzo: Math.ceil(prezzoSoloPranzo), dettagli: dettagli, errori: [] };
  }

  if (!(iscrizione.dataArrivo instanceof Date) || isNaN(iscrizione.dataArrivo) ||
      !(iscrizione.dataPartenza instanceof Date) || isNaN(iscrizione.dataPartenza)) {
    return { prezzo: null, dettagli: dettagli, errori: ['Date di arrivo/partenza mancanti o non valide: controllare le colonne "Data di arrivo" e "Data di partenza" per questa iscrizione.'] };
  }
  var dataInizioCun = configurazione.dataInizioCun;
  var dataFineCun = configurazione.dataFineCun;
  var limiteMeno7Giorni = new Date(dataFineCun);
  limiteMeno7Giorni.setDate(limiteMeno7Giorni.getDate() - 6);

  var dataArrivo = iscrizione.dataArrivo;
  var dataPartenza = iscrizione.dataPartenza;
  var finePeriodoRaggiunta = false;
  if (dataPartenza > dataFineCun) {
    dataPartenza = dataFineCun;
    finePeriodoRaggiunta = true;
  }

  var dataArrivoSenzaOra = azzeraOra_(dataArrivo);
  var dataPartenzaSenzaOra = azzeraOra_(dataPartenza);
  var eta = calcolaEta_(iscrizione.dataNascita, oggi);
  dettagli.eta = eta;

  var numeroNotti = Math.round((dataPartenzaSenzaOra - dataArrivoSenzaOra) / (1000 * 60 * 60 * 24));

  var pastoArrivoKey = normalizzaChiavePasto_(iscrizione.pastoArrivo);
  var pastoPartenzaKey = normalizzaChiavePasto_(iscrizione.pastoPartenza);
  var pastoInizio = Object.prototype.hasOwnProperty.call(PESO_PASTO_ARRIVO, pastoArrivoKey) ? PESO_PASTO_ARRIVO[pastoArrivoKey] : undefined;
  var pastoPartenza = finePeriodoRaggiunta
    ? 1
    : (Object.prototype.hasOwnProperty.call(PESO_PASTO_PARTENZA, pastoPartenzaKey) ? PESO_PASTO_PARTENZA[pastoPartenzaKey] : undefined);

  if (pastoInizio === undefined || pastoPartenza === undefined) {
    errori.push('Pasto di arrivo/partenza non riconosciuto ("' + iscrizione.pastoArrivo + '" / "' + iscrizione.pastoPartenza + '"): controllare che siano scritti come nel form (es. "Colazione", "Pranzo", "Cena").');
    return { prezzo: null, dettagli: dettagli, errori: errori };
  }

  if (dataPartenza.getTime() === dataFineCun.getTime() && pastoPartenza < 1) {
    pastoPartenza = 1;
  }

  var numeroPasti = 3 * numeroNotti + (pastoInizio - pastoPartenza);
  var giorniCompleti = Math.floor(numeroPasti / 3);
  var nottiEccesso = numeroNotti - giorniCompleti;
  var pastiEccesso = numeroPasti % 3;
  var x = Math.abs(pastoPartenza - pastoInizio);

  var input = {
    giorniCompleti: giorniCompleti,
    nottiEccesso: nottiEccesso,
    pastiEccesso: pastiEccesso,
    pastoInizio: pastoInizio,
    pastoPartenza: pastoPartenza
  };

  var prezzoFinale;
  if (eta > configurazione.etaGiovane && dataArrivo < dataInizioCun) {
    dettagli.ramo = 'GENERALE';
    input.condizioneEccesso = (x !== 0 && x !== 3);
    prezzoFinale = calcolaPrezzoSoggiorno_(input, configurazione.generale, null, null);
  } else if (dataArrivo >= dataInizioCun) {
    dettagli.ramo = 'UNINORD';
    input.condizioneEccesso = (x !== 0 || x !== 3); // vedi NOTA STORICA in calcolaPrezzoSoggiorno_
    prezzoFinale = calcolaPrezzoSoggiorno_(input, configurazione.uninord, configurazione.uninord.tettoMassimo, null);
  } else {
    dettagli.ramo = 'UNISUD';
    input.condizioneEccesso = (x !== 0 || x !== 3); // vedi NOTA STORICA in calcolaPrezzoSoggiorno_
    var extra = (dataArrivo < limiteMeno7Giorni) ? 20 : null;
    prezzoFinale = calcolaPrezzoSoggiorno_(input, configurazione.unisud, configurazione.unisud.tettoMassimo, extra);
  }

  if (prezzoFinale === undefined) {
    errori.push('Impossibile calcolare il prezzo con i dati forniti (date o combinazione pasti non gestita): verificare le date di arrivo/partenza e la configurazione date CUN.');
    return { prezzo: null, dettagli: dettagli, errori: errori };
  }

  prezzoFinale = applicaScontoEta_(prezzoFinale, eta, configurazione);
  return { prezzo: Math.ceil(prezzoFinale), dettagli: dettagli, errori: [] };
}

/** Normalizza il testo di un pasto per il confronto con le mappe PESO_PASTO_*. */
function normalizzaChiavePasto_(valore) {
  return (valore || '').toString().trim().toLowerCase();
}
