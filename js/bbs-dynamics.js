/* ==========================================================================
   IIT BHUBANESWAR RESEARCH VISUALIZATION: NONLINEAR VIBRO-IMPACT DYNAMICS
   Mathematical Model: Piecewise Continuous SDOF Vibro-Impact System with
   Coulomb Friction and Coefficient of Restitution (saNDY Group, IIT BBS)
   Numerical Method: 4th-Order Runge-Kutta (RK4) with Discontinuous Velocity Map
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('bbs-dynamics-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;

  // Physical System Parameters (Non-dimensionalized from IIT BBS Research)
  const params = {
    omega_n: 1.0,        // Natural angular frequency
    zeta: 0.045,         // Viscous damping ratio (c / 2m*omega_n)
    mu_g: 0.12,          // Coulomb dry friction term
    F0: 0.85,            // Excitation force amplitude
    omega: 1.0,          // Excitation frequency ratio (omega / omega_n)
    xc: 1.0,             // Clearance barrier distance (stops at +xc and -xc)
    restitution: 0.82    // Coefficient of restitution at barrier impact (e)
  };

  // State Variables
  let x = 0.2;           // Displacement (-xc <= x <= xc)
  let v = 0.0;           // Velocity (dx/dt)
  let simTime = 0.0;     // Continuous simulation time
  let isRunning = true;
  let viewMode = 'dual'; // 'dual', 'phase', 'time'
  let freqIndex = 0;
  const freqOptions = [
    { label: 'FREQ: 1.0 ω/ωn', omega: 1.0, orbit: 'PERIODIC (P-1)' },
    { label: 'FREQ: 0.5 ω/ωn', omega: 0.5, orbit: 'SUB-HARMONIC (P-2)' },
    { label: 'FREQ: 1.45 ω/ωn', omega: 1.45, orbit: 'PERIOD-DOUBLING (P-4)' }
  ];

  // History Buffers for Visualization
  const maxTimeSamples = 240;
  const timeHistory = [];      // { t, x, v, impacted }
  const maxPhaseSamples = 320;
  const phaseHistory = [];     // { x, v, impacted }
  const poincarePoints = [];   // Samples taken at each period T = 2pi / omega
  let lastPoincarePhase = 0;

  // Interaction State
  let isInteracting = false;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    width = canvas.width = rect.width * dpr;
    height = canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  setTimeout(resize, 80);
  resize();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) resize();
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);
  }

  // Derivatives function for RK4: f(t, x, v) = acceleration
  function calcAcceleration(t, currX, currV) {
    // SDOF governing ODE: x'' = -2*zeta*w_n*x' - w_n^2*x - mu*g*tanh(12*x') + F0*cos(w*t)
    const restoring = -Math.pow(params.omega_n, 2) * currX;
    const damping = -2 * params.zeta * params.omega_n * currV;
    const friction = -params.mu_g * Math.tanh(12 * currV); // Smooth Coulomb stick-slip model
    const excitation = params.F0 * Math.cos(params.omega * t);
    return restoring + damping + friction + excitation;
  }

  // Single step of 4th-Order Runge-Kutta (RK4) integration
  function rk4Step(dt) {
    const k1_x = v;
    const k1_v = calcAcceleration(simTime, x, v);

    const k2_x = v + 0.5 * dt * k1_v;
    const k2_v = calcAcceleration(simTime + 0.5 * dt, x + 0.5 * dt * k1_x, v + 0.5 * dt * k1_v);

    const k3_x = v + 0.5 * dt * k2_v;
    const k3_v = calcAcceleration(simTime + 0.5 * dt, x + 0.5 * dt * k2_x, v + 0.5 * dt * k2_v);

    const k4_x = v + dt * k3_v;
    const k4_v = calcAcceleration(simTime + dt, x + dt * k3_x, v + dt * k3_v);

    let nextX = x + (dt / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x);
    let nextV = v + (dt / 6) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v);
    let impacted = false;

    // Discontinuous Impact Restitution Map at clearance stops (+/- xc)
    if (nextX >= params.xc) {
      nextX = params.xc;
      if (nextV > 0) {
        nextV = -params.restitution * nextV;
        impacted = true;
      }
    } else if (nextX <= -params.xc) {
      nextX = -params.xc;
      if (nextV < 0) {
        nextV = -params.restitution * nextV;
        impacted = true;
      }
    }

    x = nextX;
    v = nextV;
    simTime += dt;

    // Poincare Stroboscopic Sampling (once per period T = 2*pi / omega)
    const T = (Math.PI * 2) / params.omega;
    const currPhase = (simTime % T) / T;
    if (currPhase < lastPoincarePhase) {
      // Completed one cycle
      poincarePoints.push({ x, v });
      if (poincarePoints.length > 35) poincarePoints.shift();
    }
    lastPoincarePhase = currPhase;

    return impacted;
  }

  // Telemetry elements
  const stateReadout = document.getElementById('bbs-state-readout');
  const orbitReadout = document.getElementById('bbs-orbit-readout');
  const specReadout = document.getElementById('bbs-spec-readout');

  // Animation and Simulation Loop
  function render() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);

    // Run numerical integration sub-steps when not paused
    let didImpact = false;
    if (isRunning && !isInteracting) {
      const subSteps = 6;
      const subDt = 0.035 / subSteps;
      for (let s = 0; s < subSteps; s++) {
        if (rk4Step(subDt)) didImpact = true;
      }

      // Record History
      timeHistory.push({ t: simTime, x, v, impacted: didImpact });
      if (timeHistory.length > maxTimeSamples) timeHistory.shift();

      phaseHistory.push({ x, v, impacted: didImpact });
      if (phaseHistory.length > maxPhaseSamples) phaseHistory.shift();

      // Update Telemetry readouts periodically
      if (stateReadout && Math.floor(simTime * 20) % 4 === 0) {
        const signV = v >= 0 ? '+' : '';
        const dispPercent = (x / params.xc).toFixed(2);
        stateReadout.textContent = `STATE: ẋ = ${signV}${v.toFixed(2)} m/s | x = ${dispPercent} Xc`;
      }
      if (orbitReadout) {
        orbitReadout.textContent = `ORBIT: ${freqOptions[freqIndex].orbit}`;
      }
      if (specReadout) {
        specReadout.textContent = `e = ${params.restitution.toFixed(2)} | μ = ${params.mu_g.toFixed(2)} | ζ = ${params.zeta.toFixed(3)}`;
      }
    }

    // Color constants matching CAD Blueprint design language
    const cCyan = '#39D9FF';
    const cCyanDim = (a) => `rgba(57, 217, 255, ${a})`;
    const cAmber = '#FFB547';
    const cAmberDim = (a) => `rgba(255, 181, 71, ${a})`;
    const cGreen = '#2ED573';

    // Draw viewport sections based on viewMode
    if (viewMode === 'dual') {
      const topHeight = h * 0.48;
      const botTop = h * 0.52;
      const botHeight = h * 0.48;

      // 1. TOP PANE: TIME-HISTORY RESPONSE x(t)
      drawTimeHistoryPane(0, 0, w, topHeight, cCyan, cCyanDim, cAmber, cAmberDim);

      // Dividing Blueprint Datum Line
      ctx.save();
      ctx.strokeStyle = cCyanDim(0.2);
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(12, h * 0.5);
      ctx.lineTo(w - 12, h * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 2. BOTTOM PANE: PHASE PORTRAIT (x vs dx/dt)
      drawPhasePortraitPane(0, botTop, w, botHeight, cCyan, cCyanDim, cAmber, cAmberDim, cGreen);
    } else if (viewMode === 'phase') {
      drawPhasePortraitPane(0, 0, w, h, cCyan, cCyanDim, cAmber, cAmberDim, cGreen);
    } else {
      drawTimeHistoryPane(0, 0, w, h, cCyan, cCyanDim, cAmber, cAmberDim);
    }

    requestAnimationFrame(render);
  }

  // Draw Time-History Waveform x(t)
  function drawTimeHistoryPane(x0, y0, pw, ph, cCyan, cCyanDim, cAmber, cAmberDim) {
    const padL = 42;
    const padR = 24;
    const padT = 24;
    const padB = 20;
    const graphW = pw - padL - padR;
    const graphH = ph - padT - padB;
    const midY = y0 + padT + graphH / 2;

    // Background Grid
    ctx.save();
    ctx.strokeStyle = cCyanDim(0.06);
    ctx.lineWidth = 1;
    for (let gx = padL; gx <= pw - padR; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, y0 + padT);
      ctx.lineTo(gx, y0 + padT + graphH);
      ctx.stroke();
    }
    for (let gy = y0 + padT; gy <= y0 + padT + graphH; gy += graphH / 4) {
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(pw - padR, gy);
      ctx.stroke();
    }

    // Zero Datum Axis
    ctx.strokeStyle = cCyanDim(0.25);
    ctx.beginPath();
    ctx.moveTo(padL, midY);
    ctx.lineTo(pw - padR, midY);
    ctx.stroke();

    // Clearance Stops +/- Xc (Impact Barriers)
    const barrierOffset = (graphH / 2) * 0.78; // Maps xc
    const topBarrierY = midY - barrierOffset;
    const botBarrierY = midY + barrierOffset;

    ctx.strokeStyle = cAmberDim(0.65);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;

    // +Xc barrier
    ctx.beginPath();
    ctx.moveTo(padL, topBarrierY);
    ctx.lineTo(pw - padR, topBarrierY);
    ctx.stroke();

    // -Xc barrier
    ctx.beginPath();
    ctx.moveTo(padL, botBarrierY);
    ctx.lineTo(pw - padR, botBarrierY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Barrier Labels
    ctx.fillStyle = cAmber;
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('+Xc STOP', padL - 6, topBarrierY + 3);
    ctx.fillText('-Xc STOP', padL - 6, botBarrierY + 3);
    ctx.fillStyle = cCyanDim(0.7);
    ctx.fillText('0', padL - 6, midY + 3);

    // Header Label for Time-History
    ctx.fillStyle = cCyanDim(0.85);
    ctx.textAlign = 'left';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('TIME-HISTORY RESPONSE: x(t) vs TIME', padL, y0 + 14);

    // Draw Continuous Response Waveform
    if (timeHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = cCyan;
      ctx.lineWidth = 1.6;

      for (let i = 0; i < timeHistory.length; i++) {
        const item = timeHistory[i];
        const px = padL + (i / (maxTimeSamples - 1)) * graphW;
        const py = midY - (item.x / params.xc) * barrierOffset;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current State Head Dot with Impact Flare
      const latest = timeHistory[timeHistory.length - 1];
      const headX = padL + graphW;
      const headY = midY - (latest.x / params.xc) * barrierOffset;

      ctx.fillStyle = latest.impacted ? '#FF5F56' : cCyan;
      ctx.beginPath();
      ctx.arc(headX, headY, latest.impacted ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      if (latest.impacted) {
        ctx.strokeStyle = 'rgba(255, 95, 86, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(headX, headY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Mini Physical Schematic in upper right (Mass vibrating between rigid stops)
    drawPhysicalSchematic(pw - 110, y0 + 6, 95, 28, cCyan, cAmber);

    ctx.restore();
  }

  // Draw Physical Schematic: Block between 2 barrier walls with spring
  function drawPhysicalSchematic(sx, sy, sw, sh, cCyan, cAmber) {
    ctx.save();
    ctx.fillStyle = 'rgba(11, 14, 19, 0.85)';
    ctx.strokeStyle = 'rgba(57, 217, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.fillRect(sx, sy, sw, sh);

    const midY = sy + sh / 2;
    const leftWall = sx + 8;
    const rightWall = sx + sw - 8;

    // Draw rigid stop plates
    ctx.strokeStyle = cAmber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftWall, sy + 4);
    ctx.lineTo(leftWall, sy + sh - 4);
    ctx.moveTo(rightWall, sy + 4);
    ctx.lineTo(rightWall, sy + sh - 4);
    ctx.stroke();

    // Mass position mapped inside walls
    const travelRange = (rightWall - leftWall - 22);
    const blockX = leftWall + 11 + (x / params.xc) * (travelRange / 2);
    const blockW = 16;
    const blockH = 14;

    // Spring on left
    ctx.strokeStyle = 'rgba(57, 217, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftWall, midY);
    const coils = 5;
    const springStep = (blockX - blockW / 2 - leftWall) / coils;
    for (let c = 0; c < coils; c++) {
      const cx1 = leftWall + c * springStep + springStep * 0.25;
      const cy1 = midY - 4;
      const cx2 = leftWall + c * springStep + springStep * 0.75;
      const cy2 = midY + 4;
      ctx.lineTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
    }
    ctx.lineTo(blockX - blockW / 2, midY);
    ctx.stroke();

    // Mass Block
    ctx.fillStyle = '#1A2330';
    ctx.strokeStyle = cCyan;
    ctx.lineWidth = 1.2;
    ctx.fillRect(blockX - blockW / 2, midY - blockH / 2, blockW, blockH);
    ctx.strokeRect(blockX - blockW / 2, midY - blockH / 2, blockW, blockH);

    ctx.fillStyle = cCyan;
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('m', blockX, midY + 2.5);

    ctx.restore();
  }

  // Draw Phase Portrait Pane (Displacement x vs Velocity dx/dt)
  function drawPhasePortraitPane(x0, y0, pw, ph, cCyan, cCyanDim, cAmber, cAmberDim, cGreen) {
    const padL = 42;
    const padR = 24;
    const padT = 24;
    const padB = 22;
    const graphW = pw - padL - padR;
    const graphH = ph - padT - padB;
    const centerX = padL + graphW / 2;
    const centerY = y0 + padT + graphH / 2;

    const scaleX = (graphW / 2) * 0.72; // Maps x = 1.0 (xc)
    const scaleV = (graphH / 2) * 0.42; // Maps velocity

    ctx.save();

    // Subtle Radial Grid / Reticle
    ctx.strokeStyle = cCyanDim(0.07);
    ctx.lineWidth = 1;
    for (let r = 25; r <= Math.max(graphW, graphH) / 2; r += 35) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Phase Axes (x and dx/dt)
    ctx.strokeStyle = cCyanDim(0.3);
    ctx.beginPath();
    ctx.moveTo(padL, centerY);
    ctx.lineTo(pw - padR, centerY);
    ctx.moveTo(centerX, y0 + padT);
    ctx.lineTo(centerX, y0 + padT + graphH);
    ctx.stroke();

    // Axis Arrows & Labels
    ctx.fillStyle = cCyanDim(0.85);
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('+x', pw - padR, centerY - 4);
    ctx.textAlign = 'center';
    ctx.fillText('+ẋ (dx/dt)', centerX, y0 + padT + 8);

    // Barrier Lines at x = +xc and x = -xc
    ctx.strokeStyle = cAmberDim(0.6);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;

    const barRightX = centerX + scaleX;
    const barLeftX = centerX - scaleX;

    ctx.beginPath();
    ctx.moveTo(barRightX, y0 + padT);
    ctx.lineTo(barRightX, y0 + padT + graphH);
    ctx.moveTo(barLeftX, y0 + padT);
    ctx.lineTo(barLeftX, y0 + padT + graphH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stop Labels
    ctx.fillStyle = cAmber;
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+Xc', barRightX, y0 + padT + graphH + 12);
    ctx.fillText('-Xc', barLeftX, y0 + padT + graphH + 12);

    // Title Label
    ctx.fillStyle = cCyanDim(0.85);
    ctx.textAlign = 'left';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('PHASE PORTRAIT (x vs ẋ) & POINCARÉ LIMIT CYCLE', padL, y0 + 14);

    // Draw Orbit History Curve with Gradient Alpha
    if (phaseHistory.length > 2) {
      ctx.lineWidth = 1.4;
      for (let i = 1; i < phaseHistory.length; i++) {
        const p1 = phaseHistory[i - 1];
        const p2 = phaseHistory[i];
        const alpha = Math.max(0.15, (i / phaseHistory.length));

        // Detect velocity discontinuity across impact
        const isImpactJump = p2.impacted || Math.abs(p2.v - p1.v) > 0.8;
        ctx.strokeStyle = isImpactJump ? cAmberDim(alpha * 0.9) : cCyanDim(alpha * 0.9);

        ctx.beginPath();
        ctx.moveTo(centerX + p1.x * scaleX, centerY - p1.v * scaleV);
        ctx.lineTo(centerX + p2.x * scaleX, centerY - p2.v * scaleV);
        ctx.stroke();
      }
    }

    // Draw Stroboscopic Poincaré Section Points (Amber Stars)
    ctx.fillStyle = cAmber;
    poincarePoints.forEach(pt => {
      const px = centerX + pt.x * scaleX;
      const py = centerY - pt.v * scaleV;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Current State Orbit Cursor Dot
    const currPx = centerX + x * scaleX;
    const currPy = centerY - v * scaleV;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(currPx, currPy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = cCyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(currPx, currPy, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Interactive Dragging inside Phase Portrait to Perturb State
  canvas.addEventListener('mousedown', (e) => {
    isInteracting = true;
    handlePointer(e);
  });

  window.addEventListener('mouseup', () => {
    isInteracting = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isInteracting) return;
    handlePointer(e);
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isInteracting = true;
      handlePointer(e.touches[0]);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isInteracting = false;
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isInteracting || e.touches.length !== 1) return;
    handlePointer(e.touches[0]);
  }, { passive: true });

  function handlePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // If clicking in bottom half (Phase Portrait)
    const centerY = (viewMode === 'dual') ? h * 0.52 + (h * 0.48) / 2 : h / 2;
    const centerX = 42 + (w - 66) / 2;
    const scaleX = ((w - 66) / 2) * 0.72;
    const scaleV = (h / 2) * 0.42;

    const newX = (px - centerX) / scaleX;
    const newV = -(py - centerY) / scaleV;

    x = Math.max(-params.xc, Math.min(params.xc, newX));
    v = Math.max(-3.5, Math.min(3.5, newV));
  }

  // Control Buttons Event Listeners
  const btnToggleView = document.getElementById('bbs-toggle-view');
  if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
      if (viewMode === 'dual') {
        viewMode = 'phase';
        btnToggleView.textContent = 'VIEW: PHASE';
      } else if (viewMode === 'phase') {
        viewMode = 'time';
        btnToggleView.textContent = 'VIEW: TIME';
      } else {
        viewMode = 'dual';
        btnToggleView.textContent = 'VIEW: DUAL';
      }
    });
  }

  const btnToggleFreq = document.getElementById('bbs-toggle-freq');
  if (btnToggleFreq) {
    btnToggleFreq.addEventListener('click', () => {
      freqIndex = (freqIndex + 1) % freqOptions.length;
      params.omega = freqOptions[freqIndex].omega;
      btnToggleFreq.textContent = freqOptions[freqIndex].label;
      poincarePoints.length = 0; // Clear poincare map for new frequency
    });
  }

  const btnTogglePause = document.getElementById('bbs-toggle-pause');
  if (btnTogglePause) {
    btnTogglePause.addEventListener('click', () => {
      isRunning = !isRunning;
      btnTogglePause.classList.toggle('active', !isRunning);
      btnTogglePause.textContent = isRunning ? 'RUNNING' : 'PAUSED';
    });
  }

  const btnResetSim = document.getElementById('bbs-reset-sim');
  if (btnResetSim) {
    btnResetSim.addEventListener('click', () => {
      x = 0.25;
      v = 0.0;
      simTime = 0.0;
      timeHistory.length = 0;
      phaseHistory.length = 0;
      poincarePoints.length = 0;
      isRunning = true;
      if (btnTogglePause) {
        btnTogglePause.classList.remove('active');
        btnTogglePause.textContent = 'RUNNING';
      }
    });
  }

  requestAnimationFrame(render);
})();
