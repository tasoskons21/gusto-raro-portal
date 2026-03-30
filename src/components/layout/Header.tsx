import React from 'react';
import { User as UserIcon, Settings, LogOut } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  user: User;
  isLoading: boolean;
  onShowAdminModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoading,
  onShowAdminModal,
  onLogout,
}) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://gustoraro.gr/wp-content/uploads/2023/09/gustoraro.jpg"
            className="w-10 h-10 rounded shadow-sm"
            alt="Logo"
            referrerPolicy="no-referrer"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gusto-green leading-tight">GUSTO RARO</h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-widest">
              <UserIcon size={10} className="text-black" /> {user.email} ({user.role})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <span className="text-xs bg-gusto-gold/20 text-gusto-green px-2 py-1 rounded animate-pulse font-medium">Φόρτωση...</span>}

          {user.role === 'admin' && (
            <button
              onClick={onShowAdminModal}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Ρυθμίσεις Διαχειριστή"
            >
              <Settings size={20} />
            </button>
          )}

          <button
            onClick={onLogout}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Έξοδος"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
