import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Landmark, 
  PieChart, 
  RefreshCw,
  X,
  FileText,
  DollarSign
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { SecuritiesOrderRecord, OrderStatus, AssetType } from '../../services/securitiesData';
import { cancelSecuritiesOrder } from '../../services/securitiesOrderService';
import MarketsNav from './MarketsNav';
import { toast } from 'sonner';

export default function SecuritiesOrdersPage() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [orders, setOrders] = useState<SecuritiesOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [assetFilter, setAssetFilter] = useState<'all' | AssetType>('all');
  const [selectedOrder, setSelectedOrder] = useState<SecuritiesOrderRecord | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Subscribe to user's orders
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'securities_orders'),
      where('user_id', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: SecuritiesOrderRecord[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SecuritiesOrderRecord);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(list);
      setLoading(false);
    }, (err) => {
      console.warn('Orders listener err:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = 
        o.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchAsset = assetFilter === 'all' || o.asset_type === assetFilter;
      return matchSearch && matchStatus && matchAsset;
    });
  }, [orders, searchTerm, statusFilter, assetFilter]);

  const handleCancelOrder = async (order: SecuritiesOrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    if (order.status !== 'pending' && order.status !== 'submitted') {
      toast.error('Only pending orders can be cancelled');
      return;
    }

    if (!window.confirm(`Cancel order ${order.side.toUpperCase()} ${order.quantity} ${order.symbol}?`)) {
      return;
    }

    setCancellingId(order.id);
    try {
      const res = await cancelSecuritiesOrder(order.id, user.uid, user.email || 'user');
      if (res.success) {
        toast.success(`Order #${order.id.slice(0, 8)} successfully cancelled`);
      } else {
        toast.error(res.error || 'Failed to cancel order');
      }
    } catch (err: any) {
      toast.error(err.message || 'Cancellation error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Institutional Sub-Navbar */}
      <MarketsNav />

      {/* Orders Filter & Terminal Table */}
      <div className={cn(
        "p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6",
        isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
      )}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <span>Order Ledger & Trade Log</span>
            </h3>
            <p className={cn("text-xs mt-1", isDark ? "text-white/60" : "text-slate-500")}>
              Transparent execution tracking across stocks, bonds, and mutual funds
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''} Logged
          </span>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbol, name, or order ID"
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-xl text-xs font-medium border outline-none transition-all",
                isDark
                  ? "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-primary"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary"
              )}
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={cn(
                "w-full h-11 px-3 rounded-xl text-xs font-medium border outline-none transition-all font-mono",
                isDark ? "bg-[#11141b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Triggers</option>
              <option value="filled">Filled / Executed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected / Failed</option>
            </select>
          </div>

          {/* Asset Filter */}
          <div className="sm:col-span-3">
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value as any)}
              className={cn(
                "w-full h-11 px-3 rounded-xl text-xs font-medium border outline-none transition-all font-mono",
                isDark ? "bg-[#11141b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <option value="all">All Asset Classes</option>
              <option value="stock">Stocks Only</option>
              <option value="bond">Bonds Only</option>
              <option value="mutual_fund">Mutual Funds Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 opacity-60 text-xs font-mono uppercase tracking-wider space-y-2">
            <p>No securities orders matching current criteria</p>
            <p className="text-[10px]">Execute a buy or sell order from Stocks, Bonds, or Mutual Funds</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10 opacity-60 uppercase font-mono text-[10px]">
                  <th className="pb-3">Order ID / Date</th>
                  <th className="pb-3">Security</th>
                  <th className="pb-3">Side & Type</th>
                  <th className="pb-3 text-right">Shares / Units</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Total Amount</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredOrders.map((order) => {
                  const isBuy = order.side === 'buy';
                  const isFilled = order.status === 'filled';
                  const isPending = order.status === 'pending' || order.status === 'submitted';
                  const isCancelled = order.status === 'cancelled';
                  const isRejected = order.status === 'rejected' || order.status === 'failed';

                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="py-4">
                        <span className="font-bold block text-white/90">#{order.id.slice(0, 8)}</span>
                        <span className="text-[10px] opacity-50 block">
                          {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px]",
                            order.asset_type === 'stock' ? "bg-blue-500/10 text-blue-400" :
                            order.asset_type === 'bond' ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                          )}>
                            {order.asset_type === 'stock' ? 'S' : order.asset_type === 'bond' ? 'B' : 'F'}
                          </span>
                          <div>
                            <span className="font-black uppercase tracking-tight text-xs block">{order.symbol}</span>
                            <span className="text-[10px] opacity-50 truncate max-w-[140px] block">{order.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase font-sans mr-1.5",
                          isBuy ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400"
                        )}>
                          {order.side}
                        </span>
                        <span className="text-[10px] uppercase opacity-75">{order.order_type}</span>
                      </td>
                      <td className="py-4 text-right font-bold">{order.quantity}</td>
                      <td className="py-4 text-right">${order.price.toFixed(2)}</td>
                      <td className="py-4 text-right font-black text-sm text-white">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 font-sans",
                          isFilled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          isPending ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          isCancelled ? "bg-white/5 text-white/40 border border-white/10" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                          {isFilled && <CheckCircle2 size={10} />}
                          {isPending && <Clock size={10} className="animate-spin" />}
                          {isCancelled && <XCircle size={10} />}
                          {isRejected && <AlertCircle size={10} />}
                          <span>{order.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-right font-sans">
                        {isPending ? (
                          <button
                            onClick={(e) => handleCancelOrder(order, e)}
                            disabled={cancellingId === order.id}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-red-500/20"
                          >
                            {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                          >
                            View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Receipt Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={cn(
            "relative w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-8 transition-colors text-left space-y-6",
            isDark ? "bg-[#0b0e14] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Order Audit Details
                </span>
                <h3 className="text-xl font-black font-serif italic mt-0.5">
                  Order #{selectedOrder.id.slice(0, 12)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">Security:</span>
                <span className="font-bold">{selectedOrder.name} ({selectedOrder.symbol})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Asset Class:</span>
                <span className="uppercase">{selectedOrder.asset_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Side / Type:</span>
                <span className="uppercase font-bold">{selectedOrder.side} • {selectedOrder.order_type} Order</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Quantity:</span>
                <span className="font-bold">{selectedOrder.quantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Price:</span>
                <span>${selectedOrder.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Gross Amount:</span>
                <span className="font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Platform Fee:</span>
                <span className="text-emerald-500 font-bold">$0.00 (Commission-Free)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Execution Status:</span>
                <span className="uppercase font-black text-primary">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Settlement Target:</span>
                <span>{new Date(selectedOrder.settlement_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Created Timestamp:</span>
                <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
              {selectedOrder.notes && (
                <div className="pt-2 border-t border-white/5 text-[11px] font-sans opacity-75">
                  <span className="text-white/40 block">Notes:</span>
                  {selectedOrder.notes}
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'submitted') && (
                <button
                  onClick={() => {
                    handleCancelOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
