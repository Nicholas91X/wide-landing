import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

// ─── Footer ───────────────────────────────────────────────────────────────────
// Visual concept: "WIDE signing off"
// The wordmark is rendered as hollow letterforms (stroke, no fill).
// On scroll-into-view, each letter draws itself left→right via clip-path,
// staggered to simulate a single continuous pen stroke.
// A subtle 2px RGB split (chromatic aberration) rests on the drawn strokes
// as the site's quiet signature.
// ─────────────────────────────────────────────────────────────────────────────

const LETTERS = ['W', 'I', 'D', 'E'] as const;

const LEGAL_LINKS = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Note Legali',   href: '#' },
];

export const Footer: React.FC = () => {
    const footerRef   = useRef<HTMLElement>(null);
    const letterRefs  = useRef<(HTMLSpanElement | null)[]>([]);
    const prefersReduced = useReducedMotion();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
        onChange(mq);
        mq.addEventListener('change', onChange as (e: MediaQueryListEvent) => void);
        return () => mq.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void);
    }, []);

    // ── Stroke-draw animation on scroll ─────────────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (prefersReduced) {
                        letterRefs.current.forEach((el) => {
                            if (el) el.style.clipPath = 'inset(0 0% 0 0)';
                        });
                        return;
                    }
                    letterRefs.current.forEach((el, i) => {
                        if (!el) return;
                        gsap.to(el, {
                            clipPath: 'inset(0 0% 0 0)',
                            duration: 1.6,
                            delay: i * 0.28,
                            ease: 'power3.inOut',
                            overwrite: true
                        });
                    });
                } else {
                    // Reset when out of view
                    letterRefs.current.forEach((el) => {
                        if (!el) return;
                        gsap.killTweensOf(el);
                        el.style.clipPath = 'inset(0 100% 0 0)';
                    });
                }
            },
            { threshold: 0.15 }
        );

        if (footerRef.current) observer.observe(footerRef.current);
        return () => observer.disconnect();
    }, [prefersReduced]);

    // ── Link hover helper ──────────────────────────────────────────────────
    const linkStyle: React.CSSProperties = {
        color: 'rgba(255,255,255,0.28)',
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textDecoration: 'none',
        transition: 'color 0.3s ease',
        whiteSpace: 'nowrap' as const,
    };

    const onLinkEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
    };
    const onLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
    };

    return (
        <footer
            ref={footerRef}
            style={{
                backgroundColor: '#000',
                paddingTop: 'clamp(64px, 10vw, 120px)',
                paddingBottom: 'clamp(32px, 5vw, 56px)',
                paddingLeft: 'clamp(20px, 5vw, 56px)',
                paddingRight: 'clamp(20px, 5vw, 56px)',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            {/* ── WIDE wordmark — hollow stroke, draws itself in ─────────── */}
            <div
                aria-label="WIDE"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    lineHeight: 0.85,
                    marginBottom: 'clamp(36px, 6vw, 72px)',
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
            >
                {LETTERS.map((ch, i) => (
                    <span
                        key={ch}
                        ref={(el) => { letterRefs.current[i] = el; }}
                        style={{
                            display: 'inline-block',
                            fontSize: 'clamp(4.5rem, 22vw, 18rem)',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            lineHeight: 0.85,
                            // Hollow — stroke only, no fill
                            color: 'transparent',
                            WebkitTextStroke: isMobile
                                ? '1px rgba(255,255,255,0.82)'
                                : '1.5px rgba(255,255,255,0.85)',
                            // Chromatic aberration — the site's quiet signature
                            textShadow: [
                                '-2px 0 rgba(255,70,70,0.10)',
                                ' 2px 0 rgba(70,70,255,0.10)',
                            ].join(','),
                            // Start fully clipped (hidden), GSAP will reveal
                            clipPath: 'inset(0 100% 0 0)',
                        }}
                    >
                        {ch}
                    </span>
                ))}
            </div>

            {/* ── Hairline separator ─────────────────────────────────────── */}
            <div style={{
                height: '1px',
                background: 'rgba(255,255,255,0.07)',
                marginBottom: isMobile ? '28px' : 'clamp(20px, 3vw, 36px)',
            }} />

            {/* ── Bottom info grid ──────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr',
                gap: isMobile ? '24px' : '32px',
                alignItems: 'start',
            }}>

                {/* Left column — copyright & P.IVA */}
                <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'center' : 'center',
                        gap: isMobile ? '16px' : '24px',
                        marginBottom: '12px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                                Alessia Amoruso - WIDE
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                P.IVA 13486160966
                            </span>
                        </div>

                        <div style={{ 
                            width: isMobile ? '40px' : '1px', 
                            height: isMobile ? '1px' : '30px', 
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            margin: isMobile ? '0 auto' : '0'
                        }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                                Asia Franceschi - WIDE
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                P.IVA 01566890115
                            </span>
                        </div>
                    </div>
                    
                    <p style={{
                        color: 'rgba(255,255,255,0.22)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.08em',
                        lineHeight: 2,
                        margin: 0,
                    }}>
                        © {new Date().getFullYear()} WIDE Studio Digitale
                    </p>
                </div>

                {/* Center column — tagline */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        color: 'rgba(255,255,255,0.16)',
                        fontSize: isMobile ? '0.58rem' : '0.6rem',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        margin: 0,
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                    }}>
                        Ogni pixel, con intenzione.
                    </p>
                </div>

                {/* Right column — legal links */}
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    alignItems: isMobile ? 'center' : 'flex-end',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    gap: isMobile ? '0' : '8px',
                    flexWrap: 'wrap',
                }}>
                    {LEGAL_LINKS.map((link, i) => (
                        <React.Fragment key={link.label}>
                            <a
                                href={link.href}
                                style={linkStyle}
                                onMouseEnter={onLinkEnter}
                                onMouseLeave={onLinkLeave}
                            >
                                {link.label}
                            </a>
                            {isMobile && i < LEGAL_LINKS.length - 1 && (
                                <span style={{
                                    color: 'rgba(255,255,255,0.10)',
                                    margin: '0 8px',
                                    fontSize: '0.45rem',
                                }}>
                                    ·
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
