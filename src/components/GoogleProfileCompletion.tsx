import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  X, 
  Check, 
  Globe, 
  Phone, 
  User, 
  Fingerprint, 
  Mail, 
  ChevronRight,
  AlertCircle,
  Camera,
  Upload,
  UserCircle
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { COUNTRIES, Country } from '../constants/countries';
import { normalizePhoneNumber } from '../utils/phone';
import { db, upsertUserDocRest } from '../lib/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { useUI } from '../contexts/UIContext';
import { cn } from '../lib/utils';
import { getAccountCountryName } from '../services/paymentRouting';

interface GoogleProfileCompletionProps {
  user: FirebaseUser;
  profile: any;
  onComplete: () => void;
}

// Institutional Avatars matching Profile.tsx
const MALE_AVATARS = [
  { id: 'm1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jack' },
  { id: 'm2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver' },
  { id: 'm3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=James' },
  { id: 'm4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Leo' },
  { id: 'm5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ryan' },
  { id: 'm6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex' },
  { id: 'm7', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ben' },
  { id: 'm8', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Chris' },
  { id: 'm9', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Eric' },
  { id: 'm10', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Dan' },
];

const FEMALE_AVATARS = [
  { id: 'f1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
  { id: 'f2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Lily' },
  { id: 'f3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ada' },
  { id: 'f4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Eva' },
  { id: 'f5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mia' },
  { id: 'f6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Chloe' },
  { id: 'f7', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zoe' },
  { id: 'f8', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ruby' },
  { id: 'f9', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ivy' },
  { id: 'f10', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Maya' },
];

// Helper to compress uploaded images matching Profile.tsx
const compressImage = (dataUrl: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
  });
};

export default function GoogleProfileCompletion({
  user,
  profile,
  onComplete
}: GoogleProfileCompletionProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { openVerificationSuccess } = useUI();

  // Profile Avatar / Photo State
  const initialPhoto = profile?.photoURL || user.photoURL || '';
  const [photoURL, setPhotoURL] = useState<string>(initialPhoto);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [photoMode, setPhotoMode] = useState<'options' | 'avatar'>('options');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [fullName, setFullName] = useState(
    profile?.name || user.displayName || user.email?.split('@')[0] || ''
  );
  const [username, setUsername] = useState(
    profile?.username || (user.email?.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9_]/g, '')
  );
  const userEmail = user.email || profile?.email || '';

  // Country State
  const initialCountryName = getAccountCountryName(profile) || profile?.country || profile?.countryName || 'Nigeria';
  const foundInitialCountry = COUNTRIES.find(
    c => c.name.toLowerCase() === initialCountryName.toLowerCase() ||
         c.code.toUpperCase() === (profile?.countryCode || profile?.country_code || '').toUpperCase()
  ) || COUNTRIES.find(c => c.code === 'NG') || COUNTRIES[0];

  const [selectedCountry, setSelectedCountry] = useState<Country>(foundInitialCountry);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Phone State
  const [phone, setPhone] = useState(profile?.phone || '');

  // 4-Digit Transaction PIN State (matching application transfer PIN system)
  const [pin, setPin] = useState(profile?.transfer_pin || '');
  const [confirmPin, setConfirmPin] = useState(profile?.transfer_pin || '');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Default avatar fallback
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.trim() || user.displayName || userEmail.split('@')[0] || 'nexus'}`;
  const displayAvatar = photoURL || profile?.photoURL || user.photoURL || defaultAvatar;

  // Filter countries for modal
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Handle Photo Update
  const updatePhoto = async (url: string) => {
    setPhotoURL(url);
    setIsUploadingPhoto(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: url });
      toast.success("Profile photo updated successfully!");
    } catch {
      // Soft-catch; will be committed on final submit
    } finally {
      setIsUploadingPhoto(false);
      setShowPhotoModal(false);
      setPhotoMode('options');
    }
  };

  // Handle Local File Upload with Compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawDataUrl = reader.result as string;
          const compressed = await compressImage(rawDataUrl);
          await updatePhoto(compressed);
        } catch (err) {
          console.error("Error compressing image:", err);
          toast.error("Failed to process image.");
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to upload image.");
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    // Validations
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      toast.error("Please enter your full name.");
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage("Username must be at least 3 characters.");
      toast.error("Username must be at least 3 characters.");
      return;
    }

    if (!selectedCountry) {
      setErrorMessage("Please select your country.");
      toast.error("Please select your country.");
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      setErrorMessage("Please enter a valid phone number.");
      toast.error("Please enter a valid phone number.");
      return;
    }

    // 4-Digit Transaction PIN Validation (reusing existing app rules)
    const cleanPin = pin.replace(/\D/g, '');
    const cleanConfirmPin = confirmPin.replace(/\D/g, '');

    if (cleanPin.length !== 4) {
      setErrorMessage("Transaction PIN must be exactly 4 digits.");
      toast.error("Transaction PIN must be exactly 4 digits.");
      return;
    }

    if (cleanConfirmPin.length !== 4) {
      setErrorMessage("Please confirm your 4-digit transaction PIN.");
      toast.error("Please confirm your 4-digit transaction PIN.");
      return;
    }

    if (cleanPin !== cleanConfirmPin) {
      setErrorMessage("Transaction PINs do not match.");
      toast.error("Transaction PINs do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Format phone number & update local phone-email mapping for quick login
      const canonicalPhone = normalizePhoneNumber(cleanPhone, selectedCountry.code);
      try {
        const cacheKey = 'cga_phone_email_cache_v1';
        const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
        existingCache[canonicalPhone] = userEmail.toLowerCase();
        localStorage.setItem(cacheKey, JSON.stringify(existingCache));
      } catch {}

      // 2. Update Firestore User Profile document with transfer_pin (reusing existing PIN field)
      const userRef = doc(db, 'users', user.uid);
      const finalPhoto = photoURL || profile?.photoURL || user.photoURL || displayAvatar;

      // 3. Existing $10 Google signup bonus logic - credited exactly once upon verification
      const alreadyCredited = profile?.bonus_credited === true || profile?.signup_bonus_credited === true || (profile?.total_invested || 0) >= 10;
      let newTotalInvested = profile?.total_invested || 0;
      if (!alreadyCredited) {
        newTotalInvested = (profile?.total_invested || 0) + 10;
        const txId = `signup-bonus-${user.uid}`;
        setDoc(doc(db, 'transactions', txId), {
          user_id: user.uid,
          type: 'signup_bonus',
          amount: 10,
          created_at: new Date().toISOString(),
          status: 'approved',
          description: "Congratulations, you have just received a $10 signup bonus into your assets balance."
        }).catch(() => {});
      }

      const updatePayload: any = {
        name: fullName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        phone: canonicalPhone,
        country: selectedCountry.name,
        countryName: selectedCountry.name,
        country_code: selectedCountry.code,
        countryCode: selectedCountry.code,
        country_flag: selectedCountry.flag,
        countryFlag: selectedCountry.flag,
        photoURL: finalPhoto,
        transfer_pin: cleanPin,
        transaction_pin: cleanPin, // Securely saved in both fields to guarantee compatibility
        profile_completed: true,
        is_google_user: true,
        updated_at: new Date().toISOString()
      };

      if (!alreadyCredited) {
        updatePayload.total_invested = newTotalInvested;
        updatePayload.bonus_credited = true;
        updatePayload.signup_bonus_credited = true;
      }

      let saveSucceeded = false;
      try {
        await updateDoc(userRef, updatePayload);
        saveSucceeded = true;
      } catch (firestoreErr) {
        console.warn("[Google Profile] Direct updateDoc failed, fallback to setDoc merge:", firestoreErr);
        try {
          await setDoc(userRef, updatePayload, { merge: true });
          saveSucceeded = true;
        } catch {
          const token = await user.getIdToken().catch(() => undefined);
          await upsertUserDocRest(user.uid, updatePayload, token, 5000);
          saveSucceeded = true;
        }
      }

      if (!saveSucceeded) {
        throw new Error("Unable to save profile verification. Please check your connection and try again.");
      }

      sessionStorage.setItem('google_profile_tooltip_dismissed', 'true');
      toast.success("Account verification complete! Welcome to CGA.");
      onComplete();

      // Show the premium verification success overlay
      openVerificationSuccess(finalPhoto);
    } catch (err: any) {
      console.error("[Google Profile] Error completing verification:", err);
      const msg = err?.message || "Failed to complete verification. Please check your network and try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "w-full min-h-[calc(100vh-5rem)] py-8 md:py-12 px-4 flex items-center justify-center transition-colors -my-4 md:-my-8 -mx-4 lg:-mx-8 w-[calc(100%+2rem)] lg:w-[calc(100%+4rem)]",
      isDark ? "bg-[#07090e] text-white" : "bg-[#f8fafc] text-slate-900"
    )}>
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full max-w-2xl rounded-3xl border p-6 md:p-10 shadow-xl transition-colors",
          isDark 
            ? "bg-[#0e121a]/95 border-white/10 text-white shadow-2xl" 
            : "bg-white border-slate-200/90 text-slate-900 shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
        )}
      >
        {/* Header: Compact, premium, sharp, uncluttered */}
        <div className="text-center space-y-3 mb-8">
          {/* Profile Photo / Avatar Area with Change/Upload Trigger */}
          <div className="relative inline-block mx-auto">
            <button
              type="button"
              onClick={() => {
                setPhotoMode('options');
                setShowPhotoModal(true);
              }}
              className="relative group cursor-pointer focus:outline-none block"
              title="Change Profile Photo"
              aria-label="Change Profile Photo"
            >
              <div className="w-16 h-16 rounded-full border-2 border-[#009e42]/40 p-0.5 overflow-hidden bg-slate-100 dark:bg-white/5 backdrop-blur-sm shadow-md group-hover:scale-105 transition-transform">
                <img 
                  src={displayAvatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-[#009e42] text-white rounded-full shadow-md group-hover:scale-110 transition-transform flex items-center justify-center border-2 border-white dark:border-[#0e121a]">
                <Camera size={11} />
              </div>
            </button>
          </div>

          {/* Clean ONE-line Heading */}
          <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-[#009e42] leading-tight">
            Complete account verification
          </h1>

          {/* Subtitle referring to Transaction PIN */}
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Please provide your verified phone number, country, and secure transaction PIN to unlock full account access.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User size={12} className="text-[#009e42]" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className={cn(
                "w-full h-12 px-4 rounded-xl text-xs font-bold outline-none border transition-all",
                isDark 
                  ? "bg-white/5 border-white/10 text-white focus:border-[#009e42] placeholder:text-white/20" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#009e42] placeholder:text-slate-400"
              )}
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Fingerprint size={12} className="text-[#009e42]" />
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                required
                className={cn(
                  "w-full h-12 pl-8 pr-4 rounded-xl text-xs font-bold outline-none border transition-all",
                  isDark 
                    ? "bg-white/5 border-white/10 text-white focus:border-[#009e42] placeholder:text-white/20" 
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#009e42] placeholder:text-slate-400"
                )}
              />
            </div>
          </div>

          {/* Email (Pre-filled from Google, locked/verified) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail size={12} className="text-[#009e42]" />
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={userEmail}
                disabled
                className={cn(
                  "w-full h-12 px-4 pr-28 rounded-xl text-xs font-bold opacity-80 cursor-not-allowed border select-none",
                  isDark 
                    ? "bg-white/[0.02] border-white/10 text-white/70" 
                    : "bg-slate-100 border-slate-200 text-slate-600"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#009e42]/10 border border-[#009e42]/20 text-[#009e42] text-[9px] font-black uppercase tracking-wider">
                <Check size={11} />
                Google Verified
              </div>
            </div>
          </div>

          {/* Country Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe size={12} className="text-[#009e42]" />
              Country <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCountryModal(true)}
              className={cn(
                "w-full h-12 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer",
                isDark 
                  ? "bg-white/5 border-white/10 text-white hover:border-[#009e42]/50 hover:bg-white/10" 
                  : "bg-slate-50 border-slate-200 text-slate-900 hover:border-[#009e42]/50 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl leading-none" role="img" aria-label={selectedCountry.name}>
                  {selectedCountry.flag}
                </span>
                <span className="font-bold text-xs">{selectedCountry.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({selectedCountry.code})</span>
              </div>
              <span className="text-[10px] font-bold text-[#009e42] uppercase tracking-wider flex items-center gap-1">
                Change <ChevronRight size={12} />
              </span>
            </button>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Phone size={12} className="text-[#009e42]" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <PhoneInput
                country={selectedCountry.code.toLowerCase()}
                value={phone}
                onChange={(val) => setPhone(val)}
                disableDropdown={true}
                countryCodeEditable={false}
                containerClass="nexus-phone-container"
                inputClass="nexus-phone-input"
                buttonClass="nexus-phone-button"
                dropdownClass="nexus-phone-dropdown"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Transaction PIN: 4 Digits Only */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock size={12} className="text-[#009e42]" />
                Create transaction PIN <span className="text-red-500">*</span>
              </label>
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {pin.length}/4 digits
              </span>
            </div>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                required
                className={cn(
                  "w-full h-12 pl-4 pr-11 rounded-xl text-xs font-bold outline-none border transition-all tracking-widest",
                  isDark 
                    ? "bg-white/5 border-white/10 text-white focus:border-[#009e42] placeholder:text-white/20 placeholder:tracking-normal" 
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#009e42] placeholder:text-slate-400 placeholder:tracking-normal"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                aria-label="Toggle PIN visibility"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Transaction PIN: 4 Digits Only */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock size={12} className="text-[#009e42]" />
                Confirm transaction PIN <span className="text-red-500">*</span>
              </label>
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {confirmPin.length}/4 digits
              </span>
            </div>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirm 4-digit PIN"
                required
                className={cn(
                  "w-full h-12 pl-4 pr-11 rounded-xl text-xs font-bold outline-none border transition-all tracking-widest",
                  isDark 
                    ? "bg-white/5 border-white/10 text-white focus:border-[#009e42] placeholder:text-white/20 placeholder:tracking-normal" 
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#009e42] placeholder:text-slate-400 placeholder:tracking-normal"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                aria-label="Toggle confirm PIN visibility"
              >
                {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl shadow-[#009e42]/20 transition-all duration-300 disabled:opacity-50 cursor-pointer mt-4"
          >
            {isSubmitting ? 'Verifying & Saving...' : 'Complete Account Verification'}
          </button>
        </form>
      </motion.div>

      {/* Profile Photo / Avatar Selection Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhotoModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl overflow-hidden",
                isDark ? "bg-[#11141b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {photoMode === 'avatar' ? 'Choose Avatar' : 'Update Profile Photo'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    {photoMode === 'avatar' ? 'Select from collection' : 'Choose photo source'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {photoMode === 'options' ? (
                <div className="space-y-3 py-5">
                  <button
                    type="button"
                    onClick={() => setPhotoMode('avatar')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 bg-[#009e42]/10 rounded-xl flex items-center justify-center text-[#009e42]">
                      <UserCircle size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Choose Avatar</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                        Select from 3D avatars
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                      <Upload size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isUploadingPhoto ? 'Uploading image...' : 'Upload from device'}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                        Choose picture from your files
                      </p>
                    </div>
                  </button>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                      Institutional Male
                    </h4>
                    <div className="grid grid-cols-5 gap-2.5">
                      {MALE_AVATARS.map(av => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => updatePhoto(av.url)}
                          className="aspect-square bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#009e42] transition-all overflow-hidden p-1 cursor-pointer hover:scale-105"
                        >
                          <img src={av.url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                      Institutional Female
                    </h4>
                    <div className="grid grid-cols-5 gap-2.5">
                      {FEMALE_AVATARS.map(av => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => updatePhoto(av.url)}
                          className="aspect-square bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#009e42] transition-all overflow-hidden p-1 cursor-pointer hover:scale-105"
                        >
                          <img src={av.url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setPhotoMode('options')}
                    className="w-full py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Back to options
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Country Selection Modal */}
      <AnimatePresence>
        {showCountryModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCountryModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative z-10 w-full max-w-lg rounded-3xl border p-6 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden",
                isDark ? "bg-[#11141b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Select Country</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    Choose your country for regional verification
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCountryModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Country Search */}
              <div className="relative my-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search countries by name or code..."
                  autoFocus
                  className={cn(
                    "w-full h-11 pl-10 pr-4 rounded-xl text-xs font-bold outline-none border transition-all",
                    isDark 
                      ? "bg-white/5 border-white/10 text-white focus:border-[#009e42] placeholder:text-white/20" 
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#009e42] placeholder:text-slate-400"
                  )}
                />
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setShowCountryModal(false);
                        setCountrySearch('');
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                        selectedCountry.code === c.code
                          ? "bg-[#009e42]/10 border-[#009e42] text-[#009e42]"
                          : isDark
                          ? "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10 text-white"
                          : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300 text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none select-none" role="img" aria-label={c.name}>
                          {c.flag}
                        </span>
                        <span className="text-xs font-bold">{c.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {c.code}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No country matches "{countrySearch}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
