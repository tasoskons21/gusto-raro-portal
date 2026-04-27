import React, { useState } from 'react';
import { User as UserIcon, Settings, LogOut, ClipboardList, ShoppingCart, Package, Menu, X, ChevronDown, PanelLeft, PanelLeftClose } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';

interface HeaderProps {
  user: User;
  isLoading: boolean;
  onShowAdminModal: () => void;
  onLogout: () => void;
  activeView?: 'products' | 'order' | 'orders';
  onViewChange?: (view: 'products' | 'order' | 'orders') => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoading,
  onShowAdminModal,
  onLogout,
  activeView = 'order',
  onViewChange,
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getViewLabel = (view: string) => {
    switch(view) {
      case 'products': return { label: 'Προβολή Προϊόντων', icon: Package };
      case 'order': return { label: 'Νέα Παραγγελία', icon: ShoppingCart };
      case 'orders': return { label: 'Οι Παραγγελίες μου', icon: ClipboardList };
      default: return { label: '', icon: Package };
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <img
            src="https://gustoraro.gr/wp-content/uploads/2023/09/gustoraro.jpg"
            className="w-10 h-10 rounded-xl shadow-md border-2 border-gusto-green/10"
            alt="Logo"
            referrerPolicy="no-referrer"
          />
          <div className="hidden md:block">
            <h1 className="text-lg font-black text-gusto-green tracking-tight">GUSTO RARO</h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
              <UserIcon size={10} /> {user.email}
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {/* Hamburger Menu Button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30 ${
                menuOpen ? 'bg-gusto-green text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-gusto-green'
              }`}
              title="Μενού Πλοήγησης"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
              <span className="hidden sm:inline font-semibold text-sm">Μενού</span>
            </button>

            {/* Dropdown Menu Panel */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 origin-top-right"
                >
                  <div className="p-2">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Πλοήγηση</p>
                    {onViewChange && (
                      <div className="flex flex-col gap-1">
                        {(['products', 'order', 'orders'] as const).map((view) => {
                          const Icon = getViewLabel(view).icon;
                          return (
                            <button
                              key={view}
                              onClick={() => { onViewChange(view); setMenuOpen(false); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30 ${
                                activeView === view
                                  ? 'bg-gusto-green text-white font-semibold'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Icon size={20} />
                              <span className="flex-1">{getViewLabel(view).label}</span>
                              {activeView === view && (
                                <ChevronDown size={16} className="ml-auto -rotate-90 text-current opacity-70" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="h-px bg-slate-200 my-2 mx-2"></div>
                    <div className="flex flex-col gap-1">
                      {user.role === 'admin' && (
                        <button
                          onClick={() => { onShowAdminModal(); setMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 hover:bg-slate-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30"
                        >
                          <Settings size={20} />
                          <span>Ρυθμίσεις</span>
                        </button>
                      )}
                      <button
                        onClick={() => { onLogout(); setMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                      >
                        <LogOut size={20} />
                        <span>Έξοδος</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Loading indicator (hidden on mobile to save space) */}
          {isLoading && (
            <span className="hidden sm:inline-block text-xs bg-gusto-gold/30 text-gusto-green px-3 py-1.5 rounded-full animate-pulse font-bold">Φόρτωση...</span>
          )}

          {/* Desktop only: Sidebar toggle, Admin & Logout as icons when menu is closed */}
          <div className="hidden md:flex items-center gap-1">
          {activeView === 'order' && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2.5 text-slate-600 hover:bg-slate-100 hover:text-gusto-green rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30"
              title={sidebarCollapsed ? "Εμφάνιση Πλαϊνού Μενού" : "Απόκρυψη Πλαϊνού Μενού"}
            >
              {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
          )}
          {user.role === 'admin' && !menuOpen && (
            <button
              onClick={onShowAdminModal}
              className="p-2.5 text-slate-600 hover:bg-slate-100 hover:text-gusto-green rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30"
              title="Ρυθμίσεις Διαχειριστή"
            >
              <Settings size={20} />
            </button>
          )}
          {!menuOpen && (
            <button
              onClick={onLogout}
              className="p-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              title="Έξοδος"
            >
              <LogOut size={20} />
            </button>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};
