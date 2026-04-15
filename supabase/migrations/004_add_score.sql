-- Adiciona coluna de score ao resultado do pipeline
ALTER TABLE projects ADD COLUMN IF NOT EXISTS score jsonb;

COMMENT ON COLUMN projects.score IS 'ScoreOutput do Score Agent: { score, approved, signals, feedback }';
