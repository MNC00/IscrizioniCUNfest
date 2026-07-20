# 7.2 – Convenzioni di Lavoro

## Premessa

Questo è un progetto piccolo, gestito da una persona o da un piccolo gruppo. Le convenzioni proposte qui **non sono regole da team enterprise**: servono solo a rendere lo storico Git leggibile e a non perdere traccia di bug e idee. Se una regola risulta più un ostacolo che un aiuto, va semplificata.

## Messaggi di commit

Usa un prefisso breve che indica il tipo di modifica, seguito da una descrizione sintetica in italiano:

- `fix:` correzione di un bug (es. `fix: corretto calcolo prezzo per Solo pranzo CUN`)
- `feat:` nuova funzionalità (es. `feat: aggiunta colonna Stato nuovo invio`)
- `docs:` modifiche alla documentazione (es. `docs: aggiornata checklist ambiente test`)
- `refactor:` riorganizzazione del codice senza cambiare il comportamento (es. `refactor: spostate costanti in config.gs`)
- `chore:` piccole manutenzioni (es. `chore: rimossi log di debug`)

Regole pratiche:
- Una riga, massimo ~70 caratteri, tempo presente/imperativo ("corregge", "aggiunge" o infinito "correggere", "aggiungere" – basta essere coerenti).
- Se serve più contesto, aggiungi un corpo del commit separato da una riga vuota.
- Evita commit generici tipo `"aggiornamenti"` o `"fix"` senza altro: non aiutano a ritrovare nulla in futuro.

## Branch

**In questa fase i branch non sono strettamente necessari.** Il progetto è piccolo, ha un solo ambiente di test attivo, e le modifiche vengono verificate manualmente con la checklist di test prima di considerarle definitive. Introdurre una strategia di branching complessa (`develop`, `feature/*`, `release/*`, ecc.) aggiungerebbe overhead senza benefici reali.

### Strategia minimale proposta
- Lavora direttamente su `main` per le modifiche ordinarie (piccoli fix, aggiustamenti, documentazione).
- Usa un branch temporaneo **solo** per modifiche rischiose o sperimentali che potrebbero rompere qualcosa (es. una riscrittura del calcolo prezzi):
  ```
  git checkout -b prova/nuovo-calcolo-prezzi
  ```
  Nome branch: `prova/<breve-descrizione>` oppure `esperimento/<breve-descrizione>`.
- Una volta testato con la checklist (`docs/6_2_checklist_test.md`) e confermato che funziona, uniscilo a `main`:
  ```
  git checkout main
  git merge prova/nuovo-calcolo-prezzi
  git branch -d prova/nuovo-calcolo-prezzi
  ```
- Se l'esperimento non funziona, si può semplicemente abbandonare il branch senza fare merge.

Questa è l'unica eccezione al lavoro diretto su `main`: da usare con parsimonia, non come regola sistematica.

## Gestione di bug, idee future e note operative

Non serve uno strumento di project management dedicato. Usa GitHub Issues del repository come unico contenitore:

- **Bug**: apri una issue con titolo `[bug] descrizione breve`, descrivi cosa succede, cosa ti aspetteresti, e se possibile i passi per riprodurlo. Riferisci il numero della issue nel commit che lo risolve (es. `fix: corretto calcolo pasti (#12)`).
- **Idee future / miglioramenti**: issue con titolo `[idea] descrizione breve`. Non serve pianificarle subito: servono a non dimenticarle.
- **Note operative** (es. promemoria su una particolarità del sistema, un'incoerenza nota): se riguardano il funzionamento del sistema, meglio annotarle direttamente nella documentazione pertinente in `docs/` (es. `docs/3_2_dizionario_dati.md`) piuttosto che in una issue, così restano collegate al contesto giusto.
- Per decisioni importanti (scelte architetturali o organizzative), usa `docs/7_3_decision_log.md` invece delle issue.

## In sintesi

- Commit piccoli, frequenti, con messaggio chiaro e prefissato.
- Lavoro diretto su `main`, branch solo per esperimenti rischiosi.
- Bug e idee → GitHub Issues; incoerenze note del sistema → documentazione; decisioni importanti → decision log.
