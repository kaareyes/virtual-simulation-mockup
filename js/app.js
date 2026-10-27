/* Student application shell: header, home, objectives, lesson stepper. Every screen reads from VE.DB (the JSON database). */
(function (VE) {
  'use strict';
  var UI = VE.UI, el = UI.el, t = function (k) { return VE.I18n.t(k); };
  var root, state = { view: 'home', lessonId: null, stepIdx: 0, actIdx: 0 }, current = null, menuClose = null;

  function lessons() { return VE.Lessons.enabled(); }
  function lesson() { var ls = lessons(); return ls.find(function (l) { return l.id === state.lessonId; }) || ls[0] || null; }

  // ---------------------------------------------------------------- header
  function popMenu(anchor, items, onPick, selected) {
    if (menuClose) menuClose();
    var m = el('ul', { class: 'menu', role: 'menu' }, items.map(function (it) {
      return el('li', { role: 'none' }, el('button', { type: 'button', role: 'menuitemradio', 'aria-checked': String(it.id === selected), class: it.id === selected ? 'sel' : '', onclick: function () { menuClose(); onPick(it.id); } }, it.label));
    }));
    var wrap = anchor.parentNode; wrap.classList.add('has-menu'); wrap.appendChild(m);
    function off(e) { if (!m.contains(e.target) && e.target !== anchor) menuClose(); }
    function key(e) { if (e.key === 'Escape') { menuClose(); anchor.focus(); } }
    menuClose = function () { m.remove(); wrap.classList.remove('has-menu'); document.removeEventListener('mousedown', off); document.removeEventListener('keydown', key); menuClose = null; };
    setTimeout(function () { document.addEventListener('mousedown', off); document.addEventListener('keydown', key); }, 0);
    var f = m.querySelector('button.sel') || m.querySelector('button'); if (f) f.focus();
  }

  function renderHeader() {
    var h = document.getElementById('top-bar'); UI.clear(h);
    var ls = lessons(), l = lesson(), eco = VE.Eco.current();
    var sel = el('select', { id: 'lesson-select', 'aria-label': t('lesson'), onchange: function (e) { state.lessonId = e.target.value; VE.Store.set('lesson', state.lessonId); goHome(); } },
      ls.map(function (x) { return el('option', { value: x.id, selected: l && x.id === l.id }, x.title); }));
    var left = el('div', { class: 'tb-left' }, [el('label', { for: 'lesson-select', text: t('lesson') }), el('div', { class: 'select-wrap' }, sel)]);
    var ecoBtn = el('button', { type: 'button', class: 'eco-name', 'aria-haspopup': 'menu', title: t('ecosystemLabel') }, [eco ? (eco.shortName || eco.name) : '—', ' ▾']);
    ecoBtn.addEventListener('click', function () {
      popMenu(ecoBtn, VE.Eco.all().map(function (e) { return { id: e.id, label: e.name }; }), function (id) { VE.Eco.setCurrent(id); goHome(); }, eco && eco.id);
    });
    var langBtn = el('button', { type: 'button', class: 'tb-btn', 'aria-haspopup': 'menu' }, [UI.icon('globe'), el('span', { text: t('language') })]);
    langBtn.addEventListener('click', function () {
      popMenu(langBtn, VE.I18n.langs, function (id) { VE.I18n.set(id); VE.Store.set('lang', id); renderAll(); }, VE.I18n.lang);
    });
    var sndBtn = el('button', { type: 'button', class: 'tb-btn', 'aria-pressed': String(UI.Sound.enabled), onclick: function () { UI.Sound.toggle(); renderHeader(); if (UI.Sound.enabled) UI.Sound.pop(); } },
      [UI.icon(UI.Sound.enabled ? 'soundOn' : 'soundOff'), el('span', { text: t('sound') })]);
    var homeBtn = el('button', { type: 'button', class: 'tb-btn', onclick: goHome }, [UI.icon('home'), el('span', { text: t('home') })]);
    h.appendChild(left);
    h.appendChild(el('div', { class: 'tb-right' }, [el('div', { class: 'menu-host' }, ecoBtn), el('div', { class: 'menu-host' }, langBtn), sndBtn, homeBtn]));
  }

  // ---------------------------------------------------------------- navigation
  function goHome() { stop(); state.view = 'home'; renderAll(); }
  function stop() { if (current && current.destroy) { try { current.destroy(); } catch (e) { console.error(e); } } current = null; }

  function renderAll() { renderHeader(); renderMain(); }

  function renderMain() {
    stop();
    var main = document.getElementById('main'); UI.clear(main);
    main.className = 'main fade-in';
    var l = lesson(), eco = VE.Eco.current();
    if (!l || !eco) { main.classList.add('bg-photo'); main.appendChild(el('div', { class: 'card center-card' }, el('p', { text: t('noLessons') }))); return; }
    if (state.view === 'home' || state.view === 'objectives') {
      main.classList.add('bg-photo');
      main.style.backgroundImage = eco.backgroundImage ? 'url("' + eco.backgroundImage.replace(/"/g, '%22') + '")' : '';
      if (!eco.backgroundImage) main.classList.add('bg-fallback');
      if (state.view === 'home') renderHome(main, l, eco); else renderObjectives(main, l, eco);
      renderFooter(main);
    } else {
      main.style.backgroundImage = '';
      renderLesson(main, l, eco);
    }
  }

  function renderHome(main, l, eco) {
    var card = el('div', { class: 'card hero-card' }, [
      el('h1', { class: 'hero-title', text: VE.Eco.title(eco) }),
      el('div', { class: 'pill', text: l.subtitle || l.title })
    ]);
    main.appendChild(el('div', { class: 'center-stack' }, [card,
      el('button', { type: 'button', class: 'start-btn', onclick: function () { state.view = 'objectives'; renderMain(); }, autofocus: 'autofocus' }, t('start'))]));
  }
  function renderObjectives(main, l) {
    var card = el('div', { class: 'card obj-card' }, [
      el('h2', { class: 'pill big', text: t('learn') }),
      el('ol', { class: 'obj-list' }, l.objectives.map(function (o) { return el('li', { text: o }); })),
      el('button', { type: 'button', class: 'round-next', 'aria-label': t('next'), onclick: function () { startLesson(l); }, autofocus: 'autofocus' }, UI.icon('arrow'))
    ]);
    main.appendChild(el('div', { class: 'center-stack' }, card));
  }
  function renderFooter(main) {
    var db = VE.DB;
    var chip = el('div', { class: 'data-chip' }, [el('span', { text: t('dataSource') + ': ' + db.sourceLabel })]);
    if (db.needsReconnect) chip.appendChild(el('button', { type: 'button', class: 'link-btn', onclick: function () { db.reconnect().then(function () { UI.toast('Folder connected', 'success'); renderAll(); }, function (e) { UI.toast(e.message, 'error'); }); } }, t('reconnect')));
    var file = el('input', { type: 'file', accept: '.json,application/json', multiple: 'multiple', class: 'sr-only', tabindex: '-1', onchange: function (e) {
      if (!e.target.files.length) return;
      db.readImport(e.target.files).then(function (files) { return db.applyImport(files, true); }).then(function () { UI.toast('Database loaded', 'success'); renderAll(); }, function (err) { UI.dialog({ title: 'Could not load file', body: el('pre', { class: 'err-pre', text: err.message }) }); });
      e.target.value = '';
    } });
    chip.appendChild(el('button', { type: 'button', class: 'link-btn', onclick: function () { file.click(); } }, t('loadFile')));
    chip.appendChild(file);
    if (db.storageWarning) chip.setAttribute('title', db.storageWarning);
    main.appendChild(el('footer', { class: 'home-foot' }, [chip, el('div', { class: 'foot-center', text: (db.data.appSettings.footerText || '') }), el('a', { class: 'admin-link', href: 'admin.html' }, t('admin'))]));
  }

  // ---------------------------------------------------------------- lessons
  function startLesson(l) { state.view = 'lesson'; state.stepIdx = 0; state.actIdx = 0; var p = VE.Lessons.progress(l.id); renderMain(); }

  function stepUnlocked(l, steps, i) {
    if (!VE.DB.data.appSettings.lockSteps || i === 0) return true;
    return steps.slice(0, i).every(function (s) { return VE.Lessons.isStepDone(l.id, s); });
  }

  function renderLesson(main, l, eco) {
    var steps = VE.Lessons.steps(l);
    if (!steps.length) { main.appendChild(el('div', { class: 'card center-card' }, el('p', { text: t('noLessons') }))); return; }
    state.stepIdx = Math.min(state.stepIdx, steps.length - 1);
    var step = steps[state.stepIdx];
    state.actIdx = Math.min(state.actIdx, step.activities.length - 1);
    var act = step.activities[state.actIdx];

    var stepper = el('nav', { class: 'stepper-bar', 'aria-label': 'Lesson steps' });
    function drawStepper() {
      UI.clear(stepper);
      steps.forEach(function (s, i) {
        var done = VE.Lessons.isStepDone(l.id, s), unlocked = stepUnlocked(l, steps, i), active = i === state.stepIdx;
        var node = el('button', { type: 'button', class: 'step' + (active ? ' active' : '') + (done && !active ? ' done' : '') + (!unlocked ? ' locked' : ''), disabled: !unlocked, 'aria-current': active ? 'step' : null,
          title: unlocked ? '' : t('locked'), onclick: function () { state.stepIdx = i; state.actIdx = 0; renderMain(); } }, [
          el('span', { class: 'step-num' }, done && !active ? UI.icon('check') : String(i + 1)),
          el('span', { class: 'step-label', text: s.label }), !unlocked ? UI.icon('lock', 'step-lock') : null]);
        stepper.appendChild(node);
        if (i < steps.length - 1) stepper.appendChild(el('span', { class: 'step-line' + (done ? ' done' : '') }));
      });
    }
    drawStepper();
    var host = el('div', { class: 'act-host' });
    main.appendChild(stepper);
    main.appendChild(host);
    if (act.instructions) main.appendChild(el('p', { class: 'instr', text: act.instructions }));

    var nextAct = step.activities[state.actIdx + 1], nextStep = steps[state.stepIdx + 1];
    var api = {
      done: function () { return !!VE.Lessons.progress(l.id).done[act.id]; },
      complete: function () { VE.Lessons.markDone(l.id, act.id); drawStepper(); },
      nextLabel: nextAct ? nextAct.title : nextStep ? nextStep.activities[0].title : null,
      next: function () {
        if (nextAct) { state.actIdx++; renderMain(); }
        else if (nextStep) { state.stepIdx++; state.actIdx = 0; renderMain(); }
        else goHome();
      },
      home: goHome
    };
    var pool = VE.Lessons.pool(l, act, eco.id);
    var decomposer = VE.Org.inEcosystem(eco.id, { decomposers: true }).filter(function (o) { return o.trophicLevel === 'decomposer'; })[0] || null;
    var ctx = { host: host, lesson: l, activity: act, eco: eco, organisms: pool, api: api, decomposer: decomposer };
    var factory = { explore: VE.Activities.explore, arrange: VE.Activities.arrange, arrangeEnergy: VE.Activities.arrangeEnergy, simulation: VE.SimView.create, energyAnimation: VE.EnergyFlow.create }[act.type];
    try { current = factory(ctx); }
    catch (e) { console.error(e); host.appendChild(el('div', { class: 'card', style: { padding: '20px' } }, el('p', { class: 'err-pre', text: 'This activity could not be loaded: ' + e.message }))); }
  }

  // ---------------------------------------------------------------- start-up
  function boot() {
    VE.I18n.set(VE.Store.get('lang', 'en'));
    root = document.getElementById('app');
    VE.DB.init().then(function () {
      if (!VE.DB.data) { document.getElementById('main').appendChild(el('div', { class: 'card center-card' }, el('p', { class: 'err-pre', text: 'The database could not be loaded. Make sure data/default-data.js is present.' }))); return; }
      var sound = VE.Store.get('sound', VE.DB.data.appSettings.soundDefault !== false);
      UI.Sound.init(sound);
      if (!VE.Store.get('lang', null) && VE.DB.data.appSettings.defaultLanguage) VE.I18n.set(VE.DB.data.appSettings.defaultLanguage);
      state.lessonId = VE.Store.get('lesson', null);
      renderAll();
      if (VE.DB.storageWarning) UI.toast(VE.DB.storageWarning, 'info', 7000);
      VE.DB.on(function (type) { if (type === 'external-update') { UI.toast('Updated database loaded.', 'success'); if (state.view === 'lesson') state.view = 'home'; renderAll(); } });
    });
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window.VE = window.VE || {});
