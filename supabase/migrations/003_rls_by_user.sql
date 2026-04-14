-- Atualiza RLS para projetos: cada usuário acessa apenas os seus
DROP POLICY IF EXISTS "access by project id" ON projects;

-- Leitura: dono do projeto ou projetos sem user_id (legado)
CREATE POLICY "select own projects" ON projects
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Inserção: anônimos podem inserir (user_id null) ou autenticados com seu id
CREATE POLICY "insert projects" ON projects
  FOR INSERT WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );
