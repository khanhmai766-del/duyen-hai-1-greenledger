'use strict';

const workbookView = { reference: false, query: '', page: 1 };

function setActiveFactorQuery(query) {
  Object.assign(workbookView, { query, page: 1 });
}

function mergeWorkbookFactors(database) {
  if (!database || !Array.isArray(database.fuels) || !Array.isArray(database.gases) || database.factorWorkbookVersion === 1) return database;
  const fuels = factorWorkbook.fuels.flatMap(section => section.rows);
  const variants = [
    ['LPG_COMM', 'LPG - Thương mại', 'stationary'],
    ['DO_COMM', 'Dầu DO - Thương mại', 'stationary'],
    ['GAS_2S_OFF', 'Xăng 2 kỳ - Máy cắt cỏ', 'mobile'],
  ];
  for (const [id, key, type] of variants) {
    if (database.fuels.some(fuel => fuel.id === id)) continue;
    const [, name, unit, density, ...values] = fuels.find(row => row[0] === key);
    database.fuels.push({
      id, name, unit, density, type, bio: false,
      ncv: values.slice(0, 3), co2: values.slice(4, 7), ch4: values.slice(7, 10), n2o: values.slice(10, 13),
      source: values[13] + ' · theo file Excel',
    });
  }
  if (!database.gases.some(gas => gas.id === 'R507A') &&
      ['HFC_125', 'HFC_143A'].every(id => database.gases.some(gas => gas.id === id))) {
    const mixture = factorWorkbook.gases[1].rows.find(row => row[0] === 'R507A');
    database.gases.push({
      id: 'R507A', name: 'R-507A', ar4: 3985, ar5: 3985, ar6: mixture[13], u: mixture[14],
      mix: [['HFC_125', mixture[2]], ['HFC_143A', mixture[6]]], source: mixture[16] + ' · theo file Excel',
    });
  }
  database.factorWorkbookVersion = 1;
  return database;
}

function factorWorkbookToggle() {
  const count = factorWorkbook[library].reduce((sum, section) => sum + section.rows.length, 0);
  const active = !workbookView.reference;
  return `<div class="factor-workbook-toggle" role="group" aria-label="Nguồn hệ số">
    ${btn('Đang áp dụng', 'workbook-mode', active ? 'small primary' : 'small', `data-view="active" aria-pressed="${active}"`)}
    ${btn(`Theo file Excel (${count})`, 'workbook-mode', workbookView.reference ? 'small primary' : 'small', `data-view="reference" aria-pressed="${workbookView.reference}"`)}
  </div>`;
}

function workbookValue(value, percent) {
  if (value === null || value === '') return '—';
  if (typeof value !== 'number') return esc(value);
  return (value * (percent ? 100 : 1)).toLocaleString('vi-VN', { maximumSignificantDigits: 15 }) + (percent ? '%' : '');
}

function workbookTableConfig(terms) {
  const rows = factorWorkbook[library].flatMap((section, sectionIndex) =>
    section.rows.map((row, index) => ({ row, index, section, sectionIndex })))
    .filter(({ row, section }) => terms.every(term => normalizeSearch([section.title, ...row].join(' ')).includes(term)));
  return {
    rows,
    columns: [['Hệ số'], ['Nhóm tham chiếu'], ['Nguồn tham chiếu', 'factor-source'], ['Thao tác']],
    cells: ({ row, section, sectionIndex, index }) => [
      `<strong>${esc(row[0])}</strong><span class="annual-number">${esc(row[1])}</span>`,
      esc(section.title),
      `<span class="source-text">${esc(row.at(-1))}</span><span class="annual-number">${esc(section.sheet)} · dòng ${section.start + index}</span>`,
      btn('Xem chi tiết', 'workbook-detail', 'small', `data-section="${sectionIndex}" data-index="${index}" aria-haspopup="dialog"`),
    ],
  };
}

function workbookDetail(button) {
  const section = factorWorkbook[library][Number(button.dataset.section)];
  const index = Number(button.dataset.index);
  const row = section.rows[index];
  modal('Chi tiết hệ số theo Excel', `<h3>${esc(row[0])}</h3>
    <p class="sub">${esc(section.sheet)} · dòng ${section.start + index}</p>
    <dl class="workbook-detail">${section.fields.map(([label, percent], column) =>
      `<div><dt>${esc(label)}</dt><dd>${workbookValue(row[column], percent)}</dd></div>`).join('')}</dl>`, () => false, true);
  const footer = document.querySelector('#modal .modal-foot');
  footer.querySelector('[type="submit"]').remove();
  footer.querySelector('[data-action="close"]').textContent = 'Đóng';
}

function fuelEmissionCell(fuel) {
  const byMass = fuel.unit.toLowerCase() === 'kg';
  const unit = byMass ? 'kg' : esc(fuel.unit);
  const emissionFactors = [fuel.co2[0], fuel.ch4[0], fuel.n2o[0]];
  const perActivity = fuel.ncv[0] === null
    ? 'Chờ nhiệt trị để quy đổi'
    : emissionFactors.map(value => (value * fuel.ncv[0] * fuel.density / 1e6).toLocaleString('vi-VN', {
      maximumSignificantDigits: 8,
    })).join(' / ') + ' kg khí/' + unit;
  return `<div class="fuel-emissions">
    <span>${emissionFactors.map((value, index) => n(value, index === 0 && Number.isInteger(value) ? 0 : 2)).join(' / ')} <small>kg/TJ</small></span>
    <span class="annual-number">${perActivity}</span>
    <span class="annual-number">${byMass ? 'Quy đổi' : 'KLR'} ${n(fuel.density, 3)} kg/${unit}</span>
  </div>`;
}

function factorValues(factor) {
  if (library === 'fuels') {
    const [value, low, high] = factor.ncv;
    return [value === null ? badge('Chờ bổ sung NCV', 'warn') :
      `${n(value, 2)}<span class="annual-number">[${n(low, 2)} – ${n(high, 2)}] TJ/Gg</span>`, fuelEmissionCell(factor)];
  }
  if (library === 'gases') return [
    `${n(factor.ar4, 1)} / ${n(factor.ar5, 1)} / <strong>${n(factor.ar6, 2)}</strong>`, n(factor.u, 2),
  ];
  return [n(factor.value, 4), esc(factor.unit || 'tCO₂/MWh') +
    (factor.u === undefined ? '' : `<span class="annual-number">u = ${n(factor.u)}%</span>`)];
}

function activeFactorTableConfig(terms) {
  const rows = db[library].map(factor => ({ factor, pendingIndex: -1 }));
  if (library === 'fuels') {
    const pendingIndex = energyFuelTemplates.findIndex(fuel => fuel.ncv[0] === null);
    const factor = energyFuelTemplates[pendingIndex];
    if (factor && !rows.some(row => row.factor.id === factor.id)) rows.push({ factor, pendingIndex });
  }
  const valueColumns = {
    fuels: [['NCV [thấp – cao]', 'num'], ['EF CO₂ / CH₄ / N₂O']],
    gases: [['AR4 / AR5 / AR6', 'num'], ['u GWP (AR6)', 'num']],
    other: [['Giá trị', 'num'], ['Đơn vị / u (%)']],
    grid: [['Giá trị', 'num'], ['Đơn vị']],
  };
  return {
    rows: rows.filter(({ factor }) => terms.every(term =>
      normalizeSearch([factor.id, factor.name, factor.year, factor.source].join(' ')).includes(term))),
    columns: [['Hệ số'], ...valueColumns[library], ['Nguồn tham chiếu', 'factor-source'], ['Thao tác']],
    cells: ({ factor, pendingIndex }) => [
      `<strong>${esc(factor.name || 'Lưới điện ' + factor.year)}</strong><span class="annual-number">${esc(factor.id)}${factor.bio ? ' · Sinh khối' : ''}</span>`,
      ...factorValues(factor),
      `<span class="source-text">${esc(factor.source)}</span>`,
      pendingIndex >= 0 ? btn('Bổ sung NCV', 'use-ipcc-fuel', 'small', `data-index="${pendingIndex}"`) :
        `<div class="factor-row-actions">${btn('Sửa', 'edit-factor', 'small', `data-id="${esc(factor.id)}"`)}
        ${btn('Xóa', 'delete-factor', 'small danger', `data-id="${esc(factor.id)}"`)}</div>`,
    ],
  };
}

function factorResults() {
  const terms = normalizeSearch(workbookView.query.trim()).split(/\s+/).filter(Boolean);
  const config = workbookView.reference ? workbookTableConfig(terms) : activeFactorTableConfig(terms);
  return referenceTableResults({ ...config, view: workbookView, label: 'Thư viện hệ số', pageAction: 'factor-page' });
}

function factors() {
  const toolbar = factorWorkbookToggle() +
    referenceTableSearch('factor-query', 'Tìm tên, mã hoặc nguồn tài liệu…', workbookView.query) +
    (workbookView.reference ? '' : btn('+ Thêm hệ số', 'new-factor', 'primary'));
  return `<section class="factor-library">
    ${referenceTableShell({ toolbar, resultsId: 'factor-results', results: factorResults() })}
    ${workbookView.reference ? '<p class="table-caption">Nguồn: He_Thong_Kiem_Ke_KNK_IPCC_AR6_Pro.xlsx.</p>' :
      `${library === 'fuels' ? '<p class="table-caption">Quy đổi theo đơn vị nhập = EF × NCV × kg/đơn vị nhập ÷ 1.000.000. Kết quả là kg của từng khí.</p>' : ''}
      <p class="table-caption">Thay đổi hệ số sẽ tính lại tất cả kỳ đang dùng hệ số đó. Sao lưu trước khi thay đổi để bảo toàn phiên bản tính toán.</p>`}
  </section>`;
}

document.addEventListener('input', event => {
  if (event.target.id !== 'factor-query') return;
  workbookView.query = event.target.value;
  workbookView.page = 1;
  document.querySelector('#factor-results').innerHTML = factorResults();
});

document.addEventListener('click', event => {
  const pager = event.target.closest('[data-action="factor-page"]');
  if (pager) {
    moveReferencePage(pager, workbookView, 'factor-results', factorResults);
    return;
  }
  const detail = event.target.closest('[data-action="workbook-detail"]');
  if (detail) {
    workbookDetail(detail);
    return;
  }
  const fuel = event.target.closest('[data-action="use-ipcc-fuel"]');
  if (fuel) {
    useFactorTemplate(energyFuelTemplates[Number(fuel.dataset.index)]);
    return;
  }
  const option = event.target.closest('[data-action="workbook-mode"]');
  if (!option) return;
  workbookView.reference = option.dataset.view === 'reference';
  Object.assign(workbookView, { query: '', page: 1 });
  render();
  document.querySelector('[data-action="workbook-mode"][aria-pressed="true"]')?.focus({ preventScroll: true });
});
