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
   JAVASCRIPT PART 2
   ENGINE GAME PANJAT PINANG
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI GAME
    ===================================================== */

    const PINANG_CONFIG = {
        duration: 15,
        targetTap: 45,
        ticketCost: 1,
        countdownStart: 3,
        minimumBottom: 8,
        maximumBottom: 78,
        resultDelay: 500
    };


    /* =====================================================
       AMBIL ELEMEN HTML
    ===================================================== */

    const screen = document.getElementById(
        "panjatPinangScreen"
    );

    if (!screen) {
        console.warn(
            "[CLICKBET88] Screen Panjat Pinang tidak ditemukan."
        );

        return;
    }


    const elements = {
        screen,

        backButton:
            document.getElementById("pinangBackButton"),

        pauseButton:
            document.getElementById("pinangPauseButton"),

        soundButton:
            document.getElementById("pinangSoundButton"),

        soundIcon:
            document.getElementById("pinangSoundIcon"),

        timer:
            document.getElementById("pinangTimerValue"),

        progressFill:
            document.getElementById("pinangVerticalProgress"),

        progressMarker:
            document.getElementById("pinangProgressMarker"),

        progressText:
            document.getElementById("pinangProgressValue"),

        tapCount:
            document.getElementById("pinangTapCount"),

        player:
            document.getElementById("pinangPlayer"),

        dust:
            document.getElementById("pinangDustEffect"),

        readyMessage:
            document.getElementById("pinangReadyMessage"),

        startButton:
            document.getElementById("pinangStartButton"),

        tapButton:
            document.getElementById("pinangTapButton"),

        countdownOverlay:
            document.getElementById(
                "pinangCountdownOverlay"
            ),

        countdownValue:
            document.getElementById(
                "pinangCountdownValue"
            ),

        countdownMessage:
            document.getElementById(
                "pinangCountdownMessage"
            ),

        pauseOverlay:
            document.getElementById("pinangPauseOverlay"),

        resumeButton:
            document.getElementById("pinangResumeButton"),

        quitButton:
            document.getElementById("pinangQuitButton"),

        resultOverlay:
            document.getElementById("pinangResultOverlay"),

        resultModal:
            document.getElementById("pinangResultModal"),

        closeResultButton:
            document.getElementById(
                "closePinangResultButton"
            ),

        winContent:
            document.getElementById("pinangWinContent"),

        loseContent:
            document.getElementById("pinangLoseContent"),

        resultRemainingTime:
            document.getElementById(
                "pinangResultRemainingTime"
            ),

        resultTapCount:
            document.getElementById(
                "pinangResultTapCount"
            ),

        loseTapCount:
            document.getElementById(
                "pinangLoseTapCount"
            ),

        loseProgress:
            document.getElementById(
                "pinangLoseProgress"
            ),

        loseTicket:
            document.getElementById(
                "pinangLoseTicket"
            ),

        openMysteryButton:
            document.getElementById(
                "openPinangMysteryButton"
            ),

        winLobbyButton:
            document.getElementById(
                "pinangWinLobbyButton"
            ),

        retryButton:
            document.getElementById(
                "retryPinangButton"
            ),

        loseLobbyButton:
            document.getElementById(
                "pinangLoseLobbyButton"
            ),

        exitOverlay:
            document.getElementById(
                "pinangExitConfirmOverlay"
            ),

        cancelExitButton:
            document.getElementById(
                "cancelPinangExitButton"
            ),

        confirmExitButton:
            document.getElementById(
                "confirmPinangExitButton"
            ),

        toast:
            document.getElementById("pinangToast"),

        toastIcon:
            document.getElementById("pinangToastIcon"),

        toastMessage:
            document.getElementById(
                "pinangToastMessage"
            )
    };


    /* =====================================================
       STATE GAME
    ===================================================== */

    const game = {
        status: "idle",

        tapCount: 0,
        progress: 0,
        timeLeft: PINANG_CONFIG.duration,

        timerId: null,
        countdownId: null,
        toastTimer: null,

        startedAt: null,
        pausedAt: null,

        ticketUsed: false,
        soundEnabled: true
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


    function getClickbetAPI() {
        return window.ClickbetGame || null;
    }


    function getTicketCount() {
        const api = getClickbetAPI();

        if (!api || typeof api.getTicketStatus !== "function") {
            return 0;
        }

        return api.getTicketStatus().current;
    }


    function isGameActive() {
        return game.status === "playing";
    }


    function isGameBusy() {
        return [
            "countdown",
            "playing",
            "paused"
        ].includes(game.status);
    }


    /* =====================================================
       OVERLAY HELPER
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
            if (
                !element.classList.contains("active") &&
                !element.classList.contains("show")
            ) {
                element.hidden = true;
            }
        }, 300);
    }


    /* =====================================================
       TOAST KHUSUS PANJAT PINANG
    ===================================================== */

    function showToast(
        message,
        type = "info",
        duration = 2200
    ) {
        if (!elements.toast || !elements.toastMessage) {
            const api = getClickbetAPI();

            if (api?.notify) {
                api.notify(message, type);
            }

            return;
        }

        clearTimeout(game.toastTimer);

        const iconMap = {
            info: "ℹ️",
            success: "✅",
            warning: "⚠️",
            error: "❌"
        };

        elements.toastIcon.textContent =
            iconMap[type] || iconMap.info;

        elements.toastMessage.textContent = message;

        elements.toast.className =
            `game-toast ${type} show`;

        game.toastTimer = window.setTimeout(() => {
            elements.toast.classList.remove("show");
        }, duration);
    }


    /* =====================================================
       RENDER GAME
    ===================================================== */

    function renderGame() {
        const progress = clamp(game.progress, 0, 100);

        if (elements.timer) {
            elements.timer.textContent =
                formatTime(game.timeLeft);

            elements.timer.classList.toggle(
                "danger",
                game.timeLeft <= 5 &&
                game.status === "playing"
            );
        }


        if (elements.tapCount) {
            elements.tapCount.textContent =
                game.tapCount;
        }


        if (elements.progressText) {
            elements.progressText.textContent =
                `${Math.round(progress)}%`;
        }


        if (elements.progressFill) {
            elements.progressFill.style.height =
                `${progress}%`;
        }


        if (elements.progressMarker) {
            elements.progressMarker.style.bottom =
                `${progress}%`;
        }


        if (elements.player) {
            const movementRange =
                PINANG_CONFIG.maximumBottom -
                PINANG_CONFIG.minimumBottom;

            const playerBottom =
                PINANG_CONFIG.minimumBottom +
                movementRange *
                (progress / 100);

            elements.player.style.bottom =
                `${playerBottom}%`;
        }


        if (elements.tapButton) {
            elements.tapButton.disabled =
                game.status !== "playing";
        }


        if (elements.startButton) {
            elements.startButton.disabled =
                isGameBusy();

            const startText =
                elements.startButton.querySelector(
                    ".start-button-text"
                );

            if (startText) {
                if (game.status === "idle") {
                    startText.textContent =
                        "MULAI PERMAINAN";
                } else if (game.status === "finished") {
                    startText.textContent =
                        "MAIN LAGI";
                } else {
                    startText.textContent =
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
       RESET TAMPILAN GAME
    ===================================================== */

    function resetGame(options = {}) {
        const {
            preserveTicketStatus = false
        } = options;

        clearGameIntervals();

        game.status = "idle";
        game.tapCount = 0;
        game.progress = 0;
        game.timeLeft = PINANG_CONFIG.duration;
        game.startedAt = null;
        game.pausedAt = null;

        if (!preserveTicketStatus) {
            game.ticketUsed = false;
        }

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Tekan tombol mulai untuk bersiap!";
        }

        elements.player?.classList.remove(
            "climbing",
            "tap",
            "winning",
            "losing",
            "slipping",
            "paused"
        );

        elements.dust?.classList.remove("active");

        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.pauseOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.exitOverlay);

        renderGame();
    }


    function clearGameIntervals() {
        clearInterval(game.timerId);
        clearInterval(game.countdownId);

        game.timerId = null;
        game.countdownId = null;
    }


    /* =====================================================
       CEK DAN GUNAKAN TIKET
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

        if (getTicketCount() < PINANG_CONFIG.ticketCost) {
            showToast(
                "Tiket kamu belum mencukupi untuk bermain.",
                "warning",
                2800
            );

            api.notify?.(
                "Kamu membutuhkan 1 tiket untuk memainkan Panjat Pinang.",
                "warning"
            );

            return false;
        }

        const successful = api.useTicket(
            PINANG_CONFIG.ticketCost
        );

        if (!successful) {
            return false;
        }

        game.ticketUsed = true;

        showToast(
            "1 tiket digunakan. Bersiaplah!",
            "success"
        );

        return true;
    }


    /* =====================================================
       MULAI COUNTDOWN
    ===================================================== */

    function startCountdown() {
        if (isGameBusy()) {
            return;
        }

        if (!consumeTicket()) {
            return;
        }

        resetRoundWithoutReturningTicket();

        game.status = "countdown";

        let countdown =
            PINANG_CONFIG.countdownStart;

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
                "Bersiap, permainan segera dimulai!";
        }

        showOverlay(elements.countdownOverlay);
        renderGame();

        game.countdownId = window.setInterval(() => {
            countdown -= 1;

            if (countdown > 0) {
                if (elements.countdownValue) {
                    elements.countdownValue.textContent =
                        countdown;
                }

                if (elements.countdownMessage) {
                    elements.countdownMessage.textContent =
                        countdown === 1
                            ? "Siap!"
                            : "Bersiap!";
                }

                return;
            }

            clearInterval(game.countdownId);
            game.countdownId = null;

            if (elements.countdownValue) {
                elements.countdownValue.textContent =
                    "GO!";
            }

            if (elements.countdownMessage) {
                elements.countdownMessage.textContent =
                    "Panjat sekarang!";
            }

            window.setTimeout(() => {
                hideOverlay(elements.countdownOverlay);
                startRound();
            }, 500);
        }, 850);
    }


    function resetRoundWithoutReturningTicket() {
        clearGameIntervals();

        game.tapCount = 0;
        game.progress = 0;
        game.timeLeft = PINANG_CONFIG.duration;
        game.startedAt = null;
        game.pausedAt = null;

        elements.player?.classList.remove(
            "climbing",
            "tap",
            "winning",
            "losing",
            "slipping",
            "paused"
        );

        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.pauseOverlay);

        renderGame();
    }


    /* =====================================================
       MULAI PERMAINAN
    ===================================================== */

    function startRound() {
        game.status = "playing";
        game.startedAt = Date.now();

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Tap secepat mungkin sampai mencapai puncak!";
        }

        elements.player?.classList.add("climbing");

        renderGame();

        game.timerId = window.setInterval(() => {
            if (game.status !== "playing") {
                return;
            }

            game.timeLeft = Math.max(
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
        if (!isGameActive()) {
            return;
        }

        game.tapCount += 1;

        game.progress = clamp(
            game.tapCount /
            PINANG_CONFIG.targetTap *
            100,
            0,
            100
        );

        animatePlayerTap();
        animateDust();
        renderGame();

        if (game.tapCount >= PINANG_CONFIG.targetTap) {
            finishGame(true);
        }
    }


    function animatePlayerTap() {
        if (!elements.player) return;

        elements.player.classList.remove("tap");

        void elements.player.offsetWidth;

        elements.player.classList.add("tap");

        window.setTimeout(() => {
            elements.player?.classList.remove("tap");
        }, 130);
    }


    function animateDust() {
        if (!elements.dust) return;

        elements.dust.classList.remove("active");

        void elements.dust.offsetWidth;

        elements.dust.classList.add("active");

        window.setTimeout(() => {
            elements.dust?.classList.remove("active");
        }, 250);
    }


    /* =====================================================
       SELESAI GAME
    ===================================================== */

    function finishGame(isWinner) {
        if (
            game.status !== "playing" &&
            game.status !== "paused"
        ) {
            return;
        }

        clearGameIntervals();

        game.status = "finished";

        elements.player?.classList.remove(
            "climbing",
            "tap",
            "paused"
        );

        if (elements.tapButton) {
            elements.tapButton.disabled = true;
        }

        if (isWinner) {
            game.progress = 100;
            elements.player?.classList.add("winning");

            if (elements.readyMessage) {
                elements.readyMessage.textContent =
                    "Hebat! Kamu berhasil mencapai puncak!";
            }
        } else {
            elements.player?.classList.add(
                "losing",
                "slipping"
            );

            if (elements.readyMessage) {
                elements.readyMessage.textContent =
                    "Waktu habis. Coba lebih cepat lagi!";
            }
        }

        renderGame();

        registerResult(isWinner);

        window.setTimeout(() => {
            showResult(isWinner);
        }, PINANG_CONFIG.resultDelay);
    }


    function registerResult(isWinner) {
        const api = getClickbetAPI();

        if (!api?.registerGameResult) {
            return;
        }

        api.registerGameResult(
            "panjat",
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
            elements.winContent.hidden = !isWinner;
        }

        if (elements.loseContent) {
            elements.loseContent.hidden = isWinner;
        }

        if (isWinner) {
            if (elements.resultRemainingTime) {
                elements.resultRemainingTime.textContent =
                    formatTime(game.timeLeft);
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

            createMiniConfetti();
        } else {
            if (elements.loseTapCount) {
                elements.loseTapCount.textContent =
                    game.tapCount;
            }

            if (elements.loseProgress) {
                elements.loseProgress.textContent =
                    `${Math.round(game.progress)}%`;
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
       CONFETTI SEDERHANA
    ===================================================== */

    function createMiniConfetti() {
        const container =
            elements.resultOverlay;

        if (!container) return;

        container
            .querySelectorAll(".pinang-js-confetti")
            .forEach((item) => item.remove());

        const fragment =
            document.createDocumentFragment();

        for (let index = 0; index < 45; index++) {
            const confetti =
                document.createElement("span");

            confetti.className =
                "pinang-js-confetti";

            confetti.style.setProperty(
                "--confetti-left",
                `${Math.random() * 100}%`
            );

            confetti.style.setProperty(
                "--confetti-delay",
                `${Math.random() * 0.7}s`
            );

            confetti.style.setProperty(
                "--confetti-duration",
                `${1.8 + Math.random() * 1.5}s`
            );

            confetti.style.setProperty(
                "--confetti-rotation",
                `${Math.random() * 720}deg`
            );

            confetti.style.setProperty(
                "--confetti-hue",
                `${Math.floor(Math.random() * 360)}`
            );

            fragment.appendChild(confetti);
        }

        container.appendChild(fragment);

        window.setTimeout(() => {
            container
                .querySelectorAll(".pinang-js-confetti")
                .forEach((item) => item.remove());
        }, 4000);
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
        game.pausedAt = Date.now();

        elements.player?.classList.add("paused");

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
        game.pausedAt = null;

        elements.player?.classList.remove("paused");

        if (elements.readyMessage) {
            elements.readyMessage.textContent =
                "Lanjutkan tap sampai mencapai puncak!";
        }

        hideOverlay(elements.pauseOverlay);
        renderGame();
    }


    /* =====================================================
       KELUAR GAME
    ===================================================== */

    function requestExit() {
        if (isGameBusy()) {
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
        clearGameIntervals();

        hideOverlay(elements.pauseOverlay);
        hideOverlay(elements.countdownOverlay);
        hideOverlay(elements.resultOverlay);
        hideOverlay(elements.exitOverlay);

        resetGame();

        const api = getClickbetAPI();

        if (api?.backToLobby) {
            api.backToLobby();
        }
    }


    /* =====================================================
       RESULT ACTION
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

        if (!api?.showScreen) {
            return;
        }

        /*
         * Kemenangan membuka akses ke Mystery Box.
         * Logika hadiah lengkap dibuat pada Part Mystery Box.
         */
        api.showScreen("mystery");

        api.notify?.(
            "Mystery Box terbuka. Sistem hadiah akan diaktifkan pada Part berikutnya.",
            "success"
        );
    }


    /* =====================================================
       SOUND
    ===================================================== */

    function toggleSound() {
        game.soundEnabled = !game.soundEnabled;

        if (elements.soundIcon) {
            elements.soundIcon.textContent =
                game.soundEnabled ? "🔊" : "🔇";
        }

        const api = getClickbetAPI();

        api?.setSound?.(game.soundEnabled);

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
        const activeScreen =
            document.body.dataset.activeScreen;

        if (activeScreen !== "panjat") {
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
            isGameBusy()
        ) {
            requestExit();
        }
    }


    /* =====================================================
       SCREEN CHANGE
    ===================================================== */

    function handleScreenChange(event) {
        const screenName =
            event.detail?.screen;

        if (screenName === "panjat") {
            renderGame();
            return;
        }

        if (isGameBusy()) {
            clearGameIntervals();
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
                if (isGameBusy()) {
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
                if (event.target === elements.resultOverlay) {
                    closeResult();
                }
            }
        );

        elements.exitOverlay?.addEventListener(
            "click",
            (event) => {
                if (event.target === elements.exitOverlay) {
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
       PUBLIC API PANJAT PINANG
    ===================================================== */

    window.ClickbetPinang = {
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
            "[CLICKBET88] JavaScript Part 2 Panjat Pinang aktif."
        );
    }


    initialize();

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
