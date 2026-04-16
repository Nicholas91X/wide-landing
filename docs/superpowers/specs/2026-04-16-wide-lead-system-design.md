# WIDE Lead System — Design Spec
**Data:** 2026-04-16
**Approccio:** Tre repo separati, React + Vite ovunque (Approccio A)
**Stato:** Approvato — pronto per implementazione

---

## 1. Panoramica

Sostituzione del widget Cal.com con un sistema di lead management completo:

| Componente | Repo | Deployment |
|-----------|------|-----------|
| `wide-backend` | nuovo repo | Hetzner Docker (`api.widestudiodigitale.com`) |
| Form landing page | `wide-landing` (esistente) | Vercel (già live) |
| `wide-admin` | nuovo repo | Vercel (`dashboard.widestudiodigitale.com`) |

---

## 2. Backend (`wide-backend`)

### 2.1 Stack

- **Framework:** NestJS 11 + TypeScript
- **ORM:** Prisma + PostgreSQL 16
- **Cache:** Redis 7
- **Email:** Nodemailer via Mailgun SMTP (`smtp.eu.mailgun.org:465`)
- **Auth:** JWT RS256 (Passport.js), refresh token rotation con family tracking
- **Validazione env:** Zod
- **Pattern:** Repository → Service → Controller (identico ad auto2g-backend)
- **API prefix:** `/api/v1`

### 2.2 Struttura moduli

```
wide-backend/
├── src/
│   ├── AUTH/           # login, refresh, logout
│   ├── ACCOUNT/        # gestione utenti
│   ├── LEADS/          # lead + attività
│   ├── EMAIL/          # Nodemailer service + template HTML
│   ├── DATABASE/       # Prisma service (global module)
│   ├── config/         # Zod env validation
│   └── main.ts
├── src/assets/emails/
│   ├── lead-confirmation.html     # → cliente
│   └── lead-notification.html     # → team interno
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── jwt-keys/           # RSA private + public key (gitignored)
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

### 2.3 Schema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Lead ───────────────────────────────────────────────────────────────────

model Lead {
  id            String         @id @default(cuid())
  nome          String
  cognome       String
  email         String
  telefono      String
  settore       String         // valore dropdown oppure "Altro"
  settoreCustom String?        // compilato solo se settore == "Altro"
  servizio      String         // uno dei 7 servizi predefiniti
  status        LeadStatus     @default(NUOVO)
  note          String?        // note interne, aggiornabili dagli admin
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  activities    LeadActivity[]
}

model LeadActivity {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  accountId String?  // null = azione pubblica (es. creazione da form)
  account   Account? @relation(fields: [accountId], references: [id])
  action    String   // "created" | "status_changed" | "note_updated"
  detail    String?  // es. "NUOVO → CONTATTATO" oppure testo nota
  createdAt DateTime @default(now())
}

enum LeadStatus {
  NUOVO
  IN_LAVORAZIONE
  CONTATTATO
  QUALIFICATO
  CHIUSO_VINTO
  CHIUSO_PERSO
}

// ─── Account ────────────────────────────────────────────────────────────────

model Account {
  id                  String         @id @default(cuid())
  email               String         @unique
  password            String
  nome                String
  cognome             String
  role                AccountRole    @default(USER)
  active              Boolean        @default(true)
  failedLoginAttempts Int            @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  refreshTokens       RefreshToken[]
  leadActivities      LeadActivity[]
}

enum AccountRole {
  SYSTEM_ADMIN
  ADMIN
  USER
}

// ─── RefreshToken ────────────────────────────────────────────────────────────

model RefreshToken {
  id          String    @id @default(cuid())
  token       String    @unique
  accountId   String
  account     Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?
  replacedBy  String?
}
```

### 2.4 Endpoint API

**Pubblici (rate-limited 3 req/min per IP):**
```
POST  /api/v1/leads                  # crea lead → email cliente + email interna
```

**Auth (pubblici):**
```
POST  /api/v1/auth/login             # email + password → access + refresh token
POST  /api/v1/auth/refresh           # refresh token → nuovi token
POST  /api/v1/auth/logout            # revoca refresh token
```

**Lead (JWT — tutti i ruoli):**
```
GET   /api/v1/leads                  # lista con paginazione + filtri
GET   /api/v1/leads/export           # export CSV/Excel
GET   /api/v1/leads/:id              # dettaglio + attività
PATCH /api/v1/leads/:id/status       # aggiorna stato → registra LeadActivity
PATCH /api/v1/leads/:id/note         # aggiorna nota → registra LeadActivity
```

**Lead (JWT — solo ADMIN + SYSTEM_ADMIN):**
```
DELETE /api/v1/leads/:id
```

**Account (JWT — ADMIN: solo USER; SYSTEM_ADMIN: tutti):**
```
GET   /api/v1/accounts               # lista account visibili al ruolo corrente
POST  /api/v1/accounts               # crea account
PATCH /api/v1/accounts/:id           # modifica account
DELETE /api/v1/accounts/:id          # disattivazione soft (active: false)
```

**Profilo personale (JWT — tutti i ruoli):**
```
GET   /api/v1/auth/me                # profilo corrente
PATCH /api/v1/auth/me                # aggiorna nome/cognome/password
```

### 2.5 Permission matrix

| Azione | SYSTEM_ADMIN | ADMIN | USER |
|--------|:-----------:|:-----:|:----:|
| Creare lead (form pubblico) | ✅ | ✅ | ✅ |
| Leggere lead | ✅ | ✅ | ✅ |
| Aggiornare stato/nota lead | ✅ | ✅ | ✅ |
| Eliminare lead | ✅ | ✅ | ❌ |
| Esportare lead CSV | ✅ | ✅ | ✅ |
| Creare account USER | ✅ | ✅ | ❌ |
| Modificare/disattivare account USER | ✅ | ✅ | ❌ |
| Creare account ADMIN | ✅ | ❌ | ❌ |
| Modificare/disattivare account ADMIN (altri) | ✅ | ❌ | ❌ |
| Modificare il proprio profilo ADMIN | ✅ | ✅ | ❌ |
| Vedere lista account | ✅ (tutti) | ✅ (solo USER) | ❌ |

### 2.6 Email flow

**Trigger:** `POST /api/v1/leads` con successo.

**Email 1 — Conferma al cliente:**
- **A:** indirizzo email del lead
- **Oggetto:** "Abbiamo ricevuto la tua richiesta — WIDE Studio Digitale"
- **Contenuto:** ringraziamento personalizzato (nome, servizio richiesto), promessa di contatto entro 24h, firma WIDE

**Email 2 — Notifica interna:**
- **A:** `INTERNAL_NOTIFICATION_EMAIL` (env var)
- **Oggetto:** "Nuovo lead: [Nome Cognome] — [Servizio]"
- **Contenuto:** tutti i campi del lead formattati, link diretto al dashboard

Template HTML in `src/assets/emails/`, variabili con sintassi `{{variabile}}` + HTML escaping (identico ad auto2g).

### 2.7 Docker su Hetzner

```yaml
# docker-compose.prod.yml
services:
  wide-api:
    build: .
    ports: ["3001:3000"]   # auto2g usa 3000, wide usa 3001 per evitare conflitti
    environment: [...]
    depends_on: [wide-db, wide-redis]

  wide-db:
    image: postgres:16-alpine
    volumes: [wide-postgres-data:/var/lib/postgresql/data]

  wide-redis:
    image: redis:7-alpine
    volumes: [wide-redis-data:/data]

volumes:
  wide-postgres-data:
  wide-redis-data:
```

**Nginx (vhost da aggiungere al server esistente):**
```nginx
server {
    listen 443 ssl;
    server_name api.widestudiodigitale.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2.8 Variabili d'ambiente

```env
# Database
DATABASE_URL=postgresql://wide:password@wide-db:5432/wide

# JWT (RSA keys)
JWT_PRIVATE_KEY_FILE=/app/jwt-keys/private.pem
JWT_PUBLIC_KEY_FILE=/app/jwt-keys/public.pem
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Mailgun SMTP)
SMTP_HOST=smtp.eu.mailgun.org
SMTP_PORT=465
SMTP_USER=postmaster@widestudiodigitale.com
SMTP_PASS=<mailgun-password>
SMTP_SECURE=true
EMAIL_FROM=noreply@widestudiodigitale.com
INTERNAL_NOTIFICATION_EMAIL=info@widestudiodigitale.com

# Security
DEFAULT_ADMIN_EMAIL=admin@widestudiodigitale.com
DEFAULT_ADMIN_PW=<temp-password-da-cambiare>
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://widestudiodigitale.com,https://dashboard.widestudiodigitale.com

# App
PORT=3000
NODE_ENV=production
BACKEND_BASE_URL=https://api.widestudiodigitale.com
FRONTEND_ADMIN_URL=https://dashboard.widestudiodigitale.com

# Swagger (docs protetti in prod)
SWAGGER_USER=wide
SWAGGER_PASSWORD=<swagger-password>
```

---

## 3. Form Landing Page (`wide-landing`)

### 3.1 Componente

**File:** `src/components/LeadForm.tsx`
**Sostituisce:** `<CalEmbed>` in `src/components/Contatti.tsx`

### 3.2 Campi

| Campo | Tipo | Obbligatorio | Note |
|-------|------|:------------:|------|
| Nome | text | ✅ | min 2 caratteri |
| Cognome | text | ✅ | min 2 caratteri |
| Email | email | ✅ | formato valido |
| Telefono | tel | ✅ | solo cifre + `+`, min 8 caratteri |
| Settore | select | ✅ | dropdown + "Altro" |
| Settore (libero) | text | condizionale | visibile solo se Settore = "Altro" |
| Servizio | select | ✅ | single select, 7 opzioni |

**Settori predefiniti:**
Automotive, Fitness / Sport, Ristorazione, Moda / Fashion, Immobiliare, Professioni / Studi, Retail / E-commerce, Artigianato, Tecnologia, Altro

**Servizi:**
Social Media Marketing, Content Marketing, Shooting Video/Fotografici, Produzioni Video con AI, Il Tuo Strumento Digitale, Sviluppo Piattaforme Web, Integrazioni Automazioni AI

### 3.3 Layout

**Desktop:** griglia 2 colonne (Nome+Cognome, Email+Telefono), poi full-width per Settore, Servizio, campo Settore custom, bottone.
**Mobile:** stack verticale, un campo per riga.

### 3.4 Stati

- **Idle:** form compilabile
- **Submitting:** bottone disabilitato + spinner inline, campi non editabili
- **Success:** form sostituito da messaggio di conferma Noir Editorial (stesso stile della card)
- **Error API:** messaggio inline sotto il bottone, form rimane compilato con i dati
- **Validation error:** errori per campo in rosso/oro, submit bloccato

### 3.5 API call

```typescript
const API_URL = import.meta.env.VITE_API_URL; // https://api.widestudiodigitale.com

await fetch(`${API_URL}/api/v1/leads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

### 3.6 Stile

Design system Noir Editorial esistente: `var(--color-bg)`, `var(--color-gold)`, `var(--color-border)`, Manrope 700 per label, Outfit 800 per eventuali titoli. Zero nuove dipendenze npm.

---

## 4. Admin Dashboard (`wide-admin`)

### 4.1 Stack

- React 19 + Vite + TypeScript
- Axios con interceptor per refresh automatico
- Vercel deployment
- Dominio: `dashboard.widestudiodigitale.com`
- Stile: Noir Editorial consistente con la landing (CSS inline, stessi token)

### 4.2 Routing

```
/login              pubblica, redirect se autenticato
/                   redirect → /leads
/leads              lista lead (tutti i ruoli)
/leads/:id          dettaglio + cronologia (tutti i ruoli)
/accounts           gestione account (ADMIN + SYSTEM_ADMIN)
/accounts/new       crea account
/profile            modifica profilo personale
```

Rotte protette: `PrivateRoute` wrapper — se access token assente o scaduto → redirect `/login`.
Rotte per ruolo: `/accounts` inaccessibile a USER → redirect `/leads`.

### 4.3 Pagina `/leads`

- Tabella: Nome + Cognome, Email, Servizio, Settore, Stato (badge colorato), Data creazione
- Filtri: Stato, Servizio, Data (da/a)
- Ricerca full-text: nome, cognome, email, telefono
- Paginazione: 20 per pagina
- Bottone **Esporta CSV** (tutti i ruoli)
- Click su riga → `/leads/:id`

**Badge colori per stato:**
- Nuovo → bianco
- In lavorazione → giallo/oro
- Contattato → azzurro
- Qualificato → verde chiaro
- Chiuso vinto → verde
- Chiuso perso → grigio

### 4.4 Pagina `/leads/:id`

Layout a due colonne (desktop), stack (mobile):

**Colonna sinistra — dati lead:**
Nome, Cognome, Email, Telefono, Settore, Servizio, Data creazione, Data ultima modifica

**Colonna destra — azioni:**
- Dropdown stato + bottone Salva
- Textarea nota + bottone Salva nota
- Bottone Elimina (solo ADMIN + SYSTEM_ADMIN, con modale di conferma)

**Sezione cronologia** (sotto, full-width):
```
● Lead creato dal form               —          16 apr 2026  09:30
● Stato → In lavorazione             Alessia A.  16 apr 2026  14:22
● Nota aggiornata                    Asia F.     17 apr 2026  10:05
● Stato → Contattato                 Alessia A.  18 apr 2026  16:40
```

### 4.5 Pagina `/accounts`

Tabella: Nome, Email, Ruolo (badge), Stato (Attivo/Disattivato), Data creazione + azioni.

**Visibilità per ruolo:**
- SYSTEM_ADMIN: vede tutti (SYSTEM_ADMIN, ADMIN, USER)
- ADMIN: vede solo USER

Azioni: Modifica (modale inline) · Disattiva/Riattiva · (SYSTEM_ADMIN) Promuovi a ADMIN.

### 4.6 Autenticazione

- Login: `POST /api/v1/auth/login` → access token (15min) in localStorage + refresh token (7d) in httpOnly cookie
- Interceptor Axios: se 401 → `POST /api/v1/auth/refresh` → nuovo access token, retry richiesta originale
- Logout: `POST /api/v1/auth/logout` + pulizia localStorage
- Account lockout: dopo 5 tentativi falliti il backend blocca 15 minuti (gestito lato server, frontend mostra messaggio)

### 4.7 Struttura file

```
wide-admin/
├── src/
│   ├── api/           # client Axios + interceptor
│   ├── auth/          # context, useAuth hook, PrivateRoute
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Leads.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── Accounts.tsx
│   │   └── Profile.tsx
│   ├── components/    # Badge, Table, Modal, Spinner, Navbar
│   ├── types/         # Lead, Account, LeadActivity (TypeScript)
│   └── main.tsx
├── index.html
├── vite.config.ts
└── vercel.json        # SPA routing: rewrite tutto a index.html
```

---

## 5. Ordine di implementazione

1. **`wide-backend`** — schema Prisma, moduli NestJS, email template, Docker config
2. **Form `wide-landing`** — `LeadForm.tsx`, sostituzione CalEmbed, variabile env `VITE_API_URL`
3. **`wide-admin`** — scaffold Vite, auth flow, pagine Lead + Account

Ogni sub-progetto è indipendente e deployabile separatamente. Il backend deve essere live su Hetzner prima che form e admin possano funzionare in produzione, ma lo sviluppo locale può procedere in parallelo con mock.

---

## 6. Criteri di successo

- Form landing: submit → lead creato nel DB + email cliente ricevuta + email interna ricevuta entro 30 secondi
- Admin: login funzionante, lista lead visibile, cambio stato registra attività con autore
- RBAC: USER non riesce ad accedere a `/accounts`, non riesce a eliminare lead
- Export CSV: file scaricabile con tutti i campi del lead
- Docker: `docker-compose up` su Hetzner avvia tutti e tre i servizi (api, db, redis) senza errori
