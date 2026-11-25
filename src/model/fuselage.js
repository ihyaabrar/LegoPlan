import * as THREE from 'three';
import {
  U, P, makeBrick, makeTile, makeGrilleTile,
  makeSlope, makeCurvedSlope, makeWedgePlate, place, tagAtomicBlock,
} from '../lego/bricks.js';

/**
 * Builds the F-77 Lancer Fuselage, Nose Cone, Air Intakes, and Dorsal Spine
 * Mapped to Build Steps:
 *  - Step 1: Base frame (rangka dasar)
 *  - Step 2: Center structure (struktur tengah)
 *  - Step 3: Cockpit floor (lantai kokpit)
 *  - Step 4: Fuselage sides (sisi badan)
 *  - Step 5: Nose section & radome (hidung pesawat)
 *  - Step 6: Forward fuselage completion + F-77 decals (bagian depan)
 *  - Step 9: Dorsal spine & upper armor (detail badan atas)
 *  - Step 10: Side air intakes & LERX shoulders (inlet dan detail samping)
 */
export function buildFuselage(mats, registerPart) {
  const root = new THREE.Group();
  root.name = 'FuselageRoot';

  // Step 1: base ladder chassis
  const step1 = new THREE.Group();
  place(step1, makeBrick(4, 24, 1, mats.charcoal, { studs: false }), 0, 0, -2);
  place(step1, makeBrick(6, 18, 1, mats.darkGray, { studs: false }), 0, 1, -4);
  // Side longitudinal rails
  for (const s of [-1, 1]) {
    place(step1, makeBrick(1, 22, 1, mats.charcoal), s * 2.5, 1, -2);
    place(step1, makeBrick(2, 14, 1, mats.darkGray), s * 3.5, 1, -6);
  }
  // Forward chassis spine
  place(step1, makeBrick(3, 8, 1, mats.charcoal), 0, 1, 10.5);
  place(step1, makeBrick(2, 5, 1, mats.darkGray), 0, 1.5, 15.5);
  root.add(step1);
  registerPart(step1, 1, new THREE.Vector3(0, -1.8, 0));

  // Step 2: center structure and wing box
  const step2 = new THREE.Group();
  place(step2, makeBrick(8, 14, 1, mats.darkGray), 0, 2, -5.5);
  place(step2, makeBrick(10, 10, 1, mats.charcoal), 0, 2, -6.5);
  place(step2, makeBrick(6, 10, 2, mats.darkGray, { studs: false }), 0, 3, -7);
  // Central structural bulkheads
  place(step2, makeBrick(4, 2, 3, mats.charcoal), 0, 2, 1.5);
  place(step2, makeBrick(6, 2, 3, mats.charcoal), 0, 2, -13);
  // Belly inverted slopes for sleek underside contour
  for (const s of [-1, 1]) {
    const bellySlope = makeSlope(2, 10, 1.5, mats.darkGray, { inverted: true, flatRatio: 0.2 });
    place(step2, bellySlope, s * 2.4, -0.5, -4, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
  }
  root.add(step2);
  registerPart(step2, 2, new THREE.Vector3(0, -0.8, 0));

  // Step 3: cockpit floor and tub base
  const step3 = new THREE.Group();
  place(step3, makeBrick(4, 10, 1, mats.darkGray), 0, 2, 6.8);
  place(step3, makeTile(3, 7, mats.charcoal, 1), 0, 3, 6.5);
  place(step3, makeBrick(4, 2, 2, mats.darkGray), 0, 3, 11.2);
  root.add(step3);
  registerPart(step3, 3, new THREE.Vector3(0, 0.3, 0.5));

  // Step 4: fuselage side walls
  const step4 = new THREE.Group();
  for (const s of [-1, 1]) {
    // Cockpit side walls
    place(step4, makeBrick(1, 9, 3, mats.darkGray), s * 2.0, 3, 6.5);
    place(step4, makeTile(1, 4, mats.lightGray, 1), s * 2.0, 6, 4.5);
    place(step4, makeTile(1, 4, mats.darkGray, 1), s * 2.0, 6, 8.8);

    // Mid-rear engine nacelle sidewalls
    place(step4, makeBrick(2, 16, 3, mats.darkGray), s * 3.8, 3, -7.5);
    place(step4, makeBrick(1, 14, 2, mats.lightGray), s * 4.5, 4, -7.0);
    // Side red trim strip along lower mid fuselage
    place(step4, makeTile(0.6, 2, mats.red, 1), s * 4.85, 3.2, -0.5);
  }
  root.add(step4);
  registerPart(step4, 4, new THREE.Vector3(0, 0.4, 0));

  // Step 5: sculpted LEGO nose cone and pitot tube
  const step5 = new THREE.Group();

  // Multi-faceted LEGO tapered radome cone (z = 16.2 to 22.0)
  // Built from stepped octagonal/faceted LEGO cone segments so it matches the dark gray radome in the image!
  const radomeLen = 5.4 * U;
  const radomeGeo = new THREE.ConeGeometry(1.42 * U, radomeLen, 8);
  radomeGeo.rotateX(Math.PI / 2);
  radomeGeo.rotateZ(Math.PI / 8); // flat top/sides like LEGO faceted nose cone
  radomeGeo.scale(1.06, 0.78, 1.0); // fighter jet sleek elliptical radome cross-section
  const radomeMesh = new THREE.Mesh(radomeGeo, mats.darkGray);
  radomeMesh.position.set(0, 3.6 * P, 19.3 * U);
  radomeMesh.castShadow = true;
  radomeMesh.receiveShadow = true;
  tagAtomicBlock(radomeMesh, 'Kerucut', 'Radome Hidung', '#4b5158', 'Abu Gelap', 'nose', 'Cone');
  step5.add(radomeMesh);

  // LEGO seam ring separating radome from forward fuselage (matches dark groove in hero image)
  const collarGeo = new THREE.CylinderGeometry(1.42 * U, 1.54 * U, 0.7 * U, 8);
  collarGeo.rotateX(Math.PI / 2);
  collarGeo.rotateZ(Math.PI / 8);
  collarGeo.scale(1.06, 0.78, 1.0);
  const collarMesh = new THREE.Mesh(collarGeo, mats.lightGray);
  collarMesh.position.set(0, 3.6 * P, 16.3 * U);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  tagAtomicBlock(collarMesh, 'Cincin', 'Cincin Hidung', '#a4aab0', 'Abu Terang', 'ring', '1×');
  step5.add(collarMesh);

  // Subtle dark tip cap on radome + Silver Pitot Probe bundled cleanly as Nose Tip assembly
  const pitotGroup = new THREE.Group();
  const tipGeo = new THREE.ConeGeometry(0.45 * U, 1.4 * U, 8);
  tipGeo.rotateX(Math.PI / 2);
  const tipMesh = new THREE.Mesh(tipGeo, mats.charcoal);
  tipMesh.position.set(0, 3.6 * P, 21.8 * U);
  tipMesh.castShadow = true;
  pitotGroup.add(tipMesh);

  const pitotBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * U, 0.22 * U, 0.6 * U, 12).rotateX(Math.PI / 2),
    mats.gunmetal
  );
  pitotBase.position.set(0, 3.6 * P, 22.5 * U);
  pitotGroup.add(pitotBase);

  const pitotNeedle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03 * U, 0.09 * U, 1.8 * U, 10).rotateX(Math.PI / 2),
    mats.silver
  );
  pitotNeedle.position.set(0, 3.6 * P, 23.6 * U);
  pitotNeedle.castShadow = true;
  pitotGroup.add(pitotNeedle);
  tagAtomicBlock(pitotGroup, 'Antena', 'Jarum Pitot Perak', '#c8cdd4', 'Perak', 'pitot', '1×');
  step5.add(pitotGroup);

  // Lower nose chin slopes
  place(step5, makeSlope(2, 4, 2, mats.darkGray, { inverted: true, flatRatio: 0.2 }), 0, 1.2, 14.2);

  root.add(step5);
  registerPart(step5, 5, new THREE.Vector3(0, 0, 4.2));

  // Step 6: forward fuselage, nose slopes, and F-77 decals
  const step6 = new THREE.Group();

  // Core forward nose block (z = 11.0 to 16.2)
  place(step6, makeBrick(2.8, 5.2, 3.2, mats.darkGray, { studs: false }), 0, 1.9, 13.5);
  // Sleek stepped LEGO nose top slopes transitioning cleanly from collar (z=16.0) up to windshield (z=11.2)
  place(step6, makeSlope(2.4, 2.2, 1.4, mats.darkGray, { flatRatio: 0.35 }), 0, 4.9, 15.1);
  place(step6, makeCurvedSlope(2.5, 2.8, 1.7, mats.lightGray), 0, 5.0, 13.2);
  place(step6, makeBrick(2.6, 1.6, 1, mats.lightGray), 0, 5.3, 11.4); // crisp studs just ahead of canopy!
  place(step6, makeTile(1.4, 1.8, mats.darkGray, 0.8), 0, 6.2, 11.3);

  // Angled Nose Cheeks with iconic "F-77" white stencil decals & red caution triangles!
  for (const s of [-1, 1]) {
    // Angled side cheek wedge panel (flush, zero protruding shelf!)
    const cheekGroup = new THREE.Group();
    const cheekPlate = makeTile(0.55, 5.2, mats.darkGray, 3.3);
    cheekGroup.add(cheekPlate);

    // Flush light-gray beveled upper nose shoulder running along top of cheek
    const upperBevel = makeTile(0.58, 4.6, mats.lightGray, 1.0);
    upperBevel.position.set(-s * 0.14 * U, 3.25 * P, -0.15 * U);
    upperBevel.rotation.z = s * 0.38;
    cheekGroup.add(upperBevel);

    // "F-77" Sticker tile flush on outer face!
    const decalGeo = new THREE.PlaneGeometry(3.8 * U, 1.38 * U);
    const decalMesh = new THREE.Mesh(decalGeo, mats.f77Decal);
    decalMesh.position.set(s * (0.28 * U + 0.014), 1.65 * P, 0.05 * U);
    decalMesh.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    cheekGroup.add(decalMesh);

    // Position and taper cheek inward toward radome collar
    cheekGroup.position.set(s * 1.56 * U, 2.0 * P, 13.5 * U);
    cheekGroup.rotation.y = -s * 0.14;
    cheekGroup.rotation.z = s * 0.12;
    tagAtomicBlock(cheekGroup, 'Panel Stiker', `Panel F-77 ${s > 0 ? 'Kiri' : 'Kanan'}`, '#4b5158', 'Abu Gelap', 'f77', '1×5');
    step6.add(cheekGroup);

    // Red/White Warning Triangle tile clearly visible right behind F-77 & beside cockpit!
    const warnBlock = new THREE.Group();
    const baseTile = makeTile(0.65, 1.6, mats.darkGray, 2.9);
    warnBlock.add(baseTile);
    const triMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.18 * U, 1.18 * U), mats.cautionDecal);
    triMesh.position.set(s * (0.33 * U + 0.015), 1.5 * P, 0);
    triMesh.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    warnBlock.add(triMesh);
    warnBlock.position.set(s * 2.18 * U, 2.5 * P, 10.1 * U);
    warnBlock.rotation.y = -s * 0.10;
    tagAtomicBlock(warnBlock, 'Tile Stiker', 'Tile Segitiga Merah', '#d42626', 'Merah', 'warn', '1×2');
    step6.add(warnBlock);

    // Studded forward LERX ledge alongside cockpit
    place(step6, makeBrick(1, 4, 1, mats.lightGray), s * 2.5, 5.2, 7.2);
    place(step6, makeSlope(1, 2, 1.4, mats.lightGray, { topStuds: true }), s * 2.2, 5.0, 10.2);
  }

  root.add(step6);
  registerPart(step6, 6, new THREE.Vector3(0, 0.8, 2.8));

  // Step 9: dorsal spine and upper fuselage armor
  const step9 = new THREE.Group();

  // Raised center turtledeck behind canopy (z = -15.5 to +2.8)
  place(step9, makeBrick(4, 14, 2, mats.lightGray), 0, 5, -4.5);
  place(step9, makeBrick(3, 12, 1, mats.darkGray), 0, 7, -5.2);
  // Exposed studs & alternating light/dark tactical plates on dorsal spine
  place(step9, makeBrick(2, 4, 1, mats.lightGray), 0, 8, -0.5);
  place(step9, makeTile(2, 3, mats.darkGray, 1), 0, 8, -4.2);
  place(step9, makeBrick(2, 3, 1, mats.lightGray), 0, 8, -7.4);
  place(step9, makeSlope(2, 3, 1.6, mats.darkGray, { flatRatio: 0.3 }), 0, 7.4, -10.5, 0, Math.PI, 0);

  // Dark gray LEGO Grille Tiles (engine cooling vents on dorsal spine!)
  place(step9, makeGrilleTile(2, 1, mats.charcoal, 'x'), 0, 8, -2.1);
  place(step9, makeGrilleTile(2, 1, mats.charcoal, 'x'), 0, 8, -9.2);

  // Sloped armor flanking the dorsal spine on both sides
  for (const s of [-1, 1]) {
    // Sloped dorsal shoulder fairings
    const sideSlope1 = makeSlope(6, 2, 2, mats.lightGray, { flatRatio: 0.25 });
    place(step9, sideSlope1, s * 2.4, 6, -1.8, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0);

    const sideSlope2 = makeSlope(5, 2, 2, mats.darkGray, { flatRatio: 0.25 });
    place(step9, sideSlope2, s * 2.4, 6, -7.5, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0);

    // Engine nacelle upper decks with studs, tiles, and vents
    place(step9, makeBrick(2, 8, 1, mats.lightGray), s * 2.6, 6, -11.5);
    place(step9, makeGrilleTile(2, 1, mats.darkGray, 'x'), s * 2.6, 7, -9.5);
    place(step9, makeGrilleTile(2, 1, mats.darkGray, 'x'), s * 2.6, 7, -11.0);
    place(step9, makeTile(2, 3, mats.lightGray, 1), s * 2.6, 7, -13.5);
    // Tiny red avionics/service panel accent on dorsal deck
    place(step9, makeTile(1, 1, mats.red, 1), s * 2.2, 7.1, -6.2);
  }

  // Rear center tailboom wedge between twin nozzles
  place(step9, makeBrick(1.4, 5, 2, mats.darkGray, { studs: false }), 0, 4.5, -14.8);
  place(step9, makeSlope(1.4, 3, 2, mats.charcoal, { flatRatio: 0.2 }), 0, 4.5, -18.2, 0, Math.PI, 0);

  root.add(step9);
  registerPart(step9, 9, new THREE.Vector3(0, 2.6, -0.5));

  // Step 10: twin side air intakes and shoulder decks
  const step10 = new THREE.Group();

  for (const s of [-1, 1]) {
    const intake = new THREE.Group();

    // Boxy F-15/F-22 angular intake trunk (x = s * 3.8, z = 1.5..8.8)
    // Dark hollow intake throat + compressor fan as one atomic intake duct block
    const ductGroup = new THREE.Group();
    const throat = new THREE.Mesh(
      new THREE.BoxGeometry(2.1 * U, 2.9 * P, 2.2 * U),
      mats.black
    );
    throat.position.set(0, 2.3 * P, 7.4 * U);
    ductGroup.add(throat);

    const fan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75 * U, 0.75 * U, 0.2 * U, 12).rotateX(Math.PI / 2),
      mats.gunmetal
    );
    fan.position.set(0, 2.3 * P, 6.4 * U);
    ductGroup.add(fan);
    tagAtomicBlock(ductGroup, 'Inlet', `Lubang Intake ${s > 0 ? 'Kiri' : 'Kanan'}`, '#1a1d21', 'Hitam', 'intake', '2×2');
    intake.add(ductGroup);

    // Upper overhanging intake splitter lip (swept forward like F-15/F-22!)
    place(intake, makeBrick(2.6, 3.0, 1, mats.lightGray), 0, 4.2, 7.8);
    place(intake, makeSlope(2.4, 1.8, 1.2, mats.darkGray, { flatRatio: 0.3 }), 0, 4.4, 9.6);
    // Lower intake lip floor
    place(intake, makeTile(2.5, 2.4, mats.darkGray, 1), 0, 0.7, 7.2);

    // Outer intake armor wall
    place(intake, makeBrick(0.8, 6.5, 3.5, mats.darkGray, { studs: false }), s * 1.15, 1.0, 4.8);
    // Iconic BRIGHT RED vertical/diagonal intake lip accent (exact match to hero image!)
    const redLip = makeTile(0.45, 1.3, mats.red, 3.4);
    place(intake, redLip, s * 1.32, 1.0, 7.7, 0, 0, -s * 0.14);
    place(intake, makeTile(0.6, 1.6, mats.red, 1), s * 0.6, 0.65, 8.2);

    // Aft intake fairing blending into wing root (with studs & dark/light gray layering!)
    place(intake, makeBrick(2.6, 6.5, 3.5, mats.darkGray, { studs: false }), 0, 1.0, 3.2);
    place(intake, makeBrick(2.6, 5.5, 1, mats.lightGray), 0, 4.5, 3.8);
    place(intake, makeGrilleTile(2, 1, mats.charcoal, 'x'), 0, 5.5, 5.6);
    place(intake, makeTile(2, 2, mats.darkGray, 1), 0, 5.5, 3.5);
    place(intake, makeSlope(2.4, 2.2, 1.5, mats.lightGray, { topStuds: true }), 0, 4.5, 0.2, 0, Math.PI, 0);

    // Leading-edge root extension (LERX) triangular fillet merging intake into forward fuselage
    const lerxPts = s > 0
      ? [[-1.2, 1.5], [1.4, 1.5], [1.4, 8.2], [-1.2, 10.6]]
      : [[1.2, 1.5], [-1.4, 1.5], [-1.4, 8.2], [1.2, 10.6]];
    place(intake, makeWedgePlate(lerxPts, 1, mats.lightGray, { studs: true }), 0, 5.0, 0);

    intake.position.set(s * 3.55 * U, 0, 0);
    step10.add(intake);
  }

  root.add(step10);
  registerPart(step10, 10, new THREE.Vector3(0, 0.5, 1.2));

  return root;
}
