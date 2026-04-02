import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Download, Package } from 'lucide-react';
import { CartItem, Product } from '../../types';

interface CartProps {
  cart: CartItem[];
  totalNet: number;
  onUpdateCartQuantity: (product: Product, qty: number) => void;
  onCheckout: () => void;
  isOrderSubmitting: boolean;
  onViewProduct?: (product: Product) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const Cart: React.FC<CartProps> = ({
  cart,
  totalNet,
  onUpdateCartQuantity,
  onCheckout,
  isOrderSubmitting,
  onViewProduct,
  notes,
  onNotesChange,
}) => {
  return (
    <div className="w-full lg:col-span-3 flex flex-col min-h-0 h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-2 rounded-lg">
              <ShoppingCart className="text-slate-600" size={20} />
            </div>
            <h3 className="font-bold text-slate-800">ΚΑΛΑΘΙ</h3>
          </div>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            {cart.length} ΕΙΔΗ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto customer-scroll space-y-3 mb-4 pr-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="opacity-20" />
              </div>
              <p className="font-medium text-sm">Το καλάθι είναι άδειο</p>
              <p className="text-[10px] mt-1">Προσθέστε προϊόντα για παραγγελία</p>
            </div>
          ) : (
            cart.map((item) => {
              const imageUrl = item.imageUrl || item.ImageUrl || item.imageurl;
              return (
                <div key={item.code} className="group p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-gusto-green/30 hover:bg-white transition-all">
                  <div className="flex gap-3 mb-2">
                    {imageUrl ? (
                      <button
                        onClick={() => onViewProduct?.(item)}
                        className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1 hover:border-gusto-green/50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onViewProduct?.(item)}
                        className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center hover:border-gusto-green/50 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Package size={16} className="text-slate-300" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-800 uppercase leading-tight truncate">
                          {item.description}
                        </p>
                        <button
                          onClick={() => onUpdateCartQuantity(item, 0)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                      <button
                        onClick={() => onUpdateCartQuantity(item, Math.max(0, item.quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-gusto-green">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateCartQuantity(item, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ΣΥΝΟΛΟ</p>
                      <p className="text-xs font-black text-gusto-green">
                        {(item.price * item.quantity).toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 shrink-0 mt-auto">
          <div className="mb-4 px-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ΠΑΡΑΤΗΡΗΣΕΙΣ</p>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Σχόλια για την παραγγελία..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gusto-green/30 resize-none h-20"
            />
          </div>

          <div className="flex justify-between items-center mb-4 px-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ΚΑΘΑΡΗ ΑΞΙΑ</p>
              <p className="text-2xl font-black text-gusto-green leading-none">
                {totalNet.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || isOrderSubmitting}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-gusto-green/20 ${cart.length === 0 || isOrderSubmitting
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-gusto-green text-white hover:bg-gusto-green-light hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            {isOrderSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Download size={18} />
                ΑΠΟΘΗΚΕΥΣΗ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
