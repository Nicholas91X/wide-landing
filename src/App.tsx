import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { ScrollVideo } from "./components/ScrollVideo";
import { NavBubble } from "./components/NavBubble";
import { IntroOverlay } from "./components/IntroOverlay";
import { LegalPage } from "./components/LegalPage";
import { SocialProof } from "./components/SocialProof";
import { Analytics } from "@vercel/analytics/react";

// Lazy-load below-the-fold sections to reduce initial JS payload
const Portfolio = lazy(() => import("./components/Portfolio"));
const ChiSiamo = lazy(() => import("./components/ChiSiamo"));
const Contatti = lazy(() => import("./components/Contatti"));
const Footer = lazy(() => import("./components/Footer"));

type LegalRoute = "privacy" | "cookie" | "note-legali" | null;

function getRouteFromPath(): LegalRoute {
  const path = window.location.pathname.replace(/^\//, "");
  if (path === "privacy" || path === "cookie" || path === "note-legali")
    return path;
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
      <main style={{ overflowX: "hidden" }}>
        <SocialProof />
        <section id="servizi">
          <div
            style={{
              backgroundColor: "#000",
              padding: "clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px) clamp(40px, 6vw, 80px)",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-subtitle)",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: "0 0 16px",
              }}
            >
              Servizi
            </p>
            <h2
              style={{
                color: "#fff",
                fontSize: "clamp(2.2rem, 7vw, 5rem)",
                fontFamily: "var(--font-title)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              I nostri<br />servizi.
            </h2>
          </div>
          <ScrollVideo />
        </section>
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
    </>
  );
}

function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      const threshold = window.innerHeight * 1.5;
      const contatti = document.getElementById("contatti");
      const contattiVisible = contatti
        ? contatti.getBoundingClientRect().top < window.innerHeight * 0.8
        : false;
      setVisible(window.scrollY > threshold && !contattiVisible);
      if (!visible) setDrawerOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  if (isMobile) {
    // Mobile: top drawer tab
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Drawer content — slides down */}
        <div
          style={{
            backgroundColor: "#fff",
            overflow: "hidden",
            maxHeight: drawerOpen ? "60px" : "0",
            opacity: drawerOpen ? 1 : 0,
            transition:
              "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
          }}
        >
          <button
            onClick={() => {
              setDrawerOpen(false);
              document
                .getElementById("contatti")
                ?.scrollIntoView({ behavior: "instant" });
            }}
            style={{
              background: "none",
              border: "none",
              color: "#000",
              fontSize: "0.7rem",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "18px 28px",
              whiteSpace: "nowrap",
            }}
          >
            Prenota una call
          </button>
        </div>

        {/* Tab handle — always visible when CTA is active */}
        <div
          onClick={() => setDrawerOpen((prev) => !prev)}
          style={{
            backgroundColor: "#fff",
            color: "#000",
            padding: "6px 20px 8px",
            borderRadius: "0 0 12px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            transition: "transform 0.3s ease",
          }}
        >
          <span
            style={{
              fontSize: "0.55rem",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Contattaci
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 0.3s ease",
              transform: drawerOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <polyline points="2,3.5 5,6.5 8,3.5" />
          </svg>
        </div>
      </div>
    );
  }

  // Desktop: bottom center button
  return (
    <button
      onClick={() => {
        document
          .getElementById("contatti")
          ?.scrollIntoView({ behavior: "instant" });
      }}
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
      Prenota una call
    </button>
  );
}

export default App;
