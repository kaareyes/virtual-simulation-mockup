/*
 * JSON database layer — the single source of truth for every page.
 *
 * Files (data/): database.json (manifest), organisms.json, ecosystems.json, lessons.json,
 *                simulation-settings.json, app-settings.json
 *
 * Reading / writing (no fetch(), so it also works from file://):
 *   1. Folder mode  : File System Access API (Chromium browsers). The admin picks the data folder once and
 *                     grants permission; the handle is remembered in IndexedDB. Save writes the JSON files directly.
 *   2. Browser copy : the last saved/imported database is mirrored in IndexedDB so other pages in the same
 *                     browser profile see it (this is a cache of the JSON, not a second database).
 *   3. Bundled      : data/default-data.js (window.VE_DEFAULT_DB), loaded with a <script> tag.
 *   Browsers without the File System Access API use Import / Export of JSON files instead.
 */
(function (VE) {
  'use strict';

  var C = VE.Const = {
    LEVELS: ['producer', 'primary_consumer', 'secondary_consumer', 'tertiary_consumer', 'top_predator'],
    ORG_LEVELS: ['producer', 'primary_consumer', 'secondary_consumer', 'tertiary_consumer', 'top_predator', 'decomposer'],
    GROUPS: ['producer', 'herbivore', 'omnivore', 'top'],
    ACTIVITY_TYPES: ['explore', 'arrange', 'arrangeEnergy', 'simulation', 'energyAnimation'],
    ACTIVITY_LABELS: { explore: 'Explore pyramid', arrange: 'Arrange organisms (drag & drop)', arrangeEnergy: 'Arrange energy values (drag & drop)', simulation: 'Ecosystem simulation', energyAnimation: 'Energy transfer animation' },
    LEVEL_LABELS: { producer: 'Producer', primary_consumer: 'Primary Consumer', secondary_consumer: 'Secondary Consumer', tertiary_consumer: 'Tertiary Consumer', top_predator: 'Top Predator', decomposer: 'Decomposer' },
    FILES: { organisms: 'organisms.json', ecosystems: 'ecosystems.json', lessons: 'lessons.json', simulationSettings: 'simulation-settings.json', appSettings: 'app-settings.json' },
    META_FILE: 'database.json',
    SCHEMA_VERSION: 1,
    PREFIX: { organisms: 'org', ecosystems: 'eco', lessons: 'les', simulationSettings: 'sim', activities: 'act' }
  };

  // ---------------------------------------------------------------- small utilities
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function nowIso() { return new Date().toISOString(); }
  function stamp() { return nowIso().replace(/[:.]/g, '-'); }

  /** localStorage with an in-memory fallback (storage can be blocked on file:// in some browsers). */
  var memStore = {};
  var Store = VE.Store = {
    available: (function () { try { localStorage.setItem('ve_t', '1'); localStorage.removeItem('ve_t'); return true; } catch (e) { return false; } })(),
    get: function (k, d) { try { var v = Store.available ? localStorage.getItem('ve_' + k) : memStore[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { if (Store.available) localStorage.setItem('ve_' + k, JSON.stringify(v)); else memStore[k] = JSON.stringify(v); } catch (e) { memStore[k] = JSON.stringify(v); } }
  };

  // ---------------------------------------------------------------- IndexedDB key/value (handles, cache, snapshots)
  var idbPromise = null;
  function idb() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
      var req;
      try { req = indexedDB.open('virtual-ecosystem', 1); } catch (e) { return reject(e); }
      req.onupgradeneeded = function () { req.result.createObjectStore('kv'); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return idbPromise;
  }
  function kv(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('kv', mode), st = tx.objectStore('kv'), r = fn(st);
        tx.oncomplete = function () { resolve(r && r.result); };
        tx.onerror = tx.onabort = function () { reject(tx.error); };
      });
    });
  }
  var KV = {
    get: function (k) { return kv('readonly', function (s) { return s.get(k); }).catch(function () { return undefined; }); },
    set: function (k, v) { return kv('readwrite', function (s) { return s.put(v, k); }); },
    del: function (k) { return kv('readwrite', function (s) { return s.delete(k); }); }
  };

  // ---------------------------------------------------------------- validation
  var SCHEMAS = {
    organisms: [
      { k: 'id', t: 'string', req: true }, { k: 'name', t: 'string', req: true, max: 60 },
      { k: 'scientificName', t: 'string' }, { k: 'image', t: 'string' }, { k: 'description', t: 'string', max: 500 },
      { k: 'trophicLevel', t: 'string', req: true, en: C.ORG_LEVELS }, { k: 'category', t: 'string' }, { k: 'diet', t: 'string' },
      { k: 'preyIds', t: 'array' }, { k: 'population', t: 'number', req: true, min: 0, max: 100000 },
      { k: 'reproductionRate', t: 'number', req: true, min: 0, max: 1 }, { k: 'mortalityRate', t: 'number', req: true, min: 0, max: 1 },
      { k: 'energyValue', t: 'number', min: 0, max: 100 }, { k: 'ecosystemId', t: 'string', req: true }, { k: 'active', t: 'boolean', req: true }
    ],
    ecosystems: [
      { k: 'id', t: 'string', req: true }, { k: 'name', t: 'string', req: true, max: 80 }, { k: 'description', t: 'string' },
      { k: 'location', t: 'string' }, { k: 'backgroundImage', t: 'string' }, { k: 'pyramid', t: 'array', req: true }, { k: 'environment', t: 'object', req: true }
    ],
    lessons: [
      { k: 'id', t: 'string', req: true }, { k: 'title', t: 'string', req: true, max: 80 }, { k: 'description', t: 'string' },
      { k: 'order', t: 'number', req: true }, { k: 'enabled', t: 'boolean', req: true }, { k: 'objectives', t: 'array', req: true }, { k: 'activities', t: 'array', req: true }
    ],
    simulationSettings: [
      { k: 'id', t: 'string', req: true }, { k: 'ecosystemId', t: 'string', req: true },
      { k: 'durationDays', t: 'number', req: true, min: 10, max: 365, int: true }, { k: 'daysPerSecond', t: 'number', req: true, min: 0.2, max: 20 },
      { k: 'seed', t: 'number', req: true, min: 0, max: 4294967295, int: true }, { k: 'noise', t: 'number', req: true, min: 0, max: 0.3 },
      { k: 'substeps', t: 'number', req: true, min: 1, max: 20, int: true }, { k: 'carryingCapacityMultiplier', t: 'number', req: true, min: 1, max: 5 },
      { k: 'transferPercent', t: 'number', req: true, min: 1, max: 50 }, { k: 'predationPressure', t: 'number', req: true, min: 0.01, max: 1 },
      { k: 'starvationFactor', t: 'number', req: true, min: 0, max: 5 }, { k: 'halfSaturationRatio', t: 'number', req: true, min: 0.1, max: 50 }
    ]
  };

  function checkFields(schema, rec, label) {
    var errs = [];
    schema.forEach(function (f) {
      var v = rec[f.k];
      if (v === undefined || v === null || v === '') {
        if (f.req) errs.push(label + ': "' + f.k + '" is required.');
        return;
      }
      if (f.t === 'string' && typeof v !== 'string') errs.push(label + ': "' + f.k + '" must be text.');
      else if (f.t === 'number' && !isNum(v)) errs.push(label + ': "' + f.k + '" must be a number.');
      else if (f.t === 'boolean' && typeof v !== 'boolean') errs.push(label + ': "' + f.k + '" must be true/false.');
      else if (f.t === 'array' && !Array.isArray(v)) errs.push(label + ': "' + f.k + '" must be a list.');
      else if (f.t === 'object' && !isObj(v)) errs.push(label + ': "' + f.k + '" must be an object.');
      else {
        if (f.t === 'number') {
          if (f.min != null && v < f.min) errs.push(label + ': "' + f.k + '" must be at least ' + f.min + '.');
          if (f.max != null && v > f.max) errs.push(label + ': "' + f.k + '" must be at most ' + f.max + '.');
          if (f.int && Math.floor(v) !== v) errs.push(label + ': "' + f.k + '" must be a whole number.');
        }
        if (f.t === 'string' && f.max && v.length > f.max) errs.push(label + ': "' + f.k + '" is longer than ' + f.max + ' characters.');
        if (f.en && f.en.indexOf(v) < 0) errs.push(label + ': "' + f.k + '" must be one of ' + f.en.join(', ') + '.');
      }
    });
    return errs;
  }

  /** Validate one record against its schema and cross-references. `data` is the whole database. */
  function validateRecord(coll, rec, data, opts) {
    opts = opts || {};
    var label = (coll === 'organisms' ? 'Organism' : coll === 'ecosystems' ? 'Ecosystem' : coll === 'lessons' ? 'Lesson' : 'Simulation settings') + ' "' + (rec && (rec.name || rec.title || rec.id) || '?') + '"';
    if (!isObj(rec)) return [label + ': record must be an object.'];
    var errs = checkFields(SCHEMAS[coll], rec, label);
    var list = data[coll] || [];
    if (!opts.skipDuplicate) {
      var dup = list.filter(function (r) { return r.id === rec.id; }).length;
      if (dup > (opts.exists ? 1 : 0)) errs.push(label + ': duplicate id "' + rec.id + '".');
    }
    if (coll === 'organisms') {
      if (!data.ecosystems.some(function (e) { return e.id === rec.ecosystemId; })) errs.push(label + ': ecosystem "' + rec.ecosystemId + '" does not exist.');
      if (Array.isArray(rec.preyIds)) {
        rec.preyIds.forEach(function (p) {
          if (p === rec.id) errs.push(label + ': an organism cannot eat itself.');
          else if (!data.organisms.some(function (o) { return o.id === p; })) errs.push(label + ': prey "' + p + '" does not exist.');
        });
        if (rec.trophicLevel === 'producer' && rec.preyIds.length) errs.push(label + ': producers make their own food and cannot have prey.');
      }
      if (rec.image && typeof rec.image === 'string' && rec.image.length > 600000) errs.push(label + ': image is too large (max about 450 KB).');
    }
    if (coll === 'ecosystems') {
      if (Array.isArray(rec.pyramid)) {
        var ids = {};
        rec.pyramid.forEach(function (l) {
          if (!isObj(l) || C.LEVELS.indexOf(l.id) < 0) errs.push(label + ': pyramid has an invalid level id.');
          else { if (ids[l.id]) errs.push(label + ': duplicate pyramid level "' + l.id + '".'); ids[l.id] = 1; if (!l.label) errs.push(label + ': level "' + l.id + '" needs a label.'); }
        });
        C.LEVELS.forEach(function (id) { if (!ids[id]) errs.push(label + ': pyramid is missing level "' + id + '".'); });
      }
      if (isObj(rec.environment)) {
        [['sunlight', 0, 100], ['rainfall', 0, 100], ['temperature', -10, 50]].forEach(function (r) {
          var v = rec.environment[r[0]];
          if (!isNum(v) || v < r[1] || v > r[2]) errs.push(label + ': environment "' + r[0] + '" must be a number between ' + r[1] + ' and ' + r[2] + '.');
        });
      }
    }
    if (coll === 'lessons') {
      if (Array.isArray(rec.activities)) {
        var aids = {};
        rec.activities.forEach(function (a) {
          if (!isObj(a) || !a.id) { errs.push(label + ': an activity has no id.'); return; }
          if (aids[a.id]) errs.push(label + ': duplicate activity id "' + a.id + '".'); aids[a.id] = 1;
          if (C.ACTIVITY_TYPES.indexOf(a.type) < 0) errs.push(label + ': activity "' + a.id + '" has unknown type "' + a.type + '".');
          if (!a.title) errs.push(label + ': activity "' + a.id + '" needs a title.');
        });
      }
      if (Array.isArray(rec.objectives) && rec.objectives.some(function (o) { return typeof o !== 'string'; })) errs.push(label + ': objectives must be text.');
    }
    if (coll === 'simulationSettings' && !data.ecosystems.some(function (e) { return e.id === rec.ecosystemId; })) errs.push(label + ': ecosystem "' + rec.ecosystemId + '" does not exist.');
    return errs;
  }

  /** Validate a complete database object. Returns { errors:[], warnings:[] }. */
  function validateAll(data) {
    var errors = [], warnings = [];
    if (!isObj(data)) return { errors: ['Database is not an object.'], warnings: [] };
    ['organisms', 'ecosystems', 'lessons', 'simulationSettings'].forEach(function (c) {
      if (!Array.isArray(data[c])) errors.push('Collection "' + c + '" is missing or not a list.');
    });
    if (!isObj(data.appSettings)) errors.push('Collection "appSettings" is missing or not an object.');
    if (errors.length) return { errors: errors, warnings: warnings };
    ['organisms', 'ecosystems', 'lessons', 'simulationSettings'].forEach(function (c) {
      data[c].forEach(function (r) { errors = errors.concat(validateRecord(c, r, data, { exists: true })); });
    });
    var ecoIds = data.ecosystems.map(function (e) { return e.id; });
    if (!data.ecosystems.length) errors.push('At least one ecosystem is required.');
    if (data.appSettings.defaultEcosystemId && ecoIds.indexOf(data.appSettings.defaultEcosystemId) < 0) errors.push('App settings: default ecosystem does not exist.');
    data.ecosystems.forEach(function (e) {
      if (!data.simulationSettings.some(function (s) { return s.ecosystemId === e.id; })) warnings.push('Ecosystem "' + e.name + '" has no simulation settings (defaults will be used).');
      var act = data.organisms.filter(function (o) { return o.ecosystemId === e.id && o.active; });
      C.LEVELS.forEach(function (l) { if (!act.some(function (o) { return o.trophicLevel === l; })) warnings.push('Ecosystem "' + e.name + '" has no active organism at level "' + C.LEVEL_LABELS[l] + '".'); });
    });
    data.organisms.forEach(function (o) {
      if (o.active && o.trophicLevel !== 'producer' && o.trophicLevel !== 'decomposer' && !(o.preyIds || []).length) warnings.push('Organism "' + o.name + '" is a consumer without prey; it will starve in the simulation.');
    });
    return { errors: errors, warnings: warnings };
  }

  // ---------------------------------------------------------------- file <-> data mapping
  function filesToData(files) {
    var d = { organisms: null, ecosystems: null, lessons: null, simulationSettings: null, appSettings: null };
    var map = { organisms: 'organisms', ecosystems: 'ecosystems', lessons: 'lessons', simulationSettings: 'simulationSettings', appSettings: 'appSettings' };
    for (var k in map) {
      var f = files[C.FILES[k]];
      if (!isObj(f)) throw new Error('File "' + C.FILES[k] + '" is missing or is not a JSON object.');
      if (f.schemaVersion != null && f.schemaVersion > C.SCHEMA_VERSION) throw new Error('"' + C.FILES[k] + '" was made by a newer version of this app.');
      d[k] = f[map[k]];
    }
    var meta = files[C.META_FILE];
    return { data: d, meta: isObj(meta) ? meta : {} };
  }
  function dataToFiles(data, meta) {
    var files = {};
    files[C.FILES.organisms] = { schemaVersion: C.SCHEMA_VERSION, organisms: data.organisms };
    files[C.FILES.ecosystems] = { schemaVersion: C.SCHEMA_VERSION, ecosystems: data.ecosystems };
    files[C.FILES.lessons] = { schemaVersion: C.SCHEMA_VERSION, lessons: data.lessons };
    files[C.FILES.simulationSettings] = { schemaVersion: C.SCHEMA_VERSION, simulationSettings: data.simulationSettings };
    files[C.FILES.appSettings] = { schemaVersion: C.SCHEMA_VERSION, appSettings: data.appSettings };
    files[C.META_FILE] = {
      schemaVersion: C.SCHEMA_VERSION, name: 'Virtual Ecosystem Database', revision: meta.revision, updatedAt: meta.updatedAt,
      files: Object.keys(C.FILES).map(function (k) { return C.FILES[k]; }), counts: counts(data),
      note: 'Manifest for the JSON database. Records live in the other files.'
    };
    return files;
  }
  function counts(data) {
    return {
      organisms: data.organisms.length, ecosystems: data.ecosystems.length, lessons: data.lessons.length,
      activities: data.lessons.reduce(function (n, l) { return n + (l.activities || []).length; }, 0),
      simulationSettings: data.simulationSettings.length, appSettings: Object.keys(data.appSettings).length
    };
  }

  /** Accept either a { files: {...} } bundle, a backup envelope, or a map of individual files. */
  function normalizeImported(obj) {
    if (isObj(obj) && obj.format === 'virtual-ecosystem-backup' && isObj(obj.files)) return obj.files;
    if (isObj(obj) && isObj(obj.files) && obj.files[C.FILES.organisms]) return obj.files;
    if (isObj(obj) && obj[C.FILES.organisms]) return obj;
    throw new Error('This file is not a Virtual Ecosystem database backup.');
  }

  // ---------------------------------------------------------------- folder (File System Access API)
  var supportsFolder = typeof window.showDirectoryPicker === 'function';

  function readJsonFile(dir, name) {
    return dir.getFileHandle(name).then(function (fh) { return fh.getFile(); }).then(function (f) { return f.text(); }).then(function (t) {
      try { return JSON.parse(t); } catch (e) { throw new Error('"' + name + '" contains invalid JSON (' + e.message + ').'); }
    });
  }
  function readFolderFiles(dir) {
    var names = Object.keys(C.FILES).map(function (k) { return C.FILES[k]; }).concat([C.META_FILE]);
    var out = {};
    return Promise.all(names.map(function (n) {
      return readJsonFile(dir, n).then(function (j) { out[n] = j; }, function (e) {
        if (n === C.META_FILE && e && e.name === 'NotFoundError') return;
        if (e && e.name === 'NotFoundError') throw new Error('File "' + n + '" was not found in the selected folder.');
        throw e;
      });
    })).then(function () { return out; });
  }
  function writeJsonFile(dir, name, obj) {
    return dir.getFileHandle(name, { create: true }).then(function (fh) { return fh.createWritable(); }).then(function (w) {
      return w.write(JSON.stringify(obj, null, 2) + '\n').then(function () { return w.close(); });
    });
  }
  function hasFile(dir, name) { return dir.getFileHandle(name).then(function () { return true; }, function () { return false; }); }
  /** The chosen folder may be the data folder itself or the project folder that contains data/. */
  function resolveDataDir(dir) {
    return hasFile(dir, C.FILES.organisms).then(function (ok) {
      if (ok) return { dir: dir, found: true };
      return dir.getDirectoryHandle('data').then(function (sub) {
        return hasFile(sub, C.FILES.organisms).then(function (ok2) { return { dir: ok2 ? sub : dir, found: ok2 }; });
      }, function () { return { dir: dir, found: false }; });
    });
  }

  // ---------------------------------------------------------------- the database object
  var listeners = [];
  var channel = null;
  try { channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('virtual-ecosystem-db') : null; } catch (e) { channel = null; }

  var DB = VE.DB = {
    data: null, meta: { revision: 0, updatedAt: null }, source: 'none', sourceLabel: '', dirty: false,
    supportsFolder: supportsFolder, dirHandle: null, folderName: '', needsReconnect: false, storageWarning: '',
    loadedRevision: 0,

    on: function (fn) { listeners.push(fn); },
    emit: function (type, info) { listeners.forEach(function (fn) { try { fn(type, info); } catch (e) { console.error(e); } }); },

    // ---------- loading
    useFiles: function (files, source, label) {
      var r = filesToData(files);
      var v = validateAll(r.data);
      if (v.errors.length) { var err = new Error('The database is not valid:\n• ' + v.errors.slice(0, 8).join('\n• ') + (v.errors.length > 8 ? '\n…and ' + (v.errors.length - 8) + ' more.' : '')); err.validation = v; throw err; }
      DB.data = clone(r.data);
      DB.meta = { revision: r.meta.revision || 1, updatedAt: r.meta.updatedAt || null };
      DB.loadedRevision = DB.meta.revision;
      DB.source = source; DB.sourceLabel = label || source; DB.dirty = false;
      DB.emit('loaded', { source: source });
    },
    useDefaults: function () {
      if (!window.VE_DEFAULT_DB) throw new Error('data/default-data.js is missing.');
      DB.useFiles(clone(window.VE_DEFAULT_DB.files), 'default', 'Built-in default database');
    },

    /** Student/admin start-up. Tries folder -> browser copy -> bundled default. Never throws. */
    init: function () {
      DB.storageWarning = '';
      var warn = [];
      if (location.protocol === 'file:') warn.push('Opened from a file: some browsers keep separate or temporary storage for file pages, so the browser copy of the data may not persist. Use "Open Database Folder" (Chrome/Edge) or export a backup.');
      return idb().then(function () { return true; }, function () { warn.push('Browser storage (IndexedDB) is unavailable. Your changes can only be kept by saving to a folder or exporting JSON.'); return false; }).then(function (hasIdb) {
        if (!hasIdb) return null;
        return KV.get('dirHandle');
      }).then(function (h) {
        if (!h || !supportsFolder) return null;
        DB.dirHandle = h; DB.folderName = h.name;
        return h.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? p : h.queryPermission({ mode: 'read' }); }).then(function (p) {
          if (p !== 'granted') { DB.needsReconnect = true; return null; }
          return DB.loadFromHandle(h).then(function () { return true; }, function (e) { warn.push('Could not read the database folder: ' + e.message); return null; });
        }, function () { return null; });
      }).then(function (done) {
        if (done) return;
        return KV.get('cache').then(function (c) {
          if (c && c.files) { try { DB.useFiles(c.files, 'cache', 'Browser copy (last saved/imported)'); return; } catch (e) { warn.push('The stored browser copy was invalid and was ignored.'); } }
          DB.useDefaults();
        });
      }).catch(function (e) {
        warn.push(e.message);
        try { DB.useDefaults(); } catch (e2) { DB.data = null; }
      }).then(function () {
        DB.storageWarning = warn.join(' ');
        if (channel) channel.onmessage = function (ev) {
          if (ev.data && ev.data.type === 'updated' && !DB.dirty) DB.reload().then(function () { DB.emit('external-update'); });
        };
      });
    },
    reload: function () {
      if (DB.dirHandle && !DB.needsReconnect) return DB.loadFromHandle(DB.dirHandle).catch(function () { return DB.reloadCache(); });
      return DB.reloadCache();
    },
    reloadCache: function () {
      return KV.get('cache').then(function (c) { if (c && c.files) DB.useFiles(c.files, 'cache', 'Browser copy (last saved/imported)'); });
    },
    loadFromHandle: function (h) {
      return resolveDataDir(h).then(function (r) {
        if (!r.found) throw new Error('No JSON database found in folder "' + h.name + '".');
        DB.dataDir = r.dir;
        return readFolderFiles(r.dir);
      }).then(function (files) { DB.useFiles(files, 'folder', 'Folder: ' + h.name); DB.needsReconnect = false; });
    },

    // ---------- folder actions (must be called from a click)
    openFolder: function () {
      if (!supportsFolder) return Promise.reject(new Error('This browser cannot open folders directly. Use Import JSON instead.'));
      return window.showDirectoryPicker({ mode: 'readwrite', id: 'virtual-ecosystem-data' }).then(function (h) {
        return resolveDataDir(h).then(function (r) {
          if (!r.found) return { handle: h, dir: r.dir, empty: true };
          return readFolderFiles(r.dir).then(function (files) { return { handle: h, dir: r.dir, files: files }; });
        });
      });
    },
    /** Finish openFolder(): adopt the folder as the database (loading its files) or initialise it with current data. */
    adoptFolder: function (res, initialise) {
      DB.dirHandle = res.handle; DB.dataDir = res.dir; DB.folderName = res.handle.name; DB.needsReconnect = false;
      KV.set('dirHandle', res.handle).catch(function () {});
      if (res.empty || initialise) {
        DB.source = 'folder'; DB.sourceLabel = 'Folder: ' + res.handle.name;
        return DB.save({ force: true });
      }
      DB.useFiles(res.files, 'folder', 'Folder: ' + res.handle.name);
      return KV.set('cache', { files: dataToFiles(DB.data, DB.meta), savedAt: nowIso() }).catch(function () {});
    },
    reconnect: function () {
      var h = DB.dirHandle;
      if (!h) return Promise.reject(new Error('No folder has been connected yet.'));
      return h.requestPermission({ mode: 'readwrite' }).then(function (p) {
        if (p !== 'granted') throw new Error('Permission to use the folder was not granted.');
        return DB.loadFromHandle(h);
      });
    },
    disconnectFolder: function () {
      DB.dirHandle = null; DB.dataDir = null; DB.folderName = ''; DB.needsReconnect = false;
      return KV.del('dirHandle').then(function () { return DB.reloadCache(); });
    },
    canWriteFolder: function () { return !!(DB.dataDir && DB.dirHandle && !DB.needsReconnect && DB.source === 'folder'); },

    // ---------- reading helpers
    get: function (coll, id) { return (DB.data[coll] || []).find(function (r) { return r.id === id; }) || null; },
    list: function (coll) { return DB.data[coll]; },
    counts: function () { return counts(DB.data); },
    validate: function () { return validateAll(DB.data); },
    validateRecord: function (coll, rec, opts) { return validateRecord(coll, rec, DB.data, opts); },
    nextId: function (coll) {
      var prefix = C.PREFIX[coll], max = 0, re = new RegExp('^' + prefix + '_(\\d+)$');
      var all = coll === 'activities' ? [].concat.apply([], DB.data.lessons.map(function (l) { return l.activities; })) : DB.data[coll];
      all.forEach(function (r) { var m = re.exec(r.id); if (m) max = Math.max(max, +m[1]); });
      return prefix + '_' + String(max + 1).padStart(3, '0');
    },

    // ---------- CRUD (in memory; Save Changes persists)
    add: function (coll, rec) {
      var r = clone(rec);
      if (!r.id) r.id = DB.nextId(coll);
      var errs = validateRecord(coll, r, DB.data, { skipDuplicate: false });
      if (errs.length) throw DB.invalid(errs);
      DB.data[coll].push(r); DB.touch(); return r;
    },
    update: function (coll, id, patch) {
      var i = DB.data[coll].findIndex(function (r) { return r.id === id; });
      if (i < 0) throw new Error('Record "' + id + '" was not found.');
      var merged = Object.assign({}, DB.data[coll][i], clone(patch), { id: id });
      var tmp = Object.assign({}, DB.data, {}); tmp[coll] = DB.data[coll].slice(); tmp[coll][i] = merged;
      var errs = validateRecord(coll, merged, tmp, { exists: true });
      if (errs.length) throw DB.invalid(errs);
      DB.data[coll][i] = merged; DB.touch(); return merged;
    },
    remove: function (coll, id) {
      var i = DB.data[coll].findIndex(function (r) { return r.id === id; });
      if (i < 0) throw new Error('Record "' + id + '" was not found.');
      var gone = DB.data[coll].splice(i, 1)[0];
      if (coll === 'organisms') {
        DB.data.organisms.forEach(function (o) { o.preyIds = (o.preyIds || []).filter(function (p) { return p !== id; }); });
        DB.data.lessons.forEach(function (l) { l.activities.forEach(function (a) { if (a.excludeOrganismIds) a.excludeOrganismIds = a.excludeOrganismIds.filter(function (x) { return x !== id; }); }); });
      }
      if (coll === 'ecosystems') {
        DB.data.organisms = DB.data.organisms.filter(function (o) { return o.ecosystemId !== id; });
        DB.data.simulationSettings = DB.data.simulationSettings.filter(function (s) { return s.ecosystemId !== id; });
        DB.data.organisms.forEach(function (o) { o.preyIds = (o.preyIds || []).filter(function (p) { return DB.data.organisms.some(function (x) { return x.id === p; }); }); });
        if (DB.data.appSettings.defaultEcosystemId === id && DB.data.ecosystems.length) DB.data.appSettings.defaultEcosystemId = DB.data.ecosystems[0].id;
      }
      DB.touch(); return gone;
    },
    setAppSettings: function (patch) {
      DB.data.appSettings = Object.assign({}, DB.data.appSettings, clone(patch));
      DB.touch();
    },
    invalid: function (errs) { var e = new Error(errs.join('\n')); e.validation = { errors: errs }; return e; },
    touch: function () { DB.dirty = true; DB.emit('changed'); },

    /** What would break if this record is deleted? Returns a list of human-readable strings. */
    references: function (coll, id) {
      var refs = [];
      if (coll === 'organisms') {
        DB.data.organisms.forEach(function (o) { if ((o.preyIds || []).indexOf(id) >= 0) refs.push('"' + o.name + '" lists it as prey (the link will be removed).'); });
        DB.data.lessons.forEach(function (l) { l.activities.forEach(function (a) { if ((a.excludeOrganismIds || []).indexOf(id) >= 0) refs.push('Lesson "' + l.title + '" › ' + a.title + ' excludes it (setting will be removed).'); }); });
        var o = DB.get('organisms', id);
        if (o && o.active) DB.data.lessons.forEach(function (l) { if (l.enabled) l.activities.forEach(function (a) { if (a.enabled && ['explore', 'arrange', 'arrangeEnergy', 'simulation', 'energyAnimation'].indexOf(a.type) >= 0 && (a.excludeOrganismIds || []).indexOf(id) < 0) refs.push('Used by lesson "' + l.title + '" › ' + a.title + '.'); }); });
      }
      if (coll === 'ecosystems') {
        var orgs = DB.data.organisms.filter(function (o) { return o.ecosystemId === id; });
        if (orgs.length) refs.push(orgs.length + ' organism(s) belong to it and will be deleted too: ' + orgs.map(function (o) { return o.name; }).join(', ') + '.');
        if (DB.data.simulationSettings.some(function (s) { return s.ecosystemId === id; })) refs.push('Its simulation settings will be deleted.');
        if (DB.data.appSettings.defaultEcosystemId === id) refs.push('It is the default ecosystem; another one will become the default.');
      }
      return refs;
    },

    // ---------- saving
    /** Validate, back up, and write. Resolves with { target: 'folder'|'browser', warnings }. */
    save: function (opts) {
      opts = opts || {};
      var v = validateAll(DB.data);
      if (v.errors.length) return Promise.reject(DB.invalid(v.errors));
      var canFolder = DB.canWriteFolder() || (opts.force && DB.dirHandle && DB.dataDir);
      var p = Promise.resolve();
      if (canFolder && !opts.force) {
        // detect edits made to the folder by someone/something else since we loaded it
        p = readJsonFile(DB.dataDir, C.META_FILE).then(function (m) {
          if (m && m.revision && m.revision !== DB.loadedRevision && !opts.overrideConflict) {
            var e = new Error('The files in the folder changed since you loaded them (revision ' + m.revision + ' on disk, you have ' + DB.loadedRevision + '). Reload the folder, or save again to overwrite.');
            e.conflict = true; throw e;
          }
        }, function () {});
      }
      return p.then(function () {
        return DB.snapshot('auto-before-save').catch(function () {});
      }).then(function () {
        var meta = { revision: (DB.meta.revision || 0) + 1, updatedAt: nowIso() };
        var files = dataToFiles(DB.data, meta);
        var chain = Promise.resolve();
        if (canFolder) {
          chain = DB.backupFolderFiles().catch(function () {}).then(function () {
            return Object.keys(files).reduce(function (pr, n) { return pr.then(function () { return writeJsonFile(DB.dataDir, n, files[n]); }); }, Promise.resolve());
          });
        }
        return chain.then(function () {
          DB.meta = meta; DB.loadedRevision = meta.revision; DB.dirty = false;
          return KV.set('cache', { files: files, savedAt: nowIso() }).catch(function () { DB.storageWarning = 'Could not update the browser copy.'; });
        }).then(function () {
          if (channel) channel.postMessage({ type: 'updated', revision: meta.revision });
          DB.emit('saved', { target: canFolder ? 'folder' : 'browser' });
          return { target: canFolder ? 'folder' : 'browser', warnings: v.warnings };
        });
      });
    },
    /** Copy the current JSON files in the folder to data/backups/<timestamp>/ before they are overwritten. */
    backupFolderFiles: function () {
      var dir = DB.dataDir, ts = stamp(), keep = (DB.data.appSettings.maxBackups || 10);
      return dir.getDirectoryHandle('backups', { create: true }).then(function (bd) {
        return bd.getDirectoryHandle(ts, { create: true }).then(function (sub) {
          return readFolderFiles(dir).then(function (files) {
            return Object.keys(files).reduce(function (pr, n) { return pr.then(function () { return writeJsonFile(sub, n, files[n]); }); }, Promise.resolve());
          });
        }).then(function () {
          var names = []; // prune old backups
          var it = bd.entries ? bd.entries() : null;
          if (!it) return;
          return (function loop() { return it.next().then(function (r) { if (r.done) return; if (r.value[1].kind === 'directory') names.push(r.value[0]); return loop(); }); })().then(function () {
            names.sort(); var extra = names.slice(0, Math.max(0, names.length - keep));
            return Promise.all(extra.map(function (n) { return bd.removeEntry(n, { recursive: true }).catch(function () {}); }));
          });
        });
      });
    },

    // ---------- snapshots (restore points kept in the browser)
    snapshot: function (label) {
      if (!DB.data) return Promise.resolve();
      return KV.get('snapshots').then(function (list) {
        list = list || [];
        list.unshift({ id: 'snap_' + Date.now(), label: label || 'manual', at: nowIso(), counts: counts(DB.data), files: dataToFiles(DB.data, DB.meta) });
        var max = (DB.data.appSettings.maxBackups || 10);
        return KV.set('snapshots', list.slice(0, max));
      });
    },
    listSnapshots: function () { return KV.get('snapshots').then(function (l) { return l || []; }); },
    restoreSnapshot: function (id) {
      return DB.listSnapshots().then(function (list) {
        var s = list.find(function (x) { return x.id === id; });
        if (!s) throw new Error('Restore point not found.');
        return DB.snapshot('auto-before-restore').then(function () {
          var src = DB.source, lab = DB.sourceLabel;
          DB.useFiles(clone(s.files), src === 'none' ? 'cache' : src, lab);
          DB.dirty = true; DB.emit('changed');
        });
      });
    },
    deleteSnapshot: function (id) {
      return DB.listSnapshots().then(function (l) { return KV.set('snapshots', l.filter(function (x) { return x.id !== id; })); });
    },

    // ---------- import / export
    bundle: function () {
      var meta = { revision: DB.meta.revision, updatedAt: nowIso() };
      return { format: 'virtual-ecosystem-backup', schemaVersion: C.SCHEMA_VERSION, exportedAt: nowIso(), files: dataToFiles(DB.data, meta) };
    },
    exportFiles: function () { var f = dataToFiles(DB.data, { revision: DB.meta.revision, updatedAt: nowIso() }); return f; },
    /** Parse File objects chosen by the user: one bundle, or several individual JSON files. Returns files map (validated by useFiles). */
    readImport: function (fileList) {
      var arr = Array.prototype.slice.call(fileList);
      return Promise.all(arr.map(function (f) {
        return new Promise(function (res, rej) {
          var r = new FileReader();
          r.onload = function () { try { res({ name: f.name, json: JSON.parse(r.result) }); } catch (e) { rej(new Error('"' + f.name + '" is not valid JSON (' + e.message + ').')); } };
          r.onerror = function () { rej(new Error('Could not read "' + f.name + '".')); };
          r.readAsText(f);
        });
      })).then(function (items) {
        if (items.length === 1) { try { return normalizeImported(items[0].json); } catch (e) { /* maybe a single collection file */ } }
        var files = {};
        items.forEach(function (it) { var base = it.name.split(/[\\/]/).pop(); files[base] = it.json; });
        var missing = Object.keys(C.FILES).map(function (k) { return C.FILES[k]; }).filter(function (n) { return !files[n]; });
        if (missing.length) throw new Error('Missing file(s): ' + missing.join(', ') + '. Choose the backup (.json bundle) or select all of the database files together.');
        return files;
      });
    },
    /** Replace the live database with imported files. Marks as dirty so the admin must Save to persist to the folder. */
    applyImport: function (files, persistCache) {
      return DB.snapshot('auto-before-import').catch(function () {}).then(function () {
        var src = DB.source;
        DB.useFiles(files, src === 'folder' ? 'folder' : 'import', src === 'folder' ? DB.sourceLabel : 'Imported file');
        DB.dirty = true;
        DB.emit('changed');
        if (persistCache) return KV.set('cache', { files: dataToFiles(DB.data, DB.meta), savedAt: nowIso() });
      });
    },
    resetDefaults: function () {
      return DB.snapshot('auto-before-reset').catch(function () {}).then(function () {
        var src = DB.source;
        DB.useFiles(clone(window.VE_DEFAULT_DB.files), src === 'folder' ? 'folder' : 'default', src === 'folder' ? DB.sourceLabel : 'Built-in default database');
        DB.dirty = true; DB.emit('changed');
      });
    },
    download: function (name, obj) {
      var blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
  };

  DB.clone = clone; DB.stamp = stamp; DB.C = C; DB.KV = KV;
})(window.VE = window.VE || {});
