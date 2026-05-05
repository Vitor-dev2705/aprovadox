const pool = require('../config/database');

const SELECT_REVISAO = `
  SELECT r.*,
    m.nome as materia_nome, m.cor as materia_cor,
    c.titulo as conteudo_titulo, c.tipo as conteudo_tipo,
    a.nome as assunto_nome
  FROM revisoes r
  LEFT JOIN materias m ON r.materia_id = m.id
  LEFT JOIN conteudos c ON r.conteudo_id = c.id
  LEFT JOIN assuntos a ON r.assunto_id = a.id
`;

exports.getAll = async (req, res) => {
  try {
    const { pendentes, data } = req.query;
    let query = `${SELECT_REVISAO} WHERE r.user_id = $1`;
    const params = [req.userId];
    let i = 1;

    if (pendentes === 'true') query += ' AND r.concluida = false';
    if (data) { i++; query += ` AND r.data_revisao = $${i}`; params.push(data); }

    query += ' ORDER BY r.data_revisao ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar revisões' });
  }
};

exports.getToday = async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_REVISAO}
       WHERE r.user_id = $1 AND r.data_revisao <= CURRENT_DATE AND r.concluida = false
       ORDER BY r.data_revisao ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar revisões de hoje' });
  }
};

exports.complete = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE revisoes SET concluida = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Revisão não encontrada' });

    await pool.query('UPDATE users SET xp = xp + 5 WHERE id = $1', [req.userId]);
    await pool.query(
      "INSERT INTO gamificacao_log (user_id, tipo, descricao, xp_ganho) VALUES ($1, 'revisao', 'Revisão concluída', 5)",
      [req.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao completar revisão' });
  }
};

exports.getCalendar = async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const result = await pool.query(
      `SELECT data_revisao, COUNT(*) as total, COUNT(*) FILTER (WHERE concluida) as concluidas, tipo
       FROM revisoes WHERE user_id = $1 AND EXTRACT(MONTH FROM data_revisao) = $2 AND EXTRACT(YEAR FROM data_revisao) = $3
       GROUP BY data_revisao, tipo ORDER BY data_revisao`,
      [req.userId, mes || new Date().getMonth() + 1, ano || new Date().getFullYear()]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar calendário' });
  }
};
