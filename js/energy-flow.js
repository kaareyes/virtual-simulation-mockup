/*
 * Energy-transfer animation (stepwise SVG scene).
 * Distinguishes ENERGY (flows one way up the pyramid and leaves as heat) from NUTRIENTS (recycled by decomposers).
 * All level names, organisms and percentages come from the JSON database.
 */
(function (VE) {
  'use strict';
  var UI = VE.UI, S = UI.svgEl, el = UI.el, t = function (k) { return VE.I18n.t(k); };

  function energyFlow(ctx) {
    var eco = ctx.eco, host = ctx.host, pool = ctx.organisms;
    var disp = VE.Eco.displayLevels(eco); // top .. producer
    var n = disp.length;
    var transfer = VE.Eco.simSettings(eco.id).transferPercent;
    var geo = VE.Pyramid.geometry(n, { levelHeight: 60, gap: 6, flatTop: true, flatTopRatio: 0.16, baseWidth: 540, cx: 500 });
    var OY = 34, W = 980, H = OY + geo.H + 96;
    var STAGES = n + 3; // 0 empty, 1..n levels (producer first), n+1 decomposers, n+2 summary
    var stage = 0, timer = null, playing = true, speed = 1;

    var card = el('section', { class: 'card scene-card' });
    host.appendChild(card);
    var svg = S('svg', { class: 'energy-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Energy transfer through the food pyramid' });
    card.appendChild(svg);
    var defs = S('defs');
    defs.innerHTML = '<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffd23f" stop-opacity=".85"/><stop offset="1" stop-color="#ffd23f" stop-opacity=".15"/></linearGradient>' +
      '<marker id="arrRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e8501c"/></marker>' +
      '<marker id="arrBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1c6fd6"/></marker>' +
      '<marker id="arrBlueBig" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1c6fd6"/></marker>' +
      '<marker id="arrGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1e9d3b"/></marker>';
    svg.appendChild(defs);
    var g = S('g', { transform: 'translate(0,' + OY + ')' }); svg.appendChild(g);
    var staged = []; // {node, at}
    function add(node, at, parent) { node.classList.add('sc-el'); staged.push({ node: node, at: at }); (parent || g).appendChild(node); return node; }

    // rows indexed bottom-up: producer = 0
    function rowOf(levelIdx) { return geo.rows[n - 1 - levelIdx]; }

    // ---- empty gray pyramid (always visible)
    disp.forEach(function (l, i) {
      var r = geo.rows[i];
      g.appendChild(S('polygon', { points: VE.Pyramid.pts(r.pts), fill: '#e4e9f1', stroke: '#9aa8bd', 'stroke-width': 1.5, 'stroke-dasharray': '6 4', 'stroke-linejoin': 'round' }));
      var tx = S('text', { class: 'sc-label gray', x: geo.cx, y: r.cy + 4, 'text-anchor': 'middle' }); tx.textContent = l.label; g.appendChild(tx);
    });
    // sun (always visible)
    var sunY = geo.rows[n - 1].cy;
    var sun = S('g', { transform: 'translate(40,' + (sunY - 62) + ') scale(1.5)', class: 'sun-spin' });
    sun.innerHTML = '<g stroke="#f7b500" stroke-width="4" stroke-linecap="round"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g><circle cx="32" cy="32" r="12" fill="#ffd23f" stroke="#f7b500" stroke-width="2"/>';
    g.appendChild(sun);

    // ---- per-level colored fill + organisms + percent + heat + up-arrow
    disp.forEach(function (l, i) {
      var li = n - 1 - i; // 0 producer .. n-1 top
      var r = geo.rows[i], at = li + 1;
      var grp = S('g'); add(grp, at);
      grp.appendChild(S('polygon', { points: VE.Pyramid.pts(r.pts), fill: l.color, stroke: '#fff', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      var items = pool.filter(function (o) { return o.trophicLevel === l.id; }).slice(0, 4);
      var size = Math.max(18, Math.min(34, (r.hwm * 2 - 30) / Math.max(1, items.length) / 1.15));
      var total = items.length * size + Math.max(0, items.length - 1) * 8, x0 = geo.cx - total / 2;
      var nameY = r.y1 - 5;
      var lab = S('text', { class: 'sc-label', x: geo.cx, y: items.length ? r.y0 + 14 : r.cy + 5, 'text-anchor': 'middle', fill: l.id === 'secondary_consumer' ? '#4a3a00' : '#fff' }); lab.textContent = l.label; grp.appendChild(lab);
      items.forEach(function (o, k) {
        var cx = x0 + k * (size + 8) + size / 2;
        var im = S('image', { href: VE.Org.imageSrc(o), x: cx - size / 2, y: r.y0 + 18, width: size, height: size, preserveAspectRatio: 'xMidYMid meet' });
        im.addEventListener('error', function () { im.setAttribute('href', VE.Org.avatar(o)); });
        grp.appendChild(im);
        var nm = S('text', { class: 'sc-name', x: cx, y: nameY, 'text-anchor': 'middle' }); nm.textContent = o.name; grp.appendChild(nm);
      });
      // percent + heat arrow on the right
      var px = geo.cx + r.hw1 + 22;
      var pct = S('text', { class: 'sc-pct', x: px, y: r.cy + 7 }); pct.textContent = VE.Eco.energyText(eco.id, l.id); add(pct, at);
      var heat = S('path', { class: 'heat', d: 'M' + (px + 78) + ',' + (r.cy + 6) + ' c14,-16 22,12 38,-2 s22,-10 30,-12', fill: 'none', stroke: '#e8501c', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'marker-end': 'url(#arrRed)' });
      add(heat, at);
      // upward energy arrow to the next level
      if (li < n - 1) {
        var upper = geo.rows[i - 1];
        add(S('path', { class: 'up-arrow', d: 'M' + (geo.cx + upper.hw1 - 26) + ',' + (r.y0 + 10) + ' L' + (geo.cx + upper.hw1 - 26) + ',' + (upper.y1 - 10), stroke: '#1e9d3b', 'stroke-width': 4, fill: 'none', 'marker-end': 'url(#arrGreen)' }), at + 1);
      }
    });
    // sun beam + 100%
    var prod = geo.rows[n - 1];
    add(S('polygon', { points: '104,' + (sunY - 14) + ' ' + (geo.cx - prod.hw1 + 36) + ',' + prod.y0 + ' ' + (geo.cx - prod.hw1 + 8) + ',' + prod.y1 + ' 104,' + (sunY + 18), fill: 'url(#beam)' }), 1);
    var p100 = S('text', { class: 'sc-pct beam-pct', x: 150, y: sunY + 8 }); p100.textContent = '100%'; add(p100, 1);

    // lost-as-heat bracket
    var bx = W - 52, top = geo.rows[0].y0, bot = geo.rows[n - 1].y1;
    var br = S('g'); add(br, n);
    br.appendChild(S('path', { d: 'M' + (bx - 10) + ',' + top + ' h12 v' + (bot - top) + ' h-12', fill: 'none', stroke: '#e8501c', 'stroke-width': 3 }));
    var bt = S('text', { class: 'sc-heat-label', transform: 'translate(' + (bx + 26) + ',' + ((top + bot) / 2) + ') rotate(90)', 'text-anchor': 'middle' }); bt.textContent = 'LOST ENERGY AS HEAT'; br.appendChild(bt);

    // ---- decomposers + recycled nutrients
    var dAt = n + 1, dx = 118, dy = 76;
    var decomp = ctx.decomposer;
    var dg = S('g'); add(dg, dAt);
    dg.appendChild(S('circle', { cx: dx, cy: dy, r: 58, fill: '#ffe9ef', stroke: '#e88aa3', 'stroke-width': 2.5 }));
    if (decomp && decomp.image) {
      var dim = S('image', { href: decomp.image, x: dx - 38, y: dy - 46, width: 76, height: 76, preserveAspectRatio: 'xMidYMid meet' });
      dim.addEventListener('error', function () { dim.setAttribute('href', VE.Org.avatar(decomp)); }); dg.appendChild(dim);
    } else {
      var em = S('text', { x: dx, y: dy + 8, 'text-anchor': 'middle', 'font-size': 46 }); em.textContent = '🍄'; dg.appendChild(em);
    }
    var dn = S('text', { class: 'sc-name big', x: dx, y: dy + 38, 'text-anchor': 'middle' }); dn.textContent = decomp ? decomp.name : 'Bacteria & Fungi'; dg.appendChild(dn);
    var dl = S('g', { transform: 'translate(' + (dx - 44) + ',' + (dy + 62) + ')' });
    dl.appendChild(S('rect', { width: 88, height: 22, rx: 11, fill: '#d9e8fb', stroke: '#9bbbe6' }));
    var dlt = S('text', { x: 44, y: 15, 'text-anchor': 'middle', class: 'sc-name big' }); dlt.textContent = 'Decomposers'; dl.appendChild(dlt); dg.appendChild(dl);
    // thin arrows: dead organisms -> decomposers (drawn decomposers -> upper levels as in the mockup)
    for (var k = 0; k < Math.min(3, n - 1); k++) {
      var r2 = geo.rows[k];
      add(S('path', { d: 'M' + (dx + 52) + ',' + (dy - 12 + k * 14) + ' Q' + (geo.cx - 120) + ',' + (r2.cy - 30) + ' ' + (geo.cx - r2.hw1 + 12) + ',' + r2.cy, fill: 'none', stroke: '#1c6fd6', 'stroke-width': 1.6, 'marker-end': 'url(#arrBlue)', class: 'nutr-thin' }), dAt);
    }
    // thick recycled nutrient arrow to producers
    add(S('path', { class: 'nutr-big', d: 'M' + (dx - 34) + ',' + (dy + 100) + ' C' + (dx - 40) + ',' + (sunY - 30) + ' ' + (geo.cx - 280) + ',' + (sunY - 40) + ' ' + (geo.cx - prod.hw1 + 70) + ',' + (sunY - 24), fill: 'none', stroke: '#1c6fd6', 'stroke-width': 9, 'stroke-linecap': 'round', 'marker-end': 'url(#arrBlueBig)' }), dAt);
    var rn = S('text', { class: 'sc-nutr-label', x: dx + 6, y: dy + 142 }); rn.textContent = 'RECYCLED'; add(rn, dAt);
    var rn2 = S('text', { class: 'sc-nutr-label', x: dx + 6, y: dy + 158 }); rn2.textContent = 'NUTRIENTS'; add(rn2, dAt);

    // ---- caption + legend + controls (HTML under the scene)
    var caption = el('div', { class: 'scene-caption', role: 'status', 'aria-live': 'polite' });
    var legend = el('ul', { class: 'legend-row' }, [
      el('li', {}, [el('i', { class: 'lg lg-green' }), ' Energy moves up one way']),
      el('li', {}, [el('i', { class: 'lg lg-red' }), ' Energy lost as heat (not recycled)']),
      el('li', {}, [el('i', { class: 'lg lg-blue' }), ' Nutrients are recycled by decomposers'])
    ]);
    var dots = el('div', { class: 'stage-dots' });
    var btnBack = el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { stop(); go(stage - 1); } }, t('back'));
    var btnPlay = el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { playing ? stop() : startAuto(); } });
    var btnNext = el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { stop(); go(stage + 1); } }, t('next'));
    var btnReplay = el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { go(0); startAuto(); } }, [UI.icon('reset'), ' ' + t('replay')]);
    var btnSpeed = el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('speed'), onclick: function () { speed = speed === 1 ? 2 : speed === 2 ? 0.5 : 1; btnSpeed.textContent = 'x' + speed; if (playing) startAuto(); } }, 'x1');
    var home = el('button', { type: 'button', class: 'round-home', 'aria-label': t('home'), onclick: function () { ctx.api.home && ctx.api.home(); } }, UI.icon('home'));
    var controls = el('div', { class: 'scene-controls' }, [btnBack, btnPlay, btnNext, btnReplay, btnSpeed, dots]);
    host.appendChild(el('div', { class: 'scene-foot' }, [caption, legend, controls]));
    card.appendChild(home); home.style.display = 'none';
    for (var d = 0; d < STAGES; d++) dots.appendChild(el('span', { class: 'dot' }));

    function captionFor(s) {
      if (s === 0) return 'All the energy in this ecosystem starts with the sun. Press Next or Play to follow it up the food pyramid.';
      if (s <= n) {
        var l = disp[n - s]; var pct = VE.Eco.energyText(eco.id, l.id);
        var names = VE.Org.names(pool.filter(function (o) { return o.trophicLevel === l.id; })).join(', ');
        if (s === 1) return l.label + ' (' + names + ') capture sunlight and keep ' + pct + ' of the usable energy. Some is used for life processes and lost as heat; about ' + transfer + '% moves up.';
        return l.label + (names ? ' (' + names + ')' : '') + ' receive about ' + pct + ' of the energy. They use most of it to live and lose it as heat, so only about ' + transfer + '% passes on.';
      }
      if (s === n + 1) return 'Decomposers (bacteria and fungi) break down dead plants and animals. Nutrients are RECYCLED back to the soil for producers, but energy is NOT recycled: it leaves as heat.';
      return 'Only about ' + transfer + '% of the energy passes to the next level. The rest is used for life processes or lost as heat. Less energy means fewer organisms can live at the top.';
    }

    function go(s) {
      stage = Math.max(0, Math.min(STAGES - 1, s));
      staged.forEach(function (e) { e.node.classList.toggle('on', stage >= e.at); });
      caption.textContent = captionFor(stage);
      Array.prototype.forEach.call(dots.children, function (dEl, i) { dEl.classList.toggle('on', i <= stage); });
      btnBack.disabled = stage === 0; btnNext.disabled = stage === STAGES - 1;
      home.style.display = stage === STAGES - 1 ? '' : 'none';
      if (stage > 0) UI.Sound.pop();
      if (stage === STAGES - 1) { UI.Sound.win(); stop(); ctx.api.complete(); }
    }
    function tick() { if (stage < STAGES - 1) go(stage + 1); else stop(); }
    function startAuto() { clearInterval(timer); playing = true; btnPlay.replaceChildren(UI.icon('pause'), ' ' + t('pause')); timer = setInterval(tick, 3200 / speed); }
    function stop() { clearInterval(timer); playing = false; btnPlay.replaceChildren(UI.icon('play'), ' ' + t('play')); }

    go(0); startAuto();
    return { destroy: function () { clearInterval(timer); UI.clear(host); } };
  }

  VE.EnergyFlow = { create: energyFlow };
})(window.VE = window.VE || {});
