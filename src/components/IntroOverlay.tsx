import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";

// ─── IntroOverlay ─────────────────────────────────────────────────────────────
// Behavior:
//   • On mount: overlay appears, WIDE animates in letter-by-letter (blur→clear)
//   • WIDE text + kicker loop: fade in → hold → fade out → repeat
//   • Swipe hand icon at bottom replaces old scroll indicator
//   • Scroll-reactive: overlay hides when scrollY > THRESHOLD,
//     reappears when scrollY returns to top. No DOM removal — just opacity.
// ─────────────────────────────────────────────────────────────────────────────

export const IntroOverlay: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);

  const overlayShownRef = useRef(true);

  const prefersReduced = useReducedMotion();

  // ── Looping WIDE animation ──────────────────────────────────────────────
  useEffect(() => {
    const letters = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
    const kicker = kickerRef.current;
    const swipe = swipeRef.current;

    if (prefersReduced) {
      gsap.set(letters, { opacity: 1, y: 0, filter: "blur(0px)" });
      if (kicker) gsap.set(kicker, { opacity: 1 });
      if (swipe) gsap.set(swipe, { opacity: 1 });
      return;
    }

    // Initial state
    gsap.set(letters, { opacity: 0, y: 16, filter: "blur(10px)" });
    if (kicker) gsap.set(kicker, { opacity: 0 });
    if (swipe) gsap.set(swipe, { opacity: 0 });

    // Swipe indicator — fade in once, stays forever (separate from loop)
    if (swipe)
      gsap.to(swipe, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        delay: 1.6,
      });

    // Looping timeline: fade in → hold → fade out → pause → repeat
    const tl = gsap.timeline({ repeat: -1, delay: 0.4 });

    // Phase 1: letters appear one by one (1.5s)
    tl.to(
      letters,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.5,
        ease: "power3.out",
        stagger: { each: 0.18 },
      },
      0,
    );
    // Kicker fades in
    if (kicker)
      tl.to(kicker, { opacity: 1, duration: 1.0, ease: "power2.out" }, 1.0);

    // Phase 2: hold visible
    tl.to({}, { duration: 5.0 });

    // Phase 3: fade out text + kicker (slower)
    const fadeOutTime = tl.duration();
    tl.to(
      letters,
      {
        opacity: 0,
        y: -14,
        filter: "blur(8px)",
        duration: 1.2,
        ease: "power2.inOut",
        stagger: { each: 0.08 },
      },
      fadeOutTime,
    );
    if (kicker)
      tl.to(
        kicker,
        { opacity: 0, duration: 0.9, ease: "power2.inOut" },
        fadeOutTime,
      );

    // Phase 4: pause before restarting
    tl.to({}, { duration: 2.5 });

    // Reset letters for next loop iteration
    const resetTime = tl.duration();
    tl.set(letters, { y: 16, filter: "blur(10px)" }, resetTime);

    return () => {
      tl.kill();
    };
  }, [prefersReduced]);

  // ── Gesture-triggered dismissal ────────────────────────────────────────────
  // Lock scroll on mount. On first wheel/touch, animate overlay out,
  // then unlock scroll and reset scrollY to 0 so SocialProof is fully visible.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Lock scroll immediately
    document.body.style.overflow = "hidden";

    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;

      // Remove listeners immediately
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchstart", dismiss);
      window.removeEventListener("keydown", onKey);

      if (prefersReduced) {
        // Skip animation for reduced-motion users
        overlay.style.opacity = "0";
        overlay.style.pointerEvents = "none";
        overlayShownRef.current = false;
        document.body.style.overflow = "";
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }

      // Animate overlay out
      gsap.to(overlay, {
        opacity: 0,
        scale: 1.02,
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => {
          overlay.style.pointerEvents = "none";
          overlayShownRef.current = false;
          // Unlock scroll and reset to top
          document.body.style.overflow = "";
          window.scrollTo({ top: 0, behavior: "instant" });
        },
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " " || e.key === "Enter") dismiss();
    };

    // Register dismiss handlers immediately — no artificial delay.
    // A 100ms micro-delay is the only guard against page-load scroll inertia
    // accidentally firing on the very first paint.
    const timer = setTimeout(() => {
      window.addEventListener("wheel", dismiss, { once: true, passive: true });
      window.addEventListener("touchstart", dismiss, {
        once: true,
        passive: true,
      });
      window.addEventListener("keydown", onKey);
      // Direct click/tap on the overlay itself also dismisses
      overlay.addEventListener("click", dismiss, { once: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchstart", dismiss);
      window.removeEventListener("keydown", onKey);
      overlay.removeEventListener("click", dismiss);
      document.body.style.overflow = "";
    };
  }, [prefersReduced]);

  const TITLE = "WIDE";

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        transition: "opacity 0.8s ease, background-color 0.8s ease",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
      }}
    >
      {/* Text content — loops: fade in → hold → fade out → repeat */}
      <div
        ref={textAreaRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p
          ref={kickerRef}
          style={{
            color: "rgba(255,255,255,0.28)",
            fontSize: "0.68rem",
            fontWeight: 600,
            letterSpacing: "0.30em",
            textTransform: "uppercase",
            margin: "0 0 clamp(10px, 2vw, 20px)",
            opacity: 0,
          }}
        >
          Studio Digitale
        </p>
        <div
          style={{
            display: "flex",
            gap: "clamp(0.01em, 0.5vw, 0.05em)",
            color: "#fff",
            fontSize: "clamp(5rem, 22vw, 18rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
            textShadow: "0 0 100px rgba(255,255,255,0.05)",
          }}
        >
          {TITLE.split("").map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                lettersRef.current[i] = el;
              }}
              style={{ display: "inline-block" }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss hint — bottom center, fades in after the logo animation */}
      <div
        ref={swipeRef}
        style={{
          position: "absolute",
          bottom: "clamp(28px, 5vw, 48px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: 0,
          cursor: "pointer",
        }}
      >
        <style>{`
          @keyframes introScrollDrop {
            0%   { opacity: 0;   transform: translateY(-4px); }
            40%  { opacity: 0.8; transform: translateY(0);    }
            100% { opacity: 0;   transform: translateY(7px);  }
          }
          @keyframes introPulse {
            0%, 100% { opacity: 0.55; }
            50%      { opacity: 1; }
          }
        `}</style>

        {/* Animated vertical line + arrow */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 1,
              height: 28,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.05))",
              animation: "introScrollDrop 2s ease-in-out infinite",
            }}
          />
          <svg
            width="12"
            height="7"
            viewBox="0 0 12 7"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1,1 6,6 11,1" />
          </svg>
        </div>

        {/* Label — explicit and actionable */}
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.65rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            animation: "introPulse 3s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          Scorri o tocca per iniziare
        </span>
      </div>
    </div>
  );
};

export default IntroOverlay;
