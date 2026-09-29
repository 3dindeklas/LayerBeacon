import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
export function loadContent() {
  const site = readJSON('content/site.json');
  assert(Array.isArray(site.printers) && site.printers.every(id => slug.test(id)), 'Invalid printer manifest');
  return { site, shared: readJSON('content/shared.json'), slicers: readJSON('content/slicers.json'), printers: site.printers.map(id => readJSON(`content/printers/${id}.json`)) };
}
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const collections = ['steps','materials','materialNotes','cards','cases','faq','maintenance','softwareSteps','calibrations','networkNotes'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
function keys(value, allowed, label) { assert(value && typeof value === 'object' && !Array.isArray(value), `Invalid ${label}`); for (const key of Object.keys(value)) assert(allowed.includes(key), `Unknown ${label} field: ${key}`); }
function text(value, label) { assert(typeof value === 'string' && value.trim().length > 0, `Missing ${label}`); }
function id(value) { assert(typeof value === 'string' && slug.test(value), `Invalid ID: ${value}`); }
function unique(list, label) { assert(Array.isArray(list), `Missing ${label}`); const ids = list.map(x => x.id); ids.forEach(id); assert(new Set(ids).size === ids.length, `Duplicate ${label} ID`); }
export function safeURL(value) {
  assert(typeof value === 'string', 'Invalid URL');
  if (value.startsWith('#')) { assert(slug.test(value.slice(1)), 'Invalid anchor'); return value; }
  if (value.startsWith('./')) { assert(/^\.\/[a-zA-Z0-9_./-]+(?:#[a-z0-9-]+)?$/.test(value) && !value.slice(2).includes('..'), 'Invalid local URL'); return value; }
  const url = new URL(value); assert(url.protocol === 'https:' && !url.username && !url.password, 'Only HTTPS links are allowed'); return value;
}
function source(x) { keys(x,['id','label','url','reviewedAt'],'source'); id(x.id); text(x.label,'source label'); safeURL(x.url); if (x.reviewedAt) assert(/^\d{4}-\d{2}-\d{2}$/.test(x.reviewedAt),'Invalid review date'); }
function applicability(value, printer) { if (value === undefined) return; assert(Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every(x => printer.setups.some(s => s.id === x)), 'Unknown or duplicate setup'); }
function body(nodes, printer, sources) {
  assert(Array.isArray(nodes) && nodes.length > 0, 'Empty body');
  for (const n of nodes) {
    keys(n,['type','text','items','href','tone','setups'],'body');
    assert(['p','ul','ol','link'].includes(n.type),'Unknown body type');
    applicability(n.setups, printer);
    if (n.tone !== undefined) assert(n.type === 'p' && n.tone === 'first','Invalid body tone');
    if (['ul','ol'].includes(n.type)) { assert(Array.isArray(n.items) && n.items.length > 0,'Empty list'); n.items.forEach(x => text(x,'list item')); }
    else text(n.text,'body text');
    if (n.type === 'link') safeURL(n.href);
  }
}
function item(x, category, printer, sources) {
  const allowed = category === 'materials' ? ['id','name','label','tone','text','route','note','setups','sourceIds'] : ['id','title','subtitle','body','kicker','group','setups','code','sourceIds','addition'];
  keys(x,allowed,category); id(x.id); applicability(x.setups,printer);
  if (x.sourceIds) assert(Array.isArray(x.sourceIds) && x.sourceIds.length > 0 && x.sourceIds.every(s => sources.some(y => y.id === s)),'Unknown source reference');
  if (category === 'materials') { ['name','label','text','route','note'].forEach(k=>text(x[k],k)); assert(['good','teal','purple','plain','caution'].includes(x.tone),'Unknown material tone'); }
  else {
    text(x.title,'title'); body(x.body,printer,sources);
    if (category === 'faq') text(x.group,'FAQ group');
    if (x.addition) body(x.addition,printer,sources);
    if (x.code) { text(x.code,'error code'); assert(x.sourceIds?.length,'Error code needs a source'); }
  }
}
export function applyPatches(base, patches) {
  const result = structuredClone(base);
  const seen = new Set();
  for (const patch of patches) {
    keys(patch,['collection','id','mode','body','item'],'patch');
    assert(collections.includes(patch.collection),'Unknown patch collection');
    assert(['append','replace','remove'].includes(patch.mode),'Unknown patch mode');
    const key = `${patch.collection}:${patch.id}`; assert(!seen.has(key),'Duplicate patch target'); seen.add(key);
    const list = result[patch.collection];
    const index = list.findIndex(x => x.id === patch.id); assert(index !== -1,`Unknown patch target: ${key}`);
    if (patch.mode === 'append') { assert(Array.isArray(list[index].body) && Array.isArray(patch.body) && patch.body.length && !patch.item,'Invalid append patch'); list[index].addition = patch.body; }
    if (patch.mode === 'replace') { assert(patch.item?.id === patch.id && !patch.body,'Replacement must keep the same ID'); list[index] = structuredClone(patch.item); }
    if (patch.mode === 'remove') { assert(!patch.item && !patch.body,'Remove patch has unused fields'); list.splice(index,1); }
  }
  return result;
}
function tokens(data, printer) {
  const software = data.slicers.find(x => x.id === printer.slicerId);
  return {printerName:printer.name,slicerName:software.name,profileName:printer.profileName,buildVolume:printer.buildVolumeMm.join(' × '),filamentDiameter:String(printer.filamentDiameterMm).replace('.',','),offlineMedia:printer.offlineMedia};
}
function interpolate(value, variables) {
  if (Array.isArray(value)) return value.map(x => interpolate(x,variables));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,interpolate(v,variables)]));
  if (typeof value !== 'string') return value;
  const result = value.replace(/\{\{([a-zA-Z0-9]+)\}\}/g,(_,key)=>{assert(Object.hasOwn(variables,key),`Unknown token: ${key}`);return variables[key];});
  assert(!/[{}]{2}/.test(result),'Malformed token'); return result;
}
export function compose(data, printer) {
  const software = data.slicers.find(x => x.id === printer.slicerId); assert(software,'Unknown slicer');
  const base = {...data.shared,softwareSteps:software.steps,calibrations:[software.calibration],networkNotes:[{id:'network',title:'Schoolnetwerk werkt niet mee?',body:[{type:'p',text:'Controleer met ICT of computer en printer elkaar mogen bereiken. Een gasten- of leerlingennetwerk kan apparaten scheiden. Gebruik zo nodig {{offlineMedia}} met een bestand dat voor {{profileName}} is geslicet.'}]}]};
  const guide = applyPatches(base,printer.patches);
  for (const category of ['cases','faq','maintenance']) guide[category].push(...structuredClone(printer[category]));
  guide.sources = [...guide.sources, ...printer.sources];
  guide.settings = printer.settings ?? guide.settings;
  return interpolate(guide,tokens(data,printer));
}
export function validate(data) {
  keys(data,['site','shared','slicers','printers'],'content');
  keys(data.site,['schemaVersion','brand','schoolYear','printers','defaultPrinter','catalogTitle'],'site');
  keys(data.shared,['schemaVersion','sections','steps','materials','materialNotes','cards','cases','faq','maintenance','safety','stop','settings','glossary','supportNote','helpChecklist','sources'],'shared');
  assert(data.site.schemaVersion===2 && data.shared.schemaVersion===2,'Unsupported schema version');
  assert(/^\d{4}\/\d{4}$/.test(data.site.schoolYear),'Invalid school year');
  unique(data.printers,'printer');unique(data.slicers,'slicer');unique(data.shared.sections,'section');
  assert(JSON.stringify(data.site.printers)===JSON.stringify(data.printers.map(x=>x.id)),'Printer manifest mismatch');
  assert(data.printers.some(x=>x.id===data.site.defaultPrinter),'Unknown default printer');
  assert(new Set(data.printers.map(x=>x.route)).size===data.printers.length,'Duplicate route');
  assert(data.shared.sections.map(x=>x.id).join(',')==='snelstart,filament,software,supports,storingen,faq,beheer,downloads','Invalid section order');
  for (const s of data.slicers) { keys(s,['id','name','docs','testedVersion','steps','calibration'],'slicer'); text(s.name,'slicer name'); safeURL(s.docs); }
  for (const p of data.printers) {
    keys(p,['schemaVersion','id','name','route','slicerId','profileName','buildVolumeMm','filamentDiameterMm','standardNozzleMm','offlineMedia','review','defaultSetup','setups','patches','cases','faq','maintenance','downloads','sources','supportLinks','scopeNote','settings'],'printer');
    assert(p.schemaVersion===2,'Unsupported printer schema');
    ['name','profileName','offlineMedia'].forEach(k=>text(p[k],k));
    assert(/^[a-z0-9-]+\.html$/.test(p.route) && p.route!=='printers.html','Invalid printer route');
    assert(p.buildVolumeMm.length===3 && p.buildVolumeMm.every(n=>Number.isFinite(n)&&n>0),'Invalid volume');
    assert(p.filamentDiameterMm>0 && p.standardNozzleMm>0,'Invalid filament/nozzle size');
    assert(data.slicers.some(x=>x.id===p.slicerId),'Unknown slicer');
    keys(p.review,['contentStatus','firmware','testedAtSchool'],'review');
    assert(['practical-guide','initial-guide'].includes(p.review.contentStatus),'Unknown content status');
    assert(typeof p.review.testedAtSchool==='boolean','Invalid test status');
    unique(p.setups,'setup');assert(p.setups.length>0&&p.setups.some(x=>x.id===p.defaultSetup),'Invalid default setup');
    for(const setup of p.setups){keys(setup,['id','label','capacity','note'],'setup');text(setup.label,'setup label');text(setup.note,'setup note');assert(Number.isInteger(setup.capacity)&&setup.capacity>0,'Invalid capacity');}
    const guide=compose(data,p);
    unique(guide.sources,'source'); guide.sources.forEach(source);
    let allIDs=['inhoud','onderwerpen','printer-selection','setup-selection',...guide.sections.map(x=>x.id)];
    for(const category of collections) {
      unique(guide[category],category);
      for(const x of guide[category]) item(x,category,p,guide.sources);
      allIDs.push(...guide[category].map(x=>x.id));
    }
    assert(guide.steps.length>0 && guide.materials.length>0,'Required content removed');
    assert(new Set(allIDs).size===allIDs.length,'Duplicate page ID');
    for(const download of p.downloads){keys(download,['label','description','path','printerId'],'download');assert(download.printerId===p.id,'Download belongs to another printer');assert(/^downloads\/[A-Za-z0-9_-]+\.pdf$/.test(download.path),'Invalid download path');assert(existsSync(resolve(root,download.path)),'Missing download');}
    for(const l of p.supportLinks){keys(l,['label','url'],'support link');text(l.label,'support link label');safeURL(l.url);}
    for(const v of guide.settings.values){text(v.label,'setting');text(v.value,'setting value');}
  }
}
const plus = '<span class="plus" aria-hidden="true"></span>';
function scope(item) {return item.setups?` data-setups="${item.setups.join(' ')}"`:'';}
function scopeLabel(item,printer){return item.setups?`<span class="setup-label">${item.setups.map(id=>escape(printer.setups.find(x=>x.id===id).label)).join(' / ')}</span>`:'';}
function renderBody(nodes, printer) {
 return nodes.map(n=>{
   const label=scopeLabel(n,printer),attrs=scope(n);
   if(n.type==='p') return `<p${attrs}${n.tone?' class="first-action"':''}>${label}${escape(n.text)}</p>`;
   if(n.type==='link')return `<p${attrs}>${label}<a class="text-link" href="${escape(safeURL(n.href))}">${escape(n.text)}</a></p>`;
   return `<div${attrs}>${label}<${n.type}>${n.items.map(x=>`<li>${escape(x)}</li>`).join('')}</${n.type}></div>`;
 }).join('\n');
}
function content(item,p,guide){return renderBody(item.body,p)+(item.addition?`<aside class="printer-specific"><strong>Voor ${escape(p.name)}</strong>${renderBody(item.addition,p)}</aside>`:'')+(item.sourceIds?.length?`<p class="source-links">${item.sourceIds.map(id=>{const s=guide.sources.find(x=>x.id===id);return `<a href="${escape(s.url)}">${escape(s.label)}</a>`;}).join(' · ')}</p>`:'');}
function detail(item,p,guide,{step,open=false,faq=false,standalone=false}={}) {
 const title=faq?escape(item.title):`<span>${step?'':'<strong>'}${escape(item.title)}${step?'':'</strong>'}${item.subtitle?`<small>${escape(item.subtitle)}</small>`:''}</span>`;
 return `<details id="${item.id}"${scope(item)}${open?' open':''}${standalone?' class="standalone"':''}><summary>${step?`<span class="step-number">${step}</span>`:''}${title}${plus}</summary><div class="detail-body">${scopeLabel(item,p)}${content(item,p,guide)}</div></details>`;
}
function note(n,p,g){return `<aside id="${n.id}" class="note"${scope(n)}><strong>${escape(n.title)}</strong>${content(n,p,g)}</aside>`;}
function safety(n){return `<aside class="note safety"><strong>${escape(n.title)}</strong><p>${escape(n.text)}</p></aside>`;}
function downloads(p) {return p.downloads.map(d=>`<a class="download-card" href="./${escape(d.path)}" download><span class="file-icon" aria-hidden="true">PDF</span><span><strong>${escape(d.label)}</strong><small>${escape(d.description)}</small></span><span class="download-arrow" aria-hidden="true">↓</span></a>`).join('');}
function renderSection(s,g,p) {
 if(s.id==='snelstart')return `<div class="steps">${g.steps.map((x,i)=>detail(x,p,g,{step:i+1,open:i===0})).join('\n')}</div>${safety(g.safety)}`;
 if(s.id==='filament')return `<div class="material-table" role="table" aria-label="Filamentkeuze"><div class="material-row material-header" role="row"><span role="columnheader">Materiaal</span><span role="columnheader">Gebruik & aandachtspunten</span><span role="columnheader">Aanvoer</span></div>${g.materials.map(m=>`<div id="${m.id}" class="material-row" role="row"${scope(m)}><div role="cell"><strong>${escape(m.name)}</strong><span class="label ${m.tone}">${escape(m.label)}</span></div><p role="cell">${escape(m.text)}</p><div role="cell"><strong>${escape(m.route)}</strong><span>${escape(m.note)}</span></div></div>`).join('')}</div><div class="two-col notes-row">${g.materialNotes.map(n=>note(n,p,g)).join('')}</div>`;
 if(s.id==='software')return `<ol class="workflow">${g.softwareSteps.map(n=>`<li id="${n.id}"><strong>${escape(n.title)}</strong>${content(n,p,g)}</li>`).join('')}</ol><div class="settings-panel"><div><p class="eyebrow">STARTPUNT VOOR EEN LESMODEL</p><h3>${escape(g.settings.title)}</h3><p>${escape(g.settings.note)}</p></div><dl class="settings">${g.settings.values.map(v=>`<div><dt>${escape(v.label)}</dt><dd>${escape(v.value)}</dd></div>`).join('')}</dl></div>${g.calibrations.map(x=>detail(x,p,g,{standalone:true})).join('')}<div class="notes-row">${g.networkNotes.map(n=>note(n,p,g)).join('')}</div>`;
 if(s.id==='supports')return `<div class="two-col">${g.cards.map((x,i)=>`<article id="${x.id}" class="topic-card ${i===1?'purple-card':''}"${scope(x)}><span class="card-kicker">${escape(x.kicker??'')}</span><h3>${escape(x.title)}</h3>${scopeLabel(x,p)}${content(x,p,g)}</article>`).join('')}</div><div class="glossary">${g.glossary.map(x=>`<div><strong>${escape(x.term)}</strong><p>${escape(x.text)}</p></div>`).join('')}</div><p class="small-text">${escape(g.supportNote)}</p>`;
 if(s.id==='storingen')return `<div class="quick-errors"><span>Snel naar:</span>${g.cases.filter(x=>x.code||x.setups).map(x=>`<a href="#${x.id}"${scope(x)}>${escape(x.code??x.title)} <span aria-hidden="true">↘</span></a>`).join('')}<a href="#fout-eerste-laag">Eerste laag ↘</a></div><div class="troubleshooting">${g.cases.map(x=>detail(x,p,g)).join('\n')}</div>${safety(g.stop)}`;
 if(s.id==='faq')return [...new Set(g.faq.map(x=>x.group))].map(group=>`<div class="faq-group"><h3>${escape(group)}</h3>${g.faq.filter(x=>x.group===group).map(x=>detail(x,p,g,{faq:true})).join('\n')}</div>`).join('');
 if(s.id==='beheer')return `<div class="maintenance">${g.maintenance.map(x=>`<div id="${x.id}"${scope(x)}><span>${escape(x.title)}</span><div>${scopeLabel(x,p)}${content(x,p,g)}</div></div>`).join('')}</div><div class="support-panel"><div><h3>Kom je er niet uit?</h3><p>Neem eerst contact op met de printerbeheerder of leverancier. Verzamel de gegevens hieronder, zodat die gericht kan helpen.</p><ul>${g.helpChecklist.map(t=>`<li>${escape(t)}</li>`).join('')}</ul></div><div class="support-links">${p.supportLinks.map(l=>`<a href="${escape(l.url)}">${escape(l.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div></div><p class="small-text">Voor hulp bij het inzetten in de les: <a href="https://www.3dindeklas.nl/">3dindeklas.nl</a>. Voor een technisch defect of garantie is de leverancier het eerste aanspreekpunt.</p>`;
 if(s.id==='downloads')return `${p.downloads.length?downloads(p):'<p class="note">Voor deze printer is nog geen afzonderlijke schoolhandleiding als PDF beschikbaar. Gebruik voorlopig deze online gids.</p>'}<details class="standalone sources"><summary>Officiële documentatie en verdere uitleg${plus}</summary><div class="detail-body"><ul>${g.sources.map(l=>`<li><a href="${escape(l.url)}">${escape(l.label)}</a></li>`).join('')}</ul></div></details><p class="editorial-note">Deze naslagsite is samengesteld door 3dindeklas. Test startinstellingen op je eigen printer en gebruik bij onderhoud de instructie voor het exacte model en onderdeel.</p>`;
 throw new Error(`No renderer for section ${s.id}`);
}
function fillTemplate(template,values){return template.replace(/\{\{(\w+)\}\}/g,(_,key)=>{assert(Object.hasOwn(values,key),`Unknown template slot: ${key}`);return values[key];});}
export function render(data,{template=readFileSync(resolve(root,'templates/guide.html'),'utf8')}={}) {
 validate(data);
 const outputs=new Map();
 for(const p of data.printers){
   const g=compose(data,p),slicer=data.slicers.find(x=>x.id===p.slicerId);
   const aliases={snelstart:['eerste-print'],software:p.slicerId==='creality-print'?['creality-print']:[],storingen:['problemen'],downloads:['bronnen'],beheer:['nog-aanvullen']};
   const sections=g.sections.map((s,i)=>`${(aliases[s.id]??[]).map(alias=>`<span id="${alias}" class="anchor-alias" aria-hidden="true"></span>`).join('')}<section id="${s.id}" class="guide-section${i===g.sections.length-1?' last-section':''}"><div class="section-heading"><span class="section-number">${String(i+1).padStart(2,'0')}</span><div><p class="eyebrow">${escape(s.eyebrow)}</p><h2>${escape(s.title)}</h2></div></div>${s.lead?`<p class="section-lead">${escape(s.lead)}</p>`:''}${s.id==='snelstart'?'<span id="veiligheid" class="anchor-alias" aria-hidden="true"></span>':''}${renderSection(s,g,p)}</section>`).join('\n');
   const selection=`<div class="guide-selection"><div><label for="printer-selection">Jouw printer</label><select id="printer-selection" data-printer-selection>${data.printers.map(x=>`<option value="${x.route}"${x.id===p.id?' selected':''}>${escape(x.name)}</option>`).join('')}</select></div><div><label for="setup-selection">Materiaaltoevoer</label><select id="setup-selection" data-configuration data-default="${p.defaultSetup}">${p.setups.map(x=>`<option value="${x.id}"${x.id===p.defaultSetup?' selected':''}>${escape(x.label)}</option>`).join('')}</select></div><noscript><p>De keuzelijsten werken met JavaScript. <a href="./printers.html">Kies hier je printer</a>. De uitleg voor beide aanvoerroutes staat hieronder bij elkaar.</p></noscript></div>`;
   const specs=`<dl class="specs" aria-label="De printer in het kort"><div><dt>PRINTFORMAAT</dt><dd>${p.buildVolumeMm.map(v=>String(v/10).replace('.',',')).join(' × ')} <small>cm</small></dd></div><div><dt>MATERIAALTOEVOER</dt><dd>${p.setups.map(x=>`<span data-setups="${x.id}">${x.capacity} <small>${x.capacity===1?'rol':'rollen'} · 1 nozzle</small></span>`).join('')}</dd></div><div><dt>FILAMENT / NOZZLE</dt><dd>${String(p.filamentDiameterMm).replace('.',',')} <small>mm</small> <span>/</span> ${String(p.standardNozzleMm).replace('.',',')} <small>mm*</small></dd></div></dl><p class="spec-note">* Standaard nozzle. Controleer de werkelijke maat. Brim, supports, uitsluitingszones en een prime- of wipe tower beperken de bruikbare ruimte.</p>`;
   const setupNotes=`<div class="setup-notes">${p.setups.map(x=>`<p data-setups="${x.id}"><strong>${escape(x.label)}.</strong> ${escape(x.note)}</p>`).join('')}${p.scopeNote?`<p>${escape(p.scopeNote)}</p>`:''}${p.review.contentStatus==='initial-guide'?'<p class="guide-status">Eerste versie: basisuitleg en gerichte modeltips. Nog niet op een schoolprinter getest.</p>':''}</div>`;
   const navigation=g.sections.map((x,i)=>`<a href="#${x.id}" class="nav-link${i===0?' active':''}"${i===0?' aria-current="location"':''}><span>${String(i+1).padStart(2,'0')}</span> ${escape(x.nav)}</a>`).join('\n');
   const sidebarDownload=p.downloads[0]?`<a class="sidebar-download" href="./${escape(p.downloads[0].path)}" download><span aria-hidden="true">↓</span> Handleiding als PDF</a>`:'';
   outputs.set(p.route,fillTemplate(template,{title:escape(p.name),description:escape(`Praktische hulp voor docenten met de ${p.name}: eerste print, filament, ${slicer.name}, storingen en veelgestelde vragen. Van 3dindeklas.`),printerName:escape(p.name),printerId:p.id,navigation,sidebarDownload,selection,specs,setupNotes,sections,schoolYear:escape(data.site.schoolYear)}));
 }
 const cards=data.printers.map(p=>`<a class="printer-card" href="./${p.route}"><h2>${escape(p.name)}</h2><p>${p.buildVolumeMm.join(' × ')} mm</p><p>${escape(data.slicers.find(x=>x.id===p.slicerId).name)}</p><strong>Open de printgids →</strong></a>`).join('');
 outputs.set('printers.html',`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kies je printer · LayerBeacon | 3dindeklas</title><link rel="icon" href="./assets/favicon.ico"><link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="./catalog.css"></head><body><a class="skip-link" href="#inhoud">Direct naar de inhoud</a><header class="site-header"><div class="header-inner"><a class="brand" href="https://www.3dindeklas.nl/"><img src="./assets/logo-3dindeklas.png" alt="3dindeklas" width="62" height="72"></a><div class="header-title"><span>LEREN DOOR CREËREN</span><strong>LayerBeacon</strong></div></div></header><main id="inhoud" class="catalog-main"><p class="eyebrow">Praktische printhulp voor het onderwijs</p><h1>${escape(data.site.catalogTitle)}</h1><p>Dezelfde vertrouwde uitleg, met de gegevens en aandachtspunten voor jouw printer.</p><div class="printer-grid">${cards}</div><p class="note">Begin met één kleur PLA en een klein model. De gidsen voor P1S, K2 en MK4S bevatten eerste modeltips en worden verder aangevuld.</p><footer class="site-footer">3dindeklas · Schooljaar ${escape(data.site.schoolYear)}</footer></main></body></html>\n`);
 return outputs;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const outputs=render(loadContent());
 for(const [path,html] of outputs){if(process.argv.includes('--check'))assert(existsSync(resolve(root,path))&&readFileSync(resolve(root,path),'utf8')===html,`Generated file is stale: ${path}`);else writeFileSync(resolve(root,path),html);}
 console.log(`${outputs.size} shared-template pages ${process.argv.includes('--check')?'checked':'generated'}.`);
}
