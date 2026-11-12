'use strict';

const splitTabs = [1, 4, 6];
let splitEnabled = false;

function splitWorkspaceVisible() {
  return splitEnabled && splitTabs.includes(tab);
}

function renderSplitWorkspace(summary, content) {
  return splitWorkspaceVisible() ? splitWorkspace(summary, content) : content;
}

function splitWorkspaceToggle() {
  if (tab !== 2 && !splitTabs.includes(tab)) return '';
  const visible = splitWorkspaceVisible();
  return btn(visible ? 'Đóng chế độ chia khung' : 'Chia hai khung', 'split-workspace', 'method-button',
    `aria-pressed="${visible}"`);
}

function splitWorkspace(summary, leftContent) {
  return `<section class="split-workspace" aria-label="Không gian tính toán hai khung">
    <section class="split-pane">
      <header class="split-pane-header">
        <div class="split-pane-tabs" role="group" aria-label="Nội dung khung trái">
          ${splitTabs.map(id => btn(esc(names[id]), 'tab', 'small ' + (id === tab ? 'primary' : ''),
            `data-tab="${id}" aria-pressed="${id === tab}"`)).join('')}
        </div>
      </header>
      <div class="split-scroll" data-split-left="${tab}" tabindex="0" aria-label="${esc(names[tab])}">${leftContent}</div>
    </section>
    <section class="split-pane">
      <header class="split-pane-header split-calculation-head">
        <div><h2>Tính toán &amp; ĐKĐBĐ</h2><span class="sub"><strong>${n(summary.total, 4)}</strong> tCO₂e · U 95% ± ${n(summary.percent)}%</span></div>
        ${btn('Phương pháp', 'calc-method', 'small', 'aria-haspopup="dialog"')}
      </header>
      <div class="split-scroll split-calculation" tabindex="0" aria-label="Kết quả và chi tiết tính toán">
        ${calculations(summary, true)}
      </div>
    </section>
  </section>`;
}

function captureSplitScroll() {
  const left = document.querySelector('[data-split-left]');
  const right = document.querySelector('.split-calculation');
  return {
    left: left?.dataset.splitLeft === String(tab) ? left.scrollTop : 0,
    right: right?.scrollTop || 0,
    filters: !!right?.querySelector('.split-calculation-filters')?.open,
  };
}

function restoreSplitScroll(state) {
  const left = document.querySelector('[data-split-left]');
  const right = document.querySelector('.split-calculation');
  if (!left || !right) return;
  right.querySelector('.split-calculation-filters').open = state.filters;
  left.scrollTop = state.left;
  right.scrollTop = state.right;
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-action="split-workspace"]');
  if (!toggle) return;
  splitEnabled = !splitWorkspaceVisible();
  if (splitEnabled && tab === 2) tab = 1;
  render();
  document.querySelector('[data-action="split-workspace"]')?.focus({ preventScroll: true });
});
