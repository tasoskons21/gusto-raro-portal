import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, AlertTriangle, X, Building2 } from 'lucide-react';

interface Branch {
  id: number;
  name: string;
}

interface SoftOneConfirmModalProps {
  show: boolean;
  order: any;
  branches?: Branch[];
  selectedBranchId: number | null;
  onBranchChange: (branchId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export const SoftOneConfirmModal: React.FC<SoftOneConfirmModalProps> = ({
  show,
  order,
  branches = [],
  selectedBranchId,
  onBranchChange,
  onConfirm,
  onCancel,
  isSending
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8 text-center">
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <Send className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Αποστολή στο SoftOne
              </h3>
              <p className="text-purple-100 text-sm">
                Η παραγγελία θα καταχωρηθεί στο SoftOne
              </p>
            </div>

            <div className="px-6 py-5">
              {branches.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Υποκαταστήμα
                  </label>
                  <select
                    value={selectedBranchId ?? 0}
                    onChange={(e) => onBranchChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-1">Προσοχή</p>
                    <p className="text-xs text-amber-700">
                      Η παραγγελία θα σταλεί στο SoftOne και θα παραμείνει αποθηκευμένη για ιστορικό.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Πελάτης</span>
                  <span className="text-sm font-medium text-gray-800">{order?.customer_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Κωδικός</span>
                  <span className="text-sm font-medium text-gray-800">{order?.customer_code || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">ΑΦΜ</span>
                  <span className="text-sm font-medium text-gray-800">{order?.customer_afm || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Προϊόντα</span>
                  <span className="text-sm font-medium text-gray-800">{Array.isArray(order?.items) ? order.items.length : 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Σύνολο</span>
                  <span className="text-lg font-bold text-purple-600">{Number(order?.total_value || 0).toFixed(2)}€</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isSending}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isSending}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Αποστολή...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Αποστολή
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
