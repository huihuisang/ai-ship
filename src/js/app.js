// Module-level reference for image modal binding (shared with article overlay)
let _bindImageForModal = null;

const copyPrompt = async (button) => {
  if (!button) return;
  const payload = button.dataset.copySource;
  if (!payload) return;

  let text = '';
  try {
    text = JSON.parse(payload);
  } catch (error) {
    text = payload;
  }

  const labelDefault = button.dataset.copyLabel || 'Copy';
  const labelSuccess = button.dataset.copySuccess || 'Copied';
  const labelFailed = button.dataset.copyFailed || 'Copy failed';
  const hiddenLabel = button.querySelector('.visually-hidden');

  const updateLabel = (label) => {
    button.setAttribute('aria-label', label);
    if (hiddenLabel) {
      hiddenLabel.textContent = label;
    }
  };

  const clearTimer = () => {
    if (button._copyTimer) {
      clearTimeout(button._copyTimer);
      button._copyTimer = null;
    }
  };

  const scheduleReset = () => {
    clearTimer();
    button._copyTimer = setTimeout(() => {
      button.classList.remove('is-success', 'is-failed');
      updateLabel(labelDefault);
      button._copyTimer = null;
    }, 1800);
  };

  clearTimer();
  button.classList.remove('is-success', 'is-failed');
  updateLabel(labelDefault);

  const handleSuccess = () => {
    button.classList.add('is-success');
    button.classList.remove('is-failed');
    updateLabel(labelSuccess);
    scheduleReset();
  };

  const handleFailure = () => {
    button.classList.add('is-failed');
    button.classList.remove('is-success');
    updateLabel(labelFailed);
    scheduleReset();
  };

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      handleSuccess();
      return;
    } catch (error) {
      console.warn('Clipboard API not available, fallback in use.', error);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    handleSuccess();
  } catch (error) {
    console.error('Copy failed', error);
    handleFailure();
  }
  document.body.removeChild(textarea);
};

const bindPromptDetails = () => {
  // 同步两个details元素的状态
  document.querySelectorAll('.case-card__prompt-summary-only').forEach((summaryOnly) => {
    const cardId = summaryOnly.dataset.cardId;
    const fullDetails = document.querySelector(`.case-card__prompt-full[data-card-id="${cardId}"]`);

    if (!fullDetails) return;

    fullDetails.style.height = '0px';

    const ensureState = () => {
      if (!fullDetails._promptState) {
        fullDetails._promptState = {
          rafId: null,
          transitionHandler: null,
          animating: false
        };
      }
      return fullDetails._promptState;
    };

    const clearPending = () => {
      const state = ensureState();
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
      if (state.transitionHandler) {
        fullDetails.removeEventListener('transitionend', state.transitionHandler);
        state.transitionHandler = null;
      }
      state.animating = false;
      fullDetails.dataset.animating = 'false';
    };

    const openPrompt = () => {
      const state = ensureState();
      if (state.animating && fullDetails.classList.contains('is-open')) return;

      clearPending();
      state.animating = true;
      fullDetails.dataset.animating = 'true';

      const start = fullDetails.getBoundingClientRect().height;
      const target = fullDetails.scrollHeight;

      fullDetails.style.height = `${start}px`;
      fullDetails.classList.add('is-open');

      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        fullDetails.style.height = `${target}px`;
      });

      const handleTransitionEnd = (event) => {
        if (event.propertyName !== 'height') return;
        clearPending();
        fullDetails.style.height = 'auto';
      };

      fullDetails.addEventListener('transitionend', handleTransitionEnd);
      state.transitionHandler = handleTransitionEnd;
    };

    const closePrompt = () => {
      const state = ensureState();
      if (state.animating && !fullDetails.classList.contains('is-open')) return;

      clearPending();
      state.animating = true;
      fullDetails.dataset.animating = 'true';

      const start = fullDetails.scrollHeight;
      fullDetails.style.height = `${start}px`;

      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        fullDetails.classList.remove('is-open');
        fullDetails.style.height = '0px';
      });

      const handleTransitionEnd = (event) => {
        if (event.propertyName !== 'height') return;
        clearPending();
      };

      fullDetails.addEventListener('transitionend', handleTransitionEnd);
      state.transitionHandler = handleTransitionEnd;
    };

    summaryOnly.addEventListener('toggle', () => {
      if (summaryOnly.open) {
        openPrompt();
      } else {
        closePrompt();
      }
    });

    if (summaryOnly.open) {
      requestAnimationFrame(() => openPrompt());
    }
  });

  document.querySelectorAll('.copy-action').forEach((button) => {
    button.addEventListener('click', () => copyPrompt(button));
  });
};

const bindPagination = () => {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;
  const main = document.querySelector('.site-main');
  pagination.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (main) {
        main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  localStorage.setItem('theme', theme);
};

const initControls = () => {
  // 初始化主题控制
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = storedTheme || (prefersDark ? 'dark' : 'light');

  // 更新主题菜单状态
  const themeMenu = document.querySelector('[data-menu="theme"]');
  if (themeMenu) {
    const activeItem = themeMenu.querySelector(`[data-theme="${storedTheme || 'auto'}"]`);
    if (activeItem) {
      activeItem.classList.add('is-active');
    }
  }

  // 主题菜单点击事件
  document.querySelectorAll('[data-theme]').forEach((item) => {
    item.addEventListener('click', () => {
      const theme = item.dataset.theme;

      // 移除所有主题菜单项的激活状态
      document.querySelectorAll('[data-theme]').forEach(el => {
        el.classList.remove('is-active');
      });

      // 设置当前项为激活状态
      item.classList.add('is-active');

      if (theme === 'auto') {
        localStorage.removeItem('theme');
        const autoTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(autoTheme);
      } else {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
      }
    });
  });

  const languageMenu = document.querySelector('[data-menu="language"]');
  if (languageMenu) {
    const activeLang = document.documentElement.getAttribute('lang') || 'zh';
    const currentItem = languageMenu.querySelector(`[data-lang="${activeLang}"]`);
    if (currentItem) {
      currentItem.classList.add('is-active');
    }
  }

  // 语言菜单点击事件
  document.querySelectorAll('[data-lang]').forEach((item) => {
    item.addEventListener('click', () => {
      const lang = item.dataset.lang;
      const targetUrl = item.dataset.langUrl;

      // 移除所有语言菜单项的激活状态
      document.querySelectorAll('[data-lang]').forEach(el => {
        el.classList.remove('is-active');
      });

      // 设置当前项为激活状态
      item.classList.add('is-active');

      if (targetUrl) {
        window.location.href = targetUrl;
        return;
      }

      // 跳转到对应语言首页
      if (lang === 'zh') {
        window.location.href = '/';
      } else {
        window.location.href = `/${lang}/`;
      }
    });
  });

  // 关闭菜单当点击外部
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.control-group')) {
      document.querySelectorAll('.control-menu').forEach(menu => {
        menu.classList.remove('is-open');
      });
    }
  });

  // 控制按钮点击事件
  document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const controlType = btn.dataset.control;
      const menu = document.querySelector(`[data-menu="${controlType}"]`);

      // 切换菜单显示
      if (menu) {
        const isOpen = menu.classList.contains('is-open');
        document.querySelectorAll('.control-menu').forEach(m => {
          m.classList.remove('is-open');
        });
        if (!isOpen) {
          menu.classList.add('is-open');
        }
      }
    });
  });
};

function initSailboat() {
  const title = document.querySelector('.site-title');
  if (!title) return;
  const boat = title.querySelector('.icon-sailboat');
  if (!boat) return;
  const container = title.closest('.container') || document.body;
  const margin = 16;

  let animating = false;
  let direction = 1; // 1 = right, -1 = left
  let currentX = 0;
  let lastTs = 0;
  const speed = 120; // px per second
  const rotateDuration = 260; // ms for flip
  let flipping = false;
  let rafId = null;
  let hasStarted = false;
  let wavePhase = 0;
  const waveSpeed = 1.4; // oscillations per second
  const waveAmplitude = 6; // px vertical bobbing
  const tiltAmplitude = 4; // deg

  const TWO_PI = Math.PI * 2;
  let yaw = 0;
  let targetYaw = 0;
  let startYaw = 0;
  let yawDiff = 0;
  let flipStart = 0;
  let baseLeft = 0;
  let boatWidth = boat.offsetWidth;
  let waveIntensity = 0;
  boat.style.transformStyle = 'preserve-3d';
  boat.style.backfaceVisibility = 'visible';
  boat.style.transformOrigin = '50% 70%';
  boat.style.willChange = 'transform';
  const waveRampDuration = 0.35; // seconds to reach full wave amplitude

  function measureBase() {
    const wrapper = boat.closest('.site-title__icon');
    const prevBoatTransform = boat.style.transform;
    const prevWrapperTransform = wrapper ? wrapper.style.transform : '';

    boat.style.transform = 'none';
    if (wrapper) {
      wrapper.style.transform = 'none';
    }

    const containerRect = container.getBoundingClientRect();
    const referenceRect = (wrapper || boat).getBoundingClientRect();
    boatWidth = referenceRect.width;
    baseLeft = referenceRect.left - containerRect.left;

    boat.style.transform = prevBoatTransform;
    if (wrapper) {
      wrapper.style.transform = prevWrapperTransform;
    }
  }

  function render() {
    const angle = wavePhase % TWO_PI;
    const effectiveWave = waveAmplitude * waveIntensity;
    const bob = Math.sin(angle) * effectiveWave;
    const yawRad = (yaw * Math.PI) / 180;
    const facing = Math.cos(yawRad);
    const leanDirection = Math.abs(facing) > 0.05 ? Math.sign(facing) : direction;
    const tilt = Math.sin(angle + Math.PI / 2) * tiltAmplitude * leanDirection * waveIntensity;
    const perspective = 'perspective(800px)';
    boat.style.transform = `${perspective} translateX(${currentX}px) translateY(${bob}px) rotateY(${yaw}deg) rotate(${tilt}deg)`;
  }

  function getBounds() {
    const containerRect = container.getBoundingClientRect();
    const maxX = Math.max(0, containerRect.width - baseLeft - boatWidth - margin);
    return { minX: 0, maxX };
  }

  function frame(ts) {
    if (!animating) return;
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (!flipping) {
      const previousX = currentX;
      const nextX = previousX + direction * speed * dt;
      const { minX, maxX } = getBounds();
      if (nextX > maxX) {
        currentX = maxX;
        flip();
      } else if (nextX < minX) {
        currentX = minX;
        flip();
      } else {
        currentX = nextX;
      }
    }
    if (flipping) {
      const elapsed = ts - flipStart;
      const progress = Math.min(elapsed / rotateDuration, 1);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress);
      yaw = startYaw + yawDiff * eased;
      if (progress >= 1) {
        yaw = targetYaw;
        flipping = false;
      }
    } else {
      yaw = targetYaw;
    }
    wavePhase += waveSpeed * TWO_PI * dt;
    if (waveIntensity < 1) {
      waveIntensity = Math.min(1, waveIntensity + (dt / waveRampDuration));
    }
    render();
    rafId = requestAnimationFrame(frame);
  }
  function flip() {
    if (flipping) return;
    direction *= -1;
    startYaw = yaw;
    targetYaw = direction === 1 ? 0 : 180;
    yawDiff = targetYaw - startYaw;
    if (yawDiff > 180) yawDiff -= 360;
    if (yawDiff < -180) yawDiff += 360;
    flipStart = performance.now();
    flipping = true;
  }
  function reset() {
    direction = 1;
    currentX = 0;
    flipping = false;
    wavePhase = 0;
    waveIntensity = 0;
    yaw = 0;
    targetYaw = 0;
    startYaw = 0;
    yawDiff = 0;
    measureBase();
    render();
  }
  function start() {
    if (animating) return;
    if (!hasStarted) {
      reset();
      hasStarted = true;
    }
    animating = true;
    lastTs = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    animating = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTs = 0;
    render();
  }
  function handleResize() {
    measureBase();
    const { minX, maxX } = getBounds();
    currentX = Math.min(Math.max(currentX, minX), maxX);
    render();
  }
  title.addEventListener('mouseenter', start);
  title.addEventListener('mouseleave', stop);
  window.addEventListener('resize', handleResize);

  measureBase();
  render();
}

const initImageModal = () => {
  // Sets up the lightbox modal for card images.
  const modal = document.querySelector('[data-image-modal]');
  const modalImage = modal?.querySelector('[data-image-modal-img]');
  if (!modal || !modalImage) return;

  const modalCaption = modal.querySelector('[data-image-modal-caption]');
  const closeTargets = modal.querySelectorAll('[data-image-modal-dismiss]');
  const closeButton = modal.querySelector('.image-modal__close');
  let lastActiveElement = null;

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    }
  };

  const closeModal = () => {
    if (!modal.classList.contains('is-active')) return;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('image-modal-open');
    modalImage.removeAttribute('src');
    modalImage.alt = '';
    if (modalCaption) {
      modalCaption.textContent = '';
      modalCaption.hidden = true;
    }
    document.removeEventListener('keydown', handleKeydown);
    if (lastActiveElement) {
      lastActiveElement.focus({ preventScroll: true });
      lastActiveElement = null;
    }
    modal.hidden = true;
  };

  const openModal = (image) => {
    const source = image.dataset.fullsize || image.currentSrc || image.src;
    if (!source) return;

    lastActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalImage.src = source;
    modalImage.alt = image.alt || '';

    if (modalCaption) {
      const caption = image.dataset.caption || image.alt || image.title || '';
      if (caption) {
        modalCaption.textContent = caption;
        modalCaption.hidden = false;
      } else {
        modalCaption.textContent = '';
        modalCaption.hidden = true;
      }
    }

    modal.hidden = false;
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('image-modal-open');
    document.addEventListener('keydown', handleKeydown);
    closeButton?.focus({ preventScroll: true });
  };

  closeTargets.forEach((trigger) => {
    trigger.addEventListener('click', () => closeModal());
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const bindImage = (image) => {
    if (!image || image.dataset.imageModalBound === 'true') return;
    image.dataset.imageModalBound = 'true';
    image.setAttribute('data-image-modal-trigger', 'true');
    if (!image.hasAttribute('tabindex')) {
      image.setAttribute('tabindex', '0');
    }
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');

    image.addEventListener('click', () => openModal(image));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(image);
      }
    });
  };

  document.querySelectorAll('.case-card__content img').forEach(bindImage);

  // Expose bindImage for reuse in article overlay
  _bindImageForModal = bindImage;
};

// Detect cards whose content exceeds the collapse threshold and add truncation.
// Each card gets a random max-height within a 300px range for visual variety.
const initContentTruncation = () => {
  const BASE_HEIGHT = 666; // Minimum truncation height (px)
  const RANDOM_RANGE = 0; // Random offset range (px), so max-height is 280-480px

  document.querySelectorAll('[data-content-wrapper]').forEach((wrapper) => {
    const content = wrapper.querySelector('.case-card__content');
    if (!content) return;

    // Randomize the collapse height for each card
    const collapseHeight = BASE_HEIGHT + Math.floor(Math.random() * RANDOM_RANGE);

    if (content.scrollHeight <= collapseHeight) return;

    // Apply random max-height and mark as truncated
    wrapper.style.setProperty('--content-collapse-height', `${collapseHeight}px`);
    wrapper.classList.add('is-truncated');

    // Mark card as expandable (clickable)
    const card = wrapper.closest('.case-card');
    if (card) {
      card.classList.add('is-expandable');
    }
  });
};

// Article detail overlay: open/close, animations, a11y, hash routing
const initArticleOverlay = () => {
  const overlay = document.querySelector('[data-article-overlay]');
  if (!overlay) return;

  const overlayBody = overlay.querySelector('[data-article-overlay-body]');
  const dismissTargets = overlay.querySelectorAll('[data-article-overlay-dismiss]');
  let lastActiveElement = null;
  let currentSlug = null;
  // Fallback timer in case transitionend does not fire
  let closeFallbackTimer = null;

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeOverlay();
    }
  };

  const openOverlay = (slug) => {
    const sourceCard = document.querySelector(
      `.case-card[data-article-slug="${slug}"]`
    );
    if (!sourceCard || !overlayBody) return;

    currentSlug = slug;
    lastActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Clone card content into overlay body
    const clone = sourceCard.cloneNode(true);
    clone.removeAttribute('id');
    overlayBody.innerHTML = '';
    overlayBody.appendChild(clone);

    // Re-bind copy buttons inside the clone
    clone.querySelectorAll('.copy-action').forEach((button) => {
      button.addEventListener('click', () => copyPrompt(button));
    });

    // Re-bind image modal triggers inside the clone
    clone.querySelectorAll('.case-card__content img').forEach((img) => {
      img.removeAttribute('data-image-modal-bound');
      if (_bindImageForModal) {
        _bindImageForModal(img);
      }
    });

    // Re-bind prompt details inside the clone
    clone.querySelectorAll('.case-card__prompt-summary-only').forEach((summaryOnly) => {
      const cardId = summaryOnly.dataset.cardId;
      const fullDetails = clone.querySelector(
        `.case-card__prompt-full[data-card-id="${cardId}"]`
      );
      if (!fullDetails) return;
      fullDetails.style.height = '0px';
      fullDetails.classList.remove('is-open');

      summaryOnly.open = false;
      summaryOnly.addEventListener('toggle', () => {
        if (summaryOnly.open) {
          const target = fullDetails.scrollHeight;
          fullDetails.style.height = '0px';
          fullDetails.classList.add('is-open');
          requestAnimationFrame(() => {
            fullDetails.style.height = `${target}px`;
          });
          fullDetails.addEventListener('transitionend', function onEnd(e) {
            if (e.propertyName !== 'height') return;
            fullDetails.style.height = 'auto';
            fullDetails.removeEventListener('transitionend', onEnd);
          });
        } else {
          const start = fullDetails.scrollHeight;
          fullDetails.style.height = `${start}px`;
          requestAnimationFrame(() => {
            fullDetails.classList.remove('is-open');
            fullDetails.style.height = '0px';
          });
        }
      });
    });

    // Enable page transition, then slide page down and show overlay
    overlay.classList.remove('is-closing');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('article-overlay-animating');
    document.body.classList.add('article-overlay-open');
    document.addEventListener('keydown', handleKeydown);

    // Wait one frame so the browser registers the initial state,
    // then add is-active to trigger the CSS transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('is-active');
      });
    });

    // Update URL hash for browser back support
    history.pushState({ articleOverlay: slug }, '', `#article-${slug}`);
  };

  const closeOverlay = (options = {}) => {
    const { skipHistory = false } = options;
    if (!overlay.classList.contains('is-active')) return;

    // Start close animations
    overlay.classList.add('is-closing');
    overlay.classList.remove('is-active');
    document.body.classList.remove('article-overlay-open');
    document.body.classList.add('article-overlay-closing');

    const finishClose = () => {
      if (closeFallbackTimer) {
        clearTimeout(closeFallbackTimer);
        closeFallbackTimer = null;
      }
      overlay.classList.remove('is-closing');
      overlay.setAttribute('aria-hidden', 'true');
      overlayBody.innerHTML = '';
      // Remove animation scoping classes so page transitions
      // don't interfere with other features (e.g. image modal)
      document.body.classList.remove('article-overlay-animating');
      document.body.classList.remove('article-overlay-closing');
    };

    // Wait for close animation to complete
    const container = overlay.querySelector('.article-overlay__container');
    const handleTransitionEnd = (event) => {
      if (event.target !== container) return;
      container.removeEventListener('transitionend', handleTransitionEnd);
      finishClose();
    };
    container.addEventListener('transitionend', handleTransitionEnd);

    // Fallback in case transitionend does not fire
    closeFallbackTimer = setTimeout(finishClose, 500);

    document.removeEventListener('keydown', handleKeydown);

    // Restore URL
    if (!skipHistory) {
      history.pushState(null, '', window.location.pathname);
    }

    // Restore focus to the button that opened the overlay
    if (lastActiveElement) {
      lastActiveElement.focus({ preventScroll: true });
      lastActiveElement = null;
    }

    currentSlug = null;
  };

  // Bind expandable card clicks (cards with truncated content)
  document.querySelectorAll('.case-card.is-expandable').forEach((card) => {
    card.addEventListener('click', (event) => {
      // Don't trigger overlay when clicking interactive elements inside the card
      const interactive = event.target.closest('a, button, details, summary, [data-image-modal-trigger]');
      if (interactive) return;

      const slug = card.dataset.articleSlug;
      if (slug) openOverlay(slug);
    });
  });

  // Bind dismiss targets (backdrop + close button)
  dismissTargets.forEach((trigger) => {
    trigger.addEventListener('click', () => closeOverlay());
  });

  // Handle browser back/forward navigation
  window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    if (hash.startsWith('#article-')) {
      const slug = hash.replace('#article-', '');
      if (currentSlug !== slug) {
        openOverlay(slug);
      }
    } else if (overlay.classList.contains('is-active')) {
      closeOverlay({ skipHistory: true });
    }
  });

  // Handle page load with hash (direct link to article overlay)
  const initialHash = window.location.hash;
  if (initialHash.startsWith('#article-')) {
    const slug = initialHash.replace('#article-', '');
    requestAnimationFrame(() => openOverlay(slug));
  }
};

const init = () => {
  bindPromptDetails();
  bindPagination();
  initControls();
  initImageModal();
  initSailboat();
  initContentTruncation();
  initArticleOverlay();
};

document.addEventListener('DOMContentLoaded', init);
