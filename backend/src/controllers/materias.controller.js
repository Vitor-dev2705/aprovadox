const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { concurso_id } = req.query;
    let query = `SELECT m.*,
      COALESCE((SELECT SUM(s.duracao_minutos) FROM sessoes_estudo s WHERE s.materia_id = m.id), 0) as horas_estudadas,
      (SELECT COUNT(*) FROM assuntos WHERE materia_id = m.id) as total_assuntos,
      (SELECT COUNT(*) FROM assuntos WHERE materia_id = m.id AND concluido = true) as assuntos_concluidos
      FROM materias m WHERE m.user_id = $1`;
    const params = [req.userId];

    if (concurso_id) { query += ' AND m.concurso_id = $2'; params.push(concurso_id); }
    query += ' ORDER BY m.nome';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar matérias' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*,
        (SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome, 'concluido', a.concluido, 'ordem', a.ordem) ORDER BY a.ordem) FROM assuntos a WHERE a.materia_id = m.id) as assuntos
      FROM materias m WHERE m.id = $1 AND m.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Matéria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar matéria' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, cor, meta_semanal_horas, concurso_id, peso, assuntos } = req.body;
    const result = await pool.query(
      'INSERT INTO materias (user_id, concurso_id, nome, cor, meta_semanal_horas, peso) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, concurso_id, nome, cor || '#6366f1', meta_semanal_horas || 5, peso || 1]
    );
    const materia = result.rows[0];

    if (assuntos && assuntos.length) {
      for (let i = 0; i < assuntos.length; i++) {
        await pool.query('INSERT INTO assuntos (materia_id, nome, ordem) VALUES ($1, $2, $3)', [materia.id, assuntos[i], i]);
      }
    }

    res.status(201).json(materia);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar matéria' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nome, cor, meta_semanal_horas, peso } = req.body;
    const result = await pool.query(
      'UPDATE materias SET nome=COALESCE($1,nome), cor=COALESCE($2,cor), meta_semanal_horas=COALESCE($3,meta_semanal_horas), peso=COALESCE($4,peso) WHERE id=$5 AND user_id=$6 RETURNING *',
      [nome, cor, meta_semanal_horas, peso, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Matéria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar matéria' });
  }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM materias WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Matéria removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover matéria' });
  }
};

exports.addAssunto = async (req, res) => {
  try {
    const { nome } = req.body;
    const materia = await pool.query('SELECT id FROM materias WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!materia.rows.length) return res.status(404).json({ error: 'Matéria não encontrada' });

    const result = await pool.query(
      'INSERT INTO assuntos (materia_id, nome, ordem) VALUES ($1, $2, (SELECT COALESCE(MAX(ordem),0)+1 FROM assuntos WHERE materia_id=$1)) RETURNING *',
      [req.params.id, nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar assunto' });
  }
};

exports.toggleAssunto = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE assuntos SET concluido = NOT concluido WHERE id = $1 RETURNING *',
      [req.params.assuntoId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar assunto' });
  }
};
