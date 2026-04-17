// ─── DataLayer utility ────────────────────────────────────────────────────────
// Single source of truth for all analytics events.
// GTM reads these from window.dataLayer and routes them to GA4, Meta Pixel, etc.
// ──────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

window.dataLayer = window.dataLayer || [];

function push(event: string, params?: Record<string, unknown>) {
  window.dataLayer.push({ event, ...params });
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

/** Fired when a named section scrolls into the viewport. */
export function trackSectionView(sectionId: string) {
  push('section_view', { section_name: sectionId });
}

/** Fired on any CTA click (floating button, hero button, etc.). */
export function trackCTAClick(ctaLocation: string) {
  push('cta_click', { cta_location: ctaLocation });
}

/** Fired when the user opens the Cal.com booking modal. */
export function trackBookingStart() {
  push('booking_start');
}

// ─── Audit Form (/audit) ─────────────────────────────────────────────────────

/** Fired each time the user completes a quiz step. */
export function trackAuditStepComplete(step: number, totalSteps: number) {
  push('audit_step_complete', {
    audit_step: step,
    audit_total_steps: totalSteps,
    audit_progress: Math.round((step / totalSteps) * 100),
  });
}

/** Fired when the result screen is shown. */
export function trackAuditComplete(resultProfile: string, score: number) {
  push('audit_complete', {
    audit_result: resultProfile,
    audit_score: score,
  });
}

/** Fired when the user clicks the booking CTA on the result screen. */
export function trackAuditBookingClick() {
  push('audit_booking_click');
}

// ─── Lead Form (Contatti) ────────────────────────────────────────────────────
// GTM: crea un trigger "Custom Event" per ogni event name.
// Collega `lead_form_success` a un tag GA4 Event con event_name "generate_lead".

/** Fired on first field interaction (once per form session). */
export function trackLeadFormStart() {
  push('lead_form_start');
}

/** Fired when the user clicks submit after client-side validation passes. */
export function trackLeadFormSubmit(servizio: string) {
  push('lead_form_submit', { lead_servizio: servizio });
}

/** Fired on successful backend response — use this as conversion trigger. */
export function trackLeadFormSuccess(servizio: string) {
  push('lead_form_success', { lead_servizio: servizio });
}

/** Fired when the backend returns an error or fetch fails. */
export function trackLeadFormError(reason: string) {
  push('lead_form_error', { error_reason: reason });
}
