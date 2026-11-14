'use strict';

function webToolbar() {
  return `<nav class="web-toolbar no-print" aria-label="Thanh công cụ GreenLedger">
    <details>
      <summary>Tệp</summary>
      <div class="web-toolbar-menu">
        ${btn('Sao lưu &amp; xuất dữ liệu', 'tab', '', 'data-tab="5"')}
        <form action="/logout" method="post"><button type="submit">Đăng xuất</button></form>
      </div>
    </details>
    ${btn('Tra cứu IPCC', 'tab', '', 'data-tab="6"')}
    <details>
      <summary>Tải tài liệu IPCC</summary>
      <div class="web-toolbar-menu">
        <a href="https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2006gls_all_in.zip">IPCC 2006 (.zip)</a>
        <a href="https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/2019rf_all_in.zip">Bổ sung 2019 (.zip)</a>
      </div>
    </details>
  </nav>`;
}

document.addEventListener('click', event => {
  for (const menu of document.querySelectorAll('.web-toolbar details[open], .period-menu[open]')) {
    if (!menu.contains(event.target)) menu.open = false;
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const menu = document.activeElement?.closest('.web-toolbar details[open], .period-menu[open]');
  if (menu) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
