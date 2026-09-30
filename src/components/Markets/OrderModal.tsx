import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  DollarSign,
  TrendingUp,
  Landmark,
  PieChart,
  Info
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  StockAsset, 
  BondAsset, 
  MutualFundAsset, 
  OrderSide, 
  OrderType,
  OrderStatus 
} from '../../services/securitiesData';
import { placeSecuritiesOrder } from '../../services/securitiesOrderService';
import { toast } from 'sonner';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: StockAsset | BondAsset | MutualFundAsset | null;
  initialSide?: OrderSide;
  userHoldingQuantity?: number;
  onOrderSuccess?: () => void;
}

export default function OrderModal({
  isOpen,
  onClose,
  asset,
  initialSide = 'buy',
  userHoldingQuantity = 0,
  onOrderSuccess
}: OrderModalProps) {
  const { user, profile } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [step, setStep] = useState<'configure' | 'review' | 'submitted'>('configure');
  const [side, setSide] = useState<OrderSide>(initialSide);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('1');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState<{
    orderId: string;
    status: OrderStatus;
    totalAmount: number;
    shares: number;
    price: number;
    side: OrderSide;
  } | null>(null);

  // Sync state when asset or initialSide changes
  useEffect(() => {
    if (asset) {
      setSide(initialSide);
      setStep('configure');
      setOrderType('market');
      setQuantity(asset.type === 'bond' ? '1' : asset.type === 'mutual_fund' ? '5' : '1');
      const basePrice = asset.type === 'bond' ? asset.priceDollars : asset.type === 'mutual_fund' ? asset.nav : asset.price;
      setLimitPrice(basePrice.toString());
      setStopPrice((basePrice * 0.95).toFixed(2));
      setOrderReceipt(null);
    }
  }, [asset, initialSide, isOpen]);

  if (!isOpen || !asset) return null;

  const basePrice = asset.type === 'bond' 
    ? asset.priceDollars 
    : asset.type === 'mutual_fund' 
      ? asset.nav 
      : asset.price;

  const parsedQty = parseFloat(quantity) || 0;
  const effectivePrice = orderType === 'limit' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : basePrice;
  const estimatedTotal = parseFloat((parsedQty * effectivePrice).toFixed(2));
  const fee = 0; // $0.00 Commission-free institutional execution
  const userCash = profile?.available_balance || 0;

  // Validation
  const hasSufficientCash = side === 'buy' ? userCash >= (estimatedTotal + fee) : true;
  const hasSufficientHoldings = side === 'sell' ? userHoldingQuantity >= parsedQty : true;
  const isValidQuantity = parsedQty > 0;

  const handleProceedToReview = () => {
    if (!isValidQuantity) {
      toast.error('Please enter a valid quantity greater than zero');
      return;
    }
    if (side === 'buy' && !hasSufficientCash) {
      toast.error(`Insufficient available cash balance ($${userCash.toFixed(2)}). Order requires $${estimatedTotal.toFixed(2)}.`);
      return;
    }
    if (side === 'sell' && !hasSufficientHoldings) {
      toast.error(`Insufficient holdings. You own ${userHoldingQuantity} units.`);
      return;
    }
    setStep('review');
  };

  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error('Please sign in to execute orders');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await placeSecuritiesOrder({
        userId: user.uid,
        userName: profile?.name || user.displayName || 'Investor',
        userEmail: user.email || '',
        assetType: asset.type,
        symbol: asset.symbol,
        name: asset.name,
        side,
        orderType,
        quantity: parsedQty,
        price: basePrice,
        limitPrice: orderType === 'limit' || orderType === 'stop_limit' ? parseFloat(limitPrice) : undefined,
        stopPrice: orderType === 'stop' || orderType === 'stop_limit' ? parseFloat(stopPrice) : undefined
      });

      if (res.success && res.orderId) {
        setOrderReceipt({
          orderId: res.orderId,
          status: res.status || 'submitted',
          totalAmount: estimatedTotal,
          shares: parsedQty,
          price: effectivePrice,
          side
        });
        setStep('submitted');
        toast.success(`Order ${side.toUpperCase()} ${asset.symbol} submitted successfully!`);
        if (onOrderSuccess) onOrderSuccess();
      } else {
        toast.error(res.error || 'Failed to submit order');
      }
    } catch (err: any) {
      toast.error(err.message || 'Execution error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={cn(
          "relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 my-8 transition-colors text-left",
          isDark ? "bg-[#0b0e14] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm",
              asset.type === 'stock' ? "bg-blue-500/10 text-blue-400" :
              asset.type === 'bond' ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
            )}>
              {asset.type === 'stock' ? <TrendingUp size={20} /> :
               asset.type === 'bond' ? <Landmark size={20} /> : <PieChart size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black uppercase tracking-tight">{asset.symbol}</span>
                <span className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase",
                  isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-600"
                )}>
                  {asset.type === 'stock' ? asset.exchange : asset.type === 'bond' ? asset.category : 'NAV Fund'}
                </span>
              </div>
              <p className={cn("text-xs truncate max-w-[240px]", isDark ? "text-white/60" : "text-slate-500")}>
                {asset.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-slate-100 text-slate-400"
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: CONFIGURE */}
        {step === 'configure' && (
          <div className="space-y-6">
            {/* Side Tabs: Buy / Sell */}
            <div className={cn("grid grid-cols-2 p-1 rounded-2xl border", isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-100 border-slate-200")}>
              <button
                type="button"
                onClick={() => setSide('buy')}
                className={cn(
                  "py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                  side === 'buy'
                    ? "bg-primary text-white shadow-md"
                    : isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Buy {asset.symbol}
              </button>
              <button
                type="button"
                onClick={() => setSide('sell')}
                className={cn(
                  "py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                  side === 'sell'
                    ? "bg-red-500 text-white shadow-md"
                    : isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Sell {asset.symbol}
              </button>
            </div>

            {/* Price Indicator */}
            <div className={cn("p-4 rounded-2xl border flex items-center justify-between", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
              <div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider block", isDark ? "text-white/50" : "text-slate-400")}>
                  {asset.type === 'bond' ? 'Clean Price per Bond ($1,000 Par)' : asset.type === 'mutual_fund' ? 'Latest NAV per Unit' : 'Current Market Quote'}
                </span>
                <span className="text-xl font-black font-serif italic text-primary">
                  {formatCurrency(basePrice)}
                </span>
              </div>
              <div className="text-right">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider block", isDark ? "text-white/50" : "text-slate-400")}>
                  {side === 'buy' ? 'Available Balance' : 'Current Holdings'}
                </span>
                <span className="text-sm font-mono font-bold">
                  {side === 'buy' ? formatCurrency(userCash) : `${userHoldingQuantity} units`}
                </span>
              </div>
            </div>

            {/* Order Type Selector */}
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest block", isDark ? "text-white/60" : "text-slate-500")}>
                Order Execution Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'market', label: 'Market', desc: 'Instant Best' },
                  { id: 'limit', label: 'Limit', desc: 'Specified' },
                  { id: 'stop', label: 'Stop', desc: 'Trigger' },
                  { id: 'stop_limit', label: 'Stop Limit', desc: 'Protected' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOrderType(t.id as OrderType)}
                    className={cn(
                      "p-2.5 rounded-xl border text-center transition-all text-xs font-bold",
                      orderType === t.id
                        ? "border-primary bg-primary/10 text-primary font-black shadow-sm"
                        : isDark
                          ? "border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.05]"
                          : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <div>{t.label}</div>
                    <div className="text-[9px] font-normal opacity-75">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/60" : "text-slate-500")}>
                  {asset.type === 'bond' ? 'Number of Bonds ($1,000 Face Each)' : 'Quantity (Shares / Units)'}
                </label>
                {side === 'sell' && userHoldingQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantity(userHoldingQuantity.toString())}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    Sell Max ({userHoldingQuantity})
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0.01"
                step={asset.type === 'bond' ? '1' : '0.1'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className={cn(
                  "w-full h-12 px-4 rounded-xl text-base font-mono font-bold border transition-all outline-none",
                  isDark
                    ? "bg-white/[0.04] border-white/10 text-white focus:border-primary"
                    : "bg-white border-slate-200 text-slate-900 focus:border-primary"
                )}
              />
            </div>

            {/* Conditional Limit Price */}
            {(orderType === 'limit' || orderType === 'stop_limit') && (
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/60" : "text-slate-500")}>
                  Limit Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "w-full h-12 px-4 rounded-xl text-base font-mono font-bold border transition-all outline-none",
                    isDark
                      ? "bg-white/[0.04] border-white/10 text-white focus:border-primary"
                      : "bg-white border-slate-200 text-slate-900 focus:border-primary"
                  )}
                />
              </div>
            )}

            {/* Estimated Total Card */}
            <div className={cn("p-4 rounded-2xl border space-y-2", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
              <div className="flex justify-between text-xs">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Estimated Order Value:</span>
                <span className="font-mono font-bold">{formatCurrency(estimatedTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Applicable Platform Fee:</span>
                <span className="font-mono font-bold text-emerald-500">$0.00 (Commission-Free)</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                <span>Estimated Total:</span>
                <span className="font-serif italic font-black text-primary text-base">
                  {formatCurrency(estimatedTotal)}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleProceedToReview}
              className={cn(
                "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98",
                side === 'buy' ? "bg-primary text-white hover:bg-primary/90" : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              <span>Review {side.toUpperCase()} Order</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: REVIEW & CONFIRM */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Order Verification & Execution Disclosure
              </span>
              <h3 className="text-2xl font-black font-serif italic">
                Confirm {side.toUpperCase()} Order
              </h3>
            </div>

            <div className={cn("p-5 rounded-2xl border space-y-3 text-xs", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Security:</span>
                <span className="font-bold">{asset.name} ({asset.symbol})</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Asset Class:</span>
                <span className="font-mono uppercase font-bold">{asset.type}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Order Side:</span>
                <span className={cn("font-bold uppercase", side === 'buy' ? "text-primary" : "text-red-400")}>
                  {side}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Execution Type:</span>
                <span className="font-mono uppercase font-bold">{orderType} Order</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Quantity:</span>
                <span className="font-mono font-bold">{parsedQty} {asset.type === 'bond' ? 'bonds' : 'shares'}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Reference Quote:</span>
                <span className="font-mono font-bold">{formatCurrency(effectivePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Estimated Settlement:</span>
                <span className="font-mono font-bold">T+1 (Next Business Day)</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                <span>Final Order Amount:</span>
                <span className="font-serif italic font-black text-primary text-base">
                  {formatCurrency(estimatedTotal)}
                </span>
              </div>
            </div>

            {/* Disclosures Notice */}
            <div className={cn("p-4 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5", isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900")}>
              <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <p>
                By clicking <strong>Submit Order</strong>, you authorize CGA Markets to execute this {side.toUpperCase()} order according to specified parameters. Market orders are executed at the best prevailing institutional quote. All securities investments involve market risk.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('configure')}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all",
                  isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-100"
                )}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                  side === 'buy' ? "bg-primary text-white hover:bg-primary/90" : "bg-red-500 text-white hover:bg-red-600",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transacting...</span>
                  </>
                ) : (
                  <span>Submit Order</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMITTED RECEIPT */}
        {step === 'submitted' && orderReceipt && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Institutional Order Receipt
              </span>
              <h3 className="text-2xl font-black font-serif italic">
                Order {orderReceipt.status.toUpperCase()}
              </h3>
              <p className={cn("text-xs font-mono", isDark ? "text-white/60" : "text-slate-500")}>
                Reference ID: {orderReceipt.orderId}
              </p>
            </div>

            <div className={cn("p-4 rounded-2xl border text-xs space-y-2 text-left", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Action:</span>
                <span className="font-bold uppercase">{orderReceipt.side} {orderReceipt.shares} {asset.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Execution Price:</span>
                <span className="font-mono font-bold">{formatCurrency(orderReceipt.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Total Transacted:</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(orderReceipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Settlement:</span>
                <span className="font-mono font-bold">Standard T+1 Ledger</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-primary text-white hover:bg-primary/90 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
            >
              Done & Return to Markets
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
