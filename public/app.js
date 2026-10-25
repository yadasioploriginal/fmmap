// Polska - Mapa Nadajników DVB-T/DVB-T2 & Radio FM/DAB+/AM
// Frontend Application v2.0

(function () {
  'use strict';

  // State
  let config = null;
  let allTransmitters = [];
  let filteredTransmitters = [];
  let verifiedStreams = [];
  let map = null;
  let clusterGroup = null;
  let activeCoverageCircles = new Map(); // id -> L.Circle
  let globalCoverageEnabled = false;
  let userLocationMarker = null;
  let userLatLng = null;

  // Active calculator measurement line and target marker
  let measurementLine = null;
  let targetLocationMarker = null;

  // Calculator current transmitter
  let currentCalcTransmitter = null;

  // Filter state
  const filters = {
    categories: { tv: true, fm: true, dab: true, am: true },
    search: '',
    voivodeship: 'ALL',
    mux: 'ALL',
    system: 'ALL',
    minPowerKw: 0,
    polarization: 'ALL'
  };

  // Audio state
  let currentAudioStream = null;
  let rdsPollingInterval = null;

  // DOM elements
  const els = {
    catTv: document.getElementById('cat-tv'),
    catFm: document.getElementById('cat-fm'),
    catDab: document.getElementById('cat-dab'),
    catAm: document.getElementById('cat-am'),
    countTv: document.getElementById('count-tv'),
    countFm: document.getElementById('count-fm'),
    countDab: document.getElementById('count-dab'),
    countAm: document.getElementById('count-am'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    voivodeshipSelect: document.getElementById('voivodeshipSelect'),
    muxSelect: document.getElementById('muxSelect'),
    systemSelect: document.getElementById('systemSelect'),
    powerRange: document.getElementById('powerRange'),
    powerValue: document.getElementById('powerValue'),
    powerPresets: document.querySelectorAll('.preset-btn'),
    polButtons: document.querySelectorAll('.seg-btn'),
    statVisible: document.getElementById('statVisible'),
    statTotal: document.getElementById('statTotal'),
    statAvgPower: document.getElementById('statAvgPower'),
    statMaxPower: document.getElementById('statMaxPower'),
    toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
    sidebar: document.getElementById('sidebar'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    locateBtn: document.getElementById('locateBtn'),
    toggleCoverageBtn: document.getElementById('toggleCoverageBtn'),
    clearCoverageFloatingBtn: document.getElementById('clearCoverageFloatingBtn'),
    activeCirclesBadge: document.getElementById('activeCirclesBadge'),
    clearMeasureLineBtn: document.getElementById('clearMeasureLineBtn'),
    toggleListViewBtn: document.getElementById('toggleListViewBtn'),
    listDrawer: document.getElementById('listDrawer'),
    closeListBtn: document.getElementById('closeListBtn'),
    listContent: document.getElementById('listContent'),
    listCount: document.getElementById('listCount'),
    radioListBtn: document.getElementById('radioListBtn'),
    radioDrawer: document.getElementById('radioDrawer'),
    closeRadioDrawerBtn: document.getElementById('closeRadioDrawerBtn'),
    radioFilterInput: document.getElementById('radioFilterInput'),
    radioStreamsList: document.getElementById('radioStreamsList'),
    radioStreamsCount: document.getElementById('radioStreamsCount'),
    globalAudioBar: document.getElementById('globalAudioBar'),
    nativeAudioPlayer: document.getElementById('nativeAudioPlayer'),
    audioStationName: document.getElementById('audioStationName'),
    audioStationDetails: document.getElementById('audioStationDetails'),
    audioRdsPill: document.getElementById('audioRdsPill'),
    audioRdsText: document.getElementById('audioRdsText'),
    audioPlayPauseBtn: document.getElementById('audioPlayPauseBtn'),
    audioStopBtn: document.getElementById('audioStopBtn'),
    audioVolume: document.getElementById('audioVolume'),
    audioCloseBtn: document.getElementById('audioCloseBtn'),
    detailModal: document.getElementById('detailModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalTitle: document.getElementById('modalTitle'),
    modalCategoryBadge: document.getElementById('modalCategoryBadge'),
    modalBody: document.getElementById('modalBody'),
    calcModal: document.getElementById('calcModal'),
    closeCalcModalBtn: document.getElementById('closeCalcModalBtn'),
    calcTransmitterTitle: document.getElementById('calcTransmitterTitle'),
    calcTopInfo: document.getElementById('calcTopInfo'),
    calcLocationInput: document.getElementById('calcLocationInput'),
    calcSubmitBtn: document.getElementById('calcSubmitBtn'),
    calcLoading: document.getElementById('calcLoading'),
    calcResults: document.getElementById('calcResults'),
    mapToast: document.getElementById('mapToast')
  };

  // Toast notification helper
  function showToast(message, duration = 2500) {
    if (!els.mapToast) return;
    els.mapToast.textContent = message;
    els.mapToast.classList.remove('hidden');
    els.mapToast.style.opacity = '1';
    clearTimeout(els.mapToast._timer);
    els.mapToast._timer = setTimeout(() => {
      els.mapToast.style.opacity = '0';
      setTimeout(() => els.mapToast.classList.add('hidden'), 300);
    }, duration);
  }

  // Pin Icons Factory
  function createPinIcon(category) {
    let glyph = '📡';
    let pinClass = 'pin-tv';
    if (category === 'tv') { glyph = '📺'; pinClass = 'pin-tv'; }
    else if (category === 'fm') { glyph = '📻'; pinClass = 'pin-fm'; }
    else if (category === 'dab') { glyph = '🟣'; pinClass = 'pin-dab'; }
    else if (category === 'am') { glyph = '🗼'; pinClass = 'pin-am'; }

    return L.divIcon({
      className: `custom-pin-wrapper`,
      html: `<div class="custom-pin ${pinClass}"><span class="pin-icon">${glyph}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -32]
    });
  }

  // Category Colors
  function getCategoryColor(category) {
    switch (category) {
      case 'tv': return '#0284c7';
      case 'fm': return '#16a34a';
      case 'dab': return '#9333ea';
      case 'am': return '#ea580c';
      default: return '#3b82f6';
    }
  }

  // Initialize App
  async function init() {
    try {
      // 1. Fetch Config
      const configRes = await fetch('/api/config');
      config = await configRes.json();
      document.title = config.title || document.title;

      if (config.filters && config.filters.defaultVisible) {
        filters.categories = { ...config.filters.defaultVisible };
        els.catTv.checked = !!filters.categories.tv;
        els.catFm.checked = !!filters.categories.fm;
        els.catDab.checked = !!filters.categories.dab;
        els.catAm.checked = !!filters.categories.am;
        updatePillClasses();
      }

      // 2. Initialize Leaflet Map
      initMap();

      // 3. Load Stats, Transmitters & Radio Streams
      await Promise.all([loadStats(), loadTransmitters(), loadRadioStreams()]);

      // 4. Attach Event Listeners
      setupEvents();

      // 5. Initial Render
      applyFilters();
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Błąd ładowania danych: ' + err.message, 5000);
    }
  }

  // Initialize Leaflet Map
  function initMap() {
    const center = (config && config.initialCenter) || [52.0693, 19.4803];
    const zoom = (config && config.initialZoom) || 7;
    const minZoom = (config && config.minZoom) || 5;
    const maxZoom = (config && config.maxZoom) || 18;
    const tileUrl = (config && config.tileLayer && config.tileLayer.url) || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttr = (config && config.tileLayer && config.tileLayer.attribution) || '&copy; OpenStreetMap';

    map = L.map('map', {
      center: center,
      zoom: zoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer(tileUrl, {
      attribution: tileAttr,
      maxZoom: maxZoom
    }).addTo(map);

    // Marker Cluster Group
    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: (config && config.maxClusterRadius) || 50,
      spiderfyDistanceMultiplier: 2.2, // Fans out spiderfied dots with generous spacing
      spiderLegPolylineOptions: { weight: 1.5, color: '#38bdf8', opacity: 0.6 },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 14
    });

    map.addLayer(clusterGroup);
  }

  // Load Stats from API
  async function loadStats() {
    const res = await fetch('/api/stats');
    const stats = await res.json();

    if (stats.counts) {
      els.countTv.textContent = stats.counts.tv?.toLocaleString('pl-PL') || '0';
      els.countFm.textContent = stats.counts.fm?.toLocaleString('pl-PL') || '0';
      els.countDab.textContent = stats.counts.dab?.toLocaleString('pl-PL') || '0';
      els.countAm.textContent = stats.counts.am?.toLocaleString('pl-PL') || '0';
      els.statTotal.textContent = stats.counts.total?.toLocaleString('pl-PL') || '0';
    }

    // Populate Voivodeship select
    if (stats.voivodeships) {
      stats.voivodeships.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v.charAt(0) + v.slice(1).toLowerCase();
        els.voivodeshipSelect.appendChild(opt);
      });
    }

    // Populate TV Multiplex select
    if (stats.tvMultiplexes) {
      stats.tvMultiplexes.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        els.muxSelect.appendChild(opt);
      });
    }
  }

  // Load Transmitters
  async function loadTransmitters() {
    const res = await fetch('/api/transmitters');
    allTransmitters = await res.json();
    console.log(`Pomyślnie załadowano ${allTransmitters.length} nadajników.`);
  }

  // Load Verified Radio Streams
  async function loadRadioStreams() {
    try {
      const res = await fetch('/api/radio-streams');
      verifiedStreams = await res.json();
      els.radioStreamsCount.textContent = verifiedStreams.length;
      renderRadioStreamsList(verifiedStreams);
    } catch (e) {
      console.warn('Nie udało się załadować strumieni radiowych:', e);
    }
  }

  // Render Radio Streams in Drawer
  function renderRadioStreamsList(streams) {
    els.radioStreamsList.innerHTML = '';
    streams.forEach(s => {
      const div = document.createElement('div');
      div.className = 'radio-stream-item';
      div.innerHTML = `
        <div class="radio-stream-info">
          <strong>${escapeHtml(s.name)}</strong>
          <span>Odsłuch na żywo &bull; MP3/AAC</span>
        </div>
        <button class="radio-play-btn" title="Odtwórz stację">▶</button>
      `;

      div.onclick = () => {
        playAudioStream(s.name, s.streamUrl, 'Strumień internetowy (webradio)');
      };

      els.radioStreamsList.appendChild(div);
    });
  }

  // Fetch live RDS from backend for active stream
  async function fetchRdsForActiveStream(force = false) {
    if (!currentAudioStream || !currentAudioStream.url) return;
    const url = currentAudioStream.url;
    const stationName = currentAudioStream.name || '';
    try {
      const qs = new URLSearchParams({
        url: url,
        station: stationName,
        _t: Date.now().toString()
      });
      if (force) qs.set('force', '1');
      const res = await fetch(`/api/rds?${qs.toString()}`);
      const data = await res.json();
      if (data && currentAudioStream && currentAudioStream.url === url) {
        let text = '';
        if (data.title && data.title !== 'Brak danych RDS') {
          const trackTime = data.trackTime ? `[${data.trackTime}] ` : '';
          text = `RDS: ${trackTime}${data.title}`;
        } else if (data.station) {
          text = `RDS: ${data.station}`;
        }

        if (text) {
          if (els.audioRdsText.textContent !== text) {
            els.audioRdsText.textContent = text;
            els.audioRdsPill.classList.remove('hidden');
            els.audioRdsPill.classList.add('rds-pill-pulse');
            setTimeout(() => els.audioRdsPill.classList.remove('rds-pill-pulse'), 800);
          } else {
            els.audioRdsPill.classList.remove('hidden');
          }
        }
      }
    } catch {}
  }

  // Audio Playback
  function playAudioStream(name, url, details = '') {
    if (!url) {
      showToast('Brak dostępnego strumienia online dla tej stacji.');
      return;
    }

    if (rdsPollingInterval) {
      clearInterval(rdsPollingInterval);
      rdsPollingInterval = null;
    }

    currentAudioStream = { name, url, details };
    els.audioStationName.textContent = name;
    els.audioStationDetails.textContent = details;
    els.audioRdsPill.classList.add('hidden');
    els.audioRdsText.textContent = 'RDS: Pobieranie...';

    els.nativeAudioPlayer.src = url;
    els.nativeAudioPlayer.play().then(() => {
      els.globalAudioBar.classList.remove('hidden');
      els.globalAudioBar.classList.add('playing');
      els.audioPlayPauseBtn.textContent = '⏸';
      showToast(`Odtwarzanie stacji: ${name}`);

      // Fetch RDS immediately and poll every 12 seconds
      fetchRdsForActiveStream(true);
      rdsPollingInterval = setInterval(() => fetchRdsForActiveStream(false), 12000);
    }).catch(err => {
      console.error('Audio play error:', err);
      showToast(`Błąd odtwarzania strumienia (${name}): ${err.message}`);
    });
  }

  function togglePlayPause() {
    if (els.nativeAudioPlayer.paused) {
      els.nativeAudioPlayer.play();
      els.audioPlayPauseBtn.textContent = '⏸';
      els.globalAudioBar.classList.add('playing');
      fetchRdsForActiveStream();
      if (!rdsPollingInterval) {
        rdsPollingInterval = setInterval(fetchRdsForActiveStream, 10000);
      }
    } else {
      els.nativeAudioPlayer.pause();
      els.audioPlayPauseBtn.textContent = '▶';
      els.globalAudioBar.classList.remove('playing');
      if (rdsPollingInterval) {
        clearInterval(rdsPollingInterval);
        rdsPollingInterval = null;
      }
    }
  }

  function stopAudio() {
    if (rdsPollingInterval) {
      clearInterval(rdsPollingInterval);
      rdsPollingInterval = null;
    }
    els.nativeAudioPlayer.pause();
    els.nativeAudioPlayer.src = '';
    els.globalAudioBar.classList.remove('playing');
    els.globalAudioBar.classList.add('hidden');
    els.audioRdsPill.classList.add('hidden');
    currentAudioStream = null;
  }

  // Update Pill CSS classes
  function updatePillClasses() {
    document.querySelectorAll('.pill').forEach(pill => {
      const cat = pill.dataset.category;
      if (filters.categories[cat]) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  function stripDiacritics(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase();
  }

  // Apply Filters
  function applyFilters() {
    const query = stripDiacritics(filters.search.trim());
    const v = filters.voivodeship;
    const mux = filters.mux;
    const sys = filters.system;
    const minP = filters.minPowerKw;
    const pol = filters.polarization;

    filteredTransmitters = allTransmitters.filter(t => {
      // 1. Category
      if (!filters.categories[t.category]) return false;

      // 2. Voivodeship
      if (v !== 'ALL' && t.voivodeship !== v) return false;

      // 3. TV Multiplex
      if (mux !== 'ALL' && !stripDiacritics(t.programOrMux).includes(stripDiacritics(mux))) return false;

      // 4. TV System
      if (sys !== 'ALL' && !t.system.toLowerCase().includes(sys.toLowerCase())) return false;

      // 5. Min Power
      if (minP > 0 && t.powerKw < minP) return false;

      // 6. Polarization
      if (pol !== 'ALL' && t.polarization !== pol) return false;

      // 7. Search Query
      if (query.length > 0) {
        const match =
          stripDiacritics(t.name).includes(query) ||
          stripDiacritics(t.location).includes(query) ||
          stripDiacritics(t.programOrMux).includes(query) ||
          stripDiacritics(t.broadcaster).includes(query) ||
          t.frequency.toString().includes(query) ||
          (t.channel && t.channel.toLowerCase().includes(query)) ||
          stripDiacritics(t.voivodeship).includes(query) ||
          (t.streamName && stripDiacritics(t.streamName).includes(query)) ||
          (t.channelsList && t.channelsList.some(c => stripDiacritics(c).includes(query)));
        if (!match) return false;
      }

      return true;
    });

    renderMarkers();
    updateStatsDisplay();
    renderListView();
  }

  // Render Markers on Map
  function renderMarkers() {
    clusterGroup.clearLayers();
    // Do not clear activeCoverageCircles so manually opened circles persist across filter shifts!

    const markers = [];

    for (const t of filteredTransmitters) {
      const marker = L.marker([t.lat, t.lon], {
        icon: createPinIcon(t.category),
        title: `${t.name} - ${t.programOrMux} (${t.frequency} ${t.frequencyUnit})`
      });

      // Bind popup
      marker.bindPopup(() => createPopupHtml(t), {
        maxWidth: 340,
        className: 'custom-leaflet-popup',
        offset: [0, -20],
        autoPan: true,
        autoPanPaddingTopLeft: [50, 140],
        autoPanPaddingBottomRight: [50, 50]
      });

      // When marker is clicked, dynamically lift popup above ALL dots in this spiderfied group
      marker.on('click', () => {
        let yOffset = -24;
        if (clusterGroup && clusterGroup._spiderfied) {
          const children = clusterGroup._spiderfied.getAllChildMarkers();
          if (children && children.includes(marker)) {
            const clickedPt = map.latLngToContainerPoint(marker.getLatLng());
            let minY = clickedPt.y;
            for (const child of children) {
              const pt = map.latLngToContainerPoint(child.getLatLng());
              if (pt.y < minY) {
                minY = pt.y;
              }
            }
            const deltaY = clickedPt.y - minY;
            // Place popup 36px cleanly above the highest dot in the spiderfied group
            yOffset = -(deltaY + 36);
          }
        }
        const popup = marker.getPopup();
        if (popup) {
          popup.options.offset = [0, yOffset];
        }
      });

      marker.on('popupopen', () => {
        const pinEl = marker.getElement()?.querySelector('.custom-pin');
        if (pinEl) pinEl.classList.add('pin-selected');
        attachPopupEvents(t, marker);
      });

      marker.on('popupclose', () => {
        const pinEl = marker.getElement()?.querySelector('.custom-pin');
        if (pinEl) pinEl.classList.remove('pin-selected');
        if (marker._popupRdsTimer) {
          clearInterval(marker._popupRdsTimer);
          marker._popupRdsTimer = null;
        }
      });

      markers.push(marker);

      if (globalCoverageEnabled) {
        addCoverageCircle(t);
      }
    }

    clusterGroup.addLayers(markers);
  }

  // Create Popup Content HTML
  function createPopupHtml(t) {
    const badgeClass = `badge-${t.category}`;
    const freqDisplay = t.channel 
      ? `${t.frequency} ${t.frequencyUnit} (k. ${t.channel})`
      : `${t.frequency} ${t.frequencyUnit}`;

    const polDisplay = t.polarization === 'H' ? 'Pozioma (H)' : t.polarization === 'V' ? 'Pionowa (V)' : t.polarization;
    const charDisplay = t.radiationPattern === 'ND' ? 'Dookólna (ND)' : t.radiationPattern === 'D' ? 'Kierunkowa (D)' : t.radiationPattern;

    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;
    const isCircleActive = activeCoverageCircles.has(t.id);

    // Audio player button if stream available
    let audioHtml = '';
    if (t.streamUrl) {
      audioHtml = `
        <button class="popup-audio-btn" id="btn-audio-${t.id}">
          <span>▶️ Odsłuchaj na żywo: ${escapeHtml(t.streamName || t.programOrMux)}</span>
        </button>
      `;
    }

    // Live RDS box for radio transmitters
    let rdsHtml = '';
    if (t.category === 'fm' || t.category === 'dab' || t.category === 'am') {
      rdsHtml = `
        <div class="popup-rds-badge" id="popup-rds-${t.id}">
          <span class="rds-pulse-dot"></span>
          <span class="popup-rds-label">RDS:</span>
          <span class="popup-rds-title" id="popup-rds-title-${t.id}">Pobieranie danych na żywo...</span>
        </div>
      `;
    }

    // TV Channels list if available
    let tvChannelsHtml = '';
    if (t.channelsList && t.channelsList.length > 0) {
      tvChannelsHtml = `
        <div class="popup-tv-channels">
          <strong>Kanały w ${escapeHtml(t.programOrMux)}:</strong>
          <div>${escapeHtml(t.channelsList.join(', '))}</div>
        </div>
      `;
    }

    return `
      <div class="popup-container">
        <div class="popup-badge-row">
          <span class="badge ${badgeClass}">${t.categoryLabel}</span>
          <span style="font-size:11px;color:var(--text-muted);font-weight:600;">${t.system}</span>
        </div>
        <div class="popup-title">${escapeHtml(t.name)}</div>
        <div class="popup-subtitle">${escapeHtml(t.location || t.voivodeship)}</div>

        ${audioHtml}
        ${rdsHtml}

        <table class="popup-info-table">
          <tr><td>Co nadaje:</td><td><strong>${escapeHtml(t.programOrMux)}</strong></td></tr>
          <tr><td>Kto nadaje:</td><td><strong>${escapeHtml(t.broadcaster)}</strong></td></tr>
          <tr><td>Częstotliwość:</td><td>${freqDisplay}</td></tr>
          <tr><td>Moc ERP:</td><td><strong>${t.powerKw} kW</strong> (${t.powerDbw} dBW)</td></tr>
          <tr><td>Wysokość:</td><td>${t.heightAgl} m n.p.t. (${t.heightAmsl} m n.p.m.)</td></tr>
          <tr><td>Polaryzacja:</td><td>${polDisplay} (${charDisplay})</td></tr>
        </table>

        ${tvChannelsHtml}

        <div class="popup-btn-row">
          <button class="popup-btn ${isCircleActive ? 'popup-btn-active-circle' : ''}" id="btn-coverage-${t.id}">
            ${isCircleActive ? '❌ Wyłącz obręb' : `📡 Zasięg (~${t.estimatedRangeKm} km)`}
          </button>
          <button class="popup-btn" id="btn-calc-${t.id}">📐 Oblicz sygnał</button>
          <button class="popup-btn" id="btn-detail-${t.id}">ℹ️ Więcej</button>
        </div>
        <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
          <button id="btn-copy-${t.id}" style="background:none;border:none;color:var(--text-dim);font-size:11px;cursor:pointer;">📋 Kopiuj współrzędne</button>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);font-size:11px;text-decoration:none;">Google Maps &rarr;</a>
        </div>
      </div>
    `;
  }

  // Attach Event Listeners to Popup Elements
  function attachPopupEvents(t, marker) {
    const covBtn = document.getElementById(`btn-coverage-${t.id}`);
    const calcBtn = document.getElementById(`btn-calc-${t.id}`);
    const copyBtn = document.getElementById(`btn-copy-${t.id}`);
    const detailBtn = document.getElementById(`btn-detail-${t.id}`);
    const audioBtn = document.getElementById(`btn-audio-${t.id}`);

    // Live RDS polling for popup
    const rdsTitleEl = document.getElementById(`popup-rds-title-${t.id}`);
    if (rdsTitleEl) {
      const fetchPopupRds = async (force = false) => {
        try {
          const qs = new URLSearchParams({
            url: t.streamUrl || '',
            station: t.streamName || t.programOrMux || '',
            _t: Date.now().toString()
          });
          if (force) qs.set('force', '1');
          const res = await fetch(`/api/rds?${qs.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.title && data.title !== 'Brak danych RDS') {
              const trackTime = data.trackTime ? `[${data.trackTime}] ` : '';
              rdsTitleEl.textContent = `${trackTime}${data.title}`;
            } else if (data && data.station) {
              rdsTitleEl.textContent = data.station;
            } else {
              rdsTitleEl.textContent = 'Emisja programu na żywo';
            }
          }
        } catch {
          rdsTitleEl.textContent = 'Emisja programu na żywo';
        }
      };

      fetchPopupRds(true);
      if (marker) {
        if (marker._popupRdsTimer) clearInterval(marker._popupRdsTimer);
        marker._popupRdsTimer = setInterval(() => fetchPopupRds(false), 12000);
      }
    }

    if (covBtn) {
      covBtn.addEventListener('click', () => {
        toggleCoverageCircle(t);
        // Refresh button text
        const isNowActive = activeCoverageCircles.has(t.id);
        covBtn.textContent = isNowActive ? '❌ Wyłącz obręb' : `📡 Zasięg (~${t.estimatedRangeKm} km)`;
        covBtn.classList.toggle('popup-btn-active-circle', isNowActive);
      });
    }

    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        openSignalCalculator(t);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = `${t.lat}, ${t.lon} (${t.name} - ${t.programOrMux})`;
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Skopiowano współrzędne: ${t.lat}, ${t.lon}`);
        }).catch(() => {
          prompt('Współrzędne:', `${t.lat}, ${t.lon}`);
        });
      });
    }

    if (detailBtn) {
      detailBtn.addEventListener('click', () => {
        openDetailModal(t);
      });
    }

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        playAudioStream(t.streamName || t.programOrMux, t.streamUrl, `${t.name} &bull; ${t.frequency} ${t.frequencyUnit}`);
      });
    }
  }

  // Coverage Circle Handling
  function addCoverageCircle(t) {
    if (activeCoverageCircles.has(t.id)) return;

    const radiusMeters = t.estimatedRangeKm * 1000;
    const color = getCategoryColor(t.category);

    const circle = L.circle([t.lat, t.lon], {
      radius: radiusMeters,
      color: color,
      fillColor: color,
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(map);

    circle.bindTooltip(`Szacowany obręb nadawania: ${t.name} (~${t.estimatedRangeKm} km, ${t.powerKw} kW)<br><small style="color:#ef4444;">Kliknij obręb, aby go wyłączyć</small>`, {
      sticky: true
    });

    circle.on('click', () => {
      removeCoverageCircle(t.id);
      showToast(`Wyłączono obręb nadawania dla: ${t.name}`);
    });

    activeCoverageCircles.set(t.id, circle);
    updateFloatingCoverageButton();
  }

  function removeCoverageCircle(tId) {
    if (activeCoverageCircles.has(tId)) {
      const circle = activeCoverageCircles.get(tId);
      map.removeLayer(circle);
      activeCoverageCircles.delete(tId);
      updateFloatingCoverageButton();
    }
  }

  function clearAllCoverageCircles() {
    activeCoverageCircles.forEach((circle) => {
      map.removeLayer(circle);
    });
    activeCoverageCircles.clear();
    globalCoverageEnabled = false;
    els.toggleCoverageBtn.classList.remove('active');
    updateFloatingCoverageButton();
    showToast('Wyłączono wszystkie obręby nadawania.');
  }

  function toggleCoverageCircle(t) {
    if (activeCoverageCircles.has(t.id)) {
      removeCoverageCircle(t.id);
      showToast(`Wyłączono obręb nadawania dla: ${t.name}`);
    } else {
      addCoverageCircle(t);
      showToast(`Wyświetlono szacowany zasięg ~${t.estimatedRangeKm} km dla: ${t.name}`);
    }
  }

  function updateFloatingCoverageButton() {
    const count = activeCoverageCircles.size;
    if (count > 0) {
      els.activeCirclesBadge.textContent = count;
      els.clearCoverageFloatingBtn.classList.remove('hidden');
    } else {
      els.clearCoverageFloatingBtn.classList.add('hidden');
    }
  }

  // Signal Coverage Calculator Implementation
  function openSignalCalculator(t) {
    currentCalcTransmitter = t;
    els.calcTransmitterTitle.textContent = `Kalkulator sygnału: ${t.name}`;
    els.calcTopInfo.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="color:#fff;font-size:14px;">${escapeHtml(t.name)}</strong> &bull; 
          <span style="color:var(--accent);font-weight:600;">${escapeHtml(t.programOrMux)}</span>
          <div style="color:var(--text-dim);font-size:11px;">${escapeHtml(t.location || t.voivodeship)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;color:#fff;">${t.powerKw} kW ERP</div>
          <div style="font-size:11px;color:var(--text-muted);">${t.heightAgl} m n.p.t. (${t.frequency} ${t.frequencyUnit})</div>
        </div>
      </div>
    `;

    els.calcLocationInput.value = '';
    els.calcResults.classList.add('hidden');
    els.calcLoading.classList.add('hidden');
    els.calcModal.classList.remove('hidden');
    setTimeout(() => els.calcLocationInput.focus(), 100);
  }

  async function calculateSignalForLocation() {
    const q = els.calcLocationInput.value.trim();
    if (!q) {
      showToast('Wpisz miasto, gminę lub ulicę!');
      return;
    }

    if (!currentCalcTransmitter) return;

    els.calcLoading.classList.remove('hidden');
    els.calcResults.classList.add('hidden');

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const results = await res.json();

      els.calcLoading.classList.add('hidden');

      if (!results || results.length === 0) {
        els.calcResults.innerHTML = `
          <div style="color:#fca5a5;padding:12px;background:rgba(239,68,68,0.1);border-radius:6px;">
            Nie znaleziono lokalizacji "<strong>${escapeHtml(q)}</strong>" w Polsce. Sprawdź pisownię lub dodaj miasto (np. "Warszawa Marszałkowska").
          </div>
        `;
        els.calcResults.classList.remove('hidden');
        return;
      }

      const match = results[0];
      const targetLat = parseFloat(match.lat);
      const targetLon = parseFloat(match.lon);
      const t = currentCalcTransmitter;

      // Determine location type: Street / Address vs City / Municipality
      const addr = match.address || {};
      const isStreet = Boolean(addr.road || addr.house_number || match.class === 'highway' || match.class === 'building');
      const isGmina = Boolean(addr.municipality || match.display_name.toLowerCase().includes('gmina'));
      const isCity = Boolean(addr.city || addr.town || addr.village);

      let locTypeLabel = 'Miejscowość';
      let locBadgeClass = 'badge-fm';
      if (isStreet) { locTypeLabel = 'Ulica / Dokładny adres'; locBadgeClass = 'badge-tv'; }
      else if (isGmina) { locTypeLabel = 'Gmina'; locBadgeClass = 'badge-dab'; }
      else if (isCity) { locTypeLabel = 'Miasto'; locBadgeClass = 'badge-fm'; }

      // Distance in km
      const distanceKm = getDistanceKm(t.lat, t.lon, targetLat, targetLon);

      // Azimuth from Target to Transmitter (Antenna direction!)
      const azimuthDeg = getAzimuth(targetLat, targetLon, t.lat, t.lon);
      const compassDir = getCompassDirection(azimuthDeg);

      // Transmitter engineered coverage radius in km
      const R = Math.max(5, t.estimatedRangeKm || 30);
      const ratio = distanceKm / R;

      // Realistic Propagation & Signal Calculation based on engineered coverage contour:
      // Standard planning reception field strength threshold (dBuV/m) at coverage edge:
      // DVB-T2: 48 dBuV/m | FM: 54 dBuV/m | DAB+: 50 dBuV/m | AM: 60 dBuV/m
      let minThreshold = 48;
      if (t.category === 'fm') minThreshold = 54;
      else if (t.category === 'dab') minThreshold = 50;
      else if (t.category === 'am') minThreshold = 60;

      let percent = 0;
      let fieldStrengthDbuv = 0;

      // Calculate realistic signal percentage and field strength based on distance relative to coverage radius R
      if (ratio <= 0.15) {
        // Very close (0 - 15% of radius) - direct line-of-sight
        percent = Math.round(95 + (1 - ratio / 0.15) * 5); // 95% -> 100%
        fieldStrengthDbuv = minThreshold + 38;
      } else if (ratio <= 0.50) {
        // Strong primary coverage (15% - 50% of radius)
        const frac = (ratio - 0.15) / 0.35;
        percent = Math.round(95 - frac * 20); // 95% -> 75%
        fieldStrengthDbuv = minThreshold + 38 - frac * 14;
      } else if (ratio <= 0.80) {
        // Good stable coverage (50% - 80% of radius)
        const frac = (ratio - 0.50) / 0.30;
        percent = Math.round(75 - frac * 25); // 75% -> 50%
        fieldStrengthDbuv = minThreshold + 24 - frac * 14;
      } else if (ratio <= 1.00) {
        // Edge of coverage circle (80% - 100% of radius)
        const frac = (ratio - 0.80) / 0.20;
        percent = Math.round(50 - frac * 20); // 50% -> 30%
        fieldStrengthDbuv = minThreshold + 10 - frac * 10;
      } else if (ratio <= 1.15) {
        // Marginal diffraction zone just outside coverage contour (100% - 115% of radius)
        const frac = (ratio - 1.00) / 0.15;
        percent = Math.round(30 - frac * 22); // 30% -> 8%
        fieldStrengthDbuv = minThreshold - frac * 12;
      } else if (ratio <= 1.25) {
        // Extreme fringe (115% - 125% of radius)
        const frac = (ratio - 1.15) / 0.10;
        percent = Math.round(8 - frac * 8); // 8% -> 0%
        fieldStrengthDbuv = minThreshold - 12 - frac * 10;
      } else {
        // Completely outside coverage area (> 125% of radius) -> 0%
        percent = 0;
        fieldStrengthDbuv = Math.max(8, minThreshold - 25 - (distanceKm - R * 1.25) * 0.8);
      }

      // Height and street rooftop antenna bonus (if within coverage)
      if (isStreet && percent > 0 && percent < 95) {
        percent = Math.min(100, percent + 4);
      }

      percent = Math.max(0, Math.min(100, percent));
      let dbm = Math.round(fieldStrengthDbuv - 125);

      // Recommendations & Quality text
      let qualityClass = 'signal-excellent';
      let qualityText = 'Bardzo silny (100% odbiór)';
      let adviceText = '';

      if (percent >= 80) {
        qualityClass = 'signal-excellent';
        qualityText = 'Maksymalna siła i jakość sygnału (S9+)';
        adviceText = isStreet
          ? `<strong>Idealny odbiór na wybranej ulicy:</strong> Sygnał jest bardzo silny (${dbm} dBm / ~${fieldStrengthDbuv.toFixed(0)} dBµV/m). Wystarczy prosta antena pokojowa lub krótki pręt bez wzmacniacza.`
          : `<strong>Pewny zasięg w całym mieście/gminie:</strong> Średnia siła sygnału w rejonie wynosi ~${percent}%. Odbiór wewnątrz budynków oraz w pojazdach bez żadnych zakłóceń.`;
      } else if (percent >= 55) {
        qualityClass = 'signal-good';
        qualityText = 'Dobry i stabilny sygnał (S7-S9)';
        adviceText = isStreet
          ? `<strong>Dobry odbiór na ${escapeHtml(addr.road || 'ulicy')}:</strong> Odbiór stabilny. Dla telewizji lub radia zalecana prosta antena zewnętrzna (na balkonie lub dachu) skierowana na <strong>azymut ${azimuthDeg.toFixed(0)}° (${compassDir})</strong>.`
          : `<strong>Dobry zasięg na obszarze gminy:</strong> Większość mieszkańców ma stabilny odbiór. W gęstej zabudowie zalecana antena zewnętrzna.`;
      } else if (percent >= 30) {
        qualityClass = 'signal-medium';
        qualityText = 'Średni sygnał / granica zasięgu (S4-S6)';
        adviceText = isStreet
          ? `<strong>Wymagana antena kierunkowa:</strong> Odległość wynosi ${distanceKm.toFixed(1)} km (blisko granicy zasięgu ~${R} km). Do stabilnego odbioru konieczna jest zewnętrzna antena kierunkowa (Yagi min. 10-14 dB) ustawiona precyzyjnie na <strong>azymut ${azimuthDeg.toFixed(0)}° (${compassDir})</strong>.`
          : `<strong>Zasięg peryferyjny w gminie:</strong> Rejon znajduje się na skraju zasięgu nadajnika (~${R} km). Wskazana antena dachowa ze wzmacniaczem.`;
      } else if (percent > 0) {
        qualityClass = 'signal-weak';
        qualityText = 'Bardzo słaby sygnał / na granicy zaniku (S1-S3)';
        adviceText = isStreet
          ? `<strong>Sygnał szczątkowy:</strong> Odległość wynosi ${distanceKm.toFixed(1)} km i przekracza zasięg podstawowy (~${R} km). Odbiór może być niestabilny lub okresowo zanikać.`
          : `<strong>Poza główną strefą pokrycia:</strong> Rejon leży poza nominalnym zasięgiem tego nadajnika (~${R} km). Zalecany wybór innego, bliższego nadajnika.`;
      } else {
        qualityClass = 'signal-none';
        qualityText = 'Brak sygnału (0% - poza zasięgiem)';
        adviceText = isStreet
          ? `<strong>Brak sygnału na wybranej ulicy:</strong> Odległość wynosi <strong>${distanceKm.toFixed(1)} km</strong> i znacznie przekracza maksymalny zasięg tego nadajnika (~${R} km). Sygnał z tego obiektu nie dociera. Wybierz bliższy nadajnik obsługujący ten rejon.`
          : `<strong>Brak zasięgu w wybranej miejscowości:</strong> Odległość wynosi <strong>${distanceKm.toFixed(1)} km</strong>, podczas gdy zasięg nadajnika to ~${R} km (miejsce jest o <strong>${(distanceKm - R).toFixed(1)} km poza strefą pokrycia</strong>). Brak możliwości odbioru tego nadajnika.`;
      }

      // Render Results Box
      els.calcResults.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <span class="badge ${locBadgeClass}">${locTypeLabel}</span>
            <div style="font-size:14px;font-weight:700;color:#fff;margin-top:4px;">${escapeHtml(match.display_name)}</div>
          </div>
        </div>

        <div class="calc-meter">
          <div class="calc-meter-head">
            <span>Siła i jakość sygnału:</span>
            <span class="${qualityClass}" style="font-weight:700;">${percent}% &bull; ${qualityText}</span>
          </div>
          <div class="signal-bar-track">
            <div class="signal-bar-fill ${qualityClass}" style="width: ${percent}%;"></div>
          </div>
        </div>

        <div class="calc-params-grid">
          <div class="calc-param-box">
            <div class="calc-param-label">Odległość do nadajnika</div>
            <div class="calc-param-val">${distanceKm.toFixed(isStreet ? 2 : 1)} km</div>
          </div>
          <div class="calc-param-box">
            <div class="calc-param-label">Zasięg nadajnika</div>
            <div class="calc-param-val">~${R} km ${distanceKm > R ? '<span style="color:#ef4444;font-size:11px;">(Poza zasięgiem)</span>' : '<span style="color:#10b981;font-size:11px;">(W zasięgu)</span>'}</div>
          </div>
          <div class="calc-param-box">
            <div class="calc-param-label">Azymut (Kierunek anteny)</div>
            <div class="calc-param-val">${azimuthDeg.toFixed(0)}&deg; (${compassDir})</div>
          </div>
        </div>

        <div class="calc-advice">
          ${adviceText}
        </div>

        <div style="display:flex;gap:8px;margin-top:4px;">
          <button id="calcShowOnMapBtn" class="btn-primary">Pokaż linię zasięgu na mapie</button>
          <button id="calcCloseBtn" class="btn-secondary">Zamknij kalkulator</button>
        </div>
      `;

      els.calcResults.classList.remove('hidden');

      // Button: Show line on map
      document.getElementById('calcShowOnMapBtn').onclick = () => {
        drawMeasurementLine(t, targetLat, targetLon, match.display_name, distanceKm, percent, azimuthDeg, compassDir);
        els.calcModal.classList.add('hidden');
      };

      document.getElementById('calcCloseBtn').onclick = () => {
        els.calcModal.classList.add('hidden');
      };

    } catch (err) {
      els.calcLoading.classList.add('hidden');
      els.calcResults.innerHTML = `<div style="color:#ef4444;">Błąd połączenia z geokoderem: ${err.message}</div>`;
      els.calcResults.classList.remove('hidden');
    }
  }

  // Draw measurement line on map
  function drawMeasurementLine(t, targetLat, targetLon, targetName, distKm, percent, azimuthDeg, compassDir) {
    clearMeasurementLine();

    const R = Math.max(5, t.estimatedRangeKm || 30);
    const inRange = distKm <= R;
    const lineColor = inRange ? '#38bdf8' : '#ef4444';
    const percentColor = percent >= 60 ? '#10b981' : percent >= 30 ? '#f59e0b' : '#ef4444';

    // Line
    measurementLine = L.polyline([[t.lat, t.lon], [targetLat, targetLon]], {
      color: lineColor,
      weight: 3,
      dashArray: inRange ? '6, 6' : '4, 8',
      opacity: 0.85
    }).addTo(map);

    // Target Marker
    const targetIconHtml = inRange
      ? `<div style="background:#10b981;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(16,185,129,0.8);border:2px solid #fff;font-size:12px;">🎯</div>`
      : `<div style="background:#ef4444;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(239,68,68,0.8);border:2px solid #fff;font-size:12px;">❌</div>`;

    targetLocationMarker = L.marker([targetLat, targetLon], {
      icon: L.divIcon({
        className: 'target-pin-wrapper',
        html: targetIconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      })
    }).addTo(map);

    targetLocationMarker.bindPopup(`
      <div style="font-size:12px;">
        <strong style="color:${inRange ? '#38bdf8' : '#ef4444'};font-size:13px;">${inRange ? 'Punkt odbioru (W zasięgu):' : 'Punkt odbioru (Poza zasięgiem):'}</strong>
        <div style="margin:2px 0 6px 0;font-weight:600;">${escapeHtml(targetName)}</div>
        <table style="width:100%;font-size:11px;">
          <tr><td>Nadajnik:</td><td><strong>${escapeHtml(t.name)}</strong></td></tr>
          <tr><td>Odległość:</td><td><strong>${distKm.toFixed(2)} km</strong></td></tr>
          <tr><td>Zasięg nadajnika:</td><td><strong>~${R} km</strong></td></tr>
          <tr><td>Azymut anteny:</td><td><strong>${azimuthDeg.toFixed(0)}° (${compassDir})</strong></td></tr>
          <tr><td>Szacowany sygnał:</td><td><strong style="color:${percentColor};">${percent}% (${percent === 0 ? 'Brak sygnału' : percent >= 70 ? 'Bardzo silny' : 'Średni'})</strong></td></tr>
        </table>
      </div>
    `).openPopup();

    els.clearMeasureLineBtn.classList.remove('hidden');

    // Fit map bounds to show both points
    map.fitBounds([
      [t.lat, t.lon],
      [targetLat, targetLon]
    ], { padding: [60, 60] });

    showToast(`Narysowano linię sygnału: ${distKm.toFixed(1)} km, sygnał: ${percent}%`);
  }

  function clearMeasurementLine() {
    if (measurementLine) {
      map.removeLayer(measurementLine);
      measurementLine = null;
    }
    if (targetLocationMarker) {
      map.removeLayer(targetLocationMarker);
      targetLocationMarker = null;
    }
    els.clearMeasureLineBtn.classList.add('hidden');
  }

  // Detail Modal
  async function openDetailModal(t) {
    els.modalTitle.textContent = `${t.name} (${t.programOrMux})`;
    els.modalCategoryBadge.className = `badge badge-${t.category}`;
    els.modalCategoryBadge.textContent = t.categoryLabel;

    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;

    // TV Channels chips
    let channelsHtml = '';
    if (t.channelsList && t.channelsList.length > 0) {
      channelsHtml = `
        <div class="detail-box" style="grid-column: span 2;">
          <div class="detail-label">Stacje TV nadawane w tym multipleksie (${t.channelsList.length})</div>
          <div class="channels-list-wrap">
            ${t.channelsList.map(c => `<span class="channel-chip">${escapeHtml(c)}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // Audio button in modal if radio
    let modalAudioHtml = '';
    if (t.streamUrl) {
      modalAudioHtml = `
        <button class="btn-success" id="modalPlayAudioBtn" style="margin-bottom:8px;">
          ▶️ Odsłuchaj na żywo: ${escapeHtml(t.streamName || t.programOrMux)}
        </button>
      `;
    }

    // Check same site broadcasts
    const sameSiteTransmitters = allTransmitters.filter(x => x.siteId === t.siteId && x.id !== t.id);
    let sameSiteHtml = '';
    if (sameSiteTransmitters.length > 0) {
      sameSiteHtml = `
        <div class="site-broadcasts-box" style="grid-column: span 2;">
          <div class="detail-label">Inne emisje z tego masztu / obiektu (${sameSiteTransmitters.length})</div>
          <div class="site-broadcasts-list">
            ${sameSiteTransmitters.map(s => `
              <div class="site-item" data-id="${s.id}">
                <div>
                  <strong>${escapeHtml(s.programOrMux)}</strong>
                  <span style="color:var(--text-dim);font-size:11px;"> &bull; ${s.frequency} ${s.frequencyUnit}</span>
                </div>
                <span class="site-item-badge badge-${s.category}">${s.system} (${s.powerKw} kW)</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    els.modalBody.innerHTML = `
      ${modalAudioHtml}

      <div class="detail-grid">
        <div class="detail-box">
          <div class="detail-label">Kto nadaje (Nadawca / Wnioskodawca)</div>
          <div class="detail-value" style="color:#38bdf8;">${escapeHtml(t.broadcaster)}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Co nadaje (Program / MUX)</div>
          <div class="detail-value" style="color:#4ade80;">${escapeHtml(t.programOrMux)}</div>
        </div>

        ${channelsHtml}

        <div class="detail-box">
          <div class="detail-label">System emisji</div>
          <div class="detail-value">${escapeHtml(t.system)}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Częstotliwość</div>
          <div class="detail-value">${t.frequency} ${t.frequencyUnit} ${t.channel ? `(kanał ${t.channel})` : ''}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Moc ERP</div>
          <div class="detail-value">${t.powerKw} kW (${t.powerDbw} dBW)</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Wysokość anteny</div>
          <div class="detail-value">${t.heightAgl} m n.p.t. (${t.heightAmsl} m n.p.m.)</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Polaryzacja</div>
          <div class="detail-value">${t.polarization === 'H' ? 'Pozioma (H)' : t.polarization === 'V' ? 'Pionowa (V)' : t.polarization}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Charakterystyka</div>
          <div class="detail-value">${t.radiationPattern === 'ND' ? 'Dookólna (ND)' : 'Kierunkowa (D)'}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Współrzędne (WGS84)</div>
          <div class="detail-value">${t.lat}&deg; N, ${t.lon}&deg; E</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Szacowany promień zasięgu</div>
          <div class="detail-value">~${t.estimatedRangeKm} km</div>
        </div>
        <div class="detail-box" style="grid-column: span 2;">
          <div class="detail-label">Lokalizacja / Obiekt</div>
          <div class="detail-value">${escapeHtml(t.location || '-')} (${t.voivodeship})</div>
        </div>

        ${sameSiteHtml}

        <div class="detail-box">
          <div class="detail-label">Status pozwolenia UKE</div>
          <div class="detail-value">${escapeHtml(t.status)}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">Ważność pozwolenia</div>
          <div class="detail-value">${escapeHtml(t.validTo || 'Brak danych')}</div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-primary" id="modalCalcSignalBtn">📐 Oblicz sygnał w lokalizacji</button>
        <button class="btn-secondary" id="modalToggleCoverageBtn">
          ${activeCoverageCircles.has(t.id) ? '❌ Wyłącz obręb' : '📡 Włącz obręb zasięgu'}
        </button>
        <a class="btn-secondary" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">Nawiguj (Google Maps)</a>
      </div>
    `;

    // Modal play audio
    const modalAudioBtn = document.getElementById('modalPlayAudioBtn');
    if (modalAudioBtn) {
      modalAudioBtn.onclick = () => {
        playAudioStream(t.streamName || t.programOrMux, t.streamUrl, `${t.name} &bull; ${t.frequency} ${t.frequencyUnit}`);
      };
    }

    // Modal Calc button
    document.getElementById('modalCalcSignalBtn').onclick = () => {
      els.detailModal.classList.add('hidden');
      openSignalCalculator(t);
    };

    // Modal Toggle Coverage button
    const modalCovBtn = document.getElementById('modalToggleCoverageBtn');
    modalCovBtn.onclick = () => {
      toggleCoverageCircle(t);
      const isNowActive = activeCoverageCircles.has(t.id);
      modalCovBtn.textContent = isNowActive ? '❌ Wyłącz obręb' : '📡 Włącz obręb zasięgu';
      modalCovBtn.className = isNowActive ? 'btn-danger' : 'btn-secondary';
    };

    // Click same site items
    document.querySelectorAll('.site-item').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        const targetTr = allTransmitters.find(x => x.id === id);
        if (targetTr) {
          openDetailModal(targetTr);
        }
      };
    });

    els.detailModal.classList.remove('hidden');
  }

  // Update Stats Display
  function updateStatsDisplay() {
    els.statVisible.textContent = filteredTransmitters.length.toLocaleString('pl-PL');

    if (filteredTransmitters.length > 0) {
      let sumPower = 0;
      let maxPower = -1;
      let maxStation = null;

      for (const t of filteredTransmitters) {
        sumPower += t.powerKw;
        if (t.powerKw > maxPower) {
          maxPower = t.powerKw;
          maxStation = t;
        }
      }

      const avg = (sumPower / filteredTransmitters.length).toFixed(1);
      els.statAvgPower.textContent = `${avg} kW`;
      if (maxStation) {
        els.statMaxPower.textContent = `${maxStation.name} (${maxPower} kW)`;
      }
    } else {
      els.statAvgPower.textContent = '0 kW';
      els.statMaxPower.textContent = '-';
    }
  }

  // Render List Drawer
  function renderListView() {
    if (els.listDrawer.classList.contains('hidden')) return;

    els.listCount.textContent = filteredTransmitters.length.toLocaleString('pl-PL');
    els.listContent.innerHTML = '';

    // Sort by distance if user location known, else by power descending
    const items = [...filteredTransmitters];
    if (userLatLng) {
      items.sort((a, b) => {
        const distA = getDistanceKm(userLatLng.lat, userLatLng.lng, a.lat, a.lon);
        const distB = getDistanceKm(userLatLng.lat, userLatLng.lng, b.lat, b.lon);
        return distA - distB;
      });
    } else {
      items.sort((a, b) => b.powerKw - a.powerKw);
    }

    const limit = Math.min(items.length, 150);
    const frag = document.createDocumentFragment();

    for (let i = 0; i < limit; i++) {
      const t = items[i];
      const div = document.createElement('div');
      div.className = 'list-item';

      let distText = '';
      if (userLatLng) {
        const d = getDistanceKm(userLatLng.lat, userLatLng.lng, t.lat, t.lon).toFixed(1);
        distText = `<span>📍 ${d} km</span>`;
      }

      div.innerHTML = `
        <div class="list-item-top">
          <span class="list-item-name">${escapeHtml(t.name)}</span>
          <span class="list-item-badge badge-${t.category}">${escapeHtml(t.system)}</span>
        </div>
        <div class="list-item-details">
          <span>${escapeHtml(t.programOrMux)}</span>
          <span><strong>${t.frequency} ${t.frequencyUnit}</strong></span>
        </div>
        <div class="list-item-details">
          <span>${t.powerKw} kW &bull; ${t.polarization}</span>
          ${distText}
        </div>
      `;

      div.onclick = () => {
        map.setView([t.lat, t.lon], 13);
        const marker = clusterGroup.getLayers().find(m => {
          const ll = m.getLatLng();
          return Math.abs(ll.lat - t.lat) < 0.0001 && Math.abs(ll.lng - t.lon) < 0.0001;
        });
        if (marker) {
          clusterGroup.zoomToShowLayer(marker, () => {
            marker.openPopup();
          });
        }
      };

      frag.appendChild(div);
    }

    if (items.length > limit) {
      const more = document.createElement('div');
      more.style.textAlign = 'center';
      more.style.padding = '12px';
      more.style.color = 'var(--text-dim)';
      more.style.fontSize = '12px';
      more.textContent = `Wyświetlono pierwsze ${limit} z ${items.length} wyników. Zawęź filtry lub wyszukiwanie.`;
      frag.appendChild(more);
    }

    els.listContent.appendChild(frag);
  }

  // Event Listeners Setup
  function setupEvents() {
    // Category pill toggles
    [els.catTv, els.catFm, els.catDab, els.catAm].forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const cat = checkbox.id.replace('cat-', '');
        filters.categories[cat] = checkbox.checked;
        updatePillClasses();
        applyFilters();
      });
    });

    // Search input
    let searchTimeout;
    els.searchInput.addEventListener('input', () => {
      const val = els.searchInput.value;
      els.clearSearchBtn.style.display = val.length > 0 ? 'block' : 'none';
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filters.search = val;
        applyFilters();
      }, 200);
    });

    els.clearSearchBtn.addEventListener('click', () => {
      els.searchInput.value = '';
      els.clearSearchBtn.style.display = 'none';
      filters.search = '';
      applyFilters();
      els.searchInput.focus();
    });

    // Select dropdowns
    els.voivodeshipSelect.addEventListener('change', e => {
      filters.voivodeship = e.target.value;
      applyFilters();
    });

    els.muxSelect.addEventListener('change', e => {
      filters.mux = e.target.value;
      applyFilters();
    });

    els.systemSelect.addEventListener('change', e => {
      filters.system = e.target.value;
      applyFilters();
    });

    // Power slider & presets
    els.powerRange.addEventListener('input', e => {
      const val = Number(e.target.value);
      filters.minPowerKw = val;
      els.powerValue.textContent = val === 0 ? 'Wszystkie' : `≥ ${val} kW`;
      updatePresetActive(val);
      applyFilters();
    });

    els.powerPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = Number(btn.dataset.power);
        els.powerRange.value = val;
        filters.minPowerKw = val;
        els.powerValue.textContent = val === 0 ? 'Wszystkie' : `≥ ${val} kW`;
        updatePresetActive(val);
        applyFilters();
      });
    });

    function updatePresetActive(val) {
      els.powerPresets.forEach(b => {
        if (Number(b.dataset.power) === val) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    // Polarization buttons
    els.polButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        els.polButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filters.polarization = btn.dataset.pol;
        applyFilters();
      });
    });

    // Sidebar Toggle
    els.toggleSidebarBtn.addEventListener('click', () => {
      els.sidebar.classList.toggle('collapsed');
      setTimeout(() => map.invalidateSize(), 350);
    });

    // Reset Filters
    els.resetFiltersBtn.addEventListener('click', () => {
      filters.categories = { tv: true, fm: true, dab: true, am: true };
      els.catTv.checked = true;
      els.catFm.checked = true;
      els.catDab.checked = true;
      els.catAm.checked = true;
      updatePillClasses();

      filters.search = '';
      els.searchInput.value = '';
      els.clearSearchBtn.style.display = 'none';

      filters.voivodeship = 'ALL';
      els.voivodeshipSelect.value = 'ALL';

      filters.mux = 'ALL';
      els.muxSelect.value = 'ALL';

      filters.system = 'ALL';
      els.systemSelect.value = 'ALL';

      filters.minPowerKw = 0;
      els.powerRange.value = 0;
      els.powerValue.textContent = '0 kW';
      updatePresetActive(0);

      filters.polarization = 'ALL';
      els.polButtons.forEach(b => {
        if (b.dataset.pol === 'ALL') b.classList.add('active');
        else b.classList.remove('active');
      });

      applyFilters();
      showToast('Zresetowano filtry do wartości domyślnych');
    });

    // Floating Clear Coverage Button (Easy removal)
    els.clearCoverageFloatingBtn.addEventListener('click', () => {
      clearAllCoverageCircles();
    });

    // Floating Clear Measurement Line
    els.clearMeasureLineBtn.addEventListener('click', () => {
      clearMeasurementLine();
      showToast('Usunięto linię pomiaru sygnału');
    });

    // Radio Streams Drawer
    els.radioListBtn.addEventListener('click', () => {
      const isHidden = els.radioDrawer.classList.contains('hidden');
      if (isHidden) {
        els.radioDrawer.classList.remove('hidden');
        els.radioListBtn.classList.add('active');
      } else {
        els.radioDrawer.classList.add('hidden');
        els.radioListBtn.classList.remove('active');
      }
    });

    els.closeRadioDrawerBtn.addEventListener('click', () => {
      els.radioDrawer.classList.add('hidden');
      els.radioListBtn.classList.remove('active');
    });

    els.radioFilterInput.addEventListener('input', () => {
      const q = els.radioFilterInput.value.toLowerCase().trim();
      const filtered = verifiedStreams.filter(s => s.name.toLowerCase().includes(q));
      renderRadioStreamsList(filtered);
    });

    // Audio Player Controls
    els.audioPlayPauseBtn.addEventListener('click', togglePlayPause);
    els.audioStopBtn.addEventListener('click', stopAudio);
    els.audioCloseBtn.addEventListener('click', stopAudio);
    els.audioVolume.addEventListener('input', e => {
      els.nativeAudioPlayer.volume = parseFloat(e.target.value);
    });

    // Geolocation
    els.locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.');
        return;
      }
      showToast('Wyszukiwanie Twojej lokalizacji...');
      navigator.geolocation.getCurrentPosition(
        pos => {
          userLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (userLocationMarker) map.removeLayer(userLocationMarker);

          userLocationMarker = L.marker([userLatLng.lat, userLatLng.lng], {
            icon: L.divIcon({
              className: 'user-pin-wrapper',
              html: `<div style="background:#3b82f6;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 0 10px rgba(59,130,246,0.8);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(map);

          userLocationMarker.bindPopup('<strong>Twoja lokalizacja</strong>').openPopup();
          map.setView([userLatLng.lat, userLatLng.lng], 10);
          showToast('Zlokalizowano! Pokazuję najbliższe nadajniki.');
          renderListView();
        },
        err => {
          showToast('Nie udało się pobrać lokalizacji: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    // Toggle Global Coverage
    els.toggleCoverageBtn.addEventListener('click', () => {
      globalCoverageEnabled = !globalCoverageEnabled;
      els.toggleCoverageBtn.classList.toggle('active', globalCoverageEnabled);
      if (globalCoverageEnabled) {
        showToast('Włączono promienie zasięgu dla widocznych nadajników');
        filteredTransmitters.forEach(t => addCoverageCircle(t));
      } else {
        clearAllCoverageCircles();
      }
    });

    // Toggle List View Drawer
    els.toggleListViewBtn.addEventListener('click', () => {
      const isHidden = els.listDrawer.classList.contains('hidden');
      if (isHidden) {
        els.listDrawer.classList.remove('hidden');
        els.toggleListViewBtn.classList.add('active');
        renderListView();
      } else {
        els.listDrawer.classList.add('hidden');
        els.toggleListViewBtn.classList.remove('active');
      }
    });

    els.closeListBtn.addEventListener('click', () => {
      els.listDrawer.classList.add('hidden');
      els.toggleListViewBtn.classList.remove('active');
    });

    // Detail Modal close
    els.closeModalBtn.addEventListener('click', () => {
      els.detailModal.classList.add('hidden');
    });

    els.detailModal.addEventListener('click', e => {
      if (e.target === els.detailModal) {
        els.detailModal.classList.add('hidden');
      }
    });

    // Calculator Modal
    els.closeCalcModalBtn.addEventListener('click', () => {
      els.calcModal.classList.add('hidden');
    });

    els.calcModal.addEventListener('click', e => {
      if (e.target === els.calcModal) {
        els.calcModal.classList.add('hidden');
      }
    });

    els.calcSubmitBtn.addEventListener('click', calculateSignalForLocation);
    els.calcLocationInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        calculateSignalForLocation();
      }
    });
  }

  // Haversine Distance in km
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Compass Bearing / Azimuth calculation
  function getAzimuth(lat1, lon1, lat2, lon2) {
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
              Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    const bearing = (theta * 180 / Math.PI + 360) % 360;
    return bearing;
  }

  function getCompassDirection(bearing) {
    const directions = ['N (Północ)', 'NNE', 'NE', 'ENE', 'E (Wschód)', 'ESE', 'SE', 'SSE',
                        'S (Południe)', 'SSW', 'SW', 'WSW', 'W (Zachód)', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(bearing / 22.5) % 16;
    return directions[idx];
  }

  // HTML Escape helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Start on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
