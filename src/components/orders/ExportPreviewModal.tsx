import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileSpreadsheet, FileText, Eye, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { CartItem, Customer } from '../../types';

interface ExportPreviewModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: Customer | null;
  cart: CartItem[];
  totalNet: number;
  notes: string;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  show,
  onClose,
  onConfirm,
  customer,
  cart,
  totalNet,
  notes,
}) => {
  if (!show) return null;

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-white/20"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gusto-green to-gusto-green/90 px-8 py-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Eye className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Προεπισκόπηση Παραγγελίας
                  </h2>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                    Έλεγχος πριν την αποθήκευση
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="text-white" size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Customer Info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gusto-green/10 rounded-lg flex items-center justify-center">
                    <FileText className="text-gusto-green" size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                    Στοιχεία Πελάτη
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Όνομα</p>
                    <p className="text-sm font-bold text-slate-800">{customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Κωδικός</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">{customer?.customer_code || customer?.code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ΑΦΜ</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">{customer?.afm}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Πόλη</p>
                    <p className="text-sm font-bold text-slate-800">{customer?.city}</p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gusto-gold/10 rounded-lg flex items-center justify-center">
                    <Package className="text-gusto-gold" size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                    Προϊόντα
                  </h3>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Κωδικός</div>
                    <div className="col-span-4">Περιγραφή</div>
                    <div className="col-span-1 text-center">Τεμ.</div>
                    <div className="col-span-2 text-right">Αξία</div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {cart.map((item, index) => (
                      <div key={item.code} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition-colors">
                        <div className="col-span-1 text-xs font-bold text-slate-400">{index + 1}</div>
                        <div className="col-span-4 text-xs font-mono font-bold text-slate-600 truncate">{item.code}</div>
                        <div className="col-span-4 text-xs font-bold text-slate-700 truncate">{item.description}</div>
                        <div className="col-span-1 text-center text-xs font-black text-gusto-green">{item.quantity}</div>
                        <div className="col-span-2 text-right text-xs font-black text-slate-800">
                          {(item.price * item.quantity).toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {notes && notes.trim() && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Παρατηρήσεις</p>
                      <p className="text-sm font-medium text-amber-900">{notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center gap-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-black text-sm border-2 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <X size={18} />
                ΑΚΥΡΩΣΗ
              </button>
              <button
                onClick={onConfirm}
                className="flex-[2] py-4 rounded-2xl font-black text-sm bg-gusto-green text-white hover:bg-gusto-green-light hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gusto-green/20 flex items-center justify-center gap-3"
              >
                ΑΠΟΘΗΚΕΥΣΗ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
