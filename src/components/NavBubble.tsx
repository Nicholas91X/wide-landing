import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

// ─── Config ───────────────────────────────────────────────────────────────────
interface NavItem {
    label: string;
    sectionId: string;
    angle: number; // degrees: 0=right, 90=bottom, 180=left, -90=top
}

// Pentagon arrangement (starting at top, clockwise, 72° apart)
const NAV_ITEMS: NavItem[] = [
    { label: 'Home',      sectionId: 'home',       angle: -90   }, // 12 o'clock
    { label: 'Servizi',   sectionId: 'servizi',    angle: -18   }, // 1-2 o'clock
    { label: 'Chi Siamo', sectionId: 'chi-siamo',  angle: 54    }, // 4-5 o'clock
    { label: 'Portfolio', sectionId: 'portfolio',  angle: 126   }, // 7-8 o'clock
    { label: 'Contatti',  sectionId: 'contatti',   angle: 198   }, // 9-10 o'clock
];

// Sections that can be highlighted (Home is intentionally excluded)
const HIGHLIGHTABLE = new Set(['servizi', 'chi-siamo', 'portfolio', 'contatti']);

const BUBBLE_SIZE   = 64;
const LOGO_SIZE     = 56;
const CHILD_SIZE    = 72;
const RADIUS_MOBILE = 155;
const RADIUS_DESK   = 190;
const MARGIN        = 20;


// ─── Soap Bubble CSS ──────────────────────────────────────────────────────────
const soap = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    borderRadius: '50%',
    background: [
        'radial-gradient(circle at 28% 28%, rgba(255,255,255,0.55) 0%, transparent 48%)',
        'radial-gradient(circle at 70% 72%, rgba(140,200,255,0.18) 0%, transparent 42%)',
        'radial-gradient(circle at 65% 18%, rgba(255,140,220,0.12) 0%, transparent 30%)',
        'radial-gradient(circle at 20% 78%, rgba(140,255,200,0.10) 0%, transparent 28%)',
        'rgba(255,255,255,0.05)',
    ].join(', '),
    border: '1px solid rgba(255,255,255,0.32)',
    boxShadow: [
        'inset 0 0 18px rgba(255,255,255,0.22)',
        'inset 0 0 40px rgba(140,180,255,0.10)',
        '0 8px 32px rgba(0,0,0,0.35)',
    ].join(', '),
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    cursor: 'pointer',
    ...extra,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function polarOffset(angleDeg: number, radius: number) {
    const r = (angleDeg * Math.PI) / 180;
    return { dx: Math.cos(r) * radius, dy: Math.sin(r) * radius };
}

// ─── Component ────────────────────────────────────────────────────────────────
export const NavBubble: React.FC = () => {
    const mainRef     = useRef<HTMLDivElement>(null);
    const childRefs   = useRef<(HTMLDivElement | null)[]>([]);
    const overlayRef  = useRef<HTMLDivElement>(null);
    const progressRef = useRef<SVGCircleElement>(null);
    const animating   = useRef(false);

    const [isOpen,         setIsOpen]         = useState(false);
    const [scrollPct,      setScrollPct]      = useState(0);
    const [activeSection,  setActiveSection]  = useState('home');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);

    // ── Scroll progress ───────────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setScrollPct(max > 0 ? window.scrollY / max : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Update SVG ring ───────────────────────────────────────────────────────
    useEffect(() => {
        const c = progressRef.current;
        if (!c) return;
        const r = parseFloat(c.getAttribute('r') || '34');
        const circ = 2 * Math.PI * r;
        c.style.strokeDasharray  = `${circ}`;
        c.style.strokeDashoffset = `${circ * (1 - scrollPct)}`;
    }, [scrollPct]);

    // ── Active section via scroll position ────────────────────────────────────
    useEffect(() => {
        const detectSection = () => {
            const midY = window.scrollY + window.innerHeight * 0.4;
            let active = '';  // empty = none (Home is never highlighted)
            for (const item of NAV_ITEMS) {
                if (!HIGHLIGHTABLE.has(item.sectionId)) continue;
                const el = document.getElementById(item.sectionId);
                if (el && el.offsetTop <= midY) active = item.sectionId;
            }
            setActiveSection(active);
        };
        detectSection();
        window.addEventListener('scroll', detectSection, { passive: true });
        return () => window.removeEventListener('scroll', detectSection);
    }, []);

    // ── Floating bubble canvas ────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (!isOpen) {
            cancelAnimationFrame(rafRef.current);
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        // Resize canvas to full viewport
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // ── Bubble physics ───────────────────────────────────────────────────
        // Max ~10 bubbles at once for performance
        const MAX_BUBBLES = 10;

        interface Bubble {
            x: number;      // current x
            y: number;      // current y
            r: number;      // radius
            speed: number;  // px/frame rise speed
            amp: number;    // horizontal drift amplitude
            freq: number;   // horizontal drift frequency
            phase: number;  // starting phase for sin
            ticks: number;  // age counter
            life: number;   // max life in ticks
        }

        const spawnBubble = (): Bubble => {
            const r = 6 + Math.random() * 20;                // 6–26px
            return {
                x:     Math.random() * canvas.width,
                y:     canvas.height + r + Math.random() * canvas.height * 0.3,
                r,
                // Larger bubbles rise slower (Stokes' law approximation)
                speed: 0.4 + (1 - r / 26) * 1.2 + Math.random() * 0.4,
                amp:   8 + Math.random() * 22,
                freq:  0.008 + Math.random() * 0.012,
                phase: Math.random() * Math.PI * 2,
                ticks: 0,
                life:  Math.round((canvas.height + r) / (0.4 + (1 - r / 26) * 1.2)),
            };
        };

        // Pre-seed some bubbles at various heights so it doesn't start empty
        const bubbles: Bubble[] = Array.from({ length: 6 }, () => {
            const b = spawnBubble();
            b.y = Math.random() * canvas.height;
            b.ticks = Math.round(Math.random() * b.life * 0.4);
            return b;
        });

        let spawnTimer = 0;
        const SPAWN_INTERVAL = 28; // frames between new bubble

        // ── Draw a single soap bubble on canvas ──────────────────────────────
        const drawBubble = (b: Bubble) => {
            const fadePct = b.ticks / b.life;
            // Fade in first 10%, fade out last 20%
            let alpha = 1;
            if (fadePct < 0.1) alpha = fadePct / 0.1;
            else if (fadePct > 0.8) alpha = (1 - fadePct) / 0.2;
            alpha = Math.min(1, Math.max(0, alpha)) * 0.55;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Main circle — very transparent fill
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);

            // Iridescent gradient (soap film colours)
            const grad = ctx.createRadialGradient(
                b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.05,
                b.x, b.y, b.r
            );
            grad.addColorStop(0,   'rgba(255,255,255,0.55)');
            grad.addColorStop(0.3, 'rgba(180,214,255,0.15)');
            grad.addColorStop(0.7, 'rgba(200,140,255,0.10)');
            grad.addColorStop(1,   'rgba(140,255,200,0.05)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.30)';
            ctx.lineWidth   = 0.8;
            ctx.stroke();

            // Specular highlight
            ctx.beginPath();
            ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fill();

            ctx.restore();
        };

        // ── Animation loop ───────────────────────────────────────────────────
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Spawn new bubbles
            spawnTimer++;
            if (spawnTimer >= SPAWN_INTERVAL && bubbles.length < MAX_BUBBLES) {
                bubbles.push(spawnBubble());
                spawnTimer = 0;
            }

            // Update & draw
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                b.ticks++;
                b.y -= b.speed;
                // Sine-wave horizontal drift with slight deceleration
                b.x += Math.sin(b.ticks * b.freq + b.phase) * (b.amp / 30);
                drawBubble(b);
                if (b.ticks >= b.life) {
                    bubbles.splice(i, 1);
                    spawnTimer = SPAWN_INTERVAL; // spawn immediately
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(rafRef.current); };
    }, [isOpen]);


    // ── Open ──────────────────────────────────────────────────────────────────
    const openMenu = useCallback(() => {
        if (animating.current || isOpen) return;
        animating.current = true;
        setIsOpen(true);

        const main    = mainRef.current;
        const overlay = overlayRef.current;
        if (!main || !overlay) { animating.current = false; return; }

        const rect    = main.getBoundingClientRect();
        const cx      = rect.left + rect.width  / 2;
        const cy      = rect.top  + rect.height / 2;
        const toCx    = window.innerWidth  / 2;
        const toCy    = window.innerHeight / 2;
        const dx      = toCx - cx;
        const dy      = toCy - cy;
        const mobile  = window.innerWidth < 768;

        // ── Safe radius: keep every bubble inside the viewport ──────────────
        // The most restrictive angles in this pentagon are ±18° (near-horizontal).
        // cos(18°) ≈ 0.951 — the horizontal component that risks hitting the sides.
        // Formula: halfWidth  - CHILD_SIZE/2 - margin > radius * cos(18°)
        //          halfHeight - CHILD_SIZE/2 - margin > radius * sin(90°) [for Home top]
        const SAFE_MARGIN = 14; // px from screen edge
        const cosMax = Math.cos(18 * Math.PI / 180);   // ≈ 0.951
        const halfW  = window.innerWidth  / 2;
        const halfH  = window.innerHeight / 2;
        const safeByWidth  = (halfW - CHILD_SIZE / 2 - SAFE_MARGIN) / cosMax;
        const safeByHeight = halfH - CHILD_SIZE / 2 - SAFE_MARGIN; // Home at -90°
        const maxSafe = Math.min(safeByWidth, safeByHeight);
        const baseRadius = mobile ? RADIUS_MOBILE : RADIUS_DESK;
        const radius = Math.min(baseRadius, maxSafe);

        const tl = gsap.timeline({ onComplete: () => { animating.current = false; } });

        // Overlay fade in
        tl.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);

        // Main bubble → center
        tl.to(main, {
            x: dx, y: dy,
            scale: 1.1,
            duration: 0.8,
            ease: 'power3.inOut',
        }, 0);

        // Child bubbles radiate
        childRefs.current.forEach((child, i) => {
            if (!child) return;
            const { dx: offX, dy: offY } = polarOffset(NAV_ITEMS[i].angle, radius);
            tl.fromTo(
                child,
                { opacity: 0, x: 0, y: 0, scale: 0 },
                { opacity: 1, x: offX, y: offY, scale: 1, duration: 0.6, ease: 'back.out(1.4)' },
                0.3 + i * 0.1
            );
        });
    }, [isOpen]);

    // ── Close ─────────────────────────────────────────────────────────────────
    const closeMenu = useCallback(() => {
        if (animating.current || !isOpen) return;
        animating.current = true;

        const main    = mainRef.current;
        const overlay = overlayRef.current;
        if (!main || !overlay) { animating.current = false; return; }

        const tl = gsap.timeline({
            onComplete: () => { animating.current = false; setIsOpen(false); }
        });

        // Retract children
        childRefs.current.forEach((child, i) => {
            if (!child) return;
            tl.to(child, { opacity: 0, x: 0, y: 0, scale: 0, duration: 0.4, ease: 'power2.in' }, i * 0.05);
        });

        // Main bubble returns
        tl.to(main, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut' }, 0.2);

        // Overlay fade out
        tl.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.2);
    }, [isOpen]);

    // ── Nav click ─────────────────────────────────────────────────────────────
    const handleNavClick = (sectionId: string) => {
        closeMenu();
        setTimeout(() => {
            if (sectionId === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        }, 700);
    };

    return (
        <>
            {/* Floating bubble canvas — only active when menu open */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed', inset: 0,
                    zIndex: 2999,
                    pointerEvents: 'none',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.4s',
                }}
            />

            {/* Backdrop */}
            <div
                ref={overlayRef}
                onClick={closeMenu}
                style={{
                    position: 'fixed', inset: 0, zIndex: 2998,
                    opacity: 0,
                    pointerEvents: isOpen ? 'all' : 'none',
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                }}
            />

            {/* ── Logo bubble — top-left ───────────────────────────────────── */}
            <div style={{
                position: 'fixed', top: MARGIN, left: MARGIN,
                width: LOGO_SIZE, height: LOGO_SIZE,
                zIndex: 3000,
                overflow: 'hidden',
                ...soap(),
                padding: 0,
            }}>
                <img
                    src="/logo.png" alt="WIDE"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                />
            </div>

            {/* ── MENU bubble — top-right with child bubbles ───────────────── */}
            <div
                ref={mainRef}
                style={{
                    position: 'fixed',
                    top: MARGIN, right: MARGIN,
                    width: BUBBLE_SIZE, height: BUBBLE_SIZE,
                    zIndex: 3001,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transformOrigin: 'center center',
                    ...soap(),
                }}
                onClick={isOpen ? closeMenu : openMenu}
            >
                {/* Progress ring */}
                <svg
                    width={BUBBLE_SIZE + 10} height={BUBBLE_SIZE + 10}
                    style={{
                        position: 'absolute', top: -5, left: -5,
                        transform: 'rotate(-90deg)',
                        pointerEvents: 'none',
                    }}
                >
                    <circle
                        cx={(BUBBLE_SIZE + 10) / 2} cy={(BUBBLE_SIZE + 10) / 2}
                        r={BUBBLE_SIZE / 2 + 2}
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"
                    />
                    <circle
                        ref={progressRef}
                        cx={(BUBBLE_SIZE + 10) / 2} cy={(BUBBLE_SIZE + 10) / 2}
                        r={BUBBLE_SIZE / 2 + 2}
                        fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Label */}
                <span style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: isOpen ? '1rem' : '0.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                    transition: 'font-size 0.3s',
                    lineHeight: 1,
                }}>
                    {isOpen ? '✕' : 'MENU'}
                </span>

                {/* ── Child bubbles — positioned relative to center ─────────── */}
                {NAV_ITEMS.map((item, i) => {
                    const isActive = activeSection === item.sectionId;
                    return (
                        <div
                            key={item.sectionId}
                            ref={el => { childRefs.current[i] = el; }}
                            onClick={(e) => { e.stopPropagation(); handleNavClick(item.sectionId); }}
                            style={{
                                // Base soap bubble style
                                ...soap({
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    marginTop:  -CHILD_SIZE / 2,
                                    marginLeft: -CHILD_SIZE / 2,
                                    width: CHILD_SIZE, height: CHILD_SIZE,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column',
                                    opacity: 0,
                                    pointerEvents: isOpen ? 'all' : 'none',
                                }),
                                // Active glow OVERRIDES soap() — must come last
                                ...(isActive ? {
                                    border: '1.5px solid rgba(255,255,255,0.75)',
                                    boxShadow: [
                                        'inset 0 0 18px rgba(255,255,255,0.30)',
                                        'inset 0 0 40px rgba(140,180,255,0.15)',
                                        '0 0 24px rgba(255,255,255,0.60)',
                                        '0 0 50px rgba(200,220,255,0.30)',
                                    ].join(', '),
                                } : {}),
                            }}
                        >
                            <span style={{
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                                fontSize: '0.6rem',
                                fontWeight: isActive ? 800 : 600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                pointerEvents: 'none',
                                lineHeight: 1.2,
                            }}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div style={{
                                    marginTop: 4,
                                    width: 4, height: 4,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default NavBubble;
