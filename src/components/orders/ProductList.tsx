import React from 'react';
import { Search, Package, X, Eye } from 'lucide-react';
import { Product, CartItem } from '../../types';

interface ProductListProps {
  productSearch: string;
  setProductSearch: (term: string) => void;
  selectedBrand: string;
  filteredProducts: Product[];
  cart: CartItem[];
  onUpdateCartQuantity: (product: Product, qty: number) => void;
  onViewProduct: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  productSearch,
  setProductSearch,
  selectedBrand,
  filteredProducts,
  cart,
  onUpdateCartQuantity,
  onViewProduct,
}) => {
  return (
    <div className="w-full lg:col-span-6 flex flex-col min-h-0 h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-gusto-green rounded-full"></span>
            {selectedBrand}
          </h3>
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Αναζήτηση..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gusto-green/30 text-sm"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <button
                onClick={() => setProductSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="w-full overflow-y-auto customer-scroll flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-slate-100 w-1/2">ΠΕΡΙΓΡΑΦΗ</th>
                <th className="px-4 py-3 border-b border-slate-100 w-1/4 text-right">ΤΙΜΗ</th>
                <th className="px-4 py-3 border-b border-slate-100 w-1/4 text-center">ΠΟΣΟΤΗΤΑ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.code}
                  product={product}
                  currentQty={cart.find(item => item.code === product.code)?.quantity || 0}
                  onUpdateQty={onUpdateCartQuantity}
                  onViewProduct={onViewProduct}
                />
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="opacity-20" />
              </div>
              <p className="font-medium">Δεν βρέθηκαν προϊόντα</p>
              <p className="text-xs mt-1">Δοκιμάστε άλλη αναζήτηση ή εταιρία</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProductRowProps {
  product: Product;
  currentQty: number;
  onUpdateQty: (product: Product, qty: number) => void;
  onViewProduct: (product: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, currentQty, onUpdateQty, onViewProduct }) => {
  const imageUrl = product.imageUrl || product.ImageUrl || product.imageurl;

  return (
    <tr className={`group transition-colors ${currentQty > 0 ? 'bg-gusto-green/5' : 'hover:bg-slate-50/80'}`}>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <button
              onClick={() => onViewProduct(product)}
              className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1 hover:border-gusto-green/50 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <img src={imageUrl} alt="" className="w-full h-full object-contain" />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
              <Package size={20} className="text-slate-300" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 text-sm leading-tight uppercase group-hover:text-gusto-green transition-colors truncate">
                {product.description}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1">{product.code}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="font-black text-slate-800 text-sm">
          {product.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-center">
          <div className={`flex items-center bg-white border-2 rounded-xl overflow-hidden transition-all h-10 px-1 ${currentQty > 0 ? 'border-gusto-green shadow-sm' : 'border-slate-100 group-hover:border-slate-200'}`}>
            <button
              type="button"
              onClick={() => onUpdateQty(product, Math.max(0, currentQty - 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white rounded-md transition-all font-bold"
            >
              -
            </button>
            <input
              type="number"
              className="w-8 bg-transparent text-center text-xs font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={currentQty || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdateQty(product, isNaN(val) ? 0 : val);
              }}
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => onUpdateQty(product, currentQty + 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-gusto-green hover:bg-white rounded-md transition-all font-bold"
            >
              +
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};
