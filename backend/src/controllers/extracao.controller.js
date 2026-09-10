/**
 * Extrator inteligente de matérias e conteúdos a partir de editais.
 *
 * Aceita:
 *  - URL pública (PDF ou HTML)
 *  - Texto colado pelo usuário
 *  - Filtro por cargo
 *
 * Estratégia: preserva a hierarquia matéria -> conteúdo -> subconteúdo:
 *  - "CONHECIMENTOS BÁSICOS"
 *  - "CONHECIMENTOS ESPECÍFICOS"
 *  - "CONTEÚDO PROGRAMÁTICO"
 *  - Listas numeradas (1. Português, 2. Matemática, etc.)
 */

let pdfParse;
try { pdfParse = require('pdf-parse'); } catch { pdfParse = null; }

// Termos que geralmente indicam o início do conteúdo programático
const SECTION_START = /(CONTEÚDO\s+PROGRAMÁTICO|CONHECIMENTOS\s+BÁSICOS|CONHECIMENTOS\s+ESPECÍFICOS|CONHECIMENTOS\s+GERAIS|MATÉRIAS|DISCIPLINAS)/gi;

// Palavras-chave que reconhecem matérias comuns em concursos brasileiros
const MATERIAS_COMUNS = [
  'Português', 'Língua Portuguesa', 'Gramática', 'Redação',
  'Matemática', 'Raciocínio Lógico', 'Raciocínio Lógico-Matemático',
  'Informática', 'Noções de Informática', 'Tecnologia da Informação',
  'Direito Constitucional', 'Direito Administrativo', 'Direito Civil',
  'Direito Penal', 'Direito Processual Civil', 'Direito Processual Penal',
  'Direito Tributário', 'Direito Trabalhista', 'Direito Empresarial',
  'Atualidades', 'Legislação Específica', 'Legislação Aplicada',
  'Conhecimentos Gerais', 'Ética', 'Ética no Serviço Público',
  'Administração Pública', 'Administração Geral', 'Gestão Pública',
  'Contabilidade', 'Economia', 'Estatística', 'Finanças Públicas',
  'História', 'Geografia', 'Sociologia', 'Filosofia',
  'Inglês', 'Espanhol', 'Língua Inglesa',
  'Auditoria', 'Controle Interno', 'Orçamento Público',
  'Saúde Pública', 'SUS', 'Enfermagem', 'Anatomia', 'Fisiologia',
  'Pedagogia', 'Didática', 'Educação',
  'Engenharia', 'Resistência dos Materiais',
];

/**
 * Faz fetch da URL e retorna o texto extraído
 */
async function fetchUrlText(url) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('URL inválida'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Protocolo não suportado');
  const host = parsed.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local') || /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) {
    throw new Error('URL não permitida');
  }

  const fetchFn = global.fetch || (await import('node-fetch')).default;
  const response = await fetchFn(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AprovadoX/1.0)' },
    redirect: 'follow',
  });

  if (!response.ok) throw new Error(`Status ${response.status}`);

  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
    if (!pdfParse) throw new Error('PDF parser indisponível no servidor');
    const buffer = Buffer.from(await response.arrayBuffer());
    const data = await pdfParse(buffer);
    return data.text;
  }

  // HTML — strip tags
  const html = await response.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encontra a posição inicial do "conteúdo programático" mais próxima do cargo.
 */
function findCargoSection(text, cargo) {
  if (!cargo) return text;
  const lower = text.toLowerCase();
  const cargoLower = cargo.toLowerCase().trim();
  const idx = lower.indexOf(cargoLower);
  if (idx < 0) return text;

  // Pega a partir do cargo, no máximo 30k caracteres (cobre a seção típica)
  return text.substring(idx, idx + 30000);
}

/**
 * Extrai matérias e tópicos prováveis usando heurísticas.
 */
function extractMaterias(text) {
  const structured = extractStructuredMaterias(text);
  if (structured.length) return structured;

  const found = new Map(); // nome -> array de tópicos

  // 1) Buscar matérias comuns conhecidas
  for (const materia of MATERIAS_COMUNS) {
    const regex = new RegExp(`\\b${materia.replace(/[-\s]/g, '[-\\s]?')}\\b`, 'i');
    if (regex.test(text)) {
      if (!found.has(materia)) found.set(materia, []);
    }
  }

  // 2) Buscar listas numeradas tipo "1. Português" / "1 - Matemática"
  const numberedPattern = /(?:^|\n|\.)\s*(\d{1,2})[\.\)\-\s]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç\s\-/]{4,80})(?=\.|\n|;|:)/g;
  let match;
  while ((match = numberedPattern.exec(text)) !== null) {
    const titulo = match[2].trim().replace(/\s+/g, ' ');
    if (titulo.length > 3 && titulo.length < 80 && !titulo.match(/^(art|inciso|parágrafo|alínea|capítulo)/i)) {
      // Capitaliza primeira letra
      const cleaned = titulo[0].toUpperCase() + titulo.slice(1);
      if (!found.has(cleaned)) found.set(cleaned, []);
    }
  }

  // 3) Busca por linhas em CAIXA ALTA (geralmente são títulos de matérias em editais)
  const caps = text.match(/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}){0,5}\b/g) || [];
  caps.forEach(c => {
    if (c.length < 60 && c.length > 4 && !/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{60,}$/.test(c)) {
      // Converte para Title Case
      const formatted = c.split(' ').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
      // Filtra coisas óbvias que não são matérias
      const blacklist = /(EDITAL|CONCURSO|CARGO|VAGAS?|SALÁRIO|PROVA|INSCRIÇÃO|ANEXO|TJSP|TJDF|MINISTÉRIO|REPÚBLICA|FEDERATIVA|BRASIL|DISPOSIÇÕES|REQUISITOS)/i;
      if (!blacklist.test(c) && !found.has(formatted)) {
        found.set(formatted, []);
      }
    }
  });

  // Remove duplicatas e limita
  const result = [...found.keys()]
    .filter(n => n.length > 3 && n.length < 80)
    .slice(0, 30);

  return result.map(nome => ({ nome, conteudos: [] }));
}

/**
 * Editais frequentemente usam o formato:
 *
 * LÍNGUA PORTUGUESA:
 * 1. Interpretação de textos.
 * 2. Ortografia.
 *
 * O título antes de ":" é a matéria e cada linha numerada é um conteúdo.
 */
function extractStructuredMaterias(text) {
  const materias = [];
  let atual = null;
  const ignoredHeaders = /^(conteúdo programático|conhecimentos básicos|conhecimentos específicos|conhecimentos gerais|matérias|disciplinas)$/i;
  const lines = text
    .replace(/\r/g, '')
    .replace(/([^\n])\s+(?=\d{1,2}\s*[-.)]\s+)/g, '$1\n')
    .split('\n');

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;

    const materiaMatch = line.match(/^(.{3,100}):\s*(.*)$/);
    if (materiaMatch && !ignoredHeaders.test(materiaMatch[1].trim())) {
      const nome = materiaMatch[1].trim().replace(/^\d+(?:\.\d+)*[\s.)-]+/, '');
      if (nome.length >= 3) {
        atual = { nome, conteudos: [] };
        materias.push(atual);
        const inlineContent = materiaMatch[2].trim();
        if (inlineContent) {
          addStructuredContent(atual, inlineContent);
        }
      }
      continue;
    }

    const conteudoMatch = line.match(/^\s*\d+(?:\.\d+)*[\s.)-]+\s*(.+)$/);
    if (conteudoMatch && atual) {
      addStructuredContent(atual, conteudoMatch[1].trim());
    }
  }

  return materias
    .filter((m, index, list) => list.findIndex(item => item.nome.toLowerCase() === m.nome.toLowerCase()) === index)
    .slice(0, 50);
}

function addStructuredContent(materia, rawContent) {
  const value = rawContent.replace(/[.;]+$/, '').trim();
  if (!value) return;

  const separator = value.search(/\s[-–—:]\s/);
  const titulo = separator >= 0 ? value.slice(0, separator).trim() : value;
  const details = separator >= 0 ? value.slice(separator + 3).trim() : '';
  if (titulo.length < 2) return;

  const conteudo = { titulo, assuntos: [] };
  if (details) conteudo.assuntos = splitSubtopics(details);
  materia.conteudos.push(conteudo);
}

function splitSubtopics(details) {
  const normalized = details.replace(/\s+/g, ' ').replace(/[.;]+$/, '').trim();
  if (!normalized) return [];

  const parts = normalized
    .split(/;|,/)
    .flatMap(item => item.split(/\s+e\s+/i))
    .map(item => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) return [];

  return parts.map(part => {
    let value = part.replace(/^e\s+/i, '').trim();
    value = value.replace(/^o\s+conceito\s+do\s+/i, '');
    value = value.replace(/^c(?:á|a)lculo\s+(?:do|da|dos|das)\s+/i, '');
    value = value.replace(/^(?:o|a|os|as|do|da|dos|das)\s+/i, '');
    return value.charAt(0).toUpperCase() + value.slice(1);
  });
}

exports.extractMaterias = extractMaterias;

/**
 * POST /api/extracao/edital
 * Body: { url?: string, texto?: string, cargo?: string }
 */
exports.extrairDoEdital = async (req, res) => {
  try {
    const { url, texto, cargo } = req.body;

    if (!url && !texto) {
      return res.status(400).json({ error: 'Informe URL ou texto do edital' });
    }

    let textoCompleto = '';

    if (texto) {
      textoCompleto = texto;
    } else {
      try {
        textoCompleto = await fetchUrlText(url);
      } catch (err) {
        console.error('Fetch error:', err.message);
        return res.status(400).json({
          error: 'Não foi possível acessar a URL. Tente colar o texto do edital diretamente.',
        });
      }
    }

    if (!textoCompleto || textoCompleto.length < 100) {
      return res.status(400).json({ error: 'Não foi possível extrair texto suficiente' });
    }

    // Filtra a seção do cargo se informado
    const sectionText = findCargoSection(textoCompleto, cargo);

    const materias = extractMaterias(sectionText);

    if (!materias.length) {
      return res.json({
        materias: [],
        message: 'Nenhuma matéria detectada automaticamente. Tente colar o texto manualmente ou verifique o cargo informado.',
        preview: sectionText.substring(0, 800),
      });
    }

    res.json({
      materias,
      total: materias.length,
      preview: sectionText.substring(0, 800),
    });
  } catch (err) {
    console.error('EXTRACAO ERROR:', err);
    res.status(500).json({ error: 'Erro ao extrair edital' });
  }
};
