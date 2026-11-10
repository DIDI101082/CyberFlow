-- ================================================
-- TABLAS ADICIONALES: Comentarios y Activity Log
-- Ejecutar DESPUÉS del schema principal
-- ================================================

-- Tabla de comentarios en tareas
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select" ON task_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "task_comments_insert" ON task_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_comments_delete" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Tabla de historial de actividad
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger: registrar actividad cuando se crea una tarea
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, entity_name)
    VALUES (NEW.project_id, NEW.assigned_to, 'created', 'task', NEW.id, NEW.title);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, entity_name, details)
      VALUES (NEW.project_id, NEW.assigned_to, 'status_change', 'task', NEW.id, NEW.title,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, entity_name)
      VALUES (NEW.project_id, NEW.assigned_to, 'completed', 'task', NEW.id, NEW.title);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_activity_trigger ON tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_activity();

-- Trigger: notificar cuando asignan una tarea
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.assigned_to,
      'assignment',
      'Nueva tarea asignada',
      'Te asignaron la tarea: ' || NEW.title,
      '/projects/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_assignment_trigger ON tasks;
CREATE TRIGGER task_assignment_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();
