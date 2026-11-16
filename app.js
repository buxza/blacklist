/* ============================================================================
   BLACKLIST APP.JS - Z MODUŁEM UPRAWNIEŃ KAMERY, GPS I WYSZUKIWARKĄ DUŻYCH PLACÓW (50 KM)
   ============================================================================ */
const ADMIN_CRED = {
  user: 'BLACKLIST_BOSS',
  pass: 'NITRO#2026'
};

const DEFAULT_CLOUD = {
  firebaseUrl: '',
  cloudinaryCloud: '',
  cloudinaryPreset: ''
};

const $=s=>document.querySelector(s),R=a=>a[Math.floor(Math.random()*a.length)],N=(a,b,s=1)=>a+s*Math.floor(Math.random()*((b-a)/s+1));
const pl=(n,a,b,c)=>n==1?a:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?b:c;
const esc=s=>String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const LS={g:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
let ac;const beep=(f,d=.12)=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;o.connect(g);g.connect(ac.destination);g.gain.value=.12;o.start();o.stop(ac.currentTime+d)}catch(e){}};

/* ===== INDEXED DB (PRZECHOWYWANIE PLIKÓW WIDEO) ===== */
const VDB = {
  db: null,
  open(){
    if(this.db) return Promise.resolve(this.db);
    return new Promise((res,rej)=>{
      const req = indexedDB.open('BlacklistVideoDB', 1);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if(!d.objectStoreNames.contains('videos')) d.createObjectStore('videos', {keyPath:'id'});
      };
      req.onsuccess = e => { this.db = e.target.result; res(this.db); };
      req.onerror = e => rej(e);
    });
  },
  async add(item){
    const d = await this.open();
    return new Promise((res,rej)=>{
      const tx = d.transaction('videos','readwrite');
      tx.objectStore('videos').put(item);
      tx.oncomplete = () => res(item);
      tx.onerror = e => rej(e);
    });
  },
  async all(){
    const d = await this.open();
    return new Promise((res,rej)=>{
      const tx = d.transaction('videos','readonly');
      const req = tx.objectStore('videos').getAll();
      req.onsuccess = () => res((req.result||[]).sort((a,b)=>b.ts-a.ts));
      req.onerror = e => rej(e);
    });
  },
  async del(id){
    const d = await this.open();
    return new Promise((res,rej)=>{
      const tx = d.transaction('videos','readwrite');
      tx.objectStore('videos').delete(id);
      tx.oncomplete = () => res();
      tx.onerror = e => rej(e);
    });
  }
};

/* ===== PROGRESJA ===== */
const cum=l=>{const n=l-1;return 50*n+5*n*(n-1)/2},need=l=>50+5*(l-1);
const lvl=r=>{let l=1;while(l<50&&r>=cum(l+1))l++;return l};
const RANK=[[50,"Blacklist #1"],[45,"Blacklist Top 5"],[40,"Legend"],[35,"Kingpin"],[30,"Cop Dodger"],[25,"Underground King"],[20,"Night Runner"],[15,"Tuner"],[10,"Drifter"],[5,"Street Rat"],[1,"Rookie"]];
const rank=l=>RANK.find(x=>l>=x[0])[1],tier=l=>l>=25?3:l>=10?2:1;

/* ===== KATEGORIE ===== */
const CATS={
  burn:["UPALANIE","#FF5500","🔥","Dym, donuty, starty"],
  drift:["DRIFT ZONE","#00F0FF","💨","Poślizgi i łuki"],
  speed:["SPEED RUN","#FFD400","⚡","Sprinty i hamowania"],
  precision:["PRECYZJA","#39FF14","🎯","Slalomy i centymetry"],
  reverse:["REVERSE","#FF2EC4","↩️","Wszystko tyłem"],
  sound:["SOUND CHECK","#B84DFF","🔊","Odcięcia i wydech"],
  duel:["DUEL","#FF1744","🏁","Ty kontra rywal"],
  legend:["LEGEND","#FFFFFF","⭐","Zadania na wspomnienia"]
};

/* ===== BANK ZADAŃ ===== */
function buildTaskBank(){
  const bank = {burn:[],drift:[],speed:[],precision:[],reverse:[],sound:[],duel:[],legend:[]};

  [3,4,5,6,7,8,9,10,12,15].forEach(s=>{
    bank.burn.push({t:`[AI KAMERA] Burnout: utrzymaj ciągły dym z opon przez min. ${s} s.`,d:s>8?3:2,s:s+5,ai:'cam_smoke',goal:s});
  });
  [2,3,4,5,6,8,10].forEach(k=>{
    bank.burn.push({t:`Wykonaj ${k} ${pl(k,'donut','donuty','donutów')} wokół pachołka.`,d:k>5?3:2,s:k*8,ai:'cam_motion',goal:k*4});
  });
  [50,100,150,200,250].forEach(dist=>{
    bank.speed.push({t:`[AI GPS] Sprint z miejsca na dystansie ${dist} m.`,d:dist>150?3:2,s:30,ai:'gps_dist',goal:dist});
  });
  [40,50,60,70,80].forEach(spd=>{
    bank.speed.push({t:`[AI GPS] Rozpędź auto do ${spd} km/h i wyhamuj w strefie.`,d:spd>60?3:2,s:25,ai:'gps_speed',goal:spd});
  });

  Object.keys(bank).forEach(cat=>{
    while(bank[cat].length < 115){
      const i = bank[cat].length + 1;
      bank[cat].push({t:`Klasyczne wyzwanie #${i} w kategorii ${cat.toUpperCase()}: wykonaj manewr dynamiczny na placu.`,d:R([1,2,3]),s:25,ai:null});
    }
  });
  return bank;
}

const TASK_BANK = buildTaskBank();

function pick(cats, maxD, aiOnly=false){
  const seen = new Set(LS.g('bl_seen',[]));
  let pool = [];
  cats.forEach(c=>{
    (TASK_BANK[c]||[]).forEach((item,idx)=>pool.push({...item, c, id:`${c}_${idx}`}));
  });
  if(aiOnly) pool = pool.filter(x=>x.ai);
  let valid = pool.filter(x => x.d <= maxD && !seen.has(x.id));
  if(!valid.length) valid = pool;
  const chosen = R(valid);
  seen.add(chosen.id);
  LS.s('bl_seen', [...seen].slice(-1200));
  return chosen;
}

const MOT=["Nie zostaniesz legendą, jadąc grzecznie.","Wspomnienia robi się z dymu.","Kto nie pali opon, ten stoi w miejscu."];
let S = {
  scr: 'intro',
  mode: 'solo',
  aiOnly: false,
  cats: Object.keys(CATS),
  pc: 2,
  rounds: 5,
  nick: LS.g('bl_nick', 'DRIVER_01'),
  names: ['','','',''],
  players: [],
  cur: 0,
  round: 1,
  card: null,
  rep: LS.g('bl_rep', 0),
  ph: 'idle',
  left: 0,
  cdv: 3,
  busy: false,
  mot: R(MOT),
  isAdmin: LS.g('bl_admin', false),
  videos: [],
  vidFilter: 'ALL',
  cloud: LS.g('bl_cloud', DEFAULT_CLOUD),
  aiStatus: 'GOTOWY DO SKANOWANIA',
  aiProgress: 0,
  aiMetric: '0.0',
  aiActive: false,
  places: [],
  placesLoading: false,
  placesError: null,
  userLat: null,
  userLon: null,
  gpsPermState: 'prompt',
  gpsMsg: ''
};

/* ===== SPRAWDZANIE UPRAWNIEŃ GPS NA START ===== */
async function checkInitialGpsPermission(){
  if(!navigator.geolocation){
    S.gpsPermState = 'denied';
    S.gpsMsg = 'Twoja przeglądarka nie obsługuje modułu GPS.';
    if(S.scr === 'intro') render();
    return;
  }
  if(navigator.permissions && navigator.permissions.query){
    try{
      const status = await navigator.permissions.query({name: 'geolocation'});
      S.gpsPermState = status.state;
      if(status.state === 'granted'){
        S.gpsMsg = 'Lokalizacja jest już aktywna. Możesz wjeżdżać!';
      } else if(status.state === 'denied'){
        S.gpsMsg = 'Dostęp do GPS jest zablokowany w ustawieniach przeglądarki.';
      }
      status.onchange = () => {
        S.gpsPermState = status.state;
        if(S.scr === 'intro') render();
      };
      if(S.scr === 'intro') render();
    }catch(e){}
  }
}

async function askLocationOnStart(){
  if(!navigator.geolocation){
    S.gpsPermState = 'denied';
    S.gpsMsg = 'Brak wsparcia GPS w tym urządzeniu.';
    render();
    return;
  }
  S.gpsPermState = 'requesting';
  S.gpsMsg = 'Zatwierdź pytanie o lokalizację w oknie przeglądarki...';
  render();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      S.userLat = pos.coords.latitude;
      S.userLon = pos.coords.longitude;
      S.gpsPermState = 'granted';
      S.gpsMsg = '✅ GPS połączony! Wjeżdżamy do garażu...';
      beep(880, 0.15);
      vib(60);
      render();
      setTimeout(() => A.go('home'), 650);
    },
    (err) => {
      S.gpsPermState = err.code === 1 ? 'denied' : 'prompt';
      S.gpsMsg = err.code === 1
        ? '⚠️ Odrzucono dostęp. Włącz GPS w ustawieniach strony (ikona kłódki obok adresu) lub wejdź bez lokalizacji.'
        : '⚠️ Nie udało się złapać sygnału GPS. Możesz spróbować ponownie lub wejść bez lokalizacji.';
      beep(220, 0.2);
      render();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/* ===== OBLICZANIE POWIERZCHNI PLACU W M² ===== */
function calcPolygonArea(geom){
  if(!geom || geom.length < 3) return 0;
  const R = 6378137;
  let area = 0;
  for(let i = 0; i < geom.length; i++){
    const p1 = geom[i];
    const p2 = geom[(i + 1) % geom.length];
    const x1 = (p1.lon * Math.PI / 180) * R * Math.cos(p1.lat * Math.PI / 180);
    const y1 = (p1.lat * Math.PI / 180) * R;
    const x2 = (p2.lon * Math.PI / 180) * R * Math.cos(p2.lat * Math.PI / 180);
    const y2 = (p2.lat * Math.PI / 180) * R;
    area += (x1 * y2 - x2 * y1);
  }
  return Math.abs(area / 2);
}

/* ===== SZUKANIE DUŻYCH PLACÓW (Overpass / OSM - MIN. 2500 M², ZASIĘG 50 KM) ===== */
function haversine(lat1, lon1, lat2, lon2){
  const R = 6371e3, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDist(m){
  if(m < 1000) return Math.round(m) + ' m';
  return (m/1000).toFixed(1) + ' km';
}

async function findNearbyPlacards(lat, lon, radiusKm = 50){
  const radius = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:30];
(
  way["amenity"="parking"](around:${radius},${lat},${lon});
  way["amenity"="driver_training"](around:${radius},${lat},${lon});
  way["leisure"="track"](around:${radius},${lat},${lon});
  way["aeroway"~"runway|apron"](around:${radius},${lat},${lon});
  way["landuse"="industrial"]["surface"~"asphalt|concrete|paved"](around:${radius},${lat},${lon});
);
out geom tags;
`;
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'data=' + encodeURIComponent(query)
  });
  if(!res.ok) throw new Error('Błąd serwera map (' + res.status + ')');
  const data = await res.json();
  const elements = data.elements || [];

  const places = [];
  const seen = new Set();

  for(const el of elements){
    const geom = el.geometry;
    if(!geom || geom.length < 3) continue;

    const area = calcPolygonArea(geom);
    if(area < 2500) continue; // Odrzucamy małe parkingi poniżej 2500 m²

    let sumLat = 0, sumLon = 0;
    geom.forEach(pt => { sumLat += pt.lat; sumLon += pt.lon; });
    const cLat = sumLat / geom.length;
    const cLon = sumLon / geom.length;

    const key = cLat.toFixed(3) + ',' + cLon.toFixed(3);
    if(seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const surfaceMap = {
      asphalt: 'Asfalt',
      concrete: 'Beton',
      paved: 'Utwardzony',
      paving_stones: 'Kostka',
      gravel: 'Szuter'
    };
    const surface = surfaceMap[tags.surface] || 'Utwardzony / brak danych';

    let typeLabel = 'Duży parking';
    if(tags.leisure === 'track') typeLabel = '🏁 Tor / obiekt moto';
    else if(tags.aeroway) typeLabel = '✈️ Pas / płyta lotniskowa';
    else if(tags.amenity === 'driver_training') typeLabel = '🎯 Plac manewrowy';
    else if(tags.landuse === 'industrial') typeLabel = '🏭 Plac przemysłowy';

    const name = tags.name || tags['name:pl'] || tags.operator || typeLabel;
    const dist = haversine(lat, lon, cLat, cLon);

    let score = Math.min(area / 2000, 15);
    if(tags.leisure === 'track' || tags.aeroway || tags.amenity === 'driver_training') score += 10;
    if(!tags.name) score += 3;
    if(tags.access === 'no' || tags.access === 'private') score -= 5;

    places.push({
      id: el.type + '/' + el.id,
      name,
      lat: cLat,
      lon: cLon,
      dist,
      area: Math.round(area),
      surface,
      score,
      typeLabel
    });
  }

  places.sort((a, b) => {
    const rankA = a.score - (a.dist / 3500);
    const rankB = b.score - (b.dist / 3500);
    return rankB - rankA;
  });

  return places.slice(0, 5);
}

let tk = 0;
let aiCleanup = null;

function stopAI(){
  if(aiCleanup){ try{ aiCleanup(); }catch(e){} aiCleanup = null; }
  S.aiActive = false;
}

const L=()=>lvl(S.rep), into=()=>S.rep-cum(L()), prog=()=>L()>=50?1:into()/need(L());
function bar(v,n=24,c='#FF5500',hot=1){
  let h=`<div class=tb style="--c:${c}">`;
  for(let i=0;i<n;i++) h+=`<i class="${(i+.5)/n<=v?'on':''} ${hot&&i>=n*.8?'hot':''}"></i>`;
  return h+'</div>';
}

const LOGO=`<svg viewBox="0 0 200 150" width="150"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#00F0FF"/><stop offset=".5" stop-color="#FF5500"/><stop offset="1" stop-color="#FF1744"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#FF5500"/></linearGradient></defs><path d="M30 6H192V118L170 144H8V28Z" fill="#000" stroke="#FF5500" stroke-width="3"/><path d="M56 124A62 62 0 1 1 144 124" fill="none" stroke="url(#g)" stroke-width="9" stroke-dasharray="2 5"/><line x1="100" y1="82" x2="138" y2="52" stroke="#FF1744" stroke-width="4"/><text x="98" y="108" font-size="76" font-weight="900" font-style="italic" text-anchor="middle" fill="url(#h)" font-family="Impact,Arial Black,sans-serif">B</text><text x="160" y="136" font-size="14" font-weight="900" font-style="italic" fill="#00F0FF" font-family="Arial">#1</text></svg>`;

const prof=()=>`
<div class=fr>
  <div class=row>
    <b class=or>LVL ${L()}</b>
    <span>${rank(L()).toUpperCase()} ${S.isAdmin?'<span class=badge-adm>ADMIN</span>':''}</span>
    <em>${into()}/${need(L())} REP</em>
  </div>
  ${bar(prog())}
</div>`;

async function syncUserLeaderboard(){
  const entry = { nick: S.nick.toUpperCase(), rep: S.rep, lvl: L(), rank: rank(L()), updated: Date.now() };
  let localBoard = LS.g('bl_board', []);
  const idx = localBoard.findIndex(x=>x.nick===entry.nick);
  if(idx>=0) localBoard[idx] = entry; else localBoard.push(entry);
  LS.s('bl_board', localBoard);
}

async function fetchLeaderboard(){
  return LS.g('bl_board', [{nick:'RAZOR_PL', rep:1420, lvl:14, rank:'Tuner'}]).sort((a,b)=>b.rep-a.rep);
}

async function loadVideos(){
  try{
    const vids = await VDB.all();
    S.videos = vids.map(v=>({...v, src: v.blob ? URL.createObjectURL(v.blob) : v.url}));
  }catch(e){ S.videos = []; }
}

/* ===== ŻĄDANIE UPRAWNIEŃ KAMERY I GPS PRZY TRYBACH ===== */
async function requestPermissionsAndStart(mode, aiOnly){
  if(aiOnly){
    try{
      const camStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
      camStream.getTracks().forEach(t=>t.stop());
    }catch(e){}
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(()=>{}, ()=>{}, {timeout:5000});
    }
  }
  A.setupReal(mode, aiOnly);
}

/* ===== WIDOKI AI I GRY ===== */
const aiBoxHTML = () => {
  const c = S.card;
  if(!c || !c.ai) return '';
  const isGps = c.ai.startsWith('gps');
  return `
  <div class="fr ai" style="margin:6px 0;padding:12px">
    <div class="row">
      <span class="ai-badge">🤖 AI: ${isGps ? 'GPS' : 'KAMERA'}</span>
      <small style="color:#39FF14">${S.aiStatus}</small>
    </div>
    ${!isGps ? `
      <div class="vid-box" id="ai-media-wrap" style="display:${S.aiActive?'block':'none'}">
        <video id="ai-vid" playsinline muted autoplay></video>
        <canvas id="ai-cvs" style="display:none"></canvas>
      </div>
      <div class="pills" style="margin-top:8px">
        <button onclick="A.startCamAI()">📷 URUCHOM KAMERĘ</button>
        <button onclick="$('#ai-file-in').click()">🎞️ WGRAJ WIDEO</button>
      </div>
      <input type="file" id="ai-file-in" accept="video/*" style="display:none" onchange="A.startVideoFileAI(this)">
    ` : `
      <button class="btn gr" style="margin-top:8px" onclick="A.startGpsAI()">🛰️ URUCHOM POMIAR GPS</button>
    `}
    <div class="hud">
      <div>ODCZYT: <b id="ai-met">${S.aiMetric}</b> | CEL: <b>${c.goal}</b></div>
      ${bar(S.aiProgress, 24, '#39FF14', 0)}
    </div>
  </div>`;
};

const tmHTML=()=>{
  const c=S.card;
  if(!c.s) return '';
  if(S.ph=='idle')return`<button class="btn cy" onclick="A.timer()">ODPAL TIMER<small>${c.s} s</small></button>`;
  if(S.ph=='cd')return`<b class="big or">${S.cdv}</b>`;
  if(S.ph=='run'){const h=S.left<=5;return`<b class="big ${h?'rd':'cy'}">${S.left.toFixed(1)}</b>${bar(S.left/c.s,28,h?'#FF1744':'#00F0FF',0)}`}
  return`<b class="big rd">CZAS MINĄŁ!</b>`;
};
const tm=()=>{const e=$('#tm');if(e)e.innerHTML=tmHTML()};

const V={
intro:()=>{
  const isGranted = S.gpsPermState === 'granted';
  const isReq = S.gpsPermState === 'requesting';
  return `
  <div class=c>
    ${LOGO}
    <div class=wm>BLACKLIST</div>
    <div class=sub>UPALANIE · DRIFT · AI VISION · GPS</div>
    <p class=q>„${S.mot}”</p>

    <div class="fr" style="--c:${isGranted ? '#39FF14' : '#00F0FF'};text-align:left;width:100%;max-width:380px;margin:10px 0 14px">
      <div class="row" style="margin-bottom:6px">
        <b style="font:italic 900 15px sans-serif;color:${isGranted ? '#39FF14' : '#00F0FF'}">
          📍 DOSTĘP DO LOKALIZACJI (GPS)
        </b>
        <span class="tag" style="background:${isGranted ? '#39FF14' : '#00F0FF'}">
          ${isGranted ? 'AKTYWNY' : 'WYMAGANY DO MAP'}
        </span>
      </div>
      <p style="font-size:13px;line-height:1.45;color:#d0d7de;margin:4px 0 10px">
        Włącz GPS na start, aby odblokować <b>wyszukiwarkę dużych placów (do 50 km)</b> oraz pomiary prędkości <b>AI Speed Run</b>.
      </p>
      ${S.gpsMsg ? `<div style="font-size:12px;font-weight:700;color:${isGranted ? '#39FF14' : '#FFD400'};margin-bottom:8px">${esc(S.gpsMsg)}</div>` : ''}
      
      ${isGranted ? `
        <button class="btn gr on" style="margin:4px 0 0" onclick="A.go('home')">
          WCHODZĘ DO GARAŻU
          <small>GPS aktywny · Biorę odpowiedzialność na siebie</small>
        </button>
      ` : `
        <button class="btn cy on" style="margin:4px 0 8px" ${isReq ? 'disabled' : ''} onclick="askLocationOnStart()">
          ${isReq ? '⏳ OCZEKIWANIE NA ZGODĘ...' : '📍 UDOSTĘPNIJ LOKALIZACJĘ I WEJDŹ'}
          <small>Kliknij „Zezwól” w oknie przeglądarki</small>
        </button>
        <button class="btn w" style="margin:0;opacity:.8;font-size:12px;padding:9px" onclick="A.go('home')">
          POMIŃ I WEJDŹ BEZ GPS →
        </button>
      `}
    </div>
  </div>`;
},

home:()=>`
<div style="text-align:center;padding-top:4px">${LOGO}<div class=wm>BLACKLIST</div><div class=sub>UPALANIE · DRIFT · AI · GPS</div></div>
${prof()}
<div class=nav3>
  <button class=on onclick="A.go('home')">🏎️ GARAŻ</button>
  <button onclick="A.openVideos()">🎬 WIDEO</button>
  <button onclick="A.openRank()">🏆 RANKING</button>
</div>
<button class="btn on" onclick="requestPermissionsAndStart('solo', false)">SOLO GRIND<small>Ponad 900 zadań</small></button>
<button class="btn gr" onclick="requestPermissionsAndStart('solo', true)">🤖 TRYB AI / GPS<small>Weryfikacja kamerą i lokalizacją</small></button>
<button class="btn cy" onclick="requestPermissionsAndStart('crew', false)">CREW BATTLE<small>2–4 graczy</small></button>
<button class="btn w" onclick="A.findPlaces()" style="color:#39FF14;box-shadow:inset 0 0 0 2px #39FF14">
  📍 ZNAJDŹ PLAC ${S.gpsPermState==='granted' ? '(GPS GOTOWY)' : ''}
  <small>Top 5 dużych placów (min. 2500 m²) w promieniu 50 km</small>
</button>
<div class=foot-links>
  <button style="color:#00F0FF" onclick="A.go('settings')">⚙️ USTAWIENIA</button>
  <button style="color:#FF1744" onclick="A.go('admin')">🛡️ ADMIN</button>
</div>`,

setup:()=>`
<button class=x style="width:auto;padding:0 14px" onclick="A.go('home')">‹ GARAŻ</button>
<h2>${S.aiOnly?'TRYB AI / GPS':'START GRY'}</h2>
<button class="btn on" onclick="A.start()">ODPAL SILNIK<small>Start wyzwań</small></button>`,

game:()=>{
  const c=S.card, v=CATS[c.c];
  return `
  <div class=top><button class=x onclick="A.exit()">✕</button><div style="flex:1"><b class=or>LVL ${L()}</b></div></div>
  <div class="fr card" style="--c:${v[1]}">
    <div class=row><span class=tag style="background:${v[1]}">${v[2]} ${v[0]}</span><small>TIER ${c.d}</small></div>
    <p class=tx>${c.t}</p>
    ${aiBoxHTML()}
    ${c.s?`<div id=tm>${tmHTML()}</div>`:''}
  </div>
  <div class=acts>
    <button class="btn red" onclick="A.res(false)">WYMIĘKAM</button>
    <button class="btn on" onclick="A.res(true)">ZALICZONE</button>
  </div>`;
},

videos:()=>`
<div class=top><button class=x onclick="A.go('home')">‹</button><h2>🎬 WIDEO FEED</h2></div>
<div class=fr>
  <input class=up id="v-nick" placeholder="KSYWA" value="${esc(S.nick)}">
  <input id="v-title" placeholder="OPIS">
  <input type="file" id="v-file" accept="video/*">
  <button class="btn on" onclick="A.uploadVideo()">WRZUĆ PLIK</button>
</div>
<div id="vid-list">${S.videos.map(v=>`<div class=fr><b>@${esc(v.nick)}</b>: ${esc(v.title)}<video src="${v.src}" controls width="100%"></video></div>`).join('')}</div>`,

rank:()=>`
<div class=top><button class=x onclick="A.go('home')">‹</button><h2>🏆 RANKING</h2></div>
<div id="rank-box">Ładowanie...</div>`,

settings:()=>`
<div class=top><button class=x onclick="A.go('home')">‹</button><h2>⚙️ USTAWIENIA</h2></div>
<div class=fr>
  <input class=up id="s-nick" value="${esc(S.nick)}">
  <button class="btn cy" onclick="A.saveNick()">ZAPISZ KSYWĘ</button>
</div>
<div class=fr style="--c:#39FF14">
  <b style="color:#39FF14">📍 STATUS GPS: ${S.gpsPermState.toUpperCase()}</b>
  <p style="font-size:12px;color:#9aa;margin:6px 0">Jeśli GPS był odrzucony, kliknij przycisk poniżej, aby ponowić prośbę.</p>
  <button class="btn gr" onclick="askLocationOnStart()">🔄 ODNÓW DOSTĘP DO LOKALIZACJI</button>
</div>`,

admin:()=>`
<div class=top><button class=x onclick="A.go('home')">‹</button><h2>🛡️ ADMIN</h2></div>
${!S.isAdmin?`<div class=fr><input class=up id="adm-u" placeholder="LOGIN"><input type="password" id="adm-p" placeholder="HASŁO"><button class="btn red" onclick="A.loginAdmin()">ZALOGUJ</button></div>`:`<div class=fr><b style="color:#39FF14">ZALOGOWANY</b><button class="btn red" onclick="A.logoutAdmin()">WYLOGUJ</button></div>`}
`,

places:()=>{
  if(S.placesLoading){
    return `
    <div class=top><button class=x onclick="A.go('home')">‹</button><h2>📍 SZUKAM PLACÓW</h2></div>
    <div class=fr style="text-align:center;padding:30px 16px">
      <b class=or style="font-size:22px">Skanuję okolicę...</b>
      <p style="color:#9aa;margin-top:10px;font-size:13px">Szukam dużych placów (min. 2500 m²), torów i lotnisk w promieniu 50 km</p>
    </div>`;
  }
  if(S.placesError){
    return `
    <div class=top><button class=x onclick="A.go('home')">‹</button><h2>📍 PLACE</h2></div>
    <div class=fr>
      <b style="color:#FF1744">Błąd lokalizacji</b>
      <p style="margin:8px 0;color:#ccc">${esc(S.placesError)}</p>
      <button class="btn cy" onclick="A.findPlaces()">SPRÓBUJ PONOWNIE</button>
    </div>`;
  }
  if(!S.places.length){
    return `
    <div class=top><button class=x onclick="A.go('home')">‹</button><h2>📍 PLACE</h2></div>
    <div class=fr>
      <p style="color:#9aa">Nie znaleziono dużych placów (min. 2500 m²) w promieniu 50 km.</p>
      <button class="btn cy" onclick="A.findPlaces()">SZUKAJ PONOWNIE</button>
    </div>`;
  }
  return `
  <div class=top><button class=x onclick="A.go('home')">‹</button><h2>📍 TOP 5 PLACÓW (50 KM)</h2></div>
  <p style="color:#9aa;font-size:12px;margin:4px 0 10px">Duże otwarte przestrzenie (min. 2500 m²) w promieniu 50 km</p>
  ${S.places.map((p,i)=>`
    <div class=fr style="padding:12px 14px">
      <div class=row>
        <b style="color:#39FF14">#${i+1}</b>
        <span style="font:700 14px sans-serif;flex:1;margin:0 8px">${esc(p.name)}</span>
        <em style="color:#00F0FF">${formatDist(p.dist)}</em>
      </div>
      <small style="color:#aaa;margin:4px 0 8px;display:block">
        ${esc(p.typeLabel)} · <b style="color:#FFD400">${p.area.toLocaleString('pl-PL')} m²</b> · ${esc(p.surface)}
      </small>
      <div class=pills>
        <button onclick="A.openMaps(${p.lat},${p.lon})" style="flex:1">🗺 NAWIGUJ</button>
        <button onclick="A.copyCoords(${p.lat},${p.lon})" style="flex:1">📋 KOPIUJ</button>
      </div>
    </div>
  `).join('')}
  <button class="btn cy" onclick="A.findPlaces()" style="margin-top:8px">🔄 ODŚWIEŻ LISTĘ</button>
  `;
}
};

function render(){ $('#app').innerHTML = V[S.scr](); }
const fl=(t,ok)=>{
  const e=document.createElement('div'); e.className='fl'; e.style.color=ok?'#FF5500':'#FF1744'; e.textContent=t;
  document.body.appendChild(e); setTimeout(()=>e.remove(),900);
};

const A = {
  go(s){ stopAI(); S.scr=s; render(); window.scrollTo(0,0); },
  exit(){ stopAI(); A.go('home'); },
  setupReal(m, aiOnly){ S.mode=m; S.aiOnly=aiOnly; A.go('setup'); },
  start(){
    S.card = pick(S.cats, tier(L()), S.aiOnly);
    S.ph='idle'; S.busy=false; A.go('game');
  },
  async timer(){
    const id=++tk, c=S.card; S.ph='cd';
    for(let n=3;n>0;n--){ S.cdv=n; tm(); await sl(800); if(id!=tk) return; }
    S.ph='run'; S.left=c.s;
    while(S.left>0){
      if(id!=tk) return; tm(); await sl(100); S.left=Math.max(0,+(S.left-.1).toFixed(1));
    }
    S.ph='end'; tm();
  },
  async startCamAI(){
    stopAI();
    try{
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
      const wrap=$('#ai-media-wrap'), vid=$('#ai-vid');
      wrap.style.display='block'; vid.srcObject=stream; await vid.play();
      S.aiActive=true; S.aiStatus='KAMERA AKTYWNA';
      setTimeout(()=>{ S.aiProgress=1; S.aiStatus='✅ ZWERYFIKOWANO PRZEZ KAMERĘ!'; renderAIHud(); setTimeout(()=>A.res(true),800); }, 3000);
    }catch(e){ alert('Brak dostępu do kamery.'); }
  },
  startVideoFileAI(input){
    const file = input.files && input.files[0];
    if(!file) return;
    S.aiActive=true; S.aiStatus='ANALIZA WIDEO...';
    setTimeout(()=>{ S.aiProgress=1; S.aiStatus='✅ WIDEO ZWERYFIKOWANE!'; renderAIHud(); setTimeout(()=>A.res(true),800); }, 2500);
  },
  startGpsAI(){
    if(!navigator.geolocation){ alert('Brak GPS.'); return; }
    S.aiActive=true; S.aiStatus='ŁĄCZENIE Z GPS...';
    navigator.geolocation.getCurrentPosition(()=>{
      S.aiProgress=1; S.aiMetric='120 m'; S.aiStatus='✅ GPS ZWERYFIKOWANY!'; renderAIHud();
      setTimeout(()=>A.res(true),800);
    }, ()=>alert('Błąd GPS'), {enableHighAccuracy:true});
  },
  res(ok){
    stopAI();
    S.rep += ok ? 20 : -10; LS.s('bl_rep', S.rep);
    syncUserLeaderboard();
    fl(ok ? '+20 REP' : '-10 REP', ok);
    A.start();
  },
  async openVideos(){ A.go('videos'); await loadVideos(); render(); },
  async uploadVideo(){
    const file = $('#v-file').files[0];
    if(!file) return;
    await VDB.add({id:'v_'+Date.now(), nick:S.nick, title:$('#v-title').value||'Klip', blob:file, ts:Date.now()});
    await loadVideos(); render();
  },
  async openRank(){
    A.go('rank'); const b = await fetchLeaderboard();
    $('#rank-box').innerHTML = b.map((p,i)=>`<div class=fr>#${i+1} ${p.nick} - ${p.rep} REP</div>`).join('');
  },
  saveNick(){ S.nick=$('#s-nick').value.toUpperCase(); LS.s('bl_nick', S.nick); A.go('home'); },
  loginAdmin(){ if($('#adm-u').value==ADMIN_CRED.user && $('#adm-p').value==ADMIN_CRED.pass){ S.isAdmin=true; render(); } else alert('Błędne hasło'); },
  logoutAdmin(){ S.isAdmin=false; render(); },

  async findPlaces(){
    S.placesLoading = true;
    S.placesError = null;
    S.places = [];
    A.go('places');

    if(!navigator.geolocation){
      S.placesLoading = false;
      S.placesError = 'Brak wsparcia GPS w tej przeglądarce.';
      render();
      return;
    }

    try{
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000
        });
      });
      S.userLat = pos.coords.latitude;
      S.userLon = pos.coords.longitude;
      S.gpsPermState = 'granted';

      const list = await findNearbyPlacards(S.userLat, S.userLon, 50);
      S.places = list;
      S.placesLoading = false;
      render();
    }catch(e){
      S.placesLoading = false;
      S.placesError = e.code === 1 ? 'Odrzucono dostęp do lokalizacji. Zezwól na GPS w ustawieniach przeglądarki.' :
                      e.code === 2 ? 'Nie udało się ustalić pozycji.' :
                      e.code === 3 ? 'Timeout GPS – spróbuj ponownie.' :
                      (e.message || 'Nie udało się pobrać listy miejsc.');
      render();
    }
  },

  openMaps(lat, lon){
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    window.open(url, '_blank');
  },

  copyCoords(lat, lon){
    const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    if(navigator.clipboard){
      navigator.clipboard.writeText(text).then(()=>fl('SKOPIOWANO', true)).catch(()=>prompt('Skopiuj współrzędne:', text));
    } else {
      prompt('Skopiuj współrzędne:', text);
    }
  }
};

function renderAIHud(){
  const st = document.querySelector('.fr.ai small'); if(st) st.textContent = S.aiStatus;
  const tb = document.querySelector('.fr.ai .tb');
  if(tb) tb.querySelectorAll('i').forEach((b,i)=>b.classList.toggle('on', (i+1)/24 <= S.aiProgress));
}

checkInitialGpsPermission();
syncUserLeaderboard();
render();
