import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePreload } from '../hooks/usePreload';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
    { title: 'Gestione Pagine Social', description: 'Strategie editoriali per dominare il feed.' },
    { title: 'Creazione Contenuti Personalizzati', description: 'Visual storytelling ad alto impatto.' },
    { title: 'Creazione Applicativi Personalizzati', description: 'Software su misura per business scalabili.' },
    { title: 'Shooting Video/Fotografici', description: 'Qualità cinematografica con attrezzatura Pro.' },
    { title: 'Generazione Video AI', description: "L'avanguardia della produzione digitale." },
    { title: 'Creazione Siti Web', description: 'Esperienze immersive e conversion-oriented.' },
];

const FRAME_COUNT = 532;
const FRAMES_PATH = '/frames/section-2';

// Animation configuration
const FAST_FRAME_ALLOCATION = 0.6; // 60% of frames for fast segments
const SLOW_FRAME_ALLOCATION = 0.1; // 40% of frames for slow segments (background at 1/3 effective speed)

export const ScrollVideo: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const currentFrameRef = useRef<number>(0);

    const [currentServiceIndex, setCurrentServiceIndex] = useState<number>(-1);
    const [serviceOpacity, setServiceOpacity] = useState<number>(0);
    const { images, progress, isLoaded, preloadFrames } = usePreload();

    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        const img = images[frameIndex];
        if (!canvas || !ctx || !img) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Zoom correttivo per i frame post-AI
        const correctiveZoom = frameIndex >= 341 ? 1.03 : 1.0;
        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) * correctiveZoom;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    }, [images]);

    const handleResize = useCallback(() => {
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

    useEffect(() => {
        preloadFrames(FRAMES_PATH, FRAME_COUNT);
    }, [preloadFrames]);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (isLoaded && images.length > 0) drawFrame(0);
    }, [isLoaded, images, drawFrame]);

    // Main ScrollTrigger with Fast-Slow logic
    useEffect(() => {
        if (!isLoaded || images.length === 0 || !containerRef.current) return;

        const serviceCount = SERVICES.length;
        const totalFrames = images.length;

        // Segment structure: FAST → SLOW1 → FAST → SLOW2 → ... → FAST
        // Total segments: serviceCount slow + (serviceCount + 1) fast
        const fastSegments = serviceCount + 1;
        const slowSegments = serviceCount;
        const totalSegments = fastSegments + slowSegments;

        // Each segment's scroll progress allocation
        const fastSegmentSize = 1 / totalSegments;
        const slowSegmentSize = 1 / totalSegments;

        // Frame allocation per segment type
        const framesPerFastSegment = Math.floor((totalFrames * FAST_FRAME_ALLOCATION) / fastSegments);
        const framesPerSlowSegment = Math.floor((totalFrames * SLOW_FRAME_ALLOCATION) / slowSegments);

        // Build segment boundaries
        interface Segment {
            type: 'fast' | 'slow';
            startProgress: number;
            endProgress: number;
            startFrame: number;
            endFrame: number;
            serviceIndex?: number;
        }

        const segments: Segment[] = [];
        let currentProgress = 0;
        let currentFrame = 0;

        for (let i = 0; i < totalSegments; i++) {
            const isSlow = i % 2 === 1; // Odd indices are slow segments (after first fast)

            if (isSlow) {
                const serviceIndex = Math.floor(i / 2);
                segments.push({
                    type: 'slow',
                    startProgress: currentProgress,
                    endProgress: currentProgress + slowSegmentSize,
                    startFrame: currentFrame,
                    endFrame: currentFrame + framesPerSlowSegment,
                    serviceIndex,
                });
                currentProgress += slowSegmentSize;
                currentFrame += framesPerSlowSegment;
            } else {
                segments.push({
                    type: 'fast',
                    startProgress: currentProgress,
                    endProgress: currentProgress + fastSegmentSize,
                    startFrame: currentFrame,
                    endFrame: currentFrame + framesPerFastSegment,
                });
                currentProgress += fastSegmentSize;
                currentFrame += framesPerFastSegment;
            }
        }

        // Ensure last segment ends at total frames
        if (segments.length > 0) {
            segments[segments.length - 1].endFrame = totalFrames - 1;
            segments[segments.length - 1].endProgress = 1;
        }

        const scrollTrigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: '+=800%', // Extended for more scroll distance
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
                const scrollProgress = self.progress;

                // Find current segment
                const currentSegment = segments.find(
                    seg => scrollProgress >= seg.startProgress && scrollProgress < seg.endProgress
                ) || segments[segments.length - 1];

                // Calculate progress within current segment
                const segmentProgress = (scrollProgress - currentSegment.startProgress) /
                    (currentSegment.endProgress - currentSegment.startProgress);

                // Calculate frame index based on segment type
                let frameIndex: number;
                const frameRange = currentSegment.endFrame - currentSegment.startFrame;

                if (currentSegment.type === 'slow') {
                    // Slow segment: frames advance at 1/3 speed (but we evenly distribute the slow-allocated frames)
                    frameIndex = Math.floor(
                        currentSegment.startFrame + segmentProgress * frameRange
                    );
                } else {
                    // Fast segment: normal speed
                    frameIndex = Math.floor(
                        currentSegment.startFrame + segmentProgress * frameRange
                    );
                }

                frameIndex = Math.min(Math.max(0, frameIndex), totalFrames - 1);

                if (frameIndex !== currentFrameRef.current) {
                    currentFrameRef.current = frameIndex;
                    drawFrame(frameIndex);
                }

                // Service overlay logic (only during slow segments)
                if (currentSegment.type === 'slow' && currentSegment.serviceIndex !== undefined) {
                    const fadeInEnd = 0.15;
                    const fadeOutStart = 0.85;

                    let opacity = 1;
                    if (segmentProgress < fadeInEnd) {
                        opacity = segmentProgress / fadeInEnd;
                    } else if (segmentProgress > fadeOutStart) {
                        opacity = (1 - segmentProgress) / (1 - fadeOutStart);
                    }

                    setCurrentServiceIndex(currentSegment.serviceIndex);
                    setServiceOpacity(opacity);
                } else {
                    setServiceOpacity(0);
                    setCurrentServiceIndex(-1);
                }
            },
        });

        return () => {
            scrollTrigger.kill();
        };
    }, [isLoaded, images, drawFrame]);

    const currentService = currentServiceIndex >= 0 ? SERVICES[currentServiceIndex] : null;

    return (
        <section
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: '#000',
            }}
        >
            {/* Loading */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000',
                    color: '#fff',
                }}>
                    <div style={{
                        width: '200px',
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: '#fff',
                            transition: 'width 0.1s ease-out',
                        }} />
                    </div>
                    <span style={{
                        marginTop: '16px',
                        fontSize: '14px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}>
                        Loading {progress}%
                    </span>
                </div>
            )}

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'block',
                    zIndex: 0,
                }}
            />

            {/* Service Overlay */}
            {isLoaded && currentService && (
                <div
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
                        padding: '0 24px',
                    }}
                >
                    <h2
                        style={{
                            color: '#fff',
                            fontSize: 'clamp(2rem, 6vw, 4rem)',
                            fontWeight: 700,
                            textAlign: 'center',
                            margin: 0,
                            textShadow: '0 4px 30px rgba(0, 0, 0, 0.9)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {currentService.title}
                    </h2>
                    <p
                        style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                            fontWeight: 300,
                            textAlign: 'center',
                            marginTop: '16px',
                            textShadow: '0 2px 15px rgba(0, 0, 0, 0.8)',
                            maxWidth: '600px',
                        }}
                    >
                        {currentService.description}
                    </p>
                </div>
            )}
        </section>
    );
};

export default ScrollVideo;
