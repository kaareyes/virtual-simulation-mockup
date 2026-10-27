/* Lesson helpers: ordering, enabled activities, organism pools, progress (localStorage). */
(function (VE) {
  'use strict';
  var Lessons = VE.Lessons = {
    enabled: function () {
      return VE.DB.data.lessons.filter(function (l) { return l.enabled && Lessons.activities(l).length; }).sort(function (a, b) { return a.order - b.order; });
    },
    activities: function (lesson) { return lesson.activities.filter(function (a) { return a.enabled; }); },
    /** Stepper groups: consecutive activities sharing the same `group` label form one step. */
    steps: function (lesson) {
      var steps = [];
      Lessons.activities(lesson).forEach(function (a) {
        var g = a.group || a.title, last = steps[steps.length - 1];
        if (last && last.label === g) last.activities.push(a); else steps.push({ label: g, activities: [a] });
      });
      return steps;
    },
    /** Organisms for an activity. Arrange-type activities exclude organisms the admin unticked; later activities inherit the lesson's arrange pool. */
    pool: function (lesson, activity, ecoId) {
      var excl = activity.excludeOrganismIds;
      if (!excl && (activity.type === 'arrangeEnergy' || activity.type === 'energyAnimation')) {
        var a = lesson.activities.find(function (x) { return x.type === 'arrange'; });
        excl = a && a.excludeOrganismIds;
      }
      excl = excl || [];
      return VE.Org.inEcosystem(ecoId).filter(function (o) { return excl.indexOf(o.id) < 0; });
    },
    progress: function (lessonId) { return VE.Store.get('progress_' + lessonId, { done: {} }); },
    markDone: function (lessonId, activityId) { var p = Lessons.progress(lessonId); p.done[activityId] = true; VE.Store.set('progress_' + lessonId, p); },
    resetProgress: function (lessonId) { VE.Store.set('progress_' + lessonId, { done: {} }); },
    isStepDone: function (lessonId, step) { var p = Lessons.progress(lessonId); return step.activities.every(function (a) { return p.done[a.id]; }); }
  };
})(window.VE = window.VE || {});
