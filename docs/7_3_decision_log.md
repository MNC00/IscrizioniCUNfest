# 7.3 – Decision Log

Registro delle decisioni importanti prese sul progetto "Sistema Iscrizioni Festival". Serve a ricordare **perché** è stata fatta una certa scelta, non solo cosa è stato fatto: utile soprattutto quando si torna sul progetto dopo mesi di pausa.

Aggiungi una nuova voce ogni volta che si prende una decisione che riguarda l'architettura, il flusso di lavoro, o scelte organizzative non ovvie dal codice stesso. Non serve loggare ogni piccolo fix: solo le scelte che, se dimenticate, farebbero perdere tempo a ricapire "perché è fatto così".

---

## Template

```markdown
## [AAAA-MM-GG] Titolo della decisione

**Contesto**
Cosa ha portato a dover prendere questa decisione. Qual era il problema o la domanda.

**Decisione presa**
Cosa è stato deciso, in modo chiaro e diretto.

**Impatto**
Cosa cambia nel progetto, nel codice, nel flusso di lavoro o nell'organizzazione a seguito di questa decisione.

**Azioni future**
Eventuali cose da fare in futuro collegate a questa decisione (o "Nessuna" se non ce ne sono).
```

---

## Esempi

## 2025-XX-XX Uso di VS Code + clasp per gestire il codice Apps Script

**Contesto**
Il codice del progetto era gestito solo tramite l'editor online di Apps Script, senza versionamento né possibilità di lavorare offline o con strumenti di editing più avanzati (autocompletamento, ricerca globale, diff).

**Decisione presa**
Il codice viene sviluppato in locale con VS Code e sincronizzato con il progetto Apps Script tramite `clasp push`. L'editor online di Apps Script non va più usato per modificare direttamente il codice.

**Impatto**
- Il codice sorgente "di riferimento" è ora quello in `src/*.gs` nel repository, non quello visibile nell'editor Apps Script.
- Ogni modifica richiede il flusso descritto in `docs/7_1_flusso_modifiche.md` (VS Code → GitHub → `clasp push`).
- È necessario avere `clasp` configurato e autenticato sulla macchina di lavoro (`.clasp.json` presente nel repository).

**Azioni future**
Nessuna.

---

## 2025-XX-XX Lavorare su una copia di test invece che sull'ambiente reale

**Contesto**
Sviluppare e testare modifiche direttamente sull'ambiente usato dagli iscritti reali comporterebbe il rischio di inviare email errate, corrompere dati di iscrizione reali o interrompere il servizio durante le fasi di sviluppo.

**Decisione presa**
Il progetto Apps Script gestito da questo repository è collegato (bound) a una copia di test del Google Sheet e del Google Form, separata dalla copia di produzione realmente usata dagli iscritti. Tutti i test si eseguono su questa copia (dettagli in `docs/6_1_ambiente_test.md`).

**Impatto**
- Nessuna modifica di sviluppo/test tocca i dati reali o invia email agli iscritti veri.
- Il passaggio a produzione non richiede riscrivere codice, ma ripuntare/verificare il collegamento Apps Script ↔ Sheet reale, seguendo la checklist di differenze in `docs/6_1_ambiente_test.md`.
- Prima di ogni push va comunque eseguita la checklist di test manuale (`docs/6_2_checklist_test.md`).

**Azioni future**
Al momento del passaggio effettivo a produzione, ripercorrere la checklist "Differenze da verificare prima della produzione" in `docs/6_1_ambiente_test.md` e registrare l'esito come nuova voce in questo decision log.

---

## 2025-XX-XX Centralizzare la configurazione in `config.gs`

**Contesto**
Nomi dei fogli, indici di riga/colonna, celle fisse, stati testuali e testi email erano sparsi e ripetuti nei vari file `.gs`, rendendo fragile qualsiasi modifica (es. rinominare un tab o cambiare una tariffa richiedeva di cercare in più file).

**Decisione presa**
Tutti i valori di configurazione (nomi fogli, celle, indici, stati testuali, colori, testi email) sono stati raccolti in un unico file `src/config.gs`, accessibili tramite l'oggetto globale `CONFIG`. Il file include anche una struttura `CONFIG.ENVIRONMENTS` per isolare i pochi valori che potranno differire tra ambiente di test e produzione (es. `SPREADSHEET_ID`).

**Impatto**
- Le modifiche a nomi di fogli, celle fisse o tariffe si fanno in un solo punto (`config.gs`), riducendo il rischio di disallineamenti.
- Il passaggio da test a produzione richiederà, in linea di principio, di cambiare solo `CONFIG.ENV` da `"TEST"` a `"PROD"` (dopo aver valorizzato le chiavi in `CONFIG.ENVIRONMENTS.PROD`).
- Nessuna modifica di comportamento è stata introdotta da questa riorganizzazione: i valori sono stati spostati, non cambiati.

**Azioni future**
Valorizzare `CONFIG.ENVIRONMENTS.PROD` (SPREADSHEET_ID, FORM_ID) quando si prepara concretamente il passaggio a produzione.
