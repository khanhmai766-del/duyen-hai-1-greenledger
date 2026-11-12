'use strict';

const referencePageSize = 15;

function referenceTableShell({ toolbar, resultsId, results }) {
  return `<div class="activity-table-shell reference-table-shell">
    <div class="activity-table-toolbar reference-table-toolbar">${toolbar}</div>
    <div id="${resultsId}">${results}</div>
  </div>`;
}

function referenceTableSearch(id, placeholder, value) {
  return `<label class="reference-table-search">Tìm kiếm
    <input id="${id}" type="search" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(value)}">
  </label>`;
}

function referenceTableResults({ rows, view, columns, cells, label, tableClass = '', pageAction }) {
  const last = Math.max(1, Math.ceil(rows.length / referencePageSize));
  const page = view.page = Math.min(Math.max(1, view.page), last);
  const start = (page - 1) * referencePageSize;
  const visible = rows.slice(start, start + referencePageSize);
  const pageButton = (text, name, step, disabled) => btn(text, pageAction, 'small activity-page-button',
    `data-step="${step}" aria-label="${name}" ${disabled ? 'disabled' : ''}`);
  const table = `<div class="table-wrap"><table class="activity-table reference-table ${tableClass}" aria-label="${esc(label)}">
    <thead><tr>${columns.map(([name, cls = '']) => `<th scope="col" class="${cls}">${esc(name)}</th>`).join('')}</tr></thead>
    <tbody>${visible.length ? visible.map(row => `<tr>${cells(row).map((cell, i) =>
      `<td class="${columns[i][1] || ''}">${cell}</td>`).join('')}</tr>`).join('')
      : `<tr><td class="activity-empty" colspan="${columns.length}">Không tìm thấy kết quả phù hợp.</td></tr>`}</tbody>
    </table></div>`;
  return `${table}<div class="activity-table-footer"><span role="status">${visible.length ? `${start + 1}–${start + visible.length} / ` : ''}${rows.length} kết quả</span>
    <nav class="activity-pagination" aria-label="${esc('Phân trang ' + label)}">
      ${pageButton('‹', 'Trang trước', -1, page === 1)}
      <span class="activity-page-number" aria-current="page">${page} / ${last}</span>
      ${pageButton('›', 'Trang sau', 1, page === last)}
    </nav></div>`;
}

function moveReferencePage(button, view, resultsId, renderResults) {
  const target = document.getElementById(resultsId);
  view.page += Number(button.dataset.step);
  target.innerHTML = renderResults();
  const preferred = target.querySelector(`[data-step="${button.dataset.step}"]:enabled`);
  (preferred || target.querySelector('[data-step]:enabled'))?.focus({ preventScroll: true });
}
