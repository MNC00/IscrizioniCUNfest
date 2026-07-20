# 7.4 – Procedura Rapida (promemoria quotidiano)

Devo fare una modifica al codice. Passaggi essenziali, dall'inizio alla fine:

1. **Apri il progetto in VS Code** e modifica il/i file in `src/*.gs`.
2. **Salva** i file modificati.
3. **Controlla cosa è cambiato**:
   ```
   git status
   git diff
   ```
4. **Committa** con un messaggio chiaro (`fix:`, `feat:`, `docs:`, `refactor:`, `chore:`):
   ```
   git add <file>
   git commit -m "fix: descrizione breve della modifica"
   ```
5. **Invia su GitHub**:
   ```
   git push
   ```
6. **Pubblica su Apps Script** (ambiente di test):
   ```
   clasp push
   ```
7. **Testa la modifica** sull'ambiente di test (Form/Sheet di test), verificando almeno la funzionalità toccata. Per test più ampi, usa `docs/6_2_checklist_test.md`.
8. **Se qualcosa non va**: correggi in locale e ripeti dal punto 2. Non modificare mai direttamente dall'editor online di Apps Script.
9. **Se la modifica riguarda una scelta importante** (non solo un fix tecnico): aggiungi una voce in `docs/7_3_decision_log.md`.

## Promemoria veloce

- ⚠️ Sto sempre lavorando sull'ambiente di **test**, non su quello reale.
- ⚠️ `clasp push` pubblica lo stato attuale dei file locali: fai sempre prima il commit/push su GitHub.
- ⚠️ Non modificare mai il codice dall'editor online di Apps Script.
