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
            <section id="portfolio">
                <Portfolio />
            </section>
        </main>
    );
}

export default App;
