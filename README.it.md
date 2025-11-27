<a id="readme-top"></a>

<div align="center">
  <img src="assets/icon.png" alt="Logo" width="30" height="30">
  <h3 align="center">Dashboard Orari</h3>
  <p align="center">
    <a href="README.md"><strong>Switch to English</strong></a>
  </p>
</div>

## Panoramica

Dashboard Orari è una web dashboard leggera che mostra l'aula corrente e quella successiva per ogni classe. I dati degli orari vivono nella tabella MySQL (`orario`) e vengono aggiornati tramite upload CSV gestito da una piccola API PHP.

### Funzionalità principali
- Wallboard auto-scrolling costruito con HTML/CSS/JS vanilla (`index.html`, `styles/`, `scripts/index.js`).
- Settings overlay locale (solo italiano) che permette al personale di regolare intervalli di animazione, easing curve e selezione manuale di giorno/ora, persistiti in `localStorage`.
- Admin upload form (`admin.html`) che invia CSV a `api/upload_csv.php`, normalizza le righe, divide le lezioni multi-hour e tronca/ripopola la tabella `orario` tramite PDO.
- Public JSON endpoint (`api/get_orario.php`) consumato dalla dashboard per ottenere le righe per giorno/ora.

### Disponibilità lingue

Il layer di presentazione è interamente in italiano. Include:

- Settings panel in `index.html`
- Etichette di default delle celle classe in `index.html`
- Admin panel in `admin.html`

## Tech stack
- Static HTML templates (`index.html`, `admin.html`).
- Vanilla JavaScript (`scripts/index.js`) per logica UI, icone Material Symbols e REST calls.
- PHP 8 + PDO (`api/*.php`) per ingestion CSV e query sull'orario.
- MySQL schema inizializzato da `scripts/orario_scuola.sql`.
- Optional Python helper (`scripts/process_csv.py`) che replica la routine di normalizzazione PHP. (deprecated!)

## Repository layout
| Path | Purpose |
| --- | --- |
| `index.html` | TV/dashboard view che ruota le classi. |
| `admin.html` | Modulo protetto per l'upload dei nuovi CSV. |
| `api/config.php` | Helper PDO e credenziali DB. |
| `api/upload_csv.php` | Accetta upload `multipart/form-data`, valida il token admin, ripulisce le righe e riscrive `orario`. |
| `api/get_orario.php` | Restituisce JSON filtrato per `giorno` e `orario`. |
| `scripts/index.js` | Front-end controller: carica le impostazioni, recupera le lezioni, anima le celle. |
| `scripts/process_csv.py` | Processor CSV originale mantenuto per reference/testing. (deprecated) |
| `scripts/orario_scuola.sql` | Definizione tabella MySQL (`NUMERO`, `CLASSE`, `AULA`, `GIORNO`, `O_INIZIO`). |
| `styles/style.css` | CSS per gestire dashboard e admin UI. |
| `assets/fonts/` | Font Material Symbols e Noto Sans con relative licenze. |

## Flusso dei dati
1. **Database provisioning** – Importa `scripts/orario_scuola.sql` in MySQL e aggiorna le credenziali in `api/config.php`.
2. **CSV upload** – Il personale esporta un CSV separato da punto e virgola (vedi `scripts/EXP_COURS.csv`) e lo invia da `admin.html` oppure via `curl` verso `api/upload_csv.php` insieme al token condiviso (default `1234567890`, hash lato server).
3. **Normalization** – `upload_csv.php` pulisce gli accenti, impone ID sequenziali e divide le lezioni più lunghe di un'ora in righe multiple allineate all'array `SCHOOL_TIMES`.
4. **Dashboard fetch** – `scripts/index.js` chiama `api/get_orario.php?orario=<HHhMM>&giorno=<weekday>` per slot corrente e successivo, quindi renderizza ogni cella con icone Material Symbols.

## Utilizzo

### Requisiti
- Web server.
- PHP runtime con estensioni MySQL.
- Database MySQL chiamato `orario_scuola` (configurabile) raggiungibile dagli script PHP.
- Browser collegato allo stesso host per `index.html`/`admin.html`.

### Configurazione iniziale
1. Importa `scripts/orario_scuola.sql` in MySQL.
2. Aggiorna `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` e `DB_NAME` dentro `api/config.php`.
3. Pubblica la repository tramite il tuo web server (ad esempio sotto `/srv/http/dashboard-orari`).

### Aggiornare l'orario
```bash
curl -F "token=1234567890" -F "file=@scripts/EXP_COURS.csv;type=text/csv" \
  http://localhost/dashboard-orari/api/upload_csv.php
```
L'endpoint risponde con JSON che indica quante righe sono state processate e inserite. Se va a buon fine la tabella `orario` viene sostituita completamente.

### Visualizzare la dashboard
1. Apri `index.html` sul monitor.
2. Usa il pulsante nascosto in basso a sinistra per regolare intervallo/animazione. L'interfaccia resta solo in italiano.

## Riferimento API

### `GET api/get_orario.php`
- **Query parameters**
  - `orario` – Ora di inizio in formato `HHhMM` (es. `08h55`).
  - `giorno` – Giorno feriale italiano in minuscolo (`lunedì`..`venerdì`).
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
  - `token` – Segreto condiviso in chiaro (default `1234567890`).
  - `file` – CSV (delimitatore `;`, intestazioni come `NUMERO`, `CLASSE`, `AULA`, `GIORNO`, `O_INIZIO`, `DURATA`).
- **Behavior** – Valida il token, tronca `orario`, inserisce le righe normalizzate e restituisce `{ success: true, processed_rows, inserted_rows }`.

## Creato da

- Progetto open-source creato da <a href="https://github.com/lucAmbr0">lucAmbr0</a> e <a href="https://github.com/gettyreal">gettyreal</a> per l'IIS Leonardo Da Vinci di Carate Brianza

## Licenze e crediti
- Le licenze dei font si trovano accanto a ogni famiglia dentro `assets/fonts/**/LICENSE.txt` o `OFL.txt`.
- Il codice non ha licenza: adattalo come necessario nel tuo ambiente.

## Problemi
- Apri una issue su questa repository per bug o richieste di funzionalità.

<p align="right">(<a href="#readme-top">torna su</a>)</p>
