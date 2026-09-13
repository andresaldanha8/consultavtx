import {
  Submission,
  SubmissionInput,
  SubmissionStatus,
  DashboardStats,
  StatItem,
  AuthResponse,
} from '../types';
import { INITIAL_DEMO_SUBMISSIONS } from './demoData';

const STORAGE_KEY = 'vdx_demo_submissions_v3';
const LEGACY_STORAGE_KEYS = ['vdx_demo_submissions', 'vdx_demo_submissions_v1', 'vdx_demo_submissions_v2'];
const DEMO_TOKEN = 'demo-session-token-vdx-2026';

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('vdx_data_updated'));
    } catch (_) {}
  }
}

function getPristineMocks(): Submission[] {
  return INITIAL_DEMO_SUBMISSIONS.map((s) => ({
    ...s,
    status: 'VALID' as SubmissionStatus,
    isDemo: true,
    updatedAt: s.createdAt,
  }));
}

function readStorage(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const pristine = getPristineMocks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pristine));
      return pristine;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const pristine = getPristineMocks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pristine));
      return pristine;
    }
    return parsed;
  } catch (err) {
    console.warn('[demoRepository] Failed to read localStorage, falling back to in-memory initial data', err);
    return getPristineMocks();
  }
}

function writeStorage(items: Submission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[demoRepository] Failed to write to localStorage', err);
  }
}

export const demoRepository = {
  isDemoMode: () => true,

  async getSubmissions(
    _token?: string,
    filter?: { status?: string; search?: string }
  ): Promise<Submission[]> {
    let list = readStorage();

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((item) => item.status === filter.status);
    }

    if (filter?.search && filter.search.trim()) {
      const term = filter.search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          (item.comentario && item.comentario.toLowerCase().includes(term)) ||
          item.localidade.toLowerCase().includes(term) ||
          item.prioridade1.toLowerCase().includes(term) ||
          item.prioridade2.toLowerCase().includes(term) ||
          (item.localidadeInformada && item.localidadeInformada.toLowerCase().includes(term))
      );
    }

    // Sort newest first
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async submitResponse(
    input: SubmissionInput
  ): Promise<{ success: boolean; id: string; message: string }> {
    // Basic validation
    if (typeof input.moraNoMunicipio !== 'boolean') {
      throw new Error('Resposta sobre moradia em Vitória do Xingu é obrigatória.');
    }
    if (!input.prioridade1) {
      throw new Error('A Prioridade Nº 1 é obrigatória.');
    }
    if (!input.prioridade2) {
      throw new Error('A Segunda Prioridade é obrigatória.');
    }
    if (input.prioridade1 === input.prioridade2) {
      throw new Error('A segunda prioridade não pode ser idêntica à Prioridade Nº 1.');
    }

    const items = readStorage();
    const newId = `sub-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newSubmission: Submission = {
      id: newId,
      moraNoMunicipio: input.moraNoMunicipio,
      localidade: input.moraNoMunicipio ? input.localidade : 'Não mora no município',
      localidadeInformada: input.localidadeInformada?.trim() || null,
      prioridade1: input.prioridade1,
      prioridade1Outra: input.prioridade1Outra?.trim() || null,
      prioridade2: input.prioridade2,
      prioridade2Outra: input.prioridade2Outra?.trim() || null,
      comentario: input.comentario?.trim() || null,
      faixaEtaria: input.faixaEtaria || null,
      status: 'VALID',
      createdAt: nowIso,
      updatedAt: nowIso,
      isDemo: false, // New live demonstration entry
    };

    // Prepend new submission
    items.unshift(newSubmission);
    writeStorage(items);
    notifyChange();

    return {
      success: true,
      id: newId,
      message: 'Sua voz foi registrada com sucesso!',
    };
  },

  async updateSubmissionStatus(
    id: string,
    newStatus: SubmissionStatus,
    _token?: string
  ): Promise<Submission> {
    const items = readStorage();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error('Resposta não encontrada.');
    }

    items[index] = {
      ...items[index],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    writeStorage(items);
    notifyChange();
    return items[index];
  },

  async getDashboardStats(_token?: string): Promise<DashboardStats> {
    const all = readStorage();
    const validOnly = all.filter((s) => s.status === 'VALID');

    const participacoesRecebidas = all.length;
    const respostasValidas = validOnly.length;
    const respostasInvalidadas = all.filter((s) => s.status === 'INVALID').length;
    const moradoresVitoriaXingu = validOnly.filter((s) => s.moraNoMunicipio).length;

    const target = 100;
    const metaAlcancada = respostasValidas >= target;
    const percent = target > 0 ? Math.round((respostasValidas / target) * 100) : 0;
    const metaText = metaAlcancada
      ? `META ALCANÇADA — ${respostasValidas} participações`
      : `${respostasValidas} / ${target} — ${percent}%`;

    // 1. Prioridade nº 1 (somente VALID)
    const p1Map = new Map<string, number>();
    for (const s of validOnly) {
      p1Map.set(s.prioridade1, (p1Map.get(s.prioridade1) || 0) + 1);
    }
    const prioridade1: StatItem[] = Array.from(p1Map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: respostasValidas > 0 ? Math.round((count / respostasValidas) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 2. Áreas mais priorizadas considerando prioridade 1 + prioridade 2 combinadas
    const combMap = new Map<string, number>();
    for (const s of validOnly) {
      if (s.prioridade1) combMap.set(s.prioridade1, (combMap.get(s.prioridade1) || 0) + 1);
      if (s.prioridade2) combMap.set(s.prioridade2, (combMap.get(s.prioridade2) || 0) + 1);
    }
    const totalChoices = Array.from(combMap.values()).reduce((acc, c) => acc + c, 0);
    const prioridadesCombinadas: StatItem[] = Array.from(combMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: totalChoices > 0 ? Math.round((count / totalChoices) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 3. Distribuição por localidade
    const locMap = new Map<string, number>();
    for (const s of validOnly) {
      locMap.set(s.localidade, (locMap.get(s.localidade) || 0) + 1);
    }
    const distribuicaoLocalidade: StatItem[] = Array.from(locMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: respostasValidas > 0 ? Math.round((count / respostasValidas) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Faixa etária
    const ageMap = new Map<string, number>();
    for (const s of validOnly) {
      const age = s.faixaEtaria || 'Não informada';
      ageMap.set(age, (ageMap.get(age) || 0) + 1);
    }
    const faixaEtaria: StatItem[] = Array.from(ageMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: respostasValidas > 0 ? Math.round((count / respostasValidas) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Comentários recentes (somente VALID e com texto)
    const recentComments = validOnly
      .filter((s) => s.comentario && s.comentario.trim().length > 0)
      .slice(0, 15)
      .map((s) => ({
        id: s.id,
        prioridade1: s.prioridade1,
        comentario: s.comentario!,
        createdAt: s.createdAt,
      }));

    return {
      participacoesRecebidas,
      respostasValidas,
      respostasInvalidadas,
      moradoresVitoriaXingu,
      meta: {
        metaAlcancada,
        current: respostasValidas,
        target,
        percent,
        text: metaText,
      },
      prioridade1,
      prioridadesCombinadas,
      distribuicaoLocalidade,
      faixaEtaria,
      recentComments,
      storageMode: 'demo_local',
      isDemoMode: true,
    };
  },

  async exportCsv(type: 'valid' | 'all', _token?: string): Promise<Blob> {
    const all = readStorage();
    const dataset = type === 'valid' ? all.filter((s) => s.status === 'VALID') : all;

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'ID',
      'Data e Hora',
      'Mora em Vitória do Xingu',
      'Localidade',
      'Localidade Informada',
      'Prioridade 1',
      'Prioridade 1 Detalhe',
      'Prioridade 2',
      'Prioridade 2 Detalhe',
      'Comentário',
      'Faixa Etária',
      'Status',
      'Origem',
    ];

    const rows = dataset.map((s) => [
      escapeCsv(s.id),
      escapeCsv(new Date(s.createdAt).toLocaleString('pt-BR')),
      escapeCsv(s.moraNoMunicipio ? 'Sim' : 'Não'),
      escapeCsv(s.localidade),
      escapeCsv(s.localidadeInformada || ''),
      escapeCsv(s.prioridade1),
      escapeCsv(s.prioridade1Outra || ''),
      escapeCsv(s.prioridade2),
      escapeCsv(s.prioridade2Outra || ''),
      escapeCsv(s.comentario || ''),
      escapeCsv(s.faixaEtaria || 'Não informada'),
      escapeCsv(s.status),
      escapeCsv(s.isDemo ? 'DEMO/MOCK' : 'DEMO_AO_VIVO'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },

  async login(user: string, pass: string): Promise<AuthResponse> {
    const trimmedUser = user.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // In demo mode: accept 'admin' with 'admin', 'admin123', or 'VitoriaDoXingu2026!Admin'
    if (
      trimmedUser === 'admin' &&
      (trimmedPass === 'admin' ||
        trimmedPass === 'admin123' ||
        trimmedPass === 'VitoriaDoXingu2026!Admin' ||
        trimmedPass === 'vdx2026')
    ) {
      return {
        success: true,
        token: DEMO_TOKEN,
        username: 'admin',
      };
    }

    throw new Error('Credenciais inválidas. Para o modo demonstração, utilize o usuário "admin" e a senha "admin123".');
  },

  async resetDemoData(): Promise<void> {
    // Clean up any legacy storage keys
    for (const key of LEGACY_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }

    const pristine = getPristineMocks();
    writeStorage(pristine);
    notifyChange();
  },

  async clearLiveSubmissions(): Promise<void> {
    const all = readStorage();
    const demoOnly = all.filter((s) => s.isDemo === true);
    if (demoOnly.length === 0) {
      const pristine = getPristineMocks();
      writeStorage(pristine);
    } else {
      writeStorage(demoOnly);
    }
    notifyChange();
  },
};
