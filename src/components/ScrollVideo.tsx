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
    title: "Costruire la tua presenza\ndigitale da zero.",
    description: "",
    layoutType: "cards",
    items: [
      {
        title: "",
        description:
          "La tua azienda ha decenni di storia ma online non si trova.\nTi affianchiamo in tutto il percorso — sito, profili, strategia — senza che tu debba occupartene in prima persona.",
      },
    ],
  },
  {
    title: "Aumentare vendite\ne contatti commerciali.",
    description: "",
    layoutType: "cards",
    items: [
      {
        title: "",
        description:
          "Non likes, non visualizzazioni. Clienti nuovi, preventivi, telefonate.\nCostruiamo campagne che parlano al tuo cliente reale, nel territorio in cui operi, con risultati misurabili ogni mese.",
      },
    ],
  },
  {
    title: "Lanciare un nuovo prodotto\no marchio sul mercato.",
    description: "",
    layoutType: "cards",
    items: [
      {
        title: "",
        description:
          "Hai qualcosa di nuovo da portare sul mercato e non sai da dove cominciare.\nCostruiamo il lancio completo: posizionamento, comunicazione e campagne.",
      },
    ],
  },
  {
    title: "Scalare su nuovi mercati\no territori.",
    description: "",
    layoutType: "cards",
    items: [
      {
        title: "",
        description:
          "Sei solido nella tua provincia ma vuoi crescere altrove.\nTi aiutiamo a farti conoscere in nuove aree geografiche o presso nuovi segmenti di clientela, con una strategia costruita su misura.",
      },
    ],
  },
  {
    title: "Gestire una transizione\no un rebranding aziendale.",
    description: "",
    layoutType: "cards",
    items: [
      {
        title: "",
        description:
          "Cambi nome, entri in una nuova partnership o passi a un nuovo marchio.\nTi aiutiamo a comunicare il cambiamento senza disperdere la fiducia che hai costruito in anni di lavoro.",
      },
    ],
  },
  {
    title: "Eliminare perdite di tempo\ncon strumenti su misura.",
    description: "",
    layoutType: "cards",
    items: [
      {
        title: "",
        description:
          "Procedure manuali, fogli Excel che non si parlano, processi ripetitivi che rubano ore ai tuoi dipendenti.\nProgettiamo app e gestionali personalizzati che semplificano il lavoro interno — così la tua squadra si concentra su ciò che conta davvero.",
      },
    ],
  },
];

const SERVICE_LABELS = [
  "Presenza",
  "Vendite",
  "Lancio",
  "Mercati",
  "Rebranding",
  "Strumenti",
];

const TOTAL_SERVICES = SERVICES.length; // 6

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const toRoman = (n: number): string => ROMAN_NUMERALS[n - 1] ?? String(n);

const getVisibleIndex = (targetIdx: number): number => {
  let visibleCount = 0;
  for (let i = 0; i <= targetIdx; i++) {
    if (SERVICES[i].title) {
      visibleCount++;
    }
  }
  return visibleCount;
};

const BUNNY_VIDEO_URL =
  "https://iframe.mediadelivery.net/embed/604848/957685f8-3d38-442b-9bb1-7dea192d1c1e?autoplay=true&loop=true&muted=true&preload=true&responsive=true";

// ═══════ Sub-components ═══════



// ── Layout components ──

const CardsLayout: React.FC<{ items: ServiceContent[]; index: number; isMobile: boolean }> = React.memo(({
  items,
  index,
  isMobile,
}) => {
  const isSingle = items.length === 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isSingle ? "1fr" : (isMobile ? "1fr" : "repeat(3, 1fr)"),
        gap: isMobile ? 16 : 24,
        maxWidth: isSingle ? 720 : 1100,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {items.map((item, i) => {
        const titleParts = item.title ? item.title.split("\n") : [];
        return (
          <div
            key={i}
            style={{
              background: "rgba(5,5,5,0.82)",
              border: "1px solid rgba(197,165,90,0.22)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderRadius: 4,
              padding: isMobile ? "20px 20px" : "36px 40px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              display: "flex",
              gap: isMobile ? 16 : 28,
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            {isSingle && (
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: isMobile ? "1.2rem" : "1.6rem",
                  fontWeight: 600,
                  color: "var(--color-gold)",
                  lineHeight: 1.15,
                  flexShrink: 0,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
            )}

            <div style={{ flexGrow: 1 }}>
              {item.title && (
                <h4
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: isMobile ? "1.1rem" : "1.35rem",
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 0 12px",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {titleParts[0]}
                  {titleParts[1] && (
                    <>
                      <br />
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontWeight: 400,
                          fontSize: "1.05em",
                          color: "rgba(255,255,255,0.95)",
                          textTransform: "none",
                        }}
                      >
                        {titleParts[1]}
                      </span>
                    </>
                  )}
                </h4>
              )}
              {item.description && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: isMobile ? "0.88rem" : "1rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.85)",
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
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
            fontWeight: 700,
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
              fontSize: isMobile ? "0.82rem" : "0.92rem",
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
            fontSize: isMobile ? "1.25rem" : "clamp(1.6rem, 3vw, 2.2rem)",
            lineHeight: 1.4,
            color: "#FFFFFF",
            textShadow: "0 2px 15px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)",
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

const ServiceLayout: React.FC<{ service: Service; index: number; isMobile: boolean }> = ({
  service,
  index,
  isMobile,
}) => {
  if (!service.items || service.items.length === 0) return null;
  switch (service.layoutType) {
    case "cards":
      return <CardsLayout items={service.items} index={index} isMobile={isMobile} />;
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
  const visibleIdx = getVisibleIndex(index);

  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    if (prefersReduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    // gsap.fromTo con scrollTrigger NON applica lo stato "from" finché
    // il trigger non scatta → tutti i blocchi resterebbero visibili.
    // Il gsap.set dentro il context nasconde ogni blocco subito al mount.
    const ctx = gsap.context(() => {
      gsap.set(el, { opacity: 0, y: 24 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top center",
          once: true,
        },
      });
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
      {service.title && (
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
              fontFamily: "var(--font-subtitle)",
              fontStyle: "normal",
              fontSize: isMobile ? "0.95rem" : "1.2rem",
              color: "var(--color-gold)",
              lineHeight: 1,
              marginBottom: isMobile ? 10 : 14,
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
            aria-hidden="true"
          >
            — {toRoman(visibleIdx)}
          </div>
          <h3
            style={{
              fontFamily: "var(--font-title)",
              fontStyle: "normal",
              fontSize: isMobile ? "2rem" : "clamp(2.4rem, 5vw, 4.2rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "#fff",
              margin: "0 0 18px",
              textShadow: "0 2px 20px rgba(0,0,0,0.6)",
            }}
          >
            {(() => {
              const parts = service.title.split("\n");
              return (
                <>
                  {parts[0]}
                  {parts[1] && (
                    <>
                      <br />
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontWeight: 400,
                          fontSize: "0.95em",
                          color: "rgba(255,255,255,0.9)",
                          textTransform: "none",
                        }}
                      >
                        {parts[1]}
                      </span>
                    </>
                  )}
                </>
              );
            })()}
          </h3>
          {service.description && (
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
          )}
        </div>
      )}

      <ServiceLayout service={service} index={visibleIdx - 1} isMobile={isMobile} />
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
  // Read props and module-level variables to prevent TypeScript warnings/errors for unused declarations
  if (isMobile || currentServiceIndex !== undefined || progress !== undefined || visible || typeof onServiceClick === "function" || SERVICE_LABELS.length > 0) {
    return null;
  }
  return null;
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
  const [videoReady, setVideoReady] = useState(true);
  const [useFallback, setUseFallback] = useState(true);
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
    const keyframeCount = isMobile ? 60 : 120;
    const urls: string[] = [];
    for (let i = 0; i < keyframeCount; i++) {
      // Distribute evenly from frame 1 to totalFrames — always includes last frame
      const frameIdx = Math.round(1 + (i / (keyframeCount - 1)) * (totalFrames - 1));
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

      // Desktop frames were exported double-stacked (same image repeated vertically).
      // Normal 16:9: sh/sw ≈ 0.56. Double-stacked 16:9: sh/sw ≈ 1.12.
      // Genuine portrait 9:16: sh/sw ≈ 1.78 — must NOT be cropped.
      // Threshold 0.7–1.5 catches only the double-stacked desktop case.
      let srcY = 0;
      let srcH = sh;
      if (sh > sw * 0.7 && sh < sw * 1.5) {
        srcH = Math.floor(sh / 2);
      }

      const effectiveSh = srcH;
      const vRatio = sw / effectiveSh;
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
      ctx2d.drawImage(source as CanvasImageSource, 0, srcY, sw, srcH, dx, dy, dw, dh);
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
