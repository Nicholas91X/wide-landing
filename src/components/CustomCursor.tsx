import { useRef, useEffect, useState } from 'react';

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

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      setIsRing(!!(e.target as HTMLElement).closest('[data-cursor="ring"]'));
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    const LERP = 0.15;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;

      const x = current.current.x;
      const y = current.current.y;
      const t = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

      if (dotRef.current)  dotRef.current.style.transform  = t;
      if (ringRef.current) ringRef.current.style.transform = t;

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

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
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      />
      {/* Ring — appare su [data-cursor="ring"] */}
      <div
        ref={ringRef}
        aria-hidden
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
          willChange: 'transform',
          transition: 'width 0.22s ease, height 0.22s ease, border 0.22s ease, background 0.22s ease',
        }}
      />
    </>
  );
};

export default CustomCursor;
