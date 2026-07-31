/**
 * Infrastructure/EmailSender.js
 * -----------------------------------------------------------------------
 * Unico punto di invio email. Gestisce try/catch, logging su Eventi e
 * modalità "dry run" (nessun invio reale, utile in ambienti di test).
 */

/**
 * Invia un'email, loggando sempre l'esito nel tab Eventi.
 * @param {Object} opzioni
 * @param {string} opzioni.to Destinatario.
 * @param {string} opzioni.subject Oggetto.
 * @param {string} opzioni.html Corpo HTML.
 * @param {string} [opzioni.testo] Corpo testuale alternativo.
 * @param {string} [opzioni.idIscrizione] Per il log eventi.
 * @param {string} [opzioni.tipoEvento] Tipo evento da loggare (es. 'MAIL_CONFERMA', 'MAIL_AGGIORNAMENTO', 'COMUNICAZIONE_MASSIVA').
 * @param {boolean} [opzioni.dryRun] Se true, non invia realmente (usato in ambienti di test).
 * @return {{esito: string, errore: (string|null)}}
 */
function inviaEmail(opzioni) {
  var esito = 'OK';
  var errore = null;

  if (!opzioni.to) {
    esito = 'ERRORE';
    errore = 'Destinatario mancante: nessuna email inviata.';
  } else {
    try {
      if (opzioni.dryRun) {
        Logger.log('[DRY RUN] Email non inviata realmente a %s — oggetto: %s', opzioni.to, opzioni.subject);
      } else {
        MailApp.sendEmail({
          to: opzioni.to,
          subject: opzioni.subject,
          htmlBody: opzioni.html,
          body: opzioni.testo || undefined
        });
      }
    } catch (e) {
      esito = 'ERRORE';
      errore = e && e.message ? e.message : String(e);
    }
  }

  registraEventoImmediato(
    opzioni.idIscrizione || '',
    opzioni.tipoEvento || 'EMAIL_INVIATA',
    { to: opzioni.to, subject: opzioni.subject, dryRun: !!opzioni.dryRun },
    esito,
    errore
  );

  return { esito: esito, errore: errore };
}
