/*
 * Reusable drag-and-drop engine (Pointer Events: mouse, touch and pen) with a keyboard / tap-to-place alternative.
 *
 *   var dd = VE.DragDrop.create({
 *     root:  element containing items and zones,
 *     itemSelector: '[data-drag]',            // draggable things
 *     zoneSelector: '[data-drop]',            // drop targets
 *     accepts: function (item, zone) { return true; },        // is this zone a candidate? (highlighted while dragging)
 *     onDrop:  function (item, zone) { return { ok: true }; }, // decide correct / incorrect; ok => snap into place
 *     onSelect: function (item) {},           // item clicked (not dragged)
 *     onResult: function (item, zone, result) {}              // after feedback animation (placed or rejected)
 *   });
 *   dd.destroy();  dd.clearSelection();
 *
 * Keyboard: items and zones are focusable. Enter/Space on an item picks it up, Enter/Space on a zone drops it, Esc cancels.
 * Tapping/clicking an item then a zone does the same, which is also the easiest path on touch screens.
 */
(function (VE) {
  'use strict';

  function create(opts) {
    var root = opts.root, itemSel = opts.itemSelector, zoneSel = opts.zoneSelector;
    var accepts = opts.accepts || function () { return true; };
    var drag = null, selected = null, enabled = true;

    function zonesFor(item) { return Array.prototype.filter.call(root.querySelectorAll(zoneSel), function (z) { return accepts(item, z); }); }
    function closestZone(x, y) {
      var els = document.elementsFromPoint(x, y);
      for (var i = 0; i < els.length; i++) { var z = els[i].closest && els[i].closest(zoneSel); if (z && root.contains(z)) return z; }
      return null;
    }
    function markCandidates(item, on) {
      zonesFor(item).forEach(function (z) { z.classList.toggle('drop-valid', on); if (!on) z.classList.remove('drop-over'); });
      root.classList.toggle('is-dragging', on);
    }
    function center(node) {
      var r = node.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }

    function makeGhost(item, x, y) {
      var r = item.getBoundingClientRect();
      var g = item.cloneNode(true);
      g.removeAttribute('id'); g.removeAttribute('data-drag'); g.removeAttribute('tabindex');
      g.classList.add('drag-ghost');
      g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
      g.style.left = (x - r.width / 2) + 'px'; g.style.top = (y - r.height / 2) + 'px';
      document.body.appendChild(g);
      return g;
    }
    function moveGhost(g, x, y) { g.style.left = (x - g.offsetWidth / 2) + 'px'; g.style.top = (y - g.offsetHeight / 2) + 'px'; }

    function flyTo(g, x, y, scale, done) {
      g.classList.add('ghost-fly');
      g.style.left = (x - g.offsetWidth / 2) + 'px'; g.style.top = (y - g.offsetHeight / 2) + 'px';
      g.style.transform = 'scale(' + scale + ')';
      var finished = false;
      function end() { if (finished) return; finished = true; g.remove(); done && done(); }
      g.addEventListener('transitionend', end); setTimeout(end, 320);
    }

    /** Resolve a drop (from pointer or keyboard) and run feedback. */
    function attempt(item, zone, fromGhost) {
      if (!zone || !accepts(item, zone)) {
        reject(item, null, fromGhost);
        return;
      }
      var result = opts.onDrop(item, zone) || { ok: false };
      if (result.ok) {
        var c = center(zone);
        zone.classList.add('flash-ok'); setTimeout(function () { zone.classList.remove('flash-ok'); }, 700);
        var finish = function () { opts.onResult && opts.onResult(item, zone, result); };
        if (fromGhost) flyTo(fromGhost, c.x, c.y, 0.7, finish); else finish();
      } else {
        reject(item, zone, fromGhost, result);
      }
    }
    function reject(item, zone, ghost, result) {
      if (zone) { zone.classList.add('flash-bad'); setTimeout(function () { zone.classList.remove('flash-bad'); }, 700); }
      item.classList.add('shake'); setTimeout(function () { item.classList.remove('shake'); }, 500);
      var finish = function () { opts.onResult && opts.onResult(item, zone, result || { ok: false }); };
      if (ghost) { var c = center(item); flyTo(ghost, c.x, c.y, 1, finish); } else finish();
    }

    // -------- pointer drag
    function onDown(e) {
      if (!enabled || (e.button != null && e.button > 0)) return;
      var item = e.target.closest(itemSel);
      if (!item || !root.contains(item) || item.classList.contains('is-placed')) return;
      drag = { item: item, id: e.pointerId, sx: e.clientX, sy: e.clientY, ghost: null, over: null };
      try { item.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.ghost) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
        clearSelection();
        drag.ghost = makeGhost(drag.item, e.clientX, e.clientY);
        drag.item.classList.add('is-dragging');
        markCandidates(drag.item, true);
      }
      e.preventDefault();
      moveGhost(drag.ghost, e.clientX, e.clientY);
      var z = closestZone(e.clientX, e.clientY);
      if (z !== drag.over) {
        if (drag.over) drag.over.classList.remove('drop-over');
        if (z && accepts(drag.item, z)) z.classList.add('drop-over');
        drag.over = z;
      }
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      try { d.item.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!d.ghost) return; // it was a click; click handler runs next
      d.item.classList.remove('is-dragging');
      markCandidates(d.item, false);
      var z = closestZone(e.clientX, e.clientY);
      d.suppressClick = true;
      suppressNextClick = true; setTimeout(function () { suppressNextClick = false; }, 0);
      attempt(d.item, z, d.ghost);
    }
    function onCancel(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.ghost) { drag.ghost.remove(); drag.item.classList.remove('is-dragging'); markCandidates(drag.item, false); }
      drag = null;
    }

    // -------- click / keyboard select-then-place
    var suppressNextClick = false;
    function select(item) {
      clearSelection();
      selected = item;
      item.classList.add('is-selected'); item.setAttribute('aria-pressed', 'true');
      markCandidates(item, true);
      VE.UI.announce(VE.I18n.t('pickUp'));
    }
    function clearSelection() {
      if (!selected) return;
      selected.classList.remove('is-selected'); selected.setAttribute('aria-pressed', 'false');
      markCandidates(selected, false);
      selected = null;
    }
    function onClick(e) {
      if (!enabled || suppressNextClick) return;
      var zone = e.target.closest(zoneSel), item = e.target.closest(itemSel);
      if (item && root.contains(item) && !item.classList.contains('is-placed')) {
        if (selected === item) { clearSelection(); return; }
        select(item);
        opts.onSelect && opts.onSelect(item);
        return;
      }
      if (zone && root.contains(zone) && selected) {
        var it = selected; clearSelection();
        attempt(it, zone, null);
      }
    }
    function onKey(e) {
      if (!enabled) return;
      if (e.key === 'Escape') { clearSelection(); return; }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target;
      if (t.matches && (t.matches(itemSel) || t.matches(zoneSel))) { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
    }

    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);

    return {
      clearSelection: clearSelection,
      setEnabled: function (v) { enabled = v; if (!v) clearSelection(); },
      selected: function () { return selected; },
      destroy: function () {
        clearSelection();
        root.removeEventListener('pointerdown', onDown); root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerup', onUp); root.removeEventListener('pointercancel', onCancel);
        root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey);
      }
    };
  }

  VE.DragDrop = { create: create };
})(window.VE = window.VE || {});
