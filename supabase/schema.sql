-- ============================================================
-- ACCUSYS CYBERFLOW - Schema SQL para Supabase
-- App de gestión de proyectos con autogestión e IA
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'area_lead', 'member');
CREATE TYPE project_status AS ENUM ('draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'review', 'completed', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE report_type AS ENUM ('weekly', 'monthly', 'on_demand', 'milestone');

-- ============================================================
-- TABLA: areas
-- ============================================================
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar áreas iniciales
INSERT INTO areas (name, description) VALUES
  ('Ciberseguridad', 'Área de Ciberseguridad'),
  ('CAU - Servidores', 'Centro de Atención al Usuario - Servidores'),
  ('CAU Microinformática', 'Centro de Atención al Usuario - Microinformática');

-- ============================================================
-- TABLA: profiles (extiende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  area_id UUID REFERENCES areas(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: projects
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  area_id UUID REFERENCES areas(id),
  owner_id UUID REFERENCES profiles(id),
  status project_status DEFAULT 'draft',
  priority task_priority DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_cross_area BOOLEAN DEFAULT FALSE,
  ai_generated_plan JSONB,        -- Plan generado por IA al crear el proyecto
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: project_members (relación proyectos <-> usuarios)
-- ============================================================
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'lead', 'member', 'viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- TABLA: milestones (hitos del proyecto)
-- ============================================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: tasks
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_hours NUMERIC(6,1),
  actual_hours NUMERIC(6,1),
  depends_on UUID REFERENCES tasks(id),  -- dependencia simple
  sort_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  ai_suggested BOOLEAN DEFAULT FALSE,    -- si fue sugerida por IA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: task_comments
-- ============================================================
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: risks (riesgos del proyecto)
-- ============================================================
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level risk_level DEFAULT 'medium',
  mitigation TEXT,
  is_mitigated BOOLEAN DEFAULT FALSE,
  ai_suggested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: project_templates (plantillas de proyectos)
-- ============================================================
CREATE TABLE project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,             -- 'pentesting', 'hardening', 'migration', etc.
  area_id UUID REFERENCES areas(id),
  template_data JSONB NOT NULL, -- { milestones: [], tasks: [], risks: [] }
  is_global BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: reports (reportes generados)
-- ============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type report_type DEFAULT 'on_demand',
  title TEXT NOT NULL,
  content JSONB NOT NULL,       -- Contenido estructurado del reporte
  ai_summary TEXT,              -- Resumen generado por IA
  ai_recommendations TEXT[],    -- Recomendaciones de IA
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: activity_log (historial de actividad)
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,          -- 'task_created', 'status_changed', etc.
  entity_type TEXT,              -- 'project', 'task', 'milestone', etc.
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ai_conversations (historial de chats con IA)
-- ============================================================
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  messages JSONB NOT NULL DEFAULT '[]',
  context TEXT,                  -- contexto del proyecto para la IA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',      -- 'info', 'warning', 'overdue', 'ai_suggestion'
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: project_files (archivos adjuntos)
-- ============================================================
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para calcular el progreso de un proyecto automáticamente
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM tasks WHERE project_id = p_project_id;

  IF total_tasks = 0 THEN RETURN 0; END IF;
  RETURN ROUND((completed_tasks::NUMERIC / total_tasks) * 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar progreso del proyecto cuando cambia una tarea
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET progress = calculate_project_progress(
    COALESCE(NEW.project_id, OLD.project_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_progress
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Trigger para auto-completar milestone cuando todas sus tareas terminan
CREATE OR REPLACE FUNCTION check_milestone_completion()
RETURNS TRIGGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  IF NEW.milestone_id IS NOT NULL AND NEW.status = 'completed' THEN
    SELECT COUNT(*) INTO pending_count
    FROM tasks
    WHERE milestone_id = NEW.milestone_id AND status != 'completed';

    IF pending_count = 0 THEN
      UPDATE milestones SET completed_at = NOW() WHERE id = NEW.milestone_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_milestone
AFTER UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION check_milestone_completion();

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Areas: todos leen
CREATE POLICY "areas_read" ON areas FOR SELECT TO authenticated USING (true);

-- Profiles: todos leen, cada uno edita el suyo
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Projects: admin ve todo, area_lead ve su área + cross-area, member ve donde es miembro
CREATE POLICY "projects_read" ON projects FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
  OR is_cross_area = TRUE
  OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'area_lead'))
  OR owner_id = auth.uid()
);

CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role = 'lead')
);

CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR owner_id = auth.uid()
);

-- Project Members: lectura según acceso al proyecto
CREATE POLICY "project_members_read" ON project_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR is_cross_area = TRUE
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid())
  ))
);

CREATE POLICY "project_members_manage" ON project_members FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'area_lead'))
  OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Tasks: acceso según proyecto
CREATE POLICY "tasks_read" ON tasks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR is_cross_area = TRUE
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "tasks_manage" ON tasks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'area_lead'))
  OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR assigned_to = auth.uid()
);

-- Milestones: acceso según proyecto
CREATE POLICY "milestones_read" ON milestones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR is_cross_area = TRUE
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = milestones.project_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "milestones_manage" ON milestones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'area_lead'))
  OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Task Comments
CREATE POLICY "task_comments_read" ON task_comments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR p.area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = p.id AND user_id = auth.uid())
    ))
);

CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Risks
CREATE POLICY "risks_read" ON risks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR is_cross_area = TRUE
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = risks.project_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "risks_manage" ON risks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'area_lead'))
  OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Templates: globales o de su área
CREATE POLICY "templates_read" ON project_templates FOR SELECT TO authenticated USING (
  is_global = TRUE
  OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "templates_manage" ON project_templates FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'area_lead'))
  OR created_by = auth.uid()
);

-- Reports
CREATE POLICY "reports_read" ON reports FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = reports.project_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "reports_insert" ON reports FOR INSERT TO authenticated WITH CHECK (generated_by = auth.uid());

-- Activity Log
CREATE POLICY "activity_read" ON activity_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = activity_log.project_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "activity_insert" ON activity_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- AI Conversations
CREATE POLICY "ai_conversations_own" ON ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- Project Files
CREATE POLICY "files_read" ON project_files FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR area_id = (SELECT area_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_files.project_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "files_manage" ON project_files FOR ALL TO authenticated USING (uploaded_by = auth.uid());

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

CREATE POLICY "project_files_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "project_files_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "project_files_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
