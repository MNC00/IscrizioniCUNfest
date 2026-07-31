/**
 * Orchestration/verificaStruttura.js
 * -----------------------------------------------------------------------
 * Autodiagnosi della struttura dei fogli: verifica che le colonne attese da
 * script siano effettivamente presenti (per nome, non per indice) nei tab
 * chiave. Pensata come prima linea di difesa contro modifiche accidentali
 * alla struttura del Google Form (domande aggiunte/rimosse/rinominate),
 * che altrimenti causerebbero errori poco chiari a metà elaborazione.
 *
 * Non blocca nulla da sola: espone solo un risultato leggibile, usato dal
 * menu operatore ("🔍 Verifica struttura fogli") e da un controllo leggero
 * all'apertura del foglio (onOpen), che segnala eventuali problemi con un
 * avviso non invasivo (toast) invece di un errore a runtime durante un'azione.
 */

/**
 * @typedef {Object} EsitoVerificaFoglio
 * @property {string} foglio
 * @property {boolean} esiste
 * @property {boolean} obbligatorio
 * @property {boolean} ok
 * @property {string[]} colonneMancanti
 * @property {string} messaggio
 */

/**
 * Verifica le colonne di un singolo foglio rispetto a un elenco di colonne attese.
 * @private
 * @param {string} nomeFoglio
 * @param {string[]} colonneRichieste Nomi di colonna attesi (verificati per nome, non per posizione).
 * @param {boolean} obbligatorio Se true, l'assenza del foglio stesso è considerata un problema.
 * @return {EsitoVerificaFoglio}
 */
function verificaColonneFoglio_(nomeFoglio, colonneRichieste, obbligatorio) {
  var sheet = getSpreadsheetAttivo().getSheetByName(nomeFoglio);
  if (!sheet) {
    return {
      foglio: nomeFoglio, esiste: false, obbligatorio: obbligatorio, ok: !obbligatorio,
      colonneMancanti: colonneRichieste,
      messaggio: 'Il tab "' + nomeFoglio + '" non esiste.' + (obbligatorio ? ' Questo tab è obbligatorio.' : ' Verrà creato automaticamente quando serve.')
    };
  }
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var mancanti = colonneRichieste.filter(function (colonna) { return trovaColonna([colonna], indiceIntestazioni) < 0; });
  return {
    foglio: nomeFoglio, esiste: true, obbligatorio: obbligatorio, ok: mancanti.length === 0,
    colonneMancanti: mancanti,
    messaggio: mancanti.length ? 'Mancano le colonne: ' + mancanti.join(', ') : 'OK'
  };
}

/**
 * Esegue l'autodiagnosi completa della struttura dei fogli chiave.
 * Ogni controllo è indipendente: un problema su un tab non impedisce di
 * verificare gli altri, così il report è sempre completo.
 * @return {{ok: boolean, controlli: EsitoVerificaFoglio[]}}
 */
function verificaStrutturaFogli() {
  // Il tab del Form deve avere solo i campi "anagrafici" raccolti dalle domande: ID_ISCRIZIONE,
  // STATO_ISCRIZIONE e PREZZO sono proprietà del tab operativo, create automaticamente lì.
  var colonneRawObbligatorie = [
    COLONNE_ISCRIZIONI.NOME, COLONNE_ISCRIZIONI.COGNOME, COLONNE_ISCRIZIONI.EMAIL,
    COLONNE_ISCRIZIONI.DATA_NASCITA, COLONNE_ISCRIZIONI.DATA_ARRIVO, COLONNE_ISCRIZIONI.PASTO_ARRIVO,
    COLONNE_ISCRIZIONI.DATA_PARTENZA, COLONNE_ISCRIZIONI.PASTO_PARTENZA, COLONNE_ISCRIZIONI.SOLO_PRANZO_CUN
  ];
  var colonneOperativoObbligatorie = [
    COLONNE_ISCRIZIONI.ID_ISCRIZIONE, COLONNE_ISCRIZIONI.STATO_ISCRIZIONE,
    COLONNE_ISCRIZIONI.NOME, COLONNE_ISCRIZIONI.COGNOME, COLONNE_ISCRIZIONI.EMAIL, COLONNE_ISCRIZIONI.PREZZO
  ];

  var controlli = [
    verificaColonneFoglio_(FOGLI.ISCRIZIONI, colonneRawObbligatorie, true),
    verificaColonneFoglio_(FOGLI.ISCRIZIONI_OPERATIVO, colonneOperativoObbligatorie, false),
    verificaColonneFoglio_(FOGLI.CONFIGURAZIONE, [COLONNE_CONFIGURAZIONE.CHIAVE, COLONNE_CONFIGURAZIONE.VALORE], true),
    verificaColonneFoglio_(FOGLI.PAGAMENTO, [COLONNE_PAGAMENTO.ID_ISCRIZIONE, COLONNE_PAGAMENTO.PREZZO], false),
    verificaColonneFoglio_(FOGLI.COMUNICAZIONI, [COLONNE_COMUNICAZIONI.ID_COMM, COLONNE_COMUNICAZIONI.OGGETTO, COLONNE_COMUNICAZIONI.TESTO, COLONNE_COMUNICAZIONI.STATO], false),
    verificaColonneFoglio_(FOGLI.EVENTI, [COLONNE_EVENTI.ID_EVENTO, COLONNE_EVENTI.ID_ISCRIZIONE, COLONNE_EVENTI.TIPO_EVENTO, COLONNE_EVENTI.STATO], false)
  ];

  return { ok: controlli.every(function (c) { return c.ok; }), controlli: controlli };
}

/**
 * Costruisce un riepilogo testuale leggibile da un operatore non tecnico a partire
 * dall'esito di verificaStrutturaFogli().
 * @param {{ok: boolean, controlli: EsitoVerificaFoglio[]}} esito
 * @return {string}
 */
function riepilogoVerificaStruttura_(esito) {
  if (esito.ok) return 'Tutto ok: la struttura dei fogli è quella attesa.';
  var righe = esito.controlli
    .filter(function (c) { return !c.ok; })
    .map(function (c) { return '• ' + c.foglio + ': ' + c.messaggio; });
  return 'Attenzione, sono stati rilevati questi problemi:\n\n' + righe.join('\n') +
    '\n\nQuesto può succedere se le domande del Google Form sono state modificate/rinominate. ' +
    'Verificare le intestazioni (riga 1) dei fogli indicati.';
}

/** Menu: esegue la verifica struttura e mostra un riepilogo leggibile. */
function menuVerificaStrutturaFogli() {
  var esito = verificaStrutturaFogli();
  SpreadsheetApp.getUi().alert('Verifica struttura fogli', riepilogoVerificaStruttura_(esito), SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Controllo leggero da richiamare in onOpen: non blocca l'apertura del foglio,
 * mostra solo un toast (non invasivo) se ci sono problemi obbligatori da controllare.
 */
function segnalaProblemiStrutturaSePresenti_() {
  try {
    var esito = verificaStrutturaFogli();
    var problemiObbligatori = esito.controlli.filter(function (c) { return !c.ok && c.obbligatorio; });
    if (problemiObbligatori.length) {
      getSpreadsheetAttivo().toast(
        'Rilevati problemi di struttura su: ' + problemiObbligatori.map(function (c) { return c.foglio; }).join(', ') +
        '. Usa il menu "Iscrizioni CUN Fest ▸ 🔍 Verifica struttura fogli" per i dettagli.',
        '⚠️ Attenzione', 10
      );
    }
  } catch (e) {
    Logger.log('segnalaProblemiStrutturaSePresenti_ ha fallito: %s', e && e.message ? e.message : String(e));
  }
}
