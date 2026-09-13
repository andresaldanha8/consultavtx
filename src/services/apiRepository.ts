import {
  Submission,
  SubmissionInput,
  SubmissionStatus,
  DashboardStats,
  AuthResponse,
} from '../types';

export const apiRepository = {
  isDemoMode: () => false,

  async getSubmissions(
    token?: string,
    filter?: { status?: string; search?: string }
  ): Promise<Submission[]> {
    const query = new URLSearchParams();
    if (filter?.status && filter.status !== 'ALL') query.set('status', filter.status);
    if (filter?.search?.trim()) query.set('search', filter.search.trim());

    const res = await fetch(`/api/admin/submissions?${query.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao carregar respostas do servidor.');
    }

    const data = await res.json();
    return data.submissions || [];
  },

  async submitResponse(
    input: SubmissionInput
  ): Promise<{ success: boolean; id: string; message: string }> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao registrar participação no servidor.');
    }

    return {
      success: true,
      id: data.id,
      message: data.message || 'Sua voz foi registrada com sucesso!',
    };
  },

  async updateSubmissionStatus(
    id: string,
    newStatus: SubmissionStatus,
    token?: string
  ): Promise<Submission> {
    const res = await fetch(`/api/admin/submissions/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao atualizar status.');
    }

    return data.submission;
  },

  async getDashboardStats(token?: string): Promise<DashboardStats> {
    const res = await fetch('/api/admin/stats', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao carregar estatísticas do servidor.');
    }

    const data: DashboardStats = await res.json();
    return data;
  },

  async exportCsv(type: 'valid' | 'all', token?: string): Promise<Blob> {
    const res = await fetch(`/api/admin/export/csv?type=${type}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!res.ok) {
      throw new Error('Erro ao baixar CSV do servidor.');
    }

    return res.blob();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Credenciais inválidas.');
    }

    return {
      success: true,
      token: data.token,
      username: data.username,
    };
  },
};
