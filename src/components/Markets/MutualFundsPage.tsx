import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  PieChart, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Percent, 
  DollarSign, 
  Activity,
  Briefcase,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  MutualFundAsset, 
  MUTUAL_FUNDS_REGISTRY 
} from '../../services/securitiesData';
import { toggleSecuritiesWatchlist } from '../../services/securitiesOrderService';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import MarketsNav from './MarketsNav';
import OrderModal from './OrderModal';
import AssetDetailModal from './AssetDetailModal';
import { toast } from 'sonner';

export default function MutualFundsPage() {
  const { user, profile } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFund, setSelectedFund] = useState<MutualFundAsset>(MUTUAL_FUNDS_REGISTRY[0]);
  const [activeTimeframe, setActiveTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX'>('1Y');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalSide, setOrderModalSide] = useState<'buy' | 'sell'>('buy');
  const [modalTargetAsset, setModalTargetAsset] = useState<MutualFundAsset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Firestore real-time subscriptions
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [userFundHoldings, setUserFundHoldings] = useState<any[]>([]);

  // Watchlist listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'securities_watchlist'),
      where('user_id', '==', user.uid),
      where('asset_type', '==', 'mutual_fund')
    );
    const unsub = onSnapshot(q, (snap) => {
      const symbols: string[] = [];
      snap.forEach(d => {
        symbols.push(d.data().symbol);
      });
      setWatchlistSymbols(symbols);
    }, (err) => console.warn('Fund watchlist err:', err));
    return () => unsub();
  }, [user]);

  // Fund holdings listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'securities_holdings'),
      where('user_id', '==', user.uid),
      where('asset_type', '==', 'mutual_fund')
    );
    const unsub = onSnapshot(q, (snap) => {
      const holdings: any[] = [];
      snap.forEach(d => {
        holdings.push({ id: d.id, ...d.data() });
      });
      setUserFundHoldings(holdings);
    }, (err) => console.warn('Fund holdings err:', err));
    return () => unsub();
  }, [user]);

  const filteredFunds = useMemo(() => {
    return MUTUAL_FUNDS_REGISTRY.filter((fund) => {
      const matchSearch =
        fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || fund.category.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchSearch && matchCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleToggleWatch = async (fund: MutualFundAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add to your watchlist');
      return;
    }
    const added = await toggleSecuritiesWatchlist(user.uid, fund.symbol, 'mutual_fund', fund.name);
    toast.success(added ? `Added ${fund.symbol} to watchlist` : `Removed ${fund.symbol} from watchlist`);
  };

  const openOrder = (fund: MutualFundAsset, side: 'buy' | 'sell', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalTargetAsset(fund);
    setOrderModalSide(side);
    setIsOrderModalOpen(true);
  };

  const openDetail = (fund: MutualFundAsset) => {
    setSelectedFund(fund);
    setIsDetailModalOpen(true);
  };

  const selectedHolding = userFundHoldings.find(h => h.symbol === selectedFund.symbol);
  const selectedHoldingQty = selectedHolding ? selectedHolding.quantity : 0;
  const chartData = selectedFund.chartData[activeTimeframe] || selectedFund.chartData['1Y'];
  const isPos = selectedFund.change >= 0;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Institutional Sub-Navbar */}
      <MarketsNav />

      {/* Main Mutual Funds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Featured Fund Terminal (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className={cn(
            "p-6 sm:p-8 rounded-3xl border shadow-xl transition-all relative overflow-hidden",
            isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
          )}>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{selectedFund.symbol}</span>
                  <span className={cn(
                    "text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase",
                    isDark ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-700"
                  )}>
                    {selectedFund.category}
                  </span>
                  <button
                    onClick={(e) => handleToggleWatch(selectedFund, e)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      watchlistSymbols.includes(selectedFund.symbol)
                        ? "text-amber-400 hover:text-amber-300"
                        : isDark ? "text-white/30 hover:text-white" : "text-slate-300 hover:text-slate-600"
                    )}
                    title={watchlistSymbols.includes(selectedFund.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star size={18} fill={watchlistSymbols.includes(selectedFund.symbol) ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-500")}>
                  {selectedFund.name}
                </p>
                <p className={cn("text-xs font-mono", isDark ? "text-white/40" : "text-slate-400")}>
                  Provider: {selectedFund.provider} • Inception: {selectedFund.inceptionDate}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openOrder(selectedFund, 'buy')}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Invest / Buy
                </button>
                {selectedHoldingQty > 0 && (
                  <button
                    onClick={() => openOrder(selectedFund, 'sell')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Redeem ({selectedHoldingQty})
                  </button>
                )}
                <button
                  onClick={() => openDetail(selectedFund)}
                  className={cn(
                    "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                    isDark ? "border-white/10 hover:bg-white/5 text-white/80" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  Fund Specs
                </button>
              </div>
            </div>

            {/* Price & NAV Bar */}
            <div className="py-6 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/40" : "text-slate-400")}>
                  Net Asset Value (As of {selectedFund.navDate})
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-5xl font-black font-serif italic text-primary">
                    {formatCurrency(selectedFund.nav)}
                  </span>
                  <span className={cn(
                    "text-sm sm:text-base font-mono font-bold flex items-center",
                    isPos ? "text-emerald-500" : "text-red-500"
                  )}>
                    {isPos ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    {isPos ? '+' : ''}{selectedFund.change.toFixed(2)} ({isPos ? '+' : ''}{selectedFund.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Timeframes */}
              <div className={cn("flex items-center gap-1 p-1 rounded-2xl border", isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-100 border-slate-200")}>
                {(['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all",
                      activeTimeframe === tf
                        ? "bg-primary text-white shadow-sm font-black"
                        : isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* NAV Performance Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fundAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke={isDark ? "#444" : "#ccc"} 
                    tick={{ fontSize: 10, fill: isDark ? "#888" : "#666" }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke={isDark ? "#444" : "#ccc"} 
                    tick={{ fontSize: 10, fill: isDark ? "#888" : "#666" }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={cn("p-2.5 rounded-xl border text-xs shadow-xl", isDark ? "bg-black/90 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}>
                            <p className="font-mono text-white/50 text-[10px]">{payload[0].payload.time}</p>
                            <p className="font-black font-serif italic text-purple-400 text-base">NAV: ${payload[0].value?.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#fundAreaGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trailing Total Returns Strip */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 block">
                Trailing Total Returns Performance (%)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-xs">
                {Object.entries(selectedFund.performance).map(([period, val]) => {
                  const numVal = Number(val);
                  return (
                    <div key={period} className={cn("p-2.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                      <span className="text-[10px] uppercase font-mono block text-white/50">{period}</span>
                      <span className={cn("text-xs font-mono font-bold mt-1 block", numVal >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {numVal >= 0 ? '+' : ''}{numVal}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6 text-xs">
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Expense Ratio</span>
                <span className="font-mono font-bold text-sm text-emerald-500">{selectedFund.expenseRatio}%</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Fund AUM</span>
                <span className="font-mono font-bold text-sm">${(selectedFund.aum / 1e9).toFixed(1)}B</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Risk Level</span>
                <span className="font-mono font-bold text-sm">{selectedFund.riskLevel}</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Min Investment</span>
                <span className="font-mono font-bold text-sm">${selectedFund.minInvestment.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* User Active Fund Position */}
          {selectedHolding && (
            <div className={cn(
              "p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              isDark ? "bg-purple-500/5 border-purple-500/20 text-white" : "bg-purple-50 border-purple-200 text-purple-950"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <PieChart size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">Your {selectedFund.symbol} Holdings</h4>
                  <p className="text-xs opacity-75">
                    {selectedHolding.quantity} Units • Avg NAV: ${selectedHolding.average_price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-4 text-right">
                <div>
                  <span className="text-[10px] uppercase opacity-60 block">Current Portfolio Value</span>
                  <span className="text-lg font-black font-serif italic text-purple-400">
                    {formatCurrency(selectedHolding.quantity * selectedFund.nav)}
                  </span>
                </div>
                <button
                  onClick={() => openOrder(selectedFund, 'sell')}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Redeem
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Funds Directory & Screener (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={cn(
            "p-6 rounded-3xl border shadow-xl space-y-4",
            isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span>Mutual Funds Directory</span>
              </h3>
              <span className="text-[10px] font-mono opacity-60">
                {filteredFunds.length} Funds
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search fund name or ticker"
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-xl text-xs font-medium border outline-none transition-all",
                  isDark
                    ? "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-primary"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary"
                )}
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Funds' },
                { id: 'equity', label: 'Equities' },
                { id: 'fixed income', label: 'Fixed Income' },
                { id: 'institutional', label: 'Institutional' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                    selectedCategory === c.id
                      ? "bg-primary text-white"
                      : isDark ? "bg-white/5 text-white/60 hover:text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Funds List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredFunds.map((fund) => {
                const isSelected = selectedFund.symbol === fund.symbol;
                const isFundPos = fund.change >= 0;
                const isWatch = watchlistSymbols.includes(fund.symbol);

                return (
                  <div
                    key={fund.symbol}
                    onClick={() => setSelectedFund(fund)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : isDark
                          ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => handleToggleWatch(fund, e)}
                        className={cn(
                          "transition-colors shrink-0",
                          isWatch ? "text-amber-400" : "text-white/20 group-hover:text-white/50"
                        )}
                      >
                        <Star size={15} fill={isWatch ? "currentColor" : "none"} />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-tight">{fund.symbol}</span>
                          <span className="text-[9px] font-mono opacity-50 uppercase">ER: {fund.expenseRatio}%</span>
                        </div>
                        <p className={cn("text-[11px] truncate max-w-[130px]", isDark ? "text-white/60" : "text-slate-500")}>
                          {fund.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold block">
                        ${fund.nav.toFixed(2)}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono font-bold flex items-center justify-end",
                        isFundPos ? "text-emerald-500" : "text-red-500"
                      )}>
                        {isFundPos ? '+' : ''}{fund.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        asset={modalTargetAsset || selectedFund}
        initialSide={orderModalSide}
        userHoldingQuantity={selectedHoldingQty}
      />

      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        asset={selectedFund}
        onOpenOrderModal={(asset, side) => openOrder(asset as MutualFundAsset, side)}
        isWatchlisted={watchlistSymbols.includes(selectedFund.symbol)}
        onToggleWatchlist={() => handleToggleWatch(selectedFund)}
      />
    </div>
  );
}
