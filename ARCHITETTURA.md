# Architettura — Sistema Iscrizioni CUN Fest

> Questo documento descrive la nuova architettura introdotta con la
> riprogettazione "a 4 layer". Sostituisce, come riferimento per lo sviluppo
> futuro, la mappa funzionale/automazioni pre-esistenti in `docs/3_*.md`
> (mantenute per la ricostruzione storica del comportamento).

## 1. Perché questa riprogettazione

Il sistema precedente (vedi `docs/3_1..3_3` e `src/legacy/`) aveva alcuni
problemi strutturali:

- **Trigger sincroni e accoppiati**: un singolo `onFormSubmit`/`onEdit`
  eseguiva in sequenza calcolo prezzo, invio email e riscrittura di 3 fogli
  derivati. Un errore a metà lasciava il sistema in uno stato intermedio.
- **Logica di business mescolata con Sheets/Gmail**: impossibile testare il
  calcolo prezzi o la macchina a stati senza uno spreadsheet reale.
- **Fogli derivati riscritti per intero** ad ogni esecuzione, con matching
  fragile per "Nome+Cognome" (rischio di unire per errore due omonimi).
- **Nessun log**: un'email che falliva spariva senza lasciare traccia.
- **Comandi impartiti scrivendo testo in celle** (`"invia con prezzo"`,
  `"si"`, `"INVIA"`), senza conferma né tracciabilità di chi ha agito.
- **Stato dell'iscrizione ricostruito da 2-3 colonne testuali** invece di
  un'unica macchina a stati esplicita.

## 2. I 4 layer

```
src/
  Domain/           logica di business PURA (niente SpreadsheetApp/MailApp)
  Infrastructure/    accesso a Sheets, invio email, coda eventi (side effect)
  Orchestration/     coordina Domain + Infrastructure, gestisce la coda eventi
  Triggers/          entry point installabili/simple trigger, sottilissimi
  UI/                sidebar opzionale per gli operatori
  legacy/            codice storico, DISATTIVATO (commentato), solo per rollback/audit
```

Regola cardine: **le dipendenze puntano verso il basso**. `Domain` non
importa nulla; `Infrastructure` non conosce le regole di business;
`Orchestration` compone i due; `Triggers`/`UI` chiamano solo `Orchestration`
(mai `Infrastructure` o `Domain` direttamente, salvo letture semplici per la
UI).

### 2.1 Domain (logica pura)

| File | Responsabilità |
|---|---|
| `Domain/Prezzi.js` | `calcolaPrezzo(iscrizione, configurazione)` → `{prezzo, dettagli, errori}`. Porta fedelmente le regole tariffarie storiche (fasce generale/Uninord/Unisud, sconti età, tetti massimi). |
| `Domain/Stati.js` | Macchina a stati: `STATI_ISCRIZIONE`, `EVENTI_ISCRIZIONE`, `prossimoStatoIscrizione(stato, evento)`. |
| `Domain/Pasti.js` | `calcolaPastiPerGiorno(iscrizioni[], configurazione)` → fabbisogno colazioni/pranzi/cene/pernottamenti per giorno. |
| `Domain/Email.js` | `costruisciEmailConferma/Aggiornamento/Massa(...)` → `{oggetto, html, testo}`. |

Nessuna di queste funzioni tocca `SpreadsheetApp` o `MailApp`: si possono
testare passando semplici oggetti JS (vedi commenti JSDoc per la forma
attesa degli argomenti).

### 2.2 Infrastructure (side effect)

| File | Responsabilità |
|---|---|
| `Infrastructure/Costanti.js` | Unico punto con nomi di fogli, colonne e chiavi di configurazione. |
| `Infrastructure/SheetsReader.js` | Lettura fogli per nome colonna (mai indice fisso): `leggiTutteIscrizioni`, `leggiMappaConfigurazione`, `trovaRigaPerIdIscrizione`, ecc. |
| `Infrastructure/SheetsWriter.js` | Scrittura: `scriviPrezzoIscrizione`, `scriviStatoIscrizione`, `rigeneraFoglioIscrizioniOrdinate`, `aggiornaFoglioPagamento` (agganciato a `ID_ISCRIZIONE`), `scriviTabellaPasti`. |
| `Infrastructure/EmailSender.js` | `inviaEmail(...)`: try/catch, log automatico su tab Eventi, modalità dry-run. |
| `Infrastructure/EventQueue.js` | `accodaEvento`, `prendiEventiDaProcessare`, `marcaEventoCompletato/InErrore`, `registraEventoImmediato`. |

### 2.3 Orchestration

| File | Responsabilità |
|---|---|
| `Orchestration/processaEventi.js` | `processaEventiPendenti()` legge la coda e smista a `gestisciFormSubmitted`, `gestisciRicalcolaPrezzo`, `gestisciInviaAggiornamento`, `gestisciPagamentoRegistrato`, `gestisciComunicazioneMassiva`. |
| `Orchestration/rigeneraViste.js` | `rigeneraViste()` (idempotente, per `ID_ISCRIZIONE`) e `rigeneraVisteSeNecessario()` per il time-driver. |
| `Orchestration/migrateLegacyIscrizioni.js` | Migrazione una tantum: assegna `ID_ISCRIZIONE`/`STATO_ISCRIZIONE` alle righe esistenti e riaggancia il tab Pagamento per ID. |
| `Orchestration/migrateLegacyConfigurazione.js` | Migrazione una tantum: popola il nuovo tab "Configurazione" (CHIAVE/VALORE/DESCRIZIONE) leggendo una sola volta il vecchio tab tariffe per indice. |

### 2.4 Triggers & UI

| File | Responsabilità |
|---|---|
| `Triggers/onFormSubmit.js` | `mioTriggerV2(e)`: assegna ID, imposta stato NUOVA, accoda `FORM_SUBMITTED`, elabora subito (con retry via time-driver in caso di errore). |
| `Triggers/onOpenMenu.js` | `onOpen()`: crea il menu **"Iscrizioni CUN Fest"** con tutte le azioni manuali (ricalcola prezzo, invia aggiornamento, registra pagamento, comunicazione a tutti con conferma, rigenera viste, esporta log, migrazione dati). |
| `Triggers/timeDriver.js` | `rigeneraVisteSeNecessarioTrigger()` (da agganciare a un trigger a tempo ogni 5 minuti tramite `installaTriggerPeriodico()`): rigenera le viste e riprocessa eventi rimasti in coda. |
| `UI/sidebarController.js` + `UI/sidebar.html` | Sidebar opzionale con dettaglio iscrizione + ultimi eventi di log. |

## 3. Dati: nuovi tab e colonne

### 3.1 Tab "Iscrizioni CUN Fest" (invariato + 2 colonne)

Aggiunte in coda (senza toccare le colonne del form):

- `ID_ISCRIZIONE`: chiave univoca generata alla prima elaborazione (`ISCR-XXXXXXXX`).
- `STATO_ISCRIZIONE`: uno tra `NUOVA`, `PREZZO_CALCOLATO`, `MAIL_INVIATA_SENZA_PREZZO`,
  `MAIL_INVIATA_CON_PREZZO`, `REINVIATA`, `PAGATA`, `ANNULLATA`.

Le vecchie colonne "Mail di conferma inviata"/"Nuovo invio"/"Stato nuovo invio"
non vengono più scritte dal nuovo codice (restano solo come storico visivo se
già presenti).

### 3.2 Tab "Configurazione" (nuovo)

Sostituisce, per il codice, il vecchio "Tabella Costi e Istruzioni Fog" (che
veniva letto per indice di riga fisso — bastava inserire una riga per
rompere il calcolo prezzi). Formato: `CHIAVE | VALORE | DESCRIZIONE`, una
riga per parametro. Le chiavi attese sono elencate in
`Infrastructure/Costanti.js#CHIAVI_CONFIGURAZIONE` (tariffe per fascia,
sconti età, date CUN, tetti massimi, flag `MODALITA_TEST_NO_INVIO_EMAIL`).

Si popola una tantum con `Orchestration/migrateLegacyConfigurazione.js#migraConfigurazioneLegacy()`
a partire dal vecchio tab, poi si modifica solo a mano.

### 3.3 Tab "Eventi" (nuovo)

Log + coda: `ID_EVENTO | TIMESTAMP | ID_ISCRIZIONE | TIPO_EVENTO | DATI_JSON | STATO | ESITO | ERRORI`.
`STATO` è `PENDING`/`IN_ELABORAZIONE`/`COMPLETATO`/`ERRORE` — usato dalla coda
per sapere cosa deve ancora essere elaborato o ritentato.

### 3.4 Tab "Comunicazioni" (nuovo, sostituisce "Comunicazione a tutti gli iscritti")

`ID_COMM | OGGETTO | TESTO | STATO | DATA_INVIO | ID_OPERATORE`. Un operatore
aggiunge una riga con `OGGETTO`/`TESTO` (senza scrivere "si" da nessuna
parte); l'invio parte solo dal menu, con conferma esplicita.

### 3.5 Viste derivate esistenti (invariate nel nome)

`Iscrizioni ordinate`, `Pagamento`, `Tabella Pasti`: rigenerate da
`Orchestration/rigeneraViste.js`. `Pagamento` ora aggancia le righe per
`ID_ISCRIZIONE` invece che per Nome+Cognome, eliminando il rischio di
confondere due omonimi; il campo "Pagato" non viene mai sovrascritto.

## 4. Flusso di un'iscrizione (nuovo)

```
Invio Form
  └─ Triggers/onFormSubmit.js#mioTriggerV2
       ├─ assegna ID_ISCRIZIONE, stato = NUOVA
       ├─ EventQueue.accodaEvento(id, FORM_SUBMITTED)
       └─ Orchestration/processaEventi.js#processaEventiPendenti (elaborazione immediata)
            └─ gestisciFormSubmitted(id)
                 ├─ Domain/Prezzi.calcolaPrezzo(...)      [se possibile]
                 ├─ SheetsWriter.scriviPrezzoIscrizione
                 ├─ Domain/Stati.prossimoStatoIscrizione(NUOVA, RICALCOLA_PREZZO) → PREZZO_CALCOLATO
                 ├─ Domain/Email.costruisciEmailConferma(...)
                 ├─ Infrastructure/EmailSender.inviaEmail(...)  [logga sempre in Eventi]
                 └─ Domain/Stati.prossimoStatoIscrizione(..., MAIL_CONFERMA_INVIATA)
                      → MAIL_INVIATA_CON_PREZZO oppure MAIL_INVIATA_SENZA_PREZZO

Ogni ~5 minuti (time-driven)
  └─ Triggers/timeDriver.js#rigeneraVisteSeNecessarioTrigger
       ├─ Orchestration/rigeneraViste.js#rigeneraViste()   (Ordinato/Pagamento/Pasti)
       └─ Orchestration/processaEventi.js#processaEventiPendenti(50)  (rete di sicurezza)

Azioni manuali (menu "Iscrizioni CUN Fest")
  ├─ Ricalcola prezzo            → EVENTI_ISCRIZIONE.RICALCOLA_PREZZO
  ├─ Invia aggiornamento prezzo  → EVENTI_ISCRIZIONE.INVIA_AGGIORNAMENTO (con conferma, blocca se già "con prezzo")
  ├─ Registra pagamento          → EVENTI_ISCRIZIONE.PAGAMENTO_REGISTRATO → stato PAGATA
  └─ Comunicazione a tutti       → gestisciComunicazioneMassiva (con conferma esplicita)
```

## 5. Macchina a stati

```
NUOVA ──RICALCOLA_PREZZO──> PREZZO_CALCOLATO ──MAIL_CONFERMA_INVIATA──> MAIL_INVIATA_CON_PREZZO
  └──MAIL_CONFERMA_INVIATA──> MAIL_INVIATA_SENZA_PREZZO ──RICALCOLA_PREZZO──> PREZZO_CALCOLATO
                                       └──INVIA_AGGIORNAMENTO──> REINVIATA
MAIL_INVIATA_CON_PREZZO ──PAGAMENTO_REGISTRATO──> PAGATA
REINVIATA ──PAGAMENTO_REGISTRATO──> PAGATA
(qualunque stato) ──ANNULLA──> ANNULLATA
```

Le transizioni non previste non lanciano eccezioni: `prossimoStatoIscrizione`
restituisce lo stato invariato con `applicata:false`, così l'orchestrazione
può loggare l'anomalia senza bloccare l'elaborazione delle altre iscrizioni.

## 6. Migrazione graduale

1. **Deploy del nuovo codice** (`clasp push`) mantenendo intatto `src/legacy/`
   (disattivato, solo per rollback/audit — non contiene funzioni globali
   attive, tutto il contenuto è racchiuso in un commento a blocco).
2. **Creare/popolare i nuovi tab**:
   - Creare manualmente i tab "Configurazione", "Eventi", "Comunicazioni"
     (o lasciare che `getOCreaFoglio`/`getOCreaFoglioEventi` li creino al
     primo utilizzo, tranne "Configurazione" che richiede la migrazione).
   - Eseguire **Menu ▸ Migra dati legacy** per assegnare `ID_ISCRIZIONE`/
     `STATO_ISCRIZIONE` alle iscrizioni esistenti e riagganciare il tab
     Pagamento per ID (evita righe duplicate alla prima sincronizzazione).
   - Eseguire `migraConfigurazioneLegacy()` (una tantum, dall'editor Apps
     Script) per popolare "Configurazione" dal vecchio tab tariffe.
3. **Disinstallare i vecchi trigger installabili** (`mioTrigger`, `onEdit`,
   `invioRecovery`, `coloraPagati`, `invioStanze` se presenti) dal pannello
   Trigger di Apps Script: le funzioni corrispondenti non esistono più nel
   codice attivo (sono in `legacy/`, disattivate).
4. **Installare i nuovi trigger**:
   - Installabile `ON_FORM_SUBMIT` → `mioTriggerV2`.
   - Eseguire una volta `installaTriggerPeriodico()` per il trigger a tempo
     ogni 5 minuti (`rigeneraVisteSeNecessarioTrigger`).
   - `onOpen` è un simple trigger: si attiva da solo, nessuna installazione richiesta.
5. **Verifica**: iscrivere un utente di test con `MODALITA_TEST_NO_INVIO_EMAIL=TRUE`
   in Configurazione, controllare il tab Eventi per l'esito, poi disattivare
   la modalità test.
6. **Rollback**: se necessario, i file `src/legacy/LEGACY_*.js` contengono il
   codice originale completo (commentato); basta "scommentarli" (rimuovere
   l'involucro `/* ... */`) e riattivare i vecchi trigger installabili dal
   pannello Apps Script — non serve consultare la cronologia Git.

## 7. Cosa NON è cambiato

- Google Form e Google Sheet restano gli stessi strumenti operativi.
- Le formule di calcolo prezzo (fasce, sconti, tetti) sono state portate
  **senza modifiche di importo**, comprese due incongruenze storiche note
  (condizione sempre vera nei rami Uninord/Unisud) — documentate con
  commenti `NOTA STORICA` in `Domain/Prezzi.js` per una futura revisione
  consapevole, ma non corrette automaticamente per non alterare prezzi già
  comunicati.
- Il testo delle email (conferma, aggiornamento) è invariato.
