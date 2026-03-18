import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Metrics Data ────────────────────────────────────────────────────────────
const METRICS = [
  { value: "520000", suffix: "", label: "Visualizzazioni dei post" },
  { value: "100", suffix: "+", label: "Contatti generati in organico" },
  { value: "1000", suffix: "+", label: "Condivisioni" },
];

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

    const heroChildren = heroEl.querySelectorAll<HTMLElement>(".sp-anim");
    const caseChildren = caseEl.querySelectorAll<HTMLElement>(".sp-anim");

    gsap.set([...heroChildren, ...caseChildren], { opacity: 0, y: 30 });

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
          const duration = 1.4;
          const obj = { val: 0 };

          gsap.to(obj, {
            val: target,
            duration,
            ease: "power2.out",
            delay: i * 0.12,
            onUpdate() {
              const v = Math.round(obj.val);
              el.textContent = v >= 1000
                ? (v >= 10000 ? (v >= 100000 ? v.toLocaleString('it-IT') : v.toLocaleString('it-IT')) : v.toLocaleString('it-IT'))
                : String(v);
              el.textContent += suffix;
            },
            onComplete() {
              // Ensure final value is exact
              el.textContent = target >= 1000 ? target.toLocaleString('it-IT') : String(target);
              el.textContent += suffix;
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

  return (
    <div
      ref={sectionRef}
      style={{ backgroundColor: "#000", color: "#fff", width: "100%" }}
    >
      {/* ── BLOCCO A — Hero Statement ──────────────────────────────────── */}
      <div
        ref={heroRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: isMobile
            ? "clamp(160px, 30vw, 240px) 24px clamp(60px, 14vw, 120px)"
            : "clamp(180px, 22vw, 300px) clamp(40px, 8vw, 120px) clamp(80px, 12vw, 160px)",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Eyebrow */}
        <p
          className="sp-anim"
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "0.72rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: "0 0 20px",
            // Snap anchor: forces fast scrolls from the IntroOverlay to stop here.
            // This element sits at ~160-300px from the top (heroRef padding),
            // which is safely past the IntroOverlay fade range (0-120px).
            scrollSnapAlign: "start",
            scrollSnapStop: "always",
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
              : "clamp(2.4rem, 5vw, 3.6rem)",
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 24px",
          }}
        >
          Portiamo la tua azienda dove i tuoi clienti ti cercano già.
        </h2>

        {/* Subtitle */}
        <p
          className="sp-anim"
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "clamp(0.92rem, 2vw, 1.1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            maxWidth: 600,
            margin: "0 0 36px",
          }}
        >
          Lavoriamo con imprenditori che vogliono smettere di perdere terreno
          online. Niente agenzie generaliste, niente promesse vuote — solo
          risultati misurabili.
        </p>

        {/* CTA */}
        <button
          className="sp-anim"
          onClick={() =>
            document
              .getElementById("contatti")
              ?.scrollIntoView({ behavior: "instant" })
          }
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
          Prenota una call gratuita
          <span style={{ fontSize: "0.9rem" }}>→</span>
        </button>
      </div>

      {/* ── BLOCCO B — Caso Studio ─────────────────────────────────────── */}
      <div
        ref={caseRef}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 0,
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile
            ? "0 0 clamp(60px, 14vw, 120px)"
            : "0 clamp(40px, 5vw, 80px) clamp(80px, 12vw, 160px)",
        }}
      >
        {/* Left — Image placeholder */}
        <div
          className="sp-anim"
          style={{
            flex: isMobile ? "none" : "1 1 45%",
            position: "relative",
            aspectRatio: "16 / 9", // Cinematic format for the car
            overflow: "hidden",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Background Image - Real zoom out via contain and scale */}
          <img
            src="/assets/mustang_mach_1.jpg"
            alt="Automotive Client 2025 - Mustang Mach 1"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: "scale(0.95)", // Extra safety margin to show everything
              filter: "brightness(0.8)",
            }}
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
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.65rem",
                fontFamily: "var(--font-subtitle)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Automotive Client — 2025
            </span>
          </div>
        </div>

        {/* Right — Text content */}
        <div
          style={{
            flex: isMobile ? "none" : "1 1 55%",
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
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.7rem",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            Caso Studio
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
            Da zero presenza online a brand riconoscibile sul territorio.
          </h3>

          {/* Description */}
          <p
            className="sp-anim"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "clamp(0.88rem, 2vw, 1rem)",
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              lineHeight: 1.7,
              margin: "0 0 32px",
              maxWidth: 480,
            }}
          >
            Abbiamo seguito l&apos;intero percorso: strategia, contenuti,
            campagne e produzione video. In sei mesi il cliente ha più che
            triplicato la sua presenza digitale.
          </p>

          {/* Metrics */}
          <div
            className="sp-anim"
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 0 : 0,
              marginBottom: 28,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {METRICS.map((m, i) => (
              <div
                key={i}
                style={{
                  flex: isMobile ? "none" : "1 1 0",
                  padding: isMobile ? "20px 24px" : "24px 28px",
                  borderRight: !isMobile && i < METRICS.length - 1
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "none",
                  borderBottom: isMobile && i < METRICS.length - 1
                    ? "1px solid rgba(255,255,255,0.08)"
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
                <div
                  ref={(el) => { metricRefs.current[i] = el; }}
                  style={{
                    fontSize: isMobile
                      ? "clamp(2rem, 9vw, 2.6rem)"
                      : "clamp(1.8rem, 3vw, 2.4rem)",
                    fontFamily: "var(--font-title)",
                    fontWeight: 700,
                    lineHeight: 1,
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  0{m.suffix}
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
            ))}
          </div>

          {/* Link */}
          <a
            className="sp-anim"
            href="#portfolio"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("portfolio")
                ?.scrollIntoView({ behavior: "instant" });
            }}
            style={{
              color: "rgba(255,255,255,0.6)",
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
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            Scopri come <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SocialProof;
