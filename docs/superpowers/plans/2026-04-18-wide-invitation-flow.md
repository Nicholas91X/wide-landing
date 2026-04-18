# WIDE Invitation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementare il flusso di invito via email per la creazione account admin, sostituendo l'inserimento manuale della password con un token-based onboarding (password opzionale lato admin).

**Architecture:** Estensione dello schema `Account` esistente (no tabella separata) con 5 campi `invitation*`. Quattro endpoint: `POST /accounts` modificato + 3 nuovi (`resend-invite`, `GET /auth/invite/:token`, `POST /auth/accept-invite`). Due template email Brevo. Nuova pagina frontend `/invite` + stati account differenziati nella lista.

**Tech Stack:** NestJS 11 + Prisma 7 + Nodemailer (backend), React 19 + Vite + react-router-dom v7 (frontend), crypto.randomBytes + SHA-256 per token.

**Spec di riferimento:** `docs/superpowers/specs/2026-04-18-wide-invitation-flow-design.md`

**Prerequisiti:**
- `wide-backend` live su `api.widestudiodigitale.com` (serve per testing)
- `wide-admin` live su `dashboard.widestudiodigitale.com`
- Brevo SMTP configurato (già attivo per notifiche lead)
- Working dir backend: `C:\Users\Principale\Desktop\Progetti\wide-backend\`
- Working dir frontend: `C:\Users\Principale\Desktop\Progetti\wide-admin\`

---

## File Map

### Backend (`wide-backend`)

```
wide-backend/
├── prisma/
│   ├── schema.prisma                                   ← MODIFY (add 5 fields + relation)
│   └── migrations/<timestamp>_add_invitation_fields/
│       └── migration.sql                                ← CREATE (auto via prisma migrate)
├── src/
│   ├── config/
│   │   └── env.ts                                       ← MODIFY (add INVITATION_TOKEN_TTL_HOURS)
│   ├── INVITATION/
│   │   ├── invitation.service.ts                        ← CREATE
│   │   └── invitation.module.ts                         ← CREATE
│   ├── assets/emails/
│   │   ├── account-invitation.html                      ← CREATE
│   │   └── invitation-expired-alert.html                ← CREATE
│   ├── ACCOUNT/
│   │   ├── account.service.ts                           ← MODIFY (branch in create, add resendInvite)
│   │   ├── account.controller.ts                        ← MODIFY (add resend-invite endpoint)
│   │   └── dto/
│   │       └── create-account.dto.ts                    ← MODIFY (password opzionale)
│   ├── AUTH/
│   │   ├── auth.controller.ts                           ← MODIFY (add 2 public endpoints)
│   │   ├── auth.service.ts                              ← MODIFY (add validateInvite, acceptInvite)
│   │   └── dto/
│   │       ├── accept-invite.dto.ts                     ← CREATE
│   │       └── invite-token-param.dto.ts                ← CREATE
│   └── APP/
│       └── app.module.ts                                ← MODIFY (import InvitationModule)
└── .env.example                                          ← MODIFY (add INVITATION_TOKEN_TTL_HOURS)
```

### Frontend (`wide-admin`)

```
wide-admin/
├── src/
│   ├── auth/
│   │   └── AuthContext.tsx                              ← MODIFY (add setSession method)
│   ├── pages/
│   │   ├── AcceptInvite.tsx                             ← CREATE
│   │   └── Accounts.tsx                                 ← MODIFY (password opzionale + stati + resend)
│   ├── App.tsx                                           ← MODIFY (add /invite route)
│   └── types/
│       └── index.ts                                      ← MODIFY (add Account.active stati, extend)
```

**Nota sui path backend:** la struttura sopra rispecchia il pattern `UPPERCASE_MODULE/` visto nella spec. Se nel repo effettivo i path sono diversi (es. `lowercase/`), adattare mantenendo la separazione modulare.

---

# FASE BACKEND (`wide-backend`)

## Task 1: Prisma migration — campi invitation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_invitation_fields/migration.sql` (auto)

- [ ] **Step 1.1 — Aggiungi i 5 campi e la relazione self-referencing al model `Account`**

In `prisma/schema.prisma`, dentro `model Account { ... }`, aggiungi sotto i campi esistenti:

```prisma
model Account {
  // ...campi esistenti (id, email, password, nome, cognome, role, active, failedLoginAttempts, lockedUntil, createdAt, updatedAt)

  invitationTokenHash       String?   @unique
  invitationExpiresAt       DateTime?
  invitationLastSentAt      DateTime?
  invitationFailedAttempts  Int       @default(0)

  invitedByAccountId        String?
  invitedBy                 Account?  @relation("InvitedBy", fields: [invitedByAccountId], references: [id])
  invitedAccounts           Account[] @relation("InvitedBy")

  // ...relazioni esistenti (refreshTokens, leadActivities)
}
```

**Caveat:** la `password` esistente è probabilmente `String` (required). Per permettere account pendenti senza password, va resa opzionale. Cambia:

```prisma
password String?   // era: String
```

- [ ] **Step 1.2 — Genera la migration**

Run da `/c/Users/Principale/Desktop/Progetti/wide-backend`:

```bash
npx prisma migrate dev --name add_invitation_fields
```

Expected:
- Crea una cartella `prisma/migrations/<timestamp>_add_invitation_fields/` con `migration.sql`.
- Applica la migration al DB di sviluppo locale.
- Rigenera il Prisma Client.

- [ ] **Step 1.3 — Verifica la migration SQL**

Apri `prisma/migrations/<timestamp>_add_invitation_fields/migration.sql`. Verifica la presenza di:
- `ALTER TABLE "Account" ALTER COLUMN "password" DROP NOT NULL;`
- `ALTER TABLE "Account" ADD COLUMN "invitationTokenHash" TEXT;`
- `ALTER TABLE "Account" ADD COLUMN "invitationExpiresAt" TIMESTAMP(3);`
- `ALTER TABLE "Account" ADD COLUMN "invitationLastSentAt" TIMESTAMP(3);`
- `ALTER TABLE "Account" ADD COLUMN "invitationFailedAttempts" INTEGER NOT NULL DEFAULT 0;`
- `ALTER TABLE "Account" ADD COLUMN "invitedByAccountId" TEXT;`
- `CREATE UNIQUE INDEX "Account_invitationTokenHash_key" ON "Account"("invitationTokenHash");`
- `ALTER TABLE "Account" ADD CONSTRAINT "Account_invitedByAccountId_fkey" FOREIGN KEY ("invitedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;`

- [ ] **Step 1.4 — Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): aggiungi campi invitation a Account + password opzionale"
```

---

## Task 2: Env var — TTL token

**Files:**
- Modify: `src/config/env.ts`
- Modify: `.env.example`

- [ ] **Step 2.1 — Aggiungi la variabile allo schema Zod**

In `src/config/env.ts` (cerca il blocco `z.object({...})`), aggiungi:

```typescript
INVITATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(48),
```

- [ ] **Step 2.2 — Aggiungi la variabile a `.env.example`**

Append in `.env.example`:

```env
# Flusso invito account admin
INVITATION_TOKEN_TTL_HOURS=48
```

- [ ] **Step 2.3 — Commit**

```bash
git add src/config/env.ts .env.example
git commit -m "feat(env): INVITATION_TOKEN_TTL_HOURS con default 48"
```

---

## Task 3: Template email — invito utente

**Files:**
- Create: `src/assets/emails/account-invitation.html`

- [ ] **Step 3.1 — Crea il template HTML Noir Editorial**

`src/assets/emails/account-invitation.html`:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invito WIDE Admin</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#0e0e0e;border:1px solid rgba(255,255,255,0.07);">
          <tr>
            <td style="padding:36px 40px 28px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
              <div style="font-weight:900;font-size:28px;letter-spacing:-0.04em;color:#ffffff;">WIDE</div>
              <div style="font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#c5a55a;margin-top:4px;">Admin Dashboard</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;text-transform:uppercase;">Benvenuto, {{nome}}</h1>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
                {{inviterName}} ti ha invitato come <strong style="color:#c5a55a;">{{roleLabel}}</strong> su WIDE Admin.
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
                Clicca il pulsante qui sotto per impostare la tua password e accedere alla dashboard.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ffffff;">
                    <a href="{{inviteUrl}}" style="display:inline-block;padding:14px 32px;color:#000000;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Attiva il tuo account</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.4);">
                Il link scade il <strong>{{expiresAtFormatted}}</strong>. Se non hai richiesto questo invito, ignora questa email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
              <p style="margin:0;font-size:11px;letter-spacing:0.1em;color:rgba(255,255,255,0.3);text-transform:uppercase;">WIDE Studio Digitale</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

Variabili: `{{nome}}`, `{{inviterName}}`, `{{roleLabel}}`, `{{inviteUrl}}`, `{{expiresAtFormatted}}`.

- [ ] **Step 3.2 — Commit**

```bash
git add src/assets/emails/account-invitation.html
git commit -m "feat(email): template HTML account-invitation (Noir Editorial)"
```

---

## Task 4: Template email — alert admin link scaduto

**Files:**
- Create: `src/assets/emails/invitation-expired-alert.html`

- [ ] **Step 4.1 — Crea il template alert**

`src/assets/emails/invitation-expired-alert.html`:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invito scaduto — WIDE Admin</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#0e0e0e;border:1px solid rgba(255,255,255,0.07);">
          <tr>
            <td style="padding:36px 40px 28px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
              <div style="font-weight:900;font-size:28px;letter-spacing:-0.04em;color:#ffffff;">WIDE</div>
              <div style="font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#c5a55a;margin-top:4px;">Admin Alert</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;text-transform:uppercase;">Azione richiesta</h1>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
                Qualcuno ha tentato di usare il link di invito scaduto per:
              </p>
              <p style="margin:0 0 24px 0;padding:12px 16px;background-color:rgba(197,165,90,0.08);border-left:3px solid #c5a55a;font-size:14px;color:#ffffff;">
                <strong>{{nome}} {{cognome}}</strong><br/>
                <span style="color:rgba(255,255,255,0.6);">{{email}}</span>
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
                Accedi alla dashboard per re-inviare l'invito.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ffffff;">
                    <a href="{{dashboardUrl}}" style="display:inline-block;padding:14px 32px;color:#000000;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Gestisci account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
              <p style="margin:0;font-size:11px;letter-spacing:0.1em;color:rgba(255,255,255,0.3);text-transform:uppercase;">WIDE Studio Digitale</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

Variabili: `{{nome}}`, `{{cognome}}`, `{{email}}`, `{{dashboardUrl}}`.

- [ ] **Step 4.2 — Commit**

```bash
git add src/assets/emails/invitation-expired-alert.html
git commit -m "feat(email): template HTML invitation-expired-alert"
```

---

## Task 5: `InvitationService` — token generation, hashing, email

**Files:**
- Create: `src/INVITATION/invitation.service.ts`
- Create: `src/INVITATION/invitation.module.ts`

- [ ] **Step 5.1 — Crea `invitation.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from '../EMAIL/email.service';
import { DatabaseService } from '../DATABASE/database.service';

export interface GeneratedInvitation {
  token: string;        // in chiaro, solo per link email
  tokenHash: string;    // sha-256, da salvare in DB
  expiresAt: Date;
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly db: DatabaseService,
  ) {}

  generate(): GeneratedInvitation {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlHours = this.config.get<number>('INVITATION_TOKEN_TTL_HOURS') ?? 48;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    return { token, tokenHash, expiresAt };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async sendInvitationEmail(params: {
    to: string;
    nome: string;
    roleLabel: 'User' | 'Admin';
    inviterName: string;
    inviteUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    const templatePath = path.join(__dirname, '..', 'assets', 'emails', 'account-invitation.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const expiresAtFormatted = params.expiresAt.toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const html = template
      .replace(/\{\{nome\}\}/g, this.escapeHtml(params.nome))
      .replace(/\{\{inviterName\}\}/g, this.escapeHtml(params.inviterName))
      .replace(/\{\{roleLabel\}\}/g, params.roleLabel)
      .replace(/\{\{inviteUrl\}\}/g, params.inviteUrl)
      .replace(/\{\{expiresAtFormatted\}\}/g, expiresAtFormatted);

    this.email.sendMail({
      to: params.to,
      subject: 'Sei stato invitato su WIDE Admin',
      html,
    }).catch((err) => {
      this.logger.error(`Invio invito fallito per ${params.to}`, err);
    });
  }

  async sendExpiredAlertToAdmins(params: {
    nome: string;
    cognome: string;
    email: string;
  }): Promise<void> {
    const admins = await this.db.account.findMany({
      where: { role: { in: ['ADMIN', 'SYSTEM_ADMIN'] }, active: true },
      select: { email: true },
    });
    if (admins.length === 0) return;

    const templatePath = path.join(__dirname, '..', 'assets', 'emails', 'invitation-expired-alert.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const dashboardUrl = `${this.config.get<string>('FRONTEND_ADMIN_URL')}/accounts`;
    const html = template
      .replace(/\{\{nome\}\}/g, this.escapeHtml(params.nome))
      .replace(/\{\{cognome\}\}/g, this.escapeHtml(params.cognome))
      .replace(/\{\{email\}\}/g, this.escapeHtml(params.email))
      .replace(/\{\{dashboardUrl\}\}/g, dashboardUrl);

    for (const admin of admins) {
      this.email.sendMail({
        to: admin.email,
        subject: `Invito scaduto per ${params.email} — azione richiesta`,
        html,
      }).catch((err) => {
        this.logger.error(`Alert admin fallito per ${admin.email}`, err);
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
```

**Caveat:** `EmailService` e `DatabaseService` devono essere già esistenti. Adatta gli import al percorso effettivo nel repo (es. `../EMAIL/email.service` vs `../email/email.service`). Verifica anche che `EmailService.sendMail` abbia firma `(args: { to, subject, html }) => Promise<void>`; se non è così, adatta la chiamata. In caso di assenza, importa direttamente `nodemailer` e usa le SMTP vars — ma il pattern esistente con `EmailService` è preferibile.

- [ ] **Step 5.2 — Crea `invitation.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { EmailModule } from '../EMAIL/email.module';

@Module({
  imports: [EmailModule],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
```

Se `EmailModule` non esiste (EmailService è esportato altrove), sostituisci l'import con il modulo che espone `EmailService`.

- [ ] **Step 5.3 — Importa `InvitationModule` in `AccountModule` e `AuthModule`**

In `src/ACCOUNT/account.module.ts`:
```typescript
imports: [InvitationModule, /* esistenti */],
```

In `src/AUTH/auth.module.ts`:
```typescript
imports: [InvitationModule, /* esistenti */],
```

- [ ] **Step 5.4 — Build**

```bash
npm run build
```

Expected: nessun errore TypeScript.

- [ ] **Step 5.5 — Commit**

```bash
git add src/INVITATION/ src/ACCOUNT/account.module.ts src/AUTH/auth.module.ts
git commit -m "feat(invitation): InvitationService con token gen, hashing, email"
```

---

## Task 6: Modifica `POST /accounts` — password opzionale, branch invito

**Files:**
- Modify: `src/ACCOUNT/dto/create-account.dto.ts`
- Modify: `src/ACCOUNT/account.service.ts`
- Modify: `src/ACCOUNT/account.controller.ts` (eventualmente)

- [ ] **Step 6.1 — Rendi `password` opzionale nel DTO**

In `src/ACCOUNT/dto/create-account.dto.ts`, cambia:
```typescript
@IsOptional()
@IsString()
@MinLength(8)
password?: string;
```

(era `@IsString() @MinLength(8) password: string;`)

- [ ] **Step 6.2 — Modifica `AccountService.create` per branchare sul flag `password`**

In `src/ACCOUNT/account.service.ts`, modifica il metodo `create` (o come si chiama). Aggiungi al costruttore:

```typescript
constructor(
  private readonly db: DatabaseService,
  private readonly invitation: InvitationService,
  private readonly config: ConfigService,
) {}
```

Implementazione:

```typescript
async create(dto: CreateAccountDto, requester: { id: string; role: string }): Promise<
  | { account: AccountPublic; invited?: never }
  | { invited: true; expiresAt: Date; account?: never }
> {
  // Email già registrata?
  const existing = await this.db.account.findUnique({ where: { email: dto.email } });
  if (existing) {
    throw new ConflictException('Email già registrata');
  }

  // Branch: password presente → active immediato
  if (dto.password) {
    const hash = await bcrypt.hash(dto.password, 12);
    const account = await this.db.account.create({
      data: {
        email: dto.email,
        nome: dto.nome,
        cognome: dto.cognome,
        role: dto.role,
        password: hash,
        active: true,
      },
    });
    return { account: this.toPublic(account) };
  }

  // Branch: no password → invito
  const { token, tokenHash, expiresAt } = this.invitation.generate();
  const account = await this.db.account.create({
    data: {
      email: dto.email,
      nome: dto.nome,
      cognome: dto.cognome,
      role: dto.role,
      active: false,
      invitationTokenHash: tokenHash,
      invitationExpiresAt: expiresAt,
      invitationLastSentAt: new Date(),
      invitedByAccountId: requester.id,
    },
  });

  const inviter = await this.db.account.findUnique({
    where: { id: requester.id },
    select: { nome: true, cognome: true },
  });
  const inviterName = inviter ? `${inviter.nome} ${inviter.cognome}` : 'WIDE Admin';
  const inviteUrl = `${this.config.get<string>('FRONTEND_ADMIN_URL')}/invite?token=${token}`;

  this.invitation.sendInvitationEmail({
    to: dto.email,
    nome: dto.nome,
    roleLabel: dto.role === 'ADMIN' ? 'Admin' : 'User',
    inviterName,
    inviteUrl,
    expiresAt,
  });

  return { invited: true, expiresAt };
}
```

**Caveat:**
- `toPublic(account)` è un helper esistente che rimuove `password` e i campi `invitation*` dalla risposta. Se non esiste, crealo come utility privata nel service.
- `AccountPublic` è il type di ritorno pubblico — adatta al nome esistente nel repo.
- `bcrypt` e `ConflictException` potrebbero già essere importati; se no, importali.

- [ ] **Step 6.3 — Adatta il controller (se serve)**

Se `AccountController.create` tipizza il ritorno come `Account`, rendilo `any` oppure un union type che copra entrambi i rami:

```typescript
@Post()
async create(
  @Body() dto: CreateAccountDto,
  @Req() req: { user: { id: string; role: string } },
) {
  return this.service.create(dto, req.user);
}
```

- [ ] **Step 6.4 — Build e smoke test con curl**

```bash
npm run build
npm run start:dev   # oppure equivalente locale
```

Poi, da altro terminale (assumendo il backend locale su `localhost:3000` e un token admin valido in `$TOKEN`):

```bash
# Caso password presente
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","nome":"Test","cognome":"Uno","role":"USER","password":"Password123!"}'
# Expected: 200 { "account": {...} }

# Caso invito (no password)
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","nome":"Test","cognome":"Due","role":"USER"}'
# Expected: 200 { "invited": true, "expiresAt": "..." }
# E arriva email (verifica inbox)
```

- [ ] **Step 6.5 — Commit**

```bash
git add src/ACCOUNT/
git commit -m "feat(account): POST /accounts password opzionale con flusso invito"
```

---

## Task 7: Endpoint `POST /accounts/:id/resend-invite`

**Files:**
- Modify: `src/ACCOUNT/account.service.ts`
- Modify: `src/ACCOUNT/account.controller.ts`

- [ ] **Step 7.1 — Aggiungi `resendInvite` al service**

In `src/ACCOUNT/account.service.ts`:

```typescript
async resendInvite(id: string): Promise<{ invited: true; expiresAt: Date }> {
  const account = await this.db.account.findUnique({ where: { id } });
  if (!account) {
    throw new NotFoundException('Account non trovato');
  }
  if (account.active || !account.invitationTokenHash) {
    throw new BadRequestException('Questo account non è in attesa di invito');
  }

  // Throttling: 5 minuti dall'ultimo invio
  if (account.invitationLastSentAt) {
    const elapsedMs = Date.now() - account.invitationLastSentAt.getTime();
    const minMs = 5 * 60 * 1000;
    if (elapsedMs < minMs) {
      const waitMinutes = Math.ceil((minMs - elapsedMs) / 60000);
      throw new HttpException(
        `Re-invio possibile tra circa ${waitMinutes} minuti`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // Nuovo token
  const { token, tokenHash, expiresAt } = this.invitation.generate();
  await this.db.account.update({
    where: { id },
    data: {
      invitationTokenHash: tokenHash,
      invitationExpiresAt: expiresAt,
      invitationLastSentAt: new Date(),
      invitationFailedAttempts: 0,
    },
  });

  const inviter = account.invitedByAccountId
    ? await this.db.account.findUnique({
        where: { id: account.invitedByAccountId },
        select: { nome: true, cognome: true },
      })
    : null;
  const inviterName = inviter ? `${inviter.nome} ${inviter.cognome}` : 'WIDE Admin';
  const inviteUrl = `${this.config.get<string>('FRONTEND_ADMIN_URL')}/invite?token=${token}`;

  this.invitation.sendInvitationEmail({
    to: account.email,
    nome: account.nome,
    roleLabel: account.role === 'ADMIN' ? 'Admin' : 'User',
    inviterName,
    inviteUrl,
    expiresAt,
  });

  return { invited: true, expiresAt };
}
```

Importa `NotFoundException`, `BadRequestException`, `HttpException`, `HttpStatus` da `@nestjs/common` se non già presenti.

- [ ] **Step 7.2 — Aggiungi l'endpoint al controller**

In `src/ACCOUNT/account.controller.ts`:

```typescript
@Post(':id/resend-invite')
@UseGuards(JwtGuard, RoleGuard)
@Roles('ADMIN', 'SYSTEM_ADMIN')
async resendInvite(@Param('id') id: string) {
  return this.service.resendInvite(id);
}
```

Adatta decoratori guard/roles ai pattern esistenti nel controller (se si chiamano diversamente).

- [ ] **Step 7.3 — Smoke test**

```bash
npm run build && npm run start:dev
```

Con un account pending creato al Task 6 step 6.4:

```bash
# Primo re-invio (OK)
curl -X POST http://localhost:3000/api/v1/accounts/<ACCOUNT_ID>/resend-invite \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 { "invited": true, "expiresAt": "..." }

# Re-invio immediato (throttled)
curl -X POST http://localhost:3000/api/v1/accounts/<ACCOUNT_ID>/resend-invite \
  -H "Authorization: Bearer $TOKEN"
# Expected: 429 "Re-invio possibile tra circa 5 minuti"
```

- [ ] **Step 7.4 — Commit**

```bash
git add src/ACCOUNT/
git commit -m "feat(account): endpoint resend-invite con throttling 5 min"
```

---

## Task 8: Endpoint `GET /auth/invite/:token`

**Files:**
- Create: `src/AUTH/dto/invite-token-param.dto.ts`
- Modify: `src/AUTH/auth.service.ts`
- Modify: `src/AUTH/auth.controller.ts`
- Modify: `src/AUTH/auth.module.ts` (se necessario per DI)

- [ ] **Step 8.1 — Crea il DTO per il param**

`src/AUTH/dto/invite-token-param.dto.ts`:

```typescript
import { IsString, Matches } from 'class-validator';

export class InviteTokenParamDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'Formato token non valido' })
  token!: string;
}
```

(64 char hex = 32 byte random esadecimale)

- [ ] **Step 8.2 — Aggiungi `validateInviteToken` al service**

In `src/AUTH/auth.service.ts`. Aggiungi l'import:
```typescript
import { InvitationService } from '../INVITATION/invitation.service';
```

Aggiungilo al constructor e poi il metodo:

```typescript
async validateInviteToken(token: string): Promise<{ email: string; nome: string; cognome: string }> {
  const tokenHash = this.invitation.hashToken(token);
  const account = await this.db.account.findUnique({
    where: { invitationTokenHash: tokenHash },
    select: {
      email: true, nome: true, cognome: true,
      invitationExpiresAt: true, invitationFailedAttempts: true,
    },
  });

  if (!account) {
    throw new HttpException('Link non più valido', HttpStatus.GONE);
  }

  const now = new Date();
  if (!account.invitationExpiresAt || account.invitationExpiresAt.getTime() <= now.getTime()) {
    // Side effect: incrementa failed attempts, alert admin se era la prima
    const updated = await this.db.account.update({
      where: { invitationTokenHash: tokenHash },
      data: { invitationFailedAttempts: { increment: 1 } },
      select: { invitationFailedAttempts: true, nome: true, cognome: true, email: true },
    });
    if (updated.invitationFailedAttempts === 1) {
      this.invitation.sendExpiredAlertToAdmins({
        nome: updated.nome,
        cognome: updated.cognome,
        email: updated.email,
      });
    }
    throw new HttpException('Link non più valido', HttpStatus.GONE);
  }

  return { email: account.email, nome: account.nome, cognome: account.cognome };
}
```

- [ ] **Step 8.3 — Aggiungi l'endpoint al controller**

In `src/AUTH/auth.controller.ts`:

```typescript
import { Throttle } from '@nestjs/throttler';
// ...

@Get('invite/:token')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async validateInvite(@Param() params: InviteTokenParamDto) {
  return this.authService.validateInviteToken(params.token);
}
```

Se `@Throttle` non è configurato nel progetto, salta quel decoratore — il rate limit può essere aggiunto dopo.

- [ ] **Step 8.4 — Smoke test**

```bash
# Token valido (da Task 6 step 6.4 — l'avrai dall'email o da log)
curl http://localhost:3000/api/v1/auth/invite/<TOKEN>
# Expected: 200 { "email": "test2@example.com", "nome": "Test", "cognome": "Due" }

# Token inesistente
curl http://localhost:3000/api/v1/auth/invite/$(printf 'a%.0s' {1..64})
# Expected: 410 "Link non più valido"

# Token scaduto: forza expires nel passato via SQL
# psql "$DATABASE_URL" -c "UPDATE \"Account\" SET \"invitationExpiresAt\" = NOW() - INTERVAL '1 hour' WHERE email='test2@example.com';"
curl http://localhost:3000/api/v1/auth/invite/<TOKEN_ORIGINALE>
# Expected: 410 + arriva email alert agli admin + invitationFailedAttempts = 1
```

- [ ] **Step 8.5 — Commit**

```bash
git add src/AUTH/
git commit -m "feat(auth): GET /auth/invite/:token con side effect alert admin"
```

---

## Task 9: Endpoint `POST /auth/accept-invite`

**Files:**
- Create: `src/AUTH/dto/accept-invite.dto.ts`
- Modify: `src/AUTH/auth.service.ts`
- Modify: `src/AUTH/auth.controller.ts`

- [ ] **Step 9.1 — Crea il DTO**

`src/AUTH/dto/accept-invite.dto.ts`:

```typescript
import { IsString, Matches, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'Formato token non valido' })
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
```

- [ ] **Step 9.2 — Aggiungi `acceptInvite` al service**

In `src/AUTH/auth.service.ts`:

```typescript
async acceptInvite(dto: AcceptInviteDto): Promise<{
  accessToken: string;
  refreshToken: string;
  account: { id: string; email: string; nome: string; cognome: string; role: string };
}> {
  const tokenHash = this.invitation.hashToken(dto.token);

  // Trova + valida atomicamente
  const now = new Date();
  const hashed = await bcrypt.hash(dto.password, 12);

  // Prisma update con filtro sul hash e sulla data: se qualcuno vince la race, il secondo non trova nulla
  const updated = await this.db.account
    .update({
      where: { invitationTokenHash: tokenHash },
      data: {
        password: hashed,
        active: true,
        invitationTokenHash: null,
        invitationExpiresAt: null,
        invitationLastSentAt: null,
        invitationFailedAttempts: 0,
      },
      select: { id: true, email: true, nome: true, cognome: true, role: true, invitationExpiresAt: true },
    })
    .catch(() => null);

  if (!updated) {
    throw new HttpException('Link non più valido', HttpStatus.GONE);
  }

  // Dopo update il field invitationExpiresAt è già null — dobbiamo controllare PRIMA.
  // Refactor: fai una select dedicata prima dell'update.
  // (Vedi sotto per variante corretta.)

  // Genera token JWT (riusa il metodo esistente per il login)
  const tokens = await this.issueTokenPair({
    id: updated.id, email: updated.email, role: updated.role,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    account: {
      id: updated.id,
      email: updated.email,
      nome: updated.nome,
      cognome: updated.cognome,
      role: updated.role,
    },
  };
}
```

**⚠️ Correzione variante atomica:** l'approccio "update + catch null" sopra ha un bug: non verifica `invitationExpiresAt` prima dell'update. Usa questa versione invece:

```typescript
async acceptInvite(dto: AcceptInviteDto): Promise<{
  accessToken: string;
  refreshToken: string;
  account: { id: string; email: string; nome: string; cognome: string; role: string };
}> {
  const tokenHash = this.invitation.hashToken(dto.token);

  return this.db.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { invitationTokenHash: tokenHash },
      select: {
        id: true, email: true, nome: true, cognome: true, role: true,
        invitationExpiresAt: true,
      },
    });

    if (!account || !account.invitationExpiresAt || account.invitationExpiresAt.getTime() <= Date.now()) {
      throw new HttpException('Link non più valido', HttpStatus.GONE);
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    await tx.account.update({
      where: { id: account.id },
      data: {
        password: hashed,
        active: true,
        invitationTokenHash: null,
        invitationExpiresAt: null,
        invitationLastSentAt: null,
        invitationFailedAttempts: 0,
      },
    });

    const tokens = await this.issueTokenPair({
      id: account.id, email: account.email, role: account.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      account: {
        id: account.id,
        email: account.email,
        nome: account.nome,
        cognome: account.cognome,
        role: account.role,
      },
    };
  });
}
```

`issueTokenPair` è il metodo esistente che crea access + refresh JWT e salva il refresh su `RefreshToken`. Se nel codice si chiama diversamente (es. `generateTokenPair`, `createTokens`), adatta.

- [ ] **Step 9.3 — Aggiungi l'endpoint al controller**

In `src/AUTH/auth.controller.ts`:

```typescript
@Post('accept-invite')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async acceptInvite(@Body() dto: AcceptInviteDto) {
  return this.authService.acceptInvite(dto);
}
```

- [ ] **Step 9.4 — Smoke test**

Crea un nuovo account pending (Task 6), recupera il token dal link in email, poi:

```bash
curl -X POST http://localhost:3000/api/v1/auth/accept-invite \
  -H "Content-Type: application/json" \
  -d '{"token":"<TOKEN>","password":"NuovaPassword123"}'
# Expected: 200 { "accessToken": "...", "refreshToken": "...", "account": {...} }

# Secondo tentativo con lo stesso token
curl -X POST http://localhost:3000/api/v1/auth/accept-invite \
  -H "Content-Type: application/json" \
  -d '{"token":"<TOKEN>","password":"AltraPwd123"}'
# Expected: 410 "Link non più valido"
```

- [ ] **Step 9.5 — Commit**

```bash
git add src/AUTH/
git commit -m "feat(auth): POST /auth/accept-invite con transazione atomica"
```

---

## Task 10: Deploy backend

**Files:** nessuno (solo operazioni git + ssh)

- [ ] **Step 10.1 — Verifica tutti i commit presenti**

```bash
cd /c/Users/Principale/Desktop/Progetti/wide-backend
git log --oneline | head -12
```

Expected: 8 nuovi commit (Task 1–9, Task 5 e 10 possono condividere qualche commit).

- [ ] **Step 10.2 — Push su GitHub**

```bash
git push origin main
```

- [ ] **Step 10.3 — Pull e rebuild su Hetzner**

```bash
ssh root@157.180.39.57 << 'SSH'
cd /root/progetti/wide-backend
git pull
docker compose -f docker-compose.prod.yml up -d --build wide-api
docker compose -f docker-compose.prod.yml exec wide-api npx prisma migrate deploy
SSH
```

Expected:
- `docker compose up --build` ricostruisce l'immagine con il nuovo codice.
- `prisma migrate deploy` applica la migration su DB di produzione.
- Container `wide-api` riparte sano.

- [ ] **Step 10.4 — Aggiungi env var su Hetzner**

Modifica `/root/progetti/wide-backend/.env`:
```env
INVITATION_TOKEN_TTL_HOURS=48
```

Poi restart:
```bash
ssh root@157.180.39.57 "cd /root/progetti/wide-backend && docker compose -f docker-compose.prod.yml restart wide-api"
```

- [ ] **Step 10.5 — Health check produzione**

```bash
curl https://api.widestudiodigitale.com/api/v1/auth/invite/$(printf 'a%.0s' {1..64})
# Expected: 410 "Link non più valido" (endpoint esiste, routing OK)
```

Se ricevi 404 invece di 410, il build non ha incluso i nuovi endpoint — verifica docker logs.

---

# FASE FRONTEND (`wide-admin`)

**Workspace:** `C:\Users\Principale\Desktop\Progetti\wide-admin\` (Git Bash: `/c/Users/Principale/Desktop/Progetti/wide-admin`).

## Task 11: Estensione `AuthContext.setSession`

**Files:**
- Modify: `src/auth/AuthContext.tsx`

- [ ] **Step 11.1 — Aggiungi `setSession` al type e alla implementation**

Modifica `src/auth/AuthContext.tsx`. Aggiungi alla interface:

```typescript
interface AuthContextValue {
  account: Pick<Account, 'id' | 'email' | 'nome' | 'cognome' | 'role'> | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (tokens: AuthTokens) => void;
}
```

Aggiungi l'implementazione dentro `AuthProvider`:

```typescript
const setSession = useCallback((tokens: AuthTokens) => {
  localStorage.setItem('wide_access_token', tokens.accessToken);
  localStorage.setItem('wide_refresh_token', tokens.refreshToken);
  localStorage.setItem('wide_account', JSON.stringify(tokens.account));
  setAccount(tokens.account);
}, []);
```

E aggiungilo al `value={...}`:

```typescript
<AuthContext.Provider value={{ account, isLoading, login, logout, setSession }}>
```

- [ ] **Step 11.2 — Build**

```bash
npm run build
```

Expected: nessun errore (l'interface è estesa, i consumer non si rompono).

- [ ] **Step 11.3 — Commit**

```bash
git add src/auth/AuthContext.tsx
git commit -m "feat(auth): AuthContext.setSession per login post-accept-invite"
```

---

## Task 12: Pagina `/invite` (AcceptInvite)

**Files:**
- Create: `src/pages/AcceptInvite.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 12.1 — Crea `src/pages/AcceptInvite.tsx`**

```tsx
import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '../components/Spinner';
import type { AuthTokens } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string;

type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'ready'; nome: string; cognome: string; email: string }
  | { kind: 'submitting'; nome: string; cognome: string; email: string }
  | { kind: 'error'; nome: string; cognome: string; email: string; message: string };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const token = params.get('token') ?? '';

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid' });
      return;
    }
    axios
      .get<{ email: string; nome: string; cognome: string }>(
        `${API_URL}/api/v1/auth/invite/${token}`,
      )
      .then(({ data }) => {
        setState({ kind: 'ready', ...data });
      })
      .catch(() => {
        setState({ kind: 'invalid' });
      });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    if (state.kind !== 'ready') return;
    const snapshot = state;
    setState({ kind: 'submitting', ...snapshot });
    try {
      const { data } = await axios.post<AuthTokens>(
        `${API_URL}/api/v1/auth/accept-invite`,
        { token, password },
      );
      setSession(data);
      navigate('/leads', { replace: true });
    } catch (err: any) {
      if (err?.response?.status === 410) {
        setState({ kind: 'invalid' });
        return;
      }
      const msg = err?.response?.data?.message ?? 'Errore durante l\u2019attivazione';
      setState({
        kind: 'error',
        ...snapshot,
        message: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: '#fff', fontSize: '0.95rem',
    fontFamily: 'var(--font-body)', outline: 'none',
    boxSizing: 'border-box', borderRadius: 0,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.68rem',
    fontFamily: 'var(--font-subtitle)', fontWeight: 700,
    letterSpacing: '0.22em', textTransform: 'uppercase',
    color: 'var(--color-gold)', marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.04em', color: '#fff' }}>WIDE</div>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-gold)', marginTop: 4 }}>Admin Dashboard</div>
        </div>

        {state.kind === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spinner size={28} />
          </div>
        )}

        {state.kind === 'invalid' && (
          <div style={{ padding: '24px 28px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '0 0 12px' }}>Link non più valido</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Il link di invito è scaduto o non valido. Abbiamo avvisato il tuo amministratore — verrai contattato a breve con un nuovo invito.
            </p>
            <Link to="/login" style={{ color: 'var(--color-gold)', fontSize: '0.75rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              → Torna al login
            </Link>
          </div>
        )}

        {(state.kind === 'ready' || state.kind === 'submitting' || state.kind === 'error') && (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 28px', textAlign: 'center' }}>
              Ciao <strong style={{ color: '#fff' }}>{state.nome}</strong>, imposta la tua password per accedere a WIDE Admin.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nuova password</label>
              <input
                type="password" value={password} autoComplete="new-password" minLength={8} required
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle} disabled={state.kind === 'submitting'}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Conferma password</label>
              <input
                type="password" value={confirm} autoComplete="new-password" minLength={8} required
                onChange={(e) => { setConfirm(e.target.value); setMismatch(false); }}
                style={inputStyle} disabled={state.kind === 'submitting'}
              />
              {mismatch && (
                <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'rgba(220,80,80,0.9)' }}>Le password non coincidono.</p>
              )}
            </div>

            {state.kind === 'error' && (
              <p style={{ color: 'rgba(220,80,80,0.9)', fontSize: '0.8rem', marginBottom: 16, padding: '8px 12px', border: '1px solid rgba(220,50,50,0.3)' }}>
                {state.message}
              </p>
            )}

            <button
              type="submit" disabled={state.kind === 'submitting'}
              style={{
                width: '100%', padding: '13px 0',
                background: state.kind === 'submitting' ? 'rgba(255,255,255,0.7)' : '#fff',
                color: '#000', border: 'none', cursor: state.kind === 'submitting' ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-subtitle)', fontWeight: 700, fontSize: '0.8rem',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {state.kind === 'submitting' ? <><Spinner size={16} /> Attivazione…</> : 'Attiva account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 12.2 — Aggiungi la rotta `/invite` in `App.tsx`**

In `src/App.tsx`, aggiungi l'import:

```tsx
import AcceptInvite from './pages/AcceptInvite';
```

E la rotta, prima del catch-all `/`:

```tsx
<Route path="/invite" element={<AcceptInvite />} />
```

- [ ] **Step 12.3 — Build**

```bash
npm run build
```

Expected: nessun errore TS.

- [ ] **Step 12.4 — Commit**

```bash
git add src/pages/AcceptInvite.tsx src/App.tsx
git commit -m "feat(pages): /invite con form set-password e login automatico"
```

---

## Task 13: Modal "Nuovo account" — password opzionale

**Files:**
- Modify: `src/pages/Accounts.tsx`

- [ ] **Step 13.1 — Cambia label e helper del campo Password**

In `src/pages/Accounts.tsx`, trova l'array dei campi della modal:

```tsx
{[
  { key: 'nome', label: 'Nome', type: 'text' },
  { key: 'cognome', label: 'Cognome', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'password', label: 'Password', type: 'password' },
].map(...)}
```

Sostituiscilo con un rendering che tratta la password come optional con helper text:

```tsx
{[
  { key: 'nome', label: 'Nome', type: 'text', required: true },
  { key: 'cognome', label: 'Cognome', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
].map(({ key, label, type }) => (
  <div key={key}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={(form as any)[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      style={inputStyle}
    />
  </div>
))}
<div>
  <label style={labelStyle}>Password <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '0.15em' }}>(opzionale)</span></label>
  <input
    type="password"
    value={form.password}
    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
    style={inputStyle}
    minLength={8}
  />
  <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
    Se lasciato vuoto, invieremo un'email di invito per impostare la password.
  </p>
</div>
```

- [ ] **Step 13.2 — Aggiorna `handleCreate` per gestire i due tipi di risposta**

Serve anche uno stato di "success banner" per mostrare il risultato sotto la modal dopo il submit. Aggiungi:

```typescript
const [successMsg, setSuccessMsg] = useState('');
```

Modifica `handleCreate`:

```typescript
const handleCreate = async () => {
  setFormError('');
  setCreating(true);
  try {
    // Invia solo le chiavi valorizzate
    const payload: Record<string, string> = {
      email: form.email,
      nome: form.nome,
      cognome: form.cognome,
      role: form.role,
    };
    if (form.password) payload.password = form.password;

    const { data } = await api.post<
      | { account: { email: string } }
      | { invited: true; expiresAt: string }
    >('/accounts', payload);

    setCreateOpen(false);
    setForm({ email: '', password: '', nome: '', cognome: '', role: 'USER' });

    if ('invited' in data) {
      const expires = new Date(data.expiresAt).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      setSuccessMsg(`Invito inviato a ${form.email}. Scade il ${expires}.`);
    } else {
      setSuccessMsg(`Account creato: ${data.account.email}.`);
    }
    await fetchAccounts();
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Errore nella creazione';
    setFormError(Array.isArray(msg) ? msg.join(', ') : String(msg));
  } finally {
    setCreating(false);
  }
};
```

- [ ] **Step 13.3 — Mostra il banner success sopra la lista**

Trova il blocco `{listError && (...)}` e aggiungi subito dopo un banner analogo per success:

```tsx
{successMsg && (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, padding: '10px 14px',
    border: '1px solid rgba(60,180,100,0.3)',
    color: 'rgba(100,220,140,0.95)', fontSize: '0.85rem', fontFamily: 'var(--font-body)',
  }}>
    <span>{successMsg}</span>
    <button onClick={() => setSuccessMsg('')}
      style={{ background: 'none', border: 'none', color: 'rgba(100,220,140,0.6)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 4px' }}>
      ✕
    </button>
  </div>
)}
```

- [ ] **Step 13.4 — Build + commit**

```bash
npm run build
git add src/pages/Accounts.tsx
git commit -m "feat(accounts): password opzionale + banner success post-submit"
```

---

## Task 14: Lista accounts — stati differenziati + bottone Re-invia

**Files:**
- Modify: `src/pages/Accounts.tsx`
- Modify: `src/types/index.ts`

- [ ] **Step 14.1 — Estendi il type `Account`**

In `src/types/index.ts`, aggiungi i campi opzionali:

```typescript
export interface Account {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  role: AccountRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  invitationExpiresAt?: string | null;
  invitationFailedAttempts?: number;
}
```

Il backend deve restituirli sulla `GET /accounts` — Task 14.5 verifica.

- [ ] **Step 14.2 — Aggiungi helper `getAccountStatus` e config**

In `src/pages/Accounts.tsx`, sopra il componente `export default function Accounts()`:

```typescript
type AccountDisplayStatus = 'active' | 'invite_pending' | 'invite_expired' | 'deactivated';

function getAccountStatus(acc: Account): AccountDisplayStatus {
  if (acc.active) return 'active';
  if (!acc.invitationExpiresAt) return 'deactivated';
  return new Date(acc.invitationExpiresAt).getTime() > Date.now() ? 'invite_pending' : 'invite_expired';
}

const STATUS_DISPLAY: Record<AccountDisplayStatus, { label: string; color: string }> = {
  active:         { label: 'Attivo',            color: 'rgba(60,180,100,0.8)' },
  invite_pending: { label: 'Invito in sospeso', color: 'var(--color-gold)' },
  invite_expired: { label: 'Invito scaduto',    color: 'rgba(220,80,80,0.85)' },
  deactivated:    { label: 'Disattivato',       color: 'rgba(220,80,80,0.6)' },
};
```

- [ ] **Step 14.3 — Aggiungi `resendInvite` handler e stato "resending"**

Dentro il componente, aggiungi:

```typescript
const [resendingId, setResendingId] = useState<string | null>(null);

const resendInvite = async (acc: Account) => {
  setListError('');
  setResendingId(acc.id);
  try {
    await api.post(`/accounts/${acc.id}/resend-invite`);
    setSuccessMsg(`Invito ri-inviato a ${acc.email}.`);
    await fetchAccounts();
  } catch (err: any) {
    setListError(extractError(err, 'Re-invio fallito.'));
  } finally {
    setResendingId(null);
  }
};
```

- [ ] **Step 14.4 — Aggiorna la cella Stato e la cella Azione nella `<tbody>`**

Trova la riga `<tr key={acc.id}>` nella `<tbody>`. Sostituisci la cella Stato (il bloccho con `Attivo / Disattivato`):

```tsx
<td style={{ padding: '12px 12px' }}>
  {(() => {
    const status = getAccountStatus(acc);
    const { label, color } = STATUS_DISPLAY[status];
    const showWarn = status === 'invite_expired' && (acc.invitationFailedAttempts ?? 0) > 0;
    return (
      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        {showWarn && <span title="Link scaduto cliccato dall'utente" style={{ color: 'rgba(220,80,80,0.95)', fontSize: '0.85rem', lineHeight: 1 }}>!</span>}
      </span>
    );
  })()}
</td>
```

E sostituisci la cella azione (il bottone "Disattiva/Riattiva"):

```tsx
<td style={{ padding: '12px 12px' }}>
  {acc.id !== me?.id && (() => {
    const status = getAccountStatus(acc);
    const isResending = resendingId === acc.id;
    if (status === 'active') {
      return (
        <button onClick={() => toggleActive(acc)}
          style={{ background: 'none', border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Disattiva
        </button>
      );
    }
    if (status === 'deactivated') {
      return (
        <button onClick={() => toggleActive(acc)}
          style={{ background: 'none', border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Riattiva
        </button>
      );
    }
    // invite_pending or invite_expired
    const highlight = status === 'invite_expired';
    return (
      <button
        onClick={() => resendInvite(acc)}
        disabled={isResending}
        style={{
          background: highlight ? 'var(--color-gold)' : 'none',
          border: `1px solid ${highlight ? 'var(--color-gold)' : 'var(--color-border)'}`,
          color: highlight ? '#000' : 'rgba(255,255,255,0.65)',
          cursor: isResending ? 'not-allowed' : 'pointer',
          padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-subtitle)',
          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        {isResending ? <Spinner size={10} /> : null} Re-invia
      </button>
    );
  })()}
</td>
```

- [ ] **Step 14.5 — Verifica backend: `GET /accounts` ritorna i nuovi campi**

Il `findMany` sui account probabilmente seleziona già tutti i campi (default Prisma). Controlla `src/ACCOUNT/account.service.ts` (backend) sul metodo `list` o simile:

Se esiste un `select: { id, email, nome, cognome, role, active, createdAt, updatedAt }` espliclito, aggiungi:

```typescript
select: {
  // ...esistenti
  invitationExpiresAt: true,
  invitationFailedAttempts: true,
},
```

Se invece non c'è `select`, Prisma ritorna tutto di default ma anche campi che non vogliamo esporre (`password`, `invitationTokenHash`). Sostituisci con un `select` esplicito sicuro.

Se serve modifica, fai un commit backend ulteriore:
```bash
cd /c/Users/Principale/Desktop/Progetti/wide-backend
git add src/ACCOUNT/
git commit -m "feat(account): includi campi invitation in risposta GET /accounts"
git push
```
Poi ridistribuisci come Task 10.

- [ ] **Step 14.6 — Build frontend + commit**

```bash
cd /c/Users/Principale/Desktop/Progetti/wide-admin
npm run build
git add src/pages/Accounts.tsx src/types/index.ts
git commit -m "feat(accounts): stati invito (pending/scaduto) + bottone Re-invia"
```

---

## Task 15: Deploy frontend

**Files:** nessuno (solo push)

- [ ] **Step 15.1 — Push**

```bash
cd /c/Users/Principale/Desktop/Progetti/wide-admin
git push origin main
```

- [ ] **Step 15.2 — Verifica Vercel**

Vercel auto-deploya su push main. Attendi ~1 min. Verifica su `https://dashboard.widestudiodigitale.com/invite?token=xxx` (con token a caso): deve mostrare "Link non più valido" + link "Torna al login".

---

## Task 16: Testing end-to-end manuale

**Files:** nessuno. Esegui su produzione.

- [ ] **Flow 1 — Creazione con password (regressione)**

Dashboard → `/accounts` → "+ Nuovo account" → compila tutti i campi INCLUSA la password → Crea. Aspettativa: banner verde "Account creato", l'account appare "Attivo", il nuovo utente può loggarsi subito con email+password.

- [ ] **Flow 2 — Invito standard**

Stessa modal, ma LASCIA la password vuota → Crea. Aspettativa: banner verde "Invito inviato a {email}. Scade il {date}". Controlla inbox del nuovo utente: email "Sei stato invitato su WIDE Admin" con bottone "Attiva il tuo account". Click → pagina `/invite` con form password → imposta password → redirect automatico a `/leads`, loggato.

- [ ] **Flow 3 — Link scaduto + alert admin**

Da admin con accesso DB, forza expire:
```bash
ssh root@157.180.39.57 "docker compose -f /root/progetti/wide-backend/docker-compose.prod.yml exec -T wide-db psql -U wide wide_db -c \"UPDATE \\\"Account\\\" SET \\\"invitationExpiresAt\\\" = NOW() - INTERVAL '1 hour' WHERE email='<TEST_EMAIL>';\""
```

Click sul link nell'email (vecchio). Aspettativa: pagina `/invite` mostra "Link non più valido". Tutti gli admin attivi ricevono email "Invito scaduto per {email} — azione richiesta". Nella lista accounts l'account target appare con badge "Invito scaduto" rosso + icona `!`.

- [ ] **Flow 4 — Re-invio**

Dalla lista accounts, sulla riga dell'account scaduto, click "Re-invia". Aspettativa: banner verde "Invito ri-inviato", l'account torna a "Invito in sospeso", l'utente riceve una nuova email con nuovo link funzionante.

- [ ] **Flow 5 — Throttling re-invio**

Subito dopo il Flow 4, click di nuovo "Re-invia". Aspettativa: banner rosso "Re-invio possibile tra circa 5 minuti".

- [ ] **Flow 6 — Race condition accept**

Apri lo stesso link di invito in 2 tab. In entrambe compila password e submit nello stesso momento. Aspettativa: una tab redirige a `/leads` (login OK), l'altra mostra "Link non più valido".

- [ ] **Flow 7 — Enumeration**

```bash
curl -i https://api.widestudiodigitale.com/api/v1/auth/invite/$(printf 'a%.0s' {1..64})
curl -i https://api.widestudiodigitale.com/api/v1/auth/invite/<TOKEN_SCADUTO_MA_REALE>
```

Entrambi restituiscono 410 con stesso body `{ "statusCode": 410, "message": "Link non più valido" }`.

---

## Self-Review

### Spec coverage

| Requisito spec | Task |
|---|---|
| §1 Panoramica + stati Account | Task 1 (schema), Task 14 (UI stati) |
| §2 Schema DB (5 campi + relation) | Task 1 |
| §3.1 POST /accounts modificato (password opzionale, 409 duplicato) | Task 6 |
| §3.2 POST /accounts/:id/resend-invite + throttling 5 min | Task 7 |
| §3.3 GET /auth/invite/:token + side effect alert | Task 8 |
| §3.4 POST /auth/accept-invite atomico | Task 9 |
| §3.5 Env INVITATION_TOKEN_TTL_HOURS | Task 2 |
| §4.1 Token gen (randomBytes 32 + SHA-256) | Task 5 |
| §4.2 Template invito | Task 3 |
| §4.3 Template alert | Task 4 |
| §4.4 Invio async fire-and-forget | Task 5 (con `.catch(logger.error)`) |
| §5.1 Modal password opzionale + messaggi post-submit | Task 13 |
| §5.2 Lista: stati + bottone Re-invia | Task 14 |
| §5.3 Pagina `/invite` | Task 12 |
| §5.4 Rotta in App.tsx | Task 12 |
| §5.5 AuthContext.setSession | Task 11 |
| §6.1 Rate limit pubblici 5/min | Task 8, Task 9 (decoratore Throttle) |
| §6.2 Enumeration: stesso 410 per inesistente/scaduto | Task 8 + Flow 7 |
| §6.3 Race condition accept | Task 9 (transazione) + Flow 6 |
| §6.4 Token leak + TTL breve + single-use | Task 1 (`@unique`), Task 9 (cancellazione post-accept) |
| §6.5 Delete cascade | Prisma default, nessuna azione specifica |
| §6.6 Self-invitation impossibile | Task 6 (JWT admin guard esistente) |
| §6.7 Messaggi errore UX (duplicate, throttle, rate limit, password, confirm) | Task 12 (pagina invite), Task 13 (modal), Task 14 (banner) |

### Type consistency

- Backend `AcceptInviteDto.token` → frontend `AcceptInvite.tsx` → usa stesso path `/auth/accept-invite` e body `{ token, password }`. OK.
- Frontend `Account.invitationExpiresAt?: string | null` (ISO string) ↔ backend Prisma `DateTime?`. Serializzato correttamente da NestJS. OK.
- `AuthTokens` type in frontend già esistente — Task 11 non lo modifica, solo aggiunge `setSession`. OK.
- `AccountRole` union identico in frontend e backend (`USER | ADMIN | SYSTEM_ADMIN`). OK.

### Placeholder scan

Nessun "TBD", "TODO", "implement later". Tutti i code block contengono codice concreto.
