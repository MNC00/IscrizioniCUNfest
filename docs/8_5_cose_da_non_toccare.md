# 8.5 – Cose da NON Toccare

Questo documento esiste per proteggere il progetto da rotture involontarie. Se non sei sicuro/a del motivo per cui una regola qui sotto esiste, **non modificare quella cosa**: chiedi prima, o consulta la documentazione tecnica collegata (`docs/3_1`, `3_2`, `3_3`).

Regola generale: **ogni modifica alle parti elencate qui sotto va fatta solo dopo una verifica consapevole, mai per caso o "tanto poi si sistema".**

---

## 1. ID e configurazioni in `config.gs`

- **Non cambiare i nomi dei fogli** in `CONFIG.SHEETS` (es. `"Iscrizioni CUN Fest"`, `"Pagamento"`, ecc.) senza rinominare **anche** i tab reali nel Google Sheet, e viceversa. Se non corrispondono esattamente (anche uno spazio in più), lo script smette di trovare il foglio.
- **Non cambiare gli indici** `INDEX_ISCRIZIONI`, `INDEX_TARIFFE`, `INDEX_COMUNICAZIONE`: sono posizioni fisse dei tab nello spreadsheet. Se l'ordine dei tab cambia nello Sheet, questi numeri si disallineano silenziosamente.
- **Non modificare `CONFIG.CELLE` o `CONFIG.TARIFFE_RIGHE`** senza aver prima verificato riga per riga che corrispondano ancora alla posizione reale dei dati nel foglio tariffe. Sono riferimenti a righe/celle fisse: uno spostamento di riga nel foglio tariffe li rompe senza generare un errore visibile.
- **Non valorizzare `CONFIG.ENVIRONMENTS.PROD` o cambiare `CONFIG.ENV`** da `"TEST"` a `"PROD"` se non stai deliberatamente facendo il passaggio a produzione, seguendo la checklist in `docs/6_1_ambiente_test.md`.

## 2. Trigger

- **Non creare, eliminare o duplicare trigger installabili** (`mioTrigger`, `onEdit`, `invioRecovery`, `coloraPagati`, eventualmente `invioStanze`) dall'editor Apps Script senza sapere esattamente cosa si sta facendo: sono loro a far partire tutta l'automazione.
- **`clasp push` non tocca i trigger**: pubblicare codice nuovo non aggiorna, crea o rimuove i trigger. Se rinomini o elimini una funzione collegata a un trigger esistente (es. `mioTrigger`), il trigger resta comunque configurato ma punterà a una funzione che non esiste più, causando errori silenziosi.
- **Non rinominare le funzioni agganciate a un trigger** (`mioTrigger`, `onEdit`, `invioRecovery`, `coloraPagati`, `invioStanze`) senza aggiornare manualmente anche il trigger corrispondente in Apps Script → Trigger.
- Se in dubbio se `invioStanze` sia effettivamente collegato a un trigger attivo, verificalo prima di fare affidamento sul suo funzionamento automatico (vedi nota in `docs/3_3_mappa_automazioni.md`).

## 3. Colonne delicate del foglio

- **Non rinominare o spostare** le colonne: `Nome`, `Cognome`, `Email`, `Data di nascita`, `Data di arrivo`, `Pasto di arrivo`, `Data di partenza`, `Pasto di partenza`, `Prezzo`, `Parliamo solo di lunedì`, `Partecipi SOLO al pranzo del CUN?`, `Mail di conferma inviata`, `Nuovo invio` nel tab "Iscrizioni CUN Fest". Sono cercate per nome (o alias) dal codice: un nome diverso le rende invisibili allo script.
- **Non modificare a mano la colonna "Prezzo"**: viene sovrascritta automaticamente a ogni esecuzione, qualsiasi correzione manuale andrà persa.
- **Non svuotare la colonna "Email"** di una riga se vuoi che quella persona riceva le comunicazioni: senza email, l'invio per quella riga viene semplicemente saltato, senza avviso visibile.
- **Non scrivere manualmente nei tab "Iscrizioni ordinate" e "Tabella Pasti"**: vengono cancellati e riscritti integralmente a ogni esecuzione, qualunque contenuto manuale sparisce.
- **Non toccare la colonna "Pagato" (tab Pagamento) se non per registrare un pagamento reale**: è l'unico campo preservato manualmente durante gli aggiornamenti automatici; valori "sporchi" restano lì indefinitamente.
- **Nel foglio tariffe, non inserire o spostare righe** senza aggiornare `CONFIG.TARIFFE_RIGHE`: molti valori vengono letti per posizione di riga fissa, non per nome.

## 4. Logiche di invio email

- **Non modificare le funzioni di invio email** (`invioMailIscrizione`, `invioMailAggiornamento`, `sendRecoveryEmails`, `sendEmails`) senza prima testarle sull'ambiente di test: inviano email reali e **irreversibili**, non esiste un "annulla invio".
- **Non rimuovere il controllo anti-doppio-invio** in `invioMailAggiornamento` (basato sulla colonna "Mail di conferma inviata"): serve a evitare di mandare più volte la stessa email di aggiornamento prezzo alla stessa persona.
- **Non lanciare `sendRecoveryEmails` (comunicazione di massa) o `sendEmails` (assegnazione stanze) per prova** su dati reali: raggiungono tutti gli indirizzi email presenti nel foglio in un colpo solo. Testare sempre e solo sull'ambiente di test, con indirizzi di prova.
- **Non modificare i testi fissi delle email** (IBAN, intestatario conto, causale di pagamento) in `CONFIG.EMAIL` senza una verifica esplicita con chi gestisce i pagamenti: un errore qui arriva direttamente agli iscritti.

## 5. Stati delle iscrizioni

- **Non scrivere valori arbitrari** nelle colonne di stato (`Mail di conferma inviata`, `Stato nuovo invio`, `Nuovo invio`): il sistema riconosce solo testi esatti (es. `invia con prezzo`, `Inviata con prezzo`, `Bloccato: già inviata con prezzo`). Un valore leggermente diverso (maiuscole, spazi, refusi) non verrà riconosciuto e l'azione attesa non partirà.
- **Non correggere a mano lo stato di un'iscrizione** per "sistemarla" senza capire cosa succederà al prossimo giro automatico: questi campi guidano il comportamento dello script (es. bloccare o permettere un reinvio email), non sono solo etichette informative.
- **Non usare valori diversi da `Si`/`si` per "Partecipi SOLO al pranzo del CUN?"**: esiste un'incoerenza nota nel codice tra maiuscole/minuscole (vedi `docs/3_2_dizionario_dati.md`) che rende il comportamento imprevedibile se non si rispetta il valore esatto atteso in ciascun punto.

---

## In sintesi: prima di modificare qualcosa di questa lista

1. Chiediti se sai esattamente **quali funzioni** leggono o scrivono quella cosa (consulta `docs/3_2_dizionario_dati.md` e `docs/3_3_mappa_automazioni.md`).
2. Fai la modifica **solo sull'ambiente di test**.
3. Testa con la checklist di `docs/8_3_come_fare_i_test.md` prima di considerare la modifica sicura.
4. Se la modifica è una scelta importante e non reversibile, registrala in `docs/7_3_decision_log.md`.
