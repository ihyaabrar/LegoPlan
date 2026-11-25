import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Camera Presets calibrated to the F-77 Lancer LEGO scale
 * "hero" matches the exact 3/4 front-left-top angle of the reference poster!
 */
export const CAMERA_PRESETS = {
  hero:    { pos: [25.5, 13.8, 26.5], target: [2.2, 3.2, -1.2] },
  top:     { pos: [0.0, 36.0, 1.5],   target: [0.0, 3.0, -1.0] },
  side:    { pos: [32.0, 6.2, 0.0],   target: [0.0, 3.8, -0.5] },
  front:   { pos: [0.0, 6.8, 32.0],   target: [0.0, 3.8, 0.0] },
  rear:    { pos: [-11.5, 8.2, -26.0], target: [0.0, 4.0, -6.0] },
  under:   { pos: [16.5, 1.4, 12.5],  target: [0.0, 2.8, 0.5] },

  // "Fitur Model" close-up inspection cameras
  cockpit: { pos: [7.8, 8.2, 11.2],   target: [0.0, 5.2, 5.2] },
  engines: { pos: [9.2, 5.8, -22.8],  target: [0.0, 4.2, -13.8] },
  weapons: { pos: [15.5, 2.6, 5.8],   target: [8.0, 2.5, -2.8] },
  gear:    { pos: [10.5, 2.2, 12.5],  target: [1.5, 1.5, 3.5] },
  tail:    { pos: [13.5, 10.5, -16.5], target: [0.0, 6.8, -11.5] },
};

export function createStudioScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef2f7);
  scene.fog = new THREE.Fog(0xeef2f7, 68, 150);

  const camera = new THREE.PerspectiveCamera(
    38,
    Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
    0.2,
    2600
  );
  camera.position.set(...CAMERA_PRESETS.hero.pos);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(
    container.clientWidth || window.innerWidth,
    container.clientHeight || window.innerHeight
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  // Crisp PBR studio reflections via PMREM RoomEnvironment (dispose temporary objects after baking)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose();
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.72;

  // 3-Point Studio Lighting Setup
  const hemiLight = new THREE.HemisphereLight(0xf8fbff, 0x8d99a8, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf2, 1.75);
  keyLight.position.set(18, 28, 22);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 4;
  keyLight.shadow.camera.far = 90;
  const d = 24;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.04;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xcbe2ff, 0.75);
  fillLight.position.set(-22, 14, -14);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.55);
  rimLight.position.set(0, 12, -26);
  scene.add(rimLight);

  // Studio Cyclorama Ground Floor (soft shadow catcher + subtle radial backdrop)
  const floorGeo = new THREE.CircleGeometry(90, 64);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xe9eef4,
    roughness: 0.78,
    metalness: 0.02,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Subtle Studio Turntable Ring under the jet
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x14365d,
    transparent: true,
    opacity: 0.12,
  });
  const turntableRing = new THREE.Mesh(
    new THREE.RingGeometry(18.6, 18.9, 96).rotateX(-Math.PI / 2),
    ringMat
  );
  turntableRing.position.y = 0.015;
  scene.add(turntableRing);

  // Faint Hangar Grid (shown subtly in Hangar mode)
  const gridHelper = new THREE.GridHelper(90, 45, 0x3a6a9c, 0x223348);
  gridHelper.position.y = 0.01;
  gridHelper.visible = false;
  scene.add(gridHelper);

  // Floating Sky Clouds (shown in Sky Flight mode)
  const cloudsGroup = createSkyClouds();
  cloudsGroup.visible = false;
  scene.add(cloudsGroup);

  // OrbitControls for 360-degree camera orbit, zoom, and pan
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.target.set(...CAMERA_PRESETS.hero.target);
  controls.minDistance = 8;
  controls.maxDistance = 72;
  controls.maxPolarAngle = Math.PI * 0.54; // allow slightly low dramatic angles without dipping below floor
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1.1;

  // Smooth Camera Transition Animator
  let camAnim = null;
  function animateCameraToCustom(posArr, targetArr) {
    camAnim = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...posArr),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(...targetArr),
      progress: 0,
    };
  }

  function animateCameraTo(presetKey) {
    const preset = CAMERA_PRESETS[presetKey];
    if (!preset) return;
    animateCameraToCustom(preset.pos, preset.target);
  }

  function snapCamera(posArr, targetArr) {
    camAnim = null;
    camera.position.set(...posArr);
    controls.target.set(...targetArr);
    controls.update();
  }

  // Cancel scripted camera fly-to if user starts dragging manually
  controls.addEventListener('start', () => {
    camAnim = null;
  });

  let lastStudioEnv = 'studio';

  function setFlightSimEnvironment(active) {
    if (active) {
      document.body.classList.remove('theme-dark');
      scene.background = new THREE.Color(0x7cc0f0);
      scene.fog = new THREE.Fog(0x9ad0f5, 380, 1550);
      floorMesh.visible = false;
      turntableRing.visible = false;
      gridHelper.visible = false;
      cloudsGroup.visible = false;
      hemiLight.intensity = 1.05;
      keyLight.intensity = 1.95;
      scene.environmentIntensity = 0.85;
      controls.maxDistance = 260;
      controls.maxPolarAngle = Math.PI * 0.49;
    } else {
      controls.maxDistance = 72;
      setEnvironment(lastStudioEnv);
    }
  }

  function setEnvironment(mode) {
    lastStudioEnv = mode;
    document.body.classList.toggle('theme-dark', mode === 'hangar');

    if (mode === 'studio') {
      scene.background = new THREE.Color(0xeef2f7);
      scene.fog = new THREE.Fog(0xeef2f7, 68, 150);
      floorMesh.visible = true;
      floorMat.color.setHex(0xe9eef4);
      floorMat.roughness = 0.78;
      turntableRing.visible = true;
      ringMat.color.setHex(0x14365d);
      ringMat.opacity = 0.12;
      gridHelper.visible = false;
      cloudsGroup.visible = false;
      hemiLight.intensity = 0.85;
      keyLight.intensity = 1.75;
      scene.environmentIntensity = 0.72;
      controls.maxPolarAngle = Math.PI * 0.54;
    } else if (mode === 'hangar') {
      scene.background = new THREE.Color(0x0d1520);
      scene.fog = new THREE.Fog(0x0d1520, 48, 120);
      floorMesh.visible = true;
      floorMat.color.setHex(0x121c29);
      floorMat.roughness = 0.38;
      turntableRing.visible = true;
      ringMat.color.setHex(0x4ea3ff);
      ringMat.opacity = 0.3;
      gridHelper.visible = true;
      cloudsGroup.visible = false;
      hemiLight.intensity = 0.45;
      keyLight.intensity = 2.0;
      scene.environmentIntensity = 0.55;
      controls.maxPolarAngle = Math.PI * 0.54;
    } else if (mode === 'sky') {
      scene.background = new THREE.Color(0x78b5e8);
      scene.fog = new THREE.Fog(0x9acaf0, 58, 180);
      floorMesh.visible = false;
      turntableRing.visible = false;
      gridHelper.visible = false;
      cloudsGroup.visible = true;
      hemiLight.intensity = 1.05;
      keyLight.intensity = 1.9;
      scene.environmentIntensity = 0.85;
      controls.maxPolarAngle = Math.PI * 0.92; // full underbelly view in sky!
    }
  }

  function update(dt) {
    if (camAnim) {
      camAnim.progress = Math.min(1, camAnim.progress + dt * 2.2);
      const t = 1 - Math.pow(1 - camAnim.progress, 3); // cubic ease-out
      camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, t);
      controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, t);
      if (camAnim.progress >= 1) camAnim = null;
    }

    if (cloudsGroup.visible) {
      for (const cloud of cloudsGroup.children) {
        cloud.position.z -= dt * 16;
        if (cloud.position.z < -85) {
          cloud.position.z = 85;
        }
      }
    }

    controls.update();
  }

  function onResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    if (w <= 0 || h <= 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    controls,
    animateCameraTo,
    animateCameraToCustom,
    snapCamera,
    setEnvironment,
    setFlightSimEnvironment,
    resize: onResize,
    update,
  };
}

function createSkyClouds() {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
  });

  const positions = [
    [-32, -14, -40], [34, -10, -20], [-24, -18, 25], [26, -15, 45],
    [-46, 12, -10], [45, 16, 15], [0, -22, -60], [12, -19, 10],
    [-16, -24, 65], [38, -20, -65],
  ];

  for (const [cx, cy, cz] of positions) {
    const puff = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(5 + i * 1.8, 2.2, 4 + (3 - i) * 1.4), cloudMat);
      m.position.set((i - 1.5) * 2.8, (i % 2) * 0.9, (i % 3 - 1) * 1.5);
      puff.add(m);
    }
    puff.position.set(cx, cy, cz);
    group.add(puff);
  }
  return group;
}
