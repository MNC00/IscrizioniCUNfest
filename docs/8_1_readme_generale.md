# 8.1 – README Generale del Progetto

## Cos'è questo progetto

Questo progetto automatizza la gestione delle iscrizioni al **CUN Fest**, un evento/festival che raccoglie iscrizioni tramite un modulo online. Invece di gestire tutto a mano (calcolare prezzi, mandare email di conferma, tenere aggiornati elenchi e conteggi pasti), un programma scritto in Google Apps Script fa questo lavoro automaticamente ogni volta che qualcuno si iscrive o quando un operatore compie certe azioni sul foglio di calcolo.

## A cosa serve, in pratica

Quando una persona compila il modulo di iscrizione:
1. I suoi dati finiscono in un Google Sheet (un foglio di calcolo online).
2. Il sistema calcola automaticamente **quanto deve pagare** in base a notti, pasti e sconti.
3. Il sistema le manda una **email di conferma** con il riepilogo e il prezzo.
4. Il sistema aggiorna automaticamente elenchi utili all'organizzazione: iscrizioni ordinate per cognome, riepilogo pagamenti, conteggio pasti giorno per giorno.

Oltre a questo, gli operatori possono usare il foglio per: forzare il reinvio di un'email con il prezzo aggiornato, mandare comunicazioni a tutti gli iscritti, segnare chi ha pagato, e (quando previsto) comunicare l'assegnazione delle stanze.

## Componenti principali

| Componente | Cosa fa |
|---|---|
| **Google Form** | Il modulo che le persone compilano per iscriversi. Ogni risposta genera una nuova riga nel Google Sheet. |
| **Google Sheet** | Il foglio di calcolo che contiene tutti i dati: iscrizioni, tariffe, pagamenti, tabella pasti, log, ecc. È il "database" del progetto. |
| **Apps Script** | Il programma (scritto in JavaScript, linguaggio di Google Apps Script) collegato al Google Sheet. Si attiva da solo quando arriva una nuova iscrizione o quando un operatore modifica certe celle. |
| **Repository GitHub** | Dove il codice del programma viene scritto, conservato e versionato, prima di essere pubblicato su Apps Script. |

## Dove si trova il codice

Tutto il codice sorgente è nella cartella `src/` di questo repository:

- `main.gs` – punto di ingresso/orchestrazione principale
- `config.gs` – tutta la configurazione centralizzata (nomi fogli, celle, stati, testi email)
- `pricing.gs` – calcolo dei prezzi
- `email.gs` – costruzione e invio delle email
- `sheets.gs` – gestione dei fogli derivati (ordinato, pagamento, tabella pasti)
- `logger.gs` – scrittura del tab di log
- `utils.gs` – funzioni di supporto (normalizzazione testo, date, ecc.)
- `appsscript.json` – file di configurazione del progetto Apps Script

Il codice **non va mai modificato direttamente** nell'editor online di Apps Script: si modifica qui, in locale, e poi si pubblica (vedi `docs/8_2_come_pubblicare_una_modifica.md`).

## Dove si trovano i dati e i file Google reali

- Il **Google Sheet** e il **Google Form** reali (sia quelli di test sia, in futuro, quelli di produzione) **non fanno parte di questo repository**: sono file Google separati, accessibili da chi ha i permessi su Google Drive/Workspace del team.
- Il progetto Apps Script in `src/` è "collegato" (bound) a uno di questi Google Sheet tramite `clasp` (vedi `.clasp.json`). Il repository contiene solo il codice, non i dati delle iscrizioni.
- Attualmente il progetto è collegato a una **copia di test**, separata dai dati reali degli iscritti: vedi `docs/6_1_ambiente_test.md` per i dettagli.
- Il file `docs/Iscrizioni CUN Fest 2026.xlsx` è un export/riferimento della struttura del foglio, usato per la documentazione, non il foglio live.

## Come orientarsi nel repository

```
IscrizioniCunFest/
├── README.md                 → introduzione rapida al progetto
├── src/                       → tutto il codice Apps Script (.gs)
├── docs/                      → documentazione del progetto, numerata per fase:
│   ├── 3_*  → come funziona oggi il sistema (analisi)
│   ├── 6_*  → ambiente di test e checklist di test
│   ├── 7_*  → flusso di lavoro e convenzioni per gli sviluppatori
│   └── 8_*  → documentazione di onboarding (questo gruppo di file)
└── .clasp.json                → collegamento tra questa cartella e il progetto Apps Script
```

Se sei nuovo/a sul progetto, l'ordine di lettura consigliato è:
1. Questo file (`8_1_readme_generale.md`) per il quadro d'insieme.
2. `docs/8_4_come_leggere_foglio_e_tab.md` per capire il Google Sheet.
3. `docs/8_2_come_pubblicare_una_modifica.md` e `docs/8_3_come_fare_i_test.md` prima di toccare il codice.
4. `docs/8_5_cose_da_non_toccare.md` prima di modificare qualsiasi cosa di delicato.
5. `docs/3_1_mappa_funzionale.md`, `3_2_dizionario_dati.md`, `3_3_mappa_automazioni.md` per un'analisi tecnica approfondita.
