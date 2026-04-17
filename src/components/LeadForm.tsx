import React, { useState, useRef, useCallback } from 'react';
import {
  trackLeadFormStart,
  trackLeadFormSubmit,
  trackLeadFormSuccess,
  trackLeadFormError,
} from '../utils/analytics';

// ─── Dati statici ────────────────────────────────────────────────────────────

const SETTORI = [
  'Automotive',
  'Fitness / Sport',
  'Ristorazione',
  'Moda / Fashion',
  'Immobiliare',
  'Professioni / Studi',
  'Retail / E-commerce',
  'Artigianato',
  'Tecnologia',
  'Altro',
] as const;

const SERVIZI = [
  'Social Media Marketing',
  'Content Marketing',
  'Shooting Video/Fotografici',
  'Produzioni Video con AI',
  'Il Tuo Strumento Digitale',
  'Sviluppo Piattaforme Web',
  'Integrazioni Automazioni AI',
] as const;

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface FormData {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  settore: string;
  settoreCustom: string;
  servizio: string;
}

interface FormErrors {
  nome?: string;
  cognome?: string;
  email?: string;
  telefono?: string;
  settore?: string;
  settoreCustom?: string;
  servizio?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY: FormData = {
  nome: '', cognome: '', email: '', telefono: '',
  settore: '', settoreCustom: '', servizio: '',
};

const API_URL = import.meta.env.VITE_API_URL as string;

// ─── Validazione ─────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.nome.trim() || data.nome.trim().length < 2)
    errors.nome = 'Inserisci il nome (min. 2 caratteri)';

  if (!data.cognome.trim() || data.cognome.trim().length < 2)
    errors.cognome = 'Inserisci il cognome (min. 2 caratteri)';

  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Inserisci un\'email valida';

  if (!data.telefono.trim() || !/^[\d+\s\-()]{8,20}$/.test(data.telefono))
    errors.telefono = 'Inserisci un numero valido (min. 8 cifre)';

  if (!data.settore)
    errors.settore = 'Seleziona il tuo settore';

  if (data.settore === 'Altro' && !data.settoreCustom.trim())
    errors.settoreCustom = 'Specifica il tuo settore';

  if (!data.servizio)
    errors.servizio = 'Seleziona il servizio di interesse';

  return errors;
}

// ─── Stili ───────────────────────────────────────────────────────────────────

const S = {
  label: {
    display: 'block',
    fontSize: '0.68rem',
    fontFamily: 'var(--font-subtitle)',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-gold)',
    marginBottom: 6,
  },
  input: (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(220,50,50,0.6)' : 'var(--color-border)'}`,
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
    borderRadius: 0,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  }),
  errorMsg: {
    color: 'rgba(220,80,80,0.9)',
    fontSize: '0.7rem',
    marginTop: 4,
    fontFamily: 'var(--font-body)',
  },
  fieldWrap: { marginBottom: 16 },
  grid2: (isMobile: boolean): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 16,
    marginBottom: 16,
  }),
  submitBtn: (submitting: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 24px',
    background: submitting ? 'rgba(255,255,255,0.7)' : '#fff',
    color: '#000',
    border: 'none',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-subtitle)',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    cursor: submitting ? 'not-allowed' : 'none',
    transition: 'background 0.2s, box-shadow 0.2s',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }),
} as const;

// ─── Componente ───────────────────────────────────────────────────────────────

interface LeadFormProps {
  isMobile: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({ isMobile }) => {
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [apiError, setApiError] = useState<string>('');
  const startedRef = useRef(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setData((prev) => ({ ...prev, [name]: value }));

      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }

      if (!startedRef.current) {
        startedRef.current = true;
        trackLeadFormStart();
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(data);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setStatus('submitting');
      setApiError('');
      trackLeadFormSubmit(data.servizio);

      const payload = {
        nome: data.nome.trim(),
        cognome: data.cognome.trim(),
        email: data.email.trim(),
        telefono: data.telefono.trim(),
        settore: data.settore,
        ...(data.settore === 'Altro' && data.settoreCustom
          ? { settoreCustom: data.settoreCustom.trim() }
          : {}),
        servizio: data.servizio,
      };

      try {
        const res = await fetch(`${API_URL}/api/v1/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = body?.message ?? `Errore ${res.status}`;
          throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
        }

        setStatus('success');
        trackLeadFormSuccess(data.servizio);
      } catch (err) {
        const msg = (err as Error).message ?? 'Errore sconosciuto';
        setApiError(msg);
        setStatus('error');
        trackLeadFormError(msg);
      }
    },
    [data],
  );

  if (status === 'success') {
    return (
      <div
        style={{
          padding: isMobile ? '32px 24px' : '48px 36px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ width: 40, height: 1, background: 'var(--color-gold)' }} />
        <p
          style={{
            color: 'var(--color-gold)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-subtitle)',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Richiesta ricevuta
        </p>
        <h3
          style={{
            color: '#fff',
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Ti contatteremo entro 24 ore.
        </h3>
        <p
          style={{
            color: 'rgba(255,255,255,0.48)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            margin: 0,
            maxWidth: 320,
          }}
        >
          Abbiamo inviato una conferma alla tua email. Nel frattempo puoi
          esplorare il nostro portfolio.
        </p>
        <div style={{ width: 40, height: 1, background: 'var(--color-gold)' }} />
      </div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <form onSubmit={handleSubmit} noValidate>

      <div style={S.grid2(isMobile)}>
        <div>
          <label htmlFor="nome" style={S.label}>Nome</label>
          <input
            id="nome" name="nome" type="text" autoComplete="given-name"
            value={data.nome} onChange={handleChange} disabled={submitting}
            placeholder="Mario"
            style={S.input(!!errors.nome)}
          />
          {errors.nome && <p style={S.errorMsg}>{errors.nome}</p>}
        </div>
        <div>
          <label htmlFor="cognome" style={S.label}>Cognome</label>
          <input
            id="cognome" name="cognome" type="text" autoComplete="family-name"
            value={data.cognome} onChange={handleChange} disabled={submitting}
            placeholder="Rossi"
            style={S.input(!!errors.cognome)}
          />
          {errors.cognome && <p style={S.errorMsg}>{errors.cognome}</p>}
        </div>
      </div>

      <div style={S.grid2(isMobile)}>
        <div>
          <label htmlFor="email" style={S.label}>Email</label>
          <input
            id="email" name="email" type="email" autoComplete="email"
            value={data.email} onChange={handleChange} disabled={submitting}
            placeholder="mario.rossi@email.com"
            style={S.input(!!errors.email)}
          />
          {errors.email && <p style={S.errorMsg}>{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="telefono" style={S.label}>Telefono</label>
          <input
            id="telefono" name="telefono" type="tel" autoComplete="tel"
            value={data.telefono} onChange={handleChange} disabled={submitting}
            placeholder="+39 333 1234567"
            style={S.input(!!errors.telefono)}
          />
          {errors.telefono && <p style={S.errorMsg}>{errors.telefono}</p>}
        </div>
      </div>

      <div style={S.fieldWrap}>
        <label htmlFor="settore" style={S.label}>Settore</label>
        <div style={{ position: 'relative' }}>
          <select
            id="settore" name="settore"
            value={data.settore} onChange={handleChange} disabled={submitting}
            style={{
              ...S.input(!!errors.settore),
              paddingRight: 36,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpolyline points='1,1 6,7 11,1' fill='none' stroke='rgba(197,165,90,0.7)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="">Seleziona il tuo settore…</option>
            {SETTORI.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {errors.settore && <p style={S.errorMsg}>{errors.settore}</p>}
      </div>

      {data.settore === 'Altro' && (
        <div style={S.fieldWrap}>
          <label htmlFor="settoreCustom" style={S.label}>Specifica il settore</label>
          <input
            id="settoreCustom" name="settoreCustom" type="text"
            value={data.settoreCustom} onChange={handleChange} disabled={submitting}
            placeholder="Es. Turismo, Agricoltura…"
            style={S.input(!!errors.settoreCustom)}
          />
          {errors.settoreCustom && <p style={S.errorMsg}>{errors.settoreCustom}</p>}
        </div>
      )}

      <div style={S.fieldWrap}>
        <label htmlFor="servizio" style={S.label}>Servizio di interesse</label>
        <div style={{ position: 'relative' }}>
          <select
            id="servizio" name="servizio"
            value={data.servizio} onChange={handleChange} disabled={submitting}
            style={{
              ...S.input(!!errors.servizio),
              paddingRight: 36,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpolyline points='1,1 6,7 11,1' fill='none' stroke='rgba(197,165,90,0.7)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="">Seleziona il servizio…</option>
            {SERVIZI.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {errors.servizio && <p style={S.errorMsg}>{errors.servizio}</p>}
      </div>

      {status === 'error' && apiError && (
        <div
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(220,50,50,0.4)',
            background: 'rgba(220,50,50,0.06)',
            marginBottom: 16,
          }}
        >
          <p style={{ ...S.errorMsg, margin: 0 }}>
            Si è verificato un errore: {apiError}. Riprova o scrivici direttamente.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        data-cursor="ring"
        style={S.submitBtn(submitting)}
        onMouseEnter={(e) => {
          if (!submitting) {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(197,165,90,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {submitting ? (
          <>
            <span
              style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid rgba(0,0,0,0.3)',
                borderTopColor: '#000',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }}
            />
            Invio in corso…
          </>
        ) : (
          'Invia la richiesta →'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};

export default LeadForm;
