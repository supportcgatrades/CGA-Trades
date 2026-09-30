import React, { useState, useEffect, useMemo } from 'react';
import { broadcastActivity } from '../lib/activity_logger';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup,
  updatePassword,
  EmailAuthProvider,
  linkWithCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  collection, 
  where, 
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { 
  getDeviceFingerprint, 
  checkDeviceStatus, 
  registerDevice, 
  generateOTP, 
  sendOTP, 
  verifyOTP,
  logAudit 
} from '../lib/auth_security';
import { EditableText } from './Editable';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  X, 
  Menu,
  Mail, 
  Lock, 
  User, 
  Phone, 
  UserPlus, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronLeft,
  Shield,
  Star,
  Compass,
  Zap,
  Sun,
  Moon,
  Monitor,
  Search
} from 'lucide-react';
import { REVIEWS } from '../constants/landingData';
import { COUNTRIES, Country } from '../constants/countries';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from './Footer';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { normalizePhoneNumber, getPhoneLookupCandidates, getCountryDialCode, getCountryMaxNationalLength } from '../utils/phone';

// --- HELPERS ---
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePublicId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const Realistic3DIcon = ({ type }: { type: 'user' | 'plan' | 'fund' | 'node' }) => {
  if (type === 'user') {
    return (
      <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(124,58,237,0.35)] hover:rotate-6 transition-all duration-500">
        {/* 3D Gold & Glass Shield */}
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gold3d-grad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="30%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="purple3d-grad2" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6D28D9" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#DDD6FE" />
            </linearGradient>
            <radialGradient id="specular-light" cx="30" cy="30" r="30" fx="30" fy="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="35" ry="8" fill="#000000" fillOpacity="0.4" />
          <circle cx="50" cy="46" r="34" stroke="url(#purple3d-grad2)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
          <circle cx="50" cy="32" r="16" fill="url(#gold3d-grad1)" />
          <circle cx="45" cy="27" r="16" fill="url(#specular-light)" />
          <path d="M22 68 C22 56, 32 48, 50 48 C68 48, 78 56, 78 68 L74 74 L26 74 Z" fill="url(#gold3d-grad1)" />
          <path d="M22 68 C22 56, 32 48, 50 48 C68 48, 78 56, 78 68 L74 74 L26 74 Z" fill="url(#specular-light)" opacity="0.4" />
          <path d="M15 46 L50 15 L85 46 L50 82 Z" fill="#FFFFFF" fillOpacity="0.1" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.25" style={{ backdropFilter: 'blur(4px)' }} />
          <path d="M15 46 L50 15 L50 82 Z" fill="#FFFFFF" fillOpacity="0.08" />
        </svg>
      </div>
    );
  }

  if (type === 'plan') {
    return (
      <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(14,165,233,0.35)] hover:-rotate-6 transition-all duration-500">
        {/* 3D Cyan & Emerald Glass Ledger Stack */}
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cyan3d-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="emerald3d-grad" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="glass-reflection" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="38" ry="7" fill="#000000" fillOpacity="0.5" />
          <path d="M20 62 L50 74 L80 62 L50 50 Z" fill="url(#emerald3d-grad)" />
          <path d="M20 62 L50 74 L50 80 L20 68 Z" fill="#047857" />
          <path d="M50 74 L80 62 L80 68 L50 80 Z" fill="#065F46" />
          <line x1="50" y1="36" x2="50" y2="60" stroke="#0E1E2F" strokeWidth="5" />
          <line x1="50" y1="36" x2="50" y2="60" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="2 2" className="animate-pulse" />
          <path d="M22 34 L50 16 L78 34 L50 52 Z" fill="url(#cyan3d-grad)" fillOpacity="0.85" />
          <path d="M22 34 L50 16 L50 52 Z" fill="url(#glass-reflection)" fillOpacity="0.4" />
          <ellipse cx="50" cy="34" rx="42" ry="12" stroke="#10B981" strokeWidth="2" strokeDasharray="6 12" />
        </svg>
      </div>
    );
  }

  if (type === 'fund') {
    return (
      <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.35)] hover:scale-110 transition-all duration-500">
        {/* 3D Glossy Gold Coin Chest / Vault Node */}
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gold-bright" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="gold-dark" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="36" ry="8" fill="#000000" fillOpacity="0.5" />
          <path d="M22 64 C22 58, 42 58, 42 64 L42 76 C42 82, 22 82, 22 76 Z" fill="url(#gold-dark)" />
          <ellipse cx="32" cy="64" rx="10" ry="4" fill="url(#gold-bright)" />
          <path d="M58 58 C58 52, 78 52, 78 58 L78 70 C78 76, 58 76, 58 70 Z" fill="url(#gold-dark)" />
          <ellipse cx="68" cy="58" rx="10" ry="4" fill="url(#gold-bright)" />
          <circle cx="50" cy="46" r="22" fill="url(#gold-bright)" />
          <circle cx="50" cy="46" r="14" fill="#111827" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="50" cy="46" r="6" fill="url(#gold-dark)" />
          <path d="M50 36 L50 56 M40 46 L60 46" stroke="url(#gold-bright)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(168,85,247,0.35)] hover:rotate-12 transition-all duration-500">
      {/* 3D Core Fusion Node */}
      <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="purple-core" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>
          <linearGradient id="neon-glow" x1="0" y1="90" x2="100" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="88" rx="40" ry="8" fill="#000000" fillOpacity="0.5" />
        <ellipse cx="50" cy="46" rx="42" ry="18" stroke="url(#neon-glow)" strokeWidth="3" opacity="0.6" strokeDasharray="30 15" transform="rotate(-15 50 46)" />
        <ellipse cx="50" cy="46" rx="42" ry="18" stroke="url(#neon-glow)" strokeWidth="2" opacity="0.4" strokeDasharray="30 15" transform="rotate(35 50 46)" />
        <circle cx="50" cy="46" r="20" fill="url(#purple-core)" />
        <circle cx="43" cy="39" r="6" fill="#FFFFFF" fillOpacity="0.6" filter="blur(1px)" />
        <circle cx="16" cy="24" r="5" fill="#A855F7" />
        <line x1="50" y1="46" x2="16" y2="24" stroke="#A855F7" strokeWidth="2.5" opacity="0.7" />
        <circle cx="84" cy="24" r="5" fill="#EC4899" />
        <line x1="50" y1="46" x2="84" y2="24" stroke="#EC4899" strokeWidth="2.5" opacity="0.7" />
        <circle cx="50" cy="80" r="5" fill="#3B82F6" />
        <line x1="50" y1="46" x2="50" y2="80" stroke="#3B82F6" strokeWidth="2.5" opacity="0.7" />
      </svg>
    </div>
  );
};

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, effectiveTheme, isDark, setTheme } = useTheme();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const languageRef = React.useRef<HTMLDivElement>(null);
  const themeRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderThemeSelector = () => (
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
        aria-label="Theme selector"
      >
        {effectiveTheme === 'dark' ? (
          <Moon size={17} className="transition-transform duration-300 hover:scale-110" />
        ) : (
          <Sun size={17} className="transition-transform duration-300 hover:scale-110" />
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
              "absolute top-full right-0 mt-2 w-48 rounded-2xl border shadow-2xl z-[150] overflow-hidden backdrop-blur-xl p-1.5 space-y-1",
              isDark ? "bg-[#11141b]/95 border-white/10" : "bg-white/95 border-aura-line shadow-lg"
            )}
          >
            <div className={cn(
              "px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] border-b mb-1",
              isDark ? "text-white/40 border-white/5" : "text-slate-400 border-slate-100"
            )}>
              Theme Preference
            </div>

            {/* System */}
            <button
              onClick={() => {
                setTheme('system');
                setIsThemeOpen(false);
              }}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                theme === 'system'
                  ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                  : isDark
                    ? "text-white/60 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Monitor size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">System</span>
              </div>
              {theme === 'system' && <CheckCircle2 size={13} className="text-current" />}
            </button>

            {/* Light */}
            <button
              onClick={() => {
                setTheme('light');
                setIsThemeOpen(false);
              }}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                theme === 'light'
                  ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                  : isDark
                    ? "text-white/60 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Sun size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Light</span>
              </div>
              {theme === 'light' && <CheckCircle2 size={13} className="text-current" />}
            </button>

            {/* Dark */}
            <button
              onClick={() => {
                setTheme('dark');
                setIsThemeOpen(false);
              }}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                theme === 'dark'
                  ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                  : isDark
                    ? "text-white/60 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Moon size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Dark</span>
              </div>
              {theme === 'dark' && <CheckCircle2 size={13} className="text-current" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderLanguageSelector = () => (
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
            className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#11141b]/95 shadow-2xl z-[150] overflow-hidden backdrop-blur-xl"
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
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
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
  );

  const shouldReduceMotion = useReducedMotion();

  const isCountryPath = 
    typeof window !== 'undefined' && (
      window.location.pathname === '/country-selection' || 
      window.location.pathname === '/select-country' || 
      window.location.pathname === '/cga-traits' || 
      window.location.pathname === '/traits'
    );
  const isSignupPath = typeof window !== 'undefined' && window.location.pathname === '/signup';

  const [showCountrySelection, setShowCountrySelection] = useState<boolean>(() => {
    if (isCountryPath) return true;
    if (isSignupPath) {
      try {
        const stored = localStorage.getItem('cga_signup_country') || sessionStorage.getItem('cga_signup_country');
        if (!stored) return true;
      } catch (e) {}
    }
    return false;
  });

  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const filteredCountries = useMemo(() => {
    const term = countrySearchTerm.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [countrySearchTerm]);

  const [isModalOpen, setIsModalOpen] = useState(() => {
    if (isCountryPath) return false;
    if (isSignupPath) {
      try {
        const stored = localStorage.getItem('cga_signup_country') || sessionStorage.getItem('cga_signup_country');
        if (stored) return true;
      } catch (e) {}
    }
    return false;
  });
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [detectedCountry, setDetectedCountry] = useState(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Europe/London')) return 'gb';
      if (tz.includes('Africa/Lagos')) return 'ng';
      if (tz.includes('Africa/Nairobi')) return 'ke';
      if (tz.includes('Africa/Johannesburg')) return 'za';
      if (tz.includes('Asia/Kolkata')) return 'in';
      if (tz.includes('America/New_York') || tz.includes('America/Chicago') || tz.includes('America/Los_Angeles')) return 'us';
    } catch (e) {}
    try {
      const lang = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
      if (lang.includes('GB') || lang.includes('gb')) return 'gb';
      if (lang.includes('NG') || lang.includes('ng')) return 'ng';
      if (lang.includes('KE') || lang.includes('ke')) return 'ke';
      if (lang.includes('IN') || lang.includes('in')) return 'in';
    } catch (e) {}
    return 'us';
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hero carousel slider state
  const carouselImages = [
    "https://i.imgur.com/XOcTzj3.png",
    "https://i.imgur.com/n5lZDsk.png",
    "https://i.imgur.com/0N02qUY.png"
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, carouselImages.length]);

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Newsletter subscription states & handlers
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [showNewsletterSuccessModal, setShowNewsletterSuccessModal] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailStr = newsletterEmail.trim();
    if (!emailStr) {
      toast.error("Please enter your email address.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setNewsletterLoading(true);
    const cleanEmail = emailStr.toLowerCase().trim();
    try {
      let saved = false;
      try {
        await addDoc(collection(db, 'newsletter_subscribers'), {
          email: cleanEmail,
          created_at: serverTimestamp()
        });
        saved = true;
      } catch (clientErr) {
        console.warn("Direct Firestore subscription write notice, trying server fallback:", clientErr);
      }

      if (!saved) {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: cleanEmail })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Subscription could not be processed at this time.");
        }
      }

      setNewsletterEmail('');
      setShowNewsletterSuccessModal(true);
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      toast.error(err.message || "Subscription could not be processed at this time.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Signup Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Selected Country from Country Selection Landing Page
  interface SelectedCountryState {
    countryName: string;
    countryCode: string;
    countryFlag: string;
    name?: string;
    code?: string;
    flag?: string;
  }
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountryState | null>(() => {
    try {
      const stored = localStorage.getItem('cga_signup_country') || sessionStorage.getItem('cga_signup_country');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  // Signin Fields - Normal signin uses Phone Number + Password
  const [signinPhone, setSigninPhone] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  // Google User Setup States (Phone Number + Password Setup prompt)
  const [googleSetupUser, setGoogleSetupUser] = useState<FirebaseUser | null>(null);
  const [isGoogleSetupOpen, setIsGoogleSetupOpen] = useState(false);
  const [googlePhone, setGooglePhone] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState('');
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [showGoogleConfirmPassword, setShowGoogleConfirmPassword] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  
  // Security States
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  const [tempUser, setTempUser] = useState<FirebaseUser | null>(null);

  // Username: automatic lowercase conversion
  const handleUsernameChange = (val: string) => {
    setUsername(val.toLowerCase());
  };

  // Country-specific phone digit management
  const activeCountryCode = (selectedCountry?.countryCode || detectedCountry || 'NG').toUpperCase();
  const currentDialCode = getCountryDialCode(activeCountryCode);
  const maxPhoneDigits = getCountryMaxNationalLength(activeCountryCode);

  const handlePhoneChange = (val: string, countryData?: any) => {
    const code = (countryData?.countryCode || activeCountryCode).toUpperCase();
    const dialCode = countryData?.dialCode || getCountryDialCode(code);
    const maxDigits = getCountryMaxNationalLength(code);

    if (!val) {
      setPhone('');
      return;
    }

    const clean = val.replace(/\D/g, '');
    let national = '';
    if (clean.startsWith(dialCode)) {
      national = clean.slice(dialCode.length);
    } else {
      national = clean;
    }

    if (national.startsWith('0') && national.length > 1) {
      national = national.replace(/^0+/, '');
    }

    if (national.length > maxDigits) {
      national = national.slice(0, maxDigits);
    }

    setPhone(`${dialCode}${national}`);
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;

    const dialCode = currentDialCode;
    const maxDigits = maxPhoneDigits;
    const cleanDigits = pasted.replace(/\D/g, '');

    let national = cleanDigits;
    if (cleanDigits.startsWith(dialCode)) {
      national = cleanDigits.slice(dialCode.length);
    } else if (cleanDigits.startsWith('0')) {
      national = cleanDigits.replace(/^0+/, '');
    }

    const clampedNational = national.slice(0, maxDigits);
    setPhone(`${dialCode}${clampedNational}`);
  };

  const handleSelectCountry = (country: Country) => {
    const signupContext = {
      countryName: country.name,
      countryCode: country.code,
      countryFlag: country.flag,
      name: country.name,
      code: country.code,
      flag: country.flag
    };

    // 1. Immediately update UI state so country, flag, and phone adapt instantly
    setSelectedCountry(signupContext);
    const newDialCode = getCountryDialCode(country.code);
    const newMaxDigits = getCountryMaxNationalLength(country.code);
    setPhone((prev) => {
      if (!prev) return '';
      const raw = prev.replace(/\D/g, '');
      const prevDial = getCountryDialCode(selectedCountry?.countryCode || detectedCountry);
      let national = raw.startsWith(prevDial) ? raw.slice(prevDial.length) : raw;
      if (national.startsWith('0') && national.length > 1) {
        national = national.replace(/^0+/, '');
      }
      if (national.length > newMaxDigits) {
        national = national.slice(0, newMaxDigits);
      }
      return `${newDialCode}${national}`;
    });
    setAuthMode('signup');
    setIsModalOpen(true);
    setShowCountrySelection(false);

    // 2. Perform non-blocking persistence
    try {
      localStorage.setItem('cga_signup_country', JSON.stringify(signupContext));
      sessionStorage.setItem('cga_signup_country', JSON.stringify(signupContext));
    } catch (e) {
      console.warn("Storage quota / error saving selected country:", e);
    }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || referralCode;
    const targetUrl = ref ? `/signup?ref=${encodeURIComponent(ref)}` : '/signup';
    window.history.pushState(null, '', targetUrl);
  };

  const handleOpenCountrySelection = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || referralCode;
    const targetUrl = ref ? `/country-selection?ref=${encodeURIComponent(ref)}` : '/country-selection';
    window.history.pushState(null, '', targetUrl);
    setCountrySearchTerm('');
    setShowCountrySelection(true);
    setIsModalOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    const isSignup = location.pathname === '/signup';
    const isCountry = 
      location.pathname === '/country-selection' || 
      location.pathname === '/select-country' || 
      location.pathname === '/cga-traits' || 
      location.pathname === '/traits';
    
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }

    const storedCountryStr = localStorage.getItem('cga_signup_country') || sessionStorage.getItem('cga_signup_country');
    let storedCountry = null;
    if (storedCountryStr) {
      try { storedCountry = JSON.parse(storedCountryStr); } catch (e) {}
    }

    if (isCountry) {
      setShowCountrySelection(true);
      setIsModalOpen(false);
    } else if (isSignup) {
      if (!storedCountry) {
        setShowCountrySelection(true);
        setIsModalOpen(false);
      } else {
        setSelectedCountry(storedCountry);
        setAuthMode('signup');
        setIsModalOpen(true);
        setShowCountrySelection(false);
      }
    } else if (ref && storedCountry) {
      setSelectedCountry(storedCountry);
      setAuthMode('signup');
      setIsModalOpen(true);
      setShowCountrySelection(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const isCountry = path === '/country-selection' || path === '/select-country' || path === '/cga-traits' || path === '/traits';
      const isSignup = path === '/signup';
      if (isCountry) {
        setShowCountrySelection(true);
        setIsModalOpen(false);
      } else if (isSignup) {
        setShowCountrySelection(false);
        setIsModalOpen(true);
        setAuthMode('signup');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      toast.error("Username is required.");
      return;
    }
    if (username !== cleanUsername) {
      setUsername(cleanUsername);
    }
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    if (!phone || phone.trim().length < 5) {
      toast.error("Valid phone number is required.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    try {
      const countryContext = selectedCountry || {
        countryName: 'Nigeria',
        countryCode: 'NG',
        countryFlag: '🇳🇬'
      };

      const normalizedPhone = normalizePhoneNumber(phone, countryContext.countryCode);
      if (!normalizedPhone) {
        toast.error("Valid phone number is required.");
        setLoading(false);
        return;
      }

      // Check if another account is already registered with this phone number in Firestore
      const phoneCandidates = getPhoneLookupCandidates(phone, countryContext.countryCode);
      const existingPhoneSnap = await getDocs(query(collection(db, 'users'), where('phone', 'in', phoneCandidates.slice(0, 30))));
      if (!existingPhoneSnap.empty) {
        toast.error("An account with this phone number already exists. Please sign in.");
        setAuthMode('signin');
        setSigninPhone(phone);
        setLoading(false);
        return;
      }

      // Validate Referral Code if provided
      let referrerId: string | null = null;
      let referrerCodeValue: string | null = null;
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast.error("The referral code you entered does not exist.");
          setLoading(false);
          return;
        }
        referrerId = snap.docs[0].id;
        referrerCodeValue = cleanRef;
      }

      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      // 2. Create the Firestore User Profile IMMEDIATELY while user is authenticated!
      const isCipherUser = firebaseUser.email === 'support@tavariwave.network' || 
                           firebaseUser.email === 'contact.cga.usa@gmail.com' || 
                           firebaseUser.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
      const userRefCode = isCipherUser ? 'CIPHER' : generateReferralCode();
      const newUserProfile = {
        uid: firebaseUser.uid,
        name: fullName.trim() || 'Nexus User',
        username: cleanUsername || 'user',
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        country: countryContext.countryName,
        countryName: countryContext.countryName,
        country_code: countryContext.countryCode,
        countryCode: countryContext.countryCode,
        country_flag: countryContext.countryFlag,
        countryFlag: countryContext.countryFlag,
        public_id: generatePublicId(),
        referral_code: userRefCode,
        referral_link: `${window.location.origin}/signup?ref=${userRefCode}`,
        referred_by: referrerId,
        referrer_uid: referrerId,
        referrer_code: referrerCodeValue,
        referrals_count: 0,
        active_referrals: 0,
        referral_earnings: 0,
        role: isCipherUser ? 'cipher' : 'user',
        funding_balance: 0,
        available_balance: 0,
        total_earnings: 0,
        total_invested: 10, // $10 signup bonus directly into Assets Balance
        email_verified: false,
        suspended: false,
        banned: false,
        roi_disabled: false,
        withdrawals_frozen: false,
        transfers_frozen: false,
        created_at: new Date().toISOString(),
        roi_cycle_start: new Date().toISOString(),
        last_rebook: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfile);
        
        broadcastActivity(
          newUserProfile.name || "New Partner",
          "Registered",
          undefined,
          true,
          "👤"
        );
        
        // Generate an idempotent signup bonus transaction record
        const txId = `signup-bonus-${firebaseUser.uid}`;
        await setDoc(doc(db, 'transactions', txId), {
          user_id: firebaseUser.uid,
          type: 'signup_bonus',
          amount: 10,
          created_at: new Date().toISOString(),
          status: 'approved',
          description: "Congratulations, you have just received a $10 signup bonus into your assets balance."
        });

        if (referrerId) {
          try {
            await updateDoc(doc(db, 'users', referrerId), {
              referrals_count: increment(1)
            });
          } catch (e) {
            console.error("Failed to increment referrals_count", e);
          }
        }
      } catch (profileErr) {
        console.error("Error setting initial profile in Firestore during signup:", profileErr);
      }

      // 3. Send Verification (With Robust Retry)
      let emailSent = false;
      let emailAttempts = 0;
      while (!emailSent && emailAttempts < 2) {
        try {
          await sendEmailVerification(firebaseUser);
          emailSent = true;
        } catch (verifyError: any) {
          emailAttempts++;
          console.warn(`Verification email attempt ${emailAttempts} failed:`, verifyError);
          if (emailAttempts >= 2) {
            throw new Error("Failed to send verification email. Please check your internet connection or try again later.");
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // 4. Cache signup data with persistent selected country for post-verification profile creation
      try {
        const pendingData = {
          fullName: fullName.trim(),
          username: cleanUsername,
          phone: normalizedPhone,
          referralCode: referralCode.trim(),
          email: email.trim().toLowerCase(),
          country: countryContext.countryName,
          countryName: countryContext.countryName,
          country_code: countryContext.countryCode,
          countryCode: countryContext.countryCode,
          country_flag: countryContext.countryFlag,
          countryFlag: countryContext.countryFlag,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`pending_signup_${firebaseUser.uid}`, JSON.stringify(pendingData));
      } catch (cacheError) {
        console.error("Critical: Failed to cache signup data", cacheError);
      }
      
      // 5. Sign out to enforce verification on next login
      await auth.signOut();

      // 6. Trigger Success View
      setSigninPhone(phone);
      setSigninPassword(password);
      setVerificationSent(true);
      toast.success("Verification email sent!");
      
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Account already exists. Please sign in.");
        setAuthMode('signin');
        setSigninPhone(phone);
      } else if (error.message.includes('permission')) {
        toast.error("Referral validation failed due to security protocols. Please refresh and try again.");
      } else {
        toast.error(error.message || "An error occurred during signup.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmedInput = signinPhone.trim();
      if (!trimmedInput) {
        toast.error("Please enter your phone number.");
        setLoading(false);
        return;
      }
      if (!signinPassword) {
        toast.error("Please enter your password.");
        setLoading(false);
        return;
      }

      let resolvedEmail = '';

      if (trimmedInput.includes('@')) {
        resolvedEmail = trimmedInput.toLowerCase();
      } else {
        const countryCode = selectedCountry?.countryCode || 'NG';
        const candidates = getPhoneLookupCandidates(trimmedInput, countryCode);

        const usersRef = collection(db, 'users');
        let snap = await getDocs(query(usersRef, where('phone', 'in', candidates.slice(0, 30))));

        if (snap.empty) {
          const canonical = normalizePhoneNumber(trimmedInput, countryCode);
          if (canonical && !candidates.includes(canonical)) {
            snap = await getDocs(query(usersRef, where('phone', '==', canonical)));
          }
        }

        if (snap.empty) {
          toast.error("No account found with this phone number. Please check your phone number or sign up.");
          setLoading(false);
          return;
        }

        // Verify exactly one account associated with this phone number
        if (snap.docs.length > 1) {
          const uniqueEmails = Array.from(new Set(snap.docs.map(d => d.data().email).filter(Boolean)));
          if (uniqueEmails.length === 1) {
            resolvedEmail = uniqueEmails[0];
          } else {
            toast.error("Multiple accounts found with this phone number. Please sign in with your email or contact support.");
            setLoading(false);
            return;
          }
        } else {
          resolvedEmail = snap.docs[0].data().email;
        }

        if (!resolvedEmail) {
          toast.error("No email associated with this account. Please contact support.");
          setLoading(false);
          return;
        }
      }

      // STEP 1: Authenticate user in Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, signinPassword);
      let firebaseUser = userCredential.user;

      // STEP 2: Reload auth state and check email verification first
      await firebaseUser.reload();
      firebaseUser = auth.currentUser || firebaseUser;

      const isCipherUser = firebaseUser.email === 'support@tavariwave.network' || 
                       firebaseUser.email === 'contact.cga.usa@gmail.com' || 
                       firebaseUser.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';

      if (!firebaseUser.emailVerified && !isCipherUser) {
        toast.error("Please verify your email before signing in.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Force token refresh so Firestore rules recognize new authentication state
      await firebaseUser.getIdToken(true);

      // STEP 3: Safe, non-blocking profile retrieval
      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      } catch (err: any) {
        console.warn("Soft-caught Firestore permission/fetch error in handleSignin:", err);
      }

      // Update email_verified in Firestore if it was false
      if (userDoc?.exists() && userDoc.data()?.email_verified !== true) {
        updateDoc(doc(db, 'users', firebaseUser.uid), { email_verified: true }).catch(() => {});
      }

      // Harmonize phone to canonical format if needed
      if (userDoc?.exists() && userDoc.data()?.phone) {
        const canonicalPhone = normalizePhoneNumber(userDoc.data().phone, userDoc.data().countryCode || selectedCountry?.countryCode);
        if (canonicalPhone && userDoc.data().phone !== canonicalPhone) {
          updateDoc(doc(db, 'users', firebaseUser.uid), { phone: canonicalPhone }).catch(() => {});
        }
      }

      // STEP 4: Device Fingerprint & Security Verification
      const deviceId = getDeviceFingerprint();
      const trustedDevicesKey = `trusted_devices_${firebaseUser.uid}`;
      const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
      const isNewDevice = !trustedDevices.includes(deviceId);

      // Extract transaction PIN (stored in profile as transfer_pin)
      const profileData = userDoc?.exists() ? userDoc.data() : null;
      const userPin = profileData?.transfer_pin;

      if (isNewDevice && userPin && !isCipherUser) {
        // Unknown device and user has a Transaction PIN -> Prompt for PIN
        setTempUser(firebaseUser);
        setRequiresOtp(true); // Reuse verification panel for Enter PIN
        setLoading(false);
        toast.info("New device detected. Verification required.");
        logAudit(firebaseUser.uid, 'mfa_triggered_pin', { deviceId }).catch(() => {});
        return;
      }

      // STEP 5: Create user profile if it doesn't exist (first-time login)
      if (!userDoc || !userDoc.exists()) {
        console.log("User document missing. Creating fallback profile...");
        const cachedDataStr = localStorage.getItem(`pending_signup_${firebaseUser.uid}`);
        let pendingData = null;
        if (cachedDataStr) {
          try { pendingData = JSON.parse(cachedDataStr); } catch (e) {}
        }
        
        let referrerId: string | null = null;
        let referrerCodeValue: string | null = null;
        
        if (pendingData?.referralCode?.trim()) {
          const cleanRef = pendingData.referralCode.trim().toUpperCase();
          const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
          try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              referrerId = querySnapshot.docs[0].id;
              referrerCodeValue = cleanRef;
            }
          } catch (e) {
            console.warn("Failed querying referral code silently:", e);
          }
        }

        const userRefCode = isCipherUser ? 'CIPHER' : generateReferralCode();
        const newUserProfile = {
          uid: firebaseUser.uid,
          name: isCipherUser ? 'Cipher' : (pendingData?.fullName || firebaseUser.displayName || 'Nexus User'),
          username: isCipherUser ? 'cipher_root' : (pendingData?.username || firebaseUser.email?.split('@')[0] || 'user'),
          email: firebaseUser.email || '',
          phone: normalizePhoneNumber(pendingData?.phone || signinPhone, pendingData?.countryCode || selectedCountry?.countryCode),
          country: pendingData?.country || pendingData?.countryName || selectedCountry?.countryName || 'Nigeria',
          countryName: pendingData?.countryName || pendingData?.country || selectedCountry?.countryName || 'Nigeria',
          country_code: pendingData?.countryCode || selectedCountry?.countryCode || 'NG',
          countryCode: pendingData?.countryCode || selectedCountry?.countryCode || 'NG',
          country_flag: pendingData?.countryFlag || selectedCountry?.countryFlag || '🇳🇬',
          countryFlag: pendingData?.countryFlag || selectedCountry?.countryFlag || '🇳🇬',
          public_id: generatePublicId(),
          referral_code: userRefCode,
          referral_link: `${window.location.origin}/signup?ref=${userRefCode}`,
          referred_by: referrerId,
          referrer_uid: referrerId,
          referrer_code: referrerCodeValue,
          referrals_count: 0,
          active_referrals: 0,
          referral_earnings: 0,
          role: isCipherUser ? 'cipher' : 'user',
          funding_balance: 0,
          available_balance: 0,
          total_earnings: 0,
          total_invested: 10, // $10 signup bonus directly into Assets Balance
          email_verified: true,
          suspended: false,
          banned: false,
          roi_disabled: false,
          withdrawals_frozen: false,
          transfers_frozen: false,
          created_at: new Date().toISOString(),
          roi_cycle_start: new Date().toISOString(),
          last_rebook: new Date().toISOString()
        };

        if (referrerId) {
          try {
            await updateDoc(doc(db, 'users', referrerId), {
              referrals_count: increment(1)
            });
          } catch (e) {
            console.error("Failed to increment referrals_count", e);
          }
        }

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfile);
          
          broadcastActivity(
            newUserProfile.name || "New Partner",
            "Registered",
            undefined,
            true,
            "👤"
          );
          
          // Generate an idempotent signup bonus transaction record
          const txId = `signup-bonus-${firebaseUser.uid}`;
          await setDoc(doc(db, 'transactions', txId), {
            user_id: firebaseUser.uid,
            type: 'signup_bonus',
            amount: 10,
            created_at: new Date().toISOString(),
            status: 'approved',
            description: "Congratulations, you have just received a $10 signup bonus into your assets balance."
          });
        } catch (setErr) {
          console.warn("Grace-failed setting profile on sign-in, AuthContext will auto-heal:", setErr);
        }
        if (cachedDataStr) localStorage.removeItem(`pending_signup_${firebaseUser.uid}`);
      }

      // Register device and store locally as trusted
      try {
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
      } catch (e) {}

      // Register in Firestore silently
      registerDevice(firebaseUser.uid, deviceId).catch(() => {});
      logAudit(firebaseUser.uid, 'login_success').catch(() => {});

      if (isCipherUser) {
        toast.success("Cipher Terminal Accessed");
        navigate('/cipher');
      } else {
        toast.success("Identity Verified. Welcome back!");
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      console.error("Sign-in process error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error("Invalid login credentials.");
      } else {
        toast.error(error.message || "An unexpected error occurred during sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    
    setLoading(true);
    try {
      let storedPin: string | null = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', tempUser.uid));
        if (userDoc.exists()) {
          storedPin = userDoc.data().transfer_pin || null;
        }
      } catch (err) {
        console.error("Failed fetching PIN on device verify:", err);
      }

      if (!storedPin) {
        // Fallback: If no PIN found on server, allow login immediately (requirement)
        toast.success("Verified. Welcome back!");
        const deviceId = getDeviceFingerprint();
        const trustedDevicesKey = `trusted_devices_${tempUser.uid}`;
        const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
        await registerDevice(tempUser.uid, deviceId).catch(() => {});
        navigate('/home', { replace: true });
        return;
      }

      if (userOtp === storedPin) {
        toast.success("PIN Verified. Access granted.");
        await logAudit(tempUser.uid, 'mfa_success_pin').catch(() => {});
        
        const deviceId = getDeviceFingerprint();
        const trustedDevicesKey = `trusted_devices_${tempUser.uid}`;
        const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
        
        await registerDevice(tempUser.uid, deviceId).catch(() => {});
        navigate('/home', { replace: true });
      } else {
        toast.error("Invalid transaction PIN.");
        await logAudit(tempUser.uid, 'mfa_failed_pin', { reason: 'invalid_pin' }).catch(() => {});
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Validate Referral Code if provided first
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const q = query(collection(db, 'users'), where('referral_code', '==', cleanRef));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast.error("The referral code you entered does not exist.");
          setLoading(false);
          return;
        }
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Force refreshing the user authentication token immediately.
      // This is crucial because it updates the token claims (like email_verified) in the client state synchronously,
      // which allows Firestore security rules to immediately recognize the Google user authentication and permissions.
      await user.getIdToken(true);

      const isCipher = user.email === 'support@tavariwave.network' || user.email === 'contact.cga.usa@gmail.com' || user.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';

      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err: any) {
        console.warn("Soft-caught Firestore permission/fetch error in handleGoogleAuth:", err);
      }

      // Device Fingerprint & Security Verification matching the email/password sign-in flow
      const deviceId = getDeviceFingerprint();
      const trustedDevicesKey = `trusted_devices_${user.uid}`;
      const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
      const isNewDevice = !trustedDevices.includes(deviceId);

      const profileData = userDoc?.exists() ? userDoc.data() : null;
      const userPin = profileData?.transfer_pin;

      if (isNewDevice && userPin && !isCipher) {
        setTempUser(user);
        setRequiresOtp(true);
        setLoading(false);
        toast.info("New device detected. Verification required.");
        logAudit(user.uid, 'mfa_triggered_pin', { deviceId }).catch(() => {});
        return;
      }

      if (!userDoc || !userDoc.exists() || !userDoc.data()?.phone) {
        // If user is signing up with Google and lacks phone/password setup:
        setGoogleSetupUser(user);
        setIsGoogleSetupOpen(true);
        setLoading(false);
        return;
      }

      // Register device and store locally as trusted
      try {
        if (!trustedDevices.includes(deviceId)) {
          trustedDevices.push(deviceId);
          localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
        }
      } catch (e) {}

      // Register device & log audit trail in Firestore
      registerDevice(user.uid, deviceId).catch(() => {});
      logAudit(user.uid, 'login_success').catch(() => {});
      
      toast.success(isCipher ? "Cipher Terminal Accessed" : "Welcome back!");
      navigate(isCipher ? '/cipher' : '/home');
    } catch (error: any) {
      console.error("Google auth error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in popup is closed before completion.");
      } else {
        toast.error(error.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleSetupUser) return;
    if (!googlePhone || googlePhone.trim().length < 5) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!googlePassword || googlePassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (googlePassword !== googleConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      try {
        await updatePassword(googleSetupUser, googlePassword);
      } catch (pwdErr: any) {
        console.warn("updatePassword note:", pwdErr);
        try {
          if (googleSetupUser.email) {
            const cred = EmailAuthProvider.credential(googleSetupUser.email, googlePassword);
            await linkWithCredential(googleSetupUser, cred);
          }
        } catch (linkErr) {
          console.warn("linkWithCredential note:", linkErr);
        }
      }

      const countryContext = selectedCountry || {
        countryName: 'Nigeria',
        countryCode: 'NG',
        countryFlag: '🇳🇬'
      };

      let referrerId: string | null = null;
      let referrerCodeValue: string | null = null;
      if (referralCode?.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        try {
          const snap = await getDocs(query(collection(db, 'users'), where('referral_code', '==', cleanRef)));
          if (!snap.empty) {
            referrerId = snap.docs[0].id;
            referrerCodeValue = cleanRef;
          }
        } catch (e) {}
      }

      const isCipher = googleSetupUser.email === 'support@tavariwave.network' || 
                       googleSetupUser.email === 'contact.cga.usa@gmail.com' || 
                       googleSetupUser.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
      const userRefCode = isCipher ? 'CIPHER' : generateReferralCode();
      const newUserProfile = {
        uid: googleSetupUser.uid,
        name: isCipher ? 'Cipher' : (googleSetupUser.displayName || 'Nexus User'),
        username: isCipher ? 'cipher_root' : (googleSetupUser.email?.split('@')[0] || 'user'),
        email: googleSetupUser.email || '',
        phone: normalizePhoneNumber(googlePhone, countryContext.countryCode),
        country: countryContext.countryName,
        countryName: countryContext.countryName,
        country_code: countryContext.countryCode,
        countryCode: countryContext.countryCode,
        country_flag: countryContext.countryFlag,
        countryFlag: countryContext.countryFlag,
        public_id: generatePublicId(),
        referral_code: userRefCode,
        referral_link: `${window.location.origin}/signup?ref=${userRefCode}`,
        referred_by: referrerId,
        referrer_uid: referrerId,
        referrer_code: referrerCodeValue,
        referrals_count: 0,
        active_referrals: 0,
        referral_earnings: 0,
        role: isCipher ? 'cipher' : 'user',
        funding_balance: 0,
        available_balance: 0,
        total_earnings: 0,
        total_invested: 10,
        email_verified: true,
        suspended: false,
        banned: false,
        roi_disabled: false,
        withdrawals_frozen: false,
        transfers_frozen: false,
        created_at: new Date().toISOString(),
        roi_cycle_start: new Date().toISOString(),
        last_rebook: new Date().toISOString()
      };

      if (referrerId) {
        try {
          await updateDoc(doc(db, 'users', referrerId), {
            referrals_count: increment(1)
          });
        } catch (e) {}
      }

      await setDoc(doc(db, 'users', googleSetupUser.uid), newUserProfile);

      broadcastActivity(
        newUserProfile.name || "New Partner",
        "Registered",
        undefined,
        true,
        "👤"
      );

      const txId = `signup-bonus-${googleSetupUser.uid}`;
      await setDoc(doc(db, 'transactions', txId), {
        user_id: googleSetupUser.uid,
        type: 'signup_bonus',
        amount: 10,
        created_at: new Date().toISOString(),
        status: 'approved',
        description: "Congratulations, you have just received a $10 signup bonus into your assets balance."
      });

      // Register device
      const deviceId = getDeviceFingerprint();
      const trustedDevicesKey = `trusted_devices_${googleSetupUser.uid}`;
      const trustedDevices = JSON.parse(localStorage.getItem(trustedDevicesKey) || '[]');
      if (!trustedDevices.includes(deviceId)) {
        trustedDevices.push(deviceId);
        localStorage.setItem(trustedDevicesKey, JSON.stringify(trustedDevices));
      }
      registerDevice(googleSetupUser.uid, deviceId).catch(() => {});
      logAudit(googleSetupUser.uid, 'login_success').catch(() => {});

      setIsGoogleSetupOpen(false);
      setGoogleSetupUser(null);
      toast.success(isCipher ? "Cipher Terminal Accessed" : "Account setup completed! Welcome to CGA.");
      navigate(isCipher ? '/cipher' : '/home');
    } catch (err: any) {
      console.error("Complete Google setup error:", err);
      toast.error(err.message || "Failed to complete account setup.");
    } finally {
      setLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className={cn(
        "relative min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6 transition-colors duration-200 overflow-x-hidden selection:bg-primary selection:text-white",
        isDark ? "bg-[#050608] text-white" : "bg-[#f8fafc] text-slate-900"
      )}>
        {/* Subtle ambient lighting glows */}
        <div className="fixed top-[15%] left-[-10%] w-[320px] h-[320px] rounded-full bg-primary/10 blur-[100px] pointer-events-none -z-0" />
        <div className="fixed bottom-[15%] right-[-10%] w-[320px] h-[320px] rounded-full bg-secondary/10 blur-[100px] pointer-events-none -z-0" />

        {/* Mobile Country Selection Overlay */}
        <AnimatePresence>
          {showCountrySelection && (
            <motion.div
              key="mobile-country-selection-view"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={
                shouldReduceMotion 
                  ? { duration: 0 } 
                  : { duration: 0.15, ease: 'easeOut' }
              }
              className={cn(
                "fixed inset-0 z-[250] flex flex-col justify-between overflow-y-auto transition-colors duration-200",
                isDark ? "bg-[#050608] text-white" : "bg-slate-50 text-slate-900"
              )}
            >
              {/* Background ambient lighting */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div
                  className={cn(
                    "absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-30",
                    isDark ? "bg-primary/20" : "bg-primary/10"
                  )}
                />
              </div>

              {/* Main Content Area */}
              <main className="relative z-10 flex-1 max-w-xl w-full mx-auto px-4 pt-8 pb-16">
                {/* Minimal CGA Branding */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div 
                    className="relative mb-3 group cursor-pointer" 
                    onClick={() => {
                      setShowCountrySelection(false);
                      window.history.pushState(null, '', '/welcome');
                    }}
                  >
                    <img
                      src="https://i.imgur.com/nRbbYnS.png"
                      alt="CGA Logo"
                      className="h-12 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,158,66,0.25)] transition-transform active:scale-95"
                    />
                  </div>

                  <h1 className="text-2xl font-black uppercase tracking-tight leading-tight">
                    Choose your country
                  </h1>
                </div>

                {/* Search Field */}
                <div className="relative mb-4">
                  <div className="relative flex items-center">
                    <Search
                      size={16}
                      className={cn(
                        "absolute left-4 pointer-events-none transition-colors",
                        isDark ? "text-white/40" : "text-slate-400"
                      )}
                    />
                    <input
                      type="text"
                      value={countrySearchTerm}
                      onChange={(e) => setCountrySearchTerm(e.target.value)}
                      placeholder="Search your country"
                      autoFocus
                      className={cn(
                        "w-full h-12 pl-11 pr-10 rounded-xl text-sm font-medium transition-all outline-none shadow-sm",
                        isDark
                          ? "bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/[0.07]"
                          : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary/70"
                      )}
                    />
                    {countrySearchTerm && (
                      <button
                        onClick={() => setCountrySearchTerm('')}
                        className={cn(
                          "absolute right-3.5 p-1 rounded-full transition-colors",
                          isDark ? "text-white/40 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        )}
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {countrySearchTerm && (
                    <div
                      className={cn(
                        "mt-1.5 text-[10px] font-semibold uppercase tracking-wider pl-1.5",
                        isDark ? "text-aura-muted" : "text-slate-500"
                      )}
                    >
                      Found {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'}
                    </div>
                  )}
                </div>

                {/* Complete Country List */}
                <div className="space-y-1.5">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleSelectCountry(country)}
                        type="button"
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group select-none cursor-pointer touch-manipulation active:scale-[0.99]",
                          isDark
                            ? "bg-white/[0.02] border-white/5 hover:border-primary/40 hover:bg-white/[0.06] active:bg-white/[0.08]"
                            : "bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50 active:bg-slate-100 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="text-2xl leading-none shrink-0 select-none w-7 text-center"
                            role="img"
                            aria-label={`${country.name} flag`}
                          >
                            {country.flag}
                          </span>
                          <div className="truncate">
                            <span
                              className={cn(
                                "text-sm font-bold tracking-tight block truncate group-hover:text-primary transition-colors",
                                isDark ? "text-white" : "text-slate-900"
                              )}
                            >
                              {country.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <span
                            className={cn(
                              "text-[10px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                              isDark
                                ? "bg-white/5 border border-white/10 text-white/50"
                                : "bg-slate-100 border border-slate-200 text-slate-500"
                            )}
                          >
                            {country.code}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div
                      className={cn(
                        "py-12 text-center rounded-xl border flex flex-col items-center justify-center gap-2",
                        isDark ? "bg-white/[0.02] border-white/5 text-aura-muted" : "bg-white border-slate-200 text-slate-500"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
                        🌍
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider">No country found</div>
                      <button
                        onClick={() => setCountrySearchTerm('')}
                        className="mt-1 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              </main>
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Auth Card - Continuously mounted in the DOM to eliminate remount freezes */}
        <div className="w-full flex justify-center z-10">
          {/* The Approved Authentication Card */}
          <div className="relative w-full max-w-md bg-white border border-slate-200 text-slate-900 dark:bg-[#0c0f14] dark:border-white/10 dark:text-white rounded-3xl overflow-hidden shadow-2xl transition-colors duration-200 my-auto">
                <div className={cn(
                  "overflow-y-auto scrollbar-hide",
                  authMode === 'signup' ? "p-4 sm:p-6 max-h-[94vh] sm:max-h-[92vh]" : "p-6 sm:p-8 max-h-[92vh]"
                )}>
                  {/* Logo & Header */}
                  <div className={cn(
                    "flex flex-col items-center text-center",
                    authMode === 'signup' ? "mt-1 mb-2.5 sm:mt-2 sm:mb-6" : "mt-2 mb-6 sm:mb-8"
                  )}>
                    <img 
                      src="https://i.imgur.com/nRbbYnS.png" 
                      alt="CGA Trades Logo" 
                      loading="lazy" 
                      decoding="async" 
                      className={cn(
                        "object-contain drop-shadow-sm",
                        authMode === 'signup' ? "w-12 h-12 sm:w-16 sm:h-16 mb-1.5 sm:mb-4" : "w-20 h-20 lg:w-24 lg:h-24 mb-4 sm:mb-6"
                      )} 
                    />
                    <h2 className={cn(
                      "font-bold tracking-tight text-slate-900 dark:text-white",
                      authMode === 'signup' ? "text-xl sm:text-2xl mb-0.5 sm:mb-1" : "text-2xl sm:text-3xl mb-2"
                    )}>
                      {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className={cn(
                      "text-slate-500 dark:text-aura-muted font-medium",
                      authMode === 'signup' ? "text-xs sm:text-sm" : "text-sm"
                    )}>
                      {authMode === 'signup' ? 'Join us and start your journey' : 'Sign in to continue your journey'}
                    </p>
                  </div>

                  {verificationSent ? (
                    <div className="text-center space-y-6 py-6">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                      </div>
                      <div className="space-y-3 px-2">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Verify Your Email</h3>
                        <p className="text-slate-500 dark:text-aura-muted text-xs font-semibold leading-relaxed">
                          Your account has been created successfully.<br/>
                          Please check your inbox or spam folder to verify your email before signing in.
                        </p>
                      </div>
                      <button 
                        onClick={() => { 
                          setVerificationSent(false); 
                          setAuthMode('signin'); 
                        }}
                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(0,158,66,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        OK <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : requiresOtp ? (
                    <div className="text-center space-y-6 py-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                        <Lock size={32} className="text-primary animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Confirm Device</h3>
                        <p className="text-slate-500 dark:text-aura-muted text-xs font-medium leading-relaxed px-2">
                          Unrecognized device detected. Enter your Transaction PIN to authorize this device.
                        </p>
                      </div>

                      <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="flex justify-center">
                          <input 
                            type="password" 
                            maxLength={8}
                            placeholder="••••"
                            value={userOtp}
                            onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full max-w-[220px] bg-slate-100 border border-slate-200 text-primary focus:border-primary focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.4em] outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10 font-mono"
                            required
                            autoFocus
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <button 
                            disabled={loading || userOtp.length < 4}
                            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(0,158,66,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm"
                          >
                            {loading ? 'Authenticating...' : (
                              <>Authorize Device <CheckCircle2 size={16} /></>
                            )}
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              setRequiresOtp(false);
                              setTempUser(null);
                              setUserOtp('');
                            }}
                            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-aura-muted dark:hover:text-white transition-colors"
                          >
                            Cancel session
                          </button>
                        </div>
                      </form>

                      <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-widest">
                         <Shield className="w-3.5 h-3.5 text-primary" />
                         Fortified Endpoint Active
                      </div>
                    </div>
                  ) : (
                    <div className={authMode === 'signup' ? "space-y-3 sm:space-y-5" : "space-y-6"}>
                      {/* Google Sign-Up / Sign-In Button */}
                      <div className={authMode === 'signup' ? "space-y-1.5 sm:space-y-2.5" : "space-y-3"}>
                        <button 
                          disabled={loading}
                          onClick={handleGoogleAuth}
                          className={cn(
                            "w-full bg-white text-slate-900 border border-slate-200 dark:border-transparent dark:text-black rounded-xl flex items-center justify-center gap-3 font-semibold hover:bg-slate-50 dark:hover:bg-white/90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                            authMode === 'signup' ? "py-2.5 sm:py-3.5 text-xs sm:text-sm" : "py-3.5 text-sm"
                          )}
                        >
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className={authMode === 'signup' ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5"} alt="Google logo" />
                          {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                        </button>
                      </div>

                      {/* Divider */}
                      <div className={cn("relative flex items-center gap-4", authMode === 'signup' && "-my-1 sm:my-0")}>
                        <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest leading-none">or</span>
                        <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                      </div>

                      {/* Form fields in approved order */}
                      <form onSubmit={authMode === 'signup' ? handleSignup : handleSignin} className={authMode === 'signup' ? "space-y-2 sm:space-y-3" : "space-y-4"}>
                        {/* Selected Country pill */}
                        {authMode === 'signup' && selectedCountry && (
                          <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 dark:bg-white/[0.04] dark:border-white/10 dark:text-white mb-1.5 sm:mb-2">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                              <span className="text-xl sm:text-2xl select-none" role="img" aria-label={selectedCountry.countryName}>{selectedCountry.countryFlag}</span>
                              <div>
                                <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-aura-muted leading-tight">Selected Country</div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">{selectedCountry.countryName}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenCountrySelection}
                              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors touch-manipulation active:opacity-70"
                            >
                              Change
                            </button>
                          </div>
                        )}

                        {/* 1. Full Name */}
                        {authMode === 'signup' && (
                          <AuthInput icon={<User size={16} />} label="Full Name" placeholder="Full Name" value={fullName} onChange={setFullName} required compact={true} />
                        )}

                        {/* 2. Username */}
                        {authMode === 'signup' && (
                          <AuthInput icon={<UserPlus size={16} />} label="Username" placeholder="Username" value={username} onChange={handleUsernameChange} required compact={true} />
                        )}

                        {/* 3. Email Address (or Phone Number on signin) */}
                        {authMode === 'signup' ? (
                          <AuthInput 
                            icon={<Mail size={16} />} 
                            label="Email Address" 
                            placeholder="Email Address" 
                            type="email" 
                            value={email} 
                            onChange={setEmail} 
                            required 
                            compact={true}
                          />
                        ) : (
                          <AuthInput 
                            icon={<Phone size={18} />} 
                            label="Phone Number" 
                            placeholder="Enter your phone number" 
                            type="tel" 
                            value={signinPhone} 
                            onChange={setSigninPhone} 
                            required 
                            compact={false}
                          />
                        )}

                        {/* 4. Phone Number */}
                        {authMode === 'signup' && (
                          <div className="space-y-0.5 sm:space-y-1">
                            <PhoneInput
                              country={activeCountryCode.toLowerCase()}
                              value={phone}
                              onChange={handlePhoneChange}
                              disableDropdown={true}
                              countryCodeEditable={false}
                              enableLongNumbers={currentDialCode.length + maxPhoneDigits}
                              inputProps={{
                                onPaste: handlePhonePaste,
                                maxLength: currentDialCode.length + maxPhoneDigits + 5,
                              }}
                              containerClass="nexus-phone-container"
                              inputClass="nexus-phone-input-signup"
                              buttonClass="nexus-phone-button-signup"
                              dropdownClass="nexus-phone-dropdown"
                              placeholder="Phone Number"
                            />
                          </div>
                        )}

                        {/* 5. Password */}
                        <div className={authMode === 'signup' ? "space-y-2 sm:space-y-3" : "space-y-4"}>
                          <AuthInput 
                            icon={<Lock size={authMode === 'signup' ? 16 : 18} />} 
                            label="Password" 
                            placeholder="Enter your password" 
                            type="password" 
                            value={authMode === 'signup' ? password : signinPassword} 
                            onChange={authMode === 'signup' ? setPassword : setSigninPassword} 
                            required 
                            showPasswordToggle={true}
                            isPasswordVisible={authMode === 'signup' ? showPassword : showSigninPassword}
                            onTogglePassword={() => authMode === 'signup' ? setShowPassword(!showPassword) : setShowSigninPassword(!showSigninPassword)}
                            compact={authMode === 'signup'}
                          />

                          {/* 6. Confirm Password */}
                          {authMode === 'signup' && (
                            <AuthInput 
                              icon={<Lock size={16} />} 
                              label="Confirm Password" 
                              placeholder="Confirm Password" 
                              type="password" 
                              value={confirmPassword} 
                              onChange={setConfirmPassword} 
                              required 
                              showPasswordToggle={true}
                              isPasswordVisible={showConfirmPassword}
                              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                              compact={true}
                            />
                          )}
                        </div>

                        {/* Forgot Password (Sign In only) */}
                        {authMode === 'signin' && (
                          <div className="flex justify-end">
                             <button type="button" className="text-xs font-bold text-primary hover:underline transition-colors">Forgot Password?</button>
                          </div>
                        )}

                        {/* 7. Referral Code (Optional) */}
                        {authMode === 'signup' && (
                           <AuthInput icon={<TrendingUp size={16} />} label="Referral Code (Optional)" placeholder="Referral Code (Optional)" value={referralCode} onChange={setReferralCode} compact={true} />
                        )}

                        {/* Submit Button */}
                        <button 
                          disabled={loading}
                          type="submit"
                          className={cn(
                            "w-full bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-[0_0_20px_rgba(0,158,66,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50",
                            authMode === 'signup' ? "py-3 sm:py-4 rounded-xl sm:rounded-2xl mt-2 sm:mt-3 text-sm sm:text-base" : "py-4.5 rounded-2xl mt-4 text-base"
                          )}
                        >
                          {loading ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                        </button>
                      </form>

                      {/* Sign Up / Sign In switch link */}
                      <p className={cn(
                        "text-center font-medium text-slate-500 dark:text-aura-muted",
                        authMode === 'signup' ? "text-xs sm:text-sm mt-2 sm:mt-3" : "text-sm"
                      )}>
                        {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button 
                          type="button"
                          onClick={() => {
                            if (authMode === 'signin') {
                              const stored = localStorage.getItem('cga_signup_country') || sessionStorage.getItem('cga_signup_country');
                              if (!stored) {
                                handleOpenCountrySelection();
                              } else {
                                try { setSelectedCountry(JSON.parse(stored)); } catch (e) {}
                                setAuthMode('signup');
                              }
                            } else {
                              setAuthMode('signin');
                            }
                          }}
                          className="text-primary font-bold hover:underline transition-colors"
                        >
                          {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen selection:bg-primary selection:text-white overflow-hidden relative transition-colors duration-200",
      isDark ? "bg-[#050608] text-white" : "bg-[#f8fafc] text-slate-900"
    )}>
      {/* Premium Visual Enhancements: Ambient Glow Blobs */}
      <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[55%] right-[-15%] w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-[15%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] pointer-events-none z-0" />

      {/* Welcome Landing Full Width Header Photo */}
      <div 
        className={cn("w-full relative z-[101] overflow-hidden mt-20 lg:mt-24", isDark ? "bg-[#050608]" : "bg-[#f8fafc]")}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={cn(
          "absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent z-25 pointer-events-none transition-colors duration-200",
          isDark ? "from-[#050608]/70 via-[#050608]/20" : "from-[#f8fafc]/70 via-[#f8fafc]/20"
        )} />
        <div className={cn(
          "absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent z-25 pointer-events-none transition-colors duration-200",
          isDark ? "from-[#050608]" : "from-[#f8fafc]"
        )} />
        
        {/* Desktop Custom Designed High-Tech Hero Background (No external image) */}
        <div className={cn(
          "hidden lg:block relative w-full h-[320px] xl:h-[380px] overflow-hidden border-y transition-colors duration-200",
          isDark 
            ? "bg-gradient-to-r from-[#070b13] via-[#040609] to-[#0e1422] border-white/5" 
            : "bg-gradient-to-r from-slate-100 via-[#f8fafc] to-emerald-50/40 border-slate-200/80"
        )}>
          {/* Subtle Grid network & digital connections */}
          <div className={cn(
            "absolute inset-0 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none transition-opacity",
            isDark 
              ? "bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)]"
              : "bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]"
          )} />
          
          {/* Animated Sine-Wave or Wave graphics representation */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 top-1/4 pointer-events-none transition-opacity",
            isDark ? "opacity-15" : "opacity-25"
          )}>
            <svg className="w-full h-full" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80 C 320 180, 720 0, 1080 120 C 1260 180, 1380 110, 1440 80 L 1440 200 L 0 200 Z" fill="url(#waveWelcomeGrad)" />
              <path d="M0 80 C 320 180, 720 0, 1080 120 C 1260 180, 1380 110, 1440 80" stroke="#009e42" strokeWidth="2.5" />
              <path d="M0 120 C 400 30, 800 150, 1200 60 C 1320 30, 1400 80, 1440 100" stroke="#02d147" strokeWidth="1" strokeDasharray="4 4" className="opacity-50" />
              <defs>
                <linearGradient id="waveWelcomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#009e42" stopOpacity={isDark ? "0.8" : "0.5"} />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Large glowing orbs */}
          <div className="absolute -top-12 left-1/3 w-96 h-96 bg-[#009e42]/5 rounded-full blur-[120px]" />
          <div className="absolute -bottom-12 right-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />

          {/* Welcome Interactive Dashboard / Stats Banner overlay */}
          <div className="absolute inset-0 flex items-center justify-between px-20 max-w-7xl mx-auto w-full z-10">
            <div className="max-w-2xl space-y-3.5 text-left">
              <h1 className="leading-tight">
                <span className={cn(
                  "block text-xs xl:text-sm font-extrabold uppercase tracking-[0.3em] font-sans transition-colors duration-200 mb-1",
                  isDark ? "text-emerald-400/90" : "text-emerald-700"
                )}>
                  Welcome to
                </span>
                <span className={cn(
                  "text-4xl xl:text-5xl 2xl:text-6xl font-black uppercase tracking-tight font-sans whitespace-nowrap block",
                  isDark 
                    ? "bg-gradient-to-r from-white via-emerald-200 to-[#02d147] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,158,66,0.4)]" 
                    : "bg-gradient-to-r from-slate-900 via-emerald-800 to-[#009e42] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,158,66,0.15)]"
                )}>
                  CGA Trades
                </span>
              </h1>
              <p className={cn(
                "text-sm xl:text-base leading-relaxed font-medium transition-colors duration-200 max-w-lg",
                isDark ? "text-white/60" : "text-slate-600"
              )}>
                Access premium high-yield algorithmic allocation pipelines, secured multi-tier staking channels, and real-time market telemetry.
              </p>
            </div>

            {/* Glowing Tech Dashboard Visualizer */}
            <div className={cn(
              "relative w-[340px] h-[180px] rounded-2xl p-5 overflow-hidden hidden xl:flex flex-col justify-between transition-all duration-200",
              isDark 
                ? "bg-black/40 border border-[#009e42]/20 shadow-[0_12px_40px_rgba(0,0,0,0.5)]" 
                : "bg-white/80 border border-[#009e42]/25 shadow-[0_12px_30px_rgba(0,158,66,0.08)] backdrop-blur-md"
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#009e42]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#009e42] tracking-widest uppercase font-bold">CGA SECURE NODE</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#009e42] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#009e42]"></span>
                </span>
              </div>

              {/* Minimalist charts */}
              <div className="h-16 flex items-end gap-1.5 justify-center py-2">
                {[40, 55, 45, 60, 75, 65, 80, 95, 85, 110, 100, 120].map((h, idx) => (
                  <div key={idx} className="w-4 bg-[#009e42]/15 border-t border-[#009e42]/40 rounded-t-sm transition-all duration-500 hover:bg-[#009e42]/30" style={{ height: `${(h / 120) * 100}%` }} />
                ))}
              </div>

              <div className={cn(
                "flex justify-between items-baseline border-t pt-2 transition-colors duration-200",
                isDark ? "border-white/5" : "border-slate-100"
              )}>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider transition-colors duration-200",
                  isDark ? "text-white/40" : "text-slate-500"
                )}>Ecosystem TVL</span>
                <span className={cn(
                  "text-lg font-black transition-colors duration-200",
                  isDark ? "text-white" : "text-slate-900"
                )}>$148,940,201</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Carousel representation (Only visible on small devices) */}
        <div className="lg:hidden relative w-full aspect-[21/9] sm:aspect-[2.39/1] min-h-[160px] sm:min-h-[280px] overflow-hidden">
          {carouselImages.map((src, index) => (
            <div
              key={src}
              className={cn(
                "absolute inset-0 transition-all duration-1000 ease-in-out",
                currentSlide === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"
              )}
            >
              <img 
                src={src} 
                alt={`Welcome Header Slide ${index + 1}`} 
                className="w-full h-full object-cover object-top block select-none"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-secondary/10 blur-[100px] rounded-full" />
      </div>

       {/* Nav */}
      <nav className={cn(
        "fixed z-[120] transition-all duration-500 flex items-center justify-between",
        // Mobile style: floating glassmorphic pill
        "top-3.5 inset-x-3.5 h-12 rounded-2xl bg-[#050608]/70 border border-white/10 shadow-[0_8px_32px_rgba(124,58,237,0.12),0_1px_2px_rgba(255,255,255,0.05)] px-3 text-white backdrop-blur-xl lg:hidden",
        // Desktop style: traditional header matching the scrolling theme
        "lg:top-0 lg:inset-x-0 lg:fixed lg:rounded-none lg:px-20 lg:text-white lg:border-b lg:backdrop-blur-md",
        isScrolled 
          ? "lg:h-14 lg:bg-[#050608]/85 lg:border-primary/20 lg:shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
          : "lg:h-24 lg:bg-[#050608]/35 lg:border-transparent lg:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
      )}>
        <div 
          onClick={handleOpenCountrySelection}
          className={cn("flex items-center gap-1.5 transition-all duration-500 cursor-pointer group", isScrolled ? "scale-90" : "scale-100")}
          role="button"
          tabIndex={0}
          aria-label="CGA Trades Country Selection"
        >
          <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Trades Logo" loading="lazy" decoding="async" className="h-7 w-auto lg:h-14 object-contain group-hover:scale-105 transition-transform" />
          <span className="text-sm lg:text-3xl font-black uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">CGA Trades</span>
        </div>

        {/* Center Nav Items */}
        <div className="hidden lg:flex items-center gap-8">
           {['About Us', 'How It Works', 'Reviews', 'Blog', 'Help'].map(item => (
             <button 
               key={item} 
               onClick={() => {
                 if (item === 'Reviews') navigate('/reviews');
                 if (item === 'About Us') navigate('/about');
                 if (item === 'How It Works') navigate('/how-it-works');
                 if (item === 'Blog') navigate('/blog');
                 if (item === 'Help') navigate('/help');
               }}
               className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-colors"
             >
               {t(item)}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Buttons Layout - Compact & Premium */}
          <div className="flex lg:hidden items-center gap-1.5">
            {renderThemeSelector()}
            {renderLanguageSelector()}
            {/* 1. Sign In */}
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
              className="px-2 py-1.5 border border-white/10 hover:border-primary/50 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
            >
              {t('Sign In')}
            </button>

            {/* 2. Get Started */}
            <button 
              onClick={handleOpenCountrySelection}
              className="px-2.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              {t('Get Started')}
            </button>

            {/* 3. Dropdown/Hamburger menu (extreme right) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2 rounded-lg transition-colors shrink-0 flex flex-col justify-center items-end gap-1.5 w-8 h-8",
                isDark 
                  ? "text-white/80 hover:text-white hover:bg-white/5" 
                  : "text-slate-800 hover:text-slate-950 hover:bg-slate-100"
              )}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={16} />
              ) : (
                <>
                  <div className={cn("w-4.5 h-[2.5px] rounded-full transition-colors", isDark ? "bg-white" : "bg-slate-900 dark:bg-white")} />
                  <div className={cn("w-3 h-[2.5px] rounded-full transition-colors", isDark ? "bg-white" : "bg-slate-900 dark:bg-white")} />
                </>
              )}
            </button>
          </div>

          {/* Desktop Only Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {renderThemeSelector()}
            {renderLanguageSelector()}
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
              className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
            >
              {t('Sign In')}
            </button>
            <button 
              onClick={handleOpenCountrySelection}
              className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:scale-105 transition-all text-xs"
            >
              {t('Get Started')}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ 
              transformOrigin: "top right",
              willChange: 'transform, opacity' 
            }}
            className="fixed top-[66px] lg:hidden inset-x-3.5 z-[110] bg-[#050608]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {['About Us', 'How It Works', 'Reviews', 'Blog', 'Help'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (item === 'About Us') navigate('/about');
                    if (item === 'How It Works') navigate('/how-it-works');
                    if (item === 'Reviews') navigate('/reviews');
                    if (item === 'Blog') navigate('/blog');
                    if (item === 'Help') navigate('/help');
                  }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/75 hover:text-primary transition-all flex items-center justify-between"
                >
                  <span>{t(item)}</span>
                  <ArrowRight size={10} className="text-primary" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 lg:pt-32 pb-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl space-y-8"
        >
          <p className="max-w-xl mx-auto text-aura-muted text-sm lg:text-lg leading-relaxed font-medium uppercase tracking-[0.05em]">
            <EditableText configKey="heroSubtitle" defaultText="Precision trading and high-yield asset orchestration for the modern institutional grade investor." />
          </p>
          <div className="flex flex-row items-center justify-center gap-4 pt-8 w-full max-w-md mx-auto">
            <button 
              onClick={handleOpenCountrySelection}
              className="flex-1 h-14 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-2xl shadow-[0_4px_25px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_35px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Get Started <ArrowRight size={14} className="shrink-0" />
            </button>
            <button 
              onClick={() => { setIsModalOpen(true); setAuthMode('signin'); }}
              className="flex-1 h-14 bg-[#050608]/50 hover:bg-[#050608]/80 border border-[#ffffff15] hover:border-secondary/40 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-2xl shadow-lg hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(14,165,233,0.15)] active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </main>

      {/* Start Guide Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 text-center">
        {/* Premium Header Typography Redesign */}
        <div className="relative inline-block mb-12 max-w-3xl mx-auto text-center">
          <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-primary/15 to-secondary/15 opacity-70 pointer-events-none rounded-full" />
          <div className="relative flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" />
              <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-100 uppercase select-none leading-snug">
              {t("Simple Steps to Start Your Journey to Financial Freedom")}
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-1.5" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-primary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
            
            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-primary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-500">
              <Realistic3DIcon type="user" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Create Account")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Simple onboarding to get started")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-secondary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-secondary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-all duration-500">
              <Realistic3DIcon type="plan" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Choose a Plan")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Select a suitable growth path")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-primary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-primary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-500">
              <Realistic3DIcon type="fund" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Fund & Start")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Add funds and activate your journey")}
            </p>
          </div>

          {/* Card 4 */}
          <div className="group relative p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-secondary/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-2 lg:hover:-translate-y-2 duration-500 transition-all flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            {/* Elegant corner gradient accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <div className="relative z-10 p-2 rounded-2xl bg-transparent text-secondary group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-all duration-500">
              <Realistic3DIcon type="node" />
            </div>
            <h4 className="relative z-10 text-lg font-bold tracking-tight text-white uppercase font-sans mt-2">
              {t("Activate Your Nodes")}
            </h4>
            <p className="relative z-10 text-aura-muted leading-relaxed uppercase tracking-wider text-[10px] font-medium">
              {t("Enable your earning system")}
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Statistics Highlight Card */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent backdrop-blur-2xl p-8 lg:p-16 shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
          {/* Subtle brand glow effects */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/8 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            {/* Stat 1 */}
            <div className="space-y-3 flex flex-col justify-center items-center">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-secondary italic font-serif leading-none filter drop-shadow-[0_4px_16px_rgba(124,58,237,0.2)]">
                $26M+
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider px-4">
                Proven payouts delivered globally
              </p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-3 flex flex-col justify-center items-center pt-8 md:pt-0">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-teal-400 to-accent italic font-serif leading-none filter drop-shadow-[0_4px_16px_rgba(14,165,233,0.2)]">
                90%
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider px-4">
                Users achieve up to $955K+ returns
              </p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-3 flex flex-col justify-center items-center pt-8 md:pt-0">
              <span className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-400 to-accent italic font-serif leading-none filter drop-shadow-[0_4px_16px_rgba(124,58,237,0.2)]">
                155,000+
              </span>
              <p className="text-xs font-bold text-white uppercase tracking-wider px-4">
                Trusted by users worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Success Modal */}
      <AnimatePresence>
        {showNewsletterSuccessModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewsletterSuccessModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0c0f14] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-8 text-center space-y-6">
                <button 
                  onClick={() => setShowNewsletterSuccessModal(false)}
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-aura-muted hover:text-white transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={14} />
                </button>

                <div className="pt-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={32} className="text-primary" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white italic font-serif">
                    Welcome to CGA Trades Press
                  </h3>
                  <p className="text-xs text-aura-muted leading-relaxed font-sans px-2">
                    Thank you for subscribing to our newsletter. Stay updated with CGA Trades via email.
                  </p>
                </div>

                <button 
                  onClick={() => setShowNewsletterSuccessModal(false)}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  Continue Reading
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Country Selection Page / Screen with swipe up transition */}
      <AnimatePresence>
        {showCountrySelection && (
          <motion.div
            key="country-selection-screen"
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '-100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '-100%', opacity: 0.95 }}
            transition={
              shouldReduceMotion 
                ? { duration: 0 } 
                : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
            }
            className={cn(
              "fixed inset-0 z-[250] flex flex-col justify-between overflow-y-auto transition-colors duration-200",
              isDark ? "bg-[#050608] text-white" : "bg-slate-50 text-slate-900"
            )}
          >
            {/* Background ambient lighting */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
              <div
                className={cn(
                  "absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-30",
                  isDark ? "bg-primary/20" : "bg-primary/10"
                )}
              />
              <div
                className={cn(
                  "absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full blur-[160px] opacity-20",
                  isDark ? "bg-secondary/15" : "bg-secondary/10"
                )}
              />
            </div>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
              {/* Minimal CGA Branding */}
              <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
                <div 
                  className="relative mb-5 group cursor-pointer" 
                  onClick={() => {
                    setShowCountrySelection(false);
                    window.history.pushState(null, '', '/welcome');
                  }}
                >
                  <img
                    src="https://i.imgur.com/nRbbYnS.png"
                    alt="CGA Logo"
                    className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,158,66,0.25)] transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight">
                  Choose your country
                </h1>
              </div>

              {/* Search Field */}
              <div className="relative mb-6 sm:mb-8">
                <div className="relative flex items-center">
                  <Search
                    size={18}
                    className={cn(
                      "absolute left-4.5 pointer-events-none transition-colors",
                      isDark ? "text-white/40" : "text-slate-400"
                    )}
                  />
                  <input
                    type="text"
                    value={countrySearchTerm}
                    onChange={(e) => setCountrySearchTerm(e.target.value)}
                    placeholder="Search your country"
                    autoFocus
                    className={cn(
                      "w-full h-14 pl-12 pr-11 rounded-2xl text-sm sm:text-base font-medium transition-all outline-none shadow-sm",
                      isDark
                        ? "bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-primary/10"
                        : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary/70 focus:ring-4 focus:ring-primary/10"
                    )}
                  />
                  {countrySearchTerm && (
                    <button
                      onClick={() => setCountrySearchTerm('')}
                      className={cn(
                        "absolute right-4 p-1 rounded-full transition-colors",
                        isDark ? "text-white/40 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      )}
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {countrySearchTerm && (
                  <div
                    className={cn(
                      "mt-2 text-[11px] font-semibold uppercase tracking-wider pl-2",
                      isDark ? "text-aura-muted" : "text-slate-500"
                    )}
                  >
                    Found {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'}
                  </div>
                )}
              </div>

              {/* Complete Country List */}
              <div className="space-y-2">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleSelectCountry(country)}
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left group select-none cursor-pointer",
                        isDark
                          ? "bg-white/[0.02] border-white/5 hover:border-primary/40 hover:bg-white/[0.06] active:bg-white/[0.08]"
                          : "bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50 active:bg-slate-100 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <span
                          className="text-2xl sm:text-3xl leading-none shrink-0 select-none w-9 text-center"
                          role="img"
                          aria-label={`${country.name} flag`}
                        >
                          {country.flag}
                        </span>
                        <div className="truncate">
                          <span
                            className={cn(
                              "text-sm sm:text-base font-bold tracking-tight block truncate group-hover:text-primary transition-colors",
                              isDark ? "text-white" : "text-slate-900"
                            )}
                          >
                            {country.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 pl-3">
                        <span
                          className={cn(
                            "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                            isDark
                              ? "bg-white/5 border border-white/10 text-white/50"
                              : "bg-slate-100 border border-slate-200 text-slate-500"
                          )}
                        >
                          {country.code}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div
                    className={cn(
                      "py-16 text-center rounded-2xl border flex flex-col items-center justify-center gap-3",
                      isDark ? "bg-white/[0.02] border-white/5 text-aura-muted" : "bg-white border-slate-200 text-slate-500"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
                      🌍
                    </div>
                    <div className="text-sm font-bold uppercase tracking-wider">No country found</div>
                    <p className="text-xs max-w-xs text-center font-medium opacity-75">
                      We couldn't find any country matching "{countrySearchTerm}". Please check your spelling.
                    </p>
                    <button
                      onClick={() => setCountrySearchTerm('')}
                      className="mt-2 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            </main>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative w-full bg-white border border-slate-200 text-slate-900 dark:bg-[#0c0f14] dark:border-white/10 dark:text-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-300",
                authMode === 'signup' 
                  ? "max-w-md lg:max-w-[780px]" 
                  : "max-w-md"
              )}
            >
              <div className={cn(
                "overflow-y-auto scrollbar-hide",
                authMode === 'signup' ? "p-5 sm:p-7 lg:p-8 max-h-[92vh] sm:max-h-[90vh] lg:max-h-[92vh]" : "p-8 max-h-[90vh]"
              )}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    "absolute p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-aura-muted dark:hover:text-white rounded-full transition-colors z-20",
                    authMode === 'signup' ? "top-4 left-4 sm:top-5 sm:left-5 lg:top-6 lg:left-6" : "top-6 left-6"
                  )}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Logo & Header */}
                <div className={cn(
                  "flex flex-col items-center text-center",
                  authMode === 'signup' ? "mt-1 sm:mt-2 lg:mt-1 mb-2 sm:mb-3 lg:mb-3" : "mt-6 mb-8"
                )}>
                   <img 
                     src="https://i.imgur.com/nRbbYnS.png" 
                     alt="CGA Trades Logo" 
                     loading="lazy" 
                     decoding="async" 
                     className={cn(
                       "object-contain drop-shadow-sm",
                       authMode === 'signup' ? "w-14 h-14 sm:w-16 sm:h-16 lg:w-16 lg:h-16 mb-2" : "w-20 h-20 lg:w-24 lg:h-24 mb-6"
                     )} 
                   />
                   <h2 className={cn(
                     "font-bold tracking-tight text-slate-900 dark:text-white",
                     authMode === 'signup' ? "text-xl sm:text-2xl lg:text-2xl mb-0.5" : "text-3xl mb-2"
                   )}>
                     {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                   </h2>
                   <p className={cn(
                     "text-slate-500 dark:text-aura-muted font-medium",
                     authMode === 'signup' ? "text-xs sm:text-sm" : "text-sm font-medium"
                   )}>
                     {authMode === 'signup' ? 'Join us and start your journey' : 'Sign in to continue your journey'}
                   </p>
                </div>

                {verificationSent ? (
                  <div className="text-center space-y-6 py-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </motion.div>
                    <div className="space-y-4 px-4">
                      <h3 className="text-2xl font-black italic font-serif text-slate-900 dark:text-white">Verify Your Email</h3>
                      <p className="text-slate-500 dark:text-aura-muted text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        Your account has been created successfully.<br/>
                        Please check your inbox or spam folder to verify your email before signing in.
                      </p>
                    </div>
                    <button 
                      onClick={() => { 
                        setVerificationSent(false); 
                        setAuthMode('signin'); 
                      }}
                      className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      OK <ArrowRight size={16} />
                    </button>
                  </div>
                ) : requiresOtp ? (
                  <div className="text-center space-y-8 py-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Lock size={32} className="text-primary animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter italic">Confirm Device</h3>
                      <p className="text-slate-500 dark:text-aura-muted text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                        We've detected a sign-in attempt from an unrecognized device. For your protection, enter your Transaction PIN to authorize this device.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="flex justify-center">
                        <input 
                          type="password" 
                          maxLength={8}
                          placeholder="••••"
                          value={userOtp}
                          onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full max-w-[240px] bg-slate-100 border border-slate-200 text-primary focus:border-primary focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/10 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.4em] outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10 font-mono"
                          required
                          autoFocus
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <button 
                          disabled={loading || userOtp.length < 4}
                          className="w-full py-4.5 bg-primary text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                          {loading ? 'Authenticating...' : (
                            <>Authorize Device <CheckCircle2 size={16} /></>
                          )}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            setRequiresOtp(false);
                            setTempUser(null);
                            setUserOtp('');
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-aura-muted dark:hover:text-white transition-colors"
                        >
                          Cancel session
                        </button>
                      </div>
                    </form>

                    <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-[0.2em]">
                       <Shield className="w-3 h-3 text-primary" />
                       Fortified Endpoint Active
                    </div>
                  </div>
                ) : (
                  <div className={authMode === 'signup' ? "space-y-3 sm:space-y-3.5 lg:space-y-3.5" : "space-y-6"}>
                    {/* Social Buttons */}
                    <div className={authMode === 'signup' ? "space-y-2 sm:space-y-3" : "space-y-3"}>
                       <button 
                         disabled={loading}
                         onClick={handleGoogleAuth}
                         className={cn(
                           "w-full bg-white text-slate-900 border border-slate-200 dark:border-transparent dark:text-black rounded-xl flex items-center justify-center gap-3 font-semibold hover:bg-slate-50 dark:hover:bg-white/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                           authMode === 'signup' ? "py-2.5 sm:py-3 lg:py-2.5 text-xs sm:text-sm" : "py-3.5 text-sm"
                         )}
                       >
                         <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className={authMode === 'signup' ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5"} alt="Google logo" />
                         {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                       </button>
                    </div>

                    <div className={cn("relative flex items-center gap-4", authMode === 'signup' && "-my-0.5 sm:my-0 lg:-my-0.5")}>
                       <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest leading-none">or</span>
                       <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                    </div>

                    <form onSubmit={authMode === 'signup' ? handleSignup : handleSignin} className={authMode === 'signup' ? "space-y-2 sm:space-y-3" : "space-y-4"}>
                      {authMode === 'signup' && selectedCountry && (
                        <div className="flex items-center justify-between px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 dark:bg-white/[0.04] dark:border-white/10 dark:text-white mb-1.5 sm:mb-2 lg:mb-2.5">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <span className="text-xl sm:text-2xl select-none" role="img" aria-label={selectedCountry.countryName}>{selectedCountry.countryFlag}</span>
                            <div>
                              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-aura-muted leading-tight">Selected Country</div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">{selectedCountry.countryName}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenCountrySelection}
                            className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      )}

                      {authMode === 'signup' ? (
                        <div className="space-y-2 sm:space-y-2.5 lg:space-y-2.5">
                          {/* Row 1 — Three fields horizontally on desktop: Full Name | Username | Email Address */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3">
                            <AuthInput icon={<User size={16} />} label="Full Name" placeholder="Full Name" value={fullName} onChange={setFullName} required compact={true} />
                            <AuthInput icon={<UserPlus size={16} />} label="Username" placeholder="Username" value={username} onChange={handleUsernameChange} required compact={true} />
                            <AuthInput 
                              icon={<Mail size={16} />} 
                              label="Email Address" 
                              placeholder="Email Address" 
                              type="email" 
                              value={email} 
                              onChange={setEmail} 
                              required 
                              compact={true}
                            />
                          </div>

                          {/* Row 2 — Two fields horizontally on desktop: Phone Number | Password */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3">
                            <div className="w-full">
                              <PhoneInput
                                country={activeCountryCode.toLowerCase()}
                                value={phone}
                                onChange={handlePhoneChange}
                                disableDropdown={true}
                                countryCodeEditable={false}
                                enableLongNumbers={currentDialCode.length + maxPhoneDigits}
                                inputProps={{
                                  onPaste: handlePhonePaste,
                                  maxLength: currentDialCode.length + maxPhoneDigits + 5,
                                }}
                                containerClass="nexus-phone-container"
                                inputClass="nexus-phone-input-signup"
                                buttonClass="nexus-phone-button-signup"
                                dropdownClass="nexus-phone-dropdown"
                                placeholder="Phone Number"
                              />
                            </div>
                            <AuthInput 
                              icon={<Lock size={16} />} 
                              label="Password" 
                              placeholder="Enter your password" 
                              type="password" 
                              value={password} 
                              onChange={setPassword} 
                              required 
                              showPasswordToggle={true}
                              isPasswordVisible={showPassword}
                              onTogglePassword={() => setShowPassword(!showPassword)}
                              compact={true}
                            />
                          </div>

                          {/* Row 3 — Two fields horizontally on desktop: Confirm Password | Referral Code (Optional) */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3">
                            <AuthInput 
                              icon={<Lock size={16} />} 
                              label="Confirm Password" 
                              placeholder="Confirm Password" 
                              type="password" 
                              value={confirmPassword} 
                              onChange={setConfirmPassword} 
                              required 
                              showPasswordToggle={true}
                              isPasswordVisible={showConfirmPassword}
                              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                              compact={true}
                            />
                            <AuthInput 
                              icon={<TrendingUp size={16} />} 
                              label="Referral Code (Optional)" 
                              placeholder="Referral Code (Optional)" 
                              value={referralCode} 
                              onChange={setReferralCode} 
                              compact={true} 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <AuthInput 
                            icon={<Phone size={18} />} 
                            label="Phone Number" 
                            placeholder="Enter your phone number" 
                            type="tel" 
                            value={signinPhone} 
                            onChange={setSigninPhone} 
                            required 
                            compact={false}
                          />
                          <AuthInput 
                            icon={<Lock size={18} />} 
                            label="Password" 
                            placeholder="Enter your password" 
                            type="password" 
                            value={signinPassword} 
                            onChange={setSigninPassword} 
                            required 
                            showPasswordToggle={true}
                            isPasswordVisible={showSigninPassword}
                            onTogglePassword={() => setShowSigninPassword(!showSigninPassword)}
                            compact={false}
                          />
                          <div className="flex justify-end">
                             <button type="button" className="text-xs font-bold text-primary hover:underline transition-colors">Forgot Password?</button>
                          </div>
                        </div>
                      )}

                      <button 
                        disabled={loading}
                        type="submit"
                        className={cn(
                          "w-full bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-[0_0_20px_rgba(0,158,66,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50",
                          authMode === 'signup' ? "py-3 sm:py-3.5 lg:py-3.5 rounded-xl sm:rounded-2xl mt-2 sm:mt-3 lg:mt-3 text-sm sm:text-base" : "py-4.5 rounded-2xl mt-4 text-base"
                        )}
                      >
                        {loading ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                      </button>
                    </form>

                    <p className={cn("text-center font-medium text-slate-500 dark:text-aura-muted", authMode === 'signup' ? "text-xs sm:text-sm mt-2 sm:mt-3 lg:mt-3" : "text-sm")}>
                      {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"} {' '}
                      <button 
                        onClick={() => {
                          if (authMode === 'signin') {
                            const stored = localStorage.getItem('cga_signup_country') || sessionStorage.getItem('cga_signup_country');
                            if (!stored) {
                              handleOpenCountrySelection();
                            } else {
                              try { setSelectedCountry(JSON.parse(stored)); } catch (e) {}
                              setAuthMode('signup');
                            }
                          } else {
                            setAuthMode('signin');
                          }
                        }}
                        className="text-primary font-bold hover:underline transition-colors"
                      >
                        {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google User Phone + Password Setup Modal (Section 22: Complete Your Account) */}
      <AnimatePresence>
        {isGoogleSetupOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsGoogleSetupOpen(false);
                setGoogleSetupUser(null);
                auth.signOut();
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white border border-slate-200 text-slate-900 dark:bg-[#0a0c10] dark:border-white/10 dark:text-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Logo" className="h-7 w-auto object-contain" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">Capital Growth Alliance</span>
                </div>
                <button
                  onClick={() => {
                    setIsGoogleSetupOpen(false);
                    setGoogleSetupUser(null);
                    auth.signOut();
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:bg-white/10 dark:text-white/60 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1.5">
                  Complete Your Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-aura-muted font-medium leading-relaxed">
                  Add your phone number and create a password to finish setting up your CGA account.
                </p>
              </div>

              {selectedCountry && (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 dark:bg-white/[0.04] dark:border-white/10 dark:text-white mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl" role="img" aria-label={selectedCountry.countryName}>{selectedCountry.countryFlag}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedCountry.countryName}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Selected
                  </span>
                </div>
              )}

              <form onSubmit={handleCompleteGoogleSetup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-aura-muted block">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <PhoneInput
                    country={selectedCountry ? selectedCountry.countryCode.toLowerCase() : detectedCountry}
                    value={googlePhone}
                    onChange={(val) => setGooglePhone(val)}
                    disableDropdown={true}
                    countryCodeEditable={false}
                    containerClass="nexus-phone-container"
                    inputClass="nexus-phone-input"
                    buttonClass="nexus-phone-button"
                    dropdownClass="nexus-phone-dropdown"
                    placeholder="Enter your phone number"
                  />
                </div>

                <AuthInput
                  icon={<Lock size={16} />}
                  label="Create Password"
                  placeholder="Create Password (min. 6 characters)"
                  type="password"
                  value={googlePassword}
                  onChange={setGooglePassword}
                  required
                  showPasswordToggle={true}
                  isPasswordVisible={showGooglePassword}
                  onTogglePassword={() => setShowGooglePassword(!showGooglePassword)}
                />

                <AuthInput
                  icon={<Lock size={16} />}
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  type="password"
                  value={googleConfirmPassword}
                  onChange={setGoogleConfirmPassword}
                  required
                  showPasswordToggle={true}
                  isPasswordVisible={showGoogleConfirmPassword}
                  onTogglePassword={() => setShowGoogleConfirmPassword(!showGoogleConfirmPassword)}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? 'Setting up Account...' : 'Complete Setup'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Testimonials Ticker Section */}
      <section className="relative z-10 py-16 text-center overflow-hidden">
        {/* Premium Header Typography Redesign */}
        <div className="relative inline-block mb-10 max-w-3xl mx-auto text-center">
          <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-secondary/15 to-accent/15 opacity-70 pointer-events-none rounded-full" />
          <div className="relative flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-secondary/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-secondary/70 animate-pulse" />
              <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-secondary/50" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-100 uppercase select-none leading-snug">
              What Our Users Are Saying
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-secondary/50 to-transparent mt-1.5" />
          </div>
        </div>

        <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mb-12">
          Global consensus from verified nodes & traders worldwide.
        </p>

        <div className="relative w-full overflow-hidden py-4">
          {/* Shadow overlays on edge for elegant fade effect */}
          <div className={cn(
            "absolute inset-y-0 left-0 w-32 bg-gradient-to-r to-transparent z-10 pointer-events-none transition-colors duration-200",
            isDark ? "from-[#050608]" : "from-[#f8fafc]"
          )} />
          <div className={cn(
            "absolute inset-y-0 right-0 w-32 bg-gradient-to-l to-transparent z-10 pointer-events-none transition-colors duration-200",
            isDark ? "from-[#050608]" : "from-[#f8fafc]"
          )} />

          <motion.div 
            className="flex gap-6 w-max"
            animate={{ x: [0, -3440] }} 
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 50,
              ease: "linear"
            }}
          >
            {[...REVIEWS.slice(0, 10), ...REVIEWS.slice(0, 10)].map((rev, index) => (
              <div 
                key={`${rev.id}-${index}`} 
                className="w-80 flex-shrink-0 p-8 rounded-3xl bg-white/[0.02]/70 backdrop-blur-xl border border-white/10 hover:border-primary/30 hover:-translate-y-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] duration-300 transition-all flex flex-col justify-between text-left h-48 space-y-4 relative overflow-hidden group"
              >
                {/* Subtle visual accent in card background */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none rounded-bl-2xl" />
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center font-black text-primary text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {rev.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white tracking-tight truncate">{rev.name}</h4>
                    <span className="text-[8px] text-aura-muted font-bold tracking-widest uppercase mt-0.5 block truncate">
                      {rev.countryName}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-white/85 leading-relaxed italic line-clamp-3">
                  "{rev.text}"
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1 text-yellow-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[7px] text-white/20 font-mono tracking-widest uppercase">Verified Node</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter Subscription Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="p-8 lg:p-16 rounded-[40px] bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.55)] relative backdrop-blur-xl">
          {/* Neon background blur */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="space-y-4 max-w-xl text-center lg:text-left relative z-10">
            {/* Premium Header Typography Redesign */}
            <div className="relative inline-block text-center lg:text-left">
              <div className="absolute -inset-4 blur-xl bg-gradient-to-r from-primary/10 to-secondary/10 opacity-70 pointer-events-none rounded-full" />
              <div className="relative flex flex-col items-center lg:items-start gap-2">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="h-1 w-1 rounded-full bg-secondary/80 animate-ping" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-black">Platform Broadcast</span>
                </div>
                <h2 className="text-xl lg:text-3xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 uppercase select-none leading-snug">
                  Stay updated with CGA Trades
                </h2>
                <div className="h-[1px] w-20 bg-gradient-to-r from-secondary/40 to-transparent mt-0.5" />
              </div>
            </div>

            <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.25em] leading-relaxed block pl-0.5 pt-1">
              Subscribe to get latest updates and platform insights
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="relative w-full max-w-md flex flex-col sm:flex-row gap-4 z-10">
            <div className="relative flex-1 group">
              <Mail className="absolute inset-y-0 left-4 flex h-full items-center text-white/25 group-focus-within:text-secondary transition-colors" size={18} />
              <input 
                type="email"
                placeholder="Enter email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-white/[0.02]/30 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-medium transition-all outline-none focus:border-secondary/40 focus:bg-white/[0.04] text-white placeholder:text-white/25 shadow-inner"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={newsletterLoading}
              className="px-8 py-4.5 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:-scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {newsletterLoading ? 'Subscribing...' : 'Subscribe Now'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function AuthInput({  
  icon, 
  label, 
  placeholder, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  inputMode, 
  pattern,
  showPasswordToggle,
  onTogglePassword,
  isPasswordVisible,
  compact = false
}: { 
  icon?: React.ReactNode, 
  label: string, 
  placeholder: string, 
  type?: string, 
  value: string, 
  onChange: (v: string) => void, 
  required?: boolean, 
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'], 
  pattern?: string,
  showPasswordToggle?: boolean,
  onTogglePassword?: () => void,
  isPasswordVisible?: boolean,
  compact?: boolean
}) {
  const inputType = showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className={cn("space-y-1.5", compact && "space-y-0.5")}>
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute inset-y-0 flex items-center text-slate-400 group-focus-within:text-primary dark:text-white/30 dark:group-focus-within:text-secondary transition-colors pointer-events-none",
            compact ? "left-3.5" : "left-4"
          )}>
            {icon}
          </div>
        )}
        <input 
          type={inputType}
          inputMode={inputMode}
          pattern={pattern}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={cn(
            "w-full transition-all outline-none",
            "bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary/50 focus:bg-white",
            "dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 dark:focus:bg-white/[0.06] backdrop-blur-md",
            compact 
              ? "py-2.5 sm:py-3.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl sm:rounded-2xl min-h-[42px] sm:min-h-[46px]" 
              : "py-4 text-base md:text-sm font-medium rounded-2xl min-h-[50px]",
            compact ? (icon ? "pl-11 sm:pl-12" : "pl-3.5") : (icon ? "pl-12" : "pl-4"),
            showPasswordToggle ? (compact ? "pr-10 sm:pr-12" : "pr-12") : (compact ? "pr-3.5" : "pr-4")
          )}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className={cn(
              "absolute inset-y-0 flex items-center text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white transition-colors focus:outline-none",
              compact ? "right-3.5" : "right-4"
            )}
          >
            {isPasswordVisible ? <EyeOff size={compact ? 16 : 18} /> : <Eye size={compact ? 16 : 18} />}
          </button>
        )}
      </div>
    </div>
  );
}
