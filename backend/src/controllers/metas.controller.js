const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM metas WHERE user_id = $1 ORDER BY concluida ASC, created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
};

exports.create = async (req, res) => {
  try {
    const { tipo, descricao, valor_alvo, periodo_inicio, periodo_fim } = req.body;
    if (!tipo || !descricao) {
      return res.status(400).json({ error: 'Tipo e descrição são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO metas (user_id, tipo, descricao, valor_alvo, periodo_inicio, periodo_fim) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.userId, tipo, descricao, valor_alvo, periodo_inicio, periodo_fim]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
};

exports.update = async (req, res) => {
  try {
    const { valor_atual, concluida } = req.body;
    const result = await pool.query(
      'UPDATE metas SET valor_atual=COALESCE($1,valor_atual), concluida=COALESCE($2,concluida) WHERE id=$3 AND user_id=$4 RETURNING *',
      [valor_atual, concluida, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Meta não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM metas WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Meta removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover meta' });
  }
};
