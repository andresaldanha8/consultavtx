import React, { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  ListFilter,
  BarChart2,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  Loader2,
  Database,
  ArrowUpDown,
  Filter,
  Menu,
  X,
  Calendar,
  Users,
  Home,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { DashboardStats, Submission, SubmissionStatus } from '../types';
import { responsesService } from '../services/responsesService';
import { Logo } from './Logo';
import { getPriorityColor } from './PriorityIcon';

interface Props {
  token: string;
  onLogout: () => void;
}

type TabKey = 'overview' | 'submissions' | 'charts' | 'comments' | 'export' | 'settings';

export const AdminDashboard: React.FC<Props> = ({ token, onLogout }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Filters for submissions table
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Timestamp of last update
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
      ' ' + new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  });

  interface FeedbackState {
    text: string;
    type: 'success' | 'info' | 'error';
  }

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const showFeedback = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ text, type });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const [, startTransition] = useTransition();

  const fetchStats = async () => {
    try {
      const data = await responsesService.getDashboardStats(token);
      setStats(data);
      setLastUpdated(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
        ' ' + new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      );
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('401')) {
        onLogout();
        return;
      }
      setError('Não foi possível atualizar as estatísticas.');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const list = await responsesService.getSubmissions(token, {
        status: statusFilter,
        search: searchTerm,
      });
      setSubmissions(list);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('401')) {
        onLogout();
        return;
      }
      setError('Não foi possível carregar as respostas.');
    }
  };

  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    await Promise.all([fetchStats(), fetchSubmissions()]);
    setLoading(false);
    if (isManualRefresh) setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Synchronize dashboard across tab changes and demo updates
  useEffect(() => {
    const handleDataUpdated = () => {
      loadAllData();
    };

    window.addEventListener('vdx_data_updated', handleDataUpdated);
    window.addEventListener('storage', handleDataUpdated);
    return () => {
      window.removeEventListener('vdx_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleDataUpdated);
    };
  }, [token]);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchTerm]);

  // Handle status toggle (VALID <-> INVALID)
  const handleToggleStatus = async (sub: Submission) => {
    const newStatus: SubmissionStatus = sub.status === 'VALID' ? 'INVALID' : 'VALID';
    setUpdatingId(sub.id);

    try {
      const updated = await responsesService.updateSubmissionStatus(sub.id, newStatus, token);

      // Optimistically update list
      startTransition(() => {
        setSubmissions((prev) =>
          prev.map((item) => (item.id === sub.id ? updated : item))
        );
      });

      // Immediately refresh stats to keep graphs and metrics perfectly in sync
      await fetchStats();

      if (newStatus === 'INVALID') {
        showFeedback('Resposta invalidada', 'info');
      } else {
        showFeedback('✓ Resposta validada', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // CSV Export
  const handleExportCsv = async (type: 'valid' | 'all') => {
    try {
      const blob = await responsesService.exportCsv(type, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `100_vozes_vitoria_xingu_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showFeedback('✓ Arquivo CSV gerado', 'success');
    } catch (err: any) {
      showFeedback('Não foi possível exportar os dados', 'error');
    }
  };

  // Manual refresh with standardized feedback
  const handleManualRefresh = async () => {
    try {
      await loadAllData(true);
      showFeedback('✓ Dados atualizados', 'success');
    } catch {
      setError('Não foi possível atualizar as estatísticas.');
    }
  };

  // Calculated metrics
  const totalReceived = stats?.participacoesRecebidas ?? 0;
  const validTotal = stats?.respostasValidas ?? 0;
  const residentsVdx = stats?.moradoresVitoriaXingu ?? 0;
  const residentsPercent = validTotal > 0 ? ((residentsVdx / validTotal) * 100).toFixed(1).replace('.', ',') : '0,0';

  const otherMunicipalities = Math.max(0, validTotal - residentsVdx);
  const otherPercent = validTotal > 0 ? ((otherMunicipalities / validTotal) * 100).toFixed(1).replace('.', ',') : '0,0';

  // Age group mapping for vertical bar chart
  const ageBuckets = [
    { label: '16–24', key: '16 a 24 anos', color: '#a7f3d0', textCol: '#065f46' },
    { label: '25–34', key: '25 a 34 anos', color: '#86efac', textCol: '#166534' },
    { label: '35–44', key: '35 a 44 anos', color: '#fde047', textCol: '#854d0e' },
    { label: '45–59', key: '45 a 59 anos', color: '#93c5fd', textCol: '#1e40af' },
    { label: '60+', key: '60 anos ou mais', color: '#cbd5e1', textCol: '#334155' },
    { label: 'Não informou', key: 'Não informada', color: '#e2e8f0', textCol: '#475569' },
  ];

  const getAgePercent = (key: string) => {
    if (!stats || !stats.faixaEtaria) return 0;
    const item = stats.faixaEtaria.find((f) => f.name === key || (key === 'Não informada' && (f.name === 'Não informada' || f.name === 'Prefiro não informar')));
    return item ? item.percent : 0;
  };

  // Donut chart angles calculation for Localidade
  const locColors = ['#10b981', '#0284c7', '#f59e0b', '#84cc16', '#8b5cf6'];
  const locData = stats?.distribuicaoLocalidade || [];

  if (loading && !stats) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center flex-1">
        <Loader2 className="w-8 h-8 animate-spin text-[#00a86b] mb-3" />
        <p className="text-sm font-semibold text-slate-600">Carregando painel administrativo...</p>
      </main>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-[#f4f7fb] text-slate-900">
      {/* =========================================================
          SIDEBAR ESCURA (AZUL-MARINHO) CONFORME REFERÊNCIA
      ========================================================= */}
      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0e1b2f] text-slate-300 flex flex-col justify-between z-50 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header with 100 Vozes Logo */}
        <div className="p-5 border-b border-[#1c2f4e]">
          <div className="flex items-center justify-between">
            <div className="w-full flex justify-center py-1">
              <Logo size="sm" theme="dark" showSubtitle={true} />
            </div>
            <button
              type="button"
              className="lg:hidden text-slate-400 hover:text-white p-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#1c3254] text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#142540] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#00a86b]" />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('submissions');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'submissions'
                ? 'bg-[#1c3254] text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#142540] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ListFilter className="w-4 h-4 text-[#0080ff]" />
              <span>Respostas</span>
            </div>
            <span className="text-[10px] bg-[#142540] text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {submissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('charts');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'charts'
                ? 'bg-[#1c3254] text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#142540] hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-[#f59e0b]" />
            <span>Gráficos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('comments');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'comments'
                ? 'bg-[#1c3254] text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#142540] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Comentários</span>
            </div>
            <span className="text-[10px] bg-[#142540] text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {stats?.recentComments.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'export'
                ? 'bg-[#1c3254] text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#142540] hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Exportar Dados</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#1c3254] text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#142540] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configurações</span>
          </button>
        </nav>

        {/* Sidebar Footer with Sair */}
        <div className="p-3 border-t border-[#1c2f4e]">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-[#142540] hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          ÁREA PRINCIPAL DE CONTEÚDO (HEADER + CONTEÚDO)
      ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#111e32]">
                  {activeTab === 'overview' && 'Visão Geral'}
                  {activeTab === 'submissions' && 'Respostas da Consulta'}
                  {activeTab === 'charts' && 'Gráficos Analíticos'}
                  {activeTab === 'comments' && 'Comentários da Comunidade'}
                  {activeTab === 'export' && 'Exportação de Dados'}
                  {activeTab === 'settings' && 'Configurações'}
                </h1>
                {responsesService.isDemoMode() ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/90 px-2.5 py-0.5 rounded-md" title="Ambiente de demonstração com dados ilustrativos pré-carregados">
                    <span className="w-2 h-2 rounded-full bg-[#00a86b]" />
                    Modo demonstração <span className="text-slate-400 font-normal">| Dados ilustrativos</span>
                  </span>
                ) : stats?.storageMode === 'mysql' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <Database className="w-3 h-3" /> MySQL Ativo
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md">
                    <Database className="w-3 h-3" /> Local Resiliente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Acompanhamento em tempo real das participações
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              Última atualização: <strong className="text-slate-600">{lastUpdated}</strong>
            </span>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          )}

          {/* =========================================================
              ABA: VISÃO GERAL (EXATAMENTE CONFORME REFERÊNCIA)
          ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* ==========================================
                  CARDS SUPERIORES (4 CARDS HORIZONTAIS)
              =========================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Participações totais (Card Verde-claro) */}
                <div className="bg-[#e8f8f0] border border-[#bbf0d7] p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-white/80 border border-[#bbf0d7] flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-[#00a86b]" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#059669]">
                      {totalReceived}
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      Participações totais
                    </div>
                  </div>
                </div>

                {/* 2. Moradores de VTX (Card Azul-claro) */}
                <div className="bg-[#e8f1fd] border border-[#b9d5fd] p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-white/80 border border-[#b9d5fd] flex items-center justify-center shrink-0">
                    <Home className="w-6 h-6 text-[#1e60d5]" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1e60d5]">
                      {residentsVdx}
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      Moradores de VTX ({residentsPercent}%)
                    </div>
                  </div>
                </div>

                {/* 3. Outros municípios (Card Amarelo-claro) */}
                <div className="bg-[#fef8e7] border border-[#fde68a] p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-white/80 border border-[#fde68a] flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-[#d99b00]" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#d97706]">
                      {otherMunicipalities}
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      Outros municípios ({otherPercent}%)
                    </div>
                  </div>
                </div>

                {/* 4. Meta / prazo (Card Lilás-claro) */}
                <div className="bg-[#f3edfd] border border-[#ddd0fb] p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-white/80 border border-[#ddd0fb] flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-[#7c4dff]" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#7c4dff]">
                      {stats?.meta.current ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      Meta 100 Vozes ({stats?.meta.percent || 0}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  PRIMEIRA LINHA DE GRÁFICOS (3 COLUNAS)
              =========================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Prioridade nº 1 (Barras Horizontais Coloridas) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#111e32]">
                      Prioridade nº 1
                    </h3>
                  </div>

                  {stats?.prioridade1 && stats.prioridade1.length > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      {stats.prioridade1.slice(0, 10).map((item) => {
                        const barColor = getPriorityColor(item.name);
                        return (
                          <div key={item.name} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between font-medium">
                              <span className="truncate pr-2 text-slate-700">{item.name}</span>
                              <span className="font-bold text-slate-900 font-mono shrink-0">
                                {item.percent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(4, item.percent)}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Nenhuma resposta válida registrada ainda.
                    </div>
                  )}
                </div>

                {/* 2. Áreas mais priorizadas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#111e32]">
                      Áreas mais priorizadas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Considerando a 1ª e a 2ª escolha
                    </p>
                  </div>

                  {stats?.prioridadesCombinadas && stats.prioridadesCombinadas.length > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      {stats.prioridadesCombinadas.slice(0, 10).map((item) => {
                        const barColor = getPriorityColor(item.name);
                        return (
                          <div key={item.name} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between font-medium">
                              <span className="truncate pr-2 text-slate-700">{item.name}</span>
                              <span className="font-bold text-slate-900 font-mono shrink-0">
                                {item.percent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(4, item.percent)}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Nenhuma resposta válida registrada ainda.
                    </div>
                  )}
                </div>

                {/* 3. Localidade dos participantes (Rosca com centro e legenda lateral) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#111e32]">
                      Localidade dos participantes
                    </h3>
                  </div>

                  {locData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
                      {/* Donut Chart SVG */}
                      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          {/* Donut slices using strokeDasharray */}
                          {(() => {
                            let cumulativePercent = 0;
                            return locData.map((item, idx) => {
                              const pct = item.percent || 1;
                              const strokeDasharray = `${pct} ${100 - pct}`;
                              const strokeDashoffset = -cumulativePercent;
                              cumulativePercent += pct;
                              const col = locColors[idx % locColors.length];

                              return (
                                <circle
                                  key={item.name}
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke={col}
                                  strokeWidth="5"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-500"
                                />
                              );
                            });
                          })()}
                        </svg>

                        {/* Center Circle Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xl font-black text-[#111e32]">
                            {validTotal}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                            participações
                          </span>
                        </div>
                      </div>

                      {/* Right Legend */}
                      <div className="space-y-2 text-xs flex-1 w-full">
                        {locData.map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: locColors[idx % locColors.length] }}
                              />
                              <span className="text-slate-700 truncate text-[11px] font-medium">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 font-mono text-xs">
                              {item.percent}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Nenhuma localidade válida registrada.
                    </div>
                  )}
                </div>
              </div>

              {/* ==========================================
                  SEGUNDA LINHA (3 COLUNAS)
              =========================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Faixa etária (opcional) - Barras Verticais */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#111e32]">
                      Faixa etária (opcional)
                    </h3>
                  </div>

                  <div className="pt-3">
                    <div className="h-32 flex items-end justify-between gap-2 px-2 pb-2 border-b border-slate-200">
                      {ageBuckets.map((b) => {
                        const pct = getAgePercent(b.key);
                        const heightPct = Math.max(8, Math.min(100, pct * 2)); // normalized for visual display

                        return (
                          <div key={b.label} className="flex-1 flex flex-col items-center gap-1 group">
                            <span className="text-[10px] font-bold text-slate-600 font-mono opacity-80 group-hover:opacity-100">
                              {pct}%
                            </span>
                            <div
                              className="w-full max-w-[28px] rounded-t-lg transition-all duration-500 shadow-2xs"
                              style={{
                                height: `${heightPct}%`,
                                backgroundColor: b.color,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-1 px-1 pt-2">
                      {ageBuckets.map((b) => (
                        <span
                          key={b.label}
                          className="flex-1 text-center text-[10px] text-slate-500 font-semibold truncate"
                          title={b.label}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Comentários recentes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#111e32]">
                      Comentários recentes
                    </h3>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {stats?.recentComments && stats.recentComments.length > 0 ? (
                      stats.recentComments.slice(0, 5).map((c) => {
                        const formattedDate = new Date(c.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        }) + ' ' + new Date(c.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={c.id}
                            className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-700 italic truncate" title={c.comentario}>
                              “{c.comentario}”
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                              {formattedDate}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Nenhum comentário registrado ainda.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab('comments')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0080ff] hover:text-blue-700 transition-colors"
                    >
                      <span>Ver todos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Ações rápidas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#111e32]">
                      Ações rápidas
                    </h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleExportCsv('valid')}
                      className="w-full bg-[#00a86b] hover:bg-[#00925d] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar para CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('submissions')}
                      className="w-full bg-[#1e60d5] hover:bg-[#1850b5] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <ListFilter className="w-4 h-4" />
                      <span>Ver todas as respostas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Configurações</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA: RESPOSTAS (TABELA DE AUDITORIA)
          ========================================================= */}
          {activeTab === 'submissions' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
              {/* Controls / Filter row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por comentário, prioridade ou localidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Todas ({submissions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('VALID')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        statusFilter === 'VALID' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Válidas
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('INVALID')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        statusFilter === 'INVALID' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Invalidadas
                    </button>
                  </div>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Data/Hora</th>
                      <th className="py-3 px-3">Mora em VDX</th>
                      <th className="py-3 px-3">Localidade</th>
                      <th className="py-3 px-3">Prioridade 1</th>
                      <th className="py-3 px-3">Prioridade 2</th>
                      <th className="py-3 px-3">Comentário</th>
                      <th className="py-3 px-3">Faixa Etária</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Nenhuma resposta encontrada para o filtro atual.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => {
                        const isUpdating = updatingId === sub.id;
                        const dateFormatted = new Date(sub.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr
                            key={sub.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              sub.status === 'INVALID' ? 'bg-slate-50/40 text-slate-400' : ''
                            }`}
                          >
                            <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <span>{dateFormatted}</span>
                                {sub.isDemo ? (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 font-sans font-semibold px-1 py-0.5 rounded border border-slate-200" title="Registro ilustrativo de demonstração">
                                    DEMO
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-sans font-bold px-1 py-0.5 rounded border border-emerald-200" title="Submissão enviada nesta sessão de teste">
                                    AO VIVO
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              {sub.moraNoMunicipio ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                                  Sim
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200">
                                  Não
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{sub.localidade}</div>
                              {sub.localidadeInformada && (
                                <div className="text-[11px] text-teal-800 italic">
                                  “{sub.localidadeInformada}”
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 font-medium text-slate-800">
                              <div>{sub.prioridade1}</div>
                              {sub.prioridade1Outra && (
                                <div className="text-[11px] text-slate-500 italic">
                                  Det: {sub.prioridade1Outra}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 font-medium text-slate-700">
                              <div>{sub.prioridade2}</div>
                              {sub.prioridade2Outra && (
                                <div className="text-[11px] text-slate-500 italic">
                                  Det: {sub.prioridade2Outra}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 max-w-xs">
                              {sub.comentario ? (
                                <span className="line-clamp-2 text-slate-700 italic" title={sub.comentario}>
                                  “{sub.comentario}”
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                              {sub.faixaEtaria || <span className="text-slate-300">—</span>}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {sub.status === 'VALID' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  VALID
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  INVALID
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleToggleStatus(sub)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                  sub.status === 'VALID'
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                                title={sub.status === 'VALID' ? 'Invalidar resposta' : 'Revalidar resposta'}
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3" />
                                )}
                                <span>{sub.status === 'VALID' ? 'Invalidar' : 'Revalidar'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA: GRÁFICOS ANALÍTICOS (DETALHADA)
          ========================================================= */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-[#111e32] text-base">
                    1. Prioridade Nº 1 (Distribuição Geral)
                  </h3>
                  <div className="space-y-3">
                    {stats?.prioridade1.map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{item.name}</span>
                          <span className="font-mono">{item.count} ({item.percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(4, item.percent)}%`,
                              backgroundColor: getPriorityColor(item.name),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gráfico 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-[#111e32] text-base">
                      2. Áreas mais priorizadas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Considerando a 1ª e a 2ª escolha
                    </p>
                  </div>
                  <div className="space-y-3">
                    {stats?.prioridadesCombinadas.map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{item.name}</span>
                          <span className="font-mono">{item.count} menções ({item.percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(4, item.percent)}%`,
                              backgroundColor: getPriorityColor(item.name),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA: COMENTÁRIOS DA COMUNIDADE
          ========================================================= */}
          {activeTab === 'comments' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#111e32]">
                  Comentários e Sugestões da Comunidade
                </h3>
                <p className="text-xs text-slate-500">
                  Todas as contribuições textuais espontâneas registradas pelos participantes.
                </p>
              </div>

              {stats?.recentComments && stats.recentComments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {stats.recentComments.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {item.prioridade1}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 italic leading-relaxed pt-1">
                        “{item.comentario}”
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Nenhum comentário registrado ainda.
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              ABA: EXPORTAÇÃO DE DADOS
          ========================================================= */}
          {activeTab === 'export' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-[#111e32]">
                  Exportar Base de Dados em CSV
                </h3>
                <p className="text-xs text-slate-500">
                  Baixe os registros para análise em planilhas Excel, Power BI ou softwares estatísticos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-[#e8f8f0]/40">
                  <div className="font-bold text-slate-800 text-sm">Respostas Válidas</div>
                  <p className="text-xs text-slate-600">
                    Contém apenas submissões auditadas com status VALID ({validTotal} registros).
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('valid')}
                    className="w-full bg-[#00a86b] hover:bg-[#00925d] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar CSV (Válidas)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50">
                  <div className="font-bold text-slate-800 text-sm">Todas as Respostas</div>
                  <p className="text-xs text-slate-600">
                    Contém a totalidade das respostas recebidas, incluindo invalidadas ({totalReceived} registros).
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('all')}
                    className="w-full bg-[#1e60d5] hover:bg-[#1850b5] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar CSV (Completo)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA: CONFIGURAÇÕES
          ========================================================= */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-[#111e32]">
                  Configurações do Sistema
                </h3>
                <p className="text-xs text-slate-500">
                  Parâmetros de operação e infraestrutura da consulta comunitária.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Modo de Persistência</span>
                  <span className="font-mono font-bold text-[#00a86b]">
                    {stats?.storageMode === 'mysql' ? 'MySQL Pool Ativo' : 'Armazenamento Local Seguro'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Meta Comunitária</span>
                  <span className="font-mono font-bold text-slate-900">
                    100 Participações
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Município Alvo</span>
                  <span className="font-semibold text-slate-900">
                    Vitória do Xingu — Pará
                  </span>
                </div>

                {responsesService.isDemoMode() && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">Modo Demonstração Presencial</div>
                        <div className="text-[11px] text-slate-500">
                          Camada de dados isolada no cliente via <code className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">demoRepository</code> com 24 respostas iniciais.
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={async () => {
                            try {
                              setIsActionLoading(true);
                              if (responsesService.clearLiveSubmissions) {
                                await responsesService.clearLiveSubmissions();
                                await loadAllData(true);
                                showFeedback('✓ Respostas de teste removidas', 'success');
                              }
                            } catch {
                              showFeedback('Não foi possível limpar as respostas', 'error');
                            } finally {
                              setIsActionLoading(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                        >
                          Limpar Respostas de Teste
                        </button>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={async () => {
                            try {
                              setIsActionLoading(true);
                              await responsesService.resetDemoData();
                              await loadAllData(true);
                              showFeedback('✓ 24 mocks originais restaurados', 'success');
                            } catch {
                              showFeedback('Não foi possível restaurar os mocks', 'error');
                            } finally {
                              setIsActionLoading(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#003366] bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-xs font-semibold text-white transition-colors shadow-2xs"
                        >
                          Restaurar 24 Mocks Originais
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 border-t border-slate-200/80 pt-2 leading-relaxed">
                      💡 <strong>Migração para Produção:</strong> Para conectar ao banco MySQL definitivo no VS Code, basta alterar <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">DATA_MODE = 'api'</code> em <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">src/services/config.ts</code>. Todos os componentes do frontend já utilizam a interface unificada de repositório sem dependência direta de mocks ou localStorage.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Bottom Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>100 Vozes da Cidade — Vitória do Xingu</span>
          <span className="italic">Mais ideias. Mais oportunidades. Uma cidade ainda melhor.</span>
        </footer>

        {/* Feedback discreto e padronizado para ações administrativas */}
        {feedback && (
          <div
            id="admin-action-feedback"
            role="status"
            aria-live="polite"
            className={`fixed bottom-5 right-5 z-40 max-w-sm px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 border pointer-events-none transition-all duration-200 animate-fade-in ${
              feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-900/10'
                : feedback.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-white shadow-slate-900/20'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-900/10'
            }`}
          >
            <span>{feedback.text}</span>
          </div>
        )}
      </main>
    </div>
  );
};
