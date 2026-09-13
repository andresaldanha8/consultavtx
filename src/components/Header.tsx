import React from 'react';
import { Shield } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  isAdminView?: boolean;
  onNavigateHome?: () => void;
  onNavigateAdmin?: () => void;
  onLogout?: () => void;
  adminUser?: string | null;
}

export const Header: React.FC<Props> = ({
  isAdminView,
  onNavigateHome,
  onNavigateAdmin,
  onLogout,
  adminUser,
}) => {
  // If user is already on the Admin Dashboard view, the AdminDashboard component has its own dedicated sidebar and top bar.
  if (isAdminView) {
    return null;
  }

  return (
    <header className="border-b border-slate-100 bg-white sticky top-0 z-30 shadow-2xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center text-left focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] rounded-lg p-0.5 transition-opacity hover:opacity-90"
          title="Ir para o início"
        >
          <Logo size="sm" showSubtitle={false} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateAdmin}
            className="text-xs font-semibold text-slate-500 hover:text-[#00a86b] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Acesso da Equipe"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Painel</span>
          </button>
        </div>
      </div>
    </header>
  );
};
