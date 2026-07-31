'use strict';
/**
 * tests/legacy-reference/emailLegacy.js
 * -----------------------------------------------------------------------
 * Porting FEDELE (copia letterale delle stringhe HTML) dei builder email
 * storici `buildEmailContentIniziale`/`buildEmailContentAggiornamento`
 * (src/legacy/LEGACY_Generale mail.js) e del corpo email di
 * `sendRecoveryEmails` (src/legacy/LEGACY_RecoveryEmail.js).
 *
 * Usato per verificare che Domain/Email.js produca ESATTAMENTE lo stesso
 * HTML (nessuna differenza di battitura/spazi/punteggiatura), dato che il
 * testo delle email è comunicazione ufficiale già validata dagli iscritti.
 */

function buildEmailContentInizialeLegacy(opts) {
  const { nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo } = opts;
  const oggetto = 'Conferma Iscrizione CUN Fest';
  let corpo;

  if (isSoloPranzo) {
    corpo = hasPrezzo
      ? ('<p>Ciao ' + nome + '!</p>' +
         '<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest ' + anno + ' e siamo contenti che parteciperai.</p>' +
         "<p>Il costo dell'esperienza è pari a: €" + prezzo + '.</p>' +
         '<p>Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>' +
         "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
         '<p><b>IBAN:</b> IT87W0200859280000003853446<br>' +
         '<b>Causale:</b> \u201CPre CUN e CUN Fest - nome del partecipante e codice fiscale.\u201D</p>' +
         '<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>' +
         "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
         '<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>')
      : ('<p>Ciao ' + nome + '!</p>' +
         '<p>Abbiamo ricevuto la tua iscrizione al pranzo del CUN Fest ' + anno + ' e siamo contenti che parteciperai.</p>' +
         "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa. Non appena ci saranno novità, sarai informato.</p>" +
         '<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>' +
         "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
         '<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>');
  } else {
    corpo = hasPrezzo
      ? ('<p>Ciao ' + nome + '!</p>' +
         '<p>Abbiamo ricevuto la tua iscrizione al CUN Fest ' + anno + ' e siamo contenti che parteciperai.</p>' +
         '<p>Di seguito, il riepilogo della durata della tua permanenza:</p>' +
         '<ul>' +
         '<li>Data di arrivo: ' + dataArrivo + '</li>' +
         '<li>Pasto di arrivo: ' + pastoArrivo + '</li>' +
         '<li>Data di partenza: ' + dataPartenza + '</li>' +
         '<li>Pasto di partenza: ' + pastoPartenza + '</li>' +
         '</ul>' +
         "<p>Il costo dell'esperienza è pari a: €" + prezzo + '.</p>' +
         '<p>Tieni presente che questi prezzi sono calcolati sulla base delle date fornite nella compilazione del form. Inoltre, ricordiamo che il prezzo è calcolato fino al pranzo del CUN; per quanto riguarda i giorni/pasti successivi, bisognerà prendere accordi con la casa. Qualora dovessi saltare dei pasti o per qualsiasi altro aspetto connesso alla questione prezzo, ti saremmo grati se potessi farcelo sapere rispondendo a questa email.</p>' +
         "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
         '<p><b>IBAN:</b> IT87W0200859280000003853446<br>' +
         '<b>Causale:</b> \u201CPre CUN e CUN Fest - nome del partecipante e codice fiscale\u201D.</p>' +
         '<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>' +
         '<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>' +
         "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
         '<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>')
      : ('<p>Ciao ' + nome + '!</p>' +
         '<p>Abbiamo ricevuto la tua iscrizione al CUN Fest ' + anno + ' e siamo contenti che parteciperai.</p>' +
         '<p>Di seguito, il riepilogo della durata della tua permanenza:</p>' +
         '<ul>' +
         '<li>Data di arrivo: ' + dataArrivo + '</li>' +
         '<li>Pasto di arrivo: ' + pastoArrivo + '</li>' +
         '<li>Data di partenza: ' + dataPartenza + '</li>' +
         '<li>Pasto di partenza: ' + pastoPartenza + '</li>' +
         '</ul>' +
         "<p>Purtroppo, al momento non ci sono stati comunicati i prezzi dell'esperienza da parte della gestione della casa.</p>" +
         '<p>Non appena ci saranno novità, sarai informato.</p>' +
         '<p>Per qualsiasi domanda, contattaci e cercheremo di risponderti nel minor tempo possibile.</p>' +
         "<p>Per ulteriori informazioni, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
         '<br><p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>');
  }

  const stato = hasPrezzo ? 'Inviata con prezzo' : 'Inviata senza prezzo';
  return { oggetto, corpo, stato };
}

function buildEmailContentAggiornamentoLegacy(opts) {
  const { nome, anno, hasPrezzo, isSoloPranzo, dataArrivo, pastoArrivo, dataPartenza, pastoPartenza, prezzo } = opts;
  const oggetto = 'Aggiornamento prezzi CUN Fest';
  let corpo;

  if (isSoloPranzo) {
    corpo =
      '<p>Ciao ' + nome + '!</p>' +
      '<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>' +
      (hasPrezzo
        ? '<p>Il costo del <b>pranzo del CUN Fest ' + anno + '</b> è pari a: <b>€' + prezzo + '</b>.</p>'
        : '<p>Al momento non è stato ancora comunicato il prezzo del pranzo. Ti avviseremo non appena disponibile.</p>') +
      "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
      '<p><b>IBAN:</b> IT87W0200859280000003853446<br>' +
      '<b>Causale:</b> \u201CPre CUN e CUN Fest - nome del partecipante e codice fiscale\u201D.</p>' +
      '<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>' +
      '<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>' +
      "<p>Per info, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
      '<p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>';
  } else {
    const riepilogo =
      '<p>Di seguito il riepilogo della tua permanenza:</p>' +
      '<ul>' +
      '<li>Data di arrivo: ' + dataArrivo + '</li>' +
      '<li>Pasto di arrivo: ' + pastoArrivo + '</li>' +
      '<li>Data di partenza: ' + dataPartenza + '</li>' +
      '<li>Pasto di partenza: ' + pastoPartenza + '</li>' +
      '</ul>';

    corpo =
      '<p>Ciao ' + nome + '!</p>' +
      '<p>Abbiamo ricevuto dalla gestione della casa i prezzi aggiornati.</p>' +
      riepilogo +
      (hasPrezzo
        ? "<p>Il costo dell'esperienza è pari a: <b>€" + prezzo + '</b>.</p>' +
          '<p>Tieni presente che questi prezzi sono calcolati sulle date indicate nel form. Inoltre, ricordiamo che il prezzo è calcolato fino al pranzo del CUN; per quanto riguarda i giorni/pasti successivi, bisognerà prendere accordi con la casa. Se dovessi saltare dei pasti o notassi incongruenze, rispondi a questa email per aggiornarci.</p>'
        : '<p>Il prezzo aggiornato non è ancora disponibile per la tua permanenza. Ti avviseremo appena possibile.</p>') +
      "<p>È consigliato effettuare il pagamento tramite bonifico su C/C <b>SCUOLA APOSTOLICA BERTONI</b>.</p>" +
      '<p><b>IBAN:</b> IT87W0200859280000003853446<br>' +
      '<b>Causale:</b> \u201CPre CUN e CUN Fest - nome del partecipante e codice fiscale\u201D.</p>' +
      '<p>Nel caso facessi il bonifico, rispondi a questa mail allegando la ricevuta.</p>' +
      '<p>Per qualsiasi domanda, contattaci: cercheremo di risponderti nel minor tempo possibile.</p>' +
      "<p>Per info, visita il <a href='https://sites.google.com/view/pgstimm/cunfest?authuser=0'>sito del CUNFest</a>.</p>" +
      '<p>Grazie e a presto.</p><p>Gruppo Iscrizioni</p>';
  }

  const stato = 'Nuovo invio con prezzo';
  return { oggetto, corpo, stato };
}

/** Corpo email della comunicazione di massa/recovery (identico per entrambi i flussi legacy). */
function buildEmailContentMassaLegacy(nome, testo) {
  return '<p>Ciao ' + nome + '!</p>' + '<p>' + testo + '</p>' + '<p>A prestissimo!<br>' + 'Gruppo Iscrizioni.</p>';
}

module.exports = { buildEmailContentInizialeLegacy, buildEmailContentAggiornamentoLegacy, buildEmailContentMassaLegacy };
