# 6.2 – Checklist di Test Manuale

Checklist da compilare manualmente **dopo ogni modifica al codice** (`clasp push`) o alla struttura dei fogli, sull'ambiente di test descritto in `docs/6_1_ambiente_test.md`. Spuntare ogni voce solo dopo averla verificata concretamente (non a memoria).

Data test: __________  Eseguito da: __________  Commit/versione testata: __________

---

## 1. Test di iscrizione normale

- [ ] Compilato il Google Form di test con dati completi e plausibili (nome, cognome, email, date, pasti).
- [ ] Dopo l'invio è comparsa una nuova riga nel foglio "Iscrizioni CUN Fest".
- [ ] La colonna "Prezzo" è stata calcolata correttamente (valore atteso coerente con le tariffe di test).
- [ ] Il foglio "Iscrizioni ordinate" è stato rigenerato e contiene la nuova riga in ordine alfabetico Cognome/Nome.
- [ ] Il foglio "Pagamento" contiene la nuova riga con i campi attesi (`CONFIG.CAMPI_PAGAMENTO`).
- [ ] Il foglio "Tabella Pasti" è stato rigenerato e riflette la nuova presenza.

## 2. Test con dati mancanti o "strani"

- [ ] Inviata una risposta Form con un campo obbligatorio vuoto (es. data di arrivo mancante) e verificato che lo script non si blocchi in modo silenzioso (controllare il tab "Log").
- [ ] Inviata una risposta con testo anomalo in un campo atteso come data/numero (es. testo libero al posto di una data) e verificato il comportamento (nessun crash bloccante, errore loggato).
- [ ] Inviata una risposta con "Solo pranzo CUN" valorizzato con varianti diverse (`Si`, `si`, vuoto) e verificato che il calcolo prezzo si comporti come atteso (nota: incoerenza nota tra confronto case-sensitive e normalizzato, vedi `docs/3_2_dizionario_dati.md`).
- [ ] Verificato che una email/nome con caratteri accentati o spazi extra venga gestita correttamente (funzioni `norm()`/matching per Nome+Cognome).

## 3. Test invio email

- [ ] Alla nuova iscrizione è arrivata l'email di conferma (`invioMailIscrizione`) all'indirizzo di test inserito nel Form.
- [ ] Impostando `Nuovo invio = "invia con prezzo"` su una riga, è arrivata l'email di aggiornamento prezzo (`invioMailAggiornamento`) e la colonna si è aggiornata di conseguenza (es. "Bloccato: già inviata con prezzo" al secondo tentativo).
- [ ] Testato l'invio massivo dal tab "Comunicazione" (`Invia mail a tutti? = "si"`) e verificato che tutti gli indirizzi unici di test abbiano ricevuto la mail, con oggetto/testo corretti.
- [ ] Se in uso, testato l'invio email di assegnazione stanza (`invioStanze` → `sendEmails`) e verificato che l'esito sia stato scritto in cella `J4` del tab "Stanze".
- [ ] Verificato che il testo delle email (firma, IBAN, causale pagamento, link sito) sia quello corretto e senza placeholder non sostituiti.

## 4. Test aggiornamento foglio

- [ ] Il tab "Iscrizioni ordinate" viene interamente rigenerato senza perdere righe rispetto al foglio principale.
- [ ] Il tab "Pagamento" preserva correttamente lo stato "Pagato" già inserito manualmente su righe esistenti dopo una nuova rigenerazione.
- [ ] La colorazione automatica della riga (`coloraPagati`) scatta correttamente quando si scrive `"x"` nella colonna "Pagato" e si resetta scrivendo un valore diverso.
- [ ] Il tab "Tabella Pasti" riporta conteggi coerenti (colazioni/pranzi/cene/pernottamenti) dopo l'aggiunta o modifica di un'iscrizione.

## 5. Test scrittura log

- [ ] Il tab "Log" esiste (o viene creato automaticamente alla prima esecuzione) con intestazione corretta e formattata.
- [ ] Ogni esecuzione di trigger (form submit, onEdit) produce almeno una riga di log con livello coerente (INFO per esiti normali, ERROR per eccezioni forzate/di test).
- [ ] Forzando un errore (es. dato non valido) viene scritta una riga con livello `ERROR` e dettaglio errore leggibile (non vuoto, non `[object Object]`).
- [ ] Il log non blocca l'esecuzione delle funzioni principali anche se il tab "Log" viene temporaneamente rinominato o reso non raggiungibile.

## 6. Verifica trigger attivi corretti

- [ ] In Apps Script → Trigger, sono presenti e attivi: `mioTrigger` (ON_FORM_SUBMIT), `onEdit` (ON_EDIT foglio principale), `invioRecovery` (ON_EDIT), `coloraPagati` (ON_EDIT foglio Pagamento).
- [ ] Verificato se `invioStanze` è effettivamente installato come trigger attivo oppure no (elemento segnalato come incerto in `docs/3_3_mappa_automazioni.md`).
- [ ] Nessun trigger duplicato (stessa funzione registrata più volte) che causerebbe esecuzioni multiple indesiderate.
- [ ] Nessun trigger orfano che punta a funzioni rinominate o rimosse dal codice sorgente.

---

## Esito complessivo

- [ ] Tutti i punti sopra sono stati verificati positivamente.
- [ ] Sono state riscontrate anomalie (descriverle qui sotto).

Note/anomalie riscontrate:
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```
