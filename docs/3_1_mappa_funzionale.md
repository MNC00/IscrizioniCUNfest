# 3.1 – Mappa Funzionale: "Come funziona oggi"

> Percorso di un'iscrizione dal momento in cui una persona compila il Google Form fino alla fine del processo (pagamento e, se previsto, assegnazione stanza). Linguaggio semplice, pensato anche per chi non programma.

---

## 1. Il percorso di un'iscrizione, passo per passo

### Passo 1 — La persona compila il Google Form
Il modulo scrive automaticamente una nuova riga in fondo al foglio **"Iscrizioni CUN Fest"**. Questo evento (invio del form) fa partire in automatico, tramite trigger, la funzione `mioTrigger()` (file `Risposta all'iscrizione.js`).

### Passo 2 — Parte la catena automatica (`mioTrigger`)
`mioTrigger()` esegue, in sequenza e senza pause, queste 5 azioni:

1. **Calcolo del prezzo** – `AutoCalcolatorePrezzi_tuamadre()` (`Calcolatore prezzi.js`)
2. **Invio mail di conferma iscrizione** – `invioMailIscrizione()` (`Generale mail.js`)
3. **Riordino del foglio "Iscrizioni ordinate"** – `creaFoglioOrdinato()` (`Foglio ordinato.js`)
4. **Aggiornamento del foglio "Pagamento"** – `creaFoglioPagamento()` (`Foglio pagamento.js`)
5. **Rigenerazione della "Tabella Pasti"** – `generaTabellaPasti()` (`Tabella pasti.js`)

Se un passaggio fallisce (es. dati mancanti), lo script si ferma lì: i passaggi successivi non vengono eseguiti (non esiste gestione degli errori).

### Passo 3 — Eventuali reinvii manuali
Un operatore può forzare un nuovo giro di calcolo/email scrivendo il testo esatto `"invia con prezzo"` nella colonna **"Nuovo invio"** della riga dell'iscritto. Questo fa scattare `onEdit()` (`Invia con prezzo.js`), che rilancia la stessa catena di 5 azioni, ma usando `invioMailAggiornamento()` al posto della mail iniziale.

### Passo 4 — Comunicazioni di massa (facoltativo)
Un operatore può inviare una mail identica a **tutti** gli iscritti scrivendo `"si"` nella cella "Invia mail a tutti?" del tab "Comunicazione a tutti gli iscritti". Questo è indipendente dal ciclo di vita della singola iscrizione.

### Passo 5 — Assegnazione stanze (facoltativo, a fine processo)
Quando le stanze sono state decise (di solito a ridosso dell'evento), un operatore scrive `"INVIA"` nella cella `H4` del tab "Stanze": parte l'invio dell'email con la stanza assegnata e i compagni di stanza a ciascun iscritto.

### Passo 6 — Pagamento
Il pagamento viene registrato **a mano** da un operatore, scrivendo `"x"` nella colonna "Pagato" del foglio "Pagamento". Questa è l'unica azione che chiude, di fatto, il ciclo di vita dell'iscrizione: da quel momento in poi il sistema non fa più nulla di automatico per quella persona (a parte l'eventuale mail stanze).

---

## 2. I controlli logici effettuati sui dati in ingresso

Questi sono i controlli "veri" presenti nel codice (non sono presunti, sono verificati riga per riga):

| Dove | Cosa controlla | Cosa succede se il controllo fallisce |
|---|---|---|
| `invioMailIscrizione` / `invioMailAggiornamento` | Nome ed Email non vuoti | La funzione esce subito, **nessuna mail viene inviata** |
| `invioMailAggiornamento` | Stato precedente in "Mail di conferma inviata" (`"inviata con prezzo"`, `"inviata"`, `"prima senza, ora con"`) | Se è già stata inviata una mail "con prezzo", il reinvio è **bloccato** e viene scritto "Bloccato: già inviata con prezzo" |
| `AutoCalcolatorePrezzi_tuamadre` | Le tariffe base (`tariffa_giorno_completo`, `tariffa_notte`, `tariffa_colazione`, `tariffa_pasto_principale`, `solo_pranzo_CUN`) non sono vuote | Se anche una sola manca, **l'intero calcolo prezzi si interrompe silenziosamente** per tutte le righe (nessun prezzo viene scritto) |
| `trovaDateCUN` | Le date "data inizio CUN" e "data fine CUN" sono presenti e valide nel foglio tariffe | Se mancano/non sono valide, viene lanciato un errore che **blocca l'intera catena** `mioTrigger`/`onEdit` a quel punto |
| `onEdit` (Invia con prezzo) | La colonna modificata è proprio "Nuovo invio" e il testo scritto è esattamente `"invia con prezzo"` (case-insensitive, spazi ai lati ignorati) | Se il testo o la colonna non corrispondono, non succede nulla |
| `invioRecovery` | La colonna modificata è "Invia mail a tutti?" e il valore è esattamente `"si"` | Altrimenti nessun invio |
| `invioStanze` | Il foglio modificato è "Stanze", la cella è esattamente `H4`, il valore è esattamente `"INVIA"` | Altrimenti nessun invio |
| `coloraPagati` | La colonna modificata è "Pagato" | Se il valore è `"x"` colora la riga di azzurro, altrimenti la riporta a bianco |
| `AutoCalcolatorePrezzi_tuamadre` | Ramo "Partecipi SOLO al pranzo del CUN?" == `'Si'` (con S maiuscola, confronto esatto) | Se scritto diversamente (es. "si" minuscolo) il controllo **non** riconosce la richiesta e applica il calcolo prezzo normale invece di quello del solo pranzo — comportamento incoerente rispetto ad altre funzioni che usano un confronto senza distinzione tra maiuscole/minuscole |

**Nota bene:** non esistono controlli di validazione robusti su formati data, valori dei menu a tendina del form, o presenza dei fogli/colonne attese: se qualcosa cambia nel form o nei nomi delle colonne, gli errori non sempre vengono segnalati in modo chiaro.

---

## 3. Le email automatiche: quali e quando partono esattamente

| # | Email | Funzione | Momento esatto in cui parte | Condizione |
|---|---|---|---|---|
| 1 | **Conferma iscrizione** | `invioMailIscrizione()` | Subito dopo l'invio del Google Form (dentro `mioTrigger`), sull'ultima riga del foglio | Nome ed Email presenti |
| 2 | **Aggiornamento prezzo** | `invioMailAggiornamento()` | Quando un operatore scrive `"invia con prezzo"` nella colonna "Nuovo invio" (dentro `onEdit`) | Nome/Email presenti **e** non risulti già inviata una mail "con prezzo" in precedenza |
| 3 | **Comunicazione di massa** | `sendRecoveryEmails()` | Quando un operatore scrive `"si"` in "Invia mail a tutti?" nel tab "Comunicazione a tutti gli iscritti" | A ogni indirizzo email unico presente nel foglio iscrizioni |
| 4 | **Assegnazione stanza** | `sendEmails()` (tramite `invioStanze`) | Quando un operatore scrive `"INVIA"` nella cella `H4` del tab "Stanze" | A ogni riga presente nel tab "Stanze" (colonne A-D compilate) |

Tutte le email vengono inviate tramite `MailApp.sendEmail(...)`, quindi in formato HTML, senza possibilità di annullamento una volta partite (**azione irreversibile**).

---

## 4. Gli "stati" che un'iscrizione può assumere

Lo "stato" di un'iscrizione non è un unico campo, ma si ricostruisce da due colonne del foglio principale: **"Mail di conferma inviata"** e **"Stato nuovo invio"**, più lo stato "Pagato" nel foglio Pagamento.

### Colonna "Mail di conferma inviata"
| Valore | Significato |
|---|---|
| *(vuota)* | Iscrizione arrivata ma non ancora processata (raro: dovrebbe durare solo l'istante di esecuzione del trigger) |
| `Inviata senza prezzo` | Mail di conferma inviata, ma il prezzo non era ancora disponibile al momento dell'iscrizione |
| `Inviata con prezzo` | Mail di conferma inviata con il prezzo già calcolato |
| `prima senza, ora con` | La mail iniziale era stata inviata senza prezzo; successivamente è stato fatto un reinvio con prezzo disponibile |

### Colonna "Stato nuovo invio" (esito dell'ultimo reinvio manuale)
| Valore | Significato |
|---|---|
| *(vuota)* | Nessun reinvio manuale ancora richiesto |
| `Nuovo invio con prezzo` | Reinvio eseguito con successo, prezzo comunicato |
| `Bloccato: già inviata con prezzo` | Reinvio richiesto ma bloccato perché era già stata inviata una mail "con prezzo" (anti-doppio invio) |

### Colonna "Nuovo invio" (comando, non stato)
| Valore | Significato |
|---|---|
| *(vuota)* | Nessuna azione richiesta |
| `invia con prezzo` | Comando scritto dall'operatore per forzare il reinvio; viene svuotato o impostato a `"già fatto"` subito dopo l'elaborazione |

### Stato "Pagato" (foglio "Pagamento", campo manuale)
| Valore | Significato |
|---|---|
| *(vuoto)* | Non risulta ancora pagato |
| `x` | Pagamento registrato manualmente dall'operatore → riga colorata di azzurro |

### Riepilogo del ciclo di vita completo
```
Invio Form
   └─► Calcolo prezzo (se tariffe disponibili)
         └─► Mail di conferma [Inviata con/senza prezzo]
               └─► (opzionale, se prezzo mancante) reinvio manuale operatore
                     └─► Mail di aggiornamento [Nuovo invio con prezzo | Bloccato]
                           └─► Pagamento registrato manualmente [Pagato = x]
                                 └─► (opzionale, a ridosso evento) Mail assegnazione stanza
```
