import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '../../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  currentQty?: number;
  onUpdateQty?: (product: Product, qty: number) => void;
  isViewOnly?: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  currentQty = 0,
  onUpdateQty,
  isViewOnly = false,
}) => {
  if (!product) return null;

  const imageUrl = product.imageUrl || product.ImageUrl || product.imageurl;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-white/20"
      >
        <div className="relative h-64 bg-slate-50 flex items-center justify-center p-8">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.description}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <Building2 size={64} className="mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-30">No Image Available</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black bg-gusto-green/10 text-gusto-green px-2 py-0.5 rounded-full uppercase tracking-widest">
              {product.brand}
            </span>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono">
              {product.code}
            </span>
          </div>
          <h2 className="text-lg font-black text-gusto-green leading-tight mb-4 uppercase">
            {product.description}
          </h2>

          {!isViewOnly && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ΤΙΜΗ ΜΟΝΑΔΟΣ</p>
                <p className="text-2xl font-black text-red-600">
                  {product.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ΠΟΣΟΤΗΤΑ</p>
                <div className={`flex items-center bg-slate-50 border-2 rounded-2xl overflow-hidden transition-all h-12 px-2 ${currentQty > 0 ? 'border-gusto-green shadow-sm bg-white' : 'border-slate-100'}`}>
                  <button
                    onClick={() => onUpdateQty && onUpdateQty(product, Math.max(0, currentQty - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white rounded-xl transition-all font-bold"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    className="w-12 bg-transparent text-center text-sm font-black outline-none border-none p-0"
                    value={currentQty || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdateQty && onUpdateQty(product, isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                  />
                  <button
                    onClick={() => onUpdateQty && onUpdateQty(product, currentQty + 1)}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-gusto-green hover:bg-white rounded-xl transition-all font-bold"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-8 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
          >
            <X size={18} />
            ΚΛΕΙΣΙΜΟ
          </button>
        </div>
      </motion.div>
    </div>
  );
};
