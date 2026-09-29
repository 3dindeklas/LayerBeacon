import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadContent, render, compose, validate, applyPatches, safeURL, root} from '../scripts/build-guides.mjs';
const load = loadContent;

test('all four models use the complete eight-section Hi layout',()=>{
 const d=load(),pages=render(d); assert.equal(pages.size,5);
 for(const p of d.printers){
  const html=pages.get(p.route);
  assert.equal((html.match(/class="guide-section/g)||[]).length,8);
  for(const className of ['site-layout','sidebar','intro','steps','material-table','workflow','settings-panel','troubleshooting','faq-group','maintenance','support-panel']) assert.ok(html.includes(`class="${className}`),`${p.id}: ${className}`);
  assert.ok(html.includes(p.buildVolumeMm.join(' × ')));
  assert.ok(html.includes(d.slicers.find(s=>s.id===p.slicerId).name));
  assert.equal(html.includes('href="./downloads/Creality_Hi_Combo_Schoolhandleiding.pdf"'),p.id==='creality-hi');
  assert.ok(!html.includes('{{'));
 }
});
test('source data patches can append, replace and remove without changing another printer',()=>{
 const d=load(),p=d.printers.find(p=>p.id==='bambu-p1s');const before=JSON.stringify(d.shared);
 p.patches=[{collection:'steps',id:'step-1',mode:'append',body:[{type:'p',text:'Unieke aanvulling'}]},{collection:'cases',id:'fout-eerste-laag',mode:'replace',item:{id:'fout-eerste-laag',title:'Vervanging',body:[{type:'p',text:'Unieke vervanging'}]}},{collection:'faq',id:'faq-verschillende-materialen',mode:'remove'}];
 const result=compose(d,p),other=compose(d,d.printers[0]);
 assert.equal(result.steps[0].addition[0].text,'Unieke aanvulling');assert.equal(result.cases[0].title,'Vervanging');assert.ok(!result.faq.some(x=>x.id==='faq-verschillende-materialen'));
 assert.ok(!JSON.stringify(other).includes('Unieke'));assert.equal(JSON.stringify(d.shared),before);
});
test('model cases and fault codes never leak across printers',()=>{
 const pages=render(load());
 const expected={'TC2854':'index.html','FB2844':'printer-creality-k2.html','26834':'printer-prusa-mk4s.html','fout-ams-aanvoer':'printer-bambu-p1s.html'};
 for(const [code,route] of Object.entries(expected))for(const [path,html] of pages)assert.equal(html.includes(code),path===route,`${code} in ${path}`);
 for(const route of ['printer-bambu-p1s.html','printer-prusa-mk4s.html'])assert.ok(!pages.get(route).includes('CFS'));
});
test('all local links, anchors and resources resolve under a repository subpath',()=>{
 const pages=render(load());
 for(const [path,html] of pages){
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,`duplicate ID in ${path}`);
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const href=match[1];
   if(href.startsWith('#'))assert.ok(ids.includes(href.slice(1)),`${path}: ${href}`);
   if(href.startsWith('./'))assert.ok(pages.has(href.slice(2))||existsSync(resolve(root,href.slice(2))),`${path}: ${href}`);
  }
 }
});
test('the public Hi anchors and PDF remain compatible',()=>{
 const html=render(load()).get('index.html');
 for(const id of ['snelstart','filament','creality-print','supports','storingen','faq','beheer','downloads','faq-formaat','fout-eerste-laag','fout-cfs','fout-tc2854','fout-xs2001','fout-draden','fout-warping','fout-aanvoer','fout-verschuiving','fout-ribbels'])assert.ok(html.includes(`id="${id}"`),id);
 assert.ok(html.includes('Schooljaar 2026/2027'));
});
test('invalid data, unsupported fields and missing references stop generation',()=>{
 const mutations=[d=>d.printers[0].slicerId='missing',d=>d.printers[0].cases[0].sourceIds=['missing'],d=>d.printers[1].id=d.printers[0].id,d=>d.printers[0].buildVolumeMm=[0,1,2],d=>d.printers[0].defaultSetup='missing',d=>d.printers[0].cases[0].setups=['unknown'],d=>d.printers[1].route='index.html',d=>d.printers[0].downloads[0].printerId='bambu-p1s',d=>d.printers[1].materials=[],d=>d.shared.steps[0].title='{{unknownToken}}',d=>d.shared.steps[0].body=[{type:'rawHTML',text:'<script>no</script>'}],d=>d.printers[1].patches=[{collection:'steps',id:'missing',mode:'remove'}],d=>d.printers[0].cases[0].body.push({type:'link',text:'bad',href:'javascript:alert(1)'})];
 for(const mutate of mutations){const d=load();mutate(d);assert.throws(()=>validate(d));}
});
test('patches cannot silently overwrite another patch or create an unknown target',()=>{
 const base={steps:[{id:'x',body:[{type:'p',text:'baseline'}]}]};
 assert.throws(()=>applyPatches(base,[{collection:'steps',id:'x',mode:'append',body:[]}]));
 assert.throws(()=>applyPatches(base,[{collection:'steps',id:'x',mode:'replace',item:{id:'y'}}]));
 assert.throws(()=>applyPatches(base,[{collection:'steps',id:'x',mode:'remove'},{collection:'steps',id:'x',mode:'remove'}]));
});
test('untrusted text is escaped and unsafe URL schemes are rejected',()=>{
 const d=load();d.printers[1].name='<img src=x onerror=alert(1)>';
 const html=render(d).get('printer-bambu-p1s.html');assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
 for(const url of ['javascript:alert(1)','data:text/html,bad','http://example.com','./../private','//example.com','https://user:pass@example.com'])assert.throws(()=>safeURL(url));
});
test('generated pages are synchronized with JSON and the shared template',()=>{
 for(const [path,html] of render(load()))assert.equal(readFileSync(resolve(root,path),'utf8'),html,`${path}: run npm run build:guides`);
});
