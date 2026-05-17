/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Page polish: fade-in pagina, bottone Torna Su, smooth scroll
   per i link interni, animazioni d'apparizione progressive.
   ============================================================ */
(function() {
  'use strict';

  // ============================================================
  // 1) FADE-IN della pagina al caricamento
  // ============================================================
  function pageFadeIn() {
    // Aggiunge una classe iniziale e la rimuove dopo un frame, così
    // l'opacità viene transizionata via CSS.
    document.documentElement.classList.add('page-fade-init');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        document.documentElement.classList.add('page-fade-in');
      });
    });
  }

  // ============================================================
  // 2) FADE-OUT prima del cambio pagina
  //    Intercetto i link interni (.html locali) per fade-out morbido.
  // ============================================================
  function attachPageFadeOut() {
    const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (PREFERS_REDUCED) return;

    document.addEventListener('click', function(e) {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // Solo link interni .html (no #, no esterni, no target _blank)
      if (a.target === '_blank') return;
      if (a.getAttribute('rel') && a.getAttribute('rel').includes('external')) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (/^https?:\/\//i.test(href)) {
        // Esterno o altro dominio
        try {
          const u = new URL(href, window.location.href);
          if (u.origin !== window.location.origin) return;
        } catch (err) { return; }
      }
      if (!/\.html(\?|#|$)/.test(href) && !href.endsWith('/')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      document.documentElement.classList.add('page-fade-out');
      setTimeout(function() {
        window.location.href = href;
      }, 280);
    });
  }

  // ============================================================
  // 3) BOTTONE TORNA SU — appare dopo aver scrollato 600px
  // ============================================================
  function backToTopButton() {
    // Non sulla home (canvas a tutta pagina, scroll governato dallo scrollytelling)
    if (document.getElementById('canvas3d')) return;
    // Solo se la pagina è lunga abbastanza
    if (document.documentElement.scrollHeight < window.innerHeight * 1.8) return;

    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Torna in cima alla pagina');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<polyline points="6 14 12 8 18 14"/>' +
      '</svg>';
    document.body.appendChild(btn);

    function onScroll() {
      const show = window.scrollY > 600;
      btn.classList.toggle('is-visible', show);
    }
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() { onScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    onScroll();

    btn.addEventListener('click', function() {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? 'auto' : 'smooth'
      });
    });
  }

  // ============================================================
  // 4) APPARIZIONE PROGRESSIVA di elementi tramite IntersectionObserver
  //    Aggiunge automaticamente la classe .is-revealed a:
  //    .about-card, .officer, .glossary-list dt, etc.
  // ============================================================
  function progressiveReveal() {
    if (!('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll(
      '.about-card, .officer, .about-section, .about-callout, .glossary-list dt, .glossary-list dd, .card, .quiz-result-card'
    );
    if (!targets.length) return;

    targets.forEach(function(el) { el.classList.add('reveal-pending'); });

    const io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });

    targets.forEach(function(el) { io.observe(el); });
  }

  // ============================================================
  // 5) SMOOTH SCROLL per i link interni con hash
  // ============================================================
  function smoothInPageScroll() {
    document.addEventListener('click', function(e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      // Aggiorna l'URL senza scroll jump
      history.replaceState(null, '', '#' + id);
    });
  }

  // ============================================================
  function init() {
    pageFadeIn();
    attachPageFadeOut();
    backToTopButton();
    progressiveReveal();
    smoothInPageScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
