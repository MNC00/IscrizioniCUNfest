# 3.2 – Dizionario dei Dati

> **Nota sulle fonti**: nel workspace non è presente il file `struttura_foglio.csv` indicato nella traccia. Le intestazioni di colonna sono state ricavate da `docs/Iscrizioni CUN Fest 2026.xlsx` (i vari tab dello spreadsheet) e incrociate con tutte le operazioni di lettura/scrittura effettuate nei file `.js` presenti in `src/`.

Legenda **Origine Modifica**:
- **Modulo** = compilata automaticamente da Google Form (il testo arriva dalla risposta dell'utente)
- **Script** = scritta/aggiornata in automatico dal codice Apps Script
- **Manuale** = scritta a mano da un operatore direttamente sul foglio

⚠️ = colonna "chiave": usata dallo script in un controllo condizionale (`if`, confronto di stringa, ricerca per nome). **Non rinominare, spostare o cambiare formato senza aggiornare il codice**, pena la rottura silenziosa di una o più automazioni.

---

## Tab "Iscrizioni CUN Fest" (foglio collegato al Google Form)

| Nome Colonna | Scopo (dedotto dal codice) | Origine Modifica |
|---|---|---|
| Informazioni cronologiche | Timestamp di invio del form. Non letta da nessuna funzione. | Modulo |
| **Cognome** ⚠️ | Usata per l'abbinamento (match) delle righe in `creaFoglioPagamento`, per l'ordinamento in `creaFoglioOrdinato`/`creaFoglioPagamento`, e nell'elenco "Chi c'è lunedì" di `generaTabellaPasti`. | Modulo |
| **Nome** ⚠️ | Usata nel corpo di tutte le email (saluto), nel matching con il foglio Pagamento, nella tabella pasti. | Modulo |
| Genere | Nessun utilizzo nella logica dello script. | Modulo |
| **Data di nascita** ⚠️ | Usata per calcolare l'età dell'iscritto e applicare gli sconti fascia età in `AutoCalcolatorePrezzi_tuamadre`. | Modulo |
| Luogo di nascita | Nessun utilizzo nella logica dello script. | Modulo |
| Identificativo Responsabile | Nessun utilizzo nella logica dello script. | Modulo |
| Identificativo del nucleo familiare | Nessun utilizzo nella logica dello script. | Modulo |
| Zona di provenienza | Copiata così com'è nel foglio "Pagamento" (solo visualizzazione, nessun controllo condizionale). | Modulo |
| **Email** ⚠️ | Destinatario di **tutte** le email automatiche (conferma, aggiornamento, comunicazione di massa). Se vuota, blocca l'invio della mail per quella riga. | Modulo |
| Cellulare | Nessun utilizzo nella logica dello script. | Modulo |
| Partecipazione PreCUN | Non referenziata direttamente nel codice (verificare eventuale sovrapposizione con "Parliamo solo di lunedì"). | Modulo |
| **Data di arrivo** ⚠️ | Input per il calcolo del prezzo (notti/giorni), per la tabella pasti, e riportata nel corpo delle email. | Modulo |
| **Pasto di arrivo** ⚠️ | Determina il "pasto di inizio" nel calcolo prezzo e i conteggi pasti in tabella pasti. Valori attesi *esatti*: `Colazione`/`Pranzo`/`Cena`/`Dopo cena` (case-sensitive nel calcolo prezzi). | Modulo |
| **Data di partenza** ⚠️ | Input per il calcolo del prezzo e per la tabella pasti. | Modulo |
| **Pasto di partenza** ⚠️ | Determina il "pasto di fine" nel calcolo prezzo. Valori attesi *esatti*: `Colazione`/`Pranzo`/`Cena`/`Prima di colazione` (case-sensitive). | Modulo |
| **Prezzo** ⚠️ | Scritta automaticamente da `AutoCalcolatorePrezzi_tuamadre`; letta per decidere il testo delle email ("hasPrezzo") e copiata nel foglio Pagamento. **Sovrascritta a ogni esecuzione**. | Script |
| Gruppo di lavoro PreCUN a cui vuoi partecipare | Nessun utilizzo nella logica dello script. | Modulo |
| Note (campo famiglie) | Nessun utilizzo nella logica dello script. | Modulo |
| Colonna 19 | Campo del form senza nome descrittivo; non usato nel codice. | Modulo |
| Presenza cena domenica 09/08 | Titolo con data cablata (cambia ogni anno); non referenziata esplicitamente per nome nel codice. | Modulo |
| **Parliamo solo di lunedì** ⚠️ | Usata in `generaTabellaPasti` per calcolare pasti/pernottamenti extra del lunedì. Valori attesi: vuoto, `colazione`, `pranzo`, `cena`, `me ne vado dopo lunedì` — dipendenza forte dal testo esatto. | Modulo |
| **Partecipi SOLO al pranzo del CUN?** ⚠️ | Ramo alternativo nel calcolo prezzo e nella tabella pasti. Valore atteso `Si` in `Calcolatore prezzi.js` (maiuscola, confronto `===`), ma `si` minuscolo in `Generale mail.js`/`Tabella pasti.js` (confronto normalizzato) — **incoerenza da correggere con attenzione**. | Modulo |
| Colonna 23 / Colonna 23 2 | Colonne "orfane", nome generico, non usate nel codice. | Modulo |
| **Mail di conferma inviata** ⚠️ | Creata automaticamente se assente (`ensureColumn`). Rappresenta lo stato della macchina a stati degli invii email: `Inviata con prezzo` / `Inviata senza prezzo` / `prima senza, ora con`. Guida il blocco anti-doppio-invio in `invioMailAggiornamento`. | Script |
| **Nuovo invio** ⚠️ | Creata automaticamente se assente. Comando letto da `onEdit`: se contiene esattamente `invia con prezzo`, avvia l'intera catena di ricalcolo/reinvio. Viene svuotata o impostata a `già fatto` dopo l'elaborazione. | Manuale (comando operatore) / Script (reset) |
| Stato nuovo invio | Creata automaticamente se assente. Riporta l'esito dell'ultimo reinvio manuale (es. `Nuovo invio con prezzo`, `Bloccato: già inviata con prezzo`). Solo informativa, non letta da altre funzioni. | Script |

---

## Tab "Tabella Costi e Istruzioni Fog" (secondo foglio – tariffe/configurazione)

| Nome Colonna/Cella | Scopo (dedotto dal codice) | Origine Modifica |
|---|---|---|
| **Colonna A (chiavi) / Colonna B (valori)** ⚠️ | Letta come mappa chiave→valore (`readConfigMap`) **e contemporaneamente** per indice fisso di riga/colonna (es. `tariffe[1][1]`, `tariffe[8][1]`, `tariffe[24][1]`...) in `AutoCalcolatorePrezzi_tuamadre`. Doppio meccanismo di lettura sullo stesso dato: **estremamente delicata**, non inserire/spostare righe. | Manuale |
| **"data inizio CUN" / "data fine CUN"** ⚠️ | Cercate per testo in tutta la matrice (`trovaDateCUN`), usate per determinare fasce di prezzo e limiti data. | Manuale |
| **"ETA' CHE FINO ALLA QUALE SEI UN GIOVANE"** ⚠️ | Letta per indice fisso `tariffe[1][4]`, soglia età per gli sconti fascia. | Manuale |
| **D1 / D2 (celle dirette)** ⚠️ | Lette per indirizzo di cella diretto in `generaTabellaPasti` come date inizio/fine CUN — meccanismo diverso da `trovaDateCUN`, stesso dato letto in due modi differenti. | Manuale |

---

## Tab "Comunicazione a tutti gli iscritti"

| Nome Colonna | Scopo (dedotto dal codice) | Origine Modifica |
|---|---|---|
| OGGETTO | Oggetto dell'email di massa, letta da `sendRecoveryEmails`. | Manuale |
| TESTO DELLA MAIL | Corpo dell'email di massa. | Manuale |
| **INVIARE LA MAIL?** ⚠️ | Trigger letto da `invioRecovery` (`onEdit`): se il valore è esattamente `si`, avvia l'invio massivo. | Manuale |
| OGGETTO ULTIMA MAIL INVIATA / TESTO ULTIMA MAIL INVIATA | Storico dell'ultimo invio, scritti automaticamente a fine invio. | Script |

---

## Tab "Iscrizioni ordinate"

Copia 1:1 delle intestazioni del tab "Iscrizioni CUN Fest". **L'intero foglio viene cancellato e riscritto** (`clearContents()` + `setValues()`) a ogni esecuzione di `creaFoglioOrdinato`: nessuna colonna aggiuntiva, nessuna modifica manuale sopravvive al ciclo successivo.

| Nome Colonna | Scopo | Origine Modifica |
|---|---|---|
| *(tutte le colonne)* | Rigenerate integralmente a ogni trigger, ordinate per Cognome (col. B) e Nome (col. C). | Script |

---

## Tab "Pagamento"

| Nome Colonna | Scopo (dedotto dal codice) | Origine Modifica |
|---|---|---|
| Cognome, Nome, Data di nascita, Zona di provenienza, Data di arrivo, Pasto di arrivo, Data di partenza, Pasto di partenza, Prezzo | Sincronizzate dal foglio principale a ogni ciclo tramite `creaFoglioPagamento`, righe individuate/abbinate per **Nome+Cognome normalizzati**. | Script |
| **Pagato** ⚠️ | Unico campo **non sovrascritto automaticamente** — viene esplicitamente preservato durante il merge. Letto da `coloraPagati` (`onEdit`): se il valore è `x`, la riga viene colorata di azzurro. | Manuale |

---

## Tab "Tabella Pasti"

Interamente generata da `generaTabellaPasti`. Colonne: `Data`, `Colazione`, `Pranzo`, `Cena`, `Dormire`, più riepilogo "Solo Pranzo CUN"/"Totale" ed elenco "Chi c'è lunedì". Nessun input manuale previsto: ogni modifica manuale viene persa alla rigenerazione successiva.

| Nome Colonna | Scopo | Origine Modifica |
|---|---|---|
| *(tutte le colonne)* | Calcolate/scritte ex novo a ogni esecuzione del trigger. | Script |

---

## Tab "Stanze" (referenziato nel codice, non presente nel file Excel analizzato)

⚠️ **Da verificare manualmente**: tab non incluso nell'export Excel usato per questa analisi, potrebbe essere gestito a parte.

| Colonna/Cella attesa | Scopo (dedotto da `InvioStanze.js`) | Origine Modifica |
|---|---|---|
| A – Cognome, B – Nome, C – Email, D – Stanza assegnata | Usate da `sendEmails` per costruire l'email di assegnazione stanza e l'elenco dei compagni di stanza (righe con la stessa colonna D). | Manuale |
| **H4** ⚠️ | Comando di invio: se il valore è esattamente `INVIA`, avvia `sendEmails` per tutte le righe del tab. | Manuale |
| J4 | Esito dell'invio, scritto automaticamente a fine elaborazione. | Script |

---

## Riepilogo colonne "chiave" da NON rinominare/spostare mai senza aggiornare il codice

- Foglio "Iscrizioni CUN Fest": **Nome, Cognome, Email, Data di nascita, Data di arrivo, Pasto di arrivo, Data di partenza, Pasto di partenza, Prezzo, Parliamo solo di lunedì, Partecipi SOLO al pranzo del CUN?, Mail di conferma inviata, Nuovo invio**
- Foglio "Tabella Costi e Istruzioni Fog": tutte le righe usate per indice fisso (colonna B), le celle "data inizio CUN"/"data fine CUN", la cella "ETA' CHE FINO ALLA QUALE SEI UN GIOVANE", le celle D1/D2
- Foglio "Comunicazione a tutti gli iscritti": **INVIARE LA MAIL?**
- Foglio "Pagamento": **Pagato**
- Foglio "Stanze": **H4**
