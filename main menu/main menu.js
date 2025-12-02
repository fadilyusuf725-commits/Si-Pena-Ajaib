// ======================================================
// 1. Simpan menu terakhir yang dibuka
// ======================================================
function bukaMenu(menu) {
  // Navigate to the requested menu and record full path so "Mulai Belajar" can resume
  if (menu === 'huruf') {
    const path = 'menu hurufku/a/a.html';
    localStorage.setItem('lastVisitedFull', path);
    localStorage.setItem('menuTerakhir', 'huruf');
    window.location.href = path;
    return;
  }
  if (menu === 'kata') {
    const path = 'menu kataku/kataku.html';
    localStorage.setItem('lastVisitedFull', path);
    localStorage.setItem('menuTerakhir', 'kata');
    window.location.href = path;
    return;
  }
  if (menu === 'cerita') {
    const path = 'menu ceritaku/menu ceritaku.html';
    localStorage.setItem('lastVisitedFull', path);
    localStorage.setItem('menuTerakhir', 'cerita');
    window.location.href = path;
    return;
  }
}

// ======================================================
// 2. Tombol 'Mulai Belajar' → menuju menu terakhir
// ======================================================
document.querySelector(".btn-start").addEventListener("click", () => {
  // resume to the last full path if available, otherwise fallback to huruf A
  const lastFull = localStorage.getItem('lastVisitedFull');
  const fallback = 'menu hurufku/a/a.html';
  const target = lastFull || fallback;
  window.location.href = target;
});

// ======================================================
// 3. Audio On/Off
// ======================================================
const audio = new Audio("https://cdn.pixabay.com/download/audio/2025/03/30/audio_3d2ec07913.mp3?filename=spring-in-my-step-copyright-free-music-for-youtube-320726.mp3");
audio.loop = true;

let audioNyala = false;

function toggleAudio() {
  if (audioNyala) {
    audio.pause();
  } else {
    audio.play();
  }
  audioNyala = !audioNyala;
}

// ======================================================
// 4. Animasi Bintang Jatuh
// ======================================================
function jatuhkanBintang() {
  for (let i = 0; i < 8; i++) {
    const b = document.createElement("div");
    b.classList.add("bintang");
    b.textContent = "⭐";
    b.style.left = Math.random() * 100 + "vw";
    b.style.fontSize = (20 + Math.random() * 20) + "px";
    document.body.appendChild(b);

    setTimeout(() => b.remove(), 2000);
  }
}