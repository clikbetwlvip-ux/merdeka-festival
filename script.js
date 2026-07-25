const playerIdInput = document.getElementById("playerId");
const loginBtn = document.getElementById("loginBtn");
const loginForm = document.getElementById("loginForm");
const statusBadge = document.getElementById("statusBadge");
const errorMessage = document.getElementById("errorMessage");
const buttonText = loginBtn.querySelector(".btn-text");

function validatePlayerId(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
}

function updateButtonStatus() {
  const id = playerIdInput.value.trim();

  loginBtn.disabled = !validatePlayerId(id);

  if (id.length === 0) {
    errorMessage.textContent = "";
    return;
  }

  if (!validatePlayerId(id)) {
    errorMessage.textContent =
      "Gunakan minimal 3 karakter: huruf, angka, atau underscore.";
  } else {
    errorMessage.textContent = "";
  }
}

playerIdInput.addEventListener("input", () => {
  playerIdInput.value = playerIdInput.value
    .replace(/\s+/g, "")
    .slice(0, 20);

  updateButtonStatus();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const playerId = playerIdInput.value.trim();

  if (!validatePlayerId(playerId)) {
    errorMessage.textContent = "ID pemain tidak valid.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.classList.add("loading");

  buttonText.textContent = "MEMUAT";

  statusBadge.classList.add("logged");

  statusBadge.innerHTML = `
    <span>ID PEMAIN</span>
    <strong>${escapeHtml(playerId)}</strong>
  `;

  setTimeout(() => {
    window.location.href =
      `game.html?id=${encodeURIComponent(playerId)}`;
  }, 1000);
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

updateButtonStatus();
