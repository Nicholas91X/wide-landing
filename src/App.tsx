import { ScrollVideo } from './components/ScrollVideo';
import { Portfolio } from './components/Portfolio';
import { NavBubble } from './components/NavBubble';

function App() {
    return (
        <main>
            <NavBubble />
            <section id="home">
                <ScrollVideo />
            </section>
            <section id="portfolio">
                <Portfolio />
            </section>
        </main>
    );
}

export default App;
