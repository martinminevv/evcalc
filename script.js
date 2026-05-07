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

// --- STATE ---
let selectedStations = new Set(['tesla_sc', 'ionity', 'chargepoint']);

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
  // returnDate starts empty — user enables it via checkbox
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
      // Default return date = depart + 3 days
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
  }

  if (batteryInput && rangeInput && consumptionDisplay) {
    batteryInput.addEventListener('input', updateConsumption);
    rangeInput.addEventListener('input', updateConsumption);
    updateConsumption();
  }
}

function getCarParams() {
  const carName = document.getElementById('carName')?.value.trim() || 'Мой автомобил';
  const batteryCapacity = parseFloat(document.getElementById('batteryCapacity')?.value) || 75;
  const realRange = parseFloat(document.getElementById('realRange')?.value) || 400;
  const consumption = batteryCapacity / realRange * 100;
  return { carName, batteryCapacity, realRange, consumption };
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
          <div class="price">${s.basePrice.toFixed(2)} лв</div>
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
  ];

  rangeInputs.forEach(({ id, valId, suffix }) => {
    const input = document.getElementById(id);
    const val = document.getElementById(valId);
    if (input && val) {
      val.textContent = input.value + suffix;
      input.addEventListener('input', () => {
        val.textContent = input.value + suffix;
      });
    }
  });
}

// --- CALCULATE ---
function calculate() {
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
    showToast('⚠️ Моля, въведете начална и крайна точка!');
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
  setTimeout(() => {
    const results = computeResults({
      origin, destination, departDate, returnDate,
      batteryLevel, minArrivalCharge, weather, traffic, drivingStyle, car
    });
    renderResults(results);
    showLoading(false);
    document.getElementById('results').classList.add('visible');
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1200);
}

// --- COMPUTE ---
function computeResults({ origin, destination, departDate, returnDate,
  batteryLevel, minArrivalCharge, weather, traffic, drivingStyle, car }) {

  // Simulated distance based on string hashing for demo determinism
  const hashStr = (s) => [...s].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
  const distanceSeed = Math.abs(hashStr(origin + destination));
  const baseDistance = 150 + (distanceSeed % 450); // 150–600 km

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

  // Number of charge stops — based on minArrivalCharge threshold
  // Stop when battery would drop below minArrivalCharge% of capacity
  const usablePerCharge = (1 - minArrivalCharge / 100) * car.batteryCapacity;
  const chargeStops = Math.max(0, Math.ceil((totalKwh - availableKwh) / usablePerCharge));

  // Get selected network prices
  const activeNetworks = CHARGING_NETWORKS.filter(n => selectedStations.has(n.id));

  // Price with dynamic market modifier (weekend/weekday)
  const dateObj = departDate ? new Date(departDate) : new Date();
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const isPeakHour = dateObj.getHours() >= 17 && dateObj.getHours() <= 20;
  const marketModifier = isWeekend ? 1.12 : isPeakHour ? 1.18 : 1.0;

  const networkCosts = activeNetworks.map(n => {
    const price = n.basePrice * marketModifier;
    const cost = neededKwh * price;
    return { ...n, adjustedPrice: price, totalCost: cost };
  });

  // Best (cheapest) and worst (most expensive)
  networkCosts.sort((a, b) => a.totalCost - b.totalCost);
  const cheapest = networkCosts[0];
  const mostExpensive = networkCosts[networkCosts.length - 1];
  const avgCost = networkCosts.reduce((s, n) => s + n.totalCost, 0) / networkCosts.length;

  // Comparison with petrol car
  const petrolConsumption = 7.5; // L/100km
  const petrolPrice = 2.45; // BGN/L (simulated)
  const petrolCost = (totalDistance / 100) * petrolConsumption * petrolPrice;

  // Savings
  const savings = petrolCost - avgCost;

  // Route stops
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
  const container = document.getElementById('results');

  const savingsColor = r.savings >= 0 ? 'color:var(--accent3)' : 'color:var(--danger)';
  const savingsSign = r.savings >= 0 ? '+' : '';

  // Build route stops
  const stops = buildRouteStops(r);

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
          <div class="stat-val green">${r.avgCost.toFixed(2)} лв</div>
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
              ${n.totalCost.toFixed(2)} лв
            </span>
          </div>
        `).join('')}
        <div class="breakdown-row highlight" style="margin-top:0.5rem;border-top:1px solid var(--border);padding-top:0.75rem">
          <span class="label">💡 Спестявате (vs найевтиното)</span>
          <span class="value" style="color:var(--accent)">
            ${(r.mostExpensive.totalCost - r.cheapest.totalCost).toFixed(2)} лв
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
        <div class="breakdown-row highlight">
          <span class="label">Най-евтина опция</span>
          <span class="value">${r.cheapest.totalCost.toFixed(2)} лв</span>
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
            <span class="comparison-amount" style="color:var(--accent)">${n.totalCost.toFixed(2)} лв</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${Math.min(100, (n.totalCost/r.petrolCost)*100).toFixed(0)}%;background:${n.dot}"></div>
          </div>
        </div>
      `).join('')}
      <div class="comparison-item">
        <div class="comparison-label-row">
          <span class="comparison-label">⛽ Бензин (7.5L/100км @ 2.45лв)</span>
          <span class="comparison-amount" style="color:var(--muted)">${r.petrolCost.toFixed(2)} лв</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:100%;background:var(--muted)"></div>
        </div>
      </div>
      <div style="margin-top:1.25rem;padding:1rem;background:var(--surface);border-radius:10px;text-align:center">
        <div style="font-size:0.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.4rem">Спестявания с най-евтина EV опция</div>
        <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;${savingsColor}">${savingsSign}${r.savings.toFixed(2)} лв</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-top:0.3rem">${r.savings >= 0 ? '✅ Електромобилът е по-изгоден!' : '⚠️ Бензинът е по-евтин за това пътуване'}</div>
      </div>
    </div>

    <div style="text-align:center;margin-top:1.5rem">
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
          <span class="route-stop-cost" style="background:rgba(16,185,129,0.1);color:var(--accent3)">💰 ${cost.toFixed(2)} лв</span>
          <span class="route-stop-cost" style="background:rgba(245,158,11,0.1);color:var(--warning)">${cheapNet.adjustedPrice.toFixed(2)} лв/kWh</span>
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
