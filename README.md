# Sistema Iscrizioni Festival

Questo progetto gestisce le automazioni per le iscrizioni al festival, interfacciando Google Forms, Google Sheets e Apps Script.

## Struttura del progetto
- `/src`: Contiene tutto il codice Apps Script.
- `/docs`: Contiene la documentazione tecnica e le analisi.

## Regole di sviluppo
1. Non modificare mai il codice direttamente dall'editor online di Apps Script.
2. Sviluppa in locale usando VS Code.
3. Fai il push delle modifiche tramite Clasp (`clasp push`).

## Setup una tantum dopo il primo `clasp push` (Iterazione 3, 2026-07-20)
Dopo aver pushato questa versione (sia in ambiente di test sia, in seguito, in produzione), aprire il Google Sheet e usare il nuovo menu **"Iscrizioni CUN Fest"** per eseguire, una sola volta:
1. **"Configura dropdown sulle celle comando"** — trasforma le colonne "Nuovo invio" e "Pagato" in menu a discesa.
2. **"Installa/verifica trigger periodico 5 min"** — installa il trigger a tempo che aggiorna Ordinato/Pagamento/Pasti/Stato Iscrizione ogni 5 minuti (necessario perché queste rigenerazioni non sono più sincrone ad ogni submit/edit).

Se il menu non compare subito, ricaricare la pagina del foglio (il menu è creato da `onOpen()`). Dettagli e motivazioni in `docs/7_3_decision_log.md`.