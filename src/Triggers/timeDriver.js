/**
 * Triggers/timeDriver.js
 * -----------------------------------------------------------------------
 * Trigger a tempo (~5 minuti) che rigenera le viste derivate e riprocessa
 * eventuali eventi rimasti in coda. Sostituisce le chiamate sincrone a
 * creaFoglioOrdinato/creaFoglioPagamento/generaTabellaPasti dentro ai
 * vecchi mioTrigger/onEdit.
 */

/** Nome della funzione da agganciare al trigger a tempo (usato anche per l'installazione idempotente). */
var NOME_FUNZIONE_TIME_DRIVER = 'rigeneraVisteSeNecessarioTrigger';

/**
 * Funzione effettivamente agganciata al trigger a tempo.
 * (Delegazione a Orchestration/rigeneraViste.js#rigeneraVisteSeNecessario)
 */
function rigeneraVisteSeNecessarioTrigger() {
  var risultato = rigeneraVisteSeNecessario();
  Logger.log('Time-driver: viste ok=%s, eventi elaborati=%s (ok=%s, errori=%s)',
    risultato.viste.ok, risultato.eventi.elaborati, risultato.eventi.ok, risultato.eventi.errori);
}

/**
 * Installa (o reinstalla) il trigger a tempo ogni 5 minuti, in modo idempotente:
 * rimuove eventuali trigger duplicati già agganciati alla stessa funzione prima di crearne uno nuovo.
 * Da eseguire una tantum dall'editor Apps Script (Esegui ▸ installaTriggerPeriodico) dopo il deploy.
 */
function installaTriggerPeriodico() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === NOME_FUNZIONE_TIME_DRIVER) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger(NOME_FUNZIONE_TIME_DRIVER)
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('Trigger periodico installato: %s ogni 5 minuti.', NOME_FUNZIONE_TIME_DRIVER);
}
