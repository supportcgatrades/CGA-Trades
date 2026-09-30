import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  HelpCircle,
  QrCode,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { contributeToRetirement, fundRetirementWithCrypto } from '../../services/retirementService';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

interface RetirementContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRetirementBalance: number;
}

const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

export default function RetirementContributeModal({
  isOpen,
  onClose,
  currentRetirementBalance
}: RetirementContributeModalProps) {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();

  // Selected Option: null = Selection screen; 'balance' = Option 1; 'crypto' = Option 2; 'request' = Option 3
  const [selectedOption, setSelectedOption] = useState<'balance' | 'crypto' | 'request' | null>(null);

  // Available Balance Flow State
  const [balanceAmount, setBalanceAmount] = useState<string>('1000');
  const [isBalanceConfirming, setIsBalanceConfirming] = useState<boolean>(false);
  const [balanceSubmitting, setBalanceSubmitting] = useState<boolean>(false);

  // Crypto Flow State
  const [cryptoCurrency, setCryptoCurrency] = useState<'usdt' | 'btc'>('usdt');
  const [cryptoAmountUsd, setCryptoAmountUsd] = useState<string>('1000');
  const [cryptoTxHash, setCryptoTxHash] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [cryptoSubmitting, setCryptoSubmitting] = useState<boolean>(false);

  // Request an Account Flow State
  const [requestDetails, setRequestDetails] = useState({
    institution: '',
    estimatedTransfer: '50000',
    notes: ''
  });
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const availableBalance = Number(profile?.available_balance || 0);
  const numBalanceAmount = parseFloat(balanceAmount) || 0;
  const remainingAvailable = Math.max(0, availableBalance - numBalanceAmount);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBalanceSubmit = async () => {
    if (numBalanceAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (numBalanceAmount > availableBalance) {
      toast.error('Amount exceeds your available CGA balance.');
      return;
    }
    if (!user) return;

    try {
      setBalanceSubmitting(true);
      await contributeToRetirement(user.uid, numBalanceAmount, 'available_balance');
      toast.success(`Successfully funded 401(k) with $${numBalanceAmount.toLocaleString()}!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Contribution failed.');
    } finally {
      setBalanceSubmitting(false);
    }
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(cryptoAmountUsd) || 0;
    if (numAmount <= 0) {
      toast.error('Please enter a valid USD amount.');
      return;
    }
    if (!user) return;

    try {
      setCryptoSubmitting(true);
      await fundRetirementWithCrypto(user.uid, cryptoCurrency, numAmount, cryptoTxHash);
      toast.success(`Crypto funding receipt logged for $${numAmount.toLocaleString()}!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Funding failed.');
    } finally {
      setCryptoSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden my-auto transition-colors ${
          isDark ? 'bg-[#0b1021] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Fund 401(k)</h2>
              <p className="text-[11px] text-muted-foreground">Select a funding source</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* OPTION SELECTION SCREEN */}
          {selectedOption === null && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Choose how you would like to fund your 401(k) retirement balance:
              </p>

              {/* Option 1: Available Balance */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-white/[0.02] border-white/10 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground block">Option 1: Available Balance</span>
                    <p className="text-xs text-muted-foreground">
                      Use funds available in your CGA balance.
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-400 pt-1">
                      Available: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOption('balance')}
                    className="py-2 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    Continue
                  </button>
                </div>
              </div>

              {/* Option 2: Crypto */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-white/[0.02] border-white/10 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground block">Option 2: Crypto</span>
                    <p className="text-xs text-muted-foreground">
                      Fund your 401(k) using an available cryptocurrency payment method.
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground pt-1">
                      Supported: Bitcoin (BTC) & USDT (TRC20)
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOption('crypto')}
                    className="py-2 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    Continue
                  </button>
                </div>
              </div>

              {/* Option 3: Request an Account */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground block">Option 3: Request an Account</span>
                    <p className="text-xs text-muted-foreground">
                      Initiate a 401(k) rollover, corporate sponsor transfer, or custom institutional account setup.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOption('request')}
                    className={`py-2 px-4 rounded-xl font-semibold text-xs border transition-all shrink-0 cursor-pointer ${
                      isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    Request an Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 1: AVAILABLE BALANCE FLOW */}
          {selectedOption === 'balance' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Funding Source</span>
                  <h3 className="text-sm font-bold text-foreground">CGA Available Balance</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedOption(null); setIsBalanceConfirming(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {!isBalanceConfirming ? (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-xs text-muted-foreground block mb-1">Available Balance</span>
                    <span className="text-xl font-black text-foreground">
                      ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Amount to Invest ($)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={availableBalance}
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="Enter amount"
                      className={`w-full px-3.5 py-3 rounded-xl border text-base font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Calculations breakdown as required by Prompt 17 */}
                  <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">401(k) Investment:</span>
                      <span className="font-bold text-emerald-400">${numBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Remaining Available Balance:</span>
                      <span className="font-bold text-foreground">${remainingAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={numBalanceAmount <= 0 || numBalanceAmount > availableBalance}
                      onClick={() => setIsBalanceConfirming(true)}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmation Screen */
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/60 border-emerald-200'
                  }`}>
                    <span className="text-xs font-bold text-emerald-400 block">Confirm 401(k) Funding</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Funding Source:</span>
                        <span className="font-semibold text-foreground">CGA Available Balance</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transfer Amount:</span>
                        <span className="font-bold text-emerald-400">${numBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining Balance:</span>
                        <span className="font-semibold text-foreground">${remainingAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBalanceConfirming(false)}
                      className={`py-3 px-5 rounded-xl font-semibold text-xs border transition-colors ${
                        isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={balanceSubmitting}
                      onClick={handleBalanceSubmit}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {balanceSubmitting ? 'Transferring...' : 'Confirm & Fund 401(k)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OPTION 2: CRYPTO FLOW */}
          {selectedOption === 'crypto' && (
            <form onSubmit={handleCryptoSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Funding Source</span>
                  <h3 className="text-sm font-bold text-foreground">Cryptocurrency</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOption(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Currency Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCryptoCurrency('usdt')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    cryptoCurrency === 'usdt'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  USDT (TRC20)
                </button>
                <button
                  type="button"
                  onClick={() => setCryptoCurrency('btc')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    cryptoCurrency === 'btc'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  Bitcoin (BTC)
                </button>
              </div>

              {/* QR Code and Address */}
              <div className={`p-4 rounded-2xl border text-center space-y-3 ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="p-3 bg-white rounded-xl inline-block shadow-sm">
                  <QRCodeCanvas
                    value={CRYPTO_ADDRESSES[cryptoCurrency]}
                    size={140}
                    level="H"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">
                    Deposit Address ({cryptoCurrency === 'btc' ? 'Bitcoin' : 'TRC20'}):
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xs font-bold break-all max-w-[280px]">
                      {CRYPTO_ADDRESSES[cryptoCurrency]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(CRYPTO_ADDRESSES[cryptoCurrency])}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors shrink-0"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount and TxHash */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Estimated USD Value ($)</label>
                  <input
                    type="number"
                    min={50}
                    value={cryptoAmountUsd}
                    onChange={(e) => setCryptoAmountUsd(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Transaction Hash / Ref (Optional)</label>
                  <input
                    type="text"
                    value={cryptoTxHash}
                    onChange={(e) => setCryptoTxHash(e.target.value)}
                    placeholder="e.g. 0x..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cryptoSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cryptoSubmitting ? 'Logging Payment...' : 'I Have Made the Crypto Transfer'}
                </button>
              </div>
            </form>
          )}

          {/* OPTION 3: REQUEST AN ACCOUNT */}
          {selectedOption === 'request' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Funding Option</span>
                  <h3 className="text-sm font-bold text-foreground">Request an Account / Rollover</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOption(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {!requestSubmitted ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Transfer an existing 401(k), 403(b), or traditional IRA into CGA Institutional Custody with zero tax penalties.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Current Custodian / Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. Fidelity, Vanguard, Charles Schwab"
                      value={requestDetails.institution}
                      onChange={(e) => setRequestDetails(prev => ({ ...prev, institution: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Estimated Rollover Amount ($)</label>
                    <input
                      type="number"
                      value={requestDetails.estimatedTransfer}
                      onChange={(e) => setRequestDetails(prev => ({ ...prev, estimatedTransfer: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes / Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Any specific instructions..."
                      value={requestDetails.notes}
                      onChange={(e) => setRequestDetails(prev => ({ ...prev, notes: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestSubmitted(true);
                        toast.success('Your institutional account request has been received!');
                      }}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Submit Account Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-base font-bold text-foreground">Request Received</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Our institutional onboarding desk will review your rollover request and contact your email with wire and transfer instructions.
                  </p>
                  <button
                    onClick={onClose}
                    className="py-2.5 px-6 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
