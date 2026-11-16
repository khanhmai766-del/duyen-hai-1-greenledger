'use strict';

function createExcelModel(db, period, engine) {
  engine.validate(db);
  const summary = engine.summary(period, db);
  const shared = engine.sharedInputs(summary.rows, db);
  if (summary.rows.some(row => row.error)) throw Error('Có nguồn phát thải thiếu hệ số. Hãy kiểm tra trước khi xuất.');
  const sheets = [];
  const format = '#,##0.0000';
  const percent = '0.00%';
  function sheet(name, widths) {
    const result = { name, widths, cells: [], headers: [], sections: [], merges: [] };
    sheets.push(result);
    return result;
  }
  function cell(target, address, value, formula, numberFormat) {
    target.cells.push({ address, value: value ?? '', formula, numberFormat });
    return address;
  }
  function row(target, number, values) {
    values.forEach((value, index) => cell(target, column(index + 1) + number, value));
  }
  function title(target, text, lastColumn) {
    cell(target, 'A2', text);
    target.merges.push('A2:' + lastColumn + '2');
    target.title = 'A2:' + lastColumn + '2';
  }
  function ref(name, address) { return "'" + name + "'!" + address; }
  function column(number) {
    let result = '';
    while (number) { number--; result = String.fromCharCode(65 + number % 26) + result; number = Math.floor(number / 26); }
    return result;
  }
  const totals = sheet('Tong hop', [34, 20, 19, 19, 19, 20, 22, 22]);
  const calc = sheet('Tinh toan', [30, 20, 19, 22, 18, 22, 22]);
  const activity = sheet('Hoat dong', [40, 32, 28, 15, 18, ...Array(12).fill(13), 18, 14, 16, 20, 24, 30, 18, 18, 14, 14, 20, 14, 14, 14, 17, 24, 19, 36]);
  const factors = sheet('He so', [24, 34, 18, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 14, 70, 16, 16, 16, 16]);
  const report = sheet('Mau 06', [34, 18, 16, 16, 16, 16]);
  const annex = sheet('Phu luc nguon', [30, 23, 13, 14, 15, 16, 16, 16, 16, 16, 16, 38, 52]);
  const review = sheet('Ra soat DKBDB', [23, 30, 34, 25, 17, 45]);
  const crosswalk = sheet('Doi chieu TT38', [19, 32, 48, 54, 42]);
  const facility = sheet('Bao cao co so', [38, 25, 20, 20, 20, 22]);
  const quality = sheet('Do tin cay', [35, 25, 15, 15, 15, 12, 18, 18, 18, 25, 38, 22, 16]);
  facility.wrapped = [];
  quality.wrapped = [];
  const components = sheet('Thanh phan u', [34, 15, 28, 16, 21, 4, 16, 21, 15, 16, 21, 21]);
  const correlation = period.correlateShared ? 'Tương quan +1 cho các đầu vào được ghép theo mã.' : 'Các nguồn được tổng hợp độc lập.';
  const methodNote = 'Cộng ảnh hưởng của một đầu vào lên nhiều khí trong cùng nguồn. ' + correlation;
  title(components, 'Thành phần độ không đảm bảo chuẩn (tCO₂e)', 'L');
  row(components, 4, ['Nguồn', 'Nhóm', 'Thành phần', 'Mã ghép', 'u đóng góp', null, 'Mã ghép', 'u toàn cơ sở', 'Nhóm', 'Mã ghép', 'u theo nhóm', 'Bình phương']);
  components.headers.push(4);
  const termKeys = new Map(), groupKeys = new Map();
  const termLabels = { ad: 'Số liệu hoạt động', n: 'Nồng độ N', cod: 'COD', effluent: 'u hệ số N₂O đầu xả', other: 'Hệ số / thông số',
    gwp: 'GWP', blend: 'GWP thành phần', grid: 'EF điện', ncv: 'Nhiệt trị NCV',
    co2: 'EF CO₂', ch4: 'EF CH₄', n2o: 'EF N₂O' };
  let termLine = 5;
  report.wrapped = [];
  annex.wrapped = [];
  review.wrapped = [];
  crosswalk.wrapped = [];
  title(factors, 'Hệ số và phương pháp áp dụng', 'H');
  row(factors, 4, ['Bộ GWP (1=AR4, 2=AR5, 3=AR6)', ['ar4', 'ar5', 'ar6'].indexOf(period.gwp) + 1]);
  row(factors, 5, ['u hỗn hợp (1=có trọng số, 0=không)', period.weighted ? 1 : 0]);
  row(factors, 6, ['Hệ số phủ (95% xấp xỉ)', summary.k]);
  row(factors, 7, ['kg / tấn', 1000]);
  row(factors, 8, ['kg / Gg', 1000000]);
  row(factors, 9, ['Giờ / ngày', 24]);
  row(factors, 10, ['CO₂ / C', 44 / 12]);
  row(factors, 11, ['N₂O / N₂', 44 / 28]);
  const fr = {}, gr = {}, other = {}, grid = {};
  let cursor = 15;
  factors.headers.push(cursor);
  row(factors, cursor++, ['Mã nhiên liệu', 'Tên', 'KLR kg/ĐVT', 'ĐVT', 'NCV TJ/Gg', 'NCV thấp', 'NCV cao', 'EF CO₂ kg/TJ', 'EF CO₂ thấp', 'EF CO₂ cao', 'EF CH₄ kg/TJ', 'EF CH₄ thấp', 'EF CH₄ cao', 'EF N₂O kg/TJ', 'EF N₂O thấp', 'EF N₂O cao', 'Sinh khối 1/0', 'Nguồn', 'u NCV', 'u EF CO₂', 'u EF CH₄', 'u EF N₂O']);
  for (const fuel of db.fuels) {
    const r = cursor++;
    fr[fuel.id] = r;
    row(factors, r, [fuel.id, fuel.name, fuel.density, fuel.unit, ...fuel.ncv, ...fuel.co2, ...fuel.ch4, ...fuel.n2o, fuel.bio ? 1 : 0, fuel.source]);
    [['S', 'E', fuel.ncv], ['T', 'H', fuel.co2], ['U', 'K', fuel.ch4], ['V', 'N', fuel.n2o]].forEach(([col, start, values]) => {
      const idx = start.charCodeAt(0) - 64;
      cell(factors, col + r, values[0] ? Math.max(values[0] - values[1], values[2] - values[0]) / 2 / values[0] : 0,
        `IF(${start}${r}=0,0,MAX(${start}${r}-${column(idx + 1)}${r},${column(idx + 2)}${r}-${start}${r})/2/${start}${r})`, percent);
    });
  }
  cursor += 3;
  factors.headers.push(cursor);
  row(factors, cursor++, ['Mã khí', 'Tên', 'AR4', 'AR5', 'AR6', 'u GWP AR6', 'GWP áp dụng', 'u GWP áp dụng', 'u/GWP áp dụng', 'u/GWP AR6', 'Nguồn']);
  for (const gas of db.gases) gr[gas.id] = cursor++;
  const mixtureRows = {};
  let mixStart = cursor + 3;
  for (const gas of db.gases) {
    mixtureRows[gas.id] = gas.mix.map(([id, weight]) => ({ row: mixStart++, id, weight }));
  }
  if (mixStart > cursor + 3) {
    factors.headers.push(cursor + 2);
    row(factors, cursor + 2, ['Hỗn hợp', 'Thành phần', 'Tỷ lệ khối lượng']);
    for (const gas of db.gases) for (const part of mixtureRows[gas.id]) row(factors, part.row, [gas.id, part.id, part.weight]);
  }
  for (const gas of db.gases) {
    const r = gr[gas.id];
    row(factors, r, [gas.id, gas.name, gas.ar4, gas.ar5, gas.ar6, gas.u]);
    let gwp = gas[period.gwp], uncertainty = gas.u;
    let gwpFormula = `CHOOSE($B$4,C${r},D${r},E${r})`, uncertaintyFormula = `F${r}`;
    if (gas.mix.length) {
      const parts = mixtureRows[gas.id];
      gwp = parts.reduce((sum, part) => sum + part.weight * db.gases.find(g => g.id === part.id)[period.gwp], 0);
      uncertainty = engine.rss(parts.map(part => db.gases.find(g => g.id === part.id).u * (period.weighted ? part.weight : 1)));
      gwpFormula = parts.map(part => `C${part.row}*G${gr[part.id]}`).join('+');
      uncertaintyFormula = 'SQRT(' + parts.map(part => `(F${gr[part.id]}*IF($B$5=1,C${part.row},1))^2`).join('+') + ')';
    }
    cell(factors, 'G' + r, gwp, gwpFormula, format);
    cell(factors, 'H' + r, uncertainty, uncertaintyFormula, format);
    cell(factors, 'I' + r, gwp ? uncertainty / gwp : 0, `IF(G${r}=0,0,H${r}/G${r})`, percent);
    cell(factors, 'J' + r, gas.ar6 ? gas.u / gas.ar6 : 0, `IF(E${r}=0,0,F${r}/E${r})`, percent);
    cell(factors, 'K' + r, gas.source);
  }
  cursor = mixStart + 3;
  factors.headers.push(cursor);
  row(factors, cursor++, ['Mã hệ số', 'Tên', 'Giá trị', 'u tương đối', 'Đơn vị', 'Nguồn']);
  for (const factor of db.other) { other[factor.id] = cursor; row(factors, cursor++, [factor.id, factor.name, factor.value, factor.u / 100, factor.unit, factor.source]); }
  cursor += 3;
  factors.headers.push(cursor);
  row(factors, cursor++, ['Mã điện lưới', 'Năm', 'EF tCO₂/MWh', 'Nguồn']);
  for (const factor of db.grid) { grid[factor.id] = cursor; row(factors, cursor++, [factor.id, factor.year, factor.value, factor.source]); }
  const gridHistory = engine.gridSeries(period, db);
  const gridHistoryRefs = gridHistory.map(entry => {
    if (entry.id) return 'C' + grid[entry.id];
    row(factors, cursor, ['Tham chiếu SD', entry.year, entry.value, entry.source]);
    return 'C' + cursor++;
  });
  row(factors, 12, ['SD chuỗi EF điện', null, gridHistory.map(item => item.year).join(', ')]);
  cell(factors, 'B12', engine.sd(gridHistory.map(g => g.value)), gridHistoryRefs.length > 1 ? `STDEV(${gridHistoryRefs.join(',')})` : '0', '0.000000');
  title(activity, 'Số liệu hoạt động năm ' + period.year, 'H');
  row(activity, 4, ['Màu vàng là số liệu đầu vào. Tổng năm tự cộng 12 tháng khi chế độ là monthly.']);
  activity.merges.push('A4:L4');
  activity.headers.push(6);
  row(activity, 6, ['Mã dòng', 'Tên nguồn', 'Nhóm', 'Chế độ', 'Tổng năm nhập', ...Array.from({ length: 12 }, (_, i) => 'Tháng ' + (i + 1)), 'Tổng sử dụng', 'u AD', 'ĐVT', 'Mã hệ số', 'Thiết bị', 'Chứng từ', 'N kg/m³', 'COD kg/m³', 'u N', 'u COD', 'Mã MCF', 'Tính CH₄ 1/0', 'Số bình CO₂', 'kg CO₂/bình', 'u số người 1/0', 'Mã nhóm u AD', 'Phương pháp u AD', 'Dữ liệu tính u AD']);
  title(calc, 'Chi tiết tính phát thải và độ không đảm bảo đo', 'G');
  row(calc, 4, ['Các kết quả dùng tCO₂e. CO₂ sinh học được báo cáo riêng.']);
  calc.merges.push('A4:G4');
  const outputRefs = [];
  const f = (col, r) => ref('He so', '$' + col + '$' + r);
  const ov = id => f('C', other[id]);
  const ou = id => f('D', other[id]);
  const gw = id => f('G', gr[id]);
  const gu = id => f('J', gr[id]);
  const divisor = f('B', 7);
  function termRatio(term, { a, B, ad, source }) {
    if (term.kind === 'ad') return ref('Tinh toan', ad);
    if (term.kind === 'n' || term.kind === 'cod') return ref('Hoat dong', (term.kind === 'n' ? 'Z' : 'AA') + a);
    if (term.kind === 'other') return term.id === 'PERSON' ? `IF(${ref('Hoat dong','AF' + a)}=1,${ou(term.id)},0)` : ou(term.id);
    if (term.kind === 'effluent') return ref('Tinh toan', B(8));
    if (term.kind === 'gwp') return gu(term.id);
    if (term.kind === 'blend') return `IF(${ref('Tinh toan',B(3))}=0,0,${f('F',gr[term.id])}*IF(${f('B',5)}=1,${term.weight},1)/${ref('Tinh toan',B(3))})`;
    if (term.kind === 'grid') return `IF(${f('C',grid[source.factor])}=0,0,${f('B',12)}/${f('C',grid[source.factor])})`;
    return f({ ncv:'S', co2:'T', ch4:'U', n2o:'V' }[term.kind],fr[term.id]);
  }
  summary.rows.forEach((result, index) => {
    const source = result.row, a = index + 7, r = 7 + index * 27;
    const units = source.group < 2 ? db.fuels.find(x => x.id === source.factor).unit : ['', '', 'giờ công', 'm³', 'kg', 'kg', 'tấn', 'kWh'][source.group];
    row(activity, a, [source.id, source.name, engine.groups[source.group], source.mode, source.amount, ...source.months, null, source.ad / 100, units, source.factor, source.device || '', source.evidence || '', source.nitrogen ?? 0, source.cod ?? 0, (source.nU || 0) / 100, (source.codU || 0) / 100, source.mcf || '', source.includeCH4 ? 1 : 0]);
    const cylinders = source.group === 5 && source.factor === 'CO2' && source.pcccInput === 'cylinders';
    const annualAmount = cylinders ? `AD${a}*AE${a}` : `E${a}`;
    cell(activity, 'R' + a, result.amount, `IF(D${a}="monthly",SUM(F${a}:Q${a}),${annualAmount})`, format);
    for (const [columnName, value] of Object.entries({
      AD: cylinders ? Number(source.pcccCount) : '', AE: cylinders ? Number(source.pcccKg) : '',
      AF: source.personUncertain === false ? 0 : 1, AG: source.adGroup || '',
      AH: source.adMethod || (source.adHalfWidth != null ? 'U-shape (a / 2)' : 'u trực tiếp'),
      AI: source.adInputs ? JSON.stringify(source.adInputs) : source.adHalfWidth ?? '',
    })) cell(activity, columnName + a, value);
    for (const col of ['S', 'Z', 'AA']) cell(activity, col + a, col === 'S' ? source.ad / 100 : (source[col === 'Z' ? 'nU' : 'codU'] || 0) / 100, null, percent);
    cell(calc, 'A' + r, source.name);
    calc.sections.push(r);
    calc.merges.push('A' + r + ':G' + r);
    row(calc, r + 1, ['Số liệu hoạt động', null, units]);
    row(calc, r + 2, ['u AD']);
    cell(calc, 'B' + (r + 1), result.amount, ref('Hoat dong', 'R' + a), format);
    cell(calc, 'B' + (r + 2), source.ad / 100, ref('Hoat dong', 'S' + a), percent);
    const B = offset => 'B' + (r + offset);
    const ad = B(2);
    function metric(offset, label, value, formula, unit = '') {
      row(calc, r + offset, [label, null, unit]);
      cell(calc, B(offset), value, formula, format);
    }
    const gasRows = [10, 11, 12, 13].map(offset => r + offset);
    const raw = [0, 0, 0, 0], gwp = [1, 1, 1, 1], rawFormula = ['0', '0', '0', '0'], gwpFormula = ['1', '1', '1', '1'], uFormula = ['0', '0', '0', '0'];
    let biologicalFormula = '0';
    if (source.group < 2) {
      const fuel = db.fuels.find(x => x.id === source.factor), z = fr[source.factor];
      const kg = result.amount * fuel.density, gg = kg / 1000000, tj = gg * fuel.ncv[0];
      metric(3, 'Khối lượng riêng', fuel.density, f('C', z), 'kg/ĐVT');
      metric(4, 'Khối lượng', kg, `${B(1)}*${B(3)}`, 'kg');
      metric(5, 'Khối lượng', gg, `${B(4)}/${f('B', 8)}`, 'Gg');
      metric(6, 'Nhiệt trị NCV', fuel.ncv[0], f('E', z), 'TJ/Gg');
      metric(7, 'Nhiệt lượng', tj, `${B(5)}*${B(6)}`, 'TJ');
      const methane = fuel.bio ? 'CH4_BIO' : 'CH4_FOSSIL';
      raw[0] = fuel.bio ? 0 : tj * fuel.co2[0]; raw[1] = tj * fuel.ch4[0]; raw[2] = tj * fuel.n2o[0];
      rawFormula[0] = `IF(${f('Q', z)}=1,0,${B(7)}*${f('H', z)})`;
      rawFormula[1] = `${B(7)}*${f('K', z)}`; rawFormula[2] = `${B(7)}*${f('N', z)}`;
      gwp[1] = db.gases.find(g => g.id === methane)[period.gwp]; gwp[2] = db.gases.find(g => g.id === 'N2O')[period.gwp];
      gwpFormula[1] = gw(methane); gwpFormula[2] = gw('N2O');
      uFormula[0] = `SQRT(${ad}^2+${f('S', z)}^2+${f('T', z)}^2)`;
      uFormula[1] = `SQRT(${ad}^2+${f('S', z)}^2+${f('U', z)}^2+${gu(methane)}^2)`;
      uFormula[2] = `SQRT(${ad}^2+${f('S', z)}^2+${f('V', z)}^2+${gu('N2O')}^2)`;
      biologicalFormula = `IF(${f('Q', z)}=1,${B(7)}*${f('H', z)}/${divisor},0)`;
    } else if (source.group === 2) {
      const val = id => db.other.find(x => x.id === id).value;
      const tow = result.amount / 24 * val('BOD') / 1000;
      metric(3, 'BOD 24 giờ', val('BOD'), ov('BOD'), 'g/người/ngày');
      metric(4, 'TOW', tow, `${B(1)}/${f('B', 9)}*${B(3)}/${divisor}`, 'kg BOD');
      metric(5, 'Bo', val('BO_DOM'), ov('BO_DOM'), 'kg CH₄/kg BOD');
      metric(6, 'MCF', val(source.mcf), ov(source.mcf));
      metric(7, 'EF', val('BO_DOM') * val(source.mcf), `${B(5)}*${B(6)}`);
      raw[1] = tow * val('BO_DOM') * val(source.mcf); rawFormula[1] = `${B(4)}*${B(7)}`;
      gwp[1] = db.gases.find(g => g.id === 'CH4_BIO')[period.gwp]; gwpFormula[1] = gw('CH4_BIO');
      uFormula[1] = `SQRT(${[ad, `IF(${ref('Hoat dong','AF' + a)}=1,${ou('PERSON')},0)`, ou('BOD'), ou('BO_DOM'), ou(source.mcf), gu('CH4_BIO')].map(x => x + '^2').join('+')})`;
    } else if (source.group === 3) {
      metric(3, 'N đầu ra', source.nitrogen, ref('Hoat dong', 'X' + a), 'kg N/m³');
      metric(4, 'N xả thải', result.amount * source.nitrogen, `${B(1)}*${B(3)}`, 'kg N');
      metric(5, 'COD', source.cod, ref('Hoat dong', 'Y' + a), 'kg COD/m³');
      metric(6, 'Tổng COD', result.amount * source.cod, `${B(1)}*${B(5)}`, 'kg COD');
      metric(7, 'MCF', db.other.find(x => x.id === source.mcf)?.value ?? 0, source.mcf ? ov(source.mcf) : '0');
      const effluent = engine.industrialEffluentFactor(source, db);
      const effluentEF = source.effluentMethod ? B(20) : ov('EF_N');
      const effluentU = source.effluentMethod ? B(8) : ou('EF_N');
      if (source.effluentMethod) {
        metric(8, 'u EF N₂O đầu xả', effluent.u / 100, null);
        calc.cells[calc.cells.length - 1].numberFormat = percent;
        metric(20, 'EF N₂O đầu xả · IPCC 2019', effluent.value, null, 'kg N₂O-N/kg N');
      }
      raw[2] = result.amount * source.nitrogen * effluent.value * 44 / 28;
      rawFormula[2] = `${B(4)}*${effluentEF}*${f('B', 11)}`;
      raw[1] = source.includeCH4 ? result.amount * source.cod * db.other.find(x => x.id === 'BO_IND').value * db.other.find(x => x.id === source.mcf).value : 0;
      rawFormula[1] = `IF(${ref('Hoat dong', 'AC' + a)}=1,${B(6)}*${ov('BO_IND')}*${B(7)},0)`;
      for (const [i, id] of [[1, 'CH4_BIO'], [2, 'N2O']]) { gwp[i] = db.gases.find(g => g.id === id)[period.gwp]; gwpFormula[i] = gw(id); }
      uFormula[2] = `SQRT(${ad}^2+${ref('Hoat dong', 'Z' + a)}^2+${effluentU}^2+${gu('N2O')}^2)`;
      uFormula[1] = `IF(${ref('Hoat dong', 'AC' + a)}=1,SQRT(${ad}^2+${ref('Hoat dong', 'AA' + a)}^2+${ou('BO_IND')}^2+${source.mcf ? ou(source.mcf) : 0}^2+${gu('CH4_BIO')}^2),0)`;
    } else if ([4, 5].includes(source.group)) {
      const g = gr[source.factor];
      metric(3, 'GWP môi chất', result.steps[0][1], f('G', g));
      metric(4, 'u GWP môi chất', result.steps[1][1], f('H', g));
      const gasIndex = source.factor === 'CO2' ? 0 : 3;
      raw[gasIndex] = result.amount; rawFormula[gasIndex] = B(1);
      gwp[gasIndex] = result.steps[0][1]; gwpFormula[gasIndex] = B(3);
      uFormula[gasIndex] = `SQRT(${ad}^2+IF(${B(3)}=0,0,(${B(4)}/${B(3)})^2))`;
    } else if (source.group === 6) {
      const id = source.factor === 'LIME' ? 'LIME' : 'UREA';
      metric(3, 'EF carbon', db.other.find(x => x.id === id).value, ov(id), 'tấn C/tấn');
      metric(4, 'Hệ số CO₂/C', 44 / 12, f('B', 10));
      raw[0] = result.total * 1000; rawFormula[0] = `${B(1)}*${B(3)}*${B(4)}*${divisor}`;
      uFormula[0] = `SQRT(${ad}^2+${ou(id)}^2)`;
    } else {
      const value = db.grid.find(x => x.id === source.factor).value;
      metric(3, 'Điện năng', result.amount / 1000, `${B(1)}/${divisor}`, 'MWh');
      metric(4, 'EF điện', value, f('C', grid[source.factor]), 'tCO₂/MWh');
      metric(5, 'SD chuỗi EF', engine.sd(gridHistory.map(x => x.value)), f('B', 12));
      raw[0] = result.total * 1000; rawFormula[0] = `${B(3)}*${B(4)}*${divisor}`;
      uFormula[0] = `SQRT(${ad}^2+IF(${B(4)}=0,0,(${B(5)}/${B(4)})^2))`;
    }
    calc.headers.push(r + 9);
    row(calc, r + 9, ['Khí', 'Khối lượng khí (kg)', 'GWP-100', 'Phát thải tCO₂e', 'u tương đối', 'u tuyệt đối tCO₂e']);
    ['CO₂', 'CH₄', 'N₂O', 'Môi chất / PCCC'].forEach((label, i) => {
      const g = gasRows[i];
      cell(calc, 'A' + g, label);
      cell(calc, 'B' + g, raw[i], rawFormula[i], format);
      cell(calc, 'C' + g, gwp[i], gwpFormula[i], format);
      cell(calc, 'D' + g, result.gases[i], `B${g}*C${g}/${divisor}`, format);
      cell(calc, 'E' + g, result.unc[i], uFormula[i], percent);
      cell(calc, 'F' + g, result.gases[i] * result.unc[i], `D${g}*E${g}`, format);
    });
    metric(15, 'CO₂ sinh học báo cáo riêng', result.bio, biologicalFormula, 'tấn CO₂');
    metric(16, 'Tổng phát thải', result.total, `SUM(D${gasRows[0]}:D${gasRows[3]})`, 'tCO₂e');
    const sourceTerms = new Map();
    for (const term of result.terms) {
      if (!termKeys.has(term.key)) termKeys.set(term.key, { id: termKeys.size + 1, value: 0 });
      const item = termKeys.get(term.key);
      item.value += term.value;
      const groupKey = source.group + ':' + item.id;
      if (!groupKeys.has(groupKey)) groupKeys.set(groupKey, { group: source.group, id: item.id, value: 0 });
      groupKeys.get(groupKey).value += term.value;
      row(components, termLine, [source.name, engine.groups[source.group], termLabels[term.kind] + (term.id ? ' · ' + term.id : ''), item.id]);
      const emissionCells = term.indices.map(i => ref('Tinh toan','D' + gasRows[i])).join('+');
      const address = cell(components, 'E' + termLine++, term.value, `(${emissionCells})*${termRatio(term,{ a,B,ad,source })}`, format);
      if (!sourceTerms.has(item.id)) sourceTerms.set(item.id, []);
      sourceTerms.get(item.id).push(ref(components.name,address));
    }
    const termsFormula = [...sourceTerms.values()].map(items => items.length === 1 ? items[0] : '(' + items.join('+') + ')');
    metric(17, 'u chuẩn', result.u, `SQRT(SUMSQ(${termsFormula.join(',') || '0'}))`, 'tCO₂e');
    metric(18, 'U mở rộng 95%', result.U, `${B(17)}*${f('B', 6)}`, 'tCO₂e');
    metric(19, 'U tương đối 95%', result.total ? result.U / result.total : 0, `IF(${B(16)}=0,0,${B(18)}/${B(16)})`);
    calc.cells[calc.cells.length - 1].numberFormat = percent;
    row(calc, r + 21, ['Nguồn hệ số', result.source]); calc.merges.push(`B${r + 21}:G${r + 21}`);
    row(calc, r + 23, ['Ghi chú', result.warnings.join(' ')]); calc.merges.push(`B${r + 23}:G${r + 23}`);
    outputRefs.push({ total: ref('Tinh toan', B(16)), u: ref('Tinh toan', B(17)), U: ref('Tinh toan', B(18)), bio: ref('Tinh toan', B(15)), gas: gasRows.map(g => ref('Tinh toan', 'D' + g)), group: source.group, result, activityRow: a, calcRow: r, units });
  });
  let subtotalLine = 5;
  for (const { id, value } of termKeys.values()) {
    cell(components,'G' + subtotalLine,id);
    cell(components,'H' + subtotalLine,value,`SUMIF(D5:D${termLine-1},G${subtotalLine},E5:E${termLine-1})`,format);
    subtotalLine++;
  }
  let groupLine = 5;
  for (const { group, id, value } of groupKeys.values()) {
    cell(components,'I' + groupLine,engine.groups[group]);
    cell(components,'J' + groupLine,id);
    cell(components,'K' + groupLine,value,`SUMIFS(E5:E${termLine-1},D5:D${termLine-1},J${groupLine},B5:B${termLine-1},I${groupLine})`,format);
    cell(components,'L' + groupLine,value**2,`K${groupLine}^2`,format);
    groupLine++;
  }
  title(totals, 'Báo cáo kiểm kê khí nhà kính năm ' + period.year, 'H');
  row(totals, 4, ['Cơ sở', period.facility]); totals.merges.push('B4:H4');
  row(totals, 5, ['Ranh giới', period.boundary]); totals.merges.push('B5:H5');
  row(totals, 6, ['GWP-100']);
  cell(totals, 'B6', period.gwp.toUpperCase(), `CHOOSE(${f('B', 4)},"AR4","AR5","AR6")`);
  row(totals, 8, ['Nhóm nguồn', 'Phạm vi', 'CO₂', 'CH₄ quy đổi', 'N₂O quy đổi', 'Môi chất quy đổi', 'Tổng tCO₂e', 'u chuẩn tCO₂e']); totals.headers.push(8);
  for (let i = 0; i < 8; i++) {
    const r = i + 9, selected = outputRefs.filter(x => x.group === i);
    row(totals, r, [engine.groups[i], i === 7 ? '2' : '1']);
    [0, 1, 2, 3].forEach(g => cell(totals, column(g + 3) + r, selected.reduce((s, x) => s + x.result.gases[g], 0), selected.map(x => x.gas[g]).join('+') || '0', format));
    cell(totals, 'G' + r, summary.groups[i], `SUM(C${r}:F${r})`, format);
    cell(totals, 'H' + r, engine.combineUncertainty(selected.map(x => x.result)), groupLine > 5
      ? `SQRT(SUMIF(${ref(components.name,'I5:I' + (groupLine-1))},A${r},${ref(components.name,'L5:L' + (groupLine-1))}))` : '0', format);
  }
  row(totals, 18, ['Tổng phạm vi 1 + 2']);
  cell(totals, 'G18', summary.total, 'SUM(G9:G16)', format);
  cell(totals, 'H18', summary.u, subtotalLine > 5 ? `SQRT(SUMSQ(${ref(components.name,'H5:H' + (subtotalLine-1))}))` : '0', format);
  row(totals, 20, ['CO₂ sinh học báo cáo riêng']); cell(totals, 'G20', summary.bio, outputRefs.map(x => x.bio).join('+') || '0', format);
  row(totals, 21, ['U mở rộng 95% (tCO₂e)']); cell(totals, 'G21', summary.U, `H18*${f('B', 6)}`, format);
  row(totals, 22, ['U tương đối 95%']); cell(totals, 'G22', summary.percent / 100, 'IF(G18=0,0,G21/G18)', percent);
  const notes = [
    'Ô vàng là số liệu đầu vào. Các ô công thức tính lại khi mở và chỉnh sửa trong Excel.',
    methodNote + ' Hệ số phủ k = ' + summary.k + '. Xem Thanh phan u để truy xuất phép tổng hợp.',
    'Urê dùng u EF trong Thư viện hệ số. Với EF mặc định Tier 1, u EF = 0 theo giả định toàn bộ C trong urê phát thải.',
    'SD hệ số điện giữa các năm là giả định về độ biến động theo prompt. u GWP cho AR4/AR5 quy đổi theo dữ liệu AR6.',
    ...new Set(summary.rows.flatMap(x => x.warnings)),
    period.notes || '',
  ].filter(Boolean);
  notes.forEach((note, i) => { cell(totals, 'A' + (25 + i), note); totals.merges.push('A' + (25 + i) + ':H' + (25 + i)); });

  function reportLine(number, text, height = 26) {
    cell(report, 'A' + number, text);
    report.merges.push(`A${number}:F${number}`);
    report.wrapped.push(['A' + number, height]);
  }
  function reportField(number, label, value, formula, numberFormat, height = 26) {
    cell(report, 'A' + number, label);
    cell(report, 'B' + number, value, formula, numberFormat);
    report.merges.push(`B${number}:F${number}`);
    report.wrapped.push(['B' + number, height]);
  }
  title(report, 'Báo cáo kiểm kê khí nhà kính cấp cơ sở', 'F');
  reportLine(4, `Năm ${period.year} · Bản dự thảo theo cấu trúc Mẫu số 06, Phụ lục II`, 30);
  reportLine(6, 'I. Thông tin cơ sở', 26);
  reportField(7, 'Tên cơ sở', period.facility);
  reportField(8, 'Địa chỉ', period.address);
  reportField(9, 'Giấy phép kinh doanh', period.license);
  reportField(10, 'Người đại diện pháp luật', period.representative);
  reportField(11, 'Lĩnh vực hoạt động', period.sector);
  reportField(12, 'Đầu mối phụ trách', period.contact);
  reportLine(14, 'II. Hoạt động sản xuất, kinh doanh và dữ liệu', 26);
  reportField(15, 'Ranh giới và phạm vi', period.boundary, null, null, 40);
  reportField(16, 'Công nghệ và hoạt động', period.operations, null, null, 56);
  reportField(17, 'Nguồn phát thải và bể hấp thụ', 'Xem sheet Phu luc nguon. Bổ sung thông tin bể hấp thụ nếu có.', null, null, 36);
  reportField(18, 'Thu thập dữ liệu và hạn chế', 'Bổ sung phương thức thu thập, hệ thống quản lý dữ liệu và nguyên nhân của các hạn chế.', null, null, 44);
  reportLine(20, 'III. Phương pháp, số liệu và kết quả kiểm kê', 26);
  reportField(21, 'Phương pháp và hệ số', 'Phát thải tính theo số liệu hoạt động và hệ số tra cứu. Xem các sheet Tinh toan và He so.', null, null, 42);
  reportField(22, 'Bộ GWP-100', period.gwp.toUpperCase(), ref('Tong hop', 'B6'));
  reportField(23, 'Số liệu và chứng từ', 'Xem Hoat dong và Phu luc nguon.');
  reportField(24, 'Phạm vi 1 (tCO₂e)', summary.scope1, `SUM(${ref('Tong hop', 'G9:G15')})`, format);
  reportField(25, 'Phạm vi 2 (tCO₂e)', summary.scope2, ref('Tong hop', 'G16'), format);
  reportField(26, 'Tổng (tCO₂e)', summary.total, ref('Tong hop', 'G18'), format);
  reportField(27, 'CO₂ sinh học riêng (tấn CO₂)', summary.bio, ref('Tong hop', 'G20'), format);
  reportField(28, 'U 95% (± tCO₂e)', summary.U, ref('Tong hop', 'G21'), format);
  reportField(29, 'U tương đối 95%', summary.percent / 100, ref('Tong hop', 'G22'), percent);
  reportField(30, 'Giả định về độ không đảm bảo', 'U mở rộng = ' + summary.k + ' × u tổng. ' + methodNote + ' Xem Ra soat DKBDB.', null, null, 44);
  reportField(31, 'Độ tin cậy và tính đầy đủ', period.notes || 'Bổ sung đánh giá của cơ sở trước khi ký.', null, null, 56);
  reportField(33, 'Đại diện cơ sở', 'Ký, ghi rõ họ tên, chức vụ và ngày lập', null, null, 45);
  reportLine(35, 'Tham chiếu: Mẫu số 06, Phụ lục II của Nghị định 06/2022/NĐ-CP. Hoàn thiện thông tin và đối chiếu quy định áp dụng cho kỳ báo cáo trước khi nộp.', 44);
  reportLine(36, 'Xem Doi chieu TT38 để rà soát Điều 16–23 và các nội dung cần cơ sở xác nhận.', 26);
  report.headers.push(6, 14, 20);

  title(annex, 'Phụ lục số liệu và kết quả theo nguồn', 'M');
  annex.headers.push(5);
  row(annex, 5, ['Nguồn phát thải', 'Nhóm nguồn', 'Phạm vi', 'ĐVT', 'Số liệu hoạt động', 'CO₂ (tCO₂e)', 'CH₄ (tCO₂e)', 'N₂O (tCO₂e)', 'Môi chất (tCO₂e)', 'Tổng tCO₂e', 'U 95% (± tCO₂e)', 'Chứng từ', 'Tham chiếu hệ số']);
  outputRefs.forEach((entry, index) => {
    const line = index + 6;
    const { result, group, units, activityRow, calcRow } = entry;
    cell(annex, 'A' + line, result.row.name, ref('Hoat dong', 'B' + activityRow));
    cell(annex, 'B' + line, engine.groups[group]);
    cell(annex, 'C' + line, group === 7 ? '2' : '1');
    cell(annex, 'D' + line, units);
    cell(annex, 'E' + line, result.amount, ref('Hoat dong', 'R' + activityRow), format);
    result.gases.forEach((value, gas) => cell(annex, column(gas + 6) + line, value, entry.gas[gas], format));
    cell(annex, 'J' + line, result.total, entry.total, format);
    cell(annex, 'K' + line, result.U, entry.U, format);
    cell(annex, 'L' + line, result.row.evidence || '', `IF(${ref('Hoat dong', 'W' + activityRow)}="","",${ref('Hoat dong', 'W' + activityRow)})`);
    cell(annex, 'M' + line, result.source, ref('Tinh toan', 'B' + (calcRow + 21)));
    for (const col of ['A', 'B', 'L', 'M']) annex.wrapped.push([col + line, 54]);
  });

  const reviewStats = engine.reliabilitySummary(summary.rows);
  title(quality, 'Đánh giá độ tin cậy dữ liệu theo dòng nguồn', 'M');
  row(quality, 4, ['Số nguồn đủ cả hai đánh giá']);
  row(quality, 5, ['Tỷ lệ phát thải đã đánh giá đủ']);
  mergedLine(quality, 6, 'Theo slide: x = ROUND(√(điểm dữ liệu² + điểm EF²), 2). Ngưỡng A ≤ 2,24, B ≤ 4,24, C ≤ 5,00, D > 5,00. Quy tắc gộp điểm được suy ra từ các ngưỡng.', 'M', 32);
  mergedLine(quality, 7, 'Theo mẫu Word: 3/3 tiêu chí đạt = Cao, 2/3 = Trung bình, 1/3 = Thấp, 0/3 = Không có độ tin cậy. Ô trống nghĩa là chưa đánh giá.', 'M', 32);
  row(quality, 8, ['Dòng nguồn', 'Nhóm', 'Điểm dữ liệu', 'Điểm EF', 'Điểm x', 'Cấp A–D', 'Căn cứ khách quan', 'Chi tiết / đại diện', 'Đối chứng', 'Mức theo Word', 'Căn cứ / nhận xét', 'Phát thải (tCO₂e)', 'Đánh giá đủ (1/0)']);
  quality.headers.push(8);
  outputRefs.forEach((entry, index) => {
    const line = index + 9, source = entry.result.row, data = source.reliability || {};
    const evaluation = engine.assessReliability(data);
    const checkLabel = key => ({ pass:'Đạt', fail:'Không đạt' })[data[key]] || '';
    const scoreInput = value => [1,2,3,4].includes(value) ? value : '';
    cell(quality, 'A' + line, source.name, ref('Hoat dong', 'B' + entry.activityRow));
    cell(quality, 'B' + line, engine.groups[source.group]);
    cell(quality, 'C' + line, scoreInput(data.activity), null, '0');
    cell(quality, 'D' + line, scoreInput(data.factor), null, '0');
    const inputs = `C${line}:D${line}`;
    const checks = `G${line}:I${line}`;
    cell(quality, 'E' + line, evaluation.score, `IFERROR(IF(AND(COUNT(${inputs})=2,MIN(${inputs})>=1,MAX(${inputs})<=4,MOD(C${line},1)=0,MOD(D${line},1)=0),ROUND(SQRT(SUMSQ(${inputs})),2),""),"")`, '0.00');
    cell(quality, 'F' + line, evaluation.grade, `IF(E${line}="","",IF(E${line}<=2.24,"A",IF(E${line}<=4.24,"B",IF(E${line}<=5,"C","D"))))`);
    ['objective','detail','crosscheck'].forEach((key,i) => cell(quality, column(7+i) + line, checkLabel(key)));
    cell(quality, 'J' + line, evaluation.level, `IF(COUNTIF(${checks},"Đạt")+COUNTIF(${checks},"Không đạt")<3,"",CHOOSE(COUNTIF(${checks},"Đạt")+1,"Không có độ tin cậy","Thấp","Trung bình","Cao"))`);
    cell(quality, 'K' + line, data.note || '');
    cell(quality, 'L' + line, entry.result.total, entry.total, format);
    cell(quality, 'M' + line, evaluation.grade !== null && evaluation.level !== null ? 1 : 0, `IF(AND(F${line}<>"",J${line}<>""),1,0)`, '0');
    quality.wrapped.push(['K' + line, 42]);
  });
  const qualityEnd = outputRefs.length + 8;
  cell(quality, 'B4', reviewStats.complete, outputRefs.length ? `SUM(M9:M${qualityEnd})` : '0', '0');
  cell(quality, 'B5', reviewStats.coverage, outputRefs.length
    ? `IF(SUM(L9:L${qualityEnd})=0,"",SUMPRODUCT(L9:L${qualityEnd},M9:M${qualityEnd})/SUM(L9:L${qualityEnd}))` : '""', percent);

  const profile = period.reportProfile || {};
  const profileValue = value => value || 'Chưa khai báo';
  const section = (line, label) => { mergedLine(facility, line, label, 'F', 27); facility.headers.push(line); };
  const field = (line, label, value, formula, numberFormat) => {
    cell(facility, 'A' + line, label);
    cell(facility, 'B' + line, value ?? 'Chưa khai báo', formula, numberFormat);
    facility.merges.push(`B${line}:F${line}`);
    facility.wrapped.push(['A' + line, 42], ['B' + line, 42]);
  };
  title(facility, 'Báo cáo kết quả kiểm kê khí nhà kính', 'F');
  mergedLine(facility, 3, `Năm ${period.year} · ${period.facility}`, 'F', 29);
  field(4, 'Địa danh và ngày lập', profileValue([profile.place, profile.date ? String(profile.date).split('-').reverse().join('/') : ''].filter(Boolean).join(', ')));
  section(6, 'MỞ ĐẦU');
  field(7, 'Căn cứ pháp lý và kỹ thuật', profileValue(profile.references));
  field(8, 'Tổ chức thực hiện kiểm kê', profileValue(profile.organization));
  section(10, 'PHẦN I. THÔNG TIN CƠ SỞ');
  const identification = [
    ['Tên cơ sở',period.facility],['Địa chỉ',period.address],['Mã số thuế',profile.tax],
    ['Đăng ký doanh nghiệp',period.license],['Đăng ký đầu tư',profile.project],['Giấy phép môi trường',profile.environmentPermit],
    ['Đại diện pháp luật',period.representative],['Đầu mối phụ trách',period.contact],['Ủy quyền',profile.delegation],
    ['Lĩnh vực hoạt động',period.sector],['Sản lượng, công suất và nhân sự',profile.production],
  ];
  identification.forEach(([label,value],i) => field(11+i,label,profileValue(value)));
  section(23, 'PHẦN II. HOẠT ĐỘNG SẢN XUẤT KINH DOANH VÀ SỐ LIỆU');
  field(24, 'Ranh giới và phạm vi', profileValue(period.boundary));
  field(25, 'Cơ sở hạ tầng và công nghệ', profileValue(profile.infrastructure || period.operations));
  field(26, 'Nguồn phát thải và bể hấp thụ', 'Xem Phu luc nguon. Bể hấp thụ: ' + profileValue(profile.sinks));
  field(27, 'Hệ thống thông tin và dữ liệu', profileValue(profile.dataSystem));
  field(28, 'Hạn chế dữ liệu', profileValue(profile.limitations));
  section(30, 'PHẦN III. KẾT QUẢ THỰC HIỆN KIỂM KÊ');
  field(31, '1. Phương pháp và hệ số', `GWP-100 ${period.gwp.toUpperCase()}. Xem Tinh toan và He so để kiểm tra phương pháp và nguồn hệ số.`);
  field(32, '2. Số liệu hoạt động', 'Xem Hoat dong và Phu luc nguon để đối chiếu dữ liệu, thiết bị và chứng từ.');
  field(33, '3. Phạm vi 1 (tCO₂e)', summary.scope1, `SUM(${ref('Tong hop','G9:G15')})`, format);
  field(34, 'Phạm vi 2 (tCO₂e)', summary.scope2, ref('Tong hop','G16'), format);
  field(35, 'Tổng (tCO₂e)', summary.total, ref('Tong hop','G18'), format);
  field(36, 'CO₂ sinh học riêng (tấn CO₂)', summary.bio, ref('Tong hop','G20'), format);
  field(37, 'U mở rộng (± tCO₂e)', summary.U, ref('Tong hop','G21'), format);
  field(38, 'U tương đối', summary.percent / 100, ref('Tong hop','G22'), percent);
  field(39, '4. Số nguồn đã đánh giá đủ', reviewStats.complete, ref(quality.name,'B4'), '0');
  field(40, 'Tỷ lệ phát thải đã đánh giá đủ', reviewStats.coverage ?? '', `IF(${ref(quality.name,'B5')}="","",${ref(quality.name,'B5')})`, percent);
  field(41, 'Kiểm soát và bảo đảm chất lượng', profileValue(profile.quality));
  field(42, 'Tính đầy đủ, đại diện và ngoại lệ', profileValue(profile.completeness));
  field(43, 'Kết luận và kế hoạch cải thiện', profileValue(profile.conclusion || period.notes));
  field(44, 'Đại diện ký báo cáo', profileValue(period.representative));
  field(45, 'Đơn vị tư vấn (nếu có)', profile.consultant || '');
  section(47, 'PHỤ LỤC I. CÁC HỆ SỐ VÀ GIÁ TRỊ');
  field(48, 'Nguồn tra cứu và giá trị', 'Xem He so, Tinh toan, Thanh phan u và Phu luc nguon.');
  section(50, 'PHỤ LỤC II. VĂN BẢN PHÁP LÝ VÀ TÀI LIỆU');
  field(51, 'Tài liệu áp dụng', profileValue(profile.references));

  function mergedLine(target, number, text, lastColumn, height) {
    cell(target, 'A' + number, text);
    target.merges.push(`A${number}:${lastColumn}${number}`);
    target.wrapped.push(['A' + number, height]);
  }
  title(review, 'Rà soát độ không đảm bảo đo', 'F');
  mergedLine(review, 4, methodNote + ' Xem Thanh phan u để đối chiếu từng thành phần. Đổi thiết lập tương quan trong GreenLedger rồi xuất lại.', 'F', 32);
  mergedLine(review, 5, 'Danh sách ghi nhận lúc xuất Excel, dựa trên các nguồn có phát thải dương. Để cập nhật danh sách, sửa dữ liệu trong ứng dụng rồi xuất lại.', 'F', 32);
  mergedLine(review, 6, 'Kiểm tra mã thiết bị, chứng thư hiệu chuẩn và nguồn gốc hệ số. Khi xác nhận sai số chung, đánh giá mức tương quan và ghi cách xử lý trong hồ sơ theo IPCC 2006, Quyển 1, Chương 3.', 'F', 32);
  mergedLine(review, 7, 'Độ lệch chuẩn hệ số điện theo năm chỉ đại diện biến động. u GWP hỗn hợp phụ thuộc lựa chọn trọng số trong Phương pháp & giả định. N₂O nước thải dùng tải lượng N tại điểm xả.', 'F', 32);
  review.headers.push(8);
  row(review, 8, ['Loại đầu vào', 'Mã / nhãn dùng chung', 'Nguồn phát thải', 'Nhóm nguồn', 'Số nguồn dùng chung', 'Kết quả xác minh / cách xử lý']);
  let reviewLine = 9;
  for (const item of shared) {
    for (const source of item.rows) {
      row(review, reviewLine, [item.kind, item.label, source.name, engine.groups[source.group], item.rows.length, null]);
      for (const col of ['A', 'B', 'C', 'D', 'F']) review.wrapped.push([col + reviewLine, 37]);
      reviewLine++;
    }
  }
  if (!shared.length) mergedLine(review, 9, 'Chưa phát hiện đầu vào dùng chung theo mã hệ số, GWP hoặc nhãn thiết bị đã khai báo.', 'F', 32);

  title(crosswalk, 'Đối chiếu hồ sơ cấp cơ sở · Thông tư 38/2023/TT-BCT', 'E');
  mergedLine(crosswalk, 4, 'Điều 23 dẫn chiếu Mẫu số 06 Phụ lục II của Nghị định 06/2022/NĐ-CP. Cơ sở ghi kết quả rà soát vào cột cuối và hoàn thiện hồ sơ theo quy định áp dụng cho kỳ báo cáo.', 'E', 38);
  crosswalk.headers.push(6);
  row(crosswalk, 6, ['Căn cứ', 'Nội dung', 'Vị trí trong tệp xuất', 'Việc cơ sở cần xác nhận', 'Kết quả rà soát / chứng từ']);
  const checks = [
    ['Điều 16', 'Ranh giới và phạm vi', 'Mau 06 · mục II. Phu luc nguon · từng nguồn và phạm vi.', 'Rà đủ nguồn trực tiếp, điện và hơi mua. Bổ sung phép tính riêng nếu có nguồn ngoài danh mục ứng dụng.'],
    ['Điều 17 · PL II.1', 'Thu thập số liệu hoạt động', 'Hoat dong · số liệu theo tháng/năm, thiết bị và chứng từ.', 'Đối chiếu nhiên liệu theo chủng loại, số liệu điện mua và hồ sơ đo đếm.'],
    ['Điều 18', 'Lựa chọn hệ số phát thải', 'He so · giá trị, đơn vị và tài liệu tham chiếu.', 'Xác nhận căn cứ chọn hệ số và năm áp dụng. Kiểm tra loại than, nhiệt trị và đơn vị của cơ sở.'],
    ['Điều 19 · PL II.2', 'Tính phát thải và quy đổi GWP', 'Tinh toan · các bước tính. Tong hop · tổng theo khí và nhóm nguồn.', 'Đối chiếu công thức áp dụng, bộ GWP và các đính chính của Bộ Công Thương.'],
    ['Điều 20', 'Kiểm soát chất lượng', 'Hoat dong, He so, Tinh toan và Phu luc nguon để đối soát.', 'Ghi người kiểm tra, ngày, sai lệch phát hiện và cách xử lý.'],
    ['Điều 21', 'Độ không chắc chắn', 'Mau 06 · mục III. Ra soat DKBDB · giả định và đầu vào dùng chung.', 'Xác minh sai số thiết bị, độ không đảm bảo của hệ số và tương quan.'],
    ['Điều 22', 'Tính lại kỳ trước', 'Mau 06 · mục III, phần đánh giá và giải trình.', 'Bổ sung kỳ, nguyên nhân và kết quả tính lại nếu có thay đổi thuộc diện phải giải trình.'],
    ['Điều 23', 'Báo cáo cấp cơ sở', 'Mau 06 · dự thảo. Phu luc nguon · bảng kèm theo.', 'Hoàn thiện nội dung chưa khai báo và xác nhận của đại diện cơ sở.'],
  ];
  checks.forEach((check, index) => {
    const line = index + 7;
    row(crosswalk, line, [...check, null]);
    for (const col of ['A', 'B', 'C', 'D', 'E']) crosswalk.wrapped.push([col + line, 48]);
  });
  mergedLine(crosswalk, 16, 'Tham chiếu: Thông tư 38/2023/TT-BCT và Quyết định đính chính 334/QĐ-BCT ngày 06/02/2025.', 'E', 30);
  return { sheets, expected: { total: summary.total, u: summary.u, bio: summary.bio }, format, percent };
}

if (typeof module !== 'undefined') module.exports = createExcelModel;
