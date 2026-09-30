import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  BookOpen, 
  Calculator, 
  PlusCircle, 
  ArrowUpRight, 
  Sparkles,
  DollarSign,
  Landmark
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  RetirementAccount, 
  RetirementInvestment, 
  RetirementBonus, 
  RetirementTransaction,
  RetirementInvestmentOption,
  subscribeRetirementAccount,
  subscribeRetirementInvestments,
  subscribeRetirementBonuses,
  subscribeRetirementTransactions
} from '../../services/retirementService';

import RetirementLanding from './RetirementLanding';
import RetirementDashboard from './RetirementDashboard';
import RetirementPortfolio from './RetirementPortfolio';
import RetirementTransactions from './RetirementTransactions';
import RetirementEducation from './RetirementEducation';
import RetirementCalculator from './RetirementCalculator';
import OpenAccountModal from './OpenAccountModal';
import RetirementContributeModal from './RetirementContributeModal';
import RetirementInvestModal from './RetirementInvestModal';
import RetirementWithdrawModal from './RetirementWithdrawModal';

export type RetirementTab = 'overview' | 'portfolio' | 'history' | 'education' | 'calculator';

export default function Retirement() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as RetirementTab) || 'overview';
  const [activeTab, setActiveTab] = useState<RetirementTab>(tabParam);

  // Firestore Real-time States
  const [account, setAccount] = useState<RetirementAccount | null>(null);
  const [investments, setInvestments] = useState<RetirementInvestment[]>([]);
  const [bonuses, setBonuses] = useState<RetirementBonus[]>([]);
  const [transactions, setTransactions] = useState<RetirementTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isOpenAccountOpen, setIsOpenAccountOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedInvestOption, setSelectedInvestOption] = useState<RetirementInvestmentOption | undefined>(undefined);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: RetirementTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Subscribe to isolated retirement data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubAccount = subscribeRetirementAccount(
      user.uid,
      (acc) => {
        setAccount(acc);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubInvestments = subscribeRetirementInvestments(
      user.uid,
      (invs) => setInvestments(invs)
    );

    const unsubBonuses = subscribeRetirementBonuses(
      user.uid,
      (b) => setBonuses(b)
    );

    const unsubTransactions = subscribeRetirementTransactions(
      user.uid,
      (txs) => setTransactions(txs)
    );

    return () => {
      unsubAccount();
      unsubInvestments();
      unsubBonuses();
      unsubTransactions();
    };
  }, [user]);

  const handleOpenInvest = (option?: RetirementInvestmentOption) => {
    if (!account) {
      setIsOpenAccountOpen(true);
      return;
    }
    setSelectedInvestOption(option);
    setIsInvestOpen(true);
  };

  const handleOpenContribute = () => {
    if (!account) {
      setIsOpenAccountOpen(true);
      return;
    }
    setIsContributeOpen(true);
  };

  const handleOpenWithdraw = () => {
    if (!account) {
      setIsOpenAccountOpen(true);
      return;
    }
    setIsWithdrawOpen(true);
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Top Header: Section 5 Specification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            401(k) Account
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dedicated long-term wealth building with 20% annual CGA platform bonus.
          </p>
        </div>

        {/* Global Action Button if account exists */}
        {account && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenContribute}
              className="py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Fund 401(k)</span>
            </button>
            <button
              onClick={() => handleOpenInvest()}
              className={`py-2.5 px-3.5 rounded-xl font-semibold text-xs border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Invest</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto scrollbar-hide ${
        isDark ? 'bg-[#0b1021]/90 border-white/10' : 'bg-slate-100 border-slate-200'
      }`}>
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'portfolio', label: 'Investments', icon: TrendingUp, badge: investments.length > 0 ? investments.length : undefined },
          { id: 'history', label: 'Ledger History', icon: History },
          { id: 'education', label: 'How It Works', icon: BookOpen },
          { id: 'calculator', label: 'Goal Calculator', icon: Calculator }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as RetirementTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} className={isActive && isDark ? 'text-black' : isActive ? 'text-emerald-500' : ''} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading retirement records...</p>
        </div>
      ) : (
        <div>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            account ? (
              <RetirementDashboard
                account={account}
                investments={investments}
                bonuses={bonuses}
                transactions={transactions}
                onOpenContribute={handleOpenContribute}
                onOpenInvest={() => handleOpenInvest()}
                onOpenWithdraw={handleOpenWithdraw}
                onSwitchTab={(t) => handleTabChange(t as RetirementTab)}
              />
            ) : (
              <RetirementLanding
                onOpenAccount={() => setIsOpenAccountOpen(true)}
                onExploreHowItWorks={() => handleTabChange('education')}
              />
            )
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            <RetirementPortfolio
              investments={investments}
              availableCash={Number(account?.currentBalance || 0)}
              onOpenInvest={handleOpenInvest}
              onOpenContribute={handleOpenContribute}
            />
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <RetirementTransactions transactions={transactions} />
          )}

          {/* EDUCATION & HOW IT WORKS TAB */}
          {activeTab === 'education' && (
            <RetirementEducation />
          )}

          {/* CALCULATOR TAB */}
          {activeTab === 'calculator' && (
            <RetirementCalculator initialBalance={Number(account?.currentBalance || 0) + Number(account?.investmentValue || 0) || 10000} />
          )}
        </div>
      )}

      {/* MODALS */}
      <OpenAccountModal
        isOpen={isOpenAccountOpen}
        onClose={() => setIsOpenAccountOpen(false)}
        onAccountCreated={(acc) => {
          setAccount(acc);
          setIsOpenAccountOpen(false);
        }}
      />

      <RetirementContributeModal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        currentRetirementBalance={Number(account?.currentBalance || 0)}
      />

      <RetirementInvestModal
        isOpen={isInvestOpen}
        onClose={() => setIsInvestOpen(false)}
        availableRetirementCash={Number(account?.currentBalance || 0)}
        initialOption={selectedInvestOption}
      />

      <RetirementWithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableCash={Number(account?.currentBalance || 0)}
      />
    </div>
  );
}
