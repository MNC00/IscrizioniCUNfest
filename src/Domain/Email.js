/**
 * Domain/Email.js
 * -----------------------------------------------------------------------
 * Costruzione pura dei contenuti delle email (nessun invio qui: quello è
 * responsabilità di Infrastructure/EmailSender.js). Ogni funzione restituisce
 * {oggetto, html, testo} pronto per essere passato all'infrastruttura.
 */

var LINK_SITO_CUNFEST = 'https://sites.google.com/view/pgstimm/cunfest?authuser=0';
var IBAN_CUNFEST = 'IT87W0200859280000003853446';
var INTESTATARIO_CUNFEST = 'SCUOLA APOSTOLICA BERTONI';

/** Rimuove i tag HTML per ottenere una versione testuale approssimativa del corpo email. */
function convertiHtmlInTesto_(html) {
  return html
    .replace(/<\/(p|li|ul|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function paragrafoPagamento_() {
  return (
    "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>" + INTESTATARIO_CUNFEST + "</b>.</p>" +
    "<p><b>IBAN:</b> " + IBAN_CUNFEST + "<br>" +
    "<b>Causale:</b> “Pre CUN e CUN Fest - nome del partecipante e codice fiscale”.</p>" +
    "<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>"
  );
}

/**
 * Variante storica del paragrafo pagamento usata SOLO nell'email di conferma iniziale
 * per il ramo "solo pranzo CUN" con prezzo disponibile: nel codice legacy questo blocco
 * aveva punteggiatura diversa (punto dentro le virgolette) e non includeva la frase
 * "Nel caso facessi il bonifico...". Preservato esattamente per compatibilità.
 */
function paragrafoPagamentoSoloPranzoConfermaConPrezzo_() {
  return (
    "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>" + INTESTATARIO_CUNFEST + "</b>.</p>" +
    "<p><b>IBAN:</b> " + IBAN_CUNFEST + "<br>" +
    "<b>Causale:</b> “Pre CUN e CUN Fest - nome del partecipante e codice fiscale.”</p>"
  );
}

function paragrafoChiusura_() {
  return (
    "<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>" +
    "<p>Per ulteriori informazioni, visita il <a href='" + LINK_SITO_CUNFEST + "'>sito del CUNFest</a>.</p>" +
    "<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>"
  );
}

/**
 * Variante storica del paragrafo di chiusura usata SOLO nell'email di aggiornamento prezzo:
 * nel codice legacy la formulazione era leggermente diversa da quella dell'email di conferma
 * (":" invece di "e", "Per info" invece di "Per ulteriori informazioni", nessun <br> iniziale).
 * Preservato esattamente per compatibilità.
 */
function paragrafoChiusuraAggiornamento_() {
  return (
    "<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>" +
    "<p>Per info, visita il <a href='" + LINK_SITO_CUNFEST + "'>sito del CUNFest</a>.</p>" +
    "<p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>"
  );
}

function riepilogoSoggiorno_(contesto) {
  return (
    "<p>Di seguito, il riepilogo della durata della tua permanenza:</p>" +
    "<ul>" +
    "<li>Data di arrivo: " + contesto.dataArrivoFormattata + "</li>" +
    "<li>Pasto di arrivo: " + contesto.pastoArrivo + "</li>" +
    "<li>Data di partenza: " + contesto.dataPartenzaFormattata + "</li>" +
    "<li>Pasto di partenza: " + contesto.pastoPartenza + "</li>" +
    "</ul>"
  );
}

/**
 * Variante storica del riepilogo soggiorno usata SOLO nell'email di aggiornamento prezzo:
 * formulazione leggermente diversa da quella di conferma ("Di seguito il riepilogo della
 * tua permanenza" invece di "Di seguito, il riepilogo della durata della tua permanenza").
 * Preservato esattamente per compatibilità.
 */
function riepilogoSoggiornoAggiornamento_(contesto) {
  return (
    "<p>Di seguito il riepilogo della tua permanenza:</p>" +
    "<ul>" +
    "<li>Data di arrivo: " + contesto.dataArrivoFormattata + "</li>" +
    "<li>Pasto di arrivo: " + contesto.pastoArrivo + "</li>" +
    "<li>Data di partenza: " + contesto.dataPartenzaFormattata + "</li>" +
    "<li>Pasto di partenza: " + contesto.pastoPartenza + "</li>" +
    "</ul>"
  );
}

/**
 * Paragrafo con il link per l'annullamento self-service dell'iscrizione (Fase D).
 * Aggiunto SOLO se viene fornito un link (contesto.linkAnnullamento): se il link manca
 * (es. Web App non ancora distribuita) l'email resta identica a prima, per compatibilità.
 * @param {string} link
 */
function paragrafoAnnullamento_(link) {
  return (
    "<p style='font-size:0.9em;color:#555'>Se non potrai più partecipare, puoi annullare la tua " +
    "iscrizione in autonomia da questo link: <a href='" + link + "'>Annulla la mia iscrizione</a>.</p>"
  );
}

/**
 * Costruisce l'email di conferma iscrizione (primo invio, dal form).
 * @param {Object} contesto
 * @param {string} contesto.nome
 * @param {number} contesto.anno
 * @param {boolean} contesto.hasPrezzo
 * @param {boolean} contesto.isSoloPranzo
 * @param {string} contesto.dataArrivoFormattata
 * @param {string} contesto.pastoArrivo
 * @param {string} contesto.dataPartenzaFormattata
 * @param {string} contesto.pastoPartenza
 * @param {number} [contesto.prezzo]
 * @param {string} [contesto.linkAnnullamento] Link self-service di annullamento (Fase D); se assente non viene mostrato nulla.
 * @return {{oggetto: string, html: string, testo: string}}
 */
function costruisciEmailConferma(contesto) {
  var oggetto = 'Conferma Iscrizione CUN Fest';
  var html;

  if (contesto.isSoloPranzo) {
    html = contesto.hasPrezzo
      ? ("<p>Ciao " + contesto.nome + "!</p>" +
         "<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest " + contesto.anno + " e siamo contenti che parteciperai.</p>" +
         "<p>Il costo dell'esperienza è pari a: €" + contesto.prezzo + ".</p>" +
         "<p>Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>" +
         paragrafoPagamentoSoloPranzoConfermaConPrezzo_() + paragrafoChiusura_())
      : ("<p>Ciao " + contesto.nome + "!</p>" +
         "<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest " + contesto.anno + " e siamo contenti che parteciperai.</p>" +
         "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa. Non appena ci saranno novità, sarai informato.</p>" +
         paragrafoChiusura_());
  } else {
    html = contesto.hasPrezzo
      ? ("<p>Ciao " + contesto.nome + "!</p>" +
         "<p>Abbiamo ricevuto la tua iscrizione al CUN Fest " + contesto.anno + " e siamo contenti che parteciperai.</p>" +
         riepilogoSoggiorno_(contesto) +
         "<p>Il costo dell'esperienza è pari a: €" + contesto.prezzo + ".</p>" +
         "<p>Tieni presente che questi prezzi sono calcolati sulla base delle date fornite nella compilazione del form. Inoltre, ricordiamo che il prezzo è calcolato fino al pranzo del CUN; per quanto riguarda i giorni/pasti successivi, bisognerà prendere accordi con la casa. Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>" +
         paragrafoPagamento_() + paragrafoChiusura_())
      : ("<p>Ciao " + contesto.nome + "!</p>" +
         "<p>Abbiamo ricevuto la tua iscrizione al CUN Fest " + contesto.anno + " e siamo contenti che parteciperai.</p>" +
         riepilogoSoggiorno_(contesto) +
         "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa.</p>" +
         "<p>Non appena ci saranno novità, sarai informato.</p>" +
         paragrafoChiusura_());
  }

  if (contesto.linkAnnullamento) {
    html += paragrafoAnnullamento_(contesto.linkAnnullamento);
  }

  return { oggetto: oggetto, html: html, testo: convertiHtmlInTesto_(html) };
}

/**
 * Costruisce l'email di aggiornamento prezzo (reinvio manuale).
 * @param {Object} contesto Stessa forma di costruisciEmailConferma.
 * @return {{oggetto: string, html: string, testo: string}}
 */
function costruisciEmailAggiornamento(contesto) {
  var oggetto = 'Aggiornamento prezzi CUN Fest';
  var html;

  if (contesto.isSoloPranzo) {
    html =
      "<p>Ciao " + contesto.nome + "!</p>" +
      "<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>" +
      (contesto.hasPrezzo
        ? "<p>Il costo del <b>pranzo del CUN Fest " + contesto.anno + "</b> è pari a: <b>€" + contesto.prezzo + "</b>.</p>"
        : "<p>Al momento non è stato ancora comunicato il prezzo del pranzo. Ti avviseremo non appena disponibile.</p>") +
      paragrafoPagamento_() + paragrafoChiusuraAggiornamento_();
  } else {
    html =
      "<p>Ciao " + contesto.nome + "!</p>" +
      "<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>" +
      riepilogoSoggiornoAggiornamento_(contesto) +
      (contesto.hasPrezzo
        ? ("<p>Il costo dell'esperienza è pari a: <b>€" + contesto.prezzo + "</b>.</p>" +
           "<p>Tieni presente che questi prezzi sono calcolati sulle date indicate nel form. Inoltre, ricordiamo che il prezzo è calcolato fino al pranzo del CUN; per quanto riguarda i giorni/pasti successivi, bisognerà prendere accordi con la casa. Se dovessi saltare dei pasti o notassi incongruenze, rispondi a questa email per aggiornarci.</p>")
        : "<p>Il prezzo aggiornato non è ancora disponibile per la tua permanenza. Ti avviseremo appena possibile.</p>") +
      paragrafoPagamento_() + paragrafoChiusuraAggiornamento_();
  }

  if (contesto.linkAnnullamento) {
    html += paragrafoAnnullamento_(contesto.linkAnnullamento);
  }

  return { oggetto: oggetto, html: html, testo: convertiHtmlInTesto_(html) };
}

/**
 * Costruisce l'email di conferma annullamento iscrizione (Fase D): inviata dopo che
 * un'iscrizione è transitata a STATI_ISCRIZIONE.ANNULLATA (sia da self-service via
 * Web App, sia da annullamento manuale di un operatore).
 * @param {Object} contesto
 * @param {string} contesto.nome
 * @return {{oggetto: string, html: string, testo: string}}
 */
function costruisciEmailAnnullamento(contesto) {
  var oggetto = 'Iscrizione annullata - CUN Fest';
  var html =
    "<p>Ciao " + contesto.nome + ".</p>" +
    "<p>Ti confermiamo che la tua iscrizione al CUN Fest è stata annullata come richiesto.</p>" +
    "<p>Se si è trattato di un errore o hai cambiato idea, scrivici pure rispondendo a questa email: ti aiuteremo a reiscriverti.</p>" +
    "<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>";
  return { oggetto: oggetto, html: html, testo: convertiHtmlInTesto_(html) };
}

/**
 * Converte un testo libero (scritto in una cella del foglio) in HTML con paragrafi/interruzioni
 * di riga preservati, cosi' un corpo mail su più righe non collassa in un unico blocco.
 * Regola: una riga vuota separa due paragrafi (<p>...</p> distinti); un singolo "a capo"
 * dentro lo stesso paragrafo diventa <br> (es. testo scritto con Alt+Invio in una cella).
 * @param {string} testoLibero
 * @return {string} HTML con i paragrafi.
 */
function testoLiberoAHtml_(testoLibero) {
  if (!testoLibero) return '';
  var normalizzato = testoLibero.toString().replace(/\r\n/g, '\n').trim();
  if (!normalizzato) return '';
  return normalizzato
    .split(/\n\s*\n/) // due o più "a capo" consecutivi = nuovo paragrafo
    .filter(function (paragrafo) { return paragrafo.trim() !== ''; })
    .map(function (paragrafo) { return '<p>' + paragrafo.replace(/\n/g, '<br>') + '</p>'; })
    .join('');
}

/**
 * Costruisce un'email per una comunicazione di massa personalizzata solo nel saluto.
 * @param {string} nome
 * @param {string} oggetto
 * @param {string} testoLibero Testo libero scritto dall'operatore nel foglio "Comunicazioni".
 *   Può contenere più paragrafi/righe: vedi testoLiberoAHtml_.
 * @return {{oggetto: string, html: string, testo: string}}
 */
function costruisciEmailMassa(nome, oggetto, testoLibero) {
  var html =
    "<p>Ciao " + nome + "!</p>" +
    testoLiberoAHtml_(testoLibero) +
    "<p>A prestissimo!<br>Gruppo Iscrizioni.</p>";
  return { oggetto: oggetto, html: html, testo: convertiHtmlInTesto_(html) };
}
