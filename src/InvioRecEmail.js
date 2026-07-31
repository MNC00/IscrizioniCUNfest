function invioRecovery(e) {
  var foglio = e.source.getActiveSheet();
  var rigaModificata = e.range.getRow();
  var colonnaModificata = e.range.getColumn();
  var headerMap = buildHeaderIndex(foglio);
  var idxInviaMailATutti = getCol(['invia mail a tutti?','inviare la mail?','inviare la mail','invia mail'],headerMap);
  
  // Verifica se la modifica è stata effettuata nella colonna Y (colonna 24) e se il valore è "invia con prezzo".
  if (colonnaModificata === idxInviaMailATutti + 1 && foglio.getRange(rigaModificata, colonnaModificata).getValue() === "si") {
    sendRecoveryEmails();
  }
}