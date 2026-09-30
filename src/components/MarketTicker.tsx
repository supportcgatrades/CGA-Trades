import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: 'stock' | 'forex' | 'crypto' | 'commodity';
}

const INITIAL_DATA: TickerItem[] = [
  // Stocks (10)
  { symbol: "AAPL", name: "Apple Inc.", price: 182.10, change: 1.25, type: 'stock' },
  { symbol: "MSFT", name: "Microsoft", price: 415.60, change: 0.85, type: 'stock' },
  { symbol: "TSLA", name: "Tesla, Inc.", price: 172.90, change: -2.40, type: 'stock' },
  { symbol: "NVDA", name: "NVIDIA", price: 875.30, change: 3.10, type: 'stock' },
  { symbol: "AMZN", name: "Amazon", price: 178.20, change: 0.45, type: 'stock' },
  { symbol: "META", name: "Meta Platforms", price: 495.10, change: 1.15, type: 'stock' },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 152.40, change: -0.25, type: 'stock' },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 185.20, change: 2.10, type: 'stock' },
  { symbol: "NFLX", name: "Netflix", price: 610.30, change: 0.65, type: 'stock' },
  { symbol: "BRK.B", name: "Berkshire Hathaway", price: 405.10, change: 0.15, type: 'stock' },

  // Forex (10)
  { symbol: "EUR/USD", name: "Euro / US Dollar", price: 1.0852, change: 0.12, type: 'forex' },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", price: 1.2645, change: -0.05, type: 'forex' },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", price: 151.42, change: 0.35, type: 'forex' },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", price: 0.6542, change: -0.25, type: 'forex' },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", price: 1.3562, change: 0.15, type: 'forex' },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", price: 0.9012, change: 0.08, type: 'forex' },
  { symbol: "NZD/USD", name: "NZ Dollar / US Dollar", price: 0.5982, change: -0.12, type: 'forex' },
  { symbol: "EUR/GBP", name: "Euro / British Pound", price: 0.8582, change: 0.04, type: 'forex' },
  { symbol: "EUR/JPY", name: "Euro / Japanese Yen", price: 164.32, change: 0.45, type: 'forex' },
  { symbol: "GBP/JPY", name: "British Pound / Japanese Yen", price: 191.42, change: 0.28, type: 'forex' },

  // Crypto (5)
  { symbol: "BTC/USD", name: "Bitcoin", price: 67432.10, change: 2.45, type: 'crypto' },
  { symbol: "ETH/USD", name: "Ethereum", price: 3412.05, change: 1.85, type: 'crypto' },
  { symbol: "SOL/USD", name: "Solana", price: 185.40, change: 5.12, type: 'crypto' },
  { symbol: "BNB/USD", name: "Binance Coin", price: 585.20, change: -0.45, type: 'crypto' },
  { symbol: "XRP/USD", name: "Ripple", price: 0.6210, change: 0.85, type: 'crypto' },

  // Commodities
  { symbol: "GOLD", name: "Gold", price: 2165.40, change: 0.45, type: 'commodity' },
  { symbol: "SILVER", name: "Silver", price: 24.85, change: -0.15, type: 'commodity' },
];

const TickerCard = React.memo(({ item, isDark, renderSparkline }: { item: TickerItem, isDark: boolean, renderSparkline: (item: TickerItem) => React.ReactNode }) => {
  const getIcon = (item: TickerItem) => {
    switch (item.type) {
      case 'crypto':
        const cryptoName = item.name.toLowerCase().replace(' ', '-');
        return `https://cryptologos.cc/logos/${cryptoName}-${item.symbol.split('/')[0].toLowerCase()}-logo.png?v=024`;
      case 'forex':
        const currency = item.symbol.split('/')[0].toLowerCase();
        const flagMap: Record<string, string> = { 
          eur: 'eu', gbp: 'gb', usd: 'us', jpy: 'jp', aud: 'au', cad: 'ca', chf: 'ch', nzd: 'nz' 
        };
        return `https://flagcdn.com/w40/${flagMap[currency] || 'us'}.png`;
      case 'stock':
        const domainMap: Record<string, string> = {
          AAPL: 'apple.com', MSFT: 'microsoft.com', TSLA: 'tesla.com', NVDA: 'nvidia.com', 
          AMZN: 'amazon.com', META: 'meta.com', GOOGL: 'google.com', AMD: 'amd.com', 
          NFLX: 'netflix.com', 'BRK.B': 'berkshirehathaway.com'
        };
        return `https://logo.clearbit.com/${domainMap[item.symbol] || 'google.com'}`;
      case 'commodity':
        return item.symbol === 'GOLD' 
          ? 'https://cdn-icons-png.flaticon.com/512/2850/2850630.png'
          : 'https://cdn-icons-png.flaticon.com/512/2850/2850638.png';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-6 px-10 border-r transition-all duration-300 h-full",
      isDark ? "border-white/5 text-white" : "border-aura-line text-slate-800"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-6 h-6 flex-shrink-0 relative">
          <img 
            src={getIcon(item)} 
            alt={item.symbol}
            className={cn("w-full h-full object-contain", item.type === 'forex' ? 'rounded-sm' : 'rounded-full')}
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-900")}>{item.symbol}</span>
            <span className="text-[7px] font-black text-aura-muted uppercase opacity-60 hidden sm:inline">{item.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-[13px] font-mono font-bold tracking-tighter", isDark ? "text-white" : "text-slate-800")}>
              {item.type === 'forex' ? item.price.toFixed(4) : item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-black",
              item.change >= 0 ? (isDark ? "text-aura-lime" : "text-emerald-600") : "text-red-500"
            )}>
              {item.change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              <span>{Math.abs(item.change).toFixed(2)}%</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          {renderSparkline(item)}
        </div>
      </div>
    </div>
  );
});

export default function MarketTicker({ isDark }: { isDark: boolean }) {
  const [data, setData] = useState<TickerItem[]>(INITIAL_DATA);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Real-time Simulation / Polling
  // In a real app, this would be a fetch to an API like TwelveData or Binance
  useEffect(() => {
    const updatePrices = () => {
      setData(prev => prev.map(item => {
        // Subtle random fluctuations to simulate live market
        const changeFactor = (Math.random() - 0.5) * 0.001; 
        const newPrice = item.price * (1 + changeFactor);
        const newChange = item.change + (Math.random() - 0.5) * 0.1;

        return {
          ...item,
          price: newPrice,
          change: newChange
        };
      }));
    };

    const interval = setInterval(updatePrices, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // For truly seamless infinite loop, we duplicate the content
  const doubledData = [...data, ...data];

  const renderSparkline = React.useCallback((item: TickerItem) => {
    // Generate a pseudo-random path based on symbol name to make it look unique but consistent
    const seed = item.symbol.charCodeAt(0) + item.symbol.charCodeAt(1);
    const points = [];
    for (let i = 0; i < 8; i++) {
       const jitter = (Math.sin(seed + i) * 5);
       points.push(`${i * 10},${10 + jitter}`);
    }
    const color = item.change >= 0 ? "#009e42" : "#ef4444";
    return (
      <svg width="40" height="20" className="opacity-40" key={item.symbol}>
        <path 
          d={`M 0,10 ${points.map(p => `L ${p}`).join(' ')}`}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }, []);

  return (
    <div className={cn(
      "h-14 border-b flex items-center overflow-hidden relative group transition-colors duration-300",
      isDark ? "bg-[#0b0e14]/90 backdrop-blur-md border-white/5" : "bg-white/90 backdrop-blur-md border-aura-line"
    )}>
      {/* Label for Ticker Source */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 px-6 flex flex-col items-center justify-center z-20 font-black text-[8px] uppercase tracking-[0.2em] italic font-serif border-r",
        isDark ? "bg-[#0d1117] border-white/10 text-aura-lime" : "bg-white border-aura-line text-slate-800"
      )}>
        <div className="relative mb-1">
          <Activity size={10} className={isDark ? "text-aura-lime" : "text-slate-800"} />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#009e42]",
              isDark ? "bg-aura-lime" : "bg-emerald-500"
            )}
          />
        </div>
        <span>Live Market</span>
      </div>

      <div className="flex h-full items-center relative pl-[110px]"> {/* Offset for the absolute label */}
        <div className="flex items-center h-full animate-ticker shrink-0 gpu-accelerate">
          {data.map((item, i) => (
            <TickerCard key={`set1-${item.symbol}-${i}`} item={item} isDark={isDark} renderSparkline={renderSparkline} />
          ))}
        </div>
        <div className="flex items-center h-full animate-ticker shrink-0 gpu-accelerate" aria-hidden="true">
          {data.map((item, i) => (
            <TickerCard key={`set2-${item.symbol}-${i}`} item={item} isDark={isDark} renderSparkline={renderSparkline} />
          ))}
        </div>
      </div>

      {/* Fade Gradients for smooth transition at edges */}
      <div className={cn(
        "absolute inset-y-0 left-[110px] w-20 z-10 pointer-events-none hidden lg:block",
        isDark ? "bg-gradient-to-r from-[#0b0e14] to-transparent" : "bg-gradient-to-r from-white to-transparent"
      )} />
      <div className={cn(
        "absolute inset-y-0 right-0 w-32 z-10 pointer-events-none hidden lg:block",
        isDark ? "bg-gradient-to-l from-[#0b0e14] to-transparent" : "bg-gradient-to-l from-white to-transparent"
      )} />
    </div>
  );
}
