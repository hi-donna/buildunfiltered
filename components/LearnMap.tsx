"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  learnNodes, learnEdges, learnStart, ancestors, positions, getNode,
  RING_RADII, LEVELS, LEVEL_LABEL, SIZE, CENTRE,
} from "@/lib/learn";

// The constellation is the page. Positions and ancestor sets come precomputed
// from lib/learn.ts; this component holds one hover id, one selected id and a
// viewBox. Clicking a node opens that node's <dialog> (rendered by
// LearnDialogs); the URL hash mirrors the open dialog. Mouse: wheel zooms,
// drag pans. Touch: one finger pans, two fingers pinch-zoom, tap opens.

const PAD = 40;
const INIT = { x: -PAD, y: -PAD, w: SIZE + 2 * PAD, h: SIZE + 2 * PAD };
const MIN_W = INIT.w / 3; // 3× in
const MAX_W = INIT.w * 2; // 0.5× out
const NARROW = "(max-width: 640px)";

type Box = typeof INIT;
type Pt = { x: number; y: number };

// Phones start zoomed in on the centre so labels are legible; pan to the rest.
function homeBox(): Box {
  if (typeof window !== "undefined" && window.matchMedia(NARROW).matches) {
    const w = INIT.w / 1.6;
    return { x: CENTRE - w / 2, y: CENTRE - w / 2, w, h: w };
  }
  return INIT;
}

// Inner rings: label points outward along the radius. Outer rings: label sits
// above or below the dot so long titles stay inside the canvas.
function labelFor(p: Pt, outer: boolean) {
  const t = Math.atan2(p.y - CENTRE, p.x - CENTRE);
  const c = Math.cos(t), s = Math.sin(t);
  if (outer || Math.abs(c) <= 0.3) return { dx: 0, dy: s > 0 ? 22 : -13, anchor: "middle" as const };
  if (c > 0) return { dx: 11, dy: 5, anchor: "start" as const };
  return { dx: -11, dy: 5, anchor: "end" as const };
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const isDialogId = (id: string) => id === "method" || !!getNode(id);

export default function LearnMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [vb, setVb] = useState<Box>(INIT);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const pts = useRef(new Map<number, Pt>());
  const pinch = useRef<{ d: number; mid: Pt; vb: Box } | null>(null);
  const moved = useRef(false);

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

  // Hash → selection, on load and on back/forward and on the prereq links
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

  // Selection → the one open dialog. Closing a dialog by any route (Esc, ×,
  // backdrop) clears the selection unless the hash has already moved on.
  useEffect(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog.learn-dialog"));
    const want = selected ? document.getElementById(`dialog-${selected}`) as HTMLDialogElement | null : null;
    for (const d of dialogs) if (d !== want && d.open) d.close();
    if (want && !want.open) want.showModal();
  }, [selected]);

  useEffect(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog.learn-dialog"));
    // Watch the `open` attribute rather than the `close` event: it covers Esc,
    // the × button and the backdrop alike, and does not depend on event timing.
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        const d = r.target as HTMLDialogElement;
        if (d.open) continue;
        if (location.hash.slice(1) === d.id.replace(/^dialog-/, "")) select(null);
      }
    });
    const onClick = (e: MouseEvent) => {
      // The inner wrapper fills the dialog, so a click whose target is the
      // dialog itself is a click on the backdrop.
      const d = e.currentTarget as HTMLDialogElement;
      if (e.target === d) d.close();
    };
    for (const d of dialogs) { mo.observe(d, { attributes: true, attributeFilter: ["open"] }); d.addEventListener("click", onClick); }
    return () => { mo.disconnect(); for (const d of dialogs) d.removeEventListener("click", onClick); };
  }, [select]);

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

  // One pointer = pan. Two pointers = pinch zoom about the midpoint.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Capture only once a drag starts (see onPointerMove): capturing here
    // would retarget pointerup to the svg and swallow clicks on node links.
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
      setVb({
        x: px - (px - p.vb.x) * k - ((mid.x - p.mid.x) * w) / rect.width,
        y: py - (py - p.vb.y) * k - ((mid.y - p.mid.y) * w) / rect.height,
        w, h: w,
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

  return (
    <div className="learn-map">
      <div className="learn-controls">
        <span className="learn-hint learn-hint-mouse">scroll to zoom · drag to pan · click a node</span>
        <span className="learn-hint learn-hint-touch">pinch to zoom · drag to pan · tap a node</span>
        <button type="button" onClick={() => setVb(homeBox())}>reset view</button>
      </div>
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
        <rect className="learn-ground" x={-9000} y={-9000} width={18000} height={18000} />

        <g className="learn-rings" aria-hidden="true">
          {LEVELS.map((l) => (
            <g key={l}>
              <circle cx={CENTRE} cy={CENTRE} r={RING_RADII[l]} />
              <text x={CENTRE} y={CENTRE - RING_RADII[l] - 8} textAnchor="middle">{LEVEL_LABEL[l].toUpperCase()}</text>
            </g>
          ))}
        </g>

        <g className="learn-edges" aria-hidden="true">
          {learnEdges.map((e) => {
            const a = positions.get(e.from)!, b = positions.get(e.to)!;
            const on = !!lit && lit.has(e.from) && lit.has(e.to);
            const cls = on ? "lit" : lit ? "dim" : undefined;
            return <line key={`${e.from}-${e.to}`} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
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
                {n.id === learnStart && (
                  <>
                    <circle className="learn-start" cx={p.x} cy={p.y} r={10} />
                    <text className="learn-start-label" x={p.x} y={p.y - 18} textAnchor="middle">START HERE</text>
                  </>
                )}
                <circle className="learn-hit" cx={p.x} cy={p.y} r={16} />
                <circle className="learn-dot" cx={p.x} cy={p.y} r={5} />
                <text className="learn-label" x={p.x + lb.dx} y={p.y + lb.dy} textAnchor={lb.anchor}>{n.title}</text>
              </a>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
