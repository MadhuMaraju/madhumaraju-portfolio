/* ==========================================================================
   HERO ENGINEERING DIGITAL TWIN & MULTI-DOMAIN INTELLIGENCE VISUALIZER
   Interactive 3D Multi-Disciplinary Engineering Simulation Engine
   Zero Dependencies | Hardware Accelerated 2D Canvas 3D Projection
   Domains: CAD Wireframe • FEA Stress Tensor • DfAM Lattice • Dynamics/Toolpath
   Madhu Maraju — Mechanical Engineering Portfolio
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('hero-twin-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('hero-twin-viewport');
  const modeButtons = document.querySelectorAll('[data-twin-mode]');
  const modeTag = document.getElementById('twin-mode-tag');
  const hudRot = document.getElementById('twin-hud-rot');
  const hudStats = document.getElementById('twin-hud-stats');
  const feaLegend = document.getElementById('twin-fea-legend');
  const telemetryReadout = document.getElementById('twin-telemetry-readout');

  let width = 460;
  let height = 240;
  let dpr = window.devicePixelRatio || 1;

  // Viewport & Rotation State
  let rotX = 0.42;
  let rotY = -0.58;
  let rotZ = 0.0;
  let autoRotate = true;
  let autoCycle = true;
  let currentMode = 'cad'; // 'cad', 'fea', 'dfam', 'dynamics'
  let cycleTimer = null;
  let userInteractedTimeout = null;

  // Drag interaction
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let animFrameId = null;

  // Animation ticks
  let tick = 0;
  let toolpathPhase = 0;

  function resize() {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  setTimeout(resize, 80);
  resize();

  // Mode definitions & telemetry
  const DOMAIN_MODES = {
    cad: {
      tag: 'MODE 01: CAD SURFACE & MESH',
      stats: 'NODES: 1,420 | ELEMS: 2,840',
      telemetry: 'GEOMETRY: PARAMETRIC B-REP // CSG SOLID KERNEL',
      showLegend: false
    },
    fea: {
      tag: 'MODE 02: FEA STRESS CONTOURS',
      stats: 'SOLVER: NON-LINEAR // MAX σ: 285 MPa',
      telemetry: 'FEA: VON MISES TENSOR // CONVERGENCE RESIDUAL <1e-5',
      showLegend: true
    },
    dfam: {
      tag: 'MODE 03: DfAM LATTICE TOPOLOGY',
      stats: 'TOPOLOGY: OCTET-TRUSS // VOID: 62%',
      telemetry: 'DfAM: CONVENTIONAL WEIGHT -47% // EQUIAXIAL STIFFNESS',
      showLegend: false
    },
    dynamics: {
      tag: 'MODE 04: DYNAMICS & TOOLPATH',
      stats: 'FEED: 1,200 mm/min | ω: 85 rad/s',
      telemetry: 'KINEMATICS: 5-AXIS CNC TOOLPATH & ROTATIONAL VECTORS',
      showLegend: false
    }
  };

  function setMode(modeKey, manualUserTrigger) {
    if (!DOMAIN_MODES[modeKey]) return;
    currentMode = modeKey;

    if (manualUserTrigger) {
      autoCycle = false;
      clearTimeout(cycleTimer);
      // Resume auto-cycle after 25s of inactivity
      clearTimeout(userInteractedTimeout);
      userInteractedTimeout = setTimeout(() => {
        autoCycle = true;
        startAutoCycle();
      }, 25000);
    }

    // Update buttons
    modeButtons.forEach((btn) => {
      const btnMode = btn.getAttribute('data-twin-mode');
      const isActive = btnMode === modeKey;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const info = DOMAIN_MODES[modeKey];
    if (modeTag) modeTag.textContent = info.tag;
    if (hudStats) hudStats.textContent = info.stats;
    if (telemetryReadout) telemetryReadout.textContent = info.telemetry;
    if (feaLegend) feaLegend.style.display = info.showLegend ? 'flex' : 'none';
  }

  function startAutoCycle() {
    clearTimeout(cycleTimer);
    cycleTimer = setInterval(() => {
      if (!autoCycle) return;
      const keys = Object.keys(DOMAIN_MODES);
      const nextIdx = (keys.indexOf(currentMode) + 1) % keys.length;
      setMode(keys[nextIdx], false);
    }, 7000);
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = btn.getAttribute('data-twin-mode');
      setMode(mode, true);
    });
  });

  startAutoCycle();

  // Mouse & Touch Drag Controls
  if (container) {
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      autoRotate = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      rotY += dx * 0.009;
      rotX += dy * 0.009;
      rotX = Math.max(-1.4, Math.min(1.4, rotX));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        clearTimeout(userInteractedTimeout);
        userInteractedTimeout = setTimeout(() => {
          autoRotate = true;
        }, 4000);
      }
    });

    // Touch support for mobile devices
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
        autoRotate = false;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseX;
      const dy = e.touches[0].clientY - prevMouseY;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      rotX = Math.max(-1.4, Math.min(1.4, rotX));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        clearTimeout(userInteractedTimeout);
        userInteractedTimeout = setTimeout(() => {
          autoRotate = true;
        }, 4000);
      }
    });
  }

  // 3D Engine: Geometric Model Generation
  const vertices = [];
  const edges = [];
  const faces = [];
  const latticeNodes = [];
  const latticeStruts = [];

  function buildDigitalTwinModel() {
    vertices.length = 0;
    edges.length = 0;
    faces.length = 0;
    latticeNodes.length = 0;
    latticeStruts.length = 0;

    const outerR = 68;
    const innerR = 34;
    const heightZ = 52;
    const sides = 8;

    // Top and bottom octagonal rings
    for (let h of [-heightZ / 2, heightZ / 2]) {
      // Outer ring
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        vertices.push({
          x: outerR * Math.cos(theta),
          y: h,
          z: outerR * Math.sin(theta),
          stress: 0.2 + 0.3 * Math.sin(theta * 2)
        });
      }
      // Inner bore ring (high stress concentration)
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        vertices.push({
          x: innerR * Math.cos(theta),
          y: h,
          z: innerR * Math.sin(theta),
          stress: 0.75 + 0.25 * Math.cos(theta * 3)
        });
      }
    }

    // Outer & inner edges
    for (let layer = 0; layer < 2; layer++) {
      const outerBase = layer * (sides * 2);
      const innerBase = outerBase + sides;
      for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        edges.push([outerBase + i, outerBase + next]);
        edges.push([innerBase + i, innerBase + next]);
        edges.push([outerBase + i, innerBase + i]);
      }
    }

    // Vertical column edges between bottom and top rings
    const bottomBase = 0;
    const topBase = sides * 2;
    for (let i = 0; i < sides; i++) {
      edges.push([bottomBase + i, topBase + i]);
      edges.push([bottomBase + sides + i, topBase + sides + i]);
    }

    // Outer wall faces (quads split into triangles for FEA)
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const b0 = bottomBase + i;
      const b1 = bottomBase + next;
      const t0 = topBase + i;
      const t1 = topBase + next;
      faces.push([b0, b1, t1]);
      faces.push([b0, t1, t0]);
    }

    // Top annular deck faces
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const out0 = topBase + i;
      const out1 = topBase + next;
      const in0 = topBase + sides + i;
      const in1 = topBase + sides + next;
      faces.push([out0, out1, in1]);
      faces.push([out0, in1, in0]);
    }

    // Build internal DfAM lattice structure (3D Octet-Truss grid inside the envelope)
    const step = 28;

    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        for (let gz = -1; gz <= 1; gz++) {
          const px = gx * step;
          const py = gy * (step * 0.7);
          const pz = gz * step;
          const dist = Math.sqrt(px * px + pz * pz);
          if (dist >= innerR * 0.8 && dist <= outerR * 1.05) {
            latticeNodes.push({ x: px, y: py, z: pz });
          }
        }
      }
    }

    // Connect nearest neighbor lattice nodes
    for (let i = 0; i < latticeNodes.length; i++) {
      for (let j = i + 1; j < latticeNodes.length; j++) {
        const p1 = latticeNodes[i];
        const p2 = latticeNodes[j];
        const d2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2;
        if (d2 <= step * step * 1.45) {
          latticeStruts.push([i, j]);
        }
      }
    }
  }

  buildDigitalTwinModel();

  // 3D Point Projection Helper
  function project(p, cx, cy, fov, scale) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = p.x * cosY + p.z * sinY;
    const y1 = p.y;
    const z1 = -p.x * sinY + p.z * cosY;

    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    const distance = 260;
    const zProj = z2 + distance;
    const pers = fov / Math.max(1, zProj);

    return {
      x: cx + x2 * pers * scale,
      y: cy + y2 * pers * scale,
      z: z2,
      rawX: x2,
      rawY: y2,
      rawZ: z2
    };
  }

  // Engineering Theme Colors (Pure Dark Blueprint & Digital Lab)
  function getThemeColors() {
    return {
      bg: '#07090C',
      primary: '#39D9FF',
      secondary: '#9DA7B3',
      muted: '#5C6773',
      accent: '#FFB547',
      wireframe: 'rgba(57, 217, 255, 0.85)',
      wireframeSubtle: 'rgba(57, 217, 255, 0.22)',
      faceFill: 'rgba(57, 217, 255, 0.04)',
      latticeStrut: '#FFB547',
      latticeNode: '#39D9FF',
      toolpath: '#39D9FF',
      toolpathGlow: 'rgba(57, 217, 255, 0.45)',
      vectorArrow: '#FFB547',
      axisX: '#FF4757',
      axisY: '#2ED573',
      axisZ: '#39D9FF'
    };
  }

  // FEA von Mises Color Mapping
  function getStressColor(val) {
    const clamped = Math.max(0, Math.min(1, val));
    if (clamped < 0.25) {
      const t = clamped / 0.25;
      return `rgba(57, 217, 255, ${0.45 + t * 0.4})`;
    } else if (clamped < 0.55) {
      return 'rgba(46, 213, 115, 0.85)';
    } else if (clamped < 0.8) {
      return 'rgba(255, 181, 71, 0.9)';
    } else {
      return 'rgba(255, 71, 87, 0.95)';
    }
  }

  // Render Loop
  function render() {
    tick += 0.018;
    toolpathPhase += 0.024;

    if (autoRotate) {
      rotY += 0.007;
      rotX = 0.38 + 0.06 * Math.sin(tick * 0.7);
    }

    // Update HUD Rotation Telemetry
    if (hudRot) {
      const degX = Math.round((rotX * 180) / Math.PI);
      const degY = Math.round((rotY * 180) / Math.PI) % 360;
      hudRot.textContent = `ROT: X:${degX >= 0 ? '+' : ''}${degX}° Y:${degY >= 0 ? '+' : ''}${degY}°`;
    }

    ctx.clearRect(0, 0, width, height);

    const C = getThemeColors();
    const cx = width / 2;
    const cy = height / 2;
    const fov = 270;
    const modelScale = Math.min(width, height) / 210;

    // 1. Draw subtle background CAD drafting grid inside viewport
    ctx.save();
    ctx.strokeStyle = 'rgba(57, 217, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridStep = 22;
    for (let x = 0; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Project all vertices to screen coordinates
    const projVertices = vertices.map((v) => project(v, cx, cy, fov, modelScale));
    const projLattice = latticeNodes.map((n) => project(n, cx, cy, fov, modelScale));

    // Sort faces by depth for painter's algorithm
    const sortedFaces = faces.map((f, idx) => {
      const p0 = projVertices[f[0]];
      const p1 = projVertices[f[1]];
      const p2 = projVertices[f[2]];
      const avgZ = (p0.z + p1.z + p2.z) / 3;
      return { indices: f, avgZ, p0, p1, p2, idx };
    }).sort((a, b) => b.avgZ - a.avgZ);

    // 3. Render Mode-Specific Geometry
    if (currentMode === 'cad') {
      // --- MODE 01: CAD WIREFRAME & FACET SHADING ---
      sortedFaces.forEach((f) => {
        ctx.beginPath();
        ctx.moveTo(f.p0.x, f.p0.y);
        ctx.lineTo(f.p1.x, f.p1.y);
        ctx.lineTo(f.p2.x, f.p2.y);
        ctx.closePath();
        ctx.fillStyle = C.faceFill;
        ctx.fill();
        ctx.strokeStyle = C.wireframeSubtle;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Feature edges
      ctx.strokeStyle = C.wireframe;
      ctx.lineWidth = 1.4;
      edges.forEach(([i, j]) => {
        const p1 = projVertices[i];
        const p2 = projVertices[j];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Vertex markers
      ctx.fillStyle = C.primary;
      projVertices.forEach((p, idx) => {
        if (idx % 2 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Calibrated dimension callout
      const pTop = projVertices[0];
      const pBtm = projVertices[projVertices.length - 8];
      if (pTop && pBtm) {
        ctx.save();
        ctx.strokeStyle = C.accent;
        ctx.fillStyle = C.accent;
        ctx.font = '7.5px "JetBrains Mono", monospace';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pTop.x - 18, pTop.y);
        ctx.lineTo(pTop.x - 32, pTop.y);
        ctx.moveTo(pBtm.x - 18, pBtm.y);
        ctx.lineTo(pBtm.x - 32, pBtm.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pTop.x - 28, pTop.y);
        ctx.lineTo(pBtm.x - 28, pBtm.y);
        ctx.stroke();
        ctx.fillText('H: 52.0mm ±0.02', pTop.x - 88, (pTop.y + pBtm.y) / 2 + 3);
        ctx.restore();
      }

    } else if (currentMode === 'fea') {
      // --- MODE 02: FEA STRESS TENSOR SIMULATION ---
      sortedFaces.forEach((f) => {
        const v0 = vertices[f.indices[0]];
        const v1 = vertices[f.indices[1]];
        const v2 = vertices[f.indices[2]];
        const avgStress = (v0.stress + v1.stress + v2.stress) / 3;

        ctx.beginPath();
        ctx.moveTo(f.p0.x, f.p0.y);
        ctx.lineTo(f.p1.x, f.p1.y);
        ctx.lineTo(f.p2.x, f.p2.y);
        ctx.closePath();

        ctx.fillStyle = getStressColor(avgStress);
        ctx.fill();

        ctx.strokeStyle = 'rgba(57, 217, 255, 0.35)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });

      // Highlight principal stress concentration nodes
      projVertices.forEach((p, idx) => {
        const v = vertices[idx];
        if (v && v.stress > 0.7) {
          ctx.save();
          ctx.fillStyle = '#FF4757';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

    } else if (currentMode === 'dfam') {
      // --- MODE 03: DfAM TOPOLOGY OPTIMIZATION & LATTICE ---
      sortedFaces.forEach((f) => {
        ctx.beginPath();
        ctx.moveTo(f.p0.x, f.p0.y);
        ctx.lineTo(f.p1.x, f.p1.y);
        ctx.lineTo(f.p2.x, f.p2.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(57, 217, 255, 0.025)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(57, 217, 255, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Render 3D Octet-Truss micro-struts
      ctx.save();
      ctx.strokeStyle = C.latticeStrut;
      ctx.lineWidth = 1.3;
      latticeStruts.forEach(([i, j]) => {
        const p1 = projLattice[i];
        const p2 = projLattice[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Render lattice nodes
      ctx.fillStyle = C.latticeNode;
      projLattice.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

    } else if (currentMode === 'dynamics') {
      // --- MODE 04: COMPUTATIONAL DYNAMICS & TOOLPATH ---
      edges.forEach(([i, j]) => {
        const p1 = projVertices[i];
        const p2 = projVertices[j];
        ctx.strokeStyle = C.wireframeSubtle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Animated 5-axis CNC / Robot toolpath trajectory
      ctx.save();
      ctx.strokeStyle = C.toolpath;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.toolpathGlow;
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const pathSteps = 48;
      let headPoint = null;

      for (let s = 0; s < pathSteps; s++) {
        const u = s / pathSteps;
        const angle = u * Math.PI * 4 + toolpathPhase;
        const radius = 62 + 8 * Math.sin(angle * 3);
        const yPos = (u - 0.5) * 44;
        const rawPt = {
          x: radius * Math.cos(angle),
          y: yPos,
          z: radius * Math.sin(angle)
        };
        const projPt = project(rawPt, cx, cy, fov, modelScale);

        if (s === 0) {
          ctx.moveTo(projPt.x, projPt.y);
        } else {
          ctx.lineTo(projPt.x, projPt.y);
        }

        if (s === pathSteps - 1) {
          headPoint = projPt;
        }
      }
      ctx.stroke();

      // Tool tip glowing probe
      if (headPoint) {
        ctx.fillStyle = C.accent;
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = C.vectorArrow;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(headPoint.x, headPoint.y);
        ctx.lineTo(headPoint.x + 18, headPoint.y - 14);
        ctx.stroke();

        ctx.font = '7.5px "JetBrains Mono", monospace';
        ctx.fillStyle = C.vectorArrow;
        ctx.fillText('v_t (tangent)', headPoint.x + 22, headPoint.y - 12);
      }
      ctx.restore();

      // Kinematic angular velocity vector (ω) on primary axis
      const topOrigin = project({ x: 0, y: -45, z: 0 }, cx, cy, fov, modelScale);
      const vecEnd = project({ x: 0, y: -75, z: 0 }, cx, cy, fov, modelScale);

      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topOrigin.x, topOrigin.y);
      ctx.lineTo(vecEnd.x, vecEnd.y);
      ctx.stroke();

      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.moveTo(vecEnd.x, vecEnd.y - 4);
      ctx.lineTo(vecEnd.x - 4, vecEnd.y + 4);
      ctx.lineTo(vecEnd.x + 4, vecEnd.y + 4);
      ctx.closePath();
      ctx.fill();

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText('ω_z = 85 rad/s', vecEnd.x + 8, vecEnd.y);
      ctx.restore();
    }

    // 4. Global 3D Coordinate Datum Trihedron (X, Y, Z) in bottom-left corner
    const axisOrigin = { x: 38, y: height - 28 };
    const axisLen = 20;
    const axCosY = Math.cos(rotY), axSinY = Math.sin(rotY);
    const axCosX = Math.cos(rotX), axSinX = Math.sin(rotX);

    function projectAxis(ax, ay, az) {
      const x1 = ax * axCosY + az * axSinY;
      const y1 = ay;
      const z1 = -ax * axSinY + az * axCosY;
      const x2 = x1;
      const y2 = y1 * axCosX - z1 * axSinX;
      return { x: axisOrigin.x + x2 * axisLen, y: axisOrigin.y + y2 * axisLen };
    }

    const axX = projectAxis(1, 0, 0);
    const axY = projectAxis(0, -1, 0);
    const axZ = projectAxis(0, 0, 1);

    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C.axisX;
    ctx.beginPath();
    ctx.moveTo(axisOrigin.x, axisOrigin.y);
    ctx.lineTo(axX.x, axX.y);
    ctx.stroke();

    ctx.strokeStyle = C.axisY;
    ctx.beginPath();
    ctx.moveTo(axisOrigin.x, axisOrigin.y);
    ctx.lineTo(axY.x, axY.y);
    ctx.stroke();

    ctx.strokeStyle = C.axisZ;
    ctx.beginPath();
    ctx.moveTo(axisOrigin.x, axisOrigin.y);
    ctx.lineTo(axZ.x, axZ.y);
    ctx.stroke();

    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillStyle = C.axisX;
    ctx.fillText('X', axX.x + 3, axX.y + 2);
    ctx.fillStyle = C.axisY;
    ctx.fillText('Y', axY.x + 3, axY.y + 2);
    ctx.fillStyle = C.axisZ;
    ctx.fillText('Z', axZ.x + 3, axZ.y + 2);
    ctx.restore();

    animFrameId = requestAnimationFrame(render);
  }

  // Handle visibility to optimize GPU
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!animFrameId) render();
        } else {
          if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
          }
        }
      });
    }, { threshold: 0.05 });
    observer.observe(canvas);
  } else {
    render();
  }

  window.addEventListener('portfolio-theme-change', () => {
    // Redrawn on next animation frame with theme colors
  });

})();
