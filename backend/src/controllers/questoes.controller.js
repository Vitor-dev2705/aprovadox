const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { materia_id, revisada } = req.query;
    let query = `SELECT q.*, m.nome as materia_nome, m.cor as materia_cor
      FROM questoes_erradas q LEFT JOIN materias m ON q.materia_id = m.id
      WHERE q.user_id = $1`;
    const params = [req.userId];
    let i = 1;

    if (materia_id) { i++; query += ` AND q.materia_id = $${i}`; params.push(materia_id); }
    if (revisada !== undefined) { i++; query += ` AND q.revisada = $${i}`; params.push(revisada === 'true'); }

    query += ' ORDER BY q.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar questões' });
  }
};

exports.create = async (req, res) => {
  try {
    const { materia_id, questao, alternativas, erro_cometido, explicacao_correta } = req.body;
    if (!materia_id || !questao) {
      return res.status(400).json({ error: 'Matéria e questão são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO questoes_erradas (user_id, materia_id, questao, alternativas, erro_cometido, explicacao_correta) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.userId, materia_id, questao, JSON.stringify(alternativas), erro_cometido, explicacao_correta]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar questão' });
  }
};

exports.markReviewed = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE questoes_erradas SET revisada = true WHERE id=$1 AND user_id=$2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Questão não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar questão' });
  }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM questoes_erradas WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Questão removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover questão' });
  }
};
