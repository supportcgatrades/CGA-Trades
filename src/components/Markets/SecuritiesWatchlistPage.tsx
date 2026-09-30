import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  Landmark, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  ExternalLink,
  PlusCircle,
  Activity
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  findAsset, 
  StockAsset, 
  BondAsset, 
  MutualFundAsset, 
  STOCKS_REGISTRY, 
  BONDS_REGISTRY, 
  MUTUAL_FUNDS_REGISTRY 
} from '../../services/securitiesData';
import { toggleSecuritiesWatchlist } from '../../services/securitiesOrderService';
import MarketsNav from './MarketsNav';
import OrderModal from './OrderModal';
import AssetDetailModal from './AssetDetailModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SecuritiesWatchlistPage() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const navigate = useNavigate();

  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [targetAsset, setTargetAsset] = useState<StockAsset | BondAsset | MutualFundAsset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'securities_watchlist'),
      where('user_id', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach(d => {
        items.push({ id: d.id, ...d.data() });
      });
      setWatchlistItems(items);
      setLoading(false);
    }, (err) => {
      console.warn('Watchlist listener err:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleRemove = async (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    await toggleSecuritiesWatchlist(user.uid, item.symbol, item.asset_type, item.name);
    toast.success(`Removed ${item.symbol} from watchlist`);
  };

  const handleTrade = (asset: StockAsset | BondAsset | MutualFundAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetAsset(asset);
    setIsOrderModalOpen(true);
  };

  const handleDetail = (asset: StockAsset | BondAsset | MutualFundAsset) => {
    setTargetAsset(asset);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Institutional Sub-Navbar */}
      <MarketsNav />

      {/* Main Watchlist Container */}
      <div className={cn(
        "p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6",
        isDark ? "bg-[#0b0e14] border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Star size={20} className="text-amber-400 fill-amber-400" />
              <span>Personal Securities Watchlist</span>
            </h3>
            <p className={cn("text-xs mt-1", isDark ? "text-white/60" : "text-slate-500")}>
              Saved institutional assets monitored in real time
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/markets/stocks')}
              className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              + Add Stocks
            </button>
            <button
              onClick={() => navigate('/markets/bonds')}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              + Add Bonds
            </button>
            <button
              onClick={() => navigate('/markets/mutual-funds')}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              + Add Funds
            </button>
          </div>
        </div>

        {watchlistItems.length === 0 ? (
          <div className="text-center py-20 opacity-60 text-xs font-mono uppercase tracking-wider space-y-3">
            <Star size={36} className="mx-auto text-amber-400/50" />
            <p>Your watchlist is currently empty</p>
            <p className="text-[10px] max-w-sm mx-auto font-sans opacity-75">
              Click the star icon next to any Stock, Bond, or Mutual Fund to track its quotes and performance here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlistItems.map((item) => {
              const asset = findAsset(item.symbol);
              if (!asset) return null;

              const isStock = asset.type === 'stock';
              const isBond = asset.type === 'bond';
              const isFund = asset.type === 'mutual_fund';
              const price = isBond ? asset.priceDollars : isFund ? asset.nav : asset.price;
              const isPos = !isBond && (asset.change >= 0);

              return (
                <div
                  key={item.id}
                  onClick={() => handleDetail(asset)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.01]",
                    isDark
                      ? "bg-white/[0.02] border-white/10 hover:border-primary/40 hover:bg-white/[0.04]"
                      : "bg-slate-50 border-slate-200 hover:border-primary/40 hover:bg-white shadow-sm"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                          isStock ? "bg-blue-500/10 text-blue-400" :
                          isBond ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                        )}>
                          {isStock ? <TrendingUp size={16} /> : isBond ? <Landmark size={16} /> : <PieChart size={16} />}
                        </div>
                        <div>
                          <span className="text-sm font-black uppercase tracking-tight block">{asset.symbol}</span>
                          <span className="text-[10px] opacity-50 uppercase font-mono">{asset.type}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleRemove(item, e)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className={cn("text-xs mt-3 truncate font-medium", isDark ? "text-white/70" : "text-slate-600")}>
                      {asset.name}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black font-serif italic text-primary block">
                        {formatCurrency(price)}
                      </span>
                      {!isBond ? (
                        <span className={cn(
                          "text-[10px] font-mono font-bold flex items-center mt-0.5",
                          isPos ? "text-emerald-500" : "text-red-500"
                        )}>
                          {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isPos ? '+' : ''}{asset.change.toFixed(2)} ({isPos ? '+' : ''}{asset.changePercent.toFixed(2)}%)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-0.5">
                          YTM: {asset.yieldToMaturity}% • {asset.couponRate}%
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleTrade(asset, e)}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {targetAsset && (
        <>
          <OrderModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            asset={targetAsset}
          />
          <AssetDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            asset={targetAsset}
            onOpenOrderModal={(asset, side) => {
              setTargetAsset(asset);
              setIsOrderModalOpen(true);
            }}
          />
        </>
      )}
    </div>
  );
}
