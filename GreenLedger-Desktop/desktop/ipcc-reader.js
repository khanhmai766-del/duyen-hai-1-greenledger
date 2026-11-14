'use strict';

async function showIpccContent(path, firstPage) {
  const source = ipccView.data.documents.find(([entry]) => entry === path);
  if (!source) return;
  const trigger = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'ipcc-reader';
  dialog.setAttribute('aria-labelledby', 'ipcc-reader-title');
  dialog.innerHTML = `<header class="ipcc-reader-header">
    <div><h2 id="ipcc-reader-title">Nội dung tham chiếu</h2><p>${esc(ipccEditions[source[2]])} · ${esc(source[1])}</p></div>
    <button type="button" data-reader="close" autofocus>Đóng</button>
  </header>
  <div class="ipcc-reader-tools">
    <button type="button" data-reader="prev" disabled>Trang trước</button>
    <label>Trang <input type="number" min="1" max="${source[3]}" step="1" value="${firstPage}" aria-label="Số trang" disabled></label>
    <span aria-label="Tổng số trang">/ ${source[3]}</span>
    <button type="button" data-reader="next" disabled>Trang sau</button>
    <button type="button" data-reader="zoom-out" aria-label="Thu nhỏ" disabled>−</button>
    <button type="button" data-reader="zoom-in" aria-label="Phóng to" disabled>+</button>
    <span class="ipcc-reader-status" role="status">Đang tải nội dung…</span>
  </div>
  <div class="ipcc-reader-sheet" tabindex="0" aria-label="Nội dung trang"></div>`;
  document.body.append(dialog);
  const controls = dialog.querySelector('.ipcc-reader-tools');
  const input = controls.querySelector('input');
  const status = controls.querySelector('[role=status]');
  const sheet = dialog.querySelector('.ipcc-reader-sheet');
  const button = name => dialog.querySelector(`[data-reader="${name}"]`);
  const abort = new AbortController();
  let loading, pdf, task;
  let page = firstPage, zoom = 1, revision = 0, closed = false;

  async function paint() {
    if (!pdf || closed) return;
    const id = ++revision;
    task?.cancel();
    input.value = page;
    button('prev').disabled = page === 1;
    button('next').disabled = page === pdf.numPages;
    button('zoom-out').disabled = zoom <= 0.75;
    button('zoom-in').disabled = zoom >= 2;
    status.textContent = 'Đang hiển thị…';
    try {
      const content = await pdf.getPage(page);
      if (closed || id !== revision) return;
      const original = content.getViewport({ scale: 1 });
      const displayScale = Math.max(220, sheet.clientWidth - 28) / original.width * zoom;
      const density = Math.min(window.devicePixelRatio || 1, 1.5);
      const viewport = content.getViewport({ scale: displayScale * density });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = Math.ceil(viewport.width / density) + 'px';
      canvas.style.height = Math.ceil(viewport.height / density) + 'px';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Trang ${page} của ${source[1]}`);
      task = content.render({ canvas, viewport });
      await task.promise;
      if (closed || id !== revision) return;
      sheet.replaceChildren(canvas);
      sheet.scrollTo(0, 0);
      status.textContent = `Trang ${page} · ${Math.round(zoom * 100)}%`;
    } catch {
      if (!closed && id === revision) status.textContent = 'Không hiển thị được trang này.';
    }
  }

  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-reader]')?.dataset.reader;
    if (action === 'close') { dialog.close(); return; }
    if (!pdf || !action) return;
    if (action === 'prev') page = Math.max(1, page - 1);
    if (action === 'next') page = Math.min(pdf.numPages, page + 1);
    if (action === 'zoom-out') zoom = Math.max(0.75, zoom - 0.25);
    if (action === 'zoom-in') zoom = Math.min(2, zoom + 0.25);
    void paint();
  });
  input.addEventListener('change', () => {
    if (!pdf) return;
    page = Math.max(1, Math.min(pdf.numPages, Math.trunc(Number(input.value)) || 1));
    void paint();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') input.blur();
  });
  dialog.addEventListener('close', () => {
    closed = true;
    abort.abort();
    task?.cancel();
    loading?.destroy().catch(() => {});
    dialog.remove();
    if (trigger?.isConnected) trigger.focus();
  }, { once: true });
  dialog.showModal();

  try {
    const [pdfjs, response] = await Promise.all([
      import('./pdfjs/pdf.min.mjs'),
      fetch('https://ipcc.greenledger.local/document?entry=' + encodeURIComponent(path), { signal: abort.signal }),
    ]);
    if (!response.ok) throw Error('Thiếu tài liệu trong bộ cài');
    const bytes = await response.arrayBuffer();
    if (closed) return;
    const base = new URL('./pdfjs/', location.href);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', base).href;
    loading = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      cMapUrl: new URL('cmaps/', base).href,
      cMapPacked: true,
      standardFontDataUrl: new URL('standard_fonts/', base).href,
      iccUrl: new URL('iccs/', base).href,
      wasmUrl: new URL('wasm/', base).href,
      isEvalSupported: false,
      enableXfa: false,
    });
    pdf = await loading.promise;
    if (closed) return;
    page = Math.min(pdf.numPages, Math.max(1, firstPage));
    input.max = pdf.numPages;
    input.disabled = false;
    await paint();
  } catch {
    if (!closed) status.textContent = 'Không đọc được nội dung. Hãy kiểm tra bộ cài GreenLedger.';
  }
}
