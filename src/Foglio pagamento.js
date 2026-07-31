function creaFoglioPagamento() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRisposte = ss.getSheetByName("Iscrizioni CUN Fest");
  var sheetRiepilogo = ss.getSheetByName("Pagamento");

  var headerRisposte = sheetRisposte.getRange(1, 1, 1, sheetRisposte.getLastColumn()).getValues()[0];
  var datiRisposte = sheetRisposte.getRange(2, 1, sheetRisposte.getLastRow() - 1, headerRisposte.length).getValues();

  var campiDesiderati = [
    "Cognome",
    "Nome",
    "Data di nascita",
    "Zona di provenienza",
    "Data di arrivo",
    "Pasto di arrivo",
    "Data di partenza",
    "Pasto di partenza",
    "Prezzo"
  ];

  // Crea intestazione se non esiste
  if (sheetRiepilogo.getLastRow() === 0) {
    sheetRiepilogo.appendRow(campiDesiderati.concat("Pagato"));
    sheetRiepilogo.getRange(1, 1, 1, campiDesiderati.length + 1).setBackground("#d9ead3").setFontWeight("bold");
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
    if (sheetRiepilogo.getColumnWidth(col) < 100) {
      sheetRiepilogo.setColumnWidth(col, 100);
    }
  }
}


function coloraPagati(e) {
  var foglio = e.source.getActiveSheet();
  var rigaModificata = e.range.getRow();
  var colonnaModificata = e.range.getColumn();
  var headerMap = buildHeaderIndex(foglio);
  var idxPagamento = getCol(['pagato','Pagato','già pagato'],headerMap);

  // Verifica se la modifica è stata effettuata nella colonna Y (colonna 24) e se il valore è "invia con prezzo".
  if (colonnaModificata === idxPagamento +1) {
    
    var riga = foglio.getRange(rigaModificata,1,1,colonnaModificata);
    var val = foglio.getRange(rigaModificata, colonnaModificata).getValue();
    riga.setBackground(val === "x" ? "#cfe2fe" : "white");

  }
}