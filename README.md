# Sistema Iscrizioni Festival

Questo progetto gestisce le automazioni per le iscrizioni al festival, interfacciando Google Forms, Google Sheets e Apps Script.

## Architettura (Iterazione 4)
Il codice è organizzato in 4 layer: **Domain** (logica pura), **Infrastructure**
(accesso a Sheets/Gmail), **Orchestration** (coordina Domain+Infrastructure,
gestisce la coda eventi) e **Triggers/UI** (entry point sottili). Il codice
storico è conservato, disattivato, in `src/legacy/`. Vedi **[ARCHITETTURA.md](ARCHITETTURA.md)**
per la descrizione completa dei layer, il flusso di un'iscrizione, la
macchina a stati e la procedura di migrazione.

## Struttura del progetto
- `/src`: Contiene tutto il codice Apps Script (`Domain/`, `Infrastructure/`, `Orchestration/`, `Triggers/`, `UI/`, `legacy/`).
- `/docs`: Contiene la documentazione tecnica e le analisi.

## Regole di sviluppo
1. Non modificare mai il codice direttamente dall'editor online di Apps Script.
2. Sviluppa in locale usando VS Code.
3. Fai il push delle modifiche tramite Clasp (`clasp push`).

## Setup una tantum dopo il primo `clasp push` (Iterazione 4)
Dopo aver pushato questa versione, dall'editor Apps Script (non dal foglio) eseguire, una sola volta:
1. `migraConfigurazioneLegacy()` — popola il nuovo tab "Configurazione" (CHIAVE/VALORE/DESCRIZIONE) dal vecchio tab tariffe.
2. `installaTriggerPeriodico()` — installa il trigger a tempo (ogni 5 minuti) che rigenera le viste derivate e riprocessa la coda eventi.

Poi, dal Google Sheet, aprire il menu **"Iscrizioni CUN Fest"** ed eseguire **"Migra dati legacy (una tantum)"** per assegnare `ID_ISCRIZIONE`/`STATO_ISCRIZIONE` alle iscrizioni esistenti.

Infine, dal pannello Trigger di Apps Script: rimuovere i vecchi trigger installabili (`mioTrigger`, `onEdit`, `invioRecovery`, `coloraPagati`) e aggiungere il trigger installabile `mioTriggerV2` sull'evento "Al momento dell'invio del modulo".

Se il menu non compare subito, ricaricare la pagina del foglio (il menu è creato da `onOpen()`). Dettagli completi in **[ARCHITETTURA.md](ARCHITETTURA.md)**.