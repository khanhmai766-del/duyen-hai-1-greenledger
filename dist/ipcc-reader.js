'use strict';

function showIpccContent(path, page) {
  const documentEntry = ipccView.data.documents.find(([entry]) => entry === path);
  if (!documentEntry?.[4]) return;
  const [, name, edition, pageCount, source] = documentEntry;
  const selectedPage = Math.min(pageCount, Math.max(1, Number(page) || 1));
  const url = new URL(source);
  url.hash = 'page=' + selectedPage;
  const trigger = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'ipcc-reader';
  dialog.setAttribute('aria-labelledby', 'ipcc-reader-title');
  dialog.innerHTML = `<header class="ipcc-reader-header">
    <div><h2 id="ipcc-reader-title">Nội dung tham chiếu · Trang ${selectedPage}</h2><p>${esc(ipccEditions[edition])} · ${esc(name)}</p></div>
    <button type="button" autofocus>Đóng</button>
  </header>
  <div class="ipcc-reader-tools">
    <a href="${esc(url.href)}" target="_blank" rel="noopener">Mở PDF gốc trong tab mới</a>
  </div>
  <iframe class="ipcc-web-frame" referrerpolicy="no-referrer" title="${esc(name)}" src="${esc(url.href)}"></iframe>`;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (trigger?.isConnected) trigger.focus();
  }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
}
