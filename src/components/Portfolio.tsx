import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProjectModal } from "./ProjectModal";
import type { Project } from "./ProjectModal";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { trackSectionView } from "../utils/analytics";

gsap.registerPlugin(ScrollTrigger);

// ─── Extended Project Data Type for Portfolio ────────────────────────────────
interface PortfolioProject extends Project {
  reels?: string[];
}

// ─── Project Data (placeholder — replace src with real assets) ───────────────
const PROJECTS: PortfolioProject[] = [
  {
    id: "p1",
    title: "Auto2G - Spa",
    category: "Rebranding e Marketing",
    year: "2025",
    description:
      "<b>Da salone a brand automotive riconoscibile.</b>\n\nAbbiamo gestito l'intera presenza digitale, dal rebranding completo allo sviluppo del sito web, fino alla gestione strategica di 3 canali social (IG, FB, TikTok).\n\n<b>I RISULTATI PARLANO:</b>\n\n<b>Brand Identity:</b> unica e memorabile.\n\n<b>Vendite auto dirette:</b> clienti che acquistano veicoli a seguito di video visualizzati sui social.\n\n<b>TikTok:</b> oltre 200.000 visualizzazioni.",
    mediaType: "image",
    mediaSrc: "",
    accentColor: "linear-gradient(135deg, #1a0a00, #3d1a00)",
    tags: [
      "Rebranding",
      "Gestionale Customizzato",
      "Social Media",
      "Campagne Ads",
    ],
    reels: [
      "https://iframe.mediadelivery.net/embed/604848/0e62b759-3d9a-4308-b4e3-dd01d1f715de?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
      "https://iframe.mediadelivery.net/embed/604848/7081352d-7e73-4ba0-b74a-64a6fe453015?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
      "https://iframe.mediadelivery.net/embed/604848/4c128c36-9caf-4fd0-a735-3a8f774b6dc5?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
      "https://iframe.mediadelivery.net/embed/604848/bd750578-cc05-443d-9d15-514d5a12d7c8?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
    ],
    // Gallery shown inside the project drawer.
    // Place images in /public/portfolio/auto2g/ and list them here.
    gallery: [
      "/portfolio/auto2g/img-01.webp",
      "/portfolio/auto2g/img-02.webp",
      "/portfolio/auto2g/img-03.webp",
      "/portfolio/auto2g/img-04.webp",
      "/portfolio/auto2g/img-05.webp",
    ],
  },
  {
    id: "p2",
    title: "Fit & Smile",
    category: "Web App & Social Media",
    year: "2025",
    description:
      "<b>Digitalizzazione e Scalabilità nel Fitness.</b>\n\nAbbiamo trasformato una visione in un business digitale completo.\nDalla creazione del concept alla progettazione di una Web App proprietaria per lo streaming degli allenamenti, abbiamo costruito un ecosistema che vende fitness 24/7, superando i limiti fisici della palestra tradizionale.\n\n<b>L'IMPATTO DEL PROGETTO:</b>\n\n<b>Business Concept & Brand Identity:</b> Definizione del marchio e del posizionamento per dominare la nicchia di riferimento.\n\n<b>Infrastruttura Web App:</b> Sviluppo della piattaforma streaming e produzione professionale di tutti i video corsi.\n\n<b>Strategia di Acquisizione:</b> Creazione di contenuti social ad alto impatto che hanno generato un flusso costante di richieste di iscrizione.",
    mediaType: "video",
    mediaSrc: "",
    accentColor: "linear-gradient(135deg, #001a3d, #002a5c)",
    tags: ["Web App", "Social Media", "Branding", "Content Creation"],
    reels: [
      "https://iframe.mediadelivery.net/embed/604848/ea2dc520-3aa9-40e0-89a2-abc73aeb1efb?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
      "https://iframe.mediadelivery.net/embed/604848/7739b0de-8d54-4c7b-8aed-34d8c7202af1?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
      "https://iframe.mediadelivery.net/embed/604848/996c61ce-1752-4adf-b318-c1cfeb7af7ca?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
      "https://iframe.mediadelivery.net/embed/604848/7a1cc3e6-4973-407a-93e4-47937f8ff950?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
    ],
    gallery: [
      "/portfolio/fitandsmile/img-01.webp",
      "/portfolio/fitandsmile/img-02.webp",
      "/portfolio/fitandsmile/img-03.webp",
      "/portfolio/fitandsmile/img-04.webp",
      "/portfolio/fitandsmile/img-05.webp",
    ],
    galleryAspectRatio: "4/5",
  },
  {
    id: "p5",
    title: "Video Production & Cinematic Editing",
    category: "Produzione Video",
    year: "2025",
    description:
      "<b>Tattoo Art Experience</b>\n\nAbbiamo trasformato l'arte del tatuaggio in un’esperienza cinematografica.\nAttraverso riprese in stile film e un editing ricercato, abbiamo creato un racconto visivo che esalta il dettaglio, la tecnica e l'atmosfera dello studio, differenziandolo nettamente dalla concorrenza.\n\n<b>IL VALORE DEL SERVIZIO:</b>\n\n<b>Riprese Professionali:</b> Utilizzo di tecniche cinematografiche per un impatto visivo di alto livello.\n\n<b>Editing su Misura:</b> Montaggio dinamico con stili e ritmi personalizzati in base all’identità del brand.\n\n<b>Flessibilità Totale:</b> Realizziamo anche solo la fase di ripresa ed editing per progetti specifici o campagne mirate.",
    mediaType: "video",
    mediaSrc: "",
    accentColor: "linear-gradient(135deg, #001a10, #003d25)",
    tags: [
      "Video Cinematico",
      "Editing Professionale",
      "Storytelling",
      "Brand Video",
    ],
    reels: [
      "https://iframe.mediadelivery.net/embed/604848/0fa6efb4-a0d1-49d7-b691-356f9fd3704f?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false",
    ],
  },
];

// ─── Palette for numbered indicator ──────────────────────────────────────────
const CARD_OVERLAYS = [
  "rgba(0,0,0,0.45)",
  "rgba(0,0,0,0.50)",
  "rgba(0,0,0,0.45)",
  "rgba(0,0,0,0.55)",
  "rgba(0,0,0,0.45)",
  "rgba(0,0,0,0.50)",
];

// ─── Component ────────────────────────────────────────────────────────────────
export const Portfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(
    null,
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const currentCardIndexRef = useRef(0);
  const prefersReduced = useReducedMotion();

  // ── Track section visibility ───────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { trackSectionView('portfolio'); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = cardsRef.current;
    const count = cards.length;

    // Initial state: all cards except first are below the viewport
    cards.forEach((card, i) => {
      if (i === 0) return;
      gsap.set(card, { y: "100%" });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: `+=${count * 100}%`,
        pin: true,
        pinSpacing: true,
        scrub: prefersReduced ? true : 0.8,
        invalidateOnRefresh: true,
        // Ensures Portfolio recalculates AFTER ScrollVideo (which has default priority 0)
        refreshPriority: -1,
        onUpdate: (self) => {
          const newIndex = Math.min(
            count - 1,
            Math.floor(self.progress * count),
          );
          if (currentCardIndexRef.current !== newIndex) {
            currentCardIndexRef.current = newIndex;
            setCurrentCardIndex(newIndex);
          }
        },
      },
    });

    // For each transition: slide current card up while next card slides in
    for (let i = 0; i < count - 1; i++) {
      const currentCard = cards[i];
      const nextCard = cards[i + 1];

      tl.to(
        nextCard,
        {
          y: "0%",
          duration: 1,
          ease: "power2.inOut",
        },
        i,
      ).to(
        currentCard,
        {
          scale: 0.92,
          opacity: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        i,
      );
    }

    // Refresh after a short delay to let all other ScrollTriggers (ScrollVideo)
    // register their spacers first
    const rafId = setTimeout(() => {
      try {
        ScrollTrigger.refresh();
      } catch (_e) {
        // Strict Mode may cause transient DOM issues; retry next frame
        requestAnimationFrame(() => {
          try {
            ScrollTrigger.refresh();
          } catch (_) {
            /* ignore */
          }
        });
      }
    }, 200);

    return () => {
      clearTimeout(rafId);
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === container) st.kill();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  return (
    <>
      {/* Section Header — above the pinned area */}
      <div
        style={{
          backgroundColor: "#000",
          padding:
            "clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px) clamp(40px, 6vw, 80px)",
        }}
      >
        <p
          style={{
            color: "var(--color-gold)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: "0 0 16px",
          }}
        >
          Portfolio
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
            margin: "0 0 16px",
          }}
        >
          I nostri
          <br />
          progetti.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            maxWidth: "480px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Scorri per esplorare il nostro lavoro — dal branding alla produzione
          video, dai siti web alle campagne social.
        </p>
      </div>

      {/* Pinned card stack */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100dvh",
          minHeight: "100dvh",
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        {/* Vertical progress dots */}
        <div
          style={{
            position: "absolute",
            right: "clamp(12px, 3vw, 24px)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {PROJECTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: currentCardIndex === i ? 20 : 4,
                borderRadius: 2,
                backgroundColor:
                  currentCardIndex === i ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          ))}
        </div>

        {PROJECTS.map((project, i) => (
          <div
            key={project.id}
            ref={(el) => {
              if (el) cardsRef.current[i] = el;
            }}
            onClick={() => setActiveProject(project)}
            style={{
              position: "absolute",
              inset: 0,
              cursor: "none",
              willChange: "transform, opacity",
            }}
          >
            {/* Numero progressivo decorativo */}
            <div
              aria-hidden={true}
              style={{
                position: 'absolute',
                top: 16,
                left: 20,
                fontFamily: 'var(--font-title)',
                fontWeight: 900,
                fontSize: 'clamp(48px, 10vw, 80px)',
                color: 'rgba(255,255,255,0.04)',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 2,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>

            {/* Indicatore reels verticale — top-left per non collidere con NavBubble (top-right) */}
            {project.reels && project.reels.length > 0 && (
              <div
                aria-hidden={true}
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 72,
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              >
                {project.reels.map((_, reelIdx) => (
                  <div
                    key={reelIdx}
                    style={{
                      width: 3,
                      height: 28,
                      borderRadius: 2,
                      background: reelIdx === 0
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(255,255,255,0.22)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Background / Reels */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: 0,
              }}
            >
              {project.reels && project.reels.length > 0 ? (
                <div
                  className="portfolio-reels-bg"
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    overscrollBehaviorX: "contain",
                  }}
                >
                  {project.reels.map((reelUrl, idx) => (
                    <div
                      key={idx}
                      className="portfolio-reel-item"
                      style={{
                        flex: "0 0 auto",
                        width: "100%",
                        height: "100%",
                        scrollSnapAlign: "start",
                        scrollSnapStop: "always",
                        position: "relative",
                        backgroundColor: "#000",
                        overflow: "hidden",
                      }}
                    >
                      {/* Iframe mounting strategy (sliding window per performance):
                          - Active card    → mount all reels (full visibility)
                          - Adjacent cards → mount first reel only, opacity 0 (pre-warm)
                          - Far cards      → unmount (anche se già visti).
                          Accumulare iframe oltre ±1 causa frame-drop: ogni iframe Bunny
                          continua a decodificare il video in background anche a opacity 0. */}
                      {(() => {
                        const isActive = i === currentCardIndex;
                        const isAdjacent =
                          (i === currentCardIndex + 1 || i === currentCardIndex - 1) &&
                          idx === 0;
                        const shouldMount = isActive || isAdjacent;
                        if (!shouldMount) return null;
                        return (
                          <iframe
                            src={reelUrl}
                            loading="eager"
                            style={{
                              border: "none",
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              height: "100dvh",
                              width: "calc(100dvh * 9 / 16)",
                              minWidth: "100%",
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                              // Pre-warmed iframes are invisible but still buffer video
                              opacity: isActive ? 1 : 0,
                            }}
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            sandbox="allow-scripts allow-same-origin allow-autoplay"
                            allowFullScreen
                          />
                        );
                      })()}
                      {/* Invisible overlay to catch scroll/swipe events over the iframe */}
                      <div
                        style={{ position: "absolute", inset: 0, zIndex: 1 }}
                      />
                    </div>
                  ))}
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                                        .portfolio-reels-bg::-webkit-scrollbar {
                                            display: none;
                                        }
                                        @media (min-width: 768px) {
                                            .portfolio-reels-bg {
                                                display: grid !important;
                                                grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
                                                overflow: hidden !important;
                                            }
                                            .portfolio-reel-item {
                                                width: 100% !important;
                                            }
                                            .portfolio-swipe-hint {
                                                display: none !important;
                                            }
                                        }
                                        @keyframes swipeHand {
                                            0%, 100% { transform: translateX(5px) rotate(5deg); opacity: 0.5; }
                                            50% { transform: translateX(-15px) rotate(-5deg); opacity: 1; }
                                        }
                                        .swipe-icon {
                                            animation: swipeHand 3s infinite ease-in-out;
                                        }
                                        @keyframes swipeHintShimmer {
                                            0%, 100% {
                                                transform: scale(1);
                                                box-shadow: 0 4px 16px rgba(0,0,0,0.55), 0 0 0 0 rgba(197,165,90,0.6), inset 0 1px 0 rgba(255,255,255,0.4);
                                            }
                                            50% {
                                                transform: scale(1.05);
                                                box-shadow: 0 6px 22px rgba(0,0,0,0.6), 0 0 0 8px rgba(197,165,90,0), inset 0 1px 0 rgba(255,255,255,0.5);
                                            }
                                        }
                                    `,
                    }}
                  />
                </div>
              ) : project.mediaType === "video" && project.mediaSrc ? (
                <video
                  src={project.mediaSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : project.mediaSrc ? (
                <img
                  src={project.mediaSrc}
                  alt={project.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: project.accentColor,
                  }}
                />
              )}
            </div>

            {/* Dark overlay — concentrated in bottom third where info sits,
                lighter above so the video reads clearly */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 30%, ${CARD_OVERLAYS[i % CARD_OVERLAYS.length]} 55%, transparent 75%)`,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Bottom info overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "clamp(24px, 5vw, 60px)",
              }}
            >
              {/* Category + year */}
              <div
                style={{
                  color: "var(--color-gold)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-subtitle)",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                {project.category}
              </div>

              {/* Title */}
              <h3
                style={{
                  color: "#fff",
                  fontSize: "clamp(1.6rem, 6vw, 3.5rem)",
                  fontFamily: "var(--font-title)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  margin: "0 0 20px",
                }}
              >
                {project.title}
              </h3>

              {/* Tag progetto */}
              {project.tags && project.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        border: '1px solid rgba(197,165,90,0.4)',
                        color: 'var(--color-gold)',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-subtitle)',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                      }}
                    >{tag}</span>
                  ))}
                </div>
              )}

              {/* CTA & Swipe Indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  data-cursor="ring"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#000",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-subtitle)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "0",
                    backdropFilter: "none",
                    WebkitBackdropFilter: "none",
                    backgroundColor: "#fff",
                  }}
                >
                  Scopri il progetto
                  <span style={{ fontSize: "0.9rem" }}>→</span>
                </div>

                {/* Mobile Swipe Indicator (Visible only if there are reels) */}
                {project.reels && project.reels.length > 0 && (
                  <div
                    className="portfolio-swipe-hint"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#0a0a0a",
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-subtitle)",
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "10px 18px",
                      background: "var(--color-gold)",
                      borderRadius: "999px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
                      animation: "swipeHintShimmer 2.2s ease-in-out infinite",
                      alignSelf: "flex-start",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="swipe-icon"
                    >
                      {/* Lucide Hand Pointer */}
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2v0" />
                      <path d="M6 14v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2v0" />
                      <path d="M18 11h2a2 2 0 0 1 2 2v3.7c0 3.3-2.3 6.3-5.5 7L12 24l-6.5-6.5M6 14v4l-3-1.5" />
                    </svg>
                    Scorri i video
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <ProjectModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </>
  );
};

export default Portfolio;
