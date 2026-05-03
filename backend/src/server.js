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

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
