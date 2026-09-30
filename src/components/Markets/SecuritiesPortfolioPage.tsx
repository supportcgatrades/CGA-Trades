import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  Landmark, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Clock, 
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  SecuritiesHoldingRecord, 
  STOCKS_REGISTRY, 
  BONDS_REGISTRY, 
  MUTUAL_FUNDS_REGISTRY,
  findAsset,
  StockAsset,
  BondAsset,
  MutualFundAsset
} from '../../services/securitiesData';
import MarketsNav from './MarketsNav';
import OrderModal from './OrderModal';
import { useNavigate } from 'react-router-dom';

export default function SecuritiesPortfolioPage() {
  const { user, profile } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState<SecuritiesHoldingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Trade modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalSide, setOrderModalSide] = useState<'buy' | 'sell'>('buy');
  const [targetAsset, setTargetAsset] = useState<StockAsset | BondAsset | MutualFundAsset | null>(null);
  const [targetHoldingQty, setTargetHoldingQty] = useState<number>(0);

  // Subscribe to user's securities holdings
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'securities_holdings'),
      where('user_id', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: SecuritiesHoldingRecord[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SecuritiesHoldingRecord);
      });
      setHoldings(list);
      setLoading(false);
    }, (err) => {
      console.warn('Holdings fetch error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Real-time recalculation with latest registry quotes
  const enrichedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const asset = findAsset(h.symbol);
      let latestPrice = h.current_price;
      if (asset) {
        latestPrice = asset.type === 'bond' 
          ? asset.priceDollars 
          : asset.type === 'mutual_fund' 
            ? asset.nav 
            : asset.price;
      }
      const currentValue = parseFloat((h.quantity * latestPrice).toFixed(2));
      const totalInvested = h.total_invested || parseFloat((h.quantity * h.average_price).toFixed(2));
      const unrealizedGainLoss = parseFloat((currentValue - totalInvested).toFixed(2));
      const unrealizedGainLossPct = totalInvested > 0 
        ? parseFloat(((unrealizedGainLoss / totalInvested) * 100).toFixed(2)) 
        : 0;

      return {
        ...h,
        current_price: latestPrice,
        current_value: currentValue,
        unrealized_gain_loss: unrealizedGainLoss,
        unrealized_gain_loss_pct: unrealizedGainLossPct,
        assetRef: asset
      };
    });
  }, [holdings]);

  // Aggregate totals
  const totalMarketValue = useMemo(() => {
    return enrichedHoldings.reduce((sum, h) => sum + h.current_value, 0);
  }, [enrichedHoldings]);

  const totalCostBasis = useMemo(() => {
    return enrichedHoldings.reduce((sum, h) => sum + (h.total_invested || 0), 0);
  }, [enrichedHoldings]);

  const totalUnrealizedGainLoss = totalMarketValue - totalCostBasis;
  const totalUnrealizedGainLossPct = totalCostBasis > 0 ? (totalUnrealizedGainLoss / totalCostBasis) * 100 : 0;
  const availableCash = profile?.available_balance || 0;

  // Breakdown by asset class
  const stockHoldings = enrichedHoldings.filter(h => h.asset_type === 'stock');
  const bondHoldings = enrichedHoldings.filter(h => h.asset_type === 'bond');
  const fundHoldings = enrichedHoldings.filter(h => h.asset_type === 'mutual_fund');

  const stockValue = stockHoldings.reduce((sum, h) => sum + h.current_value, 0);
  const bondValue = bondHoldings.reduce((sum, h) => sum + h.current_value, 0);
  const fundValue = fundHoldings.reduce((sum, h) => sum + h.current_value, 0);
  const totalPortfolioWealth = totalMarketValue + availableCash;

  const stockAllocation = totalPortfolioWealth > 0 ? (stockValue / totalPortfolioWealth) * 100 : 0;
  const bondAllocation = totalPortfolioWealth > 0 ? (bondValue / totalPortfolioWealth) * 100 : 0;
  const fundAllocation = totalPortfolioWealth > 0 ? (fundValue / totalPortfolioWealth) * 100 : 0;
  const cashAllocation = totalPortfolioWealth > 0 ? (availableCash / totalPortfolioWealth) * 100 : 0;

  const handleOpenTrade = (holding: typeof enrichedHoldings[0], side: 'buy' | 'sell') => {
    const asset = holding.assetRef || findAsset(holding.symbol);
    if (asset) {
      setTargetAsset(asset);
      setOrderModalSide(side);
      setTargetHoldingQty(holding.quantity);
      setIsOrderModalOpen(true);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Institutional Sub-Navbar */}
      <MarketsNav />

      {/* Portfolio Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Securities Value */}
        <div className={cn(
          "p-6 rounded-3xl border shadow-lg space-y-2",
          isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/50" : "text-slate-400")}>
            Total Securities Value
          </span>
          <p className="text-3xl font-black font-serif italic text-primary">
            {formatCurrency(totalMarketValue)}
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className={cn(
              "font-mono font-bold flex items-center",
              totalUnrealizedGainLoss >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {totalUnrealizedGainLoss >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {totalUnrealizedGainLoss >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedGainLoss)} ({totalUnrealizedGainLossPct.toFixed(2)}%)
            </span>
            <span className={isDark ? "text-white/40" : "text-slate-400"}>Unrealized</span>
          </div>
        </div>

        {/* Available Cash Balance */}
        <div className={cn(
          "p-6 rounded-3xl border shadow-lg space-y-2",
          isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/50" : "text-slate-400")}>
            Settled Available Cash
          </span>
          <p className="text-3xl font-black font-serif italic text-white">
            {formatCurrency(availableCash)}
          </p>
          <p className={cn("text-xs font-mono pt-1", isDark ? "text-white/50" : "text-slate-500")}>
            Available for immediate trading
          </p>
        </div>

        {/* Total Cost Basis */}
        <div className={cn(
          "p-6 rounded-3xl border shadow-lg space-y-2",
          isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/50" : "text-slate-400")}>
            Cumulative Cost Basis
          </span>
          <p className="text-3xl font-black font-serif italic text-white">
            {formatCurrency(totalCostBasis)}
          </p>
          <p className={cn("text-xs font-mono pt-1", isDark ? "text-white/50" : "text-slate-500")}>
            {enrichedHoldings.length} Active Position{enrichedHoldings.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Combined Account Wealth */}
        <div className={cn(
          "p-6 rounded-3xl border shadow-lg space-y-2",
          isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest block", isDark ? "text-white/50" : "text-slate-400")}>
            Securities Account Equity
          </span>
          <p className="text-3xl font-black font-serif italic text-emerald-400">
            {formatCurrency(totalPortfolioWealth)}
          </p>
          <p className={cn("text-xs font-mono pt-1", isDark ? "text-white/50" : "text-slate-500")}>
            Securities + Liquid Balance
          </p>
        </div>
      </div>

      {/* Asset Allocation Breakdown Bar */}
      <div className={cn(
        "p-6 rounded-3xl border shadow-xl space-y-4",
        isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <PieChart size={16} /> Asset Allocation Matrix
          </h3>
          <span className="text-xs font-mono opacity-60">Total: {formatCurrency(totalPortfolioWealth)}</span>
        </div>

        {/* Segmented Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/5">
          {stockAllocation > 0 && (
            <div 
              style={{ width: `${stockAllocation}%` }} 
              className="bg-blue-500 hover:brightness-110 transition-all cursor-pointer"
              title={`Equities: ${stockAllocation.toFixed(1)}%`}
            />
          )}
          {bondAllocation > 0 && (
            <div 
              style={{ width: `${bondAllocation}%` }} 
              className="bg-emerald-500 hover:brightness-110 transition-all cursor-pointer"
              title={`Bonds: ${bondAllocation.toFixed(1)}%`}
            />
          )}
          {fundAllocation > 0 && (
            <div 
              style={{ width: `${fundAllocation}%` }} 
              className="bg-purple-500 hover:brightness-110 transition-all cursor-pointer"
              title={`Mutual Funds: ${fundAllocation.toFixed(1)}%`}
            />
          )}
          {cashAllocation > 0 && (
            <div 
              style={{ width: `${cashAllocation}%` }} 
              className="bg-primary/40 hover:brightness-110 transition-all cursor-pointer"
              title={`Available Cash: ${cashAllocation.toFixed(1)}%`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <div>
              <span className="font-bold block">Stocks ({stockAllocation.toFixed(1)}%)</span>
              <span className="opacity-60">{formatCurrency(stockValue)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <span className="font-bold block">Bonds ({bondAllocation.toFixed(1)}%)</span>
              <span className="opacity-60">{formatCurrency(bondValue)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
            <div>
              <span className="font-bold block">Mutual Funds ({fundAllocation.toFixed(1)}%)</span>
              <span className="opacity-60">{formatCurrency(fundValue)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary/40 shrink-0" />
            <div>
              <span className="font-bold block">Available Cash ({cashAllocation.toFixed(1)}%)</span>
              <span className="opacity-60">{formatCurrency(availableCash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HOLDINGS TABLES SEGMENTED BY ASSET CLASS */}
      {/* 1. STOCKS HOLDINGS */}
      <div className={cn(
        "p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6",
        isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">Stock Positions ({stockHoldings.length})</h3>
              <p className="text-xs opacity-60">Direct equities portfolio</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/markets/stocks')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            <span>Explore Stocks</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {stockHoldings.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-xs font-mono uppercase tracking-wider">
            No stock positions currently held in your portfolio
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 opacity-60 uppercase font-mono text-[10px]">
                  <th className="pb-3">Symbol / Company</th>
                  <th className="pb-3 text-right">Shares</th>
                  <th className="pb-3 text-right">Avg Purchase</th>
                  <th className="pb-3 text-right">Current Price</th>
                  <th className="pb-3 text-right">Market Value</th>
                  <th className="pb-3 text-right">Unrealized P&L</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stockHoldings.map((h) => {
                  const isPos = h.unrealized_gain_loss >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <span className="font-black uppercase tracking-tight text-sm block">{h.symbol}</span>
                        <span className="text-[11px] opacity-60 truncate max-w-[180px] block">{h.name}</span>
                      </td>
                      <td className="py-4 text-right font-mono font-bold">{h.quantity}</td>
                      <td className="py-4 text-right font-mono">${h.average_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono font-bold">${h.current_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono font-black text-sm">{formatCurrency(h.current_value)}</td>
                      <td className="py-4 text-right font-mono">
                        <span className={cn("font-bold block", isPos ? "text-emerald-500" : "text-red-500")}>
                          {isPos ? '+' : ''}{formatCurrency(h.unrealized_gain_loss)}
                        </span>
                        <span className={cn("text-[10px]", isPos ? "text-emerald-500" : "text-red-500")}>
                          ({isPos ? '+' : ''}{h.unrealized_gain_loss_pct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenTrade(h, 'buy')}
                          className="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg font-bold text-[10px] uppercase transition-all"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => handleOpenTrade(h, 'sell')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-bold text-[10px] uppercase transition-all"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. BOND HOLDINGS */}
      <div className={cn(
        "p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6",
        isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">Bond Holdings ({bondHoldings.length})</h3>
              <p className="text-xs opacity-60">Fixed income capital preservation</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/markets/bonds')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            <span>Explore Bonds</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {bondHoldings.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-xs font-mono uppercase tracking-wider">
            No bond holdings currently in your portfolio
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 opacity-60 uppercase font-mono text-[10px]">
                  <th className="pb-3">Issue / Issuer</th>
                  <th className="pb-3 text-right">Bonds</th>
                  <th className="pb-3 text-right">Face Value</th>
                  <th className="pb-3 text-right">Avg Price</th>
                  <th className="pb-3 text-right">Current Price</th>
                  <th className="pb-3 text-right">Market Value</th>
                  <th className="pb-3 text-right">Unrealized P&L</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bondHoldings.map((h) => {
                  const isPos = h.unrealized_gain_loss >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <span className="font-black uppercase tracking-tight text-sm block">{h.symbol}</span>
                        <span className="text-[11px] opacity-60 truncate max-w-[180px] block">{h.name}</span>
                      </td>
                      <td className="py-4 text-right font-mono font-bold">{h.quantity}</td>
                      <td className="py-4 text-right font-mono">${(h.quantity * 1000).toLocaleString()}</td>
                      <td className="py-4 text-right font-mono">${h.average_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono font-bold">${h.current_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono font-black text-sm">{formatCurrency(h.current_value)}</td>
                      <td className="py-4 text-right font-mono">
                        <span className={cn("font-bold block", isPos ? "text-emerald-500" : "text-red-500")}>
                          {isPos ? '+' : ''}{formatCurrency(h.unrealized_gain_loss)}
                        </span>
                        <span className={cn("text-[10px]", isPos ? "text-emerald-500" : "text-red-500")}>
                          ({isPos ? '+' : ''}{h.unrealized_gain_loss_pct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenTrade(h, 'buy')}
                          className="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg font-bold text-[10px] uppercase transition-all"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => handleOpenTrade(h, 'sell')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-bold text-[10px] uppercase transition-all"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. MUTUAL FUND HOLDINGS */}
      <div className={cn(
        "p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6",
        isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">Mutual Fund Holdings ({fundHoldings.length})</h3>
              <p className="text-xs opacity-60">Diversified pooled asset holdings</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/markets/mutual-funds')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            <span>Explore Funds</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {fundHoldings.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-xs font-mono uppercase tracking-wider">
            No mutual fund units currently held in your portfolio
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 opacity-60 uppercase font-mono text-[10px]">
                  <th className="pb-3">Fund / Ticker</th>
                  <th className="pb-3 text-right">Units Held</th>
                  <th className="pb-3 text-right">Avg NAV</th>
                  <th className="pb-3 text-right">Current NAV</th>
                  <th className="pb-3 text-right">Market Value</th>
                  <th className="pb-3 text-right">Unrealized P&L</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fundHoldings.map((h) => {
                  const isPos = h.unrealized_gain_loss >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <span className="font-black uppercase tracking-tight text-sm block">{h.symbol}</span>
                        <span className="text-[11px] opacity-60 truncate max-w-[180px] block">{h.name}</span>
                      </td>
                      <td className="py-4 text-right font-mono font-bold">{h.quantity}</td>
                      <td className="py-4 text-right font-mono">${h.average_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono font-bold">${h.current_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono font-black text-sm">{formatCurrency(h.current_value)}</td>
                      <td className="py-4 text-right font-mono">
                        <span className={cn("font-bold block", isPos ? "text-emerald-500" : "text-red-500")}>
                          {isPos ? '+' : ''}{formatCurrency(h.unrealized_gain_loss)}
                        </span>
                        <span className={cn("text-[10px]", isPos ? "text-emerald-500" : "text-red-500")}>
                          ({isPos ? '+' : ''}{h.unrealized_gain_loss_pct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenTrade(h, 'buy')}
                          className="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg font-bold text-[10px] uppercase transition-all"
                        >
                          Invest More
                        </button>
                        <button
                          onClick={() => handleOpenTrade(h, 'sell')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-bold text-[10px] uppercase transition-all"
                        >
                          Redeem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {targetAsset && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          asset={targetAsset}
          initialSide={orderModalSide}
          userHoldingQuantity={targetHoldingQty}
        />
      )}
    </div>
  );
}
