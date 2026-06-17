import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { NavBubble } from "./components/NavBubble";
import { IntroOverlay } from "./components/IntroOverlay";
import { LegalPage } from "./components/LegalPage";
import { SocialProof } from "./components/SocialProof";
import { ServicesHeader } from "./components/ServicesHeader";
import { Analytics } from "@vercel/analytics/react";
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
  const [showIntro, setShowIntro] = useState(true);

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

  const handleIntroDismiss = useCallback(() => {
    // Non più localStorage — l'intro si mostra a ogni refresh
    setShowIntro(false);
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
      <CustomCursor />
      {/* NavBubble OUTSIDE <main> to prevent GSAP pin transforms
                from creating a containing block that breaks position:fixed */}
      <NavBubble />
      {showIntro && (
        <IntroOverlay onDismiss={handleIntroDismiss} />
      )}
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
      <main>
        <SocialProof />
        <ServicesHeader />
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

      <CookieBanner />
    </>
  );
}

export default App;
