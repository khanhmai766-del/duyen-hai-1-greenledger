'use strict';

const activityUncertaintyPresets = [
  ['custom', 'Tùy chỉnh'],
  ['u-shape', 'U-shape theo tài liệu (u = a / 2)'],
  ['calibration', 'Giấy hiệu chuẩn (U / k)'],
  ['rectangular', 'Giới hạn sai số (a / √3)'],
  ['triangular', 'Phân bố tam giác (a / √6)'],
  ['scale', 'Cân theo MPE hoặc độ chia'],
  ['repeat', 'Dãy đo lặp (loại A)'],
  ['pump', 'Trụ bơm: 0,5% / √3'],
  ['scale5', 'Cân 5 tấn: e = 5 kg'],
  ['scale50', 'Cân 50 tấn: e = 15 kg'],
  ['electric', 'Công tơ điện: u = 0,1%'],
];

const activityNumericMethods = {
  'u-shape': [['limit', 'Giới hạn sai số ±a (%)']],
  calibration: [['expanded', 'U mở rộng (%)'], ['k', 'Hệ số phủ k trên giấy hiệu chuẩn']],
  rectangular: [['limit', 'Giới hạn sai số ±a (%)']],
  triangular: [['limit', 'Giới hạn sai số ±a (%)']],
  scale: [['scaleValue', 'MPE hoặc một độ chia (kg)'], ['mass', 'Khối lượng cân tương ứng (kg)']],
};

function activityStandardUncertainty(method, data) {
  const inputs = activityNumericMethods[method] || [];
  if (inputs.some(([name]) => data[name] == null || data[name] === '' || !Number.isFinite(Number(data[name])) || Number(data[name]) < 0)) return NaN;
  if (method === 'calibration') return Number(data.k) > 0 ? Number(data.expanded) / Number(data.k) : NaN;
  if (method === 'scale') return Number(data.mass) > 0 ? 100 * Number(data.scaleValue) * (data.scaleBasis === 'mpe' ? 1.5 : .5) / Math.sqrt(3) / Number(data.mass) : NaN;
  if (method === 'repeat') {
    const values = String(data.samples || '').trim().split(/[;\s]+/).filter(Boolean).map(value => Number(value.replace(',', '.')));
    if (values.length < 2 || values.some(value => !Number.isFinite(value) || value < 0)) return NaN;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (!(average > 0)) return NaN;
    return E.sd(values) / (data.repeatMean === 'mean' ? Math.sqrt(values.length) : 1) / average * 100;
  }
  return Number(data.limit) / ({ 'u-shape': 2, rectangular: Math.sqrt(3), triangular: Math.sqrt(6) }[method]);
}

function activityUncertaintyFields(row) {
  const method = row.adMethod || (row.adHalfWidth !== undefined ? 'u-shape' : 'custom');
  const values = row.adInputs || { limit: row.adHalfWidth };
  const panels = Object.entries(activityNumericMethods).map(([id, fields]) => `<div class="span2" data-ad-method="${id}" hidden><div class="form-grid">
    ${fields.map(([name, label]) => field(label, id + '-' + name, values[name], 'number', 'min="0" step="any" required')).join('')}
    ${id === 'scale' ? selectField('Cơ sở tính', 'scaleBasis', [['division', 'Một độ chia d · d / (2√3)'], ['mpe', 'MPE · 1,5 × MPE / √3 theo slide']], values.scaleBasis || 'division') : ''}
  </div></div>`).join('');
  return selectField('Cách xác định u số liệu hoạt động', 'preset', activityUncertaintyPresets, method)
    + field('u số liệu hoạt động chuẩn (%)', 'ad', row.ad, 'number', 'min="0" step="any" required')
    + panels
    + `<div class="span2" data-ad-method="repeat" hidden>
      <label class="field">Giá trị đo lặp cùng đơn vị<textarea name="samples" required placeholder="Ví dụ: 99,8; 100; 100,2">${esc(values.samples)}</textarea></label>
      ${selectField('Đại lượng báo cáo', 'repeatMean', [['mean', 'Trung bình phép đo · s / √n'], ['single', 'Một phép đo · s']], values.repeatMean || 'mean')}
    </div>`
    + field('Mã nhóm sai số AD dùng chung (nếu có)', 'adGroup', row.adGroup, 'text', 'maxlength="80"');
}

function bindActivityUncertainty(form) {
  const { preset, ad } = form.elements;
  const panels = [...form.querySelectorAll('[data-ad-method]')];
  const suggestions = {
    pump: .5 / Math.sqrt(3),
    scale5: 5 / Math.sqrt(3) / 5000 * 100,
    scale50: 15 / Math.sqrt(3) / 50000 * 100,
    electric: .1,
  };
  let previousValue = ad.value;
  const update = () => {
    if (!ad.readOnly) return;
    const value = activityStandardUncertainty(preset.value, activityMethodData(new FormData(form), preset.value));
    ad.value = Number.isFinite(value) ? value : '';
  };
  const applyPreset = () => {
    for (const panel of panels) {
      panel.hidden = panel.dataset.adMethod !== preset.value;
      for (const element of panel.querySelectorAll('input, select, textarea')) element.disabled = panel.hidden;
    }
    ad.readOnly = panels.some(panel => !panel.hidden);
    if (ad.readOnly) {
      if (ad.value !== '') previousValue = ad.value;
      update();
    } else if (Object.hasOwn(suggestions, preset.value)) {
      ad.value = suggestions[preset.value];
    } else if (ad.value === '') {
      ad.value = previousValue;
    }
  };
  preset.addEventListener('change', applyPreset);
  for (const panel of panels) {
    panel.addEventListener('input', update);
    panel.addEventListener('change', update);
  }
  applyPreset();
}

function activityMethodData(data, method) {
  const result = Object.fromEntries((activityNumericMethods[method] || []).map(([name]) => [name, data.get(method + '-' + name)]));
  if (method === 'scale') result.scaleBasis = data.get('scaleBasis');
  if (method === 'repeat') Object.assign(result, { samples: data.get('samples'), repeatMean: data.get('repeatMean') });
  return result;
}

function readActivityUncertainty(data, row) {
  delete row.adHalfWidth;
  delete row.adMethod;
  delete row.adInputs;
  const method = data.get('preset');
  if (Object.hasOwn(activityNumericMethods, method) || method === 'repeat') {
    row.adMethod = method;
    row.adInputs = activityMethodData(data, method);
    row.ad = activityStandardUncertainty(method, row.adInputs);
  }
  row.adGroup = String(data.get('adGroup') || '').trim();
}

function isCylinderSource(row) {
  return row.group === 5 && row.factor === 'CO2' && row.mode === 'annual';
}

function cylinderFields(row, amountLabel) {
  const cylinders = row.pcccInput === 'cylinders';
  return selectField('Cách nhập CO₂ chữa cháy', 'pcccInput', [['direct', 'Tổng kg CO₂ đã xả'], ['cylinders', 'Số bình × kg CO₂ đã xả mỗi bình']], cylinders ? 'cylinders' : 'direct') +
    (cylinders ? `<div class="form-grid">${field('Số bình đã xả', 'pcccCount', row.pcccCount, 'number', 'min="0" step="1" required')}
    ${field('CO₂ đã xả mỗi bình (kg)', 'pcccKg', row.pcccKg, 'number', 'min="0" step="any" required')}</div>`
      : field(amountLabel, 'amount', row.amount, 'number', 'min="0" step="any" required'));
}

function readCylinderInput(data, row) {
  if (isCylinderSource(row) && data.get('pcccInput') === 'cylinders') {
    row.pcccInput = 'cylinders';
    row.pcccCount = data.get('pcccCount') ?? '';
    row.pcccKg = data.get('pcccKg') ?? '';
    row.amount = Number(row.pcccCount) * Number(row.pcccKg);
  } else if (isCylinderSource(row)) {
    delete row.pcccInput;
    delete row.pcccCount;
    delete row.pcccKg;
  }
}

const activityView = { periodId: null, query: '', size: 20, page: 1 };
const overviewView = { periodId: null, query: '', size: 10, page: 1 };

function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
}

function activities(summary) {
  if (activityView.periodId !== p().id) Object.assign(activityView, { periodId: p().id, query: '', page: 1 });
  return `<section class="panel activity-panel">
    <div class="toolbar"><div><h2>Sổ dữ liệu hoạt động</h2><p class="sub">Nhập tổng năm hoặc số liệu 12 tháng. Kết quả được tính lại khi lưu.</p></div>${btn('+ Thêm nguồn phát thải', 'new-row', 'primary')}</div>
    ${sourceTable(summary, activityView, true)}
    <p class="table-caption">Sai số nhập theo độ không đảm bảo đo chuẩn tương đối u (%). Chứng từ và thiết bị được lưu cùng từng dòng.</p>
  </section>`;
}

function overviewSources(summary) {
  if (overviewView.periodId !== p().id) Object.assign(overviewView, { periodId: p().id, page: 1 });
  return sourceTable(summary, overviewView, false);
}

function sourceTable(summary, view, editable) {
  const query = normalizeSearch(view.query.trim());
  const filtered = summary.rows.filter(({ row }) => !query || normalizeSearch([row.name, row.evidence, row.factor, row.device, E.groups[row.group]].join(' ')).includes(query));
  const pages = Math.max(1, Math.ceil(filtered.length / view.size));
  view.page = Math.min(view.page, pages);
  const start = (view.page - 1) * view.size;
  const rows = filtered.slice(start, start + view.size);
  const pager = (text, label, page, disabled) => btn(text, editable ? 'activity-page' : 'overview-page', 'small activity-page-button', `aria-label="${label}" title="${label}" data-page="${page}" ${disabled ? 'disabled' : ''}`);
  const tableRows = rows.map((result, index) => {
    const row = result.row;
    const amount = result.amount ?? (row.mode === 'monthly' ? row.months.reduce((sum, value) => sum + value, 0) : row.amount);
    const id = esc(row.id);
    return `<tr><td class="activity-index">${start + index + 1}</td>
      <td><strong>${esc(row.name)}</strong><span class="annual-number">${esc(row.evidence || 'Chưa thêm chứng từ')}</span></td>
      <td>${E.groups[row.group]}</td><td class="num no-wrap">${n(amount,2)} ${esc(unit(row))}</td>
      <td class="num"><strong>${result.error ? 'Lỗi hệ số' : n(result.total,4)}</strong></td><td class="num">${result.error ? '—' : n(result.U,4)}</td>
      <td>${editable ? `<div class="activity-row-actions">${btn('Sửa', 'edit-row', 'small', `data-id="${id}" aria-label="Sửa ${esc(row.name)}"`)}${btn('Xóa', 'delete-row', 'small danger', `data-id="${id}" aria-label="Xóa ${esc(row.name)}"`)}</div>` : badge(row.group === 7 ? 'Phạm vi 2' : 'Phạm vi 1', row.group === 7 ? 'blue' : '')}</td></tr>`;
  }).join('');
  const first = view.page === 1;
  const last = view.page === pages;
  return `<div class="activity-table-shell">
      ${editable ? `<div class="activity-table-toolbar">
        <label class="activity-page-size">Hiển thị <select id="activity-page-size" aria-label="Số dòng mỗi trang">${[10,20].map(size => `<option value="${size}" ${view.size === size ? 'selected' : ''}>${size}</option>`).join('')}</select> dòng</label>
        <label class="activity-search">Tìm kiếm <input id="activity-search" type="search" autocomplete="off" placeholder="Tên nguồn, mã, chứng từ…" value="${esc(view.query)}"></label>
      </div>` : ''}
      <div class="table-wrap"><table class="activity-table" aria-label="${editable ? 'Số liệu hoạt động' : 'Nguồn phát thải trong kỳ'}">
        <thead><tr><th scope="col" class="activity-index">STT</th><th scope="col">Nguồn phát thải</th><th scope="col">Nhóm nguồn</th><th scope="col" class="num">Số liệu hoạt động</th><th scope="col" class="num">Phát thải (tCO₂e)</th><th scope="col" class="num">U 95% (± tCO₂e)</th><th scope="col"${editable ? ' class="activity-actions-heading"' : ''}>${editable ? 'Thao tác' : 'Phạm vi'}</th></tr></thead>
        <tbody>${tableRows || `<tr><td colspan="7" class="activity-empty">${summary.rows.length ? 'Không có nguồn phù hợp. Hãy thử từ khóa khác.' : 'Chưa có nguồn phát thải trong kỳ này.'}${editable ? '' : ' ' + btn('+ Thêm nguồn', 'new-row', 'small primary')}</td></tr>`}</tbody>
      </table></div>
      <div class="activity-table-footer"><span role="status">Hiển thị ${rows.length ? start + 1 : 0}–${start + rows.length} trong tổng số ${filtered.length} bản ghi${query ? ' phù hợp' : ''}</span>
        <nav class="activity-pagination" aria-label="${editable ? 'Phân trang số liệu hoạt động' : 'Phân trang nguồn phát thải trong kỳ'}">
          ${pager('«', 'Trang đầu', 1, first)}${pager('‹', 'Trang trước', view.page - 1, first)}
          <span class="activity-page-number" aria-current="page">${view.page} / ${pages}</span>
          ${pager('›', 'Trang sau', view.page + 1, last)}${pager('»', 'Trang cuối', pages, last)}
        </nav>
      </div>
    </div>`;
}

function refreshActivities(control, position) {
  const y = window.scrollY;
  render();
  const next = document.getElementById(control);
  if (next) {
    next.focus({ preventScroll: true });
    if (position != null) next.setSelectionRange(position, position);
  }
  window.scrollTo(0, y);
}

function searchActivities(event) {
  if (event.target.id !== 'activity-search' || event.isComposing) return;
  activityView.query = event.target.value;
  activityView.page = 1;
  refreshActivities('activity-search', event.target.selectionStart);
}

document.addEventListener('input', searchActivities);
document.addEventListener('compositionend', searchActivities);
document.addEventListener('change', event => {
  if (event.target.id !== 'activity-page-size') return;
  activityView.size = Number(event.target.value) === 10 ? 10 : 20;
  activityView.page = 1;
  refreshActivities('activity-page-size');
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action="activity-page"], [data-action="overview-page"]');
  if (!button || button.disabled) return;
  const label = button.getAttribute('aria-label');
  const view = button.dataset.action === 'overview-page' ? overviewView : activityView;
  view.page = Math.max(1, Number(button.dataset.page));
  render();
  const available = [...document.querySelectorAll('.activity-pagination button:not(:disabled)')];
  const next = available.find(item => item.getAttribute('aria-label') === label) || available[0];
  next?.focus({ preventScroll: true });
  document.querySelector('.activity-table-shell')?.scrollIntoView({ block: 'start' });
});
