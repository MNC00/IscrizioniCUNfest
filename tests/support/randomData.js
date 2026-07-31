'use strict';
/**
 * tests/support/randomData.js
 * -----------------------------------------------------------------------
 * Generatori di dati casuali "seedabili" (PRNG deterministico) per i test
 * property-based: a parità di seed, gli stessi identici casi vengono
 * rigenerati, così un test fallito è sempre riproducibile.
 */

/** PRNG deterministico (mulberry32). @param {number} seed */
function creaRandom(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @return {number} intero casuale in [min, max] inclusi. */
function interoTra(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** @return {*} un elemento casuale dell'array. */
function elementoCasuale(rand, lista) {
  return lista[interoTra(rand, 0, lista.length - 1)];
}

/** @return {Date} data casuale entro +/- giorniRange giorni da dataBase. */
function dataCasualeAttorno(rand, dataBase, giorniRange) {
  const offset = interoTra(rand, -giorniRange, giorniRange);
  const d = new Date(dataBase);
  d.setDate(d.getDate() + offset);
  return d;
}

module.exports = { creaRandom, interoTra, elementoCasuale, dataCasualeAttorno };
