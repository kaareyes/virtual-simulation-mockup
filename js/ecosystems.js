/* Ecosystem helpers: current selection, pyramid levels, energy percentages. */
(function (VE) {
  'use strict';
  var Eco = VE.Eco = {
    all: function () { return VE.DB.data.ecosystems.filter(function (e) { return e.active !== false; }); },
    currentId: function () {
      var all = Eco.all(), saved = VE.Store.get('ecosystem', null), def = VE.DB.data.appSettings.defaultEcosystemId;
      var pick = [saved, def].filter(function (id) { return all.some(function (e) { return e.id === id; }); })[0];
      return pick || (all[0] && all[0].id) || (VE.DB.data.ecosystems[0] && VE.DB.data.ecosystems[0].id);
    },
    current: function () { return VE.DB.get('ecosystems', Eco.currentId()); },
    setCurrent: function (id) { VE.Store.set('ecosystem', id); },
    level: function (eco, id) { return eco.pyramid.find(function (l) { return l.id === id; }); },
    /** Levels from top predator (index 0) to producer (last) — display order. */
    displayLevels: function (eco) { return VE.Const.LEVELS.slice().reverse().map(function (id) { return Eco.level(eco, id); }); },
    simSettings: function (ecoId) {
      var s = VE.DB.data.simulationSettings.find(function (x) { return x.ecosystemId === ecoId; });
      return Object.assign({}, VE.Sim.DEFAULT_SETTINGS, s || {});
    },
    /** Energy % reaching a level, from the ecosystem's transfer percentage (producer = 100). */
    energyPercent: function (ecoId, levelId) {
      var t = Eco.simSettings(ecoId).transferPercent / 100;
      var i = VE.Const.LEVELS.indexOf(levelId);
      return 100 * Math.pow(t, i);
    },
    fmtPercent: function (v) { return String(parseFloat(v.toPrecision(6))) + '%'; },
    energyText: function (ecoId, levelId) { return Eco.fmtPercent(Eco.energyPercent(ecoId, levelId)); },
    title: function (eco) {
      var t = VE.DB.data.appSettings.appTitle || 'ENERGY FLOW IN THE ECOSYSTEM OF {ecosystem}';
      return t.replace('{ecosystem}', (eco.shortName || eco.name).toUpperCase());
    }
  };
})(window.VE = window.VE || {});
