import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProjectModal } from './ProjectModal';
import type { Project } from './ProjectModal';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

// ─── Extended Project Data Type for Portfolio ────────────────────────────────
interface PortfolioProject extends Project {
    reels?: string[];
}

// ─── Project Data (placeholder — replace src with real assets) ───────────────
const PROJECTS: PortfolioProject[] = [
    {
        id: 'p1',
        title: 'Auto2G - Spa',
        category: 'Rebranding e Marketing',
        year: '2025',
        description: '<b>Da salone a brand automotive riconoscibile.</b>\n\nAbbiamo gestito l\'intera presenza digitale, dal rebranding completo allo sviluppo del sito web, fino alla gestione strategica di 3 canali social (IG, FB, TikTok).\n\n<b>I RISULTATI PARLANO:</b>\n\n<b>Brand Identity:</b> unica e memorabile.\n\n<b>Vendite auto dirette:</b> clienti che acquistano veicoli a seguito di video visualizzati sui social.\n\n<b>TikTok:</b> oltre 200.000 visualizzazioni.',
        mediaType: 'image',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #1a0a00, #3d1a00)',
        tags: ['Rebranding', 'Gestionale Customizzato', 'Social Media', 'Campagne Ads'],
        reels: [
            'https://iframe.mediadelivery.net/embed/604848/0e62b759-3d9a-4308-b4e3-dd01d1f715de?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false',
            'https://iframe.mediadelivery.net/embed/604848/7081352d-7e73-4ba0-b74a-64a6fe453015?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false',
            'https://iframe.mediadelivery.net/embed/604848/4c128c36-9caf-4fd0-a735-3a8f774b6dc5?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false',
            'https://iframe.mediadelivery.net/embed/604848/bd750578-cc05-443d-9d15-514d5a12d7c8?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false'
        ],
    },
    {
        id: 'p2',
        title: 'Fit & Smile',
        category: 'Web App & Social Media',
        year: '2025',
        description: '<b>Digitalizzazione e Scalabilità nel Fitness.</b>\n\nAbbiamo trasformato una visione in un business digitale completo.\nDalla creazione del concept alla progettazione di una Web App proprietaria per lo streaming degli allenamenti, abbiamo costruito un ecosistema che vende fitness 24/7, superando i limiti fisici della palestra tradizionale.\n\n<b>L\'IMPATTO DEL PROGETTO:</b>\n\n<b>Business Concept & Brand Identity:</b> Definizione del marchio e del posizionamento per dominare la nicchia di riferimento.\n\n<b>Infrastruttura Web App:</b> Sviluppo della piattaforma streaming e produzione professionale di tutti i video corsi.\n\n<b>Strategia di Acquisizione:</b> Creazione di contenuti social ad alto impatto che hanno generato un flusso costante di richieste di iscrizione.',
        mediaType: 'video',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #001a3d, #002a5c)',
        tags: ['Web App', 'Social Media', 'Branding', 'Content Creation'],
        reels: [
            'https://iframe.mediadelivery.net/embed/604848/996c61ce-1752-4adf-b318-c1cfeb7af7ca?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false',
            'https://iframe.mediadelivery.net/embed/604848/7a1cc3e6-4973-407a-93e4-47937f8ff950?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false'
        ],
    },
    {
        id: 'p5',
        title: 'Video Production & Cinematic Editing',
        category: 'Produzione Video',
        year: '2025',
        description: '<b>Tattoo Art Experience</b>\n\nAbbiamo trasformato l\'arte del tatuaggio in un’esperienza cinematografica.\nAttraverso riprese in stile film e un editing ricercato, abbiamo creato un racconto visivo che esalta il dettaglio, la tecnica e l\'atmosfera dello studio, differenziandolo nettamente dalla concorrenza.\n\n<b>IL VALORE DEL SERVIZIO:</b>\n\n<b>Riprese Professionali:</b> Utilizzo di tecniche cinematografiche per un impatto visivo di alto livello.\n\n<b>Editing su Misura:</b> Montaggio dinamico con stili e ritmi personalizzati in base all’identità del brand.\n\n<b>Flessibilità Totale:</b> Realizziamo anche solo la fase di ripresa ed editing per progetti specifici o campagne mirate.',
        mediaType: 'video',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #001a10, #003d25)',
        tags: ['Video Cinematico', 'Editing Professionale', 'Storytelling', 'Brand Video'],
        reels: [
            'https://iframe.mediadelivery.net/embed/604848/0fa6efb4-a0d1-49d7-b691-356f9fd3704f?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false',
        ],
    },
    {
        id: 'p6',
        title: 'E-commerce Fashion',
        category: 'Web + Social',
        year: '2024',
        description: 'Gestione completa di un e-commerce fashion: sito Shopify, fotografia prodotti, contenuti social mensili e campagne paid per 18 mesi consecutivi.',
        mediaType: 'image',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #1a0010, #3d0025)',
        tags: ['Shopify', 'Fotografia', 'Paid Ads', 'Social'],
        reels: [
            'https://iframe.mediadelivery.net/embed/604848/190f2414-cf0a-42e9-906d-54043db89fce?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false',
        ],
    },
];

// ─── Palette for numbered indicator ──────────────────────────────────────────
const CARD_OVERLAYS = [
    'rgba(0,0,0,0.45)',
    'rgba(0,0,0,0.50)',
    'rgba(0,0,0,0.45)',
    'rgba(0,0,0,0.55)',
    'rgba(0,0,0,0.45)',
    'rgba(0,0,0,0.50)',
];

// ─── Component ────────────────────────────────────────────────────────────────
export const Portfolio: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement[]>([]);
    const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const currentCardIndexRef = useRef(0);

    const prefersReduced = useReducedMotion();

    // ── Reel swipe: one-item-at-a-time on mobile ──────────────────────────────
    // Capture scroll position at touchstart so momentum between start→end
    // doesn't affect which index we target.
    const reelTouchStartX = useRef(0);
    const reelTouchStartScrollLeft = useRef(0);

    const handleReelTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        reelTouchStartX.current = e.touches[0].clientX;
        reelTouchStartScrollLeft.current = e.currentTarget.scrollLeft;
    };

    const handleReelTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const dx = e.changedTouches[0].clientX - reelTouchStartX.current;
        if (Math.abs(dx) < 15) return; // ignore micro-swipes

        const container = e.currentTarget;
        const itemWidth = container.offsetWidth;
        if (!itemWidth) return;

        const items = container.querySelectorAll<HTMLElement>('.portfolio-reel-item');
        // Use scroll position recorded at touchstart — immune to momentum drift
        const currentIndex = Math.round(reelTouchStartScrollLeft.current / itemWidth);
        const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + (dx < 0 ? 1 : -1)));

        container.scrollTo({ left: nextIndex * itemWidth, behavior: 'smooth' });
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const cards = cardsRef.current;
        const count = cards.length;

        // Initial state: all cards except first are below the viewport
        cards.forEach((card, i) => {
            if (i === 0) return;
            gsap.set(card, { y: '100%' });
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: 'top top',
                end: `+=${count * 100}%`,
                pin: true,
                pinSpacing: true,
                scrub: prefersReduced ? true : 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                // Ensures Portfolio recalculates AFTER ScrollVideo (which has default priority 0)
                refreshPriority: -1,
                onUpdate: (self) => {
                    const newIndex = Math.min(count - 1, Math.floor(self.progress * count));
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

            tl
                .to(nextCard, {
                    y: '0%',
                    duration: 1,
                    ease: 'power2.inOut',
                }, i)
                .to(currentCard, {
                    scale: 0.92,
                    opacity: 0,
                    duration: 1,
                    ease: 'power2.inOut',
                }, i);
        }

        // Refresh after a short delay to let all other ScrollTriggers (ScrollVideo)
        // register their spacers first
        const rafId = setTimeout(() => {
            try {
                ScrollTrigger.refresh();
            } catch (_e) {
                // Strict Mode may cause transient DOM issues; retry next frame
                requestAnimationFrame(() => {
                    try { ScrollTrigger.refresh(); } catch (_) { /* ignore */ }
                });
            }
        }, 200);

        return () => {
            clearTimeout(rafId);
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars.trigger === container) st.kill();
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefersReduced]);


    return (
        <>
            {/* Section Header — above the pinned area */}
            <div style={{
                backgroundColor: '#000',
                padding: 'clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px) clamp(40px, 6vw, 80px)',
            }}>
                <p style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-subtitle)',
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    margin: '0 0 16px',
                }}>
                    Portfolio
                </p>
                <h2 style={{
                    color: '#fff',
                    fontSize: 'clamp(2.2rem, 7vw, 5rem)',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    lineHeight: 1.05,
                    margin: '0 0 16px',
                }}>
                    I nostri<br />progetti.
                </h2>
                <p style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    maxWidth: '480px',
                    lineHeight: 1.6,
                    margin: 0,
                }}>
                    Scorri per esplorare il nostro lavoro — dal branding alla produzione video, dai siti web alle campagne social.
                </p>
            </div>

            {/* Pinned card stack */}
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100dvh',
                    minHeight: '100dvh',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                }}
            >
                {/* Vertical progress dots */}
                <div style={{
                    position: 'absolute',
                    right: 'clamp(12px, 3vw, 24px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    zIndex: 10,
                    pointerEvents: 'none',
                }}>
                    {PROJECTS.map((_, i) => (
                        <div key={i} style={{
                            width: 4,
                            height: currentCardIndex === i ? 20 : 4,
                            borderRadius: 2,
                            backgroundColor: currentCardIndex === i ? '#fff' : 'rgba(255,255,255,0.3)',
                            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    ))}
                </div>

                {PROJECTS.map((project, i) => (
                    <div
                        key={project.id}
                        ref={el => { if (el) cardsRef.current[i] = el; }}
                        onClick={() => setActiveProject(project)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            cursor: 'pointer',
                            willChange: 'transform, opacity',
                        }}
                    >
                        {/* Background / Reels */}
                        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
                            {project.reels && project.reels.length > 0 ? (
                                <div
                                    onClick={(e) => {
                                        // Prevent modal opening when clicking on the videos
                                        e.stopPropagation();
                                    }}
                                    onTouchStart={handleReelTouchStart}
                                    onTouchEnd={handleReelTouchEnd}
                                    className="portfolio-reels-bg"
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        height: '100%',
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        scrollSnapType: 'x mandatory',
                                        WebkitOverflowScrolling: 'touch',
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                        overscrollBehaviorX: 'contain',
                                    }}
                                >
                                    {project.reels.map((reelUrl, idx) => (
                                        <div
                                            key={idx}
                                            className="portfolio-reel-item"
                                            style={{
                                                flex: '0 0 auto',
                                                width: '100%',
                                                height: '100%',
                                                scrollSnapAlign: 'start',
                                                scrollSnapStop: 'always',
                                                position: 'relative',
                                                backgroundColor: '#000',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <iframe
                                                src={reelUrl}
                                                loading="lazy"
                                                style={{
                                                    border: 'none',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    // Force iframe to 9:16 ratio based on viewport height,
                                                    // then clip overflow — eliminates black bars for portrait reels
                                                    height: '100dvh',
                                                    width: 'calc(100dvh * 9 / 16)',
                                                    minWidth: '100%',
                                                    transform: 'translate(-50%, -50%)',
                                                    pointerEvents: 'none',
                                                }}
                                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                                sandbox="allow-scripts allow-same-origin"
                                                allowFullScreen
                                            />
                                            {/* Invisible overlay to catch scroll/swipe events over the iframe */}
                                            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                                        </div>
                                    ))}
                                    <style dangerouslySetInnerHTML={{
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
                                    `}} />
                                </div>
                            ) : project.mediaType === 'video' && project.mediaSrc ? (
                                <video
                                    src={project.mediaSrc}
                                    autoPlay muted loop playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : project.mediaSrc ? (
                                <img
                                    src={project.mediaSrc}
                                    alt={project.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: project.accentColor,
                                }} />
                            )}
                        </div>

                        {/* Dark overlay */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, ${CARD_OVERLAYS[i % CARD_OVERLAYS.length]} 50%, transparent 100%)`,
                            pointerEvents: 'none',
                        }} />

                        {/* Bottom info overlay */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: 'clamp(24px, 5vw, 60px)',
                        }}>
                            {/* Category + year */}
                            <div style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-subtitle)',
                                fontWeight: 600,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                marginBottom: '10px',
                            }}>
                                {project.category}
                            </div>

                            {/* Title */}
                            <h3 style={{
                                color: '#fff',
                                fontSize: 'clamp(1.6rem, 6vw, 3.5rem)',
                                fontFamily: 'var(--font-title)',
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.05,
                                margin: '0 0 20px',
                            }}>
                                {project.title}
                            </h3>

                            {/* CTA & Swipe Indicator */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#000',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-subtitle)',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    border: '1px solid #fff',
                                    padding: '10px 20px',
                                    borderRadius: '0',
                                    backdropFilter: 'blur(8px)',
                                    backgroundColor: '#fff',
                                }}>
                                    Scopri il progetto
                                    <span style={{ fontSize: '0.9rem' }}>→</span>
                                </div>

                                {/* Mobile Swipe Indicator (Visible only if there are reels) */}
                                {project.reels && project.reels.length > 0 && (
                                    <div className="portfolio-swipe-hint" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '0.75rem',
                                        fontFamily: 'var(--font-subtitle)',
                                        fontWeight: 600,
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="swipe-icon">
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
