import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Trophy,
  History,
  TrendingUp,
  Gift,
  CheckCircle2,
  Volume2,
  VolumeX,
  Smartphone,
  Laptop,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  doc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { toast } from 'sonner';

// Ordered wheel segments - exactly 9 segments matching premium design reference
const WHEEL_SECTORS = [
  { label: '$5,000', value: '5000', color: 'url(#grad-10000)', textColor: '#ffffff', badge: 'Jackpot', category: 'cash' },
  { label: 'MacBook Pro', value: 'macbook', color: 'url(#grad-macbook)', textColor: '#ffffff', badge: 'Workstation', category: 'device' },
  { label: '$2,000', value: '2000', color: 'url(#grad-2000)', textColor: '#ffffff', badge: 'Grand Cash', category: 'cash' },
  { label: '$10', value: '10', color: 'url(#grad-10)', textColor: '#ffffff', badge: 'Cash', category: 'cash' },
  { label: 'Free Spin', value: 'free_spin', color: 'url(#grad-try_again)', textColor: '#ffffff', badge: 'Free Retry', category: 'free' },
  { label: '$100', value: '100', color: 'url(#grad-100)', textColor: '#ffffff', badge: 'Cash', category: 'cash' },
  { label: '$1', value: '1', color: 'url(#grad-1)', textColor: '#ffffff', badge: 'Cash', category: 'cash' },
  { label: 'iPhone 17 Pro Max', value: 'iphone', color: 'url(#grad-iphone)', textColor: '#ffffff', badge: 'Device', category: 'device' },
  { label: 'Try Again', value: 'try_again', color: 'url(#grad-try_again)', textColor: '#ffffff', badge: 'Next Time', category: 'lose' },
];

const ledDots = [...Array(18)].map((_, i) => {
  const angle = i * 20;
  const rad = angle * Math.PI / 180;
  const x = 250 + 236 * Math.cos(rad);
  const y = 250 + 236 * Math.sin(rad);
  const isDelayed = i % 2 === 0;
  return { x, y, isDelayed };
});

export default function SpinAndWin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Navigation states
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Subtle emotional reaction animation trigger for Try Again landing
  const [playTryAgainAnimation, setPlayTryAgainAnimation] = useState(false);

  // --- PREMIUM 3D MECHANICAL POINTER SHIFT STATES ---
  const wheelRef = useRef<HTMLDivElement>(null);

  const [spinDuration, setSpinDuration] = useState(9.5);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        } else {
          return;
        }
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.035);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // safe fallback
    }
  };

  // Real-time animation loop to compute pointer displacement from computed style matrix and play audio clicks
  useEffect(() => {
    if (!isSpinning) {
      return;
    }

    let active = true;
    let lastWedge = -1;

    const updatePointer = () => {
      if (!active) return;

      // Extract raw rotation in degrees dynamically from computed 2D matrix
      if (wheelRef.current) {
        const style = window.getComputedStyle(wheelRef.current);
        const transform = style.transform || style.webkitTransform;
        
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          
          let currentAngle = Math.atan2(b, a) * (180 / Math.PI);
          if (currentAngle < 0) currentAngle += 360;

          // Sound click trigger on wedge border transition (9 segments, 40 degrees each)
          const currentWedge = Math.floor((currentAngle + 20) / 40) % 9;
          if (lastWedge !== -1 && currentWedge !== lastWedge) {
            playTickSound();
          }
          lastWedge = currentWedge;
        }
      }

      requestAnimationFrame(updatePointer);
    };

    requestAnimationFrame(updatePointer);
    return () => {
      active = false;
    };
  }, [isSpinning, soundEnabled]);

  // Popups
  const [isNoFundsModalOpen, setIsNoFundsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [modalResult, setModalResult] = useState<{ type: 'try_again' | 'free_spin' | '1' | '10', title: string, message: string }>({ type: 'try_again', title: '', message: '' });

  // Auto-dismiss the results modal after ~3 seconds
  useEffect(() => {
    if (isResultModalOpen) {
      const timer = setTimeout(() => {
        setIsResultModalOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isResultModalOpen]);

  // Display balances
  const availableBalance = profile?.available_balance ?? 0;
  const rewardBalance = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;

  // Track transaction query with index fallback logic
  useEffect(() => {
    if (!user) return;
    
    // Attempt standard query with ordering (requires composite indexing)
    const qWithIdx = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      where('description', '==', 'Spin & Win Entry'),
      orderBy('created_at', 'desc'),
      limit(15)
    );

    const unsub = onSnapshot(qWithIdx, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setSpinHistory(list);
    }, (error) => {
      console.warn("High-speed direct index lookup failed. Deploying client side dynamic sort fallback.", error);
      
      // Fallback query that does not require compound indexes
      const qFallback = query(
        collection(db, 'transactions'),
        where('user_id', '==', user.uid),
        limit(80)
      );

      return onSnapshot(qFallback, (snapFallback) => {
        const unfiltered = snapFallback.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        const sorted = unfiltered
          .filter((tx: any) => tx.description === 'Spin & Win Entry')
          .sort((a: any, b: any) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return timeB - timeA;
          })
          .slice(0, 15);
        setSpinHistory(sorted);
      }, (err) => {
        console.error("Critical: Failed to read transaction lists", err);
      });
    });

    return () => unsub();
  }, [user]);

  // Polar coordinates to SVG Cartesian conversion helper for layout geometry
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const angleInRadians = (angle - 90) * Math.PI / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const getArcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  // Word wrapping helper for multi-line labels inside wedges
  const getLabelLines = (label: string) => {
    if (label === 'Try Again') return ['Try', 'Again'];
    if (label === 'iPhone 17 Pro Max') return ['iPhone 17', 'Pro Max'];
    if (label === 'MacBook Pro') return ['MacBook', 'Pro'];
    return [label];
  };

  // Center-aligned, responsive, highly illustrative crisp vectors in localized (0,0) space
  const renderSectorIllustration = (value: string, idx: number) => {
    switch (value) {
      case 'try_again':
        return (
          <g>
            {/* Glossy 3D yellow emoji base */}
            <circle cx="0" cy="0" r="2.5" fill="url(#emojiHeadGrad)" stroke="#ca8a04" strokeWidth="0.08" />
            {/* Rim highlight for 3D look */}
            <circle cx="0" cy="0" r="2.35" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.1" />
            <circle cx="-0.8" cy="-0.8" r="1.4" fill="url(#emojiGlowGrad)" opacity="0.65" pointerEvents="none" />
            
            {/* Sad downturned eyebrows */}
            <path d="M -1.0 -0.9 Q -0.6 -1.25 -0.2 -0.9" fill="none" stroke="#713f12" strokeWidth="0.25" strokeLinecap="round" />
            <path d="M 1.0 -0.9 Q 0.6 -1.25 0.2 -0.9" fill="none" stroke="#713f12" strokeWidth="0.25" strokeLinecap="round" />
            
            {/* Down-curved squinting sad eyes */}
            <path d="M -0.9 -0.3 Q -0.6 -0.05 -0.3 -0.3" fill="none" stroke="#713f12" strokeWidth="0.3" strokeLinecap="round" />
            <path d="M 0.9 -0.3 Q 0.6 -0.05 0.3 -0.3" fill="none" stroke="#713f12" strokeWidth="0.3" strokeLinecap="round" />
            
            {/* Sad frowning mouth */}
            <path d="M -0.7 0.9 Q 0 0.15 0.7 0.9" fill="none" stroke="#713f12" strokeWidth="0.35" strokeLinecap="round" />

            {/* Rosy cheeks */}
            <circle cx="-1.0" cy="0.3" r="0.4" fill="#ef4444" opacity="0.4" />
            <circle cx="1.0" cy="0.3" r="0.4" fill="#ef4444" opacity="0.4" />

            {/* Elegant teardrop animation - triggered only if landed on and active */}
            {playTryAgainAnimation && (
              <>
                <motion.path 
                  d="M -0.6 -0.1 C -0.8 0.5 -0.8 1.1 -0.6 1.4 C -0.4 1.6 -0.2 1.5 -0.2 1.2 C -0.2 0.9 -0.4 0.5 -0.4 -0.1 Z"
                  fill="url(#tearGrad)"
                  initial={{ scale: 0, y: 0 }}
                  animate={{ scale: [0, 1.2, 1, 0.8], y: [0, 0.3, 0.9, 1.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.path 
                  d="M 0.6 -0.1 C 0.8 0.5 0.8 1.1 0.6 1.4 C 0.4 1.6 0.2 1.5 0.2 1.2 C 0.2 0.9 0.4 0.5 0.4 -0.1 Z"
                  fill="url(#tearGrad)"
                  initial={{ scale: 0, y: 0 }}
                  animate={{ scale: [0, 1.2, 1, 0.8], y: [0, 0.3, 0.9, 1.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
                />
              </>
            )}
          </g>
        );
      case '10':
        return (
          <g>
            {/* Soft cash shadow */}
            <rect x="-1.9" y="-0.85" width="3.8" height="1.8" rx="0.1" fill="rgba(0,0,0,0.45)" transform="rotate(-6)" />
            {/* Background offset cash bills to form a stack */}
            <g transform="rotate(-6) translate(0.1, -0.1)">
              <rect x="-1.9" y="-0.85" width="3.8" height="1.8" rx="0.1" fill="#15803d" stroke="#14532d" strokeWidth="0.1" />
              <rect x="-1.7" y="-0.7" width="3.4" height="1.5" fill="#22c55e" opacity="0.6" />
            </g>
            <g transform="rotate(4) translate(-0.15, 0.05)">
              <rect x="-1.9" y="-0.85" width="3.8" height="1.8" rx="0.1" fill="#16a34a" stroke="#14532d" strokeWidth="0.08" />
              <rect x="-1.7" y="-0.7" width="3.4" height="1.5" fill="#4ade80" opacity="0.5" />
            </g>
            {/* Top clean detailed banknote */}
            <g>
              <rect x="-1.9" y="-0.85" width="3.8" height="1.8" rx="0.15" fill="url(#cashGreenGrad)" stroke="#14532d" strokeWidth="0.12" />
              {/* Banknote classic ornate frame border */}
              <rect x="-1.75" y="-0.72" width="3.5" height="1.44" rx="0.08" fill="none" stroke="#166534" strokeWidth="0.06" />
              <rect x="-1.68" y="-0.66" width="3.36" height="1.32" rx="0.05" fill="none" stroke="#86efac" strokeWidth="0.04" strokeDasharray="0.1 0.05" />
              
              {/* Corner numbers */}
              <text x="-1.5" y="-0.38" fontSize="0.45" fontWeight="900" fill="#14532d" fontFamily="monospace">10</text>
              <text x="1.5" y="-0.38" fontSize="0.45" fontWeight="900" fill="#14532d" fontFamily="monospace" textAnchor="end">10</text>
              <text x="-1.5" y="0.52" fontSize="0.45" fontWeight="900" fill="#14532d" fontFamily="monospace">10</text>
              <text x="1.5" y="0.52" fontSize="0.45" fontWeight="900" fill="#14532d" fontFamily="monospace" textAnchor="end">10</text>

              {/* Central portrait frame / decorative seal */}
              <circle cx="0" cy="0" r="0.48" fill="#15803d" opacity="0.15" stroke="#166534" strokeWidth="0.05" />
              <circle cx="0" cy="0" r="0.38" fill="none" stroke="#22c55e" strokeWidth="0.04" strokeDasharray="0.08 0.04" />
              
              {/* Highly bold central value */}
              <text x="0" y="0.28" textAnchor="middle" fontSize="0.95" fontWeight="1000" fill="#14532d" fontFamily="sans-serif" letterSpacing="-0.02">$10</text>
              
              {/* Security ribbon/strip reflection */}
              <rect x="-0.8" y="-0.72" width="0.12" height="1.44" fill="url(#goldRim)" opacity="0.7" />
              
              {/* Subtle design patterns */}
              <path d="M -1.2 0.4 Q -0.9 0.2 -0.6 0.4" fill="none" stroke="#15803d" strokeWidth="0.05" />
              <path d="M 0.6 0.4 Q 0.9 0.2 1.2 0.4" fill="none" stroke="#15803d" strokeWidth="0.05" />
            </g>
          </g>
        );
      case 'iphone':
        return (
          <g>
            {/* Outer Drop Shadow */}
            <rect x="-1.55" y="-2.65" width="3.1" height="5.2" rx="0.55" fill="rgba(0,0,0,0.55)" />
            
            {/* Titanium Outer Chassis with detailed beveled edge */}
            <rect x="-1.45" y="-2.55" width="2.9" height="5.1" rx="0.52" fill="url(#iphoneMetal)" stroke="#1e293b" strokeWidth="0.05" />
            {/* Inner titanium shine bezel */}
            <rect x="-1.41" y="-2.51" width="2.82" height="5.02" rx="0.48" fill="none" stroke="#f1f5f9" strokeWidth="0.04" opacity="0.6" />
            
            {/* Black OLED Screen border bezel */}
            <rect x="-1.37" y="-2.47" width="2.74" height="4.94" rx="0.44" fill="#09090b" />
            
            {/* Dynamic AMOLED Fluid wallpaper screen area */}
            <rect x="-1.28" y="-2.38" width="2.56" height="4.76" rx="0.36" fill="url(#iphoneScreen)" />
            {/* Fluid Wallpaper Glowing Orbs */}
            <circle cx="-0.5" cy="-1.0" r="1.4" fill="#a855f7" opacity="0.45" />
            <circle cx="0.5" cy="1.0" r="1.5" fill="#3b82f6" opacity="0.4" />
            <path d="M -1.28 2.0 Q -0.5 1.0 1.28 1.8 L 1.28 2.38 L -1.28 2.38 Z" fill="#ec4899" opacity="0.35" />

            {/* Glass shine reflection across the screen */}
            <path d="M -1.28 -2.38 L 1.1 -2.38 L -1.28 1.9 Z" fill="url(#iphoneGlassRef)" opacity="0.25" />
            
            {/* Precise Dynamic Island */}
            <g transform="translate(0, -2.12)">
              <rect x="-0.42" y="-0.09" width="0.84" height="0.18" rx="0.09" fill="#000000" />
              {/* Camera Lens gloss */}
              <circle cx="-0.2" cy="0" r="0.04" fill="#171717" />
              <circle cx="-0.2" cy="0" r="0.02" fill="#042f2e" />
              <circle cx="0.22" cy="0" r="0.03" fill="#1e1b4b" />
              <circle cx="0.22" cy="0" r="0.01" fill="#4338ca" />
            </g>

            {/* Screen widgets structure (Time and dynamic circles) to make it look active! */}
            <text x="0" y="-1.5" textAnchor="middle" fontSize="0.4" fontWeight="950" fill="#ffffff" fontFamily="sans-serif" opacity="0.95">09:41</text>
            <circle cx="0" cy="0.1" r="0.52" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.05" strokeDasharray="0.1 0.08" />
            <circle cx="0" cy="0.1" r="0.4" fill="rgba(255,255,255,0.08)" />
            <path d="M -0.15 0.1 L 0 0.1 L 0 -0.15" fill="none" stroke="#ffffff" strokeWidth="0.05" strokeLinecap="round" />
            
            {/* Side hardware buttons (Power and Action/Volume) */}
            <rect x="-1.5" y="-1.5" width="0.06" height="0.4" rx="0.03" fill="#64748b" />
            <rect x="-1.5" y="-1.0" width="0.06" height="0.3" rx="0.03" fill="#64748b" />
            <rect x="1.44" y="-1.3" width="0.06" height="0.45" rx="0.03" fill="#64748b" />
          </g>
        );
      case '1000':
        return (
          <g>
            {/* Ambient drop shadow */}
            <polygon points="-1.9,0.7 -0.4,1.1 1.9,0.6 0.9,-1.0 -0.9,-1.1" fill="rgba(0,0,0,0.55)" />
            {/* Gold Bar 1 (Bottom Left) */}
            <g transform="translate(-0.6, 0.4) rotate(-5)">
              <path d="M -1.2 0.4 L -0.5 -0.6 L 0.8 -0.7 L 0.2 0.3 Z" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.08" />
              <polygon points="-1.2,0.4 -0.5,-0.6 0.8,-0.7 0.2,0.3" fill="none" stroke="#fef08a" strokeWidth="0.03" />
            </g>
            {/* Gold Bar 2 (Bottom Right) */}
            <g transform="translate(0.5, 0.3) rotate(8)">
              <path d="M -1.2 0.4 L -0.5 -0.6 L 0.8 -0.7 L 0.2 0.3 Z" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.08" />
              <polygon points="-1.2,0.4 -0.5,-0.6 0.8,-0.7 0.2,0.3" fill="none" stroke="#fef08a" strokeWidth="0.03" />
            </g>
            {/* Top Main Highlight Gold Bar */}
            <g transform="translate(0, -0.3) scale(1.1)">
              {/* Beveled pristine Gold Bar */}
              <path d="M -1.1 0.4 L -0.4 -0.6 L 0.8 -0.7 L 0.2 0.3 Z" fill="url(#goldBarGradLighter)" stroke="#854d0e" strokeWidth="0.08" />
              {/* Highlight bezel line */}
              <path d="M -1.05 0.35 L -0.38 -0.53 L 0.73 -0.63" fill="none" stroke="#ffffff" strokeWidth="0.06" opacity="0.8" />
              <path d="M 0.2 0.28 L 0.75 -0.63" fill="none" stroke="#ffffff" strokeWidth="0.04" opacity="0.5" />
              <text x="-0.15" y="-0.15" transform="skewX(-28) rotate(-7)" fontSize="0.55" fill="#451a03" fontWeight="950" letterSpacing="0.05">999.9</text>
              <text x="0.18" y="0.25" transform="skewX(-28) rotate(-7)" fontSize="0.5" fill="#78350f" fontWeight="900" letterSpacing="0.1">GOLD</text>
            </g>
            {/* Multiple sparkly premium reflections */}
            <path d="M 1.2 -1.1 Q 1.2 -0.8 1.5 -0.8 Q 1.2 -0.8 1.2 -0.5 Q 1.2 -0.8 0.9 -0.8 Q 1.2 -0.8 1.2 -1.1 Z" fill="#ffffff" />
            <path d="M -1.3 0.8 Q -1.3 1.0 -1.1 1.0 Q -1.3 1.0 -1.3 1.2 Q -1.3 1.0 -1.5 1.0 Q -1.3 1.0 -1.3 0.8 Z" fill="#ffffff" transform="scale(0.7)" />
          </g>
        );
      case '1':
        return (
          <g>
            {/* Outer deep shadow ring */}
            <circle cx="0" cy="0" r="2.3" fill="rgba(0,0,0,0.3)" />
            {/* Multi-tiered gold/bronze outer rim */}
            <circle cx="0" cy="0" r="2.2" fill="url(#goldRim)" stroke="#451a03" strokeWidth="0.08" />
            <circle cx="0" cy="0" r="1.9" fill="url(#bronzeCoinId)" stroke="#ca8a04" strokeWidth="0.05" />
            {/* Ridges/Reeds on the edge of custom coin */}
            <circle cx="0" cy="0" r="1.75" fill="none" stroke="#fef08a" strokeWidth="0.08" strokeDasharray="0.15 0.15" />
            {/* Polished inner face */}
            <circle cx="0" cy="0" r="1.45" fill="url(#bronzeCoinIdLighter)" />
            {/* Embossed elegant "$" symbol and details */}
            <text x="0" y="0.8" textAnchor="middle" fontSize="2.5" fontWeight="950" fill="#451a03" fontFamily="Georgia, serif" style={{ filter: 'drop-shadow(0.5px 1px 1px rgba(255,255,255,0.6))' }}>$</text>
            {/* Micro-stars on sides */}
            <path d="M -0.95 0 L -0.85 0.1 L -0.9 0.25 L -1.0 0.15 L -1.1 0.25 L -1.05 0.1 L -1.15 0 L -1.0 0 L -0.95 0 Z" fill="#b45309" transform="scale(0.8)" />
            <path d="M 0.95 0 L 1.05 0.1 L 1.0 0.25 L 0.9 0.15 L 0.8 0.25 L 0.85 0.1 L 0.75 0 L 0.9 0 L 0.95 0 Z" fill="#b45309" transform="scale(0.8)" />
          </g>
        );
      case '5000':
        return (
          <g>
            {/* Shadow of the luxury bag */}
            <ellipse cx="0" cy="1.6" rx="1.6" ry="0.4" fill="rgba(0,0,0,0.5)" />
            
            {/* Overflowing Gold Coins & Stacks behind/under neck */}
            <g transform="translate(0, -0.7)">
              <circle cx="-0.8" cy="0.1" r="0.32" fill="url(#goldBarGradLighter)" stroke="#b45309" strokeWidth="0.05" />
              <circle cx="0.8" cy="0.1" r="0.32" fill="url(#goldBarGradLighter)" stroke="#b45309" strokeWidth="0.05" />
              <circle cx="-0.3" cy="-0.1" r="0.32" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.05" />
              <circle cx="0.3" cy="-0.1" r="0.32" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.05" />
              <circle cx="0" cy="-0.2" r="0.35" fill="url(#goldBarGradLighter)" stroke="#ca8a04" strokeWidth="0.05" />
            </g>

            {/* Canvas Sack Body with luxury fabric color grading */}
            <path d="M -1.5 1.4 C -2.3 1.4 -2.1 -0.2 -1.1 -0.6 C -0.8 -0.9 -1.2 -1.4 -0.6 -1.4 L 0.6 -1.4 C 1.2 -1.4 0.8 -0.9 1.1 -0.6 C 2.1 -0.2 2.3 1.4 1.5 1.4 Z" fill="url(#greenMoneyBag)" stroke="#022c22" strokeWidth="0.15" />
            
            {/* Fold highlights for cloth realism */}
            <path d="M -1.5 1.0 C -1.0 1.3 1.0 1.3 1.5 1.0" fill="none" stroke="#22c55e" strokeWidth="0.08" opacity="0.3" />
            <path d="M -1.0 0.2 C -0.6 0.5 0.6 0.5 1.0 0.2" fill="none" stroke="#22c55e" strokeWidth="0.1" opacity="0.25" />
            <path d="M -1.2 -0.3 C -0.8 -0.1 0.8 -0.1 1.2 -0.3" fill="none" stroke="#22c55e" strokeWidth="0.08" opacity="0.2" />

            {/* Roped Neck Tie (Golden Rope braided detail) */}
            <path d="M -0.85 -0.65 Q 0 -1.1 0.85 -0.65" fill="none" stroke="#fbbf24" strokeWidth="0.26" strokeLinecap="round" />
            <path d="M -0.85 -0.65 Q 0 -1.1 0.85 -0.65" fill="none" stroke="#b45309" strokeWidth="0.2" strokeDasharray="0.12 0.08" strokeLinecap="round" />
            
            {/* Elegant Golden Bow Ribbon Nodes */}
            <circle cx="-0.65" cy="-0.4" r="0.24" fill="none" stroke="#fbbf24" strokeWidth="0.12" />
            <circle cx="-0.4" cy="-0.3" r="0.2" fill="none" stroke="#f59e0b" strokeWidth="0.1" />
            <path d="M -0.45 -0.45 L -0.9 0.1" stroke="#fbbf24" strokeWidth="0.12" strokeLinecap="round" />
            <path d="M -0.45 -0.45 L -0.65 0.2" stroke="#f59e0b" strokeWidth="0.1" strokeLinecap="round" />

            {/* Pristine Gold Stamped typography overlay */}
            <text x="0" y="0.8" textAnchor="middle" fontSize="1.8" fontWeight="1000" fill="#fef08a" fontFamily="sans-serif" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.95))' }}>$5K</text>
            <text x="0" y="1.2" textAnchor="middle" fontSize="0.7" fontWeight="900" fill="#fbbf24" fontFamily="sans-serif" letterSpacing="0.1" style={{ filter: 'drop-shadow(0px 1px 1.5px rgba(0,0,0,0.85))' }}>BAG</text>
            
            {/* Sparkles of the Jackpot bag */}
            <path d="M -1.2 -1.1 Q -1.2 -0.8 -0.9 -0.8 Q -1.2 -0.8 -1.2 -0.5 Q -1.2 -0.8 -1.5 -0.8 Q -1.2 -0.8 -1.2 -1.1 Z" fill="#ffffff" />
            <path d="M 1.2 -0.8 Q 1.2 -0.6 1.4 -0.6 Q 1.2 -0.6 1.2 -0.4 Q 1.2 -0.6 1.0 -0.6 Q 1.2 -0.6 1.2 -0.8 Z" fill="#ffffff" transform="scale(0.8)" />
          </g>
        );
      case 'macbook':
        return (
          <g>
            {/* Laptop Bottom shadow */}
            <path d="M -2.4 1.4 L 2.4 1.4 L 2.1 1.6 L -2.1 1.6 Z" fill="rgba(0,0,0,0.5)" />
            
            {/* Open Lid Screen Shell */}
            <rect x="-1.9" y="-1.85" width="3.8" height="2.22" rx="0.18" fill="#475569" stroke="#0f172a" strokeWidth="0.05" />
            {/* Screen outer silver bevel line */}
            <rect x="-1.86" y="-1.81" width="3.72" height="2.14" rx="0.14" fill="none" stroke="#94a3b8" strokeWidth="0.03" opacity="0.6" />
            {/* Absolute black bezel */}
            <rect x="-1.8" y="-1.75" width="3.6" height="2.02" rx="0.08" fill="#000000" />
            
            {/* Glowing Active Liquid Retina Wallpaper */}
            <rect x="-1.72" y="-1.67" width="3.44" height="1.84" rx="0.04" fill="url(#macbookOledWallpaper)" />
            {/* Liquid mesh curves inside screen */}
            <circle cx="0.8" cy="-0.6" r="1.4" fill="#3b82f6" opacity="0.60" />
            <circle cx="-0.8" cy="-0.9" r="1.2" fill="#ec4899" opacity="0.40" />
            <circle cx="0" cy="0" r="1.0" fill="#10b981" opacity="0.30" />

            {/* Screen Glass Shine reflection */}
            <path d="M -1.72 -1.67 L 1.0 -1.67 L -1.72 0.1 Z" fill="url(#iphoneGlassRef)" opacity="0.25" />
            
            {/* Webcam Notch */}
            <rect x="-0.3" y="-1.75" width="0.6" height="0.12" rx="0.04" fill="#000000" />
            <circle cx="0.08" cy="-1.69" r="0.02" fill="#059669" />

            {/* Laptop Base Deck Aluminum Structure (Perspective wedges) */}
            <path d="M -1.91 0.37 L -2.15 1.15 C -2.17 1.25 -2.08 1.35 -1.97 1.35 L 1.97 1.35 C 2.08 1.35 2.17 1.25 2.15 1.15 L 1.91 0.37 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.05" />
            {/* Keyboard Deck inner recess */}
            <polygon points="-1.65,0.45 -1.82,0.95 1.82,0.95 1.65,0.45" fill="#1e293b" stroke="#0f172a" strokeWidth="0.04" />
            {/* Individual black keyboard key stripes */}
            <line x1="-1.6,0.55" x2="1.6,0.55" stroke="#000" strokeWidth="0.06" />
            <line x1="-1.66,0.67" x2="1.66,0.67" stroke="#000" strokeWidth="0.06" />
            <line x1="-1.72,0.79" x2="1.72,0.79" stroke="#000" strokeWidth="0.06" />
            <line x1="-1.78,0.91" x2="1.78,0.91" stroke="#000" strokeWidth="0.06" strokeDasharray="0.16 0.08" />

            {/* Trackpad recessed slot */}
            <rect x="-0.45" y="1.0" width="0.9" height="0.26" rx="0.04" fill="none" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="0.04" />
            {/* Deck center notch line */}
            <path d="M -0.32 1.3 L 0.32 1.3" fill="none" stroke="#475569" strokeWidth="0.04" strokeLinecap="round" />
          </g>
        );
      case '100':
        return (
          <g>
            {/* Outer deep real shadow */}
            <circle cx="0" cy="0.1" r="2.2" fill="rgba(0,0,0,0.4)" />
            {/* Multi-tiered silver/platinum shiny coin */}
            <circle cx="0" cy="0" r="2.2" fill="url(#silverCoinId)" stroke="#334155" strokeWidth="0.08" />
            <circle cx="0" cy="0" r="1.95" fill="none" stroke="#ffffff" strokeWidth="0.08" opacity="0.6" />
            {/* Reeding / Ridges edge pattern */}
            <circle cx="0" cy="0" r="1.8" fill="none" stroke="#94a3b8" strokeWidth="0.08" strokeDasharray="0.16 0.1" />
            {/* Ultra-polished inner reflect circle */}
            <circle cx="0" cy="0" r="1.5" fill="url(#silverCoinIdLighter)" />
            <circle cx="-0.4" cy="-0.4" r="1.0" fill="url(#silverGlow)" opacity="0.6" />
            
            {/* Elegant large $100 center display */}
            <text x="0" y="0.55" textAnchor="middle" fontSize="1.5" fontWeight="1000" fill="#0f172a" fontFamily="sans-serif" style={{ filter: 'drop-shadow(0.5px 1px 1px rgba(255,255,255,0.8))' }}>$100</text>
            
            {/* Ornate leaf branches inside */}
            <path d="M -1.1 0.4 Q -0.8 1.0 0 1.0 Q -0.5 0.7 -0.8 0.4 Z" fill="#64748b" opacity="0.4" />
            <path d="M 1.1 0.4 Q 0.8 1.0 0 1.0 Q 0.5 0.7 0.8 0.4 Z" fill="#64748b" opacity="0.4" />
            
            {/* Star sparkles */}
            <path d="M 0.8 -0.8 Q 0.8 -0.5 1.1 -0.5 Q 0.8 -0.5 0.8 -0.2 Q 0.8 -0.5 0.5 -0.5 Q 0.8 -0.5 0.8 -0.8 Z" fill="#ffffff" />
          </g>
        );
      case 'free_spin':
        return (
          <g>
            {/* Dark background capsule glow */}
            <circle cx="0" cy="0" r="2.2" fill="rgba(20,184,166,0.15)" stroke="#115e59" strokeWidth="0.08" />
            {/* Semi-transparent glossy ring */}
            <circle cx="0" cy="0" r="1.8" fill="none" stroke="#000000" strokeWidth="0.3" opacity="0.4" />
            
            {/* Dual glowing arrows forming perfect loops */}
            <path d="M -1.8 0 A 1.8 1.8 0 0 1 1.4 -1.1" fill="none" stroke="url(#neonMint)" strokeWidth="0.32" strokeLinecap="round" />
            <path d="M 1.8 0 A 1.8 1.8 0 0 1 -1.4 1.1" fill="none" stroke="url(#neonMint)" strokeWidth="0.32" strokeLinecap="round" />
            
            {/* Realistic sharp Arrow Heads */}
            <polygon points="-1.85,-0.1 -2.3,-0.75 -1.4,-0.6" fill="#2dd4bf" stroke="#0f766e" strokeWidth="0.05" />
            <polygon points="1.85,0.1 2.3,0.75 1.4,0.6" fill="#2dd4bf" stroke="#0f766e" strokeWidth="0.05" />
            
            {/* Inner shiny glow */}
            <circle cx="0" cy="0" r="1.2" fill="rgba(0,0,0,0.3)" />
            {/* High stakes glowing arrow core */}
            <text x="0" y="0.55" textAnchor="middle" fontSize="1.6" fontWeight="1000" fill="#ffffff" fontFamily="sans-serif" style={{ filter: 'drop-shadow(0 0 4px #2dd4bf)' }}>1x</text>
          </g>
        );
      case '2000':
      case '20000':
        return (
          <g>
            {/* Ambient drop shadow below the chest */}
            <rect x="-1.9" y="0.8" width="3.8" height="0.8" rx="0.4" fill="rgba(0,0,0,0.55)" />
            
            {/* Treasure Chest Body Base */}
            <rect x="-1.8" y="-0.1" width="3.6" height="1.6" rx="0.15" fill="#1e293b" stroke="#020617" strokeWidth="0.15" />
            {/* Side handle plates */}
            <rect x="-1.9" y="0.3" width="0.2" height="0.6" rx="0.05" fill="url(#goldRim)" />
            <rect x="1.7" y="0.3" width="0.2" height="0.6" rx="0.05" fill="url(#goldRim)" />
            
            {/* Rich oak wood plank textures in chest base */}
            <rect x="-1.55" y="0.05" width="3.1" height="1.3" fill="url(#woodChestGrad)" />
            <line x1="-0.8" y1="0.05" x2="-0.8" y2="1.35" stroke="#1c0505" strokeWidth="0.08" />
            <line x1="0.8" y1="0.05" x2="0.8" y2="1.35" stroke="#1c0505" strokeWidth="0.08" />
            <line x1="0" y1="0.05" x2="0" y2="1.35" stroke="#1c0505" strokeWidth="0.08" />

            {/* Glowing gold piles and cash cascading from within */}
            <ellipse cx="0" cy="-0.1" rx="1.55" ry="0.5" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.08" />
            {/* Individual gold coins stacked */}
            <circle cx="-0.9" cy="-0.1" r="0.35" fill="url(#goldBarGradLighter)" stroke="#b45309" strokeWidth="0.05" />
            <circle cx="-0.5" cy="-0.2" r="0.35" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.05" />
            <circle cx="0.9" cy="-0.1" r="0.35" fill="url(#goldBarGradLighter)" stroke="#b45309" strokeWidth="0.05" />
            <circle cx="0.5" cy="-0.2" r="0.35" fill="url(#goldBarGrad)" stroke="#78350f" strokeWidth="0.05" />
            <rect x="-0.35" y="-0.4" width="0.7" height="0.4" fill="url(#cashGreenGrad)" stroke="#166534" strokeWidth="0.05" transform="rotate(15)" />
            <circle cx="0.0" cy="-0.12" r="0.4" fill="url(#goldBarGradLighter)" stroke="#92400e" strokeWidth="0.05" />

            {/* Rich rounded wooden lid (Open) */}
            <path d="M -1.8 -0.1 C -1.8 -1.3 1.8 -1.3 1.8 -0.1 Z" fill="url(#woodChestGrad)" stroke="#1e293b" strokeWidth="0.16" />
            {/* Elegant metal banding on lid */}
            <path d="M -1.5 -0.1 Q -1.5 -0.95 0 -0.95 Q 1.5 -0.95 1.5 -0.1" fill="none" stroke="url(#goldRim)" strokeWidth="0.28" />
            <path d="M -0.7 -0.1 Q -0.7 -0.95 0 -0.95 Q 0.7 -0.95 0.7 -0.1" fill="none" stroke="url(#goldRim)" strokeWidth="0.14" />
            
            {/* Studs on metal bands */}
            <circle cx="-1.4" cy="-0.4" r="0.06" fill="#ffffff" opacity="0.9" />
            <circle cx="-1.2" cy="-0.7" r="0.06" fill="#ffffff" opacity="0.9" />
            <circle cx="1.4" cy="-0.4" r="0.06" fill="#ffffff" opacity="0.9" />
            <circle cx="1.2" cy="-0.7" r="0.06" fill="#ffffff" opacity="0.9" />

            {/* Solid gold keyhole flange plate in center */}
            <rect x="-0.32" y="0.25" width="0.64" height="0.64" rx="0.1" fill="url(#goldRim)" stroke="#78350f" strokeWidth="0.08" />
            {/* Lock slot keyhole */}
            <circle cx="0" cy="0.48" r="0.1" fill="#000" />
            <polygon points="-0.06,0.48 0.06,0.48 0.08,0.75 -0.08,0.75" fill="#000" />
            
            {/* Star sparkle effects */}
            <path d="M -1.1 -1.1 Q -1.1 -0.85 -0.8 -0.85 Q -1.1 -0.85 -1.1 -0.6 Q -1.1 -0.85 -1.4 -0.85 Q -1.1 -0.85 -1.1 -1.1 Z" fill="#ffffff" />
            <path d="M 1.2 -1.1 Q 1.2 -0.85 1.5 -0.85 Q 1.2 -0.85 1.2 -0.6 Q 1.2 -0.85 0.9 -0.85 Q 1.2 -0.85 1.2 -1.1 Z" fill="#ffffff" />
            <path d="M 0.2 -0.4 Q 0.2 -0.25 0.35 -0.25 Q 0.2 -0.25 0.2 -0.1 Q 0.2 -0.25 0.05 -0.25 Q 0.2 -0.25 0.2 -0.4 Z" fill="#ffffff" transform="scale(0.8)" />
          </g>
        );
      default:
        return null;
    }
  };

  // Perform the premium Spin execution
  const handleSpinClick = async () => {
    if (isSpinning || !user || !profile) return;

    // Check balance priorities: Available Balance first, then Reward Balance
    let selectedDebitSource: 'available_balance' | 'reward_dollar_balance' | null = null;
    
    if (availableBalance >= 1.00) {
      selectedDebitSource = 'available_balance';
    } else if (rewardBalance >= 1.00) {
      selectedDebitSource = 'reward_dollar_balance';
    }

    if (!selectedDebitSource) {
      setIsNoFundsModalOpen(true);
      return;
    }

    // Determine the result indices based on weighted probabilities:
    // Try Again (index 1) - Most common: 55%
    // Free Spin (index 0) - Second most common: 30%
    // $1 Winner (index 2) - Uncommon: 14%
    // $10 Winner (index 3) - Extremely rare: 1%
    const roll = Math.random() * 100;
    let targetIndex = 1;
    let outcomeType: 'try_again' | 'free_spin' | '1' | '10' = 'try_again';
    let prizeLabel = 'Try Again';

    if (roll < 55) {
      targetIndex = 1;
      outcomeType = 'try_again';
      prizeLabel = 'Try Again';
    } else if (roll < 85) {
      targetIndex = 0;
      outcomeType = 'free_spin';
      prizeLabel = 'Free Spin';
    } else if (roll < 99) {
      targetIndex = 2;
      outcomeType = '1';
      prizeLabel = '$1 Winner';
    } else {
      targetIndex = 3;
      outcomeType = '10';
      prizeLabel = '$10 Winner';
    }

    const isFreeSpin = targetIndex === 0;

    setIsSpinning(true);

    try {
      // Execute firestore database debit transaction synchronously
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error("Local profile context missing");
        }

        const userData = userSnap.data();
        const dbAvailable = userData.available_balance ?? 0;
        const dbWithdrawMethods = userData.withdraw_methods ?? {};
        const dbReward = dbWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;

        if (!isFreeSpin) {
          // Double check funds in the database and deduct $1
          if (selectedDebitSource === 'available_balance') {
            if (dbAvailable < 1.00) throw new Error("Database Available Balance insufficient");
            transaction.update(userRef, {
              available_balance: dbAvailable - 1.00
            });
          } else {
            if (dbReward < 1.00) throw new Error("Database Reward Balance insufficient");
            transaction.update(userRef, {
              withdraw_methods: {
                ...dbWithdrawMethods,
                reward_dollar_balance: dbReward - 1.00
              },
              reward_dollar_balance: dbReward - 1.00
            });
          }

          // Add corresponding paid transaction record
          const txRef = doc(collection(db, 'transactions'));
          transaction.set(txRef, {
            user_id: user.uid,
            type: 'fee',
            amount: -1.00,
            description: 'Spin & Win Entry',
            status: prizeLabel,
            created_at: new Date().toISOString()
          });
        } else {
          // Free Spin segment - bypass balance deduction!
          const txRef = doc(collection(db, 'transactions'));
          transaction.set(txRef, {
            user_id: user.uid,
            type: 'free_spin',
            amount: 0.00,
            description: 'Spin & Win Entry',
            status: 'Free Spin (Retry)',
            created_at: new Date().toISOString()
          });
        }
      });

      // Initialize or resume audio context under user gesture
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // Random spin duration naturally varying between approximately 4 and 9 seconds
      const randomizedDurationSec = 4 + Math.random() * 5;
      setSpinDuration(randomizedDurationSec);

      // Determine the exact index of the outcome prize from WHEEL_SECTORS
      const prizeIndex = WHEEL_SECTORS.findIndex(sector => sector.value === outcomeType);
      const safePrizeIndex = prizeIndex === -1 ? 1 : prizeIndex;

      // Center of the target sector (40 degrees per wedge index on a 9-segment wheel) centered perfectly at 12 o'clock
      const targetSectorAngle = (360 - (safePrizeIndex * 40) + 360) % 360;

      // Ensure we never stop on segment boundaries by using a safe offset comfortably inside the segment
      const organicSkew = (Math.random() * 24) - 12; // Range of [-12, 12] degrees comfortably within 40-degree wedge

      // Calculate final relative rotation with at least 6 rounds for solid momentum speed and organic decelerating feel
      const baseRounds = 6 * 360;
      const nextRotationDegrees = (wheelRotation - (wheelRotation % 360)) + baseRounds + targetSectorAngle + organicSkew;
      setWheelRotation(nextRotationDegrees);

      // Play tick vibration if enabled
      if (soundEnabled && window.speechSynthesis) {
         if (navigator.vibrate) {
          navigator.vibrate(35);
         }
      }

      // Finish rotation transition
      setTimeout(async () => {
        setIsSpinning(false);

        if (outcomeType === '1') {
          try {
            // Instantly update database and credit $1.00 back to origins
            await runTransaction(db, async (tx) => {
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await tx.get(userRef);
              if (!userSnap.exists()) return;

              const userData = userSnap.data();
              const dbAvailable = userData.available_balance ?? 0;
              const dbWithdrawMethods = userData.withdraw_methods ?? {};
              const dbReward = dbWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;

              if (selectedDebitSource === 'available_balance') {
                tx.update(userRef, {
                  available_balance: dbAvailable + 1.00
                });
              } else {
                tx.update(userRef, {
                  withdraw_methods: {
                    ...dbWithdrawMethods,
                    reward_dollar_balance: dbReward + 1.00
                  },
                  reward_dollar_balance: dbReward + 1.00
                });
              }
            });

            setModalResult({
              type: '1',
              title: 'WINNER!',
              message: 'Splendid outcome! You scored the $1 prize! The single-dollar entry fee has been completely refunded to your wallet balance.'
            });
          } catch (e) {
            console.error("Credit back failed secure transaction:", e);
          }
        } else if (outcomeType === '10') {
          try {
            // Instantly update database and credit $10.00 back to origins
            await runTransaction(db, async (tx) => {
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await tx.get(userRef);
              if (!userSnap.exists()) return;

              const userData = userSnap.data();
              const dbAvailable = userData.available_balance ?? 0;
              const dbWithdrawMethods = userData.withdraw_methods ?? {};
              const dbReward = dbWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;

              if (selectedDebitSource === 'available_balance') {
                tx.update(userRef, {
                  available_balance: dbAvailable + 10.00
                });
              } else {
                tx.update(userRef, {
                  withdraw_methods: {
                    ...dbWithdrawMethods,
                    reward_dollar_balance: dbReward + 10.00
                  },
                  reward_dollar_balance: dbReward + 10.00
                });
              }
            });

            setModalResult({
              type: '10',
              title: 'MEGA WINNER!',
              message: 'Outstanding outcome! You won the rare $10.00 cash prize! It has been credited directly to your wallet.'
            });
          } catch (e) {
            console.error("Credit back failed secure transaction:", e);
          }
        } else if (outcomeType === 'free_spin') {
          setModalResult({
            type: 'free_spin',
            title: 'FREE SPIN!',
            message: 'Awesome luck! You landed on a Free Spin! No entry fee was deducted, and you retain your balance. Try your immediate free spin now!'
          });
        } else {
          // Landed on Try Again segment (index 1)
          setPlayTryAgainAnimation(true);
          setTimeout(() => {
            setPlayTryAgainAnimation(false);
          }, 4500);

          setModalResult({
            type: 'try_again',
            title: 'BETTER LUCK NEXT TIME!',
            message: "The pointer just missed a prize slot! Don't worry, your luck is bound to shift on the next rotation."
          });
        }

        setIsResultModalOpen(true);
      }, (randomizedDurationSec * 1000) + 200);

    } catch (err: any) {
      console.error("Spin error:", err);
      toast.error(err.message || "An isolated ledger error occurred. Try again.");
      setIsSpinning(false);
    }
  };

  // High-fidelity tactile physical button panel (shares mobile / desktop rendering perfectly)
  const renderSpinLauncher = () => {
    return (
      <div className="space-y-4">
        {/* PROMPT DISPLAY BOX (NEW) */}
        {isSpinning && (
          <div className="bg-slate-950/60 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.04),transparent_70%)] pointer-events-none" />
            
            <div className="flex flex-col items-center justify-center text-center space-y-3 relative z-10">
              <div className="space-y-2.5">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping delay-0" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping delay-150" />
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping delay-300" />
                </div>
                <h3 className="text-xs font-black text-[#f59e0b] uppercase tracking-widest animate-pulse flex items-center justify-center gap-1.5">
                  <Sparkles size={12} className="animate-spin text-amber-400" />
                  PROCESSING SPIN...
                </h3>
                <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed font-sans font-medium">
                  Your isolated security ledger is processing, the system wheel is spinning at maximum frame rate...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tactile Button Chassis */}
        <div className="bg-slate-950/80 border border-white/[0.08] p-5 sm:p-6 rounded-3xl relative overflow-hidden backdrop-blur-xl shadow-2xl">
          {isSpinning ? (
            <div className="text-center py-5 space-y-3">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping delay-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping delay-150" />
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping delay-300" />
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-widest animate-pulse">Sizing Up Fortune...</h3>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">Your security ledger is processing, the system wheel is spinning at maximum frame rate...</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* 3D PLAY CABINET SWITCH CHASSIS BUTTON */}
              <motion.button 
                id="spin-trigger-btn"
                onClick={handleSpinClick}
                whileHover={{ scale: 1.015, translateY: 1 }}
                whileTap={{ translateY: 4 }}
                className="w-full relative py-4 px-6 rounded-2xl text-white text-xs uppercase font-black tracking-widest select-none cursor-pointer text-center duration-150 transition-all border border-b-4 bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-600 hover:brightness-110"
                style={{
                  borderTopColor: 'rgba(255,255,255,0.4)',
                  borderRightColor: 'rgba(255,255,255,0.2)',
                  borderLeftColor: 'rgba(255,255,255,0.2)',
                  borderBottomColor: '#250838',
                  boxShadow: '0 6px 0 0 #200432, 0 10px 25px rgba(245, 158, 11, 0.25)',
                }}
              >
                {/* Reflected sweeping glaze line */}
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/30" />
                
                <div className="flex items-center justify-center gap-2 text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
                  <Sparkles size={16} className="text-amber-200 animate-pulse" />
                  <span>SPIN AND WIN NOW</span>
                </div>
              </motion.button>

            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="spin-and-win-container" className="min-h-screen bg-[#05060d] text-gray-100 pt-3 pb-6 px-4 md:px-8 relative overflow-hidden font-sans">
      
      {/* Interactive premium inline styles */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes blinkLed {
          0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 2px currentColor); }
          50% { opacity: 1; filter: drop-shadow(0 0 11px currentColor); }
        }
        .text-glow {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.55);
        }
        .bezel-metallic {
          background: conic-gradient(
            from 135deg,
            #b45309 0deg,
            #fbbf24 35deg,
            #fef08a 60deg,
            #d97706 90deg,
            #fbbf24 135deg,
            #78350f 180deg,
            #fef08a 215deg,
            #fbbf24 240deg,
            #b45309 270deg,
            #fef08a 315deg,
            #fbbf24 330deg,
            #b45309 360deg
          );
        }
        .glass-dome-glare {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.22) 0%,
            rgba(255, 255, 255, 0.05) 38%,
            rgba(255, 255, 255, 0) 41%,
            rgba(0, 0, 0, 0) 55%,
            rgba(0, 0, 0, 0.35) 100%
          );
        }
      `}</style>

      {/* Background celestial visual gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-[-150px] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-[20%] w-[600px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.06),transparent_70%)] pointer-events-none" />

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto relative z-10 space-y-4">
        
        {/* Sleek Minimal Header - Write-ups removed to push spinning wheel to the top */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/[0.05]">
          <button 
            id="back-to-dashboard-spin"
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center cursor-pointer shadow-md"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] p-1.5 rounded-xl">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-white/5 cursor-pointer"
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Major Content Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: The Spinning Wheel (Floating, Enlarged & Completely Borderless) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-0 py-6">
            
            {/* Elegant Outer Wheel Rim Wrapper - Expanded size, 100% responsive and scales perfectly */}
            <div className="relative w-full max-w-[360px] xs:max-w-[420px] sm:max-w-[520px] md:max-w-[580px] lg:max-w-[660px] xl:max-w-[700px] aspect-square flex items-center justify-center">
              
              {/* Premium Static Physical Pointer Asset from Reference - Larger & Overlapping */}
              <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[22%] z-40 flex flex-col items-center pointer-events-none select-none">
                <img
                  src="https://i.imgur.com/KB8LyYH.png"
                  alt="Pointer"
                  className="w-full h-auto object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Spinning Wheel DOM component with strict central rotations and no box shadow or backing circle */}
              <div 
                ref={wheelRef}
                id="spinning-wheel-graphic"
                className="absolute inset-0 w-full h-full rounded-full z-20 flex items-center justify-center m-0 p-0 select-none pointer-events-none"
                style={{
                  transform: `rotate(${wheelRotation}deg) translateZ(0)`,
                  transition: isSpinning ? `transform ${spinDuration}s cubic-bezier(0.15, 0.85, 0.2, 1)` : 'none',
                  transformOrigin: 'center center',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  willChange: 'transform',
                }}
              >
                <svg
                  viewBox="0 0 500 500"
                  className="w-full h-full block select-none pointer-events-none"
                  style={{ transformOrigin: 'center center' }}
                >
                  <defs>
                    <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffea" />
                      <stop offset="25%" stopColor="#fef08a" />
                      <stop offset="65%" stopColor="#ca8a04" />
                      <stop offset="100%" stopColor="#854d0e" />
                    </radialGradient>
                    
                    <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="25%" stopColor="#ca8a04" />
                      <stop offset="50%" stopColor="#fef08a" />
                      <stop offset="75%" stopColor="#854d0e" />
                      <stop offset="100%" stopColor="#eab308" />
                    </linearGradient>

                    {/* Gradients for segments */}
                    <linearGradient id="grad-5000" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#1e1b4b" />
                      <stop offset="100%" stopColor="#311042" />
                    </linearGradient>
                    <linearGradient id="grad-10000" href="#grad-5000" />
                    
                    <linearGradient id="grad-macbook" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                    
                    <linearGradient id="grad-2000" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#3b0764" />
                      <stop offset="100%" stopColor="#581c87" />
                    </linearGradient>
                    
                    <linearGradient id="grad-10" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#7c2d12" />
                      <stop offset="100%" stopColor="#c2410c" />
                    </linearGradient>
                    
                    <linearGradient id="grad-free_spin" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#115e59" />
                      <stop offset="100%" stopColor="#0f766e" />
                    </linearGradient>
                    
                    <linearGradient id="grad-100" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#1e1b4b" />
                    </linearGradient>
                    
                    <linearGradient id="grad-1" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#451a03" />
                      <stop offset="100%" stopColor="#7c2d12" />
                    </linearGradient>
                    
                    <linearGradient id="grad-iphone" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#27272a" />
                      <stop offset="100%" stopColor="#3f3f46" />
                    </linearGradient>
                    
                    <linearGradient id="grad-try_again" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#450a0a" />
                      <stop offset="100%" stopColor="#1c0505" />
                    </linearGradient>

                    {/* Illustration internal gradients */}
                    <radialGradient id="emojiHeadGrad" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="80%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </radialGradient>
                    
                    <linearGradient id="tearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93c5fd" />
                      <stop offset="60%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    
                    <linearGradient id="purpleCashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    
                    <linearGradient id="iphoneMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#d4d4d8" />
                      <stop offset="50%" stopColor="#71717a" />
                      <stop offset="100%" stopColor="#27272a" />
                    </linearGradient>
                    
                    <linearGradient id="iphoneScreen" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#09090b" />
                      <stop offset="100%" stopColor="#18181b" />
                    </linearGradient>
                    
                    <radialGradient id="glowWallpaper" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#09090b" stopOpacity="0"/>
                    </radialGradient>
                    
                    <linearGradient id="goldBarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#b45309" />
                      <stop offset="100%" stopColor="#fef08a" />
                    </linearGradient>
                    
                    <linearGradient id="goldBarGradLighter" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                    
                    <radialGradient id="bronzeCoinId" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#fdba74" />
                      <stop offset="70%" stopColor="#c2410c" />
                      <stop offset="100%" stopColor="#7c2d12" />
                    </radialGradient>
                    
                    <linearGradient id="bronzeCoinIdLighter" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffedd5" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    
                    <radialGradient id="greenMoneyBag" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="80%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#064e3b" />
                    </radialGradient>
                    
                    <radialGradient id="glowWallpaperBlue" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7"/>
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0"/>
                    </radialGradient>
                    
                    <linearGradient id="woodChestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#78350f" />
                      <stop offset="100%" stopColor="#451a03" />
                    </linearGradient>

                    <radialGradient id="silverCoinId" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="70%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#475569" />
                    </radialGradient>
                    
                    <linearGradient id="silverCoinIdLighter" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f1f5f9" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>

                    <radialGradient id="emojiGlowGrad" cx="30%" cy="30%" r="40%">
                      <stop offset="0%" stopColor="#ffffff" opacity="0.6"/>
                      <stop offset="15%" stopColor="#ffffff" opacity="0.4"/>
                      <stop offset="100%" stopColor="#ffffff" opacity="0"/>
                    </radialGradient>
                    
                    <linearGradient id="iphoneGlassRef" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" opacity="0.45" />
                      <stop offset="40%" stopColor="#ffffff" opacity="0.15" />
                      <stop offset="40.1%" stopColor="#ffffff" opacity="0" />
                      <stop offset="100%" stopColor="#ffffff" opacity="0" />
                    </linearGradient>

                    <radialGradient id="silverGlow" cx="30%" cy="30%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" opacity="0.7" />
                      <stop offset="100%" stopColor="#ffffff" opacity="0" />
                    </radialGradient>
                    
                    <linearGradient id="macbookOledWallpaper" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e152a" />
                      <stop offset="35%" stopColor="#0f172a" />
                      <stop offset="70%" stopColor="#021a1f" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>

                    <linearGradient id="cashGreenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14532d" />
                      <stop offset="40%" stopColor="#166534" />
                      <stop offset="80%" stopColor="#15803d" />
                      <stop offset="100%" stopColor="#166534" />
                    </linearGradient>

                    <linearGradient id="neonMint" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="50%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>

                  {/* Draw each sector group */}
                  {WHEEL_SECTORS.map((sector, idx) => {
                    const labelLines = getLabelLines(sector.label);
                    return (
                      <g key={idx} transform={`rotate(${idx * 40}, 250, 250)`}>
                        {/* Wedge Shape background */}
                        <path 
                          d="M  250 250 L 171.33 33.87 A 230 230 0 0 1 328.66 33.87 Z" 
                          fill={sector.color}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1.5"
                        />
                        
                        {/* Render beautiful detailed vector artwork shifted up */}
                        <g transform="translate(250, 80) scale(15)">
                          {renderSectorIllustration(sector.value, idx)}
                        </g>

                        {/* Text Label */}
                        {labelLines.length === 2 ? (
                          <>
                            <text x="250" y="130" textAnchor="middle" fontSize="11" fontWeight="950" fill="#ffffff" className="select-none pointer-events-none font-sans uppercase tracking-wider" style={{ filter: 'drop-shadow(0px 1.5px 2px rgba(0,0,0,0.85))' }}>
                              {labelLines[0]}
                            </text>
                            <text x="250" y="143" textAnchor="middle" fontSize="11" fontWeight="950" fill="#ffffff" className="select-none pointer-events-none font-sans uppercase tracking-wider" style={{ filter: 'drop-shadow(0px 1.5px 2px rgba(0,0,0,0.85))' }}>
                              {labelLines[1]}
                            </text>
                          </>
                        ) : (
                          <text x="250" y="136" textAnchor="middle" fontSize="14" fontWeight="950" fill="#ffffff" className="select-none pointer-events-none font-sans uppercase tracking-wider" style={{ filter: 'drop-shadow(0px 1.5px 2px rgba(0,0,0,0.85))' }}>
                            {sector.label}
                          </text>
                        )}

                        {/* Subtitle Badge */}
                        <text x="250" y="162" textAnchor="middle" fontSize="8" fontWeight="bold" fill="rgba(255,255,255,0.5)" className="select-none pointer-events-none font-sans uppercase tracking-widest" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.7))' }}>
                          {sector.badge}
                        </text>
                      </g>
                    );
                  })}

                  {/* Outer Luxury Metallic Golden Rim Rim Circle */}
                  <circle cx="250" cy="250" r="238" stroke="url(#goldRim)" strokeWidth="6" fill="none" className="select-none pointer-events-none" />
                  <circle cx="250" cy="250" r="242" stroke="rgba(0,0,0,0.5)" strokeWidth="2" fill="none" className="select-none pointer-events-none" />

                  {/* Glowing LED Dots along the rim */}
                  {ledDots.map((dot, i) => (
                    <circle
                      key={i}
                      cx={dot.x}
                      cy={dot.y}
                      r="3.5"
                      fill="#eab308"
                      stroke="#451a03"
                      strokeWidth="0.8"
                      className={cn("select-none pointer-events-none", dot.isDelayed ? "led-bulb" : "led-bulb-delayed")}
                    />
                  ))}

                  {/* Premium Center Hub with multi-tiered gold gradients and metallic reflection */}
                  <circle cx="250" cy="250" r="50" fill="rgba(0,0,0,0.35)" className="select-none pointer-events-none" />
                  <circle cx="250" cy="250" r="44" fill="url(#goldRim)" stroke="#3f1a04" strokeWidth="1" className="select-none pointer-events-none" />
                  <circle cx="250" cy="250" r="38" fill="url(#hubGrad)" className="select-none pointer-events-none" />
                  <circle cx="250" cy="250" r="35" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" className="select-none pointer-events-none" />

                  {/* Center Star / Sparkle pattern to give crown jewel appearance */}
                  <path
                    d="M 250 236 L 254 246 L 264 250 L 254 254 L 250 264 L 246 254 L 236 250 L 246 246 Z"
                    fill="#ffffff"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' }}
                    className="select-none pointer-events-none"
                  />
                </svg>
              </div>

            </div>

            {/* Mobile layout positioning ONLY */}
            <div className="w-full mt-8 lg:hidden max-w-sm">
              {renderSpinLauncher()}
            </div>

          </div>

          {/* RIGHT PANEL: Controls, Balances, & History */}
          <div className="lg:col-span-5 space-y-6">

            {/* Desktop layout positioning ONLY */}
            <div className="hidden lg:block">
              {renderSpinLauncher()}
            </div>

            {/* SPIN HISTORY SECTION */}
            <div className="bg-slate-900/40 border border-white/[0.05] p-6 rounded-3xl space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="text-gray-400" size={14} />
                  Spin Activity
                </h2>
                <span className="text-[9px] uppercase tracking-wider text-aura-muted font-bold font-mono">Last 15 Slots</span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {spinHistory.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 border border-dashed border-white/[0.04] rounded-2xl flex flex-col items-center gap-1.5 select-none font-sans">
                    <History size={18} className="text-neutral-600" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">No historic spins found</span>
                    <span className="text-[9px]">Spin the wheel to initialize your ledger history!</span>
                  </div>
                ) : (
                  spinHistory.map((tx) => {
                    const isWin = tx.status === '$1 Winner';
                    return (
                      <div 
                        key={tx.id} 
                        className="p-3 bg-slate-950/40 border border-white/[0.02] rounded-xl flex items-center justify-between font-sans"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs",
                            isWin ? "bg-green-500/10 text-green-400 border border-green-500/15" : "bg-neutral-800/10 text-neutral-400 border border-white/[0.05]"
                          )}>
                            <Gift size={12} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-white uppercase block tracking-tight">Spin Slot Play</span>
                            <span className="text-[8px] text-neutral-500 font-mono block mt-0.5">{new Date(tx.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={cn(
                            "text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border",
                            isWin 
                              ? "bg-green-500/10 text-green-400 border-green-500/20" 
                              : "bg-red-500/5 text-slate-400 border-white/[0.05]"
                          )}>
                            {tx.status}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-400 block font-mono mt-1">-$1.00 USD</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* GUIDELINES NAVIGATION BUTTON - Premium minimal design */}
            <div className="flex justify-center pt-3">
              <button
                onClick={() => navigate('/spin-guidelines')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-white/[0.06] bg-slate-950/40 hover:bg-white/[0.04] hover:border-white/[0.12] rounded-full text-[11px] font-black tracking-widest text-white/50 hover:text-white uppercase transition-all duration-200 shadow-md cursor-pointer select-none"
              >
                <HelpCircle size={12} className="text-amber-400" />
                <span>Guidelines</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* --- POPUP MODAL 1: NO FUNDS TO SPIN --- */}
      <AnimatePresence>
        {isNoFundsModalOpen && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsNoFundsModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-[24px] bg-white dark:bg-[#090b10] border border-red-500/20 shadow-2xl p-6 overflow-hidden border-l-4 border-l-red-500 pointer-events-auto text-left"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />

              <div className="flex gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5">Insufficent Funds</h4>
                  <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-sans font-medium">
                    No funds to spin. Fund your account to Spin & Win.
                  </p>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => {
                        setIsNoFundsModalOpen(false);
                        navigate('/fund');
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-[10px] uppercase font-black tracking-widest rounded-xl transition-all shadow-lg text-center cursor-pointer block"
                    >
                      Fund Balance
                    </button>
                    <button 
                      onClick={() => setIsNoFundsModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer text-center"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- POPUP MODAL 2: SPIN OUTCOME CELEBRATION --- */}
      <AnimatePresence>
        {isResultModalOpen && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.6 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 backdrop-blur-xs"
               onClick={() => setIsResultModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={cn(
                "relative w-full max-w-sm rounded-[24px] bg-white dark:bg-[#090b10] p-6 overflow-hidden pointer-events-auto text-left border border-slate-200 dark:border-white/[0.04] shadow-2xl",
                modalResult.type === 'try_again' && "border-l-4 border-l-slate-600 shadow-slate-900/10 dark:shadow-slate-900/50",
                modalResult.type === 'free_spin' && "border-l-4 border-l-indigo-500 shadow-indigo-950/10 dark:shadow-indigo-950/40",
                modalResult.type === '1' && "border-l-4 border-l-green-500 shadow-emerald-950/10 dark:shadow-emerald-950/40",
                modalResult.type === '10' && "border-l-4 border-l-amber-400 shadow-amber-950/10 dark:shadow-amber-950/40"
              )}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full pointer-events-none" />

              {/* Light particle background for winning scenarios */}
              {(modalResult.type === '1' || modalResult.type === '10') && (
                <>
                  <div className="absolute inset-0 pointer-events-none select-none opacity-25 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_60%)]" />
                  
                  {/* Performance-tuned hardware accelerated cascading confetti */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(12)].map((_, i) => {
                      const delay = i * 0.15;
                      const left = (i * 8.3) + "%";
                      const size = 5 + (i % 3) * 3;
                      const colors = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#60a5fa', '#a855f7'];
                      const color = colors[i % colors.length];
                      return (
                        <motion.div
                          key={i}
                          initial={{ y: -15, x: 0, opacity: 1, rotate: 0 }}
                          animate={{ 
                            y: 350, 
                            x: (i % 2 === 0 ? 25 : -25),
                            opacity: 0, 
                            rotate: 360 
                          }}
                          transition={{ 
                            duration: 2.4, 
                            delay, 
                            repeat: Infinity,
                            ease: "linear" 
                          }}
                          className="absolute"
                          style={{
                            left,
                            width: size,
                            height: size,
                            backgroundColor: color,
                            borderRadius: i % 2 === 0 ? '50%' : '2px',
                          }}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* Custom Emoji / Graphic Display */}
              <div className="flex justify-center mb-5 mt-2">
                {modalResult.type === 'try_again' && (
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-6xl select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                  >
                    😢
                  </motion.div>
                )}
                {modalResult.type === 'free_spin' && (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-6xl select-none filter drop-shadow-[0_4px_10px_rgba(99,102,241,0.3)]"
                  >
                    🔄
                  </motion.div>
                )}
                {modalResult.type === '1' && (
                  <motion.div
                    animate={{ y: [0, -6, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="text-6xl select-none filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                  >
                    🎉
                  </motion.div>
                )}
                {modalResult.type === '10' && (
                  <motion.div
                    animate={{ y: [0, -10, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-6xl select-none filter drop-shadow-[0_4px_15px_rgba(251,191,36,0.5)] animate-bounce"
                  >
                    🏆
                  </motion.div>
                )}
              </div>

              <div className="flex gap-4 items-start relative z-10">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white",
                  modalResult.type === 'try_again' && "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/[0.03] dark:text-gray-400 dark:border-white/10",
                  modalResult.type === 'free_spin' && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                  modalResult.type === '1' && "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
                  modalResult.type === '10' && "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20"
                )}>
                  {modalResult.type === 'try_again' ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Sparkles size={18} className="animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-[8px] uppercase tracking-widest font-bold block mb-1",
                    modalResult.type === 'try_again' && "text-slate-500",
                    modalResult.type === 'free_spin' && "text-indigo-600 dark:text-indigo-400",
                    modalResult.type === '1' && "text-emerald-600 dark:text-emerald-400",
                    modalResult.type === '10' && "text-amber-600 dark:text-amber-400"
                  )}>
                    Spin Result
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5">{modalResult.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium">
                    {modalResult.message}
                  </p>
                  
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <button 
                      onClick={() => setIsResultModalOpen(false)}
                      className={cn(
                        "w-full py-2.5 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all shadow-lg text-center cursor-pointer block",
                        modalResult.type === 'try_again' && "bg-slate-100 hover:bg-slate-200 text-slate-800 border-b-2 border-b-slate-300 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:border-b-white/5",
                        modalResult.type === 'free_spin' && "bg-indigo-600 hover:bg-indigo-700 text-white border-b-2 border-b-indigo-800",
                        modalResult.type === '1' && "bg-green-600 hover:bg-green-700 text-white border-b-2 border-b-green-800",
                        modalResult.type === '10' && "bg-amber-500 hover:bg-amber-600 text-slate-950 border-b-2 border-b-amber-700 font-extrabold"
                      )}
                    >
                      Dismiss (3s)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
