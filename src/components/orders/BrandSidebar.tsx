import React, { useState } from 'react';
import { Search, X, Building2, Database, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Brand, Customer, CartItem, Product } from '../../types';
import { SoftOneHistory } from './SoftOneHistory';
import { SoftOnePriceLog } from './SoftOnePriceLog';

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
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
  cart?: CartItem[];
  onUpdateCartQuantity?: (product: Product, qty: number) => void;
}

export const BrandSidebar = React.memo<BrandSidebarProps>(({
  selectedCustomer,
  onChangeCustomer,
  brandSearch,
  setBrandSearch,
  allBrands,
  selectedBrand,
  onSelectBrand,
  userRole,
  isLoading = false,
  isCollapsed = false,
  onToggleSidebar,
  cart = [],
  onUpdateCartQuantity = () => { }
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showPriceLog, setShowPriceLog] = useState(false);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);

  return (
    <>
      <AnimatePresence>
        {showCustomerPanel && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-50 border-r border-slate-200 flex flex-col"
          >
            <div className="bg-slate-800 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">ΠΕΛΑΤΗΣ</h3>
                  <p className="text-slate-300 text-xs">{selectedCustomer.name}</p>
                </div>
                <button
                  onClick={() => setShowCustomerPanel(false)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-[9px] text-slate-300 uppercase">ΑΦΜ</p>
                  <p className="font-bold text-xs">{selectedCustomer.afm}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-[9px] text-slate-300 uppercase">ΚΩΔ</p>
                  <p className="font-bold text-xs">{selectedCustomer.customer_code || selectedCustomer.code}</p>
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium">ΔΙΕΥΘΥΤΕΥΣΗ</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {selectedCustomer.address}, <span className="text-gusto-green">{selectedCustomer.city}</span>
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setShowHistory(true); setShowCustomerPanel(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gusto-green transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30"
                >
                  <Database size={16} />
                  ΟΛΟ ΤΟ ΙΣΤΟΡΙΚΟ
                </button>
                <button
                  onClick={() => { setShowPriceLog(true); setShowCustomerPanel(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gusto-green transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30"
                >
                  <Calculator size={16} />
                  ΚΩΔΙΚΟΛΟΓΙΟ
                </button>
              </div>

              {userRole !== 'customer' && (
                <button
                  onClick={onChangeCustomer}
                  className="w-full mt-4 px-4 py-2 text-red-500 font-bold text-sm uppercase hover:bg-red-50 rounded-lg transition-all border border-red-200"
                >
                  ΑΛΛΑΓΗ ΠΕΛΑΤΗ
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full lg:col-span-3 flex flex-col gap-4 min-h-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
          <button
            onClick={() => setShowCustomerPanel(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gusto-green/10 flex items-center justify-center">
                <Database size={16} className="text-gusto-green" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-xs uppercase">{selectedCustomer.customer_code || selectedCustomer.code}</p>
                <p className="text-slate-500 text-[9px] truncate max-w-[120px]">{selectedCustomer.name}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight text-sm">
                <Building2 size={16} className="text-gusto-green" />
                ΕΤΑΙΡΙΕΣ
              </h3>
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg animate-pulse">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 shrink-0"></div>
                    <div className="h-2 bg-slate-100 rounded-full flex-1"></div>
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
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gusto-green/30 ${selectedBrand === brand.name
                          ? 'bg-gusto-green text-white shadow-md font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-gusto-green'
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${selectedBrand === brand.name ? 'bg-white/20 border-white/20' : 'bg-white border-slate-100 shadow-sm'
                          }`}>
                          {logoUrl ? (
                            <img src={logoUrl} alt="" className="w-4 h-4 object-contain" />
                          ) : (
                            <Building2 size={10} className={selectedBrand === brand.name ? 'text-white' : 'text-slate-400'} />
                          )}
                        </div>
                        <span className="truncate flex-1 font-bold uppercase text-[10px] leading-tight">{brand.name}</span>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="bg-slate-800 p-4">
                <div className="flex items-center justify-between">
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
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
                <SoftOneHistory customerCode={selectedCustomer.customer_code || selectedCustomer.code} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPriceLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPriceLog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            >
              <div className="bg-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">Κωδικολόγιο</h3>
                    <p className="text-slate-300 text-sm">{selectedCustomer.name} ({selectedCustomer.customer_code || selectedCustomer.code})</p>
                  </div>
                  <button
                    onClick={() => setShowPriceLog(false)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
                <SoftOnePriceLog customerCode={selectedCustomer.customer_code || selectedCustomer.code} cart={cart} onUpdateCartQuantity={onUpdateCartQuantity} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
