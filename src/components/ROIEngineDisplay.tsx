import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Bot, Zap, Clock } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth, getRoiByAmountDynamic, calculateExpectedDailyRoi } from '../contexts/AuthContext';
import { DynamicBalance } from './DynamicBalance';
import { CandlestickChart, TradingActivity } from './ROIEngineVisuals';

const ROBOT_IMAGES: Record<string, string> = {
  'AI 1.8': 'https://i.imgur.com/qkFHhDR.png',
  'AI 2.0': 'https://i.imgur.com/JGTKlCJ.png',
  'AI 2.5': 'https://i.imgur.com/3DpE79P.png',
  'AI 3.0': 'https://i.imgur.com/dZqi2MZ.png',
};

interface ROIEngineStatsProps {
  investments: any[];
  profile: any;
  user: any;
  variant?: 'home' | 'dashboard';
}

export const ROIEngineStats = React.memo(({ investments, profile, user, variant = 'home' }: ROIEngineStatsProps) => {
  const { plans, expectedDailyRoi } = useAuth();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("24:00:00");
  const [liveEarnings, setLiveEarnings] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeRobotName = profile?.active_robot || 'Default Bot';
  const activeRobotImage = profile?.active_robot && ROBOT_IMAGES[profile.active_robot]
    ? ROBOT_IMAGES[profile.active_robot]
    : 'https://i.imgur.com/swuDIvl.png';

  useEffect(() => {
    let timeoutId: any;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);

      const intervals = [500, 1000, 2000, 3000];
      const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
      timeoutId = setTimeout(triggerBlink, randomInterval);
    };
    timeoutId = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  const activeInvestments = useMemo(() => investments.filter(i => i.status === 'active'), [investments]);
  const activeCount = profile?.migration_status === 'accepted' ? 1 : activeInvestments.length;
  const yieldSum = expectedDailyRoi;

  useEffect(() => {
    if (!user || !profile || activeCount === 0 || !profile.roi_cycle_start) {
      setProgress(0);
      setTimeLeft("24:00:00");
      setLiveEarnings(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      let hours = 24;
      if (activeInvestments && activeInvestments.length > 0) {
        const firstActive = activeInvestments[0];
        const matchingPlan = (plans || []).find((p: any) => 
          p.id === firstActive.plan_id ||
          (p.id || '').toLowerCase() === (firstActive.plan_name || '').toLowerCase() ||
          (p.name || '').toLowerCase() === (firstActive.plan_name || '').toLowerCase() ||
          (firstActive.amount >= p.min && firstActive.amount <= p.max)
        );
        if (matchingPlan && matchingPlan.cycle_duration_hours !== undefined) {
          hours = matchingPlan.cycle_duration_hours;
        }
      }
      const totalDuration = hours * 60 * 60 * 1000;
      const cycleStart = new Date(profile.roi_cycle_start).getTime();
      const elapsed = now - cycleStart;
      
      const currentCycleElapsed = elapsed % totalDuration;
      const currentProgress = (currentCycleElapsed / totalDuration) * 100;
      
      setProgress(currentProgress);
      setLiveEarnings(yieldSum * (currentProgress / 100));

      const diff = Math.max(0, totalDuration - currentCycleElapsed);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.uid, profile?.roi_cycle_start, activeCount, yieldSum, plans, activeInvestments]);

  if (activeCount === 0) {
    if (variant === 'dashboard') {
        return (
            <div 
              className={cn(
                "p-10 border rounded-[40px] flex flex-col items-center justify-center text-center space-y-3 min-h-[300px] relative overflow-visible gpu-accelerate transition-all duration-300",
                isLight 
                  ? "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_0_25px_rgba(255,255,255,0.95)]" 
                  : "bg-[#11141b] border-white/5"
              )}
            >
               <div className="relative mb-2 overflow-visible">
                 <div className={cn(
                   "w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden shadow-inner transition-colors",
                   isLight 
                     ? "bg-slate-100 border-slate-200" 
                     : "bg-[#11141b]/95 border-red-500/20 bg-gradient-to-br from-[#1c1212]/95 to-[#11141b]/95"
                 )}>
                   <div className="w-14 h-14 relative flex items-center justify-center scale-[1.9]">
                     <img 
                       src="https://i.imgur.com/swuDIvl.png" 
                       alt="Premium AI Bot Offline" 
                       referrerPolicy="no-referrer"
                       loading="lazy"
                       decoding="async"
                       className={cn(
                         "w-full h-full object-contain filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)] opacity-20 contrast-75",
                         !isLight && "brightness-[0.4] grayscale"
                       )}
                     />
                   </div>
                 </div>
               </div>
               <h3 className={cn(
                 "text-xl font-black uppercase tracking-widest transition-colors",
                 isLight ? "text-slate-800" : "text-white"
               )}>No active investment</h3>
               <p className={cn(
                 "text-[10px] font-bold uppercase tracking-widest max-w-[200px] transition-colors",
                 isLight ? "text-slate-400" : "text-aura-muted"
               )}>Pulse detected, but no core active.</p>
               <p className={cn(
                 "text-[8px] font-bold tracking-[0.1em] opacity-75 mt-4 border-t pt-3 w-full max-w-[200px] transition-colors",
                 isLight ? "text-slate-400 border-slate-100" : "text-aura-muted border-white/5"
               )}>
                 Activate your first investment to start earning
               </p>
            </div>
        );
    }
    return (
        <div 
          className={cn(
            "w-full border shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md rounded-[24px] p-5 lg:p-6 flex flex-col gap-3 relative overflow-hidden group hover:border-red-500/40 transition-all duration-500 gpu-accelerate",
            isLight 
              ? "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_0_25px_rgba(255,255,255,0.95)]" 
              : "bg-[#0B0D13]/90 border-red-500/20"
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent pointer-events-none z-20" />
          
          <div className="flex items-center gap-4">
            <div className="relative group/bot overflow-visible">
              <div className={cn(
                "w-12 h-12 rounded-xl border flex items-center justify-center overflow-hidden shadow-inner transition-colors",
                isLight 
                  ? "bg-slate-100 border-slate-200" 
                  : "bg-[#11141b]/95 border-red-500/20 bg-gradient-to-br from-[#1c1212]/95 to-[#11141b]/95"
              )}>
                <div className="w-10 h-10 relative flex items-center justify-center scale-[1.9]">
                  <img 
                    src="https://i.imgur.com/swuDIvl.png" 
                    alt="Premium AI Bot Offline" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      "w-full h-full object-contain filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)] opacity-25 contrast-75",
                      !isLight && "brightness-[0.4] grayscale"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col text-left">
              <h3 className={cn(
                "text-xs font-black lowercase tracking-[0.2em] italic font-serif transition-colors",
                isLight ? "text-slate-400" : "text-white"
              )}>engine offline</h3>
            </div>
          </div>

          <div className={cn("text-left mt-1 border-t pt-2 transition-colors", isLight ? "border-slate-100" : "border-white/5")}>
            <p className={cn(
              "text-[8px] font-bold tracking-[0.15em] opacity-75 transition-colors",
              isLight ? "text-slate-400" : "text-aura-muted"
            )}>
              Activate your first investment to start earning
            </p>
          </div>
        </div>
    );
  }

  if (variant === 'dashboard') {
    return (
        <div 
            style={{ willChange: 'transform, opacity' }}
            className={cn(
              "p-10 border rounded-[40px] relative overflow-visible group transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md",
              isLight 
                ? "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_0_25px_rgba(255,255,255,0.95)]" 
                : "bg-[#0B0D13]/90 border-white/10 hover:border-[#009e42]/40"
            )}
        >
            <div className={cn("h-32 mb-10 relative overflow-visible border-b transition-colors", isLight ? "border-slate-100" : "border-white/5")}>
                <div className="absolute inset-0 flex items-end justify-between px-4 gap-2 opacity-40 lg:opacity-50">
                    <CandlestickChart count={30} />
                </div>
                
                <div className="absolute top-4 left-4 lg:top-4 lg:left-6 flex flex-col items-start translate-y-0">
                    <div className="relative group/bot">
                      <div className={cn(
                        "w-10 h-10 lg:w-14 lg:h-14 backdrop-blur-sm rounded-xl lg:rounded-2xl border flex items-center justify-center shadow-xl transition-all",
                        isLight 
                          ? "bg-slate-100 border-slate-200 text-emerald-600" 
                          : "bg-[#11141b]/90 border-white/10 text-primary"
                      )}>
                        <Bot className="w-5 h-5 lg:w-7 lg:h-7 animate-bounce" />
                      </div>
                      {/* Repositioned green indicator to top-right edge in dashboard variant */}
                      <div className="absolute -top-1 -right-1 lg:-top-1.5 lg:-right-1.5 w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981] z-50 pointer-events-none">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                      </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 lg:top-4 lg:right-6">
                    <TradingActivity />
                </div>
                
                <div className="absolute bottom-2 left-4 right-4 flex justify-between">
                    <div className="text-[7px] font-mono flex items-center gap-4 uppercase overflow-visible">
                    <span className={cn("animate-pulse transition-colors", progress > 0 ? (isLight ? "text-emerald-600 font-bold" : "text-primary") : (isLight ? "text-slate-300" : "text-white/20"))}>
                        {progress > 0 ? 'WAVE_SYNC: SUBMITTING' : 'STANDBY'}
                    </span>
                    <span className={cn("hidden md:inline transition-colors", isLight ? "text-slate-200" : "text-white/20")}>|</span>
                    <span className={cn("animate-pulse delay-75 hidden md:inline transition-colors", isLight ? "text-slate-500 font-bold" : "text-white/40")}>CYCLE: {timeLeft}</span>
                    <span className={cn("hidden md:inline transition-colors", isLight ? "text-slate-200" : "text-white/20")}>||</span>
                    <span className={cn("animate-pulse delay-150 transition-colors", isLight ? "text-slate-500 font-bold" : "text-white/40")}>EST_RETURN: ${yieldSum.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-6 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className={cn(
                      "text-xs font-black uppercase tracking-[0.3em] transition-colors",
                      isLight ? "text-slate-400" : "text-aura-muted"
                    )}>ROI Performance Matrix</h3>
                    <div className="flex flex-col items-center md:items-start gap-1 lg:gap-2 w-full pt-16 md:pt-0 overflow-visible">
                    <span className={cn(
                      "text-lg lg:text-2xl font-black italic font-serif tracking-tighter transition-colors",
                      isLight ? "text-slate-400" : "text-white/40"
                    )}>
                        {formatCurrency(yieldSum)} / Day
                    </span>
                    
                    <div className="flex flex-col items-center md:items-start w-full overflow-visible">
                        <DynamicBalance 
                            value={formatCurrency(liveEarnings)} 
                            className="text-emerald-500"
                            containerClassName="justify-center md:justify-start"
                            baseSizeMobile="text-3xl"
                            baseSizeDesktop="lg:text-5xl"
                        />
                    </div>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      isLight ? "text-slate-400" : "text-aura-muted"
                    )}>Time Remaining</p>
                    <p className={cn(
                      "text-3xl font-black italic font-serif font-mono transition-colors",
                      isLight ? "text-slate-800" : "text-white"
                    )}>{timeLeft}</p>
                </div>
            </div>
        </div>
    );
  }

  // DEFAULT (Home variant) - Redesigned Horizontal Card
  return (
    <div 
        className={cn(
          "w-full border shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md rounded-[24px] overflow-hidden flex flex-col md:flex-row items-stretch md:items-center justify-between p-5 lg:p-6 gap-5 relative group hover:border-[#009e42]/40 hover:shadow-[0_0_30px_rgba(0,158,66,0.06)] transition-all duration-500 gpu-accelerate",
          isLight 
            ? "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_0_25px_rgba(255,255,255,0.95)]" 
            : "bg-[#0B0D13]/90 border-white/10"
        )}
    >
        {/* Subtle 3D glossy highlight line overlay */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#10b981]/30 to-transparent pointer-events-none z-20" />
        
        {/* Background Candlestick Chart */}
        <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-15 transition-opacity">
            <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-end justify-between px-2 gap-1">
                <CandlestickChart count={40} />
            </div>
        </div>

        {/* Column 1: Robot Status & Live Indicator */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            {/* Small robot card */}
            <div className={cn(
              "w-12 h-12 lg:w-14 lg:h-14 backdrop-blur-sm rounded-xl border flex items-center justify-center shadow-xl overflow-hidden relative transition-all",
              isLight ? "bg-slate-100 border-slate-200 text-emerald-600" : "bg-[#11141b]/90 border-white/10 text-[#00ffff]"
            )}>
              <motion.div 
                animate={{
                  scale: [0.9, 1.0, 0.9]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-10 h-10 lg:w-12 lg:h-12 relative flex items-center justify-center"
              >
                <img 
                  src={activeRobotImage} 
                  alt={`${activeRobotName} Active`} 
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
            </div>
            {/* Glowing Green/Emerald Indicator sitting across top right edge */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981] z-50 pointer-events-none">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
              isLight ? "text-slate-400" : "text-[#009e42]"
            )}>CGA Nodes Active</span>
            <span className={cn(
              "text-xs font-semibold flex items-center gap-1.5 mt-0.5 transition-colors",
              isLight ? "text-slate-700" : "text-white"
            )}>
              <Zap size={11} className={cn("transition-colors", isLight ? "text-emerald-600" : "text-emerald-400")} /> {activeCount} {activeCount === 1 ? 'Node Online' : 'Nodes Online'}
            </span>
            <div className="mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn(
                "text-[8px] font-mono uppercase tracking-wider transition-colors",
                isLight ? "text-emerald-600 font-bold" : "text-emerald-400/80"
              )}>HFT Trading Loop</span>
            </div>
          </div>
        </div>

        {/* Column 2: Live Earnings Counter & Progress Bar */}
        <div className="flex-1 flex flex-col justify-center min-w-0 relative z-10 md:px-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest transition-colors",
              isLight ? "text-slate-400" : "text-white/40"
            )}>Real-time Earnings</span>
            <span className={cn(
              "text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded transition-colors",
              isLight ? "text-emerald-700 bg-emerald-50" : "text-emerald-400 bg-emerald-500/10"
            )}>
              +{progress.toFixed(0)}%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-2">
            <DynamicBalance 
              value={formatCurrency(liveEarnings)} 
              className={cn(
                "font-serif italic text-left transition-colors",
                isLight ? "text-emerald-600" : "text-emerald-400"
              )}
              containerClassName="justify-start"
              baseSizeMobile="text-2xl"
              baseSizeDesktop="lg:text-2xl"
            />
            <span className={cn(
              "text-[9px] font-semibold tracking-wider uppercase transition-colors",
              isLight ? "text-slate-500" : "text-white/40"
            )}>
              / {formatCurrency(yieldSum)} Daily Return
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className={cn(
              "h-1.5 rounded-full overflow-hidden p-[0.5px] border transition-colors",
              isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/5"
            )}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 via-[#009e42] to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Timer & Countdown */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t border-white/5 md:border-t-0 pt-3 md:pt-0 gap-2 relative z-10 min-w-[120px]">
          <div className="text-left md:text-right">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest transition-colors",
              isLight ? "text-slate-400" : "text-white/40"
            )}>Cycle Timer</span>
            <p className={cn(
              "text-lg font-black italic font-serif font-mono mt-0.5 flex items-center gap-1.5 justify-start md:justify-end transition-colors",
              isLight ? "text-slate-800" : "text-white"
            )}>
              <Clock size={12} className={cn("transition-colors", isLight ? "text-emerald-600" : "text-emerald-400")} />
              <span>{timeLeft}</span>
            </p>
          </div>
        </div>
    </div>
  );
});
