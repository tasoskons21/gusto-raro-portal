import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
//import * as XLSX from 'xlsx';
import XLSX from 'xlsx-js-style';
import { 
  Search, 
  ShoppingCart, 
  LogOut, 
  User as UserIcon, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  History, 
  Package,
  Plus,
  Minus,
  Trash2,
  Download,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Product, CartItem, OrderRecord, User, Brand } from './types';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabase';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User>({ id: '', email: '', role: 'customer', isLoggedIn: false });
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'customer' });

  // UI State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'month' | 'all' | 'year'>('month');
  const [notes, setNotes] = useState('');
  const [viewingOrder, setViewingOrder] = useState<OrderRecord | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [history, setHistory] = useState<OrderRecord[]>([]);

  // Load Data
  useEffect(() => {
    const checkSession = async () => {
      setAuthLoading(true);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timed out')), 5000)
      );

      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as any;

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'customer',
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
          .select('role')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: profile?.role || 'customer',
          isLoggedIn: true
        });
      } else {
        setUser({ id: '', email: '', role: 'customer', isLoggedIn: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [custData, prodData, brandData] = await Promise.all([
          dataService.fetchCustomers(),
          dataService.fetchProducts(),
          dataService.fetchBrands()
        ]);
        setCustomers(custData);
        setProducts(prodData);
        setAllBrands(brandData.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Σφάλμα κατά τη φόρτωση των δεδομένων.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Memoized Filters for performance
  const filteredCustomers = useMemo(() => {
    if (searchTerm.trim().length === 0) return [];
    const term = searchTerm.toLowerCase().trim();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.afm.includes(term) || 
      c.code.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    ).slice(0, 30);
  }, [customers, searchTerm]);

  const brands = useMemo(() => {
    return allBrands.map(b => b.name);
  }, [allBrands]);

  useEffect(() => {
    if (brands.length > 0 && selectedBrand === '') {
      setSelectedBrand(brands[0]);
    }
  }, [brands, selectedBrand]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase().trim();
    const filtered = products.filter(p => {
      const matchesBrand = (selectedBrand === '' || p.brand === selectedBrand);
      
      return matchesBrand &&
        (term === '' || 
         p.description.toLowerCase().includes(term) || 
         p.code.toLowerCase().includes(term));
    });
    
    const seen = new Set();
    return filtered.filter(p => {
      if (seen.has(p.code)) return false;
      seen.add(p.code);
      return true;
    });
  }, [products, selectedBrand, productSearch]);

  const totalNet = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Actions
  const updateCartQuantity = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.code === product.code);
      if (qty <= 0) {
        return prev.filter(item => item.code !== product.code);
      }
      if (existing) {
        return prev.map(item => item.code === product.code ? { ...item, quantity: qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const addToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.code === product.code);
      if (existing) {
        return prev.map(item => item.code === product.code ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.code !== code));
  };

  const decrementQuantity = (code: string) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.code === code) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

const exportToExcel = () => {
  if (cart.length === 0 || !selectedCustomer) return;

  // 1. Βασικά Στοιχεία Πελάτη
  const data: any[][] = [
    ['ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ'],
    ['Κωδικός:', selectedCustomer.code],
    ['Όνομα:', selectedCustomer.name],
    ['ΑΦΜ:', selectedCustomer.afm],
    ['Διεύθυνση:', selectedCustomer.address],
    ['Πόλη:', selectedCustomer.city],
  ];

  // 2. ΠΡΟΣΘΗΚΗ ΠΑΡΑΤΗΡΗΣΕΩΝ ΜΕΤΑ ΤΗΝ ΠΟΛΗ (Μόνο αν υπάρχουν)
  if (notes && notes.trim() !== '') {
    data.push(['']); // Κενή γραμμή για ανάσα
    data.push(['ΠΑΡΑΤΗΡΗΣΕΙΣ:']);
    data.push([notes.toUpperCase()]); // Κεφαλαία για να ξεχωρίζουν
  }

  // 3. Επικεφαλίδες Προϊόντων
  data.push(
    [''], 
    ['ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ'],
    ['ΚΩΔΙΚΟΣ', 'ΠΕΡΙΓΡΑΦΗ', 'ΠΟΣΟΤΗΤΑ', 'ΤΙΜΗ ΜΟΝΑΔΟΣ']
  );

  // 4. Προσθήκη Προϊόντων από το καλάθι
  cart.forEach(item => {
    data.push([
      item.code, 
      item.description, 
      item.quantity, 
      item.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })
    ]);
  });

  // 5. Δημιουργία Worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 6. Εφαρμογή Style (Κόκκινο/Bold) - Απαιτεί τη βιβλιοθήκη xlsx-js-style
  // Αν υπάρχουν παρατηρήσεις, θα βρίσκονται στις γραμμές 8 και 9 (κελιά A8, A9)
  if (notes && notes.trim() !== '') {
    const redBoldStyle = { font: { bold: true, color: { rgb: "FF0000" }, sz: 11 } };
    if (worksheet['A8']) worksheet['A8'].s = redBoldStyle;
    if (worksheet['A9']) worksheet['A9'].s = redBoldStyle;
  }

  // 7. Ρύθμιση Πλάτους Στηλών
  worksheet['!cols'] = [
    { wch: 20 }, // Στήλη Α
    { wch: 50 }, // Στήλη Β
    { wch: 12 }, // Στήλη Γ
    { wch: 15 }, // Στήλη Δ
  ];

  // 8. Εξαγωγή
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Order");
  XLSX.writeFile(workbook, `${selectedCustomer.name}.xlsx`);

  // 9. Καθαρισμός UI
  setCart([]);
  setNotes('');
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 3000);
};

  const submitOrder = () => {
    if (!selectedCustomer) return;
    setConfirmSubmit(true);
  };

  const executeSubmitOrder = async () => {
    setConfirmSubmit(false);
    if (!selectedCustomer) return;
    const success = await dataService.submitOrder({
      customer: selectedCustomer,
      items: cart,
      total: totalNet
    });

    if (success) {
      const newRecord: OrderRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        customerName: selectedCustomer.name,
        customerCode: selectedCustomer.code,
        customerAfm: selectedCustomer.afm,
        items: [...cart],
        totalValue: totalNet,
        notes: notes
      };
      setHistory([newRecord, ...history]);
      setCart([]);
      setNotes('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    
    const customerHistory = history.filter(order => order.customerCode === selectedCustomer.code);
    
    if (historyFilter === 'all') return customerHistory;
    const now = new Date();
    if (historyFilter === 'year') {
      return customerHistory.filter(order => new Date(order.date).getFullYear() === now.getFullYear());
    }
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return customerHistory.filter(order => new Date(order.date) >= oneMonthAgo);
  }, [history, historyFilter, selectedCustomer]);

  const exportToPDF = async () => {
    const input = document.getElementById('printable-order');
    if (!input) return;

    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const originalHeight = input.style.height;
      const originalOverflow = input.style.overflow;
      const originalWidth = input.style.width;
      const originalMaxHeight = input.style.maxHeight;
      
      input.style.width = '800px';
      const originalPosition = input.style.position;
      input.style.position = 'relative';
      input.style.height = 'auto';
      input.style.maxHeight = 'none';
      input.style.overflow = 'visible';

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const captureScale = isMobile ? 1.5 : 2;

      const canvas = await html2canvas(input, { 
        scale: captureScale, 
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-order');
          if (el) {
            el.style.width = '800px';
            el.style.height = 'auto';
            el.style.maxHeight = 'none';
            el.style.overflow = 'visible';
            el.style.position = 'relative';
            el.style.padding = '40px'; 

            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              #printable-order {
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              .text-gusto-green { color: #1e3932 !important; }
              .bg-gusto-green { background-color: #1e3932 !important; }
              .text-red-600 { color: #dc2626 !important; }
              .bg-slate-50 { background-color: #f8fafc !important; }
              .bg-slate-100 { background-color: #f1f5f9 !important; }
              .border-slate-200 { border-color: #e2e8f0 !important; }
              .text-slate-500 { color: #64748b !important; }
              .text-slate-600 { color: #475569 !important; }
              .text-slate-700 { color: #334155 !important; }
              .text-slate-800 { color: #1e293b !important; }
              .border { border-color: #e2e8f0 !important; }
              .border-b { border-bottom-color: #e2e8f0 !important; }
              .border-b-2 { border-bottom-color: #1e3932 !important; }
              .divide-slate-200 > * + * { border-color: #e2e8f0 !important; }
            `;
            clonedDoc.head.appendChild(style);

            const allElements = el.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const element = allElements[i] as HTMLElement;
              const style = window.getComputedStyle(element);
              ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
                const val = style[prop as any];
                if (val && (val.includes('color(') || val.includes('color-mix('))) {
                  (element.style as any)[prop] = 'inherit';
                }
              });
            }
          }
        }
      });

      input.style.height = originalHeight;
      input.style.overflow = originalOverflow;
      input.style.width = originalWidth;
      input.style.maxHeight = originalMaxHeight;
      input.style.position = originalPosition;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${viewingOrder?.customerCode || 'order'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setShowError('Υπήρξε ένα πρόβλημα κατά την παραγωγή του PDF. Δοκιμάστε ξανά.');
      setTimeout(() => setShowError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-order, #printable-order * {
          visibility: visible;
        }
        #printable-order {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          overflow: visible !important;
        }
        .print\\:hidden {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ====== ADMIN FUNCTIONS (ΔΙΟΡΘΩΜΕΝΑ) ======

  // Η παράμετρος showLoading=true εξασφαλίζει ότι το spinner 
  // εμφανίζεται μόνο όταν ανοίγουμε το Modal, όχι στις μικροαλλαγές.
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
      if (err.message?.includes('JWT')) handleLogout();
    } finally {
      if (showLoading) setIsAdminLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    // 1. Άμεση ενημέρωση (Optimistic Update) για να αλλάξει ακαριαία στην οθόνη χωρίς loading
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    // 2. Ενημέρωση της βάσης στο παρασκήνιο
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    
    if (error) { 
      setShowError('Αποτυχία αλλαγής ρόλου.'); 
      setTimeout(() => setShowError(null), 3000); 
      // Αν αποτύχει, επαναφέρουμε τα δεδομένα κρυφά
      fetchAllUsers(false); 
    } else { 
      setShowSuccess(true); 
      setTimeout(() => setShowSuccess(false), 2000); 
    }
  };

  const handleDeleteUser = async (userId: string, targetRole: string) => {
    if (targetRole === 'admin') {
      setShowError('Δεν μπορείτε να διαγράψετε άλλον διαχειριστή.');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    if (userId === user.id) {
      setShowError('Δεν μπορείτε να διαγράψετε τον εαυτό σας.');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    
    //if (!window.confirm('Θα διαγραφεί το προφίλ. Ο χρήστης πρέπει να διαγραφεί χειροκίνητα και από το Auth Tab στο Supabase.')) return;
  
    // 1. Άμεση αφαίρεση από την οθόνη χωρίς loading spinner
    setAllUsers(prev => prev.filter(u => u.id !== userId));

    try {
      // 2. Διαγραφή στο παρασκήνιο
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
  
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error("FULL DELETE ERROR:", err);
      setShowError("Σφάλμα βάσης: " + err.message);
      setTimeout(() => setShowError(null), 3000);
      // Αν αποτύχει, επαναφέρουμε τον χρήστη στη λίστα κρυφά
      fetchAllUsers(false); 
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true); // Εδώ χρειαζόμαστε loading γιατί αργεί λίγο

    try {
      const supabaseUrl = (supabase as any).supabaseUrl || (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (supabase as any).supabaseKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      
      const { createClient } = await import('@supabase/supabase-js');
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data, error: authError } = await tempClient.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
      });

      if (authError && authError.status !== 422) {
        throw authError;
      }

      const userId = data?.user?.id;
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: newUserForm.email,
            role: newUserForm.role
          });

        if (profileError) throw profileError;
      }

      setShowSuccess(true);
      setNewUserForm({ email: '', password: '', role: 'customer' });
      setShowCreateUser(false);
      // Ενημερώνουμε τη λίστα χωρίς να πετάξουμε ξανά loading spinner
      await fetchAllUsers(false); 

    } catch (err: any) {
      console.error("Error creating user:", err);
      setShowError(err.message || "Αποτυχία δημιουργίας χρήστη");
    } finally {
      setIsAdminLoading(false);
      setTimeout(() => {
        setShowSuccess(false);
        setShowError(null);
      }, 3000);
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;
      setLoginError('');
    } catch (err: any) {
      setLoginError(err.message || 'Λάθος στοιχεία σύνδεσης. Δοκιμάστε ξανά.');
    } finally {
      setAuthLoading(false);
    }
  };

const handleLogout = async () => {
  try {
    // 1. Πρώτα καθαρίζουμε το state της React για να εξαφανιστούν τα δεδομένα από την οθόνη
    setUser({ id: '', email: '', role: 'customer', isLoggedIn: false });
    setCart([]);
    setSelectedCustomer(null);

    // 2. Έξοδος από το Supabase
    await supabase.auth.signOut();
    
    // 3. Καθαρισμός LocalStorage
    localStorage.clear(); 
    
    // 4. Αντί για reload, ανακατεύθυνση στην αρχική (ή απλά reload αν προτιμάς)
    window.location.href = window.location.origin; 
  } catch (err) {
    console.error(err);
    // Σε περίπτωση σφάλματος, εξαναγκασμός καθαρισμού και reload
    localStorage.clear();
    window.location.reload();
  }
};

  if (authLoading) {
    return (
      <div className="order-page-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gusto-gold"></div>
      </div>
    );
  }

  if (!user.isLoggedIn) {
    return (
      <div className="order-page-bg flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md border-4 border-gusto-gold/20"
        >
          <div className="text-center mb-8">
            <img 
              src="https://gustoraro.gr/wp-content/uploads/2023/09/gustoraro.jpg" 
              className="w-24 mx-auto mb-4 rounded-2xl shadow-lg border-2 border-slate-50" 
              alt="Gusto Raro Logo" 
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-black text-gusto-green tracking-tight">B2B PORTAL</h1>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Σύνδεση Πωλητή</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
                <input 
                  type="email"
                  required
                  className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-gusto-gold focus:ring-0 transition-all outline-none font-bold text-slate-700"
                  placeholder="π.χ. user@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-gusto-gold focus:ring-0 transition-all outline-none font-bold text-slate-700"
                  placeholder="••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gusto-gold transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100"
              >
                {loginError}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-gusto-green text-white font-black py-5 rounded-2xl shadow-xl shadow-gusto-green/20 hover:bg-gusto-green-light hover:scale-[1.02] active:scale-[0.98] transition-all text-lg mt-4 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogOut className="rotate-180" size={20} />
                  ΕΙΣΟΔΟΣ
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-300 mt-8 font-medium uppercase tracking-tighter">
            © 2026 GUSTO RARO - POWERED BY SOFT1 ERP
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="order-page-bg font-sans pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://gustoraro.gr/wp-content/uploads/2023/09/gustoraro.jpg" 
              className="w-10 h-10 rounded shadow-sm" 
              alt="Logo" 
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gusto-green leading-tight">GUSTO RARO</h1>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-widest">
                <UserIcon size={10} className="text-black" /> {user.email} ({user.role})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoading && <span className="text-xs bg-gusto-gold/20 text-gusto-green px-2 py-1 rounded animate-pulse font-medium">Φόρτωση...</span>}
  
            {user.role === 'admin' && (
              <button 
                onClick={() => { setShowAdminModal(true); fetchAllUsers(true); }}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Ρυθμίσεις Διαχειριστή"
              >
                <Settings size={20} />
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Έξοδος"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {!selectedCustomer ? (
          /* Customer Selection */
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gusto-green p-6 text-white text-center">
                <h2 className="text-xl font-bold">Αναζήτηση Πελάτη</h2>
                <p className="text-gusto-gold/80 text-sm mt-1">Επιλέξτε πελάτη για να ξεκινήσετε την παραγγελία</p>
              </div>
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Όνομα, ΑΦΜ, Κωδικός ή Πόλη..."
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-gusto-gold focus:ring-0 transition-all text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="mt-4 max-h-[450px] overflow-y-auto customer-scroll space-y-2">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="w-10 h-10 border-4 border-gusto-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500 font-medium">Φόρτωση πελατών...</p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-red-600 font-bold">⚠️ Δεν βρέθηκαν δεδομένα πελατών.</p>
                      <p className="text-xs text-red-500 mt-1">Ελέγξτε αν το αρχείο public/data/customers.json είναι σωστό.</p>
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map(cust => (
                      <button 
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className="w-full text-left p-4 rounded-xl bg-white hover:bg-gusto-gold/5 border border-slate-100 hover:border-gusto-gold/30 transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-bold text-gusto-green uppercase truncate group-hover:text-gusto-green-light transition-colors">{cust.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Κωδ: {cust.code}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">ΑΦΜ: {cust.afm}</span>
                            <span className="text-[10px] font-bold text-gusto-gold uppercase">{cust.city}</span>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-gusto-gold transition-transform group-hover:translate-x-1" size={20} />
                      </button>
                    ))
                  ) : searchTerm.length > 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Search size={48} className="mx-auto mb-3 opacity-10" />
                      <p className="font-medium">Δεν βρέθηκαν αποτελέσματα για "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 italic">
                      <p>Ξεκινήστε να πληκτρολογείτε για αναζήτηση...</p>
                      <p className="text-[10px] mt-2 uppercase tracking-widest opacity-60">Σύνολο αρχείου: {customers.length} πελάτες</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Order Interface */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Brands & Info */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">ΠΕΛΑΤΗΣ</h3>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    ΑΛΛΑΓΗ
                  </button>
                </div>
                <div className="p-3 bg-gusto-green/5 rounded-xl border border-gusto-green/10">
                  <p className="font-bold text-gusto-green text-sm uppercase">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">ΑΦΜ: {selectedCustomer.afm}</p>
                  <p className="text-[10px] text-slate-600 mt-2">{selectedCustomer.address}</p>
                  <p className="text-[10px] text-slate-600">{selectedCustomer.city}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-800 p-3 text-white text-xs font-bold tracking-wider">
                  ΕΤΑΙΡΙΕΣ
                </div>
                
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Αναζήτηση εταιρίας..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gusto-green/30 focus:border-gusto-green/30"
                    />
                    {brandSearch && (
                      <button 
                        onClick={() => setBrandSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {allBrands
  .filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
  .map(brand => (
    <button 
      key={brand.name}
      onClick={() => setSelectedBrand(brand.name)}
      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 ${
        selectedBrand === brand.name 
          ? 'bg-gusto-green text-white shadow-sm font-semibold' 
          : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100'
      }`}
    >
      {/* Container για το Logo */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-white border ${
        selectedBrand === brand.name ? 'border-white/20' : 'border-slate-100'
      }`}>
        {brand.logo_url ? (
          <img 
            src={brand.logo_url} 
            alt={brand.name} 
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              // Αν η εικόνα λείπει, δείξε το πρώτο γράμμα
              e.currentTarget.style.display = 'none';
              const span = document.createElement('span');
              span.className = "text-xs font-bold text-slate-400";
              span.innerText = brand.name.charAt(0);
              e.currentTarget.parentElement?.appendChild(span);
            }}
          />
        ) : (
          <span className={`text-xs font-bold ${selectedBrand === brand.name ? 'text-white' : 'text-slate-400'}`}>
            {brand.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <span className="truncate flex-1">{brand.name}</span>
      
      {selectedBrand === brand.name && (
        <div className="w-1.5 h-1.5 rounded-full bg-gusto-gold animate-pulse" />
      )}
    </button>
  ))}
                  
                  {allBrands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Building2 size={24} className="mb-2 opacity-20" />
                      <p className="text-[10px] italic">Δεν βρέθηκαν εταιρίες</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Product List */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('order')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'order' ? 'bg-gusto-green text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                >
                  <Package size={18} /> ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ
                </button>
                {false && (
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-gusto-green text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                >
                  <History size={18} /> ΙΣΤΟΡΙΚΟ
                </button>
                )}
              </div>

              {activeTab === 'order' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-bottom border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Αναζήτηση προϊόντος..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-gusto-gold outline-none"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  
<div className="w-full overflow-hidden"> {/* Αλλαγή από overflow-x-auto σε overflow-hidden */}
  <table className="w-full text-left border-collapse table-fixed"> {/* Προσθήκη table-fixed */}
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
  <tr>
    <th className="px-4 py-3 w-[50%]">Προϊον</th>
    <th className="px-4 py-3 text-right w-[20%]">Τιμη</th>
    <th className="px-4 py-3 text-right w-[30%]">Ποσοτητα</th>
  </tr>
</thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((prod, index) => (
  <ProductRow 
    key={prod.code}
    product={prod} 
    currentQty={cart.find(item => item.code === prod.code)?.quantity || 0}
    onUpdateQty={updateCartQuantity} 
    onImageClick={setViewingProduct}
  />
))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800">Πρόσφατες Παραγγελίες</h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setHistoryFilter('month')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${historyFilter === 'month' ? 'bg-white text-gusto-green shadow-sm' : 'text-slate-500'}`}
                      >
                        ΤΕΛ. ΜΗΝΑΣ
                      </button>
                      <button 
                        onClick={() => setHistoryFilter('year')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${historyFilter === 'year' ? 'bg-white text-gusto-green shadow-sm' : 'text-slate-500'}`}
                      >
                        ΕΤΟΣ
                      </button>
                      <button 
                        onClick={() => setHistoryFilter('all')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${historyFilter === 'all' ? 'bg-white text-gusto-green shadow-sm' : 'text-slate-500'}`}
                      >
                        ΟΛΕΣ
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {filteredHistory.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-gusto-gold/30 transition-colors cursor-pointer group" onClick={() => setViewingOrder(order)}>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">{new Date(order.date).toLocaleString('el-GR')}</p>
                        <p className="font-bold text-gusto-green text-sm">{order.customerName}</p>
                        <p className="text-[10px] text-slate-400">ID: {order.id} | ΑΦΜ: {order.customerAfm || '-'}</p>
                        {order.notes && (
                          <p className="text-[10px] text-slate-500 mt-1 italic truncate max-w-[200px]">Σημείωση: {order.notes}</p>
                        )}
                      </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-bold text-red-600">{order.totalValue.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</p>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ΑΠΕΣΤΑΛΗ</span>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-gusto-gold transition-transform" size={18} />
                        </div>
                      </div>
                    ))}
                    {filteredHistory.length === 0 && (
                      <div className="text-center py-12 text-slate-400 italic">
                        <History size={48} className="mx-auto mb-3 opacity-10" />
                        <p>Δεν βρέθηκαν παραγγελίες για την επιλεγμένη περίοδο</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cart (Desktop) / Drawer (Mobile) */}
            {activeTab === 'order' && (
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-20">
                  <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={18} className="text-gusto-gold" />
                      <span className="font-bold text-sm">ΚΑΛΑΘΙ</span>
                    </div>
                    <span className="bg-gusto-gold text-gusto-green text-[10px] font-black px-2 py-0.5 rounded-full">{cart.length} ΕΙΔΗ</span>
                  </div>
                  
                  <div className="p-0 max-h-[400px] overflow-y-auto customer-scroll">
                    {cart.map(item => (
                      <div key={item.code} className="p-3 border-b border-slate-50 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center flex-1 min-w-0 pr-2">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.description} 
                              className="w-12 h-12 rounded-lg object-cover shadow-sm border border-slate-100 mr-3 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mr-3 shrink-0">
                              <Package size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.description}</p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[9px] text-slate-500 font-mono">{item.code}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <button onClick={() => decrementQuantity(item.code)} className="p-0.5 bg-slate-100 rounded hover:bg-slate-200"><Minus size={12} /></button>
                              <p className="text-[10px] text-gusto-green font-medium">{item.quantity} x {item.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</p>
                              <button onClick={() => addToCart(item, 1)} className="p-0.5 bg-slate-100 rounded hover:bg-slate-200"><Plus size={12} /></button>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.code)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="py-12 text-center text-slate-400">
                        <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs italic">Το καλάθι είναι άδειο</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-lg font-black text-gusto-green pt-2 border-t border-slate-200">
                        <span>ΣΥΝΟΛΟ:</span>
                        <span className="text-red-600">{totalNet.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ΣΗΜΕΙΩΣΕΙΣ</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          placeholder="Προσθέστε σημειώσεις για την παραγγελία..."
                          rows={3}
                        />
                      </div>
                    </div>
                    {false && (
                    <button 
                      disabled={cart.length === 0}
                      onClick={submitOrder}
                      className="w-full bg-gusto-green text-white font-black py-4 rounded-xl shadow-lg shadow-gusto-green/20 hover:bg-gusto-green-light disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      ΟΛΟΚΛΗΡΩΣΗ & ΑΠΟΣΤΟΛΗ
                    </button>
                    )}

                      <button 
                        disabled={cart.length === 0}
                        onClick={exportToExcel}
                        className="w-full mt-2 bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                            EXPORT EXCEL
                          </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[32px] z-[70] p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gusto-green">Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
              </div>
              
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.code} className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div className="flex items-center flex-1 min-w-0 pr-2">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.description} 
                          className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-100 mr-3 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mr-3 shrink-0">
                          <Package size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{item.description}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[10px] text-slate-500 font-mono">{item.code}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => decrementQuantity(item.code)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Minus size={16} /></button>
                          <p className="text-sm text-gusto-green font-bold">{item.quantity} x {item.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</p>
                          <button onClick={() => addToCart(item, 1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Plus size={16} /></button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.code)} className="text-red-500 p-2"><Trash2 size={18} /></button>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center py-12 text-slate-400 italic">Το καλάθι είναι άδειο</p>}
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl space-y-3 mb-6">
                <div className="flex justify-between font-black text-2xl text-gusto-green">
                  <span>ΣΥΝΟΛΟ:</span>
                  <span className="text-red-600">{totalNet.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ΣΗΜΕΙΩΣΕΙΣ</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                    placeholder="Προσθέστε σημειώσεις για την παραγγελία..."
                    rows={3}
                  />
                </div>
              </div>

              <button 
                disabled={cart.length === 0}
                onClick={() => { submitOrder(); setIsCartOpen(false); }}
                className="w-full bg-gusto-green text-white font-black py-5 rounded-2xl shadow-xl hover:bg-gusto-green-light disabled:opacity-50 transition-all text-lg"
              >
                ΑΠΟΣΤΟΛΗ ΠΑΡΑΓΓΕΛΙΑΣ
              </button>
              <button 
  disabled={cart.length === 0}
  onClick={() => { exportToExcel(); setIsCartOpen(false); }}
  className="w-full mt-2 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
>
  <Download size={20} />
  EXPORT EXCEL
</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gusto-green/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-8 rounded-[32px] shadow-2xl text-center max-w-sm w-full relative z-10 border-4 border-gusto-gold"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-black text-gusto-green mb-2">ΕΠΙΤΥΧΙΑ!</h2>
              <p className="text-slate-600 mb-8 font-medium">Η ενέργεια ολοκληρώθηκε με επιτυχία.</p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full bg-gusto-green text-white font-bold py-4 rounded-xl hover:bg-gusto-green-light transition-all"
              >
                ΚΛΕΙΣΙΜΟ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Popup */}
      <AnimatePresence>
        {showError && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-red-600/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-8 rounded-[32px] shadow-2xl text-center max-w-sm w-full relative z-10 border-4 border-red-600"
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <X size={48} />
              </div>
              <h2 className="text-2xl font-black text-red-600 mb-2">ΣΦΑΛΜΑ!</h2>
              <p className="text-slate-600 mb-8 font-medium">{showError}</p>
              <button 
                onClick={() => setShowError(null)}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all"
              >
                ΚΛΕΙΣΙΜΟ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details / Print Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOrder(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-gusto-green p-6 text-white flex items-center justify-between print:hidden">
                <div>
                  <h2 className="text-xl font-black">ΛΕΠΤΟΜΕΡΕΙΕΣ ΠΑΡΑΓΓΕΛΙΑΣ</h2>
                  <p className="text-xs text-gusto-gold font-bold uppercase tracking-widest mt-1">ID: {viewingOrder.id}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div id="printable-order" className="p-10 overflow-y-auto flex-1 bg-white text-slate-900 border border-slate-200">
                <div className="flex justify-between items-start mb-10 border-b-2 border-gusto-green pb-6">
                  <div>
                    <img 
                      src="https://images.weserv.nl/?url=https://gustoraro.gr/wp-content/uploads/2023/09/gustoraro.jpg" 
                      className="w-24 mb-4 rounded shadow-sm" 
                      alt="Logo" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-right">
                    <h3 className="text-3xl font-black text-slate-800 uppercase mb-2">ΠΑΡΑΓΓΕΛΙΑ</h3>
                    <p className="text-sm font-bold text-slate-600">Ημερομηνία: {new Date(viewingOrder.date).toLocaleDateString('el-GR')}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="border border-slate-200 p-4 rounded-lg max-w-md">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-b pb-2">ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ</h4>
                    <p className="font-black text-gusto-green uppercase text-lg">{viewingOrder.customerName}</p>
                    <p className="text-sm text-slate-700 mt-1">Κωδικός: {viewingOrder.customerCode}</p>
                    <p className="text-sm text-slate-700">ΑΦΜ: {viewingOrder.customerAfm}</p>
                  </div>
                </div>

                {viewingOrder.notes && (
                  <div className="mb-10 border border-slate-200 p-4 rounded-lg">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-b pb-2">ΣΗΜΕΙΩΣΕΙΣ</h4>
                    <p className="text-sm text-slate-700">{viewingOrder.notes}</p>
                  </div>
                )}

                <table className="w-full mb-10 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-black text-slate-600 uppercase tracking-widest">
                      <th className="py-4 px-4 text-left border w-32">ΚΩΔΙΚΟΣ</th>
                      <th className="py-4 px-4 text-left border">ΠΕΡΙΓΡΑΦΗ</th>
                      <th className="py-4 px-4 text-center border w-20">ΠΟΣ.</th>
                      <th className="py-4 px-4 text-right border w-32">ΤΙΜΗ</th>
                      <th className="py-4 px-4 text-right border w-32">ΣΥΝΟΛΟ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewingOrder.items.map(item => (
                      <tr key={item.code} className="text-sm">
                        <td className="py-4 px-4 border font-mono text-xs">{item.code}</td>
                        <td className="py-4 px-4 border">
                          <p className="font-bold text-slate-800">{item.description}</p>
                        </td>
                        <td className="py-4 px-4 text-center font-bold border">{item.quantity}</td>
                        <td className="py-4 px-4 text-right border">{item.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</td>
                        <td className="py-4 px-4 text-right font-bold border">{(item.price * item.quantity).toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-10">
                  <div className="w-72 space-y-3 border p-4 rounded-lg bg-slate-50">
                    <div className="flex justify-between text-xl font-black text-gusto-green">
                      <span>ΣΥΝΟΛΟ:</span>
                      <span className="text-red-600">{viewingOrder.totalValue.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
                
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4 print:hidden">
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  ΚΛΕΙΣΙΜΟ
                </button>
                <button 
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className={`flex-[2] px-6 py-4 bg-gusto-green text-white font-black rounded-2xl shadow-xl shadow-gusto-green/20 hover:bg-gusto-green-light transition-all flex items-center justify-center gap-2 ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ΠΑΡΑΓΩΓΗ...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      ΛΗΨΗ PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Details Modal */}
      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingProduct(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden"
            >
              <button 
                onClick={() => setViewingProduct(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="aspect-square w-full bg-slate-100 relative">
                {viewingProduct.imageUrl ? (
                  <img 
                    src={viewingProduct.imageUrl} 
                    alt={viewingProduct.description}
                    className="w-full h-full object-contain p-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={80} />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono">
                    {viewingProduct.code}
                  </span>
                </div>
                <h2 className="text-lg font-black text-gusto-green leading-tight mb-4">
                  {viewingProduct.description}
                </h2>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ΤΙΜΗ ΜΟΝΑΔΟΣ</p>
                    <p className="text-2xl font-black text-red-600">
                      {viewingProduct.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      addToCart(viewingProduct, 1);
                      setViewingProduct(null);
                    }}
                    className="bg-gusto-green text-white font-black px-5 py-3 rounded-xl shadow-lg shadow-gusto-green/20 hover:bg-gusto-green-light transition-all flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} /> ΠΡΟΣΘΗΚΗ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {confirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h2 className="text-lg font-bold mb-4">Επιβεβαίωση Παραγγελίας</h2>
              <p className="text-slate-600 mb-6">Είστε σίγουροι ότι θέλετε να υποβάλετε την παραγγελία;</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmSubmit(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={() => { executeSubmitOrder(); setIsCartOpen(false); }}
                  className="flex-1 px-4 py-2 rounded-xl bg-gusto-green text-white font-bold hover:bg-gusto-green-light"
                >
                  Υποβολή
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Admin Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[150] p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="text-gusto-gold" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Διαχείριση Χρηστών</h2>
                  <button 
                    onClick={() => setShowCreateUser(!showCreateUser)}
                    className="ml-4 flex items-center gap-1 text-xs font-bold bg-gusto-green/20 text-gusto-gold px-3 py-1.5 rounded-full hover:bg-gusto-green/40 transition-colors border border-gusto-gold/30"
                  >
                    <Plus size={14} className={showCreateUser ? "rotate-45 transition-transform" : "transition-transform"} /> 
                    {showCreateUser ? 'ΑΚΥΡΩΣΗ' : 'ΝΕΟΣ ΧΡΗΣΤΗΣ'}
                  </button>
                </div>
                <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                
                {/* Φόρμα Δημιουργίας Νέου Χρήστη */}
                <AnimatePresence>
                  {showCreateUser && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                      onSubmit={handleCreateUser} 
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <h3 className="text-sm font-black text-slate-700 mb-3 uppercase tracking-widest">ΣΤΟΙΧΕΙΑ ΝΕΟΥ ΧΡΗΣΤΗ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="email"
                            placeholder="Email / Username"
                            required
                            value={newUserForm.email}
                            onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gusto-gold font-bold text-slate-700"
                          />
                          <input
                            type="password"
                            placeholder="Κωδικός"
                            required
                            minLength={6}
                            value={newUserForm.password}
                            onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gusto-gold font-bold text-slate-700"
                          />
                          <div className="flex gap-2">
                            <select
                              value={newUserForm.role}
                              onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gusto-gold font-bold text-slate-700 bg-white"
                            >
                              <option value="customer">Πελάτης</option>
                              <option value="seller">Πωλητής</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button 
                              type="submit" 
                              disabled={isAdminLoading}
                              className="bg-gusto-green text-white px-4 rounded-lg font-bold text-sm hover:bg-gusto-green-light transition-colors disabled:opacity-50"
                            >
                              ΑΠΟΘΗΚΕΥΣΗ
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {isAdminLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gusto-gold"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-100">
                          <th className="px-4 py-3">EMAIL / USERNAME</th>
                          <th className="px-4 py-3">ΡΟΛΟΣ</th>
                          <th className="px-4 py-3 text-right">ΕΝΕΡΓΕΙΕΣ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {allUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 font-bold text-slate-700">{u.email}</td>
                            <td className="px-4 py-4">
                              <select 
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-gusto-gold outline-none"
                              >
                                <option value="customer">Πελάτης</option>
                                <option value="seller">Πωλητής</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {/* Έλεγχος Ασφαλείας: Δεν μπορούμε να διαγράψουμε admin ή τον εαυτό μας */}
                              {u.role !== 'admin' && u.id !== user.id ? (
                                <button 
                                  onClick={() => handleDeleteUser(u.id, u.role)}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Διαγραφή Χρήστη"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold px-2 bg-slate-100 rounded-md py-1">ΜΗ ΔΙΑΓΡΑΨΙΜΟΣ</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  currentQty: number;
  onUpdateQty: (p: Product, q: number) => void;
  onImageClick: (p: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ 
  product, 
  currentQty, 
  onUpdateQty, 
  onImageClick 
}) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      {/* 1. Εικόνα και Όνομα Προϊόντος */}
      <td className="px-4 py-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Container Εικόνας - Το flex-shrink-0 είναι απαραίτητο */}
          <div 
            className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer border border-slate-200"
            onClick={() => onImageClick(product)}
          >
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt="" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Package className="w-6 h-6 text-slate-400" />
            )}
          </div>

          {/* Κείμενο (Όνομα και Κωδικός) */}
          <div className="min-w-0 flex-1">
            <div 
              className="font-black text-slate-800 text-[11px] uppercase truncate block" 
              title={product.description}
            >
              {product.description}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono truncate">
                {product.code}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* 2. Τιμή */}
      <td className="px-4 py-4 text-right">
        <div className="font-black text-gusto-green text-sm whitespace-nowrap">
          {product.price.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' })}
        </div>
      </td>

      {/* 3. Έλεγχος Ποσότητας (- 0 +) */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 flex-nowrap w-fit">
            <button 
              type="button"
              onClick={() => onUpdateQty(product, Math.max(0, currentQty - 1))} 
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white rounded-md transition-all font-bold"
            >
              <Minus size={16} />
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
              <Plus size={16} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};