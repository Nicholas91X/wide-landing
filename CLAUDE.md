# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (tsc) then build for production
npm run preview    # Preview production build locally
```

There are no tests and no linter configured. Type-check only runs as part of `build`.

## Architecture

This is a **single-page React 19 + Vite** marketing landing for WIDE Studio Digitale (`widestudiodigitale.com`). There is no router — navigation between the main landing and legal pages (`/privacy`, `/cookie`, `/note-legali`, `/audit-privacy`, `/audit-termini`) is handled manually via `window.history.pushState` in [src/App.tsx](src/App.tsx).

### Section render order (top → bottom)

1. **SocialProof** — hero/above-the-fold with metrics and a Bunny.net case-study video
2. **ServicesHeader** — static intro header for the services section
3. **ScrollVideo** — scroll-driven canvas animation (see below)
4. **ChiSiamo** — team/about section
5. **Portfolio** — project gallery with Bunny.net video iframes
6. **Contatti** — lead form + Cal.com booking embed
7. **Footer**

Sections 4–7 are lazy-loaded (`React.lazy`) and mounted only after the user first scrolls (`hasScrolled` state), reducing initial JS payload.

### ScrollVideo — the core animation

[src/components/ScrollVideo.tsx](src/components/ScrollVideo.tsx) is the most complex component. It pins a `<canvas>` sticky while the user scrolls through 700 vh (800 vh mobile) and animates 6 service descriptions over the background.

- **Background**: prefers a `<video>` element for frame scrubbing. On slow devices it falls back to preloaded WebP keyframe images (120 desktop / 60 mobile, sampled evenly from `/frames/section-2/` or `/frames_9_16/section-2/`).
- **Canvas drawing**: cover-fills with aspect-ratio letterbox correction; detects double-stacked exported frames (height > 70% of width) and crops to top half.
- **GSAP ScrollTrigger**: `start: "top top"`, `end: "bottom bottom"`, easing `none` — progress maps linearly to the user's hand.
- **6 services** divide scroll progress equally; each `ServiceBlock` fades in via its own ScrollTrigger.
- `ProgressOverlay` is intentionally a no-op (returns `null`) — the sidebar progress dots were removed but the component is kept for prop-typing.

### Design system

All tokens live in `index.html` `<style>` (not a CSS file):

| Token | Value |
|---|---|
| `--color-bg` | `#050505` |
| `--color-gold` | `#c5a55a` |
| `--font-title` | Outfit 700 |
| `--font-subtitle` | Manrope 600 |
| `--font-body` | Plus Jakarta Sans 400 |
| `--font-serif` | Playfair Display italic |

**Branding rule**: only black (`#050505`) and white (`#ffffff`) as surface/text colors. Gold (`#c5a55a`) is the only accent. No other colors.

### Media

- Videos served from Bunny.net CDN via `<iframe src="https://iframe.mediadelivery.net/embed/...">` — use `MediaSlot` in SocialProof for auto-detection of Bunny embeds vs direct video files vs images.
- Frame sequences in `/public/frames/section-2/` (desktop 16:9) and `/public/frames_9_16/section-2/` (mobile 9:16). Max 120 KB per frame.
- Mobile breakpoint: `max-width: 767px` (checked via `window.matchMedia`, not CSS media queries in JS).

### Analytics

All events go through `window.dataLayer` (GTM ID `GTM-595ZBFRG` → GA4 + Meta Pixel). Use the helpers in [src/utils/analytics.ts](src/utils/analytics.ts) — never push to `dataLayer` directly elsewhere.

### Routing

The `/audit` path redirects to `/audit/` (a separate static site in the same deployment). Legal pages are rendered inline by `LegalPage` without a full page reload.

### Agent docs

The `.agents/` directory contains project context, branding guidelines, and AI video prompt templates used by the team (not read by the app at runtime).
