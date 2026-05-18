#!/bin/bash
# FIX DEFINITIVO del Tempio 3D
# Rimuove il blocco inline rotto di tagForTooltip che blocca la scena
set -e
cd "$(dirname "$0")"
echo "📂 $(pwd)"

FILE="assets/js/temple-scene.js"
if [ ! -f "$FILE" ]; then
  echo "❌ $FILE non trovato. Sei nella cartella sbagliata?"
  exit 1
fi

echo ""
echo "🔍 Stato attuale del file:"
echo "   - Linee:    $(wc -l < "$FILE")"
echo "   - applyTooltipTags presente: $(grep -c 'applyTooltipTags' "$FILE")"
echo "   - vecchio inline tagForTooltip(columnJ presente: $(grep -c \"^tagForTooltip(columnJ, 'columnJ');\" "$FILE")"
echo ""

# Fix con Python (più sicuro di sed per modifiche multi-riga)
python3 - <<'PYEOF'
path = "assets/js/temple-scene.js"
with open(path, 'r') as f:
    content = f.read()

# Rimuovo il blocco inline rotto: 16 righe consecutive di tagForTooltip(...);
# che referenziano variabili dichiarate più sotto (TDZ error).
import re
pattern = re.compile(
    r"^tagForTooltip\(columnJ, 'columnJ'\);\n"
    r"tagForTooltip\(columnB, 'columnB'\);\n"
    r"tagForTooltip\(sacredAltarGroup, 'ara'\);\n"
    r"tagForTooltip\(throneGroup, 'trono'\);\n"
    r"tagForTooltip\(deltaGroup, 'delta'\);\n"
    r"tagForTooltip\(sun, 'sole'\);\n"
    r"tagForTooltip\(moon, 'luna'\);\n"
    r"tagForTooltip\(quadroDiLoggia, 'quadro'\);\n"
    r"tagForTooltip\(swordGroup, 'spada'\);\n"
    r"tagForTooltip\(venus, 'venus'\);\n"
    r"tagForTooltip\(hercules, 'hercules'\);\n"
    r"tagForTooltip\(cand1\.group, 'candelabra'\);\n"
    r"tagForTooltip\(cand2\.group, 'candelabra'\);\n"
    r"tagForTooltip\(cand3\.group, 'candelabra'\);\n"
    r"tagForTooltip\(firstSurvAltar, 'firstSorv'\);\n"
    r"tagForTooltip\(secondSurvAltar, 'secondSorv'\);\n",
    re.MULTILINE
)
new_content = pattern.sub(
    "// Le chiamate tagForTooltip sono raggruppate in applyTooltipTags() in fondo al file\n",
    content
)

# Anche tagForTooltip(zodiacGroup, 'zodiac'); è inline e TDZ
new_content = re.sub(
    r"^tagForTooltip\(zodiacGroup, 'zodiac'\);\n",
    "// tagForTooltip(zodiacGroup) spostata in applyTooltipTags()\n",
    new_content, count=1, flags=re.MULTILINE
)

# Verifico che applyTooltipTags già esista (Andrea l'ha pushato nel commit precedente)
if "function applyTooltipTags" not in new_content:
    print("⚠ applyTooltipTags non trovata, l'aggiungo io")
    inject = '''
// === TOOLTIP TAGS — applicati DOPO che tutte le variabili sono inizializzate ===
function applyTooltipTags() {
  try {
    if (typeof zodiacGroup      !== 'undefined') tagForTooltip(zodiacGroup, 'zodiac');
    if (typeof columnJ          !== 'undefined') tagForTooltip(columnJ, 'columnJ');
    if (typeof columnB          !== 'undefined') tagForTooltip(columnB, 'columnB');
    if (typeof sacredAltarGroup !== 'undefined') tagForTooltip(sacredAltarGroup, 'ara');
    if (typeof throneGroup      !== 'undefined') tagForTooltip(throneGroup, 'trono');
    if (typeof deltaGroup       !== 'undefined') tagForTooltip(deltaGroup, 'delta');
    if (typeof sun              !== 'undefined') tagForTooltip(sun, 'sole');
    if (typeof moon             !== 'undefined') tagForTooltip(moon, 'luna');
    if (typeof quadroDiLoggia   !== 'undefined') tagForTooltip(quadroDiLoggia, 'quadro');
    if (typeof swordGroup       !== 'undefined') tagForTooltip(swordGroup, 'spada');
    if (typeof venus            !== 'undefined') tagForTooltip(venus, 'venus');
    if (typeof hercules         !== 'undefined') tagForTooltip(hercules, 'hercules');
    if (typeof cand1            !== 'undefined' && cand1 && cand1.group) tagForTooltip(cand1.group, 'candelabra');
    if (typeof cand2            !== 'undefined' && cand2 && cand2.group) tagForTooltip(cand2.group, 'candelabra');
    if (typeof cand3            !== 'undefined' && cand3 && cand3.group) tagForTooltip(cand3.group, 'candelabra');
    if (typeof firstSurvAltar   !== 'undefined') tagForTooltip(firstSurvAltar, 'firstSorv');
    if (typeof secondSurvAltar  !== 'undefined') tagForTooltip(secondSurvAltar, 'secondSorv');
  } catch (e) {
    console.warn('[Temple] applyTooltipTags errore:', e.message);
  }
}
applyTooltipTags();
'''
    new_content = new_content.replace('animate();', inject + '\nanimate();', 1)

if new_content == content:
    print("ℹ Nessuna modifica necessaria — il file è già pulito.")
else:
    with open(path, 'w') as f:
        f.write(new_content)
    print("✅ Blocco inline tagForTooltip rimosso. File salvato.")
PYEOF

echo ""
echo "🔍 Stato dopo il fix:"
echo "   - Linee:    $(wc -l < "$FILE")"
echo "   - applyTooltipTags presente: $(grep -c 'applyTooltipTags' "$FILE")"
echo "   - vecchio inline tagForTooltip(columnJ presente: $(grep -c \"^tagForTooltip(columnJ, 'columnJ');\" "$FILE")"
echo ""

echo "🔓 Pulisco eventuale lock git..."
rm -f .git/index.lock

echo ""
echo "📤 Commit & push..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ Nessuna modifica da committare."
else
  git commit -m "fix(3d): rimuovi vecchio blocco inline tagForTooltip (TDZ) che bloccava la scena"
  git push
fi

echo ""
echo "✅ FATTO. Aspetta 60 secondi e ricarica con Cmd+Shift+R:"
echo "   https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/"
echo ""
echo "Premi Invio per chiudere…"
read -r
