function onEdit(e) {
  var sheet = e.range.getSheet();
  var editedCol = e.range.getColumn();
  var startRow = e.range.getRow();
  var numRows = sheet.getLastRow();

  // Trova l'indice colonna "nuovo invio" (da buildHeaderIndex)
  var headerMap = buildHeaderIndex(sheet);
  var idxNuovoInvio = getCol(["nuovo invio", "nuovo invio mail", "invio con prezzo"], headerMap) + 1;

  // Se la colonna modificata è diversa da quella trigger, esci
  if (editedCol !== idxNuovoInvio) return;

  for (var i = 0; i < numRows; i++) {
    var row = startRow + i;
    var triggerVal = String(sheet.getRange(row, editedCol).getValue() || "").toLowerCase().trim();
    
    if (triggerVal === "invia con prezzo") {
      AutoCalcolatorePrezzi_tuamadre();
      invioMailAggiornamento(row);
      creaFoglioOrdinato();
      creaFoglioPagamento();
      generaTabellaPasti();
    }
  }
}