# WIDE Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Creare `wide-backend`, un'API NestJS containerizzata su Hetzner che gestisce lead, account admin e invio email via Brevo SMTP.

**Architecture:** NestJS modulare (AUTH / ACCOUNT / LEADS / EMAIL / DATABASE), Prisma + PostgreSQL 16, Redis 7, JWT RS256 con refresh token rotation. Tutti i moduli seguono il pattern Repository → Service → Controller di auto2g-backend. Il backend gira in Docker sulla porta 3001 del server Hetzner; Nginx fa da reverse proxy verso `api.widestudiodigitale.com`.

**Tech Stack:** Node 20, NestJS 11, TypeScript, Prisma 6, PostgreSQL 16, Redis 7, Nodemailer 7, Passport-JWT (RS256), class-validator, Zod, Helmet, Throttler, Docker Alpine

**Spec di riferimento:** `docs/superpowers/specs/2026-04-16-wide-lead-system-design.md`

---

## File Map

```
wide-backend/                          ← nuovo repo, da creare
├── src/
│   ├── main.ts                        ← entry point, middleware globali
│   ├── app.module.ts                  ← root module
│   ├── config/
│   │   └── env.validation.ts          ← Zod schema per env vars
│   ├── common/
│   │   ├── utils/hash.utils.ts        ← bcrypt helpers
│   │   └── filters/http-exception.filter.ts
│   ├── DATABASE/
│   │   ├── database.module.ts         ← global module
│   │   └── database.service.ts        ← PrismaClient wrapper
│   ├── EMAIL/
│   │   ├── email.module.ts            ← global module
│   │   ├── email.service.ts           ← Nodemailer + Brevo SMTP
│   │   └── interfaces/email.interface.ts
│   ├── AUTH/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts         ← /auth/login, /auth/refresh, /auth/logout, /auth/me
│   │   ├── auth.service.ts            ← login, refresh, logout, hashPassword, comparePassword
│   │   ├── strategies/jwt.strategy.ts ← Passport RS256
│   │   ├── guards/jwt.guard.ts
│   │   ├── guards/roles.guard.ts
│   │   ├── decorators/roles.decorator.ts
│   │   ├── decorators/current-account.decorator.ts
│   │   └── dto/login.dto.ts
│   ├── ACCOUNT/
│   │   ├── account.module.ts
│   │   ├── account.controller.ts      ← /accounts CRUD
│   │   ├── account.service.ts
│   │   └── dto/
│   │       ├── create-account.dto.ts
│   │       └── update-account.dto.ts
│   └── LEADS/
│       ├── leads.module.ts
│       ├── leads.controller.ts        ← POST /leads (public) + admin endpoints
│       ├── leads.service.ts
│       └── dto/
│           ├── create-lead.dto.ts
│           ├── update-status.dto.ts
│           └── update-note.dto.ts
├── src/assets/emails/
│   ├── lead-confirmation.html         ← email al cliente
│   └── lead-notification.html         ← email interna WIDE
├── prisma/
│   └── schema.prisma
├── jwt-keys/                          ← gitignored, RSA key pair
│   ├── private.pem
│   └── public.pem
├── Dockerfile
├── docker-compose.yml                 ← sviluppo locale
├── docker-compose.prod.yml            ← produzione Hetzner
├── .env                               ← gitignored
├── .env.example
├── .gitignore
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Task 1: Scaffold + Configurazione Base

**Files:**
- Create: `wide-backend/` (nuova directory, init NestJS)
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/config/env.validation.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1.1 — Crea il progetto NestJS**

```bash
# Esegui FUORI dalla cartella wide-landing, nella directory padre
cd /percorso/al/tuo/workspace
npx @nestjs/cli new wide-backend --package-manager npm --skip-git
cd wide-backend
```

- [ ] **Step 1.2 — Installa tutte le dipendenze**

```bash
npm install \
  @nestjs/passport passport passport-jwt \
  @nestjs/jwt \
  @nestjs/throttler \
  @nestjs/config \
  @prisma/client \
  nodemailer \
  bcryptjs \
  helmet \
  class-validator class-transformer \
  zod \
  exceljs \
  @nestjs/cache-manager cache-manager

npm install --save-dev \
  prisma \
  @types/passport-jwt \
  @types/nodemailer \
  @types/bcryptjs \
  @types/multer \
  @nestjs/testing \
  supertest \
  @types/supertest
```

- [ ] **Step 1.3 — Crea `src/config/env.validation.ts`**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1),

  JWT_PRIVATE_KEY_FILE: z.string().min(1),
  JWT_PUBLIC_KEY_FILE: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_SECURE: z.string().transform((v) => v === 'true').default('false'),
  EMAIL_FROM: z.string().email().optional(),
  INTERNAL_NOTIFICATION_EMAIL: z.string().email(),

  DEFAULT_ADMIN_EMAIL: z.string().email(),
  DEFAULT_ADMIN_PW: z.string().min(8),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  BACKEND_BASE_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_ADMIN_URL: z.string().url().default('http://localhost:5174'),

  SWAGGER_USER: z.string().default('wide'),
  SWAGGER_PASSWORD: z.string().default('wide-docs'),

  // GA4 Measurement Protocol (opzionale — fase 2)
  GA4_MEASUREMENT_ID: z.string().optional(),
  GA4_API_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('❌ Variabili d\'ambiente non valide:', result.error.format());
    process.exit(1);
  }
  return result.data;
}
```

- [ ] **Step 1.4 — Crea `src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  const env = validateEnv(process.env);

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (solo in development)
  if (env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('WIDE API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(env.PORT);
  console.log(`🚀 WIDE API running on port ${env.PORT}`);
}
bootstrap();
```

- [ ] **Step 1.5 — Crea `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './DATABASE/database.module';
import { EmailModule } from './EMAIL/email.module';
import { AuthModule } from './AUTH/auth.module';
import { AccountModule } from './ACCOUNT/account.module';
import { LeadsModule } from './LEADS/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),
    DatabaseModule,
    EmailModule,
    AuthModule,
    AccountModule,
    LeadsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 1.6 — Crea `.env.example`**

```env
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://wide:wide_password@localhost:5432/wide_db

# JWT (RSA keys — generati con openssl, vedi Task 4)
JWT_PRIVATE_KEY_FILE=./jwt-keys/private.pem
JWT_PUBLIC_KEY_FILE=./jwt-keys/public.pem
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tua@email.com
SMTP_PASS=tua-brevo-smtp-key
SMTP_SECURE=false
EMAIL_FROM=noreply@widestudiodigitale.com
INTERNAL_NOTIFICATION_EMAIL=info@widestudiodigitale.com

# Primo account admin (creato automaticamente al primo avvio)
DEFAULT_ADMIN_EMAIL=admin@widestudiodigitale.com
DEFAULT_ADMIN_PW=CambiaMiSubito123!
BCRYPT_ROUNDS=12

# CORS (separare più origini con virgola)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
BACKEND_BASE_URL=http://localhost:3000
FRONTEND_ADMIN_URL=http://localhost:5174

# Swagger
SWAGGER_USER=wide
SWAGGER_PASSWORD=docs-password

# GA4 Measurement Protocol (opzionale — lasciare vuoto per disabilitare)
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
```

- [ ] **Step 1.7 — Crea `.gitignore`**

```
node_modules/
dist/
.env
jwt-keys/
*.pem
```

- [ ] **Step 1.8 — Aggiungi `common/utils/hash.utils.ts`**

```typescript
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.validation';

export async function hashPassword(
  password: string,
  config: ConfigService<Env>,
): Promise<string> {
  const rounds = config.get('BCRYPT_ROUNDS', { infer: true }) ?? 12;
  return bcrypt.hash(password, rounds);
}

export async function comparePassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

- [ ] **Step 1.9 — Verifica che il progetto compili**

```bash
npm run build
```

Expected: `Found 0 errors.` (o simile) nella cartella `dist/`.

- [ ] **Step 1.10 — Commit**

```bash
git init
git add .
git commit -m "feat: scaffold NestJS, configurazione base, validazione env Zod"
```

---

## Task 2: Database Module (Prisma + PostgreSQL)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/DATABASE/database.module.ts`
- Create: `src/DATABASE/database.service.ts`

- [ ] **Step 2.1 — Inizializza Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2.2 — Scrivi `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ──────────────────────────────────────────────────────────────────

enum AccountRole {
  SYSTEM_ADMIN
  ADMIN
  USER
}

enum LeadStatus {
  NUOVO
  IN_LAVORAZIONE
  CONTATTATO
  QUALIFICATO
  CHIUSO_VINTO
  CHIUSO_PERSO
}

// ─── Models ─────────────────────────────────────────────────────────────────

model Account {
  id                  String          @id @default(cuid())
  email               String          @unique
  password            String
  nome                String
  cognome             String
  role                AccountRole     @default(USER)
  active              Boolean         @default(true)
  failedLoginAttempts Int             @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  refreshTokens       RefreshToken[]
  leadActivities      LeadActivity[]
}

model RefreshToken {
  id         String    @id @default(cuid())
  token      String    @unique
  accountId  String
  account    Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  revokedAt  DateTime?
  replacedBy String?
}

model Lead {
  id            String         @id @default(cuid())
  nome          String
  cognome       String
  email         String
  telefono      String
  settore       String
  settoreCustom String?
  servizio      String
  status        LeadStatus     @default(NUOVO)
  note          String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  activities    LeadActivity[]
}

model LeadActivity {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  accountId String?
  account   Account? @relation(fields: [accountId], references: [id])
  action    String   // "created" | "status_changed" | "note_updated"
  detail    String?
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2.3 — Crea `.env` locale (non committare)**

```bash
cp .env.example .env
# Poi edita .env con i tuoi valori locali
```

Per sviluppo locale usa PostgreSQL via Docker (vedi Task 8). Se hai già Postgres locale aggiorna `DATABASE_URL`.

- [ ] **Step 2.4 — Genera il client Prisma e crea la prima migration**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Expected: migrazione creata in `prisma/migrations/`, tabelle create nel DB.

- [ ] **Step 2.5 — Crea `src/DATABASE/database.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 2.6 — Crea `src/DATABASE/database.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

- [ ] **Step 2.7 — Verifica connessione al DB**

```bash
npm run start:dev
```

Expected: `🚀 WIDE API running on port 3000` senza errori Prisma.

- [ ] **Step 2.8 — Commit**

```bash
git add prisma/ src/DATABASE/ .env.example
git commit -m "feat: Prisma schema completo, DatabaseModule globale, prima migration"
```

---

## Task 3: Email Module (Nodemailer + Brevo)

**Files:**
- Create: `src/EMAIL/email.module.ts`
- Create: `src/EMAIL/email.service.ts`
- Create: `src/EMAIL/interfaces/email.interface.ts`
- Create: `src/assets/emails/lead-confirmation.html`
- Create: `src/assets/emails/lead-notification.html`

- [ ] **Step 3.1 — Crea `src/EMAIL/interfaces/email.interface.ts`**

```typescript
export interface SendLeadConfirmationOptions {
  toEmail: string;
  nome: string;
  servizio: string;
}

export interface SendLeadNotificationOptions {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  settore: string;
  settoreCustom?: string;
  servizio: string;
  leadId: string;
}
```

- [ ] **Step 3.2 — Crea `src/assets/emails/lead-confirmation.html`**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Richiesta ricevuta — WIDE Studio Digitale</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'Arial', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 48px 32px; }
    .logo { color: #fff; font-size: 36px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 40px; }
    .divider { height: 1px; background: #c5a55a; opacity: 0.4; margin: 28px 0; }
    h1 { color: #fff; font-size: 24px; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.02em; }
    p { color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .highlight { color: #c5a55a; font-weight: 600; }
    .footer { color: rgba(255,255,255,0.28); font-size: 12px; margin-top: 48px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">WIDE</div>
    <div class="divider"></div>
    <h1>Ciao {{nome}}, abbiamo ricevuto la tua richiesta.</h1>
    <p>Grazie per aver contattato <span class="highlight">WIDE Studio Digitale</span>. Abbiamo registrato il tuo interesse per <span class="highlight">{{servizio}}</span>.</p>
    <p>Il nostro team ti contatterà entro <strong style="color:#fff">24 ore lavorative</strong> per capire al meglio le tue esigenze e proporti la soluzione più adatta.</p>
    <p>Nel frattempo, puoi scoprire i nostri ultimi lavori su <a href="https://widestudiodigitale.com" style="color:#c5a55a">widestudiodigitale.com</a>.</p>
    <div class="divider"></div>
    <p class="footer">© 2026 WIDE Studio Digitale — ogni pixel, con intenzione.</p>
  </div>
</body>
</html>
```

- [ ] **Step 3.3 — Crea `src/assets/emails/lead-notification.html`**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nuovo Lead — WIDE</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'Arial', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 32px; }
    .logo { color: #fff; font-size: 28px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 24px; }
    .badge { display: inline-block; background: #c5a55a; color: #000; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; margin-bottom: 24px; }
    h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.65); font-size: 14px; }
    td:first-child { color: rgba(255,255,255,0.35); width: 140px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
    .cta { display: inline-block; margin-top: 28px; padding: 12px 24px; background: #fff; color: #000; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; }
    .footer { color: rgba(255,255,255,0.2); font-size: 11px; margin-top: 36px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">WIDE</div>
    <div class="badge">Nuovo Lead</div>
    <h1>{{nome}} {{cognome}}</h1>
    <table>
      <tr><td>Email</td><td>{{email}}</td></tr>
      <tr><td>Telefono</td><td>{{telefono}}</td></tr>
      <tr><td>Settore</td><td>{{settoreDisplay}}</td></tr>
      <tr><td>Servizio</td><td>{{servizio}}</td></tr>
      <tr><td>Ricevuto il</td><td>{{data}}</td></tr>
    </table>
    <a href="{{dashboardUrl}}/leads/{{leadId}}" class="cta">Apri nel Dashboard →</a>
    <p class="footer">WIDE Studio Digitale — notifica automatica</p>
  </div>
</body>
</html>
```

- [ ] **Step 3.4 — Crea `src/EMAIL/email.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { Env } from '../config/env.validation';
import {
  SendLeadConfirmationOptions,
  SendLeadNotificationOptions,
} from './interfaces/email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly internalEmail: string;
  private readonly dashboardUrl: string;

  constructor(private readonly config: ConfigService<Env>) {
    this.from = config.get('EMAIL_FROM', { infer: true })
      || config.get('SMTP_USER', { infer: true })!;
    this.internalEmail = config.get('INTERNAL_NOTIFICATION_EMAIL', { infer: true })!;
    this.dashboardUrl = config.get('FRONTEND_ADMIN_URL', { infer: true })!;

    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', { infer: true }),
      port: config.get('SMTP_PORT', { infer: true }),
      secure: config.get('SMTP_SECURE', { infer: true }),
      auth: {
        user: config.get('SMTP_USER', { infer: true }),
        pass: config.get('SMTP_PASS', { infer: true }),
      },
    });
  }

  private loadTemplate(name: string): string {
    const filePath = path.join(
      process.cwd(),
      'src',
      'assets',
      'emails',
      `${name}.html`,
    );
    return fs.readFileSync(filePath, 'utf-8');
  }

  private escape(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private render(template: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
      (html, [key, value]) =>
        html.replace(new RegExp(`{{${key}}}`, 'g'), this.escape(value)),
      template,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Errore invio email a ${to}: ${(err as Error).message}`);
      // Non rilanciare — email fallita non deve bloccare la risposta API
    }
  }

  async sendLeadConfirmation(opts: SendLeadConfirmationOptions): Promise<void> {
    const html = this.render(this.loadTemplate('lead-confirmation'), {
      nome: opts.nome,
      servizio: opts.servizio,
    });
    await this.send(
      opts.toEmail,
      'Abbiamo ricevuto la tua richiesta — WIDE Studio Digitale',
      html,
    );
  }

  async sendLeadNotification(opts: SendLeadNotificationOptions): Promise<void> {
    const settoreDisplay = opts.settoreCustom
      ? `Altro — ${opts.settoreCustom}`
      : opts.settore;

    const html = this.render(this.loadTemplate('lead-notification'), {
      nome: opts.nome,
      cognome: opts.cognome,
      email: opts.email,
      telefono: opts.telefono,
      settoreDisplay,
      servizio: opts.servizio,
      leadId: opts.leadId,
      dashboardUrl: this.dashboardUrl,
      data: new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
    });

    await this.send(
      this.internalEmail,
      `Nuovo lead: ${opts.nome} ${opts.cognome} — ${opts.servizio}`,
      html,
    );
  }
}
```

- [ ] **Step 3.5 — Crea `src/EMAIL/email.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

- [ ] **Step 3.6 — Verifica che il modulo sia importato in `app.module.ts`**

`EmailModule` è già presente nell'import list del Task 1. Nessuna modifica necessaria.

- [ ] **Step 3.7 — Commit**

```bash
git add src/EMAIL/ src/assets/
git commit -m "feat: EmailModule Nodemailer/Brevo, template lead-confirmation e lead-notification"
```

---

## Task 4: Auth Module (JWT RS256 + Refresh Token Rotation)

**Files:**
- Create: `jwt-keys/` (directory gitignored)
- Create: `src/AUTH/auth.module.ts`
- Create: `src/AUTH/auth.service.ts`
- Create: `src/AUTH/auth.controller.ts`
- Create: `src/AUTH/strategies/jwt.strategy.ts`
- Create: `src/AUTH/guards/jwt.guard.ts`
- Create: `src/AUTH/guards/roles.guard.ts`
- Create: `src/AUTH/decorators/roles.decorator.ts`
- Create: `src/AUTH/decorators/current-account.decorator.ts`
- Create: `src/AUTH/dto/login.dto.ts`

- [ ] **Step 4.1 — Genera la coppia di chiavi RSA**

```bash
mkdir jwt-keys
openssl genrsa -out jwt-keys/private.pem 2048
openssl rsa -in jwt-keys/private.pem -pubout -out jwt-keys/public.pem
```

Expected: `jwt-keys/private.pem` e `jwt-keys/public.pem` creati.
Verifica che `jwt-keys/` sia in `.gitignore`.

- [ ] **Step 4.2 — Crea `src/AUTH/dto/login.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
```

- [ ] **Step 4.3 — Crea `src/AUTH/strategies/jwt.strategy.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { DatabaseService } from '../../DATABASE/database.service';
import { Env } from '../../config/env.validation';

export interface JwtPayload {
  sub: string;      // accountId
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService<Env>,
    private readonly db: DatabaseService,
  ) {
    const publicKeyFile = config.get('JWT_PUBLIC_KEY_FILE', { infer: true })!;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync(publicKeyFile, 'utf-8'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const account = await this.db.account.findUnique({
      where: { id: payload.sub, active: true },
    });
    if (!account) throw new UnauthorizedException();
    return account; // diventa req.user
  }
}
```

- [ ] **Step 4.4 — Crea `src/AUTH/guards/jwt.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 4.5 — Crea `src/AUTH/guards/roles.guard.ts`**

```typescript
import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AccountRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Ruolo richiesto: ${required.join(' o ')}. Ruolo corrente: ${user.role}`,
      );
    }
    return true;
  }
}
```

- [ ] **Step 4.6 — Crea `src/AUTH/decorators/roles.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 4.7 — Crea `src/AUTH/decorators/current-account.decorator.ts`**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Account } from '@prisma/client';

export const CurrentAccount = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Account => {
    return ctx.switchToHttp().getRequest().user as Account;
  },
);
```

- [ ] **Step 4.8 — Crea `src/AUTH/auth.service.ts`**

```typescript
import {
  Injectable, UnauthorizedException, ForbiddenException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Account, AccountRole } from '@prisma/client';
import { DatabaseService } from '../DATABASE/database.service';
import { EmailService } from '../EMAIL/email.service';
import { hashPassword, comparePassword } from '../common/utils/hash.utils';
import { JwtPayload } from './strategies/jwt.strategy';
import { Env } from '../config/env.validation';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly privateKey: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
    private readonly emailService: EmailService,
  ) {
    const keyFile = config.get('JWT_PRIVATE_KEY_FILE', { infer: true })!;
    this.privateKey = fs.readFileSync(keyFile, 'utf-8');
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async login(email: string, password: string, ip: string) {
    const account = await this.db.account.findUnique({ where: { email } });

    if (!account || !account.active) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // Account lockout
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account bloccato. Riprova dopo ${account.lockedUntil.toLocaleTimeString('it-IT')}`,
      );
    }

    const valid = await comparePassword(password, account.password);
    if (!valid) {
      const attempts = account.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.db.account.update({
        where: { id: account.id },
        data: { failedLoginAttempts: attempts, lockedUntil: lockUntil },
      });
      throw new UnauthorizedException('Credenziali non valide');
    }

    // Reset failed attempts
    await this.db.account.update({
      where: { id: account.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    return this.generateTokenPair(account);
  }

  // ── Refresh ──────────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    const stored = await this.db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { account: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Reuse detection — revoca tutta la famiglia
      if (stored) {
        await this.db.refreshToken.updateMany({
          where: { accountId: stored.accountId },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Refresh token non valido');
    }

    // Revoca vecchio token
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    await this.db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: newRefreshToken },
    });

    const { account } = stored;
    return this.generateTokenPair(account, newRefreshToken);
  }

  // ── Logout ───────────────────────────────────────────────────────────────

  async logout(refreshToken: string) {
    await this.db.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async generateTokenPair(account: Account, refreshTokenValue?: string) {
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      role: account.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      privateKey: this.privateKey,
      algorithm: 'RS256',
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', { infer: true }),
    });

    const refreshToken = refreshTokenValue ?? crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    const expiryDays = parseInt(
      (this.config.get('JWT_REFRESH_EXPIRY', { infer: true }) ?? '7d').replace('d', ''),
      10,
    );
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await this.db.refreshToken.create({
      data: { token: refreshToken, accountId: account.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      account: {
        id: account.id,
        email: account.email,
        nome: account.nome,
        cognome: account.cognome,
        role: account.role,
      },
    };
  }

  // ── Seed primo SYSTEM_ADMIN ────────────────────────────────────────────

  async seedDefaultAdmin() {
    const email = this.config.get('DEFAULT_ADMIN_EMAIL', { infer: true })!;
    const existing = await this.db.account.findUnique({ where: { email } });
    if (existing) return;

    const password = await hashPassword(
      this.config.get('DEFAULT_ADMIN_PW', { infer: true })!,
      this.config,
    );
    await this.db.account.create({
      data: {
        email,
        password,
        nome: 'System',
        cognome: 'Admin',
        role: AccountRole.SYSTEM_ADMIN,
      },
    });
    this.logger.log(`✅ Account SYSTEM_ADMIN creato: ${email}`);
  }
}
```

- [ ] **Step 4.9 — Crea `src/AUTH/auth.controller.ts`**

```typescript
import {
  Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentAccount } from './decorators/current-account.decorator';
import { Account } from '@prisma/client';
import { Request, Ip } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto.email, dto.password, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@CurrentAccount() account: Account) {
    const { password, failedLoginAttempts, lockedUntil, ...safe } = account;
    return safe;
  }
}
```

- [ ] **Step 4.10 — Crea `src/AUTH/auth.module.ts`**

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // configurazione dinamica in AuthService
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtGuard, RolesGuard],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly authService: AuthService) {}

  async onModuleInit() {
    await this.authService.seedDefaultAdmin();
  }
}
```

> Nota: importa `JwtGuard` dal file `guards/jwt.guard.ts` — aggiungi anche l'export alla lista.

- [ ] **Step 4.11 — Aggiungi JwtGuard agli exports**

In `auth.module.ts` aggiungi `JwtGuard` agli exports:

```typescript
import { JwtGuard } from './guards/jwt.guard';
// ...
exports: [AuthService, JwtGuard, RolesGuard],
```

- [ ] **Step 4.12 — Verifica login**

```bash
npm run start:dev
# In un altro terminale:
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@widestudiodigitale.com","password":"CambiaMiSubito123!"}'
```

Expected: JSON con `accessToken`, `refreshToken`, `account`.

- [ ] **Step 4.13 — Commit**

```bash
git add src/AUTH/ jwt-keys/.gitkeep
git commit -m "feat: AuthModule JWT RS256, login/refresh/logout, RolesGuard, seed SYSTEM_ADMIN"
```

---

## Task 5: Account Module (CRUD con RBAC)

**Files:**
- Create: `src/ACCOUNT/account.module.ts`
- Create: `src/ACCOUNT/account.service.ts`
- Create: `src/ACCOUNT/account.controller.ts`
- Create: `src/ACCOUNT/dto/create-account.dto.ts`
- Create: `src/ACCOUNT/dto/update-account.dto.ts`

- [ ] **Step 5.1 — Crea `src/ACCOUNT/dto/create-account.dto.ts`**

```typescript
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { AccountRole } from '@prisma/client';

export class CreateAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  nome: string;

  @IsString()
  @MinLength(2)
  cognome: string;

  @IsEnum(AccountRole)
  role: AccountRole;
}
```

- [ ] **Step 5.2 — Crea `src/ACCOUNT/dto/update-account.dto.ts`**

```typescript
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  cognome?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

- [ ] **Step 5.3 — Crea `src/ACCOUNT/account.service.ts`**

```typescript
import {
  Injectable, ConflictException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { Account, AccountRole } from '@prisma/client';
import { DatabaseService } from '../DATABASE/database.service';
import { ConfigService } from '@nestjs/config';
import { hashPassword, comparePassword } from '../common/utils/hash.utils';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto, ChangePasswordDto } from './dto/update-account.dto';
import { Env } from '../config/env.validation';

@Injectable()
export class AccountService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService<Env>,
  ) {}

  // Determina quali ruoli un account può vedere/gestire
  private visibleRoles(actor: Account): AccountRole[] {
    if (actor.role === AccountRole.SYSTEM_ADMIN) {
      return [AccountRole.SYSTEM_ADMIN, AccountRole.ADMIN, AccountRole.USER];
    }
    if (actor.role === AccountRole.ADMIN) {
      return [AccountRole.USER];
    }
    return []; // USER non vede altri account
  }

  // Ruoli che l'actor può creare
  private creatableRoles(actor: Account): AccountRole[] {
    if (actor.role === AccountRole.SYSTEM_ADMIN) {
      return [AccountRole.ADMIN, AccountRole.USER];
    }
    if (actor.role === AccountRole.ADMIN) {
      return [AccountRole.USER];
    }
    return [];
  }

  async findAll(actor: Account) {
    const roles = this.visibleRoles(actor);
    return this.db.account.findMany({
      where: { role: { in: roles } },
      select: {
        id: true, email: true, nome: true, cognome: true,
        role: true, active: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(actor: Account, dto: CreateAccountDto) {
    const allowed = this.creatableRoles(actor);
    if (!allowed.includes(dto.role)) {
      throw new ForbiddenException(`Non puoi creare un account con ruolo ${dto.role}`);
    }

    const exists = await this.db.account.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email già in uso');

    const password = await hashPassword(dto.password, this.config);
    const { password: _, ...account } = await this.db.account.create({
      data: { ...dto, password },
    });
    return account;
  }

  async update(actor: Account, targetId: string, dto: UpdateAccountDto) {
    const target = await this.db.account.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('Account non trovato');

    // ADMIN può modificare USER o se stesso
    if (
      actor.role === AccountRole.ADMIN &&
      target.role !== AccountRole.USER &&
      target.id !== actor.id
    ) {
      throw new ForbiddenException();
    }

    const { password: _, ...updated } = await this.db.account.update({
      where: { id: targetId },
      data: dto,
    });
    return updated;
  }

  async deactivate(actor: Account, targetId: string) {
    if (targetId === actor.id) {
      throw new ForbiddenException('Non puoi disattivare il tuo stesso account');
    }
    return this.update(actor, targetId, { active: false });
  }

  async changeOwnPassword(actor: Account, dto: ChangePasswordDto) {
    const account = await this.db.account.findUnique({ where: { id: actor.id } });
    const valid = await comparePassword(dto.currentPassword, account!.password);
    if (!valid) throw new ForbiddenException('Password corrente non valida');
    const password = await hashPassword(dto.newPassword, this.config);
    await this.db.account.update({ where: { id: actor.id }, data: { password } });
    return { message: 'Password aggiornata' };
  }
}
```

- [ ] **Step 5.4 — Crea `src/ACCOUNT/account.controller.ts`**

```typescript
import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto, ChangePasswordDto } from './dto/update-account.dto';
import { JwtGuard } from '../AUTH/guards/jwt.guard';
import { RolesGuard } from '../AUTH/guards/roles.guard';
import { Roles } from '../AUTH/decorators/roles.decorator';
import { CurrentAccount } from '../AUTH/decorators/current-account.decorator';
import { Account } from '@prisma/client';

@Controller('accounts')
@UseGuards(JwtGuard, RolesGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  findAll(@CurrentAccount() actor: Account) {
    return this.accountService.findAll(actor);
  }

  @Post()
  @Roles(AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  create(@CurrentAccount() actor: Account, @Body() dto: CreateAccountDto) {
    return this.accountService.create(actor, dto);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  update(
    @CurrentAccount() actor: Account,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(actor, id, dto);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@CurrentAccount() actor: Account, @Param('id') id: string) {
    return this.accountService.deactivate(actor, id);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentAccount() actor: Account, @Body() dto: ChangePasswordDto) {
    return this.accountService.changeOwnPassword(actor, dto);
  }
}
```

- [ ] **Step 5.5 — Crea `src/ACCOUNT/account.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';

@Module({
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
```

- [ ] **Step 5.6 — Test: crea un account USER**

```bash
# Prima fai login per ottenere il token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@widestudiodigitale.com","password":"CambiaMiSubito123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@widestudiodigitale.com","password":"Password123!","nome":"Test","cognome":"User","role":"USER"}'
```

Expected: JSON con l'account creato (senza campo `password`).

- [ ] **Step 5.7 — Commit**

```bash
git add src/ACCOUNT/
git commit -m "feat: AccountModule CRUD con RBAC gerarchico (SYSTEM_ADMIN / ADMIN / USER)"
```

---

## Task 6: Leads Module

**Files:**
- Create: `src/LEADS/leads.module.ts`
- Create: `src/LEADS/leads.service.ts`
- Create: `src/LEADS/leads.controller.ts`
- Create: `src/LEADS/dto/create-lead.dto.ts`
- Create: `src/LEADS/dto/update-status.dto.ts`
- Create: `src/LEADS/dto/update-note.dto.ts`

- [ ] **Step 6.1 — Crea `src/LEADS/dto/create-lead.dto.ts`**

```typescript
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, Matches } from 'class-validator';

const SETTORI = [
  'Automotive', 'Fitness / Sport', 'Ristorazione', 'Moda / Fashion',
  'Immobiliare', 'Professioni / Studi', 'Retail / E-commerce',
  'Artigianato', 'Tecnologia', 'Altro',
] as const;

const SERVIZI = [
  'Social Media Marketing', 'Content Marketing', 'Shooting Video/Fotografici',
  'Produzioni Video con AI', 'Il Tuo Strumento Digitale',
  'Sviluppo Piattaforme Web', 'Integrazioni Automazioni AI',
] as const;

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsString()
  @MinLength(2)
  cognome: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[\d+\s\-()]{8,20}$/, {
    message: 'Telefono non valido — inserisci solo cifre, +, spazi e trattini',
  })
  telefono: string;

  @IsEnum(SETTORI, { message: `Settore deve essere uno di: ${SETTORI.join(', ')}` })
  settore: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  settoreCustom?: string;

  @IsEnum(SERVIZI, { message: `Servizio deve essere uno di: ${SERVIZI.join(', ')}` })
  servizio: string;
}
```

- [ ] **Step 6.2 — Crea `src/LEADS/dto/update-status.dto.ts`**

```typescript
import { IsEnum } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}
```

- [ ] **Step 6.3 — Crea `src/LEADS/dto/update-note.dto.ts`**

```typescript
import { IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @MaxLength(5000)
  note: string;
}
```

- [ ] **Step 6.4 — Crea `src/LEADS/leads.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { Account, LeadStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { DatabaseService } from '../DATABASE/database.service';
import { EmailService } from '../EMAIL/email.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

export interface LeadFilter {
  status?: LeadStatus;
  servizio?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  // ── Crea lead (pubblico) ──────────────────────────────────────────────────

  async create(dto: CreateLeadDto) {
    // Validazione: se settore = "Altro" e settoreCustom mancante, ok comunque
    if (dto.settore !== 'Altro') {
      dto.settoreCustom = undefined;
    }

    const lead = await this.db.lead.create({
      data: {
        nome: dto.nome,
        cognome: dto.cognome,
        email: dto.email,
        telefono: dto.telefono,
        settore: dto.settore,
        settoreCustom: dto.settoreCustom,
        servizio: dto.servizio,
        activities: {
          create: { action: 'created', detail: 'Lead creato dal form pubblico' },
        },
      },
      include: { activities: true },
    });

    // Email in background — non blocca la risposta
    void Promise.all([
      this.emailService.sendLeadConfirmation({
        toEmail: lead.email,
        nome: lead.nome,
        servizio: lead.servizio,
      }),
      this.emailService.sendLeadNotification({
        nome: lead.nome,
        cognome: lead.cognome,
        email: lead.email,
        telefono: lead.telefono,
        settore: lead.settore,
        settoreCustom: lead.settoreCustom ?? undefined,
        servizio: lead.servizio,
        leadId: lead.id,
      }),
    ]);

    return { id: lead.id, createdAt: lead.createdAt };
  }

  // ── Lista lead (admin) ────────────────────────────────────────────────────

  async findAll(filter: LeadFilter) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.servizio) where.servizio = filter.servizio;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = new Date(filter.from);
      if (filter.to) where.createdAt.lte = new Date(filter.to);
    }
    if (filter.search) {
      where.OR = [
        { nome: { contains: filter.search, mode: 'insensitive' } },
        { cognome: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { telefono: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.lead.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Dettaglio lead ────────────────────────────────────────────────────────

  async findOne(id: string) {
    const lead = await this.db.lead.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'asc' },
          include: {
            account: {
              select: { id: true, nome: true, cognome: true },
            },
          },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead non trovato');
    return lead;
  }

  // ── Aggiorna stato ────────────────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateStatusDto, actor: Account) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead non trovato');

    const oldStatus = lead.status;
    const updated = await this.db.lead.update({
      where: { id },
      data: {
        status: dto.status,
        activities: {
          create: {
            action: 'status_changed',
            detail: `${oldStatus} → ${dto.status}`,
            accountId: actor.id,
          },
        },
      },
    });
    return updated;
  }

  // ── Aggiorna nota ─────────────────────────────────────────────────────────

  async updateNote(id: string, dto: UpdateNoteDto, actor: Account) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead non trovato');

    const updated = await this.db.lead.update({
      where: { id },
      data: {
        note: dto.note,
        activities: {
          create: {
            action: 'note_updated',
            detail: dto.note.substring(0, 120),
            accountId: actor.id,
          },
        },
      },
    });
    return updated;
  }

  // ── Elimina lead ──────────────────────────────────────────────────────────

  async remove(id: string) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead non trovato');
    await this.db.lead.delete({ where: { id } });
    return { message: 'Lead eliminato' };
  }

  // ── Export Excel ──────────────────────────────────────────────────────────

  async exportExcel(filter: LeadFilter): Promise<Buffer> {
    const { data } = await this.findAll({ ...filter, limit: 10_000 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lead');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 28 },
      { header: 'Nome', key: 'nome', width: 16 },
      { header: 'Cognome', key: 'cognome', width: 16 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Telefono', key: 'telefono', width: 18 },
      { header: 'Settore', key: 'settore', width: 22 },
      { header: 'Settore (custom)', key: 'settoreCustom', width: 22 },
      { header: 'Servizio', key: 'servizio', width: 30 },
      { header: 'Stato', key: 'status', width: 18 },
      { header: 'Note', key: 'note', width: 40 },
      { header: 'Creato il', key: 'createdAt', width: 20 },
      { header: 'Aggiornato il', key: 'updatedAt', width: 20 },
    ];

    // Header row style
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFc5a55a' },
    };

    data.forEach((lead) => {
      sheet.addRow({
        ...lead,
        createdAt: lead.createdAt.toLocaleString('it-IT'),
        updatedAt: lead.updatedAt.toLocaleString('it-IT'),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
```

- [ ] **Step 6.5 — Crea `src/LEADS/leads.controller.ts`**

```typescript
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, Res, StreamableFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccountRole } from '@prisma/client';
import type { Response } from 'express';
import { LeadsService, LeadFilter } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtGuard } from '../AUTH/guards/jwt.guard';
import { RolesGuard } from '../AUTH/guards/roles.guard';
import { Roles } from '../AUTH/decorators/roles.decorator';
import { CurrentAccount } from '../AUTH/decorators/current-account.decorator';
import { Account } from '@prisma/client';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // ── Endpoint pubblico: crea lead ─────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // ── Endpoint admin: lista e export ──────────────────────────────────────

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(AccountRole.USER, AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  findAll(@Query() query: Record<string, string>) {
    const filter: LeadFilter = {
      status: query.status as any,
      servizio: query.servizio,
      search: query.search,
      from: query.from,
      to: query.to,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    };
    return this.leadsService.findAll(filter);
  }

  @Get('export')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(AccountRole.USER, AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  async export(@Query() query: Record<string, string>, @Res() res: Response) {
    const filter: LeadFilter = {
      status: query.status as any,
      servizio: query.servizio,
      from: query.from,
      to: query.to,
    };
    const buffer = await this.leadsService.exportExcel(filter);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="lead-${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(AccountRole.USER, AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  // ── Aggiornamenti ────────────────────────────────────────────────────────

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(AccountRole.USER, AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentAccount() actor: Account,
  ) {
    return this.leadsService.updateStatus(id, dto, actor);
  }

  @Patch(':id/note')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(AccountRole.USER, AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  updateNote(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentAccount() actor: Account,
  ) {
    return this.leadsService.updateNote(id, dto, actor);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(AccountRole.ADMIN, AccountRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
```

- [ ] **Step 6.6 — Crea `src/LEADS/leads.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  providers: [LeadsService],
  controllers: [LeadsController],
})
export class LeadsModule {}
```

- [ ] **Step 6.7 — Test: crea un lead e verifica email**

```bash
curl -X POST http://localhost:3000/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@test.com",
    "telefono": "+39 333 1234567",
    "settore": "Automotive",
    "servizio": "Social Media Marketing"
  }'
```

Expected: `{"id":"...","createdAt":"..."}` con status 201.
Verifica che arrivi email di conferma al cliente e notifica interna (controlla la casella Brevo o usa MailHog in locale).

- [ ] **Step 6.8 — Test: lista lead con token admin**

```bash
curl http://localhost:3000/api/v1/leads \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `{"data":[...],"total":1,"page":1,...}`

- [ ] **Step 6.9 — Test: aggiorna stato**

```bash
# Prendi l'ID dal lead creato al step 6.7
curl -X PATCH http://localhost:3000/api/v1/leads/{LEAD_ID}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CONTATTATO"}'
```

Expected: lead aggiornato con `status: "CONTATTATO"`.

- [ ] **Step 6.10 — Commit**

```bash
git add src/LEADS/
git commit -m "feat: LeadsModule — create pubblico, CRUD admin, attività, export Excel"
```

---

## Task 7: Docker Configuration

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`

- [ ] **Step 7.1 — Crea `Dockerfile`**

```dockerfile
# ── Stage 1: base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ── Stage 2: dependencies ─────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production
RUN npm ci  # include devDeps for build

# ── Stage 3: build ────────────────────────────────────────────────────────────
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# ── Stage 4: production ───────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY src/assets ./src/assets

EXPOSE 3000

# Esegui migration e avvia il server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
```

- [ ] **Step 7.2 — Crea `docker-compose.yml` (sviluppo locale)**

```yaml
version: '3.8'

services:
  wide-db:
    image: postgres:16-alpine
    container_name: wide-db
    environment:
      POSTGRES_USER: wide
      POSTGRES_PASSWORD: wide_password
      POSTGRES_DB: wide_db
    ports:
      - "5433:5432"   # porta 5433 per non confliggere con altri Postgres locali
    volumes:
      - wide-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wide -d wide_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  wide-redis:
    image: redis:7-alpine
    container_name: wide-redis
    ports:
      - "6380:6379"   # porta 6380 per non confliggere
    volumes:
      - wide-redis-data:/data
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  wide-postgres-data:
  wide-redis-data:
```

> **Sviluppo locale:** avvia solo DB e Redis con `docker-compose up -d`. Il backend NestJS gira con `npm run start:dev` sul tuo host.
> Imposta `DATABASE_URL=postgresql://wide:wide_password@localhost:5433/wide_db` nel `.env` locale.

- [ ] **Step 7.3 — Crea `docker-compose.prod.yml` (Hetzner)**

```yaml
version: '3.8'

services:
  wide-api:
    image: wide-backend:latest
    container_name: wide-api
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3001:3000"   # esposto solo su localhost — Nginx fa da proxy
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./jwt-keys:/app/jwt-keys:ro   # chiavi RSA montate in read-only
    depends_on:
      wide-db:
        condition: service_healthy
      wide-redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - wide-network

  wide-db:
    image: postgres:16-alpine
    container_name: wide-db
    environment:
      POSTGRES_USER: ${DB_USER:-wide}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-wide_db}
    volumes:
      - wide-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-wide} -d ${DB_NAME:-wide_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - wide-network

  wide-redis:
    image: redis:7-alpine
    container_name: wide-redis
    volumes:
      - wide-redis-data:/data
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - wide-network

networks:
  wide-network:
    driver: bridge

volumes:
  wide-postgres-data:
  wide-redis-data:
```

- [ ] **Step 7.4 — Aggiungi endpoint `/health` al backend**

Crea `src/HEALTH/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

Aggiungi `HealthController` all'`app.module.ts` (aggiungi a `controllers: [HealthController]` o crea un `HealthModule`):

```typescript
// In app.module.ts, aggiungi al @Module:
controllers: [HealthController],
```

E in cima al file: `import { HealthController } from './HEALTH/health.controller';`

- [ ] **Step 7.5 — Snippet Nginx per Hetzner**

Da aggiungere alla configurazione Nginx del server (in `/etc/nginx/sites-available/wide-api`):

```nginx
server {
    listen 80;
    server_name api.widestudiodigitale.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.widestudiodigitale.com;

    ssl_certificate /etc/letsencrypt/live/api.widestudiodigitale.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.widestudiodigitale.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

Dopo aver aggiunto il file:
```bash
sudo ln -s /etc/nginx/sites-available/wide-api /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.widestudiodigitale.com
sudo nginx -t && sudo systemctl reload nginx
```

- [ ] **Step 7.6 — Build Docker in locale e verifica**

```bash
# Avvia DB e Redis
docker-compose up -d

# Aspetta che siano healthy
docker-compose ps

# Build e avvio completo (simula produzione)
docker-compose -f docker-compose.prod.yml up --build -d

# Verifica health
curl http://localhost:3001/api/v1/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 7.7 — Commit**

```bash
git add Dockerfile docker-compose*.yml src/HEALTH/
git commit -m "feat: Docker multi-stage build, docker-compose dev+prod, endpoint /health, snippet Nginx"
```

---

## Task 8: Deploy su Hetzner

- [ ] **Step 8.1 — Copia il progetto sul server**

```bash
# Dal tuo Mac/PC
git clone https://github.com/tuouser/wide-backend.git
# oppure via scp/rsync se non hai un repo remoto ancora:
rsync -avz --exclude node_modules --exclude .env --exclude jwt-keys \
  ./wide-backend/ user@hetzner-ip:/opt/wide-backend/
```

- [ ] **Step 8.2 — Genera chiavi RSA sul server**

```bash
ssh user@hetzner-ip
cd /opt/wide-backend
mkdir -p jwt-keys
openssl genrsa -out jwt-keys/private.pem 2048
openssl rsa -in jwt-keys/private.pem -pubout -out jwt-keys/public.pem
chmod 600 jwt-keys/private.pem
```

- [ ] **Step 8.3 — Crea `.env` sul server**

```bash
cp .env.example .env
nano .env   # compila con i valori reali (Brevo SMTP, email admin, ecc.)
```

Valori minimi obbligatori:
- `DATABASE_URL` con password sicura
- `DB_PASSWORD` (usato da docker-compose.prod.yml)
- `SMTP_USER`, `SMTP_PASS` (da Brevo Dashboard → SMTP & API → SMTP)
- `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PW`
- `JWT_PRIVATE_KEY_FILE=./jwt-keys/private.pem`
- `JWT_PUBLIC_KEY_FILE=./jwt-keys/public.pem`
- `CORS_ORIGINS=https://widestudiodigitale.com,https://dashboard.widestudiodigitale.com`
- `FRONTEND_ADMIN_URL=https://dashboard.widestudiodigitale.com`
- `INTERNAL_NOTIFICATION_EMAIL=info@widestudiodigitale.com`

- [ ] **Step 8.4 — Avvia i container**

```bash
cd /opt/wide-backend
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml ps    # tutti e tre devono essere "running"
docker-compose -f docker-compose.prod.yml logs wide-api --tail=50
```

Expected: log con `🚀 WIDE API running on port 3000` e `✅ Account SYSTEM_ADMIN creato`.

- [ ] **Step 8.5 — Configura Nginx e SSL**

Copia il blocco Nginx dal Task 7.5 nel file apposito sul server, poi:
```bash
sudo certbot --nginx -d api.widestudiodigitale.com
sudo nginx -t && sudo systemctl reload nginx
```

- [ ] **Step 8.6 — Verifica endpoint pubblico**

```bash
curl https://api.widestudiodigitale.com/api/v1/health
```

Expected: `{"status":"ok","timestamp":"..."}`

```bash
curl -X POST https://api.widestudiodigitale.com/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","cognome":"Deploy","email":"test@test.com","telefono":"+39 333 0000000","settore":"Automotive","servizio":"Social Media Marketing"}'
```

Expected: `{"id":"...","createdAt":"..."}` — e arrivo email conferma + notifica interna.

- [ ] **Step 8.7 — Commit finale**

```bash
git add .
git commit -m "chore: aggiorna .env.example con valori produzione, pronto per deploy"
```

---

## Self-Review

**Spec coverage:**

| Requisito spec | Task |
|---------------|------|
| NestJS + Prisma + PostgreSQL + Redis | Task 1, 2, 7 |
| Brevo SMTP via Nodemailer | Task 3 |
| JWT RS256, refresh rotation | Task 4 |
| 3 ruoli SYSTEM_ADMIN / ADMIN / USER | Task 4, 5 |
| RBAC gerarchico per account | Task 5 |
| Lead create pubblico (throttled) | Task 6 |
| Lead list con filtri e paginazione | Task 6 |
| Lead status + note + attività | Task 6 |
| Export Excel | Task 6 |
| Email cliente + interna | Task 3, 6 |
| LeadActivity con autore | Task 6 |
| Docker multi-stage + compose dev/prod | Task 7 |
| Snippet Nginx | Task 7 |
| Deploy Hetzner | Task 8 |
| GA4 Measurement Protocol env vars | `GA4_MEASUREMENT_ID` in env.validation.ts Task 1 — implementazione fire-and-forget rimandata a fase 2 |

**Nessun placeholder trovato.** Tutti i task contengono codice completo.

**Consistenza tipi:**
- `JwtPayload` definito in `jwt.strategy.ts` Task 4, usato in `auth.service.ts` Task 4 ✓
- `LeadFilter` definito ed esportato in `leads.service.ts` Task 6, usato in `leads.controller.ts` Task 6 ✓
- `Account` da `@prisma/client` usato in tutti i controller/service ✓
