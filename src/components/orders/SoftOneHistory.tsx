import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Προσοχή στο import αν χρησιμοποιείς framer-motion
import { 
  Database, Calendar, User, Hash, Euro, FileText, 
  ChevronDown, ChevronUp, RefreshCw, AlertTriangle 
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

  // Αυτόματη ανάκτηση όταν αλλάζει ο κωδικός ή το φίλτρο ημερών
  useEffect(() => {
    if (customerCode) {
      handleFetchHistory();
    }
  }, [customerCode, daysBack]);

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
      setError('Αποτυχία σύνδεσης με το SoftOne');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOrder = (aaa: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(aaa) ? next.delete(aaa) : next.add(aaa);
      return next;
    });
  };

  const formatDate = (s1Date: string) => {
    if (!s1Date || s1Date.length < 8) return s1Date;
    // Μετατροπή YYYYMMDD σε DD/MM/YYYY
    return `${s1Date.substring(6, 8)}/${s1Date.substring(4, 6)}/${s1Date.substring(0, 4)}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Ιστορικό SoftOne</h3>
              <p className="text-xs text-gray-500">Πρόσφατα παραστατικά</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value={30}>30 ημέρες</option>
              <option value={90}>3 μήνες</option>
              <option value={365}>1 έτος</option>
            </select>
            <button
              onClick={handleFetchHistory}
              disabled={isLoading || !customerCode}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Ανανέωση
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {orders.map((order) => (
          <div key={order.TRD_AAA} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleOrder(order.TRD_AAA)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                      {order.TRD_TYPE_DESC}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{order.TRD_CODE}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDate(order.TRD_DATE)}</span>
                    <span className="flex items-center gap-1"><Euro className="w-3 h-3"/> {order.TOTAL_VALUE.toFixed(2)}€</span>
                  </div>
                </div>
                {expandedOrders.has(order.TRD_AAA) ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </div>
            </button>
            
            <AnimatePresence>
              {expandedOrders.has(order.TRD_AAA) && (
                <motion.div 
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="px-4 pb-4 border-t border-gray-50 bg-gray-50/50"
                >
                  <div className="pt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">ΑΦΜ Πελάτη</p>
                      <p className="font-medium">{order.TRD_AFM}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Επωνυμία</p>
                      <p className="font-medium">{order.TRD_NAME}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {!isLoading && orders.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400 text-sm italic">
          Δεν βρέθηκαν παραγγελίες για το επιλεγμένο διάστημα.
        </div>
      )}
    </div>
  );
};