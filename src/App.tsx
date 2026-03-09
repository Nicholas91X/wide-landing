import { useState, useEffect, useCallback } from 'react';
import { ScrollVideo } from './components/ScrollVideo';
import { Portfolio } from './components/Portfolio';
import { ChiSiamo } from './components/ChiSiamo';
import { Contatti } from './components/Contatti';
import { Footer } from './components/Footer';
import { NavBubble } from './components/NavBubble';
import { IntroOverlay } from './components/IntroOverlay';
import { LegalPage } from './components/LegalPage';
import { Analytics } from "@vercel/analytics/react";

type LegalRoute = 'privacy' | 'cookie' | 'note-legali' | null;

function getRouteFromPath(): LegalRoute {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'privacy' || path === 'cookie' || path === 'note-legali') return path;
    return null;
}

function App() {
    const [legalPage, setLegalPage] = useState<LegalRoute>(getRouteFromPath);

    useEffect(() => {
        const onPopState = () => setLegalPage(getRouteFromPath());
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const goBack = useCallback(() => {
        window.history.pushState(null, '', '/');
        setLegalPage(null);
    }, []);

    if (legalPage) {
        return (
            <>
                <LegalPage page={legalPage} onBack={goBack} />
                <Analytics />
            </>
        );
    }

    return (
        <>
            {/* NavBubble OUTSIDE <main> to prevent GSAP pin transforms
                from creating a containing block that breaks position:fixed */}
            <NavBubble />
            <IntroOverlay />
            <main style={{ overflowX: 'hidden' }}>
                <section id="servizi">
                    <ScrollVideo />
                </section>
            {/* Gradient fade divider */}
            <div
                style={{
                    height: 'clamp(80px, 12vw, 160px)',
                    background:
                        'linear-gradient(to bottom, #000 0%, #0a0a0a 30%, #111 50%, #0a0a0a 70%, #000 100%)',
                }}
            />
            <section id="chi-siamo">
                <ChiSiamo />
            </section>
            {/* Gradient fade divider */}
            <div
                style={{
                    height: 'clamp(80px, 12vw, 160px)',
                    background:
                        'linear-gradient(to bottom, #000 0%, #0a0a0a 30%, #111 50%, #0a0a0a 70%, #000 100%)',
                }}
            />
            <section id="portfolio">
                <Portfolio />
            </section>
            {/* Gradient fade divider */}
            <div
                style={{
                    height: 'clamp(80px, 12vw, 160px)',
                    background:
                        'linear-gradient(to bottom, #000 0%, #0a0a0a 30%, #111 50%, #0a0a0a 70%, #000 100%)',
                }}
            />
            <section id="contatti">
                <Contatti />
            </section>
            {/* Gradient fade — cream (#ece8e0) → black, bridges Contatti → Footer */}
            <div style={{
                height: 'clamp(60px, 10vw, 120px)',
                background: 'linear-gradient(to bottom, #ece8e0 0%, #000 100%)',
                pointerEvents: 'none',
            }} />
            <Footer />
            <Analytics />
        </main>

        {/* ── Floating CTA — appears after scrolling past the intro ──── */}
        <FloatingCTA />
        </>
    );
}

function FloatingCTA() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            // Show after scrolling past ~1.5 viewports (past the intro/services start)
            const threshold = window.innerHeight * 1.5;
            // Hide when Contatti section is in view (CTA is redundant there)
            const contatti = document.getElementById('contatti');
            const contattiVisible = contatti
                ? contatti.getBoundingClientRect().top < window.innerHeight * 0.8
                : false;
            setVisible(window.scrollY > threshold && !contattiVisible);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <button
            onClick={() => {
                document.getElementById('contatti')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
                position: 'fixed',
                bottom: 'clamp(20px, 4vw, 32px)',
                left: '50%',
                transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
                zIndex: 2000,
                padding: '12px 28px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '0',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-subtitle)',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
                transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
            }}
        >
            Prenota una call
        </button>
    );
}

export default App;
