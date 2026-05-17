/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Motore del Quiz del Vero Massone
   Include: Copia link risultato (A), Tracking localStorage (B),
            Modalità cronometrata 45s a prova (C)
   ============================================================ */

(function() {
  'use strict';

  const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI',
                 'XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII'];
  const TOTAL = window.QUIZ_PROVE.length;
  const STORAGE_KEY = 'loggia1550_quiz_v1';
  const TIME_PER_QUESTION = 45; // secondi per prova in modalità cronometrata

  const stageEl    = document.getElementById('stage');
  const progressEl = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');

  const state = {
    index: -1,         // -1 = landing; 0..21 = prove; 22 = result
    score: 0,
    answers: [],
    timedMode: false,
    timer: null,       // ID del setInterval del countdown
    timeLeft: 0,       // secondi rimasti per la prova corrente
    sharedMode: false  // true se siamo arrivati con ?score=N
  };

  // ============================================================
  // LOCALSTORAGE: storia personale dei tentativi
  // ============================================================
  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
             { attempts: [], settings: { timedMode: false } };
    } catch (e) {
      return { attempts: [], settings: { timedMode: false } };
    }
  }
  function saveStore(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function getBestScore() {
    const s = loadStore();
    if (!s.attempts || s.attempts.length === 0) return null;
    return s.attempts.reduce((max, a) => Math.max(max, a.score || 0), 0);
  }
  function getAttemptCount() {
    return (loadStore().attempts || []).length;
  }
  function recordAttempt(score, total, timed) {
    const s = loadStore();
    s.attempts = s.attempts || [];
    s.attempts.push({
      score, total, timed,
      date: new Date().toISOString()
    });
    // Mantieni solo gli ultimi 50 tentativi
    if (s.attempts.length > 50) s.attempts = s.attempts.slice(-50);
    saveStore(s);
  }
  function updateSettings(patch) {
    const s = loadStore();
    s.settings = Object.assign({}, s.settings, patch);
    saveStore(s);
    return s.settings;
  }

  // ============================================================
  // UTILITY
  // ============================================================
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function updateProgress() {
    if (state.index < 0 || state.index >= TOTAL) {
      progressEl.style.width = (state.index < 0 ? 0 : 100) + '%';
      progressLabel.textContent = state.index < 0 ? '' :
        (state.index >= TOTAL ? '✓ Soglia Varcata' : '');
      return;
    }
    const pct = (state.index / TOTAL) * 100;
    progressEl.style.width = pct + '%';
    progressLabel.textContent = `Prova ${ROMAN[state.index + 1]} di XXII`;
  }

  // ============================================================
  // TIMER DELLA PROVA (modalità cronometrata)
  // ============================================================
  function startQuestionTimer() {
    if (!state.timedMode) return;
    state.timeLeft = TIME_PER_QUESTION;
    renderTimerBar();
    state.timer = setInterval(() => {
      state.timeLeft--;
      renderTimerBar();
      if (state.timeLeft <= 0) {
        stopQuestionTimer();
        // Tempo scaduto: registra come errata e procedi
        onTimeout();
      }
    }, 1000);
  }
  function stopQuestionTimer() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }
  function renderTimerBar() {
    const bar = document.getElementById('timer-bar-fill');
    const txt = document.getElementById('timer-text');
    if (bar) {
      const pct = (state.timeLeft / TIME_PER_QUESTION) * 100;
      bar.style.width = pct + '%';
      bar.classList.toggle('timer--warning', state.timeLeft <= 15);
      bar.classList.toggle('timer--danger',  state.timeLeft <= 5);
    }
    if (txt) {
      txt.textContent = state.timeLeft + 's';
    }
  }
  function onTimeout() {
    const i = state.index;
    if (i < 0 || i >= TOTAL) return;
    // Se non ha già risposto, segna come errata (choice = -1)
    if (!state.answers[i]) {
      state.answers[i] = { choice: -1, correct: false, timedOut: true };
      // Mostra feedback timeout breve, poi auto-procedi
      const fb = document.getElementById('prova-feedback');
      const prova = window.QUIZ_PROVE[i];
      if (fb) {
        fb.classList.remove('correct');
        fb.classList.add('wrong');
        fb.innerHTML = `
          <div class="prova-feedback__verdict">⌛ Tempo scaduto</div>
          La risposta corretta era: <strong>${escapeHtml(prova.options[prova.correct])}</strong>.<br>
          ${escapeHtml(prova.explanation)}
        `;
        fb.classList.add('show');
      }
      // Disabilita le opzioni e evidenzia la corretta
      document.querySelectorAll('.prova-option').forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === prova.correct) btn.classList.add('correct');
      });
      // Mostra pulsante "Procedi"
      const acts = document.getElementById('quiz-actions');
      const isLast = (i === TOTAL - 1);
      if (acts) {
        acts.innerHTML = `
          <button class="quiz-btn quiz-btn--primary" id="btn-next" type="button">${isLast ? '⚜ Compi la Soglia' : 'Procedi ▸'}</button>
        `;
        document.getElementById('btn-next').addEventListener('click', next);
      }
    }
  }

  // ============================================================
  // RENDERING
  // ============================================================
  function renderLanding() {
    const best = getBestScore();
    const attempts = getAttemptCount();
    const settings = loadStore().settings || {};
    const timedDefault = settings.timedMode === true;

    let bestBlock = '';
    if (best !== null) {
      bestBlock = `
        <div class="quiz-bestscore">
          <span class="quiz-bestscore__label">Tuo miglior punteggio</span>
          <span class="quiz-bestscore__value"><strong>${best}</strong> / 22</span>
          <span class="quiz-bestscore__sub">${attempts} tentativ${attempts === 1 ? 'o' : 'i'}</span>
        </div>
      `;
    }

    stageEl.innerHTML = `
      <div class="quiz-landing stage-fade-in">
        <a class="quiz-back" href="../index.html">← Torna al Tempio</a>
        <div class="quiz-landing__symbol" aria-hidden="true">⚜</div>
        <h1 class="quiz-title">IL QUIZ DEL VERO MASSONE</h1>
        <div class="quiz-subtitle">~ Ordo Ab Chao ~</div>
        <p class="quiz-narration">Tu che bussi tre volte alla porta del Tempio, sappi che la conoscenza si conquista, non si riceve.</p>
        <p class="quiz-narration">Ventidue prove ti attendono, attraverso le sale segrete dove la luce delle stelle si fonde con quella dei candelabri sacri. Ad ogni passo, un velo si squarcerà.</p>
        <p class="quiz-narration">Solo i degni ascenderanno al Sublime Grado. Gli altri resteranno alla soglia, profani tra i profani.</p>
        <p class="quiz-narration quiz-narration--whisper">~ Sii pronto. La porta sta per aprirsi. ~</p>

        ${bestBlock}

        <div class="quiz-timer-toggle">
          <label class="quiz-toggle">
            <input type="checkbox" id="toggle-timed" ${timedDefault ? 'checked' : ''}>
            <span class="quiz-toggle__track"><span class="quiz-toggle__thumb"></span></span>
            <span class="quiz-toggle__label">Modalità cronometrata · <em>${TIME_PER_QUESTION}s a prova</em></span>
          </label>
        </div>

        <div class="quiz-actions">
          <button class="quiz-btn quiz-btn--primary" id="btn-start">⚜ Varca la Soglia</button>
        </div>
        <p class="quiz-narration quiz-narration--whisper" style="margin-top:60px;font-size:11px;letter-spacing:2px;">Realizzato per la Loggia «Libero Pensiero» n. 1550</p>
      </div>
    `;
    document.getElementById('btn-start').addEventListener('click', start);
    const tt = document.getElementById('toggle-timed');
    if (tt) {
      tt.addEventListener('change', (e) => {
        updateSettings({ timedMode: e.target.checked });
      });
    }
    updateProgress();
  }

  function renderProva() {
    const i = state.index;
    const prova = window.QUIZ_PROVE[i];
    const proLabel = `PROVA ${ROMAN[i + 1]} DI XXII`;

    const timerBar = state.timedMode ? `
      <div class="quiz-timer" aria-label="Tempo rimanente">
        <div class="quiz-timer__bar"><div class="quiz-timer__fill" id="timer-bar-fill"></div></div>
        <span class="quiz-timer__text" id="timer-text">${TIME_PER_QUESTION}s</span>
      </div>
    ` : '';

    stageEl.innerHTML = `
      <div class="quiz-prova stage-fade-in">
        <a class="quiz-back" href="../index.html">← Esci dal Quiz</a>
        ${timerBar}
        <div class="prova-label">${proLabel}</div>
        <h2 class="prova-name">${escapeHtml(prova.name)}</h2>
        <p class="prova-narration">${escapeHtml(prova.narration)}</p>
        ${(window.QUIZ_ILLUSTRATIONS && window.QUIZ_ILLUSTRATIONS[i]) ? `<div class="prova-illustration">${window.QUIZ_ILLUSTRATIONS[i]}</div>` : ''}
        ${prova.epigraph ? `<blockquote class="prova-epigraph">${escapeHtml(prova.epigraph)}</blockquote>` : ''}
        <p class="prova-question">${escapeHtml(prova.question)}</p>
        <div class="prova-options" id="prova-options" role="listbox" aria-label="Opzioni di risposta">
          ${prova.options.map((opt, idx) => `
            <button class="prova-option" data-idx="${idx}" type="button">
              <span class="prova-option__bullet" aria-hidden="true">${'ABCD'[idx]}</span>
              <span>${escapeHtml(opt)}</span>
            </button>
          `).join('')}
        </div>
        <div class="prova-feedback" id="prova-feedback" role="status" aria-live="polite"></div>
        <div class="quiz-actions" id="quiz-actions"></div>
      </div>
    `;

    document.querySelectorAll('.prova-option').forEach(btn => {
      btn.addEventListener('click', () => onAnswer(parseInt(btn.dataset.idx, 10)));
    });
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Avvia il timer se modalità cronometrata
    startQuestionTimer();
  }

  function onAnswer(choice) {
    const i = state.index;
    const prova = window.QUIZ_PROVE[i];
    const correct = (choice === prova.correct);

    // Se ha già risposto (timeout già scattato), ignora
    if (state.answers[i]) return;

    stopQuestionTimer();

    state.answers[i] = { choice, correct };
    if (correct) state.score++;

    document.querySelectorAll('.prova-option').forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === prova.correct) btn.classList.add('correct');
      else if (idx === choice)   btn.classList.add('wrong');
    });

    const fb = document.getElementById('prova-feedback');
    fb.classList.remove('correct', 'wrong');
    fb.classList.add(correct ? 'correct' : 'wrong');
    fb.innerHTML = `
      <div class="prova-feedback__verdict">${correct ? '✓ Risposta giusta' : '✗ Velo non squarciato'}</div>
      ${escapeHtml(prova.explanation)}
    `;
    requestAnimationFrame(() => fb.classList.add('show'));

    const acts = document.getElementById('quiz-actions');
    const isLast = (i === TOTAL - 1);
    acts.innerHTML = `
      <button class="quiz-btn quiz-btn--ghost" id="btn-back-temple" type="button">Ripeti il Rito</button>
      <button class="quiz-btn quiz-btn--primary" id="btn-next" type="button">${isLast ? '⚜ Compi la Soglia' : 'Procedi ▸'}</button>
    `;
    document.getElementById('btn-next').addEventListener('click', next);
    document.getElementById('btn-back-temple').addEventListener('click', resetConfirm);
    document.getElementById('btn-next').focus();
  }

  function resetConfirm() {
    if (confirm('Sei sicuro di voler ripetere il Rito dall\'inizio? Il tuo cammino sarà azzerato.')) {
      reset();
    }
  }

  function next() {
    stopQuestionTimer();
    state.index++;
    if (state.index >= TOTAL) renderResult();
    else renderProva();
  }

  function start() {
    state.index = 0;
    state.score = 0;
    state.answers = [];
    state.sharedMode = false;
    // Leggi setting cronometrata aggiornato
    state.timedMode = !!(loadStore().settings && loadStore().settings.timedMode);
    renderProva();
  }

  function reset() {
    stopQuestionTimer();
    state.index = -1;
    state.score = 0;
    state.answers = [];
    state.sharedMode = false;
    // Rimuovo eventuali query string ?score=
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    renderLanding();
  }

  function getVerdict(score) {
    if (score === 22) return { symbol: '⚜', title: 'SUBLIME GRADO',
      verdict: 'Hai squarciato tutti i ventidue veli. Le Colonne tacciono in tuo onore: tu sei il Vero Massone. La Luce della Saggezza, la Forza che rende saldi e la Bellezza che tutto compie ti accompagnino sempre.' };
    if (score >= 18) return { symbol: '☉', title: 'MAESTRO DELLE PROVE',
      verdict: `Ventidue prove, ${score} squarci di luce. Cammini con passo sicuro tra le Colonne: pochi ti sono pari. Ancora qualche tornata e siederai all'Oriente.` };
    if (score >= 14) return { symbol: '△', title: 'APPRENDISTA AVANZATO',
      verdict: `${score} prove superate su ventidue. Il sentiero ti riconosce. La pietra è ben sgrossata, ma il mazzuolo e lo scalpello attendono ancora il tuo lavoro.` };
    if (score >= 10) return { symbol: '☽', title: 'COMPAGNO IN CAMMINO',
      verdict: `${score} prove superate su ventidue. La metà del Tempio ti si è rivelata; l'altra metà esige ancora studio e meditazione. Il Rituale è il tuo migliore Fratello: rileggilo.` };
    return { symbol: '◇', title: 'PROFANO SULLA SOGLIA',
      verdict: `${score} prove superate su ventidue. Sei rimasto alla soglia, profano tra i profani. Non scoraggiarti: ogni Maestro è stato Apprendista, ogni Apprendista è stato profano. Ritorna al Rituale.` };
  }

  function renderResult() {
    stopQuestionTimer();
    const score = state.score;
    const { symbol, title, verdict } = getVerdict(score);

    // === Registra tentativo (solo se non siamo in shared mode) ===
    let newRecord = false;
    let prevBest = null;
    if (!state.sharedMode) {
      prevBest = getBestScore();
      recordAttempt(score, TOTAL, state.timedMode);
      newRecord = (prevBest === null) || (score > prevBest);
    }

    // Banner "nuovo record"
    let recordBanner = '';
    if (!state.sharedMode && newRecord && score > 0) {
      recordBanner = `<div class="quiz-result__record">✦ Nuovo miglior punteggio! ${prevBest !== null ? `(precedente: ${prevBest}/${TOTAL})` : ''} ✦</div>`;
    }

    const sharedTag = state.sharedMode
      ? `<div class="quiz-result__shared-tag">~ Risultato condiviso ~</div>`
      : '';

    stageEl.innerHTML = `
      <div class="quiz-result stage-fade-in">
        ${sharedTag}
        <div class="result-symbol" aria-hidden="true">${symbol}</div>
        <h2 class="result-title">${escapeHtml(title)}</h2>
        <div class="result-score"><strong>${score}</strong> / 22</div>
        ${recordBanner}
        <p class="result-verdict">${escapeHtml(verdict)}</p>

        <div class="quiz-share">
          <button class="quiz-btn quiz-btn--ghost quiz-btn--share" id="btn-copy-link" type="button">
            <span aria-hidden="true">⎘</span>&nbsp;&nbsp;Copia link al risultato
          </button>
          <span class="quiz-share__feedback" id="share-feedback" aria-live="polite"></span>
        </div>

        <div class="quiz-actions">
          <button class="quiz-btn quiz-btn--ghost" id="btn-replay" type="button">${state.sharedMode ? 'Tenta il Quiz' : 'Ripeti il Rito'}</button>
          <a class="quiz-btn quiz-btn--primary" href="../index.html">⚜ Ritorna al Tempio</a>
        </div>
      </div>
    `;
    document.getElementById('btn-replay').addEventListener('click', reset);
    document.getElementById('btn-copy-link').addEventListener('click', copyResultLink);

    state.index = TOTAL;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // CONDIVISIONE: copia link al risultato
  // ============================================================
  async function copyResultLink() {
    const url = window.location.origin + window.location.pathname + '?score=' + state.score;
    const fb = document.getElementById('share-feedback');
    try {
      await navigator.clipboard.writeText(url);
      if (fb) { fb.textContent = '✓ Link copiato!'; fb.classList.add('show'); }
    } catch (e) {
      // Fallback: usa textarea temporaneo
      try {
        const ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        if (fb) { fb.textContent = '✓ Link copiato!'; fb.classList.add('show'); }
      } catch (err) {
        if (fb) { fb.textContent = 'Impossibile copiare. URL: ' + url; fb.classList.add('show'); }
      }
    }
    if (fb) {
      setTimeout(() => fb.classList.remove('show'), 2500);
    }
  }

  // ============================================================
  // ENTRATA: gestisco eventuale ?score=N nell'URL
  // ============================================================
  function checkSharedUrl() {
    const params = new URLSearchParams(window.location.search);
    const s = parseInt(params.get('score'), 10);
    if (!isNaN(s) && s >= 0 && s <= TOTAL) {
      state.sharedMode = true;
      state.score = s;
      state.answers = [];
      renderResult();
      return true;
    }
    return false;
  }

  // ============================================================
  // GESTIONE TASTIERA
  // ============================================================
  document.addEventListener('keydown', function(e) {
    if (state.index >= 0 && state.index < TOTAL) {
      const idx = ['1','2','3','4'].indexOf(e.key);
      if (idx > -1) {
        const btns = document.querySelectorAll('.prova-option:not(:disabled)');
        if (btns[idx]) btns[idx].click();
      } else if (e.key === 'Enter') {
        const btn = document.getElementById('btn-next');
        if (btn) btn.click();
      }
    }
  });

  // ============================================================
  // AVVIO
  // ============================================================
  if (!checkSharedUrl()) {
    renderLanding();
  }
})();
