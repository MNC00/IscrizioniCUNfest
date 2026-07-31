/**
 * Infrastructure/Costanti.js
 * -----------------------------------------------------------------------
 * Unico punto in cui vivono nomi di fogli, nomi di colonne "chiave" e chiavi
 * di configurazione. Se un tab o una colonna viene rinominato nel foglio
 * reale, si aggiorna SOLO qui.
 */

/** Nomi dei tab dello spreadsheet. */
var FOGLI = Object.freeze({
  ISCRIZIONI: 'Iscrizioni CUN Fest',
  ISCRIZIONI_OPERATIVO: 'Iscrizioni (operativo)',
  ISCRIZIONI_ORDINATE: 'Iscrizioni ordinate',
  PAGAMENTO: 'Pagamento',
  TABELLA_PASTI: 'Tabella Pasti',
  CONFIGURAZIONE: 'Configurazione',
  CONFIGURAZIONE_LEGACY: 'Tabella Costi e Istruzioni Foglio',
  EVENTI: 'Eventi',
  COMUNICAZIONI: 'Comunicazioni',
  DASHBOARD: 'Dashboard'
});

/** Intestazioni di colonna nel tab "Iscrizioni CUN Fest". */
var COLONNE_ISCRIZIONI = Object.freeze({
  ID_ISCRIZIONE: 'ID_ISCRIZIONE',
  STATO_ISCRIZIONE: 'STATO_ISCRIZIONE',
  NOME: 'Nome',
  COGNOME: 'Cognome',
  EMAIL: 'Email',
  DATA_NASCITA: 'Data di nascita',
  ZONA: 'Zona di provenienza',
  DATA_ARRIVO: 'Data di arrivo',
  PASTO_ARRIVO: 'Pasto di arrivo',
  DATA_PARTENZA: 'Data di partenza',
  PASTO_PARTENZA: 'Pasto di partenza',
  SOLO_PRANZO_CUN: 'Partecipi SOLO al pranzo del CUN?',
  PARLIAMO_LUNEDI: 'Parliamo solo di lunedì',
  PREZZO: 'Prezzo',
  // colonne legacy mantenute per compatibilità con eventuali letture manuali/storiche
  MAIL_CONFERMA_INVIATA_LEGACY: 'Mail di conferma inviata',
  NUOVO_INVIO_LEGACY: 'Nuovo invio',
  STATO_NUOVO_INVIO_LEGACY: 'Stato nuovo invio'
});

/** Intestazioni di colonna nel tab "Pagamento". */
var COLONNE_PAGAMENTO = Object.freeze({
  ID_ISCRIZIONE: 'ID_ISCRIZIONE',
  COGNOME: 'Cognome',
  NOME: 'Nome',
  DATA_NASCITA: 'Data di nascita',
  ZONA: 'Zona di provenienza',
  DATA_ARRIVO: 'Data di arrivo',
  PASTO_ARRIVO: 'Pasto di arrivo',
  DATA_PARTENZA: 'Data di partenza',
  PASTO_PARTENZA: 'Pasto di partenza',
  PREZZO: 'Prezzo',
  PAGATO: 'Pagato'
});

/** Intestazioni di colonna nel tab "Configurazione" (mappa CHIAVE/VALORE/DESCRIZIONE). */
var COLONNE_CONFIGURAZIONE = Object.freeze({
  CHIAVE: 'CHIAVE',
  VALORE: 'VALORE',
  DESCRIZIONE: 'DESCRIZIONE'
});

/** Chiavi attese nel tab "Configurazione". Nessun indice fisso: si cerca per chiave. */
var CHIAVI_CONFIGURAZIONE = Object.freeze({
  TARIFFA_GIORNO_COMPLETO: 'TARIFFA_GIORNO_COMPLETO',
  TARIFFA_NOTTE: 'TARIFFA_NOTTE',
  TARIFFA_COLAZIONE: 'TARIFFA_COLAZIONE',
  TARIFFA_PASTO_PRINCIPALE: 'TARIFFA_PASTO_PRINCIPALE',
  SOLO_PRANZO_CUN: 'SOLO_PRANZO_CUN',

  TARIFFA_GIORNO_COMPLETO_UNINORD: 'TARIFFA_GIORNO_COMPLETO_UNINORD',
  TARIFFA_NOTTE_UNINORD: 'TARIFFA_NOTTE_UNINORD',
  TARIFFA_COLAZIONE_UNINORD: 'TARIFFA_COLAZIONE_UNINORD',
  TARIFFA_PASTO_PRINCIPALE_UNINORD: 'TARIFFA_PASTO_PRINCIPALE_UNINORD',
  SOLO_PRANZO_CUN_UNINORD: 'SOLO_PRANZO_CUN_UNINORD',
  TETTO_MASSIMO_UNINORD: 'TETTO_MASSIMO_UNINORD',

  TARIFFA_GIORNO_COMPLETO_UNISUD: 'TARIFFA_GIORNO_COMPLETO_UNISUD',
  TARIFFA_NOTTE_UNISUD: 'TARIFFA_NOTTE_UNISUD',
  TARIFFA_COLAZIONE_UNISUD: 'TARIFFA_COLAZIONE_UNISUD',
  TARIFFA_PASTO_PRINCIPALE_UNISUD: 'TARIFFA_PASTO_PRINCIPALE_UNISUD',
  SOLO_PRANZO_CUN_UNISUD: 'SOLO_PRANZO_CUN_UNISUD',
  TETTO_MASSIMO_UNISUD: 'TETTO_MASSIMO_UNISUD',

  SCONTO_0_5: 'SCONTO_0_5',
  SCONTO_6_8: 'SCONTO_6_8',
  SCONTO_9_11: 'SCONTO_9_11',
  SCONTO_12_14: 'SCONTO_12_14',

  ETA_GIOVANE: 'ETA_GIOVANE',
  DATA_INIZIO_CUN: 'DATA_INIZIO_CUN',
  DATA_FINE_CUN: 'DATA_FINE_CUN',

  // flag operativo: se 'TRUE', EmailSender non invia email reali (usato in ambienti di test)
  MODALITA_TEST_NO_INVIO_EMAIL: 'MODALITA_TEST_NO_INVIO_EMAIL'
});

/** Colonne del tab "Eventi" (log + coda eventi). */
var COLONNE_EVENTI = Object.freeze({
  ID_EVENTO: 'ID_EVENTO',
  TIMESTAMP: 'TIMESTAMP',
  ID_ISCRIZIONE: 'ID_ISCRIZIONE',
  TIPO_EVENTO: 'TIPO_EVENTO',
  DATI_JSON: 'DATI_JSON',
  STATO: 'STATO',
  ESITO: 'ESITO',
  ERRORI: 'ERRORI'
});

/** Stati possibili di una riga della coda eventi. */
var STATO_EVENTO = Object.freeze({
  PENDING: 'PENDING',
  IN_ELABORAZIONE: 'IN_ELABORAZIONE',
  COMPLETATO: 'COMPLETATO',
  ERRORE: 'ERRORE'
});

/** Colonne del tab "Comunicazioni" (comunicazioni di massa). */
var COLONNE_COMUNICAZIONI = Object.freeze({
  ID_COMM: 'ID_COMM',
  OGGETTO: 'OGGETTO',
  TESTO: 'TESTO',
  STATO: 'STATO',
  DATA_INVIO: 'DATA_INVIO',
  ID_OPERATORE: 'ID_OPERATORE'
});

/** Stati possibili di una riga di "Comunicazioni". */
var STATO_COMUNICAZIONE = Object.freeze({
  DA_INVIARE: 'DA_INVIARE',
  INVIATA: 'INVIATA',
  ERRORE: 'ERRORE'
});
