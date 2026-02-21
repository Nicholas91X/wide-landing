import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════════════
   Config
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Social SVG Icons ─────────────────────────────────────────────────────── */

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

const LinkedInIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.83v2.18h.05C12.6 8.85 14.28 7.8 16.6 7.8 21.36 7.8 22 10.88 22 14.9V24h-4v-8.06c0-1.92-.04-4.4-2.68-4.4-2.68 0-3.09 2.1-3.09 4.26V24H8V8z" transform="scale(0.9) translate(1.5,1)" />
    </svg>
);

const BehanceIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.8 11.3c.65-.42 1.08-1.08 1.08-2.03 0-1.96-1.48-2.77-3.3-2.77H1v10.5h4.83c1.96 0 3.5-1.12 3.5-3.18 0-1.2-.62-2.15-1.53-2.52zM3.3 8.4h1.83c.78 0 1.44.3 1.44 1.18 0 .82-.5 1.22-1.28 1.22H3.3V8.4zm2.02 7.2H3.3v-2.82h2.1c.9 0 1.52.45 1.52 1.44 0 .97-.68 1.38-1.6 1.38zm9.14-5.52c-2.78 0-4.46 1.78-4.46 4.5 0 2.82 1.58 4.56 4.46 4.56 2.18 0 3.58-1.02 4.14-3.12h-2.14c-.18.7-.9 1.18-1.92 1.18-1.38 0-2.18-.82-2.24-2.22h6.4c.12-2.82-1.3-4.9-4.24-4.9zm-2.14 3.5c.14-1.12.9-1.82 2.08-1.82 1.12 0 1.82.72 1.9 1.82h-3.98zM14 6.5h4.6V5h-4.6v1.5z" transform="scale(0.95) translate(1,1.5)" />
    </svg>
);

const SOCIALS = [
    { label: 'Instagram', href: '#', Icon: InstagramIcon, glowColor: 'rgba(225,48,108,0.25)' },
    { label: 'LinkedIn', href: '#', Icon: LinkedInIcon, glowColor: 'rgba(10,102,194,0.25)' },
    { label: 'Behance', href: '#', Icon: BehanceIcon, glowColor: 'rgba(5,62,255,0.25)' },
];

// Ripple physics
const RIPPLE_SPEED = 220;       // px/sec – slower, more gentle
const RIPPLE_LIFE  = 3200;      // ms    – longer fade for softness
const RING_COUNT   = 3;         // fewer rings, cleaner look
const RING_GAP     = 40;        // px between rings – more spaced
const MAX_RIPPLES  = 3;         // less visual clutter

// Element perturbation
const PERTURB_MAX_DIST = 700;   // px – beyond this, no effect
const PERTURB_Y        = 3;     // px max vertical shift (very subtle)
const PERTURB_ROT      = 0.6;   // deg max rotation (barely noticeable)

// Floating orbs (ambient depth)
const ORBS = [
    { size: 380, color: 'rgba(90,50,180,0.06)',  x: '12%', y: '18%', dx: 50,  dy: 35, dur: 9  },
    { size: 300, color: 'rgba(40,90,200,0.05)',   x: '72%', y: '55%', dx: -40, dy: 45, dur: 11 },
    { size: 260, color: 'rgba(70,30,160,0.05)',   x: '45%', y: '78%', dx: 35,  dy: -25, dur: 10 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Ripple type
   ═══════════════════════════════════════════════════════════════════════════ */

interface Ripple {
    x: number;
    y: number;
    birth: number; // performance.now()
}

/* ═══════════════════════════════════════════════════════════════════════════
   SocialCard – glass pill with glow-pulse on tap
   ═══════════════════════════════════════════════════════════════════════════ */

const SocialCard: React.FC<{
    social: (typeof SOCIALS)[number];
    index: number;
    siblings: React.RefObject<(HTMLAnchorElement | null)[]>;
}> = ({ social, index, siblings }) => {
    const cardRef = useRef<HTMLAnchorElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    const handleTap = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation(); // don't trigger section ripple
            const card = cardRef.current;
            const glow = glowRef.current;
            if (!card || !glow) return;

            // Soft glow pulse
            gsap.killTweensOf(glow);
            gsap.fromTo(
                glow,
                { scale: 0.6, opacity: 0.5 },
                { scale: 1.8, opacity: 0, duration: 0.9, ease: 'power2.out' },
            );

            // Gentle card breathe
            gsap.killTweensOf(card, 'scale');
            gsap.timeline()
                .to(card, { scale: 1.04, duration: 0.2, ease: 'power2.out' })
                .to(card, { scale: 1, duration: 0.6, ease: 'sine.out' });

            // Sympathetic pulse on siblings
            const allCards = siblings.current;
            if (!allCards) return;
            allCards.forEach((sib, i) => {
                if (i === index || !sib) return;
                gsap.killTweensOf(sib, 'scale');
                gsap.timeline({ delay: 0.08 * Math.abs(i - index) })
                    .to(sib, { scale: 1.015, duration: 0.25, ease: 'sine.out' })
                    .to(sib, { scale: 1, duration: 0.5, ease: 'sine.inOut' });
            });
        },
        [index, siblings],
    );

    return (
        <a
            ref={(el) => {
                (cardRef as React.MutableRefObject<HTMLAnchorElement | null>).current = el;
                if (siblings.current) siblings.current[index] = el;
            }}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleTap}
            onTouchStart={handleTap}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                textDecoration: 'none',
                color: 'rgba(255,255,255,0.7)',
                transition: 'background-color 0.3s, border-color 0.3s, color 0.3s',
                overflow: 'hidden',
                willChange: 'transform',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
        >
            {/* Glow pulse layer */}
            <div
                ref={glowRef}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    background: `radial-gradient(circle, ${social.glowColor}, transparent 70%)`,
                    transform: 'translate(-50%,-50%) scale(0.6)',
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            />

            {/* Icon */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <social.Icon size={20} />
            </div>

            {/* Label */}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.01em' }}>
                {social.label}
            </span>

            {/* Arrow */}
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: 'auto', opacity: 0.4 }}
            >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
            </svg>
        </a>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export const Contatti: React.FC = () => {
    const sectionRef      = useRef<HTMLDivElement>(null);
    const canvasRef       = useRef<HTMLCanvasElement>(null);
    const titleRef        = useRef<HTMLHeadingElement>(null);
    const infoRowsRef     = useRef<HTMLDivElement[]>([]);
    const calCardRef      = useRef<HTMLDivElement>(null);
    const calCardInnerRef = useRef<HTMLDivElement>(null);
    const orbRefs         = useRef<HTMLDivElement[]>([]);
    const ripplesRef      = useRef<Ripple[]>([]);
    const rafRef          = useRef<number>(0);
    const perturbableRef  = useRef<HTMLElement[]>([]);

    const socialCardsRef  = useRef<(HTMLAnchorElement | null)[]>([]);

    const [isMobile, setIsMobile] = useState(false);

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
        if (titleRef.current) els.push(titleRef.current);
        infoRowsRef.current.forEach((el) => el && els.push(el));
        if (calCardRef.current) els.push(calCardRef.current);
        perturbableRef.current = els;
    });

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
            const w = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
            const h = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
            ctx.clearRect(0, 0, w, h);

            // Prune dead ripples
            ripplesRef.current = ripplesRef.current.filter(
                (r) => now - r.birth < RIPPLE_LIFE,
            );

            ripplesRef.current.forEach((ripple) => {
                const elapsed = now - ripple.birth;
                const t = elapsed / RIPPLE_LIFE; // 0→1
                const baseRadius = (elapsed / 1000) * RIPPLE_SPEED;

                for (let i = 0; i < RING_COUNT; i++) {
                    const radius = baseRadius - i * RING_GAP;
                    if (radius < 0) continue;

                    // Very soft fade
                    const ringNorm = Math.min(radius / 500, 1);
                    const alpha = (1 - ringNorm) * (1 - t) * 0.07;
                    if (alpha <= 0.001) continue;

                    // Thin, delicate lines
                    const lw = Math.max(0.3, 1.0 * (1 - ringNorm));

                    ctx.beginPath();
                    ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                    ctx.lineWidth = lw;
                    ctx.stroke();
                }
            });

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    /* ── Perturb elements when wave reaches them ─────────────────────────── */
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
                const delay = dist / RIPPLE_SPEED; // seconds until wave arrives
                const yShift = intensity * PERTURB_Y;
                const rot = intensity * PERTURB_ROT * (Math.random() > 0.5 ? 1 : -1);

                // Determine vertical direction: push away from click
                const dirY = elCY > clickY ? 1 : -1;

                gsap.killTweensOf(el, 'y,rotation');
                gsap.timeline({ delay })
                    .to(el, {
                        y: yShift * dirY,
                        rotation: rot,
                        duration: 0.5,
                        ease: 'sine.out',
                    })
                    .to(el, {
                        y: 0,
                        rotation: 0,
                        duration: 1.8,
                        ease: 'power3.out',
                    });
            });

            // Also gently nudge the orbs
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
                    x: `+=${dx}`,
                    y: `+=${dy}`,
                    duration: 0.8,
                    delay,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.to(orb, { x: `-=${dx}`, y: `-=${dy}`, duration: 2, ease: 'sine.inOut' });
                    },
                });
            });
        },
        [],
    );

    /* ── Click/tap handler ───────────────────────────────────────────────── */
    const handleInteraction = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            const section = sectionRef.current;
            if (!section) return;

            const rect = section.getBoundingClientRect();
            let clientX: number, clientY: number;

            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // Add ripple (cap for performance)
            const ripples = ripplesRef.current;
            if (ripples.length >= MAX_RIPPLES) ripples.shift();
            ripples.push({ x, y, birth: performance.now() });

            perturbElements(x, y);
        },
        [perturbElements],
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
            const rotateY = (x - 0.5) * 24;
            const rotateX = (y - 0.5) * -24;

            inner.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

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

    /* ── GSAP scroll animations + orbs ───────────────────────────────────── */
    useEffect(() => {
        const section = sectionRef.current;
        const calCard = calCardRef.current;
        const infoRows = infoRowsRef.current.filter(Boolean);
        const orbs = orbRefs.current.filter(Boolean);
        if (!section || !calCard) return;

        const ctx = gsap.context(() => {
            // Section clip-path reveal
            gsap.fromTo(
                section,
                { clipPath: 'inset(100% 0 0 0)' },
                {
                    clipPath: 'inset(0% 0 0 0)',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 95%',
                        end: 'top 40%',
                        scrub: 1,
                        refreshPriority: -3,
                    },
                },
            );

            // Info rows staggered
            infoRows.forEach((row, i) => {
                gsap.fromTo(
                    row,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: row,
                            start: `top ${85 - i * 2}%`,
                            end: `top ${55 - i * 2}%`,
                            scrub: 1,
                            refreshPriority: -3,
                        },
                    },
                );
            });

            // Card scale-in
            gsap.fromTo(
                calCard,
                { opacity: 0, scale: 0.92 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: calCard,
                        start: 'top 85%',
                        end: 'top 55%',
                        scrub: 1,
                        refreshPriority: -3,
                    },
                },
            );

            // Floating orbs
            orbs.forEach((orb, i) => {
                const cfg = ORBS[i];
                if (!cfg) return;
                gsap.to(orb, {
                    x: `+=${cfg.dx}`,
                    y: `+=${cfg.dy}`,
                    duration: cfg.dur,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                });
            });
        }, section);

        return () => ctx.revert();
    }, [isMobile]);

    /* ── Styles ──────────────────────────────────────────────────────────── */
    const labelStyle: React.CSSProperties = {
        color: 'rgba(255,255,255,0.35)',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        margin: '0 0 8px',
    };

    const valueStyle: React.CSSProperties = {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
        fontWeight: 400,
        margin: 0,
        textDecoration: 'none',
    };

    /* ── Render ───────────────────────────────────────────────────────────── */
    return (
        <div
            ref={sectionRef}
            onClick={handleInteraction}
            onTouchStart={handleInteraction}
            style={{
                position: 'relative',
                backgroundColor: '#000',
                padding: 'clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)',
                overflow: 'hidden',
                clipPath: 'inset(100% 0 0 0)',
                cursor: 'default',
                userSelect: 'none',
            }}
        >
            {/* ── Ripple canvas ──────────────────────────────────────────── */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />

            {/* ── Floating Orbs ──────────────────────────────────────────── */}
            {ORBS.map((orb, i) => (
                <div
                    key={i}
                    ref={(el) => { if (el) orbRefs.current[i] = el; }}
                    style={{
                        position: 'absolute',
                        left: orb.x,
                        top: orb.y,
                        width: orb.size,
                        height: orb.size,
                        borderRadius: '50%',
                        background: orb.color,
                        filter: 'blur(80px)',
                        pointerEvents: 'none',
                        willChange: 'transform',
                    }}
                />
            ))}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 'clamp(48px, 8vw, 80px)', position: 'relative', zIndex: 2 }}>
                <p
                    style={{
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        margin: '0 0 16px',
                    }}
                >
                    CONTATTI
                </p>
                <h2
                    ref={titleRef}
                    style={{
                        color: '#fff',
                        fontSize: 'clamp(2.2rem, 7vw, 5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.05,
                        margin: '0 0 20px',
                        willChange: 'transform',
                    }}
                >
                    Parliamo del
                    <br />
                    tuo progetto.
                </h2>
                <div
                    style={{
                        width: 30,
                        height: 2,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                    }}
                />
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: isMobile ? 48 : 'clamp(40px, 6vw, 80px)',
                    alignItems: 'start',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                {/* ── Left: Contact Info ──────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div ref={(el) => { if (el) infoRowsRef.current[0] = el; }} style={{ willChange: 'transform' }}>
                        <p style={labelStyle}>Email</p>
                        <a href="mailto:hello@wide.studio" style={{ ...valueStyle, display: 'inline-block' }}>
                            hello@wide.studio
                        </a>
                    </div>
                    <div ref={(el) => { if (el) infoRowsRef.current[1] = el; }} style={{ willChange: 'transform' }}>
                        <p style={labelStyle}>Telefono</p>
                        <a href="tel:+390000000000" style={{ ...valueStyle, display: 'inline-block' }}>
                            +39 000 000 0000
                        </a>
                    </div>
                    <div ref={(el) => { if (el) infoRowsRef.current[2] = el; }} style={{ willChange: 'transform' }}>
                        <p style={labelStyle}>Social</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {SOCIALS.map((s, i) => (
                                <SocialCard
                                    key={s.label}
                                    social={s}
                                    index={i}
                                    siblings={socialCardsRef}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Cal.com Card ─────────────────────────────────── */}
                <div
                    ref={calCardRef}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{ perspective: '800px', willChange: 'transform' }}
                >
                    {/* Subtle glowing border */}
                    <div
                        style={{
                            position: 'relative',
                            borderRadius: 17,
                            padding: 1,
                            background: 'linear-gradient(135deg, rgba(100,60,200,0.25), rgba(40,80,200,0.15), rgba(100,60,200,0.25))',
                        }}
                    >
                        <div
                            ref={calCardInnerRef}
                            style={{
                                position: 'relative',
                                backgroundColor: 'rgba(8,8,14,0.96)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                borderRadius: 16,
                                padding: isMobile ? 'clamp(28px, 6vw, 40px)' : 'clamp(36px, 4vw, 56px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                minHeight: isMobile ? 220 : 300,
                                willChange: isMobile ? 'auto' : 'transform',
                            }}
                        >
                            {/* Spotlight */}
                            <div
                                data-spotlight
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 16,
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.2s',
                                }}
                            />

                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 24,
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>

                            <h3
                                style={{
                                    color: '#fff',
                                    fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    margin: '0 0 12px',
                                }}
                            >
                                Prenota una call
                            </h3>
                            <p
                                style={{
                                    color: 'rgba(255,255,255,0.45)',
                                    fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
                                    fontWeight: 300,
                                    lineHeight: 1.6,
                                    margin: 0,
                                    maxWidth: 320,
                                }}
                            >
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
