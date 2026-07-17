/**
 * EMAIL.gs
 * ---------------------------------------------------------------------------
 * Costruzione e invio di tutte le comunicazioni email: conferma iscrizione,
 * aggiornamento prezzo, comunicazione di massa, assegnazione stanza.
 * Nessuna modifica di comportamento rispetto agli originali "Generale
 * mail.js", "RecoveryEmail.js" e "InvioStanze.js" (solo sendEmails): IBAN,
 * causale, URL, oggetti e firma sono stati centralizzati in CONFIG.EMAIL.
 *
 * NOTA: la "causale di pagamento" e la firma "Gruppo Iscrizioni" comparivano
 * nell'originale con lievissime differenze di punteggiatura/maiuscole tra le
 * varie occorrenze (es. punto dentro/fuori le virgolette, "Gruppo iscrizioni."
 * minuscolo in InvioStanze.js). Usando CONFIG.EMAIL.CAUSALE_PAGAMENTO e
 * CONFIG.EMAIL.MITTENTE_FIRMA in tutti i punti, questi micro-testi sono ora
 * uniformi ovunque: è l'unico effetto collaterale visibile (puramente
 * testuale/cosmetico) della centralizzazione, nessuna logica è cambiata.
 * ---------------------------------------------------------------------------
 */

/************** BUILDER HTML: INVIO INIZIALE **************/
function buildEmailContentIniziale(opts) {
  var { nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo } = opts;
  var oggetto = CONFIG.EMAIL.OGGETTO_CONFERMA_ISCRIZIONE;
  var corpo;

  if (isSoloPranzo) {
    corpo = hasPrezzo
      ? (
        "<p>Ciao " + nome + "!</p>" +
        "<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest " + anno + " e siamo contenti che parteciperai.</p>" +
        "<p>Il costo dell'esperienza è pari a: €" + prezzo + ".</p>" +
        "<p>Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>" +
        "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>" + CONFIG.EMAIL.INTESTATARIO_CONTO + "</b>.</p>" +
        "<p><b>IBAN:</b> " + CONFIG.EMAIL.IBAN + "<br>" +
        "<b>Causale:</b> " + CONFIG.EMAIL.CAUSALE_PAGAMENTO + "</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>" + CONFIG.EMAIL.MITTENTE_FIRMA + "</p>"
      )
      : (
        "<p>Ciao " + nome + "!</p>" +
        "<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest " + anno + " e siamo contenti che parteciperai.</p>" +
        "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa. Non appena ci saranno novità, sarai informato.</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>" + CONFIG.EMAIL.MITTENTE_FIRMA + "</p>"
      );
  } else {
    corpo = hasPrezzo
      ? (
        "<p>Ciao " + nome + "!</p>" +
        "<p>Abbiamo ricevuto la tua iscrizione al CUN Fest " + anno + " e siamo contenti che parteciperai.</p>" +
        "<p>Di seguito, il riepilogo della durata della tua permanenza:</p>" +
        "<ul>" +
        "<li>Data di arrivo: " + dataArrivo + "</li>" +
        "<li>Pasto di arrivo: " + pastoArrivo + "</li>" +
        "<li>Data di partenza: " + dataPartenza + "</li>" +
        "<li>Pasto di partenza: " + pastoPartenza + "</li>" +
        "</ul>" +
        "<p>Il costo dell'esperienza è pari a: €" + prezzo + ".</p>" +
        "<p>Tieni presente che questi prezzi sono calcolati sulla base delle date fornite nella compilazione del form. Inoltre, ricordiamo che il prezzo è calcolato fino al pranzo del CUN; per quanto riguarda i giorni/pasti successivi, bisognerà prendere accordi con la casa. Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>" +
        "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>" + CONFIG.EMAIL.INTESTATARIO_CONTO + "</b>.</p>" +
        "<p><b>IBAN:</b> " + CONFIG.EMAIL.IBAN + "<br>" +
        "<b>Causale:</b> " + CONFIG.EMAIL.CAUSALE_PAGAMENTO + ".</p>" +
        "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>" + CONFIG.EMAIL.MITTENTE_FIRMA + "</p>"
      )
      : (
        "<p>Ciao " + nome + "!</p>" +
        "<p>Abbiamo ricevuto la tua iscrizione al CUN Fest " + anno + " e siamo contenti che parteciperai.</p>" +
        "<p>Di seguito, il riepilogo della durata della tua permanenza:</p>" +
        "<ul>" +
        "<li>Data di arrivo: " + dataArrivo + "</li>" +
        "<li>Pasto di arrivo: " + pastoArrivo + "</li>" +
        "<li>Data di partenza: " + dataPartenza + "</li>" +
        "<li>Pasto di partenza: " + pastoPartenza + "</li>" +
        "</ul>" +
        "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa.</p>" +
        "<p>Non appena ci saranno novità, sarai informato.</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>" + CONFIG.EMAIL.MITTENTE_FIRMA + "</p>"
      );
  }

  // stato standard iniziale
  var stato = hasPrezzo ? CONFIG.STATI.MAIL_INVIATA_CON_PREZZO : CONFIG.STATI.MAIL_INVIATA_SENZA_PREZZO;
  return { oggetto, corpo, stato };
}

/************** BUILDER HTML: NUOVO INVIO CON PREZZO **************/
function buildEmailContentAggiornamento(opts) {
  var {
    nome, anno, hasPrezzo, isSoloPranzo,
    dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo
  } = opts;

  var oggetto = CONFIG.EMAIL.OGGETTO_AGGIORNAMENTO_PREZZI;
  var corpo;

  if (isSoloPranzo) {
    corpo =
      "<p>Ciao " + nome + "!</p>" +
      "<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>" +
      (hasPrezzo
        ? "<p>Il costo del <b>pranzo del CUN Fest " + anno + "</b> è pari a: <b>€" + prezzo + "</b>.</p>"
        : "<p>Al momento non è stato ancora comunicato il prezzo del pranzo. Ti avviseremo non appena disponibile.</p>") +
      "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>" + CONFIG.EMAIL.INTESTATARIO_CONTO + "</b>.</p>" +
      "<p><b>IBAN:</b> " + CONFIG.EMAIL.IBAN + "<br>" +
      "<b>Causale:</b> " + CONFIG.EMAIL.CAUSALE_PAGAMENTO + ".</p>" +
      "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>" +
      "<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>" +
      "<p>Per info, visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>" +
      "<p>Grazie e a presto.</p><p>" + CONFIG.EMAIL.MITTENTE_FIRMA + "</p>";
  } else {
    var riepilogo =
      "<p>Di seguito il riepilogo della tua permanenza:</p>" +
      "<ul>" +
      "<li>Data di arrivo: " + dataArrivo + "</li>" +
      "<li>Pasto di arrivo: " + pastoArrivo + "</li>" +
      "<li>Data di partenza: " + dataPartenza + "</li>" +
      "<li>Pasto di partenza: " + pastoPartenza + "</li>" +
      "</ul>";

    corpo =
      "<p>Ciao " + nome + "!</p>" +
      "<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>" +
      riepilogo +
      (hasPrezzo
        ? "<p>Il costo dell'esperienza è pari a: <b>€" + prezzo + "</b>.</p>" +
          "<p>Tieni presente che questi prezzi sono calcolati sulle date indicate nel form. Inoltre, ricordiamo che il prezzo è calcolato fino al pranzo del CUN; per quanto riguarda i giorni/pasti successivi, bisognerà prendere accordi con la casa. " +
          "Se dovessi saltare dei pasti o notassi incongruenze, rispondi a questa email per aggiornarci.</p>"
        : "<p>Il prezzo aggiornato non è ancora disponibile per la tua permanenza. Ti avviseremo appena possibile.</p>"
      ) +
      "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>" + CONFIG.EMAIL.INTESTATARIO_CONTO + "</b>.</p>" +
      "<p><b>IBAN:</b> " + CONFIG.EMAIL.IBAN + "<br>" +
      "<b>Causale:</b> " + CONFIG.EMAIL.CAUSALE_PAGAMENTO + ".</p>" +
      "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>" +
      "<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>" +
      "<p>Per info, visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>" +
      "<p>Grazie e a presto.</p><p>" + CONFIG.EMAIL.MITTENTE_FIRMA + "</p>";
  }

  var stato = CONFIG.STATI.NUOVO_INVIO_CON_PREZZO;
  return { oggetto, corpo, stato };
}

/************** FUNZIONE 1: invio da MODULO **************/
function invioMailIscrizione() {
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sh = ss.getSheets()[CONFIG.SHEETS.INDEX_ISCRIZIONI];
var headerMap = buildHeaderIndex(sh);

var cNome = getCol(CONFIG.COLONNE.NOME, headerMap);
var cEmail = getCol(CONFIG.COLONNE.EMAIL, headerMap);
var cPrezzo = getCol(CONFIG.COLONNE.PREZZO, headerMap);
var cSoloPranzo = getCol(CONFIG.COLONNE.SOLO_PRANZO_CUN, headerMap);
var cDataArrivo = getCol(CONFIG.COLONNE.DATA_ARRIVO, headerMap);
var cPastoArrivo = getCol(CONFIG.COLONNE.PASTO_ARRIVO, headerMap);
var cDataPartenza = getCol(CONFIG.COLONNE.DATA_PARTENZA, headerMap);
var cPastoPartenza = getCol(CONFIG.COLONNE.PASTO_PARTENZA, headerMap);
var idxMailConferma = ensureColumn(sh, headerMap, CONFIG.COLONNE.MAIL_CONFERMA_INVIATA);
var idxNuovoInvio = ensureColumn(sh, headerMap, CONFIG.COLONNE.NUOVO_INVIO);


var rowIdx = sh.getLastRow();
if (rowIdx <= 1) return;


var row = sh.getRange(rowIdx, 1, 1, sh.getLastColumn()).getValues()[0];
var nome = row[cNome];
var email = row[cEmail];
if (!nome || !email) return;


var prezzo = row[cPrezzo];
var hasPrezzo = !(prezzo === "" || prezzo == null);
var isSoloPranzo = String(row[cSoloPranzo]).trim().toLowerCase() === CONFIG.STATI.SOLO_PRANZO_SI_NORMALIZZATO;


var dataArrivo = !isSoloPranzo && cDataArrivo >= 0 ? formatDate(row[cDataArrivo]) : "";
var pastoArrivo = !isSoloPranzo && cPastoArrivo >= 0 ? row[cPastoArrivo] : "";
var dataPartenza = !isSoloPranzo && cDataPartenza >= 0 ? formatDate(row[cDataPartenza]) : "";
var pastoPartenza = !isSoloPranzo && cPastoPartenza >= 0 ? row[cPastoPartenza] : "";


var anno = getAnnoAttuale();
var payload = buildEmailContentIniziale({ nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo });


MailApp.sendEmail({ to: email, subject: payload.oggetto, htmlBody: payload.corpo });
sh.getRange(rowIdx, idxMailConferma +1).setValue(payload.stato);
sh.getRange(rowIdx, idxNuovoInvio +1).setValue("");
}

/************** FUNZIONE 2: invio da MODIFICA **************/
function invioMailAggiornamento(riga) {
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sh = ss.getSheets()[CONFIG.SHEETS.INDEX_ISCRIZIONI];
var headerMap = buildHeaderIndex(sh);

var cNome = getCol(CONFIG.COLONNE.NOME, headerMap);
var cEmail = getCol(CONFIG.COLONNE.EMAIL, headerMap);
var cPrezzo = getCol(CONFIG.COLONNE.PREZZO, headerMap);
var cSoloPranzo = getCol(CONFIG.COLONNE.SOLO_PRANZO_CUN, headerMap);
var cDataArrivo = getCol(CONFIG.COLONNE.DATA_ARRIVO, headerMap);
var cPastoArrivo = getCol(CONFIG.COLONNE.PASTO_ARRIVO, headerMap);
var cDataPartenza = getCol(CONFIG.COLONNE.DATA_PARTENZA, headerMap);
var cPastoPartenza = getCol(CONFIG.COLONNE.PASTO_PARTENZA, headerMap);
var idxMailConferma = ensureColumn(sh, headerMap, CONFIG.COLONNE.MAIL_CONFERMA_INVIATA);
var idxNuovoInvio = ensureColumn(sh, headerMap, CONFIG.COLONNE.NUOVO_INVIO);
var idxStatoNuovoInvio = ensureColumn(sh, headerMap, CONFIG.COLONNE.STATO_NUOVO_INVIO);
var rowIdx = riga;

var statoIniziale = String(sh.getRange(rowIdx, idxMailConferma +1).getValue() || "").toLowerCase();
// ATTENZIONE: "inviata" (da solo) è uno stato legacy senza corrispondenza in CONFIG.STATI,
// mantenuto identico all'originale per non alterare il comportamento del controllo anti-doppio-invio.
if (statoIniziale === CONFIG.STATI.MAIL_INVIATA_CON_PREZZO.toLowerCase() || statoIniziale === "inviata" || statoIniziale === CONFIG.STATI.MAIL_PRIMA_SENZA_ORA_CON.toLowerCase()) {
sh.getRange(rowIdx, idxStatoNuovoInvio +1).setValue(CONFIG.STATI.BLOCCATO_GIA_INVIATA);
sh.getRange(rowIdx, idxNuovoInvio +1).setValue("");
return;
}


var row = sh.getRange(rowIdx, 1, 1, sh.getLastColumn()).getValues()[0];
var nome = row[cNome];
var email = row[cEmail];
if (!nome || !email) return;


var prezzo = row[cPrezzo];
var hasPrezzo = !(prezzo === "" || prezzo == null);
var isSoloPranzo = String(row[cSoloPranzo]).trim().toLowerCase() === CONFIG.STATI.SOLO_PRANZO_SI_NORMALIZZATO;


var dataArrivo = !isSoloPranzo && cDataArrivo >= 0 ? formatDate(row[cDataArrivo]) : "";
var pastoArrivo = !isSoloPranzo && cPastoArrivo >= 0 ? row[cPastoArrivo] : "";
var dataPartenza = !isSoloPranzo && cDataPartenza >= 0 ? formatDate(row[cDataPartenza]) : "";
var pastoPartenza = !isSoloPranzo && cPastoPartenza >= 0 ? row[cPastoPartenza] : "";


var anno = getAnnoAttuale();
var payload = buildEmailContentAggiornamento({ nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo });


MailApp.sendEmail({ to: email, subject: payload.oggetto, htmlBody: payload.corpo });
sh.getRange(rowIdx, idxStatoNuovoInvio +1).setValue(payload.stato);
sh.getRange(rowIdx, idxNuovoInvio +1).setValue(CONFIG.STATI.GIA_FATTO);
sh.getRange(rowIdx, idxMailConferma +1).setValue(CONFIG.STATI.MAIL_PRIMA_SENZA_ORA_CON);
}

/************** COMUNICAZIONE DI MASSA **************/
function sendRecoveryEmails() {
  // Ottieni il foglio attivo
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[CONFIG.SHEETS.INDEX_ISCRIZIONI];
  var foglioMail = SpreadsheetApp.getActiveSpreadsheet().getSheets()[CONFIG.SHEETS.INDEX_COMUNICAZIONE];
  
  // Ottieni tutti i dati
  var data = sh.getDataRange().getValues();
  var headerMap = buildHeaderIndex(sh);
  var dataMail = foglioMail.getDataRange().getValues();
  var headerMapMail = buildHeaderIndex(foglioMail);
  console.log(dataMail);

  var cNome = getCol(CONFIG.COLONNE.NOME, headerMap);
  var cEmail = getCol(CONFIG.COLONNE.EMAIL, headerMap);
  var cOggetto = getCol(CONFIG.COLONNE_MAIL.OGGETTO, headerMapMail);
  var cTesto = getCol(CONFIG.COLONNE_MAIL.TESTO, headerMapMail);
  var idxOggettoUltimaMail = getCol(CONFIG.COLONNE_MAIL.OGGETTO_ULTIMA_MAIL, headerMapMail);
  var idxTestoUltimaMail = getCol(CONFIG.COLONNE_MAIL.TESTO_ULTIMA_MAIL, headerMapMail);
  var idxInviaMailATutti = getCol(CONFIG.COLONNE_MAIL.INVIA_A_TUTTI, headerMapMail);
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

  var subject = dataMail[CONFIG.COMUNICAZIONE_RIGA_DATI][cOggetto];
  var testo = dataMail[CONFIG.COMUNICAZIONE_RIGA_DATI][cTesto];
  var body = "<p>Ciao " + name + "!</p>" +
      "<p>" + testo + "</p>" +
      "<p>A prestissimo!<br>" +
      CONFIG.EMAIL.MITTENTE_FIRMA + ".</p>";

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

/************** ASSEGNAZIONE STANZA **************/
function sendEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.STANZE);
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues(); // Prendi i dati dalle colonne A-D

  data.forEach(function(row, index) {
    var lastName = row[CONFIG.STANZE_COLONNE.COGNOME]; // Cognome in colonna A
    var firstName = row[CONFIG.STANZE_COLONNE.NOME]; // Nome in colonna B
    var email = row[CONFIG.STANZE_COLONNE.EMAIL]; // Indirizzo email in colonna C
    var room = row[CONFIG.STANZE_COLONNE.STANZA]; // Stanza assegnata in colonna D

    // Trova i compagni di stanza
    var roommates = data
      .filter((r, i) => r[CONFIG.STANZE_COLONNE.STANZA] === room && i !== index) // Filtra per la stessa stanza e escludi la riga corrente
      .map(r => r[CONFIG.STANZE_COLONNE.NOME] + " " + r[CONFIG.STANZE_COLONNE.COGNOME]); // Crea una lista di compagni di stanza con nome e cognome

    var subject = CONFIG.EMAIL.OGGETTO_ASSEGNAZIONE_STANZA;
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
    message += "<p>" + CONFIG.EMAIL.MITTENTE_FIRMA + ".</p>";
    message += "<br>";
    message += "<p>Per ulteriori informazioni e gli ultimi aggiornamenti visita il <a href='" + CONFIG.EMAIL.SITO_CUNFEST_URL + "'>sito del CUNFest</a>.</p>";

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: message
    });
  });
  
  // Resetta il valore di H4 dopo l'invio delle email
  sheet.getRange(CONFIG.CELLE.STANZE_ESITO_INVIO).setValue(CONFIG.STATI.ESITO_STANZE_INVIATE);
}
