/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Analitica privacy-friendly via Goatcounter
   ============================================================
   COME ATTIVARLO:
   1. Vai su https://www.goatcounter.com/signup e crea un account
   2. Scegli un subdomain (es. "loggia1550")
   3. La tua URL sarà: https://loggia1550.goatcounter.com
   4. Sostituisci la stringa qui sotto col tuo subdomain reale
   5. Commit + push → analitica attiva
   ============================================================ */

(function() {
  'use strict';

  // === CONFIGURAZIONE ===
  // Sostituisci con il TUO subdomain Goatcounter (senza .goatcounter.com)
  // Lascialo a stringa vuota '' per disabilitare l'analitica
  const GOATCOUNTER_CODE = '';  // es. 'loggia1550'

  if (!GOATCOUNTER_CODE) return;

  // Setup variabile globale richiesta da Goatcounter
  window.goatcounter = {
    endpoint: 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count'
  };

  // Carica lo script di Goatcounter (asincrono, non blocca)
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
  document.head.appendChild(script);
})();
