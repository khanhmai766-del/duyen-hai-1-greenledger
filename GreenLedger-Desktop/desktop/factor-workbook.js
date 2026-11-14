'use strict';

const workbookView = { reference: false, group: null, query: '' };

function setActiveFactorQuery(query) {
  filter = query;
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

function workbookRows() {
  const terms = normalizeSearch(workbookView.query.trim()).split(/\s+/).filter(Boolean);
  let total = 0;
  const sections = factorWorkbook[library].map(section => {
    const items = section.rows.map((row, i) => {
      const haystack = normalizeSearch([section.title, ...row].join(' '));
      if (!terms.every(term => haystack.includes(term))) return '';
      total++;
      return `<details class="workbook-factor">
        <summary><strong>${esc(row[0])}</strong><span>${esc(row[1])}</span></summary>
        <dl>${section.fields.map(([label, percent], col) => `<div><dt>${esc(label)}</dt><dd>${workbookValue(row[col], percent)}</dd></div>`).join('')}</dl>
        <p class="sub">${esc(section.sheet)} · dòng ${section.start + i}</p>
      </details>`;
    }).join('');
    return items ? `<section class="workbook-section"><h3>${esc(section.title)}</h3>${items}</section>` : '';
  }).join('');
  return `<p class="sub" role="status">${total} dòng tra cứu</p>${sections || '<p class="empty">Không tìm thấy hệ số trong nhóm này.</p>'}`;
}

function factorWorkbookPage() {
  if (workbookView.group !== library) {
    workbookView.group = library;
    workbookView.query = '';
  }
  return `<section class="panel">
    <div class="toolbar">${factorWorkbookToggle()}
      <input id="workbook-search" type="search" class="search" placeholder="Tìm tên, mã, nguồn tài liệu…" aria-label="Tìm hệ số theo Excel" value="${esc(workbookView.query)}">
    </div>
    <p class="sub">Giá trị tham chiếu từ He_Thong_Kiem_Ke_KNK_IPCC_AR6_Pro.xlsx. Mở từng dòng để xem hệ số, khoảng giá trị và nguồn trích dẫn.</p>
    <div id="workbook-results">${workbookRows()}</div>
  </section>`;
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
  return `<td class="fuel-emissions">
    <span>${emissionFactors.map((value, index) => n(value, index === 0 && Number.isInteger(value) ? 0 : 2)).join(' / ')} <small>kg/TJ</small></span>
    <span class="annual-number">${perActivity}</span>
    <span class="annual-number">${byMass ? 'Quy đổi' : 'KLR'} ${n(fuel.density, 3)} kg/${unit}</span>
  </td>`;
}

function pendingIpccFuelRow() {
  if (library !== 'fuels') return '';
  const index = energyFuelTemplates.findIndex(fuel => fuel.ncv[0] === null);
  const fuel = energyFuelTemplates[index];
  if (!fuel || db.fuels.some(entry => entry.id === fuel.id)) return '';
  const needle = normalizeSearch(filter.trim());
  if (!normalizeSearch([fuel.name, fuel.id, fuel.source].join(' ')).includes(needle)) return '';
  return `<tr>
    <td><strong>${esc(fuel.name)}</strong><span class="annual-number">${esc(fuel.id)}</span></td>
    <td>${badge('Chờ bổ sung NCV', 'warn')}</td>${fuelEmissionCell(fuel)}
    <td><span class="source-text">${esc(fuel.source)}</span></td>
    <td>${btn('Bổ sung NCV', 'use-ipcc-fuel', 'small', `data-index="${index}"`)}</td>
  </tr>`;
}

document.addEventListener('input', event => {
  if (event.target.id !== 'workbook-search') return;
  workbookView.query = event.target.value;
  document.querySelector('#workbook-results').innerHTML = workbookRows();
});

document.addEventListener('click', event => {
  const fuel = event.target.closest('[data-action="use-ipcc-fuel"]');
  if (fuel) {
    useFactorTemplate(energyFuelTemplates[Number(fuel.dataset.index)]);
    return;
  }
  const option = event.target.closest('[data-action="workbook-mode"]');
  if (!option) return;
  workbookView.reference = option.dataset.view === 'reference';
  workbookView.query = '';
  render();
  document.querySelector('[data-action="workbook-mode"][aria-pressed="true"]')?.focus({ preventScroll: true });
});
