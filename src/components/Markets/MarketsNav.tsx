import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  Landmark, 
  PieChart, 
  Briefcase, 
  Clock, 
  Star, 
  Activity,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getMarketStatus } from '../../services/securitiesData';
import { useTheme } from '../../contexts/ThemeContext';

export default function MarketsNav() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const location = useLocation();
  const marketStatus = getMarketStatus();

  const navItems = [
    { label: 'Stocks', path: '/markets/stocks', icon: TrendingUp },
    { label: 'Bonds', path: '/markets/bonds', icon: Landmark },
    { label: 'Mutual Funds', path: '/markets/mutual-funds', icon: PieChart },
    { label: 'My Portfolio', path: '/markets/portfolio', icon: Briefcase },
    { label: 'Orders', path: '/markets/orders', icon: Clock },
    { label: 'Watchlist', path: '/markets/watchlist', icon: Star },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Top Institutional Market Bar */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-colors",
        isDark 
          ? "bg-white/[0.02] border-white/10 text-white" 
          : "bg-white border-slate-200 text-slate-900 shadow-sm"
      )}>
        {/* Left: Section Identity & Market Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              marketStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            )} />
            <span className="text-xs font-black uppercase tracking-wider font-mono">
              {marketStatus.isOpen ? "US Markets Open" : "US Markets Closed"}
            </span>
          </div>
          <span className={cn("text-xs font-mono", isDark ? "text-white/40" : "text-slate-400")}>•</span>
          <span className={cn("text-xs font-mono hidden sm:inline", isDark ? "text-white/60" : "text-slate-500")}>
            {marketStatus.nextSession} ({marketStatus.timezone})
          </span>
        </div>

        {/* Right: Live Institutional Indices Snapshot */}
        <div className="flex items-center gap-4 text-xs font-mono overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={isDark ? "text-white/50" : "text-slate-400"}>S&P 500:</span>
            <span className="font-bold">5,738.17</span>
            <span className="text-emerald-500 font-semibold flex items-center text-[11px]">
              <ArrowUpRight size={12} />+0.59%
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={isDark ? "text-white/50" : "text-slate-400"}>NASDAQ:</span>
            <span className="font-bold">18,179.98</span>
            <span className="text-emerald-500 font-semibold flex items-center text-[11px]">
              <ArrowUpRight size={12} />+0.68%
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap hidden md:flex">
            <span className={isDark ? "text-white/50" : "text-slate-400"}>US 10Y Yield:</span>
            <span className="font-bold">4.42%</span>
            <span className="text-emerald-500 font-semibold flex items-center text-[11px]">
              <ArrowUpRight size={12} />+2.4 bps
            </span>
          </div>
        </div>
      </div>

      {/* Main Markets Navigation Tabs */}
      <div className={cn(
        "flex items-center gap-1 p-1.5 rounded-2xl border overflow-x-auto scrollbar-none",
        isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-100 border-slate-200"
      )}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/markets/stocks' && location.pathname === '/markets');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                isActive
                  ? isDark
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(0,158,66,0.3)] font-black"
                    : "bg-primary text-white shadow-md font-black"
                  : isDark
                    ? "text-white/60 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
              )}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
