/* ========= WORD BANK ========= */
const wordBank = {
  A: [
    { word: "Ayam", icon: "🐓" },
    { word: "Apel", icon: "🍎" },
    { word: "Awan", icon: "☁️" }
  ],
  B: [
    { word: "Bola", icon: "⚽" },
    { word: "Buku", icon: "📘" },
    { word: "Bunga", icon: "🌸" }
  ],
  C: [
    { word: "Ceri", icon: "🍒" },
    { word: "Coklat", icon: "🍫" },
    { word: "Cermin", icon: "🪞" }
  ],
  D: [
    { word: "Dadu", icon: "🎲" },
    { word: "Donat", icon: "🍩" },
    { word: "Daun", icon: "🍃" }
  ],
  E: [
    { word: "Es", icon: "❄️" },
    { word: "Ember", icon: "🪣" },
    { word: "Elang", icon: "🦅" }
  ],
  F: [
    { word: "Foto", icon: "📷" },
    { word: "Fajar", icon: "🌅" },
    { word: "Flamingo", icon: "🦩" }
  ],
  G: [
    { word: "Gajah", icon: "🐘" },
    { word: "Gelas", icon: "🥛" },
    { word: "Gerhana", icon: "🌘" }
  ],
  H: [
    { word: "Hati", icon: "❤️" },
    { word: "Hujan", icon: "🌧️" },
    { word: "Helikopter", icon: "🚁" }
  ],
  I: [
    { word: "Ikan", icon: "🐟" },
    { word: "Itik", icon: "🦆" },
    { word: "Indonesia", icon: "🇮🇩" }
  ],
  J: [
    { word: "Jagung", icon: "🌽" },
    { word: "Jerapah", icon: "🦒" },
    { word: "Jam", icon: "⏰" }
  ],
  K: [
    { word: "Kuda", icon: "🐎" },
    { word: "Kucing", icon: "🐈" },
    { word: "Kue", icon: "🍰" }
  ],
  L: [
    { word: "Lampu", icon: "💡" },
    { word: "Lebah", icon: "🐝" },
    { word: "Lemon", icon: "🍋" }
  ],
  M: [
    { word: "Mobil", icon: "🚗" },
    { word: "Madu", icon: "🍯" },
    { word: "Mawar", icon: "🌹" }
  ],
  N: [
    { word: "Nanas", icon: "🍍" },
    { word: "Nasi", icon: "🍚" },
    { word: "Notebook", icon: "📓" }
  ],
  O: [
    { word: "Ombak", icon: "🌊" },
    { word: "Obat", icon: "💊" },
    { word: "Origami", icon: "🧧" }
  ],
  P: [
    { word: "Pisang", icon: "🍌" },
    { word: "Payung", icon: "☂️" },
    { word: "Planet", icon: "🪐" }
  ],
  Q: [
    { word: "Quran", icon: "📖" },
    { word: "Qatar", icon: "🇶🇦" }
  ],
  R: [
    { word: "Roti", icon: "🍞" },
    { word: "Rumah", icon: "🏠" },
    { word: "Roket", icon: "🚀" }
  ],
  S: [
    { word: "Sapi", icon: "🐄" },
    { word: "Sepeda", icon: "🚲" },
    { word: "Salju", icon: "❄️" }
  ],
  T: [
    { word: "Tas", icon: "👜" },
    { word: "Topi", icon: "🎩" },
    { word: "Taman", icon: "🏞️" }
  ],
  U: [
    { word: "Ular", icon: "🐍" },
    { word: "Udang", icon: "🦐" },
    { word: "Ulat", icon: "🐛" }
  ],
  V: [
    { word: "Vas", icon: "🏺" },
    { word: "Violin", icon: "🎻" },
    { word: "Video", icon: "🎥" }
  ],
  W: [
    { word: "Wortel", icon: "🥕" },
    { word: "Warna", icon: "🎨" },
    { word: "Wajah", icon: "🙂" }
  ],
  X: [
    { word: "Xylophone", icon: "🎶" },
    { word: "Xbox", icon: "🎮" },
    { word: "X-ray", icon: "💀" }
  ],
  Y: [
    { word: "Yoyo", icon: "🪀" },
    { word: "Yoga", icon: "🧘" },
    { word: "Yukata", icon: "👘" }
  ],
  Z: [
    { word: "Zebra", icon: "🦓" },
    { word: "Zombie", icon: "🧟" },
    { word: "Zaitun", icon: "🫒" }
  ]
};

// mark this menu as last visited (used by Main menu resume)
try { localStorage.setItem('lastVisitedFull', 'menu kataku/kataku.html'); } catch(e){}

/* ELEMENTS */
const gridEl = document.getElementById("grid");
const emojiEl = document.getElementById("emoji");
const wordEl = document.getElementById("word");
const speakBtn = document.getElementById("speakBtn");
const hintBtn = document.getElementById("hintBtn");
const clearBtn = document.getElementById("clearBtn");
const nextBtn = document.getElementById("nextBtn");
const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");

const homeBtn = document.getElementById("homeBtn");
const mulaiBtn = document.getElementById("mulaiBtn");

const audioBtn = document.getElementById("audioBtn");
const starBtn = document.getElementById("starBtn");
const bgm = document.getElementById("bgm");
function resetProgress(){

  // Hapus data progres yg tersimpan
  localStorage.removeItem("progressLetters");

  // Reset progress dalam memori
  progressLetters = {};

  // Hapus tanda selesai pada grid
  document.querySelectorAll(".letter").forEach(el=>{
    el.classList.remove("done");
  });

  // Feedback log (atau bisa diganti alert)
  console.log("Progress berhasil direset!");
}

const cheerSound = new Audio(
  "https://www.myinstants.com/media/sounds/kids_cheering.mp3"
);

/* STATE */
let currentLetter = "A";
let currentWord = null;
let showingGuide = true;

/* PROGRESS LETTER */
let progressLetters = JSON.parse(
  localStorage.getItem("progressLetters") || "{}"
);

/* BUILD GRID */
Object.keys(wordBank).forEach((h) => {
  const b = document.createElement("div");
  b.className = "letter";
  b.textContent = h;
  b.onclick = () => pickLetter(h);
  gridEl.appendChild(b);
});

/* HIGHLIGHT & INDICATOR */
function highlight(letter) {
  document.querySelectorAll(".letter").forEach((el) => {
    const h = el.textContent;

    if (h === letter) {
      el.style.background = "#e7f4ff";
      el.style.transform = "scale(1.06)";
    } else {
      el.style.background = "#fff";
      el.style.transform = "none";
    }

    if (progressLetters[h]) el.classList.add("done");
    else el.classList.remove("done");
  });
}

/* PICK LETTER */
function pickLetter(letter) {
  currentLetter = letter;
  loadWord();
  highlight(letter);
}

/* Only Capitalize First Letter */
function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* LOAD RANDOM WORD (tanpa mengulangi kata yang sedang ditampilkan) */
function loadWord() {
  const list = wordBank[currentLetter];
  let pick = list[Math.floor(Math.random() * list.length)];
  
  // Jika kata yang dipilih sama dengan kata saat ini, pilih yang lain
  if (currentWord && pick.word === currentWord.word) {
    // Jika hanya ada 1 kata, gunakan kata itu saja
    if (list.length > 1) {
      // Pilih kata random yang bukan kata sekarang
      do {
        pick = list[Math.floor(Math.random() * list.length)];
      } while (pick.word === currentWord.word);
    }
  }
  
  currentWord = pick;

  emojiEl.textContent = pick.icon;
  wordEl.textContent = cap(pick.word);

  drawGuide();
}

/* DRAW GUIDE */
function drawGuide() {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

  const text = cap(currentWord.word);

  ctx.font = "120px Nunito";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeStyle = "#6aa5ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.strokeText(text, drawCanvas.width / 2, drawCanvas.height / 2);

  ctx.setLineDash([]);
}

/* CHECK WRITING */
function writingCorrect() {
  const data = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;
  let ink = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (r < 40 && g < 90 && b > 100) ink++;
  }
  return ink > 1800;
}

/* NEXT WORD */
nextBtn.onclick = () => {
  if (writingCorrect()) {
    cheerSound.currentTime = 0;
    cheerSound.play();
    spawnStars(20);

    progressLetters[currentLetter] = true;
    localStorage.setItem("progressLetters", JSON.stringify(progressLetters));
    highlight(currentLetter);
  }
  loadWord();
};

/* SPEAK */
speakBtn.onclick = () => {
  const u = new SpeechSynthesisUtterance(currentWord.word);
  u.lang = "id-ID";
  speechSynthesis.speak(u);
};

/* DRAWING */
let drawing = false;

drawCanvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#134b78";
});

drawCanvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const r = drawCanvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (drawCanvas.width / r.width);
  const y = (e.clientY - r.top) * (drawCanvas.height / r.height);
  ctx.lineTo(x, y);
  ctx.stroke();
});

["pointerup", "pointerleave", "pointercancel"].forEach((ev) => {
  drawCanvas.addEventListener(ev, () => (drawing = false));
});

/* CLEAR CANVAS */
clearBtn.onclick = () => drawGuide();

/* HINT TOGGLE */
hintBtn.onclick = () => {
  showingGuide = !showingGuide;
  if (showingGuide) drawGuide();
  else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  }
};

/* HOME */
homeBtn.onclick = () => (window.location.href = "../main menu.html");

/* MULAI BELAJAR RANDOM */
mulaiBtn.onclick = () => {
  const letters = Object.keys(wordBank);
  const r = letters[Math.floor(Math.random() * letters.length)];
  pickLetter(r);
  document.querySelector(".latihan").scrollIntoView({ behavior: "smooth" });
};

/* MUSIC */
let audioOn = false;
audioBtn.onclick = () => {
  if (audioOn) bgm.pause();
  else bgm.play();
  audioOn = !audioOn;
};

/* STAR ANIMATION */
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

/* INIT */
document.querySelectorAll(".letter").forEach((el) => {
  if (progressLetters[el.textContent]) el.classList.add("done");
});

pickLetter("A");

/* RESET MODAL */
function showResetModal() {
  const modal = document.createElement('div');
  modal.className = 'reset-modal';
  modal.innerHTML = `
    <div class="reset-dialog">
      <h3>Reset Semua Progres?</h3>
      <p>Tindakan ini tidak bisa dibatalkan.</p>
      <div class="modal-buttons">
        <button class="btn-cancel">Batal</button>
        <button class="btn-confirm">Ya, Reset</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('.btn-cancel').onclick = () => modal.remove();
  modal.querySelector('.btn-confirm').onclick = () => {
    resetProgress();
    modal.remove();
  };
}

const resetBtn = document.getElementById("resetBtn");
resetBtn.onclick = () => showResetModal();