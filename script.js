/* =========================================================
   CLICKBET88 FESTIVAL KEMERDEKAAN 2026
   JAVASCRIPT BARU — PART 1
   CORE ENGINE + LOGIN + LOBBY + STORAGE
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. KONFIGURASI
  ========================================================= */

  const CONFIG = Object.freeze({
    version: "9.0.0",
    storageKey: "clickbet88_festival_2026_v9",

    maximumTickets: 8,
    ticketCostPerGame: 1,

    loadingDuration: 1500,
    screenTransitionDuration: 280,
    toastDuration: 2800,

    minimumMemberLength: 3,
    maximumMemberLength: 24,

    screenIds: Object.freeze({
      opening: "openingScreen",
      login: "loginScreen",
      lobby: "lobbyScreen",
      pinang: "panjatPinangScreen",
      kerupuk: "kerupukScreen",
      kelereng: "kelerengScreen",
      mystery: "mysteryScreen"
    }),

    gameScreens: Object.freeze({
      "panjat-pinang": "pinang",
      "makan-kerupuk": "kerupuk",
      "lomba-kelereng": "kelereng"
    })
  });


  /* =========================================================
     2. HELPER DOM
  ========================================================= */

  const $ = (id) => document.getElementById(id);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  function on(element, eventName, handler, options) {
    if (!element) {
      return;
    }

    element.addEventListener(
      eventName,
      handler,
      options
    );
  }

  function setText(elementOrId, value) {
    const element =
      typeof elementOrId === "string"
        ? $(elementOrId)
        : elementOrId;

    if (element) {
      element.textContent = String(value);
    }
  }

  function setDisabled(elementOrId, disabled) {
    const element =
      typeof elementOrId === "string"
        ? $(elementOrId)
        : elementOrId;

    if (element) {
      element.disabled = Boolean(disabled);
    }
  }

  function clamp(value, minimum, maximum) {
    return Math.min(
      Math.max(Number(value) || 0, minimum),
      maximum
    );
  }

  function safeInteger(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.floor(number);
  }

  function formatRupiah(value) {
    const number = Math.max(
      safeInteger(value),
      0
    );

    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
      }
    ).format(number);
  }

  function getTodayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function deepClone(value) {
    if (
      typeof structuredClone === "function"
    ) {
      return structuredClone(value);
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }


  /* =========================================================
     3. STATE DEFAULT
  ========================================================= */

  function createDefaultState() {
    return {
      version: CONFIG.version,

      activeScreen: "opening",

      user: {
        loggedIn: false,
        memberId: ""
      },

      settings: {
        soundEnabled: true,
        reducedEffects: false
      },

      daily: {
        dateKey: getTodayKey(),
        tickets: CONFIG.maximumTickets,
        ticketsUsed: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalReward: 0
      },

      mystery: {
        unlocked: false,
        availableBoxes: 0,
        lastReward: 0
      },

      gameProgress: {
        pinang: {
          played: 0,
          won: 0
        },

        kerupuk: {
          played: 0,
          won: 0
        },

        kelereng: {
          played: 0,
          won: 0
        }
      },

      rewards: []
    };
  }

  let state = createDefaultState();


  /* =========================================================
     4. LOCAL STORAGE
  ========================================================= */

  function normalizeState(savedState) {
    const defaults = createDefaultState();

    if (
      !savedState ||
      typeof savedState !== "object"
    ) {
      return defaults;
    }

    const normalized = {
      ...defaults,
      ...savedState,

      user: {
        ...defaults.user,
        ...(savedState.user || {})
      },

      settings: {
        ...defaults.settings,
        ...(savedState.settings || {})
      },

      daily: {
        ...defaults.daily,
        ...(savedState.daily || {})
      },

      mystery: {
        ...defaults.mystery,
        ...(savedState.mystery || {})
      },

      gameProgress: {
        pinang: {
          ...defaults.gameProgress.pinang,
          ...(savedState.gameProgress?.pinang || {})
        },

        kerupuk: {
          ...defaults.gameProgress.kerupuk,
          ...(savedState.gameProgress?.kerupuk || {})
        },

        kelereng: {
          ...defaults.gameProgress.kelereng,
          ...(savedState.gameProgress?.kelereng || {})
        }
      },

      rewards: Array.isArray(
        savedState.rewards
      )
        ? savedState.rewards
        : []
    };

    normalized.daily.tickets = clamp(
      safeInteger(
        normalized.daily.tickets,
        CONFIG.maximumTickets
      ),
      0,
      CONFIG.maximumTickets
    );

    normalized.daily.ticketsUsed = Math.max(
      safeInteger(
        normalized.daily.ticketsUsed
      ),
      0
    );

    normalized.daily.gamesPlayed = Math.max(
      safeInteger(
        normalized.daily.gamesPlayed
      ),
      0
    );

    normalized.daily.gamesWon = Math.max(
      safeInteger(
        normalized.daily.gamesWon
      ),
      0
    );

    normalized.daily.gamesLost = Math.max(
      safeInteger(
        normalized.daily.gamesLost
      ),
      0
    );

    normalized.daily.totalReward = Math.max(
      safeInteger(
        normalized.daily.totalReward
      ),
      0
    );

    normalized.mystery.availableBoxes =
      Math.max(
        safeInteger(
          normalized.mystery.availableBoxes
        ),
        0
      );

    normalized.mystery.unlocked =
      normalized.mystery.availableBoxes > 0;

    normalized.user.loggedIn =
      Boolean(normalized.user.loggedIn);

    normalized.user.memberId =
      sanitizeMemberId(
        normalized.user.memberId
      );

    normalized.settings.soundEnabled =
      normalized.settings.soundEnabled !== false;

    return normalized;
  }

  function loadState() {
    try {
      const rawData = localStorage.getItem(
        CONFIG.storageKey
      );

      if (!rawData) {
        state = createDefaultState();
        return;
      }

      const parsedData = JSON.parse(rawData);

      state = normalizeState(parsedData);
    } catch (error) {
      console.warn(
        "[CLICKBET88] Data penyimpanan rusak. Menggunakan data baru.",
        error
      );

      state = createDefaultState();
    }
  }

  function saveState() {
    state.version = CONFIG.version;

    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(state)
      );

      return true;
    } catch (error) {
      console.error(
        "[CLICKBET88] Gagal menyimpan progres.",
        error
      );

      return false;
    }
  }

  function resetDailyDataIfNeeded() {
    const todayKey = getTodayKey();

    if (
      state.daily.dateKey === todayKey
    ) {
      return false;
    }

    state.daily = {
      dateKey: todayKey,
      tickets: CONFIG.maximumTickets,
      ticketsUsed: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalReward: 0
    };

    state.mystery = {
      unlocked: false,
      availableBoxes: 0,
      lastReward: 0
    };

    state.gameProgress = {
      pinang: {
        played: 0,
        won: 0
      },

      kerupuk: {
        played: 0,
        won: 0
      },

      kelereng: {
        played: 0,
        won: 0
      }
    };

    state.rewards = [];

    saveState();

    return true;
  }


  /* =========================================================
     5. SCREEN MANAGER
  ========================================================= */

  let screenTransitionLocked = false;

  function getScreen(screenName) {
    const screenId =
      CONFIG.screenIds[screenName];

    if (!screenId) {
      return null;
    }

    return $(screenId);
  }

  function closeAllGlobalOverlays() {
    const overlays = $$(
      [
        ".confirmation-overlay",
        ".terms-overlay",
        ".game-result-overlay",
        ".reward-result-overlay",
        ".jackpot-overlay",
        ".game-countdown-overlay",
        ".game-pause-overlay",
        ".mystery-countdown-overlay",
        ".mystery-opening-overlay",
        ".reward-rolling-overlay"
      ].join(",")
    );

    overlays.forEach((overlay) => {
      overlay.setAttribute(
        "aria-hidden",
        "true"
      );
    });

    document.body.classList.remove(
      "no-scroll"
    );
  }

  function showScreen(
    screenName,
    options = {}
  ) {
    const {
      save = true,
      scrollTop = true,
      force = false
    } = options;

    const targetScreen =
      getScreen(screenName);

    if (!targetScreen) {
      console.warn(
        `[CLICKBET88] Screen "${screenName}" tidak ditemukan.`
      );

      return false;
    }

    if (
      screenTransitionLocked &&
      !force
    ) {
      return false;
    }

    const currentScreen =
      $(".screen.active");

    if (
      currentScreen === targetScreen
    ) {
      targetScreen.setAttribute(
        "aria-hidden",
        "false"
      );

      return true;
    }

    screenTransitionLocked = true;

    closeAllGlobalOverlays();

    $$(".screen").forEach((screen) => {
      if (screen !== currentScreen) {
        screen.classList.remove(
          "active",
          "is-leaving"
        );

        screen.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    });

    if (currentScreen) {
      currentScreen.classList.add(
        "is-leaving"
      );
    }

    window.setTimeout(() => {
      if (currentScreen) {
        currentScreen.classList.remove(
          "active",
          "is-leaving"
        );

        currentScreen.setAttribute(
          "aria-hidden",
          "true"
        );
      }

      targetScreen.classList.remove(
        "is-leaving"
      );

      targetScreen.classList.add(
        "active"
      );

      targetScreen.setAttribute(
        "aria-hidden",
        "false"
      );

      state.activeScreen = screenName;

      if (save) {
        saveState();
      }

      renderAll();

      if (scrollTop) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant"
        });
      }

      screenTransitionLocked = false;

      document.dispatchEvent(
        new CustomEvent(
          "clickbet:screenchange",
          {
            detail: {
              screen: screenName
            }
          }
        )
      );
    }, currentScreen
      ? CONFIG.screenTransitionDuration
      : 0
    );

    return true;
  }

  function returnToLobby() {
    if (!state.user.loggedIn) {
      showScreen("login");
      return false;
    }

    showScreen("lobby");

    return true;
  }


  /* =========================================================
     6. OVERLAY MANAGER
  ========================================================= */

  function openOverlay(elementOrId) {
    const overlay =
      typeof elementOrId === "string"
        ? $(elementOrId)
        : elementOrId;

    if (!overlay) {
      return false;
    }

    overlay.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "no-scroll"
    );

    return true;
  }

  function closeOverlay(elementOrId) {
    const overlay =
      typeof elementOrId === "string"
        ? $(elementOrId)
        : elementOrId;

    if (!overlay) {
      return false;
    }

    overlay.setAttribute(
      "aria-hidden",
      "true"
    );

    const openOverlayExists =
      $$('[aria-hidden="false"]').some(
        (element) =>
          element.classList.contains(
            "confirmation-overlay"
          ) ||
          element.classList.contains(
            "terms-overlay"
          ) ||
          element.classList.contains(
            "game-result-overlay"
          )
      );

    if (!openOverlayExists) {
      document.body.classList.remove(
        "no-scroll"
      );
    }

    return true;
  }


  /* =========================================================
     7. TOAST
  ========================================================= */

  let toastTimer = null;

  function getMainToastElements() {
    const toast =
      $("rewardToast") ||
      $(".game-toast");

    if (!toast) {
      return {
        toast: null,
        icon: null,
        message: null
      };
    }

    const icon =
      $("rewardToastIcon") ||
      toast.querySelector("span");

    const message =
      $("rewardToastMessage") ||
      toast.querySelector("p");

    return {
      toast,
      icon,
      message
    };
  }

  function notify(
    message,
    type = "info",
    duration = CONFIG.toastDuration
  ) {
    const {
      toast,
      icon,
      message: messageElement
    } = getMainToastElements();

    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      ticket: "🎫",
      reward: "🏆",
      sound: "🔊"
    };

    if (!toast) {
      console.log(
        `[CLICKBET88] ${message}`
      );

      return;
    }

    clearTimeout(toastTimer);

    setText(
      icon,
      icons[type] || icons.info
    );

    setText(
      messageElement,
      message
    );

    toast.dataset.type = type;
    toast.classList.remove("show");

    void toast.offsetWidth;

    toast.classList.add("show");

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, Math.max(duration, 800));
  }


  /* =========================================================
     8. MEMBER DAN LOGIN
  ========================================================= */

  function sanitizeMemberId(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(
        0,
        CONFIG.maximumMemberLength
      );
  }

  function validateMemberId(value) {
    const cleanValue =
      sanitizeMemberId(value);

    if (!cleanValue) {
      return {
        valid: false,
        value: "",
        message:
          "ID member wajib diisi."
      };
    }

    if (
      cleanValue.length <
      CONFIG.minimumMemberLength
    ) {
      return {
        valid: false,
        value: cleanValue,
        message:
          `ID member minimal ${CONFIG.minimumMemberLength} karakter.`
      };
    }

    if (
      cleanValue.length >
      CONFIG.maximumMemberLength
    ) {
      return {
        valid: false,
        value: cleanValue,
        message:
          `ID member maksimal ${CONFIG.maximumMemberLength} karakter.`
      };
    }

    return {
      valid: true,
      value: cleanValue,
      message:
        "ID member siap digunakan."
    };
  }

  function renderLoginValidation() {
    const input =
      $("memberIdInput");

    const agreement =
      $("termsAgreementInput");

    const loginButton =
      $("loginButton");

    const messageElement =
      $("memberInputMessage");

    if (!input) {
      return false;
    }

    const validation =
      validateMemberId(input.value);

    const wrapper =
      input.closest(".input-wrapper");

    if (wrapper) {
      wrapper.classList.toggle(
        "is-valid",
        validation.valid
      );
    }

    if (messageElement) {
      messageElement.textContent =
        validation.message;

      messageElement.classList.toggle(
        "error",
        Boolean(input.value) &&
        !validation.valid
      );
    }

    const formValid =
      validation.valid &&
      Boolean(agreement?.checked);

    if (loginButton) {
      loginButton.disabled =
        !formValid;
    }

    return formValid;
  }

  function login(memberId) {
    const validation =
      validateMemberId(memberId);

    if (!validation.valid) {
      notify(
        validation.message,
        "error"
      );

      return false;
    }

    const agreement =
      $("termsAgreementInput");

    if (
      agreement &&
      !agreement.checked
    ) {
      notify(
        "Setujui Syarat & Ketentuan terlebih dahulu.",
        "warning"
      );

      return false;
    }

    state.user.loggedIn = true;
    state.user.memberId =
      validation.value;

    state.activeScreen = "lobby";

    saveState();
    renderAll();

    showScreen("lobby");

    notify(
      `Selamat datang, ${validation.value}!`,
      "success"
    );

    playInterfaceSound("success");

    document.dispatchEvent(
      new CustomEvent(
        "clickbet:login",
        {
          detail: {
            memberId:
              validation.value
          }
        }
      )
    );

    return true;
  }

  function logout() {
    state.user.loggedIn = false;
    state.activeScreen = "login";

    saveState();

    const input =
      $("memberIdInput");

    const agreement =
      $("termsAgreementInput");

    if (input) {
      input.value =
        state.user.memberId;
    }

    if (agreement) {
      agreement.checked = false;
    }

    closeAllGlobalOverlays();
    renderLoginValidation();
    showScreen("login");

    notify(
      "Kamu telah keluar dari festival.",
      "info"
    );

    document.dispatchEvent(
      new CustomEvent(
        "clickbet:logout"
      )
    );

    return true;
  }


  /* =========================================================
     9. SISTEM TIKET
  ========================================================= */

  function getTickets() {
    return state.daily.tickets;
  }

  function hasTickets(
    amount = CONFIG.ticketCostPerGame
  ) {
    const required = Math.max(
      safeInteger(amount, 1),
      1
    );

    return (
      state.daily.tickets >= required
    );
  }

  function useTicket(
    amount = CONFIG.ticketCostPerGame,
    reason = "game"
  ) {
    const requested = Math.max(
      safeInteger(amount, 1),
      1
    );

    if (!hasTickets(requested)) {
      notify(
        "Tiket tidak cukup untuk memainkan game ini.",
        "warning"
      );

      playInterfaceSound("error");

      return false;
    }

    state.daily.tickets -= requested;
    state.daily.ticketsUsed += requested;

    saveState();
    renderAll();

    document.dispatchEvent(
      new CustomEvent(
        "clickbet:ticketchange",
        {
          detail: {
            action: "use",
            amount: requested,
            current:
              state.daily.tickets,
            reason
          }
        }
      )
    );

    return true;
  }

  function addTicket(
    amount = 1,
    reason = "bonus"
  ) {
    const requested = Math.max(
      safeInteger(amount, 1),
      1
    );

    const previousTickets =
      state.daily.tickets;

    state.daily.tickets = clamp(
      previousTickets + requested,
      0,
      CONFIG.maximumTickets
    );

    const added =
      state.daily.tickets -
      previousTickets;

    if (added <= 0) {
      notify(
        "Jumlah tiket sudah mencapai batas maksimum.",
        "warning"
      );

      return 0;
    }

    saveState();
    renderAll();

    notify(
      `${added} tiket berhasil ditambahkan.`,
      "ticket"
    );

    document.dispatchEvent(
      new CustomEvent(
        "clickbet:ticketchange",
        {
          detail: {
            action: "add",
            amount: added,
            current:
              state.daily.tickets,
            reason
          }
        }
      )
    );

    return added;
  }


  /* =========================================================
     10. HASIL GAME
  ========================================================= */

  function normalizeGameName(gameName) {
    const map = {
      pinang: "pinang",
      "panjat-pinang": "pinang",
      panjatPinang: "pinang",

      kerupuk: "kerupuk",
      "makan-kerupuk": "kerupuk",
      makanKerupuk: "kerupuk",

      kelereng: "kelereng",
      "lomba-kelereng": "kelereng",
      lombaKelereng: "kelereng"
    };

    return map[gameName] || null;
  }

  function registerGameResult(
    gameName,
    result,
    details = {}
  ) {
    const normalizedGame =
      normalizeGameName(gameName);

    if (!normalizedGame) {
      console.warn(
        "[CLICKBET88] Nama game tidak valid:",
        gameName
      );

      return false;
    }

    const won =
      result === "win" ||
      result === "won" ||
      result === true;

    state.daily.gamesPlayed += 1;

    state.gameProgress[
      normalizedGame
    ].played += 1;

    if (won) {
      state.daily.gamesWon += 1;

      state.gameProgress[
        normalizedGame
      ].won += 1;

      state.mystery.availableBoxes += 1;
      state.mystery.unlocked = true;
    } else {
      state.daily.gamesLost += 1;
    }

    saveState();
    renderAll();

    document.dispatchEvent(
      new CustomEvent(
        "clickbet:gameresult",
        {
          detail: {
            game: normalizedGame,
            result: won
              ? "win"
              : "lose",
            ...details
          }
        }
      )
    );

    return true;
  }

  function addReward(
    amount,
    source = "mystery"
  ) {
    const rewardAmount = Math.max(
      safeInteger(amount),
      0
    );

    if (rewardAmount <= 0) {
      return false;
    }

    const rewardItem = {
      id:
        `${Date.now()}_${Math.random()
          .toString(16)
          .slice(2)}`,

      amount: rewardAmount,
      source,
      claimed: false,
      createdAt:
        new Date().toISOString()
    };

    state.rewards.unshift(
      rewardItem
    );

    state.daily.totalReward +=
      rewardAmount;

    state.mystery.lastReward =
      rewardAmount;

    saveState();
    renderAll();

    return rewardItem;
  }


  /* =========================================================
     11. SOUND ENGINE RINGAN
  ========================================================= */

  let audioContext = null;

  function getAudioContext() {
    if (!state.settings.soundEnabled) {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContext) {
      audioContext =
        new AudioContextClass();
    }

    if (
      audioContext.state === "suspended"
    ) {
      audioContext.resume().catch(
        () => {}
      );
    }

    return audioContext;
  }

  function playTone(
    frequency = 440,
    duration = 0.07,
    volume = 0.035,
    delay = 0
  ) {
    const context =
      getAudioContext();

    if (!context) {
      return;
    }

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    const startTime =
      context.currentTime + delay;

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      frequency,
      startTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(volume, 0.0001),
      startTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);

    oscillator.stop(
      startTime + duration + 0.02
    );
  }

  function playInterfaceSound(
    type = "click"
  ) {
    if (!state.settings.soundEnabled) {
      return;
    }

    switch (type) {
      case "success":
        playTone(523, 0.09, 0.04);
        playTone(659, 0.1, 0.04, 0.08);
        playTone(784, 0.12, 0.04, 0.16);
        break;

      case "error":
        playTone(220, 0.12, 0.04);
        playTone(165, 0.15, 0.04, 0.1);
        break;

      case "open":
        playTone(440, 0.07, 0.03);
        playTone(660, 0.09, 0.03, 0.06);
        break;

      default:
        playTone(520, 0.045, 0.025);
        break;
    }
  }

  function setSound(enabled) {
    state.settings.soundEnabled =
      Boolean(enabled);

    saveState();
    renderSoundUI();

    if (enabled) {
      playInterfaceSound("open");

      notify(
        "Suara permainan diaktifkan.",
        "sound"
      );
    } else {
      notify(
        "Suara permainan dimatikan.",
        "info"
      );
    }
  }

  function toggleSound() {
    setSound(
      !state.settings.soundEnabled
    );
  }


  /* =========================================================
     12. RENDER UI
  ========================================================= */

  function renderMemberUI() {
    const memberId =
      state.user.memberId ||
      "PLAYER123";

    $$("[data-user-name]").forEach(
      (element) => {
        element.textContent = memberId;
      }
    );

    setText(
      "lobbyMemberName",
      memberId
    );

    const input =
      $("memberIdInput");

    if (
      input &&
      state.user.memberId &&
      !input.value
    ) {
      input.value =
        state.user.memberId;
    }
  }

  function renderTicketUI() {
    const tickets =
      state.daily.tickets;

    setText(
      "remainingTicketValue",
      tickets
    );

    $$("[data-ticket-count]").forEach(
      (element) => {
        element.textContent = tickets;
      }
    );

    const percentage = clamp(
      (
        tickets /
        CONFIG.maximumTickets
      ) * 100,
      0,
      100
    );

    const progressBar =
      $("ticketProgressBar");

    if (progressBar) {
      progressBar.style.width =
        `${percentage}%`;

      progressBar.setAttribute(
        "aria-valuenow",
        String(tickets)
      );

      progressBar.setAttribute(
        "aria-valuemin",
        "0"
      );

      progressBar.setAttribute(
        "aria-valuemax",
        String(
          CONFIG.maximumTickets
        )
      );
    }
  }

  function renderStatisticsUI() {
    setText(
      "todayRewardValue",
      formatRupiah(
        state.daily.totalReward
      )
    );

    setText(
      "playedGameValue",
      state.daily.gamesPlayed
    );
  }

  function renderMysteryLobbyUI() {
    const status =
      $("mysteryBoxLobbyStatus");

    const box =
      $("lobbyMysteryBox");

    const available =
      state.mystery.availableBoxes;

    const unlocked =
      available > 0;

    if (box) {
      box.classList.toggle(
        "locked",
        !unlocked
      );

      box.classList.toggle(
        "unlocked",
        unlocked
      );

      box.setAttribute(
        "aria-disabled",
        String(!unlocked)
      );
    }

    if (status) {
      const statusIcon =
        status.querySelector(
          ":scope > span"
        );

      const statusTitle =
        status.querySelector("strong");

      const statusDescription =
        status.querySelector("small");

      setText(
        statusIcon,
        unlocked ? "🔓" : "🔒"
      );

      setText(
        statusTitle,
        unlocked
          ? `${available} BOX SIAP DIBUKA`
          : "BOX MASIH TERKUNCI"
      );

      setText(
        statusDescription,
        unlocked
          ? "Klik Mystery Box untuk mengambil hadiah."
          : "Menangkan satu permainan terlebih dahulu."
      );

      status.classList.toggle(
        "unlocked",
        unlocked
      );
    }

    const mysteryButtons = [
      $("openMysteryButton"),
      $("openMysteryBoxButton"),
      $("lobbyMysteryButton")
    ].filter(Boolean);

    mysteryButtons.forEach(
      (button) => {
        button.disabled = !unlocked;
      }
    );
  }

  function renderSoundUI() {
    const enabled =
      state.settings.soundEnabled;

    setText(
      "soundToggleIcon",
      enabled ? "🔊" : "🔇"
    );

    setText(
      "soundToggleText",
      enabled
        ? "Suara Aktif"
        : "Suara Mati"
    );

    setText(
      "lobbySoundIcon",
      enabled ? "🔊" : "🔇"
    );

    const soundButtons = [
      $("soundToggleButton"),
      $("lobbySoundButton")
    ].filter(Boolean);

    soundButtons.forEach(
      (button) => {
        button.setAttribute(
          "aria-pressed",
          String(enabled)
        );
      }
    );
  }

  function renderAll() {
    renderMemberUI();
    renderTicketUI();
    renderStatisticsUI();
    renderMysteryLobbyUI();
    renderSoundUI();
    renderLoginValidation();
  }


  /* =========================================================
     13. LOADING SCREEN
  ========================================================= */

  function runLoadingScreen() {
    return new Promise((resolve) => {
      const loadingScreen =
        $("loadingScreen");

      const progressBar =
        $("loadingProgress");

      const loadingText =
        $("loadingText");

      if (!loadingScreen) {
        resolve();
        return;
      }

      loadingScreen.style.display =
        "";

      let progress = 0;

      const startTime =
        performance.now();

      function updateLoading(now) {
        const elapsed =
          now - startTime;

        const rawProgress = clamp(
          (
            elapsed /
            CONFIG.loadingDuration
          ) * 100,
          0,
          100
        );

        progress = Math.max(
          progress,
          Math.round(rawProgress)
        );

        if (progressBar) {
          progressBar.style.width =
            `${progress}%`;
        }

        if (loadingText) {
          loadingText.textContent =
            `${progress}%`;
        }

        if (progress < 100) {
          requestAnimationFrame(
            updateLoading
          );

          return;
        }

        window.setTimeout(() => {
          loadingScreen.classList.add(
            "is-hidden"
          );

          loadingScreen.style.opacity =
            "0";

          loadingScreen.style.pointerEvents =
            "none";

          window.setTimeout(() => {
            loadingScreen.style.display =
              "none";

            resolve();
          }, 350);
        }, 160);
      }

      requestAnimationFrame(
        updateLoading
      );
    });
  }


  /* =========================================================
     14. GAME NAVIGATION
  ========================================================= */

  function openGame(gameName) {
    if (!state.user.loggedIn) {
      notify(
        "Silakan login terlebih dahulu.",
        "warning"
      );

      showScreen("login");

      return false;
    }

    const screenName =
      CONFIG.gameScreens[gameName] ||
      normalizeGameName(gameName);

    if (!screenName) {
      notify(
        "Permainan tidak dikenali.",
        "error"
      );

      return false;
    }

    if (!hasTickets()) {
      notify(
        "Tiketmu sudah habis. Silakan kembali lagi besok.",
        "warning"
      );

      playInterfaceSound("error");

      return false;
    }

    const targetScreen =
      getScreen(screenName);

    if (!targetScreen) {
      notify(
        "Mesin game akan diaktifkan pada part berikutnya.",
        "info"
      );

      return false;
    }

    playInterfaceSound("open");

    document.dispatchEvent(
      new CustomEvent(
        "clickbet:gameopenrequest",
        {
          detail: {
            game: screenName,
            originalName: gameName
          }
        }
      )
    );

    showScreen(screenName);

    return true;
  }

  function openMystery() {
    if (
      state.mystery.availableBoxes <= 0
    ) {
      notify(
        "Mystery Box masih terkunci. Menangkan permainan terlebih dahulu.",
        "warning"
      );

      playInterfaceSound("error");

      return false;
    }

    const mysteryScreen =
      getScreen("mystery");

    if (!mysteryScreen) {
      notify(
        "Mystery Box akan diaktifkan pada part terakhir.",
        "info"
      );

      return false;
    }

    playInterfaceSound("open");
    showScreen("mystery");

    return true;
  }


  /* =========================================================
     15. SYARAT DAN KETENTUAN
  ========================================================= */

  function openTerms() {
    const opened =
      openOverlay("termsOverlay");

    if (opened) {
      playInterfaceSound("open");
    }
  }

  function closeTerms() {
    closeOverlay("termsOverlay");
    playInterfaceSound("click");
  }

  function acceptTerms() {
    const loginAgreement =
      $("termsAgreementInput");

    const modalAgreement =
      $("termsAgreementModalInput") ||
      $("termsAcceptCheckbox");

    if (
      modalAgreement &&
      !modalAgreement.checked
    ) {
      notify(
        "Centang persetujuan terlebih dahulu.",
        "warning"
      );

      return;
    }

    if (loginAgreement) {
      loginAgreement.checked = true;
    }

    closeTerms();
    renderLoginValidation();

    notify(
      "Syarat & Ketentuan telah disetujui.",
      "success"
    );
  }


  /* =========================================================
     16. BIND EVENT LOGIN
  ========================================================= */

  function bindLoginEvents() {
    const input =
      $("memberIdInput");

    const agreement =
      $("termsAgreementInput");

    const form =
      $("loginForm");

    on(input, "input", () => {
      const cursorPosition =
        input.selectionStart;

      const cleanValue =
        sanitizeMemberId(input.value);

      if (
        cleanValue !== input.value
      ) {
        input.value = cleanValue;

        try {
          input.setSelectionRange(
            cursorPosition,
            cursorPosition
          );
        } catch {
          // Tidak perlu tindakan.
        }
      }

      renderLoginValidation();
    });

    on(input, "blur", () => {
      input.value =
        sanitizeMemberId(input.value);

      renderLoginValidation();
    });

    on(agreement, "change", () => {
      renderLoginValidation();
      playInterfaceSound("click");
    });

    on(form, "submit", (event) => {
      event.preventDefault();

      login(input?.value || "");
    });

    on(
      $("enterFestivalButton"),
      "click",
      () => {
        playInterfaceSound("open");
        showScreen("login");

        window.setTimeout(() => {
          $("memberIdInput")?.focus();
        }, 350);
      }
    );

    on(
      $("backToOpeningButton"),
      "click",
      () => {
        playInterfaceSound("click");
        showScreen("opening");
      }
    );
  }


  /* =========================================================
     17. BIND EVENT LOBBY
  ========================================================= */

  function bindLobbyEvents() {
    on(
      $("scrollToGamesButton"),
      "click",
      () => {
        const section =
          $("gameSelectionSection");

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          playInterfaceSound("click");
        }
      }
    );

    on(
      $("playPinangButton"),
      "click",
      () => {
        openGame("panjat-pinang");
      }
    );

    on(
      $("playKerupukButton"),
      "click",
      () => {
        openGame("makan-kerupuk");
      }
    );

    on(
      $("playKelerengButton"),
      "click",
      () => {
        openGame("lomba-kelereng");
      }
    );

    on(
      $("lobbyMysteryBox"),
      "click",
      openMystery
    );

    [
      "openMysteryButton",
      "openMysteryBoxButton",
      "lobbyMysteryButton"
    ].forEach((id) => {
      on($(id), "click", openMystery);
    });

    on(
      $("lobbyMenuButton"),
      "click",
      () => {
        const menu =
          $("lobbySideMenu") ||
          $("lobbyMenuOverlay") ||
          $(".lobby-side-menu");

        if (menu) {
          const isOpen =
            menu.classList.toggle(
              "open"
            );

          menu.setAttribute(
            "aria-hidden",
            String(!isOpen)
          );
        } else {
          notify(
            `Player: ${state.user.memberId} • Tiket: ${state.daily.tickets}/${CONFIG.maximumTickets}`,
            "info"
          );
        }

        playInterfaceSound("click");
      }
    );
  }


  /* =========================================================
     18. BIND SOUND, TERMS DAN LOGOUT
  ========================================================= */

  function bindGlobalEvents() {
    on(
      $("soundToggleButton"),
      "click",
      toggleSound
    );

    on(
      $("lobbySoundButton"),
      "click",
      toggleSound
    );

    on(
      $("openLoginTermsButton"),
      "click",
      openTerms
    );

    on(
      $("openLobbyTermsButton"),
      "click",
      openTerms
    );

    on(
      $("closeTermsButton"),
      "click",
      closeTerms
    );

    [
      "acceptTermsButton",
      "agreeTermsButton",
      "confirmTermsButton"
    ].forEach((id) => {
      on($(id), "click", acceptTerms);
    });

    on(
      $("termsOverlay"),
      "click",
      (event) => {
        if (
          event.target ===
          $("termsOverlay")
        ) {
          closeTerms();
        }
      }
    );

    on(
      $("logoutButton"),
      "click",
      () => {
        const logoutOverlay =
          $("logoutConfirmOverlay");

        if (logoutOverlay) {
          openOverlay(logoutOverlay);
          playInterfaceSound("open");
          return;
        }

        const confirmed =
          window.confirm(
            "Yakin ingin keluar dari akun festival?"
          );

        if (confirmed) {
          logout();
        }
      }
    );

    [
      "cancelLogoutButton",
      "closeLogoutButton"
    ].forEach((id) => {
      on($(id), "click", () => {
        closeOverlay(
          "logoutConfirmOverlay"
        );
      });
    });

    on(
      $("confirmLogoutButton"),
      "click",
      () => {
        closeOverlay(
          "logoutConfirmOverlay"
        );

        logout();
      }
    );

    on(document, "keydown", (event) => {
      if (event.key === "Escape") {
        const termsOverlay =
          $("termsOverlay");

        const logoutOverlay =
          $("logoutConfirmOverlay");

        if (
          termsOverlay?.getAttribute(
            "aria-hidden"
          ) === "false"
        ) {
          closeTerms();
          return;
        }

        if (
          logoutOverlay?.getAttribute(
            "aria-hidden"
          ) === "false"
        ) {
          closeOverlay(
            logoutOverlay
          );
        }
      }
    });

    on(document, "click", (event) => {
      const button =
        event.target.closest("button");

      if (!button) {
        return;
      }

      if (
        button.id ===
          "soundToggleButton" ||
        button.id ===
          "lobbySoundButton"
      ) {
        return;
      }

      if (
        !button.disabled &&
        state.settings.soundEnabled
      ) {
        playInterfaceSound("click");
      }
    });
  }


  /* =========================================================
     19. PUBLIC API UNTUK PART SELANJUTNYA
  ========================================================= */

  window.ClickbetGame = Object.freeze({
    version: CONFIG.version,

    getState() {
      return deepClone(state);
    },

    save: saveState,

    render: renderAll,

    showScreen,

    returnToLobby,

    backToLobby: returnToLobby,

    openGame,

    openMystery,

    login,

    logout,

    notify,

    openOverlay,

    closeOverlay,

    getTickets,

    hasTickets,

    useTicket,

    addTicket,

    registerGameResult,

    addReward,

    formatRupiah,

    playSound:
      playInterfaceSound,

    isSoundEnabled() {
      return (
        state.settings.soundEnabled
      );
    },

    setSound,

    resetAllData() {
      state = createDefaultState();

      saveState();
      renderAll();

      showScreen(
        "opening",
        {
          force: true
        }
      );

      return true;
    }
  });


  /* =========================================================
     20. INITIALIZATION
  ========================================================= */

  async function initialize() {
    try {
      loadState();
      resetDailyDataIfNeeded();

      bindLoginEvents();
      bindLobbyEvents();
      bindGlobalEvents();

      renderAll();

      await runLoadingScreen();

      /*
       * Selalu tampilkan opening dahulu.
       * Setelah menekan "Masuk Festival":
       * - pemain menuju login;
       * - kalau sebelumnya sudah login, login tetap dapat
       *   dilewati lewat fungsi lanjutan nanti.
       */
      showScreen(
        "opening",
        {
          save: false,
          force: true,
          scrollTop: false
        }
      );

      console.info(
        `%cCLICKBET88 FESTIVAL ENGINE ${CONFIG.version} AKTIF`,
        [
          "background:#7b0010",
          "color:#ffd873",
          "padding:8px 12px",
          "font-weight:bold",
          "border-radius:6px"
        ].join(";")
      );

      console.info(
        "[PART 1] Loading, opening, login, lobby, tiket, storage, terms, sound dan logout siap."
      );
    } catch (error) {
      console.error(
        "[CLICKBET88] Gagal menjalankan Part 1:",
        error
      );

      const loadingScreen =
        $("loadingScreen");

      if (loadingScreen) {
        loadingScreen.style.display =
          "none";
      }

      showScreen(
        "opening",
        {
          force: true,
          save: false
        }
      );
    }
  }

  if (
    document.readyState === "loading"
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
/* =========================================================
   CLICKBET88 FESTIVAL KEMERDEKAAN 2026
   JAVASCRIPT BARU — PART 2
   PREMIUM PANJAT PINANG ENGINE
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. KONFIGURASI GAME
  ========================================================= */

  const CONFIG = Object.freeze({
    duration: 15,
    countdown: 3,

    startingProgress: 0,
    winningProgress: 100,

    minimumBottom: 7,
    maximumBottom: 79,

    maximumStamina: 100,
    minimumStamina: 4,
    staminaCost: 6.5,
    staminaRecoveryPerSecond: 18,

    normalClimbPower: 3.2,
    perfectClimbPower: 4.8,
    tiredClimbPower: 1.4,

    minimumTapDelay: 70,
    perfectTimingMinimum: 145,
    perfectTimingMaximum: 390,
    comboResetDelay: 850,
    maximumCombo: 15,

    normalSlipChance: 0.025,
    tiredSlipChance: 0.13,
    slipMinimum: 2,
    slipMaximum: 6,

    resultDelay: 600,
    toastDuration: 1800
  });


  /* =========================================================
     2. HELPER
  ========================================================= */

  const $ = (id) => document.getElementById(id);

  const clamp = (value, minimum, maximum) =>
    Math.min(
      Math.max(Number(value) || 0, minimum),
      maximum
    );

  const random = (minimum, maximum) =>
    minimum + Math.random() * (maximum - minimum);

  const api = () => window.ClickbetGame || null;

  function setText(element, value) {
    if (element) {
      element.textContent = String(value);
    }
  }

  function openOverlay(element) {
    if (!element) {
      return;
    }

    if (api()?.openOverlay) {
      api().openOverlay(element);
      return;
    }

    element.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeOverlay(element) {
    if (!element) {
      return;
    }

    if (api()?.closeOverlay) {
      api().closeOverlay(element);
      return;
    }

    element.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  function playSound(type = "click") {
    api()?.playSound?.(type);
  }

  function notify(message, type = "info") {
    api()?.notify?.(message, type);
  }

  function isSoundEnabled() {
    return api()?.isSoundEnabled?.() !== false;
  }


  /* =========================================================
     3. ELEMEN HTML
  ========================================================= */

  const screen = $("panjatPinangScreen");

  if (!screen) {
    console.warn(
      "[CLICKBET88 PART 2] Screen Panjat Pinang tidak ditemukan."
    );

    return;
  }

  const ELEMENTS = {
    screen,

    stage:
      screen.querySelector(".pinang-stage") ||
      screen.querySelector(".panjat-pinang-stage") ||
      screen.querySelector(".game-stage"),

    pole:
      screen.querySelector(".pinang-pole") ||
      screen.querySelector(".panjat-pinang-pole"),

    player: $("pinangPlayer"),

    playerFace:
      screen.querySelector(
        "#pinangPlayer .player-face"
      ) ||
      screen.querySelector(
        ".pinang-player .player-face"
      ),

    dust: $("pinangDustEffect"),

    timer: $("pinangTimerValue"),

    progressFill:
      $("pinangVerticalProgress"),

    progressMarker:
      $("pinangProgressMarker"),

    progressText:
      $("pinangProgressValue"),

    tapCount:
      $("pinangTapCount"),

    readyMessage:
      $("pinangReadyMessage"),

    staminaFill:
      $("pinangStaminaFill") ||
      $("pinangStaminaBar"),

    staminaText:
      $("pinangStaminaValue"),

    comboValue:
      $("pinangComboValue"),

    bestComboValue:
      $("pinangBestComboValue"),

    scoreValue:
      $("pinangScoreValue"),

    startButton:
      $("pinangStartButton"),

    tapButton:
      $("pinangTapButton"),

    backButton:
      $("pinangBackButton"),

    pauseButton:
      $("pinangPauseButton"),

    soundButton:
      $("pinangSoundButton"),

    soundIcon:
      $("pinangSoundIcon"),

    countdownOverlay:
      $("pinangCountdownOverlay"),

    countdownValue:
      $("pinangCountdownValue"),

    countdownMessage:
      $("pinangCountdownMessage"),

    pauseOverlay:
      $("pinangPauseOverlay"),

    resumeButton:
      $("pinangResumeButton"),

    quitButton:
      $("pinangQuitButton"),

    resultOverlay:
      $("pinangResultOverlay"),

    resultModal:
      $("pinangResultModal"),

    closeResultButton:
      $("closePinangResultButton"),

    winContent:
      $("pinangWinContent"),

    loseContent:
      $("pinangLoseContent"),

    resultRemainingTime:
      $("pinangResultRemainingTime"),

    resultTapCount:
      $("pinangResultTapCount"),

    loseTapCount:
      $("pinangLoseTapCount"),

    loseProgress:
      $("pinangLoseProgress"),

    loseTicket:
      $("pinangLoseTicket"),

    mysteryButton:
      $("openPinangMysteryButton"),

    winLobbyButton:
      $("pinangWinLobbyButton"),

    retryButton:
      $("retryPinangButton"),

    loseLobbyButton:
      $("pinangLoseLobbyButton"),

    exitOverlay:
      $("pinangExitConfirmOverlay"),

    cancelExitButton:
      $("cancelPinangExitButton"),

    confirmExitButton:
      $("confirmPinangExitButton"),

    toast:
      $("pinangToast"),

    toastIcon:
      $("pinangToastIcon"),

    toastMessage:
      $("pinangToastMessage")
  };


  /* =========================================================
     4. STATE GAME
  ========================================================= */

  const STATE = {
    status: "idle",

    progress: 0,
    visualProgress: 0,

    stamina: CONFIG.maximumStamina,

    remainingTime: CONFIG.duration,

    taps: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,

    lastTapTime: 0,
    lastFrameTime: 0,

    ticketUsed: false,
    resultRegistered: false,

    animationFrame: 0,
    countdownTimer: 0,
    resultTimer: 0,
    toastTimer: 0,
    feedbackTimer: 0,

    side: "left"
  };


  /* =========================================================
     5. STATUS HELPER
  ========================================================= */

  function isPlaying() {
    return STATE.status === "playing";
  }

  function isPaused() {
    return STATE.status === "paused";
  }

  function isBusy() {
    return [
      "countdown",
      "playing",
      "paused"
    ].includes(STATE.status);
  }

  function clearTimers() {
    window.clearInterval(
      STATE.countdownTimer
    );

    window.clearTimeout(
      STATE.resultTimer
    );

    window.clearTimeout(
      STATE.toastTimer
    );

    window.clearTimeout(
      STATE.feedbackTimer
    );

    cancelAnimationFrame(
      STATE.animationFrame
    );

    STATE.countdownTimer = 0;
    STATE.resultTimer = 0;
    STATE.animationFrame = 0;
  }


  /* =========================================================
     6. TOAST KHUSUS GAME
  ========================================================= */

  function showGameToast(
    message,
    type = "info"
  ) {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      perfect: "⚡",
      slip: "💦",
      tired: "🥵",
      combo: "🔥"
    };

    if (
      !ELEMENTS.toast ||
      !ELEMENTS.toastMessage
    ) {
      notify(message, type);
      return;
    }

    window.clearTimeout(
      STATE.toastTimer
    );

    setText(
      ELEMENTS.toastIcon,
      icons[type] || icons.info
    );

    setText(
      ELEMENTS.toastMessage,
      message
    );

    ELEMENTS.toast.classList.remove(
      "show"
    );

    void ELEMENTS.toast.offsetWidth;

    ELEMENTS.toast.classList.add(
      "show"
    );

    STATE.toastTimer =
      window.setTimeout(() => {
        ELEMENTS.toast.classList.remove(
          "show"
        );
      }, CONFIG.toastDuration);
  }


  /* =========================================================
     7. RENDER GAME
  ========================================================= */

  function renderTimer() {
    const seconds = Math.max(
      0,
      Math.ceil(STATE.remainingTime)
    );

    setText(
      ELEMENTS.timer,
      seconds
    );

    const timerContainer =
      ELEMENTS.timer?.closest(
        ".game-timer"
      ) ||
      ELEMENTS.timer?.parentElement;

    timerContainer?.classList.toggle(
      "danger",
      seconds <= 5
    );
  }

  function renderProgress() {
    const progress = clamp(
      STATE.visualProgress,
      0,
      100
    );

    setText(
      ELEMENTS.progressText,
      `${Math.floor(STATE.progress)}%`
    );

    if (ELEMENTS.progressFill) {
      ELEMENTS.progressFill.style.height =
        `${progress}%`;

      ELEMENTS.progressFill.style.width =
        `${progress}%`;

      ELEMENTS.progressFill.setAttribute(
        "aria-valuenow",
        String(Math.floor(progress))
      );
    }

    if (ELEMENTS.progressMarker) {
      ELEMENTS.progressMarker.style.bottom =
        `${progress}%`;
    }

    if (ELEMENTS.player) {
      const bottom =
        CONFIG.minimumBottom +
        (
          progress / 100
        ) *
        (
          CONFIG.maximumBottom -
          CONFIG.minimumBottom
        );

      ELEMENTS.player.style.bottom =
        `${bottom}%`;

      ELEMENTS.player.style.setProperty(
        "--pinang-progress",
        `${progress}%`
      );
    }
  }

  function renderStamina() {
    const stamina = clamp(
      STATE.stamina,
      0,
      CONFIG.maximumStamina
    );

    if (ELEMENTS.staminaFill) {
      ELEMENTS.staminaFill.style.width =
        `${stamina}%`;

      ELEMENTS.staminaFill.style.height =
        `${stamina}%`;

      ELEMENTS.staminaFill.classList.toggle(
        "low",
        stamina <= 25
      );
    }

    setText(
      ELEMENTS.staminaText,
      `${Math.round(stamina)}%`
    );
  }

  function renderStatistics() {
    setText(
      ELEMENTS.tapCount,
      STATE.taps
    );

    setText(
      ELEMENTS.comboValue,
      STATE.combo
    );

    setText(
      ELEMENTS.bestComboValue,
      STATE.bestCombo
    );

    setText(
      ELEMENTS.scoreValue,
      Math.floor(STATE.score)
    );
  }

  function renderButtons() {
    if (ELEMENTS.startButton) {
      ELEMENTS.startButton.disabled =
        isBusy();

      ELEMENTS.startButton.hidden =
        isBusy();
    }

    if (ELEMENTS.tapButton) {
      ELEMENTS.tapButton.disabled =
        !isPlaying();

      ELEMENTS.tapButton.classList.toggle(
        "active",
        isPlaying()
      );
    }

    if (ELEMENTS.pauseButton) {
      ELEMENTS.pauseButton.disabled =
        !isPlaying();
    }
  }

  function renderReadyMessage() {
    if (!ELEMENTS.readyMessage) {
      return;
    }

    const messages = {
      idle:
        "Tekan MULAI untuk memulai permainan.",
      countdown:
        "Bersiap! Permainan segera dimulai.",
      playing:
        "Tap cepat dan atur ritme agar tidak kehabisan stamina!",
      paused:
        "Permainan sedang dijeda.",
      win:
        "Berhasil mencapai puncak!",
      lose:
        "Waktu habis. Coba lagi!"
    };

    ELEMENTS.readyMessage.textContent =
      messages[STATE.status] ||
      messages.idle;

    ELEMENTS.readyMessage.dataset.status =
      STATE.status;
  }

  function renderSound() {
    setText(
      ELEMENTS.soundIcon,
      isSoundEnabled()
        ? "🔊"
        : "🔇"
    );
  }

  function renderAll() {
    renderTimer();
    renderProgress();
    renderStamina();
    renderStatistics();
    renderButtons();
    renderReadyMessage();
    renderSound();
  }


  /* =========================================================
     8. RESET GAME
  ========================================================= */

  function resetGame(options = {}) {
    const {
      keepTicket = false
    } = options;

    clearTimers();

    STATE.status = "idle";

    STATE.progress =
      CONFIG.startingProgress;

    STATE.visualProgress =
      CONFIG.startingProgress;

    STATE.stamina =
      CONFIG.maximumStamina;

    STATE.remainingTime =
      CONFIG.duration;

    STATE.taps = 0;
    STATE.combo = 0;
    STATE.bestCombo = 0;
    STATE.score = 0;

    STATE.lastTapTime = 0;
    STATE.lastFrameTime = 0;

    STATE.resultRegistered = false;
    STATE.side = "left";

    if (!keepTicket) {
      STATE.ticketUsed = false;
    }

    closeOverlay(
      ELEMENTS.countdownOverlay
    );

    closeOverlay(
      ELEMENTS.pauseOverlay
    );

    closeOverlay(
      ELEMENTS.resultOverlay
    );

    closeOverlay(
      ELEMENTS.exitOverlay
    );

    ELEMENTS.player?.classList.remove(
      "climbing",
      "perfect",
      "slipping",
      "tired",
      "winner",
      "loser",
      "left-step",
      "right-step"
    );

    ELEMENTS.stage?.classList.remove(
      "playing",
      "paused",
      "winning",
      "losing",
      "danger"
    );

    renderAll();
  }


  /* =========================================================
     9. COUNTDOWN
  ========================================================= */

  function startCountdown() {
    if (isBusy()) {
      return;
    }

    if (!api()) {
      notify(
        "Core Part 1 belum aktif.",
        "error"
      );

      return;
    }

    if (!api().hasTickets?.(1)) {
      showGameToast(
        "Tiket tidak cukup untuk bermain.",
        "warning"
      );

      playSound("error");
      return;
    }

    STATE.status = "countdown";

    renderAll();

    openOverlay(
      ELEMENTS.countdownOverlay
    );

    let count = CONFIG.countdown;

    setText(
      ELEMENTS.countdownValue,
      count
    );

    setText(
      ELEMENTS.countdownMessage,
      "BERSIAP!"
    );

    playSound("open");

    STATE.countdownTimer =
      window.setInterval(() => {
        count -= 1;

        if (count > 0) {
          setText(
            ELEMENTS.countdownValue,
            count
          );

          setText(
            ELEMENTS.countdownMessage,
            count === 1
              ? "SIAP!"
              : "BERSIAP!"
          );

          playSound("click");
          return;
        }

        window.clearInterval(
          STATE.countdownTimer
        );

        setText(
          ELEMENTS.countdownValue,
          "GO!"
        );

        setText(
          ELEMENTS.countdownMessage,
          "PANJAT SEKARANG!"
        );

        playSound("success");

        window.setTimeout(() => {
          closeOverlay(
            ELEMENTS.countdownOverlay
          );

          beginGame();
        }, 500);
      }, 800);
  }


  /* =========================================================
     10. MULAI PERMAINAN
  ========================================================= */

  function beginGame() {
    if (
      !api()?.useTicket?.(
        1,
        "panjat-pinang"
      )
    ) {
      STATE.status = "idle";
      renderAll();
      return;
    }

    STATE.ticketUsed = true;
    STATE.status = "playing";

    STATE.remainingTime =
      CONFIG.duration;

    STATE.lastFrameTime =
      performance.now();

    ELEMENTS.stage?.classList.add(
      "playing"
    );

    renderAll();

    showGameToast(
      "Permainan dimulai! Tap dengan ritme yang tepat.",
      "info"
    );

    STATE.animationFrame =
      requestAnimationFrame(gameLoop);
  }


  /* =========================================================
     11. GAME LOOP
  ========================================================= */

  function gameLoop(timestamp) {
    if (!isPlaying()) {
      return;
    }

    const deltaSeconds = clamp(
      (
        timestamp -
        STATE.lastFrameTime
      ) / 1000,
      0,
      0.08
    );

    STATE.lastFrameTime = timestamp;

    STATE.remainingTime -=
      deltaSeconds;

    STATE.stamina = clamp(
      STATE.stamina +
      CONFIG.staminaRecoveryPerSecond *
      deltaSeconds,
      0,
      CONFIG.maximumStamina
    );

    STATE.visualProgress +=
      (
        STATE.progress -
        STATE.visualProgress
      ) *
      Math.min(
        deltaSeconds * 12,
        1
      );

    if (
      STATE.combo > 0 &&
      timestamp -
        STATE.lastTapTime >
        CONFIG.comboResetDelay
    ) {
      STATE.combo = 0;
    }

    ELEMENTS.player?.classList.toggle(
      "tired",
      STATE.stamina <= 22
    );

    ELEMENTS.stage?.classList.toggle(
      "danger",
      STATE.remainingTime <= 5
    );

    renderAll();

    if (
      STATE.progress >=
      CONFIG.winningProgress
    ) {
      finishGame(true);
      return;
    }

    if (
      STATE.remainingTime <= 0
    ) {
      STATE.remainingTime = 0;
      finishGame(false);
      return;
    }

    STATE.animationFrame =
      requestAnimationFrame(gameLoop);
  }


  /* =========================================================
     12. AKSI MEMANJAT
  ========================================================= */

  function performClimb() {
    if (!isPlaying()) {
      return;
    }

    const now = performance.now();

    const interval =
      STATE.lastTapTime > 0
        ? now - STATE.lastTapTime
        : 300;

    if (
      interval <
      CONFIG.minimumTapDelay
    ) {
      return;
    }

    STATE.lastTapTime = now;
    STATE.taps += 1;

    let climbPower =
      CONFIG.normalClimbPower;

    let feedbackType = "normal";

    if (
      interval >=
        CONFIG.perfectTimingMinimum &&
      interval <=
        CONFIG.perfectTimingMaximum
    ) {
      STATE.combo = clamp(
        STATE.combo + 1,
        0,
        CONFIG.maximumCombo
      );

      STATE.bestCombo = Math.max(
        STATE.bestCombo,
        STATE.combo
      );

      const comboBonus =
        STATE.combo * 0.09;

      climbPower =
        CONFIG.perfectClimbPower +
        comboBonus;

      feedbackType = "perfect";
    } else {
      STATE.combo = Math.max(
        STATE.combo - 1,
        0
      );
    }

    if (
      STATE.stamina <
      CONFIG.minimumStamina
    ) {
      climbPower =
        CONFIG.tiredClimbPower;

      feedbackType = "tired";
    }

    STATE.stamina = clamp(
      STATE.stamina -
        CONFIG.staminaCost,
      0,
      CONFIG.maximumStamina
    );

    const slipChance =
      STATE.stamina <= 20
        ? CONFIG.tiredSlipChance
        : CONFIG.normalSlipChance;

    const slipped =
      Math.random() < slipChance;

    if (slipped) {
      const slipDistance =
        random(
          CONFIG.slipMinimum,
          CONFIG.slipMaximum
        );

      STATE.progress = clamp(
        STATE.progress -
          slipDistance,
        0,
        CONFIG.winningProgress
      );

      STATE.combo = 0;

      animateSlip();

      showGameToast(
        "Tiangnya licin! Kamu sedikit turun.",
        "slip"
      );

      playSound("error");
    } else {
      STATE.progress = clamp(
        STATE.progress +
          climbPower,
        0,
        CONFIG.winningProgress
      );

      STATE.score +=
        Math.round(
          climbPower * 100 +
          STATE.combo * 20
        );

      animateClimb(feedbackType);

      if (feedbackType === "perfect") {
        showTapFeedback(
          STATE.combo >= 3
            ? `COMBO x${STATE.combo}`
            : "PERFECT!",
          STATE.combo >= 3
            ? "combo"
            : "perfect"
        );
      } else if (
        feedbackType === "tired"
      ) {
        showTapFeedback(
          "STAMINA LEMAH",
          "tired"
        );
      }

      playSound(
        feedbackType === "perfect"
          ? "success"
          : "click"
      );
    }

    renderAll();

    if (
      STATE.progress >=
      CONFIG.winningProgress
    ) {
      finishGame(true);
    }
  }


  /* =========================================================
     13. ANIMASI KARAKTER
  ========================================================= */

  function animateClimb(type) {
    if (!ELEMENTS.player) {
      return;
    }

    STATE.side =
      STATE.side === "left"
        ? "right"
        : "left";

    ELEMENTS.player.classList.remove(
      "climbing",
      "perfect",
      "left-step",
      "right-step"
    );

    void ELEMENTS.player.offsetWidth;

    ELEMENTS.player.classList.add(
      "climbing",
      STATE.side === "left"
        ? "left-step"
        : "right-step"
    );

    if (type === "perfect") {
      ELEMENTS.player.classList.add(
        "perfect"
      );
    }

    if (ELEMENTS.dust) {
      ELEMENTS.dust.classList.remove(
        "active"
      );

      void ELEMENTS.dust.offsetWidth;

      ELEMENTS.dust.classList.add(
        "active"
      );
    }

    window.setTimeout(() => {
      ELEMENTS.player?.classList.remove(
        "climbing",
        "perfect"
      );

      ELEMENTS.dust?.classList.remove(
        "active"
      );
    }, 220);
  }

  function animateSlip() {
    if (!ELEMENTS.player) {
      return;
    }

    ELEMENTS.player.classList.remove(
      "slipping"
    );

    void ELEMENTS.player.offsetWidth;

    ELEMENTS.player.classList.add(
      "slipping"
    );

    window.setTimeout(() => {
      ELEMENTS.player?.classList.remove(
        "slipping"
      );
    }, 500);
  }

  function showTapFeedback(
    message,
    type
  ) {
    if (!ELEMENTS.stage) {
      return;
    }

    let feedback =
      ELEMENTS.stage.querySelector(
        ".pinang-live-feedback"
      );

    if (!feedback) {
      feedback =
        document.createElement("div");

      feedback.className =
        "pinang-live-feedback";

      ELEMENTS.stage.appendChild(
        feedback
      );
    }

    window.clearTimeout(
      STATE.feedbackTimer
    );

    feedback.textContent = message;
    feedback.dataset.type = type;

    feedback.classList.remove("show");

    void feedback.offsetWidth;

    feedback.classList.add("show");

    STATE.feedbackTimer =
      window.setTimeout(() => {
        feedback.classList.remove(
          "show"
        );
      }, 550);
  }


  /* =========================================================
     14. PAUSE DAN RESUME
  ========================================================= */

  function pauseGame() {
    if (!isPlaying()) {
      return;
    }

    STATE.status = "paused";

    cancelAnimationFrame(
      STATE.animationFrame
    );

    ELEMENTS.stage?.classList.add(
      "paused"
    );

    openOverlay(
      ELEMENTS.pauseOverlay
    );

    renderAll();
    playSound("click");
  }

  function resumeGame() {
    if (!isPaused()) {
      return;
    }

    STATE.status = "playing";
    STATE.lastFrameTime =
      performance.now();

    ELEMENTS.stage?.classList.remove(
      "paused"
    );

    closeOverlay(
      ELEMENTS.pauseOverlay
    );

    renderAll();
    playSound("open");

    STATE.animationFrame =
      requestAnimationFrame(gameLoop);
  }


  /* =========================================================
     15. SELESAI GAME
  ========================================================= */

  function finishGame(won) {
    if (
      STATE.status === "win" ||
      STATE.status === "lose"
    ) {
      return;
    }

    cancelAnimationFrame(
      STATE.animationFrame
    );

    STATE.status =
      won ? "win" : "lose";

    STATE.remainingTime = Math.max(
      STATE.remainingTime,
      0
    );

    if (won) {
      STATE.progress = 100;
      STATE.visualProgress = 100;

      ELEMENTS.player?.classList.add(
        "winner"
      );

      ELEMENTS.stage?.classList.add(
        "winning"
      );
    } else {
      ELEMENTS.player?.classList.add(
        "loser"
      );

      ELEMENTS.stage?.classList.add(
        "losing"
      );
    }

    registerResult(won);

    renderAll();

    playSound(
      won ? "success" : "error"
    );

    STATE.resultTimer =
      window.setTimeout(() => {
        showResult(won);
      }, CONFIG.resultDelay);
  }

  function registerResult(won) {
    if (STATE.resultRegistered) {
      return;
    }

    STATE.resultRegistered = true;

    api()?.registerGameResult?.(
      "panjat-pinang",
      won ? "win" : "lose",
      {
        progress:
          Math.floor(STATE.progress),

        taps:
          STATE.taps,

        bestCombo:
          STATE.bestCombo,

        score:
          Math.floor(STATE.score),

        remainingTime:
          Math.ceil(
            STATE.remainingTime
          )
      }
    );
  }


  /* =========================================================
     16. POPUP HASIL
  ========================================================= */

  function showResult(won) {
    if (
      ELEMENTS.winContent
    ) {
      ELEMENTS.winContent.hidden =
        !won;

      ELEMENTS.winContent.style.display =
        won ? "" : "none";
    }

    if (
      ELEMENTS.loseContent
    ) {
      ELEMENTS.loseContent.hidden =
        won;

      ELEMENTS.loseContent.style.display =
        won ? "none" : "";
    }

    setText(
      ELEMENTS.resultRemainingTime,
      `${Math.ceil(
        STATE.remainingTime
      )} detik`
    );

    setText(
      ELEMENTS.resultTapCount,
      STATE.taps
    );

    setText(
      ELEMENTS.loseTapCount,
      STATE.taps
    );

    setText(
      ELEMENTS.loseProgress,
      `${Math.floor(
        STATE.progress
      )}%`
    );

    setText(
      ELEMENTS.loseTicket,
      api()?.getTickets?.() ?? 0
    );

    ELEMENTS.resultModal?.classList.toggle(
      "win",
      won
    );

    ELEMENTS.resultModal?.classList.toggle(
      "lose",
      !won
    );

    openOverlay(
      ELEMENTS.resultOverlay
    );

    if (won) {
      showGameToast(
        "Menang! Satu Mystery Box berhasil dibuka.",
        "success"
      );
    } else {
      showGameToast(
        "Waktu habis. Kamu bisa mencoba lagi.",
        "warning"
      );
    }
  }


  /* =========================================================
     17. KELUAR DAN KEMBALI KE LOBBY
  ========================================================= */

  function requestExit() {
    if (
      isPlaying() ||
      isPaused() ||
      STATE.status === "countdown"
    ) {
      if (ELEMENTS.exitOverlay) {
        openOverlay(
          ELEMENTS.exitOverlay
        );
      } else {
        const confirmed =
          window.confirm(
            "Keluar dari permainan? Tiket yang sudah digunakan tidak dikembalikan."
          );

        if (confirmed) {
          quitToLobby();
        }
      }

      return;
    }

    quitToLobby();
  }

  function quitToLobby() {
    clearTimers();

    closeOverlay(
      ELEMENTS.exitOverlay
    );

    closeOverlay(
      ELEMENTS.pauseOverlay
    );

    closeOverlay(
      ELEMENTS.resultOverlay
    );

    resetGame();

    api()?.returnToLobby?.();
  }


  /* =========================================================
     18. RETRY
  ========================================================= */

  function retryGame() {
    closeOverlay(
      ELEMENTS.resultOverlay
    );

    if (!api()?.hasTickets?.(1)) {
      showGameToast(
        "Tiket sudah habis.",
        "warning"
      );

      window.setTimeout(() => {
        api()?.returnToLobby?.();
      }, 700);

      return;
    }

    resetGame();
    startCountdown();
  }


  /* =========================================================
     19. BUKA MYSTERY BOX
  ========================================================= */

  function goToMysteryBox() {
    closeOverlay(
      ELEMENTS.resultOverlay
    );

    if (!api()?.openMystery?.()) {
      showGameToast(
        "Mystery Box belum dapat dibuka.",
        "warning"
      );
    }
  }


  /* =========================================================
     20. SOUND BUTTON
  ========================================================= */

  function toggleGameSound() {
    const enabled =
      !isSoundEnabled();

    api()?.setSound?.(enabled);

    renderSound();
  }


  /* =========================================================
     21. EVENT SCREEN
  ========================================================= */

  document.addEventListener(
    "clickbet:screenchange",
    (event) => {
      if (
        event.detail?.screen ===
        "pinang"
      ) {
        resetGame();

        setTimeout(() => {
          ELEMENTS.startButton?.focus();
        }, 300);
      } else if (
        isBusy()
      ) {
        clearTimers();
        STATE.status = "idle";
      }
    }
  );


  /* =========================================================
     22. EVENT BUTTON
  ========================================================= */

  ELEMENTS.startButton?.addEventListener(
    "click",
    startCountdown
  );

  ELEMENTS.tapButton?.addEventListener(
    "click",
    performClimb
  );

  ELEMENTS.pauseButton?.addEventListener(
    "click",
    pauseGame
  );

  ELEMENTS.resumeButton?.addEventListener(
    "click",
    resumeGame
  );

  ELEMENTS.backButton?.addEventListener(
    "click",
    requestExit
  );

  ELEMENTS.quitButton?.addEventListener(
    "click",
    requestExit
  );

  ELEMENTS.cancelExitButton?.addEventListener(
    "click",
    () => {
      closeOverlay(
        ELEMENTS.exitOverlay
      );
    }
  );

  ELEMENTS.confirmExitButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.closeResultButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.winLobbyButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.loseLobbyButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.retryButton?.addEventListener(
    "click",
    retryGame
  );

  ELEMENTS.mysteryButton?.addEventListener(
    "click",
    goToMysteryBox
  );

  ELEMENTS.soundButton?.addEventListener(
    "click",
    toggleGameSound
  );


  /* =========================================================
     23. KEYBOARD CONTROL
  ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      const activeScreen =
        document
          .querySelector(
            ".screen.active"
          )
          ?.id;

      if (
        activeScreen !==
        "panjatPinangScreen"
      ) {
        return;
      }

      if (
        event.code === "Space" ||
        event.code === "Enter"
      ) {
        if (isPlaying()) {
          event.preventDefault();
          performClimb();
        }
      }

      if (
        event.code === "KeyP"
      ) {
        event.preventDefault();

        if (isPlaying()) {
          pauseGame();
        } else if (isPaused()) {
          resumeGame();
        }
      }

      if (
        event.code === "Escape"
      ) {
        event.preventDefault();

        if (isPaused()) {
          resumeGame();
        } else {
          requestExit();
        }
      }
    }
  );


  /* =========================================================
     24. TOUCH CONTROL
  ========================================================= */

  let lastTouchTime = 0;

  ELEMENTS.stage?.addEventListener(
    "pointerdown",
    (event) => {
      if (!isPlaying()) {
        return;
      }

      if (
        event.target.closest(
          "button"
        )
      ) {
        return;
      }

      const now = performance.now();

      if (
        now - lastTouchTime <
        CONFIG.minimumTapDelay
      ) {
        return;
      }

      lastTouchTime = now;

      performClimb();
    }
  );


  /* =========================================================
     25. VISIBILITY PAUSE
  ========================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.hidden &&
        isPlaying()
      ) {
        pauseGame();
      }
    }
  );


  /* =========================================================
     26. PUBLIC API PANJAT PINANG
  ========================================================= */

  window.ClickbetPinang =
    Object.freeze({
      start: startCountdown,

      tap: performClimb,

      pause: pauseGame,

      resume: resumeGame,

      reset: resetGame,

      returnLobby: quitToLobby,

      getStatus() {
        return {
          status: STATE.status,
          progress:
            STATE.progress,
          stamina:
            STATE.stamina,
          time:
            STATE.remainingTime,
          taps:
            STATE.taps,
          combo:
            STATE.combo,
          bestCombo:
            STATE.bestCombo,
          score:
            STATE.score
        };
      }
    });


  /* =========================================================
     27. INITIALIZATION
  ========================================================= */

  resetGame();
  renderAll();

  console.info(
    "[CLICKBET88 PART 2] Premium Panjat Pinang aktif."
  );
})();
/* =========================================================
   CLICKBET88 FESTIVAL KEMERDEKAAN 2026
   JAVASCRIPT BARU — PART 3
   PREMIUM MAKAN KERUPUK ENGINE
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. KONFIGURASI
  ========================================================= */

  const CONFIG = Object.freeze({
    duration: 15,
    countdown: 3,

    ticketCost: 1,

    maximumProgress: 100,
    minimumBite: 2.5,
    normalBite: 3.4,
    perfectBite: 5.2,

    minimumTapDelay: 75,

    perfectMinimum: 130,
    perfectMaximum: 340,

    comboTimeout: 760,
    maximumCombo: 20,

    swingPower: 7,
    swingDamping: 0.91,

    missSwingLimit: 28,
    missPenalty: 1.3,

    resultDelay: 650,
    toastDuration: 1800
  });


  /* =========================================================
     2. DOM HELPER
  ========================================================= */

  const $ = (id) =>
    document.getElementById(id);

  const clamp = (
    value,
    minimum,
    maximum
  ) =>
    Math.min(
      Math.max(
        Number(value) || 0,
        minimum
      ),
      maximum
    );

  const api = () =>
    window.ClickbetGame || null;

  function setText(
    element,
    value
  ) {
    if (element) {
      element.textContent =
        String(value);
    }
  }

  function formatTime(seconds) {
    const cleanSeconds =
      Math.max(
        0,
        Math.ceil(seconds)
      );

    return `00:${String(
      cleanSeconds
    ).padStart(2, "0")}`;
  }

  function playSound(
    type = "click"
  ) {
    api()?.playSound?.(type);
  }

  function notify(
    message,
    type = "info"
  ) {
    api()?.notify?.(
      message,
      type
    );
  }

  function openOverlay(element) {
    if (!element) {
      return;
    }

    if (api()?.openOverlay) {
      api().openOverlay(element);
      return;
    }

    element.hidden = false;

    element.setAttribute(
      "aria-hidden",
      "false"
    );

    element.classList.add(
      "active",
      "show",
      "visible"
    );
  }

  function closeOverlay(element) {
    if (!element) {
      return;
    }

    if (api()?.closeOverlay) {
      api().closeOverlay(element);
      return;
    }

    element.classList.remove(
      "active",
      "show",
      "visible"
    );

    element.setAttribute(
      "aria-hidden",
      "true"
    );

    window.setTimeout(() => {
      element.hidden = true;
    }, 250);
  }


  /* =========================================================
     3. SCREEN DAN ELEMENT
  ========================================================= */

  const screen =
    $("makanKerupukScreen");

  if (!screen) {
    console.warn(
      "[CLICKBET88 PART 3] Screen Makan Kerupuk tidak ditemukan."
    );

    return;
  }

  const ELEMENTS = {
    screen,

    arena:
      screen.querySelector(
        ".kerupuk-arena"
      ) ||
      screen.querySelector(
        ".makan-kerupuk-arena"
      ) ||
      screen.querySelector(
        ".game-arena"
      ),

    player:
      $("kerupukPlayer") ||
      screen.querySelector(
        ".kerupuk-player"
      ) ||
      screen.querySelector(
        ".kerupuk-character"
      ) ||
      screen.querySelector(
        ".makan-kerupuk-character"
      ),

    playerFace:
      screen.querySelector(
        ".player-face"
      ) ||
      screen.querySelector(
        ".kerupuk-player-face"
      ),

    kerupuk:
      $("hangingKerupuk") ||
      $("kerupukObject") ||
      screen.querySelector(
        ".hanging-kerupuk"
      ) ||
      screen.querySelector(
        ".kerupuk-food"
      ) ||
      screen.querySelector(
        ".kerupuk-rope"
      ),

    rope:
      $("kerupukRope") ||
      screen.querySelector(
        ".kerupuk-rope"
      ),

    crumbEffect:
      $("kerupukCrumbEffect") ||
      screen.querySelector(
        ".kerupuk-crumb-effect"
      ),

    timer:
      $("kerupukTimerValue"),

    progressFill:
      $("kerupukProgressFill") ||
      $("kerupukProgressBar"),

    progressValue:
      $("kerupukProgressValue"),

    remainingValue:
      $("kerupukRemainingValue"),

    tapCount:
      $("kerupukTapCount"),

    scoreValue:
      $("kerupukScoreValue"),

    comboValue:
      $("kerupukComboValue"),

    readyMessage:
      $("kerupukReadyMessage"),

    startButton:
      $("kerupukStartButton"),

    biteButton:
      $("kerupukBiteButton") ||
      $("kerupukTapButton"),

    backButton:
      $("kerupukBackButton"),

    pauseButton:
      $("kerupukPauseButton"),

    soundButton:
      $("kerupukSoundButton"),

    soundIcon:
      $("kerupukSoundIcon"),

    countdownOverlay:
      $("kerupukCountdownOverlay"),

    countdownValue:
      $("kerupukCountdownValue"),

    countdownMessage:
      $("kerupukCountdownMessage"),

    pauseOverlay:
      $("kerupukPauseOverlay"),

    resumeButton:
      $("kerupukResumeButton"),

    quitButton:
      $("kerupukQuitButton"),

    resultOverlay:
      $("kerupukResultOverlay"),

    resultModal:
      $("kerupukResultModal"),

    closeResultButton:
      $("closeKerupukResultButton"),

    winContent:
      $("kerupukWinContent"),

    loseContent:
      $("kerupukLoseContent"),

    resultRemainingTime:
      $("kerupukResultRemainingTime"),

    resultTapCount:
      $("kerupukResultTapCount"),

    loseTapCount:
      $("kerupukLoseTapCount"),

    loseRemaining:
      $("kerupukLoseRemaining"),

    loseTicket:
      $("kerupukLoseTicket"),

    openMysteryButton:
      $("openKerupukMysteryButton"),

    winLobbyButton:
      $("kerupukWinLobbyButton"),

    retryButton:
      $("retryKerupukButton"),

    loseLobbyButton:
      $("kerupukLoseLobbyButton"),

    exitOverlay:
      $("kerupukExitConfirmOverlay"),

    cancelExitButton:
      $("cancelKerupukExitButton"),

    confirmExitButton:
      $("confirmKerupukExitButton"),

    toast:
      $("kerupukToast"),

    toastIcon:
      $("kerupukToastIcon"),

    toastMessage:
      $("kerupukToastMessage")
  };


  /* =========================================================
     4. STATE
  ========================================================= */

  const STATE = {
    status: "idle",

    progress: 0,
    visualProgress: 0,

    remainingTime:
      CONFIG.duration,

    taps: 0,
    score: 0,

    combo: 0,
    bestCombo: 0,

    swing: 0,
    swingVelocity: 0,

    lastTapTime: 0,
    lastFrameTime: 0,

    ticketUsed: false,
    resultRegistered: false,

    animationFrame: 0,
    countdownTimer: 0,
    resultTimer: 0,
    toastTimer: 0,
    feedbackTimer: 0,

    biteSide: false
  };


  /* =========================================================
     5. STATUS
  ========================================================= */

  function isPlaying() {
    return (
      STATE.status === "playing"
    );
  }

  function isPaused() {
    return (
      STATE.status === "paused"
    );
  }

  function isBusy() {
    return [
      "countdown",
      "playing",
      "paused"
    ].includes(STATE.status);
  }

  function clearTimers() {
    window.clearInterval(
      STATE.countdownTimer
    );

    window.clearTimeout(
      STATE.resultTimer
    );

    window.clearTimeout(
      STATE.toastTimer
    );

    window.clearTimeout(
      STATE.feedbackTimer
    );

    cancelAnimationFrame(
      STATE.animationFrame
    );

    STATE.countdownTimer = 0;
    STATE.resultTimer = 0;
    STATE.animationFrame = 0;
  }


  /* =========================================================
     6. TOAST
  ========================================================= */

  function showToast(
    message,
    type = "info"
  ) {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      bite: "🍘",
      perfect: "⚡",
      combo: "🔥",
      miss: "💨"
    };

    if (
      !ELEMENTS.toast ||
      !ELEMENTS.toastMessage
    ) {
      notify(message, type);
      return;
    }

    window.clearTimeout(
      STATE.toastTimer
    );

    setText(
      ELEMENTS.toastIcon,
      icons[type] || icons.info
    );

    setText(
      ELEMENTS.toastMessage,
      message
    );

    ELEMENTS.toast.classList.remove(
      "show"
    );

    void ELEMENTS.toast.offsetWidth;

    ELEMENTS.toast.dataset.type =
      type;

    ELEMENTS.toast.classList.add(
      "show"
    );

    STATE.toastTimer =
      window.setTimeout(() => {
        ELEMENTS.toast?.classList.remove(
          "show"
        );
      }, CONFIG.toastDuration);
  }


  /* =========================================================
     7. UI TAMBAHAN OTOMATIS
  ========================================================= */

  function createPremiumFeedback() {
    if (
      !ELEMENTS.arena ||
      $("kerupukLiveFeedback")
    ) {
      return;
    }

    const feedback =
      document.createElement("div");

    feedback.id =
      "kerupukLiveFeedback";

    feedback.className =
      "kerupuk-live-feedback";

    feedback.setAttribute(
      "aria-live",
      "polite"
    );

    ELEMENTS.arena.appendChild(
      feedback
    );

    ELEMENTS.feedback = feedback;
  }


  /* =========================================================
     8. RENDER
  ========================================================= */

  function renderTimer() {
    setText(
      ELEMENTS.timer,
      formatTime(
        STATE.remainingTime
      )
    );

    const timerBox =
      ELEMENTS.timer?.closest(
        ".kerupuk-timer"
      ) ||
      ELEMENTS.timer?.parentElement;

    timerBox?.classList.toggle(
      "danger",
      STATE.remainingTime <= 5
    );
  }

  function renderProgress() {
    const progress = clamp(
      STATE.visualProgress,
      0,
      100
    );

    const remaining =
      Math.max(
        0,
        100 -
        Math.floor(
          STATE.progress
        )
      );

    if (ELEMENTS.progressFill) {
      ELEMENTS.progressFill.style.width =
        `${progress}%`;

      ELEMENTS.progressFill.style.height =
        `${progress}%`;

      ELEMENTS.progressFill.setAttribute(
        "aria-valuenow",
        String(
          Math.floor(progress)
        )
      );
    }

    setText(
      ELEMENTS.progressValue,
      `${Math.floor(
        STATE.progress
      )}%`
    );

    setText(
      ELEMENTS.remainingValue,
      `${remaining}%`
    );

    if (ELEMENTS.kerupuk) {
      ELEMENTS.kerupuk.style.setProperty(
        "--kerupuk-progress",
        `${progress}%`
      );

      ELEMENTS.kerupuk.style.opacity =
        String(
          clamp(
            1 - progress * 0.006,
            0.32,
            1
          )
        );

      ELEMENTS.kerupuk.style.scale =
        String(
          clamp(
            1 - progress * 0.005,
            0.5,
            1
          )
        );

      ELEMENTS.kerupuk.classList.toggle(
        "almost-finished",
        progress >= 75
      );
    }
  }

  function renderStatistics() {
    setText(
      ELEMENTS.tapCount,
      STATE.taps
    );

    setText(
      ELEMENTS.scoreValue,
      Math.floor(STATE.score)
    );

    setText(
      ELEMENTS.comboValue,
      STATE.combo > 0
        ? `x${STATE.combo}`
        : "x0"
    );
  }

  function renderButtons() {
    if (ELEMENTS.startButton) {
      ELEMENTS.startButton.disabled =
        isBusy();

      ELEMENTS.startButton.hidden =
        isBusy();
    }

    if (ELEMENTS.biteButton) {
      ELEMENTS.biteButton.disabled =
        !isPlaying();

      ELEMENTS.biteButton.classList.toggle(
        "active",
        isPlaying()
      );
    }

    if (ELEMENTS.pauseButton) {
      ELEMENTS.pauseButton.disabled =
        !isPlaying();
    }
  }

  function renderReadyMessage() {
    if (!ELEMENTS.readyMessage) {
      return;
    }

    const messages = {
      idle:
        "Tekan MULAI untuk bersiap makan kerupuk!",
      countdown:
        "Bersiap, perlombaan segera dimulai!",
      playing:
        "Tap cepat saat kerupuk berada dekat mulut!",
      paused:
        "Permainan sedang dijeda.",
      win:
        "Kerupuk berhasil dihabiskan!",
      lose:
        "Waktu habis. Sedikit lagi!"
    };

    ELEMENTS.readyMessage.textContent =
      messages[STATE.status] ||
      messages.idle;
  }

  function renderSwing() {
    if (!ELEMENTS.rope) {
      return;
    }

    ELEMENTS.rope.style.setProperty(
      "--kerupuk-swing",
      `${STATE.swing}deg`
    );

    ELEMENTS.rope.style.transform =
      `translateX(-50%) rotate(${STATE.swing}deg)`;
  }

  function renderSound() {
    const enabled =
      api()?.isSoundEnabled?.() !==
      false;

    setText(
      ELEMENTS.soundIcon,
      enabled ? "🔊" : "🔇"
    );
  }

  function renderAll() {
    renderTimer();
    renderProgress();
    renderStatistics();
    renderButtons();
    renderReadyMessage();
    renderSwing();
    renderSound();

    screen.classList.toggle(
      "game-playing",
      isPlaying()
    );

    screen.classList.toggle(
      "game-paused",
      isPaused()
    );
  }


  /* =========================================================
     9. RESET
  ========================================================= */

  function resetVisualClasses() {
    ELEMENTS.player?.classList.remove(
      "eating",
      "bite",
      "winning",
      "losing",
      "paused"
    );

    ELEMENTS.kerupuk?.classList.remove(
      "bite",
      "swing",
      "almost-finished",
      "finished",
      "winning"
    );

    ELEMENTS.rope?.classList.remove(
      "swing",
      "active"
    );

    ELEMENTS.crumbEffect?.classList.remove(
      "active"
    );

    ELEMENTS.arena?.classList.remove(
      "shake",
      "winning",
      "losing",
      "danger"
    );

    if (ELEMENTS.playerFace) {
      ELEMENTS.playerFace.textContent =
        "😋";
    }
  }

  function resetGame() {
    clearTimers();
    resetVisualClasses();

    STATE.status = "idle";

    STATE.progress = 0;
    STATE.visualProgress = 0;

    STATE.remainingTime =
      CONFIG.duration;

    STATE.taps = 0;
    STATE.score = 0;

    STATE.combo = 0;
    STATE.bestCombo = 0;

    STATE.swing = 0;
    STATE.swingVelocity = 0;

    STATE.lastTapTime = 0;
    STATE.lastFrameTime = 0;

    STATE.ticketUsed = false;
    STATE.resultRegistered = false;

    closeOverlay(
      ELEMENTS.countdownOverlay
    );

    closeOverlay(
      ELEMENTS.pauseOverlay
    );

    closeOverlay(
      ELEMENTS.resultOverlay
    );

    closeOverlay(
      ELEMENTS.exitOverlay
    );

    renderAll();
  }


  /* =========================================================
     10. COUNTDOWN
  ========================================================= */

  function startCountdown() {
    if (isBusy()) {
      return;
    }

    if (!api()) {
      showToast(
        "Core Part 1 belum aktif.",
        "error"
      );

      return;
    }

    if (!api().hasTickets?.(1)) {
      showToast(
        "Tiket tidak cukup untuk bermain.",
        "warning"
      );

      playSound("error");
      return;
    }

    resetGame();

    STATE.status = "countdown";

    renderAll();

    openOverlay(
      ELEMENTS.countdownOverlay
    );

    let count =
      CONFIG.countdown;

    setText(
      ELEMENTS.countdownValue,
      count
    );

    setText(
      ELEMENTS.countdownMessage,
      "BERSIAP!"
    );

    playSound("open");

    STATE.countdownTimer =
      window.setInterval(() => {
        count -= 1;

        if (count > 0) {
          setText(
            ELEMENTS.countdownValue,
            count
          );

          setText(
            ELEMENTS.countdownMessage,
            count === 1
              ? "SIAP!"
              : "BERSIAP!"
          );

          playSound("click");
          return;
        }

        window.clearInterval(
          STATE.countdownTimer
        );

        setText(
          ELEMENTS.countdownValue,
          "GO!"
        );

        setText(
          ELEMENTS.countdownMessage,
          "MAKAN SEKARANG!"
        );

        playSound("success");

        window.setTimeout(() => {
          closeOverlay(
            ELEMENTS.countdownOverlay
          );

          beginGame();
        }, 450);
      }, 800);
  }


  /* =========================================================
     11. MULAI GAME
  ========================================================= */

  function beginGame() {
    const ticketUsed =
      api()?.useTicket?.(
        CONFIG.ticketCost,
        "makan-kerupuk"
      );

    if (!ticketUsed) {
      STATE.status = "idle";
      renderAll();
      return;
    }

    STATE.ticketUsed = true;
    STATE.status = "playing";

    STATE.remainingTime =
      CONFIG.duration;

    STATE.lastFrameTime =
      performance.now();

    renderAll();

    showToast(
      "Mulai! Habiskan kerupuk sebelum waktunya habis.",
      "bite"
    );

    STATE.animationFrame =
      requestAnimationFrame(
        gameLoop
      );
  }


  /* =========================================================
     12. GAME LOOP
  ========================================================= */

  function gameLoop(timestamp) {
    if (!isPlaying()) {
      return;
    }

    const delta = clamp(
      (
        timestamp -
        STATE.lastFrameTime
      ) / 1000,
      0,
      0.08
    );

    STATE.lastFrameTime =
      timestamp;

    STATE.remainingTime -=
      delta;

    STATE.swingVelocity +=
      -STATE.swing *
      13 *
      delta;

    STATE.swingVelocity *=
      Math.pow(
        CONFIG.swingDamping,
        delta * 60
      );

    STATE.swing +=
      STATE.swingVelocity *
      delta;

    STATE.swing = clamp(
      STATE.swing,
      -36,
      36
    );

    STATE.visualProgress +=
      (
        STATE.progress -
        STATE.visualProgress
      ) *
      Math.min(
        delta * 13,
        1
      );

    if (
      STATE.combo > 0 &&
      timestamp -
        STATE.lastTapTime >
        CONFIG.comboTimeout
    ) {
      STATE.combo = 0;
    }

    ELEMENTS.arena?.classList.toggle(
      "danger",
      STATE.remainingTime <= 5
    );

    renderAll();

    if (
      STATE.progress >=
      CONFIG.maximumProgress
    ) {
      finishGame(true);
      return;
    }

    if (
      STATE.remainingTime <= 0
    ) {
      STATE.remainingTime = 0;
      finishGame(false);
      return;
    }

    STATE.animationFrame =
      requestAnimationFrame(
        gameLoop
      );
  }


  /* =========================================================
     13. AKSI GIGIT
  ========================================================= */

  function biteKerupuk() {
    if (!isPlaying()) {
      return;
    }

    const now =
      performance.now();

    const interval =
      STATE.lastTapTime
        ? now -
          STATE.lastTapTime
        : 250;

    if (
      interval <
      CONFIG.minimumTapDelay
    ) {
      return;
    }

    STATE.lastTapTime = now;
    STATE.taps += 1;

    const swingDistance =
      Math.abs(STATE.swing);

    let bitePower =
      CONFIG.normalBite;

    let feedbackType =
      "normal";

    if (
      interval >=
        CONFIG.perfectMinimum &&
      interval <=
        CONFIG.perfectMaximum &&
      swingDistance <= 19
    ) {
      STATE.combo = clamp(
        STATE.combo + 1,
        0,
        CONFIG.maximumCombo
      );

      STATE.bestCombo =
        Math.max(
          STATE.bestCombo,
          STATE.combo
        );

      bitePower =
        CONFIG.perfectBite +
        STATE.combo * 0.08;

      feedbackType =
        "perfect";
    } else if (
      swingDistance >
      CONFIG.missSwingLimit
    ) {
      bitePower =
        CONFIG.minimumBite -
        CONFIG.missPenalty;

      STATE.combo = 0;
      feedbackType = "miss";
    } else {
      STATE.combo =
        Math.max(
          STATE.combo - 1,
          0
        );
    }

    bitePower =
      Math.max(
        bitePower,
        0.8
      );

    STATE.progress = clamp(
      STATE.progress +
      bitePower,
      0,
      CONFIG.maximumProgress
    );

    STATE.score +=
      Math.round(
        bitePower * 100 +
        STATE.combo * 25
      );

    const direction =
      Math.random() > 0.5
        ? 1
        : -1;

    STATE.swingVelocity +=
      direction *
      CONFIG.swingPower;

    animateBite(
      feedbackType
    );

    if (
      feedbackType ===
      "perfect"
    ) {
      showFeedback(
        STATE.combo >= 3
          ? `COMBO x${STATE.combo}`
          : "PERFECT!",
        STATE.combo >= 3
          ? "combo"
          : "perfect"
      );

      playSound("success");
    } else if (
      feedbackType === "miss"
    ) {
      showFeedback(
        "HAMPIR MELESET!",
        "miss"
      );

      playSound("error");
    } else {
      showFeedback(
        "NYAM!",
        "normal"
      );

      playSound("click");
    }

    renderAll();

    if (
      STATE.progress >=
      CONFIG.maximumProgress
    ) {
      finishGame(true);
    }
  }


  /* =========================================================
     14. ANIMASI GIGIT
  ========================================================= */

  function animateBite(type) {
    ELEMENTS.player?.classList.remove(
      "eating",
      "bite"
    );

    ELEMENTS.kerupuk?.classList.remove(
      "bite",
      "swing"
    );

    ELEMENTS.crumbEffect?.classList.remove(
      "active"
    );

    ELEMENTS.biteButton?.classList.remove(
      "pressed"
    );

    ELEMENTS.arena?.classList.remove(
      "shake"
    );

    void screen.offsetWidth;

    STATE.biteSide =
      !STATE.biteSide;

    ELEMENTS.player?.classList.add(
      "eating",
      "bite"
    );

    ELEMENTS.player?.classList.toggle(
      "bite-left",
      STATE.biteSide
    );

    ELEMENTS.player?.classList.toggle(
      "bite-right",
      !STATE.biteSide
    );

    ELEMENTS.kerupuk?.classList.add(
      "bite",
      "swing"
    );

    ELEMENTS.crumbEffect?.classList.add(
      "active"
    );

    ELEMENTS.biteButton?.classList.add(
      "pressed"
    );

    if (type === "miss") {
      ELEMENTS.arena?.classList.add(
        "shake"
      );

      if (ELEMENTS.playerFace) {
        ELEMENTS.playerFace.textContent =
          "😵";
      }
    } else if (
      ELEMENTS.playerFace
    ) {
      ELEMENTS.playerFace.textContent =
        type === "perfect"
          ? "🤩"
          : "😋";
    }

    window.setTimeout(() => {
      ELEMENTS.player?.classList.remove(
        "eating",
        "bite"
      );

      ELEMENTS.kerupuk?.classList.remove(
        "bite"
      );

      ELEMENTS.crumbEffect?.classList.remove(
        "active"
      );

      ELEMENTS.biteButton?.classList.remove(
        "pressed"
      );

      ELEMENTS.arena?.classList.remove(
        "shake"
      );

      if (ELEMENTS.playerFace) {
        ELEMENTS.playerFace.textContent =
          "😋";
      }
    }, 260);
  }

  function showFeedback(
    message,
    type
  ) {
    const feedback =
      ELEMENTS.feedback;

    if (!feedback) {
      return;
    }

    window.clearTimeout(
      STATE.feedbackTimer
    );

    feedback.textContent =
      message;

    feedback.dataset.type =
      type;

    feedback.classList.remove(
      "show"
    );

    void feedback.offsetWidth;

    feedback.classList.add(
      "show"
    );

    STATE.feedbackTimer =
      window.setTimeout(() => {
        feedback.classList.remove(
          "show"
        );
      }, 520);
  }


  /* =========================================================
     15. PAUSE
  ========================================================= */

  function pauseGame() {
    if (!isPlaying()) {
      return;
    }

    STATE.status = "paused";

    cancelAnimationFrame(
      STATE.animationFrame
    );

    ELEMENTS.player?.classList.add(
      "paused"
    );

    openOverlay(
      ELEMENTS.pauseOverlay
    );

    renderAll();
    playSound("click");
  }

  function resumeGame() {
    if (!isPaused()) {
      return;
    }

    STATE.status = "playing";

    STATE.lastFrameTime =
      performance.now();

    ELEMENTS.player?.classList.remove(
      "paused"
    );

    closeOverlay(
      ELEMENTS.pauseOverlay
    );

    renderAll();
    playSound("open");

    STATE.animationFrame =
      requestAnimationFrame(
        gameLoop
      );
  }


  /* =========================================================
     16. SELESAI GAME
  ========================================================= */

  function finishGame(won) {
    if (
      STATE.status === "win" ||
      STATE.status === "lose"
    ) {
      return;
    }

    cancelAnimationFrame(
      STATE.animationFrame
    );

    STATE.status =
      won ? "win" : "lose";

    STATE.remainingTime =
      Math.max(
        STATE.remainingTime,
        0
      );

    if (won) {
      STATE.progress = 100;
      STATE.visualProgress = 100;

      ELEMENTS.kerupuk?.classList.add(
        "finished",
        "winning"
      );

      ELEMENTS.player?.classList.add(
        "winning"
      );

      ELEMENTS.arena?.classList.add(
        "winning"
      );
    } else {
      ELEMENTS.player?.classList.add(
        "losing"
      );

      ELEMENTS.arena?.classList.add(
        "losing"
      );
    }

    registerResult(won);

    renderAll();

    playSound(
      won ? "success" : "error"
    );

    STATE.resultTimer =
      window.setTimeout(() => {
        showResult(won);
      }, CONFIG.resultDelay);
  }

  function registerResult(won) {
    if (
      STATE.resultRegistered
    ) {
      return;
    }

    STATE.resultRegistered = true;

    api()?.registerGameResult?.(
      "makan-kerupuk",
      won ? "win" : "lose",
      {
        progress:
          Math.floor(
            STATE.progress
          ),

        taps: STATE.taps,

        score:
          Math.floor(
            STATE.score
          ),

        bestCombo:
          STATE.bestCombo,

        remainingTime:
          Math.ceil(
            STATE.remainingTime
          )
      }
    );
  }


  /* =========================================================
     17. RESULT
  ========================================================= */

  function showResult(won) {
    if (ELEMENTS.winContent) {
      ELEMENTS.winContent.hidden =
        !won;

      ELEMENTS.winContent.style.display =
        won ? "" : "none";
    }

    if (ELEMENTS.loseContent) {
      ELEMENTS.loseContent.hidden =
        won;

      ELEMENTS.loseContent.style.display =
        won ? "none" : "";
    }

    setText(
      ELEMENTS.resultRemainingTime,
      `${Math.ceil(
        STATE.remainingTime
      )} detik`
    );

    setText(
      ELEMENTS.resultTapCount,
      STATE.taps
    );

    setText(
      ELEMENTS.loseTapCount,
      STATE.taps
    );

    setText(
      ELEMENTS.loseRemaining,
      `${Math.max(
        0,
        100 -
        Math.floor(
          STATE.progress
        )
      )}%`
    );

    setText(
      ELEMENTS.loseTicket,
      api()?.getTickets?.() ?? 0
    );

    ELEMENTS.resultModal?.classList.toggle(
      "win",
      won
    );

    ELEMENTS.resultModal?.classList.toggle(
      "lose",
      !won
    );

    openOverlay(
      ELEMENTS.resultOverlay
    );

    if (won) {
      showToast(
        "Menang! Mystery Box berhasil terbuka.",
        "success"
      );
    } else {
      showToast(
        "Waktu habis. Coba tap lebih cepat!",
        "warning"
      );
    }
  }


  /* =========================================================
     18. EXIT, RETRY DAN MYSTERY
  ========================================================= */

  function requestExit() {
    if (isBusy()) {
      if (ELEMENTS.exitOverlay) {
        openOverlay(
          ELEMENTS.exitOverlay
        );
      } else {
        const confirmed =
          window.confirm(
            "Keluar dari permainan? Tiket tidak dikembalikan."
          );

        if (confirmed) {
          quitToLobby();
        }
      }

      return;
    }

    quitToLobby();
  }

  function quitToLobby() {
    clearTimers();

    closeOverlay(
      ELEMENTS.exitOverlay
    );

    closeOverlay(
      ELEMENTS.pauseOverlay
    );

    closeOverlay(
      ELEMENTS.resultOverlay
    );

    resetGame();

    api()?.returnToLobby?.();
  }

  function retryGame() {
    closeOverlay(
      ELEMENTS.resultOverlay
    );

    if (!api()?.hasTickets?.(1)) {
      showToast(
        "Tiket sudah habis.",
        "warning"
      );

      window.setTimeout(() => {
        api()?.returnToLobby?.();
      }, 650);

      return;
    }

    resetGame();
    startCountdown();
  }

  function openMystery() {
    closeOverlay(
      ELEMENTS.resultOverlay
    );

    const opened =
      api()?.openMystery?.();

    if (!opened) {
      showToast(
        "Mystery Box belum dapat dibuka.",
        "warning"
      );
    }
  }

  function toggleSound() {
    const enabled =
      api()?.isSoundEnabled?.() ===
      false;

    api()?.setSound?.(enabled);

    renderSound();
  }


  /* =========================================================
     19. EVENT BUTTON
  ========================================================= */

  ELEMENTS.startButton?.addEventListener(
    "click",
    startCountdown
  );

  ELEMENTS.biteButton?.addEventListener(
    "click",
    biteKerupuk
  );

  ELEMENTS.pauseButton?.addEventListener(
    "click",
    pauseGame
  );

  ELEMENTS.resumeButton?.addEventListener(
    "click",
    resumeGame
  );

  ELEMENTS.backButton?.addEventListener(
    "click",
    requestExit
  );

  ELEMENTS.quitButton?.addEventListener(
    "click",
    requestExit
  );

  ELEMENTS.cancelExitButton?.addEventListener(
    "click",
    () => {
      closeOverlay(
        ELEMENTS.exitOverlay
      );
    }
  );

  ELEMENTS.confirmExitButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.closeResultButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.winLobbyButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.loseLobbyButton?.addEventListener(
    "click",
    quitToLobby
  );

  ELEMENTS.retryButton?.addEventListener(
    "click",
    retryGame
  );

  ELEMENTS.openMysteryButton?.addEventListener(
    "click",
    openMystery
  );

  ELEMENTS.soundButton?.addEventListener(
    "click",
    toggleSound
  );


  /* =========================================================
     20. KEYBOARD
  ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      const activeScreen =
        document.querySelector(
          ".screen.active"
        );

      if (
        activeScreen !== screen
      ) {
        return;
      }

      if (
        event.code === "Space" ||
        event.code === "Enter"
      ) {
        if (isPlaying()) {
          event.preventDefault();
          biteKerupuk();
        }
      }

      if (
        event.code === "KeyP"
      ) {
        event.preventDefault();

        if (isPlaying()) {
          pauseGame();
        } else if (isPaused()) {
          resumeGame();
        }
      }

      if (
        event.code === "Escape"
      ) {
        event.preventDefault();

        if (isPaused()) {
          resumeGame();
        } else {
          requestExit();
        }
      }
    }
  );


  /* =========================================================
     21. TAP ARENA
  ========================================================= */

  let lastPointerTime = 0;

  ELEMENTS.arena?.addEventListener(
    "pointerdown",
    (event) => {
      if (!isPlaying()) {
        return;
      }

      if (
        event.target.closest(
          "button"
        )
      ) {
        return;
      }

      const now =
        performance.now();

      if (
        now -
          lastPointerTime <
        CONFIG.minimumTapDelay
      ) {
        return;
      }

      lastPointerTime = now;

      biteKerupuk();
    }
  );


  /* =========================================================
     22. SCREEN CHANGE
  ========================================================= */

  document.addEventListener(
    "clickbet:screenchange",
    (event) => {
      if (
        event.detail?.screen ===
        "kerupuk"
      ) {
        resetGame();

        window.setTimeout(() => {
          ELEMENTS.startButton?.focus();
        }, 300);
      } else if (isBusy()) {
        clearTimers();
        STATE.status = "idle";
      }
    }
  );


  /* =========================================================
     23. AUTO PAUSE
  ========================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.hidden &&
        isPlaying()
      ) {
        pauseGame();
      }
    }
  );


  /* =========================================================
     24. PUBLIC API
  ========================================================= */

  window.ClickbetKerupuk =
    Object.freeze({
      start:
        startCountdown,

      bite:
        biteKerupuk,

      tap:
        biteKerupuk,

      pause:
        pauseGame,

      resume:
        resumeGame,

      reset:
        resetGame,

      returnLobby:
        quitToLobby,

      getStatus() {
        return {
          status:
            STATE.status,

          progress:
            STATE.progress,

          remaining:
            Math.max(
              0,
              100 -
              STATE.progress
            ),

          time:
            STATE.remainingTime,

          taps:
            STATE.taps,

          combo:
            STATE.combo,

          bestCombo:
            STATE.bestCombo,

          score:
            STATE.score,

          swing:
            STATE.swing
        };
      }
    });


  /* =========================================================
     25. INITIALIZATION
  ========================================================= */

  createPremiumFeedback();
  resetGame();
  renderAll();

  console.info(
    "[CLICKBET88 PART 3] Premium Makan Kerupuk aktif."
  );
})();
