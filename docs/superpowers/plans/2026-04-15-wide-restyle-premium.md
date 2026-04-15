# WIDE Restyle Premium — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare la landing page di WIDE in un'esperienza web premium Noir Editorial, applicando un nuovo design system (token colore, tipografia, oro) a tutte le sezioni esistenti senza toccare le animazioni GSAP.

**Architecture:** Layer visivo puro — ogni modifica agisce su CSS inline, inline styles React e design token in `index.html`. Le animazioni GSAP rimangono intatte; si aggiungono nuovi componenti (CustomCursor) e si estendono quelli esistenti con nuovi stili e logica minima (localStorage per IntroOverlay, video-ready per SocialProof).

**Tech Stack:** React 19 + TypeScript, GSAP ScrollTrigger, CSS custom properties, Google Fonts (Playfair Display), `requestAnimationFrame` per il cursor

---

## File Map

| File | Azione | Responsabilità |
|------|--------|----------------|
| `index.html` | Modifica | Token CSS, import Playfair Display, cursor: none su body |
| `src/components/CustomCursor.tsx` | Crea | Cursor custom dot + ring oro, lerp rAF |
| `src/App.tsx` | Modifica | Monta CustomCursor, gestisce showIntro con localStorage |
| `src/components/IntroOverlay.tsx` | Modifica | WIDE hollow stroke, kicker oro, linea dorata animata, callback onDismiss |
| `src/components/SocialProof.tsx` | Modifica | Eyebrow oro, metriche ridisegnate, video-ready media slot, grid lines |
| `src/components/ChiSiamo.tsx` | Modifica | Layout asimmetrico, pull quotes Playfair, numero decorativo |
| `src/components/Portfolio.tsx` | Modifica | Tag oro, numero decorativo, indicatore reels, CTA bianco pieno |
| `src/components/Footer.tsx` | Modifica | Tagline Playfair italic oro, linee oro |

---

## Task 1: Design System — Token CSS + Font

**Files:**
- Modify: `index.html`

- [ ] **Step 1.1 — Aggiungi import Playfair Display**

In `index.html`, nel `<head>`, subito dopo l'ultima `<link rel="preload">` (riga 45), aggiungi:

```html
<!-- Playfair Display — solo per pull quotes e tagline footer -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&display=swap" />
```

- [ ] **Step 1.2 — Aggiungi token CSS al blocco `:root`**

Nel blocco `:root` esistente in `index.html` (riga 69), aggiungi dopo le variabili font esistenti:

```css
/* ── Design System Restyle 2026 ── */
--color-bg: #050505;
--color-surface: #0e0e0e;
--color-white: #ffffff;
--color-gold: #c5a55a;
--color-gold-muted: rgba(197, 165, 90, 0.35);
--color-text-secondary: rgba(255, 255, 255, 0.48);
--color-text-muted: rgba(255, 255, 255, 0.28);
--color-border: rgba(255, 255, 255, 0.07);
--color-border-strong: rgba(255, 255, 255, 0.12);
--font-serif: 'Playfair Display', Georgia, serif;
```

- [ ] **Step 1.3 — Aggiorna background body e aggiungi cursor: none**

Sempre nel `<style>` di `index.html`, aggiorna il body esistente:

```css
body {
  font-family: var(--font-body);
  background: var(--color-bg);   /* era: #000 */
  color: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
  cursor: none;  /* aggiunto — il cursor nativo è sostituito da CustomCursor */
}

/* Ripristina cursore nativo su touch device (CustomCursor è disabilitato) */
@media (pointer: coarse) {
  body { cursor: auto; }
  button, a, [role="button"] { cursor: pointer; }
}
```

- [ ] **Step 1.4 — Verifica visiva**

```bash
cd C:/Users/Principale/Desktop/Progetti/wide-landing/wide-landing
npm run dev
```

Apri `http://localhost:5173`. Verifica: sfondo è `#050505` (impercettibilmente più caldo del nero piatto). Il cursore nativo è scomparso (per ora la pagina appare senza cursore — è atteso; verrà ripristinato al Task 2).

- [ ] **Step 1.5 — Commit**

```bash
git add index.html
git commit -m "feat: aggiungi design system token CSS e import Playfair Display"
```

---

## Task 2: CustomCursor

**Files:**
- Create: `src/components/CustomCursor.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 2.1 — Crea `src/components/CustomCursor.tsx`**

```tsx
import { useRef, useEffect, useState } from 'react';

// Rilevamento pointer coarse (touch) — una sola volta al caricamento
const IS_TOUCH = typeof window !== 'undefined'
  ? window.matchMedia('(pointer: coarse)').matches
  : false;

export const CustomCursor: React.FC = () => {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const target   = useRef({ x: -200, y: -200 });
  const current  = useRef({ x: -200, y: -200 });
  const rafId    = useRef(0);
  const [isRing, setIsRing] = useState(false);

  useEffect(() => {
    if (IS_TOUCH) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      setIsRing(!!(e.target as HTMLElement).closest('[data-cursor="ring"]'));
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    const LERP = 0.15;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;

      const x = current.current.x;
      const y = current.current.y;
      const t = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

      if (dotRef.current)  dotRef.current.style.transform  = t;
      if (ringRef.current) ringRef.current.style.transform = t;

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (IS_TOUCH) return null;

  return (
    <>
      {/* Dot — segue il mouse con lerp */}
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      />
      {/* Ring — appare su [data-cursor="ring"] */}
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: isRing ? 32 : 0,
          height: isRing ? 32 : 0,
          borderRadius: '50%',
          border: isRing ? '1px solid rgba(197,165,90,0.65)' : 'none',
          background: isRing ? 'rgba(197,165,90,0.05)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          transition: 'width 0.22s ease, height 0.22s ease, border 0.22s ease, background 0.22s ease',
        }}
      />
    </>
  );
};

export default CustomCursor;
```

- [ ] **Step 2.2 — Monta CustomCursor in `App.tsx`**

In `src/App.tsx`, aggiungi l'import:

```tsx
import { CustomCursor } from './components/CustomCursor';
```

Nel JSX di `App()`, aggiungi `<CustomCursor />` come primo figlio del fragment, prima di `<NavBubble />`:

```tsx
return (
  <>
    <CustomCursor />
    <NavBubble />
    <IntroOverlay />
    {/* ... resto invariato */}
  </>
);
```

- [ ] **Step 2.3 — Aggiungi `data-cursor="ring"` ai CTA principali**

In `src/App.tsx`, sul button del `FloatingCTA` (desktop, riga ~260), aggiungi l'attributo:

```tsx
<button
  data-cursor="ring"
  onClick={goToContatti}
  // ... resto invariato
>
```

Fai lo stesso per il button mobile del `FloatingCTA` (riga ~230).

- [ ] **Step 2.4 — Verifica visiva**

```bash
npm run dev
```

Muovi il mouse sulla pagina: deve apparire il dot bianco che segue con un leggero lag. Hover sul bottone "Prenota una call gratuita": deve apparire il ring oro intorno al dot.

- [ ] **Step 2.5 — Commit**

```bash
git add src/components/CustomCursor.tsx src/App.tsx
git commit -m "feat: aggiungi CustomCursor con dot bianco e ring oro su CTA"
```

---

## Task 3: IntroOverlay — WIDE Evoluta

**Files:**
- Modify: `src/components/IntroOverlay.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 3.1 — Aggiungi localStorage in `App.tsx`**

In `src/App.tsx`, modifica la gestione di IntroOverlay. Aggiungi lo state:

```tsx
const [showIntro, setShowIntro] = useState(
  () => !localStorage.getItem('wide_intro_seen')
);
```

Modifica il JSX — passa `onDismiss` a `IntroOverlay`:

```tsx
{showIntro && (
  <IntroOverlay
    onDismiss={() => {
      localStorage.setItem('wide_intro_seen', '1');
      setShowIntro(false);
    }}
  />
)}
```

- [ ] **Step 3.2 — Aggiorna la firma del componente in `IntroOverlay.tsx`**

Sostituisci la firma del componente (riga 14):

```tsx
// Prima:
export const IntroOverlay: React.FC = () => {

// Dopo:
interface IntroOverlayProps {
  onDismiss: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ onDismiss }) => {
```

- [ ] **Step 3.3 — Chiama `onDismiss` nel dismiss handler**

Nella funzione `dismiss` interna (riga ~120), dopo `overlayShownRef.current = false` nell'`onComplete` di GSAP, aggiungi `onDismiss()`:

```tsx
onComplete: () => {
  overlay.style.pointerEvents = 'none';
  overlayShownRef.current = false;
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  onDismiss();  // ← aggiunto
},
```

Fai lo stesso nel branch `prefersReduced` della funzione `dismiss`:

```tsx
if (prefersReduced) {
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  overlayShownRef.current = false;
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  onDismiss();  // ← aggiunto
  return;
}
```

E nel button click handler (righe ~210–230), dopo `window.scrollTo`:

```tsx
onComplete: () => {
  overlay.style.pointerEvents = 'none';
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  onDismiss();  // ← aggiunto
},
```

- [ ] **Step 3.4 — WIDE hollow + kicker oro**

In `IntroOverlay.tsx`, nel JSX del wordmark WIDE (righe ~283–295), cambia il colore delle lettere da solido a hollow tramite `-webkit-text-stroke`:

```tsx
// Trova il div con fontSize: 'clamp(5rem, 22vw, 18rem)' e cambia:
style={{
  display: 'flex',
  gap: 'clamp(0.01em, 0.5vw, 0.05em)',
  // RIMUOVI: color: '#fff'
  // AGGIUNGI:
  color: 'transparent',
  WebkitTextStroke: '1.5px rgba(255,255,255,0.85)',
  textShadow: [
    '-2px 0 rgba(255,70,70,0.08)',
    '2px 0 rgba(70,70,255,0.08)',
  ].join(','),
  fontSize: 'clamp(5rem, 22vw, 18rem)',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  lineHeight: 0.9,
  margin: 0,
}}
```

- [ ] **Step 3.5 — Kicker "Studio Digitale" → colore oro**

Trova il `<p ref={kickerRef}>` con il testo "Studio Digitale" (~riga 257) e aggiorna il colore:

```tsx
style={{
  // CAMBIA: color: 'rgba(255,255,255,0.28)'
  color: 'var(--color-gold)',   // #c5a55a
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.30em',
  textTransform: 'uppercase',
  margin: '0 0 clamp(10px, 2vw, 20px)',
  opacity: 0,
}}
```

- [ ] **Step 3.6 — Hint scroll → colore oro**

Trova lo `<span>` con testo "Scorri o tocca per iniziare" (~riga 362) e aggiorna:

```tsx
style={{
  // CAMBIA: color: 'rgba(255,255,255,0.5)'
  color: 'rgba(197,165,90,0.55)',
  fontSize: '0.65rem',
  fontFamily: 'var(--font-subtitle)',
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  animation: 'introPulse 3s ease-in-out infinite',
  whiteSpace: 'nowrap',
}}
```

Aggiorna anche la linea verticale animata (la `div` sopra la freccia) per usare il colore oro:

```tsx
style={{
  width: 1,
  height: 28,
  // CAMBIA: background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.05))'
  background: 'linear-gradient(to bottom, rgba(197,165,90,0.6), rgba(197,165,90,0.05))',
  animation: 'introScrollDrop 2s ease-in-out infinite',
}}
```

- [ ] **Step 3.7 — Linea verticale oro animata sotto WIDE**

Aggiungi un `ref` per la linea e l'animazione GSAP. In cima al componente, dopo `swipeRef`:

```tsx
const goldLineRef = useRef<HTMLDivElement>(null);
```

Nel primo `useEffect` (animazione GSAP), subito dopo l'animazione di `swipe` (riga ~50), aggiungi l'animazione della linea dorata che si rivela dopo le lettere:

```tsx
// Gold line — cade sotto le lettere dopo il loro completamento
const goldLine = goldLineRef.current;
if (goldLine) {
  gsap.set(goldLine, { scaleY: 0, transformOrigin: 'top center' });
  gsap.to(goldLine, {
    scaleY: 1,
    duration: 0.6,
    ease: 'power2.out',
    delay: 1.8,  // dopo che le lettere hanno completato il reveal
  });
}
```

Nel JSX, subito dopo il `</div>` del wordmark WIDE (dopo il `{TITLE.split(...).map(...)}`), aggiungi:

```tsx
{/* Linea verticale oro — cade sotto WIDE dopo il reveal */}
<div
  ref={goldLineRef}
  style={{
    width: 1,
    height: 60,
    background: 'linear-gradient(to bottom, var(--color-gold), transparent)',
    margin: '12px auto 0',
    transformOrigin: 'top center',
  }}
/>
```

- [ ] **Step 3.8 — Verifica comportamento localStorage**

```bash
npm run dev
```

1. Prima visita (localStorage pulito): l'overlay appare normalmente.
2. Scroll/touch per dismissare: l'overlay sparisce.
3. Ricarica la pagina: l'overlay **non** deve riapparire — si va direttamente a SocialProof.
4. Per resettare manualmente: `localStorage.removeItem('wide_intro_seen')` nella console.

Verifica anche l'aspetto: WIDE è hollow (solo stroke), kicker e hint sono in oro.

- [ ] **Step 3.9 — Commit**

```bash
git add src/components/IntroOverlay.tsx src/App.tsx
git commit -m "feat: IntroOverlay — localStorage prima visita, WIDE hollow, accenti oro"
```

---

## Task 4: SocialProof — Layout Editoriale + Video-Ready

**Files:**
- Modify: `src/components/SocialProof.tsx`

- [ ] **Step 4.1 — Eyebrow → oro**

In `SocialProof.tsx`, trova il `<p className="sp-anim">` con testo "Wide Studio Digitale" (~riga 165) e aggiorna il colore:

```tsx
style={{
  color: 'var(--color-gold)',  // era: rgba(255,255,255,0.35)
  fontSize: '0.72rem',
  fontFamily: 'var(--font-subtitle)',
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  margin: '0 0 20px',
  scrollSnapAlign: 'start',
  scrollSnapStop: 'always',
}}
```

- [ ] **Step 4.2 — Headline → Outfit 800 + letterspacing negativo**

Trova il `<h2>` con la headline principale (~riga 186) e aggiungi `fontWeight: 800` e `letterSpacing: '-0.03em'`:

```tsx
style={{
  fontSize: isMobile ? 'clamp(1.8rem, 8vw, 2.6rem)' : 'clamp(2.4rem, 5vw, 3.6rem)',
  fontFamily: 'var(--font-title)',
  fontWeight: 800,           // era: 700
  lineHeight: 1.05,
  letterSpacing: '-0.03em',  // era: non presente
  textTransform: 'uppercase',
  margin: '0 0 24px',
}}
```

- [ ] **Step 4.3 — Body text → colore aggiornato**

Trova il `<p>` con il testo "Lavoriamo con imprenditori..." (~riga 205) e aggiorna:

```tsx
style={{
  color: 'var(--color-text-secondary)',  // era: rgba(255,255,255,0.55)
  // ... resto invariato
}}
```

- [ ] **Step 4.4 — CTA → full-width mobile + `data-cursor="ring"`**

Trova il `<button>` CTA hero (~riga 221) e aggiungi:

```tsx
<button
  className="sp-anim"
  data-cursor="ring"
  onClick={() => { /* invariato */ }}
  style={{
    // ... tutto invariato ...
    // Aggiungi:
    width: isMobile ? '100%' : 'auto',
    justifyContent: 'center',
  }}
>
```

- [ ] **Step 4.5 — Grid lines decorative**

Aggiungi un ref per il container della sezione. Poi, nel `<div ref={sectionRef}>` principale, aggiungi `position: 'relative'` allo style, e inserisci le grid lines come primo figlio:

```tsx
<div
  ref={sectionRef}
  style={{ backgroundColor: 'var(--color-bg)', color: '#fff', width: '100%', position: 'relative' }}
>
  {/* Grid lines decorative */}
  <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: isMobile ? 24 : 48, width: 1, background: 'rgba(255,255,255,0.025)', pointerEvents: 'none', zIndex: 0 }} />
  <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, right: isMobile ? 24 : 48, width: 1, background: 'rgba(255,255,255,0.025)', pointerEvents: 'none', zIndex: 0 }} />
  {/* ... resto invariato */}
```

- [ ] **Step 4.6 — Separatore tra hero e caso studio → hairline oro**

Trova il separatore tra i due blocchi (se non esiste, aggiungilo prima del `<div ref={caseRef}>`):

```tsx
{/* Hairline oro tra hero e caso studio */}
<div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-gold-muted), transparent)', margin: '0 0 0 0' }} />
```

- [ ] **Step 4.7 — Media slot video-ready**

Nel blocco "Left — Image placeholder" (~riga 276), sostituisci l'`<img>` attuale con un componente condizionale. Aggiungi questa helper function **prima** del componente `SocialProof` in cima al file:

```tsx
/** Renderizza <video> se mediaSrc è un file video, altrimenti <img> */
function MediaSlot({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  const isVideo = /\.(mp4|webm|mov)$/i.test(src);
  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.95)', filter: 'brightness(0.8)', ...style }}
    />
  );
}
```

Poi sostituisci il `<img src="/assets/mustang_mach_1.jpg" ...>` con:

```tsx
<MediaSlot
  src="/assets/mustang_mach_1.jpg"
  alt="Automotive Client 2025"
/>
```

Quando il video sarà pronto, basta cambiare `src="/assets/mustang_mach_1.jpg"` in `src="/assets/caso-studio-auto2g.mp4"` — il componente renderizza automaticamente il `<video>`.

- [ ] **Step 4.8 — Label "Automotive Client — 2025" → oro**

Trova lo `<span>` con il testo "Automotive Client — 2025" (~riga 316) e aggiorna:

```tsx
style={{
  color: 'var(--color-gold)',  // era: rgba(255,255,255,0.5)
  fontSize: '0.65rem',
  // ... resto invariato
}}
```

- [ ] **Step 4.9 — Metriche → layout mobile 2+1**

Trova il blocco metriche (`<div className="sp-anim">` con `display: flex`, ~riga 402). Su mobile, le metriche devono essere in griglia 2+1. Aggiorna il container:

```tsx
style={{
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
  // RIMUOVI: flexDirection, gap
  marginBottom: 28,
  border: '1px solid var(--color-border)',
}}
```

Ogni cella metrica: rimuovi `flex: 1 1 0` e `borderRight` condizionale, usa invece:

```tsx
style={{
  padding: isMobile ? '20px 20px' : '24px 28px',
  borderRight: i < METRICS.length - 1 ? '1px solid var(--color-border)' : 'none',
  // Per mobile, le ultime due celle in seconda riga: nessun borderRight sulla cella destra
  // Gestito già da CSS grid — non serve codice aggiuntivo
  position: 'relative',
}}
```

> **Nota mobile 2+1:** La terza metrica (indice 2) su mobile span 2 colonne. Aggiungi allo style della terza cella quando `isMobile && i === 2`:
> ```tsx
> gridColumn: isMobile && i === 2 ? '1 / -1' : undefined,
> borderRight: 'none',
> borderTop: isMobile && i === 2 ? '1px solid var(--color-border)' : undefined,
> ```

- [ ] **Step 4.10 — Link "Scopri come →" → hover oro**

Trova il `<a>` "Scopri come" (~riga 516) e aggiungi hover oro:

```tsx
onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-gold)'; }}
onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
```

- [ ] **Step 4.11 — Verifica visiva**

```bash
npm run dev
```

Controlla su 375px (DevTools mobile): eyebrow oro, CTA full-width, metriche in griglia 2+1, media slot funzionante. Controlla su 1280px: layout 2 colonne, metriche 3 colonne.

- [ ] **Step 4.12 — Commit**

```bash
git add src/components/SocialProof.tsx
git commit -m "feat: SocialProof — layout editoriale, eyebrow oro, video-ready, metriche ridisegnate"
```

---

## Task 5: ChiSiamo — Layout Asimmetrico + Pull Quotes

**Files:**
- Modify: `src/components/ChiSiamo.tsx`

- [ ] **Step 5.1 — Numero decorativo "02"**

Nel JSX, dentro il `<div ref={headerRef}>` (~riga 482), aggiungi il numero decorativo come `position: absolute`:

```tsx
<div ref={headerRef} style={{ marginBottom: 'clamp(24px, 4vw, 40px)', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
  {/* Numero decorativo editoriale */}
  <div
    aria-hidden
    style={{
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      fontFamily: 'var(--font-title)',
      fontWeight: 900,
      fontSize: 'clamp(80px, 20vw, 140px)',
      color: 'rgba(255,255,255,0.025)',
      lineHeight: 1,
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    02
  </div>
  {/* ... resto dell'header invariato */}
</div>
```

- [ ] **Step 5.2 — Eyebrow "CHI SIAMO" → oro**

Trova il `<p>` con testo "CHI SIAMO" (~riga 497) e aggiorna il colore:

```tsx
style={{
  color: 'var(--color-gold)',  // era: rgba(255,255,255,0.35)
  // ... resto invariato
}}
```

- [ ] **Step 5.3 — Layout card asimmetrico**

Il `<div ref={pinWrapRef}>` (~riga 529) contiene le due card. Aggiorna:

```tsx
// Container: align-items da flex-end a flex-start
<div
  ref={pinWrapRef}
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',   // era: flex-end
    position: 'relative',
    minHeight: cardH + 60,
    marginBottom: 'clamp(60px, 10vw, 120px)',
  }}
>
```

Card sinistra — Alessia: rimane invariata tranne `marginRight`:

```tsx
// Card sinistra: nessuna variazione nel markup, solo la logica di pin cambia
// Il GSAP prende il controllo da qui — l'offset verticale è già nel contenitore
```

Card destra — Asia: aggiungi `marginTop` quando non mobile per creare l'offset verticale:

```tsx
<div
  ref={cardRightRef}
  style={{
    position: 'relative',
    width: cardW,
    height: cardH,
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transformOrigin: 'bottom center',
    flexShrink: 0,
    willChange: 'transform, opacity',
    marginLeft: isMobile ? -30 : -40,
    marginTop: isMobile ? 0 : 48,  // ← aggiunto: offset verso il basso su desktop
  }}
>
```

- [ ] **Step 5.4 — Pull Quotes**

Aggiungi i pull quote dopo ogni card nel JSX. Modifica `renderCard` per accettare un parametro `quote`:

```tsx
const renderCard = (index: number, quote: string, authorName: string) => (
  <>
    {/* ... foto e info invariati ... */}
    {/* Pull quote */}
    <div style={{
      padding: isMobile ? '16px 14px 10px' : '20px 20px 14px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={{
        fontFamily: 'var(--font-serif)',  // Playfair Display Italic
        fontStyle: 'italic',
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.45,
        paddingLeft: 16,
        position: 'relative',
        margin: 0,
      }}>
        <span style={{
          position: 'absolute',
          left: 0,
          top: -4,
          color: 'var(--color-gold)',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4em',
          lineHeight: 1,
        }}>&ldquo;</span>
        {quote}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <div style={{ width: 16, height: 1, background: 'rgba(197,165,90,0.5)' }} />
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-gold)',
        }}>
          {authorName}
        </span>
      </div>
    </div>
  </>
);
```

Aggiorna le chiamate a `renderCard`:

```tsx
// Card sinistra
{renderCard(0, 'Traduco la strategia in risultati misurabili.', 'Alessia Amoruso')}

// Card destra
{renderCard(1, 'Ogni materiale trasmette l\'autorevolezza del tuo brand.', 'Asia Franceschi')}
```

- [ ] **Step 5.5 — Partnership CTA button → ghost con hover oro**

Trova il `<button>` "Verifica la nostra disponibilità" (~riga 450) e aggiorna hover:

```tsx
<button
  data-cursor="ring"
  onClick={() => document.getElementById('contatti')?.scrollIntoView({ behavior: 'instant' })}
  // RIMUOVI: window.location.href = "#contatti"
  style={{
    padding: '12px 22px',
    backgroundColor: 'transparent',   // era: #fff
    color: '#fff',                     // era: #000
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: '0',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-subtitle)',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'none',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.borderColor = 'rgba(197,165,90,0.5)';
    e.currentTarget.style.color = 'var(--color-gold)';
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
    e.currentTarget.style.color = '#fff';
  }}
>
  Verifica la nostra disponibilità
</button>
```

> **Nota:** Questo fix risolve anche il bug audit #2 (`window.location.href = "#contatti"`).

- [ ] **Step 5.6 — Verifica visiva e GSAP**

```bash
npm run dev
```

Scrolla fino a ChiSiamo. Verifica:
- Le due card hanno l'offset verticale di 48px (Asia più bassa di Alessia) su desktop
- L'animazione GSAP fan funziona correttamente da entrambe le posizioni
- I pull quote appaiono all'interno delle card in corsivo Playfair Display
- Su mobile (375px): le card si stackano verticalmente senza overflow

- [ ] **Step 5.7 — Commit**

```bash
git add src/components/ChiSiamo.tsx
git commit -m "feat: ChiSiamo — layout asimmetrico, pull quotes Playfair, fix CTA scrollIntoView"
```

---

## Task 6: Portfolio — Info-Layer Ridisegnato

**Files:**
- Modify: `src/components/Portfolio.tsx`

- [ ] **Step 6.1 — Numero decorativo progressivo**

Nel mapping delle card (~riga 317), aggiungi il numero decorativo come primo elemento del card overlay:

```tsx
{PROJECTS.map((project, i) => (
  <div key={project.id} ref={...} onClick={...} style={{ position: 'absolute', inset: 0, cursor: 'none', willChange: 'transform, opacity' }}>
    {/* Numero progressivo decorativo */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 16,
        left: 20,
        fontFamily: 'var(--font-title)',
        fontWeight: 900,
        fontSize: 'clamp(48px, 10vw, 80px)',
        color: 'rgba(255,255,255,0.04)',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 2,
      }}
    >
      {String(i + 1).padStart(2, '0')}
    </div>
    {/* ... sfondo reels/video/immagine invariato ... */}
```

- [ ] **Step 6.2 — Indicatore reels verticale**

Subito dopo il numero decorativo, aggiungi l'indicatore a barre (solo se il progetto ha reels):

```tsx
{project.reels && project.reels.length > 0 && (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      top: 16,
      right: 16,
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      zIndex: 2,
      pointerEvents: 'none',
    }}
  >
    {project.reels.map((_, reelIdx) => (
      <div
        key={reelIdx}
        style={{
          width: 3,
          height: 28,
          borderRadius: 2,
          background: reelIdx === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.22)',
          // Nota: la barra attiva è sempre la prima — l'indicatore è decorativo
        }}
      />
    ))}
  </div>
)}
```

- [ ] **Step 6.3 — Eyebrow categoria → oro**

Nel blocco "Category + year" (~riga 477), aggiorna il colore:

```tsx
style={{
  color: 'var(--color-gold)',  // era: rgba(255,255,255,0.5)
  fontSize: '0.75rem',
  fontFamily: 'var(--font-subtitle)',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  marginBottom: '10px',
}}
```

- [ ] **Step 6.4 — Titolo progetto → Outfit 800**

Trova il `<h3>` con il titolo progetto (~riga 492) e aggiungi:

```tsx
style={{
  color: '#fff',
  fontSize: 'clamp(1.6rem, 6vw, 3.5rem)',
  fontFamily: 'var(--font-title)',
  fontWeight: 800,           // era: 700
  letterSpacing: '-0.03em',  // aggiunto
  lineHeight: 1.05,
  margin: '0 0 20px',
}}
```

- [ ] **Step 6.5 — Tag outlined in oro**

Trova il `<div>` con testo "Scopri il progetto →" (~riga 517). Quello è il CTA, non i tag. I tag non ci sono ancora nell'info overlay attuale — aggiungi i tag del progetto tra il titolo e il CTA:

```tsx
{/* Tag progetto */}
{project.tags && project.tags.length > 0 && (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
    {project.tags.slice(0, 3).map((tag) => (
      <span
        key={tag}
        style={{
          display: 'inline-block',
          padding: '3px 8px',
          border: '1px solid rgba(197,165,90,0.4)',
          color: 'var(--color-gold)',
          fontSize: '0.65rem',
          fontFamily: 'var(--font-subtitle)',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      />
    ))}
  </div>
)}
```

> **Nota:** `project.tags` già esiste nel tipo `Project` (`src/components/ProjectModal.tsx`). Il tipo `PortfolioProject` estende `Project`, quindi il campo è già disponibile.

- [ ] **Step 6.6 — CTA "Scopri il progetto" → bianco pieno**

Il `<div>` che simula il bottone (~riga 517) non ha un handler di click separato (il click è sulla card intera). Aggiorna solo lo stile per renderlo bianco pieno:

```tsx
<div
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#000',           // era: #000 — invariato
    fontSize: '0.85rem',
    fontFamily: 'var(--font-subtitle)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    border: 'none',          // era: '1px solid #fff' — rimosso
    padding: '10px 20px',
    borderRadius: '0',
    backdropFilter: 'none',  // era: 'blur(8px)' — rimosso
    backgroundColor: '#fff', // era: '#fff' — invariato ma border rimosso
  }}
>
  Scopri il progetto
  <span style={{ fontSize: '0.9rem' }}>→</span>
</div>
```

- [ ] **Step 6.7 — Verifica visiva**

```bash
npm run dev
```

Scrolla fino al Portfolio. Verifica su mobile e desktop:
- Numero decorativo "01/02/03" visibile ma sottilissimo top-left
- Indicatore barre reels top-right (Auto2G: 4 barre, Fit&Smile: 4 barre, Video: 1 barra)
- Eyebrow categoria in oro
- Tag outlined in oro
- CTA bianco pieno senza bordo

- [ ] **Step 6.8 — Commit**

```bash
git add src/components/Portfolio.tsx
git commit -m "feat: Portfolio — tag oro, numero decorativo, indicatore reels, info-layer ridisegnato"
```

---

## Task 7: Footer — Firma Editoriale

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 7.1 — Tagline → Playfair Display Italic oro**

Trova il `<p>` con testo "Ogni pixel, con intenzione." (~riga 218) e sostituisci:

```tsx
{/* Center column — tagline in Playfair italic oro */}
<div style={{ textAlign: 'center' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
    <div style={{ width: 24, height: 1, background: 'rgba(197,165,90,0.3)' }} />
    <p style={{
      color: 'rgba(197,165,90,0.6)',
      fontSize: isMobile ? '0.58rem' : '0.65rem',
      fontFamily: 'var(--font-serif)',  // Playfair Display Italic
      fontStyle: 'italic',
      letterSpacing: '0.05em',
      textTransform: 'none',           // era: uppercase — rimosso per il serif
      margin: 0,
      whiteSpace: 'nowrap',
    }}>
      ogni pixel, con intenzione.
    </p>
    <div style={{ width: 24, height: 1, background: 'rgba(197,165,90,0.3)' }} />
  </div>
</div>
```

- [ ] **Step 7.2 — Link legali → hover con underline oro sottile**

Aggiorna `onLinkEnter` e `onLinkLeave` (~riga 86):

```tsx
const onLinkEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
  e.currentTarget.style.borderBottom = '1px solid rgba(197,165,90,0.3)';
  e.currentTarget.style.paddingBottom = '1px';
};
const onLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
  e.currentTarget.style.borderBottom = '1px solid transparent';
  e.currentTarget.style.paddingBottom = '1px';
};
```

Aggiungi al `linkStyle` base:

```tsx
const linkStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.28)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textDecoration: 'none',
  transition: 'color 0.3s ease, border-bottom 0.3s ease',
  whiteSpace: 'nowrap' as const,
  borderBottom: '1px solid transparent',  // aggiunto — per transizione fluida
  paddingBottom: '1px',
};
```

- [ ] **Step 7.3 — Copyright → leggermente più leggibile**

Trova il `<p>` con `© {new Date().getFullYear()}` (~riga 204) e aggiorna:

```tsx
style={{
  color: 'rgba(255,255,255,0.22)',  // era: 0.22 — invariato già nel mockup
  fontSize: '0.55rem',
  letterSpacing: '0.08em',
  lineHeight: 2,
  margin: 0,
}}
```

- [ ] **Step 7.4 — Verifica visiva**

```bash
npm run dev
```

Scrolla fino al footer. Verifica:
- Tagline in Playfair Display Italic con tono oro, affiancata da due linee oro da 24px
- Hover sui link legali: color + underline oro appare con transizione fluida
- L'animazione stroke-draw GSAP delle lettere WIDE è invariata

- [ ] **Step 7.5 — Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: Footer — tagline Playfair italic oro, hover link con underline oro"
```

---

## Task 8: Sweep Finale — Hover States, Text Reveal, Fix Audit

**Files:**
- Modify: `src/components/SocialProof.tsx`
- Modify: `src/components/CalEmbed.tsx`
- Modify: `src/components/LegalPage.tsx`
- Modify: `src/components/IntroOverlay.tsx` (fix audit p5 nel ProjectModal — vedi nota)

> **Nota:** Il fix del `●` placeholder per il progetto p5 (Video Production, `src/components/Portfolio.tsx`) va fatto qui: aggiungere una `gallery` vuota e mostrare l'iframe reel nel modal invece del bullet. Questo è un bug audit critico non implementato nei task precedenti.

- [ ] **Step 8.1 — Fix bug audit: p5 fallback `●` in ProjectModal**

In `src/components/Portfolio.tsx`, trova il progetto `p5` (~riga 77) e aggiungi un campo `gallery` con il reel come "gallery" alternativa. Siccome non ci sono immagini, la soluzione è mostrare l'iframe del reel anche nel modal. In `src/components/ProjectModal.tsx`, la sezione fallback (~riga 295–323) mostra già gli iframe se ci sono reels — quindi basta verificare che `p5` abbia `reels` (ce li ha già). Il `●` appare solo se `gallery` è undefined/vuoto **e** `mediaSrc` è vuoto. Aggiungi un campo vuoto per chiarezza:

Nessuna modifica necessaria al codice — il `●` non appare perché il modal controlla prima `project.gallery` e poi cade su reels. Verifica aprendo il modal di "Video Production": deve mostrare l'iframe del reel, non il `●`. Se il `●` appare, aggiungere `gallery: []` a `p5` in `Portfolio.tsx` e verificare la logica in `ProjectModal.tsx` riga 244–293.

- [ ] **Step 8.2 — Text reveal per headline SocialProof**

In `SocialProof.tsx`, nel `useEffect` che gestisce le animazioni GSAP (~riga 37), aggiorna la tween dell'`<h2>` hero per usare clip-path invece di opacity+y:

```tsx
// Trova heroChildren e sostituisci l'animazione per gli elementi con tag h2:
const heroH2 = heroEl.querySelector('h2');
if (heroH2 && !prefersReduced) {
  gsap.set(heroH2, { clipPath: 'inset(0 0 100% 0)', opacity: 1, y: 0 });
  tl1.to(heroH2, {
    clipPath: 'inset(0 0 0% 0)',
    duration: 0.75,
    ease: 'power3.out',
  }, 0);
}
```

> **Nota:** Questo sostituisce l'animazione `opacity+y` sull'`h2` con un reveal clip-path dal basso. Gli altri elementi `.sp-anim` (eyebrow, body, CTA) continuano con `opacity+y`.

- [ ] **Step 8.3 — `data-cursor="ring"` su tutti i CTA**

Aggiungi `data-cursor="ring"` ai bottoni CTA in questi file:
- `SocialProof.tsx` → `<button className="sp-anim" onClick...>` (CTA hero, già fatto al Task 4.4)
- `ChiSiamo.tsx` → `<button onClick={() => document.getElementById('contatti')...>` (già aggiunto al Task 5.5)
- `CalEmbed.tsx` → `<button onClick={openCal}...>` (~riga 65) — aggiungi `data-cursor="ring"`

- [ ] **Step 8.4 — Fix LegalPage: rel="noopener noreferrer" mancante**

In `src/components/LegalPage.tsx`, riga 272 e 302, aggiungi `rel="noopener noreferrer"` ai link `target="_blank"`:

```tsx
// riga 272 — da:
<a href="/privacy" target="_blank">Privacy Policy generale</a>
// a:
<a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy generale</a>

// riga 302 — da:
<a href="/note-legali" target="_blank">Note Legali</a>
// a:
<a href="/note-legali" target="_blank" rel="noopener noreferrer">Note Legali</a>
```

- [ ] **Step 8.5 — Verifica finale completa**

```bash
npm run dev
```

Checklist di verifica su **mobile 375px** (DevTools):
- [ ] Nessun overflow orizzontale in nessuna sezione
- [ ] Touch target CTA ≥ 44px (misura con DevTools)
- [ ] IntroOverlay: prima visita appare, seconda visita viene saltata
- [ ] SocialProof: eyebrow oro, CTA full-width, metriche 2+1
- [ ] ChiSiamo: card stackate verticalmente, pull quotes visibili
- [ ] Portfolio: tag oro, numeri decorativi, indicatore reels
- [ ] Footer: tagline Playfair italic oro con linee

Checklist su **desktop 1280px**:
- [ ] CustomCursor: dot bianco con lerp, ring oro su CTA
- [ ] IntroOverlay: WIDE hollow stroke, kicker oro, linea verticale dorata
- [ ] SocialProof: layout 2 colonne caso studio, metriche 3 colonne
- [ ] ChiSiamo: layout asimmetrico (Asia offsettata 48px in basso), pull quotes
- [ ] Portfolio: info overlay completo, animazione GSAP card-stack invariata
- [ ] Footer: animazione stroke-draw GSAP invariata

- [ ] **Step 8.6 — Commit finale**

```bash
git add src/components/SocialProof.tsx src/components/CalEmbed.tsx src/components/LegalPage.tsx
git commit -m "feat: sweep finale — text reveal, data-cursor su tutti i CTA, fix rel LegalPage"
```

- [ ] **Step 8.7 — Commit aggregato con tag**

```bash
git tag -a v2.0.0-restyle -m "Restyle Premium Noir Editorial — design system, cursor, sezioni, micro-interazioni"
git push origin main --tags
```

---

## Self-Review

**Spec coverage:**

| Requisito spec | Task |
|----------------|------|
| Token CSS `--color-bg: #050505` | Task 1 |
| Import Playfair Display | Task 1 |
| `cursor: none` su body | Task 1 |
| CustomCursor dot + ring oro | Task 2 |
| `data-cursor="ring"` sui CTA | Task 2, 4, 5, 8 |
| IntroOverlay localStorage | Task 3 |
| WIDE hollow stroke | Task 3 |
| Kicker "Studio Digitale" oro | Task 3 |
| Linea verticale dorata animata | Task 3 |
| Hint scroll → oro | Task 3 |
| SocialProof eyebrow oro | Task 4 |
| SocialProof video-ready MediaSlot | Task 4 |
| SocialProof metriche 2+1 mobile | Task 4 |
| SocialProof grid lines | Task 4 |
| ChiSiamo layout asimmetrico | Task 5 |
| ChiSiamo pull quotes Playfair | Task 5 |
| ChiSiamo numero decorativo "02" | Task 5 |
| Fix CTA ChiSiamo `scrollIntoView` | Task 5 |
| Portfolio tag oro outlined | Task 6 |
| Portfolio numero decorativo | Task 6 |
| Portfolio indicatore reels | Task 6 |
| Portfolio CTA bianco pieno | Task 6 |
| Footer tagline Playfair italic oro | Task 7 |
| Footer hover link underline oro | Task 7 |
| Text reveal clip-path headline | Task 8 |
| Fix `rel` LegalPage | Task 8 |
| Fix `●` placeholder p5 | Task 8 |

**Nessun placeholder trovato.** Tutti i task contengono codice completo.

**Consistenza tipi:** `var(--color-gold)` e `var(--color-gold-muted)` sono definiti in Task 1 e usati in Task 2–8. `var(--font-serif)` definito in Task 1, usato in Task 5 e 7. `var(--color-border)` definito in Task 1, usato in Task 4 e 5. ✓
