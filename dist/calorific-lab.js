'use strict';

const joulesPerCalorie = 4.1868;

function labNumber(values, name, label, upper = Infinity) {
  const raw = values[name];
  const value = Number(raw);
  if (raw == null || String(raw).trim() === '' || !Number.isFinite(value) || value < 0 || value >= upper) {
    throw Error('Kiểm tra giá trị ' + label + '.');
  }
  return value;
}

function labMassResults(values, prefix, ash = false) {
  return [1, 2].map(sample => {
    const key = prefix + sample;
    const initial = labNumber(values, key + 'Before', 'khối lượng trước thử, mẫu ' + sample);
    const tare = labNumber(values, key + 'Tare', 'khối lượng khay/chén, mẫu ' + sample);
    const final = labNumber(values, key + 'After', 'khối lượng sau thử, mẫu ' + sample);
    if (!(initial > tare && final >= tare && final <= initial)) {
      throw Error('Kiểm tra khối lượng mẫu ' + sample + ': trước thử phải lớn hơn bì và khối lượng sau thử phải nằm giữa hai giá trị đó.');
    }
    return 100 * (ash ? final - tare : initial - final) / (initial - tare);
  });
}

function calculateLabCalorific(values) {
  const average = ([first, second]) => (first + second) / 2;
  const moistureResults = values.totalSource === 'weigh' ? labMassResults(values, 'total') : null;
  const moisture = moistureResults ? average(moistureResults) : labNumber(values, 'totalMoisture', 'ẩm toàn phần', 100);
  const needsAnalysisMoisture = values.grossSource === 'bomb' || values.oxygenSource === 'ash';
  const analysisResults = needsAnalysisMoisture && values.analysisSource === 'weigh' ? labMassResults(values, 'analysis') : null;
  const analysisMoisture = needsAnalysisMoisture
    ? (analysisResults ? average(analysisResults) : labNumber(values, 'analysisMoisture', 'ẩm trong', 100))
    : null;
  if (analysisMoisture === 100 || moisture === 100) throw Error('Độ ẩm phải nhỏ hơn 100%.');
  const dryAnalysisFraction = 1 - (analysisMoisture ?? 0) / 100;
  const dryReceivedFraction = 1 - moisture / 100;
  const h = labNumber(values, 'hydrogen', 'H khô', 100);
  const nitrogen = labNumber(values, 'nitrogen', 'N khô', 100);
  const needsSulfur = values.grossSource === 'bomb' || values.oxygenSource !== 'direct';
  const sulfur = needsSulfur ? labNumber(values, 'sulfur', 'S khô', 100) : null;
  const ashResults = values.oxygenSource === 'ash' ? labMassResults(values, 'ash', true) : null;
  const ash = ashResults ? average(ashResults) / dryAnalysisFraction
    : values.oxygenSource === 'balance' ? labNumber(values, 'ashDry', 'tro khô', 100) : null;
  const carbon = values.oxygenSource === 'direct' ? null : labNumber(values, 'carbon', 'C khô', 100);
  const oxygen = values.oxygenSource === 'direct' ? labNumber(values, 'oxygen', 'O khô', 100)
    : 100 - (carbon + h + nitrogen + sulfur + ash);
  if (oxygen < -1e-10 || oxygen + h + nitrogen > 100) {
    throw Error('Thành phần khô vượt 100%. Kiểm tra cơ sở mẫu và các giá trị C, H, N, S, tro hoặc O.');
  }
  const o = Math.max(0, oxygen);
  let bombAverage, grossAdb, grossDry;
  if (values.grossSource === 'bomb') {
    const qb1 = labNumber(values, 'qb1', 'Qb mẫu 1');
    const qb2 = labNumber(values, 'qb2', 'Qb mẫu 2');
    if (!(qb1 > 0 && qb2 > 0)) throw Error('Qb của mỗi mẫu phải lớn hơn 0.');
    bombAverage = Math.round(average([qb1, qb2]));
    const sulfurAdb = sulfur * dryAnalysisFraction;
    grossAdb = Math.round((bombAverage * joulesPerCalorie - 94.1 * sulfurAdb) / joulesPerCalorie);
    grossDry = grossAdb * joulesPerCalorie / 1000 / dryAnalysisFraction;
  } else {
    grossDry = heatInMj(labNumber(values, 'grossDry', 'Qgr,db'), values.grossUnit);
  }
  const grossReceived = grossDry * dryReceivedFraction;
  const iso = calculateCalorific('iso', { heat: grossDry, h, o, nitrogen, moisture }).net;
  const ipcc = calculateCalorific('ipcc', {
    heat: grossReceived, h: h * dryReceivedFraction, o: o * dryReceivedFraction, moisture,
  }).net;
  if (!(iso > 0 && ipcc > 0)) throw Error('Qnet phải lớn hơn 0. Kiểm tra nhiệt trị, đơn vị và thành phần mẫu.');
  const legacy = values.legacyO === undefined || values.legacyO === '' ? null
    : grossDry - .212 * h - .0245 * moisture - .0008 * labNumber(values, 'legacyO', 'O dùng cho ô D33', 100);
  return { moisture, moistureResults, analysisMoisture, analysisResults, ash, ashResults,
    o, bombAverage, grossAdb, grossDry, grossReceived, iso, ipcc, legacy };
}

function labField(label, name, values, required = true) {
  return field(label, name, values[name] ?? '', 'number', 'min="0" step="any"' + (required ? ' required' : ''));
}

function labPair(prefix, values, ash = false) {
  return `<div class="lab-pair">${[1, 2].map(sample => `<fieldset><legend>Mẫu ${sample}</legend>
    ${labField('Khay/chén rỗng (g)', prefix + sample + 'Tare', values)}
    ${labField('Mẫu + khay/chén trước thử (g)', prefix + sample + 'Before', values)}
    ${labField(ash ? 'Tro + chén sau nung (g)' : 'Mẫu + khay/chén sau sấy ổn định (g)', prefix + sample + 'After', values)}
  </fieldset>`).join('')}</div>`;
}

function labMoisture(prefix, label, values) {
  return `${selectField(label, prefix + 'Source', [['direct', 'Nhập kết quả (%)'], ['weigh', 'Tính từ hai mẫu cân']], values[prefix + 'Source'] ?? 'direct')}
    <div data-lab-condition="${prefix}Source:direct">${labField(label + ' (%)', prefix + 'Moisture', values)}</div>
    <div data-lab-condition="${prefix}Source:weigh">${labPair(prefix, values)}</div>`;
}

function calorificLabFields(values) {
  return `<p class="sub">Tính nhiệt trị thuần của than trên cơ sở nhận về (ar). Nhập các kết quả đã có từ cùng mẫu hoặc dùng số cân của hai mẫu lặp.</p>
  <section class="lab-section"><h3>Nhiệt trị toàn phần và độ ẩm</h3>
    ${selectField('Nguồn nhiệt trị toàn phần', 'grossSource', [['dry', 'Nhập Qgr,db từ phiếu phân tích'], ['bomb', 'Tính từ Qb của hai mẫu']], values.grossSource ?? 'dry')}
    <div class="form-grid" data-lab-condition="grossSource:dry">
      ${labField('Qgr,db · cơ sở khô', 'grossDry', values)}
      ${selectField('Đơn vị Qgr,db', 'grossUnit', calorificUnits, values.grossUnit ?? 'cal')}
    </div>
    <div class="form-grid" data-lab-condition="grossSource:bomb">
      ${labField('Qb mẫu 1 (cal/g)', 'qb1', values)}
      ${labField('Qb mẫu 2 (cal/g)', 'qb2', values)}
    </div>
    ${labMoisture('total', 'Ẩm toàn phần (ar)', values)}
    <div data-lab-condition="grossSource:bomb|oxygenSource:ash">${labMoisture('analysis', 'Ẩm trong mẫu phân tích (adb)', values)}</div>
  </section>
  <section class="lab-section"><h3>Thành phần cơ sở khô (db)</h3>
    <div class="form-grid">${labField('Hydro H (%)', 'hydrogen', values)}${labField('Nitơ N (%)', 'nitrogen', values)}</div>
    ${selectField('Cách xác định oxy khô', 'oxygenSource', [['balance', 'Tính từ C, H, N, S và tro khô'], ['direct', 'Nhập O từ phiếu phân tích'], ['ash', 'Tính oxy và tro từ hai mẫu cân']], values.oxygenSource ?? 'balance')}
    <div data-lab-condition="oxygenSource:direct">${labField('Oxy O (%)', 'oxygen', values)}</div>
    <div class="form-grid">
      <div data-lab-condition="oxygenSource:balance|oxygenSource:ash">${labField('Carbon C (%)', 'carbon', values)}</div>
      <div data-lab-condition="grossSource:bomb|oxygenSource:balance|oxygenSource:ash">${labField('Lưu huỳnh S (%)', 'sulfur', values)}</div>
      <div data-lab-condition="oxygenSource:balance">${labField('Tro cơ sở khô (%)', 'ashDry', values)}</div>
    </div>
    <div data-lab-condition="oxygenSource:ash">${labPair('ash', values, true)}</div>
  </section>
  <details class="lab-section">
    <summary>Công thức và cơ sở mẫu</summary>
    <p>Với số cân, độ ẩm là phần khối lượng mẫu mất sau sấy. Hàm lượng tro là khối lượng tro chia cho khối lượng mẫu trước nung. Mỗi kết quả là trung bình của hai mẫu.</p>
    <p>Khi nhập Qb, công cụ làm tròn Qb trung bình và Qgr,adb theo Excel. Qgr,adb (J/g) = Qb (J/g) − 94,1 × S<sub>adb</sub> (%). Qgr,db = Qgr,adb ÷ (1 − ẩm trong/100).</p>
    <p>O<sub>db</sub> = 100 − (C<sub>db</sub> + H<sub>db</sub> + N<sub>db</sub> + S<sub>db</sub> + tro<sub>db</sub>) khi chọn tính theo hiệu số. Hệ số quy từ db sang ar là 1 − ẩm toàn phần/100.</p>
    <p>Với nhiệt trị tính bằng MJ/kg và thành phần tính bằng %, ISO trong Excel dùng Qnet,p,ar = [Qgr,db − 0,2122H<sub>db</sub> − 0,0008(O<sub>db</sub> + N<sub>db</sub>)] × (1 − M/100) − 0,02443M. IPCC Box 1.1 dùng Qnet,ar = Qgr,ar − 0,212H<sub>ar</sub> − 0,0245M − 0,008O<sub>ar</sub>.</p>
  </details>
  <details class="lab-section">
    <summary>Đối chiếu riêng với ô D33 trong Excel</summary>
    <p class="sub">Nhập O khô ghi tại ô B60 để tái hiện D33. Ô D33 lấy Qgr,db và H khô trực tiếp, đồng thời dùng hệ số O là 0,0008. Kết quả IPCC bên trên quy các đầu vào về cơ sở nhận về và dùng hệ số 0,008 của Box 1.1.</p>
    ${labField('O khô tại ô B60 (%)', 'legacyO', values, false)}
  </details>`;
}

function bindCalorificLab(form) {
  const update = () => {
    for (const group of form.querySelectorAll('[data-lab-condition]')) {
      group.hidden = !group.dataset.labCondition.split('|').some(condition => {
        const [name, value] = condition.split(':');
        return form.elements[name].value === value;
      });
    }
    for (const element of form.querySelectorAll('#calorific-fields input, #calorific-fields select')) {
      element.disabled = Boolean(element.closest('[data-lab-condition][hidden]'));
    }
  };
  update();
  form.querySelector('#calorific-fields').onchange = update;
}

function calorificLabResult(result) {
  const cal = value => value * 1000 / joulesPerCalorie;
  const heat = (label, value) => `<tr><th scope="row">${label}</th><td>${n(value, 6)}</td><td>${n(cal(value), 4)}</td></tr>`;
  const pair = (label, samples) => samples ? `<p>${label} · Mẫu 1: ${n(samples[0], 4)}% · Mẫu 2: ${n(samples[1], 4)}%</p>` : '';
  return `<span>Nhiệt trị thuần ISO · Qnet,p,ar (đối chiếu B33)</span>
    <strong>${n(result.iso, 6)} <small>TJ/Gg</small></strong>
    <div class="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th>MJ/kg = TJ/Gg</th><th>cal/g</th></tr></thead><tbody>
      ${heat('Qgr,db · cơ sở khô', result.grossDry)}
      ${heat('Qgr,ar · than nhận về', result.grossReceived)}
      ${heat('Qnet,p,ar · ISO', result.iso)}
      ${heat('Qnet,ar · IPCC 2006 Box 1.1', result.ipcc)}
      ${heat('IPCC − ISO · cùng cơ sở nhận về', result.ipcc - result.iso)}
      ${result.legacy === null ? '' : heat('Công thức ô D33 · đối chiếu', result.legacy) + heat('Chênh lệch ô E33', result.legacy - result.iso)}
    </tbody></table></div>
    <p>Ẩm toàn phần ${n(result.moisture, 4)}% · O khô ${n(result.o, 4)}%${result.ash === null ? '' : ' · Tro khô ' + n(result.ash, 4) + '%'}</p>
    ${result.analysisMoisture === null ? '' : `<p>Ẩm trong ${n(result.analysisMoisture, 4)}%</p>`}
    ${result.bombAverage === undefined ? '' : `<p>Qb trung bình ${n(result.bombAverage, 0)} cal/g · Qgr,adb sau hiệu chỉnh lưu huỳnh ${n(result.grossAdb, 0)} cal/g.</p>`}
    ${pair('Ẩm toàn phần', result.moistureResults)}${pair('Ẩm trong', result.analysisResults)}${pair('Tro adb', result.ashResults)}
    <p>${calorificReferences.iso} · ${calorificReferences.ipcc}</p>`;
}
