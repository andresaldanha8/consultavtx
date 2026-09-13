export type PriorityKey =
  | 'Saúde'
  | 'Emprego e geração de renda'
  | 'Infraestrutura e mobilidade'
  | 'Zona rural e produção'
  | 'Educação e qualificação'
  | 'Educação e qualificação profissional'
  | 'Esporte e lazer'
  | 'Cultura e turismo'
  | 'Juventude e oportunidades'
  | 'Segurança'
  | 'Outra';

export const PRIORITY_OPTIONS: readonly PriorityKey[] = [
  'Saúde',
  'Emprego e geração de renda',
  'Infraestrutura e mobilidade',
  'Zona rural e produção',
  'Educação e qualificação',
  'Esporte e lazer',
  'Cultura e turismo',
  'Juventude e oportunidades',
  'Segurança',
  'Outra',
] as const;

export type LocationKey =
  | 'Sede de Vitória do Xingu'
  | 'Belo Monte'
  | 'Agrovila Leonardo da Vinci'
  | 'Zona rural / comunidade'
  | 'Outro local do município'
  | 'Não mora no município';

export const LOCATION_OPTIONS: readonly LocationKey[] = [
  'Sede de Vitória do Xingu',
  'Belo Monte',
  'Agrovila Leonardo da Vinci',
  'Zona rural / comunidade',
  'Outro local do município',
] as const;

export type AgeRangeKey =
  | '16 a 24 anos'
  | '25 a 34 anos'
  | '35 a 44 anos'
  | '45 a 59 anos'
  | '60 anos ou mais'
  | 'Prefiro não informar';

export const AGE_RANGE_OPTIONS: readonly AgeRangeKey[] = [
  '16 a 24 anos',
  '25 a 34 anos',
  '35 a 44 anos',
  '45 a 59 anos',
  '60 anos ou mais',
  'Prefiro não informar',
] as const;

export type SubmissionStatus = 'VALID' | 'INVALID';

export interface Submission {
  id: string;
  moraNoMunicipio: boolean;
  localidade: string;
  localidadeInformada?: string | null;
  prioridade1: string;
  prioridade1Outra?: string | null;
  prioridade2: string;
  prioridade2Outra?: string | null;
  comentario?: string | null;
  faixaEtaria?: string | null;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean; // Flag to indicate mock/demo entry vs live submission
}

export interface SubmissionInput {
  moraNoMunicipio: boolean;
  localidade: string;
  localidadeInformada?: string;
  prioridade1: string;
  prioridade1Outra?: string;
  prioridade2: string;
  prioridade2Outra?: string;
  comentario?: string;
  faixaEtaria?: string;
  website_hp?: string; // Honeypot field
}

export interface StatItem {
  name: string;
  count: number;
  percent: number;
}

export interface DashboardStats {
  participacoesRecebidas: number;
  respostasValidas: number;
  respostasInvalidadas: number;
  moradoresVitoriaXingu: number;
  meta: {
    metaAlcancada: boolean;
    current: number;
    target: number;
    percent: number;
    text: string;
  };
  prioridade1: StatItem[];
  prioridadesCombinadas: StatItem[];
  distribuicaoLocalidade: StatItem[];
  faixaEtaria: StatItem[];
  recentComments: Array<{
    id: string;
    prioridade1: string;
    comentario: string;
    createdAt: string;
  }>;
  storageMode: 'mysql' | 'local_fallback' | 'demo_local';
  isDemoMode?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  username: string;
}

export interface IResponsesService {
  submitResponse(input: SubmissionInput): Promise<{ success: boolean; id: string; message: string }>;
  getDashboardStats(token?: string): Promise<DashboardStats>;
  getSubmissions(token?: string, filter?: { status?: string; search?: string }): Promise<Submission[]>;
  updateSubmissionStatus(id: string, newStatus: SubmissionStatus, token?: string): Promise<Submission>;
  exportCsv(type: 'valid' | 'all', token?: string): Promise<Blob>;
  login(username: string, password: string): Promise<AuthResponse>;
  isDemoMode(): boolean;
  resetDemoData?(): Promise<void>;
  clearLiveSubmissions?(): Promise<void>;
}
