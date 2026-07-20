/**
 * SHEETS.gs
 * ---------------------------------------------------------------------------
 * Operazioni di lettura/scrittura sui fogli derivati (Iscrizioni ordinate,
 * Pagamento, Tabella Pasti) e sulla colonna di stato consolidata.
 *
 * ITERAZIONE 3 (2026-07-20): aggiunta aggiornaStatoIscrizione(), che scrive
 * un'unica colonna leggibile "Stato Iscrizione" nel foglio Iscrizioni,
 * combinando le informazioni finora sparse su "Mail di conferma inviata",
 * "Stato nuovo invio" (foglio Iscrizioni) e "Pagato" (foglio Pagamento). Le
 * colonne granulari restano invariate come dettaglio/debug; questa è la
 * colonna che un operatore dovrebbe guardare per sapere "a che punto è"
 * un'iscrizione senza dover incrociare due fogli a mano.
 * ---------------------------------------------------------------------------
 */

/************** FOGLIO "ISCRIZIONI ORDINATE" **************/
function creaFoglioOrdinato() {
  var FN = "creaFoglioOrdinato";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRisposte = ss.getSheetByName(CONFIG.SHEETS.ISCRIZIONI); // Foglio collegato al modulo
  var sheetOrdinato = ss.getSheetByName(CONFIG.SHEETS.ORDINATE);    // Foglio da aggiornare

  // Controllo preventivo: entrambi i fogli devono esistere prima di procedere
  if (!sheetRisposte || !sheetOrdinato) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Foglio \"" + CONFIG.SHEETS.ISCRIZIONI + "\" o \"" + CONFIG.SHEETS.ORDINATE + "\" non trovato.");
    return;
  }

  try {
    // Leggi tutto il contenuto del foglio con le risposte
    var data = sheetRisposte.getDataRange().getValues();

    if (!data || data.length === 0) {
      logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Nessun dato da copiare nel foglio ordinato.");
      return;
    }

    // Cancella tutto nel foglio ordinato (tranne il foglio stesso)
    sheetOrdinato.clearContents();

    // Copia i dati nel foglio ordinato
    sheetOrdinato.getRange(1, 1, data.length, data[0].length).setValues(data);

    // Ordina per colonna 2 (B), partendo dalla riga 2 (per mantenere l’intestazione)
    if (data.length > 1) {
      sheetOrdinato.getRange(2, 1, data.length - 1, data[0].length).sort([{ column: 2, ascending: true },{ column: 3, ascending: true }]);
    }
    // Colora l’intestazione
    sheetOrdinato.getRange(1, 1, 1, data[0].length).setBackground(CONFIG.COLORI.INTESTAZIONE_VERDE).setFontWeight("bold");
    sheetOrdinato.setFrozenRows(1);

    // Adatta larghezza colonne al contenuto
    for (var col = 1; col <= data[0].length; col++) {sheetOrdinato.autoResizeColumn(col);}
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Rigenerazione del foglio \"" + CONFIG.SHEETS.ORDINATE + "\" fallita.", e);
  }
}

/************** FOGLIO "PAGAMENTO" **************/
function creaFoglioPagamento() {
  var FN = "creaFoglioPagamento";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRisposte = ss.getSheetByName(CONFIG.SHEETS.ISCRIZIONI);
  var sheetRiepilogo = ss.getSheetByName(CONFIG.SHEETS.PAGAMENTO);

  // Controllo preventivo: entrambi i fogli devono esistere prima di procedere
  if (!sheetRisposte || !sheetRiepilogo) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Foglio \"" + CONFIG.SHEETS.ISCRIZIONI + "\" o \"" + CONFIG.SHEETS.PAGAMENTO + "\" non trovato.");
    return;
  }

  try {
    var headerRisposte = sheetRisposte.getRange(1, 1, 1, sheetRisposte.getLastColumn()).getValues()[0];

    if (sheetRisposte.getLastRow() <= 1) {
      logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Nessuna riga di iscrizione da riportare nel foglio pagamento.");
      return;
    }

    var datiRisposte = sheetRisposte.getRange(2, 1, sheetRisposte.getLastRow() - 1, headerRisposte.length).getValues();

    var campiDesiderati = CONFIG.CAMPI_PAGAMENTO;

    // Crea intestazione se non esiste
    if (sheetRiepilogo.getLastRow() === 0) {
      sheetRiepilogo.appendRow(campiDesiderati.concat("Pagato"));
      sheetRiepilogo.getRange(1, 1, 1, campiDesiderati.length + 1).setBackground(CONFIG.COLORI.INTESTAZIONE_VERDE).setFontWeight("bold");
      sheetRiepilogo.setFrozenRows(1);
    }

    var datiRiepilogo = sheetRiepilogo.getDataRange().getValues();
    var headerRiepilogo = datiRiepilogo[0];
    var righeAggiornate = 0;

    for (var i = 0; i < datiRisposte.length; i++) {
      var rigaRisposta = datiRisposte[i];
      var nuovaRiga = campiDesiderati.map(function(campo) {
        return rigaRisposta[headerRisposte.indexOf(campo)];
      });
      var nomeNew = norm(nuovaRiga[1]);
      var cognomeNew = norm(nuovaRiga[0]);
      var trovata = false;

      // Cerca corrispondenza nel foglio Riepilogo
      for (var j = 1; j < datiRiepilogo.length; j++) {
        var rigaEsistente = datiRiepilogo[j];
        var nomeEsistente = norm(rigaEsistente[1]);
        var cognomeEsistente = norm(rigaEsistente[0]);

        if (nomeEsistente === nomeNew && cognomeEsistente === cognomeNew) {
          // Mantieni valore "pagato"
          nuovaRiga.push(rigaEsistente[headerRiepilogo.length - 1]);
          // Aggiorna la riga
          sheetRiepilogo.getRange(j + 1, 1, 1, nuovaRiga.length).setValues([nuovaRiga]);
          trovata = true;
          break;
        }
      }

      if (!trovata) {
        nuovaRiga.push(""); // colonna pagato vuota
        sheetRiepilogo.appendRow(nuovaRiga);
      }
    }

    // Ordina per Cognome (col 1) e Nome (col 2)
    var numRows = sheetRiepilogo.getLastRow();
    var numCols = sheetRiepilogo.getLastColumn();
    if (numRows > 1) {
      sheetRiepilogo.getRange(2, 1, numRows - 1, numCols)
                    .sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);
    }

    // Auto resize colonne (minimo 100px)
    for (var col = 1; col <= numCols; col++) {
      sheetRiepilogo.autoResizeColumn(col);
      if (sheetRiepilogo.getColumnWidth(col) < CONFIG.LARGHEZZA_COLONNA_MINIMA_PAGAMENTO) {
        sheetRiepilogo.setColumnWidth(col, CONFIG.LARGHEZZA_COLONNA_MINIMA_PAGAMENTO);
      }
    }
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento del foglio \"" + CONFIG.SHEETS.PAGAMENTO + "\" fallito.", e);
  }
}

/************** TABELLA PASTI **************/
function generaTabellaPasti() {
  var FN = "generaTabellaPasti";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetIscrizioni = ss.getSheetByName(CONFIG.SHEETS.ISCRIZIONI);
  var sheetInfo = getTariffeSheet_(FN);

  // Controllo preventivo: i fogli sorgente devono esistere prima di procedere
  if (!sheetIscrizioni || !sheetInfo) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Foglio \"" + CONFIG.SHEETS.ISCRIZIONI + "\" o foglio tariffe non trovato (vedi CONFIG.SHEETS.TARIFFE).");
    return;
  }

  var sheetPasti = ss.getSheetByName(CONFIG.SHEETS.TABELLA_PASTI) || ss.insertSheet(CONFIG.SHEETS.TABELLA_PASTI);

  // Date inizio/fine dal secondo foglio (celle D1 e D2)
  var dataInizioCUN = new Date(sheetInfo.getRange(CONFIG.CELLE.DATA_INIZIO_CUN).getValue());
  var dataFineCUN = new Date(sheetInfo.getRange(CONFIG.CELLE.DATA_FINE_CUN).getValue());

  // Controllo preventivo: le date devono essere valide prima di rigenerare la tabella
  if (isNaN(dataInizioCUN) || isNaN(dataFineCUN)) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Date CUN non valide nelle celle " + CONFIG.CELLE.DATA_INIZIO_CUN + "/" + CONFIG.CELLE.DATA_FINE_CUN + " del foglio tariffe: rigenerazione annullata.");
    return;
  }

  sheetPasti.clearContents();

  try {

  var dataInizioTabella = new Date(dataInizioCUN);
  dataInizioTabella.setDate(dataInizioTabella.getDate() - 8);
  var dataFineTabella = new Date(dataFineCUN);
  dataFineTabella.setDate(dataFineTabella.getDate() + 1);

  sheetPasti.getRange("A1:E1").setValues([["Data", "Colazione", "Pranzo", "Cena", "Dormire"]])
            .setBackground(CONFIG.COLORI.INTESTAZIONE_VERDE).setFontWeight("bold");

  var dati = sheetIscrizioni.getDataRange().getValues();
  var headerMap = buildHeaderIndex(sheetIscrizioni);

  var idxArrivo = getCol(CONFIG.COLONNE.DATA_ARRIVO, headerMap);
  var idxPastoArrivo = getCol(CONFIG.COLONNE.PASTO_ARRIVO, headerMap);
  var idxPartenza = getCol(CONFIG.COLONNE.DATA_PARTENZA, headerMap);
  var idxPastoPartenza = getCol(CONFIG.COLONNE.PASTO_PARTENZA, headerMap);
  var idxSoloPranzo = getCol(CONFIG.COLONNE.SOLO_PRANZO_CUN, headerMap);
  var idxLunedi = getCol(CONFIG.COLONNE.PARLIAMO_LUNEDI, headerMap);
  var idxNome = getCol(CONFIG.COLONNE.NOME, headerMap);
  var idxCognome = getCol(CONFIG.COLONNE.COGNOME, headerMap);

  var mappaConteggi = {};
  var soloPranzoCounter = 0;
  var extraDorUltimoGiorno = 0;
  var pastiLunedi = [0,0,0];
  var elencoLunedi = [];

  for (var i = 1; i < dati.length; i++) {
    var riga = dati[i];

    var arrivo = new Date(riga[idxArrivo]);
    var pastoArrivo = norm(riga[idxPastoArrivo]);
    var partenza = new Date(riga[idxPartenza]);
    var pastoPartenza = norm(riga[idxPastoPartenza]);

    arrivo.setHours(0, 0, 0, 0);
    partenza.setHours(0, 0, 0, 0);

    var giorno = new Date(arrivo);

    var soloPranzo = norm(riga[idxSoloPranzo]);
    if (soloPranzo === "si" || soloPranzo === "sì") soloPranzoCounter++;

    var rispostaLunedi = norm(riga[idxLunedi]);
    if (rispostaLunedi !== "") {
      elencoLunedi.push([riga[idxCognome], riga[idxNome]]);
    }

    // Conteggio "me ne vado dopo lunedì" → dor aggiuntivo all'ultimo giorno
    if (rispostaLunedi === CONFIG.LUNEDI.ME_NE_VADO_DOPO_LUNEDI_VARIANTE_1 || rispostaLunedi === CONFIG.LUNEDI.ME_NE_VADO_DOPO_LUNEDI_VARIANTE_2) {
      extraDorUltimoGiorno++;
    }

    while (giorno <= partenza) {
      var keyData = giorno.toISOString().slice(0, 10);
      ["colazione", "pranzo", "cena", "dor"].forEach(function(tipo) {
        var key = keyData + "|" + tipo;
        if (!mappaConteggi[key]) mappaConteggi[key] = 0;
      });

      // Pasti
      if (giorno.getTime() === arrivo.getTime()) {
        if (pastoArrivo === "cena") mappaConteggi[keyData + "|cena"]++;
        else if (pastoArrivo === "pranzo") {
          mappaConteggi[keyData + "|pranzo"]++;
          mappaConteggi[keyData + "|cena"]++;
        } else if (pastoArrivo === "colazione") {
          mappaConteggi[keyData + "|colazione"]++;
          mappaConteggi[keyData + "|pranzo"]++;
          mappaConteggi[keyData + "|cena"]++;
        }
      } else if (giorno.getTime() === partenza.getTime() && giorno.getTime() === dataFineCUN.getTime() && pastoPartenza === "cena") {
          mappaConteggi[keyData + "|colazione"]++;
          mappaConteggi[keyData + "|pranzo"]++;
          mappaConteggi[keyData + "|cena"]++;
          if (rispostaLunedi === "colazione") pastiLunedi[0]++;
          else if (rispostaLunedi === "pranzo") {
            pastiLunedi[0]++; 
            pastiLunedi[1]++;
          } else if (rispostaLunedi === "cena") {
            pastiLunedi[0]++; 
            pastiLunedi[1]++;
            pastiLunedi[2]++;
          }
      } else if (giorno.getTime() === partenza.getTime()) {
          if (pastoPartenza === "colazione") mappaConteggi[keyData + "|colazione"]++;
          else if (pastoPartenza === "pranzo") {
            mappaConteggi[keyData + "|colazione"]++;
            mappaConteggi[keyData + "|pranzo"]++;
        } else if (pastoPartenza === "cena") {
            mappaConteggi[keyData + "|colazione"]++;
            mappaConteggi[keyData + "|pranzo"]++;
            mappaConteggi[keyData + "|cena"]++;
        }
      } else {
          mappaConteggi[keyData + "|colazione"]++;
          mappaConteggi[keyData + "|pranzo"]++;
          mappaConteggi[keyData + "|cena"]++;
      }

      // Dorme?
      var dorme = false;
      if (giorno < partenza) dorme = true;
      else if (
        giorno.getTime() === partenza.getTime() &&
        partenza.getTime() === dataFineCUN.getTime() &&
        pastoPartenza === "cena" && rispostaLunedi !== ""
      ) {
        dorme = true;
      }


      if (dorme) mappaConteggi[keyData + "|dor"]++;

      giorno.setDate(giorno.getDate() + 1);
    }
  }

  // Scrittura tabella pasti
  var rigaOutput = 2;
  var giornoCorrente = new Date(dataInizioTabella);
  var ultimaData = dataFineTabella.toISOString().slice(0, 10);

  while (giornoCorrente <= dataFineTabella) {
    var keyData = giornoCorrente.toISOString().slice(0, 10);
    var col = mappaConteggi[keyData + "|colazione"] || 0;
    var pra = mappaConteggi[keyData + "|pranzo"] || 0;
    var cen = mappaConteggi[keyData + "|cena"] || 0;
    var dor = mappaConteggi[keyData + "|dor"] || 0;

    if (keyData === ultimaData) {
      col += extraDorUltimoGiorno + pastiLunedi[0];
      pra += extraDorUltimoGiorno + pastiLunedi[1];
      cen += extraDorUltimoGiorno + pastiLunedi[2];
      dor += extraDorUltimoGiorno;
    }

    sheetPasti.getRange(rigaOutput, 1, 1, 5).setValues([
      [Utilities.formatDate(giornoCorrente, Session.getScriptTimeZone(), "dd/MM/yyyy"), col, pra, cen, dor]
    ]);

    giornoCorrente.setDate(giornoCorrente.getDate() + 1);
    rigaOutput++;
  }

  // Tabella solo pranzo CUN
  sheetPasti.getRange("G1:H1").setValues([["Solo Pranzo CUN", "Totale"]])
            .setBackground(CONFIG.COLORI.INTESTAZIONE_VERDE).setFontWeight("bold");
  sheetPasti.getRange("G2:H2").setValues([["Iscrizioni", soloPranzoCounter]]);

  // Elenco nomi cognomi sotto la tabella pasti
  var baseRiga = rigaOutput + 2;
  sheetPasti.getRange(baseRiga, 1).setValue("Chi c'è lunedì")
            .setFontWeight("bold").setBackground(CONFIG.COLORI.INTESTAZIONE_VERDE);
// Ordina prima per cognome, poi per nome
  elencoLunedi.sort(function(a, b) {
    var cognA = norm(a[0]);  // <-- ora la colonna 0 è il cognome
    var cognB = norm(b[0]);
    if (cognA < cognB) return -1;
    if (cognA > cognB) return 1;
    var nomeA = norm(a[1]);  // <-- colonna 1 è il nome
    var nomeB = norm(b[1]);
    return nomeA.localeCompare(nomeB);

  });

  for (var i = 0; i < elencoLunedi.length; i++) {
    sheetPasti.getRange(baseRiga + i + 1, 1, 1, 2).setValues([elencoLunedi[i]]);
  }

  // Auto-resize
  for (var c = 1; c <= 8; c++) {
    sheetPasti.autoResizeColumn(c);
  }
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Rigenerazione della tabella pasti (\"" + CONFIG.SHEETS.TABELLA_PASTI + "\") fallita.", e);
  }
}

/************** STATO ISCRIZIONE CONSOLIDATO (Iterazione 3, 2026-07-20) **************/
/**
 * Scrive nel foglio Iscrizioni un'unica colonna leggibile "Stato Iscrizione",
 * combinando "Mail di conferma inviata" + "Stato nuovo invio" (foglio
 * Iscrizioni) e "Pagato" (foglio Pagamento, se già sincronizzato). Non
 * sostituisce le colonne granulari esistenti (restano per dettaglio/debug):
 * è pensata come punto unico di lettura per un operatore.
 *
 * Va eseguita DOPO creaFoglioPagamento(), così il match Nome+Cognome trova
 * lo stato "Pagato" già aggiornato. Chiamata da rigeneraViewsSeNecessario()
 * (regen.gs) nel batch periodico, oltre che manualmente dal menu.
 */
function aggiornaStatoIscrizione() {
  var FN = "aggiornaStatoIscrizione";
  var ss = getSpreadsheet_();
  var sh = getIscrizioniSheet_(FN);
  var shPagamento = ss.getSheetByName(CONFIG.SHEETS.PAGAMENTO);

  if (!sh) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Foglio iscrizioni non trovato (CONFIG.SHEETS.ISCRIZIONI).");
    return;
  }
  if (sh.getLastRow() <= 1) {
    logEvent(CONFIG.LOG.LIVELLI.INFO, FN, "Nessuna riga di iscrizione per cui calcolare lo stato.");
    return;
  }

  try {
    var headerMap = buildHeaderIndex(sh);
    var cNome = getCol(CONFIG.COLONNE.NOME, headerMap);
    var cCognome = getCol(CONFIG.COLONNE.COGNOME, headerMap);
    var idxMailConferma = ensureColumn(sh, headerMap, CONFIG.COLONNE.MAIL_CONFERMA_INVIATA);
    var idxStatoNuovoInvio = ensureColumn(sh, headerMap, CONFIG.COLONNE.STATO_NUOVO_INVIO);
    var idxStatoIscrizione = ensureColumn(sh, headerMap, CONFIG.COLONNE.STATO_ISCRIZIONE);

    // Mappa "cognome|nome" normalizzati -> pagato sì/no, letta dal foglio Pagamento
    var pagatiMap = {};
    if (shPagamento && shPagamento.getLastRow() > 1) {
      var headerPagamento = buildHeaderIndex(shPagamento);
      var cCognomePag = getCol(CONFIG.COLONNE.COGNOME, headerPagamento);
      var cNomePag = getCol(CONFIG.COLONNE.NOME, headerPagamento);
      var cPagato = getCol(CONFIG.COLONNE.PAGATO, headerPagamento);

      if (cCognomePag >= 0 && cNomePag >= 0 && cPagato >= 0) {
        var datiPagamento = shPagamento.getRange(2, 1, shPagamento.getLastRow() - 1, shPagamento.getLastColumn()).getValues();
        datiPagamento.forEach(function(riga) {
          var chiave = norm(riga[cCognomePag]) + "|" + norm(riga[cNomePag]);
          var valorePagato = String(riga[cPagato] || "").trim().toLowerCase();
          pagatiMap[chiave] = (valorePagato === CONFIG.STATI.PAGATO_X);
        });
      } else {
        logEvent(CONFIG.LOG.LIVELLI.WARNING, FN, "Colonne Cognome/Nome/Pagato non trovate nel foglio Pagamento: stato \"Pagato\" non incluso in questo giro.");
      }
    }

    var numRows = sh.getLastRow() - 1;
    var dati = sh.getRange(2, 1, numRows, sh.getLastColumn()).getValues();
    var output = [];

    for (var i = 0; i < dati.length; i++) {
      var riga = dati[i];
      var chiave = norm(riga[cCognome]) + "|" + norm(riga[cNome]);
      var pagato = pagatiMap[chiave] === true;
      var mailConferma = String(riga[idxMailConferma] || "").trim();
      var statoNuovoInvio = String(riga[idxStatoNuovoInvio] || "").trim();

      var label;
      if (pagato) {
        label = "Pagata";
      } else if (statoNuovoInvio === CONFIG.STATI.BLOCCATO_GIA_INVIATA) {
        label = "Mail con prezzo già inviata (reinvio bloccato)";
      } else if (mailConferma === CONFIG.STATI.MAIL_INVIATA_CON_PREZZO || mailConferma === CONFIG.STATI.MAIL_PRIMA_SENZA_ORA_CON) {
        label = "Mail inviata con prezzo, in attesa di pagamento";
      } else if (mailConferma === CONFIG.STATI.MAIL_INVIATA_SENZA_PREZZO) {
        label = "Mail inviata, prezzo non ancora disponibile";
      } else if (mailConferma === "") {
        label = "Nuova iscrizione, in elaborazione";
      } else {
        // Valore non riconosciuto (es. stato legacy "inviata"): riportato as-is invece di nasconderlo.
        label = mailConferma;
      }

      output.push([label]);
    }

    sh.getRange(2, idxStatoIscrizione + 1, output.length, 1).setValues(output);
  } catch (e) {
    logEvent(CONFIG.LOG.LIVELLI.ERROR, FN, "Aggiornamento della colonna \"Stato Iscrizione\" fallito.", e);
  }
}
