const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Validador de senha forte
// Regras: mínimo 8 caracteres, ao menos 1 letra maiúscula, 1 letra minúscula,
// 1 número e 1 caractere especial.
function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve ter ao menos 1 letra maiúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve ter ao menos 1 letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve ter ao menos 1 número';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return 'A senha deve ter ao menos 1 caractere especial (!@#$%&* etc.)';
  }
  return null;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, data_nascimento } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }
    if (!data_nascimento) {
      return res.status(400).json({ error: 'Data de nascimento é obrigatória' });
    }

    // Validar idade mínima (10 anos) e máxima (120 anos)
    const nasc = new Date(data_nascimento);
    const hoje = new Date();
    const idade = (hoje - nasc) / (365.25 * 24 * 60 * 60 * 1000);
    if (isNaN(nasc.getTime()) || idade < 10 || idade > 120) {
      return res.status(400).json({ error: 'Data de nascimento inválida' });
    }

    // Validar senha forte
    const passError = validatePassword(password);
    if (passError) return res.status(400).json({ error: passError });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, data_nascimento) VALUES ($1, $2, $3, $4) RETURNING id, name, email, xp, level, streak, avatar_url, data_nascimento, created_at',
      [name, email, password_hash, data_nascimento]
    );
    const user = result.rows[0];
    const token = generateToken(user.id);

    await pool.query(
      "INSERT INTO gamificacao_log (user_id, tipo, descricao, xp_ganho) VALUES ($1, 'cadastro', 'Bem-vindo ao AprovadoX!', 50)",
      [user.id]
    );
    await pool.query('UPDATE users SET xp = 50 WHERE id = $1', [user.id]);

    res.status(201).json({ user: { ...user, xp: 50 }, token });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ error: 'Erro ao criar conta', detail: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = generateToken(user.id);
    const { password_hash, ...userData } = user;
    res.json({ user: userData, token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Erro ao fazer login', detail: err.message });
  }
};

// =====================================================
// FORGOT PASSWORD — verificar email + data de nascimento
// =====================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email, data_nascimento } = req.body;
    if (!email || !data_nascimento) {
      return res.status(400).json({ error: 'E-mail e data de nascimento são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT id, name, data_nascimento FROM users WHERE email = $1',
      [email]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: 'E-mail ou data de nascimento incorretos' });
    }

    const user = result.rows[0];
    // Comparar datas (formato YYYY-MM-DD)
    const dbDate = user.data_nascimento ? user.data_nascimento.toISOString().slice(0, 10) : null;
    if (!dbDate) {
      return res.status(400).json({ error: 'Não é possível recuperar — conta antiga sem data de nascimento. Entre em contato com o suporte.' });
    }
    if (dbDate !== data_nascimento) {
      return res.status(400).json({ error: 'E-mail ou data de nascimento incorretos' });
    }

    // Gerar token TEMPORÁRIO de reset (válido por 15 min)
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ resetToken, name: user.name, message: 'Verificação aprovada. Defina sua nova senha.' });
  } catch (err) {
    console.error('FORGOT ERROR:', err);
    res.status(500).json({ error: 'Erro ao processar recuperação', detail: err.message });
  }
};

// =====================================================
// RESET PASSWORD — usar resetToken para definir nova senha
// =====================================================
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const passError = validatePassword(newPassword);
    if (passError) return res.status(400).json({ error: passError });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, decoded.id]);

    res.json({ message: 'Senha redefinida com sucesso! Faça login novamente.' });
  } catch (err) {
    console.error('RESET ERROR:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha', detail: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, xp, level, streak, theme, plan, data_nascimento, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, theme, data_nascimento } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), theme = COALESCE($3, theme), data_nascimento = COALESCE($4, data_nascimento), updated_at = NOW() WHERE id = $5 RETURNING id, name, email, avatar_url, xp, level, streak, theme, data_nascimento',
      [name, email, theme, data_nascimento, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const passError = validatePassword(newPassword);
    if (passError) return res.status(400).json({ error: passError });

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.userId]);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    // Aceita base64 enviado como JSON: { avatar: 'data:image/png;base64,...' }
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Imagem inválida. Envie uma foto em base64.' });
    }

    // Limite: ~500KB de base64 (~370KB de imagem real)
    if (avatar.length > 700000) {
      return res.status(413).json({ error: 'Imagem muito grande. Reduza o tamanho/qualidade.' });
    }

    await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatar, req.userId]);
    res.json({ avatar_url: avatar });
  } catch (err) {
    console.error('AVATAR ERROR:', err);
    res.status(500).json({ error: 'Erro ao enviar avatar', detail: err.message });
  }
};
