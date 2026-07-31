/**
 * Orchestration/rigeneraViste.js
 * -----------------------------------------------------------------------
 * Rigenera le viste derivate (Iscrizioni ordinate, Pagamento, Tabella Pasti)
 * a partire dai dati correnti del tab Iscrizioni. Pensata per essere eseguita
 * periodicamente (time-driven, ogni ~5 minuti) invece che in modo sincrono
 * ad ogni submit/edit: questo evita di rallentare il trigger del form e
 * rende l'operazione ripetibile in sicurezza (idempotente, agganciata a
 * ID_ISCRIZIONE anziché a Nome+Cognome).
 */

/**
 * Rigenera tutte le viste derivate. Idempotente: eseguirla più volte di
 * seguito con gli stessi dati produce sempre lo stesso risultato.
 * @return {{ok: boolean, errore: (string|null)}}
 */
function rigeneraViste() {
  try {
    importaIscrizioniDaForm();

    var sheetIscrizioni = getOCreaFoglioOperativo();
    var iscrizioni = leggiTutteIscrizioni(sheetIscrizioni);

    var sheetOrdinato = getOCreaFoglio(FOGLI.ISCRIZIONI_ORDINATE);
    rigeneraFoglioIscrizioniOrdinate(iscrizioni, sheetIscrizioni, sheetOrdinato);

    var sheetPagamento = getOCreaFoglio(FOGLI.PAGAMENTO);
    aggiornaFoglioPagamento(iscrizioni, sheetPagamento);

    var configurazione = leggiConfigurazioneCalcoloPrezzi(leggiMappaConfigurazione());
    if (configurazione.dataInizioCun && configurazione.dataFineCun) {
      var risultatoPasti = calcolaPastiPerGiorno(iscrizioni, configurazione);
      var sheetPasti = getOCreaFoglio(FOGLI.TABELLA_PASTI);
      scriviTabellaPasti(risultatoPasti, sheetPasti);
    } else {
      Logger.log('rigeneraViste: date CUN non configurate, tabella pasti non rigenerata.');
    }

    aggiornaDashboardStato(iscrizioni);

    return { ok: true, errore: null };
  } catch (e) {
    var messaggio = e && e.message ? e.message : String(e);
    Logger.log('rigeneraViste ha fallito: %s', messaggio);
    registraEventoImmediato('', 'RIGENERA_VISTE', {}, 'ERRORE', messaggio);
    return { ok: false, errore: messaggio };
  }
}

/**
 * Aggiorna il tab "Dashboard" con i conteggi per stato e gli ultimi eventi in errore.
 * Isolata in una propria funzione (con il proprio try/catch a monte in rigeneraViste)
 * così un problema nella dashboard non impedisce l'aggiornamento delle altre viste.
 * @param {Array} iscrizioni Elenco già letto da leggiTutteIscrizioni.
 */
function aggiornaDashboardStato(iscrizioni) {
  var eventiRecenti = leggiEventiRecenti(200);
  var dati = calcolaDashboardStato(iscrizioni, eventiRecenti);
  var sheetDashboard = getOCreaFoglio(FOGLI.DASHBOARD);
  scriviDashboardStato(dati, sheetDashboard);
}

/**
 * Punto di ingresso pensato per il trigger a tempo (~5 minuti): rigenera le
 * viste ed elabora eventuali eventi rimasti in coda (rete di sicurezza per
 * elaborazioni fallite o non ancora processate).
 * @return {{viste: {ok: boolean, errore: (string|null)}, eventi: {elaborati: number, ok: number, errori: number}}}
 */
function rigeneraVisteSeNecessario() {
  var esitoViste = rigeneraViste();
  var esitoEventi = processaEventiPendenti(50);
  return { viste: esitoViste, eventi: esitoEventi };
}
