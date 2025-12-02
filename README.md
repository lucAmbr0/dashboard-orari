<a id="readme-top"></a>

<div align="center">
  <img src="assets/icon.png" alt="Logo" width="30" height="30">
  <h3 align="center">Dashboard Orari</h3>
  <p align="center">
    <a href="README.it.md"><strong>Passa all'italiano</strong></a>
  </p>
</div>

## Overview

Dashboard Orari is a lightweight web dashboard that shows the current and next classroom for each class section of a school. Timetable data lives in a MySQL table (`orario`) and is refreshed through a CSV upload handled by a small PHP API.

### Key features
- Auto-scrolling wallboard built with vanilla HTML/CSS/JS (`index.html`, `styles/`, `scripts/index.js`).
- Local settings overlay (Italian only) that lets staff tune animation intervals, easing curves and manual day/hour selection, persisted in `localStorage`.
- Admin upload form (`admin.html`) that sends CSV files to `api/upload_csv.php`, which normalizes rows, splits multi-hour lessons, and truncates/repopulates the `orario` table with PDO transactions.
- Public JSON endpoint (`api/get_orario.php`) consumed by the dashboard to fetch rows per day/hour.

### Language availability

The presentation layer is entirely in Italian. This includes:

- Settings panel in `index.html` 
- Class cells default labels in `index.html` 
- Admin panel in `admin.html` 

## Tech stack
- Static HTML templates (`index.html`, `admin.html`).
- Vanilla JavaScript (`scripts/index.js`) for UI logic, Material Symbols icons, and REST calls.
- PHP 8 + PDO (`api/*.php`) for CSV ingestion and timetable queries.
- MySQL schema seeded by `scripts/orario_scuola.sql`.
- Optional Python helper (`scripts/process_csv.py`) that mirrors the PHP normalization routine. (deprecated!)

## Repository layout
| Path | Purpose |
| --- | --- |
| `index.html` | TV/dashboard view that cycles through classes. |
| `admin.html` | Protected upload form for new CSV timetables. |
| `api/config.php` | PDO connection helper and DB credentials. |
| `api/upload_csv.php` | Accepts `multipart/form-data` uploads, validates the admin token, cleans rows, and rewrites `orario`. |
| `api/get_orario.php` | Returns JSON rows filtered by `giorno` and `orario`. |
| `scripts/index.js` | Front-end controller: loads settings, fetches lessons, animates cells. |
| `scripts/process_csv.py` | Original CSV processor kept for reference/testing. (deprecated) |
| `scripts/orario_scuola.sql` | Table definition for MySQL (`NUMERO`, `CLASSE`, `AULA`, `GIORNO`, `O_INIZIO`). |
| `styles/style.css` | CSS styles to handle dashboard and admin UI. |
| `assets/fonts/` | Bundled Material Symbols and Noto Sans font files with their licenses. |

## Data flow
1. **Database provisioning** – Import `scripts/orario_scuola.sql` into MySQL and update credentials in `api/config.php`.
2. **CSV upload** – Staff export a semicolon-separated CSV (see `scripts/EXP_COURS.csv` for headers) and submit it via `admin.html` or a direct `curl` call to `api/upload_csv.php` together with the shared token (default `1234567890`, hashed on the server).
3. **Normalization** – `upload_csv.php` cleans accents, enforces sequential lesson IDs, and splits lessons longer than one hour into multiple rows aligned to the `SCHOOL_TIMES` array.
4. **Dashboard fetch** – `scripts/index.js` calls `api/get_orario.php?orario=<HHhMM>&giorno=<weekday>` for the current and next slot, then renders each class cell with Material Symbols icons.

## Usage

### Requirements
- Web server.
- PHP runtime with MySQL extensions.
- MySQL database named `orario_scuola` (configurable) reachable from the PHP scripts.
- Browser connected to the same host for `index.html`/`admin.html`.
- A .csv file of the timetables from <a href="https://www.index-education.com/it/software-programma-orario.php">"EDT" software (by Index Education)</a>

### Initial setup
1. Import `scripts/orario_scuola.sql` into MySQL.
2. Adjust `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` inside `api/config.php`.
3. Serve the repository through your web server (e.g., place it under `/srv/http/dashboard-orari`).

### Importing the timetable
- This app provides a visual admin panel at `dashboard-orari/admin.html` that accepts a secret token and a csv file.
- The PHP backend accepts a .csv file in the format supported by Index Education's "EDT" school management software.
To import the timetable into `admin.html` for use in this web app, the school must use this software.
For schools that use it, simply export the timetable collection in .csv format, making sure to retain the following columns: NUMERO; DURATA; MAT_NOME; CLASSE; AULA; GIORNO; O.INIZIO

<br>

- Alternatively, you can load the file directly from the command line using the `curl` command and passing the token and csv file as follows:
```bash
curl -F "token=1234567890" -F "file=@scripts/EXP_COURS.csv;type=text/csv" \
  http://localhost/dashboard-orari/api/upload_csv.php
```
The endpoint responds with JSON indicating how many rows were processed and inserted. On success the `orario` table is fully replaced.

### Displaying the dashboard
1. Open `index.html` on the display screen.
2. Toggle the hidden settings overlay (bottom-left button) to adjust interval/animation. This interface remains Italian-only.

## API reference

### `GET api/get_orario.php`
- **Query parameters**
  - `orario` – Lesson start time in `HHhMM` format (e.g., `08h55`).
  - `giorno` – Lowercase Italian weekday (`lunedì`..`venerdì`).
- **Response**
  ```json
  {
    "success": true,
    "requested_time": "08h55",
    "requested_day": "lunedì",
    "count": 12,
    "classi": [
      {"NUMERO": 1, "CLASSE": "1A", "AULA": "Lab. Info", "GIORNO": "lunedì", "O_INIZIO": "08h55"}
    ]
  }
  ```

### `POST api/upload_csv.php`
- **Form fields**
  - `token` – Plain-text shared secret (default `1234567890`).
  - `file` – CSV file (semicolon delimiter, headers such as `NUMERO`, `CLASSE`, `AULA`, `GIORNO`, `O_INIZIO`, `DURATA`).
- **Behavior** – Validates the token, truncates `orario`, inserts normalized rows, and returns `{ success: true, processed_rows, inserted_rows }`.

## Created by

- Open-source project created by <a href="https://github.com/lucAmbr0">lucAmbr0</a> and <a href="https://github.com/gettyreal">gettyreal</a> for IIS Leonardo Da Vinci in Carate Brianza.

## License & credits
- Font licenses live next to each font family inside `assets/fonts/**/LICENSE.txt` or `OFL.txt`.
- This code is unlicensed; adapt as needed within your environment.

## Issues
- Open an issue on this repository for bugs or feature requests.

<p align="right">(<a href="#readme-top">back to top</a>)</p>