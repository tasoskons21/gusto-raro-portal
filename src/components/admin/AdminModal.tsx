import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Plus, Mail, Lock, Settings, Eye, EyeOff, Pencil, Check, Building2, Trash2, Search, Package } from 'lucide-react';
import { Profile, Brand, Product, Customer } from '../../types';

interface AdminModalProps {
  show: boolean;
  onClose: () => void;
  // Users
  users: Profile[];
  onAddUser: (e: React.FormEvent) => void;
  onDeleteUser: (userId: string, role: string) => void;
  newUser: any;
  setNewUser: (user: any) => void;
  customers: Customer[];
  // Brands
  allBrands: Brand[];
  newBrandForm: { name: string; logo: string };
  setNewBrandForm: (form: any) => void;
  onAddBrand: (e: React.FormEvent) => void;
  onDeleteBrand: (id: string) => void;
  // Products
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
  // Common
  isLoading: boolean;
  status: { msg: string, type: 'success' | 'error' } | null;
  currentUser: { id: string };
}

export const AdminModal: React.FC<AdminModalProps> = ({
  show,
  onClose,
  users,
  onAddUser,
  onDeleteUser,
  newUser,
  setNewUser,
  customers,
  allBrands,
  newBrandForm,
  setNewBrandForm,
  onAddBrand,
  onDeleteBrand,
  products,
  newProductForm,
  setNewProductForm,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  searchCode,
  setSearchCode,
  onSearchProduct,
  adminSearchResults,
  setAdminSearchResults,
  editingProduct,
  setEditingProduct,
  editForm,
  setEditForm,
  isLoading,
  status,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = React.useState<'users' | 'brands' | 'products'>('users');
  const [showCreateUser, setShowCreateUser] = React.useState(false);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150] p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* --- HEADER & TABS --- */}
        <div className="bg-slate-800 p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="text-gusto-gold" size={24} />
              <h2 className="text-xl font-black uppercase tracking-tight">Admin Dashboard</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-4 border-b border-white/10">
            {[
              { id: 'users', label: 'ΧΡΗΣΤΕΣ' },
              { id: 'brands', label: 'BRANDS' },
              { id: 'products', label: 'ΠΡΟΪΟΝΤΑ' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 px-1 text-xs font-black tracking-widest transition-colors ${activeTab === tab.id ? 'text-gusto-gold border-b-2 border-gusto-gold' : 'text-slate-400 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white customer-scroll">
          {/* --- STATUS MESSAGES --- */}
          {status && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${status.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{status.msg}</span>
            </div>
          )}

          {/* --- TAB 1: ΧΡΗΣΤΕΣ --- */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 uppercase italic">Διαχείριση Χρηστών</h3>
                <button
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="flex items-center gap-2 text-xs font-black bg-slate-800 text-gusto-gold px-5 py-2.5 rounded-full hover:bg-slate-700 transition-all border border-gusto-gold/30 shadow-lg active:scale-95"
                >
                  <Plus size={16} className={`${showCreateUser ? "rotate-45" : "rotate-0"} transition-transform duration-300`} />
                  {showCreateUser ? 'ΑΚΥΡΩΣΗ' : 'ΝΕΟΣ ΧΡΗΣΤΗΣ'}
                </button>
              </div>

              <AnimatePresence>
                {showCreateUser && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
                    <form onSubmit={(e) => { onAddUser(e); setShowCreateUser(false); }} className="p-6 bg-slate-50 border border-slate-200 rounded-[24px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <input required placeholder="EMAIL" type="email" value={newUser.email || ''} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="px-4 py-3 border rounded-xl text-sm font-bold outline-none focus:border-gusto-gold bg-white" />
                      <input required placeholder="PASSWORD" type="password" value={newUser.password || ''} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="px-4 py-3 border rounded-xl text-sm font-bold outline-none focus:border-gusto-gold bg-white" />
                      <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })} className="px-4 py-3 border rounded-xl text-sm font-bold bg-white outline-none focus:border-gusto-gold">
                        <option value="customer">Πελάτης</option>
                        <option value="seller">Πωλητής</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="submit" className="bg-gusto-green text-white h-[46px] rounded-xl font-black text-xs hover:bg-gusto-green-light transition-all uppercase tracking-widest">ΔΗΜΙΟΥΡΓΙΑ</button>
                      {newUser.role === 'customer' && (
                        <div className="md:col-span-2 lg:col-span-4 animate-in slide-in-from-top-2">
                          <select required value={newUser.customerId || ''} onChange={e => setNewUser({ ...newUser, customerId: e.target.value })} className="w-full px-4 py-3 border border-blue-200 rounded-xl text-sm font-bold bg-blue-50 outline-none focus:border-blue-400">
                            <option value="">Επιλέξτε Κατάστημα...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
                          </select>
                        </div>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">EMAIL</th>
                      <th className="px-6 py-4">ΡΟΛΟΣ</th>
                      <th className="px-6 py-4 text-right">ΕΝΕΡΓΕΙΕΣ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users?.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600 border border-slate-200">{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.id !== currentUser.id && (
                            <button onClick={() => onDeleteUser(u.id, u.role)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
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
            <div className="animate-in fade-in duration-300">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 mb-8">
                <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-widest">Προσθήκη Brand (Μόνο Κεφαλαία)</h3>
                <form onSubmit={onAddBrand} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    required
                    placeholder="ΟΝΟΜΑ BRAND *"
                    className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold uppercase"
                    value={newBrandForm.name || ''}
                    onChange={e => setNewBrandForm({ ...newBrandForm, name: e.target.value.toUpperCase() })}
                  />
                  <input
                    placeholder="URL ΛΟΓΟΤΥΠΟΥ"
                    className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold"
                    value={newBrandForm.logo || ''}
                    onChange={e => setNewBrandForm({ ...newBrandForm, logo: e.target.value })}
                  />
                  <button type="submit" disabled={isLoading} className="bg-gusto-green text-white px-6 py-3 rounded-xl font-black hover:bg-gusto-green-light transition-all uppercase tracking-widest disabled:opacity-50">
                    {isLoading ? '...' : 'ΠΡΟΣΘΗΚΗ'}
                  </button>
                </form>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">LOGOTYPE</th>
                      <th className="px-6 py-4">ΟΝΟΜΑ BRAND</th>
                      <th className="px-6 py-4 text-right">ΕΝΕΡΓΕΙΕΣ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allBrands?.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3">
                          {b.logo_url ? <img src={b.logo_url} className="h-8 w-8 object-contain rounded" alt="" /> : <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">N/A</div>}
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-700 uppercase">{b.name}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => onDeleteBrand(b.id || (b as any).ID)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 3: ΠΡΟΪΟΝΤΑ --- */}
          {activeTab === 'products' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 mb-8">
                <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-widest">Νέο Προϊόν (Μόνο Κεφαλαία)</h3>
                <form onSubmit={onAddProduct}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <input required placeholder="ΚΩΔΙΚΟΣ *" className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold uppercase" value={newProductForm.code || ''} onChange={e => setNewProductForm({ ...newProductForm, code: e.target.value.toUpperCase() })} />
                    <input required placeholder="ΠΕΡΙΓΡΑΦΗ *" className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold uppercase" value={newProductForm.description || ''} onChange={e => setNewProductForm({ ...newProductForm, description: e.target.value.toUpperCase() })} />
                    <select required className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold bg-white" value={newProductForm.brand || ''} onChange={e => setNewProductForm({ ...newProductForm, brand: e.target.value })}>
                      <option value="">ΕΠΙΛΟΓΗ BRAND *</option>
                      {allBrands?.map(b => <option key={b.id || (b as any).ID} value={b.name}>{b.name}</option>)}
                    </select>
                    <input required placeholder="ΤΙΜΗ *" type="number" step="0.01" className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold" value={newProductForm.price || ''} onChange={e => setNewProductForm({ ...newProductForm, price: e.target.value })} />
                    <input placeholder="URL ΕΙΚΟΝΑΣ" className="px-4 py-3 border rounded-xl font-bold text-slate-700 outline-none focus:border-gusto-gold md:col-span-2" value={newProductForm.imageUrl || ''} onChange={e => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 text-gusto-gold py-4 rounded-xl font-black hover:bg-slate-700 transition-all uppercase tracking-widest border border-gusto-gold/30">ΑΠΟΘΗΚΕΥΣΗ ΠΡΟΪΟΝΤΟΣ</button>
                </form>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                  <input type="text" placeholder="ΑΝΑΖΗΤΗΣΗ ΜΕ ΚΩΔΙΚΟ (ENTER)..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 focus:ring-2 focus:ring-gusto-gold uppercase" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && onSearchProduct()} />
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={onSearchProduct} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-700 transition-all text-xs uppercase">ΑΝΑΖΗΤΗΣΗ</button>
                  <button onClick={() => { setSearchCode(''); setAdminSearchResults([]); }} className="bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-black hover:bg-slate-300 transition-all text-xs uppercase">ΚΑΘΑΡΙΣΜΟΣ</button>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">IMG</th>
                      <th className="px-6 py-4">ΚΩΔΙΚΟΣ</th>
                      <th className="px-6 py-4">ΠΕΡΙΓΡΑΦΗ</th>
                      <th className="px-6 py-4 text-right">ΤΙΜΗ</th>
                      <th className="px-6 py-4 text-right">ΕΝΕΡΓΕΙΕΣ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {adminSearchResults.map((p, idx) => {
                      const pCode = p.code || (p as any).Code;
                      const isEditing = editingProduct === pCode;

                      return (
                        <tr key={pCode + idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            {isEditing ? (
                              <input className="border rounded px-2 py-1 text-[10px] w-20" value={editForm.imageUrl} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="URL" />
                            ) : (
                              <img src={p.imageUrl || (p as any).ImageUrl || (p as any).imageurl || 'https://via.placeholder.com/40'} className="w-10 h-10 object-contain rounded-lg border border-slate-100" />
                            )}
                          </td>
                          <td className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-tighter">{pCode}</td>
                          <td className="px-6 py-3 text-[11px] font-bold text-slate-700 uppercase">
                            {isEditing ? (
                              <input className="border rounded px-2 py-1 w-full uppercase" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value.toUpperCase() })} />
                            ) : (p.description || (p as any).Description)}
                          </td>
                          <td className="px-6 py-3 text-[11px] text-right font-black text-slate-900">
                            {isEditing ? (
                              <input type="number" step="0.01" className="border rounded px-2 py-1 w-20 text-right" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                            ) : `${Number(p.price || (p as any).Price || 0).toFixed(2)}€`}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => onUpdateProduct(pCode)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                                  <button onClick={() => setEditingProduct(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={16} /></button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingProduct(pCode);
                                      setEditForm({
                                        description: p.description || (p as any).Description,
                                        price: p.price || (p as any).Price,
                                        imageUrl: p.imageUrl || (p as any).ImageUrl || (p as any).imageurl || ''
                                      });
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button onClick={() => onDeleteProduct(pCode)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
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
