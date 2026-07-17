function invioStanze(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;

  // Controlla se la cella modificata è H4 e se il valore è "INVIA"
  if (sheet.getName() === 'Stanze' && range.getA1Notation() === 'H4' && range.getValue() === 'INVIA') {
    sendEmails();
  }
}

function sendEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Stanze');
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues(); // Prendi i dati dalle colonne A-D

  data.forEach(function(row, index) {
    var lastName = row[0]; // Cognome in colonna A
    var firstName = row[1]; // Nome in colonna B
    var email = row[2]; // Indirizzo email in colonna C
    var room = row[3]; // Stanza assegnata in colonna D

    // Trova i compagni di stanza
    var roommates = data
      .filter((r, i) => r[3] === room && i !== index) // Filtra per la stessa stanza e escludi la riga corrente
      .map(r => r[1] + " " + r[0]); // Crea una lista di compagni di stanza con nome e cognome

    var subject = "Assegnazione Stanza";
    var message = `
      <p>Ciao ${firstName} !</p>

      <p>il CUN sta per inziare e quindi è arrivato il momento della tanto agognata divisione in stanze. <\p>
      <p>Dopo averci lavorato durante il PreCUN sulla base delle tue preferenze e dei vincoli logistici della casa pensiamo di essere giunti ad una quadra. <\p>
      <p>La stanza che ti abbiamo assegnato è: <strong>${room}</strong>.</p>
    `;

    if (roommates.length > 0) {
      message += `
        <p>Ed avrai il piacere di condividere la tua esperienza con:</p>
        <ul>
          ${roommates.map(name => `<li>${name}</li>`).join('')}
        </ul>
      `;
    }

    message += `
      <p>Con questa mail speriamo di poter ridurre al minimo le incomprensioni. Tuttavia, 
      ti chiediamo gentilmente di scusarci qualora non riusciremo a comunicarti preventivamente
      cambiamenti dell'ultimo minuto. Gli imprevisti possono capitare <3. </p>
`       ;
    message += "<p>Grazie e a presto,</p>";
    message += "<p>Gruppo iscrizioni.</p>";
    message += "<br>";
    message += "<p>Per ulteriori informazioni e gli ultimi aggiornamenti visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>";

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: message
    });
  });
  
  // Resetta il valore di H4 dopo l'invio delle email
  sheet.getRange('J4').setValue('Mail inviate con successo');
}
