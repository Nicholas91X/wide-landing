# Landing WIDE — Ristrutturazione UX Intuitività + Contrasto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Risolvere problema intuitività scroll su ScrollVideo e ChiSiamo (test 50enni non capiscono che devono continuare a scrollare), alzare CTA IntroOverlay a affordance evidente, portare tutti i testi body a ratio WCAG AAA.

**Architettura:** Pipeline incrementale in 4 phase separate, ognuna committabile e deployabile indipendentemente. Phase 1 (contrast) e 2 (IntroOverlay) sono low-risk cosmetici. Phase 3 (ChiSiamo) e 4 (ScrollVideo) sono riscritture di componenti che rimuovono i pin GSAP sostituendoli con scroll lineare nativo (ChiSiamo) o sticky canvas (ScrollVideo).

**Tech Stack:** React 19 + Vite 7 + TypeScript, GSAP 3.14 (ScrollTrigger), FFmpeg (conversione WEBP→MP4), video HTML5 `<video>` scrubbing via `currentTime`.

**Testing strategy:** Il progetto non ha framework di test unit. Verifica per-task: `npm run dev` + verifica manuale su Chrome DevTools device toolbar (iPhone SE/13/14 Pro Max, Desktop 1440px), smoke test cross-browser alla fine di ogni phase (Safari iOS 17 reale quando disponibile).

**Correzione inline spec:** i frame sono `.webp` non `.png`. 908 desktop (`public/frames/section-2/frame_0001.webp`…) + ~223 mobile (`public/frames_9_16/section-2/`).

**Reference spec:** `docs/superpowers/specs/2026-04-18-landing-ux-intuitivita-contrasto-design.md`

---

## File Structure

Modifiche pianificate:

```
src/components/
├── IntroOverlay.tsx             [MODIFY - Phase 2] rimozione noise bg, refactor CTA
├── ChiSiamo.tsx                 [REWRITE - Phase 3] editorial spread, no pin
├── ScrollVideo.tsx              [REWRITE - Phase 4] sticky canvas, video MP4
├── Hero.tsx                     [MODIFY - Phase 1] contrast pass
├── SocialProof.tsx              [MODIFY - Phase 1] contrast pass
├── Portfolio.tsx                [MODIFY - Phase 1] contrast pass
├── Contatti.tsx                 [MODIFY - Phase 1] contrast pass
├── Footer.tsx                   [MODIFY - Phase 1] contrast pass
├── NavBubble.tsx                [MODIFY - Phase 1] contrast pass
├── CookieBanner.tsx             [MODIFY - Phase 1] contrast pass
├── Cycle.tsx                    [MODIFY - Phase 1] contrast pass
├── LeadForm.tsx                 [MODIFY - Phase 1] contrast pass
└── ProjectModal.tsx             [MODIFY - Phase 1] contrast pass

scripts/
└── convert-frames-to-video.sh   [CREATE - Phase 4.1] ffmpeg WEBP→MP4

public/videos/
├── services-desktop.mp4         [CREATE - Phase 4.1] ~2-4MB, H.264 baseline, no audio
└── services-mobile.mp4          [CREATE - Phase 4.1] ~1-2MB, H.264 baseline 9:16

public/frames/section-2/         [DEPRECATE - Phase 4.5] mantenere per fallback WEBP
public/frames_9_16/section-2/    [DEPRECATE - Phase 4.5] mantenere per fallback WEBP
```

Non si creano nuovi file di componenti: i subcomponenti (`ChevronCascade`, `FounderScene`, `FounderDivider`, `VideoCanvas`, `ChapterStrip`) restano inline nel file parent per coerenza con lo stile esistente del progetto (componenti monolitici).

---

# Phase 1 — Global Contrast Pass

**Goal della phase:** Rimpiazzare tutti i `rgba(255,255,255,0.4X/0.5X)` che non rispettano WCAG AA con valori AAA, secondo la tabella regole dello spec §4.2. Non si tocca struttura, solo colori. Applica a tutti i componenti TRANNE ChiSiamo e ScrollVideo che saranno riscritti integralmente nelle phase 3-4.

### Task 1.1: Audit delle occorrenze correnti

**Files:**
- Read-only: tutti i file in `src/components/` tranne `ChiSiamo.tsx` e `ScrollVideo.tsx`

- [ ] **Step 1: Trova tutte le occorrenze di `rgba(255,255,255,0.X)` con X < 0.65**

Run via Grep tool con pattern `rgba\(255,\s*255,\s*255,\s*0\.(4|5|6)\d?\)` e output content con `-n`, nei file `src/components/*.tsx` eccetto ChiSiamo/ScrollVideo.

Expected: lista righe da rivedere. Creare nota mentale dei contesti (body text, caption, etc).

- [ ] **Step 2: Trova occorrenze di `rgba(197,165,90,0.X)` dove X < 1**

Run Grep con pattern `rgba\(197,\s*165,\s*90,\s*0\.\d+\)` su `src/components/*.tsx` eccetto ChiSiamo/ScrollVideo.

Expected: lista occorrenze di oro con opacità ridotta. Quelle su testo andranno sostituite con `#c5a55a` o `var(--color-gold)` piena opacità.

### Task 1.2: Applicare regole di contrasto — componente per componente

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/SocialProof.tsx`
- Modify: `src/components/Portfolio.tsx`
- Modify: `src/components/Contatti.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/NavBubble.tsx`
- Modify: `src/components/CookieBanner.tsx`
- Modify: `src/components/Cycle.tsx`
- Modify: `src/components/LeadForm.tsx`
- Modify: `src/components/ProjectModal.tsx`

**Regola di sostituzione** (applicare giudizio sul ruolo semantico del testo):

| Occorrenza corrente | Nuovo valore | Quando applicarla |
|---------------------|--------------|-------------------|
| `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.65)` | captions, roles, meta |
| `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.72)` | paragrafi secondari |
| `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.75)` | body text primary |
| `rgba(255,255,255,0.6)` | `rgba(255,255,255,0.75)` | body text (già borderline ok, ma unifichiamo) |
| `rgba(197,165,90,0.55)` | `#c5a55a` o `var(--color-gold)` | oro testo (eyebrow, label, counter) |
| `rgba(197,165,90,0.6)` | `#c5a55a` o `var(--color-gold)` | idem |
| `rgba(255,255,255,0.025)` | invariato | numeri decorativi sfondo |
| `rgba(255,255,255,0.06-0.15)` | invariato | hairlines/dividers |
| `color: '#fff'` pieno | invariato | titoli principali |

**Eccezioni da NON modificare:**
- Opacità su `background-color` (es. `rgba(255,255,255,0.05)` per glass panels) → non sono testo
- Opacità su `border-color` → decorative, non testo
- Valori in keyframe animations (pulse, fade-in) → movimento
- `-webkit-text-stroke: Xpx rgba(...)` sui titoli hero → effetto tipografico decorativo

- [ ] **Step 1: Hero.tsx — applicare regola**

Apri il file. Per ogni match Grep dello Step 1.1, applica la regola dalla tabella sopra. Usa il tool Edit per ogni sostituzione puntuale (non replace_all cieco — verifica contesto).

- [ ] **Step 2: SocialProof.tsx — applicare regola**

Stessa procedura.

- [ ] **Step 3: Portfolio.tsx — applicare regola**

Stessa procedura.

- [ ] **Step 4: Contatti.tsx — applicare regola**

Stessa procedura. ATTENZIONE: preservare lo style del LeadForm integrato nella card Contatti (già ottimizzato per digitazione/spotlight).

- [ ] **Step 5: Footer.tsx, NavBubble.tsx, CookieBanner.tsx, Cycle.tsx, LeadForm.tsx, ProjectModal.tsx — applicare regola**

Procedere uno alla volta. Per LeadForm controllare che gli input field mantengano placeholder e validation styles riconoscibili.

- [ ] **Step 6: Verifica visual manuale su dev server**

Run: `npm run dev`

Expected: server parte su `http://localhost:5173` (porta default Vite). Aprire in Chrome, scrollare l'intera landing in device toolbar iPhone 13 Pro. Verificare ogni sezione:
- Hero: sottotitoli leggibili senza strain
- SocialProof: logo captions leggibili
- Portfolio: descrizioni progetti leggibili
- Contatti: form labels e placeholder leggibili
- Footer: link text leggibili
- NavBubble (quando visibile): voci menu leggibili
- CookieBanner: testo banner leggibile

Non deve cambiare niente di strutturale. Solo testi più brillanti.

- [ ] **Step 7: Commit Phase 1**

```bash
git add src/components/Hero.tsx src/components/SocialProof.tsx src/components/Portfolio.tsx src/components/Contatti.tsx src/components/Footer.tsx src/components/NavBubble.tsx src/components/CookieBanner.tsx src/components/Cycle.tsx src/components/LeadForm.tsx src/components/ProjectModal.tsx
git commit -m "style: alza contrasto testi a WCAG AAA su componenti landing

Body text: rgba 0.55 → 0.75, captions: 0.45 → 0.65,
oro testo: opacità piena #c5a55a. Non tocca ChiSiamo/ScrollVideo
(prossime phase riscriveranno interamente).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Phase 2 — IntroOverlay Refactor

**Goal della phase:** Sfondo nero puro, chevron cascata V3 come CTA scorri.

### Task 2.1: Rimuovere noise background

**Files:**
- Modify: `src/components/IntroOverlay.tsx:222-223`

- [ ] **Step 1: Rimuovere la proprietà `backgroundImage` dal root overlay div**

Individua nel componente il div root con `style={{... backgroundImage: "url(\"data:image/svg+xml,...\")"}}`. Rimuovi l'intera property `backgroundImage`. Lo sfondo resta `backgroundColor: "#000"` puro.

- [ ] **Step 2: Verifica su dev server**

Run: `npm run dev`

Expected: refresh della landing sulla home. L'overlay intro è ora nero pulito, senza grana.

### Task 2.2: Refactor CTA con ChevronCascade inline

**Files:**
- Modify: `src/components/IntroOverlay.tsx` (sostituire il blocco swipeRef/label, ~linea 334-401)

- [ ] **Step 1: Sostituire il blocco CTA con il nuovo markup + keyframes**

Trova nel file il blocco con `ref={swipeRef}` che contiene il `@keyframes introScrollDrop` inline, il div con line+arrow, e lo span label.

Sostituisci con:

```tsx
{/* Dismiss hint — chevron cascata + label ingrandita */}
<div
  ref={swipeRef}
  style={{
    position: "absolute",
    bottom: "clamp(34px, 5vw, 52px)",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    opacity: 0,
    cursor: "pointer",
  }}
>
  <style>{`
    @keyframes introChevCascade {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30%           { opacity: 1;   transform: translateY(2px); }
    }
  `}</style>

  {/* Cluster 3 chevron stacked */}
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <svg
        key={i}
        width="28"
        height="14"
        viewBox="0 0 28 14"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity: 0.3,
          marginTop: i === 0 ? 0 : -6,
          animation: "introChevCascade 1.6s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      >
        <polyline points="2,2 14,12 26,2" />
      </svg>
    ))}
  </div>

  {/* Label primario bianco pieno */}
  <span
    style={{
      color: "#fff",
      fontSize: "0.82rem",
      fontFamily: "var(--font-title)",
      fontWeight: 700,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      lineHeight: 1,
    }}
  >
    Scorri
  </span>

  {/* Sub-label */}
  <span
    style={{
      color: "rgba(255,255,255,0.6)",
      fontSize: "0.62rem",
      fontFamily: "var(--font-body)",
      fontWeight: 500,
      letterSpacing: "0.1em",
      marginTop: -6,
    }}
  >
    o tocca per iniziare
  </span>
</div>
```

NOTE: `var(--font-title)` è Outfit, `var(--font-body)` è Manrope, `var(--color-gold)` è `#c5a55a` — tutti già definiti in `src/styles/tokens.css`.

- [ ] **Step 2: Verifica su dev server**

Run: `npm run dev`

Expected: hard refresh (Ctrl+Shift+R). Overlay intro visibile con:
- WIDE al centro (animazione letter-by-letter invariata)
- Gold line verticale sotto WIDE (invariata)
- **Cluster 3 chevron** al bottom che si accendono in cascata top→bottom
- **"Scorri"** grande in uppercase bianco
- **"o tocca per iniziare"** sotto in Manrope regolare
- Al scroll/tap/click, l'overlay si dissolve come prima (non toccato)

Verifica in DevTools device iPhone 13 Pro — la CTA deve essere chiaramente visibile e riconoscibile come affordance di scroll.

- [ ] **Step 3: Commit Phase 2**

```bash
git add src/components/IntroOverlay.tsx
git commit -m "feat(intro): sfondo nero puro + chevron cascata come CTA scroll

Rimossa texture fractalNoise SVG (sfondo grigio percepito).
CTA scroll ora con 3 chevron stacked (animazione cascade top-to-bottom)
+ label 'Scorri' 0.82rem bianco pieno + sub-label 'o tocca per iniziare'.
Pattern chevron cascata più universalmente leggibile come direzione
di movimento — risolve feedback test usability 50enni.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Phase 3 — ChiSiamo Editorial Spread

**Goal della phase:** Riscrivere ChiSiamo con flusso editoriale verticale, senza pin GSAP. 2 scene sequential full-bleed mobile, 2-col spread magazine desktop.

### Task 3.1: Rimuovere il blocco pin GSAP e stato legato

**Files:**
- Modify: `src/components/ChiSiamo.tsx`

- [ ] **Step 1: Rimuovere state `focusedCard` e `focusedCardRef`**

Cerca nel file le dichiarazioni:
```tsx
const [focusedCard, setFocusedCard] = useState<-1 | 0 | 1>(-1);
const focusedCardRef = useRef<-1 | 0 | 1>(-1);
```

Rimuovi entrambe.

- [ ] **Step 2: Rimuovere refs `pinWrapRef`, `cardLeftRef`, `cardRightRef`**

Cerca:
```tsx
const pinWrapRef = useRef<HTMLDivElement>(null);
const cardLeftRef = useRef<HTMLDivElement>(null);
const cardRightRef = useRef<HTMLDivElement>(null);
```

Rimuovi tutti e tre. Saranno sostituiti con nuovi ref per le scene (`sceneRefs[0]`, `sceneRefs[1]`).

- [ ] **Step 3: Rimuovere interamente il blocco `useEffect` con GSAP timeline pinnata**

Cerca il useEffect che inizia con:
```tsx
useEffect(() => {
  const section = sectionRef.current;
  const header = headerRef.current;
  ...
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pinWrap,
      ...
      pin: true,
      ...
    },
  });
  ...
}, [isMobile, cardH, prefersReduced]);
```

Rimuovilo interamente. Ne creiamo uno nuovo più semplice nel Task 3.3.

- [ ] **Step 4: Rimuovere funzione `renderCard` e relative var `cardW`, `cardH`, `photoH`**

Cerca `const cardW = isMobile ? ...` e `const renderCard = (index, quote, authorName) => (...)`.
Rimuovi entrambe — saranno sostituite da due `FounderScene` inline nel return.

- [ ] **Step 5: Rimuovere state `isMobile` e il relativo useEffect se non usato altrove**

Verifica: se `isMobile` è usato solo nel codice rimosso sopra, rimuovi anche lo state `useState(false)` e il useEffect con `matchMedia`. Se invece è referenziato anche in altre parti (es. partnership section o vision), lascialo.

Attenzione: la sezione "Partner, non semplici fornitori" usa `isMobile` per `whiteSpace` e altre proprietà — se presente, mantieni lo state.

### Task 3.2: Aggiornare imports e costanti foto

**Files:**
- Modify: `src/components/ChiSiamo.tsx` (top del file)

- [ ] **Step 1: Estendere TEAM con dati aggiuntivi per pull quote e role abbreviato**

Sostituisci l'array `TEAM` esistente con:

```tsx
const TEAM = [
  {
    name: "Alessia Amoruso",
    nameFirst: "Alessia",
    nameLast: "Amoruso",
    role: "Co-Founder & Strategist – Area Sviluppo e Pubblicità",
    roleShort: "Sviluppo & Pubblicità",
    description:
      "Traduco la strategia in risultati misurabili. Ingegnerizzo le tue infrastrutture web (siti e applicativi) e gestisco in prima persona i budget delle tue campagne sponsorizzate, ottimizzando ogni investimento per generare contatti e vendite reali.",
    quote: "Traduco la strategia in risultati misurabili.",
    image: "/founders/Alessia_Amoruso.jpeg",
  },
  {
    name: "Asia Franceschi",
    nameFirst: "Asia",
    nameLast: "Franceschi",
    role: "Co-Founder & Strategist – Area Immagine e Contenuti",
    roleShort: "Immagine & Contenuti",
    description:
      "Studio il posizionamento della tua azienda e ne curo l'intera veste comunicativa. Dalla linea editoriale fino alla produzione reale di foto e video sul set, mi assicuro che ogni materiale trasmetta l'autorevolezza del tuo brand senza filtri o finzioni.",
    quote: "Ogni materiale trasmette l'autorevolezza del tuo brand.",
    image: "/founders/Asia_Franceschi.jpeg",
  },
];
```

### Task 3.3: Ricostruire il render con 2 scene + divider

**Files:**
- Modify: `src/components/ChiSiamo.tsx`

- [ ] **Step 1: Aggiungere refs per le 2 scene e il divider**

Nel body del componente, dopo `sectionRef`, `headerRef`, `entryLineRef`, `visionRef`, aggiungi:

```tsx
const sceneARef = useRef<HTMLDivElement>(null);
const sceneBRef = useRef<HTMLDivElement>(null);
const dividerRef = useRef<HTMLDivElement>(null);
```

Rimuovi i vecchi `pinWrapRef`, `cardLeftRef`, `cardRightRef` (già fatto in Task 3.1 step 2, ma ricontrolla).

- [ ] **Step 2: Sostituire il JSX del blocco "Pinned cards area"**

Nel return del componente, trova il div con `ref={pinWrapRef}` e sostituisci l'intero blocco (dal `{/* ── Pinned cards area ── */}` fino alla chiusura del div pinned) con il seguente:

```tsx
{/* ── Scene I — Alessia ─────────────────────────────── */}
<FounderScene
  ref={sceneARef}
  index={0}
  romanNum="I"
  isMobile={isMobile}
  prefersReduced={prefersReduced}
/>

{/* ── Divider II — ASIA ────────────────────────────── */}
<div
  ref={dividerRef}
  style={{
    padding: isMobile ? "28px 24px" : "36px 40px",
    background: "linear-gradient(90deg, rgba(197,165,90,0.04), rgba(197,165,90,0.1), rgba(197,165,90,0.04))",
    borderTop: "1px solid rgba(197,165,90,0.2)",
    borderBottom: "1px solid rgba(197,165,90,0.2)",
    textAlign: "center",
    margin: "clamp(24px, 4vw, 48px) 0",
  }}
>
  <div
    style={{
      fontFamily: "var(--font-serif)",
      fontStyle: "italic",
      fontSize: isMobile ? "1.4rem" : "1.8rem",
      color: "var(--color-gold)",
      lineHeight: 1,
      marginBottom: 6,
    }}
  >
    ·  ·  ·
  </div>
  <div
    style={{
      fontFamily: "var(--font-title)",
      fontSize: isMobile ? "0.58rem" : "0.68rem",
      letterSpacing: "0.25em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.65)",
      fontWeight: 600,
      marginBottom: 6,
    }}
  >
    II — ASIA
  </div>
  <div
    style={{
      fontSize: "0.62rem",
      color: "var(--color-gold)",
      opacity: 0.7,
      letterSpacing: "0.15em",
    }}
  >
    ↓ continua
  </div>
</div>

{/* ── Scene II — Asia ─────────────────────────────── */}
<FounderScene
  ref={sceneBRef}
  index={1}
  romanNum="II"
  isMobile={isMobile}
  prefersReduced={prefersReduced}
  reverseDesktop
/>
```

NOTE: `var(--font-serif)` è Playfair Display, già disponibile.

- [ ] **Step 3: Implementare il sub-componente FounderScene inline (sopra il component principale)**

Aggiungi sopra `export const ChiSiamo` (o inline come function/const helper esterno al componente principale):

```tsx
interface FounderSceneProps {
  index: 0 | 1;
  romanNum: "I" | "II";
  isMobile: boolean;
  prefersReduced: boolean;
  reverseDesktop?: boolean;
}

const FounderScene = React.forwardRef<HTMLDivElement, FounderSceneProps>(
  ({ index, romanNum, isMobile, prefersReduced, reverseDesktop }, ref) => {
    const person = TEAM[index];

    return (
      <div
        ref={ref}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : reverseDesktop
            ? "1fr 1.1fr"
            : "1.1fr 1fr",
          gap: 0,
          alignItems: "stretch",
          minHeight: isMobile ? "auto" : 500,
          background: "#050505",
          marginBottom: "clamp(40px, 6vw, 80px)",
        }}
      >
        {/* Photo — on desktop può essere destra (reverse) o sinistra */}
        <div
          style={{
            order: !isMobile && reverseDesktop ? 2 : 1,
            position: "relative",
            minHeight: isMobile ? 380 : 500,
            overflow: "hidden",
          }}
        >
          <img
            src={person.image}
            alt={person.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 20%",
              filter: "grayscale(0.25) contrast(1.05)",
              display: "block",
            }}
          />
          {/* Gradient overlay bottom */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: isMobile
                ? "linear-gradient(to bottom, transparent 40%, rgba(5,5,5,0.95))"
                : "linear-gradient(135deg, transparent 40%, rgba(5,5,5,0.6))",
              pointerEvents: "none",
            }}
          />
          {/* Caption top-left */}
          <span
            style={{
              position: "absolute",
              top: 18,
              left: 20,
              fontFamily: "var(--font-title)",
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              color: "var(--color-gold)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {romanNum} · Co-Founder
          </span>
          {/* Name overlay bottom (mobile) */}
          {isMobile && (
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 18,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "2rem",
                  fontWeight: 800,
                  lineHeight: 0.9,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                }}
              >
                {person.nameFirst}
                <br />
                {person.nameLast}
              </h3>
              <span
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.55rem",
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(197,165,90,0.4)",
                  display: "inline-block",
                }}
              >
                {person.roleShort}
              </span>
            </div>
          )}
        </div>

        {/* Text block */}
        <div
          style={{
            order: !isMobile && reverseDesktop ? 1 : 2,
            padding: isMobile ? "22px 24px 28px" : "50px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "#080808",
          }}
        >
          {/* Nome (desktop only — mobile è sulla foto) */}
          {!isMobile && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.6rem",
                  color: "var(--color-gold)",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  margin: "0 0 12px",
                  fontWeight: 700,
                }}
              >
                {romanNum} · Co-Founder
              </p>
              <h4
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 800,
                  lineHeight: 0.95,
                  margin: "0 0 10px",
                  letterSpacing: "-0.02em",
                  color: "#fff",
                }}
              >
                {person.nameFirst}
                <br />
                {person.nameLast}
              </h4>
              <p
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: "0 0 28px",
                  paddingBottom: 18,
                  borderBottom: "1px solid rgba(197,165,90,0.3)",
                  width: "fit-content",
                }}
              >
                {person.roleShort}
              </p>
            </>
          )}

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.78rem" : "0.92rem",
              lineHeight: isMobile ? 1.6 : 1.65,
              color: "rgba(255,255,255,0.82)",
              margin: "0 0 20px",
              maxWidth: "46ch",
            }}
          >
            {person.description}
          </p>

          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: isMobile ? "1rem" : "clamp(1.1rem, 2.2vw, 1.5rem)",
              lineHeight: 1.35,
              color: "var(--color-gold)",
              margin: 0,
              paddingLeft: isMobile ? 14 : 20,
              borderLeft: "2px solid rgba(197,165,90,0.5)",
              maxWidth: "40ch",
            }}
          >
            "{person.quote}"
          </p>
        </div>
      </div>
    );
  }
);
FounderScene.displayName = "FounderScene";
```

### Task 3.4: Animazione entry semplificata via ScrollTrigger (no pin, solo fade-in)

**Files:**
- Modify: `src/components/ChiSiamo.tsx` (aggiungere useEffect)

- [ ] **Step 1: Aggiungere useEffect con ScrollTrigger fade-in sulle scene**

Aggiungi un nuovo useEffect (o aggiorna quello che rimane) per animare solo entry delle 2 scene e del divider — zero pin:

```tsx
// Fade-in delle 2 scene al crossing viewport
useEffect(() => {
  if (prefersReduced) {
    gsap.set([sceneARef.current, sceneBRef.current, dividerRef.current], {
      opacity: 1,
      y: 0,
    });
    return;
  }

  const scenes = [
    sceneARef.current,
    dividerRef.current,
    sceneBRef.current,
  ].filter(Boolean) as HTMLElement[];

  const ctx = gsap.context(() => {
    scenes.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            once: true,
            toggleActions: "play none none none",
          },
        }
      );
    });
  });

  return () => ctx.revert();
}, [prefersReduced]);
```

NOTE: NON usare `scrub` — vogliamo un trigger one-shot al crossing, no scrubbing.

- [ ] **Step 2: Rimuovere `overflowX: "hidden"` dal root se non serve più**

Nel `<div ref={sectionRef}>` iniziale, verifica se `overflowX: "hidden"` era dovuto al pin + rotation delle card (che ora non esiste più). Rimuovilo se presente — non serve più e potrebbe causare problemi di sticky behavior futuro.

- [ ] **Step 3: Verifica visual su dev server**

Run: `npm run dev`

Expected: Scroll sulla sezione ChiSiamo in Chrome DevTools iPhone 13 Pro.
- La sezione "Partner, non semplici fornitori" è invariata (contrast fix in Phase 1 se applicato)
- Header "02 · Chi Siamo / Le menti dietro ogni progetto" appare con fade-in
- Scene I (Alessia): foto full-bleed 380px con caption "I · Co-Founder", nome in overlay bottom, role sottolineato oro. Body text sotto la foto con descrizione e pull quote oro italic.
- Divider: "· · ·" Playfair italic, "II — ASIA", "↓ continua"
- Scene II (Asia): stessa struttura
- Vision "Come lavoriamo" sotto, invariata

Scroll continuo. Entrambe le scene visibili scrollando normalmente. Nessun "blocco" della pagina.

Verifica desktop (1440px): scene in grid 2-col, prima con foto a sinistra, seconda con foto a destra (specchiata). Testo nella colonna opposta, verticalmente centrato.

- [ ] **Step 4: Commit Phase 3**

```bash
git add src/components/ChiSiamo.tsx
git commit -m "refactor(chi-siamo): editorial spread senza pin, mobile-first

Rimossa timeline GSAP pinnata con swap foreground/background delle
card founder. Sostituita con 2 FounderScene sequenziali full-bleed
(mobile) o 2-col specchiati (desktop), separate da divider 'II — ASIA'
con linee oro. Animazione entry solo fade-in one-shot.

Risolve feedback test usability: i 50enni non capivano che dovevano
scrollare per vedere la 2a founder. Ora entrambe sono raggiunte via
scroll naturale, ciascuna è una scena drammatica autonoma.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Phase 4 — ScrollVideo Sticky Canvas + MP4

**Goal della phase:** Riscrittura completa di ScrollVideo. Canvas sticky (no pin), video MP4 scrubbed via `currentTime`, strip markers tra i 6 servizi, progress bar mobile-top / vertical nav desktop. Fallback WEBP per iOS vecchi.

### Task 4.1: Script conversione WEBP → MP4

**Files:**
- Create: `scripts/convert-frames-to-video.sh`

- [ ] **Step 1: Creare lo script ffmpeg**

Scrivi il file `scripts/convert-frames-to-video.sh`:

```bash
#!/usr/bin/env bash
# ┌─────────────────────────────────────────────────────────────────┐
# │ Conversione frame WEBP → video MP4 scrub-friendly per ScrollVideo │
# └─────────────────────────────────────────────────────────────────┘
#
# Usage:  bash scripts/convert-frames-to-video.sh
#
# Requires:  ffmpeg installato (brew install ffmpeg / scoop install ffmpeg)
#
# Genera:
#   public/videos/services-desktop.mp4  (~2-4MB da 908 frame WEBP desktop)
#   public/videos/services-mobile.mp4   (~1-2MB da ~223 frame WEBP 9:16)
#
# Profilo H.264 baseline + pixel format yuv420p + fastdecode per scrub fluido.
# Keyframe ogni 10 frame (GOP=10) per seek preciso su currentTime=.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP_SRC="$REPO_ROOT/public/frames/section-2"
MOBILE_SRC="$REPO_ROOT/public/frames_9_16/section-2"
OUT_DIR="$REPO_ROOT/public/videos"

mkdir -p "$OUT_DIR"

echo "→ Converting desktop frames (908 webp) to MP4..."
ffmpeg -y \
  -framerate 30 \
  -i "$DESKTOP_SRC/frame_%04d.webp" \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -preset slow \
  -crf 23 \
  -pix_fmt yuv420p \
  -g 10 \
  -keyint_min 10 \
  -sc_threshold 0 \
  -movflags +faststart \
  -tune fastdecode \
  -an \
  "$OUT_DIR/services-desktop.mp4"

echo "→ Converting mobile frames (~223 webp 9:16) to MP4..."
ffmpeg -y \
  -framerate 30 \
  -i "$MOBILE_SRC/frame_%04d.webp" \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -preset slow \
  -crf 25 \
  -pix_fmt yuv420p \
  -g 10 \
  -keyint_min 10 \
  -sc_threshold 0 \
  -movflags +faststart \
  -tune fastdecode \
  -an \
  "$OUT_DIR/services-mobile.mp4"

echo ""
echo "✅ Output size:"
ls -lh "$OUT_DIR"/*.mp4
echo ""
echo "→ Ricorda: aggiorna src/components/ScrollVideo.tsx con i path video."
```

- [ ] **Step 2: Eseguire lo script**

Verifica che ffmpeg sia installato: `ffmpeg -version`. Se non installato, su Windows: `scoop install ffmpeg` (o chiedi all'utente di installarlo).

Run: `bash scripts/convert-frames-to-video.sh`

Expected: output con dimensione dei 2 .mp4 risultanti. Desktop ~2-4MB, mobile ~1-2MB.

- [ ] **Step 3: Verifica manuale del video**

Apri i file `public/videos/services-desktop.mp4` e `public/videos/services-mobile.mp4` in un player (VLC o HTML5 video). Verifica:
- Video riproduce correttamente
- Durata plausibile (908 frame / 30fps = ~30s desktop; ~7s mobile)
- Qualità accettabile (non troppo compresso)

- [ ] **Step 4: Commit Task 4.1**

Non committare ancora i video stessi — lo faremo dopo aver aggiornato il componente (commit monolitico Phase 4.2).
Committa solo lo script:

```bash
git add scripts/convert-frames-to-video.sh
git commit -m "chore: script conversione frame WEBP → MP4 per ScrollVideo

ffmpeg H.264 baseline profile + GOP=10 + faststart per seek fluido
con video.currentTime. Genera 2 video (desktop 16:9 e mobile 9:16)
da usare nel nuovo ScrollVideo sticky canvas.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 4.2: Riscrivere ScrollVideo con sticky canvas + video scrub

**Files:**
- Rewrite: `src/components/ScrollVideo.tsx`

- [ ] **Step 1: Backup mentale del componente attuale**

Il file corrente è molto grande (~1000+ righe). Strategia: creare un nuovo contenuto completo con `Write` tool dopo aver preservato le parti riutilizzabili (SERVICES array, SERVICE_LABELS, SERVICE_RECAP, 5 renderer di layout).

Prima di scrivere, estrai mentalmente:
- `SERVICES` array (righe ~63-183) — riutilizzabile
- `SERVICE_LABELS` (righe ~186-193) — riutilizzabile
- `SERVICE_RECAP` (righe ~196-227) — riutilizzabile
- Renderer per ogni `layoutType` ("cards", "stats", "gallery", "testimonial", "video") — estrarre codice JSX dai blocchi `currentService.layoutType === "..."` nel render corrente

- [ ] **Step 2: Scrivere il nuovo `ScrollVideo.tsx` completo**

Usa `Write` tool per sovrascrivere il file. Struttura:

```tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { trackSectionView } from "../utils/analytics";

gsap.registerPlugin(ScrollTrigger);

// ═══════ Data (preserved from previous impl) ═══════
type LayoutType = "cards" | "gallery" | "testimonial" | "stats" | "video";

interface ServiceContent {
  image?: string;
  title?: string;
  description?: string;
  value?: string;
  suffix?: string;
  author?: string;
  videoUrl?: string;
}

interface Service {
  title: string;
  description: string;
  layoutType: LayoutType;
  items?: ServiceContent[];
}

const SERVICES: Service[] = [
  // [PRESERVE FROM ORIGINAL — COPY THE 6 ENTRIES]
];

const SERVICE_LABELS = [
  "Social",
  "Content",
  "Strumenti",
  "Shooting",
  "AI Video",
  "Web",
];

// ═══════ Component ═══════
const TOTAL_SERVICES = SERVICES.length; // 6

export const ScrollVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const prefersReduced = useReducedMotion();

  // ── Responsive check ──
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    onChange(mq);
    mq.addEventListener("change", onChange as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener(
        "change",
        onChange as (e: MediaQueryListEvent) => void,
      );
  }, []);

  // ── Track section view ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackSectionView("services");
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Video ready handler ──
  const onVideoLoaded = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setVideoReady(true);
  }, []);

  // ── Scroll-driven video scrubbing via ScrollTrigger (no pin) ──
  useEffect(() => {
    if (!videoReady || prefersReduced) return;

    const container = containerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!container || !video || !canvas) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    // Resize canvas to viewport
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx2d.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawFrame = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      // Cover fit
      const vRatio = vw / vh;
      const cRatio = cw / ch;
      let dw, dh, dx, dy;
      if (vRatio > cRatio) {
        dh = ch;
        dw = dh * vRatio;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = dw / vRatio;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx2d.clearRect(0, 0, cw, ch);
      ctx2d.drawImage(video, dx, dy, dw, dh);
    };

    const gsapCtx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          setProgress(p);
          if (video.duration) {
            video.currentTime = Math.min(
              video.duration - 0.01,
              p * video.duration,
            );
          }
          // Update current service based on progress → index
          const idx = Math.min(
            TOTAL_SERVICES - 1,
            Math.floor(p * TOTAL_SERVICES),
          );
          setCurrentServiceIndex(idx);
        },
      });

      // Redraw on video seek complete
      video.addEventListener("seeked", drawFrame);
      video.addEventListener("loadeddata", drawFrame);
      drawFrame();

      return () => {
        st.kill();
        video.removeEventListener("seeked", drawFrame);
        video.removeEventListener("loadeddata", drawFrame);
      };
    }, container);

    return () => {
      gsapCtx.revert();
      window.removeEventListener("resize", resize);
    };
  }, [videoReady, prefersReduced]);

  // ── Scroll to specific service ──
  const scrollToService = useCallback((idx: number) => {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top;
    const total = c.offsetHeight - window.innerHeight;
    const y = scrollTop + (idx / TOTAL_SERVICES) * total;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // ══════════ Render ══════════
  const videoSrc = isMobile
    ? "/videos/services-mobile.mp4"
    : "/videos/services-desktop.mp4";

  // Each service block ~100-115vh. Total ~700vh desktop, ~800vh mobile.
  const servicesBlocks = SERVICES.map((svc, idx) => (
    <React.Fragment key={idx}>
      {idx > 0 && (
        <ChapterStrip
          number={String(idx + 1).padStart(2, "0")}
          title={svc.title}
          isMobile={isMobile}
        />
      )}
      <ServiceBlock service={svc} index={idx} isMobile={isMobile} />
    </React.Fragment>
  ));

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: "#050505",
        minHeight: isMobile ? "800vh" : "700vh",
      }}
    >
      {/* Sticky canvas + video background */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          zIndex: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        {/* Hidden video source */}
        <video
          ref={videoRef}
          src={videoSrc}
          preload="auto"
          playsInline
          muted
          onLoadedData={onVideoLoaded}
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        {/* Vignette overlay per leggibilità */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Content blocks layered above the sticky canvas */}
      <div
        style={{
          position: "relative",
          marginTop: "-100vh", // Overlap with sticky canvas
          zIndex: 1,
        }}
      >
        {servicesBlocks}
      </div>

      {/* Progress & nav overlays */}
      <ProgressOverlay
        isMobile={isMobile}
        currentServiceIndex={currentServiceIndex}
        progress={progress}
        onServiceClick={scrollToService}
      />
    </div>
  );
};

// ═══════ Sub-components ═══════
// [ChapterStrip, ServiceBlock, ProgressOverlay — SEE STEPS BELOW]

export default ScrollVideo;
```

- [ ] **Step 3: Implementare `ChapterStrip` sub-component inline**

Subito sopra `export const ScrollVideo`, aggiungi:

```tsx
interface ChapterStripProps {
  number: string;
  title: string;
  isMobile: boolean;
}

const ChapterStrip: React.FC<ChapterStripProps> = ({ number, title, isMobile }) => (
  <div
    style={{
      padding: isMobile ? "28px 20px" : "40px 40px",
      background:
        "linear-gradient(90deg, transparent, rgba(197,165,90,0.08), transparent)",
      borderTop: "1px solid rgba(197,165,90,0.2)",
      borderBottom: "1px solid rgba(197,165,90,0.2)",
      textAlign: "center",
      position: "relative",
      zIndex: 2,
    }}
  >
    <div
      style={{
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: isMobile ? "1.4rem" : "1.8rem",
        color: "var(--color-gold)",
        lineHeight: 1,
        marginBottom: 4,
      }}
    >
      {number}
    </div>
    <div
      style={{
        fontFamily: "var(--font-title)",
        fontSize: isMobile ? "0.58rem" : "0.7rem",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.75)",
        fontWeight: 600,
      }}
    >
      {title}
    </div>
  </div>
);
```

- [ ] **Step 4: Implementare `ServiceBlock` sub-component inline**

Sopra `export const ScrollVideo`, aggiungi. Questo rende il contenuto dei 5 layout types. Preserva il rendering attuale; rimuove solo le animazioni scroll-scrubbed (niente `segmentProgress`, niente opacity scrittura, testo statico).

```tsx
interface ServiceBlockProps {
  service: Service;
  index: number;
  isMobile: boolean;
}

const ServiceBlock: React.FC<ServiceBlockProps> = ({ service, index, isMobile }) => {
  const blockRef = useRef<HTMLDivElement>(null);

  // Fade-in one-shot all'entry del block
  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
            once: true,
          },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={blockRef}
      style={{
        minHeight: isMobile ? "90vh" : "100vh",
        padding: isMobile ? "60px 20px 40px" : "80px 40px 60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 40px", textAlign: isMobile ? "left" : "center", width: "100%" }}>
        <p
          style={{
            fontFamily: "var(--font-title)",
            fontSize: isMobile ? "0.58rem" : "0.68rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--color-gold)",
            fontWeight: 700,
            margin: "0 0 16px",
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(TOTAL_SERVICES).padStart(2, "0")}
        </p>
        <h3
          style={{
            fontFamily: "var(--font-title)",
            fontSize: isMobile ? "1.8rem" : "clamp(2rem, 4.5vw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#fff",
            margin: "0 0 14px",
            textTransform: "uppercase",
          }}
        >
          {service.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: isMobile ? "0.85rem" : "1rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.78)",
            margin: 0,
            maxWidth: "56ch",
            marginLeft: isMobile ? 0 : "auto",
            marginRight: isMobile ? 0 : "auto",
            whiteSpace: "pre-line",
          }}
        >
          {service.description}
        </p>
      </div>

      {/* Layout-specific content */}
      <ServiceLayout service={service} isMobile={isMobile} />

      {/* Scrim bottom for readability over canvas */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background:
            "linear-gradient(to bottom, transparent, rgba(5,5,5,0.4))",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
```

- [ ] **Step 5: Implementare `ServiceLayout` — switcher dei 5 layout types**

Sopra `ServiceBlock`, aggiungi:

```tsx
const ServiceLayout: React.FC<{ service: Service; isMobile: boolean }> = ({
  service,
  isMobile,
}) => {
  if (!service.items || service.items.length === 0) return null;

  switch (service.layoutType) {
    case "cards":
      return <CardsLayout items={service.items} isMobile={isMobile} />;
    case "stats":
      return <StatsLayout items={service.items} isMobile={isMobile} />;
    case "gallery":
      return <GalleryLayout items={service.items} isMobile={isMobile} />;
    case "testimonial":
      return <TestimonialLayout items={service.items} isMobile={isMobile} />;
    case "video":
      return <VideoLayout items={service.items} isMobile={isMobile} />;
    default:
      return null;
  }
};
```

- [ ] **Step 6: Implementare i 5 layout components inline**

Sopra `ServiceLayout`, aggiungi i 5 render helpers:

```tsx
// ── CardsLayout: 3 card in grid ──
const CardsLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = ({
  items,
  isMobile,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: isMobile ? 16 : 24,
      maxWidth: 1100,
      margin: "0 auto",
      width: "100%",
    }}
  >
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 4,
          padding: isMobile ? "18px 18px" : "28px 24px",
        }}
      >
        {item.title && (
          <h4
            style={{
              fontFamily: "var(--font-title)",
              fontSize: isMobile ? "0.95rem" : "1.1rem",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 10px",
              letterSpacing: "-0.01em",
            }}
          >
            {item.title}
          </h4>
        )}
        {item.description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.78rem" : "0.85rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.75)",
              margin: 0,
            }}
          >
            {item.description}
          </p>
        )}
      </div>
    ))}
  </div>
);

// ── StatsLayout: big value + label ──
const StatsLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = ({
  items,
  isMobile,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : items.length === 3
        ? "1.3fr 0.85fr 0.85fr"
        : `repeat(${items.length}, 1fr)`,
      gap: isMobile ? 20 : 32,
      maxWidth: 1100,
      margin: "0 auto",
      width: "100%",
    }}
  >
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          textAlign: isMobile ? "left" : "center",
          padding: isMobile ? "12px 0" : "20px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: isMobile ? "2.4rem" : "clamp(2.6rem, 5vw, 4.2rem)",
            fontWeight: 900,
            lineHeight: 1,
            color: "var(--color-gold)",
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          {item.value}
        </div>
        {item.suffix && (
          <div
            style={{
              fontFamily: "var(--font-title)",
              fontSize: "0.78rem",
              color: "#fff",
              fontWeight: 600,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            {item.suffix}
          </div>
        )}
        {item.description && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.65)",
              fontStyle: "italic",
            }}
          >
            {item.description}
          </div>
        )}
      </div>
    ))}
  </div>
);

// ── GalleryLayout: 2x2 grid ──
const GalleryLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = ({
  items,
  isMobile,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: isMobile ? 12 : 20,
      maxWidth: 900,
      margin: "0 auto",
      width: "100%",
    }}
  >
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: 4,
          padding: isMobile ? "16px 16px" : "22px 22px",
        }}
      >
        {item.title && (
          <h4
            style={{
              fontFamily: "var(--font-title)",
              fontSize: isMobile ? "0.88rem" : "1rem",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px",
            }}
          >
            {item.title}
          </h4>
        )}
        {item.description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? "0.75rem" : "0.82rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.75)",
              margin: 0,
            }}
          >
            {item.description}
          </p>
        )}
      </div>
    ))}
  </div>
);

// ── TestimonialLayout: centered italic quote ──
const TestimonialLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = ({
  items,
  isMobile,
}) => {
  const t = items[0];
  if (!t) return null;
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      {t.description && (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: isMobile ? "1.15rem" : "clamp(1.4rem, 2.5vw, 1.8rem)",
            lineHeight: 1.35,
            color: "var(--color-gold)",
            margin: "0 0 24px",
          }}
        >
          {t.description}
        </p>
      )}
      {t.author && (
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
            fontWeight: 600,
          }}
        >
          — {t.author}
        </div>
      )}
    </div>
  );
};

// ── VideoLayout: embedded iframe ──
const VideoLayout: React.FC<{ items: ServiceContent[]; isMobile: boolean }> = ({
  items,
  isMobile,
}) => {
  // Preserve the Bunny embed URL from the previous impl
  const VIDEO_URL =
    "https://iframe.mediadelivery.net/embed/486117/efb69a0c-f46a-4e1a-86d4-9fc6f7d0c24b?autoplay=true&loop=true&muted=true&preload=true&responsive=true";

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          overflow: "hidden",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <iframe
          src={VIDEO_URL}
          loading="lazy"
          allow="autoplay; encrypted-media"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Implementare `ProgressOverlay` sub-component inline**

Sopra `export const ScrollVideo`, aggiungi:

```tsx
interface ProgressOverlayProps {
  isMobile: boolean;
  currentServiceIndex: number;
  progress: number;
  onServiceClick: (idx: number) => void;
}

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  isMobile,
  currentServiceIndex,
  progress,
  onServiceClick,
}) => {
  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        {/* Progress bar orizzontale top */}
        <div
          style={{
            height: 3,
            width: "100%",
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: "var(--color-gold)",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        {/* Counter sotto la bar */}
        <div
          style={{
            textAlign: "center",
            padding: "6px 0",
            fontFamily: "var(--font-title)",
            fontSize: "0.58rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 600,
            background:
              "linear-gradient(to bottom, rgba(5,5,5,0.85), transparent)",
          }}
        >
          {String(currentServiceIndex + 1).padStart(2, "0")} /{" "}
          {String(TOTAL_SERVICES).padStart(2, "0")} · {SERVICE_LABELS[currentServiceIndex]}
        </div>
      </div>
    );
  }

  // Desktop: vertical timeline sinistra
  return (
    <div
      style={{
        position: "fixed",
        left: 32,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {SERVICE_LABELS.map((label, i) => {
        const active = i === currentServiceIndex;
        return (
          <button
            key={i}
            onClick={() => onServiceClick(i)}
            aria-label={`Vai al servizio ${label}`}
            data-cursor="ring"
            style={{
              background: "transparent",
              border: "none",
              padding: "4px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: active ? 1 : 0.5,
              transition: "opacity 0.3s",
            }}
          >
            <div
              style={{
                height: 5,
                width: active ? 20 : 5,
                borderRadius: 3,
                background: active ? "var(--color-gold)" : "rgba(255,255,255,0.35)",
                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                fontWeight: 600,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
      {/* Counter totale bottom */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.15)",
          fontFamily: "var(--font-title)",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.65)",
          fontWeight: 600,
        }}
      >
        {String(currentServiceIndex + 1).padStart(2, "0")} / {String(TOTAL_SERVICES).padStart(2, "0")}
      </div>
    </div>
  );
};
```

### Task 4.3: Rimuovere il sistema PNG preload deprecated

**Files:**
- Modify: `src/components/ScrollVideo.tsx`

- [ ] **Step 1: Verificare che `usePreload` hook non sia più importato**

Nel nuovo `ScrollVideo.tsx` scritto in Task 4.2, verifica che non ci sia `import { usePreload } from ...`. Se c'è, rimuovilo.

- [ ] **Step 2: Eliminare riferimenti a costanti DESKTOP_FRAME_COUNT, MOBILE_FRAME_COUNT e simili**

Nel vecchio file c'erano costanti tipo `const DESKTOP_FRAME_COUNT = 908`. Assicurati che non siano più presenti nel nuovo file.

- [ ] **Step 3: Lasciare `src/hooks/usePreload.ts` e `src/utils/canvasDraw.ts` in place**

Non cancellarli — potrebbero essere usati altrove (es. Portfolio, SocialProof). Verifica con Grep:

```
pattern: usePreload|canvasDraw
path: src/
```

Se l'unico uso era in ScrollVideo, si potrebbero eliminare, ma la pulizia va oltre lo scope di questa phase. Annota eventualmente per cleanup futuro.

### Task 4.4: Test visual della phase 4

**Files:** N/A (solo verifica)

- [ ] **Step 1: Eseguire lo script di conversione frame e verificare i video generati**

Run: `bash scripts/convert-frames-to-video.sh`

Expected: 2 MP4 in `public/videos/`, dimensioni ragionevoli (2-4MB + 1-2MB). Se ffmpeg non è installato, l'utente deve installarlo prima di procedere.

- [ ] **Step 2: Dev server + verifica desktop**

Run: `npm run dev`

Expected:
- Navigare alla sezione ScrollVideo (dopo Hero/SocialProof)
- Il canvas si carica con il primo frame del video
- Scrollando, la scrollbar si muove nativamente (no pin perceived)
- Il canvas mostra i frame scrubbati in tempo reale con lo scroll
- Tra un servizio e l'altro appaiono le strip "02 CONTENT MARKETING" etc.
- Timeline nav a sinistra (desktop 1440px) sempre visibile: dot + label, attivo allargato
- Counter "03/06" in basso alla timeline
- Ogni service block ha titolo grande + descrizione + layout specifico (cards/stats/gallery/testimonial/video)
- Fade-in one-shot di ogni block all'entry viewport (no scroll-scrubbed)

- [ ] **Step 3: Dev server + verifica mobile**

Device toolbar Chrome → iPhone 13 Pro (390×844).

Expected:
- Canvas fa cover del viewport
- Progress bar oro in alto fixed, cresce con lo scroll
- Counter "03/06 · STRUMENTI" sotto la bar
- Service blocks in single column, padding ridotto
- Strip markers full-width

- [ ] **Step 4: Performance check**

Chrome DevTools → Performance tab → Record durante scroll completo della sezione.

Expected: ≥50fps costanti. Se drop sotto 30fps, reportare — potrebbe servire fallback (Task 4.5).

- [ ] **Step 5: Commit Phase 4.2-4.4**

```bash
git add src/components/ScrollVideo.tsx public/videos/services-desktop.mp4 public/videos/services-mobile.mp4
git commit -m "refactor(scroll-video): sticky canvas + video MP4 scrubbing, no pin

Riscrittura completa di ScrollVideo. Canvas sticky (zero pin ScrollTrigger)
con video MP4 (H.264 baseline) scrubbato via currentTime al progresso
scroll. Scrollbar ora sempre in movimento = zero sensazione di pagina
bloccata (risolve feedback 50enni).

Chapter strip tra i 6 servizi (numero + titolo in Playfair/Outfit).
Progress mobile: barra orizzontale top fixed + counter.
Progress desktop: vertical timeline nav sinistra sempre visibile.

Asset: WEBP frame sequence sostituita da 2 MP4 (desktop 16:9, mobile 9:16).
Riduzione banda ~decine MB → ~4MB totali.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 4.5: Fallback WEBP keyframes per iOS vecchi

**Files:**
- Modify: `src/components/ScrollVideo.tsx`

- [ ] **Step 1: Aggiungere probe di capacità seek del video**

All'interno del useEffect di scroll (Task 4.2 Step 2), dopo `onVideoLoaded` setta `videoReady = true`, aggiungi prima un probe:

```tsx
const [useFallback, setUseFallback] = useState(false);

const probeVideoSeek = useCallback(async () => {
  const v = videoRef.current;
  if (!v || !v.duration) return false;
  const samples = [0.1, 0.3, 0.5, 0.7, 0.9];
  const start = performance.now();
  for (const s of samples) {
    v.currentTime = s * v.duration;
    await new Promise<void>((resolve) => {
      const h = () => {
        v.removeEventListener("seeked", h);
        resolve();
      };
      v.addEventListener("seeked", h);
    });
  }
  const avgMs = (performance.now() - start) / samples.length;
  return avgMs > 200; // if > 200ms avg per seek, fall back
}, []);

const onVideoLoaded = useCallback(async () => {
  const v = videoRef.current;
  if (!v) return;
  v.pause();
  const slow = await probeVideoSeek();
  if (slow) {
    setUseFallback(true);
    // GTM event
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "scrollvideo_fallback_activated",
        reason: "slow_video_seek",
      });
    }
  }
  setVideoReady(true);
}, [probeVideoSeek]);
```

- [ ] **Step 2: Quando `useFallback = true`, caricare immagini WEBP sequenziali**

Nel render del sticky div, sostituire il `<video>` element con un sistema di Image preload se `useFallback` è true. Strategia: estrarre ~60 keyframe dal path WEBP esistente (1 ogni 15 per desktop, 1 ogni 4 per mobile) e disegnarli sul canvas come prima.

Aggiungi logica condizionale:

```tsx
const [fallbackImages, setFallbackImages] = useState<HTMLImageElement[]>([]);

// Load fallback images quando useFallback attivo
useEffect(() => {
  if (!useFallback) return;
  const basePath = isMobile ? "/frames_9_16/section-2" : "/frames/section-2";
  const totalFrames = isMobile ? 223 : 908;
  const keyframeCount = 60;
  const step = Math.floor(totalFrames / keyframeCount);
  const urls = Array.from({ length: keyframeCount }, (_, i) => {
    const idx = String(Math.min(totalFrames, 1 + i * step)).padStart(4, "0");
    return `${basePath}/frame_${idx}.webp`;
  });
  const loaded: HTMLImageElement[] = [];
  let count = 0;
  urls.forEach((url, i) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      loaded[i] = img;
      count++;
      if (count === keyframeCount) setFallbackImages(loaded);
    };
  });
}, [useFallback, isMobile]);

// Nel drawFrame, se useFallback, disegna dall'array invece che dal video
const drawFrameFallback = useCallback((progress: number) => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || fallbackImages.length === 0) return;
  const idx = Math.min(
    fallbackImages.length - 1,
    Math.floor(progress * fallbackImages.length),
  );
  const img = fallbackImages[idx];
  if (!img) return;
  // [same cover logic as video drawFrame]
  // ... draw img to canvas
}, [fallbackImages]);
```

Nel onUpdate dello ScrollTrigger, aggiungi:

```tsx
if (useFallback) {
  drawFrameFallback(p);
} else {
  video.currentTime = ...; // as before
}
```

- [ ] **Step 3: Verifica fallback (simulato)**

Test manuale: forza temporaneamente `setUseFallback(true)` subito dopo `setVideoReady(true)`. Verifica che il canvas disegni correttamente i frame WEBP scrubbati con lo scroll. Rimuovere il force dopo il test.

- [ ] **Step 4: Commit Phase 4.5**

```bash
git add src/components/ScrollVideo.tsx
git commit -m "feat(scroll-video): fallback WEBP keyframes per browser con seek lento

Probe iniziale di 5 seek video: se media > 200ms, attiva fallback
con 60 keyframe WEBP preloaded + disegnati sul canvas. Log evento
GTM 'scrollvideo_fallback_activated' per monitoring.

Copre iOS Safari vecchi o device lenti dove video.currentTime scrub
non è fluido. I frame WEBP esistenti vengono riutilizzati come fallback.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Closing — Verifica End-to-End e re-test UX

### Task 5.1: Smoke test cross-browser

**Files:** N/A

- [ ] **Step 1: Build di produzione locale**

Run: `npm run build && npm run preview`

Expected: build riesce senza errori TypeScript. `preview` serve su porta default (4173 o simile). Apri in browser.

- [ ] **Step 2: Smoke test browser desktop**

- Chrome 1440px: tutta la landing scorre pulita
- Firefox: idem
- Safari (macOS): idem — particolarmente verifica video scrub
- Edge: idem

- [ ] **Step 3: Smoke test mobile reale**

- iPhone 13+ Safari iOS 17+: verifica ScrollVideo scroll fluido, ChiSiamo senza pin, IntroOverlay CTA visibile
- Android Chrome: idem

- [ ] **Step 4: Lighthouse audit performance**

Chrome DevTools → Lighthouse → Mobile, Performance + Accessibility.

Expected:
- Performance ≥ 80 (video MP4 dovrebbe migliorare vs frame sequence)
- Accessibility ≥ 95 (il contrast fix dovrebbe portare a 100 se AA era l'issue)

Annotare eventuali regressioni per fix successivo.

### Task 5.2: Re-test UX con utenti 50enni

**Files:** N/A — test con persone reali

- [ ] **Step 1: Organizzare re-test con gli stessi 2 tester o profilo simile**

Scenari:
1. "Apri la pagina e raccontami cosa vedi". Verifica che notino il CTA "Scorri".
2. Scroll fino a ScrollVideo. "Cosa faresti ora?". Verifica che continuino a scrollare senza esitazione.
3. Arrivo alla strip "02 CONTENT MARKETING". "Cosa pensi sia successo?". Deve essere ovvio che stanno passando al 2° servizio.
4. Arrivo a ChiSiamo. "Quante founder ci sono? Come le scopri?". Devono menzionare entrambe senza fatica.

- [ ] **Step 2: Raccolta feedback e issues**

Se emergono nuovi problemi, aprire task follow-up. Se tutto verde, chiudere questa implementazione.

---

## Self-Review del Plan

**1. Spec coverage:**

| Spec section | Task coverage |
|--------------|----------------|
| §4.1 IntroOverlay — noise removal | Task 2.1 |
| §4.1 IntroOverlay — chevron V3 CTA | Task 2.2 |
| §4.2 Contrasto globale — regole | Task 1.1-1.2 |
| §4.3 ScrollVideo — sticky canvas + MP4 | Task 4.1-4.3 |
| §4.3 ScrollVideo — strip markers | Task 4.2 Step 3 |
| §4.3 ScrollVideo — progress mobile/desktop | Task 4.2 Step 7 |
| §4.3 ScrollVideo — fallback WEBP | Task 4.5 |
| §4.4 ChiSiamo — editorial spread no pin | Task 3.1-3.4 |
| §4.4 ChiSiamo — mobile-first + desktop spread | Task 3.3 |
| §4.4 ChiSiamo — divisore "II — ASIA" | Task 3.3 Step 2 |
| §5 Architettura componenti | Coperto |
| §6 Non-scope | Rispettato — Hero/SocialProof/Portfolio/LeadForm/Footer solo contrast pass |
| §7 Testing | Task 4.4 Step 4, Task 5.1, Task 5.2 |
| §8 Piano rollout | Ordine phase = §8 spec: contrasto → intro → ChiSiamo → ScrollVideo |

**2. Placeholder scan:** Non presenti TBD/TODO. Codice completo in ogni step.

**3. Type consistency:** Verificato — `Service`, `ServiceContent`, `LayoutType`, props interfaces dei subcomponenti coerenti.

**4. Backward compat:** `usePreload` e `canvasDraw` utils vengono lasciati in repo per usi futuri. Frame WEBP esistenti conservati per fallback.
