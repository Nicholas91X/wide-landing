import React, { useEffect, useRef } from 'react';
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
}

interface ProjectModalProps {
    project: Project | null;
    onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const isVisible = project !== null;

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

                {/* Media preview */}
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

                {/* Content */}
                <div style={{ padding: '28px 24px 48px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                                {project?.category} · {project?.year}
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

                    {/* Description */}
                    <p style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        fontWeight: 300,
                        margin: '0 0 24px',
                    }}>
                        {project?.description}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {project?.tags.map((tag, i) => (
                            <span key={i} style={{
                                padding: '6px 14px',
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '100px',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.8rem',
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
