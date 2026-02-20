import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Team Data ───────────────────────────────────────────────────────────────
const TEAM = [
    {
        name: 'Nome Cognome',
        role: 'Co-Founder & Creative Director',
        description:
            'Specializzato in brand strategy e direzione creativa. Trasforma visioni in identità visive memorabili.',
        gradient: 'linear-gradient(135deg, #1a0a2e, #3d1a6e, #1a0a2e)',
    },
    {
        name: 'Nome Cognome',
        role: 'Co-Founder & Tech Lead',
        description:
            'Esperto in sviluppo web e produzione digitale. Unisce tecnologia e design per esperienze innovative.',
        gradient: 'linear-gradient(135deg, #0a1a2e, #1a3d6e, #0a1a2e)',
    },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const ChiSiamo: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const cardLeftRef = useRef<HTMLDivElement>(null);
    const cardRightRef = useRef<HTMLDivElement>(null);
    const visionRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(false);

    // ── Responsive state ────────────────────────────────────────────────────
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
            setIsMobile(e.matches);
        onChange(mq);
        mq.addEventListener('change', onChange as (e: MediaQueryListEvent) => void);
        return () =>
            mq.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void);
    }, []);

    // ── GSAP Scroll Animations ──────────────────────────────────────────────
    useEffect(() => {
        const section = sectionRef.current;
        const header = headerRef.current;
        const cardLeft = cardLeftRef.current;
        const cardRight = cardRightRef.current;
        const vision = visionRef.current;
        if (!section || !header || !cardLeft || !cardRight || !vision) return;

        const rotationAmount = isMobile ? 10 : 20;

        // Header fade-in
        gsap.fromTo(
            header,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    end: 'top 55%',
                    scrub: 1,
                    refreshPriority: -2,
                },
            },
        );

        // Card left: starts less rotated and more centered, opens to full rotation
        gsap.fromTo(
            cardLeft,
            { rotation: 0, x: 40, opacity: 0, scale: 0.85 },
            {
                rotation: -rotationAmount,
                x: 0,
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: cardsContainerRef.current,
                    start: 'top 80%',
                    end: 'top 40%',
                    scrub: 1,
                    refreshPriority: -2,
                },
            },
        );

        // Card right: mirrors the left card
        gsap.fromTo(
            cardRight,
            { rotation: 0, x: -40, opacity: 0, scale: 0.85 },
            {
                rotation: rotationAmount,
                x: 0,
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: cardsContainerRef.current,
                    start: 'top 80%',
                    end: 'top 40%',
                    scrub: 1,
                    refreshPriority: -2,
                },
            },
        );

        // Vision fade-in with translate
        gsap.fromTo(
            vision,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: vision,
                    start: 'top 85%',
                    end: 'top 55%',
                    scrub: 1,
                    refreshPriority: -2,
                },
            },
        );

        return () => {
            ScrollTrigger.getAll().forEach((st) => {
                const t = st.vars.trigger;
                if (
                    t === header ||
                    t === cardsContainerRef.current ||
                    t === vision
                ) {
                    st.kill();
                }
            });
        };
    }, [isMobile]);

    // ── Card style builder ──────────────────────────────────────────────────
    const cardStyle = (rotation: number): React.CSSProperties => ({
        width: isMobile ? 180 : 260,
        minHeight: isMobile ? 280 : 380,
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'bottom center',
        flexShrink: 0,
    });

    const rotationAmount = isMobile ? 20 : 30;

    return (
        <div
            ref={sectionRef}
            style={{
                backgroundColor: '#000',
                padding: `clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)`,
                overflow: 'hidden',
            }}
        >
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div ref={headerRef} style={{ marginBottom: 'clamp(48px, 8vw, 80px)' }}>
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
                    CHI SIAMO
                </p>
                <h2
                    style={{
                        color: '#fff',
                        fontSize: 'clamp(2.2rem, 7vw, 5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.05,
                        margin: '0 0 20px',
                    }}
                >
                    Le menti dietro
                    <br />
                    ogni progetto.
                </h2>
                <div
                    style={{
                        width: 30,
                        height: 2,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                    }}
                />
            </div>

            {/* ── Team Cards ──────────────────────────────────────────────────── */}
            <div
                ref={cardsContainerRef}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: isMobile ? 0 : 0,
                    marginBottom: 'clamp(60px, 10vw, 120px)',
                    position: 'relative',
                    minHeight: isMobile ? 320 : 440,
                }}
            >
                {/* Left card */}
                <div
                    ref={cardLeftRef}
                    style={{
                        ...cardStyle(-rotationAmount),
                        marginRight: isMobile ? -30 : -40,
                        zIndex: 1,
                    }}
                >
                    {/* Photo placeholder */}
                    <div
                        style={{
                            width: '100%',
                            height: isMobile ? 140 : 200,
                            background: TEAM[0].gradient,
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ padding: isMobile ? '14px 14px 18px' : '20px 20px 24px' }}>
                        <p
                            style={{
                                color: '#fff',
                                fontSize: isMobile ? '0.9rem' : '1.05rem',
                                fontWeight: 700,
                                margin: '0 0 4px',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {TEAM[0].name}
                        </p>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                margin: '0 0 10px',
                            }}
                        >
                            {TEAM[0].role}
                        </p>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.55)',
                                fontSize: isMobile ? '0.72rem' : '0.8rem',
                                fontWeight: 300,
                                lineHeight: 1.5,
                                margin: 0,
                            }}
                        >
                            {TEAM[0].description}
                        </p>
                    </div>
                </div>

                {/* Right card */}
                <div
                    ref={cardRightRef}
                    style={{
                        ...cardStyle(rotationAmount),
                        marginLeft: isMobile ? -30 : -40,
                        zIndex: 2,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: isMobile ? 140 : 200,
                            background: TEAM[1].gradient,
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ padding: isMobile ? '14px 14px 18px' : '20px 20px 24px' }}>
                        <p
                            style={{
                                color: '#fff',
                                fontSize: isMobile ? '0.9rem' : '1.05rem',
                                fontWeight: 700,
                                margin: '0 0 4px',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {TEAM[1].name}
                        </p>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                margin: '0 0 10px',
                            }}
                        >
                            {TEAM[1].role}
                        </p>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.55)',
                                fontSize: isMobile ? '0.72rem' : '0.8rem',
                                fontWeight: 300,
                                lineHeight: 1.5,
                                margin: 0,
                            }}
                        >
                            {TEAM[1].description}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Vision ──────────────────────────────────────────────────────── */}
            <div
                ref={visionRef}
                style={{
                    textAlign: 'center',
                    maxWidth: 600,
                    margin: '0 auto',
                }}
            >
                <h3
                    style={{
                        color: '#fff',
                        fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.15,
                        margin: '0 0 20px',
                    }}
                >
                    La Nostra Vision
                </h3>
                <p
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                        fontWeight: 300,
                        lineHeight: 1.7,
                        margin: 0,
                    }}
                >
                    Crediamo che il design e la tecnologia possano trasformare le idee in
                    esperienze straordinarie. Ogni progetto è un'opportunità per superare i
                    confini del possibile, unendo creatività, strategia e innovazione per
                    costruire brand che lasciano il segno.
                </p>
            </div>
        </div>
    );
};

export default ChiSiamo;
