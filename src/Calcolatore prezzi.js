/************** FUNZIONI DI SUPPORTO **************/

function readConfigMap(sheet){
  var vals = sheet.getDataRange().getValues();
  var m = {};
  for (var r=0; r<vals.length; r++){
    var k = norm(vals[r][0]); // colonna A: chiave
    var v = vals[r][1];       // colonna B: valore
    if (k) m[k] = v;
  }
  return m;
}

function toDateSafe(v){
  // già Date?
  if (v instanceof Date && !isNaN(v)) return v;
  // numero seriale (Excel/Sheets) -> Date
  if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400 * 1000)); 
  // stringa ISO o locale
  if (typeof v === 'string'){
    // tenta dd/mm/yyyy
    var m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m){
      var d = parseInt(m[1],10), M = parseInt(m[2],10)-1, Y = parseInt(m[3],10);
      var dt = new Date(Y,M,d);
      if (!isNaN(dt)) return dt;
    }
    var dt2 = new Date(v);
    if (!isNaN(dt2)) return dt2;
  }
  return null; // non interpretabile
}

function trovaDateCUN(sheet) {
  var range = sheet.getDataRange().getValues();

  var dataInizio = null;
  var dataFine = null;

  for (var i = 0; i < range.length; i++) {
    for (var j = 0; j < range[i].length; j++) {
      var cella = (range[i][j] + "").toLowerCase().trim();

      if (cella === "data inizio cun") {
        dataInizio = new Date(range[i][j + 1]);
      }

      if (cella === "data fine cun") {
        dataFine = new Date(range[i][j + 1]);
      }
    }
  }

  if (!dataInizio || !dataFine || isNaN(dataInizio) || isNaN(dataFine)) {
    throw new Error("⚠️ Non sono riuscito a trovare correttamente le date nel foglio tariffe.");
  }

  return { dataInizio, dataFine };
}


/************** CALCOLATORE PREZZI **************/
function AutoCalcolatorePrezzi_tuamadre() {
  
  // Apri il foglio di calcolo associato al modulo Google.
  var foglioCalcolo = SpreadsheetApp.getActiveSpreadsheet();
  var foglio = foglioCalcolo.getSheets()[0]; // Modifica l'indice se necessario.
  var foglio2 = foglioCalcolo.getSheets()[1];

  // Ottieni i dati dal foglio di calcolo.
  var dati = foglio.getDataRange().getValues();
  var tariffe = foglio2.getDataRange().getValues();
  // Leggi la tabella di configurazione dal secondo foglio
  var cfg = readConfigMap(foglio2);

  var eta_giovane = tariffe [1][4]
  
  var tariffa_giorno_completo = tariffe[1][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_notte = tariffe[2][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_colazione = tariffe[3][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_pasto_principale = tariffe[4][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var solo_pranzo_CUN = tariffe[5][1]; // questa va definita nel momento in cui si sapranno i prezzi

  var tariffa_giorno_completo_uninord = tariffe[8][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_notte_uninord = tariffe[9][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_colazione_uninord = tariffe[10][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_pasto_principale_uninord = tariffe[11][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var solo_pranzo_CUN_uninord = tariffe[12][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tetto_massimo_uninord = tariffe[13][1]; // questa va definita nel momento in cui si sapranno i prezzi

  var tariffa_giorno_completo_unisud = tariffe[16][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_notte_unisud = tariffe[17][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_colazione_unisud = tariffe[18][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tariffa_pasto_principale_unisud = tariffe[19][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var solo_pranzo_CUN_unisud = tariffe[20][1]; // questa va definita nel momento in cui si sapranno i prezzi
  var tetto_massimo_unisud = tariffe[21][1]; // questa va definita nel momento in cui si sapranno i prezzi
  
  var sconti_05 = tariffe[24][1];
  var sconti_68 = tariffe[25][1];
  var sconti_911 = tariffe[26][1];
  var sconti_1214 = tariffe[27][1];

  var dateCUN = trovaDateCUN(foglio2);
  var data_inizio_cun = dateCUN.dataInizio;
  var limiteDataFine = dateCUN.dataFine;
  var limiteMeno7Giorni = new Date(limiteDataFine);
  limiteMeno7Giorni.setDate(limiteMeno7Giorni.getDate() - 7);


  if (!data_inizio_cun || !limiteDataFine) {
    throw new Error("⚠️ Le date 'data_inizio_cun' o 'limite_data_fine' non sono valide o mancanti nel foglio tariffe.");
  }

console.log('DATA CUN lette da config:', data_inizio_cun, limiteDataFine);


  console.log('DATA CUN lette da config:', data_inizio_cun, limiteDataFine);


  console.log('DATA CUN', data_inizio_cun);

  console.log('Tariffe: ', tariffa_giorno_completo, tariffa_notte, tariffa_colazione, tariffa_pasto_principale, solo_pranzo_CUN, eta_giovane);

  // Controlla se le tariffe sono diverse da null
  if (
    !tariffa_giorno_completo ||
    !tariffa_notte ||
    !tariffa_colazione ||
    !tariffa_pasto_principale ||
    !solo_pranzo_CUN
  ) {
    //console.log('Almeno una delle tariffe è null. Uscita dalla funzione.');
    return;
  }

  var headerMap = buildHeaderIndex(foglio);
  var idxDataNascita = getCol(['data di nascita'], headerMap);
  var idxDataArrivo = getCol(['data di arrivo'], headerMap);
  var idxPastoArrivo = getCol(['pasto di arrivo'], headerMap);
  var idxDataPartenza = getCol(['data di partenza'], headerMap);
  var idxPastoPartenza = getCol(['pasto di partenza'], headerMap);
  var idxSoloPranzoCun = getCol(['partecipi solo al pranzo del cun?'], headerMap);
  var idxPrezzo = getCol(['prezzo','prezzo finale'],headerMap);


  console.log('tumadre')

  for (var riga = 1; riga < dati.length; riga++) {

    console.log('tumadre');

    var dataInizio = new Date(dati[riga][idxDataArrivo]);
    var dataFine = new Date(dati[riga][idxDataPartenza]);
    var data_nascita = new Date(dati[riga][idxDataNascita]);
    var oggi = new Date();

    if (dataFine > limiteDataFine) {
      dataFine = limiteDataFine;
      var pippo = true;
    }

    console.log('Data di fine:', dataFine, 'Valore della cella alla riga', riga, 'colonna nome:', dati[riga][1]);

    var dataInizioSenzaOra = new Date(dataInizio.getFullYear(), dataInizio.getMonth(), dataInizio.getDate());
    var dataFineSenzaOra = new Date(dataFine.getFullYear(), dataFine.getMonth(), dataFine.getDate());
    var dataNascitaSenzaOra = new Date(data_nascita.getFullYear(), data_nascita.getMonth(), data_nascita.getDate());
    var oggiSenzaOra = new Date(2025, oggi.getMonth(), oggi.getDate());

    console.log('Data di fine:', dataFineSenzaOra, 'Valore della cella alla riga', riga, 'colonna nome:', dati[riga][1]);

    var numero_notti = Math.round((dataFineSenzaOra - dataInizioSenzaOra) / (1000 * 60 * 60 * 24));
    var eta = Math.round((oggiSenzaOra - dataNascitaSenzaOra) / (1000 * 60 * 60 * 24 * 365.25));

    if (dati[riga][idxSoloPranzoCun] !== 'Si') {

      var pasto_inizio;
      var pastoArrivo = dati[riga][idxPastoArrivo];
      if (pastoArrivo === 'Colazione') {
        pasto_inizio = 3;
      } else if (pastoArrivo === 'Pranzo') {
        pasto_inizio = 2;
      } else if (pastoArrivo === 'Cena') {
        pasto_inizio = 1;
      } else if (pastoArrivo === 'Dopo cena') {
        pasto_inizio = 0;
      }

      var pasto_partenza;
      var pastoPartenza = dati[riga][idxPastoPartenza];
      if (pippo) {
        pasto_partenza = 1;
      } else if (pastoPartenza === 'Colazione') {
        pasto_partenza = 2;
      } else if (pastoPartenza === 'Pranzo') {
        pasto_partenza = 1;
      } else if (pastoPartenza === 'Cena') {
        pasto_partenza = 0;
      } else if (pastoPartenza === 'Prima di colazione') {
        pasto_partenza = 3;
      }
    
  


      if (dataFine.getTime() === limiteDataFine.getTime() && pasto_partenza < 1) {
        pasto_partenza = 1;
      }

      console.log('pasto di partenza', dati[riga][15] + pasto_partenza);

      //Calcolo numero pasti totali
      var numero_pasti = 3 * numero_notti + (pasto_inizio - pasto_partenza);
      //console.log('Numero Pasti', numero_pasti);

      //Calcolo giorni completi
      var giorni_completi = Math.floor(numero_pasti / 3);
      //console.log('Giorni completi', giorni_completi);

      //Calcolo notti in più
      var notti_eccesso = numero_notti - giorni_completi;
      //console.log('Notti in eccesso', notti_eccesso);

      //Calcolo pasti in più
      var pasti_eccesso = numero_pasti % 3; // numero_pasti - giorni_completi  <---- da discutere
      //console.log('pasti in eccesso', pasti_eccesso);

      var x = Math.abs(pasto_partenza - pasto_inizio);
      var prezzo_finale;
      var y, z;

      if ((eta > eta_giovane) && dataInizio < data_inizio_cun) {
        console.log('Entrato nella prima', dati[riga][1])
        y = tariffa_giorno_completo * giorni_completi;
        if (x !== 0 && x !== 3) {
          z = y + notti_eccesso * tariffa_notte;
          if (pasti_eccesso === 1) {
            if (pasto_partenza == 2) {
              prezzo_finale = z + tariffa_colazione;
            } else {
              prezzo_finale = y + tariffa_pasto_principale;
            }
          } else if (pasti_eccesso === 2) {
            if (pasto_partenza === 1 || pasto_inizio === 1) {
              prezzo_finale = z + tariffa_pasto_principale + tariffa_colazione;
            } else {
              prezzo_finale = z + 2 * tariffa_pasto_principale;
            }
          } else {
            prezzo_finale = y;
          }
        } else {
          prezzo_finale = y;
        }
      } else {
        if (dataInizio >= data_inizio_cun) {
          console.log('Entrato nella sezione UNINORD', dati[riga][1]);
          y = tariffa_giorno_completo_uninord * giorni_completi;
          if (x !== 0 || x !== 3) {
            z = y + notti_eccesso * tariffa_notte_uninord;
            if (pasti_eccesso === 1) {
              if (pasto_partenza == 2) {
                prezzo_finale = z + tariffa_colazione_uninord;
              } else {
                prezzo_finale = y + tariffa_pasto_principale_uninord;
              }
            } else if (pasti_eccesso === 2) {
              if (pasto_partenza === 1 || pasto_inizio === 1) {
                prezzo_finale = z + tariffa_pasto_principale_uninord + tariffa_colazione_uninord;
              } else {
                prezzo_finale = z + 2 * tariffa_pasto_principale_uninord;
              }
            } else {
              prezzo_finale = y;
            }
          } else {
            prezzo_finale = y;
          }

          if (prezzo_finale > tetto_massimo_uninord) {
            prezzo_finale = tetto_massimo_uninord;
          }
          
        } else {
          console.log('Entrato nella sezione giovani', dati[riga][1]);
          y = tariffa_giorno_completo_unisud * giorni_completi;
          if (x !== 0 || x !== 3) {
            z = y + notti_eccesso * tariffa_notte_unisud;
            if (pasti_eccesso === 1) {
              if (pasto_partenza == 2) {
                prezzo_finale = z + tariffa_colazione_unisud;
              } else {
                prezzo_finale = y + tariffa_pasto_principale_unisud;
              }
            } else if (pasti_eccesso === 2) {
              if (pasto_partenza === 1 || pasto_inizio === 1) {
                prezzo_finale = z + tariffa_pasto_principale_unisud + tariffa_colazione_unisud;
              } else {
                prezzo_finale = z + 2 * tariffa_pasto_principale_unisud;
              }
            } else {
              prezzo_finale = y;
            }

            if (dataInizio < limiteMeno7Giorni && prezzo_finale > tetto_massimo_unisud){
              prezzo_finale = tetto_massimo_unisud + 20
            } else {
              if (prezzo_finale > tetto_massimo_unisud) {
                prezzo_finale = tetto_massimo_unisud;
              }
            }

          }
        }
      }

      if (eta <= 5) {
        var sconto = prezzo_finale * (sconti_05 / 100);
        prezzo_finale = prezzo_finale - sconto;
      } else if (eta > 5 && eta <= 8) {
        var sconto = prezzo_finale * (sconti_68 / 100);
        prezzo_finale = prezzo_finale - sconto;
      } else if (eta > 8 && eta <= 11) {
        var sconto = prezzo_finale * (sconti_911 / 100);
        prezzo_finale = prezzo_finale - sconto;
      } else if (eta > 11 && eta <= 14) {
        var sconto = prezzo_finale * (sconti_1214 / 100);
        prezzo_finale = prezzo_finale - sconto;
      }

      foglio.getRange(riga + 1, idxPrezzo +1 ).setValue(Math.ceil(prezzo_finale));

    } else {
      var prezzo_finale = solo_pranzo_CUN;
      if (eta <= 5) {
        var sconto = prezzo_finale * (sconti_05 / 100);
        prezzo_finale = prezzo_finale - sconto;
      } else if (eta > 5 && eta <= 8) {
        var sconto = prezzo_finale * (sconti_68 / 100);
        prezzo_finale = prezzo_finale - sconto;
      } else if (eta > 8 && eta <= 11) {
        var sconto = prezzo_finale * (sconti_911 / 100);
        prezzo_finale = prezzo_finale - sconto;
      } else if (eta > 11 && eta <= 14) {
        var sconto = prezzo_finale * (sconti_1214 / 100);
        prezzo_finale = prezzo_finale - sconto;
      }

      foglio.getRange(riga + 1, idxPrezzo + 1).setValue(Math.ceil(prezzo_finale));

    }

  }
}
