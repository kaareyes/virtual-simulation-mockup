/* Shared UI helpers: DOM builder, toast, modal dialog, sound, icons. */
(function (VE) {
  'use strict';

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') { for (var sk in v) { if (sk.indexOf('--') === 0) n.style.setProperty(sk, v[sk]); else n.style[sk] = v[sk]; } }
      else n.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(kids) ? kids : kids == null ? [] : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function svgEl(tag, attrs, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var k in attrs) { if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  // ---------------------------------------------------------------- live region + toast
  var live;
  function announce(msg) {
    if (!live) { live = el('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' }); document.body.appendChild(live); }
    live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 20);
  }
  var toastHost;
  function toast(msg, type, ms) {
    if (!toastHost) { toastHost = el('div', { class: 'toast-host' }); document.body.appendChild(toastHost); }
    var t = el('div', { class: 'toast toast-' + (type || 'info'), role: type === 'error' ? 'alert' : 'status' }, msg);
    toastHost.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, ms || (type === 'error' ? 6000 : 3000));
  }

  // ---------------------------------------------------------------- modal dialog
  /** opts: { title, body (node|string), buttons:[{label, value, kind:'primary'|'danger'|'ghost'}], wide, dismissValue } -> Promise(value) */
  function dialog(opts) {
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var back = el('div', { class: 'modal-back' });
      var box = el('div', { class: 'modal' + (opts.wide ? ' modal-wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog' });
      if (opts.title) box.appendChild(el('h2', { class: 'modal-title', text: opts.title }));
      var body = el('div', { class: 'modal-body' });
      if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
      box.appendChild(body);
      var foot = el('div', { class: 'modal-foot' });
      function close(v) { document.removeEventListener('keydown', onKey, true); back.remove(); if (prev && prev.focus) prev.focus(); resolve(v); }
      (opts.buttons || [{ label: 'OK', value: true, kind: 'primary' }]).forEach(function (b) {
        foot.appendChild(el('button', { type: 'button', class: 'btn btn-' + (b.kind || 'ghost'), 'data-value': String(b.value), onclick: function () { if (typeof b.action === 'function' && b.action() === false) return; close(b.value); } }, b.label));
      });
      box.appendChild(foot); back.appendChild(box); document.body.appendChild(back);
      function onKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); close(opts.dismissValue === undefined ? false : opts.dismissValue); }
        else if (e.key === 'Tab') {
          var f = box.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])');
          if (!f.length) return; var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey, true);
      back.addEventListener('mousedown', function (e) { if (e.target === back && opts.dismissValue !== null) close(opts.dismissValue === undefined ? false : opts.dismissValue); });
      var focus = box.querySelector('[autofocus]') || foot.querySelector('.btn-primary,.btn-danger') || foot.querySelector('button');
      setTimeout(function () { if (focus) focus.focus(); }, 30);
    });
  }
  function confirmDialog(title, msg, okLabel, danger) {
    var body = typeof msg === 'string' ? el('p', { text: msg }) : msg;
    return dialog({ title: title, body: body, buttons: [{ label: 'Cancel', value: false }, { label: okLabel || 'OK', value: true, kind: danger ? 'danger' : 'primary' }] });
  }

  // ---------------------------------------------------------------- sound (Web Audio, generated; no files needed)
  var ctx = null;
  var Sound = {
    enabled: true,
    init: function (on) { Sound.enabled = on; },
    toggle: function () { Sound.enabled = !Sound.enabled; VE.Store.set('sound', Sound.enabled); return Sound.enabled; },
    tone: function (seq) {
      if (!Sound.enabled) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        var t = ctx.currentTime;
        seq.forEach(function (n) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = n.type || 'sine'; o.frequency.value = n.f;
          g.gain.setValueAtTime(0.0001, t + n.at); g.gain.exponentialRampToValueAtTime(n.v || 0.15, t + n.at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n.at + n.d);
          o.connect(g); g.connect(ctx.destination); o.start(t + n.at); o.stop(t + n.at + n.d + 0.05);
        });
      } catch (e) { /* audio blocked: ignore */ }
    },
    good: function () { Sound.tone([{ f: 660, at: 0, d: 0.12 }, { f: 880, at: 0.1, d: 0.2 }]); },
    bad: function () { Sound.tone([{ f: 220, at: 0, d: 0.18, type: 'triangle' }, { f: 165, at: 0.12, d: 0.22, type: 'triangle' }]); },
    pop: function () { Sound.tone([{ f: 520, at: 0, d: 0.07, v: 0.08 }]); },
    win: function () { Sound.tone([{ f: 523, at: 0, d: 0.15 }, { f: 659, at: 0.13, d: 0.15 }, { f: 784, at: 0.26, d: 0.15 }, { f: 1047, at: 0.39, d: 0.35 }]); }
  };

  var ICON = {
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 11-2.5-5.8M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
    ff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5v14l9-7zM12 5v14l9-7z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    sun: '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#f7b500" stroke-width="4" stroke-linecap="round"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g><circle cx="32" cy="32" r="12" fill="#ffd23f" stroke="#f7b500" stroke-width="2"/></svg>'
  };
  function icon(name, cls) { return el('span', { class: 'ico ' + (cls || ''), html: ICON[name] }); }

  VE.UI = { el: el, svgEl: svgEl, esc: esc, clear: clear, toast: toast, dialog: dialog, confirm: confirmDialog, announce: announce, Sound: Sound, icon: icon, ICON: ICON };
})(window.VE = window.VE || {});
