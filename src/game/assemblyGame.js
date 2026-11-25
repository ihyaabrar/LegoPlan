import * as THREE from 'three';
import { soundFX } from './sound.js';
import { ParticleSystem } from './particles.js';

/**
 * 19 Guided Build Stages matching "LEGO Pesawat Tempur F-77 Lancer.png"
 * Every stage is decomposed into real standard LEGO bricks (1x2, 1x4, 1x6, 2x2, 2x4, 2x6,
 * slopes, grilles, wedges, plus authentic special parts like canopy, nozzles, missiles, wheels).
 */
export const GAME_STAGES = [
  { step: 1,  name: 'Rangka Dasar',               shortDesc: 'Susun plate & tile sasis utama bagian bawah',      cam: { pos: [20, 14, 18], target: [0, 3.0, -1] } },
  { step: 2,  name: 'Struktur Tengah',            shortDesc: 'Pasang bata struktur tengah & penguat sayap',      cam: { pos: [20, 14, 16], target: [0, 3.2, -3] } },
  { step: 3,  name: 'Lantai Kokpit',              shortDesc: 'Susun lantai kokpit bagian depan',                 cam: { pos: [14, 11, 17], target: [0, 3.8, 5.5] } },
  { step: 4,  name: 'Sisi Badan Pesawat',         shortDesc: 'Pasang dinding bata kiri-kanan kokpit & badan',    cam: { pos: [22, 12, 15], target: [0, 3.8, -2] } },
  { step: 5,  name: 'Hidung & Jarum Pitot',       shortDesc: 'Pasang kerucut radome, cincin & jarum pitot',      cam: { pos: [14, 7.5, 25], target: [0, 4.0, 14] } },
  { step: 6,  name: 'Panel Depan F-77',           shortDesc: 'Pasang slope hidung, stiker F-77 & segitiga merah',cam: { pos: [14, 7.5, 22], target: [0, 4.0, 10.5] } },
  { step: 7,  name: 'Interior Kokpit',            shortDesc: 'Pasang kursi pilot, layar MFD, HUD & konsol',      cam: { pos: [9.5, 10.5, 13.5], target: [0, 4.8, 6.2] } },
  { step: 8,  name: 'Kanopi Kokpit',              shortDesc: 'Pasang kanopi kaca trans-brown berbingkai gelap',  cam: { pos: [11.5, 9.2, 15.0], target: [0, 5.2, 6.0] } },
  { step: 9,  name: 'Lapisan Badan Atas',         shortDesc: 'Susun bata punggung, slope samping & grille',      cam: { pos: [18, 13.5, 10], target: [0, 5.2, -5.5] } },
  { step: 10, name: 'Air Intake Samping',         shortDesc: 'Rakit inlet udara kiri-kanan beraksen merah',      cam: { pos: [17, 8.2, 17], target: [0, 4.2, 4.5] } },
  { step: 11, name: 'Inti Sayap Kiri',            shortDesc: 'Susun wedge plate & penguat sayap kiri (Port)',    cam: { pos: [21, 15, 12], target: [6, 3.8, -3] } },
  { step: 12, name: 'Inti Sayap Kanan',           shortDesc: 'Susun wedge plate & penguat sayap kanan',          cam: { pos: [-21, 15, 12], target: [-6, 3.8, -3] } },
  { step: 13, name: 'Lapisan Leading Edge',       shortDesc: 'Pasang wedge kamuflase & slope tepi depan sayap',  cam: { pos: [20, 17, 18], target: [0, 4.0, -2.5] } },
  { step: 14, name: 'Detail Sayap & Strip Merah', shortDesc: 'Pasang tile merah, grille, lampu ujung & aileron', cam: { pos: [22, 16, 15], target: [0, 4.2, -4] } },
  { step: 15, name: 'Mesin Ganda & Tailplane',    shortDesc: 'Pasang nozzle jet cincin emas & sayap ekor datar', cam: { pos: [14, 8.5, -24], target: [0, 4.2, -13] } },
  { step: 16, name: 'Ekor Ganda (Stabilizer)',    shortDesc: 'Pasang sirip ekor miring beremblem sayap putih',   cam: { pos: [17, 11.5, -18], target: [0, 6.8, -11] } },
  { step: 17, name: 'Persenjataan 6 Rudal',       shortDesc: 'Pasang pylon bawah sayap & 6 rudal putih-merah',   cam: { pos: [18.5, 4.0, 12.5], target: [4.5, 2.8, -2.5] } },
  { step: 18, name: 'Roda Pendaratan',            shortDesc: 'Pasang pintu roda & 3 set roda karet LEGO',        cam: { pos: [15.5, 3.6, 17.5], target: [1.0, 1.8, 3.0] } },
  { step: 19, name: 'Detail Taktis Akhir',        shortDesc: 'Pasang antena IFF, lampu suar & finishing tile',   cam: { pos: [24, 13.5, 24], target: [1.5, 3.8, -1.5] } },
];

/** Crisp color-matched LEGO Standard Brick SVG renderer */
export function getBlockSvg(iconKey, color = '#7e858d') {
  const darkEdge = 'rgba(0,0,0,0.30)';
  const lightTop = 'rgba(255,255,255,0.26)';

  switch (iconKey) {
    case 'brick':
      return `<svg viewBox="0 0 64 42">
        <rect x="10" y="14" width="44" height="20" rx="2" fill="${color}" stroke="${darkEdge}" stroke-width="1.5"/>
        <rect x="15" y="9" width="8" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.2"/>
        <rect x="28" y="9" width="8" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.2"/>
        <rect x="41" y="9" width="8" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.2"/>
        <rect x="12" y="16" width="40" height="4" fill="${lightTop}"/>
      </svg>`;
    case 'plate':
      return `<svg viewBox="0 0 64 42">
        <rect x="7" y="21" width="50" height="10" rx="1.8" fill="${color}" stroke="${darkEdge}" stroke-width="1.4"/>
        <rect x="11" y="16" width="7" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.1"/>
        <rect x="22" y="16" width="7" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.1"/>
        <rect x="34" y="16" width="7" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.1"/>
        <rect x="45" y="16" width="7" height="5" rx="1" fill="${color}" stroke="${darkEdge}" stroke-width="1.1"/>
      </svg>`;
    case 'tile':
      return `<svg viewBox="0 0 64 42">
        <rect x="8" y="20" width="48" height="10" rx="2" fill="${color}" stroke="${darkEdge}" stroke-width="1.4"/>
        <rect x="11" y="22" width="42" height="3" rx="1" fill="${lightTop}"/>
      </svg>`;
    case 'grille':
      return `<svg viewBox="0 0 64 42">
        <rect x="10" y="16" width="44" height="14" rx="2" fill="${color}" stroke="${darkEdge}" stroke-width="1.4"/>
        <line x1="18" y1="16" x2="18" y2="30" stroke="#111" stroke-width="2.5"/>
        <line x1="25" y1="16" x2="25" y2="30" stroke="#111" stroke-width="2.5"/>
        <line x1="32" y1="16" x2="32" y2="30" stroke="#111" stroke-width="2.5"/>
        <line x1="39" y1="16" x2="39" y2="30" stroke="#111" stroke-width="2.5"/>
        <line x1="46" y1="16" x2="46" y2="30" stroke="#111" stroke-width="2.5"/>
      </svg>`;
    case 'slope':
      return `<svg viewBox="0 0 64 42">
        <polygon points="10,32 54,32 54,26 24,11 10,11" fill="${color}" stroke="${darkEdge}" stroke-width="1.5"/>
        <polygon points="24,12 52,26 48,28 22,15" fill="${lightTop}"/>
      </svg>`;
    case 'curved':
      return `<svg viewBox="0 0 64 42">
        <path d="M10,32 L54,32 L54,25 Q36,10 10,12 Z" fill="${color}" stroke="${darkEdge}" stroke-width="1.5"/>
      </svg>`;
    case 'wedge':
      return `<svg viewBox="0 0 64 42">
        <polygon points="10,10 54,24 54,34 10,32" fill="${color}" stroke="${darkEdge}" stroke-width="1.5"/>
        <circle cx="18" cy="24" r="2.2" fill="${lightTop}"/>
        <circle cx="28" cy="26" r="2.2" fill="${lightTop}"/>
        <circle cx="38" cy="28" r="2.2" fill="${lightTop}"/>
      </svg>`;
    case 'nose':
      return `<svg viewBox="0 0 64 42"><polygon points="6,21 26,12 54,12 54,30 26,30" fill="${color}" stroke="${darkEdge}" stroke-width="1.4"/></svg>`;
    case 'ring':
      return `<svg viewBox="0 0 64 42"><ellipse cx="32" cy="21" rx="18" ry="11" fill="none" stroke="${color}" stroke-width="6"/></svg>`;
    case 'pitot':
      return `<svg viewBox="0 0 64 42"><polygon points="40,14 54,16 54,26 40,28" fill="#2c3036"/><line x1="6" y1="21" x2="42" y2="21" stroke="#c8cdd4" stroke-width="3" stroke-linecap="round"/></svg>`;
    case 'f77':
      return `<svg viewBox="0 0 64 42"><polygon points="8,26 56,12 56,30 8,32" fill="#4b5158"/><text x="19" y="26" fill="#ffffff" font-size="11" font-weight="900" font-style="italic">F-77</text></svg>`;
    case 'warn':
      return `<svg viewBox="0 0 64 42"><rect x="16" y="8" width="32" height="26" rx="3" fill="#4b5158"/><polygon points="22,13 42,13 32,30" fill="#ffffff"/><polygon points="25,15 39,15 32,27" fill="#d42626"/></svg>`;
    case 'dashboard':
      return `<svg viewBox="0 0 64 42"><rect x="10" y="10" width="44" height="22" rx="3" fill="#2c3036"/><rect x="14" y="14" width="11" height="10" fill="#10b981"/><rect x="27" y="14" width="10" height="10" fill="#38bdf8"/><rect x="39" y="14" width="11" height="10" fill="#ef4444"/></svg>`;
    case 'hud':
      return `<svg viewBox="0 0 64 42"><polygon points="18,32 24,10 46,10 40,32" fill="#22dd66" fill-opacity="0.45" stroke="#22dd66" stroke-width="2"/></svg>`;
    case 'seat':
      return `<svg viewBox="0 0 64 42"><rect x="20" y="25" width="24" height="9" rx="2" fill="#1a1d21"/><rect x="24" y="9" width="16" height="18" rx="3" fill="#2c3036"/><rect x="28" y="8" width="8" height="3" fill="#d42626"/></svg>`;
    case 'canopy':
      return `<svg viewBox="0 0 64 42"><path d="M8,29 Q28,6 56,29 Z" fill="#8a623a" fill-opacity="0.72" stroke="#2c3036" stroke-width="2.5"/><path d="M26,14 L24,29 M40,17 L39,29" stroke="#2c3036" stroke-width="2"/></svg>`;
    case 'intake':
      return `<svg viewBox="0 0 64 42"><polygon points="12,12 52,12 56,30 16,30" fill="#4b5158"/><rect x="18" y="15" width="20" height="12" fill="#14171a"/><rect x="12" y="15" width="5" height="13" fill="#d42626"/></svg>`;
    case 'aileron':
      return `<svg viewBox="0 0 64 42"><rect x="8" y="17" width="48" height="10" rx="2" fill="#4b5158"/><rect x="40" y="17" width="10" height="10" fill="#d42626"/></svg>`;
    case 'engine':
      return `<svg viewBox="0 0 64 42"><circle cx="32" cy="21" r="13" fill="#3a3f46" stroke="#d49642" stroke-width="3.6"/><circle cx="32" cy="21" r="6" fill="#181b1f"/></svg>`;
    case 'tail':
      return `<svg viewBox="0 0 64 42"><polygon points="18,35 26,8 42,10 39,35" fill="#4b5158"/><line x1="25.5" y1="12" x2="41" y2="14" stroke="#d42626" stroke-width="3.2"/><path d="M29,24 L33,18 L34,24 L31,28 Z" fill="#ffffff"/></svg>`;
    case 'missile':
      return `<svg viewBox="0 0 64 42"><rect x="18" y="17" width="34" height="8" rx="2" fill="#f0f2f5" stroke="#9aa3ad" stroke-width="1"/><polygon points="18,17 7,21 18,25" fill="#d42626"/><rect x="42" y="17" width="5" height="8" fill="#d42626"/><polygon points="48,13 54,17 48,17" fill="#a4aab0"/><polygon points="48,29 54,25 48,25" fill="#a4aab0"/></svg>`;
    case 'wheel':
      return `<svg viewBox="0 0 64 42"><rect x="29" y="5" width="6" height="14" fill="#c8cdd4"/><circle cx="32" cy="26" r="11" fill="#181a1d"/><circle cx="32" cy="26" r="5.5" fill="#c8cdd4"/></svg>`;
    case 'antenna':
      return `<svg viewBox="0 0 64 42"><polygon points="24,33 32,9 40,33" fill="${color}" stroke="${darkEdge}" stroke-width="1.4"/></svg>`;
    case 'beacon':
      return `<svg viewBox="0 0 64 42"><circle cx="32" cy="22" r="9" fill="#ff2222" fill-opacity="0.85" stroke="#aa0000" stroke-width="2"/></svg>`;
    case 'sensor':
      return `<svg viewBox="0 0 64 42"><circle cx="32" cy="22" r="9" fill="#1a1d21" stroke="#667" stroke-width="2"/><circle cx="29" cy="19" r="2.5" fill="#88c"/></svg>`;
    default:
      return `<svg viewBox="0 0 64 42"><rect x="12" y="14" width="40" height="16" rx="2" fill="${color}" stroke="${darkEdge}" stroke-width="1.5"/></svg>`;
  }
}

/**
 * Guided Standard-LEGO-Brick Assembly Game
 * - Breaks F-77 Lancer into hundreds of real standard LEGO bricks (1x2, 1x4, 1x6, 2x2, 2x4, 2x6, slopes, wedges, etc.)
 * - Shows each Step's real LEGO Manual "Daftar Part" inventory with live remaining counts (x8 -> x7 -> ... -> ✓)
 * - Highlights ALL matching 3D stud slots in glowing cyan; hovering any slot lights it bright emerald green;
 *   clicking or dragging onto ANY matching 3D slot snaps that exact standard LEGO brick into place!
 */
export class AssemblyGame {
  constructor(jet, studio, callbacks = {}) {
    this.jet = jet;
    this.studio = studio;
    this.callbacks = callbacks;

    this.particles = new ParticleSystem(studio.scene);
    this.active = false;
    this.completed = false;

    this.currentStep = 1; // 1 .. 19
    this.selectedPartKey = null;
    this.draggingPartKey = null;
    this.hoveredSlot = null; // slot entry from this.stageSlots
    this.autoBuildTimer = null;

    // Score & telemetry
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.playerPlacedCount = 0;
    this.elapsedSec = 0;
    this.lastSnapTime = 0;

    // 3D Ghost Slots container inside jet.flightGroup
    this.ghostRoot = new THREE.Group();
    this.ghostRoot.name = 'StandardBrickGhosts';
    this.jet.flightGroup.add(this.ghostRoot);

    this.beaconGroup = this._createTargetBeacon();
    this.beaconGroup.visible = false;
    this.jet.flightGroup.add(this.beaconGroup);

    this.stageSlots = []; // [{ block, key, group, hitMesh, ghostMeshes, edgeLines, centerLocal, topY, errorTimer }]

    // Shared hologram materials
    this.matDimGhost = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      emissive: 0x334155,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.14,
      roughness: 0.3,
      depthWrite: false,
    });
    this.matMatchGhost = new THREE.MeshPhysicalMaterial({
      color: 0x1ac8ff,
      emissive: 0x0b84d4,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.40,
      roughness: 0.14,
      depthWrite: false,
    });
    this.matHoverGhost = new THREE.MeshPhysicalMaterial({
      color: 0x2cf28e,
      emissive: 0x10b968,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.62,
      roughness: 0.12,
      depthWrite: false,
    });
    this.matErrorGhost = new THREE.MeshPhysicalMaterial({
      color: 0xff3b3b,
      emissive: 0xd91c1c,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.62,
      roughness: 0.2,
      depthWrite: false,
    });

    this.edgeDimMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.28 });
    this.edgeMatchMat = new THREE.LineBasicMaterial({ color: 0x70e8ff, transparent: true, opacity: 0.92 });
    this.edgeHoverMat = new THREE.LineBasicMaterial({ color: 0x88ffbf, transparent: true, opacity: 1.0 });
    this.edgeErrorMat = new THREE.LineBasicMaterial({ color: 0xff8080, transparent: true, opacity: 1.0 });
    this.hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
  }

  _createTargetBeacon() {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.88, 4).rotateX(Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.92 })
    );
    cone.position.y = 0.52;
    g.add(cone);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.62, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    ring.position.y = 0.04;
    g.add(ring);
    return g;
  }

  _blockKey(block) {
    return `${block.meta.label}|${block.meta.colorHex}`;
  }

  start(startStep = 1) {
    this.stopAutoStage();
    this.active = true;
    this.completed = false;
    this.currentStep = Math.max(1, Math.min(19, startStep));
    this.selectedPartKey = null;
    this.draggingPartKey = null;
    this.hoveredSlot = null;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.playerPlacedCount = 0;
    this.elapsedSec = 0;
    this.lastSnapTime = 0;

    this.studio.controls.autoRotate = false;
    this.jet.setPerBlockStageStart(this.currentStep);
    this._buildStageGhostSlots(true);
    this._emitState();
  }

  stop() {
    this.stopAutoStage();
    this.active = false;
    this.selectedPartKey = null;
    this.draggingPartKey = null;
    this.hoveredSlot = null;
    this._clearSlots();
    this.jet.snapToAssemblyRestPose();
    this.jet.restoreAllBlocks();
    this.jet.setBuildStep(20);
  }

  jumpToStep(stepNum) {
    if (!this.active) return;
    this.stopAutoStage();
    const clamped = Math.max(1, Math.min(19, stepNum));
    this.completed = false;
    this.currentStep = clamped;
    this.selectedPartKey = null;
    this.hoveredSlot = null;
    this.jet.setPerBlockStageStart(clamped);
    this._buildStageGhostSlots(true);
    this._emitState();
  }

  stopAutoStage() {
    if (this.autoBuildTimer) {
      clearInterval(this.autoBuildTimer);
      this.autoBuildTimer = null;
    }
  }

  /** Speed-build remaining standard LEGO bricks of the current step one-by-one! */
  toggleAutoCompleteStage() {
    if (!this.active || this.completed) return false;
    if (this.autoBuildTimer) {
      this.stopAutoStage();
      this._emitState();
      return false;
    }

    const activeStep = this.currentStep;
    this.autoBuildTimer = setInterval(() => {
      if (!this.active || this.completed || this.currentStep !== activeStep) {
        this.stopAutoStage();
        this._emitState();
        return;
      }
      const nextSlot = this._pickNextMatchingSlot() || this.stageSlots.find((s) => !s.block.placed);
      if (!nextSlot) {
        this.stopAutoStage();
        this._emitState();
        return;
      }
      this.selectedPartKey = nextSlot.key;
      this.placeIntoSlot(nextSlot, nextSlot.key, true);
    }, 95);

    this._emitState();
    return true;
  }

  getCurrentStageInfo() {
    return GAME_STAGES[this.currentStep - 1] || null;
  }

  /** Returns the authentic LEGO Instruction Booklet "Daftar Part" for the current step! */
  getStepPartInventory() {
    const map = new Map();
    for (const slot of this.stageSlots) {
      const b = slot.block;
      const k = slot.key;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          name: b.meta.label,
          colorName: b.meta.colorName,
          colorHex: b.meta.colorHex,
          sizeText: b.meta.sizeText,
          icon: b.meta.icon,
          total: 0,
          remaining: 0,
        });
      }
      const entry = map.get(k);
      entry.total += 1;
      if (!b.placed) entry.remaining += 1;
    }
    return Array.from(map.values());
  }

  selectPart(key) {
    if (!this.active || this.completed) return;
    this.selectedPartKey = key;
    soundFX.playSelect();
    this._refreshSlotVisuals();
    this._emitState();
  }

  setDraggingPart(key) {
    this.draggingPartKey = key || null;
    if (key) {
      this.selectedPartKey = key;
    }
    this._refreshSlotVisuals();
  }

  /** Pick the first unplaced slot matching selectedPartKey */
  _pickNextMatchingSlot(key = this.selectedPartKey) {
    if (!key) return null;
    return this.stageSlots.find((s) => !s.block.placed && s.key === key) || null;
  }

  /** Place selected brick via Space/Enter or quick "Pasang!" button */
  placeNextSelected() {
    if (!this.active || this.completed) return false;
    const slot = this._pickNextMatchingSlot(this.selectedPartKey);
    if (!slot) return false;
    return this.placeIntoSlot(slot, this.selectedPartKey, false);
  }

  /** Attempt to snap a brick with `keyToPlace` into a specific 3D `slot` */
  placeIntoSlot(slot, keyToPlace = this.selectedPartKey, isAuto = false) {
    if (!this.active || this.completed || !slot || slot.block.placed) return false;
    const key = keyToPlace || this.selectedPartKey;
    if (!key) return false;

    if (slot.key === key) {
      // Exact standard brick match -> snap into place
      if (!isAuto) this.playerPlacedCount += 1;
      this.combo += 1;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const dtSnap = Math.max(0.2, this.elapsedSec - this.lastSnapTime);
      const speedBonus = Math.max(0, Math.round((5 - dtSnap) * 4));
      const gained = isAuto ? 5 : (20 + speedBonus) * Math.min(5, this.combo);
      this.score += gained;
      this.lastSnapTime = this.elapsedSec;

      soundFX.playSnap(this.combo);

      // Snap real 3D standard LEGO brick in with crisp vertical drop-click
      this.jet.snapBlockAt(slot.block.index, true);
      slot.group.visible = false;

      // Sparkle burst right at the snapped brick
      const worldCenter = slot.centerLocal.clone();
      this.jet.flightGroup.localToWorld(worldCenter);
      this.particles.burst(worldCenter, isAuto ? 8 : 16, 4.8);

      if (this.hoveredSlot === slot) this.hoveredSlot = null;

      // Auto-select next remaining brick type when current type is complete
      const moreSameType = this.stageSlots.some((s) => !s.block.placed && s.key === this.selectedPartKey);
      if (!moreSameType) {
        const nextAny = this.stageSlots.find((s) => !s.block.placed);
        this.selectedPartKey = nextAny ? nextAny.key : null;
      }

      // Check if entire step is complete
      const stepRemaining = this.stageSlots.filter((s) => !s.block.placed).length;
      if (stepRemaining === 0) {
        this.stopAutoStage();
        const completedStepName = this.getCurrentStageInfo()?.name || '';
        if (this.currentStep >= GAME_STAGES.length) {
          this._triggerVictory();
        } else {
          if (!isAuto && this.callbacks.onFeedback) {
            this.callbacks.onFeedback({
              type: 'success',
              text: `Tahap ${this.currentStep} (${completedStepName}) selesai. Lanjut Tahap ${this.currentStep + 1}.`,
            });
          }
          this.currentStep += 1;
          this._buildStageGhostSlots(true);
        }
      } else {
        if (!isAuto && this.callbacks.onFeedback) {
          this.callbacks.onFeedback({
            type: 'success',
            text: `+${gained} poin: ${slot.block.meta.label} (${slot.block.meta.colorName}) terpasang.`,
          });
        }
        this._refreshSlotVisuals();
      }

      this._emitState();
      return true;
    } else {
      // Mismatched slot: flash slot red and report needed part key so tray highlights it
      this.mistakes += 1;
      this.combo = 0;
      slot.errorTimer = 0.55;
      soundFX.playWrong();
      if (this.callbacks.onFeedback) {
        this.callbacks.onFeedback({
          type: 'error',
          requiredKey: slot.key,
          text: `Slot ini butuh ${slot.block.meta.label} (${slot.block.meta.colorName}).`,
        });
      }
      this._refreshSlotVisuals();
      this._emitState();
      return false;
    }
  }

  /** Raycast pointer against unplaced ghost slots in the current step */
  raycastSlot(clientX, clientY, preferKey = this.draggingPartKey || this.selectedPartKey) {
    if (!this.active || this.completed || this.stageSlots.length === 0) return null;
    const rect = this.studio.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.studio.camera);

    const activeHitMeshes = [];
    for (const s of this.stageSlots) {
      if (!s.block.placed && s.hitMesh) activeHitMeshes.push(s.hitMesh);
    }
    if (activeHitMeshes.length === 0) return null;

    const hits = this.raycaster.intersectObjects(activeHitMeshes, false);
    if (hits.length === 0) return null;

    // Prefer a matching slot only if it is within the front neighborhood of the closest hit
    // so clicks never snap a hidden slot on the opposite side of the aircraft
    const nearestDist = hits[0].distance;
    if (preferKey) {
      for (const h of hits) {
        if (h.distance > nearestDist + 2.0) break;
        const slot = h.object.userData.slotRef;
        if (slot && slot.key === preferKey) return slot;
      }
    }
    return hits[0].object.userData.slotRef || null;
  }

  setHoveredSlot(slot) {
    if (this.hoveredSlot === slot) return;
    this.hoveredSlot = slot;
    this._refreshSlotVisuals();
  }

  useHint() {
    if (!this.active || this.completed) return null;
    const targetSlot = this._pickNextMatchingSlot() || this.stageSlots.find((s) => !s.block.placed);
    if (!targetSlot) return null;
    this.hintsUsed += 1;
    this.selectedPartKey = targetSlot.key;
    soundFX.playSelect();

    // Gently focus camera onto that exact brick's neighborhood
    const stage = this.getCurrentStageInfo();
    if (stage) this._flyCameraToStage(stage);

    this._refreshSlotVisuals();
    if (this.callbacks.onFeedback) {
      this.callbacks.onFeedback({
        type: 'hint',
        text: `Bantuan: Klik hologram biru berpanah untuk pasang ${targetSlot.block.meta.label} (${targetSlot.block.meta.colorName})!`,
      });
    }
    this._emitState();
    return targetSlot.key;
  }

  _clearSlots() {
    while (this.ghostRoot.children.length > 0) {
      const child = this.ghostRoot.children[0];
      this.ghostRoot.remove(child);
      child.traverse((obj) => {
        if (obj.isLineSegments && obj.geometry) obj.geometry.dispose();
        if (obj.userData && obj.userData.isHitBox && obj.geometry) obj.geometry.dispose();
      });
    }
    this.stageSlots = [];
    this.hoveredSlot = null;
    this.beaconGroup.visible = false;
  }

  _buildStageGhostSlots(moveCamera = false) {
    this._clearSlots();
    const stepBlocks = this.jet.blocks.filter((b) => b.step === this.currentStep);
    if (stepBlocks.length === 0) return;

    this.jet.root.updateMatrixWorld(true);
    const invFlight = new THREE.Matrix4().copy(this.jet.flightGroup.matrixWorld).invert();

    for (const block of stepBlocks) {
      const slotGroup = new THREE.Group();
      const ghostMeshes = [];
      const edgeLines = [];
      const box = new THREE.Box3();

      const wasVis = block.obj.visible;
      block.obj.visible = true;
      block.obj.position.copy(block.basePos);
      block.obj.updateMatrixWorld(true);

      block.obj.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;
        if (child.material && child.material.blending === THREE.AdditiveBlending) return;

        const gMesh = new THREE.Mesh(child.geometry, this.matDimGhost);
        const relMat = new THREE.Matrix4().multiplyMatrices(invFlight, child.matrixWorld);
        gMesh.applyMatrix4(relMat);
        slotGroup.add(gMesh);
        ghostMeshes.push(gMesh);

        // Clean blueprint wireframe outline for crisp brick visibility
        const eGeo = new THREE.EdgesGeometry(child.geometry, 35);
        const eLine = new THREE.LineSegments(eGeo, this.edgeDimMat);
        eLine.applyMatrix4(relMat);
        slotGroup.add(eLine);
        edgeLines.push(eLine);

        gMesh.updateMatrixWorld(true);
        box.expandByObject(gMesh);
      });

      block.obj.visible = wasVis;

      const centerLocal = new THREE.Vector3();
      let topY = 0;
      let bottomY = 0;
      let hitMesh = null;

      if (!box.isEmpty()) {
        // gMesh was already transformed by relMat into flightGroup-local space before attaching to ghostRoot,
        // so `box` is ALREADY in exact flightGroup-local coordinates!
        const size = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(centerLocal);
        topY = box.max.y;
        bottomY = box.min.y;

        // Tight clickable bounding box centered accurately on each standard LEGO brick
        const hitGeo = new THREE.BoxGeometry(
          Math.max(size.x + 0.14, 0.72),
          Math.max(size.y + 0.16, 0.52),
          Math.max(size.z + 0.14, 0.72)
        );
        hitMesh = new THREE.Mesh(hitGeo, this.hitBoxMat);
        hitMesh.position.copy(centerLocal);
        hitMesh.userData.isHitBox = true;
        slotGroup.add(hitMesh);
      }

      slotGroup.visible = !block.placed;
      this.ghostRoot.add(slotGroup);

      const slot = {
        block,
        key: this._blockKey(block),
        group: slotGroup,
        hitMesh,
        ghostMeshes,
        edgeLines,
        centerLocal,
        topY,
        bottomY,
        errorTimer: 0,
      };
      if (hitMesh) hitMesh.userData.slotRef = slot;
      this.stageSlots.push(slot);
    }

    // Auto-select the first unplaced standard brick type of this step!
    const firstUnplaced = this.stageSlots.find((s) => !s.block.placed);
    this.selectedPartKey = firstUnplaced ? firstUnplaced.key : null;

    this._refreshSlotVisuals();

    if (moveCamera) {
      const stage = this.getCurrentStageInfo();
      if (stage) this._flyCameraToStage(stage);
    }
  }

  _refreshSlotVisuals() {
    const activeKey = this.draggingPartKey || this.selectedPartKey;
    let beaconSlot = null;

    for (const s of this.stageSlots) {
      if (s.block.placed) {
        s.group.visible = false;
        continue;
      }
      s.group.visible = true;

      const isMatch = activeKey && s.key === activeKey;
      const isHovered = this.hoveredSlot === s;
      let gMat = this.matDimGhost;
      let eMat = this.edgeDimMat;

      if (s.errorTimer > 0) {
        gMat = this.matErrorGhost;
        eMat = this.edgeErrorMat;
      } else if (isHovered && isMatch) {
        gMat = this.matHoverGhost;
        eMat = this.edgeHoverMat;
        beaconSlot = s;
      } else if (isMatch) {
        gMat = this.matMatchGhost;
        eMat = this.edgeMatchMat;
        if (!beaconSlot) beaconSlot = s;
      }

      for (const m of s.ghostMeshes) m.material = gMat;
      for (const l of s.edgeLines) l.material = eMat;
    }

    if (beaconSlot) {
      const underMount = beaconSlot.block.step === 17 || beaconSlot.block.step === 18;
      this.beaconGroup.visible = true;
      this.beaconGroup.rotation.x = underMount ? Math.PI : 0;
      const yPos = underMount ? beaconSlot.bottomY - 0.55 : beaconSlot.topY + 0.55;
      this.beaconGroup.position.set(beaconSlot.centerLocal.x, yPos, beaconSlot.centerLocal.z);
      this._beaconBaseY = yPos;
      this._beaconDir = underMount ? -1 : 1;
    } else {
      this.beaconGroup.visible = false;
    }
  }

  _flyCameraToStage(stage) {
    if (!stage || !stage.cam) return;
    this.studio.animateCameraToCustom(stage.cam.pos, stage.cam.target);
  }

  _triggerVictory() {
    this.completed = true;
    this._clearSlots();
    this.jet.restoreAllBlocks();
    this.jet.setBuildStep(20);
    this.jet.setAfterburner(true);
    this.studio.controls.autoRotate = true;
    this.studio.controls.autoRotateSpeed = 1.6;
    this.studio.animateCameraTo('hero');

    soundFX.playVictory();
    this.particles.victoryShower(new THREE.Vector3(0, 4.5, 0));

    const totalBlocks = this.jet.blocks.length;
    const placedSample = Math.max(1, this.playerPlacedCount || totalBlocks);
    const accuracy = Math.round((placedSample / Math.max(1, placedSample + this.mistakes)) * 100);
    let stars = 3;
    if (accuracy < 75 || this.hintsUsed >= 8) stars = 1;
    else if (accuracy < 92 || this.hintsUsed >= 4) stars = 2;

    if (this.callbacks.onVictory) {
      this.callbacks.onVictory({
        score: this.score,
        elapsedSec: this.elapsedSec,
        accuracy,
        maxCombo: this.maxCombo,
        stars,
        totalBlocks,
      });
    }
  }

  getProgressSnapshot() {
    const totalBlocks = this.jet.blocks.length;
    let placedTotal = 0;
    for (const b of this.jet.blocks) {
      if (b.placed) placedTotal += 1;
    }
    const stepTotal = this.stageSlots.length;
    const stepPlaced = this.stageSlots.filter((s) => s.block.placed).length;

    return {
      active: this.active,
      completed: this.completed,
      currentStep: this.currentStep,
      totalStages: GAME_STAGES.length,
      stage: this.getCurrentStageInfo(),
      placedTotal,
      totalBlocks,
      stepPlaced,
      stepTotal,
      inventory: this.getStepPartInventory(),
      selectedPartKey: this.selectedPartKey,
      autoBuilding: Boolean(this.autoBuildTimer),
      score: this.score,
      combo: this.combo,
      elapsedSec: this.elapsedSec,
    };
  }

  _emitState() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.getProgressSnapshot());
    }
  }

  update(dt, elapsed) {
    this.particles.update(dt);
    if (!this.active || this.completed) return;

    this.elapsedSec += dt;

    // Bobbing 3D Target Arrow above (or below for underwing/gear) active standard LEGO brick slot
    if (this.beaconGroup.visible) {
      const base = this._beaconBaseY ?? 2.0;
      const dir = this._beaconDir ?? 1;
      this.beaconGroup.position.y = base + dir * (0.18 + Math.sin(elapsed * 5.8) * 0.22);
      this.beaconGroup.rotation.y = elapsed * 2.4;
    }

    // Pulse cyan matching slots smoothly
    this.matMatchGhost.opacity = 0.30 + 0.16 * (0.5 + 0.5 * Math.sin(elapsed * 5.2));

    // Decay red error flash on mismatched slots
    let needRefresh = false;
    for (const s of this.stageSlots) {
      if (s.errorTimer > 0) {
        s.errorTimer = Math.max(0, s.errorTimer - dt);
        if (s.errorTimer === 0) needRefresh = true;
      }
    }
    if (needRefresh) this._refreshSlotVisuals();
  }
}
