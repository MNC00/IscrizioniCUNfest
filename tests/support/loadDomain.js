'use strict';
/**
 * tests/support/loadDomain.js
 * -----------------------------------------------------------------------
 * Esegue i veri file sorgente di src/Domain/*.js (invariati) dentro una
 * sandbox Node (modulo `vm`), così i test girano contro il codice
 * effettivamente pushato su Apps Script, non contro una copia/riscrittura.
 *
 * Questo è possibile perché Domain/* è dichiaratamente puro: nessuna
 * dipendenza da SpreadsheetApp/MailApp/Utilities, solo Date/Math/Object
 * standard. L'ordine di caricamento rispetta le dipendenze tra file
 * (es. Pasti.js usa azzeraOra_ definita in Prezzi.js).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DOMAIN_DIR = path.join(__dirname, '..', '..', 'src', 'Domain');

const ORDINE_CARICAMENTO = ['Prezzi.js', 'Pasti.js', 'Stati.js', 'Email.js', 'Dashboard.js', 'Import.js'];

/**
 * Crea un nuovo contesto sandbox con tutte le funzioni/costanti di Domain/*
 * caricate come proprietà globali del contesto (esattamente come nello
 * scope globale condiviso di Apps Script).
 * @return {vm.Context}
 */
function creaContestoDomain() {
  const sandbox = { console, Math, Date, Object, JSON, Utilities: undefined };
  const contesto = vm.createContext(sandbox);

  ORDINE_CARICAMENTO.forEach((nomeFile) => {
    const percorso = path.join(DOMAIN_DIR, nomeFile);
    const codice = fs.readFileSync(percorso, 'utf8');
    vm.runInContext(codice, contesto, { filename: percorso });
  });

  return contesto;
}

module.exports = { creaContestoDomain, DOMAIN_DIR };
