const pool = require('../config/database');

const TZ = 'America/Sao_Paulo';
const TODAY_BR = `(NOW() AT TIME ZONE '${TZ}')::date`;

/**
 * Gera notificações dinâmicas baseadas no estado real do usuário:
 * - Revisões pendentes (24h, 7d, 30d, 90d)
 * - Concursos próximos (≤ 30 dias)
 * - Sequência em risco (não estudou ontem)
 * - Meta diária ainda não cumprida
 * - Missões diárias pendentes
 * - Novas medalhas (últimas 24h)
 */
exports.getAll = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = [];

    // 1) REVISÕES PENDENTES (hoje ou atrasadas) - agora baseado em CONTEÚDO
    const reviews = await pool.query(`
      SELECT r.id, r.tipo, r.data_revisao,
             m.nome as materia_nome, m.cor as materia_cor,
             c.titulo as conteudo_titulo
      FROM revisoes r
      LEFT JOIN materias m ON r.materia_id = m.id
      LEFT JOIN conteudos c ON r.conteudo_id = c.id
      WHERE r.user_id = $1 AND r.data_revisao <= ${TODAY_BR} AND r.concluida = false
      ORDER BY r.data_revisao ASC
      LIMIT 5
    `, [userId]);

    reviews.rows.forEach(r => {
      const atrasada = new Date(r.data_revisao) < new Date(new Date().setHours(0,0,0,0));
      notifications.push({
        id: `revisao-${r.id}`,
        type: 'revisao',
        priority: atrasada ? 'high' : 'medium',
        icon: '🔄',
        title: atrasada ? 'Revisão atrasada' : 'Revisão para hoje',
        message: `${r.conteudo_titulo || r.materia_nome || 'Conteúdo'} — ${r.tipo}`,
        url: '/revisoes',
        color: r.materia_cor || '#6366f1',
        created_at: new Date().toISOString(),
      });
    });

    // 2) CONCURSOS PRÓXIMOS (≤ 30 dias)
    const concursos = await pool.query(`
      SELECT id, nome, data_prova, (data_prova - ${TODAY_BR}) as dias
      FROM concursos
      WHERE user_id = $1 AND data_prova IS NOT NULL
        AND data_prova >= ${TODAY_BR}
        AND data_prova <= ${TODAY_BR} + INTERVAL '30 days'
      ORDER BY data_prova ASC
      LIMIT 3
    `, [userId]);

    concursos.rows.forEach(c => {
      const urgente = c.dias <= 7;
      notifications.push({
        id: `concurso-${c.id}`,
        type: 'concurso',
        priority: urgente ? 'high' : 'medium',
        icon: urgente ? '🚨' : '📅',
        title: urgente ? 'Prova chegando!' : 'Concurso próximo',
        message: `${c.nome} — ${c.dias === 0 ? 'É HOJE!' : `faltam ${c.dias} dias`}`,
        url: '/concursos',
        color: urgente ? '#ef4444' : '#f59e0b',
        created_at: new Date().toISOString(),
      });
    });

    // 3) SEQUÊNCIA EM RISCO
    const userRes = await pool.query(
      'SELECT streak, last_study_date FROM users WHERE id = $1', [userId]
    );
    const user = userRes.rows[0];
    if (user?.streak > 0 && user.last_study_date) {
      const last = new Date(user.last_study_date);
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
      if (diff >= 1) {
        notifications.push({
          id: 'streak-risco',
          type: 'streak',
          priority: 'high',
          icon: '🔥',
          title: 'Sua sequência está em risco!',
          message: `${user.streak} dias seguidos. Estude hoje para não perder!`,
          url: '/cronometro',
          color: '#f97316',
          created_at: new Date().toISOString(),
        });
      }
    }

    // 4) META DIÁRIA NÃO CUMPRIDA (estudou < 30min hoje)
    const todayMin = await pool.query(
      `SELECT COALESCE(SUM(duracao_minutos), 0)::int as min
       FROM sessoes_estudo
       WHERE user_id = $1 AND (data_inicio AT TIME ZONE '${TZ}')::date = ${TODAY_BR}`,
      [userId]
    );
    const minHoje = todayMin.rows[0].min;
    if (minHoje < 30) {
      notifications.push({
        id: 'meta-diaria',
        type: 'study',
        priority: 'low',
        icon: '⏱️',
        title: 'Comece o seu estudo de hoje',
        message: minHoje === 0
          ? 'Você ainda não estudou hoje. Que tal começar agora?'
          : `Você estudou ${minHoje} min hoje. Continue!`,
        url: '/cronometro',
        color: '#6366f1',
        created_at: new Date().toISOString(),
      });
    }

    // 5) MEDALHAS RECENTES (últimas 24h)
    const medalhas = await pool.query(
      `SELECT nome, descricao, icone FROM medalhas
       WHERE user_id = $1 AND data_conquista >= NOW() - INTERVAL '24 hours'
       ORDER BY data_conquista DESC LIMIT 3`,
      [userId]
    );
    medalhas.rows.forEach((m, i) => {
      notifications.push({
        id: `medalha-${i}`,
        type: 'medalha',
        priority: 'medium',
        icon: m.icone || '🏆',
        title: 'Nova medalha conquistada!',
        message: `${m.nome} — ${m.descricao}`,
        url: '/gamificacao',
        color: '#fbbf24',
        created_at: new Date().toISOString(),
      });
    });

    // Ordenar por prioridade (high > medium > low)
    const order = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => order[a.priority] - order[b.priority]);

    res.json({
      notifications,
      total: notifications.length,
      unread: notifications.length, // sem sistema de "lido" persistente, todas são unread
    });
  } catch (err) {
    console.error('NOTIFICACOES ERROR:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};
