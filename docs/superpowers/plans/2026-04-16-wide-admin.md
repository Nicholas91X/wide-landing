# WIDE Admin Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Creare `wide-admin`, un'SPA React + Vite deployata su Vercel (`dashboard.widestudiodigitale.com`) per la gestione autenticata dei lead WIDE con RBAC a 3 livelli.

**Architecture:** React 19 + Vite + TypeScript puro. Auth JWT con refresh automatico via interceptor Axios. Routing SPA con react-router-dom. Stile Noir Editorial coerente con la landing (CSS inline, stessi token CSS). Nessuna libreria UI — componenti custom leggeri. Il backend `wide-backend` espone tutte le API necessarie.

**Tech Stack:** React 19, Vite 7, TypeScript, react-router-dom v7, Axios, CSS inline con design token

**Spec di riferimento:** `docs/superpowers/specs/2026-04-16-wide-lead-system-design.md` — Sezione 4

**Prerequisito:** `wide-backend` deve essere in esecuzione (locale o Hetzner). Configura `VITE_API_URL` nel `.env.local`.

---

## File Map

```
wide-admin/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    ← router con PrivateRoute
│   ├── api/
│   │   └── client.ts              ← Axios instance + interceptor refresh
│   ├── auth/
│   │   ├── AuthContext.tsx         ← context, useAuth hook
│   │   └── PrivateRoute.tsx        ← wrapper rotte protette
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Leads.tsx              ← lista lead con filtri
│   │   ├── LeadDetail.tsx         ← dettaglio + cronologia
│   │   ├── Accounts.tsx           ← gestione account (ADMIN+)
│   │   └── Profile.tsx            ← profilo personale
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Badge.tsx              ← badge stato lead colorato
│   │   ├── Spinner.tsx
│   │   └── Modal.tsx              ← modale confirm/form generica
│   └── types/
│       └── index.ts               ← Lead, Account, LeadActivity, Paginated
├── index.html
├── vite.config.ts
├── vercel.json                    ← SPA routing rewrite
├── .env.example
└── package.json
```

---

## Task 1: Scaffold + Configurazione Base

**Files:**
- Create: `wide-admin/` (nuova directory)
- Create: `src/types/index.ts`
- Create: `vite.config.ts`
- Create: `vercel.json`
- Create: `.env.example`

- [ ] **Step 1.1 — Crea il progetto Vite**

```bash
# Esegui FUORI da wide-landing, nella directory padre
cd /percorso/workspace
npm create vite@latest wide-admin -- --template react-ts
cd wide-admin
npm install
```

- [ ] **Step 1.2 — Installa dipendenze**

```bash
npm install react-router-dom axios
npm install --save-dev @types/node
```

- [ ] **Step 1.3 — Crea `src/types/index.ts`**

```typescript
export type LeadStatus =
  | 'NUOVO'
  | 'IN_LAVORAZIONE'
  | 'CONTATTATO'
  | 'QUALIFICATO'
  | 'CHIUSO_VINTO'
  | 'CHIUSO_PERSO';

export type AccountRole = 'SYSTEM_ADMIN' | 'ADMIN' | 'USER';

export interface Account {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  role: AccountRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  action: 'created' | 'status_changed' | 'note_updated';
  detail: string | null;
  createdAt: string;
  account: { id: string; nome: string; cognome: string } | null;
}

export interface Lead {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  settore: string;
  settoreCustom: string | null;
  servizio: string;
  status: LeadStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: LeadActivity[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  account: Pick<Account, 'id' | 'email' | 'nome' | 'cognome' | 'role'>;
}
```

- [ ] **Step 1.4 — Crea `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,   // porta diversa da wide-landing (5173)
  },
});
```

- [ ] **Step 1.5 — Crea `vercel.json`** (SPA routing)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 1.6 — Crea `.env.example`**

```env
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 1.7 — Aggiorna `index.html`**

Sostituisci il contenuto di `index.html` con:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WIDE Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --color-bg: #050505;
      --color-surface: #0e0e0e;
      --color-gold: #c5a55a;
      --color-gold-muted: rgba(197,165,90,0.35);
      --color-text-secondary: rgba(255,255,255,0.48);
      --color-text-muted: rgba(255,255,255,0.28);
      --color-border: rgba(255,255,255,0.07);
      --font-title: 'Outfit', sans-serif;
      --font-subtitle: 'Manrope', sans-serif;
      --font-body: 'Manrope', sans-serif;
    }
    body {
      background: var(--color-bg);
      color: #fff;
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }
    #root { min-height: 100vh; }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Manrope:wght@400;600;700&display=swap" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 1.8 — Crea `.env.local`**

```bash
echo "VITE_API_URL=http://localhost:3000" > .env.local
```

- [ ] **Step 1.9 — Verifica che il progetto si avvii**

```bash
npm run dev
```

Expected: `http://localhost:5174` apre il browser con la pagina Vite default.

- [ ] **Step 1.10 — Commit**

```bash
git init
git add .
git commit -m "feat: scaffold wide-admin React+Vite, tipi TypeScript, vercel.json SPA routing"
```

---

## Task 2: API Client + Auth Context

**Files:**
- Create: `src/api/client.ts`
- Create: `src/auth/AuthContext.tsx`
- Create: `src/auth/PrivateRoute.tsx`

- [ ] **Step 2.1 — Crea `src/api/client.ts`**

```typescript
import axios, { AxiosError } from 'axios';
import type { AuthTokens } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: allega access token ────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wide_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor: refresh token su 401 ───────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers!.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('wide_refresh_token');
    if (!refreshToken) {
      isRefreshing = false;
      localStorage.removeItem('wide_access_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<AuthTokens>(
        `${API_URL}/api/v1/auth/refresh`,
        { refreshToken },
      );
      localStorage.setItem('wide_access_token', data.accessToken);
      localStorage.setItem('wide_refresh_token', data.refreshToken);
      processQueue(null, data.accessToken);
      originalRequest.headers!.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);
      localStorage.removeItem('wide_access_token');
      localStorage.removeItem('wide_refresh_token');
      localStorage.removeItem('wide_account');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

- [ ] **Step 2.2 — Crea `src/auth/AuthContext.tsx`**

```tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import type { Account, AuthTokens } from '../types';

interface AuthContextValue {
  account: Pick<Account, 'id' | 'email' | 'nome' | 'cognome' | 'role'> | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AuthContextValue['account']>(() => {
    try {
      const raw = localStorage.getItem('wide_account');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<AuthTokens>('/auth/login', { email, password });
      localStorage.setItem('wide_access_token', data.accessToken);
      localStorage.setItem('wide_refresh_token', data.refreshToken);
      localStorage.setItem('wide_account', JSON.stringify(data.account));
      setAccount(data.account);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('wide_refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('wide_access_token');
    localStorage.removeItem('wide_refresh_token');
    localStorage.removeItem('wide_account');
    setAccount(null);
  }, []);

  return (
    <AuthContext.Provider value={{ account, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2.3 — Crea `src/auth/PrivateRoute.tsx`**

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { AccountRole } from '../types';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: AccountRole[];
}

export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { account } = useAuth();
  const location = useLocation();

  if (!account) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(account.role)) {
    return <Navigate to="/leads" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2.4 — Commit**

```bash
git add src/api/ src/auth/
git commit -m "feat: Axios client con refresh interceptor, AuthContext, PrivateRoute"
```

---

## Task 3: Componenti Base + Navbar

**Files:**
- Create: `src/components/Navbar.tsx`
- Create: `src/components/Badge.tsx`
- Create: `src/components/Spinner.tsx`
- Create: `src/components/Modal.tsx`

- [ ] **Step 3.1 — Crea `src/components/Badge.tsx`**

```tsx
import type { LeadStatus } from '../types';

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; color: string }> = {
  NUOVO:          { label: 'Nuovo',          bg: 'rgba(255,255,255,0.08)', color: '#fff' },
  IN_LAVORAZIONE: { label: 'In lavorazione', bg: 'rgba(197,165,90,0.15)', color: '#c5a55a' },
  CONTATTATO:     { label: 'Contattato',     bg: 'rgba(80,160,220,0.15)', color: '#50a0dc' },
  QUALIFICATO:    { label: 'Qualificato',    bg: 'rgba(80,200,140,0.15)', color: '#50c88c' },
  CHIUSO_VINTO:   { label: 'Chiuso vinto',   bg: 'rgba(60,180,100,0.20)', color: '#3cb464' },
  CHIUSO_PERSO:   { label: 'Chiuso perso',   bg: 'rgba(120,120,120,0.15)', color: 'rgba(255,255,255,0.4)' },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { label, bg, color } = STATUS_CONFIG[status] ?? STATUS_CONFIG.NUOVO;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      background: bg,
      color,
      fontSize: '0.68rem',
      fontFamily: 'var(--font-subtitle)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      borderRadius: 2,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3.2 — Crea `src/components/Spinner.tsx`**

```tsx
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid rgba(255,255,255,0.15)`,
      borderTopColor: 'var(--color-gold)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// Inietta keyframe una sola volta
if (typeof document !== 'undefined' && !document.getElementById('wide-spinner-style')) {
  const s = document.createElement('style');
  s.id = 'wide-spinner-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}
```

- [ ] **Step 3.3 — Crea `src/components/Modal.tsx`**

```tsx
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 1001,
        transform: 'translate(-50%, -50%)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '28px 32px',
        minWidth: 320, maxWidth: 520, width: '90vw',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0 }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '4px 8px' }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
```

- [ ] **Step 3.4 — Crea `src/components/Navbar.tsx`**

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { account, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = account?.role === 'ADMIN' || account?.role === 'SYSTEM_ADMIN';

  const linkStyle = (path: string): React.CSSProperties => ({
    color: location.pathname.startsWith(path)
      ? '#fff'
      : 'rgba(255,255,255,0.45)',
    textDecoration: 'none',
    fontSize: '0.72rem',
    fontFamily: 'var(--font-subtitle)',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
    borderBottom: location.pathname.startsWith(path)
      ? '1px solid var(--color-gold)'
      : '1px solid transparent',
    paddingBottom: 2,
  });

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(5,5,5,0.96)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 clamp(16px, 4vw, 40px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56,
    }}>
      {/* Logo */}
      <Link to="/leads" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'var(--font-title)',
          fontWeight: 900,
          fontSize: '1.1rem',
          letterSpacing: '-0.04em',
          color: '#fff',
        }}>
          WIDE
        </span>
        <span style={{
          fontSize: '0.6rem',
          fontFamily: 'var(--font-subtitle)',
          fontWeight: 600,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--color-gold)',
          marginLeft: 8,
        }}>
          Admin
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        <Link to="/leads" style={linkStyle('/leads')}>Lead</Link>
        {isAdmin && (
          <Link to="/accounts" style={linkStyle('/accounts')}>Account</Link>
        )}
      </div>

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: 'none', border: '1px solid var(--color-border)',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            padding: '6px 12px', fontSize: '0.72rem',
            fontFamily: 'var(--font-subtitle)', fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          {account?.nome} ▾
        </button>

        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              minWidth: 160, zIndex: 11,
            }}>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '10px 16px',
                  color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
                  fontSize: '0.8rem', fontFamily: 'var(--font-body)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                Profilo
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  background: 'none', border: 'none', textAlign: 'left',
                  color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                  fontSize: '0.8rem', fontFamily: 'var(--font-body)',
                }}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3.5 — Commit**

```bash
git add src/components/
git commit -m "feat: Badge, Spinner, Modal, Navbar"
```

---

## Task 4: App.tsx + Routing

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 4.1 — Aggiorna `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 4.2 — Aggiorna `src/App.tsx`**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './auth/PrivateRoute';
import { Navbar } from './components/Navbar';
import { useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Accounts from './pages/Accounts';
import Profile from './pages/Profile';

export default function App() {
  const { account } = useAuth();

  return (
    <>
      {account && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/leads" replace />} />
        <Route
          path="/leads"
          element={<PrivateRoute><Leads /></PrivateRoute>}
        />
        <Route
          path="/leads/:id"
          element={<PrivateRoute><LeadDetail /></PrivateRoute>}
        />
        <Route
          path="/accounts"
          element={
            <PrivateRoute roles={['ADMIN', 'SYSTEM_ADMIN']}>
              <Accounts />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={<PrivateRoute><Profile /></PrivateRoute>}
        />
      </Routes>
    </>
  );
}
```

- [ ] **Step 4.3 — Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: routing SPA con PrivateRoute e RBAC per /accounts"
```

---

## Task 5: Pagina Login

**Files:**
- Create: `src/pages/Login.tsx`

- [ ] **Step 5.1 — Crea `src/pages/Login.tsx`**

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '../components/Spinner';

export default function Login() {
  const { login, account } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/leads';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (account) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Credenziali non valide';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
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
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-title)', fontWeight: 900,
            fontSize: '3rem', letterSpacing: '-0.04em', color: '#fff',
          }}>
            WIDE
          </div>
          <div style={{
            fontSize: '0.6rem', fontFamily: 'var(--font-subtitle)',
            fontWeight: 700, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--color-gold)',
            marginTop: 4,
          }}>
            Admin Dashboard
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle} required disabled={loading}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle} required disabled={loading}
            />
          </div>

          {error && (
            <p style={{
              color: 'rgba(220,80,80,0.9)', fontSize: '0.8rem',
              fontFamily: 'var(--font-body)', marginBottom: 16,
              padding: '8px 12px', border: '1px solid rgba(220,50,50,0.3)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px 0',
              background: loading ? 'rgba(255,255,255,0.7)' : '#fff',
              color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-subtitle)', fontWeight: 700,
              fontSize: '0.8rem', letterSpacing: '0.18em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {loading ? <><Spinner size={16} /> Accesso…</> : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2 — Test login**

```bash
npm run dev
# Naviga a http://localhost:5174/login
# Inserisci le credenziali del SYSTEM_ADMIN creato dal backend
# Expected: redirect a /leads
```

- [ ] **Step 5.3 — Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: pagina Login con validazione e gestione errori"
```

---

## Task 6: Pagina Leads (lista)

**Files:**
- Create: `src/pages/Leads.tsx`

- [ ] **Step 6.1 — Crea `src/pages/Leads.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { StatusBadge } from '../components/Badge';
import { Spinner } from '../components/Spinner';
import type { Lead, Paginated, LeadStatus } from '../types';

const STATUSES: { value: LeadStatus | ''; label: string }[] = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'NUOVO', label: 'Nuovo' },
  { value: 'IN_LAVORAZIONE', label: 'In lavorazione' },
  { value: 'CONTATTATO', label: 'Contattato' },
  { value: 'QUALIFICATO', label: 'Qualificato' },
  { value: 'CHIUSO_VINTO', label: 'Chiuso vinto' },
  { value: 'CHIUSO_PERSO', label: 'Chiuso perso' },
];

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--color-border)',
  color: '#fff', fontSize: '0.85rem',
  fontFamily: 'var(--font-body)', outline: 'none', borderRadius: 0,
};

export default function Leads() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paginated<Lead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | ''>('');
  const [exporting, setExporting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data: result } = await api.get<Paginated<Lead>>('/leads', { params });
      setData(result);
    } catch {
      // errori gestiti dall'interceptor (es. 401 → redirect login)
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      const response = await api.get('/leads/export', {
        params, responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    padding: 'clamp(20px, 4vw, 40px)',
    maxWidth: 1200, margin: '0 auto',
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <p style={{ color: 'var(--color-gold)', fontSize: '0.68rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            WIDE Admin
          </p>
          <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
            Lead
          </h1>
        </div>
        <button
          onClick={handleExport} disabled={exporting}
          style={{
            padding: '9px 18px', background: 'transparent',
            border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontFamily: 'var(--font-subtitle)',
            fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.15em',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {exporting ? <Spinner size={14} /> : '↓'} Esporta Excel
        </button>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Cerca per nome, email, telefono…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, minWidth: 240, flex: 1 }}
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as LeadStatus | ''); setPage(1); }}
          style={{ ...inputStyle, minWidth: 180 }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Tabella */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Nome', 'Email', 'Servizio', 'Settore', 'Stato', 'Data'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 12px',
                      fontSize: '0.65rem', fontFamily: 'var(--font-subtitle)',
                      fontWeight: 700, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 12px', fontSize: '0.9rem', fontWeight: 600 }}>
                      {lead.nome} {lead.cognome}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {lead.email}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {lead.servizio}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {lead.settore === 'Altro' && lead.settoreCustom ? lead.settoreCustom : lead.settore}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(lead.createdAt).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                ←
              </button>
              <span style={{ padding: '6px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                {page} / {data.totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                →
              </button>
            </div>
          )}

          <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {data?.total ?? 0} lead totali
          </p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6.2 — Commit**

```bash
git add src/pages/Leads.tsx
git commit -m "feat: pagina Leads con tabella, filtri, paginazione, export Excel"
```

---

## Task 7: Pagina LeadDetail

**Files:**
- Create: `src/pages/LeadDetail.tsx`

- [ ] **Step 7.1 — Crea `src/pages/LeadDetail.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { StatusBadge } from '../components/Badge';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { useAuth } from '../auth/AuthContext';
import type { Lead, LeadStatus, LeadActivity } from '../types';

const STATUSES: LeadStatus[] = [
  'NUOVO', 'IN_LAVORAZIONE', 'CONTATTATO', 'QUALIFICATO', 'CHIUSO_VINTO', 'CHIUSO_PERSO',
];
const STATUS_LABELS: Record<LeadStatus, string> = {
  NUOVO: 'Nuovo', IN_LAVORAZIONE: 'In lavorazione', CONTATTATO: 'Contattato',
  QUALIFICATO: 'Qualificato', CHIUSO_VINTO: 'Chiuso vinto', CHIUSO_PERSO: 'Chiuso perso',
};
const ACTION_LABELS: Record<string, string> = {
  created: 'Lead creato', status_changed: 'Stato aggiornato', note_updated: 'Nota aggiornata',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account } = useAuth();
  const isAdmin = account?.role === 'ADMIN' || account?.role === 'SYSTEM_ADMIN';

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('NUOVO');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Lead>(`/leads/${id}`)
      .then(({ data }) => {
        setLead(data);
        setSelectedStatus(data.status);
        setNote(data.note ?? '');
      })
      .catch(() => navigate('/leads'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const updateStatus = async () => {
    if (!id || selectedStatus === lead?.status) return;
    setSaving(true);
    try {
      const { data } = await api.patch<Lead>(`/leads/${id}/status`, { status: selectedStatus });
      setLead(data);
    } finally {
      setSaving(false);
    }
    // Ricarica per aggiornare le activities
    const { data } = await api.get<Lead>(`/leads/${id}`);
    setLead(data);
  };

  const updateNote = async () => {
    if (!id) return;
    setSavingNote(true);
    try {
      await api.patch(`/leads/${id}/note`, { note });
      const { data } = await api.get<Lead>(`/leads/${id}`);
      setLead(data);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteLead = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/leads/${id}`);
      navigate('/leads');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={28} />
    </div>
  );
  if (!lead) return null;

  const fieldStyle: React.CSSProperties = {
    fontSize: '0.9rem', fontFamily: 'var(--font-body)', color: '#fff', margin: 0,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)', marginBottom: 4, display: 'block',
  };
  const sectionStyle: React.CSSProperties = {
    padding: 'clamp(20px, 4vw, 40px)',
    maxWidth: 900, margin: '0 auto',
  };
  const btnStyle = (primary = false): React.CSSProperties => ({
    padding: '9px 18px', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-subtitle)', fontWeight: 700,
    fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    background: primary ? '#fff' : 'rgba(255,255,255,0.06)',
    color: primary ? '#000' : 'rgba(255,255,255,0.6)',
  });

  return (
    <div style={sectionStyle}>
      {/* Back + header */}
      <button onClick={() => navigate('/leads')}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24, padding: 0 }}>
        ← Lead
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            {lead.nome} {lead.cognome}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={lead.status} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Ricevuto: {new Date(lead.createdAt).toLocaleString('it-IT')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Aggiornato: {new Date(lead.updatedAt).toLocaleString('it-IT')}
            </span>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setDeleteOpen(true)}
            style={{ ...btnStyle(), color: 'rgba(220,80,80,0.7)', border: '1px solid rgba(220,50,50,0.3)' }}>
            Elimina
          </button>
        )}
      </div>

      {/* Dati lead */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32, padding: '20px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        {[
          { label: 'Email', value: lead.email },
          { label: 'Telefono', value: lead.telefono },
          { label: 'Settore', value: lead.settore === 'Altro' && lead.settoreCustom ? `Altro — ${lead.settoreCustom}` : lead.settore },
          { label: 'Servizio', value: lead.servizio },
        ].map(({ label, value }) => (
          <div key={label}>
            <span style={labelStyle}>{label}</span>
            <p style={fieldStyle}>{value}</p>
          </div>
        ))}
      </div>

      {/* Aggiorna stato */}
      <div style={{ marginBottom: 24 }}>
        <span style={labelStyle}>Stato</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
            style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#fff', fontSize: '0.9rem', fontFamily: 'var(--font-body)', borderRadius: 0, outline: 'none' }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button onClick={updateStatus} disabled={saving || selectedStatus === lead.status}
            style={btnStyle(true)}>
            {saving ? <Spinner size={14} /> : 'Salva stato'}
          </button>
        </div>
      </div>

      {/* Note */}
      <div style={{ marginBottom: 32 }}>
        <span style={labelStyle}>Note interne</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: '#fff', fontSize: '0.9rem', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', borderRadius: 0 }}
        />
        <button onClick={updateNote} disabled={savingNote}
          style={{ ...btnStyle(true), marginTop: 8 }}>
          {savingNote ? <Spinner size={14} /> : 'Salva nota'}
        </button>
      </div>

      {/* Cronologia attività */}
      <div>
        <span style={{ ...labelStyle, marginBottom: 16 }}>Cronologia</span>
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {lead.activities?.map((act) => (
            <div key={act.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-gold)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                    {ACTION_LABELS[act.action] ?? act.action}
                  </span>
                  {act.detail && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                      {act.detail}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {act.account && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', display: 'block' }}>
                    {act.account.nome} {act.account.cognome}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {new Date(act.createdAt).toLocaleString('it-IT')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal elimina */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Elimina lead">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Stai per eliminare il lead di <strong style={{ color: '#fff' }}>{lead.nome} {lead.cognome}</strong>. Questa azione è irreversibile.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => setDeleteOpen(false)} style={btnStyle()}>Annulla</button>
          <button onClick={deleteLead} disabled={deleting}
            style={{ ...btnStyle(true), background: 'rgba(220,50,50,0.85)', color: '#fff' }}>
            {deleting ? <Spinner size={14} /> : 'Elimina definitivamente'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 7.2 — Commit**

```bash
git add src/pages/LeadDetail.tsx
git commit -m "feat: pagina LeadDetail con stato, note, cronologia attività, elimina"
```

---

## Task 8: Pagine Accounts e Profile

**Files:**
- Create: `src/pages/Accounts.tsx`
- Create: `src/pages/Profile.tsx`

- [ ] **Step 8.1 — Crea `src/pages/Accounts.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import type { Account, AccountRole } from '../types';

const ROLE_LABELS: Record<AccountRole, string> = {
  SYSTEM_ADMIN: 'System Admin',
  ADMIN: 'Admin',
  USER: 'User',
};

export default function Accounts() {
  const { account: me } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nome: '', cognome: '', role: 'USER' as AccountRole });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const isSysAdmin = me?.role === 'SYSTEM_ADMIN';

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Account[]>('/accounts');
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    setFormError('');
    setCreating(true);
    try {
      await api.post('/accounts', form);
      setCreateOpen(false);
      setForm({ email: '', password: '', nome: '', cognome: '', role: 'USER' });
      await fetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Errore nella creazione';
      setFormError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (acc: Account) => {
    await api.patch(`/accounts/${acc.id}`, { active: !acc.active });
    await fetch();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: '#fff', fontSize: '0.9rem',
    fontFamily: 'var(--font-body)', outline: 'none', borderRadius: 0,
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', fontFamily: 'var(--font-subtitle)',
    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'var(--color-gold)', marginBottom: 6,
  };

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
          Account
        </h1>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ padding: '9px 18px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-subtitle)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          + Nuovo account
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Nome', 'Email', 'Ruolo', 'Stato', 'Creato il', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.65rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 12px', fontSize: '0.9rem', fontWeight: 600 }}>
                  {acc.nome} {acc.cognome}
                </td>
                <td style={{ padding: '12px 12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {acc.email}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{
                    fontSize: '0.68rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: acc.role === 'SYSTEM_ADMIN' ? 'var(--color-gold)'
                      : acc.role === 'ADMIN' ? 'rgba(80,160,220,0.9)'
                      : 'rgba(255,255,255,0.5)',
                  }}>
                    {ROLE_LABELS[acc.role]}
                  </span>
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc.active ? 'rgba(60,180,100,0.8)' : 'rgba(220,80,80,0.6)' }}>
                    {acc.active ? 'Attivo' : 'Disattivato'}
                  </span>
                </td>
                <td style={{ padding: '12px 12px', fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(acc.createdAt).toLocaleDateString('it-IT')}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  {acc.id !== me?.id && (
                    <button
                      onClick={() => toggleActive(acc)}
                      style={{ background: 'none', border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-subtitle)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {acc.active ? 'Disattiva' : 'Riattiva'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal crea account */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuovo account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'nome', label: 'Nome', type: 'text' },
            { key: 'cognome', label: 'Cognome', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: 'Password', type: 'password' },
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
            <label style={labelStyle}>Ruolo</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AccountRole }))}
              style={inputStyle}
            >
              <option value="USER">User</option>
              {isSysAdmin && <option value="ADMIN">Admin</option>}
            </select>
          </div>

          {formError && (
            <p style={{ color: 'rgba(220,80,80,0.9)', fontSize: '0.8rem', margin: 0 }}>{formError}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setCreateOpen(false)}
              style={{ padding: '9px 16px', background: 'none', border: '1px solid var(--color-border)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'var(--font-subtitle)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Annulla
            </button>
            <button onClick={handleCreate} disabled={creating}
              style={{ padding: '9px 16px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-subtitle)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              {creating ? <><Spinner size={14} /> Creazione…</> : 'Crea account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 8.2 — Crea `src/pages/Profile.tsx`**

```tsx
import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '../components/Spinner';

export default function Profile() {
  const { account } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    setSaving(true);
    try {
      await api.post('/accounts/me/password', { currentPassword, newPassword });
      setMessage('Password aggiornata con successo.');
      setCurrentPassword(''); setNewPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Errore';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: '#fff', fontSize: '0.9rem',
    fontFamily: 'var(--font-body)', outline: 'none', borderRadius: 0,
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', fontFamily: 'var(--font-subtitle)',
    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'var(--color-gold)', marginBottom: 6,
  };

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        Profilo
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>
        {account?.nome} {account?.cognome} — {account?.email}
      </p>

      <form onSubmit={handleChangePassword}>
        <h3 style={{ fontFamily: 'var(--font-subtitle)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
          Cambia password
        </h3>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Password attuale</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} required autoComplete="current-password" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Nuova password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required autoComplete="new-password" minLength={8} />
        </div>
        {message && <p style={{ color: 'rgba(60,180,100,0.9)', fontSize: '0.8rem', marginBottom: 12 }}>{message}</p>}
        {error && <p style={{ color: 'rgba(220,80,80,0.9)', fontSize: '0.8rem', marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={saving}
          style={{ padding: '11px 24px', background: '#fff', color: '#000', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-subtitle)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving ? <><Spinner size={14} /> Salvataggio…</> : 'Aggiorna password'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 8.3 — Commit**

```bash
git add src/pages/Accounts.tsx src/pages/Profile.tsx
git commit -m "feat: pagine Accounts (CRUD con modal) e Profile (cambio password)"
```

---

## Task 9: Deploy su Vercel

- [ ] **Step 9.1 — Crea repository GitHub**

```bash
git remote add origin https://github.com/tuouser/wide-admin.git
git push -u origin main
```

- [ ] **Step 9.2 — Configura progetto Vercel**

1. Vai su [vercel.com](https://vercel.com) → New Project
2. Importa il repo `wide-admin`
3. Framework Preset: **Vite**
4. Settings → Environment Variables: aggiungi `VITE_API_URL` = `https://api.widestudiodigitale.com`
5. Deploy

- [ ] **Step 9.3 — Configura dominio custom**

In Vercel → Settings → Domains: aggiungi `dashboard.widestudiodigitale.com`.
Aggiungi il record CNAME nel tuo DNS provider:
```
dashboard.widestudiodigitale.com CNAME cname.vercel-dns.com
```

- [ ] **Step 9.4 — Verifica produzione**

```
https://dashboard.widestudiodigitale.com/login
→ login con SYSTEM_ADMIN
→ lista lead visibile
→ crea account USER → verifica che USER non veda /accounts
```

---

## Self-Review

**Spec coverage:**

| Requisito spec | Task |
|---------------|------|
| React + Vite + TypeScript | Task 1 |
| Axios con interceptor refresh | Task 2 |
| AuthContext + useAuth hook | Task 2 |
| PrivateRoute con RBAC | Task 2 |
| `vercel.json` SPA routing | Task 1 |
| Navbar con link ruolo-dipendenti | Task 3 |
| Pagina Login | Task 5 |
| Pagina Leads con tabella, filtri, paginazione | Task 6 |
| Pagina LeadDetail con stato, note, cronologia | Task 7 |
| Cronologia con autore e timestamp | Task 7 |
| Pagina Accounts (ADMIN+ visibile) | Task 8 |
| Crea account con ruoli permessi | Task 8 |
| Attiva/disattiva account | Task 8 |
| Pagina Profile + cambio password | Task 8 |
| Export Excel dal frontend | Task 6 |
| Deploy Vercel + dominio custom | Task 9 |
| Stile Noir Editorial, zero librerie UI | tutti i task |

**Nessun placeholder trovato.** Tutto il codice è completo.

**Consistenza tipi:** `Lead`, `Account`, `LeadActivity`, `Paginated`, `AuthTokens` definiti in `src/types/index.ts` Task 1, usati in tutti i componenti. `LeadStatus`, `AccountRole` consistenti in tipi e Badge. ✓
