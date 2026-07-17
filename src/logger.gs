/**
 * LOGGER.gs
 * ---------------------------------------------------------------------------
 * Sistema minimo di log leggibile (Fase 5.2 della roadmap). Ogni chiamata a
 * logEvent() aggiunge una riga al tab "Log" del foglio Google, con data/ora,
 * livello, funzione, messaggio ed eventuale dettaglio errore.
 *
 * Il nome del tab e l'eventuale ID dello spreadsheet sono letti da CONFIG
 * (config.gs): CONFIG.SHEETS.LOG e CONFIG.SPREADSHEET_ID.
 *
 * Uso tipico dentro una funzione esistente:
 *   logEvent(CONFIG.LOG.LIVELLI.INFO, "invioMailIscrizione", "Mail di conferma inviata a " + email);
 *   logEvent(CONFIG.LOG.LIVELLI.ERROR, "AutoCalcolatorePrezzi_tuamadre", "Tariffe mancanti nel foglio tariffe", err);
 * ---------------------------------------------------------------------------
 */

/**
 * Scrive una nuova riga nel tab di log.
 * @param {string} level         Livello dell'evento: "INFO" | "WARNING" | "ERROR" (vedi CONFIG.LOG.LIVELLI).
 * @param {string} functionName  Nome della funzione/trigger che genera il log (es. "mioTrigger").
 * @param {string} message       Messaggio descrittivo leggibile, in linguaggio semplice.
 * @param {*} [errorDetail]      (Opzionale) Dettaglio dell'errore: oggetto Error, stringa o qualsiasi valore utile al debug.
 */
function logEvent(level, functionName, message, errorDetail) {
  try {
    var sheet = getOrCreateLogSheet_();

    var dataOra = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG.LOG.FORMATO_DATA_ORA);
    var dettaglioErrore = formatErrorDetail_(errorDetail);

    sheet.appendRow([dataOra, level, functionName, message, dettaglioErrore]);
  } catch (e) {
    // Il logging non deve mai far fallire la funzione chiamante: in caso di
    // problemi (es. foglio non raggiungibile) si registra solo in console.
    console.error("logEvent ha fallito la scrittura del log:", e, {level: level, functionName: functionName, message: message});
  }
}

/**
 * Restituisce il tab "Log" (da CONFIG.SHEETS.LOG), creandolo con intestazione
 * formattata se non esiste ancora.
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateLogSheet_() {
  var ss = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  var sheet = ss.getSheetByName(CONFIG.SHEETS.LOG);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.LOG);
    sheet.appendRow(CONFIG.LOG.INTESTAZIONI);
    sheet.getRange(1, 1, 1, CONFIG.LOG.INTESTAZIONI.length)
         .setBackground(CONFIG.LOG.COLORE_INTESTAZIONE)
         .setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Normalizza il dettaglio errore in una stringa leggibile per la cella di log.
 * Gestisce sia oggetti Error/eccezioni Apps Script sia valori semplici.
 * @param {*} errorDetail
 * @return {string}
 */
function formatErrorDetail_(errorDetail) {
  if (errorDetail == null) return "";
  if (errorDetail instanceof Error) {
    return errorDetail.message + (errorDetail.stack ? " | " + errorDetail.stack : "");
  }
  if (typeof errorDetail === "object") {
    try {
      return JSON.stringify(errorDetail);
    } catch (e) {
      return String(errorDetail);
    }
  }
  return String(errorDetail);
}
