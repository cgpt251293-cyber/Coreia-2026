const APP_VERSION='v23';
let nowAutoTimer=null;

// --- v22 · alterações partilhadas ---
const SHARED_FILE='shared-overrides.json';
const SHARED_LOCAL_KEY='coreia_shared_overrides_v1';
const SHARED_PENDING_KEY='coreia_shared_pending_v1';
const EDITOR_TOKEN_KEY='coreia_editor_token_v1';
const SYNC_CONFIG_KEY='coreia_sync_config_v1';
const DEFAULT_SYNC_CONFIG={owner:'cgpt251293-cyber',repo:'Coreia-2026',branch:'main'};
let sharedState=loadSharedLocal();
let sharedPending=localStorage.getItem(SHARED_PENDING_KEY)==='1';
let editorToken=localStorage.getItem(EDITOR_TOKEN_KEY)||'';
let syncConfig=loadSyncConfig();
let syncTimer=null;
let syncBusy=false;
let syncMessage=navigator.onLine?'A sincronizar…':'Offline';
let eventRegistry={};

function emptyShared(){return{version:1,updatedAt:null,overrides:{}}}
function normalizeShared(x){
 if(!x||typeof x!=='object') return emptyShared();
 return{version:1,updatedAt:x.updatedAt||null,overrides:(x.overrides&&typeof x.overrides==='object')?x.overrides:{}};
}
function loadSharedLocal(){
 try{return normalizeShared(JSON.parse(localStorage.getItem(SHARED_LOCAL_KEY)||'null'))}catch(e){return emptyShared()}
}
function saveSharedLocal(){localStorage.setItem(SHARED_LOCAL_KEY,JSON.stringify(sharedState))}
function detectGitHubConfig(){
 const host=location.hostname.toLowerCase();
 if(!host.endsWith('.github.io')) return{...DEFAULT_SYNC_CONFIG};
 const owner=host.slice(0,-'.github.io'.length);
 const parts=location.pathname.split('/').filter(Boolean);
 let repo=(parts[0]&&parts[0]!=='index.html')?parts[0]:owner+'.github.io';
 return{owner,repo,branch:'main'};
}
function loadSyncConfig(){
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)||'null')}catch(e){}
 const auto=detectGitHubConfig();
 return{owner:saved?.owner||auto.owner||'',repo:saved?.repo||auto.repo||'',branch:saved?.branch||auto.branch||'main'};
}
function saveSyncConfig(cfg){syncConfig={owner:(cfg.owner||'').trim(),repo:(cfg.repo||'').trim(),branch:(cfg.branch||'main').trim()||'main'};localStorage.setItem(SYNC_CONFIG_KEY,JSON.stringify(syncConfig))}
function isEditor(){return !!editorToken}
function syncConfigReady(){return !!(syncConfig.owner&&syncConfig.repo&&syncConfig.branch)}
function eventOverrideKey(date,e){return date+'::'+e.title}
function getEventOverride(date,e){
 const o=sharedState.overrides[eventOverrideKey(date,e)];
 return o&&!o.deleted?o:null;
}
function applyEventOverride(date,e){
 const o=getEventOverride(date,e);
 if(!o) return e;
 return{...e,summary:Object.prototype.hasOwnProperty.call(o,'summary')?o.summary:e.summary,details:Object.prototype.hasOwnProperty.call(o,'details')?o.details:e.details,_sharedEdited:true,_editedAt:o.editedAt||null};
}
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function markPending(){sharedPending=true;localStorage.setItem(SHARED_PENDING_KEY,'1');syncMessage=navigator.onLine?'Alterações por sincronizar':'Offline · alterações guardadas';updateSyncPill()}
function clearPending(){sharedPending=false;localStorage.removeItem(SHARED_PENDING_KEY)}
function latestIso(a,b){if(!a)return b||null;if(!b)return a;return a>b?a:b}
function mergeShared(a,b){
 a=normalizeShared(a);b=normalizeShared(b);
 const out=emptyShared();out.updatedAt=latestIso(a.updatedAt,b.updatedAt);out.overrides={...a.overrides};
 for(const [k,v] of Object.entries(b.overrides||{})){
   const cur=out.overrides[k];
   if(!cur||String(v.editedAt||'')>=String(cur.editedAt||'')) out.overrides[k]=v;
 }
 return out;
}
function remoteReadUrls(){
 const cfg=syncConfigReady()?syncConfig:DEFAULT_SYNC_CONFIG;
 return[`https://raw.githubusercontent.com/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/${encodeURIComponent(cfg.branch)}/${SHARED_FILE}?t=${Date.now()}`,'./'+SHARED_FILE+'?t='+Date.now()];
}

function updateSyncPill(){
 const p=document.getElementById('syncPill');if(!p)return;
 if(!navigator.onLine){p.textContent=sharedPending?'📴 alterações pendentes':'📴 offline';p.className='sync-pill offline';return}
 if(sharedPending){p.textContent='⏳ por sincronizar';p.className='sync-pill pending';return}
 p.textContent='☁️ '+(syncMessage||'sincronizado');p.className='sync-pill synced';
}
async function pullShared(){
 if(sharedPending&&isEditor()) return false;
 try{
   let remote=null,lastErr=null;
   for(const url of remoteReadUrls()){
     try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('shared '+r.status);remote=normalizeShared(await r.json());break}catch(err){lastErr=err}
   }
   if(!remote)throw lastErr||new Error('shared');
   sharedState=mergeShared(sharedState,remote);saveSharedLocal();
   syncMessage='sincronizado';updateSyncPill();
   if(view==='now'||view==='days') render();
   return true;
 }catch(err){syncMessage=navigator.onLine?'sem ligação ao ficheiro partilhado':'offline';updateSyncPill();return false}
}
function utf8ToBase64(s){const bytes=new TextEncoder().encode(s);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin)}
async function githubGetShared(){
 const url=`https://api.github.com/repos/${encodeURIComponent(syncConfig.owner)}/${encodeURIComponent(syncConfig.repo)}/contents/${SHARED_FILE}?ref=${encodeURIComponent(syncConfig.branch)}`;
 const r=await fetch(url,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+editorToken,'X-GitHub-Api-Version':'2026-03-10'},cache:'no-store'});
 if(r.status===404)return{sha:null,state:emptyShared()};
 if(!r.ok)throw new Error('GitHub '+r.status);
 const j=await r.json();
 let txt='';try{txt=new TextDecoder().decode(Uint8Array.from(atob((j.content||'').replace(/\n/g,'')),c=>c.charCodeAt(0)))}catch(e){}
 let state=emptyShared();try{state=normalizeShared(JSON.parse(txt))}catch(e){}
 return{sha:j.sha,state};
}
async function githubPutShared(state,sha){
 const url=`https://api.github.com/repos/${encodeURIComponent(syncConfig.owner)}/${encodeURIComponent(syncConfig.repo)}/contents/${SHARED_FILE}`;
 const body={message:'Atualizar alterações partilhadas · Coreia 2026',content:utf8ToBase64(JSON.stringify(state,null,2)),branch:syncConfig.branch};if(sha)body.sha=sha;
 return fetch(url,{method:'PUT',headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+editorToken,'X-GitHub-Api-Version':'2026-03-10','Content-Type':'application/json'},body:JSON.stringify(body)});
}
async function pushSharedChanges(){
 if(syncBusy||!sharedPending||!isEditor()||!syncConfigReady()||!navigator.onLine)return false;
 syncBusy=true;syncMessage='a sincronizar…';updateSyncPill();
 try{
   for(let attempt=0;attempt<2;attempt++){
     const remote=await githubGetShared();
     sharedState=mergeShared(remote.state,sharedState);sharedState.updatedAt=new Date().toISOString();saveSharedLocal();
     const r=await githubPutShared(sharedState,remote.sha);
     if(r.ok){clearPending();syncMessage='sincronizado';updateSyncPill();syncBusy=false;return true}
     if(r.status!==409)throw new Error('GitHub '+r.status);
   }
   throw new Error('conflito');
 }catch(err){syncMessage='erro de sincronização';updateSyncPill();syncBusy=false;return false}
}
async function syncNow(){
 if(sharedPending&&isEditor()) await pushSharedChanges();
 await pullShared();
}
async function testEditorAccess(cfg,token){
 const url=`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
 const r=await fetch(url,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10'},cache:'no-store'});
 if(!r.ok)throw new Error('GitHub '+r.status);return true;
}
function closeModal(){document.getElementById('editModal')?.remove()}
function showToast(msg,kind='ok'){
 let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.className='toast '+kind;t.textContent=msg;clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.remove(),2800)
}
function openEventEditor(key){
 if(!isEditor())return;
 const reg=eventRegistry[key];if(!reg)return;
 const base=reg.event,o=getEventOverride(reg.date,base);
 const modal=document.createElement('div');modal.id='editModal';modal.className='modal-backdrop';
 modal.innerHTML=`<div class="edit-modal"><div class="edit-modal-head"><div><div class="ey dark">MODO EDIÇÃO</div><h3>${esc(base.title)}</h3></div><button class="modal-close" type="button">×</button></div>
 <label>Descrição / resumo<textarea id="editSummary" rows="4">${esc(o&&Object.prototype.hasOwnProperty.call(o,'summary')?o.summary:(base.summary||''))}</textarea></label>
 <label>Detalhes<textarea id="editDetails" rows="9">${esc(o&&Object.prototype.hasOwnProperty.call(o,'details')?o.details:(base.details||''))}</textarea></label>
 <div class="edit-note">A alteração fica guardada neste telemóvel imediatamente e é enviada ao ficheiro partilhado quando houver Internet.</div>
 <div class="edit-actions"><button class="restore-btn" id="restoreOriginal" type="button">Restaurar original</button><button class="save-edit-btn" id="saveEventEdit" type="button">Guardar alteração</button></div></div>`;
 document.body.appendChild(modal);
 modal.querySelector('.modal-close').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};
 modal.querySelector('#saveEventEdit').onclick=async()=>{
   const summary=modal.querySelector('#editSummary').value,details=modal.querySelector('#editDetails').value,ts=new Date().toISOString();
   sharedState.overrides[key]={summary,details,editedAt:ts,deleted:false};sharedState.updatedAt=ts;saveSharedLocal();markPending();closeModal();render();showToast('Alteração guardada.');await pushSharedChanges();
 };
 modal.querySelector('#restoreOriginal').onclick=async()=>{
   const ts=new Date().toISOString();sharedState.overrides[key]={deleted:true,editedAt:ts};sharedState.updatedAt=ts;saveSharedLocal();markPending();closeModal();render();showToast('Texto original restaurado.');await pushSharedChanges();
 };
}
function openEditorSetup(){
 const auto=detectGitHubConfig();const cfg={owner:syncConfig.owner||auto.owner,repo:syncConfig.repo||auto.repo,branch:syncConfig.branch||'main'};
 const modal=document.createElement('div');modal.id='editModal';modal.className='modal-backdrop';
 modal.innerHTML=`<div class="edit-modal"><div class="edit-modal-head"><div><div class="ey dark">CONFIGURAÇÃO</div><h3>Modo edição</h3></div><button class="modal-close" type="button">×</button></div>
 <p class="setup-copy">Só este telemóvel guardará o token. Os restantes telemóveis apenas leem as alterações.</p>
 <label>Utilizador/organização GitHub<input id="ghOwner" value="${esc(cfg.owner)}" autocomplete="off"></label>
 <label>Repositório<input id="ghRepo" value="${esc(cfg.repo)}" autocomplete="off"></label>
 <label>Branch<input id="ghBranch" value="${esc(cfg.branch)}" autocomplete="off"></label>
 <label>Fine-grained personal access token<input id="ghToken" type="password" value="${esc(editorToken)}" autocomplete="new-password" placeholder="github_pat_…"></label>
 <div class="edit-note">No GitHub, cria um <b>fine-grained personal access token</b>, limita-o apenas a este repositório e dá <b>Contents: Read and write</b>. Idealmente define expiração para depois da viagem. O token nunca é gravado no ficheiro partilhado nem enviado aos outros telemóveis.<br><a class="setup-link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Criar token no GitHub ↗</a></div>
 <div id="setupStatus" class="setup-status"></div>
 <div class="edit-actions"><button class="restore-btn" id="removeEditor" type="button">Desativar edição</button><button class="save-edit-btn" id="saveEditor" type="button">Testar e ativar</button></div></div>`;
 document.body.appendChild(modal);modal.querySelector('.modal-close').onclick=closeModal;
 modal.querySelector('#removeEditor').onclick=()=>{editorToken='';localStorage.removeItem(EDITOR_TOKEN_KEY);closeModal();render();showToast('Modo edição desativado.')};
 modal.querySelector('#saveEditor').onclick=async()=>{
   const st=modal.querySelector('#setupStatus'),btn=modal.querySelector('#saveEditor');const ncfg={owner:modal.querySelector('#ghOwner').value.trim(),repo:modal.querySelector('#ghRepo').value.trim(),branch:modal.querySelector('#ghBranch').value.trim()||'main'},token=modal.querySelector('#ghToken').value.trim();
   if(!ncfg.owner||!ncfg.repo||!token){st.textContent='Preenche repositório e token.';return}
   btn.disabled=true;st.textContent='A testar acesso…';
   try{await testEditorAccess(ncfg,token);saveSyncConfig(ncfg);editorToken=token;localStorage.setItem(EDITOR_TOKEN_KEY,token);st.textContent='Acesso confirmado.';setTimeout(()=>{closeModal();render();syncNow();showToast('Modo edição ativo neste telemóvel.')},500)}catch(err){st.textContent='Não consegui validar o acesso. Confirma o repositório e a permissão Contents: Read and write.';btn.disabled=false}
 };
}
function startSharedSync(){
 syncNow();if(syncTimer)clearInterval(syncTimer);syncTimer=setInterval(syncNow,45000);
}

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
function eventHTML(base,i,d,now=false){
 const k=d+'-'+i, is=!!done[k], key=eventOverrideKey(d,base), e=applyEventOverride(d,base);
 eventRegistry[key]={date:d,event:base,index:i};
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
 const changed=e._sharedEdited?`<span class="edited-badge">✎ alterado</span>`:'';
 const edit=isEditor()?`<button class="edit-event" data-edit-key="${esc(key)}" type="button">✏️ editar</button>`:'';
 return `<div id="event-${d}-${i}" class="event ${now?'now':''} ${is?'completed':''} ${e._sharedEdited?'shared-edited':''}">
 <button class="done ${is?'on':''}" data-k="${k}" aria-label="Concluído"></button>
 <div class="time">${e.time}</div>
 <div><div class="title">${e.title}</div><div class="event-tools">${changed}${edit}</div>${e.summary?`<div class="summary">${esc(e.summary)}</div>`:''}
 ${e.details?`<button class="toggle" data-toggle>ver detalhes</button><div class="details hidden">${esc(e.details)}</div>`:''}
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
 $$('.edit-event').forEach(b=>b.onclick=()=>openEventEditor(b.dataset.editKey));
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
 <div class="card sync-card"><h3>☁️ Alterações partilhadas</h3><p>${isEditor()?'Este telemóvel é o <b>editor</b>. As alterações a descrições/detalhes são publicadas para os restantes telemóveis.':'Modo de leitura. As alterações feitas pela editora são recebidas automaticamente quando houver Internet.'}</p><div class="sync-actions"><button class="update-btn" id="syncNowBtn">↻ Sincronizar agora</button><button class="editor-btn" id="editorSetupBtn">${isEditor()?'⚙️ Configurar edição':'🔐 Ativar modo edição'}</button></div><div class="sync-small">Estado: ${esc(syncMessage)}${sharedPending?' · alterações pendentes':''}</div></div>
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
 $('#checkUpdate').onclick=checkForUpdate;$('#delayToggleInfo').onclick=toggleFlightDelay;$('#syncNowBtn').onclick=async()=>{syncMessage='a sincronizar…';updateSyncPill();await syncNow();render()};$('#editorSetupBtn').onclick=openEditorSetup;updateSyncPill();
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
let activitySearchTerm='';
function normalizedSearch(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function searchView(){
 const q=normalizedSearch(activitySearchTerm.trim());
 let matches=[];
 if(q){
  for(const base of APP_DATA.days){
   const day=activeDay(base);
   (day.events||[]).forEach((original,i)=>{
    const e=applyEventOverride(day.date,original);
    const searchable=[e.title,e.time,e.summary,e.details,e.map,day.heading,day.subtitle,day.label].join(' ');
    if(normalizedSearch(searchable).includes(q)) matches.push({day,event:e,index:i});
   });
  }
 }
 const content=document.getElementById('content');
 content.innerHTML=`<div class="section"><h2>🔎 Pesquisar atividades</h2><p>Procura por nome, local ou descrição em todos os dias do roteiro.</p></div>
 <input class="search activity-search-input" id="activitySearch" type="search" placeholder="Ex.: Daiso, BTS, lanternas, skincare…" autocomplete="off" value="${esc(activitySearchTerm)}" aria-label="Pesquisar atividades">
 <div id="activitySearchResults" aria-live="polite"></div>`;
 const field=document.getElementById('activitySearch');
 field.oninput=()=>{activitySearchTerm=field.value;drawActivityResults()};
 drawActivityResults();
}
function drawActivityResults(){
 const q=normalizedSearch(activitySearchTerm.trim());
 const results=document.getElementById('activitySearchResults');if(!results)return;
 if(!q){results.innerHTML='<div class="search-hint">Escreve para encontrar atividades em qualquer dia.</div>';return}
 let matches=[];
 for(const base of APP_DATA.days){
  const day=activeDay(base);
  day.events.forEach((original,i)=>{
   const e=applyEventOverride(day.date,original);
   if(normalizedSearch([e.title,e.time,e.summary,e.details,e.map,day.heading,day.subtitle,day.label].join(' ')).includes(q))matches.push({day,event:e,index:i});
  });
 }
 results.innerHTML=`<div class="search-count">${matches.length} resultado(s)</div>`+matches.slice(0,100).map(({day,event,index})=>`<button type="button" class="search-result" data-result-date="${day.date}" data-result-index="${index}"><span class="search-result-date">${esc(day.label)} · ${esc(event.time)}</span><strong>${esc(event.title)}</strong><span>${esc(event.summary||day.subtitle||'')}</span></button>`).join('')+(matches.length>100?'<p>Mostrados os primeiros 100 resultados. Refina a pesquisa.</p>':'');
 results.querySelectorAll('[data-result-date]').forEach(b=>b.onclick=()=>{
  selected=b.dataset.resultDate;view='days';setNav();renderTabs();render();
  const el=document.getElementById('event-'+selected+'-'+b.dataset.resultIndex);
  if(el){el.classList.add('search-target');el.scrollIntoView({behavior:'smooth',block:'center'});}
 });
}
function setNav(){$$('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.view===view))}
function render(){view==='now'?nowView():view==='days'?daysView():view==='res'?resView():view==='alerts'?alertsView():view==='search'?searchView():infoView()}
$$('.nav button').forEach(b=>b.onclick=()=>{view=b.dataset.view;setNav();render()});
renderTabs();render();updateSyncPill();startSharedSync();
addEventListener('online',()=>{syncMessage='a sincronizar…';updateSyncPill();syncNow()});
addEventListener('offline',()=>updateSyncPill());
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
