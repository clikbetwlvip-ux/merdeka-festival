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
/* =========================
   ELEMEN PERMAINAN
========================= */

const climbButton = document.getElementById("climbButton");
const resetButton = document.getElementById("resetButton");

const character = document.getElementById("character");

const levelText = document.getElementById("levelText");
const chanceText = document.getElementById("chanceText");

const historyList = document.getElementById("historyList");

/* =========================
   DATA PERMAINAN
========================= */

let currentLevel = 0;
let chancesLeft = 5;

const rewards = [
    "BONUS 5.000",
    "BONUS 10.000",
    "BONUS 20.000",
    "BONUS 50.000",
    "BONUS 100.000"
];

/* =========================
   UPDATE TAMPILAN
========================= */

function updateGameDisplay() {
    levelText.textContent = currentLevel;
    chanceText.textContent = chancesLeft;

    const climbPositions = [
        "12px",
        "85px",
        "155px",
        "225px",
        "295px",
        "365px"
    ];

    character.style.bottom =
        climbPositions[currentLevel] || climbPositions[0];

    if (chancesLeft <= 0 || currentLevel >= 5) {
        climbButton.disabled = true;
    } else {
        climbButton.disabled = false;
    }
}

/* =========================
   TOMBOL PANJAT
========================= */

climbButton.addEventListener("click", function () {
    if (chancesLeft <= 0 || currentLevel >= 5) {
        return;
    }

    climbButton.disabled = true;

    chancesLeft--;

    const successChance = Math.random();
    const climbSuccess = successChance >= 0.25;

    setTimeout(function () {
        if (climbSuccess) {
            currentLevel++;

            const rewardName = rewards[currentLevel - 1];

            addRewardHistory(rewardName);

            if (currentLevel >= 5) {
                showResultModal(
                    "SELAMAT!",
                    "Kamu berhasil mencapai puncak dan mendapatkan hadiah utama!",
                    rewardName
                );
            } else {
                showResultModal(
                    "BERHASIL NAIK!",
                    "Kamu berhasil naik ke level " + currentLevel + ".",
                    rewardName
                );
            }
        } else {
            showResultModal(
                "BELUM BERHASIL",
                "Karakter terpeleset. Silakan coba naik lagi.",
                "COBA LAGI"
            );
        }

        updateGameDisplay();
    }, 450);
});

/* =========================
   RIWAYAT HADIAH
========================= */

function addRewardHistory(rewardName) {
    const emptyText = historyList.querySelector(".history-empty");

    if (emptyText) {
        emptyText.remove();
    }

    const historyItem = document.createElement("div");

    historyItem.className = "history-item";
    historyItem.textContent =
        "Level " + currentLevel + " — " + rewardName;

    historyList.appendChild(historyItem);
}

/* =========================
   RESET GAME
========================= */

resetButton.addEventListener("click", function () {
    const resetConfirm = confirm(
        "Yakin ingin mengulang permainan dari awal?"
    );

    if (!resetConfirm) {
        return;
    }

    currentLevel = 0;
    chancesLeft = 5;

    historyList.innerHTML =
        '<p class="history-empty">Belum ada hadiah yang didapat.</p>';

    updateGameDisplay();
});

updateGameDisplay();

/* =========================
   ELEMEN MODAL
========================= */

const resultModal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalReward = document.getElementById("modalReward");

const modalClose = document.getElementById("modalClose");
const continueButton = document.getElementById("continueButton");

const confettiContainer =
    document.getElementById("confettiContainer");

/* =========================
   TAMPILKAN MODAL
========================= */

function showResultModal(title, message, reward) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalReward.textContent = reward;

    resultModal.classList.remove("hidden");

    if (
        title === "SELAMAT!" ||
        title === "BERHASIL NAIK!"
    ) {
        createConfetti();
    }
}

/* =========================
   TUTUP MODAL
========================= */

function closeResultModal() {
    resultModal.classList.add("hidden");

    confettiContainer.innerHTML = "";

    updateGameDisplay();
}

modalClose.addEventListener("click", closeResultModal);
continueButton.addEventListener("click", closeResultModal);

resultModal.addEventListener("click", function (event) {
    if (event.target === resultModal) {
        closeResultModal();
    }
});

/* =========================
   CONFETTI
========================= */

function createConfetti() {
    confettiContainer.innerHTML = "";

    const confettiColors = [
        "#ffd52d",
        "#ff8c2a",
        "#ffffff",
        "#ef4444",
        "#22c55e",
        "#3b82f6",
        "#a855f7"
    ];

    for (let i = 0; i < 70; i++) {
        const confettiPiece =
            document.createElement("span");

        confettiPiece.className = "confetti-piece";

        confettiPiece.style.left =
            Math.random() * 100 + "%";

        confettiPiece.style.backgroundColor =
            confettiColors[
                Math.floor(
                    Math.random() *
                    confettiColors.length
                )
            ];

        confettiPiece.style.animationDelay =
            Math.random() * 0.7 + "s";

        confettiPiece.style.animationDuration =
            1.4 + Math.random() * 1.3 + "s";

        confettiPiece.style.transform =
            "rotate(" +
            Math.random() * 360 +
            "deg)";

        confettiContainer.appendChild(confettiPiece);
    }

    setTimeout(function () {
        confettiContainer.innerHTML = "";
    }, 3000);
}

/* =========================
   TOMBOL ESC
========================= */

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        !resultModal.classList.contains("hidden")
    ) {
        closeResultModal();
    }
});
