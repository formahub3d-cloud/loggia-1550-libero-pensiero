#!/bin/bash
# Due ritocchi:
#  1) Tooltip 3D solo durante l'esplorazione libera
#  2) Modalità Giorno più contenuta (no bagliore eccessivo)
set -e
cd "$(dirname "$0")"
echo "📂 $(pwd)"
echo ""

python3 - <<'PYEOF'
import re

# === FIX 1: tooltip solo in modalità esplorazione ===
path_scene = "assets/js/temple-scene.js"
with open(path_scene) as f:
    c = f.read()

# Inserisce il check explore.active all'inizio di updateTooltipRaycast
old_fn = '''// Funzione chiamata ogni frame nel render loop
function updateTooltipRaycast() {
  if (tooltipMouse.x < -1 || tooltipMouse.x > 1) {
    hideTooltip();
    return;
  }'''

new_fn = '''// Funzione chiamata ogni frame nel render loop
function updateTooltipRaycast() {
  // Tooltip attivo SOLO durante la modalità esplorazione libera,
  // non durante lo scrolling narrativo.
  if (typeof explore === 'undefined' || !explore.active) {
    hideTooltip();
    return;
  }
  if (tooltipMouse.x < -1 || tooltipMouse.x > 1) {
    hideTooltip();
    return;
  }'''

if old_fn in c:
    c = c.replace(old_fn, new_fn)
    with open(path_scene, 'w') as f:
        f.write(c)
    print("✅ Fix 1: tooltip ora attivo solo in esplorazione libera")
elif "if (typeof explore === 'undefined' || !explore.active)" in c:
    print("ℹ Fix 1: tooltip già condizionato a explore.active")
else:
    print("⚠ Fix 1: pattern updateTooltipRaycast non trovato (potrebbe già essere modificato diversamente)")

# === FIX 2: Modalità Giorno più contenuta ===
path_dn = "assets/js/temple-day-night.js"
with open(path_dn) as f:
    c = f.read()

old_day = '''    const DAY = {
      clearColor:   new THREE.Color(0xb8d4e8),  // azzurro alba
      fogColor:     new THREE.Color(0xd8e4f0),  // bianco-azzurro chiaro
      fogDensity:   0.006,
      exposure:     1.55,
      ambient:      0.95, ambientCol:  new THREE.Color(0xb0c4d8),
      hemi:         0.85, hemiSky:     new THREE.Color(0xcfdcee),  hemiGround: new THREE.Color(0x8a7858),
      gold:         0.8,  goldCol:     new THREE.Color(0xfff2c8),
      east:         1.6,  eastCol:     new THREE.Color(0xfff4c0),  // sole basso dall'Oriente
      altar:        1.0,  altarCol:    new THREE.Color(0xfff0c0),
      rim:          0.30, rimCol:      new THREE.Color(0xa0c4e0),
      entrance:     2.4,  entranceCol: new THREE.Color(0xfff0d0)
    };'''

new_day = '''    const DAY = {
      // Crepuscolo dorato/azzurrino — più contenuto rispetto a un'alba piena,
      // così il bloom dei candelabri non viene lavato e il Tempio resta leggibile.
      clearColor:   new THREE.Color(0x4a5a7a),  // azzurro grigio profondo
      fogColor:     new THREE.Color(0x6a7894),  // azzurro grigio medio
      fogDensity:   0.012,
      exposure:     1.10,                       // più basso di notte (1.25) per compensare luci più alte
      ambient:      0.75, ambientCol:  new THREE.Color(0x7888a0),
      hemi:         0.55, hemiSky:     new THREE.Color(0x8a98b4),  hemiGround: new THREE.Color(0x4a3a20),
      gold:         1.1,  goldCol:     new THREE.Color(0xf0d090),
      east:         1.2,  eastCol:     new THREE.Color(0xffd890),  // sole basso dall'Oriente, più caldo
      altar:        1.0,  altarCol:    new THREE.Color(0xffd089),
      rim:          0.35, rimCol:      new THREE.Color(0x7090b8),
      entrance:     1.2,  entranceCol: new THREE.Color(0xffe0a0)
    };'''

if old_day in c:
    c = c.replace(old_day, new_day)
    with open(path_dn, 'w') as f:
        f.write(c)
    print("✅ Fix 2: modalità Giorno calibrata (meno bagliore, più cinema)")
elif "Crepuscolo dorato/azzurrino" in c:
    print("ℹ Fix 2: modalità Giorno già calibrata")
else:
    print("⚠ Fix 2: pattern preset DAY non trovato")
PYEOF

# Verifica sintassi
echo ""
echo "🔍 Controllo sintassi:"
node --check assets/js/temple-scene.js && echo "  ✓ temple-scene.js OK"
node --check assets/js/temple-day-night.js && echo "  ✓ temple-day-night.js OK"

echo ""
echo "🔓 Pulisco lock git se presente..."
rm -f .git/index.lock

echo ""
echo "📤 Commit & push..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ Nessuna modifica da committare."
else
  git commit -m "feat: tooltip 3D solo in esplorazione libera + Giorno più contenuto"
  git push
fi

echo ""
echo "✅ FATTO. Aspetta 60 secondi e ricarica con Cmd+Shift+R:"
echo "   https://formahub3d-cloud.github.io/loggia-1550-libero-pensiero/"
echo ""
echo "Premi Invio per chiudere…"
read -r
