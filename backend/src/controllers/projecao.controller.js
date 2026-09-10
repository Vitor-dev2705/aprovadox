const pool = require('../config/database');

const DAY = 24 * 60 * 60 * 1000;

function risk({ days, requiredHours, availableHours, coverage, overdueReviews, accuracy }) {
  if (days == null) return { code: 'SEM_DATA', label: 'META SEM DATA', color: 'slate' };
  const capacityRatio = requiredHours > 0 ? availableHours / requiredHours : 1;
  if (capacityRatio >= 1 && coverage >= 70 && overdueReviews < 5 && accuracy >= 70) {
    return { code: 'NO_RITMO', label: 'NO RITMO', color: 'green' };
  }
  if (capacityRatio >= 0.85 && coverage >= 45) return { code: 'ATENCAO', label: 'ATENÇÃO', color: 'yellow' };
  if (capacityRatio >= 0.65 || coverage >= 25) return { code: 'ATRASADO', label: 'ATRASADO', color: 'orange' };
  return { code: 'RISCO_ALTO', label: 'RISCO ALTO', color: 'red' };
}

exports.get = async (req, res) => {
  const concursoId = Number(req.params.id);
  if (!Number.isInteger(concursoId)) return res.status(400).json({ error: 'Concurso inválido' });

  try {
    const concurso = await pool.query(
      `SELECT c.*, COALESCE(c.data_prova_oficial, c.data_prova_estimada, c.data_prova) AS data_alvo,
        COALESCE((SELECT SUM(m.horas_estimadas) FROM materias m WHERE m.concurso_id=c.id),0) AS horas_necessarias,
        COALESCE((SELECT SUM(s.duracao_minutos)/60.0 FROM sessoes_estudo s JOIN materias m ON m.id=s.materia_id WHERE m.concurso_id=c.id),0) AS horas_estudadas,
        COALESCE((SELECT SUM(m.meta_semanal_horas) FROM materias m WHERE m.concurso_id=c.id),0) AS horas_semanais
       FROM concursos c WHERE c.id=$1 AND c.user_id=$2`,
      [concursoId, req.userId]
    );
    if (!concurso.rows.length) return res.status(404).json({ error: 'Concurso não encontrado' });

    const [topics, reviews, questions] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE a.concluido)::int concluidos
        FROM assuntos a JOIN materias m ON m.id=a.materia_id WHERE m.concurso_id=$1`, [concursoId]),
      pool.query(`SELECT COUNT(*)::int total FROM revisoes r JOIN materias m ON m.id=r.materia_id
        WHERE m.concurso_id=$1 AND r.concluida=false AND r.data_revisao <= CURRENT_DATE`, [concursoId]),
      pool.query(`SELECT COALESCE(SUM(quantidade),0)::int total, COALESCE(SUM(acertos),0)::int acertos
        FROM resultados_questoes WHERE concurso_id=$1 AND user_id=$2`, [concursoId, req.userId])
    ]);
    const row = concurso.rows[0];
    const days = row.data_alvo ? Math.max(0, Math.ceil((new Date(row.data_alvo).getTime() - Date.now()) / DAY)) : null;
    const weeks = days == null ? null : Math.max(days / 7, 1);
    const plannedWeekly = Number(row.horas_semanais) || 0;
    const requiredHours = Number(row.horas_necessarias) || 0;
    const availableHours = weeks == null ? 0 : plannedWeekly * weeks;
    const topicTotal = topics.rows[0].total;
    const topicDone = topics.rows[0].concluidos;
    const coverage = topicTotal ? Math.round(topicDone / topicTotal * 100) : 0;
    const totalQuestions = questions.rows[0].total;
    const accuracy = totalQuestions ? Math.round(questions.rows[0].acertos / totalQuestions * 100) : 0;
    const hoursPerWeekNeeded = weeks && requiredHours > Number(row.horas_estudadas)
      ? Math.max(0, (requiredHours - Number(row.horas_estudadas)) / weeks) : 0;
    const projectedFinish = plannedWeekly > 0
      ? new Date(Date.now() + Math.ceil(Math.max(requiredHours - Number(row.horas_estudadas), 0) / plannedWeekly * 7) * DAY)
      : null;
    const state = risk({ days, requiredHours, availableHours, coverage, overdueReviews: reviews.rows[0].total, accuracy });

    res.json({
      concurso: row,
      data_estimada: !row.data_prova_oficial && Boolean(row.data_prova_estimada),
      dias_restantes: days,
      horas_necessarias: requiredHours,
      horas_estudadas: Number(row.horas_estudadas),
      horas_disponiveis_projetadas: availableHours,
      horas_semanais_planejadas: plannedWeekly,
      horas_semanais_necessarias: Number(hoursPerWeekNeeded.toFixed(1)),
      deficit_horas: Math.max(0, Number((requiredHours - availableHours).toFixed(1))),
      cobertura_conteudo: coverage,
      topicos: { total: topicTotal, concluidos: topicDone, restantes: topicTotal - topicDone },
      questoes: { total: totalQuestions, acertos: questions.rows[0].acertos, aproveitamento: accuracy },
      revisoes_pendentes: reviews.rows[0].total,
      previsao_termino: projectedFinish,
      risco: state,
      mensagem: state.code === 'SEM_DATA'
        ? 'Defina uma data quando o edital for publicado para gerar a projeção.'
        : state.code === 'NO_RITMO'
          ? 'Seu ritmo atual é suficiente para concluir o conteúdo dentro da projeção.'
          : `O planejamento indica ${Number(hoursPerWeekNeeded.toFixed(1))}h por semana para cobrir o conteúdo.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao calcular projeção do concurso' });
  }
};
