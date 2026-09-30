import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  Landmark, 
  PieChart, 
  Building2, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Star, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Clock,
  Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  StockAsset, 
  BondAsset, 
  MutualFundAsset 
} from '../../services/securitiesData';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: StockAsset | BondAsset | MutualFundAsset | null;
  onOpenOrderModal: (asset: StockAsset | BondAsset | MutualFundAsset, side: 'buy' | 'sell') => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
}

export default function AssetDetailModal({
  isOpen,
  onClose,
  asset,
  onOpenOrderModal,
  isWatchlisted = false,
  onToggleWatchlist
}: AssetDetailModalProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX'>('1M');

  if (!isOpen || !asset) return null;

  const isStock = asset.type === 'stock';
  const isBond = asset.type === 'bond';
  const isFund = asset.type === 'mutual_fund';

  // Chart data extraction
  const chartData = isStock
    ? asset.chartData[activeTimeframe] || asset.chartData['1M']
    : isFund
      ? (activeTimeframe === '1D' || activeTimeframe === '1W' ? asset.chartData['1M'] : (asset.chartData[activeTimeframe as keyof typeof asset.chartData] || asset.chartData['1M']))
      : asset.priceHistory;

  const basePrice = isBond ? asset.priceDollars : isFund ? asset.nav : asset.price;
  const isPositive = isStock ? asset.change >= 0 : isFund ? asset.change >= 0 : true;

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className={cn(
          "relative w-full max-w-4xl rounded-3xl border shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto transition-colors text-left",
          isDark ? "bg-[#0a0d14] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Top Action Bar */}
        <div className="flex items-start justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0",
              isStock ? "bg-blue-500/10 text-blue-400" :
              isBond ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
            )}>
              {isStock ? <TrendingUp size={24} /> : isBond ? <Landmark size={24} /> : <PieChart size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black uppercase tracking-tight">{asset.symbol}</h2>
                <span className={cn(
                  "text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase",
                  isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-700"
                )}>
                  {isStock ? `${asset.exchange} • ${asset.sector}` : isBond ? `${asset.category.toUpperCase()} BOND` : asset.category}
                </span>
                {onToggleWatchlist && (
                  <button
                    onClick={onToggleWatchlist}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isWatchlisted
                        ? "text-amber-400 hover:text-amber-300"
                        : isDark ? "text-white/30 hover:text-white" : "text-slate-300 hover:text-slate-600"
                    )}
                    title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star size={16} fill={isWatchlisted ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
              <p className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-500")}>
                {asset.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenOrderModal(asset, 'buy');
              }}
              className="px-6 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Trade / Buy
            </button>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-xl transition-colors",
                isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-slate-100 text-slate-400"
              )}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Price & Primary Headline */}
        <div className="py-6 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/50" : "text-slate-400")}>
              {isBond ? 'Price per Bond ($1,000 Par)' : isFund ? 'Latest Net Asset Value (NAV)' : 'Current Market Price'}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-serif italic text-primary">
                {formatCurrency(basePrice)}
              </span>
              {!isBond && (
                <span className={cn(
                  "text-sm font-mono font-bold flex items-center",
                  isPositive ? "text-emerald-500" : "text-red-500"
                )}>
                  {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {isPositive ? '+' : ''}{asset.change.toFixed(2)} ({isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%)
                </span>
              )}
              {isBond && (
                <span className="text-sm font-mono font-bold text-emerald-500">
                  YTM: {asset.yieldToMaturity}% • Coupon: {asset.couponRate}%
                </span>
              )}
            </div>
          </div>

          {/* Timeframe Selector */}
          {!isBond && (
            <div className={cn("flex items-center gap-1 p-1 rounded-xl border", isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-100 border-slate-200")}>
              {(isStock ? ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'] : ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX']).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf as any)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition-all",
                    activeTimeframe === tf
                      ? "bg-primary text-white font-black"
                      : isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Chart */}
        <div className={cn("p-4 rounded-2xl border mb-6", isDark ? "bg-white/[0.01] border-white/5" : "bg-slate-50 border-slate-100")}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#009e42" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#009e42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke={isDark ? "#666" : "#aaa"} 
                  tick={{ fontSize: 10, fill: isDark ? "#888" : "#666" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  stroke={isDark ? "#666" : "#aaa"} 
                  tick={{ fontSize: 10, fill: isDark ? "#888" : "#666" }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={cn("p-2.5 rounded-xl border text-xs shadow-lg", isDark ? "bg-black/90 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}>
                          <p className="font-mono text-white/50 text-[10px]">{payload[0].payload.time}</p>
                          <p className="font-black font-serif italic text-primary text-sm">${payload[0].value?.toFixed(2)}</p>
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
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#detailGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION SPECIFIC DETAILS */}
        {/* 1. STOCK DETAILS */}
        {isStock && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                Key Market Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Market Cap</span>
                  <span className="font-mono font-bold text-sm">{(asset.marketCap / 1e9).toFixed(1)}B USD</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>P/E Ratio (TTM)</span>
                  <span className="font-mono font-bold text-sm">{asset.peRatio}x</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Diluted EPS</span>
                  <span className="font-mono font-bold text-sm">${asset.eps}</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Dividend Yield</span>
                  <span className="font-mono font-bold text-sm">{asset.dividendYield}%</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>52-Week Range</span>
                  <span className="font-mono font-bold text-xs">${asset.week52Low} - ${asset.week52High}</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Volume</span>
                  <span className="font-mono font-bold text-sm">{(asset.volume / 1e6).toFixed(1)}M</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Beta (5Y Monthly)</span>
                  <span className="font-mono font-bold text-sm">{asset.beta}</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Previous Close</span>
                  <span className="font-mono font-bold text-sm">${asset.previousClose}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                Company Overview & Profile
              </h3>
              <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-white/80" : "text-slate-600")}>
                {asset.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px] font-mono">
                <div><span className="text-white/40 block">CEO:</span> {asset.ceo}</div>
                <div><span className="text-white/40 block">HQ:</span> {asset.headquarters}</div>
                <div><span className="text-white/40 block">Founded:</span> {asset.founded}</div>
                <div><span className="text-white/40 block">Employees:</span> {asset.employees?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. BOND DETAILS */}
        {isBond && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                Bond Yield, Maturity & Specification
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Yield to Maturity (YTM)</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{asset.yieldToMaturity}%</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Coupon Rate</span>
                  <span className="font-mono font-bold text-sm">{asset.couponRate}%</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Current Yield</span>
                  <span className="font-mono font-bold text-sm">{asset.currentYield}%</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Credit Rating</span>
                  <span className="font-mono font-bold text-sm text-blue-400">{asset.creditRating} ({asset.ratingAgency})</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Maturity Date</span>
                  <span className="font-mono font-bold text-sm">{asset.maturityDate}</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Macaulay Duration</span>
                  <span className="font-mono font-bold text-sm">{asset.durationYears} Years</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Payment Frequency</span>
                  <span className="font-mono font-bold text-sm">{asset.paymentFrequency}</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>CUSIP Identifier</span>
                  <span className="font-mono font-bold text-sm">{asset.cusip}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                Issuer & Security Information
              </h3>
              <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-white/80" : "text-slate-600")}>
                {asset.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px] font-mono">
                <div><span className="text-white/40 block">Issuer:</span> {asset.issuer}</div>
                <div><span className="text-white/40 block">Par Value:</span> $1,000.00</div>
                <div><span className="text-white/40 block">Callable:</span> {asset.callable ? `Yes (Call: ${asset.callDate})` : 'No (Bullet)'}</div>
                <div><span className="text-white/40 block">Settlement:</span> {asset.settlementDays}</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MUTUAL FUND DETAILS */}
        {isFund && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                Fund Profile & Historical Returns
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Net Expense Ratio</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{asset.expenseRatio}%</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Fund Assets (AUM)</span>
                  <span className="font-mono font-bold text-sm">${(asset.aum / 1e9).toFixed(1)}B</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Risk Level</span>
                  <span className="font-mono font-bold text-sm">{asset.riskLevel}</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                  <span className={cn("text-[10px] uppercase font-bold block", isDark ? "text-white/50" : "text-slate-400")}>Distribution Frequency</span>
                  <span className="font-mono font-bold text-sm">{asset.distributionFrequency}</span>
                </div>
              </div>
            </div>

            {/* Performance Matrix */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                Trailing Total Returns (%)
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
                {Object.entries(asset.performance).map(([period, val]) => (
                  <div key={period} className={cn("p-2.5 rounded-xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                    <span className="text-[10px] uppercase font-mono block text-white/50">{period}</span>
                    <span className={cn("text-xs font-mono font-bold mt-1 block", val >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {val >= 0 ? '+' : ''}{val}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 10 Holdings */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                Top Portfolio Holdings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {asset.topHoldings.map((h, i) => (
                  <div key={i} className={cn("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                    <div className="truncate pr-2">
                      <span className="font-bold">{h.name}</span>
                      {h.symbol && <span className="font-mono text-white/50 text-[10px] ml-1.5">({h.symbol})</span>}
                    </div>
                    <span className="font-mono font-bold text-primary shrink-0">{h.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fund Objective */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                Fund Objective & Strategy
              </h3>
              <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-white/80" : "text-slate-600")}>
                {asset.objective}
              </p>
              <p className={cn("text-xs leading-relaxed font-medium mt-2", isDark ? "text-white/60" : "text-slate-500")}>
                {asset.strategy}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 justify-end">
          <button
            onClick={onClose}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all",
              isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-100"
            )}
          >
            Close Overview
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenOrderModal(asset, 'buy');
            }}
            className="px-8 py-3 bg-primary text-white hover:bg-primary/90 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            Execute Order
          </button>
        </div>
      </motion.div>
    </div>
  );
}
