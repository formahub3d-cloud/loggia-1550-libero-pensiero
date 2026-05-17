# Loggia 1550 — Libero Pensiero · Sito web

Esperienza 3D immersiva del Tempio massonico per la Loggia n. 1550 «Libero Pensiero», con Quiz del Vero Massone (22 prove iniziatiche).

## Struttura del progetto

```
.
├── index.html                   ← Homepage con Tempio 3D scrollytelling
├── pages/
│   ├── quiz.html                ← Quiz del Vero Massone (22 prove)
│   ├── galleria.html            ← (placeholder)
│   ├── tavole.html              ← (placeholder)
│   ├── calendario.html          ← (placeholder)
│   ├── iscrizione.html          ← (placeholder)
│   └── contatti.html            ← (placeholder)
├── assets/
│   ├── audio/
│   │   ├── temple-ambient.mp3   ← Da caricare (vedi sotto)
│   │   └── temple-ambient.ogg   ← Da caricare (fallback)
│   ├── css/
│   │   ├── tokens.css           Variabili design
│   │   ├── base.css             Reset + audio button
│   │   ├── home.css             Stili homepage
│   │   ├── page.css             Stili pagine interne
│   │   └── quiz.css             Stili Quiz
│   ├── img/                     (placeholder, immagini galleria)
│   └── js/
│       ├── temple-scene.js      Three.js scena 3D
│       ├── temple-ambience.js   Audio ambientale
│       ├── quiz-data.js         22 prove + epigrafi
│       ├── quiz-illustrations.js 22 illustrazioni SVG
│       └── quiz-engine.js       Motore Quiz
├── README.md
└── CNAME.example                Esempio per dominio custom
```

## Setup GitHub Pages + dominio SiteGround

### A. Creare il repository

1. Vai su https://github.com/new e crea un nuovo repository:
   - Nome consigliato: `loggia-1550-libero-pensiero`
   - Visibilità: **Public** (richiesto per GitHub Pages gratuito) o **Private** (necessita GitHub Pro)
   - Non inizializzarlo con README/gitignore (li abbiamo già)

2. Sul tuo Mac, dentro la cartella del progetto, apri Terminale e lancia:

   ```bash
   cd "/Users/imac/Desktop/FORMA/Progetti clienti /Loggia 1550/Sito web/Loggia 1550 - Libero Pensiero"
   git init
   git add .
   git commit -m "Initial commit: sito Loggia 1550 con Tempio 3D e Quiz"
   git branch -M main
   git remote add origin https://github.com/formahub3d-cloud/loggia-1550-libero-pensiero.git
   git push -u origin main
   ```

   (Sostituisci `formahub3d-cloud` col tuo username GitHub)

### B. Abilitare GitHub Pages

1. Su GitHub vai su **Settings → Pages** del tuo repo
2. Sezione **"Build and deployment"**:
   - Source: **Deploy from a branch**
   - Branch: **main** / Folder: **/ (root)**
   - Salva
3. Dopo ~1 minuto, GitHub Pages servirà il sito su:
   `https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/`

### C. Collegare dominio SiteGround

1. Decidi il dominio (es. `loggia1550.it`, `liberopensiero.it`, ecc.)
2. Su **SiteGround → Site Tools → Domain → DNS Zone Editor**:
   - Aggiungi/modifica i record **A** del dominio (apex) per puntare agli IP di GitHub Pages:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Aggiungi un record **CNAME** per `www` che punta a `formahub3d-cloud.github.io`
3. Sul repo GitHub crea un file `CNAME` (vuoto, solo il dominio dentro):
   ```
   loggia1550.it
   ```
   Committalo: `git add CNAME && git commit -m "Add custom domain" && git push`
4. Su GitHub **Settings → Pages → Custom domain**: inserisci `loggia1550.it`
5. Attendi che la propagazione DNS completi (5 min – qualche ora)
6. Spunta **Enforce HTTPS**

Il sito sarà online su `https://loggia1550.it` con SSL automatico.

## Gestire l'audio (e altri asset) da qualsiasi dispositivo

Una volta che il sito è su GitHub, puoi caricare/sostituire file da qualsiasi dispositivo:

### Da browser (PC, tablet, smartphone)
1. Vai sul repo GitHub → cartella `assets/audio/`
2. Click "Add file" → "Upload files"
3. Trascina il file `temple-ambient.mp3` (e/o `.ogg`)
4. Commit changes
5. GitHub Pages si aggiorna automaticamente in 30-60 secondi

### Da app GitHub Mobile (iOS/Android)
1. Apri il repo nell'app
2. Naviga nella cartella `assets/audio/`
3. Tocca i 3 puntini → "Upload file"

### Da CLI (per modifiche più tecniche)
```bash
git pull
# modifica i file localmente
git add assets/audio/temple-ambient.mp3
git commit -m "Update audio"
git push
```

## Audio: cosa caricare

Il codice cerca automaticamente questi file in `assets/audio/`:

1. **`temple-ambient.mp3`** — formato consigliato, ampia compatibilità
2. **`temple-ambient.ogg`** — fallback per browser che non supportano MP3

### Specifiche tecniche consigliate
- **Durata**: 2-5 minuti minimo (verrà riprodotto in loop)
- **Bitrate MP3**: 128-192 kbps (peso 2-7 MB, qualità sufficiente per ambient)
- **Volume normalizzato**: -14 LUFS circa
- **Stile**: ambient, gregoriano, drone, organo sacro, atmosfere esoteriche

### Fonti royalty-free legali
- **Pixabay Music**: https://pixabay.com/music/ — cerca "dark ambient", "templar", "gregorian", "esoteric"
- **Free Music Archive**: https://freemusicarchive.org/
- **YouTube Audio Library**: dentro YouTube Studio (se hai account)
- **freesound.org**: community, controlla licenza CC0/CC-BY del singolo file

## Sviluppo locale

Per testare modifiche in locale (con tutte le features inclusi YouTube embed e audio):

```bash
cd "/Users/imac/Desktop/FORMA/Progetti clienti /Loggia 1550/Sito web/Loggia 1550 - Libero Pensiero"
python3 -m http.server 8000
```

Poi apri `http://localhost:8000` nel browser.

---

© Loggia n. 1550 «Libero Pensiero»
