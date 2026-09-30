import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Activity,
  Briefcase,
  Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  StockAsset, 
  STOCKS_REGISTRY, 
  getMarketStatus 
} from '../../services/securitiesData';
import { toggleSecuritiesWatchlist } from '../../services/securitiesOrderService';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import MarketsNav from './MarketsNav';
import OrderModal from './OrderModal';
import AssetDetailModal from './AssetDetailModal';
import { toast } from 'sonner';

export default function StocksPage() {
  const { user, profile } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedExchange, setSelectedExchange] = useState<string>('All');
  const [selectedStock, setSelectedStock] = useState<StockAsset>(STOCKS_REGISTRY[0]);
  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX'>('1D');

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalSide, setOrderModalSide] = useState<'buy' | 'sell'>('buy');
  const [modalTargetAsset, setModalTargetAsset] = useState<StockAsset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Firestore real-time subscriptions: Watchlist & Holdings
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [userStockHoldings, setUserStockHoldings] = useState<any[]>([]);

  const marketStatus = getMarketStatus();

  // Subscribe to user's securities watchlist
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'securities_watchlist'),
      where('user_id', '==', user.uid),
      where('asset_type', '==', 'stock')
    );
    const unsub = onSnapshot(q, (snap) => {
      const symbols: string[] = [];
      snap.forEach(d => {
        symbols.push(d.data().symbol);
      });
      setWatchlistSymbols(symbols);
    }, (err) => console.warn('Watchlist listener err:', err));
    return () => unsub();
  }, [user]);

  // Subscribe to user's stock holdings
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'securities_holdings'),
      where('user_id', '==', user.uid),
      where('asset_type', '==', 'stock')
    );
    const unsub = onSnapshot(q, (snap) => {
      const holdings: any[] = [];
      snap.forEach(d => {
        holdings.push({ id: d.id, ...d.data() });
      });
      setUserStockHoldings(holdings);
    }, (err) => console.warn('Holdings listener err:', err));
    return () => unsub();
  }, [user]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return STOCKS_REGISTRY.filter((stock) => {
      const matchSearch = 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = selectedSector === 'All' || stock.sector === selectedSector;
      const matchExchange = selectedExchange === 'All' || stock.exchange === selectedExchange;
      return matchSearch && matchSector && matchExchange;
    });
  }, [searchTerm, selectedSector, selectedExchange]);

  const sectors = ['All', 'Technology', 'Financials', 'Consumer Discretionary', 'Healthcare', 'Communication Services'];
  const exchanges = ['All', 'NASDAQ', 'NYSE'];

  const handleToggleWatch = async (stock: StockAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add to your watchlist');
      return;
    }
    const added = await toggleSecuritiesWatchlist(user.uid, stock.symbol, 'stock', stock.name);
    toast.success(added ? `Added ${stock.symbol} to watchlist` : `Removed ${stock.symbol} from watchlist`);
  };

  const openOrder = (stock: StockAsset, side: 'buy' | 'sell', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalTargetAsset(stock);
    setOrderModalSide(side);
    setIsOrderModalOpen(true);
  };

  const openDetail = (stock: StockAsset) => {
    setSelectedStock(stock);
    setIsDetailModalOpen(true);
  };

  const selectedHolding = userStockHoldings.find(h => h.symbol === selectedStock.symbol);
  const selectedHoldingQty = selectedHolding ? selectedHolding.quantity : 0;
  const chartData = selectedStock.chartData[activeTimeframe] || selectedStock.chartData['1D'];
  const isStockPositive = selectedStock.change >= 0;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Institutional Sub-Navbar */}
      <MarketsNav />

      {/* Main Stock Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Hero Interactive Stock Terminal (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Selected Stock Card */}
          <div className={cn(
            "p-6 sm:p-8 rounded-3xl border shadow-xl transition-all relative overflow-hidden",
            isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
          )}>
            {/* Asset Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{selectedStock.symbol}</span>
                  <span className={cn(
                    "text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase",
                    isDark ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-700"
                  )}>
                    {selectedStock.exchange} • {selectedStock.sector}
                  </span>
                  <button
                    onClick={(e) => handleToggleWatch(selectedStock, e)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      watchlistSymbols.includes(selectedStock.symbol)
                        ? "text-amber-400 hover:text-amber-300"
                        : isDark ? "text-white/30 hover:text-white" : "text-slate-300 hover:text-slate-600"
                    )}
                    title={watchlistSymbols.includes(selectedStock.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star size={18} fill={watchlistSymbols.includes(selectedStock.symbol) ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-500")}>
                  {selectedStock.name}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openOrder(selectedStock, 'buy')}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Buy {selectedStock.symbol}
                </button>
                {selectedHoldingQty > 0 && (
                  <button
                    onClick={() => openOrder(selectedStock, 'sell')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Sell ({selectedHoldingQty})
                  </button>
                )}
                <button
                  onClick={() => openDetail(selectedStock)}
                  className={cn(
                    "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                    isDark ? "border-white/10 hover:bg-white/5 text-white/80" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  Full Bio
                </button>
              </div>
            </div>

            {/* Price & Timeframe Bar */}
            <div className="py-6 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/40" : "text-slate-400")}>
                  Live Institutional Feed Quote
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-5xl font-black font-serif italic text-primary">
                    {formatCurrency(selectedStock.price)}
                  </span>
                  <span className={cn(
                    "text-sm sm:text-base font-mono font-bold flex items-center",
                    isStockPositive ? "text-emerald-500" : "text-red-500"
                  )}>
                    {isStockPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    {isStockPositive ? '+' : ''}{selectedStock.change.toFixed(2)} ({isStockPositive ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Timeframes */}
              <div className={cn("flex items-center gap-1 p-1 rounded-2xl border", isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-100 border-slate-200")}>
                {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'] as const).map((tf) => (
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

            {/* Main Interactive Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#009e42" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#009e42" stopOpacity={0} />
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
                            <p className="font-black font-serif italic text-primary text-base">${payload[0].value?.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#009e42" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#stockAreaGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6 text-xs">
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Market Cap</span>
                <span className="font-mono font-bold text-sm">{(selectedStock.marketCap / 1e9).toFixed(1)}B USD</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>P/E Ratio</span>
                <span className="font-mono font-bold text-sm">{selectedStock.peRatio}x</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>EPS</span>
                <span className="font-mono font-bold text-sm">${selectedStock.eps}</span>
              </div>
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Dividend Yield</span>
                <span className="font-mono font-bold text-sm">{selectedStock.dividendYield}%</span>
              </div>
            </div>
          </div>

          {/* User Active Stock Position (if holding any shares of selected stock) */}
          {selectedHolding && (
            <div className={cn(
              "p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              isDark ? "bg-primary/5 border-primary/20 text-white" : "bg-emerald-50 border-emerald-200 text-emerald-950"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">Your {selectedStock.symbol} Position</h4>
                  <p className="text-xs opacity-75">
                    {selectedHolding.quantity} Shares • Avg Purchase: ${selectedHolding.average_price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-4 text-right">
                <div>
                  <span className="text-[10px] uppercase opacity-60 block">Current Position Value</span>
                  <span className="text-lg font-black font-serif italic text-primary">
                    {formatCurrency(selectedHolding.quantity * selectedStock.price)}
                  </span>
                </div>
                <button
                  onClick={() => openOrder(selectedStock, 'sell')}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Sell
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Stock Screener Directory (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={cn(
            "p-6 rounded-3xl border shadow-xl space-y-4",
            isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span>Market Equities</span>
              </h3>
              <span className="text-[10px] font-mono opacity-60">
                {filteredStocks.length} Quotes
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search symbol or name (e.g. AAPL)"
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-xl text-xs font-medium border outline-none transition-all",
                  isDark
                    ? "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-primary"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary"
                )}
              />
            </div>

            {/* Sector Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                    selectedSector === sec
                      ? "bg-primary text-white"
                      : isDark ? "bg-white/5 text-white/60 hover:text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  )}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Stocks List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredStocks.map((stock) => {
                const isSelected = selectedStock.symbol === stock.symbol;
                const isPos = stock.change >= 0;
                const isWatch = watchlistSymbols.includes(stock.symbol);

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
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
                        onClick={(e) => handleToggleWatch(stock, e)}
                        className={cn(
                          "transition-colors shrink-0",
                          isWatch ? "text-amber-400" : "text-white/20 group-hover:text-white/50"
                        )}
                      >
                        <Star size={15} fill={isWatch ? "currentColor" : "none"} />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-tight">{stock.symbol}</span>
                          <span className="text-[9px] font-mono opacity-50 uppercase">{stock.exchange}</span>
                        </div>
                        <p className={cn("text-[11px] truncate max-w-[130px]", isDark ? "text-white/60" : "text-slate-500")}>
                          {stock.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold block">
                        ${stock.price.toFixed(2)}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono font-bold flex items-center justify-end",
                        isPos ? "text-emerald-500" : "text-red-500"
                      )}>
                        {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
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
        asset={modalTargetAsset || selectedStock}
        initialSide={orderModalSide}
        userHoldingQuantity={selectedHoldingQty}
      />

      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        asset={selectedStock}
        onOpenOrderModal={(asset, side) => openOrder(asset as StockAsset, side)}
        isWatchlisted={watchlistSymbols.includes(selectedStock.symbol)}
        onToggleWatchlist={() => handleToggleWatch(selectedStock)}
      />
    </div>
  );
}
