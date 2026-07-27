"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loadingScreen =
        document.getElementById("loading-screen");

    const introScreen =
        document.getElementById("intro-screen");

    const lobbyScreen =
        document.getElementById("lobby-screen");

    const loadingProgress =
        document.getElementById("loading-progress");

    const loadingPercent =
        document.getElementById("loading-percent");

    const loadingMessage =
        document.getElementById("loading-message");

    const enterButton =
        document.getElementById("enter-button");

    const soundButton =
        document.getElementById("sound-button");

    const logoutButton =
        document.getElementById("logout-button");

    const previewButton =
        document.getElementById("preview-button");

    const memberName =
        document.getElementById("member-name");

    const notification =
        document.getElementById("notification");

    const notificationText =
        document.getElementById("notification-text");

    let soundEnabled =
        APP_DATA.settings.soundEnabled;

    let notificationTimeout = null;


    function showScreen(targetScreen) {
        const screens =
            document.querySelectorAll(".screen");

        screens.forEach((screen) => {
            screen.classList.remove("active");
        });

        targetScreen.classList.add("active");
    }


    function showNotification(message) {
        notificationText.textContent = message;

        notification.classList.add("show");

        clearTimeout(notificationTimeout);

        notificationTimeout = setTimeout(() => {
            notification.classList.remove("show");
        }, 2400);
    }


    function createLoadingParticles() {
        const container =
            document.getElementById("loading-particles");

        for (let index = 0; index < 35; index += 1) {
            const particle =
                document.createElement("span");

            particle.className = "particle";

            const size =
                Math.random() * 4 + 2;

            particle.style.width =
                `${size}px`;

            particle.style.height =
                `${size}px`;

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.animationDuration =
                `${Math.random() * 5 + 4}s`;

            particle.style.animationDelay =
                `${Math.random() * 5}s`;

            particle.style.opacity =
                `${Math.random() * 0.8 + 0.2}`;

            container.appendChild(particle);
        }
    }


    function createStars() {
        const container =
            document.getElementById("stars");

        for (let index = 0; index < 45; index += 1) {
            const star =
                document.createElement("span");

            star.className = "star";

            const size =
                Math.random() * 3 + 1;

            star.style.width =
                `${size}px`;

            star.style.height =
                `${size}px`;

            star.style.left =
                `${Math.random() * 100}%`;

            star.style.top =
                `${Math.random() * 100}%`;

            star.style.animationDuration =
                `${Math.random() * 2.5 + 1.5}s`;

            star.style.animationDelay =
                `${Math.random() * 3}s`;

            container.appendChild(star);
        }
    }


    function updateLoadingMessage(progress) {
        const totalMessages =
            APP_DATA.loadingMessages.length;

        const messageIndex =
            Math.min(
                totalMessages - 1,
                Math.floor(
                    progress /
                    (100 / totalMessages)
                )
            );

        loadingMessage.textContent =
            APP_DATA.loadingMessages[messageIndex];
    }


    function startLoading() {
        let progress = 0;

        const intervalSpeed = 70;

        const loadingInterval =
            setInterval(() => {
                const increase =
                    Math.floor(Math.random() * 7) + 2;

                progress += increase;

                if (progress >= 100) {
                    progress = 100;
                }

                loadingProgress.style.width =
                    `${progress}%`;

                loadingPercent.textContent =
                    `${progress}%`;

                updateLoadingMessage(progress);

                if (progress === 100) {
                    clearInterval(loadingInterval);

                    setTimeout(() => {
                        showScreen(introScreen);
                    }, 650);
                }
            }, intervalSpeed);
    }


    function updateSoundButton() {
        if (soundEnabled) {
            soundButton.textContent =
                "🔊 Suara Aktif";
        } else {
            soundButton.textContent =
                "🔇 Suara Nonaktif";
        }
    }


    function enterLobby() {
        memberName.textContent =
            APP_DATA.member.username;

        showScreen(lobbyScreen);

        showNotification(
            "Selamat datang di Anime Fantasy Festival!"
        );
    }


    enterButton.addEventListener("click", () => {
        enterLobby();
    });


    soundButton.addEventListener("click", () => {
        soundEnabled = !soundEnabled;

        updateSoundButton();

        showNotification(
            soundEnabled
                ? "Suara diaktifkan."
                : "Suara dinonaktifkan."
        );
    });


    logoutButton.addEventListener("click", () => {
        showScreen(introScreen);

        showNotification(
            "Kembali ke halaman utama."
        );
    });


    previewButton.addEventListener("click", () => {
        showNotification(
            "Lobby lengkap akan dibuat pada tahap berikutnya."
        );
    });


    createLoadingParticles();
    createStars();
    updateSoundButton();
    startLoading();
});
const playNowButton =
    document.getElementById("play-now-button");

const menuCards =
    document.querySelectorAll(".menu-card");

playNowButton.addEventListener("click", () => {
    showNotification(
        "Menu mini-game akan dibuka pada tahap berikutnya."
    );
});

menuCards.forEach((card) => {
    card.addEventListener("click", () => {
        const menuName =
            card.querySelector("h3").textContent;

        showNotification(
            `${menuName} sedang dipersiapkan.`
        );
    });
});
