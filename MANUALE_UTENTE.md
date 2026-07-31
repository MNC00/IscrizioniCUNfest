# Manuale utente — Iscrizioni CUN Fest

> Questo manuale è scritto per chi gestisce le iscrizioni **senza dover
> conoscere il codice**. Se cerchi la documentazione tecnica/architetturale,
> vedi `ARCHITETTURA.md`.

## Indice

1. [Come è fatto il foglio Google](#1-come-è-fatto-il-foglio-google)
2. [Il ciclo di vita di un'iscrizione](#2-il-ciclo-di-vita-di-uniscrizione)
3. [Il menu "Iscrizioni CUN Fest"](#3-il-menu-iscrizioni-cun-fest)
4. [Il pannello "Dettaglio iscrizione"](#4-il-pannello-dettaglio-iscrizione)
5. [Inviare una comunicazione a tutti gli iscritti](#5-inviare-una-comunicazione-a-tutti-gli-iscritti)
6. [Il foglio "Configurazione" (tariffe e date)](#6-il-foglio-configurazione-tariffe-e-date)
7. [Domande frequenti / risoluzione problemi](#7-domande-frequenti--risoluzione-problemi)
8. [Cosa NON fare mai](#8-cosa-non-fare-mai)
9. [A chi rivolgersi in caso di problemi](#9-a-chi-rivolgersi-in-caso-di-problemi)

---

## 1. Come è fatto il foglio Google

Il file Google Sheets è diviso in "tab" (le schede in basso). Ognuna ha uno
scopo preciso:

| Tab | A cosa serve | Lo modifico a mano? |
|---|---|---|
| **Iscrizioni CUN Fest** | Le risposte grezze al Google Form, una riga per iscritto ("raw"). | Solo per correggere un errore di battitura in un dato personale (nome, email...). Non toccare mai `ID_ISCRIZIONE`. |
| **Iscrizioni (operativo)** | La copia di lavoro delle iscrizioni, a schema fisso: qui vivono `STATO_ISCRIZIONE` e `Prezzo`, e da qui parte ogni azione (ricalcola prezzo, invia mail...). Si aggiorna da sola dal tab "Iscrizioni CUN Fest" ogni pochi minuti. | **Seleziona qui le righe** per le azioni di menu/sidebar. Non toccare mai `ID_ISCRIZIONE` o `STATO_ISCRIZIONE` a mano. |
| **Iscrizioni ordinate** | Copia in ordine alfabetico delle iscrizioni, comoda da consultare/stampare. | **No**, viene rigenerata automaticamente ogni pochi minuti: qualunque modifica manuale verrà persa. |
| **Pagamento** | Elenco iscritti con prezzo e colonna "Pagato". | Solo la colonna **Pagato** (di solito la spunti tramite il menu, vedi sotto). Tutto il resto viene rigenerato automaticamente. |
| **Tabella Pasti** | Quanti pasti/pernottamenti servono ogni giorno, calcolati dalle iscrizioni. | **No**, è generata automaticamente. |
| **Dashboard** | Riepilogo a colpo d'occhio: quante iscrizioni per stato e gli ultimi errori da controllare. | **No**, è generata automaticamente. |
| **Configurazione** | Tariffe, sconti età, date del CUN, e alcune impostazioni tecniche. | Sì, è l'unico posto dove si cambiano i prezzi/le date (vedi [sezione 6](#6-il-foglio-configurazione-tariffe-e-date)). |
| **Eventi** | Il "diario" di tutto quello che il sistema ha fatto (email inviate, errori, calcoli). Utile per capire cosa è successo a una specifica iscrizione. | No, è un log automatico. Puoi solo leggerlo. |
| **Comunicazioni** | Da qui parte una mail a tutti gli iscritti (vedi [sezione 5](#5-inviare-una-comunicazione-a-tutti-gli-iscritti)). | Sì, aggiungendo una riga quando vuoi mandare una comunicazione. |

> 💡 **Perché due tab di iscrizioni?** Il tab "Iscrizioni CUN Fest" è
> collegato direttamente al Google Form: se in futuro si modificano le
> domande del Form, questo tab può cambiare struttura. Il tab "Iscrizioni
> (operativo)" invece ha una struttura fissa scelta dal sistema e non
> cambia mai da sola: è il tab "sicuro" su cui lavorare ogni giorno.

## 2. Il ciclo di vita di un'iscrizione

Ogni iscrizione ha uno **stato** (colonna `STATO_ISCRIZIONE` nel tab
"Iscrizioni (operativo)"), che racconta a che punto è arrivata:

| Stato | Cosa significa in pratica |
|---|---|
| `NUOVA` | È appena arrivata dal Form, il prezzo non è ancora stato calcolato. |
| `PREZZO_CALCOLATO` | Il prezzo è stato calcolato, ma la mail con il prezzo non è (ancora) partita. |
| `MAIL_INVIATA_SENZA_PREZZO` | È partita la mail di conferma iscrizione, ma senza prezzo (le tariffe non erano ancora pronte in Configurazione). |
| `MAIL_INVIATA_CON_PREZZO` | È partita la mail di conferma iscrizione, **con** il prezzo. |
| `REINVIATA` | È stata rimandata una mail di aggiornamento prezzo (una o più volte). |
| `PAGATA` | Il pagamento è stato registrato. |
| `ANNULLATA` | L'iscrizione è stata annullata (dall'iscritto o da un operatore). |

Non serve mai scrivere questi stati a mano: cambiano da soli quando usi le
azioni del menu (sezione 3) o quando arriva una nuova iscrizione dal Form.

## 3. Il menu "Iscrizioni CUN Fest"

In alto nel foglio Google trovi un menu con questo nome, oltre a "File",
"Modifica" ecc. Contiene tutte le azioni disponibili:

### Ricalcola prezzo (riga selezionata in Iscrizioni operativo)
Seleziona una riga nel tab "Iscrizioni (operativo)" (clic su una cella di
quella riga), poi lancia questa voce. Ricalcola il prezzo di **quella sola
iscrizione** usando le tariffe attuali in "Configurazione". Usala quando:
- hai appena compilato/corretto le tariffe in Configurazione;
- il prezzo è vuoto e la Configurazione ora è pronta;
- hai corretto un dato dell'iscritto (es. data di arrivo sbagliata) e vuoi
  ricalcolare il prezzo di conseguenza.

### Invia aggiornamento prezzo (riga selezionata in Iscrizioni operativo)
Invia (o rimanda) la mail con il prezzo aggiornato all'iscritto della riga
selezionata. Ti chiede sempre conferma prima di inviare. **Se era già stata
inviata una mail con prezzo in precedenza**, ti chiederà una **seconda
conferma esplicita** ("sei sicuro di voler rimandare?") prima di procedere:
non blocca il reinvio, ma vuole essere sicuro che non sia un click per
sbaglio.

### ❌ Annulla iscrizione (riga selezionata in Iscrizioni operativo)
Annulla manualmente l'iscrizione selezionata: equivale a quando è il
partecipante stesso ad annullarsi dal link nella mail (vedi
[sezione 10](#10-annullamento-iscrizione-da-parte-del-partecipante)), ma
lanciata da te. Porta lo stato a `ANNULLATA` e invia all'iscritto la mail
di conferma annullamento. Chiede sempre conferma prima di procedere, perché
non è annullabile da menu una volta fatta (per ripristinare un'iscrizione
annullata per errore, contatta chi segue la parte tecnica).

### Registra pagamento (riga selezionata in Pagamento)
Da usare quando sei nel tab **"Pagamento"** (non "Iscrizioni (operativo)"):
seleziona la riga della persona che ha pagato e lancia questa voce. Spunta
la colonna "Pagato" e porta lo stato dell'iscrizione a `PAGATA`.

### Invia comunicazione a tutti gli iscritti…
Vedi [sezione 5](#5-inviare-una-comunicazione-a-tutti-gli-iscritti).

### Rigenera viste ora (Importa dal Form + Ordinato/Pagamento/Pasti/Dashboard)
Forza subito: 1) l'importazione delle nuove risposte del Form nel tab
"Iscrizioni (operativo)"; 2) l'aggiornamento dei tab "Iscrizioni ordinate",
"Pagamento", "Tabella Pasti" e "Dashboard". Normalmente non serve: si
aggiornano da sole ogni pochi minuti. Usala se hai appena fatto una modifica
importante e non vuoi aspettare.

### Esporta log eventi (ultimi 200)
Crea un nuovo tab con una copia degli ultimi 200 eventi registrati (utile
per analisi o per condividerli con chi si occupa della parte tecnica, senza
dover scorrere il tab "Eventi" originale).

### 🔍 Verifica struttura fogli
Controlla che le colonne attese esistano ancora nei tab principali e mostra
un riepilogo. Utile soprattutto se qualcuno ha modificato le domande del
Google Form: segnala subito se manca qualcosa, invece di far comparire un
errore poco chiaro durante un'azione. Viene eseguita automaticamente (in modo
silenzioso) anche ogni volta che apri il foglio.

### Migra dati legacy (una tantum)
**Non usarla** a meno che non te lo chieda esplicitamente chi si occupa
della parte tecnica: serve solo una volta, alla configurazione iniziale del
sistema.

### Apri dettaglio iscrizione…
Vedi [sezione 4](#4-il-pannello-dettaglio-iscrizione).

### ✅ Applica validazioni celle
Aggiunge una tendina con i valori ammessi sulle poche celle "libere" rimaste
(es. colonna "Pagato" nel tab Pagamento, colonna "STATO" nel tab
Comunicazioni), per ridurre il rischio di errori di battitura. Scrivere un
valore diverso mostra solo un avviso, non blocca: va rilanciata solo se
qualcuno segnala che la tendina non compare più o dopo la creazione di un
nuovo tab.

### 🔒 Applica protezioni fogli
Protegge i tab gestiti interamente dallo script (Iscrizioni operativo,
Iscrizioni ordinate, Pagamento, Tabella Pasti, Dashboard, Eventi) contro
modifiche manuali accidentali: chi prova a scrivere a mano in una cella di
questi tab vede un avviso (ma può comunque procedere se sa cosa sta
facendo). Le azioni da menu continuano a funzionare normalmente. Va
rilanciata solo se qualcuno segnala che l'avviso non compare più o dopo la
creazione di un nuovo tab.

### ℹ️ Info versione
Mostra numero di versione e data dell'ultimo aggiornamento del codice
installato. Utile per verificare, insieme a chi si occupa della parte
tecnica, che il foglio stia effettivamente eseguendo l'ultima versione
pubblicata (il codice va sempre aggiornato solo tramite git, mai
modificando l'editor Apps Script a mano).

### 🔗 Mostra link pagina annullamento (Fase D)
Mostra l'indirizzo pubblico della pagina che i partecipanti usano per
annullare da soli la propria iscrizione (vedi §10). Se compare un messaggio
che dice che la Web App non è ancora distribuita, serve un'attivazione una
tantum lato tecnico (vedi §10) prima che il link compaia nelle mail.

### ❓ Guida rapida
Apre una finestra con un riepilogo veloce degli stati e delle azioni più
comuni: utile per un ripasso senza dover riaprire questo manuale.

## 4. Il pannello "Dettaglio iscrizione"

Seleziona una riga nel tab "Iscrizioni (operativo)" e lancia **Menu ▸ Apri
dettaglio iscrizione…**: si apre un pannello laterale con:
- i dati principali dell'iscritto e il suo stato attuale;
- gli ultimi eventi registrati per quell'iscrizione (mail inviate, calcoli,
  eventuali errori con la spiegazione).

È il modo più rapido per capire "cosa è successo" a una singola persona
senza dover cercare a mano nel tab "Eventi".

## 5. Inviare una comunicazione a tutti gli iscritti

1. Vai sul tab **"Comunicazioni"**.
2. Aggiungi una nuova riga sotto l'ultima:
   - `ID_COMM`: puoi lasciarlo vuoto, o scrivere un nome a piacere (es. `2026-08-01`).
   - `OGGETTO`: l'oggetto della mail.
   - `TESTO`: il testo del messaggio. Puoi scrivere **più paragrafi**:
     - premi **Alt+Invio** (o **⌥+Invio** su Mac) per andare a capo dentro
       lo stesso paragrafo;
     - lascia una **riga vuota** (due Alt+Invio di fila) per iniziare un
       nuovo paragrafo, con lo spazio visivo che ti aspetti in una mail.
   - Lascia vuote `STATO`, `DATA_INVIO`, `ID_OPERATORE`: li compila il sistema.
3. Vai su **Menu ▸ Invia comunicazione a tutti gli iscritti…** e conferma.
4. La mail parte a **tutti gli indirizzi email unici** presenti nel tab
   "Iscrizioni (operativo)" (chi ha più righe/iscrizioni con la stessa email la
   riceve una sola volta).
5. Dopo l'invio, la riga in "Comunicazioni" passa a `STATO = INVIATA` con
   data e chi l'ha inviata.

> ⚠️ Non c'è un modo per "annullare" una mail già partita: prima di
> confermare, rileggi con calma oggetto e testo.

## 6. Il foglio "Configurazione" (tariffe e date)

Formato a tabella: `CHIAVE | VALORE | DESCRIZIONE`. Ogni riga è un singolo
parametro. Per cambiare un valore (es. una tariffa, o le date di inizio/fine
del CUN), **modifica solo la colonna VALORE** della riga interessata: la
colonna `CHIAVE` non va mai toccata (il sistema la usa per riconoscere il
parametro).

Parametro speciale da conoscere: **`MODALITA_TEST_NO_INVIO_EMAIL`**
- `TRUE` → le email vengono solo simulate (registrate nel log "Eventi") ma
  **non spedite davvero**. Utile per fare delle prove senza disturbare
  nessuno.
- `FALSE` (o vuoto) → le email partono per davvero.

> Dopo aver cambiato una tariffa, i prezzi **già calcolati** non cambiano da
> soli: usa "Ricalcola prezzo" sulle righe interessate se vuoi applicare il
> nuovo valore a iscrizioni già esistenti.

## 7. Domande frequenti / risoluzione problemi

**Il prezzo è vuoto per un'iscrizione.**
Controlla che tutte le tariffe necessarie siano compilate in
"Configurazione", poi seleziona la riga e lancia "Ricalcola prezzo". Se
resta vuoto, apri il "Dettaglio iscrizione" (sezione 4) per vedere se
l'ultimo evento segnala un errore specifico (es. un dato mancante
sull'iscritto, come la data di nascita).

**Ho mandato un aggiornamento prezzo per errore, posso rimandarne un altro
con il prezzo giusto?**
Sì: ricalcola il prezzo corretto, poi lancia di nuovo "Invia aggiornamento
prezzo prezzo" sulla stessa riga. Ti verrà chiesta una conferma in più
perché il sistema sa che ne era già partita una, ma il reinvio è permesso.

**Il tab "Pagamento"/"Tabella Pasti" mostra dati vecchi.**
Lancia "Rigenera viste ora" dal menu: si aggiornano subito senza aspettare
il ciclo automatico.

**Un'iscrizione non ha `ID_ISCRIZIONE`.**
Non dovrebbe succedere per le iscrizioni nuove (l'ID viene assegnato in
automatico all'arrivo dal Form). Se capita, avvisa chi segue la parte
tecnica prima di usare azioni del menu su quella riga.

**Ho selezionato la riga sbagliata prima di lanciare un'azione.**
Le azioni sul menu leggono sempre la riga in cui hai il cursore/la cella
selezionata in quel momento: prima di confermare un'azione, controlla in
alto a sinistra (o nel titolo del popup di conferma, dove presente) che sia
la persona giusta.

## 8. Cosa NON fare mai

- **Non aprire/modificare il codice** da "Estensioni ▸ Apps Script": ogni
  modifica al comportamento del sistema deve passare dal repository di
  codice (Git), non dall'editor dentro Google Sheets. Se hai accesso in sola
  lettura a quell'editor è normale: è voluto, non un errore di permessi.
- **Non modificare a mano** i tab "Iscrizioni ordinate", "Tabella Pasti",
  o le colonne calcolate del tab "Pagamento": vengono riscritte
  automaticamente e la modifica andrebbe persa (o, peggio, disallineata).
- **Non scrivere direttamente** `ID_ISCRIZIONE` o `STATO_ISCRIZIONE` a
  mano: usa sempre le azioni del menu.
- **Non eliminare o rinominare colonne del Form/foglio "Iscrizioni CUN
  Fest"** senza avvisare chi segue la parte tecnica: potrebbe interrompere
  il calcolo dei prezzi o l'invio delle mail.
- **Non eseguire "Migra dati legacy"** se non richiesto esplicitamente: è
  pensata per essere lanciata una volta sola, alla configurazione iniziale.

## 9. A chi rivolgersi in caso di problemi

Se qualcosa non torna e questo manuale non basta a risolverlo:
1. Apri il "Dettaglio iscrizione" (sezione 4) sulla riga in questione, o il
   tab "Eventi", e annota cosa vedi (in particolare la colonna `ERRORI`).
2. Contatta chi segue la parte tecnica del sistema, indicando l'`ID_ISCRIZIONE`
   coinvolto e cosa hai provato a fare.

## 10. Annullamento iscrizione da parte del partecipante

Ogni mail di conferma/aggiornamento prezzo contiene, in fondo, un link
personale "Annulla la mia iscrizione". Se un partecipante lo usa:
1. Vede una pagina con un breve riepilogo (nome, email) e un pulsante rosso
   "Conferma annullamento" — cliccare il link da solo **non annulla nulla**,
   serve il click di conferma.
2. Dopo la conferma, l'iscrizione passa allo stato `ANNULLATA` (visibile nel
   tab "Iscrizioni (operativo)") e al partecipante arriva una mail di
   conferma dell'annullamento.
3. Il link è **utilizzabile una sola volta**: se viene riaperto dopo,
   mostra "link non più valido".
4. Se l'iscrizione risulta già **pagata**, il link non annulla nulla in
   automatico: invita il partecipante a scrivere via email, così da poter
   gestire manualmente un eventuale rimborso.

**Attivazione (passo tecnico una tantum):** questa funzione richiede che il
progetto sia distribuito come "Web App" da Apps Script (Estensioni → Apps
Script → Deploy → Nuovo deployment → tipo "App web", accesso "Chiunque").
Finché non è distribuita, le mail vengono inviate normalmente ma **senza**
il link di annullamento (nessun errore, nessun link rotto). Usa il menu
"🔗 Mostra link pagina annullamento" per verificare se è attiva. Per il
primo deploy, o se qualcosa non torna, rivolgersi a chi segue la parte
tecnica.
