/* Admin Dashboard: CRUD over the JSON database (organisms, ecosystems, lessons, simulation settings, app settings) + Database Manager. */
(function (VE) {
  'use strict';
  var UI = VE.UI, el = UI.el, DB, C;
  var view = 'overview', filters = { q: '', eco: '', level: '', status: '' }, simEco = null, jsonFile = 'organisms.json';
  var content, topStatus;

  var NAV = [['overview', 'Overview'], ['organisms', 'Organisms'], ['ecosystems', 'Ecosystems'], ['lessons', 'Lessons'], ['simulation', 'Simulation Settings'], ['settings', 'App Settings'], ['database', 'Database Manager']];

  // ------------------------------------------------------------------ helpers
  function field(label, input, help, cls) { return el('label', { class: 'fld ' + (cls || '') }, [el('span', { class: 'fld-l', text: label }), input, help ? el('small', { text: help }) : null]); }
  function text(v, a) { return el('input', Object.assign({ type: 'text', value: v == null ? '' : v }, a || {})); }
  function num(v, min, max, step, a) { return el('input', Object.assign({ type: 'number', value: v == null ? '' : v, min: min, max: max, step: step || 'any' }, a || {})); }
  function area(v, rows) { var a = el('textarea', { rows: rows || 3 }); a.value = v || ''; return a; }
  function select(opts, val) { return el('select', {}, opts.map(function (o) { return el('option', { value: o[0], selected: o[0] === val }, o[1]); })); }
  function check(label, val) { var i = el('input', { type: 'checkbox' }); i.checked = !!val; return { node: el('label', { class: 'chk' }, [i, ' ' + label]), input: i }; }
  function badge(txt, cls) { return el('span', { class: 'badge ' + (cls || ''), text: txt }); }
  function levelName(l) { return C.LEVEL_LABELS[l] || l; }
  function ecoName(id) { var e = DB.get('ecosystems', id); return e ? e.name : id; }
  function errBox(errs) { return el('ul', { class: 'err-list', role: 'alert' }, errs.map(function (e) { return el('li', { text: e }); })); }
  function showErrors(title, e) { UI.dialog({ title: title, body: errBox((e.validation && e.validation.errors) || String(e.message).split('\n')) }); }
  function thumb(o) { var i = VE.Org.img(o, 'thumb'); return i; }
  function num2(v) { var n = parseFloat(v); return isFinite(n) ? n : NaN; }

  /** Read a user-selected image and shrink it to a data URL (stored inside the JSON). */
  function readImage(file, maxDim, jpeg) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error('Please choose an image file.'));
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Could not read the image.')); };
      fr.onload = function () {
        if (file.type === 'image/svg+xml') { if (fr.result.length > 300000) return reject(new Error('SVG is too large.')); return resolve(fr.result); }
        var im = new Image();
        im.onerror = function () { reject(new Error('That file is not a valid image.')); };
        im.onload = function () {
          var s = Math.min(1, maxDim / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          resolve(jpeg ? c.toDataURL('image/jpeg', 0.8) : c.toDataURL('image/png'));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function imagePicker(initial, maxDim, jpeg) {
    var st = { value: initial || '' };
    var prev = el('div', { class: 'img-prev' });
    var path = text(st.value.indexOf('data:') === 0 ? '' : st.value, { placeholder: 'assets/organisms/name.png  (or upload below)' });
    var file = el('input', { type: 'file', accept: 'image/*' });
    function draw() { UI.clear(prev); if (st.value) prev.appendChild(el('img', { src: st.value, alt: 'preview', onerror: function () { prev.appendChild(el('small', { class: 'bad', text: 'Image not found at this path.' })); } })); else prev.appendChild(el('small', { class: 'muted', text: 'No image' })); }
    path.addEventListener('input', function () { st.value = path.value.trim(); draw(); });
    file.addEventListener('change', function () {
      if (!file.files[0]) return;
      readImage(file.files[0], maxDim, jpeg).then(function (d) { st.value = d; path.value = ''; draw(); }, function (e) { UI.toast(e.message, 'error'); });
    });
    draw();
    return { get: function () { return st.value; }, node: el('div', { class: 'img-picker' }, [prev, el('div', {}, [path, file, el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function () { st.value = ''; path.value = ''; file.value = ''; draw(); } }, 'Remove image')])]) };
  }

  // ------------------------------------------------------------------ shell
  function build() {
    var root = document.getElementById('admin-app'); UI.clear(root);
    var nav = el('nav', { class: 'side', 'aria-label': 'Admin sections' }, [el('div', { class: 'brand', text: 'Virtual Ecosystem' }), el('div', { class: 'brand-sub', text: 'Admin Dashboard' })]);
    NAV.forEach(function (n) { nav.appendChild(el('button', { type: 'button', class: 'nav-btn' + (view === n[0] ? ' active' : ''), 'aria-current': view === n[0] ? 'page' : null, onclick: function () { view = n[0]; build(); } }, n[1])); });
    nav.appendChild(el('a', { class: 'nav-link', href: 'index.html' }, '← Student view'));
    topStatus = el('div', { class: 'top-status' });
    var top = el('header', { class: 'topbar' }, [el('h1', { text: (NAV.filter(function (n) { return n[0] === view; })[0] || [])[1] }), topStatus]);
    content = el('main', { class: 'content', id: 'content' });
    root.appendChild(nav); root.appendChild(el('div', { class: 'right' }, [top, content]));
    updateStatus();
    ({ overview: pOverview, organisms: pOrganisms, ecosystems: pEcosystems, lessons: pLessons, simulation: pSimulation, settings: pSettings, database: pDatabase })[view]();
  }
  function updateStatus() {
    if (!topStatus) return;
    UI.clear(topStatus);
    topStatus.appendChild(el('span', { class: 'src', text: DB.sourceLabel + (DB.canWriteFolder() ? ' (read/write)' : '') }));
    topStatus.appendChild(DB.dirty ? badge('Unsaved changes', 'warn') : badge('All changes saved', 'ok'));
    topStatus.appendChild(el('button', { type: 'button', class: 'btn btn-primary', disabled: !DB.dirty, onclick: saveChanges }, 'Save Changes'));
  }

  function saveChanges(opts) {
    var v = DB.validate();
    if (v.errors.length) return UI.dialog({ title: 'Cannot save: fix these problems first', body: errBox(v.errors) });
    return DB.save(opts && opts.overrideConflict ? { overrideConflict: true } : {}).then(function (r) {
      var c = DB.counts();
      UI.toast(r.target === 'folder' ? 'Saved to folder "' + DB.folderName + '" (' + c.organisms + ' organisms, ' + c.ecosystems + ' ecosystems, ' + c.lessons + ' lessons). A backup of the old files was kept.' :
        'Saved to this browser. The student pages in this browser now use it. To write the JSON files, use "Open Database Folder" or Export.', 'success', 6000);
      if (r.warnings.length) UI.toast(r.warnings.length + ' warning(s) — see Overview.', 'info', 4000);
      updateStatus();
    }, function (e) {
      if (e.conflict) return UI.confirm('Files changed on disk', e.message, 'Overwrite anyway', true).then(function (ok) { if (ok) saveChanges({ overrideConflict: true }); });
      showErrors('Save failed', e);
    });
  }
  function rerender() { build(); }
  function afterChange() { updateStatus(); }

  // ------------------------------------------------------------------ overview
  function pOverview() {
    var c = DB.counts(), d = DB.data, act = d.organisms.filter(function (o) { return o.active; }).length;
    var enabledLessons = d.lessons.filter(function (l) { return l.enabled; });
    var enabledActs = d.lessons.reduce(function (n, l) { return n + l.activities.filter(function (a) { return a.enabled; }).length; }, 0);
    content.appendChild(el('div', { class: 'stats' }, [
      stat(c.ecosystems, 'Ecosystems'), stat(c.organisms, 'Organisms', act + ' active'), stat(enabledLessons.length, 'Active lessons', c.lessons + ' total'), stat(enabledActs, 'Available activities', c.activities + ' total')]));
    var ecoSel = select(d.ecosystems.map(function (e) { return [e.id, e.name]; }), simEco || d.ecosystems[0].id);
    var dist = el('div', { class: 'dist' });
    function drawDist() {
      UI.clear(dist); simEco = ecoSel.value;
      var orgs = d.organisms.filter(function (o) { return o.ecosystemId === ecoSel.value; }), max = Math.max(1, Math.max.apply(null, C.ORG_LEVELS.map(function (l) { return orgs.filter(function (o) { return o.trophicLevel === l; }).length; })));
      C.ORG_LEVELS.slice().reverse().forEach(function (l) {
        var n = orgs.filter(function (o) { return o.trophicLevel === l; }).length;
        dist.appendChild(el('div', { class: 'dist-row' }, [el('span', { class: 'dist-l', text: levelName(l) }), el('div', { class: 'dist-bar' }, el('i', { style: { width: (n / max * 100) + '%', background: VE.Org.PALETTE[l] } })), el('b', { text: String(n) })]));
      });
    }
    ecoSel.addEventListener('change', drawDist); drawDist();
    content.appendChild(el('section', { class: 'panel' }, [el('div', { class: 'panel-h' }, [el('h2', { text: 'Organisms by trophic level' }), ecoSel]), dist]));
    var v = DB.validate();
    var rows = d.ecosystems.map(function (e) {
      var s = d.simulationSettings.filter(function (x) { return x.ecosystemId === e.id; })[0];
      var n = d.organisms.filter(function (o) { return o.ecosystemId === e.id && o.active && o.trophicLevel !== 'decomposer'; }).length;
      var ok = s && n >= 2;
      return el('tr', {}, [el('td', { text: e.name }), el('td', { text: String(n) }), el('td', { text: s ? s.durationDays + ' days, seed ' + s.seed + ', ' + s.transferPercent + '% transfer' : 'defaults (no record)' }), el('td', {}, badge(ok ? 'Configured' : 'Needs attention', ok ? 'ok' : 'warn'))]);
    });
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Simulation configuration status' }), el('table', { class: 'tbl' }, [el('thead', {}, el('tr', {}, ['Ecosystem', 'Active organisms', 'Settings', 'Status'].map(function (h) { return el('th', { text: h }); }))), el('tbody', {}, rows)])]));
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Data checks' }),
      v.errors.length ? errBox(v.errors) : el('p', { class: 'ok-line', text: '✓ The database passes validation.' }),
      v.warnings.length ? el('ul', { class: 'warn-list' }, v.warnings.map(function (w) { return el('li', { text: w }); })) : null]));
  }
  function stat(n, l, sub) { return el('div', { class: 'stat' }, [el('b', { text: String(n) }), el('span', { text: l }), sub ? el('small', { text: sub }) : null]); }

  // ------------------------------------------------------------------ organisms
  function pOrganisms() {
    var d = DB.data;
    var q = text(filters.q, { placeholder: 'Search name, scientific name…', 'aria-label': 'Search organisms', type: 'search' });
    var fe = select([['', 'All ecosystems']].concat(d.ecosystems.map(function (e) { return [e.id, e.name]; })), filters.eco);
    var fl = select([['', 'All levels']].concat(C.ORG_LEVELS.map(function (l) { return [l, levelName(l)]; })), filters.level);
    var fs = select([['', 'Any status'], ['active', 'Active'], ['inactive', 'Inactive']], filters.status);
    var tb = el('tbody'); var cnt = el('span', { class: 'muted' });
    function draw() {
      filters = { q: q.value, eco: fe.value, level: fl.value, status: fs.value };
      var s = q.value.trim().toLowerCase();
      var list = d.organisms.filter(function (o) {
        return (!s || (o.name + ' ' + o.scientificName + ' ' + o.category + ' ' + o.id).toLowerCase().indexOf(s) >= 0) && (!fe.value || o.ecosystemId === fe.value) && (!fl.value || o.trophicLevel === fl.value) &&
          (!fs.value || (fs.value === 'active') === o.active);
      });
      cnt.textContent = list.length + ' of ' + d.organisms.length;
      UI.clear(tb);
      if (!list.length) tb.appendChild(el('tr', {}, el('td', { colspan: 8, class: 'empty', text: 'No organisms match.' })));
      list.forEach(function (o) {
        var tog = el('input', { type: 'checkbox', 'aria-label': 'Active: ' + o.name, onchange: function () { try { DB.update('organisms', o.id, { active: tog.checked }); afterChange(); } catch (e) { tog.checked = !tog.checked; showErrors('Cannot change', e); } } }); tog.checked = o.active;
        tb.appendChild(el('tr', { class: o.active ? '' : 'inactive' }, [
          el('td', {}, thumb(o)), el('td', {}, [el('b', { text: o.name }), el('br'), el('small', { class: 'muted', text: o.scientificName || o.id })]),
          el('td', {}, badge(levelName(o.trophicLevel), 'lv-' + o.trophicLevel)), el('td', { text: ecoName(o.ecosystemId) }), el('td', { text: String(o.population) }), el('td', {}, tog),
          el('td', { text: o.id, class: 'mono' }),
          el('td', { class: 'acts' }, [el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function () { viewOrganism(o.id); } }, 'View'), el('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: function () { editOrganism(o.id); } }, 'Edit'), el('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: function () { deleteRecord('organisms', o.id, o.name); } }, 'Delete')])]));
      });
    }
    [q, fe, fl, fs].forEach(function (n) { n.addEventListener('input', draw); n.addEventListener('change', draw); });
    content.appendChild(el('div', { class: 'toolbar' }, [q, fe, fl, fs, cnt, el('span', { class: 'grow' }), el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editOrganism(null); } }, '+ Add organism')]));
    content.appendChild(el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' }, [el('thead', {}, el('tr', {}, ['', 'Organism', 'Trophic level', 'Ecosystem', 'Population', 'Active', 'ID', 'Actions'].map(function (h) { return el('th', { text: h }); }))), tb])));
    draw();
  }

  function viewOrganism(id) {
    var o = DB.get('organisms', id);
    var prey = VE.Org.names(VE.Org.preyOf(o)).join(', ') || '—', by = VE.Org.names(VE.Org.predatorsOf(id)).join(', ') || '—';
    function row(k, v) { return el('tr', {}, [el('th', { text: k }), el('td', { text: String(v) })]); }
    UI.dialog({ title: o.name, wide: true, body: el('div', { class: 'view-org' }, [VE.Org.img(o, 'big-img'), el('table', { class: 'kv' }, [
      row('ID', o.id), row('Scientific name', o.scientificName || '—'), row('Category', o.category || '—'), row('Trophic level', levelName(o.trophicLevel)), row('Ecosystem', ecoName(o.ecosystemId)), row('Diet', o.diet || '—'),
      row('Eats (prey)', prey), row('Eaten by (predators)', by), row('Initial population', o.population), row('Reproduction rate', o.reproductionRate + ' per day'), row('Mortality rate', o.mortalityRate + ' per day'),
      row('Energy value', o.energyValue + '%'), row('Status', o.active ? 'Active' : 'Inactive'), row('Description', o.description || '—'), row('Hint', o.hint || '—')])]),
      buttons: [{ label: 'Close', value: true, kind: 'primary' }] });
  }

  function editOrganism(id) {
    var o = id ? DB.get('organisms', id) : { id: DB.nextId('organisms'), name: '', scientificName: '', emoji: '', image: '', description: '', hint: '', trophicLevel: 'producer', category: '', diet: '', preyIds: [], population: 100, reproductionRate: 0.05, mortalityRate: 0.03, energyValue: 0, ecosystemId: (DB.data.ecosystems.filter(function (e) { return e.id === simEco; })[0] || DB.data.ecosystems[0]).id, active: true };
    var f = {};
    f.name = text(o.name, { required: 'required', maxlength: 60 }); f.sci = text(o.scientificName); f.emoji = text(o.emoji, { maxlength: 4, placeholder: 'optional, used when there is no image' });
    var pick = imagePicker(o.image, 256, false);
    f.category = text(o.category, { list: 'cats' }); var dl = el('datalist', { id: 'cats' }, ['Plant', 'Insect', 'Mollusc', 'Amphibian', 'Reptile', 'Bird', 'Mammal', 'Fish', 'Crustacean', 'Decomposer'].map(function (c) { return el('option', { value: c }); }));
    f.level = select(C.ORG_LEVELS.map(function (l) { return [l, levelName(l)]; }), o.trophicLevel);
    f.eco = select(DB.data.ecosystems.map(function (e) { return [e.id, e.name]; }), o.ecosystemId);
    f.diet = text(o.diet); f.desc = area(o.description, 3); f.hint = text(o.hint, { placeholder: 'Shown to students when they ask for a hint' });
    f.pop = num(o.population, 0, 100000, 1); f.rep = num(o.reproductionRate, 0, 1, 0.005); f.mor = num(o.mortalityRate, 0, 1, 0.005); f.en = num(o.energyValue, 0, 100);
    var act = check('Active (appears in lessons and simulations)', o.active);
    var preyBox = el('div', { class: 'prey-box' }), preySel = {}; (o.preyIds || []).forEach(function (p) { preySel[p] = true; });
    var predBox = el('p', { class: 'muted' });
    function drawPrey() {
      UI.clear(preyBox); var lvl = f.level.value, eco = f.eco.value;
      if (lvl === 'producer' || lvl === 'decomposer') { preyBox.appendChild(el('small', { class: 'muted', text: lvl === 'producer' ? 'Producers make their own food, so they have no prey.' : 'Decomposers are not part of the prey network.' })); return; }
      var cands = DB.data.organisms.filter(function (x) { return x.ecosystemId === eco && x.id !== o.id && x.trophicLevel !== 'decomposer'; });
      if (!cands.length) preyBox.appendChild(el('small', { class: 'muted', text: 'No other organisms in this ecosystem yet.' }));
      cands.forEach(function (x) {
        var c = check(x.name + ' (' + levelName(x.trophicLevel) + ')', !!preySel[x.id]);
        c.input.addEventListener('change', function () { if (c.input.checked) preySel[x.id] = true; else delete preySel[x.id]; });
        preyBox.appendChild(c.node);
      });
    }
    function drawPred() { var by = id ? VE.Org.predatorsOf(o.id) : []; predBox.textContent = by.length ? 'Eaten by: ' + VE.Org.names(by).join(', ') + ' (set on the predator’s own record).' : 'No predators listed yet (set prey on the predator’s record).'; }
    f.level.addEventListener('change', drawPrey); f.eco.addEventListener('change', function () { preySel = {}; drawPrey(); });
    drawPrey(); drawPred();
    var errs = el('div', { class: 'form-errs' });
    var form = el('div', { class: 'form' }, [dl,
      el('div', { class: 'grid2' }, [field('Common name *', f.name), field('Scientific name', f.sci), field('Trophic level *', f.level), field('Ecosystem *', f.eco), field('Category', f.category), field('Diet', f.diet)]),
      field('Description', f.desc), field('Hint for students', f.hint),
      el('div', { class: 'grid2' }, [field('Image (upload or path)', pick.node), field('Emoji fallback', f.emoji)]),
      el('fieldset', {}, [el('legend', { text: 'Ecological relationships' }), el('p', { class: 'muted', text: 'Tick the organisms this one eats.' }), preyBox, predBox]),
      el('fieldset', {}, [el('legend', { text: 'Simulation values' }), el('div', { class: 'grid4' }, [field('Initial population', f.pop, '0–100000'), field('Reproduction rate / day', f.rep, '0–1'), field('Mortality rate / day', f.mor, '0–1'), field('Energy value %', f.en, 'contribution/requirement')])]),
      act.node, el('small', { class: 'muted', text: 'ID: ' + o.id }), errs]);
    UI.dialog({ title: id ? 'Edit organism' : 'Add organism', wide: true, body: form, buttons: [{ label: 'Cancel', value: false }, { label: id ? 'Update' : 'Add organism', value: true, kind: 'primary', action: function () {
      var rec = { id: o.id, name: f.name.value.trim(), scientificName: f.sci.value.trim(), emoji: f.emoji.value.trim(), image: pick.get(), description: f.desc.value.trim(), hint: f.hint.value.trim(), trophicLevel: f.level.value, category: f.category.value.trim(), diet: f.diet.value.trim(),
        preyIds: (f.level.value === 'producer' || f.level.value === 'decomposer') ? [] : Object.keys(preySel), population: num2(f.pop.value), reproductionRate: num2(f.rep.value), mortalityRate: num2(f.mor.value), energyValue: isNaN(num2(f.en.value)) ? 0 : num2(f.en.value), ecosystemId: f.eco.value, active: act.input.checked };
      try { if (id) DB.update('organisms', id, rec); else DB.add('organisms', rec); } catch (e) { UI.clear(errs); errs.appendChild(errBox((e.validation && e.validation.errors) || [e.message])); return false; }
      UI.toast((id ? 'Updated ' : 'Added ') + rec.name + '. Remember to Save Changes.', 'success'); rerender();
    } }] });
  }

  function deleteRecord(coll, id, name) {
    var refs = DB.references(coll, id);
    var body = el('div', {}, [el('p', { text: 'Delete "' + name + '"? This cannot be undone after you save (a backup is made first).' }), refs.length ? el('div', { class: 'warn-box' }, [el('b', { text: 'This record is referenced:' }), el('ul', {}, refs.map(function (r) { return el('li', { text: r }); }))]) : el('p', { class: 'muted', text: 'Nothing else refers to it.' })]);
    UI.confirm('Delete ' + (coll === 'organisms' ? 'organism' : coll === 'ecosystems' ? 'ecosystem' : 'lesson'), body, 'Delete', true).then(function (ok) {
      if (!ok) return;
      try {
        if (coll === 'ecosystems' && DB.data.ecosystems.length <= 1) throw new Error('At least one ecosystem must remain.');
        DB.remove(coll, id); UI.toast('Deleted "' + name + '". Remember to Save Changes.', 'success'); rerender();
      } catch (e) { showErrors('Cannot delete', e); }
    });
  }

  // ------------------------------------------------------------------ ecosystems
  function pEcosystems() {
    content.appendChild(el('div', { class: 'toolbar' }, [el('span', { class: 'grow' }), el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editEcosystem(null); } }, '+ Add ecosystem')]));
    var grid = el('div', { class: 'cards' });
    DB.data.ecosystems.forEach(function (e) {
      var n = DB.data.organisms.filter(function (o) { return o.ecosystemId === e.id; }).length, isDef = DB.data.appSettings.defaultEcosystemId === e.id;
      grid.appendChild(el('article', { class: 'eco-card' }, [
        el('div', { class: 'eco-bg', style: { backgroundImage: e.backgroundImage ? 'url("' + e.backgroundImage + '")' : '' } }),
        el('div', { class: 'eco-body' }, [el('h3', {}, [e.name, ' ', isDef ? badge('Default', 'ok') : null, e.active === false ? badge('Inactive', 'warn') : null]), el('p', { class: 'muted', text: e.location || '' }), el('p', { text: e.description }), el('p', { class: 'muted', text: n + ' organisms · sunlight ' + e.environment.sunlight + '% · rain ' + e.environment.rainfall + '% · ' + e.environment.temperature + ' °C' }),
          el('div', { class: 'acts' }, [el('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: function () { editEcosystem(e.id); } }, 'Edit'), isDef ? null : el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function () { DB.setAppSettings({ defaultEcosystemId: e.id }); rerender(); } }, 'Make default'), el('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: function () { deleteRecord('ecosystems', e.id, e.name); } }, 'Delete')])])]));
    });
    content.appendChild(grid);
  }
  function defaultPyramid() { return DB.clone(DB.data.ecosystems[0] ? DB.data.ecosystems[0].pyramid : []); }

  function editEcosystem(id) {
    var e = id ? DB.clone(DB.get('ecosystems', id)) : { id: DB.nextId('ecosystems'), name: '', shortName: '', location: '', description: '', backgroundImage: '', simBackground: '', environment: { sunlight: 80, rainfall: 70, temperature: 25 }, pyramid: defaultPyramid(), active: true };
    var f = { name: text(e.name, { required: 'required' }), short: text(e.shortName, { placeholder: 'Shown in the header, e.g. Mt. Agad-Agad' }), loc: text(e.location), desc: area(e.description, 3), sun: num(e.environment.sunlight, 0, 100, 1), rain: num(e.environment.rainfall, 0, 100, 1), temp: num(e.environment.temperature, -10, 50, 0.5) };
    var bg = imagePicker(e.backgroundImage, 1600, true), sbg = imagePicker(e.simBackground, 1200, true);
    var act = check('Active (selectable by students)', e.active !== false);
    var prows = el('div', { class: 'pyr-edit' });
    var pf = {};
    C.LEVELS.slice().reverse().forEach(function (lid) {
      var l = e.pyramid.filter(function (x) { return x.id === lid; })[0] || { id: lid, label: levelName(lid), shortLabel: '', color: VE.Org.PALETTE[lid], simGroup: 'producer', description: '', energyDescription: '', energyLabel: '', role: '' };
      var p = pf[lid] = { label: text(l.label), sub: text(l.shortLabel), color: el('input', { type: 'color', value: l.color || '#888888' }), group: select(C.GROUPS.map(function (g) { return [g, g]; }), l.simGroup), desc: text(l.description), edesc: text(l.energyDescription), elab: text(l.energyLabel), role: text(l.role), base: l };
      prows.appendChild(el('fieldset', {}, [el('legend', { text: levelName(lid) }), el('div', { class: 'grid4' }, [field('Label', p.label), field('Short label', p.sub), field('Colour', p.color), field('Simulation group', p.group)]), el('div', { class: 'grid2' }, [field('Description (trophic lesson)', p.desc), field('Description (energy lesson)', p.edesc), field('Energy label (Most/More/…)', p.elab), field('Ecological role', p.role)])]));
    });
    var errs = el('div', { class: 'form-errs' });
    var form = el('div', { class: 'form' }, [el('div', { class: 'grid2' }, [field('Name *', f.name), field('Short name', f.short), field('Location', f.loc)]), field('Description', f.desc),
      el('div', { class: 'grid2' }, [field('Home background image', bg.node), field('Simulation landscape image (optional)', sbg.node)]),
      el('fieldset', {}, [el('legend', { text: 'Environmental conditions' }), el('div', { class: 'grid4' }, [field('Sunlight %', f.sun), field('Rainfall %', f.rain), field('Temperature °C', f.temp)])]),
      el('details', {}, [el('summary', { text: 'Food pyramid configuration (labels, colours, texts)' }), prows]), act.node, errs]);
    UI.dialog({ title: id ? 'Edit ecosystem' : 'Add ecosystem', wide: true, body: form, buttons: [{ label: 'Cancel', value: false }, { label: id ? 'Update' : 'Add ecosystem', value: true, kind: 'primary', action: function () {
      var rec = { id: e.id, name: f.name.value.trim(), shortName: f.short.value.trim(), location: f.loc.value.trim(), description: f.desc.value.trim(), backgroundImage: bg.get(), simBackground: sbg.get(), active: act.input.checked,
        environment: { sunlight: num2(f.sun.value), rainfall: num2(f.rain.value), temperature: num2(f.temp.value) },
        pyramid: C.LEVELS.map(function (lid) { var p = pf[lid]; return Object.assign({}, p.base, { id: lid, label: p.label.value.trim(), shortLabel: p.sub.value.trim(), color: p.color.value, simGroup: p.group.value, description: p.desc.value.trim(), energyDescription: p.edesc.value.trim(), energyLabel: p.elab.value.trim(), role: p.role.value.trim() }); }) };
      try {
        if (id) DB.update('ecosystems', id, rec);
        else { DB.add('ecosystems', rec); var base = DB.data.simulationSettings[0]; DB.add('simulationSettings', Object.assign({}, VE.Sim.DEFAULT_SETTINGS, base ? DB.clone(base) : {}, { id: DB.nextId('simulationSettings'), ecosystemId: rec.id })); }
      } catch (er) { UI.clear(errs); errs.appendChild(errBox((er.validation && er.validation.errors) || [er.message])); return false; }
      UI.toast((id ? 'Updated ' : 'Added ') + rec.name + '. Remember to Save Changes.', 'success'); rerender();
    } }] });
  }

  // ------------------------------------------------------------------ lessons
  function pLessons() {
    content.appendChild(el('div', { class: 'toolbar' }, [el('span', { class: 'grow' }), el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editLesson(null); } }, '+ Add lesson')]));
    var list = DB.data.lessons.slice().sort(function (a, b) { return a.order - b.order; });
    list.forEach(function (l, i) {
      function move(d) { var j = i + d; if (j < 0 || j >= list.length) return; var o2 = list[j]; var a = l.order, b = o2.order; if (a === b) b = a + d; DB.update('lessons', l.id, { order: b }); DB.update('lessons', o2.id, { order: a }); rerender(); }
      var tog = el('input', { type: 'checkbox', 'aria-label': 'Enabled: ' + l.title, onchange: function () { DB.update('lessons', l.id, { enabled: tog.checked }); afterChange(); } }); tog.checked = l.enabled;
      content.appendChild(el('section', { class: 'panel lesson-row' }, [el('div', { class: 'lr-main' }, [el('h3', {}, [(i + 1) + '. ' + l.title, ' ', l.enabled ? badge('Enabled', 'ok') : badge('Disabled', 'warn')]), el('p', { class: 'muted', text: l.description }),
        el('ol', { class: 'small-list' }, l.objectives.map(function (o) { return el('li', { text: o }); })),
        el('p', { class: 'muted', text: 'Activities: ' + l.activities.map(function (a) { return (a.enabled ? '' : '(off) ') + a.title; }).join(' → ') })]),
        el('div', { class: 'acts col' }, [el('label', { class: 'chk' }, [tog, ' Enabled']), el('div', {}, [el('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: i === 0, 'aria-label': 'Move up', onclick: function () { move(-1); } }, '↑'), el('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: i === list.length - 1, 'aria-label': 'Move down', onclick: function () { move(1); } }, '↓')]),
          el('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: function () { editLesson(l.id); } }, 'Edit'), el('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: function () { deleteRecord('lessons', l.id, l.title); } }, 'Delete')])]));
    });
  }

  function editLesson(id) {
    var l = id ? DB.clone(DB.get('lessons', id)) : { id: DB.nextId('lessons'), title: '', subtitle: '', description: '', order: DB.data.lessons.length + 1, enabled: true, objectives: [''], activities: [] };
    var f = { title: text(l.title, { required: 'required' }), sub: text(l.subtitle, { placeholder: 'Pill shown on the title screen' }), desc: area(l.description, 2), obj: area(l.objectives.join('\n'), 4) };
    var en = check('Enabled', l.enabled);
    var acts = l.activities, actBox = el('div', { class: 'acts-edit' }), nextAct = DB.nextId('activities');
    var actCounter = parseInt(nextAct.split('_')[1], 10);
    function drawActs() {
      UI.clear(actBox);
      acts.forEach(function (a, i) {
        var t = text(a.title), g = text(a.group, { placeholder: 'Stepper label' }), ins = text(a.instructions), hint = text(a.hint), e = check('Enabled', a.enabled);
        t.addEventListener('input', function () { a.title = t.value; }); g.addEventListener('input', function () { a.group = g.value; }); ins.addEventListener('input', function () { a.instructions = ins.value; }); hint.addEventListener('input', function () { a.hint = hint.value; }); e.input.addEventListener('change', function () { a.enabled = e.input.checked; });
        var extra = [];
        if (a.type === 'explore') { var m = select([['qualitative', 'Qualitative (Most / More / Some…)'], ['percent', 'Percent (100%, 10%, 1%…)']], a.mode || 'qualitative'); m.addEventListener('change', function () { a.mode = m.value; }); extra.push(field('Energy display', m)); }
        if (a.type === 'arrangeEnergy') { var dc = text((a.decoys || []).join(', '), { placeholder: '50%, 5%, 0.5%' }); dc.addEventListener('input', function () { a.decoys = dc.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); }); extra.push(field('Wrong-answer chips (comma separated)', dc)); }
        if (a.type === 'arrange' || a.type === 'arrangeEnergy' || a.type === 'energyAnimation') {
          var ex = a.excludeOrganismIds || (a.excludeOrganismIds = []), box = el('div', { class: 'prey-box' });
          DB.data.organisms.filter(function (o) { return o.trophicLevel !== 'decomposer'; }).forEach(function (o) {
            var c = check(o.name + ' · ' + ecoName(o.ecosystemId), ex.indexOf(o.id) < 0);
            c.input.addEventListener('change', function () { var k = ex.indexOf(o.id); if (c.input.checked && k >= 0) ex.splice(k, 1); if (!c.input.checked && k < 0) ex.push(o.id); });
            box.appendChild(c.node);
          });
          extra.push(el('details', {}, [el('summary', { text: 'Organisms used by this activity (untick to leave one out; new organisms are included automatically)' }), box]));
        }
        actBox.appendChild(el('fieldset', { class: 'act-fs' }, [el('legend', {}, [(i + 1) + '. ' + (C.ACTIVITY_LABELS[a.type] || a.type)]), el('div', { class: 'grid2' }, [field('Title', t), field('Step group', g)]), field('Instructions', ins), field('Hint', hint)].concat(extra, [el('div', { class: 'acts' }, [e.node,
          el('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: i === 0, onclick: function () { acts.splice(i - 1, 0, acts.splice(i, 1)[0]); drawActs(); } }, '↑'), el('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: i === acts.length - 1, onclick: function () { acts.splice(i + 1, 0, acts.splice(i, 1)[0]); drawActs(); } }, '↓'),
          el('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: function () { acts.splice(i, 1); drawActs(); } }, 'Remove')])])));
      });
      var ts = select(C.ACTIVITY_TYPES.map(function (t) { return [t, C.ACTIVITY_LABELS[t]]; }), 'explore');
      actBox.appendChild(el('div', { class: 'add-act' }, [ts, el('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: function () {
        var t = ts.value, a = { id: 'act_' + String(actCounter++).padStart(3, '0'), type: t, group: C.ACTIVITY_LABELS[t].split(' ')[0], title: C.ACTIVITY_LABELS[t].split(' (')[0], enabled: true, instructions: '', hint: '' };
        if (t === 'explore') a.mode = 'qualitative'; if (t === 'arrange' || t === 'arrangeEnergy' || t === 'energyAnimation') a.excludeOrganismIds = []; if (t === 'arrangeEnergy') a.decoys = ['50%', '5%', '0.5%'];
        acts.push(a); drawActs();
      } }, '+ Add activity')]));
    }
    drawActs();
    var errs = el('div', { class: 'form-errs' });
    var form = el('div', { class: 'form' }, [el('div', { class: 'grid2' }, [field('Title *', f.title), field('Subtitle (pill)', f.sub)]), field('Description', f.desc), field('Learning objectives (one per line)', f.obj), en.node, el('h3', { text: 'Activities' }), actBox, errs]);
    UI.dialog({ title: id ? 'Edit lesson' : 'Add lesson', wide: true, body: form, buttons: [{ label: 'Cancel', value: false }, { label: id ? 'Update' : 'Add lesson', value: true, kind: 'primary', action: function () {
      var rec = { id: l.id, title: f.title.value.trim(), subtitle: f.sub.value.trim(), description: f.desc.value.trim(), order: l.order, enabled: en.input.checked, objectives: f.obj.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean), activities: acts };
      try { if (id) DB.update('lessons', id, rec); else DB.add('lessons', rec); } catch (er) { UI.clear(errs); errs.appendChild(errBox((er.validation && er.validation.errors) || [er.message])); return false; }
      UI.toast('Lesson saved. Remember to Save Changes.', 'success'); rerender();
    } }] });
  }

  // ------------------------------------------------------------------ simulation settings
  var SIMF = [['durationDays', 'Simulation duration (days)', 'Length of one run.'], ['daysPerSecond', 'Simulation speed (days per second)', 'At speed x1.'], ['seed', 'Random seed', 'Same seed + settings = same graph.'], ['noise', 'Daily variation (0–0.3)', 'Small seeded randomness in births.'],
    ['substeps', 'Calculation steps per day', 'Higher = smoother, slower.'], ['carryingCapacityMultiplier', 'Producer capacity × starting population', 'Population growth limit.'], ['transferPercent', 'Energy-transfer % between levels', 'Default 10. Also drives lesson percentages.'], ['predationPressure', 'Predation pressure (0.01–1)', 'How strongly predators reduce prey.'],
    ['starvationFactor', 'Extra mortality when hungry', 'Mortality multiplier at zero food.'], ['halfSaturationRatio', 'Prey per predator for 50% feeding', 'Lower = predators feed easily.']];
  function pSimulation() {
    var d = DB.data; simEco = simEco && DB.get('ecosystems', simEco) ? simEco : d.ecosystems[0].id;
    var es = select(d.ecosystems.map(function (e) { return [e.id, e.name]; }), simEco); es.addEventListener('change', function () { simEco = es.value; rerender(); });
    content.appendChild(el('div', { class: 'toolbar' }, [el('label', {}, 'Ecosystem: '), es]));
    var eco = DB.get('ecosystems', simEco), rec = d.simulationSettings.filter(function (s) { return s.ecosystemId === simEco; })[0];
    if (!rec) { content.appendChild(el('div', { class: 'panel' }, [el('p', { text: 'This ecosystem has no simulation settings record (defaults are used).' }), el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { DB.add('simulationSettings', Object.assign({}, VE.Sim.DEFAULT_SETTINGS, { id: DB.nextId('simulationSettings'), ecosystemId: simEco })); rerender(); } }, 'Create settings')])); return; }
    var inputs = {}, grid = el('div', { class: 'grid2' });
    SIMF.forEach(function (s) { inputs[s[0]] = num(rec[s[0]]); grid.appendChild(field(s[1], inputs[s[0]], s[2])); });
    var env = { sunlight: num(eco.environment.sunlight, 0, 100, 1), rainfall: num(eco.environment.rainfall, 0, 100, 1), temperature: num(eco.environment.temperature, -10, 50, 0.5) };
    var errs = el('div', { class: 'form-errs' });
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Parameters' }), grid, el('h3', { text: 'Environmental conditions' }), el('div', { class: 'grid4' }, [field('Sunlight %', env.sunlight), field('Rainfall %', env.rainfall), field('Temperature °C', env.temperature, 'Comfort range 18–32')]), errs,
      el('button', { type: 'button', class: 'btn btn-primary', onclick: function () {
        var patch = {}; SIMF.forEach(function (s) { patch[s[0]] = num2(inputs[s[0]].value); });
        try { DB.update('simulationSettings', rec.id, patch); DB.update('ecosystems', eco.id, { environment: { sunlight: num2(env.sunlight.value), rainfall: num2(env.rainfall.value), temperature: num2(env.temperature.value) } }); UI.clear(errs); UI.toast('Settings applied. Remember to Save Changes.', 'success'); afterChange(); rerender(); }
        catch (e) { UI.clear(errs); errs.appendChild(errBox((e.validation && e.validation.errors) || [e.message])); }
      } }, 'Apply settings')]));
    var orgs = d.organisms.filter(function (o) { return o.ecosystemId === simEco && o.trophicLevel !== 'decomposer'; });
    var tb = el('tbody');
    orgs.forEach(function (o) {
      var p = num(o.population, 0, 100000, 1), r = num(o.reproductionRate, 0, 1, 0.005), m = num(o.mortalityRate, 0, 1, 0.005);
      function commit() { try { DB.update('organisms', o.id, { population: num2(p.value), reproductionRate: num2(r.value), mortalityRate: num2(m.value) }); [p, r, m].forEach(function (x) { x.classList.remove('bad-in'); }); afterChange(); } catch (e) { [p, r, m].forEach(function (x) { x.classList.add('bad-in'); }); UI.toast((e.validation && e.validation.errors[0]) || e.message, 'error'); } }
      [p, r, m].forEach(function (x) { x.addEventListener('change', commit); });
      tb.appendChild(el('tr', { class: o.active ? '' : 'inactive' }, [el('td', {}, thumb(o)), el('td', { text: o.name }), el('td', {}, badge(levelName(o.trophicLevel), 'lv-' + o.trophicLevel)), el('td', { text: VE.Org.names(VE.Org.preyOf(o)).join(', ') || '—' }), el('td', {}, p), el('td', {}, r), el('td', {}, m), el('td', {}, o.active ? 'Active' : 'Off')]));
    });
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Organism populations, growth, mortality and predator–prey links' }), el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' }, [el('thead', {}, el('tr', {}, ['', 'Organism', 'Level', 'Eats (prey)', 'Initial pop.', 'Growth/day', 'Mortality/day', 'Status'].map(function (h) { return el('th', { text: h }); }))), tb])), el('p', { class: 'muted', text: 'Edit an organism to change who eats whom. Changes here take effect after Save Changes.' })]));
    var out = el('div');
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Test run (preview with the current settings)' }), el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { preview(out); } }, 'Run preview'), out]));
  }
  function preview(out) {
    UI.clear(out);
    var eco = DB.get('ecosystems', simEco), orgs = VE.Org.inEcosystem(simEco), st = VE.Eco.simSettings(simEco);
    if (!orgs.length) { out.appendChild(el('p', { class: 'bad', text: 'No active organisms.' })); return; }
    var en = new VE.Sim.Engine({ organisms: orgs, ecosystem: eco, settings: st, groupCounts: { producer: 3, herbivore: 3, omnivore: 3, top: 3 } });
    var mins = {}; orgs.forEach(function (o) { mins[o.id] = en.N[o.id]; });
    while (!en.done()) { en.step(); orgs.forEach(function (o) { mins[o.id] = Math.min(mins[o.id], en.N[o.id]); }); }
    var warn = [];
    var rows = orgs.map(function (o) { var s = en.history[0].pops[o.id], e = en.N[o.id]; if (e < 0.5) warn.push(o.name + ' goes extinct.'); else if (e < s * 0.2) warn.push(o.name + ' falls below 20% of its start.'); else if (e > s * 4) warn.push(o.name + ' grows more than 4× its start.');
      return el('tr', {}, [el('td', { text: o.name }), el('td', { text: String(Math.round(s)) }), el('td', { text: String(Math.round(mins[o.id])) }), el('td', { text: String(Math.round(e)) })]); });
    out.appendChild(el('table', { class: 'tbl' }, [el('thead', {}, el('tr', {}, ['Organism', 'Start', 'Minimum', 'Day ' + st.durationDays].map(function (h) { return el('th', { text: h }); }))), el('tbody', {}, rows)]));
    out.appendChild(warn.length ? el('ul', { class: 'warn-list' }, warn.map(function (w) { return el('li', { text: w + ' Consider adjusting growth, mortality or predation pressure.' }); })) : el('p', { class: 'ok-line', text: '✓ Populations stay in a sensible range for the default setup.' }));
  }

  // ------------------------------------------------------------------ app settings
  function pSettings() {
    var a = DB.data.appSettings;
    var f = { title: text(a.appTitle), foot: text(a.footerText), eco: select(DB.data.ecosystems.map(function (e) { return [e.id, e.name]; }), a.defaultEcosystemId), lang: select(VE.I18n.langs.map(function (l) { return [l.id, l.label]; }), a.defaultLanguage), max: num(a.maxBackups, 1, 50, 1), pin: text(a.adminPin, { maxlength: 12 }) };
    var snd = check('Sound on by default', a.soundDefault !== false), lock = check('Students must finish a step before the next one unlocks', a.lockSteps !== false), pe = check('Require the admin PIN to open this dashboard', a.adminPinEnabled);
    var errs = el('div', { class: 'form-errs' });
    content.appendChild(el('section', { class: 'panel form' }, [el('div', { class: 'grid2' }, [field('Home title (use {ecosystem})', f.title), field('Footer text', f.foot), field('Default ecosystem', f.eco), field('Default language', f.lang), field('Restore points / backups to keep', f.max)]), snd.node, lock.node,
      el('fieldset', {}, [el('legend', { text: 'Admin PIN' }), pe.node, field('PIN', f.pin), el('p', { class: 'warn-box', text: 'Important: this PIN is stored in plain text in app-settings.json and checked in the browser. It only prevents accidental edits; it is NOT real security. Anyone with the files can read or bypass it.' })]), errs,
      el('button', { type: 'button', class: 'btn btn-primary', onclick: function () {
        if (pe.input.checked && !f.pin.value.trim()) { UI.clear(errs); errs.appendChild(errBox(['Enter a PIN or turn the PIN requirement off.'])); return; }
        var mb = num2(f.max.value); if (!(mb >= 1 && mb <= 50)) { UI.clear(errs); errs.appendChild(errBox(['Backups to keep must be 1–50.'])); return; }
        DB.setAppSettings({ appTitle: f.title.value, footerText: f.foot.value, defaultEcosystemId: f.eco.value, defaultLanguage: f.lang.value, maxBackups: Math.round(mb), soundDefault: snd.input.checked, lockSteps: lock.input.checked, adminPinEnabled: pe.input.checked, adminPin: f.pin.value.trim() });
        UI.clear(errs); UI.toast('Settings applied. Remember to Save Changes.', 'success'); afterChange();
      } }, 'Apply settings')]));
  }

  // ------------------------------------------------------------------ database manager
  var FILEMAP = [['organisms.json', 'organisms', 'organisms'], ['ecosystems.json', 'ecosystems', 'ecosystems'], ['lessons.json', 'lessons', 'lessons'], ['simulation-settings.json', 'simulationSettings', 'simulation settings'], ['app-settings.json', 'appSettings', 'setting keys'], ['database.json', null, 'manifest']];
  function pDatabase() {
    var c = DB.counts();
    var perm = DB.canWriteFolder() ? 'Connected (read/write)' : DB.needsReconnect ? 'Folder remembered — permission needed' : 'Not connected';
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Storage' }), el('table', { class: 'kv' }, [
      kv('Current source', DB.sourceLabel), kv('Folder access', DB.supportsFolder ? perm : 'Not supported by this browser (use Import / Export)'), kv('Revision', DB.meta.revision + (DB.meta.updatedAt ? ' · ' + DB.meta.updatedAt : '')), kv('Unsaved changes', DB.dirty ? 'Yes' : 'No'), kv('Opened from', location.protocol === 'file:' ? 'file:// (browser storage may be limited)' : location.origin)]),
      DB.storageWarning ? el('p', { class: 'warn-box', text: DB.storageWarning }) : null,
      el('p', { class: 'muted', text: 'Browsers cannot write to any file on their own. “Open Database Folder” asks you to pick the folder once and grant permission; after that Save Changes writes the JSON files directly. Without it, changes are kept in this browser and you export JSON files.' })]));
    var file = el('input', { type: 'file', multiple: 'multiple', accept: '.json,application/json', class: 'sr-only', tabindex: '-1', onchange: function () { importFiles(file.files); file.value = ''; } });
    var restoreFile = el('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', tabindex: '-1', onchange: function () { importFiles(restoreFile.files, true); restoreFile.value = ''; } });
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'Actions' }), el('div', { class: 'btn-grid' }, [
      el('button', { type: 'button', class: 'btn btn-primary', disabled: !DB.supportsFolder, title: DB.supportsFolder ? '' : 'Needs Chrome, Edge or another browser with the File System Access API', onclick: openFolder }, 'Open Database Folder'),
      DB.needsReconnect ? el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { DB.reconnect().then(function () { UI.toast('Folder connected.', 'success'); rerender(); }, function (e) { UI.toast(e.message, 'error'); }); } }, 'Reconnect folder') : null,
      DB.dirHandle ? el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { DB.disconnectFolder().then(rerender); } }, 'Disconnect folder') : null,
      el('button', { type: 'button', class: 'btn btn-primary', disabled: !DB.dirty, onclick: saveChanges }, 'Save Changes'),
      el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { file.click(); } }, 'Import JSON'),
      el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { DB.download('virtual-ecosystem-database.json', DB.bundle()); } }, 'Export JSON (single file)'),
      el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { var fs = DB.exportFiles(); Object.keys(fs).forEach(function (n, i) { setTimeout(function () { DB.download(n, fs[n]); }, i * 250); }); } }, 'Export separate files'),
      el('button', { type: 'button', class: 'btn btn-outline', onclick: backupNow }, 'Backup Database'),
      el('button', { type: 'button', class: 'btn btn-outline', onclick: function () { restoreDialog(restoreFile); } }, 'Restore Database'),
      el('button', { type: 'button', class: 'btn btn-danger', onclick: resetDefaults }, 'Reset Default Database')]), file, restoreFile]));
    var rows = FILEMAP.map(function (f) { var n = f[1] ? (f[1] === 'appSettings' ? c.appSettings : f[1] === 'organisms' ? c.organisms : c[f[1]]) : '—'; return el('tr', {}, [el('td', { class: 'mono', text: f[0] }), el('td', { text: String(n) + (f[1] ? ' ' + f[2] : ' (' + f[2] + ')') }), el('td', {}, el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function () { jsonFile = f[0]; drawJson(); } }, 'View JSON'))]); });
    content.appendChild(el('section', { class: 'panel' }, [el('h2', { text: 'JSON collections' }), el('table', { class: 'tbl' }, [el('thead', {}, el('tr', {}, ['File', 'Records', ''].map(function (h) { return el('th', { text: h }); }))), el('tbody', {}, rows)]), el('h3', { id: 'json-title' }), el('pre', { class: 'json-view', id: 'json-view', tabindex: '0' })]));
    drawJson();
  }
  function kv(k, v) { return el('tr', {}, [el('th', { text: k }), el('td', { text: String(v) })]); }
  function drawJson() {
    var files = DB.exportFiles(), t = document.getElementById('json-title'), v = document.getElementById('json-view'); if (!v) return;
    t.textContent = jsonFile + ' (current in-memory content' + (DB.dirty ? ', includes unsaved changes' : '') + ')';
    var s = JSON.stringify(files[jsonFile], null, 2); v.textContent = s.length > 200000 ? s.slice(0, 200000) + '\n… (truncated, ' + s.length + ' characters)' : s;
  }
  function openFolder() {
    DB.openFolder().then(function (res) {
      if (res.empty) return UI.confirm('Initialise this folder?', 'No database was found in "' + res.handle.name + '". Write the current data (' + DB.counts().organisms + ' organisms, ' + DB.counts().ecosystems + ' ecosystems…) into it as JSON files?', 'Write JSON files').then(function (ok) { if (ok) return DB.adoptFolder(res, true).then(function () { UI.toast('Database written to "' + res.handle.name + '".', 'success'); rerender(); }); });
      return UI.confirm('Use this folder as the database?', 'Found a database in "' + res.handle.name + '". Loading it replaces what is currently open' + (DB.dirty ? ' (you have unsaved changes that will be lost)' : '') + '. Unsaved work is not lost if you first Cancel and save.', 'Load folder').then(function (ok) { if (ok) return DB.adoptFolder(res, false).then(function () { UI.toast('Loaded from folder "' + res.handle.name + '".', 'success'); rerender(); }); });
    }).catch(function (e) { if (e && e.name === 'AbortError') return; showErrors('Could not open folder', e); });
  }
  function importFiles(fl, isRestore) {
    if (!fl.length) return;
    DB.readImport(fl).then(function (files) {
      var tmp; try { var C2 = JSON.parse(JSON.stringify(files)); tmp = C2; } catch (e) { throw e; }
      var o = files['organisms.json'] || {}, n = (o.organisms || []).length;
      return UI.confirm(isRestore ? 'Restore from file' : 'Import JSON', 'Replace the open database with this file (' + n + ' organisms)? Your current data is backed up as a restore point first. You still need to press Save Changes to write it to the folder.', isRestore ? 'Restore' : 'Import', true).then(function (ok) { if (ok) return DB.applyImport(files, false).then(function () { UI.toast('Imported. Review it, then Save Changes.', 'success'); rerender(); }); });
    }).catch(function (e) { showErrors('Import failed — nothing was changed', e); });
  }
  function backupNow() { DB.snapshot('manual backup').then(function () { DB.download('virtual-ecosystem-backup-' + DB.stamp().slice(0, 19) + '.json', DB.bundle()); UI.toast('Backup downloaded and a restore point was stored in this browser.', 'success'); }); }
  function restoreDialog(fileInput) {
    DB.listSnapshots().then(function (list) {
      var body = el('div', {}, [el('p', { text: 'Restore points are stored in this browser (the 10 most recent). You can also restore from a backup file.' })]);
      if (!list.length) body.appendChild(el('p', { class: 'muted', text: 'No restore points yet. One is created automatically before every save, import, restore and reset.' }));
      list.forEach(function (s) { body.appendChild(el('div', { class: 'snap' }, [el('span', {}, [el('b', { text: new Date(s.at).toLocaleString() }), ' · ' + s.label + ' · ' + s.counts.organisms + ' organisms, ' + s.counts.ecosystems + ' ecosystems']), el('span', {}, [el('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: function () { UI.confirm('Restore this point?', 'The open database will be replaced (current state is stored as a new restore point). Press Save Changes afterwards to keep it.', 'Restore', true).then(function (ok) { if (ok) DB.restoreSnapshot(s.id).then(function () { document.querySelector('.modal-back') && document.querySelector('.modal-back').remove(); UI.toast('Restored. Review it, then Save Changes.', 'success'); rerender(); }, function (e) { showErrors('Restore failed', e); }); }); } }, 'Restore'), el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function (ev) { DB.deleteSnapshot(s.id).then(function () { ev.target.closest('.snap').remove(); }); } }, 'Delete')])])); });
      UI.dialog({ title: 'Restore Database', wide: true, body: body, buttons: [{ label: 'Restore from file…', value: 'file', kind: 'outline' }, { label: 'Close', value: true, kind: 'primary' }] }).then(function (v) { if (v === 'file') fileInput.click(); });
    });
  }
  function resetDefaults() {
    UI.confirm('Reset to the default database?', 'All your organisms, ecosystems, lessons and settings in the open database will be replaced by the bundled defaults. A restore point is kept first, and nothing is written to the folder until you press Save Changes.', 'Reset to defaults', true).then(function (ok) {
      if (ok) DB.resetDefaults().then(function () { UI.toast('Defaults loaded. Press Save Changes to keep them.', 'success'); rerender(); }, function (e) { showErrors('Reset failed', e); });
    });
  }

  // ------------------------------------------------------------------ PIN gate + boot
  function gate() {
    var a = DB.data.appSettings, ok = false;
    try { ok = sessionStorage.getItem('ve_admin') === '1'; } catch (e) { /* ignore */ }
    if (!a.adminPinEnabled || !a.adminPin || ok) return Promise.resolve();
    return new Promise(function (resolve) {
      var root = document.getElementById('admin-app');
      var pin = el('input', { type: 'password', placeholder: 'PIN', autocomplete: 'off', 'aria-label': 'Admin PIN' }), msg = el('p', { class: 'bad', role: 'alert' });
      function go() { if (pin.value === a.adminPin) { try { sessionStorage.setItem('ve_admin', '1'); } catch (e) { /* ignore */ } resolve(); } else { msg.textContent = 'Wrong PIN.'; pin.select(); } }
      pin.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      root.appendChild(el('div', { class: 'lock' }, [el('h1', { text: 'Admin Dashboard' }), el('p', { class: 'muted', text: 'Enter the PIN to avoid accidental edits. (This is a convenience lock only, not real security.)' }), pin, msg, el('div', {}, [el('button', { type: 'button', class: 'btn btn-primary', onclick: go }, 'Unlock'), ' ', el('a', { class: 'btn btn-ghost', href: 'index.html' }, 'Back to students')])]));
      pin.focus();
    });
  }

  function boot() {
    DB = VE.DB; C = VE.Const;
    DB.init().then(function () {
      if (!DB.data) { document.getElementById('admin-app').appendChild(el('p', { class: 'err-pre', text: 'The database could not be loaded (data/default-data.js missing?).' })); return; }
      return gate().then(function () {
        build();
        DB.on(function (type) { if (type === 'changed' || type === 'saved') updateStatus(); });
        window.addEventListener('beforeunload', function (e) { if (DB.dirty) { e.preventDefault(); e.returnValue = ''; } });
        if (DB.needsReconnect) UI.toast('A database folder is remembered. Open Database Manager → Reconnect folder to edit it directly.', 'info', 6000);
      });
    });
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window.VE = window.VE || {});
