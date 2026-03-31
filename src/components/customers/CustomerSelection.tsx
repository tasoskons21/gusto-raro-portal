import React from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerSelectionProps {
  customers: Customer[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  filteredCustomers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  customers,
  searchTerm,
  setSearchTerm,
  isLoading,
  filteredCustomers,
  onSelectCustomer,
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-2 sm:px-0">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-800 p-4 sm:p-6 text-white text-center">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">Αναζήτηση Πελάτη</h2>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-slate-300 text-xs sm:text-sm">Επιλέξτε πελάτη για να ξεκινήσετε την παραγγελία</p>
            {customers.length > 0 && (
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mt-1">
                Συνολο Πελατων στη Βαση: {customers.length}
              </p>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Όνομα, ΑΦΜ, Κωδικός ή Πόλη..."
              className="w-full pl-12 pr-12 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-gusto-green focus:ring-0 transition-all text-base sm:text-lg shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="mt-3 sm:mt-4 max-h-[50vh] sm:max-h-[calc(100vh-400px)] overflow-y-auto customer-scroll space-y-2">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-gusto-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Φόρτωση πελατών...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-600 font-bold">⚠️ Δεν βρέθηκαν δεδομένα πελατών.</p>
                <p className="text-xs text-red-500 mt-1">Ελέγξτε αν το αρχείο public/data/customers.json είναι σωστό.</p>
              </div>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust)}
                  className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-gusto-green/30 transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-slate-800 uppercase truncate group-hover:text-gusto-green transition-colors">{cust.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-100">Κωδ: {cust.code}</span>
                      <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-100">ΑΦΜ: {cust.afm}</span>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide">{cust.city}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-gusto-green transition-transform group-hover:translate-x-1" size={20} />
                </button>
              ))
            ) : searchTerm.length > 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-slate-100">
                <p className="text-slate-500">Δεν βρέθηκαν πελάτες που να ταιριάζουν με την αναζήτηση "{searchTerm}"</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
