# 📡 Polska — Mapa Nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM
## 📡 Poland — DVB-T/DVB-T2 TV & FM / DAB+ / AM Radio Transmitter Map

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Port](https://img.shields.io/badge/Port-9354-orange.svg)](http://localhost:9354)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](#-jak-wdrożyć-aplikację-na-vercel)
[![Language: Bilingual](https://img.shields.io/badge/Language-PL%20%7C%20EN-purple.svg)](#-dwujęzyczny-interfejs-pl--en)

---

### 🌐 Wybierz język / Choose language:
- [🇵🇱 Wersja polska (Polish version)](#-wersja-polska)
  - [🌟 Kluczowe funkcjonalności](#-kluczowe-funkcjonalności)
  - [📐 Inteligentne dymki niezasłaniające nadajników](#2--inteligentne-dymki-i-dolny-panel-niezasłaniający-kropek)
  - [📱 Responsywność (PC, Tablety, Smartfony)](#6--pełna-responsywność-pc-tablety-i-telefony)
  - [🚀 Szybki start lokalny](#-szybki-start)
  - [☁️ Tutorial: Wdrożenie na Vercel](#️-jak-wdrożyć-aplikację-na-vercel)
  - [⚙️ Konfiguracja (config.json)](#️-konfiguracja-configjson)
  - [📡 Endpointy API](#-endpointy-api-backendowego)
- [🇬🇧 English version (Wersja angielska)](#-english-version)
  - [🌟 Key Features](#-key-features)
  - [📐 Smart Non-Obscuring Popups & Bottom Sheet](#2--smart-non-obscuring-popups--bottom-sheet)
  - [📱 Full Responsiveness (PC, Tablets, Mobile)](#6--multi-device-responsiveness-pc-tablets-smartphones)
  - [🚀 Quick Start Guide](#-quick-start-guide)
  - [☁️ Tutorial: Deploying to Vercel](#️-how-to-deploy-to-vercel)
  - [⚙️ Configuration (config.json)](#️-configuration-configjson)
  - [📡 REST API Endpoints](#-rest-api-endpoints)

---

# 🇵🇱 Wersja polska

Kompletna, interaktywna mapa nadajników naziemnej telewizji cyfrowej (**DVB-T**, **DVB-T2**, **5G Broadcast**) oraz radiofonii (**UKF FM**, cyfrowego **DAB+**, **AM: fale długie i średnie**) na terenie całej Polski, opracowana na podstawie oficjalnego rejestru pozwoleń radiowych **UKE (Urząd Komunikacji Elektronicznej)**.

Aplikacja jest uruchomiona i gotowa do użycia pod adresem:  
👉 **[http://localhost:9354](http://localhost:9354)**

---

## 🌟 Kluczowe funkcjonalności

### 1. 🔍 Szczegółowe dane nadajników (Kto i co nadaje)
- **Kto nadaje**: oficjalny koncesjonariusz / operator radiowy lub telewizyjny (np. *Telewizja Polska S.A.*, *Emitel S.A.*, *Grupa RMF*, *Eurozet*, *Polskie Radio S.A.*, *Grupa Radiowa Time*).
- **Co nadaje**: nazwa stacji lub multipleksu wraz z oficjalnym logotypem stacji.
- **Pełne składy programowe multipleksów TV**:
  - **MUX 1**: *Eska TV, TTV, Polo TV, Antena HD, TV Trwam, Stopklatka, Fokus TV, Wydarzenia 24*
  - **MUX 2**: *Polsat, TVN, TV4, TV6, TV Puls, Puls 2, Super Polsat, TVN 7*
  - **MUX 3**: *TVP1, TVP2, TVP3 Regionalna, TVP Info, TVP Sport, TVP Historia, TVP ABC, TVP Kultura*
  - **MUX 4**: *Polsat News Polityka (FTA), Polsat Sport 1/2, Eleven Sports, pakiety kodowane Polsat Box*
  - **MUX 6**: *TVP Nauka, TVP Dokument, TVP Kobieta, TVP Rozrywka, TVP Polonia, Alfa TVP, Belsat TV*
  - **MUX 8**: *Nowa TV, Metro, Zoom TV, WP, ViDoc TV, TV Republika, wPolsce24*
  - **MUX-L (Lokalne)**: *TVT Rybnik, TV Dami Radom, TVC Radomsko, Echo24 Wrocław, Stars.TV itp.*
  - **5G Broadcast**: testowe emisje nowej generacji telewizji mobilnej.

### 2. 🎯 Inteligentne dymki i dolny panel niezasłaniający kropek
- **Koniec z zasłanianiem nadajników**:
  - Gdy maszt ma wiele nadajników (rozstrzelonych w okręgu spiderfied), kliknięcie w kropkę w dolnej części otwiera dymek **W DÓŁ** (pod kropką), a w górnej części **W GÓRĘ** (nad kropką). Wszystkie pozostałe kropki w klastrze pozostają w 100% odsłonięte i klikalne!
  - **Szybkie kafelki w dymku (`Inne z tego masztu`)**: przełączaj się między wszystkimi emisjami z danej wieży jednym kliknięciem bez zamykania dymku.
  - **Przycisk przypięcia `📌`**: jednym kliknięciem przenieś szczegóły do dolnego panelu, aby uwolnić całą mapę.

### 3. 📐 Realistyczny kalkulator sygnału i zasięgu w lokalizacji
Kliknięcie przycisku **`📐 Oblicz sygnał`** pozwala sprawdzić warunki odbioru dla dowolnego adresu:
- **Dla Miasta lub Gminy** (np. *Radom*, *gmina Piaseczno*): uśredniona siła sygnału w procentach (np. *88%*) oraz natężenie pola w $\text{dB}\mu\text{V/m}$.
- **Dla Ulicy / Dokładnego adresu** (np. *Warszawa Marszałkowska 10*): precyzyjna odległość w km, kąt **azymutu anteny odbiorczej** (np. *214° SW*), poziom sygnału w $\text{dBm}$ i $\text{dB}\mu\text{V/m}$ oraz rekomendacja anteny (pokojowa / kierunkowa Yagi).
- **Rzeczywisty model propagacji**: odległość $d > 1.25 \times R$ (np. Gdańsk Olivia do Elbląga) wskazuje **0%** (Brak sygnału / poza zasięgiem) z czerwoną linią pomiarową i wskaźnikiem ❌.

### 4. 📻 Odsłuch na żywo z logotypami i natychmiastowym RDS
- Baza 38 aktywnych strumieni audio przetestowanych w tle przez FFmpeg.
- **Logotypy stacji w odtwarzaczu**: dolny pasek odtwarzacza prezentuje autentyczne logo stacji zamiast pseudo-wizualizera.
- **Odświeżanie RDS w czasie rzeczywistym (< 1 ms w cache Stale-While-Revalidate)**:
  - Czysty tytuł i wykonawca bez zbędnych godzin czy timestampów.
  - **Sygnalizacja zmiany utworu**: gdy utwór się zmienia, pigułka RDS rozbłyska neonowym światłem (`.rds-pill-changed`), tekst płynnie przeskakuje, a na ekranie pojawia się powiadomienie `🎵 Teraz w ...`.

### 5. 🚫 Błyskawiczne i elastyczne wyłączanie zasięgów
- Przycisk **`❌ Wyłącz obręb`** w dymku obiektu natychmiast usuwa okrąg zasięgu.
- Kliknięcie bezpośrednio w okrąg na mapie zamyka go jednym kliknięciem.
- Pływający przycisk **`🚫 Wyłącz obręb nadawania (X)`** czyści wszystkie aktywne okręgi naraz.

### 6. 📱 Pełna responsywność (PC, Tablety i Telefony)
- **Komputery stacjonarne i monitory ultrawide**: pełny układ z panelem bocznym, paskiem stacji i dymkami kierunkowymi.
- **Tablety (iPad / Android)**: zwijany pasek boczny z tłem blur, przewijana poziomo wstążka kategorii.
- **Smartfony (iPhone / Android)**:
  - Specjalny, bezkolizyjny **Bottom Sheet** wysuwający się od dołu – mapa i wszystkie kropki na górze są w 100% wolne i czytelne.
  - Kompaktowy odtwarzacz audio z bezpiecznymi marginesami (`safe-area-inset`).
  - Dotykowy interfejs (minimum 44x44px celów dotykowych).

---

## 🚀 Szybki start

### Wymagania
- Node.js (wersja 18 lub nowsza)
- npm

### Instalacja i uruchomienie lokalne

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/yadasioploriginal/fmmap.git
cd fmmap

# 2. Instalacja zależności
npm install

# 3. Kompilacja TypeScript
npm run build

# 4. Uruchomienie aplikacji
npm start
```

Aplikacja uruchomi się na porcie **9354**: [http://localhost:9354](http://localhost:9354).

---

## ☁️ Jak wdrożyć aplikację na Vercel

Projekt posiada gotową konfigurację [`vercel.json`](vercel.json) oraz bezserwerowy entrypoint [`api/index.ts`](api/index.ts). Możesz wdrożyć go na darmowy hosting Vercel w mniej niż 2 minuty!

### Sposób 1: Wdrożenie przez stronę Vercel (Najprostszy - 1 kliknięcie)
1. Załóż darmowe konto na [vercel.com](https://vercel.com) (jeśli jeszcze nie masz).
2. Na pulpicie Vercel kliknij przycisk **"Add New..."** ➔ **"Project"**.
3. Połącz swoje konto GitHub i wybierz repozytorium **`fmmap`** (lub `yadasioploriginal/fmmap`).
4. Vercel automatycznie wykryje plik `vercel.json` oraz skrypt budowania `npm run build`.
5. Kliknij **"Deploy"**.
6. Po około 60 sekundach Twoja mapa będzie dostępna publicznie pod adresem `https://twoja-nazwa.vercel.app`! 🎉

### Sposób 2: Wdrożenie przez Vercel CLI (z terminala)
```bash
# 1. Zainstaluj Vercel CLI globalnie
npm install -g vercel

# 2. Zaloguj się na swoje konto Vercel
vercel login

# 3. Wdróż projekt do środowiska produkcyjnego
vercel --prod
```

### Jak działa architektura na Vercel?
- **Frontend statyczny (`public/`)**: serwowany przez globalny CDN Vercel Edge z superszybkim czasem ładowania na całym świecie.
- **API i Backend (`src/server.ts`)**: działa jako Vercel Serverless Function Node.js obsługująca `/api/*` (geokodowanie, kalkulator zasięgów, live RDS, lista nadajników).
- Bazy danych JSON (`data/transmitters.json`) są wkompilowane bezpośrednio w projekt – **nie jest wymagana żadna zewnętrzna baza SQL ani Redis**.

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
| `GET` | `/api/transmitters` | Lista nadajników z filtrowaniem (`category`, `q`, `voivodeship`, `minPower`, `mux`, `system`) |
| `GET` | `/api/stats` | Statystyki liczbowe podziału na pasma, województwa i MUX-y |
| `GET` | `/api/geocode?q=...` | Geokodowanie miast, gmin i ulic z OpenStreetMap Nominatim |
| `GET` | `/api/rds?url=...&station=...` | Odczyt metadanych ICY/RDS na żywo w czasie < 1 ms (cache Stale-While-Revalidate) |
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

### 1. 🔍 Detailed Transmitter Information
- **Broadcaster / Operator**: Official licensee (e.g. *Telewizja Polska S.A.*, *Emitel S.A.*, *Grupa RMF*, *Eurozet*, *Polskie Radio S.A.*, *Grupa Radiowa Time*).
- **Broadcast Content**: Station name or multiplex identifier with official station brand logo.
- **Complete TV Multiplex Channel Lineups**:
  - **MUX 1**: *Eska TV, TTV, Polo TV, Antena HD, TV Trwam, Stopklatka, Fokus TV, Wydarzenia 24*
  - **MUX 2**: *Polsat, TVN, TV4, TV6, TV Puls, Puls 2, Super Polsat, TVN 7*
  - **MUX 3**: *TVP1, TVP2, TVP3 Regional, TVP Info, TVP Sport, TVP Historia, TVP ABC, TVP Kultura*
  - **MUX 4**: *Polsat News Polityka (FTA), Polsat Sport 1/2, Eleven Sports, encrypted Polsat Box packages*
  - **MUX 6**: *TVP Nauka, TVP Dokument, TVP Kobieta, TVP Rozrywka, TVP Polonia, Alfa TVP, Belsat TV*
  - **MUX 8**: *Nowa TV, Metro, Zoom TV, WP, ViDoc TV, TV Republika, wPolsce24*
  - **MUX-L (Local)**: *TVT Rybnik, TV Dami Radom, TVC Radomsko, Echo24 Wrocław, Stars.TV, etc.*
  - **5G Broadcast**: Experimental next-generation mobile broadcast transmissions.

### 2. 🎯 Smart Non-Obscuring Popups & Bottom Sheet
- **No More Hidden Markers**:
  - In spiderfied clusters, clicking a bottom dot opens the popup **DOWNWARDS** (below the dot), and clicking a top dot opens it **UPWARDS**. The rest of the cluster dots remain 100% uncovered, visible, and directly clickable!
  - **In-Popup Mast Switcher Chips (`Other on this mast`)**: Switch between all transmitters sharing the same tower directly with one tap.
  - **Dock Button `📌`**: Instantly docks the card to the bottom sheet, completely freeing the map canvas.

### 3. 📐 Advanced Propagation & Signal Calculator
Clicking **`📐 Calculate signal`** tests signal reception conditions for any location in Poland:
- **For Towns / Municipalities**: Area-wide estimated signal percentage (e.g. *88%*) and field strength in $\text{dB}\mu\text{V/m}$.
- **For Street Addresses**: Precise distance in km, exact **antenna azimuth bearing** (e.g. *214° SW*), signal in $\text{dBm}$ / $\text{dB}\mu\text{V/m}$, and hardware recommendation.
- **Realistic Propagation Model**: Distances beyond nominal limits ($d > 1.25 \times R$) evaluate to **0%** (Out of range) with a dashed red line and ❌ marker.

### 4. 📻 Live Radio Streams with Active Station Logos & Fast RDS
- Audio catalog with 38 online streams verified silently via FFmpeg.
- **Station Logos**: The persistent bottom player displays authentic station branding instead of pseudo visualizers.
- **Instant RDS (< 1 ms via Stale-While-Revalidate cache)**:
  - Clean artist and song title without timestamp clutter.
  - **Track Change Flash**: When the track changes, the RDS pill pulses with neon highlight (`.rds-pill-changed`), the text transitions smoothly, and an alert toast displays: `🎵 Now playing on ...`.

### 5. 🚫 Instant and Flexible Coverage Radius Controls
- Individual toggle in popup, direct map click to dismiss, or floating clear button.

### 6. 📱 Multi-Device Responsiveness (PC, Tablets, Smartphones)
- **Desktops**: Ergonomic layout with sidebar filters, stream drawer, and directional popups.
- **Tablets**: Translucent backdrop drawer, horizontally scrollable category chips.
- **Mobile Phones (< 768px)**:
  - Dedicated **Bottom Sheet** sliding from the bottom, leaving the map and all pins completely unobstructed.
  - Touch-optimized bottom player with safe-area padding (`env(safe-area-inset-bottom)`).

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
npm install

# 3. Build TypeScript backend
npm run build

# 4. Start the application
npm start
```

Access the map at **port 9354**: [http://localhost:9354](http://localhost:9354).

---

## ☁️ How to Deploy to Vercel

This repository includes a ready-to-use [`vercel.json`](vercel.json) and serverless entrypoint [`api/index.ts`](api/index.ts). You can deploy it to Vercel in less than 2 minutes!

### Method 1: Deploy via Vercel Web Dashboard (1-Click)
1. Sign up or log in at [vercel.com](https://vercel.com).
2. Click **"Add New..."** ➔ **"Project"**.
3. Connect your GitHub account and choose the **`fmmap`** repository.
4. Vercel automatically detects `vercel.json` and the build script `npm run build`.
5. Click **"Deploy"**.
6. In about 60 seconds, your map is live at `https://your-project.vercel.app`! 🎉

### Method 2: Deploy using Vercel CLI (Terminal)
```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Log in to Vercel
vercel login

# 3. Deploy to production
vercel --prod
```

### Architecture on Vercel
- **Static Assets (`public/`)**: Served directly from Vercel's global Edge Network for instant load times worldwide.
- **API Backend (`src/server.ts`)**: Runs as a Serverless Node.js function handling `/api/*` routes.
- Transmitters and streams databases (`data/transmitters.json`) are bundled inside the serverless package—**no external database or Redis required**.

---

## ⚙️ Configuration (`config.json`)

All server, map, and filter defaults can be modified via [`config.json`](config.json).

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/config` | Retrieves public map configuration and defaults |
| `GET` | `/api/transmitters` | Returns transmitter collection with query filters |
| `GET` | `/api/stats` | Aggregated statistics per band, voivodeship, and multiplex |
| `GET` | `/api/geocode?q=...` | Geocoding service for Polish towns, municipalities, and streets |
| `GET` | `/api/rds?url=...&station=...` | Real-time live ICY/RDS metadata in < 1 ms (Stale-While-Revalidate) |
| `GET` | `/api/radio-streams` | Returns verified online radio streaming endpoints |
| `GET` | `/api/site/:siteId` | All broadcasts sharing the same transmitter mast/tower |
| `POST` | `/api/reload` | Re-parses raw UKE registry files on demand |

---

## 📜 Licencja / License

This project is licensed under the terms of the **MIT License**.  
Projekt jest objęty licencją **MIT**. See the [LICENSE](LICENSE) file for details.
