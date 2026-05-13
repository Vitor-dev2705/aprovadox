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
const conteudosRoutes = require('./routes/conteudos.routes');
const extracaoRoutes = require('./routes/extracao.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (/\.vercel\.app$/.test(hostname) && hostname.includes('aprovado')) {
        return callback(null, true);
      }
    } catch {}
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Healthcheck — diagnóstico rápido sem auth
app.get('/api/health', async (req, res) => {
  const pool = require('./config/database');
  const status = { api: 'ok', db: 'unknown' };
  try {
    await pool.query('SELECT 1');
    status.db = 'ok';
  } catch {
    status.db = 'error';
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
app.use('/api/conteudos', conteudosRoutes);
app.use('/api/extracao', extracaoRoutes);

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
