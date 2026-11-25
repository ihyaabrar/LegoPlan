import * as THREE from 'three';
import { createStudioScene } from './scene.js';
import { F77Lancer, BUILD_STEPS } from './model/f77Lancer.js';
import { AssemblyGame, getBlockSvg } from './game/assemblyGame.js';
import { FlightSimulator } from './sim/flightSim.js';
import { soundFX } from './game/sound.js';
import referenceImgUrl from '../LEGO Pesawat Tempur F-77 Lancer.png';
import heroRenderUrl from './assets/hero-f77-render.png';
import previewFlightUrl from './assets/preview-flight.png';
import previewGameUrl from './assets/preview-game.png';
import previewStudioUrl from './assets/preview-studio.png';

const viewport = document.getElementById('viewport');
const viewportStatus = document.getElementById('viewport-status');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let studio;
let jet;
try {
  studio = createStudioScene(viewport);
  jet = new F77Lancer();
  studio.scene.add(jet.root);
  viewportStatus.classList.add('hidden');
} catch (err) {
  viewportStatus.textContent = 'WebGL tidak tersedia pada perangkat atau browser ini. Aktifkan akselerasi hardware untuk menampilkan model 3D.';
  viewportStatus.classList.add('error');
  throw err;
}

const refImg = document.getElementById('ref-img');
refImg.src = referenceImgUrl;
document.getElementById('dash-hero-img').src = heroRenderUrl;
document.getElementById('dash-prev-flight').src = previewFlightUrl;
document.getElementById('dash-prev-game').src = previewGameUrl;
document.getElementById('dash-prev-studio').src = previewStudioUrl;

const totalBricksText = String(jet.blocks.length);
for (const id of ['dash-hero-bricks', 'dash-spec-bricks', 'dash-game-bricks', 'v-total-bricks']) {
  const el = document.getElementById(id);
  if (el) el.textContent = totalBricksText;
}

const brandHomeBtn = document.getElementById('brand-home-btn');
const modeDashboardBtn = document.getElementById('mode-dashboard');
const modeStudioBtn = document.getElementById('mode-studio');
const modeGameBtn = document.getElementById('mode-game');
const modeFlightBtn = document.getElementById('mode-flight');

const dashboardView = document.getElementById('dashboard-view');
const gameHud = document.getElementById('game-hud');
const flightHud = document.getElementById('flight-hud');

brandHomeBtn.addEventListener('click', () => switchAppMode('dashboard', true));
document.getElementById('cta-flight').addEventListener('click', () => switchAppMode('flight', true));
document.getElementById('cta-game').addEventListener('click', () => switchAppMode('game', true));
document.getElementById('cta-studio').addEventListener('click', () => switchAppMode('studio', true));
document.getElementById('btn-footer-ref').addEventListener('click', () => openRefModal());
document.querySelectorAll('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => switchAppMode(btn.dataset.goto, true));
});
document.querySelectorAll('[data-studio-cam]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const camKey = btn.dataset.studioCam;
    switchAppMode('studio', true);
    selectCamera(camKey);
    if (camKey === 'cockpit') jet.setCanopyOpen(true);
    else if (camKey === 'engines') jet.setAfterburner(true);
    else if (camKey === 'gear') jet.setGearDown(true);
    syncToggleButtons();
  });
});

const btnCanopy = document.getElementById('btn-canopy');
const btnAfterburner = document.getElementById('btn-afterburner');
const btnGear = document.getElementById('btn-gear');
const btnFlight = document.getElementById('btn-flight');
const btnMissiles = document.getElementById('btn-missiles');
const btnAutoRotate = document.getElementById('btn-autorotate');

const sliderExplode = document.getElementById('slider-explode');
const explodeVal = document.getElementById('explode-val');

const sliderStep = document.getElementById('slider-step');
const stepVal = document.getElementById('step-val');
const stepCaption = document.getElementById('step-caption');
const btnStepPrev = document.getElementById('btn-step-prev');
const btnStepNext = document.getElementById('btn-step-next');
const btnStepPlay = document.getElementById('btn-step-play');

const controlPanel = document.getElementById('control-panel');
const btnTogglePanel = document.getElementById('btn-toggle-panel');
const btnReference = document.getElementById('btn-reference');
const refModal = document.getElementById('ref-modal');
const btnCloseRef = document.getElementById('btn-close-ref');

const gStepBadge = document.getElementById('g-step-badge');
const gStageName = document.getElementById('g-stage-name');
const gStageDesc = document.getElementById('g-stage-desc');
const gPcsLabel = document.getElementById('g-pcs-label');
const gPctLabel = document.getElementById('g-pct-label');
const gProgressFill = document.getElementById('g-progress-fill');
const gScore = document.getElementById('g-score');
const gComboPill = document.getElementById('g-combo-pill');
const gCombo = document.getElementById('g-combo');
const gTimer = document.getElementById('g-timer');
const gToast = document.getElementById('g-toast');
const gPartsTray = document.getElementById('g-parts-tray');
const gInstruction = document.getElementById('g-instruction');
const btnGPrevStep = document.getElementById('btn-g-prevstep');
const btnGNextStep = document.getElementById('btn-g-nextstep');
const btnGAutoStage = document.getElementById('btn-g-autostage');
const btnGHint = document.getElementById('btn-g-hint');
const btnGMute = document.getElementById('btn-g-mute');
const btnGRestart = document.getElementById('btn-g-restart');

const dragGhost = document.getElementById('drag-ghost');
const dragGhostSvg = document.getElementById('drag-ghost-svg');
const dragGhostName = document.getElementById('drag-ghost-name');
const dragGhostStatus = document.getElementById('drag-ghost-status');

const victoryModal = document.getElementById('victory-modal');
const vStars = document.getElementById('v-stars');
const vScore = document.getElementById('v-score');
const vTime = document.getElementById('v-time');
const vAcc = document.getElementById('v-acc');
const vCombo = document.getElementById('v-combo');
const btnVReplay = document.getElementById('btn-v-replay');
const btnVFlight = document.getElementById('btn-v-flight');

const fReticle = document.getElementById('f-reticle');
const fLockBadge = document.getElementById('f-lock-badge');
const fPhase = document.getElementById('f-phase');
const fSpeed = document.getElementById('f-speed');
const fMach = document.getElementById('f-mach');
const fAlt = document.getElementById('f-alt');
const fGearStatus = document.getElementById('f-gear-status');
const fThrottleVal = document.getElementById('f-throttle-val');
const fThrottleSlider = document.getElementById('f-throttle-slider');
const fMissiles = document.getElementById('f-missiles');
const fKills = document.getElementById('f-kills');
const fRings = document.getElementById('f-rings');
const fToast = document.getElementById('f-toast');
const fBtnAmmo = document.getElementById('f-btn-ammo');

const btnFTakeoff = document.getElementById('btn-f-takeoff');
const btnFLanding = document.getElementById('btn-f-landing');
const btnFFire = document.getElementById('btn-f-fire');
const btnFReload = document.getElementById('btn-f-reload');
const btnFAb = document.getElementById('btn-f-ab');
const btnFGear = document.getElementById('btn-f-gear');
const btnFCam = document.getElementById('btn-f-cam');
const btnFReset = document.getElementById('btn-f-reset');

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

let toastTimer = null;
function showGameToast(type, text) {
  gToast.className = `g-toast ${type}`;
  gToast.textContent = text;
  gToast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => gToast.classList.add('hidden'), 2000);
}

let fToastTimer = null;
function showFlightToast(text) {
  fToast.textContent = text;
  fToast.classList.remove('hidden');
  clearTimeout(fToastTimer);
  fToastTimer = setTimeout(() => fToast.classList.add('hidden'), 2400);
}

let hintedKey = null;
let latestInventory = [];
let lastScrolledSelectedKey = null;
let victoryModalTimer = null;

const game = new AssemblyGame(jet, studio, {
  onStateChange: renderGameHUD,
  onFeedback: ({ type, text, requiredKey }) => {
    if (type === 'error' && requiredKey) {
      hintedKey = requiredKey;
    }
    showGameToast(type, text);
  },
  onVictory: (summary) => {
    vStars.textContent = '★'.repeat(summary.stars) + '☆'.repeat(3 - summary.stars);
    vScore.textContent = summary.score.toLocaleString('id-ID');
    vTime.textContent = formatTime(summary.elapsedSec);
    vAcc.textContent = `${summary.accuracy}%`;
    vCombo.textContent = `x${Math.max(1, summary.maxCombo)}`;
    clearTimeout(victoryModalTimer);
    victoryModalTimer = setTimeout(() => {
      if (currentMode === 'game' && game.active && game.completed) {
        victoryModal.classList.remove('hidden');
        btnVFlight.focus();
      }
    }, 650);
  },
});

const flightSim = new FlightSimulator(jet, studio, {
  onHudUpdate: renderFlightHUD,
  onNotify: (msg) => showFlightToast(msg),
});

let currentMode = 'dashboard';
window.__F77__ = { jet, studio, game, flightSim, switchAppMode };

function renderFlightHUD(h) {
  const phaseLabels = {
    PARKED: 'DI LANDASAN (SIAP)',
    TAKEOFF: 'TAKE-OFF',
    AIRBORNE: 'MENGUDARA',
    LANDING: 'PENDARATAN',
  };
  fPhase.textContent = phaseLabels[h.phase] || h.phase;
  fSpeed.textContent = String(h.speedKnots);
  fMach.textContent = `MACH ${h.mach}`;
  fAlt.textContent = String(h.altitudeFt);
  fGearStatus.textContent = h.gearDown ? 'GEAR DOWN' : 'GEAR UP';
  fThrottleVal.textContent = `${h.throttlePct}%${h.afterburner ? ' AB' : ''}`;
  if (document.activeElement !== fThrottleSlider) {
    fThrottleSlider.value = String(h.throttlePct);
  }

  fMissiles.textContent = `${h.missilesLeft} / 6`;
  fBtnAmmo.textContent = String(h.missilesLeft);
  fKills.textContent = `${h.targetsDestroyed} / ${h.targetsTotal}`;
  fRings.textContent = `${h.ringsPassed} / ${h.ringsTotal}`;

  btnFAb.classList.toggle('active', h.afterburner);
  btnFAb.setAttribute('aria-pressed', String(h.afterburner));
  btnFGear.classList.toggle('active', h.gearDown);
  btnFGear.setAttribute('aria-pressed', String(h.gearDown));

  if (h.lockedTargetId) {
    fReticle.classList.add('locked');
    fLockBadge.textContent = `LOCK ON: DRONE #${h.lockedTargetId}`;
    fLockBadge.classList.remove('hidden');
  } else {
    fReticle.classList.remove('locked');
    fLockBadge.classList.add('hidden');
  }
}

btnFTakeoff.addEventListener('click', () => flightSim.startAutoTakeOff());
btnFLanding.addEventListener('click', () => flightSim.startAutoLanding());
btnFFire.addEventListener('click', () => flightSim.fireMissile());
btnFReload.addEventListener('click', () => flightSim.reloadMissiles());
btnFAb.addEventListener('click', () => flightSim.toggleAfterburner());
btnFGear.addEventListener('click', () => flightSim.toggleGear());
btnFCam.addEventListener('click', () => flightSim.cycleCamera());
btnFReset.addEventListener('click', () => flightSim.resetRunway());
fThrottleSlider.addEventListener('input', (e) => {
  flightSim.autoMode = null;
  flightSim.setThrottle(Number(e.target.value) / 100);
});

function renderGameHUD(state) {
  if (!state.active) return;

  btnGPrevStep.disabled = state.currentStep <= 1;
  btnGNextStep.disabled = state.currentStep >= state.totalStages;
  btnGAutoStage.classList.toggle('hidden', state.completed);
  btnGAutoStage.classList.toggle('running', state.autoBuilding);
  btnGAutoStage.textContent = state.autoBuilding ? 'Stop Auto' : 'Auto Tahap';

  const pct = Math.round((state.placedTotal / Math.max(1, state.totalBlocks)) * 100);
  gPcsLabel.textContent = `Bata ${state.placedTotal} / ${state.totalBlocks}`;
  gPctLabel.textContent = `${pct}%`;
  gProgressFill.style.width = `${pct}%`;
  gScore.textContent = state.score.toLocaleString('id-ID');

  if (state.combo > 1) {
    gComboPill.classList.remove('hidden');
    gCombo.textContent = `x${Math.min(5, state.combo)}`;
  } else {
    gComboPill.classList.add('hidden');
  }

  if (state.completed) {
    gStepBadge.textContent = 'SELESAI';
    gStageName.textContent = 'Model F-77 Lancer lengkap';
    gStageDesc.textContent = `Seluruh ${state.totalBlocks} bata LEGO standar berhasil dirakit.`;
    gPartsTray.innerHTML = '';
    latestInventory = [];
    gInstruction.textContent = 'Perakitan selesai. Lanjutkan ke Simulasi Terbang atau rakit ulang.';
    return;
  }

  const st = state.stage;
  gStepBadge.textContent = `TAHAP ${st.step}/${state.totalStages} (${state.stepPlaced}/${state.stepTotal})`;
  gStageName.textContent = st.name;
  gStageDesc.textContent = st.shortDesc;

  const selItem = state.inventory.find((it) => it.key === state.selectedPartKey && it.remaining > 0);
  if (selItem) {
    gInstruction.textContent =
      `Bata aktif: ${selItem.name} (${selItem.colorName}). Klik hologram biru di 3D, seret kartu, atau tekan Spasi.`;
  } else {
    gInstruction.textContent =
      'Pilih jenis bata LEGO dari Daftar Part Tahap Ini, lalu klik hologram biru pada pesawat 3D.';
  }

  latestInventory = state.inventory;
  const prevScrollLeft = gPartsTray.scrollLeft;
  const selectionChanged = state.selectedPartKey !== lastScrolledSelectedKey;
  lastScrolledSelectedKey = state.selectedPartKey;
  let selectedWrapEl = null;

  gPartsTray.innerHTML = '';

  state.inventory.forEach((item, idx) => {
    const isDone = item.remaining === 0;
    const isSelected = !isDone && state.selectedPartKey === item.key;
    const isHinted = !isDone && hintedKey === item.key;

    const wrap = document.createElement('div');
    wrap.setAttribute('role', 'listitem');

    const el = document.createElement('button');
    el.type = 'button';
    el.disabled = isDone;
    el.className = `part-card${isSelected ? ' selected' : ''}${isDone ? ' done' : ''}${isHinted ? ' hint-glow' : ''}`;
    el.dataset.key = item.key;
    el.setAttribute('aria-pressed', String(isSelected));
    el.innerHTML = `
      ${idx < 9 ? `<span class="part-key-badge" aria-hidden="true">${idx + 1}</span>` : ''}
      <span class="part-qty-badge">${isDone ? 'OK' : `x${item.remaining}`}</span>
      <div class="part-card-thumb" aria-hidden="true">${getBlockSvg(item.icon, item.colorHex)}</div>
      <span class="part-card-name">${item.name}</span>
      <span class="part-card-meta">
        <span class="part-swatch" style="background:${item.colorHex}" aria-hidden="true"></span>
        <span>${item.colorName}</span>
      </span>
    `;

    if (!isDone) {
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        startCardPointerGesture(e, item);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (game.selectedPartKey === item.key) {
            hintedKey = null;
            game.placeNextSelected();
          } else {
            game.selectPart(item.key);
          }
        }
      });
    }

    wrap.appendChild(el);

    if (isSelected) {
      selectedWrapEl = wrap;
      const snapBtn = document.createElement('button');
      snapBtn.type = 'button';
      snapBtn.className = 'part-snap-btn';
      snapBtn.textContent = 'Pasang +1';
      snapBtn.addEventListener('click', () => {
        hintedKey = null;
        game.placeNextSelected();
      });
      wrap.appendChild(snapBtn);
    }

    gPartsTray.appendChild(wrap);
  });

  gPartsTray.scrollLeft = prevScrollLeft;
  if (selectionChanged && selectedWrapEl) {
    requestAnimationFrame(() => {
      selectedWrapEl.scrollIntoView({
        behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
    });
  }
}

let activeDrag = null;
function startCardPointerGesture(downEvt, item) {
  activeDrag = {
    item,
    pointerId: downEvt.pointerId,
    pointerType: downEvt.pointerType,
    startX: downEvt.clientX,
    startY: downEvt.clientY,
    isDragging: false,
  };
}

function cancelActiveDrag() {
  if (!activeDrag) return;
  const wasDragging = activeDrag.isDragging;
  activeDrag = null;
  if (wasDragging) {
    dragGhost.classList.add('hidden');
    studio.controls.enabled = currentMode === 'studio' || currentMode === 'game';
    game.setDraggingPart(null);
    game.setHoveredSlot(null);
  }
}

window.addEventListener('pointermove', (e) => {
  if (!game.active || game.completed) return;

  if (activeDrag) {
    if (e.pointerId !== activeDrag.pointerId) return;
    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;
    const dist = Math.hypot(dx, dy);

    // On touch devices, allow horizontal pan-x scrolling inside the parts tray unless pulling upward
    const shouldStartDrag =
      activeDrag.pointerType === 'mouse'
        ? dist > 12
        : dy < -12 && Math.abs(dy) > Math.abs(dx);

    if (!activeDrag.isDragging && shouldStartDrag) {
      activeDrag.isDragging = true;
      game.setDraggingPart(activeDrag.item.key);
      studio.controls.enabled = false;
      dragGhostSvg.innerHTML = getBlockSvg(activeDrag.item.icon, activeDrag.item.colorHex);
      dragGhostName.textContent = `${activeDrag.item.name} (${activeDrag.item.colorName})`;
      dragGhost.classList.remove('hidden');
    }

    if (activeDrag.isDragging) {
      dragGhost.style.left = `${e.clientX}px`;
      dragGhost.style.top = `${e.clientY}px`;
      const slot = game.raycastSlot(e.clientX, e.clientY, activeDrag.item.key);
      game.setHoveredSlot(slot);
      const isMatch = Boolean(slot && slot.key === activeDrag.item.key);
      dragGhost.classList.toggle('snap-ready', isMatch);
      dragGhostStatus.textContent = isMatch
        ? 'Lepas untuk pasang bata'
        : slot
          ? `Slot ini butuh ${slot.block.meta.label}`
          : 'Arahkan ke hologram biru di 3D...';
    }
    return;
  }

  if (game.selectedPartKey) {
    const slot = game.raycastSlot(e.clientX, e.clientY, game.selectedPartKey);
    game.setHoveredSlot(slot);
    viewport.classList.toggle('can-snap', Boolean(slot && slot.key === game.selectedPartKey));
  } else {
    game.setHoveredSlot(null);
    viewport.classList.remove('can-snap');
  }
});

window.addEventListener('pointerup', (e) => {
  if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
  const drag = activeDrag;
  activeDrag = null;

  if (drag.isDragging) {
    dragGhost.classList.add('hidden');
    studio.controls.enabled = true;
    const slot = game.raycastSlot(e.clientX, e.clientY, drag.item.key);
    game.setDraggingPart(null);
    game.setHoveredSlot(null);
    if (slot) {
      hintedKey = null;
      game.placeIntoSlot(slot, drag.item.key);
    } else {
      game.selectPart(drag.item.key);
    }
  } else {
    hintedKey = null;
    game.selectPart(drag.item.key);
  }
});

window.addEventListener('pointercancel', cancelActiveDrag);
window.addEventListener('blur', cancelActiveDrag);

let canvasDownPos = null;
studio.renderer.domElement.addEventListener('pointerdown', (e) => {
  canvasDownPos = { x: e.clientX, y: e.clientY };
});

studio.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!game.active || game.completed || !canvasDownPos) return;
  const moved = Math.hypot(e.clientX - canvasDownPos.x, e.clientY - canvasDownPos.y);
  canvasDownPos = null;
  if (moved > 8) return;

  const slot = game.raycastSlot(e.clientX, e.clientY, game.selectedPartKey);
  if (slot) {
    if (game.selectedPartKey) {
      hintedKey = null;
      game.placeIntoSlot(slot, game.selectedPartKey);
    } else {
      showGameToast('hint', 'Pilih jenis bata LEGO di Daftar Part bawah terlebih dahulu.');
    }
  }
});

btnGPrevStep.addEventListener('click', () => { hintedKey = null; game.jumpToStep(game.currentStep - 1); });
btnGNextStep.addEventListener('click', () => { hintedKey = null; game.jumpToStep(game.currentStep + 1); });
btnGAutoStage.addEventListener('click', () => { hintedKey = null; game.toggleAutoCompleteStage(); });
btnGHint.addEventListener('click', () => { hintedKey = game.useHint(); renderGameHUD(game.getProgressSnapshot()); });
btnGMute.addEventListener('click', () => {
  soundFX.setMuted(!soundFX.muted);
  btnGMute.textContent = soundFX.muted ? 'Suara: Off' : 'Suara: On';
  btnGMute.setAttribute('aria-pressed', String(soundFX.muted));
});
btnGRestart.addEventListener('click', () => { clearTimeout(victoryModalTimer); hintedKey = null; victoryModal.classList.add('hidden'); game.start(1); });
btnVReplay.addEventListener('click', () => { clearTimeout(victoryModalTimer); hintedKey = null; victoryModal.classList.add('hidden'); game.start(1); });
btnVFlight.addEventListener('click', () => { clearTimeout(victoryModalTimer); victoryModal.classList.add('hidden'); switchAppMode('flight', true); });

function switchAppMode(mode, userInitiated = false) {
  stopBuildPlayback();
  cancelActiveDrag();
  clearTimeout(victoryModalTimer);
  currentMode = mode;

  if (userInitiated && window.location.search) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  if (game.active && mode !== 'game') game.stop();
  if (flightSim.active && mode !== 'flight') flightSim.stop();

  document.documentElement.classList.toggle('mode-dashboard', mode === 'dashboard');
  document.body.classList.remove('mode-dashboard', 'mode-studio', 'mode-game', 'mode-flight');
  document.body.classList.add(`mode-${mode}`);

  const tabs = [
    [modeDashboardBtn, 'dashboard'],
    [modeStudioBtn, 'studio'],
    [modeGameBtn, 'game'],
    [modeFlightBtn, 'flight'],
  ];
  for (const [btn, key] of tabs) {
    const active = key === mode;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }

  dashboardView.classList.toggle('hidden', mode !== 'dashboard');
  viewport.classList.toggle('hidden', mode === 'dashboard');
  gameHud.classList.toggle('hidden', mode !== 'game');
  flightHud.classList.toggle('hidden', mode !== 'flight');
  victoryModal.classList.add('hidden');

  if (mode === 'dashboard') {
    studio.controls.autoRotate = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
  } else {
    // Resize renderer after unhiding #viewport so canvas aspect ratio matches immediately
    studio.resize();
    if (mode === 'studio') {
      studio.controls.enabled = true;
      studio.controls.autoRotate = false;
      const collapseOnCompact = window.innerWidth <= 860;
      controlPanel.classList.toggle('collapsed', collapseOnCompact);
      btnTogglePanel.setAttribute('aria-expanded', String(!collapseOnCompact));
      sliderExplode.value = '0';
      explodeVal.textContent = '0%';
      applyBuildStep(20);
      selectCamera('hero');
      syncToggleButtons();
    } else if (mode === 'game') {
      studio.controls.enabled = true;
      if (jet.flightMode) {
        studio.setEnvironment('studio');
        envBtns.forEach((b) => {
          const active = b.dataset.env === 'studio';
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
      }
      hintedKey = null;
      lastScrolledSelectedKey = null;
      game.start(1);
    } else if (mode === 'flight') {
      studio.controls.enabled = false;
      flightSim.start();
    }
  }
}

modeDashboardBtn.addEventListener('click', () => switchAppMode('dashboard', true));
modeStudioBtn.addEventListener('click', () => switchAppMode('studio', true));
modeGameBtn.addEventListener('click', () => switchAppMode('game', true));
modeFlightBtn.addEventListener('click', () => switchAppMode('flight', true));

function syncToggleButtons() {
  const pairs = [
    [btnCanopy, jet.canopyOpen],
    [btnAfterburner, jet.afterburnerOn],
    [btnGear, jet.gearDown],
    [btnFlight, jet.flightMode],
    [btnAutoRotate, studio.controls.autoRotate],
  ];
  for (const [btn, state] of pairs) {
    btn.classList.toggle('active', state);
    btn.setAttribute('aria-pressed', String(state));
  }
}

btnCanopy.addEventListener('click', () => { jet.setCanopyOpen(!jet.canopyOpen); syncToggleButtons(); });
btnAfterburner.addEventListener('click', () => { jet.setAfterburner(!jet.afterburnerOn); syncToggleButtons(); });
btnGear.addEventListener('click', () => { jet.setGearDown(!jet.gearDown); syncToggleButtons(); });
btnFlight.addEventListener('click', () => { jet.setFlightMode(!jet.flightMode); syncToggleButtons(); });
btnMissiles.addEventListener('click', () => {
  const launched = jet.triggerMissileSalvo();
  btnMissiles.classList.toggle('active', launched);
  btnMissiles.setAttribute('aria-pressed', String(launched));
  if (launched) {
    setTimeout(() => {
      if (!jet.missilesLaunching) {
        btnMissiles.classList.remove('active');
        btnMissiles.setAttribute('aria-pressed', 'false');
      }
    }, 4200);
  }
});
btnAutoRotate.addEventListener('click', () => { studio.controls.autoRotate = !studio.controls.autoRotate; syncToggleButtons(); });

sliderExplode.addEventListener('input', (e) => {
  const pct = Number(e.target.value);
  explodeVal.textContent = `${pct}%`;
  jet.setExplode(pct / 100);
});

let buildPlayTimer = null;
function applyBuildStep(step) {
  const clamped = Math.max(1, Math.min(20, step));
  jet.setBuildStep(clamped);
  sliderStep.value = String(clamped);
  stepVal.textContent = `${clamped} / 20`;
  const info = BUILD_STEPS[clamped - 1];
  stepCaption.textContent = `${info.step}. ${info.title}`;
}
function stopBuildPlayback() {
  if (buildPlayTimer) { clearInterval(buildPlayTimer); buildPlayTimer = null; }
  btnStepPlay.textContent = 'Simulasi Rakit';
  btnStepPlay.classList.remove('playing');
}
sliderStep.addEventListener('input', (e) => { stopBuildPlayback(); applyBuildStep(Number(e.target.value)); });
btnStepPrev.addEventListener('click', () => { stopBuildPlayback(); applyBuildStep(jet.currentStep - 1); });
btnStepNext.addEventListener('click', () => { stopBuildPlayback(); applyBuildStep(jet.currentStep + 1); });
btnStepPlay.addEventListener('click', () => {
  if (buildPlayTimer) { stopBuildPlayback(); return; }
  if (jet.currentStep >= 20) applyBuildStep(1);
  btnStepPlay.textContent = 'Berhenti';
  btnStepPlay.classList.add('playing');
  buildPlayTimer = setInterval(() => {
    if (jet.currentStep >= 20) { stopBuildPlayback(); return; }
    applyBuildStep(jet.currentStep + 1);
  }, 650);
});

const camButtons = document.querySelectorAll('.cam-btn');
const featChips = document.querySelectorAll('.feat-chip');
function selectCamera(key) {
  studio.animateCameraTo(key);
  camButtons.forEach((b) => b.classList.toggle('active', b.dataset.cam === key));
  featChips.forEach((c) => c.classList.toggle('active', c.dataset.cam === key));
}
camButtons.forEach((btn) => btn.addEventListener('click', () => selectCamera(btn.dataset.cam)));
featChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const key = chip.dataset.cam;
    selectCamera(key);
    if (key === 'cockpit') jet.setCanopyOpen(true);
    else if (key === 'engines') jet.setAfterburner(true);
    else if (key === 'gear') jet.setGearDown(true);
    syncToggleButtons();
  });
});

const envBtns = document.querySelectorAll('.env-btn');
function applyEnvironment(env) {
  studio.setEnvironment(env);
  envBtns.forEach((b) => {
    const active = b.dataset.env === env;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  if (currentMode === 'studio') {
    if (env === 'sky' && !jet.flightMode) { jet.setFlightMode(true); syncToggleButtons(); }
    else if (env !== 'sky' && jet.flightMode) { jet.setFlightMode(false); syncToggleButtons(); }
  }
}
envBtns.forEach((btn) => {
  btn.addEventListener('click', () => applyEnvironment(btn.dataset.env));
});

btnTogglePanel.addEventListener('click', () => {
  const collapsed = controlPanel.classList.toggle('collapsed');
  btnTogglePanel.setAttribute('aria-expanded', String(!collapsed));
});

let lastModalTrigger = btnReference;
function openRefModal(triggerEl = document.activeElement) {
  lastModalTrigger = triggerEl || btnReference;
  refModal.classList.remove('hidden');
  btnCloseRef.focus();
}

btnReference.addEventListener('click', () => openRefModal(btnReference));

function closeRefModal() {
  refModal.classList.add('hidden');
  if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
    lastModalTrigger.focus();
  }
}

btnCloseRef.addEventListener('click', closeRefModal);
refModal.addEventListener('click', (e) => { if (e.target === refModal) closeRefModal(); });

function trapModalTab(modalEl, e) {
  const focusables = modalEl.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])');
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

window.addEventListener('keydown', (e) => {
  const refOpen = !refModal.classList.contains('hidden');
  const victoryOpen = !victoryModal.classList.contains('hidden');
  if (e.key === 'Tab' && (refOpen || victoryOpen)) {
    trapModalTab(refOpen ? refModal : victoryModal, e);
    return;
  }
  if (e.key === 'Escape') {
    if (refOpen) closeRefModal();
    if (victoryOpen) {
      victoryModal.classList.add('hidden');
      btnGRestart.focus();
    }
    return;
  }
  if (game.active && !game.completed) {
    if (e.key >= '1' && e.key <= '9') {
      const idx = Number(e.key) - 1;
      const item = latestInventory[idx];
      if (item && item.remaining > 0) game.selectPart(item.key);
      return;
    }
    if ((e.key === ' ' || e.key === 'Enter') && game.selectedPartKey && document.activeElement?.tagName !== 'BUTTON') {
      e.preventDefault();
      hintedKey = null;
      game.placeNextSelected();
      return;
    }
  }
  if ((e.key === 'r' || e.key === 'R') && currentMode === 'studio') selectCamera('hero');
});

const params = new URLSearchParams(window.location.search);
if (params.get('clean') === '1') {
  document.body.classList.add('clean-capture');
}
const initMode = params.get('mode') || 'dashboard';
if (['dashboard', 'studio', 'game', 'flight'].includes(initMode)) {
  switchAppMode(initMode);
  if (initMode === 'studio') {
    if (params.get('heroBg') === '1') {
      // Generous margin on all 4 sides with jet positioned cleanly on the right so it never crops at any aspect ratio
      studio.snapCamera([26.8, 14.4, 39.8], [-7.6, 3.8, 5.2]);
    } else if (params.get('clean') === '1') {
      studio.snapCamera([22.5, 11.8, 23.5], [0.0, 3.2, -1.0]);
    }
    if (params.get('canopy') === '1') {
      jet.setCanopyOpen(true);
      jet.canopyProgress = 1;
    }
    if (params.get('ab') === '1') {
      jet.setAfterburner(true);
    }
    syncToggleButtons();
  }
  if (initMode === 'game') {
    const jumpStep = Number(params.get('step'));
    if (jumpStep >= 1 && jumpStep <= 19) game.jumpToStep(jumpStep);
  }
  if (initMode === 'flight' && params.get('air') === '1') {
    flightSim.pos.set(0, 48, 220);
    flightSim.speed = 92;
    flightSim.throttle = 0.9;
    flightSim.afterburner = true;
    flightSim.phase = 'AIRBORNE';
    jet.setAfterburner(true);
    jet.setGearDown(false);
    flightSim._applyJetTransform();
    flightSim._snapCameraImmediate();
    flightSim._emitHUD();
  }
}

const clock = new THREE.Clock();
let lastTimerText = '';
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  // Skip 3D rendering while on the pure 2D Dashboard to save GPU & battery
  if (currentMode === 'dashboard') return;

  const elapsed = clock.elapsedTime;
  jet.update(dt, elapsed);
  game.update(dt, elapsed);
  flightSim.update(dt, elapsed);
  studio.update(dt);

  if (game.active && !game.completed) {
    const tStr = formatTime(game.elapsedSec);
    if (tStr !== lastTimerText) {
      lastTimerText = tStr;
      gTimer.textContent = tStr;
    }
  }

  studio.renderer.render(studio.scene, studio.camera);
}
animate();
