/* Organism helpers: images/avatars, filtering, food relationships. All data comes from VE.DB. */
(function (VE) {
  'use strict';
  var PALETTE = { producer: '#5aa63f', primary_consumer: '#1ab3d0', secondary_consumer: '#f5c518', tertiary_consumer: '#8c4bd1', top_predator: '#ee3b3b', decomposer: '#c0617a' };
  var avatarCache = {};

  /** Inline SVG avatar used when an organism has no image (or the image fails to load). */
  function avatar(o) {
    var key = o.id + '|' + o.name + '|' + o.emoji;
    if (avatarCache[key]) return avatarCache[key];
    var c = PALETTE[o.trophicLevel] || '#5aa63f';
    var inner = o.emoji
      ? '<text x="60" y="78" font-size="62" text-anchor="middle">' + VE.UI.esc(o.emoji) + '</text>'
      : '<text x="60" y="76" font-size="54" font-family="Arial,sans-serif" font-weight="700" fill="#fff" text-anchor="middle">' + VE.UI.esc((o.name || '?').charAt(0).toUpperCase()) + '</text>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="' + (o.emoji ? '#ffffffcc' : c) + '" stroke="' + c + '" stroke-width="6"/>' + inner + '</svg>';
    return (avatarCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  function imageSrc(o) { return o.image ? o.image : avatar(o); }
  /** <img> with automatic avatar fallback. */
  function img(o, cls) {
    var i = VE.UI.el('img', { src: imageSrc(o), alt: o.name, class: cls || '', draggable: 'false' });
    i.addEventListener('error', function () { if (i.src !== avatar(o)) i.src = avatar(o); });
    return i;
  }

  var Org = VE.Org = {
    avatar: avatar, imageSrc: imageSrc, img: img, PALETTE: PALETTE,
    inEcosystem: function (ecoId, opts) {
      opts = opts || {};
      return VE.DB.data.organisms.filter(function (o) {
        return o.ecosystemId === ecoId && (opts.all || o.active) && (opts.decomposers || o.trophicLevel !== 'decomposer');
      });
    },
    byLevel: function (list, level) { return list.filter(function (o) { return o.trophicLevel === level; }); },
    preyOf: function (o) { return (o.preyIds || []).map(function (id) { return VE.DB.get('organisms', id); }).filter(Boolean); },
    predatorsOf: function (id) { return VE.DB.data.organisms.filter(function (o) { return o.active && (o.preyIds || []).indexOf(id) >= 0; }); },
    names: function (list) { return list.map(function (o) { return o.name; }); }
  };
})(window.VE = window.VE || {});
