import React, {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePreload } from "../hooks/usePreload";
import { useReducedMotion } from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Inject scroll-hint keyframe once
const SV_STYLE_ID = "scrollvideo-styles";
if (typeof document !== "undefined" && !document.getElementById(SV_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = SV_STYLE_ID;
  s.textContent = `
        @keyframes svScrollDrop {
            0%   { opacity: 0;   transform: translateY(-6px); }
            40%  { opacity: 0.7; transform: translateY(0);    }
            100% { opacity: 0;   transform: translateY(8px);  }
        }
        @keyframes svScrollPulse {
            0%, 100% { opacity: 0.55; }
            50%      { opacity: 0.9; }
        }
        @keyframes svIconPulse {
            0%, 100% { opacity: 0.7; }
            50%      { opacity: 1;   }
        }
        @keyframes svFadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to   { opacity: 1; transform: translateY(0);   }
        }
    `;
  document.head.appendChild(s);
}

// Layout types for diverse service presentations
type LayoutType = "cards" | "gallery" | "testimonial" | "stats" | "video";

interface ServiceContent {
  image?: string;
  title?: string;
  description?: string;
  value?: string; // For stats
  suffix?: string; // For stats
  author?: string; // For testimonial
  videoUrl?: string; // For video
}

interface Service {
  title: string;
  description: string;
  layoutType: LayoutType;
  items?: ServiceContent[];
}

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

// Short labels for the vertical timeline nav
const SERVICE_LABELS = [
  "Social",
  "Content",
  "Strumenti",
  "Shooting",
  "AI Video",
  "Web",
];

// Recap cards shown during transitions
const SERVICE_RECAP = [
  {
    icon: "📱",
    title: "Social",
    desc: "Gestione strategica dei tuoi canali social per costruire una community autentica e coinvolta.",
  },
  {
    icon: "✏️",
    title: "Content",
    desc: "Piani editoriali e contenuti mirati che raccontano il tuo brand con coerenza e impatto.",
  },
  {
    icon: "⚙️",
    title: "Strumenti",
    desc: "Tool professionali, automazioni e dashboard per ottimizzare ogni processo digitale.",
  },
  {
    icon: "📷",
    title: "Shooting",
    desc: "Foto e video professionali sul set, pensati per valorizzare prodotti, spazi e persone.",
  },
  {
    icon: "🎬",
    title: "AI Video",
    desc: "Video generati e potenziati con intelligenza artificiale per contenuti innovativi e scalabili.",
  },
  {
    icon: "🌐",
    title: "Web",
    desc: "Siti web, landing page e applicativi su misura, veloci, ottimizzati e pronti a convertire.",
  },
];

// ── Animated counter for stats values ────────────────────────────────────────
// Parses values like "+500K", "+40%", "100%" and animates the number portion
// based on a 0-1 visibility progress (scroll-driven, so it goes both ways).
function AnimatedStat({
  value,
  vis,
  style,
}: {
  value: string;
  vis: number;
  style: React.CSSProperties;
}) {
  // Extract prefix (e.g. "+"), numeric part, and suffix (e.g. "K", "%")
  const match = value.match(/^([+\-]?)(\d+)(.*)/);
  if (!match) return <div style={style}>{value}</div>;

  const prefix = match[1];
  const target = parseInt(match[2], 10);
  const suffix = match[3];

  const current = Math.round(target * Math.min(vis, 1));

  return (
    <div style={style}>
      {prefix}
      {current}
      {suffix}
    </div>
  );
}

// Frame sets per device type
const DESKTOP_FRAME_COUNT = 908;
const DESKTOP_FRAMES_PATH = "/frames/section-2";
const MOBILE_FRAME_COUNT = 445;
const MOBILE_FRAMES_PATH = "/frames_9_16/section-2";

// Mobile breakpoint for matchMedia checks
const MOBILE_QUERY = "(max-width: 767px)";

// Animation configuration
const FAST_FRAME_ALLOCATION = 0.6;
const SLOW_FRAME_ALLOCATION = 0.4;

// ── Loading overlay: phase icons & labels ────────────────────────────────────
const SvIconDownload: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v12" />
    <path d="M8 11l4 4 4-4" />
    <path d="M4 19h16" />
  </svg>
);
const SvIconLayers: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 12l10 5 10-5" />
    <path d="M2 17l10 5 10-5" />
  </svg>
);
const SvIconPlay: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8l6 4-6 4V8z" />
  </svg>
);
const SvIconCheck: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);
const SvIconWarning: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 1 }}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const SV_LOAD_ICONS = [
  SvIconDownload,
  SvIconLayers,
  SvIconPlay,
  SvIconCheck,
] as const;
const SV_PHASE_LABELS = [
  "Download risorse",
  "Preparazione frame",
  "Composizione",
  "Quasi pronto",
] as const;

export const ScrollVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const currentFrameRef = useRef<number>(0);
  // Stable ref for images — avoids re-creating ScrollTrigger when background
  // chunks update the images array (which gets a new reference each time).
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const [currentServiceIndex, setCurrentServiceIndex] = useState<number>(-1);
  const [serviceOpacity, setServiceOpacity] = useState<number>(0);
  const [introOpacity, setIntroOpacity] = useState<number>(1);
  const [introTextOpacity, setIntroTextOpacity] = useState<number>(1);
  const [headerOpacity, setHeaderOpacity] = useState<number>(1);

  const [showFirstPhrase, setShowFirstPhrase] = useState(false);
  const subtitleText =
    "la tua azienda merita una strategia più veloce del passaparola.";
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [showCTA, setShowCTA] = useState(false);

  const [segmentProgress, setSegmentProgress] = useState<number>(0);
  // Global scroll progress (0-1) across the entire ScrollVideo section
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  // Whether we're in a transition (fast segment) between services
  const [isTransition, setIsTransition] = useState(false);
  // The service index that the user is approaching next (shown during transitions)
  const [upcomingServiceIndex, setUpcomingServiceIndex] = useState<number>(0);
  // Track if user has ever reached near the video service (index 4) to lazy-load iframe
  const [videoReached, setVideoReached] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  // Canvas + intro text must stay hidden until the user actually scrolls,
  // so the IntroOverlay (WIDE logo) is fully cleared before the first frame appears.
  const [hasScrolled, setHasScrolled] = useState(false);
  const hasScrolledRef = useRef(false);
  const progressRef = useRef<number>(0);
  const lastRawProgressRef = useRef<number>(0);

  const prefersReduced = useReducedMotion();
  // Use a ref so the ScrollTrigger closure (created on isLoaded) reads the live value
  const prefersReducedRef = useRef(prefersReduced);
  useEffect(() => {
    prefersReducedRef.current = prefersReduced;
  }, [prefersReduced]);

  // Detect mobile before first paint. useLayoutEffect only runs in the browser.
  useLayoutEffect(() => {
    setIsMobile(window.matchMedia(MOBILE_QUERY).matches);
  }, []);

  // Derive the correct frame config from isMobile
  const framesPath = isMobile ? MOBILE_FRAMES_PATH : DESKTOP_FRAMES_PATH;
  const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;
  // Request only a tiny fraction of frames on mobile to ensure LCP happens fast.
  const initialFrameCount = isMobile ? 8 : 15;

  const {
    images,
    fallbackImage,
    progress,
    isLoaded,
    preloadFrames,
    resumeBackgroundLoading,
  } = usePreload();

  // Keep the refs in sync with the latest arrays/images
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Stable ref for the fallback so drawFrame can read it without re-creating
  const fallbackRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    fallbackRef.current = fallbackImage;
  }, [fallbackImage]);

  // Keep progressRef in sync so the network-detection timer can read the live value
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Find the closest loaded frame looking backwards
      let targetImg = imagesRef.current[frameIndex];

      if (!targetImg || !targetImg.naturalWidth) {
        // Search backwards for the most recently loaded frame
        // This creates a graceful stutter instead of a flashback to frame 0
        for (let i = frameIndex - 1; i > 0; i--) {
          const candidate = imagesRef.current[i];
          if (candidate && candidate.naturalWidth) {
            targetImg = candidate;
            break;
          }
        }
      }

      // Final fallback (frame 0) if nothing earlier was found
      const img = targetImg?.naturalWidth
        ? targetImg
        : (fallbackRef.current ?? targetImg);

      if (!canvas || !ctx || !img || !img.naturalWidth) return;

      // canvas.width/height are in device pixels (innerWidth * dpr).
      // After ctx.scale(dpr, dpr), all drawing coordinates are in CSS pixels.
      // We must divide by dpr to get the CSS-pixel dimensions for correct scaling.
      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / dpr; // CSS pixels
      const canvasHeight = canvas.height / dpr; // CSS pixels
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // The corrective zoom is calibrated for the 16:9 desktop frame sequence.
      // For the 9:16 mobile frames there is no equivalent discontinuity.
      const correctiveZoom = !isMobile && frameIndex >= 341 ? 1.03 : 1.0;
      const scale =
        Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) *
        correctiveZoom;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    },
    [isMobile],
  ); // No dependency on images — reads from imagesRef

  // Stable ref so the ScrollTrigger closure always calls the latest drawFrame
  const drawFrameRef = useRef(drawFrame);
  useEffect(() => {
    drawFrameRef.current = drawFrame;
  }, [drawFrame]);

  const handleCanvasResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      contextRef.current = ctx;
    }
    if (imagesRef.current.length > 0) drawFrame(currentFrameRef.current);
  }, [drawFrame]);

  // Listen to the breakpoint crossing to decide which frame set to load.
  // Using MediaQueryList is more reliable than innerWidth in DevTools emulation.
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Re-load frames when the device category flips.
  // Wait until isMobile is definitively detected (not null).
  useEffect(() => {
    if (isMobile === null) return;
    preloadFrames(framesPath, frameCount, initialFrameCount);
    // framesPath/frameCount are derived from isMobile — re-run only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadFrames, isMobile, initialFrameCount]);

  // Slow network detection: check navigator.connection immediately, then fall
  // back to a timer-based check (if after 5s progress is still very low).
  useEffect(() => {
    const conn = (
      navigator as unknown as { connection?: { effectiveType?: string } }
    ).connection;
    if (
      conn?.effectiveType &&
      ["slow-2g", "2g", "3g"].includes(conn.effectiveType)
    ) {
      setIsSlowNetwork(true);
      return;
    }
    const timer = setTimeout(() => {
      if (progressRef.current < 20) setIsSlowNetwork(true);
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle canvas pixel sizing on every resize.
  useEffect(() => {
    handleCanvasResize();
    window.addEventListener("resize", handleCanvasResize);
    return () => window.removeEventListener("resize", handleCanvasResize);
  }, [handleCanvasResize]);

  // Draw initial frame as soon as images are ready
  useEffect(() => {
    if (isLoaded && imagesRef.current.length > 0) {
      drawFrame(0);
    }
  }, [isLoaded, drawFrame]);

  // Detect when the user starts scrolling (IntroOverlay fades at 20px)
  useEffect(() => {
    if (hasScrolled) return;
    const onScroll = () => {
      if (window.scrollY > 20) {
        setHasScrolled(true);
        resumeBackgroundLoading();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasScrolled, resumeBackgroundLoading]);

  // Track when ScrollVideo section enters viewport
  const [sectionVisible, setSectionVisible] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Intro text sequence — waits until section is visible in viewport
  useEffect(() => {
    if (!isLoaded || !sectionVisible) return;

    let subtitleTypingTimeout: number;
    let typingInterval: number;

    const firstPhraseTimeout = window.setTimeout(() => {
      setShowFirstPhrase(true);

      subtitleTypingTimeout = window.setTimeout(() => {
        let currentIdx = 0;
        typingInterval = window.setInterval(() => {
          setTypedSubtitle(subtitleText.slice(0, currentIdx + 1));
          currentIdx++;
          if (currentIdx >= subtitleText.length) {
            window.clearInterval(typingInterval);
            window.setTimeout(() => setShowCTA(true), 400);
          }
        }, 40);
      }, 600);
    }, 1500);

    return () => {
      window.clearTimeout(firstPhraseTimeout);
      window.clearTimeout(subtitleTypingTimeout);
      window.clearInterval(typingInterval);
    };
  }, [isLoaded, sectionVisible, subtitleText]);

  // Reset scroll position when loading completes so user starts at SocialProof
  useEffect(() => {
    if (isLoaded && window.scrollY < 10) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [isLoaded]);

  // Reveal canvas + intro text on first scroll — keeps them hidden while
  // the IntroOverlay (WIDE logo) is covering the screen.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 20 && !hasScrolledRef.current) {
        hasScrolledRef.current = true;
        setHasScrolled(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ref to track the active ScrollTrigger instance across Strict Mode re-mounts
  const stRef = useRef<ScrollTrigger | null>(null);
  // Store segments data so click handlers can calculate scroll targets
  const segmentsDataRef = useRef<
    {
      startProgress: number;
      endProgress: number;
      type: string;
      serviceIndex?: number;
    }[]
  >([]);

  // Main ScrollTrigger logic — depends only on isLoaded (stable boolean)
  // drawFrame reads from imagesRef so it doesn't need to be a dependency.
  useEffect(() => {
    if (!isLoaded || imagesRef.current.length === 0 || !containerRef.current)
      return;

    // Kill any leftover ScrollTrigger from a previous mount (React Strict Mode)
    if (stRef.current) {
      stRef.current.kill();
      stRef.current = null;
    }

    const serviceCount = SERVICES.length;
    const totalFrames = imagesRef.current.length;
    const fastSegments = serviceCount + 1;
    const slowSegments = serviceCount;
    const totalSegments = fastSegments + slowSegments;

    // Slow segments (services visible) get 2.5× more scroll space than fast segments (transitions)
    const slowWeight = 2.5;
    const totalWeight = fastSegments * 1 + slowSegments * slowWeight;
    const fastSegmentSize = 1 / totalWeight;
    const slowSegmentSize = slowWeight / totalWeight;

    const framesPerFastSegment = Math.floor(
      (totalFrames * FAST_FRAME_ALLOCATION) / fastSegments,
    );
    const framesPerSlowSegment = Math.floor(
      (totalFrames * SLOW_FRAME_ALLOCATION) / slowSegments,
    );

    interface Segment {
      type: "fast" | "slow";
      startProgress: number;
      endProgress: number;
      startFrame: number;
      endFrame: number;
      serviceIndex?: number;
    }

    const segments: Segment[] = [];
    let currProgress = 0;
    let currFrame = 0;

    for (let i = 0; i < totalSegments; i++) {
      const isSlow = i % 2 === 1;
      if (isSlow) {
        const serviceIndex = Math.floor(i / 2);
        segments.push({
          type: "slow",
          startProgress: currProgress,
          endProgress: currProgress + slowSegmentSize,
          startFrame: currFrame,
          endFrame: currFrame + framesPerSlowSegment,
          serviceIndex,
        });
        currProgress += slowSegmentSize;
        currFrame += framesPerSlowSegment;
      } else {
        segments.push({
          type: "fast",
          startProgress: currProgress,
          endProgress: currProgress + fastSegmentSize,
          startFrame: currFrame,
          endFrame: currFrame + framesPerFastSegment,
        });
        currProgress += fastSegmentSize;
        currFrame += framesPerFastSegment;
      }
    }

    if (segments.length > 0) {
      segments[segments.length - 1].endFrame = totalFrames - 1;
      segments[segments.length - 1].endProgress = 1;
    }

    // Store segments for click-to-scroll
    segmentsDataRef.current = segments.map((s) => ({
      startProgress: s.startProgress,
      endProgress: s.endProgress,
      type: s.type,
      serviceIndex: s.serviceIndex,
    }));

    const container = containerRef.current;

    // On mobile, increase scroll distance so each service requires more physical
    // scrolling — prevents swipe-fling from racing through sections too quickly.
    const scrollEnd = isMobile ? "+=1100%" : "+=700%";

    // Calculate snap points at the end of every "slow" segment (where a service is shown).
    // This enforces a pause so users scrolling very fast don't blow past sections.
    const snapPoints: number[] = [];
    segments.forEach((seg) => {
      if (seg.type === "slow") {
        // Dead zone is 0.05, so we must map the segment's progress back to the raw scroll progress
        const DEAD_ZONE = 0.05;
        const rawSnapPoint = seg.endProgress * (1 - DEAD_ZONE) + DEAD_ZONE;
        snapPoints.push(rawSnapPoint);
      }
    });

    const scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: scrollEnd,
      pin: true,
      pinSpacing: true,
      scrub: prefersReducedRef.current ? true : isMobile ? 1.2 : 0.8,
      snap:
        snapPoints.length > 0
          ? {
              snapTo: (dest: number) => {
                const current = lastRawProgressRef.current;
                const direction = dest >= current ? 1 : -1;

                if (direction === 1) {
                  // Find the first snap point we crossed going down
                  const passedSnap = snapPoints.find(
                    (p) => p > current && p <= dest,
                  );
                  if (passedSnap !== undefined) return passedSnap;
                } else {
                  // Find the first snap point we crossed going up
                  const passedSnap = [...snapPoints]
                    .reverse()
                    .find((p) => p < current && p >= dest);
                  if (passedSnap !== undefined) return passedSnap;
                }

                // No boundary crossed: don't snap to a grid, let scroll land naturally
                return dest;
              },
              duration: { min: 0.2, max: 0.5 },
              delay: 0.1,
              ease: "power2.out",
            }
          : undefined,
      onUpdate: (self) => {
        const rawProgress = self.progress;
        lastRawProgressRef.current = rawProgress;

        // Global progress for title fade (independent of DEAD_ZONE mapping)
        // Title fades out completely by 6% into the pinned section
        const TITLE_FADE_END = 0.06;
        if (rawProgress < TITLE_FADE_END) {
          setHeaderOpacity(1 - rawProgress / TITLE_FADE_END);
        } else {
          setHeaderOpacity(0);
        }

        // Dead zone: first 8% of scroll keeps frame 0 (flower with eye)
        // while the header and IntroOverlay (if still visible) clear out.
        const DEAD_ZONE = 0.08;
        const scrollProgress =
          rawProgress <= DEAD_ZONE
            ? 0
            : (rawProgress - DEAD_ZONE) / (1 - DEAD_ZONE);

        const currentSegment =
          segments.find(
            (seg) =>
              scrollProgress >= seg.startProgress &&
              scrollProgress < seg.endProgress,
          ) || segments[segments.length - 1];

        const segProg =
          (scrollProgress - currentSegment.startProgress) /
          (currentSegment.endProgress - currentSegment.startProgress);

        const frameRange = currentSegment.endFrame - currentSegment.startFrame;
        const frameIndex = Math.min(
          Math.max(
            0,
            Math.floor(currentSegment.startFrame + segProg * frameRange),
          ),
          totalFrames - 1,
        );

        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrameRef.current(frameIndex);
          window.dispatchEvent(
            new CustomEvent("scrollvideo-frame", {
              detail: { frame: frameIndex },
            }),
          );
        }

        // Intro text fades out early (girl's eye appears ~40% into first segment)
        const textFadeStart = segments[0].endProgress * 0.25;
        const textFadeEnd = segments[0].endProgress * 0.45;
        if (scrollProgress < textFadeStart) {
          setIntroTextOpacity(1);
        } else if (scrollProgress < textFadeEnd) {
          setIntroTextOpacity(
            1 -
              (scrollProgress - textFadeStart) / (textFadeEnd - textFadeStart),
          );
        } else {
          setIntroTextOpacity(0);
        }

        // CTA + vignette stay visible longer, fade out at end of first segment
        const introHoldEnd = segments[0].endProgress * 0.8;
        const introFadeEnd = segments[0].endProgress;
        if (scrollProgress < introHoldEnd) {
          setIntroOpacity(1);
        } else if (scrollProgress < introFadeEnd) {
          setIntroOpacity(
            1 - (scrollProgress - introHoldEnd) / (introFadeEnd - introHoldEnd),
          );
        } else {
          setIntroOpacity(0);
        }

        // Global progress for timeline
        setGlobalProgress(scrollProgress);

        if (
          currentSegment.type === "slow" &&
          currentSegment.serviceIndex !== undefined
        ) {
          const fadeInEnd = 0.1;
          const fadeOutStart = 0.9;
          let opacity = 1;
          if (segProg < fadeInEnd) opacity = segProg / fadeInEnd;
          else if (segProg > fadeOutStart)
            opacity = (1 - segProg) / (1 - fadeOutStart);

          setCurrentServiceIndex(currentSegment.serviceIndex);
          setServiceOpacity(opacity);
          setSegmentProgress(segProg);
          setIsTransition(false);
          if (currentSegment.serviceIndex >= 3) setVideoReached(true);
        } else {
          // During fast (transition) segments, figure out which service is next
          const segIdx = segments.indexOf(currentSegment);
          const nextSlowSeg = segments
            .slice(segIdx + 1)
            .find((s) => s.type === "slow");
          setUpcomingServiceIndex(nextSlowSeg?.serviceIndex ?? 0);
          setIsTransition(true);
          setServiceOpacity(0);
          setCurrentServiceIndex(-1);
          setSegmentProgress(0);
        }
      },
    });

    stRef.current = scrollTrigger;

    // Notify other ScrollTriggers to recalculate after pin spacer is created.
    // Wrapped in try-catch because React Strict Mode may cause a transient
    // DOM state where the pin spacer's parent is stale.
    const timerId = setTimeout(() => {
      try {
        ScrollTrigger.refresh();
      } catch (_e) {
        // Retry once – by now React has settled the DOM
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    }, 50);

    return () => {
      clearTimeout(timerId);
      if (stRef.current === scrollTrigger) {
        scrollTrigger.kill();
        stRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const currentService =
    currentServiceIndex >= 0 ? SERVICES[currentServiceIndex] : null;
  const serviceContentRef = useRef<HTMLDivElement>(null);

  // Click-to-scroll: jump to a specific service's slow segment
  const scrollToService = useCallback((serviceIdx: number) => {
    const st = stRef.current;
    const segments = segmentsDataRef.current;
    if (!st || segments.length === 0) return;

    const targetSeg = segments.find(
      (s) => s.type === "slow" && s.serviceIndex === serviceIdx,
    );
    if (!targetSeg) return;

    const DEAD_ZONE = 0.05;
    // Convert normalized progress back to raw progress
    const targetNormalized = targetSeg.startProgress + 0.05; // slightly into the segment
    const rawProgress = targetNormalized * (1 - DEAD_ZONE) + DEAD_ZONE;
    const targetScrollY = st.start + rawProgress * (st.end - st.start);

    window.scrollTo({ top: targetScrollY, behavior: "instant" });
  }, []);

  // Drive content scroll on mobile when service content overflows viewport
  useEffect(() => {
    const el = serviceContentRef.current;
    if (!el || !isMobile) return;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow <= 0) return;
    // Map middle portion of segment progress (0.12–0.88) to scrollTop
    const scrollStart = 0.12;
    const scrollEnd = 0.88;
    const t = Math.max(
      0,
      Math.min(1, (segmentProgress - scrollStart) / (scrollEnd - scrollStart)),
    );
    el.scrollTop = overflow * t;
  }, [segmentProgress, isMobile]);

  // Helper to calculate visibility progress for individual elements
  const getElementVisibility = useCallback(
    (index: number, total: number, start = 0.15, end = 0.85) => {
      const range = end - start;
      const windowSize = range / total;
      const elementStart = start + index * windowSize;
      const elementEnd = elementStart + windowSize * 0.7; // 70% of window for animation

      if (segmentProgress < elementStart) return 0;
      if (segmentProgress > elementEnd) return 1;
      return (segmentProgress - elementStart) / (elementEnd - elementStart);
    },
    [segmentProgress],
  );

  // Layout Variant Renderers
  const renderLayout = () => {
    if (!currentService) return null;

    const { layoutType, items = [] } = currentService;

    switch (layoutType) {
      case "cards":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: isMobile ? "clamp(10px, 2vw, 14px)" : "20px",
              marginTop: isMobile ? "12px" : "40px",
              width: "100%",
              maxWidth: "1200px",
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            {items.map((item, i) => {
              const vis = getElementVisibility(i, items.length);
              return (
                <div
                  key={i}
                  style={{
                    padding: isMobile
                      ? "clamp(14px, 4vw, 20px) clamp(16px, 4.5vw, 22px)"
                      : "24px",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderRadius: isMobile ? "14px" : "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    opacity: vis,
                    transform: `translateY(${20 * (1 - vis)}px)`,
                    transition: "transform 0.3s ease-out",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <h4
                    style={{
                      color: "#fff",
                      fontSize: isMobile ? "1.1rem" : "1.3rem",
                      fontFamily: "var(--font-title)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: isMobile ? "6px" : "15px",
                    }}
                  >
                    {item.title}
                  </h4>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.92)",
                      fontSize: isMobile ? "0.95rem" : "1.1rem",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: "pre-line" as const,
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      flex: 1,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        );

      case "stats":
        if (isMobile) {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(12px, 3vw, 16px)",
                padding: "16px 0",
                marginTop: "10px",
                width: "100%",
                maxWidth: "420px",
              }}
            >
              {items.map((item, i) => {
                const vis = getElementVisibility(i, items.length);
                return (
                  <div
                    key={i}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      opacity: vis,
                      padding: "clamp(18px, 5vw, 28px) clamp(16px, 4vw, 24px)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      transition: "all 0.4s ease-out",
                      transform: `translateY(${15 * (1 - vis)}px)`,
                    }}
                  >
                    <AnimatedStat
                      value={item.value || ""}
                      vis={vis}
                      style={{
                        color: "#fff",
                        fontSize: "clamp(2rem, 7vw, 2.6rem)",
                        fontFamily: "var(--font-title)",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    />
                    <div
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "clamp(0.7rem, 2vw, 0.78rem)",
                        fontFamily: "var(--font-subtitle)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginTop: "6px",
                      }}
                    >
                      {item.suffix}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.82)",
                        fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
                        marginTop: "10px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 400,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "0",
              marginTop: "60px",
              width: "100%",
              maxWidth: "1100px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Core Stat (Big Left) */}
            <div
              style={{
                padding: "80px 60px",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity: getElementVisibility(0, 3),
              }}
            >
              <AnimatedStat
                value={items[0].value || ""}
                vis={getElementVisibility(0, 3)}
                style={{
                  color: "#fff",
                  fontSize: "6rem",
                  fontFamily: "var(--font-title)",
                  fontWeight: 700,
                  lineHeight: 0.9,
                }}
              />
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "1.1rem",
                  fontFamily: "var(--font-subtitle)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  marginTop: "20px",
                }}
              >
                {items[0].suffix}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "1.4rem",
                  marginTop: "30px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  maxWidth: "400px",
                }}
              >
                {items[0].description}
              </div>
            </div>

            {/* Secondary Stats (Stacked Right) */}
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
              {items.slice(1).map((item, i) => {
                const vis = getElementVisibility(i + 1, 3);
                return (
                  <div
                    key={i}
                    style={{
                      padding: "40px 50px",
                      borderBottom:
                        i === 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      opacity: vis,
                    }}
                  >
                    <AnimatedStat
                      value={item.value || ""}
                      vis={vis}
                      style={{
                        color: "#fff",
                        fontSize: "3rem",
                        fontFamily: "var(--font-title)",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    />
                    <div
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-subtitle)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        marginTop: "8px",
                      }}
                    >
                      {item.suffix}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "1rem",
                        marginTop: "12px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 400,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "testimonial":
        return (
          <div
            style={{
              marginTop: "40px",
              maxWidth: "700px",
              textAlign: "center",
            }}
          >
            {items.map((item, i) => {
              const vis = getElementVisibility(i, items.length);
              return (
                <div
                  key={i}
                  style={{
                    opacity: vis,
                    transform: `translateY(${10 * (1 - vis)}px)`,
                    transition: "opacity 0.5s ease-out",
                  }}
                >
                  <p
                    style={{
                      color: "#fff",
                      fontSize: isMobile
                        ? "clamp(1.2rem, 4.5vw, 1.6rem)"
                        : "1.8rem",
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                      fontStyle: "italic",
                      lineHeight: 1.45,
                    }}
                  >
                    {item.description}
                  </p>
                  <div
                    style={{
                      marginTop: "20px",
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "var(--font-subtitle)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontSize: isMobile
                        ? "clamp(0.78rem, 2.2vw, 0.88rem)"
                        : "0.9rem",
                    }}
                  >
                    — {item.author}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "gallery":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: isMobile ? "6px" : "12px",
              marginTop: isMobile ? "6px" : "20px",
              width: "100%",
              maxWidth: isMobile ? "92vw" : "500px",
              padding: 0,
              alignItems: "stretch",
            }}
          >
            {items.map((item, i) => {
              const vis = getElementVisibility(i, items.length);
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderRadius: isMobile ? "10px" : "14px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: isMobile ? "14px 10px 12px" : "24px 18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    opacity: vis,
                    transform: `translateY(${10 * (1 - vis)}px)`,
                    height: "100%",
                    transition: "all 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontSize: isMobile ? "0.86rem" : "1.1rem",
                      fontFamily: "var(--font-subtitle)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "left",
                      lineHeight: 1.2,
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.92)",
                      fontSize: isMobile ? "0.78rem" : "0.92rem",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      textAlign: "left",
                      marginTop: isMobile ? "4px" : "18px",
                      lineHeight: 1.35,
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "video":
        return (
          <div
            style={{
              marginTop: "30px",
              position: "relative",
              width: isMobile ? "90%" : "500px",
              aspectRatio: "16/9",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              pointerEvents: "auto",
            }}
          >
            {videoReached && (
              <iframe
                src="https://iframe.mediadelivery.net/embed/604848/6947a772-4a77-416c-85a6-c0b30154aeea?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=true"
                loading="lazy"
                style={{
                  border: "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "auto",
                }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const loadingPhase =
    progress < 30 ? 0 : progress < 60 ? 1 : progress < 90 ? 2 : 3;

  return (
    <section
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* Visually hidden but SEO-critical primary heading */}
      <h1
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: "0",
        }}
      >
        WIDE Agency | Sviluppo Web, Social Media Marketing & Digital Branding
      </h1>

      <h2
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: "0",
        }}
      >
        I nostri servizi e soluzioni digitali
      </h2>
      {/* Loading overlay — fades out smoothly when ready */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2001,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
          color: "#fff",
          opacity: isLoaded ? 0 : 1,
          transition: "opacity 0.8s ease",
          pointerEvents: isLoaded ? "none" : "all",
        }}
      >
        {/* Phase icon */}
        <div
          style={{
            position: "relative",
            width: 28,
            height: 28,
            marginBottom: 24,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {SV_LOAD_ICONS.map((Icon, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                opacity: loadingPhase === i ? 1 : 0,
                transition: "opacity 0.6s ease",
                animation:
                  loadingPhase === i
                    ? "svIconPulse 2s ease-in-out infinite"
                    : "none",
              }}
            >
              <Icon />
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 200,
            height: 2,
            backgroundColor: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            borderRadius: 1,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#fff",
              transition: "width 0.2s linear",
            }}
          />
        </div>

        {/* Label row */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
            }}
          >
            Caricamento
          </span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.32)",
              fontWeight: 400,
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>

        {/* Phase label */}
        <div
          style={{ position: "relative", height: 14, marginTop: 8, width: 200 }}
        >
          {SV_PHASE_LABELS.map((label, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                opacity: loadingPhase === i ? 1 : 0,
                transition: "opacity 0.6s ease",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Slow network warning */}
        {isSlowNetwork && (
          <div
            style={{
              position: "absolute",
              bottom: "clamp(28px, 5vw, 44px)",
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              animation: "svFadeIn 0.8s ease forwards",
            }}
          >
            <SvIconWarning />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.38)",
                }}
              >
                Connessione lenta rilevata
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Il caricamento richiede qualche istante in più.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Canvas — hidden until loading AND first scroll (so IntroOverlay clears first) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100vh",
          display: "block",
          zIndex: 0,
          opacity: isLoaded && hasScrolled ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* ── Section Title (Fades out on scroll) ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "#000",
          padding:
            "clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px) clamp(40px, 6vw, 80px)",
          opacity: headerOpacity,
          pointerEvents: headerOpacity < 0.1 ? "none" : "auto",
          transform: `translateY(${-20 * (1 - headerOpacity)}px)`,
          transition: "transform 0.4s ease-out",
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
          I nostri
          <br />
          servizi.
        </h2>
      </div>

      {/* ── Intro Text Overlay (Wait until first phrase typed) ── */}
      {/* Contrast Overlay (Vignette) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.78) 100%)",
          zIndex: 10,
          // Stronger vignette for all services except SMM (index 0) to improve text readability
          opacity:
            currentServiceIndex > 0
              ? Math.max(serviceOpacity * 1.8, introOpacity * 0.65)
              : Math.max(serviceOpacity, introOpacity * 0.65),
          pointerEvents: "none",
          transition: "opacity 0.3s ease-out",
        }}
      />

      {/* Intro Text */}
      {isLoaded &&
        hasScrolled &&
        currentServiceIndex === -1 &&
        introOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 4000,
              opacity: introOpacity,
              padding: isMobile ? "20px" : "40px",
              textAlign: "center",
              pointerEvents: "none",
              boxSizing: "border-box",
              transition: "opacity 0.3s ease-out",
            }}
          >
            <h2
              style={{
                color: "#fff",
                fontSize: isMobile ? "1.2rem" : "2.2rem",
                fontWeight: 700,
                lineHeight: 1.3,
                width: isMobile ? "100%" : "90vw",
                maxWidth: "1200px",
                margin: 0,
                letterSpacing: "-0.01em",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textShadow: `
                            0 4px 6px rgba(0,0,0,0.9), 
                            0 10px 40px rgba(0,0,0,0.8), 
                            0 0 10px rgba(0,0,0,0.5)
                        `,
              }}
            >
              <span
                style={{
                  opacity: showFirstPhrase ? introTextOpacity : 0,
                  transform: `translateY(${showFirstPhrase ? 0 : 10}px)`,
                  transition: "opacity 0.5s ease-out, transform 0.8s ease-out",
                  whiteSpace: isMobile ? "normal" : "nowrap",
                  textAlign: "center",
                  display: "block",
                  width: "100%",
                  fontSize: isMobile ? "1.8rem" : "4.2rem",
                  fontFamily: "var(--font-title)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                IL MONDO È CAMBIATO:
              </span>
              <span
                style={{
                  opacity: typedSubtitle ? introTextOpacity : 0,
                  fontFamily: "var(--font-subtitle)",
                  fontWeight: 600,
                  marginTop: isMobile ? "10px" : "20px",
                  fontSize: isMobile ? "1.1rem" : "1.8rem",
                  color: "rgba(255,255,255,0.95)",
                  minHeight: isMobile ? "1.8rem" : "2.8rem",
                  letterSpacing: "0.02em",
                  maxWidth: "900px",
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {typedSubtitle}
              </span>

              <button
                style={{
                  marginTop: isMobile ? "35px" : "60px",
                  padding: isMobile ? "12px 20px" : "18px 48px",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "1px solid #fff",
                  borderRadius: "0",
                  fontSize: isMobile ? "0.7rem" : "0.9rem",
                  fontFamily: "var(--font-subtitle)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: showCTA ? 1 : 0,
                  transform: `translateY(${showCTA ? 0 : 20}px)`,
                  pointerEvents: showCTA ? "all" : "none",
                  width: isMobile ? "90%" : "auto",
                  maxWidth: isMobile ? "400px" : "none",
                  whiteSpace: "nowrap",
                  boxSizing: "border-box",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
                onClick={() => {
                  document
                    .getElementById("contatti")
                    ?.scrollIntoView({ behavior: "instant" });
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 15px 40px rgba(0,0,0,0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.3)";
                }}
              >
                Prenota una chiamata conoscitiva
              </button>
            </h2>
          </div>
        )}

      {/* ── Service counter (e.g. "2 / 6") — bottom-left ──── */}
      {isLoaded && hasScrolled && currentServiceIndex >= 0 && (
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? "20px" : "clamp(20px, 4vw, 32px)",
            left: isMobile ? "14px" : "28px",
            zIndex: 30,
            pointerEvents: "none",
            opacity: serviceOpacity * 0.7,
            transition: "opacity 0.3s ease-out",
            display: "flex",
            alignItems: "baseline",
            gap: "3px",
            fontFamily: "var(--font-subtitle)",
            letterSpacing: "0.08em",
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: isMobile ? "0.85rem" : "0.95rem",
              fontWeight: 700,
            }}
          >
            {currentServiceIndex + 1}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: isMobile ? "0.6rem" : "0.65rem",
              fontWeight: 600,
            }}
          >
            / {SERVICES.length}
          </span>
        </div>
      )}

      {/* ── Vertical timeline nav — left side, visible during transitions ──── */}
      {isLoaded && hasScrolled && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 30,
            pointerEvents: isTransition && introOpacity === 0 ? "auto" : "none",
            opacity: isTransition && introOpacity === 0 ? 1 : 0,
            transition: "opacity 0.5s ease-out",
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            // Subtle background for readability
            background:
              "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 70%, transparent 100%)",
            paddingLeft: isMobile ? "14px" : "28px",
            paddingRight: isMobile ? "24px" : "40px",
            paddingTop: isMobile ? "8%" : "6%",
            paddingBottom: isMobile ? "8%" : "6%",
            gap: isMobile ? "10px" : "14px",
          }}
        >
          {/* Vertical track with scroll-driven fill */}
          <div
            style={{
              position: "relative",
              width: "1.5px",
              alignSelf: "stretch",
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: "1px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${globalProgress * 100}%`,
                backgroundColor: "rgba(255,255,255,0.35)",
                borderRadius: "1px",
                transition: "height 0.15s linear",
              }}
            />
          </div>

          {/* Labels + inline recap cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            {SERVICE_LABELS.map((label, i) => {
              const isUpcoming = upcomingServiceIndex === i;
              const servicePosition = (i + 0.5) / SERVICES.length;
              const isPast = globalProgress > servicePosition;
              const recap = SERVICE_RECAP[i];
              return (
                <div
                  key={i}
                  onClick={() => scrollToService(i)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isUpcoming ? (isMobile ? "5px" : "7px") : 0,
                    transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                    cursor: "pointer",
                    padding: "2px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "7px" : "10px",
                    }}
                  >
                    {/* Dot */}
                    <div
                      style={{
                        width: isUpcoming ? "8px" : "5px",
                        height: isUpcoming ? "8px" : "5px",
                        borderRadius: "50%",
                        backgroundColor: isUpcoming
                          ? "#fff"
                          : isPast
                            ? "rgba(255,255,255,0.7)"
                            : "rgba(255,255,255,0.5)",
                        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                        flexShrink: 0,
                        boxShadow: isUpcoming
                          ? "0 0 10px rgba(255,255,255,0.35)"
                          : "none",
                      }}
                    />
                    {/* Label */}
                    <span
                      style={{
                        fontSize: isUpcoming
                          ? isMobile
                            ? "0.92rem"
                            : "1.05rem"
                          : isMobile
                            ? "0.72rem"
                            : "0.82rem",
                        fontFamily: "var(--font-subtitle)",
                        fontWeight: isUpcoming ? 700 : 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: isUpcoming
                          ? "#fff"
                          : isPast
                            ? "rgba(255,255,255,0.7)"
                            : "rgba(255,255,255,0.5)",
                        textShadow: isUpcoming
                          ? "0 2px 12px rgba(0,0,0,0.7)"
                          : "0 1px 4px rgba(0,0,0,0.4)",
                        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Inline recap — icon + description under the upcoming label */}
                  {isUpcoming && recap && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: isMobile ? "6px" : "8px",
                        paddingLeft: isMobile ? "14px" : "18px",
                        maxWidth: isMobile ? "55vw" : "260px",
                        animation: "svFadeIn 0.4s ease forwards",
                      }}
                    >
                      <span
                        style={{
                          fontSize: isMobile ? "1rem" : "1.15rem",
                          flexShrink: 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {recap.icon}
                      </span>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: isMobile ? "0.78rem" : "0.88rem",
                          fontFamily: "var(--font-body)",
                          fontWeight: 400,
                          lineHeight: 1.45,
                          margin: 0,
                        }}
                      >
                        {recap.desc}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Scroll hint — right side, always visible with soft pulse ──── */}
      {isLoaded && hasScrolled && (
        <div
          style={{
            position: "absolute",
            right: isMobile ? "10px" : "22px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 30,
            pointerEvents: "none",
            transition: "opacity 0.5s ease-out",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "svScrollPulse 3s ease-in-out infinite",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: isMobile ? "0.5rem" : "0.58rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              writingMode: "vertical-rl" as const,
              transform: "rotate(180deg)",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              fontFamily: "var(--font-subtitle)",
              fontWeight: 600,
            }}
          >
            scroll
          </span>
          <div
            style={{
              width: "1px",
              height: "32px",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.05))",
              animation: "svScrollDrop 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* ── Skip section button — bottom-right ──── */}
      {isLoaded && hasScrolled && (
        <button
          style={{
            position: "absolute",
            bottom: "clamp(20px, 4vw, 32px)",
            right: isMobile ? "12px" : "20px",
            zIndex: 30,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "20px",
            color: "rgba(255,255,255,0.75)",
            fontSize: isMobile ? "0.6rem" : "0.65rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textShadow: "0 2px 4px rgba(0,0,0,0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: isMobile ? "8px 14px" : "9px 18px",
            fontFamily: "var(--font-subtitle)",
            fontWeight: 600,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
          onClick={() => {
            const el = document.getElementById("chi-siamo");
            if (el) el.scrollIntoView({ behavior: "instant" });
          }}
          aria-label="Salta la sezione servizi"
        >
          Salta sezione
          <svg
            width="10"
            height="10"
            viewBox="0 0 9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2.5,1.5 6.5,4.5 2.5,7.5" />
            <line x1="7" y1="1.5" x2="7" y2="7.5" />
          </svg>
        </button>
      )}

      {isLoaded && currentService && (
        <div
          ref={serviceContentRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 20,
            opacity: serviceOpacity,
            transition: "opacity 0.2s ease-out",
            padding: isMobile
              ? "clamp(85px, 20vw, 110px) clamp(18px, 5vw, 24px) clamp(70px, 15vw, 90px)"
              : "40px",
            textAlign: "center",
            overflowY: "hidden", // scroll driven by segmentProgress, not user
          }}
        >
          <div
            style={{
              transform: `translateY(${15 * (1 - serviceOpacity)}px)`,
              transition: "transform 0.3s ease-out",
              marginBottom: isMobile ? "8px" : "0",
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                color: "#fff",
                fontSize: isMobile ? "clamp(1.2rem, 4.5vw, 1.6rem)" : "2.8rem",
                fontFamily: "var(--font-title)",
                fontWeight: 700,
                lineHeight: isMobile ? 1.25 : 1.1,
                margin: 0,
                textShadow: "0 10px 40px rgba(0,0,0,0.8)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {isMobile &&
              currentService.title.toLowerCase().includes("su misura") ? (
                <>
                  {currentService.title.replace(/su misura/i, "")}
                  <br />
                  su misura
                </>
              ) : isMobile && currentService.title.includes(", ") ? (
                <>
                  {currentService.title.split(", ")[0]},<br />
                  {currentService.title.split(", ").slice(1).join(", ")}
                </>
              ) : (
                currentService.title
              )}
            </h3>
            <div
              style={{
                height: "2px",
                width: "30px",
                background: "#fff",
                margin: isMobile ? "8px auto" : "20px auto",
                opacity: 0.5,
              }}
            />
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: isMobile ? "clamp(0.82rem, 2.8vw, 1rem)" : "1.1rem",
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                maxWidth: isMobile ? "92vw" : "800px",
                margin: "0 auto",
                lineHeight: 1.4,
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                whiteSpace: "pre-line" as const,
              }}
            >
              {currentService.description}
            </p>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: isMobile ? "10px" : "0",
            }}
          >
            {renderLayout()}
          </div>
        </div>
      )}
    </section>
  );
};

export default ScrollVideo;
