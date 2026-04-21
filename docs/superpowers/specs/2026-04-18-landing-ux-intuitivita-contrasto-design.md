# Landing WIDE — Ristrutturazione UX e Contrasto

**Data:** 2026-04-18
**Stato:** Approvato (in attesa revisione utente)
**Target surface primaria:** Mobile (traffico paid social)

## 1. Contesto e problema

Test usability con due utenti 50enni ha evidenziato problemi di intuitività su due componenti pinnati (ScrollVideo, ChiSiamo) e un problema di leggibilità diffuso su tutta la landing. I tester non hanno intuito che bisogna **continuare a scrollare** per visualizzare contenuti successivi: il pin GSAP fa percepire la pagina come "bloccata", e l'architettura non offre segnali continui di "c'è altro".

In parallelo: il CTA nell'IntroOverlay ("Scorri o tocca per iniziare") è tipograficamente troppo discreto (0.55rem, oro al 55% opacità) per un contesto paid-traffic mobile dove l'utente arriva freddo.

## 2. Obiettivi

1. Rendere **autoesplicativo** il fatto che l'utente deve continuare a scrollare, sia in ScrollVideo che in ChiSiamo, senza cadere in ornamenti tutorial pesanti.
2. Sostituire il paradigma pin (hard-to-understand) con **scroll lineare nativo** dove possibile, preservando l'estetica Noir Editorial.
3. Portare il contrasto testuale al livello **WCAG AAA** (target pragmatico), senza appiattire l'eleganza editoriale su bianco puro.
4. Rendere il CTA di IntroOverlay **immediatamente riconoscibile** come affordance di scroll.

## 3. Vincoli e requisiti non-funzionali

- **Mobile-first obbligatorio**: ogni decisione parte dal mobile (larghezza ~375px) e si adatta a desktop, mai il contrario.
- Preservare il linguaggio visivo Noir Editorial: fondo `#050505`, oro `#c5a55a`, font Outfit (title), Manrope (body), Playfair italic (serif accent).
- Mantenere le ottimizzazioni performance esistenti (lazy loading sezioni below-the-fold, deferred scripts).
- Preservare gli hook GTM/GA4 (`section_view`, `cta_click`) e il flusso Analytics.
- L'utente è aperto a riscrivere componenti interi: complessità accettabile se risolve la causa radice.

## 4. Decisioni di design

### 4.1 IntroOverlay — CTA chevron + sfondo pulito

**Cambiamenti:**
- **Sfondo**: rimuovere l'overlay `fractalNoise` SVG (background grey-texture). Fondo nero puro `#000`.
- **CTA scorri**: sostituire il chevron ascii micro (`⌵`) + linea-drop sottile con un **cluster di 3 chevron SVG stacked** che si accendono in cascata top→bottom (animazione `chev-cascade` 1.6s ease-in-out infinite, stagger 0.2s per chevron).
- **Label**: "SCORRI" in Outfit 700 / 0.82rem / letter-spacing 0.22em / bianco pieno `#fff` (no opacity reducer).
- **Sub-label**: "o tocca per iniziare" in Manrope 500 / 0.62rem / `rgba(255,255,255,0.6)` / letter-spacing 0.1em.
- **Dimensioni chevron**: 28×14px SVG, stroke `#c5a55a` 2.2px, opacity animata 0.3 → 1.
- **Posizione**: invariata (bottom 28-48px clamp).

**Mantenere invariato:**
- Animazione loop letter-by-letter su "WIDE" (fade-in blur → hold → fade-out, repeat).
- Kicker "Studio Digitale" in oro 600 con spacing 0.30em.
- Gold line verticale sotto WIDE (reveal dopo che le lettere completano).
- Gesture dismissal (wheel/touch/click/keydown) e lock scroll.
- Accessibilità: button visually-hidden per Tab, aria-label.

### 4.2 Contrasto testuale globale

**Regole:**

| Ruolo testo | Prima | Dopo | Ratio AA/AAA |
|-------------|-------|------|--------------|
| Body standard (descrizioni founder, card desc, partnership) | `rgba(255,255,255,0.5-0.55)` | `rgba(255,255,255,0.75)` | 8.4:1 AAA |
| Secondari / captions / paragrafi "Vision" | `rgba(255,255,255,0.45-0.5)` | `rgba(255,255,255,0.65)` | 6.4:1 AAA |
| Paragrafi "Partnership" con opacità a cascata | `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.72)` | 7.8:1 AAA |
| Oro per accenti (eyebrow, scroll hint, counter) | `rgba(197,165,90,0.55)` | `#c5a55a` piena | 6.5:1 AAA |
| Pull quote italic serif | `rgba(255,255,255,0.72)` OK → switch a oro per enfasi | `#c5a55a` | 9.2:1 AAA |

**Non toccare:** decorazioni tipografiche grandi (titoli 80px+ con `-webkit-text-stroke`), numeri decorativi di sfondo (`rgba(255,255,255,0.025)`), hairlines/dividers sottili (`rgba(255,255,255,0.06-0.15)`).

**Componenti impattati:**
- `ChiSiamo.tsx` — founder cards description/role, partnership 3 paragrafi, vision 2 paragrafi
- `ScrollVideo.tsx` — card descriptions tutti e 5 i layout (cards/stats/gallery/testimonial/video)
- `Contatti.tsx` — da verificare durante implementazione
- `Footer.tsx` — da verificare durante implementazione
- `NavBubble.tsx`, `CookieBanner.tsx`, scroll hints vari

### 4.3 ScrollVideo — Sticky canvas + strip markers

**Nuova architettura:**

- **Rimuovere** il pin ScrollTrigger e il sistema fast/slow segments.
- **Canvas** diventa `position: sticky, top: 0, height: 100vh` dentro un container alto ~700vh totali (6 servizi × ~115vh + markers).
- **Scrubbing**: il canvas disegna il frame basato sulla posizione scroll all'interno del container. Scroll nativo → scrollbar sempre in movimento → zero sensazione di "pagina bloccata".
- **Asset**: convertire le 908 PNG desktop + 223 mobile in **1 file video MP4** (H.264, baseline profile per compatibilità iOS Safari ≥15). Canvas disegna via `ctx.drawImage(videoEl)` con `video.currentTime = progress * video.duration`. Risparmio banda stimato: decine di MB → 2-5MB.
- **Fallback**: detect via probe iniziale — se `video.readyState` non raggiunge `HAVE_ENOUGH_DATA` dopo il preload o se i primi 5 seek `currentTime=…` impiegano >200ms medi, degrade a sequenza di ~60 keyframe WebP estratti dal video (2-3 MB totali), preload sequenziale con `Image()`. Log a GTM come `scrollvideo_fallback_activated`.

**Chapter markers (strip divisoria):**

Tra un servizio e l'altro, una banda orizzontale full-width:

```
┌──────────────────────────────────────────┐
│  (gradient oro orizzontale + linee top/bot) │
│                                          │
│             02                           │  ← Playfair italic 1.8rem oro
│     CONTENT MARKETING                    │  ← Outfit 700 0.62rem uppercase
│                                          │
└──────────────────────────────────────────┘
```

- Background: `linear-gradient(90deg, transparent, rgba(197,165,90,0.08), transparent)`
- Border top/bot: `1px solid rgba(197,165,90,0.2)`
- Altezza: 90-110px (circa 12vh mobile)
- Non spezza il canvas dietro — il canvas continua il suo scrub sotto i markers (blend mode opaque / leggera gradient mask sui bordi strip).

**Layout content dei 6 servizi:** preservati (cards 3-col/stack, stats 2-cell/stack, gallery 2×2, testimonial centered, video iframe). Ogni blocco content appoggia sul canvas con una leggera "scrim" gradient sul bordo inferiore per leggibilità (`linear-gradient(180deg, transparent 60%, rgba(5,5,5,0.4))`).

**Indicatori persistenti:**

- **Mobile (≤767px)**: progress bar orizzontale top fixed, full-width, altezza 3px, fill oro che cresce con `globalProgress`. Sotto: micro-counter "03 / 06 · CONTENT MARKETING" centrato, Outfit 600 0.58rem uppercase. Sempre visibile, scompare solo fuori dalla sezione ScrollVideo.
- **Desktop (≥768px)**: vertical timeline nav sinistra sempre visibile (non solo durante transizioni) — 6 dot + label, dot attivo allargato (4×20px), click per jump-to-service. Progress counter top-right "03 / 06".
- Rimuovere: scroll hint "svScrollDrop" (non serve più, scroll è nativo).
- Mantenere: skip button "Salta sezione" bottom-center (esca rapida).

**Lunghezza totale:** ~700vh desktop, ~800vh mobile (leggermente più breve di ora grazie a scroll lineare).

**Performance:**
- Preload video MP4 con `preload="auto"` + `playsInline` muted.
- Throttle del canvas redraw a 60fps con `requestAnimationFrame`.
- Opzionale: decodifica video a risoluzione dimezzata su mobile.

### 4.4 ChiSiamo — Editorial Spread mobile-first

**Nuova architettura:**

- **Rimuovere** pin ScrollTrigger, swap animation fg/bg, indicatori dots, sistema `focusedCard`.
- **Flusso verticale naturale**: 2 scene sequenziali, nessun pin.

**Struttura mobile (primaria):**

1. **Intro** (~30vh)
   - Eyebrow "02 · CHI SIAMO" in oro pieno, 0.55rem letter-spacing 0.28em
   - Titolo "Le menti dietro ogni progetto." in Outfit 800, 1.85rem, uppercase
   - Numero decorativo "02" dietro (opacity 0.025)

2. **Scene I — Alessia Amoruso** (~100vh)
   - **Hero foto full-bleed** 380px: `/founders/Alessia_Amoruso.jpeg`, cover, filtro `grayscale(0.25) contrast(1.08)`, overlay gradient bottom `linear-gradient(transparent 40%, rgba(5,5,5,0.95))`
   - Caption top-left: "I · Co-Founder" in oro Outfit 700, 0.55rem
   - Name overlay bottom-left: "Alessia / Amoruso" Outfit 800, 2rem, uppercase, line-height 0.9
   - Role: "Sviluppo & Pubblicità" Outfit 600, 0.55rem, uppercase, letter-spacing 0.18em, sottolineatura gold `rgba(197,165,90,0.4)`
   - Body section: descrizione Manrope 0.78rem line-height 1.6 color `rgba(255,255,255,0.82)` + pull quote Playfair italic 1rem oro con left border

3. **Divider "II — ASIA"** (~8vh)
   - Background gradient oro orizzontale (`rgba(197,165,90,0.1)` centrale)
   - Border top/bot `1px solid rgba(197,165,90,0.2)`
   - Numero decorativo " · · · " in Playfair italic 1.4rem oro
   - Label "II — ASIA" Outfit 600, 0.58rem uppercase, letter-spacing 0.25em, bianco 0.6
   - Arrow "↓ continua" oro 0.5 opacity

4. **Scene II — Asia Franceschi** (~100vh)
   - Stessa struttura di Scene I, con `/founders/Asia_Franceschi.jpeg` e copy di Asia
   - Caption "II · Co-Founder"

5. **Vision** (~50vh)
   - Titolo "Come lavoriamo" Outfit 700 1.2rem
   - 2 paragrafi Manrope 0.72rem color `rgba(255,255,255,0.7)`
   - Claim finale "Tu concentrati sulla tua attività…" Outfit 600 1rem

**Struttura desktop (adattamento):**

- Scene I: grid 2-col `1.1fr 1fr` — foto sinistra full-bleed, text-block destra con name + role + desc + quote centrati verticalmente
- Divider: identico ma padding verticale maggiore
- Scene II: grid 2-col `1fr 1.1fr` **specchiato** — text sinistra, foto destra (effetto "magazine spread")

**Animazioni:**
- Entry viewport: fade-in + slight `translateY(20px→0)` usando `ScrollTrigger` con trigger `top 80%` (una sola volta, no scrub). Stagger 0.15s tra eyebrow → titolo → hero → body.
- Rimosso: rotation, scale, swap, focus transitions.
- Opzionale desktop-only: `hover` sulla foto applica leggero `scale(1.02)` + `filter: grayscale(0)` su 0.6s.

**Mantenere:** sezione "Partner, non semplici fornitori" sopra a Chi Siamo (identica, solo contrasti da alzare).

## 5. Architettura componenti

```
IntroOverlay.tsx
├── Remove: fractalNoise background
├── Replace: scroll hint with <ChevronCascade /> subcomponent
└── Bump: label font-size 0.55 → 0.82rem, opacity 0.55 → 1

ScrollVideo.tsx (reshape)
├── New: <VideoCanvas /> with sticky positioning + currentTime scrub
├── New: <ChapterStrip number="02" title="Content Marketing" />
├── Remove: pin ScrollTrigger, fast/slow segment logic, PNG preload array
├── Keep: 5 layout renderers (cards/stats/gallery/testimonial/video)
├── Keep: timeline nav sinistra (sempre visibile)
└── Keep: analytics hooks, progress counter

ChiSiamo.tsx (reshape)
├── New: <FounderScene index={0|1} /> con hero + body + quote
├── New: <FounderDivider romanNum="II" name="ASIA" />
├── Remove: pinWrapRef, swap timeline, focusedCard state, dots indicator
├── Keep: Partnership section (solo contrast fix)
├── Keep: Vision section (solo contrast fix)
└── Keep: analytics hooks

Global contrast pass
├── Search: rgba(255,255,255,0.(45|5|55))
└── Replace per regola 4.2 mappata a ruolo testo
```

## 6. Non-scope

- Non si tocca **Hero**, **SocialProof**, **Portfolio**, **Contatti/LeadForm**, **Footer** se non per correzioni di contrasto incidentali durante il pass globale.
- Non si aggiungono nuove sezioni o contenuti.
- Non si cambia la palette cromatica né i font.
- Non si modifica il backend lead o l'analytics.

## 7. Testing e validazione

- **Manuale mobile**: iPhone 13 reale (Safari iOS ≥17) + Chrome DevTools device toolbar iPhone SE/12/14 Pro Max.
- **Manuale desktop**: Chrome + Firefox + Safari macOS, 1440px e 1920px.
- **Contrasto**: verifica programmatica con script Node che legge i CSS inline e calcola ratio WCAG per ogni coppia color/background. Report fail per tutti i ratio < 4.5:1 su testo body.
- **Scroll smoothness**: profiling performance tab (ScrollVideo deve mantenere ≥ 50fps su mobile medio).
- **Video scrub**: verificare fluidità su iOS Safari 17, Chrome Android, Chrome desktop. Fallback immagini se degrade.
- **UX re-test**: ripetere test con stessi 50enni (o profilo simile) per verificare che ora riescano a navigare entrambe le sezioni senza intervento.

## 8. Piano di rollout

1. Contrasto globale (basso rischio, cambio puramente cromatico).
2. IntroOverlay CTA (isolato, basso rischio).
3. ChiSiamo refactor (rischio medio, ma elimina molto codice).
4. ScrollVideo refactor (rischio alto, richiede conversione video MP4 + test cross-browser).

Ogni step committato separatamente per rollback granulare. Deploy Vercel con preview URL prima di merge su main.
