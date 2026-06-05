import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database, Calendar, Euro, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Package, Loader2
} from 'lucide-react';
import { fetchOrderHistoryFromSoftOne, fetchOrderDetailsFromSoftOne } from '../../services/softoneService';
import { SoftOneOrder } from '../../types';

interface SoftOneHistoryProps {
  customerCode?: string;
}

export const SoftOneHistory: React.FC<SoftOneHistoryProps> = ({ customerCode }) => {
  const [orders, setOrders] = useState<SoftOneOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(30);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  // Αυτόματη ανάκτηση όταν αλλάζει ο κωδικός ή το φίλτρο ημερών
  useEffect(() => {
    if (customerCode) {
      handleFetchHistory();
    }
  }, [customerCode, daysBack]);

  const handleFetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    setExpandedOrders(new Set());
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

  const toggleOrder = async (trdAAA: string) => {
    const isExpanded = expandedOrders.has(trdAAA);

    if (isExpanded) {
      const newExpanded = new Set(expandedOrders);
      newExpanded.delete(trdAAA);
      setExpandedOrders(newExpanded);
      return;
    }

    const order = orders.find(o => o.TRD_AAA === trdAAA);
    if (order && !order.items) {
      setLoadingDetails(prev => new Set(prev).add(trdAAA));
      try {
        const result = await fetchOrderDetailsFromSoftOne(trdAAA);
        if (result.success) {
          setOrders(prev => prev.map(o =>
            o.TRD_AAA === trdAAA ? { ...o, items: result.items } : o
          ));
        }
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoadingDetails(prev => {
          const next = new Set(prev);
          next.delete(trdAAA);
          return next;
        });
      }
    }

    const newExpanded = new Set(expandedOrders);
    newExpanded.add(trdAAA);
    setExpandedOrders(newExpanded);
  };

  const formatDate = (s1Date: string) => {
    if (!s1Date) return 'N/A';
    if (s1Date.includes('/')) return s1Date;
    if (s1Date.includes('-')) {
      const parts = s1Date.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    if (s1Date.length >= 8) {
      return `${s1Date.substring(6, 8)}/${s1Date.substring(4, 6)}/${s1Date.substring(0, 4)}`;
    }
    return s1Date;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Ιστορικό SoftOne</h3>
              <p className="text-xs text-slate-500">Πρόσφατα παραστατικά</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gusto-green outline-none"
            >
              <option value={30}>30 ημέρες</option>
              <option value={90}>3 μήνες</option>
              <option value={365}>1 έτος</option>
            </select>
            <button
              onClick={handleFetchHistory}
              disabled={isLoading || !customerCode}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-gusto-green disabled:opacity-50 transition-all uppercase tracking-widest text-[10px]"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Ανανέωση
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {orders.map((order) => (
          <div key={order.TRD_AAA} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleOrder(order.TRD_AAA)}
              className="w-full p-4 text-left hover:bg-slate-50 transition-all group"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-tighter">
                      {order.TRD_TYPE_DESC}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{order.TRD_CODE}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gusto-green" /> {formatDate(order.TRD_DATE)}</span>
                    <span className="flex items-center gap-1.5"><Euro className="w-3.5 h-3.5 text-gusto-green" /> {order.TOTAL_VALUE.toFixed(2)}€</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingDetails.has(order.TRD_AAA) ? (
                    <Loader2 size={18} className="animate-spin text-gusto-green" />
                  ) : (
                    expandedOrders.has(order.TRD_AAA) ?
                      <ChevronUp size={18} className="text-slate-400 group-hover:text-gusto-green transition-colors" /> :
                      <ChevronDown size={18} className="text-slate-400 group-hover:text-gusto-green transition-colors" />
                  )}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedOrders.has(order.TRD_AAA) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 bg-slate-50/30"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
                      <Package size={12} />
                      Περιεχόμενο Παραγγελίας
                    </div>

                    {order.items && order.items.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white shadow-inner">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4 w-16 text-center">IMG</th>
                              <th className="py-3 px-4 w-28">ΚΩΔΙΚΟΣ</th>
                              <th className="py-3 px-4">ΠΕΡΙΓΡΑΦΗ</th>
                              <th className="py-3 px-4 w-24 text-center">ΠΟΣΟΤΗΤΑ</th>
                              <th className="py-3 px-4 w-24 text-right">ΤΙΜΗ</th>
                              <th className="py-3 px-4 w-24 text-center">ΕΚΠΤΩΣΗ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-[12px]">
                            {order.items.map((item: any, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">

                                {/* 1. IMG */}
                                <td className="py-2.5 px-4">
                                  <div className="w-10 h-10 rounded-md border border-slate-150 overflow-hidden bg-white flex items-center justify-center mx-auto shadow-sm flex-shrink-0">
                                    {item.IMAGE_URL ? (
                                      <img
                                        src={item.IMAGE_URL}
                                        alt={item.DESCRIPTION}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full bg-slate-50 flex items-center justify-center"><svg class="w-3.5 h-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/></svg></div>`;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                        <Package className="w-3.5 h-3.5 text-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 2. ΚΩΔΙΚΟΣ */}
                                <td className="py-2.5 px-4 font-semibold text-slate-500 tracking-tighter">
                                  {item.CODE}
                                </td>

                                {/* 3. ΠΕΡΙΓΡΑΦΗ */}
                                <td className="py-2.5 px-4 font-bold text-slate-800 max-w-xs md:max-w-md truncate">
                                  {item.DESCRIPTION}
                                </td>

                                {/* 4. ΠΟΣΟΤΗΤΑ */}
                                <td className="py-2.5 px-4 text-center font-black text-slate-900">
                                  {item.QUANTITY} <span className="text-[10px] font-medium text-slate-400">τμχ</span>
                                </td>

                                {/* 5. ΤΙΜΗ */}
                                <td className="py-2.5 px-4 text-right font-bold text-slate-700 font-mono">
                                  {item.PRICE.toFixed(2)}€
                                </td>

                                {/* 6. ΕΚΠΤΩΣΗ */}
                                <td className="py-2.5 px-4 text-center font-bold text-slate-700">
                                  {item.DISCOUNT_PERCENT > 0 ? (
                                    `${item.DISCOUNT_PERCENT}%`
                                  ) : (
                                    <span className="text-slate-300 font-medium">-</span>
                                  )}
                                </td>

                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      !loadingDetails.has(order.TRD_AAA) && (
                        <div className="py-4 text-center text-slate-400 text-xs italic">
                          Δεν βρέθηκαν προϊόντα για αυτή την παραγγελία.
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {!isLoading && orders.length === 0 && !error && (
        <div className="text-center py-10 text-slate-400 text-sm italic">
          Δεν βρέθηκαν παραγγελίες για το επιλεγμένο διάστημα.
        </div>
      )}
    </div>
  );
};