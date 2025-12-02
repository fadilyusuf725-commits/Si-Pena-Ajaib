/* huruf-script.js — for letter B
   - adapted from A with B-specific stroke positions
*/

/* ---------- CANVAS SETUP ---------- */
const templateCanvas = document.getElementById('templateCanvas');
const tctx = templateCanvas ? templateCanvas.getContext('2d') : null;

const drawCanvas = document.getElementById('drawCanvas');
if (!drawCanvas) throw new Error('drawCanvas element not found');
const ctx = drawCanvas.getContext('2d');

const CANVAS_W = 1100, CANVAS_H = 520;
drawCanvas.width = CANVAS_W;
drawCanvas.height = CANVAS_H;
if (templateCanvas) {
  templateCanvas.width = CANVAS_W;
  templateCanvas.height = CANVAS_H;
}

/* draw style for user */
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = 18;
ctx.strokeStyle = '#134b78';

/* audio */
const BG_MUSIC = 'https://cdn.pixabay.com/download/audio/2025/03/30/audio_3d2ec07913.mp3?filename=spring-in-my-step-copyright-free-music-for-youtube-320726.mp3';
const CHEER = 'https://www.myinstants.com/media/sounds/kids_cheering.mp3';
const bgm = document.getElementById('bgm') || new Audio(BG_MUSIC);
if (!document.getElementById('bgm')) bgm.loop = true;
const cheerAudio = new Audio(CHEER); cheerAudio.preload = 'auto'; cheerAudio.volume = 0.9;

/* UI elements (expected) */
const clearBtn = document.getElementById('clearBtn');
const toggleGuideBtn = document.getElementById('toggleGuide') || document.getElementById('toggleGuideBtn');
const nextBtn = document.getElementById('nextBtn');
const homeBtn = document.getElementById('homeBtn');
const musicBtn = document.getElementById('musicBtn') || document.getElementById('audioBtn');
const starBtn = document.getElementById('starBtn');
const traceFeedback = document.getElementById('traceFeedback');
const pronounceBtn = document.getElementById('pronounceBtn') || document.getElementById('speakBtn');
const homeFooter = document.getElementById('homeFooter');
 
/* state */
let isDrawing = false;
let showArrows = false;
let cheerPlayed = false;
let audioOn = false;

/* letter / progress */
let currentLetter = 'U';
try { localStorage.setItem('lastVisitedFull', 'menu hurufku/u/u.html'); } catch(e){}
let progressLetters = JSON.parse(localStorage.getItem('progressLetters') || '{}');

/* GUIDE layout / sizes (tuned) */
const LEFT_CENTER_X = Math.round(CANVAS_W * 0.28);
const RIGHT_CENTER_X = Math.round(CANVAS_W * 0.72);
const GUIDE_CENTER_Y = Math.round(CANVAS_H * 0.52);

const BIG_FONT = 350;
const SMALL_FONT = 350;

/* sampling & percent thresholds */
const SAMPLE_STEP = 4;
const COVERAGE_THRESHOLD_PCT = 50;

/* ---------- Helpers ---------- */
function drawArrowHead(ctx, x1, y1, x2, y2, size = 14) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - Math.PI / 6), y2 - size * Math.sin(ang - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(ang + Math.PI / 6), y2 - size * Math.sin(ang + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

/* ---------- Render glyph masks ---------- */
let leftMaskPixels = null;
let rightMaskPixels = null;
let leftMaskCount = 0;
let rightMaskCount = 0;

function renderGlyphMasks() {
  if (!tctx) return;

  tctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  tctx.fillStyle = '#ffffff';
  tctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  tctx.fillStyle = '#000000';
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';

  tctx.font = `${BIG_FONT}px Nunito, sans-serif`;
  tctx.fillText(currentLetter.toUpperCase(), LEFT_CENTER_X, GUIDE_CENTER_Y);

  tctx.font = `${SMALL_FONT}px Nunito, sans-serif`;
  tctx.fillText(currentLetter.toLowerCase(), RIGHT_CENTER_X, GUIDE_CENTER_Y);

  const img = tctx.getImageData(0,0,CANVAS_W,CANVAS_H);
  const data = img.data;

  leftMaskPixels = new Uint8Array(CANVAS_W * CANVAS_H);
  rightMaskPixels = new Uint8Array(CANVAS_W * CANVAS_H);
  leftMaskCount = 0;
  rightMaskCount = 0;

  const midX = Math.floor(CANVAS_W/2);

  for (let y=0; y<CANVAS_H; y++){
    for (let x=0; x<CANVAS_W; x++){
      const idx = (y * CANVAS_W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      const dark = a > 10 && (r + g + b) < 200;
      if (!dark) continue;
      const flat = y * CANVAS_W + x;
      if (x < midX) {
        leftMaskPixels[flat] = 1;
        leftMaskCount++;
      } else {
        rightMaskPixels[flat] = 1;
        rightMaskCount++;
      }
    }
  }

  if (leftMaskCount === 0) {
    const boxW = Math.round(CANVAS_W * 0.28);
    const boxH = Math.round(CANVAS_H * 0.7);
    const lx = Math.round(LEFT_CENTER_X - boxW/2);
    const ly = Math.round(GUIDE_CENTER_Y - boxH/2);
    for (let yy = ly; yy < ly + boxH; yy+= SAMPLE_STEP) {
      for (let xx = lx; xx < lx + boxW; xx+= SAMPLE_STEP) {
        const flat = yy * CANVAS_W + xx;
        leftMaskPixels[flat] = 1;
        leftMaskCount++;
      }
    }
  }
  if (rightMaskCount === 0) {
    const boxW = Math.round(CANVAS_W * 0.28);
    const boxH = Math.round(CANVAS_H * 0.7);
    const rx = Math.round(RIGHT_CENTER_X - boxW/2);
    const ry = Math.round(GUIDE_CENTER_Y - boxH/2);
    for (let yy = ry; yy < ry + boxH; yy+= SAMPLE_STEP) {
      for (let xx = rx; xx < rx + boxW; xx+= SAMPLE_STEP) {
        const flat = yy * CANVAS_W + xx;
        rightMaskPixels[flat] = 1;
        rightMaskCount++;
      }
    }
  }
}

/* draw dashed glyph outlines + optional numbered circles */
function renderGuideTemplate(withArrows = false) {
  if (!tctx) return;
  tctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  tctx.fillStyle = '#fff';
  tctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  tctx.strokeStyle = '#000';
  tctx.lineWidth = 5;
  tctx.setLineDash([10,13]);
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';

  tctx.font = `${BIG_FONT}px Nunito, sans-serif`;
  tctx.strokeText(currentLetter.toUpperCase(), LEFT_CENTER_X, GUIDE_CENTER_Y);

  tctx.font = `${SMALL_FONT}px Nunito, sans-serif`;
  tctx.strokeText(currentLetter.toLowerCase(), RIGHT_CENTER_X, GUIDE_CENTER_Y);

  tctx.setLineDash([]);

  if (withArrows) {
    tctx.save();
    tctx.fillStyle = '#FF6B35';
    tctx.strokeStyle = '#FF6B35';
    tctx.lineWidth = 2;
    tctx.font = 'bold 28px Nunito, sans-serif';
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';

    const Lx = LEFT_CENTER_X, Rx = RIGHT_CENTER_X, Cy = GUIDE_CENTER_Y;

    // U: stroke order - left vertical, bottom curve, right vertical (3 strokes)
    if (currentLetter.toUpperCase() === 'U') {
      // Number 1 on left
      tctx.fillText('①', Lx - 70, Cy - 80);
      
      // Number 2 on bottom
      tctx.fillText('②', Lx, Cy + 140);
      
      // Number 3 on right
      tctx.fillText('③', Lx + 70, Cy - 80);
    }

    // u: stroke order - left vertical, bottom, right vertical (3 strokes)
    if (currentLetter.toLowerCase() === 'u') {
      // Number 1 on left
      tctx.fillText('①', Rx - 40, Cy);
      
      // Number 2 on bottom
      tctx.fillText('②', Rx, Cy + 50);
      
      // Number 3 on right
      tctx.fillText('③', Rx + 40, Cy);
    }

    tctx.restore();
  }
}

function drawGuideBackgroundOnDrawCanvas() {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  if (!tctx) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.setLineDash([12,8]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${BIG_FONT}px Nunito, sans-serif`;
    ctx.strokeText(currentLetter.toUpperCase(), LEFT_CENTER_X, GUIDE_CENTER_Y);
    ctx.font = `${SMALL_FONT}px Nunito, sans-serif`;
    ctx.strokeText(currentLetter.toLowerCase(), RIGHT_CENTER_X, GUIDE_CENTER_Y);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

renderGlyphMasks();
renderGuideTemplate(false);

/* ---------- Drawing handlers ---------- */
function getPos(e, canvas) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return {
    x: (t.clientX - r.left) * (canvas.width / r.width),
    y: (t.clientY - r.top) * (canvas.height / r.height)
  };
}

drawCanvas.addEventListener('pointerdown', (ev) => {
  isDrawing = true;
  cheered = false;
  const p = getPos(ev, drawCanvas);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ev.preventDefault();
});
drawCanvas.addEventListener('pointermove', (ev) => {
  if (!isDrawing) return;
  const p = getPos(ev, drawCanvas);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
});
['pointerup','pointerleave','pointercancel'].forEach(ev => {
  drawCanvas.addEventListener(ev, () => {
    if (!isDrawing) return;
    isDrawing = false;
    evaluateCoverage();
  });
});

/* ---------- Coverage evaluation ---------- */
function evaluateCoverage() {

  if (cheerPlayed) {
    return;
  }

  let drawImg;
  try {
    drawImg = ctx.getImageData(0,0,CANVAS_W,CANVAS_H).data;
  } catch (err) {
    console.warn('evaluateCoverage getImageData failed', err);
    return;
  }

  let leftHit = 0, rightHit = 0;

  for (let y = 0; y < CANVAS_H; y += SAMPLE_STEP) {
    for (let x = 0; x < CANVAS_W; x += SAMPLE_STEP) {
      const flat = y * CANVAS_W + x;
      const idx = flat * 4;

      const r = drawImg[idx], g = drawImg[idx+1], b = drawImg[idx+2], a = drawImg[idx+3];
      const isInk = (a > 20 && r < 110 && g < 150 && b > 100);
      if (!isInk) continue;

      if (leftMaskPixels[flat]) leftHit++;
      if (rightMaskPixels[flat]) rightHit++;
    }
  }

  const leftPct = leftMaskCount ? Math.round((leftHit / Math.ceil(leftMaskCount / (SAMPLE_STEP*SAMPLE_STEP))) * 100) : 0;
  const rightPct = rightMaskCount ? Math.round((rightHit / Math.ceil(rightMaskCount / (SAMPLE_STEP*SAMPLE_STEP))) * 100) : 0;

  if (!cheerPlayed && traceFeedback) {
    traceFeedback.innerHTML = `Cakupan huruf besar: ${leftPct}% | huruf kecil: ${rightPct}%`;
  }

  const leftOk = leftPct >= COVERAGE_THRESHOLD_PCT;
  const rightOk = rightPct >= COVERAGE_THRESHOLD_PCT;

  if (leftOk && rightOk && !cheerPlayed) {
    cheerPlayed = true;

    try {
      cheerAudio.currentTime = 0;
      cheerAudio.play().catch(()=>{});
    } catch(e){}

    spawnStars(20);

    progressLetters[currentLetter] = true;
    localStorage.setItem('progressLetters', JSON.stringify(progressLetters));

    if (traceFeedback)
      traceFeedback.innerHTML = 'Yeay! Kamu menyelesaikan kedua sketsa 🎉';
  }

  updateGridDoneMark();
}

/* ---------- UI actions ---------- */
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
    renderGuideTemplate(showArrows);
    cheerPlayed = false;
    cheered = false;
    traceFeedback.innerHTML = 'Coretan dibersihkan.';
});

if (toggleGuideBtn) {
  toggleGuideBtn.addEventListener('click', () => {
    showArrows = !showArrows;
    toggleGuideBtn.textContent = showArrows ? 'Sembunyikan Petunjuk' : 'Petunjuk';
    renderGuideTemplate(showArrows);
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    const code = currentLetter.charCodeAt(0);
    if (code >= 65 && code < 90) {
      const next = String.fromCharCode(code + 1);
      const nextLower = next.toLowerCase();
      window.location.href = `../${nextLower}/${nextLower}.html`;
    } else {
      window.location.href = '../hurufku.html';
    }
  });
}

if (homeBtn) homeBtn.addEventListener('click', ()=> window.location.href = '../../main menu.html');

if (backBtn) backBtn.addEventListener('click', ()=> window.location.href = "../t/t.html");

if (homeFooter) homeFooter.onclick = () => location.href = "../../main menu.html";

if (pronounceBtn) {
  pronounceBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    const EXAMPLE_WORDS = {A:'ayam',B:'bola',C:'cacing',D:'domba',E:'elang',F:'foto',G:'gajah',H:'harimau',I:'ikan',J:'jagung',K:'kucing',L:'laut',M:'mobil',N:'naga',O:'orang',P:'pohon',Q:'quran',R:'roti',S:'sapi',T:'topi',U:'ular',V:'vas',W:'wajan',X:'xilofon',Y:'yoyo',Z:'zebra'};
    const letter = (currentLetter || '').toUpperCase();
    const example = EXAMPLE_WORDS[letter] || '';
    const text = example ? `${letter}. ${letter.toLowerCase()} seperti ${example}.` : `${letter}.`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'id-ID'; utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}

if (musicBtn) {
  musicBtn.addEventListener('click', () => {
    if (audioOn) { bgm.pause(); audioOn = false; musicBtn.textContent = '🎵'; }
    else { bgm.play().catch(()=>{}); audioOn = true; musicBtn.textContent = '🔊'; }
  });
}

if (starBtn) starBtn.addEventListener('click', ()=> spawnStars(12));

function spawnStars(n=10) {
  for (let i=0;i<n;i++){
    const el = document.createElement('div');
    el.className = 'bintang';
    el.textContent = '⭐';
    el.style.left = (Math.random()*88 + 4) + 'vw';
    el.style.fontSize = (16 + Math.random()*30) + 'px';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2600);
  }
}

function updateGridDoneMark(){
  const gridEl = document.getElementById('grid');
  if (!gridEl) return;
  document.querySelectorAll('.letter').forEach(el=>{
    const h = el.textContent;
    if (progressLetters[h]) el.classList.add('done');
    else el.classList.remove('done');
  });
}

if (traceFeedback) traceFeedback.innerHTML = 'Ikuti huruf besar & kecil. Tekan Petunjuk untuk melihat panah & garis bantu.';

window._huruf_helpers = {
  renderGlyphMasks,
  evaluateCoverage,
  spawnStars,
  leftMaskCount,
  rightMaskCount,
  COVERAGE_THRESHOLD_PCT
};





