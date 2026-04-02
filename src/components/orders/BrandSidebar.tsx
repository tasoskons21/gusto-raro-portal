import React, { useState } from 'react';
import { Search, X, Building2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Brand, Customer } from '../../types';
import { SoftOneHistory } from './SoftOneHistory';

interface BrandSidebarProps {
  selectedCustomer: Customer;
  onChangeCustomer: () => void;
  brandSearch: string;
  setBrandSearch: (term: string) => void;
  allBrands: Brand[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  userRole: string;
  isLoading?: boolean;
}

export const BrandSidebar: React.FC<BrandSidebarProps> = ({
  selectedCustomer,
  onChangeCustomer,
  brandSearch,
  setBrandSearch,
  allBrands,
  selectedBrand,
  onSelectBrand,
  userRole,
  isLoading = false,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
    <div className="w-full lg:col-span-3 flex flex-col gap-4 min-h-0">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">ΠΕΛΑΤΗΣ</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              title="Ιστορικό SoftOne"
            >
              <Database size={14} />
            </button>
            {userRole !== 'customer' && (
              <button
                onClick={onChangeCustomer}
                className="text-[10px] text-red-500 font-black hover:underline uppercase tracking-widest"
              >
                ΑΛΛΑΓΗ
              </button>
            )}
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="font-black text-slate-900 text-sm uppercase leading-tight">{selectedCustomer.name}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <p className="text-[10px] text-slate-500 font-medium">ΑΦΜ: <span className="font-bold">{selectedCustomer.afm}</span></p>
            <p className="text-[10px] text-slate-500 font-medium">ΚΩΔ: <span className="font-bold">{selectedCustomer.customer_code || selectedCustomer.code}</span></p>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {selectedCustomer.address}, <span className="font-black text-amber-600 uppercase tracking-wide">{selectedCustomer.city}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm">
            <Building2 size={16} className="text-gusto-green" />
            ΕΤΑΙΡΙΕΣ
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Αναζήτηση εταιρίας..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gusto-green/30 focus:border-gusto-green/30"
            />
            {brandSearch && (
              <button
                onClick={() => setBrandSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto customer-scroll flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
            {isLoading ? (
              // Brand Skeletons
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0"></div>
                  <div className="h-3 bg-slate-100 rounded-full flex-1"></div>
                </div>
              ))
            ) : (
              allBrands
                .filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                .map(brand => {
                  const logoUrl = brand.logo_url || brand.imageUrl;
                  return (
                    <button
                      key={brand.name}
                      onClick={() => onSelectBrand(brand.name)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 ${selectedBrand === brand.name
                        ? 'bg-gusto-green text-white shadow-md font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-gusto-green'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${selectedBrand === brand.name ? 'bg-white/20 border-white/20' : 'bg-white border-slate-100 shadow-sm'
                        }`}>
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <Building2 size={14} className={selectedBrand === brand.name ? 'text-white' : 'text-slate-400'} />
                        )}
                      </div>
                      <span className="truncate flex-1 font-bold uppercase text-[11px] leading-tight">{brand.name}</span>
                    </button>
                  );
                })
            )}
          </div>

          {!isLoading && allBrands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
              <Building2 size={24} className="mb-2 opacity-20" />
              <p className="text-[10px] italic">Δεν βρέθηκαν εταιρίες</p>
            </div>
          )}
        </div>
      </div>
    </div>

    <AnimatePresence>
      {showHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <div className="bg-slate-800 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Ιστορικό SoftOne</h3>
                <p className="text-slate-300 text-sm">{selectedCustomer.name} ({selectedCustomer.customer_code || selectedCustomer.code})</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
              <SoftOneHistory customerCode={selectedCustomer.customer_code || selectedCustomer.code} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
