import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Gift, 
  ChevronRight, 
  Copy, 
  Share2, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Zap, 
  ArrowLeft,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { cn, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DynamicBalance } from './DynamicBalance';

interface ReferralPartner {
  id: string;
  name: string;
  username: string;
  email: string;
  created_at: string;
  avatar_url?: string;
  country?: string;
  status: 'active' | 'inactive';
  last_rebook?: string;
  active_investment_amount?: number;
}

export default function Referrals() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const q = query(collection(db, 'users'), where('referred_by', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const partnerData: ReferralPartner[] = [];
      
      for (const userDoc of snap.docs) {
        const u = userDoc.data();
        
        // Check for active investments
        const invQ = query(
          collection(db, 'investments'), 
          where('user_id', '==', userDoc.id), 
          where('status', '==', 'active')
        );
        const invSnap = await getDocs(invQ);
        
        const isActive = !invSnap.empty;
        let totalActiveAmount = 0;
        if (isActive) {
          invSnap.forEach(inv => {
            totalActiveAmount += inv.data().amount || 0;
          });
        }

        partnerData.push({
          id: userDoc.id,
          name: u.name,
          username: u.username,
          email: u.email,
          created_at: u.created_at,
          avatar_url: u.avatar_url,
          country: u.country || 'Global',
          status: isActive ? 'active' : 'inactive',
          last_rebook: u.last_rebook,
          active_investment_amount: totalActiveAmount
        });
      }
      
      setPartners(partnerData);
      setLoading(false);
    }, (error) => {
      console.warn("Referrals listener blocked:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRebook = async (partner: ReferralPartner) => {
    if (!user || !profile) return;

    try {
      const now = new Date();
      
      // Update partner document with last_rebook
      await updateDoc(doc(db, 'users', partner.id), {
        last_rebook: now.toISOString()
      });

      // Send in-app notification to the partner
      await addDoc(collection(db, 'notifications'), {
        user_id: partner.id,
        title: 'Partner Invitation',
        message: 'Your network partner invited you to start investing and earning on Capital Growth Alliance.',
        type: 'info',
        read: false,
        created_at: now.toISOString()
      });

      toast.success(`Rebook invitation sent to ${partner.username}`);
    } catch (error) {
      toast.error("Failed to send rebook invitation.");
    }
  };

  const getRebookCooldown = (lastRebook?: string) => {
    if (!lastRebook) return 0;
    const last = new Date(lastRebook).getTime();
    const now = currentTime.getTime();
    const diff = now - last;
    const cooldown = 24 * 60 * 60 * 1000;
    return Math.max(0, cooldown - diff);
  };

  const formatCooldown = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const activePartners = partners.filter(p => p.status === 'active');
  const inactivePartners = partners.filter(p => p.status === 'inactive');

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic font-serif tracking-tight">Network Fleet</h1>
          <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-2">Manage your high-performance referral clusters.</p>
        </div>
      </header>

      {/* Referral Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 bg-[#11141b] border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Gift size={80} className="text-primary" />
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic font-serif">Referral Portal</h3>
                <p className="text-[10px] font-black text-aura-muted uppercase tracking-widest">Share and Expand your influence</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest ml-1">Referral Code</p>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <code className="text-sm font-black text-white tracking-[0.2em]">{profile?.referral_code || '---'}</code>
                  <button 
                    onClick={() => handleCopy(profile?.referral_code || '', 'Code')}
                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest ml-1">Referral Link</p>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <code className="text-[10px] font-black text-white/60 truncate mr-4">{profile?.referral_link || '---'}</code>
                  <button 
                    onClick={() => handleCopy(profile?.referral_link || '', 'Link')}
                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all flex-shrink-0"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-[40px] shadow-2xl flex flex-col justify-between">
           <div className="flex items-start justify-between">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <Zap size={24} />
             </div>
             <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black text-white uppercase tracking-widest">Rewards Active</span>
           </div>
           <div>
             <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">5% Dual Bonus</h4>
             <p className="text-xs font-medium text-white/80 leading-relaxed">
               Both you and your partner receive a 5% instant bonus upon node activation.
             </p>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12">
        {/* ACTIVE REFERRALS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" /> Active Referrals
            </h3>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              {activePartners.length} Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePartners.map(partner => (
              <div key={partner.id}>
                <PartnerCard partner={partner} />
              </div>
            ))}
            {activePartners.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/5 rounded-[40px]">
                <Users size={48} className="mx-auto text-white/5 mb-4" />
                <p className="text-[10px] font-black text-aura-muted uppercase tracking-widest">No active network nodes detected.</p>
              </div>
            )}
          </div>
        </section>

        {/* INACTIVE REFERRALS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" /> Inactive Referrals
            </h3>
            <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[9px] font-black text-yellow-500 uppercase tracking-widest">
              {inactivePartners.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactivePartners.map(partner => (
              <div key={partner.id}>
                <PartnerCard 
                  partner={partner} 
                  onRebook={() => handleRebook(partner)}
                  cooldown={getRebookCooldown(partner.last_rebook)}
                  formatCooldown={formatCooldown}
                />
              </div>
            ))}
            {inactivePartners.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/5 rounded-[40px]">
                <Users size={48} className="mx-auto text-white/5 mb-4" />
                <p className="text-[10px] font-black text-aura-muted uppercase tracking-widest">Clean slate. All partners are operational.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PartnerCard({ 
  partner, 
  onRebook, 
  cooldown = 0, 
  formatCooldown 
}: { 
  partner: ReferralPartner, 
  onRebook?: () => void,
  cooldown?: number,
  formatCooldown?: (ms: number) => string
}) {
  const isCooldownActive = cooldown > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#11141b] border border-white/5 rounded-[32px] p-6 shadow-xl relative overflow-hidden group hover:border-white/10 transition-all"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt={partner.username} className="w-full h-full object-cover" />
          ) : (
            <Users size={24} className="text-white/20" />
          )}
        </div>
        <div>
          <h4 className="text-lg font-black text-white italic font-serif flex items-center gap-2">
            @{partner.username}
            {partner.status === 'active' && <CheckCircle2 size={14} className="text-emerald-500" />}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] font-black text-aura-muted uppercase tracking-widest">{partner.country}</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Joined {new Date(partner.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {partner.status === 'active' ? (
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Node Cap</span>
              <Activity size={10} className="text-emerald-500 animate-pulse" />
            </div>
            <div className="h-8 w-full">
                <DynamicBalance 
                    value={formatCurrency(partner.active_investment_amount || 0)} 
                    containerClassName="justify-start"
                    className="text-left"
                    baseSizeMobile="text-lg"
                    baseSizeDesktop="lg:text-xl"
                />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Status</p>
              <p className="text-xs font-black text-white/40 uppercase tracking-widest">Inactive Cluster</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          </div>
        )}

        {onRebook && (
          <button 
            disabled={isCooldownActive}
            onClick={onRebook}
            className={cn(
              "w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
              isCooldownActive 
                ? "bg-white/5 text-aura-muted cursor-not-allowed" 
                : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]"
            )}
          >
            {isCooldownActive ? (
              <>
                <Clock size={14} /> {formatCooldown && formatCooldown(cooldown)}
              </>
            ) : (
              <>
                <Zap size={14} /> Rebook Network
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
