import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════════════
   Injected CSS keyframes (once)
   ═══════════════════════════════════════════════════════════════════════════ */

const STYLE_ID = 'contatti-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
        @keyframes pondRippleExpand {
            from { transform: translate(-50%,-50%) scale(0); opacity: 0.22; }
            to   { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
        @keyframes causticShift {
            0%   { background-position: 0% 0%; }
            50%  { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
        }
        @keyframes cardBreathe {
            0%, 100% { box-shadow: 0 0 20px rgba(100,60,200,0); }
            50%      { box-shadow: 0 0 35px rgba(100,60,200,0.10); }
        }
    `;
    document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Config
   ═══════════════════════════════════════════════════════════════════════════ */

// Ripple
const RIPPLE_SPEED = 220;
const RIPPLE_LIFE = 3200;
const RING_COUNT = 3;
const RING_GAP = 40;
const MAX_RIPPLES = 3;

// Element perturbation
const PERTURB_MAX_DIST = 700;
const PERTURB_Y = 3;
const PERTURB_ROT = 0.6;

// Floating orbs
const ORBS = [
    { size: 380, color: 'rgba(90,50,180,0.06)', x: '12%', y: '18%', dx: 50, dy: 35, dur: 9 },
    { size: 300, color: 'rgba(40,90,200,0.05)', x: '72%', y: '55%', dx: -40, dy: 45, dur: 11 },
    { size: 260, color: 'rgba(70,30,160,0.05)', x: '45%', y: '78%', dx: 35, dy: -25, dur: 10 },
];

// Pond physics
const BOAT_RADIUS = 22;
const BOAT_ICON_SIZE = 22;
const BOAT_CIRCLE = 44;
const BOAT_FRICTION = 0.97;
const BOAT_DRIFT_F = 0.02;
const BOUNCE_DAMP = 0.3;
const WAVE_PUSH_F = 15;
const POND_PADDING = 10;

/* ═══════════════════════════════════════════════════════════════════════════
   SVG Icons
   ═══════════════════════════════════════════════════════════════════════════ */

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

const LinkedInIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.83v2.18h.05C12.6 8.85 14.28 7.8 16.6 7.8 21.36 7.8 22 10.88 22 14.9V24h-4v-8.06c0-1.92-.04-4.4-2.68-4.4-2.68 0-3.09 2.1-3.09 4.26V24H8V8z" transform="scale(0.9) translate(1.5,1)" />
    </svg>
);

const BehanceIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.8 11.3c.65-.42 1.08-1.08 1.08-2.03 0-1.96-1.48-2.77-3.3-2.77H1v10.5h4.83c1.96 0 3.5-1.12 3.5-3.18 0-1.2-.62-2.15-1.53-2.52zM3.3 8.4h1.83c.78 0 1.44.3 1.44 1.18 0 .82-.5 1.22-1.28 1.22H3.3V8.4zm2.02 7.2H3.3v-2.82h2.1c.9 0 1.52.45 1.52 1.44 0 .97-.68 1.38-1.6 1.38zm9.14-5.52c-2.78 0-4.46 1.78-4.46 4.5 0 2.82 1.58 4.56 4.46 4.56 2.18 0 3.58-1.02 4.14-3.12h-2.14c-.18.7-.9 1.18-1.92 1.18-1.38 0-2.18-.82-2.24-2.22h6.4c.12-2.82-1.3-4.9-4.24-4.9zm-2.14 3.5c.14-1.12.9-1.82 2.08-1.82 1.12 0 1.82.72 1.9 1.82h-3.98zM14 6.5h4.6V5h-4.6v1.5z" transform="scale(0.95) translate(1,1.5)" />
    </svg>
);

const SOCIALS = [
    { label: 'Instagram', href: '#', Icon: InstagramIcon, color: 'rgba(225,48,108,0.7)' },
    { label: 'LinkedIn', href: '#', Icon: LinkedInIcon, color: 'rgba(10,102,194,0.7)' },
    { label: 'Behance', href: '#', Icon: BehanceIcon, color: 'rgba(5,62,255,0.7)' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   AnimatedLink — underline that slides in from left on hover (#9)
   ═══════════════════════════════════════════════════════════════════════════ */

const AnimatedLink: React.FC<{
    href: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}> = ({ href, children, style }) => {
    const lineRef = useRef<HTMLDivElement>(null);
    return (
        <a
            href={href}
            style={{ ...style, display: 'inline-block', textDecoration: 'none', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', zIndex: 10 }}
            onMouseEnter={() => lineRef.current && gsap.to(lineRef.current, { scaleX: 1, duration: 0.35, ease: 'power2.out' })}
            onMouseLeave={() => lineRef.current && gsap.to(lineRef.current, { scaleX: 0, duration: 0.3, ease: 'power2.in' })}
        >
            {children}
            <div
                ref={lineRef}
                style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    transformOrigin: 'left',
                    transform: 'scaleX(0)',
                }}
            />
        </a>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface Ripple { x: number; y: number; birth: number; }
interface Boat { x: number; y: number; vx: number; vy: number; rot: number; vRot: number; }
interface PondVisualRipple { id: number; x: number; y: number; }

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export const Contatti: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const titleLine1Ref = useRef<HTMLSpanElement>(null);
    const titleLine2Ref = useRef<HTMLSpanElement>(null);
    const infoRowsRef = useRef<HTMLDivElement[]>([]);
    const calCardRef = useRef<HTMLDivElement>(null);
    const calCardInnerRef = useRef<HTMLDivElement>(null);
    const calGlowRef = useRef<HTMLDivElement>(null);
    const orbRefs = useRef<HTMLDivElement[]>([]);
    const ripplesRef = useRef<Ripple[]>([]);
    const rafRef = useRef<number>(0);
    const perturbableRef = useRef<HTMLElement[]>([]);

    // Pond
    const pondRef = useRef<HTMLDivElement>(null);
    const boatElsRef = useRef<HTMLDivElement[]>([]);
    const boatsRef = useRef<Boat[]>([]);
    const pondRafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const pondRipplesRef = useRef<Ripple[]>([]);
    const boatsEnteredRef = useRef(false);
    const pondRippleIdRef = useRef(0);

    const [isMobile, setIsMobile] = useState(false);
    const [pondVisualRipples, setPondVisualRipples] = useState<PondVisualRipple[]>([]);

    /* ── Responsive ──────────────────────────────────────────────────────── */
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
        onChange(mq);
        mq.addEventListener('change', onChange as (e: MediaQueryListEvent) => void);
        return () => mq.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void);
    }, []);

    /* ── Collect perturbable elements ────────────────────────────────────── */
    useEffect(() => {
        const els: HTMLElement[] = [];
        if (titleLine1Ref.current) els.push(titleLine1Ref.current);
        if (titleLine2Ref.current) els.push(titleLine2Ref.current);
        infoRowsRef.current.forEach((el) => el && els.push(el));
        if (calCardRef.current) els.push(calCardRef.current);
        perturbableRef.current = els;
    });

    /* ── Initialize boats (hidden for entrance) ──────────────────────────── */
    useEffect(() => {
        const pond = pondRef.current;
        if (!pond) return;
        const rect = pond.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        const positions = [
            { x: w * 0.2, y: h * 0.35 },
            { x: w * 0.5, y: h * 0.6 },
            { x: w * 0.75, y: h * 0.4 },
        ];

        boatsRef.current = positions.map((p) => ({
            x: p.x, y: p.y,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            rot: Math.random() * 6 - 3,
            vRot: (Math.random() - 0.5) * 0.1,
        }));

        // Start hidden for staggered entrance (#5)
        boatElsRef.current.forEach((el, i) => {
            if (!el || !boatsRef.current[i]) return;
            const b = boatsRef.current[i];
            el.style.opacity = '0';
            el.style.transform = `translate(${b.x - BOAT_CIRCLE / 2}px, ${b.y - BOAT_CIRCLE / 2}px) scale(0.5) rotate(${b.rot}deg)`;
        });

        boatsEnteredRef.current = false;
    }, [isMobile]);

    /* ── Pond physics loop ───────────────────────────────────────────────── */
    useEffect(() => {
        const pond = pondRef.current;
        if (!pond) return;
        lastTimeRef.current = performance.now();

        const tick = () => {
            const now = performance.now();
            const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
            lastTimeRef.current = now;

            const rect = pond.getBoundingClientRect();
            const W = rect.width;
            const H = rect.height;
            const boats = boatsRef.current;
            if (boats.length === 0) { pondRafRef.current = requestAnimationFrame(tick); return; }

            // Ripple wave push
            const pRipples = pondRipplesRef.current;
            pRipples.forEach((rip) => {
                const elapsed = now - rip.birth;
                const waveR = (elapsed / 1000) * RIPPLE_SPEED;
                const t = elapsed / RIPPLE_LIFE;
                if (t > 1) return;
                const strength = (1 - t) * WAVE_PUSH_F;
                boats.forEach((b) => {
                    const dx = b.x - rip.x;
                    const dy = b.y - rip.y;
                    const dist = Math.hypot(dx, dy);
                    if (Math.abs(dist - waveR) < 50 && dist > 1) {
                        const pushScale = strength * dt * (1 - Math.abs(dist - waveR) / 50);
                        b.vx += (dx / dist) * pushScale;
                        b.vy += (dy / dist) * pushScale;
                        b.vRot += (Math.random() - 0.5) * pushScale * 0.3;
                    }
                });
            });
            pondRipplesRef.current = pRipples.filter((r) => now - r.birth < RIPPLE_LIFE);

            // Random drift
            boats.forEach((b) => {
                b.vx += (Math.random() - 0.5) * BOAT_DRIFT_F * dt;
                b.vy += (Math.random() - 0.5) * BOAT_DRIFT_F * dt;
            });

            // Move + friction
            boats.forEach((b) => {
                b.x += b.vx; b.y += b.vy; b.rot += b.vRot;
                b.vx *= BOAT_FRICTION; b.vy *= BOAT_FRICTION; b.vRot *= 0.96;
            });

            // Wall collisions (bounce, no spin)
            boats.forEach((b) => {
                const min = BOAT_RADIUS + POND_PADDING;
                const maxX = W - BOAT_RADIUS - POND_PADDING;
                const maxY = H - BOAT_RADIUS - POND_PADDING;
                if (b.x < min) { b.x = min; b.vx = Math.abs(b.vx) * BOUNCE_DAMP; }
                if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * BOUNCE_DAMP; }
                if (b.y < min) { b.y = min; b.vy = Math.abs(b.vy) * BOUNCE_DAMP; }
                if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * BOUNCE_DAMP; }
            });

            // Boat-to-boat collisions
            for (let i = 0; i < boats.length; i++) {
                for (let j = i + 1; j < boats.length; j++) {
                    const a = boats[i]; const b = boats[j];
                    const dx = b.x - a.x; const dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = BOAT_RADIUS * 2;
                    if (dist < minDist && dist > 0.01) {
                        const overlap = (minDist - dist) / 2;
                        const nx = dx / dist; const ny = dy / dist;
                        a.x -= nx * overlap; a.y -= ny * overlap;
                        b.x += nx * overlap; b.y += ny * overlap;
                        const dvx = a.vx - b.vx; const dvy = a.vy - b.vy;
                        const dot = dvx * nx + dvy * ny;
                        if (dot > 0) {
                            a.vx -= dot * nx * BOUNCE_DAMP; a.vy -= dot * ny * BOUNCE_DAMP;
                            b.vx += dot * nx * BOUNCE_DAMP; b.vy += dot * ny * BOUNCE_DAMP;
                            a.vRot += (Math.random() - 0.5) * 0.4;
                            b.vRot += (Math.random() - 0.5) * 0.4;
                        }
                    }
                }
            }

            // Sync DOM
            boatElsRef.current.forEach((el, i) => {
                if (!el || !boats[i]) return;
                const b = boats[i];
                const currentOpacity = el.style.opacity;
                el.style.transform = `translate(${b.x - BOAT_CIRCLE / 2}px, ${b.y - BOAT_CIRCLE / 2}px) rotate(${b.rot.toFixed(1)}deg)`;
                // Keep opacity as set by entrance animation
                if (currentOpacity !== '' && currentOpacity !== '1' && !boatsEnteredRef.current) {
                    el.style.opacity = currentOpacity;
                }
            });

            pondRafRef.current = requestAnimationFrame(tick);
        };

        pondRafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(pondRafRef.current);
    }, [isMobile]);

    /* ── Create visual ripple in pond (#1) ───────────────────────────────── */
    const spawnPondRipple = useCallback((localX: number, localY: number) => {
        const id = ++pondRippleIdRef.current;
        setPondVisualRipples((prev) => [...prev.slice(-4), { id, x: localX, y: localY }]);
    }, []);

    const removePondRipple = useCallback((id: number) => {
        setPondVisualRipples((prev) => prev.filter((r) => r.id !== id));
    }, []);

    /* ── Canvas sizing ───────────────────────────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        const section = sectionRef.current;
        if (!canvas || !section) return;
        const resize = () => {
            const rect = section.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    /* ── Ripple render loop ──────────────────────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const now = performance.now();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.width / dpr;
            ctx.clearRect(0, 0, w, canvas.height / dpr);

            ripplesRef.current = ripplesRef.current.filter((r) => now - r.birth < RIPPLE_LIFE);
            ripplesRef.current.forEach((ripple) => {
                const elapsed = now - ripple.birth;
                const t = elapsed / RIPPLE_LIFE;
                const baseRadius = (elapsed / 1000) * RIPPLE_SPEED;
                for (let i = 0; i < RING_COUNT; i++) {
                    const radius = baseRadius - i * RING_GAP;
                    if (radius < 0) continue;
                    const ringNorm = Math.min(radius / 500, 1);
                    const alpha = (1 - ringNorm) * (1 - t) * 0.07;
                    if (alpha <= 0.001) continue;
                    ctx.beginPath();
                    ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                    ctx.lineWidth = Math.max(0.3, 1.0 * (1 - ringNorm));
                    ctx.stroke();
                }
            });
            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    /* ── Perturb elements + feed pond ────────────────────────────────────── */
    const perturbElements = useCallback(
        (clickX: number, clickY: number) => {
            const section = sectionRef.current;
            if (!section) return;
            const sectionRect = section.getBoundingClientRect();

            perturbableRef.current.forEach((el) => {
                const elRect = el.getBoundingClientRect();
                const elCX = elRect.left + elRect.width / 2 - sectionRect.left;
                const elCY = elRect.top + elRect.height / 2 - sectionRect.top;
                const dist = Math.hypot(elCX - clickX, elCY - clickY);
                if (dist > PERTURB_MAX_DIST) return;

                const intensity = 1 - dist / PERTURB_MAX_DIST;
                const delay = dist / RIPPLE_SPEED;
                const yShift = intensity * PERTURB_Y;
                const rot = intensity * PERTURB_ROT * (Math.random() > 0.5 ? 1 : -1);
                const dirY = elCY > clickY ? 1 : -1;

                gsap.killTweensOf(el, 'y,rotation');
                gsap.timeline({ delay })
                    .to(el, { y: yShift * dirY, rotation: rot, duration: 0.5, ease: 'sine.out' })
                    .to(el, { y: 0, rotation: 0, duration: 1.8, ease: 'power3.out' });
            });

            // Nudge orbs
            orbRefs.current.filter(Boolean).forEach((orb) => {
                const orbRect = orb.getBoundingClientRect();
                const orbCX = orbRect.left + orbRect.width / 2 - sectionRect.left;
                const orbCY = orbRect.top + orbRect.height / 2 - sectionRect.top;
                const dist = Math.hypot(orbCX - clickX, orbCY - clickY);
                const intensity = Math.max(0, 1 - dist / 1200);
                if (intensity <= 0) return;
                const delay = dist / RIPPLE_SPEED;
                const dx = (orbCX - clickX) / dist * intensity * 12;
                const dy = (orbCY - clickY) / dist * intensity * 12;
                gsap.to(orb, {
                    x: `+=${dx}`, y: `+=${dy}`, duration: 0.8, delay, ease: 'power2.out',
                    onComplete: () => { gsap.to(orb, { x: `-=${dx}`, y: `-=${dy}`, duration: 2, ease: 'sine.inOut' }); },
                });
            });

            // Feed ripple to pond (physics + visual)
            const pond = pondRef.current;
            if (pond) {
                const pondRect = pond.getBoundingClientRect();
                const localX = clickX - (pondRect.left - sectionRect.left);
                const localY = clickY - (pondRect.top - sectionRect.top);
                pondRipplesRef.current.push({ x: localX, y: localY, birth: performance.now() });
                // Spawn visual ripple only if click is reasonably close to pond
                if (localX > -200 && localX < pondRect.width + 200 && localY > -200 && localY < pondRect.height + 200) {
                    spawnPondRipple(localX, localY);
                }
            }
        },
        [spawnPondRipple],
    );

    /* ── Click/tap handler ───────────────────────────────────────────────── */
    const handleInteraction = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            const section = sectionRef.current;
            if (!section) return;
            const rect = section.getBoundingClientRect();
            let clientX: number, clientY: number;
            if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
            else { clientX = e.clientX; clientY = e.clientY; }

            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const ripples = ripplesRef.current;
            if (ripples.length >= MAX_RIPPLES) ripples.shift();
            ripples.push({ x, y, birth: performance.now() });
            perturbElements(x, y);
        },
        [perturbElements],
    );

    /* ── Pond direct click → local visual ripple (#1) ────────────────────── */
    const handlePondClick = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            const pond = pondRef.current;
            if (!pond) return;
            e.stopPropagation();

            const rect = pond.getBoundingClientRect();
            let clientX: number, clientY: number;
            if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
            else { clientX = e.clientX; clientY = e.clientY; }

            const localX = clientX - rect.left;
            const localY = clientY - rect.top;

            // Visual ripple in pond
            spawnPondRipple(localX, localY);

            // Physics push
            pondRipplesRef.current.push({ x: localX, y: localY, birth: performance.now() });

            // Also trigger section-level ripple
            const section = sectionRef.current;
            if (section) {
                const sRect = section.getBoundingClientRect();
                const sx = clientX - sRect.left;
                const sy = clientY - sRect.top;
                const ripples = ripplesRef.current;
                if (ripples.length >= MAX_RIPPLES) ripples.shift();
                ripples.push({ x: sx, y: sy, birth: performance.now() });
                perturbElements(sx, sy);
            }
        },
        [spawnPondRipple, perturbElements],
    );

    /* ── 3D Tilt + Spotlight (desktop) ───────────────────────────────────── */
    const handleCardMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isMobile) return;
            const inner = calCardInnerRef.current;
            if (!inner) return;
            const rect = inner.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            inner.style.transform = `perspective(800px) rotateX(${(y - 0.5) * -24}deg) rotateY(${(x - 0.5) * 24}deg)`;
            const spot = inner.querySelector<HTMLDivElement>('[data-spotlight]');
            if (spot) {
                spot.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.10), transparent 60%)`;
                spot.style.opacity = '1';
            }
        },
        [isMobile],
    );

    const handleCardMouseLeave = useCallback(() => {
        const inner = calCardInnerRef.current;
        if (!inner) return;
        gsap.to(inner, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power2.out', clearProps: 'transform' });
        const spot = inner.querySelector<HTMLDivElement>('[data-spotlight]');
        if (spot) gsap.to(spot, { opacity: 0, duration: 0.4 });
    }, []);

    /* ── Cal.com card mobile tap glow (#4) ───────────────────────────────── */
    const handleCardTap = useCallback(() => {
        if (!isMobile) return;
        const glow = calGlowRef.current;
        if (!glow) return;
        gsap.killTweensOf(glow);
        gsap.fromTo(glow,
            { scale: 0.7, opacity: 0.4 },
            { scale: 1.5, opacity: 0, duration: 0.8, ease: 'power2.out' },
        );
    }, [isMobile]);

    /* ── GSAP scroll animations + orbs + entrance ────────────────────────── */
    useEffect(() => {
        const section = sectionRef.current;
        const calCard = calCardRef.current;
        const calInner = calCardInnerRef.current;
        const line1 = titleLine1Ref.current;
        const line2 = titleLine2Ref.current;
        const infoRows = infoRowsRef.current.filter(Boolean);
        const orbs = orbRefs.current.filter(Boolean);
        const boatEls = boatElsRef.current.filter(Boolean);
        if (!section || !calCard) return;

        const ctx = gsap.context(() => {
            // Section clip-path reveal
            gsap.fromTo(section, { clipPath: 'inset(100% 0 0 0)' }, {
                clipPath: 'inset(0% 0 0 0)', ease: 'none',
                scrollTrigger: { trigger: section, start: 'top 95%', end: 'top 40%', scrub: 1, refreshPriority: -3 },
            });

            // Title per-line reveal (#6)
            [line1, line2].forEach((line, i) => {
                if (!line) return;
                gsap.fromTo(line, { opacity: 0, y: 35 }, {
                    opacity: 1, y: 0, duration: 1, ease: 'power2.out',
                    scrollTrigger: {
                        trigger: line,
                        start: `top ${88 - i * 5}%`,
                        end: `top ${60 - i * 5}%`,
                        scrub: 1,
                        refreshPriority: -3,
                    },
                });
            });

            // Info rows staggered
            infoRows.forEach((row, i) => {
                gsap.fromTo(row, { opacity: 0, y: 30 }, {
                    opacity: 1, y: 0, duration: 1, ease: 'power2.out',
                    scrollTrigger: { trigger: row, start: `top ${85 - i * 2}%`, end: `top ${55 - i * 2}%`, scrub: 1, refreshPriority: -3 },
                });
            });

            // Boat entrance with splash (#5)
            if (boatEls.length > 0) {
                ScrollTrigger.create({
                    trigger: pondRef.current,
                    start: 'top 85%',
                    once: true,
                    refreshPriority: -3,
                    onEnter: () => {
                        boatEls.forEach((el, i) => {
                            gsap.to(el, {
                                opacity: 1,
                                scale: 1,
                                duration: 0.6,
                                delay: i * 0.15,
                                ease: 'back.out(1.4)',
                                onStart: () => {
                                    // Splash ripple at boat position
                                    const b = boatsRef.current[i];
                                    if (b) spawnPondRipple(b.x, b.y);
                                },
                            });
                        });
                        setTimeout(() => { boatsEnteredRef.current = true; }, 800);
                    },
                });
            }

            // Card scale-in
            gsap.fromTo(calCard, { opacity: 0, scale: 0.92 }, {
                opacity: 1, scale: 1, duration: 1, ease: 'power2.out',
                scrollTrigger: { trigger: calCard, start: 'top 85%', end: 'top 55%', scrub: 1, refreshPriority: -3 },
            });

            // Card breathing glow (#3)
            if (calInner) {
                gsap.fromTo(calInner,
                    { boxShadow: '0 0 20px rgba(100,60,200,0)' },
                    { boxShadow: '0 0 35px rgba(100,60,200,0.10)', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' },
                );
            }

            // Floating orbs
            orbs.forEach((orb, i) => {
                const cfg = ORBS[i];
                if (!cfg) return;
                gsap.to(orb, { x: `+=${cfg.dx}`, y: `+=${cfg.dy}`, duration: cfg.dur, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            });
        }, section);

        return () => ctx.revert();
    }, [isMobile, spawnPondRipple]);

    /* ── Styles ──────────────────────────────────────────────────────────── */
    const labelStyle: React.CSSProperties = {
        color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600,
        letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px',
    };

    const valueStyle: React.CSSProperties = {
        color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
        fontWeight: 400, margin: 0,
    };

    /* ── Render ───────────────────────────────────────────────────────────── */
    return (
        <div
            ref={sectionRef}
            onClick={handleInteraction}
            onTouchStart={handleInteraction}
            style={{
                position: 'relative', backgroundColor: '#000',
                padding: 'clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)',
                overflow: 'hidden', clipPath: 'inset(100% 0 0 0)',
                cursor: 'default', userSelect: 'none',
            }}
        >
            {/* ── Ripple canvas ──────────────────────────────────────────── */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

            {/* ── Floating Orbs ──────────────────────────────────────────── */}
            {ORBS.map((orb, i) => (
                <div key={i} ref={(el) => { if (el) orbRefs.current[i] = el; }}
                    style={{
                        position: 'absolute', left: orb.x, top: orb.y,
                        width: orb.size, height: orb.size, borderRadius: '50%',
                        background: orb.color, filter: 'blur(80px)',
                        pointerEvents: 'none', willChange: 'transform',
                    }}
                />
            ))}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 'clamp(48px, 8vw, 80px)', position: 'relative', zIndex: 2 }}>
                <p style={{
                    color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 600,
                    letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px',
                }}>
                    CONTATTI
                </p>
                {/* Title with per-line reveal (#6) */}
                <h2 style={{
                    color: '#fff', fontSize: 'clamp(2.2rem, 7vw, 5rem)', fontWeight: 800,
                    letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 20px',
                }}>
                    <span ref={titleLine1Ref} style={{ display: 'block', willChange: 'transform, opacity' }}>
                        Parliamo del
                    </span>
                    <span ref={titleLine2Ref} style={{ display: 'block', willChange: 'transform, opacity' }}>
                        tuo progetto.
                    </span>
                </h2>
                <div style={{ width: 30, height: 2, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? 48 : 'clamp(40px, 6vw, 80px)',
                alignItems: 'start', position: 'relative', zIndex: 2,
            }}>
                {/* ── Left: Contact Info ──────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Email with animated underline (#9) */}
                    <div ref={(el) => { if (el) infoRowsRef.current[0] = el; }} style={{ willChange: 'transform' }}>
                        <p style={labelStyle}>Email</p>
                        <AnimatedLink href="mailto:widestudiodigitale@gmail.com" style={valueStyle}>
                            widestudiodigitale@gmail.com
                        </AnimatedLink>
                    </div>
                    {/* Telefono with animated underline (#9) */}
                    <div ref={(el) => { if (el) infoRowsRef.current[1] = el; }} style={{ willChange: 'transform' }}>
                        <p style={labelStyle}>Telefono</p>
                        <AnimatedLink href="tel:+393271562265" style={valueStyle}>
                            +39 327 156 2265
                        </AnimatedLink>
                    </div>

                    {/* ── Social Pond ─────────────────────────────────────── */}
                    <div ref={(el) => { if (el) infoRowsRef.current[2] = el; }} style={{ willChange: 'transform' }}>
                        <p style={labelStyle}>Social</p>
                        <div
                            ref={pondRef}
                            onClick={handlePondClick}
                            onTouchStart={handlePondClick}
                            style={{
                                position: 'relative', width: '100%',
                                height: isMobile ? 120 : 140,
                                borderRadius: '28px 20px 24px 18px / 20px 26px 18px 24px', // organic shape (#8)
                                border: '1px solid rgba(255,255,255,0.06)',
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* SVG filter for liquid distortion */}
                            <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                                <defs>
                                    <filter id="pond-liquid">
                                        <feTurbulence type="fractalNoise" baseFrequency="0.015 0.02" numOctaves={2} seed={3} result="noise">
                                            <animate attributeName="baseFrequency" values="0.015 0.02;0.018 0.025;0.015 0.02" dur="8s" repeatCount="indefinite" />
                                        </feTurbulence>
                                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={6} xChannelSelector="R" yChannelSelector="G" />
                                    </filter>
                                </defs>
                            </svg>

                            {/* Water surface */}
                            <div style={{
                                position: 'absolute', inset: -4,
                                background: `
                                    radial-gradient(ellipse at 25% 35%, rgba(80,60,180,0.06), transparent 55%),
                                    radial-gradient(ellipse at 75% 65%, rgba(30,70,200,0.05), transparent 55%),
                                    radial-gradient(ellipse at 50% 50%, rgba(60,40,160,0.03), transparent 70%)
                                `,
                                filter: 'url(#pond-liquid)', pointerEvents: 'none',
                            }} />

                            {/* Visual pond ripples (#1) */}
                            {pondVisualRipples.map((r) => (
                                <div
                                    key={r.id}
                                    onAnimationEnd={() => removePondRipple(r.id)}
                                    style={{
                                        position: 'absolute',
                                        left: r.x, top: r.y,
                                        width: 120, height: 120,
                                        borderRadius: '50%',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        pointerEvents: 'none',
                                        animation: 'pondRippleExpand 1s ease-out forwards',
                                    }}
                                />
                            ))}

                            {/* Boat icons in circles with caustics (#7) and labels (#2) */}
                            {SOCIALS.map((social, i) => (
                                <div
                                    key={social.label}
                                    ref={(el) => { if (el) boatElsRef.current[i] = el; }}
                                    style={{
                                        position: 'absolute', top: 0, left: 0,
                                        width: BOAT_CIRCLE, height: BOAT_CIRCLE,
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.10)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: social.color,
                                        willChange: 'transform',
                                        cursor: 'pointer', pointerEvents: 'auto',
                                        transition: 'color 0.3s, border-color 0.3s, background-color 0.3s',
                                        opacity: 0,
                                    }}
                                    onClick={(e) => { e.stopPropagation(); window.open(social.href, '_blank', 'noopener,noreferrer'); }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = social.color.replace('0.7', '1');
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                                        const label = e.currentTarget.querySelector<HTMLDivElement>('[data-label]');
                                        if (label) label.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = social.color;
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                                        const label = e.currentTarget.querySelector<HTMLDivElement>('[data-label]');
                                        if (label) label.style.opacity = '0';
                                    }}
                                    title={social.label}
                                >
                                    {/* Caustic light overlay (#7) */}
                                    <div style={{
                                        position: 'absolute', inset: 0, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
                                        backgroundSize: '200% 200%',
                                        animation: 'causticShift 5s ease-in-out infinite',
                                        pointerEvents: 'none', mixBlendMode: 'overlay',
                                    }} />

                                    <social.Icon size={BOAT_ICON_SIZE} />

                                    {/* Floating label (#2) */}
                                    <div
                                        data-label
                                        style={{
                                            position: 'absolute',
                                            top: -28,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            backgroundColor: 'rgba(0,0,0,0.75)',
                                            color: 'rgba(255,255,255,0.85)',
                                            fontSize: '0.6rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            whiteSpace: 'nowrap',
                                            opacity: 0,
                                            transition: 'opacity 0.25s ease',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {social.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Cal.com Card ─────────────────────────────────── */}
                <div
                    ref={calCardRef}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={handleCardTap}
                    style={{ perspective: '800px', willChange: 'transform' }}
                >
                    <div style={{
                        position: 'relative', borderRadius: 17, padding: 1,
                        background: 'linear-gradient(135deg, rgba(100,60,200,0.25), rgba(40,80,200,0.15), rgba(100,60,200,0.25))',
                    }}>
                        {/* Mobile tap glow (#4) */}
                        <div
                            ref={calGlowRef}
                            style={{
                                position: 'absolute', inset: -20, borderRadius: 30,
                                background: 'radial-gradient(circle, rgba(100,60,200,0.20), transparent 60%)',
                                opacity: 0, pointerEvents: 'none', willChange: 'transform, opacity',
                            }}
                        />
                        <div
                            ref={calCardInnerRef}
                            style={{
                                position: 'relative',
                                backgroundColor: 'rgba(8,8,14,0.96)',
                                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                                borderRadius: 16,
                                padding: isMobile ? 'clamp(28px, 6vw, 40px)' : 'clamp(36px, 4vw, 56px)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                                minHeight: isMobile ? 220 : 300,
                                willChange: isMobile ? 'auto' : 'transform',
                            }}
                        >
                            <div data-spotlight style={{
                                position: 'absolute', inset: 0, borderRadius: 16,
                                opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s',
                            }} />

                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 24,
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>

                            <h3 style={{
                                color: '#fff', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                                fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px',
                            }}>
                                Prenota una call
                            </h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
                                fontWeight: 300, lineHeight: 1.6, margin: 0, maxWidth: 320,
                            }}>
                                Scegli data e orario per una consulenza gratuita
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contatti;
