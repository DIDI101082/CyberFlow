# Accusys CyberFlow

Gestión inteligente de proyectos con IA para Accusys Technology.

## Stack

- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage, RLS)
- **IA:** OpenAI API (gpt-4o-mini) para Wizard y Reportes
- **Deploy:** Vercel

## Funcionalidades

### Core
- Dashboard con métricas, proyectos activos y tareas vencidas
- CRUD de proyectos con milestones y tareas
- Roles: admin, area_lead, member
- Proyectos por área con soporte para proyectos transversales
- RLS completo (cada usuario ve solo lo que le corresponde)

### Autogestión con IA
- **Wizard de Proyecto con IA:** Al crear un proyecto, un asistente genera automáticamente tareas, hitos, riesgos y recomendaciones basados en la descripción y objetivos
- **Reportes Automáticos con IA:** Desde cada proyecto se puede generar un reporte de estado que incluye resumen ejecutivo y recomendaciones generadas por IA
- **Seguimiento Automático:** Progreso calculado automáticamente según tareas completadas, semáforos de estado, alertas de vencimiento

## Setup

### 1. Clonar e instalar

```bash
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir al SQL Editor y ejecutar `supabase/schema.sql`
3. Copiar `.env.local.example` a `.env.local` y completar las variables:

```bash
cp .env.local.example .env.local
```

### 3. Configurar OpenAI (opcional)

Para las funcionalidades de IA, agregar la API key de OpenAI en `.env.local`.
Si no se configura, la app funciona igual con planes de ejemplo.

### 4. Ejecutar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 5. Primer usuario

1. Registrarse desde la app
2. En Supabase > Table Editor > profiles, cambiar el `role` a `admin`
3. Asignar un `area_id` si corresponde

## Deploy en Vercel

1. Importar el repo en Vercel
2. Agregar las variables de entorno (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY)
3. Deploy
