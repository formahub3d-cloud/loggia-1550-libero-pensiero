/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Audio ambientale del Tempio — HTML5 Audio (file locale)
   Cerca: assets/audio/temple-ambient.mp3 (o .ogg in fallback)
   + Visualizer spettrale a spirale dorata
   ============================================================ */

(function() {
  'use strict';

  const STORAGE_KEY  = 'loggia1550_audio_v1';
  const FADE_DUR_MS  = 1500;
  const TARGET_VOL   = 0.55;
  const FADE_STEPS   = 30;

  let audioEl     = null;
  let isPlaying   = false;
  let audioReady  = false;
  let audioFailed = false;
  let fadeTimer   = null;

  // === Visualizer state ===
  let audioCtx     = null;
  let analyser     = null;
  let sourceNode   = null;
  let vizCanvas    = null;
  let vizCtx       = null;
  let vizRAF       = null;
  let vizData      = null;

  // ============================================================
  function getBasePath() {
    const isInPagesDir = window.location.pathname.includes('/pages/');
    return isInPagesDir ? '../' : '';
  }

  function log(msg, data) {
    console.log('[Temple Audio]', msg, data !== undefined ? data : '');
  }
  function warn(msg, data) {
    console.warn('[Temple Audio]', msg, data !== undefined ? data : '');
  }

  function savePref(enabled) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: enabled })); } catch (e) {}
  }

  // ============================================================
  // Creazione lazy dell'elemento <audio>
  // ============================================================
  function createAudio() {
    if (audioEl) return;
    const base = getBasePath();
    audioEl = new Audio();
    audioEl.loop     = true;
    audioEl.preload  = 'auto';
    audioEl.volume   = 0;
    audioEl.crossOrigin = 'anonymous';

    audioEl.src = base + 'assets/audio/temple-ambient.mp3';

    audioEl.addEventListener('canplaythrough', function() {
      audioReady = true;
      log('Audio caricato e pronto (' + Math.round(audioEl.duration) + 's)');
    });

    audioEl.addEventListener('error', function() {
      if (!audioEl.src.endsWith('.ogg')) {
        log('MP3 non trovato, provo .ogg');
        audioEl.src = base + 'assets/audio/temple-ambient.ogg';
        return;
      }
      audioFailed = true;
      const err = audioEl.error;
      const codes = {
        1: 'Caricamento interrotto',
        2: 'Errore di rete',
        3: 'Errore di decodifica',
        4: 'File non trovato (verifica che esista in assets/audio/)'
      };
      const msg = (err && codes[err.code]) || 'File audio mancante o non supportato';
      warn('Errore audio:', msg);
      showError(msg);
    });

    audioEl.addEventListener('stalled', function() {
      log('Stream in stallo (problema di rete?)');
    });
  }

  // ============================================================
  // Web Audio API — Visualizer
  // ============================================================
  function setupVisualizer() {
    if (audioCtx || !audioEl) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { warn('Web Audio API non supportata'); return; }
      audioCtx = new Ctx();
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      vizData = new Uint8Array(analyser.frequencyBinCount);
      log('Visualizer pronto (' + analyser.frequencyBinCount + ' bins)');
    } catch (e) {
      warn('Setup visualizer fallito:', e.message);
      audioCtx = null;
      analyser = null;
    }
  }

  function createVizCanvas() {
    if (vizCanvas || !btn) return;
    vizCanvas = document.createElement('canvas');
    vizCanvas.className = 'temple-audio-viz';
    vizCanvas.width = 96;
    vizCanvas.height = 96;
    vizCanvas.setAttribute('aria-hidden', 'true');
    btn.appendChild(vizCanvas);
    vizCtx = vizCanvas.getContext('2d');
  }

  function startVisualizer() {
    if (!analyser) {
      setupVisualizer();
      if (!analyser) return;
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function(){});
    }
    createVizCanvas();
    if (!vizRAF) {
      drawVisualizer();
      log('Visualizer avviato');
    }
    if (vizCanvas) vizCanvas.classList.add('is-active');
  }

  function stopVisualizer() {
    if (vizRAF) { cancelAnimationFrame(vizRAF); vizRAF = null; }
    if (vizCanvas) vizCanvas.classList.remove('is-active');
    // Fade out canvas
    if (vizCtx) {
      setTimeout(function() {
        if (vizCtx && !isPlaying) {
          vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
        }
      }, 600);
    }
  }

  function drawVisualizer() {
    vizRAF = requestAnimationFrame(drawVisualizer);
    if (!analyser || !vizCtx) return;
    analyser.getByteFrequencyData(vizData);

    const W = vizCanvas.width;
    const H = vizCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) / 2 - 4;

    vizCtx.clearRect(0, 0, W, H);

    // Energia media bassi/medi/alti
    const bins = vizData.length;
    let bass = 0, mid = 0, high = 0;
    const b1 = Math.floor(bins * 0.15);
    const b2 = Math.floor(bins * 0.55);
    for (let i = 0; i < b1; i++) bass += vizData[i];
    for (let i = b1; i < b2; i++) mid += vizData[i];
    for (let i = b2; i < bins; i++) high += vizData[i];
    bass /= (b1 || 1);
    mid  /= ((b2 - b1) || 1);
    high /= ((bins - b2) || 1);

    // Cerchio centrale pulsante (bassi)
    const pulse = 6 + (bass / 255) * 14;
    const grad = vizCtx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 1.4);
    grad.addColorStop(0, 'rgba(212, 175, 55, 0.85)');
    grad.addColorStop(0.6, 'rgba(212, 175, 55, 0.35)');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    vizCtx.fillStyle = grad;
    vizCtx.beginPath();
    vizCtx.arc(cx, cy, pulse * 1.4, 0, Math.PI * 2);
    vizCtx.fill();

    // Spirale dorata di barre radiali (medi/alti)
    const bars = 48;
    vizCtx.lineCap = 'round';
    for (let i = 0; i < bars; i++) {
      // Sample uniformemente sui bin (scartando il sub-bass piatto)
      const binIdx = Math.floor((i / bars) * (bins - 6)) + 3;
      const val = vizData[binIdx] / 255;
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const innerR = 14 + (bass / 255) * 4;
      const length = 6 + val * (maxR - innerR - 2);

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * (innerR + length);
      const y2 = cy + Math.sin(angle) * (innerR + length);

      const alpha = 0.45 + val * 0.55;
      vizCtx.strokeStyle = 'rgba(212, 175, 55, ' + alpha.toFixed(2) + ')';
      vizCtx.lineWidth = 1.6;
      vizCtx.beginPath();
      vizCtx.moveTo(x1, y1);
      vizCtx.lineTo(x2, y2);
      vizCtx.stroke();
    }

    // Cerchio esterno sottile reattivo agli alti
    const ringAlpha = 0.15 + (high / 255) * 0.45;
    vizCtx.strokeStyle = 'rgba(212, 175, 55, ' + ringAlpha.toFixed(2) + ')';
    vizCtx.lineWidth = 1;
    vizCtx.beginPath();
    vizCtx.arc(cx, cy, maxR - 1, 0, Math.PI * 2);
    vizCtx.stroke();
  }

  // ============================================================
  // Fade in/out morbido del volume
  // ============================================================
  function fadeVolume(targetVolume, durationMs, onComplete) {
    if (!audioEl) return;
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }

    const startVol = audioEl.volume;
    const delta = targetVolume - startVol;
    if (Math.abs(delta) < 0.005) {
      audioEl.volume = targetVolume;
      if (onComplete) onComplete();
      return;
    }

    let step = 0;
    const stepMs = Math.max(20, durationMs / FADE_STEPS);

    fadeTimer = setInterval(function() {
      step++;
      const t = Math.min(1, step / FADE_STEPS);
      const eased = t * t * (3 - 2 * t);
      const v = startVol + delta * eased;
      audioEl.volume = Math.max(0, Math.min(1, v));
      if (step >= FADE_STEPS) {
        clearInterval(fadeTimer);
        fadeTimer = null;
        audioEl.volume = Math.max(0, Math.min(1, targetVolume));
        if (onComplete) onComplete();
      }
    }, stepMs);
  }

  // ============================================================
  // Play / Pause
  // ============================================================
  function enable() {
    if (!audioEl) createAudio();
    if (audioFailed) {
      showError('Audio non disponibile');
      return;
    }

    // Setup visualizer al primo play (dopo gesture utente)
    if (!audioCtx) {
      setupVisualizer();
    }

    const playPromise = audioEl.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function(e) {
        warn('Browser ha bloccato il play:', e.message);
        showError('Click bloccato. Riprova.');
        isPlaying = false;
        updateButton();
      });
    }
    fadeVolume(TARGET_VOL, FADE_DUR_MS);
    isPlaying = true;
    savePref(true);
    updateButton();
    startVisualizer();
    log('Play attivato');
  }

  function disable() {
    if (!audioEl) {
      isPlaying = false;
      savePref(false);
      updateButton();
      return;
    }
    fadeVolume(0, FADE_DUR_MS * 0.6, function() {
      try { audioEl.pause(); } catch (e) {}
    });
    isPlaying = false;
    savePref(false);
    updateButton();
    stopVisualizer();
    log('Play disattivato');
  }

  function toggleAudio() {
    log('Toggle clicked. Stato:', { isPlaying: isPlaying, audioReady: audioReady, audioFailed: audioFailed });
    if (isPlaying) disable(); else enable();
  }

  // ============================================================
  // UI bottone
  // ============================================================
  let btn = null;
  function createButton() {
    btn = document.createElement('button');
    btn.className = 'temple-audio-btn';
    btn.setAttribute('aria-label', 'Attiva o disattiva musica del Tempio');
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('type', 'button');
    btn.innerHTML =
      '<svg class="aud-icon aud-icon--off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M11 5L6 9H2v6h4l5 4z" fill="currentColor" fill-opacity="0.25"/>' +
        '<line x1="22" y1="9" x2="16" y2="15" stroke-width="2.4"/>' +
        '<line x1="16" y1="9" x2="22" y2="15" stroke-width="2.4"/>' +
      '</svg>' +
      '<svg class="aud-icon aud-icon--on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M11 5L6 9H2v6h4l5 4z" fill="currentColor" fill-opacity="0.25"/>' +
        '<path d="M15.5 8.5a5 5 0 0 1 0 7"/>' +
        '<path d="M19 5a10 10 0 0 1 0 14"/>' +
      '</svg>' +
      '<span class="temple-audio-btn__label">Musica del Tempio</span>';
    btn.addEventListener('click', toggleAudio);
    document.body.appendChild(btn);
    updateButton();
    log('Bottone audio creato');
  }

  function updateButton() {
    if (!btn) return;
    btn.classList.toggle('is-playing', isPlaying);
    btn.classList.remove('is-loading', 'is-error');
    btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    const lbl = btn.querySelector('.temple-audio-btn__label');
    if (lbl) {
      lbl.textContent = isPlaying
        ? 'Musica attiva · click per spegnere'
        : 'Musica del Tempio · click per ascoltare';
    }
  }

  function showError(msg) {
    if (!btn) return;
    btn.classList.remove('is-playing', 'is-loading');
    btn.classList.add('is-error');
    const lbl = btn.querySelector('.temple-audio-btn__label');
    if (lbl) lbl.textContent = '⚠ ' + msg;
    btn.setAttribute('data-force-tooltip', '1');
    setTimeout(function() {
      btn.removeAttribute('data-force-tooltip');
    }, 6000);
  }

  // ============================================================
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    createButton();
    log('Pronto. Cerca file in: ' + getBasePath() + 'assets/audio/temple-ambient.mp3');
  }
  init();
})();
