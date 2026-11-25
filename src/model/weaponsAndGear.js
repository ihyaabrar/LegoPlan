import * as THREE from 'three';
import { U, P, makeBrick, makeTile, place, tagAtomicBlock } from '../lego/bricks.js';

/**
 * Builds Full Armament ("Persenjataan Lengkap") & Retractable Landing Gear ("Roda Pendaratan")
 *  - Step 17: 6 underwing white/red LEGO air-to-air missiles on brick pylons + launch demo
 *  - Step 18: Tricycle retractable landing gear with chunky treaded LEGO rubber tires & silver hubs
 */
export function buildWeaponsAndGear(mats, registerPart, fuselageHeightUnits) {
  const root = new THREE.Group();
  root.name = 'WeaponsAndGearRoot';

  // Step 17: underwing pylons and 6 air-to-air missiles
  const weaponsGroup = new THREE.Group();
  const missiles = [];

  // 3 underwing stations per wing (6 total, matching the hero image & Persenjataan Lengkap inset!)
  const stations = [
    { x: 7.4,  z: -1.5, scale: 1.06 }, // Inboard medium-range missile
    { x: 10.8, z: -3.7, scale: 0.98 }, // Mid-wing missile
    { x: 14.2, z: -5.9, scale: 0.92 }, // Outboard short-range missile
  ];

  for (const side of [1, -1]) {
    stations.forEach((st, idx) => {
      const pylonGroup = new THREE.Group();
      pylonGroup.position.set(side * st.x * U, 2.4 * P, st.z * U);

      // Sturdy LEGO underwing pylon (dark gray upper mount + light gray adapter rail)
      place(pylonGroup, makeTile(0.85, 3.8, mats.darkGray, 2.2), 0, -2.2, 0);
      place(pylonGroup, makeTile(0.65, 4.4, mats.lightGray, 0.9), 0, -3.0, 0.1);

      // Detachable LEGO Air-to-Air Missile
      const missile = createLegoMissile(mats, st.scale);
      const restPos = new THREE.Vector3(0, -3.8 * P, 0.55 * U);
      missile.group.position.copy(restPos);
      tagAtomicBlock(missile.group, 'Rudal', `Rudal Udara #${idx + 1}`, '#d42626', 'Putih-Merah', 'missile', '1×');
      pylonGroup.add(missile.group);

      weaponsGroup.add(pylonGroup);
      missiles.push({
        group: missile.group,
        flame: missile.flame,
        restPos,
        order: idx * 2 + (side === 1 ? 0 : 1),
        launched: false,
        launchTime: 0,
      });
    });
  }

  root.add(weaponsGroup);
  registerPart(weaponsGroup, 17, new THREE.Vector3(0, -2.8, 0.6));

  // Step 18: retractable tricycle landing gear anchored to groundLocalY
  const gearGroup = new THREE.Group();
  const groundLocalY = -fuselageHeightUnits;

  // 1) Nose Landing Gear (Dual small chunky rubber tires + silver rims + oleo strut)
  const noseGearPivot = new THREE.Group();
  noseGearPivot.position.set(0, 0.6 * P, 11.4 * U);

  const noseWheelRadius = 0.64;
  const noseStrutLen = Math.abs(groundLocalY - noseGearPivot.position.y) - noseWheelRadius;

  // Main silver hydraulic oleo strut
  const noseStrutUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * U, 0.20 * U, noseStrutLen * 0.62, 12),
    mats.darkGray
  );
  noseStrutUpper.position.y = -noseStrutLen * 0.31;
  noseStrutUpper.castShadow = true;
  noseGearPivot.add(noseStrutUpper);

  const noseStrutLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * U, 0.13 * U, noseStrutLen * 0.52, 12),
    mats.silver
  );
  noseStrutLower.position.y = -noseStrutLen * 0.74;
  noseStrutLower.castShadow = true;
  noseGearPivot.add(noseStrutLower);

  // LEGO Technic scissor torque link & forward drag brace
  const dragBrace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * U, 0.08 * U, noseStrutLen * 0.75, 8),
    mats.charcoal
  );
  dragBrace.position.set(0, -noseStrutLen * 0.38, -0.45 * U);
  dragBrace.rotation.x = -0.35;
  noseGearPivot.add(dragBrace);

  // Axle fork + Twin Nose LEGO Tires!
  const noseAxle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09 * U, 0.09 * U, 1.12 * U, 10).rotateZ(Math.PI / 2),
    mats.silver
  );
  noseAxle.position.y = -noseStrutLen;
  noseGearPivot.add(noseAxle);

  for (const s of [-1, 1]) {
    const tire = createLegoWheel(mats, noseWheelRadius, 0.34);
    tire.position.set(s * 0.36 * U, -noseStrutLen, 0);
    noseGearPivot.add(tire);
  }
  tagAtomicBlock(noseGearPivot, 'Roda', 'Roda Pendaratan Depan', '#c8cdd4', 'Karet-Perak', 'wheel', '2×');
  gearGroup.add(noseGearPivot);

  // Nose landing gear bay doors
  const noseBayDoors = [];
  for (const s of [-1, 1]) {
    const doorPivot = new THREE.Group();
    doorPivot.position.set(s * 0.85 * U, 0.2 * P, 10.6 * U);
    const doorMesh = makeTile(0.75, 3.6, mats.darkGray, 0.6);
    doorMesh.position.set(-s * 0.38 * U, -0.3 * P, 0);
    doorPivot.add(doorMesh);
    gearGroup.add(doorPivot);
    noseBayDoors.push({ pivot: doorPivot, side: s });
  }

  // Main landing gear (port and starboard treaded rubber tires with 5-spoke rims)
  const mainGearPivots = [];
  const mainBayDoors = [];
  const mainWheelRadius = 0.94;

  for (const s of [-1, 1]) {
    const mainPivot = new THREE.Group();
    mainPivot.position.set(s * 4.4 * U, 1.1 * P, -3.8 * U);

    const strutLen = Math.abs(groundLocalY - mainPivot.position.y) - mainWheelRadius;

    // Upper sturdy LEGO brick housing
    const upperHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.55 * U, strutLen * 0.56, 0.65 * U),
      mats.darkGray
    );
    upperHousing.position.y = -strutLen * 0.28;
    upperHousing.castShadow = true;
    mainPivot.add(upperHousing);

    // Lower gleaming metallic silver hydraulic piston
    const lowerPiston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * U, 0.16 * U, strutLen * 0.55, 12),
      mats.silver
    );
    lowerPiston.position.y = -strutLen * 0.72;
    lowerPiston.castShadow = true;
    mainPivot.add(lowerPiston);

    // Diagonal structural side brace
    const sideBrace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09 * U, 0.09 * U, strutLen * 0.85, 8),
      mats.charcoal
    );
    sideBrace.position.set(-s * 0.45 * U, -strutLen * 0.4, 0);
    sideBrace.rotation.z = -s * 0.42;
    mainPivot.add(sideBrace);

    // Wheel axle hub + Chunky LEGO Rubber Tire (matches "Roda Pendaratan" inset!)
    const wheel = createLegoWheel(mats, mainWheelRadius, 0.58);
    wheel.position.set(s * 0.42 * U, -strutLen, 0);
    mainPivot.add(wheel);

    // Small wheel hub cap axle
    const axlePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * U, 0.11 * U, 0.9 * U, 10).rotateZ(Math.PI / 2),
      mats.silver
    );
    axlePin.position.set(s * 0.22 * U, -strutLen, 0);
    mainPivot.add(axlePin);

    tagAtomicBlock(mainPivot, 'Roda', `Roda Utama ${s > 0 ? 'Kiri' : 'Kanan'}`, '#c8cdd4', 'Karet-Perak', 'wheel', '1×');
    gearGroup.add(mainPivot);
    mainGearPivots.push({ pivot: mainPivot, side: s });

    // Main gear bay door
    const doorPivot = new THREE.Group();
    doorPivot.position.set(s * 5.2 * U, 0.8 * P, -3.8 * U);
    const door = makeTile(1.4, 3.6, mats.darkGray, 0.6);
    door.position.set(-s * 0.7 * U, -0.25 * P, 0);
    doorPivot.add(door);
    gearGroup.add(doorPivot);
    mainBayDoors.push({ pivot: doorPivot, side: s });
  }

  root.add(gearGroup);
  registerPart(gearGroup, 18, new THREE.Vector3(0, -3.8, 0));

  return {
    root,
    missiles,
    gear: { noseGearPivot, mainGearPivots, noseBayDoors, mainBayDoors },
  };
}

/**
 * Builds an authentic LEGO White & Red Air-to-Air Missile (exact match to image!)
 */
function createLegoMissile(mats, scale = 1.0) {
  const g = new THREE.Group();
  const bodyR = 0.26 * U * scale;
  const bodyLen = 4.6 * U * scale;

  // Main bright WHITE cylindrical LEGO body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyR, bodyR, bodyLen, 14).rotateX(Math.PI / 2),
    mats.white
  );
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Bright RED pointed warhead nose cone!
  const noseLen = 1.25 * U * scale;
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(bodyR, noseLen, 14).rotateX(Math.PI / 2),
    mats.red
  );
  nose.position.z = bodyLen / 2 + noseLen / 2;
  nose.castShadow = true;
  g.add(nose);

  // Red tactical stripe ring near rear + silver seeker collar
  const redBand = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyR * 1.03, bodyR * 1.03, 0.42 * U * scale, 14).rotateX(Math.PI / 2),
    mats.red
  );
  redBand.position.z = -bodyLen * 0.28;
  g.add(redBand);

  const darkRing = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyR * 1.04, bodyR * 1.04, 0.22 * U * scale, 14).rotateX(Math.PI / 2),
    mats.darkGray
  );
  darkRing.position.z = bodyLen * 0.34;
  g.add(darkRing);

  // Dark gray rocket nozzle at tail
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyR * 0.65, bodyR * 0.88, 0.38 * U * scale, 12).rotateX(Math.PI / 2),
    mats.charcoal
  );
  nozzle.position.z = -bodyLen / 2 - 0.16 * U * scale;
  g.add(nozzle);

  // 4 Cruciform Rear Fins + 4 Smaller Forward Canard Fins (Light Bluish Gray)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;

    const rearFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * U * scale, 0.62 * U * scale, 0.95 * U * scale),
      mats.lightGray
    );
    rearFin.position.set(
      Math.cos(angle) * (bodyR + 0.22 * U * scale),
      Math.sin(angle) * (bodyR + 0.22 * U * scale),
      -bodyLen * 0.38
    );
    rearFin.rotation.z = angle + Math.PI / 2;
    rearFin.castShadow = true;
    g.add(rearFin);

    const fwdFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.05 * U * scale, 0.38 * U * scale, 0.55 * U * scale),
      mats.darkGray
    );
    fwdFin.position.set(
      Math.cos(angle) * (bodyR + 0.14 * U * scale),
      Math.sin(angle) * (bodyR + 0.14 * U * scale),
      bodyLen * 0.18
    );
    fwdFin.rotation.z = angle + Math.PI / 2;
    g.add(fwdFin);
  }

  // Launch rocket exhaust flame (hidden until launched)
  const flameGeo = new THREE.ConeGeometry(0.24 * U * scale, 2.8 * U * scale, 10);
  flameGeo.rotateX(-Math.PI / 2);
  flameGeo.translate(0, 0, -1.4 * U * scale);
  const flame = new THREE.Mesh(
    flameGeo,
    new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  flame.position.z = -bodyLen / 2 - 0.28 * U * scale;
  flame.visible = false;
  g.add(flame);

  return { group: g, flame };
}

/**
 * Builds an authentic LEGO Rubber Tire with Tread Ribs + Metallic Silver 5-Spoke Rim!
 */
function createLegoWheel(mats, radius, width) {
  const g = new THREE.Group();

  // Outer rubber tire carcass
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, mats.rubber);
  tire.castShadow = true;
  tire.receiveShadow = true;
  g.add(tire);

  // Rounded tire shoulders (torus rings on both sidewalls)
  const shoulderR = radius * 0.85;
  const tubeR = radius * 0.16;
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(
      new THREE.TorusGeometry(shoulderR, tubeR, 8, 22).rotateY(Math.PI / 2),
      mats.rubber
    );
    wall.position.x = side * (width / 2 - tubeR * 0.45);
    g.add(wall);
  }

  // Subtle LEGO tread lugs around tire circumference
  const lugCount = 16;
  for (let i = 0; i < lugCount; i++) {
    const a = (i / lugCount) * Math.PI * 2;
    const lug = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.86, 0.045, radius * 0.14),
      mats.rubber
    );
    lug.position.set(0, Math.cos(a) * radius, Math.sin(a) * radius);
    lug.rotation.x = -a;
    g.add(lug);
  }

  // Gleaming Metallic Silver LEGO Wheel Rim & 5 Spokes!
  const rimR = radius * 0.56;
  const rimCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(rimR, rimR, width + 0.03, 18).rotateZ(Math.PI / 2),
    mats.silver
  );
  g.add(rimCylinder);

  // Dark inner recess inside rim + 5 silver spokes
  const innerRecess = new THREE.Mesh(
    new THREE.CylinderGeometry(rimR * 0.78, rimR * 0.78, width + 0.05, 16).rotateZ(Math.PI / 2),
    mats.charcoal
  );
  g.add(innerRecess);

  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.08, rimR * 1.48, rimR * 0.22),
      mats.silver
    );
    spoke.rotation.x = a;
    g.add(spoke);
  }

  // Center silver hub bolt
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(rimR * 0.28, rimR * 0.28, width + 0.10, 12).rotateZ(Math.PI / 2),
    mats.silver
  );
  g.add(hub);

  return g;
}
