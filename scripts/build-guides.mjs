import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function requireValue(condition, message) { if (!condition) throw new Error(message); }
export function validate(data) {
  requireValue(data.schemaVersion === 1, 'Unsupported schema version');
  for (const list of [data.printers, data.slicers, data.sharedSections]) {
    requireValue(Array.isArray(list) && list.length > 0, 'Missing catalog collection');
    requireValue(new Set(list.map(x => x.id)).size === list.length, 'Duplicate IDs');
    list.forEach(x => requireValue(slug.test(x.id), 'Invalid ID: ' + x.id));
  }
  for (const source of Object.values(data.sources)) {
    requireValue(new URL(source.url).protocol === 'https:', 'Source must use HTTPS');
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(source.reviewedAt), 'Missing review date');
  }
  for (const software of data.slicers) requireValue(new URL(software.docs).protocol === 'https:', 'Invalid software link');
  for (const section of data.sharedSections) {
    requireValue(['steps','paragraphs'].includes(section.kind), 'Unknown section kind');
    requireValue(section.items.length > 0, 'Empty section');
  }
  for (const printer of data.printers) {
    requireValue(printer.status === 'starter', 'Only starter profiles are supported in v1');
    requireValue(printer.buildVolumeMm.length === 3 && printer.buildVolumeMm.every(x => Number.isFinite(x) && x > 0), 'Invalid volume');
    requireValue(data.slicers.some(s => s.id === printer.slicerId), 'Unknown slicer');
    requireValue(printer.sourceIds.length > 0 && printer.sourceIds.every(id => data.sources[id]), 'Unknown source');
    requireValue(printer.configurations.length > 0 && new Set(printer.configurations.map(x => x.id)).size === printer.configurations.length, 'Invalid configurations');
    requireValue(printer.configurations.every(x => slug.test(x.id)), 'Invalid configuration ID');
    requireValue(printer.configurations.some(x => x.id === printer.defaultConfiguration), 'Missing default configuration');
    requireValue(Object.keys(printer.overrides).every(id => data.sharedSections.some(s => s.id === id)), 'Unknown override target');
    for (const override of Object.values(printer.overrides)) requireValue(Array.isArray(override) && override.length > 0 && override.every(x => typeof x === 'string'), 'Invalid override');
    // Reserved facets are intentionally blocked until their renderer and matching rules exist.
    for (const key of ['connections','materialRules','maintenance','errors','downloads']) requireValue(Array.isArray(printer[key]) && printer[key].length === 0, 'Facet not implemented yet: ' + key);
    requireValue(Object.values(printer.hardware).every(x => x === null), 'Hardware selection is not implemented yet');
  }
}
export function compose(data, printer) {
  return data.sharedSections.map(section => ({...section, items: printer.overrides[section.id] ?? section.items}));
}
function shell(title, body, data) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · LayerBeacon</title><meta name="description" content="Praktische 3D-printhulp voor het onderwijs, van 3dindeklas."><link rel="icon" href="./assets/favicon.ico"><link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="./catalog.css"><script src="./catalog.js" defer></script></head><body><a class="skip-link" href="#inhoud">Direct naar de inhoud</a><header class="site-header"><div class="header-inner"><a class="brand" href="./printers.html"><img src="./assets/logo-3dindeklas.png" alt="3dindeklas — naar printeroverzicht" width="62" height="72"></a><div class="header-title"><span>3dindeklas</span><strong>LayerBeacon</strong></div></div></header><main id="inhoud" class="catalog-main">${body}<footer>${escape(data.brand.name)} · Schooljaar ${escape(data.brand.schoolYear)}</footer></main></body></html>\n`;
}
export function render(data) {
  validate(data);
  const outputs = new Map();
  const cards = data.printers.map(p => `<a class="printer-card" href="./printer-${p.id}.html"><h2>${escape(p.name)}</h2><p>${p.buildVolumeMm.join(' × ')} mm</p><p class="status">Basisgids · wordt uitgebreid</p><strong>Bekijk de gids →</strong></a>`).join('');
  outputs.set('printers.html', shell('Kies je printer', `<p class="eyebrow">Praktische printhulp voor het onderwijs</p><h1>Met welke printer werk je?</h1><p>Begin met de basis en bekijk wat voor jouw printer van belang is.</p><div class="printer-grid">${cards}<a class="printer-card" href="./index.html"><h2>Creality Hi Combo</h2><p>Uitgebreide naslag met storingshulp en schoolhandleiding.</p><strong>Open de handleiding →</strong></a></div><aside class="note"><strong>We bouwen verder</strong><p>De drie nieuwe gidsen bevatten algemene startadviezen en gecontroleerde basisgegevens. De bediening, storingshulp en onderhoudsstappen worden per model aangevuld.</p></aside>`, data));
  for (const printer of data.printers) {
    const software = data.slicers.find(s => s.id === printer.slicerId);
    const sections = compose(data, printer);
    const config = `<section class="configuration"><h2>Jouw uitvoering</h2><label for="setup">Materiaaltoevoer</label><select id="setup" data-configuration>${printer.configurations.map(c => `<option value="${c.id}"${c.id === printer.defaultConfiguration ? ' selected' : ''}>${escape(c.label)}</option>`).join('')}</select><noscript><p>Hieronder staan beide uitvoeringen. Gebruik de uitleg die bij jouw printer past.</p></noscript>${printer.configurations.map(c => `<div data-configuration-panel="${c.id}"><h3>${escape(c.label)}</h3><p>${escape(c.note)}</p></div>`).join('')}</section>`;
    const content = sections.map(s => `<section id="${s.id}"><h2>${escape(s.title)}</h2>${s.kind === 'steps' ? `<ol>${s.items.map(t => `<li>${escape(t)}</li>`).join('')}</ol>` : s.items.map(t => `<p>${escape(t)}</p>`).join('')}</section>`).join('');
    const body = `<a class="back-link" href="./printers.html">← Kies een andere printer</a><h1>${escape(printer.name)}</h1><p class="status">Basisgids · bediening en storingshulp worden nog uitgebreid</p><dl class="specs"><div><dt>Nominaal bouwvolume</dt><dd>${printer.buildVolumeMm.join(' × ')} mm</dd></div><div><dt>Software</dt><dd>${escape(software.name)}</dd></div></dl><p>${escape(printer.volumeNote)}</p><nav class="catalog-nav" aria-label="Onderwerpen">${sections.map(s => `<a href="#${s.id}">${escape(s.title)}</a>`).join('')}<a href="#software">Software</a><a href="#bronnen">Meer informatie</a></nav>${config}${content}<section id="software"><h2>Aan de slag met ${escape(software.name)}</h2><p>${escape(software.profileHint)}</p><p>Controleer vóór het versturen ook de materiaalkeuze en eventuele toewijzing aan een materiaalwisselaar. De stap-voor-stapuitleg met schermafbeeldingen volgt.</p><a href="${escape(software.docs)}">Documentatie van de fabrikant</a></section><section id="nog-aanvullen"><h2>Wat volgt er nog?</h2><ul>${printer.pending.map(t => `<li>${escape(t)}</li>`).join('')}</ul><p>Voor deze printer is nog geen afzonderlijke PDF beschikbaar. De Hi Combo-PDF hoort uitsluitend bij de Hi Combo.</p></section><section id="bronnen"><h2>Meer informatie en ondersteuning</h2><p>Gebruik voor bediening en onderhoud de instructies voor het exacte model. Neem bij een aanhoudende storing contact op met de beheerder of leverancier.</p><ul>${printer.sourceIds.map(id => `<li><a href="${escape(data.sources[id].url)}">${escape(data.sources[id].title)}</a></li>`).join('')}</ul></section>`;
    outputs.set(`printer-${printer.id}.html`, shell(printer.name, body, data));
  }
  return outputs;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputs = render(JSON.parse(readFileSync(resolve(root, 'content/catalog.json'), 'utf8')));
  for (const [path, content] of outputs) {
    if (process.argv.includes('--check')) requireValue(readFileSync(resolve(root, path), 'utf8') === content, 'Generated file is stale: ' + path);
    else writeFileSync(resolve(root, path), content);
  }
  console.log(`${outputs.size} guide pages ${process.argv.includes('--check') ? 'checked' : 'generated'}.`);
}
