import * as THREE from 'three';
import { soundFX } from '../game/sound.js';
import { ParticleSystem } from '../game/particles.js';

/**
 * Interactive 3D Flight & Combat Simulator for the LEGO F-77 Lancer
 * Features:
 *  - LEGO-style Airbase Runway, Control Tower, Runway Lights, Terrain & Clouds
 *  - Take-Off (Manual throttle + rotation OR 1-click Auto Take-Off)
 *  - Free Arcade Fighter Flight (Throttle, Pitch, Roll/Yaw, Afterburner, Gear)
 *  - Homing Missile Firing (all 6 underwing missiles + Reload) vs 6 Aerial Target Drones!
 *  - Smooth Manual or 1-click Auto Landing back onto the runway with touchdown effects
 *  - 3 Camera Modes: Chase Cam, Cockpit/Nose Cam, Cinematic Orbit
 */
export class FlightSimulator {
  constructor(jet, studio, callbacks = {}) {
    this.jet = jet;
    this.studio = studio;
    this.callbacks = callbacks;

    this.active = false;
    this.particles = new ParticleSystem(studio.scene);

    // 3D Flight World Root (hidden outside Flight Sim mode)
    this.worldRoot = new THREE.Group();
    this.worldRoot.name = 'FlightSimWorld';
    this.worldRoot.visible = false;
    studio.scene.add(this.worldRoot);

    this.radarDish = null;
    this.targets = [];
    this.activeProjectiles = [];
    this.rings = [];

    this._buildAirbaseWorld();
    this._spawnTargets();

    // Flight Physics State
    this.pos = new THREE.Vector3(0, 0, 0); // Jet root world position (y = 0 means tires on runway!)
    this.heading = 0; // radians around Y (0 = facing +Z down runway)
    this.pitch = 0;   // radians (+ = nose up)
    this.roll = 0;    // radians (+ = bank left)
    this.speed = 0;   // scene units / sec (0 .. 185)
    this.throttle = 0; // 0 .. 1
    this.afterburner = false;

    // Flight Phases: 'PARKED' | 'TAKEOFF' | 'AIRBORNE' | 'LANDING'
    this.phase = 'PARKED';
    this.autoMode = null; // null | 'takeoff' | 'landing'
    this.cameraMode = 'chase'; // 'chase' | 'cockpit' | 'orbit'

    // Weapons & Score
    this.missilesLoaded = [true, true, true, true, true, true];
    this.targetsDestroyed = 0;
    this.ringsPassed = 0;
    this.lockedTarget = null;

    // Input key state
    this.keys = {};
    this._onKeyDown = (e) => {
      if (!this.active) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.fireMissile();
      } else if (e.code === 'KeyG') {
        this.toggleGear();
      } else if (e.code === 'KeyB') {
        this.toggleAfterburner();
      } else if (e.code === 'KeyC') {
        this.cycleCamera();
      } else if (e.code === 'KeyR') {
        this.reloadMissiles();
      }
    };
    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };
    this._onBlur = () => {
      this.keys = {};
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    this._hudTimer = 0;
    this._camSmoothPos = new THREE.Vector3();
    this._camSmoothTarget = new THREE.Vector3();
  }

  _buildAirbaseWorld() {
    // 1) Vast Ocean / Ground Plane under the airbase
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3b6e4c, roughness: 0.92, metalness: 0.0 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600).rotateX(-Math.PI / 2), groundMat);
    ground.position.y = -0.18;
    ground.receiveShadow = true;
    this.worldRoot.add(ground);

    // Distant blue coastline ocean border
    const ocean = new THREE.Mesh(
      new THREE.RingGeometry(680, 1900, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x2a6ea6, roughness: 0.35, metalness: 0.15 })
    );
    ocean.position.y = -0.14;
    this.worldRoot.add(ocean);

    // 2) Main Asphalt Airbase Runway (x in [-22, 22], z in [-60, +520])
    const runwayLen = 580;
    const runwayW = 44;
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x2c323b, roughness: 0.82 });
    const runway = new THREE.Mesh(new THREE.BoxGeometry(runwayW, 0.24, runwayLen), runwayMat);
    runway.position.set(0, -0.12, 230);
    runway.receiveShadow = true;
    this.worldRoot.add(runway);

    // Concrete Apron / Taxiway shoulder
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x7b838d, roughness: 0.85 });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(84, 0.16, 120), apronMat);
    apron.position.set(-48, -0.12, 18);
    apron.receiveShadow = true;
    this.worldRoot.add(apron);

    // Crisp White Runway Centerline Dashes & Threshold Piano Keys
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    for (let z = -35; z <= 495; z += 26) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 13).rotateX(-Math.PI / 2), whiteMat);
      dash.position.set(0, 0.02, z);
      this.worldRoot.add(dash);
    }

    // Side solid white edge lines
    for (const s of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(1.0, runwayLen - 16).rotateX(-Math.PI / 2), whiteMat);
      edge.position.set(s * (runwayW / 2 - 2.2), 0.02, 230);
      this.worldRoot.add(edge);
    }

    // Threshold piano keys at start (z = -46) and far end (z = 505)
    for (const tz of [-46, 505]) {
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 12).rotateX(-Math.PI / 2), whiteMat);
        bar.position.set(i * 4.8, 0.025, tz);
        this.worldRoot.add(bar);
      }
    }

    // Glowing Runway Edge Lights
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const amberLightMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    for (let z = -50; z <= 510; z += 40) {
      const mat = z < 40 ? greenLightMat : z > 420 ? redLightMat : amberLightMat;
      for (const s of [-1, 1]) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.9), mat);
        lamp.position.set(s * (runwayW / 2 + 1.4), 0.55, z);
        this.worldRoot.add(lamp);
      }
    }

    // 3) LEGO-Style Air Traffic Control Tower + Spinning Radar + Hangar beside Runway!
    const tower = new THREE.Group();
    tower.position.set(-54, 0, 26);

    const towerMat1 = new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.4 });
    const towerMat2 = new THREE.MeshStandardMaterial({ color: 0x3b4858, roughness: 0.45 });
    const towerGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.5 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 16), towerMat1);
    base.position.y = 6;
    base.castShadow = true;
    tower.add(base);

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(9, 26, 9), towerMat2);
    shaft.position.y = 22;
    shaft.castShadow = true;
    tower.add(shaft);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(15, 7, 15), towerGlass);
    cab.position.y = 37;
    tower.add(cab);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(17, 2.2, 17), towerMat1);
    roof.position.y = 41.5;
    tower.add(roof);

    // Spinning Radar Dish on top of ATC Tower
    const radar = new THREE.Group();
    radar.position.y = 44.5;
    const dish = new THREE.Mesh(new THREE.BoxGeometry(8, 2.6, 0.8), yellowMat);
    radar.add(dish);
    tower.add(radar);
    this.radarDish = radar;
    this.worldRoot.add(tower);

    // LEGO Aircraft Hangar
    const hangar = new THREE.Mesh(
      new THREE.BoxGeometry(36, 16, 46),
      new THREE.MeshStandardMaterial({ color: 0x515d6e, roughness: 0.6 })
    );
    hangar.position.set(-64, 8, -12);
    hangar.castShadow = true;
    this.worldRoot.add(hangar);

    // 4) Stylized Blocky LEGO Mountains & Hills around perimeter for depth perception!
    const hillMat1 = new THREE.MeshStandardMaterial({ color: 0x4b7f58, roughness: 0.85 });
    const hillMat2 = new THREE.MeshStandardMaterial({ color: 0x5f7482, roughness: 0.85 });
    const hillSpecs = [
      [-260, 0, 260, 140, 75, 130],
      [280, 0, 320, 160, 95, 150],
      [-310, 0, -140, 150, 65, 140],
      [290, 0, -180, 170, 82, 140],
      [0, 0, 740, 220, 110, 160],
      [-240, 0, 620, 150, 85, 130],
      [250, 0, 650, 150, 90, 130],
    ];
    for (const [hx, , hz, hw, hh, hd] of hillSpecs) {
      const m1 = new THREE.Mesh(new THREE.BoxGeometry(hw, hh * 0.55, hd), hillMat1);
      m1.position.set(hx, hh * 0.275, hz);
      this.worldRoot.add(m1);
      const m2 = new THREE.Mesh(new THREE.BoxGeometry(hw * 0.62, hh * 0.45, hd * 0.62), hillMat2);
      m2.position.set(hx, hh * 0.75, hz);
      this.worldRoot.add(m2);
    }

    // 5) Crisp LEGO Blocky Sky Clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, transparent: true, opacity: 0.9 });
    const cloudCoords = [
      [-140, 110, 240], [160, 135, 340], [-90, 145, 520], [120, 120, 620],
      [-220, 130, 80], [210, 125, -40], [20, 155, 420], [-180, 140, 460],
      [240, 145, 180], [-40, 130, -160], [170, 150, 520], [-250, 120, 320],
    ];
    for (const [cx, cy, cz] of cloudCoords) {
      const cGroup = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(26 + i * 10, 9, 18 + (2 - i) * 8), cloudMat);
        block.position.set((i - 1) * 14, (i % 2) * 4, (i - 1) * 6);
        cGroup.add(block);
      }
      cGroup.position.set(cx, cy, cz);
      this.worldRoot.add(cGroup);
    }
  }

  _spawnTargets() {
    // Clear existing targets & rings
    for (const t of this.targets) this.worldRoot.remove(t.group);
    for (const r of this.rings) this.worldRoot.remove(r.mesh);
    this.targets = [];
    this.rings = [];
    this.targetsDestroyed = 0;
    this.ringsPassed = 0;

    // 6 Aerial Target Drones patrolling the sky around the airbase
    const droneCoords = [
      [0, 55, 360],
      [-75, 72, 480],
      [85, 68, 510],
      [140, 85, 290],
      [-135, 78, 250],
      [15, 92, 620],
    ];

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35, metalness: 0.25 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.55, side: THREE.DoubleSide });

    droneCoords.forEach(([x, y, z], idx) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      // LEGO Target Drone body
      const hull = new THREE.Mesh(new THREE.OctahedronGeometry(5.5, 0), bodyMat);
      g.add(hull);
      const wingBar = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 3.2), bodyMat);
      g.add(wingBar);
      const core = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), coreMat);
      g.add(core);

      // Visible radar halo around drone so player easily spots targets from afar!
      const halo = new THREE.Mesh(new THREE.RingGeometry(8.5, 9.6, 24), ringMat);
      g.add(halo);

      this.worldRoot.add(g);
      this.targets.push({
        id: idx,
        group: g,
        halo,
        basePos: new THREE.Vector3(x, y, z),
        alive: true,
        orbitPhase: idx * 1.1,
      });
    });

    // 4 Golden Flight Waypoint Rings along the climb-out corridor!
    const ringCoords = [
      [0, 34, 260],
      [0, 58, 410],
      [-70, 74, 530],
      [80, 70, 440],
    ];
    const goldRingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.78 });
    for (const [rx, ry, rz] of ringCoords) {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(15, 0.9, 10, 32), goldRingMat.clone());
      torus.position.set(rx, ry, rz);
      this.worldRoot.add(torus);
      this.rings.push({ mesh: torus, passed: false });
    }
  }

  start() {
    this.active = true;
    this.worldRoot.visible = true;

    // Configure sky atmosphere (disable studio floor & turntable)
    this.studio.setFlightSimEnvironment(true);
    this.studio.controls.autoRotate = false;

    // Reset jet cleanly onto start of runway
    this.resetRunway();
  }

  stop() {
    this.active = false;
    this.keys = {};
    this.worldRoot.visible = false;
    this.autoMode = null;

    // Clean up any flying missile projectiles
    for (const p of this.activeProjectiles) this.worldRoot.remove(p.mesh);
    this.activeProjectiles = [];

    // Reset jet transform cleanly back to studio origin
    this.jet.root.position.set(0, 0, 0);
    this.jet.root.rotation.set(0, 0, 0);
    this.jet.flightGroup.position.set(0, this.jet.groundElevation, 0);
    this.jet.flightGroup.rotation.set(0, 0, 0);
    this.jet.setAfterburner(false);
    this.jet.setGearDown(true);
    this.jet.setFlightMode(false);
    this.reloadMissiles(true);

    this.studio.setFlightSimEnvironment(false);
    this.studio.controls.enabled = true;
  }

  resetRunway() {
    for (const p of this.activeProjectiles) this.worldRoot.remove(p.mesh);
    this.activeProjectiles = [];

    this.pos.set(0, 0, -25);
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;
    this.speed = 0;
    this.throttle = 0;
    this.afterburner = false;
    this.phase = 'PARKED';
    this.autoMode = null;

    this.jet.setBuildStep(20);
    this.jet.setExplode(0);
    this.jet.setFlightMode(false);
    this.jet.setCanopyOpen(false);
    this.jet.setGearDown(true);
    this.jet.setAfterburner(false);
    this.reloadMissiles(true);
    this._spawnTargets();

    this._applyJetTransform();
    this._snapCameraImmediate();
    this._emitHUD();
  }

  startAutoTakeOff() {
    if (!this.active) return;
    if (this.phase === 'AIRBORNE') {
      this._notify('Pesawat sudah mengudara! Gunakan tombol Landing untuk mendarat.');
      return;
    }
    this.autoMode = 'takeoff';
    this.phase = 'TAKEOFF';
    this.throttle = 1.0;
    this.afterburner = true;
    this.jet.setCanopyOpen(false);
    this.jet.setAfterburner(true);
    this._notify('Auto Take-Off aktif: Afterburner penuh, meluncur di landasan.');
    this._emitHUD();
  }

  startAutoLanding() {
    if (!this.active) return;
    if (this.phase === 'PARKED') {
      this._notify('Pesawat sudah terparkir di landasan.');
      return;
    }
    this.autoMode = 'landing';
    this.phase = 'LANDING';
    this.afterburner = false;
    this.jet.setAfterburner(false);
    if (!this.jet.gearDown) {
      this.jet.setGearDown(true);
      soundFX.playGearToggle();
    }
    this._notify('Auto Landing aktif: mengarahkan ke landasan dan menurunkan roda.');
    this._emitHUD();
  }

  toggleGear() {
    if (!this.active) return;
    if (this.pos.y < 3 && this.jet.gearDown) {
      this._notify('Roda tidak dapat dilipat saat masih di landasan.');
      return;
    }
    this.jet.setGearDown(!this.jet.gearDown);
    soundFX.playGearToggle();
    this._notify(this.jet.gearDown ? 'Roda pendaratan diturunkan.' : 'Roda pendaratan dilipat.');
    this._emitHUD();
  }

  toggleAfterburner() {
    if (!this.active) return;
    this.afterburner = !this.afterburner;
    if (this.afterburner && this.throttle < 0.8) this.throttle = 1.0;
    this.jet.setAfterburner(this.afterburner);
    this._emitHUD();
  }

  setThrottle(val) {
    this.throttle = Math.max(0, Math.min(1, val));
    if (this.throttle < 0.75) {
      this.afterburner = false;
      this.jet.setAfterburner(false);
    }
    if (this.throttle > 0.15 && this.phase === 'PARKED') {
      this.phase = 'TAKEOFF';
    }
    this._emitHUD();
  }

  cycleCamera() {
    const order = ['chase', 'cockpit', 'orbit'];
    const nextIdx = (order.indexOf(this.cameraMode) + 1) % order.length;
    this.cameraMode = order[nextIdx];
    this.studio.controls.enabled = this.cameraMode === 'orbit';
    const labels = { chase: 'Kamera Ekor (Chase)', cockpit: 'Kamera Kokpit', orbit: 'Kamera Orbit 360°' };
    this._notify(`Kamera aktif: ${labels[this.cameraMode]}.`);
    this._emitHUD();
  }

  reloadMissiles(silent = false) {
    this.missilesLoaded = [true, true, true, true, true, true];
    for (const m of this.jet.missiles) {
      m.group.visible = true;
      m.group.position.copy(m.restPos);
      m.flame.visible = false;
    }
    if (!silent) {
      soundFX.playSelect();
      this._notify('6 rudal udara-ke-udara diisi ulang penuh.');
    }
    this._emitHUD();
  }

  fireMissile() {
    if (!this.active) return false;
    const idx = this.missilesLoaded.findIndex((loaded) => loaded);
    if (idx === -1) {
      this._notify('Rudal habis. Tekan R atau klik Isi Rudal.');
      soundFX.playWrong();
      return false;
    }

    this.missilesLoaded[idx] = false;
    const underwing = this.jet.missiles[idx];
    const spawnWorldPos = new THREE.Vector3();
    if (underwing) {
      underwing.group.getWorldPosition(spawnWorldPos);
      underwing.group.visible = false;
    } else {
      spawnWorldPos.copy(this.pos).add(new THREE.Vector3(0, 3, 0));
    }

    const proj = this._createProjectileMesh();
    proj.position.copy(spawnWorldPos);

    const fwd = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(-this.pitch, this.heading, 0, 'YXZ')).normalize();
    proj.lookAt(spawnWorldPos.clone().add(fwd));
    this.worldRoot.add(proj);

    const target = this._findBestLockTarget();
    this.activeProjectiles.push({
      mesh: proj,
      vel: fwd.multiplyScalar(Math.max(165, this.speed + 130)),
      target,
      life: 0,
    });

    soundFX.playMissileLaunch();
    this._notify(
      target
        ? `Rudal #${idx + 1} diluncurkan: mengunci Drone #${target.id + 1}.`
        : `Rudal #${idx + 1} diluncurkan.`
    );
    this._emitHUD();
    return true;
  }

  _createProjectileMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 4.4, 10).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25 })
    );
    g.add(body);
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 1.3, 10).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd42626, roughness: 0.25 })
    );
    nose.position.z = 2.85;
    g.add(nose);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 4.2, 8).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.92 })
    );
    flame.position.z = -4.2;
    g.add(flame);
    return g;
  }

  _findBestLockTarget() {
    const fwd = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(-this.pitch, this.heading, 0, 'YXZ')).normalize();
    let best = null;
    let bestScore = Infinity;

    for (const t of this.targets) {
      if (!t.alive) continue;
      const toT = t.group.position.clone().sub(this.pos);
      const dist = toT.length();
      if (dist > 650) continue;
      const dot = fwd.dot(toT.clone().normalize());
      if (dot < 0.35) continue; // within forward lock cone
      const score = dist * (1.4 - dot);
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }

  _notify(msg) {
    if (this.callbacks.onNotify) this.callbacks.onNotify(msg);
  }

  _applyJetTransform() {
    this.jet.root.position.copy(this.pos);
    // Keep flightGroup at groundElevation when tires touch y = 0
    this.jet.flightGroup.position.set(0, this.jet.groundElevation, 0);
    // Three.js aircraft orientation: heading around Y, pitch around X (-pitch pitches nose UP when facing +Z!), roll around Z
    this.jet.root.rotation.order = 'YXZ';
    this.jet.root.rotation.set(-this.pitch, this.heading, this.roll);
  }

  _snapCameraImmediate() {
    const camPos = this._computeDesiredCameraPos();
    const camTarget = this._computeDesiredCameraTarget();
    this._camSmoothPos.copy(camPos);
    this._camSmoothTarget.copy(camTarget);
    this.studio.camera.position.copy(camPos);
    this.studio.controls.target.copy(camTarget);
  }

  _computeDesiredCameraPos() {
    const jetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-this.pitch * 0.65, this.heading, this.roll * 0.25, 'YXZ')
    );
    if (this.cameraMode === 'cockpit') {
      const offset = new THREE.Vector3(0, 6.2, 6.2).applyQuaternion(jetQuat);
      return this.pos.clone().add(offset);
    }
    // Chase Cam behind & slightly above jet
    const speedPull = (this.speed / 180) * 6.5;
    const offset = new THREE.Vector3(0, 10.5, -(33 + speedPull)).applyQuaternion(jetQuat);
    const desired = this.pos.clone().add(offset);
    desired.y = Math.max(2.6, desired.y);
    return desired;
  }

  _computeDesiredCameraTarget() {
    const jetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-this.pitch, this.heading, 0, 'YXZ')
    );
    const lookAhead = this.cameraMode === 'cockpit' ? 85 : 22;
    const offset = new THREE.Vector3(0, 4.2, lookAhead).applyQuaternion(jetQuat);
    return this.pos.clone().add(offset);
  }

  getHudSnapshot() {
    const missilesLeft = this.missilesLoaded.filter(Boolean).length;
    const knots = Math.round(this.speed * 4.4);
    const altitudeFt = Math.max(0, Math.round(this.pos.y * 12));
    const mach = (knots / 660).toFixed(2);
    return {
      phase: this.phase,
      autoMode: this.autoMode,
      speedKnots: knots,
      mach,
      altitudeFt,
      throttlePct: Math.round(this.throttle * 100),
      afterburner: this.afterburner,
      gearDown: this.jet.gearDown,
      missilesLeft,
      targetsDestroyed: this.targetsDestroyed,
      targetsTotal: this.targets.length,
      ringsPassed: this.ringsPassed,
      ringsTotal: this.rings.length,
      lockedTargetId: this.lockedTarget ? this.lockedTarget.id + 1 : null,
      cameraMode: this.cameraMode,
    };
  }

  _emitHUD() {
    if (this.callbacks.onHudUpdate) {
      this.callbacks.onHudUpdate(this.getHudSnapshot());
    }
  }

  update(dt, elapsed) {
    this.particles.update(dt);
    if (!this.active) return;

    // Spin ATC tower radar
    if (this.radarDish) this.radarDish.rotation.y += dt * 1.4;

    // Animate target drones & rings
    for (const t of this.targets) {
      if (!t.alive) continue;
      t.group.position.x = t.basePos.x + Math.sin(elapsed * 0.6 + t.orbitPhase) * 28;
      t.group.position.y = t.basePos.y + Math.cos(elapsed * 1.1 + t.orbitPhase) * 6;
      t.group.rotation.y += dt * 1.2;
      t.halo.lookAt(this.studio.camera.position);
    }
    for (const r of this.rings) {
      r.mesh.rotation.z += dt * 0.8;
      if (!r.passed && this.pos.distanceTo(r.mesh.position) < 20) {
        r.passed = true;
        r.mesh.material.color.setHex(0x34d399);
        r.mesh.material.opacity = 0.35;
        this.ringsPassed += 1;
        soundFX.playSnap(4);
        this.particles.burst(r.mesh.position.clone(), 24, 10);
        this._notify(`Melewati cincin terbang (${this.ringsPassed}/${this.rings.length}).`);
        this._emitHUD();
      }
    }

    let pitchCmd = 0;
    let turnCmd = 0;

    if (this.autoMode === 'takeoff') {
      this.throttle = 1.0;
      this.afterburner = true;
      this.jet.setAfterburner(true);
      this.heading += (0 - this.heading) * Math.min(1, dt * 3);
      this.roll += (0 - this.roll) * Math.min(1, dt * 4);
      if (this.speed >= 34) {
        this.phase = 'AIRBORNE';
        pitchCmd = 0.62;
        if (this.pos.y > 10 && this.jet.gearDown) {
          this.jet.setGearDown(false);
          soundFX.playGearToggle();
        }
        if (this.pos.y >= 46) {
          this.autoMode = null;
          this._notify('Take-Off selesai. Kendalikan pesawat dengan Panah, A/D, dan Spasi.');
        }
      }
    } else if (this.autoMode === 'landing') {
      const approachPoint = new THREE.Vector3(0, 18, -45);
      const isAligned = Math.abs(this.pos.x) < 16 && this.pos.z < 120 && this.pos.z > -100 && Math.abs(Math.sin(this.heading)) < 0.35;

      if (!isAligned && this.pos.y > 4) {
        const dx = approachPoint.x - this.pos.x;
        const dz = approachPoint.z - this.pos.z;
        const targetHeading = Math.atan2(dx, dz);
        let diff = targetHeading - this.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turnCmd = Math.max(-1, Math.min(1, diff * 1.4));

        const targetAlt = Math.max(18, Math.min(45, Math.hypot(dx, dz) * 0.14));
        pitchCmd = Math.max(-0.5, Math.min(0.5, (targetAlt - this.pos.y) * 0.05));
        this.throttle = 0.42;
      } else {
        let hDiff = 0 - this.heading;
        while (hDiff > Math.PI) hDiff -= Math.PI * 2;
        while (hDiff < -Math.PI) hDiff += Math.PI * 2;
        turnCmd = Math.max(-0.8, Math.min(0.8, hDiff * 2.2 - this.pos.x * 0.025));

        if (this.pos.y > 0.4) {
          this.throttle = 0.25;
          pitchCmd = this.pos.y < 5 ? 0.15 : -0.22;
        } else {
          this.pos.y = 0;
          this.pitch *= Math.max(0, 1 - dt * 6);
          this.roll *= Math.max(0, 1 - dt * 8);
          this.throttle = 0;
          this.speed = Math.max(0, this.speed - dt * 36);
          if (this.speed <= 0.5) {
            this.speed = 0;
            this.phase = 'PARKED';
            this.autoMode = null;
            this._notify('Pendaratan selesai. F-77 Lancer berhenti aman di landasan.');
            this._emitHUD();
          }
        }
      }
    } else {
      // Manual Player Controls!
      if (this.keys.KeyW) this.throttle = Math.min(1, this.throttle + dt * 0.65);
      if (this.keys.KeyS) this.throttle = Math.max(0, this.throttle - dt * 0.65);
      if (this.throttle >= 0.92 && this.keys.ShiftLeft) {
        this.afterburner = true;
        this.jet.setAfterburner(true);
      }

      if (this.keys.ArrowDown) pitchCmd = 1;       // pull stick back -> nose UP!
      else if (this.keys.ArrowUp) pitchCmd = -1;   // push stick forward -> nose DOWN!

      if (this.keys.KeyA || this.keys.ArrowLeft) turnCmd = 1;
      else if (this.keys.KeyD || this.keys.ArrowRight) turnCmd = -1;

      if (this.throttle > 0.12 && this.phase === 'PARKED') {
        this.phase = 'TAKEOFF';
      }
    }

    // Integrate speed, lift, and aircraft attitude
    const maxSpeed = this.afterburner ? 165 : 112;
    const targetSpeed = this.throttle * maxSpeed;
    const accel = this.afterburner ? 42 : 24;
    if (this.speed < targetSpeed) {
      this.speed = Math.min(targetSpeed, this.speed + accel * dt);
    } else {
      const drag = this.pos.y <= 0.1 ? 26 : 16;
      this.speed = Math.max(targetSpeed, this.speed - drag * dt);
    }

    // Attitude responsiveness
    const isAirborne = this.pos.y > 0.35;
    if (isAirborne || this.speed > 30) {
      const targetPitch = Math.max(-0.52, Math.min(0.58, this.pitch + pitchCmd * dt * 1.15));
      if (Math.abs(pitchCmd) > 0.01) {
        this.pitch = targetPitch;
      } else if (isAirborne) {
        // Gentle auto-leveling stability
        this.pitch *= Math.max(0, 1 - dt * 1.1);
      }
    } else {
      this.pitch *= Math.max(0, 1 - dt * 5);
    }

    if (isAirborne) {
      const targetRoll = turnCmd * 0.72;
      this.roll += (targetRoll - this.roll) * Math.min(1, dt * 4.5);
      this.heading += turnCmd * dt * 0.95;
    } else {
      // Steering gently on runway ground
      this.roll *= Math.max(0, 1 - dt * 8);
      if (this.speed > 2) {
        this.heading += turnCmd * dt * 0.45;
      }
    }

    // Advance 3D position along jet velocity vector
    const fwd = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(-this.pitch, this.heading, 0, 'YXZ')).normalize();
    const prevY = this.pos.y;
    this.pos.addScaledVector(fwd, this.speed * dt);

    // Prevent sinking below ground & detect touchdown!
    if (this.pos.y <= 0) {
      this.pos.y = 0;
      if (prevY > 0.35) {
        // Touchdown!
        if (!this.jet.gearDown) {
          this.jet.setGearDown(true);
        }
        soundFX.playTouchdown();
        this.particles.burst(this.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 14, 4.5);
        this.pitch = Math.max(0, this.pitch * 0.2);
        this.roll = 0;
        if (this.autoMode !== 'landing') {
          this.phase = this.speed > 5 ? 'LANDING' : 'PARKED';
          this._notify('Touchdown: roda menyentuh permukaan.');
        }
      }
      if (this.speed < 1 && this.throttle < 0.05) {
        this.phase = 'PARKED';
      }
    } else if (this.pos.y > 2.5 && this.phase === 'TAKEOFF') {
      this.phase = 'AIRBORNE';
    }

    // Soft world ceiling & airspace boundary
    if (this.pos.y > 210) {
      this.pos.y = 210;
      this.pitch = Math.min(0, this.pitch);
    }
    const radialDist = Math.hypot(this.pos.x, this.pos.z - 230);
    if (radialDist > 850) {
      // Gently bank back toward airbase if flying too far out
      const backHeading = Math.atan2(-this.pos.x, 230 - this.pos.z);
      let d = backHeading - this.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.heading += d * dt * 1.2;
    }

    // Control surface visual deflection on the LEGO jet!
    for (const a of this.jet.ailerons) {
      a.pivot.rotation.x += (a.side * turnCmd * 0.35 - a.pivot.rotation.x) * Math.min(1, dt * 10);
    }
    for (const e of this.jet.elevators) {
      e.pivot.rotation.x += (-pitchCmd * 0.28 - e.pivot.rotation.x) * Math.min(1, dt * 10);
    }
    for (const r of this.jet.rudders) {
      r.pivot.rotation.y += (turnCmd * 0.28 - r.pivot.rotation.y) * Math.min(1, dt * 10);
    }

    this._applyJetTransform();

    // Update homing missiles and check target collisions
    this.lockedTarget = this._findBestLockTarget();

    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];
      p.life += dt;

      if (p.target && p.target.alive) {
        const desiredDir = p.target.group.position.clone().sub(p.mesh.position).normalize();
        const curSpd = p.vel.length();
        const curDir = p.vel.clone().normalize().lerp(desiredDir, Math.min(1, dt * 6.5)).normalize();
        p.vel.copy(curDir.multiplyScalar(curSpd + dt * 55));
      }

      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.lookAt(p.mesh.position.clone().add(p.vel));

      // Check collision against any alive target drone
      let hit = false;
      for (const t of this.targets) {
        if (!t.alive) continue;
        if (p.mesh.position.distanceTo(t.group.position) < 12.5) {
          t.alive = false;
          t.group.visible = false;
          this.targetsDestroyed += 1;
          hit = true;
          soundFX.playExplosion();
          this.particles.burst(t.group.position.clone(), 46, 16);
          this._notify(`Target hancur (${this.targetsDestroyed}/${this.targets.length} drone).`);
          this._emitHUD();
          break;
        }
      }

      if (hit || p.life > 5.5 || p.mesh.position.y < -1) {
        this.worldRoot.remove(p.mesh);
        this.activeProjectiles.splice(i, 1);
      }
    }

    // Update follow, cockpit, or orbit camera
    if (this.cameraMode !== 'orbit') {
      const desiredPos = this._computeDesiredCameraPos();
      const desiredTarget = this._computeDesiredCameraTarget();
      const camLerp = Math.min(1, dt * (this.cameraMode === 'cockpit' ? 16 : 6.5));
      this._camSmoothPos.lerp(desiredPos, camLerp);
      this._camSmoothTarget.lerp(desiredTarget, camLerp);
      this.studio.camera.position.copy(this._camSmoothPos);
      this.studio.controls.target.copy(this._camSmoothTarget);
    } else {
      // Orbit around moving jet!
      const deltaTarget = this.pos.clone().add(new THREE.Vector3(0, 4, 0)).sub(this.studio.controls.target);
      this.studio.camera.position.add(deltaTarget);
      this.studio.controls.target.add(deltaTarget);
    }

    // Throttled HUD telemetry update (10 Hz)
    this._hudTimer += dt;
    if (this._hudTimer >= 0.1) {
      this._hudTimer = 0;
      this._emitHUD();
    }
  }
}
