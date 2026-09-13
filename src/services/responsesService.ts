import { DATA_MODE } from './config';
import { demoRepository } from './demoRepository';
import { apiRepository } from './apiRepository';
import {
  Submission,
  SubmissionInput,
  SubmissionStatus,
  DashboardStats,
  AuthResponse,
  IResponsesService,
} from '../types';

/**
 * Camada de Abstração de Dados / Repositório do Sistema
 * 100 Vozes da Cidade — Vitória do Xingu
 *
 * Esta classe é o único ponto de acesso que os componentes visuais
 * (SurveyWizard, AdminDashboard, AdminLogin) utilizam para interagir
 * com as respostas e estatísticas.
 *
 * Em MODO DEMO:
 *   UI -> responsesService -> demoRepository (localStorage resiliente com 24 mocks)
 *
 * Em MODO API (Produção futura no VS Code com MySQL):
 *   UI -> responsesService -> apiRepository -> REST API Express -> MySQL
 */
class ResponsesService implements IResponsesService {
  private getRepository() {
    return DATA_MODE === 'demo' ? demoRepository : apiRepository;
  }

  isDemoMode(): boolean {
    return this.getRepository().isDemoMode();
  }

  async submitResponse(
    input: SubmissionInput
  ): Promise<{ success: boolean; id: string; message: string }> {
    return this.getRepository().submitResponse(input);
  }

  async getDashboardStats(token?: string): Promise<DashboardStats> {
    return this.getRepository().getDashboardStats(token);
  }

  async getSubmissions(
    token?: string,
    filter?: { status?: string; search?: string }
  ): Promise<Submission[]> {
    return this.getRepository().getSubmissions(token, filter);
  }

  async updateSubmissionStatus(
    id: string,
    newStatus: SubmissionStatus,
    token?: string
  ): Promise<Submission> {
    return this.getRepository().updateSubmissionStatus(id, newStatus, token);
  }

  async exportCsv(type: 'valid' | 'all', token?: string): Promise<Blob> {
    return this.getRepository().exportCsv(type, token);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return this.getRepository().login(username, password);
  }

  async resetDemoData(): Promise<void> {
    if (DATA_MODE === 'demo' && demoRepository.resetDemoData) {
      await demoRepository.resetDemoData();
    }
  }

  async clearLiveSubmissions(): Promise<void> {
    if (DATA_MODE === 'demo' && demoRepository.clearLiveSubmissions) {
      await demoRepository.clearLiveSubmissions();
    }
  }
}

export const responsesService = new ResponsesService();
