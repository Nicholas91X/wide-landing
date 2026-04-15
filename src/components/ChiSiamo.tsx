import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { trackSectionView } from "../utils/analytics";

gsap.registerPlugin(ScrollTrigger);

// ─── Team Data ───────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: "Alessia Amoruso",
    role: "Co-Founder & Strategist – Area Sviluppo e Pubblicità",
    description:
      "Traduco la strategia in risultati misurabili. Ingegnerizzo le tue infrastrutture web (siti e applicativi) e gestisco in prima persona i budget delle tue campagne sponsorizzate, ottimizzando ogni investimento per generare contatti e vendite reali.",
    image: "/founders/Alessia_Amoruso.jpeg",
  },
  {
    name: "Asia Franceschi",
    role: "Co-Founder & Strategist – Area Immagine e Contenuti",
    description:
      "Studio il posizionamento della tua azienda e ne curo l'intera veste comunicativa. Dalla linea editoriale fino alla produzione reale di foto e video sul set, mi assicuro che ogni materiale trasmetta l'autorevolezza del tuo brand senza filtri o finzioni.",
    image: "/founders/Asia_Franceschi.jpeg",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const ChiSiamo: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const entryLineRef = useRef<HTMLDivElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const cardLeftRef = useRef<HTMLDivElement>(null);
  const cardRightRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [focusedCard, setFocusedCard] = useState<-1 | 0 | 1>(-1);
  const focusedCardRef = useRef<-1 | 0 | 1>(-1);

  const prefersReduced = useReducedMotion();

  // ── Responsive state ────────────────────────────────────────────────────
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

  // ── Track section visibility ───────────────────────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { trackSectionView('chi-siamo'); obs.disconnect(); } },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Card dimensions — sized to fit longer descriptions ────────────────
  const cardW = isMobile ? 200 : 300;
  const cardH = isMobile ? 430 : 560;
  const photoH = cardW; // Square photo

  // ── GSAP Scroll Animations ──────────────────────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const entryLine = entryLineRef.current;
    const pinWrap = pinWrapRef.current;
    const cardLeft = cardLeftRef.current;
    const cardRight = cardRightRef.current;
    const vision = visionRef.current;
    if (
      !section ||
      !header ||
      !entryLine ||
      !pinWrap ||
      !cardLeft ||
      !cardRight ||
      !vision
    )
      return;

    const rotAmt = isMobile ? 12 : 20;
    const fgScale = isMobile ? 1.18 : 1.22;
    const bgScale = 0.88;
    const fgX = isMobile ? 20 : 40;
    const scrubVal = prefersReduced ? true : isMobile ? 0.6 : 0.8;

    const ctx = gsap.context(() => {
      // Header fade-in
      if (prefersReduced) {
        gsap.set(header, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(
          header,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: header,
              start: "top 85%",
              end: "top 55%",
              scrub: 1,
            },
          },
        );
      }

      // Entry line scaleX reveal
      gsap.fromTo(
        entryLine,
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
          },
        },
      );

      // ── Set initial GSAP state (no CSS transform conflicts) ──
      gsap.set(cardLeft, { rotation: 0, scale: 0.85, opacity: 0, x: 40 });
      gsap.set(cardRight, { rotation: 0, scale: 0.85, opacity: 0, x: -40 });

      // ── Build timeline sequentially with .add() ──
      const chiSiamoEnd = isMobile ? "+=200%" : "+=400%";

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrap,
          start: "top 20%",
          end: chiSiamoEnd,
          pin: true,
          scrub: scrubVal,
          onUpdate: (self) => {
            const p = self.progress;
            // Thresholds derived from timeline durations (total ≈ 9.2 units)
            // Left foreground: phases leftFwd + holdLeft (1/9.2 → 4/9.2)
            // Right foreground: phases swap + holdRight (5.2/9.2 → 7.2/9.2)
            const next: -1 | 0 | 1 =
              p >= 0.11 && p <= 0.44 ? 0 : p >= 0.57 && p <= 0.78 ? 1 : -1;
            if (focusedCardRef.current !== next) {
              focusedCardRef.current = next;
              setFocusedCard(next);
            }
          },
        },
      });

      // Phase 1: Both cards enter (rotated, fanned out)
      tl.addLabel("enter")
        .to(
          cardLeft,
          {
            rotation: -rotAmt,
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power2.out",
          },
          "enter",
        )
        .to(
          cardRight,
          {
            rotation: rotAmt,
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power2.out",
          },
          "enter",
        );

      // Phase 2: Left card comes to foreground
      tl.addLabel("leftFwd")
        .to(
          cardLeft,
          {
            rotation: 0,
            scale: fgScale,
            x: fgX,
            zIndex: 10,
            duration: 1,
            ease: "power2.inOut",
          },
          "leftFwd",
        )
        .to(
          cardRight,
          { opacity: 0.35, scale: bgScale, duration: 1, ease: "power2.inOut" },
          "leftFwd",
        );

      // Phase 3: Hold left in foreground (empty spacer tween)
      tl.addLabel("holdLeft").to(pinWrap, { duration: 2 }, "holdLeft");

      // Phase 4: Swap — left back, right forward
      tl.addLabel("swap")
        .to(
          cardLeft,
          {
            rotation: -rotAmt,
            scale: bgScale,
            x: 0,
            opacity: 0.35,
            zIndex: 1,
            duration: 1.2,
            ease: "power2.inOut",
          },
          "swap",
        )
        .to(
          cardRight,
          {
            rotation: 0,
            scale: fgScale,
            x: -fgX,
            opacity: 1,
            zIndex: 10,
            duration: 1.2,
            ease: "power2.inOut",
          },
          "swap",
        );

      // Phase 5: Hold right in foreground
      tl.addLabel("holdRight").to(pinWrap, { duration: 2 }, "holdRight");

      // Phase 6: Both return to resting
      tl.addLabel("return")
        .to(
          cardLeft,
          {
            rotation: -rotAmt,
            scale: 1,
            opacity: 1,
            x: 0,
            zIndex: 1,
            duration: 1,
            ease: "power2.inOut",
          },
          "return",
        )
        .to(
          cardRight,
          {
            rotation: rotAmt,
            scale: 1,
            opacity: 1,
            x: 0,
            zIndex: 2,
            duration: 1,
            ease: "power2.inOut",
          },
          "return",
        );

      // Phase 7: Breathing room
      tl.to(pinWrap, { duration: 1 });

      // ── Vision fade-in ──
      if (prefersReduced) {
        gsap.set(vision, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(
          vision,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: vision,
              start: "top 85%",
              end: "top 55%",
              scrub: 1,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, [isMobile, cardH, prefersReduced]);

  const renderCard = (index: number, quote: string, authorName: string) => (
    <>
      <img
        src={TEAM[index].image}
        alt={TEAM[index].name}
        loading="lazy"
        style={{
          width: "100%",
          height: photoH,
          objectFit: "cover",
          flexShrink: 0,
          objectPosition: "center 20%", // Shift focus towards faces
        }}
      />
      <div
        style={{
          padding: isMobile ? "14px 14px 10px" : "20px 20px 14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h4
          style={{
            color: "#fff",
            fontSize: isMobile ? "0.9rem" : "1.05rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            margin: "8px 0 4px",
            letterSpacing: "-0.01em",
          }}
        >
          {TEAM[index].name}
        </h4>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.65rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          {TEAM[index].role}
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: isMobile ? "0.65rem" : "0.75rem",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.45,
            margin: 0,
            whiteSpace: "pre-line" as const,
          }}
        >
          {TEAM[index].description}
        </p>
        {/* Pull quote */}
        <div style={{
          padding: isMobile ? '12px 0 10px' : '16px 0 14px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.45,
            paddingLeft: 16,
            position: 'relative',
            margin: 0,
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: -4,
              color: 'var(--color-gold)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4em',
              lineHeight: 1,
            }}>&ldquo;</span>
            {quote}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div style={{ width: 16, height: 1, background: 'rgba(197,165,90,0.5)' }} />
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
            }}>
              {authorName}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div
      ref={sectionRef}
      style={{
        backgroundColor: "#000",
        padding: `clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)`,
        overflowX: "hidden",
        /* NO overflow:hidden — it breaks GSAP pin */
      }}
    >
      {/* ── Partnership CTA ────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          maxWidth: 700,
          margin: "0 auto",
          marginBottom: "clamp(120px, 18vw, 220px)",
        }}
      >
        <h2
          style={{
            color: "#fff",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            fontFamily: "var(--font-title)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1.1,
            margin: "0 0 24px",
            whiteSpace: isMobile ? "normal" : "nowrap",
          }}
        >
          Partner,{isMobile && <br />} non semplici fornitori.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          Non siamo un'agenzia tradizionale, ma un gruppo di liberi
          professionisti che ha scelto di collaborare in un contesto di piena
          responsabilità individuale e reputazione personale.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(0.82rem, 1.8vw, 1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          Il nostro modello di lavoro ci permette di rispondere in prima persona
          a ogni esigenza: ogni progetto è curato con la massima attenzione,
          perché ogni professionista porta avanti il proprio impegno e la
          propria reputazione.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(0.82rem, 1.8vw, 1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            margin: "0 0 40px",
          }}
        >
          Crediamo fermamente che il valore del territorio e la conoscenza
          profonda del contesto locale siano elementi imprescindibili per
          realizzare lavori di eccellenza.
        </p>
        <button
          data-cursor="ring"
          onClick={() => document.getElementById('contatti')?.scrollIntoView({ behavior: 'instant' })}
          style={{
            padding: '12px 22px',
            backgroundColor: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '0',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-subtitle)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'rgba(197,165,90,0.5)';
            e.currentTarget.style.color = 'var(--color-gold)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
            e.currentTarget.style.color = '#fff';
          }}
        >
          Verifica la nostra disponibilità
        </button>
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        ref={headerRef}
        style={{ marginBottom: "clamp(24px, 4vw, 40px)", textAlign: "left", position: 'relative', overflow: 'hidden' }}
      >
        {/* Numero decorativo editoriale */}
        <div
          aria-hidden={true}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-title)',
            fontWeight: 900,
            fontSize: 'clamp(80px, 20vw, 140px)',
            color: 'rgba(255,255,255,0.025)',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          02
        </div>
        <p
          style={{
            color: "var(--color-gold)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: "0 0 20px",
            display: "block",
          }}
        >
          CHI SIAMO
        </p>
        <h3
          style={{
            color: "#fff",
            fontSize: "clamp(1.8rem, 6vw, 5rem)",
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            lineHeight: 1.05,
            margin: "0 0 20px",
            display: "block",
          }}
        >
          Le menti dietro
          <br />
          ogni progetto.
        </h3>
        {/* Animated entry line */}
        <div
          ref={entryLineRef}
          style={{
            width: 30,
            height: 2,
            backgroundColor: "rgba(255,255,255,0.25)",
          }}
        />
      </div>

      {/* ── Pinned cards area ───────────────────────────────────────── */}
      <div
        ref={pinWrapRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          position: "relative",
          minHeight: cardH + 60,
          marginBottom: "clamp(60px, 10vw, 120px)",
        }}
      >
        {/* Left card — NO CSS transform, GSAP controls everything */}
        <div
          ref={cardLeftRef}
          style={{
            position: "relative",
            width: cardW,
            height: cardH,
            border: "1px solid rgba(255,255,255,0.15)",
            backgroundColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transformOrigin: "bottom center",
            flexShrink: 0,
            willChange: "transform, opacity",
            marginRight: isMobile ? -30 : -40,
          }}
        >
          {renderCard(0, 'Traduco la strategia in risultati misurabili.', 'Alessia Amoruso')}
        </div>

        {/* Right card */}
        <div
          ref={cardRightRef}
          style={{
            position: "relative",
            width: cardW,
            height: cardH,
            border: "1px solid rgba(255,255,255,0.15)",
            backgroundColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transformOrigin: "bottom center",
            flexShrink: 0,
            willChange: "transform, opacity",
            marginLeft: isMobile ? -30 : -40,
            marginTop: isMobile ? 0 : 48,
          }}
        >
          {renderCard(1, 'Ogni materiale trasmette l\'autorevolezza del tuo brand.', 'Asia Franceschi')}
        </div>

        {/* ── Founder indicator dots ─────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: -44,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  height: 5,
                  width: focusedCard === i ? 18 : 5,
                  borderRadius: 3,
                  backgroundColor:
                    focusedCard === i ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            ))}
          </div>
          {focusedCard >= 0 && (
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.58rem",
                fontFamily: "var(--font-subtitle)",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {TEAM[focusedCard].name.split(" ")[0]}
            </span>
          )}
        </div>
      </div>

      {/* ── Vision ──────────────────────────────────────────────────────── */}
      <div
        ref={visionRef}
        style={{
          textAlign: "center",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <h3
          style={{
            color: "#fff",
            fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 20px",
          }}
        >
          Come lavoriamo
        </h3>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          Preferiamo concentrarci su pochi, selezionati clienti, anziché puntare
          alla quantità. In questo modo, possiamo dedicare il giusto tempo e le
          risorse necessarie per garantire risultati che rispecchino le
          aspettative e la fiducia dei nostri partner.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          Creiamo per te strategie di digital marketing personalizzate, ideali
          per sfruttare al meglio i canali social e il tuo sito web, per far
          crescere la tua attività.
        </p>
        <p
          style={{
            color: "#fff",
            fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            lineHeight: 1.5,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Tu concentrati sulla tua attività. Al resto pensiamo noi.
        </p>
      </div>
    </div>
  );
};

export default ChiSiamo;
