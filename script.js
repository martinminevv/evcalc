// ============================================================
// EV Cost Calculator — script.js
// ============================================================

// --- DATA ---

const CHARGING_NETWORKS = [
  { id: 'tesla_sc', name: 'Tesla Supercharger', type: 'ultra', power: '250 kW', dot: '#ef4444', basePrice: 0.35, badge: 'badge-ultra' },
  { id: 'ionity', name: 'Ionity', type: 'ultra', power: '350 kW', dot: '#f59e0b', basePrice: 0.79, badge: 'badge-ultra' },
  { id: 'chargepoint', name: 'ChargePoint', type: 'fast', power: '62 kW', dot: '#3b82f6', basePrice: 0.48, badge: 'badge-fast' },
  { id: 'evgo', name: 'EVgo', type: 'fast', power: '100 kW', dot: '#10b981', basePrice: 0.45, badge: 'badge-fast' },
  { id: 'blink', name: 'Blink', type: 'normal', power: '7 kW', dot: '#64748b', basePrice: 0.29, badge: 'badge-normal' },
  { id: 'recharge', name: 'Recharge BG', type: 'fast', power: '50 kW', dot: '#8b5cf6', basePrice: 0.39, badge: 'badge-fast' },
];

const WEATHER_MODIFIERS = {
  sunny: { label: '☀️ Слънчево', modifier: 1.00, icon: '☀️' },
  cloudy: { label: '☁️ Облачно', modifier: 1.04, icon: '☁️' },
  rainy: { label: '🌧️ Дъждовно', modifier: 1.08, icon: '🌧️' },
  cold: { label: '❄️ Студено', modifier: 1.20, icon: '❄️' },
  hot: { label: '🌡️ Горещо', modifier: 1.10, icon: '🌡️' },
};

const TRAFFIC_MODIFIERS = {
  free: { label: 'Свободен', modifier: 1.00 },
  moderate: { label: 'Умерен', modifier: 1.10 },
  heavy: { label: 'Задръстване', modifier: 1.22 },
};

const DRIVING_STYLE_MODIFIERS = {
  eco: { label: 'Еко', modifier: 0.90 },
  normal: { label: 'Нормален', modifier: 1.00 },
  sport: { label: 'Спортен', modifier: 1.18 },
};

// --- CURRENCY ---
// BGN is pegged to EUR at a fixed rate by law (currency board)
const BGN_TO_EUR = 1 / 1.95583;
function eur(bgn) { return (bgn * BGN_TO_EUR).toFixed(2); }
function eurFmt(bgn) { return eur(bgn) + ' €'; }

// --- PETROL REFERENCE (convert to EUR too) ---
// Original: 2.45 лв/л → in EUR
const PETROL_PRICE_BGN = 2.45;
const PETROL_PRICE_EUR = PETROL_PRICE_BGN * BGN_TO_EUR;

// City coordinates lookup (real approximate lat/lng)
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

// Real Bulgarian EV charging stations
const BG_CHARGING_STATIONS = [
  { name: 'Tesla Supercharger — София Бизнес Парк', lat: 42.6276, lng: 23.3784, network: 'Tesla', power: '250 kW' },
  { name: 'Tesla Supercharger — Варна', lat: 43.2176, lng: 27.8928, network: 'Tesla', power: '250 kW' },
  { name: 'Tesla Supercharger — Пловдив', lat: 42.1511, lng: 24.7490, network: 'Tesla', power: '250 kW' },
  { name: 'Eldrive — НДК, София', lat: 42.6851, lng: 23.3189, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Бургас Мол', lat: 42.4893, lng: 27.4750, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Стара Загора', lat: 42.4257, lng: 25.6427, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Велико Търново', lat: 43.0757, lng: 25.6319, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Плевен', lat: 43.4113, lng: 24.6197, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Русе', lat: 43.8448, lng: 25.9533, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Шумен', lat: 43.2669, lng: 26.9302, network: 'Eldrive', power: '50 kW' },
  { name: 'Eldrive — Благоевград', lat: 42.0139, lng: 23.0988, network: 'Eldrive', power: '50 kW' },
  { name: 'EVN Charging — Хасково', lat: 41.9359, lng: 25.5638, network: 'EVN', power: '22 kW' },
  { name: 'EVN Charging — Кърджали', lat: 41.6432, lng: 25.3712, network: 'EVN', power: '22 kW' },
  { name: 'EVN Charging — Смолян', lat: 41.5771, lng: 24.7010, network: 'EVN', power: '22 kW' },
  { name: 'EVN Charging — Пазарджик', lat: 42.1935, lng: 24.3276, network: 'EVN', power: '22 kW' },
  { name: 'Ionity — Автомагистрала Тракия км 107', lat: 42.3791, lng: 25.0123, network: 'Ionity', power: '350 kW' },
  { name: 'Ionity — Автомагистрала Хемус км 85', lat: 43.0892, lng: 24.8741, network: 'Ionity', power: '350 kW' },
  { name: 'ChargePoint — Интер Експо Център, София', lat: 42.6667, lng: 23.3969, network: 'ChargePoint', power: '62 kW' },
  { name: 'ChargePoint — Варна Гранд Мол', lat: 43.2051, lng: 27.9101, network: 'ChargePoint', power: '62 kW' },
  { name: 'Recharge BG — Добрич', lat: 43.5697, lng: 27.8279, network: 'Recharge BG', power: '50 kW' },
  { name: 'Recharge BG — Видин', lat: 43.9907, lng: 22.8680, network: 'Recharge BG', power: '50 kW' },
  { name: 'Recharge BG — Монтана', lat: 43.4115, lng: 23.2243, network: 'Recharge BG', power: '50 kW' },
];

// --- STATE ---
let selectedStations = new Set(['tesla_sc', 'ionity', 'chargepoint']);
let _leafletMap = null;
let _lastResults = null; // last computed results, used by saveTrip

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  renderStationList();
  setupRangeInputs();
  setupCarParams();
  setupReturnDateToggle();
  setDefaultDates();
});

function setDefaultDates() {
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  document.getElementById('departDate').value = fmt(today);
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

// --- CAR PARAMS ---
function setupCarParams() {
  const batteryInput = document.getElementById('batteryCapacity');
  const rangeInput = document.getElementById('realRange');
  const consumptionDisplay = document.getElementById('consumptionDisplay');

  function updateConsumption() {
    const battery = parseFloat(batteryInput.value) || 0;
    const range = parseFloat(rangeInput.value) || 1;
    const consumption = battery / range * 100;
    consumptionDisplay.textContent = consumption.toFixed(1) + ' kWh/100км';
    updateChargeTime();
  }

  if (batteryInput && rangeInput && consumptionDisplay) {
    batteryInput.addEventListener('input', updateConsumption);
    rangeInput.addEventListener('input', updateConsumption);
    updateConsumption();
  }

  // Car preset dropdown
  const presetSelect = document.getElementById('carPreset');
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const val = presetSelect.value;
      if (!val) return;
      const [battery, range] = val.split('|');
      if (batteryInput) {
        batteryInput.value = battery;
        batteryInput.dispatchEvent(new Event('input'));
      }
      if (rangeInput) {
        rangeInput.value = range;
        rangeInput.dispatchEvent(new Event('input'));
      }
    });
  }
}

function updateChargeTime() {
  const battery = parseFloat(document.getElementById('batteryCapacity')?.value) || 0;
  const maxPower = parseFloat(document.getElementById('maxChargePower')?.value) || 1;
  const display = document.getElementById('chargeTimeDisplay');
  if (!display) return;
  if (!battery || !maxPower) { display.textContent = '— мин'; return; }
  const minutes = Math.round((battery * 0.8) / maxPower * 60);
  display.textContent = minutes + ' мин (от 20% до 100%)';
}

function getCarParams() {
  const batteryCapacity = parseFloat(document.getElementById('batteryCapacity')?.value) || 75;
  const realRange = parseFloat(document.getElementById('realRange')?.value) || 400;
  const consumption = batteryCapacity / realRange * 100;
  const maxChargePower = parseFloat(document.getElementById('maxChargePower')?.value) || 150;
  return { carName: 'Мой автомобил', batteryCapacity, realRange, consumption, maxChargePower };
}

// --- STATIONS ---
function renderStationList() {
  const container = document.getElementById('stationList');
  container.innerHTML = CHARGING_NETWORKS.map(s => `
    <div class="station-item ${selectedStations.has(s.id) ? 'selected' : ''}"
         onclick="toggleStation('${s.id}')">
      <div class="station-dot" style="background:${s.dot}"></div>
      <div class="station-info">
        <div class="station-name">${s.name}</div>
        <div class="station-meta">${s.power} · ${s.type === 'ultra' ? 'DC Ultra-fast' : s.type === 'fast' ? 'DC Fast' : 'AC Normal'}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem">
        <span class="station-badge ${s.badge}">${s.type.toUpperCase()}</span>
        <div class="station-price">
          <div class="price">${eur(s.basePrice)} €</div>
          <div class="per">/kWh</div>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleStation(id) {
  if (selectedStations.has(id)) {
    if (selectedStations.size > 1) selectedStations.delete(id);
  } else {
    selectedStations.add(id);
  }
  renderStationList();
}

// --- RANGE INPUTS ---
function setupRangeInputs() {
  const rangeInputs = [
    { id: 'batteryLevel', valId: 'batteryLevelVal', suffix: '%' },
    { id: 'minArrivalCharge', valId: 'minArrivalChargeVal', suffix: '%' },
    { id: 'maxChargePower', valId: 'maxChargePowerVal', suffix: ' kW' },
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

// --- MAP PICKER (pin-drop + Nominatim reverse geocoding) ---
let _mapPickerInstance = null;
let _mapPickerField = null;       // 'origin' | 'destination'
let _mapPickerPin = null;         // current Leaflet marker
let _mapPickerPending = null;     // { name, lat, lng } waiting for confirm
let _geocodeTimer = null;

// Stores coords for arbitrary map-picked locations
// key: 'origin' | 'destination'  value: [lat, lng] or null
const _pickedCoords = { origin: null, destination: null };

// Keep select and map in sync (no-op — hidden inputs are set by autocomplete)
function syncSelectToDisplay(field) {}

// ===== CITY AUTOCOMPLETE (Nominatim / OpenStreetMap) =====
(function initCityAutocomplete() {
  const TOP_BG_CITIES = [
    { class: 'place', display_name: "София, Област София-град", lat: "42.6977", lon: "23.3219", address: { city: "София", county: "Област София-град" } },
    { class: 'place', display_name: "Пловдив, Област Пловдив", lat: "42.1405", lon: "24.7464", address: { city: "Пловдив", county: "Област Пловдив" } },
    { class: 'place', display_name: "Варна, Област Варна", lat: "43.2141", lon: "27.9147", address: { city: "Варна", county: "Област Варна" } },
    { class: 'place', display_name: "Бургас, Област Бургас", lat: "42.5048", lon: "27.4626", address: { city: "Бургас", county: "Област Бургас" } },
    { class: 'place', display_name: "Русе, Област Русе", lat: "43.8453", lon: "25.9616", address: { city: "Русе", county: "Област Русе" } },
    { class: 'place', display_name: "Стара Загора, Област Стара Загора", lat: "42.4258", lon: "25.6345", address: { city: "Стара Загора", county: "Област Стара Загора" } },
    { class: 'place', display_name: "Плевен, Област Плевен", lat: "43.4170", lon: "24.6167", address: { city: "Плевен", county: "Област Плевен" } },
    { class: 'place', display_name: "Сливен, Област Сливен", lat: "42.6817", lon: "26.3225", address: { city: "Сливен", county: "Област Сливен" } },
    { class: 'place', display_name: "Добрич, Област Добрич", lat: "43.5670", lon: "27.8300", address: { city: "Добрич", county: "Област Добрич" } },
    { class: 'place', display_name: "Шумен, Област Шумен", lat: "43.2712", lon: "26.9261", address: { city: "Шумен", county: "Област Шумен" } },
    { class: 'place', display_name: "Перник, Област Перник", lat: "42.6052", lon: "23.0378", address: { city: "Перник", county: "Област Перник" } },
    { class: 'place', display_name: "Хасково, Област Хасково", lat: "41.9342", lon: "25.5556", address: { city: "Хасково", county: "Област Хасково" } },
    { class: 'place', display_name: "Ямбол, Област Ямбол", lat: "42.4842", lon: "26.5035", address: { city: "Ямбол", county: "Област Ямбол" } },
    { class: 'place', display_name: "Пазарджик, Област Пазарджик", lat: "42.1928", lon: "24.3333", address: { city: "Пазарджик", county: "Област Пазарджик" } },
    { class: 'place', display_name: "Благоевград, Област Благоевград", lat: "42.0238", lon: "23.0943", address: { city: "Благоевград", county: "Област Благоевград" } },
    { class: 'place', display_name: "Велико Търново, Област Велико Търново", lat: "43.0757", lon: "25.6172", address: { city: "Велико Търново", county: "Област Велико Търново" } },
    { class: 'place', display_name: "Враца, Област Враца", lat: "43.2046", lon: "23.5529", address: { city: "Враца", county: "Област Враца" } },
    { class: 'place', display_name: "Габрово, Област Габрово", lat: "42.8742", lon: "25.3187", address: { city: "Габрово", county: "Област Габрово" } },
    { class: 'place', display_name: "Асеновград, Област Пловдив", lat: "42.0106", lon: "24.8767", address: { city: "Асеновград", county: "Област Пловдив" } },
    { class: 'place', display_name: "Видин, Област Видин", lat: "43.9962", lon: "22.8756", address: { city: "Видин", county: "Област Видин" } },
    { class: 'place', display_name: "Казанлък, Област Стара Загора", lat: "42.6194", lon: "25.3949", address: { city: "Казанлък", county: "Област Стара Загора" } },
    { class: 'place', display_name: "Кюстендил, Област Кюстендил", lat: "42.2833", lon: "22.6833", address: { city: "Кюстендил", county: "Област Кюстендил" } },
    { class: 'place', display_name: "Кърджали, Област Кърджали", lat: "41.6433", lon: "25.3678", address: { city: "Кърджали", county: "Област Кърджали" } }
  ];

  const fields = [
    { inputId: 'originInput',      hiddenId: 'origin',      dropdownId: 'originDropdown' },
    { inputId: 'destinationInput', hiddenId: 'destination', dropdownId: 'destinationDropdown' },
  ];

  const state = {};
  fields.forEach(f => {
    state[f.inputId] = { timer: null, activeIdx: -1, results: [] };
  });

  function openDropdown(id) { document.getElementById(id)?.classList.add('open'); }
  function closeDropdown(id) {
    const dd = document.getElementById(id);
    if (dd) { dd.classList.remove('open'); dd.innerHTML = ''; }
  }

  function buildDisplayName(item) {
    const a = item.address || {};
    const settlement = a.village || a.town || a.city || a.hamlet || a.suburb || a.municipality || '';
    const county     = a.county || a.state_district || '';
    const name       = settlement || item.display_name.split(',')[0].trim();
    const sub        = county && county !== name ? county : '';
    return { name, sub };
  }

  function renderDropdown(f, items) {
    const dd = document.getElementById(f.dropdownId);
    if (!dd) return;
    dd.innerHTML = '';
    state[f.inputId].results = items;
    state[f.inputId].activeIdx = -1;

    if (!items.length) {
      dd.innerHTML = '<div class="city-ac-searching">Няма резултати</div>';
      openDropdown(f.dropdownId);
      return;
    }

    items.forEach((item, idx) => {
      const { name, sub } = buildDisplayName(item);
      const div = document.createElement('div');
      div.className = 'city-ac-item';
      div.innerHTML = `<div class="city-ac-item-name">${name}</div>${sub ? `<div class="city-ac-item-sub">${sub}</div>` : ''}`;
      div.addEventListener('mousedown', e => { e.preventDefault(); selectItem(f, idx); });
      dd.appendChild(div);
    });
    openDropdown(f.dropdownId);
  }

  function selectItem(f, idx) {
    const item = state[f.inputId].results[idx];
    if (!item) return;
    const { name } = buildDisplayName(item);
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    const hidden = document.getElementById(f.hiddenId);
    if (hidden) hidden.value = name;

    const inp = document.getElementById(f.inputId);
    if (inp) { inp.value = name; inp.classList.add('confirmed'); }

    _pickedCoords[f.hiddenId] = [lat, lng];
    closeDropdown(f.dropdownId);
  }

  async function search(f, query) {
    const dd = document.getElementById(f.dropdownId);
    if (!dd) return;
    dd.innerHTML = '<div class="city-ac-searching">⏳ Търси…</div>';
    openDropdown(f.dropdownId);

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('countrycodes', 'bg');
      url.searchParams.set('limit', '12');
      url.searchParams.set('accept-language', 'bg,en');

      const resp = await fetch(url.toString(), {
        headers: { 'User-Agent': 'EVCalc/1.0' }
      });
      if (!resp.ok) throw new Error('err');
      const data = await resp.json();

      const uniqueNames = new Set();
      const filtered = [];
      const qLower = query.toLowerCase();

      // 1. Първо проверяваме в локалния списък с най-големи градове (незабавен резултат)
      for (const city of TOP_BG_CITIES) {
        if (city.address.city.toLowerCase().startsWith(qLower)) {
          uniqueNames.add(`${city.address.city}|${city.address.county}`);
          filtered.push(city);
        }
      }

      // 2. След това добавяме резултатите от Nominatim API
      for (const item of data) {
        const isPlace = item.class === 'place' || item.class === 'boundary';
        if (!isPlace) continue;

        const { name, sub } = buildDisplayName(item);
        const combo = `${name}|${sub}`;

        if (!uniqueNames.has(combo) && name) {
          uniqueNames.add(combo);
          filtered.push(item);
        }
      }

      renderDropdown(f, filtered);
    } catch (e) {
      if (dd) dd.innerHTML = '<div class="city-ac-searching">⚠️ Грешка при търсене</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    fields.forEach(f => {
      const inp = document.getElementById(f.inputId);
      const dd  = document.getElementById(f.dropdownId);
      const s   = state[f.inputId];
      if (!inp || !dd) return;

      inp.addEventListener('input', () => {
        const q = inp.value.trim();
        inp.classList.remove('confirmed');
        const hidden = document.getElementById(f.hiddenId);
        if (hidden) hidden.value = '';
        _pickedCoords[f.hiddenId] = null;

        if (s.timer) clearTimeout(s.timer);
        if (q.length < 2) { closeDropdown(f.dropdownId); return; }
        s.timer = setTimeout(() => search(f, q), 320);
      });

      inp.addEventListener('keydown', e => {
        const items = dd.querySelectorAll('.city-ac-item');
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          s.activeIdx = Math.min(s.activeIdx + 1, items.length - 1);
          items.forEach((el, i) => el.classList.toggle('active', i === s.activeIdx));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          s.activeIdx = Math.max(s.activeIdx - 1, 0);
          items.forEach((el, i) => el.classList.toggle('active', i === s.activeIdx));
        } else if (e.key === 'Enter' && s.activeIdx >= 0) {
          e.preventDefault();
          selectItem(f, s.activeIdx);
        } else if (e.key === 'Escape') {
          closeDropdown(f.dropdownId);
        }
      });

      inp.addEventListener('blur', () => {
        setTimeout(() => closeDropdown(f.dropdownId), 180);
      });
    });

    document.addEventListener('click', e => {
      fields.forEach(f => {
        const wrap = document.getElementById(f.inputId)?.closest('.city-autocomplete-wrap');
        if (wrap && !wrap.contains(e.target)) closeDropdown(f.dropdownId);
      });
    });
  });
})();

function openMapPicker(field) {
  _mapPickerField = field;
  _mapPickerPending = null;

  const modal = document.getElementById('mapPickerModal');
  document.getElementById('mapPickerTitle').textContent =
    field === 'origin' ? '📍 Начална точка — пусни пин' : '🏁 Дестинация — пусни пин';
  modal.classList.add('open');

  if (_mapPickerInstance) {
    _mapPickerInstance.remove();
    _mapPickerInstance = null;
    document.getElementById('mapPickerLeaflet').innerHTML = '';
  }

  setMapStatus('default', '📌 Кликни навсякъде на картата за да пуснеш пин');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const container = document.getElementById('mapPickerLeaflet');

      // Centre on previously picked coords for this field if available
      const prevCoords = _pickedCoords[field];
      const center = prevCoords ? prevCoords : [42.73, 25.48];
      const zoom   = prevCoords ? 12 : 7;

      const map = L.map(container, {
        center,
        zoom,
        minZoom: 5,
        maxZoom: 19,
        zoomControl: true,
      });
      _mapPickerInstance = map;

      // OSM standard tiles — shows ALL settlements including villages
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Restore previous pin if exists
      if (prevCoords) {
        _mapPickerPin = L.marker(prevCoords, { draggable: true }).addTo(map);
        _mapPickerPin.on('dragend', () => {
          const pos = _mapPickerPin.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });
        // Show the current name from select as initial status
        const currentName = document.getElementById(field)?.value || '';
        if (currentName) setMapStatus('found', '📍 ' + currentName + '  —  Кликни другаде за нова точка');
      }

      // Click anywhere to drop / move pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        dropPin(lat, lng);
      });

      map.invalidateSize();
    });
  });
}

function dropPin(lat, lng) {
  const map = _mapPickerInstance;
  if (!map) return;

  if (_mapPickerPin) {
    _mapPickerPin.setLatLng([lat, lng]);
  } else {
    _mapPickerPin = L.marker([lat, lng], { draggable: true }).addTo(map);
    _mapPickerPin.on('dragend', () => {
      const pos = _mapPickerPin.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });
  }

  reverseGeocode(lat, lng);
}

async function reverseGeocode(lat, lng) {
  // Debounce — cancel previous pending request
  if (_geocodeTimer) clearTimeout(_geocodeTimer);

  setMapStatus('searching', '🔍 Търси населено място…');

  _geocodeTimer = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=bg&zoom=14`;
      const resp = await fetch(url, {
        headers: { 'Accept-Language': 'bg,en', 'User-Agent': 'EVCalc/1.0' }
      });
      if (!resp.ok) throw new Error('Nominatim error');
      const data = await resp.json();

      // Build a human-readable name: village/town/city + municipality + (optional county)
      const a = data.address || {};
      const settlement = a.village || a.town || a.city || a.hamlet || a.suburb || a.municipality || a.county || '';
      const extra      = settlement !== (a.city || '') && a.city ? ', ' + a.city : '';
      const name       = settlement ? settlement + extra : (data.display_name || '').split(',')[0];

      _mapPickerPending = { name, lat, lng };
      setMapStatus('found', `📍 ${name}`);

      // Update pin popup
      if (_mapPickerPin) {
        _mapPickerPin.bindPopup(
          `<b>${name}</b><br><small style="color:#94a3b8">${lat.toFixed(5)}, ${lng.toFixed(5)}</small>`
        ).openPopup();
      }

    } catch (e) {
      // Fallback: use coordinates as label
      const name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      _mapPickerPending = { name, lat, lng };
      setMapStatus('error', `⚠️ Неизвестна точка — ще се използват координати`);
    }
  }, 350);
}

function setMapStatus(type, msg) {
  const el = document.getElementById('mapPickerStatus');
  if (!el) return;
  el.className = 'map-picker-status ' + type;
  // Remove old confirm btn if present
  const old = el.querySelector('.map-picker-confirm');
  if (old) old.remove();
  el.textContent = msg;

  if (type === 'found' && _mapPickerPending) {
    const btn = document.createElement('button');
    btn.className = 'map-picker-confirm';
    btn.textContent = '✓ Потвърди';
    btn.style.display = 'inline-block';
    btn.onclick = confirmMapSelection;
    el.appendChild(btn);
  }
}

function confirmMapSelection() {
  if (!_mapPickerPending || !_mapPickerField) return;
  const { name, lat, lng } = _mapPickerPending;

  _pickedCoords[_mapPickerField] = [lat, lng];

  // Update text input
  const textInp = document.getElementById(_mapPickerField + 'Input');
  if (textInp) { textInp.value = name; textInp.classList.add('confirmed'); }

  // Update hidden value
  const hidden = document.getElementById(_mapPickerField);
  if (hidden) hidden.value = name;

  closeMapPicker();
}

function closeMapPicker() {
  const modal = document.getElementById('mapPickerModal');
  modal.classList.remove('open');
  if (_mapPickerInstance) {
    _mapPickerInstance.remove();
    _mapPickerInstance = null;
  }
  const container = document.getElementById('mapPickerLeaflet');
  if (container) container.innerHTML = '';
  _mapPickerPin = null;
  _mapPickerPending = null;
  _mapPickerField = null;
  if (_geocodeTimer) { clearTimeout(_geocodeTimer); _geocodeTimer = null; }
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('mapPickerModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeMapPicker();
    });
  }
});

// --- HAVERSINE (fallback) ---
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- FETCH ROAD DISTANCE + GEOMETRY VIA OSRM ---
async function fetchRoadDistance(origin, destination) {
  // Prefer map-picked coords; fall back to CITY_COORDS lookup
  const originCoords  = _pickedCoords['origin']      || CITY_COORDS[origin];
  const destCoords    = _pickedCoords['destination'] || CITY_COORDS[destination];

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
      // GeoJSON coordinates are [lng, lat] — convert to [lat, lng] for Leaflet
      const geometry = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return { km, geometry };
    }
    return null;
  } catch (e) {
    return null;
  }
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

    if (!origin || !destination) {
      showToast('⚠️ Моля, изберете начална и крайна точка от списъка!');
      ['origin','destination'].forEach(id => {
        const inp = document.getElementById(id + 'Input');
        if (inp && !document.getElementById(id)?.value) {
          inp.style.borderColor = 'var(--danger)';
          setTimeout(() => inp.style.borderColor = '', 2000);
        }
      });
      return;
    }

    if (!departDate) {
      showToast('⚠️ Моля, изберете дата на тръгване!');
      return;
    }

    if (selectedStations.size === 0) {
      showToast('⚠️ Изберете поне една зарядна мрежа!');
      return;
    }

    const car = getCarParams();
    if (!car.batteryCapacity || !car.realRange) {
      showToast('⚠️ Моля, въведете параметрите на автомобила!');
      return;
    }

    showLoading(true);

    // Fetch real road distance + geometry via OSRM; fall back to haversine if it fails
    let baseDistance = null;
    let routeGeometry = null;
    const roadResult = await fetchRoadDistance(origin, destination);
    if (roadResult !== null) {
      baseDistance = roadResult.km;
      routeGeometry = roadResult.geometry;
    } else {
      // Haversine fallback
      const originCoords = _pickedCoords['origin']      || CITY_COORDS[origin];
      const destCoords   = _pickedCoords['destination'] || CITY_COORDS[destination];
      if (originCoords && destCoords) {
        baseDistance = Math.round(haversineKm(originCoords[0], originCoords[1], destCoords[0], destCoords[1]));
      } else {
        // last-resort hash-based fallback
        const hashStr = (s) => [...s].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
        const distanceSeed = Math.abs(hashStr(origin + destination));
        baseDistance = 150 + (distanceSeed % 450);
      }
    }

    setTimeout(() => {
      const results = computeResults({
        origin, destination, departDate, returnDate,
        batteryLevel, minArrivalCharge, weather, traffic, drivingStyle, car,
        baseDistance
      });
      renderResults(results);
      showLoading(false);
      document.getElementById('results').classList.add('visible');
      document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });

      showChargingMap(origin, destination, routeGeometry);
    }, 400);
  })();
}

// --- LEAFLET MAP WITH REAL BG CHARGING STATIONS ---
function showChargingMap(origin, destination, routeGeometry) {
  const mapSection = document.getElementById('mapSection');
  mapSection.style.display = 'block';

  const originCoords  = _pickedCoords['origin']      || CITY_COORDS[origin];
  const destCoords    = _pickedCoords['destination'] || CITY_COORDS[destination];

  if (!originCoords || !destCoords) return;

  if (_leafletMap) {
    _leafletMap.remove();
    _leafletMap = null;
  }

  const map = L.map('chargingMap', { zoomControl: true }).setView([42.7, 25.5], 7);
  _leafletMap = map;

  // Carto dark-matter tiles (vsichkotok.bg style)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO',
    maxZoom: 19,
  }).addTo(map);

  // Draw route: real road if geometry available, dashed straight-line fallback otherwise
  let routePolyline;
  if (routeGeometry && routeGeometry.length > 1) {
    routePolyline = L.polyline(routeGeometry, {
      color: '#00bcd4',
      weight: 4,
      opacity: 1,
    }).addTo(map);
  } else {
    routePolyline = L.polyline([originCoords, destCoords], {
      color: '#00bcd4',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 6',
    }).addTo(map);
  }

  // Origin marker — single clean tooltip
  L.circleMarker(originCoords, { radius: 10, color: '#ffffff', weight: 3, fillColor: '#00bcd4', fillOpacity: 1 })
    .addTo(map)
    .bindTooltip(origin, { permanent: true, direction: 'top', className: 'map-city-label', offset: [0, -12] });

  // Destination marker — single clean tooltip
  L.circleMarker(destCoords, { radius: 10, color: '#ffffff', weight: 3, fillColor: '#10b981', fillOpacity: 1 })
    .addTo(map)
    .bindTooltip(destination, { permanent: true, direction: 'top', className: 'map-city-label', offset: [0, -12] });

  // Network color map
  const networkColors = {
    'Tesla':       '#ef4444',
    'Ionity':      '#f59e0b',
    'ChargePoint': '#3b82f6',
    'Eldrive':     '#10b981',
    'EVN':         '#8b5cf6',
    'Recharge BG': '#64748b',
  };

  // Returns minimum distance from point (pLat, pLng) to any segment in routePoints array
  function minDistanceToPolylineKm(pLat, pLng, routePoints) {
    let minDist = Infinity;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const [aLat, aLng] = routePoints[i];
      const [bLat, bLng] = routePoints[i + 1];
      const ax = aLng, ay = aLat, bx = bLng, by = bLat, px = pLng, py = pLat;
      const abx = bx - ax, aby = by - ay;
      const lenSq = abx * abx + aby * aby;
      const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
      const closestLng = ax + t * abx;
      const closestLat = ay + t * aby;
      const dist = haversineKm(pLat, pLng, closestLat, closestLng);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  // Straight-line segment fallback
  function pointToSegmentDistanceKm(pLat, pLng, aLat, aLng, bLat, bLng) {
    const ax = aLng, ay = aLat, bx = bLng, by = bLat, px = pLng, py = pLat;
    const abx = bx - ax, aby = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)));
    const closestLng = ax + t * abx;
    const closestLat = ay + t * aby;
    return haversineKm(pLat, pLng, closestLat, closestLng);
  }

  const THRESHOLD_KM = 80;
  let nearby;
  if (routeGeometry && routeGeometry.length > 1) {
    nearby = BG_CHARGING_STATIONS.filter(s =>
      minDistanceToPolylineKm(s.lat, s.lng, routeGeometry) <= THRESHOLD_KM
    );
  } else {
    nearby = BG_CHARGING_STATIONS.filter(s =>
      pointToSegmentDistanceKm(s.lat, s.lng, originCoords[0], originCoords[1], destCoords[0], destCoords[1]) <= THRESHOLD_KM
    );
  }

  // If fewer than 3 pass filter, show all
  if (nearby.length < 3) nearby = BG_CHARGING_STATIONS;

  nearby.forEach(s => {
    const color = networkColors[s.network] || '#00bcd4';
    L.circleMarker([s.lat, s.lng], {
      radius: 7,
      color: color,
      fillColor: color,
      fillOpacity: 0.95,
      weight: 2,
    }).addTo(map)
      .bindPopup(`<b>⚡ ${s.name}</b><br>Мрежа: ${s.network}<br>Мощност: ${s.power}`);
  });

  map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
}

// --- COMPUTE ---
function computeResults({ origin, destination, departDate, returnDate,
  batteryLevel, minArrivalCharge, weather, traffic, drivingStyle, car, baseDistance }) {

  const isRoundTrip = !!returnDate;
  const totalDistance = isRoundTrip ? baseDistance * 2 : baseDistance;

  // Consumption modifiers
  const wMod = WEATHER_MODIFIERS[weather]?.modifier || 1;
  const tMod = TRAFFIC_MODIFIERS[traffic]?.modifier || 1;
  const dMod = DRIVING_STYLE_MODIFIERS[drivingStyle]?.modifier || 1;
  const totalMod = wMod * tMod * dMod;

  const adjConsumption = car.consumption * totalMod; // kWh/100km
  const totalKwh = (totalDistance / 100) * adjConsumption;

  // How much already in battery
  const availableKwh = (batteryLevel / 100) * car.batteryCapacity;
  const neededKwh = Math.max(0, totalKwh - availableKwh);

  // Number of charge stops
  const usablePerCharge = (1 - minArrivalCharge / 100) * car.batteryCapacity;
  const chargeStops = Math.max(0, Math.ceil((totalKwh - availableKwh) / usablePerCharge));

  // Get selected network prices
  const activeNetworks = CHARGING_NETWORKS.filter(n => selectedStations.has(n.id));

  // Price with dynamic market modifier
  const dateObj = departDate ? new Date(departDate) : new Date();
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const isPeakHour = dateObj.getHours() >= 17 && dateObj.getHours() <= 20;
  const marketModifier = isWeekend ? 1.12 : isPeakHour ? 1.18 : 1.0;

  const networkCosts = activeNetworks.map(n => {
    const price = n.basePrice * marketModifier * BGN_TO_EUR;
    const cost = neededKwh * price;
    return { ...n, adjustedPrice: price, totalCost: cost };
  });

  networkCosts.sort((a, b) => a.totalCost - b.totalCost);
  const cheapest = networkCosts[0];
  const mostExpensive = networkCosts[networkCosts.length - 1];
  const avgCost = networkCosts.reduce((s, n) => s + n.totalCost, 0) / networkCosts.length;

  // Comparison with petrol car
  const petrolConsumption = 7.5;
  const petrolCost = (totalDistance / 100) * petrolConsumption * PETROL_PRICE_EUR;

  const savings = petrolCost - avgCost;
  const stopDistance = Math.round(baseDistance / (chargeStops + 1));

  return {
    origin, destination, departDate, returnDate,
    isRoundTrip, baseDistance, totalDistance,
    adjConsumption, totalKwh, neededKwh,
    availableKwh, chargeStops, minArrivalCharge,
    networkCosts, cheapest, mostExpensive, avgCost,
    petrolCost, savings, stopDistance,
    weather, traffic, drivingStyle, marketModifier,
    totalMod, car,
  };
}

// --- RENDER RESULTS ---
function renderResults(r) {
  _lastResults = r;
  window._lastResults = r;  // expose for Firebase module saveTrip
  const container = document.getElementById('results');

  const savingsColor = r.savings >= 0 ? 'color:var(--accent3)' : 'color:var(--danger)';
  const savingsSign = r.savings >= 0 ? '+' : '';

  const stops = buildRouteStops(r);

  const chargeTimeNote = r.chargeStops > 0
    ? `<div class="breakdown-row">
        <span class="label">⚡ Макс. мощност зареждане</span>
        <span class="value">${r.car.maxChargePower} kW</span>
      </div>
      <div class="breakdown-row">
        <span class="label">🕐 Прогн. зареждане (20–100%)</span>
        <span class="value">${Math.round((r.car.batteryCapacity * 0.8) / r.car.maxChargePower * 60)} мин</span>
      </div>`
    : '';

  container.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem">
      <div class="results-header">
        <div>
          <div class="results-title">📊 Резултати от изчислението</div>
          <div class="results-subtitle">${r.origin} → ${r.destination}${r.isRoundTrip ? ' → ' + r.origin : ''}</div>
        </div>
        <div class="results-meta">
          ${formatDate(r.departDate)}<br>
          ${r.isRoundTrip ? 'Двупосочно' : 'Еднопосочно'}
        </div>
      </div>

      <div class="weather-strip">
        ${buildWeatherChips(r)}
      </div>

      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-val cyan">${r.totalDistance} км</div>
          <div class="stat-label">Разстояние</div>
        </div>
        <div class="stat-box">
          <div class="stat-val amber">${r.totalKwh.toFixed(1)} kWh</div>
          <div class="stat-label">Общо енергия</div>
        </div>
        <div class="stat-box">
          <div class="stat-val purple">${r.chargeStops}</div>
          <div class="stat-label">Зареждания</div>
        </div>
        <div class="stat-box">
          <div class="stat-val green">${r.avgCost.toFixed(2)} €</div>
          <div class="stat-label">Ср. разход</div>
        </div>
      </div>
    </div>

    <div class="breakdown-grid">
      <div class="breakdown-card">
        <h3>⚡ Разход по зарядни мрежи</h3>
        ${r.networkCosts.map(n => `
          <div class="breakdown-row ${n.id === r.cheapest.id ? 'highlight' : ''}">
            <span class="label" style="display:flex;align-items:center;gap:0.4rem">
              <span style="width:8px;height:8px;border-radius:50%;background:${n.dot};display:inline-block"></span>
              ${n.name} ${n.id === r.cheapest.id ? '✓' : ''}
            </span>
            <span class="value" style="${n.id === r.cheapest.id ? 'color:var(--accent3)' : ''}">
              ${n.totalCost.toFixed(2)} €
            </span>
          </div>
        `).join('')}
        <div class="breakdown-row highlight" style="margin-top:0.5rem;border-top:1px solid var(--border);padding-top:0.75rem">
          <span class="label">💡 Спестявате (vs найевтиното)</span>
          <span class="value" style="color:var(--accent)">
            ${(r.mostExpensive.totalCost - r.cheapest.totalCost).toFixed(2)} €
          </span>
        </div>
      </div>

      <div class="breakdown-card">
        <h3>📋 Детайлно изчисление</h3>
        <div class="breakdown-row">
          <span class="label">Разстояние</span>
          <span class="value">${r.totalDistance} км</span>
        </div>
        <div class="breakdown-row">
          <span class="label">Разход (${r.car.carName})</span>
          <span class="value">${r.adjConsumption.toFixed(1)} kWh/100км</span>
        </div>
        <div class="breakdown-row">
          <span class="label">Наличен заряд</span>
          <span class="value">${r.availableKwh.toFixed(1)} kWh (${Math.round(r.availableKwh/r.car.batteryCapacity*100)}%)</span>
        </div>
        <div class="breakdown-row">
          <span class="label">Нужно зареждане</span>
          <span class="value">${r.neededKwh.toFixed(1)} kWh</span>
        </div>
        <div class="breakdown-row">
          <span class="label">Мин. заряд при спирка</span>
          <span class="value">${r.minArrivalCharge}%</span>
        </div>
        <div class="breakdown-row">
          <span class="label">Пазарен коефициент</span>
          <span class="value" style="color:var(--warning)">×${r.marketModifier.toFixed(2)}</span>
        </div>
        <div class="breakdown-row">
          <span class="label">Модификатор (метео+трафик+стил)</span>
          <span class="value" style="color:var(--warning)">×${r.totalMod.toFixed(2)}</span>
        </div>
        ${chargeTimeNote}
        <div class="breakdown-row highlight">
          <span class="label">Най-евтина опция</span>
          <span class="value">${r.cheapest.totalCost.toFixed(2)} €</span>
        </div>
      </div>
    </div>

    <div class="route-visual">
      <h3>🗺️ Маршрут и точки за зареждане</h3>
      <div class="route-timeline">
        ${stops}
      </div>
    </div>

    <div class="comparison-section">
      <h3>⚖️ Сравнение с бензинов автомобил</h3>
      ${r.networkCosts.map(n => `
        <div class="comparison-item">
          <div class="comparison-label-row">
            <span class="comparison-label">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${n.dot};margin-right:6px"></span>
              ${n.name}
            </span>
            <span class="comparison-amount" style="color:var(--accent)">${n.totalCost.toFixed(2)} €</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${Math.min(100, (n.totalCost/r.petrolCost)*100).toFixed(0)}%;background:${n.dot}"></div>
          </div>
        </div>
      `).join('')}
      <div class="comparison-item">
        <div class="comparison-label-row">
          <span class="comparison-label">⛽ Бензин (7.5L/100км @ ${PETROL_PRICE_EUR.toFixed(3)} €/л)</span>
          <span class="comparison-amount" style="color:var(--muted)">${r.petrolCost.toFixed(2)} €</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:100%;background:var(--muted)"></div>
        </div>
      </div>
      <div style="margin-top:1.25rem;padding:1rem;background:var(--surface);border-radius:10px;text-align:center">
        <div style="font-size:0.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.4rem">Спестявания с най-евтина EV опция</div>
        <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;${savingsColor}">${savingsSign}${r.savings.toFixed(2)} €</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-top:0.3rem">${r.savings >= 0 ? '✅ Електромобилът е по-изгоден!' : '⚠️ Бензинът е по-евтин за това пътуване'}</div>
      </div>
    </div>

    <div style="text-align:center;margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      <button class="btn-calculate" id="saveTripBtn" onclick="window.saveTrip && window.saveTrip()"
        style="max-width:260px;background:linear-gradient(135deg,rgba(124,58,237,0.8),rgba(79,70,229,0.8));border:1px solid rgba(124,58,237,0.4)">
        💾 Запази трип
      </button>
      <button class="btn-calculate" onclick="window.print()" style="max-width:260px;background:var(--surface);color:var(--text);border:1px solid var(--border)">
        🖨️ Разпечатай / Запази PDF
      </button>
    </div>
  `;
}

function buildRouteStops(r) {
  const stops = [];
  const numStops = r.chargeStops;

  stops.push(`
    <div class="route-stop">
      <div class="route-dot start"></div>
      <div class="route-stop-name">📍 ${r.origin}</div>
      <div class="route-stop-detail">Старт · Батерия: ${Math.round(r.availableKwh / r.car.batteryCapacity * 100)}% · ${r.adjConsumption.toFixed(1)} kWh/100км</div>
    </div>
  `);

  for (let i = 0; i < numStops; i++) {
    const dist = r.stopDistance * (i + 1);
    const cheapNet = r.cheapest;
    const kwNeeded = (r.stopDistance / 100) * r.adjConsumption;
    const cost = kwNeeded * cheapNet.adjustedPrice;

    stops.push(`
      <div class="route-stop">
        <div class="route-dot charge"></div>
        <div class="route-stop-name">⚡ Зарядна станция ${i + 1}</div>
        <div class="route-stop-detail">~${dist} км от старта · Препоръчваме: ${cheapNet.name} (${cheapNet.power})</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.4rem">
          <span class="route-stop-cost">🔋 Зарежда се от ~${r.minArrivalCharge}% до 80%</span>
          <span class="route-stop-cost" style="background:rgba(16,185,129,0.1);color:var(--accent3)">💰 ${cost.toFixed(2)} €</span>
          <span class="route-stop-cost" style="background:rgba(245,158,11,0.1);color:var(--warning)">${cheapNet.adjustedPrice.toFixed(3)} €/kWh</span>
        </div>
      </div>
    `);
  }

  if (r.isRoundTrip) {
    stops.push(`
      <div class="route-stop">
        <div class="route-dot end" style="background:var(--accent2)"></div>
        <div class="route-stop-name">🔄 ${r.destination}</div>
        <div class="route-stop-detail">Обрат · ${r.baseDistance} км · ${formatDate(r.returnDate)}</div>
      </div>
    `);
  }

  stops.push(`
    <div class="route-stop">
      <div class="route-dot end"></div>
      <div class="route-stop-name">${r.isRoundTrip ? '🏠 ' + r.origin : '🏁 ' + r.destination}</div>
      <div class="route-stop-detail">Пристигане · Общо ${r.totalDistance} км · ${r.totalKwh.toFixed(1)} kWh</div>
    </div>
  `);

  return stops.join('');
}

function buildWeatherChips(r) {
  const w = WEATHER_MODIFIERS[r.weather];
  const t = TRAFFIC_MODIFIERS[r.traffic];
  const d = DRIVING_STYLE_MODIFIERS[r.drivingStyle];

  return `
    <div class="weather-chip"><span>${w.icon}</span><span>${w.label.split(' ').slice(1).join(' ')}</span></div>
    <div class="weather-chip"><span>🚦</span><span>Трафик: ${t.label}</span></div>
    <div class="weather-chip"><span>🏎️</span><span>Стил: ${d.label}</span></div>
    <div class="weather-chip"><span>🚗</span><span>${r.car.carName} · ${r.car.realRange} км</span></div>
    ${r.marketModifier > 1.0 ? `<div class="weather-chip" style="border-color:rgba(245,158,11,0.3);color:var(--warning)"><span>📈</span><span>Динамична цена ×${r.marketModifier.toFixed(2)}</span></div>` : ''}
  `;
}

// --- UTILS ---
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('bg-BG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function showLoading(state) {
  document.querySelector('.loading-overlay').classList.toggle('active', state);
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