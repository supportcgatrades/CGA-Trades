import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  increment,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';

export type LoanApplicationStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Under Review' 
  | 'Additional Information Required' 
  | 'Approved' 
  | 'Declined' 
  | 'Offer Available' 
  | 'Accepted' 
  | 'Disbursed' 
  | 'Active' 
  | 'Paid Off' 
  | 'Cancelled';

export type LoanStatus = 'Active' | 'Paid Off' | 'Suspended' | 'Defaulted';

export type LoanTransactionType = 
  | 'loan_application'
  | 'loan_approval'
  | 'loan_disbursement'
  | 'loan_payment'
  | 'principal_payment'
  | 'interest_payment'
  | 'loan_fee'
  | 'loan_adjustment'
  | 'loan_payoff';

export interface LoanProductDefinition {
  id: string;
  name: string;
  category: 'personal' | 'business' | 'property' | 'specialized';
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  termOptions: number[]; // e.g. [12, 24, 36, 48, 60]
  baseInterestRate: number; // e.g. 5.9 for 5.9%
  applicationFee: number; // 0 for most
  fundingSpeed: string; // e.g. "24–48 hours"
  requiresCollateral: boolean;
  eligiblePurposes: string[];
}

export const LOAN_PRODUCTS: LoanProductDefinition[] = [
  {
    id: 'personal',
    name: 'Personal Loans',
    category: 'personal',
    shortDescription: 'Flexible financing for personal expenses and general financial needs.',
    fullDescription: 'Manage life events, unexpected bills, or personal projects with fixed monthly installments and competitive interest rates.',
    iconName: 'User',
    minAmount: 1000,
    maxAmount: 100000,
    minTermMonths: 12,
    maxTermMonths: 60,
    termOptions: [12, 24, 36, 48, 60],
    baseInterestRate: 5.9,
    applicationFee: 0,
    fundingSpeed: '24–48 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Personal expenses', 'Debt consolidation', 'Home improvement', 'Relocation', 'Major purchase', 'Other eligible purpose']
  },
  {
    id: 'business',
    name: 'Business Loans',
    category: 'business',
    shortDescription: 'For business operations, expansion, working capital, and business-related expenses.',
    fullDescription: 'Fuel company growth, acquire inventory, upgrade infrastructure, or accelerate marketing with structured business capital.',
    iconName: 'Briefcase',
    minAmount: 10000,
    maxAmount: 500000,
    minTermMonths: 12,
    maxTermMonths: 84,
    termOptions: [12, 24, 36, 48, 60, 84],
    baseInterestRate: 6.4,
    applicationFee: 0,
    fundingSpeed: '2–3 business days',
    requiresCollateral: false,
    eligiblePurposes: ['Business expansion', 'Working capital', 'Inventory purchase', 'Marketing campaign', 'Operational overhead', 'Other eligible purpose']
  },
  {
    id: 'auto',
    name: 'Auto Loans',
    category: 'personal',
    shortDescription: 'For purchasing a vehicle with predictable low rates.',
    fullDescription: 'Finance new or pre-owned personal or commercial vehicles with structured amortization and streamlined ownership transfer.',
    iconName: 'Car',
    minAmount: 5000,
    maxAmount: 150000,
    minTermMonths: 24,
    maxTermMonths: 72,
    termOptions: [24, 36, 48, 60, 72],
    baseInterestRate: 4.8,
    applicationFee: 0,
    fundingSpeed: '24–48 hours',
    requiresCollateral: true,
    eligiblePurposes: ['New vehicle purchase', 'Pre-owned vehicle', 'Fleet vehicle', 'Vehicle refinancing', 'Other eligible purpose']
  },
  {
    id: 'home',
    name: 'Home Loans',
    category: 'property',
    shortDescription: 'For home purchase and related residential financing.',
    fullDescription: 'Make your homeownership vision a reality with competitive fixed rates and structured residential lending programs.',
    iconName: 'Home',
    minAmount: 50000,
    maxAmount: 1500000,
    minTermMonths: 60,
    maxTermMonths: 360,
    termOptions: [60, 120, 180, 240, 360],
    baseInterestRate: 5.2,
    applicationFee: 0,
    fundingSpeed: '3–5 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Primary residence purchase', 'Secondary home', 'Residential acquisition', 'Other eligible purpose']
  },
  {
    id: 'mortgage',
    name: 'Mortgage Loans',
    category: 'property',
    shortDescription: 'For eligible residential property financing.',
    fullDescription: 'Long-term secured residential mortgages designed for stability, predictable fixed payments, and equity growth.',
    iconName: 'Building2',
    minAmount: 100000,
    maxAmount: 2500000,
    minTermMonths: 120,
    maxTermMonths: 360,
    termOptions: [120, 180, 240, 360],
    baseInterestRate: 5.1,
    applicationFee: 0,
    fundingSpeed: '5–7 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Single-family mortgage', 'Multi-unit residential', 'Mortgage refinancing', 'Other eligible purpose']
  },
  {
    id: 'home-equity',
    name: 'Home Equity Loans',
    category: 'property',
    shortDescription: 'For borrowing against available home equity where applicable.',
    fullDescription: 'Convert accumulated home equity into a lump-sum payout with fixed interest rates and predictable monthly payments.',
    iconName: 'Layers',
    minAmount: 15000,
    maxAmount: 350000,
    minTermMonths: 36,
    maxTermMonths: 180,
    termOptions: [36, 60, 120, 180],
    baseInterestRate: 6.2,
    applicationFee: 0,
    fundingSpeed: '3–5 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Home renovation', 'Debt consolidation', 'Major expense', 'Education funding', 'Other eligible purpose']
  },
  {
    id: 'heloc',
    name: 'HELOC',
    category: 'property',
    shortDescription: 'Home Equity Line of Credit with revolving draw flexibility.',
    fullDescription: 'A flexible revolving line of credit secured by your home. Draw funds as you need them and pay interest only on what you use.',
    iconName: 'CreditCard',
    minAmount: 20000,
    maxAmount: 500000,
    minTermMonths: 60,
    maxTermMonths: 240,
    termOptions: [60, 120, 180, 240],
    baseInterestRate: 6.5,
    applicationFee: 0,
    fundingSpeed: '3–5 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Ongoing home renovations', 'Emergency reserve', 'Investment opportunity', 'Flexible capital draw', 'Other eligible purpose']
  },
  {
    id: 'student',
    name: 'Student Loans',
    category: 'personal',
    shortDescription: 'For eligible education-related expenses.',
    fullDescription: 'Invest in your academic future with student loans featuring competitive deferred or in-school repayment options.',
    iconName: 'GraduationCap',
    minAmount: 2000,
    maxAmount: 80000,
    minTermMonths: 24,
    maxTermMonths: 120,
    termOptions: [24, 36, 60, 84, 120],
    baseInterestRate: 4.5,
    applicationFee: 0,
    fundingSpeed: '24–48 hours',
    requiresCollateral: false,
    eligiblePurposes: ['University tuition', 'Living expenses', 'Books & technology', 'Graduate studies', 'Vocational training', 'Other eligible purpose']
  },
  {
    id: 'debt-consolidation',
    name: 'Debt Consolidation Loans',
    category: 'personal',
    shortDescription: 'For consolidating eligible debts into one simple payment.',
    fullDescription: 'Streamline multiple high-interest credit cards or loans into one predictable monthly payment with lower overall interest.',
    iconName: 'Merge',
    minAmount: 3000,
    maxAmount: 100000,
    minTermMonths: 12,
    maxTermMonths: 60,
    termOptions: [12, 24, 36, 48, 60],
    baseInterestRate: 5.8,
    applicationFee: 0,
    fundingSpeed: '24–48 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Credit card payoff', 'Multiple loan consolidation', 'High-interest debt restructuring', 'Other eligible purpose']
  },
  {
    id: 'emergency',
    name: 'Emergency Loans',
    category: 'personal',
    shortDescription: 'For unexpected personal expenses with fast-track processing.',
    fullDescription: 'Rapid, hassle-free financing designed to bridge critical unexpected expenses, vehicle repairs, or urgent personal needs.',
    iconName: 'AlertCircle',
    minAmount: 500,
    maxAmount: 15000,
    minTermMonths: 6,
    maxTermMonths: 36,
    termOptions: [6, 12, 18, 24, 36],
    baseInterestRate: 7.2,
    applicationFee: 0,
    fundingSpeed: 'Instant – 24 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Urgent home repair', 'Vehicle breakdown', 'Family emergency', 'Unexpected utility bill', 'Other eligible purpose']
  },
  {
    id: 'medical',
    name: 'Medical Loans',
    category: 'personal',
    shortDescription: 'For eligible healthcare and medical expenses.',
    fullDescription: 'Focus on recovery without financial stress. Finance hospital bills, dental work, elective procedures, or therapy.',
    iconName: 'HeartPulse',
    minAmount: 1000,
    maxAmount: 50000,
    minTermMonths: 12,
    maxTermMonths: 48,
    termOptions: [12, 24, 36, 48],
    baseInterestRate: 5.6,
    applicationFee: 0,
    fundingSpeed: '24 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Surgical procedures', 'Dental care', 'Fertility treatments', 'Vision care', 'Medical therapy', 'Other eligible purpose']
  },
  {
    id: 'construction',
    name: 'Construction Loans',
    category: 'property',
    shortDescription: 'For eligible construction projects and property development.',
    fullDescription: 'Short-term development financing that disburses funds in stages as construction milestones are completed.',
    iconName: 'Hammer',
    minAmount: 50000,
    maxAmount: 1000000,
    minTermMonths: 12,
    maxTermMonths: 36,
    termOptions: [12, 18, 24, 36],
    baseInterestRate: 6.8,
    applicationFee: 0,
    fundingSpeed: '3–5 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Custom home build', 'Commercial building construction', 'Major structural renovation', 'Other eligible purpose']
  },
  {
    id: 'equipment-financing',
    name: 'Equipment Financing',
    category: 'business',
    shortDescription: 'For purchasing business or professional equipment.',
    fullDescription: 'Acquire essential machinery, diagnostic systems, technology hardware, or specialized commercial equipment without tying up capital.',
    iconName: 'Cpu',
    minAmount: 10000,
    maxAmount: 350000,
    minTermMonths: 24,
    maxTermMonths: 72,
    termOptions: [24, 36, 48, 60, 72],
    baseInterestRate: 5.9,
    applicationFee: 0,
    fundingSpeed: '2–3 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Industrial machinery', 'Technology hardware', 'Office & medical equipment', 'Commercial vehicles', 'Other eligible purpose']
  },
  {
    id: 'commercial-real-estate',
    name: 'Commercial Real Estate Loans',
    category: 'property',
    shortDescription: 'For eligible commercial property financing.',
    fullDescription: 'Finance the acquisition, development, or refinancing of commercial real estate, office parks, retail centers, or warehouses.',
    iconName: 'Landmark',
    minAmount: 150000,
    maxAmount: 5000000,
    minTermMonths: 60,
    maxTermMonths: 240,
    termOptions: [60, 120, 180, 240],
    baseInterestRate: 5.9,
    applicationFee: 0,
    fundingSpeed: '5–10 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Office building acquisition', 'Retail property purchase', 'Industrial warehouse', 'Multi-tenant commercial', 'Other eligible purpose']
  },
  {
    id: 'agricultural-farm',
    name: 'Agricultural / Farm Loans',
    category: 'specialized',
    shortDescription: 'For eligible agricultural and farming activities.',
    fullDescription: 'Specialized financing for agribusinesses, crop cycles, livestock purchases, agricultural land acquisitions, and farm equipment.',
    iconName: 'Tractor',
    minAmount: 10000,
    maxAmount: 750000,
    minTermMonths: 12,
    maxTermMonths: 120,
    termOptions: [12, 24, 36, 60, 84, 120],
    baseInterestRate: 5.3,
    applicationFee: 0,
    fundingSpeed: '3–5 business days',
    requiresCollateral: true,
    eligiblePurposes: ['Farm machinery & tractors', 'Livestock procurement', 'Seed & fertilizer operating costs', 'Farmland acquisition', 'Other eligible purpose']
  },
  {
    id: 'working-capital',
    name: 'Working Capital Loans',
    category: 'business',
    shortDescription: 'For eligible business working-capital needs.',
    fullDescription: 'Cover day-to-day operational cash flow, payroll, and seasonal inventory needs without sacrificing long-term equity.',
    iconName: 'Coins',
    minAmount: 5000,
    maxAmount: 250000,
    minTermMonths: 6,
    maxTermMonths: 36,
    termOptions: [6, 12, 18, 24, 36],
    baseInterestRate: 6.9,
    applicationFee: 0,
    fundingSpeed: '24–48 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Payroll bridge', 'Accounts payable', 'Seasonal inventory spike', 'Vendor invoice settlement', 'Other eligible purpose']
  },
  {
    id: 'startup',
    name: 'Startup Loans',
    category: 'business',
    shortDescription: 'For eligible business startup financing.',
    fullDescription: 'Turn entrepreneurial vision into viable enterprise with seed loans designed for newly incorporated ventures and founders.',
    iconName: 'Rocket',
    minAmount: 5000,
    maxAmount: 150000,
    minTermMonths: 12,
    maxTermMonths: 60,
    termOptions: [12, 24, 36, 48, 60],
    baseInterestRate: 7.5,
    applicationFee: 0,
    fundingSpeed: '2–4 business days',
    requiresCollateral: false,
    eligiblePurposes: ['Product prototyping', 'Initial corporate setup', 'Early team hiring', 'Launch marketing', 'Other eligible purpose']
  },
  {
    id: 'line-of-credit',
    name: 'Line of Credit',
    category: 'specialized',
    shortDescription: 'A revolving borrowing facility where applicable.',
    fullDescription: 'Pre-approved revolving capital that gives you financial freedom. Draw money when you need it, repay, and draw again.',
    iconName: 'RefreshCw',
    minAmount: 2500,
    maxAmount: 100000,
    minTermMonths: 12,
    maxTermMonths: 48,
    termOptions: [12, 24, 36, 48],
    baseInterestRate: 6.8,
    applicationFee: 0,
    fundingSpeed: '24 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Emergency cash buffer', 'Flexible borrowing reserve', 'Short-term bridge funding', 'Other eligible purpose']
  },
  {
    id: 'secured',
    name: 'Secured Loans',
    category: 'specialized',
    shortDescription: 'Loans backed by eligible collateral with reduced rates.',
    fullDescription: 'Leverage savings, deposits, investments, or physical assets as collateral to unlock significantly lower interest rates and higher borrowing limits.',
    iconName: 'ShieldCheck',
    minAmount: 5000,
    maxAmount: 500000,
    minTermMonths: 12,
    maxTermMonths: 84,
    termOptions: [12, 24, 36, 48, 60, 84],
    baseInterestRate: 4.9,
    applicationFee: 0,
    fundingSpeed: '24–48 hours',
    requiresCollateral: true,
    eligiblePurposes: ['Asset-backed borrowing', 'Low-rate debt refinance', 'Major financial milestone', 'Other eligible purpose']
  },
  {
    id: 'unsecured',
    name: 'Unsecured Loans',
    category: 'specialized',
    shortDescription: 'Loans that do not require collateral, subject to eligibility.',
    fullDescription: 'Borrow without pledging collateral. Fast, straightforward approval based solely on financial standing and credit profile.',
    iconName: 'Unlock',
    minAmount: 1000,
    maxAmount: 75000,
    minTermMonths: 12,
    maxTermMonths: 60,
    termOptions: [12, 24, 36, 48, 60],
    baseInterestRate: 6.7,
    applicationFee: 0,
    fundingSpeed: '24 hours',
    requiresCollateral: false,
    eligiblePurposes: ['Personal general financing', 'Fast liquid capital', 'Unplanned bill settlement', 'Other eligible purpose']
  }
];

export interface LoanRepaymentScheduleItem {
  paymentNumber: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: 'Paid' | 'Upcoming' | 'Overdue';
}

export interface LoanApplication {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  loan_type: string;
  requested_amount: number;
  requested_term_months: number;
  purpose: string;
  employment_status: string;
  employer: string;
  monthly_income: number;
  monthly_expenses: number;
  residential_status: string;
  address: string;
  financial_details?: {
    bank_name?: string;
    account_number?: string;
    routing_number?: string;
    collateral_description?: string;
    collateral_estimated_value?: number;
    notes?: string;
  };
  status: LoanApplicationStatus;
  review_notes?: string;
  approved_amount?: number;
  approved_term_months?: number;
  approved_interest_rate?: number;
  approved_monthly_payment?: number;
  approved_at?: string;
  approved_by?: string;
  offer_accepted_at?: string;
  disbursed_at?: string;
  assigned_reviewer?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  application_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  loan_type: string;
  loan_name: string;
  original_amount: number;
  outstanding_balance: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  start_date: string;
  next_payment_date: string;
  maturity_date: string;
  status: LoanStatus;
  total_paid: number;
  remaining_term_months: number;
  schedule?: LoanRepaymentScheduleItem[];
  created_at: string;
  updated_at: string;
}

export interface LoanTransaction {
  id: string;
  loan_id?: string;
  application_id?: string;
  user_id: string;
  user_name?: string;
  type: LoanTransactionType;
  amount: number;
  principal_amount?: number;
  interest_amount?: number;
  fee_amount?: number;
  status: 'Completed' | 'Pending' | 'Failed';
  description: string;
  payment_method?: string;
  balance_after?: number;
  created_at: string;
}

export interface LoanAuditLog {
  id: string;
  loan_id?: string;
  application_id?: string;
  user_id: string;
  action: string;
  decision?: string;
  amount?: number;
  term_months?: number;
  interest_rate?: number;
  reason?: string;
  actor: string;
  timestamp: string;
}

// ----------------------------------------------------------------------
// FINANCIAL CALCULATOR UTILITIES
// ----------------------------------------------------------------------

export function calculateMonthlyPayment(amount: number, annualRatePct: number, termMonths: number): number {
  if (amount <= 0 || termMonths <= 0) return 0;
  const monthlyRate = (annualRatePct / 100) / 12;
  if (monthlyRate === 0) return Math.round((amount / termMonths) * 100) / 100;
  
  // Standard Amortization Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = (amount * monthlyRate * factor) / (factor - 1);
  return Math.round(payment * 100) / 100;
}

export function calculateLoanEstimates(amount: number, annualRatePct: number, termMonths: number) {
  const monthlyPayment = calculateMonthlyPayment(amount, annualRatePct, termMonths);
  const totalPayment = Math.round(monthlyPayment * termMonths * 100) / 100;
  const totalInterest = Math.max(0, Math.round((totalPayment - amount) * 100) / 100);
  return {
    monthlyPayment,
    totalPayment,
    totalInterest
  };
}

export function generateRepaymentSchedule(
  amount: number, 
  annualRatePct: number, 
  termMonths: number, 
  startDateStr?: string
): LoanRepaymentScheduleItem[] {
  const monthlyPayment = calculateMonthlyPayment(amount, annualRatePct, termMonths);
  const monthlyRate = (annualRatePct / 100) / 12;
  let remaining = amount;
  const schedule: LoanRepaymentScheduleItem[] = [];

  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  for (let i = 1; i <= termMonths; i++) {
    const interest = Math.round(remaining * monthlyRate * 100) / 100;
    let principal = Math.round((monthlyPayment - interest) * 100) / 100;
    
    if (i === termMonths || principal > remaining) {
      principal = remaining;
    }
    
    remaining = Math.max(0, Math.round((remaining - principal) * 100) / 100);

    const dueDate = new Date(baseDate);
    dueDate.setMonth(baseDate.getMonth() + i);

    schedule.push({
      paymentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: Math.round((principal + interest) * 100) / 100,
      principal,
      interest,
      remainingBalance: remaining,
      status: 'Upcoming'
    });
  }

  return schedule;
}

// ----------------------------------------------------------------------
// FIRESTORE SUBSCRIPTIONS & CLIENT OPERATIONS
// ----------------------------------------------------------------------

export function subscribeUserLoans(
  userId: string, 
  onUpdate: (loans: Loan[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, 'loans'),
    where('user_id', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const loans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Loan));
    loans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    onUpdate(loans);
  }, (err) => {
    console.error("User loans sync error:", err);
    if (onError) onError(err);
  });
}

export function subscribeUserApplications(
  userId: string,
  onUpdate: (apps: LoanApplication[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, 'loan_applications'),
    where('user_id', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication));
    apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    onUpdate(apps);
  }, (err) => {
    console.error("User loan applications sync error:", err);
    if (onError) onError(err);
  });
}

export function subscribeUserLoanTransactions(
  userId: string,
  onUpdate: (txs: LoanTransaction[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, 'loan_transactions'),
    where('user_id', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanTransaction));
    txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    onUpdate(txs);
  }, (err) => {
    console.error("User loan transactions sync error:", err);
    if (onError) onError(err);
  });
}

// ----------------------------------------------------------------------
// USER SUBMISSION & ACTIONS
// ----------------------------------------------------------------------

export async function submitLoanApplication(
  appData: Omit<LoanApplication, 'id' | 'status' | 'created_at' | 'updated_at'>,
  user: any
): Promise<string> {
  if (!user || user.uid !== appData.user_id) {
    throw new Error("Authentication required to submit loan application.");
  }

  const appId = `APP-LN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const fullApp: LoanApplication = {
    ...appData,
    id: appId,
    status: 'Submitted',
    created_at: now,
    updated_at: now
  };

  try {
    const appRef = doc(db, 'loan_applications', appId);
    await setDoc(appRef, fullApp);

    // Record initial transaction event
    const txRef = doc(collection(db, 'loan_transactions'));
    await setDoc(txRef, {
      id: txRef.id,
      application_id: appId,
      user_id: user.uid,
      user_name: appData.user_name || user.email || 'Applicant',
      type: 'loan_application',
      amount: appData.requested_amount,
      status: 'Completed',
      description: `Submitted application for ${appData.loan_type} loan ($${appData.requested_amount.toLocaleString()})`,
      created_at: now
    });

    // Record audit log
    const auditRef = doc(collection(db, 'loan_audit_logs'));
    await setDoc(auditRef, {
      id: auditRef.id,
      application_id: appId,
      user_id: user.uid,
      action: 'Loan Application Submitted',
      amount: appData.requested_amount,
      term_months: appData.requested_term_months,
      actor: user.email || user.uid,
      timestamp: now
    });

    return appId;
  } catch (err: any) {
    console.error("Loan application submission failed:", err);
    handleFirestoreError(err, OperationType.WRITE, `loan_applications/${appId}`);
    throw err;
  }
}

export async function acceptLoanOffer(
  applicationId: string,
  user: any
): Promise<void> {
  if (!user) throw new Error("Authentication required.");

  const appRef = doc(db, 'loan_applications', applicationId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const appSnap = await transaction.get(appRef);
    if (!appSnap.exists()) throw new Error("Application not found.");

    const app = appSnap.data() as LoanApplication;
    if (app.user_id !== user.uid) throw new Error("Unauthorized access to this application.");
    if (app.status !== 'Offer Available' && app.status !== 'Approved') {
      throw new Error("No approved offer available to accept.");
    }

    transaction.update(appRef, {
      status: 'Accepted',
      offer_accepted_at: now,
      updated_at: now
    });

    const auditRef = doc(collection(db, 'loan_audit_logs'));
    transaction.set(auditRef, {
      id: auditRef.id,
      application_id: applicationId,
      user_id: user.uid,
      action: 'Loan Offer Accepted by Applicant',
      amount: app.approved_amount || app.requested_amount,
      term_months: app.approved_term_months || app.requested_term_months,
      interest_rate: app.approved_interest_rate || 5.9,
      actor: user.email || user.uid,
      timestamp: now
    });
  });
}

export async function makeLoanPayment(
  loanId: string,
  paymentAmount: number,
  user: any,
  profile: any
): Promise<void> {
  if (!user) throw new Error("Authentication required.");
  if (paymentAmount <= 0) throw new Error("Payment amount must be greater than zero.");

  const availableBalance = Number(profile?.available_balance || 0);
  if (availableBalance < paymentAmount) {
    throw new Error(`Insufficient Available CGA Balance ($${availableBalance.toFixed(2)}). Please fund your balance first.`);
  }

  const loanRef = doc(db, 'loans', loanId);
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const [loanSnap, userSnap] = await Promise.all([
      transaction.get(loanRef),
      transaction.get(userRef)
    ]);

    if (!loanSnap.exists()) throw new Error("Loan not found.");
    if (!userSnap.exists()) throw new Error("User record missing.");

    const loan = loanSnap.data() as Loan;
    if (loan.user_id !== user.uid) throw new Error("Unauthorized access to this loan.");
    if (loan.status === 'Paid Off') throw new Error("This loan is already fully paid off.");

    const currentUserData = userSnap.data();
    const liveAvailable = Number(currentUserData.available_balance || 0);
    if (liveAvailable < paymentAmount) {
      throw new Error(`Insufficient Available CGA Balance ($${liveAvailable.toFixed(2)}).`);
    }

    // Calculate principal and interest division
    const monthlyRate = (loan.interest_rate / 100) / 12;
    const interestPortion = Math.min(paymentAmount, Math.round(loan.outstanding_balance * monthlyRate * 100) / 100);
    const principalPortion = Math.round((paymentAmount - interestPortion) * 100) / 100;

    const newOutstanding = Math.max(0, Math.round((loan.outstanding_balance - principalPortion) * 100) / 100);
    const newTotalPaid = Math.round(((loan.total_paid || 0) + paymentAmount) * 100) / 100;
    const isFullyPaid = newOutstanding <= 0;

    // Update schedule if present
    const updatedSchedule = (loan.schedule || []).map((item, idx) => {
      if (item.status === 'Upcoming' && idx === 0) {
        return { ...item, status: 'Paid' as const };
      }
      return item;
    });

    // 1. Deduct from user available balance
    transaction.update(userRef, {
      available_balance: increment(-paymentAmount)
    });

    // 2. Update loan record
    transaction.update(loanRef, {
      outstanding_balance: newOutstanding,
      total_paid: newTotalPaid,
      status: isFullyPaid ? 'Paid Off' : 'Active',
      remaining_term_months: Math.max(0, loan.remaining_term_months - 1),
      schedule: updatedSchedule,
      updated_at: now
    });

    // 3. Post dedicated loan transaction
    const txRef = doc(collection(db, 'loan_transactions'));
    transaction.set(txRef, {
      id: txRef.id,
      loan_id: loanId,
      user_id: user.uid,
      user_name: profile?.name || user.email || 'Borrower',
      type: isFullyPaid ? 'loan_payoff' : 'loan_payment',
      amount: paymentAmount,
      principal_amount: principalPortion,
      interest_amount: interestPortion,
      status: 'Completed',
      description: isFullyPaid 
        ? `Full loan payoff for ${loan.loan_name} ($${paymentAmount.toFixed(2)})` 
        : `Monthly repayment on ${loan.loan_name} ($${paymentAmount.toFixed(2)})`,
      payment_method: 'available_balance',
      balance_after: newOutstanding,
      created_at: now
    });

    // 4. Log audit trail
    const auditRef = doc(collection(db, 'loan_audit_logs'));
    transaction.set(auditRef, {
      id: auditRef.id,
      loan_id: loanId,
      user_id: user.uid,
      action: isFullyPaid ? 'Loan Payoff Completed' : 'Loan Repayment Processed',
      amount: paymentAmount,
      reason: `Paid $${paymentAmount.toFixed(2)} via Available Balance (Principal: $${principalPortion.toFixed(2)}, Interest: $${interestPortion.toFixed(2)})`,
      actor: user.email || user.uid,
      timestamp: now
    });
  });
}

// ----------------------------------------------------------------------
// ADMIN OPERATIONS (CIPHER CONTROL PANEL)
// ----------------------------------------------------------------------

export function subscribeAllLoanApplications(
  onUpdate: (apps: LoanApplication[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, 'loan_applications'),
    orderBy('created_at', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication));
    onUpdate(apps);
  }, (err) => {
    console.error("Admin applications sync error:", err);
    if (onError) onError(err);
  });
}

export function subscribeAllLoans(
  onUpdate: (loans: Loan[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, 'loans'),
    orderBy('created_at', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const loans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Loan));
    onUpdate(loans);
  }, (err) => {
    console.error("Admin loans sync error:", err);
    if (onError) onError(err);
  });
}

export function subscribeLoanAuditLogs(
  loanOrAppId?: string,
  onUpdate?: (logs: LoanAuditLog[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, 'loan_audit_logs'),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    let logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanAuditLog));
    if (loanOrAppId) {
      logs = logs.filter(l => l.loan_id === loanOrAppId || l.application_id === loanOrAppId);
    }
    if (onUpdate) onUpdate(logs);
  }, (err) => {
    console.error("Admin audit logs sync error:", err);
    if (onError) onError(err);
  });
}

export async function adminReviewLoanApplication(
  applicationId: string,
  decision: LoanApplicationStatus,
  reviewData: {
    approvedAmount?: number;
    approvedTermMonths?: number;
    approvedInterestRate?: number;
    notes?: string;
  },
  adminEmail: string
): Promise<void> {
  const appRef = doc(db, 'loan_applications', applicationId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const appSnap = await transaction.get(appRef);
    if (!appSnap.exists()) throw new Error("Application not found.");

    const app = appSnap.data() as LoanApplication;
    
    const approvedAmount = reviewData.approvedAmount ?? app.requested_amount;
    const approvedTerm = reviewData.approvedTermMonths ?? app.requested_term_months;
    const approvedRate = reviewData.approvedInterestRate ?? 5.9;
    const approvedMonthly = calculateMonthlyPayment(approvedAmount, approvedRate, approvedTerm);

    const updatePayload: Partial<LoanApplication> = {
      status: decision,
      review_notes: reviewData.notes || '',
      assigned_reviewer: adminEmail,
      updated_at: now
    };

    if (decision === 'Approved' || decision === 'Offer Available') {
      updatePayload.approved_amount = approvedAmount;
      updatePayload.approved_term_months = approvedTerm;
      updatePayload.approved_interest_rate = approvedRate;
      updatePayload.approved_monthly_payment = approvedMonthly;
      updatePayload.approved_at = now;
      updatePayload.approved_by = adminEmail;
    }

    transaction.update(appRef, updatePayload);

    // Audit log entry
    const auditRef = doc(collection(db, 'loan_audit_logs'));
    transaction.set(auditRef, {
      id: auditRef.id,
      application_id: applicationId,
      user_id: app.user_id,
      action: `Application Status Changed to ${decision}`,
      decision,
      amount: approvedAmount,
      term_months: approvedTerm,
      interest_rate: approvedRate,
      reason: reviewData.notes || `Administrative review decision by ${adminEmail}`,
      actor: adminEmail,
      timestamp: now
    });

    // Notify user
    const notifRef = doc(collection(db, 'notifications'));
    let notifTitle = 'Loan Application Update';
    let notifMessage = `Your loan application for ${app.loan_type} has been updated to ${decision}.`;

    if (decision === 'Offer Available' || decision === 'Approved') {
      notifTitle = 'Loan Offer Ready for Acceptance! 🎉';
      notifMessage = `Congratulations! Your ${app.loan_type} loan of $${approvedAmount.toLocaleString()} has been approved at ${approvedRate}% APR for ${approvedTerm} months. Review and accept your offer now.`;
    } else if (decision === 'Declined') {
      notifTitle = 'Loan Application Decision';
      notifMessage = `Your application for a ${app.loan_type} loan was not approved at this time. Note: ${reviewData.notes || 'Eligibility criteria not met.'}`;
    } else if (decision === 'Additional Information Required') {
      notifTitle = 'Action Required on Loan Application ⚠️';
      notifMessage = `Additional details are needed for your ${app.loan_type} loan application: ${reviewData.notes || 'Please contact support.'}`;
    }

    transaction.set(notifRef, {
      user_id: app.user_id,
      title: notifTitle,
      message: notifMessage,
      type: decision === 'Declined' ? 'alert' : 'success',
      read: false,
      created_at: now
    });
  });
}

export async function adminDisburseLoan(
  applicationId: string,
  disbursementTarget: 'available_balance' | 'external_payout',
  adminEmail: string
): Promise<string> {
  const appRef = doc(db, 'loan_applications', applicationId);
  const now = new Date().toISOString();
  const loanId = `LN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  await runTransaction(db, async (transaction) => {
    const appSnap = await transaction.get(appRef);
    if (!appSnap.exists()) throw new Error("Application not found.");

    const app = appSnap.data() as LoanApplication;
    const userRef = doc(db, 'users', app.user_id);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("User record missing.");

    const disburseAmount = app.approved_amount || app.requested_amount;
    const termMonths = app.approved_term_months || app.requested_term_months;
    const rate = app.approved_interest_rate || 5.9;
    const monthlyPayment = app.approved_monthly_payment || calculateMonthlyPayment(disburseAmount, rate, termMonths);

    // Create Amortization Schedule
    const schedule = generateRepaymentSchedule(disburseAmount, rate, termMonths, now);
    const nextPayment = schedule.length > 0 ? schedule[0].dueDate : '';
    const maturityDate = schedule.length > 0 ? schedule[schedule.length - 1].dueDate : '';

    // Product name lookup
    const prod = LOAN_PRODUCTS.find(p => p.id === app.loan_type);
    const loanName = prod ? prod.name : `${app.loan_type.toUpperCase()} Loan`;

    // 1. Create active loan document
    const loanRef = doc(db, 'loans', loanId);
    const newLoan: Loan = {
      id: loanId,
      application_id: applicationId,
      user_id: app.user_id,
      user_name: app.user_name,
      user_email: app.user_email,
      loan_type: app.loan_type,
      loan_name: loanName,
      original_amount: disburseAmount,
      outstanding_balance: disburseAmount,
      interest_rate: rate,
      term_months: termMonths,
      monthly_payment: monthlyPayment,
      start_date: now,
      next_payment_date: nextPayment,
      maturity_date: maturityDate,
      status: 'Active',
      total_paid: 0,
      remaining_term_months: termMonths,
      schedule,
      created_at: now,
      updated_at: now
    };
    transaction.set(loanRef, newLoan);

    // 2. Disburse funds if target is Available Balance
    if (disbursementTarget === 'available_balance') {
      transaction.update(userRef, {
        available_balance: increment(disburseAmount)
      });
    }

    // 3. Update application status
    transaction.update(appRef, {
      status: 'Disbursed',
      disbursed_at: now,
      updated_at: now
    });

    // 4. Create dedicated loan disbursement transaction (SEPARATE FROM INVESTMENT INCOME)
    const txRef = doc(collection(db, 'loan_transactions'));
    transaction.set(txRef, {
      id: txRef.id,
      loan_id: loanId,
      application_id: applicationId,
      user_id: app.user_id,
      user_name: app.user_name,
      type: 'loan_disbursement',
      amount: disburseAmount,
      status: 'Completed',
      description: `Loan disbursed: $${disburseAmount.toLocaleString()} (${loanName}) via ${disbursementTarget === 'available_balance' ? 'CGA Available Balance' : 'External Wire/Payout'}`,
      payment_method: disbursementTarget,
      balance_after: disburseAmount,
      created_at: now
    });

    // 5. Audit Log Entry
    const auditRef = doc(collection(db, 'loan_audit_logs'));
    transaction.set(auditRef, {
      id: auditRef.id,
      loan_id: loanId,
      application_id: applicationId,
      user_id: app.user_id,
      action: 'Loan Disbursed',
      decision: 'Disbursed & Activated',
      amount: disburseAmount,
      term_months: termMonths,
      interest_rate: rate,
      reason: `Funds disbursed via ${disbursementTarget} by compliance officer ${adminEmail}`,
      actor: adminEmail,
      timestamp: now
    });

    // 6. User Notification
    const notifRef = doc(collection(db, 'notifications'));
    transaction.set(notifRef, {
      user_id: app.user_id,
      title: 'Loan Disbursed & Active! 🚀',
      message: `Your loan of $${disburseAmount.toLocaleString()} has been officially disbursed. You can now track your repayment schedule under My Loans.`,
      type: 'success',
      read: false,
      created_at: now
    });
  });

  return loanId;
}
