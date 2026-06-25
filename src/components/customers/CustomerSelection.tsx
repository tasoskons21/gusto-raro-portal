import React from 'react';
import { Search, X } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerSelectionProps {
  customers: Customer[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  filteredCustomers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerSelection = React.memo<CustomerSelectionProps>(({
  customers,
  searchTerm,
  setSearchTerm,
  isLoading,
  filteredCustomers,
  onSelectCustomer,
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-2 sm:mt-4 px-2">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <div className="bg-slate-800 p-3 sm:p-4 text-white text-center">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight">Αναζήτηση Πελάτη</h2>
          <div className="flex flex-col gap-1 mt-0.5">
            <p className="text-slate-300 text-[10px] sm:text-xs">Επιλέξτε πελάτη για να ξεκινήσετε την παραγγελία</p>
            {customers.length > 0 && (
              <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 mt-0.5">
                Συνολο Πελατων: {customers.length}
              </p>
            )}
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Όνομα, ΑΦΜ, Κωδικός ή Πόλη..."
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-100 rounded-lg focus:border-gusto-green focus:ring-0 transition-all text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-2 sm:mt-3 max-h-[45vh] sm:max-h-[calc(100vh-350px)] overflow-y-auto customer-scroll space-y-1.5">
           {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg skeleton shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="skeleton skeleton-title"></div>
                        <div className="flex gap-2">
                          <div className="skeleton h-2 w-16"></div>
                          <div className="skeleton h-2 w-12"></div>
                        </div>
                      </div>
                      <div className="skeleton w-4 h-4 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 bg-gusto-error-bg rounded-xl border border-red-100">
                <p className="text-gusto-error font-bold text-sm">⚠️ Δεν βρέθηκαν δεδομένα πελατών.</p>
                <p className="text-[10px] text-red-400 mt-1">Ελέγξτε το αρχείο δεδομένων.</p>
              </div>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust)}
                  className="w-full text-left p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-gusto-green/30 transition-all flex items-center justify-between group shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex-1 min-w-0 pr-3 text-left">
                    <h3 className="font-bold text-slate-800 uppercase truncate group-hover:text-gusto-green transition-colors text-sm">{cust.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-[9px] bg-gusto-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-gusto-slate-100">Κωδ: {cust.code}</span>
                      <span className="text-[9px] bg-gusto-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-gusto-slate-100">ΑΦΜ: {cust.afm}</span>
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-wide">{cust.city}</span>
                    </div>
                  </div>
                  <svg className="text-slate-300 group-hover:text-gusto-green transition-transform group-hover:translate-x-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))
            ) : searchTerm.length > 0 ? (
              <div className="text-center py-8 bg-gusto-slate-50/50 rounded-xl border border-gusto-slate-200">
                <p className="text-slate-500 text-sm">Δεν βρέθηκαν πελάτες για "{searchTerm}"</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});
