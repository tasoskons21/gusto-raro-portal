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
  isLoading?: boolean;
}

export const ProductList = React.memo<ProductListProps>(({
  productSearch,
  setProductSearch,
  selectedBrand,
  filteredProducts,
  cart,
  onUpdateCartQuantity,
  onViewProduct,
  isLoading = false,
}) => {
  return (
     <div className="w-full lg:col-span-6 flex flex-col min-h-0 h-full">
       <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-gusto-slate-200 p-4 flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-gusto-green rounded-full"></span>
            {selectedBrand || 'Επιλέξτε Εταιρία'}
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

        <div className="w-full overflow-y-auto customer-scroll flex-1 -mx-1 px-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gusto-slate-50 text-[9px] font-black text-gusto-slate-400 uppercase tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 border-b border-gusto-slate-100 w-1/2 text-xs">ΠΕΡΙΓΡΑΦΗ</th>
                <th className="px-2 py-2 border-b border-gusto-slate-100 w-1/4 text-right text-xs">ΤΙΜΗ</th>
                <th className="px-2 py-2 border-b border-gusto-slate-100 w-1/4 text-center text-xs">ΠΟΣΟΤΗΤΑ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                // Product Skeletons
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0"></div>
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 bg-slate-100 rounded-full w-3/4"></div>
                          <div className="h-2 bg-slate-50 rounded-full w-1/2"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="h-2.5 bg-slate-100 rounded-full w-10 ml-auto"></div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="h-8 bg-slate-50 rounded-xl w-20 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredProducts.map((product) => (
                  <ProductRow
                    key={product.code}
                    product={product}
                    currentQty={cart.find(item => item.code === product.code)?.quantity || 0}
                    onUpdateQty={onUpdateCartQuantity}
                    onViewProduct={onViewProduct}
                  />
                ))
              )}
            </tbody>
          </table>

          {!isLoading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-gusto-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gusto-slate-300">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="font-semibold text-sm text-slate-500">Δεν βρέθηκαν προϊόντα</p>
              <p className="text-xs mt-1 text-slate-400">Δοκιμάστε άλλη αναζήτηση ή εταιρία</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

interface ProductRowProps {
  product: Product;
  currentQty: number;
  onUpdateQty: (product: Product, qty: number) => void;
  onViewProduct: (product: Product) => void;
}

  const ProductRow = React.memo<ProductRowProps>(({ product, currentQty, onUpdateQty, onViewProduct }) => {
  const imageUrl = product.imageUrl || product.ImageUrl || product.imageurl;

  return (
    <tr className={`group transition-colors ${currentQty > 0 ? 'bg-gusto-green/5' : 'hover:bg-slate-50/80'}`}>
      <td className="px-2 py-2">
        <div className="flex items-center gap-2">
          {imageUrl ? (
            <button
              onClick={() => onViewProduct(product)}
              className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1 hover:border-gusto-green/50 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <img src={imageUrl} alt="" className="w-full h-full object-contain" />
            </button>
          ) : (
            <button
              onClick={() => onViewProduct(product)}
              className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center hover:border-gusto-green/50 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Package size={16} className="text-slate-300" />
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 text-xs leading-tight uppercase group-hover:text-gusto-green transition-colors truncate">
                {product.description}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">{product.code}</span>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-right">
        <span className="font-black text-slate-800 text-xs">
          {product.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
        </span>
      </td>
      <td className="px-2 py-2">
        <div className="flex justify-center">
          <div className={`flex items-center bg-white border-2 rounded-xl overflow-hidden transition-all min-w-[40px] ${currentQty > 0 ? 'border-gusto-green shadow-sm' : 'border-slate-100 group-hover:border-slate-200'}`}>
            <button
              type="button"
              onClick={() => onUpdateQty(product, Math.max(0, currentQty - 1))}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white rounded-md transition-all font-bold min-h-[28px]"
            >
              -
            </button>
            <input
              type="number"
              className="w-7 bg-transparent text-center text-xs font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-gusto-green hover:bg-white rounded-md transition-all font-bold min-h-[28px]"
            >
              +
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
});
