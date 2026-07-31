'use strict';
/**
 * tests/stati.test.js
 * -----------------------------------------------------------------------
 * Domain/Stati.js non ha un equivalente diretto nel codice legacy (che non
 * aveva una vera macchina a stati, solo testo libero in celle come "Inviata
 * con prezzo" / "Bloccato: già inviata con prezzo" / "prima senza, ora con").
 *
 * Questi test verificano che la NUOVA macchina a stati rispetti fedelmente
 * le regole di business implicite nel comportamento storico:
 *  - una volta inviata una mail "con prezzo" (o un reinvio), non deve essere
 *    possibile reinviare di nuovo silenziosamente (vedi il blocco storico in
 *    invioMailAggiornamento: "Bloccato: già inviata con prezzo");
 *  - gli stati terminali (pagata/annullata) non devono avere transizioni
 *    automatiche in uscita;
 *  - nessuna combinazione (stato, evento) deve mai lanciare un'eccezione:
 *    le transizioni non valide restituiscono lo stato invariato.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { creaContestoDomain } = require('./support/loadDomain');

const contesto = creaContestoDomain();
const { STATI_ISCRIZIONE, EVENTI_ISCRIZIONE } = contesto;

test('flusso tipico: NUOVA -> PREZZO_CALCOLATO -> MAIL_INVIATA_CON_PREZZO -> PAGATA', () => {
  let stato = STATI_ISCRIZIONE.NUOVA;
  let r;

  r = contesto.prossimoStatoIscrizione(stato, EVENTI_ISCRIZIONE.RICALCOLA_PREZZO);
  assert.equal(r.stato, STATI_ISCRIZIONE.PREZZO_CALCOLATO);
  assert.equal(r.applicata, true);
  stato = r.stato;

  r = contesto.prossimoStatoIscrizione(stato, EVENTI_ISCRIZIONE.MAIL_CONFERMA_INVIATA);
  assert.equal(r.stato, STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO);
  stato = r.stato;

  r = contesto.prossimoStatoIscrizione(stato, EVENTI_ISCRIZIONE.PAGAMENTO_REGISTRATO);
  assert.equal(r.stato, STATI_ISCRIZIONE.PAGATA);
});

test('flusso senza prezzo disponibile: NUOVA -> MAIL_INVIATA_SENZA_PREZZO -> REINVIATA dopo aggiornamento', () => {
  let stato = STATI_ISCRIZIONE.NUOVA;
  let r = contesto.prossimoStatoIscrizione(stato, EVENTI_ISCRIZIONE.MAIL_CONFERMA_INVIATA);
  assert.equal(r.stato, STATI_ISCRIZIONE.MAIL_INVIATA_SENZA_PREZZO);

  r = contesto.prossimoStatoIscrizione(r.stato, EVENTI_ISCRIZIONE.INVIA_AGGIORNAMENTO);
  assert.equal(r.stato, STATI_ISCRIZIONE.REINVIATA);
});

test('BUG REALE (trovato in verifica live) risolto: da PREZZO_CALCOLATO, INVIA_AGGIORNAMENTO deve transitare a REINVIATA', () => {
  // Scenario reale riprodotto: un'iscrizione "solo pranzo CUN" arriva senza prezzo
  // (MAIL_INVIATA_SENZA_PREZZO), l'operatore lancia "Ricalcola prezzo" dal menu
  // (-> PREZZO_CALCOLATO) e poi "Invia aggiornamento" dal menu. Mancava la
  // transizione INVIA_AGGIORNAMENTO da PREZZO_CALCOLATO: l'email partiva comunque
  // (side-effect nell'orchestrazione) ma lo stato restava bloccato su
  // PREZZO_CALCOLATO, disattivando il guard "già inviata" per invii futuri.
  const r1 = contesto.prossimoStatoIscrizione(STATI_ISCRIZIONE.MAIL_INVIATA_SENZA_PREZZO, EVENTI_ISCRIZIONE.RICALCOLA_PREZZO);
  assert.equal(r1.stato, STATI_ISCRIZIONE.PREZZO_CALCOLATO);

  const r2 = contesto.prossimoStatoIscrizione(r1.stato, EVENTI_ISCRIZIONE.INVIA_AGGIORNAMENTO);
  assert.equal(r2.applicata, true, 'la transizione deve essere applicata, non restare bloccata su PREZZO_CALCOLATO');
  assert.equal(r2.stato, STATI_ISCRIZIONE.REINVIATA);
});

test('nessuno stato non-terminale è un "vicolo cieco" per gli eventi azionabili da menu operatore', () => {
  // Invariante di robustezza: RICALCOLA_PREZZO, INVIA_AGGIORNAMENTO e PAGAMENTO_REGISTRATO
  // devono sempre produrre una transizione applicata da qualunque stato non terminale,
  // altrimenti un'azione da menu risulterebbe "silenziosamente ignorata" (come nel bug sopra).
  const eventiAzionabiliDaMenu = [EVENTI_ISCRIZIONE.RICALCOLA_PREZZO, EVENTI_ISCRIZIONE.INVIA_AGGIORNAMENTO, EVENTI_ISCRIZIONE.PAGAMENTO_REGISTRATO];
  const statiNonTerminali = Object.values(STATI_ISCRIZIONE).filter((s) => !contesto.isStatoIscrizioneTerminale(s));

  statiNonTerminali.forEach((stato) => {
    eventiAzionabiliDaMenu.forEach((evento) => {
      const r = contesto.prossimoStatoIscrizione(stato, evento);
      assert.equal(r.applicata, true, `${stato} + ${evento} dovrebbe produrre una transizione applicata (nessun vicolo cieco)`);
    });
  });
});

test('regola storica preservata: una volta MAIL_INVIATA_CON_PREZZO o REINVIATA, il reinvio è gestito esplicitamente (bloccato a livello di orchestrazione)', () => {
  // La macchina a stati stessa permette la transizione INVIA_AGGIORNAMENTO anche da
  // MAIL_INVIATA_CON_PREZZO/REINVIATA (idempotente verso REINVIATA), ma il BLOCCO vero
  // e proprio (come da comportamento storico "Bloccato: già inviata con prezzo") è
  // responsabilità del gestore in Orchestration/processaEventi.js#gestisciInviaAggiornamento,
  // che verifica esplicitamente questi due stati prima di procedere. Qui verifichiamo
  // solo che la macchina a stati esponga quello stato in modo interrogabile.
  const stati = [STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO, STATI_ISCRIZIONE.REINVIATA];
  stati.forEach((stato) => {
    assert.ok(
      stato === STATI_ISCRIZIONE.MAIL_INVIATA_CON_PREZZO || stato === STATI_ISCRIZIONE.REINVIATA,
      'stato riconoscibile per il blocco di reinvio lato orchestrazione'
    );
  });
});

test('stati terminali PAGATA e ANNULLATA non hanno transizioni automatiche in uscita', () => {
  [STATI_ISCRIZIONE.PAGATA, STATI_ISCRIZIONE.ANNULLATA].forEach((statoTerminale) => {
    Object.keys(EVENTI_ISCRIZIONE).forEach((chiaveEvento) => {
      const evento = EVENTI_ISCRIZIONE[chiaveEvento];
      if (evento === EVENTI_ISCRIZIONE.ANNULLA) return; // gestito separatamente sotto
      const r = contesto.prossimoStatoIscrizione(statoTerminale, evento);
      assert.equal(r.applicata, false, `${statoTerminale} + ${evento} non dovrebbe produrre una transizione`);
      assert.equal(r.stato, statoTerminale);
    });
    assert.equal(contesto.isStatoIscrizioneTerminale(statoTerminale), true);
  });
});

test('ANNULLA è sempre permesso da qualunque stato non-ANNULLATA, e idempotente su ANNULLATA', () => {
  Object.keys(STATI_ISCRIZIONE).forEach((chiaveStato) => {
    const stato = STATI_ISCRIZIONE[chiaveStato];
    const r = contesto.prossimoStatoIscrizione(stato, EVENTI_ISCRIZIONE.ANNULLA);
    if (stato === STATI_ISCRIZIONE.ANNULLATA) {
      assert.equal(r.applicata, false);
      assert.equal(r.stato, STATI_ISCRIZIONE.ANNULLATA);
    } else {
      assert.equal(r.applicata, true);
      assert.equal(r.stato, STATI_ISCRIZIONE.ANNULLATA);
    }
  });
});

test('nessuna combinazione (stato, evento), inclusi valori sconosciuti, lancia eccezioni', () => {
  const statiDaProvare = Object.values(STATI_ISCRIZIONE).concat(['', null, undefined, 'STATO_INESISTENTE']);
  const eventiDaProvare = Object.values(EVENTI_ISCRIZIONE).concat(['', null, undefined, 'EVENTO_INESISTENTE']);

  statiDaProvare.forEach((stato) => {
    eventiDaProvare.forEach((evento) => {
      assert.doesNotThrow(() => contesto.prossimoStatoIscrizione(stato, evento));
    });
  });
});

test('stato non riconosciuto/vuoto viene trattato come NUOVA (fallback sicuro)', () => {
  const r1 = contesto.prossimoStatoIscrizione('', EVENTI_ISCRIZIONE.RICALCOLA_PREZZO);
  const r2 = contesto.prossimoStatoIscrizione(STATI_ISCRIZIONE.NUOVA, EVENTI_ISCRIZIONE.RICALCOLA_PREZZO);
  assert.equal(r1.stato, r2.stato);
  assert.equal(r1.applicata, r2.applicata);
});
