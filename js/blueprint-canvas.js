/* ==========================================================================
   BLUEPRINT CANVAS & COORDINATE TRACKER
   Interactive background blueprint canvas with precision coordinates
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('blueprint-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };
  let scrollY = 0;

  // Measurement marks & crosshairs
  const technicalMarks = [];
  const MARK_COUNT = 18;

  function initDimensions() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateMarks();
  }

  function generateMarks() {
    technicalMarks.length = 0;
    for (let i = 0; i < MARK_COUNT; i++) {
      technicalMarks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        type: Math.random() > 0.5 ? 'cross' : 'tick',
        size: 8 + Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.25,
        speedY: (Math.random() - 0.5) * 0.2,
        label: `MK-${Math.floor(100 + Math.random() * 900)}`
      });
    }
  }

  window.addEventListener('resize', initDimensions);
  initDimensions();

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;

    // Update coordinate readout in UI if elements exist
    const coordDisplay = document.getElementById('live-coord-readout');
    if (coordDisplay) {
      const normX = ((e.clientX / width) * 2 - 1).toFixed(2);
      const normY = (-(e.clientY / height) * 2 + 1).toFixed(2);
      coordDisplay.textContent = `X: ${normX} | Y: ${normY}`;
    }
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY || window.pageYOffset;
  }, { passive: true });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.y += (mouse.targetY - mouse.y) * 0.15;

    // 1. Draw technical reference marks (floating engineering datum points)
    ctx.save();
    for (let i = 0; i < technicalMarks.length; i++) {
      const m = technicalMarks[i];
      m.y += m.speedY;
      if (m.y < -20) m.y = height + 20;
      if (m.y > height + 20) m.y = -20;

      ctx.strokeStyle = `rgba(57, 217, 255, ${m.opacity})`;
      ctx.lineWidth = 1;

      if (m.type === 'cross') {
        ctx.beginPath();
        ctx.moveTo(m.x - m.size, m.y);
        ctx.lineTo(m.x + m.size, m.y);
        ctx.moveTo(m.x, m.y - m.size);
        ctx.lineTo(m.x, m.y + m.size);
        ctx.stroke();
      } else {
        // CAD corner tick
        ctx.beginPath();
        ctx.moveTo(m.x, m.y + m.size);
        ctx.lineTo(m.x, m.y);
        ctx.lineTo(m.x + m.size, m.y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Interactive crosshair if mouse is active
    if (mouse.active && mouse.x > 0 && mouse.y > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(57, 217, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      // Horizontal dashed guide line
      ctx.beginPath();
      ctx.moveTo(0, mouse.y);
      ctx.lineTo(width, mouse.y);
      ctx.stroke();

      // Vertical dashed guide line
      ctx.beginPath();
      ctx.moveTo(mouse.x, 0);
      ctx.lineTo(mouse.x, height);
      ctx.stroke();

      // Center crosshair ring
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(57, 217, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(57, 217, 255, 0.6)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`P(${Math.round(mouse.x)}, ${Math.round(mouse.y)})`, mouse.x + 18, mouse.y - 10);

      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
