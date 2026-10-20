/* ============================================================
   Lab Notebooks Deep Dive — Application Logic
   Interactive Tab Switching, Code Copy, Modal Handlers,
   Raw Notebook JSON Viewer, and Image Lightbox.
   ============================================================ */

(function () {
  'use strict';

  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinksContainer = document.getElementById('navLinks');
  if (mobileMenuBtn && navLinksContainer) {
    mobileMenuBtn.addEventListener('click', () => {
      const visible = navLinksContainer.style.display === 'flex';
      navLinksContainer.style.display = visible ? 'none' : 'flex';
      navLinksContainer.style.flexDirection = 'column';
      navLinksContainer.style.position = 'absolute';
      navLinksContainer.style.top = '64px';
      navLinksContainer.style.right = '16px';
      navLinksContainer.style.background = 'rgba(10,14,23,0.98)';
      navLinksContainer.style.backdropFilter = 'blur(20px)';
      navLinksContainer.style.padding = '14px';
      navLinksContainer.style.borderRadius = '12px';
      navLinksContainer.style.border = '1px solid rgba(255,255,255,0.08)';
    });
  }

  // 2. Tab Switching Logic for Notebooks
  const tabPills = document.querySelectorAll('.nb-nav-pill');
  const tabSections = document.querySelectorAll('.tab-content-block');
  const stickyNav = document.getElementById('stickySubnav');

  window.switchNotebookTab = function (targetId) {
    if (!targetId) targetId = 'nb-01';

    // Update active state on subnav pills
    tabPills.forEach(pill => {
      const isTarget = pill.getAttribute('data-target') === targetId;
      pill.classList.toggle('active', isTarget);
    });

    if (targetId === 'all') {
      // Show all notebook sections
      tabSections.forEach(sec => {
        sec.classList.remove('tab-hidden');
        sec.classList.add('tab-active');
      });
      if (stickyNav) {
        stickyNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Single tab view: display target section, hide others
    let targetSection = null;
    tabSections.forEach(sec => {
      const secTab = sec.getAttribute('data-tab') || sec.id;
      if (secTab === targetId) {
        sec.classList.remove('tab-hidden');
        sec.classList.add('tab-active');
        targetSection = sec;
      } else {
        sec.classList.add('tab-hidden');
        sec.classList.remove('tab-active');
      }
    });

    // Smooth scroll to sticky nav or section top
    if (stickyNav) {
      const yOffset = -70;
      const y = stickyNav.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    // Update hash without jumping
    if (history.replaceState) {
      history.replaceState(null, null, '#' + targetId);
    }
  };

  // Navbar link handlers
  document.querySelectorAll('.nb-tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-target');
      if (target) {
        e.preventDefault();
        window.switchNotebookTab(target);
      }
    });
  });

  // 3. Fallback Fade-in Observer (ensures no element stays hidden)
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 100px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => {
    fadeObserver.observe(el);
    // Instant fallback: ensure opacity is never blocked
    el.classList.add('visible');
  });

  // 4. Copy Code Block
  window.copyCode = function (btn) {
    const pre = btn.closest('.cell-block').querySelector('pre code');
    if (!pre) return;
    const text = pre.innerText;

    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerText;
      btn.innerText = '✓ Copied!';
      btn.style.borderColor = 'var(--accent-emerald)';
      btn.style.color = 'var(--accent-emerald)';
      setTimeout(() => {
        btn.innerText = orig;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  // 5. Image Lightbox Zoom Modal
  const imgModal = document.getElementById('imgModal');
  const imgModalTarget = document.getElementById('imgModalTarget');

  window.openImgModal = function (src) {
    if (!imgModal || !imgModalTarget) return;
    imgModalTarget.src = src;
    imgModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeImgModal = function (e) {
    if (e && e.target && e.target.tagName === 'IMG') return;
    if (!imgModal) return;
    imgModal.classList.remove('open');
    document.body.style.overflow = '';
  };

  // 6. Raw Notebook JSON Viewer Modal
  const rawModal = document.getElementById('rawModal');
  const rawModalBody = document.getElementById('rawModalBody');
  const rawModalFilename = document.getElementById('rawModalFilename');
  const downloadRawBtn = document.getElementById('downloadRawBtn');
  const copyRawBtn = document.getElementById('copyRawBtn');

  window.openRawModal = function (filePath, filename) {
    if (!rawModal || !rawModalBody) return;
    
    rawModalFilename.textContent = filename;
    downloadRawBtn.href = filePath;
    downloadRawBtn.setAttribute('download', filename);
    rawModalBody.textContent = 'Loading notebook JSON...';
    rawModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Check pre-bundled preview first (100% reliable offline & file:// protocol)
    if (window.RAW_NOTEBOOKS_PREVIEW && window.RAW_NOTEBOOKS_PREVIEW[filename]) {
      rawModalBody.textContent = window.RAW_NOTEBOOKS_PREVIEW[filename];
      return;
    }

    // Fallback: fetch
    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(json => {
        rawModalBody.textContent = JSON.stringify(json, null, 2);
      })
      .catch(err => {
        console.warn('Fetch fallback:', err);
        rawModalBody.textContent = '// Direct relative fetch restricted by browser sandbox.\n// Use download button above to inspect or launch via local web server.\n\nError: ' + err.message;
      });
  };

  window.closeRawModal = function (e) {
    if (e && e.target && e.target.closest && e.target.closest('.raw-modal-dialog') && !e.target.classList.contains('raw-modal-close-btn')) {
      return;
    }
    if (!rawModal) return;
    rawModal.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.copyRawContent = function () {
    if (!rawModalBody) return;
    navigator.clipboard.writeText(rawModalBody.textContent).then(() => {
      const orig = copyRawBtn.textContent;
      copyRawBtn.textContent = '✓ Copied!';
      copyRawBtn.style.color = 'var(--accent-emerald)';
      setTimeout(() => {
        copyRawBtn.textContent = orig;
        copyRawBtn.style.color = '';
      }, 2000);
    });
  };

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeImgModal();
      window.closeRawModal();
    }
  });

  // 7. Initial Tab Activation
  document.addEventListener('DOMContentLoaded', () => {
    let initialTab = 'nb-01';
    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
    if (hash && (hash.startsWith('nb-') || hash === 'raw-notebooks' || hash === 'all')) {
      initialTab = hash;
    }
    window.switchNotebookTab(initialTab);
  });

  // Also trigger immediately in case DOM is already parsed
  let initTab = 'nb-01';
  const h = window.location.hash ? window.location.hash.replace('#', '') : '';
  if (h && (h.startsWith('nb-') || h === 'raw-notebooks' || h === 'all')) {
    initTab = h;
  }
  window.switchNotebookTab(initTab);

})();
