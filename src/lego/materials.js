import * as THREE from 'three';

/**
 * Authentic LEGO ABS Plastic & Technical Materials for F-77 Lancer
 * Colors carefully sampled from "LEGO Pesawat Tempur F-77 Lancer.png"
 */

export const COLORS = {
  lightGray: 0xa4aab0,     // LEGO Light Bluish Gray
  midGray: 0x7e858d,       // Subtle mid-tone plate variation
  darkGray: 0x4b5158,      // LEGO Dark Bluish Gray
  charcoal: 0x2c3036,      // Deep Dark Gray / Chassis
  black: 0x1a1d21,         // LEGO Black
  red: 0xd42626,           // LEGO Bright Red accents
  darkRed: 0x9e1b1b,       // Recessed red trim
  white: 0xf0f2f5,         // LEGO White (missiles)
  gold: 0xd49642,          // Metallic Warm Gold / Copper engine rings
  silver: 0xc8cdd4,        // Metallic Silver (rims, struts, pitot)
  gunmetal: 0x3a3f46,      // Pearl Dark Gray (engine nozzles)
  canopyTint: 0x6b4e31,    // Trans-Brown / Smoke tinted cockpit glass
  transRed: 0xff2222,      // Nav light / indicator
  transGreen: 0x22dd66,    // Nav light / HUD
  transCyan: 0x38d9ff,     // MFD glow
};

function makeLegoPlastic(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: opts.roughness ?? 0.28,
    metalness: opts.metalness ?? 0.04,
    clearcoat: opts.clearcoat ?? 0.35,
    clearcoatRoughness: opts.clearcoatRoughness ?? 0.22,
    reflectivity: 0.65,
    ...opts,
  });
}

function makeMetallic(color, roughness = 0.28, metalness = 0.88) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

// High-resolution procedural LEGO sticker/print textures
function createF77DecalTexture(mirrored = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  // Dark Bluish Gray brick background
  ctx.fillStyle = '#4b5158';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle LEGO panel seam line
  ctx.strokeStyle = 'rgba(20, 22, 26, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.save();
  if (mirrored) {
    // Keep text readable on both port and starboard sides
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Crisp military stencil "F-77"
  ctx.fillStyle = '#f2f5f8';
  ctx.font = '900 italic 108px "Segoe UI", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F-77', canvas.width * 0.46, canvas.height * 0.54);

  // Small subtle technical underline bar
  ctx.fillStyle = '#d42626';
  ctx.fillRect(canvas.width * 0.14, canvas.height * 0.80, canvas.width * 0.16, 8);
  ctx.fillStyle = 'rgba(242, 245, 248, 0.7)';
  ctx.fillRect(canvas.width * 0.33, canvas.height * 0.80, canvas.width * 0.42, 5);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCautionTriangleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#4b5158';
  ctx.fillRect(0, 0, 256, 256);

  // White inverted triangle border
  ctx.beginPath();
  ctx.moveTo(46, 56);
  ctx.lineTo(210, 56);
  ctx.lineTo(128, 206);
  ctx.closePath();
  ctx.fillStyle = '#f0f2f5';
  ctx.fill();

  // Inner red triangle
  ctx.beginPath();
  ctx.moveTo(64, 68);
  ctx.lineTo(192, 68);
  ctx.lineTo(128, 184);
  ctx.closePath();
  ctx.fillStyle = '#d42626';
  ctx.fill();

  // Center tiny exclamation bar
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(121, 90, 14, 44);
  ctx.beginPath();
  ctx.arc(128, 150, 8, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createTailEmblemTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Transparent background so it sits cleanly on the dark gray tail fin
  ctx.clearRect(0, 0, 512, 512);

  // Stylized white winged-eagle / Lancer V-emblem matching the reference image
  ctx.save();
  ctx.translate(256, 260);
  ctx.fillStyle = '#f0f3f7';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 4;

  // Center spear / fuselage core
  ctx.beginPath();
  ctx.moveTo(0, -140);
  ctx.lineTo(18, -45);
  ctx.lineTo(10, 115);
  ctx.lineTo(0, 145);
  ctx.lineTo(-10, 115);
  ctx.lineTo(-18, -45);
  ctx.closePath();
  ctx.fill();

  // Symmetric sweeping wing feathers (3 layered blades per side)
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);

    // Upper long wing blade
    ctx.beginPath();
    ctx.moveTo(16, -28);
    ctx.lineTo(175, -140);
    ctx.lineTo(155, -82);
    ctx.lineTo(22, 6);
    ctx.closePath();
    ctx.fill();

    // Middle wing blade
    ctx.beginPath();
    ctx.moveTo(20, 16);
    ctx.lineTo(145, -58);
    ctx.lineTo(126, -12);
    ctx.lineTo(18, 46);
    ctx.closePath();
    ctx.fill();

    // Lower wing blade
    ctx.beginPath();
    ctx.moveTo(16, 54);
    ctx.lineTo(105, 8);
    ctx.lineTo(86, 48);
    ctx.lineTo(14, 82);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCockpitDashboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c2026';
  ctx.fillRect(0, 0, 512, 256);

  // Left Radar MFD
  ctx.fillStyle = '#0c2720';
  ctx.fillRect(28, 36, 130, 115);
  ctx.strokeStyle = '#2cf2a5';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 36, 130, 115);
  ctx.beginPath();
  ctx.arc(93, 94, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(93, 94);
  ctx.lineTo(126, 65);
  ctx.stroke();

  // Center Attitude Indicator
  ctx.fillStyle = '#122940';
  ctx.fillRect(190, 36, 132, 115);
  ctx.fillStyle = '#256fa8';
  ctx.fillRect(190, 36, 132, 57);
  ctx.fillStyle = '#5c4128';
  ctx.fillRect(190, 93, 132, 58);
  ctx.strokeStyle = '#38d9ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(190, 36, 132, 115);
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(212, 93);
  ctx.lineTo(300, 93);
  ctx.stroke();

  // Right Weapons Status MFD
  ctx.fillStyle = '#241818';
  ctx.fillRect(354, 36, 130, 115);
  ctx.strokeStyle = '#ff6b4a';
  ctx.lineWidth = 3;
  ctx.strokeRect(354, 36, 130, 115);
  ctx.fillStyle = '#ff4a4a';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(370 + i * 17, 74, 9, 44);
  }

  // Bottom indicator buttons
  const btnColors = ['#2cf2a5', '#ffbb33', '#ff3b3b', '#38d9ff', '#2cf2a5', '#ffbb33'];
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = btnColors[i % btnColors.length];
    ctx.fillRect(36 + i * 38, 184, 22, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMaterialPalette() {
  const lightGray = makeLegoPlastic(COLORS.lightGray);
  const midGray = makeLegoPlastic(COLORS.midGray);
  const darkGray = makeLegoPlastic(COLORS.darkGray);
  const charcoal = makeLegoPlastic(COLORS.charcoal, { roughness: 0.34 });
  const black = makeLegoPlastic(COLORS.black, { roughness: 0.3 });
  const red = makeLegoPlastic(COLORS.red, { roughness: 0.24, clearcoat: 0.45 });
  const darkRed = makeLegoPlastic(COLORS.darkRed, { roughness: 0.28 });
  const white = makeLegoPlastic(COLORS.white, { roughness: 0.24, clearcoat: 0.45 });

  const rubber = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.88,
    metalness: 0.02,
  });

  const gold = makeMetallic(COLORS.gold, 0.26, 0.88);
  const silver = makeMetallic(COLORS.silver, 0.24, 0.85);
  const gunmetal = makeMetallic(COLORS.gunmetal, 0.36, 0.72);

  // Authentic Trans-Brown / Tinted Smoke LEGO Polycarbonate Canopy
  const canopyGlass = new THREE.MeshPhysicalMaterial({
    color: COLORS.canopyTint,
    roughness: 0.06,
    metalness: 0.04,
    transmission: 0.78,
    transparent: true,
    opacity: 0.68,
    ior: 1.5,
    thickness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  });

  const hudGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38ffaa,
    emissive: 0x16a866,
    emissiveIntensity: 0.65,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });

  const transRed = new THREE.MeshPhysicalMaterial({
    color: COLORS.transRed,
    emissive: 0xaa1111,
    emissiveIntensity: 0.5,
    roughness: 0.12,
    transparent: true,
    opacity: 0.88,
  });

  const transGreen = new THREE.MeshPhysicalMaterial({
    color: COLORS.transGreen,
    emissive: 0x11aa44,
    emissiveIntensity: 0.5,
    roughness: 0.12,
    transparent: true,
    opacity: 0.88,
  });

  const transAmber = new THREE.MeshPhysicalMaterial({
    color: 0xffaa22,
    emissive: 0xcc7700,
    emissiveIntensity: 0.5,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
  });

  const f77Decal = new THREE.MeshPhysicalMaterial({
    map: createF77DecalTexture(false),
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.35,
  });

  const cautionDecal = new THREE.MeshPhysicalMaterial({
    map: createCautionTriangleTexture(),
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.35,
  });

  const tailEmblem = new THREE.MeshPhysicalMaterial({
    map: createTailEmblemTexture(),
    transparent: true,
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.3,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  const dashboard = new THREE.MeshStandardMaterial({
    map: createCockpitDashboardTexture(),
    emissiveMap: createCockpitDashboardTexture(),
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.38,
    roughness: 0.3,
  });

  return {
    lightGray,
    midGray,
    darkGray,
    charcoal,
    black,
    red,
    darkRed,
    white,
    rubber,
    gold,
    silver,
    gunmetal,
    canopyGlass,
    hudGlass,
    transRed,
    transGreen,
    transAmber,
    f77Decal,
    cautionDecal,
    tailEmblem,
    dashboard,
  };
}
