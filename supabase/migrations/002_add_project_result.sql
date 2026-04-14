-- Adiciona colunas de resultado do pipeline
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS html     TEXT,
  ADD COLUMN IF NOT EXISTS team     JSONB,
  ADD COLUMN IF NOT EXISTS brand    JSONB,
  ADD COLUMN IF NOT EXISTS copy     JSONB,
  ADD COLUMN IF NOT EXISTS design   JSONB;

-- Torna user_id opcional (sem auth por enquanto)
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;

-- Política para acesso anônimo (sem auth) — leitura e escrita livres por id
DROP POLICY IF EXISTS "users: own projects" ON projects;

CREATE POLICY "access by project id"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);
