import * as THREE from 'three';
import { U, P, makeBrick, makeTile, makeSlope, place, tagAtomicBlock } from '../lego/bricks.js';

/**
 * Builds the Detailed Cockpit Interior & Hinged Trans-Brown LEGO Canopy
 * Matches "Kokpit Detil" inset in "LEGO Pesawat Tempur F-77 Lancer.png"
 *  - Step 7: Cockpit interior (seats, joystick, glowing MFD dashboard, HUD, side consoles)
 *  - Step 8: Tinted smoke/amber polycarbonate canopy with dark gray molded frame ribs
 */
export function buildCockpit(mats, registerPart) {
  const root = new THREE.Group();
  root.name = 'CockpitRoot';

  // Step 7: detailed cockpit interior
  const interior = new THREE.Group();

  // Front Instrument Glare Shield & Printed MFD Dashboard (grouped as 1 cockpit dashboard block)
  const dashGroup = new THREE.Group();
  place(dashGroup, makeBrick(3, 1.4, 2.4, mats.charcoal, { studs: false }), 0, 3.5, 10.3);
  const dashPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2 * U, 1.05 * U),
    mats.dashboard
  );
  dashPlane.position.set(0, 5.3 * P, 9.52 * U);
  dashPlane.rotation.y = Math.PI;
  dashPlane.rotation.x = 0.25;
  dashGroup.add(dashPlane);
  tagAtomicBlock(dashGroup, 'Konsol', 'Panel Layar MFD', '#2c3036', 'Arang', 'dashboard', '3×1');
  interior.add(dashGroup);

  // Translucent Green HUD Combiner Glass above dashboard!
  const hudFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.95 * U, 0.65 * U, 0.06 * U),
    mats.hudGlass
  );
  hudFrame.position.set(0, 7.2 * P, 9.7 * U);
  hudFrame.rotation.x = -0.35;
  tagAtomicBlock(hudFrame, 'Kaca HUD', 'Kaca HUD Hijau', '#22dd66', 'Hijau Trans', 'hud', '1×1');
  interior.add(hudFrame);

  // Build Tandem Pilot Seats (Front Pilot + Rear WSO)
  const seatPositions = [7.4, 4.6];
  seatPositions.forEach((sz, idx) => {
    const seat = new THREE.Group();
    place(seat, makeBrick(1.8, 1.6, 1, mats.black, { studs: false }), 0, 3.8, 0);
    for (const s of [-1, 1]) {
      place(seat, makeTile(0.35, 1.5, mats.charcoal, 2.2), s * 0.85, 4.0, -0.1);
    }
    const backrest = new THREE.Group();
    place(backrest, makeTile(1.6, 0.55, mats.black, 4.4), 0, 0, 0);
    place(backrest, makeTile(1.2, 0.6, mats.darkGray, 1.5), 0, 4.3, 0.05);
    place(backrest, makeTile(0.6, 0.2, mats.red, 0.6), 0, 5.7, 0.12);
    backrest.position.set(0, 4.4 * P, -0.65 * U);
    backrest.rotation.x = -0.22;
    seat.add(backrest);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * U, 0.09 * U, 1.1 * U, 8),
      mats.black
    );
    stick.position.set(0, 5.2 * P, 1.15 * U);
    stick.rotation.x = -0.18;
    seat.add(stick);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.2 * U, 0.25 * U, 0.22 * U), mats.red);
    grip.position.set(0, 6.8 * P, 1.05 * U);
    seat.add(grip);

    seat.position.set(0, 0, sz * U);
    tagAtomicBlock(seat, 'Kursi', idx === 0 ? 'Kursi Pilot Depan' : 'Kursi Pilot Belakang', '#1a1d21', 'Hitam', 'seat', '2×2');
    interior.add(seat);
  });

  // Side Avionics Consoles with glowing indicator tiles (grouped as 1 console per side)
  for (const s of [-1, 1]) {
    const sideConsole = new THREE.Group();
    place(sideConsole, makeTile(0.7, 6.2, mats.charcoal, 1.5), s * 1.45, 3.8, 6.6);
    place(sideConsole, makeTile(0.35, 0.35, mats.transGreen, 0.4), s * 1.45, 5.3, 8.6);
    place(sideConsole, makeTile(0.35, 0.35, mats.transAmber, 0.4), s * 1.45, 5.3, 7.6);
    place(sideConsole, makeTile(0.35, 0.35, mats.transRed, 0.4), s * 1.45, 5.3, 6.6);
    place(sideConsole, makeTile(0.35, 0.35, mats.transGreen, 0.4), s * 1.45, 5.3, 5.2);
    tagAtomicBlock(
      sideConsole,
      'Konsol',
      `Konsol Samping ${s > 0 ? 'Kiri' : 'Kanan'}`,
      '#2c3036',
      'Arang',
      'dashboard',
      '1×6'
    );
    interior.add(sideConsole);
  }

  root.add(interior);
  registerPart(interior, 7, new THREE.Vector3(0, 1.8, 0.8));

  // Step 8: hinged trans-brown canopy anchored at the rear pivot
  const canopyPivot = new THREE.Group();
  canopyPivot.name = 'CanopyPivot';
  canopyPivot.position.set(0, 6.4 * P, 2.5 * U);

  const canopyLocal = new THREE.Group();
  // Shift geometry relative to pivot
  canopyLocal.position.set(0, -6.4 * P, -2.5 * U);

  // Build authentic curved/faceted LEGO fighter canopy lofted along Z (z = 2.6 to 11.4)
  const canopyGlassGeo = createCanopyGeometry();
  const canopyGlassMesh = new THREE.Mesh(canopyGlassGeo, mats.canopyGlass);
  canopyGlassMesh.castShadow = false;
  canopyLocal.add(canopyGlassMesh);

  // Molded Dark Gray LEGO Canopy Frame (lower rail + surface-hugging arched ribs!)
  for (const s of [-1, 1]) {
    place(canopyLocal, makeTile(0.32, 8.2, mats.darkGray, 0.9), s * 1.62, 6.2, 6.7);
  }
  // Rear solid fairing cap connecting canopy into dorsal spine
  place(canopyLocal, makeSlope(3.0, 1.8, 2.4, mats.darkGray, { flatRatio: 0.35 }), 0, 6.4, 2.9, 0, Math.PI, 0);

  // Surface-conforming structural canopy ribs computed directly on the exact loft surface!
  const ribZList = [8.9, 6.1, 3.8];
  for (const rz of ribZList) {
    const curvePts = [];
    const segs = 20;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI;
      curvePts.push(sampleCanopyPoint(rz, a, 0.03));
    }
    const tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 22, 0.085 * U, 8, false);
    const ribMesh = new THREE.Mesh(tubeGeo, mats.charcoal);
    ribMesh.castShadow = true;
    canopyLocal.add(ribMesh);
  }

  // Forward windscreen twin diagonal side mullions hugging the front glass cleanly
  for (const angle of [Math.PI * 0.28, Math.PI * 0.72]) {
    const mullionPts = [];
    for (let k = 0; k <= 10; k++) {
      const z = 8.9 + (k / 10) * 2.3;
      mullionPts.push(sampleCanopyPoint(z, angle, 0.025));
    }
    const mGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mullionPts), 14, 0.065 * U, 8, false);
    const mMesh = new THREE.Mesh(mGeo, mats.charcoal);
    canopyLocal.add(mMesh);
  }

  tagAtomicBlock(canopyLocal, 'Kanopi', 'Kanopi Trans-Brown', '#6b4e31', 'Trans-Brown', 'canopy', '1×');
  canopyPivot.add(canopyLocal);
  root.add(canopyPivot);
  registerPart(canopyPivot, 8, new THREE.Vector3(0, 3.8, 1.0));

  return { root, canopyPivot };
}

const CANOPY_STATIONS = [
  { z: 2.8,  w: 1.50, h: 0.55 },
  { z: 3.8,  w: 1.60, h: 1.24 },
  { z: 5.5,  w: 1.66, h: 1.56 },
  { z: 7.4,  w: 1.64, h: 1.50 },
  { z: 9.0,  w: 1.52, h: 1.22 },
  { z: 10.3, w: 1.24, h: 0.72 },
  { z: 11.3, w: 0.72, h: 0.14 },
];

function sampleCanopyWH(z) {
  const sts = CANOPY_STATIONS;
  if (z <= sts[0].z) return { w: sts[0].w, h: sts[0].h };
  if (z >= sts[sts.length - 1].z) return { w: sts[sts.length - 1].w, h: sts[sts.length - 1].h };
  for (let i = 0; i < sts.length - 1; i++) {
    if (z >= sts[i].z && z <= sts[i + 1].z) {
      const t = (z - sts[i].z) / (sts[i + 1].z - sts[i].z);
      return {
        w: sts[i].w + (sts[i + 1].w - sts[i].w) * t,
        h: sts[i].h + (sts[i + 1].h - sts[i].h) * t,
      };
    }
  }
  return { w: 1.5, h: 1.0 };
}

function sampleCanopyPoint(z, angle, offset = 0) {
  const { w, h } = sampleCanopyWH(z);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const baseY = 6.45 * P;
  const x = Math.sign(cosA) * Math.pow(Math.abs(cosA), 0.85) * (w + offset) * U;
  const y = baseY + Math.pow(Math.max(0, sinA), 0.82) * (h + offset) * U;
  return new THREE.Vector3(x, y, z * U);
}

/**
 * Generates a sleek, authentic LEGO bubble/faceted fighter canopy shell
 */
function createCanopyGeometry() {
  const stations = CANOPY_STATIONS;
  const radialSegs = 20;
  const positions = [];
  const indices = [];

  for (let s = 0; s < stations.length; s++) {
    const st = stations[s];
    for (let r = 0; r <= radialSegs; r++) {
      const a = (r / radialSegs) * Math.PI;
      const p = sampleCanopyPoint(st.z, a, 0);
      positions.push(p.x, p.y, p.z);
    }
  }

  const ringLen = radialSegs + 1;
  for (let s = 0; s < stations.length - 1; s++) {
    for (let r = 0; r < radialSegs; r++) {
      const a = s * ringLen + r;
      const b = a + 1;
      const c = (s + 1) * ringLen + r;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
