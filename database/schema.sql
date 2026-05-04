-- =============================================================
-- AprovadoX - Schema SQL para Neon PostgreSQL
-- Execute no painel SQL do Neon ou via Prisma migrate
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  avatar_url       TEXT,
  data_nascimento  DATE,
  xp               INTEGER DEFAULT 0,
  level            INTEGER DEFAULT 1,
  streak           INTEGER DEFAULT 0,
  last_study_date  DATE,
  theme            VARCHAR(10) DEFAULT 'dark',
  plan             VARCHAR(20) DEFAULT 'free',
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Migration para bancos existentes
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_nascimento DATE;

CREATE TABLE IF NOT EXISTS concursos (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome       VARCHAR(255) NOT NULL,
  banca      VARCHAR(255),
  cargo      VARCHAR(255),
  data_prova DATE,
  edital_url TEXT,
  ativo      BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materias (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
  concurso_id         INTEGER REFERENCES concursos(id) ON DELETE SET NULL,
  nome                VARCHAR(255) NOT NULL,
  cor                 VARCHAR(7) DEFAULT '#6366f1',
  meta_semanal_horas  DECIMAL(5,2) DEFAULT 5,
  peso                INTEGER DEFAULT 1,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assuntos (
  id         SERIAL PRIMARY KEY,
  materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
  nome       VARCHAR(255) NOT NULL,
  concluido  BOOLEAN DEFAULT false,
  ordem      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessoes_estudo (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  materia_id       INTEGER REFERENCES materias(id) ON DELETE SET NULL,
  assunto_id       INTEGER REFERENCES assuntos(id) ON DELETE SET NULL,
  tecnica          VARCHAR(50),
  duracao_minutos  INTEGER NOT NULL,
  data_inicio      TIMESTAMP NOT NULL,
  data_fim         TIMESTAMP,
  notas            TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revisoes (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  materia_id   INTEGER REFERENCES materias(id) ON DELETE SET NULL,
  assunto_id   INTEGER REFERENCES assuntos(id) ON DELETE SET NULL,
  sessao_id    INTEGER REFERENCES sessoes_estudo(id) ON DELETE SET NULL,
  tipo         VARCHAR(10) NOT NULL,
  data_revisao DATE NOT NULL,
  concluida    BOOLEAN DEFAULT false,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metas (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tipo           VARCHAR(50) NOT NULL,
  descricao      TEXT,
  valor_alvo     DECIMAL(10,2) NOT NULL,
  valor_atual    DECIMAL(10,2) DEFAULT 0,
  periodo_inicio DATE,
  periodo_fim    DATE,
  concluida      BOOLEAN DEFAULT false,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questoes_erradas (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
  materia_id         INTEGER REFERENCES materias(id) ON DELETE SET NULL,
  questao            TEXT NOT NULL,
  alternativas       JSONB,
  erro_cometido      TEXT,
  explicacao_correta TEXT,
  revisada           BOOLEAN DEFAULT false,
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gamificacao_log (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tipo       VARCHAR(50) NOT NULL,
  descricao  TEXT,
  xp_ganho   INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planejamento_semanal (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dia_semana      INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  materia_id      INTEGER REFERENCES materias(id) ON DELETE CASCADE,
  horas           DECIMAL(4,2) NOT NULL,
  horario_inicio  TIME,
  horario_fim     TIME
);

CREATE TABLE IF NOT EXISTS medalhas (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tipo           VARCHAR(50) NOT NULL,
  nome           VARCHAR(255) NOT NULL,
  descricao      TEXT,
  icone          VARCHAR(50),
  data_conquista TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessoes_user    ON sessoes_estudo(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_data    ON sessoes_estudo(data_inicio);
CREATE INDEX IF NOT EXISTS idx_revisoes_user   ON revisoes(user_id);
CREATE INDEX IF NOT EXISTS idx_revisoes_data   ON revisoes(data_revisao);
CREATE INDEX IF NOT EXISTS idx_materias_user   ON materias(user_id);
CREATE INDEX IF NOT EXISTS idx_questoes_user   ON questoes_erradas(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
