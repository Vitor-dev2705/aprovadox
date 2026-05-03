const { Pool } = require('pg');

// Pool otimizado para serverless (Vercel + Neon)
// Em serverless cada invocation é um novo container, então max:1 é o correto
let pool;

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
      console.error('Postgres pool error:', err);
    });
  }
  return pool;
}

// Proxy compatível: continue chamando .query() normalmente
module.exports = {
  query: (...args) => getPool().query(...args),
  connect: () => getPool().connect(),
  end: () => pool && pool.end(),
};
