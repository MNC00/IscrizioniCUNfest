# 8.3 – Come Fare i Test

Guida pratica per testare una modifica al sistema prima (e dopo) averla pubblicata. Per la checklist completa e dettagliata vedi anche `docs/6_2_checklist_test.md`; questo documento è la versione guidata, pensata per essere seguita passo-passo.

## Regola fondamentale

**Tutti i test si fanno sull'ambiente di test**, mai su quello usato realmente dagli iscritti (vedi `docs/6_1_ambiente_test.md`). Se non sei sicuro/a se stai usando il Form/Sheet di test o quello reale, **fermati e verifica prima di procedere**.

## 1. Test di iscrizione normale

Obiettivo: verificare che una iscrizione "pulita" attraversi tutto il flusso senza problemi.

- Compila il Google Form di test con dati completi e plausibili (nome, cognome, email, date di arrivo/partenza, pasti).
- Controlla che sia comparsa una nuova riga nel foglio "Iscrizioni CUN Fest".
- Controlla che la colonna "Prezzo" sia stata calcolata (non vuota, valore plausibile).
- Controlla che il foglio "Iscrizioni ordinate" contenga la nuova riga, in ordine alfabetico.
- Controlla che il foglio "Pagamento" contenga la nuova riga con i dati corretti.
- Controlla che la "Tabella Pasti" rifletta la nuova presenza.

## 2. Test con dati strani o incompleti

Obiettivo: verificare che il sistema non si blocchi in modo silenzioso con dati imperfetti.

- Invia una risposta con un campo importante vuoto (es. data di arrivo mancante) e controlla il tab "Log" per capire cosa è successo.
- Invia una risposta con un valore anomalo in un campo che si aspetta una data (es. testo libero) e verifica che non ci sia un crash bloccante.
- Prova varianti diverse su "Solo pranzo CUN" (`Si`, `si`, vuoto): è un'area nota per un'incoerenza di comportamento, utile verificarne l'effetto (vedi `docs/3_2_dizionario_dati.md`).
- Prova un nome/cognome con accenti o spazi extra e verifica che venga gestito correttamente nei fogli derivati.

## 3. Test email

Obiettivo: verificare che le email partano correttamente e con il contenuto giusto.

- Dopo una nuova iscrizione, verifica che sia arrivata l'email di conferma all'indirizzo di test usato nel Form.
- Scrivi `"invia con prezzo"` nella colonna "Nuovo invio" di una riga e verifica che arrivi l'email di aggiornamento prezzo; ripeti il comando e verifica che il secondo tentativo venga bloccato ("Bloccato: già inviata con prezzo").
- Se stai testando comunicazioni di massa, imposta `"si"` in "Invia mail a tutti?" nel tab Comunicazione e verifica che tutti gli indirizzi di test ricevano la mail con oggetto/testo corretti.
- Se in uso, testa l'invio email di assegnazione stanza e verifica l'esito in cella `J4` del tab "Stanze".
- Controlla che il testo delle email non contenga placeholder non sostituiti o dati palesemente sbagliati.

## 4. Test foglio

Obiettivo: verificare che i fogli derivati si aggiornino correttamente senza perdere dati.

- Verifica che "Iscrizioni ordinate" venga rigenerato senza perdere righe.
- Verifica che il tab "Pagamento" mantenga lo stato "Pagato" già inserito manualmente su righe esistenti, anche dopo una nuova rigenerazione.
- Scrivi `"x"` nella colonna "Pagato" e verifica che la riga si colori di azzurro; rimuovi il valore e verifica che torni bianca.
- Verifica che la "Tabella Pasti" riporti conteggi coerenti dopo l'aggiunta di una nuova iscrizione.

## 5. Test log

Obiettivo: verificare che il sistema registri correttamente cosa succede.

- Verifica che il tab "Log" esista (o si crei da solo alla prima esecuzione).
- Verifica che ogni trigger eseguito produca almeno una riga di log.
- Forza un errore (es. con dati non validi) e verifica che venga scritta una riga con livello `ERROR` e un dettaglio leggibile.

## Checklist finale

Compila dopo ogni sessione di test:

```
Data test: __________   Eseguito da: __________   Modifica testata: __________

[ ] Test di iscrizione normale         → Superato / Da correggere
[ ] Test dati strani/incompleti        → Superato / Da correggere
[ ] Test email                         → Superato / Da correggere
[ ] Test foglio                        → Superato / Da correggere
[ ] Test log                           → Superato / Da correggere

Esito complessivo:  [ ] Test superato   [ ] Test da correggere

Note/anomalie riscontrate:
_______________________________________________________________
_______________________________________________________________
```

Se anche un solo punto risulta "da correggere", **non considerare la modifica pronta**: correggi il codice, ripubblica (`docs/8_2_come_pubblicare_una_modifica.md`) e ripeti i test necessari prima di andare avanti.
