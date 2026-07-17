# Documentazione Fase 1 - Analisi Sistema Attuale

> **Nota sulle fonti**: non erano presenti in workspace i file `struttura_foglio.csv` e `trigger_attuali.txt` indicati nella richiesta. Sono stati usati i file equivalenti effettivamente presenti:
> - Intestazioni colonne → estratte direttamente da `Iscrizioni CUN Fest 2026.xlsx` (tab: *Iscrizioni CUN Fest*, *Tabella Costi e Istruzioni Fog*, *Comunicazione a tutti gli iscritti*, *Iscrizioni ordinate*, *Pagamento*, *Tabella pasti*).
> - Trigger → estratti da `trigger_attuali.docx` (log dei trigger installati in Apps Script).
> - Codice → tutti i file `.js/.gs` presenti nella cartella.
> Il tab **"Stanze"**, referenziato nel codice (`InvioStanze.js`), **non è presente** nel file Excel fornito: è probabilmente un foglio creato/gestito a parte, non incluso nell'export analizzato. Va verificato a mano.

---

## 1. Elenco delle automazioni e funzionalità (Cosa fa il sistema)

### Azioni principali / obbligatorie
- **Calcolo automatico del prezzo di iscrizione** (`AutoCalcolatorePrezzi_tuamadre` in `Calcolatore prezzi.js`): legge le tariffe dal secondo foglio ("Tabella Costi e Istruzioni Fog"), calcola notti/pasti/giorni in base a data di arrivo/partenza, applica tariffe differenziate per fascia (generale / Uninord / Unisud), applica tetti massimi di spesa, applica sconti per fascia d'età, applica il calcolo speciale per chi partecipa "solo al pranzo del CUN", e scrive il risultato nella colonna "Prezzo" del foglio principale.
- **Invio email di conferma iscrizione** (`invioMailIscrizione` in `Generale mail.js`): all'arrivo di una nuova risposta dal Modulo Google, invia una mail HTML di conferma al partecipante con riepilogo soggiorno e prezzo (se disponibile), o messaggio di attesa prezzo. Aggiorna lo stato in colonna "Mail di conferma inviata".
- **Invio email di aggiornamento prezzo** (`invioMailAggiornamento` in `Generale mail.js`): quando un operatore imposta manualmente la colonna "Nuovo invio" a `"invia con prezzo"`, ricalcola e invia una nuova mail con il prezzo aggiornato; blocca l'invio se risulta già stata inviata una mail "con prezzo" in precedenza (anti-doppio invio).
- **Trigger orchestratore su nuova iscrizione** (`mioTrigger` in `Risposta all'iscrizione.js`, lanciato da `onFormSubmit`): esegue in sequenza calcolo prezzo → invio mail iniziale → riordino foglio → aggiornamento riepilogo pagamenti → rigenerazione tabella pasti.
- **Trigger orchestratore su richiesta manuale di reinvio** (`onEdit` in `Invia con prezzo.js`): se un operatore scrive `"invia con prezzo"` nella colonna "Nuovo invio", rilancia calcolo prezzo → mail di aggiornamento → riordino foglio → riepilogo pagamenti → tabella pasti.
- **Creazione/aggiornamento foglio "Iscrizioni ordinate"** (`creaFoglioOrdinato` in `Foglio ordinato.js`): copia tutti i dati dal foglio principale e li riordina per colonna B/C (Cognome/Nome), con formattazione dell'intestazione.
- **Creazione/aggiornamento foglio "Pagamento"** (`creaFoglioPagamento` in `Foglio pagamento.js`): estrae un sottoinsieme di campi (anagrafica, date, prezzo) per ogni iscritto, aggiorna righe esistenti individuate per nome+cognome, mantiene lo stato "Pagato" già inserito manualmente, aggiunge nuove righe per nuovi iscritti, riordina per Cognome/Nome.
- **Generazione tabella pasti** (`generaTabellaPasti` in `Tabella pasti.js`): calcola per ogni giorno del periodo CUN il numero di colazioni/pranzi/cene/pernottamenti necessari, gestendo casi speciali (arrivo/partenza a metà giornata, "solo pranzo CUN", presenze extra del lunedì), e produce anche un elenco nominale di chi resta il lunedì.

### Azioni secondarie / di supporto
- **Colorazione righe pagate** (`coloraPagati` in `Foglio pagamento.js`, `onEdit`): se un operatore scrive `"x"` nella colonna "Pagato" del foglio Pagamento, colora la riga di azzurro (feedback visivo).
- **Invio email massivo di recovery/comunicazione** (`sendRecoveryEmails` in `RecoveryEmail.js`, lanciato da `invioRecovery` in `InvioRecEmail.js` on edit): se un operatore imposta a `"si"` la cella "Invia mail a tutti?" nel tab "Comunicazione a tutti gli iscritti", invia una mail personalizzata (oggetto/testo liberi) a tutti gli indirizzi email unici presenti nel foglio iscrizioni, poi resetta i campi di comando.
- **Invio email di assegnazione stanza** (`sendEmails`/`invioStanze` in `InvioStanze.js`, on edit su cella `H4` del tab "Stanze" = `"INVIA"`): invia a ciascun iscritto la stanza assegnata e l'elenco dei compagni di stanza, poi scrive conferma in `J4`.
- **Funzioni di utilità comuni** (`Generale mail.js`): normalizzazione stringhe (`norm`), mappatura header→indice colonna (`buildHeaderIndex`, `getCol`), creazione automatica di colonne mancanti (`ensureColumn`), formattazione date in italiano (`formatDate`, `getDayName`, `getMonthName`), lettura config chiave/valore (`readConfigMap`), parsing robusto di date (`toDateSafe`), ricerca dinamica delle date CUN nel foglio tariffe (`trovaDateCUN`).

---

## 2. Mappatura dei Dati (Dizionario)

### Tab "Iscrizioni CUN Fest" (foglio collegato al Modulo Google)

| Nome Colonna | Modificata da Modulo o Script? | Utilizzo nel codice |
|---|---|---|
| Informazioni cronologiche | Modulo (timestamp automatico) | Non referenziata esplicitamente nel codice |
| Cognome | Modulo | Usata per matching in `creaFoglioPagamento`, ordinamento, `generaTabellaPasti` (elenco lunedì) — **⚠️ delicata** |
| Nome | Modulo | Usata in email (`invioMailIscrizione`), matching pagamento, tabella pasti — **⚠️ delicata** |
| Genere | Modulo | Non usata nella logica script |
| Data di nascita | Modulo | Usata per calcolo età e sconti in `AutoCalcolatorePrezzi_tuamadre` — **⚠️ delicata** |
| Luogo di nascita | Modulo | Non usata nella logica script |
| Identificativo Responsabile | Modulo | Non usata nella logica script |
| Identificativo del nucleo familiare | Modulo | Non usata nella logica script |
| Zona di provenienza | Modulo | Copiata in foglio Pagamento (solo visualizzazione) |
| Email | Modulo | Destinatario di tutte le email automatiche — **⚠️ delicata** |
| Cellulare | Modulo | Non usata nella logica script |
| Partecipazione PreCUN | Modulo | Non referenziata direttamente (nome simile a "Parliamo solo di lunedì", verificare sovrapposizione) |
| Data di arrivo | Modulo | Input calcolo prezzo, tabella pasti, contenuto email — **⚠️ delicata** |
| Pasto di arrivo | Modulo | Determina `pasto_inizio` nel calcolo prezzo e conteggi pasti — **⚠️ delicata** (valori attesi: Colazione/Pranzo/Cena/Dopo cena, case-sensitive) |
| Data di partenza | Modulo | Input calcolo prezzo, tabella pasti — **⚠️ delicata** |
| Pasto di partenza | Modulo | Determina `pasto_partenza`, valori attesi: Colazione/Pranzo/Cena/Prima di colazione — **⚠️ delicata**, case-sensitive |
| Prezzo | **Script** (`AutoCalcolatorePrezzi_tuamadre`) | Letto per decidere se mostrare prezzo in mail, copiato in foglio Pagamento — **⚠️ delicata**, sovrascritta automaticamente |
| Gruppo di lavoro PreCUN a cui vuoi partecipare | Modulo | Non usata nella logica script |
| Note (campo famiglie) | Modulo | Non usata nella logica script |
| Colonna 19 | Modulo (probabile campo form senza nome chiaro) | Non usata — **criticità**: nome colonna non descrittivo |
| Presenza cena domenica 09/08 | Modulo | Non referenziata esplicitamente (data cablata nel titolo colonna, dipendente dall'anno) |
| Parliamo solo di lunedì | Modulo | Usata in `generaTabellaPasti` per calcolare extra pasti/pernottamenti del lunedì (valori attesi: "", "colazione", "pranzo", "cena", "me ne vado dopo lunedì") — **⚠️ delicata**, forte dipendenza da stringhe esatte |
| Partecipi SOLO al pranzo del CUN? | Modulo | Ramo alternativo nel calcolo prezzo (`AutoCalcolatorePrezzi_tuamadre`) e nella tabella pasti; atteso valore `"Si"`/`"si"` — **⚠️ delicata** (case mismatch tra `'Si'` e `'si'` nei due file, vedi criticità) |
| Colonna 23 / Colonna 23 2 | Modulo | Nomi generici, non usate nel codice — **criticità**: colonne "orfane" |
| Mail di conferma inviata | **Script** (creata via `ensureColumn` se assente) | Stato macchina degli invii email: valori `"Inviata con prezzo"`, `"Inviata senza prezzo"`, `"prima senza, ora con"` — **⚠️ delicata**, guida la logica di blocco doppio invio |
| Nuovo invio | **Script/Operatore** (creata via `ensureColumn`) | Trigger manuale letto da `onEdit`: valore atteso `"invia con prezzo"` — **⚠️ delicata**, avvia intera catena di automazioni |
| Stato nuovo invio | **Script** (creata via `ensureColumn`) | Esito dell'ultimo reinvio (es. "Bloccato: già inviata con prezzo") |

### Tab "Tabella Costi e Istruzioni Fog" (foglio tariffe/config)

| Nome Colonna/Cella | Modificata da chi | Utilizzo nel codice |
|---|---|---|
| Colonna A (chiavi) / Colonna B (valori) righe varie | Operatore (manuale) | Letta come mappa chiave/valore da `readConfigMap`; letta anche per **posizione fissa** (es. `tariffe[1][1]`, `tariffe[8][1]`, ecc.) in `AutoCalcolatorePrezzi_tuamadre` — **⚠️ altamente delicata**: doppio meccanismo di lettura (per nome e per indice riga/colonna hardcoded) |
| "data inizio CUN" / "data fine CUN" | Operatore | Cercate per testo in tutta la matrice (`trovaDateCUN`) — più robusto, ma fragile se il testo cambia leggermente |
| "ETA' CHE FINO ALLA QUALE SEI UN GIOVANE" | Operatore | Letta come `tariffe[1][4]` (indice hardcoded) — **⚠️ delicata** |
| D1 / D2 (celle dirette) | Operatore | Lette direttamente per indirizzo cella in `generaTabellaPasti` come date inizio/fine CUN — **incoerenza**: stesso dato letto in due modi diversi in due funzioni diverse |

### Tab "Comunicazione a tutti gli iscritti"

| Nome Colonna | Modificata da chi | Utilizzo nel codice |
|---|---|---|
| OGGETTO | Operatore | Oggetto email di massa (`sendRecoveryEmails`) |
| TESTO DELLA MAIL | Operatore | Corpo email di massa |
| INVIARE LA MAIL? | Operatore | Trigger `onEdit` (`invioRecovery`): valore atteso `"si"` — **⚠️ delicata** |
| OGGETTO ULTIMA MAIL INVIATA / TESTO ULTIMA MAIL INVIATA | **Script** | Storico ultimo invio, scritto in automatico dopo l'invio |

### Tab "Iscrizioni ordinate"
Copia 1:1 delle intestazioni del tab "Iscrizioni CUN Fest", **rigenerata interamente** (clear + rewrite) da `creaFoglioOrdinato" ad ogni esecuzione — nessuna colonna aggiuntiva.

### Tab "Pagamento"

| Nome Colonna | Modificata da chi | Utilizzo nel codice |
|---|---|---|
| Cognome, Nome, Data di nascita, Zona di provenienza, Data di arrivo, Pasto di arrivo, Data di partenza, Pasto di partenza, Prezzo | **Script** (`creaFoglioPagamento`, sincronizzate dal foglio principale) | Rigenerate/aggiornate automaticamente ad ogni ciclo |
| Pagato | Operatore (manuale) | Letta da `coloraPagati` (`onEdit`) per colorare la riga se valore = `"x"` — **⚠️ delicata**, unico campo NON sovrascritto automaticamente (viene preservato durante il merge) |

### Tab "Tabella pasti"
Interamente generata dallo script (`generaTabellaPasti`): Data, Colazione, Pranzo, Cena, Dormire + riepilogo "Solo Pranzo CUN"/Totale + elenco "Chi c'è lunedì". Nessun input manuale previsto: eventuali modifiche manuali vengono perse ad ogni rigenerazione.

### Tab "Stanze" (referenziato nel codice ma non presente nel file Excel analizzato)
Colonne attese dal codice (`InvioStanze.js`): colonna A = Cognome, B = Nome, C = Email, D = Stanza assegnata; cella `H4` = comando invio (`"INVIA"`); cella `J4` = esito. **Da verificare manualmente**, potrebbe essere un foglio separato o creato ad hoc ogni anno.

---

## 3. Mappatura Automazioni e Trigger

Dati estratti da `trigger_attuali.docx` (log trigger installati), incrociati con il codice sorgente:

| Funzione lanciata | Tipo evento (da log) | File sorgente | Comportamento |
|---|---|---|---|
| `mioTrigger` | `ON_FORM_SUBMIT` | `Risposta all'iscrizione.js` | Scatta ad ogni invio del Modulo Google. Esegue in cascata: `AutoCalcolatorePrezzi_tuamadre()` → `invioMailIscrizione()` → `creaFoglioOrdinato()` → `creaFoglioPagamento()` → `generaTabellaPasti()`. È il trigger "principale" del flusso di iscrizione. |
| `onEdit` | `ON_EDIT` | `Invia con prezzo.js` | Trigger semplice/installabile su modifica cella nel foglio principale. Filtra sulla colonna "nuovo invio"/"invio con prezzo"; se il valore scritto è `"invia con prezzo"`, rilancia l'intera catena di automazioni (ricalcolo prezzo + mail aggiornamento + rigenerazione fogli derivati). |
| `invioRecovery` | `ON_EDIT` | `InvioRecEmail.js` | Trigger installabile su modifica cella. Controlla se è stata modificata la colonna "invia mail a tutti?" con valore `"si"`; se sì, chiama `sendRecoveryEmails()` per l'invio massivo. |
| `coloraPagati` | `ON_EDIT` | `Foglio pagamento.js` | Trigger installabile su modifica cella nel foglio "Pagamento". Se la colonna modificata è "Pagato", colora la riga. |

### Trigger NON presenti nel log ma referenziati nel codice (criticità)
| Funzione | File | Nota |
|---|---|---|
| `invioStanze` | `InvioStanze.js` | Presente nel codice come possibile handler `onEdit` (controlla cella `H4` del tab "Stanze"), ma **non compare nell'elenco trigger attivi** estratto da `trigger_attuali.docx`. Va verificato se: (a) il trigger non è mai stato installato, (b) è stato rimosso, o (c) il tab "Stanze" appartiene a un foglio diverso con trigger propri non documentati. |

### Osservazioni sui trigger
- **Trigger multipli su ON_EDIT**: esistono almeno 3 funzioni diverse (`onEdit`, `invioRecovery`, `coloraPagati`) agganciate separatamente a eventi di modifica cella, ciascuna con la propria logica di filtro colonna. Questo è funzionalmente corretto (sono installable trigger indipendenti), ma rende difficile capire "a colpo d'occhio" cosa succede modificando una cella qualsiasi, e ogni singolo `onEdit` viene comunque eseguito (con relativo `buildHeaderIndex`) ad ogni modifica su qualunque foglio dello spreadsheet, anche se poi esce subito — **overhead e rischio di errori se manca il foglio/colonna attesa**.
- Non risultano trigger `time-driven` (a orario) nell'elenco analizzato.

---

## 4. Individuazione Criticità

### Indici di colonna / riga hardcoded (magic numbers)
- In `AutoCalcolatorePrezzi_tuamadre`, tutte le tariffe sono lette per **indice fisso di riga/colonna** nel foglio tariffe (es. `tariffe[1][1]`, `tariffe[8][1]`, `tariffe[24][1]`, ecc.), con solo un commento a fianco a indicare cosa rappresentano. Se qualcuno inserisce o sposta una riga nel foglio tariffe, **tutti i calcoli prezzo si rompono silenziosamente** (nessun controllo di coerenza sui valori letti).
- In `generaTabellaPasti`, le date inizio/fine CUN sono lette da **celle fisse** `D1`/`D2` del secondo foglio, mentre nello stesso progetto `AutoCalcolatorePrezzi_tuamadre` le legge cercando il testo `"data inizio cun"`/`"data fine cun"` in tutta la matrice (`trovaDateCUN`). **Due meccanismi diversi per la stessa informazione**, con rischio di disallineamento se una delle due venisse aggiornata senza l'altra.
- `foglio = foglioCalcolo.getSheets()[0]` e `foglio2 = foglioCalcolo.getSheets()[1]` (indice posizionale dei fogli, non per nome): se l'ordine dei tab nello spreadsheet viene cambiato, lo script legge il foglio sbagliato senza errori evidenti.
- `dati[riga][1]` usato più volte nei `console.log` per indicare "il nome" per indice di colonna fisso, invece di usare `headerMap`/`idxNome` come fatto altrove nello stesso file — incoerenza interna.

### Variabile globale "leaked" tra iterazioni (bug latente)
- In `AutoCalcolatorePrezzi_tuamadre`, la variabile `pippo` (nome non descrittivo) viene dichiarata con `var` **dentro il ciclo `for`** solo in un ramo condizionale (`if (dataFine > limiteDataFine) { ...; var pippo = true; }`), ma letta subito dopo incondizionatamente (`if (pippo) {...}`). A causa dell'hoisting di `var`, se in un'iterazione precedente `pippo` è stato impostato a `true` e nella successiva non viene ridefinito, il valore **persiste tra le righe/iterazioni**, causando calcoli errati per iscritti successivi. Bug fragile e difficile da individuare.

### Case-sensitivity e stringhe "magiche" incoerenti
- `Partecipi SOLO al pranzo del CUN?`: in `AutoCalcolatorePrezzi_tuamadre` il confronto è `dati[riga][idxSoloPranzoCun] !== 'Si'` (con la S maiuscola), mentre in `generaTabellaPasti` e `Generale mail.js` si usa `norm(...)` o `.toLowerCase() === 'si'`. **Incoerenza di case sensitivity** tra funzioni diverse sullo stesso campo: un utente che compila "si" minuscolo può ricevere un calcolo prezzo diverso da quello atteso nella tabella pasti.
- I valori attesi per "Pasto di arrivo"/"Pasto di partenza" (`'Colazione'`, `'Pranzo'`, `'Cena'`, `'Dopo cena'`, `'Prima di colazione'`) sono confrontati con `===` senza `norm()`: eventuali spazi, accenti o variazioni di maiuscole/minuscole nel Modulo Google (es. cambio testo di un'opzione) rompono silenziosamente il calcolo (nessun `else`/default esplicito per valori non riconosciuti → variabile `undefined` propagata nei calcoli).

### Mancanza di gestione errori (try/catch)
- Nessuna delle funzioni principali (`AutoCalcolatorePrezzi_tuamadre`, `invioMailIscrizione`, `creaFoglioOrdinato`, `creaFoglioPagamento`, `generaTabellaPasti`, `sendRecoveryEmails`, `sendEmails`) ha blocchi `try/catch`. Un errore su una singola riga (es. data mancante, foglio non trovato) interrompe l'intera esecuzione del trigger, lasciando il sistema in stato intermedio (es. prezzo calcolato ma mail non inviata, o foglio pagamento non aggiornato).
- `trovaDateCUN` lancia un `throw new Error(...)` esplicito se le date non sono valide, ma questo errore **non viene mai catturato** a monte: nei trigger `onFormSubmit`/`onEdit` un errore non gestito blocca silenziosamente (dal punto di vista dell'utente) tutta la catena di automazioni successive.

### Riferimenti cablati (hardcoded) nel codice
- **IBAN e causale di pagamento** sono scritti per esteso, duplicati identici in almeno 4 punti diversi di `Generale mail.js` (email iniziale con/senza prezzo, email aggiornamento con/senza prezzo, email solo pranzo). Se l'IBAN cambia, serve modificare N occorrenze con rischio di dimenticarne una.
- **URL del sito CUN Fest** (`https://sites.google.com/view/pgstimm/cunfest?authuser=0`) ripetuto identico in ogni template email.
- **Testi email interamente in italiano cablati come stringhe HTML concatenate** dentro il codice: qualunque modifica di testo/tono richiede toccare il codice Apps Script, con rischio di rompere l'HTML (tag non chiusi, es. `<\p>` invece di `</p>` in `InvioStanze.js`).
- **Nomi dei fogli cablati come stringhe letterali** (`"Iscrizioni CUN Fest"`, `"Pagamento"`, `"Tabella Pasti"`, `"Stanze"`) sparsi in più file: se un tab viene rinominato, il codice fallisce silenziosamente (in molti punti non c'è controllo su `sheet == null`).
- Nessun destinatario email di fallback/amministratore per notifiche di errore: se un invio fallisce, nessuno viene avvisato.

### Logiche fragili / debito tecnico strutturale
- **Duplicazione quasi identica di codice**: `invioMailIscrizione` e `invioMailAggiornamento` condividono la quasi totalità della logica di lettura colonne e costruzione dati, differendo solo per la gestione dello stato finale — candidati alla fattorizzazione.
- **Duplicazione della logica di sconto per età** (4 blocchi `if/else if` identici ripetuti due volte nello stesso file `Calcolatore prezzi.js`, uno per il ramo normale e uno per il ramo "solo pranzo").
- **Bug booleano sospetto**: nei rami Uninord/Unisud di `AutoCalcolatorePrezzi_tuamadre` la condizione è scritta `if (x !== 0 || x !== 3)`, che è **sempre vera** (un numero non può essere contemporaneamente diverso sia da 0 sia da 3 essere falso — l'OR rende la condizione un tautologia), mentre nel ramo generale la stessa condizione è scritta correttamente con `&&` (`if (x !== 0 && x !== 3)`). Probabile refuso copia-incolla che altera il comportamento atteso nei rami Uninord/Unisud.
- **Nome di funzione non professionale**: `AutoCalcolatorePrezzi_tuamadre` — da rinominare in fase di refactoring per leggibilità e professionalità del codice.
- **Rigenerazione distruttiva di interi fogli** (`clearContents()` + riscrittura completa) in `creaFoglioOrdinato` e `generaTabellaPasti` ad ogni esecuzione: qualsiasi nota o formattazione manuale aggiunta a quei fogli viene persa; inoltre operazione costosa se eseguita molto spesso (ad ogni submit/edit).
- **Match "fuzzy" per nome+cognome** in `creaFoglioPagamento` per capire se una riga esiste già: due persone omonime verrebbero unite/confuse in un'unica riga nel foglio Pagamento.
- **Colonne "orfane"** nel foglio principale (`Colonna 19`, `Colonna 23`, `Colonna 23 2`) senza nome descrittivo né uso noto nel codice — rischio di eliminarle per errore o di non sapere a cosa servano.
- **Titoli di colonna con riferimenti a date specifiche** (es. "Presenza cena domenica 09/08") cablati nel nome della colonna: cambiano ogni anno e richiedono di rinominare manualmente l'intestazione, con rischio di disallineamento rispetto al codice che la referenzia per nome.
- **Tab "Stanze" non tracciato/non coerente**: funzionalità presente nel codice (`InvioStanze.js`) ma il tab non risulta nel file Excel analizzato né il trigger compare nel log — area del sistema con visibilità incompleta, da chiarire prima di qualunque refactoring.

---

**Sintesi**: il sistema è funzionalmente completo ma presenta un debito tecnico concentrato soprattutto nel calcolo prezzi (indici hardcoded, variabile con scope errato, condizione booleana probabilmente errata) e nella mancanza di gestione degli errori su tutte le automazioni a catena. Prima di qualsiasi refactoring strutturale (Fase 4) è raccomandato: (1) chiarire lo stato reale del tab "Stanze" e del suo trigger, (2) verificare con l'operatore se il bug booleano nei rami Uninord/Unisud è un comportamento voluto o un refuso, (3) congelare i nomi di colonna attualmente in uso come "contratto" prima di introdurre una configurazione centralizzata.
