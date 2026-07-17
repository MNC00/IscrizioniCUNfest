/**
 * SHEETS.gs
 * ---------------------------------------------------------------------------
 * Operazioni di lettura/scrittura sui fogli derivati (Iscrizioni ordinate,
 * Pagamento, Tabella Pasti). Nessuna modifica di comportamento rispetto agli
 * originali "Foglio ordinato.js", "Foglio pagamento.js" e "Tabella pasti.js":
 * solo sostituzione di nomi di foglio, celle fisse e alias colonna con
 * riferimenti a CONFIG.
 * ---------------------------------------------------------------------------
 */

/************** FOGLIO "ISCRIZIONI ORDINATE" **************/
function creaFoglioOrdinato() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRisposte = ss.getSheetByName(CONFIG.SHEETS.ISCRIZIONI); // Foglio collegato al modulo
  var sheetOrdinato = ss.getSheetByName(CONFIG.SHEETS.ORDINATE);    // Foglio da aggiornare

  // Leggi tutto il contenuto del foglio con le risposte
  var data = sheetRisposte.getDataRange().getValues();

  // Cancella tutto nel foglio ordinato (tranne il foglio stesso)
  sheetOrdinato.clearContents();

  // Copia i dati nel foglio ordinato
  sheetOrdinato.getRange(1, 1, data.length, data[0].length).setValues(data);

  // Ordina per colonna 2 (B), partendo dalla riga 2 (per mantenere l’intestazione)
  sheetOrdinato.getRange(2, 1, data.length - 1, data[0].length).sort([{ column: 2, ascending: true },{ column: 3, ascending: true }]);
// Colora l’intestazione
sheetOrdinato.getRange(1, 1, 1, data[0].length).setBackground(CONFIG.COLORI.INTESTAZIONE_VERDE).setFontWeight("bold");
sheetOrdinato.setFrozenRows(1);

// Adatta larghezza colonne al contenuto
for (var col = 1; col <= data[0].length; col++) {sheetOrdinato.autoResizeColumn(col);}
}

/************** FOGLIO "PAGAMENTO" **************/
function creaFoglioPagamento() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRisposte = ss.getSheetByName(CONFIG.SHEETS.ISCRIZIONI);
  var sheetRiepilogo = ss.getSheetByName(CONFIG.SHEETS.PAGAMENTO);

  var headerRisposte = sheetRisposte.getRange(1, 1, 1, sheetRisposte.getLastColumn()).getValues()[0];
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
  sheetRiepilogo.getRange(2, 1, numRows - 1, numCols)
                .sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);

  // Auto resize colonne (minimo 100px)
  for (var col = 1; col <= numCols; col++) {
    sheetRiepilogo.autoResizeColumn(col);
    if (sheetRiepilogo.getColumnWidth(col) < CONFIG.LARGHEZZA_COLONNA_MINIMA_PAGAMENTO) {
      sheetRiepilogo.setColumnWidth(col, CONFIG.LARGHEZZA_COLONNA_MINIMA_PAGAMENTO);
    }
  }
}

/************** TABELLA PASTI **************/
function generaTabellaPasti() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetIscrizioni = ss.getSheetByName(CONFIG.SHEETS.ISCRIZIONI);
  var sheetInfo = ss.getSheets()[CONFIG.SHEETS.INDEX_TARIFFE]; // Secondo foglio
  var sheetPasti = ss.getSheetByName(CONFIG.SHEETS.TABELLA_PASTI) || ss.insertSheet(CONFIG.SHEETS.TABELLA_PASTI);
  sheetPasti.clearContents();

  // Date inizio/fine dal secondo foglio (celle D1 e D2)
  var dataInizioCUN = new Date(sheetInfo.getRange(CONFIG.CELLE.DATA_INIZIO_CUN).getValue());
  var dataFineCUN = new Date(sheetInfo.getRange(CONFIG.CELLE.DATA_FINE_CUN).getValue());

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
}
