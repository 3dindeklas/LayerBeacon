import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import {root,loadContent} from '../scripts/build-guides.mjs';
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith('/LayerBeacon/')){res.writeHead(404).end();return;}
  const path=resolve(root,decodeURIComponent(url.pathname.slice('/LayerBeacon/'.length))||'index.html');
  if(!path.startsWith(root.endsWith(sep)?root:root+sep)||!(await stat(path)).isFile()){res.writeHead(404).end();return;}
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.ttf':'font/ttf','.ico':'image/x-icon','.pdf':'application/pdf'};
  res.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');res.end(await readFile(path));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/LayerBeacon/`;
let browser;let checks=0;const failures=[];const screenshots=process.env.QA_SCREENSHOTS;const data=loadContent();
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--disable-dev-shm-usage']});
 if(screenshots)await mkdir(screenshots,{recursive:true});
 for(const viewport of [{width:1440,height:1100},{width:390,height:844},{width:320,height:800}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();
  page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
  for(const printer of data.printers){
   await page.goto(base+printer.route);await page.locator('html.js').waitFor();
   assert.equal(await page.locator('.guide-section').count(),8);
   assert.equal(await page.locator('[data-configuration]').inputValue(),printer.defaultSetup);
   assert.equal(await page.locator('main').getAttribute('data-printer-id'),printer.id);
   await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>{if(!n.hidden)n.open=true;}));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${printer.id} overflow at ${viewport.width}`);
   const bg=await page.locator('.steps details').first().evaluate(n=>({actual:getComputedStyle(n).backgroundColor,width:n.getBoundingClientRect().width,body:n.querySelector('.detail-body').getBoundingClientRect().width}));
   assert.notEqual(bg.actual,'rgba(0, 0, 0, 0)');assert.ok(bg.width-bg.body<2,'step body uses full card width');
   await page.selectOption('[data-configuration]','single');assert.equal(await page.locator('[data-setups="multicolor"]:visible').count(),0);
   await page.selectOption('[data-configuration]','multicolor');assert.ok(await page.locator('[data-setups="multicolor"]:visible').count()>0);assert.equal(new URL(page.url()).searchParams.get('setup'),'multicolor');
   if(viewport.width<800){
    await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    await page.locator('.menu-toggle').click();await page.locator('nav a[href="#storingen"]').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
   }
   if(screenshots){await page.locator('details').evaluateAll(nodes=>nodes.forEach((n,i)=>n.open=i===0));await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:resolve(screenshots,`${printer.id}-${viewport.width}.png`)});}
   checks++;
  }
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>failures.push(e.message));
 for(const [route,hash] of [['index.html','fout-cfs'],['printer-bambu-p1s.html','fout-ams-aanvoer'],['printer-creality-k2.html','fout-fb2844']]){
  await page.goto(`${base}${route}?setup=single#${hash}`);assert.equal(await page.locator('[data-configuration]').inputValue(),'multicolor');
  assert.ok(await page.locator('#'+hash).isVisible());assert.equal(await page.locator('#'+hash).getAttribute('open'),'');
  await page.selectOption('[data-configuration]','single');assert.equal(new URL(page.url()).hash,'#storingen');checks++;
 }
 await page.goto(base+'index.html?setup=invalid');assert.equal(await page.locator('[data-configuration]').inputValue(),'multicolor');
 await page.goto(base+'printer-prusa-mk4s.html?setup=invalid');assert.equal(await page.locator('[data-configuration]').inputValue(),'single');
 await page.goto(base+'index.html#fout-tc2854');await page.selectOption('[data-printer-selection]','printer-prusa-mk4s.html');await page.waitForURL('**/printer-prusa-mk4s.html#storingen');assert.equal(await page.locator('#fout-tc2854').count(),0);checks++;
 await page.goto(base+'index.html#creality-print');assert.ok(await page.locator('#creality-print').count());
 await page.goto(base+'printer-prusa-mk4s.html#fout-eerste-laag');assert.ok((await page.locator('#fout-eerste-laag').innerText()).includes('loadcell'));checks++;
 await page.goto(base+'printer-bambu-p1s.html?setup=single');const initial=await page.locator('details[open]').count();
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('#fout-ams-aanvoer').isVisible(),false);assert.ok(await page.locator('#fout-eerste-laag .detail-body').isVisible());
 if(screenshots)await page.screenshot({path:resolve(screenshots,'print-preview.png')});
 await page.evaluate(()=>dispatchEvent(new Event('afterprint')));await page.emulateMedia({media:'screen'});assert.equal(await page.locator('details[open]').count(),initial);checks++;
 await page.close();
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const native=await noJS.newPage();
 for(const printer of data.printers){await native.goto(base+printer.route);assert.equal(await native.locator('.guide-section').count(),8);assert.ok(await native.locator('nav').isVisible());const last=native.locator('.steps details').last();await last.locator('summary').click();assert.ok(await last.locator('.detail-body').isVisible());assert.ok((await native.locator('noscript').innerText()).includes('Kies hier je printer'));checks++;}
 await noJS.close();assert.deepEqual(failures,[]);console.log(`${checks} browser scenarios passed (desktop, 390px, 320px, subpath, setup/deep links, printer switch, print and JavaScript off).`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
