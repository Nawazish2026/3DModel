import * as THREE from 'three';

export type MaterialFactory = (
  color: number,
  metalness?: number,
  roughness?: number,
  emissive?: number,
  emissiveIntensity?: number,
  transparent?: boolean,
  opacity?: number
) => THREE.MeshStandardMaterial;

// -------------------------------------------------------------
// 1. NLP & Semantic Token Analysis
// -------------------------------------------------------------
export interface SemanticProfile {
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  metalness: number;
  roughness: number;
  isGlowing: boolean;
  isGlass: boolean;
  isFaceted: boolean;
  archetype: 'vessel' | 'organic' | 'mechanical' | 'weapon' | 'furniture' | 'monument' | 'sculpture';
  seed: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

const COLOR_DICTIONARY: Record<string, number> = {
  gold: 0xf59e0b,
  golden: 0xf59e0b,
  yellow: 0xeab308,
  red: 0xef4444,
  crimson: 0x991b1b,
  ruby: 0xe11d48,
  blue: 0x3b82f6,
  cyan: 0x06b6d4,
  neon: 0x06b6d4,
  green: 0x10b981,
  emerald: 0x059669,
  purple: 0xa855f7,
  violet: 0x8b5cf6,
  pink: 0xec4899,
  orange: 0xf97316,
  black: 0x0f172a,
  obsidian: 0x090d16,
  dark: 0x1e293b,
  white: 0xf8fafc,
  silver: 0xe2e8f0,
  chrome: 0xd1d5db,
  bronze: 0x78350f,
  wood: 0x78350f,
  brown: 0x5a2e0a,
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function parsePromptSemantics(prompt: string): SemanticProfile {
  const lower = prompt.toLowerCase();
  const seed = hashString(prompt);

  // Derive Color Palette
  let primaryColor: number | null = null;
  let accentColor: number | null = null;

  for (const [name, hex] of Object.entries(COLOR_DICTIONARY)) {
    if (lower.includes(name)) {
      if (primaryColor === null) {
        primaryColor = hex;
      } else if (accentColor === null && primaryColor !== hex) {
        accentColor = hex;
      }
    }
  }

  // Harmonic color palette fallbacks
  const harmonicPalettes = [
    [0x38bdf8, 0x818cf8, 0x06b6d4], // Cyan - Violet - Sky
    [0xf59e0b, 0xd97706, 0xef4444], // Gold - Amber - Flame
    [0x10b981, 0x059669, 0x34d399], // Emerald - Jade - Mint
    [0xa855f7, 0xec4899, 0x6366f1], // Magenta - Neon - Indigo
    [0xe2e8f0, 0x94a3b8, 0x38bdf8], // Titanium - Steel - Ice
  ];

  const defaultPalette = harmonicPalettes[seed % harmonicPalettes.length];
  primaryColor = primaryColor ?? defaultPalette[0];
  accentColor = accentColor ?? defaultPalette[1];
  const secondaryColor = defaultPalette[2];

  // Derive Material Physics
  const isGlowing = lower.includes('glow') || lower.includes('neon') || lower.includes('laser') || lower.includes('cyber') || lower.includes('energy') || lower.includes('crystal');
  const isGlass = lower.includes('glass') || lower.includes('crystal') || lower.includes('flask') || lower.includes('potion') || lower.includes('ice') || lower.includes('water');
  const isMetal = lower.includes('metal') || lower.includes('steel') || lower.includes('titanium') || lower.includes('armor') || lower.includes('gold') || lower.includes('silver') || lower.includes('mech');
  const isFaceted = lower.includes('faceted') || lower.includes('low poly') || lower.includes('gem') || lower.includes('polygon');

  // Archetype Classification
  let archetype: SemanticProfile['archetype'] = 'sculpture';

  if (
    lower.includes('sword') || lower.includes('blade') || lower.includes('dagger') || lower.includes('axe') ||
    lower.includes('shield') || lower.includes('spear') || lower.includes('weapon') || lower.includes('hammer') ||
    lower.includes('staff') || lower.includes('wand')
  ) {
    archetype = 'weapon';
  } else if (
    lower.includes('cup') || lower.includes('vase') || lower.includes('mug') || lower.includes('bowl') ||
    lower.includes('bottle') || lower.includes('pot') || lower.includes('flask') || lower.includes('urn') ||
    lower.includes('apple') || lower.includes('fruit') || lower.includes('chalice') || lower.includes('stein')
  ) {
    archetype = 'vessel';
  } else if (
    lower.includes('car') || lower.includes('ship') || lower.includes('space') || lower.includes('plane') ||
    lower.includes('jet') || lower.includes('robot') || lower.includes('mech') || lower.includes('drone') ||
    lower.includes('vehicle') || lower.includes('tank') || lower.includes('racer') || lower.includes('hover')
  ) {
    archetype = 'mechanical';
  } else if (
    lower.includes('chair') || lower.includes('table') || lower.includes('desk') || lower.includes('throne') ||
    lower.includes('stool') || lower.includes('sofa') || lower.includes('couch') || lower.includes('bench')
  ) {
    archetype = 'furniture';
  } else if (
    lower.includes('monolith') || lower.includes('tower') || lower.includes('building') || lower.includes('castle') ||
    lower.includes('temple') || lower.includes('monument') || lower.includes('pyramid') || lower.includes('spire') ||
    lower.includes('obelisk')
  ) {
    archetype = 'monument';
  } else if (
    lower.includes('jellyfish') || lower.includes('creature') || lower.includes('alien') || lower.includes('dragon') ||
    lower.includes('monster') || lower.includes('bird') || lower.includes('fish') || lower.includes('spider') ||
    lower.includes('insect') || lower.includes('tree') || lower.includes('flower') || lower.includes('plant') ||
    lower.includes('organic') || lower.includes('skull')
  ) {
    archetype = 'organic';
  }

  // Dimension Ratios from seed
  const scaleX = 0.8 + ((seed & 0xff) / 255) * 0.4;
  const scaleY = 0.8 + (((seed >> 8) & 0xff) / 255) * 0.5;
  const scaleZ = 0.8 + (((seed >> 16) & 0xff) / 255) * 0.4;

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    metalness: isMetal ? 0.85 : 0.25,
    roughness: isMetal ? 0.2 : (isGlass ? 0.1 : 0.45),
    isGlowing,
    isGlass,
    isFaceted,
    archetype,
    seed,
    scaleX,
    scaleY,
    scaleZ,
  };
}

// -------------------------------------------------------------
// 2. Main Generative Model Synthesizer
// -------------------------------------------------------------
export function generateProceduralModel(prompt: string): THREE.Group {
  const group = new THREE.Group();
  const semantics = parsePromptSemantics(prompt);

  const createMaterial: MaterialFactory = (
    color: number,
    metalness = semantics.metalness,
    roughness = semantics.roughness,
    emissive = 0x000000,
    emissiveIntensity = 0.0,
    transparent = semantics.isGlass,
    opacity = semantics.isGlass ? 0.65 : 1.0
  ) => {
    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive,
      emissiveIntensity,
      transparent,
      opacity,
      flatShading: semantics.isFaceted,
    });
  };

  switch (semantics.archetype) {
    case 'vessel':
      generateDynamicVessel(group, createMaterial, semantics, prompt);
      break;
    case 'organic':
      generateDynamicOrganic(group, createMaterial, semantics, prompt);
      break;
    case 'mechanical':
      generateDynamicMechanical(group, createMaterial, semantics, prompt);
      break;
    case 'weapon':
      generateDynamicWeapon(group, createMaterial, semantics, prompt);
      break;
    case 'furniture':
      generateDynamicFurniture(group, createMaterial, semantics, prompt);
      break;
    case 'monument':
      generateDynamicMonument(group, createMaterial, semantics, prompt);
      break;
    case 'sculpture':
    default:
      generateHarmonicArtifact(group, createMaterial, semantics);
      break;
  }

  // Compute normals and cast shadows across all generated child geometries
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
    }
  });

  return group;
}

// -------------------------------------------------------------
// Archetype 1: Generative Vessels, Cups, Flasks & Organic Fruits
// -------------------------------------------------------------
function generateDynamicVessel(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile,
  prompt: string
) {
  const isAppleOrFruit = prompt.toLowerCase().includes('apple') || prompt.toLowerCase().includes('fruit');
  const mainMat = matFn(sem.primaryColor, sem.metalness, sem.roughness);
  const accentMat = matFn(
    sem.accentColor,
    0.8,
    0.2,
    sem.isGlowing ? sem.accentColor : 0x000000,
    sem.isGlowing ? 2.5 : 0.0
  );

  const points: THREE.Vector2[] = [];
  const segments = 18;
  const height = isAppleOrFruit ? 2.2 : 3.0;

  // Generate dynamic lathe profile based on prompt seed
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    let radius = 0;

    if (isAppleOrFruit) {
      radius = Math.sin(t * Math.PI) * 1.3 * (1 - 0.2 * Math.cos(t * Math.PI * 2));
    } else {
      // Dynamic pottery lathe curve equation
      const baseR = 0.5 + ((sem.seed % 5) * 0.08);
      const waistR = 0.3 + (((sem.seed >> 2) % 4) * 0.1);
      const bellyR = 1.0 + (((sem.seed >> 4) % 6) * 0.12);
      const neckR = 0.4 + (((sem.seed >> 6) % 3) * 0.08);
      const lipR = 0.6 + (((sem.seed >> 8) % 3) * 0.08);

      if (t < 0.2) radius = THREE.MathUtils.lerp(baseR, bellyR, t / 0.2);
      else if (t < 0.6) radius = THREE.MathUtils.lerp(bellyR, waistR, (t - 0.2) / 0.4);
      else if (t < 0.85) radius = THREE.MathUtils.lerp(waistR, neckR, (t - 0.6) / 0.25);
      else radius = THREE.MathUtils.lerp(neckR, lipR, (t - 0.85) / 0.15);
    }

    points.push(new THREE.Vector2(Math.max(0.01, radius), y));
  }

  const radialSegments = sem.isFaceted ? 12 : 36;
  const latheGeo = new THREE.LatheGeometry(points, radialSegments);
  const vesselMesh = new THREE.Mesh(latheGeo, mainMat);
  group.add(vesselMesh);

  // If fruit, add stem and leaf
  if (isAppleOrFruit) {
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.7, 8);
    const stem = new THREE.Mesh(stemGeo, matFn(0x451a03, 0.1, 0.8));
    stem.position.set(0, height + 0.25, 0);
    stem.rotation.z = 0.2;

    const leafGeo = new THREE.SphereGeometry(0.3, 8, 8);
    leafGeo.scale(1.4, 0.2, 0.6);
    const leaf = new THREE.Mesh(leafGeo, matFn(0x10b981, 0.2, 0.6));
    leaf.position.set(0.2, height + 0.4, 0);
    leaf.rotation.z = 0.4;

    group.add(stem, leaf);
  } else {
    // Decorative Rim & Core Gem/Fluid
    const rimGeo = new THREE.TorusGeometry(points[points.length - 1].x, 0.06, 12, 32);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = height;
    group.add(rim);

    // Floating internal elixir core
    const coreGeo = new THREE.OctahedronGeometry(0.4, 0);
    const core = new THREE.Mesh(coreGeo, accentMat);
    core.position.y = height * 0.45;
    group.add(core);
  }
}

// -------------------------------------------------------------
// Archetype 2: Organic Creatures, Jellyfish, Alien Fauna & Botanics
// -------------------------------------------------------------
function generateDynamicOrganic(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile,
  prompt: string
) {
  const isJellyfish = prompt.toLowerCase().includes('jellyfish');
  const bodyMat = matFn(sem.primaryColor, 0.1, 0.2, sem.accentColor, sem.isGlowing ? 1.5 : 0.2, true, 0.7);
  const coreMat = matFn(sem.accentColor, 0.3, 0.1, sem.accentColor, sem.isGlowing ? 3.0 : 1.0);

  // 1. Central Bell / Head Dome
  const domeGeo = new THREE.SphereGeometry(1.6, sem.isFaceted ? 12 : 28, sem.isFaceted ? 8 : 20, 0, Math.PI * 2, 0, Math.PI * 0.65);
  domeGeo.scale(1.0, 0.85, 1.0);
  const dome = new THREE.Mesh(domeGeo, bodyMat);
  dome.position.y = 2.4;
  group.add(dome);

  // 2. Luminous Central Organ
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), coreMat);
  core.position.y = 2.2;
  group.add(core);

  // 3. Trailing Generative Tentacles / Petals / Horns
  const armCount = isJellyfish ? 8 : 6;
  for (let i = 0; i < armCount; i++) {
    const angle = (i / armCount) * Math.PI * 2;
    const curvePoints: THREE.Vector3[] = [];
    const length = 2.6;

    for (let step = 0; step < 6; step++) {
      const t = step / 5;
      const x = Math.cos(angle) * (1.1 - t * 0.5) + Math.sin(t * 4 + i) * 0.25;
      const z = Math.sin(angle) * (1.1 - t * 0.5) + Math.cos(t * 4 + i) * 0.25;
      const y = 2.0 - t * length;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.06 * (1 - (i % 2) * 0.3), 8, false);
    const tentacle = new THREE.Mesh(tubeGeo, coreMat);
    group.add(tentacle);
  }
}

// -------------------------------------------------------------
// Archetype 3: Mechanical, Vehicles, Robots & Sci-Fi Drones
// -------------------------------------------------------------
function generateDynamicMechanical(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile,
  _prompt: string
) {
  const hullMat = matFn(sem.primaryColor, 0.8, 0.25);
  const frameMat = matFn(sem.secondaryColor, 0.9, 0.15);
  const glowMat = matFn(sem.accentColor, 0.3, 0.1, sem.accentColor, 3.0);

  // Main Hull Fuselage
  const hullGeo = new THREE.BoxGeometry(2.2 * sem.scaleX, 0.6 * sem.scaleY, 3.8 * sem.scaleZ);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.8;
  group.add(hull);

  // Cockpit / Sensor Array
  const cockpitGeo = new THREE.CylinderGeometry(0.7, 0.9, 1.8, 16);
  cockpitGeo.scale(0.9, 0.5, 1.4);
  const cockpit = new THREE.Mesh(cockpitGeo, matFn(0x38bdf8, 0.1, 0.1, 0x0284c7, 0.5, true, 0.6));
  cockpit.rotation.x = Math.PI / 2;
  cockpit.position.set(0, 1.25, 0.2);
  group.add(cockpit);

  // Aerodynamic Wings / Flaps
  [-1.4, 1.4].forEach((xSide) => {
    const wingGeo = new THREE.BoxGeometry(1.6, 0.08, 1.8);
    const wing = new THREE.Mesh(wingGeo, frameMat);
    wing.position.set(xSide, 0.8, -0.4);
    wing.rotation.z = xSide > 0 ? -0.1 : 0.1;
    group.add(wing);

    // Twin Thrusters
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.8, 16), frameMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(xSide * 0.7, 0.8, -2.0);

    const jetFlame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 16), glowMat);
    jetFlame.rotation.x = -Math.PI / 2;
    jetFlame.position.set(xSide * 0.7, 0.8, -2.8);
    group.add(thruster, jetFlame);
  });
}

// -------------------------------------------------------------
// Archetype 4: Weapons, Blades, Shields & Tools
// -------------------------------------------------------------
function generateDynamicWeapon(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile,
  prompt: string
) {
  const isShield = prompt.toLowerCase().includes('shield');
  const metalMat = matFn(sem.primaryColor, 0.95, 0.15);
  const gripMat = matFn(sem.secondaryColor, 0.3, 0.7);
  const glowMat = matFn(sem.accentColor, 0.2, 0.1, sem.accentColor, 2.5);

  if (isShield) {
    const shieldGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.12, sem.isFaceted ? 6 : 32);
    const shield = new THREE.Mesh(shieldGeo, metalMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.y = 1.8;

    const core = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 16, 32), glowMat);
    core.position.set(0, 1.8, 0.1);
    group.add(shield, core);
  } else {
    // Blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.22, 0.3);
    bladeShape.lineTo(0.16, 3.6);
    bladeShape.lineTo(0, 4.3);
    bladeShape.lineTo(-0.16, 3.6);
    bladeShape.lineTo(-0.22, 0.3);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    bladeGeo.center();
    const blade = new THREE.Mesh(bladeGeo, metalMat);
    blade.position.y = 2.4;

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.3), metalMat);
    crossguard.position.y = 0.4;

    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 16), gripMat);
    grip.position.y = -0.3;

    const pommel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), glowMat);
    pommel.position.y = -0.95;

    group.add(blade, crossguard, grip, pommel);
  }
}

// -------------------------------------------------------------
// Archetype 5: Furniture (Chairs, Desks, Thrones)
// -------------------------------------------------------------
function generateDynamicFurniture(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile,
  prompt: string
) {
  const isTable = prompt.toLowerCase().includes('table') || prompt.toLowerCase().includes('desk');
  const primaryMat = matFn(sem.primaryColor, sem.metalness, sem.roughness);
  const frameMat = matFn(sem.secondaryColor, 0.85, 0.2);

  if (isTable) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.0), primaryMat);
    top.position.y = 1.6;
    group.add(top);

    [[-1.6, -0.8], [1.6, -0.8], [-1.6, 0.8], [1.6, 0.8]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), frameMat);
      leg.position.set(x, 0.8, z);
      group.add(leg);
    });
  } else {
    // Chair
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 1.6), primaryMat);
    seat.position.y = 1.0;

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 0.18), primaryMat);
    backrest.position.set(0, 1.9, -0.7);

    group.add(seat, backrest);

    [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.0, 12), frameMat);
      leg.position.set(x, 0.5, z);
      group.add(leg);
    });
  }
}

// -------------------------------------------------------------
// Archetype 6: Architectural Monuments, Towers & Spires
// -------------------------------------------------------------
function generateDynamicMonument(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile,
  _prompt: string
) {
  const stoneMat = matFn(sem.primaryColor, 0.3, 0.7);
  const accentMat = matFn(sem.accentColor, 0.8, 0.2, sem.accentColor, sem.isGlowing ? 2.5 : 0.5);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.6, sem.isFaceted ? 6 : 24), stoneMat);
  base.position.y = 0.3;

  const spireGeo = new THREE.ConeGeometry(0.9, 4.8, sem.isFaceted ? 4 : 16);
  const spire = new THREE.Mesh(spireGeo, stoneMat);
  spire.position.y = 3.0;

  const floatingRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.1, 12, 32), accentMat);
  floatingRing.rotation.x = Math.PI / 2;
  floatingRing.position.y = 3.2;

  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), accentMat);
  beacon.position.y = 5.6;

  group.add(base, spire, floatingRing, beacon);
}

// -------------------------------------------------------------
// Archetype 7: Dynamic Harmonic Mathematical Artifact (Default for Any Prompt)
// -------------------------------------------------------------
function generateHarmonicArtifact(
  group: THREE.Group,
  matFn: MaterialFactory,
  sem: SemanticProfile
) {
  const primaryMat = matFn(sem.primaryColor, sem.metalness, sem.roughness);
  const accentMat = matFn(sem.accentColor, 0.4, 0.2, sem.accentColor, sem.isGlowing ? 2.5 : 1.2);

  // Plinth Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.3, 32), matFn(0x0f172a, 0.4, 0.6));
  base.position.y = 0.15;
  group.add(base);

  // Dynamic Torus Knot driven by string hash
  const p = 2 + (sem.seed % 3);
  const q = 3 + ((sem.seed >> 2) % 4);
  const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.28, 128, 32, p, q);
  const knot = new THREE.Mesh(knotGeo, primaryMat);
  knot.position.y = 2.2;
  group.add(knot);

  // Floating Orbital Rings
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.05, 16, 64), accentMat);
  ring1.rotation.x = Math.PI / 3;
  ring1.rotation.y = (sem.seed % 90) * (Math.PI / 180);
  ring1.position.y = 2.2;

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.03, 16, 64), matFn(0xffffff, 0.9, 0.1));
  ring2.rotation.x = -Math.PI / 4;
  ring2.position.y = 2.2;

  // Floating Crystal Shards around the knot
  const shardCount = 4 + (sem.seed % 4);
  for (let i = 0; i < shardCount; i++) {
    const angle = (i / shardCount) * Math.PI * 2;
    const dist = 1.6 + ((i % 2) * 0.3);
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), accentMat);
    shard.position.set(Math.cos(angle) * dist, 2.2 + Math.sin(angle * 2) * 0.4, Math.sin(angle) * dist);
    group.add(shard);
  }

  group.add(ring1, ring2);
}
