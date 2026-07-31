/**
 * Triggers/onOpenMenu.js
 * -----------------------------------------------------------------------
 * Simple trigger onOpen(): crea il menu "Iscrizioni CUN Fest" con le azioni
 * manuali dell'operatore. Sostituisce i vecchi "comandi da cella" (scrivere
 * "invia con prezzo", "si", "INVIA" in celle specifiche): ogni azione ora
 * richiede una scelta esplicita da menu, con conferma per le operazioni che
 * inviano email.
 */

/** Simple trigger: crea il menu ad ogni apertura dello spreadsheet. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Iscrizioni CUN Fest')
    .addItem('Ricalcola prezzo (riga selezionata)', 'menuRicalcolaPrezzoRigaSelezionata')
    .addItem('Invia aggiornamento prezzo (riga selezionata)', 'menuInviaAggiornamentoRigaSelezionata')
    .addItem('Registra pagamento (riga selezionata in Pagamento)', 'menuRegistraPagamentoRigaSelezionata')
    .addSeparator()
    .addItem('Invia comunicazione a tutti gli iscritti…', 'menuInviaComunicazioneATutti')
    .addSeparator()
    .addItem('Rigenera viste ora (Ordinato/Pagamento/Pasti/Dashboard)', 'menuRigeneraVisteOra')
    .addItem('Esporta log eventi (ultimi 200)', 'menuEsportaLogEventi')
    .addSeparator()
    .addItem('Migra dati legacy (una tantum)', 'menuMigraIscrizioniLegacy')
    .addItem('Apri dettaglio iscrizione…', 'menuApriSidebarDettaglio')
    .addSeparator()
    .addItem('❓ Guida rapida', 'menuApriGuidaRapida')
    .addToUi();
}

/** @return {?string} ID_ISCRIZIONE della riga attualmente selezionata nel tab Iscrizioni, o null. */
function idIscrizioneDaRigaSelezionata_() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== FOGLI.ISCRIZIONI) {
    ui.alert('Selezionare una riga nel tab "' + FOGLI.ISCRIZIONI + '".');
    return null;
  }
  var riga = sheet.getActiveCell().getRow();
  if (riga <= 1) {
    ui.alert('Selezionare una riga dati (non l\'intestazione).');
    return null;
  }
  var indiceIntestazioni = costruisciIndiceIntestazioni(sheet);
  var idxId = trovaColonna([COLONNE_ISCRIZIONI.ID_ISCRIZIONE], indiceIntestazioni);
  var id = idxId >= 0 ? sheet.getRange(riga, idxId + 1).getValue() : null;
  if (!id) {
    ui.alert('Questa riga non ha un ID_ISCRIZIONE. Eseguire prima "Migra dati legacy".');
    return null;
  }
  return id;
}

/** Mostra un alert con l'esito di un'elaborazione ({esito, errori}). */
function mostraEsito_(titolo, risultato) {
  var ui = SpreadsheetApp.getUi();
  if (risultato.esito === 'OK') {
    ui.alert(titolo, 'Operazione completata con successo.', ui.ButtonSet.OK);
  } else {
    ui.alert(titolo, 'Operazione non riuscita:\n' + (risultato.errori || []).join('\n'), ui.ButtonSet.OK);
  }
}

/** Menu: ricalcola il prezzo della riga selezionata nel tab Iscrizioni. */
function menuRicalcolaPrezzoRigaSelezionata() {
  var id = idIscrizioneDaRigaSelezionata_();
  if (!id) return;
  var risultato = gestisciRicalcolaPrezzo(id);
  mostraEsito_('Ricalcola prezzo', risultato);
}

/** Menu: invia la mail di aggiornamento prezzo per la riga selezionata, con conferma.
 *  Se era già stata inviata una mail "con prezzo" in precedenza, chiede una SECONDA conferma
 *  esplicita prima di reinviare (nessun blocco secco: il reinvio resta possibile). */
function menuInviaAggiornamentoRigaSelezionata() {
  var id = idIscrizioneDaRigaSelezionata_();
  if (!id) return;
  var ui = SpreadsheetApp.getUi();
  var conferma = ui.alert('Invia aggiornamento', 'Confermi l\'invio della mail di aggiornamento prezzo a questo iscritto?', ui.ButtonSet.YES_NO);
  if (conferma !== ui.Button.YES) return;

  var risultato = gestisciInviaAggiornamento(id, false);
  if (risultato.esito === 'RICHIEDE_CONFERMA') {
    var confermaReinvio = ui.alert(
      'Mail già inviata in precedenza',
      'A questo iscritto è già stata inviata una mail di aggiornamento con il prezzo. Vuoi inviarne comunque un\'altra (es. il prezzo è cambiato di nuovo, o l\'iscritto ha chiesto un secondo invio)?',
      ui.ButtonSet.YES_NO
    );
    if (confermaReinvio !== ui.Button.YES) return;
    risultato = gestisciInviaAggiornamento(id, true);
  }
  mostraEsito_('Invia aggiornamento', risultato);
}

/** Menu: registra il pagamento per la riga selezionata nel tab Pagamento. */
function menuRegistraPagamentoRigaSelezionata() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== FOGLI.PAGAMENTO) {
    ui.alert('Selezionare una riga nel tab "' + FOGLI.PAGAMENTO + '".');
    return;
  }
  var riga = sheet.getActiveCell().getRow();
  if (riga <= 1) { ui.alert('Selezionare una riga dati (non l\'intestazione).'); return; }

  var indicePagamento = costruisciIndiceIntestazioni(sheet);
  var idxId = trovaColonna([COLONNE_PAGAMENTO.ID_ISCRIZIONE], indicePagamento);
  var id = idxId >= 0 ? sheet.getRange(riga, idxId + 1).getValue() : null;
  if (!id) { ui.alert('Riga senza ID_ISCRIZIONE: eseguire prima "Migra dati legacy".'); return; }

  var idxPagato = assicuraColonna(sheet, indicePagamento, COLONNE_PAGAMENTO.PAGATO);
  sheet.getRange(riga, idxPagato + 1).setValue('x');
  sheet.getRange(riga, 1, 1, sheet.getLastColumn()).setBackground('#cfe2fe');

  accodaEvento(id, EVENTI_ISCRIZIONE.PAGAMENTO_REGISTRATO, {});
  var risultato = processaEventiPendenti(5);
  mostraEsito_('Registra pagamento', { esito: risultato.errori === 0 ? 'OK' : 'ERRORE', errori: ['Vedi tab Eventi per i dettagli.'] });
}

/** Menu: invia una comunicazione di massa (richiede una riga con STATO vuoto/DA_INVIARE nel tab Comunicazioni). */
function menuInviaComunicazioneATutti() {
  var ui = SpreadsheetApp.getUi();
  var daInviare = leggiComunicazioniDaInviare();
  if (!daInviare.length) {
    ui.alert('Nessuna comunicazione da inviare. Aggiungere una riga con OGGETTO e TESTO nel tab "' + FOGLI.COMUNICAZIONI + '".');
    return;
  }
  var comunicazione = daInviare[0];
  var conferma = ui.alert(
    'Invia comunicazione a tutti gli iscritti',
    'Oggetto: ' + comunicazione.oggetto + '\n\nQuesta azione invierà una email a TUTTI gli indirizzi unici presenti nelle iscrizioni. Confermi?',
    ui.ButtonSet.YES_NO
  );
  if (conferma !== ui.Button.YES) return;

  var risultato = gestisciComunicazioneMassiva(comunicazione.idComm);
  mostraEsito_('Comunicazione a tutti gli iscritti', risultato);
}

/** Menu: forza subito la rigenerazione delle viste derivate. */
function menuRigeneraVisteOra() {
  var risultato = rigeneraViste();
  mostraEsito_('Rigenera viste', { esito: risultato.ok ? 'OK' : 'ERRORE', errori: [risultato.errore] });
}

/** Menu: esporta gli ultimi 200 eventi del log in un nuovo foglio "Export Log <data>". */
function menuEsportaLogEventi() {
  var sheetEventi = getOCreaFoglioEventi();
  var ultimaRiga = sheetEventi.getLastRow();
  var numColonne = sheetEventi.getLastColumn();
  var primaRiga = Math.max(2, ultimaRiga - 199);
  var intestazioni = sheetEventi.getRange(1, 1, 1, numColonne).getValues();
  var dati = ultimaRiga >= primaRiga ? sheetEventi.getRange(primaRiga, 1, ultimaRiga - primaRiga + 1, numColonne).getValues() : [];

  var nomeExport = 'Export Log ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  var sheetExport = getSpreadsheetAttivo().insertSheet(nomeExport);
  sheetExport.getRange(1, 1, 1, numColonne).setValues(intestazioni).setFontWeight('bold');
  if (dati.length) sheetExport.getRange(2, 1, dati.length, numColonne).setValues(dati);
  for (var c = 1; c <= numColonne; c++) sheetExport.autoResizeColumn(c);

  SpreadsheetApp.getUi().alert('Log esportato nel tab "' + nomeExport + '".');
}

/** Menu: esegue la migrazione dati legacy (ID_ISCRIZIONE + STATO_ISCRIZIONE). */
function menuMigraIscrizioniLegacy() {
  var risultato = migraIscrizioniLegacy();
  SpreadsheetApp.getUi().alert(
    'Migrazione completata: ' + risultato.iscrizioniMigrate + ' iscrizioni migrate, ' +
    risultato.pagamentoRiagganciate + ' righe di Pagamento riagganciate per ID.'
  );
}

/** Menu: apre la sidebar di dettaglio per la riga selezionata. */
function menuApriSidebarDettaglio() {
  apriSidebarDettaglioIscrizione();
}

/** Menu: apre una finestra con la guida rapida (cheat-sheet) per l'operatore. */
function menuApriGuidaRapida() {
  var html = HtmlService.createHtmlOutputFromFile('UI/guidaRapida').setWidth(480).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, 'Guida rapida — Iscrizioni CUN Fest');
}
