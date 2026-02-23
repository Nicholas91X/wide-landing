import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePreload } from '../hooks/usePreload';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

// Layout types for diverse service presentations
type LayoutType = 'cards' | 'gallery' | 'testimonial' | 'stats' | 'video';

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
        title: 'Social Media Marketing',
        description: 'Non la solita vetrina, ma strategie per vendere e posizionare il tuo brand.',
        layoutType: 'cards',
        items: [
            { title: 'Strategia Sartoriale', description: "Studiamo il tuo mercato e creiamo un piano d'attacco su misura insieme a te, senza intermediari che rallentano il processo." },
            { title: 'Contenuti che Convertono', description: "Produciamo foto e video reali per catturare l'attenzione del tuo target e costruire un'identità visiva premium e inconfondibile." },
            { title: 'Pubblicità e Sponsorizzate', description: "Curiamo le tue sponsorizzate in prima persona, ottimizzando ogni centesimo per generare contatti qualificati e vendite reali, non semplici \"mi piace\"." },
        ]
    },
    {
        title: 'Creiamo Contenuti Che Convertono',
        description: 'Mostriamo il vero volto della tua azienda.',
        layoutType: 'stats',
        items: [
            { value: '+500K', suffix: 'Visite al profilo in organico', description: 'Raggiunte per i nostri clienti' },
            { value: '+40%', suffix: 'Di contatti generati', description: 'In organico' },
            { value: '100%', suffix: 'Originalità', description: 'Niente template, solo branding' },
        ]
    },
    {
        title: 'Creazione Applicativi Personalizzati',
        description: 'Software su misura per business scalabili.',
        layoutType: 'gallery',
        items: [
            { title: 'Dashboard UX', description: 'Sistemi modellati sui tuoi flussi di lavoro per azzerare i tempi di formazione del team.' },
            { title: 'Cloud Backend', description: 'Reparti connessi e dati blindati.\nIl controllo totale della tua azienda, in tempo reale.' },
            { title: 'Cross Platform', description: 'Applicativi adatti sia a sistemi Android che iOS.' },
            { title: 'AI Integration', description: 'Automatizziamo i processi aziendali e diamo vita alle tue idee, sviluppando strumenti AI esclusivi esattamente come li desideri.' },
        ]
    },
    {
        title: 'Shooting Video/Fotografici',
        description: 'Qualità cinematografica con attrezzatura Pro.',
        layoutType: 'testimonial',
        items: [
            {
                description: '"La qualità delle riprese ha cambiato radicalmente la percezione del nostro brand."',
                author: 'CEO di AUTO2G'
            }
        ]
    },
    {
        title: 'Produzioni Video con Intelligenza Artificiale',
        description: 'Diamo vita a ciò che non esiste ancora.\nScenari, animazioni e video ad altissimo impatto per presentare i tuoi prodotti come leader di settore.',
        layoutType: 'video',
        items: [
            { title: 'Guarda cosa possiamo far fare al tuo prodotto.', description: '' }
        ]
    },
    {
        title: 'Sviluppo Piattaforme Web ed E-commerce',
        description: 'Esperienze immersive e conversion-oriented.',
        layoutType: 'cards',
        items: [
            { title: 'Landing page', description: 'Pagine progettate esclusivamente per trasformare il traffico delle tue campagne in contatti qualificati' },
            { title: 'E-commerce', description: "Negozi online strutturati per massimizzare le vendite, rendendo l'esperienza di acquisto dei tuoi clienti facile, sicura e senza ostacoli." },
            { title: 'Corporate', description: 'Ecosistemi digitali autorevoli, sviluppati per riflettere il reale valore della tua azienda e consolidare la fiducia di partner e clienti.' },
        ]
    },
];

// Frame sets per device type
const DESKTOP_FRAME_COUNT = 908;
const DESKTOP_FRAMES_PATH = '/frames/section-2';
const MOBILE_FRAME_COUNT = 889;
const MOBILE_FRAMES_PATH = '/frames_9_16/section-2';

// Mobile breakpoint for matchMedia checks
const MOBILE_QUERY = '(max-width: 767px)';

// Animation configuration
const FAST_FRAME_ALLOCATION = 0.6;
const SLOW_FRAME_ALLOCATION = 0.4;

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

    const [showFirstPhrase, setShowFirstPhrase] = useState(false);
    const subtitleText = "Ma esterno.";
    const [typedSubtitle, setTypedSubtitle] = useState("");
    const [showCTA, setShowCTA] = useState(false);

    const [segmentProgress, setSegmentProgress] = useState<number>(0);
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    // Canvas + intro text must stay hidden until the user actually scrolls,
    // so the IntroOverlay (WIDE logo) is fully cleared before the first frame appears.
    const [hasScrolled, setHasScrolled] = useState(false);
    const hasScrolledRef = useRef(false);

    const prefersReduced = useReducedMotion();
    // Use a ref so the ScrollTrigger closure (created on isLoaded) reads the live value
    const prefersReducedRef = useRef(prefersReduced);
    useEffect(() => { prefersReducedRef.current = prefersReduced; }, [prefersReduced]);

    // Detect mobile before first paint. useLayoutEffect only runs in the browser.
    useLayoutEffect(() => {
        setIsMobile(window.matchMedia(MOBILE_QUERY).matches);
    }, []);

    // Derive the correct frame config from isMobile
    const framesPath = isMobile ? MOBILE_FRAMES_PATH : DESKTOP_FRAMES_PATH;
    const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;

    const { images, progress, isLoaded, preloadFrames } = usePreload();

    // Keep the ref in sync with the latest images array
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        const img = imagesRef.current[frameIndex];
        if (!canvas || !ctx || !img || !img.naturalWidth) return;

        // canvas.width/height are in device pixels (innerWidth * dpr).
        // After ctx.scale(dpr, dpr), all drawing coordinates are in CSS pixels.
        // We must divide by dpr to get the CSS-pixel dimensions for correct scaling.
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = canvas.width / dpr;   // CSS pixels
        const canvasHeight = canvas.height / dpr;  // CSS pixels
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // The corrective zoom is calibrated for the 16:9 desktop frame sequence.
        // For the 9:16 mobile frames there is no equivalent discontinuity.
        const correctiveZoom = !isMobile && frameIndex >= 341 ? 1.03 : 1.0;
        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) * correctiveZoom;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    }, [isMobile]); // No dependency on images — reads from imagesRef

    // Stable ref so the ScrollTrigger closure always calls the latest drawFrame
    const drawFrameRef = useRef(drawFrame);
    useEffect(() => { drawFrameRef.current = drawFrame; }, [drawFrame]);

    const handleCanvasResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        const ctx = canvas.getContext('2d');
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
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    // Re-load frames when the device category flips.
    // Wait until isMobile is definitively detected (not null).
    useEffect(() => {
        if (isMobile === null) return;
        preloadFrames(framesPath, frameCount);
        // framesPath/frameCount are derived from isMobile — re-run only when it changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preloadFrames, isMobile]);

    // Handle canvas pixel sizing on every resize.
    useEffect(() => {

        handleCanvasResize();
        window.addEventListener('resize', handleCanvasResize);
        return () => window.removeEventListener('resize', handleCanvasResize);
    }, [handleCanvasResize]);

    // Draw initial frame as soon as images are ready
    useEffect(() => {
        if (isLoaded && imagesRef.current.length > 0) {
            drawFrame(0);
        }
    }, [isLoaded, drawFrame]);

    // Intro text sequence — starts only after the user has scrolled (canvas revealed)
    useEffect(() => {
        if (!isLoaded || !hasScrolled) return;

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
        }, 300);

        return () => {
            window.clearTimeout(firstPhraseTimeout);
            window.clearTimeout(subtitleTypingTimeout);
            window.clearInterval(typingInterval);
        };
    }, [isLoaded, hasScrolled, subtitleText]);

    // Scroll lock until loaded
    useEffect(() => {
        if (!isLoaded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
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
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Ref to track the active ScrollTrigger instance across Strict Mode re-mounts
    const stRef = useRef<ScrollTrigger | null>(null);

    // Main ScrollTrigger logic — depends only on isLoaded (stable boolean)
    // drawFrame reads from imagesRef so it doesn't need to be a dependency.
    useEffect(() => {
        if (!isLoaded || imagesRef.current.length === 0 || !containerRef.current) return;

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

        const framesPerFastSegment = Math.floor((totalFrames * FAST_FRAME_ALLOCATION) / fastSegments);
        const framesPerSlowSegment = Math.floor((totalFrames * SLOW_FRAME_ALLOCATION) / slowSegments);

        interface Segment {
            type: 'fast' | 'slow';
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
                    type: 'slow',
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
                    type: 'fast',
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

        const container = containerRef.current;

        // On mobile, increase scroll distance so each service requires more physical
        // scrolling — prevents swipe-fling from racing through sections too quickly.
        const scrollEnd = isMobile ? '+=1400%' : '+=800%';

        const scrollTrigger = ScrollTrigger.create({
            trigger: container,
            start: 'top top',
            end: scrollEnd,
            pin: true,
            pinSpacing: true,
            scrub: prefersReducedRef.current ? true : (isMobile ? 1.2 : 0.8),
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const scrollProgress = self.progress;
                const currentSegment = segments.find(
                    seg => scrollProgress >= seg.startProgress && scrollProgress < seg.endProgress
                ) || segments[segments.length - 1];

                const segProg = (scrollProgress - currentSegment.startProgress) /
                    (currentSegment.endProgress - currentSegment.startProgress);

                const frameRange = currentSegment.endFrame - currentSegment.startFrame;
                const frameIndex = Math.min(Math.max(0, Math.floor(currentSegment.startFrame + segProg * frameRange)), totalFrames - 1);

                if (frameIndex !== currentFrameRef.current) {
                    currentFrameRef.current = frameIndex;
                    drawFrameRef.current(frameIndex);
                }

                // Intro opacity — stay fully visible for most of the first segment,
                // then fade out in the last 20%
                const introHoldEnd = segments[0].endProgress * 0.8;
                const introFadeEnd = segments[0].endProgress;
                if (scrollProgress < introHoldEnd) {
                    setIntroOpacity(1);
                } else if (scrollProgress < introFadeEnd) {
                    setIntroOpacity(1 - (scrollProgress - introHoldEnd) / (introFadeEnd - introHoldEnd));
                } else {
                    setIntroOpacity(0);
                }

                if (currentSegment.type === 'slow' && currentSegment.serviceIndex !== undefined) {
                    const fadeInEnd = 0.1;
                    const fadeOutStart = 0.9;
                    let opacity = 1;
                    if (segProg < fadeInEnd) opacity = segProg / fadeInEnd;
                    else if (segProg > fadeOutStart) opacity = (1 - segProg) / (1 - fadeOutStart);

                    setCurrentServiceIndex(currentSegment.serviceIndex);
                    setServiceOpacity(opacity);
                    setSegmentProgress(segProg);
                } else {
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

    const currentService = currentServiceIndex >= 0 ? SERVICES[currentServiceIndex] : null;
    const serviceContentRef = useRef<HTMLDivElement>(null);

    // Drive content scroll on mobile when service content overflows viewport
    useEffect(() => {
        const el = serviceContentRef.current;
        if (!el || !isMobile) return;
        const overflow = el.scrollHeight - el.clientHeight;
        if (overflow <= 0) return;
        // Map middle portion of segment progress (0.12–0.88) to scrollTop
        const scrollStart = 0.12;
        const scrollEnd = 0.88;
        const t = Math.max(0, Math.min(1, (segmentProgress - scrollStart) / (scrollEnd - scrollStart)));
        el.scrollTop = overflow * t;
    }, [segmentProgress, isMobile]);

    // Helper to calculate visibility progress for individual elements
    const getElementVisibility = useCallback((index: number, total: number, start = 0.15, end = 0.85) => {
        const range = end - start;
        const windowSize = range / total;
        const elementStart = start + index * windowSize;
        const elementEnd = elementStart + windowSize * 0.7; // 70% of window for animation

        if (segmentProgress < elementStart) return 0;
        if (segmentProgress > elementEnd) return 1;
        return (segmentProgress - elementStart) / (elementEnd - elementStart);
    }, [segmentProgress]);

    // Layout Variant Renderers
    const renderLayout = () => {
        if (!currentService) return null;

        const { layoutType, items = [] } = currentService;

        switch (layoutType) {
            case 'cards':
                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                        gap: isMobile ? 'clamp(10px, 2vw, 14px)' : '20px',
                        marginTop: isMobile ? '12px' : '40px',
                        width: '100%',
                        maxWidth: '1200px',
                        justifyContent: 'center',
                        alignItems: 'stretch',
                    }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{
                                    padding: isMobile ? 'clamp(14px, 4vw, 20px) clamp(16px, 4.5vw, 22px)' : '24px',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: isMobile ? '14px' : '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    opacity: vis,
                                    transform: `translateY(${20 * (1 - vis)}px)`,
                                    transition: 'transform 0.3s ease-out',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                }}>
                                    {!isMobile && <div style={{
                                        width: '100%',
                                        height: '100px',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        marginBottom: '16px'
                                    }} />}
                                    <h3 style={{
                                        color: '#fff',
                                        fontSize: isMobile ? 'clamp(0.92rem, 3vw, 1.05rem)' : '1.15rem',
                                        fontWeight: 700,
                                        marginBottom: isMobile ? '6px' : '15px'
                                    }}>{item.title}</h3>
                                    <p style={{
                                        color: 'rgba(255,255,255,0.70)',
                                        fontSize: isMobile ? 'clamp(0.8rem, 2.5vw, 0.9rem)' : '0.9rem',
                                        fontWeight: 300,
                                        lineHeight: 1.55,
                                        margin: 0,
                                        whiteSpace: 'pre-line' as const,
                                        flex: 1
                                    }}>{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'stats':
                if (isMobile) {
                    return (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'clamp(12px, 3vw, 16px)',
                            padding: '16px 0',
                            marginTop: '10px',
                            width: '100%',
                            maxWidth: '420px',
                        }}>
                            {items.map((item, i) => {
                                const vis = getElementVisibility(i, items.length);
                                return (
                                    <div key={i} style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        opacity: vis,
                                        padding: 'clamp(18px, 5vw, 28px) clamp(16px, 4vw, 24px)',
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px',
                                        transition: 'all 0.4s ease-out',
                                        transform: `translateY(${15 * (1 - vis)}px)`,
                                    }}>
                                        <div style={{ color: '#fff', fontSize: 'clamp(2rem, 7vw, 2.6rem)', fontWeight: 800, lineHeight: 1 }}>{item.value}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(0.7rem, 2vw, 0.78rem)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '6px' }}>{item.suffix}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', marginTop: '10px', fontWeight: 300, whiteSpace: 'pre-line' }}>{item.description}</div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }

                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 0.8fr',
                        gap: '0',
                        marginTop: '60px',
                        width: '100%',
                        maxWidth: '1100px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        {/* Core Stat (Big Left) */}
                        <div style={{
                            padding: '80px 60px',
                            borderRight: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            opacity: getElementVisibility(0, 3)
                        }}>
                            <div style={{ color: '#fff', fontSize: '6rem', fontWeight: 800, lineHeight: 0.9 }}>{items[0].value}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '20px' }}>{items[0].suffix}</div>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.4rem', marginTop: '30px', fontWeight: 300, maxWidth: '400px' }}>{items[0].description}</div>
                        </div>

                        {/* Secondary Stats (Stacked Right) */}
                        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr' }}>
                            {items.slice(1).map((item, i) => {
                                const vis = getElementVisibility(i + 1, 3);
                                return (
                                    <div key={i} style={{
                                        padding: '40px 50px',
                                        borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                        textAlign: 'left',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        opacity: vis,
                                    }}>
                                        <div style={{ color: '#fff', fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{item.value}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '8px' }}>{item.suffix}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginTop: '12px', fontWeight: 300 }}>{item.description}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'testimonial':
                return (
                    <div style={{ marginTop: '40px', maxWidth: '700px', textAlign: 'center' }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{ opacity: vis, transform: `translateY(${10 * (1 - vis)}px)`, transition: 'opacity 0.5s ease-out' }}>
                                    <p style={{ color: '#fff', fontSize: isMobile ? 'clamp(1.2rem, 4.5vw, 1.6rem)' : '1.8rem', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.45 }}>{item.description}</p>
                                    <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: isMobile ? 'clamp(0.78rem, 2.2vw, 0.88rem)' : '0.9rem' }}>— {item.author}</div>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'gallery':
                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: isMobile ? 'clamp(10px, 2.5vw, 14px)' : '15px',
                        marginTop: isMobile ? '12px' : '30px',
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '600px',
                        padding: isMobile ? '0 2px' : '0 4px',
                        alignItems: 'stretch',
                    }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: isMobile ? '12px' : '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: isMobile ? 'clamp(14px, 4vw, 20px) clamp(12px, 3.5vw, 18px)' : '24px 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: vis,
                                    transform: `translateY(${10 * (1 - vis)}px)`,
                                    height: '100%',
                                    transition: 'all 0.3s ease-out'
                                }}>
                                    <div style={{ color: '#fff', fontSize: isMobile ? 'clamp(0.84rem, 2.8vw, 0.96rem)' : '0.9rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{item.title}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: isMobile ? 'clamp(0.74rem, 2.2vw, 0.82rem)' : '0.75rem', textAlign: 'center', marginTop: isMobile ? '6px' : '12px', lineHeight: 1.45 }}>{item.description}</div>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'video':
                return (
                    <div style={{ marginTop: '30px', position: 'relative', width: isMobile ? '80%' : '500px', aspectRatio: '16/9', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '3rem' }}>▶</div>
                        <div style={{ position: 'absolute', bottom: '15px', left: '20px' }}>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{items[0].title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{items[0].description}</div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <section ref={containerRef} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
            {/* Loading overlay — fades out smoothly when ready */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2001, // above IntroOverlay (1999)
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#000', color: '#fff',
                opacity: isLoaded ? 0 : 1,
                transition: 'opacity 0.8s ease',
                pointerEvents: isLoaded ? 'none' : 'all',
            }}>
                <div style={{ width: '200px', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#fff', transition: 'width 0.2s linear' }} />
                </div>
                <span style={{ marginTop: '20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                    Loading Sequence {Math.round(progress)}%
                </span>
            </div>

            {/* Canvas — hidden until loading AND first scroll (so IntroOverlay clears first) */}
            <canvas ref={canvasRef} style={{
                position: 'absolute', inset: 0,
                width: '100vw', height: '100vh',
                display: 'block', zIndex: 0,
                opacity: isLoaded && hasScrolled ? 1 : 0,
                transition: 'opacity 0.5s ease',
            }} />

            {/* Contrast Overlay (Vignette) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.78) 100%)',
                zIndex: 10,
                opacity: Math.max(serviceOpacity, introOpacity * 0.65),
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease-out'
            }} />

            {/* Intro Text */}
            {isLoaded && hasScrolled && currentServiceIndex === -1 && introOpacity > 0 && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4000,
                    opacity: introOpacity,
                    padding: isMobile ? '20px' : '40px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    transition: 'opacity 0.3s ease-out'
                }}>
                    <h1 style={{
                        color: '#fff',
                        fontSize: isMobile ? '1.2rem' : '2.2rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        width: isMobile ? '100%' : '90vw',
                        maxWidth: '1200px',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textShadow: `
                            0 4px 6px rgba(0,0,0,0.9), 
                            0 10px 40px rgba(0,0,0,0.8), 
                            0 0 10px rgba(0,0,0,0.5)
                        `
                    }}>
                        <span style={{
                            opacity: showFirstPhrase ? 1 : 0,
                            transform: `translateY(${showFirstPhrase ? 0 : 10}px)`,
                            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                            whiteSpace: isMobile ? 'normal' : 'nowrap',
                            textAlign: 'center',
                            display: 'block',
                            width: '100%'
                        }}>
                            Il reparto marketing che la tua azienda ha sempre voluto.
                        </span>
                        <span style={{
                            opacity: typedSubtitle ? 1 : 0,
                            fontWeight: 800,
                            marginTop: isMobile ? '15px' : '35px',
                            fontSize: isMobile ? '1.6rem' : '2.4rem',
                            color: '#fff',
                            minHeight: isMobile ? '1.8rem' : '2.8rem',
                            letterSpacing: '-0.02em'
                        }}>
                            {typedSubtitle}
                        </span>

                        <button
                            style={{
                                marginTop: isMobile ? '35px' : '60px',
                                padding: isMobile ? '12px 20px' : '18px 48px',
                                backgroundColor: '#fff',
                                color: '#000',
                                border: '1px solid #fff',
                                borderRadius: '0',
                                fontSize: isMobile ? '0.7rem' : '0.9rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: showCTA ? 1 : 0,
                                transform: `translateY(${showCTA ? 0 : 20}px)`,
                                pointerEvents: showCTA ? 'all' : 'none',
                                width: isMobile ? '90%' : 'auto',
                                maxWidth: isMobile ? '400px' : 'none',
                                whiteSpace: 'nowrap',
                                boxSizing: 'border-box',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                            }}
                        >
                            Prenota una chiamata conoscitiva
                        </button>
                    </h1>
                </div>
            )}

            {/* Service progress dots — visible only during service segments */}
            {isLoaded && currentServiceIndex >= 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: 'clamp(20px, 4vw, 32px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 6,
                    zIndex: 30,
                    pointerEvents: 'none',
                    opacity: serviceOpacity,
                    transition: 'opacity 0.2s ease-out',
                }}>
                    {SERVICES.map((_, i) => (
                        <div key={i} style={{
                            height: 5,
                            width: currentServiceIndex === i ? 18 : 5,
                            borderRadius: 3,
                            backgroundColor: currentServiceIndex === i ? '#fff' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    ))}
                </div>
            )}

            {isLoaded && currentService && (
                <div
                    ref={serviceContentRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 20,
                        opacity: serviceOpacity,
                        transition: 'opacity 0.2s ease-out',
                        padding: isMobile ? 'clamp(80px, 22vw, 100px) clamp(18px, 5vw, 28px) 24px' : '40px',
                        textAlign: 'center',
                        overflowY: 'hidden', // scroll driven by segmentProgress, not user
                    }}
                >
                    <div style={{
                        transform: `translateY(${15 * (1 - serviceOpacity)}px)`,
                        transition: 'transform 0.3s ease-out',
                        marginBottom: isMobile ? '8px' : '0',
                        flexShrink: 0,
                    }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: isMobile ? 'clamp(1.2rem, 4.5vw, 1.6rem)' : '2.8rem',
                            fontWeight: 800,
                            lineHeight: isMobile ? 1.25 : 1.1,
                            margin: 0,
                            textShadow: '0 10px 40px rgba(0,0,0,0.8)',
                            letterSpacing: '-0.03em'
                        }}>
                            {isMobile && currentService.title.includes('ed E-commerce')
                                ? <>Sviluppo Piattaforme Web<br />ed E-commerce</>
                                : currentService.title}
                        </h2>
                        <div style={{
                            height: '2px',
                            width: '30px',
                            background: '#fff',
                            margin: isMobile ? '8px auto' : '20px auto',
                            opacity: 0.5
                        }} />
                        <p style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: isMobile ? 'clamp(0.82rem, 2.8vw, 1rem)' : '1.1rem',
                            fontWeight: 300,
                            maxWidth: isMobile ? '92vw' : '800px',
                            margin: '0 auto',
                            lineHeight: 1.4,
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            whiteSpace: 'pre-line' as const,
                        }}>
                            {currentService.description}
                        </p>
                    </div>

                    <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: isMobile ? '10px' : '0'
                    }}>
                        {renderLayout()}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ScrollVideo;
