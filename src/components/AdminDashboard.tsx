import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  History, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  MoreVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  count?: number;
}

const TabButton = ({ label, active, onClick, icon: Icon, count }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden",
      active ? "bg-aura-lime text-aura-black brutalist-shadow" : "text-aura-muted hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={18} />
    <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={cn("ml-2 px-2 py-0.5 rounded-full text-[10px] font-black", active ? "bg-aura-black text-aura-lime" : "bg-aura-lime text-aura-black")}>
        {count}
      </span>
    )}
  </button>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'investments' | 'history'>('deposits');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, invsRes] = await Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/transactions/pending').then(r => r.json()),
        fetch('/api/admin/investments').then(r => r.json())
      ]);
      
      if (Array.isArray(usersRes)) setUsers(usersRes);
      if (Array.isArray(pendingRes)) setPendingSubmissions(pendingRes);
      if (Array.isArray(invsRes)) setInvestments(invsRes);
    } catch (error) {
      console.error("Admin sync failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleAuditAction = async (id: number, action: 'approve' | 'reject') => {
    const promise = fetch(`/api/admin/transactions/${id}/${action}`, { method: 'POST' });
    
    toast.promise(promise, {
      loading: `Processing ${action}...`,
      success: () => {
        setPendingSubmissions(prev => prev.filter(tx => tx.id !== id));
        return `Transaction ${action}ed successfully`;
      },
      error: 'Failed to process audit'
    });
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-aura-lime text-xs font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <ShieldCheck size={14} /> Control Terminal Alpha
          </p>
          <h1 className="text-6xl lg:text-8xl font-black tracking-[-0.05em] leading-[0.85] text-white font-serif italic">
            Management.
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <TabButton label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} />
          <TabButton 
            label="Pending" 
            active={activeTab === 'deposits'} 
            onClick={() => setActiveTab('deposits')} 
            icon={CreditCard}
            count={pendingSubmissions.length}
          />
          <TabButton label="Nodes" active={activeTab === 'investments'} onClick={() => setActiveTab('investments')} icon={Zap} />
          <TabButton label="Audit Log" active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} />
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <Search size={18} className="text-aura-muted" />
        <input 
          type="text" 
          placeholder="SEARCH RECORDS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-base md:text-xs font-bold tracking-widest text-white w-full uppercase placeholder:text-aura-muted/30"
        />
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-aura-muted">
          <Filter size={18} />
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Activity className="animate-spin text-aura-lime" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Syncing with Mainframe...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-aura-muted">Identity</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-aura-muted">Tier</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-aura-muted">Net Liquidity</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-aura-muted text-right italic">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {users.map(user => (
                      <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black">{user.full_name?.[0] || 'U'}</div>
                            <div>
                              <p className="font-bold text-sm tracking-tight">{user.full_name}</p>
                              <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6"><span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full", user.tier === 'Elite' ? "bg-aura-lime text-aura-black" : "bg-white/10 text-white")}>{user.tier}</span></td>
                        <td className="px-8 py-6"><p className="font-serif italic font-black text-md">${(parseFloat(user.balance || 0)).toLocaleString()}</p></td>
                        <td className="px-8 py-6 text-right"><button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-aura-muted"><MoreVertical size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'deposits' && (
              <motion.div key="deposits" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 space-y-6">
                {pendingSubmissions.length === 0 ? (
                  <div className="py-24 text-center">
                    <Activity size={48} className="mx-auto text-aura-muted/20 mb-4" />
                    <p className="text-aura-muted text-xs font-black uppercase tracking-widest">No pending audits requested.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {pendingSubmissions.map(tx => (
                      <div key={tx.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-aura-lime/30 transition-all group">
                         <div className="flex items-center gap-6 mb-6 lg:mb-0">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-aura-lime group-hover:scale-110 transition-transform"><CreditCard size={32} /></div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h3 className="text-xl font-bold uppercase">{tx.full_name}</h3>
                                 <div className="px-2 py-0.5 bg-yellow-400/10 text-yellow-500 rounded text-[9px] font-black uppercase tracking-widest">Pending Verification</div>
                              </div>
                              <p className="text-xs text-aura-muted flex items-center gap-2 font-bold uppercase tracking-widest">
                                 {tx.metadata?.method || 'Direct Transfer'} • <span className="font-mono text-[10px]">{tx.reference_id}</span>
                              </p>
                            </div>
                         </div>
                         <div className="flex flex-col lg:items-end gap-6 text-left lg:text-right">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-muted mb-1">Request Amount</p>
                               <p className="text-4xl font-black font-serif italic text-aura-lime">${parseFloat(tx.amount).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-3">
                               <button onClick={() => handleAuditAction(tx.id, 'reject')} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest"><XCircle size={14} /> Reject</button>
                               <button onClick={() => handleAuditAction(tx.id, 'approve')} className="flex items-center gap-2 px-6 py-3 bg-aura-lime text-aura-black transition-all rounded-xl text-[10px] font-black uppercase tracking-widest brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px]"><CheckCircle size={14} /> Approve Settlement</button>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'investments' && (
              <motion.div key="investments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {investments.map(inv => (
                    <div key={inv.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-aura-lime"><Zap size={20} /></div>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded", inv.status === 'active' ? "bg-aura-lime/10 text-aura-lime" : "bg-white/10 text-aura-muted")}>{inv.status}</span>
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-aura-muted mb-1">{inv.full_name}</p>
                      <p className="text-3xl font-black font-serif italic mb-4">${parseFloat(inv.amount).toLocaleString()}</p>
                      <div className="space-y-2 pt-4 border-t border-white/5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-aura-muted">
                              <span>ROI Rate</span>
                              <span className="text-white">{inv.daily_roi_rate}%</span>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Total Assets", value: "$4.2M", icon: Activity },
           { label: "Active Nodes", value: investments.length.toString(), icon: Zap },
           { label: "Daily Payouts", value: "$124K", icon: ArrowUpRight },
           { label: "Security Level", value: "Tier 4", icon: ShieldCheck },
         ].map((stat, i) => (
           <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                 <stat.icon size={18} className="text-aura-lime" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-aura-muted">Global</p>
              </div>
              <p className="text-2xl font-black font-serif italic tracking-tighter mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">{stat.label}</p>
           </div>
         ))}
      </div>
    </div>
  );
}
