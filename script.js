/* =========================================================
   JAVASCRIPT PART 1
   NAVIGASI, LOGIN, LOBBY, TIKET & LOCALSTORAGE
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI
    ===================================================== */

    const CONFIG = {
        storageKey: "clickbet88FestivalData",
        maximumDailyTickets: 8,
        lossPerTicket: 50000,
        openingDuration: 2600,
        notificationDuration: 2800,

        screenSelectors: {
            opening: [
                "#openingScreen",
                "#opening-screen",
                ".opening-screen"
            ],

            login: [
                "#loginScreen",
                "#login-screen",
                ".login-screen"
            ],

            lobby: [
                "#lobbyScreen",
                "#lobby-screen",
                ".lobby-screen"
            ],

            panjat: [
                "#panjatPinangScreen",
                "#panjat-pinang-screen",
                ".panjat-pinang-screen"
            ],

            kerupuk: [
                "#makanKerupukScreen",
                "#makan-kerupuk-screen",
                ".makan-kerupuk-screen"
            ],

            kelereng: [
                "#lombaKelerengScreen",
                "#lomba-kelereng-screen",
                ".lomba-kelereng-screen"
            ],

            mystery: [
                "#mysteryBoxScreen",
                "#mystery-box-screen",
                ".mystery-box-screen"
            ]
        }
    };


    /* =====================================================
       STATE DEFAULT
    ===================================================== */

    const createDefaultState = () => ({
        version: 1,

        user: {
            loggedIn: false,
            username: "",
            displayName: "",
            avatar: "",
            loginAt: null
        },

        tickets: {
            current: 0,
            earnedToday: 0,
            lossToday: 0,
            date: getTodayKey()
        },

        games: {
            panjat: {
                played: 0,
                wins: 0,
                losses: 0,
                bestScore: 0
            },

            kerupuk: {
                played: 0,
                wins: 0,
                losses: 0,
                bestScore: 0
            },

            kelereng: {
                played: 0,
                wins: 0,
                losses: 0,
                bestScore: 0
            }
        },

        prizes: {
            totalWon: 0,
            lastPrize: 0,
            history: []
        },

        settings: {
            sound: true,
            performanceLow: false
        },

        activeScreen: "opening",
        updatedAt: Date.now()
    });


    /* =====================================================
       UTILITAS DASAR
    ===================================================== */

    function queryAny(selectors, parent = document) {
        if (!selectors) return null;

        const selectorList = Array.isArray(selectors)
            ? selectors
            : [selectors];

        for (const selector of selectorList) {
            const element = parent.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }


    function queryAll(selectors, parent = document) {
        if (!selectors) return [];

        const selectorList = Array.isArray(selectors)
            ? selectors
            : [selectors];

        const result = new Set();

        selectorList.forEach((selector) => {
            parent.querySelectorAll(selector).forEach((element) => {
                result.add(element);
            });
        });

        return [...result];
    }


    function clamp(value, minimum, maximum) {
        return Math.min(
            Math.max(Number(value) || 0, minimum),
            maximum
        );
    }


    function getTodayKey() {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function formatNumber(value) {
        return new Intl.NumberFormat("id-ID").format(
            Number(value) || 0
        );
    }


    function formatRupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }


    function safeJSONParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }


    function deepMerge(target, source) {
        if (!source || typeof source !== "object") {
            return target;
        }

        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (
                sourceValue &&
                typeof sourceValue === "object" &&
                !Array.isArray(sourceValue)
            ) {
                target[key] = deepMerge(
                    targetValue &&
                    typeof targetValue === "object"
                        ? targetValue
                        : {},
                    sourceValue
                );
            } else {
                target[key] = sourceValue;
            }
        });

        return target;
    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadState() {
        const defaultState = createDefaultState();

        const savedState = safeJSONParse(
            localStorage.getItem(CONFIG.storageKey),
            null
        );

        if (!savedState) {
            return defaultState;
        }

        return deepMerge(defaultState, savedState);
    }


    let state = loadState();


    function saveState() {
        state.updatedAt = Date.now();

        localStorage.setItem(
            CONFIG.storageKey,
            JSON.stringify(state)
        );
    }


    function resetState() {
        state = createDefaultState();
        saveState();
        resetDailyTickets();
        renderAll();
    }


    /* =====================================================
       RESET TIKET HARIAN
    ===================================================== */

    function resetDailyTickets() {
        const today = getTodayKey();

        if (state.tickets.date === today) {
            return false;
        }

        state.tickets.current = 0;
        state.tickets.earnedToday = 0;
        state.tickets.lossToday = 0;
        state.tickets.date = today;

        saveState();
        return true;
    }


    /* =====================================================
       SISTEM SCREEN
    ===================================================== */

    function getAllScreens() {
        const screens = new Set();

        Object.values(CONFIG.screenSelectors).forEach((selectors) => {
            queryAll(selectors).forEach((screen) => {
                screens.add(screen);
            });
        });

        queryAll([
            "[data-screen]",
            ".game-screen",
            ".app-screen",
            ".screen"
        ]).forEach((screen) => {
            screens.add(screen);
        });

        return [...screens];
    }


    function getScreenElement(screenName) {
        const configuredScreen = CONFIG.screenSelectors[screenName];

        if (configuredScreen) {
            const element = queryAny(configuredScreen);

            if (element) {
                return element;
            }
        }

        return queryAny([
            `[data-screen="${screenName}"]`,
            `#${screenName}Screen`,
            `#${screenName}-screen`,
            `.${screenName}-screen`
        ]);
    }


    function hideScreen(element) {
        if (!element) return;

        element.classList.remove(
            "active",
            "show",
            "screen-active"
        );

        element.classList.add("screen-hidden");
        element.setAttribute("aria-hidden", "true");

        element.hidden = true;
    }


    function showScreenElement(element) {
        if (!element) return;

        element.hidden = false;
        element.setAttribute("aria-hidden", "false");

        element.classList.remove("screen-hidden");

        requestAnimationFrame(() => {
            element.classList.add(
                "active",
                "show",
                "screen-active"
            );
        });
    }


    function showScreen(screenName, options = {}) {
        const {
            save = true,
            scrollTop = true
        } = options;

        const targetScreen = getScreenElement(screenName);

        if (!targetScreen) {
            console.warn(
                `[CLICKBET88] Screen "${screenName}" tidak ditemukan.`
            );

            return false;
        }

        getAllScreens().forEach((screen) => {
            if (screen !== targetScreen) {
                hideScreen(screen);
            }
        });

        showScreenElement(targetScreen);

        state.activeScreen = screenName;

        if (save) {
            saveState();
        }

        if (scrollTop) {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

        document.body.dataset.activeScreen = screenName;

        document.dispatchEvent(
            new CustomEvent("clickbet:screenchange", {
                detail: {
                    screen: screenName,
                    element: targetScreen
                }
            })
        );

        return true;
    }


    /* =====================================================
       NOTIFIKASI
    ===================================================== */

    let notificationTimer = null;


    function getNotificationElement() {
        let notification = queryAny([
            "#appNotification",
            "#gameNotification",
            ".app-notification",
            ".game-notification"
        ]);

        if (notification) {
            return notification;
        }

        notification = document.createElement("div");

        notification.id = "appNotification";
        notification.className = "app-notification";
        notification.setAttribute("role", "status");
        notification.setAttribute("aria-live", "polite");

        document.body.appendChild(notification);

        return notification;
    }


    function notify(message, type = "info") {
        const notification = getNotificationElement();

        clearTimeout(notificationTimer);

        notification.className =
            `app-notification ${type} show`;

        notification.textContent = message;

        notificationTimer = window.setTimeout(() => {
            notification.classList.remove("show");
        }, CONFIG.notificationDuration);
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    function normalizeUsername(username) {
        return String(username || "")
            .trim()
            .replace(/\s+/g, " ");
    }


    function login(username) {
        const cleanUsername = normalizeUsername(username);

        if (cleanUsername.length < 3) {
            notify(
                "Username minimal terdiri dari 3 karakter.",
                "error"
            );

            return false;
        }

        state.user.loggedIn = true;
        state.user.username = cleanUsername;
        state.user.displayName = cleanUsername;
        state.user.loginAt = Date.now();

        saveState();
        renderAll();
        showScreen("lobby");

        notify(
            `Selamat datang, ${cleanUsername}!`,
            "success"
        );

        return true;
    }


    function logout() {
        state.user.loggedIn = false;
        state.user.username = "";
        state.user.displayName = "";
        state.user.loginAt = null;
        state.activeScreen = "login";

        saveState();
        renderAll();
        showScreen("login");

        notify(
            "Kamu telah keluar dari akun.",
            "info"
        );
    }


    function handleLoginSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;

        const usernameInput = queryAny([
            '[name="username"]',
            "#username",
            "#loginUsername",
            ".login-username"
        ], form);

        login(usernameInput?.value);
    }


    function bindLoginEvents() {
        queryAll([
            "#loginForm",
            ".login-form",
            "[data-login-form]"
        ]).forEach((form) => {
            form.addEventListener(
                "submit",
                handleLoginSubmit
            );
        });

        queryAll([
            "[data-action='login']",
            "#loginButton",
            ".login-button"
        ]).forEach((button) => {
            button.addEventListener("click", () => {
                const form = button.closest("form");

                if (form) {
                    form.requestSubmit();
                    return;
                }

                const usernameInput = queryAny([
                    "#username",
                    "#loginUsername",
                    ".login-username",
                    '[name="username"]'
                ]);

                login(usernameInput?.value);
            });
        });

        queryAll([
            "[data-action='logout']",
            "#logoutButton",
            ".logout-button"
        ]).forEach((button) => {
            button.addEventListener("click", logout);
        });
    }


    /* =====================================================
       TIKET
    ===================================================== */

    function getTicketStatus() {
        resetDailyTickets();

        const current = clamp(
            state.tickets.current,
            0,
            CONFIG.maximumDailyTickets
        );

        const earnedToday = clamp(
            state.tickets.earnedToday,
            0,
            CONFIG.maximumDailyTickets
        );

        return {
            current,
            earnedToday,
            maximum: CONFIG.maximumDailyTickets,
            remaining: Math.max(
                CONFIG.maximumDailyTickets - earnedToday,
                0
            )
        };
    }


    function addTicket(amount = 1, reason = "") {
        resetDailyTickets();

        const ticketAmount = Math.max(
            0,
            Math.floor(Number(amount) || 0)
        );

        if (!ticketAmount) {
            return 0;
        }

        const remainingTicketCapacity = Math.max(
            CONFIG.maximumDailyTickets -
            state.tickets.earnedToday,
            0
        );

        const acceptedAmount = Math.min(
            ticketAmount,
            remainingTicketCapacity
        );

        if (acceptedAmount <= 0) {
            notify(
                `Batas ${CONFIG.maximumDailyTickets} tiket harian sudah tercapai.`,
                "warning"
            );

            return 0;
        }

        state.tickets.current += acceptedAmount;
        state.tickets.earnedToday += acceptedAmount;

        saveState();
        renderTicketUI();

        document.dispatchEvent(
            new CustomEvent("clickbet:ticketadded", {
                detail: {
                    amount: acceptedAmount,
                    reason,
                    tickets: getTicketStatus()
                }
            })
        );

        notify(
            `Kamu mendapatkan ${acceptedAmount} tiket.`,
            "success"
        );

        return acceptedAmount;
    }


    function useTicket(amount = 1) {
        resetDailyTickets();

        const ticketAmount = Math.max(
            1,
            Math.floor(Number(amount) || 1)
        );

        if (state.tickets.current < ticketAmount) {
            notify(
                "Tiket kamu belum mencukupi.",
                "error"
            );

            return false;
        }

        state.tickets.current -= ticketAmount;

        saveState();
        renderTicketUI();

        document.dispatchEvent(
            new CustomEvent("clickbet:ticketused", {
                detail: {
                    amount: ticketAmount,
                    tickets: getTicketStatus()
                }
            })
        );

        return true;
    }


    function registerLoss(lossAmount) {
        resetDailyTickets();

        const cleanLoss = Math.max(
            0,
            Number(lossAmount) || 0
        );

        if (!cleanLoss) {
            return 0;
        }

        const previousTicketTotal = Math.floor(
            state.tickets.lossToday /
            CONFIG.lossPerTicket
        );

        state.tickets.lossToday += cleanLoss;

        const newTicketTotal = Math.floor(
            state.tickets.lossToday /
            CONFIG.lossPerTicket
        );

        const earnedTicket = Math.max(
            newTicketTotal - previousTicketTotal,
            0
        );

        saveState();

        if (earnedTicket > 0) {
            return addTicket(
                earnedTicket,
                "loss"
            );
        }

        renderTicketUI();
        return 0;
    }


    /* =====================================================
       GAME NAVIGATION
    ===================================================== */

    const GAME_SCREEN_MAP = {
        panjat: "panjat",
        "panjat-pinang": "panjat",
        panjatpinang: "panjat",

        kerupuk: "kerupuk",
        "makan-kerupuk": "kerupuk",
        makankerupuk: "kerupuk",

        kelereng: "kelereng",
        "lomba-kelereng": "kelereng",
        lombakelereng: "kelereng",

        mystery: "mystery",
        "mystery-box": "mystery",
        mysterybox: "mystery"
    };


    function normalizeGameName(gameName) {
        return String(gameName || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
    }


    function openGame(gameName) {
        if (!state.user.loggedIn) {
            notify(
                "Silakan login terlebih dahulu.",
                "warning"
            );

            showScreen("login");
            return false;
        }

        const normalizedName = normalizeGameName(gameName);
        const screenName = GAME_SCREEN_MAP[normalizedName];

        if (!screenName) {
            notify(
                "Game belum tersedia.",
                "error"
            );

            return false;
        }

        if (screenName === "mystery") {
            return openMysteryBox();
        }

        return showScreen(screenName);
    }


    function openMysteryBox() {
        const ticketStatus = getTicketStatus();

        if (ticketStatus.current <= 0) {
            notify(
                "Kamu membutuhkan minimal 1 tiket untuk membuka Mystery Box.",
                "warning"
            );

            return false;
        }

        return showScreen("mystery");
    }


    function backToLobby() {
        showScreen("lobby");
    }


    function bindNavigationEvents() {
        document.addEventListener("click", (event) => {
            const navigationButton = event.target.closest(
                "[data-screen-target]"
            );

            if (navigationButton) {
                event.preventDefault();

                const target =
                    navigationButton.dataset.screenTarget;

                showScreen(target);
                return;
            }

            const gameButton = event.target.closest(
                "[data-game]"
            );

            if (gameButton) {
                event.preventDefault();

                openGame(gameButton.dataset.game);
                return;
            }

            const actionButton = event.target.closest(
                "[data-action]"
            );

            if (!actionButton) return;

            const action = actionButton.dataset.action;

            switch (action) {
                case "back-lobby":
                case "go-lobby":
                    event.preventDefault();
                    backToLobby();
                    break;

                case "open-mystery":
                    event.preventDefault();
                    openMysteryBox();
                    break;

                case "logout":
                    event.preventDefault();
                    logout();
                    break;

                case "reset-data":
                    event.preventDefault();

                    const confirmed = window.confirm(
                        "Yakin ingin menghapus seluruh progres game?"
                    );

                    if (confirmed) {
                        resetState();
                        showScreen("login");

                        notify(
                            "Data permainan berhasil direset.",
                            "success"
                        );
                    }

                    break;
            }
        });
    }


    /* =====================================================
       RENDER USER
    ===================================================== */

    function renderUserUI() {
        const displayName =
            state.user.displayName ||
            state.user.username ||
            "Pemain";

        queryAll([
            "[data-user-name]",
            "#playerName",
            "#profileName",
            ".player-name",
            ".profile-name"
        ]).forEach((element) => {
            element.textContent = displayName;
        });

        queryAll([
            "[data-login-state]"
        ]).forEach((element) => {
            element.dataset.loginState =
                state.user.loggedIn
                    ? "logged-in"
                    : "logged-out";
        });

        document.body.classList.toggle(
            "user-logged-in",
            state.user.loggedIn
        );

        document.body.classList.toggle(
            "user-logged-out",
            !state.user.loggedIn
        );
    }


    /* =====================================================
       RENDER TIKET
    ===================================================== */

    function renderTicketUI() {
        const ticketStatus = getTicketStatus();

        queryAll([
            "[data-ticket-count]",
            "#ticketCount",
            "#totalTicket",
            ".ticket-count",
            ".total-ticket"
        ]).forEach((element) => {
            element.textContent = ticketStatus.current;
        });

        queryAll([
            "[data-ticket-earned]",
            "#ticketEarnedToday",
            ".ticket-earned-today"
        ]).forEach((element) => {
            element.textContent =
                ticketStatus.earnedToday;
        });

        queryAll([
            "[data-ticket-remaining]",
            "#ticketRemaining",
            ".ticket-remaining"
        ]).forEach((element) => {
            element.textContent =
                ticketStatus.remaining;
        });

        queryAll([
            "[data-ticket-maximum]",
            ".ticket-maximum"
        ]).forEach((element) => {
            element.textContent =
                ticketStatus.maximum;
        });

        queryAll([
            "[data-loss-today]",
            "#lossToday",
            ".loss-today"
        ]).forEach((element) => {
            element.textContent = formatRupiah(
                state.tickets.lossToday
            );
        });

        queryAll([
            "[data-ticket-progress]",
            ".ticket-progress-fill"
        ]).forEach((element) => {
            const progress =
                ticketStatus.earnedToday /
                ticketStatus.maximum *
                100;

            element.style.width =
                `${clamp(progress, 0, 100)}%`;

            element.style.setProperty(
                "--ticket-progress",
                `${clamp(progress, 0, 100)}%`
            );
        });

        queryAll([
            "[data-requires-ticket]",
            ".requires-ticket"
        ]).forEach((element) => {
            const disabled =
                ticketStatus.current <= 0;

            element.classList.toggle(
                "disabled",
                disabled
            );

            element.setAttribute(
                "aria-disabled",
                String(disabled)
            );

            if (
                element instanceof HTMLButtonElement
            ) {
                element.disabled = disabled;
            }
        });
    }


    /* =====================================================
       RENDER STATISTIK
    ===================================================== */

    function renderStatisticsUI() {
        const totalPlayed =
            state.games.panjat.played +
            state.games.kerupuk.played +
            state.games.kelereng.played;

        const totalWins =
            state.games.panjat.wins +
            state.games.kerupuk.wins +
            state.games.kelereng.wins;

        const totalLosses =
            state.games.panjat.losses +
            state.games.kerupuk.losses +
            state.games.kelereng.losses;

        const values = {
            "total-played": totalPlayed,
            "total-wins": totalWins,
            "total-losses": totalLosses,
            "total-prize": formatRupiah(
                state.prizes.totalWon
            ),
            "last-prize": formatRupiah(
                state.prizes.lastPrize
            )
        };

        Object.entries(values).forEach(
            ([key, value]) => {
                queryAll(
                    `[data-stat="${key}"]`
                ).forEach((element) => {
                    element.textContent = value;
                });
            }
        );
    }


    function renderAll() {
        renderUserUI();
        renderTicketUI();
        renderStatisticsUI();

        document.body.classList.toggle(
            "performance-low",
            state.settings.performanceLow
        );
    }


    /* =====================================================
       REGISTER HASIL GAME
    ===================================================== */

    function registerGameResult(
        gameName,
        result,
        score = 0,
        lossAmount = 0
    ) {
        const normalizedName =
            GAME_SCREEN_MAP[
                normalizeGameName(gameName)
            ] || normalizeGameName(gameName);

        const game = state.games[normalizedName];

        if (!game) {
            console.warn(
                `[CLICKBET88] Game "${gameName}" tidak dikenal.`
            );

            return false;
        }

        game.played += 1;
        game.bestScore = Math.max(
            game.bestScore,
            Number(score) || 0
        );

        if (result === "win") {
            game.wins += 1;
        } else {
            game.losses += 1;

            if (lossAmount > 0) {
                registerLoss(lossAmount);
            }
        }

        saveState();
        renderAll();

        document.dispatchEvent(
            new CustomEvent("clickbet:gameresult", {
                detail: {
                    game: normalizedName,
                    result,
                    score,
                    lossAmount
                }
            })
        );

        return true;
    }


    /* =====================================================
       OPENING SCREEN
    ===================================================== */

    function startOpeningSequence() {
        const openingScreen =
            getScreenElement("opening");

        if (!openingScreen) {
            startApplication();
            return;
        }

        showScreen("opening", {
            save: false,
            scrollTop: false
        });

        window.setTimeout(() => {
            startApplication();
        }, CONFIG.openingDuration);
    }


    function startApplication() {
        resetDailyTickets();
        renderAll();

        if (!state.user.loggedIn) {
            showScreen("login");
            return;
        }

        const safeScreens = [
            "lobby",
            "panjat",
            "kerupuk",
            "kelereng",
            "mystery"
        ];

        const destination =
            safeScreens.includes(state.activeScreen)
                ? state.activeScreen
                : "lobby";

        showScreen(destination);
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ClickbetGame = {
        getState() {
            return structuredClone
                ? structuredClone(state)
                : JSON.parse(JSON.stringify(state));
        },

        save: saveState,
        reset: resetState,

        showScreen,
        openGame,
        openMysteryBox,
        backToLobby,

        login,
        logout,

        addTicket,
        useTicket,
        registerLoss,
        getTicketStatus,

        registerGameResult,

        notify,
        formatNumber,
        formatRupiah,

        setPerformanceLow(enabled) {
            state.settings.performanceLow =
                Boolean(enabled);

            saveState();
            renderAll();
        },

        setSound(enabled) {
            state.settings.sound =
                Boolean(enabled);

            saveState();
        }
    };


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {
        resetDailyTickets();

        bindLoginEvents();
        bindNavigationEvents();
        renderAll();
        startOpeningSequence();

        console.info(
            "[CLICKBET88] JavaScript Part 1 aktif."
        );
    }


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
/* =========================================================
   JAVASCRIPT PART 2 — PENGGANTI PENUH
   PREMIUM PANJAT PINANG ENGINE 8.0
========================================================= */
(() => {
  "use strict";

  const C = {
    duration: 22, ticketCost: 1, countdown: 3,
    minBottom: 8, maxBottom: 78,
    maxStamina: 100, staminaCost: 7.5, staminaRecovery: 24,
    tiredAt: 22, baseClimb: 2.35, perfectClimb: 3.65,
    perfectMin: 105, perfectMax: 270, comboTimeout: 620,
    spamDelay: 80, slipMinDelay: 2400, slipMaxDelay: 4500,
    slipChance: .28, slipMin: 3, slipMax: 7, resultDelay: 850
  };

  const screen = document.getElementById("panjatPinangScreen");
  if (!screen) return console.warn("[CLICKBET88] Panjat Pinang tidak ditemukan.");

  const $ = id => document.getElementById(id);
  const E = {
    screen,
    stage: screen.querySelector(".pinang-stage"),
    player: $("pinangPlayer"),
    face: screen.querySelector(".player-face"),
    dust: $("pinangDustEffect"),
    timer: $("pinangTimerValue"),
    progressFill: $("pinangVerticalProgress"),
    progressMarker: $("pinangProgressMarker"),
    progressText: $("pinangProgressValue"),
    tapCount: $("pinangTapCount"),
    ready: $("pinangReadyMessage"),
    start: $("pinangStartButton"),
    tap: $("pinangTapButton"),
    back: $("pinangBackButton"),
    pause: $("pinangPauseButton"),
    sound: $("pinangSoundButton"),
    soundIcon: $("pinangSoundIcon"),
    countdownOverlay: $("pinangCountdownOverlay"),
    countdownValue: $("pinangCountdownValue"),
    countdownMessage: $("pinangCountdownMessage"),
    pauseOverlay: $("pinangPauseOverlay"),
    resume: $("pinangResumeButton"),
    quit: $("pinangQuitButton"),
    resultOverlay: $("pinangResultOverlay"),
    resultModal: $("pinangResultModal"),
    closeResult: $("closePinangResultButton"),
    winContent: $("pinangWinContent"),
    loseContent: $("pinangLoseContent"),
    resultTime: $("pinangResultRemainingTime"),
    resultTap: $("pinangResultTapCount"),
    loseTap: $("pinangLoseTapCount"),
    loseProgress: $("pinangLoseProgress"),
    loseTicket: $("pinangLoseTicket"),
    mystery: $("openPinangMysteryButton"),
    winLobby: $("pinangWinLobbyButton"),
    retry: $("retryPinangButton"),
    loseLobby: $("pinangLoseLobbyButton"),
    exitOverlay: $("pinangExitConfirmOverlay"),
    cancelExit: $("cancelPinangExitButton"),
    confirmExit: $("confirmPinangExitButton"),
    toast: $("pinangToast"),
    toastIcon: $("pinangToastIcon"),
    toastMessage: $("pinangToastMessage")
  };

  const S = {
    status: "idle", progress: 0, visual: 0, stamina: C.maxStamina,
    combo: 0, bestCombo: 0, taps: 0, score: 0, time: C.duration,
    lastTap: 0, lastFrame: 0, nextSlip: 0, side: "left",
    raf: 0, countdownTimer: 0, toastTimer: 0, feedbackTimer: 0,
    ticketUsed: false, finishing: false, sound: true
  };

  const clamp = (v, a, b) => Math.min(Math.max(Number(v) || 0, a), b);
  const rand = (a, b) => a + Math.random() * (b - a);
  const api = () => window.ClickbetGame || null;
  const tickets = () => Number(api()?.getTicketStatus?.().current) || 0;
  const playing = () => S.status === "playing";
  const busy = () => ["countdown", "playing", "paused"].includes(S.status);
  const timeText = v => `00:${String(Math.max(0, Math.ceil(v))).padStart(2, "0")}`;

  function showOverlay(el) {
    if (!el) return;
    el.hidden = false;
    el.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => el.classList.add("active", "show", "visible"));
  }

  function hideOverlay(el) {
    if (!el) return;
    el.classList.remove("active", "show", "visible");
    el.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (!el.classList.contains("active") && !el.classList.contains("show")) el.hidden = true;
    }, 300);
  }

  function toast(message, type = "info", duration = 2200) {
    clearTimeout(S.toastTimer);
    if (!E.toast || !E.toastMessage) return api()?.notify?.(message, type);
    const icons = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };
    if (E.toastIcon) E.toastIcon.textContent = icons[type] || icons.info;
    E.toastMessage.textContent = message;
    E.toast.className = `game-toast ${type} show`;
    S.toastTimer = setTimeout(() => E.toast?.classList.remove("show"), duration);
  }

  function injectUI() {
    if (!E.stage || $("pinangPremiumHud")) return;
    const hud = document.createElement("div");
    hud.id = "pinangPremiumHud";
    hud.className = "pinang-premium-hud";
    hud.innerHTML = `
      <div class="pinang-hud-card">
        <div class="pinang-hud-title"><span>⚡</span><strong>STAMINA</strong><b id="pinangStaminaText">100%</b></div>
        <div class="pinang-stamina-track"><div id="pinangStaminaFill" class="pinang-stamina-fill"></div></div>
      </div>
      <div id="pinangComboHud" class="pinang-combo-hud"><small>COMBO</small><strong id="pinangComboValue">x0</strong></div>
      <div id="pinangFeedback" class="pinang-feedback">SIAP!</div>`;
    E.stage.appendChild(hud);
    E.staminaFill = $("pinangStaminaFill");
    E.staminaText = $("pinangStaminaText");
    E.comboHud = $("pinangComboHud");
    E.comboValue = $("pinangComboValue");
    E.feedback = $("pinangFeedback");

    const oldTarget = screen.querySelector(".tap-status-card small");
    if (oldTarget) oldTarget.textContent = "Jaga ritme & stamina";
    [...screen.querySelectorAll(".mission-target-item")].forEach(item => {
      const strong = item.querySelector("strong");
      if (!strong) return;
      if (strong.textContent.includes("45 Tap")) strong.textContent = "Timing & Combo";
      if (strong.textContent.includes("15 Detik")) strong.textContent = `${C.duration} Detik`;
    });
  }

  function injectStyles() {
    if ($("pinangPremiumStyles")) return;
    const style = document.createElement("style");
    style.id = "pinangPremiumStyles";
    style.textContent = `
#panjatPinangScreen .pinang-stage{--camera-y:0px;transform:translateY(var(--camera-y));transition:transform .18s ease-out}
#panjatPinangScreen .pinang-premium-hud{position:absolute;inset:14px 14px auto;z-index:45;display:flex;justify-content:space-between;gap:12px;pointer-events:none}
#panjatPinangScreen .pinang-hud-card{width:min(250px,55%);padding:10px 12px;border:1px solid rgba(255,216,115,.65);border-radius:14px;background:linear-gradient(145deg,rgba(45,3,9,.92),rgba(5,1,2,.84));box-shadow:0 10px 30px rgba(0,0,0,.35),0 0 18px rgba(242,189,67,.18)}
#panjatPinangScreen .pinang-hud-title{display:flex;gap:7px;align-items:center;color:#ffe8a8;font-size:11px;letter-spacing:.08em}
#panjatPinangScreen .pinang-hud-title b{margin-left:auto;color:#fff}
#panjatPinangScreen .pinang-stamina-track{height:10px;margin-top:7px;overflow:hidden;border-radius:999px;background:rgba(0,0,0,.58)}
#panjatPinangScreen .pinang-stamina-fill{width:100%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ff3c48,#ffd85f,#54ed88);transition:width .12s linear;box-shadow:0 0 13px rgba(255,216,95,.5)}
#panjatPinangScreen .pinang-combo-hud{min-width:84px;padding:8px 12px;border:1px solid rgba(255,216,115,.65);border-radius:14px;background:rgba(42,2,8,.88);text-align:center;opacity:.45;transform:scale(.9);transition:.18s}
#panjatPinangScreen .pinang-combo-hud.active{opacity:1;transform:scale(1);box-shadow:0 0 22px rgba(255,194,61,.4)}
#panjatPinangScreen .pinang-combo-hud small{display:block;color:#ffd873;font-size:9px;font-weight:900;letter-spacing:.15em}
#panjatPinangScreen .pinang-combo-hud strong{display:block;color:#fff;font-size:24px;line-height:1}
#panjatPinangScreen .pinang-feedback{position:absolute;top:68px;left:50%;min-width:130px;padding:8px 16px;border-radius:999px;background:rgba(0,0,0,.58);color:#fff;font-size:14px;font-weight:1000;text-align:center;opacity:0;transform:translate(-50%,-8px) scale(.82);transition:.16s}
#panjatPinangScreen .pinang-feedback.show{opacity:1;transform:translate(-50%,0) scale(1)}
#panjatPinangScreen .pinang-feedback.perfect{color:#fff3a9}
#panjatPinangScreen .pinang-feedback.slip{color:#ff8c95}
#pinangPlayer{will-change:bottom,transform;transition:bottom .095s linear;transform-origin:50% 70%}
#pinangPlayer.climb-left{animation:cbClimbL .18s cubic-bezier(.2,.8,.2,1)}
#pinangPlayer.climb-right{animation:cbClimbR .18s cubic-bezier(.2,.8,.2,1)}
#pinangPlayer.tired{filter:saturate(.7) brightness(.86);animation:cbTired .65s ease-in-out infinite}
#pinangPlayer.slipping{animation:cbSlip .5s cubic-bezier(.36,.07,.19,.97)}
#pinangPlayer.winning{animation:cbCelebrate .55s ease-in-out infinite alternate}
#panjatPinangScreen.camera-shake .pinang-main-arena{animation:cbShake .36s ease}
#panjatPinangScreen .pinang-prize-platform{transform-origin:50% 0;animation:cbPrize 3s ease-in-out infinite}
@keyframes cbClimbL{45%{transform:rotate(-7deg) translate(-4px,-5px) scale(1.04)}}
@keyframes cbClimbR{45%{transform:rotate(7deg) translate(4px,-5px) scale(1.04)}}
@keyframes cbTired{50%{transform:translateY(3px) rotate(1deg)}}
@keyframes cbSlip{25%{transform:translateY(7px) rotate(9deg)}60%{transform:translateY(18px) rotate(-6deg)}}
@keyframes cbCelebrate{to{transform:translateY(-9px) rotate(4deg) scale(1.08)}}
@keyframes cbShake{20%{transform:translate(-5px,2px)}40%{transform:translate(5px,-2px)}60%{transform:translate(-3px,1px)}80%{transform:translate(3px,-1px)}}
@keyframes cbPrize{50%{transform:rotate(1.5deg)}}
@keyframes cbParticle{to{opacity:0;transform:translateY(75vh) rotate(720deg)}}
@media(max-width:700px){#panjatPinangScreen .pinang-premium-hud{inset:8px 8px auto}#panjatPinangScreen .pinang-hud-card{width:62%;padding:8px 9px}#panjatPinangScreen .pinang-combo-hud{min-width:68px;padding:7px 9px}}
`;
    document.head.appendChild(style);
  }

  function clearRuntime() {
    cancelAnimationFrame(S.raf);
    clearInterval(S.countdownTimer);
    clearTimeout(S.feedbackTimer);
    S.raf = S.countdownTimer = S.feedbackTimer = 0;
  }

  function setFace(face) { if (E.face) E.face.textContent = face; }

  function clearPlayerClasses() {
    E.player?.classList.remove("climb-left","climb-right","tired","slipping","winning","losing","paused");
  }

  function resetRound() {
    clearRuntime();
    Object.assign(S, {
      progress: 0, visual: 0, stamina: C.maxStamina, combo: 0,
      bestCombo: 0, taps: 0, score: 0, time: C.duration,
      lastTap: 0, lastFrame: 0, nextSlip: performance.now() + rand(C.slipMinDelay,C.slipMaxDelay),
      side: "left", finishing: false
    });
    clearPlayerClasses();
    setFace("😤");
    [E.countdownOverlay,E.pauseOverlay,E.resultOverlay,E.exitOverlay].forEach(hideOverlay);
    screen.classList.remove("game-playing","game-paused","game-finished","camera-shake");
    render();
  }

  function resetGame() {
    resetRound();
    S.status = "idle";
    S.ticketUsed = false;
    if (E.ready) E.ready.textContent = "Tekan mulai, lalu jaga ritme tap dan stamina!";
    render();
  }

  function render() {
    S.progress = clamp(S.progress,0,100);
    S.visual += (S.progress - S.visual) * .22;
    const p = clamp(S.visual,0,100);
    const stamina = clamp(S.stamina,0,C.maxStamina);

    if (E.timer) {
      E.timer.textContent = timeText(S.time);
      E.timer.classList.toggle("danger",S.time <= 5 && playing());
    }
    if (E.tapCount) E.tapCount.textContent = S.taps;
    if (E.progressText) E.progressText.textContent = `${Math.round(p)}%`;
    if (E.progressFill) E.progressFill.style.height = `${p}%`;
    if (E.progressMarker) E.progressMarker.style.bottom = `${p}%`;

    if (E.player) {
      E.player.style.bottom = `${C.minBottom + (C.maxBottom-C.minBottom)*(p/100)}%`;
      E.player.classList.toggle("tired",stamina <= C.tiredAt && playing());
    }

    if (E.staminaFill) E.staminaFill.style.width = `${stamina}%`;
    if (E.staminaText) E.staminaText.textContent = `${Math.round(stamina)}%`;
    if (E.comboValue) E.comboValue.textContent = `x${S.combo}`;
    E.comboHud?.classList.toggle("active",S.combo >= 2);

    if (E.tap) E.tap.disabled = !playing();
    if (E.start) {
      E.start.disabled = busy();
      const label = E.start.querySelector(".start-button-text");
      if (label) label.textContent = ({
        idle:"MULAI PERMAINAN",countdown:"BERSIAP...",playing:"PERMAINAN BERJALAN",
        paused:"PERMAINAN DIJEDA",finished:"MAIN LAGI"
      })[S.status] || "MULAI PERMAINAN";
    }

    screen.classList.toggle("game-playing",playing());
    screen.classList.toggle("game-paused",S.status === "paused");
    screen.classList.toggle("game-finished",S.status === "finished");

    if (E.stage) {
      const mobile = matchMedia("(max-width:700px)").matches;
      const shift = -Math.max(0,p-58)/42*(mobile?54:32);
      E.stage.style.setProperty("--camera-y",`${shift}px`);
    }
  }

  function feedback(text,type="") {
    if (!E.feedback) return;
    clearTimeout(S.feedbackTimer);
    E.feedback.textContent = text;
    E.feedback.className = `pinang-feedback ${type} show`;
    S.feedbackTimer = setTimeout(() => E.feedback?.classList.remove("show"),430);
  }

  function animateClimb() {
    if (!E.player) return;
    S.side = S.side === "left" ? "right" : "left";
    const cls = S.side === "left" ? "climb-left" : "climb-right";
    E.player.classList.remove("climb-left","climb-right");
    void E.player.offsetWidth;
    E.player.classList.add(cls);
    setTimeout(() => E.player?.classList.remove(cls),190);
  }

  function animateDust() {
    if (!E.dust) return;
    E.dust.classList.remove("active");
    void E.dust.offsetWidth;
    E.dust.classList.add("active");
    setTimeout(() => E.dust?.classList.remove("active"),250);
  }

  function shake() {
    screen.classList.remove("camera-shake");
    void screen.offsetWidth;
    screen.classList.add("camera-shake");
    setTimeout(() => screen.classList.remove("camera-shake"),420);
  }

  function registerTap() {
    if (!playing() || S.finishing) return;
    const now = performance.now();
    const delay = S.lastTap ? now-S.lastTap : 999;
    S.lastTap = now;
    S.taps++;

    const perfect = delay >= C.perfectMin && delay <= C.perfectMax;
    const spam = delay < C.spamDelay;

    if (spam) {
      S.combo = 0;
      S.stamina = clamp(S.stamina-C.staminaCost*1.25,0,C.maxStamina);
      S.progress += .55;
      feedback("TERLALU CEPAT!","slip");
    } else {
      S.combo++;
      S.bestCombo = Math.max(S.bestCombo,S.combo);
      const comboMultiplier = Math.min(1+S.combo*.09,1.75);
      const staminaMultiplier = S.stamina <= C.tiredAt ? .58 : 1;
      const amount = (perfect?C.perfectClimb:C.baseClimb)*comboMultiplier*staminaMultiplier;
      S.progress = clamp(S.progress+amount,0,100);
      S.stamina = clamp(S.stamina-C.staminaCost,0,C.maxStamina);
      S.score += Math.round(amount*100);
      feedback(perfect ? (S.combo>=5?`PERFECT • COMBO x${S.combo}`:"PERFECT!") : (S.combo>=4?`COMBO x${S.combo}`:"NAIK!"),perfect?"perfect":"");
    }

    animateClimb();
    animateDust();
    render();
    if (S.progress >= 100) finish(true);
  }

  function slip() {
    if (!playing() || S.finishing || S.progress < 12) return;
    const loss = rand(C.slipMin,C.slipMax);
    S.progress = clamp(S.progress-loss,0,100);
    S.combo = 0;
    E.player?.classList.remove("climb-left","climb-right","slipping");
    void E.player?.offsetWidth;
    E.player?.classList.add("slipping");
    setFace("😨");
    feedback(`LICIN! -${Math.round(loss)}%`,"slip");
    shake();
    setTimeout(() => {
      E.player?.classList.remove("slipping");
      if (playing()) setFace("😤");
    },520);
  }

  function loop(now) {
    if (!playing()) return;
    if (!S.lastFrame) S.lastFrame = now;
    const dt = Math.min((now-S.lastFrame)/1000,.05);
    S.lastFrame = now;
    S.time = Math.max(0,S.time-dt);

    const sinceTap = now-S.lastTap;
    if (sinceTap > 280) S.stamina = clamp(S.stamina+C.staminaRecovery*dt,0,C.maxStamina);
    if (sinceTap > C.comboTimeout) S.combo = 0;

    if (now >= S.nextSlip) {
      if (Math.random() <= C.slipChance) slip();
      S.nextSlip = now+rand(C.slipMinDelay,C.slipMaxDelay);
    }

    render();
    if (S.time <= 0) return finish(false);
    S.raf = requestAnimationFrame(loop);
  }

  function consumeTicket() {
    if (!api()?.useTicket) return toast("Sistem tiket belum tersedia.","error"),false;
    if (tickets() < C.ticketCost) {
      toast("Tiket belum mencukupi.","warning",2800);
      api()?.notify?.("Kamu membutuhkan 1 tiket untuk Panjat Pinang.","warning");
      return false;
    }
    if (!api().useTicket(C.ticketCost)) return false;
    S.ticketUsed = true;
    return true;
  }

  function startCountdown() {
    if (busy() || !consumeTicket()) return;
    resetRound();
    S.status = "countdown";
    let n = C.countdown;

    if (E.countdownValue) E.countdownValue.textContent = n;
    if (E.countdownMessage) E.countdownMessage.textContent = "Bersiap!";
    if (E.ready) E.ready.textContent = "Bersiap untuk memanjat!";
    showOverlay(E.countdownOverlay);
    render();

    S.countdownTimer = setInterval(() => {
      n--;
      if (n > 0) {
        if (E.countdownValue) E.countdownValue.textContent = n;
        if (E.countdownMessage) E.countdownMessage.textContent = n===1?"Siap!":"Bersiap!";
        return;
      }
      clearInterval(S.countdownTimer);
      if (E.countdownValue) E.countdownValue.textContent = "GO!";
      if (E.countdownMessage) E.countdownMessage.textContent = "Panjat!";
      setTimeout(() => {
        hideOverlay(E.countdownOverlay);
        S.status = "playing";
        S.lastFrame = performance.now();
        S.nextSlip = S.lastFrame+rand(C.slipMinDelay,C.slipMaxDelay);
        if (E.ready) E.ready.textContent = "Jaga ritme! Tap terlalu cepat menguras stamina.";
        render();
        S.raf = requestAnimationFrame(loop);
      },480);
    },820);
  }

  function registerResult(win) {
    api()?.registerGameResult?.("panjat",win?"win":"lose",Math.round(S.score),0);
    try { window.ClickbetFinal?.registerResult?.("panjat",win?"win":"lose",Math.round(S.score)); } catch {}
  }

  function particles(container,count,cls) {
    if (!container) return;
    container.querySelectorAll(`.${cls}`).forEach(x=>x.remove());
    const frag = document.createDocumentFragment();
    for (let i=0;i<count;i++) {
      const p = document.createElement("span");
      p.className = cls;
      p.style.cssText = `position:absolute;z-index:999;top:${Math.random()*25}%;left:${Math.random()*100}%;width:${5+Math.random()*7}px;height:${8+Math.random()*10}px;border-radius:2px;background:hsl(${Math.random()*360} 90% 58%);pointer-events:none;animation:cbParticle ${1.4+Math.random()*1.6}s ${Math.random()*.5}s ease-in forwards`;
      frag.appendChild(p);
    }
    container.appendChild(frag);
    setTimeout(()=>container.querySelectorAll(`.${cls}`).forEach(x=>x.remove()),3600);
  }

  function showResult(win) {
    if (!E.resultOverlay) return;
    if (E.winContent) E.winContent.hidden = !win;
    if (E.loseContent) E.loseContent.hidden = win;

    if (win) {
      if (E.resultTime) E.resultTime.textContent = timeText(S.time);
      if (E.resultTap) E.resultTap.textContent = S.taps;
      E.resultModal?.classList.add("win","result-win");
      E.resultModal?.classList.remove("lose","result-lose");
      particles(E.resultOverlay,55,"pinang-result-confetti");
    } else {
      if (E.loseTap) E.loseTap.textContent = S.taps;
      if (E.loseProgress) E.loseProgress.textContent = `${Math.round(S.progress)}%`;
      if (E.loseTicket) E.loseTicket.textContent = tickets();
      E.resultModal?.classList.add("lose","result-lose");
      E.resultModal?.classList.remove("win","result-win");
    }
    showOverlay(E.resultOverlay);
  }

  function finish(win) {
    if (!["playing","paused"].includes(S.status) || S.finishing) return;
    S.finishing = true;
    clearRuntime();
    S.status = "finished";
    clearPlayerClasses();

    if (win) {
      S.progress = S.visual = 100;
      E.player?.classList.add("winning");
      setFace("🤩");
      if (E.ready) E.ready.textContent = `Puncak tercapai! Combo terbaik x${S.bestCombo}.`;
      particles(E.stage,38,"pinang-arena-confetti");
    } else {
      E.player?.classList.add("losing");
      setFace("😓");
      if (E.ready) E.ready.textContent = "Waktu habis. Atur ritme dan stamina lebih baik!";
    }

    render();
    registerResult(win);
    setTimeout(()=>showResult(win),C.resultDelay);
  }

  function pauseGame() {
    if (!playing()) return toast("Permainan belum dimulai.");
    S.status = "paused";
    cancelAnimationFrame(S.raf);
    E.player?.classList.add("paused");
    setFace("😮‍💨");
    if (E.ready) E.ready.textContent = "Permainan sedang dijeda.";
    showOverlay(E.pauseOverlay);
    render();
  }

  function resumeGame() {
    if (S.status !== "paused") return;
    S.status = "playing";
    S.lastFrame = performance.now();
    E.player?.classList.remove("paused");
    setFace("😤");
    hideOverlay(E.pauseOverlay);
    if (E.ready) E.ready.textContent = "Lanjutkan panjat!";
    render();
    S.raf = requestAnimationFrame(loop);
  }

  function returnLobby() {
    clearRuntime();
    [E.pauseOverlay,E.countdownOverlay,E.resultOverlay,E.exitOverlay].forEach(hideOverlay);
    resetGame();
    api()?.backToLobby?.();
  }

  function requestExit() { busy()?showOverlay(E.exitOverlay):returnLobby(); }

  function openMystery() {
    hideOverlay(E.resultOverlay);
    try { window.ClickbetFinal?.grantMysteryBox?.(1); } catch {}
    api()?.showScreen?.("mystery");
  }

  function retry() {
    hideOverlay(E.resultOverlay);
    setTimeout(()=>{resetGame();startCountdown();},260);
  }

  function toggleSound() {
    S.sound = !S.sound;
    if (E.soundIcon) E.soundIcon.textContent = S.sound?"🔊":"🔇";
    api()?.setSound?.(S.sound);
    toast(S.sound?"Suara diaktifkan.":"Suara dimatikan.");
  }

  function bind() {
    E.start?.addEventListener("click",startCountdown);
    E.tap?.addEventListener("click",registerTap);
    E.pause?.addEventListener("click",pauseGame);
    E.resume?.addEventListener("click",resumeGame);
    E.quit?.addEventListener("click",requestExit);
    E.back?.addEventListener("click",e=>{
      if (busy()) { e.preventDefault(); e.stopImmediatePropagation(); requestExit(); }
    },true);
    E.cancelExit?.addEventListener("click",()=>hideOverlay(E.exitOverlay));
    E.confirmExit?.addEventListener("click",returnLobby);
    E.closeResult?.addEventListener("click",()=>hideOverlay(E.resultOverlay));
    E.retry?.addEventListener("click",retry);
    E.winLobby?.addEventListener("click",returnLobby);
    E.loseLobby?.addEventListener("click",returnLobby);
    E.mystery?.addEventListener("click",openMystery);
    E.sound?.addEventListener("click",toggleSound);

    document.addEventListener("keydown",e=>{
      if (document.body.dataset.activeScreen !== "panjat") return;
      if (e.code==="Space" && playing()) { e.preventDefault(); registerTap(); }
      else if (e.key==="Escape" && S.status==="paused") resumeGame();
      else if (e.key==="Escape" && busy()) requestExit();
    });

    document.addEventListener("clickbet:screenchange",e=>{
      if (e.detail?.screen==="panjat") render();
      else if (busy()) { clearRuntime(); resetGame(); }
    });
  }

  window.ClickbetPinang = {
    version:"8.0.0", start:startCountdown, tap:registerTap,
    pause:pauseGame, resume:resumeGame, reset:resetGame, slip,
    win(){ if(!playing()) return false; S.progress=100; finish(true); return true; },
    getState(){ return {...S}; }
  };

  injectStyles();
  injectUI();
  bind();
  resetGame();
  console.info("[CLICKBET88] Part 2 Premium Panjat Pinang 8.0 aktif.");
})();
/* =========================================================
   JAVASCRIPT PART 3
   ENGINE GAME MAKAN KERUPUK
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI GAME
    ===================================================== */

    const KERUPUK_CONFIG = {
        duration: 10,
        targetTap: 35,
        ticketCost: 1,
        countdownStart: 3,
        resultDelay: 550,
        biteAnimationDuration: 160
    };


    /* =====================================================
       AMBIL ELEMEN HTML
    ===================================================== */

    const screen =
        document.getElementById("kerupukScreen");

    if (!screen) {
        console.warn(
            "[CLICKBET88] Screen Makan Kerupuk tidak ditemukan."
        );

        return;
    }


    const elements = {
        screen,

        backButton:
            document.getElementById("kerupukBackButton"),

        pauseButton:
            document.getElementById("kerupukPauseButton"),

        soundButton:
            document.getElementById("kerupukSoundButton"),

        soundIcon:
            document.getElementById("kerupukSoundIcon"),

        timer:
            document.getElementById("kerupukTimerValue"),

        timerProgress:
            document.getElementById("kerupukTimerProgress"),

        remainingValue:
            document.getElementById("kerupukRemainingValue"),

        eatingProgress:
            document.getElementById("kerupukEatingProgress"),

        tapCount:
            document.getElementById("kerupukTapCount"),

        rope:
            document.getElementById("kerupukRope"),

        kerupuk:
            document.getElementById("mainKerupuk"),

        biteMask:
            document.getElementById("kerupukBiteMask"),

        player:
            document.getElementById("kerupukPlayer"),

        playerFace:
            document.getElementById("kerupukPlayerFace"),

        crumbEffect:
            document.getElementById("kerupukCrumbEffect"),

        readyMessage:
            document.getElementById("kerupukReadyMessage"),

        startButton:
            document.getElementById("kerupukStartButton"),

        tapButton:
            document.getElementById("kerupukTapButton"),

        countdownOverlay:
            document.getElementById(
                "kerupukCountdownOverlay"
            ),

        countdownValue:
            document.getElementById(
                "kerupukCountdownValue"
            ),

        countdownMessage:
            document.getElementById(
                "kerupukCountdownMessage"
            ),

        pauseOverlay:
            document.getElementById(
                "kerupukPauseOverlay"
            ),

        resumeButton:
            document.getElementById(
                "kerupukResumeButton"
            ),

        quitButton:
            document.getElementById("kerupukQuitButton"),

        resultOverlay:
            document.getElementById(
                "kerupukResultOverlay"
            ),

        resultModal:
            document.getElementById(
                "kerupukResultModal"
            ),

        closeResultButton:
            document.getElementById(
                "closeKerupukResultButton"
            ),

        winContent:
            document.getElementById(
                "kerupukWinContent"
            ),

        loseContent:
            document.getElementById(
                "kerupukLoseContent"
            ),

        resultRemainingTime:
            document.getElementById(
                "kerupukResultRemainingTime"
            ),

        resultTapCount:
            document.getElementById(
                "kerupukResultTapCount"
            ),

        loseTapCount:
            document.getElementById(
                "kerupukLoseTapCount"
            ),

        loseRemaining:
            document.getElementById(
                "kerupukLoseRemaining"
            ),

        loseTicket:
            document.getElementById(
                "kerupukLoseTicket"
            ),

        openMysteryButton:
            document.getElementById(
                "openKerupukMysteryButton"
            ),

        winLobbyButton:
            document.getElementById(
                "kerupukWinLobbyButton"
            ),

        retryButton:
            document.getElementById(
                "retryKerupukButton"
            ),

        loseLobbyButton:
            document.getElementById(
                "kerupukLoseLobbyButton"
            ),

        exitOverlay:
            document.getElementById(
                "kerupukExitConfirmOverlay"
            ),

        cancelExitButton:
            document.getElementById(
                "cancelKerupukExitButton"
            ),

        confirmExitButton:
            document.getElementById(
                "confirmKerupukExitButton"
            ),

        toast:
            document.getElementById("kerupukToast"),

        toastIcon:
            document.getElementById(
                "kerupukToastIcon"
            ),

        toastMessage:
            document.getElementById(
                "kerupukToastMessage"
            )
    };


    /* =====================================================
       STATE GAME
    ===================================================== */

    const game = {
        status: "idle",

        tapCount: 0,
        progress: 0,
        remaining: 100,
        timeLeft: KERUPUK_CONFIG.duration,

        timerId: null,
        countdownId: null,
        toastTimer: null,
        biteTimer: null,

        ticketUsed: false,
        soundEnabled: true,
        finishing: false
    };


    /* =====================================================
       UTILITAS DASAR
    ===================================================== */

    function clamp(value, minimum, maximum) {
        return Math.min(
            Math.max(Number(value) || 0, minimum),
            maximum
        );
    }


    function formatTime(seconds) {
        const cleanSeconds = Math.max(
            0,
            Math.ceil(Number(seconds) || 0)
        );

        return `00:${String(cleanSeconds).padStart(2, "0")}`;
    }


    function getClickbetAPI() {
        return window.ClickbetGame || null;
    }


    function getTicketCount() {
        const api = getClickbetAPI();

        if (
            !api ||
            typeof api.getTicketStatus !== "function"
        ) {
            return 0;
        }

        const ticketStatus =
            api.getTicketStatus();

        return Number(ticketStatus?.current) || 0;
    }


    function isPlaying() {
        return game.status === "playing";
    }


    function isBusy() {
        return [
            "countdown",
            "playing",
            "paused"
        ].includes(game.status);
    }


    function isKerupukScreenActive() {
        const activeName =
            document.body.dataset.activeScreen || "";

        return (
            activeName === "kerupuk" ||
            activeName === "makan-kerupuk" ||
            activeName === "makanKerupuk" ||
            elements.screen.classList.contains("active")
        );
    }


    /* =====================================================
       OVERLAY HELPER
    ===================================================== */

    function showOverlay(element) {
        if (!element) {
            return;
        }

        element.hidden = false;
        element.setAttribute("aria-hidden", "false");

        requestAnimationFrame(() => {
            element.classList.add(
                "active",
                "show",
                "visible"
            );
        });
    }


    function hideOverlay(element) {
        if (!element) {
            return;
        }

        element.classList.remove(
            "active",
            "show",
            "visible"
        );

        element.setAttribute("aria-hidden", "true");

        window.setTimeout(() => {
            const stillVisible =
                element.classList.contains("active") ||
                element.classList.contains("show") ||
                element.classList.contains("visible");

            if (!stillVisible) {
                element.hidden = true;
            }
        }, 300);
    }


    /* =====================================================
       NOTIFIKASI GAME
    ===================================================== */

    function showToast(
        message,
        type = "info",
        duration = 2300
    ) {
        clearTimeout(game.toastTimer);

        if (
            !elements.toast ||
            !elements.toastMessage
        ) {
            getClickbetAPI()?.notify?.(
                message,
                type
            );

            return;
        }

        const iconMap = {
            info: "ℹ️",
            success: "✅",
            warning: "⚠️",
            error: "❌"
        };

        if (elements.toastIcon) {
            elements.toastIcon.textContent =
                iconMap[type] || iconMap.info;
        }

        elements.toastMessage.textContent =
            message;

        elements.toast.className =
            `game-toast ${type} show`;

        game.toastTimer =
            window.setTimeout(() => {
                elements.toast?.classList.remove(
                    "show"
                );
            }, duration);
    }


    /* =====================================================
       MEMBERSIHKAN TIMER
    ===================================================== */

    function clearGameTimers() {
        clearInterval(game.timerId);
        clearInterval(game.countdownId);
        clearTimeout(game.biteTimer);

        game.timerId = null;
        game.countdownId = null;
        game.biteTimer = null;
    }


    /* =====================================================
       RENDER TAMPILAN GAME
    ===================================================== */

    function renderGame() {
        const progress =
            clamp(game.progress, 0, 100);

        const remaining =
            clamp(game.remaining, 0, 100);

        const timePercentage =
            clamp(
                game.timeLeft /
                KERUPUK_CONFIG.duration *
                100,
                0,
                100
            );


        if (elements.timer) {
            elements.timer.textContent =
                formatTime(game.timeLeft);

            elements.timer.classList.toggle(
                "danger",
                game.timeLeft <= 3 &&
                game.status === "playing"
            );
        }


        if (elements.timerProgress) {
            elements.timerProgress.style.width =
                `${timePercentage}%`;

            elements.timerProgress.classList.toggle(
                "danger",
                game.timeLeft <= 3
            );
        }


        if (elements.tapCount) {
            elements.tapCount.textContent =
                game.tapCount;
        }


        if (elements.remainingValue) {
            elements.remainingValue.textContent =
                `${Math.round(remaining)}%`;
        }


        if (elements.eatingProgress) {
            elements.eatingProgress.style.width =
                `${progress}%`;
        }


        if (elements.biteMask) {
            elements.biteMask.style.height =
                `${progress}%`;

            elements.biteMask.style.opacity =
                progress <= 0 ? "0" : "1";
        }


        if (elements.kerupuk) {
            const scale =
                clamp(
                    1 - progress * 0.0045,
                    0.55,
                    1
                );

            elements.kerupuk.style.setProperty(
                "--kerupuk-scale",
                scale
            );

            elements.kerupuk.classList.toggle(
                "almost-finished",
                remaining <= 25
            );

            elements.kerupuk.classList.toggle(
                "finished",
                remaining <= 0
            );
        }


        if (elements.tapButton) {
            elements.tapButton.disabled =
                game.status !== "playing";
        }


        if (elements.startButton) {
            elements.startButton.disabled =
                isBusy();

            const buttonText =
                elements.startButton.querySelector(
                    ".start-button-text"
                );

            if (buttonText) {
                if (game.status === "idle") {
                    buttonText.textContent =
                        "MULAI PERMAINAN";
                } else if (
                    game.status === "finished"
                ) {
                    buttonText.textContent =
                        "MAIN LAGI";
                } else if (
                    game.status === "countdown"
                ) {
                    buttonText.textContent =
                        "BERSIAP...";
                } else {
                    buttonText.textContent =
                        "PERMAINAN BERJALAN";
                }
            }
        }


        elements.screen.classList.toggle(
            "game-playing",
            game.status === "playing"
        );

        elements.screen.classList.toggle(
            "game-paused",
            game.status === "paused"
        );

        elements.screen.classList.toggle(
            "game-finished",
            game.status === "finished"
        );
    }


    /* =====================================================
       RESET GAME
    ===================================================== */

    function resetVisualClasses() {
        elements.player?.classList.remove(
            "eating",
            "bite",
            "winning",
            "losing",
            "paused"
        );

        elements.kerupuk?.classList.remove(
            "bite",
            "swing",
            "almost-finished",
            "finished",
            "winning"
        );

        elements.rope?.classList.remove(
            "swing",
            "active"
        );

        elements.crumbEffect?.classList.remove(
            "active"
        );

        if (elements.playerFace) {
            elements.playerFace.textContent =
                "😋";
        }
    }


    function resetRoundData() {
        clearGameTimers();

        game.tapCount = 0;
        game.progress = 0;
        game.remaining = 100;
        game.timeLeft =
            KERUPUK_CONFIG.duration;

        game.finishing = false;

        resetVisualClasses();

        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.pauseOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.exitOverlay);

        renderGame();
    }


    function resetGame(options = {}) {
        const {
            preserveTicketStatus = false
        } = options;

        resetRoundData();

        game.status = "idle";

        if (!preserveTicketStatus) {
            game.ticketUsed = false;
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Tekan mulai untuk bersiap makan kerupuk!";
        }

        renderGame();
    }


    /* =====================================================
       SISTEM TIKET
    ===================================================== */

    function consumeTicket() {
        const api = getClickbetAPI();

        if (!api) {
            showToast(
                "Sistem tiket belum tersedia.",
                "error"
            );

            return false;
        }

        if (
            getTicketCount() <
            KERUPUK_CONFIG.ticketCost
        ) {
            showToast(
                "Tiket kamu tidak mencukupi.",
                "warning",
                2800
            );

            api.notify?.(
                "Kamu membutuhkan 1 tiket untuk memainkan Makan Kerupuk.",
                "warning"
            );

            return false;
        }

        if (
            typeof api.useTicket !== "function"
        ) {
            showToast(
                "Fungsi penggunaan tiket belum tersedia.",
                "error"
            );

            return false;
        }

        const successful =
            api.useTicket(
                KERUPUK_CONFIG.ticketCost
            );

        if (!successful) {
            showToast(
                "Tiket gagal digunakan.",
                "error"
            );

            return false;
        }

        game.ticketUsed = true;

        showToast(
            "1 tiket digunakan. Bersiap makan kerupuk!",
            "success"
        );

        return true;
    }


    /* =====================================================
       MULAI COUNTDOWN
    ===================================================== */

    function startCountdown() {
        if (isBusy()) {
            return;
        }

        if (!consumeTicket()) {
            return;
        }

        resetRoundData();

        game.status = "countdown";

        let countdown =
            KERUPUK_CONFIG.countdownStart;

        if (elements.countdownValue) {
            elements.countdownValue.textContent =
                countdown;
        }

        if (elements.countdownMessage) {
            elements.countdownMessage.textContent =
                "Bersiap!";
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Bersiap, perlombaan segera dimulai!";
        }

        showOverlay(elements.countdownOverlay);
        renderGame();

        game.countdownId =
            window.setInterval(() => {
                countdown -= 1;

                if (countdown > 0) {
                    if (elements.countdownValue) {
                        elements.countdownValue.textContent =
                            countdown;
                    }

                    if (
                        elements.countdownMessage
                    ) {
                        elements.countdownMessage.textContent =
                            countdown === 1
                                ? "Siap!"
                                : "Bersiap!";
                    }

                    return;
                }

                clearInterval(
                    game.countdownId
                );

                game.countdownId = null;

                if (elements.countdownValue) {
                    elements.countdownValue.textContent =
                        "GO!";
                }

                if (elements.countdownMessage) {
                    elements.countdownMessage.textContent =
                        "Makan sekarang!";
                }

                window.setTimeout(() => {
                    hideOverlay(
                        elements.countdownOverlay
                    );

                    startRound();
                }, 500);
            }, 850);
    }


    /* =====================================================
       MULAI RONDE
    ===================================================== */

    function startRound() {
        game.status = "playing";
        game.finishing = false;

        elements.player?.classList.add(
            "eating"
        );

        elements.rope?.classList.add(
            "active"
        );

        if (elements.playerFace) {
            elements.playerFace.textContent =
                "😋";
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Tap secepat mungkin sampai kerupuk habis!";
        }

        renderGame();

        game.timerId =
            window.setInterval(() => {
                if (
                    game.status !== "playing"
                ) {
                    return;
                }

                game.timeLeft =
                    Math.max(
                        game.timeLeft - 0.1,
                        0
                    );

                renderGame();

                if (game.timeLeft <= 0) {
                    finishGame(false);
                }
            }, 100);
    }


    /* =====================================================
       PROSES TAP
    ===================================================== */

    function registerTap() {
        if (!isPlaying()) {
            return;
        }

        if (game.finishing) {
            return;
        }

        game.tapCount += 1;

        game.progress =
            clamp(
                game.tapCount /
                KERUPUK_CONFIG.targetTap *
                100,
                0,
                100
            );

        game.remaining =
            clamp(
                100 - game.progress,
                0,
                100
            );

        animateBite();
        animateCrumbs();
        animateRope();

        renderGame();

        if (
            game.tapCount >=
            KERUPUK_CONFIG.targetTap
        ) {
            finishGame(true);
        }
    }


    /* =====================================================
       ANIMASI TAP DAN MAKAN
    ===================================================== */

    function animateBite() {
        if (elements.player) {
            elements.player.classList.remove(
                "bite"
            );

            void elements.player.offsetWidth;

            elements.player.classList.add(
                "bite"
            );
        }

        if (elements.kerupuk) {
            elements.kerupuk.classList.remove(
                "bite"
            );

            void elements.kerupuk.offsetWidth;

            elements.kerupuk.classList.add(
                "bite"
            );
        }

        clearTimeout(game.biteTimer);

        game.biteTimer =
            window.setTimeout(() => {
                elements.player?.classList.remove(
                    "bite"
                );

                elements.kerupuk?.classList.remove(
                    "bite"
                );
            }, KERUPUK_CONFIG.biteAnimationDuration);
    }


    function animateCrumbs() {
        if (!elements.crumbEffect) {
            return;
        }

        elements.crumbEffect.classList.remove(
            "active"
        );

        void elements.crumbEffect.offsetWidth;

        elements.crumbEffect.classList.add(
            "active"
        );

        window.setTimeout(() => {
            elements.crumbEffect?.classList.remove(
                "active"
            );
        }, 350);
    }


    function animateRope() {
        if (!elements.rope) {
            return;
        }

        elements.rope.classList.remove(
            "swing"
        );

        void elements.rope.offsetWidth;

        elements.rope.classList.add(
            "swing"
        );

        elements.kerupuk?.classList.remove(
            "swing"
        );

        void elements.kerupuk?.offsetWidth;

        elements.kerupuk?.classList.add(
            "swing"
        );

        window.setTimeout(() => {
            elements.rope?.classList.remove(
                "swing"
            );

            elements.kerupuk?.classList.remove(
                "swing"
            );
        }, 280);
    }


    /* =====================================================
       SELESAI PERMAINAN
    ===================================================== */

    function finishGame(isWinner) {
        if (
            game.status !== "playing" &&
            game.status !== "paused"
        ) {
            return;
        }

        if (game.finishing) {
            return;
        }

        game.finishing = true;

        clearGameTimers();

        game.status = "finished";

        elements.player?.classList.remove(
            "eating",
            "bite",
            "paused"
        );

        elements.kerupuk?.classList.remove(
            "bite",
            "swing"
        );

        elements.rope?.classList.remove(
            "active",
            "swing"
        );

        if (isWinner) {
            game.progress = 100;
            game.remaining = 0;

            elements.player?.classList.add(
                "winning"
            );

            elements.kerupuk?.classList.add(
                "finished",
                "winning"
            );

            if (elements.playerFace) {
                elements.playerFace.textContent =
                    "🤩";
            }

            if (elements.readyMessage) {
                elements.readyMessage.textContent =
                    "Hebat! Kerupuk berhasil dihabiskan!";
            }
        } else {
            elements.player?.classList.add(
                "losing"
            );

            if (elements.playerFace) {
                elements.playerFace.textContent =
                    "😓";
            }

            if (elements.readyMessage) {
                elements.readyMessage.textContent =
                    "Waktu habis. Kerupuk belum selesai!";
            }
        }

        renderGame();
        registerResult(isWinner);

        window.setTimeout(() => {
            showResult(isWinner);
        }, KERUPUK_CONFIG.resultDelay);
    }


    /* =====================================================
       SIMPAN HASIL KE SISTEM UTAMA
    ===================================================== */

    function registerResult(isWinner) {
        const api = getClickbetAPI();

        if (
            !api ||
            typeof api.registerGameResult !==
                "function"
        ) {
            return;
        }

        api.registerGameResult(
            "kerupuk",
            isWinner ? "win" : "lose",
            game.tapCount,
            0
        );
    }


    /* =====================================================
       TAMPILKAN HASIL
    ===================================================== */

    function showResult(isWinner) {
        if (!elements.resultOverlay) {
            return;
        }

        if (elements.winContent) {
            elements.winContent.hidden =
                !isWinner;
        }

        if (elements.loseContent) {
            elements.loseContent.hidden =
                isWinner;
        }

        if (isWinner) {
            if (
                elements.resultRemainingTime
            ) {
                elements.resultRemainingTime.textContent =
                    formatTime(
                        game.timeLeft
                    );
            }

            if (elements.resultTapCount) {
                elements.resultTapCount.textContent =
                    game.tapCount;
            }

            elements.resultModal?.classList.add(
                "win",
                "result-win"
            );

            elements.resultModal?.classList.remove(
                "lose",
                "result-lose"
            );

            createKerupukConfetti();
        } else {
            if (elements.loseTapCount) {
                elements.loseTapCount.textContent =
                    game.tapCount;
            }

            if (elements.loseRemaining) {
                elements.loseRemaining.textContent =
                    `${Math.round(
                        game.remaining
                    )}%`;
            }

            if (elements.loseTicket) {
                elements.loseTicket.textContent =
                    getTicketCount();
            }

            elements.resultModal?.classList.add(
                "lose",
                "result-lose"
            );

            elements.resultModal?.classList.remove(
                "win",
                "result-win"
            );
        }

        showOverlay(elements.resultOverlay);
    }


    /* =====================================================
       EFEK CONFETTI MENANG
    ===================================================== */

    function createKerupukConfetti() {
        const container =
            elements.resultOverlay;

        if (!container) {
            return;
        }

        container
            .querySelectorAll(
                ".kerupuk-js-confetti"
            )
            .forEach((item) => item.remove());

        const fragment =
            document.createDocumentFragment();

        for (
            let index = 0;
            index < 48;
            index += 1
        ) {
            const confetti =
                document.createElement("span");

            confetti.className =
                "kerupuk-js-confetti";

            confetti.style.setProperty(
                "--confetti-left",
                `${Math.random() * 100}%`
            );

            confetti.style.setProperty(
                "--confetti-delay",
                `${Math.random() * 0.8}s`
            );

            confetti.style.setProperty(
                "--confetti-duration",
                `${1.8 + Math.random() * 1.6}s`
            );

            confetti.style.setProperty(
                "--confetti-rotation",
                `${Math.random() * 900}deg`
            );

            confetti.style.setProperty(
                "--confetti-hue",
                `${Math.floor(
                    Math.random() * 360
                )}`
            );

            fragment.appendChild(confetti);
        }

        container.appendChild(fragment);

        window.setTimeout(() => {
            container
                .querySelectorAll(
                    ".kerupuk-js-confetti"
                )
                .forEach((item) =>
                    item.remove()
                );
        }, 4200);
    }


    /* =====================================================
       PAUSE DAN RESUME
    ===================================================== */

    function pauseGame() {
        if (game.status !== "playing") {
            showToast(
                "Permainan belum dimulai.",
                "info"
            );

            return;
        }

        game.status = "paused";

        elements.player?.classList.add(
            "paused"
        );

        elements.kerupuk?.classList.add(
            "paused"
        );

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Permainan sedang dijeda.";
        }

        showOverlay(elements.pauseOverlay);
        renderGame();
    }


    function resumeGame() {
        if (game.status !== "paused") {
            return;
        }

        game.status = "playing";

        elements.player?.classList.remove(
            "paused"
        );

        elements.kerupuk?.classList.remove(
            "paused"
        );

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Lanjutkan tap sampai kerupuk habis!";
        }

        hideOverlay(elements.pauseOverlay);
        renderGame();
    }


    /* =====================================================
       KONFIRMASI KELUAR
    ===================================================== */

    function requestExit() {
        if (isBusy()) {
            showOverlay(elements.exitOverlay);
            return;
        }

        returnToLobby();
    }


    function cancelExit() {
        hideOverlay(elements.exitOverlay);
    }


    function confirmExit() {
        hideOverlay(elements.exitOverlay);
        returnToLobby();
    }


    function returnToLobby() {
        clearGameTimers();

        hideOverlay(elements.pauseOverlay);
        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.exitOverlay);

        resetGame();

        const api = getClickbetAPI();

        if (
            api &&
            typeof api.backToLobby === "function"
        ) {
            api.backToLobby();
            return;
        }

        if (
            api &&
            typeof api.showScreen === "function"
        ) {
            api.showScreen("lobby");
        }
    }


    /* =====================================================
       TOMBOL HASIL
    ===================================================== */

    function closeResult() {
        hideOverlay(elements.resultOverlay);
    }


    function retryGame() {
        hideOverlay(elements.resultOverlay);

        window.setTimeout(() => {
            resetGame();
            startCountdown();
        }, 250);
    }


    function openMysteryBox() {
        hideOverlay(elements.resultOverlay);

        const api = getClickbetAPI();

        if (
            !api ||
            typeof api.showScreen !== "function"
        ) {
            showToast(
                "Mystery Box belum tersedia.",
                "warning"
            );

            return;
        }

        api.showScreen("mystery");

        api.notify?.(
            "Mystery Box berhasil dibuka. Engine hadiah akan diaktifkan pada Part berikutnya.",
            "success"
        );
    }


    /* =====================================================
       PENGATURAN SUARA
    ===================================================== */

    function toggleSound() {
        game.soundEnabled =
            !game.soundEnabled;

        if (elements.soundIcon) {
            elements.soundIcon.textContent =
                game.soundEnabled
                    ? "🔊"
                    : "🔇";
        }

        getClickbetAPI()?.setSound?.(
            game.soundEnabled
        );

        showToast(
            game.soundEnabled
                ? "Suara diaktifkan."
                : "Suara dimatikan.",
            "info"
        );
    }


    /* =====================================================
       KEYBOARD
    ===================================================== */

    function handleKeyboard(event) {
        if (!isKerupukScreenActive()) {
            return;
        }

        if (
            event.code === "Space" &&
            game.status === "playing"
        ) {
            event.preventDefault();
            registerTap();
            return;
        }

        if (
            event.key === "Escape" &&
            game.status === "paused"
        ) {
            resumeGame();
            return;
        }

        if (
            event.key === "Escape" &&
            isBusy()
        ) {
            requestExit();
        }
    }


    /* =====================================================
       PERUBAHAN SCREEN
    ===================================================== */

    function handleScreenChange(event) {
        const screenName =
            event.detail?.screen || "";

        const enteringKerupuk =
            screenName === "kerupuk" ||
            screenName === "makan-kerupuk" ||
            screenName === "makanKerupuk";

        if (enteringKerupuk) {
            renderGame();
            return;
        }

        if (isBusy()) {
            clearGameTimers();
            resetGame();
        }
    }


    /* =====================================================
       BIND EVENT
    ===================================================== */

    function bindEvents() {
        elements.startButton?.addEventListener(
            "click",
            startCountdown
        );

        elements.tapButton?.addEventListener(
            "click",
            registerTap
        );

        elements.pauseButton?.addEventListener(
            "click",
            pauseGame
        );

        elements.resumeButton?.addEventListener(
            "click",
            resumeGame
        );

        elements.quitButton?.addEventListener(
            "click",
            requestExit
        );

        elements.backButton?.addEventListener(
            "click",
            (event) => {
                if (isBusy()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    requestExit();
                }
            },
            true
        );

        elements.cancelExitButton?.addEventListener(
            "click",
            cancelExit
        );

        elements.confirmExitButton?.addEventListener(
            "click",
            confirmExit
        );

        elements.closeResultButton?.addEventListener(
            "click",
            closeResult
        );

        elements.retryButton?.addEventListener(
            "click",
            retryGame
        );

        elements.winLobbyButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.loseLobbyButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.openMysteryButton?.addEventListener(
            "click",
            openMysteryBox
        );

        elements.soundButton?.addEventListener(
            "click",
            toggleSound
        );

        elements.resultOverlay?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.resultOverlay
                ) {
                    closeResult();
                }
            }
        );

        elements.exitOverlay?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.exitOverlay
                ) {
                    cancelExit();
                }
            }
        );

        document.addEventListener(
            "keydown",
            handleKeyboard
        );

        document.addEventListener(
            "clickbet:screenchange",
            handleScreenChange
        );
    }


    /* =====================================================
       PUBLIC API MAKAN KERUPUK
    ===================================================== */

    window.ClickbetKerupuk = {
        start: startCountdown,
        tap: registerTap,
        pause: pauseGame,
        resume: resumeGame,
        reset: resetGame,

        getState() {
            return {
                status: game.status,
                tapCount: game.tapCount,
                progress: game.progress,
                remaining: game.remaining,
                timeLeft: game.timeLeft,
                ticketUsed: game.ticketUsed
            };
        }
    };


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {
        bindEvents();
        resetGame();

        console.info(
            "[CLICKBET88] JavaScript Part 3 Makan Kerupuk aktif."
        );
    }


    initialize();

})();
/* =========================================================
   JAVASCRIPT PART 4
   ENGINE GAME LOMBA KELERENG
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI
    ===================================================== */

    const KELERENG_CONFIG = {
        duration: 20,
        targetSteps: 30,
        ticketCost: 1,
        countdownStart: 3,

        maximumBalance: 50,
        safeBalance: 18,
        warningBalance: 34,

        controlStrength: 7,
        naturalDrift: 1.4,
        stepBalanceImpact: 3.2,

        minimumPlayerLeft: 5,
        maximumPlayerLeft: 84,

        resultDelay: 550
    };


    /* =====================================================
       SCREEN
    ===================================================== */

    const screen =
        document.getElementById("kelerengScreen");

    if (!screen) {
        console.warn(
            "[CLICKBET88] Screen Lomba Kelereng tidak ditemukan."
        );

        return;
    }


    /* =====================================================
       ELEMEN HTML
    ===================================================== */

    const elements = {
        screen,

        backButton:
            document.getElementById("kelerengBackButton"),

        pauseButton:
            document.getElementById("kelerengPauseButton"),

        soundButton:
            document.getElementById("kelerengSoundButton"),

        soundIcon:
            document.getElementById("kelerengSoundIcon"),

        timer:
            document.getElementById("kelerengTimerValue"),

        timerProgress:
            document.getElementById("kelerengTimerProgress"),

        progressValue:
            document.getElementById("kelerengProgressValue"),

        progressBar:
            document.getElementById("kelerengProgressBar"),

        balanceMarker:
            document.getElementById("kelerengBalanceMarker"),

        balanceValue:
            document.getElementById("kelerengBalanceValue"),

        player:
            document.getElementById("kelerengPlayer"),

        playerFace:
            document.getElementById("kelerengPlayerFace"),

        spoon:
            document.getElementById("kelerengSpoon"),

        marble:
            document.getElementById("kelerengMarble"),

        stepEffect:
            document.getElementById("kelerengStepEffect"),

        readyMessage:
            document.getElementById("kelerengReadyMessage"),

        startButton:
            document.getElementById("kelerengStartButton"),

        controlButtons:
            document.getElementById("kelerengControlButtons"),

        leftButton:
            document.getElementById("kelerengLeftButton"),

        forwardButton:
            document.getElementById("kelerengForwardButton"),

        rightButton:
            document.getElementById("kelerengRightButton"),

        countdownOverlay:
            document.getElementById(
                "kelerengCountdownOverlay"
            ),

        countdownValue:
            document.getElementById(
                "kelerengCountdownValue"
            ),

        countdownMessage:
            document.getElementById(
                "kelerengCountdownMessage"
            ),

        pauseOverlay:
            document.getElementById("kelerengPauseOverlay"),

        resumeButton:
            document.getElementById("kelerengResumeButton"),

        quitButton:
            document.getElementById("kelerengQuitButton"),

        resultOverlay:
            document.getElementById("kelerengResultOverlay"),

        resultModal:
            document.getElementById("kelerengResultModal"),

        closeResultButton:
            document.getElementById(
                "closeKelerengResultButton"
            ),

        winContent:
            document.getElementById("kelerengWinContent"),

        loseContent:
            document.getElementById("kelerengLoseContent"),

        resultRemainingTime:
            document.getElementById(
                "kelerengResultRemainingTime"
            ),

        resultBalance:
            document.getElementById(
                "kelerengResultBalance"
            ),

        loseDescription:
            document.getElementById(
                "kelerengLoseDescription"
            ),

        loseProgress:
            document.getElementById(
                "kelerengLoseProgress"
            ),

        loseReason:
            document.getElementById(
                "kelerengLoseReason"
            ),

        loseTicket:
            document.getElementById(
                "kelerengLoseTicket"
            ),

        openMysteryButton:
            document.getElementById(
                "openKelerengMysteryButton"
            ),

        winLobbyButton:
            document.getElementById(
                "kelerengWinLobbyButton"
            ),

        retryButton:
            document.getElementById(
                "retryKelerengButton"
            ),

        loseLobbyButton:
            document.getElementById(
                "kelerengLoseLobbyButton"
            ),

        exitOverlay:
            document.getElementById(
                "kelerengExitConfirmOverlay"
            ),

        cancelExitButton:
            document.getElementById(
                "cancelKelerengExitButton"
            ),

        confirmExitButton:
            document.getElementById(
                "confirmKelerengExitButton"
            ),

        toast:
            document.getElementById("kelerengToast"),

        toastIcon:
            document.getElementById("kelerengToastIcon"),

        toastMessage:
            document.getElementById(
                "kelerengToastMessage"
            ),

        finishLine:
            screen.querySelector(
                ".race-track-finish-line"
            ),

        stage:
            screen.querySelector(".kelereng-stage")
    };


    /* =====================================================
       STATE
    ===================================================== */

    const game = {
        status: "idle",

        stepCount: 0,
        progress: 0,
        balance: 0,
        timeLeft: KELERENG_CONFIG.duration,

        timerId: null,
        countdownId: null,
        physicsId: null,
        toastTimer: null,
        animationTimer: null,

        finishing: false,
        ticketUsed: false,
        soundEnabled: true,

        loseReason: ""
    };


    /* =====================================================
       UTILITAS
    ===================================================== */

    function clamp(value, minimum, maximum) {
        return Math.min(
            Math.max(Number(value) || 0, minimum),
            maximum
        );
    }


    function formatTime(seconds) {
        const cleanSeconds = Math.max(
            0,
            Math.ceil(Number(seconds) || 0)
        );

        return `00:${String(cleanSeconds).padStart(2, "0")}`;
    }


    function getAPI() {
        return window.ClickbetGame || null;
    }


    function getTicketCount() {
        const api = getAPI();

        if (
            !api ||
            typeof api.getTicketStatus !== "function"
        ) {
            return 0;
        }

        const status = api.getTicketStatus();

        return Number(status?.current) || 0;
    }


    function isPlaying() {
        return game.status === "playing";
    }


    function isBusy() {
        return [
            "countdown",
            "playing",
            "paused"
        ].includes(game.status);
    }


    function isScreenActive() {
        const activeScreen =
            document.body.dataset.activeScreen || "";

        return (
            activeScreen === "kelereng" ||
            activeScreen === "lomba-kelereng" ||
            activeScreen === "lombaKelereng" ||
            screen.classList.contains("active")
        );
    }


    function getBalanceAbsolute() {
        return Math.abs(game.balance);
    }


    function getBalanceLabel() {
        const absolute =
            getBalanceAbsolute();

        if (
            absolute <=
            KELERENG_CONFIG.safeBalance
        ) {
            return "STABIL";
        }

        if (
            absolute <=
            KELERENG_CONFIG.warningBalance
        ) {
            return "GOYANG";
        }

        return "BAHAYA";
    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    function showOverlay(element) {
        if (!element) return;

        element.hidden = false;
        element.setAttribute("aria-hidden", "false");

        requestAnimationFrame(() => {
            element.classList.add(
                "active",
                "show",
                "visible"
            );
        });
    }


    function hideOverlay(element) {
        if (!element) return;

        element.classList.remove(
            "active",
            "show",
            "visible"
        );

        element.setAttribute("aria-hidden", "true");

        window.setTimeout(() => {
            const visible =
                element.classList.contains("active") ||
                element.classList.contains("show") ||
                element.classList.contains("visible");

            if (!visible) {
                element.hidden = true;
            }
        }, 300);
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message,
        type = "info",
        duration = 2300
    ) {
        clearTimeout(game.toastTimer);

        if (
            !elements.toast ||
            !elements.toastMessage
        ) {
            getAPI()?.notify?.(message, type);
            return;
        }

        const icons = {
            info: "ℹ️",
            success: "✅",
            warning: "⚠️",
            error: "❌"
        };

        if (elements.toastIcon) {
            elements.toastIcon.textContent =
                icons[type] || icons.info;
        }

        elements.toastMessage.textContent =
            message;

        elements.toast.className =
            `game-toast ${type} show`;

        game.toastTimer =
            window.setTimeout(() => {
                elements.toast?.classList.remove(
                    "show"
                );
            }, duration);
    }


    /* =====================================================
       TIMER CLEANUP
    ===================================================== */

    function clearGameTimers() {
        clearInterval(game.timerId);
        clearInterval(game.countdownId);
        clearInterval(game.physicsId);
        clearTimeout(game.animationTimer);

        game.timerId = null;
        game.countdownId = null;
        game.physicsId = null;
        game.animationTimer = null;
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderGame() {
        const progress =
            clamp(game.progress, 0, 100);

        const balance =
            clamp(
                game.balance,
                -KELERENG_CONFIG.maximumBalance,
                KELERENG_CONFIG.maximumBalance
            );

        const timePercentage =
            clamp(
                game.timeLeft /
                KELERENG_CONFIG.duration *
                100,
                0,
                100
            );

        const balancePercentage =
            clamp(
                50 +
                balance /
                KELERENG_CONFIG.maximumBalance *
                50,
                0,
                100
            );

        const playerMovement =
            KELERENG_CONFIG.maximumPlayerLeft -
            KELERENG_CONFIG.minimumPlayerLeft;

        const playerLeft =
            KELERENG_CONFIG.minimumPlayerLeft +
            playerMovement *
            (progress / 100);


        if (elements.timer) {
            elements.timer.textContent =
                formatTime(game.timeLeft);

            elements.timer.classList.toggle(
                "danger",
                game.timeLeft <= 5 &&
                game.status === "playing"
            );
        }


        if (elements.timerProgress) {
            elements.timerProgress.style.width =
                `${timePercentage}%`;

            elements.timerProgress.classList.toggle(
                "danger",
                game.timeLeft <= 5
            );
        }


        if (elements.progressValue) {
            elements.progressValue.textContent =
                `${Math.round(progress)}%`;
        }


        if (elements.progressBar) {
            elements.progressBar.style.width =
                `${progress}%`;
        }


        if (elements.balanceMarker) {
            elements.balanceMarker.style.left =
                `${balancePercentage}%`;
        }


        if (elements.balanceValue) {
            const label = getBalanceLabel();

            elements.balanceValue.textContent =
                label;

            elements.balanceValue.classList.toggle(
                "stable",
                label === "STABIL"
            );

            elements.balanceValue.classList.toggle(
                "warning",
                label === "GOYANG"
            );

            elements.balanceValue.classList.toggle(
                "danger",
                label === "BAHAYA"
            );
        }


        if (elements.player) {
            elements.player.style.left =
                `${playerLeft}%`;
        }


        if (elements.marble) {
            const marbleLeft =
                clamp(
                    50 +
                    balance /
                    KELERENG_CONFIG.maximumBalance *
                    38,
                    8,
                    92
                );

            elements.marble.style.left =
                `${marbleLeft}%`;

            elements.marble.classList.toggle(
                "danger",
                getBalanceLabel() === "BAHAYA"
            );
        }


        if (elements.spoon) {
            const rotation =
                clamp(
                    balance * 0.16,
                    -8,
                    8
                );

            elements.spoon.style.transform =
                `rotate(${rotation}deg)`;
        }


        const controlsEnabled =
            game.status === "playing";

        [
            elements.leftButton,
            elements.forwardButton,
            elements.rightButton
        ].forEach((button) => {
            if (button) {
                button.disabled =
                    !controlsEnabled;
            }
        });


        if (elements.startButton) {
            elements.startButton.disabled =
                isBusy();

            const startText =
                elements.startButton.querySelector(
                    ".start-button-text"
                );

            if (startText) {
                if (game.status === "idle") {
                    startText.textContent =
                        "MULAI PERMAINAN";
                } else if (
                    game.status === "finished"
                ) {
                    startText.textContent =
                        "MAIN LAGI";
                } else if (
                    game.status === "countdown"
                ) {
                    startText.textContent =
                        "BERSIAP...";
                } else {
                    startText.textContent =
                        "PERMAINAN BERJALAN";
                }
            }
        }


        screen.classList.toggle(
            "game-playing",
            game.status === "playing"
        );

        screen.classList.toggle(
            "game-paused",
            game.status === "paused"
        );

        screen.classList.toggle(
            "game-finished",
            game.status === "finished"
        );
    }


    /* =====================================================
       RESET VISUAL
    ===================================================== */

    function resetVisualClasses() {
        elements.player?.classList.remove(
            "walking",
            "stepping",
            "winning",
            "losing",
            "paused"
        );

        elements.marble?.classList.remove(
            "danger",
            "falling",
            "winning"
        );

        elements.spoon?.classList.remove(
            "shaking",
            "paused"
        );

        elements.stepEffect?.classList.remove(
            "active"
        );

        elements.finishLine?.classList.remove(
            "active"
        );

        elements.stage?.classList.remove(
            "win",
            "lose"
        );

        if (elements.spoon) {
            elements.spoon.style.transform =
                "rotate(0deg)";
        }

        if (elements.playerFace) {
            elements.playerFace.textContent =
                "😬";
        }
    }


    function resetRoundData() {
        clearGameTimers();

        game.stepCount = 0;
        game.progress = 0;
        game.balance = 0;
        game.timeLeft =
            KELERENG_CONFIG.duration;

        game.finishing = false;
        game.loseReason = "";

        resetVisualClasses();

        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.pauseOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.exitOverlay);

        renderGame();
    }


    function resetGame(options = {}) {
        const {
            preserveTicketStatus = false
        } = options;

        resetRoundData();

        game.status = "idle";

        if (!preserveTicketStatus) {
            game.ticketUsed = false;
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Tekan mulai dan bersiap menjaga keseimbangan!";
        }

        renderGame();
    }


    /* =====================================================
       TIKET
    ===================================================== */

    function consumeTicket() {
        const api = getAPI();

        if (!api) {
            showToast(
                "Sistem tiket belum tersedia.",
                "error"
            );

            return false;
        }

        if (
            getTicketCount() <
            KELERENG_CONFIG.ticketCost
        ) {
            showToast(
                "Tiket kamu tidak mencukupi.",
                "warning",
                2800
            );

            api.notify?.(
                "Kamu membutuhkan 1 tiket untuk memainkan Lomba Kelereng.",
                "warning"
            );

            return false;
        }

        if (
            typeof api.useTicket !== "function"
        ) {
            showToast(
                "Fungsi penggunaan tiket belum tersedia.",
                "error"
            );

            return false;
        }

        const successful =
            api.useTicket(
                KELERENG_CONFIG.ticketCost
            );

        if (!successful) {
            showToast(
                "Tiket gagal digunakan.",
                "error"
            );

            return false;
        }

        game.ticketUsed = true;

        showToast(
            "1 tiket digunakan. Jaga keseimbangan!",
            "success"
        );

        return true;
    }


    /* =====================================================
       COUNTDOWN
    ===================================================== */

    function startCountdown() {
        if (isBusy()) {
            return;
        }

        if (!consumeTicket()) {
            return;
        }

        resetRoundData();

        game.status = "countdown";

        let countdown =
            KELERENG_CONFIG.countdownStart;

        if (elements.countdownValue) {
            elements.countdownValue.textContent =
                countdown;
        }

        if (elements.countdownMessage) {
            elements.countdownMessage.textContent =
                "Bersiap!";
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Bersiap, perlombaan segera dimulai!";
        }

        showOverlay(elements.countdownOverlay);
        renderGame();

        game.countdownId =
            window.setInterval(() => {
                countdown -= 1;

                if (countdown > 0) {
                    if (elements.countdownValue) {
                        elements.countdownValue.textContent =
                            countdown;
                    }

                    if (
                        elements.countdownMessage
                    ) {
                        elements.countdownMessage.textContent =
                            countdown === 1
                                ? "Siap!"
                                : "Bersiap!";
                    }

                    return;
                }

                clearInterval(
                    game.countdownId
                );

                game.countdownId = null;

                if (elements.countdownValue) {
                    elements.countdownValue.textContent =
                        "GO!";
                }

                if (elements.countdownMessage) {
                    elements.countdownMessage.textContent =
                        "Mulai berjalan!";
                }

                window.setTimeout(() => {
                    hideOverlay(
                        elements.countdownOverlay
                    );

                    startRound();
                }, 500);
            }, 850);
    }


    /* =====================================================
       MULAI GAME
    ===================================================== */

    function startRound() {
        game.status = "playing";
        game.finishing = false;

        elements.player?.classList.add(
            "walking"
        );

        if (elements.playerFace) {
            elements.playerFace.textContent =
                "😬";
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Tekan Jalan sambil menjaga kelereng tetap di tengah!";
        }

        renderGame();

        startTimer();
        startPhysics();
    }


    function startTimer() {
        game.timerId =
            window.setInterval(() => {
                if (
                    game.status !== "playing"
                ) {
                    return;
                }

                game.timeLeft =
                    Math.max(
                        game.timeLeft - 0.1,
                        0
                    );

                renderGame();

                if (game.timeLeft <= 0) {
                    finishGame(
                        false,
                        "WAKTU HABIS"
                    );
                }
            }, 100);
    }


    function startPhysics() {
        game.physicsId =
            window.setInterval(() => {
                if (
                    game.status !== "playing"
                ) {
                    return;
                }

                const direction =
                    Math.random() > 0.5
                        ? 1
                        : -1;

                const intensity =
                    KELERENG_CONFIG.naturalDrift *
                    (0.45 + Math.random());

                game.balance +=
                    direction * intensity;

                /*
                 * Semakin jauh progress, keseimbangan
                 * sedikit lebih sulit.
                 */
                game.balance +=
                    direction *
                    game.progress *
                    0.004;

                game.balance =
                    clamp(
                        game.balance,
                        -KELERENG_CONFIG.maximumBalance -
                            5,
                        KELERENG_CONFIG.maximumBalance +
                            5
                    );

                renderGame();

                if (
                    getBalanceAbsolute() >=
                    KELERENG_CONFIG.maximumBalance
                ) {
                    finishGame(
                        false,
                        "KELERENG JATUH"
                    );
                }
            }, 180);
    }


    /* =====================================================
       KONTROL KESEIMBANGAN
    ===================================================== */

    function moveBalance(direction) {
        if (!isPlaying()) {
            return;
        }

        const strength =
            KELERENG_CONFIG.controlStrength;

        /*
         * Tombol kiri menggeser kelereng ke kiri.
         * Tombol kanan menggeser kelereng ke kanan.
         */
        game.balance +=
            direction === "left"
                ? -strength
                : strength;

        game.balance =
            clamp(
                game.balance,
                -KELERENG_CONFIG.maximumBalance,
                KELERENG_CONFIG.maximumBalance
            );

        animateBalanceControl(direction);
        renderGame();

        if (
            getBalanceAbsolute() >=
            KELERENG_CONFIG.maximumBalance
        ) {
            finishGame(
                false,
                "KELERENG JATUH"
            );
        }
    }


    function moveLeft() {
        moveBalance("left");
    }


    function moveRight() {
        moveBalance("right");
    }


    function animateBalanceControl(direction) {
        const button =
            direction === "left"
                ? elements.leftButton
                : elements.rightButton;

        button?.classList.remove("pressed");

        void button?.offsetWidth;

        button?.classList.add("pressed");

        window.setTimeout(() => {
            button?.classList.remove("pressed");
        }, 150);

        elements.spoon?.classList.remove(
            "shaking"
        );

        void elements.spoon?.offsetWidth;

        elements.spoon?.classList.add(
            "shaking"
        );

        window.setTimeout(() => {
            elements.spoon?.classList.remove(
                "shaking"
            );
        }, 230);
    }


    /* =====================================================
       JALAN / MAJU
    ===================================================== */

    function moveForward() {
        if (!isPlaying()) {
            return;
        }

        if (game.finishing) {
            return;
        }

        game.stepCount += 1;

        game.progress =
            clamp(
                game.stepCount /
                KELERENG_CONFIG.targetSteps *
                100,
                0,
                100
            );

        /*
         * Setiap melangkah memberi sedikit guncangan.
         */
        const impactDirection =
            Math.random() > 0.5
                ? 1
                : -1;

        game.balance +=
            impactDirection *
            KELERENG_CONFIG.stepBalanceImpact *
            (0.7 + Math.random() * 0.6);

        game.balance =
            clamp(
                game.balance,
                -KELERENG_CONFIG.maximumBalance,
                KELERENG_CONFIG.maximumBalance
            );

        animateStep();
        renderGame();

        if (
            getBalanceAbsolute() >=
            KELERENG_CONFIG.maximumBalance
        ) {
            finishGame(
                false,
                "KELERENG JATUH"
            );

            return;
        }

        if (
            game.stepCount >=
            KELERENG_CONFIG.targetSteps
        ) {
            finishGame(true);
        }
    }


    function animateStep() {
        elements.player?.classList.remove(
            "stepping"
        );

        void elements.player?.offsetWidth;

        elements.player?.classList.add(
            "stepping"
        );

        elements.forwardButton?.classList.remove(
            "pressed"
        );

        void elements.forwardButton?.offsetWidth;

        elements.forwardButton?.classList.add(
            "pressed"
        );

        if (elements.stepEffect) {
            elements.stepEffect.classList.remove(
                "active"
            );

            void elements.stepEffect.offsetWidth;

            elements.stepEffect.classList.add(
                "active"
            );
        }

        clearTimeout(game.animationTimer);

        game.animationTimer =
            window.setTimeout(() => {
                elements.player?.classList.remove(
                    "stepping"
                );

                elements.forwardButton?.classList.remove(
                    "pressed"
                );

                elements.stepEffect?.classList.remove(
                    "active"
                );
            }, 230);
    }


    /* =====================================================
       SELESAI GAME
    ===================================================== */

    function finishGame(
        isWinner,
        reason = ""
    ) {
        if (
            game.status !== "playing" &&
            game.status !== "paused"
        ) {
            return;
        }

        if (game.finishing) {
            return;
        }

        game.finishing = true;
        game.loseReason = reason;

        clearGameTimers();

        game.status = "finished";

        elements.player?.classList.remove(
            "walking",
            "stepping",
            "paused"
        );

        elements.spoon?.classList.remove(
            "shaking",
            "paused"
        );

        if (isWinner) {
            game.progress = 100;
            game.balance =
                clamp(game.balance, -12, 12);

            elements.player?.classList.add(
                "winning"
            );

            elements.marble?.classList.add(
                "winning"
            );

            elements.finishLine?.classList.add(
                "active"
            );

            elements.stage?.classList.add(
                "win"
            );

            if (elements.playerFace) {
                elements.playerFace.textContent =
                    "🤩";
            }

            if (elements.readyMessage) {
                elements.readyMessage.textContent =
                    "Hebat! Kamu berhasil mencapai garis finis!";
            }
        } else {
            elements.player?.classList.add(
                "losing"
            );

            elements.stage?.classList.add(
                "lose"
            );

            if (
                reason === "KELERENG JATUH"
            ) {
                elements.marble?.classList.add(
                    "falling"
                );
            }

            if (elements.playerFace) {
                elements.playerFace.textContent =
                    "😵";
            }

            if (elements.readyMessage) {
                elements.readyMessage.textContent =
                    reason === "WAKTU HABIS"
                        ? "Waktu habis sebelum mencapai finis!"
                        : "Kelereng jatuh dari sendok!";
            }
        }

        renderGame();
        registerResult(isWinner);

        window.setTimeout(() => {
            showResult(isWinner);
        }, KELERENG_CONFIG.resultDelay);
    }


    /* =====================================================
       DAFTARKAN HASIL
    ===================================================== */

    function registerResult(isWinner) {
        const api = getAPI();

        if (
            !api ||
            typeof api.registerGameResult !==
                "function"
        ) {
            return;
        }

        api.registerGameResult(
            "kelereng",
            isWinner ? "win" : "lose",
            Math.round(game.progress),
            0
        );
    }


    /* =====================================================
       HASIL
    ===================================================== */

    function showResult(isWinner) {
        if (!elements.resultOverlay) {
            return;
        }

        if (elements.winContent) {
            elements.winContent.hidden =
                !isWinner;
        }

        if (elements.loseContent) {
            elements.loseContent.hidden =
                isWinner;
        }

        if (isWinner) {
            if (
                elements.resultRemainingTime
            ) {
                elements.resultRemainingTime.textContent =
                    formatTime(game.timeLeft);
            }

            if (elements.resultBalance) {
                elements.resultBalance.textContent =
                    getBalanceLabel();
            }

            elements.resultModal?.classList.add(
                "win",
                "result-win"
            );

            elements.resultModal?.classList.remove(
                "lose",
                "result-lose"
            );

            createConfetti();
        } else {
            if (elements.loseProgress) {
                elements.loseProgress.textContent =
                    `${Math.round(
                        game.progress
                    )}%`;
            }

            if (elements.loseReason) {
                elements.loseReason.textContent =
                    game.loseReason ||
                    "GAGAL";
            }

            if (elements.loseTicket) {
                elements.loseTicket.textContent =
                    getTicketCount();
            }

            if (elements.loseDescription) {
                if (
                    game.loseReason ===
                    "WAKTU HABIS"
                ) {
                    elements.loseDescription.textContent =
                        "Waktu permainan telah habis sebelum kamu mencapai garis finis.";
                } else {
                    elements.loseDescription.textContent =
                        "Kelereng terjatuh dari sendok. Kendalikan arah dengan sentuhan lebih pendek.";
                }
            }

            elements.resultModal?.classList.add(
                "lose",
                "result-lose"
            );

            elements.resultModal?.classList.remove(
                "win",
                "result-win"
            );
        }

        showOverlay(elements.resultOverlay);
    }


    /* =====================================================
       CONFETTI
    ===================================================== */

    function createConfetti() {
        const container =
            elements.resultOverlay;

        if (!container) {
            return;
        }

        container
            .querySelectorAll(
                ".kelereng-js-confetti"
            )
            .forEach((item) =>
                item.remove()
            );

        const fragment =
            document.createDocumentFragment();

        for (
            let index = 0;
            index < 50;
            index += 1
        ) {
            const confetti =
                document.createElement("span");

            confetti.className =
                "kelereng-js-confetti";

            confetti.style.setProperty(
                "--confetti-left",
                `${Math.random() * 100}%`
            );

            confetti.style.setProperty(
                "--confetti-delay",
                `${Math.random() * 0.8}s`
            );

            confetti.style.setProperty(
                "--confetti-duration",
                `${1.8 + Math.random() * 1.7}s`
            );

            confetti.style.setProperty(
                "--confetti-rotation",
                `${Math.random() * 900}deg`
            );

            confetti.style.setProperty(
                "--confetti-hue",
                `${Math.floor(
                    Math.random() * 360
                )}`
            );

            fragment.appendChild(confetti);
        }

        container.appendChild(fragment);

        window.setTimeout(() => {
            container
                .querySelectorAll(
                    ".kelereng-js-confetti"
                )
                .forEach((item) =>
                    item.remove()
                );
        }, 4300);
    }


    /* =====================================================
       PAUSE / RESUME
    ===================================================== */

    function pauseGame() {
        if (game.status !== "playing") {
            showToast(
                "Permainan belum dimulai.",
                "info"
            );

            return;
        }

        game.status = "paused";

        elements.player?.classList.add(
            "paused"
        );

        elements.spoon?.classList.add(
            "paused"
        );

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Permainan sedang dijeda.";
        }

        showOverlay(elements.pauseOverlay);
        renderGame();
    }


    function resumeGame() {
        if (game.status !== "paused") {
            return;
        }

        game.status = "playing";

        elements.player?.classList.remove(
            "paused"
        );

        elements.spoon?.classList.remove(
            "paused"
        );

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Lanjutkan perjalanan menuju garis finis!";
        }

        hideOverlay(elements.pauseOverlay);
        renderGame();
    }


    /* =====================================================
       KELUAR
    ===================================================== */

    function requestExit() {
        if (isBusy()) {
            showOverlay(elements.exitOverlay);
            return;
        }

        returnToLobby();
    }


    function cancelExit() {
        hideOverlay(elements.exitOverlay);
    }


    function confirmExit() {
        hideOverlay(elements.exitOverlay);
        returnToLobby();
    }


    function returnToLobby() {
        clearGameTimers();

        hideOverlay(elements.pauseOverlay);
        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.exitOverlay);

        resetGame();

        const api = getAPI();

        if (
            api &&
            typeof api.backToLobby === "function"
        ) {
            api.backToLobby();
            return;
        }

        api?.showScreen?.("lobby");
    }


    /* =====================================================
       TOMBOL RESULT
    ===================================================== */

    function closeResult() {
        hideOverlay(elements.resultOverlay);
    }


    function retryGame() {
        hideOverlay(elements.resultOverlay);

        window.setTimeout(() => {
            resetGame();
            startCountdown();
        }, 250);
    }


    function openMysteryBox() {
        hideOverlay(elements.resultOverlay);

        const api = getAPI();

        if (
            !api ||
            typeof api.showScreen !== "function"
        ) {
            showToast(
                "Mystery Box belum tersedia.",
                "warning"
            );

            return;
        }

        api.showScreen("mystery");

        api.notify?.(
            "Mystery Box terbuka. Engine hadiah akan diaktifkan pada Part berikutnya.",
            "success"
        );
    }


    /* =====================================================
       SUARA
    ===================================================== */

    function toggleSound() {
        game.soundEnabled =
            !game.soundEnabled;

        if (elements.soundIcon) {
            elements.soundIcon.textContent =
                game.soundEnabled
                    ? "🔊"
                    : "🔇";
        }

        getAPI()?.setSound?.(
            game.soundEnabled
        );

        showToast(
            game.soundEnabled
                ? "Suara diaktifkan."
                : "Suara dimatikan.",
            "info"
        );
    }


    /* =====================================================
       KEYBOARD
    ===================================================== */

    function handleKeyboard(event) {
        if (!isScreenActive()) {
            return;
        }

        if (
            event.code === "Space" &&
            game.status === "playing"
        ) {
            event.preventDefault();
            moveForward();
            return;
        }

        if (
            event.key === "ArrowLeft" &&
            game.status === "playing"
        ) {
            event.preventDefault();
            moveLeft();
            return;
        }

        if (
            event.key === "ArrowRight" &&
            game.status === "playing"
        ) {
            event.preventDefault();
            moveRight();
            return;
        }

        if (
            event.key === "Escape" &&
            game.status === "paused"
        ) {
            resumeGame();
            return;
        }

        if (
            event.key === "Escape" &&
            isBusy()
        ) {
            requestExit();
        }
    }


    /* =====================================================
       SCREEN CHANGE
    ===================================================== */

    function handleScreenChange(event) {
        const screenName =
            event.detail?.screen || "";

        const enteringKelereng =
            screenName === "kelereng" ||
            screenName === "lomba-kelereng" ||
            screenName === "lombaKelereng";

        if (enteringKelereng) {
            renderGame();
            return;
        }

        if (isBusy()) {
            clearGameTimers();
            resetGame();
        }
    }


    /* =====================================================
       BIND EVENTS
    ===================================================== */

    function bindEvents() {
        elements.startButton?.addEventListener(
            "click",
            startCountdown
        );

        elements.leftButton?.addEventListener(
            "click",
            moveLeft
        );

        elements.forwardButton?.addEventListener(
            "click",
            moveForward
        );

        elements.rightButton?.addEventListener(
            "click",
            moveRight
        );

        elements.pauseButton?.addEventListener(
            "click",
            pauseGame
        );

        elements.resumeButton?.addEventListener(
            "click",
            resumeGame
        );

        elements.quitButton?.addEventListener(
            "click",
            requestExit
        );

        elements.backButton?.addEventListener(
            "click",
            (event) => {
                if (isBusy()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    requestExit();
                }
            },
            true
        );

        elements.cancelExitButton?.addEventListener(
            "click",
            cancelExit
        );

        elements.confirmExitButton?.addEventListener(
            "click",
            confirmExit
        );

        elements.closeResultButton?.addEventListener(
            "click",
            closeResult
        );

        elements.retryButton?.addEventListener(
            "click",
            retryGame
        );

        elements.winLobbyButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.loseLobbyButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.openMysteryButton?.addEventListener(
            "click",
            openMysteryBox
        );

        elements.soundButton?.addEventListener(
            "click",
            toggleSound
        );

        elements.resultOverlay?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.resultOverlay
                ) {
                    closeResult();
                }
            }
        );

        elements.exitOverlay?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.exitOverlay
                ) {
                    cancelExit();
                }
            }
        );

        document.addEventListener(
            "keydown",
            handleKeyboard
        );

        document.addEventListener(
            "clickbet:screenchange",
            handleScreenChange
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ClickbetKelereng = {
        start: startCountdown,
        left: moveLeft,
        right: moveRight,
        forward: moveForward,
        pause: pauseGame,
        resume: resumeGame,
        reset: resetGame,

        getState() {
            return {
                status: game.status,
                stepCount: game.stepCount,
                progress: game.progress,
                balance: game.balance,
                balanceStatus:
                    getBalanceLabel(),
                timeLeft: game.timeLeft,
                ticketUsed: game.ticketUsed,
                loseReason: game.loseReason
            };
        }
    };


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {
        bindEvents();
        resetGame();

        console.info(
            "[CLICKBET88] JavaScript Part 4 Lomba Kelereng aktif."
        );
    }


    initialize();

})();
/* =========================================================
   JAVASCRIPT PART 5
   MYSTERY BOX & SISTEM HADIAH
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI HADIAH

       weight = peluang relatif.
       Semakin besar weight, semakin sering didapat.
    ===================================================== */

    const MYSTERY_CONFIG = {
        countdownStart: 3,
        countdownInterval: 850,
        openingDuration: 2800,
        resultDelay: 500,

        storageKey: "clickbet88_mystery_data_v1",

        rewards: [
            {
                amount: 5000,
                weight: 35,
                level: "lucky",
                label: "LUCKY",
                message: "Awal yang bagus!"
            },
            {
                amount: 10000,
                weight: 25,
                level: "nice",
                label: "NICE",
                message: "Hadiah menarik untukmu!"
            },
            {
                amount: 25000,
                weight: 17,
                level: "great",
                label: "GREAT",
                message: "Keberuntungan berpihak kepadamu!"
            },
            {
                amount: 50000,
                weight: 10,
                level: "excellent",
                label: "EXCELLENT",
                message: "Hadiah spesial berhasil ditemukan!"
            },
            {
                amount: 100000,
                weight: 7,
                level: "amazing",
                label: "AMAZING",
                message: "Kemenangan yang luar biasa!"
            },
            {
                amount: 250000,
                weight: 3.5,
                level: "epic",
                label: "EPIC",
                message: "Hadiah besar berhasil kamu dapatkan!"
            },
            {
                amount: 350000,
                weight: 2,
                level: "legendary",
                label: "LEGENDARY",
                message: "Kemenangan legendaris!"
            },
            {
                amount: 500000,
                weight: 0.5,
                level: "jackpot",
                label: "JACKPOT",
                message: "Kamu mendapatkan hadiah tertinggi!"
            }
        ]
    };


    /* =====================================================
       ELEMEN HTML
    ===================================================== */

    const elements = {
        screen:
            document.getElementById("mysteryScreen"),

        backButton:
            document.getElementById("mysteryBackButton"),

        helpButton:
            document.getElementById("mysteryHelpButton"),

        soundButton:
            document.getElementById("mysterySoundButton"),

        soundIcon:
            document.getElementById("mysterySoundIcon"),

        openButton:
            document.getElementById("openMysteryBoxButton"),

        returnLobbyButton:
            document.getElementById("mysteryReturnLobbyButton"),

        processStatus:
            document.getElementById("mysteryProcessStatus"),

        processIcon:
            document.getElementById("mysteryProcessIcon"),

        processText:
            document.getElementById("mysteryProcessText"),

        mainBox:
            document.getElementById("mainMysteryBox"),

        boxLid:
            document.getElementById("mainMysteryBoxLid"),

        boxBody:
            document.getElementById("mainMysteryBoxBody"),

        insideLight:
            document.getElementById("mysteryInsideLight"),

        explosionEffect:
            document.getElementById("mysteryExplosionEffect"),

        coinEffect:
            document.getElementById("mysteryCoinEffect"),

        countdownOverlay:
            document.getElementById("mysteryCountdownOverlay"),

        countdownValue:
            document.getElementById("mysteryCountdownValue"),

        countdownText:
            document.getElementById("mysteryCountdownText"),

        openingOverlay:
            document.getElementById("mysteryOpeningOverlay"),

        openingProgress:
            document.getElementById("mysteryOpeningProgress"),

        openingProgressBar:
            document.getElementById("mysteryOpeningProgressBar"),

        openingText:
            document.getElementById("mysteryOpeningText"),

        resultOverlay:
            document.getElementById("mysteryResultOverlay"),

        resultCard:
            document.getElementById("mysteryResultCard"),

        resultLabel:
            document.getElementById("mysteryResultLabel"),

        resultAmount:
            document.getElementById("mysteryRewardAmount"),

        resultMessage:
            document.getElementById("mysteryResultMessage"),

        resultMember:
            document.getElementById("mysteryResultMember"),

        claimButton:
            document.getElementById("claimMysteryRewardButton"),

        resultLobbyButton:
            document.getElementById("mysteryResultLobbyButton"),

        closeResultButton:
            document.getElementById("closeMysteryResultButton"),

        jackpotOverlay:
            document.getElementById("jackpotOverlay"),

        jackpotAmount:
            document.getElementById("jackpotRewardAmount"),

        continueJackpotButton:
            document.getElementById("continueJackpotButton"),

        claimConfirmOverlay:
            document.getElementById("claimRewardConfirmOverlay"),

        claimPreviewAmount:
            document.getElementById("claimRewardPreviewAmount"),

        cancelClaimButton:
            document.getElementById("cancelClaimRewardButton"),

        confirmClaimButton:
            document.getElementById("confirmClaimRewardButton"),

        toast:
            document.getElementById("rewardToast"),

        toastIcon:
            document.getElementById("rewardToastIcon"),

        toastMessage:
            document.getElementById("rewardToastMessage"),

        lobbyReward:
            document.getElementById("todayRewardValue"),

        historyList:
            document.getElementById("rewardHistoryList"),

        playerNames:
            document.querySelectorAll("[data-user-name]")
    };


    if (!elements.screen) {
        console.warn(
            "[CLICKBET88] Mystery Screen tidak ditemukan."
        );

        return;
    }


    /* =====================================================
       STATE
    ===================================================== */

    const state = {
        status: "idle",
        selectedReward: null,
        rewardClaimed: false,
        soundEnabled: true,

        countdownTimer: null,
        openingTimer: null,
        progressTimer: null,
        toastTimer: null
    };


    /* =====================================================
       UTILITAS
    ===================================================== */

    function getAPI() {
        return window.ClickbetGame || null;
    }


    function formatRupiah(value) {
        return new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        ).format(Number(value) || 0);
    }


    function getTodayKey() {
        const date = new Date();

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }


    function getMemberName() {
        const api = getAPI();

        if (
            api &&
            typeof api.getPlayerData === "function"
        ) {
            const player = api.getPlayerData();

            if (player?.username) {
                return player.username;
            }

            if (player?.memberId) {
                return player.memberId;
            }
        }

        const displayedName =
            document.querySelector("[data-user-name]")
                ?.textContent
                ?.trim();

        return displayedName || "PLAYER";
    }


    function clearTimers() {
        clearInterval(state.countdownTimer);
        clearInterval(state.openingTimer);
        clearInterval(state.progressTimer);

        state.countdownTimer = null;
        state.openingTimer = null;
        state.progressTimer = null;
    }


    function isBusy() {
        return [
            "countdown",
            "opening"
        ].includes(state.status);
    }


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    function createDefaultData() {
        return {
            date: getTodayKey(),
            totalReward: 0,
            totalOpened: 0,
            history: []
        };
    }


    function readStorage() {
        try {
            const raw =
                localStorage.getItem(
                    MYSTERY_CONFIG.storageKey
                );

            if (!raw) {
                return createDefaultData();
            }

            const parsed = JSON.parse(raw);

            if (
                !parsed ||
                parsed.date !== getTodayKey()
            ) {
                const fresh = createDefaultData();

                saveStorage(fresh);

                return fresh;
            }

            return {
                date: parsed.date,
                totalReward:
                    Number(parsed.totalReward) || 0,
                totalOpened:
                    Number(parsed.totalOpened) || 0,
                history:
                    Array.isArray(parsed.history)
                        ? parsed.history
                        : []
            };
        } catch (error) {
            console.error(
                "[CLICKBET88] Gagal membaca data Mystery Box:",
                error
            );

            return createDefaultData();
        }
    }


    function saveStorage(data) {
        try {
            localStorage.setItem(
                MYSTERY_CONFIG.storageKey,
                JSON.stringify(data)
            );
        } catch (error) {
            console.error(
                "[CLICKBET88] Gagal menyimpan data Mystery Box:",
                error
            );
        }
    }


    function saveReward(reward) {
        const data = readStorage();

        const record = {
            id:
                `reward-${Date.now()}-${Math.random()
                    .toString(16)
                    .slice(2)}`,

            member: getMemberName(),
            amount: reward.amount,
            level: reward.level,
            label: reward.label,
            claimed: false,
            createdAt: new Date().toISOString()
        };

        data.totalReward += reward.amount;
        data.totalOpened += 1;
        data.history.unshift(record);

        if (data.history.length > 50) {
            data.history =
                data.history.slice(0, 50);
        }

        saveStorage(data);

        return record;
    }


    function markLatestRewardClaimed() {
        const data = readStorage();

        const reward =
            data.history.find(
                (item) => !item.claimed
            );

        if (reward) {
            reward.claimed = true;
            reward.claimedAt =
                new Date().toISOString();

            saveStorage(data);
        }

        return reward || null;
    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    function showOverlay(element) {
        if (!element) return;

        element.hidden = false;
        element.setAttribute("aria-hidden", "false");

        requestAnimationFrame(() => {
            element.classList.add(
                "active",
                "show",
                "visible"
            );
        });
    }


    function hideOverlay(element) {
        if (!element) return;

        element.classList.remove(
            "active",
            "show",
            "visible"
        );

        element.setAttribute("aria-hidden", "true");

        window.setTimeout(() => {
            const visible =
                element.classList.contains("active") ||
                element.classList.contains("show") ||
                element.classList.contains("visible");

            if (!visible) {
                element.hidden = true;
            }
        }, 300);
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message,
        type = "success",
        duration = 2600
    ) {
        clearTimeout(state.toastTimer);

        const icons = {
            success: "🏆",
            info: "ℹ️",
            warning: "⚠️",
            error: "❌"
        };

        if (
            !elements.toast ||
            !elements.toastMessage
        ) {
            getAPI()?.notify?.(message, type);
            return;
        }

        if (elements.toastIcon) {
            elements.toastIcon.textContent =
                icons[type] || icons.success;
        }

        elements.toastMessage.textContent =
            message;

        elements.toast.className =
            `game-toast ${type} show`;

        state.toastTimer =
            window.setTimeout(() => {
                elements.toast.classList.remove(
                    "show"
                );
            }, duration);
    }


    /* =====================================================
       PEMILIHAN HADIAH
    ===================================================== */

    function selectWeightedReward() {
        const rewards =
            MYSTERY_CONFIG.rewards;

        const totalWeight =
            rewards.reduce(
                (total, reward) =>
                    total + reward.weight,
                0
            );

        let random =
            Math.random() * totalWeight;

        for (const reward of rewards) {
            random -= reward.weight;

            if (random <= 0) {
                return {
                    ...reward
                };
            }
        }

        return {
            ...rewards[0]
        };
    }


    /* =====================================================
       RESET VISUAL
    ===================================================== */

    function clearPrizeClasses() {
        const classes = [
            "prize-lucky",
            "prize-nice",
            "prize-great",
            "prize-excellent",
            "prize-amazing",
            "prize-epic",
            "prize-legendary",
            "prize-jackpot"
        ];

        elements.screen.classList.remove(
            ...classes
        );

        elements.resultCard?.classList.remove(
            "lucky",
            "nice",
            "great",
            "excellent",
            "amazing",
            "epic",
            "legendary",
            "jackpot"
        );
    }


    function resetBoxVisual() {
        clearPrizeClasses();

        elements.mainBox?.classList.remove(
            "opening",
            "opened",
            "shaking",
            "reward-ready"
        );

        elements.boxLid?.classList.remove(
            "opening",
            "opened"
        );

        elements.boxBody?.classList.remove(
            "opening",
            "opened"
        );

        elements.insideLight?.classList.remove(
            "active",
            "show"
        );

        elements.explosionEffect?.classList.remove(
            "active",
            "show"
        );

        elements.coinEffect?.classList.remove(
            "active",
            "show"
        );
    }


    function resetMystery() {
        clearTimers();

        state.status = "idle";
        state.selectedReward = null;
        state.rewardClaimed = false;

        resetBoxVisual();

        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.openingOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.jackpotOverlay);
        hideOverlay(elements.claimConfirmOverlay);

        if (elements.processIcon) {
            elements.processIcon.textContent = "✨";
        }

        if (elements.processText) {
            elements.processText.textContent =
                "Mystery Box menunggumu.";
        }

        if (elements.openButton) {
            elements.openButton.disabled = false;

            const text =
                elements.openButton.querySelector(
                    ".button-text"
                );

            if (text) {
                text.textContent =
                    "BUKA MYSTERY BOX";
            }
        }
    }


    /* =====================================================
       COUNTDOWN
    ===================================================== */

    function startMysteryBox() {
        if (isBusy()) return;

        resetBoxVisual();

        state.status = "countdown";
        state.rewardClaimed = false;
        state.selectedReward = null;

        if (elements.openButton) {
            elements.openButton.disabled = true;
        }

        if (elements.processIcon) {
            elements.processIcon.textContent = "⏳";
        }

        if (elements.processText) {
            elements.processText.textContent =
                "Bersiap membuka Mystery Box...";
        }

        let countdown =
            MYSTERY_CONFIG.countdownStart;

        if (elements.countdownValue) {
            elements.countdownValue.textContent =
                countdown;
        }

        if (elements.countdownText) {
            elements.countdownText.textContent =
                "Bersiap menemukan hadiahmu!";
        }

        showOverlay(elements.countdownOverlay);

        state.countdownTimer =
            window.setInterval(() => {
                countdown -= 1;

                if (countdown > 0) {
                    if (elements.countdownValue) {
                        elements.countdownValue.textContent =
                            countdown;
                    }

                    if (elements.countdownText) {
                        elements.countdownText.textContent =
                            countdown === 1
                                ? "Mystery Box hampir dibuka!"
                                : "Bersiap menemukan hadiahmu!";
                    }

                    return;
                }

                clearInterval(
                    state.countdownTimer
                );

                state.countdownTimer = null;

                if (elements.countdownValue) {
                    elements.countdownValue.textContent =
                        "GO!";
                }

                if (elements.countdownText) {
                    elements.countdownText.textContent =
                        "Buka kotaknya!";
                }

                window.setTimeout(() => {
                    hideOverlay(
                        elements.countdownOverlay
                    );

                    startOpening();
                }, 450);
            }, MYSTERY_CONFIG.countdownInterval);
    }


    /* =====================================================
       PROSES PEMBUKAAN
    ===================================================== */

    function startOpening() {
        state.status = "opening";
        state.selectedReward =
            selectWeightedReward();

        showOverlay(elements.openingOverlay);

        if (elements.processIcon) {
            elements.processIcon.textContent = "⚡";
        }

        if (elements.processText) {
            elements.processText.textContent =
                "Mystery Box sedang dibuka...";
        }

        elements.mainBox?.classList.add(
            "opening",
            "shaking"
        );

        if (elements.openingText) {
            elements.openingText.textContent =
                "Mencari hadiah keberuntunganmu...";
        }

        let progress = 0;

        if (elements.openingProgress) {
            elements.openingProgress.textContent =
                "0%";
        }

        if (elements.openingProgressBar) {
            elements.openingProgressBar.style.width =
                "0%";
        }

        state.progressTimer =
            window.setInterval(() => {
                progress +=
                    Math.floor(
                        Math.random() * 9
                    ) + 4;

                progress =
                    Math.min(progress, 96);

                if (elements.openingProgress) {
                    elements.openingProgress.textContent =
                        `${progress}%`;
                }

                if (elements.openingProgressBar) {
                    elements.openingProgressBar.style.width =
                        `${progress}%`;
                }

                if (progress >= 96) {
                    clearInterval(
                        state.progressTimer
                    );

                    state.progressTimer = null;
                }
            }, 160);


        window.setTimeout(() => {
            elements.mainBox?.classList.remove(
                "shaking"
            );

            elements.mainBox?.classList.add(
                "opened"
            );

            elements.boxLid?.classList.add(
                "opened"
            );

            elements.boxBody?.classList.add(
                "opened"
            );

            elements.insideLight?.classList.add(
                "active",
                "show"
            );

            elements.explosionEffect?.classList.add(
                "active",
                "show"
            );

            elements.coinEffect?.classList.add(
                "active",
                "show"
            );
        }, 1750);


        state.openingTimer =
            window.setTimeout(() => {
                if (elements.openingProgress) {
                    elements.openingProgress.textContent =
                        "100%";
                }

                if (elements.openingProgressBar) {
                    elements.openingProgressBar.style.width =
                        "100%";
                }

                if (elements.openingText) {
                    elements.openingText.textContent =
                        "Hadiah ditemukan!";
                }

                saveSelectedReward();

                window.setTimeout(() => {
                    hideOverlay(
                        elements.openingOverlay
                    );

                    showRewardResult();
                }, MYSTERY_CONFIG.resultDelay);
            }, MYSTERY_CONFIG.openingDuration);
    }


    /* =====================================================
       SIMPAN HADIAH
    ===================================================== */

    function saveSelectedReward() {
        if (!state.selectedReward) return;

        const record =
            saveReward(state.selectedReward);

        state.selectedReward.recordId =
            record.id;

        updateLobbyReward();
        renderHistory();

        const api = getAPI();

        if (
            api &&
            typeof api.addReward === "function"
        ) {
            api.addReward(
                state.selectedReward.amount,
                {
                    source: "mystery-box",
                    level:
                        state.selectedReward.level
                }
            );
        }

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:rewardwon",
                {
                    detail: {
                        amount:
                            state.selectedReward.amount,
                        reward:
                            state.selectedReward
                    }
                }
            )
        );
    }


    /* =====================================================
       HASIL HADIAH
    ===================================================== */

    function showRewardResult() {
        const reward =
            state.selectedReward;

        if (!reward) {
            showToast(
                "Hadiah gagal diproses.",
                "error"
            );

            resetMystery();
            return;
        }

        state.status = "result";

        clearPrizeClasses();

        elements.screen.classList.add(
            `prize-${reward.level}`
        );

        elements.resultCard?.classList.add(
            reward.level
        );

        if (elements.resultLabel) {
            elements.resultLabel.textContent =
                reward.label;
        }

        if (elements.resultAmount) {
            animateAmount(
                elements.resultAmount,
                reward.amount
            );
        }

        if (elements.resultMessage) {
            elements.resultMessage.textContent =
                reward.message;
        }

        if (elements.resultMember) {
            elements.resultMember.textContent =
                getMemberName();
        }

        if (elements.processIcon) {
            elements.processIcon.textContent =
                reward.level === "jackpot"
                    ? "👑"
                    : "🏆";
        }

        if (elements.processText) {
            elements.processText.textContent =
                `Hadiah ${formatRupiah(
                    reward.amount
                )} berhasil ditemukan!`;
        }

        if (reward.level === "jackpot") {
            showJackpot();
            return;
        }

        createCelebrationParticles(
            reward.level
        );

        showOverlay(elements.resultOverlay);
    }


    function showJackpot() {
        if (elements.jackpotAmount) {
            animateAmount(
                elements.jackpotAmount,
                state.selectedReward.amount
            );
        }

        createCelebrationParticles("jackpot");

        showOverlay(elements.jackpotOverlay);
    }


    function continueFromJackpot() {
        hideOverlay(elements.jackpotOverlay);

        window.setTimeout(() => {
            showOverlay(elements.resultOverlay);
        }, 250);
    }


    /* =====================================================
       ANIMASI NOMINAL
    ===================================================== */

    function animateAmount(
        element,
        targetAmount
    ) {
        if (!element) return;

        const duration = 1400;
        const startTime =
            performance.now();

        function update(currentTime) {
            const elapsed =
                currentTime - startTime;

            const progress =
                Math.min(
                    elapsed / duration,
                    1
                );

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );

            const currentAmount =
                Math.floor(
                    targetAmount * eased
                );

            element.textContent =
                formatRupiah(currentAmount);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent =
                    formatRupiah(targetAmount);
            }
        }

        requestAnimationFrame(update);
    }


    /* =====================================================
       CONFETTI
    ===================================================== */

    function createCelebrationParticles(
        level = "lucky"
    ) {
        const container =
            elements.resultOverlay ||
            document.body;

        const amounts = {
            lucky: 25,
            nice: 30,
            great: 40,
            excellent: 50,
            amazing: 60,
            epic: 75,
            legendary: 95,
            jackpot: 130
        };

        const particleAmount =
            amounts[level] || 30;

        container
            .querySelectorAll(
                ".mystery-js-confetti"
            )
            .forEach((item) =>
                item.remove()
            );

        const fragment =
            document.createDocumentFragment();

        for (
            let index = 0;
            index < particleAmount;
            index += 1
        ) {
            const particle =
                document.createElement("span");

            particle.className =
                "mystery-js-confetti";

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.animationDelay =
                `${Math.random() * 0.9}s`;

            particle.style.animationDuration =
                `${1.8 + Math.random() * 2}s`;

            particle.style.setProperty(
                "--mystery-hue",
                String(
                    Math.floor(
                        Math.random() * 360
                    )
                )
            );

            particle.style.setProperty(
                "--mystery-rotate",
                `${Math.random() * 1080}deg`
            );

            fragment.appendChild(particle);
        }

        container.appendChild(fragment);

        window.setTimeout(() => {
            container
                .querySelectorAll(
                    ".mystery-js-confetti"
                )
                .forEach((item) =>
                    item.remove()
                );
        }, 5000);
    }


    /* =====================================================
       AMBIL HADIAH
    ===================================================== */

    function requestClaimReward() {
        if (
            !state.selectedReward ||
            state.rewardClaimed
        ) {
            showToast(
                "Hadiah ini sudah diproses.",
                "info"
            );

            return;
        }

        if (elements.claimPreviewAmount) {
            elements.claimPreviewAmount.textContent =
                formatRupiah(
                    state.selectedReward.amount
                );
        }

        showOverlay(
            elements.claimConfirmOverlay
        );
    }


    function cancelClaimReward() {
        hideOverlay(
            elements.claimConfirmOverlay
        );
    }


    function confirmClaimReward() {
        if (
            !state.selectedReward ||
            state.rewardClaimed
        ) {
            hideOverlay(
                elements.claimConfirmOverlay
            );

            return;
        }

        state.rewardClaimed = true;

        markLatestRewardClaimed();

        hideOverlay(
            elements.claimConfirmOverlay
        );

        if (elements.claimButton) {
            elements.claimButton.disabled = true;

            const text =
                elements.claimButton.querySelector(
                    ".button-text"
                );

            if (text) {
                text.textContent =
                    "HADIAH SUDAH DIAMBIL";
            }
        }

        renderHistory();

        showToast(
            `${formatRupiah(
                state.selectedReward.amount
            )} berhasil dicatat ke riwayat.`,
            "success",
            3200
        );

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:rewardclaimed",
                {
                    detail: {
                        amount:
                            state.selectedReward.amount
                    }
                }
            )
        );
    }


    /* =====================================================
       LOBBY DAN RIWAYAT
    ===================================================== */

    function updateLobbyReward() {
        const data = readStorage();

        if (elements.lobbyReward) {
            elements.lobbyReward.textContent =
                formatRupiah(
                    data.totalReward
                );
        }

        const api = getAPI();

        if (
            api &&
            typeof api.refreshUI === "function"
        ) {
            api.refreshUI();
        }
    }


    function renderHistory() {
        if (!elements.historyList) return;

        const data = readStorage();

        if (!data.history.length) {
            elements.historyList.innerHTML = `
                <div class="reward-history-empty">
                    Belum ada hadiah hari ini.
                </div>
            `;

            return;
        }

        elements.historyList.innerHTML =
            data.history
                .slice(0, 10)
                .map((item) => {
                    const time =
                        new Date(
                            item.createdAt
                        ).toLocaleTimeString(
                            "id-ID",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        );

                    return `
                        <div class="reward-history-item">
                            <div>
                                <strong>
                                    ${formatRupiah(
                                        item.amount
                                    )}
                                </strong>

                                <small>
                                    ${item.label} • ${time}
                                </small>
                            </div>

                            <span class="${
                                item.claimed
                                    ? "claimed"
                                    : "pending"
                            }">
                                ${
                                    item.claimed
                                        ? "Sudah Diambil"
                                        : "Belum Diambil"
                                }
                            </span>
                        </div>
                    `;
                })
                .join("");
    }


    /* =====================================================
       KEMBALI KE LOBBY
    ===================================================== */

    function returnToLobby() {
        if (isBusy()) {
            showToast(
                "Tunggu proses pembukaan selesai.",
                "warning"
            );

            return;
        }

        clearTimers();

        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.openingOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.jackpotOverlay);
        hideOverlay(elements.claimConfirmOverlay);

        updateLobbyReward();

        const api = getAPI();

        if (
            api &&
            typeof api.backToLobby === "function"
        ) {
            api.backToLobby();
        } else if (
            api &&
            typeof api.showScreen === "function"
        ) {
            api.showScreen("lobby");
        } else {
            document
                .querySelectorAll(".screen")
                .forEach((screen) => {
                    screen.classList.remove(
                        "active"
                    );
                });

            document
                .getElementById("lobbyScreen")
                ?.classList.add("active");
        }

        window.setTimeout(
            resetMystery,
            350
        );
    }


    /* =====================================================
       HELP & SUARA
    ===================================================== */

    function showHelp() {
        showToast(
            "Tekan Buka Mystery Box, tunggu hitungan mundur, lalu hadiah akan dipilih secara otomatis.",
            "info",
            4200
        );
    }


    function toggleSound() {
        state.soundEnabled =
            !state.soundEnabled;

        if (elements.soundIcon) {
            elements.soundIcon.textContent =
                state.soundEnabled
                    ? "🔊"
                    : "🔇";
        }

        getAPI()?.setSound?.(
            state.soundEnabled
        );

        showToast(
            state.soundEnabled
                ? "Suara diaktifkan."
                : "Suara dimatikan.",
            "info"
        );
    }


    /* =====================================================
       SCREEN CHANGE
    ===================================================== */

    function handleScreenChange(event) {
        const screenName =
            event.detail?.screen || "";

        const enteringMystery =
            screenName === "mystery" ||
            screenName === "mystery-box" ||
            screenName === "mysteryBox";

        if (enteringMystery) {
            updateLobbyReward();
            renderHistory();

            if (state.status === "idle") {
                resetMystery();
            }

            return;
        }

        if (isBusy()) {
            clearTimers();
        }
    }


    /* =====================================================
       EVENT LISTENER
    ===================================================== */

    function bindEvents() {
        elements.openButton?.addEventListener(
            "click",
            startMysteryBox
        );

        elements.returnLobbyButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.backButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.helpButton?.addEventListener(
            "click",
            showHelp
        );

        elements.soundButton?.addEventListener(
            "click",
            toggleSound
        );

        elements.continueJackpotButton?.addEventListener(
            "click",
            continueFromJackpot
        );

        elements.claimButton?.addEventListener(
            "click",
            requestClaimReward
        );

        elements.cancelClaimButton?.addEventListener(
            "click",
            cancelClaimReward
        );

        elements.confirmClaimButton?.addEventListener(
            "click",
            confirmClaimReward
        );

        elements.resultLobbyButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.closeResultButton?.addEventListener(
            "click",
            returnToLobby
        );

        elements.claimConfirmOverlay?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.claimConfirmOverlay
                ) {
                    cancelClaimReward();
                }
            }
        );

        document.addEventListener(
            "clickbet:screenchange",
            handleScreenChange
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ClickbetMystery = {
        open: startMysteryBox,
        reset: resetMystery,
        returnLobby,
        updateLobbyReward,
        renderHistory,

        getData() {
            return readStorage();
        },

        getState() {
            return {
                status: state.status,
                rewardClaimed:
                    state.rewardClaimed,
                selectedReward:
                    state.selectedReward
                        ? {
                            ...state.selectedReward
                        }
                        : null
            };
        },

        /*
         * Untuk testing hadiah tertentu.
         * Contoh:
         * ClickbetMystery.testReward(500000)
         */
        testReward(amount) {
            const reward =
                MYSTERY_CONFIG.rewards.find(
                    (item) =>
                        item.amount ===
                        Number(amount)
                );

            if (!reward) {
                console.warn(
                    "Nominal hadiah tidak ditemukan."
                );

                return false;
            }

            clearTimers();

            state.selectedReward = {
                ...reward
            };

            saveSelectedReward();
            showRewardResult();

            return true;
        },

        /*
         * Hapus riwayat Mystery Box.
         */
        clearData() {
            const fresh =
                createDefaultData();

            saveStorage(fresh);
            updateLobbyReward();
            renderHistory();
            resetMystery();

            return fresh;
        }
    };


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {
        bindEvents();
        resetMystery();
        updateLobbyReward();
        renderHistory();

        console.info(
            "[CLICKBET88] JavaScript Part 5 Mystery Box aktif."
        );
    }


    initialize();

})();
/* =========================================================
   CLICKBET88 FESTIVAL KEMERDEKAAN 2026
   JAVASCRIPT PART 6
   FINAL INTEGRATION, DAILY DATA, STATS & MYSTERY ACCESS
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI
    ===================================================== */

    const FINAL_CONFIG = {
        version: "6.0.0",

        maximumDailyTickets: 8,
        ticketCostPerGame: 1,

        storageKey:
            "clickbet88_final_integration_v1",

        mysteryStorageKey:
            "clickbet88_mystery_data_v1",

        games: {
            "panjat-pinang": {
                name: "Panjat Pinang"
            },

            panjat: {
                name: "Panjat Pinang"
            },

            "makan-kerupuk": {
                name: "Makan Kerupuk"
            },

            kerupuk: {
                name: "Makan Kerupuk"
            },

            "lomba-kelereng": {
                name: "Lomba Kelereng"
            },

            kelereng: {
                name: "Lomba Kelereng"
            }
        }
    };


    /* =====================================================
       STATE
    ===================================================== */

    const runtime = {
        initialized: false,
        currentScreen: "",
        previousScreen: "",

        originalUseTicket: null,
        originalAddTicket: null,
        originalRegisterResult: null,
        originalShowScreen: null,

        lastResultSignature: "",
        lastResultTime: 0,

        midnightTimer: null,
        syncTimer: null,
        toastTimer: null
    };


    /* =====================================================
       UTILITAS
    ===================================================== */

    function getTodayKey() {
        const now = new Date();

        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    }


    function createDefaultData() {
        return {
            version: FINAL_CONFIG.version,
            date: getTodayKey(),

            memberId: "",
            tickets: 0,
            ticketsEarnedToday: 0,
            ticketsUsedToday: 0,

            pendingMysteryBoxes: 0,

            statistics: {
                totalPlayed: 0,
                totalWon: 0,
                totalLost: 0,

                games: {
                    panjat: {
                        played: 0,
                        won: 0,
                        lost: 0,
                        bestScore: 0
                    },

                    kerupuk: {
                        played: 0,
                        won: 0,
                        lost: 0,
                        bestScore: 0
                    },

                    kelereng: {
                        played: 0,
                        won: 0,
                        lost: 0,
                        bestScore: 0
                    }
                }
            },

            session: {
                currentGame: "",
                gameStartedAt: null,
                lastScreen: "opening"
            },

            settings: {
                soundEnabled: true,
                reducedEffects: false
            },

            updatedAt: new Date().toISOString()
        };
    }


    function safeNumber(value, fallback = 0) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }


    function clamp(value, minimum, maximum) {
        return Math.min(
            Math.max(
                safeNumber(value),
                minimum
            ),
            maximum
        );
    }


    function formatRupiah(value) {
        return new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        ).format(safeNumber(value));
    }


    function normalizeGameName(gameName) {
        const value =
            String(gameName || "")
                .trim()
                .toLowerCase();

        if (
            value.includes("pinang") ||
            value === "panjat"
        ) {
            return "panjat";
        }

        if (
            value.includes("kerupuk")
        ) {
            return "kerupuk";
        }

        if (
            value.includes("kelereng")
        ) {
            return "kelereng";
        }

        return value;
    }


    function normalizeResult(result) {
        const value =
            String(result || "")
                .trim()
                .toLowerCase();

        return [
            "win",
            "won",
            "winner",
            "menang",
            "success"
        ].includes(value)
            ? "win"
            : "lose";
    }


    function getCoreAPI() {
        return window.ClickbetGame || null;
    }


    /* =====================================================
       PENYIMPANAN
    ===================================================== */

    function saveData(data) {
        try {
            data.updatedAt =
                new Date().toISOString();

            localStorage.setItem(
                FINAL_CONFIG.storageKey,
                JSON.stringify(data)
            );

            return true;
        } catch (error) {
            console.error(
                "[CLICKBET88 Part 6] Gagal menyimpan data:",
                error
            );

            return false;
        }
    }


    function sanitizeData(rawData) {
        const fallback =
            createDefaultData();

        const data = {
            ...fallback,
            ...(rawData || {})
        };

        data.statistics = {
            ...fallback.statistics,
            ...(rawData?.statistics || {})
        };

        data.statistics.games = {
            ...fallback.statistics.games,
            ...(rawData?.statistics?.games || {})
        };

        ["panjat", "kerupuk", "kelereng"]
            .forEach((gameName) => {
                data.statistics.games[gameName] = {
                    ...fallback.statistics.games[
                        gameName
                    ],
                    ...(
                        rawData?.statistics
                            ?.games?.[gameName] ||
                        {}
                    )
                };
            });

        data.session = {
            ...fallback.session,
            ...(rawData?.session || {})
        };

        data.settings = {
            ...fallback.settings,
            ...(rawData?.settings || {})
        };

        data.tickets = clamp(
            data.tickets,
            0,
            FINAL_CONFIG.maximumDailyTickets
        );

        data.ticketsEarnedToday = clamp(
            data.ticketsEarnedToday,
            0,
            FINAL_CONFIG.maximumDailyTickets
        );

        data.ticketsUsedToday =
            Math.max(
                safeNumber(
                    data.ticketsUsedToday
                ),
                0
            );

        data.pendingMysteryBoxes =
            Math.max(
                safeNumber(
                    data.pendingMysteryBoxes
                ),
                0
            );

        return data;
    }


    function readData() {
        try {
            const raw =
                localStorage.getItem(
                    FINAL_CONFIG.storageKey
                );

            if (!raw) {
                const fresh =
                    createDefaultData();

                saveData(fresh);

                return fresh;
            }

            const parsed =
                sanitizeData(
                    JSON.parse(raw)
                );

            if (
                parsed.date !== getTodayKey()
            ) {
                return performDailyReset(
                    parsed,
                    false
                );
            }

            return parsed;
        } catch (error) {
            console.error(
                "[CLICKBET88 Part 6] Data rusak, membuat data baru:",
                error
            );

            const fresh =
                createDefaultData();

            saveData(fresh);

            return fresh;
        }
    }


    /* =====================================================
       RESET HARIAN
    ===================================================== */

    function performDailyReset(
        previousData = readData(),
        notify = true
    ) {
        const fresh =
            createDefaultData();

        /*
         * Data yang tetap disimpan:
         * - member
         * - statistik keseluruhan
         * - pengaturan suara
         *
         * Data yang direset:
         * - tiket
         * - tiket diperoleh/dipakai hari ini
         * - Mystery Box tertunda
         */
        fresh.memberId =
            previousData.memberId || "";

        fresh.statistics =
            previousData.statistics ||
            fresh.statistics;

        fresh.settings =
            previousData.settings ||
            fresh.settings;

        saveData(fresh);
        syncAllUI();

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:dailyreset",
                {
                    detail: {
                        date: fresh.date
                    }
                }
            )
        );

        if (notify) {
            showFinalToast(
                "Data harian telah direset. Tiket kembali ke 0.",
                "info"
            );
        }

        return fresh;
    }


    function scheduleMidnightReset() {
        clearTimeout(
            runtime.midnightTimer
        );

        const now = new Date();

        const nextMidnight =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0,
                0,
                1
            );

        const delay =
            nextMidnight.getTime() -
            now.getTime();

        runtime.midnightTimer =
            window.setTimeout(() => {
                performDailyReset(
                    readData(),
                    true
                );

                scheduleMidnightReset();
            }, delay);
    }


    /* =====================================================
       MEMBER
    ===================================================== */

    function getMemberIdFromPage() {
        const input =
            document.getElementById(
                "memberIdInput"
            );

        if (input?.value?.trim()) {
            return input.value.trim();
        }

        const displayed =
            document.querySelector(
                "[data-user-name]"
            );

        const text =
            displayed?.textContent?.trim();

        if (
            text &&
            !["PLAYER", "MEMBER", "-", "ID"]
                .includes(
                    text.toUpperCase()
                )
        ) {
            return text;
        }

        return "";
    }


    function saveMemberId(memberId) {
        const cleanId =
            String(memberId || "")
                .trim();

        if (!cleanId) {
            return false;
        }

        const data = readData();

        data.memberId = cleanId;

        saveData(data);
        syncAllUI();

        return true;
    }


    function getMemberId() {
        const data = readData();

        return (
            data.memberId ||
            getMemberIdFromPage() ||
            "PLAYER"
        );
    }


    /* =====================================================
       TIKET
    ===================================================== */

    function getTickets() {
        return readData().tickets;
    }


    function addTickets(
        amount = 1,
        reason = "manual"
    ) {
        const requested =
            Math.max(
                Math.floor(
                    safeNumber(amount)
                ),
                0
            );

        if (requested <= 0) {
            return {
                success: false,
                added: 0,
                current: getTickets(),
                reason: "INVALID_AMOUNT"
            };
        }

        const data = readData();

        const availableCapacity =
            FINAL_CONFIG.maximumDailyTickets -
            data.tickets;

        const added =
            Math.min(
                requested,
                availableCapacity
            );

        if (added <= 0) {
            showFinalToast(
                "Tiket hari ini sudah mencapai batas maksimal 8.",
                "warning"
            );

            return {
                success: false,
                added: 0,
                current: data.tickets,
                reason: "DAILY_LIMIT"
            };
        }

        data.tickets += added;

        data.ticketsEarnedToday =
            clamp(
                data.ticketsEarnedToday +
                    added,
                0,
                FINAL_CONFIG
                    .maximumDailyTickets
            );

        saveData(data);
        syncAllUI();

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:ticketchange",
                {
                    detail: {
                        action: "add",
                        amount: added,
                        current: data.tickets,
                        reason
                    }
                }
            )
        );

        return {
            success: true,
            added,
            current: data.tickets,
            reason
        };
    }


    function useTickets(
        amount = FINAL_CONFIG.ticketCostPerGame,
        reason = "game"
    ) {
        const requested =
            Math.max(
                Math.floor(
                    safeNumber(amount)
                ),
                1
            );

        const data = readData();

        if (data.tickets < requested) {
            showFinalToast(
                "Tiket belum tersedia. Kamu membutuhkan 1 tiket untuk bermain.",
                "warning"
            );

            return false;
        }

        data.tickets -= requested;
        data.ticketsUsedToday +=
            requested;

        saveData(data);
        syncAllUI();

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:ticketchange",
                {
                    detail: {
                        action: "use",
                        amount: requested,
                        current: data.tickets,
                        reason
                    }
                }
            )
        );

        return true;
    }


    function setTickets(
        amount,
        reason = "testing"
    ) {
        const data = readData();

        data.tickets =
            clamp(
                Math.floor(
                    safeNumber(amount)
                ),
                0,
                FINAL_CONFIG
                    .maximumDailyTickets
            );

        /*
         * Agar pengujian 8 tiket tidak tertahan
         * oleh nilai earned sebelumnya.
         */
        if (reason === "testing") {
            data.ticketsEarnedToday =
                data.tickets;
        }

        saveData(data);
        syncAllUI();

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:ticketchange",
                {
                    detail: {
                        action: "set",
                        amount: data.tickets,
                        current: data.tickets,
                        reason
                    }
                }
            )
        );

        return data.tickets;
    }


    function getTicketStatus() {
        const data = readData();

        return {
            current: data.tickets,
            maximum:
                FINAL_CONFIG
                    .maximumDailyTickets,
            earnedToday:
                data.ticketsEarnedToday,
            usedToday:
                data.ticketsUsedToday,
            remainingCapacity:
                Math.max(
                    FINAL_CONFIG
                        .maximumDailyTickets -
                    data.tickets,
                    0
                ),
            date: data.date
        };
    }


    /* =====================================================
       STATISTIK GAME
    ===================================================== */

    function registerGameStart(gameName) {
        const normalized =
            normalizeGameName(gameName);

        if (
            !["panjat", "kerupuk", "kelereng"]
                .includes(normalized)
        ) {
            return false;
        }

        const data = readData();

        data.session.currentGame =
            normalized;

        data.session.gameStartedAt =
            new Date().toISOString();

        saveData(data);

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:gamestart",
                {
                    detail: {
                        game: normalized
                    }
                }
            )
        );

        return true;
    }


    function isDuplicateResult(
        gameName,
        result,
        score
    ) {
        const signature =
            `${gameName}:${result}:${score}`;

        const now = Date.now();

        const duplicate =
            runtime.lastResultSignature ===
                signature &&
            now - runtime.lastResultTime <
                1200;

        runtime.lastResultSignature =
            signature;

        runtime.lastResultTime = now;

        return duplicate;
    }


    function registerGameResult(
        gameName,
        result,
        score = 0,
        extra = null
    ) {
        const normalizedGame =
            normalizeGameName(gameName);

        const normalizedResult =
            normalizeResult(result);

        const cleanScore =
            Math.max(
                safeNumber(score),
                0
            );

        if (
            !["panjat", "kerupuk", "kelereng"]
                .includes(normalizedGame)
        ) {
            console.warn(
                "[CLICKBET88 Part 6] Nama game tidak dikenal:",
                gameName
            );

            return false;
        }

        if (
            isDuplicateResult(
                normalizedGame,
                normalizedResult,
                cleanScore
            )
        ) {
            return false;
        }

        const data = readData();

        const stats =
            data.statistics;

        const gameStats =
            stats.games[normalizedGame];

        stats.totalPlayed += 1;
        gameStats.played += 1;

        if (normalizedResult === "win") {
            stats.totalWon += 1;
            gameStats.won += 1;

            /*
             * Setiap kemenangan membuka
             * satu Mystery Box.
             */
            data.pendingMysteryBoxes += 1;
        } else {
            stats.totalLost += 1;
            gameStats.lost += 1;
        }

        gameStats.bestScore =
            Math.max(
                safeNumber(
                    gameStats.bestScore
                ),
                cleanScore
            );

        data.session.currentGame = "";
        data.session.gameStartedAt = null;

        saveData(data);
        syncAllUI();

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:resultregistered",
                {
                    detail: {
                        game:
                            normalizedGame,
                        result:
                            normalizedResult,
                        score:
                            cleanScore,
                        pendingMysteryBoxes:
                            data.pendingMysteryBoxes,
                        extra
                    }
                }
            )
        );

        if (normalizedResult === "win") {
            showFinalToast(
                "Kemenangan tercatat! 1 Mystery Box berhasil dibuka.",
                "success"
            );
        }

        return true;
    }


    function getStatistics() {
        return JSON.parse(
            JSON.stringify(
                readData().statistics
            )
        );
    }


    /* =====================================================
       MYSTERY BOX ACCESS
    ===================================================== */

    function getPendingMysteryBoxes() {
        return readData()
            .pendingMysteryBoxes;
    }


    function canOpenMysteryBox() {
        return (
            getPendingMysteryBoxes() > 0
        );
    }


    function consumeMysteryAccess() {
        const data = readData();

        if (
            data.pendingMysteryBoxes <= 0
        ) {
            showFinalToast(
                "Mystery Box hanya dapat dibuka setelah memenangkan permainan.",
                "warning"
            );

            return false;
        }

        data.pendingMysteryBoxes -= 1;

        saveData(data);
        syncAllUI();

        document.dispatchEvent(
            new CustomEvent(
                "clickbet:mysteryaccessused",
                {
                    detail: {
                        remaining:
                            data
                                .pendingMysteryBoxes
                    }
                }
            )
        );

        return true;
    }


    function grantMysteryAccess(
        amount = 1
    ) {
        const data = readData();

        const granted =
            Math.max(
                Math.floor(
                    safeNumber(amount)
                ),
                0
            );

        data.pendingMysteryBoxes +=
            granted;

        saveData(data);
        syncAllUI();

        return data.pendingMysteryBoxes;
    }


    /* =====================================================
       TOTAL HADIAH
    ===================================================== */

    function readMysteryData() {
        try {
            const raw =
                localStorage.getItem(
                    FINAL_CONFIG
                        .mysteryStorageKey
                );

            if (!raw) {
                return {
                    totalReward: 0,
                    totalOpened: 0,
                    history: []
                };
            }

            const parsed =
                JSON.parse(raw);

            if (
                parsed?.date &&
                parsed.date !==
                    getTodayKey()
            ) {
                return {
                    totalReward: 0,
                    totalOpened: 0,
                    history: []
                };
            }

            return {
                totalReward:
                    safeNumber(
                        parsed?.totalReward
                    ),
                totalOpened:
                    safeNumber(
                        parsed?.totalOpened
                    ),
                history:
                    Array.isArray(
                        parsed?.history
                    )
                        ? parsed.history
                        : []
            };
        } catch {
            return {
                totalReward: 0,
                totalOpened: 0,
                history: []
            };
        }
    }


    /* =====================================================
       SINKRONISASI UI
    ===================================================== */

    function setTextForSelectors(
        selectors,
        value
    ) {
        selectors.forEach((selector) => {
            document
                .querySelectorAll(selector)
                .forEach((element) => {
                    element.textContent =
                        value;
                });
        });
    }


    function syncMemberUI() {
        const memberId =
            getMemberId();

        setTextForSelectors(
            [
                "[data-user-name]",
                "#lobbyMemberName",
                "#pinangMemberName",
                "#kerupukMemberName",
                "#kelerengMemberName",
                "#mysteryResultMember"
            ],
            memberId
        );
    }


    function syncTicketUI() {
        const status =
            getTicketStatus();

        setTextForSelectors(
            [
                "[data-ticket-count]",
                "#remainingTicketValue",
                "#pinangRemainingTicket",
                "#kerupukRemainingTicket",
                "#kelerengRemainingTicket"
            ],
            String(status.current)
        );

        /*
         * Elemen lobby yang menampilkan format 0/8.
         */
        const dailyTicketElements = [
            "#dailyTicketValue",
            "#todayTicketValue",
            "#lobbyTicketValue",
            "[data-daily-ticket]"
        ];

        setTextForSelectors(
            dailyTicketElements,
            `${status.current} / ${status.maximum}`
        );
    }


    function syncStatisticsUI() {
        const stats =
            getStatistics();

        setTextForSelectors(
            [
                "#gamesPlayedValue",
                "#totalGamePlayed",
                "[data-games-played]"
            ],
            String(stats.totalPlayed)
        );

        setTextForSelectors(
            [
                "#gamesWonValue",
                "[data-games-won]"
            ],
            String(stats.totalWon)
        );

        setTextForSelectors(
            [
                "#gamesLostValue",
                "[data-games-lost]"
            ],
            String(stats.totalLost)
        );

        setTextForSelectors(
            [
                "#pendingMysteryValue",
                "[data-pending-mystery]"
            ],
            String(
                getPendingMysteryBoxes()
            )
        );
    }


    function syncRewardUI() {
        const mysteryData =
            readMysteryData();

        setTextForSelectors(
            [
                "#todayRewardValue",
                "#totalRewardToday",
                "[data-total-reward]"
            ],
            formatRupiah(
                mysteryData.totalReward
            )
        );
    }


    function syncMysteryButtons() {
        const available =
            canOpenMysteryBox();

        const openButtons = [
            document.getElementById(
                "openMysteryBoxButton"
            )
        ].filter(Boolean);

        openButtons.forEach((button) => {
            /*
             * Jangan ubah tombol saat animasi
             * Mystery Box sedang berjalan.
             */
            const mysteryState =
                window.ClickbetMystery
                    ?.getState?.();

            const busy = [
                "countdown",
                "opening"
            ].includes(
                mysteryState?.status
            );

            if (!busy) {
                button.disabled =
                    !available;

                button.dataset
                    .mysteryAvailable =
                    String(available);

                button.title =
                    available
                        ? "Buka Mystery Box"
                        : "Menangkan permainan terlebih dahulu";
            }
        });
    }


    function syncAllUI() {
        syncMemberUI();
        syncTicketUI();
        syncStatisticsUI();
        syncRewardUI();
        syncMysteryButtons();
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showFinalToast(
        message,
        type = "info",
        duration = 2800
    ) {
        const existingToast =
            document.getElementById(
                "part6SystemToast"
            );

        existingToast?.remove();

        clearTimeout(
            runtime.toastTimer
        );

        const icons = {
            success: "✓",
            info: "i",
            warning: "!",
            error: "×"
        };

        const toast =
            document.createElement("div");

        toast.id =
            "part6SystemToast";

        toast.className =
            `part6-system-toast ${type}`;

        toast.setAttribute(
            "role",
            "status"
        );

        toast.innerHTML = `
            <span class="part6-toast-icon">
                ${icons[type] || icons.info}
            </span>

            <span class="part6-toast-message"></span>
        `;

        const messageElement =
            toast.querySelector(
                ".part6-toast-message"
            );

        messageElement.textContent =
            message;

        document.body.appendChild(
            toast
        );

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        runtime.toastTimer =
            window.setTimeout(() => {
                toast.classList.remove(
                    "show"
                );

                window.setTimeout(
                    () => toast.remove(),
                    300
                );
            }, duration);
    }


    /* =====================================================
       SCREEN TRACKING
    ===================================================== */

    function detectActiveScreen() {
        const active =
            document.querySelector(
                ".screen.active"
            );

        if (!active) {
            return "";
        }

        return active.id
            .replace(/Screen$/i, "")
            .replace(
                /([a-z])([A-Z])/g,
                "$1-$2"
            )
            .toLowerCase();
    }


    function handleScreenChange(event) {
        const screenName =
            String(
                event.detail?.screen ||
                detectActiveScreen()
            );

        runtime.previousScreen =
            runtime.currentScreen;

        runtime.currentScreen =
            screenName;

        const data = readData();

        data.session.lastScreen =
            screenName;

        saveData(data);
        syncAllUI();

        const game =
            normalizeGameName(screenName);

        if (
            ["panjat", "kerupuk", "kelereng"]
                .includes(game)
        ) {
            registerGameStart(game);
        }
    }


    /* =====================================================
       PROTEKSI MYSTERY BOX
    ===================================================== */

    function protectMysteryOpenButton() {
        const button =
            document.getElementById(
                "openMysteryBoxButton"
            );

        if (!button) return;

        /*
         * Capture mode berjalan sebelum listener
         * dari Part 5.
         */
        button.addEventListener(
            "click",
            (event) => {
                if (
                    !canOpenMysteryBox()
                ) {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    showFinalToast(
                        "Belum ada Mystery Box. Menangkan salah satu permainan terlebih dahulu.",
                        "warning"
                    );

                    return;
                }

                const consumed =
                    consumeMysteryAccess();

                if (!consumed) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            },
            true
        );
    }


    /* =====================================================
       PATCH CORE API
    ===================================================== */

    function installCoreBridge() {
        const api =
            getCoreAPI();

        if (!api) {
            console.warn(
                "[CLICKBET88 Part 6] ClickbetGame belum ditemukan. Bridge akan dicoba kembali."
            );

            window.setTimeout(
                installCoreBridge,
                500
            );

            return;
        }

        if (
            api.__part6Integrated
        ) {
            return;
        }

        runtime.originalUseTicket =
            typeof api.useTicket ===
            "function"
                ? api.useTicket.bind(api)
                : null;

        runtime.originalAddTicket =
            typeof api.addTicket ===
            "function"
                ? api.addTicket.bind(api)
                : null;

        runtime.originalRegisterResult =
            typeof api.registerGameResult ===
            "function"
                ? api.registerGameResult
                    .bind(api)
                : null;

        runtime.originalShowScreen =
            typeof api.showScreen ===
            "function"
                ? api.showScreen.bind(api)
                : null;


        /*
         * API tiket disatukan dengan Part 6.
         */
        api.getTicketStatus =
            getTicketStatus;

        api.addTicket = (
            amount,
            reason
        ) => {
            return addTickets(
                amount,
                reason
            ).success;
        };

        api.setTicket = (
            amount,
            reason
        ) => {
            return setTickets(
                amount,
                reason
            );
        };

        api.useTicket = (
            amount,
            reason
        ) => {
            return useTickets(
                amount,
                reason
            );
        };


        /*
         * Integrasi hasil permainan.
         */
        api.registerGameResult = (
            gameName,
            result,
            score,
            extra
        ) => {
            const registered =
                registerGameResult(
                    gameName,
                    result,
                    score,
                    extra
                );

            /*
             * Fungsi lama tetap dijalankan apabila
             * ada, agar modul sebelumnya tidak putus.
             */
            if (
                runtime
                    .originalRegisterResult
            ) {
                try {
                    runtime
                        .originalRegisterResult(
                            gameName,
                            result,
                            score,
                            extra
                        );
                } catch (error) {
                    console.warn(
                        "[CLICKBET88 Part 6] registerGameResult lama mengalami error:",
                        error
                    );
                }
            }

            return registered;
        };


        /*
         * Sinkronisasi setelah pindah screen.
         */
        if (
            runtime.originalShowScreen
        ) {
            api.showScreen = (
                screenName,
                ...args
            ) => {
                const result =
                    runtime
                        .originalShowScreen(
                            screenName,
                            ...args
                        );

                window.setTimeout(
                    syncAllUI,
                    30
                );

                return result;
            };
        }


        api.refreshUI =
            syncAllUI;

        api.getPlayerData = () => {
            const data = readData();

            return {
                username:
                    getMemberId(),
                memberId:
                    getMemberId(),
                tickets:
                    data.tickets,
                statistics:
                    getStatistics(),
                pendingMysteryBoxes:
                    data
                        .pendingMysteryBoxes
            };
        };

        api.setSound = (
            enabled
        ) => {
            const data = readData();

            data.settings.soundEnabled =
                Boolean(enabled);

            saveData(data);

            document.body.classList.toggle(
                "sound-disabled",
                !data.settings
                    .soundEnabled
            );

            return data.settings
                .soundEnabled;
        };

        api.__part6Integrated =
            true;

        console.info(
            "[CLICKBET88 Part 6] Core bridge berhasil dipasang."
        );
    }


    /* =====================================================
       LOGIN MEMBER
    ===================================================== */

    function bindMemberInput() {
        const input =
            document.getElementById(
                "memberIdInput"
            );

        if (!input) return;

        input.addEventListener(
            "input",
            () => {
                const value =
                    input.value.trim();

                if (value) {
                    saveMemberId(value);
                }
            }
        );

        input.addEventListener(
            "change",
            () => {
                saveMemberId(
                    input.value
                );
            }
        );
    }


    /* =====================================================
       BUTTON GAME
    ===================================================== */

    function bindGameButtons() {
        document
            .querySelectorAll(
                "[data-game]"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    (event) => {
                        if (
                            getTickets() <= 0
                        ) {
                            event.preventDefault();
                            event
                                .stopImmediatePropagation();

                            showFinalToast(
                                "Tiket kamu masih 0. Tambahkan tiket terlebih dahulu untuk bermain.",
                                "warning"
                            );
                        }
                    },
                    true
                );
            });
    }


    /* =====================================================
       AUTO SYNC
    ===================================================== */

    function startAutoSync() {
        clearInterval(
            runtime.syncTimer
        );

        runtime.syncTimer =
            window.setInterval(() => {
                const data =
                    readData();

                if (
                    data.date !==
                    getTodayKey()
                ) {
                    performDailyReset(
                        data,
                        true
                    );

                    return;
                }

                syncAllUI();
            }, 1500);
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ClickbetFinal = {
        version:
            FINAL_CONFIG.version,

        refresh:
            syncAllUI,

        getData() {
            return JSON.parse(
                JSON.stringify(
                    readData()
                )
            );
        },

        getTickets,
        getTicketStatus,

        addTicket(
            amount = 1,
            reason = "manual"
        ) {
            return addTickets(
                amount,
                reason
            );
        },

        setTicket(
            amount = 8,
            reason = "testing"
        ) {
            return setTickets(
                amount,
                reason
            );
        },

        useTicket(
            amount = 1,
            reason = "manual"
        ) {
            return useTickets(
                amount,
                reason
            );
        },

        getStatistics,

        registerResult(
            gameName,
            result,
            score = 0
        ) {
            return registerGameResult(
                gameName,
                result,
                score
            );
        },

        getPendingMysteryBoxes,
        canOpenMysteryBox,

        grantMysteryBox(
            amount = 1
        ) {
            return grantMysteryAccess(
                amount
            );
        },

        resetDaily() {
            return performDailyReset(
                readData(),
                true
            );
        },

        resetEverything() {
            localStorage.removeItem(
                FINAL_CONFIG.storageKey
            );

            localStorage.removeItem(
                FINAL_CONFIG
                    .mysteryStorageKey
            );

            const fresh =
                createDefaultData();

            saveData(fresh);
            syncAllUI();

            return fresh;
        },

        /*
         * Mode testing praktis.
         *
         * ClickbetFinal.enableTesting()
         *
         * Member = TESTPLAYER88
         * Tiket = 8
         * Mystery Box = 1
         */
        enableTesting() {
            saveMemberId(
                "TESTPLAYER88"
            );

            setTickets(
                8,
                "testing"
            );

            grantMysteryAccess(1);

            syncAllUI();

            showFinalToast(
                "Mode testing aktif: 8 tiket dan 1 Mystery Box tersedia.",
                "success"
            );

            return this.getData();
        }
    };


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {
        if (runtime.initialized) {
            return;
        }

        runtime.initialized = true;

        readData();
        bindMemberInput();
        bindGameButtons();
        protectMysteryOpenButton();

        installCoreBridge();
        scheduleMidnightReset();
        startAutoSync();
        syncAllUI();

        document.addEventListener(
            "clickbet:screenchange",
            handleScreenChange
        );

        document.addEventListener(
            "clickbet:rewardwon",
            syncAllUI
        );

        document.addEventListener(
            "clickbet:rewardclaimed",
            syncAllUI
        );

        document.addEventListener(
            "visibilitychange",
            () => {
                if (
                    !document.hidden
                ) {
                    syncAllUI();
                }
            }
        );

        window.addEventListener(
            "storage",
            syncAllUI
        );

        console.info(
            "[CLICKBET88] JavaScript Part 6 Final Integration aktif."
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }

})();
