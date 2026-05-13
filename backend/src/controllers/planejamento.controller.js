const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, m.nome as materia_nome, m.cor as materia_cor
       FROM planejamento_semanal p
       JOIN materias m ON p.materia_id = m.id
       WHERE p.user_id = $1
       ORDER BY p.dia_semana, p.horario_inicio`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar planejamento' });
  }
};

exports.upsert = async (req, res) => {
  try {
    const { dia_semana, materia_id, horas, horario_inicio, horario_fim } = req.body;
    if (dia_semana == null || !materia_id) {
      return res.status(400).json({ error: 'Dia da semana e matéria são obrigatórios' });
    }
    const dia = parseInt(dia_semana);
    if (isNaN(dia) || dia < 0 || dia > 6) {
      return res.status(400).json({ error: 'Dia da semana inválido (0-6)' });
    }
    const result = await pool.query(
      `INSERT INTO planejamento_semanal (user_id, dia_semana, materia_id, horas, horario_inicio, horario_fim)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [req.userId, dia_semana, materia_id, horas, horario_inicio, horario_fim]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar planejamento' });
  }
};

exports.update = async (req, res) => {
  try {
    const { horas, horario_inicio, horario_fim, materia_id } = req.body;
    const result = await pool.query(
      `UPDATE planejamento_semanal
       SET horas=COALESCE($1,horas), horario_inicio=COALESCE($2,horario_inicio),
           horario_fim=COALESCE($3,horario_fim), materia_id=COALESCE($4,materia_id)
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [horas, horario_inicio, horario_fim, materia_id, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Bloco não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar planejamento' });
  }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM planejamento_semanal WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Bloco removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover bloco' });
  }
};

exports.clearDay = async (req, res) => {
  try {
    const dia = parseInt(req.params.dia);
    if (isNaN(dia) || dia < 0 || dia > 6) {
      return res.status(400).json({ error: 'Dia da semana inválido (0-6)' });
    }
    await pool.query(
      'DELETE FROM planejamento_semanal WHERE user_id=$1 AND dia_semana=$2',
      [req.userId, dia]
    );
    res.json({ message: 'Dia limpo' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao limpar dia' });
  }
};
