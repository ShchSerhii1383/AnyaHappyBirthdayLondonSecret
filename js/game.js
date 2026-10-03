/* =========================================================
   THE LONDON CASE — game.js (real-asset composition)
   Vanilla JS, no dependencies, no backend.
   Edit GAME_CONFIG below for password / message / sounds.
   ========================================================= */

const GAME_CONFIG = {
  password: "674", // three digits, each 1-9

  sounds: {
    ambient: "assets/audio/ambient.mp3",
    paper: "assets/audio/paper.mp3",
    clock: "assets/audio/clock.mp3",
    mechanism: "assets/audio/mechanism.mp3",
    wrong: "assets/audio/wrong.mp3",
    unlock: "assets/audio/unlock.mp3",
    envelope: "assets/audio/envelope.mp3",
    stamp: "assets/audio/stamp.mp3",
  },

  titleDurationMs: 4200,

  // rain tuning — see initRain()
  rain: {
    dropCount: 45,
    minDurationMs: 450,
    maxDurationMs: 950,
  },

};

const gameState = {
  newspaperViewed: false,
  clockViewed: false,
  letterViewed: false,
  drumValues: [1, 1, 1],
  unlocked: false,
};

const Sound = (() => {
  const cache = {};
  function get(name) {
    if (!GAME_CONFIG.sounds[name]) return null;
    if (!cache[name]) {
      try {
        const audio = new Audio(GAME_CONFIG.sounds[name]);
        audio.preload = "auto";
        cache[name] = audio;
      } catch (e) {
        cache[name] = null;
      }
    }
    return cache[name];
  }
  function play(name, { loop = false, volume = 0.7 } = {}) {
    const audio = get(name);
    if (!audio) return;
    try {
      audio.loop = loop;
      audio.volume = volume;
      audio.currentTime = 0;
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {
      /* audio must never break the game */
    }
  }
  return { play };
})();

const el = {
  sceneTitle: document.getElementById("scene-title"),
  sceneBoard: document.getElementById("scene-board"),
  sceneEnvelope: document.getElementById("scene-envelope"),
  sceneLetterFinal: document.getElementById("scene-letter"),
  stage: document.getElementById("stage"),
  windowRain: document.getElementById("window-rain"),

  zoomLayer: document.getElementById("zoom-layer"),
  zoomBackdrop: document.getElementById("zoom-backdrop"),
  zoomImg: document.getElementById("zoom-img"),

  lockbox: document.getElementById("lockbox"),
  boxClosed: document.getElementById("box-closed"),
  boxOpen: document.getElementById("box-open"),
  lockboxHotspot: document.getElementById("lockbox-hotspot"),
  lockboxMessage: document.getElementById("lockbox-message"),
  boxEnvelope: document.getElementById("box-envelope"),

  envelope: document.getElementById("envelope"),

  dossier: document.getElementById("dossier"),
  dossierReport: document.getElementById("dossier-report"),
  caseClosedStamp: document.getElementById("case-closed-stamp"),
  returnBtn: document.getElementById("return-btn"),
};

// -----------------------------------------------------------
// RAIN — individual falling drops inside the window pane
// -----------------------------------------------------------
function initRain() {
  if (!el.windowRain) return;
  const { dropCount, minDurationMs, maxDurationMs } = GAME_CONFIG.rain;

  for (let i = 0; i < dropCount; i++) {
    const drop = document.createElement("div");
    drop.className = "raindrop";

    const left = Math.random() * 100; // %
    const len = 18 + Math.random() * 26; // px
    const width = 1 + Math.random() * 1.4; // px
    const duration = minDurationMs + Math.random() * (maxDurationMs - minDurationMs);
    const delay = Math.random() * (maxDurationMs + minDurationMs); // ms, spread the start
    const drift = 6 + Math.random() * 6; // px of rightward drift as it falls (matches the board's rain angle)
    const opacity = 0.45 + Math.random() * 0.4;

    drop.style.left = left + "%";
    drop.style.setProperty("--len", len + "px");
    drop.style.setProperty("--w", width + "px");
    drop.style.setProperty("--dx", drift + "px");
    drop.style.setProperty("--op", opacity.toFixed(2));
    drop.style.animationDuration = duration + "ms";
    drop.style.animationDelay = "-" + delay + "ms"; // negative delay = already mid-fall on load, staggers them immediately

    el.windowRain.appendChild(drop);
  }
}

// -----------------------------------------------------------
// INTRO
// -----------------------------------------------------------
function initIntro() {
  const reveal = () => {
    el.sceneTitle.hidden = true;
    el.sceneBoard.hidden = false;
    Sound.play("ambient", { loop: true, volume: 0.22 });
  };
  window.setTimeout(reveal, GAME_CONFIG.titleDurationMs);
  el.sceneTitle.addEventListener("click", reveal);
}

// -----------------------------------------------------------
// EVIDENCE — FLIP zoom (the physical item is the modal)
// -----------------------------------------------------------
let activeEvidenceBtn = null;

function initEvidence() {
  const buttons = document.querySelectorAll(".evidence");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => openEvidence(btn));
  });

  el.zoomBackdrop.addEventListener("click", closeEvidence);
  el.zoomImg.addEventListener("click", closeEvidence);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.zoomLayer.hidden) closeEvidence();
  });
}

function openEvidence(btn) {
  if (activeEvidenceBtn) return; // one at a time
  activeEvidenceBtn = btn;

  const img = btn.querySelector("img");
  const srcRect = img.getBoundingClientRect();
  const name = btn.dataset.evidence;

  if (name === "newspaper") Sound.play("paper");
  if (name === "clock") Sound.play("clock");
  if (name === "letter") Sound.play("paper");

  // hide the board copy while its zoomed twin is shown
  btn.style.visibility = "hidden";

  el.zoomImg.src = img.src;
  el.zoomImg.alt = img.alt;

  // start the zoom image at the exact spot/size of the board thumbnail
  Object.assign(el.zoomImg.style, {
    top: srcRect.top + "px",
    left: srcRect.left + "px",
    width: srcRect.width + "px",
    height: srcRect.height + "px",
    transform: "rotate(0deg)",
  });

  el.zoomLayer.hidden = false;
  // force reflow so the transition from src->target rect actually animates
  void el.zoomImg.offsetWidth;
  el.zoomLayer.classList.add("is-visible");

  // compute target rect: centered, capped, preserving the image's own aspect ratio
  const naturalRatio = img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : srcRect.height / srcRect.width;
  const maxW = window.innerWidth * 0.62;
  const maxH = window.innerHeight * 0.82;
  let targetW = maxW;
  let targetH = targetW * naturalRatio;
  if (targetH > maxH) {
    targetH = maxH;
    targetW = targetH / naturalRatio;
  }
  const targetTop = (window.innerHeight - targetH) / 2;
  const targetLeft = (window.innerWidth - targetW) / 2;

  requestAnimationFrame(() => {
    Object.assign(el.zoomImg.style, {
      top: targetTop + "px",
      left: targetLeft + "px",
      width: targetW + "px",
      height: targetH + "px",
    });
  });
}

function closeEvidence() {
  if (!activeEvidenceBtn) return;
  const btn = activeEvidenceBtn;
  const img = btn.querySelector("img");
  const srcRect = img.getBoundingClientRect();

  el.zoomLayer.classList.remove("is-visible");
  Object.assign(el.zoomImg.style, {
    top: srcRect.top + "px",
    left: srcRect.left + "px",
    width: srcRect.width + "px",
    height: srcRect.height + "px",
  });

  window.setTimeout(() => {
    el.zoomLayer.hidden = true;
    btn.style.visibility = "visible";
    markExamined(btn.dataset.evidence);
    activeEvidenceBtn = null;
  }, 560);
}

// Marks a clue as viewed (drives the lock activation). No visual
// indicator is shown on the board itself, by design.
function markExamined(name) {
  const key = name + "Viewed";
  if (gameState[key]) return;
  gameState[key] = true;
  checkAllExamined();
}

function checkAllExamined() {
  const allDone = gameState.newspaperViewed && gameState.clockViewed && gameState.letterViewed;
  if (allDone && !gameState.unlocked) {
    el.lockbox.classList.add("is-ready");
    Sound.play("mechanism", { volume: 0.4 });
  }
}

// -----------------------------------------------------------
// CODE BOX — digit drums + hotspot
// -----------------------------------------------------------
function initLock() {
  const drums = document.querySelectorAll(".drum");

  drums.forEach((drum, index) => {
    const digitEl = drum.querySelector(".drum-digit");

    const render = () => {
      digitEl.textContent = gameState.drumValues[index];
      digitEl.classList.remove("is-spinning");
      void digitEl.offsetWidth;
      digitEl.classList.add("is-spinning");
    };

    const step = (delta) => {
      let v = gameState.drumValues[index] + delta;
      if (v > 9) v = 1;
      if (v < 1) v = 9;
      gameState.drumValues[index] = v;
      render();
      Sound.play("mechanism", { volume: 0.3 });
    };

    // click upper half = up, lower half = down
    drum.addEventListener("click", (e) => {
      const rect = drum.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      step(relY < rect.height / 2 ? 1 : -1);
    });

    drum.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        step(e.deltaY < 0 ? 1 : -1);
      },
      { passive: false }
    );

    let dragStartY = null;
    drum.addEventListener("pointerdown", (e) => {
      dragStartY = e.clientY;
    });
    drum.addEventListener("pointerup", (e) => {
      if (dragStartY === null) return;
      const dy = dragStartY - e.clientY;
      if (Math.abs(dy) > 18) step(dy > 0 ? 1 : -1);
      dragStartY = null;
    });
  });

  el.lockboxHotspot.addEventListener("click", attemptUnlock);
}

function showLockMessage(text) {
  el.lockboxMessage.textContent = text;
  el.lockboxMessage.classList.add("show");
  window.clearTimeout(showLockMessage._t);
  showLockMessage._t = window.setTimeout(() => {
    el.lockboxMessage.classList.remove("show");
  }, 2200);
}

function attemptUnlock() {
  if (gameState.unlocked) return;

  const allDone = gameState.newspaperViewed && gameState.clockViewed && gameState.letterViewed;

  if (!allDone) {
    showLockMessage("Not enough evidence.");
    shakeBox();
    return;
  }

  const attempt = gameState.drumValues.join("");
  if (attempt === GAME_CONFIG.password) {
    unlockSuccess();
  } else {
    Sound.play("wrong");
    showLockMessage(Math.random() > 0.5 ? "Something doesn't add up..." : "Sherlock would check the evidence again.");
    shakeBox();
  }
}

function shakeBox() {
  el.lockbox.classList.remove("shake");
  void el.lockbox.offsetWidth;
  el.lockbox.classList.add("shake");
}

function unlockSuccess() {
  gameState.unlocked = true;
  Sound.play("unlock");
  el.lockbox.classList.remove("is-ready");
  showLockMessage("The mechanism clicks open...");

  window.setTimeout(() => {
    el.lockbox.classList.add("is-open");
  }, 350);

  // The board no longer fades on a timer — the player takes the sealed
  // letter out of the box themselves (see initBoxEnvelope), and THAT
  // click is what carries us into the envelope scene.
}

// -----------------------------------------------------------
// SEALED LETTER, RESTING IN THE OPEN BOX
// -----------------------------------------------------------
let envelopeTaken = false;

function initBoxEnvelope() {
  if (!el.boxEnvelope) return;
  el.boxEnvelope.addEventListener("click", () => {
    if (envelopeTaken || !gameState.unlocked) return;
    envelopeTaken = true;
    takeEnvelopeFromBox();
  });
}

function takeEnvelopeFromBox() {
  Sound.play("paper");
  el.boxEnvelope.classList.add("is-taken");

  window.setTimeout(() => {
    el.sceneBoard.style.transition = "opacity 1.3s ease, filter 1.3s ease";
    el.sceneBoard.style.opacity = "0";
    el.sceneBoard.style.filter = "brightness(0)";
  }, 350);

  window.setTimeout(() => {
    el.sceneBoard.hidden = true;
    el.sceneEnvelope.hidden = false;
  }, 1750);
}

// -----------------------------------------------------------
// ENVELOPE -> BIRTHDAY LETTER
// -----------------------------------------------------------
function initEnvelope() {
  el.envelope.addEventListener("click", () => {
    if (el.envelope.classList.contains("is-open")) return;
    el.envelope.classList.add("is-open");
    Sound.play("envelope");

    window.setTimeout(() => {
      el.sceneEnvelope.hidden = true;
      el.sceneLetterFinal.hidden = false;
      revealDossier();
    }, 900);
  });
}

// -----------------------------------------------------------
// FINAL DOSSIER — a fixed timeline of reveals, all relative to the
// moment this scene becomes visible (t=0). Each entry's own CSS
// transition/animation supplies its actual duration; this just decides
// WHEN each one starts. Tune the delays here, not by editing CSS timing.
// -----------------------------------------------------------
const DOSSIER_TIMELINE = [
  { step: "dossier", delayMs: 0 }, // .dossier's own transition has a 0.3s built-in delay
  { step: "photo", delayMs: 1400 },
  { step: "ev-title", delayMs: 2100 },
  { step: "ev-1", delayMs: 2500 },
  { step: "ev-2", delayMs: 2830 },
  { step: "ev-3", delayMs: 3160 },
  { step: "ev-4", delayMs: 3500 },
  { step: "status", delayMs: 3800 },
  { step: "lead-in", delayMs: 4400 },
  { step: "wish", delayMs: 5000 },
  { step: "emphasis", delayMs: 6200 },
  { step: "closing", delayMs: 6800 },
  { step: "stamp", delayMs: 7700 },
  { step: "return", delayMs: 8500 },
];

function revealDossier() {
  DOSSIER_TIMELINE.forEach(({ step, delayMs }) => {
    window.setTimeout(() => applyDossierStep(step), delayMs);
  });
}

function applyDossierStep(step) {
  switch (step) {
    case "dossier":
      el.dossier.classList.add("is-visible");
      break;
    case "photo":
      el.dossier.classList.add("is-photo-visible");
      break;
    case "stamp":
      Sound.play("stamp");
      el.caseClosedStamp.hidden = false;
      break;
    case "return":
      el.returnBtn.hidden = false;
      break;
    default: {
      // the evidence lines and report paragraphs are all matched by their
      // data-step attribute, so adding a new line only needs an HTML edit
      // and one new entry in DOSSIER_TIMELINE above.
      const stepEl = el.dossierReport.querySelector(`[data-step="${step}"]`);
      if (stepEl) stepEl.classList.add("show");
    }
  }
}

function returnToJourney() {
  console.log("returnToJourney() called — wire this up to your PowerPoint flow.");
}

function initReturnButton() {
  el.returnBtn.addEventListener("click", returnToJourney);
}

// -----------------------------------------------------------
// BOOT
// -----------------------------------------------------------
function boot() {
  initRain();
  initIntro();
  initEvidence();
  initLock();
  initBoxEnvelope();
  initEnvelope();
  initReturnButton();
}

document.addEventListener("DOMContentLoaded", boot);
