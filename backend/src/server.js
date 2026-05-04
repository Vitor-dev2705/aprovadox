require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const concursosRoutes = require('./routes/concursos.routes');
const materiasRoutes = require('./routes/materias.routes');
const sessoesRoutes = require('./routes/sessoes.routes');
const revisoesRoutes = require('./routes/revisoes.routes');
const metasRoutes = require('./routes/metas.routes');
const questoesRoutes = require('./routes/questoes.routes');
const gamificacaoRoutes = require('./routes/gamificacao.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const planejamentoRoutes = require('./routes/planejamento.routes');
const notificacoesRoutes = require('./routes/notificacoes.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // permite mesma origem (Vercel monorepo), localhost e a FRONTEND_URL definida
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    if (allowed.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
      return callback(null, true);
    }
    return callback(null, true); // permissivo para evitar bloqueio em prod
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Healthcheck — diagnóstico rápido sem auth
app.get('/api/health', async (req, res) => {
  const pool = require('./config/database');
  const status = {
    api: 'ok',
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    },
    db: 'unknown',
  };
  try {
    const r = await pool.query('SELECT NOW() as now, COUNT(*)::int as users FROM users');
    status.db = 'ok';
    status.db_now = r.rows[0].now;
    status.users_count = r.rows[0].users;
  } catch (err) {
    status.db = 'error';
    status.db_error = err.message;
  }
  res.json(status);
});

app.use('/api/auth', authRoutes);
app.use('/api/concursos', concursosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/sessoes', sessoesRoutes);
app.use('/api/revisoes', revisoesRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/questoes', questoesRoutes);
app.use('/api/gamificacao', gamificacaoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/planejamento', planejamentoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

// Local dev
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`AprovadoX API rodando na porta ${PORT}`));
}

module.exports = app;
