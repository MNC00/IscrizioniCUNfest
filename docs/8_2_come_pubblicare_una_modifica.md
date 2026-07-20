# 8.2 – Come Pubblicare una Modifica

Manuale operativo passo-passo per portare una modifica dal codice locale fino al progetto Apps Script attivo (ambiente di test).

## Concetto chiave: tre luoghi diversi, tre comandi diversi

| Luogo | Cosa contiene | Come si aggiorna |
|---|---|---|
| **Il tuo computer (VS Code)** | I file `.gs` che stai modificando | Salvataggio del file |
| **GitHub** | Storico versionato del codice | `git push` |
| **Apps Script** | Il codice realmente in esecuzione sullo Sheet di test | `clasp push` |

**`git push` e `clasp push` fanno due cose completamente diverse:**
- `git push` invia i tuoi commit al repository GitHub. Serve per **conservare la storia** delle modifiche e condividerle. **Non ha nessun effetto sul funzionamento reale del sistema.**
- `clasp push` invia i file locali (così come sono in quel momento su disco, committati o no) al progetto Apps Script. È l'unico comando che rende la modifica **realmente attiva** sull'ambiente di test.

Se fai solo `git push` senza `clasp push`, il codice è salvato su GitHub ma il sistema continua a funzionare con la versione precedente. Se fai solo `clasp push` senza `git push`, il sistema è aggiornato ma nessuno storico ha traccia della modifica: **fai sempre entrambi, in quest'ordine**.

## Procedura passo-passo

### 1. Modifica il codice in locale
Apri il progetto in VS Code e modifica i file necessari dentro `src/`. Salva.

### 2. Controlla cosa hai cambiato
```
git status
git diff
```
Verifica che siano stati toccati solo i file previsti.

### 3. Crea il commit
```
git add src/pricing.gs
git commit -m "fix: descrizione breve e chiara della modifica"
```

### 4. Invia su GitHub
```
git push
```
A questo punto la modifica è versionata, ma **non ancora attiva**.

### 5. Pubblica su Apps Script
```
clasp push
```
Da questo momento il codice è attivo sull'ambiente di test (lo Sheet/Form di test collegato al progetto).

### 6. Verifica la pubblicazione
- Apri l'editor Apps Script (facoltativo: `clasp open`) e controlla che i file mostrino le modifiche attese.
- Esegui un test mirato sulla funzionalità cambiata (vedi `docs/8_3_come_fare_i_test.md`).

## Checklist finale prima di pubblicare (`clasp push`)

- [ ] Ho salvato tutti i file modificati in VS Code.
- [ ] `git status` non mostra modifiche impreviste in altri file.
- [ ] Ho creato un commit con messaggio chiaro.
- [ ] Ho eseguito `git push` verso GitHub.
- [ ] Ho riletto la modifica una volta per controllare refusi o errori evidenti.
- [ ] So che sto pubblicando sull'ambiente di **test**, non su quello reale.
- [ ] Dopo `clasp push`, eseguirò almeno un test mirato sulla funzionalità toccata.

## Errori comuni da evitare

- ❌ Modificare il codice direttamente nell'editor online di Apps Script: la modifica non torna mai in automatico su GitHub e si perde alla prossima `clasp push` da locale.
- ❌ Fare `clasp push` senza aver prima controllato `git diff`: rischio di pubblicare modifiche non volute rimaste in sospeso nei file.
- ❌ Dimenticarsi `git push`: la modifica gira in produzione/test ma nessuno storico ne tiene traccia.
- ❌ Non testare dopo il push: una modifica pubblicata ma non verificata può restare silenziosamente rotta.
