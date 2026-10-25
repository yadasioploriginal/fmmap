import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { AppConfig, Transmitter } from './types.js';
import { getOrBuildTransmitterCache } from './data-parser.js';

const DEFAULT_CONFIG: AppConfig = {
  server: { port: 9354, host: '0.0.0.0' },
  map: {
    title: 'Polska - Mapa nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM',
    initialCenter: [52.0693, 19.4803],
    initialZoom: 7,
    minZoom: 5,
    maxZoom: 18,
    tileLayer: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    enableClustering: true,
    maxClusterRadius: 50,
    showCoverageOnMarkerClick: false
  },
  filters: {
    defaultVisible: { tv: true, fm: true, dab: true, am: true },
    defaultMinPowerKw: 0
  },
  data: {
    dataPath: './data/transmitters.json',
    rawTvPath: './data_raw/tv/pozwolenia_ntc_r_2026-09-18.csv',
    rawFmPath: './data_raw/radio/pozwolenie_ukf_r_2026-08-27.csv',
    rawDabPath: './data_raw/radio/pozwolenia_dab_r_2026-08-27.csv',
    rawFaleSredniePath: './data_raw/radio/pozwolenia_falesrednie_r_2026-08-27.csv',
    rawFaleDlugiePath: './data_raw/radio/pozwolenia_faledlugie_2026-08-27.csv'
  }
};

function loadConfig(): AppConfig {
  const candidatePaths = [
    path.resolve(process.cwd(), 'config.json'),
    path.resolve(__dirname, '../config.json'),
    path.resolve(__dirname, '../../config.json'),
    path.resolve(__dirname, 'config.json'),
    path.resolve(process.cwd(), 'public/config.json'),
    path.resolve(__dirname, '../public/config.json')
  ];

  for (const configPath of candidatePaths) {
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8')) as AppConfig;
      } catch (err) {
        console.warn(`Error parsing config at ${configPath}:`, err);
      }
    }
  }

  console.warn('Configuration file not found on disk, using built-in default configuration.');
  return DEFAULT_CONFIG;
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

// Station playlist mapping on odsluchane.eu for stations whose ICY streams return static station names
const ODSLUCHANE_STATION_MAP: Record<string, number> = {
  'radio zet': 1,
  'zet': 1,
  'rmf fm': 2,
  'rmf': 2,
  'eska': 3,
  'rmf maxx': 4,
  'rmf max': 4,
  'maxxx': 4,
  'antyradio': 5,
  'rmf classic': 6,
  'classic': 6,
  'radio plus': 8,
  'plus': 8,
  'zlote przeboje': 9,
  'złote przeboje': 9,
  'eska rock': 10,
  'rock radio': 13,
  'mc radio': 15,
  'radio feyma': 19,
  'fama': 19,
  'muzyczne radio': 23,
  'radio kolor': 25,
  'kolor': 25,
  'vox fm': 30,
  'vox': 30,
  'eska2': 31,
  'chillizet': 40,
  'chilli zet': 40,
  'jedynka': 46,
  'program 1': 46,
  'dwojka': 47,
  'dwójka': 47,
  'program 2': 47,
  'trojka': 48,
  'trójka': 48,
  'program 3': 48,
  'czworka': 49,
  'czwórka': 49,
  'meloradio': 51,
  'melo': 51,
  'muzo fm': 65,
  'muzo': 65
};

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanTrackTitle(title: string): string {
  if (!title) return '';
  return decodeHtmlEntities(title)
    .replace(/^\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/, '')
    .replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, '')
    .trim();
}

interface ExternalTrackResult {
  track: string;
  time?: string;
}

async function fetchExternalPlaylistTrack(stationNameOrUrl: string): Promise<ExternalTrackResult | null> {
  const norm = stripDiacritics(stationNameOrUrl).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  let stationId: number | null = null;
  for (const [k, id] of Object.entries(ODSLUCHANE_STATION_MAP)) {
    if (norm.includes(k)) {
      stationId = id;
      break;
    }
  }

  if (!stationId) return null;

  try {
    const res = await fetch(`https://www.odsluchane.eu/szukaj.php?r=${stationId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Odsluchane.eu lists tracks chronologically (ascending), so the last row is the latest/now-playing track
    const re = /<tr>\s*<td>(\d{2}:\d{2})<\/td>[\s\S]*?class="title-link"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    const tracks: { time: string; title: string }[] = [];
    while ((m = re.exec(html)) !== null) {
      const time = m[1].trim();
      const rawTitle = m[2].replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      const title = decodeHtmlEntities(rawTitle);
      if (title && title.length > 3 && title.includes('-')) {
        tracks.push({ time, title });
      }
    }

    if (tracks.length > 0) {
      const latest = tracks[tracks.length - 1];
      return {
        track: latest.title,
        time: latest.time
      };
    }
  } catch {}
  return null;
}

// RDS stream metadata memory cache (cache for 5 seconds to prevent excessive process spawning)
interface RdsCacheItem {
  title: string;
  station?: string;
  bitrate?: string;
  genre?: string;
  trackTime?: string;
  cachedAt: number;
  timeStr: string;
}
const rdsCache = new Map<string, RdsCacheItem>();

function fetchRdsFromStream(url: string, stationHint = '', timeoutMs = 3500): Promise<RdsCacheItem> {
  return new Promise(async (resolve) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // First check external live playlist if station is known (gives real-time song title)
    const lookupName = stationHint || url;
    const liveTrack = await fetchExternalPlaylistTrack(lookupName);
    if (liveTrack) {
      return resolve({
        title: cleanTrackTitle(liveTrack.track),
        station: stationHint || undefined,
        cachedAt: Date.now(),
        timeStr
      });
    }

    if (!url || !url.startsWith('http')) {
      const fallbackTitle = stationHint || 'Emisja programu na żywo';
      return resolve({
        title: cleanTrackTitle(fallbackTitle),
        station: stationHint || undefined,
        cachedAt: Date.now(),
        timeStr
      });
    }

    const cmd = `ffprobe -v quiet -print_format json -show_entries format_tags -show_entries format=bit_rate,format_name "${url}"`;
    exec(cmd, { timeout: timeoutMs }, async (err, stdout) => {
      let tags: Record<string, string> = {};
      let bitrate = '';
      if (!err && stdout) {
        try {
          const data = JSON.parse(stdout);
          tags = data.format?.tags || {};
          bitrate = tags['icy-br'] || (data.format?.bit_rate ? Math.round(data.format.bit_rate / 1000) + ' kbps' : '');
        } catch {}
      }

      let title = tags.StreamTitle || tags.title || '';
      title = cleanTrackTitle(title.replace(/^\uFEFF/, '').trim());
      const station = tags['icy-name'] || tags.service_name || stationHint || '';
      const genre = tags['icy-genre'] || '';

      // If stream title has actual song info (e.g. "Artist - Song")
      if (title && title.includes('-') && title.length > 4) {
        return resolve({
          title,
          station: station.trim() || undefined,
          genre: genre.trim() || undefined,
          bitrate: bitrate.trim() || undefined,
          cachedAt: Date.now(),
          timeStr
        });
      }

      // Check external live playlist again using stream metadata station name
      const secondLookupName = station.trim() || stationHint || url;
      const secondLiveTrack = await fetchExternalPlaylistTrack(secondLookupName);
      if (secondLiveTrack) {
        return resolve({
          title: cleanTrackTitle(secondLiveTrack.track),
          station: station.trim() || stationHint || undefined,
          genre: genre.trim() || undefined,
          bitrate: bitrate.trim() || undefined,
          cachedAt: Date.now(),
          timeStr
        });
      }

      // Fallback to stream title, station name, or live broadcast
      const fallbackTitle = title || station || stationHint || 'Emisja na żywo';
      resolve({
        title: cleanTrackTitle(fallbackTitle),
        station: station.trim() || undefined,
        genre: genre.trim() || undefined,
        bitrate: bitrate.trim() || undefined,
        cachedAt: Date.now(),
        timeStr
      });
    });
  });
}

// API: Health check
app.get(['/api', '/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel' : 'node',
    transmittersCount: transmitters.length,
    timestamp: new Date().toISOString()
  });
});

// API: Get live RDS / ICY metadata for a radio stream
app.get(['/api/rds', '/rds'], async (req: Request, res: Response) => {
  try {
    let streamUrl = (req.query.url as string) || '';
    const stationHint = (req.query.station as string) || '';
    const force = req.query.force === '1';

    if (!streamUrl && !stationHint) {
      return res.status(400).json({ error: 'Brak parametru url lub station' });
    }

    // If streamUrl is empty, attempt to resolve it from transmitters
    if (!streamUrl && stationHint) {
      const match = transmitters.find(t => 
        t.streamUrl && (stripDiacritics(t.programOrMux).includes(stripDiacritics(stationHint)) || 
                       (t.streamName && stripDiacritics(t.streamName).includes(stripDiacritics(stationHint))))
      );
      if (match && match.streamUrl) {
        streamUrl = match.streamUrl;
      }
    }

    const cleanUrl = streamUrl.trim();
    const cacheKey = `${cleanUrl}_${stationHint.trim()}`;
    const cached = rdsCache.get(cacheKey);
    const now = Date.now();

    // Stale-While-Revalidate: Return cached RDS in < 1 ms, update in background if older than 2.5s
    if (!force && cached) {
      if ((now - cached.cachedAt) >= 2500 && !(cached as any)._refreshing) {
        (cached as any)._refreshing = true;
        fetchRdsFromStream(cleanUrl, stationHint.trim())
          .then(newRds => {
            rdsCache.set(cacheKey, newRds);
          })
          .catch(() => {})
          .finally(() => {
            if (cached) (cached as any)._refreshing = false;
          });
      }
      return res.json(cached);
    }

    const rds = await fetchRdsFromStream(cleanUrl, stationHint.trim());
    rdsCache.set(cacheKey, rds);
    res.json(rds);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get current config (safe for frontend)
app.get(['/api/config', '/config'], (_req: Request, res: Response) => {
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
app.get(['/api/geocode', '/geocode'], async (req: Request, res: Response) => {
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
app.get(['/api/radio-streams', '/radio-streams'], (_req: Request, res: Response) => {
  try {
    const candidatePaths = [
      path.resolve('./data/working_radio_streams.json'),
      path.resolve(process.cwd(), 'data/working_radio_streams.json'),
      path.resolve(process.cwd(), 'public/data/working_radio_streams.json'),
      path.resolve(__dirname, '../data/working_radio_streams.json'),
      path.resolve(__dirname, '../../data/working_radio_streams.json'),
      path.resolve(__dirname, '../public/data/working_radio_streams.json')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const streams = JSON.parse(fs.readFileSync(p, 'utf8'));
        return res.json(streams);
      }
    }
    res.json([]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get all broadcasts from the same transmitter site / mast
app.get(['/api/site/:siteId', '/site/:siteId'], (req: Request, res: Response) => {
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
app.get(['/api/transmitters', '/transmitters'], (req: Request, res: Response) => {
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
app.get(['/api/stats', '/stats'], (_req: Request, res: Response) => {
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
app.post(['/api/reload', '/reload'], (_req: Request, res: Response) => {
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

// Start listening on configured port and host (only if not running in serverless Vercel environment)
const PORT = config.server.port || 9354;
const HOST = config.server.host || '0.0.0.0';

if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`   Polska - Mapa Nadajników DVB-T/T2 & Radio FM/DAB+/AM`);
    console.log(`   Serwer uruchomiony: http://localhost:${PORT}`);
    console.log(`   Adres sieciowy:     http://${HOST}:${PORT}`);
    console.log(`   Konfiguracja:       config.json`);
    console.log(`=======================================================`);
  });
}

export default app;
