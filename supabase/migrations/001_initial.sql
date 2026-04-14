-- Projetos
CREATE TABLE projects (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  vision       TEXT        NOT NULL,
  brief        JSONB,
  status       TEXT        NOT NULL DEFAULT 'orchestrating'
                           CHECK (status IN ('orchestrating', 'briefing', 'executing', 'delivered')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Eventos de orquestração (replay + debug)
CREATE TABLE orchestration_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  phase       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Perguntas de condução
CREATE TABLE guiding_questions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID        REFERENCES projects(id) ON DELETE CASCADE,
  question     TEXT        NOT NULL,
  answer       TEXT,
  asked_at     TIMESTAMPTZ DEFAULT NOW(),
  answered_at  TIMESTAMPTZ
);

-- RLS
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guiding_questions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users: own orchestration events"
  ON orchestration_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = orchestration_events.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "users: own guiding questions"
  ON guiding_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = guiding_questions.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_orchestration_events_project_id ON orchestration_events(project_id);
CREATE INDEX idx_guiding_questions_project_id ON guiding_questions(project_id);
