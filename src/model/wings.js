import * as THREE from 'three';
import {
  U, P, makeBrick, makeTile, makeGrilleTile,
  makeSlope, makeWedgePlate, place, tagAtomicBlock,
} from '../lego/bricks.js';

/**
 * Builds the Left & Right Swept Delta/Trapezoidal LEGO Wings
 * Matches Steps 11–14 of "LEGO Pesawat Tempur F-77 Lancer.png":
 *  - Step 11: Left wing core (inti sayap kiri, +X port)
 *  - Step 12: Right wing core (inti sayap kanan, -X starboard)
 *  - Step 13: Wing mounting plates & leading edge armor (memasang kedua sayap)
 *  - Step 14: Upper wing detailing, red tactical stripes, studs, tiles & hinged ailerons
 */
export function buildWings(mats, registerPart) {
  const root = new THREE.Group();
  root.name = 'WingsRoot';
  const ailerons = [];

  for (const side of [1, -1]) {
    // side = +1 is Port (Left, Step 11), side = -1 is Starboard (Right, Step 12)
    const mirrorPts = (pts) => (side === 1 ? pts : pts.map(([x, z]) => [-x, z]).reverse());

    // Step 11 (left) and Step 12 (right): core wing base
    const wingCore = new THREE.Group();

    // Main swept trapezoidal dark-gray structural under-plate (root x=4.2..18.6)
    const basePoly = mirrorPts([
      [4.2, 3.8],
      [18.6, -4.4],
      [18.6, -8.6],
      [4.2, -9.8],
    ]);
    place(wingCore, makeWedgePlate(basePoly, 1, mats.darkGray, { studs: false }), 0, 2.5, 0);

    // Mid-layer light-gray wing core with authentic LEGO studs!
    const midPoly = mirrorPts([
      [4.4, 3.0],
      [17.8, -4.8],
      [17.8, -8.3],
      [4.4, -9.2],
    ]);
    place(wingCore, makeWedgePlate(midPoly, 1, mats.lightGray, { studs: true, studInset: 0.45 }), 0, 3.5, 0);

    // Underside structural reinforcing ribs (gives thick realistic brick-built wing feel)
    place(wingCore, makeBrick(8, 3, 1, mats.charcoal, { studs: false }), side * 8.4, 1.6, -4.5);
    place(wingCore, makeBrick(6, 2, 1, mats.darkGray, { studs: false }), side * 12.6, 1.8, -6.2);

    root.add(wingCore);
    registerPart(wingCore, side === 1 ? 11 : 12, new THREE.Vector3(side * 4.2, 0, -0.4));

    // Step 13: wing leading edge and tactical layering
    const wingMount = new THREE.Group();

    // Stepped LEGO dark-gray tactical camo wedge on inner/mid wing top
    const innerDarkWedge = mirrorPts([
      [4.6, 1.8],
      [12.4, -2.8],
      [12.4, -7.8],
      [4.6, -8.6],
    ]);
    place(wingMount, makeWedgePlate(innerDarkWedge, 1, mats.darkGray, { studs: true, studInset: 0.48 }), 0, 4.5, 0);

    // Light-gray beveled top armor panel overlapping center of wing
    const centerLightWedge = mirrorPts([
      [5.4, 0.2],
      [15.6, -5.2],
      [15.6, -7.6],
      [5.4, -7.8],
    ]);
    place(wingMount, makeWedgePlate(centerLightWedge, 0.8, mats.lightGray, { studs: false }), 0, 5.4, 0);

    // Sleek Swept LEGO Leading Edge Armor Tiles aligned flush with the exact wing sweep!
    // Leading edge vector from (4.2, 3.8) to (18.6, -4.4): dx = 14.4, dz = -8.2 -> sweep = 0.518 rad
    const sweepAngle = Math.atan2(8.2, 14.4);
    const leSteps = 7;
    for (let i = 0; i < leSteps; i++) {
      const t = (i + 0.5) / leSteps;
      const xU = 4.6 + t * 13.6;
      const zU = 3.55 - t * 7.75;
      const isDark = i % 2 === 0;
      const sl = makeSlope(2.15, 1.35, 1.15, isDark ? mats.darkGray : mats.lightGray, {
        flatRatio: 0.3,
        topStuds: i % 2 === 1,
      });
      // Rotate slope so its sloped front (+Z) faces perpendicular-outward along the swept leading edge
      place(wingMount, sl, side * xU, 3.5, zU, 0, side * sweepAngle, 0);
    }

    root.add(wingMount);
    registerPart(wingMount, 13, new THREE.Vector3(side * 2.8, 1.0, -0.3));

    // Step 14: upper wing detailing, red stripes, and hinged ailerons
    const wingDetail = new THREE.Group();

    // Iconic RED diagonal/spanwise tactical stripe running parallel to wing sweep (exact F-77 look!)
    const redStripe1 = makeTile(5.6, 0.72, mats.red, 0.55);
    place(wingDetail, redStripe1, side * 9.8, 6.0, -3.3, 0, side * sweepAngle, 0);

    // Secondary smaller red inboard accent tile
    const redStripe2 = makeTile(2.2, 0.65, mats.red, 0.55);
    place(wingDetail, redStripe2, side * 14.2, 5.4, -5.8, 0, side * sweepAngle, 0);

    // Wingtip red warning block & navigation light!
    place(wingDetail, makeBrick(1.4, 2.2, 1, mats.darkGray), side * 17.8, 4.4, -6.6);
    place(wingDetail, makeTile(1.0, 1.6, mats.red, 0.8), side * 17.8, 5.4, -6.5);
    // Wingtip missile rail / static discharger fairing
    place(wingDetail, makeTile(0.6, 4.8, mats.charcoal, 1.2), side * 18.8, 3.0, -6.6);
    // Tiny translucent nav light at wingtip leading edge (Red on Port +X, Green on Starboard -X)
    const navLight = makeTile(0.45, 0.7, side === 1 ? mats.transRed : mats.transGreen, 0.9);
    place(wingDetail, navLight, side * 18.9, 3.4, -4.5);

    // Smooth LEGO tiles & dark grille vents on upper wing surface for rich texture contrast
    place(wingDetail, makeGrilleTile(2, 1, mats.charcoal, 'x'), side * 6.5, 6.1, -4.8);
    place(wingDetail, makeGrilleTile(2, 1, mats.charcoal, 'x'), side * 6.5, 6.1, -6.2);
    place(wingDetail, makeTile(2, 1, mats.darkGray, 0.6), side * 9.8, 6.1, -4.2, 0, side * 0.45, 0);
    place(wingDetail, makeTile(2, 1, mats.lightGray, 0.6), side * 14.5, 5.4, -6.4, 0, side * 0.45, 0);

    // Articulated Trailing-Edge Aileron / Flap (pivots smoothly during Flight Demo!)
    const aileronPivot = new THREE.Group();
    aileronPivot.position.set(side * 11.4 * U, 3.3 * P, -8.8 * U);
    const aileronPanel = makeTile(10.2, 1.35, mats.darkGray, 0.9);
    aileronPanel.position.set(0, -0.4 * P, -0.65 * U);
    aileronPivot.add(aileronPanel);
    // Red trailing edge trim tab
    const trimTab = makeTile(1.8, 0.5, mats.red, 0.95);
    trimTab.position.set(side * 3.2 * U, -0.38 * P, -0.85 * U);
    aileronPivot.add(trimTab);
    tagAtomicBlock(aileronPivot, 'Flap', `Aileron ${side > 0 ? 'Kiri' : 'Kanan'}`, '#4b5158', 'Abu Gelap', 'aileron', '1×10');
    wingDetail.add(aileronPivot);
    ailerons.push({ pivot: aileronPivot, side });

    root.add(wingDetail);
    registerPart(wingDetail, 14, new THREE.Vector3(side * 3.4, 1.8, -0.6));
  }

  return { root, ailerons };
}
