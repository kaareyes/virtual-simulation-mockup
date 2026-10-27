/*
 * Student activities driven by the JSON database: explore, arrange (organisms), arrangeEnergy.
 * Each factory receives ctx = { host, lesson, activity, eco, organisms, api:{ complete(), next(), nextLabel, done } }
 * and returns { destroy() }.
 */
(function (VE) {
  'use strict';
  var UI = VE.UI, el = UI.el, t = function (k) { return VE.I18n.t(k); };

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function lvLabel(l) { return l.label + (l.shortLabel && l.shortLabel !== l.label && l.id !== 'producer' && l.id !== 'top_predator' ? ' (' + l.shortLabel + ')' : ''); }

  function cornerLabels(card, mode, eco, withSun) {
    var top = mode === 'percent' ? Eco_text(eco, 'top_predator') : t('leastEnergy');
    var bot = mode === 'percent' ? Eco_text(eco, 'producer') : t('mostEnergy');
    card.appendChild(el('div', { class: 'corner corner-top' + (mode === 'percent' ? ' corner-pct' : ''), text: top }));
    card.appendChild(el('div', { class: 'corner corner-bottom' + (mode === 'percent' ? ' corner-pct' : ''), text: bot }));
  }
  function Eco_text(eco, level) { return VE.Eco.energyText(eco.id, level); }

  function nextButton(ctx, cls) {
    return el('button', { type: 'button', class: 'round-next ' + (cls || ''), 'aria-label': t('next'), onclick: function () { ctx.api.next(); } }, UI.icon('arrow'));
  }

  // =============================================================== EXPLORE
  function explore(ctx) {
    var eco = ctx.eco, act = ctx.activity, mode = act.mode === 'percent' ? 'percent' : 'qualitative';
    var all = VE.Org.inEcosystem(eco.id);
    var disp = VE.Eco.displayLevels(eco); // top .. producer
    var st = { expanded: false, selected: null, visited: {} };
    var host = ctx.host;
    var grid = el('div', { class: 'act-grid' });
    var left = el('section', { class: 'card pyramid-card', 'aria-label': 'Food pyramid' });
    var right = el('section', { class: 'card side-card', 'aria-live': 'polite' });
    grid.appendChild(left); grid.appendChild(right); host.appendChild(grid);

    function consumersLevels() { return disp.filter(function (l) { return ['primary_consumer', 'secondary_consumer', 'tertiary_consumer'].indexOf(l.id) >= 0; }); }
    function energyOf(l) { return mode === 'percent' ? VE.Eco.energyText(eco.id, l.id) : l.energyLabel; }
    function descOf(l) { return mode === 'percent' ? (l.energyDescription || l.description) : l.description; }

    function drawPyramid() {
      UI.clear(left);
      cornerLabels(left, mode, eco);
      var levels;
      if (!st.expanded) {
        var cons = consumersLevels()[0];
        var mk = function (id, label, color, key) {
          var items = key === 'consumers' ? [] : all.filter(function (o) { return o.trophicLevel === id; });
          return { id: key || id, label: label, color: color, items: items, hideItems: !st.visited[key || id], selected: st.selected === (key || id) };
        };
        levels = [mk('top_predator', Eco_label(disp, 'top_predator'), Eco_color(disp, 'top_predator')),
          mk('consumers', 'Consumers', cons ? cons.color : '#1ab3d0', 'consumers'),
          mk('producer', Eco_label(disp, 'producer'), Eco_color(disp, 'producer'))];
      } else {
        levels = disp.map(function (l) {
          return { id: l.id, label: l.label, sub: l.shortLabel, color: l.color, items: all.filter(function (o) { return o.trophicLevel === l.id; }),
            selected: st.selected === l.id, textColor: l.id === 'secondary_consumer' ? '#4a3a00' : '#fff',
            text: mode === 'percent' ? VE.Eco.energyText(eco.id, l.id) : '' };
        });
      }
      var wrap = el('div', { class: 'pyramid-wrap' });
      left.appendChild(wrap);
      VE.Pyramid.render(wrap, { levels: levels, levelHeight: st.expanded ? 74 : 104, gap: 4, onSelect: choose });
    }
    function Eco_label(d, id) { return d.find(function (l) { return l.id === id; }).label; }
    function Eco_color(d, id) { return d.find(function (l) { return l.id === id; }).color; }

    function orgChips(list) {
      if (!list.length) return el('p', { class: 'muted', text: t('noOrganisms') });
      return el('div', { class: 'chip-row' }, list.map(function (o) { return el('span', { class: 'org-chip' }, [VE.Org.img(o), o.name]); }));
    }
    function relationships(list) {
      var rows = list.map(function (o) {
        var prey = VE.Org.names(VE.Org.preyOf(o)), by = VE.Org.names(VE.Org.predatorsOf(o.id));
        return el('li', {}, [el('strong', { text: o.name }), ' — ' + t('eats') + ': ' + (prey.join(', ') || t('nothing')) + '. ' + t('eatenBy') + ': ' + (by.join(', ') || t('nothing')) + '.']);
      });
      return el('details', { class: 'rel' }, [el('summary', { text: t('foodRelationships') }), el('ul', {}, rows)]);
    }

    function levelBlock(l, full) {
      var list = all.filter(function (o) { return o.trophicLevel === l.id; });
      var b = el('div', { class: 'lv-block' }, [
        el('h3', { class: 'lv-title', style: { color: l.id === 'secondary_consumer' ? '#c79a00' : l.color } }, [lvLabel(l)]),
        el('p', { text: descOf(l) }),
        el('p', { class: 'energy-line' }, [el('strong', { text: t('energy') + ': ' }), energyOf(l)])
      ]);
      if (full) {
        b.appendChild(orgChips(list));
        b.appendChild(el('p', { class: 'role-line' }, [el('strong', { text: t('role') + ': ' }), l.role || '']));
        b.appendChild(relationships(list));
      }
      return b;
    }

    function drawDetail() {
      UI.clear(right);
      if (!st.selected) {
        right.appendChild(el('h2', { class: 'panel-head', text: t('description') }));
        right.appendChild(el('p', { class: 'placeholder', text: t('clickBegin') }));
        return;
      }
      if (st.selected === 'consumers') {
        right.appendChild(el('h2', { class: 'panel-head green', text: 'CONSUMERS' }));
        if (mode === 'qualitative') right.appendChild(el('p', { text: act.consumersIntro || 'Cannot make their own food. They get energy by eating other organisms. Herbivores eat plants. Omnivores eat plants and animals.' }));
        consumersLevels().slice().reverse().forEach(function (l) { right.appendChild(levelBlock(l, false)); });
      } else {
        var l = disp.find(function (x) { return x.id === st.selected; });
        var title = el('h2', { class: 'panel-head green', text: l.label.toUpperCase() + (l.shortLabel && l.shortLabel !== l.label && l.id !== 'producer' && l.id !== 'top_predator' ? ' (' + l.shortLabel + ')' : '') });
        right.appendChild(title);
        right.appendChild(el('p', { text: descOf(l) }));
        right.appendChild(el('p', { class: 'energy-line' }, [el('strong', { text: t('energy') + ': ' }), energyOf(l)]));
        var list = all.filter(function (o) { return o.trophicLevel === l.id; });
        right.appendChild(el('h3', { class: 'sub-head', text: t('organisms') }));
        right.appendChild(orgChips(list));
        right.appendChild(el('p', { class: 'role-line' }, [el('strong', { text: t('role') + ': ' }), l.role || '']));
        right.appendChild(relationships(list));
      }
      if (allVisited()) right.appendChild(nextButton(ctx, 'abs-br'));
    }
    function allVisited() { return st.visited.producer && st.visited.consumers && st.visited.top_predator; }

    function choose(id) {
      UI.Sound.pop();
      if (id === 'consumers') { st.expanded = true; st.visited.consumers = true; }
      else if (!st.expanded && (id === 'producer' || id === 'top_predator')) st.visited[id] = true;
      else {
        st.visited[id] = true;
        if (['primary_consumer', 'secondary_consumer', 'tertiary_consumer'].indexOf(id) >= 0) st.visited.consumers = true;
      }
      if (st.expanded) { st.visited.producer = true; st.visited.top_predator = st.visited.top_predator || false; }
      st.selected = id;
      drawPyramid(); drawDetail();
      if (allVisited() && !ctx.api.done()) ctx.api.complete();
    }

    drawPyramid(); drawDetail();
    return { destroy: function () { UI.clear(host); } };
  }

  // =============================================================== ARRANGE ORGANISMS
  function arrange(ctx) {
    var eco = ctx.eco, act = ctx.activity, mode = ctx.lesson.activities.some(function (a) { return a.type === 'arrangeEnergy' && a.enabled; }) ? 'percent' : 'qualitative';
    var pool = ctx.organisms.filter(function (o) { return VE.Const.LEVELS.indexOf(o.trophicLevel) >= 0; });
    var host = ctx.host, disp = VE.Eco.displayLevels(eco);
    var placed = {}, mistakes = 0, hinted = null;
    var grid = el('div', { class: 'act-grid' });
    var left = el('section', { class: 'card pyramid-card' });
    var right = el('section', { class: 'card side-card' });
    grid.appendChild(left); grid.appendChild(right); host.appendChild(grid);
    cornerLabels(left, mode, eco);

    if (!pool.length) { right.appendChild(el('p', { class: 'placeholder', text: t('noOrganisms') })); return { destroy: function () { UI.clear(host); } }; }

    var wrap = el('div', { class: 'pyramid-wrap' }); left.appendChild(wrap);
    var levels = disp.map(function (l) { return { id: l.id, label: l.label, color: l.color, dashed: true, zone: true, items: [] }; });
    var py = VE.Pyramid.render(wrap, { levels: levels, flatTop: true, levelHeight: 74, gap: 5 });

    right.appendChild(el('h2', { class: 'panel-head', text: t('dragOrganisms') }));
    var cards = el('div', { class: 'org-grid' });
    var order = shuffle(pool);
    order.forEach(function (o) {
      cards.appendChild(el('div', { class: 'org-card', 'data-drag': 'org', 'data-id': o.id, tabindex: '0', role: 'button', 'aria-pressed': 'false', 'aria-label': o.name + '. ' + (o.description || '') }, [VE.Org.img(o), el('span', { text: o.name })]));
    });
    right.appendChild(cards);

    var bar = el('div', { class: 'act-bar' });
    var progress = el('div', { class: 'progress' }, [el('div', { class: 'progress-fill' })]);
    var counter = el('span', { class: 'act-count' });
    var feedback = el('div', { class: 'feedback', role: 'status' });
    var hintBtn = el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { giveHint(); } }, [UI.icon('bulb'), ' ' + t('hint')]);
    var resetBtn = el('button', { type: 'button', class: 'btn btn-ghost', onclick: reset }, [UI.icon('reset'), ' ' + t('reset')]);
    bar.appendChild(el('div', { class: 'bar-top' }, [progress, counter]));
    bar.appendChild(el('div', { class: 'bar-btns' }, [hintBtn, resetBtn]));
    bar.appendChild(feedback);
    right.appendChild(bar);
    var popup = null;

    function updateProgress() {
      var n = Object.keys(placed).length;
      progress.firstChild.style.width = (n / pool.length * 100) + '%';
      counter.textContent = n + ' / ' + pool.length + (mistakes ? ' · ' + t('score') + ': ' + mistakes : '');
    }
    function closePopup() { if (popup) { popup.remove(); popup = null; } }
    function showPopup(item) {
      closePopup();
      var o = pool.find(function (x) { return x.id === item.dataset.id; });
      var hintText = el('p', { class: 'popup-hint', 'aria-live': 'polite' });
      popup = el('div', { class: 'org-popup', role: 'dialog', 'aria-label': o.name }, [
        el('button', { type: 'button', class: 'popup-x', 'aria-label': t('dismiss'), onclick: closePopup }, UI.icon('close')),
        VE.Org.img(o, 'popup-img'), el('h3', { text: o.name }), el('p', { text: o.description || '' }), hintText,
        el('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: function () { hintText.textContent = o.hint || ('Think about what ' + o.name + ' eats.'); highlightFor(o); } }, [UI.icon('bulb'), ' ' + t('hint')])
      ]);
      right.appendChild(popup);
    }
    function highlightFor(o) {
      py.flash(o.trophicLevel, 'hint-glow');
    }
    function giveHint() {
      var sel = dd.selected();
      var o = sel ? pool.find(function (x) { return x.id === sel.dataset.id; }) : pool.find(function (x) { return !placed[x.id]; });
      if (!o) return;
      var lvl = disp.find(function (l) { return l.id === o.trophicLevel; });
      highlightFor(o);
      feedback.className = 'feedback hint'; feedback.textContent = (o.hint ? o.hint + ' ' : '') + o.name + ' → ' + lvl.label + '.';
      UI.announce(feedback.textContent);
    }
    function reset() {
      placed = {}; mistakes = 0; closePopup();
      cards.querySelectorAll('.org-card').forEach(function (c) { c.classList.remove('is-placed'); c.style.visibility = ''; c.removeAttribute('aria-hidden'); });
      disp.forEach(function (l) { py.setItems(l.id, []); });
      feedback.textContent = ''; feedback.className = 'feedback';
      right.querySelectorAll('.done-panel').forEach(function (n) { n.remove(); });
      cards.style.display = ''; bar.style.display = '';
      updateProgress(); dd.setEnabled(true);
    }
    function finish() {
      UI.Sound.win(); UI.announce(t('allPlaced'));
      ctx.api.complete();
      dd.setEnabled(false);
      cards.style.display = 'none'; bar.style.display = 'none'; closePopup();
      right.appendChild(donePanel(ctx, t('allPlaced'), reset));
    }

    var dd = VE.DragDrop.create({
      root: grid, itemSelector: '[data-drag="org"]', zoneSelector: '[data-drop="level"]',
      accepts: function (item, zone) { return item.dataset.drag === 'org' && zone.dataset.drop === 'level'; },
      onSelect: showPopup,
      onDrop: function (item, zone) {
        var o = pool.find(function (x) { return x.id === item.dataset.id; });
        var lvl = zone.dataset.level;
        if (o.trophicLevel === lvl) { UI.Sound.good(); return { ok: true, org: o, level: lvl }; }
        mistakes++; UI.Sound.bad();
        var chosen = disp.find(function (l) { return l.id === lvl; });
        feedback.className = 'feedback bad'; feedback.textContent = t('tryAgain') + ' (' + o.name + ' ✗ ' + chosen.label + ')';
        UI.announce(feedback.textContent); updateProgress();
        return { ok: false };
      },
      onResult: function (item, zone, res) {
        if (!res.ok) return;
        placed[res.org.id] = res.level;
        item.classList.add('is-placed'); item.style.visibility = 'hidden'; item.setAttribute('aria-hidden', 'true'); item.setAttribute('tabindex', '-1');
        closePopup();
        py.setItems(res.level, pool.filter(function (x) { return placed[x.id] === res.level; }), true);
        feedback.className = 'feedback good'; feedback.textContent = t('correct') + ' ' + res.org.name + ' ✓';
        UI.announce(feedback.textContent);
        updateProgress();
        if (Object.keys(placed).length === pool.length) finish();
      }
    });
    updateProgress();
    return { destroy: function () { dd.destroy(); closePopup(); UI.clear(host); } };
  }

  function donePanel(ctx, msg, resetFn) {
    var nl = ctx.api.nextLabel;
    return el('div', { class: 'done-panel' }, [
      el('div', { class: 'big-check' }, UI.icon('check')),
      el('h2', { class: 'done-title', text: t('allDone') }),
      el('p', { class: 'muted', text: msg || t('pleaseClick') }),
      nl ? el('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: function () { ctx.api.next(); }, autofocus: 'autofocus' }, nl.toUpperCase()) : null,
      resetFn ? el('button', { type: 'button', class: 'btn btn-ghost', onclick: resetFn }, [UI.icon('reset'), ' ' + t('reset')]) : null
    ]);
  }

  // =============================================================== ARRANGE ENERGY
  function arrangeEnergy(ctx) {
    var eco = ctx.eco, act = ctx.activity, host = ctx.host, disp = VE.Eco.displayLevels(eco);
    var pool = ctx.organisms;
    var prefill = act.prefill || ['producer', 'top_predator'];
    var value = function (l) { return VE.Eco.energyText(eco.id, l.id); };
    var targets = disp.filter(function (l) { return prefill.indexOf(l.id) < 0; });
    var correctVals = disp.map(value);
    var decoys = (act.decoys || []).filter(function (d) { return correctVals.indexOf(d) < 0; });
    var chipsData = shuffle(targets.map(function (l) { return value(l); }).concat(decoys));
    var filled = {}, mistakes = 0;

    var grid = el('div', { class: 'act-grid' });
    var left = el('section', { class: 'card pyramid-card' });
    var right = el('section', { class: 'card side-card' });
    grid.appendChild(left); grid.appendChild(right); host.appendChild(grid);
    cornerLabels(left, 'percent', eco);
    var wrap = el('div', { class: 'pyramid-wrap' }); left.appendChild(wrap);
    var levels = disp.map(function (l) { return { id: l.id, label: l.label, color: l.color, dashed: true, items: pool.filter(function (o) { return o.trophicLevel === l.id; }) }; });
    var slots = disp.map(function (l) { var pre = prefill.indexOf(l.id) >= 0; return { levelId: l.id, text: pre ? value(l) : '', zone: !pre }; });
    var py = VE.Pyramid.render(wrap, { levels: levels, flatTop: true, levelHeight: 74, gap: 5, slots: slots, baseWidth: 480, cx: 300 });

    right.appendChild(el('h2', { class: 'panel-head', text: t('dragEnergy') }));
    var chips = el('div', { class: 'chip-grid' });
    chipsData.forEach(function (v, i) { chips.appendChild(el('div', { class: 'energy-chip', 'data-drag': 'energy', 'data-value': v, tabindex: '0', role: 'button', 'aria-pressed': 'false', id: 'chip' + i }, v)); });
    right.appendChild(chips);
    var bar = el('div', { class: 'act-bar' });
    var progress = el('div', { class: 'progress' }, [el('div', { class: 'progress-fill' })]);
    var counter = el('span', { class: 'act-count' });
    var feedback = el('div', { class: 'feedback', role: 'status' });
    bar.appendChild(el('div', { class: 'bar-top' }, [progress, counter]));
    bar.appendChild(el('div', { class: 'bar-btns' }, [
      el('button', { type: 'button', class: 'btn btn-outline', onclick: hint }, [UI.icon('bulb'), ' ' + t('hint')]),
      el('button', { type: 'button', class: 'btn btn-ghost', onclick: reset }, [UI.icon('reset'), ' ' + t('reset')])]));
    bar.appendChild(feedback);
    right.appendChild(bar);

    function update() {
      var n = Object.keys(filled).length;
      progress.firstChild.style.width = (n / targets.length * 100) + '%';
      counter.textContent = n + ' / ' + targets.length + (mistakes ? ' · ' + t('score') + ': ' + mistakes : '');
    }
    function hint() {
      var next = targets.find(function (l) { return !filled[l.id]; });
      if (!next) return;
      py.flash(next.id, 'hint-glow');
      var tp = VE.Eco.simSettings(eco.id).transferPercent;
      feedback.className = 'feedback hint';
      feedback.textContent = (act.hint || '') + ' ' + next.label + ': ' + t('energy') + ' = ' + (disp[disp.indexOf(next) + 1] ? value(disp[disp.indexOf(next) + 1]) : '') + ' × ' + tp + '% = ?';
    }
    function reset() {
      filled = {}; mistakes = 0;
      targets.forEach(function (l) {
        py.setSlotText(l.id, ''); var s = py.slotNode(l.id); s.setAttribute('data-drop', 'energy'); s.setAttribute('tabindex', '0');
      });
      chips.querySelectorAll('.energy-chip').forEach(function (c) { c.classList.remove('is-placed'); c.style.visibility = ''; c.setAttribute('tabindex', '0'); });
      right.querySelectorAll('.done-panel').forEach(function (n) { n.remove(); });
      chips.style.display = ''; bar.style.display = ''; feedback.textContent = ''; feedback.className = 'feedback';
      update(); dd.setEnabled(true);
    }
    var dd = VE.DragDrop.create({
      root: grid, itemSelector: '[data-drag="energy"]', zoneSelector: '[data-drop="energy"]',
      accepts: function (item, zone) { return item.dataset.drag === 'energy' && zone.dataset.drop === 'energy'; },
      onDrop: function (item, zone) {
        var lvl = disp.find(function (l) { return l.id === zone.dataset.level; });
        if (item.dataset.value === value(lvl)) { UI.Sound.good(); return { ok: true, lvl: lvl, v: item.dataset.value }; }
        mistakes++; UI.Sound.bad(); update();
        feedback.className = 'feedback bad'; feedback.textContent = t('tryAgain') + ' (' + item.dataset.value + ' ✗ ' + lvl.label + ')';
        UI.announce(feedback.textContent);
        return { ok: false };
      },
      onResult: function (item, zone, res) {
        if (!res.ok) return;
        filled[res.lvl.id] = res.v;
        py.setSlotText(res.lvl.id, res.v);
        var s = py.slotNode(res.lvl.id); s.removeAttribute('data-drop'); s.removeAttribute('tabindex');
        item.classList.add('is-placed'); item.style.visibility = 'hidden'; item.setAttribute('tabindex', '-1');
        feedback.className = 'feedback good'; feedback.textContent = t('correct') + ' ' + res.lvl.label + ' = ' + res.v;
        UI.announce(feedback.textContent); update();
        if (Object.keys(filled).length === targets.length) {
          UI.Sound.win(); ctx.api.complete(); dd.setEnabled(false);
          chips.style.display = 'none'; bar.style.display = 'none';
          right.appendChild(donePanel(ctx, null, reset));
        }
      }
    });
    update();
    return { destroy: function () { dd.destroy(); UI.clear(host); } };
  }

  VE.Activities = { explore: explore, arrange: arrange, arrangeEnergy: arrangeEnergy, donePanel: donePanel };
})(window.VE = window.VE || {});
