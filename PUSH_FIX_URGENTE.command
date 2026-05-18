#!/bin/bash
# Script di push del fix URGENTE per il Tempio non visibile
# Fix: TDZ error 'sacredAltarGroup before initialization' in temple-scene.js
cd "$(dirname "$0")" || exit 1
echo "📂 Working dir: $(pwd)"
echo "🔓 Rimuovo lock orfano..."
rm -f .git/index.lock
echo ""
echo "📝 Status:"
git status --short
echo ""
echo "📤 Committing & pushing..."
git add -A
git commit -m "fix(3d): risolvi ReferenceError sacredAltarGroup (TDZ) che bloccava la scena

Il blocco tagForTooltip era posizionato a riga 2017 ma referenziava const
dichiarate centinaia di righe più sotto (sacredAltarGroup riga 2431,
quadroDiLoggia riga 3695, ecc.). Ora le chiamate sono raggruppate in
applyTooltipTags() ed eseguite alla fine del file, dopo tutte le const.

Sintomo: scena 3D bianca/vuota, console errore
'Cannot access sacredAltarGroup before initialization'."
git push
echo ""
echo "✅ Fatto. Vai su https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/ e ricarica con Cmd+Shift+R tra 60 secondi."
echo ""
echo "Premi Invio per chiudere..."
read -r
