import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trackSectionView, trackCTAClick } from "../utils/analytics";

gsap.registerPlugin(ScrollTrigger);

// ─── Metrics Data ────────────────────────────────────────────────────────────
const METRICS = [
  { prefix: "+", value: "40", suffix: "%", label: "Aumento test drive prenotati" },
  { prefix: "", value: "3", suffix: "× clienti nuovi", label: "Rispetto alla media pre-lancio" },
  { prefix: "", value: "6", suffix: " mesi", label: "Per stabilire il brand sul territorio" },
];

// ─── MediaSlot helper (video-ready) ─────────────────────────────────────────
/** Renders Bunny <iframe> if src is an embed URL, <video> if direct file, else <img> */
function MediaSlot({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  const isBunnyEmbed = /iframe\.mediadelivery\.net\/embed\//.test(src);
  const isVideo = /\.(mp4|webm|mov)$/i.test(src);

  if (isBunnyEmbed) {
    return (
      <iframe
        src={src}
        title={alt}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{
          border: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...style,
        }}
      />
    );
  }
  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.95)', filter: 'brightness(0.8)', ...style }}
    />
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export const SocialProof: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);
  const metricRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  // ── Scroll-triggered fade-in animations ─────────────────────────────────
  useEffect(() => {
    const heroEl = heroRef.current;
    const caseEl = caseRef.current;
    if (!heroEl || !caseEl) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const heroChildren = heroEl.querySelectorAll<HTMLElement>(".sp-anim");
    const caseChildren = caseEl.querySelectorAll<HTMLElement>(".sp-anim");
    const heroH2 = heroEl.querySelector('h2');

    gsap.set([...heroChildren, ...caseChildren], { opacity: 0, y: 30 });

    if (heroH2 && !prefersReduced) {
      gsap.set(heroH2, { opacity: 1, y: 0, clipPath: 'inset(0 0 100% 0)' });
    }

    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: "top 80%",
        once: true,
      },
    });
    tl1.to(heroChildren, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.15,
    });

    if (heroH2 && !prefersReduced) {
      tl1.to(heroH2, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.75,
        ease: 'power3.out',
      }, 0);
    }

    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: caseEl,
        start: "top 80%",
        once: true,
      },
    });
    tl2.to(caseChildren, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.12,
    });

    return () => {
      tl1.kill();
      tl2.kill();
    };
  }, []);

  // ── Count-up animation for metrics ──────────────────────────────────────
  useEffect(() => {
    const refs = metricRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!refs.length) return;

    const counters = METRICS.map((m) => ({ target: parseInt(m.value.replace(/\D/g, ''), 10) }));
    const triggered = { done: false };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || triggered.done) return;
        triggered.done = true;
        observer.disconnect();

        refs.forEach((el, i) => {
          const target = counters[i].target;
          const suffix = METRICS[i].suffix;
          const prefix = METRICS[i].prefix || "";
          const duration = 1.4;
          const obj = { val: 0 };

          gsap.to(obj, {
            val: target,
            duration,
            ease: "power2.out",
            delay: i * 0.12,
            onUpdate() {
              const v = Math.round(obj.val);
              const formatted = v >= 1000
                ? (v >= 10000 ? (v >= 100000 ? v.toLocaleString('it-IT') : v.toLocaleString('it-IT')) : v.toLocaleString('it-IT'))
                : String(v);
              el.textContent = prefix + formatted + suffix;
            },
            onComplete() {
              // Ensure final value is exact
              const formattedTarget = target >= 1000 ? target.toLocaleString('it-IT') : String(target);
              el.textContent = prefix + formattedTarget + suffix;
            },
          });
        });
      },
      { threshold: 0.4 }
    );

    // Observe the metrics container (caseRef)
    if (caseRef.current) observer.observe(caseRef.current);

    return () => observer.disconnect();
  }, []);

  // ── Track section visibility for analytics ─────────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { trackSectionView('social-proof'); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      style={{ backgroundColor: 'var(--color-bg)', color: "#fff", width: "100%", position: 'relative' }}
    >
      {/* Grid lines decorative */}
      <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: isMobile ? 24 : 48, width: 1, background: 'rgba(255,255,255,0.025)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, right: isMobile ? 24 : 48, width: 1, background: 'rgba(255,255,255,0.025)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── BLOCCO A — Hero Statement ──────────────────────────────────── */}
      <div
        ref={heroRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: isMobile
            ? "clamp(130px, 30vw, 180px) 24px clamp(60px, 12vw, 100px)"
            : "clamp(100px, 14vw, 180px) clamp(40px, 8vw, 120px) clamp(80px, 12vw, 160px)",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Eyebrow */}
        <p
          className="sp-anim"
          style={{
            color: "var(--color-gold)",
            fontSize: "0.72rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: "0 0 20px",
          }}
        >
          Wide Studio Digitale
        </p>

        {/* Headline */}
        <h2
          className="sp-anim"
          style={{
            fontSize: isMobile
              ? "clamp(1.8rem, 8vw, 2.6rem)"
              : "clamp(2.4rem, 5.5vw, 3.8rem)",
            fontFamily: "'Gordita', sans-serif",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            margin: "0 0 24px",
            color: "#fff",
          }}
        >
          Hai costruito qualcosa di solido
        </h2>

        {/* Subtitle */}
        <p
          className="sp-anim"
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: 700,
            margin: "0 0 16px",
          }}
        >
          Facciamolo vedere.
        </p>

        {/* Description */}
        <p
          className="sp-anim"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "clamp(1rem, 2vw, 1.15rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: 700,
            margin: "0 0 40px",
          }}
        >
          Affianchiamo imprenditori del Nord Italia per aiutarli a pubblicizzarsi online e attrarre nuovi clienti
        </p>

        {/* CTA */}
        <button
          className="sp-anim"
          data-cursor="ring"
          onClick={() => {
            trackCTAClick('hero');
            document
              .getElementById("contatti")
              ?.scrollIntoView({ behavior: "instant" });
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 32px",
            backgroundColor: "#fff",
            color: "#000",
            border: "none",
            borderRadius: 0,
            fontSize: "0.8rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 8px 30px rgba(255,255,255,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Contattaci senza impegno
          <span style={{ fontSize: "0.9rem" }}>→</span>
        </button>

        {/* Secondary CTA */}
        <button
          className="sp-anim"
          data-cursor="ring"
          onClick={() => {
            document
              .getElementById("portfolio")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 32px",
            backgroundColor: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 0,
            fontSize: "0.8rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
            marginTop: 16,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.borderColor = "var(--color-gold)";
            e.currentTarget.style.color = "var(--color-gold)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            e.currentTarget.style.color = "#fff";
          }}
        >
          Guarda i nostri risultati
          <span style={{ fontSize: "0.9rem" }}>↓</span>
        </button>
      </div>

      {/* Hairline oro */}
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-gold-muted), transparent)' }} />

      {/* ── BLOCCO B — Caso Studio ─────────────────────────────────────── */}
      <div
        ref={caseRef}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 0,
          maxWidth: 1360,
          margin: "0 auto",
          padding: isMobile
            ? "0 0 clamp(60px, 14vw, 120px)"
            : "0 clamp(40px, 5vw, 80px) clamp(80px, 12vw, 160px)",
        }}
      >
        {/* Left — Bunny case study video
            Mobile: aspect 9/16 (video portrait), full viewport width, no letterbox.
            Desktop: 16/9 cinematic per mantenere il layout 60/40 side-by-side. */}
        <div
          className="sp-anim"
          style={{
            flex: isMobile ? "none" : "1 1 60%",
            position: "relative",
            aspectRatio: isMobile ? "9 / 16" : "16 / 9",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* Background Media — Bunny embed (case study video) */}
          <MediaSlot
            src="https://iframe.mediadelivery.net/embed/604848/c8c05822-75f8-4385-8642-45da605b08dd?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false"
            alt="Automotive Client 2025"
          />

          {/* Overlay label */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: isMobile ? "16px 20px" : "20px 28px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
              zIndex: 1,
            }}
          >
            <span
              style={{
                color: "var(--color-gold)",
                fontSize: "0.65rem",
                fontFamily: "var(--font-subtitle)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Auto2g S.P.A
            </span>
          </div>
        </div>

        {/* Right — Text content */}
        <div
          style={{
            flex: isMobile ? "none" : "1 1 40%",
            padding: isMobile
              ? "32px 24px 0"
              : "clamp(24px, 4vw, 48px) clamp(32px, 5vw, 60px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Label */}
          <p
            className="sp-anim"
            style={{
              color: "var(--color-gold)",
              fontSize: "0.7rem",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            Caso Studio — Settore Automotive
          </p>

          {/* Title */}
          <h3
            className="sp-anim"
            style={{
              fontSize: isMobile
                ? "clamp(1.4rem, 6vw, 2rem)"
                : "clamp(1.6rem, 3vw, 2.2rem)",
              fontFamily: "var(--font-title)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              margin: "0 0 16px",
            }}
          >
            Cambio di marchio, zero perdita di clienti. Anzi.
          </h3>

          {/* Description */}
          <p
            className="sp-anim"
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "clamp(0.95rem, 2.2vw, 1.1rem)",
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              lineHeight: 1.7,
              margin: "0 0 32px",
              maxWidth: 480,
            }}
          >
            Il cliente gestiva una concessionaria Ford da anni.
            <br />
            <br />
            Con l&apos;ingresso del marchio MG nel suo portafoglio, aveva un problema concreto:{" "}
            <strong style={{ color: "#fff", fontWeight: 700 }}>
              far conoscere un brand sconosciuto al suo territorio senza
              disperdere la clientela esistente.
            </strong>
            <br />
            <br />
            Abbiamo costruito la comunicazione della transizione da zero —
            posizionamento, contenuti, campagne locali — portando MG a essere
            percepita come una scelta credibile nel giro di sei mesi.
          </p>

          {/* Metrics */}
          <div
            className="sp-anim"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              marginBottom: 28,
              border: "1px solid var(--color-border)",
            }}
          >
            {METRICS.map((m, i) => {
              // Pre-compute the final formatted value so the ghost element can
              // reserve the exact space needed — prevents any layout shift during
              // the count-up animation.
              const target = parseInt(m.value.replace(/\D/g, ""), 10);
              const formattedFinal =
                target >= 1000 ? target.toLocaleString("it-IT") : String(target);
              const prefix = m.prefix || "";
              const finalDisplay = prefix + formattedFinal + m.suffix;

              const counterFontSize = isMobile
                ? "clamp(2rem, 9vw, 2.6rem)"
                : "clamp(1.8rem, 3vw, 2.4rem)";

              return (
                <div
                  key={i}
                  style={{
                    padding: isMobile ? '20px 20px' : '24px 28px',
                    borderRight: !isMobile && i < METRICS.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                    borderBottom: isMobile && i < METRICS.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                    position: "relative",
                  }}
                >
                  {/* Accent line top */}
                  {i === 0 && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: isMobile ? 0 : "auto",
                      bottom: isMobile ? "auto" : 0,
                      width: isMobile ? "100%" : 2,
                      height: isMobile ? 2 : "100%",
                      background: "rgba(255,255,255,0.5)",
                    }} />
                  )}

                  {/*
                  Ghost + counter wrapper.
                  The ghost (visibility:hidden) reserves the exact space for
                  the final value, so the container never resizes during
                  the count-up animation.
                */}
                  <div
                    style={{
                      position: "relative",
                      marginBottom: 8,
                      lineHeight: 1,
                    }}
                  >
                    {/* Ghost: determines container dimensions */}
                    <span
                      style={{
                        display: "block",
                        visibility: "hidden",
                        fontSize: counterFontSize,
                        fontFamily: "var(--font-title)",
                        fontWeight: 700,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--color-gold)",
                      }}
                      aria-hidden
                    >
                      {finalDisplay}
                    </span>

                    {/* Live counter — absolutely positioned over the ghost */}
                    <div
                      ref={(el) => { metricRefs.current[i] = el; }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        fontSize: counterFontSize,
                        fontFamily: "var(--font-title)",
                        fontWeight: 700,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--color-gold)",
                      }}
                    >
                      {m.prefix || ""}0{m.suffix}
                    </div>
                  </div>

                  <div
                    style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-subtitle)",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Link */}
          <a
            className="sp-anim"
            href="#portfolio"
            data-cursor="ring"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("portfolio")
                ?.scrollIntoView({ behavior: "instant" });
            }}
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.82rem",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.75)";
            }}
          >
            Leggi il caso completo <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SocialProof;
