/* ============================================================
   LOGGIA 1550 — LIBERO PENSIERO
   Tempio 3D — scena Three.js (scrollytelling cinematografico)
   ============================================================ */

// === CAPABILITIES DETECTION ===
const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches
               || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PIXEL_RATIO_CAP = IS_MOBILE ? 1.5 : 2.0;  // ridotto per stabilità

// Quota minima per oggetti sul pavimento (sopra il mosaico spesso 0.12)
const FLOOR_TOP = 0.20;

// === SETUP ===
const canvas = document.getElementById('canvas3d');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1545, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 30);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
renderer.setClearColor(0x050a25, 1);
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
// Abilita le ombre proiettate (disattive su mobile per performance)
renderer.shadowMap.enabled = !IS_MOBILE;
if (!IS_MOBILE) {
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Shadow map ad alta risoluzione per ombre morbide
  renderer.shadowMap.autoUpdate = true;
}
// physicallyCorrectLights resta false (default) per look cinematografico
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Tone mapping cinematografico
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputEncoding = THREE.sRGBEncoding;
// === ENVIRONMENT MAP procedurale (per riflessi PBR realistici) ===
// CHIARO abbastanza da non scurire la scena, ma con i toni del Tempio
function generateTempleEnvironment() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // Gradiente più chiaro: i materiali PBR riflettono questo
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0,    '#1a2860');  // zenith blu medio
  grad.addColorStop(0.4,  '#3a3050');  // notte calda
  grad.addColorStop(0.6,  '#6a4030');  // crepuscolo caldo
  grad.addColorStop(0.85, '#d4b87a');  // oro del Tempio
  grad.addColorStop(1,    '#ffeb99');  // caldo brillante
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  // Stelle e luci dei candelabri
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 200;
    const r = 3 + Math.random() * 8;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255, 250, 220, 1)');
    g.addColorStop(1, 'rgba(255, 250, 220, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  return new THREE.CanvasTexture(canvas);
}

// Env map disabilitato per stabilità
// === LUCI — schema cinematografico a 4 punti ===
// Ambient: luce blu-notte molto leggera (riempie le ombre)
scene.add(new THREE.AmbientLight(0x2a3568, 0.55));

// Hemisphere: luce dall'alto (cielo) e dal basso (pavimento) per dare volume
const hemiLight = new THREE.HemisphereLight(0x4a6090, 0x1a1408, 0.4);
hemiLight.position.set(0, 30, 0);
scene.add(hemiLight);

// Key light dorata al centro (riempie il Tempio)
const goldLight = new THREE.PointLight(0xd4b87a, 2.0, 38, 1.6);
goldLight.position.set(0, 4, 0);
scene.add(goldLight);

// Fill light dorata dell'Oriente (dietro al trono — sole rituale)
const eastLight = new THREE.PointLight(0xffeb99, 2.6, 32, 1.5);
eastLight.position.set(0, 6, -16);
scene.add(eastLight);

// Light puntuale sull'Ara
const altarLight = new THREE.PointLight(0xffd989, 1.8, 14, 1.8);
altarLight.position.set(0, 3, 2);
scene.add(altarLight);

// Rim light fredda da Nord (definisce i contorni — effetto cinema)
const rimLightNorth = new THREE.DirectionalLight(0x6090c0, 0.45);
rimLightNorth.position.set(-15, 8, 18);
scene.add(rimLightNorth);

// Light di taglio dall'ingresso (illumina le colonne dall'esterno)
const entranceLight = new THREE.SpotLight(0xffeebb, 1.5, 30, Math.PI / 6, 0.5, 1);
entranceLight.position.set(0, 12, 22);
entranceLight.target.position.set(0, 0, 8);
scene.add(entranceLight);
scene.add(entranceLight.target);

// === MATERIALI BASE — calibrati per realismo PBR ===

// Texture noise procedurale per dare microvariazioni di rugosità al marmo
function generateMarbleNoiseTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  // Fondo chiaro: la map moltiplica la roughness, vogliamo VARIAZIONI piccole
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, 512, 512);
  // Vene marmoree (linee curve grigie)
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(${110 + Math.random()*40}, ${110 + Math.random()*40}, ${110 + Math.random()*40}, 0.35)`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    const sx = Math.random() * 512;
    ctx.moveTo(sx, 0);
    let x = sx;
    for (let y = 0; y < 512; y += 4) {
      x += (Math.random() - 0.5) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Macchioline fini
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(${100 + Math.random()*50}, ${100 + Math.random()*50}, ${100 + Math.random()*50}, ${Math.random() * 0.25})`;
    ctx.fillRect(x, y, 1 + Math.random()*2, 1 + Math.random()*2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 16;
  return tex;
}
const marbleRoughnessMap = generateMarbleNoiseTexture();

// === ORO: MeshPhysicalMaterial con clearcoat (riflessi metallici di alta qualità) ===
const goldMat = new THREE.MeshPhysicalMaterial({
  color: 0xd4b87a, roughness: 0.16, metalness: 0.95,
  emissive: 0xd4b87a, emissiveIntensity: 0.25,
  clearcoat: 0.6,
  clearcoatRoughness: 0.2,
  reflectivity: 0.95,
  envMapIntensity: 0
});

// Legno: opaco, ricchezza calda
const woodMat = new THREE.MeshStandardMaterial({
  color: 0x5a3a20, roughness: 0.78, metalness: 0.05,
  envMapIntensity: 0
});

// === MARMO BIANCO con micro-noise + leggero subsurface ===
const whiteMarbleMat = new THREE.MeshPhysicalMaterial({
  color: 0xf5eddc, roughness: 0.42, metalness: 0.05,
  emissive: 0x3a2818, emissiveIntensity: 0.16,
  roughnessMap: marbleRoughnessMap,
  clearcoat: 0.3,
  clearcoatRoughness: 0.4,
  envMapIntensity: 0
});

// === MARMO NERO con riflessi metallici (effetto granito nero levigato) ===
const blackMarbleMat = new THREE.MeshPhysicalMaterial({
  color: 0x1a1a25, roughness: 0.28, metalness: 0.35,
  emissive: 0x080814, emissiveIntensity: 0.10,
  roughnessMap: marbleRoughnessMap,
  clearcoat: 0.4,
  clearcoatRoughness: 0.3,
  envMapIntensity: 0
});

// === VELLUTO ROSSO: alto roughness, leggero clearcoat per il riflesso del velluto ===
// Nota: sheen* non supportato in three.js r128, uso clearcoat ridotto per effetto simile
const redVelvetMat = new THREE.MeshPhysicalMaterial({
  color: 0x8B0000, roughness: 0.88, metalness: 0.0,
  emissive: 0x3a0000, emissiveIntensity: 0.25,
  clearcoat: 0.15,
  clearcoatRoughness: 0.6,
  envMapIntensity: 0
});

// === CIELO STELLATO 3 LIVELLI ===
// Texture circolare condivisa per le stelle (cerchio morbido con bagliore radiale)
const _starCircleCanvas = document.createElement('canvas');
_starCircleCanvas.width = 64; _starCircleCanvas.height = 64;
const _scCtx = _starCircleCanvas.getContext('2d');
{
  const grad = _scCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0,    'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.18, 'rgba(255, 250, 220, 0.95)');
  grad.addColorStop(0.4,  'rgba(255, 230, 160, 0.55)');
  grad.addColorStop(0.7,  'rgba(255, 220, 140, 0.18)');
  grad.addColorStop(1,    'rgba(255, 220, 140, 0)');
  _scCtx.fillStyle = grad;
  _scCtx.fillRect(0, 0, 64, 64);
}
const STAR_CIRCLE_TEX = new THREE.CanvasTexture(_starCircleCanvas);
STAR_CIRCLE_TEX.anisotropy = 16;
STAR_CIRCLE_TEX.minFilter = THREE.LinearFilter;
STAR_CIRCLE_TEX.magFilter = THREE.LinearFilter;


// === TEXTURE GLOW per il bagliore delle candele (gradiente radiale caldo) ===
const _candleGlowCanvas = document.createElement('canvas');
_candleGlowCanvas.width = 256; _candleGlowCanvas.height = 256;
const _cgCtx = _candleGlowCanvas.getContext('2d');
{
  const grad = _cgCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0,    'rgba(255, 240, 200, 0.95)');
  grad.addColorStop(0.15, 'rgba(255, 200, 100, 0.65)');
  grad.addColorStop(0.35, 'rgba(255, 140, 60, 0.32)');
  grad.addColorStop(0.6,  'rgba(255, 100, 30, 0.12)');
  grad.addColorStop(1,    'rgba(255, 80, 20, 0)');
  _cgCtx.fillStyle = grad;
  _cgCtx.fillRect(0, 0, 256, 256);
}
const CANDLE_GLOW_TEX = new THREE.CanvasTexture(_candleGlowCanvas);
CANDLE_GLOW_TEX.anisotropy = 16;
CANDLE_GLOW_TEX.minFilter = THREE.LinearFilter;
CANDLE_GLOW_TEX.magFilter = THREE.LinearFilter;

function createCandleGlow(baseScale) {
  baseScale = baseScale || 1.0;
  const mat = new THREE.SpriteMaterial({
    map: CANDLE_GLOW_TEX,
    color: 0xffba66,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(baseScale, baseScale, 1);
  sprite.userData.baseScale = baseScale;
  return sprite;
}

function createStarLayer(count, distance, size, color, opacity) {
  const geo = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < count; i++) {
    const r = distance + Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    vertices.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const mat = new THREE.PointsMaterial({
    color: color, size: size, transparent: true,
    opacity: opacity, sizeAttenuation: true,
    map: STAR_CIRCLE_TEX,
    alphaTest: 0.01,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return new THREE.Points(geo, mat);
}

const stars1 = createStarLayer(2500, 100, 0.3, 0xffffff, 0.8);
const stars2 = createStarLayer(1500, 80, 0.5, 0xffeb99, 0.9);
const stars3 = createStarLayer(500, 60, 0.8, 0xd4b87a, 1);
scene.add(stars1); scene.add(stars2); scene.add(stars3);

// === PAVIMENTO MOSAICO (solo fuori dal podio dell'Oriente) ===
const floorGroup = new THREE.Group();
const tileSize = 2;
const gridSize = 14;

for (let x = -gridSize; x < gridSize; x++) {
  for (let z = -gridSize; z < gridSize; z++) {
    // Salta le tessere dove c'è il podio dell'Oriente (zona z < -10)
    if (z * tileSize < -18) continue;
    
    const isWhite = (x + z) % 2 === 0;
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(tileSize * 0.97, 0.12, tileSize * 0.97),
      new THREE.MeshStandardMaterial({
        color: isWhite ? 0xfaf5e6 : 0x080814,
        roughness: 0.15, metalness: 0.6,
        emissive: isWhite ? 0x1a1408 : 0x000000,
        emissiveIntensity: 0.08
      })
    );
    tile.position.set(x * tileSize + tileSize/2, 0, z * tileSize + tileSize/2);
    floorGroup.add(tile);
  }
}

// Cornice dorata perimetrale
const frameSize = gridSize * tileSize;
const frameNorth = new THREE.Mesh(
  new THREE.BoxGeometry(frameSize * 2 + 1, 0.2, 0.5),
  goldMat
);
frameNorth.position.set(0, 0.06, frameSize);
floorGroup.add(frameNorth);

const frameSouth = new THREE.Mesh(
  new THREE.BoxGeometry(frameSize * 2 + 1, 0.2, 0.5),
  goldMat
);
frameSouth.position.set(0, 0.06, -18);
floorGroup.add(frameSouth);

const frameEast = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.2, frameSize + 18),
  goldMat
);
frameEast.position.set(frameSize, 0.06, (frameSize - 18) / 2);
floorGroup.add(frameEast);

const frameWest = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.2, frameSize + 18),
  goldMat
);
frameWest.position.set(-frameSize, 0.06, (frameSize - 18) / 2);
floorGroup.add(frameWest);

scene.add(floorGroup);

// === PODIO DELL'ORIENTE (4 gradini + 3 gradini = 7) ===
const podiumGroup = new THREE.Group();

// 4 gradini iniziali
for (let i = 0; i < 4; i++) {
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(20 - i * 0.4, 0.4, 1.2),
    whiteMarbleMat
  );
  step.position.set(0, 0.2 + i * 0.4, -18 - i * 1.2);
  podiumGroup.add(step);
}

// Piattaforma del podio
const podiumPlatform = new THREE.Mesh(
  new THREE.BoxGeometry(18, 0.3, 8),
  whiteMarbleMat
);
podiumPlatform.position.set(0, 1.75, -25);
podiumGroup.add(podiumPlatform);

// 3 gradini per il trono
for (let i = 0; i < 3; i++) {
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(8 - i * 0.4, 0.35, 0.9),
    whiteMarbleMat
  );
  step.position.set(0, 2.0 + i * 0.35, -22 - i * 0.9);
  podiumGroup.add(step);
}

scene.add(podiumGroup);

// === TRONO DEL MAESTRO VENERABILE ===
// Singola forma unitaria con schienale arcuato in alto, in velluto rosso
// con cornice dorata sottile, Occhio della Provvidenza al centro.
// NESSUN BALDACCHINO sopra.
const throneGroup = new THREE.Group();

// === BASE / PEDESTAL solido ===
const pedestal = new THREE.Mesh(
  new THREE.BoxGeometry(3.6, 0.50, 2.2),
  new THREE.MeshStandardMaterial({
    color: 0x3a1a08, roughness: 0.55, metalness: 0.22,
    emissive: 0x1a0804, emissiveIntensity: 0.2
  })
);
pedestal.position.set(0, 2.55, -26.4);
throneGroup.add(pedestal);

// Cornice dorata sotto al pedestal
const pedestalTrim = new THREE.Mesh(
  new THREE.BoxGeometry(3.75, 0.10, 2.30), goldMat
);
pedestalTrim.position.set(0, 2.27, -26.4);
throneGroup.add(pedestalTrim);

// === SCHIENALE: UNA SOLA FORMA con sommità ARCUATA ===
const BW = 1.55;   // half-width
const BH = 3.30;   // altezza dei lati verticali (poi arco semicerchio sopra)
const backShape = new THREE.Shape();
backShape.moveTo(-BW, 0);
backShape.lineTo(-BW, BH);
backShape.absarc(0, BH, BW, Math.PI, 0, false);  // arco semicircolare in cima
backShape.lineTo(BW, 0);
backShape.lineTo(-BW, 0);

const backGeo = new THREE.ExtrudeGeometry(backShape, {
  depth: 0.32,
  bevelEnabled: true,
  bevelSize: 0.04,
  bevelThickness: 0.03,
  bevelSegments: 6,
  curveSegments: 32
});

const throneBack = new THREE.Mesh(backGeo, redVelvetMat);
throneBack.position.set(0, 2.95, -27.25);
throneGroup.add(throneBack);

// === INSERTO velluto più scuro al centro (definisce il riquadro interno) ===
const iW = 1.30, iH = 3.05;
const innerShape = new THREE.Shape();
innerShape.moveTo(-iW, 0);
innerShape.lineTo(-iW, iH);
innerShape.absarc(0, iH, iW, Math.PI, 0, false);
innerShape.lineTo(iW, 0);
innerShape.lineTo(-iW, 0);
const innerGeo = new THREE.ExtrudeGeometry(innerShape, {
  depth: 0.04, bevelEnabled: false, curveSegments: 32
});
const throneInner = new THREE.Mesh(
  innerGeo,
  new THREE.MeshPhysicalMaterial({
    color: 0x6a0808, roughness: 0.92, metalness: 0.0,
    emissive: 0x2a0404, emissiveIntensity: 0.32,
    clearcoat: 0.1, clearcoatRoughness: 0.6
  })
);
throneInner.position.set(0, 3.05, -27.0);
throneGroup.add(throneInner);

// === CORNICE DORATA sottile lungo il perimetro del pannello interno ===
// Lati verticali
for (let s = -1; s <= 1; s += 2) {
  const sideTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, iH, 0.05), goldMat
  );
  sideTrim.position.set(s * iW, 3.05 + iH/2, -26.97);
  throneGroup.add(sideTrim);
}
// Trim inferiore orizzontale
const bottomTrim = new THREE.Mesh(
  new THREE.BoxGeometry(iW * 2 + 0.05, 0.05, 0.05), goldMat
);
bottomTrim.position.set(0, 3.05, -26.97);
throneGroup.add(bottomTrim);
// Trim superiore arcuato (semicerchio)
const arcTrim = new THREE.Mesh(
  new THREE.TorusGeometry(iW, 0.025, 16, 48, Math.PI), goldMat
);
arcTrim.position.set(0, 3.05 + iH, -26.97);
arcTrim.rotation.z = Math.PI;
throneGroup.add(arcTrim);

// === OCCHIO DELLA PROVVIDENZA dorato al centro del pannello ===
const eyeCanvas = document.createElement('canvas');
eyeCanvas.width = 1024; eyeCanvas.height = 1024;
const eCtx = eyeCanvas.getContext('2d');
eCtx.clearRect(0, 0, 1024, 1024);

const cx = 512, cy = 560;

// Raggera dorata (sottile, decorativa)
eCtx.strokeStyle = 'rgba(255, 233, 166, 0.85)';
eCtx.shadowColor = 'rgba(255, 233, 166, 0.9)';
eCtx.shadowBlur = 28;
for (let i = 0; i < 36; i++) {
  const a = (i / 36) * Math.PI * 2;
  const isLong = i % 2 === 0;
  eCtx.lineWidth = isLong ? 6 : 3;
  eCtx.beginPath();
  eCtx.moveTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
  eCtx.lineTo(cx + Math.cos(a) * (isLong ? 420 : 350), cy + Math.sin(a) * (isLong ? 420 : 350));
  eCtx.stroke();
}

// Triangolo dorato (Delta della Provvidenza)
eCtx.shadowBlur = 22;
eCtx.shadowColor = '#d4b87a';
eCtx.fillStyle = '#d4b87a';
eCtx.strokeStyle = '#8a7044';
eCtx.lineWidth = 7;
eCtx.beginPath();
eCtx.moveTo(cx, cy - 220);
eCtx.lineTo(cx - 210, cy + 130);
eCtx.lineTo(cx + 210, cy + 130);
eCtx.closePath();
eCtx.fill();
eCtx.stroke();

// Interno del triangolo scuro
eCtx.fillStyle = '#1a0a04';
eCtx.shadowBlur = 0;
eCtx.beginPath();
eCtx.moveTo(cx, cy - 180);
eCtx.lineTo(cx - 170, cy + 100);
eCtx.lineTo(cx + 170, cy + 100);
eCtx.closePath();
eCtx.fill();

// OCCHIO
eCtx.fillStyle = '#fff5e0';
eCtx.shadowColor = '#fff5e0';
eCtx.shadowBlur = 28;
eCtx.beginPath();
eCtx.ellipse(cx, cy + 5, 125, 58, 0, 0, Math.PI * 2);
eCtx.fill();
// Iride
eCtx.shadowBlur = 16;
eCtx.shadowColor = '#d4b87a';
eCtx.fillStyle = '#d4b87a';
eCtx.beginPath();
eCtx.arc(cx, cy + 5, 48, 0, Math.PI * 2);
eCtx.fill();
eCtx.fillStyle = '#ffe9a6';
eCtx.shadowBlur = 12;
eCtx.beginPath();
eCtx.arc(cx, cy + 5, 36, 0, Math.PI * 2);
eCtx.fill();
// Pupilla
eCtx.shadowBlur = 0;
eCtx.fillStyle = '#0a0604';
eCtx.beginPath();
eCtx.arc(cx, cy + 5, 21, 0, Math.PI * 2);
eCtx.fill();
// Riflesso
eCtx.fillStyle = '#fff5e0';
eCtx.beginPath();
eCtx.arc(cx + 8, cy - 3, 6, 0, Math.PI * 2);
eCtx.fill();
// Palpebre
eCtx.strokeStyle = '#5a3a18';
eCtx.lineWidth = 4;
eCtx.beginPath();
eCtx.moveTo(cx - 125, cy + 5);
eCtx.quadraticCurveTo(cx, cy - 55, cx + 125, cy + 5);
eCtx.moveTo(cx - 125, cy + 5);
eCtx.quadraticCurveTo(cx, cy + 70, cx + 125, cy + 5);
eCtx.stroke();

const eyeTex = new THREE.CanvasTexture(eyeCanvas);
eyeTex.anisotropy = 16;
const eyeMat = new THREE.MeshBasicMaterial({
  map: eyeTex, transparent: true, side: THREE.DoubleSide, depthWrite: false
});
const eyePlane = new THREE.Mesh(
  new THREE.PlaneGeometry(2.6, 2.6), eyeMat
);
eyePlane.position.set(0, 5.0, -26.95);
throneGroup.add(eyePlane);

// === SEDILE con cuscino spesso ===
const seat = new THREE.Mesh(
  new THREE.BoxGeometry(3.0, 0.5, 1.8), redVelvetMat
);
seat.position.set(0, 3.05, -26.45);
throneGroup.add(seat);

// Bordo dorato del sedile
const seatBorder = new THREE.Mesh(
  new THREE.BoxGeometry(3.15, 0.08, 1.95), goldMat
);
seatBorder.position.set(0, 2.80, -26.45);
throneGroup.add(seatBorder);

// Cuscino spesso sopra il sedile
const cushion = new THREE.Mesh(
  new THREE.BoxGeometry(2.7, 0.25, 1.55), redVelvetMat
);
cushion.position.set(0, 3.42, -26.35);
throneGroup.add(cushion);

// === BRACCIOLI imbottiti ===
for (let s = -1; s <= 1; s += 2) {
  // Corpo del bracciolo
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.70, 1.7), redVelvetMat
  );
  arm.position.set(s * 1.42, 3.65, -26.45);
  throneGroup.add(arm);

  // Cuscino arrotondato sulla parte superiore (mezzo cilindro)
  const armRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 1.75, 32), redVelvetMat
  );
  armRoll.rotation.x = Math.PI / 2;
  armRoll.position.set(s * 1.42, 4.05, -26.45);
  throneGroup.add(armRoll);

  // Pomolo dorato anteriore (boccia)
  const armKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 32, 24), goldMat
  );
  armKnob.position.set(s * 1.42, 4.05, -25.55);
  throneGroup.add(armKnob);

  // Base del bracciolo (anche dietro, per stabilità visiva)
  const armBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.15, 1.75), goldMat
  );
  armBase.position.set(s * 1.42, 3.32, -26.45);
  throneGroup.add(armBase);
}

// === SGABELLO POGGIAPIEDI davanti ===
const footstool = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.30, 0.90), redVelvetMat
);
footstool.position.set(0, 2.10, -24.9);
throneGroup.add(footstool);

const footstoolBorder = new THREE.Mesh(
  new THREE.BoxGeometry(2.15, 0.10, 1.05), goldMat
);
footstoolBorder.position.set(0, 1.91, -24.9);
throneGroup.add(footstoolBorder);

scene.add(throneGroup);

// === BALDACCHINO RIMOSSO completamente ===
// (era un blocco fluttuante che creava un "taglio" visibile sopra il Trono)

// === DELTA con YHWH (Tetragramma in ebraico) ===
const deltaGroup = new THREE.Group();

// Triangolo del Delta
const triangleShape = new THREE.Shape();
triangleShape.moveTo(0, 1.8);
triangleShape.lineTo(-1.6, -0.9);
triangleShape.lineTo(1.6, -0.9);
triangleShape.closePath();

const triangleHole = new THREE.Path();
triangleHole.moveTo(0, 1.35);
triangleHole.lineTo(-1.2, -0.7);
triangleHole.lineTo(1.2, -0.7);
triangleHole.closePath();
triangleShape.holes.push(triangleHole);

const deltaGeo = new THREE.ExtrudeGeometry(triangleShape, {
  depth: 0.24, bevelEnabled: true,
  bevelThickness: 0.10, bevelSize: 0.08, bevelSegments: 8,
  curveSegments: 32
});
const deltaMat = new THREE.MeshStandardMaterial({
  color: 0xd4b87a, emissive: 0xd4b87a, emissiveIntensity: 1.0,
  metalness: 0.9, roughness: 0.2
});
const delta = new THREE.Mesh(deltaGeo, deltaMat);
delta.position.set(0, 9.5, -27.2);
deltaGroup.add(delta);

// YHWH sostituito con G dorata
const yhwhCanvas = document.createElement('canvas');
yhwhCanvas.width = 1024; yhwhCanvas.height = 768;
const yhwhCtx = yhwhCanvas.getContext('2d');
yhwhCtx.scale(2, 2);
yhwhCtx.clearRect(0, 0, 512, 384);
yhwhCtx.font = 'italic bold 320px Georgia, "Trajan Pro", serif';
yhwhCtx.textAlign = 'center';
yhwhCtx.textBaseline = 'middle';
// Glow esterno ampio
yhwhCtx.shadowColor = '#ffeb99';
yhwhCtx.shadowBlur = 80;
yhwhCtx.fillStyle = '#fff5c0';
yhwhCtx.fillText('G', 256, 200);
// Riempimento dorato netto
yhwhCtx.shadowBlur = 30;
yhwhCtx.fillStyle = '#ffeb99';
yhwhCtx.fillText('G', 256, 200);
// Bordo dorato scuro
yhwhCtx.shadowBlur = 0;
yhwhCtx.strokeStyle = '#a8895a';
yhwhCtx.lineWidth = 4;
yhwhCtx.strokeText('G', 256, 200);

const yhwhTex = new THREE.CanvasTexture(yhwhCanvas); yhwhTex.anisotropy = 16;
const yhwhMat = new THREE.MeshBasicMaterial({
  map: yhwhTex, transparent: true, side: THREE.DoubleSide
});
const yhwhPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 1.65),
  yhwhMat
);
yhwhPlane.position.set(0, 9.4, -26.95);
deltaGroup.add(yhwhPlane);

// Cerchio di raggi attorno al Delta RIMOSSO (creava aspetto poligonale)


// === ACRONIMO A∴ G∴ D∴ G∴ A∴ D∴ U∴ sotto il Delta ===
// "Alla Gloria del Grande Architetto Dell'Universo"
// Formula di apertura del Rituale del Primo Grado
const acronymCanvas = document.createElement('canvas');
acronymCanvas.width = 2048; acronymCanvas.height = 320;
const acrCtx = acronymCanvas.getContext('2d');
acrCtx.clearRect(0, 0, 2048, 320);

// Doppio passaggio: glow ampio dorato + testo netto sopra
acrCtx.font = 'italic 700 150px "Trajan Pro", "Cormorant Garamond", Georgia, serif';
acrCtx.textAlign = 'center';
acrCtx.textBaseline = 'middle';
acrCtx.letterSpacing = '8px';

const acronymText = 'A∴ G∴ D∴ G∴ A∴ D∴ U∴';

// 1) Glow ampio
acrCtx.shadowColor = '#ffe9a6';
acrCtx.shadowBlur = 50;
acrCtx.fillStyle = '#ffe9a6';
acrCtx.fillText(acronymText, 1024, 160);

// 2) Riempimento dorato netto
acrCtx.shadowBlur = 18;
acrCtx.fillStyle = '#d4b87a';
acrCtx.fillText(acronymText, 1024, 160);

// 3) Highlight chiaro
acrCtx.shadowBlur = 0;
acrCtx.fillStyle = '#fff5c0';
acrCtx.font = 'italic 700 150px "Trajan Pro", "Cormorant Garamond", Georgia, serif';
acrCtx.globalAlpha = 0.35;
acrCtx.fillText(acronymText, 1022, 158);
acrCtx.globalAlpha = 1.0;

const acronymTex = new THREE.CanvasTexture(acronymCanvas);
acronymTex.anisotropy = 16;
acronymTex.minFilter = THREE.LinearMipmapLinearFilter;
acronymTex.magFilter = THREE.LinearFilter;

const acronymMat = new THREE.MeshBasicMaterial({
  map: acronymTex, transparent: true, side: THREE.DoubleSide, depthWrite: false
});
const acronymPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(5.2, 0.81), acronymMat
);
// Sotto il triangolo del Delta (la base del triangolo è a y=8.6 in world space)
acronymPlane.position.set(0, 8.30, -27.0);
deltaGroup.add(acronymPlane);

scene.add(deltaGroup);

// === SOLE E LUNA TRASPARENTI ai lati del Delta ===
function createCelestialBody(x, type) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, 256, 256);
  
  if (type === 'sun') {
    // Sole con raggi - solenne, senza volto
    const grad = ctx.createRadialGradient(128, 128, 25, 128, 128, 110);
    grad.addColorStop(0, '#fff5cc');
    grad.addColorStop(0.4, '#ffeb99');
    grad.addColorStop(0.7, '#d4b87a');
    grad.addColorStop(1, 'rgba(212, 184, 122, 0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 52, 0, Math.PI * 2);
    ctx.fill();
    
    // Bordo dorato netto del disco solare
    ctx.strokeStyle = '#d4b87a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffeb99';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(128, 128, 52, 0, Math.PI * 2);
    ctx.stroke();
    
    // Raggi alternati (lunghi e corti, come nei sigilli antichi)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const isLong = i % 2 === 0;
      const inner = 56;
      const outer = isLong ? 100 : 78;
      ctx.lineWidth = isLong ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(angle) * inner, 128 + Math.sin(angle) * inner);
      ctx.lineTo(128 + Math.cos(angle) * outer, 128 + Math.sin(angle) * outer);
      ctx.stroke();
    }
  } else {
    // Luna crescente - solenne, senza volto
    ctx.shadowColor = '#ffeb99';
    ctx.shadowBlur = 25;
    
    // Disco lunare pieno
    const lunarGrad = ctx.createRadialGradient(118, 118, 15, 128, 128, 58);
    lunarGrad.addColorStop(0, '#fff5cc');
    lunarGrad.addColorStop(0.6, '#d4b87a');
    lunarGrad.addColorStop(1, '#a8895a');
    ctx.fillStyle = lunarGrad;
    ctx.beginPath();
    ctx.arc(128, 128, 56, 0, Math.PI * 2);
    ctx.fill();
    
    // Ombra che crea il crescente
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(152, 120, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Bordo luminoso del crescente
    ctx.strokeStyle = '#ffeb99';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffeb99';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(128, 128, 56, Math.PI * 0.55, Math.PI * 1.45);
    ctx.stroke();
    
    // Piccole stelle attorno alla luna
    ctx.fillStyle = '#ffeb99';
    ctx.shadowBlur = 12;
    const starPos = [[70, 75], [60, 140], [85, 195]];
    starPos.forEach(([sx, sy]) => {
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        const r = k % 2 === 0 ? 7 : 3;
        const px = sx + Math.cos(a) * r;
        const py = sy + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        const a2 = a + Math.PI / 5;
        ctx.lineTo(sx + Math.cos(a2) * 3, sy + Math.sin(a2) * 3);
      }
      ctx.closePath();
      ctx.fill();
    });
  }
  
  const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 16;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), mat);
  plane.position.set(x, 9.5, -27.3);
  return plane;
}

const sun = createCelestialBody(-5.8, 'sun');
scene.add(sun);

const moon = createCelestialBody(5.8, 'moon');
scene.add(moon);

// === COLONNE JACHIN (corinzia con melagrane) E BOAZ (dorica con globo) ===
// IMPORTANTE: secondo il rituale, J è a destra (entrando) e B a sinistra
// La camera entra da z=+30 verso z=-, quindi:
// J (destra entrando) = x positivo
// B (sinistra entrando) = x negativo

function createCorinthianColumnJ(x, marbleMat) {
  // J — colonna BIANCA (Jachin, lato destro entrando)
  // Capitello dorico uniforme; melagrane sopra l'abaco; lettera J
  const stoneMat = marbleMat || whiteMarbleMat;
  const group = new THREE.Group();

  // === BASE ===
  const baseBottom = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.25, 2.4), stoneMat
  );
  baseBottom.position.y = 0.125;
  group.add(baseBottom);

  const baseMid = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.05, 0.3, 24), stoneMat
  );
  baseMid.position.y = 0.4;
  group.add(baseMid);

  // === FUSTO SCANALATO ad alta risoluzione (24 scanalature) ===
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.92, 7.5, 48), stoneMat
  );
  shaft.position.y = 4.3;
  group.add(shaft);

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const groove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 7.5, 12), stoneMat
    );
    groove.position.set(
      Math.cos(angle) * 0.83, 4.3, Math.sin(angle) * 0.83
    );
    group.add(groove);
  }

  // Tre anelli decorativi dorati sottili sul fusto
  for (let i = 0; i < 3; i++) {
    const yRing = 1.6 + i * 2.4;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.025, 16, 48), goldMat
    );
    ring.position.y = yRing;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  // Anello dorato all'attacco del capitello
  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.05, 16, 36), goldMat
  );
  collarRing.position.y = 8.05;
  collarRing.rotation.x = Math.PI / 2;
  group.add(collarRing);

  // === CAPITELLO DORICO ===
  const echinus = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 0.82, 0.55, 32), stoneMat
  );
  echinus.position.y = 8.35;
  group.add(echinus);

  const abacus = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.25, 2.4), stoneMat
  );
  abacus.position.y = 8.75;
  group.add(abacus);

  // === TRE MELAGRANE sopra l'abaco ===
  function createPomegranate(px, pz) {
    const pomGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 24),
      new THREE.MeshStandardMaterial({
        color: 0xa83232, roughness: 0.55, metalness: 0.25,
        emissive: 0x3a0808, emissiveIntensity: 0.25
      })
    );
    pomGroup.add(body);
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.1, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x6a2020, roughness: 0.7 })
    );
    crown.position.y = 0.35;
    pomGroup.add(crown);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.18, 18),
        new THREE.MeshStandardMaterial({ color: 0x6a2020, roughness: 0.7 })
      );
      petal.position.set(Math.cos(angle) * 0.15, 0.42, Math.sin(angle) * 0.15);
      petal.rotation.z = Math.cos(angle) * 0.3;
      petal.rotation.x = -Math.sin(angle) * 0.3;
      pomGroup.add(petal);
    }
    for (let i = 0; i < 7; i++) {
      const seed = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 32, 24),
        new THREE.MeshStandardMaterial({
          color: 0xff3030, emissive: 0xa00000, emissiveIntensity: 0.6,
          roughness: 0.3, metalness: 0.1
        })
      );
      seed.position.set(
        (Math.random() - 0.5) * 0.18, 0.3 + Math.random() * 0.05,
        (Math.random() - 0.5) * 0.18
      );
      pomGroup.add(seed);
    }
    pomGroup.position.set(px, 9.1, pz);
    return pomGroup;
  }
  group.add(createPomegranate(0, 0.55));
  group.add(createPomegranate(-0.55, -0.32));
  group.add(createPomegranate(0.55, -0.32));

  // === PLAQUETTE NERA con lettera J DORATA (sempre leggibile) ===
  group.add(createColumnLetter('J', 0, 4.3, 0.96, 'dark'));

  group.position.x = x;
  return group;
}

// === COLONNA BOAZ (DORICA) - sormontata dal globo terraqueo ===
function createDoricColumnB(x, marbleMat) {
  // B — colonna NERA (Boaz, lato sinistro entrando)
  // Marmo nero per simbolismo lunare/notturno; globo terraqueo sopra; lettera B
  const stoneMat = marbleMat || blackMarbleMat;
  const group = new THREE.Group();

  // === BASE ===
  const baseBottom = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.25, 2.4), stoneMat
  );
  baseBottom.position.y = 0.125;
  group.add(baseBottom);

  const baseMid = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.05, 0.3, 24), stoneMat
  );
  baseMid.position.y = 0.4;
  group.add(baseMid);

  // === FUSTO SCANALATO ad alta risoluzione (24 scanalature) ===
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.92, 7.5, 48), stoneMat
  );
  shaft.position.y = 4.3;
  group.add(shaft);

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const groove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 7.5, 12), stoneMat
    );
    groove.position.set(
      Math.cos(angle) * 0.83, 4.3, Math.sin(angle) * 0.83
    );
    group.add(groove);
  }

  // Tre anelli decorativi dorati sottili sul fusto
  for (let i = 0; i < 3; i++) {
    const yRing = 1.6 + i * 2.4;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.025, 16, 48), goldMat
    );
    ring.position.y = yRing;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.05, 16, 36), goldMat
  );
  collarRing.position.y = 8.05;
  collarRing.rotation.x = Math.PI / 2;
  group.add(collarRing);

  // === CAPITELLO DORICO ===
  const echinus = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 0.82, 0.55, 32), stoneMat
  );
  echinus.position.y = 8.35;
  group.add(echinus);

  const abacus = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.25, 2.4), stoneMat
  );
  abacus.position.y = 8.75;
  group.add(abacus);

  // === GLOBO TERRAQUEO sopra l'abaco ===
  const globeGroup = new THREE.Group();
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0x2a5a90, roughness: 0.4, metalness: 0.5,
    emissive: 0x0a2050, emissiveIntensity: 0.3
  });
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 32, 24), globeMat
  );
  globeGroup.add(globe);

  const landMat = new THREE.MeshStandardMaterial({
    color: 0x8a9050, roughness: 0.6, metalness: 0.2,
    emissive: 0x2a3a10, emissiveIntensity: 0.2
  });
  const continentSpots = [
    { x: 0.5,  y: 0.3, z: 0.5, scale: 0.32 },
    { x: -0.4, y: 0.4, z: 0.5, scale: 0.22 },
    { x: 0.6,  y: -0.2, z: 0.4, scale: 0.18 },
    { x: -0.5, y: -0.1, z: -0.5, scale: 0.25 },
    { x: 0.3,  y: 0.5, z: -0.5, scale: 0.20 }
  ];
  continentSpots.forEach(s => {
    const cont = new THREE.Mesh(
      new THREE.SphereGeometry(0.86, 32, 24), landMat
    );
    cont.position.set(s.x, s.y, s.z);
    cont.scale.setScalar(s.scale);
    globeGroup.add(cont);
  });

  const equator = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.02, 16, 48), goldMat
  );
  equator.rotation.x = Math.PI / 2;
  globeGroup.add(equator);
  const meridian1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.02, 16, 48), goldMat
  );
  globeGroup.add(meridian1);
  const meridian2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.02, 16, 48), goldMat
  );
  meridian2.rotation.y = Math.PI / 2;
  globeGroup.add(meridian2);

  const axisPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.0, 24), goldMat
  );
  globeGroup.add(axisPin);

  const globeBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.55, 0.15, 24), goldMat
  );
  globeBase.position.y = -0.95;
  globeGroup.add(globeBase);

  globeGroup.position.y = 9.95;
  group.add(globeGroup);

  // === PLAQUETTE NERA con lettera B DORATA ===
  group.add(createColumnLetter('B', 0, 4.3, 0.96));

  group.userData.globe = globeGroup;
  group.position.x = x;
  return group;
}

// === LETTERA INCISA SUL FUSTO (senza cornice) ===
// Disegnata su canvas ad alta risoluzione: solco scuro per profondità + oro brillante
function createColumnLetter(letter, x, y, z, style) {
  // style: 'gold' (default, su colonna nera) | 'dark' (lettera nera su colonna bianca)
  style = style || 'gold';
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 1024);

  const fontSpec = 'italic 900 720px "Trajan Pro", "Cormorant Garamond", Georgia, serif';
  ctx.font = fontSpec;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (style === 'dark') {
    // === LETTERA SCURA (J nera su colonna bianca) ===
    // 1) Alone esterno scuro (profondità del solco)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#0a0604';
    ctx.fillText(letter, 512, 540);
    ctx.fillText(letter, 512, 540); // doppio passaggio = più nitido

    // 2) Riempimento marrone scuro intenso (nero caldo, naturale come ferro inciso)
    ctx.shadowBlur = 0;
    const grad = ctx.createLinearGradient(0, 200, 0, 820);
    grad.addColorStop(0, '#1a1208');
    grad.addColorStop(0.5, '#0a0604');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillText(letter, 512, 540);

    // 3) Highlight scuro caldo (riflesso del marmo)
    ctx.fillStyle = 'rgba(40, 24, 8, 0.35)';
    ctx.fillText(letter, 510, 535);
  } else {
    // === LETTERA DORATA (B oro su colonna nera) ===
    ctx.fillStyle = 'rgba(20, 14, 6, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(letter, 512, 540);

    ctx.shadowColor = '#ffe9a6';
    ctx.shadowBlur = 40;
    const grad = ctx.createLinearGradient(0, 200, 0, 820);
    grad.addColorStop(0, '#fff2c4');
    grad.addColorStop(0.5, '#d4b87a');
    grad.addColorStop(1, '#a8895a');
    ctx.fillStyle = grad;
    ctx.fillText(letter, 512, 540);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 245, 200, 0.45)';
    ctx.fillText(letter, 510, 535);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const letterMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, side: THREE.DoubleSide,
    depthWrite: false
  });
  const letterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6), letterMat
  );
  letterPlane.position.set(x, y, z);
  return letterPlane;
}

// === ISTANZIAZIONE COLONNE ===
// Secondo il rituale: J (Jachin, corinzia) a destra entrando = x positivo
//                    B (Boaz, dorica)     a sinistra entrando = x negativo
const columnJ = createCorinthianColumnJ(2.6, whiteMarbleMat);
columnJ.position.z = 14;
scene.add(columnJ);

const columnB = createDoricColumnB(-2.6, blackMarbleMat);
columnB.position.z = 14;
scene.add(columnB);


// === ALTARI DEGLI ATTRIBUTI: Venere ed Ercole rappresentati dai loro simboli ===
// Soluzione iconografica pulita: niente figure umane, solo gli attributi della divinità
// Venere = Rosa di Cipro + Specchio + Colomba
// Ercole = Clava nodosa + Leontea (pelle del leone) + 3 Pomi delle Esperidi

function createAttributesAltar(x, type) {
  const group = new THREE.Group();

  // === PIEDISTALLO architettonico (uguale ai precedenti per coerenza) ===
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xede0c0, roughness: 0.4, metalness: 0.12,
    emissive: 0x2a2010, emissiveIntensity: 0.18
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0xb89a72, roughness: 0.5, metalness: 0.12,
    emissive: 0x1a1408, emissiveIntensity: 0.18
  });

  // Zoccolo a 2 gradini
  const stepLow = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.20, 1.6), darkStoneMat
  );
  stepLow.position.y = 0.10;
  group.add(stepLow);

  const stepHigh = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.20, 1.3), stoneMat
  );
  stepHigh.position.y = 0.30;
  group.add(stepHigh);

  // Corpo del piedistallo
  const pedBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.6, 1.0), stoneMat
  );
  pedBody.position.y = 1.70;
  group.add(pedBody);

  // Cornice dorata superiore (capitello)
  const pedTop1 = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.10, 1.20), goldMat
  );
  pedTop1.position.y = 3.05;
  group.add(pedTop1);

  // Piano d'appoggio in marmo
  const pedTop2 = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.20, 1.35), stoneMat
  );
  pedTop2.position.y = 3.20;
  group.add(pedTop2);

  // Cornice dorata inferiore (basamento)
  const pedBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.08, 1.15), goldMat
  );
  pedBase.position.y = 0.44;
  group.add(pedBase);

  // === ISCRIZIONE sul corpo del piedistallo ===
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024; labelCanvas.height = 384;
  const lCtx = labelCanvas.getContext('2d');
  lCtx.clearRect(0, 0, 1024, 384);
  // Cornice dorata
  lCtx.strokeStyle = '#d4b87a';
  lCtx.lineWidth = 5;
  lCtx.shadowColor = '#d4b87a';
  lCtx.shadowBlur = 10;
  lCtx.strokeRect(40, 40, 944, 304);
  lCtx.lineWidth = 2;
  lCtx.strokeRect(60, 60, 904, 264);
  // Nome
  lCtx.font = 'italic bold 140px "Trajan Pro", Georgia, serif';
  lCtx.textAlign = 'center';
  lCtx.textBaseline = 'middle';
  lCtx.fillStyle = '#d4b87a';
  lCtx.shadowColor = '#d4b87a';
  lCtx.shadowBlur = 22;
  lCtx.fillText(type === 'venus' ? 'VENVS' : 'HERCVLES', 512, 160);
  // Motto sotto
  lCtx.font = 'italic 60px "Trajan Pro", Georgia, serif';
  lCtx.shadowBlur = 12;
  lCtx.fillStyle = '#c8a868';
  lCtx.fillText(type === 'venus' ? '~ Pulchritudo ~' : '~ Virtus ~', 512, 270);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.anisotropy = 16;
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex, transparent: true, side: THREE.DoubleSide, depthWrite: false
  });
  const labelPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.47), labelMat
  );
  labelPlane.position.set(0, 1.85, 0.52);
  group.add(labelPlane);

  // === ATTRIBUTI SOPRA IL PIEDISTALLO ===
  const yTop = 3.30;  // piano d'appoggio

  if (type === 'venus') {
    // ============================================================
    // VENERE: Rosa di Cipro + Specchio + Colomba
    // ============================================================

    // === SPECCHIO DORATO al centro (in piedi, leggermente inclinato) ===
    const mirrorGroup = new THREE.Group();
    // Disco riflettente (lato anteriore)
    const mirrorDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.025, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0xe8d8a8, roughness: 0.15, metalness: 0.95,
        emissive: 0x6a4a18, emissiveIntensity: 0.3,
        clearcoat: 0.8, clearcoatRoughness: 0.15
      })
    );
    mirrorDisc.rotation.x = Math.PI / 2;
    mirrorGroup.add(mirrorDisc);
    // Cornice attorno allo specchio
    const mirrorFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.04, 16, 48), goldMat
    );
    mirrorFrame.rotation.x = Math.PI / 2;
    mirrorGroup.add(mirrorFrame);
    // Manico decorato
    const mirrorHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.028, 0.42, 18), goldMat
    );
    mirrorHandle.position.y = -0.52;
    mirrorGroup.add(mirrorHandle);
    // Pomello del manico
    const handleKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 24, 18), goldMat
    );
    handleKnob.position.y = -0.78;
    mirrorGroup.add(handleKnob);
    // Decorazione al raccordo manico-disco
    const handleColl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.040, 0.07, 18), goldMat
    );
    handleColl.position.y = -0.32;
    mirrorGroup.add(handleColl);

    mirrorGroup.position.set(0.15, yTop + 0.82, -0.05);
    mirrorGroup.rotation.z = 0.12;
    group.add(mirrorGroup);

    // === ROSA DI CIPRO a sinistra dello specchio ===
    const roseGroup = new THREE.Group();
    // Stelo
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.018, 0.55, 12),
      new THREE.MeshStandardMaterial({
        color: 0x3a5018, roughness: 0.7, metalness: 0.1
      })
    );
    stem.position.y = 0.28;
    roseGroup.add(stem);
    // Foglia sullo stelo
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x4a6a20, roughness: 0.6, metalness: 0.1
      })
    );
    leaf.scale.set(1.5, 0.3, 0.8);
    leaf.position.set(0.08, 0.25, 0);
    leaf.rotation.z = -0.4;
    roseGroup.add(leaf);
    // Corolla della rosa (più sferette stratificate per i petali)
    const roseColor = new THREE.MeshStandardMaterial({
      color: 0xa83245, roughness: 0.55, metalness: 0.15,
      emissive: 0x3a0a14, emissiveIntensity: 0.3
    });
    const roseCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 24, 18), roseColor
    );
    roseCore.position.y = 0.58;
    roseGroup.add(roseCore);
    // Strati di petali esterni
    for (let layer = 0; layer < 3; layer++) {
      const nPetals = 5 + layer * 2;
      const rLayer = 0.05 + layer * 0.04;
      const yLayer = 0.58 - layer * 0.015;
      for (let i = 0; i < nPetals; i++) {
        const a = (i / nPetals) * Math.PI * 2 + layer * 0.3;
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.05 + layer * 0.012, 16, 12), roseColor
        );
        petal.scale.set(1, 0.6, 0.8);
        petal.position.set(
          Math.cos(a) * rLayer,
          yLayer,
          Math.sin(a) * rLayer
        );
        petal.rotation.y = a;
        roseGroup.add(petal);
      }
    }
    roseGroup.position.set(-0.50, yTop, -0.10);
    roseGroup.rotation.z = -0.2;
    group.add(roseGroup);

    // === COLOMBA dorata a destra, in atto di volare ===
    const doveGroup = new THREE.Group();
    const doveMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5eddc, roughness: 0.4, metalness: 0.55,
      emissive: 0x3a2818, emissiveIntensity: 0.25,
      clearcoat: 0.4, clearcoatRoughness: 0.25
    });
    // Corpo
    const doveBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 18), doveMat
    );
    doveBody.scale.set(1.4, 0.85, 0.9);
    doveGroup.add(doveBody);
    // Testa
    const doveHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 16), doveMat
    );
    doveHead.position.set(0.16, 0.07, 0);
    doveGroup.add(doveHead);
    // Becco dorato
    const doveBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.018, 0.06, 12), goldMat
    );
    doveBeak.rotation.z = -Math.PI / 2;
    doveBeak.position.set(0.225, 0.07, 0);
    doveGroup.add(doveBeak);
    // Ala sinistra (alzata, gesto di volo)
    const wingL = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 18, 14), doveMat
    );
    wingL.scale.set(0.4, 0.18, 1.1);
    wingL.position.set(-0.03, 0.13, -0.16);
    wingL.rotation.x = 0.4;
    wingL.rotation.z = 0.3;
    doveGroup.add(wingL);
    // Ala destra
    const wingR = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 18, 14), doveMat
    );
    wingR.scale.set(0.4, 0.18, 1.1);
    wingR.position.set(-0.03, 0.13, 0.16);
    wingR.rotation.x = -0.4;
    wingR.rotation.z = 0.3;
    doveGroup.add(wingR);
    // Coda
    const doveTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.18, 14), doveMat
    );
    doveTail.scale.set(1, 1, 0.4);
    doveTail.rotation.z = Math.PI / 2;
    doveTail.position.set(-0.20, -0.02, 0);
    doveGroup.add(doveTail);
    // Zampette dorate
    for (let s = -1; s <= 1; s += 2) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), goldMat
      );
      leg.position.set(0, -0.10, s * 0.04);
      doveGroup.add(leg);
    }
    doveGroup.position.set(0.55, yTop + 0.20, 0.10);
    doveGroup.rotation.y = -0.3;
    doveGroup.rotation.z = -0.1;
    group.add(doveGroup);

  } else {
    // ============================================================
    // ERCOLE: Clava nodosa + Leontea drappeggiata + 3 pomi delle Esperidi
    // ============================================================

    // === CLAVA appoggiata in piedi (inclinata, regge il piedistallo simbolicamente) ===
    const clubGroup = new THREE.Group();
    const clubWoodMat = new THREE.MeshStandardMaterial({
      color: 0x5a3a18, roughness: 0.8, metalness: 0.1,
      emissive: 0x1a0a02, emissiveIntensity: 0.15
    });
    const clubWoodDarkMat = new THREE.MeshStandardMaterial({
      color: 0x3a2008, roughness: 0.85, metalness: 0.1
    });

    // Manico (cilindrico, sotto)
    const clubHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.10, 1.2, 24), clubWoodMat
    );
    clubHandle.position.y = 0.30;
    clubGroup.add(clubHandle);
    // Impugnatura legata (anelli scuri)
    for (let i = 0; i < 3; i++) {
      const grip = new THREE.Mesh(
        new THREE.TorusGeometry(0.082, 0.012, 12, 24), clubWoodDarkMat
      );
      grip.rotation.x = Math.PI / 2;
      grip.position.y = -0.15 + i * 0.10;
      clubGroup.add(grip);
    }
    // Testa nodosa della clava (sfera allungata + protuberanze)
    const clubHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 32, 24), clubWoodMat
    );
    clubHead.scale.set(1.0, 1.45, 1.0);
    clubHead.position.y = 1.20;
    clubGroup.add(clubHead);
    // Nodi della clava (piccole protuberanze irregolari)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 0.5;
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 18, 14), clubWoodDarkMat
      );
      knob.position.set(
        Math.cos(angle) * 0.28,
        1.20 + yOffset,
        Math.sin(angle) * 0.28
      );
      clubGroup.add(knob);
    }
    // Punta superiore della clava
    const clubTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 16), clubWoodMat
    );
    clubTop.position.y = 1.70;
    clubGroup.add(clubTop);

    clubGroup.position.set(0.05, yTop, -0.10);
    clubGroup.rotation.z = -0.10;
    group.add(clubGroup);

    // === LEONTEA drappeggiata sulla clava ===
    const leontea = new THREE.Group();
    const lionMat = new THREE.MeshStandardMaterial({
      color: 0xb87838, roughness: 0.55, metalness: 0.12,
      emissive: 0x3a1a08, emissiveIntensity: 0.2
    });
    // Testa del leone (drappeggiata sopra la clava)
    const lionHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.20, 32, 24), lionMat
    );
    lionHead.scale.set(1.1, 0.85, 1.0);
    lionHead.position.set(-0.45, yTop + 0.95, 0.10);
    group.add(lionHead);
    // Criniera (corona di sferette attorno alla testa)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      if (angle > Math.PI * 0.4 && angle < Math.PI * 1.6) continue; // niente dietro
      const tuft = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 18, 14), lionMat
      );
      tuft.position.set(
        -0.45 + Math.cos(angle) * 0.24,
        yTop + 0.95 + Math.sin(angle) * 0.20,
        0.10 + Math.sin(angle * 0.5) * 0.08
      );
      group.add(tuft);
    }
    // Drappo del corpo (pelle che cade sul piedistallo)
    const lionDrape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.60, 0.55),
      new THREE.MeshStandardMaterial({
        color: 0xb87838, roughness: 0.6, metalness: 0.1,
        emissive: 0x3a1a08, emissiveIntensity: 0.18,
        side: THREE.DoubleSide
      })
    );
    lionDrape.position.set(-0.45, yTop + 0.40, 0.20);
    lionDrape.rotation.x = -0.15;
    group.add(lionDrape);
    // Zampa anteriore visibile (appesa)
    const paw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.30, 16), lionMat
    );
    paw.position.set(-0.30, yTop + 0.32, 0.30);
    paw.rotation.z = 0.3;
    group.add(paw);
    // Artigli
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.012, 0.05, 10), goldMat
      );
      claw.position.set(-0.25 + i * 0.022, yTop + 0.15, 0.32);
      group.add(claw);
    }

    // === TRE POMI DELLE ESPERIDI in primo piano ===
    const appleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd770, roughness: 0.18, metalness: 0.92,
      emissive: 0xd4b87a, emissiveIntensity: 0.4,
      clearcoat: 0.7, clearcoatRoughness: 0.15
    });
    const applePositions = [
      [0.45,  yTop + 0.10, 0.22],
      [0.58,  yTop + 0.10, 0.05],
      [0.50,  yTop + 0.10, -0.15]
    ];
    applePositions.forEach((p, i) => {
      const apple = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 32, 24), appleMat
      );
      apple.position.set(p[0], p[1] + 0.04, p[2]);
      group.add(apple);
      // Piccolo gambo verde
      const aStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.014, 0.05, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a5018, roughness: 0.7 })
      );
      aStem.position.set(p[0], p[1] + 0.18, p[2]);
      group.add(aStem);
      // Foglia
      if (i === 0) {
        const aLeaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 14, 10),
          new THREE.MeshStandardMaterial({ color: 0x4a6a20, roughness: 0.6 })
        );
        aLeaf.scale.set(1.2, 0.25, 0.7);
        aLeaf.position.set(p[0] + 0.04, p[1] + 0.20, p[2]);
        aLeaf.rotation.z = -0.3;
        group.add(aLeaf);
      }
    });
  }

  group.position.set(x, 0, 13);
  return group;
}

// Alias di compatibilità
const createStatue = createAttributesAltar;

// Istanze: Venere a destra (x=+11), Ercole a sinistra (x=-11)
const venus = createStatue(11, 'venus');
const hercules = createStatue(-11, 'hercules');
scene.add(venus);
scene.add(hercules);

// === ALTARI DEI SORVEGLIANTI E DEL MAESTRO VENERABILE ===
// Maestro Venerabile (Oriente) - altare con maglietto, lume 3 luci, colonnina dorica
// Già al centro dell'Oriente, sul podio

// 1° Sorvegliante (Occidente) - altare su 2 gradini, lume 2 luci, colonnina ionica
// 2° Sorvegliante (Meridione) - altare su 1 gradino, lume 1 luce, colonnina corinzia

function createOfficialAltar(x, z, levels, lights, columnOrder, label) {
  // Seggio dignitoso con altare triangolare davanti
  const group = new THREE.Group();

  const officialWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3a1a08, roughness: 0.5, metalness: 0.2,
    emissive: 0x1a0804, emissiveIntensity: 0.18
  });
  const officialFelt = new THREE.MeshStandardMaterial({
    color: 0x6a1a1a, roughness: 0.85, metalness: 0.05,
    emissive: 0x2a0808, emissiveIntensity: 0.2
  });

  // === GRADINI (predella) ===
  for (let i = 0; i < levels; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(3.8 - i * 0.4, 0.3, 2.8 - i * 0.3), whiteMarbleMat
    );
    step.position.y = 0.15 + i * 0.3;
    group.add(step);
    // Bordo dorato del gradino superiore
    if (i === levels - 1) {
      const stepEdge = new THREE.Mesh(
        new THREE.BoxGeometry(3.85 - i * 0.4, 0.04, 2.85 - i * 0.3), goldMat
      );
      stepEdge.position.y = 0.32 + i * 0.3;
      group.add(stepEdge);
    }
  }

  const baseY = 0.15 + levels * 0.3;

  // === SEDIA (Stallo) ===
  // Sedile imbottito
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.3, 1.4), officialFelt
  );
  seat.position.set(0, baseY + 0.45, -0.3);
  group.add(seat);

  // Cornice del sedile
  const seatBorder = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.1, 1.5), goldMat
  );
  seatBorder.position.set(0, baseY + 0.27, -0.3);
  group.add(seatBorder);

  // === SCHIENALE ALTO ===
  // Pannello posteriore in legno
  const seatBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 2.4, 0.18), officialWoodMat
  );
  seatBack.position.set(0, baseY + 1.6, -1.0);
  group.add(seatBack);

  // Tessuto rosso al centro dello schienale
  const seatBackFelt = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.85, 0.05), officialFelt
  );
  seatBackFelt.position.set(0, baseY + 1.55, -0.92);
  group.add(seatBackFelt);

  // Cornice dorata attorno al tessuto
  [
    { w: 1.2, h: 0.08, dx: 0,    dy:  0.97 },  // top
    { w: 1.2, h: 0.08, dx: 0,    dy: -0.95 },  // bottom
    { w: 0.08, h: 1.9, dx: -0.58, dy: 0   },   // left
    { w: 0.08, h: 1.9, dx:  0.58, dy: 0   }    // right
  ].forEach(b => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, 0.06), goldMat
    );
    bar.position.set(b.dx, baseY + 1.55 + b.dy, -0.89);
    group.add(bar);
  });

  // === CIMASA: pinnacoli dorati sopra lo schienale ===
  const pinCenter = new THREE.Mesh(
    new THREE.ConeGeometry(0.10, 0.35, 18), goldMat
  );
  pinCenter.position.set(0, baseY + 3.0, -1.0);
  group.add(pinCenter);
  const pinCenterBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 32, 24), goldMat
  );
  pinCenterBase.position.set(0, baseY + 2.85, -1.0);
  group.add(pinCenterBase);

  for (let s = -1; s <= 1; s += 2) {
    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.25, 18), goldMat
    );
    pin.position.set(s * 0.66, baseY + 2.92, -1.0);
    group.add(pin);
  }

  // === BRACCIOLI con voluta ===
  for (let s = -1; s <= 1; s += 2) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.65, 1.3), officialWoodMat
    );
    arm.position.set(s * 0.78, baseY + 0.93, -0.3);
    group.add(arm);
    const armTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 1.35), goldMat
    );
    armTop.position.set(s * 0.78, baseY + 1.28, -0.3);
    group.add(armTop);
    // Voluta anteriore
    const volute = new THREE.Mesh(
      new THREE.TorusGeometry(0.10, 0.025, 16, 36, Math.PI * 1.5), goldMat
    );
    volute.position.set(s * 0.78, baseY + 1.20, 0.32);
    volute.rotation.y = Math.PI / 2;
    volute.rotation.z = s > 0 ? 0 : Math.PI;
    group.add(volute);
  }

  // === ALTARE TRIANGOLARE davanti al seggio ===
  const altarShape = new THREE.Shape();
  altarShape.moveTo(0, 0.85);
  altarShape.lineTo(-0.7, -0.4);
  altarShape.lineTo(0.7, -0.4);
  altarShape.closePath();
  const altarGeo = new THREE.ExtrudeGeometry(altarShape, {
    depth: 1.15, bevelEnabled: true,
    bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4
  });
  const altarMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a08, roughness: 0.4, metalness: 0.45,
    emissive: 0x1a0a04, emissiveIntensity: 0.22
  });
  const altar = new THREE.Mesh(altarGeo, altarMat);
  altar.rotation.x = -Math.PI / 2;
  altar.position.set(0, baseY + 0.35, 0.6);
  group.add(altar);

  // Cornice dorata sulla cima dell'altare triangolare
  for (const [x1, x2, z1, z2] of [
    [-0.7, 0.0, -0.4, 0.85],
    [0.0, 0.7,  0.85, -0.4],
    [-0.7, 0.7, -0.4, -0.4]
  ]) {
    const len = Math.hypot(x2-x1, z2-z1);
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, len), goldMat
    );
    bar.position.set((x1+x2)/2, baseY + 0.95, 0.6 + (z1+z2)/2 - 0.225);
    bar.rotation.y = Math.atan2(x2-x1, z2-z1);
    group.add(bar);
  }

  // === MAGLIETTO sull'altare ===
  const malletHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, 0.35, 24),
    new THREE.MeshStandardMaterial({ color: 0x5a3018, roughness: 0.65 })
  );
  malletHead.rotation.z = Math.PI / 2;
  malletHead.position.set(-0.28, baseY + 1.0, 0.6);
  group.add(malletHead);
  const malletHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.55, 24),
    new THREE.MeshStandardMaterial({ color: 0x7a4a22, roughness: 0.7 })
  );
  malletHandle.rotation.z = Math.PI / 2;
  malletHandle.position.set(0.05, baseY + 1.0, 0.6);
  group.add(malletHandle);

  // === LUME a 1/2/3 luci ===
  const candleBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.16, 24), goldMat
  );
  candleBase.position.set(0.35, baseY + 0.94, 0.6);
  group.add(candleBase);
  for (let i = 0; i < lights; i++) {
    const branchHeight = 0.32 + i * 0.10;
    const offset = (i - (lights - 1) / 2) * 0.18;
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, branchHeight, 24),
      new THREE.MeshStandardMaterial({ color: 0xf5e6c8 })
    );
    candle.position.set(0.35 + offset, baseY + 1.10 + branchHeight / 2, 0.6);
    group.add(candle);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffeb99, transparent: true, opacity: 0.92
      })
    );
    flame.position.set(0.35 + offset, baseY + 1.10 + branchHeight + 0.06, 0.6);
    group.add(flame);
  }

  // === COLONNINA MOBILE (dorica/ionica/corinzia) ===
  const columnPos = new THREE.Vector3(0, baseY + 0.94, 0.85);
  const colHeight = 0.65;
  const colShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, colHeight, 24), whiteMarbleMat
  );
  colShaft.position.copy(columnPos);
  colShaft.position.y += colHeight / 2;
  group.add(colShaft);

  // Base della colonnina
  const colBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.07, 24), goldMat
  );
  colBase.position.copy(columnPos);
  colBase.position.y += 0.035;
  group.add(colBase);

  // Capitello differenziato per ordine
  if (columnOrder === 'doric') {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.08, 0.10, 24), goldMat
    );
    cap.position.copy(columnPos);
    cap.position.y += colHeight + 0.05;
    group.add(cap);
  } else if (columnOrder === 'ionic') {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.08, 0.14), goldMat
    );
    cap.position.copy(columnPos);
    cap.position.y += colHeight + 0.05;
    group.add(cap);
    for (let i = -1; i <= 1; i += 2) {
      const volute = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, 0.018, 16, 36), goldMat
      );
      volute.position.set(columnPos.x + i * 0.10, columnPos.y + colHeight + 0.05, columnPos.z);
      group.add(volute);
    }
  } else { // corinthian
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.08, 0.14, 24), goldMat
    );
    cap.position.copy(columnPos);
    cap.position.y += colHeight + 0.07;
    group.add(cap);
    // Foglie d'acanto
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.035, 0.10, 18), goldMat
      );
      leaf.position.set(
        columnPos.x + Math.cos(angle) * 0.11,
        columnPos.y + colHeight + 0.07,
        columnPos.z + Math.sin(angle) * 0.11
      );
      leaf.rotation.x = -0.3;
      group.add(leaf);
    }
  }

  // === ETICHETTA dell'ufficiale (placca dorata sul gradino) ===
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512; labelCanvas.height = 128;
  const lCtx = labelCanvas.getContext('2d'); lCtx.scale(2, 2);
  lCtx.clearRect(0, 0, 256, 64);
  lCtx.strokeStyle = '#d4b87a';
  lCtx.lineWidth = 2;
  lCtx.strokeRect(8, 8, 240, 48);
  lCtx.font = 'italic bold 32px Georgia, serif';
  lCtx.textAlign = 'center';
  lCtx.textBaseline = 'middle';
  lCtx.fillStyle = '#d4b87a';
  lCtx.shadowColor = '#d4b87a';
  lCtx.shadowBlur = 12;
  lCtx.fillText(label, 128, 34);
  const labelTex = new THREE.CanvasTexture(labelCanvas); labelTex.anisotropy = 16;
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex, transparent: true, side: THREE.DoubleSide
  });
  const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), labelMat);
  labelPlane.position.set(0, baseY - 0.1, 1.45);
  group.add(labelPlane);

  group.position.set(x, 0, z);
  return group;
}

// 1° Sorvegliante - OCCIDENTE: RIMOSSO (bloccava la vista dell'Ara)
// const firstSurvAltar = createOfficialAltar(0, 12, 2, 2, 'ionic', '1° SORVEGLIANTE');
// firstSurvAltar.rotation.y = Math.PI;
// scene.add(firstSurvAltar);

// 2° Sorvegliante - MERIDIONE (lato destro entrando), 1 gradino, lume 1 luce, corinzio
const secondSurvAltar = createOfficialAltar(12, 0, 1, 1, 'corinthian', '2° SORVEGLIANTE');
secondSurvAltar.rotation.y = -Math.PI / 2; // guarda verso il centro
scene.add(secondSurvAltar);

// === 1° SORVEGLIANTE — all'inizio del Tempio, lato Colonna B (Settentrione) ===
// Per Rituale: 2 gradini, lume a 2 luci, colonnina mobile di ordine IONICO
// Posizionato tra Colonna B (x=-2.6, z=14) ed Ercole (x=-11, z=13)
const firstSurvAltar = createOfficialAltar(-7, 13, 2, 2, 'ionic', '1° SORVEGLIANTE');
firstSurvAltar.rotation.y = Math.PI; // guarda verso l'Oriente (M.Ven)
scene.add(firstSurvAltar);


// === ARA DEI GIURAMENTI (al centro del Tempio) con tappeto azzurro ===
const sacredAltarGroup = new THREE.Group();

// Tappeto azzurro sotto l'ara
const carpet = new THREE.Mesh(
  new THREE.BoxGeometry(4, 0.05, 4),
  new THREE.MeshStandardMaterial({
    color: 0x1a4090, roughness: 0.8, metalness: 0.1,
    emissive: 0x0a2050, emissiveIntensity: 0.2
  })
);
carpet.position.y = 0.08;
sacredAltarGroup.add(carpet);

// Frange dorate del tappeto
for (let i = -2; i <= 2; i += 0.4) {
  for (let side = -1; side <= 1; side += 2) {
    const fringe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.15, 24),
      goldMat
    );
    fringe.position.set(i, 0.05, side * 2);
    sacredAltarGroup.add(fringe);
  }
}

// Corpo dell'ara
const sacredAltarBase = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 0.4, 2.2), goldMat
);
sacredAltarBase.position.y = 0.3;
sacredAltarGroup.add(sacredAltarBase);

// Corpo principale dell'Ara con materiale fisico (clearcoat sui bordi)
const sacredAltarBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1.6, 1.8),
  new THREE.MeshPhysicalMaterial({
    color: 0x2a2418, roughness: 0.35, metalness: 0.55,
    emissive: 0x1a1408, emissiveIntensity: 0.2,
    clearcoat: 0.4, clearcoatRoughness: 0.3,
    envMapIntensity: 0
  })
);
sacredAltarBody.position.y = 1.3;
sacredAltarGroup.add(sacredAltarBody);

// CORNICI DORATE sui 4 spigoli verticali del corpo dell'Ara
for (let sx = -1; sx <= 1; sx += 2) {
  for (let sz = -1; sz <= 1; sz += 2) {
    const edge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.6, 16), goldMat
    );
    edge.position.set(sx * 0.92, 1.3, sz * 0.92);
    sacredAltarGroup.add(edge);
  }
}

// Modanatura dorata orizzontale alla base del corpo dell'Ara
const altarBaseTrim = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.06, 2.0), goldMat
);
altarBaseTrim.position.y = 0.53;
sacredAltarGroup.add(altarBaseTrim);

// Modanatura dorata orizzontale alla sommità del corpo (sotto il top)
const altarUpperTrim = new THREE.Mesh(
  new THREE.BoxGeometry(1.95, 0.06, 1.95), goldMat
);
altarUpperTrim.position.y = 2.03;
sacredAltarGroup.add(altarUpperTrim);

const sacredAltarTop = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 0.25, 2.2), goldMat
);
sacredAltarTop.position.y = 2.2;
sacredAltarGroup.add(sacredAltarTop);

// Libro della Legge Sacra aperto sull'ara
const bookGroup = new THREE.Group();
const bookBaseGeo = new THREE.BoxGeometry(1.4, 0.08, 1.0);
const bookMat = new THREE.MeshStandardMaterial({
  color: 0x3a2010, roughness: 0.6, metalness: 0.2
});
const bookBase = new THREE.Mesh(bookBaseGeo, bookMat);
bookGroup.add(bookBase);

// Pagine bianche
const pages = new THREE.Mesh(
  new THREE.BoxGeometry(1.35, 0.04, 0.95),
  new THREE.MeshStandardMaterial({
    color: 0xf5f0e0, roughness: 0.7,
    emissive: 0x2a2418, emissiveIntensity: 0.1
  })
);
pages.position.y = 0.06;
bookGroup.add(pages);

// Riga centrale del libro aperto
const bookFold = new THREE.Mesh(
  new THREE.BoxGeometry(0.05, 0.05, 0.95), bookMat
);
bookFold.position.y = 0.08;
bookGroup.add(bookFold);

bookGroup.position.set(0, 2.35, 0);
sacredAltarGroup.add(bookGroup);

// Squadra e Compasso sul Libro
const squareCompassGroup = new THREE.Group();
// Squadra
const squareV = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.04, 0.7), goldMat
);
squareV.position.set(0, 0, -0.05);
squareCompassGroup.add(squareV);
const squareH = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.04, 0.08), goldMat
);
squareH.position.set(0.31, 0, 0.3);
squareCompassGroup.add(squareH);

// Compasso (sopra la squadra - grado di Apprendista: punte sotto)
const compArmL = new THREE.Mesh(
  new THREE.BoxGeometry(0.05, 0.03, 0.65), goldMat
);
compArmL.position.set(-0.15, 0.08, 0);
compArmL.rotation.y = Math.PI / 7;
squareCompassGroup.add(compArmL);

const compArmR = new THREE.Mesh(
  new THREE.BoxGeometry(0.05, 0.03, 0.65), goldMat
);
compArmR.position.set(0.15, 0.08, 0);
compArmR.rotation.y = -Math.PI / 7;
squareCompassGroup.add(compArmR);

const compPivot = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 32, 24), goldMat
);
compPivot.position.set(0, 0.12, -0.3);
squareCompassGroup.add(compPivot);

squareCompassGroup.position.set(0, 2.42, 0);
sacredAltarGroup.add(squareCompassGroup);

// MENORAH a 7 bracci sull'ara
const menorahGroup = new THREE.Group();
const menorahBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.2, 0.08, 24), goldMat
);
menorahBase.position.y = 0.04;
menorahGroup.add(menorahBase);

const menorahStem = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 0.5, 24), goldMat
);
menorahStem.position.y = 0.33;
menorahGroup.add(menorahStem);

// 7 bracci (3+1+3) - quello centrale dritto, gli altri curvi
for (let i = -3; i <= 3; i++) {
  if (i === 0) {
    // Braccio centrale verticale
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.3, 24), goldMat
    );
    branch.position.set(0, 0.75, 0);
    menorahGroup.add(branch);
    
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffeb99, transparent: true, opacity: 0.95
      })
    );
    flame.position.set(0, 0.92, 0);
    menorahGroup.add(flame);
  } else {
    // Bracci curvi (semicerchi)
    const radius = Math.abs(i) * 0.1;
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012, 16, 36, Math.PI),
      goldMat
    );
    torus.position.set(0, 0.6 - radius, 0);
    torus.rotation.z = i > 0 ? Math.PI : 0;
    torus.rotation.y = i > 0 ? 0 : Math.PI;
    menorahGroup.add(torus);
    
    // Candela in cima
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.2 + Math.abs(i) * 0.04, 8), goldMat
    );
    candle.position.set(i * 0.1, 0.7 + Math.abs(i) * 0.02, 0);
    menorahGroup.add(candle);
    
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffeb99, transparent: true, opacity: 0.95
      })
    );
    flame.position.set(i * 0.1, 0.82 + Math.abs(i) * 0.02, 0);
    menorahGroup.add(flame);
  }
}

menorahGroup.position.set(-0.7, 2.32, 0.6);
sacredAltarGroup.add(menorahGroup);

// LIBERTÀ - UGUAGLIANZA - FRATELLANZA sul lato Occidente
const mottoCanvas = document.createElement('canvas');
mottoCanvas.width = 1024; mottoCanvas.height = 512;
const mCtx = mottoCanvas.getContext('2d');
mCtx.scale(2, 2);
mCtx.clearRect(0, 0, 512, 256);
mCtx.strokeStyle = '#d4b87a';
mCtx.lineWidth = 3;
mCtx.strokeRect(20, 20, 472, 216);
mCtx.font = 'italic bold 42px Georgia';
mCtx.textAlign = 'center';
mCtx.fillStyle = '#d4b87a';
mCtx.shadowColor = '#d4b87a';
mCtx.shadowBlur = 15;
mCtx.fillText('LIBERTÀ', 256, 85);
mCtx.fillText('UGUAGLIANZA', 256, 135);
mCtx.fillText('FRATELLANZA', 256, 185);

const mottoTex = new THREE.CanvasTexture(mottoCanvas); mottoTex.anisotropy = 16;
const mottoMat = new THREE.MeshBasicMaterial({
  map: mottoTex, transparent: true, side: THREE.DoubleSide
});
const mottoPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1.6, 0.8), mottoMat
);
mottoPlane.position.set(0, 1.3, 0.91);
sacredAltarGroup.add(mottoPlane);

sacredAltarGroup.position.set(0, 0, 0);
scene.add(sacredAltarGroup);
// === SPADA FIAMMEGGIANTE del Maestro Venerabile (Rituale pag. 40) ===
// Posizionata in piedi sull'Ara dei Giuramenti, lama ondulata che si erge
const swordGroup = new THREE.Group();

// Materiali specifici della spada
const bladeSteelMat = new THREE.MeshStandardMaterial({
  color: 0xe0e0e8, roughness: 0.18, metalness: 0.95,
  emissive: 0xff7a20, emissiveIntensity: 0.55
});
const hiltGoldMat = new THREE.MeshStandardMaterial({
  color: 0xd4b87a, roughness: 0.2, metalness: 0.92,
  emissive: 0xd4b87a, emissiveIntensity: 0.4
});
const gripMat = new THREE.MeshStandardMaterial({
  color: 0x3a1a0a, roughness: 0.85, metalness: 0.05
});

// === LAMA ONDULATA (effetto fiammeggiante) ===
// Costruita come Shape 2D ondulata + extrude
const bladeShape = new THREE.Shape();
const bladeLength = 2.2;
const baseHalfWidth = 0.06;
const segments = 28;

// Edge destro (saliente)
for (let i = 0; i <= segments; i++) {
  const t = i / segments;
  const y = t * bladeLength;
  const wave = Math.sin(t * Math.PI * 3.2) * 0.045;
  const width = baseHalfWidth * (1 - t * 0.55);
  if (i === 0) bladeShape.moveTo(width + wave, y);
  else bladeShape.lineTo(width + wave, y);
}
// Punta in cima
bladeShape.lineTo(0, bladeLength + 0.12);
// Edge sinistro (discendente)
for (let i = segments; i >= 0; i--) {
  const t = i / segments;
  const y = t * bladeLength;
  const wave = Math.sin(t * Math.PI * 3.2) * 0.045;
  const width = baseHalfWidth * (1 - t * 0.55);
  bladeShape.lineTo(-width + wave, y);
}

const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
  depth: 0.03,
  bevelEnabled: true,
  bevelSize: 0.008,
  bevelThickness: 0.008,
  bevelSegments: 4,
  curveSegments: 16
});
bladeGeo.center();
const blade = new THREE.Mesh(bladeGeo, bladeSteelMat);
blade.position.y = bladeLength / 2 + 0.5;
swordGroup.add(blade);

// === CROCIERA (cross-guard) ===
const crossguardCenter = new THREE.Mesh(
  new THREE.BoxGeometry(0.85, 0.10, 0.10), hiltGoldMat
);
crossguardCenter.position.y = 0.4;
swordGroup.add(crossguardCenter);

// Estremità della crociera arricciate (decorazione)
for (let s = -1; s <= 1; s += 2) {
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 32, 24), hiltGoldMat
  );
  tip.position.set(s * 0.45, 0.4, 0);
  swordGroup.add(tip);

  // Voluta decorativa (piccolo riccio)
  const curl = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.018, 16, 36, Math.PI),
    hiltGoldMat
  );
  curl.position.set(s * 0.45, 0.42, 0);
  curl.rotation.x = Math.PI / 2;
  curl.rotation.z = s > 0 ? -Math.PI/2 : Math.PI/2;
  swordGroup.add(curl);
}

// === IMPUGNATURA (grip) avvolta ===
const grip = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.05, 0.4, 24),
  gripMat
);
grip.position.y = 0.16;
swordGroup.add(grip);

// Avvolgimento dorato del grip
for (let i = 0; i < 5; i++) {
  const wrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.012, 16, 36),
    hiltGoldMat
  );
  wrap.position.y = 0.0 + i * 0.08;
  wrap.rotation.x = Math.PI / 2;
  swordGroup.add(wrap);
}

// === POMOLO (pommel) ===
const pommel = new THREE.Mesh(
  new THREE.SphereGeometry(0.10, 32, 24), hiltGoldMat
);
pommel.position.y = -0.06;
swordGroup.add(pommel);

// Piccola stella dorata sul pomolo
const pommelStar = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.05, 0),
  new THREE.MeshStandardMaterial({
    color: 0xffe9a6, roughness: 0.1, metalness: 0.95,
    emissive: 0xffe9a6, emissiveIntensity: 0.7
  })
);
pommelStar.position.y = -0.06;
pommelStar.position.z = 0.08;
swordGroup.add(pommelStar);

// === LUCE EMISSIVA della lama (alone fiammeggiante) ===
const flameAura = new THREE.PointLight(0xff6a20, 1.2, 4.5, 2);
flameAura.position.y = 1.5;
swordGroup.add(flameAura);

// Posizionamento finale: in piedi sull'Ara dei Giuramenti
// L'Ara è a (0, 0, 0) con top a y=2.42 — la spada parte da y=2.45 in su
swordGroup.position.set(0.6, 2.45, 0.3);
swordGroup.rotation.x = -Math.PI / 14;  // leggera inclinazione in avanti
swordGroup.rotation.z = Math.PI / 28;   // leggera inclinazione laterale
scene.add(swordGroup);

// Riferimento globale per future animazioni della fiamma
const flameAuraLight = flameAura;


// === TRE CANDELABRI ATTORNO AL CENTRO (disposti a triangolo) ===
function createTallCandelabra(x, z) {
  const group = new THREE.Group();

  // === BASE LARGA E MODANATA (4 strati) ===
  // Disco inferiore largo
  const baseDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.62, 0.12, 32), goldMat
  );
  baseDisc.position.y = 0.06;
  group.add(baseDisc);

  // Modanatura intermedia
  const baseMid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 0.10, 32), goldMat
  );
  baseMid.position.y = 0.17;
  group.add(baseMid);

  // Toro decorativo sopra la modanatura
  const baseTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.06, 16, 36), goldMat
  );
  baseTorus.position.y = 0.26;
  baseTorus.rotation.x = Math.PI / 2;
  group.add(baseTorus);

  // Collare al raccordo base-stelo
  const baseCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.32, 0.16, 32), goldMat
  );
  baseCollar.position.y = 0.40;
  group.add(baseCollar);

  // === STELO ROBUSTO (più spesso, con modanature) ===
  // Stelo principale
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.15, 2.5, 32), goldMat
  );
  stem.position.y = 1.75;
  group.add(stem);

  // Nodi/modanature lungo lo stelo (tre anelli)
  for (let i = 0; i < 3; i++) {
    const knot = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 32, 24), goldMat
    );
    knot.scale.set(1, 0.55, 1);
    knot.position.y = 0.75 + i * 0.85;
    group.add(knot);

    const knotRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.020, 14, 32), goldMat
    );
    knotRing.position.y = 0.75 + i * 0.85;
    knotRing.rotation.x = Math.PI / 2;
    group.add(knotRing);
  }

  // === COPPA PIÙ AMPIA E DECORATA ===
  // Collare sotto la coppa
  const cupCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.10, 0.08, 24), goldMat
  );
  cupCollar.position.y = 3.05;
  group.add(cupCollar);

  // Coppa a calice (più ampia)
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.16, 0.28, 32), goldMat
  );
  cup.position.y = 3.23;
  group.add(cup);

  // Bordo della coppa
  const cupRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.025, 14, 36), goldMat
  );
  cupRim.position.y = 3.36;
  cupRim.rotation.x = Math.PI / 2;
  group.add(cupRim);

  // === CANDELA PIÙ CIOTTA (cilindro spesso color cera) ===
  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6c8, roughness: 0.7, metalness: 0.0,
    emissive: 0x6a4a18, emissiveIntensity: 0.15
  });
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.55, 32), candleMat
  );
  candle.position.y = 3.71;
  group.add(candle);

  // Sgocciolature di cera attorno alla candela
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
    const drip = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 14, 10), candleMat
    );
    drip.scale.set(1, 1.8, 1);
    drip.position.set(
      Math.cos(angle) * 0.14,
      3.62 - Math.random() * 0.15,
      Math.sin(angle) * 0.14
    );
    group.add(drip);
  }

  // Stoppino visibile (piccolo cilindro nero)
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.008, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1408, roughness: 0.9 })
  );
  wick.position.y = 4.00;
  group.add(wick);

  // === FIAMMA A GOCCIA ben definita (3 strati) ===
  // Alone esterno arancio (più ampio, sfumato)
  const flameAuraMat = new THREE.MeshBasicMaterial({
    color: 0xff7a30, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const flameAura = new THREE.Mesh(
    new THREE.ConeGeometry(0.20, 0.55, 24, 1, true), flameAuraMat
  );
  flameAura.position.y = 4.22;
  group.add(flameAura);

  // Cuore dorato (la "lingua di fuoco")
  const flameCoreMat = new THREE.MeshBasicMaterial({
    color: 0xffd060, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.10, 0.38, 24), flameCoreMat
  );
  flameCore.position.y = 4.16;
  group.add(flameCore);

  // Nucleo bianco/azzurro alla base (cuore caldo)
  const flameNucleusMat = new THREE.MeshBasicMaterial({
    color: 0xfff5dd, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const flameNucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 24, 18), flameNucleusMat
  );
  flameNucleus.scale.set(1.0, 1.6, 1.0);
  flameNucleus.position.y = 4.06;
  group.add(flameNucleus);

  // BAGLIORE (alone luminoso) attorno alla fiamma
  const glow = createCandleGlow(1.6);
  glow.position.y = 4.18;
  group.add(glow);

  group.position.set(x, 0, z);
  // Espongo i 3 livelli + il glow per il flicker
  return {
    group: group,
    flame: flameCore,
    flameAura: flameAura,
    flameNucleus: flameNucleus,
    glow: glow
  };
}

// Disposti a triangolo equilatero attorno al pavimento mosaico centrale
const cand1 = createTallCandelabra(0, -5);   // verso Oriente
const cand2 = createTallCandelabra(-4, 5);   // sud-ovest
const cand3 = createTallCandelabra(4, 5);    // sud-est
scene.add(cand1.group);
scene.add(cand2.group);
scene.add(cand3.group);

// === CANDELE PERIMETRALI per atmosfera esoterica ===
// Disposte lungo il perimetro INTERNO del Tempio (tra colonne zodiacali e centro)
// Fiamme con bloom esposto, NESSUNA PointLight aggiunta (per evitare il limite WebGL r128)
// Il glow viene dal bloom shader + AdditiveBlending sulle fiamme
function createWallCandle(x, z, h) {
  h = h || 1.6;
  const group = new THREE.Group();

  // Materiale ferro brunito
  const ironDark = new THREE.MeshStandardMaterial({
    color: 0x1a0a04, roughness: 0.6, metalness: 0.55,
    emissive: 0x080402, emissiveIntensity: 0.1
  });

  // Base larga dorata
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.08, 24), goldMat
  );
  base.position.y = 0.04;
  group.add(base);

  // Modanatura
  const baseM = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.022, 12, 28), goldMat
  );
  baseM.position.y = 0.10;
  baseM.rotation.x = Math.PI / 2;
  group.add(baseM);

  // Stelo in ferro brunito (più sottile)
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.038, h - 0.20, 18), ironDark
  );
  stem.position.y = (h - 0.20) / 2 + 0.12;
  group.add(stem);

  // Coppa a tulipano dorata
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.06, 0.10, 20), goldMat
  );
  cup.position.y = h + 0.04;
  group.add(cup);

  // Bordo coppa
  const cupRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.012, 12, 24), goldMat
  );
  cupRim.position.y = h + 0.09;
  cupRim.rotation.x = Math.PI / 2;
  group.add(cupRim);

  // Candela ciotta (cera bianca crema)
  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6c8, roughness: 0.65, metalness: 0.0,
    emissive: 0x6a4a18, emissiveIntensity: 0.12
  });
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.30, 24), candleMat
  );
  candle.position.y = h + 0.24;
  group.add(candle);

  // Stoppino
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.006, 0.03, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1408, roughness: 0.9 })
  );
  wick.position.y = h + 0.40;
  group.add(wick);

  // === FIAMMA A GOCCIA (3 strati) — fortemente emissive per bloom ===
  // Alone esterno arancio
  const fAura = new THREE.Mesh(
    new THREE.ConeGeometry(0.10, 0.28, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff8030, transparent: true, opacity: 0.40,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  fAura.position.y = h + 0.55;
  group.add(fAura);

  // Cuore dorato (a goccia)
  const fCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffd060, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  fCore.position.y = h + 0.50;
  group.add(fCore);

  // Nucleo bianco caldo
  const fNuc = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 18, 14),
    new THREE.MeshBasicMaterial({
      color: 0xfff5dd, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  fNuc.scale.set(1.0, 1.5, 1.0);
  fNuc.position.y = h + 0.45;
  group.add(fNuc);

  // BAGLIORE (alone luminoso) attorno alla fiamma
  const glow = createCandleGlow(0.95);
  glow.position.y = h + 0.50;
  group.add(glow);

  group.position.set(x, FLOOR_TOP, z);
  group.userData = { flame: fCore, flameAura: fAura, flameNucleus: fNuc, glow: glow };
  return group;
}

// 16 candele perimetrali (4 per lato), disposte tra colonne zodiacali e centro
const wallCandles = [];
const candleLayout = [
  // Settentrione RIMOSSE (stavano dietro le Colonne J e B dell'ingresso)
  // Meridione (z=-17) — OLTRE la colonna zodiacale più a Sud (a z=-13)
  [-9, -17], [-3, -17], [3, -17], [9, -17],
  // Oriente (x=+16.5) — OLTRE la fila di colonne zodiacali a x=+14
  [16.5, 8], [16.5, 2], [16.5, -4], [16.5, -10],
  // Occidente (x=-16.5) — OLTRE la fila di colonne zodiacali a x=-14
  [-16.5, 8], [-16.5, 2], [-16.5, -4], [-16.5, -10]
];
candleLayout.forEach(([x, z]) => {
  const c = createWallCandle(x, z, 1.5 + Math.random() * 0.25);
  scene.add(c);
  wallCandles.push(c);
});


const candFlames = [cand1, cand2, cand3];  // oggetti completi con flame/flameAura/flameNucleus

// === STRUMENTI APPRENDISTI (Settentrione - lato sinistro entrando) ===
// Materiali condivisi e migliori
const ironMat = new THREE.MeshStandardMaterial({
  color: 0xb8b8b8, roughness: 0.4, metalness: 0.85,
  emissive: 0x1a1a1a, emissiveIntensity: 0.1
});
const ironDarkMat = new THREE.MeshStandardMaterial({
  color: 0x4a4a4f, roughness: 0.55, metalness: 0.75,
  emissive: 0x0a0a0a, emissiveIntensity: 0.08
});
const ropeMat = new THREE.MeshStandardMaterial({
  color: 0xc8a868, roughness: 0.85, metalness: 0.05
});

// FLOOR_TOP è dichiarato in cima al file

// === BASE D'APPOGGIO sotto gli strumenti (piccolo basamento di marmo) ===
function createToolBase(x, z, w, d) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.05, d),
    new THREE.MeshStandardMaterial({
      color: 0xc8b896, roughness: 0.5, metalness: 0.15,
      emissive: 0x2a2418, emissiveIntensity: 0.18
    })
  );
  base.position.set(x, FLOOR_TOP + 0.025, z);
  return base;
}

// PIETRA GREZZA: dodecaedro irregolare leggermente più grande
const roughStone = new THREE.Mesh(
  new THREE.DodecahedronGeometry(0.7, 1),
  new THREE.MeshStandardMaterial({
    color: 0x7a604a, roughness: 0.92, metalness: 0.12,
    emissive: 0x1a1408, emissiveIntensity: 0.12
  })
);
roughStone.position.set(-9, FLOOR_TOP + 0.65, 8);
scene.add(roughStone);

// Piccolo basamento sotto la pietra grezza
scene.add(createToolBase(-9, 8, 1.8, 1.8));

// FILO A PIOMBO: cavalletto a treppiede + filo + cono
const plumbGroup = new THREE.Group();

// Treppiede di sostegno (3 gambe a triangolo)
for (let i = 0; i < 3; i++) {
  const angle = (i / 3) * Math.PI * 2;
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.4, 24), woodMat
  );
  leg.position.set(
    Math.cos(angle) * 0.18, 0.7, Math.sin(angle) * 0.18
  );
  // Inclina verso il centro in alto
  const tilt = 0.15;
  leg.rotation.x = -Math.sin(angle) * tilt;
  leg.rotation.z =  Math.cos(angle) * tilt;
  plumbGroup.add(leg);
}

// Anello dorato in cima al treppiede
const plumbRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.04, 0.012, 16, 36), goldMat
);
plumbRing.position.y = 1.42;
plumbRing.rotation.x = Math.PI / 2;
plumbGroup.add(plumbRing);

// Cordino (sottile, marroncino come spago)
const plumbLine = new THREE.Mesh(
  new THREE.CylinderGeometry(0.008, 0.008, 1.1, 24),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 })
);
plumbLine.position.y = 0.85;
plumbGroup.add(plumbLine);

// Piombo a goccia dorato in fondo al filo
const plumbWeight = new THREE.Mesh(
  new THREE.ConeGeometry(0.13, 0.42, 24), goldMat
);
plumbWeight.position.y = 0.08;
plumbWeight.rotation.z = Math.PI;
plumbGroup.add(plumbWeight);
// Sfera dorata sopra il cono (raccordo)
const plumbCap = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 32, 24), goldMat
);
plumbCap.position.y = 0.28;
plumbGroup.add(plumbCap);

plumbGroup.position.set(-9, FLOOR_TOP, 5);
scene.add(plumbGroup);

// MAZZUOLO: testa cilindrica di legno + manico tornito
const malletGroup = new THREE.Group();
// Testa
const malletH = new THREE.Mesh(
  new THREE.CylinderGeometry(0.20, 0.20, 0.55, 24),
  new THREE.MeshStandardMaterial({
    color: 0x6a3e1c, roughness: 0.75, metalness: 0.08,
    emissive: 0x1a0a02, emissiveIntensity: 0.15
  })
);
malletH.rotation.z = Math.PI / 2;
malletH.position.y = 0.0;
malletGroup.add(malletH);
// Anelli metallici alle estremità della testa (rinforzo)
for (let s = -1; s <= 1; s += 2) {
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.205, 0.02, 16, 36), ironMat
  );
  band.position.set(s * 0.27, 0, 0);
  band.rotation.y = Math.PI / 2;
  malletGroup.add(band);
}
// Manico
const malletHand = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.06, 0.95, 24),
  new THREE.MeshStandardMaterial({
    color: 0x7a4a22, roughness: 0.7, metalness: 0.1
  })
);
malletHand.position.y = -0.55;
malletGroup.add(malletHand);
// Pomolo in fondo al manico
const malletKnob = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 32, 24),
  new THREE.MeshStandardMaterial({ color: 0x5a3018, roughness: 0.6, metalness: 0.15 })
);
malletKnob.position.y = -1.03;
malletGroup.add(malletKnob);

malletGroup.position.set(-9, FLOOR_TOP + 0.7, 2);
malletGroup.rotation.z = Math.PI / 5;
malletGroup.rotation.y = 0.3;
scene.add(malletGroup);

// SCALPELLO: manico di legno + lama di acciaio (silver, non oro)
const chiselGroup = new THREE.Group();
// Manico (cilindrico, leggermente conico)
const chiselHandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.075, 0.09, 0.7, 24),
  new THREE.MeshStandardMaterial({
    color: 0x7a4a22, roughness: 0.7, metalness: 0.1,
    emissive: 0x1a0a02, emissiveIntensity: 0.12
  })
);
chiselHandle.rotation.z = Math.PI / 2;
chiselHandle.position.x = -0.4;
chiselGroup.add(chiselHandle);
// Ghiera metallica tra manico e lama
const chiselFerrule = new THREE.Mesh(
  new THREE.CylinderGeometry(0.085, 0.085, 0.08, 24), goldMat
);
chiselFerrule.rotation.z = Math.PI / 2;
chiselFerrule.position.x = -0.04;
chiselGroup.add(chiselFerrule);
// Lama (cono allungato, in acciaio)
const chiselBlade = new THREE.Mesh(
  new THREE.ConeGeometry(0.07, 0.5, 18), ironMat
);
chiselBlade.rotation.z = -Math.PI / 2;
chiselBlade.position.x = 0.25;
chiselGroup.add(chiselBlade);

chiselGroup.position.set(-9, FLOOR_TOP + 0.10, -1);
chiselGroup.rotation.y = Math.PI / 8;
scene.add(chiselGroup);

// === STRUMENTI COMPAGNI (Meridione - lato destro entrando) ===
// PIETRA CUBICA sormontata da PIRAMIDE (su base di marmo)
const cubicStoneGroup = new THREE.Group();
// Base di marmo
const cubicBase = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.12, 1.5),
  new THREE.MeshStandardMaterial({
    color: 0xc8b896, roughness: 0.5, metalness: 0.15,
    emissive: 0x2a2418, emissiveIntensity: 0.18
  })
);
cubicBase.position.y = 0.06;
cubicStoneGroup.add(cubicBase);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({
    color: 0x9a8868, roughness: 0.38, metalness: 0.32,
    emissive: 0x2a2418, emissiveIntensity: 0.18
  })
);
cube.position.y = 0.62;
cubicStoneGroup.add(cube);

const pyramid = new THREE.Mesh(
  new THREE.ConeGeometry(0.65, 0.78, 18),
  new THREE.MeshStandardMaterial({
    color: 0x9a8868, roughness: 0.38, metalness: 0.32,
    emissive: 0x2a2418, emissiveIntensity: 0.18
  })
);
pyramid.rotation.y = Math.PI / 4;
pyramid.position.y = 1.51;
cubicStoneGroup.add(pyramid);

cubicStoneGroup.position.set(9, FLOOR_TOP, 8);
scene.add(cubicStoneGroup);

// LIVELLA (A-frame): legno + filo + piombino dorato + bolla
const levelGroup = new THREE.Group();
// Gamba sinistra
const levelL = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.95, 0.05), woodMat
);
levelL.rotation.z = Math.PI / 6;
levelL.position.x = -0.24;
levelGroup.add(levelL);
// Gamba destra
const levelR = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.95, 0.05), woodMat
);
levelR.rotation.z = -Math.PI / 6;
levelR.position.x = 0.24;
levelGroup.add(levelR);
// Traversa orizzontale
const levelBar = new THREE.Mesh(
  new THREE.BoxGeometry(0.85, 0.06, 0.06),
  new THREE.MeshStandardMaterial({
    color: 0x5a3818, roughness: 0.7, metalness: 0.1
  })
);
levelBar.position.y = -0.35;
levelGroup.add(levelBar);
// Bolla d'aria sulla traversa
const levelBubble = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 0.25, 24),
  new THREE.MeshStandardMaterial({
    color: 0xa8c8d8, roughness: 0.2, metalness: 0.5,
    emissive: 0x0a2030, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.7
  })
);
levelBubble.rotation.z = Math.PI / 2;
levelBubble.position.y = -0.42;
levelGroup.add(levelBubble);
// Filo a piombo della livella
const levelString = new THREE.Mesh(
  new THREE.CylinderGeometry(0.008, 0.008, 0.7, 24),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 })
);
levelString.position.y = 0.0;
levelGroup.add(levelString);
// Pesetto dorato in fondo
const levelWeight = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 32, 24), goldMat
);
levelWeight.position.y = -0.4;
levelGroup.add(levelWeight);

levelGroup.position.set(9, FLOOR_TOP + 0.55, 5);
levelGroup.rotation.y = Math.PI / 6;
scene.add(levelGroup);

// REGOLO ROSSO: traversina rossa con tacche dorate
const rulerGroup = new THREE.Group();
const rulerMat = new THREE.MeshStandardMaterial({
  color: 0xa01818, roughness: 0.45, metalness: 0.3,
  emissive: 0x3a0606, emissiveIntensity: 0.35
});
const ruler = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.08, 0.22), rulerMat
);
rulerGroup.add(ruler);
// Tacche dorate (più visibili) ogni 0.1
for (let i = -8; i <= 8; i++) {
  const tickHeight = (i === 0 || Math.abs(i) === 8) ? 0.10 : 0.08;
  const tickWidth = (Math.abs(i) % 5 === 0) ? 0.018 : 0.010;
  const tick = new THREE.Mesh(
    new THREE.BoxGeometry(tickWidth, tickHeight, 0.13),
    goldMat
  );
  tick.position.x = i * 0.1;
  tick.position.y = 0.01;
  tick.position.z = 0.05;
  rulerGroup.add(tick);
}
// Numeri stilizzati alle estremità (piccoli ovali dorati)
for (let s = -1; s <= 1; s += 2) {
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.085, 0.225), goldMat
  );
  cap.position.x = s * 0.88;
  rulerGroup.add(cap);
}

rulerGroup.position.set(9, FLOOR_TOP + 0.06, 2);
rulerGroup.rotation.y = Math.PI / 4;
scene.add(rulerGroup);

// LEVA (crowbar): asta di ferro scuro + uncino
const leverGroup = new THREE.Group();
const leverShaft = new THREE.Mesh(
  new THREE.CylinderGeometry(0.055, 0.05, 1.5, 24), ironDarkMat
);
leverShaft.rotation.z = Math.PI / 2;
leverGroup.add(leverShaft);
// Uncino curvo a un'estremità (toro tagliato)
const leverHook = new THREE.Mesh(
  new THREE.TorusGeometry(0.14, 0.05, 16, 36, Math.PI),
  ironDarkMat
);
leverHook.position.x = -0.75;
leverHook.rotation.z = Math.PI / 2;
leverGroup.add(leverHook);
// Punta dell'uncino (cono)
const leverTip = new THREE.Mesh(
  new THREE.ConeGeometry(0.05, 0.18, 18), ironDarkMat
);
leverTip.position.set(-0.75, 0.14, 0);
leverGroup.add(leverTip);
// Punta opposta (terminale a punta piatta)
const leverEnd = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.04, 0.12), ironDarkMat
);
leverEnd.position.x = 0.83;
leverGroup.add(leverEnd);

leverGroup.position.set(9, FLOOR_TOP + 0.10, -1);
leverGroup.rotation.y = -Math.PI / 6;
scene.add(leverGroup);

// === STRUMENTI CENTRALI: SQUADRA + CAZZUOLA al centro del Tempio ===
// (la TAVOLA DA TRACCIARE / QUADRO DI LOGGIA è ora costruita a parte e posizionata
//  in modo visibile sul pavimento davanti all'Ara — più sotto in questo file)

// ============================================================
// === QUADRO DI LOGGIA ===
// Posizione: sul pavimento DAVANTI all'Ara dei Giuramenti, ben visibile
// Riccamente decorato con i simboli del Primo Grado:
// pavimento mosaico, sole/luna/stella, colonne J/B, scala, Squadra+Compasso
// ============================================================
function createQuadroDiLoggia() {
  const group = new THREE.Group();

  // Base lignea con cornice dorata
  const boardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.10, 2.8), goldMat
  );
  boardFrame.position.y = 0.06;
  group.add(boardFrame);

  // Pannello interno scuro che ospita il disegno
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.08, 2.65),
    new THREE.MeshStandardMaterial({
      color: 0x140a04, roughness: 0.6, metalness: 0.3,
      emissive: 0x080402, emissiveIntensity: 0.25
    })
  );
  board.position.y = 0.10;
  group.add(board);

  // === Canvas ricco del Quadro ===
  const qCanvas = document.createElement('canvas');
  qCanvas.width = 1024; qCanvas.height = 1536;
  const q = qCanvas.getContext('2d');

  // Sfondo nero pece
  q.fillStyle = '#0a0604';
  q.fillRect(0, 0, 1024, 1536);

  // Cornice principale dorata
  q.strokeStyle = '#d4b87a';
  q.lineWidth = 8;
  q.shadowColor = '#d4b87a';
  q.shadowBlur = 14;
  q.strokeRect(40, 40, 944, 1456);
  q.lineWidth = 3;
  q.strokeRect(64, 64, 896, 1408);

  // === BANDA SUPERIORE: SOLE, STELLA, LUNA ===
  q.shadowBlur = 25;
  // SOLE a sinistra
  q.fillStyle = '#ffeb99';
  q.shadowColor = '#ffeb99';
  q.beginPath();
  q.arc(220, 200, 65, 0, Math.PI * 2);
  q.fill();
  // Raggi del sole
  q.strokeStyle = '#ffeb99';
  q.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const isLong = i % 2 === 0;
    q.beginPath();
    q.moveTo(220 + Math.cos(a) * 78, 200 + Math.sin(a) * 78);
    q.lineTo(220 + Math.cos(a) * (isLong ? 120 : 100), 200 + Math.sin(a) * (isLong ? 120 : 100));
    q.stroke();
  }

  // LUNA crescente a destra
  q.beginPath();
  q.arc(800, 200, 60, 0, Math.PI * 2);
  q.fill();
  // Effetto crescente
  q.globalCompositeOperation = 'destination-out';
  q.beginPath();
  q.arc(820, 190, 55, 0, Math.PI * 2);
  q.fill();
  q.globalCompositeOperation = 'source-over';
  // Piccole stelle accanto alla luna
  q.fillStyle = '#ffeb99';
  q.shadowBlur = 14;
  for (const [sx, sy] of [[720, 130], [690, 250], [870, 130]]) {
    drawStar(q, sx, sy, 7, 14, 5);
  }

  // STELLA FIAMMEGGIANTE centrale (con G)
  q.shadowBlur = 30;
  drawStar(q, 512, 200, 30, 70, 5);
  // Riempimento dorato
  q.fillStyle = '#d4b87a';
  drawStar(q, 512, 200, 25, 60, 5, true);
  // G centrale
  q.fillStyle = '#0a0604';
  q.font = 'italic bold 56px Georgia, serif';
  q.textAlign = 'center';
  q.textBaseline = 'middle';
  q.shadowBlur = 0;
  q.fillText('G', 512, 210);

  // === COLONNE J e B agli estremi (alla base della fascia centrale) ===
  // Colonna J (sinistra) — bianca con capitello dorato
  q.shadowColor = 'rgba(0,0,0,0.6)';
  q.shadowBlur = 10;
  q.fillStyle = '#f5eddc';
  q.fillRect(140, 380, 100, 520);  // fusto
  // Base
  q.fillStyle = '#d4b87a';
  q.fillRect(120, 880, 140, 30);
  // Capitello
  q.fillRect(120, 360, 140, 30);
  // Lettera J nera
  q.fillStyle = '#0a0604';
  q.font = 'italic bold 80px Georgia, serif';
  q.shadowBlur = 0;
  q.fillText('J', 190, 660);

  // Colonna B (destra) — nera con capitello dorato
  q.fillStyle = '#1a1a25';
  q.fillRect(784, 380, 100, 520);
  q.fillStyle = '#d4b87a';
  q.fillRect(764, 880, 140, 30);
  q.fillRect(764, 360, 140, 30);
  q.fillStyle = '#ffeb99';
  q.fillText('B', 834, 660);

  // === SCALA DI GIACOBBE — 7 pioli al centro ===
  q.strokeStyle = '#d4b87a';
  q.lineWidth = 5;
  q.shadowColor = '#d4b87a';
  q.shadowBlur = 14;
  // Due montanti
  q.beginPath();
  q.moveTo(440, 380);
  q.lineTo(420, 900);
  q.moveTo(584, 380);
  q.lineTo(604, 900);
  q.stroke();
  // 7 pioli
  q.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    const y = 410 + i * 75;
    const offset = (i * 3);
    q.beginPath();
    q.moveTo(442 - offset, y);
    q.lineTo(582 + offset, y);
    q.stroke();
  }

  // === SQUADRA E COMPASSO sopra la base ===
  // Compasso (apertura verso il basso)
  q.shadowBlur = 18;
  q.strokeStyle = '#d4b87a';
  q.lineWidth = 8;
  q.beginPath();
  q.moveTo(512, 950);
  q.lineTo(440, 1100);
  q.moveTo(512, 950);
  q.lineTo(584, 1100);
  q.stroke();
  // Perno del compasso
  q.fillStyle = '#d4b87a';
  q.beginPath();
  q.arc(512, 950, 12, 0, Math.PI * 2);
  q.fill();
  // Punte
  q.beginPath();
  q.arc(440, 1100, 7, 0, Math.PI * 2);
  q.arc(584, 1100, 7, 0, Math.PI * 2);
  q.fill();

  // Squadra (sotto al compasso, L rovesciata)
  q.lineWidth = 10;
  q.beginPath();
  q.moveTo(400, 1180);
  q.lineTo(400, 1080);
  q.moveTo(400, 1180);
  q.lineTo(624, 1180);
  q.stroke();

  // === BANDA INFERIORE: PAVIMENTO MOSAICO a scacchi ===
  const tileSize = 50;
  const startX = 120;
  const startY = 1230;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 16; c++) {
      const isWhite = (r + c) % 2 === 0;
      q.fillStyle = isWhite ? '#faf5e6' : '#0a0604';
      q.fillRect(startX + c * tileSize, startY + r * tileSize, tileSize, tileSize);
    }
  }
  // Cornice dorata attorno al mosaico
  q.strokeStyle = '#d4b87a';
  q.lineWidth = 5;
  q.shadowBlur = 12;
  q.strokeRect(startX - 3, startY - 3, 16 * tileSize + 6, 5 * tileSize + 6);

  // === Bordi superiore e inferiore decorati con motivo a meandri (greca) ===
  q.shadowBlur = 0;
  q.fillStyle = '#d4b87a';
  // Banda decorativa orizzontale sotto la stella
  for (let i = 0; i < 18; i++) {
    q.fillRect(100 + i * 50, 320, 30, 8);
    q.fillRect(100 + i * 50, 1480, 30, 8);
  }

  function drawStar(c, cx, cy, ir, or_, points, fillOnly) {
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? or_ : ir;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    if (fillOnly === undefined || fillOnly) c.fill();
    else { c.fill(); c.stroke(); }
  }

  // Texture finale
  const quadroTex = new THREE.CanvasTexture(qCanvas);
  quadroTex.anisotropy = 16;
  quadroTex.minFilter = THREE.LinearMipmapLinearFilter;
  quadroTex.magFilter = THREE.LinearFilter;

  const quadroDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 2.6),
    new THREE.MeshStandardMaterial({
      map: quadroTex, transparent: true,
      roughness: 0.4, metalness: 0.4,
      emissive: 0x2a1a08, emissiveIntensity: 0.4,
      depthWrite: false
    })
  );
  quadroDecal.rotation.x = -Math.PI / 2;
  quadroDecal.position.y = 0.155;
  group.add(quadroDecal);

  return group;
}

// Istanzio e posiziono il Quadro DAVANTI all'Ara (verso la camera entry)
// L'Ara è a (0,0,0). I candelabri a triangolo: cand1=(0,_,-5), cand2=(-4,_,5), cand3=(4,_,5)
// Centroid del triangolo dei candelabri ≈ (0, _, 1.67)
const quadroDiLoggia = createQuadroDiLoggia();
quadroDiLoggia.position.set(0, FLOOR_TOP, 5.5);
scene.add(quadroDiLoggia);

// === 12 COLONNE ZODIACALI con glifi astrologici corretti (FERMI) ===
const zodiacGroup = new THREE.Group();
const zodiacMeshes = [];

// Ordine dei segni zodiacali secondo il Rituale (pag. 16):
// "Il Maestro delle Cerimonie [...] li conduce nel Tempio deambulando in senso Orario
//  facendo loro compiere un giro passando da Settentrione ad Oriente, indi a Meridione,
//  infine ad Occidente."
//
// Quindi il percorso zodiacale segue questo ingresso:
//  - Settentrione dall'entrata verso l'Oriente:  Ariete → Toro → Gemelli → Cancro → Leone → Vergine
//  - Meridione dall'Oriente verso l'entrata:     Bilancia → Scorpione → Sagittario → Capricorno → Acquario → Pesci
// Il ciclo zodiacale si compone così attorno al Tempio, chiudendosi alle Colonne Boaz e Jachin.
const zodiacPositions = [
  // Senso ANTIORARIO (rovesciato rispetto al precedente):
  // Ariete sul lato Meridione/Colonna J, percorso scende, cambia lato a Oriente,
  // risale lungo Settentrione fino a Pesci accanto a Colonna B.
  { x:  14, z:  12, side: 'right' },  //  0 — ♈ ARIES        (Meridione, lato Colonna J / entrata)
  { x:  14, z:   7, side: 'right' },  //  1 — ♉ TAURUS       (Meridione)
  { x:  14, z:   2, side: 'right' },  //  2 — ♊ GEMINI       (Meridione)
  { x:  14, z:  -3, side: 'right' },  //  3 — ♋ CANCER       (Meridione)
  { x:  14, z:  -8, side: 'right' },  //  4 — ♌ LEO          (Meridione)
  { x:  14, z: -13, side: 'right' },  //  5 — ♍ VIRGO        (Meridione, lato Oriente)
  { x: -14, z: -13, side: 'left'  },  //  6 — ♎ LIBRA        (Settentrione, lato Oriente)
  { x: -14, z:  -8, side: 'left'  },  //  7 — ♏ SCORPIO      (Settentrione)
  { x: -14, z:  -3, side: 'left'  },  //  8 — ♐ SAGITTARIUS  (Settentrione)
  { x: -14, z:   2, side: 'left'  },  //  9 — ♑ CAPRICORNUS  (Settentrione)
  { x: -14, z:   7, side: 'left'  },  // 10 — ♒ AQUARIUS     (Settentrione)
  { x: -14, z:  12, side: 'left'  }   // 11 — ♓ PISCES       (Settentrione, lato Colonna B / entrata)
];

// I 12 glifi astrologici corretti, in ordine zodiacale
const zodiacGlyphs = [
  { sym: '♈', name: 'ARIES' },      // Ariete
  { sym: '♉', name: 'TAURUS' },     // Toro
  { sym: '♊', name: 'GEMINI' },     // Gemelli
  { sym: '♋', name: 'CANCER' },     // Cancro
  { sym: '♌', name: 'LEO' },        // Leone
  { sym: '♍', name: 'VIRGO' },      // Vergine
  { sym: '♎', name: 'LIBRA' },      // Bilancia
  { sym: '♏', name: 'SCORPIO' },    // Scorpione
  { sym: '♐', name: 'SAGITTARIUS' },// Sagittario
  { sym: '♑', name: 'CAPRICORNUS' },// Capricorno
  { sym: '♒', name: 'AQUARIUS' },   // Acquario
  { sym: '♓', name: 'PISCES' }      // Pesci
];

zodiacPositions.forEach((pos, i) => {
  // Piccola colonna
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 4, 24),
    whiteMarbleMat
  );
  col.position.set(pos.x, 2, pos.z);
  zodiacGroup.add(col);
  
  // Capitello
  const colCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.15, 0.55), goldMat
  );
  colCap.position.set(pos.x, 4.1, pos.z);
  zodiacGroup.add(colCap);
  
  // Medaglione con glifo astrologico corretto
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, 256, 256);
  
  // Cerchio esterno
  ctx.strokeStyle = '#d4b87a';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#d4b87a';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.stroke();
  
  // Cerchio interno sottile
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(128, 128, 98, 0, Math.PI * 2);
  ctx.stroke();
  
  // Glifo astrologico grande e netto
  ctx.font = 'bold 130px "Segoe UI Symbol", "Arial Unicode MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8cf94';
  ctx.shadowColor = '#d4b87a';
  ctx.shadowBlur = 20;
  ctx.fillText(zodiacGlyphs[i].sym, 128, 138);
  
  // Nome del segno in piccolo sotto
  ctx.font = '300 22px Georgia';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#c8a868';
  ctx.fillText(zodiacGlyphs[i].name, 128, 210);
  
  const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 16;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0,
    side: THREE.DoubleSide  // visibile da entrambi i lati
  });
  
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), mat);
  plane.position.set(pos.x, 5.3, pos.z);
  // Orienta il medaglione verso il centro del Tempio (così è leggibile da dentro)
  plane.lookAt(0, 5.3, pos.z);
  zodiacGroup.add(plane);
  zodiacMeshes.push(mat);
});

// === CORDONE ROSSO sospeso in alto (libero, decorativo del soffitto) ===
const cordMat = new THREE.MeshStandardMaterial({
  color: 0x8B0000, roughness: 0.7,
  emissive: 0x3a0000, emissiveIntensity: 0.3
});

// Cordone che corre lungo il perimetro del Tempio, in alto
const ceilingHeight = 11;
const cordCorners = [
  { x: 16, z: 14 },
  { x: 16, z: -20 },
  { x: -16, z: -20 },
  { x: -16, z: 14 }
];

for (let i = 0; i < cordCorners.length; i++) {
  const a = cordCorners[i];
  const b = cordCorners[(i + 1) % cordCorners.length];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  
  const segment = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, dist, 24), cordMat
  );
  segment.position.set((a.x + b.x) / 2, ceilingHeight, (a.z + b.z) / 2);
  segment.lookAt(b.x, ceilingHeight, b.z);
  segment.rotateX(Math.PI / 2);
  zodiacGroup.add(segment);
}

// 7 NODI D'AMORE distribuiti lungo il cordone perimetrale
const perimeterPoints = [];
const sidesPoints = 2; // 2 nodi per lato
cordCorners.forEach((corner, idx) => {
  const next = cordCorners[(idx + 1) % cordCorners.length];
  for (let s = 0; s < sidesPoints; s++) {
    const t = (s + 0.5) / sidesPoints;
    perimeterPoints.push({
      x: corner.x + (next.x - corner.x) * t,
      z: corner.z + (next.z - corner.z) * t
    });
  }
});

// Prendi 7 nodi distribuiti
const knotIndices = [0, 1, 2, 3, 4, 5, 6];
knotIndices.forEach(idx => {
  if (idx >= perimeterPoints.length) return;
  const pos = perimeterPoints[idx];
  
  const knotGroup = new THREE.Group();
  const torus1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.07, 16, 36), cordMat
  );
  knotGroup.add(torus1);
  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.07, 16, 36), cordMat
  );
  torus2.rotation.y = Math.PI / 2;
  knotGroup.add(torus2);
  
  knotGroup.position.set(pos.x, ceilingHeight, pos.z);
  zodiacGroup.add(knotGroup);
});

scene.add(zodiacGroup);

// === VOLTA STELLATA DIPINTA sopra il Tempio (stelle a forma di stella) ===
const vaultGroup = new THREE.Group();

// Cupola semisferica del soffitto del Tempio
const vaultGeo = new THREE.SphereGeometry(22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
const vaultMat = new THREE.MeshStandardMaterial({
  color: 0x0a1545,
  side: THREE.BackSide,
  roughness: 0.95,
  emissive: 0x050a25,
  emissiveIntensity: 0.4
});
const vault = new THREE.Mesh(vaultGeo, vaultMat);
vault.position.set(0, 12, -3);
vaultGroup.add(vault);

// Texture di una stella a 5 punte (disegnata su canvas) usata come sprite
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, 64, 64);
  
  const cx = 32, cy = 32;
  const outer = 26, inner = 10;
  
  // Bagliore radiale
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
  glow.addColorStop(0, 'rgba(255, 245, 200, 0.9)');
  glow.addColorStop(0.5, 'rgba(255, 235, 153, 0.3)');
  glow.addColorStop(1, 'rgba(255, 235, 153, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  
  // Stella a 5 punte
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  
  const starGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, outer);
  starGrad.addColorStop(0, '#ffffff');
  starGrad.addColorStop(0.5, '#fff5cc');
  starGrad.addColorStop(1, '#d4b87a');
  ctx.fillStyle = starGrad;
  ctx.fill();
  
  return new THREE.CanvasTexture(canvas);
}

const starTexture = createStarTexture();

// Stelle a forma di stella sparse sulla volta (usando sprite)
const vaultStarSprites = [];
const starSpriteMat = new THREE.SpriteMaterial({
  map: starTexture,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

for (let i = 0; i < 260; i++) {
  const r = 20;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI / 2.15;
  
  const sprite = new THREE.Sprite(starSpriteMat.clone());
  sprite.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    12 + r * Math.cos(phi),
    -3 + r * Math.sin(phi) * Math.sin(theta)
  );
  // Dimensioni variabili: alcune piccole, alcune grandi
  const size = 0.4 + Math.random() * 0.9;
  sprite.scale.set(size, size, 1);
  sprite.userData.baseOpacity = 0.5 + Math.random() * 0.5;
  sprite.userData.twinkleSpeed = 1 + Math.random() * 3;
  sprite.userData.twinklePhase = Math.random() * Math.PI * 2;
  sprite.material.opacity = sprite.userData.baseOpacity;
  vaultGroup.add(sprite);
  vaultStarSprites.push(sprite);
}

// Alcune stelle dorate più grandi e brillanti (costellazioni principali)
for (let i = 0; i < 35; i++) {
  const r = 19.3;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI / 2.3;
  
  const sprite = new THREE.Sprite(starSpriteMat.clone());
  sprite.material.color = new THREE.Color(0xffeb99);
  sprite.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    12 + r * Math.cos(phi),
    -3 + r * Math.sin(phi) * Math.sin(theta)
  );
  const size = 1.0 + Math.random() * 0.8;
  sprite.scale.set(size, size, 1);
  sprite.userData.baseOpacity = 0.7 + Math.random() * 0.3;
  sprite.userData.twinkleSpeed = 0.8 + Math.random() * 2;
  sprite.userData.twinklePhase = Math.random() * Math.PI * 2;
  sprite.material.opacity = sprite.userData.baseOpacity;
  vaultGroup.add(sprite);
  vaultStarSprites.push(sprite);
}

scene.add(vaultGroup);
// === COSTELLAZIONI ZODIACALI sulla Volta ===
// 12 piccole costellazioni stilizzate disposte attorno alla volta,
// con stelle dorate e linee sottili che le uniscono
const constellationGroup = new THREE.Group();
const constStarMat = new THREE.SpriteMaterial({
  map: starTexture, transparent: true, opacity: 1.0,
  color: 0xffe9a6, blending: THREE.AdditiveBlending, depthWrite: false
});
const constLineMat = new THREE.LineBasicMaterial({
  color: 0xd4b87a, transparent: true, opacity: 0.45,
  blending: THREE.AdditiveBlending, depthWrite: false
});

// Forme stilizzate semplificate delle 12 costellazioni zodiacali
// (pattern di stelle + indici delle linee che le uniscono)
const constellations = [
  // ARIETE — corna ricurve
  {pts:[[-0.6,0.5],[-0.2,0.7],[0.2,0.5],[0.6,0.3],[0.4,-0.2]], lines:[[0,1],[1,2],[2,3],[3,4]]},
  // TORO — corna a V + occhio
  {pts:[[-0.5,0.6],[-0.2,0.2],[0.2,0.2],[0.5,0.6],[0,-0.2],[0,-0.5]], lines:[[0,1],[1,2],[2,3],[2,4],[4,5]]},
  // GEMELLI — due figure verticali
  {pts:[[-0.3,0.6],[-0.3,-0.4],[-0.5,0.2],[0.3,0.6],[0.3,-0.4],[0.5,0.2]], lines:[[0,1],[0,2],[3,4],[3,5]]},
  // CANCRO — chela ricurva
  {pts:[[-0.5,0.4],[-0.2,0.6],[0.2,0.6],[0.5,0.4],[0.4,-0.2],[-0.4,-0.2]], lines:[[0,1],[1,2],[2,3],[0,5],[3,4]]},
  // LEONE — silhouette con criniera
  {pts:[[-0.5,0.5],[-0.2,0.7],[0.2,0.3],[0.5,0.4],[0.4,-0.3],[-0.3,-0.4]], lines:[[0,1],[1,2],[2,3],[2,4],[4,5]]},
  // VERGINE — figura snella
  {pts:[[0,0.7],[-0.3,0.3],[0.3,0.3],[-0.2,-0.1],[0.2,-0.1],[0,-0.5]], lines:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5]]},
  // BILANCIA — piatti a triangolo
  {pts:[[-0.5,0.4],[0.5,0.4],[0,0.4],[0,-0.3],[-0.4,-0.5],[0.4,-0.5]], lines:[[0,1],[2,3],[3,4],[3,5]]},
  // SCORPIONE — coda ricurva
  {pts:[[-0.6,0.3],[-0.3,0.5],[0,0.3],[0.3,0.1],[0.5,-0.2],[0.3,-0.5]], lines:[[0,1],[1,2],[2,3],[3,4],[4,5]]},
  // SAGITTARIO — arco e freccia
  {pts:[[-0.5,-0.3],[-0.2,0.2],[0.1,0.5],[0.4,0.3],[0.6,0.0],[0.3,-0.2]], lines:[[0,1],[1,2],[2,3],[3,4],[4,5]]},
  // CAPRICORNO — corno e coda
  {pts:[[-0.5,0.5],[-0.2,0.3],[0.2,0.4],[0.5,0.2],[0.3,-0.3],[-0.3,-0.4]], lines:[[0,1],[1,2],[2,3],[3,4],[4,5]]},
  // ACQUARIO — onde
  {pts:[[-0.6,0.3],[-0.3,0.5],[0,0.3],[0.3,0.5],[0.6,0.3],[0,-0.3]], lines:[[0,1],[1,2],[2,3],[3,4],[2,5]]},
  // PESCI — due pesci collegati
  {pts:[[-0.6,0.4],[-0.2,0.2],[0,0],[0.2,0.2],[0.6,0.4],[0,-0.4]], lines:[[0,1],[1,2],[2,3],[3,4],[2,5]]}
];

const vaultCenterY = 12;
const vaultRadius = 16;

constellations.forEach((c, idx) => {
  // Distribuisco le 12 costellazioni a cerchio attorno al centro della volta
  const angleZ = (idx / 12) * Math.PI * 2;
  const constCenterX = Math.cos(angleZ) * vaultRadius;
  const constCenterZ = -3 + Math.sin(angleZ) * vaultRadius;
  const constCenterY = vaultCenterY + 4 + (idx % 3) * 1.5;  // un po' variata in altezza
  const scale = 1.8;

  // Calcolo posizioni 3D delle stelle
  const positions = c.pts.map(([px, py]) => {
    // Le stelle sono distribuite tangenti alla volta semi-sferica
    // Uso coordinate locali sulla sfera tangente
    const localX = px * scale;
    const localY = py * scale;
    return new THREE.Vector3(
      constCenterX + localX,
      constCenterY + localY,
      constCenterZ
    );
  });

  // Sprite stella per ogni punto
  positions.forEach(p => {
    const sprite = new THREE.Sprite(constStarMat.clone());
    sprite.position.copy(p);
    sprite.scale.set(0.85, 0.85, 1);
    sprite.userData.baseOpacity = 0.85 + Math.random() * 0.15;
    sprite.userData.twinkleSpeed = 1.2 + Math.random() * 2.4;
    sprite.userData.twinklePhase = Math.random() * Math.PI * 2;
    sprite.userData.isConstellation = true;
    constellationGroup.add(sprite);
    vaultStarSprites.push(sprite);
  });

  // Linee che uniscono le stelle (Line con BufferGeometry)
  c.lines.forEach(([a, b]) => {
    const geom = new THREE.BufferGeometry().setFromPoints([positions[a], positions[b]]);
    const line = new THREE.Line(geom, constLineMat);
    constellationGroup.add(line);
  });
});

// Rotazione molto leggera della volta intera (movimento esoterico, quasi impercettibile)
scene.add(constellationGroup);


// === IL TESTIMONE (lume sul limite del podio) ===
const testimoneGroup = new THREE.Group();
const testimoneBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.2, 0.25, 0.15, 24), goldMat
);
testimoneGroup.add(testimoneBase);
const testimoneCandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 0.4, 24),
  new THREE.MeshStandardMaterial({ color: 0xf5e6c8 })
);
testimoneCandle.position.y = 0.275;
testimoneGroup.add(testimoneCandle);
const testimoneFlame = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 32, 24),
  new THREE.MeshBasicMaterial({
    color: 0xffeb99, transparent: true, opacity: 0.95
  })
);
testimoneFlame.position.y = 0.55;
testimoneGroup.add(testimoneFlame);
testimoneGroup.position.set(0, 1.85, -19);
scene.add(testimoneGroup);

// === POST-PROCESSING: BLOOM PERSONALIZZATO (shader inline, nessuna dipendenza esterna) ===

// Render target per la scena principale
const sceneRT = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat
});

// Render target a risoluzione dimezzata per il bloom (più veloce)
function makeRT(div) {
  return new THREE.WebGLRenderTarget(
    Math.floor(window.innerWidth / div),
    Math.floor(window.innerHeight / div),
    { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }
  );
}
let brightRT = makeRT(2);
let blurRT_A = makeRT(2);
let blurRT_B = makeRT(2);

// Scena e camera ortografica per il rendering dei passaggi post-processing
const ppScene = new THREE.Scene();
const ppCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const ppQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
ppScene.add(ppQuad);

// SHADER 1: estrae solo le parti luminose (sopra una soglia)
const brightPassMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    threshold: { value: 0.55 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float threshold;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float f = smoothstep(threshold, threshold + 0.3, lum);
      gl_FragColor = vec4(c.rgb * f, 1.0);
    }
  `
});

// SHADER 2: blur gaussiano (applicato in orizzontale e verticale)
const blurMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    direction: { value: new THREE.Vector2(1, 0) },
    resolution: { value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 direction;
    uniform vec2 resolution;
    varying vec2 vUv;
    void main() {
      vec2 px = direction / resolution;
      vec4 sum = vec4(0.0);
      sum += texture2D(tDiffuse, vUv - 4.0 * px) * 0.051;
      sum += texture2D(tDiffuse, vUv - 3.0 * px) * 0.0918;
      sum += texture2D(tDiffuse, vUv - 2.0 * px) * 0.1231;
      sum += texture2D(tDiffuse, vUv - 1.0 * px) * 0.1531;
      sum += texture2D(tDiffuse, vUv) * 0.1641;
      sum += texture2D(tDiffuse, vUv + 1.0 * px) * 0.1531;
      sum += texture2D(tDiffuse, vUv + 2.0 * px) * 0.1231;
      sum += texture2D(tDiffuse, vUv + 3.0 * px) * 0.0918;
      sum += texture2D(tDiffuse, vUv + 4.0 * px) * 0.051;
      gl_FragColor = sum;
    }
  `
});

// SHADER 3: combina scena originale + bloom
const combineMat = new THREE.ShaderMaterial({
  uniforms: {
    tScene: { value: null },
    tBloom: { value: null },
    bloomStrength: { value: 0.9 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tScene;
    uniform sampler2D tBloom;
    uniform float bloomStrength;
    varying vec2 vUv;

    // Color grading: leggero shift verso oro caldo + saturazione boost
    vec3 colorGrade(vec3 c) {
      // Tinta calda (lieve push dei toni gialli/oro)
      c.r = c.r * 1.04;
      c.g = c.g * 1.01;
      c.b = c.b * 0.96;
      // Boost saturazione 15%
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(lum), c, 1.15);
      return c;
    }

    // Vignettatura sottile per profondità cinematografica
    float vignette(vec2 uv) {
      vec2 v = uv - 0.5;
      float d = length(v);
      return smoothstep(0.95, 0.45, d);
    }

    void main() {
      vec4 scene = texture2D(tScene, vUv);
      vec4 bloom = texture2D(tBloom, vUv);
      vec3 combined = scene.rgb + bloom.rgb * bloomStrength;
      // Color grading
      combined = colorGrade(combined);
      // Vignettatura
      combined *= mix(0.78, 1.0, vignette(vUv));
      gl_FragColor = vec4(combined, 1.0);
    }
  `
});

// Funzione che esegue il rendering completo con bloom
function renderWithBloom() {
  // 1. Renderizza la scena 3D sul render target
  renderer.setRenderTarget(sceneRT);
  renderer.clear();
  renderer.render(scene, camera);
  
  // 2. Estrai le parti luminose
  ppQuad.material = brightPassMat;
  brightPassMat.uniforms.tDiffuse.value = sceneRT.texture;
  renderer.setRenderTarget(brightRT);
  renderer.clear();
  renderer.render(ppScene, ppCamera);
  
  // 3. Blur orizzontale (primo pass)
  ppQuad.material = blurMat;
  blurMat.uniforms.tDiffuse.value = brightRT.texture;
  blurMat.uniforms.direction.value.set(1.2, 0);
  renderer.setRenderTarget(blurRT_A);
  renderer.clear();
  renderer.render(ppScene, ppCamera);

  // 4. Blur verticale
  blurMat.uniforms.tDiffuse.value = blurRT_A.texture;
  blurMat.uniforms.direction.value.set(0, 1.2);
  renderer.setRenderTarget(blurRT_B);
  renderer.clear();
  renderer.render(ppScene, ppCamera);

  // 5. Secondo pass più ampio
  blurMat.uniforms.tDiffuse.value = blurRT_B.texture;
  blurMat.uniforms.direction.value.set(2.4, 0);
  renderer.setRenderTarget(blurRT_A);
  renderer.clear();
  renderer.render(ppScene, ppCamera);

  blurMat.uniforms.tDiffuse.value = blurRT_A.texture;
  blurMat.uniforms.direction.value.set(0, 2.4);
  renderer.setRenderTarget(blurRT_B);
  renderer.clear();
  renderer.render(ppScene, ppCamera);

  // 6. Terzo pass ancora più ampio (alone diffuso cinematografico)
  blurMat.uniforms.tDiffuse.value = blurRT_B.texture;
  blurMat.uniforms.direction.value.set(4.5, 0);
  renderer.setRenderTarget(blurRT_A);
  renderer.clear();
  renderer.render(ppScene, ppCamera);

  blurMat.uniforms.tDiffuse.value = blurRT_A.texture;
  blurMat.uniforms.direction.value.set(0, 4.5);
  renderer.setRenderTarget(blurRT_B);
  renderer.clear();
  renderer.render(ppScene, ppCamera);
  
  // 6. Combina scena + bloom sullo schermo
  ppQuad.material = combineMat;
  combineMat.uniforms.tScene.value = sceneRT.texture;
  combineMat.uniforms.tBloom.value = blurRT_B.texture;
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(ppScene, ppCamera);
}

// === ABILITA OMBRE su pavimento, colonne, ara ===
floorGroup.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
podiumGroup.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = true; } });
columnJ.traverse(o => { if (o.isMesh) o.castShadow = true; });
columnB.traverse(o => { if (o.isMesh) o.castShadow = true; });
sacredAltarGroup.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
throneGroup.traverse(o => { if (o.isMesh) o.castShadow = true; });
venus.traverse(o => { if (o.isMesh) o.castShadow = true; });
hercules.traverse(o => { if (o.isMesh) o.castShadow = true; });
roughStone.castShadow = true;
cubicStoneGroup.traverse(o => { if (o.isMesh) o.castShadow = true; });
zodiacGroup.traverse(o => { if (o.isMesh) o.castShadow = true; });

// === KEYFRAMES CAMERA - viaggio cinematografico nel Tempio ===
const cameraKeyframes = [
  // 0% — Hero "LIBERO PENSIERO": vista lontana del portale del Tempio
  { pos: [0, 5, 36], look: [0, 5, 14], fov: 55 },

  // 9% — BUSSA TRE VOLTE: davanti alle Colonne J e B (le incornicia)
  { pos: [0, 4.5, 22], look: [0, 4.3, 14], fov: 58 },

  // 18% — L'ARA DEI GIURAMENTI: vista frontale dell'Ara con la Spada Fiammeggiante
  // (saltata la sezione "Il Lavoro" — spostata più avanti)
  { pos: [0, 2.5, 6], look: [0, 2.0, 0], fov: 60 },

  // 27% — IL QUADRO DI LOGGIA: plongée zenitale sul Quadro (a z=5.5)
  { pos: [0, 5.0, 5.5], look: [0, 0.15, 5.5], fov: 50 },

  // 36% — IL TRONO DEL VENERABILE: vista frontale del Trono rosso con l'Occhio
  { pos: [0, 3.5, -10], look: [0, 4.2, -27], fov: 50 },

  // 45% — LE DODICI COLONNE: vista panoramica delle colonne zodiacali a Meridione,
  // dove sta l'altare del 2° Sorvegliante (x=12, z=0)
  { pos: [4, 4, -1], look: [13, 5, 0], fov: 75 },

  // 54% — LA VOLTA STELLATA: camera al centro che guarda verso l'ALTO,
  // le stelle e le costellazioni zodiacali
  { pos: [0, 3, -2], look: [0, 18, -3], fov: 70 },

  // 63% — IL TEMPIO E LE SUE OPERE: vista del Delta + Sole + Luna sopra il Trono
  { pos: [0, 7, -18], look: [0, 9.5, -27], fov: 60 },

  // 72% — IL LAVORO (spostato qui): vista degli strumenti del Settentrione (apprendisti)
  { pos: [-3, 2, 9], look: [-9, 0.5, 4], fov: 65 },

  // 81% — I LAVORI DI LOGGIA: vista panoramica dall'alto dell'INTERO Tempio
  { pos: [0, 14, 18], look: [0, 3, -10], fov: 65 },

  // 90% — ISCRIZIONE: vista frontale solenne (un po' alta) del Tempio dall'ingresso
  { pos: [0, 6, 20], look: [0, 3, -5], fov: 55 },

  // 100% — SALUTE · FORZA · UNIONE: vista finale del Trono + Delta + Sole + Luna
  { pos: [0, 5, -12], look: [0, 7, -27], fov: 55 }
];

function lerp(a, b, t) { return a + (b - a) * t; }

function easeInOutCubic(t) {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getCameraPosition(scrollProgress) {
  const segments = cameraKeyframes.length - 1;
  const segmentLength = 1 / segments;
  const segment = Math.min(Math.floor(scrollProgress / segmentLength), segments - 1);
  const localT = (scrollProgress - segment * segmentLength) / segmentLength;
  const t = easeInOutCubic(localT);
  
  const a = cameraKeyframes[segment];
  const b = cameraKeyframes[segment + 1];
  
  return {
    pos: [
      lerp(a.pos[0], b.pos[0], t),
      lerp(a.pos[1], b.pos[1], t),
      lerp(a.pos[2], b.pos[2], t)
    ],
    look: [
      lerp(a.look[0], b.look[0], t),
      lerp(a.look[1], b.look[1], t),
      lerp(a.look[2], b.look[2], t)
    ],
    fov: lerp(a.fov, b.fov, t)
  };
}

// === SCROLL HANDLING ===
let scrollProgress = 0;
let targetScrollProgress = 0;

function updateScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  
  document.getElementById('progress').style.width = (targetScrollProgress * 100) + '%';
}

window.addEventListener('scroll', updateScroll);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.4 });

document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

// === RENDER LOOP ===
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;
  
  const cam = getCameraPosition(scrollProgress);
  
  // MICRO-MOVIMENTO della camera: leggero ondeggiare tipo steadycam
  // (disattivato se l'utente preferisce ridurre il movimento)
  const breathX     = REDUCED_MOTION ? 0 : Math.sin(elapsed * 0.4)  * 0.25 + Math.sin(elapsed * 0.9)  * 0.12;
  const breathY     = REDUCED_MOTION ? 0 : Math.cos(elapsed * 0.5)  * 0.18 + Math.sin(elapsed * 1.1)  * 0.08;
  const breathLookX = REDUCED_MOTION ? 0 : Math.sin(elapsed * 0.35) * 0.15;
  const breathLookY = REDUCED_MOTION ? 0 : Math.cos(elapsed * 0.45) * 0.1;
  
  camera.position.set(
    cam.pos[0] + breathX,
    cam.pos[1] + breathY,
    cam.pos[2]
  );
  camera.lookAt(
    cam.look[0] + breathLookX,
    cam.look[1] + breathLookY,
    cam.look[2]
  );
  camera.fov = cam.fov;
  camera.updateProjectionMatrix();
  
  // Cielo stellato in rotazione lenta
  stars1.rotation.y = elapsed * 0.003;
  stars2.rotation.y = elapsed * 0.005;
  stars3.rotation.y = elapsed * 0.008;
  
  // Delta pulsante
  deltaMat.emissiveIntensity = 1.0 + Math.sin(elapsed * 1.5) * 0.4;
  
  // Fiamme dei 3 candelabri centrali (3 livelli ciascuno: alone + core + nucleo)
  candFlames.forEach((c, i) => {
    const f = c.flame;          // cuore dorato
    const fa = c.flameAura;     // alone arancio esterno
    const fn = c.flameNucleus;  // nucleo bianco caldo
    const wave1 = Math.sin(elapsed * 4 + i * 1.2);
    const wave2 = Math.sin(elapsed * 8 + i * 2.1);
    const wave3 = Math.sin(elapsed * 12 + i * 3.3);
    if (f) {
      f.material.opacity = 0.80 + wave1 * 0.12 + wave2 * 0.05;
      f.scale.set(1 + wave1 * 0.10, 1 + wave1 * 0.18 + wave3 * 0.05, 1 + wave1 * 0.10);
    }
    if (fa) {
      fa.material.opacity = 0.30 + wave1 * 0.08;
      fa.scale.set(1 + wave2 * 0.18, 1 + wave1 * 0.12 + wave3 * 0.08, 1 + wave2 * 0.18);
    }
    if (fn) {
      fn.material.opacity = 0.92 + wave3 * 0.06;
      fn.scale.set(1 + wave3 * 0.15, 1 + wave3 * 0.18, 1 + wave3 * 0.15);
    }
    if (c.glow) {
      const gs = c.glow.userData.baseScale * (1 + wave1 * 0.12 + wave2 * 0.06);
      c.glow.scale.set(gs, gs, 1);
      c.glow.material.opacity = 0.65 + wave1 * 0.08 + wave3 * 0.05;
    }
  });
  // Candele perimetrali: flicker indipendente per ognuna
  if (typeof wallCandles !== 'undefined' && wallCandles.length > 0) {
    wallCandles.forEach((wc, i) => {
      const ud = wc.userData;
      const w1 = Math.sin(elapsed * 3.2 + i * 0.83);
      const w2 = Math.sin(elapsed * 7.0 + i * 1.47);
      const w3 = Math.sin(elapsed * 11.0 + i * 2.31);
      if (ud.flame) {
        ud.flame.material.opacity = 0.85 + w1 * 0.10 + w2 * 0.04;
        ud.flame.scale.set(1 + w2 * 0.08, 1 + w1 * 0.14 + w3 * 0.04, 1 + w2 * 0.08);
      }
      if (ud.flameAura) {
        ud.flameAura.material.opacity = 0.32 + w1 * 0.08 + w3 * 0.04;
        ud.flameAura.scale.set(1 + w2 * 0.15, 1 + w1 * 0.10, 1 + w2 * 0.15);
      }
      if (ud.flameNucleus) {
        ud.flameNucleus.material.opacity = 0.90 + w3 * 0.06;
        ud.flameNucleus.scale.set(1 + w3 * 0.12, 1 + w3 * 0.15, 1 + w3 * 0.12);
      }
      if (ud.glow) {
        const bs = ud.glow.userData.baseScale;
        const gs = bs * (1 + w1 * 0.10 + w2 * 0.05);
        ud.glow.scale.set(gs, gs, 1);
        ud.glow.material.opacity = 0.62 + w1 * 0.08 + w3 * 0.05;
      }
    });
  }

  
  // Fiamma del testimone
  testimoneFlame.material.opacity = 0.85 + Math.sin(elapsed * 3.5) * 0.15;
  testimoneFlame.scale.setScalar(1 + Math.sin(elapsed * 4.5) * 0.15);

  // Spada Fiammeggiante: luce e lama che pulsano come vere fiamme
  if (flameAuraLight) {
    flameAuraLight.intensity = 1.0 + Math.sin(elapsed * 6.0) * 0.4 + Math.sin(elapsed * 11.0) * 0.2;
  }
  if (bladeSteelMat) {
    bladeSteelMat.emissiveIntensity = 0.5 + Math.sin(elapsed * 5.0 + 1.2) * 0.25 + Math.sin(elapsed * 9.0) * 0.1;
  }
  


  // Luci che pulsano leggermente (per far vibrare il bloom)
  goldLight.intensity = 1.8 + Math.sin(elapsed * 2) * 0.3;
  eastLight.intensity = 2.2 + Math.sin(elapsed * 1.5) * 0.4;
  altarLight.intensity = 1.5 + Math.sin(elapsed * 3) * 0.25;
  
  // Zodiaco - dissolvenza progressiva (appare presto, già durante la vista degli strumenti)
  const zodiacOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.12) * 4));
  zodiacMeshes.forEach(mat => mat.opacity = zodiacOpacity * 0.9);
  
  // Volta stellata - twinkle delle stelle (sprite a forma di stella)
  vaultStarSprites.forEach(sprite => {
    const tw = Math.sin(elapsed * sprite.userData.twinkleSpeed + sprite.userData.twinklePhase);
    sprite.material.opacity = sprite.userData.baseOpacity * (0.65 + tw * 0.35);
  });

  // Volta + costellazioni: rotazione molto lenta (movimento esoterico)
  if (constellationGroup) {
    constellationGroup.rotation.y = elapsed * 0.012;
  }
  if (vaultGroup) {
    vaultGroup.rotation.y = elapsed * 0.008;
  }
  
  // Globo terraqueo di Boaz: rotazione lenta sul proprio asse
  if (columnB && columnB.userData.globe) {
    columnB.userData.globe.rotation.y = elapsed * 0.15;
  }

  // Sole e Luna rotano lentamente
  sun.rotation.z = elapsed * 0.1;
  moon.rotation.z = -elapsed * 0.08;
  
  // Render con bloom personalizzato
  renderWithBloom();
  requestAnimationFrame(animate);
}

animate();
updateScroll();

// Segnala che la scena è pronta — il loader può essere nascosto
window.dispatchEvent(new CustomEvent('temple-ready'));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Aggiorna i render target
  sceneRT.setSize(window.innerWidth, window.innerHeight);
  brightRT.setSize(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
  blurRT_A.setSize(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
  blurRT_B.setSize(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
  blurMat.uniforms.resolution.value.set(window.innerWidth / 2, window.innerHeight / 2);
});
