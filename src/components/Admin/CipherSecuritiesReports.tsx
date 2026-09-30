import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Landmark, 
  PieChart, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  RefreshCw,
  X,
  FileSpreadsheet,
  ShieldCheck,
  User,
  DollarSign
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { SecuritiesOrderRecord, OrderStatus, AssetType } from '../../services/securitiesData';
import { adminUpdateOrderStatus } from '../../services/securitiesOrderService';
import { toast } from 'sonner';

interface CipherSecuritiesReportsProps {
  currentUserEmail: string;
}

export default function CipherSecuritiesReports({ currentUserEmail }: CipherSecuritiesReportsProps) {
  const [orders, setOrders] = useState<SecuritiesOrderRecord[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | AssetType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [activeView, setActiveView] = useState<'orders' | 'holdings'>('orders');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected Order for inspection modal
  const [inspectOrder, setInspectOrder] = useState<SecuritiesOrderRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscribe to all securities orders
  useEffect(() => {
    const q = query(collection(db, 'securities_orders'));
    const unsub = onSnapshot(q, (snap) => {
      const list: SecuritiesOrderRecord[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SecuritiesOrderRecord);
      });
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(list);
      setLoading(false);
    }, (err) => {
      console.warn('Admin securities orders listen err:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Subscribe to all securities holdings
  useEffect(() => {
    const q = query(collection(db, 'securities_holdings'));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setHoldings(list);
    }, (err) => console.warn('Admin holdings listen err:', err));

    return () => unsub();
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const now = new Date().getTime();
    return orders.filter(o => {
      const matchSearch =
        o.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.user_email && o.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.user_name && o.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        o.user_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAsset = assetTypeFilter === 'all' || o.asset_type === assetTypeFilter;
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;

      let matchDate = true;
      if (dateFilter !== 'all') {
        const orderTime = new Date(o.created_at).getTime();
        const diffMs = now - orderTime;
        if (dateFilter === 'today') matchDate = diffMs <= 24 * 60 * 60 * 1000;
        else if (dateFilter === '7d') matchDate = diffMs <= 7 * 24 * 60 * 60 * 1000;
        else if (dateFilter === '30d') matchDate = diffMs <= 30 * 24 * 60 * 60 * 1000;
      }

      return matchSearch && matchAsset && matchStatus && matchDate;
    });
  }, [orders, searchTerm, assetTypeFilter, statusFilter, dateFilter]);

  // Filtered holdings
  const filteredHoldings = useMemo(() => {
    return holdings.filter(h => {
      const matchSearch =
        h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.name && h.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        h.user_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAsset = assetTypeFilter === 'all' || h.asset_type === assetTypeFilter;
      return matchSearch && matchAsset;
    });
  }, [holdings, searchTerm, assetTypeFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalVolume = orders.reduce((sum, o) => sum + (o.status === 'filled' ? o.total_amount : 0), 0);
    const stockOrdersCount = orders.filter(o => o.asset_type === 'stock').length;
    const bondOrdersCount = orders.filter(o => o.asset_type === 'bond').length;
    const fundOrdersCount = orders.filter(o => o.asset_type === 'mutual_fund').length;
    const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'submitted').length;
    const totalHoldingsValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);

    return {
      totalVolume,
      stockOrdersCount,
      bondOrdersCount,
      fundOrdersCount,
      pendingCount,
      totalHoldingsValue,
      totalOrdersCount: orders.length
    };
  }, [orders, holdings]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders available to export');
      return;
    }

    const headers = [
      'Order ID',
      'Date (UTC)',
      'User ID',
      'User Name',
      'User Email',
      'Asset Class',
      'Symbol',
      'Security Name',
      'Side',
      'Order Type',
      'Quantity',
      'Price (USD)',
      'Total Amount (USD)',
      'Fee (USD)',
      'Status',
      'Settlement Date',
      'Notes'
    ];

    const rows = filteredOrders.map(o => [
      `"${o.id}"`,
      `"${o.created_at}"`,
      `"${o.user_id}"`,
      `"${o.user_name || ''}"`,
      `"${o.user_email || ''}"`,
      `"${o.asset_type}"`,
      `"${o.symbol}"`,
      `"${(o.name || '').replace(/"/g, '""')}"`,
      `"${o.side}"`,
      `"${o.order_type}"`,
      o.quantity,
      o.price,
      o.total_amount,
      o.fee || 0,
      `"${o.status}"`,
      `"${o.settlement_date || ''}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CGA_Securities_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredOrders.length} securities records to CSV`);
  };

  // Status Change by Cipher Administrator
  const handleAdminAction = async (newStatus: 'filled' | 'rejected' | 'cancelled') => {
    if (!inspectOrder) return;
    setIsProcessing(true);
    try {
      const res = await adminUpdateOrderStatus(inspectOrder.id, newStatus, currentUserEmail, adminNotes);
      if (res.success) {
        toast.success(`Order #${inspectOrder.id.slice(0, 8)} updated to ${newStatus.toUpperCase()}`);
        setInspectOrder(null);
        setAdminNotes('');
      } else {
        toast.error(res.error || 'Failed to update order status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
            Cipher Institutional Terminal
          </span>
          <h2 className="text-3xl font-black font-serif italic mt-2">
            Securities Marketplace & Reports
          </h2>
          <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1">
            Stocks, Sovereign/Corporate Bonds & Mutual Funds Global Oversight
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-3 bg-white/5 hover:bg-aura-lime hover:text-black border border-white/10 hover:border-aura-lime rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
        >
          <Download size={15} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted">
            <span>Settled Trade Volume</span>
            <DollarSign size={14} className="text-primary" />
          </div>
          <p className="text-2xl font-black font-serif italic text-white">
            {formatCurrency(metrics.totalVolume)}
          </p>
          <span className="text-[9px] font-mono text-aura-muted block">
            {metrics.totalOrdersCount} Total Orders
          </span>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted">
            <span>Pending Executions</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black font-serif italic text-amber-400">
            {metrics.pendingCount}
          </p>
          <span className="text-[9px] font-mono text-aura-muted block">
            Awaiting Market Triggers
          </span>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted">
            <span>Total Held Assets</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-serif italic text-emerald-400">
            {formatCurrency(metrics.totalHoldingsValue)}
          </p>
          <span className="text-[9px] font-mono text-aura-muted block">
            {holdings.length} Active User Positions
          </span>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted">
            <span>Product Distribution</span>
            <PieChart size={14} className="text-purple-400" />
          </div>
          <div className="text-xs font-mono font-bold flex gap-3 pt-1">
            <span className="text-blue-400">{metrics.stockOrdersCount} S</span>
            <span className="text-emerald-400">{metrics.bondOrdersCount} B</span>
            <span className="text-purple-400">{metrics.fundOrdersCount} F</span>
          </div>
          <span className="text-[9px] font-mono text-aura-muted block">
            Stocks • Bonds • Funds
          </span>
        </div>
      </div>

      {/* View Switcher: Orders vs Holdings */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveView('orders')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
            activeView === 'orders' ? "bg-aura-lime text-black" : "bg-white/5 text-aura-muted hover:text-white"
          )}
        >
          Securities Orders ({filteredOrders.length})
        </button>
        <button
          onClick={() => setActiveView('holdings')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
            activeView === 'holdings' ? "bg-aura-lime text-black" : "bg-white/5 text-aura-muted hover:text-white"
          )}
        >
          Client Holdings ({filteredHoldings.length})
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4 relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by user, symbol, email, or order ID"
            className="w-full h-11 pl-10 pr-4 rounded-xl text-xs font-medium border border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 outline-none focus:border-aura-lime transition-all"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value as any)}
            className="w-full h-11 px-3 rounded-xl text-xs font-medium border border-white/10 bg-[#0c0d12] text-white outline-none font-mono"
          >
            <option value="all">All Asset Classes</option>
            <option value="stock">Stocks</option>
            <option value="bond">Bonds</option>
            <option value="mutual_fund">Mutual Funds</option>
          </select>
        </div>

        {activeView === 'orders' && (
          <>
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl text-xs font-medium border border-white/10 bg-[#0c0d12] text-white outline-none font-mono"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="filled">Filled / Executed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl text-xs font-medium border border-white/10 bg-[#0c0d12] text-white outline-none font-mono"
              >
                <option value="all">All Dates</option>
                <option value="today">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* VIEW 1: ORDERS TABLE */}
      {activeView === 'orders' && (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-aura-muted text-xs font-mono uppercase tracking-widest">
              No securities order records found matching the criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-aura-muted uppercase font-mono text-[9px] tracking-wider">
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Client Identification</th>
                    <th className="p-4">Asset / Symbol</th>
                    <th className="p-4">Side & Type</th>
                    <th className="p-4 text-right">Units</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] font-mono text-white/90">
                  {paginatedOrders.map((order) => {
                    const isBuy = order.side === 'buy';
                    const isFilled = order.status === 'filled';
                    const isPending = order.status === 'pending' || order.status === 'submitted';
                    const isCancelled = order.status === 'cancelled';
                    const isRejected = order.status === 'rejected';

                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-bold text-white block">#{order.id.slice(0, 10)}</span>
                          <span className="text-[9px] text-aura-muted block">
                            {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="p-4 font-sans">
                          <span className="text-white font-bold block">{order.user_name || 'Anonymous User'}</span>
                          <span className="text-[10px] text-aura-muted font-mono block truncate max-w-[160px]">{order.user_email}</span>
                          <span className="text-[8px] text-aura-muted/60 font-mono block">UID: {order.user_id.slice(0, 8)}...</span>
                        </td>

                        <td className="p-4 font-sans">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]",
                              order.asset_type === 'stock' ? "bg-blue-500/20 text-blue-400" :
                              order.asset_type === 'bond' ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"
                            )}>
                              {order.asset_type === 'stock' ? 'S' : order.asset_type === 'bond' ? 'B' : 'F'}
                            </span>
                            <div>
                              <span className="font-black uppercase text-xs block">{order.symbol}</span>
                              <span className="text-[10px] text-aura-muted truncate max-w-[140px] block">{order.name}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase font-sans mr-1.5",
                            isBuy ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400"
                          )}>
                            {order.side}
                          </span>
                          <span className="text-[10px] uppercase opacity-75">{order.order_type}</span>
                        </td>

                        <td className="p-4 text-right font-bold">{order.quantity}</td>
                        <td className="p-4 text-right">${order.price.toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-sm text-white">
                          {formatCurrency(order.total_amount)}
                        </td>

                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 font-sans",
                            isFilled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            isPending ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            isCancelled ? "bg-white/5 text-white/40 border border-white/10" : "bg-red-500/10 text-red-400 border border-red-500/20"
                          )}>
                            {isFilled && <CheckCircle size={10} />}
                            {isPending && <Clock size={10} className="animate-spin" />}
                            {isCancelled && <XCircle size={10} />}
                            {isRejected && <AlertCircle size={10} />}
                            <span>{order.status}</span>
                          </span>
                        </td>

                        <td className="p-4 text-right font-sans">
                          <button
                            onClick={() => {
                              setInspectOrder(order);
                              setAdminNotes(order.notes || '');
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-aura-lime rounded-lg text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Audit & Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-aura-muted">
                    Page {currentPage} of {totalPages} ({filteredOrders.length} entries)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CLIENT HOLDINGS TABLE */}
      {activeView === 'holdings' && (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {filteredHoldings.length === 0 ? (
            <div className="p-16 text-center text-aura-muted text-xs font-mono uppercase tracking-widest">
              No client securities holdings on record
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-aura-muted uppercase font-mono text-[9px] tracking-wider">
                    <th className="p-4">Client User ID</th>
                    <th className="p-4">Security Symbol</th>
                    <th className="p-4">Asset Class</th>
                    <th className="p-4 text-right">Units Held</th>
                    <th className="p-4 text-right">Average Cost</th>
                    <th className="p-4 text-right">Total Invested</th>
                    <th className="p-4 text-right">Current Value</th>
                    <th className="p-4 text-right">Last Synchronized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] font-mono text-white/90">
                  {filteredHoldings.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold truncate max-w-[140px]">{h.user_id}</td>
                      <td className="p-4 font-black uppercase text-sm text-primary">{h.symbol}</td>
                      <td className="p-4 uppercase">{h.asset_type}</td>
                      <td className="p-4 text-right font-bold">{h.quantity}</td>
                      <td className="p-4 text-right">${(h.average_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-right">{formatCurrency(h.total_invested || 0)}</td>
                      <td className="p-4 text-right font-black text-white">{formatCurrency(h.current_value || 0)}</td>
                      <td className="p-4 text-right text-[10px] text-aura-muted">
                        {h.updated_at ? new Date(h.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INSPECT ORDER AUDIT MODAL */}
      {inspectOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/10 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-aura-lime">
                  Cipher Securities Audit Inspection
                </span>
                <h3 className="text-2xl font-black font-serif italic text-white mt-1">
                  Order #{inspectOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => setInspectOrder(null)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] uppercase text-aura-muted block">Client User ID</span>
                <span className="font-bold text-white break-all">{inspectOrder.user_id}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] uppercase text-aura-muted block">Client Credentials</span>
                <span className="font-bold text-white block truncate">{inspectOrder.user_name || 'N/A'}</span>
                <span className="text-[10px] text-aura-muted block truncate">{inspectOrder.user_email || 'N/A'}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] uppercase text-aura-muted block">Instrument</span>
                <span className="font-black text-sm text-primary">{inspectOrder.symbol}</span>
                <span className="text-[10px] text-white/60 block">{inspectOrder.name}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] uppercase text-aura-muted block">Side & Order Type</span>
                <span className="font-black uppercase text-sm">{inspectOrder.side} • {inspectOrder.order_type}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] uppercase text-aura-muted block">Quantity & Price</span>
                <span className="font-bold">{inspectOrder.quantity} Units @ ${inspectOrder.price.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] uppercase text-aura-muted block">Total Transacted Value</span>
                <span className="font-serif italic font-black text-lg text-emerald-400">{formatCurrency(inspectOrder.total_amount)}</span>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block">
                Administrative Audit Notes & Correction Reason
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes for this audit action..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-aura-lime text-white"
                rows={3}
              />
            </div>

            {/* Admin Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => setInspectOrder(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-bold"
              >
                Close View
              </button>

              {(inspectOrder.status === 'pending' || inspectOrder.status === 'submitted') && (
                <>
                  <button
                    onClick={() => handleAdminAction('rejected')}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs uppercase font-black tracking-wider transition-all"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => handleAdminAction('filled')}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-aura-lime text-black hover:bg-aura-lime/90 rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                  >
                    Authorize & Fill Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
