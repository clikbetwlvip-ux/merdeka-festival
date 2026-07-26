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
