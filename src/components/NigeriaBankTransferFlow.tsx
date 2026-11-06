import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Copy, Check } from 'lucide-react';
import { NIGERIA_BANK_ACCOUNTS } from '../services/paymentRouting';

const OPAY_LOGO_URL = 'https://i.imgur.com/1zGTCnh.png';

interface NigeriaBankTransferFlowProps {
  amountUsd: number;
  exchangeRate: number;
  nigeriaBankIndex?: number | null;
  onSelectBankIndex?: (index: number | null) => void;
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
  onBackToMethodSelect,
  transactionReference,
  onTransactionReferenceChange,
  copiedField,
  onCopy,
  amountLabel = "Amount to invest:",
  submitButton
}) => {
  // Authoritative Nigerian Bank Provider: OPay only
  const currentBank = NIGERIA_BANK_ACCOUNTS[0] || {
    id: 'opay',
    bankName: 'Opay',
    accountNumber: '6550002094',
    accountName: 'TAVARI WAVE NETWORK/CGA TRADES'
  };

  const ngnEquivalent = Math.round(amountUsd * exchangeRate);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 pt-1"
    >
      {/* Top Navigation: Back returns to payment method selection */}
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <button
          type="button"
          onClick={onBackToMethodSelect}
          className="flex items-center gap-1.5 text-xs font-bold text-aura-muted hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white/5"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <span className="text-[10px] font-black uppercase tracking-widest text-[#1DCF9F]">
          OPay Transfer
        </span>
      </div>

      {/* Plain Distinctive Text Summary for Amount, Equivalent, and Official Rate */}
      <div className="space-y-1.5 py-0.5 px-1">
        <div className="flex justify-between items-center">
          <span className="text-aura-muted uppercase tracking-wider font-bold text-[10px]">{amountLabel}</span>
          <span className="text-white font-mono font-bold text-xs">${amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-aura-muted uppercase tracking-wider font-bold text-[10px]">Equivalent in NGN:</span>
          <span 
            className="font-mono font-black text-sm text-[#1DCF9F]"
          >
            ₦{ngnEquivalent.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-aura-muted">
          <span>Official Rate:</span>
          <span className="text-white/70 font-semibold">$1.00 = ₦{exchangeRate.toLocaleString()}</span>
        </div>
      </div>

      {/* OPay Bank Account Details Card */}
      <div className="p-5 rounded-2xl space-y-3 border bg-black/40 border-[#1DCF9F]/30 shadow-[0_10px_30px_rgba(29,207,159,0.08)]">
        {/* Header of Bank Card: Bank Name Label + Distinct Brand Logo & Name */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-widest font-black text-aura-muted">
            Bank Name
          </span>
          
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
                  <Check size={14} className="text-[#1DCF9F]" />
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
                  <Check size={14} className="text-[#1DCF9F]" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
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
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono outline-none transition-all text-white focus:border-[#1DCF9F]"
          />
        </div>
      </div>

      {/* Optional Submit Button */}
      {submitButton}
    </motion.div>
  );
};
