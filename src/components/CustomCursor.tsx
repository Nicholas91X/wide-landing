import React, { useRef, useEffect, useState } from 'react';

// Rilevamento pointer coarse (touch) — una sola volta al caricamento
const IS_TOUCH = typeof window !== 'undefined'
  ? window.matchMedia('(pointer: coarse)').matches
  : false;

export const CustomCursor: React.FC = () => {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const target   = useRef({ x: -200, y: -200 });
  const current  = useRef({ x: -200, y: -200 });
  const rafId    = useRef(0);
  const [isRing, setIsRing] = useState(false);

  useEffect(() => {
    if (IS_TOUCH) return;

    // Idle detection: stop the RAF after ~500ms of no mouse movement
    // (30 frames at 60fps with position converged). Restarts on next mousemove.
    const LERP = 0.15;
    const IDLE_FRAMES = 30;   // frames to wait after convergence before stopping
    const EPSILON     = 0.08; // px — "close enough" threshold
    let idleCount = 0;
    let ticking = false;

    const tickRef = { fn: () => {} };

    tickRef.fn = () => {
      const cx = current.current.x + (target.current.x - current.current.x) * LERP;
      const cy = current.current.y + (target.current.y - current.current.y) * LERP;
      current.current.x = cx;
      current.current.y = cy;

      const t = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      if (dotRef.current)  dotRef.current.style.transform  = t;
      if (ringRef.current) ringRef.current.style.transform = t;

      // Check convergence
      if (
        Math.abs(target.current.x - cx) < EPSILON &&
        Math.abs(target.current.y - cy) < EPSILON
      ) {
        idleCount++;
        if (idleCount >= IDLE_FRAMES) {
          // Cursor has been still long enough — stop the loop
          ticking = false;
          rafId.current = 0;
          return; // don't reschedule
        }
      } else {
        idleCount = 0;
      }

      rafId.current = requestAnimationFrame(tickRef.fn);
    };

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      idleCount = 0;
      // Restart loop if it went idle
      if (!ticking) {
        ticking = true;
        rafId.current = requestAnimationFrame(tickRef.fn);
      }
    };

    const onOver = (e: MouseEvent) => {
      setIsRing(!!(e.target as HTMLElement).closest('[data-cursor="ring"]'));
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    // Kick off initial loop (cursor starts at -200,-200 until first mousemove)
    ticking = true;
    rafId.current = requestAnimationFrame(tickRef.fn);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (IS_TOUCH) return null;

  return (
    <>
      {/* Dot — segue il mouse con lerp */}
      <div
        ref={dotRef}
        aria-hidden={true}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          pointerEvents: 'none',
          zIndex: 99999,
        }}
      />
      {/* Ring — appare su [data-cursor="ring"] */}
      <div
        ref={ringRef}
        aria-hidden={true}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: isRing ? 32 : 0,
          height: isRing ? 32 : 0,
          borderRadius: '50%',
          border: isRing ? '1px solid rgba(197,165,90,0.65)' : 'none',
          background: isRing ? 'rgba(197,165,90,0.05)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 99998,
          transition: 'width 0.22s ease, height 0.22s ease, border 0.22s ease, background 0.22s ease',
        }}
      />
    </>
  );
};
