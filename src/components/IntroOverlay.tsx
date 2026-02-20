import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

// ─── IntroOverlay ─────────────────────────────────────────────────────────────
// Behavior:
//   • On mount: overlay appears, WIDE animates in letter-by-letter (blur→clear)
//   • After AUTO_DISMISS_MS: only WIDE text + kicker fade out.
//     The scroll indicator stays visible.
//   • Scroll-reactive: overlay hides when scrollY > THRESHOLD,
//     reappears when scrollY returns to top. No DOM removal — just opacity.
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4200;
const SCROLL_THRESHOLD = 20; // px: hide overlay when scrolled past this

export const IntroOverlay: React.FC = () => {
    const overlayRef   = useRef<HTMLDivElement>(null);
    const textAreaRef  = useRef<HTMLDivElement>(null);
    const lettersRef   = useRef<(HTMLSpanElement | null)[]>([]);
    const kickerRef    = useRef<HTMLParagraphElement>(null);
    const scrollIndRef = useRef<HTMLDivElement>(null);

    const textFadedRef    = useRef(false);
    const overlayShownRef = useRef(true); // tracks current visibility

    // ── Text-only fade (timer-driven) ─────────────────────────────────────────
    const fadeOutText = () => {
        if (textFadedRef.current) return;
        textFadedRef.current = true;
        const area = textAreaRef.current;
        if (!area) return;
        gsap.to(area, { opacity: 0, y: -14, duration: 0.9, ease: 'power2.inOut' });
    };

    // ── Entry animation ───────────────────────────────────────────────────────
    useEffect(() => {
        const letters   = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
        const kicker    = kickerRef.current;
        const scrollInd = scrollIndRef.current;

        gsap.set(letters,   { opacity: 0, y: 16, filter: 'blur(10px)' });
        if (kicker)    gsap.set(kicker,    { opacity: 0 });
        if (scrollInd) gsap.set(scrollInd, { opacity: 0 });

        const tl = gsap.timeline({ delay: 0.4 });
        tl.to(letters, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
            stagger: { each: 0.12 },
        }, 0);
        if (kicker)    tl.to(kicker,    { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.85);
        if (scrollInd) tl.to(scrollInd, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.2);

        return () => { tl.kill(); };
    }, []);

    // ── Auto-fade text after timer ────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(fadeOutText, AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Scroll-reactive visibility ────────────────────────────────────────────
    useEffect(() => {
        const updateVisibility = () => {
            const overlay = overlayRef.current;
            if (!overlay) return;
            const atTop = window.scrollY <= SCROLL_THRESHOLD;

            if (atTop && !overlayShownRef.current) {
                // Reappear when back at top
                overlayShownRef.current = true;
                overlay.style.pointerEvents = 'all';
                gsap.killTweensOf(overlay);
                gsap.to(overlay, { opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out' });
            } else if (!atTop && overlayShownRef.current) {
                // Hide when scrolled away
                overlayShownRef.current = false;
                gsap.killTweensOf(overlay);
                gsap.to(overlay, {
                    opacity: 0, scale: 1.012, duration: 0.45, ease: 'power2.in',
                    onComplete: () => { if (overlay) overlay.style.pointerEvents = 'none'; },
                });
            }
        };

        window.addEventListener('scroll', updateVisibility, { passive: true });
        return () => window.removeEventListener('scroll', updateVisibility);
    }, []);

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
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
            }}
        >
            {/* Text content — auto-fades after timer, does not return */}
            <div ref={textAreaRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p ref={kickerRef} style={{
                    color: 'rgba(255,255,255,0.28)', fontSize: '0.68rem', fontWeight: 600,
                    letterSpacing: '0.30em', textTransform: 'uppercase',
                    margin: '0 0 clamp(10px, 2vw, 20px)', opacity: 0,
                }}>
                    Creative Studio
                </p>
                <h1 style={{
                    display: 'flex', gap: 'clamp(0.01em, 0.5vw, 0.05em)',
                    color: '#fff', fontSize: 'clamp(5rem, 22vw, 18rem)',
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

            {/* Scroll indicator — stays with overlay, reappears with it */}
            <div ref={scrollIndRef} style={{
                position: 'absolute',
                bottom: 'clamp(32px, 6vw, 56px)',
                left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '12px', opacity: 0,
            }}>
                <span style={{
                    color: 'rgba(255,255,255,0.50)',  // brighter
                    fontSize: '0.75rem',               // larger
                    fontWeight: 600,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                }}>
                    Scroll
                </span>
                {/* Animated flowing line */}
                <div style={{
                    position: 'relative',
                    width: '1.5px', height: 52,          // larger
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    overflow: 'hidden', borderRadius: 2,
                }}>
                    <style>{`
                        @keyframes introScrollLine {
                            0%   { transform: translateY(-100%); }
                            100% { transform: translateY(250%); }
                        }
                        .intro-scroll-line {
                            animation: introScrollLine 1.7s cubic-bezier(0.4,0,0.2,1) infinite;
                        }
                    `}</style>
                    <div className="intro-scroll-line" style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '45%',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.85), transparent)',
                    }} />
                </div>
            </div>
        </div>
    );
};

export default IntroOverlay;
