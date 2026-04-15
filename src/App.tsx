import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { NavBubble } from "./components/NavBubble";
import { IntroOverlay } from "./components/IntroOverlay";
import { LegalPage } from "./components/LegalPage";
import { SocialProof } from "./components/SocialProof";
import { Analytics } from "@vercel/analytics/react";
import { trackCTAClick } from "./utils/analytics";
import { CookieBanner } from "./components/CookieBanner";

// Lazy-load all sections below SocialProof to reduce initial JS payload
const ScrollVideo = lazy(() =>
  import("./components/ScrollVideo").then((m) => ({ default: m.ScrollVideo })),
);
const Portfolio = lazy(() => import("./components/Portfolio"));
const ChiSiamo = lazy(() => import("./components/ChiSiamo"));
const Contatti = lazy(() => import("./components/Contatti"));
const Footer = lazy(() => import("./components/Footer"));

type LegalRoute = "privacy" | "cookie" | "note-legali" | "audit-privacy" | "audit-termini" | null;

function getRouteFromPath(): LegalRoute {
  const path = window.location.pathname.replace(/^\//, "");
  
  if (path === "audit") {
    window.location.href = "/audit/";
    return null;
  }
  
  if (path === "privacy" || path === "cookie" || path === "note-legali" || path === "audit-privacy" || path === "audit-termini")
    return path as LegalRoute;
    
  return null;
}

function App() {
  const [legalPage, setLegalPage] = useState<LegalRoute>(getRouteFromPath);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(true);
    // User already scrolled immediately on load, e.g. refreshed halfway down
    if (window.scrollY > 10) onScroll();

    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPopState = () => setLegalPage(getRouteFromPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goBack = useCallback(() => {
    window.history.pushState(null, "", "/");
    setLegalPage(null);
  }, []);

  if (legalPage) {
    return (
      <>
        <LegalPage page={legalPage} onBack={goBack} />
        <CookieBanner />
        <Analytics />
      </>
    );
  }

  return (
    <>
      {/* NavBubble OUTSIDE <main> to prevent GSAP pin transforms
                from creating a containing block that breaks position:fixed */}
      <NavBubble />
      <IntroOverlay />
      {/* LCP hint: browser registers this as LCP candidate eagerly */}
      <img
        src={
          window.matchMedia("(max-width: 767px)").matches
            ? "/frames_9_16/section-2/frame_0001.webp"
            : "/frames/section-2/frame_0001.webp"
        }
        fetchPriority="high"
        decoding="sync"
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
        alt=""
      />
      <main style={{ overflowX: "hidden" }}>
        <SocialProof />
        <Suspense
          fallback={<div style={{ background: "#000", minHeight: "100vh" }} />}
        >
          <section id="servizi">
            <ScrollVideo />
          </section>
        </Suspense>
        {/* Gradient fade divider */}
        <div
          style={{
            height: "clamp(80px, 12vw, 160px)",
            background:
              "linear-gradient(to bottom, #000 0%, #0a0a0a 30%, #111 50%, #0a0a0a 70%, #000 100%)",
          }}
        />
        {/* Below-the-fold sections — lazy loaded, deferred until user scrolls */}
        {hasScrolled && (
          <Suspense
            fallback={
              <div style={{ background: "#000", minHeight: "100vh" }} />
            }
          >
            <section id="chi-siamo">
              <ChiSiamo />
            </section>
            {/* Gradient fade divider */}
            <div
              style={{
                height: "clamp(80px, 12vw, 160px)",
                background:
                  "linear-gradient(to bottom, #000 0%, #0a0a0a 30%, #111 50%, #0a0a0a 70%, #000 100%)",
              }}
            />
            <section id="portfolio">
              <Portfolio />
            </section>
            {/* Gradient fade divider */}
            <div
              style={{
                height: "clamp(80px, 12vw, 160px)",
                background:
                  "linear-gradient(to bottom, #000 0%, #0a0a0a 30%, #111 50%, #0a0a0a 70%, #000 100%)",
              }}
            />
            <section id="contatti">
              <Contatti />
            </section>
            {/* Gradient fade — cream (#ece8e0) → black, bridges Contatti → Footer */}
            <div
              style={{
                height: "clamp(60px, 10vw, 120px)",
                background: "linear-gradient(to bottom, #ece8e0 0%, #000 100%)",
                pointerEvents: "none",
              }}
            />
            <Footer />
          </Suspense>
        )}
        <Analytics />
      </main>

      {/* ── Floating CTA — appears after scrolling past the intro ──── */}
      <FloatingCTA />
      <CookieBanner />
    </>
  );
}

function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    onChange(mq);
    mq.addEventListener("change", onChange as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener(
        "change",
        onChange as (e: MediaQueryListEvent) => void,
      );
  }, []);

  useEffect(() => {
    const onScroll = () => {
      // Show only after ScrollVideo ends — "chi-siamo" entering viewport
      // confirms the user has cleared the entire pinned scroll section.
      const chiSiamo = document.getElementById("chi-siamo");
      const pastScrollVideo = chiSiamo
        ? chiSiamo.getBoundingClientRect().top <= window.innerHeight * 0.7
        : false;

      // Hide as soon as Contatti section starts entering the viewport
      // so the CTA never obscures the booking form.
      const contatti = document.getElementById("contatti");
      const contattiApproaching = contatti
        ? contatti.getBoundingClientRect().top < window.innerHeight * 1.1
        : false;

      // Also hide when near the very bottom (footer area).
      const nearBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 120;

      setVisible(pastScrollVideo && !contattiApproaching && !nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToContatti = () => {
    trackCTAClick('floating-cta');
    document.getElementById("contatti")?.scrollIntoView({ behavior: "instant" });
  };

  if (isMobile) {
    // Mobile: bottom pill — single tap, thumb-reachable zone.
    // Slides up from below rather than dropping from the top.
    return (
      <div
        style={{
          position: "fixed",
          bottom: "clamp(16px, 5vw, 28px)",
          left: "50%",
          transform: `translateX(-50%) translateY(${visible ? "0" : "100px"})`,
          zIndex: 2000,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition:
            "transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease",
        }}
      >
        <button
          onClick={goToContatti}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "15px 32px",
            backgroundColor: "#fff",
            color: "#000",
            border: "none",
            borderRadius: "0",
            fontSize: "0.72rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
          }}
        >
          Prenota una call gratuita
          <span style={{ fontSize: "0.9rem" }}>→</span>
        </button>
      </div>
    );
  }

  // Desktop: bottom center button
  return (
    <button
      onClick={goToContatti}
      style={{
        position: "fixed",
        bottom: "clamp(20px, 4vw, 32px)",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "80px"})`,
        zIndex: 2000,
        padding: "12px 28px",
        backgroundColor: "#fff",
        color: "#000",
        border: "none",
        borderRadius: "0",
        fontSize: "0.7rem",
        fontFamily: "var(--font-subtitle)",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateX(-50%) translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateX(-50%) translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
      }}
    >
      Prenota una call gratuita
    </button>
  );
}

export default App;
