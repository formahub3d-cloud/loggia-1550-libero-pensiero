/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Audio ambientale del Tempio — HTML5 Audio (file locale)
   Cerca: assets/audio/temple-ambient.mp3 (o .ogg in fallback)
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

  // ============================================================
  function getBasePath() {
    // index.html è nella root; le altre pagine sono in /pages/
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

    // Costruisco la <source> con MP3 + OGG fallback
    // (in realtà l'elemento Audio supporta solo .src; uso fallback su error)
    audioEl.src = base + 'assets/audio/temple-ambient.mp3';

    audioEl.addEventListener('canplaythrough', function() {
      audioReady = true;
      log('Audio caricato e pronto (' + Math.round(audioEl.duration) + 's)');
    });

    audioEl.addEventListener('error', function() {
      // Tento il fallback su .ogg
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
      // smoothstep easing
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
