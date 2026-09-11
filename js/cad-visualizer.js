/* ==========================================================================
   CAD BLUEPRINT 3D VISUALIZER (Zero Dependencies)
   Precision 3D Mechanical Assembly Model: Regenerative Rocket Nozzle with
   Conformal Cooling Channels & TPMS Lattice Structure (IIT Palakkad DfAM Project)
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('cad-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;

  // Viewport & Transform State
  let rotX = 0.45;
  let rotY = 0.65;
  let rotZ = 0;
  let scale = 1.3;
  let autoRotate = false; // User-controlled
  let viewMode = 'wireframe'; // 'wireframe', 'exploded', 'channels'
  let explodedOffset = 0; // for exploded animation
  let isDragging = false;
  let prevMouseX = 0, prevMouseY = 0;

  // Telemetry elements
  const angleReadout = document.getElementById('cad-angle-readout');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    width = canvas.width = rect.width * dpr;
    height = canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  setTimeout(resize, 100);
  resize();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) resize();
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);
  }

  // 3D Geometry Generation
  // Model: Regenerative Rocket Nozzle & Combustion Chamber
  // Consists of:
  // Part 1: Top Injector Flange (disk with bolt holes)
  // Part 2: Combustion Chamber Cylinder
  // Part 3: Converging-Diverging de Laval Nozzle
  // Part 4: Helical Conformal Cooling Passages
  // Part 5: Inner TPMS Lattice Core

  const geometry = {
    flangeRings: [],
    chamberRings: [],
    nozzleRings: [],
    coolingChannels: [],
    latticeRods: [],
    dimensionPoints: []
  };

  function buildGeometry() {
    geometry.flangeRings = [];
    geometry.chamberRings = [];
    geometry.nozzleRings = [];
    geometry.coolingChannels = [];
    geometry.latticeRods = [];

    const segments = 24;

    // 1. Injector Flange (Z from +120 to +100)
    for (let z = 120; z >= 100; z -= 10) {
      const ring = [];
      const r = 68;
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ring.push({ x: r * Math.cos(theta), y: z, z: r * Math.sin(theta) });
      }
      geometry.flangeRings.push(ring);
    }

    // 2. Combustion Chamber (Z from +100 to +30)
    const chamberRadius = 48;
    for (let z = 100; z >= 30; z -= 14) {
      const ring = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ring.push({ x: chamberRadius * Math.cos(theta), y: z, z: chamberRadius * Math.sin(theta) });
      }
      geometry.chamberRings.push(ring);
    }

    // 3. Converging-Diverging Nozzle (Z from +30 down to -120)
    // Throat at Z = 0 (R = 22), Exit at Z = -120 (R = 76)
    const nozzleSteps = 16;
    for (let step = 0; step <= nozzleSteps; step++) {
      const t = step / nozzleSteps;
      const z = 30 - t * 150; // +30 down to -120
      let r;
      if (z > 0) {
        // Converging section (smooth curve)
        const s = (z - 0) / 30;
        r = 22 + (chamberRadius - 22) * Math.pow(s, 1.4);
      } else {
        // Diverging parabolic Rao bell
        const s = -z / 120;
        r = 22 + (76 - 22) * Math.pow(s, 0.75);
      }

      const ring = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ring.push({ x: r * Math.cos(theta), y: z, z: r * Math.sin(theta) });
      }
      geometry.nozzleRings.push({ r, z, ring });
    }

    // 4. Helical Regenerative Cooling Channels along contour
    const channelCount = 18;
    for (let c = 0; c < channelCount; c++) {
      const channelPoints = [];
      const baseAngle = (c / channelCount) * Math.PI * 2;
      for (let step = 0; step <= nozzleSteps; step++) {
        const t = step / nozzleSteps;
        const z = 30 - t * 150;
        let r;
        if (z > 0) {
          const s = z / 30;
          r = 22 + (chamberRadius - 22) * Math.pow(s, 1.4);
        } else {
          const s = -z / 120;
          r = 22 + (76 - 22) * Math.pow(s, 0.75);
        }
        // Helical twist
        const theta = baseAngle + t * 1.8;
        const rCooling = r + 2.5; // slight offset for wall thickness
        channelPoints.push({ x: rCooling * Math.cos(theta), y: z, z: rCooling * Math.sin(theta) });
      }
      geometry.coolingChannels.push(channelPoints);
    }

    // 5. TPMS Gyroid Lattice representation inside combustion core
    const latticeLevels = 4;
    for (let l = 0; l < latticeLevels; l++) {
      const lz = 85 - l * 16;
      const lr = chamberRadius - 8;
      const count = 8;
      for (let k = 0; k < count; k++) {
        const a1 = (k / count) * Math.PI * 2;
        const a2 = ((k + 1) / count) * Math.PI * 2;
        const p1 = { x: lr * Math.cos(a1), y: lz, z: lr * Math.sin(a1) };
        const p2 = { x: (lr - 12) * Math.cos(a1 + 0.3), y: lz - 8, z: (lr - 12) * Math.sin(a1 + 0.3) };
        const p3 = { x: lr * Math.cos(a2), y: lz, z: lr * Math.sin(a2) };
        geometry.latticeRods.push([p1, p2]);
        geometry.latticeRods.push([p2, p3]);
      }
    }
  }

  buildGeometry();

  // 3D Point Projection
  function project(p, offsetY = 0) {
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    // Apply exploded offset to Y coordinate
    const py = p.y + offsetY;

    // Rotate Y (yaw)
    const x1 = p.x * cosY - p.z * sinY;
    const z1 = p.x * sinY + p.z * cosY;

    // Rotate X (pitch)
    const y2 = py * cosX - z1 * sinX;
    const z2 = py * sinX + z1 * cosX;

    // Perspective projection
    const fov = 420;
    const distance = 460;
    const factor = (fov / (distance - z2)) * scale;

    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    return {
      x: w / 2 + x1 * factor,
      y: h / 2 - y2 * factor,
      z: z2,
      visible: z2 < distance - 20
    };
  }

  // Draw 3D Axis Indicator at bottom-left
  function drawAxisGizmo(originX, originY) {
    const axisLen = 28;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    function projVec(vx, vy, vz) {
      const x1 = vx * cosY - vz * sinY;
      const z1 = vx * sinY + vz * cosY;
      const y2 = vy * cosX - z1 * sinX;
      return { x: originX + x1, y: originY - y2 };
    }

    const axes = [
      { name: 'X', v: [axisLen, 0, 0], color: '#FF5F56' },
      { name: 'Y', v: [0, axisLen, 0], color: '#27C93F' },
      { name: 'Z', v: [0, 0, axisLen], color: '#39D9FF' }
    ];

    axes.forEach(ax => {
      const p = projVec(...ax.v);
      ctx.strokeStyle = ax.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      ctx.fillStyle = ax.color;
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(ax.name, p.x + 3, p.y + 3);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(originX, originY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animation Loop
  function renderFrame() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);

    const cCyan = '#39D9FF';
    const cCyanDim = (a) => `rgba(57, 217, 255, ${a})`;
    const cAmber = '#FFB547';
    const cAmberDim = (a) => `rgba(255, 181, 71, ${a})`;

    if (autoRotate && !isDragging) {
      rotY += 0.005;
    }

    // Handle exploded view transition
    const targetOffset = (viewMode === 'exploded') ? 45 : 0;
    explodedOffset += (targetOffset - explodedOffset) * 0.1;

    // Update Telemetry Angle
    if (angleReadout) {
      const degY = Math.round(((rotY * 180 / Math.PI) % 360 + 360) % 360);
      const degX = Math.round((rotX * 180 / Math.PI));
      angleReadout.textContent = `YAW: ${degY}° | PITCH: ${degX}°`;
    }

    // 1. Draw Subtle Target Grid on Base Floor
    ctx.save();
    ctx.strokeStyle = cCyanDim(0.08);
    ctx.lineWidth = 1;
    const floorY = -135;
    for (let gridR = 40; gridR <= 120; gridR += 40) {
      ctx.beginPath();
      const floorSteps = 24;
      for (let i = 0; i <= floorSteps; i++) {
        const theta = (i / floorSteps) * Math.PI * 2;
        const pt = project({ x: gridR * Math.cos(theta), y: floorY, z: gridR * Math.sin(theta) }, 0);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Injector Flange (with exploded offset if active)
    const flangeOffset = explodedOffset * 1.5;
    ctx.save();
    ctx.strokeStyle = cCyan;
    ctx.lineWidth = 1.2;

    for (let rIdx = 0; rIdx < geometry.flangeRings.length; rIdx++) {
      const ring = geometry.flangeRings[rIdx];
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const pt = project(ring[i], flangeOffset);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Connect vertical flange edges
    for (let i = 0; i < geometry.flangeRings[0].length; i += 3) {
      const pTop = project(geometry.flangeRings[0][i], flangeOffset);
      const pBot = project(geometry.flangeRings[geometry.flangeRings.length - 1][i], flangeOffset);
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBot.x, pBot.y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Draw Inner TPMS Lattice Structure (DfAM feature)
    if (viewMode === 'exploded' || viewMode === 'wireframe') {
      ctx.save();
      ctx.strokeStyle = cAmberDim(0.55); // Amber for lattice
      ctx.lineWidth = 1;
      for (let i = 0; i < geometry.latticeRods.length; i++) {
        const rod = geometry.latticeRods[i];
        const p1 = project(rod[0], explodedOffset * 0.5);
        const p2 = project(rod[1], explodedOffset * 0.5);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Draw Combustion Chamber Rings
    const chamberOffset = explodedOffset * 0.5;
    ctx.save();
    ctx.strokeStyle = cCyanDim(0.45);
    ctx.lineWidth = 1;
    for (let rIdx = 0; rIdx < geometry.chamberRings.length; rIdx++) {
      const ring = geometry.chamberRings[rIdx];
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const pt = project(ring[i], chamberOffset);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // 5. Draw Converging-Diverging Nozzle Section
    const nozzleOffset = -explodedOffset * 0.8;
    ctx.save();
    ctx.strokeStyle = cCyanDim(0.85);
    ctx.lineWidth = 1.3;

    for (let rIdx = 0; rIdx < geometry.nozzleRings.length; rIdx++) {
      const item = geometry.nozzleRings[rIdx];
      // Draw throat ring and exit ring brighter
      if (item.z === 0 || rIdx === geometry.nozzleRings.length - 1) {
        ctx.strokeStyle = cCyan;
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = cCyanDim(0.35);
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      for (let i = 0; i < item.ring.length; i++) {
        const pt = project(item.ring[i], nozzleOffset);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Longitudinal profile contour lines (quadrant meridians)
    ctx.strokeStyle = cCyan;
    ctx.lineWidth = 1.2;
    for (let q = 0; q < 24; q += 6) {
      ctx.beginPath();
      for (let rIdx = 0; rIdx < geometry.nozzleRings.length; rIdx++) {
        const pt = project(geometry.nozzleRings[rIdx].ring[q], nozzleOffset);
        if (rIdx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 6. Draw Helical Conformal Cooling Passages
    if (viewMode === 'channels' || viewMode === 'wireframe') {
      ctx.save();
      ctx.strokeStyle = (viewMode === 'channels') ? cCyan : cCyanDim(0.22);
      ctx.lineWidth = (viewMode === 'channels') ? 1.6 : 0.8;

      for (let c = 0; c < geometry.coolingChannels.length; c++) {
        const ch = geometry.coolingChannels[c];
        ctx.beginPath();
        for (let s = 0; s < ch.length; s++) {
          const pt = project(ch[s], nozzleOffset);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. Technical Dimension Line Annotation (Exit Diameter)
    ctx.save();
    const exitRing = geometry.nozzleRings[geometry.nozzleRings.length - 1];
    if (exitRing) {
      const pLeft = project(exitRing.ring[6], nozzleOffset);
      const pRight = project(exitRing.ring[18], nozzleOffset);

      if (pLeft.visible && pRight.visible) {
        ctx.strokeStyle = cAmberDim(0.7);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        const dimDropY = 22;
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pLeft.x, pLeft.y + dimDropY);
        ctx.moveTo(pRight.x, pRight.y);
        ctx.lineTo(pRight.x, pRight.y + dimDropY);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y + dimDropY);
        ctx.lineTo(pRight.x, pRight.y + dimDropY);
        ctx.stroke();

        // Label
        const midX = (pLeft.x + pRight.x) / 2;
        const midY = pLeft.y + dimDropY;
        ctx.fillStyle = cAmber;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Ø EXIT: 152mm', midX, midY + 12);
      }
    }
    ctx.restore();

    // 8. Draw Gizmo & Status
    drawAxisGizmo(36, h - 36);

    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);

  // Mouse & Touch Interactivity
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    rotY += dx * 0.008;
    rotX += dy * 0.008;
    // Limit pitch to prevent inversion
    rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX));
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevMouseX;
    const dy = e.touches[0].clientY - prevMouseY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX));
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });

  // Scroll to Zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    scale = Math.max(0.75, Math.min(2.4, scale + zoomDelta));
  }, { passive: false });

  // Controls Event Listeners
  const btnRotate = document.getElementById('cad-toggle-rotate');
  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      autoRotate = !autoRotate;
      btnRotate.classList.toggle('active', autoRotate);
      btnRotate.textContent = autoRotate ? 'ROTATE: ON' : 'ROTATE: OFF';
    });
  }

  const btnExplode = document.getElementById('cad-toggle-explode');
  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      if (viewMode === 'exploded') {
        viewMode = 'wireframe';
        btnExplode.classList.remove('active');
        btnExplode.textContent = 'EXPLODE: OFF';
      } else {
        viewMode = 'exploded';
        btnExplode.classList.add('active');
        btnExplode.textContent = 'EXPLODE: ON';
      }
    });
  }

  const btnChannels = document.getElementById('cad-toggle-channels');
  if (btnChannels) {
    btnChannels.addEventListener('click', () => {
      if (viewMode === 'channels') {
        viewMode = 'wireframe';
        btnChannels.classList.remove('active');
      } else {
        viewMode = 'channels';
        btnChannels.classList.add('active');
      }
    });
  }

  const btnReset = document.getElementById('cad-reset-view');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      rotX = 0.45;
      rotY = 0.65;
      scale = 1.35;
      viewMode = 'wireframe';
      if (btnExplode) {
        btnExplode.classList.remove('active');
        btnExplode.textContent = 'EXPLODE: OFF';
      }
      if (btnChannels) btnChannels.classList.remove('active');
    });
  }
})();
