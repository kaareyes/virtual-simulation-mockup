/* SVG food-pyramid renderer shared by Explore, Arrange and Energy activities. */
(function (VE) {
  'use strict';
  var UI = VE.UI, S = UI.svgEl;

  /** Geometry for n stacked trapezoids forming a (possibly flat-topped) triangle. */
  function geometry(n, o) {
    o = o || {};
    var LH = o.levelHeight || 72, gap = o.gap == null ? 4 : o.gap, Wb = o.baseWidth || 520, cx = o.cx || 340;
    var H = n * LH + (n - 1) * gap, minW = o.flatTop ? Wb * (o.flatTopRatio || 0.2) : 0;
    function hw(y) { return (minW + (y / H) * (Wb - minW)) / 2; }
    var rows = [];
    for (var i = 0; i < n; i++) {
      var y0 = i * (LH + gap), y1 = y0 + LH;
      rows.push({ y0: y0, y1: y1, cy: (y0 + y1) / 2,
        pts: [[cx - hw(y0), y0], [cx + hw(y0), y0], [cx + hw(y1), y1], [cx - hw(y1), y1]], hw0: hw(y0), hw1: hw(y1), hwm: hw((y0 + y1) / 2) });
    }
    return { rows: rows, H: H, cx: cx, Wb: Wb, LH: LH, hw: hw };
  }
  function pts(p) { return p.map(function (a) { return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' '); }

  /**
   * opts: { levels:[{id,label,sub,color,items:[org],selected,dashed,muted,hideItems,text,zone}], flatTop, showSun, levelHeight, gap,
   *         onSelect(id), slots:[{levelId, text, zone}] , baseWidth }
   * returns { svg, geo, setItems(levelId, orgs), levelNode(id), slotNode(id), setSlotText(id, text) }
   */
  function render(host, opts) {
    var levels = opts.levels, n = levels.length;
    var geo = geometry(n, { levelHeight: opts.levelHeight, gap: opts.gap, flatTop: opts.flatTop, flatTopRatio: opts.flatTopRatio, baseWidth: opts.baseWidth, cx: opts.cx });
    var W = 680, pad = opts.slots ? 10 : 4;
    var svg = S('svg', { class: 'pyramid-svg', viewBox: '0 0 ' + W + ' ' + (geo.H + pad * 2), role: 'group', 'aria-label': 'Food pyramid' });
    var g = S('g', { transform: 'translate(0,' + pad + ')' });
    svg.appendChild(g);
    var nodes = {}, slotNodes = {};

    if (opts.showSun !== false) {
      var sunWrap = S('g', { transform: 'translate(8,' + (geo.H - 92) + ')', class: 'py-sun' });
      var sun = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      sun.innerHTML = '<g stroke="#f7b500" stroke-width="4" stroke-linecap="round" transform="scale(1.0)"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g><circle cx="32" cy="32" r="12" fill="#ffd23f" stroke="#f7b500" stroke-width="2"/>';
      sunWrap.appendChild(sun); g.appendChild(sunWrap);
    }

    levels.forEach(function (lv, i) {
      var r = geo.rows[i];
      var cls = 'py-level' + (lv.selected ? ' selected' : '') + (lv.dashed ? ' dashed' : '') + (lv.muted ? ' muted' : '') + (opts.onSelect ? ' clickable' : '');
      var attrs = { class: cls, 'data-level': lv.id };
      if (lv.zone) { attrs['data-drop'] = 'level'; attrs.tabindex = '0'; attrs.role = 'button'; attrs['aria-label'] = lv.label; }
      else if (opts.onSelect) { attrs.tabindex = '0'; attrs.role = 'button'; attrs['aria-label'] = lv.label + (lv.sub ? ' (' + lv.sub + ')' : ''); }
      var node = S('g', attrs);
      var poly = S('polygon', { points: pts(r.pts), fill: lv.color, 'fill-opacity': lv.dashed ? 0.28 : 1, stroke: lv.dashed ? lv.color : '#fff', 'stroke-width': lv.dashed ? 2 : 2.5, 'stroke-dasharray': lv.dashed ? '7 5' : null, 'stroke-linejoin': 'round' });
      node.appendChild(poly);
      var hasItems = lv.items && lv.items.length && !lv.hideItems;
      var label = S('text', { class: 'py-label', x: geo.cx, y: hasItems ? r.y0 + 15 : r.cy + 5, 'text-anchor': 'middle', fill: lv.dashed ? '#0b3d62' : (lv.textColor || '#fff') });
      label.textContent = lv.label + (lv.text ? ' ' + lv.text : '');
      var availW = (hasItems ? r.hw0 : r.hwm) * 2 - 22, estW = label.textContent.length * 8;
      if (estW > availW) label.setAttribute('font-size', Math.max(8.5, 14 * availW / estW).toFixed(1));
      node.appendChild(label);
      var itemsG = S('g', { class: 'py-items' });
      node.appendChild(itemsG);
      if (opts.onSelect) {
        node.addEventListener('click', function () { opts.onSelect(lv.id); });
        node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onSelect(lv.id); } });
      }
      g.appendChild(node);
      nodes[lv.id] = { node: node, row: r, itemsG: itemsG, label: label, poly: poly, lv: lv };
      fillItems(nodes[lv.id], lv.items, lv.hideItems, false);
    });

    function fillItems(entry, items, hide, animate) {
      var r = entry.row; UI.clear(entry.itemsG);
      if (hide || !items || !items.length) return;
      var cnt = items.length, avail = r.hwm * 2 - 26;
      var size = Math.max(14, Math.min(r.y1 - r.y0 - 44, avail / (cnt * 1.1), 46));
      var total = cnt * size + (cnt - 1) * Math.min(14, size * 0.3);
      var start = geo.cx - total / 2, step = size + Math.min(14, size * 0.3);
      var imgY = r.y0 + 21;
      items.forEach(function (o, k) {
        var x = start + k * step + size / 2;
        var im = S('image', { href: VE.Org.imageSrc(o), x: x - size / 2, y: imgY, width: size, height: size, preserveAspectRatio: 'xMidYMid meet', class: 'py-item' + (animate ? ' pop-in' : ''), 'aria-hidden': 'true' });
        im.addEventListener('error', function () { im.setAttribute('href', VE.Org.avatar(o)); });
        entry.itemsG.appendChild(im);
        var t = S('text', { class: 'py-item-name', x: x, y: imgY + size + 9, 'text-anchor': 'middle', fill: entry.lv.dashed ? '#0b3d62' : '#0b3d62' });
        t.textContent = o.name; entry.itemsG.appendChild(t);
      });
    }

    (opts.slots || []).forEach(function (s) {
      var r = nodes[s.levelId].row;
      var x = geo.cx + r.hw1 + 18, y = r.cy - 18, w = 96, h = 36;
      var attrs = { class: 'py-slot' + (s.text ? ' filled' : ''), 'data-level': s.levelId };
      if (s.zone) { attrs['data-drop'] = 'energy'; attrs.tabindex = '0'; attrs.role = 'button'; attrs['aria-label'] = 'Energy value for ' + nodes[s.levelId].lv.label; }
      var node = S('g', attrs, [S('rect', { x: x, y: y, width: w, height: h, rx: 9 })]);
      var t = S('text', { x: x + w / 2, y: y + 24, 'text-anchor': 'middle' }); t.textContent = s.text || '';
      node.appendChild(t); g.appendChild(node);
      slotNodes[s.levelId] = { node: node, text: t };
    });

    host.appendChild(svg);
    return {
      svg: svg, geo: geo,
      levelNode: function (id) { return nodes[id] && nodes[id].node; },
      slotNode: function (id) { return slotNodes[id] && slotNodes[id].node; },
      setItems: function (id, items, animate) { fillItems(nodes[id], items, false, animate); },
      setSlotText: function (id, text) { var s = slotNodes[id]; s.text.textContent = text; s.node.classList.toggle('filled', !!text); },
      setSelected: function (id) { Object.keys(nodes).forEach(function (k) { nodes[k].node.classList.toggle('selected', k === id); }); },
      setDashed: function (id, on) { var e = nodes[id]; e.node.classList.toggle('dashed', on); e.poly.setAttribute('fill-opacity', on ? 0.28 : 1); },
      flash: function (id, cls) { var nd = nodes[id] && nodes[id].node; if (!nd) return; nd.classList.add(cls); setTimeout(function () { nd.classList.remove(cls); }, 1600); }
    };
  }

  VE.Pyramid = { render: render, geometry: geometry, pts: pts };
})(window.VE = window.VE || {});
