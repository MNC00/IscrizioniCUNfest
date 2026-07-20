# 8.4 – Come Leggere il Foglio e i Tab

Guida pensata per chi **non programma**, ma deve usare o consultare il Google Sheet del progetto per gestire le iscrizioni.

## Come è organizzato il foglio

Il Google Sheet è diviso in più "tab" (le linguette in basso), ognuno con uno scopo preciso. Non sono fogli indipendenti: si aggiornano a catena, in automatico, ogni volta che qualcuno si iscrive o che un operatore compie un'azione.

## I tab principali e a cosa servono

### "Iscrizioni CUN Fest" — il foglio principale
È il tab collegato al Google Form: ogni volta che qualcuno compila il modulo, qui compare una nuova riga. È la fonte di verità di tutte le informazioni sull'iscritto (nome, email, date, pasti, prezzo calcolato). Da qui partono tutte le altre elaborazioni.

### "Iscrizioni ordinate"
È una copia dello stesso elenco, ma ordinata per Cognome e Nome, utile per consultazioni rapide. **Viene riscritta completamente ogni volta**: qualsiasi nota o modifica scritta a mano qui sopra viene persa al giro successivo. Non scriverci nulla di importante.

### "Pagamento"
Elenco degli iscritti con i dati essenziali (anagrafica, date, prezzo) e una colonna in più: **"Pagato"**. È l'unico tab pensato per essere usato attivamente dagli operatori durante la gestione dei pagamenti: quando una persona paga, si scrive `x` nella colonna "Pagato" e la riga si colora di azzurro come promemoria visivo.

### "Tabella Pasti"
Riepilogo automatico di quante colazioni, pranzi, cene e pernottamenti servono ogni giorno, calcolato in base a chi arriva/parte quando. Utile per l'organizzazione logistica (cucina, alloggi). Anche questo tab viene **rigenerato interamente** ad ogni aggiornamento: non modificarlo a mano.

### "Tabella Costi e Istruzioni" (foglio tariffe)
Contiene i prezzi base (giornata, notte, colazione, pasto, ecc.) e le date di inizio/fine dell'evento. È il tab da cui lo script legge i valori per calcolare automaticamente il prezzo di ogni iscritto. **Molto delicato**: un valore sbagliato o una riga spostata qui dentro cambia il prezzo calcolato per tutti.

### "Comunicazione a tutti gli iscritti"
Tab da usare quando si vuole mandare un'email uguale a tutti gli iscritti (es. un promemoria generale). Si scrive oggetto e testo, poi si conferma l'invio in una cella dedicata.

### "Stanze" (se in uso)
Contiene l'assegnazione delle stanze per ciascun iscritto. Da qui si può lanciare l'invio dell'email con la stanza assegnata e i compagni di stanza.

### "Log"
Tab tecnico che registra automaticamente data/ora, tipo di evento (informazione, avviso, errore) e dettaglio di ogni operazione automatica eseguita dal sistema. Utile per capire cosa è successo se qualcosa non ha funzionato come previsto: consultalo, ma non modificarlo a mano.

## Colonne delicate e perché

Alcune colonne del foglio "Iscrizioni CUN Fest" **non vanno mai rinominate, spostate o svuotate per errore**, perché il programma le cerca per nome esatto o per posizione:

- **Nome, Cognome, Email**: usate per riconoscere la persona in tutti gli altri fogli e per inviare le email. Se l'email è vuota, quella persona **non riceverà nessuna comunicazione**.
- **Data di arrivo / Data di partenza / Pasto di arrivo / Pasto di partenza**: usate per calcolare il prezzo e i pasti. Un valore scritto in modo diverso dal previsto (es. testo libero al posto di una data) può alterare il calcolo senza dare errore visibile.
- **Prezzo**: viene scritta e riscritta automaticamente dal sistema a ogni elaborazione. **Non modificarla a mano**: verrebbe sovrascritta al primo aggiornamento successivo.
- **Partecipi SOLO al pranzo del CUN?** e **Parliamo solo di lunedì**: il sistema riconosce solo alcune scritte esatte (es. "Si"). Scrivere qualcosa di diverso, anche solo per maiuscole/minuscole, può far sì che la richiesta non venga considerata.
- **Mail di conferma inviata / Nuovo invio / Stato nuovo invio**: colonne gestite dal sistema per tenere traccia di cosa è già stato inviato. "Nuovo invio" è l'unica pensata per essere scritta a mano da un operatore (con il comando esatto `invia con prezzo`), le altre sono solo di lettura/informazione.
- **Pagato** (tab "Pagamento"): è l'unica colonna pensata per essere compilata manualmente su quel tab; tutte le altre vengono aggiornate automaticamente.

## Chi compila cosa

| Chi | Cosa compila |
|---|---|
| **La persona che si iscrive** (tramite Google Form) | Tutte le colonne anagrafiche e di soggiorno nel tab "Iscrizioni CUN Fest" (nome, email, date, pasti, ecc.) |
| **Il programma (script)** | Prezzo, stato delle email, tab "Iscrizioni ordinate", "Pagamento" (tranne "Pagato"), "Tabella Pasti", colorazione righe, tab "Log" |
| **L'operatore, a mano** | Colonna "Pagato" (tab Pagamento), colonna "Nuovo invio" (per forzare un reinvio), il comando di invio comunicazioni di massa, il comando di invio stanze, e i valori nel tab tariffe |

## Regola pratica da ricordare

Se un tab si rigenera automaticamente (Iscrizioni ordinate, Pagamento tranne "Pagato", Tabella Pasti), **qualsiasi cosa scritta lì a mano andrà persa** al prossimo aggiornamento. Scrivi manualmente solo dove indicato in questa guida: colonna "Pagato", colonna "Nuovo invio", tab Comunicazione, tab Stanze, tab tariffe.
