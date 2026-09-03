"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  learnNodes, learnEdges, learnStart, ancestors, prereqs, positions, getNode,
  RING_RADII, LEVELS, LEVEL_LABEL, SIZE, CENTRE, type LearnNode,
} from "@/lib/learn";
import { ResourceList } from "@/components/LearnList";

// The constellation. Positions and ancestor sets come precomputed from
// lib/learn.ts; this component holds one hover id, one selected id and a
// viewBox. Hover toggles classes from a precomputed set and nothing else.
// Shown at ≥ 900px only (CSS); below that the list is the page.

const PAD = 40;
const INIT = { x: -PAD, y: -PAD, w: SIZE + 2 * PAD, h: SIZE + 2 * PAD };
const MIN_W = INIT.w / 3; // 3× in
const MAX_W = INIT.w * 2; // 0.5× out

type Box = typeof INIT;

// Inner rings: label points outward along the radius. Outer rings: label sits
// above or below the dot so long titles stay inside the canvas.
function labelFor(p: { x: number; y: number }, outer: boolean) {
  const t = Math.atan2(p.y - CENTRE, p.x - CENTRE);
  const c = Math.cos(t), s = Math.sin(t);
  if (outer || Math.abs(c) <= 0.3) return { dx: 0, dy: s > 0 ? 22 : -13, anchor: "middle" as const };
  if (c > 0) return { dx: 11, dy: 5, anchor: "start" as const };
  return { dx: -11, dy: 5, anchor: "end" as const };
}

export default function LearnMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [vb, setVb] = useState<Box>(INIT);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const moved = useRef(false);

  const active = hover ?? selected;
  const lit = useMemo(() => {
    if (!active) return null;
    const s = new Set(ancestors.get(active));
    s.add(active);
    return s;
  }, [active]);

  const select = useCallback((id: string | null) => {
    setSelected(id);
    // Hash only ever holds a known node id; never read back into the DOM.
    history.replaceState(null, "", id ? `#${id}` : location.pathname + location.search);
  }, []);

  // Hash → selection, on load and on back/forward.
  useEffect(() => {
    const read = () => {
      const id = location.hash.slice(1);
      setSelected(getNode(id) ? id : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  // Map hidden (narrow viewport): open the matching list row instead.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!getNode(id) || !window.matchMedia("(max-width: 899px)").matches) return;
    const row = document.getElementById(`list-${id}`) as HTMLDetailsElement | null;
    if (row) { row.open = true; row.scrollIntoView(); }
  }, []);

  // Esc closes the panel.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") select(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

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

  // Drag = pan.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
    setVb((v) => ({ ...v, x: d.vx - (dx * v.w) / rect.width, y: d.vy - (dy * v.h) / rect.height }));
  };
  const onPointerUp = () => { drag.current = null; };

  const sel = selected ? getNode(selected) : null;
  const needs = sel ? (prereqs.get(sel.id) ?? []).map(getNode).filter((n): n is LearnNode => !!n) : [];

  return (
    <div className="learn-stage">
      <div className="learn-map">
        <div className="learn-controls">
          <span className="learn-hint">scroll to zoom · drag to pan · click a node</span>
          <button type="button" onClick={() => setVb(INIT)}>reset view</button>
        </div>
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          aria-label={`Prerequisite map of ${learnNodes.length} concepts. Hover or focus a node to light what it depends on.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => setVb(INIT)}
        >
          <rect className="learn-ground" x={-9000} y={-9000} width={18000} height={18000}
            onClick={() => { if (!moved.current) select(null); }} />

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
                  onPointerEnter={() => setHover(n.id)}
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

      <aside className="learn-panel" aria-live="polite">
        {sel ? (
          <>
            <div className="learn-panel-head">
              <p className="eyebrow">{LEVEL_LABEL[sel.level]}</p>
              <button type="button" className="learn-close" onClick={() => select(null)} aria-label="Close panel">×</button>
            </div>
            <h2>{sel.title}</h2>
            <p className="learn-explain">{sel.explain}</p>
            <p className="learn-needs">
              <span>{needs.length ? "Needs first:" : "Start here."}</span>
              {needs.map((n) => (
                <button type="button" key={n.id} onClick={() => select(n.id)}>{n.title}</button>
              ))}
            </p>
            <ResourceList node={sel} />
            {sel.the_catch && (
              <div className="catch-block">
                <p className="catch-label">The catch</p>
                <p>{sel.the_catch}</p>
              </div>
            )}
            <p className="learn-stamp">Verified {sel.resources[0].last_verified}</p>
          </>
        ) : (
          <div className="learn-panel-empty">
            <p className="eyebrow">The map</p>
            <p>Hover a node to light everything it depends on, back to tokens. Click it to read what it is and what to finish.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
