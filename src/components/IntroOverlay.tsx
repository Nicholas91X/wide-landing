import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

// ─── IntroOverlay ─────────────────────────────────────────────────────────────
// Behavior:
//   • On mount: overlay appears, WIDE animates in letter by letter (blur→clear)
//   • After AUTO_DISMISS_MS: only the WIDE text + kicker fade out
//     → The scroll indicator stays visible as a persistent hint
//   • On first scroll: the entire overlay (text + scroll indicator) dissolves
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS  = 4200; // time before WIDE text fades
const TEXT_FADE_DUR    = 0.9;  // duration of text-only fade
const OVERLAY_FADE_DUR = 1.1;  // duration of full overlay fade on scroll

export const IntroOverlay: React.FC = () => {
    const overlayRef   = useRef<HTMLDivElement>(null);
    const textAreaRef  = useRef<HTMLDivElement>(null);   // wraps kicker + h1
    const lettersRef   = useRef<(HTMLSpanElement | null)[]>([]);
    const kickerRef    = useRef<HTMLParagraphElement>(null);
    const scrollIndRef = useRef<HTMLDivElement>(null);

    const textFadedRef   = useRef(false);
    const overlayGoneRef = useRef(false);
    const [gone, setGone] = useState(false);

    // ── Fade out only the text content (timer-driven) ─────────────────────────
    const fadeOutText = () => {
        if (textFadedRef.current) return;
        textFadedRef.current = true;
        const area = textAreaRef.current;
        if (!area) return;
        gsap.to(area, { opacity: 0, y: -12, duration: TEXT_FADE_DUR, ease: 'power2.inOut' });
    };

    // ── Fade out entire overlay (scroll-driven) ────────────────────────────────
    const fadeOutAll = () => {
        if (overlayGoneRef.current) return;
        overlayGoneRef.current = true;
        const overlay = overlayRef.current;
        if (!overlay) { setGone(true); return; }
        gsap.to(overlay, {
            opacity: 0,
            scale: 1.012,
            duration: OVERLAY_FADE_DUR,
            ease: 'power2.inOut',
            onComplete: () => setGone(true),
        });
    };

    // ── Entry animation ───────────────────────────────────────────────────────
    useEffect(() => {
        const letters   = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
        const kicker    = kickerRef.current;
        const scrollInd = scrollIndRef.current;

        gsap.set(letters,   { opacity: 0, y: 18, filter: 'blur(8px)' });
        gsap.set(kicker,    { opacity: 0 });
        gsap.set(scrollInd, { opacity: 0 });

        const tl = gsap.timeline({ delay: 0.4 });

        tl.to(letters, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
            stagger: { each: 0.12 },
        }, 0);

        if (kicker) {
            tl.to(kicker, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.85);
        }
        if (scrollInd) {
            tl.to(scrollInd, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.2);
        }

        return () => { tl.kill(); };
    }, []);

    // ── Timer for text-only dismiss + scroll for full dismiss ──────────────────
    useEffect(() => {
        // After AUTO_DISMISS_MS: fade out only text
        const timer = setTimeout(fadeOutText, AUTO_DISMISS_MS);

        // On first scroll: fade out everything immediately
        const onScroll = () => {
            clearTimeout(timer);
            fadeOutAll();
        };
        window.addEventListener('scroll', onScroll, { passive: true, once: true });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', onScroll);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (gone) return null;

    const TITLE = 'WIDE';

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed', inset: 0, zIndex: 1999,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.92)',
                backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
                pointerEvents: overlayGoneRef.current ? 'none' : 'all',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
            }}
        >
            {/* Text content — fades out on timer */}
            <div ref={textAreaRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Kicker */}
                <p ref={kickerRef} style={{
                    color: 'rgba(255,255,255,0.28)',
                    fontSize: '0.68rem', fontWeight: 600,
                    letterSpacing: '0.30em', textTransform: 'uppercase',
                    margin: '0 0 clamp(10px, 2vw, 20px)', opacity: 0,
                }}>
                    Creative Studio
                </p>

                {/* WIDE */}
                <h1 style={{
                    display: 'flex',
                    gap: 'clamp(0.01em, 0.5vw, 0.05em)',
                    color: '#fff',
                    fontSize: 'clamp(5rem, 22vw, 18rem)',
                    fontWeight: 900, letterSpacing: '-0.04em',
                    lineHeight: 0.9, margin: 0,
                    textShadow: '0 0 100px rgba(255,255,255,0.05)',
                }}>
                    {TITLE.split('').map((ch, i) => (
                        <span
                            key={i}
                            ref={el => { lettersRef.current[i] = el; }}
                            style={{ display: 'inline-block' }}
                        >
                            {ch}
                        </span>
                    ))}
                </h1>
            </div>

            {/* Scroll indicator — stays until user scrolls */}
            <div ref={scrollIndRef} style={{
                position: 'absolute',
                bottom: 'clamp(28px, 5vw, 48px)',
                left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '10px', opacity: 0,
            }}>
                <span style={{
                    color: 'rgba(255,255,255,0.22)', fontSize: '0.6rem',
                    fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase',
                }}>
                    Scroll
                </span>
                {/* Animated flowing line */}
                <div style={{
                    position: 'relative', width: 1, height: 40,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    overflow: 'hidden', borderRadius: 1,
                }}>
                    <style>{`
                        @keyframes introScrollLine {
                            0%   { transform: translateY(-100%); }
                            100% { transform: translateY(200%); }
                        }
                        .intro-scroll-line {
                            animation: introScrollLine 1.6s cubic-bezier(0.4,0,0.2,1) infinite;
                        }
                    `}</style>
                    <div className="intro-scroll-line" style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '50%',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent)',
                    }} />
                </div>
            </div>
        </div>
    );
};

export default IntroOverlay;
