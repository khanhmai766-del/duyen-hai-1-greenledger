'use strict';

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
