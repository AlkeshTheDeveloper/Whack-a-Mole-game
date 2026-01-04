(function () {
  "use strict";

  const boxEls = document.querySelectorAll(".box");
  const boardEl = document.getElementById("gameboard");
  const scoreEl = document.getElementById("scores");
  const timerEl = document.getElementById("timer");
  const gameOverEl = document.getElementById("gameover");
  const scoreDisplayEl = document.getElementById("scoreDisplay");
  const restartBtnEl = document.getElementById("restartBtn");
  const startScreenEl = document.getElementById("startScreen");
  const startBtnEl = document.getElementById("startBtn");
  const countdownEl = document.getElementById("countdown");
  const gameOverAudioEl = document.getElementById("gameOverAudio");
  const bgAudioEl = document.getElementById("bgAudio");
  const hitAudioEl = document.getElementById("hitAudio");
  const themeBtnEl = document.getElementById("themeBtn");

  let score = 0;
  let time = null; // initialized in prepareNewGame()
  let currentMole = null;
  let moleInterval = null;
  let timerInterval = null;
  let isRunning = false;

  // constants
  const HIT_OVERLAY_MS = 140;
  const MOLE_HIT_MS = 350;
  const CURSOR_RESET_MS = 150;
  const MOLE_INTERVAL_MS = 800;
  const GAME_TIME_SECONDS = 60;

  /**
   * Safely plays an HTMLAudioElement (no-op if unavailable).
   * @param {HTMLMediaElement} el
   */
  function playAudio(el) {
    if (!el) return;
    try {
      el.currentTime = 0;
      el.play().catch(() => {});
    } catch (e) {
      // ignore
    }
  }

  /**
   * Toggle the 'no-cursor' class across the board, body, and boxes
   * @param {boolean} hide
   */
  function setNoCursor(hide) {
    if (hide) {
      boardEl.classList.add("no-cursor");
      document.body.classList.add("no-cursor");
      boxEls.forEach((b) => b.classList.add("no-cursor"));
    } else {
      boardEl.classList.remove("no-cursor");
      document.body.classList.remove("no-cursor");
      boxEls.forEach((b) => b.classList.remove("no-cursor"));
    }
  }

  /**
   * Prepare internal state & UI for a fresh game (does not start timers)
   */
  function prepareNewGame() {
    score = 0;
    time = GAME_TIME_SECONDS;
    scoreEl.textContent = score;
    timerEl.textContent = time;
    // clear active moles/hit states
    boxEls.forEach((b) => b.classList.remove("mole", "mole-hit", "hammer-hit"));
    currentMole = null;
    // ensure board is hidden while not playing
    boardEl.classList.add("hidden");
  }

  /**
   * Display a 3..1 countdown overlay then call onComplete
   * @param {Function} onComplete
   */
  /**
   * Display a 3..1 countdown overlay then call onComplete
   * Ensures a previous countdown is cleared if one exists.
   * @param {Function} onComplete
   * @returns {void}
   */
  let countdownInterval = null;
  function showCountdown(onComplete) {
    // clear any previous countdown
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    let count = 3;
    countdownEl.textContent = count;
    // ensure hidden attribute is cleared so CSS can show via .show
    countdownEl.hidden = false;
    countdownEl.classList.add("show");

    countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.textContent = count;
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownEl.classList.remove("show");
        // hide element again
        countdownEl.hidden = true;
        if (typeof onComplete === "function") onComplete();
      }
    }, 1000);
  }

  /**
   * Hit overlay element used for consistent hit visual feedback.
   * Created on-demand and positioned at the provided coordinates.
   * @type {HTMLElement|null}
   */
  let hitOverlay = null;

  /**
   * Create the hit overlay DOM element (no-op if already created).
   * @returns {void}
   */
  function createHitOverlay() {
    if (hitOverlay) return;
    hitOverlay = document.createElement("div");
    hitOverlay.className = "hit-overlay hide";
    document.body.appendChild(hitOverlay);
  }

  /**
   * Show the hit overlay at (x, y) and auto-hide after HIT_OVERLAY_MS.
   * @param {number} x - page X coordinate
   * @param {number} y - page Y coordinate
   * @returns {void}
   */
  function showHitOverlay(x, y) {
    createHitOverlay();
    hitOverlay.style.left = x + "px";
    hitOverlay.style.top = y + "px";
    // force visible
    hitOverlay.classList.remove("hide");
    // hide after short time
    setTimeout(() => hitOverlay.classList.add("hide"), HIT_OVERLAY_MS);
  }

  /* ================= UI / EVENT HANDLERS ================= */

  // guard to avoid double-registration of listeners
  let listenersAttached = false;

  /* Box handler functions (named so we can add/remove them safely) */
  function onBoxPointerDown(e) {
    const box = e.currentTarget;
    box.classList.add("hammer-hit");
    boardEl.classList.add("hit-cursor");
    document.body.classList.add("hit-cursor");
    // force repaint
    void box.offsetWidth;
  }

  function onBoxPointerUp(e) {
    const box = e.currentTarget;
    setTimeout(() => {
      box.classList.remove("hammer-hit");
      boardEl.classList.remove("hit-cursor");
      document.body.classList.remove("hit-cursor");
    }, CURSOR_RESET_MS);
  }

  function onBoxPointerLeave(e) {
    const box = e.currentTarget;
    setTimeout(() => {
      box.classList.remove("hammer-hit");
      boardEl.classList.remove("hit-cursor");
      document.body.classList.remove("hit-cursor");
    }, CURSOR_RESET_MS);
  }

  function onBoxClick(e) {
    const box = e.currentTarget;
    if (box !== currentMole) return;

    score++;
    scoreEl.textContent = score;

    // visual overlay fallback at click position
    showHitOverlay(e.pageX || e.clientX, e.pageY || e.clientY);

    // play hit audio
    playAudio(hitAudioEl);

    // show hammer-hit animation class (visual only)
    box.classList.add("hammer-hit");

    // hide the regular cursor immediately and remove any 'hit-cursor' (so only overlay shows)
    boardEl.classList.add("no-cursor");
    document.body.classList.add("no-cursor");
    boxEls.forEach((b) => b.classList.add("no-cursor"));
    boardEl.classList.remove("hit-cursor");
    document.body.classList.remove("hit-cursor");

    // force a repaint to encourage the cursor update on some browsers
    void box.offsetWidth;

    // change mole image to 'hit' version and prevent reselection
    box.classList.remove("mole");
    box.classList.add("mole-hit");
    currentMole = null;

    // revert visual classes after a short delay so hit image is visible briefly
    setTimeout(() => {
      box.classList.remove("hammer-hit");
      boardEl.classList.remove("no-cursor");
      document.body.classList.remove("no-cursor");
      boxEls.forEach((b) => b.classList.remove("no-cursor"));
      // remove mole-hit so this box can be used again
      box.classList.remove("mole-hit");
    }, MOLE_HIT_MS);
  }

  function onStartScreenPointerDown(e) {
    // diagnostics
    console.debug("[GAME] startScreen pointerdown", {
      visible: !startBtnEl?.hidden,
      display: startBtnEl?.style?.display,
    });

    // fallback: if the pointer event falls within the start button's bounding box
    // (useful when another element may be intercepting events), trigger start
    if (!startBtnEl) {
      console.error("[GAME] startBtnEl missing on startScreen pointerdown");
      return;
    }

    const rect = startBtnEl.getBoundingClientRect();

    // if bounding rect is zero-sized log it (could indicate CSS hiding/overlay issue)
    if (rect.width === 0 || rect.height === 0) {
      console.warn(
        "[GAME] startBtn has zero size (may be hidden by CSS or overlapped)"
      );
    }

    const x = e.clientX;
    const y = e.clientY;
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      // simulate a click on the visible start button
      console.debug("[GAME] startScreen fallback triggered onStartClick");
      onStartClick();
    }
  }

  let globalStartPointerHandler = null;

  function globalStartPointerDown(e) {
    // active only while start screen is visible
    if (!startScreenEl || !startBtnEl) return;
    if (startBtnEl.hidden || startBtnEl.disabled) return;

    const rect = startBtnEl.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      console.debug(
        "[GAME] globalStartPointerDown detected click in start button area"
      );
      onStartClick(e);
    }
  }

  function attachUIListeners() {
    if (listenersAttached) {
      console.warn("UI listeners already attached");
      return;
    }

    boxEls.forEach((box) => {
      box.addEventListener("pointerdown", onBoxPointerDown);
      box.addEventListener("pointerup", onBoxPointerUp);
      box.addEventListener("pointerleave", onBoxPointerLeave);
      box.addEventListener("click", onBoxClick);
    });

    // note: start/restart/theme listeners are attached via these named handler functions
    if (startBtnEl) {
      startBtnEl.addEventListener("click", onStartClick);
      startBtnEl.addEventListener("pointerdown", onStartClick);
      startBtnEl.addEventListener("touchstart", onStartClick, {
        passive: false,
      });
    }
    if (restartBtnEl) restartBtnEl.addEventListener("click", onRestartClick);
    if (themeBtnEl) themeBtnEl.addEventListener("click", onThemeClick);

    // attach the start screen fallback pointer handler so taps on the visual
    // button area still start the game if the button itself doesn't receive events
    if (startScreenEl)
      startScreenEl.addEventListener("pointerdown", onStartScreenPointerDown);

    // add a global pointerdown while the start screen is visible as a last-resort
    globalStartPointerHandler = globalStartPointerDown;
    document.addEventListener("pointerdown", globalStartPointerHandler);

    listenersAttached = true;
    console.debug("[GAME] UI listeners attached", { listenersAttached });
  }

  function detachUIListeners() {
    if (!listenersAttached) return;

    boxEls.forEach((box) => {
      box.removeEventListener("pointerdown", onBoxPointerDown);
      box.removeEventListener("pointerup", onBoxPointerUp);
      box.removeEventListener("pointerleave", onBoxPointerLeave);
      box.removeEventListener("click", onBoxClick);
    });

    startBtnEl.removeEventListener("click", onStartClick);
    startBtnEl.removeEventListener("pointerdown", onStartClick);
    startBtnEl.removeEventListener("touchstart", onStartClick, {
      passive: false,
    });
    restartBtnEl.removeEventListener("click", onRestartClick);
    themeBtnEl.removeEventListener("click", onThemeClick);

    startScreenEl.removeEventListener("pointerdown", onStartScreenPointerDown);

    if (globalStartPointerHandler) {
      document.removeEventListener("pointerdown", globalStartPointerHandler);
      globalStartPointerHandler = null;
    }

    listenersAttached = false;
  }

  /**
   * Init / teardown helpers for testing and ensuring idempotent setup
   */
  function initGame() {
    // safe-init: detach then attach to avoid duplicates, and validate DOM
    try {
      detachUIListeners();
    } catch (e) {
      // ignore
    }

    if (!startBtnEl || !startScreenEl || !boardEl) {
      console.error("[GAME] critical DOM elements missing", {
        startBtnEl: !!startBtnEl,
        startScreenEl: !!startScreenEl,
        boardEl: !!boardEl,
      });
    }

    attachUIListeners();
    prepareNewGame();

    console.debug("[GAME] initGame completed", getGameState());
  }

  function teardownGame() {
    detachUIListeners();
    stopGame();
    prepareNewGame();

    // cleanup overlays/resources
    if (hitOverlay) {
      hitOverlay.remove();
      hitOverlay = null;
    }

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownEl.classList.remove("show");
      countdownEl.hidden = true;
    }

    // remove global pointer handler if present
    if (globalStartPointerHandler) {
      document.removeEventListener("pointerdown", globalStartPointerHandler);
      globalStartPointerHandler = null;
    }
  }

  function getGameState() {
    return { score, time, isRunning, listenersAttached };
  }

  /* ================= MOLE ================= */

  /**
   * Spawn a mole in a random available box (skipping boxes showing 'mole-hit').
   * @returns {void}
   */
  function showMole() {
    // clear any existing 'mole' markers (don't touch 'mole-hit')
    boxEls.forEach((b) => b.classList.remove("mole"));

    // pick from boxes that are not currently showing a 'mole-hit' state
    const available = Array.from(boxEls).filter(
      (b) => !b.classList.contains("mole-hit")
    );
    if (available.length === 0) return; // no available boxes

    const randomBox = available[Math.floor(Math.random() * available.length)];
    randomBox.classList.add("mole");
    currentMole = randomBox;
  }

  // Box click behavior is now handled by the named `onBoxClick` handler
  // which is attached/detached via `attachUIListeners` / `detachUIListeners`.

  /* ================= TIMER ================= */

  /**
   * Start the game loop (idempotent).
   * Starts mole spawn interval and countdown timer.
   * @returns {void}
   */
  function startGame() {
    if (isRunning) return;
    isRunning = true;

    // ensure a valid timer value
    if (typeof time !== "number" || time <= 0) time = GAME_TIME_SECONDS;

    // start mole spawns and countdown timer
    moleInterval = setInterval(showMole, MOLE_INTERVAL_MS);

    timerInterval = setInterval(() => {
      time--;
      timerEl.textContent = time;

      if (time <= 0) {
        endGame();
      }
    }, 1000);
  }

  /**
   * Stop the game loop and clear intervals.
   * Ensures internal interval handles are nulled for restart safety.
   * Also cancels a running countdown overlay if present.
   * @returns {void}
   */
  function stopGame() {
    isRunning = false;
    if (moleInterval) {
      clearInterval(moleInterval);
      moleInterval = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownEl.classList.remove("show");
      countdownEl.hidden = true;
    }
  }

  /**
   * End game and show game over UI.
   * Stops running loops, hides the board and plays the game over sound.
   * @returns {void}
   */
  function endGame() {
    stopGame();

    boardEl.classList.add("hidden");
    gameOverEl.hidden = false;
    scoreDisplayEl.textContent = score;

    // stop background audio and play game over sound
    if (bgAudioEl) {
      bgAudioEl.pause();
      bgAudioEl.currentTime = 0;
    }

    playAudio(gameOverAudioEl);
  }

  function onRestartClick() {
    // stop any running loops and hide game over
    stopGame();
    gameOverEl.hidden = true;
    // ensure start card stays hidden
    startScreenEl.style.display = "none";
    startBtnEl.hidden = true;

    // show countdown overlay and restart game after it finishes
    showCountdown(() => {
      prepareNewGame();
      boardEl.classList.remove("hidden");

      if (bgAudioEl) {
        bgAudioEl.currentTime = 0;
        playAudio(bgAudioEl);
      }

      startGame();
    });
  }

  function onStartClick(e) {
    try {
      console.debug("[GAME] onStartClick invoked", { evtType: e?.type });

      if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!startBtnEl) {
        console.error("[GAME] startBtnEl missing in onStartClick");
        return;
      }

      // prevent double activation
      if (startBtnEl.disabled) {
        console.warn("[GAME] startBtn already disabled, ignoring extra click");
        return;
      }

      // hide start card immediately per requested flow
      startScreenEl.style.display = "none";
      startBtnEl.hidden = true;
      startBtnEl.disabled = true;

      // ensure we clear any previous game state
      stopGame();

      // remove global pointer handler once we start so it doesn't interfere
      if (globalStartPointerHandler) {
        document.removeEventListener("pointerdown", globalStartPointerHandler);
        globalStartPointerHandler = null;
      }

      // show countdown overlay and start the game after it finishes
      showCountdown(() => {
        prepareNewGame();
        boardEl.classList.remove("hidden");

        if (bgAudioEl) {
          bgAudioEl.currentTime = 0;
          playAudio(bgAudioEl);
        }

        startGame();
      });
    } catch (err) {
      console.error("[GAME] error in onStartClick", err);
    }
  }

  /* ================= THEME SWITCHER ================= */

  const themes = ["body", "theme-forest", "theme-night", "theme-desert"];
  let themeIndex = 0;

  function onThemeClick() {
    document.body.classList.remove(...themes);
    themeIndex = (themeIndex + 1) % themes.length;
    if (themes[themeIndex]) {
      document.body.classList.add(themes[themeIndex]);
    }
  }

  /**
   * Simple smoke tests to validate start/stop behavior (invoke from console).
   * Returns an object with boolean 'started' and 'stopped' fields for quick verification.
   * @returns {{started:boolean,stopped:boolean}}
   */
  function runSmokeTests() {
    // ensure a clean state first
    stopGame();
    prepareNewGame();

    const beforeClean = !moleInterval && !timerInterval && !isRunning;
    startGame();
    const started = !!(isRunning && moleInterval && timerInterval);
    stopGame();
    const stopped = !!(!moleInterval && !timerInterval && !isRunning);

    return { beforeClean, started, stopped };
  }

  // expose for manual testing
  if (typeof window !== "undefined") {
    window.runSmokeTests = runSmokeTests;
    window.initGame = initGame;
    window.teardownGame = teardownGame;
    window.getGameState = getGameState;
  }

  // initialize listeners by default so page behaviour is unchanged
  initGame();
})();
