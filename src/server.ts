import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { AppConfig, Transmitter } from './types.js';
import { getOrBuildTransmitterCache } from './data-parser.js';

function loadConfig(): AppConfig {
  const configPath = path.resolve('./config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as AppConfig;
}

const config = loadConfig();
const app = express();

app.use(cors());
app.use(express.json());

// Load transmitters dataset
let transmitters: Transmitter[] = getOrBuildTransmitterCache(config);
console.log(`Loaded ${transmitters.length} transmitters into memory.`);

// Geocoding memory cache
const geocodeCache = new Map<string, any>();

// API: Get current config (safe for frontend)
app.get('/api/config', (_req: Request, res: Response) => {
  try {
    const currentConfig = loadConfig();
    res.json({
      title: currentConfig.map.title,
      initialCenter: currentConfig.map.initialCenter,
      initialZoom: currentConfig.map.initialZoom,
      minZoom: currentConfig.map.minZoom,
      maxZoom: currentConfig.map.maxZoom,
      tileLayer: currentConfig.map.tileLayer,
      enableClustering: currentConfig.map.enableClustering,
      maxClusterRadius: currentConfig.map.maxClusterRadius,
      showCoverageOnMarkerClick: currentConfig.map.showCoverageOnMarkerClick,
      filters: currentConfig.filters
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Geocode city / municipality / street using Nominatim
app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Brak parametru wyszukiwania q' });
    }
    const cleanQ = q.trim();
    const cacheKey = cleanQ.toLowerCase();

    if (geocodeCache.has(cacheKey)) {
      return res.json(geocodeCache.get(cacheKey));
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=pl&q=${encodeURIComponent(cleanQ)}`;
    const nominatimRes = await fetch(url, {
      headers: {
        'User-Agent': 'NadajnikiPL-SignalCoverageMap/2.0'
      }
    });

    if (!nominatimRes.ok) {
      return res.status(502).json({ error: 'Błąd pobierania danych z geokodera' });
    }

    const data = await nominatimRes.json();
    geocodeCache.set(cacheKey, data);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get verified working radio streams
app.get('/api/radio-streams', (_req: Request, res: Response) => {
  try {
    const p = path.resolve('./data/working_radio_streams.json');
    if (fs.existsSync(p)) {
      const streams = JSON.parse(fs.readFileSync(p, 'utf8'));
      res.json(streams);
    } else {
      res.json([]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get all broadcasts from the same transmitter site / mast
app.get('/api/site/:siteId', (req: Request, res: Response) => {
  try {
    const siteId = req.params.siteId;
    const sameSite = transmitters.filter(t => t.siteId === siteId);
    res.json(sameSite);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function stripDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase();
}

// API: Get transmitters with optional filtering
app.get('/api/transmitters', (req: Request, res: Response) => {
  try {
    let result = transmitters;
    const { category, q, voivodeship, minPower, mux, system } = req.query;

    if (category && typeof category === 'string') {
      const cats = category.split(',').map(c => c.trim().toLowerCase());
      result = result.filter(t => cats.includes(t.category));
    }

    if (voivodeship && typeof voivodeship === 'string' && voivodeship !== 'ALL') {
      const vUpper = voivodeship.toUpperCase();
      result = result.filter(t => t.voivodeship === vUpper);
    }

    if (minPower && !isNaN(Number(minPower))) {
      const minP = Number(minPower);
      result = result.filter(t => t.powerKw >= minP);
    }

    if (mux && typeof mux === 'string' && mux !== 'ALL') {
      const muxLower = stripDiacritics(mux);
      result = result.filter(t => stripDiacritics(t.programOrMux).includes(muxLower));
    }

    if (system && typeof system === 'string' && system !== 'ALL') {
      const sysLower = system.toLowerCase();
      result = result.filter(t => t.system.toLowerCase().includes(sysLower));
    }

    if (q && typeof q === 'string' && q.trim().length > 0) {
      const query = stripDiacritics(q.trim());
      result = result.filter(t => 
        stripDiacritics(t.name).includes(query) ||
        stripDiacritics(t.location).includes(query) ||
        stripDiacritics(t.programOrMux).includes(query) ||
        stripDiacritics(t.broadcaster).includes(query) ||
        t.frequency.toString().includes(query) ||
        (t.channel && t.channel.toLowerCase().includes(query)) ||
        stripDiacritics(t.voivodeship).includes(query) ||
        (t.streamName && stripDiacritics(t.streamName).includes(query)) ||
        (t.channelsList && t.channelsList.some(c => stripDiacritics(c).includes(query)))
      );
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Stats & Metadata for filters
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const counts: Record<string, number> = { tv: 0, fm: 0, dab: 0, am: 0, total: transmitters.length };
    const voivodeships = new Set<string>();
    const muxes = new Set<string>();
    const systems = new Set<string>();

    for (const t of transmitters) {
      counts[t.category] = (counts[t.category] || 0) + 1;
      if (t.voivodeship) voivodeships.add(t.voivodeship);
      if (t.category === 'tv' && t.programOrMux) muxes.add(t.programOrMux);
      if (t.system) systems.add(t.system);
    }

    res.json({
      counts,
      voivodeships: Array.from(voivodeships).sort(),
      tvMultiplexes: Array.from(muxes).sort(),
      systems: Array.from(systems).sort()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Reload data from raw files
app.post('/api/reload', (_req: Request, res: Response) => {
  try {
    const currentConfig = loadConfig();
    transmitters = getOrBuildTransmitterCache(currentConfig, true);
    res.json({ success: true, count: transmitters.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Static assets (HTML, CSS, JS)
const publicDir = path.resolve('./public');
app.use(express.static(publicDir));

// Fallback to index.html for SPA routes
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start listening on configured port and host
const PORT = config.server.port || 9354;
const HOST = config.server.host || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`   Polska - Mapa Nadajników DVB-T/T2 & Radio FM/DAB+/AM`);
  console.log(`   Serwer uruchomiony: http://localhost:${PORT}`);
  console.log(`   Adres sieciowy:     http://${HOST}:${PORT}`);
  console.log(`   Konfiguracja:       config.json`);
  console.log(`=======================================================`);
});
