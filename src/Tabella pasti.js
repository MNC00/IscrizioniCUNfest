function generaTabellaPasti() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetIscrizioni = ss.getSheetByName("Iscrizioni CUN Fest");
  var sheetInfo = ss.getSheets()[1]; // Secondo foglio
  var sheetPasti = ss.getSheetByName("Tabella Pasti") || ss.insertSheet("Tabella Pasti");
  sheetPasti.clearContents();

  // Date inizio/fine dal secondo foglio (celle D1 e D2)
  var dataInizioCUN = new Date(sheetInfo.getRange("D1").getValue());
  var dataFineCUN = new Date(sheetInfo.getRange("D2").getValue());

  var dataInizioTabella = new Date(dataInizioCUN);
  dataInizioTabella.setDate(dataInizioTabella.getDate() - 8);
  var dataFineTabella = new Date(dataFineCUN);
  dataFineTabella.setDate(dataFineTabella.getDate() + 1);

  sheetPasti.getRange("A1:E1").setValues([["Data", "Colazione", "Pranzo", "Cena", "Dormire"]])
            .setBackground("#d9ead3").setFontWeight("bold");

  var dati = sheetIscrizioni.getDataRange().getValues();
  var headerMap = buildHeaderIndex(sheetIscrizioni);

  var idxArrivo = getCol(["data di arrivo"], headerMap);
  var idxPastoArrivo = getCol(["pasto di arrivo"], headerMap);
  var idxPartenza = getCol(["data di partenza"], headerMap);
  var idxPastoPartenza = getCol(["pasto di partenza"], headerMap);
  var idxSoloPranzo = getCol(["partecipi solo al pranzo del cun?"], headerMap);
  var idxLunedi = getCol(["parliamo solo di lunedi", "parliamo solo di lunedì"], headerMap);
  var idxNome = getCol(["nome"], headerMap);
  var idxCognome = getCol(["cognome"], headerMap);

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
    if (rispostaLunedi === "me ne vado dopo lunedi" || rispostaLunedi === "me ne vado dopo lunedì") {
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
            .setBackground("#d9ead3").setFontWeight("bold");
  sheetPasti.getRange("G2:H2").setValues([["Iscrizioni", soloPranzoCounter]]);

  // Elenco nomi cognomi sotto la tabella pasti
  var baseRiga = rigaOutput + 2;
  sheetPasti.getRange(baseRiga, 1).setValue("Chi c'è lunedì")
            .setFontWeight("bold").setBackground("#d9ead3");
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

