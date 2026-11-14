'use strict';

const ipccView = { mode: 'ncv', edition: '', query: '', page: 1, data: null, status: 'initial' };
const ipccPageSize = 15;
const ipccEditions = { '2006': 'IPCC 2006', '2019': 'Bổ sung 2019', GWP: 'GWP / AR6' };
const ncvMatches = {
  'Gas/Diesel Oil': ['dầu DO diesel', ['DO_STAT', 'DO_ROAD', 'DO_OFFROAD']],
  'Motor Gasoline': ['xăng động cơ', ['GAS_STAT', 'GAS_UNCTRL', 'GAS_CAT', 'GAS_LDV95', 'GAS_4S_OFF']],
  'Liquefied Petroleum Gases': ['khí hóa lỏng LPG', ['LPG_STAT']],
  'Natural Gas': ['khí tự nhiên', ['NAT_GAS']],
  'Sub-Bituminous Coal': ['than á bitum', ['COAL_SUB']],
  'Other Bituminous Coal': ['than bitum'],
  Anthracite: ['than antraxit'],
  'Wood/Wood Waste': ['gỗ sinh khối', ['BIOMASS']],
};

function pdfButton(path, page, label) {
  return btn(label || `Xem trang ${page}`, 'ipcc-pdf', 'small', `data-file="${esc(path)}" data-page="${page}"`);
}

function ipccSearch(...parts) {
  return normalizeSearch(parts.join(' ').replace(/_/g, ' '));
}

function ipccDocKeywords(file) {
  return [
    [/wastewater/i, 'nước thải'],
    [/combustion/i, 'đốt nhiên liệu hệ số phát thải'],
    [/stationary/i, 'đốt cố định'],
    [/mobile/i, 'đốt di động'],
    [/uncertaint/i, 'độ không đảm bảo đo độ không chắc chắn'],
    [/ods|warming|chapter07/i, 'môi chất lạnh gwp'],
    [/n2o.*co2/i, 'urê phân bón'],
  ].filter(([pattern]) => pattern.test(file)).map(([, text]) => text).join(' ');
}

function ncvTable(data, rows) {
  const [file] = data.documents[data.ncvDocument];
  const number = value => value == null ? 'NA' : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return `<div class="table-wrap"><table class="activity-table ipcc-ncv">
    <thead><tr><th>Nhiên liệu</th><th class="num">NCV (TJ/Gg)</th><th class="num">Cận dưới</th><th class="num">Cận trên</th><th>NCV trong thư viện GreenLedger</th><th>Nguồn</th></tr></thead>
    <tbody>${rows.map(([name, value, low, high, page]) => {
      const [alias, ids = []] = ncvMatches[name] || [];
      const matches = ids.map(id => db.fuels.find(fuel => fuel.id === id)).filter(Boolean);
      const library = matches.map(fuel => `<div>${esc(fuel.id)} · ${fuel.ncv.map(number).join(' / ')}</div>`).join('');
      return `<tr><td><strong>${esc(name)}</strong>${alias ? `<span class="annual-number">${esc(alias)}</span>` : ''}</td>
      <td class="num">${number(value)}</td><td class="num">${number(low)}</td><td class="num">${number(high)}</td>
      <td>${library || '—'}</td><td>${ipccFuelActions(name, pdfButton(file, page))}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function ipccCatalog(data, rows, mode) {
  return `<div class="table-wrap"><table class="activity-table ipcc-catalog">
    <thead><tr><th>${mode === 'tables' ? 'Bảng / nội dung' : 'Tài liệu'}</th><th>Ấn bản</th><th>Trang</th><th>Tra cứu</th></tr></thead>
    <tbody>${rows.map(row => {
      const [path, file, edition, size] = mode === 'tables' ? data.documents[row[0]] : row;
      const pages = mode === 'tables' ? row[3] : [1];
      const topic = mode === 'tables' ? `<strong>Bảng ${esc(row[1])} · ${esc(row[2])}</strong><span class="annual-number">${esc(file)}</span>` : `<strong>${esc(file)}</strong>`;
      const actions = pages.map(page => pdfButton(path, page, mode === 'tables' ? 'Xem ' + page : 'Xem nội dung')).join('');
      return `<tr><td>${topic}</td><td>${esc(ipccEditions[edition])}</td><td>${mode === 'tables' ? pages.join(', ') : size + ' trang'}</td><td><div class="ipcc-page-links">${actions}</div></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function ipccResults() {
  const { mode, edition, data, query } = ipccView;
  const needle = ipccSearch(query).trim();
  const terms = needle.replace(/^(?:bang|table)\s+/, '').split(/\s+/).filter(Boolean);
  const matches = (...parts) => terms.every(term => ipccSearch(...parts).includes(term));
  let rows;
  if (mode === 'ncv') rows = data.ncv.filter(([name]) => matches(name, ...(ncvMatches[name] || []), 'Bảng 1.2 NCV'));
  else if (mode === 'tables') rows = data.tables.filter(([id, code, title]) => {
    const [, file, version] = data.documents[id];
    return (!edition || edition === version) && matches(code, title, file, ipccDocKeywords(file), ipccEditions[version]);
  });
  else rows = data.documents.filter(([, file, version]) =>
    (!edition || edition === version) && matches(file, ipccDocKeywords(file), ipccEditions[version]));
  const last = Math.max(1, Math.ceil(rows.length / ipccPageSize));
  const page = ipccView.page = Math.min(ipccView.page, last);
  const start = (page - 1) * ipccPageSize;
  const visible = rows.slice(start, start + ipccPageSize);
  const table = mode === 'ncv' ? ncvTable(data, visible) : ipccCatalog(data, visible, mode);
  return `${visible.length ? table : '<p class="empty">Không tìm thấy kết quả phù hợp.</p>'}
    <div class="activity-table-footer"><span role="status">${rows.length ? `${start + 1}–${start + visible.length} / ` : ''}${rows.length} kết quả</span>
      <nav class="activity-pagination" aria-label="Phân trang tra cứu IPCC">
        ${btn('‹', 'ipcc-page', 'small activity-page-button', `data-step="-1" aria-label="Trang trước" ${page === 1 ? 'disabled' : ''}`)}
        <span class="activity-page-number">${page} / ${last}</span>
        ${btn('›', 'ipcc-page', 'small activity-page-button', `data-step="1" aria-label="Trang sau" ${page === last ? 'disabled' : ''}`)}
      </nav>
    </div>`;
}

function loadIpccIndex() {
  ipccView.status = 'loading';
  fetch('ipcc-index.json').then(response => {
    if (!response.ok) throw Error('Không tìm thấy mục lục');
    return response.json();
  }).then(data => {
    ipccView.data = data;
    ipccView.status = 'ready';
  }).catch(() => { ipccView.status = 'error'; }).finally(() => { if (tab === 6) render(); });
}

function ipccOptions() {
  return headerOptions(
    [['ncv', 'Nhiệt trị · Bảng 1.2'], ['tables', 'Tất cả bảng'], ['documents', 'Duyệt theo tài liệu']],
    'ipcc-mode', ipccView.mode, 'Chế độ tra cứu IPCC'
  );
}

function ipccPage() {
  if (ipccView.status === 'initial') loadIpccIndex();
  if (ipccView.status !== 'ready') return `<section class="panel">${ipccView.status === 'error'
    ? `<p>Chưa mở được mục lục IPCC.</p>${btn('Thử lại', 'ipcc-retry', 'small')}`
    : '<p role="status">Đang mở mục lục IPCC…</p>'}</section>`;
  const { mode, edition, query } = ipccView;
  return `<section class="ipcc-library">
    <div class="activity-table-shell">
      <div class="activity-table-toolbar ipcc-toolbar">
        <label>Tìm kiếm <input id="ipcc-query" type="search" placeholder="${mode === 'ncv' ? 'Dầu DO, than, biomass…' : 'Số bảng, nước thải, tên tài liệu…'}" value="${esc(query)}"></label>
        ${mode === 'ncv' ? '' : `<label>Ấn bản <select id="ipcc-edition"><option value="">Tất cả</option>${Object.entries(ipccEditions).map(([id, label]) => `<option value="${id}" ${edition === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`}
      </div>
      <div id="ipcc-results">${ipccResults()}</div>
    </div>
  </section>`;
}

document.addEventListener('input', event => {
  if (event.target.id !== 'ipcc-query') return;
  ipccView.query = event.target.value;
  ipccView.page = 1;
  document.querySelector('#ipcc-results').innerHTML = ipccResults();
});

document.addEventListener('change', event => {
  if (event.target.id !== 'ipcc-edition') return;
  ipccView.edition = event.target.value;
  ipccView.page = 1;
  document.querySelector('#ipcc-results').innerHTML = ipccResults();
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action^="ipcc-"]');
  if (!button) return;
  switch (button.dataset.action) {
    case 'ipcc-mode':
      Object.assign(ipccView, { mode: button.dataset.mode, query: '', page: 1 });
      render();
      document.querySelector('[data-action="ipcc-mode"][aria-pressed="true"]')?.focus();
      break;
    case 'ipcc-page':
      ipccView.page = Math.max(1, ipccView.page + Number(button.dataset.step));
      document.querySelector('#ipcc-results').innerHTML = ipccResults();
      document.querySelector('#ipcc-query').focus();
      break;
    case 'ipcc-use-fuel':
      openIpccFuel(Number(button.dataset.fuelIndex));
      break;
    case 'ipcc-pdf':
      showIpccContent(button.dataset.file, Number(button.dataset.page));
      break;
    case 'ipcc-retry':
      ipccView.status = 'initial';
      render();
      break;
  }
});
