import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Calendar, 
  User, 
  Hash, 
  Euro, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { SoftOneOrder, fetchOrderHistoryFromSoftOne } from '../../services/softoneService';

interface SoftOneHistoryProps {
  customerCode?: string;
}

export const SoftOneHistory: React.FC<SoftOneHistoryProps> = ({ customerCode }) => {
  const [orders, setOrders] = useState<SoftOneOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [daysBack, setDaysBack] = useState(30);

  const toggleOrder = (aaa: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(aaa)) {
        next.delete(aaa);
      } else {
        next.add(aaa);
      }
      return next;
    });
  };

  const isExpanded = (aaa: string) => expandedOrders.has(aaa);

  const handleFetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchOrderHistoryFromSoftOne(customerCode, daysBack);
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Άγνωστο σφάλμα κατά την ανάκτηση');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Ιστορικό SoftOne</h3>
              <p className="text-xs text-gray-500">Παραγγελίες από το SoftOne ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={7}>Τελευταίες 7 ημέρες</option>
              <option value={30}>Τελευταίες 30 ημέρες</option>
              <option value={90}>Τελευταίοι 3 μήνες</option>
              <option value={180}>Τελευταίοι 6 μήνες</option>
              <option value={365}>Τελευταίος 1 χρόνος</option>
            </select>
            <button
              onClick={handleFetchHistory}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Φόρτωση...' : 'Ανάκτηση'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Σφάλμα</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Βρέθηκαν <span className="font-bold text-purple-600">{orders.length}</span> παραγγελίες
            </p>
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="grid gap-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.TRD_AAA + order.TRD_DATE}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <button
                onClick={() => toggleOrder(order.TRD_AAA)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <FileText className="w-3 h-3" />
                        {order.TRD_TYPE_DESC || 'Παραγγελία'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.TRD_DATE)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ΑΑΑ: {order.TRD_AAA}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Πελάτης</p>
                          <p className="font-medium text-gray-800">
                            {order.TRD_NAME || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Κωδικός</p>
                          <p className="font-medium text-gray-800">
                            {order.TRD_CODE || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-gray-400">
                    {isExpanded(order.TRD_AAA) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded(order.TRD_AAA) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">ΑΦΜ</p>
                            <p className="font-medium text-gray-800">
                              {order.TRD_AFM || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Συνολική Αξία</p>
                            <p className="font-bold text-purple-600">
                              {order.TOTAL_VALUE.toFixed(2)}€
                            </p>
                          </div>
                        </div>

                        {order.ITEMS_COUNT !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {order.ITEMS_COUNT} προϊόντα
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Database className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-gray-700 font-semibold text-lg">Δεν υπάρχουν παραγγελίες</h3>
            <p className="text-gray-500 text-sm mt-1">
              Πάτησε "Ανάκτηση" για να φέρεις το ιστορικό από το SoftOne
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
