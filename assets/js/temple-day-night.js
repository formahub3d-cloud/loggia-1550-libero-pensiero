/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Modalità Giorno / Notte del Tempio
   Toglie progressivamente la "notte" del tempio e accende la luce dell'alba.
   Si aggancia ai globali esposti da temple-scene.js (scene, renderer, *Light, sun, moon)
   ============================================================ */
(function() {
  'use strict';
  try {
  const STORAGE_KEY = 'loggia1550_daynight_v1';

  // Aspetta che la scena 3D sia pronta. temple-scene.js (defer) completa
  // prima di noi: ma controllo comunque per sicurezza, poi mi aggiungo come
  // listener anche all'evento temple-ready per gestire caricamenti ritardati.
  function bootIfReady() {
    const ok = (typeof scene !== 'undefined' && scene) || window.scene;
    if (ok) { init(); return true; }
    return false;
  }
  if (!bootIfReady()) {
    window.addEventListener('temple-ready', function once() {
      window.removeEventListener('temple-ready', once);
      bootIfReady();
    });
    // Polling di emergenza ogni 150ms per 3s
    let tries = 0;
    const poll = setInterval(function() {
      if (bootIfReady() || ++tries > 20) clearInterval(poll);
    }, 150);
  }

  function init() {
    // Riferimenti ai globali della scena 3D
    const _scene    = window.scene    || (typeof scene    !== 'undefined' ? scene    : null);
    const _renderer = window.renderer || (typeof renderer !== 'undefined' ? renderer : null);
    if (!_scene || !_renderer) {
      console.warn('[Temple D/N] Scena 3D non disponibile');
      return;
    }

    // Stato corrente (0 = notte, 1 = giorno)
    let target = 0;
    let current = 0;

    // Preset notte (valori attuali) e giorno
    const NIGHT = {
      clearColor:   new THREE.Color(0x050a25),
      fogColor:     new THREE.Color(0x0a1545),
      fogDensity:   0.018,
      exposure:     1.25,
      ambient:      0.55, ambientCol:  new THREE.Color(0x2a3568),
      hemi:         0.40, hemiSky:     new THREE.Color(0x4a6090),  hemiGround: new THREE.Color(0x1a1408),
      gold:         2.0,  goldCol:     new THREE.Color(0xd4b87a),
      east:         2.6,  eastCol:     new THREE.Color(0xffeb99),
      altar:        1.8,  altarCol:    new THREE.Color(0xffd989),
      rim:          0.45, rimCol:      new THREE.Color(0x6090c0),
      entrance:     1.5,  entranceCol: new THREE.Color(0xffeebb)
    };
    const DAY = {
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
    };

    // Risolve le luci percorrendo la scena (così funziona anche se le const
    // top-level di temple-scene.js non sono esposte come globali)
    const lights = { ambient: null, hemi: null, points: [], dir: null, spot: null };
    _scene.traverse(function(obj) {
      if (obj.isAmbientLight)      lights.ambient = obj;
      else if (obj.isHemisphereLight) lights.hemi = obj;
      else if (obj.isPointLight)   lights.points.push(obj);
      else if (obj.isDirectionalLight) lights.dir = obj;
      else if (obj.isSpotLight)    lights.spot = obj;
    });
    // points: per posizione → goldLight (0,4,0), eastLight (0,6,-16), altarLight (0,3,2)
    function findPoint(z) {
      let best = null, bestDist = Infinity;
      for (const p of lights.points) {
        const d = Math.abs(p.position.z - z);
        if (d < bestDist) { bestDist = d; best = p; }
      }
      return best;
    }
    const goldLight  = findPoint(0);
    const eastLight  = findPoint(-16);
    const altarLight = findPoint(2);

    // Stato dei valori "salvati" all'inizio (notte effettiva di partenza)
    if (lights.ambient)  NIGHT.ambient = lights.ambient.intensity;
    if (lights.hemi)     NIGHT.hemi    = lights.hemi.intensity;
    if (goldLight)       NIGHT.gold    = goldLight.intensity;
    if (eastLight)       NIGHT.east    = eastLight.intensity;
    if (altarLight)      NIGHT.altar   = altarLight.intensity;
    if (lights.dir)      NIGHT.rim     = lights.dir.intensity;
    if (lights.spot)     NIGHT.entrance = lights.spot.intensity;

    // ============================================================
    // UI: bottone toggle in alto a destra
    // ============================================================
    const btn = document.createElement('button');
    btn.className = 'temple-daynight-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Modalità giorno/notte del Tempio');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML =
      '<svg class="dn-icon dn-icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fill-opacity="0.25"/>' +
      '</svg>' +
      '<svg class="dn-icon dn-icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.3"/>' +
        '<line x1="12" y1="2" x2="12" y2="5"/>' +
        '<line x1="12" y1="19" x2="12" y2="22"/>' +
        '<line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>' +
        '<line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>' +
        '<line x1="2" y1="12" x2="5" y2="12"/>' +
        '<line x1="19" y1="12" x2="22" y2="12"/>' +
        '<line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>' +
        '<line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>' +
      '</svg>' +
      '<span class="temple-daynight-btn__label">Tempio · Notte</span>';
    document.body.appendChild(btn);

    function updateButton() {
      const isDay = target > 0.5;
      btn.classList.toggle('is-day', isDay);
      btn.setAttribute('aria-pressed', isDay ? 'true' : 'false');
      const lbl = btn.querySelector('.temple-daynight-btn__label');
      if (lbl) lbl.textContent = isDay ? 'Tempio · Giorno' : 'Tempio · Notte';
    }

    // Stato salvato
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.day) { target = 1; current = 1; applyState(1); }
    } catch (e) {}
    updateButton();

    btn.addEventListener('click', function() {
      target = (target > 0.5) ? 0 : 1;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: target > 0.5 })); } catch (e) {}
      updateButton();
    });

    // ============================================================
    // Helpers di lerp tra i due preset
    // ============================================================
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpCol(out, a, b, t) {
      out.r = lerp(a.r, b.r, t);
      out.g = lerp(a.g, b.g, t);
      out.b = lerp(a.b, b.b, t);
    }

    const _tmpCol = new THREE.Color();
    function applyState(t) {
      // background / clear / fog
      lerpCol(_tmpCol, NIGHT.clearColor, DAY.clearColor, t);
      _renderer.setClearColor(_tmpCol, 1);
      if (_scene.fog) {
        lerpCol(_scene.fog.color, NIGHT.fogColor, DAY.fogColor, t);
        _scene.fog.density = lerp(NIGHT.fogDensity, DAY.fogDensity, t);
      }
      _renderer.toneMappingExposure = lerp(NIGHT.exposure, DAY.exposure, t);

      if (lights.ambient) {
        lights.ambient.intensity = lerp(NIGHT.ambient, DAY.ambient, t);
        lerpCol(lights.ambient.color, NIGHT.ambientCol, DAY.ambientCol, t);
      }
      if (lights.hemi) {
        lights.hemi.intensity = lerp(NIGHT.hemi, DAY.hemi, t);
        lerpCol(lights.hemi.color, NIGHT.hemiSky, DAY.hemiSky, t);
        lerpCol(lights.hemi.groundColor, NIGHT.hemiGround, DAY.hemiGround, t);
      }
      if (goldLight) {
        goldLight.intensity = lerp(NIGHT.gold, DAY.gold, t);
        lerpCol(goldLight.color, NIGHT.goldCol, DAY.goldCol, t);
      }
      if (eastLight) {
        eastLight.intensity = lerp(NIGHT.east, DAY.east, t);
        lerpCol(eastLight.color, NIGHT.eastCol, DAY.eastCol, t);
      }
      if (altarLight) {
        altarLight.intensity = lerp(NIGHT.altar, DAY.altar, t);
        lerpCol(altarLight.color, NIGHT.altarCol, DAY.altarCol, t);
      }
      if (lights.dir) {
        lights.dir.intensity = lerp(NIGHT.rim, DAY.rim, t);
        lerpCol(lights.dir.color, NIGHT.rimCol, DAY.rimCol, t);
      }
      if (lights.spot) {
        lights.spot.intensity = lerp(NIGHT.entrance, DAY.entrance, t);
        lerpCol(lights.spot.color, NIGHT.entranceCol, DAY.entranceCol, t);
      }
    }

    // ============================================================
    // Animazione: tween a frame del valore current → target
    // ============================================================
    function tick() {
      if (Math.abs(current - target) > 0.001) {
        const speed = 0.018; // ~1.2s di transizione
        current += (target - current) * speed;
        if (Math.abs(current - target) < 0.002) current = target;
        applyState(current);
      }
      requestAnimationFrame(tick);
    }
    tick();

    console.log('[Temple D/N] Modalità giorno/notte pronta');
  }
  } catch (e) { console.warn('[Temple D/N] Disabilitato:', e.message); }
})();
