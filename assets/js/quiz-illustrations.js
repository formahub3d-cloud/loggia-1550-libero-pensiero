/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Illustrazioni 2D per ognuna delle 22 prove del Quiz
   Style: viewBox 600x220, sfondo blu notte, linee dorate
   ============================================================ */

(function() {
  'use strict';

  const BG = 'rgba(10, 21, 69, 0.55)';
  const GOLD = '#c8a868';
  const GOLD_DIM = '#8a7044';
  const FILL_SUBTLE = 'rgba(212, 184, 122, 0.10)';
  const FILL_MED = 'rgba(212, 184, 122, 0.22)';

  function svg(inner) {
    return `<svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="prova-illustration__svg" aria-hidden="true">
      <rect width="600" height="220" fill="${BG}" rx="3"/>
      ${inner}
    </svg>`;
  }

  // === 1 — L'Atrio dei Profani: due colonne + porta ===
  const i01 = svg(`
    <rect x="225" y="50" width="22" height="140" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="353" y="50" width="22" height="140" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="260" y="80" width="80" height="110" fill="none" stroke="${GOLD}" stroke-width="1.5"/>
    <text x="300" y="142" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="14">PORTA</text>
  `);

  // === 2 — Le Due Colonne (J e B) ===
  const i02 = svg(`
    <rect x="195" y="55" width="48" height="130" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.5"/>
    <rect x="187" y="42" width="64" height="16" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <rect x="187" y="183" width="64" height="14" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <text x="219" y="135" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="40">J</text>
    <rect x="357" y="55" width="48" height="130" fill="rgba(26,26,37,0.85)" stroke="${GOLD}" stroke-width="1.5"/>
    <rect x="349" y="42" width="64" height="16" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <rect x="349" y="183" width="64" height="14" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <text x="381" y="135" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="40">B</text>
  `);

  // === 3 — Le Statue Tutelari (due figure tutelari) ===
  const i03 = svg(`
    <rect x="190" y="125" width="80" height="55" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.5"/>
    <ellipse cx="230" cy="100" rx="22" ry="32" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <circle cx="230" cy="75" r="10" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.3"/>
    <rect x="330" y="125" width="80" height="55" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.5"/>
    <rect x="358" y="68" width="22" height="60" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <circle cx="369" cy="55" r="11" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="300" y="50" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ Le due statue tutelari ~</text>
  `);

  // === 4 — L'Ora dei Lavori (sole sopra l'orizzonte, generico) ===
  let rays4 = '';
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI - Math.PI/14;
    const x1 = 300 + Math.cos(a-Math.PI) * 55, y1 = 145 + Math.sin(a-Math.PI) * 55;
    const x2 = 300 + Math.cos(a-Math.PI) * 78, y2 = 145 + Math.sin(a-Math.PI) * 78;
    rays4 += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-width="${k%3===0?2.2:1.2}"/>`;
  }
  const i04 = svg(`
    ${rays4}
    <path d="M 245 145 A 55 55 0 0 1 355 145" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <line x1="200" y1="145" x2="400" y2="145" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="300" y="50" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ Le ore rituali ~</text>
  `);

  // === 5 — L'Età dell'Apprendista (clessidra generica del tempo iniziatico) ===
  const i05 = svg(`
    <path d="M 240 60 L 360 60 L 320 110 L 360 175 L 240 175 L 280 110 Z" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.8"/>
    <line x1="245" y1="60" x2="355" y2="60" stroke="${GOLD}" stroke-width="2.5"/>
    <line x1="245" y1="175" x2="355" y2="175" stroke="${GOLD}" stroke-width="2.5"/>
    <circle cx="300" cy="118" r="2.5" fill="${GOLD}"/>
    <circle cx="296" cy="125" r="2" fill="${GOLD}"/>
    <circle cx="304" cy="130" r="2" fill="${GOLD}"/>
    <path d="M 285 145 Q 300 138 315 145 L 320 175 L 280 175 Z" fill="${FILL_MED}" opacity="0.6"/>
    <text x="300" y="200" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">~ Il tempo dell'Apprendista ~</text>
  `);

  // === 6 — Le Tre Luci (Sapienza/Forza/Bellezza) ===
  function flame(cx, cy, scale) {
    const s = scale || 1;
    return `<path d="M ${cx},${cy-22*s} Q ${cx-12*s},${cy-5*s} ${cx-8*s},${cy+10*s} Q ${cx-4*s},${cy+18*s} ${cx},${cy+18*s} Q ${cx+4*s},${cy+18*s} ${cx+8*s},${cy+10*s} Q ${cx+12*s},${cy-5*s} ${cx},${cy-22*s} Z" fill="rgba(255,233,166,0.35)" stroke="${GOLD}" stroke-width="1.3"/>`;
  }
  const i06 = svg(`
    ${flame(300, 75, 1.2)}
    ${flame(230, 155, 1.0)}
    ${flame(370, 155, 1.0)}
    <text x="300" y="115" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="11">SAPIENTIA</text>
    <text x="230" y="195" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="11">ROBUR</text>
    <text x="370" y="195" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="11">PULCHRITUDO</text>
  `);

  // === 7 — Pavimento Mosaico (scacchi) ===
  let tiles7 = '';
  const cols = 14, rows = 5;
  const tw = 320 / cols, th = 100 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const black = (r + c) % 2 === 0;
      const x = 140 + c * tw, y = 60 + r * th;
      tiles7 += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="${black ? '#0a0604' : '#faf5e6'}" stroke="${GOLD_DIM}" stroke-width="0.4"/>`;
    }
  }
  const i07 = svg(`
    ${tiles7}
    <rect x="138" y="58" width="324" height="104" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
  `);

  // === 8 — L'Ara dei Giuramenti (altare con tappeto, simbolo neutro) ===
  const i08 = svg(`
    <rect x="200" y="155" width="200" height="20" fill="rgba(70,130,200,0.25)" stroke="${GOLD}" stroke-width="1.2"/>
    <rect x="225" y="105" width="150" height="55" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.8"/>
    <rect x="225" y="98" width="150" height="10" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.3"/>
    <rect x="240" y="120" width="120" height="2" fill="${GOLD}"/>
    <rect x="240" y="135" width="120" height="2" fill="${GOLD}"/>
    <rect x="240" y="150" width="120" height="2" fill="${GOLD}"/>
    <text x="300" y="60" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ L'Ara dei Giuramenti ~</text>
  `);

  // === 9 — Delta Luminoso (triangolo radiante, simbolo vuoto) ===
  let rays9 = '';
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const x1 = 300 + Math.cos(a) * 75, y1 = 110 + Math.sin(a) * 75;
    const x2 = 300 + Math.cos(a) * (k%2===0?100:90), y2 = 110 + Math.sin(a) * (k%2===0?100:90);
    rays9 += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-width="${k%2===0?1.6:0.9}"/>`;
  }
  const i09 = svg(`
    ${rays9}
    <polygon points="300,52 246,160 354,160" fill="rgba(212,184,122,0.18)" stroke="${GOLD}" stroke-width="2.2"/>
    <polygon points="300,72 263,150 337,150" fill="none" stroke="${GOLD}" stroke-width="1" stroke-dasharray="2 3"/>
    <text x="300" y="200" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ Il Delta Luminoso ~</text>
  `);

  // === 10 — Quattro Viaggi (Terra/Acqua/Aria/Fuoco) ===
  const i10 = svg(`
    <rect x="115" y="65" width="80" height="80" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.5"/>
    <text x="155" y="180" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">TERRA</text>
    <text x="155" y="115" text-anchor="middle" fill="${GOLD}" font-size="32">▽</text>
    <path d="M 225 90 Q 240 75 255 90 T 285 90 T 315 90" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
    <path d="M 225 110 Q 240 95 255 110 T 285 110 T 315 110" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
    <path d="M 225 130 Q 240 115 255 130 T 285 130 T 315 130" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
    <text x="270" y="180" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">ACQUA</text>
    <path d="M 350 75 Q 380 80 380 95 T 350 105" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
    <path d="M 350 100 Q 390 105 390 120 T 350 130" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
    <text x="380" y="180" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">ARIA</text>
    ${flame(465, 110, 2.2)}
    <text x="465" y="180" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">FUOCO</text>
  `);

  // === 11 — V.I.T.R.I.O.L. (solo acronimo + simboli ermetici, traduzione rimossa) ===
  const i11 = svg(`
    <circle cx="300" cy="110" r="58" fill="none" stroke="${GOLD}" stroke-width="1.4" stroke-dasharray="3 4"/>
    <text x="300" y="120" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="38" letter-spacing="5">V.I.T.R.I.O.L.</text>
    <text x="160" y="60" text-anchor="middle" fill="${GOLD_DIM}" font-size="28">☿</text>
    <text x="440" y="60" text-anchor="middle" fill="${GOLD_DIM}" font-size="28">☉</text>
    <text x="160" y="180" text-anchor="middle" fill="${GOLD_DIM}" font-size="28">🜔</text>
    <text x="440" y="180" text-anchor="middle" fill="${GOLD_DIM}" font-size="28">🜍</text>
    <text x="300" y="200" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">~ Formula ermetica ~</text>
  `);

  // === 12 — Catena d'Unione (anelli intrecciati) ===
  function ringLink(cx, cy, w, h) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
  }
  const i12 = svg(`
    ${ringLink(220, 110, 28, 18)}
    ${ringLink(266, 110, 28, 18)}
    ${ringLink(312, 110, 28, 18)}
    ${ringLink(358, 110, 28, 18)}
    ${ringLink(404, 110, 28, 18)}
    <text x="300" y="180" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">~ CATENA D'UNIONE ~</text>
  `);

  // === 13 — Tronco della Vedova (sacco nero) ===
  const i13 = svg(`
    <path d="M 260 90 Q 240 95 245 130 L 252 195 Q 300 200 348 195 L 355 130 Q 360 95 340 90 Z" fill="rgba(20,15,10,0.88)" stroke="${GOLD}" stroke-width="1.8"/>
    <line x1="260" y1="90" x2="265" y2="80" stroke="${GOLD}" stroke-width="2"/>
    <line x1="280" y1="85" x2="278" y2="73" stroke="${GOLD}" stroke-width="2"/>
    <line x1="300" y1="83" x2="300" y2="70" stroke="${GOLD}" stroke-width="2"/>
    <line x1="320" y1="85" x2="322" y2="73" stroke="${GOLD}" stroke-width="2"/>
    <line x1="340" y1="90" x2="335" y2="80" stroke="${GOLD}" stroke-width="2"/>
    <path d="M 260 90 Q 300 78 340 90" fill="none" stroke="${GOLD}" stroke-width="2"/>
    <text x="300" y="55" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">TRONCO DELLA VEDOVA</text>
  `);

  // === 14 — Pietra Grezza (solo la pietra, attrezzi rimossi per non rivelare la risposta) ===
  const i14 = svg(`
    <path d="M 215 130 L 240 80 L 290 70 L 350 80 L 380 110 L 385 155 L 360 185 L 290 195 L 230 180 L 210 155 Z" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="2"/>
    <path d="M 240 80 L 290 70 L 280 105 Z" fill="rgba(0,0,0,0.18)" stroke="none"/>
    <path d="M 290 70 L 350 80 L 320 110 L 280 105 Z" fill="rgba(0,0,0,0.10)" stroke="none"/>
    <path d="M 350 80 L 380 110 L 350 130 L 320 110 Z" fill="rgba(0,0,0,0.22)" stroke="none"/>
    <path d="M 215 130 L 230 180 L 210 155 Z" fill="rgba(0,0,0,0.28)" stroke="none"/>
    <path d="M 360 185 L 385 155 L 380 110 Z" fill="rgba(0,0,0,0.30)" stroke="none"/>
    <text x="300" y="50" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ La Pietra Grezza ~</text>
  `);

  // === 15 — Apertura della Porta (tre colpi) ===
  const i15 = svg(`
    <rect x="240" y="50" width="120" height="155" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.8"/>
    <line x1="300" y1="50" x2="300" y2="205" stroke="${GOLD}" stroke-width="1.2"/>
    <circle cx="280" cy="135" r="3" fill="${GOLD}"/>
    <circle cx="320" cy="135" r="3" fill="${GOLD}"/>
    <text x="430" y="105" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="34">✦</text>
    <text x="430" y="135" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="34">✦</text>
    <text x="430" y="165" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="34">✦</text>
    <text x="300" y="35" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">~ TRE COLPI ~</text>
  `);

  // === 16 — Tre Ordini (Dorico/Ionico/Corinzio) ===
  const i16 = svg(`
    <rect x="160" y="80" width="32" height="100" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="155" y="68" width="42" height="14" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.4"/>
    <text x="176" y="200" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">DORICO</text>
    <rect x="284" y="80" width="32" height="100" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="278" y="68" width="44" height="12" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.4"/>
    <circle cx="285" cy="74" r="5" fill="none" stroke="${GOLD}" stroke-width="1.3"/>
    <circle cx="315" cy="74" r="5" fill="none" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="300" y="200" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">IONICO</text>
    <rect x="408" y="80" width="32" height="100" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.4"/>
    <path d="M 402 80 Q 410 60 424 65 Q 438 60 446 80 Z" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.4"/>
    <text x="424" y="200" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">CORINZIO</text>
  `);

  // === 17 — Tetramorfo (4 figure, glifi zodiacali RIMOSSI per non rivelare la risposta) ===
  const i17 = svg(`
    <line x1="300" y1="50" x2="300" y2="190" stroke="${GOLD}" stroke-width="1.2"/>
    <line x1="180" y1="120" x2="420" y2="120" stroke="${GOLD}" stroke-width="1.2"/>
    <circle cx="250" cy="90" r="22" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="250" y="98" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">TORO</text>
    <circle cx="350" cy="90" r="22" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="350" y="98" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">UOMO</text>
    <circle cx="250" cy="150" r="22" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="250" y="158" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">AQUILA</text>
    <circle cx="350" cy="150" r="22" fill="${FILL_SUBTLE}" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="350" y="158" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">LEONE</text>
    <text x="300" y="40" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">~ Il Tetramorfo ~</text>
  `);

  // === 18 — Coppa delle Libagioni ===
  const i18 = svg(`
    <path d="M 250 65 L 350 65 Q 360 65 358 75 L 335 130 Q 333 145 320 145 L 280 145 Q 267 145 265 130 L 242 75 Q 240 65 250 65 Z" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="2"/>
    <rect x="295" y="145" width="10" height="35" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <ellipse cx="300" cy="190" rx="35" ry="6" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.5"/>
    <ellipse cx="300" cy="78" rx="50" ry="6" fill="${BG}" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="300" y="50" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">COPPA DELLE LIBAGIONI</text>
  `);

  // === 19 — Toccamento (due avambracci che si incontrano, indizi rimossi) ===
  const i19 = svg(`
    <path d="M 170 95 Q 220 95 260 110 Q 280 118 300 118" fill="none" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 430 95 Q 380 95 340 110 Q 320 118 300 118" fill="none" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="300" cy="120" rx="22" ry="26" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="2"/>
    <text x="300" y="50" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ Il segno di riconoscimento ~</text>
  `);

  // === 20 — Tetractis Pitagorica (1+2+3+4 punti) ===
  function dot(cx, cy) {
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="${GOLD}" stroke="${GOLD_DIM}" stroke-width="1"/>`;
  }
  const cx = 300, dy = 25;
  let dots20 = '';
  dots20 += dot(cx, 65);
  dots20 += dot(cx - 16, 65 + dy) + dot(cx + 16, 65 + dy);
  dots20 += dot(cx - 32, 65 + 2*dy) + dot(cx, 65 + 2*dy) + dot(cx + 32, 65 + 2*dy);
  dots20 += dot(cx - 48, 65 + 3*dy) + dot(cx - 16, 65 + 3*dy) + dot(cx + 16, 65 + 3*dy) + dot(cx + 48, 65 + 3*dy);
  const i20 = svg(`
    ${dots20}
    <text x="160" y="78" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="20">I</text>
    <text x="160" y="103" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="20">II</text>
    <text x="160" y="128" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="20">III</text>
    <text x="160" y="153" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="20">IIII</text>
    <text x="300" y="190" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="12">~ TETRACTYS ~</text>
  `);

  // === 21 — Quadro di Loggia (pianta del Tempio) ===
  const i21 = svg(`
    <rect x="170" y="40" width="260" height="160" fill="rgba(10,6,4,0.92)" stroke="${GOLD}" stroke-width="2"/>
    <rect x="180" y="50" width="240" height="140" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
    <circle cx="220" cy="80" r="14" fill="none" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="220" y="86" text-anchor="middle" fill="${GOLD}" font-size="16">☉</text>
    <circle cx="380" cy="80" r="14" fill="none" stroke="${GOLD}" stroke-width="1.3"/>
    <text x="380" y="86" text-anchor="middle" fill="${GOLD}" font-size="16">☽</text>
    <polygon points="300,68 285,100 315,100" fill="${FILL_MED}" stroke="${GOLD}" stroke-width="1.4"/>
    <text x="300" y="93" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">G</text>
    <line x1="195" y1="115" x2="195" y2="180" stroke="${GOLD}" stroke-width="1.2"/>
    <line x1="405" y1="115" x2="405" y2="180" stroke="${GOLD}" stroke-width="1.2"/>
    <text x="195" y="138" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="11">J</text>
    <text x="405" y="138" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="11">B</text>
    ${(() => { let s=''; for(let r=0;r<3;r++) for(let c=0;c<8;c++){ s+=`<rect x="${220+c*22}" y="${155+r*12}" width="22" height="12" fill="${(r+c)%2?'#faf5e6':'#0a0604'}" stroke="${GOLD_DIM}" stroke-width="0.3"/>`;} return s;})()}
  `);

  // === 22 — La Soglia Varcata (porta aperta con luce) ===
  const i22 = svg(`
    <radialGradient id="g22" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,235,166,0.7)"/>
      <stop offset="60%" stop-color="rgba(255,200,100,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,200,100,0)"/>
    </radialGradient>
    <ellipse cx="300" cy="110" rx="120" ry="90" fill="url(#g22)"/>
    <rect x="245" y="60" width="110" height="150" fill="rgba(255,235,166,0.18)" stroke="${GOLD}" stroke-width="2.5"/>
    <line x1="300" y1="60" x2="300" y2="210" stroke="${GOLD}" stroke-width="1" stroke-dasharray="2 3"/>
    <text x="300" y="45" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-style="italic" font-size="13">~ SALUTE · FORZA · UNIONE ~</text>
  `);

  window.QUIZ_ILLUSTRATIONS = [
    i01, i02, i03, i04, i05, i06, i07, i08, i09, i10, i11,
    i12, i13, i14, i15, i16, i17, i18, i19, i20, i21, i22
  ];
})();
