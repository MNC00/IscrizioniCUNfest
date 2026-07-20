/**
 * CONFIG.gs
 * ---------------------------------------------------------------------------
 * Punto unico di configurazione del progetto "Iscrizioni CUN Fest".
 * Contiene tutti i nomi di foglio, indici di riga/colonna hardcoded, celle
 * fisse, stati testuali ricorrenti, colori e testi email fino ad ora sparsi
 * nei vari file .gs.
 *
 * IMPORTANTE: questo file NON introduce nessuna modifica di comportamento.
 * Contiene solo i valori già presenti nel codice, raggruppati per essere
 * referenziati con `CONFIG.<SEZIONE>.<CHIAVE>` al posto delle stringhe/numeri
 * scritti a mano nei singoli file.
 *
 * Nessun ID di file/cartella Google Drive è stato trovato nel codice sorgente
 * originale: tutti gli script operano su SpreadsheetApp.getActiveSpreadsheet()
 * (progetto Apps Script "bound" allo spreadsheet). Per questo CONFIG.SPREADSHEET_ID
 * è lasciato vuoto di default: se un domani il progetto dovesse diventare
 * "standalone" (non più bound), basterà valorizzarlo qui, in un unico punto.
 * Non sono stati trovati indirizzi email scritti a mano: tutte le email sono
 * lette dinamicamente dalle righe dei fogli.
 *
 * ----------------------- AMBIENTE TEST / PROD -----------------------------
 * Le uniche chiavi che possono cambiare passando dall'ambiente di test a
 * quello di produzione sono raccolte in CONFIG.ENVIRONMENTS.TEST /
 * CONFIG.ENVIRONMENTS.PROD. Tutto il resto di CONFIG (SHEETS, LOG, CELLE,
 * COLONNE, STATI, EMAIL, ecc.) resta identico in entrambi gli ambienti e
 * NON viene duplicato.
 *
 * Per passare a produzione basta cambiare CONFIG.ENV in fondo a questo file
 * (da "TEST" a "PROD"): nessun'altra modifica di codice è richiesta.
 *
 * Il valore di default (CONFIG.ENV = "TEST") riproduce esattamente il
 * comportamento attuale del progetto: nessuna modifica di comportamento è
 * introdotta da questa struttura finché non si cambia esplicitamente ENV.
 *
 * NOTA: EMAIL_SAFE_MODE / EMAIL_SAFE_RECIPIENT sono predisposti per un uso
 * futuro (dirottare le email verso un indirizzo di sicurezza in test), ma
 * non sono ancora letti da email.gs: aggiungerli qui non cambia il
 * comportamento di invio email attuale.
 * ---------------------------------------------------------------------------
 */

var CONFIG = {

  /* ===================== AMBIENTE ATTIVO ===================== */
  // Unico switch da cambiare per passare da test a produzione.
  // Valori ammessi: "TEST" | "PROD".
  ENV: "TEST",

  // Chiavi environment-specific. Aggiungere qui nuove chiavi solo se il loro
  // valore deve davvero differire tra TEST e PROD; tutto il resto va nelle
  // sezioni "condivise" più sotto.
  ENVIRONMENTS: {
    TEST: {
      // "" = usa lo spreadsheet a cui lo script è bound (comportamento attuale)
      SPREADSHEET_ID: "",
      // ID del Google Form di test. Non ancora usato da nessuna funzione del
      // progetto (il Form comunica solo via trigger ON_FORM_SUBMIT), tenuto
      // qui pronto per eventuali usi futuri (es. validazioni via FormApp).
      FORM_ID: "",
      // Se true, le funzioni di invio email potranno in futuro dirottare
      // tutti gli invii verso EMAIL_SAFE_RECIPIENT invece dell'indirizzo
      // reale dell'iscritto. Non ancora collegato a email.gs.
      EMAIL_SAFE_MODE: false,
      EMAIL_SAFE_RECIPIENT: ""
    },
    PROD: {
      SPREADSHEET_ID: "",
      FORM_ID: "",
      EMAIL_SAFE_MODE: false,
      EMAIL_SAFE_RECIPIENT: ""
    }
  },

  /* ===================== SPREADSHEET ===================== */
  // ID esplicito del Google Sheet. Lasciare "" per usare lo spreadsheet a cui
  // lo script è collegato (SpreadsheetApp.getActiveSpreadsheet()), come fa
  // oggi tutto il codice del progetto.
  // Valore reale assegnato in fondo al file da CONFIG.ENVIRONMENTS[CONFIG.ENV].
  SPREADSHEET_ID: "",

  /* ===================== NOMI DEI FOGLI (TAB) ===================== */
  SHEETS: {
    ISCRIZIONI: "Iscrizioni CUN Fest",       // Foglio pagato collegato al Google Form
    ORDINATE: "Iscrizioni ordinate",         // Rigenerato da creaFoglioOrdinato()
    PAGAMENTO: "Pagamento",                  // Rigenerato/aggiornato da creaFoglioPagamento()
    TABELLA_PASTI: "Tabella Pasti",          // Rigenerato da generaTabellaPasti()
    LOG: "Log",                              // Tab di log tecnico, creato/usato da logEvent() in logger.gs

    // Nomi "target" dei due fogli finora acceduti solo per posizione (vedi
    // INDEX_* più sotto). Da Iterazione 2 del refactoring (luglio 2026):
    // repository.gs cerca PRIMA questi fogli per nome; se il tab reale ha un
    // nome diverso, ricade automaticamente sull'indice di posizione (nessuna
    // rottura) ma registra un avviso nel Log. Se i nomi qui sotto non
    // corrispondono esattamente al tab reale, o rinominare il tab, o
    // aggiornare questo valore: da quel momento il collegamento non dipende
    // più dall'ordine dei fogli nello spreadsheet.
    TARIFFE: "Tabella Costi e Istruzioni Fog",
    COMUNICAZIONE: "Comunicazione a tutti gli iscritti",

    // Fogli acceduti per POSIZIONE (indice 0-based, getSheets()[n]): usati
    // solo come fallback da repository.gs quando il nome sopra non è (ancora)
    // allineato al tab reale. Se l'ordine dei tab nello spreadsheet cambia
    // E il nome non è allineato, questi indici si disallineano silenziosamente.
    INDEX_ISCRIZIONI: 0,      // Calcolatore prezzi.js, Generale mail.js, RecoveryEmail.js
    INDEX_TARIFFE: 1,         // "Tabella Costi e Istruzioni Fog" - Calcolatore prezzi.js, Tabella pasti.js
    INDEX_COMUNICAZIONE: 2    // "Comunicazione a tutti gli iscritti" - RecoveryEmail.js
  },

  /* ===================== LOG ===================== */
  LOG: {
    INTESTAZIONI: ["Data e Ora", "Livello", "Funzione", "Messaggio", "Dettaglio Errore"],
    LIVELLI: {
      INFO: "INFO",
      WARNING: "WARNING",
      ERROR: "ERROR"
    },
    FORMATO_DATA_ORA: "dd/MM/yyyy HH:mm:ss",
    COLORE_INTESTAZIONE: "#d9ead3"
  },

  /* ===================== CELLE FISSE (riferimenti diretti) ===================== */
  CELLE: {
    DATA_INIZIO_CUN: "D1",        // Foglio tariffe, letta da generaTabellaPasti (Tabella pasti.js)
    DATA_FINE_CUN: "D2"           // Foglio tariffe, letta da generaTabellaPasti (Tabella pasti.js)
  },

  /* ===================== FOGLIO TARIFFE: indici di riga hardcoded =====================
   * Usati in calcolaPrezziIscrizioni (Calcolatore prezzi.js) come
   * tariffe[RIGA][COLONNA_VALORE]. Se qualcuno inserisce/sposta una riga nel
   * foglio tariffe, questi indici si disallineano silenziosamente.
   */
  TARIFFE_COLONNA_VALORE: 1, // colonna B (0-based = 1): colonna dove si trova quasi ogni valore tariffa

  TARIFFE_RIGHE: {
    GIORNO_COMPLETO: 1,
    NOTTE: 2,
    COLAZIONE: 3,
    PASTO_PRINCIPALE: 4,
    SOLO_PRANZO_CUN: 5,

    GIORNO_COMPLETO_UNINORD: 8,
    NOTTE_UNINORD: 9,
    COLAZIONE_UNINORD: 10,
    PASTO_PRINCIPALE_UNINORD: 11,
    SOLO_PRANZO_CUN_UNINORD: 12,
    TETTO_MASSIMO_UNINORD: 13,

    GIORNO_COMPLETO_UNISUD: 16,
    NOTTE_UNISUD: 17,
    COLAZIONE_UNISUD: 18,
    PASTO_PRINCIPALE_UNISUD: 19,
    SOLO_PRANZO_CUN_UNISUD: 20,
    TETTO_MASSIMO_UNISUD: 21,

    SCONTO_ETA_0_5: 24,
    SCONTO_ETA_6_8: 25,
    SCONTO_ETA_9_11: 26,
    SCONTO_ETA_12_14: 27,

    ETA_GIOVANE_RIGA: 1,     // stessa riga di GIORNO_COMPLETO ...
    ETA_GIOVANE_COLONNA: 4   // ...ma letta in colonna E (0-based = 4)
  },

  // Etichette cercate per TESTO (non per indice) nel foglio tariffe da trovaDateCUN()
  TARIFFE_LABELS: {
    DATA_INIZIO_CUN: "data inizio cun",
    DATA_FINE_CUN: "data fine cun",
    // Intestazione della colonna E, una riga sopra il valore soglia "eta_giovane"
    // (vedi TARIFFE_RIGHE.ETA_GIOVANE_RIGA/COLONNA). Usata solo per la verifica
    // di coerenza in verificaEtichetteTariffe_() (repository.gs).
    ETA_GIOVANE: "eta' che fino alla quale sei un giovane"
  },

  /* ===================== FOGLIO TARIFFE: etichette attese per riga (colonna A) =====================
   * Usate da verificaEtichetteTariffe_() (repository.gs) per controllare, PRIMA
   * di calcolare i prezzi, che ogni riga configurata in TARIFFE_RIGHE contenga
   * ancora l'etichetta di testo attesa in colonna A. Se qualcuno inserisce o
   * sposta una riga nel foglio tariffe, questo controllo lo segnala con un
   * errore leggibile invece di far calcolare un prezzo sbagliato in silenzio.
   *
   * NOTA: le etichette si ripetono identiche nelle 3 sezioni del foglio
   * (generali/CUN/giovani), quindi non possono sostituire la lettura per riga:
   * servono solo a VERIFICARE che la riga giusta contenga ancora il testo giusto.
   */
  TARIFFE_ETICHETTE_ATTESE: {
    GIORNO_COMPLETO: "costo giorno completo",
    NOTTE: "costo solo pernottamento",
    COLAZIONE: "costo colazione",
    PASTO_PRINCIPALE: "costo pranzo/cena",
    SOLO_PRANZO_CUN: "costo solo pranzo cun",

    GIORNO_COMPLETO_UNINORD: "costo giorno completo",
    NOTTE_UNINORD: "costo solo pernottamento",
    COLAZIONE_UNINORD: "costo colazione",
    PASTO_PRINCIPALE_UNINORD: "costo pranzo/cena",
    SOLO_PRANZO_CUN_UNINORD: "costo solo pranzo cun",
    TETTO_MASSIMO_UNINORD: "tetto massimo",

    GIORNO_COMPLETO_UNISUD: "costo giorno completo",
    NOTTE_UNISUD: "costo solo pernottamento",
    COLAZIONE_UNISUD: "costo colazione",
    PASTO_PRINCIPALE_UNISUD: "costo pranzo/cena",
    SOLO_PRANZO_CUN_UNISUD: "costo solo pranzo cun",
    TETTO_MASSIMO_UNISUD: "tetto massimo",

    SCONTO_ETA_0_5: "0-5 anni",
    SCONTO_ETA_6_8: "6-8 anni",
    SCONTO_ETA_9_11: "9-11 anni",
    SCONTO_ETA_12_14: "12-14 anni"
  },

  /* ===================== INTESTAZIONI COLONNA (alias per getCol/buildHeaderIndex) =====================
   * Foglio "Iscrizioni CUN Fest". Gli alias sono le varianti di nome colonna
   * già cercate nel codice attuale (ricerca case/accent-insensitive via norm()).
   */
  COLONNE: {
    NOME: ["nome"],
    COGNOME: ["cognome"],
    EMAIL: ["email", "mail"],
    PREZZO: ["prezzo", "prezzo finale"],
    SOLO_PRANZO_CUN: ["solo pranzo", "partecipi solo al pranzo del cun fest?", "partecipi solo al pranzo del cun?"],
    DATA_ARRIVO: ["data arrivo", "data di arrivo"],
    PASTO_ARRIVO: ["pasto di arrivo", "pasto arrivo"],
    DATA_PARTENZA: ["data partenza", "data di partenza"],
    PASTO_PARTENZA: ["pasto di partenza", "pasto partenza"],
    DATA_NASCITA: ["data di nascita"],
    PARLIAMO_LUNEDI: ["parliamo solo di lunedi", "parliamo solo di lunedì"],
    PAGATO: ["pagato", "Pagato", "già pagato"],

    // Colonne create automaticamente via ensureColumn() se assenti: qui il
    // titolo esatto con cui vengono create/cercate come colonna singola.
    MAIL_CONFERMA_INVIATA: "Mail di conferma inviata",
    NUOVO_INVIO: "Nuovo invio",
    STATO_NUOVO_INVIO: "Stato nuovo invio",
    // Colonna consolidata (Iterazione 3, 2026-07-20): unico campo leggibile
    // che riassume mail/nuovo invio/pagato, scritta da aggiornaStatoIscrizione()
    // (sheets.gs). Le colonne granulari sopra restano invariate come dettaglio.
    STATO_ISCRIZIONE: "Stato Iscrizione",

    // Alias di ricerca per la colonna "Nuovo invio" usati da onEdit (Invia con prezzo.js)
    NUOVO_INVIO_ALIAS: ["nuovo invio", "nuovo invio mail", "invio con prezzo"]
  },

  // Intestazioni colonna del foglio "Comunicazione a tutti gli iscritti"
  COLONNE_MAIL: {
    OGGETTO: ["oggetto", "oggetto della mail", "subject"],
    TESTO: ["testo", "testo della mail", "testo della email", "testo mail"],
    OGGETTO_ULTIMA_MAIL: ["oggetto ultima mail", "oggetto ultima mail inviata", "ultimo oggetto"],
    TESTO_ULTIMA_MAIL: ["testo ultima mail", "testo ultima mail inviata", "ultimo testo"],
    INVIA_A_TUTTI: ["invia mail a tutti?", "inviare la mail?", "inviare la mail", "invia mail"]
  },

  // Riga (0-based) da cui sendRecoveryEmails legge oggetto/testo nel foglio Comunicazione (dataMail[1][...])
  COMUNICAZIONE_RIGA_DATI: 1,

  /* ===================== LISTE PER DATA VALIDATION (dropdown) =====================
   * Usate da configurarValidazioniComandi() (setup.gs, Iterazione 3, 2026-07-20)
   * per trasformare le celle-comando a testo libero in dropdown, riducendo il
   * rischio di errori di battitura/maiuscole che in passato bloccavano
   * silenziosamente un'automazione. Il confronto nel codice resta
   * case-insensitive/trim (vedi CONFIG.STATI), quindi cambiare qui il testo
   * visualizzato nel dropdown non richiede altre modifiche.
   */
  LISTE: {
    NUOVO_INVIO: ["", "Invia con prezzo"],   // colonna "Nuovo invio", foglio Iscrizioni
    PAGATO: ["", "x"]                        // colonna "Pagato", foglio Pagamento
  },

  // Elenco campi copiati dal foglio "Iscrizioni CUN Fest" al foglio "Pagamento" (creaFoglioPagamento)
  CAMPI_PAGAMENTO: [
    "Cognome",
    "Nome",
    "Data di nascita",
    "Zona di provenienza",
    "Data di arrivo",
    "Pasto di arrivo",
    "Data di partenza",
    "Pasto di partenza",
    "Prezzo"
  ],

  /* ===================== STATI TESTUALI RICORRENTI ===================== */
  STATI: {
    MAIL_INVIATA_CON_PREZZO: "Inviata con prezzo",
    MAIL_INVIATA_SENZA_PREZZO: "Inviata senza prezzo",
    MAIL_PRIMA_SENZA_ORA_CON: "prima senza, ora con",
    NUOVO_INVIO_CON_PREZZO: "Nuovo invio con prezzo",
    BLOCCATO_GIA_INVIATA: "Bloccato: già inviata con prezzo",

    COMANDO_INVIA_CON_PREZZO: "invia con prezzo",   // valore atteso in "Nuovo invio" (confronto case-insensitive)
    GIA_FATTO: "già fatto",                          // scritto in "Nuovo invio" dopo un reinvio riuscito

    COMANDO_INVIA_A_TUTTI: "si",                     // valore atteso in "Invia mail a tutti?" (invioRecovery, ora solo per intercettare il vecchio comando)

    // ATTENZIONE - incoerenza già presente nel codice originale, riportata as-is:
    // in Calcolatore prezzi.js il confronto è ESATTO con "Si" (maiuscola);
    // in Generale mail.js/Tabella pasti.js si usa invece un confronto
    // case-insensitive su "si". Vedi docs/3_2_dizionario_dati.md.
    SOLO_PRANZO_SI_ESATTO: "Si",       // usato in Calcolatore prezzi.js (confronto ===)
    SOLO_PRANZO_SI_NORMALIZZATO: "si", // usato in Generale mail.js / Tabella pasti.js (dopo normalizzazione)

    PAGATO_X: "x"
  },

  // Valori dei pasti confrontati case-sensitive (===) in Calcolatore prezzi.js
  PASTI: {
    ARRIVO_COLAZIONE: "Colazione",
    ARRIVO_PRANZO: "Pranzo",
    ARRIVO_CENA: "Cena",
    ARRIVO_DOPO_CENA: "Dopo cena",
    PARTENZA_COLAZIONE: "Colazione",
    PARTENZA_PRANZO: "Pranzo",
    PARTENZA_CENA: "Cena",
    PARTENZA_PRIMA_COLAZIONE: "Prima di colazione"
  },

  // Valori normalizzati (dopo norm()) confrontati in Tabella pasti.js
  LUNEDI: {
    ME_NE_VADO_DOPO_LUNEDI_VARIANTE_1: "me ne vado dopo lunedi",
    ME_NE_VADO_DOPO_LUNEDI_VARIANTE_2: "me ne vado dopo lunedì"
  },

  /* ===================== COLORI DI FORMATTAZIONE ===================== */
  COLORI: {
    INTESTAZIONE_VERDE: "#d9ead3",     // intestazioni di Iscrizioni ordinate, Pagamento, Tabella Pasti
    RIGA_PAGATO_AZZURRO: "#cfe2fe",    // riga colorata da coloraPagati quando Pagato = "x"
    RIGA_NON_PAGATO_BIANCO: "white"
  },

  // Larghezza minima colonna applicata in creaFoglioPagamento
  LARGHEZZA_COLONNA_MINIMA_PAGAMENTO: 100,

  /* ===================== TESTI EMAIL ===================== */
  EMAIL: {
    MITTENTE_FIRMA: "Gruppo Iscrizioni",
    INTESTATARIO_CONTO: "SCUOLA APOSTOLICA BERTONI",
    IBAN: "IT87W0200859280000003853446",
    // Testo causale: presente con lievissime differenze di punteggiatura tra
    // le 4 occorrenze originali (posizione del punto rispetto alle virgolette).
    // Riportato qui nella forma più ricorrente; da NON modificare senza
    // verificare tutte le occorrenze in Generale mail.js.
    CAUSALE_PAGAMENTO: "“Pre CUN e CUN Fest - nome del partecipante e codice fiscale”",

    SITO_CUNFEST_URL: "https://sites.google.com/view/pgstimm/cunfest?authuser=0",

    OGGETTO_CONFERMA_ISCRIZIONE: "Conferma Iscrizione CUN Fest",
    OGGETTO_AGGIORNAMENTO_PREZZI: "Aggiornamento prezzi CUN Fest"
  }
};

/**
 * Applica le chiavi environment-specific dell'ambiente selezionato
 * (CONFIG.ENV) sopra i placeholder condivisi in CONFIG.
 *
 * Unico punto di collegamento tra CONFIG.ENVIRONMENTS e il resto di CONFIG:
 * tutto il codice esistente continua a leggere CONFIG.SPREADSHEET_ID (e le
 * altre chiavi qui sotto) esattamente come prima, senza dover conoscere il
 * concetto di "ambiente".
 */
(function applyEnvironment_(config) {
  var env = config.ENVIRONMENTS[config.ENV];

  if (!env) {
    throw new Error("CONFIG.ENV non valido: \"" + config.ENV + "\". Valori ammessi: " + Object.keys(config.ENVIRONMENTS).join(", "));
  }

  config.SPREADSHEET_ID = env.SPREADSHEET_ID;
  config.FORM_ID = env.FORM_ID;
  config.EMAIL_SAFE_MODE = env.EMAIL_SAFE_MODE;
  config.EMAIL_SAFE_RECIPIENT = env.EMAIL_SAFE_RECIPIENT;
})(CONFIG);
