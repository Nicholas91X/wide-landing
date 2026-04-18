import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { trackSectionView, trackCTAClick } from "../utils/analytics";

gsap.registerPlugin(ScrollTrigger);

const GAME_URL = "https://game.widestudiodigitale.com";

export const GameReminder: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const prefersReduced = useReducedMotion();

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
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackSectionView("game-reminder");
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReduced) {
      [eyebrowRef, titleRef, bodyRef, quoteRef, ctaRef, videoWrapRef].forEach(
        (r) => {
          if (r.current) gsap.set(r.current, { opacity: 1, y: 0 });
        },
      );
      return;
    }

    const ctx = gsap.context(() => {
      const items = [
        eyebrowRef.current,
        titleRef.current,
        bodyRef.current,
        quoteRef.current,
        ctaRef.current,
      ].filter(Boolean) as HTMLElement[];

      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            once: true,
          },
        },
      );

      if (videoWrapRef.current) {
        gsap.fromTo(
          videoWrapRef.current,
          { opacity: 0, scale: 0.96 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  const handleCtaClick = () => {
    trackCTAClick("game_play");
  };

  return (
    <section
      ref={sectionRef}
      id="gioco"
      style={{
        position: "relative",
        backgroundColor: "#050505",
        padding: isMobile
          ? "clamp(60px, 12vw, 100px) 24px"
          : "clamp(100px, 14vw, 180px) clamp(40px, 6vw, 96px)",
        overflow: "hidden",
      }}
    >
      {/* Ornamento numerico decorativo di sfondo */}
      <div
        aria-hidden={true}
        style={{
          position: "absolute",
          right: "-3vw",
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "var(--font-title)",
          fontWeight: 900,
          fontSize: "clamp(120px, 28vw, 320px)",
          color: "rgba(197,165,90,0.04)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "-0.05em",
        }}
      >
        03·5
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.1fr",
          gap: isMobile ? "clamp(36px, 7vw, 56px)" : "clamp(56px, 8vw, 100px)",
          alignItems: "center",
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Colonna testo */}
        <div style={{ order: isMobile ? 2 : 1 }}>
          <div
            ref={eyebrowRef}
            style={{
              fontFamily: "var(--font-title)",
              fontSize: isMobile ? "0.62rem" : "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span
              style={{
                width: 32,
                height: 1,
                background: "var(--color-gold)",
                opacity: 0.6,
              }}
            />
            Un Gioco
          </div>

          <h3
            ref={titleRef}
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: isMobile
                ? "2.2rem"
                : "clamp(2.6rem, 5.5vw, 4.4rem)",
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              color: "#fff",
              margin: "0 0 24px",
            }}
          >
            Imprenditore
            <br />
            per un giorno.
          </h3>

          <p
            ref={bodyRef}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.95rem" : "1.05rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.82)",
              margin: "0 0 22px",
              maxWidth: "50ch",
            }}
          >
            Un gioco interattivo con storia generata in tempo reale
            dall'intelligenza artificiale: scegli il tuo prodotto, guida la
            strategia, scopri che imprenditore saresti. In 3 minuti.
          </p>

          <p
            ref={quoteRef}
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: isMobile ? "1rem" : "clamp(1.1rem, 2vw, 1.3rem)",
              lineHeight: 1.45,
              color: "var(--color-gold)",
              margin: "0 0 36px",
              paddingLeft: 18,
              borderLeft: "2px solid rgba(197,165,90,0.5)",
              maxWidth: "42ch",
            }}
          >
            "Il modo più rapido per capire come lavoriamo: farlo provare."
          </p>

          <a
            ref={ctaRef}
            href={GAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="ring"
            onClick={handleCtaClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: isMobile ? "14px 26px" : "16px 32px",
              backgroundColor: "var(--color-gold)",
              color: "#0a0a0a",
              fontSize: isMobile ? "0.82rem" : "0.88rem",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 999,
              border: "1px solid var(--color-gold)",
              boxShadow:
                "0 8px 28px rgba(197,165,90,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
              transition:
                "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 36px rgba(197,165,90,0.4), inset 0 1px 0 rgba(255,255,255,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 28px rgba(197,165,90,0.25), inset 0 1px 0 rgba(255,255,255,0.35)";
            }}
          >
            Gioca ora
            <span style={{ fontSize: "1.05em", lineHeight: 1 }}>→</span>
          </a>

          <div
            style={{
              marginTop: 18,
              fontSize: "0.68rem",
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.08em",
            }}
          >
            game.widestudiodigitale.com · gratuito · 3 minuti
          </div>
        </div>

        {/* Colonna video */}
        <div
          ref={videoWrapRef}
          style={{
            order: isMobile ? 1 : 2,
            position: "relative",
            borderRadius: 6,
            overflow: "hidden",
            aspectRatio: "9 / 16",
            maxWidth: isMobile ? 280 : 380,
            marginLeft: isMobile ? "auto" : 0,
            marginRight: isMobile ? "auto" : 0,
            width: "100%",
            border: "1px solid rgba(197,165,90,0.25)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <video
            ref={videoRef}
            src="/videos/game-preview.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden={true}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* Gradient overlay bottom per leggere un eventuale overlay futuro */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, transparent 60%, rgba(5,5,5,0.35) 100%)",
              pointerEvents: "none",
            }}
          />
          {/* Badge live in alto */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              padding: "4px 10px",
              background: "rgba(5,5,5,0.75)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(197,165,90,0.4)",
              borderRadius: 999,
              fontSize: "0.58rem",
              fontFamily: "var(--font-title)",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-gold)",
                boxShadow: "0 0 8px rgba(197,165,90,0.8)",
              }}
            />
            Live
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameReminder;
