function sendRecoveryEmails() {
  // Ottieni il foglio attivo
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var foglioMail = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2];
  
  // Ottieni tutti i dati
  var data = sh.getDataRange().getValues();
  var headerMap = buildHeaderIndex(sh);
  var dataMail = foglioMail.getDataRange().getValues();
  var headerMapMail = buildHeaderIndex(foglioMail);
  console.log(dataMail);

  var cNome = getCol(['nome'], headerMap);
  var cEmail = getCol(['email','mail'], headerMap);
  var cOggetto = getCol(['oggetto','oggetto della mail','subject'],headerMapMail);
  var cTesto = getCol(['testo','testo della mail','testo della email','testo mail'],headerMapMail);
  var idxOggettoUltimaMail = getCol(['oggetto ultima mail','oggetto ultima mail inviata','ultimo oggetto'], headerMapMail);
  var idxTestoUltimaMail = getCol(['testo ultima mail','testo ultima mail inviata','ultimo testo'],headerMapMail);
  var idxInviaMailATutti = getCol(['invia mail a tutti?','inviare la mail?','inviare la mail','invia mail'],headerMapMail);
//  var cPrezzo = getCol(['prezzo'], headerMap);
//  var cSoloPranzo = getCol(['solo pranzo', 'partecipi solo al pranzo del cun fest?', 'partecipi solo al pranzo del cun?'], headerMap);
//  var cDataArrivo = getCol(['data arrivo','data di arrivo'], headerMap);
//  var cPastoArrivo = getCol(['pasto di arrivo', 'pasto arrivo'], headerMap);
//  var cDataPartenza = getCol(['data partenza', 'data di partenza'], headerMap);
//  var cPastoPartenza = getCol(['pasto di partenza', 'pasto partenza'], headerMap);

  // Loop attraverso tutti i dati a partire dalla seconda riga (indice 1)
  var emailArray = [];
var inviate = {};  // oggetto per tracciare gli indirizzi email già usati

for (var i = 1; i < data.length; i++) {
  emailArray[i] = data[i][cEmail];
}

for (var i = 1; i < data.length; i++) {
  var name = data[i][cNome];
  var emailAddress = emailArray[i];
  
  // Se non c'è email o è già stata usata, passa alla prossima iterazione
  if (!emailAddress || inviate[emailAddress]) {
    continue;
  }

  console.log(name, emailAddress);

  var subject = dataMail[1][cOggetto];
  var testo = dataMail[1][cTesto];
  var body = "<p>Ciao " + name + "!</p>" +
      "<p>" + testo + "</p>" +
      "<p>A prestissimo!<br>" +
      "Gruppo Iscrizioni.</p>";

  // Invia l'email in formato HTML
  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    htmlBody: body
  });

  // Salva l'indirizzo tra quelli già usati
  inviate[emailAddress] = true;

}

  // Salva l'oggetto e il testo inviato nella riga 2
  foglioMail.getRange(2, idxOggettoUltimaMail + 1).setValue(subject);
  foglioMail.getRange(2, idxTestoUltimaMail + 1).setValue(testo);
  foglioMail.getRange(2,idxInviaMailATutti +1).setValue("");
  foglioMail.getRange(2,cTesto +1).setValue("");
  foglioMail.getRange(2,cOggetto +1).setValue("");
}
