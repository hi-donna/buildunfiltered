"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  learnNodes, learnEdges, learnStart, ancestors, positions, getNode,
  RING_RADII, LEVELS, LEVEL_LABEL, SIZE, CENTRE,
} from "@/lib/learn";

// The blueprint plate. Positions and ancestor sets come precomputed from
// lib/learn.ts; this component holds one hover id, one selected id and a
// viewBox. Clicking a node opens that node's <dialog> (rendered by
// LearnDialogs): with show() inside the drawer on wide screens, with
// showModal() as a sheet on phones. The URL hash mirrors the open dialog.
// Mouse: wheel zooms, drag pans. Touch: one finger pans, two fingers pinch.

const PAD = 40;
const INIT = { x: -PAD, y: -PAD, w: SIZE + 2 * PAD, h: SIZE + 2 * PAD };
const MIN_W = INIT.w / 3; // 3× in
const MAX_W = INIT.w * 2; // 0.5× out
const NARROW = "(max-width: 640px)";
// Wide screens get a taller plate: the viewBox keeps the map's scale and adds
// vertical room above and below the rings (see .learn-map svg aspect-ratio).
const WIDE_ASPECT = 1.12;
// Where each ring's handwritten name sits (degrees, 0 = east, clockwise): a
// gap in that ring's node angles so it never overlaps a label.
const RING_LABEL_ANGLE: Record<string, number> = { foundations: 275, core: 255, applied: 205, frontier: 125 };
// Each handwritten ring name sits a little differently: tilt (degrees) and
// tracking, so the four do not read as one typeset row.
const RING_LABEL_TILT: Record<string, number> = { foundations: -4, core: 3, applied: -6, frontier: 4 };
const WIDE = "(min-width: 900px)";

type Box = typeof INIT;
type Pt = { x: number; y: number };

// Phones start zoomed in on the centre so labels are legible; pan to the rest.
function homeBox(): Box {
  if (typeof window !== "undefined" && window.matchMedia(NARROW).matches) {
    const w = INIT.w / 1.4;
    return { x: CENTRE - w / 2, y: CENTRE - w / 2, w, h: w };
  }
  if (typeof window !== "undefined" && window.matchMedia(WIDE).matches) {
    const h = INIT.w * WIDE_ASPECT;
    return { x: INIT.x, y: CENTRE - h / 2, w: INIT.w, h };
  }
  return INIT;
}

// Inner rings: label points outward along the radius. Outer rings: label sits
// above or below the dot so long titles stay inside the canvas.
function labelFor(p: Pt, outer: boolean) {
  const t = Math.atan2(p.y - CENTRE, p.x - CENTRE);
  const c = Math.cos(t), s = Math.sin(t);
  if (outer || Math.abs(c) <= 0.3) return { dx: 0, dy: s > 0 ? 24 : -15, anchor: "middle" as const };
  if (c > 0) return { dx: 13, dy: 5, anchor: "start" as const };
  return { dx: -13, dy: 5, anchor: "end" as const };
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const isDialogId = (id: string) => id === "method" || !!getNode(id);

export default function LearnMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [wide, setWide] = useState(true);
  const [vb, setVb] = useState<Box>(INIT);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const pts = useRef(new Map<number, Pt>());
  const pinch = useRef<{ d: number; mid: Pt; vb: Box } | null>(null);
  const moved = useRef(false);
  const reopening = useRef(false);

  const active = hover ?? (selected && getNode(selected) ? selected : null);
  const lit = useMemo(() => {
    if (!active) return null;
    const s = new Set(ancestors.get(active));
    s.add(active);
    return s;
  }, [active]);

  const select = useCallback((id: string | null) => {
    setSelected(id);
    // Hash only ever holds a known dialog id; never read back into the DOM.
    history.replaceState(null, "", id ? `#${id}` : location.pathname + location.search);
  }, []);

  // Hash → selection, on load, on back/forward, and on the prereq links
  // inside a dialog.
  useEffect(() => {
    const read = () => {
      const id = location.hash.slice(1);
      setSelected(isDialogId(id) ? id : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  // Drawer (wide) or sheet (narrow). Tracked so a resize re-opens the dialog
  // the right way.
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Selection → the one open dialog, in the mode the viewport wants.
  useEffect(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog.learn-dialog"));
    const want = selected ? document.getElementById(`dialog-${selected}`) as HTMLDialogElement | null : null;
    reopening.current = true;
    for (const d of dialogs) if (d.open) d.close();
    if (want) {
      // show() focuses the first control and the browser scrolls it into
      // view, which would push "Learning Map" under the sticky header. Put
      // the scroll position back in the same task, before any paint, then
      // move focus without scrolling. The drawer is sticky, so it is in view.
      const sx = window.scrollX, sy = window.scrollY;
      if (wide) want.show(); else want.showModal();
      window.scrollTo(sx, sy);
      want.scrollTop = 0;
      (want.querySelector<HTMLElement>(".learn-close") ?? want).focus({ preventScroll: true });
    }
    // The observer below sees the attribute flip in a microtask; clear the
    // flag after it has had the chance to run.
    const t = setTimeout(() => { reopening.current = false; }, 0);
    return () => clearTimeout(t);
  }, [selected, wide]);

  // Closing a dialog by any route (Esc, ×, backdrop) clears the selection.
  // Watches the `open` attribute rather than the `close` event: it covers
  // every route and does not depend on event timing.
  useEffect(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog.learn-dialog"));
    const mo = new MutationObserver((records) => {
      if (reopening.current) return;
      for (const r of records) {
        const d = r.target as HTMLDialogElement;
        if (d.open) continue;
        if (location.hash.slice(1) === d.id.replace(/^dialog-/, "")) select(null);
      }
    });
    const onClick = (e: MouseEvent) => {
      // The inner wrapper fills the dialog, so a click whose target is the
      // dialog itself is a click on the backdrop (modal mode only).
      const d = e.currentTarget as HTMLDialogElement;
      if (e.target === d && d.matches(":modal")) d.close();
    };
    for (const d of dialogs) { mo.observe(d, { attributes: true, attributeFilter: ["open"] }); d.addEventListener("click", onClick); }
    return () => { mo.disconnect(); for (const d of dialogs) d.removeEventListener("click", onClick); };
  }, [select]);

  // Esc closes the drawer. (Modal sheets close on Esc natively.)
  useEffect(() => {
    if (!selected || !wide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") select(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, wide, select]);

  // Start view depends on viewport width; set after mount so SSR matches.
  useEffect(() => { setVb(homeBox()); }, []);

  // Wheel = zoom about the cursor. Registered by hand so preventDefault works
  // (React's onWheel is passive).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      setVb((v) => {
        const w = Math.min(MAX_W, Math.max(MIN_W, v.w * Math.exp(e.deltaY * 0.0015)));
        const k = w / v.w;
        const px = v.x + ((e.clientX - rect.left) / rect.width) * v.w;
        const py = v.y + ((e.clientY - rect.top) / rect.height) * v.h;
        return { x: px - (px - v.x) * k, y: py - (py - v.y) * k, w, h: v.h * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // One pointer = pan. Two pointers = pinch zoom about the midpoint. Pointer
  // capture starts only once a drag starts; capturing on pointerdown would
  // retarget pointerup to the svg and swallow clicks on node links.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) {
      e.currentTarget.setPointerCapture(e.pointerId);
      const [a, b] = Array.from(pts.current.values());
      pinch.current = { d: dist(a, b), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, vb };
      drag.current = null;
      moved.current = true;
      return;
    }
    drag.current = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pts.current.has(e.pointerId)) pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();
    const p = pinch.current;
    if (p && pts.current.size === 2) {
      const [a, b] = Array.from(pts.current.values());
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const w = Math.min(MAX_W, Math.max(MIN_W, (p.vb.w * p.d) / Math.max(dist(a, b), 1)));
      const k = w / p.vb.w;
      const px = p.vb.x + ((p.mid.x - rect.left) / rect.width) * p.vb.w;
      const py = p.vb.y + ((p.mid.y - rect.top) / rect.height) * p.vb.h;
      const h = w * (p.vb.h / p.vb.w);
      setVb({
        x: px - (px - p.vb.x) * k - ((mid.x - p.mid.x) * w) / rect.width,
        y: py - (py - p.vb.y) * k - ((mid.y - p.mid.y) * h) / rect.height,
        w, h,
      });
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!moved.current && Math.abs(dx) + Math.abs(dy) > 3) {
      moved.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!moved.current) return;
    setVb((v) => ({ ...v, x: d.vx - (dx * v.w) / rect.width, y: d.vy - (dy * v.h) / rect.height }));
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  const sp = positions.get(learnStart)!;

  return (
    <div className="learn-map" data-active={active ? "true" : undefined}>
      <span className="learn-corner learn-corner-tl" aria-hidden="true" />
      <span className="learn-corner learn-corner-tr" aria-hidden="true" />
      <span className="learn-corner learn-corner-bl" aria-hidden="true" />
      <span className="learn-corner learn-corner-br" aria-hidden="true" />

      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        aria-label={`Prerequisite map of ${learnNodes.length} concepts. Hover or focus a node to light what it depends on; open it to read.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setVb(homeBox())}
      >
        <defs>
          {/* Graphite wobble for the ring guides only; nodes and edges stay crisp. */}
          <filter id="learn-pencil" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Chalk: roughen the edge a touch and knock grain out of the fill, so
              handwritten marks read as dry marker on a plate, not smooth vector.
              Also referenced from CSS by the header aside. */}
          <filter id="learn-chalk" x="-10%" y="-25%" width="120%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="3" result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.7 -0.2" result="mask" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feComposite in="rough" in2="mask" operator="in" />
          </filter>
        </defs>

        <rect className="learn-ground" x={-9000} y={-9000} width={18000} height={18000} />

        <g className="learn-rings" aria-hidden="true" filter="url(#learn-pencil)">
          {LEVELS.map((l) => <circle key={l} cx={CENTRE} cy={CENTRE} r={RING_RADII[l]} />)}
        </g>
        <g className="learn-ring-labels" aria-hidden="true" filter="url(#learn-chalk)">
          {LEVELS.map((l) => {
            const t = (RING_LABEL_ANGLE[l] * Math.PI) / 180, r = RING_RADII[l] + 14;
            const x = CENTRE + r * Math.cos(t), y = CENTRE + r * Math.sin(t) + 6;
            return (
              <text key={l} x={x} y={y} textAnchor="middle" transform={`rotate(${RING_LABEL_TILT[l]} ${x} ${y})`}>{LEVEL_LABEL[l]}</text>
            );
          })}
        </g>

        <g className="learn-edges" aria-hidden="true">
          {learnEdges.map((e) => {
            const a = positions.get(e.from)!, b = positions.get(e.to)!;
            const on = !!lit && lit.has(e.from) && lit.has(e.to);
            const cls = on ? "lit" : lit ? "dim" : undefined;
            return <line key={`${e.from}-${e.to}`} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>

        {/* START HERE: handwritten annotation with a drawn arrow to the start node. */}
        <g className="learn-start-note" aria-hidden="true" filter="url(#learn-chalk)">
          <text x={sp.x + 26} y={sp.y - 34} transform={`rotate(-7 ${sp.x + 26} ${sp.y - 34})`}>Start here</text>
          <path d={`M ${sp.x + 30} ${sp.y - 28} C ${sp.x + 18} ${sp.y - 26}, ${sp.x + 12} ${sp.y - 20}, ${sp.x + 8} ${sp.y - 11}`}
            fill="none" strokeLinecap="round" />
          <path d={`M ${sp.x + 3} ${sp.y - 17} L ${sp.x + 8} ${sp.y - 10} L ${sp.x + 15} ${sp.y - 14}`}
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g className="learn-nodes">
          {learnNodes.map((n) => {
            const p = positions.get(n.id)!;
            const on = !!lit && lit.has(n.id);
            const cls = ["learn-node", on && "lit", lit && !on && "dim", n.id === selected && "selected"].filter(Boolean).join(" ");
            const lb = labelFor(p, n.level === "applied" || n.level === "frontier");
            return (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={cls}
                aria-label={`${n.title}, ${LEVEL_LABEL[n.level].toLowerCase()}`}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(n.id); }}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                onClick={(e) => { e.preventDefault(); if (!moved.current) select(n.id); }}
              >
                {n.id === learnStart && <circle className="learn-start" cx={p.x} cy={p.y} r={12} />}
                <circle className="learn-hit" cx={p.x} cy={p.y} r={18} />
                <circle className="learn-dot" cx={p.x} cy={p.y} r={6} />
                <text className="learn-label" x={p.x + lb.dx} y={p.y + lb.dy} textAnchor={lb.anchor}>{n.title}</text>
              </a>
            );
          })}
        </g>
      </svg>

      <div className="learn-controls">
        <span className="learn-hint learn-hint-mouse">scroll to zoom · drag to pan · click a node</span>
        <span className="learn-hint learn-hint-touch">pinch to zoom · drag to pan · tap a node</span>
        <button type="button" onClick={() => setVb(homeBox())}>reset view</button>
      </div>

      <div className="learn-plate" aria-hidden="true">
        <div className="learn-plate-cell">
          <span>build.unfiltered</span>
          <span>Learning Map v1.0</span>
        </div>
        <div className="learn-plate-cell learn-plate-row2">
          <span>{learnNodes.length} nodes · prereq order</span>
        </div>
        <div className="learn-plate-mark">BU</div>
      </div>
    </div>
  );
}
