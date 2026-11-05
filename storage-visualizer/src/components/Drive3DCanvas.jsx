import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Camera, Disc } from 'lucide-react';
import { playSeekTick, playReadPulse } from '../utils/soundEffects';

/**
 * Procedural Platter Texture Generator
 * Creates an authentic dark obsidian mirror-finish magnetic thin-film platter surface
 * with concentric optical micro-groove tracks, matching physical mechanical hard drives.
 */
function createPlatterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Obsidian mirror base
  ctx.fillStyle = '#101216';
  ctx.fillRect(0, 0, 1024, 1024);

  const cx = 512;
  const cy = 512;

  // Concentric magnetic recording tracks
  for (let r = 160; r < 505; r += 1.8) {
    const alpha = 0.08 + Math.sin(r * 0.45) * 0.05 + Math.random() * 0.03;
    ctx.strokeStyle = `rgba(215, 228, 245, ${alpha})`;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Inner hub clamping boundary ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(cx, cy, 160, 0, Math.PI * 2);
  ctx.stroke();

  // Outer disc rim boundary
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(cx, cy, 508, 0, Math.PI * 2);
  ctx.stroke();

  // Radial anisotropic light reflection gradient
  const grad = ctx.createRadialGradient(cx, cy, 120, cx, cy, 510);
  grad.addColorStop(0, 'rgba(45, 52, 65, 0.85)');
  grad.addColorStop(0.35, 'rgba(22, 25, 32, 0.7)');
  grad.addColorStop(0.7, 'rgba(16, 18, 22, 0.8)');
  grad.addColorStop(1, 'rgba(35, 40, 50, 0.95)');
  ctx.fillStyle = grad;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Preamp IC Chip Texture
 * Labeled SST 5018 / OS-26
 */
function createPreampChipTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 256, 256);

  // Pin 1 orientation index dot
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath();
  ctx.arc(32, 32, 9, 0, Math.PI * 2);
  ctx.fill();

  // Silkscreen text
  ctx.fillStyle = '#9c9ea6';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SST 5018', 128, 120);
  ctx.font = '19px monospace';
  ctx.fillText('OS/26 PREAMP', 128, 160);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Procedural Magnet Block Label Texture
 * Labeled "S H10" on brushed steel
 */
function createMagnetLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b6bec6';
  ctx.fillRect(0, 0, 256, 256);

  // Stamped text
  ctx.fillStyle = '#1c1c22';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('S H10', 128, 145);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function Drive3DCanvas({
  currentTrack = 53,
  minTrack = 0,
  maxTrack = 199,
  pendingRequests = [],
  servicedRequests = [],
  direction = 'right',
  isSeeking = false,
  stepDescription = '',
  onTrackClick,
}) {
  const mountRef = useRef(null);
  const [cameraView, setCameraView] = useState('isometric'); // 'isometric', 'top', 'closeup', 'side'
  const [rpm, setRpm] = useState(7200);
  const [isRotating, setIsRotating] = useState(true);

  // References for animation loop
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const armGroupRef = useRef(null);
  const platterMeshRef = useRef(null);
  const activeRingRef = useRef(null);
  const pendingRingsGroupRef = useRef(null);
  const servicedRingsGroupRef = useRef(null);
  const laserBeamRef = useRef(null);

  const currentTrackRef = useRef(currentTrack);
  const armAngleRef = useRef(0);
  const lastTrackSoundRef = useRef(currentTrack);

  // Exact physical geometry matching reference photo
  const SPINDLE_X = 0;
  const SPINDLE_Z = 1.35;
  const PLATTER_RADIUS_MAX = 2.75;
  const PLATTER_RADIUS_MIN = 1.05;

  const PIVOT_X = -0.25;
  const PIVOT_Z = -2.4;
  const ARM_LENGTH = 3.25;

  // Law of Cosines Kinematics:
  // Maps cylinder track (0..199) to exact radial arm angle
  const trackToAngle = (trk) => {
    const norm = Math.max(0, Math.min(1, (trk - minTrack) / (maxTrack - minTrack)));
    const targetR = PLATTER_RADIUS_MIN + norm * (PLATTER_RADIUS_MAX - PLATTER_RADIUS_MIN);

    // Distance between pivot and spindle
    const dx = SPINDLE_X - PIVOT_X;
    const dz = SPINDLE_Z - PIVOT_Z;
    const D = Math.sqrt(dx * dx + dz * dz);
    const L = ARM_LENGTH;

    // Law of cosines: targetR^2 = D^2 + L^2 - 2*D*L*cos(alpha)
    const cosAlpha = Math.max(-1, Math.min(1, (D * D + L * L - targetR * targetR) / (2 * D * L)));
    const alpha = Math.acos(cosAlpha);

    // Baseline vector from Pivot to Spindle in XZ plane
    const baseAngle = Math.atan2(dx, dz);
    // Subtracted angle sweeps head across the platter surface
    return baseAngle - alpha;
  };

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(4.8, 7.8, 6.2);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.48; // Prevent camera flipping below floor
    controls.minDistance = 3.5;
    controls.maxDistance = 18.0;
    controls.target.set(0, 0.2, 0.5);

    // 5. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x3a424f, 2.2);
    scene.add(ambientLight);

    // Key studio spotlight from top-left
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
    keyLight.position.set(-5, 11, -4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Cool metallic rim fill light from bottom-right
    const rimLight = new THREE.DirectionalLight(0x8cb6e0, 2.2);
    rimLight.position.set(6, 7, 7);
    scene.add(rimLight);

    // Focused Platter Specular Spotlight (for real magnetic reflection)
    const platterSpot = new THREE.SpotLight(0xffffff, 4.5, 20, Math.PI * 0.32, 0.6);
    platterSpot.position.set(0, 9, 1.35);
    platterSpot.target.position.set(0, 0.15, 1.35);
    scene.add(platterSpot);
    scene.add(platterSpot.target);

    // Technical Subsurface Grid
    const gridHelper = new THREE.GridHelper(18, 36, 0x1f2e42, 0x101724);
    gridHelper.position.y = -0.46;
    scene.add(gridHelper);

    // =========================================================================
    // PHYSICAL HARD DRIVE MODEL (Matching Reference Photograph)
    // =========================================================================
    const driveGroup = new THREE.Group();
    scene.add(driveGroup);

    // --- A. Cast Aluminum Chassis (Outer Shell) ---
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x76808b,
      roughness: 0.42,
      metalness: 0.88,
    });
    const chassisBaseGeo = new THREE.BoxGeometry(6.4, 0.5, 9.6);
    const chassisBase = new THREE.Mesh(chassisBaseGeo, chassisMat);
    chassisBase.position.set(0, -0.22, 0);
    chassisBase.receiveShadow = true;
    driveGroup.add(chassisBase);

    // Dark Milled Aluminum Inner Cavity Floor
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d22,
      roughness: 0.6,
      metalness: 0.75,
    });
    const cavityGeo = new THREE.BoxGeometry(5.8, 0.05, 9.0);
    const cavityFloor = new THREE.Mesh(cavityGeo, cavityMat);
    cavityFloor.position.set(0, 0.03, 0);
    cavityFloor.receiveShadow = true;
    driveGroup.add(cavityFloor);

    // Chassis Raised Rim Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x828b94,
      roughness: 0.38,
      metalness: 0.85,
    });
    // Left & Right Outer Walls
    const sideWallGeo = new THREE.BoxGeometry(0.35, 0.5, 9.6);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-3.025, 0.15, 0);
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(3.025, 0.15, 0);
    driveGroup.add(leftWall);
    driveGroup.add(rightWall);

    // Top Black Mounting Bracket (Header end)
    const topBracketMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.7,
      metalness: 0.3,
    });
    const topBracketGeo = new THREE.BoxGeometry(6.4, 0.55, 0.45);
    const topBracket = new THREE.Mesh(topBracketGeo, topBracketMat);
    topBracket.position.set(0, 0.15, -4.75);
    driveGroup.add(topBracket);

    // Bottom Wall
    const bottomWallGeo = new THREE.BoxGeometry(6.4, 0.5, 0.35);
    const bottomWall = new THREE.Mesh(bottomWallGeo, wallMat);
    bottomWall.position.set(0, 0.15, 4.75);
    driveGroup.add(bottomWall);

    // --- B. The 4 Blue Silicone Shock Mount Dampers (Grommets) ---
    const damperBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0070d0,
      roughness: 0.55,
      metalness: 0.05,
    });
    const washerSilverMat = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      roughness: 0.25,
      metalness: 0.92,
    });
    const screwCenterMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.5,
      metalness: 0.85,
    });

    const damperPositions = [
      [2.65, -4.2],  // Top-Right
      [2.65, 4.2],   // Bottom-Right
      [-2.65, 4.2],  // Bottom-Left
      [-2.65, -0.9], // Upper-Left
    ];

    damperPositions.forEach(([x, z]) => {
      // Blue silicone ring
      const ringMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.22, 24),
        damperBlueMat
      );
      ringMesh.position.set(x, 0.35, z);
      driveGroup.add(ringMesh);

      // Steel washer
      const washerMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.24, 20),
        washerSilverMat
      );
      washerMesh.position.set(x, 0.36, z);
      driveGroup.add(washerMesh);

      // Center Phillips screw
      const screwMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16),
        screwCenterMat
      );
      screwMesh.position.set(x, 0.37, z);
      driveGroup.add(screwMesh);
    });

    // --- C. Translucent Amber Perimeter Dust Gasket / Seal ---
    const gasketMat = new THREE.MeshStandardMaterial({
      color: 0xd4a046,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82,
    });

    // Outer curve hugging platter perimeter
    const gasketArc = new THREE.Mesh(
      new THREE.TorusGeometry(3.02, 0.07, 12, 48, Math.PI * 1.15),
      gasketMat
    );
    gasketArc.rotation.x = Math.PI * 0.5;
    gasketArc.rotation.z = Math.PI * 0.92;
    gasketArc.position.set(SPINDLE_X, 0.32, SPINDLE_Z);
    driveGroup.add(gasketArc);

    // Gasket straight extension to upper corner
    const gasketSideGeo = new THREE.BoxGeometry(0.14, 0.14, 3.8);
    const gasketSide = new THREE.Mesh(gasketSideGeo, gasketMat);
    gasketSide.position.set(2.4, 0.32, -1.8);
    driveGroup.add(gasketSide);

    // --- D. Top-Left 40-Pin IDE Connector Shroud & Pins ---
    const ideShroudMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.7,
      metalness: 0.2,
    });
    const ideShroud = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.44, 2.5),
      ideShroudMat
    );
    ideShroud.position.set(-2.82, 0.34, -3.1);
    driveGroup.add(ideShroud);

    // IDE Gold Pins inside connector
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.95,
    });
    for (let p = -1.1; p <= 1.1; p += 0.16) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), pinMat);
      pin.position.set(-2.82, 0.42, -3.1 + p);
      driveGroup.add(pin);
    }

    // --- E. Top-Left Brushed Steel Voice Coil Magnet Block ("S H10") ---
    const magnetLabelTex = createMagnetLabelTexture();
    const magnetSteelMat = new THREE.MeshStandardMaterial({
      color: 0xc4ccd4,
      roughness: 0.22,
      metalness: 0.94,
    });
    const magnetLabeledMat = new THREE.MeshStandardMaterial({
      map: magnetLabelTex,
      roughness: 0.25,
      metalness: 0.88,
    });

    const magnetMaterials = [
      magnetSteelMat, // px
      magnetSteelMat, // nx
      magnetLabeledMat, // py (top with "S H10" label)
      magnetSteelMat, // ny
      magnetSteelMat, // pz
      magnetSteelMat, // nz
    ];

    const magnetBlockGeo = new THREE.BoxGeometry(1.45, 0.52, 2.4);
    const magnetBlock = new THREE.Mesh(magnetBlockGeo, magnetMaterials);
    magnetBlock.position.set(-1.62, 0.32, -3.2);
    magnetBlock.castShadow = true;
    magnetBlock.receiveShadow = true;
    driveGroup.add(magnetBlock);

    // Magnet Block Corner Screws
    [[-2.15, -4.1], [-1.1, -4.1], [-1.1, -2.25]].forEach(([sx, sz]) => {
      const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), washerSilverMat);
      scr.position.set(sx, 0.58, sz);
      driveGroup.add(scr);
    });

    // Visible voice coil winding loop emerging behind arm
    const coilWindingMat = new THREE.MeshStandardMaterial({
      color: 0xb85010,
      roughness: 0.3,
      metalness: 0.85,
    });
    const coilWinding = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.08, 12, 32, Math.PI * 0.7),
      coilWindingMat
    );
    coilWinding.rotation.x = Math.PI * 0.5;
    coilWinding.rotation.z = Math.PI * 0.2;
    coilWinding.position.set(-0.95, 0.3, -2.8);
    driveGroup.add(coilWinding);

    // --- F. Top-Right Orange/Amber Kapton Flex PCB & Preamp IC ---
    const kaptonMat = new THREE.MeshStandardMaterial({
      color: 0xc86414,
      roughness: 0.42,
      metalness: 0.28,
    });
    const flexPcbGeo = new THREE.BoxGeometry(1.55, 0.03, 2.7);
    const flexPcb = new THREE.Mesh(flexPcbGeo, kaptonMat);
    flexPcb.position.set(1.65, 0.18, -2.9);
    driveGroup.add(flexPcb);

    // Preamp Integrated Circuit Chip
    const chipTex = createPreampChipTexture();
    const chipMat = new THREE.MeshStandardMaterial({
      map: chipTex,
      roughness: 0.65,
      metalness: 0.35,
    });
    const chipMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.12, 0.68),
      chipMat
    );
    chipMesh.position.set(1.65, 0.25, -2.9);
    chipMesh.castShadow = true;
    driveGroup.add(chipMesh);

    // IC Silver Leads (Pins) along edges
    for (let ip = -0.28; ip <= 0.28; ip += 0.09) {
      const pinL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), washerSilverMat);
      pinL.position.set(1.65 - 0.48, 0.21, -2.9 + ip);
      const pinR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), washerSilverMat);
      pinR.position.set(1.65 + 0.48, 0.21, -2.9 + ip);
      driveGroup.add(pinL);
      driveGroup.add(pinR);
    }

    // --- G. The Obsidian Mirror Magnetic Platter ---
    const platterTex = createPlatterTexture();
    const platterMat = new THREE.MeshStandardMaterial({
      map: platterTex,
      color: 0x181a20,
      roughness: 0.08,
      metalness: 0.98,
      envMapIntensity: 2.4,
    });

    const platterGeo = new THREE.CylinderGeometry(
      PLATTER_RADIUS_MAX,
      PLATTER_RADIUS_MAX,
      0.04,
      64,
      1,
      false
    );
    const platter = new THREE.Mesh(platterGeo, platterMat);
    platter.position.set(SPINDLE_X, 0.14, SPINDLE_Z);
    platter.receiveShadow = true;
    platter.castShadow = true;
    driveGroup.add(platter);
    platterMeshRef.current = platter;

    // --- H. Spindle Motor Hub & 6-Bolt Perimeter Clamping Assembly ---
    // Outer Clamping Ring
    const clampRingMat = new THREE.MeshStandardMaterial({
      color: 0xbac4ce,
      roughness: 0.22,
      metalness: 0.94,
    });
    const clampRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 0.92, 0.11, 48),
      clampRingMat
    );
    clampRing.position.set(SPINDLE_X, 0.19, SPINDLE_Z);
    driveGroup.add(clampRing);

    // 6 Torx Perimeter Screws around Spindle
    for (let b = 0; b < 6; b++) {
      const angle = (b * Math.PI) / 3;
      const bx = SPINDLE_X + Math.cos(angle) * 0.66;
      const bz = SPINDLE_Z + Math.sin(angle) * 0.66;

      const boltMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16),
        washerSilverMat
      );
      boltMesh.position.set(bx, 0.25, bz);
      driveGroup.add(boltMesh);

      // Torx dark center dot
      const torxDot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8),
        screwCenterMat
      );
      torxDot.position.set(bx, 0.26, bz);
      driveGroup.add(torxDot);
    }

    // Recessed Center Spindle Cap with 2 pinholes
    const centerCapMat = new THREE.MeshStandardMaterial({
      color: 0x8a949e,
      roughness: 0.3,
      metalness: 0.9,
    });
    const centerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.09, 32),
      centerCapMat
    );
    centerCap.position.set(SPINDLE_X, 0.24, SPINDLE_Z);
    driveGroup.add(centerCap);

    // Center Spindle Axle Dimple
    const dimpleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16),
      screwCenterMat
    );
    dimpleMesh.position.set(SPINDLE_X, 0.27, SPINDLE_Z);
    driveGroup.add(dimpleMesh);

    // --- I. High-Precision Actuator Arm & Read/Write Head Assembly ---
    const armGroup = new THREE.Group();
    armGroupRef.current = armGroup;
    armGroup.position.set(PIVOT_X, 0.26, PIVOT_Z);
    driveGroup.add(armGroup);

    // Precision Bearing Pivot Cylinder
    const pivotMat = new THREE.MeshStandardMaterial({
      color: 0x5a6572,
      roughness: 0.32,
      metalness: 0.92,
    });
    const pivotMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.45, 0.35, 32),
      pivotMat
    );
    pivotMesh.position.set(0, 0.05, 0);
    armGroup.add(pivotMesh);

    // Pivot Center Cap Screw
    const pivotScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.38, 20),
      washerSilverMat
    );
    pivotScrew.position.set(0, 0.06, 0);
    armGroup.add(pivotScrew);

    // Stamped Aluminum Actuator Arm Beam (extends along +Z within local frame)
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xc4ccd4,
      roughness: 0.24,
      metalness: 0.92,
    });

    // Triangular tapered arm segment
    const armShape = new THREE.Shape();
    armShape.moveTo(-0.24, 0);
    armShape.lineTo(0.24, 0);
    armShape.lineTo(0.07, ARM_LENGTH * 0.72);
    armShape.lineTo(-0.07, ARM_LENGTH * 0.72);
    armShape.closePath();

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const armGeo = new THREE.ExtrudeGeometry(armShape, extrudeSettings);
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.rotation.x = Math.PI * 0.5;
    armMesh.position.set(0, 0.05, 0);
    armMesh.castShadow = true;
    armGroup.add(armMesh);

    // Lightening Hole Cutouts in Arm
    [0.7, 1.4, 2.0].forEach((zOff) => {
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.15, 16),
        new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.7 })
      );
      hole.position.set(0, 0.05, zOff);
      armGroup.add(hole);
    });

    // Thin Stainless Steel Flexure Extension to Head Slider
    const flexureMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.18,
      metalness: 0.96,
    });
    const flexureGeo = new THREE.BoxGeometry(0.12, 0.02, ARM_LENGTH * 0.32);
    const flexureMesh = new THREE.Mesh(flexureGeo, flexureMat);
    flexureMesh.position.set(0, 0.01, ARM_LENGTH * 0.85);
    flexureMesh.castShadow = true;
    armGroup.add(flexureMesh);

    // Microscopic Ceramic Read/Write Head Slider
    const sliderMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.25,
      metalness: 0.8,
    });
    const slider = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), sliderMat);
    slider.position.set(0, -0.04, ARM_LENGTH);
    armGroup.add(slider);

    // Dual Fine Red Copper Head Wires running along arm spine
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0xcc3322,
      roughness: 0.4,
      metalness: 0.7,
    });
    const wireL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ARM_LENGTH * 0.9, 8), wireMat);
    wireL.rotation.x = Math.PI * 0.5;
    wireL.position.set(-0.035, 0.09, ARM_LENGTH * 0.48);
    armGroup.add(wireL);

    const wireR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ARM_LENGTH * 0.9, 8), wireMat);
    wireR.rotation.x = Math.PI * 0.5;
    wireR.position.set(0.035, 0.09, ARM_LENGTH * 0.48);
    armGroup.add(wireR);

    // Micro Magnetic Read Flux Glow at Slider Tip
    const laserGeo = new THREE.CylinderGeometry(0.03, 0.06, 0.08, 16);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.position.set(0, -0.08, ARM_LENGTH);
    armGroup.add(laserBeam);
    laserBeamRef.current = laserBeam;

    // --- J. Dynamic 3D Track Rings on Platter ---
    const pendingGroup = new THREE.Group();
    pendingRingsGroupRef.current = pendingGroup;
    driveGroup.add(pendingGroup);

    const servicedGroup = new THREE.Group();
    servicedRingsGroupRef.current = servicedGroup;
    driveGroup.add(servicedGroup);

    // Active Cylinder Glowing Ring
    const activeRingGeo = new THREE.RingGeometry(1.98, 2.02, 64);
    const activeRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    const activeRing = new THREE.Mesh(activeRingGeo, activeRingMat);
    activeRing.rotation.x = Math.PI * 0.5;
    activeRing.position.set(SPINDLE_X, 0.165, SPINDLE_Z);
    driveGroup.add(activeRing);
    activeRingRef.current = activeRing;

    // --- K. Animation Loop ---
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Continuous Platter Rotation at set RPM
      if (isRotating && platterMeshRef.current) {
        const spinSpeed = (rpm / 60) * 0.032;
        platterMeshRef.current.rotation.y += spinSpeed;
      }

      // Smooth Law-of-Cosines Arm Seek Lerp
      const targetAngle = trackToAngle(currentTrackRef.current);
      const angleDiff = targetAngle - armAngleRef.current;
      if (Math.abs(angleDiff) > 0.0008) {
        armAngleRef.current += angleDiff * 0.18;
        if (armGroupRef.current) {
          armGroupRef.current.rotation.y = armAngleRef.current;
        }

        // Stepper tick sound
        const curInt = Math.round(
          minTrack +
            ((armAngleRef.current - trackToAngle(minTrack)) /
              (trackToAngle(maxTrack) - trackToAngle(minTrack))) *
              (maxTrack - minTrack)
        );
        if (curInt !== lastTrackSoundRef.current) {
          playSeekTick(1 + (Math.abs(curInt) / maxTrack) * 0.4);
          lastTrackSoundRef.current = curInt;
        }
      } else {
        armAngleRef.current = targetAngle;
        if (armGroupRef.current) {
          armGroupRef.current.rotation.y = targetAngle;
        }
      }

      // Update Active Track Ring Radius
      if (activeRingRef.current) {
        const norm = Math.max(
          0,
          Math.min(1, (currentTrackRef.current - minTrack) / (maxTrack - minTrack))
        );
        const r = PLATTER_RADIUS_MIN + norm * (PLATTER_RADIUS_MAX - PLATTER_RADIUS_MIN);
        activeRingRef.current.scale.set(r / 2.0, r / 2.0, 1);
      }

      // Read beam subtle pulse
      if (laserBeamRef.current) {
        laserBeamRef.current.visible = Math.abs(angleDiff) < 0.006;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Dynamic Track Rings (Pending & Serviced)
  useEffect(() => {
    if (!pendingRingsGroupRef.current || !servicedRingsGroupRef.current) return;

    // Clear previous rings
    while (pendingRingsGroupRef.current.children.length > 0) {
      pendingRingsGroupRef.current.remove(pendingRingsGroupRef.current.children[0]);
    }
    while (servicedRingsGroupRef.current.children.length > 0) {
      servicedRingsGroupRef.current.remove(servicedRingsGroupRef.current.children[0]);
    }

    // Pending Requests (Amber Rings)
    pendingRequests.forEach((req) => {
      const norm = Math.max(0, Math.min(1, (req - minTrack) / (maxTrack - minTrack)));
      const r = PLATTER_RADIUS_MIN + norm * (PLATTER_RADIUS_MAX - PLATTER_RADIUS_MIN);
      const ringGeo = new THREE.RingGeometry(r - 0.02, r + 0.02, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.5;
      ring.position.set(SPINDLE_X, 0.162, SPINDLE_Z);
      pendingRingsGroupRef.current.add(ring);
    });

    // Serviced Requests (Emerald Rings)
    servicedRequests.forEach((req) => {
      const norm = Math.max(0, Math.min(1, (req - minTrack) / (maxTrack - minTrack)));
      const r = PLATTER_RADIUS_MIN + norm * (PLATTER_RADIUS_MAX - PLATTER_RADIUS_MIN);
      const ringGeo = new THREE.RingGeometry(r - 0.015, r + 0.015, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.5;
      ring.position.set(SPINDLE_X, 0.162, SPINDLE_Z);
      servicedRingsGroupRef.current.add(ring);
    });
  }, [pendingRequests, servicedRequests, minTrack, maxTrack]);

  // Camera Presets
  const setCameraPreset = (preset) => {
    setCameraView(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'isometric') {
      cam.position.set(4.8, 7.8, 6.2);
      ctrl.target.set(0, 0.2, 0.5);
    } else if (preset === 'top') {
      // Direct top-down view mirroring the user's reference photograph!
      cam.position.set(0, 11.8, 0.1);
      ctrl.target.set(0, 0.2, 0.1);
    } else if (preset === 'closeup') {
      // Macro view on the actuator head slider and magnetic tracks
      cam.position.set(0.3, 2.2, 2.2);
      ctrl.target.set(0, 0.2, 1.2);
    } else if (preset === 'side') {
      cam.position.set(-7.5, 2.8, 1.2);
      ctrl.target.set(0, 0.2, 1.2);
    }
    ctrl.update();
  };

  // Raycasting for 3D Click-to-Seek on Platter Surface
  const handleCanvasClick = (e) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Test intersection against platter surface plane (Y = 0.14)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.14);
    const targetPoint = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, targetPoint);

    if (hit) {
      const dx = hit.x - SPINDLE_X;
      const dz = hit.z - SPINDLE_Z;
      const distFromCenter = Math.sqrt(dx * dx + dz * dz);
      if (distFromCenter >= PLATTER_RADIUS_MIN && distFromCenter <= PLATTER_RADIUS_MAX) {
        const norm =
          (distFromCenter - PLATTER_RADIUS_MIN) /
          (PLATTER_RADIUS_MAX - PLATTER_RADIUS_MIN);
        const track = Math.round(minTrack + norm * (maxTrack - minTrack));
        playReadPulse();
        onTrackClick?.(track);
      }
    }
  };

  return (
    <div className="relative flex flex-col h-full font-mono">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onClick={handleCanvasClick}
        className="w-full flex-1 min-h-[460px] bg-[#07090e] rounded-none overflow-hidden border border-[#24242e] cursor-grab active:cursor-grabbing relative"
      />

      {/* Top Floating Controls HUD */}
      <div className="absolute top-4 right-4 flex items-center gap-2.5 bg-[#0a0d14]/90 backdrop-blur-md px-3.5 py-2 border border-[#24242e] text-xs">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className="flex items-center gap-1.5 text-[#f3f1ea] hover:text-white transition-colors"
          title="Toggle Spindle Motor Rotation"
        >
          <Disc className={`w-3.5 h-3.5 text-[#891a20] ${isRotating ? 'animate-spin' : ''}`} />
          <span className="font-mono-tech font-bold tracking-wider">
            {isRotating ? `${rpm} RPM` : 'MOTOR HALTED'}
          </span>
        </button>

        <span className="text-[#3a3a46]">|</span>

        {/* Camera Views */}
        <div className="flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-[#8c8b94] mr-1" />
          {[
            { id: 'isometric', label: '3D ISO' },
            { id: 'top', label: 'PHOTO TOP' },
            { id: 'closeup', label: 'HEAD' },
            { id: 'side', label: 'SIDE' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setCameraPreset(v.id)}
              className={`px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-wider transition-all border ${
                cameraView === v.id
                  ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] font-bold shadow'
                  : 'bg-[#12151c] text-[#8c8b94] border-[#24242e] hover:border-[#8c8b94] hover:text-[#f3f1ea]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
