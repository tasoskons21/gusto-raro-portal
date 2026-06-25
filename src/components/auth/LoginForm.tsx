import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Lock, Eye, EyeOff, LogOut } from 'lucide-react';

interface LoginFormProps {
  loginForm: { email: string; password: string };
  setLoginForm: (form: { email: string; password: string }) => void;
  handleLogin: (e: React.FormEvent) => void;
  loginError: string | null;
  authLoading: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loginForm,
  setLoginForm,
  handleLogin,
  loginError,
  authLoading,
  showPassword,
  setShowPassword,
}) => {
  return (
    <div className="order-page-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.06)] w-full max-w-md border-4 border-gusto-gold/20"
      >
        <div className="text-center mb-8">
          <img
            src="https://gustoraro.gr/wp-content/uploads/2023/09/gustoraro.jpg"
            className="w-24 mx-auto mb-4 rounded-2xl shadow-lg border-2 border-slate-50"
            alt="Gusto Raro Logo"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-black text-gusto-green tracking-tight">B2B PORTAL</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-gusto-gold focus:ring-0 transition-all outline-none font-bold text-slate-700"
                placeholder="π.χ. user@example.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-gusto-gold focus:ring-0 transition-all outline-none font-bold text-slate-700"
                placeholder="••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gusto-gold transition-colors"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {loginError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100"
            >
              {loginError}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-gusto-green text-white font-black py-5 rounded-2xl shadow-[0_1px_2px_rgba(30,57,50,0.24)] hover:bg-gusto-green-light hover:shadow-[0_4px_12px_rgba(30,57,50,0.28)] hover:scale-[1.01] active:scale-[0.98] transition-all text-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {authLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Σύνδεση...</span>
              </div>
            ) : (
              <>
                <svg className="rotate-180" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                ΕΙΣΟΔΟΣ
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 mt-8 font-medium uppercase tracking-tighter">
          © 2026 GUSTO RARO
        </p>
      </motion.div>
    </div>
  );
};
