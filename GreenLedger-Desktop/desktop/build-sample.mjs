import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const require = createRequire(import.meta.url);
const engine = require('../dist/engine.js');
const modelBuilder = require('./excel-model.js');
const database = engine.seed();
const period = database.periods[0];
const model = modelBuilder(database, period, engine);
const book = Workbook.create();
const output = path.resolve('../../outputs/GreenLedger-Mau-kiem-ke.xlsx');
const work = path.resolve('../excel-qa');
await fs.mkdir(work, { recursive: true });
for (const spec of model.sheets) book.worksheets.add(spec.name);
for (const spec of model.sheets) {
  const sheet = book.worksheets.getItem(spec.name);
  sheet.showGridLines = false;
  for (const item of spec.cells) {
    const cell = sheet.getRange(item.address);
    if (item.formula) cell.formulas = [['=' + item.formula]];
    else cell.values = [[typeof item.value === 'string' && item.value.startsWith('=') ? "'" + item.value : item.value]];
    if (item.numberFormat) cell.setNumberFormat(item.numberFormat);
    else if (typeof item.value === 'number') cell.setNumberFormat(model.format);
    if (typeof item.value === 'number' && !item.formula && ['Hoat dong', 'He so'].includes(spec.name)) cell.format.fill = '#FFF3D6';
  }
  const used = sheet.getUsedRange();
  used.format.font = { name: 'Arial', size: 11, color: '#203D35' };
  used.format.rowHeight = 22;
  used.format.verticalAlignment = 'center';
  for (let c = 0; c < spec.widths.length; c++) {
    sheet.getRangeByIndexes(0, c, 1, 1).format.columnWidth = spec.widths[c];
  }
  for (const range of spec.merges) sheet.mergeCells(range);
  sheet.getRange(spec.title).format.font = { name: 'Arial', size: 16, bold: true, color: '#1B4D3E' };
  sheet.getRange(spec.title).format.rowHeight = 30;
  for (const r of spec.headers) {
    const header = sheet.getRangeByIndexes(r - 1, 0, 1, spec.name === 'He so' ? 22 : spec.widths.length);
    header.format.fill = '#1B4D3E';
    header.format.font = { color: '#FFFFFF', name: 'Arial', size: 11, bold: true };
    header.format.rowHeight = 46;
    header.format.wrapText = true;
  }
  for (const r of spec.sections) {
    sheet.getRange('A' + r + ':G' + r).format.fill = '#EAF1E7';
    sheet.getRange('A' + r).format.font = { bold: true, name: 'Arial', size: 12, color: '#1B4D3E' };
    for (const offset of [21, 23]) {
      sheet.getRange('A' + (r + offset) + ':G' + (r + offset)).format.rowHeight = 48;
      sheet.getRange('B' + (r + offset)).format.wrapText = true;
    }
  }
  if (spec.name === 'Tong hop') {
    for (let r = 25; r <= 30; r++) {
      sheet.getRange('A' + r + ':H' + r).format.wrapText = true;
      sheet.getRange('A' + r + ':H' + r).format.rowHeight = 34;
    }
    sheet.getRange('C9:H22').setNumberFormat(model.format);
    sheet.getRange('G22').setNumberFormat(model.percent);
  }
  if (spec.name === 'Hoat dong') sheet.freezePanes.freezeRows(6);
  if (spec.name === 'He so') {
    for (let r = 16; r <= 29; r++) {
      sheet.getRange('A' + r + ':V' + r).format.rowHeight = 34;
      sheet.getRange('B' + r).format.wrapText = true;
    }
  }
}
book.recalculate();
const total = book.worksheets.getItem('Tong hop').getRange('G18').values[0][0];
if (Math.abs(total - model.expected.total) > 1e-8) throw Error('Workbook and application totals differ: ' + total);
console.log((await book.inspect({ kind: 'table', range: 'Tong hop!G18:H22', include: 'values,formulas', tableMaxRows: 5, tableMaxCols: 2 })).ndjson);
console.log((await book.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!', options: { useRegex: true, maxResults: 15 } })).ndjson);
for (const [name, range] of [['Tong hop', 'A1:H29'], ['Tinh toan', 'A7:G31'], ['Hoat dong', 'A5:H8'], ['He so', 'A15:H20']]) {
  const render = await book.render({ sheetName: name, range, scale: 1.3, format: 'png' });
  await fs.writeFile(path.join(work, name + '.png'), new Uint8Array(await render.arrayBuffer()));
}
const file = await SpreadsheetFile.exportXlsx(book);
await file.save(output);
console.log(output);
