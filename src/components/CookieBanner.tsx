import { useState, useEffect } from 'react';

const CONSENT_KEY = 'wide_cookie_consent';

type ConsentValue = 'accepted' | 'rejected';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function getStoredConsent(): ConsentValue | null {
  try {
    const val = localStorage.getItem(CONSENT_KEY);
    if (val === 'accepted' || val === 'rejected') return val;
  } catch { /* private browsing */ }
  return null;
}

function storeConsent(value: ConsentValue) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* noop */ }
}

function pushConsentUpdate() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'consent_accepted' });
}

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored === 'accepted') {
      pushConsentUpdate();
    } else if (stored === null) {
      setVisible(true);
    }
    // rejected: do nothing, consent stays denied

    const onReopen = () => setVisible(true);
    window.addEventListener('wide:reopen-cookie-banner', onReopen);
    return () => window.removeEventListener('wide:reopen-cookie-banner', onReopen);
  }, []);

  const accept = () => {
    storeConsent('accepted');
    pushConsentUpdate();
    setVisible(false);
  };

  const reject = () => {
    storeConsent('rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: '#111',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '20px clamp(20px, 5vw, 40px)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      fontFamily: 'var(--font-body)',
    }}>
      <p style={{
        color: 'rgba(255,255,255,0.75)',
        fontSize: '0.82rem',
        lineHeight: 1.6,
        margin: 0,
        flex: '1 1 400px',
      }}>
        Questo sito utilizza cookie analitici e di profilazione per migliorare la tua esperienza.
        Puoi leggere la nostra{' '}
        <a
          href="/cookie"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, '', '/cookie');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          style={{ color: '#fff', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >Cookie Policy</a>{' '}
        per maggiori dettagli.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={reject}
          style={{
            padding: '10px 22px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-subtitle)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 0,
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          Rifiuta
        </button>
        <button
          onClick={accept}
          style={{
            padding: '10px 22px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-subtitle)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 0,
            backgroundColor: '#fff',
            color: '#000',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
        >
          Accetta
        </button>
      </div>
    </div>
  );
};

/** Call this to reopen the banner (e.g. from "Gestisci cookie" link) */
export function reopenCookieBanner() {
  try { localStorage.removeItem(CONSENT_KEY); } catch { /* noop */ }
  window.dispatchEvent(new CustomEvent('wide:reopen-cookie-banner'));
}

export default CookieBanner;
