'use strict';

async function exportExcelWorkbook(database, period) {
  const model = createExcelModel(database, period, Engine);
  const book = new ExcelJS.Workbook();
  book.creator = 'GreenLedger · Duyên Hải 1';
  book.created = new Date();
  book.calcProperties.fullCalcOnLoad = true;
  for (const spec of model.sheets) {
    const views = spec.name === 'Hoat dong' ? [{ state: 'frozen', ySplit: 6, xSplit: 2, showGridLines: false }]
      : spec.name === 'He so' ? [{ state: 'frozen', xSplit: 2, showGridLines: false }]
      : spec.name === 'Phu luc nguon' ? [{ state: 'frozen', ySplit: 5, showGridLines: false }]
      : spec.name === 'Ra soat DKBDB' ? [{ state: 'frozen', ySplit: 8, showGridLines: false }]
      : [{ showGridLines: false }];
    const report = spec.name === 'Mau 06';
    const fitWidth = report || ['Tong hop', 'Phu luc nguon', 'Ra soat DKBDB', 'Doi chieu TT38'].includes(spec.name);
    const sheet = book.addWorksheet(spec.name, {
      views,
      pageSetup: { paperSize: 9, orientation: report ? 'portrait' : 'landscape', fitToPage: true, fitToWidth: fitWidth ? 1 : 0, fitToHeight: 0 },
    });
    sheet.columns = spec.widths.map(width => ({ width }));
    for (const item of spec.cells) {
      const cell = sheet.getCell(item.address);
      cell.value = item.formula ? { formula: item.formula, result: item.value } : (item.value === '' ? null : item.value);
      cell.font = { name: 'Arial', size: 11, color: { argb: 'FF203D35' } };
      cell.alignment = { vertical: 'middle' };
      if (item.numberFormat) cell.numFmt = item.numberFormat;
      else if (typeof item.value === 'number') cell.numFmt = model.format;
      if (typeof item.value === 'number' && !item.formula && ['Hoat dong', 'He so'].includes(spec.name)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3D6' } };
      }
    }
    for (const range of spec.merges) sheet.mergeCells(range);
    for (const number of spec.headers) {
      sheet.getRow(number).height = 46;
      sheet.getRow(number).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4D3E' } };
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });
    }
    for (const number of spec.sections) {
      sheet.getRow(number).height = 28;
      sheet.getCell('A' + number).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1B4D3E' } };
      sheet.getCell('A' + number).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF1E7' } };
      for (const offset of [21, 23]) {
        sheet.getRow(number + offset).height = 48;
        sheet.getCell('B' + (number + offset)).alignment = { vertical: 'top', wrapText: true };
      }
    }
    sheet.getRow(2).height = 30;
    sheet.getCell('A2').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1B4D3E' } };
    if (spec.name === 'Tong hop') {
      sheet.properties.tabColor = { argb: 'FF1B4D3E' };
      for (const n of [18, 20, 21, 22]) {
        sheet.getRow(n).height = 27;
        sheet.getRow(n).eachCell(cell => { cell.font = { name: 'Arial', size: 11, bold: true }; });
      }
      for (let r = 25; r <= sheet.rowCount; r++) {
        sheet.getRow(r).height = 34;
        sheet.getCell('A' + r).alignment = { vertical: 'top', wrapText: true };
      }
    }
    if (spec.name === 'Hoat dong') {
      sheet.autoFilter = { from: 'A6', to: 'AC' + Math.max(6, period.rows.length + 6) };
      for (let r = 7; r <= period.rows.length + 6; r++) sheet.getCell('D' + r).dataValidation = { type: 'list', allowBlank: false, formulae: ['"annual,monthly"'] };
    }
    if (spec.name === 'He so') {
      sheet.getCell('B4').dataValidation = { type: 'whole', operator: 'between', formulae: [1, 3] };
      sheet.getCell('B5').dataValidation = { type: 'whole', operator: 'between', formulae: [0, 1] };
      for (let r = 16; r <= sheet.rowCount; r++) {
        if (spec.headers.includes(r)) continue;
        sheet.getRow(r).height = 34;
        sheet.getCell('B' + r).alignment = { vertical: 'middle', wrapText: true };
      }
    }
    for (const [address, height] of spec.wrapped || []) {
      const cell = sheet.getCell(address);
      sheet.getRow(cell.row).height = height;
      cell.alignment = { vertical: 'middle', wrapText: true };
    }
  }
  const buffer = await book.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action="xlsx"]');
  if (!button || button.disabled) return;
  button.disabled = true;
  try {
    const blob = await exportExcelWorkbook(db, p());
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Kiem-ke-KNK-' + p().year + '.xlsx';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Đã tạo báo cáo Excel');
  } catch (error) {
    toast('Chưa xuất được Excel: ' + error.message);
  } finally { button.disabled = false; }
});
