import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  saveSubmission,
  getAllSubmissions,
  updateSubmissionStatus,
  getDashboardStats,
  getStorageMode,
} from './db';
import {
  verifyAdminCredentials,
  generateAdminToken,
  requireAdminAuth,
} from './auth';
import {
  PRIORITY_OPTIONS,
  LOCATION_OPTIONS,
  AGE_RANGE_OPTIONS,
  Submission,
} from '../src/types';

export const apiRouter = Router();

// In-memory rate limiting map for submissions: IP Hash -> timestamps array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 12;

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ipHash) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitMap.set(ipHash, validTimestamps);
  return true;
}

// Basic string sanitization
function sanitize(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // remove HTML tags
    .trim();
}

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    storageMode: getStorageMode(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// PÚBLICO: Submissão da consulta comunitária
// ==========================================
apiRouter.post('/submissions', async (req: Request, res: Response) => {
  try {
    const {
      moraNoMunicipio,
      localidade,
      localidadeInformada,
      prioridade1,
      prioridade1Outra,
      prioridade2,
      prioridade2Outra,
      comentario,
      faixaEtaria,
      website_hp,
    } = req.body;

    // 1. Proteção Honeypot: se campo invisível de bot for preenchido, descarta
    if (website_hp && typeof website_hp === 'string' && website_hp.trim() !== '') {
      console.warn('[Security] Honeypot triggered, submission dropped silently.');
      res.status(200).json({ success: true, message: 'Registrado com sucesso.' });
      return;
    }

    // 2. Rate limiting por hash de IP anônimo
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';
    const ipHash = crypto.createHash('sha256').update(clientIp + 'salt_vdx').digest('hex').substring(0, 16);

    if (!checkRateLimit(ipHash)) {
      res.status(429).json({
        error: 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.',
      });
      return;
    }

    // 3. Validações Server-side rigorosas
    // P1: Moradia
    if (typeof moraNoMunicipio !== 'boolean') {
      res.status(400).json({ error: 'Resposta sobre moradia em Vitória do Xingu é obrigatória.' });
      return;
    }

    // P2: Localidade
    let finalLocalidade = sanitize(localidade);
    let finalLocalidadeInformada: string | null = null;

    if (moraNoMunicipio) {
      if (!LOCATION_OPTIONS.includes(finalLocalidade as any)) {
        res.status(400).json({ error: 'Localidade selecionada inválida.' });
        return;
      }
      if (
        finalLocalidade === 'Zona rural / comunidade' ||
        finalLocalidade === 'Outro local do município'
      ) {
        finalLocalidadeInformada = sanitize(localidadeInformada).substring(0, 255) || null;
      }
    } else {
      finalLocalidade = 'Não mora no município';
    }

    // P3: Prioridade 1
    const p1Sanitized = sanitize(prioridade1);
    if (!PRIORITY_OPTIONS.includes(p1Sanitized as any)) {
      res.status(400).json({ error: 'Prioridade nº 1 selecionada é inválida.' });
      return;
    }

    let p1Outra: string | null = null;
    if (p1Sanitized === 'Outra') {
      p1Outra = sanitize(prioridade1Outra).substring(0, 255);
      if (!p1Outra) {
        res.status(400).json({ error: 'Informe a descrição curta para a prioridade nº 1.' });
        return;
      }
    }

    // P4: Segunda prioridade
    const p2Sanitized = sanitize(prioridade2);
    if (!PRIORITY_OPTIONS.includes(p2Sanitized as any)) {
      res.status(400).json({ error: 'Segunda prioridade selecionada é inválida.' });
      return;
    }

    if (p2Sanitized === p1Sanitized) {
      res.status(400).json({
        error: 'A segunda prioridade não pode ser igual à prioridade nº 1.',
      });
      return;
    }

    let p2Outra: string | null = null;
    if (p2Sanitized === 'Outra') {
      p2Outra = sanitize(prioridade2Outra).substring(0, 255);
      if (!p2Outra) {
        res.status(400).json({ error: 'Informe a descrição curta para a segunda prioridade.' });
        return;
      }
    }

    // P5: Comentário (opcional, máx 300 caracteres)
    let finalComentario: string | null = null;
    if (comentario && typeof comentario === 'string') {
      const trimmed = sanitize(comentario).substring(0, 300);
      if (trimmed.length > 0) {
        finalComentario = trimmed;
      }
    }

    // P6: Faixa etária (opcional)
    let finalFaixaEtaria: string | null = null;
    if (faixaEtaria && typeof faixaEtaria === 'string') {
      const ageTrimmed = sanitize(faixaEtaria);
      if (AGE_RANGE_OPTIONS.includes(ageTrimmed as any)) {
        finalFaixaEtaria = ageTrimmed;
      }
    }

    // Construção da submissão com ID e carimbo de tempo
    const nowIso = new Date().toISOString();
    const submissionRecord: Submission & { ipHash: string } = {
      id: crypto.randomUUID(),
      moraNoMunicipio,
      localidade: finalLocalidade,
      localidadeInformada: finalLocalidadeInformada,
      prioridade1: p1Sanitized,
      prioridade1Outra: p1Outra,
      prioridade2: p2Sanitized,
      prioridade2Outra: p2Outra,
      comentario: finalComentario,
      faixaEtaria: finalFaixaEtaria,
      status: 'VALID',
      ipHash,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await saveSubmission(submissionRecord);

    res.status(201).json({
      success: true,
      message: 'Sua voz foi registrada com sucesso!',
      id: submissionRecord.id,
    });
  } catch (err: any) {
    console.error('[API] Erro ao processar submissão:', err);
    res.status(500).json({
      error: 'Ocorreu um erro ao salvar sua resposta. Por favor, tente novamente em instantes.',
    });
  }
});

// ==========================================
// ADMIN: Autenticação
// ==========================================
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Informe o usuário e a senha.' });
    return;
  }

  if (verifyAdminCredentials(username, password)) {
    const token = generateAdminToken(username);
    res.json({
      success: true,
      token,
      username,
    });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas. Verifique o usuário e a senha.' });
  }
});

apiRouter.get('/admin/me', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    user: process.env.ADMIN_USER || 'admin',
  });
});

// ==========================================
// ADMIN: Indicadores e Gráficos
// ==========================================
apiRouter.get('/admin/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    console.error('[Admin] Erro ao obter estatísticas:', err);
    res.status(500).json({ error: 'Erro ao calcular estatísticas do painel.' });
  }
});

// ==========================================
// ADMIN: Lista de Respostas
// ==========================================
apiRouter.get('/admin/submissions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const submissions = await getAllSubmissions({ status, search });
    res.json({
      total: submissions.length,
      submissions,
    });
  } catch (err: any) {
    console.error('[Admin] Erro ao listar respostas:', err);
    res.status(500).json({ error: 'Erro ao listar respostas.' });
  }
});

// ==========================================
// ADMIN: Alterar Status (VALID <-> INVALID)
// ==========================================
apiRouter.patch('/admin/submissions/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'VALID' && status !== 'INVALID') {
      res.status(400).json({ error: 'Status deve ser VALID ou INVALID.' });
      return;
    }

    const updated = await updateSubmissionStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Resposta não encontrada.' });
      return;
    }

    res.json({
      success: true,
      submission: updated,
    });
  } catch (err: any) {
    console.error('[Admin] Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status da resposta.' });
  }
});

// ==========================================
// ADMIN: Exportação de CSV
// ==========================================
apiRouter.get('/admin/export/csv', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string)?.toLowerCase() === 'all' ? 'all' : 'valid';
    const all = await getAllSubmissions({
      status: type === 'valid' ? 'VALID' : 'ALL',
    });

    // Formatting CSV with Excel-compatible UTF-8 BOM and semicolon delimiters
    const headers = [
      'ID',
      'Data/Hora',
      'Mora no Município',
      'Localidade',
      'Localidade Informada',
      'Prioridade 1',
      'Prioridade 1 (Outra)',
      'Prioridade 2',
      'Prioridade 2 (Outra)',
      'Comentário',
      'Faixa Etária',
      'Status',
    ];

    function escapeCsvCell(val: any): string {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = all.map((s) => {
      const dataFormatada = new Date(s.createdAt).toLocaleString('pt-BR', {
        timeZone: 'America/Belem',
      });
      return [
        escapeCsvCell(s.id),
        escapeCsvCell(dataFormatada),
        escapeCsvCell(s.moraNoMunicipio ? 'Sim' : 'Não'),
        escapeCsvCell(s.localidade),
        escapeCsvCell(s.localidadeInformada || ''),
        escapeCsvCell(s.prioridade1),
        escapeCsvCell(s.prioridade1Outra || ''),
        escapeCsvCell(s.prioridade2),
        escapeCsvCell(s.prioridade2Outra || ''),
        escapeCsvCell(s.comentario || ''),
        escapeCsvCell(s.faixaEtaria || 'Não informada'),
        escapeCsvCell(s.status),
      ].join(';');
    });

    // UTF-8 BOM \uFEFF to force Excel to correctly render Portuguese accents
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n') + '\r\n';

    const filename = `100_vozes_vitoria_xingu_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('[Admin] Erro ao exportar CSV:', err);
    res.status(500).json({ error: 'Erro ao gerar arquivo CSV.' });
  }
});
