-- =============================================
-- CyberFlow - Etapa 1: Portfolio + Áreas + RAG
-- Ejecutar en Supabase → SQL Editor
-- =============================================

-- 1. Agregar semáforo RAG a proyectos
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rag_status TEXT DEFAULT 'verde'
    CHECK (rag_status IN ('verde', 'amarillo', 'rojo')),
  ADD COLUMN IF NOT EXISTS rag_nota TEXT;

-- 2. Tabla de actualizaciones semanales del proyecto
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rag_status TEXT NOT NULL DEFAULT 'verde'
    CHECK (rag_status IN ('verde', 'amarillo', 'rojo')),
  resumen TEXT NOT NULL,
  logros TEXT,
  proximos_pasos TEXT,
  bloqueos TEXT,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de hitos (milestones)
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_curso', 'completado', 'retrasado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de riesgos
CREATE TABLE IF NOT EXISTS project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  probabilidad TEXT DEFAULT 'media'
    CHECK (probabilidad IN ('baja', 'media', 'alta')),
  impacto TEXT DEFAULT 'medio'
    CHECK (impacto IN ('bajo', 'medio', 'alto')),
  mitigacion TEXT,
  estado TEXT DEFAULT 'abierto'
    CHECK (estado IN ('abierto', 'mitigado', 'cerrado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;

-- 6. Políticas permisivas (ajustar según necesidad)
CREATE POLICY "allow_all_project_updates" ON project_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_risks" ON project_risks FOR ALL USING (true) WITH CHECK (true);

-- 7. Insertar áreas base de Accusys (si no existen)
INSERT INTO areas (nombre, descripcion, color)
VALUES
  ('Ciberseguridad',    'Área de Ciberseguridad',          '#3b82f6'),
  ('CAU - Servidores',  'Centro de Atención a Usuarios - Servidores', '#8b5cf6'),
  ('CAU Microinformática', 'Centro de Atención a Usuarios - Microinformática', '#10b981')
ON CONFLICT DO NOTHING;
