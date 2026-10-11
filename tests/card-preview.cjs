const artifactPath = require('../tools/artifact-path.cjs');
const { chromium } = require('./playwright.cjs');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
 const file=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://localhost').pathname)); if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webm':'video/webm','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(bytes);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'msedge',headless:true}); const results=[];
 async function check(name, options, action){const context=await browser.newContext(options);try{const page=await context.newPage();await action(page);results.push({name,passed:true});console.log('PASS',name);}finally{await context.close();}}
 const ready=async page=>{await page.goto(base+'/index.html');await page.waitForFunction(()=>document.querySelector('.data-loading-status')?.hidden);};
 try {
 await check('real silent loop, continuous offscreen playback and hidden pause', {viewport:{width:1440,height:900}}, async page=>{
 let requests=0;page.on('request',r=>{if(r.url().endsWith('.webm'))requests++;});await ready(page);
 const video=page.locator('.card-preview video').first();assert.equal(requests,0);assert.equal(await video.getAttribute('src'),null);
 await video.scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const v=document.querySelector('.card-preview video');return !v.paused&&v.currentTime>.2;});
 assert.equal(await video.evaluate(v=>v.muted&&v.loop&&v.playsInline),true);const first=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(400);assert.ok(await video.evaluate(v=>v.currentTime)>first);
 await video.evaluate(v=>{v.currentTime=v.duration-.15;});await page.waitForTimeout(500);assert.ok(await video.evaluate(v=>v.currentTime)<2);
 await page.locator('.card-preview').first().screenshot({path:artifactPath('task30-autoplay-card-desktop.png')});
 await video.evaluate(v=>new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=2;}));await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('.card-preview video').currentTime>2.2);assert.equal(await video.evaluate(v=>v.paused),false);
 await video.scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.card-preview video').paused);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await video.evaluate(v=>v.paused),true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>!document.querySelector('.card-preview video').paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.card-preview video').paused);assert.equal(await page.locator('.card-preview').first().evaluate(n=>n.classList.contains('is-playing')),false);
 });
 await check('mobile actual movement under CPU and network throttling', {viewport:{width:390,height:844},isMobile:true,hasTouch:true}, async page=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{window.previewCLS=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.previewCLS+=e.value;}).observe({type:'layout-shift',buffered:true});});
 await ready(page);const video=page.locator('.card-preview video').first();await video.scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const v=document.querySelector('.card-preview video');return !v.paused&&v.currentTime>.3;});const first=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(500);assert.ok(await video.evaluate(v=>v.currentTime)>first);assert.ok(await page.evaluate(()=>window.previewCLS)<=.1);
 await page.locator('.card-preview').first().screenshot({path:artifactPath('task30-autoplay-card-mobile.png')});console.log('Mobile preview CLS',await page.evaluate(()=>window.previewCLS));
 });
 for(const activation of ['mouse','keyboard','touch']) await check('full video '+activation, {viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}, async page=>{
 await ready(page);const media=page.locator('.card-preview').first();await media.scrollIntoViewIfNeeded();assert.equal(await page.locator('.card-preview video').first().getAttribute('src'),null);
 await page.route('https://www.youtube.com/watch*',r=>r.fulfill({body:'Full video destination'}));
 if(activation==='mouse')await media.click();else if(activation==='touch')await media.tap();else {await media.focus();await page.keyboard.press('Enter');}
 await page.waitForURL(/youtube.com\/watch/);assert.ok(page.url().includes('v=Hlrx9G3x1Vg'));
 });
 await check('autoplay rejection retains poster and full video link', {viewport:{width:390,height:844}}, async page=>{
 await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Blocked','NotAllowedError'));};});await ready(page);await page.locator('.card-preview').first().scrollIntoViewIfNeeded();await page.waitForTimeout(500);assert.equal(await page.locator('.card-preview').first().evaluate(n=>n.classList.contains('is-playing')),false);assert.equal(await page.locator('.card-preview img').first().isVisible(),true);assert.match(await page.locator('.card-preview').first().getAttribute('href'),/youtube.com\/watch/);
 });
 await check('failed video retains poster, fixed size and usable controls', {viewport:{width:390,height:844}}, async page=>{
 await page.route('**/*.webm',r=>r.fulfill({status:404,body:''}));await ready(page);const media=page.locator('.card-preview').first();await media.scrollIntoViewIfNeeded();const before=await media.boundingBox();await page.waitForTimeout(600);assert.equal(await media.evaluate(n=>n.classList.contains('is-playing')),false);assert.equal((await media.boundingBox()).height,before.height);assert.equal(await media.locator('img').isVisible(),true);await media.screenshot({path:artifactPath('task30-autoplay-fallback-mobile.png')});
 assert.equal(await page.locator('.featured-card').count(),3);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 });

 await check('visible Azooma and Implant previews start together without rotation delay', {viewport:{width:1440,height:900}},async page=>{
 await ready(page);await page.locator('.featured-grid').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>['azooma-escape','implant-mission-the-lost-tree'].every(id=>{const v=document.querySelector('[data-project-id="'+id+'"] video');return v&&!v.paused&&v.currentTime>.1;}),null,{timeout:2500});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>[...document.querySelectorAll('.card-preview video')].every(v=>v.paused));
 });
 await check('both extracted clips play locally without YouTube requests', {viewport:{width:390,height:844}},async page=>{
 const youtubeRequests=[];page.on('request',r=>{if(/(^|\.)(youtube\.com|googlevideo\.com)$/.test(new URL(r.url()).hostname))youtubeRequests.push(r.url());});await ready(page);
 for(const id of ['implant-mission-the-lost-tree','king-of-stratgy']){
 const media=page.locator('[data-project-id="'+id+'"] .card-preview');await media.scrollIntoViewIfNeeded();
 await page.waitForFunction(id=>{const v=document.querySelector('[data-project-id="'+id+'"] video');return v&&!v.paused&&v.currentTime>.2;},id);
 const v=media.locator('video');assert.equal(await v.evaluate(n=>n.muted&&n.loop&&n.playsInline),true);assert.ok(await v.evaluate(n=>n.duration>7&&n.duration<8.5));const time=await v.evaluate(n=>n.currentTime);await page.waitForTimeout(400);assert.ok(await v.evaluate(n=>n.currentTime)>time);
 assert.equal(await media.locator('iframe').count(),0);assert.equal(await page.locator('.card-preview-player').count(),0);await media.screenshot({path:artifactPath('local-preview-'+id+'.png')});
 await page.evaluate(()=>scrollTo(0,0));assert.equal(await v.evaluate(n=>n.paused),false);
 }
 assert.deepEqual(youtubeRequests,[]);
 await page.getByRole('button',{name:'full game',exact:true}).click();await page.locator('[data-project-id="king-of-stratgy"] .card-preview').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('[data-project-id="king-of-stratgy"] video').paused);
 await page.getByRole('button',{name:'Level Design',exact:true}).click();assert.equal(await page.locator('.showcase-card video').count(),0);
 });
 await check('all offscreen clips warm automatically and continue on throttled mobile', {viewport:{width:390,height:844},isMobile:true,hasTouch:true},async page=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await ready(page);await page.waitForFunction(()=>[...document.querySelectorAll('.card-preview video')].every(v=>v.autoplay&&v.muted&&v.loop&&v.playsInline&&!v.paused&&v.currentTime>.2));
 const video=page.locator('[data-project-id="implant-mission-the-lost-tree"] video');await video.evaluate(v=>new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=2;}));await page.waitForFunction(()=>document.querySelector('[data-project-id="implant-mission-the-lost-tree"] video').currentTime>2.2);await video.scrollIntoViewIfNeeded();assert.ok(await video.evaluate(v=>v.currentTime)>2.2);
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));assert.equal(await video.evaluate(v=>v.paused),true);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow')));await page.waitForFunction(()=>!document.querySelector('[data-project-id="implant-mission-the-lost-tree"] video').paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>[...document.querySelectorAll('.card-preview video')].every(v=>v.paused));await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>[...document.querySelectorAll('.card-preview video')].every(v=>!v.paused));
 });
 for(const id of ['implant-mission-the-lost-tree','king-of-stratgy'])await check('local clip fallback '+id,{viewport:{width:390,height:844}},async page=>{
 await page.route('**/previews/*.webm',r=>r.fulfill({status:404,body:''}));await ready(page);const media=page.locator('[data-project-id="'+id+'"] .card-preview');await media.scrollIntoViewIfNeeded();await page.waitForTimeout(700);assert.equal(await media.evaluate(n=>n.classList.contains('is-playing')),false);assert.equal(await media.locator('img').isVisible(),true);
 });
 for(const [id,activation]of [['implant-mission-the-lost-tree','keyboard'],['king-of-stratgy','touch']])await check('local preview full video '+activation,{viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'},async page=>{
 await ready(page);await page.route('https://www.youtube.com/watch*',r=>r.fulfill({body:'Full video destination'}));const media=page.locator('[data-project-id="'+id+'"] .card-preview');await media.scrollIntoViewIfNeeded();if(activation==='touch')await media.tap();else{await media.focus();await page.keyboard.press('Enter');}await page.waitForURL(/youtube.com\/watch/);assert.ok(page.url().includes('v='+(id.startsWith('implant')?'Ssm2PqiFbOQ':'GfK1WgT8G7Y')));
 });
 fs.writeFileSync(artifactPath('card-preview-results.json'),JSON.stringify(results,null,2)+'\n');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

