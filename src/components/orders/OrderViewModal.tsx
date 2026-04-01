import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Hash, FileText, Euro, Package, Clock, Send } from 'lucide-react';

interface OrderViewModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderViewModal: React.FC<OrderViewModalProps> = ({ order, isOpen, onClose }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <Clock className="w-4 h-4" />
          Προσχέδιο
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <Send className="w-4 h-4" />
        Υποβλήθηκε
      </span>
    );
  };

  if (!isOpen) return null;

  const items = order.items || [];
  const totalValue = items.reduce((sum: number, item: any) => {
    return sum + (Number(item.price || 0) * Number(item.quantity || 0));
  }, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Λεπτομέρειες Παραγγελίας</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {getStatusBadge(order.status)}
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.created_at || order.date)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Πελάτης</p>
                    <p className="font-medium text-gray-800">{order.customer_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Κωδικός</p>
                    <p className="font-medium text-gray-800">{order.customer_code || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">ΑΦΜ</p>
                    <p className="font-medium text-gray-800">{order.customer_afm || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Euro className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Συνολική Αξία</p>
                    <p className="font-bold text-amber-600">{totalValue.toFixed(2)}€</p>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium mb-1">Σημειώσεις</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Προϊόντα ({items.length})
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Κωδικός</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Περιγραφή</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Τιμή</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Ποσότητα</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Σύνολο</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{item.code}</td>
                          <td className="px-4 py-3 text-gray-800">{item.description}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {Number(item.price || 0).toFixed(2)}€
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-gray-800">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-amber-600">
                            {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
