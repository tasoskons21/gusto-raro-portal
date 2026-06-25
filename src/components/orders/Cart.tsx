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

export const Cart = React.memo<CartProps>(({
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
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-gusto-slate-200 p-3 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0 border-b border-gusto-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-gusto-green-50 p-1.5 rounded-lg">
              <ShoppingCart className="text-gusto-green" size={16} />
            </div>
            <h3 className="font-bold text-gusto-slate-800 text-xs uppercase tracking-tight">ΚΑΛΑΘΙ</h3>
          </div>
          <span className="bg-gusto-slate-100 text-gusto-slate-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">
            {cart.length} ΕΙΔΗ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto customer-scroll space-y-2 mb-3 pr-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gusto-slate-400">
              <div className="w-12 h-12 bg-gusto-slate-50 rounded-full flex items-center justify-center mb-3">
                <ShoppingCart size={24} className="text-gusto-slate-300" />
              </div>
              <p className="font-semibold text-xs text-gusto-slate-500">Το καλάθι είναι άδειο</p>
              <p className="text-[9px] mt-1 text-gusto-slate-400">Προσθέστε προϊόντα</p>
            </div>
          ) : (
            cart.map((item) => {
              const imageUrl = item.imageUrl || item.ImageUrl || item.imageurl;
              return (
                <div key={item.code} className="group p-2 bg-gusto-slate-50 rounded-xl border border-gusto-slate-100 hover:border-gusto-green/30 hover:bg-white transition-all">
                  <div className="flex gap-2 mb-1.5">
                    {imageUrl ? (
                      <button
                        onClick={() => onViewProduct?.(item)}
                        className="w-8 h-8 rounded-lg bg-white border border-gusto-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 hover:border-gusto-green/50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onViewProduct?.(item)}
                        className="w-8 h-8 rounded-lg bg-white border border-gusto-slate-100 flex-shrink-0 flex items-center justify-center hover:border-gusto-green/50 hover:bg-gusto-slate-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Package size={12} className="text-gusto-slate-300" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-gusto-slate-800 uppercase leading-tight truncate">
                          {item.description}
                        </p>
                        <button
                          onClick={() => onUpdateCartQuantity(item, 0)}
                          className="text-gusto-slate-300 hover:text-red-500 transition-colors p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[9px] text-gusto-slate-400 font-mono mt-0.5">{item.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white border-2 border-gusto-slate-200 rounded-xl p-0.5 shadow-sm min-w-[40px]">
                      <button
                        onClick={() => onUpdateCartQuantity(item, Math.max(0, item.quantity - 1))}
                        className="w-7 h-7 flex items-center justify-center text-gusto-slate-500 hover:bg-gusto-green/5 hover:text-gusto-green rounded-lg transition-colors min-h-[28px]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-gusto-green">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateCartQuantity(item, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gusto-slate-500 hover:bg-gusto-green/5 hover:text-gusto-green rounded-lg transition-colors min-h-[28px]"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gusto-slate-400 font-bold uppercase tracking-widest">ΣΥΝΟΛΟ</p>
                      <p className="text-[10px] font-black text-gusto-green">
                        {(item.price * item.quantity).toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-gusto-slate-200 shrink-0 mt-auto bg-white lg:sticky lg:bottom-0 lg:z-10">
          <div className="mb-3 px-1">
            <p className="text-[9px] font-black text-gusto-slate-400 uppercase tracking-widest mb-1">ΠΑΡΑΤΗΡΗΣΕΙΣ</p>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Σχόλια..."
              className="w-full p-2 bg-gusto-slate-50 border border-gusto-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gusto-green/30 resize-none h-16 transition-all"
            />
          </div>

          <div className="flex justify-between items-center mb-3 px-1">
            <div>
              <p className="text-[9px] font-black text-gusto-slate-400 uppercase tracking-widest mb-0.5">ΚΑΘΑΡΗ ΑΞΙΑ</p>
              <p className="text-lg font-black text-gusto-green leading-none">
                {totalNet.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || isOrderSubmitting}
            className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
              cart.length === 0 || isOrderSubmitting
                ? 'bg-gusto-slate-100 text-gusto-slate-400 cursor-not-allowed'
                : 'bg-gusto-green text-white shadow-[0_1px_2px_rgba(30,57,50,0.24)] hover:bg-gusto-green-light hover:shadow-[0_4px_12px_rgba(30,57,50,0.28)] hover:scale-[1.01] active:scale-[0.98]'
              }`}
          >
            {isOrderSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Αποθήκευση...</span>
              </div>
            ) : (
              <>
                <Download size={14} />
                ΑΠΟΘΗΚΕΥΣΗ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
