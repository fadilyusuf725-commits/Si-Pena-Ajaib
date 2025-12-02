/* ceritaku-final.js — final polished
   - single hint button (levels 1..3 sticky at 3)
   - hint levels restore hinted words if user moves them
   - wrong sound (aww) reliably played
   - yeay sound plays once per scene, not cut
   - footer/music/home unified
*/

/* ---------- DOM ---------- */
const bgm = document.getElementById('bgm');
const homeBtn = document.getElementById('homeBtn');
const homeFooter = document.getElementById('homeFooter');
const musicFooter = document.getElementById('musicFooter');
const storySelect = document.getElementById('storySelect');
const startBtn = document.getElementById('startBtn');
const sceneArea = document.getElementById('sceneArea');
const sceneImg = document.getElementById('sceneImg');
const sceneIndexBadge = document.getElementById('sceneIndexBadge');
const wordBankEl = document.getElementById('wordBank');
const dropArea = document.getElementById('dropArea');
const hintBtn = document.getElementById('hintBtn');
const clearBtn = document.getElementById('clearBtn');
const nextBtn = document.getElementById('nextBtn');
const feedback = document.getElementById('feedback');
const starBtn = document.getElementById('starBtn');

// mark this menu as last visited (used by Main menu resume)
try { localStorage.setItem('lastVisitedFull', 'menu ceritaku/menu ceritaku.html'); } catch(e){}

/* ---------- audio (separate objects to avoid collision) ---------- */
const CHEER_SRC = "https://www.myinstants.com/media/sounds/kids_cheering.mp3";
const AWW_SRC   = "https://www.myinstants.com/media/sounds/studio-audience-awwww-sound-fx.mp3";

const yeayAudio = new Audio(CHEER_SRC); yeayAudio.preload = 'auto'; yeayAudio.volume = 1;
const wrongAudio = new Audio(AWW_SRC); wrongAudio.preload = 'auto'; wrongAudio.volume = 1;

/* helper audio functions (pause others before play) */
function playYeayOnce(sceneKey) {
  if (playedYeay[sceneKey]) return;
  try {
    wrongAudio.pause(); wrongAudio.currentTime = 0;
    yeayAudio.pause(); yeayAudio.currentTime = 0;
    yeayAudio.play().catch(()=>{});
    playedYeay[sceneKey] = true;
  } catch(e){ console.warn(e); }
}
function playWrong() {
  try {
    yeayAudio.pause(); yeayAudio.currentTime = 0;
    wrongAudio.pause(); wrongAudio.currentTime = 0;
    wrongAudio.play().catch(()=>{});
  } catch(e){ console.warn(e); }
}

/* ---------- stories (2 sample stories) ---------- */
const stories = {
  andi: {
    id: 'andi',
    title: 'Andi Pergi ke Sekolah',
    scenes: [
      { img: 'Andi 1.jpeg', sentence: 'Andi bangun pagi dan meregangkan tubuhnya.' },
      { img: 'Andi 2.jpeg', sentence: 'Andi mandi dengan sabun dan bermain busa.' },
      { img: 'Andi 3.jpeg', sentence: 'Andi sarapan sehat agar kuat di sekolah.' },
      { img: 'Andi 4.jpeg', sentence: 'Andi berjalan menuju sekolah sambil tersenyum.' }
    ]
  },
  kancil: {
    id: 'kancil',
    title: 'Si Kancil dan Buaya',
    scenes: [
      { img: 'Kancil 1.jpeg', sentence: 'Kancil melihat buaya di tepi sungai.' },
      { img: 'Kancil 2.jpeg', sentence: 'Buaya membuka mulutnya mendekati Kancil.' },
      { img: 'Kancil 3.jpeg', sentence: 'Kancil melompat di atas punggung buaya dan menyeberang.' },
      { img: 'Kancil 4.jpeg', sentence: 'Kancil sampai di seberang dan memetik apel.' }
    ]
  }
};

/* ---------- state ---------- */
let currentStory = null;
let currentSceneIndex = 0;
let shuffledWords = [];
let hintLevel = 0; // 0 none, 1 fill1, 2 fill2, 3 dubbing (sticky)
const hintedSlots = new Set(); // indices that were auto-filled by hint
const playedYeay = {}; // guard yeay per scene (key: story_scene)
const progressKey = 'cerita_progress';
let progress = JSON.parse(localStorage.getItem(progressKey) || '{}');

/* ---------- init ---------- */
function initStoryOptions(){
  Object.values(stories).forEach(st=>{
    const opt = document.createElement('option');
    opt.value = st.id;
    opt.textContent = st.title;
    storySelect.appendChild(opt);
  });
}
initStoryOptions();

/* bindings */
musicFooter && musicFooter.addEventListener('click', ()=>{
  if (bgm.paused) { bgm.play().catch(()=>{}); musicFooter.textContent='🔊'; }
  else { bgm.pause(); musicFooter.textContent='🎵'; }
});
homeBtn && (homeBtn.addEventListener('click', ()=> location.href = '../main menu.html'));
homeFooter && (homeFooter.addEventListener('click', ()=> location.href = '../main menu.html'));

startBtn.addEventListener('click', ()=> {
  const id = storySelect.value || 'andi';
  openStory(id);
});

/* ---------- scene lifecycle ---------- */
function openStory(id){
  currentStory = stories[id];
  currentSceneIndex = 0;
  sceneArea.classList.remove('hidden');
  feedback.textContent = '';
  loadScene();
}

function loadScene(){
  const scene = currentStory.scenes[currentSceneIndex];
  sceneImg.src = scene.img;
  sceneImg.onerror = function() { 
    this.src = ''; 
    feedback.textContent = '(Gambar tidak ditemukan)';
  };
  sceneImg.alt = `Gambar ${currentSceneIndex+1}`;
  sceneIndexBadge.textContent = `${currentSceneIndex+1}/${currentStory.scenes.length}`;

  const words = scene.sentence.split(/\s+/).filter(Boolean);
  shuffledWords = shuffleArray(words);
  renderSlots(words.length);
  renderWordBank(shuffledWords);
  nextBtn.classList.add('hidden');
  hintLevel = 0;
  hintedSlots.clear();
  feedback.textContent = 'Susun kata dari gambar menjadi sebuah kalimat.';
  // if completed earlier
  const key = `${currentStory.id}_${currentSceneIndex}`;
  if (progress[key]) {
    feedback.textContent = 'Sudah terselesaikan. Tekan Lanjut.';
    nextBtn.classList.remove('hidden');
  }
}

/* ---------- rendering ---------- */
function renderSlots(n) {
  dropArea.innerHTML = '';
  for (let i=0;i<n;i++){
    const s = document.createElement('div');
    s.className = 'slot';
    s.dataset.index = i;
    s.addEventListener('dragover', e=> e.preventDefault());
    s.addEventListener('drop', onDropToSlot);
    dropArea.appendChild(s);
  }
}
function renderWordBank(words) {
  wordBankEl.innerHTML = '';
  words.forEach(w=>{
    const el = document.createElement('div');
    el.className = 'word';
    el.textContent = w;
    el.draggable = true;
    el.dataset.word = w;
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragend', onDragEnd);
    wordBankEl.appendChild(el);
  });
}

/* ---------- drag/drop ---------- */
function onDragStart(e){
  e.dataTransfer.setData('text/plain', e.target.dataset.word);
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onDragEnd(e){
  e.target.classList.remove('dragging');
}
function onDropToSlot(e){
  e.preventDefault();
  const slot = e.currentTarget;
  // if slot has child, return it to bank
  if (slot.firstChild){
    wordBankEl.appendChild(slot.firstChild);
  }
  const wordText = e.dataTransfer.getData('text/plain');
  const draggedEl = Array.from(document.querySelectorAll('.word')).find(x=>x.dataset.word===wordText);
  if (!draggedEl) return;
  slot.appendChild(draggedEl);
  slot.classList.add('filled');
  // when user moves a hinted slot's word away, keep noted (we will restore on hint press)
  checkAssembly();
}
/* allow dropping back to bank */
wordBankEl.addEventListener('dragover', e=> e.preventDefault());
wordBankEl.addEventListener('drop', e=>{
  e.preventDefault();
  const word = e.dataTransfer.getData('text/plain');
  const el = Array.from(document.querySelectorAll('.slot .word')).find(x=>x.dataset.word===word);
  if (el) {
    wordBankEl.appendChild(el);
    el.parentElement.classList.remove('filled');
  }
  checkAssembly();
});

/* ---------- assembly check ---------- */
function getSceneWords(){ return currentStory.scenes[currentSceneIndex].sentence.split(/\s+/).filter(Boolean); }

function checkAssembly(){
  const words = getSceneWords();
  const slots = Array.from(dropArea.querySelectorAll('.slot'));
  const assembled = slots.map(s => s.firstChild ? s.firstChild.dataset.word : null);

  slots.forEach(s=>{ if (s.firstChild) s.classList.add('filled'); else s.classList.remove('filled'); });

  if (assembled.some(x=>x===null)) return;

  const correct = assembled.join(' ') === words.join(' ');
  if (correct) {
    onSceneCorrect();
  } else {
    // wrong: play aww reliably
    playWrong();
    feedback.textContent = 'Urutan belum benar. Coba lagi.';
    dropArea.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:300});
  }
}

/* ---------- correct handling ---------- */
function onSceneCorrect(){
  const key = `${currentStory.id}_${currentSceneIndex}`;
  feedback.textContent = 'Benar! Yeay 🎉';
  playYeayOnce(key);
  spawnStars(10);
  progress[key] = true;
  localStorage.setItem(progressKey, JSON.stringify(progress));
  nextBtn.classList.remove('hidden');
  setTimeout(()=> {
    if (currentSceneIndex < currentStory.scenes.length - 1) {
      currentSceneIndex++;
      loadScene();
    } else {
      feedback.textContent = 'Selamat! Cerita selesai.';
    }
  }, 900);
}

/* ---------- next/clear ---------- */
nextBtn.addEventListener('click', ()=> {
  if (currentSceneIndex < currentStory.scenes.length - 1) {
    currentSceneIndex++;
    loadScene();
  } else {
    feedback.textContent = 'Ini sudah scene terakhir.';
  }
});
clearBtn.addEventListener('click', ()=> {
  const slots = Array.from(dropArea.querySelectorAll('.slot'));
  slots.forEach(s=>{
    if (s.firstChild) wordBankEl.appendChild(s.firstChild);
    s.classList.remove('filled');
  });
  feedback.textContent = 'Susunan dikosongkan.';
  hintLevel = 0;
  hintedSlots.clear();
});

/* ---------- hint logic ---------- */
function fillSlotWithWord(index, wordText){
  const slot = dropArea.querySelector(`.slot[data-index="${index}"]`);
  if (!slot) return false;
  // if correct word already there, ok
  if (slot.firstChild && slot.firstChild.dataset.word === wordText) return true;
  // remove word from wherever it is
  const existingInSlot = Array.from(dropArea.querySelectorAll('.slot .word')).find(w => w.dataset.word === wordText);
  if (existingInSlot) existingInSlot.parentElement.removeChild(existingInSlot);
  // find word in bank
  let bankEl = Array.from(document.querySelectorAll('.word')).find(x=>x.dataset.word===wordText);
  if (!bankEl) {
    // create fallback
    bankEl = document.createElement('div');
    bankEl.className = 'word';
    bankEl.textContent = wordText;
    bankEl.dataset.word = wordText;
    bankEl.draggable = true;
    bankEl.addEventListener('dragstart', onDragStart);
    bankEl.addEventListener('dragend', onDragEnd);
    wordBankEl.appendChild(bankEl);
  }
  slot.appendChild(bankEl);
  slot.classList.add('filled');
  return true;
}

function applyHintLevel(level){
  const words = getSceneWords();
  if (level <= 0) return;
  if (level === 1 || level === 2){
    for (let i=0;i<level && i<words.length;i++){
      const success = fillSlotWithWord(i, words[i]);
      if (success) hintedSlots.add(i);
    }
    feedback.textContent = `Petunjuk level ${level}: ${Math.min(level, words.length)} kata terisi.`;
    checkAssembly();
    return;
  }
  // level 3: do not insert new words — restore any hinted slots to correct words
  hintedSlots.forEach(i=>{
    const desired = words[i];
    fillSlotWithWord(i, desired);
  });
  feedback.textContent = 'Petunjuk level 3: dengarkan dubbing.';
  const u = new SpeechSynthesisUtterance(words.join(' '));
  u.lang = 'id-ID';
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* hint button semantics: 1->2->3 (sticky at 3) */
hintBtn.addEventListener('click', ()=> {
  if (!currentStory) return;
  if (hintLevel < 3) hintLevel++;
  // if already 3, keep 3; pressing will re-restore hinted slots
  applyHintLevel(hintLevel);
});

/* star button */
if (starBtn) starBtn.addEventListener('click', ()=> spawnStars(12));

/* ---------- utils ---------- */
function shuffleArray(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
function spawnStars(n=10){
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

/* ---------- init default ---------- */
(function init(){
  storySelect.value = Object.keys(stories)[0];
  Object.keys(stories).forEach(id=>{
    // already populated in initStoryOptions, sync just in case
  });
  startBtn.click();
})();