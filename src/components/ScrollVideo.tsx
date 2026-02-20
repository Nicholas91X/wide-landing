import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePreload } from '../hooks/usePreload';

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
        title: 'Gestione Pagine Social',
        description: 'Strategie editoriali per dominare il feed.',
        layoutType: 'cards',
        items: [
            { title: 'Pianificazione', description: 'Calendari editoriali strategici' },
            { title: 'Engagement', description: 'Community management attivo' },
            { title: 'Analytics', description: 'Report e ottimizzazione continua' },
        ]
    },
    {
        title: 'Creazione Contenuti Personalizzati',
        description: 'Visual storytelling ad alto impatto.',
        layoutType: 'stats',
        items: [
            { value: '10M+', suffix: 'Visualizzazioni', description: 'Raggiunte per i nostri clienti' },
            { value: '500+', suffix: 'Progetti', description: 'Creativi completati con successo' },
            { value: '100%', suffix: 'Originalità', description: 'Niente template, solo branding' },
        ]
    },
    {
        title: 'Creazione Applicativi Personalizzati',
        description: 'Software su misura per business scalabili.',
        layoutType: 'gallery',
        items: [
            { title: 'Dashboard UX', description: 'Interfacce intuitive' },
            { title: 'Cloud Backend', description: 'Infrastrutture robuste' },
            { title: 'Cross Platform', description: 'iOS & Android' },
            { title: 'AI Integration', description: 'Automazione intelligente' },
        ]
    },
    {
        title: 'Shooting Video/Fotografici',
        description: 'Qualità cinematografica con attrezzatura Pro.',
        layoutType: 'testimonial',
        items: [
            {
                description: '"La qualità delle riprese ha cambiato radicalmente la percezione del nostro brand."',
                author: 'CEO di Luxury Group'
            }
        ]
    },
    {
        title: 'Generazione Video AI',
        description: "L'avanguardia della produzione digitale.",
        layoutType: 'video',
        items: [
            { title: 'AI Rendering Core', description: 'Processo di generazione in real-time' }
        ]
    },
    {
        title: 'Creazione Siti Web',
        description: 'Esperienze immersive e conversion-oriented.',
        layoutType: 'cards',
        items: [
            { title: 'Landing Page', description: 'Conversion rate ottimizzato' },
            { title: 'E-commerce', description: 'Shop online performanti' },
            { title: 'Corporate', description: 'Vetrine aziendali premium' },
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

    const [currentServiceIndex, setCurrentServiceIndex] = useState<number>(-1);
    const [serviceOpacity, setServiceOpacity] = useState<number>(0);
    const [segmentProgress, setSegmentProgress] = useState<number>(0);
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    // Detect mobile before first paint. useLayoutEffect only runs in the browser.
    useLayoutEffect(() => {
        setIsMobile(window.matchMedia(MOBILE_QUERY).matches);
    }, []);

    // Derive the correct frame config from isMobile
    const framesPath = isMobile ? MOBILE_FRAMES_PATH : DESKTOP_FRAMES_PATH;
    const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;

    const { images, progress, isLoaded, preloadFrames } = usePreload();

    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        const img = images[frameIndex];
        if (!canvas || !ctx || !img) return;

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
    }, [images, isMobile]);

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
        if (images.length > 0) drawFrame(currentFrameRef.current);
    }, [images, drawFrame]);

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

    useEffect(() => {
        if (isLoaded && images.length > 0) drawFrame(0);
    }, [isLoaded, images, drawFrame]);

    // Main ScrollTrigger logic
    useEffect(() => {
        if (!isLoaded || images.length === 0 || !containerRef.current) return;

        const serviceCount = SERVICES.length;
        const totalFrames = images.length;
        const fastSegments = serviceCount + 1;
        const slowSegments = serviceCount;
        const totalSegments = fastSegments + slowSegments;

        const fastSegmentSize = 1 / totalSegments;
        const slowSegmentSize = 1 / totalSegments;

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

        const scrollTrigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: '+=800%',
            pin: true,
            scrub: 0.8,
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
                    drawFrame(frameIndex);
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

        // After this section's pin spacer is created, notify all other
        // ScrollTriggers (e.g. Portfolio) to recalculate their positions.
        ScrollTrigger.refresh();

        return () => { scrollTrigger.kill(); };
    }, [isLoaded, images, drawFrame]);

    const currentService = currentServiceIndex >= 0 ? SERVICES[currentServiceIndex] : null;

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
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '10px' : '20px',
                        marginTop: isMobile ? '15px' : '40px',
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{
                                    width: isMobile ? '85%' : '260px',
                                    padding: isMobile ? '12px' : '20px',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    opacity: vis,
                                    transform: `translateY(${20 * (1 - vis)}px)`,
                                    transition: 'transform 0.3s ease-out'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: isMobile ? '60px' : '100px',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        marginBottom: isMobile ? '8px' : '12px'
                                    }} />
                                    <h3 style={{ color: '#fff', fontSize: isMobile ? '0.95rem' : '1.1rem', marginBottom: '4px' }}>{item.title}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 300 }}>{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'stats':
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '15px' : '60px',
                        marginTop: isMobile ? '20px' : '60px',
                    }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{ textAlign: 'center', opacity: vis, transform: `scale(${0.8 + 0.2 * vis})`, transition: 'transform 0.4s ease-out' }}>
                                    <div style={{ color: '#fff', fontSize: isMobile ? '2rem' : '4rem', fontWeight: 800, lineHeight: 1 }}>{item.value}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '0.7rem' : '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{item.suffix}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.85rem' : '1rem', marginTop: i === 0 ? '5px' : '8px', fontWeight: 300 }}>{item.description}</div>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'testimonial':
                return (
                    <div style={{ marginTop: '40px', maxWidth: '700px', textAlign: 'center' }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{ opacity: vis, transform: `translateY(${10 * (1 - vis)}px)`, transition: 'opacity 0.5s ease-out' }}>
                                    <p style={{ color: '#fff', fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.4 }}>{item.description}</p>
                                    <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>— {item.author}</div>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'gallery':
                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                        gap: '12px',
                        marginTop: '30px',
                        width: '100%',
                        maxWidth: '1000px',
                        padding: '0 10px'
                    }}>
                        {items.map((item, i) => {
                            const vis = getElementVisibility(i, items.length);
                            return (
                                <div key={i} style={{
                                    aspectRatio: '1',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px',
                                    opacity: vis,
                                    transform: `scale(${0.9 + 0.1 * vis})`,
                                    transition: 'all 0.3s ease-out'
                                }}>
                                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>{item.title}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textAlign: 'center', marginTop: '4px' }}>{item.description}</div>
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
                position: 'absolute', inset: 0, zIndex: 100,
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

            {/* Canvas — fades in after loading completes */}
            <canvas ref={canvasRef} style={{
                position: 'absolute', inset: 0,
                width: '100vw', height: '100vh',
                display: 'block', zIndex: 0,
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.8s ease',
            }} />

            {/* Contrast Overlay (Vignette) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.99) 100%)',
                zIndex: 10,
                opacity: serviceOpacity,
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease-out'
            }} />

            {isLoaded && currentService && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center',
                    pointerEvents: 'none',
                    zIndex: 20,
                    opacity: serviceOpacity,
                    transition: 'opacity 0.2s ease-out',
                    padding: isMobile ? '60px 20px' : '40px',
                    textAlign: 'center',
                    overflowY: isMobile ? 'auto' : 'hidden'
                }}>
                    <div style={{
                        transform: `translateY(${15 * (1 - serviceOpacity)}px)`,
                        transition: 'transform 0.3s ease-out',
                        marginBottom: isMobile ? '10px' : '0'
                    }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: isMobile ? '1.5rem' : '3.5rem',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            margin: 0,
                            textShadow: '0 10px 40px rgba(0,0,0,0.8)',
                            letterSpacing: '-0.03em'
                        }}>
                            {currentService.title}
                        </h2>
                        <div style={{
                            height: '2px',
                            width: '30px',
                            background: '#fff',
                            margin: isMobile ? '10px auto' : '20px auto',
                            opacity: 0.5
                        }} />
                        <p style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: isMobile ? '0.85rem' : '1.2rem',
                            fontWeight: 300,
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: 1.4,
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                        }}>
                            {currentService.description}
                        </p>
                    </div>

                    <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: isMobile ? '15px' : '0'
                    }}>
                        {renderLayout()}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ScrollVideo;
