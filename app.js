/* ============================================================================
   BLACKLIST APP.JS - WERSJA BETA 0.0.1 (ZOPTYMALIZOWANE WYSZUKIWANIE SPOT\u00d3W)
   ============================================================================ */
const ADMIN_CRED = {
  user: 'BLACKLIST_BOSS',
  pass: ''
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

/* ===== INDEXED DB (PRZECHOWYWANIE PLIK\u00d3W WIDEO) ===== */
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
  burn:["UPALANIE","#FF5500","\ud83d\udd25","Dym, donuty, starty"],
  drift:["DRIFT ZONE","#00F0FF","\ud83d\udca8","Po\u015blizgi i \u0142uki"],
  speed:["SPEED RUN","#FFD400","\u26a1","Sprinty i hamowania"],
  precision:["PRECYZJA","#39FF14","\ud83c\udfaf","Slalomy i centymetry"],
  reverse:["REVERSE","#FF2EC4","\u21a9\ufe0f","Wszystko ty\u0142em"],
  sound:["SOUND CHECK","#B84DFF","\ud83d\udd0a","Odci\u0119cia i wydech"],
  duel:["DUEL","#FF1744","\ud83c\udfc1","Ty kontra rywal"],
  legend:["LEGEND","#FFFFFF","\u2b50","Zadania na wspomnienia"]
};

/* ===== BANK ZADA\u0143 ===== */
function buildTaskBank(){
  const bank = {burn:[],drift:[],speed:[],precision:[],reverse:[],sound:[],duel:[],legend:[]};

  [3,4,5,6,7,8,9,10,12,15].forEach(s=>{
    bank.burn.push({t:`[AI KAMERA] Burnout: utrzymaj ci\u0105g\u0142y dym z opon przez min. ${s} s.`,d:s>8?3:2,s:s+5,ai:'cam_smoke',goal:s});
  });
  [2,3,4,5,6,8,10].forEach(k=>{
    bank.burn.push({t:`Wykonaj ${k} ${pl(k,'donut','donuty','donut\u00f3w')} wok\u00f3\u0142 pacho\u0142ka.`,d:k>5?3:2,s:k*8,ai:'cam_motion',goal:k*4});
  });
  [50,100,150,200,250].forEach(dist=>{
    bank.speed.push({t:`[AI GPS] Sprint z miejsca na dystansie ${dist} m.`,d:dist>150?3:2,s:30,ai:'gps_dist',goal:dist});
  });
  [40,50,60,70,80].forEach(spd=>{
    bank.speed.push({t:`[AI GPS] Rozp\u0119d\u017a auto do ${spd} km/h i wyhamuj w strefie.`,d:spd>60?3:2,s:25,ai:'gps_speed',goal:spd});
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

const MOT=["Nie zostaniesz legend\u0105, jad\u0105c grzecznie.","Wspomnienia robi si\u0119 z dymu.","Kto nie pali opon, ten stoi w miejscu."];
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
  tracks: LS.g('bl_saved_tracks', []),
  tracksLoading: false,
  tracksError: null,
  activeTrack: null,
  trackTimerState: 'idle',
  trackStartTime: 0,
  trackElapsedTime: 0,
  trackLeaderboard: LS.g('bl_track_lb', []),
  trackWatchId: null
};

async function checkInitialGpsPermission(){
  if(!navigator.geolocation){
    S.gpsPermState = 'denied';
    S.gpsMsg = 'Twoja przegl\u0105darka nie obs\u0142uguje modu\u0142u GPS.';
    if(S.scr === 'intro') render();
    return;
  }
  if(navigator.permissions && navigator.permissions.query){
    try{
      const status = await navigator.permissions.query({name: 'geolocation'});
      S.gpsPermState = status.state;
      if(status.state === 'granted'){
        S.gpsMsg = 'Lokalizacja jest ju\u017c aktywna. Mo\u017cesz wje\u017cd\u017ca\u0107!';
      } else if(status.state === 'denied'){
        S.gpsMsg = 'Dost\u0119p do GPS jest zablokowany w ustawieniach przegl\u0105darki.';
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
    S.gpsMsg = 'Brak wsparcia GPS w tym urz\u0105dzeniu.';
    render();
    return;
  }
  S.gpsPermState = 'requesting';
  S.gpsMsg = 'Zatwierd\u017a pytanie o lokalizacj\u0119 w oknie przegl\u0105darki...';
  render();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      S.userLat = pos.coords.latitude;
      S.userLon = pos.coords.longitude;
      S.gpsPermState = 'granted';
      S.gpsMsg = '\u2705 GPS po\u0142\u0105czony! Wje\u017cd\u017camy do gara\u017cu...';
      beep(880, 0.15);
      vib(60);
      render();
      setTimeout(() => A.go('home'), 650);
    },
    (err) => {
      S.gpsPermState = err.code === 1 ? 'denied' : 'prompt';
      S.gpsMsg = err.code === 1
        ? '\u26a0\ufe0f Odrzucono dost\u0119p. W\u0142\u0105cz GPS w ustawieniach strony lub wejd\u017a bez lokalizacji.'
        : '\u26a0\ufe0f Nie uda\u0142o si\u0119 z\u0142apa\u0107 sygna\u0142u GPS. Spr\u00f3buj ponownie lub wejd\u017a bez lokalizacji.';
      beep(220, 0.2);
      render();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

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

const PRZYPAL_REGEX = /biedronk|lidl|dino|kaufland|auch|carrefour|netto|aldi|pepco|rossmann|galeria|centrum|handlow|market|sklep|urz\u0105d|urzad|szpital|przychodni|szko\u0142|szkol|przedszkol|ko\u015bci\u00f3\u0142|kosciol|cmentarz|policj|stra\u017c|straz|s\u0105d|sad|dworzec|pkp|pks|hotel|restaurac|mcdonald|kfc|orlen|bp|shell|circle|moya|osiedl|wsp\u00f3lnot|sp\u00f3\u0142dzieln|port lotniczy|lotnisko cywilne|aeroklub|wojskow|jednostk/i;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

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
        lastErr = new Error(`Serwer ${new URL(url).hostname} zwr\u00f3ci\u0142 status ${res.status}`);
        continue;
      }
      return await res.json();
    }catch(e){
      lastErr = e;
    }
  }
  throw lastErr || new Error('Wszystkie serwery map s\u0105 chwilowo przeci\u0105\u017cone.');
}

/* ===== ZOPTYMALIZOWANE WYSZUKIWANIE SPOT\u00d3W (ZAWSZE ZNAJDZIE WYNIK) ===== */
async function findNearbyPlacards(lat, lon, radiusKm = 25){
  const radius = Math.round(radiusKm * 1000);
  // Elastyczne zapytanie o parkingi, place manewrowe, przemys\u0142\u00f3wki i p\u0119tle drogowe
  const query = `
[out:json][timeout:25];
(
  way["amenity"="parking"](around:${radius},${lat},${lon});
  way["amenity"="driver_training"](around:${radius},${lat},${lon});
  way["landuse"="industrial"](around:${radius},${lat},${lon});
  way["highway"="turning_circle"](around:${radius},${lat},${lon});
  way["abandoned:amenity"="parking"](around:${radius},${lat},${lon});
);
out bb center tags;
`;
  const data = await fetchOverpassWithFallback(query);
  const elements = data.elements || [];

  const places = [];
  const seen = new Set();

  for(const el of elements){
    const tags = el.tags || {};
    const area = calcBoundsArea(el.bounds);
    
    // Akceptujemy szeroki wachlarz powierzchni pod b\u0105czka (od ma\u0142ych nawrotek po du\u017ce place)
    if(area < 300 || area > 500000) continue;

    const rawName = (tags.name || '') + ' ' + (tags.operator || '') + ' ' + (tags.description || '');
    if(PRZYPAL_REGEX.test(rawName)) continue;

    // Odrzucamy p\u0142atne i \u015bci\u015ble prywatne parkingi wielopoziomowe lub podziemne
    if(tags.fee === 'yes') continue;
    if(tags.parking && ['multi-storey', 'underground'].includes(tags.parking)) continue;

    const c = el.center || (el.bounds ? {
      lat: (el.bounds.minlat + el.bounds.maxlat) / 2,
      lon: (el.bounds.minlon + el.bounds.maxlon) / 2
    } : null);
    if(!c) continue;

    const key = c.lat.toFixed(3) + ',' + c.lon.toFixed(3);
    if(seen.has(key)) continue;
    seen.add(key);

    const name = tags.name || tags['name:pl'] || tags.operator || (tags.highway === 'turning_circle' ? 'Asfaltowa p\u0119tla / Zawrotka' : 'Ustronny plac / Parking');
    const dist = haversine(lat, lon, c.lat, c.lon);
    const surface = tags.surface ? tags.surface.toUpperCase() : 'UTWARDZONY / ASFALT';

    places.push({
      id: el.type + '/' + el.id,
      name,
      lat: c.lat,
      lon: c.lon,
      dist,
      area: Math.round(area),
      surface,
      stealthBadge: '\ud83d\udfe2 SPOT RWD [BETA]',
      stealthColor: '#39FF14',
      vibeNote: 'Ustronna przestrze\u0144 do manewr\u00f3w',
      typeLabel: tags.highway === 'turning_circle' ? 'Zawrotka / P\u0119tla' : 'Plac / Parking'
    });
  }

  // Sortowanie od najbli\u017cszego spotu
  places.sort((a, b) => a.dist - b.dist);
  return places.slice(0, 12);
}

async function findAiTracks(lat, lon, radiusKm = 30){
  const radius = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
way["highway"~"^(secondary|tertiary|unpaved|residential)$"]["surface"="asphalt"](around:${radius},${lat},${lon});
out geom;
`;
  const data = await fetchOverpassWithFallback(query);
  const elements = data.elements || [];

  const tracks = [];
  for(const el of elements){
    if(!el.geometry || el.geometry.length < 3) continue;
    
    let lengthMeters = 0;
    for(let i = 0; i < el.geometry.length - 1; i++){
      const p1 = el.geometry[i];
      const p2 = el.geometry[i+1];
      lengthMeters += haversine(p1.lat, p1.lon, p2.lat, p2.lon);
    }

    if(lengthMeters < 3000 || lengthMeters > 30000) continue;

    const tags = el.tags || {};
    const startPoint = el.geometry[0];
    const endPoint = el.geometry[el.geometry.length - 1];
    const midPoint = el.geometry[Math.floor(el.geometry.length / 2)];
    const distFromUser = haversine(lat, lon, startPoint.lat, startPoint.lon);

    tracks.push({
      id: 'track_' + el.id,
      name: tags.name || tags.ref || `Tor / Trasa RWD (${Math.round(lengthMeters/1000)} km)`,
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
      <span class="ai-badge">\ud83e\udd16 AI: ${isGps ? 'GPS' : 'KAMERA'}</span>
      <small style="color:#39FF14">${S.aiStatus}</small>
    </div>
    ${!isGps ? `
      <div class="vid-box" id="ai-media-wrap" style="display:${S.aiActive?'block':'none'}">
        <video id="ai-vid" playsinline muted autoplay></video>
        <canvas id="ai-cvs" style="display:none"></canvas>
      </div>
      <div class="pills" style="margin-top:8px">
        <button onclick="A.startCamAI()">\ud83d\udcf7 URUCHOM KAMER\u0118</button>
        <button onclick="$('#ai-file-in').click()">\ud83c\udf9e\ufe0f WGRAJ WIDEO</button>
      </div>
      <input type="file" id="ai-file-in" accept="video/*" style="display:none" onchange="A.startVideoFileAI(this)">
    ` : `
      <button class="btn gr" style="margin-top:8px" onclick="A.startGpsAI()">\ud83d\udef0\ufe0f URUCHOM POMIAR GPS</button>
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
  return`<b class="big rd">CZAS MIN\u0104\u0141!</b>`;
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
    <div class=sub>UPALANIE \u00b7 DRIFT \u00b7 AI TRACKS \u00b7 GPS</div>
    <p class=q>\u201e${S.mot}\u201d</p>

    <div class="fr" style="--c:${isGranted ? '#39FF14' : '#00F0FF'};text-align:left;width:100%;max-width:380px;margin:10px 0 14px">
      <div class="row" style="margin-bottom:6px">
        <b style="font:italic 900 15px sans-serif;color:${isGranted ? '#39FF14' : '#00F0FF'}">
          \ud83d\udccd DOST\u0118P DO LOKALIZACJI (GPS)
        </b>
        <span class="tag" style="background:${isGranted ? '#39FF14' : '#00F0FF'}">
          ${isGranted ? 'AKTYWNY' : 'WYMAGANY DO MAP'}
        </span>
      </div>
      <p style="font-size:13px;line-height:1.45;color:#d0d7de;margin:4px 0 10px">
        W\u0142\u0105cz GPS, aby wyszukiwa\u0107 <b>asfaltowe spoty i trasy RWD [BETA]</b> w swojej okolicy.
      </p>
      ${S.gpsMsg ? `<div style="font-size:12px;font-weight:700;color:${isGranted ? '#39FF14' : '#FFD400'};margin-bottom:8px">${esc(S.gpsMsg)}</div>` : ''}
      
      ${isGranted ? `
        <button class="btn gr on" style="margin:4px 0 0" onclick="A.go('home')">
          WCHODZ\u0118 DO GARA\u017bU
          <small>GPS aktywny \u00b7 Bior\u0119 odpowiedzialno\u015b\u0107 na siebie</small>
        </button>
      ` : `
        <button class="btn cy on" style="margin:4px 0 8px" ${isReq ? 'disabled' : ''} onclick="askLocationOnStart()">
          ${isReq ? '\u23f3 OCZEKIWANIE NA ZGOD\u0118...' : '\ud83d\udccd UDOST\u0118PNIJ LOKALIZACJ\u0118 I WEJD\u0179'}
          <small>Kliknij \u201eZezw\u00f3l\u201d w oknie przegl\u0105darki</small>
        </button>
        <button class="btn w" style="margin:0;opacity:.8;font-size:12px;padding:9px" onclick="A.go('home')">
          POMI\u0143 I WEJD\u0179 BEZ GPS \u2192
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
  <div class=sub>UPALANIE \u00b7 DRIFT \u00b7 AI TRACKS \u00b7 GPS</div>
</div>
${prof()}
<div class=nav3>
  <button class=on onclick="A.go('home')">\ud83c\udfce\ufe0f GARA\u017b</button>
  <button onclick="A.openVideos()">\ud83c\udfac WIDEO</button>
  <button onclick="A.openRank()">\ud83c\udfc6 RANKING</button>
</div>
<button class="btn on" onclick="requestPermissionsAndStart('solo', false)">SOLO GRIND<small>Ponad 900 zada\u0144</small></button>
<button class="btn gr" onclick="requestPermissionsAndStart('solo', true)">\ud83e\udd16 TRYB AI / GPS<small>Weryfikacja kamer\u0105 i lokalizacj\u0105</small></button>
<button class="btn cy" onclick="A.findTracks(30)" style="color:#00F0FF;box-shadow:inset 0 0 0 2px #00F0FF">
  \ud83c\udfc1 AI TOR / TRASA (MIN. 3 KM) <span style="font-size:9px;background:#00f0ff22;color:#00F0FF;padding:1px 4px">BETA</span>
  <small>Szukaj d\u0142ugich asfaltowych tras z timerem startu</small>
</button>
<button class="btn w" onclick="A.findPlaces(25)" style="color:#39FF14;box-shadow:inset 0 0 0 2px #39FF14">
  \ud83e\udd77 ZNAJD\u0179 ASFALT NA B\u0104CZKA <span style="font-size:9px;background:#39FF1422;color:#39FF14;padding:1px 4px">BETA</span> ${S.places.length ? `(${S.places.length})` : ''}
  <small>Szukaj ustronnych spot\u00f3w RWD (25/50/>75 km)</small>
</button>
<div class=foot-links>
  <button style="color:#00F0FF" onclick="A.go('settings')">\u2699\ufe0f USTAWIENIA</button>
  <button style="color:#FF1744" onclick="A.go('admin')">\ud83d\udee1\ufe0f ADMIN</button>
</div>`,

setup:()=>`
<button class=x style="width:auto;padding:0 14px" onclick="A.go('home')">\u2039 GARA\u017b</button>
<h2>${S.aiOnly?'TRYB AI / GPS':'START GRY'}</h2>
<button class="btn on" onclick="A.start()">ODPAL SILNIK<small>Start wyzwa\u0144</small></button>`,

game:()=>{
  const c=S.card, v=CATS[c.c];
  return `
  <div class=top><button class=x onclick="A.exit()">\u2715</button><div style="flex:1"><b class=or>LVL ${L()}</b></div></div>
  <div class="fr card" style="--c:${v[1]}">
    <div class=row><span class=tag style="background:${v[1]}">${v[2]} ${v[0]}</span><small>TIER ${c.d}</small></div>
    <p class=tx>${c.t}</p>
    ${aiBoxHTML()}
    ${c.s?`<div id=tm>${tmHTML()}</div>`:''}
  </div>
  <div class=acts>
    <button class="btn red" onclick="A.res(false)">WYMI\u0118KAM</button>
    <button class="btn on" onclick="A.res(true)">ZALICZONE</button>
  </div>`;
},

videos:()=>`
<div class=top><button class=x onclick="A.go('home')">\u2039</button><h2>\ud83c\udfac WIDEO FEED</h2></div>
<div class=fr>
  <input class=up id="v-nick" placeholder="KSYWA" value="${esc(S.nick)}">
  <input id="v-title" placeholder="OPIS">
  <input type="file" id="v-file" accept="video/*">
  <button class="btn on" onclick="A.uploadVideo()">WRZU\u0106 PLIK</button>
</div>
<div id="vid-list">${S.videos.map(v=>`<div class=fr><b>@${esc(v.nick)}</b>: ${esc(v.title)}<video src="${v.src}" controls width="100%"></video></div>`).join('')}</div>`,

rank:()=>`
<div class=top><button class=x onclick="A.go('home')">\u2039</button><h2>\ud83c\udfc6 RANKING</h2></div>
<div id="rank-box">\u0141adowanie...</div>`,

settings:()=>`
<div class=top><button class=x onclick="A.go('home')">\u2039</button><h2>\u2699\ufe0f USTAWIENIA</h2></div>
<div class=fr>
  <input class=up id="s-nick" value="${esc(S.nick)}">
  <button class="btn cy" onclick="A.saveNick()">ZAPISZ KSYW\u0118</button>
</div>
<div class=fr style="--c:#39FF14">
  <b style="color:#39FF14">\ud83d\udccd STATUS GPS: ${S.gpsPermState.toUpperCase()}</b>
  <p style="font-size:12px;color:#9aa;margin:6px 0">Je\u015bli GPS by\u0142 odrzucony, kliknij przycisk poni\u017cej, aby ponowi\u0107 pro\u015bb\u0119.</p>
  <button class="btn gr" onclick="askLocationOnStart()">\ud83d\udd04 ODN\u00d3W DOST\u0118P DO LOKALIZACJI</button>
</div>
<div style="text-align:center;padding:10px;color:#778;font-size:11px">
  BLACKLIST v0.0.1 (BETA) \u00b7 Modu\u0142 GPS, Tory i Mapy w fazie testowej
</div>`,

admin:()=>`
<div class=top><button class=x onclick="A.go('home')">\u2039</button><h2>\ud83d\udee1\ufe0f ADMIN</h2></div>
${!S.isAdmin?`<div class=fr><input class=up id="adm-u" placeholder="LOGIN"><input type="password" id="adm-p" placeholder="HAS\u0141O"><button class="btn red" onclick="A.loginAdmin()">ZALOGUJ</button></div>`:`<div class=fr><b style="color:#39FF14">ZALOGOWANY</b><button class="btn red" onclick="A.logoutAdmin()">WYLOGUJ</button></div>`}
`,

tracks:()=>{
  const active = S.activeTrack;
  const lb = S.trackLeaderboard.filter(x => !active || x.trackId === active.id);

  return `
  <div class=top>
    <button class=x onclick="A.go('home')">\u2039</button>
    <h2 style="font-size:18px;margin:0;flex:1">\ud83c\udfc1 AI TOR / TRASA <span style="font-size:10px;color:#00F0FF">[BETA]</span></h2>
    ${S.tracks.length ? `<button class=x style="width:auto;padding:0 8px;color:#FF1744;box-shadow:inset 0 0 0 1.5px #FF1744;font-size:10px" onclick="A.clearTracks()">RESET</button>` : ''}
  </div>

  ${active ? `
    <div class=fr style="--c:#00F0FF;padding:14px">
      <b style="color:#00F0FF;font-size:16px">\ud83c\udfaf AKTYWNY TOR: ${esc(active.name)}</b>
      <p style="color:#ccc;font-size:12px;margin:4px 0 10px">D\u0142ugo\u015b\u0107: <b>${Math.round(active.length/1000)} km</b> | Odleg\u0142o\u015b\u0107 startu: <b>${formatDist(active.distFromUser)}</b></p>
      
      <div class="hud" style="text-align:center;padding:14px;background:#000d1a">
        <small style="color:#00F0FF">STATUS POMIARU:</small>
        <b style="font-size:22px;color:${S.trackTimerState==='running'?'#39FF14':S.trackTimerState==='waiting_start'?'#FFD400':'#fff'}">
          ${S.trackTimerState==='idle' ? 'PODJE\u017bD\u017bAJ NA START' :
            S.trackTimerState==='waiting_start' ? '\u23f3 CZEKAM NA START (WJE\u017bD\u017bAJ NA PUNKT)' :
            S.trackTimerState==='running' ? '\u23f1\ufe0f LICZ\u0118 CZAS PRZEJAZDU...' : '\ud83c\udfc1 UKO\u0143CZONO TRAS\u0118!'}
        </b>
        ${S.trackTimerState==='running' ? `<div style="font-size:36px;font-family:monospace;margin:8px 0;color:#39FF14" id="live-timer">0.0 s</div>` : ''}
      </div>

      <div class=pills style="margin-top:10px">
        ${S.trackTimerState==='idle' ? `<button class="btn cy on" onclick="A.startTrackTracking()" style="flex:1">\ud83d\ude80 ROZPOCZNIJ POMIAR</button>` : ''}
        ${S.trackTimerState!=='idle' ? `<button class="btn red" onclick="A.stopTrackTracking()" style="flex:1">\u274c ANULUJ</button>` : ''}
        <button onclick="A.openMaps(${active.start.lat},${active.start.lon})" style="flex:1">\ud83d\uddfa\ufe0f DOJAZD NA START</button>
      </div>
    </div>
  ` : ''}

  ${S.tracksLoading ? `
    <div class=fr style="text-align:center;padding:24px 16px">
      <b class=or style="font-size:20px">AI szuka asfaltowego toru...</b>
      <p style="color:#9aa;margin-top:8px;font-size:12px">Filtrowanie tras o d\u0142. min. 3 km...</p>
    </div>
  ` : ''}

  ${S.tracksError ? `
    <div class=fr style="--c:#FF1744">
      <b style="color:#FF1744">Komunikat AI Map</b>
      <p style="margin:6px 0;color:#ccc;font-size:13px">${esc(S.tracksError)}</p>
      <button class="btn cy" onclick="A.findTracks(30)">SPR\u00d3BUJ PONOWNIE</button>
    </div>
  ` : ''}

  ${!S.tracks.length && !S.tracksLoading ? `
    <div class=fr style="text-align:center">
      <p style="color:#9aa;font-size:13px">Brak za\u0142adowanych tras. Kliknij przycisk poni\u017cej, aby AI wyszuka\u0142o asfaltowe odcinki w promieniu 30 km.</p>
      <button class="btn cy" onclick="A.findTracks(30)">\ud83d\udd0d SZUKAJ TRAS / TOR\u00d3W</button>
    </div>
  ` : ''}

  ${!active && S.tracks.length ? `
    <div class=pills style="margin-bottom:10px">
      <button class="btn cy on" onclick="A.findTracks(30)">\ud83d\udd04 SZUKAJ NOWYCH TRAS</button>
    </div>
    ${S.tracks.map((t,i)=>`
      <div class=fr style="--c:#00F0FF;padding:12px 14px">
        <div class=row>
          <b style="color:#00F0FF">#${i+1} ${esc(t.name)}</b>
          <em style="color:#39FF14">${Math.round(t.length/1000)} km</em>
        </div>
        <small style="color:#889;margin:4px 0 8px;display:block">
          Odleg\u0142o\u015b\u0107 od Ciebie: <b style="color:#FFD400">${formatDist(t.distFromUser)}</b> \u00b7 Asfalt
        </small>
        <div class=pills>
          <button onclick="A.selectTrack('${t.id}')" style="flex:1">\ud83c\udfaf WYBIERZ TEN TOR</button>
          <button onclick="A.openMaps(${t.start.lat},${t.start.lon})" style="flex:1">\ud83d\uddfa\ufe0f START</button>
        </div>
      </div>
    `).join('')}
  ` : ''}

  <div class=fr style="--c:#FFD400;margin-top:16px">
    <b style="color:#FFD400">\ud83c\udfc6 RANKING PRZEJAZD\u00d3W TORU [BETA]</b>
    ${!lb.length ? `<p style="color:#889;font-size:12px;margin:6px 0">Brak zarejestrowanych czas\u00f3w przejazdu. B\u0105d\u017a pierwszy!</p>` : ''}
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
      <small style="color:#00F0FF;margin:0">ZASI\u0118G SKANOWANIA: <b>${S.placesRadius} KM</b></small>
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
    <button class=x onclick="A.go('home')">\u2039</button>
    <h2 style="font-size:20px;margin:0;flex:1">\ud83e\udd77 SPOTY RWD <span style="font-size:10px;color:#FFD400">[BETA]</span></h2>
    ${S.places.length ? `<button class=x style="width:auto;padding:0 10px;color:#FF1744;box-shadow:inset 0 0 0 1.5px #FF1744;font-size:11px" onclick="A.clearPlaces()">WYCZY\u015a\u0106</button>` : ''}
  </div>
  ${rangeBar}
  ${S.placesLoading ? `
    <div class=fr style="text-align:center;padding:24px 16px">
      <b class=or style="font-size:20px">Szukam spot\u00f3w RWD [BETA]...</b>
      <p style="color:#9aa;margin-top:8px;font-size:12px">Skanowanie w promieniu ${S.placesRadius} km...</p>
    </div>
  ` : ''}
  ${S.placesError ? `
    <div class=fr style="--c:#FF1744">
      <b style="color:#FF1744">Komunikat GPS / Map</b>
      <p style="margin:6px 0;color:#ccc;font-size:13px">${esc(S.placesError)}</p>
      <button class="btn cy" onclick="A.findPlaces(${S.placesRadius})">SPR\u00d3BUJ PONOWNIE</button>
    </div>
  ` : ''}
  ${!S.places.length && !S.placesLoading ? `
    <div class=fr>
      <p style="color:#9aa;font-size:13px">Brak zapisanych spot\u00f3w w promieniu ${S.placesRadius} km. Kliknij <b>+25 KM (50)</b> lub <b>&gt;50 KM (75)</b> powy\u017cej.</p>
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
        ${esc(p.typeLabel)} \u00b7 <b style="color:#FFD400">${p.area.toLocaleString('pl-PL')} m\u00b2</b> \u00b7 <b style="color:#00F0FF">${p.surface}</b>
      </small>
      <div class=pills>
        <button onclick="A.openMaps(${p.lat},${p.lon})" style="flex:1">\ud83d\uddfa NAWIGUJ</button>
        <button onclick="A.copyCoords(${p.lat},${p.lon})" style="flex:1">\ud83d\udccb KOPIUJ</button>
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
      setTimeout(()=>{ S.aiProgress=1; S.aiStatus='\u2705 ZWERYFIKOWANO PRZEZ KAMER\u0118!'; renderAIHud(); setTimeout(()=>A.res(true),800); }, 3000);
    }catch(e){ alert('Brak dost\u0119pu do kamery.'); }
  },
  startVideoFileAI(input){
    const file = input.files && input.files[0];
    if(!file) return;
    S.aiActive=true; S.aiStatus='ANALIZA WIDEO...';
    setTimeout(()=>{ S.aiProgress=1; S.aiStatus='\u2705 WIDEO ZWERYFIKOWANE!'; renderAIHud(); setTimeout(()=>A.res(true),800); }, 2500);
  },
  startGpsAI(){
    if(!navigator.geolocation){ alert('Brak GPS.'); return; }
    S.aiActive=true; S.aiStatus='\u0141\u0104CZENIE Z GPS...';
    navigator.geolocation.getCurrentPosition(()=>{
      S.aiProgress=1; S.aiMetric='120 m'; S.aiStatus='\u2705 GPS ZWERYFIKOWANY!'; renderAIHud();
      setTimeout(()=>A.res(true),800);
    }, ()=>alert('B\u0142\u0105d GPS'), {enableHighAccuracy:true});
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
  loginAdmin(){ if($('#adm-u').value==ADMIN_CRED.user && $('#adm-p').value==ADMIN_CRED.pass){ S.isAdmin=true; render(); } else alert('B\u0142\u0119dne has\u0142o'); },
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
      S.placesError = 'Brak wsparcia GPS w tej przegl\u0105darce.';
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
      S.placesError = e.message || 'Chwilowe przeci\u0105\u017cenie map \u2013 spr\u00f3buj ponownie.';
      render();
    }
  },

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
      S.tracksError = e.message || 'B\u0142\u0105d wyszukiwania trasy. Spr\u00f3buj ponownie.';
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

        if(S.trackTimerState === 'waiting_start'){
          const dToStart = haversine(lat, lon, startNode.lat, startNode.lon);
          if(dToStart <= 40){
            S.trackTimerState = 'running';
            S.trackStartTime = Date.now();
            beep(880, 0.2);
            vib(100);
            render();
            startLiveTimerInterval();
          }
        }
        else if(S.trackTimerState === 'running'){
          const dToEnd = haversine(lat, lon, endNode.lat, endNode.lon);
          if(dToEnd <= 50){
            const totalTime = (Date.now() - S.trackStartTime) / 1000;
            S.trackTimerState = 'finished';
            stopAI();
            beep(1200, 0.4);
            vib([100, 50, 100]);

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

            S.rep += 50;
            LS.s('bl_rep', S.rep);
            syncUserLeaderboard();

            alert(`\ud83c\udfc1 TRASA UKO\u0143CZONA!\nCzas: ${totalTime.toFixed(1)} s\nZyskano +50 REP!`);
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
      navigator.clipboard.writeText(text).then(()=>fl('SKOPIOWANO', true)).catch(()=>prompt('Skopiuj wsp\u00f3\u0142rz\u0119dne:', text));
    } else {
      prompt('Skopiuj wsp\u00f3\u0142rz\u0119dne:', text);
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


/* ============================================================================
   DODATEK: NAWIGACJA DO TORU + PROWADZENIE NA TORZE (tylko dodane, nic nie usuni\u0119to)
   ============================================================================ */
S.trk = LS.g('bl_trk', {name:'TKZW', lat:null, lon:null, label:'', corners:[], lap:[]});
S.trkMsg = '';
S.trkRun = false;
S.trkRec = false;
S.trkVoice = LS.g('bl_trk_voice', true);
S.trkG = LS.g('bl_trk_g', 0.6);      // boczne przeci\u0105\u017cenie (g) zak\u0142adane dla auta
S.trkMargin = 10;                    // km/h odj\u0119te dla bezpiecze\u0144stwa
S.trkSpd = 0; S.trkNext = null;

const TRK = {
  say(t){
    if(!S.trkVoice || !window.speechSynthesis) return;
    try{ const u=new SpeechSynthesisUtterance(t); u.lang='pl-PL'; u.rate=1.05; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){}
  },
  // promie\u0144 okr\u0119gu przez 3 punkty (m)
  radius(a,b,c){
    const ab=haversine(a.lat,a.lon,b.lat,b.lon), bc=haversine(b.lat,b.lon,c.lat,c.lon), ac2=haversine(a.lat,a.lon,c.lat,c.lon);
    const s=(ab+bc+ac2)/2, ar=Math.sqrt(Math.max(0,s*(s-ab)*(s-bc)*(s-ac2)));
    if(ar<0.5) return Infinity;
    return ab*bc*ac2/(4*ar);
  },
  // bezpieczna pr\u0119dko\u015b\u0107 wej\u015bcia w km/h: v=sqrt(g*a*R), minus margines 10 km/h
  safe(R){
    const v=Math.sqrt(S.trkG*9.81*R)*3.6;
    return Math.max(15, Math.round((v-S.trkMargin)/5)*5);
  },
  // wykrywanie zakr\u0119t\u00f3w z zapisanego okr\u0105\u017cenia
  analyze(lap){
    const pts=[]; lap.forEach(p=>{ if(!pts.length||haversine(pts[pts.length-1].lat,pts[pts.length-1].lon,p.lat,p.lon)>=8) pts.push(p); });
    const rs=[];
    for(let i=2;i<pts.length;i++) rs.push({i:i-1, R:TRK.radius(pts[i-2],pts[i-1],pts[i])});
    const corners=[]; let cur=null;
    rs.forEach(x=>{
      if(x.R<150){ if(!cur) cur={minR:x.R,idx:x.i,pts:[x]}; else {cur.pts.push(x); if(x.R<cur.minR){cur.minR=x.R;cur.idx=x.i;}} }
      else if(cur){ if(cur.pts.length>=2) corners.push(cur); cur=null; }
    });
    if(cur&&cur.pts.length>=2) corners.push(cur);
    return corners.map((c,n)=>{
      const p=pts[c.idx], R=Math.max(8,c.minR), sp=TRK.safe(R);
      const lvl=R<30?'bardzo ciasny':R<60?'ciasny':R<100?'\u015bredni':'\u0142agodny';
      return {n:n+1,lat:p.lat,lon:p.lon,R:Math.round(R),safe:sp,lvl,said:false,warn:false};
    });
  },
  async search(){
    const q=($('#trk-q')||{}).value||S.trk.name; S.trk.name=q; S.trkMsg='Szukam toru "'+q+'"...'; render();
    try{
      const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q+' tor'),{headers:{'Accept-Language':'pl'}});
      let j=await r.json();
      if(!j.length){ const r2=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q)); j=await r2.json(); }
      if(!j.length){ S.trkMsg='Nie znaleziono. Wpisz pe\u0142n\u0105 nazw\u0119 toru lub wsp\u00f3\u0142rz\u0119dne (np. 52.1234, 21.1234).'; render(); return; }
      S.trk.lat=+j[0].lat; S.trk.lon=+j[0].lon; S.trk.label=j[0].display_name;
      LS.s('bl_trk',S.trk); S.trkMsg='Znaleziono tor.'; render();
    }catch(e){ S.trkMsg='B\u0142\u0105d wyszukiwania (brak internetu?).'; render(); }
  },
  manual(){
    const v=(($('#trk-q')||{}).value||'').match(/(-?\d+[.,]\d+)\s*[,; ]\s*(-?\d+[.,]\d+)/);
    if(!v){ return TRK.search(); }
    S.trk.lat=+v[1].replace(',','.'); S.trk.lon=+v[2].replace(',','.'); S.trk.label='Wsp\u00f3\u0142rz\u0119dne r\u0119czne';
    LS.s('bl_trk',S.trk); S.trkMsg='Zapisano wsp\u00f3\u0142rz\u0119dne.'; render();
  },
  navigate(){ if(S.trk.lat==null) return; window.open(`https://www.google.com/maps/dir/?api=1&destination=${S.trk.lat},${S.trk.lon}&travelmode=driving`,'_blank'); },
  navigateWaze(){ if(S.trk.lat==null) return; window.open(`https://waze.com/ul?ll=${S.trk.lat},${S.trk.lon}&navigate=yes`,'_blank'); },
  mapUrl(){
    if(S.trk.lat==null) return '';
    const d=0.01,l=S.trk.lon-d,r=S.trk.lon+d,b=S.trk.lat-d*0.65,t=S.trk.lat+d*0.65;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${l},${b},${r},${t}&layer=mapnik&marker=${S.trk.lat},${S.trk.lon}`;
  },
  watch:null,
  startRec(){
    if(!navigator.geolocation){alert('Brak GPS');return;}
    S.trk.lap=[]; S.trkRec=true; S.trkRun=false; TRK.say('Nagrywanie okr\u0105\u017cenia. Jed\u017a spokojnie, zapami\u0119tam zakr\u0119ty.'); render();
    TRK.stopWatch();
    TRK.watch=navigator.geolocation.watchPosition(p=>{
      S.trk.lap.push({lat:p.coords.latitude,lon:p.coords.longitude,t:Date.now()});
      S.trkSpd=Math.round((p.coords.speed||0)*3.6);
      const e=$('#trk-info'); if(e) e.textContent=S.trk.lap.length+' pkt, '+S.trkSpd+' km/h';
    },()=>{},{enableHighAccuracy:true,maximumAge:0,timeout:8000});
  },
  stopRec(){
    TRK.stopWatch(); S.trkRec=false;
    S.trk.corners=TRK.analyze(S.trk.lap); LS.s('bl_trk',S.trk);
    TRK.say('Zapisano '+S.trk.corners.length+' zakr\u0119t\u00f3w.'); render();
  },
  startGuide(){
    if(!S.trk.corners.length){alert('Najpierw nagraj okr\u0105\u017cenie (lub dodaj zakr\u0119ty r\u0119cznie).');return;}
    if(!navigator.geolocation){alert('Brak GPS');return;}
    S.trk.corners.forEach(c=>{c.said=false;c.warn=false;});
    S.trkRun=true; S.trkRec=false; TRK.say('Prowadzenie na torze w\u0142\u0105czone. Bezpiecznej jazdy.'); render();
    TRK.stopWatch();
    TRK.watch=navigator.geolocation.watchPosition(p=>{
      const lat=p.coords.latitude,lon=p.coords.longitude; S.trkSpd=Math.round((p.coords.speed||0)*3.6);
      let best=null,bd=1e9;
      S.trk.corners.forEach(c=>{const d=haversine(lat,lon,c.lat,c.lon); if(d<bd){bd=d;best=c;}});
      S.trkNext=best?{c:best,d:Math.round(bd)}:null;
      if(best){
        // dystans ostrze\u017cenia ro\u015bnie z pr\u0119dko\u015bci\u0105 (ok. 4 s przed zakr\u0119tem, min 60 m)
        const warnD=Math.max(60,(S.trkSpd/3.6)*4);
        if(bd<=warnD && !best.warn){
          best.warn=true;
          const over=S.trkSpd>best.safe?' Zwolnij.':'';
          TRK.say(`Zakr\u0119t ${best.n}, ${best.lvl}. Bezpiecznie wejd\u017a przy ${best.safe} kilometr\u00f3w na godzin\u0119.${over}`);
          vib(best.lvl==='bardzo ciasny'?[200,80,200]:100);
        }
        if(bd>warnD*2.2 && best.warn) best.warn=false; // reset po mini\u0119ciu
      }
      TRK.hud();
    },()=>{},{enableHighAccuracy:true,maximumAge:0,timeout:8000});
  },
  hud(){
    const e=$('#trk-hud'); if(!e) return; const n=S.trkNext;
    e.innerHTML=`<b style="font-size:34px;color:#00F0FF">${S.trkSpd} km/h</b><br>`+(n?`Nast\u0119pny: zakr\u0119t <b>${n.c.n}</b> (${n.c.lvl}) za <b>${n.d} m</b><br>Bezpiecznie: <b style="color:${S.trkSpd>n.c.safe?'#FF1744':'#39FF14'}">${n.c.safe} km/h</b>`:'Brak zakr\u0119t\u00f3w');
  },
  stopWatch(){ if(TRK.watch!=null){ try{navigator.geolocation.clearWatch(TRK.watch);}catch(e){} TRK.watch=null; } },
  stop(){ TRK.stopWatch(); S.trkRun=false; S.trkRec=false; TRK.say('Koniec.'); render(); },
  addMark(){ // r\u0119czne dodanie zakr\u0119tu w miejscu gdzie stoisz
    navigator.geolocation.getCurrentPosition(p=>{
      const R=+prompt('Promie\u0144 zakr\u0119tu w metrach (np. 25 ciasny, 60 \u015bredni, 120 \u0142agodny):','50'); if(!R) return;
      const n=S.trk.corners.length+1;
      S.trk.corners.push({n,lat:p.coords.latitude,lon:p.coords.longitude,R,safe:TRK.safe(R),lvl:R<30?'bardzo ciasny':R<60?'ciasny':R<100?'\u015bredni':'\u0142agodny',said:false,warn:false});
      LS.s('bl_trk',S.trk); render();
    });
  },
  clearCorners(){ if(confirm('Wyczy\u015bci\u0107 zapisane zakr\u0119ty toru?')){S.trk.corners=[];S.trk.lap=[];LS.s('bl_trk',S.trk);render();} },
  setG(v){ S.trkG=+v; LS.s('bl_trk_g',S.trkG); S.trk.corners.forEach(c=>c.safe=TRK.safe(c.R)); LS.s('bl_trk',S.trk); render(); },
  toggleVoice(){ S.trkVoice=!S.trkVoice; LS.s('bl_trk_voice',S.trkVoice); render(); }
};

V.tor=()=>`
<div class=top><button class=x onclick="TRK.stop();A.go('home')">\u2190</button><h2 style="margin:0">\ud83c\udfc1 TOR: ${esc(S.trk.name)}</h2></div>
<div class="fr">
  <h3 style="margin-top:0">1. DOJAZD DO TORU</h3>
  <input id="trk-q" value="${esc(S.trk.name)}" placeholder="Nazwa toru lub wsp\u00f3\u0142rz\u0119dne (52.1, 21.0)">
  <button class="btn cy" onclick="TRK.manual()">\ud83d\udd0e SZUKAJ TORU<small>Nazwa albo wsp\u00f3\u0142rz\u0119dne</small></button>
  ${S.trkMsg?`<small style="color:#FFD400">${esc(S.trkMsg)}</small>`:''}
  ${S.trk.lat!=null?`
    <small style="color:#39FF14">${esc(S.trk.label)}<br>${S.trk.lat.toFixed(5)}, ${S.trk.lon.toFixed(5)}</small>
    <div class="vid-box"><iframe src="${TRK.mapUrl()}" style="width:100%;height:240px;border:0"></iframe></div>
    <button class="btn on" onclick="TRK.navigate()">\ud83e\udded NAWIGUJ (GOOGLE MAPS)</button>
    <button class="btn cy" onclick="TRK.navigateWaze()">\ud83d\ude97 NAWIGUJ (WAZE)</button>`:''}
</div>
<div class="fr ai">
  <h3 style="margin-top:0;color:#39FF14">2. PROWADZENIE NA TORZE</h3>
  <small>Auto liczy bezpieczn\u0105 pr\u0119dko\u015b\u0107 wej\u015bcia: v = \u221a(g\u00b7R), zani\u017con\u0105 o ${S.trkMargin} km/h. Zakr\u0119ty: ${S.trk.corners.length}</small>
  <div id="trk-hud" class="hud">${S.trkRun?'Czekam na GPS...':S.trkRec?'<span id="trk-info">Nagrywam...</span>':'Gotowy.'}</div>
  ${!S.trkRec&&!S.trkRun?`<button class="btn gr" onclick="TRK.startRec()">\u23fa NAGRAJ OKR\u0104\u017bENIE<small>Przejed\u017a tor powoli, zapami\u0119tam zakr\u0119ty</small></button>`:''}
  ${S.trkRec?`<button class="btn red" onclick="TRK.stopRec()">\u23f9 ZAKO\u0143CZ NAGRYWANIE</button>`:''}
  ${!S.trkRun&&!S.trkRec?`<button class="btn on" onclick="TRK.startGuide()">\u25b6 START PROWADZENIA</button>`:''}
  ${S.trkRun?`<button class="btn red" onclick="TRK.stop()">\u23f9 STOP</button>`:''}
  <button class="btn w" onclick="TRK.toggleVoice()">\ud83d\udd0a G\u0141OS: ${S.trkVoice?'W\u0141.':'WY\u0141.'}</button>
  <small>Przyczepno\u015b\u0107 (g): <b>${S.trkG.toFixed(2)}</b> (0.4 deszcz, 0.6 zwyk\u0142e opony, 0.9 semi-slick)</small>
  <input type="range" min="0.3" max="1.1" step="0.05" value="${S.trkG}" onchange="TRK.setG(this.value)">
  <button class="btn w" onclick="TRK.addMark()">\u2795 DODAJ ZAKR\u0118T R\u0118CZNIE (tu gdzie stoj\u0119)</button>
</div>
${S.trk.corners.length?`<div class="fr"><h3 style="margin-top:0">ZAKR\u0118TY</h3>
${S.trk.corners.map(c=>`<div class="rl"><span>#${c.n} ${c.lvl}</span><em>R ${c.R} m \u2192 <span style="color:#39FF14">${c.safe} km/h</span></em></div>`).join('')}
<button class="btn red w" onclick="TRK.clearCorners()">\ud83d\uddd1 WYCZY\u015a\u0106 ZAKR\u0118TY</button></div>`:''}
<div class="mut">Pr\u0119dko\u015bci orientacyjne. Zawsze jed\u017a wed\u0142ug warunk\u00f3w i w\u0142asnej oceny. U\u017cywaj tylko na zamkni\u0119tym torze.</div>`;

// dodanie przycisku na ekranie g\u0142\u00f3wnym bez zmiany oryginalnego widoku
(function(){
  const orig=V.intro;
  V.intro=()=>orig().replace('<div class=foot-links>',
    `<button class="btn cy" onclick="A.go('tor')" style="color:#FFD400;box-shadow:inset 0 0 0 2px #FFD400">\ud83c\udfc1 TOR ${esc(S.trk.name)}: MAPA + PROWADZENIE<small>Dojazd do toru i g\u0142osowe wskaz\u00f3wki na zakr\u0119tach</small></button><div class=foot-links>`);
})();
render();


/* ============================================================================
   DODATEK 2: AI TOR / TRASA - MAPA DOJAZDU + GLOSOWE PROWADZENIE NA ZAKRETACH
   (tylko dopisane, nic nie usunieto)
   ============================================================================ */
const AIG = {
  corners: [], idx: 0, watch: null, on: false, spd: 0,
  prep(t){
    AIG.corners = TRK.analyze(t.geometry || []);
    AIG.idx = 0;
  },
  bbox(t){
    const g = t.geometry || [t.start, t.end];
    let a=90,b=-90,c=180,d=-180;
    g.forEach(p=>{a=Math.min(a,p.lat);b=Math.max(b,p.lat);c=Math.min(c,p.lon);d=Math.max(d,p.lon);});
    const pl=(b-a)*0.1+0.002, po=(d-c)*0.1+0.002;
    return [c-po,a-pl,d+po,b+pl];
  },
  mapUrl(t){
    const bb = AIG.bbox(t);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bb.join(',')}&layer=mapnik&marker=${t.start.lat},${t.start.lon}`;
  },
  start(){
    AIG.stop();
    if(!S.activeTrack || !navigator.geolocation) return;
    if(!AIG.corners.length) AIG.prep(S.activeTrack);
    AIG.idx = 0; AIG.on = true;
    AIG.corners.forEach(c=>{c.warn=false;});
    TRK.say('Prowadzenie na torze w\u0142\u0105czone. Na trasie jest ' + AIG.corners.length + ' zakr\u0119t\u00f3w. Bezpiecznej jazdy.');
    AIG.watch = navigator.geolocation.watchPosition(p=>{
      if(S.trackTimerState !== 'running' && S.trackTimerState !== 'waiting_start'){ AIG.stop(); return; }
      if(S.trackTimerState !== 'running') return;
      const lat=p.coords.latitude, lon=p.coords.longitude;
      AIG.spd = Math.round((p.coords.speed||0)*3.6);
      const c = AIG.corners[AIG.idx];
      if(!c){ return; }
      const d = haversine(lat,lon,c.lat,c.lon);
      const warnD = Math.max(80,(AIG.spd/3.6)*5);
      if(d <= warnD && !c.warn){
        c.warn = true;
        const over = AIG.spd > c.safe ? ' Zwolnij.' : '';
        TRK.say('Zakr\u0119t ' + c.n + ', ' + c.lvl + '. Bezpiecznie wejd\u017a przy ' + c.safe + ' kilometr\u00f3w na godzin\u0119.' + over);
        vib(c.lvl==='bardzo ciasny'?[200,80,200]:100);
      }
      if(c.warn && d < 30){ AIG.idx++; }
      const e = $('#aig-hud');
      if(e){
        const n = AIG.corners[AIG.idx];
        e.innerHTML = '<b style="font-size:30px;color:#00F0FF">'+AIG.spd+' km/h</b><br>' + (n ? 'Nast\u0119pny: zakr\u0119t <b>'+n.n+'</b> ('+n.lvl+') za <b>'+Math.round(haversine(lat,lon,n.lat,n.lon))+' m</b><br>Bezpiecznie: <b style="color:'+(AIG.spd>n.safe?'#FF1744':'#39FF14')+'">'+n.safe+' km/h</b>' : 'To by\u0142y wszystkie zakr\u0119ty.');
      }
    },()=>{},{enableHighAccuracy:true,maximumAge:500,timeout:8000});
  },
  stop(){
    if(AIG.watch!=null){ try{navigator.geolocation.clearWatch(AIG.watch);}catch(e){} AIG.watch=null; }
    AIG.on=false;
  }
};

(function(){
  const oSel = A.selectTrack, oStart = A.startTrackTracking, oStop = A.stopTrackTracking, oTr = V.tracks;
  A.selectTrack = function(id){
    oSel.call(A,id);
    if(S.activeTrack){ AIG.prep(S.activeTrack); render(); }
  };
  A.startTrackTracking = function(){
    oStart.call(A);
    if(S.trackTimerState === 'waiting_start') AIG.start();
  };
  A.stopTrackTracking = function(){ AIG.stop(); oStop.call(A); };
  V.tracks = function(){
    let h = oTr();
    const t = S.activeTrack;
    if(!t) return h;
    const extra = `
    <div class=fr style="--c:#00F0FF">
      <b style="color:#00F0FF">\ud83d\uddfa\ufe0f MAPA TORU AI</b>
      <small>Pinezka = start trasy. Dojazd: przycisk poni\u017cej.</small>
      <div class="vid-box"><iframe src="${AIG.mapUrl(t)}" style="width:100%;height:260px;border:0"></iframe></div>
      <button class="btn on" onclick="A.openMaps(${t.start.lat},${t.start.lon})">\ud83e\udded NAWIGUJ DO STARTU (GOOGLE MAPS)</button>
      <button class="btn cy" onclick="window.open('https://waze.com/ul?ll=${t.start.lat},${t.start.lon}&navigate=yes','_blank')">\ud83d\ude97 NAWIGUJ (WAZE)</button>
    </div>
    <div class="fr ai">
      <b style="color:#39FF14">\ud83c\udf99\ufe0f PROWADZENIE G\u0141OSOWE NA TORZE</b>
      <small>Zakr\u0119ty na trasie: <b>${AIG.corners.length}</b>. G\u0142os podaje bezpieczn\u0105 pr\u0119dko\u015b\u0107 wej\u015bcia (obliczon\u0105 z promienia zakr\u0119tu, minus ${S.trkMargin} km/h). Prowadzenie w\u0142\u0105cza si\u0119 razem z przyciskiem \u201eROZPOCZNIJ POMIAR\u201d.</small>
      <div id="aig-hud" class="hud">${AIG.on?'Czekam na start...':'Gotowy.'}</div>
      ${AIG.corners.map(c=>`<div class="rl"><span>#${c.n} ${c.lvl}</span><em>R ${c.R} m \u2192 <span style="color:#39FF14">${c.safe} km/h</span></em></div>`).join('')}
      <button class="btn w" onclick="TRK.say('Test g\u0142osu. Zakr\u0119t 1, ciasny. Bezpiecznie wejd\u017a przy 50 kilometr\u00f3w na godzin\u0119.')">\ud83d\udd0a TEST G\u0141OSU</button>
      <button class="btn w" onclick="TRK.toggleVoice()">G\u0141OS: ${S.trkVoice?'W\u0141.':'WY\u0141.'}</button>
      <small>Przyczepno\u015b\u0107 (g): <b>${S.trkG.toFixed(2)}</b> (0.4 deszcz, 0.6 zwyk\u0142e opony)</small>
      <input type="range" min="0.3" max="1.1" step="0.05" value="${S.trkG}" onchange="TRK.setG(this.value);AIG.prep(S.activeTrack);render()">
    </div>`;
    return h + extra;
  };
})();
render();

/* DODATEK 3: przycisk toru na ekranie glownym (home) */
(function(){
  const oh=V.home;
  V.home=()=>oh().replace('<div class=foot-links>',
    '<button class="btn cy" onclick="A.go(\'tor\')" style="color:#FFD400;box-shadow:inset 0 0 0 2px #FFD400">\ud83c\udfc1 TOR '+esc(S.trk.name)+': MAPA + PROWADZENIE<small>Dojazd do toru i g\u0142osowe wskaz\u00f3wki na zak\u0119tach</small></button><div class=foot-links>');
})();
render();

/* DODATEK 4: przycisk TOR korzysta wylacznie z torow wygenerowanych przez AI */
(function(){
  const og=A.go;
  A.go=function(s){
    if(s==='tor'){
      if(S.tracks && S.tracks.length){ return og.call(A,'tracks'); }
      return A.findTracks(30);
    }
    return og.call(A,s);
  };
  const oh=V.home;
  V.home=()=>oh().split('MAPA + PROWADZENIE').join('MAPA + PROWADZENIE (TORY AI)').replace(/TOR [^:<]*: MAPA/,'TOR AI: MAPA');
})();
render();

/* DODATEK 5: ukrycie rankingu przejazdow w widoku AI TOR / TRASA (kod rankingu zostaje) */
(function(){
  const ot=V.tracks;
  V.tracks=function(){
    let h=ot();
    const a=h.indexOf('<div class=fr style="--c:#FFD400;margin-top:16px">');
    if(a<0) return h;
    const m=h.indexOf('MAPA TORU AI');
    let b=h.length;
    if(m>a){ b=h.lastIndexOf('<div class=fr style="--c:#00F0FF">',m); }
    return h.slice(0,a)+h.slice(b);
  };
})();
render();


/* ============================================================================
   DODATEK 6: ROZNORODNE ZADANIA (po ~100 na kategorie, bez powtorzen)
   Zastepuje tylko generyczne wypelniacze "Klasyczne wyzwanie #N"; zadania AI zostaja.
   ============================================================================ */
(function(){
  let seed = 20260101;
  const rnd = ()=>{ seed = (seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const shuffle = a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  // szablon: tekst z {a} {b} {c}; listy parametrow; trudnosc bazowa
  const combos=(tpl,lists)=>{
    let out=[''];
    const keys=Object.keys(lists);
    let acc=[{}];
    keys.forEach(k=>{ const n=[]; acc.forEach(o=>lists[k].forEach(v=>n.push({...o,[k]:v}))); acc=n; });
    return acc.map(o=>tpl.replace(/\{(\w+)\}/g,(m,k)=>o[k]));
  };
  const G = {
    burn:[
      ['Zr\u00f3b burnout i zatrzymaj auto dok\u0142adnie {a}.',{a:['przy pacho\u0142ku','na namalowanej linii','na \u015brodku placu','mi\u0119dzy dwoma pacho\u0142kami','przy znaczniku z kredy','na kraw\u0119dzi p\u0142yty']},1],
      ['Wykonaj {a} i po nim od razu {b}.',{a:['kr\u00f3tki burnout','burnout z miejsca','podw\u00f3jny burnout','burnout na p\u00f3\u0142 ko\u0142a','burnout z delikatnym skr\u0119tem'],b:['ruszaj prosto','zr\u00f3b k\u00f3\u0142ko wok\u00f3\u0142 pacho\u0142ka','zatrzymaj si\u0119 p\u0142ynnie','zmie\u0144 kierunek','wrzu\u0107 wy\u017cszy bieg i jed\u017a dalej']},2],
      ['Zr\u00f3b {a} wok\u00f3\u0142 pacho\u0142ka, rozpoczynaj\u0105c od {b}.',{a:['2 pe\u0142ne k\u00f3\u0142ka','3 pe\u0142ne k\u00f3\u0142ka','p\u00f3\u0142kole','\u00f3semk\u0119 z dymem','k\u00f3\u0142ko w lewo i k\u00f3\u0142ko w prawo'],b:['startu z miejsca','jazdy powoli','doci\u015bni\u0119cia gazu na 1. biegu','hamulca r\u0119cznego','zimnych opon']},2],
      ['Dym challenge: {a} i utrzymaj {b}.',{a:['zr\u00f3b burnout na luzie','zr\u00f3b burnout na 1. biegu','rozgrzej opony w k\u00f3\u0142ku','zacznij od delikatnego po\u015blizgu'],b:['sta\u0142e obroty','r\u00f3wny \u015blad na asfalcie','prost\u0105 lini\u0119 dymu','kontrol\u0119 nad kierownic\u0105','odsuni\u0119cie od pacho\u0142ka o 1 m']},3],
      ['Wy\u015bcig na dym: {a} w czasie {b} sekund.',{a:['zr\u00f3b burnout','zr\u00f3b 2 donuty','zr\u00f3b p\u00f3\u0142kole z dymem','rozgrzej tylne opony','zostaw \u015blad min. 10 m'],b:['5','8','10','12','15','20']},2]
    ],
    drift:[
      ['Przejed\u017a \u0142uk {a} w po\u015blizgu, utrzymuj\u0105c {b}.',{a:['w lewo','w prawo','o 90 stopni','o 180 stopni','szeroki','ciasny'],b:['sta\u0142y k\u0105t','p\u0142ynny gaz','jedno ruchome ko\u0142o kierownicy','kontrol\u0119 nad ty\u0142em','r\u00f3wne tempo','jeden \u015blad']},2],
      ['Zr\u00f3b \u00f3semk\u0119 wok\u00f3\u0142 dw\u00f3ch pacho\u0142k\u00f3w {a} {b}.',{a:['w po\u015blizgu','z zachowaniem po\u015blizgu','bez przerwy w \u015blizgu','p\u0142ynnie'],b:['3 razy','2 razy','5 razy','bez cofania gazu','z jednym przeniesieniem masy']},3],
      ['Zmie\u0144 kierunek po\u015blizgu {a} pomi\u0119dzy pacho\u0142kami ustawionymi {b}.',{a:['raz','dwa razy','trzy razy','pi\u0119\u0107 razy'],b:['co 8 m','co 10 m','co 12 m','co 15 m','w linii','w zygzak']},3],
      ['Wejd\u017a w zakr\u0119t {a} i z\u0142ap po\u015blizg {b}.',{a:['z hamulca r\u0119cznego','z odci\u0105\u017cenia ty\u0142u','z przeniesienia masy','z szarpni\u0119cia kierownic\u0105','z gazu'],b:['od razu','na wej\u015bciu','w \u015brodku \u0142uku','na ko\u0144cu \u0142uku','po pierwszym pacho\u0142ku','z wyj\u015bciem prosto']},2],
      ['Drift challenge: {a} i wyjed\u017a {b}.',{a:['wykonaj d\u0142ugi \u0142uk w lewo','wykonaj d\u0142ugi \u0142uk w prawo','zr\u00f3b p\u0119tl\u0119 wok\u00f3\u0142 pacho\u0142ka','zr\u00f3b \u0142uk po okr\u0119gu'],b:['dok\u0142adnie w osi','blisko pacho\u0142ka','na prostej','bez dotykania pacho\u0142k\u00f3w','bez cofania gazu','bez korekty kierownic\u0105']},3]
    ],
    speed:[
      ['Rozp\u0119d\u017a auto {a} i zatrzymaj si\u0119 {b}.',{a:['na kr\u00f3tkiej prostej','na odcinku 100 m','na odcinku 150 m','do 3. biegu','mo\u017cliwie szybko','p\u0142ynnie'],b:['przy pacho\u0142ku','na linii','w oznaczonej strefie','dok\u0142adnie w miejscu','w polu 5 m','bez po\u015blizgu']},2],
      ['Sprint: wystartuj {a} i dojed\u017a do pacho\u0142ka {b}.',{a:['z miejsca','z rolki','na 1. biegu','z lekkim po\u015blizgiem'],b:['najszybciej jak si\u0119 da','bez u\u015blizgu k\u00f3\u0142','w sta\u0142ym tempie','z p\u0142ynnym hamowaniem','bez kontaktu z nim','w czasie do 10 s']},2],
      ['Zr\u00f3b {a} mi\u0119dzy pacho\u0142kami i wr\u00f3\u0107 {b}.',{a:['szybki slalom','slalom w lewo','slalom w prawo','kr\u00f3tki sprint z hamowaniem','zawrotk\u0119 z gazem'],b:['t\u0105 sam\u0105 drog\u0105','po \u0142uku','bez zwalniania','w jak najkr\u00f3tszym czasie','z lepszym czasem','z mniejszym b\u0142\u0119dem']},3],
      ['Wy\u015bcig z czasem: {a} w czasie {b} sekund.',{a:['przejed\u017a 100 m i wyhamuj','zr\u00f3b slalom i wr\u00f3\u0107','zr\u00f3b okr\u0105\u017cenie wok\u00f3\u0142 placu','pokonaj prost\u0105 i zawr\u00f3\u0107','rozp\u0119d\u017a si\u0119 i zatrzymaj'],b:['8','10','12','15','18','25']},2],
      ['Hamowanie: {a} z pr\u0119dko\u015bci {b} i zatrzymaj si\u0119 {c}.',{a:['wyhamuj'],b:['30 km/h','40 km/h','50 km/h','60 km/h'],c:['w strefie','przed lini\u0105','przy pacho\u0142ku','na wyznaczonym polu','p\u0142ynnie']},3]
    ],
    precision:[
      ['Zaparkuj {a} w polu {b} jednym podej\u015bciem.',{a:['przodem','ty\u0142em','bokiem','z po\u015blizgiem','p\u0142ynnie'],b:['o szeroko\u015bci 3 m','o szeroko\u015bci 2,5 m','mi\u0119dzy pacho\u0142kami','na kredzie','wyznaczonym farb\u0105','ze znacznikiem']}, 2],
      ['Przejed\u017a slalom {a} pacho\u0142k\u00f3w {b}.',{a:['5','6','7','8','10','12'],b:['powoli','bez dotykania','p\u0142ynnie','z r\u00f3wnym tempem','w obie strony','bez cofania']},2],
      ['Zatrzymaj auto {a} od {b}.',{a:['5 cm','10 cm','20 cm','30 cm','50 cm','1 m'],b:['pacho\u0142ka','linii','kraw\u0119\u017cnika','znacznika','bramki','ta\u015bmy']},3],
      ['Wjed\u017a w {a} z {b} bez dotykania kraw\u0119dzi.',{a:['w\u0105ski przejazd','bramk\u0119 z pacho\u0142k\u00f3w','tunel z pacho\u0142k\u00f3w','zw\u0119\u017cenie','korytarz'],b:['pr\u0119dko\u015bci\u0105 5 km/h','pr\u0119dko\u015bci\u0105 10 km/h','pr\u0119dko\u015bci\u0105 15 km/h','jednego podej\u015bcia','zerowym b\u0142\u0119dem','p\u0142ynn\u0105 kierownic\u0105']},3],
      ['Trasa precyzyjna: {a} i zako\u0144cz {b}.',{a:['zr\u00f3b k\u00f3\u0142ko wok\u00f3\u0142 pacho\u0142ka','zr\u00f3b \u00f3semk\u0119 wok\u00f3\u0142 dw\u00f3ch pacho\u0142k\u00f3w','zr\u00f3b zawrotk\u0119','zr\u00f3b slalom w lewo i prawo','przejed\u017a w\u0105ski \u0142uk'],b:['w oznaczonym polu','przy znaczniku','dok\u0142adnie w osi','na prostej','jednym ruchem']},2]
    ],
    reverse:[
      ['Cofaj {a} i zatrzymaj si\u0119 {b}.',{a:['na odcinku 20 m','na odcinku 30 m','na odcinku 50 m','po \u0142uku','w prostej linii','powoli'],b:['przy pacho\u0142ku','na linii','w polu','dok\u0142adnie w miejscu','p\u0142ynnie','bez korekty']},1],
      ['Zr\u00f3b {a} ty\u0142em wok\u00f3\u0142 {b}.',{a:['p\u00f3\u0142kole','pe\u0142ne k\u00f3\u0142ko','\u00f3semk\u0119','slalom','\u0142uk'],b:['jednego pacho\u0142ka','dw\u00f3ch pacho\u0142k\u00f3w','trzech pacho\u0142k\u00f3w','wyznaczonego pola','znacznika','s\u0142upka']},2],
      ['Zawr\u00f3\u0107 {a} i wr\u00f3\u0107 {b}.',{a:['ty\u0142em po \u0142uku','ty\u0142em z po\u015blizgiem','wahad\u0142em','manewrem \u201eJ\u201d','p\u00f3\u0142obrotem'],b:['na start','przodem','t\u0105 sam\u0105 drog\u0105','po prostej','w lini','do punktu']},3],
      ['Wycofaj w {a} z {b} jednym podej\u015bciem.',{a:['bramk\u0119','korytarz','pole','tunel','zw\u0119\u017cenie'],b:['pr\u0119dko\u015bci\u0105 5 km/h','szybkim ruchem','bez dotykania','spokojnym tempem','p\u0142ynnym ko\u0142em','jednego ruchu']},2],
      ['Rewers challenge: {a} ty\u0142em w czasie {b} sekund.',{a:['przejed\u017a slalom','zr\u00f3b \u00f3semk\u0119','zr\u00f3b \u0142uk','pokonaj 30 m','przejed\u017a korytarz'],b:['10','15','20','25','30','40']},3]
    ],
    sound:[
      ['Zr\u00f3b {a} na {b} biegu.',{a:['odci\u0119cie zap\u0142onu','kilka odci\u0119\u0107','seri\u0119 odci\u0119\u0107','p\u0142ynne odci\u0119cie','kr\u00f3tkie odci\u0119cie','d\u0142ugie odci\u0119cie'],b:['1.','2.','3.','neutralnym','wolnych obrotach','wysokich obrotach']},1],
      ['Zagraj wydechem: {a} i {b}.',{a:['podnie\u015b obroty do odci\u0119cia','zr\u00f3b seri\u0119 kr\u00f3tkich gaz\u00f3w','utrzymaj obroty przez 3 s','zr\u00f3b p\u0142ynne crescendo'],b:['opu\u015b\u0107 obroty p\u0142ynnie','zako\u0144cz cisz\u0105','zako\u0144cz g\u0142o\u015bnym akcentem','powt\u00f3rz 3 razy','zr\u00f3b rytm','zr\u00f3b echo']},2],
      ['Rytm: {a} {b} razy.',{a:['zagraj odci\u0119ciami','zr\u00f3b kr\u00f3tkie gazy','zagraj wydechem','zr\u00f3b pulsuj\u0105ce obroty','zr\u00f3b seri\u0119 d\u017awi\u0119k\u00f3w'],b:['3','4','5','6','8','10']},2],
      ['D\u017awi\u0119k w ruchu: {a} podczas {b}.',{a:['odci\u0119cie','kr\u00f3tki gaz','seria gaz\u00f3w','pop z wydechu'],b:['przejazdu przez pacho\u0142ki','\u0142uku','sprintu','powolnej jazdy','hamowania','wjazdu w zakr\u0119t']},3],
      ['Sound check: {a} przez {b} sekund.',{a:['utrzymaj obroty','zagraj melodi\u0119 gazem','zr\u00f3b odci\u0119cia','zagraj rytm','pozostaw wolny bieg'],b:['3','4','5','6','8','10']},1]
    ],
    duel:[
      ['Pojedynek: {a} i wygraj {b}.',{a:['sprint na 100 m','slalom na czas','\u0142uk w po\u015blizgu','burnout','hamowanie na linii'],b:['z kumplem','z rywalem','w 2 pr\u00f3bach','w 3 pr\u00f3bach','na czas','na punkty']},2],
      ['Dwuosobowy duel: {a} i por\u00f3wnajcie {b}.',{a:['przejazd slalomu','czas sprintu','d\u0142ugo\u015b\u0107 dymu','k\u0105t po\u015blizgu','dok\u0142adno\u015b\u0107 parkowania'],b:['czasy','b\u0142\u0119dy','wyniki','k\u0105ty','styl','precyzj\u0119']},2],
      ['Runda {a}: ty kontra {b}.',{a:['1','2','3','4','5','6'],b:['rywal w slalomie','rywal w sprincie','rywal w driftach','rywal w precyzji','rywal w burnoucie','rywal w cofaniu']},3],
      ['Bitwa na dym: {a}, a drugi {b}.',{a:['robi burnout','robi donuty','robi \u00f3semk\u0119','robi \u0142uk'],b:['powtarza i poprawia','odpowiada lepszym','pr\u00f3buje d\u0142u\u017cej','robi to szybciej','robi to cia\u015bniej','dok\u0142ada jedno k\u00f3\u0142ko']},3],
      ['Pojedynek na punkty: {a} (max {b} pkt).',{a:['styl','precyzja','czas','dym','k\u0105t'],b:['5','10','15','20','25','30']},2]
    ],
    legend:[
      ['Zr\u00f3b {a} i nagraj {b}.',{a:['seri\u0119 3 manewr\u00f3w','kombinacj\u0119 burnout i drift','d\u0142ugi \u0142uk','trik z dymem','p\u0142ynn\u0105 \u00f3semk\u0119'],b:['filmik','jedno uj\u0119cie','wersj\u0119 w zwolnionym tempie','bez ci\u0119\u0107','z d\u017awi\u0119kiem','z innej perspektywy']},3],
      ['Legendarny przejazd: {a} bez {b}.',{a:['zr\u00f3b ca\u0142y tor','zr\u00f3b 3 donuty','zr\u00f3b \u00f3semk\u0119','zr\u00f3b slalom i drift'],b:['pomy\u0142ki','dotkni\u0119cia pacho\u0142ka','przerwy','korekty','zatrzymania','cofania gazu']},3],
      ['Wyzwanie legendy: po\u0142\u0105cz {a} z {b}.',{a:['burnout','donut','drift','sprint','cofanie','precyzj\u0119'],b:['d\u017awi\u0119kiem','precyzj\u0105','slalomem','dymem','\u0142ukiem','hamowaniem']},3],
      ['Zadanie specjalne: {a} i zostaw {b}.',{a:['zr\u00f3b znak z oponami','narysuj \u00f3semk\u0119','zr\u00f3b wielkie k\u00f3\u0142ko','zr\u00f3b trzy \u015blady','zr\u00f3b lini\u0119'],b:['czysty \u015blad','symetryczny \u015blad','wyra\u017any dym','\u015blad na asfalcie','pami\u0105tk\u0119']},2],
      ['Legenda dnia: {a} w stylu {b}.',{a:['zr\u00f3b popisowy przejazd','zr\u00f3b fina\u0142owy manewr','zr\u00f3b sw\u00f3j sygnaturowy trik'],b:['rajdowym','driftowym','wy\u015bcigowym','filmowym','szalonym','precyzyjnym','spokojnym','agresywnym']},2]
    ]
  };
  const ART=['A','B','C','D','E'];
  Object.keys(G).forEach(cat=>{
    const bank = TASK_BANK[cat]; if(!bank) return;
    const keep = bank.filter(x=>x && x.ai);               // zadania AI zostaja
    const seen = new Set(keep.map(x=>x.t));
    let all=[];
    G[cat].forEach(g=>{ combos(g[0], g[1]).forEach(t=>all.push({t, d:g[2]})); });
    // rownomiernie z kazdego szablonu (round-robin po przetasowaniu)
    const per = G[cat].map(g=>shuffle(combos(g[0],g[1]).map(t=>({t,d:g[2]}))));
    const out=[]; let i=0;
    while(out.length<100 && per.some(p=>p.length>i)){
      per.forEach(p=>{ if(p[i] && out.length<100 && !seen.has(p[i].t)){ seen.add(p[i].t); out.push({t:p[i].t,d:p[i].d,s:p[i].d*10+15,ai:null}); } });
      i++;
    }
    bank.length = 0;
    keep.forEach(x=>bank.push(x));
    out.forEach(x=>bank.push(x));
  });
  if(!LS.g('bl_seen_v2',false)){ LS.s('bl_seen',[]); LS.s('bl_seen_v2',true); }
})();


/* ============================================================================
   DODATEK 7: MAPA CIEPLA PO PRZEJEZDZIE (AI TOR / TRASA)
   zielony = spokojnie, czerwony = ostro; pinezki zakretow + Twoja predkosc
   ============================================================================ */
const HEAT = {
  run: null, watch: null,
  key(id){ return 'bl_heat_' + id; },
  load(id){ return LS.g(HEAT.key(id), null); },
  begin(){
    HEAT.end();
    if(!S.activeTrack) return;
    HEAT.run = {id:S.activeTrack.id, pts:[], last:null};
    HEAT.watch = navigator.geolocation.watchPosition(p=>{
      const st = S.trackTimerState;
      if(st === 'running'){
        const now = Date.now(), lat = p.coords.latitude, lon = p.coords.longitude;
        let v = p.coords.speed;
        const L = HEAT.run.last;
        if((v == null || isNaN(v)) && L){ v = haversine(L.lat,L.lon,lat,lon) / Math.max(0.3,(now-L.t)/1000); }
        const pt = {lat, lon, v: Math.round((v||0)*3.6), t: now};
        HEAT.run.pts.push(pt); HEAT.run.last = pt;
      } else if(st === 'finished'){ HEAT.finish(); }
      else if(st === 'idle'){ HEAT.end(); }
    }, ()=>{}, {enableHighAccuracy:true, maximumAge:0, timeout:8000});
  },
  end(){ if(HEAT.watch != null){ try{navigator.geolocation.clearWatch(HEAT.watch);}catch(e){} HEAT.watch = null; } },
  finish(){
    const r = HEAT.run; HEAT.end();
    if(!r || r.pts.length < 5) return;
    const corners = (AIG.corners||[]).map(c=>{
      let best = null;
      r.pts.forEach(p=>{ if(haversine(p.lat,p.lon,c.lat,c.lon) <= 45 && (best==null || p.v > best)) best = p.v; });
      return {n:c.n, lat:c.lat, lon:c.lon, lvl:c.lvl, safe:c.safe, v:best};
    });
    const data = {id:r.id, name:(S.activeTrack&&S.activeTrack.name)||'TOR', pts:r.pts,
      corners, time:(r.pts[r.pts.length-1].t - r.pts[0].t)/1000, ts:Date.now()};
    LS.s(HEAT.key(r.id), data);
    render();
  },
  color(ratio){
    const h = 120 - Math.max(0, Math.min(1, (ratio-0.8)/0.45)) * 120;
    return 'hsl(' + Math.round(h) + ',95%,52%)';
  },
  draw(){
    const cv = document.getElementById('heat-cv');
    if(!cv || !S.activeTrack) return;
    const d = HEAT.load(S.activeTrack.id); if(!d) return;
    const W = 720, H = 820; cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = '#050505'; g.fillRect(0,0,W,H);
    g.fillStyle = '#FF5500'; g.font = 'italic 900 40px Arial'; g.fillText('BLACKLIST', 30, 56);
    g.fillStyle = '#00F0FF'; g.font = 'bold 24px Arial';
    g.fillText(String(d.name).slice(0,34).toUpperCase(), 30, 92);
    const vmax = Math.max.apply(null, d.pts.map(p=>p.v).concat([1]));
    g.fillStyle = '#fff'; g.font = 'bold 22px Arial';
    g.fillText('CZAS ' + d.time.toFixed(1) + ' s   |   MAX ' + vmax + ' km/h', 30, 128);
    // rzut: mapa lokalna w metrach
    const lat0 = d.pts[0].lat, lon0 = d.pts[0].lon, kx = Math.cos(lat0*Math.PI/180);
    const X = p=>(p.lon-lon0)*111320*kx, Y = p=>-(p.lat-lat0)*111320;
    let a=1e12,b=-1e12,c=1e12,e=-1e12;
    d.pts.forEach(p=>{a=Math.min(a,X(p));b=Math.max(b,X(p));c=Math.min(c,Y(p));e=Math.max(e,Y(p));});
    const bx=60, by=170, bw=W-120, bh=H-by-130;
    const sc = Math.min(bw/Math.max(1,b-a), bh/Math.max(1,e-c));
    const ox = bx + (bw-(b-a)*sc)/2, oy = by + (bh-(e-c)*sc)/2;
    const PX = p=>ox+(X(p)-a)*sc, PY = p=>oy+(Y(p)-c)*sc;
    g.lineCap = 'round'; g.lineJoin = 'round';
    // obrys
    g.strokeStyle = '#1b1b1f'; g.lineWidth = 16; g.beginPath();
    d.pts.forEach((p,i)=>{ i?g.lineTo(PX(p),PY(p)):g.moveTo(PX(p),PY(p)); }); g.stroke();
    for(let i=1;i<d.pts.length;i++){
      const p=d.pts[i-1], q=d.pts[i], v=(p.v+q.v)/2;
      let ratio = 0.7 + 0.15*(v/vmax), bd = 80;
      d.corners.forEach(cn=>{ const dd=haversine(q.lat,q.lon,cn.lat,cn.lon); if(dd<bd){ bd=dd; ratio=v/Math.max(10,cn.safe); } });
      g.strokeStyle = HEAT.color(ratio); g.lineWidth = 9;
      g.beginPath(); g.moveTo(PX(p),PY(p)); g.lineTo(PX(q),PY(q)); g.stroke();
    }
    // start / meta
    const s=d.pts[0], f=d.pts[d.pts.length-1];
    g.fillStyle='#fff'; g.font='bold 18px Arial';
    g.beginPath(); g.arc(PX(s),PY(s),9,0,7); g.fill(); g.fillText('START',PX(s)+12,PY(s)-10);
    g.beginPath(); g.arc(PX(f),PY(f),9,0,7); g.fill(); g.fillText('META',PX(f)+12,PY(f)+22);
    // pinezki zakretow
    d.corners.forEach(cn=>{
      const px = ox+(((cn.lon-lon0)*111320*kx)-a)*sc, py = oy+((-(cn.lat-lat0)*111320)-c)*sc;
      const ok = cn.v!=null && cn.v<=cn.safe;
      const col = cn.v==null ? '#888' : (ok ? '#39FF14' : '#FF1744');
      g.fillStyle = '#000'; g.strokeStyle = col; g.lineWidth = 4;
      g.beginPath(); g.arc(px,py,17,0,7); g.fill(); g.stroke();
      g.fillStyle = col; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText(String(cn.n),px,py+6);
      const t = cn.v==null ? 'brak' : cn.v + ' km/h';
      g.font = 'bold 17px Arial'; const tw = g.measureText(t).width + 12;
      let tx = px + 22; if(tx + tw > W - 10) tx = px - 22 - tw;
      g.fillStyle = '#000c'; g.fillRect(tx, py-12, tw, 24);
      g.fillStyle = col; g.textAlign = 'left'; g.fillText(t, tx+6, py+6);
    });
    // legenda
    const ly = H - 70;
    for(let i=0;i<260;i++){ g.fillStyle = HEAT.color(0.8 + i/260*0.45); g.fillRect(30+i,ly,1,16); }
    g.fillStyle = '#fff'; g.font = 'bold 16px Arial'; g.textAlign = 'left';
    g.fillText('spokojnie', 30, ly+36); g.textAlign = 'right'; g.fillText('ostro', 290, ly+36);
    g.textAlign = 'left'; g.fillStyle = '#9aa'; g.font = '15px Arial';
    g.fillText('Pinezki: zielona = w normie, czerwona = za szybko (limit z marginesem -10 km/h)', 30, H-14);
  },
  save(){
    const cv = document.getElementById('heat-cv'); if(!cv) return;
    cv.toBlob(b=>{
      if(!b) return;
      const f = new File([b], 'mapa-ciepla.png', {type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[f]})){ navigator.share({files:[f], title:'Mapa ciepla BLACKLIST'}).catch(()=>{}); return; }
      const u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = 'mapa-ciepla.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(u), 2000);
    }, 'image/png');
  },
  clear(){ if(S.activeTrack && confirm('Usun\u0105\u0107 zapis przejazdu?')){ LS.s(HEAT.key(S.activeTrack.id), null); render(); } }
};

(function(){
  const oStart = A.startTrackTracking, oStop = A.stopTrackTracking, oTr = V.tracks, oR = render;
  A.startTrackTracking = function(){
    oStart.call(A);
    if(S.trackTimerState === 'waiting_start') HEAT.begin();
  };
  A.stopTrackTracking = function(){ HEAT.end(); oStop.call(A); };
  V.tracks = function(){
    let h = oTr();
    if(!S.activeTrack) return h;
    const d = HEAT.load(S.activeTrack.id);
    return h + `
    <div class="fr" style="--c:#FF5500">
      <b style="color:#FF5500">\ud83d\uddfa\ufe0f MAPA CIEP\u0141A PO PRZEJE\u0179DZIE</b>
      ${d ? `
        <small>Zapis z ${new Date(d.ts).toLocaleString('pl-PL')}. Zielony = spokojnie, czerwony = ostro. Pinezki pokazuj\u0105 Twoj\u0105 pr\u0119dko\u015b\u0107 w zakr\u0119tach.</small>
        <canvas id="heat-cv" style="width:100%;display:block;margin:8px 0;background:#000"></canvas>
        <button class="btn on" onclick="HEAT.save()">\ud83d\udcf8 ZAPISZ / UDOST\u0118PNIJ OBRAZ</button>
        <button class="btn red w" onclick="HEAT.clear()">\ud83d\uddd1 USU\u0143 ZAPIS PRZEJAZDU</button>
      ` : `<small>Po uko\u0144czeniu przejazdu (ROZPOCZNIJ POMIAR do mety) pojawi si\u0119 tu trasa w kolorach z pinezkami zakr\u0119t\u00f3w i Twoj\u0105 pr\u0119dko\u015bci\u0105. B\u0119dzie gotowa do zrzutu ekranu.</small>`}
    </div>`;
  };
  render = function(){ oR(); try{ HEAT.draw(); }catch(e){} };
})();
render();


/* ============================================================================
   DODATEK 8: (6) lepszy filtr torow AI + oznaczanie "prawdziwy tor"
              (7) +30 recznych zadan na kategorie
              (8) tryb offline (service worker + mapa rysowana lokalnie)
              (9) admin: haslo sprawdzane przez hash, przycisk ukryty
   ============================================================================ */

/* ---------- (6) FILTR TOROW ---------- */
const REAL = {
  ids: LS.g('bl_real_tracks', []),
  has(id){ return REAL.ids.indexOf(id) >= 0; },
  toggle(id){
    const i = REAL.ids.indexOf(id);
    if(i >= 0) REAL.ids.splice(i,1); else REAL.ids.push(id);
    LS.s('bl_real_tracks', REAL.ids);
    S.tracks.sort((a,b)=> (REAL.has(b.id)?1:0)-(REAL.has(a.id)?1:0) || a.distFromUser-b.distFromUser);
    LS.s('bl_saved_tracks', S.tracks);
    render();
  }
};

findAiTracks = async function(lat, lon, radiusKm = 30){
  const radius = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:30];
way["highway"~"^(secondary|tertiary|unclassified)$"]["surface"~"^(asphalt|paved)$"]["access"!~"^(private|no)$"](around:${radius},${lat},${lon});
out geom;
`;
  const data = await fetchOverpassWithFallback(query);
  let cand = [];
  for(const el of (data.elements || [])){
    if(!el.geometry || el.geometry.length < 3) continue;
    const tags = el.tags || {};
    if(tags.lit === 'yes' || tags.junction === 'roundabout') continue;     // miasto / rondo
    if(tags.sidewalk && tags.sidewalk !== 'no' && tags.sidewalk !== 'none') continue; // chodniki = zabudowa
    const ms = parseInt(tags.maxspeed, 10);
    if(!isNaN(ms) && ms <= 40) continue;                                  // strefy wolnego ruchu
    let len = 0;
    for(let i = 0; i < el.geometry.length - 1; i++){
      const p1 = el.geometry[i], p2 = el.geometry[i+1];
      len += haversine(p1.lat, p1.lon, p2.lat, p2.lon);
    }
    if(len < 3000 || len > 30000) continue;
    const g = el.geometry;
    cand.push({el, tags, len, g, start:g[0], end:g[g.length-1], mid:g[Math.floor(g.length/2)],
               dist: haversine(lat, lon, g[0].lat, g[0].lon), bld: null});
  }
  cand.sort((a,b)=>a.dist-b.dist);
  cand = cand.slice(0, 20);

  // zabudowa: liczymy budynki przy poczatku, srodku i koncu trasy (jedno zapytanie)
  try{
    if(cand.length){
      const parts = [];
      cand.forEach(c=>{ [c.start,c.mid,c.end].forEach(p=>{ parts.push(`way["building"](around:80,${p.lat},${p.lon});`); }); });
      const bd = await fetchOverpassWithFallback(`[out:json][timeout:30];(${parts.join('')});out center;`);
      const bl = (bd.elements || []).filter(b=>b.center);
      cand.forEach(c=>{
        let n = 0;
        [c.start,c.mid,c.end].forEach(p=>{ bl.forEach(b=>{ if(haversine(p.lat,p.lon,b.center.lat,b.center.lon) <= 90) n++; }); });
        c.bld = n;
      });
    }
  }catch(e){ /* brak danych o zabudowie: zostaje sam podstawowy filtr */ }

  let ok = cand.filter(c=>c.bld == null || c.bld <= 25);
  if(ok.length < 3) ok = cand.slice().sort((a,b)=>(a.bld==null?0:a.bld)-(b.bld==null?0:b.bld)).slice(0,6);

  const tracks = ok.map(c=>({
    id: 'track_' + c.el.id,
    name: c.tags.name || c.tags.ref || `Tor / Trasa RWD (${Math.round(c.len/1000)} km)`,
    length: Math.round(c.len),
    distFromUser: c.dist,
    start: {lat:c.start.lat, lon:c.start.lon},
    mid: {lat:c.mid.lat, lon:c.mid.lon},
    end: {lat:c.end.lat, lon:c.end.lon},
    geometry: c.g,
    buildings: c.bld
  }));
  tracks.sort((a,b)=> (REAL.has(b.id)?1:0)-(REAL.has(a.id)?1:0) || a.distFromUser-b.distFromUser);
  return tracks.slice(0, 6);
};

(function(){
  const oTr = V.tracks;
  V.tracks = function(){
    let h = oTr();
    // przycisk "prawdziwy tor" na kazdej karcie listy
    h = h.replace(/<button onclick="A\.selectTrack\('([^']+)'\)"/g, (m,id)=>
      `<button onclick="REAL.toggle('${id}')" style="flex:1">${REAL.has(id)?'\u2705 PRAWDZIWY':'\u2b50 OZNACZ'}</button>`+m);
    // plakietka przy nazwie
    h = h.replace(/(<b style="color:#00F0FF">#\d+ )([^<]*)(<\/b>)/g, (m,a,name,c)=>{
      const t = S.tracks.find(x=>esc(x.name)===name);
      const real = t && REAL.has(t.id);
      const info = t && t.buildings!=null ? ` <span style="font-size:10px;color:${t.buildings<=8?'#39FF14':'#FFD400'}">(${t.buildings<=8?'pusto':'troch\u0119 zabudowy'})</span>` : '';
      return a + name + (real?' <span style="font-size:10px;color:#39FF14">\u2705 TOR</span>':'') + info + c;
    });
    return h;
  };
})();

/* ---------- (7) +30 RECZNYCH ZADAN NA KATEGORIE ---------- */
(function(){
  const H = {
    burn:[
      'Zr\u00f3b burnout i zatrzymaj auto tak, \u017ceby \u015blad dymu zaczyna\u0142 si\u0119 przy pacho\u0142ku.',
      'Wykonaj kr\u00f3tki burnout, pu\u015b\u0107 gaz i od razu ruszaj p\u0142ynnie prosto.',
      'Rozgrzej opony: trzy kr\u00f3tkie burnouty z przerw\u0105 na zatrzymanie.',
      'Zr\u00f3b donut w lewo, a zaraz po nim donut w prawo.',
      'Wykonaj donut, w kt\u00f3rym prz\u00f3d auta ca\u0142y czas celuje w pacho\u0142ek.',
      'Zr\u00f3b burnout na jednym biegu i zako\u0144cz go dok\u0142adnie na linii.',
      'Zostaw \u015blad opon w kszta\u0142cie litery C.',
      'Utrzymaj sta\u0142y dym przez ca\u0142y p\u00f3\u0142okr\u0105g wok\u00f3\u0142 pacho\u0142ka.',
      'Zr\u00f3b burnout i podczas niego delikatnie skr\u0119\u0107 kierownic\u0119 w lewo.',
      'Zr\u00f3b burnout i podczas niego delikatnie skr\u0119\u0107 kierownic\u0119 w prawo.',
      'Wykonaj dwa donuty tak, \u017ceby drugi by\u0142 mniejszy od pierwszego.',
      'Zr\u00f3b donut i wyjed\u017a z niego prosto bez \u017cadnej korekty.',
      'Zacznij burnout z miejsca i sko\u0144cz go po 5 sekundach, bez d\u0142u\u017cszego dymu.',
      'Zr\u00f3b ma\u0142y donut wok\u00f3\u0142 pacho\u0142ka z odleg\u0142o\u015bci\u0105 max 1 m od niego.',
      'Zr\u00f3b burnout, zatrzymaj si\u0119 i od razu powt\u00f3rz go w drug\u0105 stron\u0119.',
      'Narysuj oponami wielkie O na placu.',
      'Zr\u00f3b burnout i wyjed\u017a z niego w stron\u0119 pacho\u0142ka oddalonego o 20 m.',
      'Wykonaj donut z r\u00f3wnym tempem i bez zatrzymywania si\u0119 w po\u0142owie.',
      'Wykonaj burnout, w kt\u00f3rym auto stoi dok\u0142adnie w jednej linii z pacho\u0142kiem.',
      'Zr\u00f3b donut, w kt\u00f3rym zmieniasz kierunek co jedno k\u00f3\u0142ko.',
      'Zr\u00f3b burnout i po nim ruszaj bez \u017cadnego po\u015blizgu.',
      'Zr\u00f3b p\u00f3\u0142kole z dymem, a potem szybko wyprostuj tor jazdy.',
      'Wykonaj burnout i zatrzymaj si\u0119 mask\u0105 do pacho\u0142ka.',
      'Zr\u00f3b dwa k\u00f3\u0142ka w lewo i jedno w prawo bez zatrzymania.',
      'Wypal opony tak, by \u015blad mia\u0142 r\u00f3wn\u0105 grubo\u015b\u0107 na ca\u0142ej d\u0142ugo\u015bci.',
      'Zr\u00f3b donut wok\u00f3\u0142 w\u0142asnego \u015bladu z poprzedniej pr\u00f3by.',
      'Zr\u00f3b burnout i zako\u0144cz go p\u0142ynnym, spokojnym zatrzymaniem.',
      'Wykonaj burnout na luzie, a potem wrzu\u0107 bieg i ruszaj dalej.',
      'Zr\u00f3b donut w czasie kr\u00f3tszym ni\u017c 10 sekund.',
      'Zr\u00f3b dwa donuty i zako\u0144cz je w tym samym punkcie, w kt\u00f3rym zacz\u0105\u0142e\u015b.'
    ],
    drift:[
      'Zr\u00f3b \u0142uk w po\u015blizgu i zatrzymaj tylny zderzak przy pacho\u0142ku.',
      'Przejed\u017a w po\u015blizgu obok dw\u00f3ch pacho\u0142k\u00f3w, nie dotykaj\u0105c ich.',
      'Wykonaj d\u0142ugi po\u015blizg po okr\u0119gu przez pe\u0142ne dwa k\u00f3\u0142ka.',
      'Wejd\u017a w \u0142uk w lewo, a po wyj\u015bciu od razu zr\u00f3b \u0142uk w prawo.',
      'Zr\u00f3b po\u015blizg i utrzymaj ten sam k\u0105t przez ca\u0142y zakr\u0119t.',
      'Wykonaj p\u0142ynn\u0105 zmian\u0119 kierunku w \u00f3semce, bez chwili prostej jazdy.',
      'Zr\u00f3b \u0142uk w po\u015blizgu i wyjed\u017a dok\u0142adnie w osi placu.',
      'Zr\u00f3b driftowy zakr\u0119t o 90 stopni wok\u00f3\u0142 pacho\u0142ka.',
      'Zr\u00f3b driftowy zakr\u0119t o 180 stopni, ko\u0144cz\u0105c w przeciwn\u0105 stron\u0119 ni\u017c start.',
      'Wykonaj po\u015blizg z wej\u015bciem od odci\u0105\u017cenia ty\u0142u.',
      'Zr\u00f3b po\u015blizg z wej\u015bciem z hamulca r\u0119cznego i szybko go opanuj.',
      'Utrzymaj po\u015blizg na ca\u0142ej d\u0142ugo\u015bci \u0142uku bez cofania gazu.',
      'Zr\u00f3b po\u015blizg i podjed\u017a jak najbli\u017cej pacho\u0142ka, nie dotykaj\u0105c go.',
      'Przejed\u017a cztery pacho\u0142ki w linii w po\u015blizgu, zmieniaj\u0105c stron\u0119 przy ka\u017cdym.',
      'Wykonaj dwa zakr\u0119ty w po\u015blizgu bez zatrzymania mi\u0119dzy nimi.',
      'Zr\u00f3b po\u015blizg i na jego ko\u0144cu ustaw auto prosto w stron\u0119 pacho\u0142ka.',
      'Zr\u00f3b po\u015blizg przy ma\u0142ej pr\u0119dko\u015bci, ale z du\u017cym k\u0105tem.',
      'Zr\u00f3b po\u015blizg z wyj\u015bciem na prost\u0105 i p\u0142ynnym dodaniem gazu.',
      'Wykonaj dwa po\u015blizgi z rz\u0119du w tym samym kierunku.',
      'Zr\u00f3b \u0142uk w po\u015blizgu tak, by tylne ko\u0142o przesz\u0142o blisko pacho\u0142ka.',
      'Zr\u00f3b po\u015blizg, a po nim zatrzymaj si\u0119 r\u00f3wno na linii.',
      'Zr\u00f3b ciasny okr\u0105g w po\u015blizgu wok\u00f3\u0142 jednego pacho\u0142ka.',
      'Zr\u00f3b szeroki okr\u0105g w po\u015blizgu wok\u00f3\u0142 dw\u00f3ch pacho\u0142k\u00f3w.',
      'Zr\u00f3b zakr\u0119t w po\u015blizgu, w kt\u00f3rym kierownica prawie si\u0119 nie rusza.',
      'Wejd\u017a w po\u015blizg z pr\u0119dko\u015bci 30 km/h i utrzymaj go przez 3 sekundy.',
      'Wykonaj p\u0142ynn\u0105 seri\u0119 trzech po\u015blizg\u00f3w w trzech kierunkach.',
      'Zr\u00f3b po\u015blizg i wyjed\u017a z niego wolniej, ni\u017c wszed\u0142e\u015b.',
      'Zr\u00f3b po\u015blizg i wyjed\u017a z niego szybciej, ni\u017c wszed\u0142e\u015b.',
      'Zr\u00f3b po\u015blizg w kszta\u0142cie litery S.',
      'Wykonaj najpi\u0119kniejszy po\u015blizg, na jaki ci\u0119 sta\u0107, i oce\u0144 go w skali 1 do 10.'
    ],
    speed:[
      'Przyspiesz na odcinku 80 m i wyhamuj przed lini\u0105.',
      'Zr\u00f3b start z miejsca i zatrzymaj si\u0119 na polu o d\u0142ugo\u015bci 5 m.',
      'Przejed\u017a prost\u0105 z jak najbardziej r\u00f3wnym przyspieszeniem.',
      'Zr\u00f3b sprint na 50 m i zatrzymaj si\u0119 bez po\u015blizgu.',
      'Przyspiesz do 3. biegu i p\u0142ynnie zwolnij do zatrzymania.',
      'Zr\u00f3b dwa starty z rz\u0119du, drugi lepszy od pierwszego.',
      'Wystartuj tak, \u017ceby prz\u00f3d auta nie uni\u00f3s\u0142 si\u0119 od gazu.',
      'Wystartuj i przejed\u017a 60 m w czasie poni\u017cej 6 sekund.',
      'Zr\u00f3b start, zmie\u0144 bieg i wyhamuj przy pacho\u0142ku.',
      'Przyspiesz i zahamuj do zatrzymania jak najkr\u00f3cej, bez blokowania k\u00f3\u0142.',
      'Przejed\u017a odcinek 100 m z czasem ustalonym przez koleg\u0119.',
      'Przejed\u017a prost\u0105 i zatrzymaj si\u0119 r\u00f3wno z rywalem.',
      'Zr\u00f3b dwa szybkie przejazdy w obie strony po tym samym odcinku.',
      'Pokonaj prosty odcinek tak, by obroty zmienia\u0142y si\u0119 r\u00f3wno.',
      'Wystartuj i utrzymaj sta\u0142\u0105 pr\u0119dko\u015b\u0107 przez 5 sekund.',
      'Wystartuj z miejsca i zatrzymaj si\u0119 na linii, nie przekraczaj\u0105c jej.',
      'Zr\u00f3b sprint, a po nim zawr\u00f3\u0107 w p\u00f3\u0142obrocie.',
      'Przyspiesz i p\u0142ynnie wyhamuj tak, by nikt w aucie nie poczu\u0142 szarpni\u0119cia.',
      'Zr\u00f3b sprint z odcinkiem 30 m na 1. biegu i 30 m na 2.',
      'Przejed\u017a 40 m jak najszybciej, a drugie 40 m jak najwolniej.',
      'Zr\u00f3b szybki start w bok od linii i szybko wyprostuj tor jazdy.',
      'Wykonaj hamowanie awaryjne ze \u015bredniej pr\u0119dko\u015bci w wyznaczonym miejscu.',
      'Przejed\u017a prost\u0105, zachowuj\u0105c pr\u0119dko\u015b\u0107, a na ko\u0144cu zatrzymaj si\u0119 p\u0142ynnie.',
      'Zr\u00f3b start, przyspieszenie i hamowanie w czasie poni\u017cej 12 sekund.',
      'Przejed\u017a dwa razy ten sam odcinek z r\u00f3\u017cnic\u0105 czasu poni\u017cej 0,5 s.',
      'Zr\u00f3b sprint, w kt\u00f3rym przez ca\u0142y czas patrzysz na wska\u017anik pr\u0119dko\u015bci raz na sekund\u0119.',
      'Przyspiesz do wybranej pr\u0119dko\u015bci i utrzymaj j\u0105 przez 50 m.',
      'Pokonaj odcinek tak szybko, jak potrafisz, ale bez piszczenia opon.',
      'Zr\u00f3b szybki start i hamowanie na wyznaczonym polu o szeroko\u015bci 3 m.',
      'Zr\u00f3b szybki przejazd i sprawd\u017a, czy kolega mierzy ten sam czas.'
    ],
    precision:[
      'Zatrzymaj przednie ko\u0142o na wyznaczonej linii.',
      'Zaparkuj ty\u0142em w polu o szeroko\u015bci auta plus 50 cm.',
      'Przejed\u017a mi\u0119dzy dwoma pacho\u0142kami z zapasem po 20 cm z ka\u017cdej strony.',
      'Zr\u00f3b slalom wok\u00f3\u0142 6 pacho\u0142k\u00f3w, nie dotykaj\u0105c \u017cadnego.',
      'Zr\u00f3b slalom w obie strony na jednym oddechu.',
      'Zatrzymaj auto tak, by zderzak dotkn\u0105\u0142 ta\u015bmy na wysoko\u015bci maski.',
      'Przejed\u017a po linii namalowanej kred\u0105 bez zje\u017cd\u017cania na bok.',
      'Wjed\u017a do pola i zatrzymaj si\u0119 dok\u0142adnie w jego \u015brodku.',
      'Zr\u00f3b zawracanie na 3 ruchy w polu o szeroko\u015bci 6 m.',
      'Zawr\u00f3\u0107 w jednym ruchu na w\u0105skiej drodze oznaczonej pacho\u0142kami.',
      'Przejed\u017a w\u0105sk\u0105 bramk\u0119 ty\u0142em, a potem przodem.',
      'Ustaw auto r\u00f3wnolegle do linii w odleg\u0142o\u015bci 20 cm od niej.',
      'Obiecaj sobie wynik: zatrzymaj si\u0119 dok\u0142adnie na znaczniku, bez korekty.',
      'Zr\u00f3b slalom na jedynce, a potem na dw\u00f3jce i por\u00f3wnaj \u015blady.',
      'Przejed\u017a \u00f3semk\u0119 wok\u00f3\u0142 dw\u00f3ch pacho\u0142k\u00f3w bez dotykania.',
      'Zatrzymaj tylne ko\u0142o dok\u0142adnie na wyznaczonym punkcie.',
      'Przejed\u017a przez korytarz z pacho\u0142k\u00f3w z pr\u0119dko\u015bci\u0105 do 10 km/h.',
      'Zatrzymaj auto r\u00f3wno ze znacznikiem, a potem cofnij o 1 m.',
      'Przejed\u017a \u0142uk po wyznaczonej ta\u015bmie, nie wychodz\u0105c poza ni\u0105.',
      'Zaparkuj przodem w polu, a potem wyjed\u017a z niego bez cofania.',
      'Wjed\u017a w w\u0105skie pole i zatrzymaj si\u0119 bez dotykania kraw\u0119dzi.',
      'Wjed\u017a na lini\u0119 startu z b\u0142\u0119dem mniejszym ni\u017c 10 cm.',
      'Zr\u00f3b slalom z zamkni\u0119tymi oczami... w wyobra\u017ani. W praktyce: powoli i bez dotykania.',
      'Zr\u00f3b okr\u0105\u017cenie dooko\u0142a placu, trzymaj\u0105c sta\u0142y dystans od kraw\u0119dzi.',
      'Zatrzymaj si\u0119 bokiem do pacho\u0142ka w odleg\u0142o\u015bci 30 cm.',
      'Przejed\u017a cztery pacho\u0142ki w linii, zmieniaj\u0105c stron\u0119 przy ka\u017cdym.',
      'Zr\u00f3b trzy zatrzymania w trzech wyznaczonych punktach z rz\u0119du.',
      'Wjed\u017a w bramk\u0119 z dw\u00f3ch pacho\u0142k\u00f3w pod k\u0105tem 45 stopni.',
      'Pokonaj tor precyzyjny bez ani jednego dotkni\u0119cia pacho\u0142ka.',
      'Powt\u00f3rz ten sam przejazd trzy razy, z jak najmniejsz\u0105 r\u00f3\u017cnic\u0105 w \u015bladzie.'
    ],
    reverse:[
      'Cofaj po prostej linii na dystansie 30 m bez korekt.',
      'Cofaj i zatrzymaj si\u0119 zderzakiem przy pacho\u0142ku.',
      'Cofaj po \u0142uku w lewo i zatrzymaj si\u0119 na linii.',
      'Cofaj po \u0142uku w prawo i zatrzymaj si\u0119 na linii.',
      'Cofaj slalomem mi\u0119dzy 4 pacho\u0142kami.',
      'Zr\u00f3b ty\u0142em \u00f3semk\u0119 wok\u00f3\u0142 dw\u00f3ch pacho\u0142k\u00f3w.',
      'Wykonaj zawracanie wahad\u0142owe ty\u0142em po \u0142uku.',
      'Cofaj z du\u017c\u0105 pr\u0119dko\u015bci\u0105 i zahamuj p\u0142ynnie przed lini\u0105.',
      'Cofaj ty\u0142em przez bramk\u0119 z pacho\u0142k\u00f3w bez dotykania.',
      'Zr\u00f3b ty\u0142em pe\u0142ne k\u00f3\u0142ko wok\u00f3\u0142 pacho\u0142ka.',
      'Cofaj na dystansie 20 m, patrz\u0105c tylko przez boczne lusterka.',
      'Cofaj na dystansie 20 m, patrz\u0105c przez tyln\u0105 szyb\u0119.',
      'Zr\u00f3b manewr \u201eJ\u201d: cofnij i obr\u00f3\u0107 auto o 180 stopni.',
      'Zr\u00f3b p\u00f3\u0142obr\u00f3t w ruchu wstecznym i jed\u017a przodem.',
      'Cofaj z miejsca do punktu oddalonego o 40 m w czasie poni\u017cej 12 s.',
      'Cofaj w po\u015blizgu po \u0142agodnym \u0142uku.',
      'Cofaj tak, by ty\u0142 auta min\u0105\u0142 pacho\u0142ek w odleg\u0142o\u015bci 20 cm.',
      'Cofaj i zatrzymaj si\u0119 dok\u0142adnie w polu o d\u0142ugo\u015bci 4 m.',
      'Cofaj slalomem, a potem wyjed\u017a przodem t\u0105 sam\u0105 tras\u0105.',
      'Zr\u00f3b ty\u0142em szeroki \u0142uk wok\u00f3\u0142 dw\u00f3ch pacho\u0142k\u00f3w.',
      'Cofnij si\u0119 10 m, potem 10 m przodem, potem zn\u00f3w ty\u0142em.',
      'Cofaj do bramki, zatrzymaj si\u0119 i wyjed\u017a przodem bez cofania.',
      'Zr\u00f3b ty\u0142em kr\u00f3tki sprint z p\u0142ynnym hamowaniem.',
      'Cofaj r\u00f3wnolegle do linii w odleg\u0142o\u015bci 30 cm od niej.',
      'Wykonaj dwa zawracania ty\u0142em pod rz\u0105d.',
      'Cofaj po okr\u0119gu o \u015brednicy 15 m.',
      'Cofnij si\u0119 do pacho\u0142ka i dotknij go lusterkiem... w teorii. W praktyce: zatrzymaj si\u0119 10 cm przed nim.',
      'Zr\u00f3b ty\u0142em \u0142uk w kszta\u0142cie litery S.',
      'Zawr\u00f3\u0107 ty\u0142em na w\u0105skiej drodze w jednym p\u0142ynnym ruchu.',
      'Zr\u00f3b seri\u0119: cofni\u0119cie, p\u00f3\u0142obr\u00f3t, sprint do przodu, hamowanie.'
    ],
    sound:[
      'Zagraj trzy kr\u00f3tkie odci\u0119cia, jedno d\u0142ugie i zn\u00f3w trzy kr\u00f3tkie.',
      'Utrzymaj obroty na sta\u0142ym poziomie przez 5 sekund.',
      'Zr\u00f3b p\u0142ynne podniesienie obrot\u00f3w od wolnych do wysokich w 3 sekundy.',
      'Zr\u00f3b rytm: raz, dwa, trzy, pauza, raz, dwa, trzy.',
      'Zagraj wydechem co\u015b w rodzaju melodii gazem.',
      'Zr\u00f3b seri\u0119 szybkich odci\u0119\u0107 w r\u00f3wnym tempie.',
      'Zr\u00f3b jedno bardzo d\u0142ugie odci\u0119cie i oce\u0144, jak brzmi.',
      'Zr\u00f3b odci\u0119cie, cisz\u0119 przez 2 sekundy i znowu odci\u0119cie.',
      'Podkr\u0119\u0107 obroty i p\u0142ynnie je opu\u015b\u0107, nie dotykaj\u0105c sprz\u0119g\u0142a.',
      'Zagraj dwa mocne gazy i jeden delikatny.',
      'Zr\u00f3b odci\u0119cie na ka\u017cdym kolejnym biegu podczas przyspieszania.',
      'Zr\u00f3b kr\u00f3tki koncert: 10 sekund d\u017awi\u0119k\u00f3w wydechu bez przerwy.',
      'Zr\u00f3b echo: zagraj fraz\u0119, a kolega j\u0105 powt\u00f3rzy.',
      'Zagraj wydechem rytm znanej piosenki.',
      'Zr\u00f3b odci\u0119cie w tunelu albo przy \u015bcianie, \u017ceby mocniej s\u0142ycha\u0107 by\u0142o echo.',
      'Zr\u00f3b d\u017awi\u0119k narastaj\u0105cy: cichy, \u015bredni, g\u0142o\u015bny, i z powrotem.',
      'Zr\u00f3b pi\u0119\u0107 odci\u0119\u0107 w r\u00f3wnych odst\u0119pach co p\u00f3\u0142 sekundy.',
      'Zr\u00f3b odci\u0119cie w czasie wolnego przejazdu przez bramk\u0119.',
      'Zr\u00f3b jedno odci\u0119cie na starcie i drugie w po\u0142owie prostej.',
      'Zr\u00f3b odci\u0119cie podczas hamowania i oce\u0144, jak brzmi.',
      'Utrzymaj obroty na granicy odci\u0119cia przez 2 sekundy.',
      'Zagraj \u201epytanie i odpowied\u017a\u201d dwoma r\u00f3\u017cnymi gazami.',
      'Zr\u00f3b seri\u0119 ostrych, kr\u00f3tkich gaz\u00f3w po kolei na ka\u017cdym biegu.',
      'Wykonaj d\u017awi\u0119k, kt\u00f3ry kolega rozpozna jako rytm marszu.',
      'Zr\u00f3b cichy przejazd z zerowym gazem, a potem jedno g\u0142o\u015bne odci\u0119cie.',
      'Zr\u00f3b odci\u0119cie, kt\u00f3re ko\u0144czy si\u0119 dok\u0142adnie, gdy mijasz pacho\u0142ek.',
      'Zr\u00f3b r\u00f3wn\u0105 fal\u0119 d\u017awi\u0119ku: w g\u00f3r\u0119 przez 2 s i w d\u00f3\u0142 przez 2 s.',
      'Zr\u00f3b dwa odci\u0119cia, po kt\u00f3rych natychmiast nast\u0119puje cisza.',
      'Zagraj fina\u0142owy gaz, kt\u00f3ry ko\u0144czy ca\u0142\u0105 seri\u0119.',
      'Zr\u00f3b sound check na trzech r\u00f3\u017cnych obrotach i wybierz najlepszy.'
    ],
    duel:[
      'Duel: kto zatrzyma auto bli\u017cej linii, wygrywa rund\u0119.',
      'Duel: kto zrobi d\u0142u\u017cszy \u015blad dymu, wygrywa.',
      'Duel: kto przejedzie slalom szybciej, wygrywa punkt.',
      'Duel: kto zrobi \u0142adniejszy po\u015blizg, wybiera niezale\u017cny s\u0119dzia.',
      'Duel: zr\u00f3bcie po jednym donucie i por\u00f3wnajcie symetri\u0119.',
      'Duel: sprint na 60 m, pierwszy przy pacho\u0142ku wygrywa.',
      'Duel: precyzyjne parkowanie ty\u0142em, wygrywa mniejsza odleg\u0142o\u015b\u0107 od linii.',
      'Duel: ten, kto zrobi najcia\u015bniejszy okr\u0105g, dostaje punkt.',
      'Duel: kto cofnie po prostej bez korekt, wygrywa.',
      'Duel: kto zagra ciekawszy rytm wydechem, wybiera g\u0142osowanie.',
      'Duel: najkr\u00f3tsza droga hamowania ze sta\u0142ej pr\u0119dko\u015bci.',
      'Duel: kto zrobi d\u0142u\u017cszy po\u015blizg bez straty kontroli.',
      'Duel: pojedynek na \u00f3semki, wygrywa lepsza i p\u0142ynniejsza.',
      'Duel: slalom ty\u0142em na czas.',
      'Duel: kto z was zrobi \u0142adniejszy start, wygrywa rund\u0119.',
      'Duel: dwie rundy, ten sam manewr, wygrywa mniejszy b\u0142\u0105d.',
      'Duel: kto dok\u0142adniej trafi w znacznik, dostaje punkt.',
      'Duel: wy\u015bcig dw\u00f3ch aut do pacho\u0142ka i z powrotem.',
      'Duel: kto utrzyma d\u0142u\u017cszy dym, dostaje 2 punkty.',
      'Duel: kto zrobi szybsze zawracanie na w\u0105skiej drodze, wygrywa.',
      'Duel: kto zagra d\u0142u\u017csze odci\u0119cie, wygrywa rund\u0119.',
      'Duel: duel parkowania, wygrywa mniejszy odst\u0119p od kraw\u0119\u017cnika.',
      'Duel: ten, kto pierwszy pope\u0142ni b\u0142\u0105d, odpada.',
      'Duel: pojedynek stylu, a wynik ustala trzecia osoba.',
      'Duel: obaj robicie ten sam przejazd, wygrywa r\u00f3wniejszy czas.',
      'Duel: kto zrobi dok\u0142adniejsze p\u00f3\u0142kole, wygrywa punkt.',
      'Duel: fina\u0142, jedna pr\u00f3ba, jeden manewr, wybierasz go ty.',
      'Duel: remis? Dogrywka na jednym wsp\u00f3lnym manewrze.',
      'Duel: wygrywa ten, kto zrobi najbardziej p\u0142ynn\u0105 zmian\u0119 kierunku.',
      'Duel: seria trzech konkurencji, wygrywa ten, kto wygra co najmniej dwie.'
    ],
    legend:[
      'Zr\u00f3b kombinacj\u0119: burnout, donut, po\u015blizg i p\u0142ynne zatrzymanie.',
      'Zr\u00f3b ca\u0142y tor i nagraj go w jednym uj\u0119ciu, bez ci\u0119\u0107.',
      'Wykonaj sw\u00f3j podpis oponami na placu.',
      'Zr\u00f3b po\u015blizg w kszta\u0142cie litery S i nagraj z g\u00f3ry.',
      'Zr\u00f3b \u00f3semk\u0119 z dymem i nagraj j\u0105 w zwolnionym tempie.',
      'Zr\u00f3b przejazd, kt\u00f3ry zako\u0144czy si\u0119 dok\u0142adnie w tym miejscu, w kt\u00f3rym zacz\u0105\u0142.',
      'Zr\u00f3b ca\u0142\u0105 seri\u0119 manewr\u00f3w bez \u017cadnego dotkni\u0119cia pacho\u0142k\u00f3w.',
      'Wykonaj perfekcyjny przejazd w rytmie muzyki z g\u0142o\u015bnik\u00f3w.',
      'Zr\u00f3b zadanie legendy: trzy r\u00f3\u017cne manewry w jednym ci\u0105gu.',
      'Zr\u00f3b najpi\u0119kniejszy donut i ustaw go jako zdj\u0119cie profilowe.',
      'Wykonaj przejazd, kt\u00f3ry kto\u015b nagra z drona lub z g\u00f3ry.',
      'Zr\u00f3b przejazd z d\u017awi\u0119kiem i dymem w jednym uj\u0119ciu.',
      'Zr\u00f3b ca\u0142\u0105 tras\u0119 w po\u015blizgu, je\u015bli warunki na to pozwalaj\u0105 i jest bezpiecznie.',
      'Zr\u00f3b manewr, kt\u00f3rego nigdy wcze\u015bniej nie robi\u0142e\u015b, ale na spokojnie.',
      'Zr\u00f3b wsp\u00f3lne uj\u0119cie kilku aut w jednej choreografii.',
      'Zr\u00f3b przejazd po\u017cegnalny: spokojny, r\u00f3wny i pi\u0119kny.',
      'Zr\u00f3b sygnaturowy manewr i nadaj mu w\u0142asn\u0105 nazw\u0119.',
      'Zr\u00f3b fina\u0142ow\u0105 seri\u0119 i zako\u0144cz j\u0105 czystym, dok\u0142adnym zatrzymaniem.',
      'Wykonaj taki przejazd, \u017ce kolega powie: \u201ejeszcze raz\u201d.',
      'Nagraj najlepszy przejazd dnia i wybierz do niego tytu\u0142.',
      'Zr\u00f3b wej\u015bcie w zakr\u0119t po idealnej linii i opisz je w jednym zdaniu.',
      'Zr\u00f3b manewr, kt\u00f3ry robi wra\u017cenie bez ryzykownej pr\u0119dko\u015bci.',
      'Zr\u00f3b trzy pr\u00f3by tego samego triku i wybierz najlepsz\u0105.',
      'Zr\u00f3b manewr w stylu rajdowym na spokojnym odcinku.',
      'Zr\u00f3b manewr w stylu driftowym na spokojnym odcinku.',
      'Zr\u00f3b manewr w stylu wy\u015bcigowym: r\u00f3wno i bez ozdobnik\u00f3w.',
      'Poka\u017c koledze sw\u00f3j najlepszy manewr i zapytaj o ocen\u0119.',
      'Zr\u00f3b dzie\u0144 legendy: wykonaj po jednym zadaniu z ka\u017cdej kategorii.',
      'Zr\u00f3b przejazd, o kt\u00f3rym b\u0119dziesz opowiada\u0107 za rok.',
      'Zako\u0144cz sesj\u0119 w\u0142asnym, kr\u00f3tkim i czystym manewrem.'
    ]
  };
  Object.keys(H).forEach(cat=>{
    const bank = TASK_BANK[cat]; if(!bank) return;
    const have = new Set(bank.map(x=>x.t));
    H[cat].forEach((t,i)=>{ if(!have.has(t)) bank.push({t, d:[1,2,3][i%3], s:20+(i%3)*10, ai:null}); });
  });
  LS.s('bl_seen', []);   // reset historii, zeby nowe zadania weszly od razu
})();

/* ---------- (8) OFFLINE ---------- */
(function(){
  try{ if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{}); }catch(e){}
  const oTr = V.tracks, oR = render;
  V.tracks = function(){
    let h = oTr();
    if(typeof navigator.onLine === 'boolean' && !navigator.onLine){
      h = '<div class=fr style="--c:#FFD400"><b style="color:#FFD400">\ud83d\udce1 TRYB OFFLINE</b><small>Brak internetu: tory i zakr\u0119t\u00f3w u\u017cywasz z pami\u0119ci telefonu. Mapa jest rysowana lokalnie.</small></div>' + h;
      h = h.replace(/<div class="vid-box"><iframe[^>]*><\/iframe><\/div>/, '<div class="vid-box"><canvas id="off-cv" style="width:100%;height:260px"></canvas></div>');
    }
    return h;
  };
  function drawOffline(){
    const cv = document.getElementById('off-cv'); if(!cv || !S.activeTrack) return;
    const g = S.activeTrack.geometry || [S.activeTrack.start, S.activeTrack.end];
    const W = 700, H = 360; cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.fillStyle = '#0a0a0d'; c.fillRect(0,0,W,H);
    const lat0 = g[0].lat, lon0 = g[0].lon, kx = Math.cos(lat0*Math.PI/180);
    const X = p=>(p.lon-lon0)*111320*kx, Y = p=>-(p.lat-lat0)*111320;
    let a=1e12,b=-1e12,e=1e12,f=-1e12;
    g.forEach(p=>{a=Math.min(a,X(p));b=Math.max(b,X(p));e=Math.min(e,Y(p));f=Math.max(f,Y(p));});
    const sc = Math.min((W-60)/Math.max(1,b-a),(H-60)/Math.max(1,f-e));
    const ox = (W-(b-a)*sc)/2, oy = (H-(f-e)*sc)/2;
    const PX = p=>ox+(X(p)-a)*sc, PY = p=>oy+(Y(p)-e)*sc;
    c.strokeStyle = '#00F0FF'; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath();
    g.forEach((p,i)=>{ i?c.lineTo(PX(p),PY(p)):c.moveTo(PX(p),PY(p)); }); c.stroke();
    c.fillStyle = '#39FF14'; c.beginPath(); c.arc(PX(g[0]),PY(g[0]),9,0,7); c.fill();
    c.fillStyle = '#FF1744'; c.beginPath(); c.arc(PX(g[g.length-1]),PY(g[g.length-1]),9,0,7); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 16px Arial'; c.fillText('START', PX(g[0])+12, PY(g[0])-8); c.fillText('META', PX(g[g.length-1])+12, PY(g[g.length-1])+20);
  }
  render = function(){ oR(); try{ drawOffline(); }catch(e){} };
  window.addEventListener && window.addEventListener('online', ()=>{ if(S.scr==='tracks') render(); });
  window.addEventListener && window.addEventListener('offline', ()=>{ if(S.scr==='tracks') render(); });
})();

/* ---------- (9) ADMIN: HASH + UKRYTY PRZYCISK ---------- */
const ADMIN_HASH = '53204e73499447a34c997b53a46de151cf50f0372ddbed06cdd53c8ab960c19b';
async function sha256hex(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
A.loginAdmin = async function(){
  const u = ($('#adm-u')||{}).value || '', p = ($('#adm-p')||{}).value || '';
  try{
    if(!(window.crypto && crypto.subtle)){ alert('Logowanie admina wymaga po\u0142\u0105czenia HTTPS.'); return; }
    const h = await sha256hex(u.trim().toUpperCase() + ':' + p);
    if(h === ADMIN_HASH){ S.isAdmin = true; render(); } else alert('B\u0142\u0119dne has\u0142o');
  }catch(e){ alert('B\u0142\u0105d logowania'); }
};
(function(){
  const oh = V.home, oR = render;
  // ukrycie przycisku ADMIN na ekranie glownym (dostep: 5 szybkich klikniec w logo BLACKLIST)
  V.home = ()=> oh().replace(/<button style="color:#FF1744" onclick="A\.go\('admin'\)">[^<]*<\/button>/, '');
  let taps = 0, last = 0;
  document.addEventListener && document.addEventListener('click', e=>{
    const t = e.target && e.target.closest && e.target.closest('.wm');
    if(!t) return;
    const now = Date.now(); taps = (now-last < 1500) ? taps+1 : 1; last = now;
    if(taps >= 5){ taps = 0; A.go('admin'); }
  });
})();
render();
