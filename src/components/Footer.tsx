import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

interface Props {
  isAdminView?: boolean;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<Props> = ({ isAdminView, onNavigateAdmin }) => {
  if (isAdminView) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-100 bg-white py-6 px-4 text-slate-500 text-xs">
      <div className="max-w-2xl mx-auto space-y-3 text-center">
        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left">
          <ShieldCheck className="w-4 h-4 text-[#00a86b] shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong>100 Vozes da Cidade — Vitória do Xingu</strong> é uma iniciativa comunitária digital para levantamento de prioridades populares. Não é pesquisa eleitoral nem coleta dados pessoais identificáveis (como nome, CPF ou telefone).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
          <div>
            100 Vozes da Cidade &copy; {new Date().getFullYear()} — Vitória do Xingu/PA
          </div>
          {onNavigateAdmin && (
            <button
              onClick={onNavigateAdmin}
              className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors py-0.5"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Acesso da Equipe</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
