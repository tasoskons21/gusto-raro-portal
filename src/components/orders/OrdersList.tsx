import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Trash2, 
  FileEdit, 
  Send, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Euro, 
  FileText,
  Package,
  Clock,
  Eye,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OrderRecord, User, Customer } from '../../types';

interface OrdersListProps {
  orders: any[];
  user: User;
  customers: Customer[];
  isLoading: boolean;
  onView: (order: any) => void;
  onLoadDraft: (order: any) => void;
  onDelete: (orderId: string) => void;
  onRefresh: () => void;
  onSendOrder: (order: any) => void;
  onSendToSoft1: (order: any) => void;
  isLoadingSoftOne?: boolean;
}

export const OrdersList = React.memo<OrdersListProps>(({
  orders,
  user,
  customers,
  isLoading,
  onView,
  onLoadDraft,
  onDelete,
  onRefresh,
  onSendOrder,
  onSendToSoft1,
  isLoadingSoftOne = false
}) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const isExpanded = (orderId: string) => expandedOrders.has(orderId);
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Προσχέδιο
        </span>
      );
    }

    if (status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          Σταλθηκε
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Αποθηκεύτηκε
      </span>
    );
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton w-16 h-5 rounded-md"></div>
              <div className="skeleton w-24 h-4 rounded"></div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <div className="skeleton w-4 h-4 rounded-full"></div>
                <div className="skeleton skeleton-title w-1/3"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="skeleton w-4 h-4 rounded-full"></div>
                <div className="skeleton skeleton-text w-1/2"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="skeleton w-4 h-4 rounded-full"></div>
                <div className="skeleton skeleton-text w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-20 h-20 rounded-full bg-gusto-slate-100 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gusto-slate-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-slate-600 font-semibold text-base">Δεν υπάρχουν παραγγελίες</h3>
          <p className="text-slate-400 text-sm mt-1">Οι παραγγελίες σας θα εμφανίζονται εδώ</p>
        </div>
      </div>
    );
  }

  const isSoftOneSent = (order: any) => order.status === 'sent';

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          Αποθηκευμένες Παραγγελίες
          <span className="text-xs sm:text-sm font-normal text-gray-300">({orders.length})</span>
        </h2>
        <button
          onClick={onRefresh}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Ανανέωση
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <button
              onClick={() => toggleOrder(order.id)}
              className="w-full p-3 sm:p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    {getStatusBadge(order.status)}
                    <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {formatDate(order.created_at || order.date)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Πελάτης</p>
                        <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                          {order.customer_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Κωδικός</p>
                        <p className="font-medium text-gray-800 text-xs sm:text-sm">
                          {order.customer_code || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                 <div className="flex-shrink-0 text-gray-400">
                   {isExpanded(order.id) ? (
                     <ChevronUp size={16} />
                   ) : (
                     <ChevronDown size={16} />
                   )}
                 </div>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded(order.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 sm:px-5 pb-3 sm:pb-5 border-t border-gray-100 pt-3 sm:pt-4">
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500">ΑΦΜ</p>
                          <p className="font-medium text-gray-800 text-xs sm:text-sm">
                            {order.customer_afm || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500">Συνολική Αξία</p>
                          <p className="font-bold text-amber-600 text-xs sm:text-sm">
                            {Number(order.total_value || 0).toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-3 text-xs sm:text-sm">
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-gray-600 text-xs sm:text-sm">
                        {Array.isArray(order.items) ? order.items.length : 0} προϊόντα
                      </span>
                      {order.notes && (
                        <span className="text-gray-400">•</span>
                      )}
                      {order.notes && (
                        <span className="text-gray-500 truncate max-w-[200px] sm:max-w-xs text-xs">
                          Σημειώσεις: {order.notes}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-gray-100 mt-3 sm:mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); onView(order); }}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors min-h-[32px] sm:min-h-[36px]"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">Προβολή</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSendOrder(order); }}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors min-h-[32px] sm:min-h-[36px]"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">Αποθήκευση</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSendToSoft1(order); }}
                        disabled={isLoadingSoftOne || isSoftOneSent(order)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors min-h-[32px] sm:min-h-[36px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
                      >
                        {isLoadingSoftOne ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="truncate">Φόρτωση...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate">{isSoftOneSent(order) ? 'Σταλθηκε' : 'Soft1'}</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onLoadDraft(order); }}
                        disabled={isSoftOneSent(order)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors min-h-[32px] sm:min-h-[36px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                      >
                        <FileEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">Επεξεργασία</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[32px] sm:min-h-[36px]"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">Διαγραφή</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
