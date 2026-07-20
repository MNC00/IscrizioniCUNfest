/**
 * REPOSITORY.gs
 * ---------------------------------------------------------------------------
 * Punto unico di accesso ai fogli Google Sheet del progetto e alle relative
 * verifiche di coerenza. Da qui in poi il resto del codice non deve più
 * aprire i fogli "tariffe" e "comunicazione" per posizione (getSheets()[n]):
 * usa le funzioni get*Sheet_() qui sotto.
 *
 * Perché esiste (Iterazione 2 del refactoring, luglio 2026):
 * i fogli "tariffe" e "comunicazione" erano acceduti SOLO per posizione
 * (CONFIG.SHEETS.INDEX_TARIFFE / INDEX_COMUNICAZIONE, cioè "il secondo
 * foglio", "il terzo foglio"): riordinare i tab nello spreadsheet rompeva
 * tutto in modo silenzioso. Da qui in poi si cerca prima il foglio per nome
 * (CONFIG.SHEETS.TARIFFE / COMUNICAZIONE); se il nome non corrisponde ancora
 * esattamente al tab reale, si ricade sull'indice di posizione con lo stesso
 * comportamento di prima, ma con un avviso nel Log che invita ad allineare
 * il nome in CONFIG. Nessuna rottura: solo un percorso più solido non appena
 * i nomi saranno allineati.
 * ---------------------------------------------------------------------------
 */

function getSpreadsheet_() {
  return CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Cerca un foglio per nome; se non lo trova, ricade sull'indice di posizione
 * indicato (comportamento storico) e logga un avviso invece di fallire.
 */
function getSheetByNameWithFallback_(nome, indicePosizione, fn, etichetta) {
  var ss = getSpreadsheet_();
  var sheet = nome ? ss.getSheetByName(nome) : null;

  if (sheet) return sheet;

  var fallback = ss.getSheets()[indicePosizione];
  if (fallback) {
    logEvent(CONFIG.LOG.LIVELLI.WARNING, fn,
      "Foglio \"" + etichetta + "\" non trovato con il nome \"" + nome + "\": uso temporaneamente il foglio in posizione " +
      (indicePosizione + 1) + " (\"" + fallback.getName() + "\"). Per rendere il collegamento indipendente dall'ordine dei tab, " +
      "allineare CONFIG.SHEETS." + etichetta + " al nome esatto del tab, oppure rinominare il tab.");
  }
  return fallback || null;
}

function getIscrizioniSheet_(fn) {
  return getSheetByNameWithFallback_(CONFIG.SHEETS.ISCRIZIONI, CONFIG.SHEETS.INDEX_ISCRIZIONI, fn, "ISCRIZIONI");
}

function getTariffeSheet_(fn) {
  return getSheetByNameWithFallback_(CONFIG.SHEETS.TARIFFE, CONFIG.SHEETS.INDEX_TARIFFE, fn, "TARIFFE");
}

function getComunicazioneSheet_(fn) {
  return getSheetByNameWithFallback_(CONFIG.SHEETS.COMUNICAZIONE, CONFIG.SHEETS.INDEX_COMUNICAZIONE, fn, "COMUNICAZIONE");
}

/**
 * Verifica che tutte le colonne richieste (definite come { nomeLogico: [alias...] })
 * esistano nell'header del foglio. Ritorna { ok, idx, mancanti } così il
 * chiamante può decidere di interrompere l'esecuzione con un errore leggibile
 * invece di proseguire con indici -1 e dati sbagliati.
 *
 * Uso tipico:
 *   var check = verificaColonneRichieste_(headerMap, {
 *     NOME: CONFIG.COLONNE.NOME, EMAIL: CONFIG.COLONNE.EMAIL
 *   }, FN);
 *   if (!check.ok) return;
 *   var cNome = check.idx.NOME, cEmail = check.idx.EMAIL;
 */
function verificaColonneRichieste_(headerMap, colonneRichieste, fn) {
  var idx = {};
  var mancanti = [];

  for (var nomeLogico in colonneRichieste) {
    var i = getCol(colonneRichieste[nomeLogico], headerMap);
    idx[nomeLogico] = i;
    if (i < 0) mancanti.push(nomeLogico);
  }

  if (mancanti.length > 0) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, fn,
      "Colonne obbligatorie non trovate nel foglio: " + mancanti.join(", ") +
      ". Controllare se una domanda del Form o l'intestazione della colonna è stata rinominata.");
  }

  return { ok: mancanti.length === 0, idx: idx, mancanti: mancanti };
}

/**
 * Verifica che, per ogni riga configurata in CONFIG.TARIFFE_RIGHE, la colonna A
 * del foglio tariffe contenga ancora l'etichetta di testo attesa
 * (CONFIG.TARIFFE_ETICHETTE_ATTESE), più il controllo dedicato per l'etichetta
 * della soglia "età giovane" (colonna E, riga sopra il valore).
 *
 * Le etichette del foglio tariffe si ripetono identiche nelle 3 sezioni
 * (generali/CUN/giovani): per questo la verifica non sostituisce la lettura
 * per riga fissa, la controlla soltanto, per intercettare uno spostamento di
 * riga con un errore leggibile invece di un prezzo calcolato su dati sbagliati.
 *
 * @param {Array<Array>} tariffe  Matrice restituita da foglioTariffe.getDataRange().getValues()
 * @param {string} fn             Nome della funzione chiamante, per il log
 * @return {boolean} true se tutte le etichette corrispondono, false altrimenti
 */
function verificaEtichetteTariffe_(tariffe, fn) {
  var ok = true;

  for (var key in CONFIG.TARIFFE_ETICHETTE_ATTESE) {
    var riga = CONFIG.TARIFFE_RIGHE[key];
    var atteso = CONFIG.TARIFFE_ETICHETTE_ATTESE[key];
    var trovatoRaw = tariffe[riga] ? tariffe[riga][0] : undefined;

    if (norm(trovatoRaw) !== norm(atteso)) {
      logEvent(CONFIG.LOG.LIVELLI.ERROR, fn,
        "Foglio tariffe: alla riga " + (riga + 1) + " mi aspettavo l'etichetta \"" + atteso + "\" ma ho trovato \"" +
        (trovatoRaw == null ? "" : trovatoRaw) + "\". Il foglio tariffe potrebbe essere stato riorganizzato: verificare prima di continuare.");
      ok = false;
    }
  }

  // Controllo dedicato: etichetta della soglia "età giovane" (colonna E, una riga sopra il valore)
  var rigaEtichettaEta = CONFIG.TARIFFE_RIGHE.ETA_GIOVANE_RIGA - 1;
  var colEta = CONFIG.TARIFFE_RIGHE.ETA_GIOVANE_COLONNA;
  var etichettaEtaTrovata = tariffe[rigaEtichettaEta] ? tariffe[rigaEtichettaEta][colEta] : undefined;

  if (norm(etichettaEtaTrovata) !== norm(CONFIG.TARIFFE_LABELS.ETA_GIOVANE)) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, fn,
      "Foglio tariffe: alla riga " + (rigaEtichettaEta + 1) + ", colonna " + (colEta + 1) +
      " mi aspettavo l'etichetta della soglia \"età giovane\" ma ho trovato \"" +
      (etichettaEtaTrovata == null ? "" : etichettaEtaTrovata) + "\". Verificare prima di continuare.");
    ok = false;
  }

  return ok;
}
