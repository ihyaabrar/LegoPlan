import * as THREE from 'three';
import { P } from '../lego/bricks.js';
import { createMaterialPalette } from '../lego/materials.js';
import { buildFuselage } from './fuselage.js';
import { buildCockpit } from './cockpit.js';
import { buildWings } from './wings.js';
import { buildTailAndEngines } from './tailAndEngines.js';
import { buildWeaponsAndGear } from './weaponsAndGear.js';

/**
 * Exact 20 Build Steps ("Langkah Pembuatan") matching LEGO Pesawat Tempur F-77 Lancer.png
 */
export const BUILD_STEPS = [
  { step: 1,  title: 'Membuat rangka dasar' },
  { step: 2,  title: 'Menambah struktur tengah' },
  { step: 3,  title: 'Membentuk lantai kokpit' },
  { step: 4,  title: 'Memasang sisi badan' },
  { step: 5,  title: 'Membentuk hidung pesawat' },
  { step: 6,  title: 'Menyelesaikan bagian depan & stiker F-77' },
  { step: 7,  title: 'Membuat kokpit & interior' },
  { step: 8,  title: 'Memasang kanopi kokpit' },
  { step: 9,  title: 'Menambah detail badan atas' },
  { step: 10, title: 'Memasang inlet & detail samping' },
  { step: 11, title: 'Membuat inti sayap kiri' },
  { step: 12, title: 'Membuat inti sayap kanan' },
  { step: 13, title: 'Memasang kedua sayap' },
  { step: 14, title: 'Menambah detail & lapisan sayap' },
  { step: 15, title: 'Membuat bagian ekor belakang & mesin ganda' },
  { step: 16, title: 'Memasang ekor ganda (vertical stabilizer)' },
  { step: 17, title: 'Menambahkan persenjataan lengkap (6 rudal)' },
  { step: 18, title: 'Memasang roda pendaratan' },
  { step: 19, title: 'Menambahkan detail akhir' },
  { step: 20, title: 'Model F-77 Lancer selesai!' },
];

export class F77Lancer {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'F77Lancer';

    // Fuselage elevation above studio floor (y = 0) when landing gear is deployed
    this.groundElevation = 9.0 * P; // 2.88 units
    this.flightGroup = new THREE.Group();
    this.flightGroup.position.y = this.groundElevation;
    this.root.add(this.flightGroup);

    this.mats = createMaterialPalette();
    this.parts = []; // Sub-assembly step groups
    this.blocks = []; // Individual LEGO blocks for Per-Block Assembly Game!

    const registerPart = (obj, step, explodeVec) => {
      this.parts.push({
        obj,
        step,
        basePos: obj.position.clone(),
        explodeVec: explodeVec.clone(),
        curScale: 1,
        snapProgress: 1,
      });
    };

    // Assemble all modular LEGO sections
    const fuselage = buildFuselage(this.mats, registerPart);
    const cockpit = buildCockpit(this.mats, registerPart);
    const wings = buildWings(this.mats, registerPart);
    const tailEngines = buildTailAndEngines(this.mats, registerPart);
    const weaponsGear = buildWeaponsAndGear(this.mats, registerPart, this.groundElevation);

    this.flightGroup.add(fuselage);
    this.flightGroup.add(cockpit.root);
    this.flightGroup.add(wings.root);
    this.flightGroup.add(tailEngines.root);
    this.flightGroup.add(weaponsGear.root);

    this.canopyPivot = cockpit.canopyPivot;
    this.ailerons = wings.ailerons;
    this.afterburners = tailEngines.afterburners;
    this.elevators = tailEngines.elevators;
    this.rudders = tailEngines.rudders;
    this.beacon = tailEngines.beacon;
    this.missiles = weaponsGear.missiles;
    this.gear = weaponsGear.gear;

    // Interactive state
    this.currentStep = 20;
    this.targetExplode = 0;
    this.currentExplode = 0;

    this.canopyOpen = false;
    this.canopyProgress = 0;

    this.gearDown = true;
    this.gearProgress = 1;

    this.afterburnerOn = false;
    this.flightMode = false;
    this.missilesLaunching = false;
    this.missileLaunchElapsed = 0;

    // Snap bay doors & pivots to exact resting gear-down pose before collecting blocks
    this.snapToAssemblyRestPose();

    // Collect every single individual LEGO block across all 19 build steps
    this._collectIndividualBlocks();
  }

  _collectIndividualBlocks() {
    this.flightGroup.updateMatrixWorld(true);
    const invFlight = new THREE.Matrix4().copy(this.flightGroup.matrixWorld).invert();
    const sortedParts = [...this.parts].sort((a, b) => a.step - b.step);

    const collected = [];
    const seen = new Set();

    const walk = (node, step, bucket) => {
      if (seen.has(node)) return;
      const meta = node.userData.atomicBlock || node.userData.legoBlock;
      if (meta) {
        seen.add(node);
        // Compute local center in flightGroup space for natural bottom-to-top sorting
        const box = new THREE.Box3().setFromObject(node);
        const center = new THREE.Vector3();
        if (!box.isEmpty()) {
          box.getCenter(center);
          center.applyMatrix4(invFlight);
        }
        bucket.push({
          obj: node,
          step,
          meta,
          center,
          basePos: node.position.clone(),
          placed: true,
          dropProgress: 1,
          dropDir: new THREE.Vector3(0, 1, 0),
        });
        return; // Don't recurse inside atomic or leaf LEGO blocks
      }
      for (const child of node.children) {
        walk(child, step, bucket);
      }
    };

    // Group by step so blocks within each step stack naturally bottom-to-top, inner-to-outer
    for (let step = 1; step <= 19; step++) {
      const bucket = [];
      for (const part of sortedParts) {
        if (part.step === step) {
          walk(part.obj, step, bucket);
        }
      }
      bucket.sort((a, b) => {
        // Underwing missiles (step 17) & landing gear (step 18) assemble naturally top-to-bottom (pylon/bay first -> missile/wheel)!
        const topDown = step === 17 || step === 18;
        const dy = Math.round(a.center.y * 2) - Math.round(b.center.y * 2);
        if (dy !== 0) return topDown ? -dy : dy;
        const dx = Math.abs(a.center.x) - Math.abs(b.center.x);
        if (Math.abs(dx) > 0.4) return dx;
        return b.center.z - a.center.z;
      });
      for (const item of bucket) {
        item.index = collected.length;
        // Landing gear & underwing missiles snap upward from below, others drop from above
        const worldDrop = new THREE.Vector3(0, 1, 0);
        if (step === 17 || step === 18) {
          worldDrop.set(0, -1, 0);
        } else if (step === 5) {
          worldDrop.set(0, 0.25, 1).normalize();
        } else if (step === 15 && item.meta.icon === 'engine') {
          worldDrop.set(0, 0.2, -1).normalize();
        }
        // Convert drop direction into the block's parent-local space so rotated parents (e.g. gear bay doors) animate cleanly
        if (item.obj.parent) {
          const parentQuat = new THREE.Quaternion();
          item.obj.parent.getWorldQuaternion(parentQuat);
          worldDrop.applyQuaternion(parentQuat.invert()).normalize();
        }
        item.dropDir.copy(worldDrop);
        collected.push(item);
      }
    }

    this.blocks = collected;
  }

  /** Show all steps <= step (Studio 3D & Stage-mode Game) */
  setBuildStep(step) {
    this.restoreAllBlocks();
    this.currentStep = Math.max(0, Math.min(20, Math.round(step)));
    for (const p of this.parts) {
      const shouldShow = p.step <= this.currentStep;
      if (shouldShow && !p.obj.visible) {
        p.curScale = 0.01;
        p.snapProgress = 1;
      }
      p.obj.visible = shouldShow;
    }
  }

  /** Stage-mode Assembly Game snap */
  snapAssemblyStep(step) {
    this.restoreAllBlocks();
    this.currentStep = Math.max(0, Math.min(20, step));
    for (const p of this.parts) {
      if (p.step < step) {
        p.obj.visible = true;
        p.curScale = 1;
        p.snapProgress = 1;
      } else if (p.step === step) {
        p.obj.visible = true;
        p.curScale = 1;
        p.snapProgress = 0;
      } else {
        p.obj.visible = false;
      }
    }
  }

  /** Immediately snap all lerped animations & transforms to exact assembly rest pose */
  snapToAssemblyRestPose() {
    this.targetExplode = 0;
    this.currentExplode = 0;
    this.canopyOpen = false;
    this.canopyProgress = 0;
    this.canopyPivot.rotation.x = 0;

    this.gearDown = true;
    this.gearProgress = 1;
    this.gear.noseGearPivot.rotation.x = 0;
    this.gear.noseGearPivot.scale.y = 1;
    for (const d of this.gear.noseBayDoors) {
      d.pivot.rotation.z = d.side * 1.35;
    }
    for (const mg of this.gear.mainGearPivots) {
      mg.pivot.rotation.z = 0;
      mg.pivot.scale.y = 1;
    }
    for (const d of this.gear.mainBayDoors) {
      d.pivot.rotation.z = d.side * 1.25;
    }

    this.afterburnerOn = false;
    for (const ab of this.afterburners) {
      ab.plumeGroup.visible = false;
      ab.throatGlowMat.opacity = 0;
      ab.exhaustLight.intensity = 0;
    }

    this.flightMode = false;
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    this.flightGroup.position.set(0, this.groundElevation, 0);
    this.flightGroup.rotation.set(0, 0, 0);

    for (const a of this.ailerons) a.pivot.rotation.x = 0;
    for (const e of this.elevators) e.pivot.rotation.x = 0;
    for (const r of this.rudders) r.pivot.rotation.y = 0;

    this.resetMissiles();
    for (const p of this.parts) {
      p.curScale = 1;
      p.snapProgress = 1;
      p.obj.position.copy(p.basePos);
      p.obj.scale.setScalar(1);
    }
    this.root.updateMatrixWorld(true);
  }

  /** Per-Block Assembly Game: show blocks belonging to steps < activeStep, hide activeStep and later */
  setPerBlockStageStart(activeStep) {
    this.snapToAssemblyRestPose();
    for (const p of this.parts) {
      p.obj.visible = true;
    }
    for (const b of this.blocks) {
      const done = b.step < activeStep;
      b.placed = done;
      b.obj.visible = done;
      b.dropProgress = 1;
      b.obj.position.copy(b.basePos);
    }
    this.root.updateMatrixWorld(true);
  }

  /** Per-Block Assembly Game: snap one specific standard LEGO block with drop-click animation */
  snapBlockAt(index, animate = true) {
    const b = this.blocks[index];
    if (!b) return;
    b.placed = true;
    b.obj.visible = true;
    b.dropProgress = animate ? 0 : 1;
    if (!animate) b.obj.position.copy(b.basePos);
  }

  /** Restore every individual block visibility & base transform for normal Studio 3D mode */
  restoreAllBlocks() {
    for (const b of this.blocks) {
      b.placed = true;
      b.obj.visible = true;
      b.dropProgress = 1;
      b.obj.position.copy(b.basePos);
    }
  }

  getPartsForStep(step) {
    return this.parts.filter((p) => p.step === step);
  }

  setExplode(amount) {
    this.targetExplode = Math.max(0, Math.min(1, amount));
  }

  setCanopyOpen(open) {
    this.canopyOpen = Boolean(open);
  }

  setGearDown(down) {
    this.gearDown = Boolean(down);
  }

  setAfterburner(on) {
    this.afterburnerOn = Boolean(on);
  }

  setFlightMode(on) {
    this.flightMode = Boolean(on);
    if (this.flightMode) {
      this.gearDown = false;
      this.afterburnerOn = true;
      this.canopyOpen = false;
    } else {
      this.gearDown = true;
    }
  }

  triggerMissileSalvo() {
    if (this.missilesLaunching) {
      this.resetMissiles();
      return false;
    }
    this.missilesLaunching = true;
    this.missileLaunchElapsed = 0;
    for (const m of this.missiles) {
      m.launched = false;
      m.launchTime = 0;
      m.group.position.copy(m.restPos);
      m.group.visible = true;
      m.flame.visible = false;
    }
    return true;
  }

  resetMissiles() {
    this.missilesLaunching = false;
    this.missileLaunchElapsed = 0;
    for (const m of this.missiles) {
      m.launched = false;
      m.launchTime = 0;
      m.group.position.copy(m.restPos);
      m.group.visible = true;
      m.flame.visible = false;
    }
  }

  update(dt, elapsed) {
    const lerpRate = Math.min(1, dt * 7.5);

    // 1) Smooth Explode, Build Step Pop-In & Stage Fly-In Snap Animation
    this.currentExplode += (this.targetExplode - this.currentExplode) * lerpRate;
    for (const p of this.parts) {
      if (!p.obj.visible) continue;
      if (p.curScale < 0.999) {
        p.curScale += (1 - p.curScale) * Math.min(1, dt * 12);
        p.obj.scale.setScalar(p.curScale);
      } else if (p.obj.scale.x !== 1) {
        p.obj.scale.setScalar(1);
      }

      let snapOffsetFactor = 0;
      if (p.snapProgress < 1) {
        p.snapProgress = Math.min(1, p.snapProgress + dt * 3.6);
        const t = p.snapProgress;
        const inv = 1 - t;
        snapOffsetFactor = inv * inv * (1.25 - 0.35 * Math.sin(t * Math.PI));
        if (t >= 1) snapOffsetFactor = 0;
      }

      const totalOffset = this.currentExplode + snapOffsetFactor * 1.15;
      p.obj.position.copy(p.basePos).addScaledVector(p.explodeVec, totalOffset);
    }

    // 1b) Individual Per-Block Drop-Click Snap Animation
    for (const b of this.blocks) {
      if (b.dropProgress < 1) {
        b.dropProgress = Math.min(1, b.dropProgress + dt * 4.8);
        const t = b.dropProgress;
        const inv = 1 - t;
        // Crisp vertical LEGO press-down bounce
        const dist = inv * inv * (3.2 - 0.9 * Math.sin(t * Math.PI));
        if (t >= 1) {
          b.obj.position.copy(b.basePos);
        } else {
          b.obj.position.copy(b.basePos).addScaledVector(b.dropDir, dist);
        }
      }
    }

    // 2) Hinged Canopy Animation
    const targetCanopy = this.canopyOpen ? 1 : 0;
    this.canopyProgress += (targetCanopy - this.canopyProgress) * lerpRate;
    this.canopyPivot.rotation.x = -this.canopyProgress * 0.78;

    // 3) Retractable Landing Gear Animation + Bay Doors
    const targetGear = this.gearDown ? 1 : 0;
    this.gearProgress += (targetGear - this.gearProgress) * lerpRate;
    const retract = 1 - this.gearProgress;

    this.gear.noseGearPivot.rotation.x = -retract * 1.56;
    this.gear.noseGearPivot.scale.y = 1 - retract * 0.48;
    for (const d of this.gear.noseBayDoors) {
      d.pivot.rotation.z = d.side * this.gearProgress * 1.35;
    }

    for (const mg of this.gear.mainGearPivots) {
      mg.pivot.rotation.z = -mg.side * retract * 1.55;
      mg.pivot.scale.y = 1 - retract * 0.45;
    }
    for (const d of this.gear.mainBayDoors) {
      d.pivot.rotation.z = d.side * this.gearProgress * 1.25;
    }

    // 4) Afterburner Flickering Plume & Glow
    for (let i = 0; i < this.afterburners.length; i++) {
      const ab = this.afterburners[i];
      ab.plumeGroup.visible = this.afterburnerOn;
      if (this.afterburnerOn) {
        const flicker = 0.88 + 0.16 * Math.sin(elapsed * 42 + i * 2.1) + 0.08 * Math.cos(elapsed * 73);
        ab.plumeGroup.scale.set(1, 1, flicker);
        ab.throatGlowMat.opacity = 0.75 + 0.2 * Math.sin(elapsed * 28);
        ab.exhaustLight.intensity = 3.2 * flicker;
      } else {
        ab.throatGlowMat.opacity = 0;
        ab.exhaustLight.intensity = 0;
      }
    }

    // 5) Anti-collision dorsal beacon subtle blink
    if (this.beacon && this.beacon.material) {
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(elapsed * 4.5), 4);
      this.beacon.material.emissiveIntensity = 0.25 + pulse * 1.4;
    }

    // 6) Flight Mode Banking + Control Surface Deflection
    const targetFlightY = this.flightMode
      ? this.groundElevation + 2.6 + Math.sin(elapsed * 1.6) * 0.55
      : this.groundElevation;
    this.flightGroup.position.y += (targetFlightY - this.flightGroup.position.y) * Math.min(1, dt * 4.0);

    const targetRoll = this.flightMode ? Math.sin(elapsed * 0.9) * 0.24 : 0;
    const targetPitch = this.flightMode ? Math.cos(elapsed * 1.2) * 0.07 - 0.04 : 0;
    this.flightGroup.rotation.z += (targetRoll - this.flightGroup.rotation.z) * Math.min(1, dt * 4.0);
    this.flightGroup.rotation.x += (targetPitch - this.flightGroup.rotation.x) * Math.min(1, dt * 4.0);

    const aileronDeflect = this.flightMode ? Math.cos(elapsed * 0.9) * 0.34 : 0;
    for (const a of this.ailerons) {
      a.pivot.rotation.x += (a.side * aileronDeflect - a.pivot.rotation.x) * lerpRate;
    }
    const elevDeflect = this.flightMode ? Math.sin(elapsed * 1.2) * 0.22 : 0;
    for (const e of this.elevators) {
      e.pivot.rotation.x += (elevDeflect - e.pivot.rotation.x) * lerpRate;
    }
    const rudderDeflect = this.flightMode ? Math.sin(elapsed * 0.9) * 0.26 : 0;
    for (const r of this.rudders) {
      r.pivot.rotation.y += (rudderDeflect - r.pivot.rotation.y) * lerpRate;
    }

    // 7) Missile Launch Demo Animation
    if (this.missilesLaunching) {
      this.missileLaunchElapsed += dt;
      let allDone = true;
      for (const m of this.missiles) {
        const delay = m.order * 0.28;
        if (this.missileLaunchElapsed >= delay) {
          const t = this.missileLaunchElapsed - delay;
          if (t < 2.2) {
            allDone = false;
            m.flame.visible = true;
            m.flame.scale.set(1, 1, 0.8 + 0.4 * Math.sin(elapsed * 60));
            const drop = Math.min(0.45, t * 2.2);
            const fwd = Math.pow(t, 2.2) * 34;
            m.group.position.set(m.restPos.x, m.restPos.y - drop, m.restPos.z + fwd);
          } else {
            m.group.visible = false;
            m.flame.visible = false;
          }
        } else {
          allDone = false;
        }
      }
      if (allDone && this.missileLaunchElapsed > 3.8) {
        this.resetMissiles();
      }
    }
  }
}
