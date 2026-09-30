import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Bell, 
  Network, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight,
  Globe,
  Share2,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function JoinUs() {

  const communityLinks = [
    {
      title: "WhatsApp Community Group",
      description: "Join the official WhatsApp community for member discussions, general communication, community engagement, networking, meetings and interaction.",
      link: "https://chat.whatsapp.com/HRClWvcFcdiFuN0Hm72Gqi?mode=gi_t",
      buttonText: "Join WhatsApp Group",
      icon: (
        <svg className="w-8 h-8 sm:w-12 sm:h-12 fill-current" viewBox="0 0 24 24">
          <path d="M12.004 2C6.48 2 2 6.48 2 12.001c0 1.73.447 3.42 1.294 4.912L2 22l5.249-1.353c1.442.793 3.078 1.213 4.751 1.214C17.52 21.861 22 17.381 22 11.86c0-2.67-1.04-5.181-2.93-7.071c-1.89-1.892-4.4-2.932-7.066-2.932zm0 1.879c2.17 0 4.21.841 5.74 2.371a8.038 8.038 0 0 1 2.371 5.74c0 4.54-3.69 8.23-8.23 8.23a8.237 8.237 0 0 1-4.201-1.155l-.301-.18l-3.111.802.822-3c-.2-.331-.301-.711-.301-1.1c0-4.54 3.7-8.23 8.23-8.221z" />
        </svg>
      ),
      benefits: ["Real-time Peer Networking", "Community Meetings", "Interactive General Group Chat"],
      colorTheme: {
        bg: "from-emerald-500/10 to-transparent",
        border: "hover:border-emerald-500/30",
        accent: "#25D366",
        buttonStyle: "bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 hover:shadow-emerald-500/20",
        iconStyle: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      }
    },
    {
      title: "Telegram Discussion Group",
      description: "Join the Telegram discussion group for community conversations, networking, meetings, user interaction, and member support discussions.",
      link: "https://tevariwavegroup2", // fallbacks
      buttonText: "Join Telegram Group",
      icon: (
        <svg className="w-8 h-8 sm:w-12 sm:h-12 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.21.21 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12a.41.41 0 0 1 .12.28c0 .08-.01.17-.02.26z" />
        </svg>
      ),
      benefits: ["Direct Telegram Conversations", "Networking & Collaboration", "Support Q&A Panels"],
      colorTheme: {
        bg: "from-sky-500/10 to-transparent",
        border: "hover:border-sky-500/30",
        accent: "#0088cc",
        buttonStyle: "bg-sky-500 text-slate-950 font-black hover:bg-sky-400 hover:shadow-sky-500/20",
        iconStyle: "text-sky-400 bg-sky-500/10 border-sky-500/20"
      }
    },
    {
      title: "Official Telegram Channel",
      description: "Follow the official Telegram channel for platform updates, official announcements, product releases, CGA Trades ecosystem news, and important notices.",
      link: "https://t.me/tavariwavenetwork",
      buttonText: "Follow Telegram Channel",
      icon: (
        <svg className="w-8 h-8 sm:w-12 sm:h-12 fill-current" viewBox="0 0 24 24">
          <path d="M11.5 2C5.7 2 1 6.7 1 12.5S5.7 23 11.5 23 22 18.3 22 12.5 17.3 2 11.5 2zm5.3 6.8c-.1 1.4-.7 4.8-1 6.3-.1.7-.4.9-.6.9-.5 0-.9-.3-1.4-.6-.8-.5-1.2-.8-2-1.3-.9-.6-.3-.9.2-1.4l2.4-2.2c.1-.1 0-.2-.1-.2H11c-1.3.8-2.5 1.6-3.7 2.4-.4.2-.7.4-1 .3-.3 0-.9-.2-1.4-.3-.5-.2-.9-.3-.9-.6 0-.2.2-.3.6-.5 2.6-1.1 4.3-1.9 5.2-2.23l5.1-2.12c.1 0 .2-.01.3-.01.1 0 .2.02.3.1.1.06.1.12.1.22l-.2.83z" />
        </svg>
      ),
      benefits: ["Official Broadcast Bulletins", "Security Releases & Notices", "Immediate System Event Feeds"],
      colorTheme: {
        bg: "from-purple-500/10 to-transparent",
        border: "hover:border-purple-500/30",
        accent: "#a855f7",
        buttonStyle: "bg-purple-600 text-white font-black hover:bg-purple-500 hover:shadow-purple-500/20",
        iconStyle: "text-purple-400 bg-purple-500/10 border-purple-500/20"
      }
    }
  ];

  // Fix exact Telegram Group URL per prompt description
  communityLinks[1].link = "https://t.me/tevariwavegroup";

  const benefitsList = [
    {
      title: "Receive Updates Quickly",
      description: "Real-time alerts, prompt system maintenance memos, and early access to upcoming ecosystem announcements directly from official sources.",
      icon: <Bell className="text-emerald-400" size={18} />
    },
    {
      title: "Connect with Members",
      description: "Collaborate, network, and form connections with institutional-grade and retail digital miners across continental boundaries.",
      icon: <Users className="text-[#00E5FF]" size={18} />
    },
    {
      title: "Learn Platform Features",
      description: "Gain deeper technical mastery over mining allocations, asset custody safeguards, and ROI yield models in live discussion forums.",
      icon: <Zap className="text-amber-400" size={18} />
    },
    {
      title: "Stay Informed",
      description: "Educate yourself consistently on new financial policies, secure ledger practices, and the long-term strategic map of CGA Trades assets.",
      icon: <Network className="text-purple-400" size={18} />
    },
    {
      title: "Participate in Discussions",
      description: "Express network-wide suggestions, contribute valuable insights, and interact organically with support developers in open chats.",
      icon: <MessageSquare className="text-rose-400" size={18} />
    },
    {
      title: "Access Announcements First",
      description: "Get immediate announcements of crucial network changes, audit approvals, node rewards distribution, and new plan openings.",
      icon: <ShieldCheck className="text-teal-400" size={18} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#05060f] text-white selection:bg-purple-500/30 relative pb-32 overflow-hidden">
      {/* Background ambient decorative mesh */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 blur-[180px] rounded-full pointer-events-none" />

      {/* FULL-WIDTH HEADER / HERO BAR */}
      <div className="w-full bg-gradient-to-b from-[#0a0c20]/60 via-[#070817]/40 to-[#05060f] border-b border-white/5 pt-28 pb-12 sm:pb-16 px-4 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto text-center space-y-4 md:space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[9px] font-black tracking-widest uppercase"
          >
            <Globe size={11} className="text-purple-400 animate-[spin_8s_linear_infinite]" />
            Official Community Hub
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight italic font-sans max-w-4xl mx-auto leading-tight"
          >
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#00E5FF] to-purple-500">CGA Trades</span> Community
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[11px] sm:text-xs md:text-sm text-[#8E8A9E] leading-relaxed font-medium max-w-2xl mx-auto"
          >
            Connect with fellow members, participate in discussions, receive important updates, and stay informed about everything happening across the CGA Trades ecosystem.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-12 space-y-16">

        {/* SECTION: THE THREE COMMUNITY HUB CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-sm md:max-w-none mx-auto w-full">
          {communityLinks.map((comm, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className={cn(
                "relative group rounded-3xl md:rounded-[28px] border border-white/10 p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:md:-translate-y-2 hover:md:shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden bg-gradient-to-b w-full",
                comm.colorTheme.bg,
                comm.colorTheme.border
              )}
            >
              {/* Outer Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full" style={{ backgroundColor: comm.colorTheme.accent, opacity: 0.08 }} />
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Visual Icon Element */}
                <div className="flex md:flex-row md:justify-between flex-col items-center justify-center gap-4 md:gap-0">
                  <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[20px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 shrink-0", comm.colorTheme.iconStyle)}>
                    {comm.icon}
                  </div>
                  <Share2 size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors pointer-events-none hidden md:block" />
                </div>

                {/* Card Title & Description */}
                <div className="space-y-2 sm:space-y-3 text-center md:text-left">
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide group-hover:text-white transition-colors">
                    {comm.title}
                  </h3>
                  <p className="text-[10.5px] sm:text-[11px] text-[#8E8A9E] leading-relaxed">
                    {comm.description}
                  </p>
                </div>

                {/* Benefits Bulletpoints */}
                <div className="pt-2.5 border-t border-white/5 space-y-1.5 flex flex-col items-center md:items-start w-full">
                  <p className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Group Focus Benefits</p>
                  {comm.benefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-slate-300 font-semibold text-center md:text-left">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: comm.colorTheme.accent }} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 sm:pt-8 w-full">
                <a 
                  href={comm.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.13em] shadow-lg transition-all duration-300 active:scale-95",
                    comm.colorTheme.buttonStyle
                  )}
                >
                  <span>{comm.buttonText}</span>
                  <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* THE BENEFITS SECTION */}
        <div className="space-y-10 pt-10">
          <div className="text-center space-y-3">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider italic font-sans text-white">
              Why Join CGA Trades Community?
            </h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-[#8E8A9E]">
              Ecosystem Advantages & Group Engagement Priorities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitsList.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:border-white/10 transition-colors"
              >
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl shrink-0 flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                    {benefit.title}
                  </h4>
                  <p className="text-[10px] text-[#8E8A9E] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECURITY CARD NOTICE PANEL */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 border border-red-500/10 rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4 sm:gap-6 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center text-red-400">
              <Lock size={20} />
            </div>
            <div className="space-y-1 max-w-xl">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 font-sans">
                Official Security & Protection advisory
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                CGA Trades support agents and administrators will <strong className="text-white">NEVER</strong> message you first requesting passwords, private keys, deposit PINs, or asking you to wire funds outside safe designated channels. Stay alert.
              </p>
            </div>
          </div>
          <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-black tracking-widest text-[8px] uppercase">
            Shield Enabled
          </div>
        </motion.div>

      </div>
    </div>
  );
}

