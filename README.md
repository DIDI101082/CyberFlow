# Accusys CyberFlow

App de gestión de proyectos para el área de Ciberseguridad y Tecnología de Accusys Technology.

## Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Auth:** Microsoft Entra ID (Azure AD) via MSAL
- **Deploy:** Vercel

## Setup

### 1. Clonar y instalar

```bash
npm install
```

### 2. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_AZURE_CLIENT_ID=
NEXT_PUBLIC_AZURE_TENANT_ID=
NEXT_PUBLIC_AZURE_REDIRECT_URI=
```

### 3. Base de datos

Ejecutar el migration en Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Entra ID (Azure AD)

En el portal de Azure → App registrations:
1. Crear nueva app → Single-page application
2. Redirect URI: `http://localhost:3000/auth/callback` (dev) y la URL de Vercel (prod)
3. Copiar Client ID y Tenant ID al `.env.local`

### 5. Correr en desarrollo

```bash
npm run dev
```

## Estructura

```
src/
├── app/
│   ├── dashboard/        # Dashboard general
│   ├── projects/         # Lista y detalle de proyectos
│   │   └── new/          # Crear proyecto
│   ├── tasks/            # Tareas
│   └── login/            # Login con Entra ID
├── components/
│   ├── layout/           # Sidebar, Header
│   ├── projects/         # Componentes de proyectos
│   └── tasks/            # Componentes de tareas
├── lib/
│   ├── supabase.ts       # Cliente Supabase
│   └── msal.ts           # Config Entra ID
└── types/                # TypeScript types
```

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Ve y gestiona todo (subdirectores) |
| `area_lead` | Ve su área + proyectos transversales |
| `member` | Ve los proyectos donde está asignado |
