import React, { useEffect } from 'react';

type PageType = 'privacy' | 'cookie' | 'note-legali' | 'audit-privacy' | 'audit-termini';

interface LegalPageProps {
    page: PageType;
    onBack: () => void;
}

const TITLES: Record<PageType, string> = {
    'privacy': 'Privacy Policy',
    'cookie': 'Cookie Policy',
    'note-legali': 'Note Legali',
    'audit-privacy': 'Privacy Policy (Audit)',
    'audit-termini': 'Termini e Condizioni (Audit)',
};

function PrivacyContent() {
    return (
        <>
            <p>Ultimo aggiornamento: marzo 2026</p>

            <h2>1. Titolari del Trattamento</h2>
            <p>
                I Titolari del trattamento dei dati personali sono:<br />
                <strong>Alessia Amoruso</strong> — P.IVA 13486160966<br />
                <strong>Asia Franceschi</strong> — P.IVA 01566890115<br />
                operanti congiuntamente sotto il nome commerciale <strong>WIDE Studio Digitale</strong>.<br />
                E-mail di contatto: <a href="mailto:widestudiodigitale@gmail.com">widestudiodigitale@gmail.com</a>
            </p>

            <h2>2. Dati raccolti</h2>
            <p>Durante la navigazione sul sito possono essere trattati i seguenti dati personali:</p>
            <ul>
                <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, sistema operativo, pagine visitate, orari di accesso. Questi dati vengono raccolti in forma anonima e aggregata tramite Vercel Analytics e sono utilizzati esclusivamente per finalità statistiche.</li>
                <li><strong>Dati forniti volontariamente:</strong> nome, cognome, indirizzo e-mail e qualsiasi altra informazione comunicata dall'utente tramite il modulo di prenotazione Cal.com integrato nel sito.</li>
            </ul>

            <h2>3. Finalità del trattamento</h2>
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <ul>
                <li>Gestione delle richieste di contatto e prenotazione consulenze;</li>
                <li>Analisi statistiche anonime sull'utilizzo del sito (Vercel Analytics);</li>
                <li>Adempimento di obblighi di legge.</li>
            </ul>

            <h2>4. Base giuridica</h2>
            <p>
                Il trattamento dei dati è fondato sul consenso dell'interessato (art. 6, par. 1, lett. a del GDPR),
                sull'esecuzione di misure precontrattuali (art. 6, par. 1, lett. b) e sull'adempimento di obblighi
                legali (art. 6, par. 1, lett. c).
            </p>

            <h2>5. Servizi di terze parti</h2>
            <ul>
                <li><strong>Vercel Analytics:</strong> servizio di analisi statistica fornito da Vercel Inc. I dati raccolti sono anonimi e non includono cookie di profilazione. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy di Vercel</a>.</li>
                <li><strong>Cal.com:</strong> servizio di prenotazione appuntamenti. I dati inseriti nel modulo di prenotazione sono trattati da Cal.com Inc. secondo la propria <a href="https://cal.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</li>
                <li><strong>Google Fonts:</strong> il sito utilizza font caricati dai server di Google LLC. Durante il caricamento, il browser dell'utente stabilisce una connessione con i server di Google, trasmettendo l'indirizzo IP. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy di Google</a>.</li>
            </ul>

            <h2>6. Conservazione dei dati</h2>
            <p>
                I dati personali sono conservati per il tempo strettamente necessario al raggiungimento delle finalità
                per cui sono stati raccolti e comunque non oltre i termini previsti dalla normativa vigente.
            </p>

            <h2>7. Diritti dell'interessato</h2>
            <p>Ai sensi degli artt. 15-22 del Regolamento UE 2016/679 (GDPR), l'utente ha diritto di:</p>
            <ul>
                <li>Accedere ai propri dati personali;</li>
                <li>Ottenerne la rettifica o la cancellazione;</li>
                <li>Limitare od opporsi al trattamento;</li>
                <li>Richiedere la portabilità dei dati;</li>
                <li>Revocare il consenso in qualsiasi momento;</li>
                <li>Proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a>).</li>
            </ul>
            <p>Per esercitare i propri diritti, scrivere a: <a href="mailto:widestudiodigitale@gmail.com">widestudiodigitale@gmail.com</a></p>

            <h2>8. Trasferimento dati extra-UE</h2>
            <p>
                Alcuni servizi di terze parti (Vercel, Cal.com, Google) possono comportare il trasferimento di dati
                verso paesi al di fuori dell'Unione Europea. Tali trasferimenti avvengono sulla base di adeguate
                garanzie ai sensi degli artt. 46-49 del GDPR (es. Clausole Contrattuali Standard, decisioni di
                adeguatezza).
            </p>
        </>
    );
}

function CookieContent() {
    return (
        <>
            <p>Ultimo aggiornamento: marzo 2026</p>

            <h2>1. Cosa sono i cookie</h2>
            <p>
                I cookie sono piccoli file di testo che i siti web visitati inviano al browser dell'utente, dove
                vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva.
            </p>

            <h2>2. Cookie utilizzati da questo sito</h2>
            <p>Il presente sito utilizza esclusivamente:</p>

            <h3>Cookie tecnici</h3>
            <p>
                Necessari al corretto funzionamento del sito. Non richiedono il consenso dell'utente ai sensi
                dell'art. 122 del D.Lgs. 196/2003 e del Provvedimento del Garante n. 229/2014.
            </p>

            <h3>Vercel Analytics</h3>
            <p>
                Il sito utilizza Vercel Analytics, un servizio di analisi web che <strong>non utilizza cookie</strong> e
                raccoglie dati in forma anonima e aggregata. Non viene effettuata alcuna profilazione dell'utente.
            </p>

            <h3>Cookie di terze parti — Cal.com</h3>
            <p>
                Il widget di prenotazione Cal.com integrato nel sito potrebbe installare cookie tecnici necessari
                al funzionamento del servizio di prenotazione. Per maggiori informazioni, consultare la
                {' '}<a href="https://cal.com/privacy" target="_blank" rel="noopener noreferrer">Cookie Policy di Cal.com</a>.
            </p>

            <h3>Google Fonts</h3>
            <p>
                Il caricamento dei font da Google Fonts non comporta l'installazione di cookie, ma implica una
                connessione ai server di Google con trasmissione dell'indirizzo IP dell'utente.
            </p>

            <h2>3. Come gestire i cookie</h2>
            <p>
                L'utente può gestire le preferenze relative ai cookie direttamente tramite le impostazioni del
                proprio browser. Di seguito i link alle guide dei principali browser:
            </p>
            <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
                <li><a href="https://support.microsoft.com/it-it/help/4027947" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>

            <h2>4. Aggiornamenti</h2>
            <p>
                La presente Cookie Policy può essere soggetta ad aggiornamenti. L'utente è invitato a consultare
                periodicamente questa pagina per prendere visione di eventuali modifiche.
            </p>
        </>
    );
}

function NoteLegaliContent() {
    return (
        <>
            <p>Ultimo aggiornamento: marzo 2026</p>

            <h2>1. Informazioni generali</h2>
            <p>
                Il presente sito web è di proprietà di:<br />
                <strong>Alessia Amoruso</strong> — P.IVA 13486160966<br />
                <strong>Asia Franceschi</strong> — P.IVA 01566890115<br />
                operanti congiuntamente sotto il nome commerciale <strong>WIDE Studio Digitale</strong>.<br />
                E-mail: <a href="mailto:widestudiodigitale@gmail.com">widestudiodigitale@gmail.com</a>
            </p>

            <h2>2. Proprietà intellettuale</h2>
            <p>
                Tutti i contenuti presenti sul sito — inclusi testi, immagini, grafiche, loghi, video, animazioni,
                layout e codice sorgente — sono protetti dalla normativa italiana e internazionale in materia di
                diritto d'autore e proprietà intellettuale (L. 633/1941 e successive modifiche).
            </p>
            <p>
                La riproduzione, distribuzione, pubblicazione o modifica dei contenuti del sito, in tutto o in parte,
                è vietata senza autorizzazione scritta dei titolari.
            </p>

            <h2>3. Esclusione di responsabilità</h2>
            <p>
                I titolari si impegnano affinché le informazioni pubblicate sul sito siano accurate e aggiornate,
                tuttavia non garantiscono la completezza, l'esattezza o l'attualità dei contenuti.
            </p>
            <p>
                I titolari non sono responsabili per eventuali danni diretti o indiretti derivanti dall'accesso al sito,
                dall'impossibilità di accedervi o dall'utilizzo dei contenuti in esso presenti.
            </p>

            <h2>4. Link a siti esterni</h2>
            <p>
                Il sito può contenere link a siti web di terze parti. I titolari non esercitano alcun controllo su
                tali siti e non sono responsabili dei loro contenuti, delle loro politiche sulla privacy o delle
                loro pratiche.
            </p>

            <h2>5. Legge applicabile e foro competente</h2>
            <p>
                Le presenti Note Legali sono regolate dalla legge italiana. Per qualsiasi controversia derivante
                dall'utilizzo del presente sito sarà competente in via esclusiva il Foro di Milano.
            </p>
        </>
    );
}

function AuditPrivacyContent() {
    return (
        <>
            <p>Ultimo aggiornamento: marzo 2026</p>

            <h2>1. Contesto e Dati raccolti</h2>
            <p>
                Questa informativa è specifica per lo strumento "Indice di Dispersione del Mercato". 
                I Titolari del trattamento sono Alessia Amoruso e Asia Franceschi (WIDE Studio Digitale).
                Attraverso il questionario e l'eventuale successiva prenotazione raccogliamo:
            </p>
            <ul>
                <li><strong>Dati di navigazione:</strong> analizzati in forma anonima tramite Vercel Analytics.</li>
                <li><strong>Risposte al quiz:</strong> memorizzate localmente nel browser dell'utente (non salvate sui nostri server web in questa fase).</li>
                <li><strong>Dati di prenotazione:</strong> se si sceglie di prenotare la consulenza finale, i dati (nome, email, scelte espresse) verranno raccolti tramite il widget di Cal.com.</li>
            </ul>

            <h2>2. Finalità del trattamento</h2>
            <p>I dati condivisi durante la prenotazione verranno usati esclusivamente per:</p>
            <ul>
                <li>Studiare il posizionamento e le risposte fornite per preparare la consulenza strategica gratuita.</li>
                <li>Inviare comunicazioni di servizio relative all'appuntamento fissato.</li>
            </ul>

            <h2>3. Sicurezza e Conservazione</h2>
            <p>
                Non vendiamo o cediamo a terzi i vostri dati per scopi di marketing. I dati restano custoditi secondo i più rigidi standard di sicurezza dai nostri partner tecnologici (Cal.com, Vercel) e conservati solo per il periodo strettamente necessario a erogare il servizio di consulenza.
            </p>

            <h2>4. Diritti dell'utente</h2>
            <p>
                L'utente detiene gli stessi diritti specificati nella <a href="/privacy" target="_blank">Privacy Policy generale</a> ai sensi del GDPR, tra cui diritto di accesso, cancellazione e opposizione. Per qualsiasi richiesta, scrivere a: <a href="mailto:widestudiodigitale@gmail.com">widestudiodigitale@gmail.com</a>.
            </p>
        </>
    );
}

function AuditTerminiContent() {
    return (
        <>
            <p>Ultimo aggiornamento: marzo 2026</p>

            <h2>1. Natura dello Strumento</h2>
            <p>
                Il questionario "Indice di Dispersione del Mercato" è uno strumento di autovalutazione indicativo. 
                I profili risultanti (Verde, Giallo, Rosso) sono stime basate su parametri standard di mercato e non costituiscono in alcun modo diagnosi finanziaria, contabile o legale vincolante.
            </p>

            <h2>2. Consulenza Gratuita</h2>
            <p>
                La prenotazione della sessione gratuita successiva al completamento del quiz è soggetta alla disponibilità d'agenda di WIDE Studio Digitale.
                La sessione ha lo scopo di esplorare le opportunità di collaborazione e analizzare le criticità emerse, ma non obbliga né l'utente all'acquisto di servizi, né WIDE all'erogazione di garanzie di risultato specifiche pre-contrattuali.
            </p>

            <h2>3. Proprietà intellettuale</h2>
            <p>
                La struttura, la logica e i testi del questionario sono di proprietà esclusiva di WIDE Studio Digitale. È severamente vietata la riproduzione, la copia o l'utilizzo concorrenziale di questo strumento senza autorizzazione esplicita.
            </p>

            <h2>4. Limitazione di Responsabilità</h2>
            <p>
                WIDE Studio Digitale non è responsabile per eventuali decisioni di business prese dall'utente basandosi esclusivamente sull'esito automatizzato di questo quiz. Qualsiasi strategia aziendale richiede sempre un'analisi approfondita su misura. Per le altre condizioni d'uso, fa fede il generale documento di <a href="/note-legali" target="_blank">Note Legali</a>.
            </p>
        </>
    );
}

const CONTENT: Record<PageType, React.FC> = {
    'privacy': PrivacyContent,
    'cookie': CookieContent,
    'note-legali': NoteLegaliContent,
    'audit-privacy': AuditPrivacyContent,
    'audit-termini': AuditTerminiContent,
};

export const LegalPage: React.FC<LegalPageProps> = ({ page, onBack }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    const Content = CONTENT[page];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#000',
            color: '#fff',
            padding: 'clamp(32px, 8vw, 80px) clamp(20px, 6vw, 120px)',
        }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <button
                    onClick={() => {
                        if (page === 'audit-privacy' || page === 'audit-termini') {
                            window.location.href = '/audit/';
                        } else {
                            onBack();
                        }
                    }}
                    style={{
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.6)',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        letterSpacing: '0.08em',
                        marginBottom: '40px',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }}
                >
                    &larr; {(page === 'audit-privacy' || page === 'audit-termini') ? 'Torna al quiz' : 'Torna al sito'}
                </button>

                <h1 style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                    fontWeight: 700,
                    marginBottom: 'clamp(24px, 4vw, 48px)',
                    letterSpacing: '-0.02em',
                }}>
                    {TITLES[page]}
                </h1>

                <div style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                    lineHeight: 1.85,
                    fontFamily: 'var(--font-body)',
                }}>
                    <style>{`
                        .legal-content h2 {
                            color: #fff;
                            font-family: var(--font-subtitle);
                            font-size: clamp(1rem, 2.5vw, 1.25rem);
                            font-weight: 600;
                            margin-top: 2em;
                            margin-bottom: 0.6em;
                            letter-spacing: 0.01em;
                        }
                        .legal-content h3 {
                            color: rgba(255,255,255,0.9);
                            font-family: var(--font-subtitle);
                            font-size: clamp(0.9rem, 2vw, 1.05rem);
                            font-weight: 600;
                            margin-top: 1.5em;
                            margin-bottom: 0.4em;
                        }
                        .legal-content p {
                            margin-bottom: 1em;
                        }
                        .legal-content ul {
                            margin-bottom: 1em;
                            padding-left: 1.5em;
                        }
                        .legal-content li {
                            margin-bottom: 0.5em;
                        }
                        .legal-content a {
                            color: rgba(255,255,255,0.9);
                            text-decoration-color: rgba(255,255,255,0.3);
                            text-underline-offset: 3px;
                            transition: text-decoration-color 0.3s ease;
                        }
                        .legal-content a:hover {
                            text-decoration-color: rgba(255,255,255,0.8);
                        }
                    `}</style>
                    <div className="legal-content">
                        <Content />
                    </div>
                </div>
            </div>
        </div>
    );
};
