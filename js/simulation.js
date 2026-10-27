/*
 * Simulation engine (no DOM access, so it can be unit-tested outside the browser).
 *
 * MODEL SUMMARY  (a teaching model, NOT a validated prediction)
 * -------------------------------------------------------------
 * Every organism i has a population N_i that changes once per simulated day
 * (computed in `substeps` smaller steps for numerical stability).
 *
 * Consumers (organisms that list prey):
 *   S      = total population of the prey they eat
 *   R      = S / N_i                        prey available per consumer
 *   phi    = R / (R + rho)                  feeding success, 0..1  (ratio-dependent, saturating)
 *   births = r_i * phi * N_i                reproduction is limited by food
 *   eaten  = births * pressure / eps        prey consumed; eps = energy-transfer % / 100,
 *            pressure = predationPressure (a lower transfer % means more prey eaten per new consumer)
 *   deaths = m_i * (1 + starvation * (1 - phi)) * N_i * tempFactor
 *   eaten prey are taken from each prey species in proportion to its abundance.
 *
 * Producers (no prey):
 *   births = r_i * E * N_i * (1 - N_i / K_i)     logistic growth, E = sunlight/rain factor
 *   deaths = m_i * N_i
 *   K_i    = starting population * carryingCapacityMultiplier
 *   "All producers OFF" stops producer growth and adds 12 % extra daily die-off (e.g. drought/blight).
 *
 * Randomness: the only random element is a small day-to-day variation of births
 * (+/- `noise`) drawn from a seeded generator, so identical settings + seed give identical results.
 */
(function (VE) {
  'use strict';

  var GROUPS = ['producer', 'herbivore', 'omnivore', 'top'];
  var DEFAULT_LEVEL_GROUP = {
    producer: 'producer', primary_consumer: 'herbivore', secondary_consumer: 'omnivore',
    tertiary_consumer: 'omnivore', top_predator: 'top'
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function groupOf(org, ecosystem) {
    var lv = ecosystem && ecosystem.pyramid && ecosystem.pyramid.find(function (l) { return l.id === org.trophicLevel; });
    return (lv && lv.simGroup) || DEFAULT_LEVEL_GROUP[org.trophicLevel] || 'producer';
  }

  /** Environment -> producer growth factor (1.0 at sunlight 80 / rainfall 70). */
  function envGrowthFactor(env) {
    var sun = clamp((env && env.sunlight != null ? env.sunlight : 80), 0, 100) / 100;
    var rain = clamp((env && env.rainfall != null ? env.rainfall : 70), 0, 100) / 100;
    var base = 0.8 * (0.4 + 0.6 * 0.7);
    return clamp((sun * (0.4 + 0.6 * rain)) / base, 0.05, 1.6);
  }

  /** Temperature -> extra mortality multiplier (comfortable range 18-32 C). */
  function tempFactor(env) {
    var t = env && env.temperature != null ? env.temperature : 24;
    var off = t < 18 ? 18 - t : t > 32 ? t - 32 : 0;
    return 1 + 0.03 * off;
  }

  function Engine(cfg) {
    this.cfg = cfg;
    this.reset();
  }

  Engine.prototype.reset = function (groupCounts) {
    var cfg = this.cfg;
    if (groupCounts) cfg.groupCounts = groupCounts;
    var st = cfg.settings;
    var counts = cfg.groupCounts || {};
    this.orgs = cfg.organisms.filter(function (o) { return o.active !== false; });
    var ids = {};
    this.orgs.forEach(function (o) { ids[o.id] = true; });
    this.N = {}; this.K = {}; this.group = {}; this.prey = {};
    var self = this;
    this.orgs.forEach(function (o) {
      var g = groupOf(o, cfg.ecosystem);
      self.group[o.id] = g;
      var scale = (counts[g] != null ? counts[g] : 3) / 3;
      self.N[o.id] = Math.max(0, o.population * scale);
      self.K[o.id] = Math.max(1, self.N[o.id] * st.carryingCapacityMultiplier);
      self.prey[o.id] = (o.preyIds || []).filter(function (p) { return ids[p] && p !== o.id; });
    });
    this.rand = mulberry32(st.seed >>> 0);
    this.day = 0;
    this.producersOn = true;
    this.E = envGrowthFactor(cfg.ecosystem && cfg.ecosystem.environment);
    this.T = tempFactor(cfg.ecosystem && cfg.ecosystem.environment);
    this.history = [this.snapshot()];
    this.events = [];
  };

  Engine.prototype.snapshot = function () {
    var pops = {};
    for (var id in this.N) pops[id] = this.N[id];
    return { day: this.day, pops: pops };
  };

  Engine.prototype.groupTotals = function (pops) {
    var t = { producer: 0, herbivore: 0, omnivore: 0, top: 0 };
    for (var id in pops) t[this.group[id]] += pops[id];
    return t;
  };

  /** Multiply the population of every organism in a group (user "adds/removes" organisms). */
  Engine.prototype.scaleGroup = function (group, factor) {
    var self = this;
    this.orgs.forEach(function (o) {
      if (self.group[o.id] === group) {
        self.N[o.id] = Math.max(0, self.N[o.id] * factor);
        if (group === 'producer') self.K[o.id] = Math.max(1, self.K[o.id] * factor);
      }
    });
    this.events.push({ day: this.day, type: 'scale', group: group, factor: factor });
    this.history[this.history.length - 1] = this.snapshot();
  };

  Engine.prototype.setProducersOn = function (on) {
    this.producersOn = !!on;
    this.events.push({ day: this.day, type: 'producers', on: !!on });
  };

  Engine.prototype.step = function () {
    var st = this.cfg.settings;
    var k = Math.max(1, st.substeps | 0);
    var dt = 1 / k;
    var eps = clamp(st.transferPercent / 100, 0.001, 1);
    var rho = Math.max(0.01, st.halfSaturationRatio);
    var noiseNow = {};
    var self = this;
    this.orgs.forEach(function (o) { noiseNow[o.id] = 1 + (self.rand() * 2 - 1) * st.noise; });

    for (var s = 0; s < k; s++) {
      var delta = {};
      this.orgs.forEach(function (o) { delta[o.id] = 0; });
      this.orgs.forEach(function (o) {
        var id = o.id, N = self.N[id];
        if (N <= 0) return;
        var births, deaths = 0, preyList = self.prey[id];
        if (!preyList.length && self.group[id] === 'producer') {
          if (self.producersOn) {
            births = o.reproductionRate * self.E * N * Math.max(0, 1 - N / self.K[id]) * noiseNow[id] * dt;
            deaths = o.mortalityRate * N * dt;
          } else {
            births = 0;
            deaths = (o.mortalityRate + 0.12) * N * dt;
          }
        } else {
          var S = 0;
          preyList.forEach(function (p) { S += self.N[p]; });
          var phi = S > 0 ? (S / N) / ((S / N) + rho) : 0;
          births = o.reproductionRate * phi * N * noiseNow[id] * dt;
          var eaten = Math.min(births * st.predationPressure / eps, S * 0.5);
          if (S > 0) preyList.forEach(function (p) { delta[p] -= eaten * (self.N[p] / S); });
          deaths = o.mortalityRate * (1 + st.starvationFactor * (1 - phi)) * N * self.T * dt;
        }
        delta[id] += births - deaths;
      });
      this.orgs.forEach(function (o) {
        var v = self.N[o.id] + delta[o.id];
        self.N[o.id] = v < 0.5 ? 0 : v;
      });
    }
    this.day += 1;
    var snap = this.snapshot();
    this.history.push(snap);
    return snap;
  };

  Engine.prototype.done = function () { return this.day >= this.cfg.settings.durationDays; };

  /** Defaults used when a simulation-settings record is missing. */
  var DEFAULT_SETTINGS = {
    durationDays: 60, daysPerSecond: 1.5, seed: 2026, noise: 0.02, substeps: 4,
    carryingCapacityMultiplier: 1.5, transferPercent: 10, predationPressure: 0.15, starvationFactor: 1, halfSaturationRatio: 5
  };

  VE.Sim = {
    Engine: Engine, GROUPS: GROUPS, DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    groupOf: groupOf, mulberry32: mulberry32, envGrowthFactor: envGrowthFactor, tempFactor: tempFactor
  };
})(typeof window !== 'undefined' ? (window.VE = window.VE || {}) : (module.exports = {}));
