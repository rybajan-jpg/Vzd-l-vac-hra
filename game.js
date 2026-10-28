/* Herní logika Vyšší, nebo nižší. Data okruhů jsou v data.js. */
const VERSION = "0.2.0";
const CATS = window.CATS;
const CAT_KEYS = Object.keys(CATS);

/* ======================= ÚLOŽIŠTĚ ======================= */
const store = {
  get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
let best = store.get("vn-best") || {};
let muted = !!store.get("vn-muted");
let S = null;
const app = document.getElementById("app");

/* ======================= ANALYTIKA =======================
   Připraveno pro Umami: stačí do index.html vložit jejich skript.
   Bez něj se nic neodesílá. */
function track(name, data){ try{ window.umami && window.umami.track(name, data); }catch(e){} }

/* ======================= ZVUK ======================= */
let ac = null;
function beep(freq, dur=0.12, type="square", vol=0.06){
  if(muted) return;
  try{
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+dur);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+dur);
  }catch(e){}
}
const sGood = c=>{beep(520+c*40,.08);setTimeout(()=>beep(780+c*40,.1),70)};
const sBad = ()=>beep(180,.25,"sawtooth",.07);

/* ======================= POMOCNÉ ======================= */
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const strip = h => h.replace(/<small>.*<\/small>/,"").trim();
function toast(msg){
  const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),2400);
}
function copyText(text, okMsg){
  const fail = ()=>toast("Kopírování se nepovedlo");
  try{ navigator.clipboard.writeText(text).then(()=>toast(okMsg)).catch(fail); }catch(e){ fail(); }
}
const SPK_ON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SPK_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 6 6"/><path d="m22 9-6 6"/></svg>';

/* Datum podle českého času, aby denní výzva měnila sadu o půlnoci v Česku */
function pragueDate(d=new Date()){
  const p = new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Prague",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
  return p; // YYYY-MM-DD
}
function prettyDate(iso){ const [y,m,d]=iso.split("-"); return `${+d}. ${+m}. ${y}`; }
function untilMidnight(){
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Prague",hour:"2-digit",minute:"2-digit",hour12:false}).format(now).split(":");
  let mins = 24*60 - (+parts[0]*60 + +parts[1]);
  return `${Math.floor(mins/60)} h ${mins%60} min`;
}
/* Deterministický generátor, stejný pro všechny hráče */
function seededRandom(seedStr){
  let h = 1779033703 ^ seedStr.length;
  for(let i=0;i<seedStr.length;i++){ h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h<<13 | h>>>19; }
  let a = h >>> 0;
  return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1|a); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; };
}

/* ======================= MENU ======================= */
function dailyState(){ return store.get("vn-daily-"+pragueDate()); }

function renderMenu(){
  stopTimer(); S = null;
  const ds = dailyState();
  const done = ds && ds.done;
  const okCount = done ? ds.results.filter(Boolean).length : 0;
  app.innerHTML = `
    <header class="brand">
      <h1><span class="w-hi">Vyšší</span>, <span class="arrows">nebo</span> <span class="w-lo">nižší</span></h1>
      <p>Dvě věci, jedno rozhodnutí. Tipni si, jestli je ta druhá vyšší, nebo nižší, a stihni to dřív, než doběhne čas.</p>
    </header>
    <button class="daily" id="daily">
      <span class="daily-text">
        <span class="tag">Denní výzva · ${prettyDate(pragueDate())}</span>
        <span class="daily-title">${done ? `Dnes máš ${okCount} z 10` : "10 dvojic, stejných pro všechny"}</span>
        <span class="daily-desc">${done ? `Nová výzva za ${untilMidnight()}. Pošli výsledek kamarádům.` : "Mix všech okruhů. Chyba hru neukončí, výsledek pak můžeš sdílet."}</span>
      </span>
      <span class="play">${done ? "Výsledek" : "Hrát"}</span>
    </button>
    <section class="cats">
      ${CAT_KEYS.map(k=>{const c=CATS[k]; return `
        <button class="cat" data-cat="${k}" id="cat-${k}">
          <span class="tag">${c.tag}</span>
          <h2>${c.name}</h2>
          <p class="desc">${c.desc}</p>
          <span class="meta"><span>Rekord <b>${best[k]||0}</b> · ${c.items.length} položek</span><span class="play">Hrát</span></span>
        </button>`}).join("")}
    </section>
    <section class="how">
      <div><strong>Čas běží</strong>Na každý tip máš 10 sekund. Čím déle hraješ, tím méně času.</div>
      <div><strong>Série násobí body</strong>Každých 5 správných v řadě zvedne násobič, až na ×4.</div>
      <div><strong>Jedna chyba a konec</strong>Pak to zkus znovu a překonej svůj rekord.</div>
    </section>
    <p class="foot">Verze ${VERSION} · Zdroje: ČSÚ – počet obyvatel v obcích k 1. 1. 2025, průměrné spotřebitelské ceny za prosinec 2025. Reklama je zatím jen simulace.</p>`;
  app.querySelectorAll(".cat").forEach(b=>b.onclick=()=>startGame(b.dataset.cat));
  document.getElementById("daily").onclick = ()=> done ? renderDailyOver() : startDaily();
}

/* ======================= KLASICKÁ HRA ======================= */
function pickNext(exclude){
  const items = CATS[S.cat].items;
  const lv = items[exclude[0]][2];
  const ok = i=>!exclude.includes(i) && !S.recent.includes(i) && items[i][2]!==lv;
  let list = items.map((_,i)=>i).filter(ok);
  if(!list.length) list = items.map((_,i)=>i).filter(i=>!exclude.includes(i) && items[i][2]!==lv);
  return list[Math.floor(Math.random()*list.length)];
}
const timeLimit = () => S.mode==="daily" ? 15 : Math.max(4, 10 - S.count*0.25);
const multiplier = () => Math.min(4, 1 + Math.floor(S.streak/5));

function startGame(cat){
  S = {mode:"classic", cat, score:0, count:0, streak:0, recent:[], continued:false, locked:false};
  S.left = Math.floor(Math.random()*CATS[cat].items.length);
  S.right = pickNext([S.left]);
  track("hra_start",{okruh:cat});
  renderRound();
}

/* ======================= DENNÍ VÝZVA ======================= */
function buildDaily(dateIso){
  const rnd = seededRandom("vn-"+dateIso);
  const order = [...CAT_KEYS];
  const rounds = [];
  const used = {}; CAT_KEYS.forEach(k=>used[k]=new Set());
  for(let i=0;i<10;i++){
    if(i%CAT_KEYS.length===0){ for(let j=order.length-1;j>0;j--){const r=Math.floor(rnd()*(j+1));[order[j],order[r]]=[order[r],order[j]];} }
    const cat = order[i%CAT_KEYS.length];
    const items = CATS[cat].items;
    let a,b,guard=0;
    do{ a=Math.floor(rnd()*items.length); b=Math.floor(rnd()*items.length); guard++; }
    while((a===b || items[a][2]===items[b][2] || used[cat].has(a) || used[cat].has(b)) && guard<500);
    used[cat].add(a); used[cat].add(b);
    rounds.push({cat,left:a,right:b});
  }
  return rounds;
}
function startDaily(){
  const date = pragueDate();
  const saved = store.get("vn-daily-"+date);
  const rounds = buildDaily(date);
  const results = saved && saved.results ? saved.results : [];
  S = {mode:"daily", date, rounds, results, idx:results.length, locked:false, score:0, count:0, streak:0};
  if(S.idx>=10){ renderDailyOver(); return; }
  loadDailyRound();
  track("denni_start",{});
  renderRound();
}
function loadDailyRound(){
  const r = S.rounds[S.idx];
  S.cat = r.cat; S.left = r.left; S.right = r.right;
}

/* ======================= KOLO ======================= */
function renderRound(){
  const c = CATS[S.cat];
  const L = c.items[S.left], R = c.items[S.right];
  const daily = S.mode==="daily";
  const m = daily ? 1 : multiplier();
  app.innerHTML = `
    <div class="hud">
      <div class="left">
        <button class="textbtn" id="back">Menu</button>
        <button class="iconbtn" id="mute" aria-label="${muted?"Zapnout zvuk":"Vypnout zvuk"}">${muted?SPK_OFF:SPK_ON}</button>
        <span class="catname">${daily?"Denní výzva · "+c.name:c.name}</span>
      </div>
      <div class="stats">
        ${daily ? `
          <div class="dots" aria-label="Postup">${S.rounds.map((_,i)=>`<i class="${i<S.results.length?(S.results[i]?"ok":"ko"):(i===S.idx?"now":"")}"></i>`).join("")}</div>
          <div class="stat"><span>Kolo</span><b>${S.idx+1}/10</b></div>` : `
          ${m>1?`<span class="combo" id="combo">×${m}</span>`:""}
          <div class="stat"><span>Série</span><b>${S.streak}</b></div>
          <div class="stat"><span>Body</span><b id="score">${S.score}</b></div>
          <div class="stat"><span>Rekord</span><b>${best[S.cat]||0}</b></div>`}
      </div>
    </div>
    <div class="arena" id="arena">
      <div class="card left enter">
        <span class="label">Známá hodnota</span>
        <div class="name">${esc(L[0])}</div>
        ${L[1]?`<div class="sub">${esc(L[1])}</div>`:""}
        <div class="value">${c.fmt(L[2])}</div>
      </div>
      <div class="vs" id="vs">VS</div>
      <div class="card right enter" id="rightCard">
        <div class="timer" id="timer"></div>
        <span class="label">Hádej</span>
        <div class="name">${esc(R[0])}</div>
        ${R[1]?`<div class="sub">${esc(R[1])}</div>`:""}
        <div class="value" id="rval">?</div>
        <div class="question">${c.question}</div>
        <div class="choices">
          <button class="choice hi" id="hi">${c.hi}</button>
          <button class="choice lo" id="lo">${c.lo}</button>
        </div>
      </div>
    </div>
    <div class="factbox" id="factbox" hidden></div>
    <p class="hint" id="hint">Na klávesnici: šipka nahoru / dolů · Zdroj: ${c.source}</p>`;
  document.getElementById("back").onclick = renderMenu;
  document.getElementById("mute").onclick = toggleMute;
  document.getElementById("hi").onclick = ()=>guess(true);
  document.getElementById("lo").onclick = ()=>guess(false);
  S.locked = false; S.awaitNext = false;
  startTimer();
}
function toggleMute(){
  muted=!muted; store.set("vn-muted",muted);
  const b=document.getElementById("mute");
  if(b){ b.innerHTML = muted?SPK_OFF:SPK_ON; b.setAttribute("aria-label", muted?"Zapnout zvuk":"Vypnout zvuk"); }
}

/* ======================= ČASOVAČ ======================= */
let raf = null;
function startTimer(){
  stopTimer();
  S.limit = timeLimit()*1000;
  S.deadline = performance.now() + S.limit;
  const tick = ()=>{
    const el = document.getElementById("timer");
    if(!el || !S) return;
    const left = Math.max(0, S.deadline - performance.now());
    el.style.transform = `scaleX(${left/S.limit})`;
    el.classList.toggle("low", left < 2500);
    if(left<=0){ guess(null); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function stopTimer(){ if(raf) cancelAnimationFrame(raf); raf=null; }

/* ======================= TAH ======================= */
function guess(higher){
  if(!S || S.locked) return;
  S.locked = true;
  stopTimer();
  const c = CATS[S.cat];
  const lv = c.items[S.left][2], rv = c.items[S.right][2];
  const timeLeft = Math.max(0,(S.deadline - performance.now())/1000);
  const correct = higher!==null && (rv===lv || (higher ? rv>lv : rv<lv));
  document.getElementById("hi").disabled = true;
  document.getElementById("lo").disabled = true;
  revealValue(rv, c);
  const card = document.getElementById("rightCard");
  if(rv!==lv) card.classList.add(rv>lv?"dir-hi":"dir-lo");
  const vs = document.getElementById("vs");

  if(correct){
    vs.classList.add("good"); vs.textContent="✓";
    sGood(Math.min((S.streak||0)+1,10));
  } else {
    vs.classList.add("bad"); vs.textContent="✕";
    document.getElementById("arena").classList.add("shake");
    sBad();
  }

  if(S.mode==="daily"){
    S.results.push(correct);
    store.set("vn-daily-"+S.date,{results:S.results,done:S.results.length>=10});
    const last = S.results.length>=10;
    showFact(c.items[S.right], correct, higher===null, last ? "Zobrazit výsledek" : "Další dvojice", ()=>{
      if(last){ track("denni_konec",{spravne:S.results.filter(Boolean).length}); renderDailyOver(); }
      else { S.idx++; loadDailyRound(); renderRound(); }
    });
    return;
  }

  if(correct){
    S.streak++; S.count++;
    const pts = 10*multiplier() + Math.round(timeLeft);
    S.score += pts;
    const f=document.createElement("div");f.className="floater";f.textContent="+"+pts;card.appendChild(f);
    document.getElementById("score").textContent = S.score;
    showFact(c.items[S.right], true, false, "Další dvojice", ()=>{
      S.recent = [S.left, ...S.recent].slice(0,12);
      S.left = S.right;
      S.right = pickNext([S.left]);
      renderRound();
    });
  } else {
    S.reason = higher===null ? "timeout" : "wrong";
    track("hra_konec",{okruh:S.cat, body:S.score, spravne:S.count, duvod:S.reason});
    showFact(c.items[S.right], false, higher===null, "Zobrazit výsledek", renderOver);
  }
}
function showFact(item, correct, timeout, nextLabel, onNext){
  const box = document.getElementById("factbox");
  const verdict = timeout ? "Došel čas." : correct ? "Správně!" : "Vedle.";
  box.className = "factbox " + (correct ? "ok" : "ko");
  box.innerHTML = `
    <div class="fact-text">
      <span class="verdict">${verdict}</span>
      <span class="fact-label">Věděl jsi, že…?</span>
      <p>${esc(item[3]||"")}</p>
    </div>
    <button class="btn primary next" id="next">${nextLabel}</button>`;
  box.hidden = false;
  const hint = document.getElementById("hint"); if(hint) hint.textContent = "Enter nebo mezerník: pokračovat";
  S.awaitNext = onNext;
  document.getElementById("next").onclick = ()=>{ const fn=S.awaitNext; S.awaitNext=null; fn&&fn(); };
  document.getElementById("next").focus({preventScroll:true});
  if(window.matchMedia("(max-width:640px)").matches) box.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function revealValue(v, c){
  const el = document.getElementById("rval");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce || S.cat==="historie"){ el.innerHTML = c.fmt(v); return; }
  const t0 = performance.now(), dur = 550;
  const step = now=>{
    const p = Math.min(1,(now-t0)/dur), e = 1-Math.pow(1-p,3);
    el.innerHTML = c.fmt(p<1 ? Math.round(v*e) : v);
    if(p<1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ======================= KONEC KLASICKÉ HRY ======================= */
function renderOver(){
  const c = CATS[S.cat];
  const L = c.items[S.left], R = c.items[S.right];
  const isBest = S.score > (best[S.cat]||0);
  if(isBest){ best[S.cat] = S.score; store.set("vn-best", best); }
  const why = `${S.reason==="timeout"?"Došel čas. ":""}<b>${esc(R[0])}</b>: ${strip(c.fmt(R[2]))}, <b>${esc(L[0])}</b>: ${strip(c.fmt(L[2]))}.`;
  app.innerHTML = `
    <div class="over">
      <span class="kicker">${S.reason==="timeout"?"Došel čas":"Vedle"}</span>
      <h2>${S.count>=10?"Pěkná série!":S.count>=4?"Dobrý pokus":"To se stává"}</h2>
      <p class="why">${why}</p>
      <div class="bigscore">
        <div><span>Body</span><b>${S.score}</b></div>
        <div><span>Správně</span><b>${S.count}</b></div>
      </div>
      ${isBest && S.score>0 ? `<span class="newbest">Nový rekord</span>` : `<span class="adnote">Rekord: ${best[S.cat]||0}</span>`}
      <div class="actions">
        ${!S.continued && S.count>0 ? `<button class="btn ad" id="cont">Pokračovat po reklamě</button>` : ""}
        <button class="btn primary" id="again">Hrát znovu</button>
        <button class="btn" id="share">Zkopírovat výsledek</button>
        <button class="btn" id="menu">Vybrat jiný okruh</button>
      </div>
      ${!S.continued && S.count>0 ? `<span class="adnote">Pokračování je ukázka monetizace: jednou za hru, po krátké reklamě.</span>`:""}
    </div>`;
  document.getElementById("again").onclick = ()=>startGame(S.cat);
  document.getElementById("menu").onclick = renderMenu;
  document.getElementById("share").onclick = ()=>{
    const blocks = "🟩".repeat(Math.min(S.count,15)) + "🟥";
    track("sdileni",{typ:"klasicka"});
    copyText(`Vyšší, nebo nižší · ${c.name}\n${S.score} bodů, ${S.count} správně v řadě\n${blocks}\n${location.origin}`, "Výsledek zkopírován, můžeš ho poslat dál");
  };
  const cont = document.getElementById("cont");
  if(cont) cont.onclick = playAd;
}
function playAd(){
  const layer = document.createElement("div");
  layer.className="adlayer";
  layer.innerHTML = `<div class="adbox"><span class="adnote">SIMULACE REKLAMY</span><b id="adn">3</b><span>Tady by běžela krátká reklama. Pak pokračuješ se stejným skóre.</span></div>`;
  document.body.appendChild(layer);
  let n=3;
  const iv = setInterval(()=>{
    n--; const el=document.getElementById("adn"); if(el) el.textContent=n;
    if(n<=0){
      clearInterval(iv); layer.remove();
      S.continued = true;
      S.recent = [S.left, S.right, ...S.recent].slice(0,12);
      S.left = S.right;
      S.right = pickNext([S.left]);
      renderRound();
    }
  },1000);
}

/* ======================= KONEC DENNÍ VÝZVY ======================= */
function renderDailyOver(){
  stopTimer();
  const date = pragueDate();
  const ds = store.get("vn-daily-"+date) || {results:[]};
  const res = ds.results;
  const ok = res.filter(Boolean).length;
  const grid = res.map(r=>r?"🟩":"🟥").join("");
  const rounds = buildDaily(date);
  const head = ok===10?"Perfektní den!":ok>=7?"Skvělý výsledek":ok>=4?"Slušná práce":"Zítra to vyjde líp";
  app.innerHTML = `
    <div class="over">
      <span class="kicker blue">Denní výzva · ${prettyDate(date)}</span>
      <h2>${head}</h2>
      <div class="bigscore"><div><span>Správně</span><b>${ok}/10</b></div></div>
      <div class="grid" aria-label="Výsledky kol">${res.map(r=>`<i class="${r?"ok":"ko"}"></i>`).join("")}</div>
      <ol class="recap">
        ${rounds.slice(0,res.length).map((r,i)=>{const c=CATS[r.cat];const L=c.items[r.left],R=c.items[r.right];
          return `<li class="${res[i]?"ok":"ko"}"><span>${esc(R[0])}</span> <b>${strip(c.fmt(R[2]))}</b> <em>vs ${esc(L[0])} ${strip(c.fmt(L[2]))}</em></li>`}).join("")}
      </ol>
      <div class="actions">
        <button class="btn primary" id="share">Sdílet výsledek</button>
        <button class="btn" id="menu">Zpět do menu</button>
      </div>
      <span class="adnote">Nová výzva bude za ${untilMidnight()}.</span>
    </div>`;
  document.getElementById("menu").onclick = renderMenu;
  document.getElementById("share").onclick = ()=>{
    track("sdileni",{typ:"denni"});
    copyText(`Vyšší, nebo nižší · Denní výzva ${prettyDate(date)}\n${ok}/10\n${grid}\n${location.origin}`, "Výsledek zkopírován, pošli ho kamarádům");
  };
}

/* ======================= KLÁVESNICE ======================= */
document.addEventListener("keydown", e=>{
  if(!S) return;
  if(S.awaitNext && (e.key==="Enter"||e.key===" ")){
    e.preventDefault(); const fn=S.awaitNext; S.awaitNext=null; fn(); return;
  }
  if(S.locked || !document.getElementById("hi")) return;
  if(e.key==="ArrowUp"){e.preventDefault();guess(true)}
  if(e.key==="ArrowDown"){e.preventDefault();guess(false)}
});

/* ======================= INSTALACE (PWA) ======================= */
if("serviceWorker" in navigator && location.protocol==="https:"){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
}

renderMenu();
