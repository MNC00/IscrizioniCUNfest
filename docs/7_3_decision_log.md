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

---

## 2026-07-20 Accesso ai fogli per nome (con fallback) e verifica etichette tariffe

**Contesto**
I fogli "tariffe" e "comunicazione" venivano aperti solo per posizione (`CONFIG.SHEETS.INDEX_TARIFFE`/`INDEX_COMUNICAZIONE`, cioè "il secondo/terzo foglio"), e le tariffe erano lette per riga fissa senza alcuna verifica: riordinare i tab o spostare una riga nel foglio tariffe rompeva i calcoli in modo silenzioso, senza errore visibile.

**Decisione presa**
Introdotto `src/repository.gs` come punto unico di accesso ai fogli: `getIscrizioniSheet_`, `getTariffeSheet_`, `getComunicazioneSheet_` cercano il foglio per nome (`CONFIG.SHEETS.TARIFFE`/`COMUNICAZIONE`, nuovi) e ricadono sull'indice di posizione solo come fallback, loggando un avviso. Aggiunta `verificaEtichetteTariffe_()`, eseguita a inizio calcolo prezzi: controlla che ogni riga configurata in `CONFIG.TARIFFE_RIGHE` contenga ancora l'etichetta di testo attesa in colonna A (`CONFIG.TARIFFE_ETICHETTE_ATTESE`). Se una riga risulta spostata, il calcolo prezzi si **interrompe** con un errore chiaro nel Log invece di calcolare un prezzo sbagliato.

**Impatto**
- Nessun cambiamento nei calcoli quando il foglio è nello stato atteso (verificato contro l'export in `docs/Iscrizioni CUN Fest 2026.xlsx`).
- I nomi reali dei tab "tariffe"/"comunicazione" nel Google Sheet live non sono stati confermati (l'export xlsx tronca i nomi lunghi): finché `CONFIG.SHEETS.TARIFFE`/`COMUNICAZIONE` non corrispondono esattamente al tab reale, il sistema userà il fallback per indice (comportamento identico a prima) con un avviso nel Log.
- Comportamento nuovo da testare con attenzione dopo il prossimo `clasp push`: se il foglio tariffe reale differisse anche minimamente dallo snapshot analizzato, il calcolo prezzi potrebbe bloccarsi per la prima volta con errore invece di procedere. Da verificare subito con la checklist di test.

**Azioni future**
Confermare/allineare i nomi esatti dei tab tariffe/comunicazione in `CONFIG.SHEETS.TARIFFE`/`COMUNICAZIONE` una volta verificati sul Google Sheet reale, per eliminare del tutto la dipendenza dall'ordine dei tab.

---

## 2026-07-20 Riprogettazione del workflow (Iterazione 3): meno errore umano, meno rigenerazioni sincrone

**Contesto**
Un'analisi funzionale del sistema (vedi `Documentazione_Fase1_Analisi_Sistema_Attuale.md` e le mappe in `3_1`/`3_2`/`3_3`) ha evidenziato: (a) comandi critici affidati a testo libero in cella (facile errore di battitura/maiuscole), (b) l'invio massivo irreversibile innescato da una singola cella senza conferma, (c) stato di un'iscrizione ricostruito a mano incrociando 3 colonne su 2 fogli, (d) ogni submit/edit che rigenera per intero 3 fogli derivati (Ordinato, Pagamento, Tabella Pasti), e (e) il tab "Stanze"/relativa funzione mai confermati come effettivamente in uso.

**Decisione presa**
Confermato con l'operatore principale: pubblico non tecnico solo in fase iscrizioni, un solo manutentore, schema stabile su più edizioni, nessuna urgenza di supporto AI/agentico a breve termine, tab "Stanze" non più usato, tollerabile un ritardo massimo di 5 minuti sulle sole viste derivate (non sulla mail di conferma). Di conseguenza:
1. **Rimossa la gestione "Stanze"**: `invioStanze`/`sendEmails()` e le relative chiavi CONFIG eliminate dal codice. Se nell'editor Apps Script risultasse ancora installato un trigger `invioStanze`, va rimosso manualmente dalla UI dei trigger (il codice sorgente non può farlo da solo).
2. **Celle-comando a testo libero → dropdown**: nuova funzione `configurarValidazioniComandi()` (`setup.gs`) applica Data Validation (menu a discesa, non bloccante) alle colonne "Nuovo invio" (Iscrizioni) e "Pagato" (Pagamento). Da eseguire una tantum dal nuovo menu "Iscrizioni CUN Fest".
3. **Invio massivo spostato su menu con conferma**: `invioRecovery()` non invia più nulla scrivendo "si" in una cella; l'unico modo per inviare la comunicazione di massa è il menu "Iscrizioni CUN Fest ▸ Invia comunicazione a tutti gli iscritti…" (`avviaInvioComunicazioneDiMassa()`, `setup.gs`), che mostra oggetto e numero destinatari e richiede conferma esplicita prima di chiamare `sendRecoveryEmails()`.
4. **Stato consolidato**: nuova colonna "Stato Iscrizione" nel foglio Iscrizioni, scritta da `aggiornaStatoIscrizione()` (`sheets.gs`), che riassume in un'unica etichetta leggibile "Mail di conferma inviata" + "Stato nuovo invio" + "Pagato" (letto dal foglio Pagamento). Le colonne granulari restano invariate come dettaglio.
5. **Rigenerazioni disaccoppiate dalla mail**: `mioTrigger()`/`onEdit()` eseguono subito solo calcolo prezzo + invio mail (nessun ritardo per l'iscritto); Ordinato/Pagamento/Pasti/Stato Iscrizione vengono solo "segnati come da rigenerare" (`segnaViewsDaRigenerare_()`) e aggiornati in blocco da un nuovo trigger a tempo `rigeneraViewsSeNecessario()` (da installare una tantum con `installaTriggerRigenerazionePeriodica()`, ogni 5 minuti). Riduce drasticamente il numero di rigenerazioni complete a parità di iscrizioni/modifiche ravvicinate.

**Impatto**
- Nessuna modifica al comportamento di calcolo prezzo/invio mail iniziale: restano istantanei come prima.
- Gli operatori non tecnici continuano a lavorare sullo stesso foglio, ma con dropdown al posto del testo libero sulle celle più a rischio, e con un menu per l'azione più pericolosa (invio a tutti).
- Ordinato/Pagamento/Pasti possono restare disallineati fino a un massimo di 5 minuti dopo una modifica, oppure essere aggiornati subito dal menu "Rigenera ora…".
- **Azioni una tantum richieste sull'ambiente di test PRIMA di usare il sistema**: aprire il foglio (per far scattare `onOpen()` e comparire il menu), poi eseguire da menu "Configura dropdown sulle celle comando" e "Installa/verifica trigger periodico 5 min". Ripetere entrambe le azioni anche sull'ambiente di produzione al momento del passaggio.
- Se un trigger installabile `invioStanze` risultasse ancora presente nell'elenco trigger di Apps Script, rimuoverlo manualmente (il codice associato non esiste più).

**Azioni future**
- Verificare durante i test che il dropdown "Nuovo invio" non interferisca con il reinvio manuale esistente (il confronto in `onEdit` resta case-insensitive/trim).
- Valutare, in una futura iterazione, se estendere la colonna "Stato Iscrizione" anche alla vista "Iscrizioni ordinate".
- Tenere traccia dell'esito della prima settimana con il trigger a 5 minuti attivo, per confermare che il ritardo massimo percepito resti accettabile.
