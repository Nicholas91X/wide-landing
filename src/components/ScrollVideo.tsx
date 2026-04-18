import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { trackSectionView } from "../utils/analytics";

gsap.registerPlugin(ScrollTrigger);

// ═══════ Types ═══════
type LayoutType = "cards" | "gallery" | "testimonial" | "stats" | "video";

interface ServiceContent {
  image?: string;
  title?: string;
  description?: string;
  value?: string;
  suffix?: string;
  author?: string;
  videoUrl?: string;
}

interface Service {
  title: string;
  description: string;
  layoutType: LayoutType;
  items?: ServiceContent[];
}

// ═══════ Data (preserved from previous impl) ═══════
const SERVICES: Service[] = [
  {
    title: "Social Media Marketing",
    description:
      "Non la solita vetrina, ma strategie per vendere e posizionare il tuo brand.",
    layoutType: "cards",
    items: [
      {
        title: "Strategia Sartoriale",
        description:
          "Studiamo il tuo mercato e creiamo un piano d'attacco su misura insieme a te, senza intermediari che rallentano il processo.",
      },
      {
        title: "Pubblicità e Sponsorizzate",
        description:
          "Generiamo lead qualificati tramite campagne pubblicitarie di Meta, per farti acquisire nuovi clienti",
      },
      {
        title: "Content Marketing",
        description:
          "Produciamo foto e video reali per catturare l'attenzione del tuo target e costruire un'identità visiva premium e inconfondibile.",
      },
    ],
  },
  {
    title: "Content Marketing",
    description: "Mostriamo il vero volto della tua azienda.",
    layoutType: "stats",
    items: [
      {
        value: "+500K",
        suffix: "Visite al profilo in organico",
        description: "Raggiunte per i nostri clienti",
      },
      {
        value: "+40%",
        suffix: "Di contatti generati",
        description: "In organico",
      },
      {
        value: "100%",
        suffix: "Originalità",
        description: "Niente template, solo branding",
      },
    ],
  },
  {
    title: "Il Tuo Strumento Digitale, Su Misura",
    description:
      "Dal negozio online al gestionale: costruiamo esattamente quello che serve alla tua azienda.",
    layoutType: "gallery",
    items: [
      {
        title: "Vendi online",
        description:
          "Un negozio digitale aperto 24 ore su 24, che trasforma i visitatori in clienti paganti senza bisogno di intermediari.",
      },
      {
        title: "Gestisci tutto da un solo posto",
        description:
          "Un pannello semplice per tenere sotto controllo ordini, personale e dati senza fogli Excel, senza confusione.",
      },
      {
        title: "La tua app aziendale",
        description:
          "App che funzionano su mobile o pc, per i tuoi clienti e/o collaboratori.",
      },
      {
        title: "Costruito per te",
        description:
          "Non usiamo template già pronti: partiamo dai tuoi processi e costruiamo lo strumento che si adatta alla tua realtà.",
      },
    ],
  },
  {
    title: "Shooting Video/Fotografici",
    description: "Qualità cinematografica con attrezzatura Pro.",
    layoutType: "testimonial",
    items: [
      {
        description:
          '"La qualità delle riprese ha cambiato radicalmente la percezione del nostro brand."',
        author: "CEO di AUTO2G",
      },
    ],
  },
  {
    title: "Produzioni Video con Intelligenza Artificiale",
    description:
      "Diamo vita a ciò che non esiste ancora.\nScenari, animazioni e video ad altissimo impatto per presentare i tuoi prodotti come leader di settore.",
    layoutType: "video",
    items: [
      {
        title: "Guarda cosa possiamo far fare al tuo prodotto.",
        description: "",
      },
    ],
  },
  {
    title: "Sviluppo Piattaforme Web su misura",
    description: "Esperienze immersive e conversion-oriented.",
    layoutType: "cards",
    items: [
      {
        title: "Landing page",
        description:
          "Pagine progettate esclusivamente per trasformare il traffico delle tue campagne in contatti qualificati",
      },
      {
        title: "E-commerce",
        description:
          "Negozi online strutturati per massimizzare le vendite, rendendo l'esperienza di acquisto dei tuoi clienti facile, sicura e senza ostacoli.",
      },
      {
        title: "Corporate",
        description:
          "Ecosistemi digitali autorevoli, sviluppati per riflettere il reale valore della tua azienda e consolidare la fiducia di partner e clienti.",
      },
    ],
  },
];

const SERVICE_LABELS = [
  "Social",
  "Content",
  "Strumenti",
  "Shooting",
  "AI Video",
  "Web",
];

const TOTAL_SERVICES = SERVICES.length; // 6

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const toRoman = (n: number): string => ROMAN_NUMERALS[n - 1] ?? String(n);

const BUNNY_VIDEO_URL =
  "https://iframe.mediadelivery.net/embed/604848/6947a772-4a77-416c-85a6-c0b30154aeea?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=true";

// ═══════ Sub-components ═══════

interface ChapterStripProps {
  number: string;
  title: string;
  isMobile: boolean;
}

const ChapterStrip: React.FC<ChapterStripProps> = React.memo(({ number, title, isMobile }) => (
  <div
    style={{
      padding: isMobile ? "28px 20px" : "40px 40px",
      background:
        "linear-gradient(90deg, transparent, rgba(197,165,90,0.08), transparent)",
      borderTop: "1px solid rgba(197,165,90,0.2)",
      borderBottom: "1px solid rgba(197,165,90,0.2)",
      textAlign: "center",
      position: "relative",
      zIndex: 2,
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
        marginBottom: 4,
      }}
    >
      {number}
    </div>
    <div
      style={{
        fontFamily: "var(--font-title)",
        fontSize: isMobile ? "0.58rem" : "0.7rem",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.75)",
        fontWeight: 600,
      }}
    >
      {title}
    </div>
  </div>
));
ChapterStrip.displayName = "ChapterStrip";

// ── Layout components ──

const CardsLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = React.memo(({
  items,
  isMobile,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: isMobile ? 16 : 24,
      maxWidth: 1100,
      margin: "0 auto",
      width: "100%",
    }}
  >
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          background: "rgba(5,5,5,0.82)",
          border: "1px solid rgba(197,165,90,0.22)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 4,
          padding: isMobile ? "18px 18px" : "28px 24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        {item.title && (
          <h4
            style={{
              fontFamily: "var(--font-title)",
              fontSize: isMobile ? "0.95rem" : "1.1rem",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 10px",
              letterSpacing: "-0.01em",
            }}
          >
            {item.title}
          </h4>
        )}
        {item.description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.78rem" : "0.85rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.88)",
              margin: 0,
            }}
          >
            {item.description}
          </p>
        )}
      </div>
    ))}
  </div>
));
CardsLayout.displayName = "CardsLayout";

const StatsLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = React.memo(({
  items,
  isMobile,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : items.length === 3
        ? "1.3fr 0.85fr 0.85fr"
        : `repeat(${items.length}, 1fr)`,
      gap: isMobile ? 20 : 32,
      maxWidth: 1100,
      margin: "0 auto",
      width: "100%",
    }}
  >
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          textAlign: isMobile ? "left" : "center",
          padding: isMobile ? "12px 0" : "20px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: isMobile ? "2.4rem" : "clamp(2.6rem, 5vw, 4.2rem)",
            fontWeight: 900,
            lineHeight: 1,
            color: "var(--color-gold)",
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          {item.value}
        </div>
        {item.suffix && (
          <div
            style={{
              fontFamily: "var(--font-title)",
              fontSize: "0.78rem",
              color: "#fff",
              fontWeight: 600,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            {item.suffix}
          </div>
        )}
        {item.description && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.72)",
              fontStyle: "italic",
            }}
          >
            {item.description}
          </div>
        )}
      </div>
    ))}
  </div>
));
StatsLayout.displayName = "StatsLayout";

const GalleryLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = React.memo(({
  items,
  isMobile,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: isMobile ? 12 : 20,
      maxWidth: 900,
      margin: "0 auto",
      width: "100%",
    }}
  >
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          background: "rgba(5,5,5,0.82)",
          border: "1px solid rgba(197,165,90,0.22)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: 4,
          padding: isMobile ? "16px 16px" : "22px 22px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
        }}
      >
        {item.title && (
          <h4
            style={{
              fontFamily: "var(--font-title)",
              fontSize: isMobile ? "0.88rem" : "1rem",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px",
            }}
          >
            {item.title}
          </h4>
        )}
        {item.description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.75rem" : "0.82rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.88)",
              margin: 0,
            }}
          >
            {item.description}
          </p>
        )}
      </div>
    ))}
  </div>
));
GalleryLayout.displayName = "GalleryLayout";

const TestimonialLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = React.memo(({
  items,
  isMobile,
}) => {
  const t = items[0];
  if (!t) return null;
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      {t.description && (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: isMobile ? "1.15rem" : "clamp(1.4rem, 2.5vw, 1.8rem)",
            lineHeight: 1.35,
            color: "var(--color-gold)",
            margin: "0 0 24px",
          }}
        >
          {t.description}
        </p>
      )}
      {t.author && (
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
            fontWeight: 600,
          }}
        >
          — {t.author}
        </div>
      )}
    </div>
  );
});
TestimonialLayout.displayName = "TestimonialLayout";

const VideoLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = React.memo(({
  items: _items,
  isMobile: _isMobile,
}) => (
  <div
    style={{
      maxWidth: 900,
      margin: "0 auto",
      width: "100%",
    }}
  >
    <div
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        height: 0,
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <iframe
        src={BUNNY_VIDEO_URL}
        loading="lazy"
        allow="autoplay; encrypted-media"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    </div>
  </div>
));
VideoLayout.displayName = "VideoLayout";

const ServiceLayout: React.FC<{ service: Service; isMobile: boolean }> = ({
  service,
  isMobile,
}) => {
  if (!service.items || service.items.length === 0) return null;
  switch (service.layoutType) {
    case "cards":
      return <CardsLayout items={service.items} isMobile={isMobile} />;
    case "stats":
      return <StatsLayout items={service.items} isMobile={isMobile} />;
    case "gallery":
      return <GalleryLayout items={service.items} isMobile={isMobile} />;
    case "testimonial":
      return <TestimonialLayout items={service.items} isMobile={isMobile} />;
    case "video":
      return <VideoLayout items={service.items} isMobile={isMobile} />;
    default:
      return null;
  }
};

interface ServiceBlockProps {
  service: Service;
  index: number;
  isMobile: boolean;
  prefersReduced: boolean;
}

const ServiceBlock: React.FC<ServiceBlockProps> = React.memo(({
  service,
  index,
  isMobile,
  prefersReduced,
}) => {
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    if (prefersReduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
            once: true,
          },
        }
      );
    });
    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <div
      ref={blockRef}
      data-service-index={index}
      style={{
        minHeight: isMobile ? "90vh" : "100vh",
        padding: isMobile ? "60px 20px 40px" : "80px 40px 60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto 44px",
          textAlign: isMobile ? "left" : "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: isMobile ? "0.95rem" : "1.2rem",
            color: "var(--color-gold)",
            lineHeight: 1,
            marginBottom: isMobile ? 10 : 14,
            letterSpacing: "0.05em",
          }}
          aria-hidden="true"
        >
          — {toRoman(index + 1)}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: isMobile ? "2rem" : "clamp(2.4rem, 5vw, 4rem)",
            fontWeight: 400,
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
            color: "#fff",
            margin: "0 0 18px",
            textShadow: "0 2px 20px rgba(0,0,0,0.6)",
          }}
        >
          {service.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: isMobile ? "0.9rem" : "1.05rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.95)",
            margin: 0,
            maxWidth: "56ch",
            marginLeft: isMobile ? 0 : "auto",
            marginRight: isMobile ? 0 : "auto",
            whiteSpace: "pre-line",
            textShadow: "0 1px 10px rgba(0,0,0,0.6)",
          }}
        >
          {service.description}
        </p>
      </div>

      <ServiceLayout service={service} isMobile={isMobile} />
    </div>
  );
});
ServiceBlock.displayName = "ServiceBlock";

interface ProgressOverlayProps {
  isMobile: boolean;
  currentServiceIndex: number;
  progress: number;
  visible: boolean;
  onServiceClick: (idx: number) => void;
}

const ProgressOverlay: React.FC<ProgressOverlayProps> = React.memo(({
  isMobile,
  currentServiceIndex,
  progress,
  visible,
  onServiceClick,
}) => {
  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          pointerEvents: "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      >
        <div
          style={{
            height: 3,
            width: "100%",
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: "var(--color-gold)",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "6px 0",
            fontFamily: "var(--font-title)",
            fontSize: "0.58rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 600,
            background:
              "linear-gradient(to bottom, rgba(5,5,5,0.85), transparent)",
          }}
        >
          {String(currentServiceIndex + 1).padStart(2, "0")} /{" "}
          {String(TOTAL_SERVICES).padStart(2, "0")} ·{" "}
          {SERVICE_LABELS[currentServiceIndex]}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 32,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.35s ease",
      }}
    >
      {SERVICE_LABELS.map((label, i) => {
        const active = i === currentServiceIndex;
        return (
          <button
            key={i}
            onClick={() => onServiceClick(i)}
            aria-label={`Vai al servizio ${label}`}
            data-cursor="ring"
            style={{
              background: "transparent",
              border: "none",
              padding: "4px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: active ? 1 : 0.6,
              transition: "opacity 0.3s",
            }}
          >
            <div
              style={{
                height: 5,
                width: active ? 20 : 5,
                borderRadius: 3,
                background: active ? "var(--color-gold)" : "rgba(255,255,255,0.4)",
                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: active ? "#fff" : "rgba(255,255,255,0.65)",
                fontWeight: 600,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.15)",
          fontFamily: "var(--font-title)",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.75)",
          fontWeight: 600,
        }}
      >
        {String(currentServiceIndex + 1).padStart(2, "0")} /{" "}
        {String(TOTAL_SERVICES).padStart(2, "0")}
      </div>
    </div>
  );
});
ProgressOverlay.displayName = "ProgressOverlay";

// ═══════ Main Component ═══════
export const ScrollVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [videoReady, setVideoReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const fallbackImagesRef = useRef<HTMLImageElement[]>([]);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
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
        onChange as (e: MediaQueryListEvent) => void
      );
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let tracked = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && !tracked) {
          trackSectionView("services");
          tracked = true;
        }
      },
      { threshold: 0, rootMargin: "0px 0px -20% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const probeVideoSeek = useCallback(async (): Promise<boolean> => {
    const v = videoRef.current;
    if (!v || !v.duration) return false;
    const samples = [0.1, 0.3, 0.5, 0.7, 0.9];
    const start = performance.now();
    for (const s of samples) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          v.removeEventListener("seeked", handler);
          resolve();
        };
        v.addEventListener("seeked", handler);
        v.currentTime = s * v.duration;
      });
    }
    const avgMs = (performance.now() - start) / samples.length;
    return avgMs > 200;
  }, []);

  const onVideoLoaded = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    const slow = await probeVideoSeek();
    if (slow) {
      setUseFallback(true);
      // Track fallback activation to GTM/GA4
      if (typeof window !== "undefined" && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
        (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
          event: "scrollvideo_fallback_activated",
          reason: "slow_video_seek",
        });
      }
    }
    setVideoReady(true);
  }, [probeVideoSeek]);

  // Reload video source when breakpoint changes (desktop ↔ mobile)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setVideoReady(false);
    v.load();
    // ScrollTrigger measurements are stale after minHeight changes
    ScrollTrigger.refresh();
  }, [isMobile]);

  // Preload WEBP keyframes when fallback activates
  useEffect(() => {
    if (!useFallback) return;
    const basePath = isMobile ? "/frames_9_16/section-2" : "/frames/section-2";
    const totalFrames = isMobile ? 223 : 908;
    const keyframeCount = 60;
    const step = Math.max(1, Math.floor(totalFrames / keyframeCount));
    const urls: string[] = [];
    for (let i = 0; i < keyframeCount; i++) {
      const frameIdx = Math.min(totalFrames, 1 + i * step);
      urls.push(`${basePath}/frame_${String(frameIdx).padStart(4, "0")}.webp`);
    }
    const loaded: HTMLImageElement[] = new Array(keyframeCount);
    let count = 0;
    urls.forEach((url, i) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded[i] = img;
        count++;
        if (count === keyframeCount) {
          fallbackImagesRef.current = loaded;
          setFallbackLoaded(true);
        }
      };
      img.onerror = () => {
        count++;
        if (count === keyframeCount && loaded.filter(Boolean).length > keyframeCount / 2) {
          fallbackImagesRef.current = loaded.filter(Boolean);
          setFallbackLoaded(true);
        }
      };
    });
  }, [useFallback, isMobile]);

  useEffect(() => {
    if (!videoReady || prefersReduced) return;

    const container = containerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!container || !video || !canvas) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawFrame = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      let source: HTMLVideoElement | HTMLImageElement | null = null;
      let sw = 0;
      let sh = 0;

      if (useFallback && fallbackImagesRef.current.length > 0) {
        const imgs = fallbackImagesRef.current;
        const idx = Math.min(
          imgs.length - 1,
          Math.floor(progressRef.current * imgs.length)
        );
        const img = imgs[idx];
        if (!img) return;
        source = img;
        sw = img.naturalWidth;
        sh = img.naturalHeight;
      } else {
        if (!video.videoWidth || !video.videoHeight) return;
        source = video;
        sw = video.videoWidth;
        sh = video.videoHeight;
      }

      const vRatio = sw / sh;
      const cRatio = cw / ch;
      let dw, dh, dx, dy;
      if (vRatio > cRatio) {
        dh = ch;
        dw = dh * vRatio;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = dw / vRatio;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx2d.clearRect(0, 0, cw, ch);
      ctx2d.drawImage(source as CanvasImageSource, dx, dy, dw, dh);
    };

    const gsapCtx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          setProgress(p);
          if (!useFallback && video.duration) {
            video.currentTime = Math.min(
              video.duration - 0.01,
              p * video.duration
            );
          } else if (useFallback && fallbackImagesRef.current.length > 0) {
            // Draw synchronously when fallback is active
            drawFrame();
          }
          const idx = Math.min(
            TOTAL_SERVICES - 1,
            Math.floor(p * TOTAL_SERVICES)
          );
          setCurrentServiceIndex(idx);
        },
      });

      video.addEventListener("seeked", drawFrame);
      video.addEventListener("loadeddata", drawFrame);
      drawFrame();
    }, container);

    return () => {
      gsapCtx.revert();
      video.removeEventListener("seeked", drawFrame);
      video.removeEventListener("loadeddata", drawFrame);
      window.removeEventListener("resize", resize);
    };
  }, [videoReady, prefersReduced, useFallback, fallbackLoaded]);

  const scrollToService = useCallback((idx: number) => {
    const c = containerRef.current;
    if (!c) return;
    const block = c.querySelector<HTMLElement>(
      `[data-service-index="${idx}"]`
    );
    if (!block) return;
    const y = block.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const videoSrc = isMobile
    ? "/videos/services-mobile.mp4"
    : "/videos/services-desktop.mp4";

  const servicesBlocks = SERVICES.map((svc, idx) => (
    <React.Fragment key={idx}>
      {idx > 0 && (
        <ChapterStrip
          number={String(idx + 1).padStart(2, "0")}
          title={svc.title}
          isMobile={isMobile}
        />
      )}
      <ServiceBlock
        service={svc}
        index={idx}
        isMobile={isMobile}
        prefersReduced={prefersReduced}
      />
    </React.Fragment>
  ));

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: "#050505",
        minHeight: isMobile ? "800vh" : "700vh",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          zIndex: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        <video
          ref={videoRef}
          src={videoSrc}
          preload="auto"
          playsInline
          muted
          onLoadedData={onVideoLoaded}
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(5,5,5,0.4) 0%, rgba(5,5,5,0.75) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          marginTop: "-100vh",
          zIndex: 1,
        }}
      >
        {servicesBlocks}
      </div>

      <ProgressOverlay
        isMobile={isMobile}
        currentServiceIndex={currentServiceIndex}
        progress={progress}
        visible={isInView}
        onServiceClick={scrollToService}
      />
    </div>
  );
};

export default ScrollVideo;
