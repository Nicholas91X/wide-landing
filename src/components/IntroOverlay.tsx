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

interface IntroOverlayProps {
  onDismiss: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ onDismiss }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const goldLineRef = useRef<HTMLDivElement>(null);

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

    // Gold line — reveals after letters complete
    const goldLine = goldLineRef.current;
    if (goldLine) {
      gsap.set(goldLine, { scaleY: 0, transformOrigin: 'top center' });
      gsap.to(goldLine, {
        scaleY: 1,
        duration: 0.6,
        ease: 'power2.out',
        delay: 1.8,
      });
    }

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
        onDismiss();
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
          onDismiss();
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
  }, [prefersReduced, onDismiss]);

  const TITLE = "WIDE";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Introduzione Wide Studio Digitale — scorri per iniziare"
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
      }}
    >
      {/* Visually-hidden dismiss button — reachable via Tab for keyboard/AT users */}
      <button
        onClick={() => {
          const overlay = overlayRef.current;
          if (!overlay) return;
          if (prefersReduced) {
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
            document.body.style.overflow = "";
            window.scrollTo({ top: 0, behavior: "instant" });
            onDismiss();
          } else {
            import("gsap").then(({ gsap }) => {
              gsap.to(overlay, {
                opacity: 0,
                scale: 1.02,
                duration: 0.7,
                ease: "power2.inOut",
                onComplete: () => {
                  overlay.style.pointerEvents = "none";
                  document.body.style.overflow = "";
                  window.scrollTo({ top: 0, behavior: "instant" });
                  onDismiss();
                },
              });
            });
          }
        }}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Inizia a esplorare il sito
      </button>

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
            color: "var(--color-gold)",
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
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,0.85)",
            textShadow: [
              "-2px 0 rgba(255,70,70,0.08)",
              "2px 0 rgba(70,70,255,0.08)",
            ].join(","),
            fontSize: "clamp(5rem, 22vw, 18rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
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
        {/* Linea verticale oro — si rivela dopo WIDE */}
        <div
          ref={goldLineRef}
          style={{
            width: 1,
            height: 60,
            background: 'linear-gradient(to bottom, var(--color-gold), transparent)',
            margin: '12px auto 0',
            transformOrigin: 'top center',
          }}
        />
      </div>

      {/* Dismiss hint — chevron cascata + label ingrandita */}
      <div
        ref={swipeRef}
        style={{
          position: "absolute",
          bottom: "clamp(34px, 5vw, 52px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: 0,
          cursor: "pointer",
        }}
      >
        <style>{`
          @keyframes introChevCascade {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30%           { opacity: 1;   transform: translateY(2px); }
          }
        `}</style>

        {/* Cluster 3 chevron stacked — decorative */}
        <div
          aria-hidden="true"
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              aria-hidden="true"
              focusable="false"
              width="28"
              height="14"
              viewBox="0 0 28 14"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: prefersReduced ? 0.8 : 0.3,
                marginTop: i === 0 ? 0 : -6,
                animation: prefersReduced
                  ? "none"
                  : "introChevCascade 1.6s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <polyline points="2,2 14,12 26,2" />
            </svg>
          ))}
        </div>

        {/* Label primario bianco pieno */}
        <span
          style={{
            color: "#fff",
            fontSize: "0.82rem",
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Scorri
        </span>

        {/* Sub-label */}
        <span
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.62rem",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            letterSpacing: "0.1em",
            marginTop: -6,
          }}
        >
          o tocca per iniziare
        </span>
      </div>
    </div>
  );
};

export default IntroOverlay;
