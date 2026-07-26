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
