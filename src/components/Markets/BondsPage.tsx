import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Landmark, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Activity,
  Briefcase
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  BondAsset, 
  BONDS_REGISTRY 
} from '../../services/securitiesData';
import { toggleSecuritiesWatchlist } from '../../services/securitiesOrderService';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import MarketsNav from './MarketsNav';
import OrderModal from './OrderModal';
import AssetDetailModal from './AssetDetailModal';
import { toast } from 'sonner';

export default function BondsPage() {
  const { user, profile } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedBond, setSelectedBond] = useState<BondAsset>(BONDS_REGISTRY[0]);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalSide, setOrderModalSide] = useState<'buy' | 'sell'>('buy');
  const [modalTargetAsset, setModalTargetAsset] = useState<BondAsset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Firestore real-time subscriptions
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [userBondHoldings, setUserBondHoldings] = useState<any[]>([]);

  // Watchlist listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'securities_watchlist'),
      where('user_id', '==', user.uid),
      where('asset_type', '==', 'bond')
    );
    const unsub = onSnapshot(q, (snap) => {
      const symbols: string[] = [];
      snap.forEach(d => {
        symbols.push(d.data().symbol);
      });
      setWatchlistSymbols(symbols);
    }, (err) => console.warn('Bond watchlist err:', err));
    return () => unsub();
  }, [user]);

  // Bond holdings listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'securities_holdings'),
      where('user_id', '==', user.uid),
      where('asset_type', '==', 'bond')
    );
    const unsub = onSnapshot(q, (snap) => {
      const holdings: any[] = [];
      snap.forEach(d => {
        holdings.push({ id: d.id, ...d.data() });
      });
      setUserBondHoldings(holdings);
    }, (err) => console.warn('Bond holdings err:', err));
    return () => unsub();
  }, [user]);

  const filteredBonds = useMemo(() => {
    return BONDS_REGISTRY.filter((bond) => {
      const matchSearch =
        bond.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.cusip.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || bond.category === selectedCategory;
      const matchRating = selectedRating === 'all' || bond.creditRating.startsWith(selectedRating);
      return matchSearch && matchCategory && matchRating;
    });
  }, [searchTerm, selectedCategory, selectedRating]);

  const handleToggleWatch = async (bond: BondAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add to your watchlist');
      return;
    }
    const added = await toggleSecuritiesWatchlist(user.uid, bond.symbol, 'bond', bond.name);
    toast.success(added ? `Added ${bond.symbol} to watchlist` : `Removed ${bond.symbol} from watchlist`);
  };

  const openOrder = (bond: BondAsset, side: 'buy' | 'sell', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalTargetAsset(bond);
    setOrderModalSide(side);
    setIsOrderModalOpen(true);
  };

  const openDetail = (bond: BondAsset) => {
    setSelectedBond(bond);
    setIsDetailModalOpen(true);
  };

  const selectedHolding = userBondHoldings.find(h => h.symbol === selectedBond.symbol);
  const selectedHoldingQty = selectedHolding ? selectedHolding.quantity : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Institutional Sub-Navbar */}
      <MarketsNav />

      {/* Main Bond Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Featured Bond Overview & Yield Curve (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className={cn(
            "p-6 sm:p-8 rounded-3xl border shadow-xl transition-all relative overflow-hidden",
            isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
          )}>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{selectedBond.symbol}</span>
                  <span className={cn(
                    "text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase",
                    isDark ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-700"
                  )}>
                    {selectedBond.category} • {selectedBond.creditRating} ({selectedBond.ratingAgency})
                  </span>
                  <button
                    onClick={(e) => handleToggleWatch(selectedBond, e)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      watchlistSymbols.includes(selectedBond.symbol)
                        ? "text-amber-400 hover:text-amber-300"
                        : isDark ? "text-white/30 hover:text-white" : "text-slate-300 hover:text-slate-600"
                    )}
                    title={watchlistSymbols.includes(selectedBond.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star size={18} fill={watchlistSymbols.includes(selectedBond.symbol) ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-500")}>
                  {selectedBond.name}
                </p>
                <p className={cn("text-xs font-mono", isDark ? "text-white/40" : "text-slate-400")}>
                  Issuer: {selectedBond.issuer} • CUSIP: {selectedBond.cusip}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openOrder(selectedBond, 'buy')}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Buy / Invest
                </button>
                {selectedHoldingQty > 0 && (
                  <button
                    onClick={() => openOrder(selectedBond, 'sell')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Sell ({selectedHoldingQty})
                  </button>
                )}
                <button
                  onClick={() => openDetail(selectedBond)}
                  className={cn(
                    "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                    isDark ? "border-white/10 hover:bg-white/5 text-white/80" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  Bond Details
                </button>
              </div>
            </div>

            {/* Core Metrics: Clearly distinguishing Coupon Rate, YTM, Current Yield, and Price */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-white/10">
              <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold tracking-wider block", isDark ? "text-white/50" : "text-slate-400")}>
                  Yield to Maturity (YTM)
                </span>
                <span className="text-2xl font-black font-serif italic text-emerald-500 mt-1 block">
                  {selectedBond.yieldToMaturity}%
                </span>
                <span className="text-[10px] font-mono text-white/40 block mt-0.5">Annualized Return</span>
              </div>

              <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold tracking-wider block", isDark ? "text-white/50" : "text-slate-400")}>
                  Coupon Rate
                </span>
                <span className="text-2xl font-black font-serif italic text-primary mt-1 block">
                  {selectedBond.couponRate}%
                </span>
                <span className="text-[10px] font-mono text-white/40 block mt-0.5">{selectedBond.paymentFrequency}</span>
              </div>

              <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold tracking-wider block", isDark ? "text-white/50" : "text-slate-400")}>
                  Current Yield
                </span>
                <span className="text-2xl font-black font-serif italic text-cyan-400 mt-1 block">
                  {selectedBond.currentYield}%
                </span>
                <span className="text-[10px] font-mono text-white/40 block mt-0.5">Coupon / Clean Price</span>
              </div>

              <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold tracking-wider block", isDark ? "text-white/50" : "text-slate-400")}>
                  Purchase Price
                </span>
                <span className="text-2xl font-black font-serif italic text-white mt-1 block">
                  {formatCurrency(selectedBond.priceDollars)}
                </span>
                <span className="text-[10px] font-mono text-white/40 block mt-0.5">{selectedBond.pricePercent}% of Par</span>
              </div>
            </div>

            {/* Historical Bond Price Chart */}
            <div className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-primary">
                  12-Month Bond Clean Price (% of Par)
                </span>
                <span className="text-xs font-mono text-white/50">
                  Par Value: $1,000.00 • Min Investment: $1,000
                </span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedBond.priceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bondAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={cn("p-2.5 rounded-xl border text-xs shadow-xl", isDark ? "bg-black/90 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}>
                              <p className="font-mono text-white/50 text-[10px]">{payload[0].payload.time}</p>
                              <p className="font-black font-serif italic text-emerald-400 text-sm">{payload[0].value}% of Par (${((Number(payload[0].value) / 100) * 1000).toFixed(2)})</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#bondAreaGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bond Specifications Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6 text-xs">
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Maturity Date</span>
                <span className="font-mono font-bold text-sm">{selectedBond.maturityDate}</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Duration</span>
                <span className="font-mono font-bold text-sm">{selectedBond.durationYears} Years</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Callable Status</span>
                <span className="font-mono font-bold text-sm">{selectedBond.callable ? 'Callable' : 'Non-Callable'}</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Settlement Cycle</span>
                <span className="font-mono font-bold text-sm">{selectedBond.settlementDays}</span>
              </div>
            </div>
          </div>

          {/* User Active Bond Holdings in this bond */}
          {selectedHolding && (
            <div className={cn(
              "p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              isDark ? "bg-emerald-500/5 border-emerald-500/20 text-white" : "bg-emerald-50 border-emerald-200 text-emerald-950"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Landmark size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">Your {selectedBond.symbol} Holdings</h4>
                  <p className="text-xs opacity-75">
                    {selectedHolding.quantity} Bonds (${(selectedHolding.quantity * 1000).toLocaleString()} Par Value) • Avg: ${selectedHolding.average_price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-4 text-right">
                <div>
                  <span className="text-[10px] uppercase opacity-60 block">Market Value</span>
                  <span className="text-lg font-black font-serif italic text-emerald-400">
                    {formatCurrency(selectedHolding.quantity * selectedBond.priceDollars)}
                  </span>
                </div>
                <button
                  onClick={() => openOrder(selectedBond, 'sell')}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Sell
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Bonds Directory & Screener (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={cn(
            "p-6 rounded-3xl border shadow-xl space-y-4",
            isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span>Debt Capital Issues</span>
              </h3>
              <span className="text-[10px] font-mono opacity-60">
                {filteredBonds.length} Issues
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search issuer or CUSIP"
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
                { id: 'all', label: 'All Issues' },
                { id: 'government', label: 'Government' },
                { id: 'corporate', label: 'Corporate' },
                { id: 'municipal', label: 'Municipal' },
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

            {/* Bonds List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredBonds.map((bond) => {
                const isSelected = selectedBond.symbol === bond.symbol;
                const isWatch = watchlistSymbols.includes(bond.symbol);

                return (
                  <div
                    key={bond.symbol}
                    onClick={() => setSelectedBond(bond)}
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
                        onClick={(e) => handleToggleWatch(bond, e)}
                        className={cn(
                          "transition-colors shrink-0",
                          isWatch ? "text-amber-400" : "text-white/20 group-hover:text-white/50"
                        )}
                      >
                        <Star size={15} fill={isWatch ? "currentColor" : "none"} />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-tight">{bond.symbol}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-blue-400 font-bold uppercase">
                            {bond.creditRating}
                          </span>
                        </div>
                        <p className={cn("text-[11px] truncate max-w-[130px]", isDark ? "text-white/60" : "text-slate-500")}>
                          {bond.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-500 block">
                        YTM: {bond.yieldToMaturity}%
                      </span>
                      <span className={cn("text-[10px] font-mono block", isDark ? "text-white/50" : "text-slate-400")}>
                        ${bond.priceDollars.toFixed(2)} ({bond.couponRate}%)
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
        asset={modalTargetAsset || selectedBond}
        initialSide={orderModalSide}
        userHoldingQuantity={selectedHoldingQty}
      />

      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        asset={selectedBond}
        onOpenOrderModal={(asset, side) => openOrder(asset as BondAsset, side)}
        isWatchlisted={watchlistSymbols.includes(selectedBond.symbol)}
        onToggleWatchlist={() => handleToggleWatch(selectedBond)}
      />
    </div>
  );
}
