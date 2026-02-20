import { ScrollVideo } from './components/ScrollVideo';
import { Portfolio } from './components/Portfolio';
import { ChiSiamo } from './components/ChiSiamo';
import { NavBubble } from './components/NavBubble';
import { IntroOverlay } from './components/IntroOverlay';

function App() {
    return (
        <main>
            <IntroOverlay />
            <NavBubble />
            <section id="servizi">
                <ScrollVideo />
            </section>
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
        </main>
    );
}

export default App;
