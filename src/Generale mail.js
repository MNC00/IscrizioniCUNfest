/************** UTILITIES COMUNI **************/
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

/************** BUILDER HTML: INVIO INIZIALE **************/
function buildEmailContentIniziale(opts) {
  var { nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo } = opts;
  var oggetto = "Conferma Iscrizione CUN Fest";
  var corpo;

  if (isSoloPranzo) {
    corpo = hasPrezzo
      ? (
        "<p>Ciao " + nome + "!</p>" +
        "<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest " + anno + " e siamo contenti che parteciperai.</p>" +
        "<p>Il costo dell'esperienza è pari a: €" + prezzo + ".</p>" +
        "<p>Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>" +
        "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
        "<p><b>IBAN:</b> IT87W0200859280000003853446<br>" +
        "<b>Causale:</b> “Pre CUN e CUN Fest - nome del partecipante e codice fiscale.”</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>"
      )
      : (
        "<p>Ciao " + nome + "!</p>" +
        "<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest " + anno + " e siamo contenti che parteciperai.</p>" +
        "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa. Non appena ci saranno novità, sarai informato.</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>"
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
        "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
        "<p><b>IBAN:</b> IT87W0200859280000003853446<br>" +
        "<b>Causale:</b> “Pre CUN e CUN Fest - nome del partecipante e codice fiscale”.</p>" +
        "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>" +
        "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
        "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>"
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
        "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
        "<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>"
      );
  }

  // stato standard iniziale
  var stato = hasPrezzo ? "Inviata con prezzo" : "Inviata senza prezzo";
  return { oggetto, corpo, stato };
}

/************** BUILDER HTML: NUOVO INVIO CON PREZZO **************/
function buildEmailContentAggiornamento(opts) {
  var {
    nome, anno, hasPrezzo, isSoloPranzo,
    dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo
  } = opts;

  var oggetto = "Aggiornamento prezzi CUN Fest";
  var corpo;

  if (isSoloPranzo) {
    corpo =
      "<p>Ciao " + nome + "!</p>" +
      "<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>" +
      (hasPrezzo
        ? "<p>Il costo del <b>pranzo del CUN Fest " + anno + "</b> è pari a: <b>€" + prezzo + "</b>.</p>"
        : "<p>Al momento non è stato ancora comunicato il prezzo del pranzo. Ti avviseremo non appena disponibile.</p>") +
      "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
      "<p><b>IBAN:</b> IT87W0200859280000003853446<br>" +
      "<b>Causale:</b> “Pre CUN e CUN Fest - nome del partecipante e codice fiscale”.</p>" +
      "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>" +
      "<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>" +
      "<p>Per info, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
      "<p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>";
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
      "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
      "<p><b>IBAN:</b> IT87W0200859280000003853446<br>" +
      "<b>Causale:</b> “Pre CUN e CUN Fest - nome del partecipante e codice fiscale”.</p>" +
      "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>" +
      "<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>" +
      "<p>Per info, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
      "<p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>";
  }

  var stato = "Nuovo invio con prezzo";
  return { oggetto, corpo, stato };
}

/************** FUNZIONE 1: invio da MODULO **************/
function invioMailIscrizione() {
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sh = ss.getSheets()[0];
var headerMap = buildHeaderIndex(sh);

var cNome = getCol(['nome'], headerMap);
var cEmail = getCol(['email','mail'], headerMap);
var cPrezzo = getCol(['prezzo'], headerMap);
var cSoloPranzo = getCol(['solo pranzo', 'partecipi solo al pranzo del cun fest?', 'partecipi solo al pranzo del cun?'], headerMap);
var cDataArrivo = getCol(['data arrivo','data di arrivo'], headerMap);
var cPastoArrivo = getCol(['pasto di arrivo', 'pasto arrivo'], headerMap);
var cDataPartenza = getCol(['data partenza', 'data di partenza'], headerMap);
var cPastoPartenza = getCol(['pasto di partenza', 'pasto partenza'], headerMap);
var idxMailConferma = ensureColumn(sh, headerMap, 'Mail di conferma inviata');
var idxNuovoInvio = ensureColumn(sh, headerMap, 'Nuovo invio');


var rowIdx = sh.getLastRow();
if (rowIdx <= 1) return;


var row = sh.getRange(rowIdx, 1, 1, sh.getLastColumn()).getValues()[0];
var nome = row[cNome];
var email = row[cEmail];
if (!nome || !email) return;


var prezzo = row[cPrezzo];
var hasPrezzo = !(prezzo === "" || prezzo == null);
var isSoloPranzo = String(row[cSoloPranzo]).trim().toLowerCase() === 'si';


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
var sh = ss.getSheets()[0];
var headerMap = buildHeaderIndex(sh);

var cNome = getCol(['nome'], headerMap);
var cEmail = getCol(['email','mail'], headerMap);
var cPrezzo = getCol(['prezzo'], headerMap);
var cSoloPranzo = getCol(['solo pranzo', 'partecipi solo al pranzo del cun fest?', 'partecipi solo al pranzo del cun?'], headerMap);
var cDataArrivo = getCol(['data arrivo','data di arrivo'], headerMap);
var cPastoArrivo = getCol(['pasto di arrivo', 'pasto arrivo'], headerMap);
var cDataPartenza = getCol(['data partenza', 'data di partenza'], headerMap);
var cPastoPartenza = getCol(['pasto di partenza', 'pasto partenza'], headerMap);
var idxMailConferma = ensureColumn(sh, headerMap, 'Mail di conferma inviata');
var idxNuovoInvio = ensureColumn(sh, headerMap, 'Nuovo invio');
var idxStatoNuovoInvio = ensureColumn(sh, headerMap, 'Stato nuovo invio');
var rowIdx = riga;

var statoIniziale = String(sh.getRange(rowIdx, idxMailConferma +1).getValue() || "").toLowerCase();
if (statoIniziale === "inviata con prezzo" || statoIniziale === "inviata" || statoIniziale === "prima senza, ora con") {
sh.getRange(rowIdx, idxStatoNuovoInvio +1).setValue("Bloccato: già inviata con prezzo");
sh.getRange(rowIdx, idxNuovoInvio +1).setValue("");
return;
}


var row = sh.getRange(rowIdx, 1, 1, sh.getLastColumn()).getValues()[0];
var nome = row[cNome];
var email = row[cEmail];
if (!nome || !email) return;


var prezzo = row[cPrezzo];
var hasPrezzo = !(prezzo === "" || prezzo == null);
var isSoloPranzo = String(row[cSoloPranzo]).trim().toLowerCase() === 'si';


var dataArrivo = !isSoloPranzo && cDataArrivo >= 0 ? formatDate(row[cDataArrivo]) : "";
var pastoArrivo = !isSoloPranzo && cPastoArrivo >= 0 ? row[cPastoArrivo] : "";
var dataPartenza = !isSoloPranzo && cDataPartenza >= 0 ? formatDate(row[cDataPartenza]) : "";
var pastoPartenza = !isSoloPranzo && cPastoPartenza >= 0 ? row[cPastoPartenza] : "";


var anno = getAnnoAttuale();
var payload = buildEmailContentAggiornamento({ nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo });


MailApp.sendEmail({ to: email, subject: payload.oggetto, htmlBody: payload.corpo });
sh.getRange(rowIdx, idxStatoNuovoInvio +1).setValue(payload.stato);
sh.getRange(rowIdx, idxNuovoInvio +1).setValue("già fatto");
sh.getRange(rowIdx, idxMailConferma +1).setValue("prima senza, ora con");
}
