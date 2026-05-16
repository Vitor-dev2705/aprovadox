const pool = require('../config/database');

// Timezone do Brasil — todas as queries de data usam isso
// para que "hoje", "esta semana", "este mês" reflitam o horário local do usuário
const TZ = 'America/Sao_Paulo';
const TODAY     = `(NOW() AT TIME ZONE '${TZ}')::date`;
const DATA_LOCAL = `(data_inicio AT TIME ZONE 'UTC' AT TIME ZONE '${TZ}')`;
const WEEK_START = `DATE_TRUNC('week', ${TODAY})`;
const MONTH_START = `DATE_TRUNC('month', ${TODAY})`;

const frases = [
  "A disciplina é a ponte entre metas e conquistas.",
  "Cada hora de estudo te aproxima da aprovação.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Não estude até acertar. Estude até não errar mais.",
  "A aprovação é inevitável para quem não desiste.",
  "Seu futuro eu está torcendo por você agora.",
  "Estudar é plantar. A prova é a colheita.",
  "Consistência supera intensidade.",
  "O edital é o caminho. A dedicação é o combustível.",
  "Você está mais perto do que imagina.",
  "A dor do estudo é temporária. O cargo é para sempre.",
  "Grandes resultados exigem grandes sacrifícios.",
  "Quem estuda com estratégia, aprova com antecedência.",
  "Não existe atalho. Existe método.",
  "Sua aprovação está sendo construída agora.",
  "O concurseiro vencedor estuda quando ninguém está olhando.",
  "Transforme o cansaço em combustível.",
  "A cada questão resolvida, um passo mais perto.",
  "Acredite no processo. Os resultados virão.",
  "Hoje é dia de ser melhor que ontem.",
  "A constância derrota o talento quando o talento não se esforça.",
  "Nenhum edital é maior que sua determinação.",
  "O melhor momento para estudar é agora.",
  "Sua rotina de hoje define seu resultado de amanhã.",
  "Não conte os dias. Faça os dias contarem.",
  "O fracasso é não tentar. Estudar já é vencer.",
  "Foque no progresso, não na perfeição.",
  "Cada revisão fortalece sua memória.",
  "A aprovação começa na mente antes de chegar no gabarito.",
  "Quem persiste, conquista."
];

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const [userRes, todayRes, weekRes, monthRes, streakRes, reviewsRes, topMateriaRes, weeklyChartRes] = await Promise.all([
      pool.query('SELECT name, xp, level, streak FROM users WHERE id = $1', [userId]),
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL}::date = ${TODAY}`, [userId]),
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${WEEK_START}`, [userId]),
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${MONTH_START}`, [userId]),
      pool.query('SELECT streak, last_study_date FROM users WHERE id=$1', [userId]),
      pool.query(`SELECT COUNT(*) as total FROM revisoes WHERE user_id=$1 AND data_revisao <= ${TODAY} AND concluida=false`, [userId]),
      pool.query(`SELECT m.nome, m.cor, SUM(s.duracao_minutos) as min FROM sessoes_estudo s JOIN materias m ON s.materia_id=m.id WHERE s.user_id=$1 GROUP BY m.nome, m.cor ORDER BY min DESC LIMIT 1`, [userId]),
      pool.query(`SELECT EXTRACT(DOW FROM ${DATA_LOCAL}) as dia, SUM(duracao_minutos) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${WEEK_START} GROUP BY dia ORDER BY dia`, [userId])
    ]);

    const user = userRes.rows[0];
    const frase = frases[Math.floor(Math.random() * frases.length)];

    const metaRes = await pool.query(
      `SELECT * FROM metas WHERE user_id=$1 AND tipo='diaria' AND concluida=false ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    res.json({
      user: { name: user.name, xp: user.xp, level: user.level, streak: user.streak },
      hoje_minutos: parseInt(todayRes.rows[0].min),
      semana_minutos: parseInt(weekRes.rows[0].min),
      mes_minutos: parseInt(monthRes.rows[0].min),
      streak: user.streak,
      revisoes_pendentes: parseInt(reviewsRes.rows[0].total),
      materia_top: topMateriaRes.rows[0] || null,
      meta_diaria: metaRes.rows[0] || null,
      grafico_semana: weeklyChartRes.rows,
      frase_motivacional: frase
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

exports.getEstatisticas = async (req, res) => {
  try {
    const userId = req.userId;

    const [
      todayRes, weekRes, monthRes, totalRes,
      porMateria, porDiaSemana, porDia30d, porHora,
      evolucaoMensal, metasCumpridas, porTecnica, totalSessoes
    ] = await Promise.all([
      // Totais de tempo — todos com timezone Brasil
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL}::date = ${TODAY}`, [userId]),
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${WEEK_START}`, [userId]),
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${MONTH_START}`, [userId]),
      pool.query(`SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1`, [userId]),
      // Distribuições
      pool.query(`SELECT m.nome, m.cor, SUM(s.duracao_minutos) as minutos FROM sessoes_estudo s JOIN materias m ON s.materia_id=m.id WHERE s.user_id=$1 GROUP BY m.nome, m.cor ORDER BY minutos DESC`, [userId]),
      pool.query(`SELECT EXTRACT(DOW FROM ${DATA_LOCAL}) as dia, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${WEEK_START} GROUP BY dia ORDER BY dia`, [userId]),
      pool.query(`SELECT EXTRACT(DOW FROM ${DATA_LOCAL}) as dia, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 AND ${DATA_LOCAL} >= ${TODAY} - 30 GROUP BY dia ORDER BY dia`, [userId]),
      pool.query(`SELECT EXTRACT(HOUR FROM ${DATA_LOCAL}) as hora, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 GROUP BY hora ORDER BY hora`, [userId]),
      // Evolução mensal — usa timezone para agrupar no mês correto
      pool.query(`SELECT DATE_TRUNC('month', ${DATA_LOCAL}) as mes, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 GROUP BY mes ORDER BY mes DESC LIMIT 12`, [userId]),
      pool.query(`SELECT COUNT(*) FILTER (WHERE concluida) as cumpridas, COUNT(*) as total FROM metas WHERE user_id=$1`, [userId]),
      pool.query(`SELECT tecnica, SUM(duracao_minutos) as minutos, COUNT(*) as sessoes FROM sessoes_estudo WHERE user_id=$1 AND tecnica IS NOT NULL GROUP BY tecnica ORDER BY minutos DESC`, [userId]),
      pool.query(`SELECT COUNT(*) as total FROM sessoes_estudo WHERE user_id=$1`, [userId])
    ]);

    res.json({
      hoje_minutos: parseInt(todayRes.rows[0].min),
      semana_minutos: parseInt(weekRes.rows[0].min),
      mes_minutos: parseInt(monthRes.rows[0].min),
      total_minutos: parseInt(totalRes.rows[0].min),
      total_sessoes: parseInt(totalSessoes.rows[0].total),
      por_materia: porMateria.rows,
      por_dia_semana: porDiaSemana.rows,
      por_dia_30d: porDia30d.rows,
      por_hora: porHora.rows,
      evolucao_mensal: evolucaoMensal.rows,
      metas: metasCumpridas.rows[0],
      por_tecnica: porTecnica.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// Calendário mensal — sessões agrupadas por dia
exports.getCalendario = async (req, res) => {
  try {
    const userId = req.userId;
    const mes = req.query.mes || new Date().toISOString().slice(0, 7); // '2026-05'
    const startDate = `${mes}-01`;

    const result = await pool.query(
      `SELECT
        ${DATA_LOCAL}::date as data,
        COUNT(*) as sessoes,
        COALESCE(SUM(duracao_minutos), 0) as minutos
      FROM sessoes_estudo
      WHERE user_id = $1
        AND ${DATA_LOCAL}::date >= $2::date
        AND ${DATA_LOCAL}::date < ($2::date + INTERVAL '1 month')
      GROUP BY data
      ORDER BY data`,
      [userId, startDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar calendário' });
  }
};

// Atividades recentes — últimas sessões com detalhes
exports.getAtividades = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      `SELECT s.id, s.duracao_minutos, s.tecnica, s.data_inicio,
              m.nome as materia_nome, m.cor as materia_cor,
              c.titulo as conteudo_titulo,
              a.nome as assunto_nome
       FROM sessoes_estudo s
       LEFT JOIN materias m ON s.materia_id = m.id
       LEFT JOIN conteudos c ON s.conteudo_id = c.id
       LEFT JOIN assuntos a ON s.assunto_id = a.id
       WHERE s.user_id = $1
       ORDER BY s.data_inicio DESC
       LIMIT 10`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
};
