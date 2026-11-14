'use strict';

const calorificMethods = [
  ['lab', 'Tính theo phiếu phân tích than'],
  ['ipcc', 'IPCC 2006 · Box 1.1'],
  ['iso', 'ISO 1928 · Công thức (18)'],
  ['convert', 'Chuyển đổi IPCC ↔ ISO'],
];

const calorificUnits = [['mj', 'MJ/kg (hoặc TJ/Gg)'], ['j', 'J/g (hoặc kJ/kg)'], ['cal', 'cal/g (hoặc kcal/kg)']];

function heatInMj(value, unit) {
  if (unit === 'cal') return value * joulesPerCalorie / 1000;
  return unit === 'j' ? value / 1000 : value;
}

// All heat values use MJ/kg and all composition inputs are percentage points.
function calculateCalorific(mode, { heat, h, o, nitrogen, moisture, direction }) {
  if (!Number.isFinite(heat) || heat <= 0) throw Error('Nhiệt trị đầu vào phải lớn hơn 0.');
  const composition = mode === 'ipcc' ? [h, o, moisture] : [h, o, nitrogen];
  if (![...composition, moisture].every(value => Number.isFinite(value) && value >= 0 && value < 100) ||
      composition.reduce((sum, value) => sum + value, 0) > 100) {
    throw Error('Kiểm tra lại độ ẩm và thành phần phần trăm trên cùng cơ sở mẫu.');
  }
  const dryFraction = 1 - moisture / 100;
  if (mode === 'ipcc') return { net: heat - 0.212 * h - 0.0245 * moisture - 0.008 * o };

  const isoLoss = (0.2122 * h + 0.0008 * (o + nitrogen)) * dryFraction + 0.02443 * moisture;
  if (mode === 'iso') return { net: heat * dryFraction - isoLoss };

  // Match the as-received mass basis before comparing the two corrections.
  const ipccLoss = (0.212 * h + 0.008 * o) * dryFraction + 0.0245 * moisture;
  const fromIso = direction === 'iso-ipcc';
  const difference = fromIso ? isoLoss - ipccLoss : ipccLoss - isoLoss;
  return { net: heat + difference, difference };
}

const calorificReferences = {
  ipcc: '<a href="https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf#page=17" target="_blank" rel="noopener">IPCC 2006 · Box 1.1</a>',
  iso: '<a href="https://www.iso.org/standard/75883.html" target="_blank" rel="noopener">ISO 1928:2020 · Công thức (18)</a>',
};

function calorificFields(mode, values) {
  if (mode === 'lab') return calorificLabFields(values);
  const ipcc = mode === 'ipcc';
  const convert = mode === 'convert';
  const basis = ipcc ? 'than nhận về' : 'cơ sở khô';
  const heatLabel = convert ? 'Qnet theo phương pháp nguồn' : 'Qgross · ' + basis;
  const percent = (label, name) => field(label, name, values[name], 'number', 'required min="0" max="100" step="any"');
  const formula = ipcc
    ? 'Qnet = Qgross − 0,212H − 0,0245M − 0,008O'
    : convert
      ? 'Δ = (1 − M/100) × (−0,0002H + 0,0072O − 0,0008N) + 0,00007M<br>ISO = IPCC + Δ · IPCC = ISO − Δ'
      : 'Qnet = [Qgross − 0,2122H − 0,0008(O + N)] × (1 − M/100) − 0,02443M';
  return `<div class="form-grid">
    ${convert ? selectField('Chiều chuyển đổi', 'direction', [['ipcc-iso', 'IPCC → ISO'], ['iso-ipcc', 'ISO → IPCC']], values.direction) : ''}
    ${field(heatLabel, 'heat', values.heat, 'number', 'required min="0" step="any"')}
    ${selectField('Đơn vị đầu vào', 'heatUnit', calorificUnits, values.heatUnit)}
    ${percent('Độ ẩm ' + (ipcc || convert ? 'toàn phần' : 'mục tiêu') + ' M (%)', 'moisture')}
    ${percent('Hydro H · ' + basis + ' (%)', 'h')}
    ${percent('Oxy O · ' + basis + ' (%)', 'o')}
    ${ipcc ? '' : percent('Nitơ N · cơ sở khô (%)', 'nitrogen')}
  </div>
  <div class="note calorific-formula">
    <strong>${formula}</strong>
    <p>${convert
      ? 'Nhập Qnet nguồn và độ ẩm M của cùng một mẫu than nhận về. Công thức suy ra từ hai phương pháp, với H và O cơ sở nhận về được tính từ thành phần khô × (1 − M/100).'
      : ipcc ? 'Dùng Qgross và thành phần của cùng mẫu than nhận về.' : 'Dùng Qgross đo ở thể tích không đổi trên cơ sở khô. Nhập M = 0 để tính NCV khô.'}</p>
    ${convert ? calorificReferences.ipcc + ' · ' + calorificReferences.iso : calorificReferences[mode]}
  </div>`;
}

function openCalorificDialog() {
  const drafts = Object.fromEntries(calorificMethods.map(([id]) => [id, { heatUnit: 'mj', direction: 'ipcc-iso' }]));
  let mode = 'lab';
  modal('Công cụ tính nhiệt trị than', `<div class="calorific-method">${selectField('Phương pháp', 'calorificMode', calorificMethods, mode)}</div>
    <div id="calorific-fields"></div><output id="calorific-result" aria-live="polite" hidden></output>`, data => {
    const values = Object.fromEntries(data);
    const result = form.querySelector('#calorific-result');
    if (mode === 'lab') {
      result.innerHTML = calorificLabResult(calculateLabCalorific(values));
      result.hidden = false;
      return false;
    }
    const { net, difference } = calculateCalorific(mode, {
      heat: heatInMj(Number(values.heat), values.heatUnit),
      h: Number(values.h), o: Number(values.o), nitrogen: Number(values.nitrogen),
      moisture: Number(values.moisture), direction: values.direction,
    });
    if (!Number.isFinite(net) || net <= 0) throw Error('Qnet phải lớn hơn 0. Kiểm tra đơn vị và các thông số đã nhập.');
    const method = mode === 'convert' ? (values.direction === 'iso-ipcc' ? 'IPCC' : 'ISO') : mode.toUpperCase();
    const signed = difference > 0 ? '+' + n(difference, 6) : n(difference, 6);
    result.innerHTML = `<span>Qnet · ${method}</span><strong>${n(net, 6)} <small>MJ/kg = TJ/Gg (cùng trị số)</small></strong>
      ${mode === 'convert' ? `<span>Chênh lệch so với Qnet nguồn ${signed} MJ/kg</span>` : ''}`;
    result.hidden = false;
    return false;
  }, true);
  const form = document.querySelector('#modal-form');
  const fields = form.querySelector('#calorific-fields');
  const result = form.querySelector('#calorific-result');
  const method = form.elements.calorificMode;
  form.querySelector('[type="submit"]').textContent = 'Tính Qnet';
  form.querySelector('.modal-foot [data-action="close"]').textContent = 'Đóng';
  const renderFields = () => {
    fields.onchange = null;
    fields.innerHTML = calorificFields(mode, drafts[mode]);
    if (mode === 'lab') bindCalorificLab(form);
  };
  renderFields();
  form.addEventListener('input', () => {
    result.hidden = true;
    form.querySelector('#form-error').textContent = '';
  });
  method.addEventListener('change', () => {
    drafts[mode] = Object.fromEntries([...fields.querySelectorAll('input, select')].map(element => [element.name, element.value]));
    mode = method.value;
    renderFields();
    result.hidden = true;
    form.querySelector('#form-error').textContent = '';
  });
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-action="calorific"]')) openCalorificDialog();
});
