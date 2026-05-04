const pool = require('../config/database');

const TIPOS_VALIDOS = ['video', 'pdf', 'site', 'livro', 'anotacao', 'curso', 'flashcard'];

exports.getByMateria = async (req, res) => {
  try {
    const { materiaId } = req.params;
    const result = await pool.query(
      `SELECT c.* FROM conteudos c
       INNER JOIN materias m ON c.materia_id = m.id
       WHERE c.materia_id = $1 AND m.user_id = $2
       ORDER BY c.ordem ASC, c.created_at DESC`,
      [materiaId, req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('CONTEUDOS GET ERROR:', err);
    res.status(500).json({ error: 'Erro ao buscar conteúdos' });
  }
};

exports.create = async (req, res) => {
  try {
    const { materia_id, titulo, tipo, url, descricao } = req.body;
    if (!materia_id || !titulo) {
      return res.status(400).json({ error: 'Matéria e título são obrigatórios' });
    }
    const tipoFinal = TIPOS_VALIDOS.includes(tipo) ? tipo : 'anotacao';

    // Garantir que a matéria pertence ao usuário
    const owner = await pool.query(
      'SELECT id FROM materias WHERE id = $1 AND user_id = $2',
      [materia_id, req.userId]
    );
    if (!owner.rows.length) {
      return res.status(403).json({ error: 'Matéria não encontrada' });
    }

    const result = await pool.query(
      `INSERT INTO conteudos (user_id, materia_id, titulo, tipo, url, descricao, ordem)
       VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MAX(ordem), 0) + 1 FROM conteudos WHERE materia_id = $2))
       RETURNING *`,
      [req.userId, materia_id, titulo, tipoFinal, url || null, descricao || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('CONTEUDOS CREATE ERROR:', err);
    res.status(500).json({ error: 'Erro ao criar conteúdo', detail: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, tipo, url, descricao, visualizado } = req.body;
    const tipoFinal = tipo && TIPOS_VALIDOS.includes(tipo) ? tipo : null;

    const result = await pool.query(
      `UPDATE conteudos SET
         titulo      = COALESCE($1, titulo),
         tipo        = COALESCE($2, tipo),
         url         = COALESCE($3, url),
         descricao   = COALESCE($4, descricao),
         visualizado = COALESCE($5, visualizado)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [titulo, tipoFinal, url, descricao, visualizado, id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar conteúdo' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE conteudos SET visualizado = NOT visualizado WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar conteúdo' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM conteudos WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ message: 'Conteúdo removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover conteúdo' });
  }
};
