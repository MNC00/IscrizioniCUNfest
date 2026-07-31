function creaFoglioOrdinato() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRisposte = ss.getSheetByName("Iscrizioni CUN Fest"); // Foglio collegato al modulo
  var sheetOrdinato = ss.getSheetByName("Iscrizioni ordinate");    // Foglio da aggiornare

  // Leggi tutto il contenuto del foglio con le risposte
  var data = sheetRisposte.getDataRange().getValues();

  // Cancella tutto nel foglio ordinato (tranne il foglio stesso)
  sheetOrdinato.clearContents();

  // Copia i dati nel foglio ordinato
  sheetOrdinato.getRange(1, 1, data.length, data[0].length).setValues(data);

  // Ordina per colonna 2 (B), partendo dalla riga 2 (per mantenere l’intestazione)
  sheetOrdinato.getRange(2, 1, data.length - 1, data[0].length).sort([{ column: 2, ascending: true },{ column: 3, ascending: true }]);
// Colora l’intestazione
sheetOrdinato.getRange(1, 1, 1, data[0].length).setBackground("#d9ead3").setFontWeight("bold");
sheetOrdinato.setFrozenRows(1);

// Adatta larghezza colonne al contenuto
for (var col = 1; col <= data[0].length; col++) {sheetOrdinato.autoResizeColumn(col);}
}