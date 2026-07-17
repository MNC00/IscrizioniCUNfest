/**
 * UTILS.gs
 * ---------------------------------------------------------------------------
 * Funzioni di utilità comuni, usate da più file del progetto (calcolo prezzi,
 * email, fogli derivati). Nessuna logica di business qui dentro: solo helper
 * di normalizzazione stringhe, lettura header/colonne e formattazione date.
 * Provenienza originale: "Generale mail.js".
 * ---------------------------------------------------------------------------
 */

function norm(s) {
  if (s == null) return "";
  return s.toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/\s+/g, ' ')
    .trim();
}

function buildHeaderIndex(sheet) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  header.forEach(function(name, idx){
    map[norm(name)] = idx; // 0-based
  });
  return map;
}

// ATTENZIONE: getCol prende la colonna con indice 0
function getCol(aliases, headerMap) {
  for (var i = 0; i < aliases.length; i++) {
    var k = norm(aliases[i]);
    if (Object.prototype.hasOwnProperty.call(headerMap, k)) return headerMap[k];
  }
  return -1;
}

/* se l'intestazione non esiste, crea una nuova colonna in coda con quel titolo e ritorna l'indice 0-based */
function ensureColumn(sheet, headerMap, title) {
  var key = norm(title);
  if (Object.prototype.hasOwnProperty.call(headerMap, key)) return headerMap[key];
  var lastCol = sheet.getLastColumn();
  sheet.insertColumnAfter(lastCol);
  sheet.getRange(1, lastCol + 1).setValue(title);
  // aggiorna headerMap
  headerMap[key] = lastCol; // 0-based perché lastCol era 1-based (ultima col), new index 0-based = lastCol
  return headerMap[key];
}

// Funzioni per formattare la data
function getDayName(dayIndex) {
    var days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[dayIndex];
}

function getMonthName(monthIndex) {
    var months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return months[monthIndex];
}

function formatDate(dateStr) {
    var date = new Date(dateStr);
    var dayName = getDayName(date.getDay());
    var day = String(date.getDate()).padStart(2, '0');
    var monthName = getMonthName(date.getMonth()); // I mesi vanno da 0 a 11
    var year = date.getFullYear();
    return dayName + " " + day + " " + monthName + " " + year;
}

function getAnnoAttuale() {
  return new Date().getFullYear();
}
