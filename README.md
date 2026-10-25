# 📡 Polska — Mapa Nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM
## 📡 Poland — DVB-T/DVB-T2 TV & FM / DAB+ / AM Radio Transmitter Map

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Port](https://img.shields.io/badge/Port-9354-orange.svg)](http://localhost:9354)
[![Language: Bilingual](https://img.shields.io/badge/Language-PL%20%7C%20EN-purple.svg)](#-dwujęzyczny-interfejs-pl--en)

---

### 🌐 Wybierz język / Choose language:
- [🇵🇱 Wersja polska (Polish version)](#-wersja-polska)
- [🇬🇧 English version (Wersja angielska)](#-english-version)

---

# 🇵🇱 Wersja polska

Kompletna, interaktywna mapa nadajników naziemnej telewizji cyfrowej (**DVB-T**, **DVB-T2**, **5G Broadcast**) oraz radiofonii (**UKF FM**, cyfrowego **DAB+**, **AM: fale długie i średnie**) na terenie całej Polski, opracowana na podstawie oficjalnego rejestru pozwoleń radiowych **UKE (Urząd Komunikacji Elektronicznej)**.

Aplikacja jest uruchomiona i gotowa do użycia pod adresem:  
👉 **[http://localhost:9354](http://localhost:9354)**

---

## 🌟 Kluczowe funkcjonalności

### 1. 🔍 Szczegółowe dane nadajników (Kto i co nadaje)
- **Kto nadaje**: oficjalny koncesjonariusz / operator radiowy lub telewizyjny (np. *Telewizja Polska S.A.*, *Emitel S.A.*, *Grupa RMF*, *Eurozet*, *Polskie Radio S.A.*, *Grupa Radiowa Time*).
- **Co nadaje**: nazwa stacji lub multipleksu.
- **Pełne składy programowe multipleksów TV**:
  - **MUX 1**: *Eska TV, TTV, Polo TV, Antena HD, TV Trwam, Stopklatka, Fokus TV, Wydarzenia 24*
  - **MUX 2**: *Polsat, TVN, TV4, TV6, TV Puls, Puls 2, Super Polsat, TVN 7*
  - **MUX 3**: *TVP1, TVP2, TVP3 Regionalna, TVP Info, TVP Sport, TVP Historia, TVP ABC, TVP Kultura*
  - **MUX 4**: *Polsat News Polityka (FTA), Polsat Sport 1/2, Eleven Sports, pakiety kodowane Polsat Box*
  - **MUX 6**: *TVP Nauka, TVP Dokument, TVP Kobieta, TVP Rozrywka, TVP Polonia, Alfa TVP, Belsat TV*
  - **MUX 8**: *Nowa TV, Metro, Zoom TV, WP, ViDoc TV, TV Republika, wPolsce24*
  - **MUX-L (Lokalne)**: *TVT Rybnik, TV Dami Radom, TVC Radomsko, Echo24 Wrocław, Stars.TV itp.*
  - **5G Broadcast**: testowe emisje nowej generacji telewizji mobilnej.
- **Wszystkie emisje z danego masztu**: kliknięcie w obiekt wyświetla listę pozostałych nadajników pracujących na tej samej wieży (np. *RTCN Warszawa PKiN*, *Kraków Chorągwica*, *Poznań Śrem*) z możliwością szybkiego przełączania.

### 2. 🚫 Błyskawiczne i elastyczne wyłączanie zasięgów
- Przycisk **`❌ Wyłącz obręb`** w dymku obiektu natychmiast usuwa okrąg zasięgu.
- Kliknięcie bezpośrednio w okrąg na mapie zamyka go jednym kliknięciem.
- Pływający przycisk **`🚫 Wyłącz obręb nadawania (X)`** w prawym górnym rogu mapy czyści wszystkie aktywne okręgi naraz.

### 3. 📐 Realistyczny kalkulator sygnału i zasięgu w lokalizacji
Kliknięcie przycisku **`📐 Oblicz sygnał`** pozwala sprawdzić warunki odbioru dla dowolnego adresu:
- **Dla Miasta lub Gminy** (np. *Radom*, *gmina Piaseczno*):
  - Uśredniona siła sygnału w granicach miejscowości/gminy w procentach (np. *88%*) oraz natężenie pola w $\text{dB}\mu\text{V/m}$.
  - Odległość do centrum gminy.
  - Informacja o przewidywanym odbiorze na antenach pokojowych lub samochodowych.
- **Dla Ulicy / Dokładnego adresu** (np. *Warszawa Marszałkowska 10*, *Kraków Floriańska*):
  - Precyzyjna odległość w linii prostej (z dokładnością do setnych części kilometra).
  - Dokładny kąt **azymutu anteny odbiorczej** (np. *214° SW – skieruj antenę na południowy zachód*).
  - Poziom sygnału w $\text{dBm}$ (np. *-51 dBm*) oraz $\text{dB}\mu\text{V/m}$.
  - Rekomendacja sprzętowa (czy wystarczy antena pokojowa, czy zalecana jest zewnętrzna antena kierunkowa Yagi).
- **Rzeczywisty model propagacji**:
  - Zamiast próżniowego modelu wolnej przestrzeni zastosowano inżynieryjny model strefy zasięgu powiązany z nominalnym promieniem nadajnika $R$ (`estimatedRangeKm`).
  - Przy odległości przekraczającej zasięg ($d > 1.25 \times R$, np. Gdańsk Olivia do Elbląga: 60.6 km vs 45 km nominalnego promienia) kalkulator poprawnie wskazuje **0%** (Brak sygnału / poza zasięgiem) i rysuje czerwoną linię z ikoną ❌ sugerując bliższy obiekt.
- Na mapie rysowana jest przerywana linia pomiarowa i wskaźnik celu 🎯 lub ❌.

### 4. 📻 Odsłuch stacji na żywo ze statusem RDS
- Baza strumieni audio z [github.com/web-radio/webradio](https://github.com/web-radio/webradio).
- **Przetestowane bezgłośnie w tle za pomocą FFmpeg** (`ffmpeg -t 2 -i <stream> -f null -`) – zweryfikowano **38 aktywnych stacji** (m.in. *Jedynka, Dwójka, Trójka, RMF FM, Radio ZET, TOK FM, Złote Przeboje, Radio Pogoda, Rock Radio, RMF Classic, RMF MAXXX, Radio Kaszëbë, rozgłośnie regionalne Polskiego Radia*).
- **Dynamiczne odświeżanie RDS / ICY Metadata**:
  - Backend cyklicznie odczytuje nagłówki ICY StreamTitle z aktywnych serwerów Icecast/Shoutcast lub pobiera aktualną ramówkę API dla stacji publicznych.
  - Odtwarzacz prezentuje aktualnie grany utwór i wykonawcę z pulsującą pigułką RDS na dolnym pasku.
- Stały odtwarzacz audio na dole ekranu z animowanym korektorem (equalizer), regulacją głośności i przyciskiem pauzy.
- Wyszukiwarka i lista stacji online pod przyciskiem **`📻 Odsłuch radia`**.

### 5. 🌐 Dwujęzyczny interfejs (PL / EN)
- Przełącznik języka **`PL`** / **`EN`** w prawym górnym rogu paska nawigacji.
- Pełna translacja w czasie rzeczywistym wszystkich etykiet, dymków na mapie, okien dialogowych, kalkulatora zasięgu, rekomendacji antenowych oraz szuflad bocznych.
- Wybrany język jest automatycznie zapamiętywany w przeglądarce (`localStorage`).

### 6. ⚡ Wyszukiwanie niewrażliwe na znaki diakrytyczne
Wyszukiwarka live oraz filtry działają bez względu na to, czy wpiszesz polskie litery (np. wpisanie `choragwica`, `lodz`, `poznan`, `krakow`, `trojka`, `zlote` natychmiast odnajduje odpowiednie stacje).

---

## 🚀 Szybki start

### Wymagania
- Node.js (wersja 18 lub nowsza)
- npm

### Instalacja i uruchomienie

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/yadasioploriginal/fmmap.git
cd fmmap

# 2. Instalacja zależności
npm.cmd install

# 3. Kompilacja TypeScript
npm.cmd run build

# 4. Uruchomienie aplikacji
npm.cmd start
```

Aplikacja uruchomi się na porcie **9354**: [http://localhost:9354](http://localhost:9354).

### Tryb deweloperski

```bash
npm.cmd run dev
```

### Aktualizacja i ponowne parsowanie danych UKE

```bash
npm.cmd run parse-data
```

---

## ⚙️ Konfiguracja (`config.json`)

Wszystkie parametry serwera i mapy można skonfigurować w pliku [`config.json`](config.json):

```json
{
  "server": {
    "port": 9354,
    "host": "0.0.0.0"
  },
  "map": {
    "title": "Polska - Mapa nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM",
    "initialCenter": [52.0693, 19.4803],
    "initialZoom": 7,
    "minZoom": 5,
    "maxZoom": 18,
    "tileLayer": {
      "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
    },
    "enableClustering": true,
    "maxClusterRadius": 50,
    "showCoverageOnMarkerClick": false
  },
  "filters": {
    "defaultVisible": {
      "tv": true,
      "fm": true,
      "dab": true,
      "am": true
    },
    "defaultMinPowerKw": 0
  }
}
```

---

## 📡 Endpointy API Backendowego

| Metoda | Endpoint | Opis |
|---|---|---|
| `GET` | `/api/config` | Zwraca publiczne parametry konfiguracji mapy |
| `GET` | `/api/transmitters` | Lista nadajników z parametrami filtrowania (`category`, `q`, `voivodeship`, `minPower`, `mux`, `system`) |
| `GET` | `/api/stats` | Statystyki liczbowe podziału na pasma, województwa i MUX-y |
| `GET` | `/api/geocode?q=...` | Geokodowanie miast, gmin i ulic z OpenStreetMap Nominatim |
| `GET` | `/api/rds?url=...` | Odczyt metadanych ICY/RDS na żywo dla aktualnie odtwarzanego strumienia |
| `GET` | `/api/radio-streams` | Lista 38 zweryfikowanych strumieni radiowych online |
| `GET` | `/api/site/:siteId` | Wszystkie stacje nadawane z danego masztu / wieży |
| `POST` | `/api/reload` | Ponowne wczytanie i sparsowanie surowych baz UKE |

---

# 🇬🇧 English Version

Complete, interactive map of digital terrestrial television transmitters (**DVB-T**, **DVB-T2**, **5G Broadcast**) and radio stations (**VHF FM**, digital **DAB+**, and **AM: Longwave and Mediumwave**) across the territory of Poland, compiled directly from the official radio permits database of the **UKE (Office of Electronic Communications)**.

The application is deployed and live locally at:  
👉 **[http://localhost:9354](http://localhost:9354)**

---

## 🌟 Key Features

### 1. 🔍 Detailed Transmitter Information (Broadcaster & Programming)
- **Broadcaster / Operator**: Official licensee (e.g. *Telewizja Polska S.A.*, *Emitel S.A.*, *Grupa RMF*, *Eurozet*, *Polskie Radio S.A.*, *Grupa Radiowa Time*).
- **Broadcast Content**: Station name or multiplex identifier.
- **Complete TV Multiplex Channel Lineups**:
  - **MUX 1**: *Eska TV, TTV, Polo TV, Antena HD, TV Trwam, Stopklatka, Fokus TV, Wydarzenia 24*
  - **MUX 2**: *Polsat, TVN, TV4, TV6, TV Puls, Puls 2, Super Polsat, TVN 7*
  - **MUX 3**: *TVP1, TVP2, TVP3 Regional, TVP Info, TVP Sport, TVP Historia, TVP ABC, TVP Kultura*
  - **MUX 4**: *Polsat News Polityka (FTA), Polsat Sport 1/2, Eleven Sports, encrypted Polsat Box packages*
  - **MUX 6**: *TVP Nauka, TVP Dokument, TVP Kobieta, TVP Rozrywka, TVP Polonia, Alfa TVP, Belsat TV*
  - **MUX 8**: *Nowa TV, Metro, Zoom TV, WP, ViDoc TV, TV Republika, wPolsce24*
  - **MUX-L (Local)**: *TVT Rybnik, TV Dami Radom, TVC Radomsko, Echo24 Wrocław, Stars.TV, etc.*
  - **5G Broadcast**: Experimental next-generation mobile broadcast transmissions.
- **Co-located Mast Broadcasts**: Clicking any site reveals all other radio and TV transmitters installed on that same tower (e.g. *RTCN Warsaw PKiN*, *Cracow Chorągwica*, *Poznań Śrem*) with one-click switching.

### 2. 🚫 Instant and Flexible Coverage Radius Controls
- **`❌ Disable coverage`** button in the marker popup removes the individual coverage circle immediately.
- Clicking directly on any coverage circle on the map instantly dismisses it.
- Floating **`🚫 Disable coverage circle (X)`** button in the top right clears all active coverage circles at once.

### 3. 📐 Advanced Propagation & Signal Calculator
Clicking **`📐 Calculate signal`** tests signal reception conditions for any location in Poland:
- **For Cities, Towns, or Municipalities** (e.g. *Radom*, *gmina Piaseczno*):
  - Area-wide estimated signal percentage (e.g. *88%*) and field strength in $\text{dB}\mu\text{V/m}$.
  - Distance to town center.
  - Practical reception assessment for indoor portable and car antennas.
- **For Exact Street Addresses** (e.g. *Warszawa Marszałkowska 10*, *Kraków Floriańska*):
  - Precise line-of-sight distance (accurate to two decimal places).
  - Exact **antenna azimuth bearing** (e.g. *214° SW – aim antenna towards South-West*).
  - Received signal strength in $\text{dBm}$ (e.g. *-51 dBm*) and $\text{dB}\mu\text{V/m}$.
  - Hardware recommendations (whether a compact indoor rod antenna suffices or an outdoor directional Yagi antenna is required).
- **Realistic Propagation Model**:
  - Instead of unattenuated free-space models, calculation is anchored to the transmitter's engineered coverage contour $R$ (`estimatedRangeKm`).
  - Outside the realistic limit ($d > 1.25 \times R$, such as Gdańsk Olivia to Elbląg: 60.6 km vs 45 km radius), the calculator evaluates to **0%** (Out of range / no signal) and highlights a dashed red line with a ❌ marker, suggesting nearer relay stations.
- A dashed measurement line and reception target pin 🎯 / ❌ are rendered directly onto the Leaflet map.

### 4. 📻 Live Radio Streams with Active RDS / Metadata Ticker
- Audio stream catalog sourced from [github.com/web-radio/webradio](https://github.com/web-radio/webradio).
- **Silently verified in the background using FFmpeg** (`ffmpeg -t 2 -i <stream> -f null -`) – **38 operational streams** confirmed (e.g. *Jedynka, Dwójka, Trójka, RMF FM, Radio ZET, TOK FM, Złote Przeboje, Radio Pogoda, Rock Radio, RMF Classic, RMF MAXXX, Radio Kaszëbë, regional Polskie Radio stations*).
- **Dynamic Real-Time RDS / ICY Metadata**:
  - Express backend polls ICY StreamTitle headers from Icecast/Shoutcast streams or retrieves real-time public radio playlists.
  - The sticky bottom audio player displays the active artist and track name with a pulsing RDS badge.
- Player includes an animated frequency equalizer, volume slider, and play/pause/stop toggles.
- Dedicated drawer and live filter searchable via the **`📻 Radio Streams`** button.

### 5. 🌐 Fully Bilingual User Interface (PL / EN)
- Interactive language toggle **`PL`** / **`EN`** located in the top-right header.
- Instant, non-reloading translation across all topbar buttons, sidebar filters, Leaflet marker popups, propagation calculator, modals, and list drawers.
- The selected language is persisted in the browser via `localStorage`.

### 6. ⚡ Polish Diacritic-Insensitive Search
The instant search input and sidebar filters match diacritic-free terms naturally (e.g. typing `choragwica`, `lodz`, `poznan`, `krakow`, `trojka`, `zlote` immediately discovers the matching stations).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/yadasioploriginal/fmmap.git
cd fmmap

# 2. Install dependencies
npm.cmd install

# 3. Build TypeScript backend
npm.cmd run build

# 4. Start the application
npm.cmd start
```

Access the map at **port 9354**: [http://localhost:9354](http://localhost:9354).

### Development Mode

```bash
npm.cmd run dev
```

### Re-parse UKE Database

```bash
npm.cmd run parse-data
```

---

## ⚙️ Configuration (`config.json`)

All server, map, and filter defaults can be modified via [`config.json`](config.json):

```json
{
  "server": {
    "port": 9354,
    "host": "0.0.0.0"
  },
  "map": {
    "title": "Polska - Mapa nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM",
    "initialCenter": [52.0693, 19.4803],
    "initialZoom": 7,
    "minZoom": 5,
    "maxZoom": 18,
    "tileLayer": {
      "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
    },
    "enableClustering": true,
    "maxClusterRadius": 50,
    "showCoverageOnMarkerClick": false
  },
  "filters": {
    "defaultVisible": {
      "tv": true,
      "fm": true,
      "dab": true,
      "am": true
    },
    "defaultMinPowerKw": 0
  }
}
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/config` | Retrieves public map configuration and defaults |
| `GET` | `/api/transmitters` | Returns transmitter collection with query filters (`category`, `q`, `voivodeship`, `minPower`, `mux`, `system`) |
| `GET` | `/api/stats` | Aggregated statistics per band, voivodeship, and multiplex |
| `GET` | `/api/geocode?q=...` | Geocoding service for Polish towns, municipalities, and streets (OpenStreetMap Nominatim) |
| `GET` | `/api/rds?url=...` | Fetches live ICY/RDS metadata and currently playing track info |
| `GET` | `/api/radio-streams` | Returns verified online radio streaming endpoints |
| `GET` | `/api/site/:siteId` | All broadcasts sharing the same transmitter mast/tower |
| `POST` | `/api/reload` | Re-parses raw UKE registry files on demand |

---

## 🏛️ Project Directory Structure

```
fmmap/
├── config.json              # Main server & map configuration file
├── LICENSE                  # MIT License file
├── package.json             # NPM dependencies, scripts, and engine specs
├── tsconfig.json            # TypeScript configuration
├── README.md                # Bilingual documentation (PL & EN)
├── data/                    # Processed JSON databases
│   ├── transmitters.json    # 2,241 parsed transmitters
│   └── working_radio_streams.json # 38 verified live radio streams
├── data_raw/                # Official raw CSV registries downloaded from UKE
│   ├── radio/               # FM, DAB+, Mediumwave & Longwave permits
│   └── tv/                  # DVB-T / DVB-T2 permits
├── src/                     # TypeScript backend source code
│   ├── data-parser.ts       # UKE database parser & stream matcher
│   ├── server.ts            # Express REST API, RDS fetcher & static server
│   └── types.ts             # TypeScript domain types & interfaces
└── public/                  # Frontend single-page application
    ├── index.html           # Main semantic HTML structure & modals
    ├── style.css            # Dark technical UI stylesheet
    ├── app.js               # Leaflet map, audio player, i18n & calculator logic
    └── vendor/              # Bundled Leaflet & Leaflet.markercluster assets
```

---

## 📜 Licencja / License

This project is licensed under the terms of the **MIT License**.  
Projekt jest objęty licencją **MIT**. See the [LICENSE](LICENSE) file for details.
