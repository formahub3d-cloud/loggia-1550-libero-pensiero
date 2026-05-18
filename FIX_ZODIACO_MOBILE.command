#!/bin/bash
# Fix segni zodiacali mobile: appaiono come emoji colorate invece che glifi astrologici.
# Soluzione: aggiungere il Variation Selector-15 (U+FE0E) dopo ogni simbolo, che dice
# al sistema "rendi come testo, NON come emoji". Funziona su iOS e Android.
set -e
cd "$(dirname "$0")"
echo "📂 $(pwd)"

python3 - <<'PYEOF'
path = "assets/js/temple-scene.js"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1) Cambio la font del glifo per garantire fallback monocromatici prima delle emoji.
old_font = 'ctx.font = \'bold 130px "Segoe UI Symbol", "Arial Unicode MS", sans-serif\';'
new_font = 'ctx.font = \'bold 130px "Apple Symbols", "Symbola", "Quivira", "DejaVu Sans", "Segoe UI Symbol", "Arial Unicode MS", sans-serif\';'
if old_font in c:
    c = c.replace(old_font, new_font)
    print("✅ Font del glifo aggiornata con fallback monocromatici")

# 2) Aggiungo ︎ dopo i simboli zodiacali per forzare il rendering text-style
#    (non-emoji) su iOS / Android.
old_sym = 'ctx.fillText(zodiacGlyphs[i].sym, 128, 138);'
new_sym = "ctx.fillText(zodiacGlyphs[i].sym + '\\uFE0E', 128, 138);  // VS-15 = text style (no emoji)"
if old_sym in c:
    c = c.replace(old_sym, new_sym)
    print("✅ Variation Selector-15 aggiunto al glifo (forza il rendering testuale)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
PYEOF

echo ""
echo "🔍 Controllo sintassi:"
node --check assets/js/temple-scene.js && echo "  ✓ OK"

echo ""
echo "🔓 Pulisco lock git se presente..."
rm -f .git/index.lock

echo ""
echo "📤 Commit & push..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ Nessuna modifica da committare (forse il fix è già stato applicato)."
else
  git commit -m "fix(3d): zodiaco renderizzato come testo, non emoji, su mobile (VS-15)"
  git push
fi

echo ""
echo "✅ FATTO. Aspetta 60 secondi, ricarica con Cmd+Shift+R su desktop"
echo "   o trascina giù la pagina per ricaricare su mobile."
echo "   https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/"
echo ""
echo "Premi Invio per chiudere…"
read -r
