import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

// ─── Config ───────────────────────────────────────────────────────────────────
interface NavItem {
    label: string;
    sectionId: string;
    angle: number; // degrees: 0=right, 90=bottom, 180=left, -90=top
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Home',      sectionId: 'home',      angle: -90  }, // top
    { label: 'Servizi',   sectionId: 'servizi',   angle: 0    }, // right
    { label: 'Portfolio', sectionId: 'portfolio', angle: 90   }, // bottom
    { label: 'Contatti',  sectionId: 'contatti',  angle: 180  }, // left
];

const BUBBLE_SIZE   = 64;
const LOGO_SIZE     = 56;
const CHILD_SIZE    = 76;
const RADIUS_MOBILE = 140;
const RADIUS_DESK   = 170;
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

    // ── Active section via IntersectionObserver ───────────────────────────────
    useEffect(() => {
        const ids = NAV_ITEMS.map(n => n.sectionId);
        const observers: IntersectionObserver[] = [];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { threshold: 0.4 }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, []);

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
        const radius  = mobile ? RADIUS_MOBILE : RADIUS_DESK;

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
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 700);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                ref={overlayRef}
                onClick={closeMenu}
                style={{
                    position: 'fixed', inset: 0, zIndex: 998,
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
                zIndex: 1000,
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
                    zIndex: 1001,
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
                                position: 'absolute',
                                top: '50%', left: '50%',
                                marginTop:  -CHILD_SIZE / 2,
                                marginLeft: -CHILD_SIZE / 2,
                                width: CHILD_SIZE, height: CHILD_SIZE,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column',
                                opacity: 0,
                                pointerEvents: isOpen ? 'all' : 'none',
                                // Active glow
                                ...(isActive ? {
                                    boxShadow: [
                                        'inset 0 0 18px rgba(255,255,255,0.22)',
                                        'inset 0 0 40px rgba(140,180,255,0.10)',
                                        '0 0 22px rgba(255,255,255,0.55)',
                                        '0 0 45px rgba(200,220,255,0.25)',
                                    ].join(', '),
                                    border: '1.5px solid rgba(255,255,255,0.7)',
                                } : {}),
                                ...soap({
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    marginTop:  -CHILD_SIZE / 2,
                                    marginLeft: -CHILD_SIZE / 2,
                                    width: CHILD_SIZE, height: CHILD_SIZE,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column',
                                }),
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
