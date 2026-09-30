import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// --- CANDLESTICK CHART COMPONENT ---
interface Candle {
  id: number;
  open: number;
  close: number;
  high: number;
  low: number;
  type: 'bull' | 'bear';
}

export const CandlestickChart = React.memo(({ count = 30, className }: { count?: number, className?: string }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const lastPriceRef = useRef(50);
  const idCounterRef = useRef(0);

  const generateCandle = (prevPrice: number): Candle => {
    const volatility = 8;
    const change = (Math.random() - 0.5) * volatility;
    const open = prevPrice;
    const close = Math.max(10, Math.min(90, prevPrice + change));
    const high = Math.min(100, Math.max(open, close) + Math.random() * 8);
    const low = Math.max(0, Math.min(open, close) - Math.random() * 8);
    const type = close >= open ? 'bull' : 'bear';
    
    return {
      id: idCounterRef.current++,
      open,
      close,
      high,
      low,
      type
    };
  };

  useEffect(() => {
    let currentPrice = lastPriceRef.current;
    const initialCandles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      const candle = generateCandle(currentPrice);
      initialCandles.push(candle);
      currentPrice = candle.close;
    }
    setCandles(initialCandles.reverse());
    lastPriceRef.current = currentPrice;

    // Use a slightly longer interval or randomized one to reduce thread congestion
    const interval = setInterval(() => {
      setCandles(prev => {
        const nextCandle = generateCandle(lastPriceRef.current);
        lastPriceRef.current = nextCandle.close;
        const newCandles = [nextCandle, ...prev.slice(0, -1)];
        return newCandles;
      });
    }, 2000); // Increased interval to 2s for smoother performance

    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className={cn("relative w-full h-full flex items-end overflow-hidden select-none pointer-events-none", className)}>
      <div className="flex items-end justify-start gap-[2px] lg:gap-[4px] h-full w-full">
        <AnimatePresence initial={false}>
          {candles.map((candle) => {
            const bodyHeight = Math.abs(candle.close - candle.open);
            const wickHeight = candle.high - candle.low;
            const bottom = Math.min(candle.open, candle.close);
            const wickBottom = candle.low;

            return (
              <motion.div 
                key={candle.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.8, x: 0 }}
                transition={{ duration: 1, ease: "linear" }}
                className="flex-1 flex flex-col items-center relative min-w-[2px] lg:min-w-[4px]" 
                style={{ height: '100%', transformOrigin: 'bottom', translateZ: 0, willChange: 'transform, opacity' }}
              >
                {/* Wick */}
                <div 
                  className={cn("absolute w-[1px] opacity-30", candle.type === 'bull' ? "bg-emerald-400" : "bg-red-400")}
                  style={{ 
                    height: `${wickHeight}%`,
                    bottom: `${wickBottom}%`
                  }}
                />
                {/* Body */}
                <div 
                  className={cn(
                    "w-full rounded-[1px] relative z-10 transition-all duration-300", 
                    candle.type === 'bull' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.1)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                  )}
                  style={{ 
                    height: `${Math.max(bodyHeight, 2)}%`,
                    bottom: `${bottom}%`
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Glossy Overlay for a "behind glass" look */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-transparent to-transparent pointer-events-none" />
    </div>
  );
});

// --- TRADING ACTIVITY COMPONENT ---
const ASSETS = [
  { pair: 'BTC/USD', category: 'crypto' },
  { pair: 'ETH/USD', category: 'crypto' },
  { pair: 'XRP/USD', category: 'crypto' },
  { pair: 'SOL/USD', category: 'crypto' },
  { pair: 'ADA/USD', category: 'crypto' },
  { pair: 'DOT/USD', category: 'crypto' },
  { pair: 'AVAX/USD', category: 'crypto' },
  { pair: 'AAPL', category: 'stock' },
  { pair: 'TSLA', category: 'stock' },
  { pair: 'NVDA', category: 'stock' },
  { pair: 'AMZN', category: 'stock' },
  { pair: 'MSFT', category: 'stock' },
  { pair: 'GOOGL', category: 'stock' },
  { pair: 'EUR/USD', category: 'forex' },
  { pair: 'GBP/USD', category: 'forex' },
  { pair: 'USD/JPY', category: 'forex' },
  { pair: 'USD/CAD', category: 'forex' },
  { pair: 'GBP/JPY', category: 'forex' },
  { pair: 'XAU/USD', category: 'forex' },
  { pair: 'NASDAQ', category: 'index' },
  { pair: 'US30', category: 'index' },
  { pair: 'S&P 500', category: 'index' },
  { pair: 'GER40', category: 'index' },
];

export const TradingActivity = React.memo(({ className }: { className?: string }) => {
  const [activeItems, setActiveItems] = useState<any[]>([]);

  const getAvailableAssets = () => {
    const now = new Date();
    const day = now.getDay();
    // Simplified weekend logic: Fri evening to Sun evening
    const isWeekend = day === 5 || day === 6 || day === 0;
    return ASSETS.filter(p => p.category === 'crypto' || !isWeekend);
  };

  const generateRandomActivity = () => {
    const available = getAvailableAssets();
    const asset = available[Math.floor(Math.random() * available.length)];
    const isBull = Math.random() > 0.5; // True random direction
    const action = isBull ? 'BUY' : 'SELL';
    const type = isBull ? 'bull' : 'bear';
    const priceChange = (Math.random() * 4 + 0.1).toFixed(2);
    const price = `${isBull ? '+' : '-'}${priceChange}%`;
    
    return {
      id: Math.random() + Date.now(),
      pair: asset.pair,
      action,
      type,
      price,
      category: asset.category
    };
  };

  useEffect(() => {
    // Start with 3 random items
    const initial = [
      generateRandomActivity(),
      generateRandomActivity(),
      generateRandomActivity()
    ];
    setActiveItems(initial);

    const interval = setInterval(() => {
      setActiveItems(prev => {
        return [...prev.slice(1), generateRandomActivity()];
      });
    }, 3000 + Math.random() * 2000); // Increased interval for stability

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col gap-1.5 items-end py-1", className)}>
      <AnimatePresence mode="popLayout">
        {activeItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ x: 30, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -20, opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              opacity: { duration: 0.3 }
            }}
            style={{ willChange: 'transform, opacity', translateZ: 0 }}
            className="overflow-hidden h-[15px] lg:h-[22px] bg-[#0d1017]/90 backdrop-blur-md rounded-md px-1 lg:px-1.5 border border-white/10 shadow-lg flex items-center gap-1 lg:gap-1.5 min-w-[70px] lg:min-w-[95px] justify-between group cursor-default"
          >
            <div className="flex items-center gap-0.5 lg:gap-1">
              <span className={cn(
                "text-[4.5px] lg:text-[7px] font-black tracking-widest px-0.5 lg:px-1 py-0.5 rounded-[2px] leading-none",
                item.id % 2 === 0 ? "animate-pulse" : "", // Subtle pulse
                item.type === 'bull' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              )}>
                {item.action}
              </span>
              <span className="text-[5.5px] lg:text-[8px] font-mono text-white/90 font-black uppercase tracking-tighter leading-none truncate max-w-[30px] lg:max-w-[45px]">
                {item.pair}
              </span>
            </div>
            <span className={cn(
              "text-[5.5px] lg:text-[8px] font-mono font-bold leading-none text-right shrink-0",
              item.type === 'bull' ? "text-emerald-400" : "text-red-400"
            )}>
              {item.price}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
