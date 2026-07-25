/* =========================
   AMBIL ELEMEN HTML
========================= */

const loginSection = document.getElementById("loginSection");
const gameSection = document.getElementById("gameSection");

const loginForm = document.getElementById("loginForm");
const memberInput = document.getElementById("memberId");
const loginButton = document.getElementById("loginButton");

const playerStatus = document.getElementById("playerStatus");
const playerIdText = document.getElementById("playerIdText");

/* =========================
   STATUS AWAL
========================= */

let currentPlayerId = "";

memberInput.addEventListener("input", function () {
    const memberId = memberInput.value.trim();

    loginButton.disabled = memberId.length < 3;
});

/* =========================
   PROSES LOGIN
========================= */

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const memberId = memberInput.value.trim();

    if (memberId.length < 3) {
        alert("ID member minimal 3 karakter.");
        memberInput.focus();
        return;
    }

    currentPlayerId = memberId;

    playerIdText.textContent = currentPlayerId;

    loginSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    playerStatus.classList.remove("hidden");

    localStorage.setItem("panjatPinangPlayerId", currentPlayerId);
});

/* =========================
   CEK LOGIN TERSIMPAN
========================= */

function checkSavedPlayer() {
    const savedPlayerId = localStorage.getItem("panjatPinangPlayerId");

    if (!savedPlayerId) {
        return;
    }

    currentPlayerId = savedPlayerId;

    memberInput.value = savedPlayerId;
    playerIdText.textContent = savedPlayerId;

    loginSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    playerStatus.classList.remove("hidden");
}

checkSavedPlayer();
