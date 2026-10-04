import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Fingerprint, 
  Copy, 
  Check, 
  ShieldCheck,
  Share2,
  ChevronRight,
  ArrowLeft,
  Settings,
  Zap,
  Lock,
  Monitor,
  LogOut,
  Camera,
  Link as LinkIcon,
  BadgeCheck,
  X,
  Upload,
  Image as ImageIcon,
  UserCircle,
  LayoutDashboard,
  ArrowRightLeft,
  Sparkles,
  Globe
} from 'lucide-react';
import { useAuth, handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { AnimatePresence } from 'motion/react';
import { normalizePhoneNumber } from '../utils/phone';
import { getAccountCountryName } from '../services/paymentRouting';
import { isGoogleProfileIncomplete } from '../utils/googleProfile';
import GoogleProfileCompletion from './GoogleProfileCompletion';
import PremiumLoader from './PremiumLoader';

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

export default function Profile() {
  const { user, profile, loading, logout } = useAuth();
  const { openTransferModal, openVerificationPrompt } = useUI();
  const { isBeta, toggleMode } = useMode();
  const navigate = useNavigate();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoMode, setPhotoMode] = useState<'options' | 'avatar' | 'camera'>('options');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Single authoritative completion mode flag initialized once profile is verified/loaded.
  // By maintaining this state during the completion visit, we prevent the race condition
  // where the normal Profile page would prematurely flash on-screen before the success modal.
  const [isVerificationFlowActive, setIsVerificationFlowActive] = useState<boolean | null>(null);

  const userCountry = getAccountCountryName(profile) || profile?.country || profile?.countryName || 'Not specified';

  React.useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      setEditPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

  React.useEffect(() => {
    if (isVerificationFlowActive === null && user && !loading && profile) {
      const incomplete = isGoogleProfileIncomplete(user, profile);
      setIsVerificationFlowActive(incomplete);
    }
  }, [isVerificationFlowActive, user, loading, profile]);

  // If user or profile is not yet resolved in auth, show PremiumLoader
  if (!user || loading || !profile || isVerificationFlowActive === null) {
    return <PremiumLoader />;
  }

  // If this visit started with an incomplete Google profile, retain GoogleProfileCompletion
  // until the user confirms the verification success modal and navigates to Home.
  if (isVerificationFlowActive) {
    return (
      <GoogleProfileCompletion 
        user={user} 
        profile={profile} 
        onComplete={() => {
          sessionStorage.setItem('google_profile_tooltip_dismissed', 'true');
        }} 
      />
    );
  }

  const handleSaveProfile = async () => {
    if (!profile?.uid) return;
    if (!editName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }
    
    setIsUploading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const normalizedPhone = editPhone ? normalizePhoneNumber(editPhone, profile.countryCode || profile.country_code || profile.countryName || profile.country) : '';
      await updateDoc(userRef, {
        name: editName,
        phone: normalizedPhone,
        photoURL: editPhotoURL,
        profile_edited: true
      });
      setIsEditing(false);
      toast.success("Profile updated successfully and locked permanently.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile details.");
      try {
        handleFirestoreError(e, OperationType.UPDATE, `users/${profile.uid}`);
      } catch (err) {
        console.error("Logged Firestore Error:", err);
      }
    } finally {
      setIsUploading(false);
    }
  };

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

  const updatePhotoURL = async (url: string) => {
    if (!profile?.uid) return;
    
    if (isEditing) {
      setEditPhotoURL(url);
      toast.success("Profile photo preview updated!");
      setShowPhotoModal(false);
      return;
    }

    setIsUploading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { photoURL: url });
      toast.success("Profile photo updated successfully!");
      setShowPhotoModal(false);
    } catch (error) {
      console.error("Error updating photo:", error);
      toast.error("Failed to update profile photo.");
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
      } catch (err) {
        console.error("Logged Firestore Error for Photo Update:", err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.uid) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawDataUrl = reader.result as string;
          const compressedDataUrl = await compressImage(rawDataUrl);
          await updatePhotoURL(compressedDataUrl);
        } catch (err) {
          console.error("Error processing file:", err);
          toast.error("Failed to process image.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image.");
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhotoMode('camera');
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleSaveCaptured = async () => {
    if (!capturedImage || !profile?.uid) return;
    
    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImage(capturedImage);
      await updatePhotoURL(compressedDataUrl);
      setCapturedImage(null);
    } catch (error) {
      console.error("Error saving captured photo:", error);
      toast.error("Failed to save photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code || ''}`;

  return (
    <div className="space-y-4 md:space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Mobile Sticky/Floating Profile bar with Glassmorphism */}
      <div className="lg:hidden sticky top-2 z-[40] mx-0 p-3.5 rounded-2xl bg-white/85 dark:bg-[#0b0d14]/75 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Profile picture at the extreme far left */}
          <button 
            onClick={() => {
              setPhotoMode('options');
              setShowPhotoModal(true);
            }}
            className="relative group flex-shrink-0 cursor-pointer focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 p-0.5 overflow-hidden bg-slate-100 dark:bg-white/5 backdrop-blur-sm shadow-md hover:scale-105 transition-transform">
              <img 
                src={(isEditing ? editPhotoURL : profile?.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
              <Camera size={10} />
            </div>
          </button>

          {/* Display name & Username (@handle) stacked tightly beside name */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[150px] sm:max-w-[200px]">
                {profile?.name}
              </span>
              {/* Green tick icon only for verified status */}
              <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                <Check size={10} strokeWidth={3.5} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50 tracking-wide mt-0.5">
              @{profile?.username}
            </span>
          </div>
        </div>

        {/* Edit Profile button neatly positioned on the right instead of Active status */}
        <div className="flex items-center gap-2">
          {!profile?.profile_edited ? (
            !isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl text-[10px] font-bold tracking-wider transition-all shadow-md shadow-[#009e42]/20 cursor-pointer whitespace-nowrap"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(profile?.name || '');
                    setEditPhone(profile?.phone || '');
                    setEditPhotoURL(profile?.photoURL || '');
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/80 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                   onClick={() => setShowWarningModal(true)}
                  className="px-2 py-1 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl text-[10px] font-bold tracking-wider transition-all shadow-md shadow-[#009e42]/20 cursor-pointer"
                >
                  Save
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider whitespace-nowrap">
              <Lock size={10} /> Profile Locked
            </div>
          )}
        </div>
      </div>

      {/* Desktop Profile Header Card (Keep exact original layout on desktop) */}
      <div className="hidden lg:block relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#051937] dark:via-[#004d7a] dark:to-[#008793] border border-slate-200/80 dark:border-transparent p-8 lg:p-12 text-slate-900 dark:text-white shadow-sm dark:shadow-xl transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <button 
                onClick={() => {
                  setPhotoMode('options');
                  setShowPhotoModal(true);
                }}
                className="w-28 h-28 lg:w-32 lg:h-32 rounded-full border-4 border-slate-200 dark:border-white/20 p-1.5 overflow-hidden bg-slate-100 dark:bg-white/10 hover:bg-slate-200/60 dark:hover:bg-white/20 backdrop-blur-sm shadow-md dark:shadow-2xl cursor-pointer hover:opacity-95 active:scale-95 transition-all focus:outline-none text-left"
              >
                <img 
                  src={(isEditing ? editPhotoURL : profile?.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </button>
              <button 
                onClick={() => {
                  setPhotoMode('options');
                  setShowPhotoModal(true);
                }}
                className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center cursor-pointer"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{profile?.name}</h1>
                <BadgeCheck size={24} className="text-blue-500 fill-blue-500/15 dark:text-blue-400 dark:fill-blue-400/20" />
              </div>
              <p className="text-slate-500 dark:text-white/60 text-sm font-medium tracking-wide">@{profile?.username}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 dark:bg-green-500/20 dark:border-green-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-green-400 mt-2">
                <Check size={12} strokeWidth={3} /> Verified Account
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="hidden dark:block absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      </div>

      {/* Dashboard Action Buttons - Side-by-Side Mobile Layout */}
      <div className={cn("grid gap-4 px-2", isBeta ? "grid-cols-2" : "grid-cols-1")}>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 px-4 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[10px] sm:text-xs tracking-widest transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
        >
          <LayoutDashboard size={18} /> Dashboard
        </button>
        {isBeta && (
          <button 
            onClick={openTransferModal}
            className="flex items-center justify-center gap-2 px-4 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-[10px] sm:text-xs tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft size={18} /> Transfer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start pt-2">
        {/* Main Info Columns */}
        <div className="lg:col-span-12 xl:col-span-12 flex flex-col gap-8">
          
          {/* Account Information Section */}
          <section className="space-y-4">
            <div className="px-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-[#009e42]" /> Account Information
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">View and manage your personal account details</p>
              </div>
              
              {!profile?.profile_edited ? (
                !isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="hidden lg:block px-4 py-2 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl text-[10px] font-bold tracking-wider transition-all shadow-md shadow-[#009e42]/20 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="hidden lg:flex gap-2">
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.name || '');
                        setEditPhone(profile?.phone || '');
                        setEditPhotoURL(profile?.photoURL || '');
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/80 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setShowWarningModal(true)}
                      className="px-3 py-2 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl text-[10px] font-bold tracking-wider transition-all shadow-md shadow-[#009e42]/20 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )
              ) : (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <Lock size={10} /> Profile Locked
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm transition-colors">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {isEditing && (
                  <div className="grid grid-cols-12 gap-4 p-5 items-center bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <div className="col-span-1 text-blue-500">
                      <Camera size={16} />
                    </div>
                    <div className="col-span-11 md:col-span-3">
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Profile Photo</p>
                    </div>
                    <div className="col-span-12 md:col-span-8 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-14 h-14 rounded-full border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-white/5 flex-shrink-0">
                        <img 
                          src={editPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'nexus'}`} 
                          alt="Avatar Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={async () => {
                            setPhotoMode('camera');
                            setShowPhotoModal(true);
                            await startCamera();
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-bold tracking-wider text-slate-800 dark:text-white transition-all cursor-pointer"
                        >
                          <Camera size={12} /> Take with Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-bold tracking-wider text-slate-800 dark:text-white transition-all cursor-pointer"
                        >
                          <Upload size={12} /> Upload Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {isEditing ? (
                  <div className="grid grid-cols-12 gap-3 p-5 items-center bg-slate-50/50 dark:bg-white/5">
                    <div className="col-span-1 text-blue-500">
                      <User size={16} />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Full Name</p>
                    </div>
                    <div className="col-span-7 md:col-span-8">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <InfoRow 
                    icon={<User size={16} />} 
                    label="Full Name" 
                    value={profile?.name || 'N/A'} 
                  />
                )}
                <InfoRow 
                  icon={<Fingerprint size={16} />} 
                  label="Username" 
                  value={`@${profile?.username}`} 
                />
                <InfoRow 
                  icon={<Mail size={16} />} 
                  label="Email Address" 
                  value={profile?.email || 'N/A'} 
                />
                {isEditing ? (
                  <div className="grid grid-cols-12 gap-3 p-5 items-center bg-slate-50/50 dark:bg-white/5">
                    <div className="col-span-1 text-blue-500">
                      <Phone size={16} />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Phone Number</p>
                    </div>
                    <div className="col-span-7 md:col-span-8">
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1 234 567 890"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <InfoRow 
                    icon={<Phone size={16} />} 
                    label="Phone Number" 
                    value={profile?.phone || 'Not provided'} 
                  />
                )}
                <InfoRow 
                  icon={<Globe size={16} />} 
                  label="Country" 
                  value={userCountry} 
                />
                <InfoRow 
                  icon={<ShieldCheck size={16} />} 
                  label="User ID" 
                  value={profile?.public_id || ''} 
                  onCopy={() => handleCopy(profile?.public_id || '', 'User ID')}
                  isCopied={copiedField === 'User ID'}
                />
                <InfoRow 
                  icon={<Share2 size={16} />} 
                  label="Referral Code" 
                  value={profile?.referral_code || 'N/A'} 
                  onCopy={() => handleCopy(profile?.referral_code || '', 'Referral Code')}
                  isCopied={copiedField === 'Referral Code'}
                />
                <InfoRow 
                  icon={<LinkIcon size={16} />} 
                  label="Referral Link" 
                  value={referralLink} 
                  onCopy={() => handleCopy(referralLink, 'Referral Link')}
                  isCopied={copiedField === 'Referral Link'}
                  truncate
                />
              </div>
            </div>
          </section>

          {/* Go to Settings Button */}
          <div className="w-full">
            <button 
              onClick={() => navigate('/settings')}
              className="w-full p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white tracking-wide">Account Settings</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Manage password, devices, and security preferences</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Interface Mode Switch at the Bottom of Profile */}
          <div className="w-full p-4 sm:p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between shadow-sm transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors flex items-center justify-center flex-shrink-0",
                isBeta ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}>
                {isBeta ? <Sparkles size={18} /> : <Zap size={18} />}
              </div>
              <div className="text-left min-w-0">
                <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                  {isBeta ? 'Switch to Lite' : 'Switch to Beta'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!isBeta && user && isGoogleProfileIncomplete(user, profile)) {
                  openVerificationPrompt("Please complete your account verification to access CGA Beta.");
                  return;
                }
                toggleMode(() => {
                  navigate('/home');
                });
              }}
              type="button"
              role="switch"
              aria-checked={isBeta}
              aria-label="Toggle interface mode"
              className={cn(
                "relative inline-flex h-8 w-15 sm:w-16 flex-shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none border shadow-inner active:scale-95",
                isBeta
                  ? "bg-purple-100 border-purple-300 dark:bg-purple-950/70 dark:border-purple-500/40 shadow-purple-900/30"
                  : "bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-500/30 shadow-emerald-900/20"
              )}
            >
              {/* Subtle track indicator dots without text labels */}
              <div className="w-full h-full flex items-center justify-between px-1.5 pointer-events-none">
                <span className={cn("w-1.5 h-1.5 rounded-full transition-opacity", !isBeta ? "bg-emerald-600 dark:bg-emerald-400 opacity-80" : "bg-slate-300 dark:bg-white/20 opacity-30")} />
                <span className={cn("w-1.5 h-1.5 rounded-full transition-opacity", isBeta ? "bg-purple-600 dark:bg-purple-400 opacity-80" : "bg-slate-300 dark:bg-white/20 opacity-30")} />
              </div>

              {/* Sliding Knob */}
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className={cn(
                  "absolute top-1 w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-colors pointer-events-none",
                  isBeta
                    ? "right-1 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-purple-500/50"
                    : "left-1 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/50"
                )}
              >
                {isBeta ? (
                  <Sparkles size={11} className="text-white" />
                ) : (
                  <Zap size={11} className="text-white" />
                )}
              </motion.div>
            </button>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isUploading) {
                  stopCamera();
                  setShowPhotoModal(false);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#11141b] border border-slate-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black italic font-serif text-slate-900 dark:text-white">Profile Photo</h3>
                <button 
                  onClick={() => {
                    stopCamera();
                    setShowPhotoModal(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:text-aura-muted dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-slate-500 dark:text-aura-muted uppercase tracking-widest">Processing Node...</p>
                  </div>
                ) : photoMode === 'options' ? (
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setPhotoMode('avatar')}
                      className="flex items-center gap-4 p-6 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-2xl transition-all text-left cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <UserCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Choose Avatar</h4>
                        <p className="text-[10px] text-slate-500 dark:text-aura-muted uppercase tracking-widest mt-1">Select from our premium 3D collection</p>
                      </div>
                    </button>

                    <button 
                      onClick={startCamera}
                      className="flex items-center gap-4 p-6 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-2xl transition-all text-left cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                        <Camera size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Take Photo</h4>
                        <p className="text-[10px] text-slate-500 dark:text-aura-muted uppercase tracking-widest mt-1">Use your device camera</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-4 p-6 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-2xl transition-all text-left cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <Upload size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Upload Photo</h4>
                        <p className="text-[10px] text-slate-500 dark:text-aura-muted uppercase tracking-widest mt-1">Choose from your files</p>
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
                ) : photoMode === 'avatar' ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-500 dark:text-aura-muted uppercase tracking-[0.3em]">Institutional Male</h4>
                        <span className="h-px bg-slate-200 dark:bg-white/5 flex-1 mx-4" />
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                        {MALE_AVATARS.map(avatar => (
                          <button 
                            key={avatar.id}
                            onClick={() => updatePhotoURL(avatar.url)}
                            className="aspect-square bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary transition-all overflow-hidden group p-1 cursor-pointer"
                          >
                            <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-500 dark:text-aura-muted uppercase tracking-[0.3em]">Institutional Female</h4>
                        <span className="h-px bg-slate-200 dark:bg-white/5 flex-1 mx-4" />
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                        {FEMALE_AVATARS.map(avatar => (
                          <button 
                            key={avatar.id}
                            onClick={() => updatePhotoURL(avatar.url)}
                            className="aspect-square bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-secondary transition-all overflow-hidden group p-1 cursor-pointer"
                          >
                            <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setPhotoMode('options')}
                      className="w-full py-4 text-[10px] font-black text-slate-500 dark:text-aura-muted uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Back to options
                    </button>
                  </div>
                ) : photoMode === 'camera' ? (
                  <div className="space-y-6">
                    {capturedImage ? (
                      <div className="space-y-6">
                        <div className="aspect-square bg-black rounded-3xl overflow-hidden border border-white/10 shadow-inner">
                          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setCapturedImage(null)}
                            className="py-4 bg-white/5 text-aura-muted font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all"
                          >
                            Retake
                          </button>
                          <button 
                            onClick={handleSaveCaptured}
                            className="py-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                          >
                            Apply Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-inner relative">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={() => {
                              stopCamera();
                              setPhotoMode('options');
                            }}
                            className="flex-1 py-4 bg-white/5 text-aura-muted font-black uppercase tracking-widest text-[10px] rounded-xl"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={capturePhoto}
                            className="flex-[2] py-4 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                          >
                            <Camera size={16} /> Capture
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}

        {showWarningModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowWarningModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#11141b] border border-slate-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                <ShieldCheck size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white italic font-serif leading-none">Confirm Profile Lock</h3>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Verify identity credentials</p>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-600 dark:text-aura-muted leading-relaxed uppercase tracking-wider text-center">
                <p className="text-slate-600 dark:text-slate-300">
                  Please ensure the information entered matches your government-issued ID to avoid withdrawal issues in the future.
                </p>
                <p className="text-[10px] text-red-500 dark:text-red-400 font-extrabold text-center border border-red-500/20 bg-red-500/5 p-3 rounded-xl">
                  WARNING: Under fintech protocol rules, this update is ONE-TIME PERMANENT. Further edits will be locked.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => setShowWarningModal(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-aura-muted hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                >
                  Go Back
                </button>
                <button 
                  onClick={async () => {
                    setShowWarningModal(false);
                    await handleSaveProfile();
                  }}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  Confirm & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsSidebar({ navigate, logout }: { navigate: any, logout?: any }) {
  return (
    <div className="space-y-8 h-full">
      {/* Account Security Card */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" /> Account Security
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">Keep your account safe and secure</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-colors shadow-sm">
          <button 
            onClick={() => navigate('/settings')}
            className="w-full p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex items-center justify-between text-blue-500 group transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Go to Settings</span>
            </div>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Quick Actions Card */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={18} className="text-blue-500" /> Quick Actions
          </h3>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-colors shadow-sm">
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            <QuickAction label="Change Password" icon={<Lock size={14} />} onClick={() => navigate('/settings')} />
            <QuickAction label="Enable Two-Factor Auth" icon={<ShieldCheck size={14} />} onClick={() => navigate('/settings')} />
            <QuickAction label="Manage Devices" icon={<Monitor size={14} />} onClick={() => navigate('/settings')} />
            <QuickAction label="Logout" icon={<LogOut size={14} />} onClick={logout} isDanger />
          </ul>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ 
  icon, 
  label, 
  value, 
  onCopy, 
  isCopied,
  truncate 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  onCopy?: () => void, 
  isCopied?: boolean,
  truncate?: boolean
}) {
  return (
    <div className="grid grid-cols-12 gap-3 p-5 items-center hover:bg-slate-50 dark:hover:bg-slate-500/5 transition-colors">
      <div className="col-span-1 text-blue-500 opacity-90">
        {icon}
      </div>
      <div className="col-span-4 md:col-span-3">
        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      </div>
      <div className="col-span-7 md:col-span-8 flex items-center justify-between gap-3 overflow-hidden">
        <p className={cn("text-xs font-bold text-slate-900 dark:text-slate-200", truncate ? "truncate" : "break-words")}>
          {value}
        </p>
        {onCopy && (
          <button 
            onClick={onCopy}
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function QuickAction({ label, icon, onClick, isDanger }: { label: string, icon?: React.ReactNode, onClick?: () => void, isDanger?: boolean }) {
  return (
    <li>
      <button 
        onClick={onClick}
        className={cn(
          "w-full px-6 py-4.5 flex items-center justify-between text-xs font-bold transition-all group",
          isDanger 
            ? "text-red-500 hover:bg-red-500/10" 
            : "text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="opacity-50">{icon}</span>}
          <span>{label}</span>
        </div>
        <ChevronRight size={14} className="text-slate-400 dark:text-slate-300 group-hover:translate-x-1 transition-transform" />
      </button>
    </li>
  );
}


