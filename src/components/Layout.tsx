import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Globe, 
  Sun, 
  Moon, 
  Home, 
  PlusCircle, 
  BarChart3, 
  HelpCircle, 
  User,
  TrendingUp,
  Settings as SettingsIcon,
  ChevronDown,
  Lock,
  Trophy,
  Users,
  Info,
  Zap,
  MessageCircleQuestion,
  MessageSquarePlus,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Gift,
  Coins,
  Headset,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Bot,
  Cpu,
  Monitor,
  Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth, handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMode } from '../contexts/ModeContext';
import TransferModal from './TransferModal';
import LegacyUpgradeModal from './LegacyUpgradeModal';
import PremiumTransferSuccessModal from './PremiumTransferSuccessModal';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, deleteDoc, increment, runTransaction } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import MarketTicker from './MarketTicker';
import Footer from './Footer';
import WhatsAppCommunitySlider from './WhatsAppCommunitySlider';

// --- SUB-COMPONENTS ---
// ... (SidebarItem, SidebarSubItem, BottomNavItem remain same)

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  isExpanded?: boolean;
}

function SidebarItem({ icon, label, active, onClick, children, isExpanded }: SidebarItemProps) {
  const isDark = !document.documentElement.classList.contains('light');
  return (
    <div className="flex flex-col" style={{ transform: 'translateZ(0)' }}>
      <button 
        onClick={onClick}
        className={cn(
          "flex items-center justify-between w-full p-4 lg:p-3 rounded-xl transition-all duration-200 group text-left",
          active 
            ? "bg-primary text-white" 
            : isDark 
              ? "text-aura-muted hover:text-white hover:bg-white/5" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn("transition-transform group-hover:scale-110", active ? "text-white" : isDark ? "text-aura-muted group-hover:text-primary" : "text-slate-400 group-hover:text-primary")}>
            {icon}
          </div>
          <span className="text-sm font-semibold tracking-wide">{label}</span>
        </div>
        {children && (
          <ChevronDown 
            size={16} 
            className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")} 
          />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-1 mt-1 pl-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarSubItem({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  const isDark = !document.documentElement.classList.contains('light');
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 lg:p-2 rounded-lg text-xs font-medium tracking-wide transition-all",
        active 
          ? "text-primary font-bold" 
          : isDark 
            ? "text-aura-muted hover:text-white" 
            : "text-slate-500 hover:text-slate-900"
      )}
    >
      <ChevronRight size={12} className={active ? "text-primary" : isDark ? "text-aura-muted" : "text-slate-400"} />
      {label}
    </button>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  gradientId?: string;
  glowColor?: string;
  isProfile?: boolean;
  profilePhoto?: string;
  isInvest?: boolean;
}

function BottomNavItem({ icon, label, active, onClick, gradientId, glowColor, isProfile, profilePhoto, isInvest }: NavItemProps) {
  // Brand green color constant
  const activeGreen = "#009e42";

  return (
    <motion.button 
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center justify-center flex-1 h-full py-1 z-10 transition-all duration-300 cursor-pointer"
    >
      {/* Icon Wrapper */}
      <motion.div 
        animate={{ 
          scale: active ? 1.05 : 1
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative flex items-center justify-center transition-all duration-300"
      >
        {isProfile ? (
          <div className={cn(
            "w-5 h-5 rounded-full overflow-hidden border transition-all duration-300 relative flex-shrink-0",
            active ? "border-[#009e42] scale-105" : "border-white/40"
          )}>
            <img 
              src={profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=nexus`} 
              alt={label} 
              className="w-full h-full object-cover animate-none" 
            />
          </div>
        ) : React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement, { 
              size: 18,
              className: cn(
                "transition-all duration-300", 
                active ? "text-[#009e42] drop-shadow-[0_0_4px_rgba(0,158,66,0.4)]" : "text-white/60 hover:text-white"
              )
            })
          : icon}
        
        {/* Subtle dot beneath active icon */}
        {active && (
          <motion.div
            layoutId={`dot-${gradientId}`}
            className="absolute -bottom-1.5 w-1 h-1 rounded-full pointer-events-none shadow-[0_0_6px_rgba(0,158,66,0.8)]"
            style={{ backgroundColor: activeGreen }}
          />
        )}
      </motion.div>

      {/* Label */}
      <span className={cn(
        "text-[8px] font-black capitalize tracking-[0.12em] transition-all duration-300 mt-1 select-none", 
        active 
          ? "text-[#009e42] font-black opacity-100 drop-shadow-[0_0_4px_rgba(0,158,66,0.15)]" 
          : "text-white/45 opacity-100 hover:text-white"
      )}>
        {label}
      </span>
    </motion.button>
  );
}

// --- MAIN LAYOUT COMPONENT ---

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: any;
}

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { mode, isLite, isBeta } = useMode();
  const { 
    isTransferModalOpen, 
    openTransferModal, 
    closeTransferModal, 
    isDistractionFree, 
    mrBActivationPopup, 
    setMrBActivationPopup, 
    requestPopup, 
    closePopup,
    isViewingProcessingScreen,
    processingInvestmentId,
    approvedNotificationPopup,
    setApprovedNotificationPopup,
    isWelcomeBonusDeductedPopupOpen,
    setIsWelcomeBonusDeductedPopupOpen
  } = useUI();
  const location = useLocation();
  const [isSpinMineOpen, setIsSpinMineOpen] = useState(false);
  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);

  const [premiumSuccessData, setPremiumSuccessData] = useState<{
    amount: number;
    type: 'deposit' | 'investment';
    planName?: string;
    startTime: number;
  } | null>(null);
  const [isPremiumSuccessOpen, setIsPremiumSuccessOpen] = useState(false);

  useEffect(() => {
    const checkCountdown = () => {
      const stored = localStorage.getItem('premium_pending_countdown');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.startTime && !parsed.dismissed) {
            const durationMs = 45 * 60 * 1000;
            const elapsed = Date.now() - parsed.startTime;
            if (elapsed < durationMs) {
              setPremiumSuccessData(parsed);
              setIsPremiumSuccessOpen(true);
            } else {
              setIsPremiumSuccessOpen(false);
            }
          } else {
            setIsPremiumSuccessOpen(false);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsPremiumSuccessOpen(false);
      }
    };

    checkCountdown();
    const interval = setInterval(checkCountdown, 1000);

    window.addEventListener('storage', checkCountdown);
    window.addEventListener('premium_success_trigger', checkCountdown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkCountdown);
      window.removeEventListener('premium_success_trigger', checkCountdown);
    };
  }, []);

  useEffect(() => {
    setIsMobileNavExpanded(false);
  }, [location.pathname]);

  const dismissedAlertsRef = useRef<Set<string>>(
    (() => {
      try {
        const saved = sessionStorage.getItem('dismissed_approved_notifications');
        return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
      } catch {
        return new Set<string>();
      }
    })()
  );

  // Listen for newly approved investments to show activation popups
  useEffect(() => {
    if (!user) return;
    
    // Listen to investments of status: 'inactive'
    const qApproved = query(
      collection(db, 'investments'),
      where('user_id', '==', user.uid),
      where('status', '==', 'inactive')
    );
    
    const unsubscribe = onSnapshot(qApproved, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const invId = change.doc.id;
          
          // DO NOT display the 'Activate Investment' popup while users remain on the payment processing screen
          if (isViewingProcessingScreen) {
            return;
          }

          // Check if this investment popup has already been dismissed/handled in this session
          const savedStr = sessionStorage.getItem('dismissed_approved_notifications');
          let sessionSet = new Set<string>();
          try {
            if (savedStr) {
              sessionSet = new Set<string>(JSON.parse(savedStr));
            }
          } catch (e) {}

          if (dismissedAlertsRef.current.has(invId) || sessionSet.has(invId)) {
            return;
          }
          
          // Check if it was created recently (e.g., within last 2 days) to avoid historic alerts on initial load
          const createdAtStr = data.created_at || '';
          if (createdAtStr) {
            const ageMs = Date.now() - new Date(createdAtStr).getTime();
            if (ageMs > 2 * 24 * 60 * 60 * 1000) {
              return; // Too old, ignore historic investment records
            }
          }
          
          // Show the premium approved in-app popup for this approved investment!
          if (setApprovedNotificationPopup && (!approvedNotificationPopup || approvedNotificationPopup.id !== invId)) {
            setApprovedNotificationPopup({
              id: invId,
              planName: data.plan_name || 'Node Plan',
              amount: data.amount || 0
            });
          }
        }
      });
    }, (error) => {
      console.warn("Approved investment listener blocked:", error.message);
    });
    
    return () => unsubscribe();
  }, [user, isViewingProcessingScreen, approvedNotificationPopup, setApprovedNotificationPopup]);
  const navigate = useNavigate();
  const { theme, effectiveTheme, isDark, setTheme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global Adverts System Hooks
  const [layoutAdverts, setLayoutAdverts] = useState<any[]>([]);
  const [activeLayoutAd, setActiveLayoutAd] = useState<any | null>(null);

  const [isDeductingBotFee, setIsDeductingBotFee] = useState(false);

  const handleBotFeeAcknowledge = async () => {
    if (!user || isDeductingBotFee || !isWelcomeBonusDeductedPopupOpen) return;
    setIsDeductingBotFee(true);
    const metadata = isWelcomeBonusDeductedPopupOpen;

    try {
      const userRef = doc(db, 'users', user.uid);
      const now = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const uSnap = await transaction.get(userRef);
        if (!uSnap.exists()) throw new Error("Awaiting user profile sync.");

        transaction.update(userRef, {
          total_invested: increment(-10),
          welcome_bonus_deducted: true
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'fee',
          amount: -10.00,
          status: 'AI Active',
          description: 'AI Bot Activation',
          created_at: now
        });
      });

      setIsWelcomeBonusDeductedPopupOpen(null);

      if (setMrBActivationPopup) {
        setMrBActivationPopup({
          planName: metadata.planName,
          amount: metadata.amount
        });
      }
      toast.success("AI Bot Activation fee deducted. Setup finalized.");
    } catch (err: any) {
      console.error("Deducting bot fee failed:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bot-fee-transaction`);
      } catch (logErr: any) {
        const cleanMessage = err.message || "Missing or insufficient permissions";
        toast.error(`Verification failed: ${cleanMessage}`);
      }
    } finally {
      setIsDeductingBotFee(false);
    }
  };

  // Referral Invite & Real-time Claim Popups State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activePendingClaims, setActivePendingClaims] = useState<any[]>([]);
  const [showClaimToast, setShowClaimToast] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Investment Promo State
  const [showInvestPromoModal, setShowInvestPromoModal] = useState(false);
  const [promoTriggered, setPromoTriggered] = useState(false);

  const handleCopyLink = () => {
    const code = profile?.referral_code || '';
    const link = code ? `${window.location.origin}/signup?ref=${code}` : `${window.location.origin}/signup`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Referral invitation link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Trigger modal on login or page refresh event
  useEffect(() => {
    if (!user) return;
    const hasTriggeredThisSession = sessionStorage.getItem('referral_invite_popup_triggered');
    if (!hasTriggeredThisSession) {
      sessionStorage.setItem('referral_invite_popup_triggered', 'true');
      const timer = setTimeout(() => {
        requestPopup('referral-invite', () => setShowInviteModal(true), () => setShowInviteModal(false));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, requestPopup]);

  // Trigger investment promotion modal after login or page refresh with randomized delay (2s to 10s)
  useEffect(() => {
    if (!user || promoTriggered) return;
    setPromoTriggered(true);
    
    // Choose randomly from standard delay options: 2s, 3s, 4s, 5s, 7s, 8s, 10s
    const delayOptions = [2000, 3000, 4000, 5000, 7000, 8000, 10000];
    const selectedDelay = delayOptions[Math.floor(Math.random() * delayOptions.length)];
    
    const timer = setTimeout(() => {
      requestPopup('investment-promo', () => setShowInvestPromoModal(true), () => setShowInvestPromoModal(false));
    }, selectedDelay);
    
    return () => clearTimeout(timer);
  }, [user, promoTriggered, requestPopup]);

  // Track last main route for back navigation in /invest and /fund
  useEffect(() => {
    if (location.pathname === '/home' || location.pathname === '/dashboard') {
      sessionStorage.setItem('lastMainRoute', location.pathname);
    }
  }, [location.pathname]);

  // Trigger modal on every visit to the Reward page with randomized delay
  useEffect(() => {
    if (location.pathname === '/rewards') {
      const delays = [1500, 2000, 3000, 5000, 9000, 10000];
      const randomDelay = delays[Math.floor(Math.random() * delays.length)];
      const timer = setTimeout(() => {
        requestPopup('referral-invite', () => setShowInviteModal(true), () => setShowInviteModal(false));
      }, randomDelay);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, requestPopup]);

  // Listen to Firestore real-time 'referral_claims' and trigger top-right popup toast
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'referral_claims'),
      where('user_id', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claims: any[] = [];
      snapshot.forEach(docSnap => {
        claims.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActivePendingClaims(claims);
      
      if (claims.length > 0) {
        // Automatically surface claims to the user immediately as a floating premium popup/toast
        const latestReferrerClaim = claims.find(c => c.type === 'referrer') || claims[0];
        if (latestReferrerClaim) {
          requestPopup(`mr-a-reward-${latestReferrerClaim.id}`, () => setShowClaimToast(latestReferrerClaim), () => setShowClaimToast(null));
        }
      } else {
        setShowClaimToast(null);
      }
    }, (err) => {
      console.error("Error listening to referral claims in layout:", err);
    });
    return () => unsubscribe();
  }, [user, requestPopup]);

  // --- GLOBAL ADVERTS SUBSCRIPTION & OBSERVER SYSTEM ---
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'adverts'), (snap) => {
      if (snap.exists()) {
        setLayoutAdverts(snap.data().adverts || []);
      }
    }, (err) => {
      console.warn("Global layout adverts block loading failed:", err);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (layoutAdverts.length === 0) {
      setActiveLayoutAd(null);
      return;
    }

    const currentPath = location.pathname;

    const matchingAd = layoutAdverts.find(ad => {
      if (ad.active === false) return false;

      const now = new Date().getTime();
      if (ad.scheduling?.startDate) {
        const start = new Date(ad.scheduling.startDate).getTime();
        if (now < start) return false;
      }
      if (ad.scheduling?.endDate) {
        const end = new Date(ad.scheduling.endDate).getTime();
        if (now > end) return false;
      }

      const targetingType = ad.pageTargeting?.type || 'all';
      let pageMatches = false;
      if (targetingType === 'all') {
        pageMatches = true;
      } else if (targetingType === 'dashboard' && currentPath === '/dashboard') {
        pageMatches = true;
      } else if (targetingType === 'rewards' && currentPath === '/rewards') {
        pageMatches = true;
      } else if (targetingType === 'invest' && currentPath === '/invest') {
        pageMatches = true;
      } else if (targetingType === 'profile' && currentPath === '/profile') {
        pageMatches = true;
      } else if (targetingType === 'fund' && currentPath === '/fund') {
        pageMatches = true;
      } else if (targetingType === 'custom' && ad.pageTargeting?.customPath === currentPath) {
        pageMatches = true;
      }

      if (!pageMatches) return false;

      const frequency = ad.scheduling?.type || 'every-refresh';
      const userId = user?.uid || 'guest';
      const dismissedKey = `adv_dismissed_${ad.id}_${userId}`;
      const shownSessionKey = `adv_shown_session_${ad.id}`;

      if (frequency === 'once-daily') {
        const dismissedToday = localStorage.getItem(dismissedKey);
        const todayStr = new Date().toDateString();
        if (dismissedToday === todayStr) return false;
      } else if (frequency === 'every-login') {
        const shownInSession = sessionStorage.getItem(shownSessionKey);
        if (shownInSession === 'true') return false;
      } else if (frequency === 'custom-interval') {
        const dismissedIntervalAt = localStorage.getItem(dismissedKey);
        if (dismissedIntervalAt) {
          const mSecsElapsed = now - Number(dismissedIntervalAt);
          const intervalMs = (ad.scheduling?.intervalMinutes || 30) * 60 * 1000;
          if (mSecsElapsed < intervalMs) return false;
        }
      } else if (frequency === 'every-refresh') {
        const dismissedRefresh = sessionStorage.getItem(`adv_dismissed_ref_${ad.id}`);
        if (dismissedRefresh === 'true') return false;
      }

      return true;
    });

    if (matchingAd) {
      requestPopup(
        `global-advert-${matchingAd.id}`, 
        () => setActiveLayoutAd(matchingAd), 
        () => setActiveLayoutAd(null)
      );
    } else {
      setActiveLayoutAd(null);
    }
  }, [layoutAdverts, location.pathname, user?.uid, requestPopup]);

  const handleDismissLayoutAd = (ad: any) => {
    const userId = user?.uid || 'guest';
    const frequency = ad.scheduling?.type || 'every-refresh';
    const dismissedKey = `adv_dismissed_${ad.id}_${userId}`;
    const shownSessionKey = `adv_shown_session_${ad.id}`;

    if (frequency === 'once-daily') {
      const todayStr = new Date().toDateString();
      localStorage.setItem(dismissedKey, todayStr);
    } else if (frequency === 'every-login') {
      sessionStorage.setItem(shownSessionKey, 'true');
    } else if (frequency === 'custom-interval') {
      localStorage.setItem(dismissedKey, String(new Date().getTime()));
    } else if (frequency === 'every-refresh') {
      sessionStorage.setItem(`adv_dismissed_ref_${ad.id}`, 'true');
    }

    closePopup(`global-advert-${ad.id}`);
    setActiveLayoutAd(null);
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);

  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const helpDropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection for compact header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTab = location.pathname.substring(1) || 'dashboard';
  const isHomePage = location.pathname === '/home' || location.pathname === '/';
  const shouldShowMobileNav = ['/', '/home', '/dashboard', '/fund', '/invest', '/profile'].includes(location.pathname) || location.pathname.startsWith('/fund');
  const showFooterPaths = ['/home', '/', '/markets', '/nodes', '/pools', '/neural-analytics', '/terms', '/privacy', '/cookies', '/aml'];
  const showFooter = showFooterPaths.includes(location.pathname);
  const isInternalApp = ['/dashboard', '/invest', '/fund', '/settings', '/profile', '/help', '/notifications'].some(path => location.pathname.startsWith(path));

  // Determine if we should show a back button
  const showBackButton = !['/home', '/dashboard'].includes(location.pathname) && !(isMobile && location.pathname === '/token');
  const isFullBleedPage = ['/about', '/how-it-works', '/faq', '/rewards', '/token', '/mining', '/ai-marketplace', '/help'].includes(location.pathname);

  // Real-time notifications
  useEffect(() => {
    if (!user || !profile) return;

    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(items);
    }, (error) => {
      console.warn("Notifications listener blocked or failed:", error.message);
    });

    const unreadQ = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribeUnread = onSnapshot(unreadQ, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.warn("Unread count listener blocked or failed:", error.message);
    });

    return () => {
      unsubscribe();
      unsubscribeUnread();
    };
  }, [user, profile]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(target)) {
        setIsLanguageOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(target)) {
        setIsThemeOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(target)) {
        setIsExploreOpen(false);
      }
      if (helpDropdownRef.current && !helpDropdownRef.current.contains(target)) {
        setIsHelpDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    if (location.pathname === '/home' || location.pathname === '/dashboard') {
      sessionStorage.setItem('lastMainRoute', location.pathname);
    }
    navigate(path);
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    setIsLanguageOpen(false);
    setIsThemeOpen(false);
    setIsHelpDropdownOpen(false);
  };

  const isCipher = profile?.role === 'cipher';
  const isVerified = user?.emailVerified || isCipher;

  if (user && !isVerified) {
    return (
      <div className="min-h-screen bg-aura-black text-white flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-aura-lime/10 rounded-full flex items-center justify-center border border-aura-lime/20 animate-pulse">
          <CheckCircle2 size={40} className="text-aura-lime" />
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Verification Pending</h1>
          <p className="text-aura-muted text-sm font-medium leading-relaxed">
            Your account has been detected but your email address <span className="text-white">({user.email})</span> is not yet verified. 
            Access to terminal assets and investments is restricted until verification is complete.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
             onClick={() => window.location.reload()}
             className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-[#009e42]/20 hover:scale-105 transition-all cursor-pointer"
          >
            I have verified my email
          </button>
          <button 
             onClick={() => logout()}
             className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all"
          >
            Logout session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col font-sans transition-colors duration-500 bg-cover bg-center bg-no-repeat bg-fixed",
        isDark ? "bg-aura-black text-white" : "bg-white text-slate-900"
      )}
      style={{
        backgroundImage: isDark
          ? "linear-gradient(rgba(5, 5, 5, 0.94), rgba(5, 5, 5, 0.94)), url('https://i.imgur.com/wCxGTKx.png')"
          : "linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)), url('https://i.imgur.com/wCxGTKx.png')"
      }}
    >
      {/* --- TOP NAVBAR --- */}
      <nav className={cn(
        "sticky top-0 left-0 right-0 w-full z-[100] flex items-center px-6 backdrop-blur-2xl transition-all duration-500 border-b",
        isDark 
          ? "border-white/10 bg-black/90 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
          : "border-slate-200 bg-white/95 text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.05)]",
        isScrolled ? "h-14 py-2" : "h-16 lg:h-20",
        // Mobile visibility logic
        ((location.pathname === '/home' || (location.pathname === '/token' && !isMobile)) && !isDistractionFree) ? "flex" : "hidden lg:flex",
        isDistractionFree && "hidden lg:hidden"
      )}>
        {/* Left: Back Button or Menu */}
        <div className="flex items-center gap-4 lg:gap-6 flex-1 lg:flex-none">
          {isMobile && location.pathname === '/token' ? (
            <motion.button 
              whileHover={{ x: -2 }}
              onClick={() => navigate('/home')}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 group",
                isDark 
                  ? "hover:bg-white/5 text-aura-muted hover:text-white" 
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              )}
            >
              <ArrowLeft size={20} />
            </motion.button>
          ) : showBackButton ? (
            <motion.button 
              whileHover={{ x: -2 }}
              onClick={() => navigate(-1)}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 group",
                isDark 
                  ? "hover:bg-white/5 text-aura-muted hover:text-white" 
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              )}
            >
              <ArrowLeft size={20} />
            </motion.button>
          ) : (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-2 rounded-xl transition-colors lg:hidden flex flex-col justify-center gap-1.5 w-10 h-10 items-start pl-2.5 cursor-pointer",
                isDark 
                  ? "hover:bg-white/10 text-white" 
                  : "hover:bg-slate-100 text-slate-900"
              )}
              aria-label="Open menu"
            >
              <div className={cn("w-4.5 h-[2.5px] rounded-full transition-colors", isDark ? "bg-white" : "bg-gray-600")} />
              <div className={cn("w-3 h-[2.5px] rounded-full transition-colors", isDark ? "bg-white" : "bg-gray-600")} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <Link to="/home" className={cn(
              "flex items-center gap-2.5 transition-all duration-500",
              isScrolled ? "scale-90" : "scale-100"
            )}>
              <div className="relative group">
                <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Logo" className="h-6 md:h-7 lg:h-8 w-auto object-contain brightness-110" />
                <div className="absolute inset-0 bg-aura-lime/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </div>
        </div>

        {/* Center: Desktop Nav Links */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2">
          {[
            { label: 'Home', path: '/home' },
            { label: 'Invest', path: '/invest' },
            { label: 'Fund', path: '/fund' },
            ...(isBeta ? [{ label: 'CGA Token', path: '/token' }] : []),
            { label: 'How It Works', path: '/how-it-works' },
          ].map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap group",
                  isActive 
                    ? "text-aura-lime bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(204,255,0,0.05)]" 
                    : "text-aura-muted hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <span className={cn(
                  "relative z-10 transition-colors duration-300", 
                  isActive ? "" : "group-hover:text-aura-lime"
                )}>
                  {t(item.label)}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="top-nav-active"
                    className={cn(
                      "absolute inset-0 rounded-xl border bg-white/5 border-white/10"
                    )}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-aura-lime/0 via-aura-lime/5 to-aura-lime/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </button>
            );
          })}

          {/* Explore Dropdown */}
          <div className="static" ref={exploreRef}>
            <button
              onClick={() => setIsExploreOpen(!isExploreOpen)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 group border border-transparent",
                isExploreOpen 
                  ? "text-white bg-white/5 border-white/10" 
                  : "text-aura-muted hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <span className="transition-all group-hover:text-aura-lime">Explore</span>
              <ChevronDown size={14} className={cn("transition-transform duration-300", isExploreOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isExploreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "absolute top-full left-0 right-0 mt-4 h-14 rounded-[24px] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[110] overflow-hidden backdrop-blur-3xl px-6 flex items-center justify-center",
                    isDark ? "bg-[#0b1029]/90 border-white/10" : "bg-white border-slate-200/80 shadow-lg"
                  )}
                >
                  <div className="flex flex-row items-center justify-center gap-2 lg:gap-4 w-full h-full">
                    {[
                      { label: 'Markets', path: '/markets', icon: <TrendingUp size={14} className="text-cyan-400" />, betaOnly: false },
                      { label: '401(k)', path: '/retirement', icon: <ShieldCheck size={14} className="text-emerald-400" />, betaOnly: true },
                      { label: 'Loans', path: '/loans', icon: <Landmark size={14} className="text-amber-400" />, betaOnly: true },
                      { label: 'Partners', path: '/partners', icon: <Users size={14} />, betaOnly: false },
                      { label: 'Top Investors', path: '/top-investors', icon: <Trophy size={14} />, betaOnly: false },
                      { label: 'Reviews', path: '/reviews', icon: <MessageSquarePlus size={14} />, betaOnly: false },
                      { label: 'Reward', path: '/rewards', icon: <Gift size={14} />, betaOnly: false },
                      { label: 'Guide', path: '/guide', icon: <HelpCircle size={14} />, betaOnly: false },
                      { label: 'Join Us', path: '/join-us', icon: <Share2 size={14} />, betaOnly: false },
                      { label: 'Mining', path: '/mining', icon: <Cpu size={14} />, betaOnly: true },
                      { label: 'AI Marketplace', path: '/ai-marketplace', icon: <Bot size={14} />, betaOnly: true },
                    ].filter(item => !item.betaOnly || isBeta).map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <button
                          key={subItem.path}
                          onClick={() => {
                            handleNavigation(subItem.path);
                            setIsExploreOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all group whitespace-nowrap",
                            isSubActive 
                              ? "bg-primary text-white shadow-lg shadow-primary/20" 
                              : isDark 
                                ? "text-aura-muted hover:text-white hover:bg-white/5" 
                                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                          )}
                        >
                          <span className="group-hover:scale-110 transition-transform">{subItem.icon}</span>
                          {t(subItem.label)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Help Dropdown */}
          <div className="static" ref={helpDropdownRef}>
            <button
              onClick={() => setIsHelpDropdownOpen(!isHelpDropdownOpen)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 group border border-transparent",
                isHelpDropdownOpen 
                  ? "text-white bg-white/5 border-white/10" 
                  : "text-aura-muted hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <span className="transition-all group-hover:text-aura-lime">Help</span>
              <ChevronDown size={14} className={cn("transition-transform duration-300", isHelpDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isHelpDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "absolute top-full left-0 right-0 mt-4 h-14 rounded-[24px] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[110] overflow-hidden backdrop-blur-3xl px-6 flex items-center justify-center",
                    isDark ? "bg-[#0b1029]/90 border-white/10" : "bg-white border-slate-200/80 shadow-lg"
                  )}
                >
                  <div className="flex flex-row items-center justify-center gap-2 lg:gap-4 w-full h-full">
                    {[
                      { label: 'Help', path: '/help', icon: <Headset size={14} /> },
                      { label: 'FAQ', path: '/faq', icon: <MessageCircleQuestion size={14} /> },
                      { label: 'About', path: '/about', icon: <Info size={14} /> },
                    ].map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <button
                          key={subItem.path}
                          onClick={() => {
                            handleNavigation(subItem.path);
                            setIsHelpDropdownOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all group whitespace-nowrap",
                            isSubActive 
                              ? "bg-primary text-white shadow-lg shadow-primary/20" 
                              : isDark 
                                ? "text-aura-muted hover:text-white hover:bg-white/5" 
                                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                          )}
                        >
                          <span className="group-hover:scale-110 transition-transform">{subItem.icon}</span>
                          {t(subItem.label)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
          {/* Theme, Language, Telegram, and Support: Only rendered in CGA Beta */}
          {isBeta && (
            <>
              {/* Theme Selector Control */}
              <div className="relative" ref={themeRef}>
                <button 
                  onClick={() => setIsThemeOpen(!isThemeOpen)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-95",
                    isDark 
                      ? "bg-white/[0.04] border border-white/5 text-amber-300 hover:text-amber-200 hover:bg-white/[0.08] hover:border-white/10" 
                      : "bg-slate-100 border border-slate-200 text-amber-600 hover:text-amber-500 hover:bg-slate-200"
                  )}
                  title={`Theme: ${theme === 'system' ? `System (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})` : theme === 'dark' ? 'Dark' : 'Light'}`}
                  aria-label={`Theme: ${theme === 'system' ? `System (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})` : theme === 'dark' ? 'Dark' : 'Light'}`}
                >
                  {effectiveTheme === 'dark' ? (
                    <Moon size={18} className="transition-transform duration-300 hover:scale-110" />
                  ) : (
                    <Sun size={18} className="transition-transform duration-300 hover:scale-110" />
                  )}
                </button>

                <AnimatePresence>
                  {isThemeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{ willChange: 'transform, opacity' }}
                      className={cn(
                        "absolute top-full right-0 mt-2 w-48 rounded-2xl border shadow-2xl z-[110] overflow-hidden backdrop-blur-xl p-1.5 space-y-1",
                        isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line shadow-lg"
                      )}
                    >
                      <div className={cn(
                        "px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] border-b mb-1",
                        isDark ? "text-aura-muted border-white/5" : "text-slate-400 border-slate-100"
                      )}>
                        Theme Preference
                      </div>

                      {/* System Option */}
                      <button
                        onClick={() => {
                          setTheme('system');
                          setIsThemeOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                          theme === 'system'
                            ? "bg-primary text-aura-black shadow-md shadow-primary/20 font-bold"
                            : isDark
                              ? "text-aura-muted hover:text-white hover:bg-white/5"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Monitor size={15} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">System</span>
                        </div>
                        {theme === 'system' && <CheckCircle2 size={13} className="text-current" />}
                      </button>

                      {/* Light Option */}
                      <button
                        onClick={() => {
                          setTheme('light');
                          setIsThemeOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                          theme === 'light'
                            ? "bg-primary text-aura-black shadow-md shadow-primary/20 font-bold"
                            : isDark
                              ? "text-aura-muted hover:text-white hover:bg-white/5"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Sun size={15} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Light</span>
                        </div>
                        {theme === 'light' && <CheckCircle2 size={13} className="text-current" />}
                      </button>

                      {/* Dark Option */}
                      <button
                        onClick={() => {
                          setTheme('dark');
                          setIsThemeOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                          theme === 'dark'
                            ? "bg-primary text-aura-black shadow-md shadow-primary/20 font-bold"
                            : isDark
                              ? "text-aura-muted hover:text-white hover:bg-white/5"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Moon size={15} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Dark</span>
                        </div>
                        {theme === 'dark' && <CheckCircle2 size={13} className="text-current" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={languageRef}>
                <button 
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-lg hover:bg-white/[0.08] hover:border-white/10 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-95 text-xl"
                  title="Select Language"
                >
                  {LANGUAGES.find(l => l.code === language)?.flag || '🇺🇸'}
                </button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{ willChange: 'transform, opacity' }}
                      className={cn(
                        "absolute top-full right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-[110] overflow-hidden backdrop-blur-xl",
                        isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line"
                      )}
                    >
                      <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar space-y-0.5">
                        {LANGUAGES.map((lang) => (
                          <button 
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code as any);
                              setIsLanguageOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                              language === lang.code 
                                ? "bg-aura-lime text-aura-black shadow-lg shadow-aura-lime/20" 
                                : isDark ? "text-aura-muted hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-black hover:bg-black/5"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base select-none">{lang.flag}</span>
                              <span className="text-[10px] font-black uppercase tracking-wider">{lang.name}</span>
                            </div>
                            {language === lang.code && <CheckCircle2 size={12} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="https://t.me/cga_help"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 transition-all flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 text-[#229ED9]"
                title="Telegram Support"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5.5 h-5.5 flex-shrink-0 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] fill-current"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.33.52-.4-.01-1.17-.23-1.74-.41-.7-.23-1.26-.35-1.21-.74.03-.2.29-.41.79-.62 3.09-1.34 5.15-2.23 6.19-2.67 2.94-1.24 3.55-1.45 3.95-1.46.09 0 .28.02.4.12.1.08.13.19.14.28-.01.07.01.21 0 .31z" />
                </svg>
              </a>

              <button 
                onClick={() => handleNavigation('/help')}
                className="p-2 text-aura-muted hover:text-aura-lime transition-colors"
                title="Support"
              >
                <Headset size={20} />
              </button>
            </>
          )}

          <div className="relative">
            <button 
              onClick={() => handleNavigation('/notifications')}
              className="p-2 text-aura-muted hover:text-aura-lime relative transition-colors"
            >
              <motion.div
                animate={unreadCount > 0 ? {
                  rotate: [0, -10, 10, -10, 10, 0],
                  transition: {
                    repeat: Infinity,
                    repeatDelay: 2,
                    duration: 0.5
                  }
                } : {}}
              >
                <Bell size={20} />
              </motion.div>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-aura-black animate-pulse" />
              )}
            </button>
          </div>

          <div className="relative hidden lg:block" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-aura-lime cursor-pointer hover:scale-110 transition-all duration-300 ring-2 ring-transparent hover:ring-aura-lime/20"
            >
              <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} alt="Profile" className="w-full h-full object-cover" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute top-full right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-[110] overflow-hidden backdrop-blur-xl",
                    isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line"
                  )}
                >
                  <div className="p-4 border-b border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-aura-muted mb-1">{t('authenticated_as')}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.name || 'Nexus User'}</p>
                    <p className="text-[8px] font-mono text-slate-500 dark:text-aura-muted truncate">@{profile?.username || 'user'}</p>
                  </div>
                  <div className="p-2">
                    <div className="flex gap-2 p-3">
                      <button 
                        onClick={() => handleNavigation('/dashboard')}
                        className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all border border-slate-200 dark:border-white/5 hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/10 group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:scale-110 transition-transform">
                          <LayoutDashboard size={18} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                        {t('dashboard')}
                      </button>
                      {isBeta && (
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false);
                            openTransferModal();
                          }}
                          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all border border-slate-200 dark:border-white/5 hover:border-pink-500/30 shadow-lg hover:shadow-pink-500/10 group cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-purple-500/10 group-hover:scale-110 transition-transform">
                            <ArrowRightLeft size={18} className="text-purple-500 dark:text-purple-400" />
                          </div>
                          Transfer
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center gap-3 w-full p-3 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-aura-muted dark:hover:text-aura-lime dark:hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <User size={14} />
                      {t('profile')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* --- TICKER BAR HIDDEN PER USER REQUEST --- */}
      {/*
      {(location.pathname === '/home' || location.pathname === '/') && (
        <MarketTicker isDark={isDark} />
      )}
      */}

      {/* --- MAIN CONTENT AREA --- */}
      <main className={cn(
        "flex-1 w-full transition-all duration-500",
        isFullBleedPage 
          ? "py-0 pb-24 lg:pb-8" 
          : (isDistractionFree ? "lg:max-w-7xl lg:mx-auto px-4 lg:px-8 py-4 pb-4" : "lg:max-w-7xl lg:mx-auto px-4 lg:px-8 pt-2 md:pt-8 pb-24 lg:pb-8")
      )}>
        <Outlet />
      </main>

      {showFooter && <Footer />}

      {/* --- MOBILE BOTTOM NAV --- */}
      <AnimatePresence>
        {shouldShowMobileNav && (
          <motion.nav 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "lg:hidden fixed bottom-0 left-0 right-0 w-full h-16 pb-1 z-[100] flex items-center px-4 backdrop-blur-3xl border-t transition-all duration-300",
              isDark 
                ? "bg-[#06080c]/90 border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]" 
                : "bg-white/95 border-[#009e42]/20 shadow-[0_-10px_25px_rgba(0,158,66,0.05)]",
              isDistractionFree && "hidden"
            )}
          >
            {/* SVG definitions for realistic icon linear gradients */}
            <svg className="absolute w-0 h-0" width="0" height="0">
              <defs>
                <linearGradient id="homeIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffb03a" />
                  <stop offset="100%" stopColor="#ff7a00" />
                </linearGradient>
                <linearGradient id="fundIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="investIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="withdrawIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
                <linearGradient id="meIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#009e42" />
                  <stop offset="100%" stopColor="#02d147" />
                </linearGradient>
              </defs>
            </svg>

            {(() => {
              const activeTabKey = (() => {
                if (location.pathname === '/home' || location.pathname === '/' || location.pathname === '/dashboard') {
                  return 'home';
                } else if (location.pathname === '/fund/deposit' || location.pathname === '/fund') {
                  return 'fund';
                } else if (location.pathname === '/invest') {
                  return 'invest';
                } else if (location.pathname === '/fund/withdraw') {
                  return 'withdraw';
                } else if (location.pathname === '/profile') {
                  return 'profile';
                } else if (location.pathname.startsWith('/fund')) {
                  return 'fund';
                } else {
                  return 'home';
                }
              })();

              return (
                <div className="relative flex w-full h-full items-center justify-between">
                  <BottomNavItem 
                    icon={<Home />} 
                    label={t('home')} 
                    active={activeTabKey === 'home'} 
                    onClick={() => handleNavigation('/home')} 
                    gradientId="homeIconGrad"
                    glowColor="#ff9f0a"
                  />
                  <BottomNavItem 
                    icon={<PlusCircle />} 
                    label={t('fund')} 
                    active={activeTabKey === 'fund'} 
                    onClick={() => handleNavigation('/fund/deposit')} 
                    gradientId="fundIconGrad"
                    glowColor="#10b981"
                  />
                  <BottomNavItem 
                    icon={<TrendingUp />} 
                    label={t('invest')} 
                    active={activeTabKey === 'invest'} 
                    onClick={() => handleNavigation('/invest')} 
                    gradientId="investIconGrad"
                    glowColor="#06b6d4"
                    isInvest={true}
                  />
                  <BottomNavItem 
                    icon={<ArrowUpRight />} 
                    label={t('withdraw')} 
                    active={activeTabKey === 'withdraw'} 
                    onClick={() => handleNavigation('/fund/withdraw')} 
                    gradientId="withdrawIconGrad"
                    glowColor="#f43f5e"
                  />
                  <BottomNavItem 
                    icon={null} 
                    isProfile={true}
                    profilePhoto={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`}
                    label={t('me')} 
                    active={activeTabKey === 'profile'} 
                    onClick={() => handleNavigation('/profile')} 
                    gradientId="meIconGrad"
                    glowColor="#009e42"
                  />
                  
                  {/* Animated Indicator Trail */}
                  <motion.div 
                    layoutId="mobile-nav-indicator"
                    className="absolute bottom-1 h-0.5 rounded-full blur-[0.5px] pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                    style={{ 
                      width: `calc(${100 / 5}% - 12px)`,
                      left: `calc(${((['home', 'fund', 'invest', 'withdraw', 'profile'].indexOf(activeTabKey) >= 0 ? ['home', 'fund', 'invest', 'withdraw', 'profile'].indexOf(activeTabKey) : 0) * (100 / 5))}% + 6px)`,
                      backgroundColor: '#009e42',
                      boxShadow: '0 0 10px #009e42'
                    }}
                  />
                </div>
              );
            })()}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Global Modals */}
      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
      />

      <LegacyUpgradeModal />

      {/* Global Dynamic Adverts Overlay System */}
      <AnimatePresence>
        {activeLayoutAd && (
          <div 
            className={cn(
              "fixed z-[1100] p-4 pointer-events-none flex font-sans",
              activeLayoutAd.position === 'center' && "inset-0 items-center justify-center",
              activeLayoutAd.position === 'top-left' && "top-20 left-4 justify-start items-start",
              activeLayoutAd.position === 'top-right' && "top-20 right-4 justify-end items-start",
              activeLayoutAd.position === 'bottom-left' && "bottom-24 left-4 justify-start items-end lg:bottom-4",
              activeLayoutAd.position === 'bottom-right' && "bottom-24 right-4 justify-end items-end lg:bottom-4",
              activeLayoutAd.position === 'top-center' && "top-20 inset-x-0 justify-center items-start",
              activeLayoutAd.position === 'bottom-center' && "bottom-24 inset-x-0 justify-center items-end lg:bottom-4",
            )}
          >
            {/* Overlay backdrop only if center popup */}
            {activeLayoutAd.position === 'center' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto"
                onClick={() => handleDismissLayoutAd(activeLayoutAd)}
              />
            )}

            {/* Modal Body Container */}
            <motion.div
              initial={
                activeLayoutAd.popupType === 'bottom-slide' 
                  ? { y: 100, opacity: 0 } 
                  : activeLayoutAd.popupType === 'top-banner' 
                    ? { y: -100, opacity: 0 } 
                    : { scale: 0.9, opacity: 0, y: 15 }
              }
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={
                activeLayoutAd.popupType === 'bottom-slide' 
                  ? { y: 100, opacity: 0 } 
                  : activeLayoutAd.popupType === 'top-banner' 
                    ? { y: -100, opacity: 0 } 
                    : { scale: 0.95, opacity: 0, y: 10 }
              }
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              style={{
                width: activeLayoutAd.width || (activeLayoutAd.size === 'small' ? '290px' : activeLayoutAd.size === 'large' ? '460px' : '380px'),
                height: activeLayoutAd.height || 'auto',
                maxWidth: '92vw'
              }}
              className={cn(
                "relative rounded-[28px] p-6 text-center select-none shadow-[0_25px_60px_rgba(0,0,0,0.8)] border overflow-hidden pointer-events-auto",
                // styles mapping
                activeLayoutAd.styleTemplate === 'glass' && "bg-white/[0.04] backdrop-blur-3xl border-white/10 text-white",
                activeLayoutAd.styleTemplate === 'neon' && "bg-[#0b031c] border-purple-500 text-purple-100 shadow-[0_0_40px_rgba(168,85,247,0.3)]",
                activeLayoutAd.styleTemplate === 'minimal' && "bg-[#111215] border-white/15 text-gray-200",
                activeLayoutAd.styleTemplate === 'brutalist' && "bg-black border-4 border-white text-white font-mono rounded-none",
                activeLayoutAd.styleTemplate === 'warm' && "bg-gradient-to-tr from-[#130d07] to-[#1a100a] border-amber-600/35 text-amber-50",
              )}
            >
              {/* Style Decorations */}
              {activeLayoutAd.styleTemplate === 'neon' && (
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              )}
              {activeLayoutAd.styleTemplate === 'warm' && (
                <div className="absolute top-[-35%] left-[-35%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-3xl" />
              )}

              {/* Close Button Trigger */}
              <button
                onClick={() => handleDismissLayoutAd(activeLayoutAd)}
                className={cn(
                  "absolute top-4 right-4 p-1.5 rounded-full transition-all hover:bg-white/10",
                  activeLayoutAd.styleTemplate === 'brutalist' ? "border border-white bg-black rounded-none" : "bg-white/5 border border-white/5"
                )}
              >
                <X size={14} />
              </button>

              <div className="space-y-5 mt-3">
                {/* Image Banner */}
                {activeLayoutAd.imageUrl && (
                  <div className={cn("overflow-hidden mx-auto", activeLayoutAd.styleTemplate === 'brutalist' ? "border-2 border-white rounded-none w-full h-34" : "rounded-2xl w-full h-34 bg-white/5 border border-white/5")}>
                    <img 
                      referrerPolicy="no-referrer"
                      src={activeLayoutAd.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className={cn(
                    "font-serif tracking-tight font-black uppercase italic leading-tight text-lg",
                    activeLayoutAd.styleTemplate === 'neon' && "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 not-italic font-sans font-extrabold tracking-wide",
                    activeLayoutAd.styleTemplate === 'brutalist' && "font-mono not-italic tracking-normal text-left"
                  )}>
                    {activeLayoutAd.title}
                  </h4>
                  
                  {activeLayoutAd.styleTemplate === 'brutalist' ? (
                    <div className="w-full h-0.5 bg-white" />
                  ) : (
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-aura-lime/30 to-transparent mx-auto" />
                  )}

                  <p className={cn(
                    "text-xs leading-relaxed opacity-75 px-1 pt-2",
                    activeLayoutAd.styleTemplate === 'brutalist' && "font-mono text-left opacity-100 text-xs"
                  )}>
                    {activeLayoutAd.message}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const dest = activeLayoutAd.redirectLink;
                    handleDismissLayoutAd(activeLayoutAd);
                    if (dest) {
                      if (dest.startsWith('http')) {
                        window.open(dest, '_blank');
                      } else {
                        navigate(dest);
                      }
                    }
                  }}
                  className={cn(
                    "w-full py-4 text-[10px] uppercase font-black tracking-widest transition-all shadow-md active:scale-95 cursor-pointer",
                    activeLayoutAd.styleTemplate === 'glass' && "bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10",
                    activeLayoutAd.styleTemplate === 'neon' && "bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-md hover:brightness-110",
                    activeLayoutAd.styleTemplate === 'minimal' && "bg-white/10 text-white rounded-lg hover:bg-white/15",
                    activeLayoutAd.styleTemplate === 'brutalist' && "bg-white text-black border-2 border-white rounded-none hover:bg-black hover:text-white",
                    activeLayoutAd.styleTemplate === 'warm' && "bg-amber-600 text-white rounded-xl hover:bg-amber-500",
                  )}
                >
                  {activeLayoutAd.ctaText || "Continue"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR DRAWER --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" 
              onClick={() => setIsSidebarOpen(false)} 
            />
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ 
                transformOrigin: "24px 24px",
                willChange: 'transform, opacity' 
              }}
              className={cn(
                "fixed inset-y-0 left-0 w-80 z-[201] shadow-2xl flex flex-col",
                isDark ? "bg-aura-black border-r border-white/10" : "bg-white border-r border-aura-line"
              )}
            >
              <div className="p-8 pb-4">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center">
                    <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Logo" className="h-10 w-auto object-contain" />
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto lg:overflow-hidden px-4 py-4 scrollbar-hide space-y-1">
                <SidebarItem 
                  icon={<Home size={20} />} 
                  label={t('home')} 
                  active={activeTab === 'home'}
                  onClick={() => handleNavigation('/home')}
                />
                <SidebarItem 
                  icon={<User size={20} />} 
                  label={t('profile')} 
                  active={activeTab === 'profile'}
                  onClick={() => handleNavigation('/profile')}
                />
                <SidebarItem 
                  icon={<LayoutDashboard size={20} />} 
                  label={t('dashboard')} 
                  active={activeTab === 'dashboard'}
                  onClick={() => handleNavigation('/dashboard')}
                />
                <SidebarItem 
                  icon={<BarChart3 size={20} />} 
                  label={t('invest')} 
                  active={activeTab === 'invest'}
                  onClick={() => handleNavigation('/invest')}
                />
                <SidebarItem 
                  icon={<TrendingUp size={20} className="text-cyan-400" />} 
                  label="Markets / Securities" 
                  active={location.pathname.startsWith('/markets')}
                  onClick={() => handleNavigation('/markets')}
                />
                {isBeta && (
                  <>
                    <SidebarItem 
                      icon={<ShieldCheck size={20} className="text-emerald-400" />} 
                      label="401(k)" 
                      active={location.pathname.startsWith('/retirement')}
                      onClick={() => handleNavigation('/retirement')}
                    />
                    <SidebarItem 
                      icon={<Landmark size={20} className="text-amber-400" />} 
                      label="Loans" 
                      active={location.pathname.startsWith('/loans')}
                      onClick={() => handleNavigation('/loans')}
                    />
                  </>
                )}
                <SidebarItem 
                  icon={<PlusCircle size={20} />} 
                  label={t('fund')} 
                  active={activeTab.startsWith('fund')}
                  onClick={() => handleNavigation('/fund')}
                />
                <SidebarItem 
                  icon={<Gift size={20} />} 
                  label="Reward" 
                  active={activeTab === 'rewards'}
                  onClick={() => handleNavigation('/rewards')}
                />
                <SidebarItem 
                  icon={<Bell size={20} />} 
                  label={t('notifications')} 
                  active={activeTab === 'notifications'}
                  onClick={() => handleNavigation('/notifications')}
                />
                {isBeta && (
                  <>
                    <SidebarItem 
                      icon={<Coins size={20} className="text-amber-450" />} 
                      label="CGA Token" 
                      active={activeTab === 'token'}
                      onClick={() => handleNavigation('/token')}
                    />
                    <SidebarItem 
                      icon={<Cpu size={20} className="text-aura-lime" />} 
                      label="Mining" 
                      active={activeTab === 'mining'}
                      onClick={() => handleNavigation('/mining')}
                    />
                    <SidebarItem 
                      icon={<Bot size={20} className="text-cyan-400" />} 
                      label="AI Marketplace" 
                      active={activeTab === 'ai-marketplace'}
                      onClick={() => handleNavigation('/ai-marketplace')}
                    />
                  </>
                )}
                <SidebarItem 
                  icon={<MessageSquarePlus size={20} />} 
                  label={t('reviews')} 
                  active={activeTab === 'reviews'}
                  onClick={() => handleNavigation('/reviews')}
                />
                {isBeta && (
                  <SidebarItem 
                    icon={<Users size={20} />} 
                    label="Partners" 
                    active={activeTab === 'partners'}
                    onClick={() => handleNavigation('/partners')}
                  />
                )}
                <SidebarItem 
                  icon={<CheckCircle2 size={20} />} 
                  label="How it Works" 
                  active={activeTab === 'how-it-works'}
                  onClick={() => handleNavigation('/how-it-works')}
                />
                <SidebarItem 
                  icon={<Info size={20} />} 
                  label="About" 
                  active={activeTab === 'about'}
                  onClick={() => handleNavigation('/about')}
                />
                <SidebarItem 
                  icon={<Share2 size={20} className="text-[#00E5FF]" />} 
                  label="Join Us" 
                  active={activeTab === 'join-us'}
                  onClick={() => handleNavigation('/join-us')}
                />
                <SidebarItem 
                  icon={<Zap size={20} className="text-emerald-400" />} 
                  label="Guide" 
                  active={activeTab === 'guide'}
                  onClick={() => handleNavigation('/guide')}
                />
                <SidebarItem 
                  icon={<HelpCircle size={20} />} 
                  label={t('help')} 
                  active={activeTab === 'help'}
                  onClick={() => handleNavigation('/help')}
                />
                <SidebarItem 
                  icon={<MessageCircleQuestion size={20} />} 
                  label="FAQ" 
                  active={activeTab === 'faq'}
                  onClick={() => handleNavigation('/faq')}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- ELITE INVITE FRIENDS MODAL --- */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <style>{`
              @keyframes floatMoney1 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { transform: translateY(-75px) translateX(-45px) scale(1) rotate(-30deg); opacity: 0; }
              }
              @keyframes floatMoney2 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-85px) translateX(45px) scale(1.1) rotate(25deg); opacity: 0; }
              }
              @keyframes floatMoney3 {
                0% { transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-100px) translateX(-5px) scale(0.9) rotate(-15deg); opacity: 0; }
              }
              @keyframes floatMoney4 {
                0% { transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { transform: translateY(-65px) translateX(25px) scale(0.85) rotate(15deg); opacity: 0; }
              }
            `}</style>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={() => closePopup('referral-invite')}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-[360px] bg-gradient-to-br from-[#1b1035]/95 via-[#0b0c14]/98 to-[#20092c]/95 border-2 border-purple-500 rounded-[30px] p-6 text-center overflow-visible shadow-[0_25px_60px_rgba(168,85,247,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] select-none"
            >
              {/* Premium Top-Left Brand Logo inside Popup */}
              <div className="absolute top-5 left-6 flex items-center gap-1.5 pointer-events-none select-none">
                <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Logo" className="h-4.5 w-auto object-contain brightness-110" />
                <span className="text-[10px] font-serif font-black tracking-tighter uppercase italic leading-none text-white/90">CGA</span>
              </div>

              {/* Overlapping top realistic 3D box plus animated floaters extending outside boundaries */}
              <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-28 h-28 overflow-visible pointer-events-none z-20">
                <div className="absolute inset-2 bg-purple-500/25 rounded-full blur-2xl animate-pulse" />
                
                {/* Embedded Animated Floating Cash / Sparks */}
                <div className="absolute top-8 left-10 text-emerald-400 font-extrabold text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(52,211,153,0.5)] animate-[floatMoney1_3.5s_infinite_linear]">
                  $
                </div>
                <div className="absolute top-6 right-10 text-emerald-300 font-black text-xs select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(52,211,153,0.5)] animate-[floatMoney2_3s_infinite_linear_0.6s]">
                  $
                </div>
                <div className="absolute top-10 left-12 select-none pointer-events-none animate-[floatMoney3_4.2s_infinite_linear_1.2s]">
                  <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-[8px] px-1 py-0.5 rounded border border-emerald-400/20 text-white font-mono font-black shadow-lg">
                    $100
                  </div>
                </div>
                <div className="absolute top-8 right-12 text-pink-400 font-black text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(244,114,182,0.4)] animate-[floatMoney4_3.8s_infinite_linear_1.8s]">
                  ✦
                </div>
                <div className="absolute top-4 left-14 text-amber-300 font-extrabold text-xs select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.4)] animate-[floatMoney1_4.5s_infinite_linear_0.8s]">
                  ✦
                </div>

                {/* Highly Realistic 3D SVG Gift Box Design */}
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_8px_18px_rgba(168,85,247,0.45)]">
                  <defs>
                    <linearGradient id="goldRib" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFF2AC" />
                      <stop offset="35%" stopColor="#F5B21D" />
                      <stop offset="70%" stopColor="#9E6900" />
                      <stop offset="100%" stopColor="#FFF2AC" />
                    </linearGradient>
                    <linearGradient id="goldTop" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5B21D" />
                      <stop offset="50%" stopColor="#FFF2AC" />
                      <stop offset="100%" stopColor="#9E6900" />
                    </linearGradient>
                    <linearGradient id="boxWallL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="40%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#31108F" />
                    </linearGradient>
                    <linearGradient id="boxWallR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="40%" stopColor="#4338CA" />
                      <stop offset="100%" stopColor="#1E1B4B" />
                    </linearGradient>
                    <linearGradient id="lidGlass" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="40%" stopColor="#D946EF" />
                      <stop offset="100%" stopColor="#701A75" />
                    </linearGradient>
                  </defs>

                  {/* Box Main Body */}
                  <path d="M 15,48 L 50,70 L 50,95 L 15,73 Z" fill="url(#boxWallL)" />
                  <path d="M 85,48 L 50,70 L 50,95 L 85,73 Z" fill="url(#boxWallR)" />
                  
                  {/* Left Face Ribbon */}
                  <path d="M 29,56.5 L 29,81.5 L 35,85.2 L 35,60.2 Z" fill="url(#goldRib)" />
                  {/* Right Face Ribbon */}
                  <path d="M 71,56.5 L 71,81.5 L 65,85.2 L 65,60.2 Z" fill="url(#goldRib)" />

                  {/* Raised Lid Section */}
                  <path d="M 11,46 L 50,68 L 89,46" stroke="#000000" strokeWidth="2.5" opacity="0.35" strokeLinecap="round" />
                  <path d="M 50,44 L 85,24 L 50,8 L 15,24 Z" fill="url(#lidGlass)" />
                  <path d="M 15,24 L 50,44 L 50,50 L 15,30 Z" fill="#9D174D" />
                  <path d="M 85,24 L 50,44 L 50,50 L 85,30 Z" fill="#701A75" />

                  {/* Lid Surface Ribbons */}
                  <polygon points="30,15.5 36,12 70,32 64,35.5" fill="url(#goldRib)" />
                  <polygon points="70,15.5 64,12 30,32 36,35.5" fill="url(#goldRib)" />
                  
                  {/* Lid Side Edge Ribbons */}
                  <polygon points="30,32.8 36,36 36,42 30,38.8" fill="url(#goldTop)" />
                  <polygon points="70,32.8 64,36 64,42 70,38.8" fill="url(#goldTop)" />

                  {/* Glorious Shiny Deluxe Bow Loops */}
                  <path d="M 50,18 C 30,1 21,24 50,18 Z" fill="url(#goldTop)" stroke="#F5B21D" strokeWidth="0.5" />
                  <path d="M 50,18 C 70,1 79,24 50,18 Z" fill="url(#goldTop)" stroke="#F5B21D" strokeWidth="0.5" />
                  {/* Ribbon tails hanging down gracefully */}
                  <path d="M 50,18 Q 39,29 36,42 Q 39,29 50,18 Z" fill="url(#goldTop)" />
                  <path d="M 50,18 Q 61,29 64,42 Q 61,29 50,18 Z" fill="url(#goldTop)" />
                  {/* Center glowing bead */}
                  <circle cx="50" cy="18" r="4.5" fill="#FFF2AC" />
                  <circle cx="48.5" cy="16.5" r="1.5" fill="#FFFFFF" />
                </svg>
              </div>

              {/* Close button with soft transition */}
              <button 
                onClick={() => closePopup('referral-invite')}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-all p-1.5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer hover:rotate-90 duration-300"
              >
                <X size={14} />
              </button>

              <div className="mt-11 space-y-3.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded-full text-[8px] font-bold text-purple-300 uppercase tracking-widest leading-none">
                  <Gift size={9} className="text-purple-400" /> Executive Program
                </span>
                
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Share CGA
                </h3>
                
                <p className="text-[11px] text-white/60 leading-relaxed max-w-xs mx-auto">
                  Expand your quantum networking tier. Refer partners and both will receive a premium <span className="text-purple-400 font-extrabold">5% bonus</span> on their first active investment node!
                </p>

                {/* Referral Details Glass Box */}
                <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl text-left space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Referral Code</span>
                    <span className="text-xs font-black text-white tracking-widest">{profile?.referral_code || '---'}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Invitation Link</span>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-1.5 pl-2.5">
                      <span className="text-[9px] font-medium text-white/50 truncate flex-1">
                        {profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`}
                      </span>
                      <button 
                        onClick={handleCopyLink}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        {copiedLink ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modernized Luxury Share Grid */}
                <div className="mt-4">
                  <p className="text-[8px] font-bold uppercase text-white/40 tracking-widest mb-2.5">Instant Share Options</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Official WhatsApp style green gradient button */}
                    <a 
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Join Capital Growth Alliance, the elite high-frequency quant node network! Use my invitation code "' + (profile?.referral_code || '') + '" and get an exclusive 5% bonus reward on your first active node:\n' + (profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gradient-to-b from-[#25D366] to-[#1EBE5A] hover:brightness-110 border border-emerald-400/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
                        <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.76.46 3.48 1.33 5L2 22l5.15-1.35c1.5.82 3.19 1.25 4.85 1.25 5.52 0 10-4.48 10-10S17.52 2 12.004 2zm3.96 13.9c-.21.58-.81 1.07-1.38 1.25-.57.18-1.31.29-3.7-.7a11.9 11.9 0 01-5-4.43c-.87-1.15-1.38-2.54-1.38-3.95 0-1.72.89-2.54 1.25-2.91.24-.25.54-.34.78.34.19.55.77 1.88.84 2.01.07.14.07.29-.02.48l-.51.64c-.16.19-.34.4-.14.73.53.88 1.15 1.57 1.95 2.21.75.6 1.48.96 1.87 1.15.34.16.54.1.73-.13.2-.23.83-.97 1.05-1.3s.44-.27.73-.16c.3.11 1.88.89 2.21 1.05.32.16.54.24.62.38.08.14.08.82-.13 1.4z" />
                      </svg>
                      WhatsApp
                    </a>
                    
                    {/* Official Facebook style blue gradient button */}
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gradient-to-b from-[#1877F2] to-[#1565C0] hover:brightness-110 border border-blue-400/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </a>
                    
                    {/* Custom Ultimate realistic Share gradient button */}
                    <button 
                      onClick={async () => {
                        const link = profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`;
                        const text = `Join Capital Growth Alliance, the elite high-frequency quant node network! Use my invitation code "${profile?.referral_code || ''}" and get an exclusive 5% bonus reward on your first active node:`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: 'Capital Growth Alliance',
                              text: text,
                              url: link,
                            });
                          } catch (e) {
                            handleCopyLink();
                          }
                        } else {
                          handleCopyLink();
                        }
                      }}
                      className="p-2.5 bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9] hover:brightness-110 border border-purple-400/20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-500/10 cursor-pointer active:scale-95"
                    >
                      <Share2 size={22} className="filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)] animate-pulse" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXQUISITE COGNITIVE INVESTMENT PROMOTION POPUP --- */}
      <AnimatePresence>
        {showInvestPromoModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <style>{`
              @keyframes floatCoin1 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { transform: translateY(-90px) translateX(-35px) scale(1) rotate(-45deg); opacity: 0; }
              }
              @keyframes floatCoin2 {
                0% { transform: translateY(0) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-110px) translateX(40px) scale(1.1) rotate(45deg); opacity: 0; }
              }
              @keyframes floatROI {
                0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-120px) translateX(10px) scale(1); opacity: 0; }
              }
              @keyframes animGlow {
                0%, 100% { filter: drop-shadow(0 0 15px rgba(168,85,247,0.4)); }
                50% { filter: drop-shadow(0 0 30px rgba(236,72,153,0.6)); }
              }
            `}</style>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
              onClick={() => closePopup('investment-promo')}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.85, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 50 }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
              className="relative w-full max-w-[360px] bg-gradient-to-br from-[#12072b]/95 via-[#0b0c15]/98 to-[#1f0535]/95 border-2 border-purple-500/80 rounded-[30px] p-6 text-center overflow-visible shadow-[0_30px_70px_rgba(168,85,247,0.4),0_0_40px_rgba(236,72,153,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] select-none"
            >
              {/* Premium Top-Left Brand Logo inside Popup */}
              <div className="absolute top-5 left-6 flex items-center gap-1.5 pointer-events-none select-none">
                <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Logo" className="h-4.5 w-auto object-contain brightness-110" />
                <span className="text-[10px] font-serif font-black tracking-tighter uppercase italic leading-none text-white/95">CGA</span>
              </div>

              {/* Overlapping top realistic 3D Vector Globe & Charts with Sparkline floaters */}
              <div className="absolute -top-[55px] left-1/2 -translate-x-1/2 w-28 h-28 overflow-visible pointer-events-none z-20">
                <div className="absolute inset-2 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 rounded-full blur-2xl opacity-40 animate-[animGlow_4s_infinite_ease-in-out]" />
                
                {/* Floating elements inside / around graphics boundary */}
                <div className="absolute top-8 left-6 text-amber-400 font-extrabold text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)] animate-[floatCoin1_3.8s_infinite_linear]">
                  $
                </div>
                <div className="absolute top-4 right-6 text-purple-300 font-black text-xs select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(168,85,247,0.5)] animate-[floatCoin2_3.2s_infinite_linear_0.5s]">
                  $
                </div>
                <div className="absolute top-10 left-10 select-none pointer-events-none animate-[floatROI_4.5s_infinite_linear_1.1s]">
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-400/20 text-white font-mono font-black shadow-lg">
                    +2.9% Daily
                  </div>
                </div>
                <div className="absolute top-12 right-12 text-pink-400 font-black text-sm select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(244,114,182,0.4)] animate-[floatCoin1_3.5s_infinite_linear_1.8s]">
                  ✦
                </div>

                {/* Highly Luxe Neon Fintech SVG Trend Chart Visualizer */}
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_8px_20px_rgba(236,72,153,0.4)]">
                  <defs>
                    <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="radialHolo" x1="0.5" y1="0.5" r="0.5">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Holographic background sphere */}
                  <circle cx="50" cy="50" r="32" fill="url(#radialHolo)" opacity="0.45" />

                  {/* Outer Orbit Ring with nodes */}
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#A855F7" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                  <circle cx="20" cy="50" r="2" fill="#EC4899" />
                  <circle cx="80" cy="50" r="2.5" fill="#3B82F6" />
                  <circle cx="50" cy="20" r="2" fill="#F5B21D" />

                  {/* Futuristic Core Sphere */}
                  <circle cx="50" cy="50" r="22" fill="#0c0e17" stroke="url(#glowGrad)" strokeWidth="2.5" />
                  
                  {/* Glowing neon graph pattern inside core */}
                  <path d="M 38,58 L 44,48 L 50,52 L 56,40 L 62,44" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Nodes on points */}
                  <circle cx="38" cy="58" r="1.5" fill="#22C55E" />
                  <circle cx="44" cy="48" r="1.5" fill="#22C55E" />
                  <circle cx="50" cy="52" r="1.5" fill="#22C55E" />
                  <circle cx="56" cy="40" r="1.5" fill="#22C55E" />
                  <circle cx="62" cy="44" r="1.5" fill="#22C55E" />

                  {/* Emerging upward green indicator arrow */}
                  <path d="M 62,44 L 62,38 L 56,38" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Digital interface rings */}
                  <circle cx="50" cy="50" r="15" fill="none" stroke="#EC4899" strokeWidth="0.5" strokeDasharray="10 5" opacity="0.8" />
                </svg>
              </div>

              {/* Close button with sweet transition */}
              <button 
                onClick={() => closePopup('investment-promo')}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-all p-1.5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer hover:rotate-90 duration-300"
              >
                <X size={14} />
              </button>

              <div className="mt-12 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full text-[8.5px] font-black text-purple-300 uppercase tracking-widest leading-none">
                  <TrendingUp size={10} className="text-pink-400 animate-pulse" /> HIGH-YIELD QUANT NODE
                </span>
                
                <h3 className="text-base font-black text-white uppercase tracking-wide leading-tight max-w-[280px] mx-auto filter drop-shadow-md">
                  Start Your Investment Journey With WAVE Now
                </h3>
                
                <p className="text-[11px] text-white/70 leading-relaxed max-w-[260px] mx-auto font-medium">
                  Utilize artificial neural nodes to execute institutional arbitrage in real-time. <span className="text-purple-400 font-extrabold">Earn up to 2.9% daily returns</span> with secure high-frequency yield.
                </p>

                {/* Features list */}
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-2 mt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80">Automated Yield Compounding</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80">Instant Profit Claim At Any Hour</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80">Insured Node Allocation Strategy</span>
                  </div>
                </div>

                {/* Ultimate Premium Call To Action */}
                <button 
                  onClick={() => {
                    closePopup('investment-promo');
                    navigate('/invest');
                  }}
                  className="w-full mt-3 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_24px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Invest Now <ArrowRightLeft size={10} className="ml-1" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PREMIUM REAL-TIME REFERRAL & ACTIVATION POPUPS --- */}
      {/* 1. MR. A REFERRAL REWARD POPUP */}
      <AnimatePresence>
        {showClaimToast && showClaimToast.type === 'referrer' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 md:right-6 max-w-[380px] w-[calc(100vw-32px)] z-[1200] rounded-2xl bg-white dark:bg-[#090b10]/90 backdrop-blur-xl border border-purple-500/20 shadow-2xl p-5 select-none text-left overflow-hidden border-l-4 border-l-purple-500"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-80" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Trophy size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-semibold text-purple-500 dark:text-purple-400 tracking-wider">Referral Reward Active</span>
                  <button 
                    onClick={() => closePopup(`mr-a-reward-${showClaimToast.id}`)}
                    className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Claim Referral Reward
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-gray-400 mt-1 leading-relaxed">
                  Your referral <span className="text-purple-600 dark:text-purple-300 font-extrabold">{showClaimToast.partner_name}</span> has activated an investment successfully. Claim your referral reward now.
                </p>
                <div className="mt-3.5">
                  <button 
                    onClick={() => {
                      closePopup(`mr-a-reward-${showClaimToast.id}`);
                      navigate('/rewards#referral-rewards');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-[10px] uppercase font-semibold tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center cursor-pointer block"
                  >
                    Claim Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MR. B INVESTMENT ACTIVATION POPUP */}
      <AnimatePresence>
        {mrBActivationPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 md:right-6 max-w-[380px] w-[calc(100vw-32px)] z-[1200] rounded-2xl bg-white dark:bg-[#090b10]/95 backdrop-blur-xl border border-emerald-500/20 shadow-2xl p-5 select-none text-left overflow-hidden border-l-4 border-l-emerald-500"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0">
                <Gift size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">Node Active</span>
                  <button 
                    onClick={() => setMrBActivationPopup(null)}
                    className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Investment Plan Activated
                </h4>
                <div className="mt-1.5 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                  <p className="text-[10px] text-slate-600 dark:text-gray-400">
                    Plan: <span className="text-slate-900 dark:text-white font-semibold uppercase">{mrBActivationPopup.planName}</span>
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-gray-400">
                    Amount: <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">${mrBActivationPopup.amount.toFixed(2)}</span>
                  </p>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">
                  You have successfully activated your investment plan. Claim your activation reward now.
                </p>
                <div className="mt-3.5">
                  <button 
                    onClick={() => {
                      setMrBActivationPopup(null);
                      navigate('/rewards#active-node-multipliers');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] uppercase font-semibold tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center cursor-pointer block"
                  >
                    Claim Reward
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. WELCOME BONUS DEDUCTION POPUP */}
      <AnimatePresence>
        {isWelcomeBonusDeductedPopupOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 md:right-6 max-w-[380px] w-[calc(100vw-32px)] z-[1200] rounded-2xl bg-white dark:bg-[#090b10]/95 backdrop-blur-xl border border-primary/20 shadow-2xl p-5 select-none text-left overflow-hidden border-l-4 border-l-primary"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-500 opacity-80" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src="https://i.imgur.com/swuDIvl.png" 
                  alt="Premium AI Bot Active" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-semibold text-primary tracking-wider">Protocol Activation</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  AI Trading Bot Activated
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-gray-300 mt-2 leading-relaxed font-sans">
                  $10 AI Trading Bot Activation Fee has been deducted from your account.
                </p>
                <div className="mt-3.5">
                  <button 
                    disabled={isDeductingBotFee}
                    onClick={handleBotFeeAcknowledge}
                    className="w-full py-2 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/95 hover:to-indigo-600 text-white text-[10px] uppercase font-semibold tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center cursor-pointer block disabled:opacity-50"
                  >
                    {isDeductingBotFee ? "Processing..." : "OK"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DEPOSIT APPROVED INVESTMENT ACTIVATION POPUP */}
      <AnimatePresence>
        {approvedNotificationPopup && (
          <>
            {/* Backdrop Overlay only on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[1199] md:hidden backdrop-blur-xs"
              onClick={() => {
                if (approvedNotificationPopup) {
                  dismissedAlertsRef.current.add(approvedNotificationPopup.id);
                  try {
                    sessionStorage.setItem('dismissed_approved_notifications', JSON.stringify(Array.from(dismissedAlertsRef.current)));
                  } catch (e) {}
                }
                setApprovedNotificationPopup(null);
              }}
            />

            {/* Centering wrapper on mobile */}
            <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 pointer-events-none md:inset-auto md:bottom-6 md:right-6 md:p-0 md:block">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative w-full max-w-[380px] rounded-2xl bg-white dark:bg-[#090b10]/95 backdrop-blur-xl border border-primary/20 shadow-2xl p-5 select-none text-left overflow-hidden border-l-4 border-l-primary pointer-events-auto md:fixed md:bottom-6 md:right-6 md:w-[380px]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 opacity-80" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 animate-pulse">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase font-semibold text-primary tracking-wider">Approved & Ready</span>
                      <button 
                        onClick={() => {
                          if (approvedNotificationPopup) {
                            dismissedAlertsRef.current.add(approvedNotificationPopup.id);
                            try {
                              sessionStorage.setItem('dismissed_approved_notifications', JSON.stringify(Array.from(dismissedAlertsRef.current)));
                            } catch (e) {}
                          }
                          setApprovedNotificationPopup(null);
                        }}
                        className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      Investment Approved
                    </h4>
                    <div className="mt-1.5 p-2 bg-primary/5 border border-primary/10 rounded-lg">
                      <p className="text-[10px] text-slate-600 dark:text-gray-400">
                        Plan: <span className="text-slate-900 dark:text-white font-semibold uppercase">{approvedNotificationPopup.planName}</span>
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-gray-400">
                        Amount: <span className="text-primary font-bold font-mono">${approvedNotificationPopup.amount.toLocaleString()}</span>
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">
                      Your submitted investment has been verified and approved by administration. Activate it now to start compiling your ROI yield.
                    </p>
                    <div className="mt-3.5">
                      <button 
                        onClick={() => {
                          if (approvedNotificationPopup) {
                            dismissedAlertsRef.current.add(approvedNotificationPopup.id);
                            try {
                              sessionStorage.setItem('dismissed_approved_notifications', JSON.stringify(Array.from(dismissedAlertsRef.current)));
                            } catch (e) {}
                          }
                          setApprovedNotificationPopup(null);
                          navigate('/dashboard', { state: { showInactive: true } });
                        }}
                        className="w-full py-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white text-[10px] uppercase font-semibold tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center cursor-pointer block"
                      >
                        Activate Investment
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 5. FLOATING CONTROLS ROW */}
      <AnimatePresence>
        {(location.pathname === '/home' || location.pathname === '/') && (
          <>
            {/* Desktop and Tablet: Floating Telegram Button at the bottom right side */}
            <div className="hidden md:block fixed right-8 bottom-8 z-[110] pointer-events-auto">
              <WhatsAppCommunitySlider />
            </div>

            {/* Mobile Bottom Right: Floating Telegram Button a bit lower */}
            <div className="md:hidden fixed right-4 bottom-[88px] z-[110] pointer-events-auto">
              <WhatsAppCommunitySlider />
            </div>

            {/* Choice Modal for Spin & Mine */}
            <AnimatePresence>
              {isSpinMineOpen && (
                <div 
                  className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 font-sans pointer-events-auto" 
                  onClick={() => setIsSpinMineOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-[#0b0e14]/98 border border-slate-200 dark:border-white/10 rounded-[36px] max-w-sm w-full p-6 relative overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button 
                      onClick={() => setIsSpinMineOpen(false)}
                      className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-full transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>

                    <div className="space-y-3.5 mt-8">
                      {/* Option 1: Spin & Win */}
                      <button
                        onClick={() => {
                          setIsSpinMineOpen(false);
                          navigate('/spin');
                        }}
                        className="w-full text-left p-4.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/15 hover:to-indigo-500/15 border border-primary/20 hover:border-primary/45 rounded-[24px] transition-all duration-300 group flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl group-hover:scale-105 transition-transform">
                            {/* SVG Mini Wheel */}
                            <svg viewBox="0 0 100 100" className="w-5 h-5">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="14 14" />
                              <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="4" />
                              <circle cx="50" cy="50" r="10" fill="currentColor" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-wide">Spin & Win Wheel</h4>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Activate random outcome rewards</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Option 2: CGA Token Mining */}
                      <button
                        onClick={() => {
                          setIsSpinMineOpen(false);
                          navigate('/mining');
                        }}
                        className="w-full text-left p-4.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 hover:from-amber-500/15 hover:to-emerald-500/15 border border-amber-500/20 hover:border-emerald-500/30 rounded-[24px] transition-all duration-300 group flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
                            <Cpu size={18} className="text-amber-500 dark:text-amber-400 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-wide">CGA Token Portal</h4>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Operate high-end ASIC harvesters</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    <div className="mt-5 text-center">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">WAVE MAINNET SYSTEM SECURE</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPremiumSuccessOpen && premiumSuccessData && (
          <PremiumTransferSuccessModal
            isOpen={isPremiumSuccessOpen}
            onClose={() => setIsPremiumSuccessOpen(false)}
            amount={premiumSuccessData.amount}
            type={premiumSuccessData.type}
            planName={premiumSuccessData.planName}
            startTime={premiumSuccessData.startTime}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
