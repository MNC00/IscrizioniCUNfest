/**
 * Triggers/webAppAnnullamento.js
 * -----------------------------------------------------------------------
 * Punto di ingresso della Web App per l'annullamento self-service di
 * un'iscrizione (Fase D). Nessuna logica di dominio qui: si limita a
 * risolvere il token, mostrare una pagina di conferma esplicita (mai un
 * annullamento diretto su semplice GET, per evitare che link precaricati da
 * scanner email/anteprime causino annullamenti accidentali) e, solo dopo
 * il click di conferma (POST), accodare l'evento ANNULLA come qualunque
 * altro evento del sistema.
 *
 * Per attivare questa funzionalità è necessario un passaggio manuale UNA
 * TANTUM: Estensioni → Apps Script → Deploy → Nuovo deployment → tipo
 * "App web", eseguito come "Utente che accede al deployment" (o come "Me",
 * a seconda di chi deve poter inviare le email) e accesso "Chiunque"
 * (i partecipanti che aprono il link dalla mail non hanno necessariamente
 * un account Google). Vedi MANUALE_UTENTE.md.
 */

/**
 * Gestisce il caricamento iniziale del link di annullamento (dalla mail): mostra una pagina
 * di riepilogo con un pulsante di conferma esplicito, senza annullare nulla.
 * @param {Object} e Evento GET di Apps Script Web App ({parameter: {token}}).
 * @return {HtmlOutput}
 */
function doGet(e) {
  return gestisciRichiestaAnnullamento_(e, 'GET');
}

/**
 * Gestisce la conferma esplicita (submit del form dalla pagina di doGet): qui avviene
 * davvero l'annullamento, tramite lo stesso meccanismo a eventi usato da tutto il resto
 * del sistema (Infrastructure/EventQueue + Orchestration/processaEventi).
 * @param {Object} e Evento POST di Apps Script Web App ({parameter: {token}}).
 * @return {HtmlOutput}
 */
function doPost(e) {
  return gestisciRichiestaAnnullamento_(e, 'POST');
}

/**
 * Logica comune a doGet/doPost.
 * @private
 * @param {Object} e
 * @param {string} metodo 'GET' o 'POST'.
 * @return {HtmlOutput}
 */
function gestisciRichiestaAnnullamento_(e, metodo) {
  var token = e && e.parameter && e.parameter.token;
  if (!token) {
    return paginaAnnullamentoHtml_('Link non valido',
      '<p>Il link utilizzato non è valido: manca il codice di annullamento.</p>' +
      '<p>Usa il link presente nella mail di conferma della tua iscrizione.</p>');
  }

  var sheetOperativo = getOCreaFoglioOperativo();
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheetOperativo);
  var riga = trovaRigaPerTokenAnnullamento(sheetOperativo, indiceIntestazioni, token);

  if (riga < 0) {
    return paginaAnnullamentoHtml_('Link non più valido',
      '<p>Questo link di annullamento non è (più) valido: probabilmente è già stato utilizzato in precedenza, ' +
      'oppure il codice non è corretto.</p>' +
      '<p>Se pensi si tratti di un errore, scrivici rispondendo alla mail di conferma della tua iscrizione.</p>');
  }

  var iscrizione = leggiIscrizioneDaRiga(sheetOperativo, indiceIntestazioni, riga);

  if (iscrizione.statoIscrizione === STATI_ISCRIZIONE.ANNULLATA) {
    return paginaAnnullamentoHtml_('Iscrizione già annullata',
      '<p>Ciao ' + escapeHtml_(iscrizione.nome) + ', la tua iscrizione risultava già annullata in precedenza.</p>' +
      '<p>Non è necessaria nessun\'altra azione.</p>');
  }

  if (iscrizione.statoIscrizione === STATI_ISCRIZIONE.PAGATA) {
    return paginaAnnullamentoHtml_('Iscrizione già pagata',
      '<p>Ciao ' + escapeHtml_(iscrizione.nome) + ', la tua iscrizione risulta già pagata: per annullarla e gestire ' +
      'correttamente un eventuale rimborso contattaci direttamente rispondendo alla mail di conferma, ' +
      'anziché tramite questo link automatico.</p>');
  }

  if (metodo === 'GET') {
    return paginaConfermaAnnullamento_(iscrizione, token);
  }

  // POST: conferma esplicita ricevuta, si procede con l'annullamento vero e proprio.
  accodaEvento(iscrizione.idIscrizione, EVENTI_ISCRIZIONE.ANNULLA, { origine: 'webapp' });
  var risultato = processaEventiPendenti(5); // elabora subito per dare un riscontro immediato all'utente

  if (risultato.errori > 0) {
    return paginaAnnullamentoHtml_('Si è verificato un problema',
      '<p>Non siamo riusciti a completare l\'annullamento automaticamente.</p>' +
      '<p>Scrivici rispondendo alla mail di conferma della tua iscrizione: penseremo noi ad annullarla manualmente.</p>');
  }

  return paginaAnnullamentoHtml_('Iscrizione annullata',
    '<p>Ciao ' + escapeHtml_(iscrizione.nome) + ', la tua iscrizione al CUN Fest è stata annullata con successo.</p>' +
    '<p>Riceverai a breve una mail di conferma.</p>');
}

/** Escape minimo per inserire testo libero (nome) dentro l'HTML della pagina. */
function escapeHtml_(testo) {
  return (testo || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Pagina di conferma esplicita: mostrata su GET, prima di annullare davvero l'iscrizione.
 * @private
 * @param {Object} iscrizione
 * @param {string} token
 * @return {HtmlOutput}
 */
function paginaConfermaAnnullamento_(iscrizione, token) {
  var riepilogo =
    '<p>Ciao ' + escapeHtml_(iscrizione.nome) + ', stai per annullare questa iscrizione al CUN Fest:</p>' +
    '<ul>' +
    '<li><b>Nome:</b> ' + escapeHtml_(iscrizione.nome) + ' ' + escapeHtml_(iscrizione.cognome) + '</li>' +
    '<li><b>Email:</b> ' + escapeHtml_(iscrizione.email) + '</li>' +
    '</ul>' +
    '<p>L\'operazione non è reversibile in autonomia: se cambi idea dovrai ricompilare il form o scriverci.</p>' +
    '<form method="post" action="">' +
    '<input type="hidden" name="token" value="' + escapeHtml_(token) + '">' +
    '<button type="submit" style="background:#c62828;color:#fff;border:none;padding:12px 20px;' +
    'font-size:1em;border-radius:6px;cursor:pointer">Conferma annullamento</button>' +
    '</form>';
  return paginaAnnullamentoHtml_('Conferma annullamento iscrizione', riepilogo);
}

/**
 * Wrapper HTML comune a tutte le pagine della Web App di annullamento: stile minimo,
 * leggibile da smartphone (i partecipanti aprono il link quasi sempre da mobile).
 * @private
 * @param {string} titolo
 * @param {string} corpoHtml
 * @return {HtmlOutput}
 */
function paginaAnnullamentoHtml_(titolo, corpoHtml) {
  var html =
    '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + escapeHtml_(titolo) + ' - CUN Fest</title>' +
    '<style>body{font-family:Arial,sans-serif;max-width:520px;margin:32px auto;padding:0 16px;color:#222;line-height:1.5}' +
    'h1{font-size:1.3em}</style></head><body>' +
    '<h1>' + escapeHtml_(titolo) + '</h1>' + corpoHtml + '</body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(titolo + ' - CUN Fest');
}
