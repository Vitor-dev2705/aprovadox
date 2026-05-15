const pool = require('../config/database');

const TZ = 'America/Sao_Paulo';
const TODAY_BR = `(NOW() AT TIME ZONE '${TZ}')::date`;

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM materias WHERE concurso_id = c.id) as total_materias,
        CASE WHEN c.data_prova IS NOT NULL THEN c.data_prova - ${TODAY_BR} ELSE NULL END as dias_restantes
      FROM concursos c WHERE c.user_id = $1 ORDER BY c.data_prova ASC NULLS LAST`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar concursos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM materias WHERE concurso_id = c.id) as total_materias,
        (SELECT json_agg(json_build_object('id', m.id, 'nome', m.nome, 'cor', m.cor, 'peso', m.peso, 'meta_semanal_horas', m.meta_semanal_horas)) FROM materias m WHERE m.concurso_id = c.id) as materias
      FROM concursos c WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Concurso não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar concurso' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, banca, cargo, data_prova, edital_url } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do concurso é obrigatório' });
    }
    const result = await pool.query(
      'INSERT INTO concursos (user_id, nome, banca, cargo, data_prova, edital_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, nome, banca, cargo, data_prova, edital_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar concurso' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nome, banca, cargo, data_prova, edital_url, ativo } = req.body;
    const result = await pool.query(
      'UPDATE concursos SET nome=$1, banca=$2, cargo=$3, data_prova=$4, edital_url=$5, ativo=COALESCE($6, ativo) WHERE id=$7 AND user_id=$8 RETURNING *',
      [nome, banca, cargo, data_prova, edital_url, ativo, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Concurso não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar concurso' });
  }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM concursos WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Concurso removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover concurso' });
  }
};
