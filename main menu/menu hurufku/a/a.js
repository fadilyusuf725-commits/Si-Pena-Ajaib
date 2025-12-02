/* huruf-script.js — FINAL for letter A
   - masks generated from glyph outlines (templateCanvas)
   - coverage computed only on pixels inside glyph masks
   - petunjuk arrows drawn inside glyph outlines
   - removed unused variables (gridEl, emojiEl, wordEl)
   - homeFooter opens ../../main menu/Main menu.html
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
const homeFooter = document.getElementById('homeFooter'); // footer home button (redirect)
 
/* state */
let isDrawing = false;
let showArrows = false;   // arrows/numbers only when true
let cheerPlayed = false;
let audioOn = false;

/* letter / progress */
let currentLetter = 'A'; // file is for letter A; keep dynamic if you later set body.dataset.letter
try { localStorage.setItem('lastVisitedFull', 'menu hurufku/a/a.html'); } catch(e){}
let progressLetters = JSON.parse(localStorage.getItem('progressLetters') || '{}');

/* GUIDE layout / sizes (tuned) */
const LEFT_CENTER_X = Math.round(CANVAS_W * 0.28);
const RIGHT_CENTER_X = Math.round(CANVAS_W * 0.72);
const GUIDE_CENTER_Y = Math.round(CANVAS_H * 0.52);

const BIG_FONT = 350;   // glyph font size (big)
const SMALL_FONT = 350; // using same to keep proportions for Nunito

/* sampling & percent thresholds */
const SAMPLE_STEP = 4;               // pixel sampling step
const COVERAGE_THRESHOLD_PCT = 50;   // percent required per glyph

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

/* ---------- Render glyph outlines into templateCanvas (solid fill)
   We'll create binary masks from these fills for left (BIG) and right (small).
*/
let leftMaskPixels = null;  // Uint8Array boolean (0/1) flatten size CANVAS_W*CANVAS_H
let rightMaskPixels = null;
let leftMaskCount = 0;
let rightMaskCount = 0;

function renderGlyphMasks() {
  if (!tctx) return;

  // clear template
  tctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  // white background
  tctx.fillStyle = '#ffffff';
  tctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // draw filled glyphs (solid black) to create mask
  tctx.fillStyle = '#000000';
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';

  // left big capital
  tctx.font = `${BIG_FONT}px Nunito, sans-serif`;
  tctx.fillText(currentLetter.toUpperCase(), LEFT_CENTER_X, GUIDE_CENTER_Y);

  // right small
  tctx.font = `${SMALL_FONT}px Nunito, sans-serif`;
  tctx.fillText(currentLetter.toLowerCase(), RIGHT_CENTER_X, GUIDE_CENTER_Y);

  // Now read pixel data and build masks
  const img = tctx.getImageData(0,0,CANVAS_W,CANVAS_H);
  const data = img.data;

  leftMaskPixels = new Uint8Array(CANVAS_W * CANVAS_H);
  rightMaskPixels = new Uint8Array(CANVAS_W * CANVAS_H);
  leftMaskCount = 0;
  rightMaskCount = 0;

  // Determine rough bounding areas to speed up detection: left/right halves
  const midX = Math.floor(CANVAS_W/2);

  for (let y=0; y<CANVAS_H; y++){
    for (let x=0; x<CANVAS_W; x++){
      const idx = (y * CANVAS_W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      // if pixel is dark (black glyph), treat as glyph pixel
      const dark = a > 10 && (r + g + b) < 200; // black-ish
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

  // fallback protection: avoid zero masks
  if (leftMaskCount === 0) {
    // fallback: approximate left box region as mask
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

/* draw dashed glyph outlines + optional arrows/numbers (over template) */
function renderGuideTemplate(withArrows = false) {
  if (!tctx) return;
  // draw white bg first
  tctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  tctx.fillStyle = '#fff';
  tctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // dashed stroke outlines (black dashed for high contrast)
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

  // guide numbers and visual indicators - show when withArrows is true
  if (withArrows) {
    tctx.save();
    tctx.fillStyle = '#FF6B35'; // orange/highlight color for visibility
    tctx.strokeStyle = '#FF6B35';
    tctx.lineWidth = 2;
    tctx.font = 'bold 28px Nunito, sans-serif';
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';

    const Lx = LEFT_CENTER_X, Rx = RIGHT_CENTER_X, Cy = GUIDE_CENTER_Y;

    // A: stroke order numbers
    if (currentLetter.toUpperCase() === 'A') {
      const topY = Cy - 160;
      const footY = Cy + 190;
      const barY = Cy + 15;

      // Number 1 on left slant
      tctx.fillText('①', Lx - 60, topY + 40);
      
      // Number 2 on right slant
      tctx.fillText('②', Lx + 60, topY + 40);
      
      // Number 3 on crossbar
      tctx.fillText('③', Lx, barY - 50);
    }

    // a: stroke order numbers
    if (currentLetter.toLowerCase() === 'a') {
      const ax = Rx, ay = Cy + 8;
      
      // Number 1 on entrance curve
      tctx.fillText('①', ax + 20, ay - 80);
      
      // Number 2 on body circle
      tctx.fillText('②', ax - 40, ay + 20);
    }

    tctx.restore();
  }
}

/* Draw guide on drawCanvas background if no template present.
   We will not overwrite user strokes—this function is used when clearing to re-draw background. */
function drawGuideBackgroundOnDrawCanvas() {
  // draw white bg under user strokes
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // dashed outlines if no template
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

/* ---------- Create masks initially ---------- */
renderGlyphMasks();          // generate leftMaskPixels & rightMaskPixels
renderGuideTemplate(false);  // initial render without arrows

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
    evaluateCoverage(); // check after each stroke session
  });
});

/* ---------- Coverage evaluation using glyph masks ---------- */
function evaluateCoverage() {

  /* NEW: jika sudah berhasil, langsung stop total */
  if (cheerPlayed) {
    return; // blokir semua perhitungan persentase selanjutnya
  }

  // read draw canvas pixels once
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

  // UPDATE FEEDBACK hanya jika belum sukses
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
/* clear only user strokes (template remains) */
clearBtn.addEventListener('click', () => {
    
    // hapus coretan saja
    ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);

    // render ulang outline huruf pada templateCanvas
    renderGuideTemplate(showArrows);

    // reset status
    cheerPlayed = false;
    cheered = false;

    traceFeedback.innerHTML = 'Coretan dibersihkan.';
});
/* toggle arrows overlay (Petunjuk button) */
if (toggleGuideBtn) {
  toggleGuideBtn.addEventListener('click', () => {
    showArrows = !showArrows;
    toggleGuideBtn.textContent = showArrows ? 'Sembunyikan Petunjuk' : 'Petunjuk';
    renderGuideTemplate(showArrows);
  });
}

/* next letter navigation */
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

/* header home */
if (homeBtn) homeBtn.addEventListener('click', ()=> window.location.href = '../../main menu.html');

/* footer home simple redirect (as requested) */
if (homeFooter) homeFooter.onclick = () => location.href = "../../main menu.html";

/* pronounce */
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


/* music toggle */
if (musicBtn) {
  musicBtn.addEventListener('click', () => {
    if (audioOn) { bgm.pause(); audioOn = false; musicBtn.textContent = '🎵'; }
    else { bgm.play().catch(()=>{}); audioOn = true; musicBtn.textContent = '🔊'; }
  });
}

/* star btn */
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

/* update grid done marks — kept safe (grid may not exist) */
function updateGridDoneMark(){
  const gridEl = document.getElementById('grid'); // local query
  if (!gridEl) return;
  document.querySelectorAll('.letter').forEach(el=>{
    const h = el.textContent;
    if (progressLetters[h]) el.classList.add('done');
    else el.classList.remove('done');
  });
}

/* initial feedback text */
if (traceFeedback) traceFeedback.innerHTML = 'Ikuti huruf besar & kecil. Tekan Petunjuk untuk melihat panah & garis bantu.';

/* expose helper for console debugging */
window._huruf_helpers = {
  renderGlyphMasks,
  evaluateCoverage,
  spawnStars,
  leftMaskCount,
  rightMaskCount,
  COVERAGE_THRESHOLD_PCT
};


