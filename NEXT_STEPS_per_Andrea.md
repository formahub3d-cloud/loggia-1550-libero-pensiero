# Da fare quando torni — Loggia 1550

## 1) Commit & push delle modifiche

La sandbox ha trovato un file di lock orfano nel `.git` che non posso rimuovere io.
Tu invece sì. Apri Terminale e copia-incolla:

```bash
cd "/Users/imac/Desktop/FORMA/Progetti clienti /Loggia 1550/Sito web/Loggia 1550 - Libero Pensiero"
rm -f .git/index.lock
git add -A
git commit -m "feat: visualizer audio, modalità giorno/notte, pagina Chi Siamo, pagina Simboli, 404, JSON-LD, polish UX"
git push
```

Se ti chiede credenziali, usa il token PAT che avevi salvato.

## 2) Cosa è stato fatto in questa sessione

| # | Lavoro | File |
|---|---|---|
| 71 | Visualizer audio a spirale dorata sotto il bottone musica | `assets/js/temple-ambience.js` |
| 72 | Modalità Giorno/Notte del Tempio (bottone in alto a destra) | `assets/js/temple-day-night.js` |
| 73 | Pagina **Chi Siamo** con valori, storia, 8 Luci di Loggia, motto | `pages/chi-siamo.html` |
| 74 | Polish UX: fade page transitions, Torna Su, reveal animato | `assets/js/page-polish.js` |
| 76 | **404.html** custom con due colonne e citazione iniziatica | `404.html` |
| 77 | JSON-LD (Schema.org Organization + WebSite) per SEO | `index.html` |
| 78 | Pagina **I Simboli del Tempio** — 22 simboli spiegati | `pages/simboli.html` |

Nav e sitemap aggiornati per Chi Siamo e Simboli.

## 3) Quando il push è andato:

Aspetta 1–2 minuti che GitHub Pages aggiorni, poi controlla:

- https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/ → bottone Giorno/Notte in alto a destra, visualizer sotto il bottone audio
- https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/pages/chi-siamo.html
- https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/pages/simboli.html
- https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/404 (qualsiasi URL inventato sotto il dominio)

## 4) Sicurezza

Quando hai tempo, **revoca il PAT** che mi avevi dato:
https://github.com/settings/tokens

Poi se serve ne generi uno nuovo solo per il push e lo cancelli subito.

