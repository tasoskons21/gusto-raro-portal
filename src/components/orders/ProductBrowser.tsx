import React, { useMemo } from 'react';
import { Search, Package, X, Eye, ShoppingCart } from 'lucide-react';
import { Product, CartItem } from '../../types';

interface ProductBrowserProps {
  productSearch: string;
  setProductSearch: (term: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  allBrands: { name: string }[];
  filteredProducts: Product[];
  cart: CartItem[];
  onUpdateCartQuantity: (product: Product, qty: number) => void;
  onViewProduct: (product: Product) => void;
  isLoading?: boolean;
  isViewOnly?: boolean;
}

export const ProductBrowser: React.FC<ProductBrowserProps> = ({
  productSearch,
  setProductSearch,
  selectedBrand,
  setSelectedBrand,
  allBrands,
  filteredProducts,
  cart,
  onUpdateCartQuantity,
  onViewProduct,
  isLoading = false,
}) => {
  const cartItemsByCode = useMemo(() => new Map(cart.map(item => [item.code, item.quantity])), [cart]);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-gusto-slate-200 p-4 flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0 gap-2">
          <h3 className="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-gusto-green rounded-full"></span>
            <span className="truncate">{selectedBrand || 'Όλα τα Brand'}</span>
          </h3>
          <div className="relative flex-1 max-w-[200px] sm:max-w-none">
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

        {/* Brand Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0 -mx-1 px-1">
          {allBrands.map(brand => (
            <button
              key={brand.name}
              onClick={() => setSelectedBrand(brand.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedBrand === brand.name
                  ? 'bg-gusto-green text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gusto-slate-200 overflow-hidden">
                  <div className="h-48 skeleton"></div>
                  <div className="p-3 space-y-2">
                    <div className="skeleton skeleton-title w-1/2"></div>
                    <div className="skeleton skeleton-text w-3/4"></div>
                    <div className="flex items-center justify-between">
                      <div className="skeleton w-16 h-5 rounded-md"></div>
                      <div className="skeleton w-10 h-3 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-gusto-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Package size={32} className="text-gusto-slate-300" />
                </div>
                <p className="text-slate-500 font-semibold text-sm">Δεν βρέθηκαν προϊόντα</p>
                <p className="text-xs text-slate-400 mt-1">Δοκιμάστε να αλλάξετε τα φίλτρα ή την αναζήτηση</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {filteredProducts.map(product => {
                const code = product.code || (product as any).Code;
                const description = product.description || (product as any).Description || '';
                const price = product.price || (product as any).Price || 0;
                const brand = product.brand || (product as any).Brand || '';
                const imageUrl = product.imageUrl || (product as any).ImageUrl;
                const cartQty = cartItemsByCode.get(code) || 0;

                return (
                  <div
                    key={code}
                    className="bg-white rounded-xl border border-gusto-slate-200 overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] transition-all group"
                  >
                    {/* Product Image */}
                    <div
                      className="h-48 bg-gusto-slate-50 relative overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => onViewProduct(product)}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={description}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gusto-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">{brand}</p>
                      <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2 leading-snug" title={description}>
                        {description}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-gusto-green font-black text-base">
                          €{price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">{code}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
