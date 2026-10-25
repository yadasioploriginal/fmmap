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

  // Selected transmitter on map & marker lookup
  const markerMap = new Map(); // id -> L.Marker
  let selectedMarker = null;
  let selectedTx = null;
  let panelRdsTimer = null;

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

  // Language / i18n
  let currentLang = localStorage.getItem('fmmap_lang') || 'pl';

  const i18n = {
    pl: {
      appTitle: 'Polska - Mapa Nadajników DVB-T/DVB-T2 & Radio FM/DAB+/AM',
      appName: 'Nadajniki PL',
      appSub: 'DVB-T/T2 • FM • DAB+ • AM',
      tvPill: 'Telewizja DVB-T/T2',
      fmPill: 'Radio FM',
      dabPill: 'DAB+',
      amPill: 'AM (MW/LW)',
      searchPlaceholder: 'Szukaj stacji, miasta, MUX, częstotliwości...',
      clearSearch: 'Wyczyść',
      radioListenBtn: 'Odsłuch radia',
      locateBtn: 'Lokalizacja',
      allCoverageBtn: 'Wszystkie zasięgi',
      listViewBtn: 'Lista',
      filtersTitle: 'Filtry i parametry',
      resetBtn: 'Resetuj',
      voivodeshipLabel: 'Województwo',
      allVoivodeships: 'Wszystkie województwa',
      muxLabel: 'Multipleks TV',
      allMuxes: 'Wszystkie multipleksy',
      systemLabel: 'Standard emisji TV',
      allSystems: 'Wszystkie standardy',
      onlyDvbT2: 'Tylko DVB-T2',
      onlyDvbT: 'Tylko DVB-T',
      minPowerLabel: 'Min. moc ERP:',
      allPower: 'Wszystkie',
      polarizationLabel: 'Polaryzacja anteny',
      allPol: 'Wszystkie',
      horizontalPol: 'Pozioma (H)',
      verticalPol: 'Pionowa (V)',
      statsTitle: 'Statystyki zestawienia',
      statVisible: 'Widocznych obiektów:',
      statTotal: 'Wszystkich w bazie:',
      statAvgPower: 'Średnia moc ERP:',
      statMaxPower: 'Najsilniejszy nadajnik:',
      legendTitle: 'Legenda mapy',
      legendTv: 'Telewizja (DVB-T / DVB-T2)',
      legendFm: 'Radio FM (UKF)',
      legendDab: 'Radio cyfrowe (DAB+)',
      legendAm: 'Radio AM (Solec Kujawski, MW)',
      clearCoverageFloating: 'Wyłącz obręb nadawania',
      clearMeasureLine: 'Usuń linię pomiaru',
      matchedTransmitters: 'Lista dopasowanych nadajników',
      liveRadioTitle: '📻 Stacje radiowe na żywo',
      searchRadioPlaceholder: 'Szukaj stacji do odsłuchu...',
      liveBadge: 'NA ŻYWO',
      calcModalTitle: 'Kalkulator Sygnału',
      calcHeading: 'Obliczanie zasięgu nadajnika',
      calcLocationLabel: 'Wpisz miasto, gminę lub ulicę:',
      calcLocationPlaceholder: 'np. Radom, gmina Piaseczno, Warszawa Marszałkowska 10...',
      calcSubmit: 'Oblicz sygnał',
      calcHint: 'Wpisz nazwę miejscowości lub gminy (dla szacunku ogólnego) albo dokładną ulicę (dla precyzyjnego wyliczenia sygnału).',
      calcLoadingText: 'Wyszukiwanie lokalizacji i obliczanie propagacji fal radiowych...',
      calcShowOnMap: 'Pokaż linię zasięgu na mapie',
      calcClose: 'Zamknij kalkulator',
      calcDist: 'Odległość do nadajnika',
      calcRange: 'Zasięg nadajnika',
      calcAzimuth: 'Azymut (Kierunek anteny)',
      calcSignalQuality: 'Siła i jakość sygnału:'
    },
    en: {
      appTitle: 'Poland - DVB-T/DVB-T2 TV & FM/DAB+/AM Radio Transmitter Map',
      appName: 'Transmitters PL',
      appSub: 'DVB-T/T2 • FM • DAB+ • AM',
      tvPill: 'DVB-T/T2 Television',
      fmPill: 'FM Radio',
      dabPill: 'DAB+',
      amPill: 'AM (MW/LW)',
      searchPlaceholder: 'Search station, city, MUX, frequency...',
      clearSearch: 'Clear',
      radioListenBtn: 'Radio Streams',
      locateBtn: 'Location',
      allCoverageBtn: 'All Coverages',
      listViewBtn: 'List',
      filtersTitle: 'Filters & Settings',
      resetBtn: 'Reset',
      voivodeshipLabel: 'Voivodeship / Region',
      allVoivodeships: 'All voivodeships',
      muxLabel: 'TV Multiplex',
      allMuxes: 'All multiplexes',
      systemLabel: 'TV Broadcast Standard',
      allSystems: 'All standards',
      onlyDvbT2: 'DVB-T2 only',
      onlyDvbT: 'DVB-T only',
      minPowerLabel: 'Min. ERP Power:',
      allPower: 'All',
      polarizationLabel: 'Antenna Polarization',
      allPol: 'All',
      horizontalPol: 'Horizontal (H)',
      verticalPol: 'Vertical (V)',
      statsTitle: 'Overview Statistics',
      statVisible: 'Visible transmitters:',
      statTotal: 'Total in database:',
      statAvgPower: 'Average ERP Power:',
      statMaxPower: 'Strongest transmitter:',
      legendTitle: 'Map Legend',
      legendTv: 'Television (DVB-T / DVB-T2)',
      legendFm: 'FM Radio (VHF)',
      legendDab: 'Digital Radio (DAB+)',
      legendAm: 'AM Radio (Solec Kujawski, MW)',
      clearCoverageFloating: 'Disable coverage circle',
      clearMeasureLine: 'Clear measurement line',
      matchedTransmitters: 'Matched transmitters list',
      liveRadioTitle: '📻 Live Radio Streams',
      searchRadioPlaceholder: 'Search radio station to play...',
      liveBadge: 'LIVE',
      calcModalTitle: 'Signal Calculator',
      calcHeading: 'Transmitter Coverage & Signal Calculation',
      calcLocationLabel: 'Enter city, municipality, or street address:',
      calcLocationPlaceholder: 'e.g. Radom, Piaseczno, Warsaw Marszalkowska 10...',
      calcSubmit: 'Calculate signal',
      calcHint: 'Enter a city/town or municipality for general area estimation, or a street name for precise building-level calculation.',
      calcLoadingText: 'Searching location and computing radio propagation...',
      calcShowOnMap: 'Show signal line on map',
      calcClose: 'Close calculator',
      calcDist: 'Distance to transmitter',
      calcRange: 'Transmitter range',
      calcAzimuth: 'Azimuth (Antenna direction)',
      calcSignalQuality: 'Signal strength & quality:'
    }
  };

  // DOM elements
  const els = {
    langPlBtn: document.getElementById('langPlBtn'),
    langEnBtn: document.getElementById('langEnBtn'),
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
    audioStationLogoBox: document.getElementById('audioStationLogoBox'),
    audioStationLogoImg: document.getElementById('audioStationLogoImg'),
    audioStationLogoFallback: document.getElementById('audioStationLogoFallback'),
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
    mapToast: document.getElementById('mapToast'),
    transmitterPanel: document.getElementById('transmitterPanel'),
    closePanelBtn: document.getElementById('closePanelBtn'),
    panelCategoryBadge: document.getElementById('panelCategoryBadge'),
    panelSystemBadge: document.getElementById('panelSystemBadge'),
    panelTitle: document.getElementById('panelTitle'),
    panelLocation: document.getElementById('panelLocation'),
    panelLogoWrap: document.getElementById('panelLogoWrap'),
    panelLogoImg: document.getElementById('panelLogoImg'),
    panelBody: document.getElementById('panelBody')
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

  // Language management
  function setLanguage(lang) {
    if (lang !== 'pl' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem('fmmap_lang', lang);
    applyLanguage();
  }

  function applyLanguage() {
    const t = i18n[currentLang] || i18n.pl;
    document.documentElement.lang = currentLang;
    document.title = t.appTitle;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key]) {
        el.placeholder = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (t[key]) {
        el.title = t[key];
      }
    });

    if (els.langPlBtn && els.langEnBtn) {
      els.langPlBtn.classList.toggle('active', currentLang === 'pl');
      els.langEnBtn.classList.toggle('active', currentLang === 'en');
    }

    if (els.audioPlayPauseBtn) els.audioPlayPauseBtn.title = currentLang === 'en' ? 'Play / Pause' : 'Odtwórz / Pauza';
    if (els.audioStopBtn) els.audioStopBtn.title = currentLang === 'en' ? 'Stop' : 'Zatrzymaj';
    if (els.audioCloseBtn) els.audioCloseBtn.title = currentLang === 'en' ? 'Close player' : 'Zamknij odtwarzacz';

    // Source info text
    const sourceEl = document.querySelector('.source-info');
    if (sourceEl) {
      if (currentLang === 'en') {
        sourceEl.innerHTML = `
          <p>Data: Official registry of radio permits by <strong>UKE (Office of Electronic Communications)</strong>.</p>
          <p>Radio streaming: Verified streams from <strong>github.com/web-radio/webradio</strong>.</p>
          <p>Port: <strong>9354</strong> | Configuration: <code>config.json</code></p>
        `;
      } else {
        sourceEl.innerHTML = `
          <p>Dane: Oficjalny wykaz pozwoleń radiowych <strong>UKE (Urząd Komunikacji Elektronicznej)</strong>.</p>
          <p>Odsłuch radia: Zweryfikowane strumienie z <strong>github.com/web-radio/webradio</strong>.</p>
          <p>Port: <strong>9354</strong> | Konfiguracja: <code>config.json</code></p>
        `;
      }
    }

    // Re-render markers so popup content updates language
    if (map && clusterGroup) {
      renderMarkers();
    }

    // Re-render list view if open
    if (els.listDrawer && !els.listDrawer.classList.contains('hidden')) {
      renderListView();
    }

    // Re-render radio drawer
    if (verifiedStreams && verifiedStreams.length > 0) {
      renderRadioStreamsList(verifiedStreams);
    }
  }

  function getCategoryLabel(category, lang = currentLang) {
    if (lang === 'en') {
      switch (category) {
        case 'tv': return 'DVB-T/T2 Television';
        case 'fm': return 'FM Radio';
        case 'dab': return 'DAB+ Digital Radio';
        case 'am': return 'AM Radio';
        default: return category;
      }
    }
    switch (category) {
      case 'tv': return 'Telewizja DVB-T/T2';
      case 'fm': return 'Radio FM';
      case 'dab': return 'Radio cyfrowe DAB+';
      case 'am': return 'Radio AM';
      default: return category;
    }
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
      // 1. Fetch Config with static fallback
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const text = await configRes.text();
          if (text && text.trim().startsWith('{')) {
            config = JSON.parse(text);
          }
        }
      } catch (e) {
        console.warn('Backend /api/config unavailable, trying static /config.json...', e);
      }

      if (!config) {
        try {
          const staticRes = await fetch('/config.json');
          if (staticRes.ok) {
            config = await staticRes.json();
          }
        } catch (_) {}
      }

      if (!config) {
        config = {
          title: 'Polska - Mapa nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM',
          initialCenter: [52.0693, 19.4803],
          initialZoom: 7,
          minZoom: 5,
          maxZoom: 18,
          filters: { defaultVisible: { tv: true, fm: true, dab: true, am: true } }
        };
      }

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

      // 3. Load Transmitters & Radio Streams first (with CDN static fallback)
      await Promise.all([loadTransmitters(), loadRadioStreams()]);

      // 4. Load Stats or compute locally
      await loadStats();

      // 5. Attach Event Listeners
      setupEvents();

      // Apply initial language (PL / EN)
      applyLanguage();

      // 6. Initial Render
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

    // Clicking empty map closes the transmitter info panel and removes dot highlight
    map.on('click', () => {
      closeTransmitterPanel();
    });
  }

  // Apply stats data to UI
  function applyStatsData(stats) {
    if (!stats) return;
    if (stats.counts) {
      if (els.countTv) els.countTv.textContent = stats.counts.tv?.toLocaleString('pl-PL') || '0';
      if (els.countFm) els.countFm.textContent = stats.counts.fm?.toLocaleString('pl-PL') || '0';
      if (els.countDab) els.countDab.textContent = stats.counts.dab?.toLocaleString('pl-PL') || '0';
      if (els.countAm) els.countAm.textContent = stats.counts.am?.toLocaleString('pl-PL') || '0';
      if (els.statTotal) els.statTotal.textContent = stats.counts.total?.toLocaleString('pl-PL') || '0';
    }

    // Populate Voivodeship select
    if (stats.voivodeships && els.voivodeshipSelect) {
      const cur = els.voivodeshipSelect.value;
      els.voivodeshipSelect.innerHTML = `<option value="ALL" data-i18n="allVoivodeships">${currentLang === 'en' ? 'All voivodeships' : 'Wszystkie województwa'}</option>`;
      stats.voivodeships.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v.charAt(0) + v.slice(1).toLowerCase();
        els.voivodeshipSelect.appendChild(opt);
      });
      els.voivodeshipSelect.value = cur || 'ALL';
    }

    // Populate TV Multiplex select
    if (stats.tvMultiplexes && els.muxSelect) {
      const cur = els.muxSelect.value;
      els.muxSelect.innerHTML = `<option value="ALL" data-i18n="allMuxes">${currentLang === 'en' ? 'All multiplexes' : 'Wszystkie multipleksy'}</option>`;
      stats.tvMultiplexes.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        els.muxSelect.appendChild(opt);
      });
      els.muxSelect.value = cur || 'ALL';
    }
  }

  // Compute stats locally from allTransmitters array if backend stats unavailable
  function computeStatsLocally() {
    if (!allTransmitters || allTransmitters.length === 0) return;
    const counts = { tv: 0, fm: 0, dab: 0, am: 0, total: allTransmitters.length };
    const voivodeships = new Set();
    const muxes = new Set();
    const systems = new Set();

    for (const t of allTransmitters) {
      counts[t.category] = (counts[t.category] || 0) + 1;
      if (t.voivodeship) voivodeships.add(t.voivodeship);
      if (t.category === 'tv' && t.programOrMux) muxes.add(t.programOrMux);
      if (t.system) systems.add(t.system);
    }

    applyStatsData({
      counts,
      voivodeships: Array.from(voivodeships).sort(),
      tvMultiplexes: Array.from(muxes).sort(),
      systems: Array.from(systems).sort()
    });
  }

  // Load Stats from API with local computation fallback
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const stats = JSON.parse(text);
          applyStatsData(stats);
          return;
        }
      }
    } catch (_) {}

    // Fallback: Compute directly from loaded dataset
    computeStatsLocally();
  }

  // Load Transmitters with Static Fallback (100% reliable on Vercel CDN)
  async function loadTransmitters() {
    let loaded = false;

    // 1. Try backend API first
    try {
      const res = await fetch('/api/transmitters');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('[')) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            allTransmitters = data;
            loaded = true;
            console.log(`Załadowano ${allTransmitters.length} nadajników z /api/transmitters.`);
          }
        }
      }
    } catch (e) {
      console.warn('API /api/transmitters niedostępne, próba załadowania z /data/transmitters.json...', e);
    }

    // 2. Fallback to static CDN JSON (always present in public/data/)
    if (!loaded) {
      try {
        const staticRes = await fetch('/data/transmitters.json');
        if (staticRes.ok) {
          allTransmitters = await staticRes.json();
          loaded = true;
          console.log(`Załadowano ${allTransmitters.length} nadajników ze statycznego pliku CDN /data/transmitters.json.`);
        }
      } catch (e2) {
        console.error('Błąd pobierania statycznego pliku transmitters.json:', e2);
      }
    }

    if (!loaded || !allTransmitters || allTransmitters.length === 0) {
      throw new Error('Baza nadajników jest chwilowo niedostępna.');
    }
  }

  // Load Verified Radio Streams with Static Fallback
  async function loadRadioStreams() {
    try {
      const res = await fetch('/api/radio-streams');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('[')) {
          verifiedStreams = JSON.parse(text);
        } else {
          throw new Error('Invalid JSON');
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      try {
        const staticRes = await fetch('/data/working_radio_streams.json');
        if (staticRes.ok) {
          verifiedStreams = await staticRes.json();
        }
      } catch (_) {
        verifiedStreams = [];
      }
    }

    if (els.radioStreamsCount) {
      els.radioStreamsCount.textContent = verifiedStreams.length;
    }
    renderRadioStreamsList(verifiedStreams);
  }

  // Station Logo Matcher (matches the 12 logos in /public/img/stacje)
  function getStationLogo(name, extra = '') {
    const combined = `${name || ''} ${extra || ''}`.toLowerCase();
    const n = stripDiacritics(combined);

    if (n.includes('rmf')) return '/img/stacje/rmffm.png';
    if (n.includes('zet') && !n.includes('gazeta')) return '/img/stacje/radiozet.png';
    if (n.includes('eska')) return '/img/stacje/radioeska.png';
    if (n.includes('zlote') || n.includes('przeboje')) return '/img/stacje/radiozloteprzeboje.png';
    if (n.includes('jedynka') || (n.includes('program 1') && !n.includes('tvp')) || /\bpr\s*1\b/.test(n) || /\bpolskie radio 1\b/.test(n)) {
      return '/img/stacje/jedynka.png';
    }
    if (n.includes('dwojka') || (n.includes('program 2') && !n.includes('tvp')) || /\bpr\s*2\b/.test(n) || /\bpolskie radio 2\b/.test(n)) {
      return '/img/stacje/dwojka.png';
    }
    if (n.includes('trojka') || (n.includes('program 3') && !n.includes('tvp')) || /\bpr\s*3\b/.test(n) || /\bpolskie radio 3\b/.test(n)) {
      return '/img/stacje/trojka.png';
    }
    if (n.includes('katowic')) return '/img/stacje/pr-katowice.png';
    if (n.includes('krakow')) return '/img/stacje/pr-krakow.png';
    if (n.includes('opol')) return '/img/stacje/pr-opole.png';
    if (n.includes('poznan') || n.includes('merkury')) return '/img/stacje/pr-poznan.png';
    if (n.includes('zachod')) return '/img/stacje/pr-zachod.png';
    return null;
  }

  // Update Station Logo in Audio Player
  function updateAudioStationLogo(name, details = '') {
    const logoUrl = getStationLogo(name, details);
    if (els.audioStationLogoImg && els.audioStationLogoFallback) {
      if (logoUrl) {
        els.audioStationLogoImg.src = logoUrl;
        els.audioStationLogoImg.alt = name;
        els.audioStationLogoImg.classList.remove('hidden');
        els.audioStationLogoFallback.classList.add('hidden');
      } else {
        els.audioStationLogoImg.src = '';
        els.audioStationLogoImg.classList.add('hidden');
        els.audioStationLogoFallback.classList.remove('hidden');
      }
    }
  }

  // Render Radio Streams in Drawer with logos
  function renderRadioStreamsList(streams) {
    els.radioStreamsList.innerHTML = '';
    const isEn = currentLang === 'en';
    streams.forEach(s => {
      const div = document.createElement('div');
      div.className = 'radio-stream-item';
      const logoUrl = getStationLogo(s.name);
      const logoHtml = logoUrl
        ? `<div class="radio-stream-logo-box"><img class="radio-stream-logo-img" src="${logoUrl}" alt="${escapeHtml(s.name)}" /></div>`
        : `<div class="radio-stream-logo-box"><span class="radio-stream-logo-fallback">📻</span></div>`;

      div.innerHTML = `
        <div class="radio-stream-left">
          ${logoHtml}
          <div class="radio-stream-info">
            <strong>${escapeHtml(s.name)}</strong>
            <span>${isEn ? 'Live streaming • MP3/AAC' : 'Odsłuch na żywo • MP3/AAC'}</span>
          </div>
        </div>
        <button class="radio-play-btn" title="${isEn ? 'Play station' : 'Odtwórz stację'}">▶</button>
      `;

      div.onclick = () => {
        playAudioStream(s.name, s.streamUrl, isEn ? 'Online radio stream (webradio)' : 'Strumień internetowy (webradio)');
      };

      els.radioStreamsList.appendChild(div);
    });
  }

  // Live RDS state
  let isRdsFetching = false;
  let rdsPollTimer = null;
  let lastRdsTrackText = '';

  function startRdsPolling() {
    stopRdsPolling();
    lastRdsTrackText = '';

    // Fetch immediately
    fetchRdsForActiveStream(true);

    // Continuous loop polling
    async function poll() {
      if (!currentAudioStream || !currentAudioStream.url || els.nativeAudioPlayer.paused) {
        return;
      }
      if (!isRdsFetching) {
        await fetchRdsForActiveStream(false);
      }
      if (currentAudioStream && !els.nativeAudioPlayer.paused) {
        rdsPollTimer = setTimeout(poll, 1200);
      }
    }

    rdsPollTimer = setTimeout(poll, 1200);
  }

  function stopRdsPolling() {
    if (rdsPollTimer) {
      clearTimeout(rdsPollTimer);
      rdsPollTimer = null;
    }
    isRdsFetching = false;
  }

  // Fetch live RDS from backend for active stream
  async function fetchRdsForActiveStream(force = false) {
    if (!currentAudioStream || !currentAudioStream.url) return;
    const url = currentAudioStream.url;
    const stationName = currentAudioStream.name || '';
    if (isRdsFetching && !force) return;
    isRdsFetching = true;

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
        let cleanTitle = '';
        if (data.title && data.title !== 'Brak danych RDS') {
          // Remove any timestamps/hours: e.g. [12:00] or 12:00 - etc.
          cleanTitle = data.title
            .replace(/^\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/, '')
            .replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, '')
            .trim();
        } else if (data.station) {
          cleanTitle = data.station.trim();
        }

        if (cleanTitle) {
          const newText = `RDS: ${cleanTitle}`;
          const currentText = els.audioRdsText.textContent;

          if (currentText !== newText) {
            const wasEmptyOrInitial = !lastRdsTrackText || lastRdsTrackText === 'RDS: Pobieranie...';
            lastRdsTrackText = cleanTitle;

            // Transition text smoothly
            els.audioRdsText.classList.add('rds-text-changing');
            setTimeout(() => {
              els.audioRdsText.textContent = newText;
              els.audioRdsText.classList.remove('rds-text-changing');
            }, 180);

            els.audioRdsPill.classList.remove('hidden', 'rds-pill-pulse', 'rds-pill-changed');
            void els.audioRdsPill.offsetWidth; // Force CSS reflow

            if (!wasEmptyOrInitial) {
              // Track change event! Glow animation and alert toast
              els.audioRdsPill.classList.add('rds-pill-changed');
              const isEn = currentLang === 'en';
              showToast(isEn ? `🎵 Now playing on ${stationName}: ${cleanTitle}` : `🎵 Teraz w ${stationName}: ${cleanTitle}`, 3500);
            } else {
              els.audioRdsPill.classList.add('rds-pill-pulse');
            }
          } else {
            els.audioRdsPill.classList.remove('hidden');
          }
        }
      }
    } catch {} finally {
      isRdsFetching = false;
    }
  }

  // Audio Playback
  function playAudioStream(name, url, details = '') {
    if (!url) {
      showToast('Brak dostępnego strumienia online dla tej stacji.');
      return;
    }

    stopRdsPolling();

    const cleanDetails = details ? details.replace(/&bull;?/g, '•') : '';
    currentAudioStream = { name, url, details: cleanDetails };
    els.audioStationName.textContent = name;
    els.audioStationDetails.textContent = cleanDetails;
    els.audioRdsPill.classList.add('hidden');
    els.audioRdsText.textContent = 'RDS: Pobieranie...';

    // Show station logo in audio bar
    updateAudioStationLogo(name, cleanDetails);

    els.nativeAudioPlayer.src = url;
    els.nativeAudioPlayer.play().then(() => {
      els.globalAudioBar.classList.remove('hidden');
      els.globalAudioBar.classList.add('playing');
      els.audioPlayPauseBtn.textContent = '⏸';
      showToast(`Odtwarzanie stacji: ${name}`);

      // Start rapid, continuous RDS polling
      startRdsPolling();
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
      startRdsPolling();
    } else {
      els.nativeAudioPlayer.pause();
      els.audioPlayPauseBtn.textContent = '▶';
      els.globalAudioBar.classList.remove('playing');
      stopRdsPolling();
    }
  }

  function stopAudio() {
    stopRdsPolling();
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
    markerMap.clear();

    const markers = [];

    for (const t of filteredTransmitters) {
      const marker = L.marker([t.lat, t.lon], {
        icon: createPinIcon(t.category),
        title: `${t.name} - ${t.programOrMux} (${t.frequency} ${t.frequencyUnit})`
      });

      marker._transmitterId = t.id;
      markerMap.set(t.id, marker);

      // Lightweight non-blocking hover tooltip (vanishes on mouseout, never covers dots)
      marker.bindTooltip(`
        <div style="font-size:12px;font-weight:600;line-height:1.3;">
          ${escapeHtml(t.programOrMux)}
          <div style="font-weight:normal;opacity:0.8;font-size:11px;">${t.frequency} ${t.frequencyUnit} • ${escapeHtml(t.name)}</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -18],
        opacity: 0.95,
        className: 'custom-pin-tooltip'
      });

      // On Marker Click: Open dedicated non-obscuring side panel / bottom sheet!
      // This leaves 100% of spiderfied dots visible and clickable without being covered!
      marker.on('click', (e) => {
        if (e && e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        openTransmitterPanel(t, marker);
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
    const isEn = currentLang === 'en';
    const badgeClass = `badge-${t.category}`;
    const categoryName = getCategoryLabel(t.category, currentLang);
    const freqDisplay = t.channel 
      ? `${t.frequency} ${t.frequencyUnit} (${isEn ? 'ch.' : 'k.'} ${t.channel})`
      : `${t.frequency} ${t.frequencyUnit}`;

    const polDisplay = t.polarization === 'H' 
      ? (isEn ? 'Horizontal (H)' : 'Pozioma (H)') 
      : t.polarization === 'V' 
      ? (isEn ? 'Vertical (V)' : 'Pionowa (V)') 
      : t.polarization;

    const charDisplay = t.radiationPattern === 'ND' 
      ? (isEn ? 'Omnidirectional (ND)' : 'Dookólna (ND)') 
      : t.radiationPattern === 'D' 
      ? (isEn ? 'Directional (D)' : 'Kierunkowa (D)') 
      : t.radiationPattern;

    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;
    const isCircleActive = activeCoverageCircles.has(t.id);

    // Audio player button if stream available
    let audioHtml = '';
    if (t.streamUrl) {
      audioHtml = `
        <button class="popup-audio-btn" id="btn-audio-${t.id}">
          <span>▶️ ${isEn ? 'Listen live:' : 'Odsłuchaj na żywo:'} ${escapeHtml(t.streamName || t.programOrMux)}</span>
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
          <span class="popup-rds-title" id="popup-rds-title-${t.id}">${isEn ? 'Loading live data...' : 'Pobieranie danych na żywo...'}</span>
        </div>
      `;
    }

    // TV Channels list if available
    let tvChannelsHtml = '';
    if (t.channelsList && t.channelsList.length > 0) {
      tvChannelsHtml = `
        <div class="popup-tv-channels">
          <strong>${isEn ? `Channels in ${escapeHtml(t.programOrMux)}:` : `Kanały w ${escapeHtml(t.programOrMux)}:`}</strong>
          <div>${escapeHtml(t.channelsList.join(', '))}</div>
        </div>
      `;
    }

    const sameSite = allTransmitters.filter(x => x.siteId === t.siteId && x.id !== t.id);
    let siteChipsHtml = '';
    if (sameSite.length > 0) {
      siteChipsHtml = `
        <div class="popup-site-section">
          <div class="popup-site-label">${isEn ? `Other on this mast (${sameSite.length}):` : `Inne z tego masztu (${sameSite.length}):`}</div>
          <div class="popup-site-chips">
            ${sameSite.slice(0, 5).map(s => `
              <button class="popup-site-chip" data-site-tx-id="${s.id}" title="${escapeHtml(s.programOrMux)} (${s.frequency} ${s.frequencyUnit})">
                ${escapeHtml(s.programOrMux)}
              </button>
            `).join('')}
            ${sameSite.length > 5 ? `<button class="popup-site-chip popup-site-chip-more" id="btn-more-mast-${t.id}">+${sameSite.length - 5}</button>` : ''}
          </div>
        </div>
      `;
    }

    const logoUrl = getStationLogo(t.programOrMux, t.streamName || t.broadcaster);
    const logoHtml = logoUrl ? `<img class="popup-station-logo" src="${logoUrl}" alt="Logo" />` : '';

    return `
      <div class="popup-container">
        <div class="popup-badge-row">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="badge ${badgeClass}">${categoryName}</span>
            <span class="popup-system-tag">${t.system}</span>
          </div>
          <button id="btn-dock-${t.id}" class="popup-dock-btn" title="${isEn ? 'Dock to bottom sheet' : 'Przenieś do panelu dolnego (nie zasłaniaj)'}">📌</button>
        </div>
        <div class="popup-header-row">
          <div style="flex:1;min-width:0;">
            <div class="popup-title">${escapeHtml(t.name)}</div>
            <div class="popup-subtitle">${escapeHtml(t.programOrMux)} &bull; ${escapeHtml(t.location || t.voivodeship)}</div>
          </div>
          ${logoHtml}
        </div>

        ${audioHtml}
        ${rdsHtml}

        <div class="popup-specs-grid">
          <div class="spec-cell">
            <span class="spec-cell-label">${isEn ? 'Freq' : 'Częst.'}</span>
            <span class="spec-cell-val">${freqDisplay}</span>
          </div>
          <div class="spec-cell">
            <span class="spec-cell-label">${isEn ? 'ERP Power' : 'Moc ERP'}</span>
            <span class="spec-cell-val">${t.powerKw} kW</span>
          </div>
          <div class="spec-cell">
            <span class="spec-cell-label">${isEn ? 'Antenna' : 'Antena'}</span>
            <span class="spec-cell-val">${t.heightAgl}m (${polDisplay})</span>
          </div>
          <div class="spec-cell">
            <span class="spec-cell-label">${isEn ? 'Range' : 'Zasięg'}</span>
            <span class="spec-cell-val">~${t.estimatedRangeKm} km</span>
          </div>
        </div>

        ${tvChannelsHtml}
        ${siteChipsHtml}

        <div class="popup-btn-row">
          <button class="popup-btn ${isCircleActive ? 'popup-btn-active-circle' : ''}" id="btn-coverage-${t.id}">
            ${isCircleActive 
              ? (isEn ? '❌ Disable' : '❌ Wyłącz obręb') 
              : (isEn ? `📡 Coverage` : `📡 Zasięg`)}
          </button>
          <button class="popup-btn" id="btn-calc-${t.id}">${isEn ? '📐 Signal Calc' : '📐 Oblicz sygnał'}</button>
          <button class="popup-btn" id="btn-detail-${t.id}">${isEn ? 'ℹ️ More' : 'ℹ️ Więcej'}</button>
        </div>
        <div class="popup-footer-row">
          <button id="btn-copy-${t.id}" class="popup-footer-link">${isEn ? '📋 Copy coords' : '📋 Kopiuj współrzędne'}</button>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-footer-link" style="color:var(--accent);">Google Maps &rarr;</a>
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
              const cleanTitle = data.title
                .replace(/^\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/, '')
                .replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, '')
                .trim();
              rdsTitleEl.textContent = cleanTitle;
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
        marker._popupRdsTimer = setInterval(() => fetchPopupRds(false), 3000);
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
        playAudioStream(t.streamName || t.programOrMux, t.streamUrl, `${t.name} • ${t.frequency} ${t.frequencyUnit}`);
      });
    }

    // Dock to Bottom Sheet button
    const dockBtn = document.getElementById(`btn-dock-${t.id}`);
    if (dockBtn) {
      dockBtn.addEventListener('click', () => {
        marker.closePopup();
        openTransmitterBottomSheet(t);
      });
    }

    // Same mast quick-switcher chips in popup
    const popupEl = marker.getPopup()?.getElement();
    if (popupEl) {
      popupEl.querySelectorAll('[data-site-tx-id]').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = Number(chip.dataset.siteTxId);
          const targetTx = allTransmitters.find(x => x.id === targetId);
          if (targetTx) {
            marker.setPopupContent(createPopupHtml(targetTx));
            attachPopupEvents(targetTx, marker);
          }
        });
      });
      const moreMastBtn = document.getElementById(`btn-more-mast-${t.id}`);
      if (moreMastBtn) {
        moreMastBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openDetailModal(t);
        });
      }
    }
  }

  // Close Transmitter Panel
  function closeTransmitterPanel() {
    const panel = els.transmitterPanel || document.getElementById('transmitterPanel');
    if (panel) panel.classList.add('hidden');

    if (selectedMarker) {
      const pinEl = selectedMarker.getElement()?.querySelector('.custom-pin');
      if (pinEl) pinEl.classList.remove('pin-selected');
      selectedMarker = null;
    }
    selectedTx = null;

    if (panelRdsTimer) {
      clearInterval(panelRdsTimer);
      panelRdsTimer = null;
    }
  }

  // Open Dedicated Non-Obscuring Transmitter Panel (Side card on Desktop, Bottom sheet on Mobile)
  function openTransmitterPanel(t, marker = null) {
    if (!t) return;
    const isEn = currentLang === 'en';
    const panel = els.transmitterPanel || document.getElementById('transmitterPanel');
    if (!panel) return;

    // Deselect previously selected marker
    if (selectedMarker && selectedMarker !== marker) {
      const oldPin = selectedMarker.getElement()?.querySelector('.custom-pin');
      if (oldPin) oldPin.classList.remove('pin-selected');
    }

    // Select new marker
    const activeMarker = marker || markerMap.get(t.id);
    if (activeMarker) {
      selectedMarker = activeMarker;
      const newPin = activeMarker.getElement()?.querySelector('.custom-pin');
      if (newPin) newPin.classList.add('pin-selected');

      // Auto-pan if the marker is under the side panel (desktop) or bottom sheet (mobile)
      setTimeout(() => {
        try {
          if (!map || !activeMarker) return;
          const pt = map.latLngToContainerPoint(activeMarker.getLatLng());
          const sz = map.getSize();
          if (window.innerWidth > 768) {
            // Desktop: Panel is at top-right (width ~380px)
            if (pt.x > sz.x - 420) {
              const dx = pt.x - (sz.x - 420) + 40;
              map.panBy([dx, 0], { animate: true, duration: 0.3 });
            }
          } else {
            // Mobile: Sheet is at bottom (~60% height)
            if (pt.y > sz.y * 0.45) {
              const dy = pt.y - sz.y * 0.35;
              map.panBy([0, dy], { animate: true, duration: 0.3 });
            }
          }
        } catch (_) {}
      }, 50);
    }
    selectedTx = t;

    // Set Station Logo
    const logoUrl = getStationLogo(t.programOrMux, t.streamName || t.broadcaster);
    const logoImg = els.panelLogoImg || document.getElementById('panelLogoImg');
    const logoWrap = els.panelLogoWrap || document.getElementById('panelLogoWrap');

    if (logoUrl && logoImg && logoWrap) {
      logoImg.src = logoUrl;
      logoImg.alt = `${escapeHtml(t.programOrMux)} Logo`;
      logoImg.classList.remove('hidden');
      logoWrap.classList.remove('hidden');
    } else if (logoWrap) {
      logoWrap.classList.add('hidden');
    }

    // Header Badges & Info
    const catBadge = els.panelCategoryBadge || document.getElementById('panelCategoryBadge');
    if (catBadge) {
      catBadge.className = `badge badge-${t.category}`;
      catBadge.textContent = getCategoryLabel(t.category, currentLang);
    }
    const sysBadge = els.panelSystemBadge || document.getElementById('panelSystemBadge');
    if (sysBadge) {
      sysBadge.textContent = t.system;
    }
    const titleEl = els.panelTitle || document.getElementById('panelTitle');
    if (titleEl) {
      titleEl.textContent = `${t.programOrMux} (${t.name})`;
    }
    const locEl = els.panelLocation || document.getElementById('panelLocation');
    if (locEl) {
      locEl.textContent = `${escapeHtml(t.broadcaster)} • ${escapeHtml(t.location || t.voivodeship)}`;
    }

    // Spec Values Formatting
    const polDisplay = t.polarization === 'H' 
      ? (isEn ? 'Horizontal (H)' : 'Pozioma (H)') 
      : t.polarization === 'V' 
      ? (isEn ? 'Vertical (V)' : 'Pionowa (V)') 
      : (t.polarization || 'H');

    const freqDisplay = t.channel 
      ? `${t.frequency} ${t.frequencyUnit} (${isEn ? 'ch.' : 'k.'} ${t.channel})`
      : `${t.frequency} ${t.frequencyUnit}`;

    const isCircleActive = activeCoverageCircles.has(t.id);
    const sameSite = allTransmitters.filter(x => x.siteId === t.siteId);

    // Audio stream button
    let audioBtnHtml = '';
    if (t.streamUrl) {
      audioBtnHtml = `
        <button class="panel-play-btn" id="panelPlayAudioBtn">
          ▶️ ${isEn ? 'Listen live:' : 'Odsłuchaj na żywo:'} ${escapeHtml(t.streamName || t.programOrMux)}
        </button>
      `;
    }

    // Live RDS ticker for radio
    let rdsHtml = '';
    if (t.category === 'fm' || t.category === 'dab' || t.category === 'am') {
      rdsHtml = `
        <div class="popup-rds-badge" id="panelRdsBadge" style="margin-bottom:2px;">
          <span class="rds-pulse-dot"></span>
          <span class="popup-rds-label">RDS:</span>
          <span class="popup-rds-title" id="panelRdsTitle">${isEn ? 'Loading live RDS...' : 'Pobieranie RDS...'}</span>
        </div>
      `;
    }

    // TV Channels list for TV multiplexes
    let tvChannelsHtml = '';
    if (t.channelsList && t.channelsList.length > 0) {
      tvChannelsHtml = `
        <div class="popup-tv-channels" style="margin-bottom:4px;">
          <strong>${isEn ? `Channels in ${escapeHtml(t.programOrMux)}:` : `Kanały w ${escapeHtml(t.programOrMux)}:`}</strong>
          <div style="margin-top:2px;font-size:11px;color:var(--text-muted);">${escapeHtml(t.channelsList.join(', '))}</div>
        </div>
      `;
    }

    // Google Maps URL
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;

    // Body HTML
    const bodyEl = els.panelBody || document.getElementById('panelBody');
    if (bodyEl) {
      bodyEl.innerHTML = `
        ${audioBtnHtml}
        ${rdsHtml}
        ${tvChannelsHtml}
        <div class="panel-spec-grid">
          <div class="panel-spec-box">
            <span class="spec-label">${isEn ? 'Frequency' : 'Częstotliwość'}</span>
            <span class="spec-value">${freqDisplay}</span>
          </div>
          <div class="panel-spec-box">
            <span class="spec-label">${isEn ? 'ERP Power' : 'Moc ERP'}</span>
            <span class="spec-value">${t.powerKw} kW</span>
          </div>
          <div class="panel-spec-box">
            <span class="spec-label">${isEn ? 'Antenna' : 'Antena'}</span>
            <span class="spec-value">${t.heightAgl}m (${polDisplay.split(' ')[0]})</span>
          </div>
          <div class="panel-spec-box">
            <span class="spec-label">${isEn ? 'Range' : 'Zasięg'}</span>
            <span class="spec-value">~${t.estimatedRangeKm} km</span>
          </div>
        </div>
        <div class="panel-actions-row">
          <button class="btn-primary" id="panelCalcBtn" title="${isEn ? 'Calculate signal for any city or address' : 'Oblicz propagację sygnału dla dowolnego miasta lub adresu'}">
            📐 ${isEn ? 'Signal Calc' : 'Oblicz sygnał'}
          </button>
          <button class="btn-secondary" id="panelCoverageBtn" title="${isEn ? 'Toggle estimated coverage circle on map' : 'Włącz / wyłącz okrąg szacowanego zasięgu na mapie'}">
            ${isCircleActive ? (isEn ? '❌ Disable' : '❌ Wyłącz obręb') : (isEn ? '📡 Coverage' : '📡 Zasięg')}
          </button>
          <button class="btn-secondary" id="panelMoreBtn" title="${isEn ? 'View full UKE registration details' : 'Pełna karta danych z rejestru UKE'}">
            ℹ️ ${isEn ? 'More' : 'Więcej'}
          </button>
          <a href="${gmapsUrl}" target="_blank" rel="noopener" class="btn-secondary" style="text-decoration:none;" title="Google Maps">
            🗺️
          </a>
        </div>
        ${sameSite.length > 1 ? `
          <div class="panel-same-site">
            <div class="panel-sub" style="margin-bottom:6px;font-weight:600;color:var(--text-main);">
              ${isEn ? `Other on this mast (${sameSite.length - 1}):` : `Inne z tego masztu (${sameSite.length - 1}):`}
            </div>
            <div class="panel-chips-row">
              ${sameSite.map(s => `
                <button class="panel-site-chip ${s.id === t.id ? 'active-chip' : ''}" data-site-tx-id="${s.id}" title="${escapeHtml(s.name)} - ${s.frequency} ${s.frequencyUnit}">
                  ${escapeHtml(s.programOrMux)} <span style="opacity:0.75;font-size:10px;">${s.frequency}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;

      // Wire Audio Play Button
      if (t.streamUrl) {
        const playBtn = document.getElementById('panelPlayAudioBtn');
        if (playBtn) {
          playBtn.onclick = () => {
            playAudioStream(t.streamName || t.programOrMux, t.streamUrl, `${t.name} • ${t.frequency} ${t.frequencyUnit}`);
          };
        }
      }

      // Wire Signal Calc Button
      const calcBtn = document.getElementById('panelCalcBtn');
      if (calcBtn) {
        calcBtn.onclick = () => openSignalCalculator(t);
      }

      // Wire Coverage Circle Button
      const covBtn = document.getElementById('panelCoverageBtn');
      if (covBtn) {
        covBtn.onclick = () => {
          toggleCoverageCircle(t);
          const active = activeCoverageCircles.has(t.id);
          covBtn.textContent = active ? (isEn ? '❌ Disable' : '❌ Wyłącz obręb') : (isEn ? '📡 Coverage' : '📡 Zasięg');
        };
      }

      // Wire Full Details Modal Button
      const moreBtn = document.getElementById('panelMoreBtn');
      if (moreBtn) {
        moreBtn.onclick = () => openDetailModal(t);
      }

      // Wire Same Mast Chips
      bodyEl.querySelectorAll('[data-site-tx-id]').forEach(chip => {
        chip.onclick = (e) => {
          e.stopPropagation();
          const targetId = Number(chip.dataset.siteTxId);
          const targetTx = allTransmitters.find(x => x.id === targetId);
          if (targetTx) {
            const targetM = markerMap.get(targetId);
            openTransmitterPanel(targetTx, targetM);
          }
        };
      });
    }

    // Live RDS Polling
    if (panelRdsTimer) {
      clearInterval(panelRdsTimer);
      panelRdsTimer = null;
    }
    const rdsTitleEl = document.getElementById('panelRdsTitle');
    if (rdsTitleEl) {
      const fetchPanelRds = () => {
        fetch(`/api/rds?url=${encodeURIComponent(t.streamUrl || '')}&station=${encodeURIComponent(t.streamName || t.programOrMux)}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.title && rdsTitleEl) {
              const cleanTitle = data.title.replace(/^\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/, '').replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, '').trim();
              rdsTitleEl.textContent = cleanTitle;
            }
          }).catch(() => {});
      };
      fetchPanelRds();
      panelRdsTimer = setInterval(fetchPanelRds, 3000);
    }

    // Open panel
    panel.classList.remove('hidden');
  }

  // Backwards compatibility alias
  function openTransmitterBottomSheet(t) {
    openTransmitterPanel(t, markerMap.get(t?.id));
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
    const isEn = currentLang === 'en';
    currentCalcTransmitter = t;
    els.calcTransmitterTitle.textContent = isEn ? `Signal Calculator: ${t.name}` : `Kalkulator sygnału: ${t.name}`;
    els.calcTopInfo.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="color:#fff;font-size:14px;">${escapeHtml(t.name)}</strong> • 
          <span style="color:var(--accent);font-weight:600;">${escapeHtml(t.programOrMux)}</span>
          <div style="color:var(--text-dim);font-size:11px;">${escapeHtml(t.location || t.voivodeship)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;color:#fff;">${t.powerKw} kW ERP</div>
          <div style="font-size:11px;color:var(--text-muted);">${t.heightAgl} m ${isEn ? 'AGL' : 'n.p.t.'} (${t.frequency} ${t.frequencyUnit})</div>
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
    const isEn = currentLang === 'en';
    const q = els.calcLocationInput.value.trim();
    if (!q) {
      showToast(isEn ? 'Enter city, municipality, or street address!' : 'Wpisz miasto, gminę lub ulicę!');
      return;
    }

    if (!currentCalcTransmitter) return;

    els.calcLoading.classList.remove('hidden');
    els.calcResults.classList.add('hidden');

    try {
      let results = null;
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().startsWith('[')) {
            results = JSON.parse(text);
          }
        }
      } catch (_) {}

      // Fallback: direct Nominatim call if backend endpoint unavailable
      if (!results) {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=pl&q=${encodeURIComponent(q)}`);
        if (nomRes.ok) {
          results = await nomRes.json();
        }
      }

      els.calcLoading.classList.add('hidden');

      if (!results || results.length === 0) {
        els.calcResults.innerHTML = `
          <div style="color:#fca5a5;padding:12px;background:rgba(239,68,68,0.1);border-radius:6px;">
            ${isEn 
              ? `Could not find location "<strong>${escapeHtml(q)}</strong>" in Poland. Please check spelling or specify city.` 
              : `Nie znaleziono lokalizacji "<strong>${escapeHtml(q)}</strong>" w Polsce. Sprawdź pisownię lub dodaj miasto (np. "Warszawa Marszałkowska").`}
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

      let locTypeLabel = isEn ? 'City / Town' : 'Miejscowość';
      let locBadgeClass = 'badge-fm';
      if (isStreet) { 
        locTypeLabel = isEn ? 'Street / Exact Address' : 'Ulica / Dokładny adres'; 
        locBadgeClass = 'badge-tv'; 
      } else if (isGmina) { 
        locTypeLabel = isEn ? 'Municipality' : 'Gmina'; 
        locBadgeClass = 'badge-dab'; 
      } else if (isCity) { 
        locTypeLabel = isEn ? 'City' : 'Miasto'; 
        locBadgeClass = 'badge-fm'; 
      }

      // Distance in km
      const distanceKm = getDistanceKm(t.lat, t.lon, targetLat, targetLon);

      // Azimuth from Target to Transmitter (Antenna direction!)
      const azimuthDeg = getAzimuth(targetLat, targetLon, t.lat, t.lon);
      const compassDir = getCompassDirection(azimuthDeg, currentLang);

      // Transmitter engineered coverage radius in km
      const R = Math.max(5, t.estimatedRangeKm || 30);
      const ratio = distanceKm / R;

      // Realistic Propagation & Signal Calculation based on engineered coverage contour:
      let minThreshold = 48;
      if (t.category === 'fm') minThreshold = 54;
      else if (t.category === 'dab') minThreshold = 50;
      else if (t.category === 'am') minThreshold = 60;

      let percent = 0;
      let fieldStrengthDbuv = 0;

      if (ratio <= 0.15) {
        percent = Math.round(95 + (1 - ratio / 0.15) * 5);
        fieldStrengthDbuv = minThreshold + 38;
      } else if (ratio <= 0.50) {
        const frac = (ratio - 0.15) / 0.35;
        percent = Math.round(95 - frac * 20);
        fieldStrengthDbuv = minThreshold + 38 - frac * 14;
      } else if (ratio <= 0.80) {
        const frac = (ratio - 0.50) / 0.30;
        percent = Math.round(75 - frac * 25);
        fieldStrengthDbuv = minThreshold + 24 - frac * 14;
      } else if (ratio <= 1.00) {
        const frac = (ratio - 0.80) / 0.20;
        percent = Math.round(50 - frac * 20);
        fieldStrengthDbuv = minThreshold + 10 - frac * 10;
      } else if (ratio <= 1.15) {
        const frac = (ratio - 1.00) / 0.15;
        percent = Math.round(30 - frac * 22);
        fieldStrengthDbuv = minThreshold - frac * 12;
      } else if (ratio <= 1.25) {
        const frac = (ratio - 1.15) / 0.10;
        percent = Math.round(8 - frac * 8);
        fieldStrengthDbuv = minThreshold - 12 - frac * 10;
      } else {
        percent = 0;
        fieldStrengthDbuv = Math.max(8, minThreshold - 25 - (distanceKm - R * 1.25) * 0.8);
      }

      // Height and street rooftop antenna bonus
      if (isStreet && percent > 0 && percent < 95) {
        percent = Math.min(100, percent + 4);
      }

      percent = Math.max(0, Math.min(100, percent));
      let dbm = Math.round(fieldStrengthDbuv - 125);

      // Recommendations & Quality text
      let qualityClass = 'signal-excellent';
      let qualityText = isEn ? 'Very strong (100% reception)' : 'Bardzo silny (100% odbiór)';
      let adviceText = '';

      if (percent >= 80) {
        qualityClass = 'signal-excellent';
        qualityText = isEn ? 'Maximum signal strength & quality (S9+)' : 'Maksymalna siła i jakość sygnału (S9+)';
        adviceText = isStreet
          ? (isEn
            ? `<strong>Ideal reception on selected street:</strong> Signal is very strong (${dbm} dBm / ~${fieldStrengthDbuv.toFixed(0)} dBµV/m). A simple indoor antenna or short rod without amplifier is sufficient.`
            : `<strong>Idealny odbiór na wybranej ulicy:</strong> Sygnał jest bardzo silny (${dbm} dBm / ~${fieldStrengthDbuv.toFixed(0)} dBµV/m). Wystarczy prosta antena pokojowa lub krótki pręt bez wzmacniacza.`)
          : (isEn
            ? `<strong>Reliable coverage across entire town/area:</strong> Average signal in this area is ~${percent}%. Indoor and vehicle reception is completely stable.`
            : `<strong>Pewny zasięg w całym mieście/gminie:</strong> Średnia siła sygnału w rejonie wynosi ~${percent}%. Odbiór wewnątrz budynków oraz w pojazdach bez żadnych zakłóceń.`);
      } else if (percent >= 55) {
        qualityClass = 'signal-good';
        qualityText = isEn ? 'Good and stable signal (S7-S9)' : 'Dobry i stabilny sygnał (S7-S9)';
        adviceText = isStreet
          ? (isEn
            ? `<strong>Good reception on ${escapeHtml(addr.road || 'street')}:</strong> Reception is stable. A simple outdoor antenna (balcony or roof) aimed at <strong>azimuth ${azimuthDeg.toFixed(0)}° (${compassDir})</strong> is recommended.`
            : `<strong>Dobry odbiór na ${escapeHtml(addr.road || 'ulicy')}:</strong> Odbiór stabilny. Dla telewizji lub radia zalecana prosta antena zewnętrzna (na balkonie lub dachu) skierowana na <strong>azymut ${azimuthDeg.toFixed(0)}° (${compassDir})</strong>.`)
          : (isEn
            ? `<strong>Good coverage across municipality:</strong> Most residents have stable reception. In dense urban clutter, an outdoor antenna is recommended.`
            : `<strong>Dobry zasięg na obszarze gminy:</strong> Większość mieszkańców ma stabilny odbiór. W gęstej zabudowie zalecana antena zewnętrzna.`);
      } else if (percent >= 30) {
        qualityClass = 'signal-medium';
        qualityText = isEn ? 'Medium signal / coverage fringe (S4-S6)' : 'Średni sygnał / granica zasięgu (S4-S6)';
        adviceText = isStreet
          ? (isEn
            ? `<strong>Directional antenna required:</strong> Distance is ${distanceKm.toFixed(1)} km (near coverage fringe ~${R} km). For reliable reception, an outdoor directional antenna (Yagi min. 10-14 dB) aimed precisely at <strong>azimuth ${azimuthDeg.toFixed(0)}° (${compassDir})</strong> is necessary.`
            : `<strong>Wymagana antena kierunkowa:</strong> Odległość wynosi ${distanceKm.toFixed(1)} km (blisko granicy zasięgu ~${R} km). Do stabilnego odbioru konieczna jest zewnętrzna antena kierunkowa (Yagi min. 10-14 dB) ustawiona precyzyjnie na <strong>azymut ${azimuthDeg.toFixed(0)}° (${compassDir})</strong>.`)
          : (isEn
            ? `<strong>Peripheral fringe coverage in municipality:</strong> Location is at the edge of nominal transmitter range (~${R} km). A rooftop antenna with a preamplifier is recommended.`
            : `<strong>Zasięg peryferyjny w gminie:</strong> Rejon znajduje się na skraju zasięgu nadajnika (~${R} km). Wskazana antena dachowa ze wzmacniaczem.`);
      } else if (percent > 0) {
        qualityClass = 'signal-weak';
        qualityText = isEn ? 'Very weak signal / near drop-off (S1-S3)' : 'Bardzo słaby sygnał / na granicy zaniku (S1-S3)';
        adviceText = isStreet
          ? (isEn
            ? `<strong>Residual signal:</strong> Distance is ${distanceKm.toFixed(1)} km and exceeds nominal coverage (~${R} km). Reception may be unstable or experience frequent dropouts.`
            : `<strong>Sygnał szczątkowy:</strong> Odległość wynosi ${distanceKm.toFixed(1)} km i przekracza zasięg podstawowy (~${R} km). Odbiór może być niestabilny lub okresowo zanikać.`)
          : (isEn
            ? `<strong>Outside primary coverage:</strong> Area lies outside nominal coverage of this transmitter (~${R} km). Choosing a closer transmitter is advised.`
            : `<strong>Poza główną strefą pokrycia:</strong> Rejon leży poza nominalnym zasięgiem tego nadajnika (~${R} km). Zalecany wybór innego, bliższego nadajnika.`);
      } else {
        qualityClass = 'signal-none';
        qualityText = isEn ? 'No signal (0% - out of range)' : 'Brak sygnału (0% - poza zasięgiem)';
        adviceText = isStreet
          ? (isEn
            ? `<strong>No signal at selected street:</strong> Distance is <strong>${distanceKm.toFixed(1)} km</strong>, which exceeds the transmitter coverage (~${R} km). No signal reaches this location. Choose a closer transmitter serving this area.`
            : `<strong>Brak sygnału na wybranej ulicy:</strong> Odległość wynosi <strong>${distanceKm.toFixed(1)} km</strong> i znacznie przekracza maksymalny zasięg tego nadajnika (~${R} km). Sygnał z tego obiektu nie dociera. Wybierz bliższy nadajnik obsługujący ten rejon.`)
          : (isEn
            ? `<strong>Out of range in selected town/city:</strong> Distance is <strong>${distanceKm.toFixed(1)} km</strong>, while transmitter coverage is ~${R} km (location is <strong>${(distanceKm - R).toFixed(1)} km outside coverage contour</strong>). Reception from this transmitter is not possible.`
            : `<strong>Brak zasięgu w wybranej miejscowości:</strong> Odległość wynosi <strong>${distanceKm.toFixed(1)} km</strong>, podczas gdy zasięg nadajnika to ~${R} km (miejsce jest o <strong>${(distanceKm - R).toFixed(1)} km poza strefą pokrycia</strong>). Brak możliwości odbioru tego nadajnika.`);
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
            <span>${isEn ? 'Signal strength & quality:' : 'Siła i jakość sygnału:'}</span>
            <span class="${qualityClass}" style="font-weight:700;">${percent}% • ${qualityText}</span>
          </div>
          <div class="signal-bar-track">
            <div class="signal-bar-fill ${qualityClass}" style="width: ${percent}%;"></div>
          </div>
        </div>

        <div class="calc-params-grid">
          <div class="calc-param-box">
            <div class="calc-param-label">${isEn ? 'Distance to transmitter' : 'Odległość do nadajnika'}</div>
            <div class="calc-param-val">${distanceKm.toFixed(isStreet ? 2 : 1)} km</div>
          </div>
          <div class="calc-param-box">
            <div class="calc-param-label">${isEn ? 'Transmitter range' : 'Zasięg nadajnika'}</div>
            <div class="calc-param-val">~${R} km ${distanceKm > R 
              ? (isEn ? '<span style="color:#ef4444;font-size:11px;">(Out of range)</span>' : '<span style="color:#ef4444;font-size:11px;">(Poza zasięgiem)</span>') 
              : (isEn ? '<span style="color:#10b981;font-size:11px;">(In range)</span>' : '<span style="color:#10b981;font-size:11px;">(W zasięgu)</span>')}</div>
          </div>
          <div class="calc-param-box">
            <div class="calc-param-label">${isEn ? 'Antenna Azimuth' : 'Azymut (Kierunek anteny)'}</div>
            <div class="calc-param-val">${azimuthDeg.toFixed(0)}&deg; (${compassDir})</div>
          </div>
        </div>

        <div class="calc-advice">
          ${adviceText}
        </div>

        <div style="display:flex;gap:8px;margin-top:4px;">
          <button id="calcShowOnMapBtn" class="btn-primary">${isEn ? 'Show signal line on map' : 'Pokaż linię zasięgu na mapie'}</button>
          <button id="calcCloseBtn" class="btn-secondary">${isEn ? 'Close calculator' : 'Zamknij kalkulator'}</button>
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
      els.calcResults.innerHTML = `<div style="color:#ef4444;">${currentLang === 'en' ? 'Geocoder connection error:' : 'Błąd połączenia z geokoderem:'} ${err.message}</div>`;
      els.calcResults.classList.remove('hidden');
    }
  }

  // Draw measurement line on map
  function drawMeasurementLine(t, targetLat, targetLon, targetName, distKm, percent, azimuthDeg, compassDir) {
    clearMeasurementLine();
    const isEn = currentLang === 'en';

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

    const qualityLabel = percent === 0 
      ? (isEn ? 'Out of range' : 'Brak sygnału') 
      : percent >= 70 
      ? (isEn ? 'Very strong' : 'Bardzo silny') 
      : (isEn ? 'Medium' : 'Średni');

    targetLocationMarker.bindPopup(`
      <div style="font-size:12px;">
        <strong style="color:${inRange ? '#38bdf8' : '#ef4444'};font-size:13px;">${inRange 
          ? (isEn ? 'Reception point (In range):' : 'Punkt odbioru (W zasięgu):') 
          : (isEn ? 'Reception point (Out of range):' : 'Punkt odbioru (Poza zasięgiem):')}</strong>
        <div style="margin:2px 0 6px 0;font-weight:600;">${escapeHtml(targetName)}</div>
        <table style="width:100%;font-size:11px;">
          <tr><td>${isEn ? 'Transmitter:' : 'Nadajnik:'}</td><td><strong>${escapeHtml(t.name)}</strong></td></tr>
          <tr><td>${isEn ? 'Distance:' : 'Odległość:'}</td><td><strong>${distKm.toFixed(2)} km</strong></td></tr>
          <tr><td>${isEn ? 'Transmitter range:' : 'Zasięg nadajnika:'}</td><td><strong>~${R} km</strong></td></tr>
          <tr><td>${isEn ? 'Antenna azimuth:' : 'Azymut anteny:'}</td><td><strong>${azimuthDeg.toFixed(0)}° (${compassDir})</strong></td></tr>
          <tr><td>${isEn ? 'Estimated signal:' : 'Szacowany sygnał:'}</td><td><strong style="color:${percentColor};">${percent}% (${qualityLabel})</strong></td></tr>
        </table>
      </div>
    `).openPopup();

    els.clearMeasureLineBtn.classList.remove('hidden');

    // Fit map bounds to show both points
    map.fitBounds([
      [t.lat, t.lon],
      [targetLat, targetLon]
    ], { padding: [60, 60] });

    showToast(isEn ? `Drew signal line: ${distKm.toFixed(1)} km, signal: ${percent}%` : `Narysowano linię sygnału: ${distKm.toFixed(1)} km, sygnał: ${percent}%`);
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
    const isEn = currentLang === 'en';
    const logoUrl = getStationLogo(t.programOrMux, t.streamName || t.broadcaster);
    const logoImg = logoUrl ? `<img src="${logoUrl}" class="modal-station-logo" alt="Logo" /> ` : '';
    els.modalTitle.innerHTML = `${logoImg}${escapeHtml(t.name)} (${escapeHtml(t.programOrMux)})`;
    els.modalCategoryBadge.className = `badge badge-${t.category}`;
    els.modalCategoryBadge.textContent = getCategoryLabel(t.category, currentLang);

    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;

    // TV Channels chips
    let channelsHtml = '';
    if (t.channelsList && t.channelsList.length > 0) {
      channelsHtml = `
        <div class="detail-box" style="grid-column: span 2;">
          <div class="detail-label">${isEn ? `TV channels broadcast in this multiplex (${t.channelsList.length})` : `Stacje TV nadawane w tym multipleksie (${t.channelsList.length})`}</div>
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
          ▶️ ${isEn ? 'Listen live:' : 'Odsłuchaj na żywo:'} ${escapeHtml(t.streamName || t.programOrMux)}
        </button>
      `;
    }

    // Check same site broadcasts
    const sameSiteTransmitters = allTransmitters.filter(x => x.siteId === t.siteId && x.id !== t.id);
    let sameSiteHtml = '';
    if (sameSiteTransmitters.length > 0) {
      sameSiteHtml = `
        <div class="site-broadcasts-box" style="grid-column: span 2;">
          <div class="detail-label">${isEn ? `Other broadcasts from this mast / site (${sameSiteTransmitters.length})` : `Inne emisje z tego masztu / obiektu (${sameSiteTransmitters.length})`}</div>
          <div class="site-broadcasts-list">
            ${sameSiteTransmitters.map(s => `
              <div class="site-item" data-id="${s.id}">
                <div>
                  <strong>${escapeHtml(s.programOrMux)}</strong>
                  <span style="color:var(--text-dim);font-size:11px;"> • ${s.frequency} ${s.frequencyUnit}</span>
                </div>
                <span class="site-item-badge badge-${s.category}">${s.system} (${s.powerKw} kW)</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    const polText = t.polarization === 'H' 
      ? (isEn ? 'Horizontal (H)' : 'Pozioma (H)') 
      : t.polarization === 'V' 
      ? (isEn ? 'Vertical (V)' : 'Pionowa (V)') 
      : t.polarization;
      
    const charText = t.radiationPattern === 'ND' 
      ? (isEn ? 'Omnidirectional (ND)' : 'Dookólna (ND)') 
      : (isEn ? 'Directional (D)' : 'Kierunkowa (D)');

    els.modalBody.innerHTML = `
      ${modalAudioHtml}

      <div class="detail-grid">
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Broadcaster / Applicant' : 'Kto nadaje (Nadawca / Wnioskodawca)'}</div>
          <div class="detail-value" style="color:#38bdf8;">${escapeHtml(t.broadcaster)}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Program / Multiplex' : 'Co nadaje (Program / MUX)'}</div>
          <div class="detail-value" style="color:#4ade80;">${escapeHtml(t.programOrMux)}</div>
        </div>

        ${channelsHtml}

        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Broadcast standard' : 'System emisji'}</div>
          <div class="detail-value">${escapeHtml(t.system)}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Frequency' : 'Częstotliwość'}</div>
          <div class="detail-value">${t.frequency} ${t.frequencyUnit} ${t.channel ? `(${isEn ? 'channel' : 'kanał'} ${t.channel})` : ''}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'ERP Power' : 'Moc ERP'}</div>
          <div class="detail-value">${t.powerKw} kW (${t.powerDbw} dBW)</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Antenna height' : 'Wysokość anteny'}</div>
          <div class="detail-value">${t.heightAgl} m ${isEn ? 'AGL' : 'n.p.t.'} (${t.heightAmsl} m ${isEn ? 'AMSL' : 'n.p.m.'})</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Polarization' : 'Polaryzacja'}</div>
          <div class="detail-value">${polText}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Radiation pattern' : 'Charakterystyka'}</div>
          <div class="detail-value">${charText}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Coordinates (WGS84)' : 'Współrzędne (WGS84)'}</div>
          <div class="detail-value">${t.lat}&deg; N, ${t.lon}&deg; E</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Estimated coverage radius' : 'Szacowany promień zasięgu'}</div>
          <div class="detail-value">~${t.estimatedRangeKm} km</div>
        </div>
        <div class="detail-box" style="grid-column: span 2;">
          <div class="detail-label">${isEn ? 'Location / Site' : 'Lokalizacja / Obiekt'}</div>
          <div class="detail-value">${escapeHtml(t.location || '-')} (${t.voivodeship})</div>
        </div>

        ${sameSiteHtml}

        <div class="detail-box">
          <div class="detail-label">${isEn ? 'UKE permit status' : 'Status pozwolenia UKE'}</div>
          <div class="detail-value">${escapeHtml(t.status)}</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">${isEn ? 'Permit validity' : 'Ważność pozwolenia'}</div>
          <div class="detail-value">${escapeHtml(t.validTo || (isEn ? 'No data' : 'Brak danych'))}</div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-primary" id="modalCalcSignalBtn">${isEn ? '📐 Calculate signal at location' : '📐 Oblicz sygnał w lokalizacji'}</button>
        <button class="btn-secondary" id="modalToggleCoverageBtn">
          ${activeCoverageCircles.has(t.id) 
            ? (isEn ? '❌ Disable coverage' : '❌ Wyłącz obręb') 
            : (isEn ? '📡 Enable coverage circle' : '📡 Włącz obręb zasięgu')}
        </button>
        <a class="btn-secondary" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">${isEn ? 'Navigate (Google Maps)' : 'Nawiguj (Google Maps)'}</a>
      </div>
    `;

    // Modal play audio
    const modalAudioBtn = document.getElementById('modalPlayAudioBtn');
    if (modalAudioBtn) {
      modalAudioBtn.onclick = () => {
        playAudioStream(t.streamName || t.programOrMux, t.streamUrl, `${t.name} • ${t.frequency} ${t.frequencyUnit}`);
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
      modalCovBtn.textContent = isNowActive 
        ? (isEn ? '❌ Disable coverage' : '❌ Wyłącz obręb') 
        : (isEn ? '📡 Enable coverage circle' : '📡 Włącz obręb zasięgu');
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
          <span>${t.powerKw} kW • ${t.polarization}</span>
          ${distText}
        </div>
      `;

      div.onclick = () => {
        map.setView([t.lat, t.lon], 13);
        const marker = markerMap.get(t.id) || clusterGroup.getLayers().find(m => {
          const ll = m.getLatLng();
          return Math.abs(ll.lat - t.lat) < 0.0001 && Math.abs(ll.lng - t.lon) < 0.0001;
        });
        if (marker) {
          clusterGroup.zoomToShowLayer(marker, () => {
            openTransmitterPanel(t, marker);
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
    // Language switcher buttons
    if (els.langPlBtn) {
      els.langPlBtn.addEventListener('click', () => setLanguage('pl'));
    }
    if (els.langEnBtn) {
      els.langEnBtn.addEventListener('click', () => setLanguage('en'));
    }

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

    // Transmitter Panel Close & Map Event Isolation
    const closePanelBtn = document.getElementById('closePanelBtn');
    if (closePanelBtn) {
      closePanelBtn.addEventListener('click', closeTransmitterPanel);
    }
    const closeBottomSheetBtn = document.getElementById('closeBottomSheetBtn');
    if (closeBottomSheetBtn) {
      closeBottomSheetBtn.addEventListener('click', closeTransmitterPanel);
    }
    const txPanel = document.getElementById('transmitterPanel');
    if (txPanel) {
      L.DomEvent.disableClickPropagation(txPanel);
      L.DomEvent.disableScrollPropagation(txPanel);
    }

    // Global Escape Key to close panel & modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTransmitterPanel();
        if (els.detailModal) els.detailModal.classList.add('hidden');
        if (els.calcModal) els.calcModal.classList.add('hidden');
        if (els.radioDrawer) els.radioDrawer.classList.add('hidden');
        if (els.listDrawer) els.listDrawer.classList.add('hidden');
      }
    });

    // Mobile Backdrop Close
    const mobileBackdrop = document.getElementById('mobileBackdrop');
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', () => {
        els.sidebar.classList.add('collapsed');
        els.radioDrawer.classList.add('hidden');
        els.listDrawer.classList.add('hidden');
        closeTransmitterPanel();
        mobileBackdrop.classList.add('hidden');
      });
    }

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

  function getCompassDirection(bearing, lang = currentLang) {
    const isEn = lang === 'en';
    const directionsPl = ['N (Północ)', 'NNE', 'NE', 'ENE', 'E (Wschód)', 'ESE', 'SE', 'SSE',
                          'S (Południe)', 'SSW', 'SW', 'WSW', 'W (Zachód)', 'WNW', 'NW', 'NNW'];
    const directionsEn = ['N (North)', 'NNE', 'NE', 'ENE', 'E (East)', 'ESE', 'SE', 'SSE',
                          'S (South)', 'SSW', 'SW', 'WSW', 'W (West)', 'WNW', 'NW', 'NNW'];
    const dirs = isEn ? directionsEn : directionsPl;
    const idx = Math.round(bearing / 22.5) % 16;
    return dirs[idx];
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
