# 7.1 – Flusso Operativo di Modifica

## Premessa

Il progetto è organizzato su tre livelli, ognuno con uno scopo preciso:

1. **VS Code (locale)** – dove si scrive e si modifica il codice (`src/*.gs`).
2. **GitHub** – dove il codice viene versionato e conservato come storico.
3. **Apps Script** (progetto bound allo Sheet di test, vedi `docs/6_1_ambiente_test.md`) – dove il codice viene effettivamente eseguito.

Questi tre livelli **non si aggiornano da soli**: il codice passa da uno all'altro solo quando lo decidiamo noi, con un comando esplicito (`git commit`, `git push`, `clasp push`). Non c'è sincronizzazione automatica.

## Flusso standard, passo per passo

### 1. Lavoro in locale su VS Code
- Apri il progetto in VS Code.
- Modifica i file `.gs` necessari dentro `src/`.
- Salva i file.
- (Facoltativo ma consigliato) Esegui una lettura veloce del file modificato per controllare errori di sintassi evidenti (parentesi, virgolette, punti e virgola).

### 2. Salvataggio/versionamento su GitHub
- Controlla cosa è cambiato:
  ```
  git status
  git diff
  ```
- Aggiungi le modifiche e crea un commit con un messaggio chiaro (vedi `docs/7_2_convenzioni_lavoro.md`):
  ```
  git add src/pricing.gs
  git commit -m "fix: corretto confronto case-sensitive su 'Solo pranzo CUN'"
  ```
- Invia il commit su GitHub:
  ```
  git push
  ```
- A questo punto la modifica è **salvata e versionata**, ma **non ancora attiva** su Apps Script.

### 3. Pubblicazione verso Apps Script tramite `clasp push`
- Verifica di essere nella cartella del progetto collegata (`.clasp.json` presente).
- Esegui il push verso il progetto Apps Script di test:
  ```
  clasp push
  ```
- Apri l'editor Apps Script (`clasp open`, opzionale) e verifica che i file aggiornati siano visibili.
- Esegui un test mirato sull'ambiente di test (vedi `docs/6_2_checklist_test.md`) per confermare che la modifica funzioni come previsto.

## Distinzione dei tre passaggi (in breve)

| Passaggio | Comando | Effetto |
|---|---|---|
| Locale → salvato su disco | Salvataggio file in VS Code | Nessun effetto su GitHub o Apps Script |
| Locale → GitHub | `git add` + `git commit` + `git push` | Storico versionato, nessun effetto sull'esecuzione reale |
| Locale/GitHub → Apps Script | `clasp push` | Il codice diventa attivo ed eseguibile sullo Sheet di test |

**Nota importante**: `clasp push` pubblica lo stato attuale dei file in locale, indipendentemente dal fatto che siano stati committati su GitHub. È buona norma però fare sempre prima il commit/push su GitHub, così da avere sempre una versione tracciata corrispondente a ciò che gira su Apps Script.

## Checklist finale "prima di pubblicare" (`clasp push`)

- [ ] Il file modificato è stato salvato in VS Code.
- [ ] `git status` non mostra modifiche impreviste in altri file.
- [ ] Il commit è stato creato con un messaggio chiaro e descrittivo.
- [ ] Il commit è stato inviato su GitHub (`git push`).
- [ ] Ho riletto la modifica una volta per controllare refusi/errori di sintassi.
- [ ] Sono consapevole che sto pubblicando sull'ambiente di **test** (non produzione).
- [ ] Dopo il push, eseguirò almeno un test mirato sulla funzionalità modificata.
