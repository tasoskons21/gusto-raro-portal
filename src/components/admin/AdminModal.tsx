import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, Plus, Trash2, Pencil, Check, Search, 
  Users as UsersIcon, Building2, Package, Mail, Lock, 
  AlertCircle, CheckCircle2, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { Profile, Brand, Product, Customer } from '../../types';

interface AdminModalProps {
  show: boolean;
  onClose: () => void;
  users: Profile[];
  onAddUser: (e: React.FormEvent) => void;
  onDeleteUser: (userId: string, role: string) => void;
  newUser: any;
  setNewUser: (user: any) => void;
  customers: Customer[];
  allBrands: Brand[];
  newBrandForm: { name: string; logo: string };
  setNewBrandForm: (form: any) => void;
  onAddBrand: (e: React.FormEvent) => void;
  onDeleteBrand: (id: string) => void;
  products: Product[];
  newProductForm: any;
  setNewProductForm: (form: any) => void;
  onAddProduct: (e: React.FormEvent) => void;
  onDeleteProduct: (code: string) => void;
  onUpdateProduct: (code: string) => void;
  searchCode: string;
  setSearchCode: (code: string) => void;
  onSearchProduct: () => void;
  adminSearchResults: Product[];
  setAdminSearchResults: (results: Product[]) => void;
  editingProduct: string | null;
  setEditingProduct: (code: string | null) => void;
  editForm: any;
  setEditForm: (form: any) => void;
  isLoading: boolean;
  status: { msg: string, type: 'success' | 'error' } | null;
  currentUser: { id: string };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  debounceTime?: number;
  label?: string;
  icon?: React.ReactNode;
  previewImage?: boolean;
}

const SmartInput: React.FC<SmartInputProps> = ({ 
  value, onChange, debounceTime = 300, label, icon, previewImage, className, ...props 
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, debounceTime);
  const debouncedPreviewUrl = useDebounce(localValue, 1000);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleManualSync = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
            {icon}
          </div>
        )}
        <input
          {...props}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleManualSync}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleManualSync();
            }
            props.onKeyDown?.(e);
          }}
          className={`${className} ${icon ? 'pl-11' : 'pl-4'} pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all`}
        />
        {previewImage && debouncedPreviewUrl && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
            <img 
              src={debouncedPreviewUrl || undefined}
              alt="" 
              className="max-w-full max-h-full object-contain p-1" 
              onError={(e) => {
                if (!e.currentTarget.src.includes('placeholder')) {
                  e.currentTarget.src = 'https://via.placeholder.com/32?text=ERR';
                }
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminModal: React.FC<AdminModalProps> = ({
  show, onClose, users, onAddUser, onDeleteUser, newUser, setNewUser, customers,
  allBrands, newBrandForm, setNewBrandForm, onAddBrand, onDeleteBrand,
  products, newProductForm, setNewProductForm, onAddProduct, onDeleteProduct,
  onUpdateProduct, searchCode, setSearchCode, onSearchProduct,
  adminSearchResults, setAdminSearchResults, editingProduct, setEditingProduct,
  editForm, setEditForm, isLoading, status, currentUser
}) => {
  const [activeTab, setActiveTab] = React.useState<'users' | 'brands' | 'products'>('users');
  const [showAddForm, setShowAddForm] = React.useState(false);

  if (!show) return null;

  const tabs = [
    { id: 'users', label: 'Χρήστες', icon: UsersIcon },
    { id: 'brands', label: 'Brands', icon: Building2 },
    { id: 'products', label: 'Προϊόντα', icon: Package },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150] p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="bg-white w-full max-w-6xl h-full sm:h-[90vh] sm:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
        {/* --- MODERN HEADER --- */}
        <div className="bg-white border-b border-slate-100 p-6 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Admin Panel</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Διαχείριση Πλατφόρμας</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all flex items-center justify-center">
              <X size={20} />
            </button>
          </div>

          <div className="flex p-1.5 bg-slate-50 rounded-2xl w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setShowAddForm(false); }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 customer-scroll">
          <AnimatePresence mode="wait">
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
                  status.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="text-xs font-black uppercase tracking-wider">{status.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- TAB 1: USERS --- */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Διαχείριση Χρηστών</h3>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Plus size={18} />
                  Νέος Χρήστης
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6">
                      <form onSubmit={(e) => { 
                        onAddUser(e); 
                        setShowAddForm(false); 
                      }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SmartInput 
                          label="Email"
                          required
                          type="email"
                          value={newUser.email || ''}
                          onChange={val => setNewUser({ ...newUser, email: val })}
                          icon={<Mail size={18} />}
                        />
                        <SmartInput 
                          label="Κωδικός"
                          required
                          type="password"
                          value={newUser.password || ''}
                          onChange={val => setNewUser({ ...newUser, password: val })}
                          icon={<Lock size={18} />}
                        />
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ρόλος</label>
                          <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all appearance-none">
                            <option value="customer">Πελάτης</option>
                            <option value="seller">Πωλητής</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button type="submit" className="w-full bg-slate-900 text-white h-[48px] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Δημιουργία</button>
                        </div>
                        {newUser.role === 'customer' && (
                          <div className="md:col-span-2 lg:col-span-4 pt-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Σύνδεση με Κατάστημα</label>
                            <select required value={newUser.customerId || ''} onChange={e => setNewUser({ ...newUser, customerId: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all">
                              <option value="">Επιλέξτε Κατάστημα...</option>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
                            </select>
                          </div>
                        )}
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Στοιχεία Χρήστη</th>
                      <th className="px-8 py-5">Ρόλος Πρόσβασης</th>
                      <th className="px-8 py-5 text-right">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users?.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <Mail size={18} />
                            </div>
                            <span className="font-bold text-slate-700">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 
                            u.role === 'seller' ? 'bg-blue-100 text-blue-700' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {u.id !== currentUser.id && (
                            <button onClick={() => onDeleteUser(u.id, u.role)} className="w-9 h-9 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all flex items-center justify-center ml-auto">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 2: BRANDS --- */}
          {activeTab === 'brands' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Διαχείριση Brands</h3>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Plus size={18} />
                  Νέο Brand
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6">
                      <form onSubmit={onAddBrand} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SmartInput 
                          label="Όνομα Brand"
                          required
                          placeholder="Π.Χ. GUSTO RARO"
                          value={newBrandForm.name || ''}
                          onChange={val => setNewBrandForm({ ...newBrandForm, name: val.toUpperCase() })}
                          className="uppercase"
                        />
                        <div className="flex items-end">
                          <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white h-[48px] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">
                            {isLoading ? 'Αποθήκευση...' : 'Προσθήκη'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Λογότυπο</th>
                      <th className="px-8 py-5">Όνομα Εταιρείας</th>
                      <th className="px-8 py-5 text-right">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allBrands?.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-4">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden p-2">
                            {b.logo_url ? <img src={b.logo_url} className="max-w-full max-h-full object-contain" alt="" /> : <Building2 size={20} className="text-slate-200" />}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="font-black text-slate-800 uppercase tracking-tight">{b.name}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button onClick={() => onDeleteBrand(b.id || (b as any).ID)} className="w-9 h-9 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all flex items-center justify-center ml-auto">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 3: PRODUCTS --- */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Διαχείριση Προϊόντων</h3>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Plus size={18} />
                  Νέο Προϊόν
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6">
                      <form onSubmit={onAddProduct} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <SmartInput 
                            label="Κωδικός"
                            required
                            placeholder="Π.Χ. 10-20-30"
                            value={newProductForm.code || ''}
                            onChange={val => setNewProductForm({ ...newProductForm, code: val.toUpperCase() })}
                            className="uppercase"
                          />
                          <div className="md:col-span-2">
                            <SmartInput 
                              label="Περιγραφή"
                              required
                              placeholder="ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΟΣ"
                              value={newProductForm.description || ''}
                              onChange={val => setNewProductForm({ ...newProductForm, description: val.toUpperCase() })}
                              className="uppercase"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Brand</label>
                            <select required value={newProductForm.brand || ''} onChange={e => setNewProductForm({ ...newProductForm, brand: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all">
                              <option value="">Επιλέξτε Brand...</option>
                              {allBrands?.map(b => <option key={b.id || (b as any).ID} value={b.name}>{b.name}</option>)}
                            </select>
                          </div>
                          <SmartInput 
                            label="Τιμή"
                            required
                            type="number"
                            step="0.01"
                            value={newProductForm.price || ''}
                            onChange={val => setNewProductForm({ ...newProductForm, price: val })}
                          />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Αποθήκευση Προϊόντος</button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <SmartInput 
                    placeholder="ΑΝΑΖΗΤΗΣΗ ΜΕ ΚΩΔΙΚΟ..." 
                    value={searchCode} 
                    onChange={val => setSearchCode(val.toUpperCase())} 
                    onKeyDown={(e) => e.key === 'Enter' && onSearchProduct()} 
                    icon={<Search size={20} />}
                    className="py-4 rounded-2xl shadow-sm uppercase"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={onSearchProduct} className="px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Αναζήτηση</button>
                  <button onClick={() => { setSearchCode(''); setAdminSearchResults([]); }} className="px-6 bg-white text-slate-400 hover:text-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Καθαρισμός</button>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Προϊόν</th>
                      <th className="px-8 py-5">Κωδικός</th>
                      <th className="px-8 py-5 text-right">Τιμή</th>
                      <th className="px-8 py-5 text-right">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {adminSearchResults.map((p, idx) => {
                      const pCode = p.code || (p as any).Code;
                      const isEditing = editingProduct === pCode;
                      return (
                        <tr key={pCode + idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden p-2">
                                {isEditing ? (
                                  <ImageIcon size={20} className="text-slate-200" />
                                ) : (
                                  <img src={p.imageUrl || (p as any).ImageUrl || 'https://via.placeholder.com/40'} className="max-w-full max-h-full object-contain" alt="" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                {isEditing ? (
                                  <SmartInput 
                                    className="text-sm"
                                    value={editForm.description}
                                    onChange={val => setEditForm({ ...editForm, description: val.toUpperCase() })}
                                  />
                                ) : (
                                  <span className="font-bold text-slate-800 uppercase leading-tight">{p.description || (p as any).Description}</span>
                                )}
                                
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="font-mono text-[11px] font-black text-slate-400 tracking-wider uppercase">{pCode}</span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <SmartInput 
                                  type="number"
                                  step="0.01"
                                  className="w-20 text-right"
                                  value={editForm.price}
                                  onChange={val => setEditForm({ ...editForm, price: val })}
                                />
                                <span className="font-black">€</span>
                              </div>
                            ) : (
                              <span className="font-black text-slate-900">{Number(p.price || (p as any).Price || 0).toFixed(2)}€</span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => onUpdateProduct(pCode)} className="w-9 h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all flex items-center justify-center"><Check size={18} /></button>
                                  <button onClick={() => setEditingProduct(null)} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg transition-all flex items-center justify-center"><X size={18} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => {
                                    setEditingProduct(pCode);
                                    setEditForm({
                                      description: p.description || (p as any).Description,
                                      price: (() => {
                                        const raw = p.price || (p as any).Price || 0;
                                        const normalized = String(raw).replace(',', '.');
                                        const num = Number(normalized);
                                        return isNaN(num) ? '0.00' : num.toFixed(2);
                                      })()
                                    });
                                  }} className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-lg transition-all flex items-center justify-center"><Pencil size={16} /></button>
                                  <button onClick={() => onDeleteProduct(pCode)} className="w-9 h-9 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all flex items-center justify-center"><Trash2 size={16} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
