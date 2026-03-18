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
      if (e.key === "ArrowDown" || e.key === " ") dismiss();
    };

    // Wait a short moment so the intro animation is visible before allowing dismiss
    const timer = setTimeout(() => {
      window.addEventListener("wheel", dismiss, { once: true, passive: true });
      window.addEventListener("touchstart", dismiss, {
        once: true,
        passive: true,
      });
      window.addEventListener("keydown", onKey);
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchstart", dismiss);
      window.removeEventListener("keydown", onKey);
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

      {/* Swipe hand indicator — bottom, replaces old Scroll + line */}
      <div
        ref={swipeRef}
        style={{
          position: "absolute",
          bottom: "clamp(32px, 6vw, 56px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: 0,
        }}
      >
        <style>{`
          @keyframes introSwipeVertical {
            0%, 100% { transform: translateY(8px); opacity: 0.5; }
            50% { transform: translateY(-18px); opacity: 1; }
          }
        `}</style>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            display: "block",
            animation: "introSwipeVertical 3s infinite ease-in-out",
          }}
        >
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2v0" />
          <path d="M6 14v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2v0" />
          <path d="M18 11h2a2 2 0 0 1 2 2v3.7c0 3.3-2.3 6.3-5.5 7L12 24l-6.5-6.5M6 14v4l-3-1.5" />
        </svg>
        <span
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Scorri
        </span>
      </div>
    </div>
  );
};

export default IntroOverlay;
