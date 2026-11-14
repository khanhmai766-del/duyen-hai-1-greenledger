'use strict';

// Nút tách đôi "Thao tác chính | ⌄": nút trái chạy thao tác chính, nút mũi tên mở menu các thao tác liên quan.
// Dùng chung cho bản Web và Desktop. Các mục menu mang data-action nên trình xử lý click của app.js chạy như nút thường.
// items: [[nhãn, action, class, thuộc tính thêm], ...]
function splitButton({ label, action, cls = '', extra = '', menuLabel, items }) {
  const menu = items.map(([text, itemAction, itemCls = '', itemExtra = '']) =>
    btn(text, itemAction, itemCls, `role="menuitem" tabindex="-1" ${itemExtra}`)).join('');
  return `<div class="split-button${cls ? ' ' + cls : ''}">
    ${btn(label, action, `split-main ${cls}`, extra)}
    <button type="button" class="split-toggle ${cls}" data-split-toggle aria-haspopup="menu" aria-expanded="false" aria-label="${esc(menuLabel)}" title="${esc(menuLabel)}">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
    </button>
    <div class="split-menu" role="menu" aria-label="${esc(menuLabel)}" hidden>${menu}</div>
  </div>`;
}

// Xuất kỳ đang mở: in/lưu PDF là thao tác chính, Excel và CSV nằm trong menu.
function exportSplitButton(cls = 'primary') {
  return splitButton({ label: 'In / Lưu PDF', action: 'print', cls, menuLabel: 'Định dạng xuất khác',
    items: [['Tải Excel .xlsx', 'xlsx'], ['Tải bảng CSV', 'csv']] });
}

function splitMenuItems(menu) {
  return [...menu.querySelectorAll('[role="menuitem"]:not([disabled])')];
}

function closeSplitMenus(except) {
  for (const menu of document.querySelectorAll('.split-menu:not([hidden])')) {
    if (menu === except) continue;
    menu.hidden = true;
    menu.parentElement.querySelector('[data-split-toggle]')?.setAttribute('aria-expanded', 'false');
  }
}

function openSplitMenu(toggle, focusLast = false) {
  const menu = toggle.parentElement.querySelector('.split-menu');
  closeSplitMenus(menu);
  menu.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  // Menu tràn ra ngoài màn hình thì đổi sang canh phía còn lại.
  menu.style.left = menu.style.right = '';
  const box = menu.getBoundingClientRect();
  if (box.right > document.documentElement.clientWidth) Object.assign(menu.style, { left: 'auto', right: '0' });
  else if (box.left < 0) Object.assign(menu.style, { left: '0', right: 'auto' });
  const items = splitMenuItems(menu);
  (focusLast ? items.at(-1) : items[0])?.focus();
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-split-toggle]');
  if (toggle) {
    if (toggle.getAttribute('aria-expanded') === 'true') closeSplitMenus();
    else openSplitMenu(toggle);
    return;
  }
  // Bấm một mục trong menu hoặc bấm ra ngoài thì đóng menu; thao tác của mục do app.js xử lý.
  closeSplitMenus();
});

document.addEventListener('keydown', event => {
  const toggle = event.target.closest?.('[data-split-toggle]');
  if (toggle && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    openSplitMenu(toggle, event.key === 'ArrowUp');
    return;
  }
  const menu = event.target.closest?.('.split-menu');
  if (!menu) {
    if (event.key === 'Escape') closeSplitMenus();
    return;
  }
  const items = splitMenuItems(menu);
  const index = items.indexOf(event.target);
  const owner = menu.parentElement.querySelector('[data-split-toggle]');
  const move = next => { event.preventDefault(); items[(next + items.length) % items.length]?.focus(); };
  if (event.key === 'ArrowDown') move(index + 1);
  else if (event.key === 'ArrowUp') move(index - 1);
  else if (event.key === 'Home') move(0);
  else if (event.key === 'End') move(items.length - 1);
  else if (event.key === 'Escape') { event.preventDefault(); closeSplitMenus(); owner?.focus(); }
  else if (event.key === 'Tab') closeSplitMenus();
});
