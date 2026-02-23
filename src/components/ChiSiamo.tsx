import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Team Data ───────────────────────────────────────────────────────────────
const TEAM = [
    {
        name: 'Alessia Amoruso',
        role: 'Co-Founder & Strategist – Area Sviluppo e Pubblicità',
        description:
            'Traduco la strategia in risultati misurabili. Ingegnerizzo le tue infrastrutture web (siti e applicativi) e gestisco in prima persona i budget delle tue campagne sponsorizzate, ottimizzando ogni investimento per generare contatti e vendite reali.',
        gradient: 'linear-gradient(135deg, #1a0a2e, #3d1a6e, #1a0a2e)',
    },
    {
        name: 'Asia Franceschi',
        role: 'Co-Founder & Strategist – Area Immagine e Contenuti',
        description:
            "Studio il posizionamento della tua azienda e ne curo l'intera veste comunicativa. Dalla linea editoriale fino alla produzione reale di foto e video sul set, mi assicuro che ogni materiale trasmetta l'autorevolezza del tuo brand senza filtri o finzioni.",
        gradient: 'linear-gradient(135deg, #0a1a2e, #1a3d6e, #0a1a2e)',
    },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const ChiSiamo: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const pinWrapRef = useRef<HTMLDivElement>(null);
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

    // ── Card dimensions ──────────────────────────────────────────────────────
    const cardW = isMobile ? 180 : 260;
    const cardH = isMobile ? 300 : 400;
    const photoH = isMobile ? 140 : 200;

    // ── GSAP Scroll Animations ──────────────────────────────────────────────
    useEffect(() => {
        const section = sectionRef.current;
        const header = headerRef.current;
        const pinWrap = pinWrapRef.current;
        const cardLeft = cardLeftRef.current;
        const cardRight = cardRightRef.current;
        const vision = visionRef.current;
        if (!section || !header || !pinWrap || !cardLeft || !cardRight || !vision) return;

        const rotAmt = isMobile ? 12 : 20;
        const fgScale = isMobile ? 1.18 : 1.22;
        const bgScale = 0.88;
        const fgX = isMobile ? 20 : 40;

        const ctx = gsap.context(() => {
            // Header fade-in
            gsap.fromTo(header, { opacity: 0, y: 40 }, {
                opacity: 1, y: 0, duration: 1, ease: 'power2.out',
                scrollTrigger: { trigger: header, start: 'top 85%', end: 'top 55%', scrub: 1 },
            });

            // ── Set initial GSAP state (no CSS transform conflicts) ──
            gsap.set(cardLeft, { rotation: 0, scale: 0.85, opacity: 0, x: 40 });
            gsap.set(cardRight, { rotation: 0, scale: 0.85, opacity: 0, x: -40 });

            // ── Build timeline sequentially with .add() ──
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: pinWrap,
                    start: 'top 20%',
                    end: '+=400%',
                    pin: true,
                    scrub: 0.8,
                },
            });

            // Phase 1: Both cards enter (rotated, fanned out)
            tl.addLabel('enter')
              .to(cardLeft, { rotation: -rotAmt, x: 0, opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 'enter')
              .to(cardRight, { rotation: rotAmt, x: 0, opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 'enter');

            // Phase 2: Left card comes to foreground
            tl.addLabel('leftFwd')
              .to(cardLeft, { rotation: 0, scale: fgScale, x: fgX, zIndex: 10, duration: 1, ease: 'power2.inOut' }, 'leftFwd')
              .to(cardRight, { opacity: 0.35, scale: bgScale, duration: 1, ease: 'power2.inOut' }, 'leftFwd');

            // Phase 3: Hold left in foreground (empty spacer tween)
            tl.addLabel('holdLeft')
              .to(pinWrap, { duration: 2 }, 'holdLeft');

            // Phase 4: Swap — left back, right forward
            tl.addLabel('swap')
              .to(cardLeft, { rotation: -rotAmt, scale: bgScale, x: 0, opacity: 0.35, zIndex: 1, duration: 1.2, ease: 'power2.inOut' }, 'swap')
              .to(cardRight, { rotation: 0, scale: fgScale, x: -fgX, opacity: 1, zIndex: 10, duration: 1.2, ease: 'power2.inOut' }, 'swap');

            // Phase 5: Hold right in foreground
            tl.addLabel('holdRight')
              .to(pinWrap, { duration: 2 }, 'holdRight');

            // Phase 6: Both return to resting
            tl.addLabel('return')
              .to(cardLeft, { rotation: -rotAmt, scale: 1, opacity: 1, x: 0, zIndex: 1, duration: 1, ease: 'power2.inOut' }, 'return')
              .to(cardRight, { rotation: rotAmt, scale: 1, opacity: 1, x: 0, zIndex: 2, duration: 1, ease: 'power2.inOut' }, 'return');

            // Phase 7: Breathing room
            tl.to(pinWrap, { duration: 1 });

            // ── Vision fade-in ──
            gsap.fromTo(vision, { opacity: 0, y: 50 }, {
                opacity: 1, y: 0, duration: 1, ease: 'power2.out',
                scrollTrigger: { trigger: vision, start: 'top 85%', end: 'top 55%', scrub: 1 },
            });
        }, section);

        return () => ctx.revert();
    }, [isMobile, cardH]);

    const renderCard = (index: number) => (
        <>
            <div
                style={{
                    width: '100%',
                    height: photoH,
                    background: TEAM[index].gradient,
                    flexShrink: 0,
                }}
            />
            <div style={{
                padding: isMobile ? '14px 14px 18px' : '20px 20px 24px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <p style={{
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1.05rem',
                    fontWeight: 700,
                    margin: '0 0 4px',
                    letterSpacing: '-0.01em',
                }}>
                    {TEAM[index].name}
                </p>
                <p style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    margin: '0 0 10px',
                }}>
                    {TEAM[index].role}
                </p>
                <p style={{
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: isMobile ? '0.72rem' : '0.8rem',
                    fontWeight: 300,
                    lineHeight: 1.5,
                    margin: 0,
                }}>
                    {TEAM[index].description}
                </p>
            </div>
        </>
    );

    return (
        <div
            ref={sectionRef}
            style={{
                backgroundColor: '#000',
                padding: `clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)`,
                /* NO overflow:hidden — it breaks GSAP pin */
            }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div ref={headerRef} style={{ marginBottom: 'clamp(48px, 8vw, 80px)' }}>
                <p style={{
                    color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 600,
                    letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px',
                }}>
                    CHI SIAMO
                </p>
                <h2 style={{
                    color: '#fff', fontSize: 'clamp(2.2rem, 7vw, 5rem)', fontWeight: 800,
                    letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 20px',
                }}>
                    Le menti dietro<br />ogni progetto.
                </h2>
                <div style={{ width: 30, height: 2, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            </div>

            {/* ── Pinned cards area ───────────────────────────────────────── */}
            <div
                ref={pinWrapRef}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    position: 'relative',
                    minHeight: cardH + 60,
                    marginBottom: 'clamp(60px, 10vw, 120px)',
                }}
            >
                {/* Left card — NO CSS transform, GSAP controls everything */}
                <div
                    ref={cardLeftRef}
                    style={{
                        position: 'relative',
                        width: cardW,
                        height: cardH,
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transformOrigin: 'bottom center',
                        flexShrink: 0,
                        willChange: 'transform, opacity',
                        marginRight: isMobile ? -30 : -40,
                    }}
                >
                    {renderCard(0)}
                </div>

                {/* Right card */}
                <div
                    ref={cardRightRef}
                    style={{
                        position: 'relative',
                        width: cardW,
                        height: cardH,
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transformOrigin: 'bottom center',
                        flexShrink: 0,
                        willChange: 'transform, opacity',
                        marginLeft: isMobile ? -30 : -40,
                    }}
                >
                    {renderCard(1)}
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
                    Come lavoriamo
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
                    Analizziamo e pianifichiamo la strategia della tua azienda a quattro mani,
                    per poi verticalizzare le nostre competenze sull'esecuzione pratica.
                </p>
            </div>
        </div>
    );
};

export default ChiSiamo;
