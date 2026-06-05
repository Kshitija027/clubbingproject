/* =====================================================
   BA BA REEBA — script.js
   ===================================================== */

// ── Helper: clamp ──────────────────────────────────────
function clamp(val, max) {
  return Math.max(-max, Math.min(max, val));
}

// ── Helper: lerp ──────────────────────────────────────
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* =====================================================
   1. HERO NAV / MENU TOGGLE
   ===================================================== */
(function initMenu() {
  const btn          = document.getElementById('menuBtn');
  const grid         = document.getElementById('menuGrid');
  const overlay      = document.getElementById('menuOverlay');
  const desktopList  = document.getElementById('desktopNavList');
  const overlayLinks = overlay ? overlay.querySelectorAll('.menu-overlay__link') : [];

  let isOpen = false;

  function getIsLg() {
    return window.matchMedia('(min-width: 1024px)').matches;
  }

  function open() {
    isOpen = true;
    btn.setAttribute('aria-expanded', 'true');
    grid.classList.add('is-open');

    if (getIsLg()) {
      // desktop — animate nav list in header
      if (desktopList) desktopList.classList.add('is-open');
    } else {
      // mobile — full overlay
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  function close() {
    isOpen = false;
    btn.setAttribute('aria-expanded', 'false');
    grid.classList.remove('is-open');

    if (desktopList) desktopList.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => { isOpen ? close() : open(); });

  // Close overlay when clicking backdrop
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Close on overlay links
  overlayLinks.forEach(link => link.addEventListener('click', close));

  // ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });

  // Re-evaluate on resize (if shrinks below lg, close desktop nav)
  window.addEventListener('resize', () => {
    if (!isOpen) return;
    if (getIsLg()) {
      // switch from overlay to desktop mode
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (desktopList) desktopList.classList.add('is-open');
    } else {
      if (desktopList) desktopList.classList.remove('is-open');
    }
  });
})();


/* =====================================================
   2. ABOUT — scroll-bloom animations
   ===================================================== */
(function initAboutBloom() {
  const inner   = document.getElementById('aboutInner');
  const center  = document.getElementById('aboutCenter');
  const leftEl  = document.getElementById('aboutLeft');
  const rightEl = document.getElementById('aboutRight');
  const mobileL = document.getElementById('mobileLeft');
  const mobileR = document.getElementById('mobileRight');

  if (!inner) return;

  // We'll use a simpler scroll-based approach with IntersectionObserver for entrance
  // then scroll progress for the bloom/floating effect.

  // Initial hidden state (before JS kicks in for smoother experience)
  center.style.opacity  = '0';
  center.style.transform = 'scale(0.45)';
  if (leftEl)  { leftEl.style.opacity  = '0'; leftEl.style.transform  = 'scale(0.45) translateX(72px)'; }
  if (rightEl) { rightEl.style.opacity = '0'; rightEl.style.transform = 'scale(0.45) translateX(-72px)'; }
  if (mobileL) { mobileL.style.opacity = '0'; mobileL.style.transform = 'scale(0.45) translateX(72px)'; }
  if (mobileR) { mobileR.style.opacity = '0'; mobileR.style.transform = 'scale(0.45) translateX(-72px)'; }

  // Transitions
  const T = 'opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1)';
  center.style.transition  = T;
  if (leftEl)  leftEl.style.transition  = T;
  if (rightEl) rightEl.style.transition = T;
  if (mobileL) mobileL.style.transition = T;
  if (mobileR) mobileR.style.transition = T;

  let animated = false;

  function animate() {
    if (animated) return;
    animated = true;

    // Stagger: center first, then sides
    setTimeout(() => {
      center.style.opacity   = '1';
      center.style.transform = 'scale(1)';
    }, 0);

    setTimeout(() => {
      if (leftEl)  { leftEl.style.opacity  = '1'; leftEl.style.transform  = 'scale(1) translateX(0)'; }
      if (mobileL) { mobileL.style.opacity = '1'; mobileL.style.transform = 'scale(1) translateX(0)'; }
    }, 120);

    setTimeout(() => {
      if (rightEl) { rightEl.style.opacity = '1'; rightEl.style.transform = 'scale(1) translateX(0)'; }
      if (mobileR) { mobileR.style.opacity = '1'; mobileR.style.transform = 'scale(1) translateX(0)'; }
    }, 200);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) animate();
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

  obs.observe(inner);
})();


/* =====================================================
   3. GALLERY — scroll-driven image spread
   ===================================================== */
(function initGallery() {
  const scrollContainer = document.getElementById('galleryScroll');
  const imagesContainer = document.getElementById('galleryImages');
  if (!scrollContainer || !imagesContainer) return;

  const imgWraps = Array.from(imagesContainer.querySelectorAll('.gallery__img-wrap'));
  const total    = imgWraps.length;

  // Read data attributes
  const imageData = imgWraps.map(wrap => ({
    el:     wrap,
    tx:     parseFloat(wrap.dataset.x),
    ty:     parseFloat(wrap.dataset.y),
    tz:     parseInt(wrap.dataset.z, 10),
    rotate: parseFloat(wrap.dataset.rotate),
  }));

  // Apply z-index from data
  imageData.forEach(d => { d.el.style.zIndex = d.tz; });

  // Current animated values per image
  const state = imageData.map(() => ({ x: 0, y: 0, scale: 0.3, opacity: 0, rotate: 0 }));

  // Position scale based on screen
  function getPosScale() {
    if (window.innerWidth < 640)  return 0.54;
    if (window.innerWidth < 1024) return 0.80;
    return 1;
  }

  // Bounds to prevent overflow
  function getBounds() {
    const rect = imagesContainer.getBoundingClientRect();
    const w = rect.width  || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const imgW = window.innerWidth < 640 ? 116 : window.innerWidth < 1024 ? 132 : 152;
    const imgH = window.innerWidth < 640 ? 176 : window.innerWidth < 1024 ? 200 : 240;
    return {
      maxX: Math.max((w - imgW) / 2 - 20, 380),
      maxY: Math.max((h - imgH) / 2 - 20, 550),
    };
  }

  // Map a value through the custom progress curve (mirrors React code)
  function mapProgress(rawProgress) {
    // Input keyframes
    const inKeys  = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
    const outKeys = [0, 0.05, 0.16, 0.3, 0.48, 0.66, 0.84, 1];
    const p = Math.max(0, Math.min(1, rawProgress));
    for (let i = 1; i < inKeys.length; i++) {
      if (p <= inKeys[i]) {
        const t = (p - inKeys[i-1]) / (inKeys[i] - inKeys[i-1]);
        return outKeys[i-1] + t * (outKeys[i] - outKeys[i-1]);
      }
    }
    return 1;
  }

  function getScrollProgress() {
    const rect  = scrollContainer.getBoundingClientRect();
    const total_h = scrollContainer.offsetHeight;
    // "start start" to "end end"
    const scrolled = -rect.top;
    const maxScroll = total_h - window.innerHeight;
    return Math.max(0, Math.min(1, scrolled / maxScroll));
  }

  function render() {
    const rawProgress = getScrollProgress();
    const globalProgress = mapProgress(rawProgress);
    const posScale = getPosScale();
    const bounds   = getBounds();

    imageData.forEach((d, index) => {
      const start = (index / total) * 0.82;
      const end   = Math.min(start + 0.18, 1);

      // Per-image progress within its window
      let itemP = (globalProgress - start) / (end - start);
      itemP = Math.max(0, Math.min(1, itemP));

      const targetX       = clamp(itemP * d.tx * posScale, bounds.maxX);
      const targetY       = clamp(itemP * d.ty * posScale, bounds.maxY);
      const targetScale   = lerp(0.3, 1, itemP);
      const targetRotate  = lerp(0, d.rotate, itemP);

      // Opacity: 0 → 0 at 0–6%, then ramp to 1
      let targetOpacity;
      if (itemP < 0.06) {
        targetOpacity = lerp(0, 0.82, itemP / 0.06);
      } else {
        targetOpacity = lerp(0.82, 1, (itemP - 0.06) / 0.94);
      }

      // Smooth lerp for fluid motion
      const s = state[index];
      s.x       = lerp(s.x,       targetX,       0.12);
      s.y       = lerp(s.y,       targetY,       0.12);
      s.scale   = lerp(s.scale,   targetScale,   0.12);
      s.opacity = lerp(s.opacity, targetOpacity, 0.12);
      s.rotate  = lerp(s.rotate,  targetRotate,  0.12);

      d.el.style.transform = `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(${s.scale}) rotate(${s.rotate}deg)`;
      d.el.style.opacity   = s.opacity;
    });

    rafId = requestAnimationFrame(render);
  }

  let rafId = requestAnimationFrame(render);
})();


/* =====================================================
   4. EXPERIENCE SECTION — IntersectionObserver
   ===================================================== */
(function initExperience() {
  const items = document.querySelectorAll('.experience__item');
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.3 });

  items.forEach(item => obs.observe(item));
})();


/* =====================================================
   5. FOOTER — IntersectionObserver fade-in
   ===================================================== */
(function initFooter() {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        footer.classList.add('visible');
        obs.disconnect();
      }
    });
  }, { threshold: 0.15 });

  obs.observe(footer);
})();


/* =====================================================
   6. HERO VIDEO FALLBACK
   — If video can't play, ensure fallback bg is visible
   ===================================================== */
(function initHeroVideo() {
  const video = document.querySelector('.hero__video');
  const fallback = document.querySelector('.hero__video-fallback');
  if (!video) return;

  // Show fallback by default behind video
  // When video starts playing, hide fallback
  video.addEventListener('playing', () => {
    if (fallback) fallback.style.opacity = '0';
  });

  // On error, keep fallback visible and move it above overlay
  video.addEventListener('error', () => {
    if (fallback) fallback.style.zIndex = '1';
  });
})();
