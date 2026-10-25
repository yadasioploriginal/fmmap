export type TransmitterCategory = 'tv' | 'fm' | 'dab' | 'am';

export interface Transmitter {
  id: string;
  category: TransmitterCategory;
  categoryLabel: string; // 'Telewizja DVB-T/T2', 'Radio FM', 'Radio DAB+', 'Radio AM'
  system: string; // 'DVB-T2', 'DVB-T', 'FM', 'T-DAB', 'AM'
  name: string; // 'Warszawa PKiN'
  location: string; // 'Plac Defilad 1, Warszawa'
  voivodeship: string; // 'MAZOWIECKIE'
  lat: number;
  lon: number;
  heightAmsl: number; // m n.p.m.
  heightAgl: number; // m n.p.t.
  polarization: 'H' | 'V' | string;
  radiationPattern: 'ND' | 'D' | string; // ND = dookólna, D = kierunkowa
  powerKw: number;
  powerDbw: number;
  frequency: number; // in MHz for TV/FM/DAB, in kHz for AM
  frequencyUnit: 'MHz' | 'kHz';
  channel?: string | null; // e.g. '37', '8D'
  bandwidthMhz?: number | null;
  programOrMux: string; // 'MUX1', 'RMF FM', 'Polskie Radio Program 1'
  broadcaster: string; // 'Emitel S.A.', 'Polskie Radio'
  status: string; // 'Pozwolenie', 'Eksperymentalnie'
  permitNumber?: string;
  validTo?: string;
  estimatedRangeKm: number; // calculated empirical range
  streamUrl?: string | null; // Verified live radio stream URL
  streamName?: string | null;
  channelsList?: string[]; // TV channels in multiplex
  siteId?: string; // Grouping by geographical mast site
}

export interface RadioStream {
  id: number;
  name: string;
  originalUrl: string;
  streamUrl: string;
  working: boolean;
  source: string;
}

export interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  map: {
    title: string;
    initialCenter: [number, number];
    initialZoom: number;
    minZoom: number;
    maxZoom: number;
    tileLayer: {
      url: string;
      attribution: string;
    };
    enableClustering: boolean;
    maxClusterRadius: number;
    showCoverageOnMarkerClick: boolean;
  };
  filters: {
    defaultVisible: {
      tv: boolean;
      fm: boolean;
      dab: boolean;
      am: boolean;
    };
    defaultMinPowerKw: number;
  };
  data: {
    dataPath: string;
    rawTvPath: string;
    rawFmPath: string;
    rawDabPath: string;
    rawFaleSredniePath: string;
    rawFaleDlugiePath: string;
    streamsPath?: string;
  };
}
