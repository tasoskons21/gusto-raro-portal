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
import { ProductBrowser } from './components/orders/ProductBrowser';
import { Cart } from './components/orders/Cart';
import { AdminModal } from './components/admin/AdminModal';
import { ProductDetailsModal } from './components/orders/ProductDetailsModal';
import { OrderConfirmationModal } from './components/orders/OrderConfirmationModal';
import { ExportPreviewModal } from './components/orders/ExportPreviewModal';
import { OrdersList } from './components/orders/OrdersList';
import { OrderViewModal } from './components/orders/OrderViewModal';
import { SoftOneConfirmModal } from './components/orders/SoftOneConfirmModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { StatusModal } from './components/common/StatusModal';
import { LayoutGrid, ShoppingBag, ShoppingCart, ClipboardList, Package } from 'lucide-react';

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
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [softOneModalOrder, setSoftOneModalOrder] = useState<any>(null);
  const [softOneSending, setSoftOneSending] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });
  const [statusModal, setStatusModal] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedOrders, setSavedOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeView, setActiveView] = useState<'products' | 'order' | 'orders'>('order');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

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

  useEffect(() => {
    if ((activeView as string) === 'orders' && user.isLoggedIn) {
      loadSavedOrders();
    }
  }, [activeView, user.isLoggedIn]);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

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
      });
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

  const handleChangeCustomer = () => {
    setCart([]);
    setNotes('');
    setEditingOrderId(null);
    setSelectedCustomer(null);
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
    setShowExportPreview(true);
  };

  const handleConfirmExport = async () => {
    setShowExportPreview(false);
    setIsExporting(true);

    try {
      const customer = selectedCustomer;
      if (!customer) return;

      // Προετοιμασία δεδομένων
      const orderData: any = {
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        customer_id: customer.id || null,
        customer_name: customer.name,
        customer_code: customer.customer_code || customer.code,
        customer_afm: customer.afm,
        customer_address: customer.address || '',
        customer_city: customer.city || '',
        items: cart,
        total_value: totalNet,
        notes: notes,
        status: 'submitted' as const
      };

      // Αν επεξεργαζόμαστε υπάρχουσα παραγγελία, συμπεριλαμβάνουμε το ID 
      // ώστε το upsert να ξέρει ποια εγγραφή να ενημερώσει
      if (editingOrderId) {
        orderData.id = editingOrderId;
      }

      // Χρήση upsert αντί για update/insert για αποφυγή CORS θεμάτων με το PATCH
      const { error: dbError } = await supabase
        .from('orders')
        .upsert(orderData, { onConflict: 'id' });

      if (dbError) throw dbError;

      // Εμφάνιση ΜΟΝΟ του StatusModal για επιτυχία
      setStatusModal({
        show: true,
        type: 'success',
        title: 'Επιτυχής Καταχώρηση',
        message: editingOrderId
          ? 'Η παραγγελία ενημερώθηκε επιτυχώς.'
          : 'Η παραγγελία σας αποθηκεύτηκε επιτυχώς.'
      });

      // Καθαρισμός κατάστασης
      setCart([]);
      setNotes('');
      setSelectedCustomer(null);
      setEditingOrderId(null);

    } catch (err: any) {
      console.error('Order checkout failed:', err);

      // Εμφάνιση ΜΟΝΟ του StatusModal για αποτυχία
      setStatusModal({
        show: true,
        type: 'error',
        title: 'Σφάλμα Σύνδεσης',
        message: 'Παρουσιάστηκε σφάλμα κατά την επικοινωνία με τη βάση (CORS ή Database error).'
      });

      // Αφαιρέθηκε το setShowError για να μην βγαίνει δεύτερο μήνυμα
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    setIsExporting(true);
    try {
      const customer = selectedCustomer;

      const orderData = {
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        customer_id: customer.id || null,
        customer_name: customer.name,
        customer_code: customer.customer_code || customer.code,
        customer_afm: customer.afm,
        items: cart,
        total_value: totalNet,
        notes: notes,
        status: 'draft' as const
      };

      if (editingOrderId) {
        const { error } = await supabase.from('orders').update(orderData).eq('id', editingOrderId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('orders').insert(orderData);
        if (error) throw error;
      }

      setShowSuccess(true);
      setCart([]);
      setNotes('');
      setEditingOrderId(null);
    } catch (err) {
      console.error('Save draft failed:', err);
      setShowError('Αποτυχία αποθήκευσης προσχεδίου');
    } finally {
      setIsExporting(false);
    }
  };

  const loadSavedOrders = async () => {
    setIsLoadingOrders(true);
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (user.role === 'customer' || user.role === 'seller') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSavedOrders(data || []);
    } catch (err) {
      console.error('Load orders failed:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmModal({
      show: true,
      title: 'Διαγραφή Παραγγελίας',
      message: 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την παραγγελία; Η ενέργεια δεν αναιρείται.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase.from('orders').delete().eq('id', orderId);

          if (error) throw error;

          // Εμφάνιση StatusModal για επιτυχία
          setStatusModal({
            show: true,
            type: 'success',
            title: 'Επιτυχής Διαγραφή',
            message: 'Η παραγγελία διαγράφηκε οριστικά.'
          });

          await loadSavedOrders();
        } catch (err: any) {
          console.error('Delete order failed:', err);

          // Εμφάνιση StatusModal για αποτυχία (αντί για το setShowError)
          setStatusModal({
            show: true,
            type: 'error',
            title: 'Σφάλμα Διαγραφής',
            message: err?.message || 'Δεν ήταν δυνατή η ολοκλήρωση της διαγραφής.'
          });
        }
      }
    });
  };

  const handleViewOrder = (order: any) => {
    setViewingOrder(order);
  };

  const handleLoadDraft = async (order: any) => {
    const items = order.items || [];
    setCart(items);
    setNotes(order.notes || '');
    setEditingOrderId(order.id);
    setActiveView('order');
    setSelectedCustomer({
      id: order.customer_id,
      name: order.customer_name,
      customer_code: order.customer_code,
      code: order.customer_code,
      afm: order.customer_afm,
      address: order.customer_address || '',
      city: order.customer_city || ''
    } as Customer);
  };

  const handleSendOrder = (order: any) => {
    const customer = {
      id: order.customer_id,
      name: order.customer_name,
      customer_code: order.customer_code,
      code: order.customer_code,
      afm: order.customer_afm,
      address: order.customer_address || '',
      city: order.customer_city || ''
    };
    dataService.exportToExcel(customer, order.items || [], order.total_value, order.notes);
  };

  const handleSendToSoft1 = (order: any) => {
    setSoftOneModalOrder(order);
  };

  const handleConfirmSoftOneSend = async () => {
    if (!softOneModalOrder) return;

    setSoftOneSending(true);
    try {
      const { sendOrderToSoftOne } = await import('./services/softoneService');
      const result = await sendOrderToSoftOne(softOneModalOrder);

      if (!result.success) {
        setShowError(result.message);
        setSoftOneModalOrder(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', softOneModalOrder.id);

      if (deleteError) {
        console.error('Failed to delete order after SoftOne send:', deleteError);
        setShowError(`Η παραγγελία στάλθηκε στο SoftOne (${result.message}) αλλά απέτυχε η διαγραφή από το σύστημα.`);
        await loadSavedOrders();
        setSoftOneModalOrder(null);
        return;
      }

      setShowSuccess(true);
      await loadSavedOrders();
      setSoftOneModalOrder(null);
    } catch (err: any) {
      console.error('Send to SoftOne failed:', err);
      setShowError(`Αποτυχία αποστολής στο SoftOne: ${err?.message || 'Άγνωστο σφάλμα'}`);
    } finally {
      setSoftOneSending(false);
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            role: newUserForm.role,
            full_name: newUserForm.fullName
          }
        }
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

      setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Ο χρήστης δημιουργήθηκε επιτυχώς.' });
      setNewUserForm({ email: '', password: '', role: 'customer', fullName: '', customerId: '' });
      await fetchAllUsers(false);
    } catch (err: any) {
      setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά τη δημιουργία χρήστη.' });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Ο ρόλος ενημερώθηκε επιτυχώς.' });
      await fetchAllUsers(false);
    } catch (err: any) {
      setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά την ενημέρωση ρόλου.' });
    }
  };

  const handleDeleteUser = async (userId: string, role: string) => {
    if (role === 'admin') return;
    setConfirmModal({
      show: true,
      title: 'Διαγραφή Χρήστη',
      message: 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον χρήστη; Η ενέργεια δεν αναιρείται.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', userId);
          if (error) throw error;
          setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Ο χρήστης διαγράφηκε επιτυχώς.' });
          await fetchAllUsers(false);
        } catch (err: any) {
          setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά τη διαγραφή χρήστη.' });
        }
      }
    });
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const brandName = newBrandForm.name.toUpperCase().trim();
    const brandLogo = newBrandForm.logo?.trim() || null;

    if (!brandName) return;

    setIsAdminLoading(true);

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([{
          name: brandName,
          logo_url: brandLogo
        }])
        .select();

      if (error) throw error;

      setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Το brand δημιουργήθηκε επιτυχώς.' });
      setNewBrandForm({ name: '', logo: '' });
      await loadInitialData();
    } catch (err: any) {
      console.error('Error creating brand:', err);
      setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά τη δημιουργία brand.' });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Διαγραφή Brand',
      message: 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το brand; Η ενέργεια δεν αναιρείται.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase.from('brands').delete().eq('id', id);
          if (error) throw error;
          setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Το brand διαγράφηκε επιτυχώς.' });
          await loadInitialData();
        } catch (err: any) {
          setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά τη διαγραφή brand.' });
        }
      }
    });
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
      setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Το προϊόν δημιουργήθηκε επιτυχώς.' });
      setNewProductForm({ code: '', description: '', brand: '', price: '', imageUrl: '' });
      await loadInitialData();
    } catch (err: any) {
      setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά τη δημιουργία προϊόντος.' });
    } finally {
      setIsAdminLoading(false);
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
      setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά την αναζήτηση προϊόντος.' });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleUpdateProduct = async (code: string) => {
    setIsAdminLoading(true);
    try {
      const updateData: any = {
        Description: editForm.description.toUpperCase(),
        Price: parseFloat(editForm.price)
      };

      if (editForm.imageUrl) {
        updateData.ImageUrl = editForm.imageUrl;
      }

      const { error } = await supabase.from('products').update(updateData).eq('Code', code);
      if (error) throw error;
      setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Το προϊόν ενημερώθηκε επιτυχώς.' });
      setEditingProduct(null);
      await loadInitialData();
      await handleSearchProduct();
    } catch (err: any) {
      setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά την ενημέρωση προϊόντος.' });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleDeleteProduct = async (code: string) => {
    setConfirmModal({
      show: true,
      title: 'Διαγραφή Προϊόντος',
      message: 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το προϊόν; Η ενέργεια δεν αναιρείται.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase.from('products').delete().eq('Code', code);
          if (error) throw error;
          setStatusModal({ show: true, type: 'success', title: 'Επιτυχία', message: 'Το προϊόν διαγράφηκε επιτυχώς.' });
          await loadInitialData();
          await handleSearchProduct();
        } catch (err: any) {
          setStatusModal({ show: true, type: 'error', title: 'Αποτυχία', message: err.message || 'Σφάλμα κατά τη διαγραφή προϊόντος.' });
        }
      }
    });
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
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="w-full px-2 sm:px-4 py-2 sm:py-4 flex-1 min-h-0 overflow-hidden relative">
        {(activeView as string) === 'orders' ? (
          <div className="max-w-5xl mx-auto w-full h-full overflow-y-auto pb-20 lg:pb-4">
            <OrdersList
              orders={savedOrders}
              user={user}
              customers={customers}
              isLoading={isLoadingOrders}
              onView={handleViewOrder}
              onLoadDraft={handleLoadDraft}
              onSendOrder={handleSendOrder}
              onSendToSoft1={handleSendToSoft1}
              onDelete={handleDeleteOrder}
              onRefresh={loadSavedOrders}
            />
          </div>
        ) : (activeView as string) === 'products' ? (
          <div className="max-w-7xl mx-auto w-full h-full overflow-y-auto pb-20 lg:pb-4">
            <ProductBrowser
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              allBrands={allBrands}
              filteredProducts={filteredProducts}
              cart={cart}
              onUpdateCartQuantity={updateCartQuantity}
              onViewProduct={setViewingProduct}
              isLoading={isLoading}
            />
          </div>
        ) : !selectedCustomer ? (
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
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-12 gap-4 h-full pb-4 md:pb-4 lg:pb-0">
            {/* Brands Sidebar - Visible on Desktop/Tablet when activeTab is 'brands' */}
            <div className={`${activeTab === 'brands' ? 'flex' : 'hidden'} md:flex md:col-span-1 lg:flex lg:col-span-3 h-full min-h-0`}>
              <BrandSidebar
                selectedCustomer={selectedCustomer}
                onChangeCustomer={handleChangeCustomer}
                brandSearch={brandSearch}
                setBrandSearch={setBrandSearch}
                allBrands={allBrands}
                selectedBrand={selectedBrand}
                onSelectBrand={(brand) => {
                  setSelectedBrand(brand);
                  if (window.innerWidth < 1024) setActiveTab('products');
                }}
                userRole={user.role}
                isLoading={isLoading}
              />
            </div>

            {/* Product List - Visible on Desktop/Tablet when activeTab is 'products' */}
            <div className={`${activeTab === 'products' ? 'flex' : 'hidden'} md:flex md:col-span-1 lg:flex lg:col-span-6 h-full min-h-0`}>
              <ProductList
                productSearch={productSearch}
                setProductSearch={setProductSearch}
                selectedBrand={selectedBrand}
                filteredProducts={filteredProducts}
                cart={cart}
                onUpdateCartQuantity={updateCartQuantity}
                onViewProduct={setViewingProduct}
                isLoading={isLoading}
              />
            </div>

            {/* Cart - Visible on Desktop/Tablet when activeTab is 'cart' */}
            <div className={`${activeTab === 'cart' ? 'flex' : 'hidden'} md:flex md:col-span-2 lg:flex lg:col-span-3 h-full min-h-0`}>
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
          </div>
        )}

        {/* Mobile Order Sub-Tabs Navigation (shown only when in order view with customer selected) */}
        {activeView === 'order' && selectedCustomer && (
          <div className="md:hidden fixed bottom-16 left-0 right-0 bg-slate-50 border-t border-slate-200 px-1.5 py-1.5 flex justify-around items-center z-40">
            <button
              onClick={() => setActiveTab('brands')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-h-[40px] min-w-[40px] ${activeTab === 'brands' ? 'bg-white text-gusto-green shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <LayoutGrid size={16} />
              <span className="text-[9px] font-bold uppercase">Εταιρειες</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-h-[40px] min-w-[40px] ${activeTab === 'products' ? 'bg-white text-gusto-green shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <ShoppingBag size={16} />
              <span className="text-[9px] font-bold uppercase">Προϊοντα</span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all relative min-h-[40px] min-w-[40px] ${activeTab === 'cart' ? 'bg-white text-gusto-green shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <ShoppingCart size={16} />
              <span className="text-[9px] font-bold uppercase">Καλαθι</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-1.5 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => { setActiveView('products'); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-h-[40px] min-w-[40px] ${activeView === 'products' ? 'text-gusto-green bg-gusto-green/5' : 'text-slate-500 hover:text-gusto-green hover:bg-slate-50'}`}
          >
            <Package size={18} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Προϊόντα</span>
          </button>

          <button
            onClick={() => { setActiveView('order'); setActiveTab('brands'); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-h-[40px] min-w-[40px] ${activeView === 'order' ? 'text-gusto-green bg-gusto-green/5' : 'text-slate-500 hover:text-gusto-green hover:bg-slate-50'}`}
          >
            <ShoppingCart size={18} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Παραγγελία</span>
          </button>

          <button
            onClick={() => { setActiveView('orders'); loadSavedOrders(); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-h-[40px] min-w-[40px] ${(activeView as string) === 'orders' ? 'text-gusto-green bg-gusto-green/5' : 'text-slate-500 hover:text-gusto-green hover:bg-slate-50'}`}
          >
            <ClipboardList size={18} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Παραγγελίες</span>
          </button>
        </div>
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
        currentUser={user}
      />

      <ProductDetailsModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        currentQty={cart.find(item => item.code === viewingProduct?.code)?.quantity || 0}
        onUpdateQty={updateCartQuantity}
        isViewOnly={activeView === 'products'}
      />

      <OrderConfirmationModal
        show={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setCart([]);
          setSelectedCustomer(null);
          setNotes('');
        }}
        orderId={viewingOrder?.id || null}
      />

      {showError && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Σφάλμα</p>
              <p className="text-sm text-red-700 mt-1">{showError}</p>
            </div>
            <button
              onClick={() => setShowError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <SoftOneConfirmModal
        show={!!softOneModalOrder}
        order={softOneModalOrder}
        onConfirm={handleConfirmSoftOneSend}
        onCancel={() => setSoftOneModalOrder(null)}
        isSending={softOneSending}
      />

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        variant="danger"
      />

      <StatusModal
        show={statusModal.show}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, show: false }))}
      />

      <ExportPreviewModal
        show={showExportPreview}
        onClose={() => setShowExportPreview(false)}
        onConfirm={handleConfirmExport}
        customer={selectedCustomer}
        cart={cart}
        totalNet={totalNet}
        notes={notes}
      />

      <OrderViewModal
        order={viewingOrder}
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
