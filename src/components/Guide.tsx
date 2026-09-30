import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Coins, 
  Gift, 
  Users, 
  Trophy, 
  Wallet, 
  ArrowUpRight, 
  HelpCircle, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  DollarSign,
  HeartPlus,
  Compass,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  MessageSquare,
  Bot,
  ExternalLink,
  QrCode,
  Copy,
  Users2,
  Flame,
  Award,
  Send,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export default function Guide() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('deposits');

  // References for scrolling to sections
  const sectionRefs = {
    deposits: useRef<HTMLDivElement>(null),
    invest: useRef<HTMLDivElement>(null),
    activation: useRef<HTMLDivElement>(null),
    withdrawals: useRef<HTMLDivElement>(null),
    rewards: useRef<HTMLDivElement>(null),
    referrals: useRef<HTMLDivElement>(null),
    rankings: useRef<HTMLDivElement>(null),
    twn: useRef<HTMLDivElement>(null),
    support: useRef<HTMLDivElement>(null),
  };

  const handleTabClick = (tabId: keyof typeof sectionRefs) => {
    setActiveTab(tabId);
    if (sectionRefs[tabId]?.current) {
      sectionRefs[tabId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto px-4 lg:px-0">
      
      {/* A. Hero Section */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#0c0f1e] via-[#12193b] to-[#070a14] p-8 lg:p-14 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Soft Ambient Globs */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-aura-lime/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-emerald-500/[0.03] rounded-full translate-y-1/2 -translate-x-1/3 blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            {/* Animated Core Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#009e42] rounded-[28px] opacity-20 blur-md animate-pulse" />
              <div className="relative w-24 h-24 rounded-[28px] bg-[#0c0d15] border-2 border-white/10 flex items-center justify-center text-[#009e42] shadow-2xl">
                <Compass size={46} className="animate-[spin_40s_linear_infinite]" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <Sparkles size={11} className="text-[#009e42]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#009e42]">{t("Interactive Learning Portal")}</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-white uppercase italic font-serif">
                {t("Platform Guide &")} <span className="text-[#009e42] not-italic">{t("User Walkthrough")}</span>
              </h1>
              <p className="text-[#8E8A9E] text-xs lg:text-sm font-medium tracking-wide max-w-2xl leading-relaxed">
                {t("Learn how to navigate Capital Growth Alliance step-by-step, from deposits and investments to rewards, referrals, withdrawals, and TWN token activities. Understand key processes with detailed visual interactive mockups representing every feature.")}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 active:scale-95 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/[0.08] cursor-pointer shadow-lg"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* B. Quick Navigation Tabs */}
      <div className="bg-[#0b0c13]/90 border border-white/5 p-2 rounded-[24px] sticky top-4 z-[999] backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none scrollbar-hide">
          {[
            { id: 'deposits', label: 'Deposits', icon: <Wallet size={13} /> },
            { id: 'invest', label: 'Investments', icon: <TrendingUp size={13} /> },
            { id: 'activation', label: 'Activation', icon: <LaserBeamIcon /> },
            { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpRight size={13} /> },
            { id: 'rewards', label: 'Rewards', icon: <Gift size={13} /> },
            { id: 'referrals', label: 'Referrals', icon: <Users size={13} /> },
            { id: 'rankings', label: 'Rankings', icon: <Trophy size={13} /> },
            { id: 'twn', label: 'CGA Token', icon: <Coins size={13} /> },
            { id: 'support', label: 'Support', icon: <HelpCircle size={13} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as keyof typeof sectionRefs)}
              className={`flex items-center gap-2 px-4 py-3 text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap rounded-[16px] transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#009e42] text-white shadow-[0_6px_20px_rgba(0,158,66,0.3)]'
                  : 'text-[#8E8A9E] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* C, D & E. Step-by-Step Tutorials Section */}
      <div className="space-y-16 pt-4">

        {/* 1. HOW TO DEPOSIT */}
        <div ref={sectionRefs.deposits} className="scroll-mt-32">
          <SectionHeader 
            badge="Funding Stage 01"
            title="How to Deposit Funds"
            description="Acquire secure USDT TRC20 balance. Our streamlined deposit system facilitates standard secure crypto operations with rapid transaction processing verification."
            icon={<Wallet className="text-pink-400" size={24} />}
            colorClass="text-pink-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Initiate Deposit Portal">
                On the sidebar or your main Dashboard Account widget, locate and click the <strong className="text-white">Fund / Deposit</strong> operator action.
              </StepIndicator>

              <StepIndicator step={2} title="Confirm Network Protocol">
                Verify asset is configured to <strong className="text-pink-400">USDT</strong> via the <strong className="text-pink-400 font-black">TRON (TRC20) network protocol</strong>. Deposits sent to other formats cannot resolve on-chain automatically.
              </StepIndicator>

              <StepIndicator step={3} title="Copy Cold Address / Scan QR">
                Securely generate and copy the active hot-node receiver address. Launch your exchange wallet (e.g. Binance, TrustWallet) and submit transfer.
              </StepIndicator>

              <StepIndicator step={4} title="Publish TXID For Approval">
                Return to the deposit terminal, fill in the exact USDT quantity, enter the generated transactional hash <strong className="text-white">TxID/TxHash</strong>, and request validation. Approvals confirm within 15–45 minutes.
              </StepIndicator>

              <div className="p-4 bg-pink-500/5 rounded-2xl border border-pink-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-pink-400 uppercase tracking-widest block mb-1">💡 Pro Tips & Rules:</span>
                - Minimum deposit value is <strong className="text-white">$10</strong>.<br/>
                - Ensure matching decimals. Always send exact USDT TRC20 to avoid ledger drops.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>
              
              {/* Deposit Interface Mock Render */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Selectors and Address */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">1. Selected Currency & Network</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border-2 border-[#009e42]/40 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-white relative">
                        <span className="flex items-center gap-1.5 font-serif italic"><Coins size={12} className="text-[#009e42]" /> USDT</span>
                        <span className="text-[8px] bg-[#009e42]/10 text-[#009e42] px-1.5 py-0.5 rounded uppercase font-black">Active</span>
                        <Hotspot size={14} className="top-1 right-1" borderClass="border-red-500" bgClass="bg-red-500" />
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-[#8E8A9E]">
                        <span>TRON (TRC20)</span>
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>

                  {/* QR Core Mock */}
                  <div className="flex flex-col items-center py-3 bg-white/[0.01] border border-white/5 rounded-2xl relative">
                    <QrCode className="text-slate-200" size={90} />
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">Scan to deposit</span>
                  </div>

                  {/* Address Box */}
                  <div className="space-y-2 relative">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                      <span>2. Deposit Destination Address</span>
                      <span className="text-[8px] text-[#009e42] font-black uppercase">Click Address to Copy</span>
                    </label>
                    <div className="bg-[#050608] border border-[#009e42]/30 rounded-xl p-3 flex items-center justify-between relative group">
                      <code className="text-xs text-[#009e42] font-semibold tracking-tight truncate select-all">T9yDpxnvTsVpBjMsZ5hsHn3s8MzkHnW</code>
                      <button className="p-1 px-2.5 bg-white/5 text-xs text-white rounded font-sans cursor-pointer flex items-center gap-1">
                        <Copy size={10} /> Copied!
                      </button>
                      <Hotspot size={20} className="-left-1 -top-1" borderClass="border-[#009e42]" bgClass="bg-[#009e42]" />
                    </div>
                  </div>

                  {/* TXID form mock */}
                  <div className="space-y-2 pt-1 border-t border-white/5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">3. Transaction Details Submission</label>
                    <div className="space-y-1.5">
                      <input 
                        type="text" 
                        placeholder="Paste TXID / Transaction Hash" 
                        value="8f3c11d2e8aa2ecb868e47fbc..." 
                        readOnly
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 outline-none select-none"
                      />
                      <button className="w-full py-2.5 bg-[#009e42] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg relative flex items-center justify-center gap-1">
                        <Send size={11} /> Confirm & Verify Deposit
                        <Hotspot size={18} className="bottom-0 right-1/2 translate-x-1/2 translate-y-1/2" borderClass="border-red-500" bgClass="bg-red-500 animate-ping" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. HOW TO INVEST */}
        <div ref={sectionRefs.invest} className="scroll-mt-32">
          <SectionHeader 
            badge="Growth Engine 02"
            title="How to Select Investments"
            description="Deploy your deposited USDT balance into continuous quantitative yield engines. Select a designated network node to generate structured passive returns."
            icon={<TrendingUp className="text-emerald-400" size={24} />}
            colorClass="text-emerald-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Browse Nodes & Plans">
                Navigate to the <strong className="text-white">Invest</strong> ecosystem dashboard to view global tiers (Starter, Pro, Advanced, Horizon VIP).
              </StepIndicator>

              <StepIndicator step={2} title="Analyze Continuous Daily ROI">
                Each node features variable interest coefficients (e.g. 1.8% to 3.5% daily compounding) with pre-set locking schedules under dynamic security.
              </StepIndicator>

              <StepIndicator step={3} title="Input Principal Commitment">
                State the amount you wish to deposit to the designated investment. The calculator instantly estimates rolling rewards and payout trends.
              </StepIndicator>

              <StepIndicator step={4} title="Trigger Active Smart Stake">
                Authorize the system node. This transfers the required allocation from your funding pool straight to active deployment.
              </StepIndicator>

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">💡 Important Note on Returns:</span>
                Daily ROI updates are calculated on precise 24-hour intervals and credited to your primary wallet instantaneously.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Investment Interface Mock */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Select a Plan */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">1. Select Smart Yield Tier</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gradient-to-br from-[#10b981]/10 to-teal-500/5 border-2 border-emerald-500 rounded-2xl p-3 text-center relative cursor-pointer">
                        <span className="text-[7px] font-black uppercase tracking-widest bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2">Pulsing Node</span>
                        <div className="text-xs font-black text-white italic font-serif">CGA Starter</div>
                        <div className="text-lg font-black text-[#009e42]">2.1% <span className="text-[8px] font-sans text-slate-400">Daily</span></div>
                        <Hotspot size={12} className="top-1 right-1" borderClass="border-red-500" bgClass="bg-red-500" />
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3 text-center opacity-60">
                        <div className="text-xs font-black text-slate-400 italic font-serif">Horizon Elite</div>
                        <div className="text-lg font-black text-slate-500">3.5% <span className="text-[8px] font-sans text-slate-500">Daily</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Calculator Simulation */}
                  <div className="space-y-2 bg-[#050608] rounded-xl p-3 border border-white/5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">2. Input Principal Deployment</label>
                    <div className="flex items-center justify-between text-sm font-bold text-white px-1">
                      <span>$1,000.00</span>
                      <span className="text-[10px] text-slate-500 uppercase">USDT</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[9px] uppercase text-slate-400">
                      <div>Est. Daily Profit: <strong className="text-emerald-400">$21.00</strong></div>
                      <div>Term Locked: <strong className="text-white">Active Grid</strong></div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full py-3.5 bg-[#009e42] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:scale-105 shadow-md shadow-[#009e42]/20 relative flex items-center justify-center gap-1">
                    <Zap size={11} className="fill-white" /> Initiate Investment Node
                    <Hotspot size={18} className="right-4 top-1/2 -translate-y-1/2" borderClass="border-red-500" bgClass="bg-red-500 animate-ping" />
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. INVESTMENT ACTIVATION */}
        <div ref={sectionRefs.activation} className="scroll-mt-32">
          <SectionHeader 
            badge="Funding Stage 03"
            title="How to Activate Investments"
            description="After completing your wallet deposit verification, the allocated USDT must be initialized inside the active plan deployment grids."
            icon={<LaserBeamIcon />}
            colorClass="text-emerald-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Verify Wallet Available Balance">
                Under dashboard, confirm that your <strong className="text-white">Funding Balance</strong> reflects the newly completed deposits. 
              </StepIndicator>

              <StepIndicator step={2} title="Pick Plan Block Allocator">
                Choose the desired staking node in the Invest table. Tap "Manage Setup".
              </StepIndicator>

              <StepIndicator step={3} title="Synchronize Smart Contract License">
                Approve the smart licensing policy. If you haven't assigned secondary variables, just confirm the default deployment settings.
              </StepIndicator>

              <StepIndicator step={4} title="Register Active State Execution">
                Once confirmed, the node status logs register <strong className="text-emerald-400 uppercase font-black tracking-widest text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Running</strong>. The ROI dynamic graph instantly starts tracking active accumulative values.
              </StepIndicator>

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">💡 Checklist:</span>
                Nodes remain online 24/7. Monitoring status doesn't require maintaining manual active session states.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Activation Timeline Simulated Render */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Ledger Balance State */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <div>
                      <div className="text-[8px] uppercase text-slate-500 font-bold tracking-wider">Account Available Liquidity</div>
                      <div className="text-sm font-black text-white">$1,250.00 <span className="text-[10px] text-slate-400 font-sans">USDT</span></div>
                    </div>
                    <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={9} /> Verified Safe
                    </span>
                  </div>

                  {/* Flow Steps visual */}
                  <div className="space-y-2 relative pl-2">
                    <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-[#009e42]/20" />
                    
                    <div className="flex gap-2.5 relative">
                      <span className="w-2 h-2 rounded-full bg-[#009e42] mt-1 relative z-10" />
                      <div>
                        <div className="text-[9px] font-bold text-white uppercase">License Authenticated</div>
                        <p className="text-[8px] text-slate-400">Node wave license digital signature matching registry</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 relative">
                      <span className="w-2 h-2 rounded-full bg-[#009e42] mt-1 relative z-10" />
                      <div>
                        <div className="text-[9px] font-bold text-white uppercase">Capital Dispatched to Pool</div>
                        <p className="text-[8px] text-slate-400">Submitting $1,000 deployment contract limits</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 relative">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 relative z-10 animate-ping absolute" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 relative z-10" />
                      <div>
                        <div className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                          Node Alive & Running <Hotspot size={10} className="top-0 left-0" borderClass="border-red-500" bgClass="bg-red-500" />
                        </div>
                        <p className="text-[8px] text-slate-400">Real-time ledger pipeline compiling continuous ROI updates</p>
                      </div>
                    </div>
                  </div>

                  {/* ROI Engine Card Miniature simulation */}
                  <div className="bg-[#050608] border border-white/10 rounded-2xl p-4.5 space-y-2 text-center">
                    <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Continuous Ledger Harvest</div>
                    <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">$1,021.0425...</div>
                    <div className="w-full bg-white/5 rounded-full h-1 relative overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-[#009e42] h-full w-[45%]" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. HOW TO WITHDRAW */}
        <div ref={sectionRefs.withdrawals} className="scroll-mt-32">
          <SectionHeader 
            badge="Payout Stage 04"
            title="How to Request Withdrawals"
            description="Acquire liquid funds directly back to your secure external wallets. Understand multi-sig checks, timelines, and security audit verifications."
            icon={<ArrowUpRight className="text-rose-400" size={24} />}
            colorClass="text-rose-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Navigate Withdrawal Dashboard">
                Access your central pocket dashboard, click <strong className="text-white">Fund / Withdraw</strong>.
              </StepIndicator>

              <StepIndicator step={2} title="Provide Certified TRC20 Wallet Address">
                Carefully submit your personal external <strong className="text-rose-400">USDT TRC20 network target address</strong>. Make sure it is TRON (TRC20) compatible. Avoid sending directly to standard exchange deposits unless they support TRC20 network standard.
              </StepIndicator>

              <StepIndicator step={3} title="Specify Safe Payout Sum">
                Verify boundaries (minimum payout limitations and daily limits). Submit the input parameters.
              </StepIndicator>

              <StepIndicator step={4} title="Await Multi-Sig Verification and Release">
                To guarantee capital limits against malicious actors, security auditors verify rolling ledger balances. Processing dispatches immediately according to terms.
              </StepIndicator>

              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-rose-400 uppercase tracking-widest block mb-1">🔐 System Notice:</span>
                Do not attempt parallel cashouts while security sweeps are pending. Multi-stage approvals defend your funds under high cryptography.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Withdrawal Interface Simulated Render */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Address Selection */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex justify-between">
                      <span>USDT TRC20 Destination Address</span>
                      <span className="text-[8px] text-rose-400 font-extrabold flex items-center gap-1"><Lock size={8} /> Secure Protocol</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter Destination address (TRC20)" 
                      value="TXg8bBfS1p8aWzUv7hsDnzK..."
                      readOnly 
                      className="w-full bg-[#050608] border border-rose-500/30 rounded-xl p-2.5 text-xs text-slate-300 outline-none"
                    />
                    <Hotspot size={14} className="bottom-0 left-4" borderClass="border-rose-400" bgClass="bg-rose-400" />
                  </div>

                  {/* Cashout Amount */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Cashout Amount</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-white">
                      <span>$500.00</span>
                      <span className="text-[10px] text-slate-500">USDT</span>
                    </div>
                  </div>

                  {/* Multi-Sig Ledger progress */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 space-y-2">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black block">Safety Processing Queue</span>
                    <div className="flex items-center justify-between text-[9px] font-semibold text-[#8E8A9E]">
                      <span className="text-emerald-400">1. Verification Passed</span>
                      <span className="text-yellow-400 flex items-center gap-1">2. Payout Pending <Hotspot size={8} className="top-0 left-0" borderClass="border-rose-500 animate-ping" bgClass="bg-rose-500" /></span>
                      <span>3. Dispatched</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-yellow-500 h-full w-[66%]" />
                    </div>
                  </div>

                  {/* Trigger button */}
                  <button className="w-full py-3.5 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all relative flex items-center justify-center gap-1 shadow-lg">
                    <ArrowUpRight size={12} className="stroke-white" /> Request Account Withdrawal
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. HOW REWARDS WORK */}
        <div ref={sectionRefs.rewards} className="scroll-mt-32">
          <SectionHeader 
            badge="Ecosystem Stage 05"
            title="How Rewards Work"
            description="Achieve continuous bonus milestones through consecutive platform daily attestation loops. Consistent operators receive increased multipliers."
            icon={<Gift className="text-amber-400" size={24} />}
            colorClass="text-amber-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Check-in Attendance Hub">
                Visit the central Homepage section containing the <strong className="text-white">Attendance / Daily Rewards</strong> console widget.
              </StepIndicator>

              <StepIndicator step={2} title="Trigger Attestation Daily Signature">
                Hit the principal reward action. Points credit instantly to your permanent ledger.
              </StepIndicator>

              <StepIndicator step={3} title="Build Consecutive Day Streak">
                Log in and register attendance daily. Consistencies expand your reward limits towards Day 7.
              </StepIndicator>

              <StepIndicator step={4} title="Redeem Milestone Allocation Boosters">
                Utilize passive reward credits to unlock automated network enhancements and priority clearance channels.
              </StepIndicator>

              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-amber-400 uppercase tracking-widest block mb-1">⏱️ Attendance Cycles:</span>
                Reward signatures lock on 24-hour cycles. A single missed cycle drops streak metrics to initial baseline. Keep up your active streaks!
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Rewards Simulated Render */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Streak Progress Nodes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
                      <span>Daily Streak Tracker</span>
                      <span className="text-amber-400">Day 5 Active 🔥</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 font-mono text-[9px]">
                      {[1, 2, 3, 4].map(d => (
                        <div key={d} className="bg-amber-500/20 text-amber-400 border border-amber-500/35 rounded-lg py-2 text-center font-bold">D{d} ✓</div>
                      ))}
                      <div className="bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 rounded-lg py-2 text-center font-black relative">
                        D5
                        <Hotspot size={10} className="-top-1 -right-1" borderClass="border-red-500" bgClass="bg-red-500 animate-ping" />
                      </div>
                      <div className="bg-white/5 border border-white/5 text-slate-500 rounded-lg py-2 text-center">D6</div>
                      <div className="bg-white/5 border border-white/5 text-slate-500 rounded-lg py-2 text-center">D7</div>
                    </div>
                  </div>

                  {/* Attendance trigger */}
                  <div className="bg-[#050608] rounded-xl p-4 border border-white/5 text-center space-y-3 relative">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto border border-amber-500/25">
                      <Gift size={22} className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Validate Daily Node Presence</h4>
                      <p className="text-[8px] text-slate-400 leading-none">Attest and secure Day 5 Streak Bonus points</p>
                    </div>
                    <button className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-lg cursor-pointer">
                      Attest Daily Attendance
                    </button>
                    <Hotspot size={16} className="bottom-0 left-12" borderClass="border-[#009e42]" bgClass="bg-[#009e42]" />
                  </div>

                  {/* Loyalty Points display */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-[9px] uppercase text-slate-500 font-bold">Total Accrued Loyalty Points:</span>
                    <span className="text-xs font-black text-amber-400">4,850 PTS</span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. HOW REFERRALS WORK */}
        <div ref={sectionRefs.referrals} className="scroll-mt-32">
          <SectionHeader 
            badge="Multiplier Stage 06"
            title="How Referrals & Affiliates Help You"
            description="Leverage your downstream network keys to trigger automatic passive revenues. Receive real-time payouts on direct and indirect network configurations."
            icon={<Users className="text-blue-400" size={24} />}
            colorClass="text-blue-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Locate Invite Credentials">
                Access the <strong className="text-white">Referrals</strong> database layout inside sidebar.
              </StepIndicator>

              <StepIndicator step={2} title="Acquire Private Multiplier Key">
                Copy your unique affiliate link. Distribute to your circle, channels, or platform associates.
              </StepIndicator>

              <StepIndicator step={3} title="Receive Tier 1 Direct Commissions">
                Earn an instant <strong className="text-blue-400 font-bold">5% cash deposit reward</strong> directly to your balance the moment any Tier 1 referral finishes manual funding.
              </StepIndicator>

              <StepIndicator step={4} title="Collect 2% Node Activation Bonus">
                When downstream network operators lock an active investment, get an instant <strong className="text-[#009e42] font-bold">2% activation release</strong> directly to your liquid pocket.
              </StepIndicator>

              <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-blue-400 uppercase tracking-widest block mb-1">📊 Downline Ledgers:</span>
                Track active node downlines, traces, historical commissions, and real-time community growth within the central Referrals section.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Referrals Simulated Render */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Link copier mockup */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Your Personal Referral Coordinate</label>
                    <div className="bg-[#050608] border border-[#009e42]/30 rounded-xl p-2.5 flex items-center justify-between">
                      <code className="text-[10px] text-[#009e42] truncate">https://tavariwave.net/ref?id=US502</code>
                      <button className="px-2.5 py-1 bg-[#009e42] text-white text-[10px] font-bold rounded cursor-pointer">Copy</button>
                    </div>
                  </div>

                  {/* Downline Flow Chart representation */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 space-y-3">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Network Dual-Tier Flow</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#050608] border border-white/5 rounded-lg p-2.5 text-center relative">
                        <span className="text-[7.5px] uppercase font-semibold text-blue-300">Tier 1 Direct</span>
                        <div className="text-xs font-black text-white mt-1">5% Deposit</div>
                        <p className="text-[7px] text-slate-500 mt-0.5">Credited instantly on cash deposit</p>
                        <Hotspot size={10} className="top-1 right-1 animate-ping" borderClass="border-blue-400" bgClass="bg-blue-400" />
                      </div>

                      <div className="bg-[#050608] border border-white/5 rounded-lg p-2.5 text-center relative">
                        <span className="text-[7.5px] uppercase font-semibold text-[#009e42]">Tier 2 Deploy</span>
                        <div className="text-xs font-black text-white mt-1">2% Activation</div>
                        <p className="text-[7px] text-slate-500 mt-0.5">Credited when downline activates plan</p>
                      </div>
                    </div>
                  </div>

                  {/* List of Affiliates Mock */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Primary Downline Nodes</span>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex justify-between text-[10px] text-slate-300">
                      <span>User_099 (@Zen)</span>
                      <span className="text-blue-400 font-bold">+ $25.00 Commission</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7. RANKINGS & LEADERBOARD */}
        <div ref={sectionRefs.rankings} className="scroll-mt-32">
          <SectionHeader 
            badge="Leaderboard Stage 07"
            title="Ranking & Leaderboard Guide"
            description="Ascend global ranks to secure community reputation milestones. Increase total asset volume to activate special account priority variables."
            icon={<Trophy className="text-violet-400" size={24} />}
            colorClass="text-violet-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Track Real-Time Status Placement">
                Locate total asset values and active network variables compared with the global leaderboard directory.
              </StepIndicator>

              <StepIndicator step={2} title="Ascend Tiers (Bronze, Silver, Gold, VIP)">
                Ranks allocate dynamically matching Total Value Locked (TVL) contributions and active invite multipliers.
              </StepIndicator>

              <StepIndicator step={3} title="Collect Zero-Gas Transaction Caps">
                High-ranking operators unlock minimal transaction gas limits and direct prioritizations on on-chain withdrawals.
              </StepIndicator>

              <div className="p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10 text-xs text-[#8E8A9E] leading-relaxed font-sans">
                <span className="font-extrabold text-violet-400 uppercase tracking-widest block mb-1">🎁 VIP perks:</span>
                Top-performing VIP nodes gain priority pre-sales and tailored customer care nodes.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Leaderboard Miniature render */}
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Rank Badge Render */}
                  <div className="flex justify-between items-center bg-[#050608] border border-violet-500/20 p-3 rounded-xl">
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-slate-500 block">Personal Level Rank</span>
                      <span className="text-xs font-black text-white italic font-serif">Horizon Gold Core</span>
                    </div>
                    <span className="px-2.5 py-1 text-[8px] bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded font-black">Level 04</span>
                  </div>

                  {/* Leaderboard Table Mock */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Top Network Operators</span>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-violet-500/10 to-transparent rounded-lg text-[10px]">
                        <span className="text-white font-bold">1st. Operator_TRX</span>
                        <span className="text-[#009e42]">$148,500 Locked</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white/[0.01] rounded-lg text-[10px] text-slate-400">
                        <span>2nd. Captain_CGA</span>
                        <span>$94,100 Locked</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white/[0.01] rounded-lg text-[10px] text-slate-400">
                        <span>3rd. CGA_Master</span>
                        <span>$82,400 Locked</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. TWN TOKEN */}
        <div ref={sectionRefs.twn} className="scroll-mt-32">
          <SectionHeader 
            badge="Ecosystem Stage 08"
            title="CGA Token Protocol Guide"
            description="Our native utility token operates under dynamic pricing. Value scales programmatically in coordination with ecosystem transaction liquidity metrics."
            icon={<Coins className="text-[#8b5cf6]" size={24} />}
            colorClass="text-indigo-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <StepIndicator step={1} title="Check Token Price Ticker">
                Access the <strong className="text-white">CGA Token</strong> portal inside sidebar navigation.
              </StepIndicator>

              <StepIndicator step={2} title="Understand Real-Time Pricing Fluctuation">
                CGA valuation maintains a dynamic pricing index. <strong className="text-[#009e42] font-black">Your final portfolio balance will automatically adapt up or down</strong> as market indexes refresh.
              </StepIndicator>

              <StepIndicator step={3} title="Swap USDT Into CGA Utility Asset">
                Input your USDT balance, click <strong className="text-[#009e42] font-bold">Trade Tokens</strong>. Conversions commit instantly onto self-contained database timelines.
              </StepIndicator>

              <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/15 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">🏦 Token utility details:</span>
                CGA can be utilized for staking options, premium fee mitigations, and exclusive event access points.
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[500px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* CGA Simulated Swap desk */}
              <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full space-y-4 pt-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-4 shadow-inner relative">
                  
                  {/* Price Banner Display */}
                  <div className="flex justify-between items-center bg-[#050608] border border-[#eff6ff]/10 p-3.5 rounded-xl">
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-slate-500 block">CGA Market Index</span>
                      <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-1">$0.1824 <span className="text-[8px] text-emerald-400">(+14.2% Today)</span></span>
                    </div>
                    <Hotspot size={10} className="top-1 right-1" borderClass="border-[#009e42]" bgClass="bg-[#009e42] animate-ping" />
                  </div>

                  {/* Swap inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative">
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
                      <span className="text-[7.5px] uppercase text-slate-500 block">Spend Balance</span>
                      <div className="text-xs font-bold text-white flex justify-between mt-1">
                        <span>$100.00</span>
                        <span>USDT</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
                      <span className="text-[7.5px] uppercase text-slate-500 block">You Receive</span>
                      <div className="text-xs font-bold text-[#009e42] flex justify-between mt-1">
                        <span>548.24</span>
                        <span>CGA</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing dynamic sync alert */}
                  <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[9px] text-[#8E8A9E]">
                    ⚠️ <strong className="text-white">Price Volatility Sync:</strong> Token assets evaluate dynamically. Adjustments reflect in overall portfolio metrics instantaneously.
                  </div>

                  {/* Swap Executer button */}
                  <button className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg relative flex items-center justify-center gap-1">
                    <Coins size={12} /> Convert USDT to CGA Protocol
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 9. SUPPORT HELPLINE */}
        <div ref={sectionRefs.support} className="scroll-mt-32">
          <SectionHeader 
            badge="Communication Stage 09"
            title="How to Secure Official Support"
            description="Our priority response operators are available continually across direct channels. Open support tickets, launch live helpdesk nodes, or chat with AI."
            icon={<HelpCircle className="text-cyan-400" size={24} />}
            colorClass="text-cyan-400"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-5 space-y-6">
              <StepIndicator step={1} title="Select Direct Helpline Channel">
                Access the left-hand navigation sidebar or click <strong className="text-white">Support</strong>.
              </StepIndicator>

              <StepIndicator step={2} title="Pick WhatsApp Node Operator">
                Choose emergency operator lines (US lines or specialized West African Quick Response lines).
              </StepIndicator>

              <StepIndicator step={3} title="Use Live AI Support Desk">
                Engage our specialized conversational AI assistant floating continually on-page for automated calculations.
              </StepIndicator>

              <StepIndicator step={4} title="Dispatch Formal Ledger Tickets">
                Submit comprehensive tickets using our support form. Operators address inquiries within 2–4 hours.
              </StepIndicator>

              <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 text-xs text-[#8E8A9E] leading-relaxed">
                <span className="font-extrabold text-cyan-400 uppercase tracking-widest block mb-1">📬 Official Email Channels:</span>
                - Primary Mail: <code className="text-white select-all">info.tavariwave@team.com</code><br/>
                - Operations: <code className="text-white select-all">tavariwavenetwork@gmail.com</code>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b0c13] border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[540px]">
              <div className="absolute top-3 left-4 text-[10px] uppercase font-black text-[#8E8A9E] tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-[#009e42]" /> Dynamic Visual Mockup</div>

              {/* Support Miniature UI render */}
              <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-[24px] p-5 space-y-3.5 shadow-inner relative">
                  
                  {/* WhatsApp contact Card Mock */}
                  <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">WA</div>
                      <div>
                        <div className="text-[10px] font-black text-white">Direct US Helpline</div>
                        <div className="text-[8px] text-slate-400">+1 (369) 218-0529</div>
                      </div>
                    </div>
                    <ExternalLink size={11} className="text-emerald-400" />
                    <Hotspot size={10} className="top-1 right-1" borderClass="border-red-500" bgClass="bg-red-500" />
                  </div>

                  {/* AI Floating button Mockup */}
                  <div className="flex items-center justify-between p-3.5 bg-[#050608] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#009e42] text-white flex items-center justify-center"><Bot size={16} /></div>
                      <div>
                        <div className="text-[10px] font-black text-white">CGA AI Assistant</div>
                        <div className="text-[8px] text-emerald-400">Online & Ready</div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </div>

                  {/* Traditional ticket dispatcher */}
                  <div className="space-y-1 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Open priority ticket desk</span>
                    <div className="w-full h-1.5 bg-white/5 rounded" />
                    <div className="w-full h-1.5 bg-white/5 rounded" />
                    <button className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white font-black text-[8px] uppercase tracking-widest rounded mt-2 border border-white/10">Dispatch Ticket</button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* F & G. FAQ & Essential Reminders Section */}
      <div className="border-t border-white/5 pt-12 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[#009e42] text-[10px] font-black uppercase tracking-widest">Ecosystem Rules & Standards</span>
          <h2 className="text-2xl lg:text-3xl font-black text-white uppercase italic font-serif">Quick FAQ & Help Tips</h2>
          <p className="text-[#8E8A9E] text-xs">Verify critical operations standards, network requirements, and security rules below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-[#0b0c13] border border-white/5 p-6 rounded-3xl space-y-3 relative">
            <h4 className="text-white font-black text-sm uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="text-[#009e42]" size={16} /> Minimum Ledger requirements
            </h4>
            <p className="text-[#8E8A9E] text-xs leading-relaxed">
              Deposits require a minimum of <strong className="text-white">$10 USDT</strong> sent over the TRON TRC20 network. Double checks network protocols across every stage of processing. Withdrawals require secure authorized addresses.
            </p>
          </div>

          <div className="bg-[#0b0c13] border border-white/5 p-6 rounded-3xl space-y-3 relative">
            <h4 className="text-white font-black text-sm uppercase tracking-wide flex items-center gap-2">
              <Zap className="text-[#009e42]" size={16} /> Yield Calculations Intervals
            </h4>
            <p className="text-[#8E8A9E] text-xs leading-relaxed">
              Ecosystem return variables compound automatically inside live grid architectures and settle straight onto central balances. You can track continuous balances live right from your central dashboard widget.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

/* Simulated Indicator Helpers */
function StepIndicator({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 text-white flex items-center justify-center font-black text-xs shrink-0 font-serif italic">
        {step}
      </div>
      <div className="space-y-1 pt-1">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">{title}</h3>
        <p className="text-[11.5px] leading-relaxed text-[#8E8A9E]">{children}</p>
      </div>
    </div>
  );
}

function SectionHeader({ badge, title, description, icon, colorClass }: { badge: string; title: string; description: string; icon: React.ReactNode; colorClass: string }) {
  return (
    <div className="space-y-3 border-b border-white/5 pb-4">
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border border-white/10 bg-white/5 ${colorClass}`}>
          {badge}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tight font-serif">{title}</h2>
      </div>
      <p className="text-[#8E8A9E] text-xs lg:text-sm leading-relaxed max-w-4xl">{description}</p>
    </div>
  );
}

function Hotspot({ size = 12, className = "", borderClass = "border-red-500", bgClass = "bg-red-500" }: { size?: number; className?: string; borderClass?: string; bgClass?: string }) {
  return (
    <div className={`absolute pointer-events-none z-50 ${className}`}>
      <span className="relative flex h-3 w-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${borderClass} border-2`} />
        <span className={`relative inline-flex rounded-full h-3 w-3 ${bgClass}`} />
      </span>
    </div>
  );
}

function LaserBeamIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
