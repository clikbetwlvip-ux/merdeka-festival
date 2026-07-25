const playerIdInput = document.getElementById('playerId');
const loginBtn = document.getElementById('loginBtn');
const loginForm = document.getElementById('loginForm');
const statusBadge = document.getElementById('statusBadge');
const particlesContainer = document.getElementById('particles');

function updateButton() {
  const value = playerIdInput.value.trim();
  loginBtn.disabled = value.length < 3;
}

playerIdInput.addEventListener('input', updateButton);

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = playerIdInput.value.trim();

  if (id.length < 3) return;

  loginBtn.disabled = true;
  loginBtn.querySelector('.btn-text').textContent = 'MEMUAT...';

  setTimeout(() => {
    statusBadge.textContent = `ID PEMAIN: ${id}`;
    statusBadge.classList.add('logged');

    setTimeout(() => {
      window.location.href = `game.html?id=${encodeURIComponent(id)}`;
    }, 600);
  }, 900);
});

function createParticles() {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (3 + Math.random() * 4) + 's';
    p.style.animationDelay = Math.random() * 4 + 's';
    p.style.width = (4 + Math.random() * 6) + 'px';
    p.style.height = p.style.width;
    particlesContainer.appendChild(p);
  }
}

createParticles();
