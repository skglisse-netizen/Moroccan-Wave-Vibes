import React, { useState, useEffect } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit2, Trash2, Check, X, RefreshCcw, CreditCard, 
  AlertTriangle, History, ArrowRightLeft, TrendingUp, TrendingDown,
  Calendar, Clock, DollarSign
} from 'lucide-react';
import {
  User, DebtLoan, DebtPayment
} from '../../types';
import { Button, Input, Select, Card, Pagination, Modal } from './UIComponents';

const ITEMS_PER_PAGE = 10;

function hasPermission(user: User, codename: string): boolean {
  if (!user) return false;
  if (user.role === 'administrateur') return true;
  return user.permissions?.includes(codename) ?? false;
}

export function DebtsLoansView({ debtsLoans, onUpdate, user }: { debtsLoans: DebtLoan[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtLoan | null>(null);
  const [selectedItem, setSelectedItem] = useState<DebtLoan | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    type: 'debt', 
    person: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    due_date: '',
    status: 'pending' 
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });

  const filteredItems = (debtsLoans || []).filter(item => {
    const matchesSearch = (item.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (item.person || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedData = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Summary stats
  const totalDebts = (debtsLoans || []).filter(i => i.type === 'debt').reduce((acc, i) => acc + i.amount, 0);
  const totalLoans = (debtsLoans || []).filter(i => i.type === 'loan').reduce((acc, i) => acc + i.amount, 0);
  const pendingDebts = (debtsLoans || []).filter(i => i.type === 'debt' && i.status === 'pending').reduce((acc, i) => acc + (i.amount - (i.paid_amount || 0)), 0);
  const pendingLoans = (debtsLoans || []).filter(i => i.type === 'loan' && i.status === 'pending').reduce((acc, i) => acc + (i.amount - (i.paid_amount || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/debts_loans/${editingItem.id}` : '/api/debts_loans';
    const method = editingItem ? 'PUT' : 'POST';
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (res.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData({ 
          description: '', 
          amount: '', 
          type: 'debt', 
          person: '', 
          date: format(new Date(), 'yyyy-MM-dd'), 
          due_date: '',
          status: 'pending' 
        });
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet élément ? Cela supprimera également les écritures financières liées.')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/debts_loans/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/debts_loans/${selectedItem.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(paymentData),
        credentials: 'include'
      });
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentData({
          amount: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          note: ''
        });
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const fetchPaymentHistory = async (id: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/debts_loans/${id}/payments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        setPaymentHistory(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const deletePayment = async (debtId: number, paymentId: number) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/debts_loans/${debtId}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        fetchPaymentHistory(debtId);
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const isOverdue = (item: DebtLoan) => {
    if (item.status === 'paid' || !item.due_date) return false;
    const date = new Date(item.due_date);
    return isPast(date) && !isToday(date);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-rose-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dettes</p>
            <h3 className="text-xl font-black text-slate-900">{totalDebts.toLocaleString()} DH</h3>
            <p className="text-[9px] font-bold text-rose-500">Reste à payer: {pendingDebts.toLocaleString()} DH</p>
          </div>
        </Card>
        <Card className="p-4 bg-white border-emerald-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Prêts</p>
            <h3 className="text-xl font-black text-slate-900">{totalLoans.toLocaleString()} DH</h3>
            <p className="text-[9px] font-bold text-emerald-500">Reste à percevoir: {pendingLoans.toLocaleString()} DH</p>
          </div>
        </Card>
        <Card className="p-4 bg-white border-amber-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Retard</p>
            <h3 className="text-xl font-black text-amber-600">
               {debtsLoans.filter(i => isOverdue(i)).length} Élément(s)
            </h3>
            <p className="text-[9px] font-bold text-slate-400 tracking-tight">Vérifiez les dates d'échéance</p>
          </div>
        </Card>
        <div className="flex items-center justify-center">
          {hasPermission(user, 'add_debts') && (
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ description: '', amount: '', type: 'debt', person: '', date: format(new Date(), 'yyyy-MM-dd'), due_date: '', status: 'pending' });
                setShowModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-6 rounded-3xl border-2 border-dashed border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-black uppercase tracking-widest"
            >
              <Plus size={20} /> Ajouter Nouveau
            </button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[80vh] scrollbar-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date / Échéance</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Description / Personne</span>
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Type</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Tous</option>
                      <option value="debt">Dette</option>
                      <option value="loan">Prêt</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Montant Payé</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData?.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-all ${isOverdue(item) ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                        <Calendar size={12} className="text-slate-400" />
                        {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                      </div>
                      {item.due_date && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue(item) ? 'text-rose-600' : 'text-slate-400'}`}>
                          <Clock size={12} />
                          Échéance: {format(new Date(item.due_date), 'dd/MM/yyyy')}
                          {isOverdue(item) && <AlertTriangle size={10} className="animate-pulse" />}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.description}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{item.person}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${item.type === 'loan' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                      {item.type === 'loan' ? 'Prêt' : 'Dette'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-900">
                          <span>{(item.paid_amount || 0).toLocaleString()} DH</span>
                          <span className="text-slate-400 text-[10px] font-bold">/ {item.amount.toLocaleString()} DH</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${item.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(100, ((item.paid_amount || 0) / item.amount) * 100)}%` }}
                          />
                        </div>
                     </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : isOverdue(item) ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                      {item.status === 'paid' ? 'Payé' : isOverdue(item) ? 'En Retard' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status !== 'paid' && hasPermission(user, 'change_debts') && (
                        <button 
                          onClick={() => { setSelectedItem(item); setPaymentData({ amount: (item.amount - (item.paid_amount || 0)).toString(), date: format(new Date(), 'yyyy-MM-dd'), note: '' }); setShowPaymentModal(true); }} 
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Effectuer un paiement"
                        >
                          <CreditCard size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedItem(item); fetchPaymentHistory(item.id); setShowHistoryModal(true); }} 
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Historique des paiements"
                      >
                        <History size={14} />
                      </button>
                      {hasPermission(user, 'change_debts') && (
                        <button onClick={() => { setEditingItem(item); setFormData({ description: item.description, amount: item.amount.toString(), type: item.type, person: item.person, date: item.date, due_date: item.due_date || '', status: item.status }); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {hasPermission(user, 'delete_debts') && (
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editingItem ? "Modifier" : "Nouvelle Dette / Prêt"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Input label="Description" value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} required />
               <Input label="Personne / Entité" value={formData.person} onChange={(e: any) => setFormData({ ...formData, person: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Input label="Montant Total" type="number" value={formData.amount} onChange={(e: any) => setFormData({ ...formData, amount: e.target.value })} required />
               <Input label="Date" type="date" value={formData.date} onChange={(e: any) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'debt', label: 'Dette (Je dois)' },
                  { value: 'loan', label: 'Prêt (On me doit)' }
                ]}
              />
              <Input label="Date d'échéance" type="date" value={formData.due_date} onChange={(e: any) => setFormData({ ...formData, due_date: e.target.value })} />
            </div>
            <Select
              label="Statut"
              value={formData.status}
              onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'pending', label: 'En attente' },
                { value: 'paid', label: 'Payé (Complet)' }
              ]}
            />
            <Button type="submit" className="w-full py-3" variant="primary">Enregistrer</Button>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedItem && (
        <Modal title={`Enregistrer un paiement pour: ${selectedItem.description}`} onClose={() => setShowPaymentModal(false)}>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 font-bold uppercase">Reste à payer</span>
                <span className="text-slate-900 font-black">{(selectedItem.amount - (selectedItem.paid_amount || 0)).toLocaleString()} DH</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500"
                  style={{ width: `${((selectedItem.paid_amount || 0) / selectedItem.amount) * 100}%` }}
                />
              </div>
            </div>

            <Input 
              label="Montant du versement" 
              type="number" 
              value={paymentData.amount} 
              onChange={(e: any) => setPaymentData({ ...paymentData, amount: e.target.value })} 
              required 
              max={selectedItem.amount - (selectedItem.paid_amount || 0)}
            />
            <Input label="Date du versement" type="date" value={paymentData.date} onChange={(e: any) => setPaymentData({ ...paymentData, date: e.target.value })} required />
            <Input label="Note / Commentaire" value={paymentData.note} onChange={(e: any) => setPaymentData({ ...paymentData, note: e.target.value })} placeholder="Ex: Virement bancaire, Espèces..." />
            
            <Button type="submit" className="w-full py-3" variant="primary">Valider le versement</Button>
          </form>
        </Modal>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedItem && (
        <Modal title={`Historique: ${selectedItem.description}`} onClose={() => setShowHistoryModal(false)}>
          <div className="space-y-4">
             {paymentHistory.length === 0 ? (
               <div className="text-center py-8 text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Aucun versement enregistré</p>
               </div>
             ) : (
               <div className="space-y-2">
                 {paymentHistory.map((p) => (
                   <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">{p.amount.toLocaleString()} DH</span>
                        <span className="text-[10px] text-slate-400 font-bold">{format(new Date(p.date), 'dd/MM/yyyy')}</span>
                        {p.note && <span className="text-[10px] text-indigo-500 font-medium">{p.note}</span>}
                     </div>
                     <button 
                        onClick={() => deletePayment(selectedItem.id, p.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                       <Trash2 size={12} />
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </Modal>
      )}
    </div>
  );
}

