import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import XLSX from 'xlsx-js-style';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Product, CartItem, OrderRecord, User, Brand, Profile } from './types';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabase';

// Components
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { CustomerSelection } from './components/customers/CustomerSelection';
import { BrandSidebar } from './components/orders/BrandSidebar';
import { ProductList } from './components/orders/ProductList';
import { Cart } from './components/orders/Cart';
import { AdminModal } from './components/admin/AdminModal';
import { ProductDetailsModal } from './components/orders/ProductDetailsModal';
import { OrderConfirmationModal } from './components/orders/OrderConfirmationModal';
import { LayoutGrid, ShoppingBag, ShoppingCart } from 'lucide-react';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User>({ id: '', email: '', role: 'customer', customer_id: null, isLoggedIn: false });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'customer', fullName: '', customerId: '' });
  const [adminStatus, setAdminStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', price: '', imageUrl: '' });
  const [adminSearchResults, setAdminSearchResults] = useState<Product[]>([]);
  const [newBrandForm, setNewBrandForm] = useState({ name: '', logo: '' });
  const [newProductForm, setNewProductForm] = useState({ code: '', description: '', brand: '', price: '', imageUrl: '' });

  // UI State
  const [activeTab, setActiveTab] = useState<'brands' | 'products' | 'cart'>('products');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [notes, setNotes] = useState('');
  const [viewingOrder, setViewingOrder] = useState<OrderRecord | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Order State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load Initial Data Function
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [custData, prodData, brandData] = await Promise.all([
        dataService.fetchCustomers(),
        dataService.fetchProducts(),
        dataService.fetchBrands()
      ]);

      setCustomers(custData);
      setProducts(prodData);

      const sortedBrands = (brandData || []).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );
      setAllBrands(sortedBrands);

      // Αυτόματη επιλογή της πρώτης εταιρείας αν δεν υπάρχει ήδη επιλεγμένη
      if (sortedBrands.length > 0 && !selectedBrand) {
        setSelectedBrand(sortedBrands[0].name);
      }

      if (user.isLoggedIn && user.role === 'customer' && (user as any).customer_id) {
        const myCustomer = custData.find(c => String(c.id) === String((user as any).customer_id));
        if (myCustomer) {
          setSelectedCustomer(myCustomer);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Effects
  useEffect(() => {
    const checkSession = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, customer_id')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'customer',
            customer_id: profile?.customer_id,
            isLoggedIn: true
          });
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, customer_id')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: profile?.role || 'customer',
          customer_id: profile?.customer_id,
          isLoggedIn: true
        });
      } else {
        setUser({ id: '', email: '', role: 'customer', isLoggedIn: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user.isLoggedIn) {
      loadInitialData();
    }
  }, [user.isLoggedIn, user.role, user.customer_id]);

  // Memoized Data
  const filteredCustomers = useMemo(() => {
    if (user.role === 'customer' && user.customer_id) {
      const myId = String(user.customer_id);
      return customers.filter(c => String(c.id) === myId);
    }

    const trimmedSearch = (searchTerm || '').trim();
    if (trimmedSearch.length === 0) return [];

    const term = trimmedSearch.toLowerCase();
    return customers
      .filter(c => {
        const name = (c.name || '').toLowerCase();
        const afm = (c.afm || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        const code = (c.customer_code || c.code || '').toLowerCase();

        return name.includes(term) || afm.includes(term) || code.includes(term) || city.includes(term);
      })
      .slice(0, 30);
  }, [customers, searchTerm, user.role, user.customer_id]);

  const filteredProducts = useMemo(() => {
    const term = (productSearch || '').toLowerCase().trim();
    const filtered = products.filter(p => {
      const productBrand = p.brand || (p as any).Brand || '';
      const matchesBrand = (selectedBrand === '' || productBrand === selectedBrand);
      const desc = (p.description || (p as any).Description || '').toLowerCase();
      const code = (p.code || (p as any).Code || '').toLowerCase();
      const matchesSearch = term === '' || desc.includes(term) || code.includes(term);
      return matchesBrand && matchesSearch;
    });

    const seen = new Set();
    return filtered.filter(p => {
      const productCode = p.code || (p as any).Code;
      if (!productCode || seen.has(productCode)) return false;
      seen.add(productCode);
      return true;
    });
  }, [products, selectedBrand, productSearch]);

  const totalNet = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, customer_id')
          .eq('id', authData.user.id)
          .single();

        setUser({
          id: authData.user.id,
          email: authData.user.email || '',
          role: profile?.role || 'customer',
          customer_id: profile?.customer_id,
          isLoggedIn: true
        });
      }
    } catch (err: any) {
      setLoginError(err.message || 'Λάθος στοιχεία σύνδεσης. Δοκιμάστε ξανά.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setUser({ id: '', email: '', role: 'customer', isLoggedIn: false });
      setCart([]);
      setSelectedCustomer(null);
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = window.location.origin;
    } catch (err) {
      console.error(err);
      localStorage.clear();
      window.location.reload();
    }
  };

  // Cart Handlers
  const updateCartQuantity = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.code === product.code);
      if (qty <= 0) return prev.filter(item => item.code !== product.code);
      if (existing) return prev.map(item => item.code === product.code ? { ...item, quantity: qty } : item);
      return [...prev, { ...product, quantity: qty }];
    });
  };

  // Order Handlers
  const handleCheckout = async () => {
    if (!selectedCustomer) return;
    setIsExporting(true);
    try {
      // 1. Export Excel ALWAYS
      dataService.exportToExcel(selectedCustomer, cart, totalNet, notes);

      // 2. Show Success Modal (Skip database submission as per user request)
      const newRecord: OrderRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        customerName: selectedCustomer.name,
        customerCode: selectedCustomer.customer_code || selectedCustomer.code,
        customerAfm: selectedCustomer.afm,
        items: [...cart],
        totalValue: totalNet,
        notes: notes
      };
      setViewingOrder(newRecord);
      setShowSuccess(true);
      
    } catch (err) {
      console.error('Order checkout failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Admin Handlers
  const fetchAllUsers = async (showLoading = true) => {
    if (showLoading) setIsAdminLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
      if (error) throw error;
      setAllUsers(data || []);
    } catch (err: any) {
      console.error("Fetch users error:", err);
    } finally {
      if (showLoading) setIsAdminLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        email_confirm: true
      });

      if (authError) throw authError;

      if (data?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: newUserForm.email,
            role: newUserForm.role,
            customer_id: newUserForm.role === 'customer' ? newUserForm.customerId : null
          });
        if (profileError) throw profileError;
      }

      setAdminStatus({ msg: 'Ο ΧΡΗΣΤΗΣ ΔΗΜΙΟΥΡΓΗΘΗΚΕ', type: 'success' });
      setNewUserForm({ email: '', password: '', role: 'customer', fullName: '', customerId: '' });
      await fetchAllUsers(false);
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsAdminLoading(false);
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setAdminStatus({ msg: 'Ο ΡΟΛΟΣ ΕΝΗΜΕΡΩΘΗΚΕ', type: 'success' });
      await fetchAllUsers(false);
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleDeleteUser = async (userId: string, role: string) => {
    if (role === 'admin') return;
    if (!window.confirm('Διαγραφή χρήστη;')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setAdminStatus({ msg: 'Ο ΧΡΗΣΤΗΣ ΔΙΑΓΡΑΦΗΚΕ', type: 'success' });
      await fetchAllUsers(false);
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    try {
      const { error } = await supabase.from('brands').insert([{
        name: newBrandForm.name.toUpperCase(),
        logo_url: newBrandForm.logo || null
      }]);
      if (error) throw error;
      setAdminStatus({ msg: 'ΤΟ BRAND ΔΗΜΙΟΥΡΓΗΘΗΚΕ', type: 'success' });
      setNewBrandForm({ name: '', logo: '' });
      await loadInitialData();
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsAdminLoading(false);
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm('Διαγραφή brand;')) return;
    try {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      setAdminStatus({ msg: 'ΤΟ BRAND ΔΙΑΓΡΑΦΗΚΕ', type: 'success' });
      await loadInitialData();
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    try {
      const { error } = await supabase.from('products').insert([{
        Code: newProductForm.code.toUpperCase(),
        Description: newProductForm.description.toUpperCase(),
        Brand: newProductForm.brand,
        Price: parseFloat(newProductForm.price),
        ImageUrl: newProductForm.imageUrl || null
      }]);
      if (error) throw error;
      setAdminStatus({ msg: 'ΤΟ ΠΡΟΪΟΝ ΔΗΜΙΟΥΡΓΗΘΗΚΕ', type: 'success' });
      setNewProductForm({ code: '', description: '', brand: '', price: '', imageUrl: '' });
      await loadInitialData();
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsAdminLoading(false);
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleSearchProduct = async () => {
    if (!searchCode.trim()) return;
    setIsAdminLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('Code', `%${searchCode.toUpperCase()}%`)
        .limit(50);
      if (error) throw error;
      setAdminSearchResults(data || []);
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleUpdateProduct = async (code: string) => {
    setIsAdminLoading(true);
    try {
      const { error } = await supabase.from('products').update({
        Description: editForm.description.toUpperCase(),
        Price: parseFloat(editForm.price),
        ImageUrl: editForm.imageUrl || null
      }).eq('Code', code);
      if (error) throw error;
      setAdminStatus({ msg: 'ΤΟ ΠΡΟΪΟΝ ΕΝΗΜΕΡΩΘΗΚΕ', type: 'success' });
      setEditingProduct(null);
      await loadInitialData();
      await handleSearchProduct();
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsAdminLoading(false);
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  const handleDeleteProduct = async (code: string) => {
    if (!window.confirm('Διαγραφή προϊόντος;')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('Code', code);
      if (error) throw error;
      setAdminStatus({ msg: 'ΤΟ ΠΡΟΪΟΝ ΔΙΑΓΡΑΦΗΚΕ', type: 'success' });
      await loadInitialData();
      await handleSearchProduct();
    } catch (err: any) {
      setAdminStatus({ msg: err.message, type: 'error' });
    } finally {
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  // Render
  if (authLoading) {
    return (
      <div className="order-page-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gusto-gold"></div>
      </div>
    );
  }

  if (!user.isLoggedIn) {
    return (
      <LoginForm
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
        loginError={loginError}
        authLoading={authLoading}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
    );
  }

  return (
    <div className="order-page-bg font-sans pb-20 md:pb-0 h-screen overflow-hidden flex flex-col">
      <Header
        user={user}
        isLoading={isLoading}
        onShowAdminModal={() => { setShowAdminModal(true); fetchAllUsers(true); }}
        onLogout={handleLogout}
      />

      <main className="w-full px-2 sm:px-4 py-2 sm:py-4 flex-1 min-h-0 overflow-hidden relative">
        {!selectedCustomer ? (
          <div className="max-w-7xl mx-auto w-full">
            <CustomerSelection
              customers={customers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoading={isLoading}
              filteredCustomers={filteredCustomers}
              onSelectCustomer={setSelectedCustomer}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 h-full pb-16 lg:pb-0">
            {/* Brands Sidebar - Visible on Desktop or when activeTab is 'brands' */}
            <div className={`${activeTab === 'brands' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 h-full min-h-0`}>
              <BrandSidebar
                selectedCustomer={selectedCustomer}
                onChangeCustomer={() => setSelectedCustomer(null)}
                brandSearch={brandSearch}
                setBrandSearch={setBrandSearch}
                allBrands={allBrands}
                selectedBrand={selectedBrand}
                onSelectBrand={(brand) => {
                  setSelectedBrand(brand);
                  if (window.innerWidth < 1024) setActiveTab('products');
                }}
                userRole={user.role}
              />
            </div>

            {/* Product List - Visible on Desktop or when activeTab is 'products' */}
            <div className={`${activeTab === 'products' ? 'flex' : 'hidden'} lg:flex lg:col-span-6 h-full min-h-0`}>
              <ProductList
                productSearch={productSearch}
                setProductSearch={setProductSearch}
                selectedBrand={selectedBrand}
                filteredProducts={filteredProducts}
                cart={cart}
                onUpdateCartQuantity={updateCartQuantity}
                onViewProduct={setViewingProduct}
              />
            </div>

            {/* Cart - Visible on Desktop or when activeTab is 'cart' */}
            <div className={`${activeTab === 'cart' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 h-full min-h-0`}>
              <Cart
                cart={cart}
                totalNet={totalNet}
                onUpdateCartQuantity={updateCartQuantity}
                onCheckout={handleCheckout}
                isOrderSubmitting={isExporting}
                onViewProduct={setViewingProduct}
                notes={notes}
                onNotesChange={setNotes}
              />
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => setActiveTab('brands')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'brands' ? 'text-gusto-green scale-110' : 'text-slate-400'}`}
              >
                <LayoutGrid size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Εταιρειες</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'products' ? 'text-gusto-green scale-110' : 'text-slate-400'}`}
              >
                <ShoppingBag size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Προϊοντα</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('cart')}
                className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'cart' ? 'text-gusto-green scale-110' : 'text-slate-400'}`}
              >
                <ShoppingCart size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Καλαθι</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AdminModal
        show={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        users={allUsers}
        onAddUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
        newUser={newUserForm}
        setNewUser={setNewUserForm}
        customers={customers}
        allBrands={allBrands}
        newBrandForm={newBrandForm}
        setNewBrandForm={setNewBrandForm}
        onAddBrand={handleCreateBrand}
        onDeleteBrand={handleDeleteBrand}
        products={products}
        newProductForm={newProductForm}
        setNewProductForm={setNewProductForm}
        onAddProduct={handleCreateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateProduct={handleUpdateProduct}
        searchCode={searchCode}
        setSearchCode={setSearchCode}
        onSearchProduct={handleSearchProduct}
        adminSearchResults={adminSearchResults}
        setAdminSearchResults={setAdminSearchResults}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        editForm={editForm}
        setEditForm={setEditForm}
        isLoading={isAdminLoading}
        status={adminStatus}
        currentUser={user}
      />

      <ProductDetailsModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        currentQty={cart.find(item => item.code === viewingProduct?.code)?.quantity || 0}
        onUpdateQty={updateCartQuantity}
      />

      <OrderConfirmationModal
        show={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setCart([]);
          setSelectedCustomer(null);
        }}
        orderId={viewingOrder?.id || null}
      />
    </div>
  );
}
