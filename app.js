const APP_VERSION='v17';
let nowAutoTimer=null;

const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
let view='now', selected=APP_DATA.days[0].date;
const done=JSON.parse(localStorage.getItem('coreia_done_v2')||'{}');
let flightDelayMode=localStorage.getItem('coreia_flight_delay')==='1';
function navUrl(q){return 'https://map.naver.com/p/search/'+encodeURIComponent(q)}
function googleUrl(q){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q)}
function krideIntentUrl(){return 'https://service.kride.kakaomobility.com/3xb7d9'}
function nowInZone(zone){
 let p=new Intl.DateTimeFormat('en-CA',{timeZone:zone||'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()),o={};
 p.forEach(x=>o[x.type]=x.value);
 return{date:`${o.year}-${o.month}-${o.day}`,mins:+o.hour*60+ +o.minute,zone:zone||'Asia/Seoul'}
}
function mins(s){let m=(s||'').match(/(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:null}

function activeDay(base){
 if(!flightDelayMode || !APP_DATA.flightDelayScenario) return base;
 const o=APP_DATA.flightDelayScenario.overrides[base.date];
 if(!o) return base;
 const copy={...base};
 if(o.heading) copy.heading=o.heading;
 if(o.subtitle) copy.subtitle=o.subtitle;
 if(o.events) copy.events=o.events;
 else if(o.prependEvents) copy.events=[...o.prependEvents,...base.events];
 if(o.daySections){
   copy.daySections=[...(o.daySections||[]),...(base.daySections||[])];
 }
 return copy;
}
function delayBanner(){
 return flightDelayMode?`<div class="delay-banner">⚠️ Modo atraso de voo ativo · chegada prevista 28/11</div>`:'';
}
function toggleFlightDelay(){
 flightDelayMode=!flightDelayMode;
 localStorage.setItem('coreia_flight_delay',flightDelayMode?'1':'0');
 render();
 renderTabs();
}

function renderTabs(){ $('#tabs').innerHTML=APP_DATA.days.map(d=>`<button class="tab ${d.date===selected?'on':''}" data-date="${d.date}">${d.label}</button>`).join(''); $$('.tab').forEach(b=>b.onclick=()=>{selected=b.dataset.date;view='days';setNav();render();renderTabs()})}
function eventHTML(e,i,d,now=false){
 const k=d+'-'+i, is=!!done[k];
 let maps='';
 if(e.map){
   if(e.mapProvider==='google'){
     maps+=`<div class="map-actions"><a class="map secondary" href="${googleUrl(e.map)}" target="_blank" rel="noopener">Google Maps → destino ↗</a></div>`;
   }else{
     maps+=`<div class="map-actions"><a class="map" href="${navUrl(e.map)}" target="_blank" rel="noopener">Naver → destino ↗</a><a class="map secondary" href="${googleUrl(e.map)}" target="_blank" rel="noopener">Google → destino ↗</a></div>`;
   }
 }
 if(e.altMap){
   maps+=`<div class="map-actions"><span class="map-label">${e.altMapLabel||'Alternativa'}:</span><a class="map" href="${navUrl(e.altMap)}" target="_blank" rel="noopener">Naver ↗</a><a class="map secondary" href="${googleUrl(e.altMap)}" target="_blank" rel="noopener">Google ↗</a></div>`;
 }
 let taxi='';
 if(e.taxi){
   const mode=e.taxi.mode==='recommended'?'Táxi recomendado':'Táxi opcional';
   taxi=`<div class="taxi-box ${e.taxi.mode==='recommended'?'recommended':'optional'}">
     <div class="taxi-head">🚕 ${mode}</div>
     ${e.taxi.note?`<div class="taxi-note">${e.taxi.note}</div>`:''}
     <div class="taxi-dest">Destino: <b>${e.taxi.destination}</b></div>
     <div class="taxi-actions">
       <a class="kride-btn" href="${krideIntentUrl()}" target="_blank" rel="noopener">🚕 Abrir k.ride ↗</a>
       <button class="copy-dest" data-copy="${e.taxi.destination.replaceAll('"','&quot;')}">📋 Copiar destino</button>
     </div>
   </div>`;
 }
 return `<div class="event ${now?'now':''} ${is?'completed':''}">
 <button class="done ${is?'on':''}" data-k="${k}" aria-label="Concluído"></button>
 <div class="time">${e.time}</div>
 <div><div class="title">${e.title}</div>${e.summary?`<div class="summary">${e.summary}</div>`:''}
 ${e.details?`<button class="toggle" data-toggle>ver detalhes</button><div class="details hidden">${e.details.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</div>`:''}
 ${maps}${taxi}</div></div>`
}
function bind(){
 $$('[data-k]').forEach(b=>b.onclick=()=>{
   done[b.dataset.k]=!done[b.dataset.k];
   localStorage.setItem('coreia_done_v2',JSON.stringify(done));
   render();
 });
 $$('[data-toggle]').forEach(b=>b.onclick=()=>{
   let x=b.nextElementSibling;
   x.classList.toggle('hidden');
   b.textContent=x.classList.contains('hidden')?'ver detalhes':'fechar detalhes'
 });
 $$('.copy-dest').forEach(b=>b.onclick=async()=>{
   const val=b.dataset.copy;
   try{
     await navigator.clipboard.writeText(val);
     const old=b.textContent;
     b.textContent='✓ Destino copiado';
     setTimeout(()=>b.textContent=old,1600);
   }catch(err){
     prompt('Copiar destino para a k.ride:',val);
   }
 });
}
function recentFor(date){return ''}
function current(){
 let matchedIndex=-1, now=null;
 for(let i=0;i<APP_DATA.days.length;i++){
   const ad=activeDay(APP_DATA.days[i]);
   const n=nowInZone(ad.timeZone||'Asia/Seoul');
   if(n.date===ad.date){matchedIndex=i;now=n;break}
 }
 let di=matchedIndex;
 if(di<0){
   const koreaNow=nowInZone('Asia/Seoul');
   di=APP_DATA.days.findIndex(d=>d.date>koreaNow.date);
   if(di<0)di=APP_DATA.days.length-1;
   let fd=activeDay(APP_DATA.days[di]), fi=fd.events.findIndex((e,i)=>!done[fd.date+'-'+i]);
   return{day:fd,idx:fi<0?0:fi,future:true}
 }
 let d=activeDay(APP_DATA.days[di]), chrono=0;
 for(let i=0;i<d.events.length;i++){
   let a=mins(d.events[i].time),b=i<d.events.length-1?mins(d.events[i+1].time):null;
   if(a!==null&&now.mins>=a&&(b===null||now.mins<b)){chrono=i;break}
   if(a!==null&&now.mins<a){chrono=i;break}
   chrono=i
 }
 let idx=chrono;
 while(idx<d.events.length && done[d.date+'-'+idx]) idx++;
 if(idx>=d.events.length){
   idx=d.events.findIndex((e,i)=>!done[d.date+'-'+i]);
   if(idx<0) idx=d.events.length-1;
 }
 return{day:d,idx,future:false}
}
function nowView(){
 let c=current(),d=c.day;
 selected=d.date;
 renderTabs();
 let e=d.events[c.idx]||{title:d.heading,time:'',summary:''};
 let h=delayBanner()+`<div class="nowhero"><div class="ey">${c.future?'PRÓXIMO DIA':(d.timeZone==='Europe/Copenhagen'?'AGORA · HORA DE COPENHAGA':'AGORA · HORA DA COREIA')}</div><h2>${e.title}</h2><p>${d.label} · ${d.subtitle||d.heading}<br>${e.time||''}</p></div>`;
 if(d.events.length){
   h+=`<div class="section"><h2>${c.future?'Próximo':'AGORA'}</h2></div>${eventHTML(e,c.idx,d.date,true)}`;
   if(d.events[c.idx+1]) h+=`<div class="section"><h2>A SEGUIR</h2></div>${eventHTML(d.events[c.idx+1],c.idx+1,d.date)}`;
   h+=`<div class="section"><h2>Resto do dia</h2></div>`+
      d.events.slice(c.idx+2).map((x,j)=>eventHTML(x,c.idx+2+j,d.date)).join('');
 }
 if((d.daySections||[]).length){
   h+=`<div class="section"><h2>Notas do dia</h2></div>`+
   d.daySections.map(s=>`<div class="alert"><b>${s.title}</b><br>${s.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n','<br>')}</div>`).join('');
 }
 $('#content').innerHTML=h;
 bind();
}
function daysView(){
 let d=activeDay(APP_DATA.days.find(x=>x.date===selected));
 let h=delayBanner()+`<div class="dayhead"><div class="date">${d.label}</div><div class="city">${d.subtitle||d.heading}</div></div>`+
 d.events.map((e,i)=>eventHTML(e,i,d.date)).join('');
 if((d.daySections||[]).length){
   h+=`<div class="section"><h2>Notas do dia</h2></div>`+
   d.daySections.map(s=>`<div class="alert"><b>${s.title}</b><br>${s.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n','<br>')}</div>`).join('');
 }
 h+=`<div class="section"><h2>Texto completo deste dia</h2><span>fonte PDF</span></div>
 <button class="toggle" id="rawtoggle">abrir texto integral</button>
 <div class="raw hidden" id="raw">${d.raw.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</div>`;
 $('#content').innerHTML=h;
 bind();
 $('#rawtoggle').onclick=()=>{
   $('#raw').classList.toggle('hidden');
   $('#rawtoggle').textContent=$('#raw').classList.contains('hidden')?'abrir texto integral':'fechar texto integral'
 };
}
function resView(){
 let h=`<div class="section"><h2>Reservas & bilhetes</h2></div>
 <div class="ticket-actions top-actions">
   <a class="folder-btn" target="_blank" rel="noopener" href="${APP_DATA.ticketsFolder}">📁 Abrir pasta de bilhetes no Google Drive ↗</a>
   <a class="folder-btn" href="./lembretes_coreia_2026.ics">🔔 Importar lembretes</a>
 </div>
 <input class="search" id="rs" placeholder="Pesquisar…"><div class="grid" id="rlist">`+
 APP_DATA.reservations.map(r=>{
   let links=(r.links||[]).map(l=>`<a class="ticket-btn" target="_blank" rel="noopener" href="${l.url}">${l.label} ↗</a>`).join('');
   let print=/ktx/i.test(r.name)?`<div class="print-note">🖨️ Levar os 4 bilhetes KTX impressos. A cópia digital fica como backup.</div>`:'';
   return `<div class="card ri">
     <div class="summary">${r.when}</div>
     <h3>${r.name}</h3>
     <span class="badge ${r.status==='RESERVADO'?'reserved':r.status==='POR TRATAR'?'todo':'confirm'}">${r.status}</span>
     <p>${r.note}</p>
     ${print}
     ${links?`<div class="ticket-actions">${links}</div>`:''}
   </div>`;
 }).join('')+`</div>`;
 $('#content').innerHTML=h;
 $('#rs').oninput=e=>$$('.ri').forEach(x=>x.classList.toggle('hidden',!x.innerText.toLowerCase().includes(e.target.value.toLowerCase())));
}
function alertsView(){let h=`<div class="card delay-control"><h3>✈️ Atraso / perda do voo</h3><p>${APP_DATA.flightDelayScenario.description}</p><button class="delay-toggle ${flightDelayMode?'on':''}" id="delayToggle">${flightDelayMode?'Desativar modo atraso':'Ativar chegada em 28/11'}</button></div>`+`<div class="section"><h2>Alertas críticos</h2></div>`+APP_DATA.critical.map(x=>`<div class="alert"><b>${x.title}</b><br>${x.text}</div>`).join('');$('#content').innerHTML=h;$('#delayToggle').onclick=toggleFlightDelay}
function infoView(){
 let h=`<div class="section"><h2>App</h2></div>
 <div class="card delay-control"><h3>✈️ Modo atraso de voo</h3><p>${flightDelayMode?'ATIVO — chegada prevista em 28/11':'Desativado — roteiro normal'}</p><button class="delay-toggle ${flightDelayMode?'on':''}" id="delayToggleInfo">${flightDelayMode?'Desativar':'Ativar chegada em 28/11'}</button></div>
 <div class="card update-card"><h3>Coreia 2026 · ${APP_VERSION}</h3><p id="updateStatus">Versão instalada: <b>${APP_VERSION}</b></p><button class="update-btn" id="checkUpdate">🔄 Verificar atualização</button></div>
 <div class="section"><h2>Alojamentos</h2></div><div class="grid">`+
 APP_DATA.hotels.map(x=>`<div class="card"><div class="summary">${x.city}</div><h3>${x.name}</h3><p>${x.address}</p><div class="map-actions"><a class="map" target="_blank" rel="noopener" href="${navUrl(x.map||x.name+' '+x.address)}">Naver → destino ↗</a><a class="map secondary" target="_blank" rel="noopener" href="${googleUrl(x.map||x.name+' '+x.address)}">Google Maps ↗</a></div></div>`).join('')+
 `</div><div class="section"><h2>Regras rápidas</h2></div><div class="grid">
 <div class="card"><h3>🚇 Transportes</h3><p>T-money na primeira parte da viagem. Climate Card 6–12/12. Hangang Bus pago separadamente. Aeroporto: AREX All-Stop, não Express.</p></div>
 <div class="card"><h3>🧾 Tax refund</h3><p>Mostrar passaporte antes de pagar e perguntar “Immediate tax refund?”. Guardar vouchers quando não for imediato. Produtos com tax refund devem sair da Coreia sem uso.</p></div>
 <div class="card"><h3>🗺️ Navegação</h3><p>Usar Naver Map primeiro. Os botões agora pesquisam nomes coreanos/moradas; Google Maps fica como alternativa se o Naver não resolver um local.</p></div>
 <div class="card"><h3>☎️ Emergência</h3><p><b>112</b> polícia · <b>119</b> ambulância/bombeiros · <b>1330</b> Korea Travel Helpline.</p></div></div>`;
 $('#content').innerHTML=h;
 $('#checkUpdate').onclick=checkForUpdate;$('#delayToggleInfo').onclick=toggleFlightDelay;
}
async function checkForUpdate(){
 const s=$('#updateStatus'), b=$('#checkUpdate');
 try{
   b.disabled=true;s.innerHTML='A verificar…';
   const r=await fetch('./version.json?t='+Date.now(),{cache:'no-store'});
   if(!r.ok) throw new Error('version');
   const v=await r.json();
   if(v.version===APP_VERSION){
     s.innerHTML=`Já tens a versão mais recente: <b>${APP_VERSION}</b>.`;
     b.disabled=false;
     return;
   }
   s.innerHTML=`Nova versão <b>${v.version}</b> encontrada. A atualizar…`;
   if('serviceWorker' in navigator){
     const reg=await navigator.serviceWorker.getRegistration();
     if(reg) await reg.update();
   }
   setTimeout(()=>location.replace(location.pathname+'?updated='+Date.now()),900);
 }catch(err){
   s.textContent=navigator.onLine?'Não consegui verificar agora. Tenta novamente.':'Sem Internet — não é possível verificar atualizações.';
   b.disabled=false;
 }
}
function setNav(){$$('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.view===view))}
function render(){view==='now'?nowView():view==='days'?daysView():view==='res'?resView():view==='alerts'?alertsView():infoView()}
$$('.nav button').forEach(b=>b.onclick=()=>{view=b.dataset.view;setNav();render()});
renderTabs();render();
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#install').style.display='block'});$('#install').onclick=async()=>{if(dp){dp.prompt();await dp.userChoice;dp=null;$('#install').style.display='none'}};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js');


function startNowAutoRefresh(){
  if(nowAutoTimer) clearInterval(nowAutoTimer);
  nowAutoTimer=setInterval(()=>{
    if(view==='now'){
      nowView();
    }
  },30000);
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && view==='now'){
    nowView();
  }
});

startNowAutoRefresh();
