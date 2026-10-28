-- ============================================================
-- Accusys CyberFlow - Schema inicial
-- ============================================================

-- Áreas de la empresa
CREATE TABLE areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios (sincronizados con Entra ID)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entra_id TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  area_id UUID REFERENCES areas(id),
  rol TEXT NOT NULL DEFAULT 'member' CHECK (rol IN ('admin', 'area_lead', 'member')),
  avatar_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etiquetas
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proyectos
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  area_id UUID REFERENCES areas(id),
  estado TEXT NOT NULL DEFAULT 'planificado' CHECK (estado IN ('planificado', 'en_curso', 'pausado', 'completado', 'cancelado')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  fecha_inicio DATE,
  fecha_fin_estimada DATE,
  fecha_fin_real DATE,
  creado_por UUID REFERENCES users(id),
  es_transversal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proyectos transversales (muchos a muchos con áreas)
CREATE TABLE project_areas (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, area_id)
);

-- Relación proyectos ↔ etiquetas
CREATE TABLE project_tags (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- Miembros de proyectos
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rol TEXT DEFAULT 'member' CHECK (rol IN ('lead', 'member')),
  PRIMARY KEY (project_id, user_id)
);

-- Tareas
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'bloqueada', 'completada')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  asignado_a UUID REFERENCES users(id),
  fecha_vencimiento DATE,
  orden INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archivos adjuntos
CREATE TABLE attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT,
  tamanio BIGINT,
  subido_por UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Triggers para updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Admins ven todo
CREATE POLICY "admins_all" ON projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE entra_id = auth.uid()::text AND rol = 'admin')
  );

-- Area leads ven su área + transversales
CREATE POLICY "area_lead_projects" ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.entra_id = auth.uid()::text
      AND (u.rol = 'area_lead' OR u.rol = 'admin')
      AND (u.area_id = projects.area_id OR projects.es_transversal = TRUE)
    )
  );

-- Members ven proyectos donde están asignados
CREATE POLICY "member_projects" ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE u.entra_id = auth.uid()::text
      AND pm.project_id = projects.id
    )
  );

-- ============================================================
-- Datos iniciales
-- ============================================================
INSERT INTO areas (nombre, descripcion, color) VALUES
  ('Ciberseguridad', 'Área de Ciberseguridad', '#EF4444'),
  ('CAU - Servidores', 'Centro de Atención al Usuario - Servidores', '#3B82F6'),
  ('CAU Microinformática', 'Centro de Atención al Usuario - Microinformática', '#10B981'),
  ('General', 'Proyectos corporativos generales', '#8B5CF6');

INSERT INTO tags (nombre, color) VALUES
  ('Urgente', '#EF4444'),
  ('Infraestructura', '#3B82F6'),
  ('Seguridad', '#F59E0B'),
  ('Red', '#10B981'),
  ('Software', '#8B5CF6'),
  ('Hardware', '#6B7280');
