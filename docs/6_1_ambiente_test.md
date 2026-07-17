# 6.1 – Ambiente di Test

## Premessa

Il progetto **non richiede la creazione di una nuova copia**: il codice presente in questo repository (`src/*.gs`, gestito via `clasp`) è **già collegato** a una copia di test del sistema di iscrizioni, distinta dalla copia di produzione realmente usata dagli iscritti al CUN Fest.

Questo significa che:
- lo script Apps Script bound (`SpreadsheetApp.getActiveSpreadsheet()`, vedi `config.gs`) punta al Google Sheet **di test**;
- ogni modifica, esecuzione o trigger scattato in questa fase agisce solo sui dati di test, senza alcun impatto sugli iscritti reali;
- il passaggio "in produzione" non consiste nello scrivere nuovo codice, ma nel **ripuntare/collegare** lo stesso codice (o una sua copia identica) all'ambiente reale, seguendo la checklist di differenze riportata più sotto.

## Componenti dell'ambiente di test

| Componente | Ruolo | Note |
|---|---|---|
| **Google Form** (test) | Raccoglie le iscrizioni di prova; l'invio genera una riga nel foglio "Iscrizioni CUN Fest" e scatena il trigger `ON_FORM_SUBMIT` → `mioTrigger()`. | È una copia del Form reale, con destinazione risposte impostata sullo Sheet di test. |
| **Google Sheet** (test) | Contenitore di tutti i tab: `Iscrizioni CUN Fest`, `Iscrizioni ordinate`, `Pagamento`, `Tabella Pasti`, `Stanze`, `Log`, più i tab acceduti per posizione (tariffe, comunicazione). Vedi `config.gs` → `CONFIG.SHEETS`. | È lo spreadsheet a cui il progetto Apps Script è "bound" (nessun `SPREADSHEET_ID` esplicito: si usa sempre lo sheet attivo). |
| **Apps Script (bound project)** | Il codice in `src/*.gs`, sincronizzato con `clasp push` sul progetto Apps Script legato allo Sheet di test. | Trigger installabili attivi: `mioTrigger` (ON_FORM_SUBMIT), `onEdit`, `invioRecovery`, `coloraPagati`, eventualmente `invioStanze` (da verificare, vedi `docs/3_3_mappa_automazioni.md`). |
| **Email** | Le mail di conferma, aggiornamento prezzo, comunicazioni di massa e assegnazione stanza vengono inviate realmente tramite `MailApp`/`GmailApp`, ma **agli indirizzi inseriti nel Form di test** (es. indirizzi personali del team, non quelli reali degli iscritti). | Nessun indirizzo è hardcoded nel codice: tutte le email sono lette dinamicamente dalle righe dei fogli (vedi `config.gs`). |
| **Tab di Log** | Tab `Log` (creato/gestito da `logger.gs` → `logEvent()`), registra data/ora, livello (INFO/WARNING/ERROR), funzione e dettaglio errore per ogni esecuzione. | Utile per verificare in modo asincrono l'esito dei trigger durante i test, senza dover ricontrollare manualmente ogni tab. |

## Elementi da sostituire o verificare al passaggio in produzione

Il giorno del passaggio a produzione, questi elementi **non vanno riscritti**, ma **ripuntati/verificati** uno per uno:

1. **Collegamento Apps Script ↔ Sheet**: assicurarsi che il progetto Apps Script (o la sua copia) sia bound allo Sheet reale di produzione, non a quello di test.
2. **Google Form**: verificare che il Form reale invii le risposte allo Sheet di produzione (menu Risposte → destinazione foglio).
3. **Trigger installabili**: ricreare/verificare manualmente in Apps Script (Trigger → aggiungi trigger) tutte le voci elencate in `docs/3_3_mappa_automazioni.md`, perché i trigger installabili **non vengono copiati automaticamente** con `clasp push` e **non si spostano da soli** cambiando lo spreadsheet collegato.
4. **Nomi e ordine dei tab**: confermare che i nomi dei tab nello Sheet di produzione corrispondano esattamente a `CONFIG.SHEETS` (case-sensitive) e che l'ordine dei fogli acceduti per indice (`INDEX_ISCRIZIONI`, `INDEX_TARIFFE`, `INDEX_COMUNICAZIONE`) sia identico a quello di test.
5. **Indirizzi email reali**: eseguire un primo invio di prova reale (o un invio controllato a un indirizzo interno) prima di aprire il Form al pubblico, per evitare mail duplicate/errate agli iscritti veri.
6. **Tab "Log"**: verificare che venga creato correttamente anche nello Sheet di produzione (viene generato automaticamente alla prima chiamata di `logEvent()`, ma è bene controllarlo subito dopo il primo test reale).
7. **Valori in `config.gs`**: se lo Sheet di produzione avesse celle fisse, righe tariffe o intestazioni colonna diverse da quelle di test, aggiornare i valori corrispondenti in `CONFIG` (es. `CONFIG.CELLE`, `CONFIG.TARIFFE_RIGHE`, `CONFIG.COLONNE`).

## Differenze da verificare prima della produzione

- [ ] Il progetto Apps Script è collegato allo Sheet di **produzione**, non a quello di test.
- [ ] Il Google Form di produzione scrive le risposte nello Sheet di produzione corretto.
- [ ] Tutti i trigger installabili (`mioTrigger`, `onEdit`, `invioRecovery`, `coloraPagati`, `invioStanze` se usato) sono presenti e attivi nell'ambiente di produzione.
- [ ] I nomi dei tab nello Sheet di produzione corrispondono esattamente a `CONFIG.SHEETS`.
- [ ] L'ordine dei fogli acceduti per indice (`INDEX_ISCRIZIONI`, `INDEX_TARIFFE`, `INDEX_COMUNICAZIONE`) è identico a quello previsto.
- [ ] Le celle fisse (`CONFIG.CELLE`) e le righe tariffe (`CONFIG.TARIFFE_RIGHE`) puntano alle celle corrette nello Sheet reale.
- [ ] Le intestazioni colonna del foglio "Iscrizioni CUN Fest" reale corrispondono agli alias in `CONFIG.COLONNE`.
- [ ] Gli indirizzi email che riceveranno le comunicazioni sono quelli reali degli iscritti (non indirizzi di test/team).
- [ ] Il tab "Log" viene creato correttamente e riceve scritture nell'ambiente di produzione.
- [ ] Nessun dato di test residuo (righe fittizie, mail di prova) è presente nello Sheet di produzione prima dell'apertura al pubblico.
