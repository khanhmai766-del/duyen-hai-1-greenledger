import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Workbook } from '@oai/artifact-tool';
const require = createRequire(import.meta.url);
const engine = require('../dist/engine.js');
const modelBuilder = require('./excel-model.js');
const db = engine.seed();
const period = db.periods[0];
const base = period.rows[0];
const rows = [];
function add(group, factor, extra = {}) {
  rows.push({ ...structuredClone(base), id: engine.uid(), name: 'Test ' + rows.length, group, factor, amount: 1000, ...extra });
}
for (const fuel of db.fuels) add(fuel.type === 'stationary' ? 0 : 1, fuel.id);
for (const mcf of ['MCF_SEPTIC', 'MCF_AERO', 'MCF_OVER', 'MCF_ANA']) add(2, '', { mcf, ad: 0, amount: 24000 });
add(3, '', { nitrogen: 0.02, cod: 0.1, mcf: 'MCF_ANA', includeCH4: true });
add(3, '', { nitrogen: 0.02, cod: 0.1, mcf: 'MCF_AERO', includeCH4: false });
for (const gas of db.gases.filter(g => !['CO2', 'CH4_FOSSIL', 'CH4_BIO', 'N2O'].includes(g.id))) add(4, gas.id, { amount: 10 });
add(5, 'HFC_227EA', { amount: 0 });
for (const factor of ['UREA', 'LIME']) add(6, factor, { amount: 2 });
for (const grid of db.grid) add(7, grid.id, { mode: 'monthly', months: Array(12).fill(10000), ad: 0.1 });
period.rows = rows;
for (const [gwp, weighted] of [['ar6', true], ['ar6', false], ['ar4', true], ['ar5', true]]) {
  period.gwp = gwp; period.weighted = weighted;
  const model = modelBuilder(db, period, engine);
  const book = Workbook.create();
  for (const spec of model.sheets) book.worksheets.add(spec.name);
  for (const spec of model.sheets) {
    const sheet = book.worksheets.getItem(spec.name);
    for (const item of spec.cells) {
      if (item.formula) sheet.getRange(item.address).formulas = [['=' + item.formula]];
      else sheet.getRange(item.address).values = [[item.value]];
    }
  }
  book.recalculate();
  const close = (actual, expected, label) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-7 * Math.max(1, expected), label + ': ' + actual + ' != ' + expected);
  const outputs = book.worksheets.getItem('Tong hop');
  close(outputs.getRange('G18').values[0][0], model.expected.total, 'Total');
  close(outputs.getRange('H18').values[0][0], model.expected.u, 'u');
  close(outputs.getRange('G20').values[0][0], model.expected.bio, 'Biogenic CO2');
  const calc = book.worksheets.getItem('Tinh toan');
  for (const [index, row] of rows.entries()) {
    const expected = engine.calculate(row, period, db), start = 7 + index * 27;
    close(calc.getRange('B' + (start + 16)).values[0][0], expected.total, row.name + ' total');
    close(calc.getRange('B' + (start + 17)).values[0][0], expected.u, row.name + ' u');
  }
  const input = book.worksheets.getItem('Hoat dong');
  const before = outputs.getRange('G18').values[0][0];
  input.getRange('E7').values = [[2000]];
  book.recalculate();
  const difference = engine.calculate({ ...rows[0], amount: 2000 }, period, db).total - engine.calculate(rows[0], period, db).total;
  close(outputs.getRange('G18').values[0][0], before + difference, 'Changed activity recalculates');
  console.log('PASS:', rows.length, 'sources,', gwp, 'weighted=' + weighted, 'including live input change');
}
