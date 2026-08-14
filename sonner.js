/*!
 * sonner.js — vanilla-JS port van emilkowalski/sonner (https://github.com/emilkowalski/sonner)
 *
 * Deze port bouwt exact dezelfde DOM-structuur en data-attributen op als de originele
 * React-component (src/index.tsx), zodat de originele stylesheet (sonner.css, 1-op-1
 * overgenomen uit src/styles.css) ongewijzigd van toepassing is. Alle constanten
 * hieronder komen letterlijk uit src/index.tsx van de sonner-repo.
 */
(function () {
  'use strict';

  // Constanten uit sonner src/index.tsx (regels 22–43)
  var VISIBLE_TOASTS_AMOUNT = 3;
  var VIEWPORT_OFFSET = '24px';
  var MOBILE_VIEWPORT_OFFSET = '16px';
  var TOAST_LIFETIME = 4000;
  var TOAST_WIDTH = 356;
  var GAP = 14;
  var SWIPE_THRESHOLD = 45;
  var TIME_BEFORE_UNMOUNT = 200;
  var TRANSITION_MS = 400; // transition-duur uit styles.css

  // Iconen 1-op-1 uit sonner src/assets.tsx
  var ICONS = {
    success:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>',
    info:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>',
    warning:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" height="20" width="20" aria-hidden="true"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>',
    error:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>'
  };

  // De iOS-achtige activity-indicator (12 vervagende balkjes) uit assets.tsx
  function loaderHTML() {
    var bars = '';
    for (var i = 0; i < 12; i++) bars += '<div class="sonner-loading-bar"></div>';
    return '<div class="sonner-loading-wrapper" data-visible="true"><div class="sonner-spinner">' + bars + '</div></div>';
  }

  var toasterEl = null;
  var toasts = []; // nieuwste eerst: { id, el, height, timer, remaining, startedAt, duration, dismissed }
  var counter = 0;
  var expanded = false;
  var themeOverride = null;
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function currentTheme() {
    if (themeOverride) return themeOverride;
    return mql && mql.matches ? 'dark' : 'light';
  }

  if (mql && mql.addEventListener) {
    mql.addEventListener('change', function () {
      if (toasterEl && !themeOverride) toasterEl.setAttribute('data-sonner-theme', currentTheme());
    });
  }

  function ensureToaster() {
    if (toasterEl) return toasterEl;
    toasterEl = document.createElement('ol');
    toasterEl.setAttribute('data-sonner-toaster', '');
    toasterEl.setAttribute('dir', 'ltr');
    toasterEl.setAttribute('tabindex', '-1');
    toasterEl.setAttribute('data-sonner-theme', currentTheme());
    toasterEl.setAttribute('data-y-position', 'bottom');
    toasterEl.setAttribute('data-x-position', 'right');
    var s = toasterEl.style;
    s.setProperty('--width', TOAST_WIDTH + 'px');
    s.setProperty('--gap', GAP + 'px');
    ['top', 'right', 'bottom', 'left'].forEach(function (side) {
      s.setProperty('--offset-' + side, VIEWPORT_OFFSET);
      s.setProperty('--mobile-offset-' + side, MOBILE_VIEWPORT_OFFSET);
    });
    toasterEl.addEventListener('mouseenter', function () { setExpanded(true); });
    toasterEl.addEventListener('mouseleave', function () { setExpanded(false); });
    document.body.appendChild(toasterEl);
    return toasterEl;
  }

  function setExpanded(value) {
    if (expanded === value) return;
    expanded = value;
    toasts.forEach(function (t) {
      t.el.setAttribute('data-expanded', String(value));
      if (value) pauseTimer(t); else resumeTimer(t);
    });
  }

  function layout() {
    if (!toasterEl) return;
    var live = toasts.filter(function (t) { return !t.dismissed; });
    if (live.length) toasterEl.style.setProperty('--front-toast-height', live[0].height + 'px');
    var heightBefore = 0;
    live.forEach(function (t, idx) {
      var el = t.el;
      el.setAttribute('data-index', String(idx));
      el.setAttribute('data-front', idx === 0 ? 'true' : 'false');
      el.setAttribute('data-visible', idx < VISIBLE_TOASTS_AMOUNT ? 'true' : 'false');
      el.style.setProperty('--index', String(idx));
      el.style.setProperty('--toasts-before', String(idx));
      el.style.setProperty('--z-index', String(live.length - idx));
      el.style.setProperty('--offset', Math.round(heightBefore + GAP * idx) + 'px');
      el.style.setProperty('--initial-height', t.height + 'px');
      heightBefore += t.height;
    });
  }

  function measure(t) {
    t.height = t.el.getBoundingClientRect().height || t.height || 0;
  }

  function pauseTimer(t) {
    if (t.timer == null) return;
    clearTimeout(t.timer);
    t.timer = null;
    t.remaining -= Date.now() - t.startedAt;
    if (t.remaining < 0) t.remaining = 0;
  }

  function resumeTimer(t) {
    if (t.dismissed || t.duration === Infinity || t.timer != null) return;
    t.startedAt = Date.now();
    t.timer = setTimeout(function () { dismiss(t.id); }, Math.max(t.remaining, 0));
  }

  function buildContent(el, opts) {
    el.innerHTML = '';
    var type = opts.type;
    if (type && (ICONS[type] || type === 'loading')) {
      var icon = document.createElement('div');
      icon.setAttribute('data-icon', '');
      icon.innerHTML = type === 'loading' ? loaderHTML() : ICONS[type];
      el.appendChild(icon);
    }
    var content = document.createElement('div');
    content.setAttribute('data-content', '');
    var title = document.createElement('div');
    title.setAttribute('data-title', '');
    title.textContent = opts.message;
    content.appendChild(title);
    if (opts.description) {
      var desc = document.createElement('div');
      desc.setAttribute('data-description', '');
      desc.textContent = opts.description;
      content.appendChild(desc);
    }
    el.appendChild(content);
    if (opts.action && opts.action.label) {
      var btn = document.createElement('button');
      btn.setAttribute('data-button', '');
      btn.setAttribute('data-action', '');
      btn.textContent = opts.action.label;
      btn.addEventListener('click', function () {
        if (typeof opts.action.onClick === 'function') opts.action.onClick();
        dismiss(el._sonnerId);
      });
      el.appendChild(btn);
    }
  }

  function addToast(opts) {
    ensureToaster();
    var id = ++counter;
    var el = document.createElement('li');
    el._sonnerId = id;
    el.setAttribute('data-sonner-toast', '');
    el.setAttribute('data-styled', 'true');
    el.setAttribute('data-mounted', 'false');
    el.setAttribute('data-removed', 'false');
    el.setAttribute('data-swiping', 'false');
    el.setAttribute('data-swipe-out', 'false');
    el.setAttribute('data-expanded', String(expanded));
    el.setAttribute('data-y-position', 'bottom');
    el.setAttribute('data-x-position', 'right');
    if (opts.type) el.setAttribute('data-type', opts.type);
    if (opts.promise) el.setAttribute('data-promise', 'true');
    var rich = opts.richColors != null ? opts.richColors : api.richColors;
    if (rich) el.setAttribute('data-rich-colors', 'true');

    buildContent(el, opts);
    toasterEl.prepend(el);

    var t = {
      id: id,
      el: el,
      height: 0,
      timer: null,
      duration: opts.duration != null ? opts.duration : (opts.type === 'loading' ? Infinity : TOAST_LIFETIME),
      remaining: 0,
      startedAt: 0,
      dismissed: false
    };
    t.remaining = t.duration === Infinity ? Infinity : t.duration;
    toasts.unshift(t);
    measure(t);
    layout();

    // Enter-animatie: pas na een frame data-mounted zetten zodat de transition
    // vanaf translateY(100%) start. setTimeout als vangnet voor omgevingen
    // waar requestAnimationFrame niet (tijdig) vuurt.
    var mount = function () { el.setAttribute('data-mounted', 'true'); };
    requestAnimationFrame(function () { requestAnimationFrame(mount); });
    setTimeout(mount, 60);

    if (!expanded) resumeTimer(t);
    attachSwipe(el, t);
    return id;
  }

  function find(id) {
    for (var i = 0; i < toasts.length; i++) if (toasts[i].id === id) return toasts[i];
    return null;
  }

  function dismiss(id, unmountDelay) {
    var t = find(id);
    if (!t || t.dismissed) return;
    t.dismissed = true;
    pauseTimer(t);
    t.el.setAttribute('data-removed', 'true');
    toasts = toasts.filter(function (x) { return x.id !== id; });
    layout();
    setTimeout(function () {
      if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    }, unmountDelay != null ? unmountDelay : TRANSITION_MS + TIME_BEFORE_UNMOUNT);
  }

  function update(id, opts) {
    var t = find(id);
    if (!t) return;
    if (opts.type) t.el.setAttribute('data-type', opts.type);
    buildContent(t.el, opts);
    t.el.style.height = 'auto';
    measure(t);
    t.el.style.height = '';
    layout();
    t.duration = opts.duration != null ? opts.duration : TOAST_LIFETIME;
    t.remaining = t.duration;
    t.timer = null;
    if (!expanded) resumeTimer(t);
  }

  // Swipe-to-dismiss zoals in sonner: drempel van 45px of een velocity > 0.11 px/ms
  function attachSwipe(el, t) {
    var startX = 0, startY = 0, startTime = 0, dx = 0, dy = 0, dragging = false, direction = null;

    el.addEventListener('pointerdown', function (e) {
      if (t.dismissed || e.target.closest('[data-button]')) return;
      dragging = true;
      direction = null;
      dx = 0; dy = 0;
      startX = e.clientX; startY = e.clientY; startTime = Date.now();
      el.setAttribute('data-swiping', 'true');
      el.setPointerCapture(e.pointerId);
      pauseTimer(t);
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (!direction && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
        direction = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      // positie rechtsonder: alleen naar rechts of naar beneden wegvegen
      if (direction === 'x' && dx > 0) el.style.setProperty('--swipe-amount-x', dx + 'px');
      if (direction === 'y' && dy > 0) el.style.setProperty('--swipe-amount-y', dy + 'px');
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      var amount = direction === 'x' ? dx : dy;
      var velocity = Math.abs(amount) / Math.max(Date.now() - startTime, 1);
      if (amount > 0 && (Math.abs(amount) >= SWIPE_THRESHOLD || velocity > 0.11)) {
        el.setAttribute('data-swipe-direction', direction === 'x' ? 'right' : 'down');
        el.setAttribute('data-swipe-out', 'true');
        t.dismissed = true;
        toasts = toasts.filter(function (x) { return x.id !== t.id; });
        layout();
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 250);
      } else {
        el.style.removeProperty('--swipe-amount-x');
        el.style.removeProperty('--swipe-amount-y');
        el.setAttribute('data-swiping', 'false');
        if (!expanded) resumeTimer(t);
      }
    }

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  // ---- Publieke API (zelfde vorm als sonner's `toast`) ----
  function api(message, opts) {
    return addToast(Object.assign({ message: message }, opts || {}));
  }
  ['success', 'info', 'warning', 'error'].forEach(function (type) {
    api[type] = function (message, opts) {
      return addToast(Object.assign({ message: message, type: type }, opts || {}));
    };
  });
  api.loading = function (message, opts) {
    return addToast(Object.assign({ message: message, type: 'loading', duration: Infinity }, opts || {}));
  };
  api.promise = function (promise, cfg) {
    cfg = cfg || {};
    var id = addToast({ message: cfg.loading || 'Laden…', type: 'loading', duration: Infinity, promise: true });
    var p = typeof promise === 'function' ? promise() : promise;
    Promise.resolve(p).then(function (value) {
      var msg = typeof cfg.success === 'function' ? cfg.success(value) : (cfg.success || 'Gelukt');
      update(id, { message: msg, type: 'success', promise: true });
    }).catch(function (err) {
      var msg = typeof cfg.error === 'function' ? cfg.error(err) : (cfg.error || 'Er ging iets mis');
      update(id, { message: msg, type: 'error', promise: true });
    });
    return p;
  };
  api.dismiss = function (id) { dismiss(id); };
  api.richColors = false;
  api.setTheme = function (theme) {
    themeOverride = theme === 'system' ? null : theme;
    if (toasterEl) toasterEl.setAttribute('data-sonner-theme', currentTheme());
  };

  window.toast = api;
})();
