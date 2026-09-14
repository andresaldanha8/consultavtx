import React, { useState } from 'react';
import { User, KeyRound, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { responsesService } from '../services/responsesService';

interface Props {
  onLoginSuccess: (token: string, username: string) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = await responsesService.login(username.trim(), password.trim());
      onLoginSuccess(auth.token, auth.username);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique os dados inseridos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md mx-auto px-4 py-12 flex flex-col justify-center flex-1">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="md" showSubtitle={true} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#111e32]">
              Painel Administrativo
            </h1>
            <p className="text-xs text-slate-500">
              Acesso restrito para coordenação e auditoria
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                placeholder="Nome de usuário"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] focus:border-[#00a86b]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Senha
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] focus:border-[#00a86b]"
                required
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[#00a86b] hover:bg-[#00925d] disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Entrar no Painel</span>
              </>
            )}
          </button>
        </form>

        {/* Credenciais de demonstração removidas da interface para não expor usuário/senha */}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a Consulta Pública</span>
          </button>
        </div>
      </div>
    </main>
  );
};
