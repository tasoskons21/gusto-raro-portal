import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertCircle, Calendar, Loader2, Package, Plus, Minus } from 'lucide-react';
import { fetchProductPriceHistoryFromSoftOne } from '../../services/softoneService';
import { ProductPriceHistory, Product, CartItem } from '../../types';

interface SoftOnePriceLogProps {
  customerCode?: string;
  cart: CartItem[];
  onUpdateCartQuantity: (product: Product, qty: number) => void;
}

export const SoftOnePriceLog: React.FC<SoftOnePriceLogProps> = ({ customerCode, cart, onUpdateCartQuantity }) => {
  const [priceHistory, setPriceHistory] = useState<ProductPriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(90);

  useEffect(() => {
    if (customerCode) {
      handleFetchPriceLog();
    }
  }, [customerCode, daysBack]);

  const handleFetchPriceLog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProductPriceHistoryFromSoftOne(customerCode, daysBack);
      if (result.success) {
        setPriceHistory(result.priceHistory);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError('Αποτυχία σύνδεσης με το SoftOne');
    } finally {
      setIsLoading(false);
    }
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

  const cartItemsByCode = new Map(cart.map(item => [item.code, item.quantity]));

  const handleQuantityChange = (code: string, qty: number) => {
    const item = priceHistory.find(p => p.CODE === code);
    if (item && qty > 0) {
      const product: Product = {
        code: item.CODE,
        description: item.DESCRIPTION,
        price: item.PRICE,
        brand: '',
        imageUrl: item.IMAGE_URL
      };
      onUpdateCartQuantity(product, qty);
    } else if (qty <= 0) {
      const product: Product = {
        code: code,
        description: priceHistory.find(p => p.CODE === code)?.DESCRIPTION || '',
        price: priceHistory.find(p => p.CODE === code)?.PRICE || 0,
        brand: '',
        imageUrl: priceHistory.find(p => p.CODE === code)?.IMAGE_URL
      };
      onUpdateCartQuantity(product, 0);
    }
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
              <h3 className="font-bold text-slate-800">Κωδικολόγιο</h3>
              <p className="text-xs text-slate-500">Ιστορικό τιμών προϊόντων</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gusto-green outline-none"
            >
              <option value={90}>3 μήνες</option>
              <option value={180}>6 μήνες</option>
              <option value={365}>1 έτος</option>
            </select>
            <button
              onClick={handleFetchPriceLog}
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && priceHistory.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-gusto-green" />
              <p className="text-slate-500 text-sm">Φόρτωση κωδικολογίου...</p>
            </div>
          </div>
        ) : priceHistory.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">IMG</th>
                  <th className="py-3 px-4 w-28">ΚΩΔΙΚΟΣ</th>
                  <th className="py-3 px-4">ΠΕΡΙΓΡΑΦΗ</th>
                  <th className="py-3 px-4 w-24 text-right">ΤΙΜΗ</th>
                  <th className="py-3 px-4 w-24 text-center">ΕΚΠΤΩΣΗ</th>
                  <th className="py-3 px-4 w-28">ΗΜΕΡΟΜΗΝΙΑ</th>
                  <th className="py-3 px-4 w-32 text-center">ΚΑΛΑΘΙ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[12px]">
                {priceHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
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
                    <td className="py-2.5 px-4 font-semibold text-slate-500 tracking-tighter">
                      {item.CODE}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 max-w-xs md:max-w-md truncate">
                      {item.DESCRIPTION}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-700 font-mono">
                      {item.PRICE.toFixed(2)}€
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-700">
                      {item.DISCOUNT_PERCENT > 0 ? (
                        `${item.DISCOUNT_PERCENT}%`
                      ) : (
                        <span className="text-slate-300 font-medium">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gusto-green" />
                        {formatDate(item.TRD_DATE)}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex justify-center">
                        {(() => {
                          const cartQty = cartItemsByCode.get(item.CODE) || 0;
                          return (
                            <div className={`flex items-center bg-white border-2 rounded-xl overflow-hidden transition-all min-w-[40px] ${cartQty > 0 ? 'border-gusto-green shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.CODE, Math.max(0, cartQty - 1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-md transition-all font-bold min-h-[28px]"
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                className="w-7 bg-transparent text-center text-xs font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={cartQty || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  handleQuantityChange(item.CODE, isNaN(val) ? 0 : val);
                                }}
                                placeholder="0"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.CODE, cartQty + 1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-gusto-green hover:bg-slate-50 rounded-md transition-all font-bold min-h-[28px]"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && !error && (
            <div className="py-10 text-center text-slate-400 text-sm italic">
              Δεν βρέθηκαν κωδικοί για το επιλεγμένο διάστημα.
            </div>
          )
        )}
      </div>
    </div>
  );
};