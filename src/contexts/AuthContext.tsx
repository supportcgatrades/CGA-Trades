import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  onIdTokenChanged, 
  User as FirebaseUser,
  getAuth,
  getIdTokenResult
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  getFirestore,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getRoiByAmount, isWeekendROI } from '../lib/utils';

export const CIPHER_ADMIN_EMAILS = [
  'support@tavariwave.network',
  'contact.cga.usa@gmail.com',
  'tavariwavenetwork@gmail.com',
  'unusualactivitiesteam@gmail.com'
];
export const CIPHER_ADMIN_UID = '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';

export const isCipherAdmin = (u?: { email?: string | null; uid?: string | null } | null): boolean => {
  if (!u) return false;
  if (u.uid === CIPHER_ADMIN_UID) return true;
  if (u.email && CIPHER_ADMIN_EMAILS.includes(u.email.toLowerCase())) return true;
  return false;
};

export const getCutoffTime = () => {
  return new Date("2026-06-21T17:35:00-07:00").getTime();
};

export const isLegacyUser = (profileData: any): boolean => {
  if (!profileData) return false;
  if (!profileData.created_at) return true; // older accounts without created_at are definitely legacy
  const cutoff = getCutoffTime();
  const userTime = new Date(profileData.created_at).getTime();
  return userTime < cutoff;
};

export const isNewUser = (profileData: any): boolean => {
  if (!profileData) return false;
  return !isLegacyUser(profileData);
};

export const DEFAULT_PLANS = [
  {
    id: 'regular',
    name: 'Regular Plan',
    min: 100,
    max: 90000,
    roi: 0.02,
    weekday_roi: 0.02,
    weekend_roi: 0.01,
    cycle_duration_hours: 24,
    minWithdrawal: 3,
    description: 'Steady growth for smart investors',
    color: 'text-lime-400',
    accentColor: '#009e42',
    borderColor: 'border-lime-500/20',
    bgColor: 'bg-black/40',
    buttonColor: 'bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236]',
    gradient: 'from-lime-500/20 to-emerald-500/10',
    duration: 1,
    active_status: true
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    min: 100000,
    max: 900000,
    roi: 0.025,
    weekday_roi: 0.025,
    weekend_roi: 0.015,
    cycle_duration_hours: 24,
    minWithdrawal: 15000,
    description: 'Higher returns with optimal balance',
    color: 'text-lime-400',
    accentColor: '#009e42',
    borderColor: 'border-lime-500/20',
    bgColor: 'bg-black/50',
    buttonColor: 'bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236]',
    gradient: 'from-lime-500/20 to-teal-500/10',
    duration: 3,
    active_status: true
  },
  {
    id: 'elite',
    name: 'Elite Plan',
    min: 1000000,
    max: 50000000,
    roi: 0.03,
    weekday_roi: 0.03,
    weekend_roi: 0.015,
    cycle_duration_hours: 24,
    minWithdrawal: 30000,
    description: 'Maximum returns for elite investors',
    color: 'text-lime-400',
    accentColor: '#009e42',
    borderColor: 'border-lime-500/20',
    bgColor: 'bg-black/40',
    buttonColor: 'bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236]',
    gradient: 'from-lime-500/20 to-purple-500/20',
    duration: 7,
    active_status: true
  }
];

export function getRoiByAmountDynamic(amount: number, livePlans: any[]): number {
  const isWeekend = isWeekendROI();
  const matchingPlan = (livePlans || []).find((p: any) => p.active_status !== false && amount >= p.min && amount <= p.max);
  if (matchingPlan) {
    if (isWeekend) {
      if (matchingPlan.weekend_roi !== undefined) return matchingPlan.weekend_roi;
      const planId = (matchingPlan.id || matchingPlan.name || '').toLowerCase();
      if (planId.includes('regular')) return 0.01;
      if (planId.includes('premium')) return 0.015;
      if (planId.includes('elite')) return 0.015;
      return matchingPlan.roi;
    } else {
      if (matchingPlan.weekday_roi !== undefined) return matchingPlan.weekday_roi;
      return matchingPlan.roi;
    }
  }
  return getRoiByAmount(amount); // fallback
}

export function getRobotRoiRate(robotName?: string): number | null {
  if (!robotName) return null;
  switch (robotName) {
    case 'AI 1.8': return 0.005;
    case 'AI 2.0': return 0.02;
    case 'AI 2.5': return 0.025;
    case 'AI 3.0': return 0.03;
    default: return null;
  }
}

export function getEffectiveRoiRate(
  profile: any,
  amount: number,
  plans: any[],
  globalRoiConfig?: any
): number {
  // 1. Individual Override (if enabled)
  if (profile?.roi_override_enabled === true && typeof profile?.roi_override === 'number') {
    return profile.roi_override;
  }

  // Determine active robot name
  const robotName = profile?.active_robot;

  // Map robot name to key in settings/roi_config
  let robotKey: string | null = null;
  if (robotName === 'AI 1.8') robotKey = 'ai_1_8';
  else if (robotName === 'AI 2.0') robotKey = 'ai_2_0';
  else if (robotName === 'AI 2.5') robotKey = 'ai_2_5';
  else if (robotName === 'AI 3.0') robotKey = 'ai_3_0';
  else if (robotName === 'Free AI Bot' || !robotName) robotKey = 'free_bot';

  // 2. Global Bot ROI
  if (robotKey && globalRoiConfig && typeof globalRoiConfig[robotKey] === 'number') {
    return globalRoiConfig[robotKey];
  }

  // 3. Existing default ROI (fallback)
  const isNew = isNewUser(profile);
  if (robotName) {
    if (robotName === 'AI 1.8') return 0.005;
    if (robotName === 'AI 2.0') return 0.02;
    if (robotName === 'AI 2.5') return 0.025;
    if (robotName === 'AI 3.0') return 0.03;
  }
  return isNew ? 0.005 : getRoiByAmountDynamic(amount, plans);
}

export function calculateExpectedDailyRoi(
  activeInvestments: any[],
  compoundedAmounts: number[] | undefined,
  plans: any[],
  profile?: any,
  globalRoiConfig?: any
): number {
  if (!profile) return 0;

  const isMigratedLegacy = profile.migration_status === 'accepted';
  const assetsBalance = isMigratedLegacy 
    ? (profile.remaining_upgraded_assets ?? 0) 
    : (profile.total_invested ?? 0);

  if (assetsBalance <= 0) return 0;

  const roiRate = getEffectiveRoiRate(profile, assetsBalance, plans, globalRoiConfig);
  const profit = assetsBalance * roiRate;

  // Truncate to exactly two decimal places, never round upward
  return Math.floor(profit * 100) / 100;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorString = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorString);
  throw new Error(errorString);
}

interface UserProfile {
  uid: string;
  public_id?: string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'cipher';
  funding_balance: number;
  available_balance: number;
  total_earnings: number;
  total_invested: number;
  email_verified?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  syncAuthSession: (signedInUser?: FirebaseUser) => Promise<void>;
  plans: any[];
  expectedDailyRoi: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const plansRef = useRef<any[]>(DEFAULT_PLANS);
  const unsubscribeProfileRef = useRef<(() => void) | null>(null);
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
  const [compoundTransactions, setCompoundTransactions] = useState<any[]>([]);
  const [globalRoiConfig, setGlobalRoiConfig] = useState<any>(null);

  const isProcessingRoiRef = useRef(false);
  const lastProcessedCycleRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'roi_config'), (snap) => {
      if (snap.exists()) {
        setGlobalRoiConfig(snap.data());
      }
    }, (err) => {
      console.warn("Global ROI config sync blocked:", err);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'investment_plans'), async (snapshot) => {
      if (snapshot.empty) {
        setPlans(DEFAULT_PLANS);
        plansRef.current = DEFAULT_PLANS;
      } else {
        const loadedPlans = snapshot.docs.map(d => {
          const data = d.data();
          const defaultPlan: any = DEFAULT_PLANS.find(dp => dp.id === d.id) || {};
          const weekday_roi = data.weekday_roi !== undefined ? data.weekday_roi : (data.roi !== undefined ? data.roi : defaultPlan.weekday_roi);
          const weekend_roi = data.weekend_roi !== undefined ? data.weekend_roi : (data.roi !== undefined ? data.roi * 0.6 : defaultPlan.weekend_roi);
          const cycle_duration_hours = data.cycle_duration_hours !== undefined ? data.cycle_duration_hours : defaultPlan.cycle_duration_hours;
          return {
            ...defaultPlan,
            ...data,
            id: d.id,
            weekday_roi,
            weekend_roi,
            cycle_duration_hours,
            roi: weekday_roi
          };
        });
        const order = ['regular', 'premium', 'elite'];
        loadedPlans.sort((a: any, b: any) => order.indexOf(a.id) - order.indexOf(b.id));
        setPlans(loadedPlans);
        plansRef.current = loadedPlans;
      }
    }, (error) => {
      console.warn("Error subscribing to investment_plans, falling back to default:", error);
      setPlans(DEFAULT_PLANS);
      plansRef.current = DEFAULT_PLANS;
    });
    return () => unsub();
  }, []);

  const checkAndProcessROI = useCallback(async (firebaseUser: FirebaseUser, docRef: any, profileData: UserProfile) => {
    const isRoiDisabled = profileData.roi_disabled === true;
    if (isRoiDisabled) return;

    if (profileData.migration_status === 'completed') return;

    let cycleStartStr = profileData.roi_cycle_start;
    if (!cycleStartStr) return;

    if (isProcessingRoiRef.current) return;
    if (lastProcessedCycleRef.current === cycleStartStr) return;

    const isMigratedLegacy = profileData.migration_status === 'accepted';

    try {
      if (isMigratedLegacy) {
        const now = new Date().getTime();
        const cycleStart = new Date(cycleStartStr).getTime();
        const totalDuration = 24 * 60 * 60 * 1000; // 24-hour cycle
        const elapsed = now - cycleStart;
        const completedCycles = Math.floor(elapsed / totalDuration);

        if (completedCycles > 0) {
          isProcessingRoiRef.current = true;
          
          await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(docRef);
            if (!userSnap.exists()) return;
            
            const currentProfile = userSnap.data() as UserProfile;
            if (currentProfile.migration_status === 'completed') return;

            const currentCycleStart = new Date(currentProfile.roi_cycle_start || cycleStartStr).getTime();
            const currentCompletedCycles = Math.floor((new Date().getTime() - currentCycleStart) / totalDuration);

            if (currentCompletedCycles <= 0) return;

            let remainingAssets = currentProfile.remaining_upgraded_assets ?? 0;
            let totalCredit = 0;

            if (remainingAssets <= 0) {
              transaction.update(docRef, {
                migration_status: 'completed',
                roi_cycle_start: new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString()
              });
              return;
            }

            // Fetch global ROI config centrally inside transaction
            const roiConfigDoc = await transaction.get(doc(db, 'settings', 'roi_config'));
            const txGlobalRoiConfig = roiConfigDoc.exists() ? roiConfigDoc.data() : null;

            const roiRate = getEffectiveRoiRate(currentProfile, remainingAssets, plansRef.current, txGlobalRoiConfig);

            for (let cycle = 0; cycle < currentCompletedCycles; cycle++) {
              if (remainingAssets <= 0) break;
              const cycleProfit = Math.floor((remainingAssets * roiRate) * 100) / 100;
              const actualProfit = Math.min(cycleProfit, remainingAssets);
              totalCredit += actualProfit;
              remainingAssets = Math.max(0, remainingAssets - actualProfit);
            }

            const newCycleStart = new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString();
            const isExhausted = remainingAssets <= 1e-9;
            const finalRemaining = isExhausted ? 0 : remainingAssets;

            if (totalCredit > 0) {
              // Check automatic compounding state
              let autoCompoundEnabled = currentProfile.auto_compound_enabled || false;
              let isCompoundingActiveNow = false;
              const nowMs = new Date().getTime();

              if (autoCompoundEnabled && currentProfile.auto_compound_end_date) {
                const endMs = new Date(currentProfile.auto_compound_end_date).getTime();
                if (nowMs >= endMs) {
                  autoCompoundEnabled = false;
                } else {
                  isCompoundingActiveNow = true;
                }
              }

              if (isCompoundingActiveNow) {
                // Compound Legacy ROI
                const existingCompounds = currentProfile.withdraw_methods?.compounded_amounts || currentProfile.compounded_amounts || [];
                const newCompounds = [...existingCompounds, totalCredit];
                const existingWithdrawMethods = currentProfile.withdraw_methods || {};
                const withdrawMethodsUpdate = {
                  ...existingWithdrawMethods,
                  compounded_amounts: newCompounds,
                  last_compound_popup_date: new Date().toISOString().split('T')[0]
                };

                const userUpdates: any = {
                  total_earnings: (currentProfile.total_earnings || 0) + totalCredit,
                  remaining_upgraded_assets: finalRemaining,
                  total_invested: Math.max(0, finalRemaining + totalCredit),
                  roi_cycle_start: newCycleStart,
                  withdraw_methods: withdrawMethodsUpdate,
                  auto_compound_enabled: autoCompoundEnabled,
                  migration_status: isExhausted ? 'completed' : 'accepted'
                };

                if (currentProfile.compounded_amounts) {
                  userUpdates.compounded_amounts = newCompounds;
                }

                transaction.update(docRef, userUpdates);

                // Write ROI harvest transaction
                const harvestTxId = `roi-legacy-auto-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
                const harvestTxRef = doc(db, 'transactions', harvestTxId);
                transaction.set(harvestTxRef, {
                  user_id: firebaseUser.uid,
                  type: 'roi_harvest',
                  amount: totalCredit,
                  plan_name: 'Legacy Upgrade Cycle',
                  created_at: new Date().toISOString(),
                  status: 'approved',
                  description: `Legacy Asset Multiplier ROI of 0.5% (Disbursed & Auto-Compounded: $${totalCredit.toFixed(2)}, Remaining Assets: $${finalRemaining.toFixed(2)})`
                });

                // Write automatic compound transaction
                const compoundTxId = `roi-comp-legacy-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
                const compoundTxRef = doc(db, 'transactions', compoundTxId);
                transaction.set(compoundTxRef, {
                  user_id: firebaseUser.uid,
                  type: 'compound',
                  type_detail: 'compound_available_balance',
                  amount: totalCredit,
                  status: 'approved',
                  created_at: new Date().toISOString(),
                  description: `Automated Daily Reinvestment of ROI earnings`
                });

                // Write Notification
                const notifRef = doc(collection(db, 'notifications'));
                transaction.set(notifRef, {
                  user_id: firebaseUser.uid,
                  type: 'success',
                  title: 'Auto-Compound Executed',
                  message: `Automated compounding protocol reinvested ${totalCredit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} into your assets.`,
                  read: false,
                  created_at: new Date().toISOString()
                });
              } else {
                // Standard legacy credit to available balance
                const oldAvailableBalance = currentProfile.available_balance || 0;
                const newAvailableBalance = oldAvailableBalance + totalCredit;

                transaction.update(docRef, {
                  available_balance: newAvailableBalance,
                  total_earnings: (currentProfile.total_earnings || 0) + totalCredit,
                  remaining_upgraded_assets: finalRemaining,
                  total_invested: finalRemaining,
                  roi_cycle_start: newCycleStart,
                  auto_compound_enabled: autoCompoundEnabled,
                  migration_status: isExhausted ? 'completed' : 'accepted'
                });

                const txId = `roi-legacy-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
                const txRef = doc(db, 'transactions', txId);
                transaction.set(txRef, {
                  user_id: firebaseUser.uid,
                  type: 'roi_harvest',
                  amount: totalCredit,
                  plan_name: 'Legacy Upgrade Cycle',
                  created_at: new Date().toISOString(),
                  status: 'approved',
                  description: `Legacy Asset Multiplier ROI of 0.5% (Disbursed: $${totalCredit.toFixed(2)}, Remaining Assets: $${finalRemaining.toFixed(2)})`
                });

                const notifRef = doc(collection(db, 'notifications'));
                transaction.set(notifRef, {
                  user_id: firebaseUser.uid,
                  type: 'success',
                  title: 'ROI Cycle Deposited',
                  message: `Legacy Upgrade ROI cycle has matured. Added $${totalCredit.toFixed(2)} to your available balance.`,
                  read: false,
                  created_at: new Date().toISOString()
                });
              }
            } else {
              // Even with 0 credit, check for expiration
              let autoCompoundEnabled = currentProfile.auto_compound_enabled || false;
              if (autoCompoundEnabled && currentProfile.auto_compound_end_date) {
                const nowMs = new Date().getTime();
                const endMs = new Date(currentProfile.auto_compound_end_date).getTime();
                if (nowMs >= endMs) {
                  autoCompoundEnabled = false;
                }
              }

              transaction.update(docRef, {
                roi_cycle_start: newCycleStart,
                auto_compound_enabled: autoCompoundEnabled,
                migration_status: isExhausted ? 'completed' : 'accepted'
              });
            }
          });
          lastProcessedCycleRef.current = cycleStartStr;
        }
        return;
      }

      const q = query(collection(db, 'investments'), where('user_id', '==', firebaseUser.uid), where('status', '==', 'active'));
      const invSnap = await getDocs(q);

      let hours = 24;
      if (!invSnap.empty) {
        const firstActive = invSnap.docs[0].data();
        const matchingPlan = (plansRef.current || []).find((p: any) => 
          p.id === firstActive.plan_id ||
          (p.id || '').toLowerCase() === (firstActive.plan_name || '').toLowerCase() ||
          (p.name || '').toLowerCase() === (firstActive.plan_name || '').toLowerCase() ||
          (firstActive.amount >= p.min && firstActive.amount <= p.max)
        );
        if (matchingPlan && matchingPlan.cycle_duration_hours !== undefined) {
          hours = matchingPlan.cycle_duration_hours;
        }
      }

      const now = new Date().getTime();
      const cycleStart = new Date(cycleStartStr).getTime();
      const totalDuration = hours * 60 * 60 * 1000;
      const elapsed = now - cycleStart;
      const completedCycles = Math.floor(elapsed / totalDuration);

      if (completedCycles > 0) {
        isProcessingRoiRef.current = true;
        
        if (invSnap.empty) {
          const newCycleStart = new Date(cycleStart + (completedCycles * totalDuration)).toISOString();
          lastProcessedCycleRef.current = cycleStartStr;
          await updateDoc(docRef, { roi_cycle_start: newCycleStart });
          return;
        }

        await runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(docRef);
          if (!userSnap.exists()) return;
          
          const currentProfile = userSnap.data() as UserProfile;
          const currentCycleStart = new Date(currentProfile.roi_cycle_start || cycleStartStr).getTime();
          const currentCompletedCycles = Math.floor((new Date().getTime() - currentCycleStart) / totalDuration);

          if (currentCompletedCycles <= 0) return;

          // Fetch global ROI config centrally inside transaction
          const roiConfigDoc = await transaction.get(doc(db, 'settings', 'roi_config'));
          const txGlobalRoiConfig = roiConfigDoc.exists() ? roiConfigDoc.data() : null;

          // Determine automatic compounding state
          let autoCompoundEnabled = currentProfile.auto_compound_enabled || false;
          let isCompoundingActiveNow = false;
          const nowMs = new Date().getTime();

          if (autoCompoundEnabled && currentProfile.auto_compound_end_date) {
            const endMs = new Date(currentProfile.auto_compound_end_date).getTime();
            if (nowMs >= endMs) {
              autoCompoundEnabled = false;
            } else {
              isCompoundingActiveNow = true;
            }
          }

          const assetsBalance = currentProfile.total_invested || 0;
          const roiRate = getEffectiveRoiRate(currentProfile, assetsBalance, plansRef.current, txGlobalRoiConfig);

          let totalCredit = 0;
          let currentAssets = assetsBalance;
          for (let cycle = 0; cycle < currentCompletedCycles; cycle++) {
            if (currentAssets <= 0) break;
            const cycleProfit = Math.floor((currentAssets * roiRate) * 100) / 100;
            totalCredit += cycleProfit;
            if (isCompoundingActiveNow) {
              currentAssets += cycleProfit;
            }
          }
          // Clamp totalCredit itself to exactly two decimal places
          totalCredit = Math.floor(totalCredit * 100) / 100;

          const investmentUpdates: { id: string, docRef: any, data: any }[] = [];

          for (const invDoc of invSnap.docs) {
            const invRef = doc(db, 'investments', invDoc.id);
            const invSnapInTx = await transaction.get(invRef);
            if (invSnapInTx.exists()) {
              const invData = invSnapInTx.data();
              if (invData.status === 'active') {
                const invRoiRate = getEffectiveRoiRate(currentProfile, invData.amount, plansRef.current, txGlobalRoiConfig);
                const invProfitPerCycle = invData.amount * invRoiRate;
                const invAccumulatedProfit = currentCompletedCycles * (Math.floor(invProfitPerCycle * 100) / 100);

                investmentUpdates.push({
                  id: invDoc.id,
                  docRef: invRef,
                  data: {
                    total_earned: Math.floor(((invData.total_earned || 0) + invAccumulatedProfit) * 100) / 100,
                    last_sync: new Date().toISOString(),
                    dailyRoi: invRoiRate
                  }
                });
              }
            }
          }

          if (totalCredit > 0) {
            const newCycleStart = new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString();
            const oldAvailableBalance = currentProfile.available_balance || 0;

            if (isCompoundingActiveNow) {
              // Automated Daily Compounding behavior
              const existingCompounds = currentProfile.withdraw_methods?.compounded_amounts || currentProfile.compounded_amounts || [];
              const newCompounds = [...existingCompounds, totalCredit];
              const existingWithdrawMethods = currentProfile.withdraw_methods || {};
              const withdrawMethodsUpdate = {
                ...existingWithdrawMethods,
                compounded_amounts: newCompounds,
                last_compound_popup_date: new Date().toISOString().split('T')[0]
              };

              const userUpdates: any = {
                total_earnings: (currentProfile.total_earnings || 0) + totalCredit,
                total_invested: Math.max(0, (currentProfile.total_invested || 0) + totalCredit),
                roi_cycle_start: newCycleStart,
                withdraw_methods: withdrawMethodsUpdate,
                auto_compound_enabled: autoCompoundEnabled
              };

              if (currentProfile.compounded_amounts) {
                userUpdates.compounded_amounts = newCompounds;
              }

              transaction.update(docRef, userUpdates);

              // Standard Investment items are updated normally
              investmentUpdates.forEach(update => {
                transaction.update(update.docRef, update.data);
              });

              // Write ROI harvest transaction
              const harvestTxId = `roi-auto-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
              const harvestTxRef = doc(db, 'transactions', harvestTxId);
              transaction.set(harvestTxRef, {
                user_id: firebaseUser.uid,
                type: 'roi_harvest',
                amount: totalCredit,
                plan_name: 'Auto-Yield Cycle',
                created_at: new Date().toISOString(),
                status: 'approved',
                description: `Automatic credit for ${currentCompletedCycles} cycle(s)`
              });

              // Write automatic compound transaction
              const compoundTxId = `roi-comp-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
              const compoundTxRef = doc(db, 'transactions', compoundTxId);
              transaction.set(compoundTxRef, {
                user_id: firebaseUser.uid,
                type: 'compound',
                type_detail: 'compound_available_balance',
                amount: totalCredit,
                status: 'approved',
                created_at: new Date().toISOString(),
                description: `Automated Daily Reinvestment of ROI earnings`
              });

              // Write Notification
              const notifRef = doc(collection(db, 'notifications'));
              transaction.set(notifRef, {
                user_id: firebaseUser.uid,
                type: 'success',
                title: 'Auto-Compound Executed',
                message: `Automated compounding protocol reinvested ${totalCredit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} into your assets.`,
                read: false,
                created_at: new Date().toISOString()
              });
            } else {
              // Standard manual earning behaviour
              const newAvailableBalance = oldAvailableBalance + totalCredit;

              transaction.update(docRef, {
                available_balance: newAvailableBalance,
                total_earnings: (currentProfile.total_earnings || 0) + totalCredit,
                roi_cycle_start: newCycleStart,
                auto_compound_enabled: autoCompoundEnabled
              });

              investmentUpdates.forEach(update => {
                transaction.update(update.docRef, update.data);
              });

              const txId = `roi-${firebaseUser.uid}-${currentCycleStart}-${currentCompletedCycles}`;
              const txRef = doc(db, 'transactions', txId);
              transaction.set(txRef, {
                user_id: firebaseUser.uid,
                type: 'roi_harvest',
                amount: totalCredit,
                plan_name: 'Auto-Yield Cycle',
                created_at: new Date().toISOString(),
                status: 'approved',
                description: `Automatic credit for ${currentCompletedCycles} cycle(s)`
              });
            }
          } else {
            const newCycleStart = new Date(currentCycleStart + (currentCompletedCycles * totalDuration)).toISOString();
            
            // Check automatic compounding state for expiration even when credit is 0
            let autoCompoundEnabled = currentProfile.auto_compound_enabled || false;
            if (autoCompoundEnabled && currentProfile.auto_compound_end_date) {
              const nowMs = new Date().getTime();
              const endMs = new Date(currentProfile.auto_compound_end_date).getTime();
              if (nowMs >= endMs) {
                autoCompoundEnabled = false;
              }
            }

            transaction.update(docRef, {
              roi_cycle_start: newCycleStart,
              auto_compound_enabled: autoCompoundEnabled
            });
          }
        });
        lastProcessedCycleRef.current = cycleStartStr;
      }
    } catch (err) {
      console.error("[ROI Engine] Sync transaction failed:", err);
    } finally {
      isProcessingRoiRef.current = false;
    }
  }, []);

  const runExistingDataCorrection = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const currentWithdrawMethods = profileData.withdraw_methods || {};
    if (currentWithdrawMethods.rewards_migrated_v2) return;

    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      const txQuery = query(collection(db, 'transactions'), where('user_id', '==', firebaseUser.uid));
      const txSnap = await getDocs(txQuery);

      let totalReferralClaims = 0;

      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.status === 'approved' && tx.type === 'referral_reward') {
          totalReferralClaims += tx.amount || 0;
        }
      });

      if (totalReferralClaims > 0) {
        await runTransaction(db, async (transaction) => {
          const uSnap = await transaction.get(docRef);
          if (!uSnap.exists()) return;

          const uData = uSnap.data() as UserProfile;
          const uWithdrawMethods = uData.withdraw_methods || {};
          if (uWithdrawMethods.rewards_migrated_v2) return;

          const currentAvailable = uData.available_balance || 0;
          const oldRewardDollarBalance = uWithdrawMethods.reward_dollar_balance || 0;

          let newAvailable = currentAvailable - totalReferralClaims;
          if (newAvailable < 0) newAvailable = 0;

          const newRewardDollar = oldRewardDollarBalance + totalReferralClaims;

          transaction.update(docRef, {
            available_balance: newAvailable,
            withdraw_methods: {
              ...uWithdrawMethods,
              reward_dollar_balance: newRewardDollar,
              rewards_migrated_v2: true
            }
          });
        });
      } else {
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            rewards_migrated_v2: true
          }
        });
      }
    } catch (err) {
      console.error("[Migration Error] Failed to execute exact data correction:", err);
    }
  }, []);

  const runRoiRelocationCorrection = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const currentWithdrawMethods = profileData.withdraw_methods || {};
    if (currentWithdrawMethods.roi_relocated_v3) return;

    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      const txQuery = query(collection(db, 'transactions'), where('user_id', '==', firebaseUser.uid));
      const txSnap = await getDocs(txQuery);

      let totalRoiHarvest = 0;

      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.status === 'approved' && tx.type === 'roi_harvest') {
          totalRoiHarvest += tx.amount || 0;
        }
      });

      if (totalRoiHarvest > 0) {
        await runTransaction(db, async (transaction) => {
          const uSnap = await transaction.get(docRef);
          if (!uSnap.exists()) return;

          const uData = uSnap.data() as UserProfile;
          const uWithdrawMethods = uData.withdraw_methods || {};
          if (uWithdrawMethods.roi_relocated_v3) return;

          const oldRewardDollarBalance = uWithdrawMethods.reward_dollar_balance || 0;
          const currentAvailable = uData.available_balance || 0;

          // Deduct from reward balance, ensuring it doesn't go below 0
          const deductAmount = Math.min(totalRoiHarvest, oldRewardDollarBalance);
          const newRewardDollar = oldRewardDollarBalance - deductAmount;
          
          // Add back to available balance
          const newAvailable = currentAvailable + deductAmount;

          transaction.update(docRef, {
            available_balance: newAvailable,
            withdraw_methods: {
              ...uWithdrawMethods,
              reward_dollar_balance: newRewardDollar,
              roi_relocated_v3: true
            }
          });

          // Add transaction adjustment record for history integrity
          const correctionTxId = `roi-relocate-adj-${firebaseUser.uid}-${Date.now()}`;
          const correctionTxRef = doc(db, 'transactions', correctionTxId);
          transaction.set(correctionTxRef, {
            user_id: firebaseUser.uid,
            type: 'adjustment',
            amount: deductAmount,
            plan_name: 'Harvest relocation adjustment',
            created_at: new Date().toISOString(),
            status: 'approved',
            description: `ROI balance correction: Relocated $${deductAmount.toFixed(2)} from Reward Balance to Available Balance`
          });
        });
      } else {
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            roi_relocated_v3: true
          }
        });
      }
    } catch (err) {
      console.error("[Correction Error] Failed to execute ROI relocation:", err);
    }
  }, []);

  const runCompoundingMigrationCorrection = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      // 1. Fetch all transactions for this user with error isolation
      let txSnap;
      try {
        const txQuery = query(
          collection(db, 'transactions'),
          where('user_id', '==', firebaseUser.uid)
        );
        txSnap = await getDocs(txQuery);
      } catch (txErr: any) {
        console.error("[ROI Compound Fix] getDocs(transactions) failed:", txErr.message || txErr);
        throw txErr;
      }

      // 2. Group compound transactions by their exact created_at timestamp
      const groups: { [createdAt: string]: number } = {};
      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.type === 'compound') {
          const createdAt = tx.created_at || '';
          const amount = tx.amount || 0;
          if (createdAt && amount > 0) {
            groups[createdAt] = (groups[createdAt] || 0) + amount;
          }
        }
      });

      // 3. Extract the summed compounded amounts per compounding operation
      const compoundedAmounts = Object.values(groups).filter(val => val > 0);

      // 4. Update inside withdraw_methods to respect Firestore security rules on permitted keys
      try {
        const currentWithdrawMethods = profileData.withdraw_methods || {};
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            compounded_amounts: compoundedAmounts,
            compounded_amounts_migrated_v1: true
          }
        });
        console.log(`[ROI Compound Fix] Successfully migrated ${compoundedAmounts.length} compound amounts nested in withdraw_methods for user: ${firebaseUser.uid}`, compoundedAmounts);
      } catch (updateErr: any) {
        console.error("[ROI Compound Fix] updateDoc on users failed:", updateErr.message || updateErr);
        throw updateErr;
      }
    } catch (err: any) {
      console.error("[ROI Compound Fix] Migration correction failed:", err.message || err);
    }
  }, []);

  const runAutoCompoundRecoveryCheck = useCallback(async (firebaseUser: FirebaseUser, profileData: UserProfile) => {
    const currentWithdrawMethods = profileData.withdraw_methods || {};
    if (currentWithdrawMethods.auto_compound_recovered_v2) return;

    // Check if autoCompound is currently active
    const autoCompoundEnabled = profileData.auto_compound_enabled || false;
    const autoCompoundEndDate = profileData.auto_compound_end_date;
    const autoCompoundStartDate = profileData.auto_compound_start_date;
    if (!autoCompoundEnabled || !autoCompoundEndDate || !autoCompoundStartDate) {
      // Not active auto-compound, just flag as completed so we don't check again
      const docRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(docRef, {
        withdraw_methods: {
          ...currentWithdrawMethods,
          auto_compound_recovered_v2: true
        }
      });
      return;
    }

    const nowMs = new Date().getTime();
    const endMs = new Date(autoCompoundEndDate).getTime();
    if (nowMs >= endMs) {
      // Auto-compound expired, flag as completed
      const docRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(docRef, {
        withdraw_methods: {
          ...currentWithdrawMethods,
          auto_compound_recovered_v2: true
        }
      });
      return;
    }

    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      const txQuery = query(collection(db, 'transactions'), where('user_id', '==', firebaseUser.uid));
      const txSnap = await getDocs(txQuery);

      let totalRoiHarvestedSinceStart = 0;
      let totalRoiCompoundedSinceStart = 0;
      const startMs = new Date(autoCompoundStartDate).getTime();

      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.status === 'approved' && tx.created_at) {
          const txMs = new Date(tx.created_at).getTime();
          if (txMs >= startMs) {
            if (tx.type === 'roi_harvest') {
              totalRoiHarvestedSinceStart += tx.amount || 0;
            } else if (tx.type === 'compound') {
              totalRoiCompoundedSinceStart += tx.amount || 0;
            }
          }
        }
      });

      const uncompoundedRoi = Math.max(0, totalRoiHarvestedSinceStart - totalRoiCompoundedSinceStart);
      const currentAvailable = profileData.available_balance || 0;
      const moveAmount = Math.max(0, Math.floor(Math.min(uncompoundedRoi, currentAvailable) * 100) / 100);

      if (moveAmount > 0) {
        await runTransaction(db, async (transaction) => {
          const uSnap = await transaction.get(docRef);
          if (!uSnap.exists()) return;

          const uData = uSnap.data() as UserProfile;
          const uWithdrawMethods = uData.withdraw_methods || {};
          if (uWithdrawMethods.auto_compound_recovered_v2) return;

          const latestAvailable = uData.available_balance || 0;
          const latestInvested = uData.total_invested || 0;

          const finalMoveAmount = Math.max(0, Math.floor(Math.min(moveAmount, latestAvailable) * 100) / 100);
          if (finalMoveAmount <= 0) {
            transaction.update(docRef, {
              withdraw_methods: {
                ...uWithdrawMethods,
                auto_compound_recovered_v2: true
              }
            });
            return;
          }

          const existingCompounds = uWithdrawMethods.compounded_amounts || uData.compounded_amounts || [];
          const newCompounds = [...existingCompounds, finalMoveAmount];

          const newAvailable = Math.max(0, Math.floor((latestAvailable - finalMoveAmount) * 100) / 100);
          const newInvested = Math.floor((latestInvested + finalMoveAmount) * 100) / 100;

          const userUpdates: any = {
            available_balance: newAvailable,
            total_invested: newInvested,
            withdraw_methods: {
              ...uWithdrawMethods,
              compounded_amounts: newCompounds,
              auto_compound_recovered_v2: true
            }
          };

          if (uData.compounded_amounts) {
            userUpdates.compounded_amounts = newCompounds;
          }

          transaction.update(docRef, userUpdates);

          // Add transaction compound record
          const correctionTxId = `roi-auto-recovery-${firebaseUser.uid}-${Date.now()}`;
          const correctionTxRef = doc(db, 'transactions', correctionTxId);
          transaction.set(correctionTxRef, {
            user_id: firebaseUser.uid,
            type: 'compound',
            type_detail: 'compound_available_balance',
            amount: finalMoveAmount,
            status: 'approved',
            created_at: new Date().toISOString(),
            description: `Automated recovery reinvestment of uncompounded ROI earnings`
          });

          // Write Notification
          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: firebaseUser.uid,
            type: 'success',
            title: 'Auto-Compound Corrected',
            message: `Automated protocol recovered and reinvested ${finalMoveAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} into your assets.`,
            read: false,
            created_at: new Date().toISOString()
          });
        });
        console.log(`[Auto-Compound Recovery] Reinvested $${moveAmount} for user: ${firebaseUser.uid}`);
      } else {
        await updateDoc(docRef, {
          withdraw_methods: {
            ...currentWithdrawMethods,
            auto_compound_recovered_v2: true
          }
        });
      }
    } catch (err) {
      console.error("[Auto-Compound Recovery Error]:", err);
    }
  }, []);

  const fetchProfileWithRetry = useCallback(async (firebaseUser: FirebaseUser, retryCount = 0): Promise<void> => {
    // Reload user state to ensure we have the absolute latest verification status
    // This addresses the "verified users unable to sign in" permission issue
    if (retryCount === 0) {
      try {
        await firebaseUser.reload();
        await firebaseUser.getIdToken(true);
        const active = auth.currentUser;
        if (active) {
          setUser(Object.assign(Object.create(Object.getPrototypeOf(active)), active));
        }
      } catch (e) {
        console.warn("Auth reload failed during profile fetch", e);
      }
    }

    const currentCheckUser = auth.currentUser || firebaseUser;
    const isCipher = isCipherAdmin(currentCheckUser);

    if (!currentCheckUser.emailVerified && !isCipher) {
        setProfile(null);
        setLoading(false);
        return;
    }

    const docRef = doc(db, 'users', currentCheckUser.uid);
    
    try {
      // Clear existing subscription
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
        unsubscribeProfileRef.current = null;
      }

      // Initial getDoc to check existence and prime the cache
      const initialSnap = await getDoc(docRef);
      if (initialSnap.exists()) {
        setProfile(initialSnap.data() as UserProfile);
      }

      const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);

          // Safe trigger existing reward balance correction once
          if (!profileData.withdraw_methods?.rewards_migrated_v2) {
            runExistingDataCorrection(firebaseUser, profileData);
          }

          // Trigger relocation of ROI profits to Available Balance
          if (!profileData.withdraw_methods?.roi_relocated_v3) {
            runRoiRelocationCorrection(firebaseUser, profileData);
          }

          // Trigger reconstruction of compounding amounts for compounding ROI threshold fix
          const isMigrated = profileData.withdraw_methods?.compounded_amounts_migrated_v1 || profileData.compounded_amounts_migrated_v1;
          if (!isMigrated) {
            runCompoundingMigrationCorrection(firebaseUser, profileData);
          }

          // Trigger Auto-Compound Recovery for existing users
          if (!profileData.withdraw_methods?.auto_compound_recovered_v2) {
            runAutoCompoundRecoveryCheck(firebaseUser, profileData);
          }

          // ROI Background Sync
          const cycleStartStr = profileData.roi_cycle_start;
          const isRoiDisabled = profileData.roi_disabled === true;

          // Auto-heal missing roi_cycle_start if active investments exist
          if (!cycleStartStr && !isRoiDisabled) {
            const q = query(collection(db, 'investments'), where('user_id', '==', firebaseUser.uid), where('status', '==', 'active'));
            getDocs(q).then(async (invSnap) => {
              if (!invSnap.empty) {
                let earliestTime = new Date().getTime();
                invSnap.docs.forEach(d => {
                  const data = d.data();
                  if (data.activated_at) {
                    const t = new Date(data.activated_at).getTime();
                    if (t < earliestTime) earliestTime = t;
                  }
                });
                const initTime = new Date(earliestTime).toISOString();
                try {
                  await updateDoc(docRef, { roi_cycle_start: initTime });
                } catch (e) {
                  console.warn("[ROI Auto-Heal] Failed:", e);
                }
              }
            }).catch(err => {
              console.warn("[ROI Auto-Heal] Fetch error:", err);
            });
          }

          if (cycleStartStr && !isRoiDisabled) {
            checkAndProcessROI(firebaseUser, docRef, profileData);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        // If snapshot fails with permission error, retry silently
        if (error.message.includes('permission')) {
          if (retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 500;
            setTimeout(() => fetchProfileWithRetry(firebaseUser, retryCount + 1), delay);
          } else {
            console.error("Max retries reached for profile fetch", error);
            setLoading(false);
          }
        } else {
          console.error("Profile subscription error:", error);
          setLoading(false);
        }
      });

      unsubscribeProfileRef.current = unsubscribe;
    } catch (err: any) {
      if (err.message.includes('permission') && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 500;
        setTimeout(() => fetchProfileWithRetry(firebaseUser, retryCount + 1), delay);
      } else {
        console.error("Fetch profile error:", err);
        setLoading(false);
      }
    }
  }, [checkAndProcessROI]);

  useEffect(() => {
    if (!user || !profile) return;
    
    // Immediate silent run on focus/mount
    const docRef = doc(db, 'users', user.uid);
    checkAndProcessROI(user, docRef, profile);
    
    const interval = setInterval(() => {
      const cycleStartStr = profile.roi_cycle_start;
      const isRoiDisabled = profile.roi_disabled === true;
      if (cycleStartStr && !isRoiDisabled) {
         checkAndProcessROI(user, docRef, profile);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [user, profile, checkAndProcessROI]);

  const syncAuthSession = useCallback(async (signedInUser?: FirebaseUser) => {
    setLoading(true);
    const targetUser = signedInUser || auth.currentUser;
    if (targetUser) {
      try {
        await targetUser.reload();
        await targetUser.getIdToken(true);
      } catch (e) {
        console.warn("Auth reload in syncAuthSession:", e);
      }
      const activeUser = auth.currentUser || targetUser;
      setUser(Object.assign(Object.create(Object.getPrototypeOf(activeUser)), activeUser));
      const isCipher = isCipherAdmin(activeUser);
      if (activeUser.emailVerified || isCipher) {
        await fetchProfileWithRetry(activeUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    } else {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [fetchProfileWithRetry]);

  const refreshAuth = useCallback(async () => {
    await syncAuthSession();
  }, [syncAuthSession]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          await firebaseUser.reload();
        } catch (e) {
          console.warn("Auth reload in onAuthStateChanged:", e);
        }
        const activeUser = auth.currentUser || firebaseUser;
        setUser(Object.assign(Object.create(Object.getPrototypeOf(activeUser)), activeUser));
        
        const isCipher = isCipherAdmin(activeUser);
        if (activeUser.emailVerified || isCipher) {
          await fetchProfileWithRetry(activeUser);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } else {
        if (unsubscribeProfileRef.current) {
          unsubscribeProfileRef.current();
          unsubscribeProfileRef.current = null;
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
      }
    };
  }, [fetchProfileWithRetry]);

  const logout = useCallback(async () => {
    if (unsubscribeProfileRef.current) {
      unsubscribeProfileRef.current();
      unsubscribeProfileRef.current = null;
    }
    await auth.signOut();
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveInvestments([]);
      return;
    }

    const isCipher = isCipherAdmin(user);
                     
    if (!user.emailVerified && !isCipher) {
      setActiveInvestments([]);
      return;
    }

    const q = query(
      collection(db, 'investments'),
      where('user_id', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveInvestments(list);
    }, (err) => {
      console.warn("[AuthContext:ActiveInvestments] subscription blocked:", err);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCompoundTransactions([]);
      return;
    }

    const isCipher = isCipherAdmin(user);
                     
    if (!user.emailVerified && !isCipher) {
      setCompoundTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      where('type', '==', 'compound')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompoundTransactions(list);
    }, (err) => {
      console.warn("[AuthContext:CompoundTransactions] subscription blocked:", err);
    });

    return () => unsub();
  }, [user]);

  const dynamicPlans = plans.map(p => {
    const isWeekend = isWeekendROI();
    let dynamicRoi = p.roi;
    const planId = (p.id || p.name || '').toLowerCase();
    if (planId.includes('regular')) {
      dynamicRoi = isWeekend ? 0.01 : 0.02;
    } else if (planId.includes('premium')) {
      dynamicRoi = isWeekend ? 0.015 : 0.025;
    } else if (planId.includes('elite')) {
      dynamicRoi = isWeekend ? 0.015 : 0.03;
    }
    return { ...p, roi: dynamicRoi };
  });

  const lastValidRoiRef = useRef<number>(0);

  const derivedCompoundedAmounts = React.useMemo(() => {
    const profileCompounds = profile?.withdraw_methods?.compounded_amounts || profile?.compounded_amounts || [];
    
    // Group compound transactions by created_at to derive compounded amounts
    const txGroups: { [createdAt: string]: number } = {};
    compoundTransactions.forEach(tx => {
      const createdAt = tx.created_at || '';
      const amount = tx.amount || 0;
      if (createdAt && amount > 0) {
        txGroups[createdAt] = (txGroups[createdAt] || 0) + amount;
      }
    });
    const txCompounds = Object.values(txGroups).filter(val => val > 0);

    return txCompounds.length > 0 ? txCompounds : profileCompounds;
  }, [profile?.withdraw_methods?.compounded_amounts, profile?.compounded_amounts, compoundTransactions]);

  const expectedDailyRoi = React.useMemo(() => {
    const rawRoi = calculateExpectedDailyRoi(
      activeInvestments, 
      derivedCompoundedAmounts, 
      dynamicPlans,
      profile,
      globalRoiConfig
    );
    if (rawRoi > 0) {
      lastValidRoiRef.current = rawRoi;
      return rawRoi;
    }
    if (profile?.migration_status === 'accepted') {
      return rawRoi;
    }
    if (activeInvestments.length === 0) {
      return 0;
    }
    return lastValidRoiRef.current || 0;
  }, [activeInvestments, derivedCompoundedAmounts, dynamicPlans, profile, globalRoiConfig]);

  useEffect(() => {
    if (!loading) {
      const loader = document.getElementById('startup-loader');
      if (loader) {
        loader.style.transition = 'opacity 0.25s ease-out';
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        const timeout = setTimeout(() => {
          loader.remove();
        }, 250);
        return () => clearTimeout(timeout);
      }
    }
  }, [loading]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshAuth, syncAuthSession, plans: dynamicPlans, expectedDailyRoi }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
