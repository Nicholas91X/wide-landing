# WIDE Invitation Flow — Design Spec
**Data:** 2026-04-18
**Approccio:** Pragmatic hybrid su schema `Account` esistente (no tabella separata `Invitation`)
**Stato:** Approvato — pronto per implementation plan

---

## 1. Panoramica

Sostituzione del flusso "admin inserisce password manualmente" con un flusso misto:
- Admin può opzionalmente impostare una password (account attivo subito).
- In alternativa, il backend genera un token random, invia email di invito al nuovo utente, che sceglie la propria password cliccando il link.

### Stati `Account`

| Stato | `active` | `invitationTokenHash` | Semantica |
|---|:---:|:---:|---|
| **Attivo** | `true` | `null` | login funzionante |
| **Invito in sospeso** | `false` | non null, `expiresAt` futuro | in attesa di accept |
| **Invito scaduto** | `false` | non null, `expiresAt` passato | admin deve re-invitare |
| **Disattivato** | `false` | `null` | disattivato manualmente |

Il login verifica `active === true`. Pendenti, scaduti e disattivati ricevono lo stesso errore generico "Credenziali non valide" per non leakare lo stato.

---

## 2. Schema DB (Prisma)

Campi nuovi sull'`Account` esistente (migration additiva, nessuna breaking change):

```prisma
model Account {
  // ...campi esistenti
  active                    Boolean   @default(true)

  invitationTokenHash       String?   @unique
  invitationExpiresAt       DateTime?
  invitationLastSentAt      DateTime?   // throttling re-invii (min 5 min)
  invitationFailedAttempts  Int       @default(0)

  invitedByAccountId        String?
  invitedBy                 Account?  @relation("InvitedBy", fields: [invitedByAccountId], references: [id])
  invitedAccounts           Account[] @relation("InvitedBy")
}
```

`invitationTokenHash` è `@unique` per garantire lookup O(1) sul token ricevuto.

### Regole integrità

- `invitationTokenHash` e `invitationExpiresAt` si settano/puliscono insieme (mai uno senza l'altro).
- Al momento dell'accept: `password` viene settata, `active = true`, **tutti** i campi `invitation*` vengono resettati.
- Alla disattivazione manuale di un account attivo: nessun campo `invitation*` viene toccato (restano `null`).

---

## 3. Endpoint API

### 3.1 Creazione account (modifica endpoint esistente)

```
POST /api/v1/accounts
```

**Body:**
```json
{
  "email": "string",
  "nome": "string",
  "cognome": "string",
  "role": "USER | ADMIN",
  "password": "string (opzionale, min 8)"
}
```

**Comportamento:**
- **Email già esistente** (qualsiasi stato) → `409 Conflict`, messaggio `"Email già registrata"`.
- **Password presente** → bcrypt, account creato con `active: true`, risposta `200 { account }`.
- **Password assente** → account creato con `active: false`, genera token + hash, salva `invitationTokenHash`, `invitationExpiresAt`, `invitationLastSentAt = now`, `invitedByAccountId = requester.id`. Invia email (fire-and-forget). Risposta `200 { invited: true, expiresAt }`.

**Autorizzazione:** JWT admin (come oggi). ADMIN può creare USER; SYSTEM_ADMIN può creare USER + ADMIN.

---

### 3.2 Re-invio invito (nuovo)

```
POST /api/v1/accounts/:id/resend-invite
```

**Body:** vuoto.

**Comportamento:**
- Autorizzato solo se l'account target è in stato "invito in sospeso" o "invito scaduto" (`active: false` AND `invitationTokenHash != null`).
- Throttling: rifiuta con `429` se `invitationLastSentAt > now - 5 minuti`.
- Genera nuovo token, sovrascrive `invitationTokenHash`, `invitationExpiresAt`, aggiorna `invitationLastSentAt = now`, resetta `invitationFailedAttempts = 0`.
- Invia email (fire-and-forget).
- Risposta: `200 { invited: true, expiresAt }`.

**Autorizzazione:** JWT admin (USER non ha accesso).

---

### 3.3 Validazione link invito (nuovo, public)

```
GET /api/v1/auth/invite/:token
```

**Comportamento:**
- Calcola `SHA-256(token)`, cerca `Account` con quel `invitationTokenHash`.
- **Non trovato** → `410 Gone`, messaggio generico `"Link non più valido"`. Nessun side effect (impossibile identificare il record).
- **Trovato ma `invitationExpiresAt <= now`** → `410 Gone`, stesso messaggio. Side effect:
  - Incrementa `invitationFailedAttempts`.
  - Se il valore passa da `0` a `1`, invia email alert a tutti gli admin attivi (`ADMIN` + `SYSTEM_ADMIN`, `active: true`).
- **Trovato e valido** → `200 { email, nome, cognome }`. Nessun side effect.

**Rate limit:** 5 req/min per IP.

---

### 3.4 Accettazione invito (nuovo, public)

```
POST /api/v1/auth/accept-invite
```

**Body:**
```json
{ "token": "string", "password": "string (min 8)" }
```

**Comportamento (atomico, dentro una transazione Prisma):**
1. Calcola `SHA-256(token)`, cerca `Account` con quel `invitationTokenHash`.
2. Se non trovato o `invitationExpiresAt <= now` → `410 Gone`.
3. bcrypt(password), setta `Account.password = hash`, `active = true`.
4. Pulisce `invitationTokenHash`, `invitationExpiresAt`, `invitationLastSentAt`, `invitationFailedAttempts`.
5. Genera access + refresh token JWT (login automatico).
6. Risposta `200 { accessToken, refreshToken, account }`.

**Rate limit:** 5 req/min per IP.

**Race condition:** la transazione con filtro su `invitationTokenHash` garantisce che solo il primo accept succeda — il secondo non trova più il hash → 410.

---

### 3.5 Env vars (nuove)

```env
INVITATION_TOKEN_TTL_HOURS=48
```

`FRONTEND_ADMIN_URL` già esistente (usata per compilare il link in email).

---

## 4. Flusso email

Riuso `NodemailerService` + `EMAIL_FROM=noreply@widestudiodigitale.com` + Brevo SMTP già configurato.

### 4.1 Token generation

```typescript
const token = crypto.randomBytes(32).toString('hex');  // 64 char
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const inviteUrl = `${FRONTEND_ADMIN_URL}/invite?token=${token}`;
```

Il DB conserva solo `tokenHash`. Il token in chiaro esiste solo nell'email.

### 4.2 Template 1 — Invito utente

**File:** `src/assets/emails/account-invitation.html`
**A:** `{{email}}` (il nuovo utente)
**Oggetto:** `Sei stato invitato su WIDE Admin`

**Contenuto (Noir Editorial):**
- Logo WIDE (header) + sottotitolo "ADMIN DASHBOARD" in oro.
- Heading "Benvenuto, {{nome}}" (Outfit 800).
- Paragrafo: "{{inviterName}} ti ha invitato come {{roleLabel}}."
- CTA button "Attiva il tuo account" → `{{inviteUrl}}`.
- Nota small: "Il link scade il {{expiresAtFormatted}}. Se non sei tu, ignora questa email."
- Footer WIDE Studio Digitale.

HTML escape di `{{nome}}`, `{{inviterName}}`, `{{roleLabel}}`.

`{{roleLabel}}` è `"User"` o `"Admin"` in base a `Account.role` (stesso mapping del frontend `ROLE_LABELS`).

### 4.3 Template 2 — Alert admin

**File:** `src/assets/emails/invitation-expired-alert.html`
**A:** ogni account con `role IN (ADMIN, SYSTEM_ADMIN)` AND `active: true` (loop).
**Oggetto:** `Invito scaduto per {{email}} — azione richiesta`

**Contenuto:**
- Heading "Azione richiesta".
- Paragrafo: "Qualcuno ha tentato di usare il link di invito scaduto per `{{email}}` (`{{nome}} {{cognome}}`)."
- CTA button "Gestisci account" → `{{FRONTEND_ADMIN_URL}}/accounts`.
- Footer.

**Quando viene inviato:** solo alla prima failure (`invitationFailedAttempts` passa da `0` a `1`). Successive failure sul medesimo token scaduto non triggerano nuovi alert (anti-spam).

### 4.4 Invio async

Gli invii email NON bloccano la risposta HTTP. `sendMail()` è chiamato con `.catch(err => logger.error(err))`. Se Brevo è lento o giù, l'admin vede comunque l'account creato.

---

## 5. Frontend (wide-admin)

### 5.1 Modifica modal "Nuovo account" (`src/pages/Accounts.tsx`)

Campo Password con label modificata:
```
Password (opzionale)
Se lasciato vuoto, invieremo un'email di invito all'utente per impostare la sua password.
```

**Post-submit:**
- Response `{ account }` → chiude modal, messaggio inline "Account creato: {email}".
- Response `{ invited: true, expiresAt }` → chiude modal, messaggio inline "Invito inviato a {email}. Scade il {expiresAt}".
- Errore 409 → messaggio inline nella modal "Email già registrata".

### 5.2 Stato e azioni sulla riga account

Nuova logica di rendering per colonna **Stato** e colonna **Azione**:

| Condizione | Badge Stato | Azione riga |
|---|---|---|
| `active: true` | **Attivo** (verde) | Disattiva |
| `active: false`, invito valido | **Invito in sospeso** (oro) | Re-invia |
| `active: false`, invito scaduto | **Invito scaduto** (rosso) + icona `!` se `invitationFailedAttempts > 0` | **Re-invia** (highlight oro) |
| `active: false`, no invito | **Disattivato** (grigio) | Riattiva |

La riga del proprio account (`acc.id === me.id`) non mostra alcun bottone azione.

Il bottone "Re-invia" chiama `POST /accounts/:id/resend-invite`. Mostra Spinner, poi aggiorna la riga. Errore 429 → banner `listError` esistente con messaggio "Re-invio possibile dopo {X} minuti".

### 5.3 Nuova pagina `/invite` (`src/pages/AcceptInvite.tsx`)

**Rotta:** `/invite` (pubblica, no PrivateRoute).

**Mount flow:**
1. Legge `?token=xxx` via `useSearchParams`. Se assente → mostra errore "Link non valido".
2. `GET /auth/invite/:token` (senza auth header).
3. Se OK → render form.
4. Se 410 → render stato errore "Link non più valido".

**Render form (token valido):**
- Header: logo WIDE (come Login page).
- Intro: "Ciao {nome}, imposta la tua password per accedere a WIDE Admin".
- Input `newPassword` (type password, minLength 8).
- Input `confirmPassword` (deve matchare lato client).
- Bottone "Attiva account".
- Submit → `POST /auth/accept-invite { token, password }` → riceve tokens JWT → salva in localStorage (via funzione shared da `AuthContext`) → `navigate('/leads')`.

**Render errore (410 o token assente):**
- Icona / elemento neutro.
- Testo: "Il link di invito non è più valido o è scaduto."
- Testo small: "Abbiamo avvisato il tuo amministratore. Verrai contattato a breve con un nuovo invito."
- Link "Torna al login" → `/login`.

### 5.4 Rotta in `App.tsx`

```tsx
<Route path="/invite" element={<AcceptInvite />} />
```

Posizionata prima della catch-all redirect `/` → `/leads` e fuori da `PrivateRoute`.

### 5.5 Estensione `AuthContext`

Serve un metodo per salvare tokens arrivati dall'accept-invite senza passare per `login()`:

```typescript
interface AuthContextValue {
  // ...esistenti
  setSession: (tokens: AuthTokens) => void;   // nuovo
}
```

`setSession` esegue le stesse scritture di `login()` (localStorage + setAccount) ma senza la chiamata HTTP. Usata dalla pagina AcceptInvite dopo `POST /auth/accept-invite`.

---

## 6. Sicurezza, rate limit, edge cases

### 6.1 Rate limit (nuovi)

| Endpoint | Limite | Chiave |
|---|---|---|
| `GET /auth/invite/:token` | 5 req/min | IP |
| `POST /auth/accept-invite` | 5 req/min | IP |
| `POST /accounts/:id/resend-invite` | max 1 ogni 5 min | `accountId` (via `invitationLastSentAt`) |

Il rate limit `POST /accounts` (admin) resta quello esistente.

### 6.2 Enumeration

`GET /auth/invite/:token` e `POST /auth/accept-invite` restituiscono lo stesso errore `410 Gone` "Link non più valido" sia per token inesistente sia per token scaduto. Nessun leak di esistenza.

### 6.3 Race condition accept

La transazione Prisma in `POST /auth/accept-invite` usa un `update` con filtro `where: { invitationTokenHash: hash, invitationExpiresAt: { gt: now } }`. Se due richieste arrivano insieme, la prima vince e cancella il hash; la seconda non trova record e riceve 410.

### 6.4 Token leak / inoltro email

- Token in chiaro esiste solo nell'email. Se inoltrato, chiunque può accettare e settare password. Contromisura: TTL breve (48h default) + single-use (token invalidato dopo accept).
- Il link scaduto non permette di fare nulla: il successo password reset richiede un re-invito dall'admin.

### 6.5 Delete account con invito pendente

Cascade normale. `DELETE /accounts/:id` rimuove l'account. Se esistevano link in giro, diventano 410 al click.

### 6.6 Self-invitation impossibile

`POST /accounts` richiede JWT admin. Un utente anonimo non può auto-invitarsi.

### 6.7 Messaggi errore UX

| Scenario | Dove | Testo |
|---|---|---|
| Email duplicata in crea | Modal Accounts | "Email già registrata" |
| Re-invio troppo frequente (429) | Banner listError | "Re-invio possibile dopo circa X minuti" |
| Rate limit pubblico superato | Pagina /invite | "Troppe richieste. Riprova tra qualche minuto." |
| Password < 8 | Form AcceptInvite | validazione HTML5 nativa (`minLength=8`) |
| Password ≠ confirm | Form AcceptInvite | inline sotto il secondo input "Le password non coincidono" |

---

## 7. Ordine di implementazione

### Backend (`wide-backend`)

1. Prisma migration: aggiungere i 5 campi su `Account` + relazione `InvitedBy`.
2. Env var `INVITATION_TOKEN_TTL_HOURS` (+ Zod validation).
3. `InvitationService`: `generateToken`, `hashToken`, `sendInvitationEmail`, `sendExpiredAlert`, logica throttling.
4. Template HTML `account-invitation.html` + `invitation-expired-alert.html` + rendering variabili + escape.
5. Modifica `AccountsController.create`: branch password presente/assente.
6. Nuovi endpoint: `POST /accounts/:id/resend-invite`, `GET /auth/invite/:token`, `POST /auth/accept-invite`.
7. Rate limit (riusando il Throttler di NestJS già in uso per `POST /leads`).
8. Test manuale dei 4 flow (vedi §8).

### Frontend (`wide-admin`)

9. `src/pages/AcceptInvite.tsx` + rotta `/invite` in `App.tsx`.
10. `AuthContext.setSession` nuovo metodo.
11. Modifica modal in `Accounts.tsx` (password opzionale + messaggio post-submit differenziato).
12. Logica nuova colonna Stato + bottone "Re-invia" in `Accounts.tsx`.

---

## 8. Criteri di successo

**Flow 1 — Creazione con password (regressione):**
Admin crea account con password → riceve `{ account }` → il nuovo utente può loggarsi subito.

**Flow 2 — Invito standard:**
Admin crea account senza password → riceve `{ invited: true }` → email arriva entro 30s → utente clicca link → pagina `/invite` mostra form → setta password → viene loggato automaticamente su `/leads`.

**Flow 3 — Link scaduto + alert:**
Account pending con `expiresAt` passato (forzato via DB) → utente clicca link → pagina `/invite` mostra stato scaduto → tutti gli admin attivi ricevono email alert → admin clicca "Re-invia" sulla riga → utente riceve nuovo invito.

**Flow 4 — Race condition accept:**
Due tab aperte sullo stesso `/invite?token=xxx` → submit contemporaneo → una riceve 200 + login, l'altra riceve 410.

**Flow 5 — Rate limit re-invio:**
Admin clicca "Re-invia" due volte in 2 minuti → seconda volta errore `Re-invio possibile dopo ~3 minuti`.

**Flow 6 — Enumeration:**
`curl GET /api/v1/auth/invite/token-inesistente` vs `curl GET /api/v1/auth/invite/token-scaduto` → stesso status, stesso corpo.
