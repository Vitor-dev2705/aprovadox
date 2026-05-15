const pool = require('../config/database');

const TZ = 'America/Sao_Paulo';
const TODAY_BR = `(NOW() AT TIME ZONE '${TZ}')::date`;
const DATA_LOCAL = `(data_inicio AT TIME ZONE '${TZ}')`;
const WEEK_START = `DATE_TRUNC('week', ${TODAY_BR})`;
const MONTH_START = `DATE_TRUNC('month', ${TODAY_BR})`;

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

    // Update streak — usa data do Brasil para não quebrar streak por causa do UTC
    await pool.query(
      `UPDATE users SET
        streak = CASE
          WHEN last_study_date = ${TODAY_BR} - 1 THEN streak + 1
          WHEN last_study_date = ${TODAY_BR} THEN streak
          ELSE 1
        END,
        last_study_date = ${TODAY_BR},
        level = GREATEST(1, FLOOR((xp + $1) / 100) + 1)
      WHERE id = $2`,
      [xp, req.userId]
    );

    // Se técnica é "Revisão Espaçada" → dá check nas revisões pendentes desta matéria
    // Caso contrário → agenda novas revisões espaçadas normalmente
    let revisoes_concluidas = 0;

    if (tecnica === 'Revisão Espaçada') {
      // Completa revisões pendentes (vencidas ou de hoje) para esta matéria
      const completar = await pool.query(
        `UPDATE revisoes SET concluida = true
         WHERE user_id = $1 AND materia_id = $2
           AND concluida = false AND data_revisao <= ${TODAY_BR}
         RETURNING id`,
        [req.userId, materia_id]
      );
      revisoes_concluidas = completar.rowCount;

      // +5 XP por revisão concluída (mesmo que o complete individual faz)
      if (revisoes_concluidas > 0) {
        const xpRevisoes = revisoes_concluidas * 5;
        await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xpRevisoes, req.userId]);
        await pool.query(
          "INSERT INTO gamificacao_log (user_id, tipo, descricao, xp_ganho) VALUES ($1, 'revisao', $2, $3)",
          [req.userId, `Revisão concluída de ${revisoes_concluidas} item(ns) via cronômetro`, xpRevisoes]
        );
      }
    } else {
      // Agendar revisões espaçadas (24h, 7d, 30d, 90d)
      const intervalDays = [1, 7, 30, 90];
      const tipos = ['24h', '7d', '30d', '90d'];
      for (let i = 0; i < intervalDays.length; i++) {
        await pool.query(
          `INSERT INTO revisoes (user_id, materia_id, conteudo_id, assunto_id, sessao_id, tipo, data_revisao)
           VALUES ($1, $2, $3, $4, $5, $6, ${TODAY_BR} + $7::int)`,
          [req.userId, materia_id, conteudo_id || null, assunto_id || null, sessao.id, tipos[i], intervalDays[i]]
        );
      }
    }

    res.status(201).json({ ...sessao, xp_ganho: xp, revisoes_concluidas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar sessão' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const today = await pool.query(
      `SELECT COALESCE(SUM(duracao_minutos), 0) as minutos FROM sessoes_estudo WHERE user_id = $1 AND ${DATA_LOCAL}::date = ${TODAY_BR}`,
      [req.userId]
    );
    const week = await pool.query(
      `SELECT COALESCE(SUM(duracao_minutos), 0) as minutos FROM sessoes_estudo WHERE user_id = $1 AND ${DATA_LOCAL} >= ${WEEK_START}`,
      [req.userId]
    );
    const month = await pool.query(
      `SELECT COALESCE(SUM(duracao_minutos), 0) as minutos FROM sessoes_estudo WHERE user_id = $1 AND ${DATA_LOCAL} >= ${MONTH_START}`,
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
