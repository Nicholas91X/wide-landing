# WIDE Landing — Lead Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il widget Cal.com nella sezione Contatti con un form di acquisizione lead che invia i dati a `wide-backend` e traccia gli eventi in GTM/GA4.

**Architecture:** Nuovo componente React `LeadForm.tsx` che sostituisce `CalEmbed` in `Contatti.tsx`. Validazione client-side vanilla (zero dipendenze). Submit a `POST /api/v1/leads`. Hook GTM/GA4 via `dataLayer` per tracciare start, submit, success, error. Stile Noir Editorial con CSS inline e token CSS esistenti.

**Tech Stack:** React 19, TypeScript, fetch API, CSS inline con design token esistenti, GTM dataLayer (già presente in `index.html`)

**Spec di riferimento:** `docs/superpowers/specs/2026-04-16-wide-lead-system-design.md` — Sezione 3 e 5

**Prerequisito:** Il backend `wide-backend` deve essere accessibile (anche solo in locale via `npm run start:dev`) prima di testare il form. Configura `VITE_API_URL` nel `.env.local`.

---

## File Map

```
wide-landing/src/
├── components/
│   ├── LeadForm.tsx          ← nuovo componente (sostituisce CalEmbed)
│   └── Contatti.tsx          ← modifica: rimuovi CalEmbed, aggiungi LeadForm
├── utils/
│   └── analytics.ts          ← modifica: aggiungi 4 funzioni lead tracking
└── .env.local                ← aggiungi VITE_API_URL (gitignored)
```

---

## Task 1: Variabile d'ambiente e tracking analytics

**Files:**
- Modify: `src/utils/analytics.ts`
- Modify: `.env.local` (crea se non esiste, è già in `.gitignore`)

- [ ] **Step 1.1 — Aggiungi `VITE_API_URL` a `.env.local`**

```bash
# Nella root di wide-landing
echo "VITE_API_URL=http://localhost:3000" >> .env.local
```

In produzione Vercel, aggiungere la variabile d'ambiente `VITE_API_URL=https://api.widestudiodigitale.com` tramite il dashboard Vercel (Settings → Environment Variables).

- [ ] **Step 1.2 — Aggiungi hook GTM/GA4 in `src/utils/analytics.ts`**

Apri `src/utils/analytics.ts` e aggiungi in coda (dopo le funzioni esistenti `trackCTAClick`, `trackSectionView`, ecc.):

```typescript
// ── Lead Form — GTM/GA4 dataLayer events ─────────────────────────────────
// Questi eventi vengono pushati al dataLayer GTM già presente in index.html.
// Per attivare il tracciamento in GA4:
//   1. In GTM crea un trigger di tipo "Custom Event" per ogni event name
//   2. Collega "lead_form_success" a un tag GA4 Event con event_name "generate_lead"
// Le funzioni sono safe da chiamare anche se GTM non è configurato — dataLayer
// viene inizializzato come array vuoto se non presente.

export function trackLeadFormStart(): void {
  window.dataLayer?.push({ event: 'lead_form_start' });
}

export function trackLeadFormSubmit(servizio: string): void {
  window.dataLayer?.push({
    event: 'lead_form_submit',
    lead_servizio: servizio,
  });
}

export function trackLeadFormSuccess(servizio: string): void {
  window.dataLayer?.push({
    event: 'lead_form_success', // ← usa questo come trigger conversione in GTM
    lead_servizio: servizio,
  });
}

export function trackLeadFormError(reason: string): void {
  window.dataLayer?.push({
    event: 'lead_form_error',
    error_reason: reason,
  });
}
```

- [ ] **Step 1.3 — Aggiungi il tipo `dataLayer` alla window (TypeScript)**

In `src/utils/analytics.ts`, in cima al file (o in un file `src/types/global.d.ts` se non esiste), aggiungi:

```typescript
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
```

Se il file ha già una dichiarazione `Window`, aggiungi solo `dataLayer` alla dichiarazione esistente.

- [ ] **Step 1.4 — Verifica TypeScript**

```bash
npx tsc --noEmit
```

Expected: EXIT 0, nessun errore.

- [ ] **Step 1.5 — Commit**

```bash
git add src/utils/analytics.ts
git commit -m "feat: aggiungi hook GTM/GA4 per lead form (start, submit, success, error)"
```

---

## Task 2: Componente LeadForm

**Files:**
- Create: `src/components/LeadForm.tsx`

- [ ] **Step 2.1 — Crea `src/components/LeadForm.tsx`**

```tsx
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

      // Rimuovi errore per il campo modificato
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }

      // Traccia primo touch (una sola volta per sessione form)
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

  // ── Stato success ────────────────────────────────────────────────────────

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

  // ── Form ─────────────────────────────────────────────────────────────────

  const submitting = status === 'submitting';

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Nome + Cognome */}
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

      {/* Email + Telefono */}
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

      {/* Settore */}
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

      {/* Settore custom — solo se "Altro" */}
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

      {/* Servizio */}
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

      {/* Errore API */}
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

      {/* Submit */}
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

      {/* Keyframe spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};

export default LeadForm;
```

- [ ] **Step 2.2 — Verifica TypeScript**

```bash
npx tsc --noEmit
```

Expected: EXIT 0.

- [ ] **Step 2.3 — Commit**

```bash
git add src/components/LeadForm.tsx
git commit -m "feat: componente LeadForm con validazione, stati, GTM hooks"
```

---

## Task 3: Integrazione in Contatti.tsx

**Files:**
- Modify: `src/components/Contatti.tsx`

- [ ] **Step 3.1 — Rimuovi l'import di CalEmbed**

In `src/components/Contatti.tsx`, trova e rimuovi:

```typescript
import CalEmbed from './CalEmbed';
```

Sostituiscilo con:

```typescript
import { LeadForm } from './LeadForm';
```

- [ ] **Step 3.2 — Sostituisci `<CalEmbed>` con `<LeadForm>`**

In `Contatti.tsx`, cerca il blocco della card Cal.com (intorno alla riga che contiene `<CalEmbed calLink=...>`). L'intera struttura della card è simile a:

```tsx
<div ref={calCardInnerRef} style={{ ... }}>
  <div data-spotlight ... />
  <CalEmbed calLink="wide-studiodigitale-jdk11j" eventSlug="30min" domain="cal.eu" />
</div>
```

Sostituisci `<CalEmbed calLink="wide-studiodigitale-jdk11j" eventSlug="30min" domain="cal.eu" />` con:

```tsx
<div style={{ padding: isMobile ? '4px 0' : '8px 0' }}>
  <p style={{
    color: 'var(--color-gold)',
    fontSize: '0.68rem',
    fontFamily: 'var(--font-subtitle)',
    fontWeight: 700,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    margin: '0 0 20px',
  }}>
    Contattaci
  </p>
  <LeadForm isMobile={isMobile} />
</div>
```

- [ ] **Step 3.3 — Rimuovi il file CalEmbed.tsx se non è usato altrove**

Verifica che `CalEmbed` non sia importato in nessun altro file:

```bash
grep -r "CalEmbed" src/
```

Se il grep non restituisce nulla (o solo il file CalEmbed.tsx stesso), puoi eliminare il file:

```bash
git rm src/components/CalEmbed.tsx
```

Se è usato altrove, lascialo e salta questo step.

- [ ] **Step 3.4 — Verifica visiva locale**

```bash
npm run dev
```

Naviga a `http://localhost:5173`, scrolla fino alla sezione Contatti. Verifica:
- Il form appare al posto del widget Cal.com
- Su mobile (DevTools, 375px): layout a colonna singola, tutti i campi visibili
- Su desktop (1280px): Nome+Cognome su due colonne, Email+Telefono su due colonne
- Dropdown Settore: 10 opzioni + se selezioni "Altro" appare il campo testo
- Dropdown Servizio: 7 opzioni
- Errori di validazione: lascia Nome vuoto e clicca Invia → messaggio errore rosso/oro

- [ ] **Step 3.5 — Test invio reale (con backend locale attivo)**

Con `wide-backend` in esecuzione su `localhost:3000`:

```bash
# Compila il form e clicca Invia
# Expected:
# 1. Bottone mostra spinner "Invio in corso…"
# 2. Dopo 1-2s: card sostituita da messaggio di conferma
# 3. In console browser: nessun errore
# 4. In DevTools Network: POST http://localhost:3000/api/v1/leads → 201 Created
# 5. In console GTM (se installato): evento lead_form_success nel dataLayer
```

Verifica anche il dataLayer aprendo la console del browser:
```javascript
window.dataLayer  // deve contenere eventi lead_form_*
```

- [ ] **Step 3.6 — Commit**

```bash
git add src/components/Contatti.tsx
git commit -m "feat: sostituisci CalEmbed con LeadForm nella sezione Contatti"
```

---

## Task 4: Configurazione Vercel + deploy

- [ ] **Step 4.1 — Aggiungi variabile d'ambiente in Vercel**

Nel dashboard Vercel del progetto `wide-landing`:
- Settings → Environment Variables
- Aggiungi: `VITE_API_URL` = `https://api.widestudiodigitale.com`
- Seleziona: Production, Preview, Development

- [ ] **Step 4.2 — Aggiorna `CORS_ORIGINS` nel backend**

Assicurati che `wide-backend/.env` in produzione contenga:
```
CORS_ORIGINS=https://widestudiodigitale.com,https://dashboard.widestudiodigitale.com
```

Se il dominio Vercel di preview è diverso (es. `wide-landing-xxx.vercel.app`), aggiungi anche quello durante i test.

- [ ] **Step 4.3 — Push e verifica deploy**

```bash
git push origin restyle/noir-editorial
```

Vercel effettua il deploy automaticamente. Verifica in produzione:
- `https://widestudiodigitale.com` → sezione Contatti → form visibile
- Compila e invia: ricevi email di conferma + WIDE riceve notifica interna

- [ ] **Step 4.4 — Commit finale**

```bash
# Nessuna modifica di codice in questo task — il commit è già fatto al 3.6
# Verifica solo che il branch sia pushato
git log --oneline -3
```

---

## Self-Review

**Spec coverage:**

| Requisito spec | Task |
|---------------|------|
| Campi: Nome, Cognome, Email, Telefono, Settore, Servizio | Task 2 |
| Settore: dropdown + "Altro" con campo libero | Task 2 |
| Servizio: 7 opzioni, single select | Task 2 |
| Settori predefiniti hardcodati | Task 2 |
| Validazione client-side | Task 2 |
| Stato submitting (spinner, campi disabilitati) | Task 2 |
| Stato success (card di conferma) | Task 2 |
| Stato error (messaggio inline) | Task 2 |
| Submit a `POST /api/v1/leads` | Task 2 |
| `VITE_API_URL` da env var | Task 1, 4 |
| Hook GTM/GA4: start, submit, success, error | Task 1 |
| `lead_form_success` come trigger conversione | Task 1 |
| Sostituisce CalEmbed in Contatti.tsx | Task 3 |
| Stile Noir Editorial, zero nuove dipendenze | Task 2 |
| `data-cursor="ring"` sul bottone submit | Task 2 |
| Layout 2 colonne desktop, 1 colonna mobile | Task 2 |

**Nessun placeholder trovato.**

**Consistenza tipi:** `FormData`, `FormErrors`, `FormStatus` definiti e usati solo in `LeadForm.tsx`. `trackLead*` definite in `analytics.ts` e importate in `LeadForm.tsx`. ✓
