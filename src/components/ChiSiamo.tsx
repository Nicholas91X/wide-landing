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
    nameFirst: "Alessia",
    nameLast: "Amoruso",
    role: "Co-Founder & Strategist – Area Sviluppo e Pubblicità",
    roleShort: "Sviluppo & Pubblicità",
    description:
      "Traduco la strategia in risultati misurabili. Ingegnerizzo le tue infrastrutture web (siti e applicativi) e gestisco in prima persona i budget delle tue campagne sponsorizzate, ottimizzando ogni investimento per generare contatti e vendite reali.",
    image: "/founders/Alessia_Amoruso_v2.png",
  },
  {
    name: "Asia Franceschi",
    nameFirst: "Asia",
    nameLast: "Franceschi",
    role: "Co-Founder & Strategist – Area Immagine e Contenuti",
    roleShort: "Immagine & Contenuti",
    description:
      "Studio il posizionamento della tua azienda e ne curo l'intera veste comunicativa. Dalla linea editoriale fino alla produzione reale di foto e video sul set, mi assicuro che ogni materiale trasmetta l'autorevolezza del tuo brand senza filtri o finzioni.",
    image: "/founders/Asia_Franceschi_v2.jpg",
  },
];

// ─── FounderScene sub-component ──────────────────────────────────────────────
interface FounderSceneProps {
  index: 0 | 1;
  romanNum: "I" | "II";
  isMobile: boolean;
  reverseDesktop?: boolean;
}

const FounderScene = React.forwardRef<HTMLDivElement, FounderSceneProps>(
  ({ index, romanNum, isMobile, reverseDesktop }, ref) => {
    const person = TEAM[index];

    return (
      <div
        ref={ref}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : reverseDesktop
            ? "1fr 1.1fr"
            : "1.1fr 1fr",
          gap: 0,
          alignItems: "stretch",
          minHeight: isMobile ? "auto" : 500,
          background: "#050505",
          marginBottom: "clamp(40px, 6vw, 80px)",
        }}
      >
        {/* Photo */}
        <div
          style={{
            order: !isMobile && reverseDesktop ? 2 : 1,
            position: "relative",
            minHeight: isMobile ? 380 : 500,
            overflow: "hidden",
          }}
        >
          <img
            src={person.image}
            alt={person.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 20%",
              filter: "grayscale(0.25) contrast(1.05)",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: isMobile
                ? "linear-gradient(to bottom, transparent 40%, rgba(5,5,5,0.95))"
                : "linear-gradient(135deg, transparent 40%, rgba(5,5,5,0.6))",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: 18,
              left: 20,
              fontFamily: "var(--font-title)",
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              color: "var(--color-gold)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {romanNum} · Co-Founder
          </span>
          {isMobile && (
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 18,
              }}
            >
              <h4
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "2rem",
                  fontWeight: 700,
                  lineHeight: 0.9,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                }}
              >
                {person.nameFirst}
                <br />
                {person.nameLast}
              </h4>
              <span
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.55rem",
                  color: "rgba(255,255,255,0.9)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(197,165,90,0.4)",
                  display: "inline-block",
                }}
              >
                {person.roleShort}
              </span>
            </div>
          )}
        </div>

        {/* Text block */}
        <div
          style={{
            order: !isMobile && reverseDesktop ? 1 : 2,
            padding: isMobile ? "22px 24px 28px" : "50px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "#080808",
          }}
        >
          {!isMobile && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.6rem",
                  color: "var(--color-gold)",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  margin: "0 0 12px",
                  fontWeight: 600,
                }}
              >
                {romanNum} · Co-Founder
              </p>
              <h4
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 700,
                  lineHeight: 0.95,
                  margin: "0 0 10px",
                  letterSpacing: "-0.02em",
                  color: "#fff",
                }}
              >
                {person.nameFirst}
                <br />
                {person.nameLast}
              </h4>
              <p
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: "0 0 28px",
                  paddingBottom: 18,
                  borderBottom: "1px solid rgba(197,165,90,0.3)",
                  width: "fit-content",
                }}
              >
                {person.roleShort}
              </p>
            </>
          )}

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.78rem" : "0.92rem",
              lineHeight: isMobile ? 1.6 : 1.65,
              color: "rgba(255,255,255,0.9)",
              margin: "0 0 20px",
              maxWidth: "46ch",
            }}
          >
            {person.description}
          </p>


        </div>
      </div>
    );
  }
);
FounderScene.displayName = "FounderScene";

// ─── Component ───────────────────────────────────────────────────────────────
export const ChiSiamo: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const entryLineRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<HTMLDivElement>(null);

  const sceneARef = useRef<HTMLDivElement>(null);
  const sceneBRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);

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
      ([entry]) => {
        if (entry.isIntersecting) {
          trackSectionView("chi-siamo");
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── GSAP fade-in entry (no pin, no scrub) ─────────────────────────────
  useEffect(() => {
    const header = headerRef.current;
    const entryLine = entryLineRef.current;
    const sceneA = sceneARef.current;
    const divider = dividerRef.current;
    const sceneB = sceneBRef.current;
    const vision = visionRef.current;

    if (prefersReduced) {
      gsap.set(
        [header, entryLine, sceneA, divider, sceneB, vision].filter(Boolean),
        { opacity: 1, y: 0, scaleX: 1 }
      );
      return;
    }

    const ctx = gsap.context(() => {
      // Header fade-in
      if (header) {
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
              once: true,
            },
          }
        );
      }

      // Entry line scaleX reveal
      if (entryLine) {
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
              once: true,
            },
          }
        );
      }

      // Scenes + divider fade-in one-shot
      [sceneA, divider, sceneB].forEach((el) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              once: true,
            },
          }
        );
      });

      // Vision fade-in (preserved from original)
      if (vision) {
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
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <div
      ref={sectionRef}
      style={{
        backgroundColor: "#000",
        padding: `clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)`,
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
            fontWeight: 700,
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
            color: "rgba(255,255,255,0.9)",
            fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          Non siamo un&apos;agenzia, ma un gruppo di liberi
          professionisti che ha scelto di collaborare in un contesto di piena
          responsabilità individuale e reputazione personale.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.9)",
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
            color: "rgba(255,255,255,0.9)",
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
          onClick={() =>
            document
              .getElementById("contatti")
              ?.scrollIntoView({ behavior: "instant" })
          }
          style={{
            padding: "12px 22px",
            backgroundColor: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "0",
            fontSize: "0.75rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "rgba(197,165,90,0.5)";
            e.currentTarget.style.color = "var(--color-gold)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
            e.currentTarget.style.color = "#fff";
          }}
        >
          Verifica la nostra disponibilità
        </button>
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        ref={headerRef}
        style={{
          marginBottom: "clamp(24px, 4vw, 40px)",
          textAlign: "left",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Numero decorativo editoriale */}
        <div
          aria-hidden={true}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            fontSize: "clamp(80px, 20vw, 140px)",
            color: "rgba(255,255,255,0.025)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
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

      {/* ── Scene I — Alessia ─────────────────────────────── */}
      <FounderScene
        ref={sceneARef}
        index={0}
        romanNum="I"
        isMobile={isMobile}
      />

      {/* ── Divider II — ASIA ────────────────────────────── */}
      <div
        ref={dividerRef}
        style={{
          padding: isMobile ? "28px 24px" : "36px 40px",
          background:
            "linear-gradient(90deg, rgba(197,165,90,0.04), rgba(197,165,90,0.1), rgba(197,165,90,0.04))",
          borderTop: "1px solid rgba(197,165,90,0.2)",
          borderBottom: "1px solid rgba(197,165,90,0.2)",
          textAlign: "center",
          margin: "clamp(24px, 4vw, 48px) 0",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: isMobile ? "1.4rem" : "1.8rem",
            color: "var(--color-gold)",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          ·  ·  ·
        </div>
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: isMobile ? "0.58rem" : "0.68rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          II — ASIA
        </div>
        <div
          style={{
            fontSize: "0.62rem",
            color: "var(--color-gold)",
            opacity: 0.7,
            letterSpacing: "0.15em",
          }}
        >
          ↓ continua
        </div>
      </div>

      {/* ── Scene II — Asia ─────────────────────────────── */}
      <FounderScene
        ref={sceneBRef}
        index={1}
        romanNum="II"
        isMobile={isMobile}
        reverseDesktop
      />

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
            color: "rgba(255,255,255,0.9)",
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
            color: "rgba(255,255,255,0.9)",
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
