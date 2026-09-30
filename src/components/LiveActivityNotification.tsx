import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  COUNTRIES, 
  ACTION_WEIGHTS, 
  DEPOSIT_AMOUNTS, 
  WITHDRAW_AMOUNTS, 
  INVESTMENT_AMOUNTS, 
  REWARD_AMOUNTS 
} from './LiveActivityNotificationData';
import { cn } from '../lib/utils';

interface ActivityItem {
  id: string;
  flag: string;
  name: string;
  actionText: string;
  amountText?: string;
  isAmountPositive?: boolean;
}

// Country weights prioritizing Nigeria, UK, US
const COUNTRY_WEIGHTS = [
  { key: "nigeria", weight: 25 },
  { key: "japan", weight: 10 },
  { key: "brazil", weight: 10 },
  { key: "india", weight: 12 },
  { key: "germany", weight: 10 },
  { key: "united_kingdom", weight: 15 },
  { key: "united_states", weight: 15 },
  { key: "uganda", weight: 5 },
  { key: "tanzania", weight: 5 },
  { key: "cameroon", weight: 5 },
  { key: "south_africa", weight: 8 },
  { key: "kenya", weight: 8 },
  { key: "singapore", weight: 8 },
  { key: "switzerland", weight: 5 },
  { key: "netherlands", weight: 5 },
  { key: "sweden", weight: 4 },
  { key: "egypt", weight: 5 },
  { key: "canada", weight: 7 },
  { key: "australia", weight: 7 },
  { key: "bangladesh", weight: 5 }
];

// Helper for deterministic seeded PRNG [0, 1)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Helper to select item from weighted list deterministically
function getDeterministicWeightedRandom<T extends { weight: number }>(items: T[], seed: number): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = seededRandom(seed) * totalWeight;
  for (const item of items) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return items[0];
}

// Flatten all name combinations dynamically on load to create a massive coprime pool
interface NameItem {
  countryKey: string;
  name: string;
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function getCoprime(n: number): number {
  if (n <= 1) return 1;
  let step = Math.floor(n * 0.6) | 1;
  while (gcd(step, n) !== 1) {
    step += 2;
  }
  return step;
}

const FAMOUS_KEYWORDS = [
  "elon", "musk", "zuckerberg", "dangote", "gates", "bezos", "buffett", "trump", "obama", "biden", "putin", "jinping", "modi"
];

function sanitizeIfFamous(name: string): string {
  const norm = name.toLowerCase();
  for (const keyword of FAMOUS_KEYWORDS) {
    if (norm.includes(keyword)) {
      return "Partner";
    }
  }
  return name;
}

const ALL_NAMES: NameItem[] = [];
const countryKeys = Object.keys(COUNTRIES).sort();
for (const key of countryKeys) {
  const country = COUNTRIES[key];
  if (country && country.names) {
    for (const name of country.names) {
      ALL_NAMES.push({ countryKey: key, name });
    }
  }
}

// Generate the synchronized simulated activity based on a slot seed
const getDeterministicActivity = (seed: number): ActivityItem => {
  if (ALL_NAMES.length === 0) {
    return {
      id: `sim-${seed}`,
      flag: "🇺🇸",
      name: "John S.",
      actionText: "Joined"
    };
  }

  // 1. Trace the deterministic full name via coprime index walking to guarantee NO repeats for 72+ hours
  const step = getCoprime(ALL_NAMES.length);
  const nameItem = ALL_NAMES[(seed * step) % ALL_NAMES.length];
  const country = COUNTRIES[nameItem.countryKey] || COUNTRIES.united_states;
  const flag = country.flag;
  const name = sanitizeIfFamous(nameItem.name);

  // 2. Select action deterministically
  const actionObj = getDeterministicWeightedRandom(ACTION_WEIGHTS, seed + 1);
  const action = actionObj.action;

  let actionText = "";
  let amountText: string | undefined;
  let isAmountPositive: boolean | undefined;

  // Verb selection variability seed
  const verbSeed = Math.floor(seededRandom(seed + 2) * 3);

  switch (action) {
    case "joined": {
      const joinVerbs = ["Joined", "Registered"];
      actionText = joinVerbs[verbSeed % joinVerbs.length];
      break;
    }
    case "checked_in": {
      actionText = "Checked In";
      amountText = "+1Point";
      isAmountPositive = true;
      break;
    }
    case "deposited": {
      const depVerbs = ["Deposited", "Funded Wallet", "Added Funds"];
      actionText = depVerbs[verbSeed % depVerbs.length];
      const amtObj = getDeterministicWeightedRandom(DEPOSIT_AMOUNTS, seed + 3);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
    case "invested": {
      const invVerbs = ["Invested", "Activated Node", "Injected Capital"];
      actionText = invVerbs[verbSeed % invVerbs.length];
      const amtObj = getDeterministicWeightedRandom(INVESTMENT_AMOUNTS, seed + 4);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
    case "claimed_reward": {
      const rewardVerbs = ["Claimed Reward", "Claimed Investment Reward", "Earned Capital Yield"];
      actionText = rewardVerbs[verbSeed % rewardVerbs.length];
      const amtObj = getDeterministicWeightedRandom(REWARD_AMOUNTS, seed + 5);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
    case "withdrawn": {
      const witVerbs = ["Withdrawn", "Settled Balance", "Transferred Out"];
      actionText = witVerbs[verbSeed % witVerbs.length];
      const amtObj = getDeterministicWeightedRandom(WITHDRAW_AMOUNTS, seed + 6);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = false;
      break;
    }
    case "activated_investment": {
      const actVerbs = ["Activated Investment", "Activated Node"];
      actionText = actVerbs[verbSeed % actVerbs.length];
      const amtObj = getDeterministicWeightedRandom(INVESTMENT_AMOUNTS, seed + 7);
      amountText = `$${amtObj.value.toLocaleString()}`;
      isAmountPositive = true;
      break;
    }
  }

  return {
    id: `sim-${seed}`,
    flag,
    name,
    actionText,
    amountText,
    isAmountPositive
  };
};

export default function LiveActivityNotification() {
  const [activeNotification, setActiveNotification] = useState<ActivityItem | null>(null);
  const [realNotification, setRealNotification] = useState<ActivityItem | null>(null);
  const lastShownRealIdRef = useRef<string | null>(null);

  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains('light'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 1. Live Firestore listener for real user activity broadcast
  useEffect(() => {
    let clearTimer: NodeJS.Timeout;

    const unsubscribe = onSnapshot(doc(db, 'settings', 'live_activity'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const now = Date.now();
        
        // Fresh if within the last 15 seconds
        if (data.timestamp && (now - data.timestamp < 15000) && data.id !== lastShownRealIdRef.current) {
          lastShownRealIdRef.current = data.id;
          
          setRealNotification({
            id: data.id,
            flag: data.flag || "👤",
            name: sanitizeIfFamous(data.name),
            actionText: data.actionText,
            amountText: data.amountText || undefined,
            isAmountPositive: data.isAmountPositive !== undefined ? data.isAmountPositive : true
          });

          // Pre-empt/dismiss any active simulated cycle instantly
          setActiveNotification(null);

          // Real notification stays on screen for 5 seconds
          clearTimeout(clearTimer);
          clearTimer = setTimeout(() => {
            setRealNotification(null);
          }, 5000);
        }
      }
    }, (err) => {
      console.warn("Live activity subscription error / blocked in sandbox:", err.message);
    });

    return () => {
      unsubscribe();
      clearTimeout(clearTimer);
    };
  }, []);

  // 2. High-precision clock polling for deterministic globally-synchronized simulated notifications
  useEffect(() => {
    const SLOT_DURATION = 20000; // 20 seconds total slot period
    const DISPLAY_DURATION = 5000; // Display on screen for first 5 seconds of the slot

    const updateSimulated = () => {
      // If a prioritized real-time user notification is active, suspend simulations
      if (realNotification) {
        setActiveNotification(null);
        return;
      }

      const now = Date.now();
      const currentSlot = Math.floor(now / SLOT_DURATION);
      const slotTimer = now % SLOT_DURATION;

      if (slotTimer < DISPLAY_DURATION) {
        const simNotif = getDeterministicActivity(currentSlot);
        setActiveNotification(simNotif);
      } else {
        setActiveNotification(null);
      }
    };

    updateSimulated();
    const interval = setInterval(updateSimulated, 500);

    return () => clearInterval(interval);
  }, [realNotification]);

  // Which notification takes visual precedence
  const displayItem = realNotification || activeNotification;

  return (
    <div className="w-full flex justify-center min-h-[26px] items-center pointer-events-none select-none my-0.5">
      <AnimatePresence mode="wait">
        {displayItem && (
          <motion.div
            key={displayItem.id}
            initial={{ opacity: 0, y: 5, scale: 0.995, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, scale: 0.995, filter: 'blur(1px)' }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.6 },
              filter: { duration: 0.6 }
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border max-w-[95%] pointer-events-none select-none fixed z-[45] left-1/2 -translate-x-1/2 top-[140px] lg:top-[174px] backdrop-blur-xl transition-colors duration-300",
              isDark 
                ? "bg-[#04060a]/80 border-white/[0.03] shadow-[0_6px_20px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.02)]" 
                : "bg-white/95 border-slate-200 shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
            )}
          >
            <span className="text-xs shrink-0 flex items-center justify-center filter drop-shadow-sm select-none">
              {displayItem.flag}
            </span>
            <span className={cn(
              "text-[10px] md:text-[11px] font-semibold shrink-0",
              isDark ? "text-white/90" : "text-slate-900"
            )}>
              {displayItem.name}
            </span>
            <span className={cn("text-[9px] select-none mx-0.5", isDark ? "text-white/10" : "text-slate-300")}>—</span>
            <span className={cn(
              "text-[9px] md:text-[10px] font-normal shrink-0",
              isDark ? "text-white/50" : "text-slate-500"
            )}>
              {displayItem.actionText}
            </span>
            {displayItem.amountText && (
              <span className={cn(
                "text-[9px] md:text-[10px] font-bold shrink-0 ml-0.5 tracking-tight",
                displayItem.isAmountPositive 
                  ? (isDark ? "text-emerald-400" : "text-emerald-600") 
                  : (isDark ? "text-rose-400" : "text-rose-600")
              )}>
                {displayItem.amountText}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
