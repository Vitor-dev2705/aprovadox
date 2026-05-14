const pool = require('../config/database');

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
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio::date=CURRENT_DATE", [userId]),
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=DATE_TRUNC('week',CURRENT_DATE)", [userId]),
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=DATE_TRUNC('month',CURRENT_DATE)", [userId]),
      pool.query('SELECT streak, last_study_date FROM users WHERE id=$1', [userId]),
      pool.query("SELECT COUNT(*) as total FROM revisoes WHERE user_id=$1 AND data_revisao<=CURRENT_DATE AND concluida=false", [userId]),
      pool.query(`SELECT m.nome, m.cor, SUM(s.duracao_minutos) as min FROM sessoes_estudo s JOIN materias m ON s.materia_id=m.id WHERE s.user_id=$1 GROUP BY m.nome, m.cor ORDER BY min DESC LIMIT 1`, [userId]),
      pool.query(`SELECT EXTRACT(DOW FROM data_inicio) as dia, SUM(duracao_minutos) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=DATE_TRUNC('week',CURRENT_DATE) GROUP BY dia ORDER BY dia`, [userId])
    ]);

    const user = userRes.rows[0];
    const frase = frases[Math.floor(Math.random() * frases.length)];

    const metaRes = await pool.query(
      "SELECT * FROM metas WHERE user_id=$1 AND tipo='diaria' AND concluida=false ORDER BY created_at DESC LIMIT 1",
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
      // Totais de tempo
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio::date=CURRENT_DATE", [userId]),
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=DATE_TRUNC('week',CURRENT_DATE)", [userId]),
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=DATE_TRUNC('month',CURRENT_DATE)", [userId]),
      pool.query("SELECT COALESCE(SUM(duracao_minutos),0) as min FROM sessoes_estudo WHERE user_id=$1", [userId]),
      // Distribuições
      pool.query(`SELECT m.nome, m.cor, SUM(s.duracao_minutos) as minutos FROM sessoes_estudo s JOIN materias m ON s.materia_id=m.id WHERE s.user_id=$1 GROUP BY m.nome, m.cor ORDER BY minutos DESC`, [userId]),
      pool.query(`SELECT EXTRACT(DOW FROM data_inicio) as dia, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=DATE_TRUNC('week',CURRENT_DATE) GROUP BY dia ORDER BY dia`, [userId]),
      pool.query(`SELECT EXTRACT(DOW FROM data_inicio) as dia, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 AND data_inicio>=CURRENT_DATE-30 GROUP BY dia ORDER BY dia`, [userId]),
      pool.query(`SELECT EXTRACT(HOUR FROM data_inicio) as hora, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 GROUP BY hora ORDER BY hora`, [userId]),
      // Evolução e metas
      pool.query(`SELECT DATE_TRUNC('month', data_inicio) as mes, SUM(duracao_minutos) as minutos FROM sessoes_estudo WHERE user_id=$1 GROUP BY mes ORDER BY mes DESC LIMIT 12`, [userId]),
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
