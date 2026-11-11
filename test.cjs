const assert=require('node:assert/strict'),E=require('./dist/engine.js');
let db=E.seed(),p=db.periods[0],r=p.rows[0];let close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
E.validate(db);let c=E.calculate(r,p,db);close(c.total,134.2818792);assert.ok(c.U/c.total*100>4.2&&c.U/c.total*100<4.3);console.log('DO 50.000 L:',c.total,'tCO2e; U95:',c.U/c.total*100,'%');
let m={...r,mode:'monthly',months:Array(12).fill(50000/12)};close(E.calculate(m,p,db).total,c.total);
let bio=E.calculate({...r,factor:'BIOMASS',amount:1000},p,db);close(bio.bio,1.7472);close(bio.gases[0],0);close(bio.total,.0296712);
let elec=E.calculate({...r,group:7,factor:'GRID_2024',amount:1000000,ad:.1},p,db);close(elec.total,618.7);assert.ok(elec.u>0);
let dom=E.calculate({...r,group:2,amount:24000,mcf:'MCF_SEPTIC',ad:0},p,db);close(dom.total,.324);close(E.calculate({...r,group:2,amount:24000,mcf:'MCF_AERO'},p,db).total,0);
let ind=E.calculate({...r,group:3,amount:1000,nitrogen:.02,cod:.1,mcf:'MCF_ANA',includeCH4:true},p,db);close(ind.gases[2],20*.005*44/28*273/1000);close(ind.gases[1],.54);
let refrigerant={...r,group:4,factor:'R410A',amount:10,ad:0};let weighted=E.calculate(refrigerant,p,db);close(weighted.total,22.555);p.weighted=false;let unweighted=E.calculate(refrigerant,p,db);assert.ok(unweighted.u>weighted.u);p.weighted=true;
close(E.calculate({...r,group:6,factor:'UREA',amount:1,ad:0},p,db).total,.2*44/12);
p.rows=[r,{...r,id:E.uid(),group:7,factor:'GRID_2024',amount:1000000,ad:.1}];let s=E.summary(p,db);close(s.total,c.total+618.7);close(s.u,E.rss([c.u,elec.u]));
let roundtrip=JSON.parse(JSON.stringify(db));E.validate(roundtrip);close(E.summary(roundtrip.periods[0],roundtrip).total,s.total);
let invalid=structuredClone(db);invalid.periods[0].rows[0].amount=-1;assert.throws(()=>E.validate(invalid));invalid=structuredClone(db);invalid.fuels[0].ncv=[43,44,42];assert.throws(()=>E.validate(invalid));invalid=structuredClone(db);invalid.gases.find(g=>g.id==='R410A').mix=[['MISSING',1]];assert.throws(()=>E.validate(invalid));
console.log('PASS: units, monthly, biomass, electricity, domestic/industrial wastewater, mixtures, u RSS, urea, backup validation');

