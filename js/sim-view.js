/* Ecosystem simulation screen: landscape canvas, interactive food pyramid, controls, population chart. Uses VE.Sim.Engine. */
(function (VE) {
  'use strict';
  var UI = VE.UI, el = UI.el, t = function (k) { return VE.I18n.t(k); };
  var GROUP_COLORS = { producer: '#2e9e44', herbivore: '#1ab3d0', omnivore: '#f2b705', top: '#e53935' };
  var GROUP_ROMAN = { producer: 'I', herbivore: 'II', omnivore: 'III', top: 'IV' };
  var GROUP_KEY = { producer: 'producers', herbivore: 'herbivores', omnivore: 'omnivores', top: 'top' };

  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function niceMax(v) { if (v <= 0) return 100; var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; var n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; return n * p; }

  function create(ctx) {
    var eco = ctx.eco, host = ctx.host, act = ctx.activity;
    var orgs = VE.Org.inEcosystem(eco.id);
    var settings = VE.Eco.simSettings(eco.id);
    var counts = { producer: 3, herbivore: 3, omnivore: 3, top: 3 };
    var speeds = [1, 2, 4], speedIdx = 0, running = false, raf = 0, last = 0, acc = 0, producersOn = true, scaleMode = 'counts', yMax = 100, hoverDay = null, finished = false, completed = false;
    var engine;

    if (!orgs.length) { host.appendChild(el('div', { class: 'card', style: { padding: '24px' } }, el('p', { class: 'placeholder', text: t('noOrganisms') }))); return { destroy: function () { UI.clear(host); } }; }

    function newEngine() {
      engine = new VE.Sim.Engine({ organisms: orgs, ecosystem: eco, settings: settings, groupCounts: Object.assign({}, counts) });
      engine.reset(); yMax = 100; finished = false; completed = false;
    }
    newEngine();

    // ------------------------------------------------------------ layout
    var grid = el('div', { class: 'sim-grid' });
    var landCard = el('section', { class: 'card land-card', 'aria-label': 'Ecosystem landscape' });
    var canvas = el('canvas', { class: 'land-canvas', role: 'img', 'aria-label': 'Ecosystem landscape showing organism populations' });
    var dayBadge = el('div', { class: 'day-badge' });
    var sunIco = el('div', { class: 'land-sun' }, UI.icon('sun'));
    var banner = el('div', { class: 'sim-banner', role: 'status' });
    landCard.appendChild(canvas); landCard.appendChild(dayBadge); landCard.appendChild(sunIco); landCard.appendChild(banner);

    var pyrCard = el('section', { class: 'card sim-pyr-card' });
    pyrCard.appendChild(el('h2', { class: 'panel-head sm', text: t('foodPyramid') }));
    pyrCard.appendChild(el('p', { class: 'hint-line', text: t('howMany') }));
    var pyrRows = el('div', { class: 'sim-pyr' });
    pyrCard.appendChild(pyrRows);

    var ctrl = el('div', { class: 'sim-ctrl' });
    function cbtn(label, ic, fn, cls) { var b = el('button', { type: 'button', class: 'ctrl-btn ' + (cls || ''), onclick: fn }, [UI.icon(ic), el('span', { text: label })]); ctrl.appendChild(b); return b; }
    var bReset = cbtn(t('reset'), 'reset', doReset, 'c-reset');
    var bPause = cbtn(t('pause'), 'pause', doPause, 'c-pause');
    var bPlay = cbtn(t('play'), 'play', doPlay, 'c-play');
    var bSpeed = cbtn('x1', 'ff', function () { speedIdx = (speedIdx + 1) % speeds.length; bSpeed.lastChild.textContent = 'x' + speeds[speedIdx]; }, 'c-speed');
    var prodBox = el('div', { class: 'prod-toggle' }, [
      el('span', { text: t('allProducers') }), el('div', { class: 'toggle', role: 'group', 'aria-label': t('allProducers') }, [
        el('button', { type: 'button', class: 'on', 'aria-pressed': 'true', onclick: function () { setProducers(true); } }, t('on')),
        el('button', { type: 'button', 'aria-pressed': 'false', onclick: function () { setProducers(false); } }, t('off'))])]);
    ctrl.appendChild(prodBox);

    var chartCard = el('section', { class: 'card chart-card' });
    var chartHead = el('div', { class: 'chart-head' }, [
      el('h2', { class: 'panel-head sm', text: t('populationByDay') }),
      el('div', { class: 'seg', role: 'group', 'aria-label': t('toggleScale') }, [
        el('button', { type: 'button', class: 'on', 'data-m': 'counts', onclick: function () { setScale('counts'); } }, t('counts')),
        el('button', { type: 'button', 'data-m': 'pct', onclick: function () { setScale('pct'); } }, t('percentOfStart'))]),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: showModel }, 'ℹ ' + t('modelNote').split(',')[0])
    ]);
    var chartBody = el('div', { class: 'chart-body' });
    var chart = el('canvas', { class: 'chart-canvas', role: 'img', 'aria-label': t('populationByDay') });
    var legend = el('ul', { class: 'chart-legend' });
    var cvWrap = el('div', { class: 'chart-cv' }, chart);
    chartBody.appendChild(cvWrap); chartBody.appendChild(legend);
    chartCard.appendChild(chartHead); chartCard.appendChild(chartBody);
    var tip = el('div', { class: 'chart-tip' }); chartBody.appendChild(tip);

    grid.appendChild(landCard); grid.appendChild(pyrCard); grid.appendChild(ctrl); grid.appendChild(chartCard);
    host.appendChild(grid);

    // ------------------------------------------------------------ pyramid with steppers
    var groups = ['top', 'omnivore', 'herbivore', 'producer'];
    function groupColor(g) { var lv = eco.pyramid.filter(function (l) { return l.simGroup === g; })[0]; return lv ? lv.color : GROUP_COLORS[g]; }
    function drawPyr() {
      UI.clear(pyrRows);
      groups.forEach(function (g, i) {
        var lo = i / 4 * 50, hi = (i + 1) / 4 * 50;
        var clip = 'polygon(' + (50 - lo) + '% 0,' + (50 + lo) + '% 0,' + (50 + hi) + '% 100%,' + (50 - hi) + '% 100%)';
        var members = orgs.filter(function (o) { return engine.group[o.id] === g; });
        var shape = el('div', { class: 'pyr-shape', style: { background: groupColor(g), clipPath: clip, webkitClipPath: clip } }, [
          el('div', { class: 'pyr-icons' }, members.slice(0, 4).map(function (o) { return el('span', { class: 'pyr-ico' }, [VE.Org.img(o), el('em', { text: o.name })]); }))
        ]);
        var val = el('span', { class: 'step-val', 'aria-live': 'polite', text: String(counts[g]) });
        var minus = el('button', { type: 'button', class: 'step-btn minus', 'aria-label': t(GROUP_KEY[g]) + ' −', onclick: function () { change(g, -1, val); } }, '−');
        var plus = el('button', { type: 'button', class: 'step-btn plus', 'aria-label': t(GROUP_KEY[g]) + ' +', onclick: function () { change(g, 1, val); } }, '+');
        var step = el('div', { class: 'stepper', style: { '--c': groupColor(g) } }, [minus, val, plus]);
        pyrRows.appendChild(el('div', { class: 'pyr-row' }, [shape, el('span', { class: 'pyr-dot', style: { background: groupColor(g) } }), step]));
      });
    }
    function change(g, d, valEl) {
      var nv = Math.max(1, Math.min(5, counts[g] + d));
      if (nv === counts[g]) return;
      var old = counts[g]; counts[g] = nv; valEl.textContent = String(nv); UI.Sound.pop();
      if (engine.day === 0 && !running) { newEngine(); applyProducers(); }
      else { engine.scaleGroup(g, nv / old); UI.toast((d > 0 ? '+' : '−') + ' ' + t(GROUP_KEY[g]) + ' (' + t('day') + ' ' + engine.day + ')', 'info', 1800); }
      refresh();
    }
    function setProducers(on) {
      producersOn = on; engine.setProducersOn(on);
      prodBox.querySelectorAll('button').forEach(function (b, i) { var active = (i === 0) === on; b.classList.toggle('on', active); b.setAttribute('aria-pressed', String(active)); });
      UI.Sound.pop();
    }
    function applyProducers() { engine.setProducersOn(producersOn); }

    // ------------------------------------------------------------ controls
    function doPlay() { if (finished) doReset(); running = true; last = 0; setBtn(); loop(); }
    function doPause() { running = false; setBtn(); }
    function doReset() {
      running = false; acc = 0; producersOn = true; newEngine(); setProducers(true); engine.events.length = 0;
      banner.classList.remove('show'); setBtn(); refresh(); drawPyr();
    }
    function setBtn() { bPlay.classList.toggle('active', running); bPause.classList.toggle('active', !running && engine.day > 0 && !finished); bPlay.disabled = false; }
    function setScale(m) { scaleMode = m; chartHead.querySelectorAll('[data-m]').forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); }); drawChart(); }

    function showModel() {
      UI.dialog({ title: 'About this simulation', wide: true, body: el('div', { class: 'model-doc' }, [
        el('p', { text: t('modelNote') }),
        el('ul', {}, [
          el('li', { text: 'Each organism’s population changes once per simulated day. Consumers eat the prey listed for them in the database; the more prey per consumer, the better they reproduce.' }),
          el('li', { text: 'Only about ' + settings.transferPercent + '% of the energy (here, of the prey eaten) becomes new consumers, so lower levels must be much bigger than higher levels.' }),
          el('li', { text: 'Producers grow logistically (limited space) and depend on sunlight and rainfall. “All Producers OFF” imitates a drought or blight.' }),
          el('li', { text: 'The only randomness is a small daily variation (±' + Math.round(settings.noise * 100) + '%) from a seeded generator (seed ' + settings.seed + '), so the same settings always give the same graph.' }),
          el('li', { text: 'Rates come from the Admin Dashboard. The model is simplified: no migration, disease, age or seasons.' })
        ])]), buttons: [{ label: t('dismiss'), value: true, kind: 'primary' }] });
    }

    // ------------------------------------------------------------ landscape drawing
    var bgImg = null, bgFailed = false, procCanvas = null;
    if (eco.simBackground) { bgImg = new Image(); bgImg.onerror = function () { bgFailed = true; }; bgImg.src = eco.simBackground; }
    var sprites = {}; // organism id -> Image
    orgs.forEach(function (o) { var im = new Image(); im.onerror = function () { im.onerror = null; im.src = VE.Org.avatar(o); }; im.src = VE.Org.imageSrc(o); sprites[o.id] = im; });
    var SIZE = { producer: 46, herbivore: 30, omnivore: 38, top: 52 };

    function procedural(w, h) {
      var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
      var gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7ccf4f'); gr.addColorStop(1, '#4fa83a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      var rnd = VE.Sim.mulberry32(hash(eco.id));
      for (var i = 0; i < 90; i++) { x.fillStyle = 'rgba(' + (40 + rnd() * 30 | 0) + ',' + (120 + rnd() * 50 | 0) + ',50,0.18)'; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 50, 10 + rnd() * 25, 0, 0, 7); x.fill(); }
      [[0.2, 0.72, 0.15, 0.1], [0.82, 0.3, 0.13, 0.09]].forEach(function (p) {
        x.fillStyle = '#4aa8e8'; x.strokeStyle = '#8c8f96'; x.lineWidth = 6; x.beginPath(); x.ellipse(p[0] * w, p[1] * h, p[2] * w, p[3] * h, 0, 0, 7); x.stroke(); x.fill();
        x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(p[0] * w - 10, p[1] * h - 6, p[2] * w * 0.5, p[3] * h * 0.3, 0, 0, 7); x.fill();
      });
      for (var f = 0; f < 40; f++) { x.fillStyle = rnd() > 0.5 ? '#fff' : '#ffe066'; x.beginPath(); x.arc(rnd() * w, rnd() * h, 2.5, 0, 7); x.fill(); }
      return c;
    }

    var W = 0, H = 0, dpr = 1;
    function sizeCanvas(c, host2) {
      var r = host2.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.max(200, Math.round(r.width)), h = Math.max(120, Math.round(r.height));
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
      return { w: w, h: h };
    }
    function drawLand(ts) {
      var ctx2 = canvas.getContext('2d'), w = W, h = H;
      if (!w) return;
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (bgImg && bgImg.complete && bgImg.naturalWidth && !bgFailed) ctx2.drawImage(bgImg, 0, 0, w, h);
      else { if (!procCanvas || procCanvas.width !== w) procCanvas = procedural(w, h); ctx2.drawImage(procCanvas, 0, 0); }
      var list = [];
      orgs.forEach(function (o) {
        var N = engine.N[o.id], g = engine.group[o.id];
        var unit = Math.max(1, o.population / 6);
        var cnt = Math.min(36, Math.ceil(N / unit));
        if (N > 0 && N < 0.5) cnt = 0;
        for (var i = 0; i < cnt; i++) {
          var hh = hash(o.id + ':' + i), r1 = (hh & 1023) / 1023, r2 = ((hh >>> 10) & 1023) / 1023, ph = ((hh >>> 20) & 1023) / 1023 * 6.28;
          var bx = 0.05 + r1 * 0.9, by = 0.14 + r2 * 0.8, amp = g === 'producer' ? 0 : 0.018 + (hh % 7) * 0.003;
          var x = (bx + Math.sin(ts / 1400 + ph) * amp) * w, y = (by + Math.cos(ts / 1700 + ph) * amp * 0.7) * h;
          list.push({ o: o, x: x, y: y, g: g, flip: Math.cos(ts / 1400 + ph) > 0 });
        }
      });
      list.sort(function (a, b) { return a.y - b.y; });
      var scale = Math.max(0.6, Math.min(1.3, w / 760));
      list.forEach(function (s) {
        var im = sprites[s.o.id], sz = (SIZE[s.g] || 34) * scale;
        if (!im || !im.complete || !im.naturalWidth) return;
        var ar = im.naturalWidth / im.naturalHeight, dw = ar >= 1 ? sz : sz * ar, dh = ar >= 1 ? sz / ar : sz;
        ctx2.save(); ctx2.translate(s.x, s.y);
        ctx2.fillStyle = 'rgba(0,0,0,.14)'; ctx2.beginPath(); ctx2.ellipse(0, 0, dw * 0.38, dh * 0.1, 0, 0, 7); ctx2.fill();
        if (s.flip && s.g !== 'producer') ctx2.scale(-1, 1);
        ctx2.drawImage(im, -dw / 2, -dh, dw, dh); ctx2.restore();
      });
    }

    // ------------------------------------------------------------ chart
    function seriesValue(snap, g) {
      var tot = engine.groupTotals(snap.pops)[g];
      if (scaleMode === 'counts') return tot;
      var base = engine.groupTotals(engine.history[0].pops)[g] || 1; return tot / base * 100;
    }
    function drawChart() {
      var c = chart, cx = c.getContext('2d'), w = CW, h = CH; if (!w) return;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
      var L = 58, R = 12, T = 12, B = 38, pw = w - L - R, ph = h - T - B, D = settings.durationDays;
      var max = 0; engine.history.forEach(function (s) { groups.forEach(function (g) { max = Math.max(max, seriesValue(s, g)); }); });
      yMax = Math.max(yMax, niceMax(max * 1.08)); if (scaleMode === 'pct') yMax = Math.max(100, yMax);
      cx.font = '11px system-ui,sans-serif'; cx.fillStyle = '#4b6678'; cx.strokeStyle = '#d7e6dc'; cx.lineWidth = 1; cx.textAlign = 'right'; cx.textBaseline = 'middle';
      for (var i = 0; i <= 5; i++) { var y = T + ph - ph * i / 5; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(String(Math.round(yMax * i / 5)), L - 6, y); }
      cx.textAlign = 'center'; cx.textBaseline = 'top';
      var step = D <= 60 ? 10 : D <= 120 ? 20 : 50;
      for (var d = 0; d <= D; d += step) { var x = L + pw * d / D; cx.beginPath(); cx.moveTo(x, T); cx.lineTo(x, T + ph); cx.stroke(); cx.fillText(String(d), x, T + ph + 5); }
      cx.fillStyle = '#2a4a5c'; cx.fillText(t('days'), L + pw / 2, h - 16);
      cx.save(); cx.translate(13, T + ph / 2); cx.rotate(-Math.PI / 2); cx.fillText(scaleMode === 'pct' ? t('percentOfStart') : t('numberOfOrganisms'), 0, 0); cx.restore();
      groups.slice().reverse().forEach(function (g) {
        cx.strokeStyle = groupColor(g) || GROUP_COLORS[g]; cx.lineWidth = 2.6; cx.lineJoin = 'round'; cx.beginPath();
        engine.history.forEach(function (s, k) { var x = L + pw * s.day / D, y = T + ph - ph * Math.min(1, seriesValue(s, g) / yMax); k ? cx.lineTo(x, y) : cx.moveTo(x, y); });
        cx.stroke();
      });
      if (hoverDay != null && hoverDay <= engine.day) {
        var hx = L + pw * hoverDay / D; cx.strokeStyle = '#6b7f8f'; cx.setLineDash([4, 3]); cx.lineWidth = 1; cx.beginPath(); cx.moveTo(hx, T); cx.lineTo(hx, T + ph); cx.stroke(); cx.setLineDash([]);
      }
      chart._geo = { L: L, pw: pw, D: D, T: T, ph: ph };
    }
    function drawLegend() {
      var tot = engine.groupTotals(engine.history[engine.history.length - 1].pops);
      UI.clear(legend);
      groups.slice().reverse().forEach(function (g) {
        legend.appendChild(el('li', {}, [el('i', { class: 'lg-line', style: { background: groupColor(g) } }), el('span', { text: t(GROUP_KEY[g]) + ' (' + GROUP_ROMAN[g] + ')' }), el('b', { text: Math.round(tot[g]).toLocaleString() })]));
      });
    }
    chart.addEventListener('pointermove', function (e) {
      var g = chart._geo; if (!g) return; var r = chart.getBoundingClientRect();
      var d = Math.round((e.clientX - r.left - g.L) / g.pw * g.D);
      if (d < 0 || d > engine.day) { hoverDay = null; tip.style.display = 'none'; drawChart(); return; }
      hoverDay = d; var snap = engine.history[d]; if (!snap) return;
      var tot = engine.groupTotals(snap.pops);
      tip.innerHTML = '<b>' + UI.esc(t('day')) + ' ' + d + '</b>' + groups.map(function (gg) { return '<div><i style="background:' + groupColor(gg) + '"></i>' + UI.esc(t(GROUP_KEY[gg])) + ': ' + Math.round(tot[gg]).toLocaleString() + '</div>'; }).join('');
      tip.style.display = 'block'; tip.style.left = Math.min(r.width - 150, Math.max(0, e.clientX - r.left + 12)) + 'px'; tip.style.top = '8px';
      drawChart();
    });
    chart.addEventListener('pointerleave', function () { hoverDay = null; tip.style.display = 'none'; drawChart(); });

    // ------------------------------------------------------------ main loop
    var CW = 0, CH = 0;
    function resize() { var a = sizeCanvas(canvas, landCard); W = a.w; H = a.h; procCanvas = null; var b = sizeCanvas(chart, cvWrap); CW = b.w; CH = b.h; refresh(); }
    function refresh() {
      dayBadge.textContent = t('day') + ' ' + engine.day;
      drawChart(); drawLegend();
      var live = 'Day ' + engine.day; canvas.setAttribute('aria-label', live);
    }
    function loop(ts) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function frame(now) {
        drawLand(now);
        if (running) {
          if (!last) last = now;
          acc += Math.min(0.1, (now - last) / 1000) * settings.daysPerSecond * speeds[speedIdx]; last = now;
          var moved = false;
          while (acc >= 1 && !engine.done()) { engine.step(); acc -= 1; moved = true; }
          if (moved) { refresh(); }
          if (engine.day >= 10 && !completed) { completed = true; ctx.api.complete(); }
          if (engine.done()) { running = false; finished = true; banner.textContent = t('simDone') + ' · ' + t('day') + ' ' + engine.day; banner.classList.add('show'); setBtn(); UI.Sound.win(); }
        }
        raf = requestAnimationFrame(frame);
      });
    }

    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () { resize(); }) : null;
    if (ro) { ro.observe(landCard); ro.observe(cvWrap); } else window.addEventListener('resize', resize);
    drawPyr(); setBtn(); loop();
    setTimeout(resize, 0);
    return { destroy: function () { cancelAnimationFrame(raf); running = false; if (ro) ro.disconnect(); else window.removeEventListener('resize', resize); UI.clear(host); } };
  }

  VE.SimView = { create: create };
})(window.VE = window.VE || {});
