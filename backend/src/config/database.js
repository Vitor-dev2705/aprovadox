const { Pool } = require('pg');

// Pool otimizado para serverless (Vercel + Neon)
// Em serverless cada invocation é um novo container, então max:1 é o correto
let pool;
let plannerSchemaPromise;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não está definida nas variáveis de ambiente!');
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Postgres pool error', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
      });
    });
  }
  return pool;
}

// Proxy compatível: continue chamando .query() normalmente
module.exports = {
  query: (...args) => getPool().query(...args),
  connect: () => getPool().connect(),
  end: () => pool && pool.end(),
  ensurePlannerSchema: () => {
    if (!plannerSchemaPromise) {
      console.log('[DB] Verificando schema do planejador...');
      plannerSchemaPromise = getPool().query(`
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS orgao VARCHAR(255);
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS data_prova_estimada DATE;
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS data_prova_oficial DATE;
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'estudando';
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS numero_questoes INTEGER;
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS peso_prova DECIMAL(8,2);
        ALTER TABLE concursos ADD COLUMN IF NOT EXISTS observacoes TEXT;
        ALTER TABLE materias ADD COLUMN IF NOT EXISTS prioridade VARCHAR(10) DEFAULT 'media';
        ALTER TABLE materias ADD COLUMN IF NOT EXISTS dominio DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE materias ADD COLUMN IF NOT EXISTS horas_estimadas DECIMAL(7,2) DEFAULT 0;
        ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'nao_iniciado';
        ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS dificuldade VARCHAR(20) DEFAULT 'media';
        ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS horas_estimadas DECIMAL(7,2) DEFAULT 0;
        ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS progresso DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS ultima_revisao DATE;
        ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS proxima_revisao DATE;
        ALTER TABLE assuntos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'nao_iniciado';
        ALTER TABLE assuntos ADD COLUMN IF NOT EXISTS dificuldade VARCHAR(20) DEFAULT 'media';
        ALTER TABLE assuntos ADD COLUMN IF NOT EXISTS progresso DECIMAL(5,2) DEFAULT 0;
        CREATE TABLE IF NOT EXISTS resultados_questoes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          concurso_id INTEGER REFERENCES concursos(id) ON DELETE CASCADE,
          materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
          assunto VARCHAR(255),
          banca VARCHAR(255),
          data DATE NOT NULL DEFAULT CURRENT_DATE,
          quantidade INTEGER NOT NULL,
          acertos INTEGER NOT NULL DEFAULT 0,
          erros INTEGER GENERATED ALWAYS AS (quantidade - acertos) STORED,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS simulados (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          concurso_id INTEGER REFERENCES concursos(id) ON DELETE CASCADE,
          data DATE NOT NULL DEFAULT CURRENT_DATE,
          quantidade_questoes INTEGER NOT NULL,
          acertos INTEGER NOT NULL DEFAULT 0,
          tempo_minutos INTEGER,
          nota_estimada DECIMAL(7,2),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `).then((result) => {
        console.log('[DB] Schema do planejador verificado com sucesso');
        return result;
      }).catch((err) => {
        plannerSchemaPromise = null;
        console.error('[DB] Falha ao verificar schema do planejador', {
          message: err.message,
          code: err.code,
          detail: err.detail,
          hint: err.hint,
          table: err.table,
          column: err.column,
          constraint: err.constraint,
        });
        throw err;
      });
    }
    return plannerSchemaPromise;
  },
};
