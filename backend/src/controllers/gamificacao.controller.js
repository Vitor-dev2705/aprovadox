const pool = require('../config/database');

const TZ = 'America/Sao_Paulo';
const TODAY_BR = `(NOW() AT TIME ZONE '${TZ}')::date`;
const DATA_LOCAL = `(data_inicio AT TIME ZONE '${TZ}')`;

exports.getStatus = async (req, res) => {
  try {
    const user = await pool.query('SELECT xp, level, streak FROM users WHERE id=$1', [req.userId]);
    const medalhas = await pool.query('SELECT * FROM medalhas WHERE user_id=$1 ORDER BY data_conquista DESC', [req.userId]);
    const log = await pool.query('SELECT * FROM gamificacao_log WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [req.userId]);

    const xpForNext = (user.rows[0].level) * 100;
    const xpCurrent = user.rows[0].xp % 100;

    res.json({
      xp: user.rows[0].xp,
      level: user.rows[0].level,
      streak: user.rows[0].streak,
      xp_proximo_nivel: xpForNext,
      xp_nivel_atual: xpCurrent,
      medalhas: medalhas.rows,
      historico: log.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar gamificação' });
  }
};

exports.getMissoes = async (req, res) => {
  try {
    const today = await pool.query(
      `SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL}::date = ${TODAY_BR}`,
      [req.userId]
    );
    const reviewsDone = await pool.query(
      `SELECT COUNT(*) as total FROM revisoes WHERE user_id=$1 AND data_revisao = ${TODAY_BR} AND concluida=true`,
      [req.userId]
    );
    const questionsDone = await pool.query(
      `SELECT COUNT(*) as total FROM questoes_erradas WHERE user_id=$1 AND (created_at AT TIME ZONE '${TZ}')::date = ${TODAY_BR}`,
      [req.userId]
    );

    const missoes = [
      { id: 1, nome: 'Estudar 60 minutos', progresso: Math.min(parseInt(today.rows[0].min), 60), alvo: 60, xp: 20, concluida: parseInt(today.rows[0].min) >= 60 },
      { id: 2, nome: 'Completar 3 revisões', progresso: Math.min(parseInt(reviewsDone.rows[0].total), 3), alvo: 3, xp: 15, concluida: parseInt(reviewsDone.rows[0].total) >= 3 },
      { id: 3, nome: 'Registrar 5 questões', progresso: Math.min(parseInt(questionsDone.rows[0].total), 5), alvo: 5, xp: 15, concluida: parseInt(questionsDone.rows[0].total) >= 5 },
      { id: 4, nome: 'Estudar 120 minutos', progresso: Math.min(parseInt(today.rows[0].min), 120), alvo: 120, xp: 30, concluida: parseInt(today.rows[0].min) >= 120 },
    ];

    res.json(missoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar missões' });
  }
};

exports.checkMedalhas = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await pool.query('SELECT streak, xp FROM users WHERE id=$1', [userId]);
    const totalHours = await pool.query('SELECT COALESCE(SUM(duracao_minutos),0)/60 as horas FROM sessoes_estudo WHERE user_id=$1', [userId]);
    const totalSessoes = await pool.query('SELECT COUNT(*) as total FROM sessoes_estudo WHERE user_id=$1', [userId]);
    const existing = await pool.query('SELECT tipo FROM medalhas WHERE user_id=$1', [userId]);
    const existingTypes = existing.rows.map(m => m.tipo);

    const medals = [
      { tipo: 'primeiro_estudo', nome: 'Primeiro Passo', descricao: 'Completou sua primeira sessão', icone: '🎯', check: parseInt(totalSessoes.rows[0].total) >= 1 },
      { tipo: 'streak_7', nome: '7 Dias Seguidos', descricao: 'Manteve sequência de 7 dias', icone: '🔥', check: user.rows[0].streak >= 7 },
      { tipo: 'streak_30', nome: 'Mês Completo', descricao: '30 dias seguidos estudando', icone: '💎', check: user.rows[0].streak >= 30 },
      { tipo: 'horas_10', nome: 'Dedicado', descricao: '10 horas de estudo total', icone: '📚', check: parseInt(totalHours.rows[0].horas) >= 10 },
      { tipo: 'horas_50', nome: 'Estudioso', descricao: '50 horas de estudo total', icone: '🏆', check: parseInt(totalHours.rows[0].horas) >= 50 },
      { tipo: 'horas_100', nome: 'Maratonista', descricao: '100 horas de estudo total', icone: '⭐', check: parseInt(totalHours.rows[0].horas) >= 100 },
      { tipo: 'horas_500', nome: 'Lenda', descricao: '500 horas de estudo total', icone: '👑', check: parseInt(totalHours.rows[0].horas) >= 500 },
      { tipo: 'sessoes_50', nome: 'Consistente', descricao: '50 sessões de estudo', icone: '💪', check: parseInt(totalSessoes.rows[0].total) >= 50 },
    ];

    const newMedals = [];
    for (const medal of medals) {
      if (medal.check && !existingTypes.includes(medal.tipo)) {
        await pool.query(
          'INSERT INTO medalhas (user_id, tipo, nome, descricao, icone) VALUES ($1,$2,$3,$4,$5)',
          [userId, medal.tipo, medal.nome, medal.descricao, medal.icone]
        );
        newMedals.push(medal);
      }
    }

    res.json({ new_medals: newMedals });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar medalhas' });
  }
};
