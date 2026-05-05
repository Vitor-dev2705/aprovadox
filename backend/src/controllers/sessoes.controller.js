const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { materia_id, data_inicio, data_fim, limit = 50 } = req.query;
    let query = `SELECT s.*, m.nome as materia_nome, m.cor as materia_cor, a.nome as assunto_nome
      FROM sessoes_estudo s
      LEFT JOIN materias m ON s.materia_id = m.id
      LEFT JOIN assuntos a ON s.assunto_id = a.id
      WHERE s.user_id = $1`;
    const params = [req.userId];
    let paramCount = 1;

    if (materia_id) { paramCount++; query += ` AND s.materia_id = $${paramCount}`; params.push(materia_id); }
    if (data_inicio) { paramCount++; query += ` AND s.data_inicio >= $${paramCount}`; params.push(data_inicio); }
    if (data_fim) { paramCount++; query += ` AND s.data_inicio <= $${paramCount}`; params.push(data_fim); }

    query += ` ORDER BY s.data_inicio DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
};

exports.create = async (req, res) => {
  try {
    const { materia_id, conteudo_id, assunto_id, tecnica, duracao_minutos, data_inicio, data_fim, notas } = req.body;
    const result = await pool.query(
      `INSERT INTO sessoes_estudo (user_id, materia_id, conteudo_id, assunto_id, tecnica, duracao_minutos, data_inicio, data_fim, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.userId, materia_id, conteudo_id || null, assunto_id || null, tecnica, duracao_minutos, data_inicio, data_fim, notas]
    );

    const sessao = result.rows[0];

    // Award XP: 10 XP per 30 min
    const xp = Math.floor(duracao_minutos / 30) * 10 + (duracao_minutos >= 15 ? 5 : 0);
    if (xp > 0) {
      await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xp, req.userId]);
      await pool.query(
        "INSERT INTO gamificacao_log (user_id, tipo, descricao, xp_ganho) VALUES ($1, 'estudo', $2, $3)",
        [req.userId, `Estudou ${duracao_minutos} min de ${tecnica}`, xp]
      );
    }

    // Update streak
    await pool.query(
      `UPDATE users SET
        streak = CASE
          WHEN last_study_date = CURRENT_DATE - 1 THEN streak + 1
          WHEN last_study_date = CURRENT_DATE THEN streak
          ELSE 1
        END,
        last_study_date = CURRENT_DATE,
        level = GREATEST(1, FLOOR((xp + $1) / 100) + 1)
      WHERE id = $2`,
      [xp, req.userId]
    );

    // Agendar revisões — agora baseado em CONTEÚDO (24h, 7d, 30d, 90d)
    if (conteudo_id) {
      const intervals = ['1 day', '7 days', '30 days', '90 days'];
      const tipos = ['24h', '7d', '30d', '90d'];
      for (let i = 0; i < intervals.length; i++) {
        await pool.query(
          `INSERT INTO revisoes (user_id, materia_id, conteudo_id, assunto_id, sessao_id, tipo, data_revisao)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE + INTERVAL '${intervals[i]}')`,
          [req.userId, materia_id, conteudo_id, assunto_id || null, sessao.id, tipos[i]]
        );
      }
    }

    res.status(201).json({ ...sessao, xp_ganho: xp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar sessão' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const today = await pool.query(
      "SELECT COALESCE(SUM(duracao_minutos), 0) as minutos FROM sessoes_estudo WHERE user_id = $1 AND data_inicio::date = CURRENT_DATE",
      [req.userId]
    );
    const week = await pool.query(
      "SELECT COALESCE(SUM(duracao_minutos), 0) as minutos FROM sessoes_estudo WHERE user_id = $1 AND data_inicio >= DATE_TRUNC('week', CURRENT_DATE)",
      [req.userId]
    );
    const month = await pool.query(
      "SELECT COALESCE(SUM(duracao_minutos), 0) as minutos FROM sessoes_estudo WHERE user_id = $1 AND data_inicio >= DATE_TRUNC('month', CURRENT_DATE)",
      [req.userId]
    );

    res.json({
      hoje_minutos: parseInt(today.rows[0].minutos),
      semana_minutos: parseInt(week.rows[0].minutos),
      mes_minutos: parseInt(month.rows[0].minutos)
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM sessoes_estudo WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Sessão removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover sessão' });
  }
};
