import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProjectModal } from './ProjectModal';
import type { Project } from './ProjectModal';

gsap.registerPlugin(ScrollTrigger);

// ─── Project Data (placeholder — replace src with real assets) ───────────────
const PROJECTS: Project[] = [
    {
        id: 'p1',
        title: 'Lux Brand Identity',
        category: 'Branding',
        year: '2025',
        description: 'Identità visiva completa per un brand di lusso nel settore fashion. Dal logo al sistema di comunicazione, passando per packaging e brand guidelines.',
        mediaType: 'image',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #1a0a00, #3d1a00)',
        tags: ['Brand Identity', 'Logo Design', 'Packaging', 'Guidelines'],
    },
    {
        id: 'p2',
        title: 'Social Campaign — Estate 2025',
        category: 'Social Media',
        year: '2025',
        description: 'Campagna social multi-piattaforma per il lancio estivo. Contenuti video, reel e grafiche per Instagram, TikTok e LinkedIn con oltre 2M di impression.',
        mediaType: 'video',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #001a3d, #002a5c)',
        tags: ['Instagram', 'TikTok', 'Video', 'Copywriting'],
    },
    {
        id: 'p3',
        title: 'Corporate Web Platform',
        category: 'Web Design',
        year: '2024',
        description: 'Piattaforma web enterprise con dashboard interattiva, area clienti e integrazione CRM. Architettura scalabile e design system completo.',
        mediaType: 'image',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #0a001a, #1a003d)',
        tags: ['Next.js', 'UI/UX', 'Dashboard', 'CRM'],
    },
    {
        id: 'p4',
        title: 'Shooting Architettura — Studio M',
        category: 'Fotografia',
        year: '2024',
        description: 'Shooting fotovideo per studio di architettura di interni. Riprese con RED Cinema, post-produzione colore cinematografica.',
        mediaType: 'image',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #0a0a00, #1a1a00)',
        tags: ['Fotografia', 'Video', 'Architettura', 'Color Grading'],
    },
    {
        id: 'p5',
        title: 'AI Spot — Tech Startup',
        category: 'AI Production',
        year: '2025',
        description: 'Spot pubblicitario generato con AI per startup tech. Produzione end-to-end: concept, generazione frame, sound design e montaggio finale.',
        mediaType: 'video',
        mediaSrc: '',
        accentColor: 'linear-gradient(135deg, #001a10, #003d25)',
        tags: ['AI Generation', 'Video Produzione', 'Sound Design', 'Motion'],
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
    const [activeProject, setActiveProject] = useState<Project | null>(null);

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
                scrub: 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                // Ensures Portfolio recalculates AFTER ScrollVideo (which has default priority 0)
                refreshPriority: -1,
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
            ScrollTrigger.refresh();
        }, 200);

        return () => {
            clearTimeout(rafId);
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars.trigger === container) st.kill();
            });
        };
    }, []);


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
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    margin: '0 0 16px',
                }}>
                    Portfolio
                </p>
                <h2 style={{
                    color: '#fff',
                    fontSize: 'clamp(2.2rem, 7vw, 5rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.05,
                    margin: '0 0 16px',
                }}>
                    I nostri<br />progetti.
                </h2>
                <p style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                    fontWeight: 300,
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
                    width: '100vw',
                    height: '100vh',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                }}
            >
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
                        {/* Background */}
                        <div style={{ position: 'absolute', inset: 0 }}>
                            {project.mediaType === 'video' && project.mediaSrc ? (
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
                        }} />

                        {/* Counter top-right */}
                        <div style={{
                            position: 'absolute',
                            top: 'clamp(20px, 5vw, 40px)',
                            right: 'clamp(20px, 5vw, 40px)',
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '0.75rem',
                            letterSpacing: '0.15em',
                            fontWeight: 500,
                        }}>
                            {String(i + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(PROJECTS.length).padStart(2, '0')}
                        </div>

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
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                marginBottom: '10px',
                            }}>
                                {project.category} · {project.year}
                            </div>

                            {/* Title */}
                            <h3 style={{
                                color: '#fff',
                                fontSize: 'clamp(1.6rem, 6vw, 3.5rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.05,
                                margin: '0 0 20px',
                            }}>
                                {project.title}
                            </h3>

                            {/* CTA */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#fff',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                letterSpacing: '0.08em',
                                border: '1px solid rgba(255,255,255,0.3)',
                                padding: '10px 20px',
                                borderRadius: '100px',
                                backdropFilter: 'blur(8px)',
                                backgroundColor: 'rgba(255,255,255,0.08)',
                            }}>
                                Scopri il progetto
                                <span style={{ fontSize: '0.9rem' }}>→</span>
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
