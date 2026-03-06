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

function getRouteFromHash(): LegalRoute {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'privacy' || hash === 'cookie' || hash === 'note-legali') return hash;
    return null;
}

function App() {
    const [legalPage, setLegalPage] = useState<LegalRoute>(getRouteFromHash);

    useEffect(() => {
        const onHashChange = () => setLegalPage(getRouteFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const goBack = useCallback(() => {
        window.location.hash = '';
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
        </>
    );
}

export default App;
