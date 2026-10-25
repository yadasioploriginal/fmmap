import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import { parse } from 'csv-parse/sync';
import { Transmitter, AppConfig, RadioStream } from './types.js';

export const TV_MULTIPLEX_CHANNELS: Record<string, string[]> = {
  'MUX1': ['Eska TV', 'TTV', 'Polo TV', 'Antena HD', 'TV Trwam', 'Stopklatka', 'Fokus TV', 'Wydarzenia 24'],
  'MUX2': ['Polsat', 'TVN', 'TV4', 'TV6', 'TV Puls', 'Puls 2', 'Super Polsat', 'TVN 7'],
  'MUX3': ['TVP1', 'TVP2', 'TVP3 (Regionalna)', 'TVP Info', 'TVP Sport', 'TVP Historia', 'TVP ABC', 'TVP Kultura'],
  'MUX4': ['Polsat News Polityka (FTA)', 'Polsat Sport 1', 'Polsat Sport 2', 'Eleven Sports 1', 'Eleven Sports 2', 'Kanały kodowane Polsat Box'],
  'MUX6': ['TVP Nauka', 'TVP Dokument', 'TVP Kobieta', 'TVP Rozrywka', 'TVP Polonia', 'Alfa TVP', 'Belsat TV'],
  'MUX8': ['Nowa TV', 'Metro', 'Zoom TV', 'WP', 'ViDoc TV', 'TV Republika', 'wPolsce24'],
  'MUXL1': ['TVT Rybnik', 'Stars.TV', 'TV Okazje', 'Lokalne pasmo informacyjne'],
  'MUXL2': ['TVT Rybnik', 'Stars.TV', 'TV Okazje', 'Lokalne pasmo Rybnik/Śląsk'],
  'MUXL3': ['TVC Radomsko', 'Stars.TV', 'Power TV', 'Nuta Gold', 'Szlagier TV'],
  'MUXL4': ['Echo24 Wrocław', 'Stars.TV', 'Power TV', 'Nuta Gold', 'TVC'],
  'MUXL7': ['TV Regionalna Lubin/Głogów', 'Stars.TV', 'TV Okazje'],
  '5G Broadcast': ['TVP1 HD (5G Test)', 'TVP Info HD (5G Test)', 'TVP Sport HD (5G Test)']
};

function getTvChannels(muxName: string): string[] {
  if (!muxName) return [];
  const cleanMux = muxName.replace(/\s+/g, '').toUpperCase();
  for (const [key, channels] of Object.entries(TV_MULTIPLEX_CHANNELS)) {
    if (cleanMux.includes(key.replace(/\s+/g, '').toUpperCase())) {
      return channels;
    }
  }
  return [];
}

function loadVerifiedRadioStreams(): RadioStream[] {
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
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8')) as RadioStream[];
      } catch {}
    }
  }
  return [];
}

function normalizeText(str: string): string {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchRadioStream(prog: string, broadcaster: string, streams: RadioStream[]): RadioStream | null {
  const p = normalizeText(prog);
  const b = normalizeText(broadcaster);
  const full = `${p} ${b}`;

  for (const s of streams) {
    const sName = s.name;
    if (sName === 'Jedynka' && (/\b(program 1|jedynka|pr 1|pr1)\b/.test(p) || p === 'program i')) return s;
    if (sName === 'Dwójka' && (/\b(program 2|dwójka|pr 2|pr2)\b/.test(p) || p === 'program ii')) return s;
    if (sName === 'Trójka' && (/\b(program 3|trójka|pr 3|pr3)\b/.test(p) || p === 'program iii')) return s;
    if (sName === 'RMF FM' && (p.includes('rmf fm') || (p === 'rmf' && !p.includes('maxxx') && !p.includes('classic')))) return s;
    if (sName === 'RMF MAXXX' && (p.includes('maxxx') || p.includes('max'))) return s;
    if (sName === 'RMF Classic' && p.includes('classic')) return s;
    if (sName === 'Radio ZET' && (p.includes('zet') && !p.includes('chill') && !p.includes('gold'))) return s;
    if (sName === 'Radio Tok FM' && /\btok\b/.test(p)) return s;
    if (sName === 'Radio Złote Przeboje' && p.includes('złote przeboje')) return s;
    if (sName === 'Radio Pogoda' && p.includes('pogoda')) return s;
    if (sName === 'Rock Radio' && p.includes('rock radio')) return s;
    if (sName === 'Radio Kaszebe' && (p.includes('kaszeb') || p.includes('kaszebe'))) return s;
    if (sName === 'Radio 90 FM' && /\b90\b/.test(p)) return s;
    if (sName === 'Radio Parada' && p.includes('parada')) return s;
    if (sName === 'Radio Elka' && p.includes('elka')) return s;
    if (sName === 'Radio Victoria' && p.includes('victoria')) return s;
    if (sName === 'Radio Doxa' && p.includes('doxa')) return s;
    if (sName === 'Radio Emaus' && p.includes('emaus')) return s;
    if (sName === 'Radio Fara' && p.includes('fara')) return s;
    if (sName === 'Radio Fama Kielce' && p.includes('fama')) return s;
    if (sName === 'Wasze Radio FM' && p.includes('wasze radio')) return s;
    if (sName === 'Krdp FM' && (p.includes('krdp') || p.includes('płockiej'))) return s;
    if (sName === 'Radio Rodzina' && p.includes('rodzina')) return s;
    if (sName === 'Radio eM' && /\b(em|radio em)\b/.test(p)) return s;
    if (sName === 'KRP Katolickie Radio Podlasie' && p.includes('podlasie')) return s;
    if (sName === 'VIA - Katolickie Radio Rzeszów' && (p.includes('via') || (p.includes('rzesz') && !p.includes('polskie')))) return s;
    if (sName === 'Radio Niepokalanów' && p.includes('niepokalan')) return s;
    if (sName === 'PR Kraków' && p.includes('kraków')) return s;
    if (sName === 'PR Poznań' && p.includes('poznań')) return s;
    if (sName === 'PR Katowice' && p.includes('katowice')) return s;
    if (sName === 'PR Opole' && p.includes('opole')) return s;
    if (sName === 'PR Zachód' && p.includes('zachód')) return s;
    if (sName === 'PR Szczecin' && p.includes('szczecin')) return s;
    if (sName === 'PR Białystok' && p.includes('białystok')) return s;
    if (sName === 'PR Pomorza i Kujaw' && (p.includes('pomorza i kujaw') || p.includes('pik'))) return s;
    if (sName === 'Białoruskie radio racja' && p.includes('racja')) return s;
  }
  return null;
}

export function parseCoord(str: any): number | null {
  if (!str) return null;
  const s = String(str).replace(/["'\s]/g, '').trim();
  if (!s) return null;

  // Form: 15E40'59 or 52N13'54 or 53E01'11 or 210022
  const m = s.match(/^(\d{2})[A-Za-z]?(\d{2})['m]?(\d{2})?/);
  if (m) {
    const deg = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const sec = parseInt(m[3] || '0', 10);
    const val = deg + min / 60 + sec / 3600;
    return Number(val.toFixed(6));
  }

  const num = parseFloat(s.replace(',', '.'));
  if (!isNaN(num) && num > 10 && num < 60) {
    return Number(num.toFixed(6));
  }

  return null;
}

export function parseNum(str: any): number {
  if (!str) return 0;
  const cleaned = String(str).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function cleanText(str: any): string {
  if (!str) return '';
  return String(str).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function readCsv(filePath: string, defaultEncoding = 'windows-1250'): string[][] {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`File not found: ${resolved}`);
    return [];
  }

  const buf = fs.readFileSync(resolved);
  let enc = defaultEncoding;

  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    enc = 'utf8';
  } else {
    try {
      const u = buf.toString('utf8');
      if (!u.includes('\uFFFD') && (u.includes('Pozwolenie') || u.includes('Status'))) {
        enc = 'utf8';
      }
    } catch {}
  }

  const text = iconv.decode(buf, enc);
  return parse(text, {
    delimiter: ';',
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  });
}

function estimateRangeKm(
  category: string,
  powerKw: number,
  hAmsl: number,
  hAgl: number
): number {
  if (category === 'am') {
    if (powerKw >= 500) return 450; // Long wave (Solec Kujawski)
    return Math.max(15, Math.round(25 * Math.sqrt(Math.max(0.1, powerKw))));
  }

  const hEffective = Math.max(15, hAgl + Math.max(0, (hAmsl - 120) * 0.3));
  const p = Math.max(0.01, powerKw);
  const factor = category === 'tv' ? 3.4 : category === 'dab' ? 3.3 : 3.6;
  const km = factor * Math.sqrt(hEffective) * Math.pow(p, 0.17);
  return Math.min(140, Math.max(5, Math.round(km)));
}

export function parseAllTransmitters(config: AppConfig): Transmitter[] {
  const transmitters: Transmitter[] = [];
  const verifiedStreams = loadVerifiedRadioStreams();
  console.log(`Loaded ${verifiedStreams.length} verified radio streams for audio player attachment.`);

  // 1. TV Transmitters (DVB-T / DVB-T2 / 5G Broadcast)
  if (config.data.rawTvPath) {
    const tvRows = readCsv(config.data.rawTvPath);
    for (let i = 1; i < tvRows.length; i++) {
      const r = tvRows[i];
      if (!r || r.length < 25) continue;

      const lon = parseCoord(r[20]);
      const lat = parseCoord(r[21]);
      if (!lat || !lon) continue;

      const status = cleanText(r[1]);
      const permitNumber = cleanText(r[2]);
      const validTo = cleanText(r[5]);
      const applicant = cleanText(r[6]);
      const mux = cleanText(r[7]);
      const channel = cleanText(r[8]);
      const freq = parseNum(r[9]);
      const bandwidth = parseNum(r[10]);
      const name = cleanText(r[11]);
      const location = cleanText(r[12]);
      const voivodeship = cleanText(r[13]).toUpperCase();
      const hAmsl = parseNum(r[22]);
      const hAgl = parseNum(r[23]);
      const pol = cleanText(r[24]).toUpperCase() || 'H';
      const system = cleanText(r[25]) || 'DVB-T2';
      const powerDbw = parseNum(r[26]);
      const powerKw = parseNum(r[27]);
      const pattern = cleanText(r[28]) || 'ND';

      const channelsList = getTvChannels(mux);
      const siteId = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

      transmitters.push({
        id: `tv_${i}`,
        category: 'tv',
        categoryLabel: 'Telewizja DVB-T/T2',
        system,
        name: name || 'Nadajnik TV',
        location,
        voivodeship,
        lat,
        lon,
        heightAmsl: hAmsl,
        heightAgl: hAgl,
        polarization: pol,
        radiationPattern: pattern,
        powerKw,
        powerDbw,
        frequency: freq,
        frequencyUnit: 'MHz',
        channel: channel || null,
        bandwidthMhz: bandwidth || 8,
        programOrMux: mux || 'MUX',
        broadcaster: applicant || 'Emitel S.A.',
        status: status || 'Pozwolenie',
        permitNumber,
        validTo,
        estimatedRangeKm: estimateRangeKm('tv', powerKw, hAmsl, hAgl),
        channelsList,
        siteId
      });
    }
  }

  // 2. FM Transmitters (UKF-FM)
  if (config.data.rawFmPath) {
    const fmRows = readCsv(config.data.rawFmPath);
    for (let i = 1; i < fmRows.length; i++) {
      const r = fmRows[i];
      if (!r || r.length < 35) continue;

      const lon = parseCoord(r[28]);
      const lat = parseCoord(r[29]);
      if (!lat || !lon) continue;

      const status = cleanText(r[1]);
      const permitNumber = cleanText(r[2]);
      const validTo = cleanText(r[5]);
      const applicant = cleanText(r[7]);
      const broadcaster = cleanText(r[8]) || applicant;
      const program = cleanText(r[9]);
      const freq = parseNum(r[13]);
      const name = cleanText(r[14]);
      const location = cleanText(r[15]);
      const voivodeship = cleanText(r[16]).toUpperCase();
      const hAmsl = parseNum(r[31]);
      const hAgl = parseNum(r[32]);
      const pol = cleanText(r[33]).toUpperCase() || 'V';
      const system = 'FM';
      const powerDbw = parseNum(r[35]);
      const powerKw = parseNum(r[36]);
      const pattern = cleanText(r[38]) || 'ND';

      const matchedStream = matchRadioStream(program, broadcaster, verifiedStreams);
      const siteId = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

      transmitters.push({
        id: `fm_${i}`,
        category: 'fm',
        categoryLabel: 'Radio FM',
        system,
        name: name || 'Nadajnik FM',
        location,
        voivodeship,
        lat,
        lon,
        heightAmsl: hAmsl,
        heightAgl: hAgl,
        polarization: pol,
        radiationPattern: pattern,
        powerKw,
        powerDbw,
        frequency: freq,
        frequencyUnit: 'MHz',
        channel: null,
        programOrMux: program || 'Radio',
        broadcaster: broadcaster || 'Nadawca',
        status: status || 'Pozwolenie',
        permitNumber,
        validTo,
        estimatedRangeKm: estimateRangeKm('fm', powerKw, hAmsl, hAgl),
        streamUrl: matchedStream ? matchedStream.streamUrl : null,
        streamName: matchedStream ? matchedStream.name : null,
        siteId
      });
    }
  }

  // 3. DAB+ Transmitters
  if (config.data.rawDabPath) {
    const dabRows = readCsv(config.data.rawDabPath);
    for (let i = 1; i < dabRows.length; i++) {
      const r = dabRows[i];
      if (!r || r.length < 25) continue;

      const lon = parseCoord(r[20]);
      const lat = parseCoord(r[21]);
      if (!lat || !lon) continue;

      const status = cleanText(r[1]);
      const permitNumber = cleanText(r[2]);
      const validTo = cleanText(r[5]);
      const applicant = cleanText(r[6]);
      const mux = cleanText(r[7]);
      const channel = cleanText(r[8]);
      const freq = parseNum(r[9]);
      const bandwidth = parseNum(r[10]);
      const name = cleanText(r[11]);
      const location = cleanText(r[12]);
      const voivodeship = cleanText(r[13]).toUpperCase();
      const hAmsl = parseNum(r[22]);
      const hAgl = parseNum(r[23]);
      const pol = cleanText(r[24]).toUpperCase() || 'V';
      const system = cleanText(r[25]) || 'T-DAB';
      const powerDbw = parseNum(r[26]);
      const powerKw = parseNum(r[27]);
      const pattern = cleanText(r[28]) || 'ND';

      const matchedStream = matchRadioStream(mux, applicant, verifiedStreams);
      const siteId = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

      transmitters.push({
        id: `dab_${i}`,
        category: 'dab',
        categoryLabel: 'Radio cyfrowe DAB+',
        system: 'DAB+',
        name: name || 'Nadajnik DAB+',
        location,
        voivodeship,
        lat,
        lon,
        heightAmsl: hAmsl,
        heightAgl: hAgl,
        polarization: pol,
        radiationPattern: pattern,
        powerKw,
        powerDbw,
        frequency: freq,
        frequencyUnit: 'MHz',
        channel: channel || null,
        bandwidthMhz: bandwidth || 1.536,
        programOrMux: mux || 'DAB+ MUX',
        broadcaster: applicant || 'Polskie Radio',
        status: status || 'Pozwolenie',
        permitNumber,
        validTo,
        estimatedRangeKm: estimateRangeKm('dab', powerKw, hAmsl, hAgl),
        streamUrl: matchedStream ? matchedStream.streamUrl : null,
        streamName: matchedStream ? matchedStream.name : null,
        siteId
      });
    }
  }

  // 4. AM Medium Wave (MW)
  if (config.data.rawFaleSredniePath) {
    const amMwRows = readCsv(config.data.rawFaleSredniePath);
    for (let i = 1; i < amMwRows.length; i++) {
      const r = amMwRows[i];
      if (!r || r.length < 30) continue;

      const lon = parseCoord(r[28]);
      const lat = parseCoord(r[29]);
      if (!lat || !lon) continue;

      const status = cleanText(r[1]);
      const permitNumber = cleanText(r[2]);
      const validTo = cleanText(r[5]);
      const applicant = cleanText(r[7]);
      const broadcaster = cleanText(r[8]) || applicant;
      const program = cleanText(r[9]);
      const freq = parseNum(r[13]);
      const name = cleanText(r[14]);
      const location = cleanText(r[15]);
      const voivodeship = cleanText(r[16]).toUpperCase();
      const hAmsl = parseNum(r[31]);
      const hAgl = parseNum(r[32]);
      const pol = cleanText(r[33]).toUpperCase() || 'V';
      const powerDbw = parseNum(r[35]);
      const powerKw = parseNum(r[36]);
      const pattern = cleanText(r[38]) || 'ND';
      const siteId = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

      transmitters.push({
        id: `am_mw_${i}`,
        category: 'am',
        categoryLabel: 'Radio AM (Fale Średnie)',
        system: 'AM (MW)',
        name: name || 'Nadajnik AM MW',
        location,
        voivodeship,
        lat,
        lon,
        heightAmsl: hAmsl,
        heightAgl: hAgl,
        polarization: pol,
        radiationPattern: pattern,
        powerKw,
        powerDbw,
        frequency: freq,
        frequencyUnit: 'kHz',
        channel: null,
        programOrMux: program || 'Radio AM',
        broadcaster: broadcaster || 'Nadawca',
        status: status || 'Pozwolenie',
        permitNumber,
        validTo,
        estimatedRangeKm: estimateRangeKm('am', powerKw, hAmsl, hAgl),
        siteId
      });
    }
  }

  // 5. AM Long Wave (LW - Solec Kujawski)
  if (config.data.rawFaleDlugiePath) {
    const amLwRows = readCsv(config.data.rawFaleDlugiePath);
    for (let i = 1; i < amLwRows.length; i++) {
      const r = amLwRows[i];
      if (!r || !r[1] || r[1].trim() === '') continue;

      const lon = parseCoord(r[18]);
      const lat = parseCoord(r[19]);
      if (!lat || !lon) continue;

      const status = cleanText(r[1]);
      const permitNumber = cleanText(r[2]);
      const validTo = cleanText(r[5]);
      const applicant = cleanText(r[6]);
      const broadcaster = cleanText(r[7]) || applicant;
      const program = cleanText(r[8]);
      const freq = parseNum(r[9]);
      const name = cleanText(r[10]);
      const location = cleanText(r[11]);
      const voivodeship = cleanText(r[12]).toUpperCase();
      const hAmsl = parseNum(r[22]);
      const hAgl = parseNum(r[24]);
      const pol = cleanText(r[26]).toUpperCase() || 'V';
      const powerKw = parseNum(r[28]);
      const pattern = cleanText(r[29]) || 'ND';

      const matchedStream = matchRadioStream('Jedynka', 'Polskie Radio', verifiedStreams);
      const siteId = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

      transmitters.push({
        id: `am_lw_${i}`,
        category: 'am',
        categoryLabel: 'Radio AM (Fale Długie)',
        system: 'AM (LW)',
        name: name || 'Radiowe Centrum Nadawcze Solec Kujawski',
        location,
        voivodeship,
        lat,
        lon,
        heightAmsl: hAmsl,
        heightAgl: hAgl,
        polarization: pol,
        radiationPattern: pattern,
        powerKw: powerKw || 1000,
        powerDbw: 60,
        frequency: freq || 225,
        frequencyUnit: 'kHz',
        channel: null,
        programOrMux: program || 'Polskie Radio Program 1',
        broadcaster: broadcaster || 'Polskie Radio S.A.',
        status: status || 'Pozwolenie',
        permitNumber,
        validTo,
        estimatedRangeKm: 450,
        streamUrl: matchedStream ? matchedStream.streamUrl : null,
        streamName: 'Jedynka (Polskie Radio)',
        siteId
      });
    }
  }

  return transmitters;
}

export function getOrBuildTransmitterCache(config: AppConfig, forceRebuild = false): Transmitter[] {
  const candidatePaths = [
    path.resolve(config.data.dataPath),
    path.resolve(process.cwd(), 'data/transmitters.json'),
    path.resolve(process.cwd(), 'public/data/transmitters.json'),
    path.resolve(__dirname, '../data/transmitters.json'),
    path.resolve(__dirname, '../../data/transmitters.json'),
    path.resolve(__dirname, 'transmitters.json'),
    path.resolve(__dirname, '../public/data/transmitters.json')
  ];

  if (!forceRebuild) {
    for (const jsonPath of candidatePaths) {
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          const data = JSON.parse(raw) as Transmitter[];
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Loaded ${data.length} transmitters from ${jsonPath}`);
            return data;
          }
        } catch (e) {
          console.warn(`Failed reading transmitters from ${jsonPath}:`, e);
        }
      }
    }
  }

  // When running in serverless / read-only Vercel environment, never attempt rebuilding from raw CSVs
  if (process.env.VERCEL) {
    console.warn('Running on Vercel: prebuilt transmitters.json not found in paths.');
    return [];
  }

  console.log('Parsing raw UKE transmitter data and attaching streams & channels...');
  try {
    const data = parseAllTransmitters(config);
    const jsonPath = path.resolve(config.data.dataPath);
    const dataDir = path.dirname(jsonPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved ${data.length} parsed transmitters to ${jsonPath}`);
    return data;
  } catch (err) {
    console.error('Failed to parse transmitters:', err);
    return [];
  }
}

if (process.argv[1] && process.argv[1].endsWith('data-parser.ts')) {
  const configRaw = fs.readFileSync('./config.json', 'utf8');
  const config = JSON.parse(configRaw) as AppConfig;
  const list = getOrBuildTransmitterCache(config, true);
  console.log(`Done! Total transmitters: ${list.length}`);
}
