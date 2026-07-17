**Roadmap per ristrutturare il sistema iscrizioni del festival**

**Introduzione**

L’obiettivo di questa roadmap è trasformare il sistema attuale in uno strumento più ordinato, stabile e facile da modificare, senza buttare via tutto in un colpo solo.

**Descrizione della soluzione**

La soluzione proposta non consiste nel cambiare subito piattaforma, ma nel riorganizzare bene quello che esiste già.

In pratica:

* Il **Modulo Google** continua a essere il punto in cui le persone si iscrivono.

* Il **Foglio Google** continua a essere il posto dove i dati arrivano e vengono controllati.

* Il **codice Apps Script** diventa il “motore” delle automazioni, ma viene gestito in modo più serio dentro una cartella locale su computer, usando VS Code e una repository Git.

Questo permette di ottenere alcuni vantaggi molto concreti:

* avere una cronologia delle modifiche al codice;

* capire chi ha cambiato cosa;

* tornare indietro se una modifica rompe qualcosa;

* lavorare con più ordine;

* costruire documentazione utile anche per chi arriverà dopo.

Google mette a disposizione clasp, uno strumento ufficiale che serve proprio a sviluppare e gestire progetti Apps Script dal computer locale invece che solo dall’editor online.

**Output desiderato**

Alla fine del percorso il progetto dovrebbe avere questi risultati concreti:

* un sistema iscrizioni che continui a usare Google Form e Google Sheet;

* un progetto Apps Script salvato e gestito in una repository;

* una struttura del codice più ordinata, con parti separate per funzioni diverse;

* meno modifiche fatte direttamente “live” online;

* una procedura chiara per testare e pubblicare le modifiche;

* una documentazione leggibile anche da non sviluppatori;

* una base adatta, in futuro, ad aggiungere supporto AI o workflow agentici per manutenzione e onboarding.

**Elenco task dettagliate e atomiche**

**Fase 1 — Capire bene il sistema attuale**

**1.1 Fare una fotografia completa del sistema**

* Aprire il Modulo Google usato oggi e segnare il suo nome esatto.

* Aprire il Foglio Google collegato al modulo e segnare il suo nome esatto.

* Aprire il progetto Apps Script attuale e verificare se è collegato al modulo o al foglio.

* Scrivere in un documento condiviso quali strumenti compongono il sistema: modulo, foglio, script, email, eventuali file aggiuntivi.

* Segnare chi usa il sistema oggi e per fare cosa.

**1.2 Elencare cosa deve fare davvero il sistema**

* Scrivere una lista semplice di tutte le azioni che il sistema dovrebbe fare quando arriva un’iscrizione.

* Separare le azioni “obbligatorie” da quelle “comode ma non essenziali”.

* Segnare quali azioni generano email, aggiornano celle, spostano dati o cambiano stato a un’iscrizione.

* Segnare quali azioni avvengono automaticamente e quali vengono fatte a mano.

**1.3 Individuare i problemi attuali**

* Scrivere un elenco dei problemi già visti in passato.

* Per ogni problema, descrivere in parole semplici cosa succede.

* Per ogni problema, indicare se succede spesso, raramente o in casi particolari.

* Per ogni problema, scrivere se esiste già un “trucco” manuale per sistemarlo.

* Evidenziare i punti dove nessuno dei due si sente sicuro di fare modifiche.

**1.4 Mappare i fogli e le colonne**

* Aprire ogni tab del Foglio Google e dargli un nome chiaro in un documento di analisi.

* Scrivere a cosa serve ogni tab.

* Elencare le colonne importanti di ogni tab.

* Indicare quali colonne vengono compilate dal modulo.

* Indicare quali colonne vengono compilate automaticamente dallo script.

* Indicare quali colonne vengono toccate a mano.

* Segnare le colonne “delicate”, cioè quelle che se cambiano nome o posizione possono rompere il sistema.

**1.5 Mappare trigger e automazioni**

* Aprire l’area trigger di Apps Script e fare l’elenco dei trigger esistenti.

* Per ogni trigger, segnare quale funzione lancia.

* Per ogni trigger, segnare quando parte: su invio modulo, a orario, su apertura, altro.

* Scrivere quali automazioni dipendono da ciascun trigger.

* Evidenziare se ci sono trigger duplicati o trigger che non si capisce più a cosa servano.

**Fase 2 — Mettere il sistema sotto controllo**

**2.1 Decidere una regola di lavoro condivisa**

* Concordare che da un certo punto in poi il codice non verrà più modificato casualmente nell’editor online.

* Stabilire che la versione “ufficiale” del codice sarà quella presente nella repository.

* Decidere chi può pubblicare modifiche e chi può solo proporle.

* Decidere un modo semplice per nominare le modifiche, per esempio con messaggi chiari tipo “corretto invio conferma email”.

**2.2 Creare la repository del progetto**

* Creare una nuova repository dedicata al sistema iscrizioni.

* Scegliere un nome semplice e riconoscibile.

* Aggiungere un file README iniziale con una descrizione umana del progetto.

* Creare una cartella principale dove andrà il codice Apps Script.

* Creare una cartella per la documentazione del progetto.

**2.3 Collegare Apps Script a VS Code**

* Installare clasp sul computer usato per lavorare con il progetto.

* Fare il login di clasp con l’account corretto.

* Collegare o clonare il progetto Apps Script esistente in una cartella locale.

* Aprire la cartella in VS Code.

* Verificare che i file del progetto siano effettivamente visibili in locale.

**2.4 Fare un primo salvataggio sicuro**

* Creare un primo commit che rappresenti lo stato attuale del sistema.

* Usare un messaggio chiaro, per esempio “import stato attuale sistema iscrizioni”.

* Pubblicare la repository remota.

* Verificare che il codice esista sia in locale sia online nella repo.

* Considerare questo punto come la “foto iniziale di sicurezza”.

**Fase 3 — Documentare prima di riscrivere**

**3.1 Scrivere la mappa funzionale**

* Creare un documento chiamato, ad esempio, “come funziona oggi”.

* Descrivere il percorso di un’iscrizione dall’invio del modulo fino alla chiusura del processo.

* Spiegare quali controlli vengono fatti.

* Spiegare quali email partono e in quali momenti.

* Spiegare quali stati può avere un’iscrizione.

**3.2 Scrivere il dizionario dei dati**

* Creare un documento con tutti i tab del foglio.

* Per ogni tab, spiegare in italiano semplice a cosa serve.

* Per ogni colonna importante, spiegare cosa contiene.

* Per ogni colonna importante, dire se può essere modificata a mano oppure no.

* Evidenziare le colonne chiave da non rinominare senza controllo.

**3.3 Scrivere la mappa delle automazioni**

* Elencare tutte le funzioni principali presenti nello script.

* Per ogni funzione, scrivere a cosa serve in termini semplici.

* Segnare se parte da sola o se viene lanciata da un’altra funzione.

* Evidenziare le funzioni “pericolose”, cioè quelle che scrivono dati, cancellano righe o inviano email.

**Fase 4 — Rendere il progetto più leggibile**

**4.1 Riordinare senza cambiare comportamento**

* Separare il codice in file diversi in base alla funzione che svolge.

* Tenere in un file solo le funzioni che partono dai trigger o dai pulsanti principali.

* Spostare le parti di lettura e scrittura del foglio in file dedicati.

* Spostare le impostazioni generali in un file di configurazione.

* Spostare eventuali email o messaggi automatici in file dedicati.

* Rinominare funzioni e variabili con nomi più chiari, quando possibile, senza alterare la logica.

**4.2 Centralizzare le informazioni delicate**

* Mettere in un solo punto gli ID dei file Google usati.

* Mettere in un solo punto i nomi dei tab importanti.

* Mettere in un solo punto i nomi delle colonne importanti.

* Mettere in un solo punto le email dei destinatari automatici.

* Mettere in un solo punto eventuali costanti come stati, etichette e valori ricorrenti.

**4.3 Togliere la logica nascosta**

* Cercare regole duplicate in più punti del codice.

* Cercare valori scritti “a mano” dentro funzioni sparse.

* Cercare riferimenti a colonne usando numeri difficili da capire.

* Sostituire gradualmente questi punti con nomi chiari e centralizzati.

* Annotare ogni passaggio in modo che sia comprensibile anche a distanza di mesi.

**Fase 5 — Aumentare la stabilità**

**5.1 Introdurre controlli prima delle azioni critiche**

* Verificare che i dati necessari esistano prima di usarli.

* Verificare che il foglio o il tab corretto siano davvero disponibili.

* Verificare che un invio email non parta con dati mancanti.

* Verificare che una riga non venga modificata se non è stata trovata correttamente.

* Verificare che gli stati delle iscrizioni seguano regole sensate.

**5.2 Introdurre log leggibili**

* Creare un sistema minimo di log per capire cosa è successo in caso di errore.

* Decidere se salvare i log in un tab dedicato del foglio oppure in un altro punto semplice da consultare.

* Registrare almeno: data, funzione eseguita, risultato, eventuale errore.

* Evitare messaggi troppo tecnici nei log interni.

* Preparare una piccola legenda per leggere i log.

**5.3 Mettere ordine nei trigger**

* Verificare che esista un solo trigger per ogni automazione importante, salvo casi voluti.\[cite:45\]

* Eliminare o disattivare i trigger inutili dopo averli documentati.\[cite:45\]

* Tenere una lista aggiornata dei trigger attivi.\[cite:45\]

* Scrivere una mini procedura per ricrearli se un giorno spariscono o vanno rifatti.\[cite:45\]

**Fase 6 — Creare un ambiente sicuro di prova**

**6.1 Preparare una copia del sistema**

* Creare una copia del modulo reale per fare test.

* Creare una copia del foglio reale per fare test.

* Collegare il progetto di prova ai file di prova, non a quelli reali.

* Verificare che le email di test non arrivino ai destinatari finali reali.

* Segnare chiaramente quali file sono “test” e quali “produzione”.

**6.2 Definire una procedura di test manuale**

* Scrivere una checklist delle prove da fare dopo ogni modifica.

* Inserire almeno un test di iscrizione normale.

* Inserire almeno un test con dati incompleti o strani.

* Inserire almeno un test sui flussi email.

* Inserire almeno un test sul corretto aggiornamento del foglio.

* Spuntare i test eseguiti a ogni rilascio.

**Fase 7 — Stabilire un modo semplice per lavorare insieme**

**7.1 Definire il flusso modifiche**

* Decidere se lavorare sempre su una copia locale del progetto.

* Decidere se ogni modifica deve passare da commit separati.

* Decidere se prima di pubblicare una modifica serve sempre un controllo dell’altro.

* Decidere una piccola checklist prima del push finale.

**7.2 Creare convenzioni facili da seguire**

* Scegliere come chiamare branch, se verranno usati.

* Scegliere come scrivere i messaggi dei commit.

* Scegliere dove annotare bug, idee e modifiche future.

* Scegliere dove annotare le decisioni importanti prese durante il lavoro.

**Fase 8 — Preparare documentazione per onboarding**

**8.1 Scrivere i documenti minimi indispensabili**

* Creare un README generale del progetto.

* Creare un documento “come pubblicare una modifica”.

* Creare un documento “come fare i test”.

* Creare un documento “come leggere il foglio e i suoi tab”.

* Creare un documento “cose da non toccare senza controllo”.

**8.2 Preparare una guida per nuovi collaboratori**

* Spiegare in poche righe a cosa serve il sistema.

* Spiegare quali sono i pezzi che lo compongono.

* Spiegare dove si trova il codice.

* Spiegare dove si trovano i file Google reali.

* Spiegare come capire se una modifica è pronta oppure no.

**Fase 9 — Preparare il terreno per supporto AI o agentico**

**9.1 Rendere il progetto leggibile anche per un assistente AI**

* Tenere i documenti aggiornati e coerenti con il codice.

* Evitare nomi ambigui nei file e nelle funzioni.

* Avere una cartella documentazione ordinata.

* Avere esempi concreti di flussi reali.

* Avere una lista chiara delle regole business principali.

**9.2 Definire gli usi utili dell’AI**

* Usare l’AI per spiegare il codice esistente.

* Usare l’AI per proporre modifiche piccole e localizzate.

* Usare l’AI per generare o aggiornare documentazione.

* Usare l’AI per aiutare un nuovo collaboratore a orientarsi.

* Evitare di usare l’AI per cambiare in massa parti critiche senza revisione umana.

**Fase 10 — Passare in modo controllato alla nuova gestione**

**10.1 Fare una prima release ordinata**

* Scegliere un momento tranquillo per pubblicare la prima versione riordinata.

* Fare backup dei file reali prima della pubblicazione.

* Verificare che i trigger attivi siano quelli giusti.\[cite:45\]

* Pubblicare la versione solo dopo i test di prova.

* Tenere monitorato il sistema nei giorni subito successivi.

**10.2 Stabilire manutenzione continua**

* Fare controlli periodici dei log.

* Rivedere periodicamente i trigger attivi.\[cite:45\]

* Annotare subito ogni nuovo bug osservato.

* Evitare correzioni improvvisate direttamente online.

* Accumulare le modifiche piccole e rilasciarle in modo ragionato.

**Ordine consigliato di esecuzione**

Per non complicare troppo il lavoro, l’ordine consigliato è questo:\[cite:20\]\[cite:41\]\[cite:45\]

1. Capire e documentare il sistema attuale.

2. Portare il codice dentro VS Code e in repository.

3. Fare una copia di prova sicura.

4. Riordinare il codice senza cambiare comportamento.

5. Aggiungere log, controlli e test.

6. Solo dopo, migliorare o aggiungere funzionalità.

7. Infine, costruire documentazione più completa e supporto AI.

**Cosa non fare**

Per proteggere il progetto, ci sono alcune cose da evitare:

* non riscrivere tutto da zero in una sola volta;

* non continuare a modificare il codice in più posti senza regole;

* non cambiare contemporaneamente struttura del modulo, foglio e codice senza test;

* non lavorare direttamente sui file reali senza avere una copia di prova;

* non affidarsi alla memoria per capire come funziona il sistema.

## **Appendice – Gestione annuale (Soluzione A)**

Ogni anno si continua a **duplicare modulo e foglio** dell’edizione precedente, così i dati restano separati per anno e si mantiene lo storico operativo.  
Il **codice Apps Script** non viene più copiato “a mano”: si prende sempre dalla stessa base versionata nella repository e si collega al nuovo progetto dell’anno.  
Per ogni nuova edizione si crea un nuovo progetto script, gli si carica la versione stabile del codice e si impostano solo le **configurazioni specifiche dell’anno** (ID del form, ID del foglio, nomi dei tab, anno, destinatari email).  
I trigger e le automazioni dell’anno vengono ricreati partendo da questa base comune, seguendo una procedura chiara e ripetibile.  
In questo modo ogni edizione ha i propri file operativi, ma condivide un unico “motore” di codice, più facile da correggere, migliorare e tenere sotto controllo nel tempo.

