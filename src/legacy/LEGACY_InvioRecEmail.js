/**
 * LEGACY - DISABILITATO
 * Questo file NON e' piu' collegato a nessun trigger. Conservato solo per riferimento storico/rollback.
 * Il nuovo flusso vive in Domain/, Infrastructure/, Orchestration/, Triggers/. Vedi ARCHITETTURA.md.
 * L'intero contenuto originale e' racchiuso in un commento a blocco per evitare collisioni di nomi
 * di funzione globali (es. onEdit, mioTrigger, norm, getCol...) con il nuovo codice.
 */
/*
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
*/
