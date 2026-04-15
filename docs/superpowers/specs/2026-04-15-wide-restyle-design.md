# WIDE Studio Digitale — Restyle Premium 2026
**Data:** 2026-04-15  
**Approccio:** Strutturato + ChiSiamo editoriale (Approccio 2 esteso)  
**Stato:** Approvato dal cliente — pronto per implementazione

---

## 1. Obiettivo

Trasformare la landing page di WIDE da prodotto funzionale a **esperienza web premium**, mantenendo intatte le animazioni GSAP e la struttura di routing esistente. Il risultato deve essere esteticamente godibile, coerente su tutti i dispositivi e progettato **mobile-first**.

---

## 2. Principi guida

- **Mobile-first:** ogni componente viene progettato a 375px e scalato verso l'alto
- **Noir Editorial:** nero puro, nessun elemento decorativo inutile, ogni pixel intenzionale
- **Parsimonia cromatica:** l'oro appare su max 8% della superficie visiva — se usato di più, perde valore
- **Continuità animazioni:** nessuna animazione GSAP esistente viene toccata — si cambia solo il layer visivo
- **Revert-safe:** ChiSiamo viene ridisegnata con la consapevolezza che un rollback è possibile

---

## 3. Design System

### 3.1 Tipografia

| Ruolo | Font | Peso | Trattamento |
|-------|------|------|-------------|
| Display / Intro | Outfit | 900 | Uppercase, letterspacing −0.04em |
| Headline sezione | Outfit | 800 | Uppercase, letterspacing −0.03em |
| Eyebrow / Label | Manrope | 700 | Uppercase, letterspacing 0.38em, colore oro |
| Body | Manrope | 400 | 1.7 line-height, bianco 48% |
| Pull quote (ChiSiamo) | Playfair Display | Italic 400 | Unico uso del serif — solo nelle citazioni founder |
| Tagline footer | Playfair Display | Italic 400 | Unico uso nel footer — come firma calligrafica |

**Font già presenti nel progetto:** Outfit, Manrope  
**Nuova dipendenza:** Playfair Display Italic — caricata da Google Fonts solo per i pull quotes e la tagline footer (subset minimale)

### 3.2 Palette

| Token | Valore | Uso |
|-------|--------|-----|
| `--color-bg` | `#050505` | Background principale (sostituisce `#000` piatto) |
| `--color-surface` | `#0e0e0e` | Card, panel, sezioni alternative |
| `--color-white` | `#ffffff` | Titoli, CTA primari |
| `--color-gold` | `#c5a55a` | Eyebrow, separatori, hover CTA — max 8% superficie |
| `--color-text-secondary` | `rgba(255,255,255,0.48)` | Body text |
| `--color-text-muted` | `rgba(255,255,255,0.28)` | Metadati, label secondari |
| `--color-border` | `rgba(255,255,255,0.07)` | Hairline dividers, card borders |
| `--color-border-strong` | `rgba(255,255,255,0.12)` | Border su hover, card focus |

### 3.3 Separatori

Tre varianti, usate in contesti specifici:
1. **Hairline neutra:** `1px solid rgba(255,255,255,0.07)` — tra sezioni content
2. **Hairline oro:** `linear-gradient(to right, transparent, rgba(197,165,90,0.35), transparent)` — transizione tra blocchi principali
3. **Punto oro centrale:** linea + dot `#c5a55a` 3px al centro — usato sparingly come enfasi

### 3.4 Cursor Custom

- **Default:** dot bianco 8px, `rgba(255,255,255,0.9)`, `border-radius: 50%`
- **Hover su CTA:** ring 32px, `border: 1px solid rgba(197,165,90,0.6)`, fill trasparente
- **Hover su testo:** nessun cambiamento (il cursore default è già sottile)
- **Implementazione:** componente React `<CustomCursor>` montato in `App.tsx`, usa `requestAnimationFrame` per il tracking — no librerie aggiuntive
- **Mobile:** disabilitato completamente (pointer: coarse)

### 3.5 Elementi UI

**CTA Primario** (sfondo bianco, testo nero):
- Padding: `13px 28px`
- Font: Manrope 700, 8–9px, letterspacing 0.2em, uppercase
- Hover: `translateY(-2px)` + `box-shadow: 0 8px 24px rgba(197,165,90,0.15)`
- Mobile: full-width con `justify-content: center`

**CTA Secondario** (ghost, bordo bianco):
- Border: `1px solid rgba(255,255,255,0.22)`
- Hover: border diventa `rgba(197,165,90,0.5)` + colore testo `#c5a55a`

**Grid lines decorative:**
- Linee verticali sottilissime `rgba(255,255,255,0.025)` — `position: absolute`, `left: 24px` e `right: 24px` su mobile, `left: 48px` e `right: 48px` su desktop
- `pointer-events: none`, `z-index: 0`

---

## 4. Sezioni — Specifiche di Redesign

### 4.1 IntroOverlay — WIDE Evoluta

**Cambiamenti:**
- Font WIDE: rimane Outfit 900 ma con `-webkit-text-stroke` invece del fill solido — hollow come il footer, coerenza visiva
- **Kicker "Studio Digitale":** diventa oro `#c5a55a`, letterspacing 0.45em
- **Linea verticale animata:** dopo il completamento dell'animazione lettere, una linea verticale di 1px oro cade dall'ultima lettera verso il basso (GSAP, `scaleY` da 0 a 1, `height: 60px`, `ease: power2.out`)
- **Hint scroll:** testo "Scorri o tocca" rimane, ma il colore passa a `rgba(197,165,90,0.5)`
- **localStorage:** l'overlay viene mostrato solo alla prima visita — `key: 'wide_intro_seen'`; al ritorno l'utente arriva direttamente al contenuto

**Non cambia:** tutta la logica dismiss (wheel/touch/keydown), le animazioni GSAP esistenti, l'accessibilità

### 4.2 SocialProof — Layout Editoriale

**Hero block:**
- Eyebrow "Wide Studio Digitale" → colore `#c5a55a`, letterspacing 0.38em
- Headline → Outfit 800, uppercase, letterspacing −0.03em (invariato nel font, più bold nel peso)
- Body → Manrope 400, `rgba(255,255,255,0.48)` (leggermente più scuro del corrente 0.55)
- CTA → full-width su mobile, auto su desktop
- Grid lines decorative aggiunte

**Caso Studio — video-ready:**
- Desktop: layout 2 colonne — sinistra video/immagine, destra testo + metriche
- Mobile: video sopra (aspect-ratio 16/9, full-width), poi testo, poi metriche
- Il `<img>` attuale (`mustang_mach_1.jpg`) diventa un `<video loop muted playsInline>` quando il video sarà disponibile — il componente viene predisposto con un `mediaSrc` prop che accetta sia URL immagine che video; nel frattempo mostra l'immagine attuale
- Label "Automotive Client — 2025" rimane in oro

**Metriche:**
- Desktop: 3 colonne separate da hairline, numeri in Outfit 800 grande
- Mobile: griglia 2+1 (2 colonne sopra, 1 sotto), stessa logica hairline
- Count-up animation: invariata

### 4.3 ChiSiamo — Editoriale Asimmetrico

> ⚠️ Questa sezione è contrassegnata come **revert-safe**: se il risultato finale non convince, si torna al layout simmetrico attuale senza impatto sulle altre sezioni.

**Partnership CTA block (invariato nel contenuto):**
- Headline → Outfit 800, uppercase
- Body → invariato
- CTA "Verifica disponibilità" → ghost button con hover oro

**Numero decorativo editoriale:**
- "02" in Outfit 900, `rgba(255,255,255,0.025)`, `font-size: clamp(80px, 20vw, 140px)`, posizionato `position: absolute, top-right` nel header — decorativo, `pointer-events: none`

**Layout card founders — Desktop (≥768px):**
- Griglia `grid-template-columns: 1.15fr 0.85fr`
- Card Alessia: colonna sinistra, parte dall'alto — foto più alta (220px)
- Card Asia: colonna destra, `padding-top: 48px` per l'offset verso il basso — foto più bassa (180px)
- Le animazioni GSAP fan/flip si applicano ai nuovi contenitori mantenendo lo stesso ref pattern

**Layout card founders — Mobile (<768px):**
- Stack verticale
- Card Alessia: full-width con foto 200px
- Card Asia: `margin-left: 24px` per suggerire asimmetria anche su mobile
- Entrambe con pull quote sotto

**Pull Quotes:**
- Font: Playfair Display Italic 400
- Dimensione: 14–16px desktop, 13px mobile
- Colore: `rgba(255,255,255,0.75)`
- Padding-left: 16–18px (spazio per la virgoletta)
- `::before`: `content: '\201C'`, colore `#c5a55a`, posizione assoluta top-left
- Sotto ogni quote: linea 20px oro + nome in eyebrow gold

**Testi pull quote:**
- Alessia: *"Traduco la strategia in risultati misurabili."*
- Asia: *"Ogni materiale trasmette l'autorevolezza del tuo brand."*

**Vision block:**
- Invariato nel contenuto
- Layout desktop: `display: grid; grid-template-columns: 1fr auto` — testo a sinistra, CTA a destra su stessa riga

### 4.4 Portfolio — Info-Layer Ridisegnato

**Non cambia:** animazione card-stack GSAP, logica scroll, iframe reels, ProjectModal

**Cambia — overlay info bottom:**
- Eyebrow categoria → oro `#c5a55a`
- Titolo progetto → Outfit 800, letterspacing −0.03em (stesso font, più carattere)
- Tag sotto il titolo → outlined in oro: `border: 1px solid rgba(197,165,90,0.4)`, testo `#c5a55a`, 7px, letterspacing 0.2em
- Numero decorativo progressivo (01/02/03) → Outfit 900, `rgba(255,255,255,0.04)`, top-left
- Indicatore reels → barre verticali proporzionali top-right (barra attiva bianca, altre `rgba(255,255,255,0.25)`)
- CTA "Scopri il progetto" → bianco pieno `background: #fff, color: #000` (era ghost su sfondo chiaro — ora più leggibile)

**Progress dots laterali:** invariati

### 4.5 Footer — Firma Editoriale

**Non cambia:** animazione stroke-draw GSAP lettere WIDE, layout 3 colonne, link legali

**Cambia:**
- Tagline *"Ogni pixel, con intenzione."* → Playfair Display Italic, colore `rgba(197,165,90,0.6)` (unico serif nel footer)
- Linee oro ai lati della tagline: `width: 24px, height: 1px, background: rgba(197,165,90,0.3)`
- Link legali hover → colore sale a `rgba(255,255,255,0.65)` (invariato, ma si aggiunge `border-bottom: 1px solid rgba(197,165,90,0.2)` su hover)
- Copyright → `rgba(255,255,255,0.18)` (leggermente più leggibile)

---

## 5. Micro-Interazioni Premium

### 5.1 Hover States Universali

Tutti gli elementi interattivi devono avere uno stato hover esplicito:

| Elemento | Stato hover |
|----------|-------------|
| CTA primario | `translateY(-2px)` + gold shadow |
| CTA secondario/ghost | border → oro, testo → oro |
| Link footer/legali | colore + underline oro sottile |
| Card portfolio | lieve `scale(1.005)` sull'overlay info |
| Tag progetto | `background: rgba(197,165,90,0.08)` |
| Social boat (Contatti) | invariato — già ottimo |

### 5.2 Text Reveal — ScrollTrigger

Per le headline principali — `<h2>` di SocialProof e `<h3>` "Le menti dietro ogni progetto." di ChiSiamo — l'animazione di reveal passa da `opacity + y` a un reveal **per riga** con `clip-path`:
- Ogni riga di testo viene wrappata in un div con `overflow: hidden`
- Il testo inizia a `translateY(100%)` e sale a `translateY(0)` — "sale dal basso" invece di svanire
- Stagger: 0.08s per riga
- Durata: 0.7s, `ease: power3.out`
- `prefers-reduced-motion`: fallback immediato, nessuna animazione

### 5.3 Custom Cursor

Componente `<CustomCursor />` in `src/components/CustomCursor.tsx`:
- Dot bianco 8px che segue il mouse con `lerp` (lag factor 0.15) tramite `requestAnimationFrame`
- Su hover di `[data-cursor="ring"]` (attributo aggiunto ai CTA): si espande a ring oro 32px con `transition: all 0.25s ease`
- Nascosto su `pointer: coarse` (touch devices)
- Montato in `App.tsx` fuori dal `<main>`

---

## 6. Vincoli Tecnici

- **Nessuna nuova dipendenza npm** eccetto Playfair Display (Google Fonts, no install)
- **Font loading:** Playfair Display caricato in modo asincrono (`rel="preload"`) in `index.html` — non blocca il rendering; subset limitato a `latin` per minimizzare il peso
- **Performance:** le grid lines decorative sono `<div>` statici con `pointer-events: none` — zero overhead
- **GSAP:** nessuna timeline esistente viene modificata; i nuovi ref vengono aggiunti senza conflitti
- **Analytics:** nessun hook di tracciamento viene toccato
- **Routing:** invariato

---

## 7. Ordine di Implementazione

1. **CSS Variables / Token** — aggiornare `index.html` con i nuovi token colore e aggiungere import Playfair Display
2. **CustomCursor** — nuovo componente, montato in App.tsx
3. **IntroOverlay** — localStorage + font WIDE hollow + kicker oro + linea verticale dorata
4. **SocialProof** — eyebrow oro, video-ready media slot, metriche ridisegnate, grid lines
5. **ChiSiamo** — layout asimmetrico, pull quotes, numero decorativo
6. **Portfolio** — info-layer: tag oro, numero decorativo, indicatore reels, CTA bianco pieno
7. **Footer** — tagline Playfair italic oro, linee oro ai lati
8. **Hover states & text reveals** — sweep finale su tutti i componenti

---

## 8. Criteri di Successo

- Su mobile 375px: nessun overflow orizzontale, tutti i touch target ≥ 44px, leggibilità body ≥ 12px
- Su desktop 1280px: layout asimmetrico ChiSiamo visivamente bilanciato, cursor custom fluido a 60fps
- Palette oro: non supera l'8% della superficie visiva in nessuna sezione
- GSAP: nessuna regressione nelle animazioni esistenti (ScrollVideo, Portfolio stack, ChiSiamo fan)
- Lighthouse Performance: score non inferiore al valore pre-restyle (misurato prima dell'implementazione)
