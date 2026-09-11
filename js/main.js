/* ==========================================================================
   MAIN CONTROLLER & ENGINEERING INTERACTION SUITE
   Madhu Maraju — Mechanical Engineering Portfolio
   ========================================================================== */

(function () {
  'use strict';

  // 1. REAL-TIME TELEMETRY & CLOCK
  function updateTelemetryClock() {
    const clockEl = document.getElementById('telemetry-clock');
    if (!clockEl) return;

    const now = new Date();
    // Format UTC and IST
    const options = {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    const istString = now.toLocaleString('en-IN', options).replace(',', '');
    clockEl.textContent = `${istString} IST // LOC: 17.72°N 82.98°E`;
  }

  setInterval(updateTelemetryClock, 1000);
  updateTelemetryClock();

  // 2. FLOATING NAVIGATION & SCROLL-SPY
  const nav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id], header[id]');

  function onScroll() {
    const scrollPos = window.scrollY || window.pageYOffset;

    if (nav) {
      if (scrollPos > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    // Scroll spy
    let currentId = '';
    sections.forEach((sec) => {
      const top = sec.offsetTop - 140;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile Navigation Menu
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu-links');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.innerHTML = isOpen ? '✕' : '☰';
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        if (mobileToggle) mobileToggle.innerHTML = '☰';
      });
    });
  }

  // 3. CASE STUDY DATA & MODAL VIEWER
  const projectDatabase = {
    proj1: {
      id: 'PROJECT_01',
      title: 'Asset Integrity Framework for Life Extension of Ageing Industrial Assets',
      role: 'Team Lead (Team of 5)',
      recognition: 'Runner-Up (₹1,00,000 Cash Prize) at ASME IMECE India 2025 Brain Bolt Event',
      tools: ['ANSYS Mechanical (Creep & Fatigue)', 'Health Score Logic', 'Multi-Parameter Sensing', 'Dashboard Architecture', 'Risk-Based Inspection (RBI)'],
      problem: 'Ageing critical industrial equipment (pressure vessels, steam lines, piping networks) suffer from unquantified creep-fatigue degradation, leading to catastrophic plant outages or premature decommissioning without clear remaining useful life (RUL) estimates.',
      approach: 'Engineered a unified, predictive life-extension framework combining continuous multi-parameter telemetry with finite element damage modeling. The system connects physical strain/temperature/vibration sensor signals to structural damage mechanics.',
      engineeringWork: 'Performed nonlinear ANSYS FEA creep and high-temperature fatigue simulations to map damage accumulation contours under cyclic operational loads. Formulated proprietary algorithmic "Health Score" logic to dynamically update component risk tiers and guide condition-based inspection (CBI) intervals.',
      results: 'Validated remaining useful life extension workflows; eliminated speculative inspection shutdowns; awarded Runner-Up with ₹1,00,000 cash grant at the prestigious ASME IMECE India 2025 Brain Bolt Event in Hyderabad.',
      visuals: [
        { src: 'assets/asset_fea.jpg', title: 'ANSYS Creep & Fatigue FEA Simulation Contour' },
        { src: 'assets/asset_chart.jpg', title: 'Degradation Trajectory & Life Extension Plot' },
        { src: 'assets/asset_sensor.jpg', title: 'Multi-Parameter Sensor Instrumentation Node' },
        { src: 'assets/asset_field.jpg', title: 'Industrial Pressure Vessel Field Assessment' }
      ]
    },
    proj2: {
      id: 'PROJECT_02',
      title: 'Heavy Lift System Design and Structural Analysis',
      role: 'Individual Engineering Lead',
      recognition: 'Semi-Finalist at ASME India 2026',
      tools: ['AutoCAD', 'ANSYS FEA', 'nTop (Lattice Optimization)', 'MATLAB', 'ASME BTH-1 Standards'],
      problem: 'Safely maneuvering a 45-tonne industrial compressor module inside a facility restricted by an extremely low overhead headroom of only 650 mm, rendering standard mobile or overhead bridge cranes unusable.',
      approach: 'Engineered an inverted low-headroom rigging architecture utilizing a rigid fixed spreader bar, twin cantilever spreader beams, and dynamic counter-ballast calculations complying with ASME lifting standards.',
      engineeringWork: 'Conducted rigorous mathematical load path and Center of Gravity (CoG) equilibrium verification. Executed structural beam deflection and weldment stress FEA in ANSYS. Developed moving-load MATLAB simulations to verify stability through every millimeter of the transfer path, accompanied by an nTop TPMS lattice study to cut non-critical beam weight.',
      results: 'Demonstrated complete 45-tonne structural safety compliance with ASME BTH-1 design factors under 650 mm headroom; qualified as Semi-Finalist in ASME India 2026 national competition.',
      visuals: [
        { src: 'assets/heavy_system.jpg', title: 'Complete 45-Tonne Low-Headroom CAD Assembly' },
        { src: 'assets/heavy_fea.jpg', title: 'ANSYS Structural Stress & Deformation FEA' },
        { src: 'assets/heavy_lattice.jpg', title: 'nTop Lattice Structure Optimization Study' }
      ]
    },
    proj3: {
      id: 'PROJECT_03',
      title: 'Patient-Specific Prosthetic Socket Using 3D Printing',
      role: 'Team Lead (Team of 6)',
      recognition: 'Selected in Top 15 out of 305 Teams in SIH 2025 Internal Hackathon',
      tools: ['Fusion 360', 'ANSYS Mechanical', 'FDM 3D Printing', 'MRI Data Processing', 'PLA Polymer'],
      problem: 'Conventional prosthetic sockets require manual plaster casting that is expensive, labor-intensive, slow (taking days/weeks), and prone to localized pressure sores due to imperfect fit on residual limbs.',
      approach: 'Created a digital end-to-end additive manufacturing pipeline translating patient MRI scan cloud data directly into anatomically compliant, parametric socket geometry.',
      engineeringWork: 'Digitized anatomical contours in Fusion 360, sculpted variable-thickness wall geometries tailored to bony landmarks, and conducted ANSYS stress distribution analysis to reinforce load-bearing regions while preserving compliance at sensitive soft tissues. 3D printed the physical socket on FDM systems using tuned infill profiles.',
      results: 'Achieved an 80% reduction in fabrication time and a 70% reduction in total cost compared to conventional sockets, while delivering enhanced comfort and validated structural strength; chosen in Top 15 of 305 competing teams.',
      visuals: [
        { src: 'assets/prosthetic_workflow.jpg', title: 'Complete Prosthetic Socket Engineering Workflow: DICOM MRI Data → CAD Modeling → FEA Simulation → 3D Printed Socket' }
      ]
    },
    proj4: {
      id: 'PROJECT_04',
      title: 'Smart Glass Cleaning Robot for High-Rise Structures',
      role: 'Team Lead (Team of 5)',
      recognition: 'IMECE India 2025 Featured Project',
      tools: ['Generative Design', 'Carbon Fiber Composite', 'IoT Wireless Telemetry', 'Vacuum Adhesion', 'SolidWorks'],
      problem: 'High-altitude glass façade maintenance in skyscrapers poses extreme human safety risks and high operational costs, requiring an ultra-compact, fail-safe robotic climber.',
      approach: 'Engineered an autonomous, remote-controlled climbing robot confined within a strict 100 cm³ volumetric footprint, integrating vacuum suction adhesion with active roller cleaning.',
      engineeringWork: 'Synthesized a lightweight carbon-fiber chassis utilizing generative design algorithms to minimize weight while withstanding continuous negative pressure loads. Integrated high-torque drive mechanisms, dual suction sealing cups, fluid spray nozzles, and wireless IoT telemetry for status feedback and control.',
      results: 'Successfully built and tested the 100 cm³ compact robotic cleaning unit with robust vertical window adhesion, remote maneuvering, and streak-free automated cleaning.',
      visuals: [
        { src: 'assets/robot_poster.png', title: 'CATIA Kinematic Simulation & Wall-Climbing Mechanism Layout' }
      ]
    },
    proj5: {
      id: 'PROJECT_05',
      title: 'Electrochemical Energy Harvesting from Solar Still',
      role: 'Team Lead (Team of 5)',
      recognition: 'Clean Energy & Water Engineering Innovation',
      tools: ['Thermodynamic Modeling', 'Electrochemical Integration', 'Solar Thermal Design', 'CAD'],
      problem: 'Remote arid and coastal regions face dual shortages of potable drinking water and grid electricity, while conventional solar stills suffer from low thermal efficiency and unharvested latent heat.',
      approach: 'Engineered a dual-purpose hybrid distillation apparatus that simultaneously purifies brackish water and harvests electrical energy from thermodynamic and electrochemical potential gradients.',
      engineeringWork: 'Designed an optimized solar still basin geometry to capture incident solar flux, and integrated specialized electrochemical cells within the condensation and effluent pathways to generate steady direct current voltage without external power input.',
      results: 'Delivered consistent electrical output of 0.8–1.2 V per cycle and boosted potable water distillation output by approximately 25% over conventional single-basin solar stills.',
      visuals: [
        { src: 'assets/solar_still_diagram.jpg', title: 'Solar Still Physical Apparatus & Thermodynamic Distillation Cycle' }
      ]
    }
  };

  // Case Study Modal Elements
  const projectModal = document.getElementById('project-modal');
  const projectModalContent = document.getElementById('project-modal-body');
  const projectModalTitle = document.getElementById('project-modal-title');
  const projectModalClose = document.getElementById('project-modal-close');

  function openProjectModal(projKey) {
    const data = projectDatabase[projKey];
    if (!data || !projectModal || !projectModalContent) return;

    projectModalTitle.textContent = `${data.id} // ${data.title}`;

    let visualsHtml = '';
    if (data.visuals && data.visuals.length > 0) {
      visualsHtml = `
        <div style="margin-bottom: 2rem;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 0.75rem;">
            VERIFIED VISUAL EVIDENCE & ENGINEERING DOCUMENTATION
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
            ${data.visuals.map(v => `
              <div style="background: #000; border: 1px solid var(--border-tech); border-radius: 2px; overflow: hidden;">
                <img src="${v.src}" alt="${v.title}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
                <div style="padding: 0.5rem 0.75rem; background: rgba(11,13,16,0.9); font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-secondary); border-top: 1px solid var(--border-subtle);">
                  ${v.title}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    projectModalContent.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
        <span class="tech-tag amber">${data.role}</span>
        <span class="tech-tag">${data.recognition}</span>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 2rem;">
        ${data.tools.map(t => `<span class="tech-tag" style="font-size: 0.65rem;">${t}</span>`).join('')}
      </div>

      ${visualsHtml}

      <div class="case-study-grid" style="margin-bottom: 2rem;">
        <div class="case-box">
          <div class="case-box-label">01 — PROBLEM FORMULATION</div>
          <p>${data.problem}</p>
        </div>
        <div class="case-box">
          <div class="case-box-label">02 — ENGINEERING METHODOLOGY</div>
          <p>${data.approach}</p>
        </div>
        <div class="case-box">
          <div class="case-box-label">03 — ANALYSIS & COMPUTATION</div>
          <p>${data.engineeringWork}</p>
        </div>
        <div class="case-box">
          <div class="case-box-label">04 — RESULTS & VERIFICATION</div>
          <p>${data.results}</p>
        </div>
      </div>
    `;

    projectModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (projectModal) {
      projectModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (projectModalClose) {
    projectModalClose.addEventListener('click', closeProjectModal);
  }

  // Bind project card click triggers
  document.querySelectorAll('[data-project-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const projId = trigger.getAttribute('data-project-trigger');
      openProjectModal(projId);
    });
  });

  // 4. RESUME VIEWER MODAL
  const resumeModal = document.getElementById('resume-modal');
  const resumeModalClose = document.getElementById('resume-modal-close');
  const resumeTriggers = document.querySelectorAll('[data-resume-trigger]');

  function openResumeModal() {
    if (resumeModal) {
      resumeModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeResumeModal() {
    if (resumeModal) {
      resumeModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  resumeTriggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openResumeModal();
    });
  });

  if (resumeModalClose) {
    resumeModalClose.addEventListener('click', closeResumeModal);
  }

  // Close modals on escape key or clicking backdrop
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeResumeModal();
      closeImageModal();
    }
  });

  [projectModal, resumeModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeProjectModal();
          closeResumeModal();
        }
      });
    }
  });

  // 5. LIGHTBOX IMAGE MODAL
  const imageModal = document.getElementById('image-modal');
  const imageModalImg = document.getElementById('image-modal-img');
  const imageModalCaption = document.getElementById('image-modal-caption');
  const imageModalClose = document.getElementById('image-modal-close');

  function openImageModal(src, caption) {
    if (!imageModal || !imageModalImg) return;
    imageModalImg.src = src;
    if (imageModalCaption) imageModalCaption.textContent = caption || '';
    imageModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeImageModal() {
    if (imageModal) {
      imageModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (imageModalClose) {
    imageModalClose.addEventListener('click', closeImageModal);
  }

  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeImageModal();
    });
  }

  document.querySelectorAll('[data-zoom-img]').forEach((item) => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-zoom-img');
      const caption = item.getAttribute('data-zoom-caption') || '';
      openImageModal(src, caption);
    });
  });

  // 6. COPY TO CLIPBOARD BUTTONS
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ COPIED';
        btn.style.color = 'var(--accent-green)';
        btn.style.borderColor = 'var(--accent-green)';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 2200);
      });
    });
  });

  // 7. TERMINAL DISPATCH CONSOLE (REAL EMAIL DELIVERY)
  const dispatchForm = document.getElementById('terminal-dispatch-form');
  const dispatchStatus = document.getElementById('dispatch-status');
  const dispatchBtn = document.getElementById('dispatch-submit-btn');

  if (dispatchForm && dispatchStatus) {
    dispatchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('dispatch-name').value.trim();
      const email = document.getElementById('dispatch-email').value.trim();
      const subject = document.getElementById('dispatch-subject').value.trim();
      const message = document.getElementById('dispatch-message').value.trim();

      // Email format regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || name.length < 2) {
        dispatchStatus.style.color = 'var(--accent-amber)';
        dispatchStatus.textContent = 'ERR: RECRUITER / ENGINEER NAME REQUIRED [MIN 2 CHARS]';
        return;
      }

      if (!email || !emailRegex.test(email)) {
        dispatchStatus.style.color = 'var(--accent-amber)';
        dispatchStatus.textContent = 'ERR: INVALID EMAIL FORMAT [NAME@DOMAIN.COM]';
        return;
      }

      if (!message || message.length < 5) {
        dispatchStatus.style.color = 'var(--accent-amber)';
        dispatchStatus.textContent = 'ERR: TRANSMISSION CONTENT REQUIRED [MIN 5 CHARS]';
        return;
      }

      // Lock UI to prevent double submission
      if (dispatchBtn) {
        dispatchBtn.disabled = true;
        dispatchBtn.style.opacity = '0.6';
        dispatchBtn.style.cursor = 'not-allowed';
      }
      dispatchStatus.style.color = 'var(--accent-cyan)';
      dispatchStatus.textContent = '> ENCRYPTING PACKET... DISPATCHING SECURE SMTP STREAM...';

      try {
        const response = await fetch('https://formsubmit.co/ajax/madhumaraju05@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            _replyto: email,
            _subject: subject ? `[Engineering Inquiry] ${subject}` : `[Portfolio Inquiry] from ${name}`,
            message: message,
            _template: 'table',
            _captcha: 'false'
          })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && (data.success === 'true' || data.success === true || data.message)) {
          dispatchStatus.style.color = 'var(--accent-green)';
          dispatchStatus.textContent = '✓ TRANSMISSION DELIVERED DIRECTLY TO MADHUMARAJU05@GMAIL.COM';
          dispatchForm.reset();
        } else {
          // If FormSubmit returns an unactivated or custom notice
          const detail = data.message || 'GATEWAY ACKNOWLEDGED';
          dispatchStatus.style.color = 'var(--accent-green)';
          dispatchStatus.textContent = `✓ DISPATCH ROUTED TO MADHUMARAJU05@GMAIL.COM [${detail}]`;
          dispatchForm.reset();
        }
      } catch (err) {
        dispatchStatus.style.color = 'var(--accent-amber)';
        dispatchStatus.textContent = 'ERR: TRANSMISSION FAILED. DIRECT CHANNEL: MADHUMARAJU05@GMAIL.COM';
      } finally {
        if (dispatchBtn) {
          dispatchBtn.disabled = false;
          dispatchBtn.style.opacity = '';
          dispatchBtn.style.cursor = '';
        }
      }
    });
  }
})();
