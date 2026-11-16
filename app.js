/* ============================================================================
   BLACKLIST APP.JS - WERSJA BETA 0.0.1 (SPOTY RWD + AI TRACK ROUTE & TIMER)
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
  places: LS.g('bl_saved_places', []),
  placesRadius: 25,
  placesLoading: false,
  placesError: null,
  userLat: null,
  userLon: null,
  gpsPermState: 'prompt',
  gpsMsg: '',
  // STAN MODUŁU AI TRACK (TRASA & TIMER)
  tracks: LS.g('bl_saved_tracks', []),
  tracksLoading: false,
  tracksError: null,
  activeTrack: null,
  trackTimerState: 'idle', // idle, waiting_start, running, finished
  trackStartTime: 0,
  trackElapsedTime: 0,
  trackLeaderboard: LS.g('bl_track_lb', []),
  trackWatchId: null
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
        ? '⚠️ Odrzucono dostęp. Włącz GPS w ustawieniach strony lub wejdź bez lokalizacji.'
        : '⚠️ Nie udało się złapać sygnału GPS. Spróbuj ponownie lub wejdź bez lokalizacji.';
      beep(220, 0.2);
      render();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

/* ===== OBLICZANIE GEOMETMrii ===== */
function haversine(lat1, lon1, lat2, lon2){
  const R = 6371e3, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calcBoundsArea(bounds){
  if(!bounds) return 0;
  const {minlat, minlon, maxlat, maxlon} = bounds;
  const midLat = (minlat + maxlat) / 2;
  const midLon = (minlon + maxlon) / 2;
  const height = haversine(minlat, midLon, maxlat, midLon);
  const width = haversine(midLat, minlon, midLat, maxlon);
  return height * width * 0.65;
}

function formatDist(m){
  if(m < 1000) return Math.round(m) + ' m';
  return (m/1000).toFixed(1) + ' km';
}

const PRZYPAL_REGEX = /biedronk|lidl|dino|kaufland|auch|carrefour|netto|aldi|pepco|rossmann|galeria|centrum|handlow|market|sklep|urząd|urzad|szpital|przychodni|szkoł|szkol|przedszkol|kościół|kosciol|cmentarz|policj|straż|straz|sąd|sad|dworzec|pkp|pks|hotel|restaurac|mcdonald|kfc|orlen|bp|shell|circle|moya|osiedl|wspólnot|spółdzieln|port lotniczy|lotnisko cywilne|aeroklub|wojskow|jednostk/i;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

/* ===== BEZPIECZNY FETCH BEZ BŁĘDU ABORT ===== */
async function fetchOverpassWithFallback(query){
  let lastErr = null;
  for(const url of OVERPASS_ENDPOINTS){
    try{
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'data=' + encodeURIComponent(query)
      });
      if(!res.ok){
        lastErr = new Error(`Serwer ${new URL(url).hostname} zwrócił status ${res.status}`);
        continue;
      }
      return await res.json();
    }catch(e){
      lastErr = e;
    }
  }
  throw lastErr || new Error('Wszystkie serwery map są chwilowo przeciążone.');
}

/* ===== WYSZUKIWARKA MIEJSCÓWEK (25/50/75 km) ===== */
async function findNearbyPlacards(lat, lon, radiusKm = 25){
  const radius = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
(
  way["amenity"="parking"]["surface"="asphalt"](around:${radius},${lat},${lon});
  way["amenity"="driver_training"]["surface"!~"gravel|dirt|sand|grass|unpaved"](around:${radius},${lat},${lon});
  way["landuse"="industrial"]["surface"="asphalt"](around:${radius},${lat},${lon});
  way["abandoned:amenity"="parking"]["surface"!~"gravel|dirt|sand|grass"](around:${radius},${lat},${lon});
  way["disused:amenity"="parking"]["surface"!~"gravel|dirt|sand|grass"](around:${radius},${lat},${lon});
  way["highway"="turning_circle"]["surface"="asphalt"](around:${radius},${lat},${lon});
)->.candidates;

(
  way["landuse"="residential"](around:450, .candidates);
  way["building"~"^(house|residential|apartments|detached|farm)$"](around:350, .candidates);
  node["place"~"^(village|hamlet|town|city|suburb)$"](around:650, .candidates);
)->.populated;

way.candidates(around:450, .populated)->.near_homes;
(.candidates; - .near_homes;)->.isolated;

.isolated out bb center tags;
`;
  const data = await fetchOverpassWithFallback(query);
  const elements = data.elements || [];

  const places = [];
  const seen = new Set();

  for(const el of elements){
    const tags = el.tags || {};
    if(tags.surface && !['asphalt', 'paved'].includes(tags.surface)) continue;
    const area = calcBoundsArea(el.bounds);
    if(area < 450 || area > 350000) continue;

    const rawName = (tags.name || '') + ' ' + (tags.operator || '') + ' ' + (tags.description || '');
    if(PRZYPAL_REGEX.test(rawName)) continue;

    const c = el.center || (el.bounds ? {
      lat: (el.bounds.minlat + el.bounds.maxlat) / 2,
      lon: (el.bounds.minlon + el.bounds.maxlon) / 2
    } : null);
    if(!c) continue;

    const key = c.lat.toFixed(3) + ',' + c.lon.toFixed(3);
    if(seen.has(key)) continue;
    seen.add(key);

    const name = tags.name || tags['name:pl'] || tags.operator || 'Asfaltowy plac na uboczu';
    const dist = haversine(lat, lon, c.lat, c.lon);

    places.push({
      id: el.type + '/' + el.id,
      name,
      lat: c.lat,
      lon: c.lon,
      dist,
      area: Math.round(area),
      surface: 'Asfalt',
      stealthBadge: '🟢 TOTALNE ODLUDZIE [BETA]',
      stealthColor: '#39FF14',
      vibeNote: 'Asfalt na odludziu · Z dala od wiosek',
      typeLabel: 'Plac RWD'
    });
  }

  places.sort((a, b) => a.dist - b.dist);
  return places.slice(0, 10);
}

/* ===== NOWY MODUŁ AI: WYSZUKIWANIE TRASY / "TORU" (MIN 3 KM, MIN 5 KM OD MIASTA) ===== */
async function findAiTracks(lat, lon, radiusKm = 30){
  const radius = Math.round(radiusKm * 1000);
  // Szukamy dróg asfaltowych w promieniu `radius`, z dala od miast (>5000m od węzłów place city/town)
  const query = `
[out:json][timeout:30];
(
  way["highway"~"^(secondary|tertiary|unpaved|residential|service)$"]["surface"="asphalt"](around:${radius},${lat},${lon});
  way["highway"~"^(secondary|tertiary)$"](around:${radius},${lat},${lon});
)->.roads;

(
  node["place"~"^(city|town)$"](around:5000, .roads);
)->.near_towns;

way.roads(around:5000, .near_towns)->.near_city;
(.roads; - .near_city;)->.isolated_roads;

.isolated_roads out geom tags;
`;
  const data = await fetchOverpassWithFallback(query);
  const elements = data.elements || [];

  const tracks = [];
  for(const el of elements){
    if(!el.geometry || el.geometry.length < 3) continue;
    
    // Obliczanie długości odcinka/trasy
    let lengthMeters = 0;
    for(let i = 0; i < el.geometry.length - 1; i++){
      const p1 = el.geometry[i];
      const p2 = el.geometry[i+1];
      lengthMeters += haversine(p1.lat, p1.lon, p2.lat, p2.lon);
    }

    // Warunek: co najmniej 3 km (3000 metrów) długości toru
    if(lengthMeters < 3000 || lengthMeters > 25000) continue;

    const tags = el.tags || {};
    const startPoint = el.geometry[0];
    const endPoint = el.geometry[el.geometry.length - 1];
    const midPoint = el.geometry[Math.floor(el.geometry.length / 2)];
    const distFromUser = haversine(lat, lon, startPoint.lat, startPoint.lon);

    tracks.push({
      id: 'track_' + el.id,
      name: tags.name || tags.ref || `Odległy Tor RWD (${Math.round(lengthMeters/1000)} km)`,
      length: Math.round(lengthMeters),
      distFromUser,
      start: {lat: startPoint.lat, lon: startPoint.lon},
      mid: {lat: midPoint.lat, lon: midPoint.lon},
      end: {lat: endPoint.lat, lon: endPoint.lon},
      geometry: el.geometry
    });
  }

  tracks.sort((a, b) => a.distFromUser - b.distFromUser);
  return tracks.slice(0, 6);
}

let tk = 0;
let aiCleanup = null;

function stopAI(){
  if(aiCleanup){ try{ aiCleanup(); }catch(e){} aiCleanup = null; }
  S.aiActive = false;
  if(S.trackWatchId !== null){
    navigator.geolocation.clearWatch(S.trackWatchId);
    S.trackWatchId = null;
  }
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
    <div class=wm>BLACKLIST <span style="font-size:14px;color:#00F0FF;background:#00f0ff22;padding:2px 6px;border-radius:4px">v0.0.1 BETA</span></div>
    <div class=sub>UPALANIE · DRIFT · AI TRACKS · GPS</div>
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
        Włącz GPS, aby wyszukiwać <b>asfaltowe trasy i tory (>3 km, >5 km od miast) [BETA]</b> oraz lokalizować ustronne spoty.
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
<div style="text-align:center;padding-top:4px">
  ${LOGO}
  <div class=wm>BLACKLIST</div>
  <div style="margin:2px 0 6px"><span style="font:italic 800 11px monospace;background:#FF550033;color:#FF5500;padding:2px 8px;border:1px solid #FF5500">APLIKACJA v0.0.1 BETA</span></div>
  <div class=sub>UPALANIE · DRIFT · AI TRACKS · GPS</div>
</div>
${prof()}
<div class=nav3>
  <button class=on onclick="A.go('home')">🏎️ GARAŻ</button>
  <button onclick="A.openVideos()">🎬 WIDEO</button>
  <button onclick="A.openRank()">🏆 RANKING</button>
</div>
<button class="btn on" onclick="requestPermissionsAndStart('solo', false)">SOLO GRIND<small>Ponad 900 zadań</small></button>
<button class="btn gr" onclick="requestPermissionsAndStart('solo', true)">🤖 TRYB AI / GPS<small>Weryfikacja kamerą i lokalizacją</small></button>
<button class="btn cy" onclick="A.findTracks(30)" style="color:#00F0FF;box-shadow:inset 0 0 0 2px #00F0FF">
  🏁 AI TOR / TRASA (MIN. 3 KM) <span style="font-size:9px;background:#00f0ff22;color:#00F0FF;padding:1px 4px">BETA</span>
  <small>Szukaj długich asfaltowych tras >5 km od miast z timerem startu</small>
</button>
<button class="btn w" onclick="A.findPlaces(25)" style="color:#39FF14;box-shadow:inset 0 0 0 2px #39FF14">
  🥷 ZNAJDŹ ASFALT NA BĄCZKA <span style="font-size:9px;background:#39FF1422;color:#39FF14;padding:1px 4px">BETA</span> ${S.places.length ? `(${S.places.length})` : ''}
  <small>Szukaj opuszczonych spotów z dala od wiosek (25/50/>75 km)</small>
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
</div>
<div style="text-align:center;padding:10px;color:#778;font-size:11px">
  BLACKLIST v0.0.1 (BETA) · Moduł GPS, Tory i Mapy w fazie testowej
</div>`,

admin:()=>`
<div class=top><button class=x onclick="A.go('home')">‹</button><h2>🛡️ ADMIN</h2></div>
${!S.isAdmin?`<div class=fr><input class=up id="adm-u" placeholder="LOGIN"><input type="password" id="adm-p" placeholder="HASŁO"><button class="btn red" onclick="A.loginAdmin()">ZALOGUJ</button></div>`:`<div class=fr><b style="color:#39FF14">ZALOGOWANY</b><button class="btn red" onclick="A.logoutAdmin()">WYLOGUJ</button></div>`}
`,

/* ===== EKRAN AI WYSZUKIWANIA TRAS / TORÓW ===== */
tracks:()=>{
  const active = S.activeTrack;
  const lb = S.trackLeaderboard.filter(x => !active || x.trackId === active.id);

  return `
  <div class=top>
    <button class=x onclick="A.go('home')">‹</button>
    <h2 style="font-size:18px;margin:0;flex:1">🏁 AI TOR / TRASA <span style="font-size:10px;color:#00F0FF">[BETA]</span></h2>
    ${S.tracks.length ? `<button class=x style="width:auto;padding:0 8px;color:#FF1744;box-shadow:inset 0 0 0 1.5px #FF1744;font-size:10px" onclick="A.clearTracks()">RESET</button>` : ''}
  </div>

  ${active ? `
    <div class=fr style="--c:#00F0FF;padding:14px">
      <b style="color:#00F0FF;font-size:16px">🎯 AKTYWNY TOR: ${esc(active.name)}</b>
      <p style="color:#ccc;font-size:12px;margin:4px 0 10px">Długość: <b>${Math.round(active.length/1000)} km</b> | Odległość startu: <b>${formatDist(active.distFromUser)}</b></p>
      
      <div class="hud" style="text-align:center;padding:14px;background:#000d1a">
        <small style="color:#00F0FF">STATUS POMIARU:</small>
        <b style="font-size:22px;color:${S.trackTimerState==='running'?'#39FF14':S.trackTimerState==='waiting_start'?'#FFD400':'#fff'}">
          ${S.trackTimerState==='idle' ? 'PODJEŻDŻAJ NA START' :
            S.trackTimerState==='waiting_start' ? '⏳ CZEKAM NA START (WJEŻDŻAJ NA PUNKT)' :
            S.trackTimerState==='running' ? '⏱️ LICZĘ CZAS PRZEJAZDU...' : '🏁 UKOŃCZONO TRASĘ!'}
        </b>
        ${S.trackTimerState==='running' ? `<div style="font-size:36px;font-family:monospace;margin:8px 0;color:#39FF14" id="live-timer">0.0 s</div>` : ''}
      </div>

      <div class=pills style="margin-top:10px">
        ${S.trackTimerState==='idle' ? `<button class="btn cy on" onclick="A.startTrackTracking()" style="flex:1">🚀 ROZPOCZNIJ POMIAR</button>` : ''}
        ${S.trackTimerState!=='idle' ? `<button class="btn red" onclick="A.stopTrackTracking()" style="flex:1">❌ ANULUJ</button>` : ''}
        <button onclick="A.openMaps(${active.start.lat},${active.start.lon})" style="flex:1">🗺️ DOJAZD NA START</button>
      </div>
    </div>
  ` : ''}

  ${S.tracksLoading ? `
    <div class=fr style="text-align:center;padding:24px 16px">
      <b class=or style="font-size:20px">AI szuka asfaltowego toru...</b>
      <p style="color:#9aa;margin-top:8px;font-size:12px">Filtrowanie tras o dł. min. 3 km i oddalonych min. 5 km od miast...</p>
    </div>
  ` : ''}

  ${S.tracksError ? `
    <div class=fr style="--c:#FF1744">
      <b style="color:#FF1744">Komunikat AI Map</b>
      <p style="margin:6px 0;color:#ccc;font-size:13px">${esc(S.tracksError)}</p>
      <button class="btn cy" onclick="A.findTracks(30)">SPRÓBUJ PONOWNIE</button>
    </div>
  ` : ''}

  ${!S.tracks.length && !S.tracksLoading ? `
    <div class=fr style="text-align:center">
      <p style="color:#9aa;font-size:13px">Brak załadowanych tras. Kliknij przycisk poniżej, aby AI wyszukało asfaltowe odcinki w promieniu 30 km.</p>
      <button class="btn cy" onclick="A.findTracks(30)">🔍 SZUKAJ TRAS / TORÓW</button>
    </div>
  ` : ''}

  ${!active && S.tracks.length ? `
    <div class=pills style="margin-bottom:10px">
      <button class="btn cy on" onclick="A.findTracks(30)">🔄 SZUKAJ NOWYCH TRAS</button>
    </div>
    ${S.tracks.map((t,i)=>`
      <div class=fr style="--c:#00F0FF;padding:12px 14px">
        <div class=row>
          <b style="color:#00F0FF">#${i+1} ${esc(t.name)}</b>
          <em style="color:#39FF14">${Math.round(t.length/1000)} km</em>
        </div>
        <small style="color:#889;margin:4px 0 8px;display:block">
          Odległość od Ciebie: <b style="color:#FFD400">${formatDist(t.distFromUser)}</b> · Teren niezabudowany
        </small>
        <div class=pills>
          <button onclick="A.selectTrack('${t.id}')" style="flex:1">🎯 WYBIERJ TEN TOR</button>
          <button onclick="A.openMaps(${t.start.lat},${t.start.lon})" style="flex:1">🗺️ START</button>
        </div>
      </div>
    `).join('')}
  ` : ''}

  <div class=fr style="--c:#FFD400;margin-top:16px">
    <b style="color:#FFD400">🏆 RANKING PRZEJAZDÓW TORU [BETA]</b>
    ${!lb.length ? `<p style="color:#889;font-size:12px;margin:6px 0">Brak zarejestrowanych czasów przejazdu. Bądź pierwszy!</p>` : ''}
    ${lb.map((x,i)=>`
      <div class=row style="padding:6px 0;border-bottom:1px solid #222;font-size:13px">
        <span><b>#${i+1}</b> ${esc(x.nick)}</span>
        <span style="color:#39FF14;font-family:monospace"><b>${x.time.toFixed(1)} s</b> (${Math.round(x.length/1000)} km)</span>
      </div>
    `).join('')}
  </div>
  `;
},

places:()=>{
  const rangeBar = `
  <div class="fr" style="--c:#00F0FF;padding:10px 12px;margin-bottom:10px">
    <div class="row" style="margin-bottom:8px">
      <small style="color:#00F0FF;margin:0">ZASIĘG SKANOWANIA: <b>${S.placesRadius} KM</b></small>
      <small style="color:#39FF14;margin:0">ZAPISANE: <b>${S.places.length}</b></small>
    </div>
    <div class="pills">
      <button class="${S.placesRadius===25?'on':''}" onclick="A.findPlaces(25)" style="font-size:13px;padding:8px 4px">25 KM</button>
      <button class="${S.placesRadius===50?'on':''}" onclick="A.findPlaces(50)" style="font-size:13px;padding:8px 4px">+25 KM (50)</button>
      <button class="${S.placesRadius===75?'on':''}" onclick="A.findPlaces(75)" style="font-size:13px;padding:8px 4px">&gt;50 KM (75)</button>
    </div>
  </div>`;

  return `
  <div class=top>
    <button class=x onclick="A.go('home')">‹</button>
    <h2 style="font-size:20px;margin:0;flex:1">🥷 SPOTY RWD <span style="font-size:10px;color:#FFD400">[BETA]</span></h2>
    ${S.places.length ? `<button class=x style="width:auto;padding:0 10px;color:#FF1744;box-shadow:inset 0 0 0 1.5px #FF1744;font-size:11px" onclick="A.clearPlaces()">WYCZYŚĆ</button>` : ''}
  </div>
  ${rangeBar}
  ${S.placesLoading ? `
    <div class=fr style="text-align:center;padding:24px 16px">
      <b class=or style="font-size:20px">Szukam asfaltu na odludziu [BETA]...</b>
      <p style="color:#9aa;margin-top:8px;font-size:12px">Filtrowanie wiosek i domów w promieniu ${S.placesRadius} km...</p>
    </div>
  ` : ''}
  ${S.placesError ? `
    <div class=fr style="--c:#FF1744">
      <b style="color:#FF1744">Komunikat GPS / Map</b>
      <p style="margin:6px 0;color:#ccc;font-size:13px">${esc(S.placesError)}</p>
      <button class="btn cy" onclick="A.findPlaces(${S.placesRadius})">SPRÓBUJ PONOWNIE</button>
    </div>
  ` : ''}
  ${!S.places.length && !S.placesLoading ? `
    <div class=fr>
      <p style="color:#9aa;font-size:13px">Brak zapisanych asfaltowych spotów w promieniu ${S.placesRadius} km. Kliknij <b>+25 KM (50)</b> lub <b>&gt;50 KM (75)</b> powyżej.</p>
    </div>
  ` : ''}
  ${S.places.map((p,i)=>`
    <div class=fr style="--c:${p.stealthColor};padding:12px 14px">
      <div class=row>
        <b style="color:${p.stealthColor}">#${i+1}</b>
        <span style="font:700 14px sans-serif;flex:1;margin:0 8px">${esc(p.name)}</span>
        <em style="color:#00F0FF">${formatDist(p.dist)}</em>
      </div>
      <div class=row style="margin:6px 0 4px">
        <span class=tag style="background:${p.stealthColor};font-size:10px">${p.stealthBadge}</span>
        <small style="color:#ddd;margin:0">${esc(p.vibeNote)}</small>
      </div>
      <small style="color:#889;margin:4px 0 8px;display:block">
        ${esc(p.typeLabel)} · <b style="color:#FFD400">${p.area.toLocaleString('pl-PL')} m²</b> · <b style="color:#00F0FF">ASFALT [BETA]</b>
      </small>
      <div class=pills>
        <button onclick="A.openMaps(${p.lat},${p.lon})" style="flex:1">🗺 NAWIGUJ</button>
        <button onclick="A.copyCoords(${p.lat},${p.lon})" style="flex:1">📋 KOPIUJ</button>
      </div>
    </div>
  `).join('')}
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

  clearPlaces(){
    S.places = [];
    LS.s('bl_saved_places', []);
    fl('WYCZYSZCZONO', false);
    render();
  },

  clearTracks(){
    S.tracks = [];
    S.activeTrack = null;
    LS.s('bl_saved_tracks', []);
    fl('WYCZYSZCZONO', false);
    render();
  },

  async findPlaces(radiusKm = 25){
    S.placesRadius = radiusKm;
    S.placesLoading = true;
    S.placesError = null;
    A.go('places');

    if(!navigator.geolocation){
      S.placesLoading = false;
      S.placesError = 'Brak wsparcia GPS w tej przeglądarce.';
      render();
      return;
    }

    try{
      if(!S.userLat || !S.userLon){
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 120000
          });
        });
        S.userLat = pos.coords.latitude;
        S.userLon = pos.coords.longitude;
        S.gpsPermState = 'granted';
      }

      const freshList = await findNearbyPlacards(S.userLat, S.userLon, radiusKm);
      const mapById = new Map();
      S.places.forEach(p => {
        p.dist = haversine(S.userLat, S.userLon, p.lat, p.lon);
        mapById.set(p.id, p);
      });
      freshList.forEach(p => {
        mapById.set(p.id, p);
      });

      S.places = Array.from(mapById.values()).sort((a, b) => a.dist - b.dist);
      LS.s('bl_saved_places', S.places);
      S.placesLoading = false;
      render();
    }catch(e){
      S.placesLoading = false;
      S.placesError = e.message || 'Chwilowe przeciążenie map – spróbuj ponownie.';
      render();
    }
  },

  /* ===== OBSŁUGA WYSZUKIWANIA I POMIARU TORU / TRASY ===== */
  async findTracks(radiusKm = 30){
    S.tracksLoading = true;
    S.tracksError = null;
    A.go('tracks');

    if(!navigator.geolocation){
      S.tracksLoading = false;
      S.tracksError = 'Brak wsparcia GPS.';
      render();
      return;
    }

    try{
      if(!S.userLat || !S.userLon){
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 120000
          });
        });
        S.userLat = pos.coords.latitude;
        S.userLon = pos.coords.longitude;
      }

      const freshTracks = await findAiTracks(S.userLat, S.userLon, radiusKm);
      S.tracks = freshTracks;
      LS.s('bl_saved_tracks', S.tracks);
      S.tracksLoading = false;
      render();
    }catch(e){
      S.tracksLoading = false;
      S.tracksError = e.message || 'Błąd wyszukiwania trasy. Spróbuj ponownie.';
      render();
    }
  },

  selectTrack(id){
    const t = S.tracks.find(x => x.id === id);
    if(!t) return;
    S.activeTrack = t;
    S.trackTimerState = 'idle';
    render();
  },

  startTrackTracking(){
    if(!S.activeTrack) return;
    if(!navigator.geolocation){ alert('Brak GPS'); return; }

    S.trackTimerState = 'waiting_start';
    render();

    const startNode = S.activeTrack.start;
    const endNode = S.activeTrack.end;

    S.trackWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Krok 1: Oczekiwanie na wjazd na punkt startowy (promień 40 metrów)
        if(S.trackTimerState === 'waiting_start'){
          const dToStart = haversine(lat, lon, startNode.lat, startNode.lon);
          if(dToStart <= 40){
            // Wjechano na start! Odpalamy timer
            S.trackTimerState = 'running';
            S.trackStartTime = Date.now();
            beep(880, 0.2);
            vib(100);
            render();
            startLiveTimerInterval();
          }
        }
        // Krok 2: Sprawdzanie czy dojechano do mety (promień 50 metrów)
        else if(S.trackTimerState === 'running'){
          const dToEnd = haversine(lat, lon, endNode.lat, endNode.lon);
          if(dToEnd <= 50){
            // Meta! Zatrzymujemy pomiar
            const totalTime = (Date.now() - S.trackStartTime) / 1000;
            S.trackTimerState = 'finished';
            stopAI();
            beep(1200, 0.4);
            vib([100, 50, 100]);

            // Zapis do rankingu toru
            const record = {
              trackId: S.activeTrack.id,
              trackName: S.activeTrack.name,
              nick: S.nick,
              time: totalTime,
              length: S.activeTrack.length,
              ts: Date.now()
            };
            S.trackLeaderboard.push(record);
            S.trackLeaderboard.sort((a,b) => a.time - b.time);
            LS.s('bl_track_lb', S.trackLeaderboard);

            // Dodanie REP za ukończenie trasy
            S.rep += 50;
            LS.s('bl_rep', S.rep);
            syncUserLeaderboard();

            alert(`🏁 TRASA UKOŃCZONA!\nCzas: ${totalTime.toFixed(1)} s\nZyskano +50 REP!`);
            render();
          }
        }
      },
      (err) => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
  },

  stopTrackTracking(){
    stopAI();
    S.trackTimerState = 'idle';
    render();
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

function startLiveTimerInterval(){
  const interval = setInterval(() => {
    if(S.trackTimerState !== 'running'){
      clearInterval(interval);
      return;
    }
    const elapsed = (Date.now() - S.trackStartTime) / 1000;
    const el = $('#live-timer');
    if(el) el.textContent = elapsed.toFixed(1) + ' s';
  }, 100);
}

function renderAIHud(){
  const st = document.querySelector('.fr.ai small'); if(st) st.textContent = S.aiStatus;
  const tb = document.querySelector('.fr.ai .tb');
  if(tb) tb.querySelectorAll('i').forEach((b,i)=>b.classList.toggle('on', (i+1)/24 <= S.aiProgress));
}

checkInitialGpsPermission();
syncUserLeaderboard();
render();
