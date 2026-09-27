import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {render,validate,compose} from '../scripts/build-guides.mjs';
const root = new URL('../',import.meta.url);
const load = () => JSON.parse(readFileSync(new URL('content/catalog.json',root),'utf8'));
test('unique printer routes have their own correct volume and software',()=>{
 const d=load(); const pages=render(d);
 assert.equal(pages.size,4);
 for(const p of d.printers){
  const html=pages.get(`printer-${p.id}.html`);
  assert.ok(html.includes(p.buildVolumeMm.join(' × ')));
  assert.ok(html.includes(d.slicers.find(s=>s.id===p.slicerId).name));
  assert.ok(!html.includes('href="./downloads/'));
  for(const match of html.matchAll(/(?:href|src)="\.\/([^"#]+)(?:#[^"]*)?"/g)) assert.ok(pages.has(match[1])||existsSync(new URL(match[1],root)),match[1]);
 }
});
test('unknown references, duplicate routes and invalid dimensions block generation',()=>{
 for(const mutate of [d=>d.printers[0].slicerId='missing',d=>d.printers[0].sourceIds=['missing'],d=>d.printers[1].id=d.printers[0].id,d=>d.printers[0].buildVolumeMm=[0,1,2],d=>d.printers[0].defaultConfiguration='missing',d=>d.sources.p1s.url='javascript:alert(1)',d=>d.printers[0].downloads=['wrong.pdf']]){
  const d=load();mutate(d);assert.throws(()=>validate(d));
 }
});
test('model overrides replace shared content without leaking to another model',()=>{
 const d=load();d.printers[0].overrides['eerste-print']=['Alleen voor P1S'];
 assert.deepEqual(compose(d,d.printers[0])[0].items,['Alleen voor P1S']);
 assert.notDeepEqual(compose(d,d.printers[1])[0].items,['Alleen voor P1S']);
});
test('data is escaped as text and source schemes are restricted',()=>{
 const d=load();d.printers[0].name='<script>alert(1)</script>';
 assert.ok(!render(d).get('printer-bambu-p1s.html').includes('<script>alert(1)</script>'));
});

import vm from 'node:vm';
test('setup links, invalid setup fallback and configuration changes',()=>{
 for (const setup of ['multicolor','single','unknown']) {
  const options=[{value:'single'},{value:'multicolor'}];
  const panels=options.map(o=>({dataset:{configurationPanel:o.value},hidden:false}));
  const handlers={};
  const select={options,value:'single',addEventListener:(name,cb)=>handlers[name]=cb};
  let currentUrl;
  const context={URL,document:{querySelector:()=>select,querySelectorAll:()=>panels,getElementById:()=>null},location:{href:`https://example.com/LayerBeacon/printer-bambu-p1s.html?setup=${setup}#eerste-print`,hash:'#eerste-print'},history:{replaceState:(_,__,url)=>currentUrl=url},window:{addEventListener:()=>{}}};
  vm.runInNewContext(readFileSync(new URL('catalog.js',root),'utf8'),context);
  assert.equal(select.value,setup==='multicolor'?'multicolor':'single');
  assert.equal(panels.filter(p=>!p.hidden).length,1);
  select.value='multicolor';handlers.change();
  assert.equal(currentUrl.searchParams.get('setup'),'multicolor');
  assert.equal(currentUrl.hash,'#eerste-print');
  assert.equal(currentUrl.pathname,'/LayerBeacon/printer-bambu-p1s.html');
 }
});
