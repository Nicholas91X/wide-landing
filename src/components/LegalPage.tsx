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
            <p>Ultimo aggiornamento: aprile 2026</p>

            <h2>1. Titolari del Trattamento</h2>
            <p>
                I Titolari del trattamento dei dati personali sono:<br />
                <strong>Alessia Amoruso</strong> — P.IVA 13486160966<br />
                <strong>Asia Franceschi</strong> — P.IVA 01566890115<br />
                operanti congiuntamente sotto il nome commerciale <strong>WIDE Studio Digitale</strong>.<br />
                E-mail di contatto: <a href="mailto:widestudiodigitale@gmail.com">widestudiodigitale@gmail.com</a>
            </p>

            <h2>2. Dati raccolti</h2>
            <p>
                Durante la navigazione sui siti e le applicazioni web di WIDE Studio Digitale
                (widestudiodigitale.com e game.widestudiodigitale.com) possono essere trattati
                i seguenti dati personali:
            </p>
            <ul>
                <li><strong>a) Dati di navigazione:</strong> indirizzo IP, tipo di browser, sistema operativo, pagine visitate, orari di accesso, eventi di interazione. Questi dati vengono raccolti tramite Google Analytics 4 (gestito via Google Tag Manager) e sono utilizzati per finalità statistiche e di miglioramento del servizio.</li>
                <li><strong>b) Dati forniti volontariamente dall'utente:</strong>
                    <ul>
                        <li>Sul sito principale: nome, cognome, indirizzo e-mail, numero di telefono, settore di attività e informazioni comunicate tramite il form di contatto proprietario o tramite i quiz integrati nel sito. I dati vengono inviati al nostro backend ospitato su api.widestudiodigitale.com.</li>
                        <li>Sull'applicazione di gioco (game.widestudiodigitale.com): nome o nickname scelto dal giocatore, indirizzo e-mail o numero di telefono WhatsApp forniti al termine della partita.</li>
                    </ul>
                </li>
                <li><strong>c) Dati di sessione di gioco:</strong> le scelte effettuate durante la partita, i testi generati dall'intelligenza artificiale e i relativi metadati (prodotto assegnato, esito della partita, importi simulati). Questi dati sono conservati in forma pseudonimizzata e associati a un identificativo di sessione.</li>
                <li><strong>d) Dati di rate limiting:</strong> l'indirizzo IP viene temporaneamente conservato per prevenire abusi del servizio (massimo 5 partite ogni 24 ore).</li>
            </ul>

            <h2>3. Finalità del trattamento</h2>
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <ul>
                <li>Erogazione del servizio di gioco interattivo e invio della storia generata;</li>
                <li>Gestione delle richieste di contatto e consulenze;</li>
                <li>Analisi statistiche sull'utilizzo dei siti e dell'applicazione di gioco (Google Analytics 4, tramite Google Tag Manager);</li>
                <li>Miglioramento dell'esperienza utente e del servizio;</li>
                <li>Adempimento di obblighi di legge.</li>
            </ul>

            <h2>4. Base giuridica</h2>
            <p>Il trattamento dei dati è fondato su:</p>
            <ul>
                <li>Consenso dell'interessato (art. 6, par. 1, lett. a del GDPR) per l'invio della storia di gioco, la raccolta del contatto e l'installazione di cookie non tecnici;</li>
                <li>Esecuzione di misure precontrattuali (art. 6, par. 1, lett. b) per la gestione delle richieste di contatto;</li>
                <li>Legittimo interesse (art. 6, par. 1, lett. f) per le analisi statistiche aggregate e la sicurezza del servizio (rate limiting);</li>
                <li>Adempimento di obblighi legali (art. 6, par. 1, lett. c).</li>
            </ul>

            <h2>5. Servizi di terze parti</h2>

            <h3>a) Google Tag Manager (Google LLC)</h3>
            <p>Servizio di gestione dei tag che consente di amministrare i codici di tracciamento tramite un'interfaccia web. GTM di per sé non raccoglie dati personali, ma abilita l'esecuzione di altri servizi (come Google Analytics 4). <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy di Google</a>.</p>

            <h3>b) Google Analytics 4 (Google LLC)</h3>
            <p>Servizio di analisi web che utilizza cookie per raccogliere informazioni sull'utilizzo del sito in forma aggregata. I dati possono essere trasferiti verso server situati negli Stati Uniti. L'utente può opporsi al tracciamento tramite il cookie banner presente sul sito. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy di Google</a>.</p>

            <h3>c) Supabase (Supabase Inc.)</h3>
            <p>Servizio di database utilizzato per la conservazione delle sessioni di gioco e dei dati di contatto forniti volontariamente. I dati sono conservati su server nell'Unione Europea. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy di Supabase</a>.</p>

            <h3>d) Anthropic (Anthropic PBC)</h3>
            <p>Servizio di intelligenza artificiale utilizzato per la generazione dei testi narrativi durante la partita. I dati inviati ad Anthropic includono il nome scelto dal giocatore e il nome del prodotto assegnato. Anthropic non utilizza i dati inviati tramite API per addestrare i propri modelli. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy di Anthropic</a>.</p>

            <h3>e) Vercel (Vercel Inc.)</h3>
            <p>Servizio di hosting e distribuzione del sito web. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy di Vercel</a>.</p>

            <h3>f) Brevo (Sendinblue SAS)</h3>
            <p>Servizio SMTP utilizzato per l'invio delle notifiche e-mail transazionali legate al form di contatto (conferme e avvisi interni). I dati trasmessi includono nome, cognome e indirizzo e-mail inseriti nel form. <a href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacy Policy di Brevo</a>.</p>

            <h3>g) Google Fonts (Google LLC)</h3>
            <p>L'applicazione di gioco utilizza font caricati dai server di Google. Durante il caricamento, il browser dell'utente stabilisce una connessione con i server di Google, trasmettendo l'indirizzo IP. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy di Google</a>.</p>


            <h2>6. Conservazione dei dati</h2>
            <ul>
                <li><strong>Dati di sessione di gioco:</strong> conservati per 12 mesi dalla data di creazione, poi cancellati automaticamente.</li>
                <li><strong>Dati di contatto (e-mail, WhatsApp):</strong> conservati per 24 mesi o fino a revoca del consenso.</li>
                <li><strong>Dati di rate limiting (IP):</strong> cancellati automaticamente ogni 24 ore.</li>
                <li><strong>Dati di navigazione e analytics:</strong> conservati secondo le impostazioni di Google Analytics 4 (default: 14 mesi).</li>
            </ul>

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
                Alcuni servizi di terze parti (Google, Anthropic, Vercel, Brevo) possono comportare il trasferimento di dati
                verso paesi al di fuori dell'Unione Europea. Tali trasferimenti avvengono sulla base di adeguate
                garanzie ai sensi degli artt. 46-49 del GDPR (Clausole Contrattuali Standard, decisioni di
                adeguatezza, Data Privacy Framework UE-USA).
            </p>
        </>
    );
}

function CookieContent() {
    return (
        <>
            <p>Ultimo aggiornamento: aprile 2026</p>

            <h2>1. Cosa sono i cookie</h2>
            <p>
                I cookie sono piccoli file di testo che i siti web visitati inviano al browser dell'utente, dove
                vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva.
            </p>

            <h2>2. Cookie utilizzati da questo sito</h2>

            <h3>a) Cookie tecnici (non richiedono consenso)</h3>
            <ul>
                <li>Cookie di sessione necessari al funzionamento del sito.</li>
                <li><strong>Preferenze di consenso:</strong> il sito memorizza la scelta dell'utente relativa ai cookie (accettazione o rifiuto) tramite localStorage del browser. Questa informazione è necessaria per non ripresentare il banner ad ogni visita.</li>
            </ul>

            <h3>b) Cookie analitici (richiedono consenso)</h3>
            <p>
                <strong>Google Analytics 4</strong> (_ga, _ga_*): raccolgono dati statistici sull'utilizzo del sito in
                forma aggregata e pseudonimizzata. Durata: fino a 14 mesi. Fornitore: Google LLC.
                Questi cookie vengono installati solo dopo il consenso dell'utente tramite il cookie banner.
            </p>

            <h3>c) Cookie di terze parti</h3>
            <ul>
                <li><strong>Google Fonts:</strong> il caricamento dei font (nell'applicazione di gioco) non comporta l'installazione di cookie, ma implica una connessione ai server di Google con trasmissione dell'indirizzo IP.</li>
            </ul>

            <h2>3. Gestione del consenso</h2>
            <p>
                Al primo accesso al sito viene mostrato un banner di gestione dei cookie. L'utente può:
            </p>
            <ul>
                <li>Accettare tutti i cookie;</li>
                <li>Rifiutare i cookie non tecnici;</li>
                <li>Modificare le proprie preferenze in qualsiasi momento cliccando sul link "Gestisci cookie" presente nel footer del sito.</li>
            </ul>
            <p>
                I cookie analitici (Google Analytics 4) vengono attivati <strong>SOLO</strong> dopo il consenso esplicito dell'utente.
            </p>

            <h2>4. Come gestire i cookie dal browser</h2>
            <p>
                L'utente può gestire le preferenze relative ai cookie anche tramite le impostazioni del
                proprio browser:
            </p>
            <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
                <li><a href="https://support.microsoft.com/it-it/help/4027947" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>

            <h2>5. Aggiornamenti</h2>
            <p>
                La presente Cookie Policy può essere soggetta ad aggiornamenti. L'utente è invitato a consultare
                periodicamente questa pagina.
            </p>
        </>
    );
}

function NoteLegaliContent() {
    return (
        <>
            <p>Ultimo aggiornamento: aprile 2026</p>

            <h2>1. Informazioni generali</h2>
            <p>
                I presenti siti web (widestudiodigitale.com e game.widestudiodigitale.com) sono di proprietà di:<br />
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
            <p>Ultimo aggiornamento: aprile 2026</p>

            <h2>1. Contesto e Dati raccolti</h2>
            <p>
                Questa informativa è specifica per lo strumento "Indice di Dispersione del Mercato".
                I Titolari del trattamento sono Alessia Amoruso e Asia Franceschi (WIDE Studio Digitale).
                Attraverso il questionario e l'eventuale successivo invio del form di contatto raccogliamo:
            </p>
            <ul>
                <li><strong>Dati di navigazione:</strong> analizzati tramite Google Analytics 4 (gestito via Google Tag Manager). I cookie analitici vengono installati solo previo consenso tramite il cookie banner.</li>
                <li><strong>Risposte al quiz:</strong> memorizzate localmente nel browser dell'utente (non salvate sui nostri server web in questa fase). Gli eventi di avanzamento e completamento del quiz vengono tracciati in forma aggregata tramite GA4.</li>
                <li><strong>Dati di contatto:</strong> se si sceglie di richiedere la consulenza finale, i dati (nome, cognome, email, telefono, settore, scelte espresse) vengono raccolti tramite il form di contatto proprietario e trasmessi al nostro backend su api.widestudiodigitale.com.</li>
            </ul>

            <h2>2. Finalità del trattamento</h2>
            <p>I dati condivisi tramite il form verranno usati esclusivamente per:</p>
            <ul>
                <li>Studiare il posizionamento e le risposte fornite per preparare la consulenza strategica gratuita.</li>
                <li>Inviare comunicazioni di servizio relative all'appuntamento fissato.</li>
            </ul>

            <h2>3. Sicurezza e Conservazione</h2>
            <p>
                Non vendiamo o cediamo a terzi i vostri dati per scopi di marketing. I dati restano custoditi secondo i più rigidi standard di sicurezza dai nostri partner tecnologici (Vercel per hosting front-end, Brevo per l'invio delle notifiche e-mail, infrastruttura back-end gestita da WIDE Studio Digitale) e conservati solo per il periodo strettamente necessario a erogare il servizio di consulenza.
            </p>

            <h2>4. Diritti dell'utente</h2>
            <p>
                L'utente detiene gli stessi diritti specificati nella <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy generale</a> ai sensi del GDPR, tra cui diritto di accesso, cancellazione e opposizione. Per qualsiasi richiesta, scrivere a: <a href="mailto:widestudiodigitale@gmail.com">widestudiodigitale@gmail.com</a>.
            </p>
        </>
    );
}

function AuditTerminiContent() {
    return (
        <>
            <p>Ultimo aggiornamento: aprile 2026</p>

            <h2>1. Natura dello Strumento</h2>
            <p>
                Il questionario "Indice di Dispersione del Mercato" è uno strumento di autovalutazione indicativo. 
                I profili risultanti (Verde, Giallo, Rosso) sono stime basate su parametri standard di mercato e non costituiscono in alcun modo diagnosi finanziaria, contabile o legale vincolante.
            </p>

            <h2>2. Consulenza Gratuita</h2>
            <p>
                La richiesta della sessione gratuita successiva al completamento del quiz avviene tramite il form di contatto ed è soggetta alla disponibilità di WIDE Studio Digitale.
                La sessione ha lo scopo di esplorare le opportunità di collaborazione e analizzare le criticità emerse, ma non obbliga né l'utente all'acquisto di servizi, né WIDE all'erogazione di garanzie di risultato specifiche pre-contrattuali.
            </p>

            <h2>3. Proprietà intellettuale</h2>
            <p>
                La struttura, la logica e i testi del questionario sono di proprietà esclusiva di WIDE Studio Digitale. È severamente vietata la riproduzione, la copia o l'utilizzo concorrenziale di questo strumento senza autorizzazione esplicita.
            </p>

            <h2>4. Limitazione di Responsabilità</h2>
            <p>
                WIDE Studio Digitale non è responsabile per eventuali decisioni di business prese dall'utente basandosi esclusivamente sull'esito automatizzato di questo quiz. Qualsiasi strategia aziendale richiede sempre un'analisi approfondita su misura. Per le altre condizioni d'uso, fa fede il generale documento di <a href="/note-legali" target="_blank" rel="noopener noreferrer">Note Legali</a>.
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
