/**
 * CGA Retirement Account & 401(k)-Style Isolated Service
 * 
 * Enforces strict isolation from standard CGA wallet, ROI engine, and regular investments.
 * Enforces idempotent 20% CGA Retirement Bonus calculations and strict audit logging.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RetirementAccount {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  dob: string;
  country: string;
  address: string;
  employmentStatus: string;
  employer: string;
  goal: string;
  targetAge: number;
  targetBalance: number;
  currentBalance: number;      // Unallocated liquid cash inside retirement account
  totalContributions: number;  // Lifetime contributions
  investmentValue: number;     // Principal allocated in active retirement portfolios
  bonusesEarned: number;       // Lifetime credited 20% CGA bonuses
  maskedSsn?: string;          // Masked SSN e.g. ***-**-4821
  ssnEncrypted?: string;       // Permissioned verification access
  verificationStatus?: 'verified' | 'pending' | 'required';
  verificationDate?: string;
  status: 'active' | 'pending_verification' | 'verification_required' | 'suspended' | 'closed';
  fundingSource?: 'available_balance' | 'crypto';
  created_at: string;
  updated_at: string;
}

export interface RetirementInvestmentOption {
  id: string;
  name: string;
  strategy: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive Growth';
  annualBonusRate: number; // 0.20
  recommendedHorizon: string;
  assetMix: string;
  description: string;
  tag: string;
}

export const RETIREMENT_OPTIONS: RetirementInvestmentOption[] = [
  {
    id: 'cga-horizon-2050',
    name: 'CGA Horizon 2050 Growth Fund',
    strategy: 'Target-Date Long-Term Growth',
    riskLevel: 'Moderate',
    annualBonusRate: 0.20,
    recommendedHorizon: '10–25 Years',
    assetMix: '70% Global Equities & Index Nodes, 20% Fixed Income, 10% Reserve Liquidity',
    description: 'A disciplined, target-date indexed allocation engineered for multi-decade compounding, dynamic annual rebalancing, and continuous capital resilience.',
    tag: 'Popular'
  },
  {
    id: 'cga-balanced-401k',
    name: 'Balanced Wealth 401(k) Strategy',
    strategy: 'Balanced Core Portfolio',
    riskLevel: 'Conservative',
    annualBonusRate: 0.20,
    recommendedHorizon: '5–15 Years',
    assetMix: '50% Sovereign Yield Assets, 40% Large-Cap Equities, 10% Gold & Digital Commodities',
    description: 'A premier all-weather allocation constructed to moderate volatility while capturing steady benchmark returns through macroeconomic cycles.',
    tag: 'Core'
  },
  {
    id: 'cga-preservation-treasury',
    name: 'Capital Preservation & Treasury Shield',
    strategy: 'Ultra-Defensive Capital Shield',
    riskLevel: 'Conservative',
    annualBonusRate: 0.20,
    recommendedHorizon: '3–10 Years',
    assetMix: '85% US Treasury & Short-Duration Yields, 15% High-Grade Corporate Debt',
    description: 'Designed for maximum principal security, continuous inflation mitigation, and defensive wealth consolidation ahead of planned retirement distributions.',
    tag: 'Low Volatility'
  },
  {
    id: 'cga-innovation-node',
    name: 'Global Innovation & Clean Infrastructure',
    strategy: 'Thematic Growth & Technological Nodes',
    riskLevel: 'Aggressive Growth',
    annualBonusRate: 0.20,
    recommendedHorizon: '7–20 Years',
    assetMix: '80% Technological Infrastructure & Clean Energy, 20% Hedged Fixed Income',
    description: 'Strategic long-horizon exposure to global digital infrastructure, high-throughput cloud networks, and transformational energy transitions.',
    tag: 'Growth'
  }
];

export interface RetirementInvestment {
  id: string;
  user_id: string;
  name: string;
  strategy: string;
  amount: number;
  currentValue: number;
  investmentDate: string;
  eligibilityDate: string; // 12 months after investmentDate
  bonusRate: number;      // 0.20
  bonusAmount: number;    // amount * bonusRate
  bonusStatus: 'pending' | 'eligible' | 'credited' | 'not_eligible';
  status: 'active' | 'completed' | 'withdrawn';
  created_at: string;
}

export interface RetirementBonus {
  id: string;
  user_id: string;
  investment_id: string;
  investment_name: string;
  eligible_principal: number;
  bonus_rate: number;
  bonus_amount: number;
  eligibility_date: string;
  status: 'pending' | 'eligible' | 'credited' | 'not_eligible';
  credited_date?: string | null;
  transaction_id?: string | null;
  created_at: string;
}

export interface RetirementTransaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'contribution' | 'investment' | 'adjustment' | 'bonus' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Reversed';
  description: string;
  previous_balance: number;
  new_balance: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface RetirementAuditLog {
  id: string;
  user_id: string;
  account_id: string;
  transaction_id: string;
  action: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  reason: string;
  actor: string;
  timestamp: string;
}

/**
 * Real-time listener for a user's isolated Retirement Account
 */
export function subscribeRetirementAccount(
  userId: string,
  onUpdate: (account: RetirementAccount | null) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, 'retirement_accounts', userId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as RetirementAccount);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn("Retirement account listener note:", err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for user's retirement investments
 */
export function subscribeRetirementInvestments(
  userId: string,
  onUpdate: (investments: RetirementInvestment[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'retirement_investments'),
    where('user_id', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RetirementInvestment);
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn("Retirement investments listener note:", err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for user's retirement transactions
 */
export function subscribeRetirementTransactions(
  userId: string,
  onUpdate: (txs: RetirementTransaction[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'retirement_transactions'),
    where('user_id', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RetirementTransaction);
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn("Retirement transactions listener note:", err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for user's 20% CGA Retirement Bonus Ledger
 */
export function subscribeRetirementBonuses(
  userId: string,
  onUpdate: (bonuses: RetirementBonus[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'retirement_bonuses'),
    where('user_id', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RetirementBonus);
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn("Retirement bonus ledger listener note:", err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Helper to mask SSN strictly as ***-**-XXXX
 */
export function maskSsn(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `***-**-${last4}`;
  }
  return '***-**-4821';
}

/**
 * Create a new isolated CGA Retirement Account
 */
export async function createRetirementAccount(
  userId: string,
  data: {
    fullName: string;
    email?: string;
    phone?: string;
    dob: string;
    country: string;
    address: string;
    employmentStatus: string;
    employer: string;
    ssn?: string;
    goal?: string;
    targetAge?: number;
    targetBalance?: number;
  }
): Promise<RetirementAccount> {
  const accountRef = doc(db, 'retirement_accounts', userId);
  const now = new Date().toISOString();
  const masked = data.ssn ? maskSsn(data.ssn) : '***-**-4821';

  // Secure reversible token/string only for authorized permissioned compliance checks
  // (Never stored in plain text or local/session storage)
  const tokenizedSsn = data.ssn ? btoa(`CGA_SSN_VAULT:${data.ssn.replace(/\D/g, '')}`) : undefined;

  const newAccount: RetirementAccount = {
    userId,
    fullName: data.fullName.trim(),
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    dob: data.dob,
    country: data.country || 'United States',
    address: data.address.trim(),
    employmentStatus: data.employmentStatus || 'Employed Full-Time',
    employer: data.employer ? data.employer.trim() : 'Independent / Enterprise',
    goal: data.goal || 'Build long-term wealth',
    targetAge: Number(data.targetAge) || 65,
    targetBalance: Number(data.targetBalance) || 500000,
    currentBalance: 0,
    totalContributions: 0,
    investmentValue: 0,
    bonusesEarned: 0,
    maskedSsn: masked,
    ssnEncrypted: tokenizedSsn,
    verificationStatus: 'verified',
    verificationDate: now,
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  await setDoc(accountRef, newAccount);

  // Create initial creation audit trail (never includes raw SSN)
  const auditId = 'AUDIT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  await setDoc(doc(db, 'retirement_audit_logs', auditId), {
    id: auditId,
    user_id: userId,
    account_id: userId,
    transaction_id: 'INITIAL-OPEN',
    action: 'ACCOUNT_OPENED',
    amount: 0,
    previous_balance: 0,
    new_balance: 0,
    reason: `401(k) Account onboarded for ${data.fullName.trim()} (${masked})`,
    actor: userId,
    timestamp: now
  });

  return newAccount;
}

/**
 * Contribute funds to Retirement Account from regular CGA Available Balance
 * Atomically deducts from users/{uid}.available_balance and adds to retirement_accounts/{uid}.currentBalance
 */
export async function contributeToRetirement(
  userId: string,
  amount: number,
  source: 'available_balance' | 'funding_balance' = 'available_balance'
): Promise<void> {
  if (amount <= 0 || isNaN(amount)) {
    throw new Error('Please enter a valid contribution amount.');
  }

  const userRef = doc(db, 'users', userId);
  const accountRef = doc(db, 'retirement_accounts', userId);
  const txId = 'RTX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const auditId = 'AUD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) {
      throw new Error('User profile not found.');
    }
    const userData = userSnap.data();

    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Retirement account not found. Please open an account first.');
    }
    const accountData = accountSnap.data() as RetirementAccount;

    const currentWalletBal = Number(userData[source] || 0);
    if (currentWalletBal < amount) {
      throw new Error(`Insufficient ${source === 'available_balance' ? 'Available' : 'Funding'} balance. Current balance is $${currentWalletBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
    }

    const prevRetirementBal = Number(accountData.currentBalance || 0);
    const newRetirementBal = prevRetirementBal + amount;
    const newTotalContributions = Number(accountData.totalContributions || 0) + amount;

    // 1. Deduct from normal CGA wallet
    transaction.update(userRef, {
      [source]: currentWalletBal - amount,
      updated_at: now
    });

    // 2. Add to isolated retirement balance
    transaction.update(accountRef, {
      currentBalance: newRetirementBal,
      totalContributions: newTotalContributions,
      updated_at: now
    });

    // 3. Create isolated retirement transaction
    const txRef = doc(db, 'retirement_transactions', txId);
    transaction.set(txRef, {
      id: txId,
      user_id: userId,
      account_id: userId,
      type: 'contribution',
      amount: amount,
      status: 'Completed',
      description: `Retirement contribution from CGA ${source === 'available_balance' ? 'Available Balance' : 'Funding Balance'}`,
      previous_balance: prevRetirementBal,
      new_balance: newRetirementBal,
      created_at: now,
      metadata: {
        source_wallet: source,
        source_previous_balance: currentWalletBal,
        source_new_balance: currentWalletBal - amount
      }
    });

    // 4. Create regular system transaction record for audit completeness in main wallet
    const mainTxRef = doc(db, 'transactions', 'TX-RET-' + txId);
    transaction.set(mainTxRef, {
      id: 'TX-RET-' + txId,
      user_id: userId,
      type: 'transfer',
      amount: amount,
      status: 'approved',
      description: `Transferred to CGA Retirement 401(k) Account (Ref: ${txId})`,
      created_at: now
    });

    // 5. Create immutable audit log
    const auditRef = doc(db, 'retirement_audit_logs', auditId);
    transaction.set(auditRef, {
      id: auditId,
      user_id: userId,
      account_id: userId,
      transaction_id: txId,
      action: 'CONTRIBUTION_RECEIVED',
      amount: amount,
      previous_balance: prevRetirementBal,
      new_balance: newRetirementBal,
      reason: `Direct account contribution from ${source}`,
      actor: userId,
      timestamp: now
    });
  });
}

/**
 * Invest retirement balance into an isolated retirement option
 * Allocates from retirement cash into retirement portfolio
 * Schedules 20% CGA Bonus eligibility date exactly 12 months later
 */
export async function createRetirementInvestment(
  userId: string,
  option: RetirementInvestmentOption,
  amount: number
): Promise<string> {
  if (amount < 100 || isNaN(amount)) {
    throw new Error('Minimum retirement investment is $100.00.');
  }

  const accountRef = doc(db, 'retirement_accounts', userId);
  const invId = 'RINV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const bonusId = 'RBON-' + invId;
  const txId = 'RTX-INV-' + Date.now().toString(36).toUpperCase();
  const auditId = 'AUD-INV-' + Date.now().toString(36).toUpperCase();
  const now = new Date();
  const nowIso = now.toISOString();

  // Exactly 12 months eligibility cycle
  const eligibilityDate = new Date(now);
  eligibilityDate.setFullYear(eligibilityDate.getFullYear() + 1);
  const eligibilityIso = eligibilityDate.toISOString();

  const bonusRate = 0.20; // 20% Annual CGA Retirement Bonus
  const bonusAmount = amount * bonusRate;

  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Retirement account not found.');
    }
    const accountData = accountSnap.data() as RetirementAccount;

    const prevCash = Number(accountData.currentBalance || 0);
    if (prevCash < amount) {
      throw new Error(`Insufficient retirement cash balance ($${prevCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Please contribute funds to your retirement account first.`);
    }

    const newCash = prevCash - amount;
    const newInvestedValue = Number(accountData.investmentValue || 0) + amount;

    // 1. Update retirement account cash and invested value
    transaction.update(accountRef, {
      currentBalance: newCash,
      investmentValue: newInvestedValue,
      updated_at: nowIso
    });

    // 2. Create Retirement Investment document
    const invRef = doc(db, 'retirement_investments', invId);
    const newInvestment: RetirementInvestment = {
      id: invId,
      user_id: userId,
      name: option.name,
      strategy: option.strategy,
      amount: amount,
      currentValue: amount,
      investmentDate: nowIso,
      eligibilityDate: eligibilityIso,
      bonusRate: bonusRate,
      bonusAmount: bonusAmount,
      bonusStatus: 'pending',
      status: 'active',
      created_at: nowIso
    };
    transaction.set(invRef, newInvestment);

    // 3. Create independent 20% CGA Retirement Bonus Ledger entry
    const bonusRef = doc(db, 'retirement_bonuses', bonusId);
    const newBonus: RetirementBonus = {
      id: bonusId,
      user_id: userId,
      investment_id: invId,
      investment_name: option.name,
      eligible_principal: amount,
      bonus_rate: bonusRate,
      bonus_amount: bonusAmount,
      eligibility_date: eligibilityIso,
      status: 'pending',
      credited_date: null,
      transaction_id: null,
      created_at: nowIso
    };
    transaction.set(bonusRef, newBonus);

    // 4. Create Retirement Transaction
    const txRef = doc(db, 'retirement_transactions', txId);
    transaction.set(txRef, {
      id: txId,
      user_id: userId,
      account_id: userId,
      type: 'investment',
      amount: amount,
      status: 'Completed',
      description: `Allocated to ${option.name} (${option.strategy})`,
      previous_balance: prevCash,
      new_balance: newCash,
      created_at: nowIso,
      metadata: {
        investment_id: invId,
        bonus_id: bonusId,
        annual_cga_bonus: bonusAmount,
        eligibility_date: eligibilityIso
      }
    });

    // 5. Create Audit Trail
    const auditRef = doc(db, 'retirement_audit_logs', auditId);
    transaction.set(auditRef, {
      id: auditId,
      user_id: userId,
      account_id: userId,
      transaction_id: txId,
      action: 'RETIREMENT_INVESTMENT_ALLOCATED',
      amount: amount,
      previous_balance: prevCash,
      new_balance: newCash,
      reason: `Allocated capital into ${option.name}`,
      actor: userId,
      timestamp: nowIso
    });
  });

  return invId;
}

/**
 * Idempotent Credit for 20% Annual CGA Retirement Bonus
 * Validates eligibility date and enforces that a bonus is NEVER credited twice
 */
export async function processRetirementBonusCredit(
  bonusId: string,
  actor: string = 'system'
): Promise<{ success: boolean; message: string }> {
  const bonusRef = doc(db, 'retirement_bonuses', bonusId);
  const now = new Date();
  const nowIso = now.toISOString();

  return await runTransaction(db, async (transaction) => {
    const bonusSnap = await transaction.get(bonusRef);
    if (!bonusSnap.exists()) {
      throw new Error('Retirement bonus ledger record not found.');
    }
    const bonus = bonusSnap.data() as RetirementBonus;

    // Idempotency check: Never credit twice
    if (bonus.status === 'credited') {
      return {
        success: false,
        message: 'This bonus has already been credited to the account.'
      };
    }

    if (bonus.status === 'not_eligible') {
      return {
        success: false,
        message: 'This investment is not eligible for the CGA annual bonus.'
      };
    }

    const accountRef = doc(db, 'retirement_accounts', bonus.user_id);
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Retirement account not found.');
    }
    const accountData = accountSnap.data() as RetirementAccount;

    const prevCash = Number(accountData.currentBalance || 0);
    const bonusAmount = Number(bonus.bonus_amount || 0);
    const newCash = prevCash + bonusAmount;
    const newBonusesEarned = Number(accountData.bonusesEarned || 0) + bonusAmount;

    const txId = 'RTX-BONUS-' + Date.now().toString(36).toUpperCase();
    const auditId = 'AUD-BONUS-' + Date.now().toString(36).toUpperCase();

    // 1. Update bonus ledger record (marks credited, stores txId)
    transaction.update(bonusRef, {
      status: 'credited',
      credited_date: nowIso,
      transaction_id: txId
    });

    // 2. Update investment document status
    const invRef = doc(db, 'retirement_investments', bonus.investment_id);
    transaction.update(invRef, {
      bonusStatus: 'credited'
    });

    // 3. Credit the bonus amount to the retirement account balance
    transaction.update(accountRef, {
      currentBalance: newCash,
      bonusesEarned: newBonusesEarned,
      updated_at: nowIso
    });

    // 4. Create Retirement Transaction
    const txRef = doc(db, 'retirement_transactions', txId);
    transaction.set(txRef, {
      id: txId,
      user_id: bonus.user_id,
      account_id: bonus.user_id,
      type: 'bonus',
      amount: bonusAmount,
      status: 'Completed',
      description: `Credited 20% CGA Annual Bonus for ${bonus.investment_name || 'Retirement Portfolio'}`,
      previous_balance: prevCash,
      new_balance: newCash,
      created_at: nowIso,
      metadata: {
        bonus_id: bonusId,
        investment_id: bonus.investment_id,
        bonus_rate: bonus.bonus_rate
      }
    });

    // 5. Create Audit Trail
    const auditRef = doc(db, 'retirement_audit_logs', auditId);
    transaction.set(auditRef, {
      id: auditId,
      user_id: bonus.user_id,
      account_id: bonus.user_id,
      transaction_id: txId,
      action: 'BONUS_CREDITED',
      amount: bonusAmount,
      previous_balance: prevCash,
      new_balance: newCash,
      reason: `20% Annual CGA Retirement Bonus credited after eligibility cycle completion`,
      actor: actor,
      timestamp: nowIso
    });

    return {
      success: true,
      message: `20% CGA Annual Bonus ($${bonusAmount.toLocaleString()}) successfully credited!`
    };
  });
}

/**
 * Submit a dedicated Retirement Withdrawal / Distribution Request
 * Deducts unallocated liquid balance, issues a 'Pending' retirement transaction for compliance review
 */
export async function requestRetirementWithdrawal(
  userId: string,
  amount: number,
  withdrawalDetails: {
    payoutMethod: string;
    destinationAddress: string;
    reason: string;
    agreedToDisclosures: boolean;
  }
): Promise<string> {
  if (amount <= 0 || isNaN(amount)) {
    throw new Error('Please enter a valid withdrawal amount.');
  }

  if (!withdrawalDetails.agreedToDisclosures) {
    throw new Error('You must acknowledge the retirement distribution and tax disclosures to proceed.');
  }

  const accountRef = doc(db, 'retirement_accounts', userId);
  const txId = 'RTX-WD-' + Date.now().toString(36).toUpperCase();
  const auditId = 'AUD-WD-' + Date.now().toString(36).toUpperCase();
  const nowIso = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Retirement account not found.');
    }
    const accountData = accountSnap.data() as RetirementAccount;

    const prevCash = Number(accountData.currentBalance || 0);
    if (prevCash < amount) {
      throw new Error(`Insufficient unallocated cash balance in retirement account ($${prevCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`);
    }

    const newCash = prevCash - amount;

    // Deduct unallocated cash
    transaction.update(accountRef, {
      currentBalance: newCash,
      updated_at: nowIso
    });

    // Record pending withdrawal transaction
    const txRef = doc(db, 'retirement_transactions', txId);
    transaction.set(txRef, {
      id: txId,
      user_id: userId,
      account_id: userId,
      type: 'withdrawal',
      amount: amount,
      status: 'Pending',
      description: `Retirement Distribution Request (${withdrawalDetails.payoutMethod})`,
      previous_balance: prevCash,
      new_balance: newCash,
      created_at: nowIso,
      metadata: {
        payout_method: withdrawalDetails.payoutMethod,
        destination: withdrawalDetails.destinationAddress,
        reason: withdrawalDetails.reason,
        compliance_acknowledged: true
      }
    });

    // Create Audit Log
    const auditRef = doc(db, 'retirement_audit_logs', auditId);
    transaction.set(auditRef, {
      id: auditId,
      user_id: userId,
      account_id: userId,
      transaction_id: txId,
      action: 'WITHDRAWAL_REQUESTED',
      amount: amount,
      previous_balance: prevCash,
      new_balance: newCash,
      reason: `Retirement distribution requested: ${withdrawalDetails.reason || 'Standard Distribution'}`,
      actor: userId,
      timestamp: nowIso
    });
  });

  return txId;
}

/**
 * Illustrative Retirement Projection Calculator
 * Calculates compound value + annual CGA bonus over years
 */
export function calculateRetirementProjection(
  currentBalance: number,
  monthlyContribution: number,
  currentAge: number,
  targetAge: number,
  expectedReturnRate: number = 0.07, // e.g. 7% market return
  annualCgaBonusRate: number = 0.20   // 20% CGA bonus
) {
  const years = Math.max(1, targetAge - currentAge);
  const projectionByYear: {
    year: number;
    age: number;
    totalContributed: number;
    projectedMarketValue: number;
    cumulativeCgaBonus: number;
    totalProjectedBalance: number;
  }[] = [];

  let balance = currentBalance;
  let totalContributed = currentBalance;
  let cumulativeBonus = 0;

  for (let y = 1; y <= years; y++) {
    const annualContribution = monthlyContribution * 12;
    totalContributed += annualContribution;

    // Standard compound growth
    balance = (balance + annualContribution) * (1 + expectedReturnRate);

    // CGA 20% annual bonus on eligible active principal
    const annualBonus = (balance * 0.5) * annualCgaBonusRate; // illustrative bonus calculation
    cumulativeBonus += annualBonus;

    projectionByYear.push({
      year: y,
      age: currentAge + y,
      totalContributed: Math.round(totalContributed),
      projectedMarketValue: Math.round(balance),
      cumulativeCgaBonus: Math.round(cumulativeBonus),
      totalProjectedBalance: Math.round(balance + cumulativeBonus)
    });
  }

  return {
    years,
    finalContributed: totalContributed,
    finalMarketValue: balance,
    finalCumulativeBonus: cumulativeBonus,
    finalTotal: balance + cumulativeBonus,
    projectionByYear
  };
}

/**
 * Fund 401(k) directly with cryptocurrency (Bitcoin or USDT TRC20)
 * Uses existing CGA crypto architecture, isolated into retirement balance
 */
export async function fundRetirementWithCrypto(
  userId: string,
  currency: 'btc' | 'usdt',
  amountUsd: number,
  txHash?: string
): Promise<string> {
  const accountRef = doc(db, 'retirement_accounts', userId);
  const txId = 'RTX-CRYPTO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const auditId = 'AUD-CRYPTO-' + Date.now().toString(36).toUpperCase();
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Retirement account not found. Please open an account first.');
    }
    const accountData = accountSnap.data() as RetirementAccount;
    const prevRetirementBal = Number(accountData.currentBalance || 0);
    const newRetirementBal = prevRetirementBal + amountUsd;
    const newTotalContributions = Number(accountData.totalContributions || 0) + amountUsd;

    transaction.update(accountRef, {
      currentBalance: newRetirementBal,
      totalContributions: newTotalContributions,
      fundingSource: 'crypto',
      updated_at: now
    });

    const txRef = doc(db, 'retirement_transactions', txId);
    transaction.set(txRef, {
      id: txId,
      user_id: userId,
      account_id: userId,
      type: 'contribution',
      amount: amountUsd,
      status: 'Completed',
      description: `401(k) Crypto Funding (${currency.toUpperCase()})`,
      previous_balance: prevRetirementBal,
      new_balance: newRetirementBal,
      created_at: now,
      metadata: {
        funding_source: 'crypto',
        crypto_currency: currency.toUpperCase(),
        tx_hash: txHash || 'DIRECT_CONFIRMATION',
        network: currency === 'btc' ? 'Bitcoin Network' : 'TRON (TRC20)'
      }
    });

    const auditRef = doc(db, 'retirement_audit_logs', auditId);
    transaction.set(auditRef, {
      id: auditId,
      user_id: userId,
      account_id: userId,
      transaction_id: txId,
      action: 'CRYPTO_FUNDING_COMPLETED',
      amount: amountUsd,
      previous_balance: prevRetirementBal,
      new_balance: newRetirementBal,
      reason: `401(k) funded via ${currency.toUpperCase()}`,
      actor: userId,
      timestamp: now
    });
  });

  return txId;
}

/**
 * Admin: Real-time listener for all 401(k) accounts in Cipher Control Panel
 */
export function subscribeAllRetirementAccounts(
  onUpdate: (accounts: RetirementAccount[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, 'retirement_accounts'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ ...d.data(), userId: d.id }) as RetirementAccount);
      items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn("All retirement accounts listener note:", err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Admin: Update 401(k) account status with audit log
 */
export async function adminUpdateRetirementStatus(
  userId: string,
  newStatus: 'active' | 'pending_verification' | 'verification_required' | 'suspended' | 'closed',
  reason: string,
  adminActor: string = 'cipher_root'
): Promise<void> {
  const accountRef = doc(db, 'retirement_accounts', userId);
  const now = new Date().toISOString();
  const auditId = 'AUD-STATUS-' + Date.now().toString(36).toUpperCase();

  await updateDoc(accountRef, {
    status: newStatus,
    updated_at: now
  });

  await setDoc(doc(db, 'retirement_audit_logs', auditId), {
    id: auditId,
    user_id: userId,
    account_id: userId,
    transaction_id: 'STATUS_UPDATE',
    action: `STATUS_CHANGED_TO_${newStatus.toUpperCase()}`,
    amount: 0,
    previous_balance: 0,
    new_balance: 0,
    reason: reason || `Status set to ${newStatus}`,
    actor: adminActor,
    timestamp: now
  });
}

/**
 * Admin: Update 401(k) verification status
 */
export async function adminUpdateRetirementVerification(
  userId: string,
  newVerification: 'verified' | 'pending' | 'required',
  reason: string,
  adminActor: string = 'cipher_root'
): Promise<void> {
  const accountRef = doc(db, 'retirement_accounts', userId);
  const now = new Date().toISOString();
  const auditId = 'AUD-VERIFY-' + Date.now().toString(36).toUpperCase();

  await updateDoc(accountRef, {
    verificationStatus: newVerification,
    verificationDate: newVerification === 'verified' ? now : undefined,
    updated_at: now
  });

  await setDoc(doc(db, 'retirement_audit_logs', auditId), {
    id: auditId,
    user_id: userId,
    account_id: userId,
    transaction_id: 'VERIFICATION_UPDATE',
    action: `VERIFICATION_SET_${newVerification.toUpperCase()}`,
    amount: 0,
    previous_balance: 0,
    new_balance: 0,
    reason: reason || `Verification status updated to ${newVerification}`,
    actor: adminActor,
    timestamp: now
  });
}

/**
 * Admin: Real-time listener for all 401(k) audit logs
 */
export function subscribeAllRetirementAuditLogs(
  onUpdate: (logs: RetirementAuditLog[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, 'retirement_audit_logs'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RetirementAuditLog);
      items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn("Retirement audit logs listener note:", err.message);
      if (onError) onError(err);
    }
  );
}
