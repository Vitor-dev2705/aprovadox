const pool = require('../config/database');

const TZ = 'America/Sao_Paulo';
const TODAY_BR = `(NOW() AT TIME ZONE '${TZ}')::date`;

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM materias WHERE concurso_id = c.id) as total_materias,
        CASE WHEN COALESCE(c.data_prova_oficial, c.data_prova_estimada, c.data_prova) IS NOT NULL
          THEN COALESCE(c.data_prova_oficial, c.data_prova_estimada, c.data_prova) - ${TODAY_BR}
          ELSE NULL END as dias_restantes,
        COALESCE((SELECT SUM(m.horas_estimadas) FROM materias m WHERE m.concurso_id = c.id), 0) as horas_necessarias,
        COALESCE((SELECT SUM(s.duracao_minutos) / 60.0 FROM sessoes_estudo s
          JOIN materias m ON m.id = s.materia_id
          WHERE m.concurso_id = c.id), 0) as horas_estudadas,
        COALESCE((SELECT SUM(m.meta_semanal_horas) FROM materias m WHERE m.concurso_id = c.id), 0) as horas_semanais_planejadas,
        COALESCE((SELECT COUNT(*) FROM assuntos a JOIN materias m ON m.id = a.materia_id
          WHERE m.concurso_id = c.id), 0) as total_topicos,
        COALESCE((SELECT COUNT(*) FROM assuntos a JOIN materias m ON m.id = a.materia_id
          WHERE m.concurso_id = c.id AND a.concluido = true), 0) as topicos_concluidos
      FROM concursos c WHERE c.user_id = $1 ORDER BY c.data_prova ASC NULLS LAST`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
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
  const requestId = `concurso-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const {
      nome, orgao, banca, cargo, data_prova, data_prova_estimada,
      data_prova_oficial, status, numero_questoes, peso_prova, observacoes, edital_url
    } = req.body;
    if (!nome || !nome.trim()) {
      console.warn(`[${requestId}] Nome do concurso ausente`);
      return res.status(400).json({ error: 'Nome do concurso é obrigatório' });
    }
    console.log(`[${requestId}] Criando concurso`, {
      userId: req.userId,
      nome: nome.trim(),
      orgao: orgao || null,
      banca: banca || null,
      cargo: cargo || null,
      dataProvaEstimada: data_prova_estimada || data_prova || null,
      dataProvaOficial: data_prova_oficial || null,
      status: status || 'estudando',
      numeroQuestoes: numero_questoes || null,
      pesoProva: peso_prova || null,
      temObservacoes: Boolean(observacoes),
      temEditalUrl: Boolean(edital_url),
    });
    const result = await pool.query(
      `INSERT INTO concursos
        (user_id, nome, orgao, banca, cargo, data_prova, data_prova_estimada,
         data_prova_oficial, status, numero_questoes, peso_prova, observacoes, edital_url)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6::date,$7::date),$7::date,$6::date,
         COALESCE($8::varchar,'estudando'),$9::integer,$10::numeric,$11::text,$12::text)
       RETURNING *`,
      [req.userId, nome.trim(), orgao || null, banca || null, cargo || null, data_prova_oficial || null,
        data_prova_estimada || data_prova || null, status, numero_questoes || null, peso_prova || null,
        observacoes || null, edital_url || null]
    );
    console.log(`[${requestId}] Concurso criado`, { id: result.rows[0]?.id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`[${requestId}] Erro ao criar concurso`, {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      table: err.table,
      column: err.column,
      constraint: err.constraint,
      userId: req.userId,
    });
    res.status(500).json({ error: 'Erro ao criar concurso', requestId });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      nome, orgao, banca, cargo, data_prova, data_prova_estimada,
      data_prova_oficial, status, numero_questoes, peso_prova, observacoes, edital_url, ativo
    } = req.body;
    const result = await pool.query(
      `UPDATE concursos SET nome=COALESCE($1,nome), orgao=$2, banca=$3, cargo=$4,
       data_prova=COALESCE($5, data_prova_oficial, data_prova_estimada, data_prova),
       data_prova_estimada=$6, data_prova_oficial=$7, status=COALESCE($8,status),
       numero_questoes=$9, peso_prova=$10, observacoes=$11, edital_url=$12,
       ativo=COALESCE($13, ativo)
       WHERE id=$14 AND user_id=$15 RETURNING *`,
      [nome, orgao || null, banca || null, cargo || null, data_prova || null,
        data_prova_estimada || null, data_prova_oficial || null, status, numero_questoes || null,
        peso_prova || null, observacoes || null, edital_url || null, ativo, req.params.id, req.userId]
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
