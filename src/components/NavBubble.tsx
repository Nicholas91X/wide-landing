import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
    label: string;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Home',      href: '#home' },
    { label: 'Servizi',   href: '#servizi' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Contatti',  href: '#contatti' },
];

// Angles (in degrees) for child bubbles — TOP, RIGHT, BOTTOM, LEFT
const CHILD_ANGLES = [-90, 0, 90, 180];
const CHILD_RADIUS_MOBILE  = 130; // px from center
const CHILD_RADIUS_DESKTOP = 160;
const BUBBLE_SIZE = 64; // main bubble diameter (px)
const LOGO_SIZE   = 56; // logo bubble diameter (px)
const CHILD_SIZE  = 72; // child bubble diameter (px)
const MARGIN      = 20; // from screen edge

// ─── Soap Bubble Style ────────────────────────────────────────────────────────
const soapBubbleStyle: React.CSSProperties = {
    borderRadius: '50%',
    background: [
        'radial-gradient(circle at 28% 28%, rgba(255,255,255,0.55) 0%, transparent 45%)',
        'radial-gradient(circle at 72% 70%, rgba(140,200,255,0.18) 0%, transparent 40%)',
        'radial-gradient(circle at 65% 20%, rgba(255,140,220,0.12) 0%, transparent 30%)',
        'radial-gradient(circle at 20% 75%, rgba(140,255,200,0.10) 0%, transparent 28%)',
        'rgba(255,255,255,0.06)',
    ].join(', '),
    border: '1px solid rgba(255,255,255,0.35)',
    boxShadow: [
        'inset 0 0 16px rgba(255,255,255,0.25)',
        'inset 0 0 40px rgba(140,180,255,0.12)',
        '0 8px 32px rgba(0,0,0,0.35)',
        '0 2px 8px rgba(255,255,255,0.08)',
    ].join(', '),
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
};

// ─── Helper: angle → {x, y} offset ──────────────────────────────────────────
function angleToOffset(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

// ─── Component ────────────────────────────────────────────────────────────────
export const NavBubble: React.FC = () => {
    const menuBubbleRef    = useRef<HTMLDivElement>(null);
    const childrenWrapRef  = useRef<HTMLDivElement>(null);
    const childRefs        = useRef<(HTMLDivElement | null)[]>([]);
    const progressRef      = useRef<SVGCircleElement>(null);
    const overlayRef       = useRef<HTMLDivElement>(null);
    const isAnimatingRef   = useRef(false);

    const [isOpen, setIsOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Track scroll for the progress ring
    useEffect(() => {
        const onScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Update SVG progress ring
    useEffect(() => {
        const circle = progressRef.current;
        if (!circle) return;
        const r = parseFloat(circle.getAttribute('r') || '28');
        const circumference = 2 * Math.PI * r;
        circle.style.strokeDasharray  = `${circumference}`;
        circle.style.strokeDashoffset  = `${circumference * (1 - scrollProgress)}`;
    }, [scrollProgress]);

    const openMenu = useCallback(() => {
        if (isAnimatingRef.current || isOpen) return;
        isAnimatingRef.current = true;
        setIsOpen(true);

        const bubble   = menuBubbleRef.current;
        const children = childRefs.current;
        const overlay  = overlayRef.current;
        if (!bubble || !overlay) return;

        const rect     = bubble.getBoundingClientRect();
        const targetX  = window.innerWidth  / 2 - (rect.left + rect.width  / 2);
        const targetY  = window.innerHeight / 2 - (rect.top  + rect.height / 2);
        const isMobile = window.innerWidth < 768;
        const radius   = isMobile ? CHILD_RADIUS_MOBILE : CHILD_RADIUS_DESKTOP;

        const tl = gsap.timeline({ onComplete: () => { isAnimatingRef.current = false; } });

        // Fade in overlay
        tl.to(overlay, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0);

        // Move main bubble to center, scale up
        tl.to(bubble, {
            x: targetX,
            y: targetY,
            scale: 1.15,
            duration: 0.5,
            ease: 'power3.inOut',
        }, 0);

        // Radiate child bubbles
        children.forEach((child, i) => {
            if (!child) return;
            const { x, y } = angleToOffset(CHILD_ANGLES[i], radius);
            tl.fromTo(child,
                { opacity: 0, x: 0, y: 0, scale: 0 },
                { opacity: 1, x, y, scale: 1, duration: 0.45, ease: 'back.out(1.5)' },
                0.18 + i * 0.07
            );
        });
    }, [isOpen]);

    const closeMenu = useCallback(() => {
        if (isAnimatingRef.current || !isOpen) return;
        isAnimatingRef.current = true;

        const bubble   = menuBubbleRef.current;
        const children = childRefs.current;
        const overlay  = overlayRef.current;
        if (!bubble || !overlay) return;

        const tl = gsap.timeline({ onComplete: () => { isAnimatingRef.current = false; setIsOpen(false); } });

        // Retract child bubbles
        children.forEach((child, i) => {
            if (!child) return;
            tl.to(child, { opacity: 0, x: 0, y: 0, scale: 0, duration: 0.3, ease: 'power2.in' }, i * 0.04);
        });

        // Return main bubble to corner
        tl.to(bubble, { x: 0, y: 0, scale: 1, duration: 0.45, ease: 'power3.inOut' }, 0.15);

        // Fade out overlay
        tl.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1);
    }, [isOpen]);

    const handleNavClick = (href: string) => {
        closeMenu();
        setTimeout(() => {
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 400);
    };

    return (
        <>
            {/* Backdrop overlay */}
            <div
                ref={overlayRef}
                onClick={closeMenu}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 998,
                    opacity: 0,
                    pointerEvents: isOpen ? 'all' : 'none',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    transition: 'pointer-events 0s',
                }}
            />

            {/* ── Logo bubble — top left ─────────────────────────────────── */}
            <div style={{
                position: 'fixed',
                top: MARGIN,
                left: MARGIN,
                zIndex: 1000,
                width:  LOGO_SIZE,
                height: LOGO_SIZE,
                ...soapBubbleStyle,
                overflow: 'hidden',
                padding: 0,
            }}>
                <img
                    src="/logo.png"
                    alt="WIDE"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
            </div>

            {/* ── MENU bubble — top right ────────────────────────────────── */}
            <div
                ref={menuBubbleRef}
                onClick={isOpen ? closeMenu : openMenu}
                style={{
                    position: 'fixed',
                    top:   MARGIN,
                    right: MARGIN,
                    zIndex: 1001,
                    width:  BUBBLE_SIZE,
                    height: BUBBLE_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...soapBubbleStyle,
                    transformOrigin: 'center center',
                }}
            >
                {/* Scroll progress ring */}
                <svg
                    width={BUBBLE_SIZE + 8}
                    height={BUBBLE_SIZE + 8}
                    style={{ position: 'absolute', top: -4, left: -4, transform: 'rotate(-90deg)', pointerEvents: 'none' }}
                >
                    {/* Track */}
                    <circle
                        cx={(BUBBLE_SIZE + 8) / 2}
                        cy={(BUBBLE_SIZE + 8) / 2}
                        r={BUBBLE_SIZE / 2 + 1}
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="1.5"
                    />
                    {/* Progress */}
                    <circle
                        ref={progressRef}
                        cx={(BUBBLE_SIZE + 8) / 2}
                        cy={(BUBBLE_SIZE + 8) / 2}
                        r={BUBBLE_SIZE / 2 + 1}
                        fill="none"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Label */}
                <span style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                }}>
                    {isOpen ? '✕' : 'MENU'}
                </span>

                {/* Child bubbles — positioned relative to center of this bubble */}
                <div
                    ref={childrenWrapRef}
                    style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: isOpen ? 'all' : 'none' }}
                >
                    {NAV_ITEMS.map((item, i) => (
                        <div
                            key={item.label}
                            ref={el => { childRefs.current[i] = el; }}
                            onClick={(e) => { e.stopPropagation(); handleNavClick(item.href); }}
                            style={{
                                position: 'absolute',
                                width: CHILD_SIZE,
                                height: CHILD_SIZE,
                                marginLeft: -CHILD_SIZE / 2,
                                marginTop:  -CHILD_SIZE / 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                scale: '0',
                                ...soapBubbleStyle,
                                flexDirection: 'column',
                            }}
                        >
                            <span style={{
                                color: '#fff',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                lineHeight: 1.2,
                                pointerEvents: 'none',
                            }}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default NavBubble;
