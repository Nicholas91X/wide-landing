import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

export interface Project {
    id: string;
    title: string;
    category: string;
    year: string;
    description: string;
    mediaType: 'image' | 'video';
    mediaSrc: string;
    accentColor: string;
    tags: string[];
    gallery?: string[];          // Optional photo gallery shown in the modal
    galleryAspectRatio?: string; // e.g. '16/9' (default) or '9/16' for portrait shots
}

interface ProjectModalProps {
    project: Project | null;
    onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const isVisible = project !== null;

    // ── Gallery state ─────────────────────────────────────────────────────────
    const [galleryIdx, setGalleryIdx] = useState(0);
    const galleryRef = useRef<HTMLDivElement>(null);

    // Reset gallery index whenever a new project opens
    useEffect(() => { setGalleryIdx(0); }, [project?.id]);

    const handleGalleryScroll = useCallback(() => {
        const el = galleryRef.current;
        if (!el) return;
        setGalleryIdx(Math.round(el.scrollLeft / el.clientWidth));
    }, []);

    const scrollGallery = useCallback((dir: -1 | 1) => {
        const el = galleryRef.current;
        if (!el) return;
        const next = Math.max(0, Math.min((project?.gallery?.length ?? 1) - 1, galleryIdx + dir));
        el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, [galleryIdx, project?.gallery?.length]);

    useEffect(() => {
        if (!overlayRef.current || !sheetRef.current) return;

        if (isVisible) {
            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            gsap.fromTo(overlayRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: 'power2.out' }
            );
            gsap.fromTo(sheetRef.current,
                { y: '100%' },
                { y: '0%', duration: 0.45, ease: 'power3.out' }
            );
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isVisible]);

    const handleClose = () => {
        if (!overlayRef.current || !sheetRef.current) return;
        gsap.to(sheetRef.current, { y: '100%', duration: 0.35, ease: 'power3.in' });
        gsap.to(overlayRef.current, {
            opacity: 0, duration: 0.3, delay: 0.1,
            onComplete: onClose
        });
    };

    // ── Focus trap + ESC ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isVisible) return;

        const previousFocus = document.activeElement as HTMLElement | null;

        // Auto-focus close button after slide-in animation
        const focusTimer = setTimeout(() => {
            const closeBtn = sheetRef.current?.querySelector('button') as HTMLButtonElement | null;
            closeBtn?.focus();
        }, 450);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
                return;
            }
            if (e.key !== 'Tab') return;

            const sheet = sheetRef.current;
            if (!sheet) return;

            const focusable = Array.from(
                sheet.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            );
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            clearTimeout(focusTimer);
            document.removeEventListener('keydown', onKeyDown);
            previousFocus?.focus();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div
            ref={overlayRef}
            onClick={handleClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'flex-end',
            }}
        >
            <div
                ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxHeight: '90vh',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '24px 24px 0 0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: 'none',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Handle */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
                    <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
                </div>

                {/* Photo gallery — shown when project.gallery is provided */}
                {project?.gallery && project.gallery.length > 0 ? (
                    <div style={{ position: 'relative', backgroundColor: '#000' }}>
                        {/* Slides */}
                        <div
                            ref={galleryRef}
                            onScroll={handleGalleryScroll}
                            style={{
                                display: 'flex',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                scrollSnapType: 'x mandatory',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                overscrollBehaviorX: 'contain',
                                aspectRatio: project.galleryAspectRatio ?? '16/9',
                            }}
                        >
                            <style>{`.pm-gallery::-webkit-scrollbar { display: none; }`}</style>
                            {project.gallery.map((src, i) => (
                                <div
                                    key={i}
                                    className="pm-gallery"
                                    style={{
                                        flex: '0 0 100%',
                                        scrollSnapAlign: 'start',
                                        scrollSnapStop: 'always',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        src={src}
                                        alt={`${project.title} — ${i + 1}`}
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Prev / Next arrows (desktop) */}
                        {project.gallery.length > 1 && <>
                            <button
                                onClick={() => scrollGallery(-1)}
                                aria-label="Immagine precedente"
                                style={{
                                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    opacity: galleryIdx === 0 ? 0.25 : 1,
                                    transition: 'opacity 0.2s ease',
                                    pointerEvents: galleryIdx === 0 ? 'none' : 'auto',
                                    zIndex: 2,
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <button
                                onClick={() => scrollGallery(1)}
                                aria-label="Immagine successiva"
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    opacity: galleryIdx === project.gallery.length - 1 ? 0.25 : 1,
                                    transition: 'opacity 0.2s ease',
                                    pointerEvents: galleryIdx === project.gallery.length - 1 ? 'none' : 'auto',
                                    zIndex: 2,
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </>}

                        {/* Counter top-right */}
                        {project.gallery.length > 1 && (
                            <div style={{
                                position: 'absolute', top: 10, right: 12,
                                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 20, padding: '3px 10px',
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.7rem', fontFamily: 'var(--font-subtitle)',
                                fontWeight: 600, letterSpacing: '0.08em',
                                zIndex: 2,
                            }}>
                                {galleryIdx + 1} / {project.gallery.length}
                            </div>
                        )}

                        {/* Dot indicators */}
                        {project.gallery.length > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center',
                                alignItems: 'center', gap: 6, padding: '10px 0 4px',
                            }}>
                                {project.gallery.map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => galleryRef.current?.scrollTo({ left: i * galleryRef.current.clientWidth, behavior: 'smooth' })}
                                        style={{
                                            width: galleryIdx === i ? 20 : 6,
                                            height: 4, borderRadius: 2,
                                            backgroundColor: galleryIdx === i ? '#fff' : 'rgba(255,255,255,0.25)',
                                            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                                            cursor: 'pointer',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                /* Fallback media preview (video / image / accent) */
                <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: project?.accentColor || '#111',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {project?.mediaType === 'video' ? (
                        <video
                            src={project.mediaSrc || undefined}
                            autoPlay muted loop playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            background: project?.accentColor || 'linear-gradient(135deg, #1a1a2e, #16213e)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {project?.mediaSrc ? (
                                <img src={project.mediaSrc} alt={project?.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '3rem' }}>●</span>
                            )}
                        </div>
                    )}
                </div>
                )}

                {/* Content */}
                <div style={{ padding: '28px 24px 48px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                                {project?.category}
                            </div>
                            <h2 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                                {project?.title}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                marginLeft: '16px',
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: '20px' }} />

                    <style>{`
                        .project-description b {
                            color: #ffffff;
                            font-weight: 700;
                        }
                    `}</style>
                    {/* Description */}
                    <p
                        className="project-description"
                        style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '1rem',
                            lineHeight: 1.7,
                            margin: '0 0 24px',
                            whiteSpace: 'pre-line',
                        }}
                        dangerouslySetInnerHTML={{ __html: project?.description || '' }}
                    />

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {project?.tags.map((tag, i) => (
                            <span key={i} style={{
                                padding: '6px 14px',
                                backgroundColor: '#fff',
                                border: '1px solid #fff',
                                borderRadius: '0',
                                color: '#000',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
