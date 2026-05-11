// ============================================================
// EV Cost Calculator — script.js
// ============================================================

// --- EV DATABASE (single source of truth) ---
const EV_DATABASE = [
  { name: 'Tesla Model 3 SR+',         battery: 60,    range: 415, maxCharge: 170 },
  { name: 'Tesla Model 3 Long Range',   battery: 82,    range: 560, maxCharge: 250 },
  { name: 'Tesla Model Y LR',           battery: 82,    range: 533, maxCharge: 250 },
  { name: 'Tesla Model S Plaid',        battery: 100,   range: 600, maxCharge: 250 },
  { name: 'VW ID.3 Pro',               battery: 58,    range: 425, maxCharge: 100 },
  { name: 'VW ID.3 Pro S',             battery: 77,    range: 549, maxCharge: 135 },
  { name: 'VW ID.4 Pro',               battery: 77,    range: 521, maxCharge: 135 },
  { name: 'BMW iX3',                   battery: 80,    range: 458, maxCharge: 150 },
  { name: 'BMW i4 M50',                battery: 83.9,  range: 510, maxCharge: 205 },
  { name: 'Hyundai IONIQ 5 LR RWD',   battery: 77.4,  range: 507, maxCharge: 233 },
  { name: 'Hyundai IONIQ 6 LR RWD',   battery: 77.4,  range: 614, maxCharge: 233 },
  { name: 'Kia EV6 LR RWD',           battery: 77.4,  range: 528, maxCharge: 233 },
  { name: 'Kia EV6 GT',               battery: 77.4,  range: 424, maxCharge: 233 },
  { name: 'Mercedes EQS 450+',         battery: 107.8, range: 770, maxCharge: 200 },
  { name: 'Mercedes EQA 250',          battery: 66.5,  range: 426, maxCharge: 100 },
  { name: 'Audi Q4 e-tron 40',         battery: 82,    range: 520, maxCharge: 135 },
  { name: 'Peugeot e-208',             battery: 50,    range: 362, maxCharge: 100 },
  { name: 'Renault Megane E-Tech',      battery: 60,    range: 450, maxCharge: 130 },
  { name: 'Renault Zoe',               battery: 52,    range: 395, maxCharge: 50  },
  { name: 'Nissan Leaf e+',            battery: 62,    range: 385, maxCharge: 100 },
  { name: 'Skoda Enyaq 80',            battery: 82,    range: 534, maxCharge: 135 },
  { name: 'CUPRA Born 58',             battery: 58,    range: 424, maxCharge: 100 },
  { name: 'Fiat 500e',                 battery: 42,    range: 320, maxCharge: 85  },
  { name: 'Volvo C40 Recharge',        battery: 78,    range: 476, maxCharge: 150 },
  { name: 'Polestar 2 LR',             battery: 82,    range: 551, maxCharge: 205 },
  { name: 'Opel Mokka-e',              battery: 50,    range: 324, maxCharge: 100 },
  { name: 'MG4 Standard',              battery: 51,    range: 350, maxCharge: 117 },
  { name: 'BYD Atto 3',               battery: 60.5,  range: 420, maxCharge: 80  },
  { name: 'Dacia Spring',              battery: 26.8,  range: 220, maxCharge: 30  },
  { name: 'Toyota bZ4X AWD',           battery: 72.8,  range: 411, maxCharge: 150 },
];

// --- CHARGING NETWORKS (prices in EUR) ---
const CHARGING_NETWORKS = [
  {
    id: 'tesla_sc',
    name: 'Tesla Supercharger',
    type: 'ultra',
    power: '250 kW',
    dot: '#ef4444',
    basePrice: 0.55,
    badge: 'badge-ultra',
    cities: 'София (Megapark, Ring Mall), Пловдив (Markovo Tepe Mall)',
  },
  {
    id: 'ekofini',
    name: 'Еко Фини (eFini)',
    type: 'fast',
    power: '50–150 kW',
    dot: '#10b981',
    basePrice: 0.38,
    badge: 'badge-fast',
    cities: 'София, Пловдив, Варна, Бургас, Русе, Стара Загора, Плевен, Шумен, Благоевград',
  },
  {
    id: 'electrip',
    name: 'Electrip',
    type: 'fast',
    power: '50–120 kW',
    dot: '#3b82f6',
    basePrice: 0.40,
    badge: 'badge-fast',
    cities: 'София (multiple), Пловдив, Варна, Бургас, Велико Търново, Благоевград, Разград',
  },
  {
    id: 'eldrive',
    name: 'Eldrive',
    type: 'fast',
    power: '50 kW',
    dot: '#8b5cf6',
    basePrice: 0.36,
    badge: 'badge-fast',
    cities: 'София, Пловдив, Варна, Бургас, Русе, Ст. Загора, Плевен, Видин, Монтана, Сливен, Ямбол, Хасково, Кърджали, Смолян, Кюстендил, Перник, Габрово, Ловеч, Търговище, Силистра, Разград, Добрич',
  },
  {
    id: 'evn',
    name: 'EVN Charging',
    type: 'normal',
    power: '22 kW',
    dot: '#f59e0b',
    basePrice: 0.28,
    badge: 'badge-normal',
    cities: 'Хасково, Кърджали, Смолян, Пазарджик',
  },
];

const WEATHER_MODIFIERS = {
  sunny:  { label: '☀️ Слънчево',        modifier: 1.00, icon: '☀️' },
  cloudy: { label: '🌤 Облачно',          modifier: 1.03, icon: '🌤' },
  rainy:  { label: '🌧 Дъжд',             modifier: 1.07, icon: '🌧' },
  cold:   { label: '❄️ Студено под 5°C',  modifier: 1.18, icon: '❄️' },
  snow:   { label: '🌨 Сняг',             modifier: 1.25, icon: '🌨' },
};

const TRAFFIC_MODIFIERS = {
  free:     { label: 'Без трафик',     modifier: 1.00 },
  moderate: { label: 'Умерен трафик',  modifier: 1.08 },
  heavy:    { label: 'Тежък трафик',   modifier: 1.18 },
};

const DRIVING_STYLE_MODIFIERS = {
  eco:    { label: 'Икономично', modifier: 0.92 },
  normal: { label: 'Нормално',   modifier: 1.00 },
  sport:  { label: 'Спортно',    modifier: 1.15 },
};

const CITY_COORDS = {
  'София':          [42.6977, 23.3219],
  'Варна':          [43.2141, 27.9147],
  'Пловдив':        [42.1354, 24.7453],
  'Бургас':         [42.5048, 27.4626],
  'Стара Загора':   [42.4258, 25.6345],
  'Велико Търново': [43.0757, 25.6172],
  'Плевен':         [43.4170, 24.6069],
  'Русе':           [43.8356, 25.9657],
  'Видин':          [43.9913, 22.8716],
  'Шумен':          [43.2709, 26.9224],
  'Добрич':         [43.5728, 27.8279],
  'Монтана':        [43.4082, 23.2252],
  'Враца':          [43.2018, 23.5503],
  'Ловеч':          [43.1362, 24.7139],
  'Габрово':        [42.8742, 25.3187],
  'Търговище':      [43.2479, 26.5688],
  'Разград':        [43.5257, 26.5239],
  'Силистра':       [44.1178, 27.2614],
  'Кърджали':       [41.6486, 25.3744],
  'Хасково':        [41.9346, 25.5556],
  'Пазарджик':      [42.1935, 24.3333],
  'Сливен':         [42.6833, 26.3167],
  'Ямбол':          [42.4836, 26.5028],
  'Перник':         [42.6048, 23.0375],
  'Благоевград':    [42.0175, 23.0994],
  'Кюстендил':      [42.2842, 22.6908],
  'Смолян':         [41.5760, 24.7010],
  'Асеновград':     [41.9867, 24.8725],
};

const BG_CHARGING_STATIONS = [
  { name: 'Tesla Supercharger — Megapark, София',         lat: 42.6276, lng: 23.3784, network: 'Tesla',       power: '250 kW' },
  { name: 'Tesla Supercharger — Ring Mall, София',        lat: 42.6590, lng: 23.2780, network: 'Tesla',       power: '250 kW' },
  { name: 'Tesla Supercharger — Markovo Tepe, Пловдив',   lat: 42.1511, lng: 24.7490, network: 'Tesla',       power: '250 kW' },
  { name: 'Еко Фини — София',                             lat: 42.6977, lng: 23.3219, network: 'Еко Фини',    power: '50 kW' },
  { name: 'Еко Фини — Варна',                             lat: 43.2141, lng: 27.9147, network: 'Еко Фини',    power: '50 kW' },
  { name: 'Еко Фини — Пловдив',                           lat: 42.1354, lng: 24.7453, network: 'Еко Фини',    power: '50 kW' },
  { name: 'Еко Фини — Бургас',                            lat: 42.5048, lng: 27.4626, network: 'Еко Фини',    power: '50 kW' },
  { name: 'Еко Фини — Русе',                              lat: 43.8356, lng: 25.9657, network: 'Еко Фини',    power: '50 kW' },
  { name: 'Electrip — София (бул. Черни връх)',           lat: 42.6667, lng: 23.3100, network: 'Electrip',    power: '120 kW' },
  { name: 'Electrip — София (Интер Експо)',               lat: 42.6667, lng: 23.3969, network: 'Electrip',    power: '120 kW' },
  { name: 'Electrip — Пловдив',                           lat: 42.1400, lng: 24.7490, network: 'Electrip',    power: '50 kW' },
  { name: 'Electrip — Варна',                             lat: 43.2100, lng: 27.9100, network: 'Electrip',    power: '50 kW' },
  { name: 'Eldrive — НДК, София',                         lat: 42.6851, lng: 23.3189, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Бургас Мол',                         lat: 42.4893, lng: 27.4750, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Стара Загора',                       lat: 42.4257, lng: 25.6427, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Русе',                               lat: 43.8448, lng: 25.9533, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Плевен',                             lat: 43.4113, lng: 24.6197, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Добрич',                             lat: 43.5697, lng: 27.8279, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Видин',                              lat: 43.9907, lng: 22.8680, network: 'Eldrive',     power: '50 kW' },
  { name: 'Eldrive — Велико Търново',                     lat: 43.0757, lng: 25.6319, network: 'Eldrive',     power: '50 kW' },
  { name: 'EVN Charging — Хасково',                       lat: 41.9359, lng: 25.5638, network: 'EVN',         power: '22 kW' },
  { name: 'EVN Charging — Кърджали',                      lat: 41.6432, lng: 25.3712, network: 'EVN',         power: '22 kW' },
  { name: 'EVN Charging — Смолян',                        lat: 41.5771, lng: 24.7010, network: 'EVN',         power: '22 kW' },
];

// --- STATE ---
let selectedNetworks = new Set(['ekofini', 'eldrive', 'electrip']);
let _leafletMap = null;
let _lastResults = null; // for trip saving

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  renderNetworkCards();
  setupRangeInputs();
  setupCarParams();
  setupReturnDateToggle();
  setDefaultDates();
  setupEVSearch(); // home.html only
});

function setDefaultDates() {
  const el = document.getElementById('departDate');
  if (el) el.value = new Date().toISOString().split('T')[0];
}

// --- RETURN DATE TOGGLE ---
function setupReturnDateToggle() {
  const checkbox = document.getElementById('returnTripCheckbox');
  const dateWrap = document.getElementById('returnDateWrap');
  if (!checkbox || !dateWrap) return;

  checkbox.addEventListener('change', () => {
    dateWrap.style.display = checkbox.checked ? 'block' : 'none';
    if (!checkbox.checked) {
      document.getElementById('returnDate').value = '';
    } else {
      const depart = document.getElementById('departDate').value;
      if (depart) {
        const d = new Date(depart);
        d.setDate(d.getDate() + 3);
        document.getElementById('returnDate').value = d.toISOString().split('T')[0];
      }
    }
  });
}

// --- EV SEARCH (home.html) ---
function setupEVSearch() {
  const input = document.getElementById('evSearchInput');
  const dropdown = document.getElementById('evDropdown');
  const clearBtn = document.getElementById('evSearchClear');
  const badge = document.getElementById('evSelectedBadge');
  if (!input || !dropdown) return;

  let focusedIndex = -1;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    clearBtn && clearBtn.classList.toggle('visible', q.length > 0);
    if (!q) { dropdown.classList.remove('open'); return; }

    const matches = EV_DATABASE.filter(ev => ev.name.toLowerCase().includes(q));
    if (!matches.length) { dropdown.classList.remove('open'); return; }

    focusedIndex = -1;
    dropdown.innerHTML = matches.map((ev, i) => {
      const base = (ev.battery / ev.range * 100).toFixed(1);
      return `<div class="ev-dropdown-item" data-idx="${i}" data-name="${ev.name}" data-battery="${ev.battery}" data-range="${ev.range}" data-maxcharge="${ev.maxCharge}">
        <div class="ev-item-name">${ev.name}</div>
        <div class="ev-item-specs">${ev.battery} kWh · ${ev.range} км WLTP · ${ev.maxCharge} kW · ${base} kWh/100км</div>
      </div>`;
    }).join('');

    dropdown.classList.add('open');

    dropdown.querySelectorAll('.ev-dropdown-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectEVFromDropdown(item);
      });
    });
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.ev-dropdown-item');
    if (!items.length || !dropdown.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); focusedIndex = Math.min(focusedIndex + 1, items.length - 1); highlightItem(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusedIndex = Math.max(focusedIndex - 1, 0); highlightItem(items); }
    else if (e.key === 'Enter' && focusedIndex >= 0) { e.preventDefault(); selectEVFromDropdown(items[focusedIndex]); }
    else if (e.key === 'Escape') { dropdown.classList.remove('open'); }
  });

  function highlightItem(items) {
    items.forEach((it, i) => it.classList.toggle('focused', i === focusedIndex));
    if (focusedIndex >= 0) items[focusedIndex].scrollIntoView({ block: 'nearest' });
  }

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  clearBtn && clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    dropdown.classList.remove('open');
    badge && badge.classList.remove('visible');
  });
}

function selectEVFromDropdown(item) {
  const battery = parseFloat(item.dataset.battery);
  const range = parseFloat(item.dataset.range);
  const maxCharge = parseFloat(item.dataset.maxcharge);
  const name = item.dataset.name;

  const bEl = document.getElementById('batteryCapacity');
  const rEl = document.getElementById('realRange');
  const pEl = document.getElementById('maxChargePower');
  if (bEl) bEl.value = battery;
  if (rEl) rEl.value = range;
  if (pEl) { pEl.value = Math.min(maxCharge, parseFloat(pEl.max)); pEl.dispatchEvent(new Event('input')); }

  const input = document.getElementById('evSearchInput');
  const dropdown = document.getElementById('evDropdown');
  const badge = document.getElementById('evSelectedBadge');
  const clearBtn = document.getElementById('evSearchClear');

  if (input) input.value = name;
  if (dropdown) dropdown.classList.remove('open');
  if (clearBtn) clearBtn.classList.add('visible');
  if (badge) {
    badge.innerHTML = `🚗 <strong>${name}</strong> — ${battery} kWh · ${range} км · ${maxCharge} kW`;
    badge.classList.add('visible');
  }

  document.getElementById('batteryCapacity')?.dispatchEvent(new Event('input'));
}

// --- CAR PARAMS ---
function setupCarParams() {
  const batteryInput = document.getElementById('batteryCapacity');
  const rangeInput = document.getElementById('realRange');
  const consumptionDisplay = document.getElementById('consumptionDisplay');

  function updateConsumption() {
    const battery = parseFloat(batteryInput?.value) || 0;
    const range = parseFloat(rangeInput?.value) || 1;
    if (consumptionDisplay) consumptionDisplay.textContent = (battery / range * 100).toFixed(1) + ' kWh/100км';
    updateChargeTime();
  }

  batteryInput?.addEventListener('input', updateConsumption);
  rangeInput?.addEventListener('input', updateConsumption);
  updateConsumption();
}

function updateChargeTime() {
  const battery = parseFloat(document.getElementById('batteryCapacity')?.value) || 0;
  const maxPower = parseFloat(document.getElementById('maxChargePower')?.value) || 1;
  const display = document.getElementById('chargeTimeDisplay');
  if (!display) return;
  if (!battery || !maxPower) { display.textContent = '— мин'; return; }
  display.textContent = Math.round((battery * 0.8) / maxPower * 60) + ' мин (от 20% до 100%)';
}

function getCarParams() {
  const batteryCapacity = parseFloat(document.getElementById('batteryCapacity')?.value) || 75;
  const realRange = parseFloat(document.getElementById('realRange')?.value) || 400;
  const carNameEl = document.getElementById('evSearchInput');
  const carName = (carNameEl && carNameEl.value.trim()) || 'Мой автомобил';
  const consumption = batteryCapacity / realRange * 100;
  const maxChargePower = parseFloat(document.getElementById('maxChargePower')?.value) || 150;
  return { carName, batteryCapacity, realRange, consumption, maxChargePower };
}

// --- NETWORK CARDS ---
function renderNetworkCards() {
  const container = document.getElementById('stationList');
  if (!container) return;

  container.innerHTML = `<div class="network-cards">` + CHARGING_NETWORKS.map(n => `
    <div class="network-card ${selectedNetworks.has(n.id) ? 'selected' : ''}"
         onclick="toggleNetwork('${n.id}')">
      <div class="network-card-dot" style="background:${n.dot}"></div>
      <div class="network-card-body">
        <div class="network-card-name">${n.name}</div>
        <div class="network-card-cities">${n.cities}</div>
        <div class="network-card-meta">
          <span class="station-badge ${n.badge}">${n.type.toUpperCase()}</span>
          <span style="font-size:0.7rem;color:var(--muted);font-family:var(--mono)">${n.power}</span>
          <span class="network-card-price">${n.basePrice.toFixed(2)} €/kWh</span>
        </div>
      </div>
      <div class="network-card-check">${selectedNetworks.has(n.id) ? '✓' : ''}</div>
    </div>
  `).join('') + `</div>`;
}

function toggleNetwork(id) {
  if (selectedNetworks.has(id)) {
    if (selectedNetworks.size > 1) selectedNetworks.delete(id);
  } else {
    selectedNetworks.add(id);
  }
  renderNetworkCards();
}

// Keep legacy toggleStation alias in case referenced from HTML
function toggleStation(id) { toggleNetwork(id); }

// --- RANGE INPUTS ---
function setupRangeInputs() {
  const rangeInputs = [
    { id: 'batteryLevel',      valId: 'batteryLevelVal',      suffix: '%' },
    { id: 'minArrivalCharge',  valId: 'minArrivalChargeVal',  suffix: '%' },
    { id: 'maxChargePower',    valId: 'maxChargePowerVal',    suffix: ' kW' },
  ];

  rangeInputs.forEach(({ id, valId, suffix }) => {
    const input = document.getElementById(id);
    const val = document.getElementById(valId);
    if (input && val) {
      val.textContent = input.value + suffix;
      input.addEventListener('input', () => {
        val.textContent = input.value + suffix;
        if (id === 'maxChargePower') updateChargeTime();
      });
    }
  });

  updateChargeTime();
}

// --- HAVERSINE ---
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- OSRM ROAD DISTANCE ---
async function fetchRoadDistance(origin, destination) {
  const originCoords = CITY_COORDS[origin];
  const destCoords = CITY_COORDS[destination];
  if (!originCoords || !destCoords) return null;
  const [lat1, lng1] = originCoords;
  const [lat2, lng2] = destCoords;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.routes && data.routes[0]) {
      const km = Math.round(data.routes[0].distance / 1000);
      const geometry = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return { km, geometry };
    }
    return null;
  } catch { return null; }
}

// --- ROUTE-AWARE CONSUMPTION ---
function deriveConsumptionProfiles(battery, range) {
  const base = (battery / range) * 100;
  return {
    city:    base * 1.12,
    mixed:   base * 1.00,
    highway: base * 1.38,
  };
}

function weightedConsumption(profiles, highwayPct) {
  const hw = Math.max(0, Math.min(100, highwayPct)) / 100;
  const mixed = 1 - hw;
  return profiles.highway * hw + profiles.mixed * mixed;
}

// --- BATTERY STATE HTML ---
function batteryStateHtml(kwh, capacity) {
  const pct = Math.round((kwh / capacity) * 100);
  const cls = pct > 40 ? 'green' : pct > 20 ? 'orange' : 'red';
  return `<span class="battery-state ${cls}">🔋 ${kwh.toFixed(1)} kWh (${pct}%)</span>`;
}

// --- CALCULATE ---
function calculate() {
  (async () => {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const departDate = document.getElementById('departDate').value;
    const returnChecked = document.getElementById('returnTripCheckbox')?.checked;
    const returnDate = returnChecked ? document.getElementById('returnDate').value : '';
    const batteryLevel = parseInt(document.getElementById('batteryLevel').value);
    const minArrivalCharge = parseInt(document.getElementById('minArrivalCharge').value);
    const weather = document.getElementById('weather').value;
    const traffic = document.getElementById('traffic').value;
    const drivingStyle = document.getElementById('drivingStyle').value;
    const highwayPct = parseInt(document.getElementById('highwayPct')?.value ?? 60);

    if (!origin || !destination) { showToast('⚠️ Моля, въведете начална и крайна точка!'); return; }
    if (!departDate) { showToast('⚠️ Моля, изберете дата на тръгване!'); return; }
    if (selectedNetworks.size === 0) { showToast('⚠️ Изберете поне една зарядна мрежа!'); return; }

    const car = getCarParams();
    if (!car.batteryCapacity || !car.realRange) { showToast('⚠️ Моля, въведете параметрите на автомобила!'); return; }

    showLoading(true);

    let baseDistance = null;
    let routeGeometry = null;
    const roadResult = await fetchRoadDistance(origin, destination);
    if (roadResult) {
      baseDistance = roadResult.km;
      routeGeometry = roadResult.geometry;
    } else {
      const originCoords = CITY_COORDS[origin];
      const destCoords = CITY_COORDS[destination];
      if (originCoords && destCoords) {
        baseDistance = Math.round(haversineKm(originCoords[0], originCoords[1], destCoords[0], destCoords[1]));
      } else {
        const hashStr = s => [...s].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
        baseDistance = 150 + (Math.abs(hashStr(origin + destination)) % 450);
      }
    }

    setTimeout(() => {
      const results = computeResults({
        origin, destination, departDate, returnDate,
        batteryLevel, minArrivalCharge, weather, traffic, drivingStyle,
        highwayPct, car, baseDistance,
      });
      _lastResults = results;
      renderResults(results);
      showLoading(false);
      document.getElementById('results').classList.add('visible');
      document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      showChargingMap(origin, destination, routeGeometry);
    }, 400);
  })();
}

// --- COMPUTE ---
function computeResults({ origin, destination, departDate, returnDate,
  batteryLevel, minArrivalCharge, weather, traffic, drivingStyle,
  highwayPct, car, baseDistance }) {

  const isRoundTrip = !!returnDate;
  const totalDistance = isRoundTrip ? baseDistance * 2 : baseDistance;

  const wMod = WEATHER_MODIFIERS[weather]?.modifier || 1;
  const tMod = TRAFFIC_MODIFIERS[traffic]?.modifier || 1;
  const dMod = DRIVING_STYLE_MODIFIERS[drivingStyle]?.modifier || 1;
  const totalMod = wMod * tMod * dMod;

  const profiles = deriveConsumptionProfiles(car.batteryCapacity, car.realRange);
  const baseAdj = weightedConsumption(profiles, highwayPct);
  const adjConsumption = baseAdj * totalMod;

  const totalKwh = (totalDistance / 100) * adjConsumption;
  const startKwh = (batteryLevel / 100) * car.batteryCapacity;
  const neededKwh = Math.max(0, totalKwh - startKwh);
  const usablePerCharge = (1 - minArrivalCharge / 100) * car.batteryCapacity;
  const chargeStops = Math.max(0, Math.ceil((totalKwh - startKwh) / usablePerCharge));

  const activeNetworks = CHARGING_NETWORKS.filter(n => selectedNetworks.has(n.id));

  const dateObj = departDate ? new Date(departDate) : new Date();
  const isWeekend = [0, 6].includes(dateObj.getDay());
  const isPeakHour = dateObj.getHours() >= 17 && dateObj.getHours() <= 20;
  const marketModifier = isWeekend ? 1.12 : isPeakHour ? 1.18 : 1.0;

  const networkCosts = activeNetworks.map(n => {
    const price = n.basePrice * marketModifier;
    const cost = neededKwh * price;
    return { ...n, adjustedPrice: price, totalCost: cost };
  }).sort((a, b) => a.totalCost - b.totalCost);

  const cheapest = networkCosts[0];
  const mostExpensive = networkCosts[networkCosts.length - 1];
  const avgCost = networkCosts.reduce((s, n) => s + n.totalCost, 0) / networkCosts.length;

  const petrolConsumption = 7.5;
  const petrolPrice = 2.45;
  const petrolCost = (totalDistance / 100) * petrolConsumption * petrolPrice;
  const savings = petrolCost - (cheapest?.totalCost || 0);
  const stopDistance = Math.round(baseDistance / (chargeStops + 1));

  // Battery states at each waypoint
  const legKwh = (stopDistance / 100) * adjConsumption;
  const batteryStates = [];
  let currentKwh = startKwh;
  batteryStates.push({ label: origin, kwh: currentKwh, event: 'start' });
  for (let i = 0; i < chargeStops; i++) {
    currentKwh -= legKwh;
    currentKwh = Math.max(currentKwh, (minArrivalCharge / 100) * car.batteryCapacity);
    batteryStates.push({ label: `Зарядна станция ${i + 1}`, kwh: currentKwh, event: 'arrive_charge' });
    currentKwh = car.batteryCapacity * 0.80;
    batteryStates.push({ label: `Зарядна станция ${i + 1}`, kwh: currentKwh, event: 'after_charge' });
  }
  const remainingDist = totalDistance - stopDistance * chargeStops;
  currentKwh = Math.max(0, currentKwh - (remainingDist / 100) * adjConsumption);
  batteryStates.push({ label: isRoundTrip ? origin : destination, kwh: currentKwh, event: 'end' });

  return {
    origin, destination, departDate, returnDate,
    isRoundTrip, baseDistance, totalDistance,
    adjConsumption, totalKwh, neededKwh, startKwh,
    chargeStops, minArrivalCharge, stopDistance,
    networkCosts, cheapest, mostExpensive, avgCost,
    petrolCost, savings,
    weather, traffic, drivingStyle, highwayPct,
    marketModifier, totalMod, car,
    batteryStates, profiles,
  };
}

// --- RENDER RESULTS ---
function renderResults(r) {
  const container = document.getElementById('results');
  const savingsColor = r.savings >= 0 ? 'color:var(--accent3)' : 'color:var(--danger)';
  const savingsSign = r.savings >= 0 ? '+' : '';

  const chargeTimeNote = r.chargeStops > 0 ? `
    <div class="breakdown-row">
      <span class="label">⚡ Макс. мощност зареждане</span>
      <span class="value">${r.car.maxChargePower} kW</span>
    </div>
    <div class="breakdown-row">
      <span class="label">🕐 Прогн. зареждане (20–80%)</span>
      <span class="value">${Math.round((r.car.batteryCapacity * 0.6) / r.car.maxChargePower * 60)} мин</span>
    </div>` : '';

  container.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem">
      <div class="results-header">
        <div>
          <div class="results-title">📊 Резултати</div>
          <div class="results-subtitle">${r.origin} → ${r.destination}${r.isRoundTrip ? ' → ' + r.origin : ''}</div>
        </div>
        <div class="results-meta">${formatDate(r.departDate)}<br>${r.isRoundTrip ? 'Двупосочно' : 'Еднопосочно'}</div>
      </div>
      <div class="weather-strip">${buildWeatherChips(r)}</div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-val cyan">${r.totalDistance} км</div><div class="stat-label">Разстояние</div></div>
        <div class="stat-box"><div class="stat-val amber">${r.totalKwh.toFixed(1)} kWh</div><div class="stat-label">Общо енергия</div></div>
        <div class="stat-box"><div class="stat-val purple">${r.chargeStops}</div><div class="stat-label">Зареждания</div></div>
        <div class="stat-box"><div class="stat-val green">${r.cheapest ? r.cheapest.totalCost.toFixed(2) : '—'} €</div><div class="stat-label">Мин. разход</div></div>
      </div>
    </div>

    <div class="breakdown-grid">
      <div class="breakdown-card">
        <h3>⚡ Разход по зарядни мрежи</h3>
        ${r.networkCosts.map(n => `
          <div class="breakdown-row ${n.id === r.cheapest?.id ? 'highlight' : ''}">
            <span class="label" style="display:flex;align-items:center;gap:0.4rem">
              <span style="width:8px;height:8px;border-radius:50%;background:${n.dot};display:inline-block"></span>
              ${n.name} ${n.id === r.cheapest?.id ? '✓' : ''}
            </span>
            <span class="value" style="${n.id === r.cheapest?.id ? 'color:var(--accent3)' : ''}">${n.totalCost.toFixed(2)} €</span>
          </div>`).join('')}
        <div class="breakdown-row highlight" style="margin-top:0.5rem;border-top:1px solid var(--border);padding-top:0.75rem">
          <span class="label">💡 Спестявате (vs най-скъпото)</span>
          <span class="value" style="color:var(--accent)">${r.networkCosts.length > 1 ? (r.mostExpensive.totalCost - r.cheapest.totalCost).toFixed(2) : '0.00'} €</span>
        </div>
      </div>

      <div class="breakdown-card">
        <h3>📋 Детайлно изчисление</h3>
        <div class="breakdown-row"><span class="label">Разстояние</span><span class="value">${r.totalDistance} км</span></div>
        <div class="breakdown-row"><span class="label">Разход (${r.adjConsumption.toFixed(1)} kWh/100км)</span><span class="value">${r.totalKwh.toFixed(1)} kWh</span></div>
        <div class="breakdown-row"><span class="label">Магистрала / Смесено</span><span class="value">${r.highwayPct}% / ${100 - r.highwayPct}%</span></div>
        <div class="breakdown-row"><span class="label">Наличен заряд</span><span class="value">${r.startKwh.toFixed(1)} kWh (${Math.round(r.startKwh/r.car.batteryCapacity*100)}%)</span></div>
        <div class="breakdown-row"><span class="label">Нужно зареждане</span><span class="value">${r.neededKwh.toFixed(1)} kWh</span></div>
        <div class="breakdown-row"><span class="label">Мод. метео+трафик+стил</span><span class="value" style="color:var(--warning)">×${r.totalMod.toFixed(2)}</span></div>
        <div class="breakdown-row"><span class="label">Пазарен коефициент</span><span class="value" style="color:var(--warning)">×${r.marketModifier.toFixed(2)}</span></div>
        ${chargeTimeNote}
        <div class="breakdown-row highlight"><span class="label">Най-евтина опция</span><span class="value">${r.cheapest ? r.cheapest.totalCost.toFixed(2) + ' €' : '—'}</span></div>
      </div>
    </div>

    <div class="route-visual">
      <h3>🗺️ Маршрут и батерия</h3>
      <div class="route-timeline">${buildRouteStops(r)}</div>
    </div>

    <div class="comparison-section">
      <h3>⚖️ Сравнение с бензинов автомобил</h3>
      ${r.networkCosts.map(n => `
        <div class="comparison-item">
          <div class="comparison-label-row">
            <span class="comparison-label">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${n.dot};margin-right:6px"></span>${n.name}
            </span>
            <span class="comparison-amount" style="color:var(--accent)">${n.totalCost.toFixed(2)} €</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,(n.totalCost/r.petrolCost)*100).toFixed(0)}%;background:${n.dot}"></div></div>
        </div>`).join('')}
      <div class="comparison-item">
        <div class="comparison-label-row">
          <span class="comparison-label">⛽ Бензин (7.5L/100км @ 2.45€)</span>
          <span class="comparison-amount" style="color:var(--muted)">${r.petrolCost.toFixed(2)} €</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:100%;background:var(--muted)"></div></div>
      </div>
      <div style="margin-top:1.25rem;padding:1rem;background:var(--surface);border-radius:10px;text-align:center">
        <div style="font-size:0.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.4rem">Спестявания с най-евтина EV опция</div>
        <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;${savingsColor}">${savingsSign}${r.savings.toFixed(2)} €</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-top:0.3rem">${r.savings >= 0 ? '✅ Електромобилът е по-изгоден!' : '⚠️ Бензинът е по-евтин за това пътуване'}</div>
      </div>
    </div>

    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;margin-top:1.5rem">
      <button class="btn-calculate" onclick="window.print()" style="max-width:220px;background:var(--surface);color:var(--text);border:1px solid var(--border)">
        🖨️ Запази PDF
      </button>
      <button class="btn-save-trip" id="saveTripBtn" onclick="saveTrip()">
        💾 Запази трип
      </button>
    </div>
  `;
}

function buildRouteStops(r) {
  const stops = [];

  stops.push(`
    <div class="route-stop">
      <div class="route-dot start"></div>
      <div class="route-stop-name">📍 ${r.origin}</div>
      <div class="route-stop-detail">${batteryStateHtml(r.startKwh, r.car.batteryCapacity)} · ${r.adjConsumption.toFixed(1)} kWh/100км</div>
    </div>`);

  const cheapNet = r.cheapest;
  for (let i = 0; i < r.chargeStops; i++) {
    const dist = r.stopDistance * (i + 1);
    const arriveState = r.batteryStates.find((s, idx) => s.event === 'arrive_charge' && idx === (i * 2 + 1));
    const afterState  = r.batteryStates.find((s, idx) => s.event === 'after_charge'  && idx === (i * 2 + 2));
    const kwNeeded = (r.stopDistance / 100) * r.adjConsumption;
    const cost = cheapNet ? (kwNeeded * cheapNet.adjustedPrice) : 0;

    stops.push(`
      <div class="route-stop">
        <div class="route-dot charge"></div>
        <div class="route-stop-name">⚡ Зарядна станция ${i + 1}</div>
        <div class="route-stop-detail" style="margin-bottom:0.35rem">
          ~${dist} км · При пристигане: ${arriveState ? batteryStateHtml(arriveState.kwh, r.car.batteryCapacity) : ''}
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          ${cheapNet ? `<span class="route-stop-cost">🔌 ${cheapNet.name}</span>` : ''}
          <span class="route-stop-cost" style="background:rgba(16,185,129,0.1);color:var(--accent3)">💰 ${cost.toFixed(2)} €</span>
          ${afterState ? `<span class="route-stop-cost" style="background:rgba(16,185,129,0.08);color:var(--accent3)">После: ${batteryStateHtml(afterState.kwh, r.car.batteryCapacity)}</span>` : ''}
        </div>
      </div>`);
  }

  if (r.isRoundTrip) {
    stops.push(`
      <div class="route-stop">
        <div class="route-dot end" style="background:var(--accent2)"></div>
        <div class="route-stop-name">🔄 ${r.destination}</div>
        <div class="route-stop-detail">Обрат · ${r.baseDistance} км · ${formatDate(r.returnDate)}</div>
      </div>`);
  }

  const endState = r.batteryStates[r.batteryStates.length - 1];
  stops.push(`
    <div class="route-stop">
      <div class="route-dot end"></div>
      <div class="route-stop-name">${r.isRoundTrip ? '🏠 ' + r.origin : '🏁 ' + r.destination}</div>
      <div class="route-stop-detail">Пристигане · ${r.totalDistance} км · ${batteryStateHtml(endState.kwh, r.car.batteryCapacity)}</div>
    </div>`);

  return stops.join('');
}

function buildWeatherChips(r) {
  const w = WEATHER_MODIFIERS[r.weather];
  const t = TRAFFIC_MODIFIERS[r.traffic];
  const d = DRIVING_STYLE_MODIFIERS[r.drivingStyle];
  return `
    <div class="weather-chip"><span>${w.icon}</span><span>${w.label.split(' ').slice(1).join(' ')}</span></div>
    <div class="weather-chip"><span>🚦</span><span>${t.label}</span></div>
    <div class="weather-chip"><span>🏎️</span><span>${d.label}</span></div>
    <div class="weather-chip"><span>🚗</span><span>${r.car.carName} · ${r.car.realRange} км</span></div>
    ${r.marketModifier > 1.0 ? `<div class="weather-chip" style="border-color:rgba(245,158,11,0.3);color:var(--warning)"><span>📈</span><span>×${r.marketModifier.toFixed(2)}</span></div>` : ''}
  `;
}

// --- MAP ---
function showChargingMap(origin, destination, routeGeometry) {
  const mapSection = document.getElementById('mapSection');
  if (!mapSection) return;
  mapSection.style.display = 'block';

  const originCoords = CITY_COORDS[origin];
  const destCoords = CITY_COORDS[destination];
  if (!originCoords || !destCoords) return;

  if (_leafletMap) { _leafletMap.remove(); _leafletMap = null; }

  const map = L.map('chargingMap', { zoomControl: true }).setView([42.7, 25.5], 7);
  _leafletMap = map;

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO',
    maxZoom: 19,
  }).addTo(map);

  let routePolyline;
  if (routeGeometry && routeGeometry.length > 1) {
    routePolyline = L.polyline(routeGeometry, { color: '#00bcd4', weight: 4, opacity: 1 }).addTo(map);
  } else {
    routePolyline = L.polyline([originCoords, destCoords], { color: '#00bcd4', weight: 4, opacity: 0.85, dashArray: '6, 6' }).addTo(map);
  }

  L.circleMarker(originCoords, { radius: 10, color: '#fff', weight: 3, fillColor: '#00bcd4', fillOpacity: 1 })
    .addTo(map).bindPopup(`<b>📍 ${origin}</b><br>Начало`);
  L.circleMarker(destCoords, { radius: 10, color: '#fff', weight: 3, fillColor: '#10b981', fillOpacity: 1 })
    .addTo(map).bindPopup(`<b>🏁 ${destination}</b><br>Край`);

  const networkColors = { 'Tesla': '#ef4444', 'Еко Фини': '#10b981', 'Electrip': '#3b82f6', 'Eldrive': '#8b5cf6', 'EVN': '#f59e0b' };

  function minDistToPolyline(pLat, pLng, pts) {
    let min = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const [aLat, aLng] = pts[i], [bLat, bLng] = pts[i+1];
      const abx = bLng-aLng, aby = bLat-aLat;
      const t = Math.max(0, Math.min(1, ((pLng-aLng)*abx + (pLat-aLat)*aby) / (abx*abx + aby*aby)));
      const d = haversineKm(pLat, pLng, aLat + t*aby, aLng + t*abx);
      if (d < min) min = d;
    }
    return min;
  }

  const THRESHOLD = 80;
  const refPts = routeGeometry && routeGeometry.length > 1 ? routeGeometry : [originCoords, destCoords];
  let nearby = BG_CHARGING_STATIONS.filter(s => minDistToPolyline(s.lat, s.lng, refPts) <= THRESHOLD);
  if (nearby.length < 3) nearby = BG_CHARGING_STATIONS;

  nearby.forEach(s => {
    const color = networkColors[s.network] || '#00bcd4';
    L.circleMarker([s.lat, s.lng], { radius: 7, color, fillColor: color, fillOpacity: 0.95, weight: 2 })
      .addTo(map)
      .bindPopup(`<b>⚡ ${s.name}</b><br>Мрежа: ${s.network}<br>Мощност: ${s.power}`);
  });

  map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
}

// --- SAVE TRIP ---
// Called from button in results; uses Firebase injected via home.html module script
function saveTrip() {
  if (window._saveTripFn) {
    window._saveTripFn(_lastResults);
  } else {
    showToast('⚠️ Влезте в профила си, за да запазите трипа.');
  }
}

// --- UTILS ---
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('bg-BG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function showLoading(state) {
  document.querySelector('.loading-overlay')?.classList.toggle('active', state);
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// --- HAMBURGER (shared) ---
function initHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    btn.classList.toggle('open', open);
  });

  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      btn.classList.remove('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', initHamburger);