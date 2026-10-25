# 📡 Polska — Mapa Nadajników DVB-T/DVB-T2 oraz Radio FM / DAB+ / AM

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Port](https://img.shields.io/badge/Port-9354-orange.svg)](http://localhost:9354)

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

### 3. 📐 Zaawansowany kalkulator sygnału i zasięgu w lokalizacji
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
- Na mapie rysowana jest przerywana linia pomiarowa i wskaźnik celu 🎯.

### 4. 📻 Odsłuch stacji na żywo (Zweryfikowany przez FFmpeg)
- Baza strumieni audio z [github.com/web-radio/webradio](https://github.com/web-radio/webradio).
- **Przetestowane bezgłośnie w tle za pomocą FFmpeg** (`ffmpeg -t 2 -i <stream> -f null -`) – zweryfikowano **38 aktywnych stacji** (m.in. *Jedynka, Dwójka, Trójka, RMF FM, Radio ZET, TOK FM, Złote Przeboje, Radio Pogoda, Rock Radio, RMF Classic, RMF MAXXX, Radio Kaszëbë, rozgłośnie regionalne Polskiego Radia*).
- Przycisk **`▶️ Odsłuchaj na żywo`** bezpośrednio w dymku nadajnika.
- Stały odtwarzacz audio na dole ekranu z animowanym korektorem (equalizer), regulacją głośności i przyciskiem pauzy.
- Wyszukiwarka i lista stacji online pod przyciskiem **`📻 Odsłuch radia`**.

### 5. ⚡ Wyszukiwanie niewrażliwe na polskie znaki diakrytyczne
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
| `GET` | `/api/radio-streams` | Lista 38 zweryfikowanych strumieni radiowych online |
| `GET` | `/api/site/:siteId` | Wszystkie stacje nadawane z danego masztu / wieży |
| `POST` | `/api/reload` | Ponowne wczytanie i sparsowanie surowych baz UKE |

---

## 🏛️ Architektura projektu

```
fmmap/
├── config.json              # Główny plik konfiguracyjny
├── LICENSE                  # Licencja MIT
├── package.json             # Zależności i skrypty npm
├── tsconfig.json            # Konfiguracja kompilatora TypeScript
├── data/                    # Przetworzone bazy w formacie JSON
│   ├── transmitters.json    # 2 241 sparsowanych nadajników
│   └── working_radio_streams.json # 38 zweryfikowanych strumieni audio
├── data_raw/                # Oficjalne pliki CSV pobrane z UKE
│   ├── radio/               # Pozwolenia UKF, DAB+, fale średnie i długie
│   └── tv/                  # Pozwolenia NTC (DVB-T / DVB-T2)
├── src/                     # Kod źródłowy TypeScript backendu
│   ├── data-parser.ts       # Parser baz danych UKE i dopasowanie strumieni
│   ├── server.ts            # Serwer Express REST API i routing statyczny
│   └── types.ts             # Interfejsy TypeScript
└── public/                  # Interfejs użytkownika (Frontend)
    ├── index.html           # Główny widok mapy i okna modalne
    ├── style.css            # Dedykowany styl interfejsu (ciemny motyw techniczny)
    ├── app.js               # Aplikacja frontendowa (Leaflet, odtwarzacz, kalkulator)
    └── vendor/              # Lokalne biblioteki Leaflet i MarkerCluster
```

---

## 📜 Licencja

Projekt jest objęty licencją **MIT**. Szczegóły w pliku [LICENSE](LICENSE).
