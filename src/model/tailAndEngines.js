import * as THREE from 'three';
import {
  U, P, makeBrick, makeTile, makeGrilleTile,
  makeSlope, makeWedgePlate, place, tagAtomicBlock,
} from '../lego/bricks.js';

/**
 * Builds Twin Jet Engines ("Mesin Ganda"), Horizontal Tailplanes,
 * Twin Canted Vertical Stabilizers ("Ekor Ganda"), and Final Finishing Details
 *  - Step 15: Rear engine nacelles, twin gold-ringed jet nozzles, afterburners & horizontal tailplanes
 *  - Step 16: Twin canted vertical stabilizers with red stripes & white winged-eagle emblems
 *  - Step 19: Final tactical details (dorsal antennas, sensor pods, beacon lights, top tiles)
 */
export function buildTailAndEngines(mats, registerPart) {
  const root = new THREE.Group();
  root.name = 'TailAndEnginesRoot';

  const afterburners = [];
  const elevators = [];
  const rudders = [];

  // Step 15: twin jet engines and horizontal stabilizers
  const step15 = new THREE.Group();

  // Rear engine nacelle fairings + Twin Detailed Nozzles
  for (const s of [-1, 1]) {
    const engineGroup = new THREE.Group();
    engineGroup.position.set(s * 2.4 * U, 3.8 * P, -16.8 * U);

    // Outer gunmetal engine shroud collar
    const shroudGeo = new THREE.CylinderGeometry(1.52 * U, 1.68 * U, 2.2 * U, 16);
    shroudGeo.rotateX(Math.PI / 2);
    const shroud = new THREE.Mesh(shroudGeo, mats.charcoal);
    shroud.position.z = 0.2 * U;
    shroud.castShadow = true;
    shroud.receiveShadow = true;
    engineGroup.add(shroud);

    // 12 Segmented Ribbed Nozzle Petals (authentic "Mesin Ganda" mechanical look!)
    const petalCount = 12;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.BoxGeometry(0.42 * U, 0.22 * U, 2.4 * U),
        i % 2 === 0 ? mats.gunmetal : mats.darkGray
      );
      const r = 1.40 * U;
      petal.position.set(Math.cos(angle) * r, Math.sin(angle) * r, -1.25 * U);
      petal.rotation.z = angle + Math.PI / 2;
      // Slight inward convergence toward exhaust exit
      const qTilt = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0),
        0.10
      );
      petal.quaternion.premultiply(qTilt);
      petal.castShadow = true;
      engineGroup.add(petal);
    }

    // Iconic Metallic Copper-Gold Exhaust Trim Ring (outer lip)
    const goldRingOuter = new THREE.Mesh(
      new THREE.TorusGeometry(1.26 * U, 0.16 * U, 12, 28),
      mats.gold
    );
    goldRingOuter.position.z = -2.42 * U;
    goldRingOuter.castShadow = true;
    engineGroup.add(goldRingOuter);

    // Secondary Metallic Gold inner ring collar
    const goldRingInner = new THREE.Mesh(
      new THREE.TorusGeometry(1.06 * U, 0.09 * U, 10, 24),
      mats.gold
    );
    goldRingInner.position.z = -2.05 * U;
    engineGroup.add(goldRingInner);

    // Deep dark nozzle bore & turbine fan hub
    const boreGeo = new THREE.CylinderGeometry(1.18 * U, 1.05 * U, 2.2 * U, 18, 1, true);
    boreGeo.rotateX(Math.PI / 2);
    const bore = new THREE.Mesh(
      boreGeo,
      new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.7, side: THREE.BackSide })
    );
    bore.position.z = -1.3 * U;
    engineGroup.add(bore);

    // Turbine flameholder ring + spinner cone inside
    const turbineCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.42 * U, 0.9 * U, 10).rotateX(-Math.PI / 2),
      mats.gunmetal
    );
    turbineCore.position.z = -1.0 * U;
    engineGroup.add(turbineCore);

    // Subtle ember/glow disc inside exhaust throat
    const throatGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff7722,
      transparent: true,
      opacity: 0.0,
    });
    const throatGlow = new THREE.Mesh(new THREE.CircleGeometry(1.05 * U, 20), throatGlowMat);
    throatGlow.position.z = -1.75 * U;
    throatGlow.rotation.y = Math.PI;
    engineGroup.add(throatGlow);

    // Volumetric Afterburner Exhaust Plume (layered outer blue-violet + inner hot orange-white core!)
    const plumeGroup = new THREE.Group();
    plumeGroup.position.z = -2.35 * U;
    plumeGroup.visible = false;

    const outerFlameGeo = new THREE.ConeGeometry(1.08 * U, 7.6 * U, 18, 1, true);
    outerFlameGeo.rotateX(-Math.PI / 2);
    outerFlameGeo.translate(0, 0, -3.8 * U);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x3b8eff,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    plumeGroup.add(outerFlame);

    const midFlameGeo = new THREE.ConeGeometry(0.76 * U, 5.4 * U, 16, 1, true);
    midFlameGeo.rotateX(-Math.PI / 2);
    midFlameGeo.translate(0, 0, -2.7 * U);
    const midFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff8c2b,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const midFlame = new THREE.Mesh(midFlameGeo, midFlameMat);
    plumeGroup.add(midFlame);

    const coreFlameGeo = new THREE.ConeGeometry(0.42 * U, 3.2 * U, 14);
    coreFlameGeo.rotateX(-Math.PI / 2);
    coreFlameGeo.translate(0, 0, -1.6 * U);
    const coreFlameMat = new THREE.MeshBasicMaterial({
      color: 0xfff5d6,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreFlame = new THREE.Mesh(coreFlameGeo, coreFlameMat);
    plumeGroup.add(coreFlame);

    // Shock diamonds inside the jet plume!
    for (let d = 0; d < 3; d++) {
      const diamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.36 * U * (1 - d * 0.18), 0),
        new THREE.MeshBasicMaterial({
          color: 0xd8f0ff,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      diamond.scale.set(1, 1, 2.1);
      diamond.position.z = -(1.5 + d * 1.55) * U;
      plumeGroup.add(diamond);
    }

    const exhaustLight = new THREE.PointLight(0xff7b29, 0, 14);
    exhaustLight.position.z = -3.2 * U;
    plumeGroup.add(exhaustLight);

    engineGroup.add(plumeGroup);
    afterburners.push({ plumeGroup, throatGlowMat, exhaustLight, outerFlame, midFlame });
    tagAtomicBlock(engineGroup, 'Mesin Jet', `Nozzle Mesin ${s > 0 ? 'Kiri' : 'Kanan'}`, '#d49642', 'Emas', 'engine', '1×');
    step15.add(engineGroup);

    // Swept Horizontal Stabilizers (Elevators / Tailplanes) flanking the twin nozzles
    const elevPivot = new THREE.Group();
    elevPivot.position.set(s * 4.5 * U, 3.4 * P, -14.8 * U);

    const mirrorPts = (pts) => (s === 1 ? pts : pts.map(([x, z]) => [-x, z]).reverse());
    const tailBasePoly = mirrorPts([
      [0.0, 2.4],
      [7.6, -1.2],
      [7.6, -3.5],
      [0.0, -3.9],
    ]);
    place(elevPivot, makeWedgePlate(tailBasePoly, 1, mats.darkGray, { studs: true, studInset: 0.45 }), 0, -0.5, 0);

    const tailTopPoly = mirrorPts([
      [0.2, 1.5],
      [6.2, -1.4],
      [6.2, -3.2],
      [0.2, -3.3],
    ]);
    place(elevPivot, makeWedgePlate(tailTopPoly, 0.8, mats.lightGray, { studs: false }), 0, 0.5, 0);

    // Red tailplane tip marker
    place(elevPivot, makeTile(0.7, 1.4, mats.red, 0.9), s * 7.2, 0.2, -2.4);

    step15.add(elevPivot);
    elevators.push({ pivot: elevPivot, side: s });
  }

  root.add(step15);
  registerPart(step15, 15, new THREE.Vector3(0, 0, -4.5));

  // Step 16: twin canted vertical stabilizers
  const step16 = new THREE.Group();

  for (const s of [-1, 1]) {
    const finGroup = new THREE.Group();
    // Anchor on top of twin rear engine nacelles, canted outward ~15.5 deg like F-22/F-77 Lancer!
    finGroup.position.set(s * 3.85 * U, 6.6 * P, -13.6 * U);
    finGroup.rotation.z = -s * 0.27; // flares outward!

    // Main swept vertical stabilizer polygon in (Z, Y) plane, extruded along thickness (X)
    const finShape = new THREE.Shape();
    // Local coordinates: x -> along Z (+forward, -aft), y -> UP
    finShape.moveTo(4.0 * U, 0);          // leading edge root
    finShape.lineTo(-3.4 * U, 0);         // trailing edge root
    finShape.lineTo(-4.8 * U, 8.6 * U);   // trailing edge tip
    finShape.lineTo(-1.2 * U, 9.2 * U);   // leading edge tip
    finShape.closePath();

    const finThick = 0.62 * U;
    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: finThick,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    // Orient shape so shape-X maps to +Z, shape-Y maps to +Y, thickness centered on X
    finGeo.translate(0, 0, -finThick / 2);
    finGeo.rotateY(-Math.PI / 2);

    const finMesh = new THREE.Mesh(finGeo, mats.darkGray);
    finMesh.castShadow = true;
    finMesh.receiveShadow = true;
    finGroup.add(finMesh);

    // Light-gray beveled leading edge LEGO slope strip!
    const leLen = Math.hypot(5.2 * U, 9.2 * U);
    const leStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.46 * U, leLen, 0.72 * U),
      mats.lightGray
    );
    leStrip.position.set(0, 4.55 * U, 1.48 * U);
    leStrip.rotation.x = -0.51;
    leStrip.castShadow = true;
    finGroup.add(leStrip);

    // LEGO stepped brick base fairing on fin root (with studs!)
    place(finGroup, makeBrick(1.3, 6.2, 1.5, mats.lightGray), 0, 0, 0.2);

    // Iconic BRIGHT RED Horizontal Stripe flush with the top slant of the vertical stabilizer!
    const topSlopeAngle = -Math.atan2(0.6, 3.6); // exact match to tip slope (z=-1.2,y=9.2) -> (z=-4.8,y=8.6)
    const redStripeGeo = new THREE.BoxGeometry(finThick + 0.07, 0.62 * U, 3.85 * U);
    const redStripe = new THREE.Mesh(redStripeGeo, mats.red);
    redStripe.position.set(0, 8.22 * U, -2.85 * U);
    redStripe.rotation.x = topSlopeAngle;
    redStripe.castShadow = true;
    finGroup.add(redStripe);

    // Dark gray top cap fairing seamlessly flush above the red stripe (exact match to "Ekor Ganda" inset!)
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(finThick + 0.05, 0.44 * U, 3.72 * U),
      mats.darkGray
    );
    topCap.position.set(0, 8.76 * U, -2.96 * U);
    topCap.rotation.x = topSlopeAngle;
    topCap.castShadow = true;
    finGroup.add(topCap);

    // Crisp White Winged-Eagle Emblem Decal on BOTH faces (outer & inner)
    for (const faceSide of [-1, 1]) {
      const emblem = new THREE.Mesh(
        new THREE.PlaneGeometry(3.55 * U, 3.55 * U),
        mats.tailEmblem
      );
      emblem.position.set(faceSide * (finThick / 2 + 0.04), 4.25 * U, -1.65 * U);
      emblem.rotation.y = faceSide > 0 ? Math.PI / 2 : -Math.PI / 2;
      finGroup.add(emblem);
    }

    // Articulated Rudder Trailing Edge
    const rudderPivot = new THREE.Group();
    rudderPivot.position.set(0, 4.1 * U, -4.15 * U);
    rudderPivot.rotation.x = -0.16;
    const rudderMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.36 * U, 6.8 * U, 0.95 * U),
      mats.charcoal
    );
    rudderMesh.position.set(0, 0, -0.45 * U);
    rudderMesh.castShadow = true;
    rudderPivot.add(rudderMesh);
    finGroup.add(rudderPivot);
    rudders.push({ pivot: rudderPivot, side: s });
    tagAtomicBlock(finGroup, 'Ekor Vertikal', `Sirip Ekor ${s > 0 ? 'Kiri' : 'Kanan'}`, '#d42626', 'Abu + Merah', 'tail', '1×');

    step16.add(finGroup);
  }

  root.add(step16);
  registerPart(step16, 16, new THREE.Vector3(0, 4.6, -2.8));

  // Step 19: final tactical details and antennas
  const step19 = new THREE.Group();

  // Dorsal spine IFF blade antennas
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.12 * U, 1.15 * U, 0.75 * U), mats.charcoal);
  blade1.position.set(0, 9.6 * P, 0.6 * U);
  blade1.rotation.x = -0.35;
  blade1.castShadow = true;
  tagAtomicBlock(blade1, 'Antena', 'Antena IFF Depan', '#2c3036', 'Arang', 'antenna', '1×1');
  step19.add(blade1);

  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.10 * U, 0.75 * U, 0.55 * U), mats.darkGray);
  blade2.position.set(0, 9.2 * P, -6.4 * U);
  blade2.rotation.x = -0.35;
  tagAtomicBlock(blade2, 'Antena', 'Antena IFF Belakang', '#4b5158', 'Abu Gelap', 'antenna', '1×1');
  step19.add(blade2);

  // Dorsal red anti-collision strobe beacon!
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24 * U, 0.28 * U, 0.22 * U, 12),
    mats.transRed
  );
  beacon.position.set(0, 9.2 * P, -3.0 * U);
  tagAtomicBlock(beacon, 'Lampu', 'Lampu Suar Merah', '#ff2222', 'Merah Trans', 'beacon', '1×1');
  step19.add(beacon);

  // Forward IRST / Electro-optical sensor ball ahead of windshield
  const irst = new THREE.Mesh(new THREE.SphereGeometry(0.26 * U, 12, 10), mats.black);
  irst.position.set(0.55 * U, 6.4 * P, 11.4 * U);
  tagAtomicBlock(irst, 'Sensor', 'Sensor IRST Depan', '#1a1d21', 'Hitam', 'sensor', '1×1');
  step19.add(irst);

  // Final light-gray & dark-gray finishing tiles + ventilation grilles near tail roots
  for (const s of [-1, 1]) {
    place(step19, makeGrilleTile(1, 2, mats.charcoal, 'x'), s * 3.8, 6.6, -8.4);
    place(step19, makeTile(1, 2, mats.lightGray, 0.8), s * 1.4, 7.2, -12.6);
    // Tiny rear tail-root formation light strips (amber)
    place(step19, makeTile(0.4, 1.2, mats.transAmber, 0.4), s * 4.5, 5.2, -13.2);
  }

  root.add(step19);
  registerPart(step19, 19, new THREE.Vector3(0, 3.2, 0.2));

  return { root, afterburners, elevators, rudders, beacon };
}
