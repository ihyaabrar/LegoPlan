import * as THREE from 'three';

/**
 * Standard LEGO Brick Geometry & Subdivider Engine
 * - 1 stud pitch (U) = 0.8 units
 * - 1 plate height (P) = 0.32 units
 * - 1 brick height (H) = 3 * P = 0.96 units
 * - Merges brick body + all its studs into 1 single BufferGeometry per brick for locked 60 FPS
 *   even with 400–600 individual standard LEGO bricks!
 */

export const U = 0.8;
export const P = 0.32;
export const H = 0.96;
export const STUD_R = 0.24;
export const STUD_H = 0.16;
const GAP = 0.026; // Crisp visible LEGO micro-seam between standard bricks

// Prebuilt base geometries (non-indexed for ultra-fast merging)
const baseStudGeo = new THREE.CylinderGeometry(STUD_R, STUD_R * 1.02, STUD_H, 12).toNonIndexed();
const baseBoxGeo = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();

/** Fast lightweight geometry merger (position + normal) */
function mergeNonIndexed(geometries) {
  let totalVerts = 0;
  for (const g of geometries) {
    totalVerts += g.attributes.position.count;
  }
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);

  let offset = 0;
  for (const g of geometries) {
    const pos = g.attributes.position.array;
    const norm = g.attributes.normal.array;
    positions.set(pos, offset);
    normals.set(norm, offset);
    offset += pos.length;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}

/** Cache brick geometries by (sx, sz, plates, studs) so identical standard bricks share 1 GPU buffer! */
const brickGeoCache = new Map();

function getMergedBrickGeometry(sx, sz, plates, studs) {
  const key = `${sx.toFixed(2)}_${sz.toFixed(2)}_${plates.toFixed(2)}_${studs ? 1 : 0}`;
  const cached = brickGeoCache.get(key);
  if (cached) return cached;

  const w = Math.max(0.05, sx * U - GAP);
  const d = Math.max(0.05, sz * U - GAP);
  const h = Math.max(0.05, plates * P - 0.008);

  const parts = [];
  const body = baseBoxGeo.clone();
  body.scale(w, h, d);
  body.translate(0, h / 2, 0);
  parts.push(body);

  if (studs) {
    const countX = Math.max(1, Math.round(sx));
    const countZ = Math.max(1, Math.round(sz));
    const startX = -((countX - 1) * U) / 2;
    const startZ = -((countZ - 1) * U) / 2;
    for (let ix = 0; ix < countX; ix++) {
      for (let iz = 0; iz < countZ; iz++) {
        const st = baseStudGeo.clone();
        st.translate(startX + ix * U, h + STUD_H / 2 - 0.004, startZ + iz * U);
        parts.push(st);
      }
    }
  }

  const merged = mergeNonIndexed(parts);
  brickGeoCache.set(key, merged);
  return merged;
}

/** Derive human-readable Indonesian LEGO color info from a Three.js material */
export function getMatColorInfo(mat) {
  const hex = mat && mat.color ? '#' + mat.color.getHexString() : '#7e858d';
  const map = {
    '#a4aab0': 'Abu Terang',
    '#7e858d': 'Abu Sedang',
    '#4b5158': 'Abu Gelap',
    '#2c3036': 'Arang',
    '#1a1d21': 'Hitam',
    '#d42626': 'Merah',
    '#9e1b1b': 'Merah Tua',
    '#f0f2f5': 'Putih',
    '#d49642': 'Emas',
    '#c8cdd4': 'Perak',
    '#3a3f46': 'Gunmetal',
    '#6b4e31': 'Trans-Brown',
    '#ff2222': 'Merah Trans',
    '#22dd66': 'Hijau Trans',
    '#ffaa22': 'Kuning Trans',
  };
  return { hex, name: map[hex.toLowerCase()] || 'Abu LEGO' };
}

export function tagLegoBlock(obj, kind, label, mat, icon = 'brick', sizeText = '') {
  const c = getMatColorInfo(mat);
  obj.userData.legoBlock = {
    kind,
    label,
    sizeText,
    colorHex: c.hex,
    colorName: c.name,
    icon,
  };
  return obj;
}

export function tagAtomicBlock(obj, kind, label, colorHex, colorName, icon = 'brick', sizeText = '1×') {
  obj.userData.atomicBlock = {
    kind,
    label,
    sizeText,
    colorHex,
    colorName,
    icon,
  };
  return obj;
}

function fmtSize(n) {
  const rounded = Math.max(1, Math.round(n));
  return String(rounded);
}

function canonicalSize(sx, sz) {
  const a = Math.max(1, Math.round(Math.min(sx, sz)));
  const b = Math.max(1, Math.round(Math.max(sx, sz)));
  return `${a}×${b}`;
}

const STANDARD_LENGTHS = new Set([1, 2, 3, 4, 6]);

/**
 * Decomposes an integer length into standard LEGO stud lengths [6, 4, 3, 2, 1]
 * with optional stagger so adjacent rows interlock like real LEGO!
 */
function splitLengthStandard(len, stagger = false) {
  const n = Math.round(len);
  if (n <= 0) return [];
  const res = [];
  let rem = n;

  // Stagger first brick by 2 or 3 studs on alternate strips for authentic running-bond LEGO seams!
  if (stagger && rem >= 5) {
    res.push(3);
    rem -= 3;
  } else if (stagger && rem === 4) {
    res.push(2);
    rem -= 2;
  }

  const allowed = [6, 4, 3, 2, 1];
  while (rem > 0) {
    let pick = 1;
    for (const a of allowed) {
      if (a <= rem) {
        pick = a;
        break;
      }
    }
    res.push(pick);
    rem -= pick;
  }
  return res;
}

/**
 * Split width into standard LEGO widths [2, 1]
 */
function splitWidthStandard(w) {
  const n = Math.round(w);
  const res = [];
  let rem = n;
  while (rem >= 2) {
    res.push(2);
    rem -= 2;
  }
  if (rem === 1) res.push(1);
  return res;
}

/**
 * Create a single standard LEGO Brick / Plate / Tile (1 merged Mesh for maximum performance)
 */
export function makeSingleBrick(sx, sz, plates, mat, opts = {}) {
  const { studs = true } = opts;
  const geo = getMergedBrickGeometry(sx, sz, plates, studs);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const kind = !studs ? 'Tile' : plates >= 2 ? 'Brick' : 'Plate';
  const sizeText = canonicalSize(sx, sz);
  tagLegoBlock(mesh, kind, `${kind} ${sizeText}`, mat, !studs ? 'tile' : plates >= 2 ? 'brick' : 'plate', sizeText);
  return mesh;
}

/**
 * Create a LEGO Brick/Plate/Tile.
 * If (sx, sz) exceeds standard LEGO dimensions (>2 wide or >6 long), automatically subdivides
 * it into interlocking standard LEGO bricks (1x2, 1x4, 1x6, 2x2, 2x3, 2x4, 2x6)!!
 */
export function makeBrick(sx, sz, plates, mat, opts = {}) {
  const { studs = true, subdivide = true } = opts;

  const isIntX = Math.abs(sx - Math.round(sx)) < 0.05;
  const isIntZ = Math.abs(sz - Math.round(sz)) < 0.05;
  const minDim = Math.min(sx, sz);
  const maxDim = Math.max(sx, sz);

  // Already a true standard LEGO size (width 1-2, length in {1, 2, 3, 4, 6}, or narrow trim)
  if (
    !subdivide ||
    !isIntX ||
    !isIntZ ||
    (minDim <= 2 && STANDARD_LENGTHS.has(Math.round(maxDim)))
  ) {
    return makeSingleBrick(sx, sz, plates, mat, { studs });
  }

  // Subdivide into interlocking standard LEGO bricks!
  const container = new THREE.Group();
  const splitAlongZ = sz >= sx;

  if (splitAlongZ) {
    const widthsX = splitWidthStandard(sx);
    let curX = -sx / 2;
    widthsX.forEach((wx, colIdx) => {
      const lengthsZ = splitLengthStandard(sz, colIdx % 2 === 1);
      let curZ = -sz / 2;
      for (const lz of lengthsZ) {
        const piece = makeSingleBrick(wx, lz, plates, mat, { studs });
        piece.position.set((curX + wx / 2) * U, 0, (curZ + lz / 2) * U);
        container.add(piece);
        curZ += lz;
      }
      curX += wx;
    });
  } else {
    const widthsZ = splitWidthStandard(sz);
    let curZ = -sz / 2;
    widthsZ.forEach((wz, rowIdx) => {
      const lengthsX = splitLengthStandard(sx, rowIdx % 2 === 1);
      let curX = -sx / 2;
      for (const lx of lengthsX) {
        const piece = makeSingleBrick(lx, wz, plates, mat, { studs });
        piece.position.set((curX + lx / 2) * U, 0, (curZ + wz / 2) * U);
        container.add(piece);
        curX += lx;
      }
      curZ += wz;
    });
  }

  return container;
}

export function makeTile(sx, sz, mat, plates = 1, opts = {}) {
  return makeBrick(sx, sz, plates, mat, { studs: false, ...opts });
}

export function makeGrilleTile(sx, sz, mat, slatAxis = 'x') {
  const group = new THREE.Group();
  const w = sx * U - GAP;
  const d = sz * U - GAP;
  const h = P - 0.008;

  const base = new THREE.Mesh(baseBoxGeo, mat);
  base.scale.set(w, h * 0.42, d);
  base.position.y = h * 0.21;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const slatCount = slatAxis === 'x' ? Math.max(4, Math.round(sz * 3)) : Math.max(4, Math.round(sx * 3));
  for (let i = 0; i < slatCount; i++) {
    const t = (i + 0.5) / slatCount - 0.5;
    const slat = new THREE.Mesh(baseBoxGeo, mat);
    if (slatAxis === 'x') {
      slat.scale.set(w * 0.92, h * 0.65, (d / slatCount) * 0.48);
      slat.position.set(0, h * 0.68, t * d * 0.9);
    } else {
      slat.scale.set((w / slatCount) * 0.48, h * 0.65, d * 0.92);
      slat.position.set(t * w * 0.9, h * 0.68, 0);
    }
    slat.castShadow = true;
    slat.receiveShadow = true;
    group.add(slat);
  }

  const sizeText = canonicalSize(sx, sz);
  tagLegoBlock(group, 'Grille', `Grille ${sizeText}`, mat, 'grille', sizeText);
  return group;
}

export function makeSlope(sx, sz, plates, mat, opts = {}) {
  const {
    flatRatio = 0.28,
    frontLip = 0.22,
    topStuds = false,
    inverted = false,
  } = opts;

  // Subdivide wide slopes (e.g., 6x2 dorsal side slope) into standard 2x2 or 3x2 LEGO slopes!
  if (sx > 3.1 && Math.abs(sx - Math.round(sx)) < 0.05) {
    const container = new THREE.Group();
    const pieces = [];
    let rem = Math.round(sx);
    while (rem > 0) {
      const w = rem >= 3 && rem !== 4 ? 3 : rem >= 2 ? 2 : 1;
      pieces.push(w);
      rem -= w;
    }
    let curX = -sx / 2;
    for (const pw of pieces) {
      const sl = makeSlope(pw, sz, plates, mat, opts);
      sl.position.x = (curX + pw / 2) * U;
      container.add(sl);
      curX += pw;
    }
    return container;
  }

  const group = new THREE.Group();
  const w = sx * U - GAP;
  const d = sz * U - GAP;
  const h = plates * P - 0.008;

  const shape = new THREE.Shape();
  if (!inverted) {
    shape.moveTo(-d / 2, 0);
    shape.lineTo(d / 2, 0);
    shape.lineTo(d / 2, h * frontLip);
    shape.lineTo(-d / 2 + d * flatRatio, h);
    shape.lineTo(-d / 2, h);
    shape.closePath();
  } else {
    shape.moveTo(-d / 2, 0);
    shape.lineTo(-d / 2 + d * flatRatio, 0);
    shape.lineTo(d / 2, h * (1 - frontLip));
    shape.lineTo(d / 2, h);
    shape.lineTo(-d / 2, h);
    shape.closePath();
  }

  const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  extrudeGeo.translate(0, 0, -w / 2);
  extrudeGeo.rotateY(-Math.PI / 2);

  const mesh = new THREE.Mesh(extrudeGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (topStuds && !inverted) {
    const countX = Math.max(1, Math.round(sx));
    const startX = -((countX - 1) * U) / 2;
    for (let ix = 0; ix < countX; ix++) {
      const stud = new THREE.Mesh(baseStudGeo, mat);
      stud.position.set(startX + ix * U, h + STUD_H / 2 - 0.004, -d / 2 + U * 0.48);
      stud.castShadow = true;
      stud.receiveShadow = true;
      group.add(stud);
    }
  }

  const kind = inverted ? 'Slope Bawah' : 'Slope';
  const sizeText = canonicalSize(sx, sz);
  tagLegoBlock(group, kind, `${kind} ${sizeText}`, mat, 'slope', sizeText);
  return group;
}

export function makeCurvedSlope(sx, sz, plates, mat) {
  const group = new THREE.Group();
  const w = sx * U - GAP;
  const d = sz * U - GAP;
  const h = plates * P - 0.008;

  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(d / 2, h * 0.24);
  shape.quadraticCurveTo(d * 0.12, h * 0.96, -d / 2, h);
  shape.closePath();

  const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 12,
  });
  extrudeGeo.translate(0, 0, -w / 2);
  extrudeGeo.rotateY(-Math.PI / 2);

  const mesh = new THREE.Mesh(extrudeGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const sizeText = canonicalSize(sx, sz);
  tagLegoBlock(group, 'Slope Lengkung', `Slope Lengkung ${sizeText}`, mat, 'curved', sizeText);
  return group;
}

/**
 * Create a LEGO Wedge Plate!
 * If the wedge spans a large wing area (>5 studs wide), automatically slices it into
 * interlocking standard LEGO Wing Wedge Plates (3–4 stud spanwise segments) so every
 * wing section is built brick-by-brick while keeping the exact razor-sharp swept silhouette!
 */
export function makeWedgePlate(points2D, plates, mat, opts = {}) {
  const { studs = true, studInset = 0.42, subdivide = true } = opts;

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [px, pz] of points2D) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  }
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;

  // Subdivide wide wing wedge slabs along BOTH X (span) and Z (chord) into standard LEGO Wedge Plates!
  if (subdivide && (spanX > 4.6 || spanZ > 6.2)) {
    const container = new THREE.Group();
    const numX = spanX > 4.6 ? Math.max(2, Math.round(spanX / 3.4)) : 1;
    const numZ = spanZ > 6.2 ? Math.max(2, Math.round(spanZ / 4.8)) : 1;
    const sliceW = spanX / numX;
    const sliceD = spanZ / numZ;

    for (let ix = 0; ix < numX; ix++) {
      const x0 = minX + ix * sliceW + 0.02;
      const x1 = minX + (ix + 1) * sliceW - 0.02;
      const stripX = numX > 1 ? clipPolygonRange(points2D, 0, x0, x1) : points2D;
      if (stripX.length < 3) continue;

      for (let iz = 0; iz < numZ; iz++) {
        const z0 = minZ + iz * sliceD + 0.02;
        const z1 = minZ + (iz + 1) * sliceD - 0.02;
        const cell = numZ > 1 ? clipPolygonRange(stripX, 1, z0, z1) : stripX;
        if (cell.length >= 3 && polygonArea(cell) > 0.6) {
          const subWedge = makeSingleWedgePlate(cell, plates, mat, { studs, studInset });
          container.add(subWedge);
        }
      }
    }
    return container;
  }

  return makeSingleWedgePlate(points2D, plates, mat, { studs, studInset });
}

function makeSingleWedgePlate(points2D, plates, mat, opts = {}) {
  const { studs = true, studInset = 0.42 } = opts;
  const h = plates * P - 0.008;

  const shape = new THREE.Shape();
  points2D.forEach(([px, pz], idx) => {
    const x = px * U;
    const y = -pz * U;
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  extrudeGeo.rotateX(-Math.PI / 2);

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [px, pz] of points2D) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  }

  const baseGeo = extrudeGeo.index ? extrudeGeo.toNonIndexed() : extrudeGeo.clone();
  const parts = [baseGeo];
  extrudeGeo.dispose();

  if (studs) {
    const startX = Math.floor(minX) + 0.5;
    const startZ = Math.floor(minZ) + 0.5;
    for (let x = startX; x <= maxX; x += 1) {
      for (let z = startZ; z <= maxZ; z += 1) {
        if (pointInPolyWithMargin(x, z, points2D, studInset)) {
          const st = baseStudGeo.clone();
          st.translate(x * U, h + STUD_H / 2 - 0.004, z * U);
          parts.push(st);
        }
      }
    }
  }

  const merged = mergeNonIndexed(parts);
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const wEst = Math.max(2, Math.round(maxX - minX));
  const dEst = Math.max(2, Math.round(maxZ - minZ));
  const sizeText = `${Math.min(wEst, dEst)}×${Math.max(wEst, dEst)}`;
  const kind = studs ? 'Wedge Plate' : 'Wedge Tile';
  tagLegoBlock(mesh, kind, `${kind} ${sizeText}`, mat, 'wedge', sizeText);
  return mesh;
}

/** Sutherland-Hodgman polygon clip along axis (0 = X, 1 = Z) within [minVal, maxVal] */
function clipPolygonRange(poly, axis, minVal, maxVal) {
  const other = axis === 0 ? 1 : 0;
  const clipHalf = (pts, testFn, intersectFn) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const aIn = testFn(a);
      const bIn = testFn(b);
      if (aIn && bIn) {
        out.push(b);
      } else if (aIn && !bIn) {
        out.push(intersectFn(a, b));
      } else if (!aIn && bIn) {
        out.push(intersectFn(a, b));
        out.push(b);
      }
    }
    return out;
  };

  let res = clipHalf(
    poly,
    (p) => p[axis] >= minVal,
    (a, b) => {
      const t = (minVal - a[axis]) / (b[axis] - a[axis] + 1e-9);
      const pt = [0, 0];
      pt[axis] = minVal;
      pt[other] = a[other] + t * (b[other] - a[other]);
      return pt;
    }
  );
  res = clipHalf(
    res,
    (p) => p[axis] <= maxVal,
    (a, b) => {
      const t = (maxVal - a[axis]) / (b[axis] - a[axis] + 1e-9);
      const pt = [0, 0];
      pt[axis] = maxVal;
      pt[other] = a[other] + t * (b[other] - a[other]);
      return pt;
    }
  );
  return res;
}

function polygonArea(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) * 0.5;
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pointInPolyWithMargin(x, y, poly, margin) {
  if (!pointInPoly(x, y, poly)) return false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (distToSegment(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1]) < margin) {
      return false;
    }
  }
  return true;
}

export function place(parent, obj, xU = 0, yP = 0, zU = 0, rx = 0, ry = 0, rz = 0) {
  obj.position.set(xU * U, yP * P, zU * U);
  if (rx || ry || rz) obj.rotation.set(rx, ry, rz);
  parent.add(obj);
  return obj;
}
