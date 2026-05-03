-- =============================================================
-- AprovadoX - Seed de Usuário Demo
-- =============================================================
-- Senha: demo123 (hash bcrypt)
INSERT INTO users (name, email, password_hash, xp, level, streak, plan)
VALUES (
  'Demo AprovadoX',
  'demo@aprovadox.com',
  '$2a$12$on1mi/CSfun9izM0iNKJYuJVUlr9kRM7zZoJNHk1bFw.A2iWbUZzK',
  250, 3, 7, 'premium'
) ON CONFLICT DO NOTHING;

-- Matérias demo
DO $$
DECLARE uid INTEGER;
BEGIN
  SELECT id INTO uid FROM users WHERE email = 'demo@aprovadox.com';
  IF uid IS NOT NULL THEN
    INSERT INTO materias (user_id, nome, cor, meta_semanal_horas) VALUES
      (uid, 'Direito Constitucional', '#6366f1', 8),
      (uid, 'Português',              '#10b981', 5),
      (uid, 'Raciocínio Lógico',      '#f59e0b', 4),
      (uid, 'Informática',            '#3b82f6', 3),
      (uid, 'Legislação Específica',  '#8b5cf6', 6)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
