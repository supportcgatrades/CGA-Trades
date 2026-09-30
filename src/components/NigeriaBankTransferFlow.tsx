import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RefreshCw, Copy, Check, ArrowRight } from 'lucide-react';
import { NIGERIA_BANK_ACCOUNTS } from '../services/paymentRouting';

const OPAY_LOGO_URL = 'https://i.imgur.com/1zGTCnh.png';
const MONIEPOINT_LOGO_URL = 'https://i.imgur.com/qbGACzm.png';

interface NigeriaBankTransferFlowProps {
  amountUsd: number;
  exchangeRate: number;
  nigeriaBankIndex: number | null;
  onSelectBankIndex: (index: number | null) => void;
  onBackToMethodSelect: () => void;
  transactionReference: string;
  onTransactionReferenceChange: (val: string) => void;
  copiedField: string | null;
  onCopy: (text: string, fieldId: string) => void;
  amountLabel?: string;
  submitButton?: React.ReactNode;
}

export const NigeriaBankTransferFlow: React.FC<NigeriaBankTransferFlowProps> = ({
  amountUsd,
  exchangeRate,
  nigeriaBankIndex,
  onSelectBankIndex,
  onBackToMethodSelect,
  transactionReference,
  onTransactionReferenceChange,
  copiedField,
  onCopy,
  amountLabel = "Amount to invest:",
  submitButton
}) => {
  const [flipDirection, setFlipDirection] = useState<'right' | 'left'>('right');

  // SCREEN 1: BANK ACCOUNT SELECTION (When no bank has been chosen yet)
  if (nigeriaBankIndex === null) {
    return (
      <motion.div
        key="bank-account-selection"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="space-y-4 pt-1"
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <button
            type="button"
            onClick={onBackToMethodSelect}
            className="flex items-center gap-1.5 text-xs font-bold text-aura-muted hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white/5"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-aura-muted">
            Bank Transfer
          </span>
        </div>

        <div className="text-center py-2">
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            Choose Bank Account
          </h3>
        </div>

        {/* Exactly TWO bank account choices */}
        <div className="space-y-3 pt-1">
          {/* Choice 1: Opay */}
          <button
            type="button"
            onClick={() => onSelectBankIndex(0)}
            className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#1DCF9F]/60 transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shrink-0">
                <img 
                  src={OPAY_LOGO_URL} 
                  alt="Opay" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="text-base font-bold text-white">Opay</span>
            </div>
            <ArrowRight size={18} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          {/* Choice 2: Moniepoint */}
          <button
            type="button"
            onClick={() => onSelectBankIndex(1)}
            className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#0357EE]/60 transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shrink-0">
                <img 
                  src={MONIEPOINT_LOGO_URL} 
                  alt="Moniepoint" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="text-base font-bold text-white">Moniepoint</span>
            </div>
            <ArrowRight size={18} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </motion.div>
    );
  }

  // SCREEN 2: SELECTED BANK ACCOUNT DETAILS WITH SMOOTH 3D FLIP TRANSITION
  const currentBank = NIGERIA_BANK_ACCOUNTS[nigeriaBankIndex] || NIGERIA_BANK_ACCOUNTS[0];
  const ngnEquivalent = Math.round(amountUsd * exchangeRate);
  const isOPay = currentBank.id === 'opay';
  const brandColor = isOPay ? '#1DCF9F' : '#0357EE';

  const handleChangeBank = () => {
    setFlipDirection(prev => (prev === 'right' ? 'left' : 'right'));
    onSelectBankIndex(nigeriaBankIndex === 0 ? 1 : 0);
  };

  return (
    <div className="space-y-4 pt-1">
      {/* Top Navigation: Back returns to bank selection, Change flips to other bank */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => onSelectBankIndex(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-aura-muted hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white/5"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleChangeBank}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border text-xs font-bold transition-all cursor-pointer ${
            isOPay 
              ? 'border-white/10 hover:border-[#1DCF9F]/40 text-[#1DCF9F] hover:text-white' 
              : 'border-white/10 hover:border-[#0357EE]/40 text-[#4D8EFF] hover:text-white'
          }`}
          title="Switch to other bank account"
        >
          <RefreshCw size={13} className={isOPay ? 'text-[#1DCF9F]' : 'text-[#4D8EFF]'} />
          <span>Change</span>
        </button>
      </div>

      {/* Plain Distinctive Text Summary for Amount, Equivalent, and Official Rate (Not on a card) */}
      <div className="space-y-1.5 py-0.5 px-1">
        <div className="flex justify-between items-center">
          <span className="text-aura-muted uppercase tracking-wider font-bold text-[10px]">{amountLabel}</span>
          <span className="text-white font-mono font-bold text-xs">${amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-aura-muted uppercase tracking-wider font-bold text-[10px]">Equivalent in NGN:</span>
          <span 
            className="font-mono font-black text-sm"
            style={{ color: isOPay ? '#1DCF9F' : '#4D8EFF' }}
          >
            ₦{ngnEquivalent.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-aura-muted">
          <span>Official Rate:</span>
          <span className="text-white/70 font-semibold">$1.00 = ₦{exchangeRate.toLocaleString()}</span>
        </div>
      </div>

      {/* 3D Flipping Bank Account Details Card (Only bank details are on a card) */}
      <div style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentBank.id}
            initial={{ 
              rotateY: flipDirection === 'right' ? 90 : -90, 
              opacity: 0 
            }}
            animate={{ 
              rotateY: 0, 
              opacity: 1 
            }}
            exit={{ 
              rotateY: flipDirection === 'right' ? -90 : 90, 
              opacity: 0 
            }}
            transition={{ 
              duration: 0.35, 
              ease: [0.4, 0.0, 0.2, 1] 
            }}
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
            className={`p-5 rounded-2xl space-y-3 border transition-colors ${
              isOPay
                ? 'bg-black/40 border-[#1DCF9F]/30 shadow-[0_10px_30px_rgba(29,207,159,0.08)]'
                : 'bg-black/40 border-[#0357EE]/35 shadow-[0_10px_30px_rgba(3,87,238,0.08)]'
            }`}
          >
            {/* Header of Bank Card: Bank Name Label + Distinct Brand Logo & Name */}
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-widest font-black text-aura-muted">
                Bank Name
              </span>
              
              {isOPay ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={OPAY_LOGO_URL} 
                    alt="OPay" 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0" 
                  />
                  <span className="text-xs sm:text-sm font-black text-[#1DCF9F] tracking-wide">
                    OPay
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <img 
                    src={MONIEPOINT_LOGO_URL} 
                    alt="Moniepoint" 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0" 
                  />
                  <span className="text-xs sm:text-sm font-black text-[#0357EE] dark:text-[#4D8EFF] tracking-wide">
                    Moniepoint
                  </span>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="space-y-2.5 pt-1">
              {/* Account Number */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-aura-muted uppercase font-bold">Account Number:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-black text-white tracking-wider">
                    {currentBank.accountNumber}
                  </code>
                  <button
                    type="button"
                    onClick={() => onCopy(currentBank.accountNumber, `acc_${currentBank.id}`)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-aura-muted hover:text-white transition-all cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedField === `acc_${currentBank.id}` ? (
                      <Check size={14} className={isOPay ? "text-[#1DCF9F]" : "text-[#4D8EFF]"} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-aura-muted uppercase font-bold">Account Name:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-white/90 text-right">
                    {currentBank.accountName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(currentBank.accountName, `name_${currentBank.id}`)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-aura-muted hover:text-white transition-all cursor-pointer"
                    title="Copy Account Name"
                  >
                    {copiedField === `name_${currentBank.id}` ? (
                      <Check size={14} className={isOPay ? "text-[#1DCF9F]" : "text-[#4D8EFF]"} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exact Transfer Amount Notice */}
      <div className="space-y-3">
        <div className="p-3 bg-orange-500/10 border border-orange-500/25 rounded-xl text-center">
          <p className="text-xs font-black tracking-wide text-orange-400">
            Transfer this exact amount: <span className="text-white font-mono">₦{ngnEquivalent.toLocaleString()}</span>
          </p>
        </div>

        {/* Transaction Reference Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">
            Transaction Reference / Sender Account Name
          </label>
          <input 
            type="text"
            value={transactionReference}
            onChange={(e) => onTransactionReferenceChange(e.target.value)}
            placeholder="Input Sender Name or Session Reference ID"
            className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none transition-all text-white ${
              isOPay ? 'focus:border-[#1DCF9F]' : 'focus:border-[#0357EE]'
            }`}
          />
        </div>
      </div>

      {/* Optional Submit Button */}
      {submitButton}
    </div>
  );
};
