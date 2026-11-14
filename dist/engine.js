'use strict';
const Engine=(()=>{
const groups=['Đốt cố định','Đốt di động','Nước thải sinh hoạt','Nước thải công nghiệp','Môi chất lạnh','Chữa cháy','Phân bón & đất','Điện lưới'];
const uid=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);
const rss=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0));
const rel=a=>a[0]?Math.max(a[0]-a[1],a[2]-a[0])/2/a[0]:0;
const sd=a=>a.length>1?Math.sqrt(a.reduce((s,v)=>s+(v-a.reduce((x,y)=>x+y,0)/a.length)**2,0)/(a.length-1)):0;
const historicalGrid = [[2014,.6612],[2015,.8154],[2016,.9185],[2017,.8649],[2018,.9130],[2019,.8458],[2020,.8041],[2021,.7221],[2022,.6766],[2023,.6592],[2024,.6187]]
  .map(([year,value])=>({year,value,source:'Chuỗi tham chiếu bài tập ĐKĐBĐ, hệ số 2022 đối chiếu bảng lịch sử QUACERT.'}));
const coverage = period => period.coverageFactor ?? 1.96;

function assessReliability(data = {}) {
  const { activity, factor, objective, detail, crosscheck } = data ?? {};
  const points = [1, 2, 3, 4];
  // The slides give individual points and cut-offs. Compare the combined score at the same two-decimal precision.
  const score = points.includes(activity) && points.includes(factor)
    ? Math.round(Math.hypot(activity, factor) * 100) / 100 : null;
  const grade = score === null ? null : score <= 2.24 ? 'A' : score <= 4.24 ? 'B' : score <= 5 ? 'C' : 'D';
  const checks = [objective, detail, crosscheck];
  const passed = checks.every(value => value === 'pass' || value === 'fail')
    ? checks.filter(value => value === 'pass').length : null;
  const level = passed === null ? null : ['Không có độ tin cậy', 'Thấp', 'Trung bình', 'Cao'][passed];
  return { score, grade, passed, level };
}

function reliabilitySummary(results) {
  const graded = results.filter(({row}) => assessReliability(row.reliability).grade !== null);
  const checked = results.filter(({row}) => assessReliability(row.reliability).passed !== null);
  const ready = results.filter(({row}) => {
    const status = assessReliability(row.reliability);
    return status.grade !== null && status.passed !== null;
  });
  const total = results.reduce((sum, item) => sum + item.total, 0);
  const reviewed = ready.reduce((sum, item) => sum + item.total, 0);
  return { count: results.length, graded: graded.length, checked: checked.length, complete: ready.length,
    coverage: total > 0 ? reviewed / total : null };
}

function gridSeries(period, db) {
  if (period.gridFrom == null && period.gridTo == null) return db.grid.slice().sort((a,b)=>a.year-b.year);
  const years = new Map(historicalGrid.map(entry=>[entry.year,entry]));
  for (const entry of db.grid) years.set(entry.year,entry);
  return [...years.values()].filter(entry=>entry.year>=period.gridFrom && entry.year<=period.gridTo).sort((a,b)=>a.year-b.year);
}

function sourceUncertainty(row, period, db, gases) {
  const terms = [];
  const active = gases.map((_,i)=>i);
  const add = (kind,id,ratio,indices=active,weight=1) => {
    const shared = kind === 'ad' ? row.adGroup?.trim() : kind !== 'n' && kind !== 'cod';
    const key = JSON.stringify([period.correlateShared && shared ? null : row.id,kind,kind === 'ad' ? row.adGroup?.trim() || '' : id]);
    terms.push({kind,id,ratio,indices,weight,key,value:ratio*indices.reduce((total,i)=>total+gases[i],0)});
  };
  const gas = id => db.gases.find(item=>item.id===id);
  const gwp = (id,index) => add('gwp',id,gas(id).u/(gas(id).ar6||1),[index]);
  const other = (id,index,enabled=true) => add('other',id,enabled ? db.other.find(item=>item.id===id).u/100 : 0,[index]);
  add('ad','',Number(row.ad)/100);
  if (row.group < 2) {
    const fuel = db.fuels.find(item=>item.id===row.factor);
    add('ncv',fuel.id,rel(fuel.ncv));
    ['co2','ch4','n2o'].forEach((kind,i)=>add(kind,fuel.id,rel(fuel[kind]),[i]));
    gwp(fuel.bio?'CH4_BIO':'CH4_FOSSIL',1);
    gwp('N2O',2);
  } else if (row.group === 2) {
    for (const id of ['BOD','BO_DOM',row.mcf]) other(id,1);
    other('PERSON',1,row.personUncertain !== false);
    gwp('CH4_BIO',1);
  } else if (row.group === 3) {
    add('n','',Number(row.nU||0)/100,[2]);
    other('EF_N',2);
    gwp('N2O',2);
    add('cod','',Number(row.codU||0)/100,[1]);
    other('BO_IND',1);
    if (row.mcf) other(row.mcf,1);
    gwp('CH4_BIO',1);
  } else if (row.group === 4 || row.group === 5) {
    const factor = gas(row.factor);
    const value = factor.mix.length ? factor.mix.reduce((sum,[id,w])=>sum+w*gas(id)[period.gwp],0) : factor[period.gwp];
    const index = row.factor==='CO2'?0:3;
    for (const [id,w] of factor.mix.length ? factor.mix : [[row.factor,1]]) {
      add('blend',id,gas(id).u*(period.weighted ? w : 1)/(value||1),[index],w);
    }
  } else if (row.group === 6) {
    other(row.factor==='LIME'?'LIME':'UREA',0);
  } else {
    const grid = db.grid.find(item=>item.id===row.factor);
    add('grid',grid.id,sd(gridSeries(period,db).map(entry=>entry.value))/(grid.value||1),[0]);
  }
  return terms;
}

function combineUncertainty(results) {
  const combined = new Map();
  for (const result of results) for (const term of result.terms ?? []) {
    combined.set(term.key,(combined.get(term.key)||0)+term.value);
  }
  return rss([...combined.values()]);
}
function seed(){const data=[
['DO_STAT','Dầu DO · Gas/Diesel Oil','Lít',.84,[43,41.4,43.3],[74100,72600,74800],[3,1,10],[.6,.2,2]],
['LPG_STAT','Khí hóa lỏng LPG','Kg',1,[47.3,44.8,52.2],[63100,61600,65600],[1,.3,3],[.1,.03,.3]],
['GAS_STAT','Xăng động cơ','Lít',.745,[44.3,42.5,44.8],[69300,67500,73000],[3,1,10],[.6,.2,2]],
['COAL_SUB','Than đá · Sub-Bituminous Coal','Kg',1,[18.9,11.5,26],[96100,92800,100000],[10,3,30],[1.5,.5,5]],
['ACETYLEN','Khí Acetylen hàn cắt','Kg',1,[48.2,46.5,50],[69900,67000,73000],[1,.3,3],[.1,.03,.3]],
['NAT_GAS','Khí tự nhiên','Kg',1,[48,46.5,50.4],[56100,54300,58300],[1,.3,3],[.1,.03,.3]],
['BIOMASS','Sinh khối · Wood/Wood Waste','Kg',1,[15.6,7.9,31],[112000,95000,132000],[30,10,100],[4,1.5,15],true],
['SLUDGE_DRY','Bùn khô thu hồi nhiệt','Kg',1,[11.6,5.9,23],[100000,84700,117000],[30,10,100],[4,1.5,15],true],
['DO_ROAD','Dầu DO đường bộ','Lít',.84,[43,41.4,43.3],[74100,72600,74800],[3.9,1.6,9.5],[3.9,1.3,12]],
['GAS_UNCTRL','Xăng đường bộ · Không kiểm soát','Lít',.745,[44.3,42.5,44.8],[69300,67500,73000],[33,9.6,110],[3.2,.96,11]],
['GAS_CAT','Xăng · Oxidation Catalyst','Lít',.745,[44.3,42.5,44.8],[69300,67500,73000],[25,7.5,86],[8,2.6,24]],
['GAS_LDV95','Xăng · Xe con từ 1995','Lít',.745,[44.3,42.5,44.8],[69300,67500,73000],[3.8,1.1,13],[5.7,1.9,17]],
['DO_OFFROAD','Dầu DO · Xe nâng, máy công nghiệp','Lít',.84,[43,41.4,43.3],[74100,72600,74800],[4.15,1.66,10.4],[28.6,14.3,85.8]],
['GAS_4S_OFF','Xăng · Máy công nghiệp 4 kỳ','Lít',.745,[44.3,42.5,44.8],[69300,67500,73000],[50,20,125],[2,1,6]]];
const fuels=data.map((x,i)=>({id:x[0],name:x[1],unit:x[2],density:x[3],ncv:x[4],co2:x[5],ch4:x[6],n2o:x[7],bio:!!x[8],type:i<8?'stationary':'mobile',source:i>=8?'IPCC 2006 V2 Ch.3 Tables 3.2.1/3.2.2 (tr.16/21); off-road Table 3.3.1 (tr.36)':x[0]==='ACETYLEN'?'Engineering Toolbox & BC Gov; giá trị theo file yêu cầu, cần xác minh':x[0]==='SLUDGE_DRY'?'IPCC V5 Ch.5 Tables 5.2/5.5/5.6 (tr.18–22); theo file yêu cầu':'IPCC 2006 V2 Ch.1 Table 1.2 (tr.18–19), Ch.2 Table 2.3 (tr.18–19)'}));
const gases=[['CO2','Carbon dioxide',1,1,1,0],['CH4_FOSSIL','Methane hóa thạch',25,30,29.8,5.5],['CH4_BIO','Methane sinh học',25,28,27,5.5],['N2O','Nitrous oxide',298,265,273,65],['HFC_32','R-32',675,677,771,146],['HFC_125','R-125',3500,3170,3740,286.18],['HCFC_22','R-22',1810,1760,1960,104.08],['HFC_134A','R-134a',1430,1300,1530,290.5],['HFC_143A','R-143a',4470,4800,5810,700.95],['HFC_227EA','FM-200',3220,3350,3600,193.13],['R410A','R-410A',2087.5,1923.5,2255.5,321.27,[['HFC_32',.5],['HFC_125',.5]]],['R404A','R-404A',3921.6,3942.8,4728,386.4,[['HFC_125',.44],['HFC_143A',.52],['HFC_134A',.04]]],['R407C','R-407C',1773.85,1624.21,1907.93,170.12,[['HFC_32',.23],['HFC_125',.25],['HFC_134A',.52]]]].map(x=>({id:x[0],name:x[1],ar4:x[2],ar5:x[3],ar6:x[4],u:x[5],mix:x[6]||[],source:'IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu.'}));
const other=[['BOD','BOD sinh hoạt',40,15,'g/người/ngày','IPCC V5 Ch.6 Table 6.4 tr.14; Table 6.7 tr.17'],['BO_DOM','Bo sinh hoạt',.6,15,'kg CH₄/kg BOD','IPCC V5 Ch.6 Table 6.2 tr.12'],['MCF_SEPTIC','MCF bể tự hoại',.5,5,'tỷ lệ','IPCC V5 Ch.6 Table 6.3 tr.13'],['MCF_AERO','MCF hiếu khí tốt',0,0,'tỷ lệ','IPCC V5 Ch.6 Table 6.3 tr.13'],['MCF_OVER','MCF hiếu khí quá tải',.3,15,'tỷ lệ','IPCC V5 Ch.6 Table 6.3 tr.13'],['MCF_ANA','MCF kỵ khí',.8,5,'tỷ lệ','IPCC V5 Ch.6 Table 6.3 tr.13'],['PERSON','Nhân sự',1,2.5,'tỷ lệ','IPCC V5 Ch.6 Table 6.7 tr.17'],['EF_N','EF xả thải N₂O-N',.005,0,'kg/kg N','IPCC V5 Ch.6 Table 6.11 tr.27; chưa có u'],['BO_IND','Bo công nghiệp',.25,0,'kg CH₄/kg COD','IPCC V5 Ch.6 §6.2.3.2; chưa có u'],['UREA','EF Urê',.2,0,'tấn C/tấn','IPCC 2006 V4 Ch.11 Eq.11.13 và §11.4.4: u EF mặc định bằng 0 theo giả định Tier 1 toàn bộ C trong urê phát thải.'],['LIME','EF đá vôi',.12,0,'tấn C/tấn','IPCC V4 Ch.11 Eq.11.12 tr.27; chưa có u']].map(x=>({id:x[0],name:x[1],value:x[2],u:x[3],unit:x[4],source:x[5]}));
return {schema:1,fuels,gases,other,grid:[2021,2022,2023,2024].map((year,i)=>({id:'GRID_'+year,year,value:[.7221,.6766,.6592,.6187][i],source:'Cục Biến đổi khí hậu; theo file yêu cầu, cần đối chiếu công bố năm'})),periods:[{id:uid(),year:2024,facility:'Cơ sở sản xuất mẫu',address:'',contact:'',boundary:'Kiểm soát vận hành; Phạm vi 1 và 2',notes:'Dữ liệu minh họa để kiểm chứng; thay bằng số liệu thực tế.',gwp:'ar6',weighted:true,rows:[{id:uid(),name:'Lò hơi · Dầu DO',group:0,factor:'DO_STAT',amount:50000,mode:'annual',months:Array(12).fill(0),ad:.5/Math.sqrt(3),device:'Trụ bơm nhiên liệu',evidence:'Sổ theo dõi nhiên liệu',nitrogen:.02,cod:.1,mcf:'MCF_SEPTIC'}]}]};}
function calculate(row,p,db){const a=row.mode==='monthly'?row.months.reduce((s,v)=>s+Number(v),0):row.group===5&&row.factor==='CO2'&&row.pcccInput==='cylinders'?Number(row.pcccCount)*Number(row.pcccKg):Number(row.amount);let gases=[0,0,0,0],bio=0,steps=[],warnings=[],source='';
const gas=id=>{let g=db.gases.find(x=>x.id===id);if(!g)throw Error('Thiếu khí '+id);return g};const gw=id=>gas(id)[p.gwp];const f=id=>{let x=db.other.find(x=>x.id===id);if(!x)throw Error('Thiếu hệ số '+id);return x};const value=id=>f(id).value,ru=id=>f(id).u/100;
if(row.group<2){let t=db.fuels.find(f=>f.id===row.factor);if(!t)throw Error('Thiếu nhiên liệu');let kg=a*t.density,gg=kg*1e-6,tj=gg*t.ncv[0],ch=t.bio?'CH4_BIO':'CH4_FOSSIL';gases=[tj*t.co2[0]/1000,tj*t.ch4[0]*gw(ch)/1000,tj*t.n2o[0]*gw('N2O')/1000,0];if(t.bio){bio=gases[0];gases[0]=0;}steps=[['Khối lượng (kg)',kg],['Khối lượng (Gg)',gg],['Nhiệt lượng (TJ)',tj],['KLR (kg/ĐVT)',t.density],['NCV (TJ/Gg)',t.ncv[0]],['CO₂ gốc (kg)',tj*t.co2[0]],['CH₄ gốc (kg)',tj*t.ch4[0]],['N₂O gốc (kg)',tj*t.n2o[0]],['u NCV (%)',rel(t.ncv)*100],['u EF CO₂ (%)',rel(t.co2)*100],['u EF CH₄ (%)',rel(t.ch4)*100],['u EF N₂O (%)',rel(t.n2o)*100]];source=t.source;
}else if(row.group===2){let tow=a/24*value('BOD')*.001,ef=value('BO_DOM')*value(row.mcf);gases[1]=tow*ef*gw('CH4_BIO')/1000;steps=[['TOW (kg BOD)',tow],['EF (kg CH₄/kg BOD)',ef]];source=f('BOD').source+'; '+f(row.mcf).source;
}else if(row.group===3){let n=a*Number(row.nitrogen),cod=a*Number(row.cod);gases[2]=n*value('EF_N')*44/28*gw('N2O')/1000;if(row.includeCH4){gases[1]=cod*value('BO_IND')*value(row.mcf)*gw('CH4_BIO')/1000;}steps=[['N xả thải (kg N)',n],['COD (kg)',cod]];source=f('EF_N').source;if(a>0){warnings.push('N₂O ở dòng này tính cho nước xả ra nguồn tiếp nhận theo thể tích xả × nồng độ N đầu ra; cần đánh giá riêng N₂O trong công đoạn xử lý nếu thuộc ranh giới kiểm kê.');if(!ru('EF_N'))warnings.push('Chưa có u EF N₂O xả thải; tạm dùng 0. Bổ sung trong Thư viện hệ số nếu có dữ liệu.');if(row.includeCH4&&!ru('BO_IND'))warnings.push('Chưa có u Bo công nghiệp; tạm dùng 0 cho CH₄.');}
}else if(row.group===4||row.group===5){let g=gas(row.factor),gwp=g[p.gwp],ug=g.u;if(g.mix.length){gwp=g.mix.reduce((s,[id,w])=>s+w*gw(id),0);ug=rss(g.mix.map(([id,w])=>gas(id).u*(p.weighted?w:1)));}const gasIndex=g.id==='CO2'?0:3;gases[gasIndex]=a*gwp/1000;if(a>0&&g.mix.length&&!p.weighted)warnings.push('u GWP hỗn hợp đang cộng theo chế độ không trọng số để đối chiếu Excel cũ.');steps=[['GWP-100',gwp],['u GWP',ug]];source=g.source;if(g.id==='HCFC_22')warnings.push('HCFC-22 thuộc Nghị định thư Montreal; rà soát phạm vi và tách riêng nếu quy định yêu cầu.');
}else if(row.group===6){let id=row.factor==='LIME'?'LIME':'UREA';gases[0]=a*value(id)*44/12;source=f(id).source;if(a>0&&id==='UREA'&&f(id).u===25&&source.includes('giả định u=25% từ biên 50%'))warnings.push('Kỳ này dùng u EF urê 25% từ thư viện cũ. Nếu áp dụng EF mặc định Tier 1, hãy rà soát và cập nhật u EF trong Thư viện hệ số.');steps=[['EF (tấn C/tấn)',value(id)],['Hệ số CO₂/C',44/12]];
}else {let g=db.grid.find(g=>g.id===row.factor);if(!g)throw Error('Thiếu hệ số điện');gases[0]=a/1000*g.value;source=g.source;steps=[['Điện năng (MWh)',a/1000],['EF điện (tCO₂/MWh)',g.value],['SD chuỗi EF',sd(gridSeries(p,db).map(g=>g.value))]];if(g.year!==Number(p.year))warnings.push('Dùng EF điện '+g.year+' cho kỳ '+p.year+'.');}
if(p.gwp!=='ar6')warnings.push('u GWP quy đổi tương đối từ AR6; cần rà soát cho '+p.gwp.toUpperCase());const terms=sourceUncertainty(row,p,db,gases),unc=gases.map((_,i)=>row.group===3&&i===1&&!row.includeCH4?0:rss(terms.filter(term=>term.indices.includes(i)).map(term=>term.ratio)));const total=gases.reduce((s,v)=>s+v,0),u=combineUncertainty([{terms}]);return {amount:a,gases,unc,terms,total,u,U:coverage(p)*u,bio,steps,source,warnings};}
function summary(p,db){let rows=p.rows.map(row=>{try{return {...calculate(row,p,db),row}}catch(e){return {row,total:0,u:0,U:0,bio:0,gases:[0,0,0,0],unc:[],steps:[],source:'',warnings:[e.message],error:true}}});let total=rows.reduce((s,r)=>s+r.total,0),u=combineUncertainty(rows),k=coverage(p);return {rows,total,u,k,U:k*u,percent:total?k*u/total*100:0,scope1:rows.filter(r=>r.row.group!==7).reduce((s,r)=>s+r.total,0),scope2:rows.filter(r=>r.row.group===7).reduce((s,r)=>s+r.total,0),bio:rows.reduce((s,r)=>s+r.bio,0),groups:groups.map((_,i)=>rows.filter(r=>r.row.group===i).reduce((s,r)=>s+r.total,0)),gases:[0,1,2,3].map(i=>rows.reduce((s,r)=>s+r.gases[i],0))};}
function validate(db){if(!db||db.schema!==1)throw Error('Sai định dạng sao lưu');for(let k of ['fuels','gases','other','grid','periods']){if(!Array.isArray(db[k]))throw Error('Thiếu bảng '+k);let ids=new Set();for(let x of db[k]){if(!x||typeof x.id!=='string'||!x.id.trim()||ids.has(x.id))throw Error('Mã trùng hoặc sai');ids.add(x.id);}}if(!db.periods.length)throw Error('Cần ít nhất một kỳ');if(db.grid.some(g=>!Number.isInteger(g.year)||g.year<1900||g.year>2200)||new Set(db.grid.map(g=>g.year)).size!==db.grid.length)throw Error('Năm hệ số điện không hợp lệ hoặc trùng');for(let t of db.fuels){if(!Number.isFinite(t.density)||!(t.density>0)||typeof t.name!=='string'||typeof t.unit!=='string'||!['stationary','mobile'].includes(t.type))throw Error('Nhiên liệu không hợp lệ');for(let k of ['ncv','co2','ch4','n2o'])if(!Array.isArray(t[k])||t[k].length!==3||t[k].some(v=>!Number.isFinite(v)||v<0)||t[k][1]>t[k][0]||t[k][2]<t[k][0])throw Error('Khoảng hệ số sai');}for(let g of db.gases){for(let k of ['ar4','ar5','ar6','u'])if(!Number.isFinite(g[k])||g[k]<0)throw Error('GWP sai');if(!Array.isArray(g.mix)||g.mix.some(x=>!Array.isArray(x)||!db.gases.some(g=>g.id===x[0])||!Number.isFinite(x[1])||x[1]<0)||g.mix.length&&Math.abs(g.mix.reduce((s,x)=>s+x[1],0)-1)>1e-6)throw Error('Hỗn hợp sai');}for(let x of [...db.other,...db.grid])if(!Number.isFinite(x.value)||x.value<0||('u'in x&&(!Number.isFinite(x.u)||x.u<0)))throw Error('Hệ số sai');for(let p of db.periods){if(!Array.isArray(p.rows)||!['ar4','ar5','ar6'].includes(p.gwp)||!Number.isInteger(p.year)||p.year<1900||p.year>2200||typeof p.facility!=='string'||!p.facility.trim()||typeof p.weighted!=='boolean')throw Error('Kỳ sai');if(![1.96,2].includes(coverage(p))||p.correlateShared!==undefined&&typeof p.correlateShared!=='boolean')throw Error('Thiết lập độ không đảm bảo không hợp lệ');if((p.gridFrom!=null||p.gridTo!=null)&&(!Number.isInteger(p.gridFrom)||!Number.isInteger(p.gridTo)||p.gridFrom<1900||p.gridTo>2200||p.gridFrom>p.gridTo||gridSeries(p,db).length<2))throw Error('Chọn khoảng có ít nhất hai năm hệ số điện');const rowIds=new Set();for(let r of p.rows){if(!r||typeof r.id!=='string'||rowIds.has(r.id)||typeof r.name!=='string'||!r.name.trim())throw Error('Tên hoặc mã dòng hoạt động sai');rowIds.add(r.id);if(!Number.isInteger(r.group)||r.group<0||r.group>7||!['annual','monthly'].includes(r.mode)||!Number.isFinite(r.amount)||r.amount<0||!Number.isFinite(r.ad)||r.ad<0||!Array.isArray(r.months)||r.months.length!==12||r.months.some(v=>!Number.isFinite(v)||v<0))throw Error('Dữ liệu hoạt động sai');if(r.group===5&&r.factor==='CO2'&&r.mode==='annual'&&r.pcccInput==='cylinders'&&(!String(r.pcccCount??'').trim()||!String(r.pcccKg??'').trim()||!Number.isInteger(Number(r.pcccCount))||Number(r.pcccCount)<0||!Number.isFinite(Number(r.pcccKg))||Number(r.pcccKg)<0))throw Error('Số bình hoặc lượng CO₂ mỗi bình không hợp lệ');let c=calculate(r,p,db);if(!Number.isFinite(c.total)||!Number.isFinite(c.u))throw Error('Kết quả không hợp lệ');}}return true;}
function sharedInputs(results, db) {
  const inputs = new Map();
  const gasById = new Map(db.gases.map(gas => [gas.id, gas]));
  function record(kind, key, label, row) {
    const id = kind + '\0' + key;
    if (!inputs.has(id)) inputs.set(id, { kind, label, rows: new Map() });
    inputs.get(id).rows.set(row.id, row);
  }
  for (const { row, gases, total, error } of results) {
    if (error || total <= 0) continue;
    const factor = id => record('Hệ số / thông số', id, id, row);
    const gwp = id => {
      const gas = gasById.get(id);
      if (gas?.u > 0) record('GWP', id, id, row);
    };
    if (row.group < 2 || row.group === 7) factor(row.factor);
    if (row.group === 6) factor(row.factor === 'LIME' ? 'LIME' : 'UREA');
    if (row.group === 2 && gases[1] > 0) ['BOD', 'BO_DOM', 'PERSON', row.mcf].forEach(factor);
    if (row.group === 3) {
      if (gases[2] > 0) factor('EF_N');
      if (gases[1] > 0) ['BO_IND', row.mcf].forEach(factor);
    }
    if (gases[1] > 0) {
      const fossil = row.group < 2 && !db.fuels.find(fuel => fuel.id === row.factor)?.bio;
      gwp(fossil ? 'CH4_FOSSIL' : 'CH4_BIO');
    }
    if (gases[2] > 0) gwp('N2O');
    if (gases[3] > 0) {
      const gas = gasById.get(row.factor);
      if (gas?.mix.length) gas.mix.forEach(([id, fraction]) => { if (fraction > 0) gwp(id); });
      else gwp(row.factor);
    }
    const device = (row.device || '').trim().replace(/\s+/g, ' ');
    if (device) record('Nhãn thiết bị', device.normalize('NFC').toLocaleLowerCase('vi'), device, row);
  }
  return [...inputs.values()].filter(item => item.rows.size > 1)
    .map(({ kind, label, rows }) => ({ kind, label, rows: [...rows.values()] }));
}
return {seed,calculate,summary,validate,groups,uid,rss,sd,sharedInputs,coverage,gridSeries,combineUncertainty,assessReliability,reliabilitySummary};})();
if(typeof module!=='undefined')module.exports=Engine;
