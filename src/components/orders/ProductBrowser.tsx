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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-0 flex-1 overflow-hidden">
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
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-gusto-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Φόρτωση προϊόντων...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <Package size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Δεν βρέθηκαν προϊόντα</p>
                <p className="text-sm text-slate-400 mt-1">Δοκιμάστε να αλλάξετε τα φίλτρα ή την αναζήτηση</p>
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
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Product Image */}
                    <div
                      className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center cursor-pointer"
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
                          <Package size={32} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{brand}</p>
                      <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2" title={description}>
                        {description}
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gusto-green font-bold text-lg">
                          €{price.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{code}</span>
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
