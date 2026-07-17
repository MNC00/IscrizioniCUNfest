# 3.3 – Mappa delle Automazioni e dei Trigger

> **Nota sulle fonti**: nel workspace non è presente il file `trigger_attuali.txt` indicato nella traccia; è stato usato il file equivalente `docs/trigger_attuali.docx` (log dei trigger installati in Apps Script), incrociato con il codice sorgente in `src/`.

---

## 1. Trigger installati (da `trigger_attuali.docx`)

| Funzione lanciata dal trigger | Tipo di evento | File sorgente |
|---|---|---|
| `mioTrigger` | `ON_FORM_SUBMIT` (invio Google Form) | `Risposta all'iscrizione.js` |
| `onEdit` | `ON_EDIT` (modifica cella, foglio principale) | `Invia con prezzo.js` |
| `invioRecovery` | `ON_EDIT` (modifica cella) | `InvioRecEmail.js` |
| `coloraPagati` | `ON_EDIT` (modifica cella, foglio "Pagamento") | `Foglio pagamento.js` |

⚠️ **Attenzione**: `invioStanze` (`InvioStanze.js`) è presente nel codice come possibile handler `onEdit`, ma **non risulta** nell'elenco dei trigger attivi nel log. Va verificato se il trigger non è mai stato installato, è stato rimosso, oppure appartiene a un progetto/foglio "Stanze" separato non documentato.

Non risultano trigger a orario (`time-driven`) nell'elenco analizzato.

---

## 2. Elenco delle funzioni principali

### `mioTrigger()` — `Risposta all'iscrizione.js`
- **Scopo**: orchestratore principale del flusso di iscrizione. Esegue in sequenza calcolo prezzo, invio mail, riordino fogli e rigenerazione tabelle.
- **Attivazione**: trigger installabile `ON_FORM_SUBMIT`.
- **Chiama**: `AutoCalcolatorePrezzi_tuamadre()`, `invioMailIscrizione()`, `creaFoglioOrdinato()`, `creaFoglioPagamento()`, `generaTabellaPasti()`.

### `AutoCalcolatorePrezzi_tuamadre()` — `Calcolatore prezzi.js`
- **Scopo**: calcola il prezzo di iscrizione per ogni riga del foglio, in base a notti, pasti, fascia (generale/Uninord/Unisud), tetti massimi e sconti età. Scrive il risultato nella colonna "Prezzo".
- **Attivazione**: chiamata da `mioTrigger()` e da `onEdit()` (Invia con prezzo). Non ha un trigger diretto proprio.

### `readConfigMap(sheet)` — `Calcolatore prezzi.js`
- **Scopo**: funzione di supporto, legge il foglio tariffe come mappa chiave/valore (colonna A = chiave, colonna B = valore).
- **Attivazione**: chiamata da `AutoCalcolatorePrezzi_tuamadre()`.

### `toDateSafe(v)` — `Calcolatore prezzi.js`
- **Scopo**: funzione di supporto, converte in modo robusto un valore (stringa, numero seriale, Date) in un oggetto Date valido.
- **Attivazione**: funzione di utilità, disponibile per essere chiamata da altre funzioni.

### `trovaDateCUN(sheet)` — `Calcolatore prezzi.js`
- **Scopo**: cerca nel foglio tariffe le celle con testo "data inizio cun"/"data fine cun" e restituisce le date corrispondenti. Lancia un errore se non le trova.
- **Attivazione**: chiamata da `AutoCalcolatorePrezzi_tuamadre()`.

### `invioMailIscrizione()` — `Generale mail.js`
- **Scopo**: invia l'email di conferma iscrizione all'ultimo iscritto in ordine di riga, con riepilogo soggiorno e prezzo (se disponibile). Aggiorna lo stato in "Mail di conferma inviata".
- **Attivazione**: chiamata da `mioTrigger()`.

### `invioMailAggiornamento(riga)` — `Generale mail.js`
- **Scopo**: invia una mail di aggiornamento prezzo per una riga specifica; blocca l'invio se risulta già inviata una mail "con prezzo".
- **Attivazione**: chiamata da `onEdit()` (Invia con prezzo.js) quando l'operatore imposta "Nuovo invio" a `"invia con prezzo"`.

### `buildEmailContentIniziale(opts)` / `buildEmailContentAggiornamento(opts)` — `Generale mail.js`
- **Scopo**: costruiscono oggetto e corpo HTML delle email (iniziale/aggiornamento), gestendo i casi con/senza prezzo e "solo pranzo".
- **Attivazione**: chiamate rispettivamente da `invioMailIscrizione()` e `invioMailAggiornamento()`.

### Funzioni di utilità comuni — `Generale mail.js`
- `norm(s)`: normalizza una stringa (minuscolo, senza accenti, spazi puliti) per confronti robusti.
- `buildHeaderIndex(sheet)`: crea una mappa nome-colonna → indice, leggendo la prima riga del foglio.
- `getCol(aliases, headerMap)`: cerca l'indice di una colonna tra più alias possibili.
- `ensureColumn(sheet, headerMap, title)`: crea una nuova colonna in coda se non esiste già.
- `formatDate`, `getDayName`, `getMonthName`, `getAnnoAttuale`: formattazione date in italiano.
- **Attivazione**: funzioni di supporto, chiamate da quasi tutte le altre funzioni del progetto.

### `mioTrigger` orchestratore su nuova iscrizione — vedi sopra.

### `onEdit(e)` — `Invia con prezzo.js`
- **Scopo**: orchestratore di reinvio manuale. Se un operatore scrive `"invia con prezzo"` nella colonna "Nuovo invio", rilancia l'intera catena di calcolo/invio per quella riga.
- **Attivazione**: trigger installabile `ON_EDIT` sul foglio principale.
- **Chiama**: `AutoCalcolatorePrezzi_tuamadre()`, `invioMailAggiornamento(row)`, `creaFoglioOrdinato()`, `creaFoglioPagamento()`, `generaTabellaPasti()`.

### `creaFoglioOrdinato()` — `Foglio ordinato.js`
- **Scopo**: copia tutti i dati dal foglio principale nel tab "Iscrizioni ordinate", li ordina per Cognome/Nome e formatta l'intestazione.
- **Attivazione**: chiamata da `mioTrigger()` e da `onEdit()` (Invia con prezzo.js).

### `creaFoglioPagamento()` — `Foglio pagamento.js`
- **Scopo**: estrae un sottoinsieme di campi (anagrafica, date, prezzo) per ogni iscritto e li scrive/aggiorna nel tab "Pagamento", individuando le righe esistenti per Nome+Cognome, preservando lo stato "Pagato" già inserito manualmente.
- **Attivazione**: chiamata da `mioTrigger()` e da `onEdit()` (Invia con prezzo.js).

### `coloraPagati(e)` — `Foglio pagamento.js`
- **Scopo**: se un operatore scrive `"x"` nella colonna "Pagato" del tab "Pagamento", colora la riga di azzurro come feedback visivo.
- **Attivazione**: trigger installabile `ON_EDIT` sul foglio "Pagamento".

### `invioRecovery(e)` — `InvioRecEmail.js`
- **Scopo**: controlla se è stata modificata la cella "Invia mail a tutti?" nel tab "Comunicazione a tutti gli iscritti" con valore `"si"`; in tal caso lancia l'invio massivo.
- **Attivazione**: trigger installabile `ON_EDIT`.
- **Chiama**: `sendRecoveryEmails()`.

### `sendRecoveryEmails()` — `RecoveryEmail.js`
- **Scopo**: invia una mail personalizzata (oggetto/testo liberi presi dal tab "Comunicazione") a tutti gli indirizzi email unici presenti nel foglio iscrizioni, poi salva lo storico e resetta i campi di comando.
- **Attivazione**: chiamata da `invioRecovery(e)`.

### `invioStanze(e)` — `InvioStanze.js`
- **Scopo**: controlla se la cella modificata è `H4` del tab "Stanze" e il valore è `"INVIA"`; in tal caso lancia l'invio delle email di assegnazione stanza.
- **Attivazione**: presumibilmente pensata come trigger installabile `ON_EDIT`, ma ⚠️ **non presente nel log dei trigger attivi** — da verificare.
- **Chiama**: `sendEmails()`.

### `sendEmails()` — `InvioStanze.js`
- **Scopo**: per ogni riga del tab "Stanze" invia un'email con la stanza assegnata e l'elenco dei compagni di stanza (righe con la stessa colonna D); scrive l'esito in `J4`.
- **Attivazione**: chiamata da `invioStanze(e)`.

### `generaTabellaPasti()` — `Tabella pasti.js`
- **Scopo**: calcola per ogni giorno del periodo CUN il numero di colazioni/pranzi/cene/pernottamenti necessari (gestendo arrivi/partenze a metà giornata, "solo pranzo CUN", presenze extra del lunedì) e produce anche l'elenco di chi resta il lunedì. Rigenera interamente il tab "Tabella Pasti".
- **Attivazione**: chiamata da `mioTrigger()` e da `onEdit()` (Invia con prezzo.js).

---

## 3. Schema delle catene di chiamata

```
ON_FORM_SUBMIT
  └─ mioTrigger()
       ├─ AutoCalcolatorePrezzi_tuamadre()
       │    ├─ readConfigMap()
       │    └─ trovaDateCUN()
       ├─ invioMailIscrizione()
       │    └─ buildEmailContentIniziale()
       ├─ creaFoglioOrdinato()
       ├─ creaFoglioPagamento()
       └─ generaTabellaPasti()

ON_EDIT (colonna "Nuovo invio" = "invia con prezzo")
  └─ onEdit()
       ├─ AutoCalcolatorePrezzi_tuamadre()
       ├─ invioMailAggiornamento(riga)
       │    └─ buildEmailContentAggiornamento()
       ├─ creaFoglioOrdinato()
       ├─ creaFoglioPagamento()
       └─ generaTabellaPasti()

ON_EDIT (cella "Invia mail a tutti?" = "si")
  └─ invioRecovery()
       └─ sendRecoveryEmails()

ON_EDIT (colonna "Pagato" nel foglio Pagamento)
  └─ coloraPagati()   [nessuna funzione a valle, solo formattazione]

ON_EDIT (cella H4 tab "Stanze" = "INVIA")  — trigger non confermato attivo
  └─ invioStanze()
       └─ sendEmails()
```

---

## 4. Funzioni Pericolose

Elenco esclusivo delle funzioni che eseguono operazioni **distruttive** (sovrascrittura/cancellazione dati) o **irreversibili** (invio email). Da trattare con la massima cautela in ogni futura modifica.

| Funzione | File | Perché è pericolosa |
|---|---|---|
| `creaFoglioOrdinato()` | `Foglio ordinato.js` | Esegue `clearContents()` sull'intero tab "Iscrizioni ordinate" e lo riscrive da zero a ogni esecuzione: qualunque nota o formattazione manuale viene persa. |
| `generaTabellaPasti()` | `Tabella pasti.js` | Esegue `clearContents()` sull'intero tab "Tabella Pasti" e lo rigenera interamente: nessuna modifica manuale può sopravvivere. |
| `AutoCalcolatorePrezzi_tuamadre()` | `Calcolatore prezzi.js` | Sovrascrive incondizionatamente la colonna "Prezzo" per tutte le righe a ogni esecuzione, anche se un valore era stato corretto a mano in precedenza. |
| `creaFoglioPagamento()` | `Foglio pagamento.js` | Sovrascrive le righe esistenti nel tab "Pagamento" (tranne la colonna "Pagato"); il matching per Nome+Cognome normalizzati può unire per errore due persone omonime. |
| `invioMailIscrizione()` | `Generale mail.js` | Invia un'email reale al partecipante — azione irreversibile, nessuna conferma richiesta prima dell'invio. |
| `invioMailAggiornamento()` | `Generale mail.js` | Invia un'email reale al partecipante — irreversibile; ha un controllo anti-doppio-invio, ma solo per lo scenario "già inviata con prezzo". |
| `sendRecoveryEmails()` | `RecoveryEmail.js` | Invia un'email di massa a **tutti** gli indirizzi email unici del foglio iscrizioni in un colpo solo — irreversibile e ad alto impatto se il testo contiene errori. |
| `sendEmails()` | `InvioStanze.js` | Invia un'email a ciascun iscritto del tab "Stanze" con dati sensibili (compagni di stanza) — irreversibile. |

**Nota**: nessuna delle funzioni sopra elencate dispone di conferma preventiva, log degli invii, o gestione degli errori (`try/catch`): un errore a metà esecuzione può lasciare il sistema in uno stato intermedio (es. alcune email inviate e altre no, oppure un foglio derivato aggiornato e un altro no).
