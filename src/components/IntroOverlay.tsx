import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

// ─── IntroOverlay ─────────────────────────────────────────────────────────────
// • Fixed dark overlay that appears on first load over the ScrollVideo section
// • "WIDE" fades in with a soft elegant animation, letter-by-letter stagger
// • "Creative Studio" kicker fades in below
// • Scroll indicator pulses at bottom
// • Dismisses softly after AUTO_DISMISS_MS — or instantly on first scroll
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4200; // time before auto-dismiss begins
const DISMISS_DURATION = 1.1; // seconds for the fade-out

export const IntroOverlay: React.FC = () => {
    const overlayRef  = useRef<HTMLDivElement>(null);
    const lettersRef  = useRef<(HTMLSpanElement | null)[]>([]);
    const kickerRef   = useRef<HTMLParagraphElement>(null);
    const scrollIndRef = useRef<HTMLDivElement>(null);
    const dismissedRef = useRef(false);
    const [gone, setGone] = useState(false);

    // ── Dismiss helper ────────────────────────────────────────────────────────
    const dismiss = () => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;

        const el = overlayRef.current;
        if (!el) { setGone(true); return; }

        gsap.to(el, {
            opacity: 0,
            scale: 1.015,          // very subtle scale-up as it breathes out
            duration: DISMISS_DURATION,
            ease: 'power2.inOut',
            onComplete: () => setGone(true),
        });
    };

    // ── Entry animation ───────────────────────────────────────────────────────
    useEffect(() => {
        const letters  = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
        const kicker   = kickerRef.current;
        const scrollInd = scrollIndRef.current;

        // Initial state — everything invisible
        gsap.set(letters,   { opacity: 0, y: 18, filter: 'blur(8px)' });
        gsap.set([kicker, scrollInd].filter(Boolean), { opacity: 0 });

        const tl = gsap.timeline({ delay: 0.4 });

        // Letters fade in one by one — soft blur-to-clear
        tl.to(letters, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.0,
            ease: 'power3.out',
            stagger: { each: 0.12 },
        }, 0);

        // Kicker
        if (kicker) {
            tl.to(kicker, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.85);
        }

        // Scroll indicator
        if (scrollInd) {
            tl.to(scrollInd, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.15);
        }

        return () => { tl.kill(); };
    }, []);

    // ── Auto-dismiss + scroll-dismiss ─────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
        const onScroll = () => { clearTimeout(timer); dismiss(); };

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
                position: 'fixed',
                inset: 0,
                zIndex: 1999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.92)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                pointerEvents: dismissedRef.current ? 'none' : 'all',
                // subtle noise texture via background blend
                backgroundImage: [
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
                    'none',
                ].join(', '),
            }}
        >
            {/* Kicker */}
            <p
                ref={kickerRef}
                style={{
                    color: 'rgba(255,255,255,0.28)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    letterSpacing: '0.30em',
                    textTransform: 'uppercase',
                    margin: '0 0 clamp(10px, 2vw, 20px)',
                    opacity: 0,
                }}
            >
                Creative Studio
            </p>

            {/* WIDE — letter by letter */}
            <h1 style={{
                display: 'flex',
                gap: 'clamp(0.01em, 0.5vw, 0.05em)',
                color: '#fff',
                fontSize: 'clamp(5rem, 22vw, 18rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                margin: 0,
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

            {/* Scroll indicator */}
            <div
                ref={scrollIndRef}
                style={{
                    position: 'absolute',
                    bottom: 'clamp(28px, 5vw, 48px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: 0,
                }}
            >
                <span style={{
                    color: 'rgba(255,255,255,0.22)',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                }}>
                    Scroll
                </span>
                {/* Animated line */}
                <div style={{ position: 'relative', width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', borderRadius: 1 }}>
                    <style>{`
                        @keyframes introScrollLine {
                            0%   { transform: translateY(-100%); }
                            100% { transform: translateY(200%); }
                        }
                        .intro-scroll-line {
                            animation: introScrollLine 1.6s cubic-bezier(0.4,0,0.2,1) infinite;
                        }
                    `}</style>
                    <div
                        className="intro-scroll-line"
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%',
                            height: '50%',
                            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default IntroOverlay;
