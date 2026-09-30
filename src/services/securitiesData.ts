export type AssetType = 'stock' | 'bond' | 'mutual_fund';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'pending' | 'submitted' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'failed';

export interface ChartDataPoint {
  time: string;
  price: number;
  volume?: number;
}

export interface StockAsset {
  id: string;
  type: 'stock';
  symbol: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE';
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number; // in USD
  peRatio: number;
  eps: number;
  dividendYield: number; // in percentage e.g. 0.52
  week52High: number;
  week52Low: number;
  beta: number;
  description: string;
  ceo?: string;
  headquarters?: string;
  founded?: number;
  employees?: number;
  chartData: {
    '1D': ChartDataPoint[];
    '1W': ChartDataPoint[];
    '1M': ChartDataPoint[];
    '3M': ChartDataPoint[];
    '6M': ChartDataPoint[];
    '1Y': ChartDataPoint[];
    '5Y': ChartDataPoint[];
    'MAX': ChartDataPoint[];
  };
}

export interface BondAsset {
  id: string;
  type: 'bond';
  symbol: string;
  name: string;
  issuer: string;
  category: 'government' | 'corporate' | 'municipal';
  cusip: string;
  maturityDate: string; // ISO date string e.g. "2034-05-15"
  couponRate: number; // annual percentage e.g. 4.25
  yieldToMaturity: number; // YTM annual percentage e.g. 4.48
  currentYield: number; // annual coupon / price percentage e.g. 4.31
  pricePercent: number; // % of par e.g. 98.62
  parValue: number; // standard $1,000
  priceDollars: number; // calculated parValue * (pricePercent / 100)
  minInvestment: number; // minimum $1,000 (1 bond)
  paymentFrequency: 'Annual' | 'Semi-Annual' | 'Quarterly';
  creditRating: 'AAA' | 'AA+' | 'AA' | 'AA-' | 'A+' | 'A' | 'A-' | 'BBB+' | 'BBB';
  ratingAgency: 'S&P' | "Moody's" | 'Fitch';
  callable: boolean;
  callDate?: string;
  durationYears: number;
  settlementDays: 'T+1' | 'T+2';
  accruedInterestPerBond: number; // USD accrued since last coupon
  riskProfile: 'Low' | 'Moderate' | 'Higher Yield';
  description: string;
  priceHistory: ChartDataPoint[];
}

export interface MutualFundAsset {
  id: string;
  type: 'mutual_fund';
  symbol: string;
  name: string;
  provider: string;
  category: 'Equity - Large Blend' | 'Equity - Large Growth' | 'Multi-Asset Global' | 'Fixed Income Core' | 'Thematic AI & Tech' | 'Institutional Liquidity';
  nav: number; // Net Asset Value in USD
  navDate: string; // e.g. "2026-09-25 16:00:00 EST"
  change: number;
  changePercent: number;
  expenseRatio: number; // in percentage e.g. 0.04
  minInvestment: number; // in USD e.g. 500
  aum: number; // Assets under management in USD
  riskLevel: 'Low' | 'Moderate' | 'Moderate-High' | 'High';
  distributionFrequency: 'Monthly' | 'Quarterly' | 'Annual';
  dividendYield: number; // annual %
  objective: string;
  strategy: string;
  inceptionDate: string;
  performance: {
    '1M': number;
    '3M': number;
    '6M': number;
    '1Y': number;
    '3Y': number;
    '5Y': number;
    'Since Inception': number;
  };
  topHoldings: { name: string; symbol?: string; weight: number }[];
  sectorAllocation: { sector: string; weight: number }[];
  geographicAllocation: { region: string; weight: number }[];
  chartData: {
    '1M': ChartDataPoint[];
    '3M': ChartDataPoint[];
    '6M': ChartDataPoint[];
    '1Y': ChartDataPoint[];
    '3Y': ChartDataPoint[];
    '5Y': ChartDataPoint[];
    'MAX': ChartDataPoint[];
  };
}

export interface SecuritiesOrderRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  asset_type: AssetType;
  symbol: string;
  name: string;
  side: OrderSide;
  order_type: OrderType;
  quantity: number;
  price: number;
  limit_price?: number;
  stop_price?: number;
  total_amount: number;
  fee: number;
  status: OrderStatus;
  settlement_date: string;
  execution_price?: number;
  execution_time?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SecuritiesHoldingRecord {
  id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  name: string;
  quantity: number;
  average_price: number;
  total_invested: number;
  current_price: number;
  current_value: number;
  unrealized_gain_loss: number;
  unrealized_gain_loss_pct: number;
  category: string;
  updated_at: string;
}

export interface SecuritiesWatchlistItem {
  id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  name: string;
  created_at: string;
}

// Market Status check: NYSE/NASDAQ is open Monday - Friday, 9:30 AM to 4:00 PM US Eastern Time
export function getMarketStatus(): { isOpen: boolean; nextSession: string; timezone: string } {
  try {
    const now = new Date();
    // Convert to US Eastern Time
    const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estString);
    const day = estDate.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = estDate.getHours();
    const minutes = estDate.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const openMinutes = 9 * 60 + 30; // 9:30 AM
    const closeMinutes = 16 * 60; // 4:00 PM

    const isWeekday = day >= 1 && day <= 5;
    const isTradingHours = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    const isOpen = isWeekday && isTradingHours;

    let nextSession = 'Opens Mon 9:30 AM EST';
    if (day >= 1 && day <= 4) {
      if (currentMinutes >= closeMinutes) {
        nextSession = 'Opens Tomorrow 9:30 AM EST';
      } else if (currentMinutes < openMinutes) {
        nextSession = 'Opens Today 9:30 AM EST';
      } else {
        nextSession = 'Closes Today 4:00 PM EST';
      }
    } else if (day === 5) {
      if (currentMinutes < openMinutes) {
        nextSession = 'Opens Today 9:30 AM EST';
      } else if (isOpen) {
        nextSession = 'Closes Today 4:00 PM EST';
      } else {
        nextSession = 'Opens Mon 9:30 AM EST';
      }
    }

    return {
      isOpen,
      nextSession,
      timezone: 'US Eastern (UTC-5)'
    };
  } catch {
    return {
      isOpen: true,
      nextSession: 'Open - Institutional Feed',
      timezone: 'EST'
    };
  }
}

// Helper to generate realistic curve points
function generateChart(basePrice: number, pointsCount: number, volatility: number, trend: number, timeLabels: string[]): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  let currentPrice = basePrice * (1 - (trend * (pointsCount / 100)));
  for (let i = 0; i < pointsCount; i++) {
    const randomChange = (Math.random() - 0.48) * volatility * basePrice;
    currentPrice = Math.max(basePrice * 0.4, currentPrice + randomChange + (trend * basePrice / pointsCount));
    result.push({
      time: timeLabels[i] || `T-${pointsCount - i}`,
      price: parseFloat(currentPrice.toFixed(2)),
      volume: Math.floor(100000 + Math.random() * 500000)
    });
  }
  // Ensure the last point matches the basePrice closely
  if (result.length > 0) {
    result[result.length - 1].price = basePrice;
  }
  return result;
}

// Curated Institutional Stocks Registry
export const STOCKS_REGISTRY: StockAsset[] = [
  {
    id: 'aapl',
    type: 'stock',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    price: 228.45,
    change: 2.15,
    changePercent: 0.95,
    open: 226.50,
    high: 229.10,
    low: 226.20,
    previousClose: 226.30,
    volume: 52410200,
    avgVolume: 56800000,
    marketCap: 3480000000000,
    peRatio: 34.2,
    eps: 6.68,
    dividendYield: 0.44,
    week52High: 237.23,
    week52Low: 164.08,
    beta: 1.08,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.',
    ceo: 'Tim Cook',
    headquarters: 'Cupertino, California, USA',
    founded: 1976,
    employees: 161000,
    chartData: {
      '1D': generateChart(228.45, 12, 0.005, 0.008, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(228.45, 7, 0.012, 0.015, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(228.45, 15, 0.02, 0.03, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(228.45, 15, 0.03, 0.06, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(228.45, 18, 0.04, 0.12, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(228.45, 12, 0.06, 0.22, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(228.45, 10, 0.1, 1.45, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(228.45, 10, 0.15, 4.2, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'msft',
    type: 'stock',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Software - Infrastructure & Cloud',
    price: 432.80,
    change: -1.45,
    changePercent: -0.33,
    open: 435.00,
    high: 436.20,
    low: 431.10,
    previousClose: 434.25,
    volume: 21890400,
    avgVolume: 23400000,
    marketCap: 3215000000000,
    peRatio: 36.8,
    eps: 11.76,
    dividendYield: 0.72,
    week52High: 468.35,
    week52Low: 309.45,
    beta: 1.15,
    description: 'Microsoft develops and supports software, services, devices, and enterprise solutions. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.',
    ceo: 'Satya Nadella',
    headquarters: 'Redmond, Washington, USA',
    founded: 1975,
    employees: 221000,
    chartData: {
      '1D': generateChart(432.80, 12, 0.005, -0.003, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(432.80, 7, 0.012, 0.008, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(432.80, 15, 0.02, 0.02, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(432.80, 15, 0.03, 0.04, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(432.80, 18, 0.04, 0.08, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(432.80, 12, 0.06, 0.18, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(432.80, 10, 0.1, 1.25, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(432.80, 10, 0.15, 3.8, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'nvda',
    type: 'stock',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Semiconductors & AI Compute',
    price: 135.60,
    change: 4.85,
    changePercent: 3.71,
    open: 131.20,
    high: 136.40,
    low: 130.80,
    previousClose: 130.75,
    volume: 68900400,
    avgVolume: 74200000,
    marketCap: 3330000000000,
    peRatio: 52.4,
    eps: 2.59,
    dividendYield: 0.03,
    week52High: 140.76,
    week52Low: 45.10,
    beta: 1.68,
    description: 'NVIDIA Corporation pioneered GPU-accelerated computing and produces the foundational hardware and software stack powering modern generative AI, robotics, autonomous vehicles, and high-performance computing.',
    ceo: 'Jensen Huang',
    headquarters: 'Santa Clara, California, USA',
    founded: 1993,
    employees: 29600,
    chartData: {
      '1D': generateChart(135.60, 12, 0.008, 0.035, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(135.60, 7, 0.02, 0.05, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(135.60, 15, 0.03, 0.09, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(135.60, 15, 0.05, 0.18, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(135.60, 18, 0.06, 0.45, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(135.60, 12, 0.08, 1.35, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(135.60, 10, 0.12, 8.5, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(135.60, 10, 0.18, 25.0, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'googl',
    type: 'stock',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    price: 172.90,
    change: 1.10,
    changePercent: 0.64,
    open: 171.50,
    high: 173.80,
    low: 171.10,
    previousClose: 171.80,
    volume: 24500100,
    avgVolume: 27100000,
    marketCap: 2150000000000,
    peRatio: 24.6,
    eps: 7.03,
    dividendYield: 0.46,
    week52High: 191.75,
    week52Low: 129.40,
    beta: 1.05,
    description: 'Alphabet Inc. provides Google services including Google Search, Ads, Maps, YouTube, Android, Google Play, Chrome, and Google Cloud, along with Other Bets ventures.',
    ceo: 'Sundar Pichai',
    headquarters: 'Mountain View, California, USA',
    founded: 1998,
    employees: 182500,
    chartData: {
      '1D': generateChart(172.90, 12, 0.005, 0.006, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(172.90, 7, 0.012, 0.01, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(172.90, 15, 0.02, 0.025, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(172.90, 15, 0.03, -0.04, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(172.90, 18, 0.04, 0.15, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(172.90, 12, 0.06, 0.32, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(172.90, 10, 0.1, 1.1, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(172.90, 10, 0.15, 3.5, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'amzn',
    type: 'stock',
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    industry: 'Internet Retail & Cloud',
    price: 194.20,
    change: 3.40,
    changePercent: 1.78,
    open: 191.00,
    high: 195.10,
    low: 190.50,
    previousClose: 190.80,
    volume: 38200100,
    avgVolume: 42100000,
    marketCap: 2020000000000,
    peRatio: 43.8,
    eps: 4.43,
    dividendYield: 0.0,
    week52High: 201.20,
    week52Low: 118.35,
    beta: 1.22,
    description: 'Amazon.com, Inc. focuses on retail sale of consumer products and subscriptions worldwide, and operates Amazon Web Services (AWS) providing global cloud infrastructure.',
    ceo: 'Andy Jassy',
    headquarters: 'Seattle, Washington, USA',
    founded: 1994,
    employees: 1525000,
    chartData: {
      '1D': generateChart(194.20, 12, 0.006, 0.017, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(194.20, 7, 0.015, 0.025, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(194.20, 15, 0.025, 0.04, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(194.20, 15, 0.035, 0.08, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(194.20, 18, 0.045, 0.16, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(194.20, 12, 0.07, 0.44, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(194.20, 10, 0.11, 0.95, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(194.20, 10, 0.16, 4.8, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'jpm',
    type: 'stock',
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    sector: 'Financials',
    industry: 'Diversified Banking & Capital Markets',
    price: 215.65,
    change: 1.85,
    changePercent: 0.87,
    open: 213.90,
    high: 216.50,
    low: 213.40,
    previousClose: 213.80,
    volume: 8940000,
    avgVolume: 9800000,
    marketCap: 615000000000,
    peRatio: 12.4,
    eps: 17.39,
    dividendYield: 2.13,
    week52High: 225.48,
    week52Low: 139.12,
    beta: 1.09,
    description: 'JPMorgan Chase & Co. is a premier global financial services firm providing investment banking, asset management, treasury, and commercial banking services.',
    ceo: 'Jamie Dimon',
    headquarters: 'New York, New York, USA',
    founded: 1799,
    employees: 309900,
    chartData: {
      '1D': generateChart(215.65, 12, 0.004, 0.008, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(215.65, 7, 0.01, 0.012, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(215.65, 15, 0.018, 0.028, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(215.65, 15, 0.025, 0.06, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(215.65, 18, 0.035, 0.14, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(215.65, 12, 0.05, 0.42, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(215.65, 10, 0.09, 1.15, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(215.65, 10, 0.13, 2.8, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'tsla',
    type: 'stock',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    industry: 'Automotive & Clean Energy',
    price: 254.30,
    change: -3.80,
    changePercent: -1.47,
    open: 259.00,
    high: 261.20,
    low: 252.80,
    previousClose: 258.10,
    volume: 78500200,
    avgVolume: 85200000,
    marketCap: 812000000000,
    peRatio: 64.8,
    eps: 3.92,
    dividendYield: 0.0,
    week52High: 271.00,
    week52Low: 138.80,
    beta: 2.25,
    description: 'Tesla designs, develops, manufactures, sells, and leases fully electric vehicles, energy storage systems, and solar panels, while expanding full self-driving AI networks.',
    ceo: 'Elon Musk',
    headquarters: 'Austin, Texas, USA',
    founded: 2003,
    employees: 140400,
    chartData: {
      '1D': generateChart(254.30, 12, 0.009, -0.015, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(254.30, 7, 0.025, 0.03, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(254.30, 15, 0.04, 0.08, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(254.30, 15, 0.06, 0.35, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(254.30, 18, 0.08, 0.55, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(254.30, 12, 0.12, 0.10, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(254.30, 10, 0.18, 1.8, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(254.30, 10, 0.22, 12.0, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  },
  {
    id: 'lly',
    type: 'stock',
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    exchange: 'NYSE',
    sector: 'Healthcare',
    industry: 'Pharmaceuticals & Biotechnology',
    price: 914.50,
    change: 8.70,
    changePercent: 0.96,
    open: 906.00,
    high: 918.40,
    low: 904.20,
    previousClose: 905.80,
    volume: 2450000,
    avgVolume: 2800000,
    marketCap: 868000000000,
    peRatio: 112.5,
    eps: 8.13,
    dividendYield: 0.57,
    week52High: 972.53,
    week52Low: 520.10,
    beta: 0.58,
    description: 'Eli Lilly and Company discovers, develops, and markets pharmaceuticals worldwide, focusing on endocrinology, diabetes, oncology, immunology, and neuroscience treatments.',
    ceo: 'David A. Ricks',
    headquarters: 'Indianapolis, Indiana, USA',
    founded: 1876,
    employees: 43000,
    chartData: {
      '1D': generateChart(914.50, 12, 0.005, 0.009, ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '16:00']),
      '1W': generateChart(914.50, 7, 0.012, 0.018, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Yesterday', 'Today']),
      '1M': generateChart(914.50, 15, 0.02, 0.03, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(914.50, 15, 0.03, 0.12, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(914.50, 18, 0.045, 0.28, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(914.50, 12, 0.065, 0.65, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '5Y': generateChart(914.50, 10, 0.1, 4.2, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(914.50, 10, 0.14, 8.5, ['2016', '2018', '2020', '2022', '2024', '2026'])
    }
  }
];

// Curated Institutional Bonds Registry
export const BONDS_REGISTRY: BondAsset[] = [
  {
    id: 'us10y',
    type: 'bond',
    symbol: 'US10Y',
    name: 'US Treasury Note 10-Year Benchmark',
    issuer: 'United States Department of the Treasury',
    category: 'government',
    cusip: '91282CJZ1',
    maturityDate: '2034-08-15',
    couponRate: 4.25,
    yieldToMaturity: 4.42,
    currentYield: 4.31,
    pricePercent: 98.65,
    parValue: 1000,
    priceDollars: 986.50,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'AA+',
    ratingAgency: 'S&P',
    callable: false,
    durationYears: 8.24,
    settlementDays: 'T+1',
    accruedInterestPerBond: 5.25,
    riskProfile: 'Low',
    description: 'Direct obligation of the United States federal government, backed by the full faith and credit. The 10-year Treasury note is the primary benchmark for global debt capital markets.',
    priceHistory: generateChart(98.65, 12, 0.003, 0.004, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  },
  {
    id: 'us2y',
    type: 'bond',
    symbol: 'US2Y',
    name: 'US Treasury Note 2-Year Fixed',
    issuer: 'United States Department of the Treasury',
    category: 'government',
    cusip: '91282CJY3',
    maturityDate: '2026-09-30',
    couponRate: 4.50,
    yieldToMaturity: 4.58,
    currentYield: 4.52,
    pricePercent: 99.55,
    parValue: 1000,
    priceDollars: 995.50,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'AA+',
    ratingAgency: 'S&P',
    callable: false,
    durationYears: 1.92,
    settlementDays: 'T+1',
    accruedInterestPerBond: 8.40,
    riskProfile: 'Low',
    description: 'Short-duration sovereign benchmark reflecting immediate central bank policy rate trajectories and short-term capital preservation.',
    priceHistory: generateChart(99.55, 12, 0.002, 0.002, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  },
  {
    id: 'us30y',
    type: 'bond',
    symbol: 'US30Y',
    name: 'US Treasury Long Bond 30-Year',
    issuer: 'United States Department of the Treasury',
    category: 'government',
    cusip: '912810TX2',
    maturityDate: '2054-08-15',
    couponRate: 4.375,
    yieldToMaturity: 4.65,
    currentYield: 4.54,
    pricePercent: 96.40,
    parValue: 1000,
    priceDollars: 964.00,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'AA+',
    ratingAgency: 'S&P',
    callable: false,
    durationYears: 16.85,
    settlementDays: 'T+1',
    accruedInterestPerBond: 4.80,
    riskProfile: 'Low',
    description: 'Ultra-long duration government obligation offering high sensitivity to long-term secular interest rate changes and sustained cash flow.',
    priceHistory: generateChart(96.40, 12, 0.006, -0.008, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  },
  {
    id: 'aapl33',
    type: 'bond',
    symbol: 'AAPL-33',
    name: 'Apple Inc. 3.85% Senior Notes Due 2033',
    issuer: 'Apple Inc.',
    category: 'corporate',
    cusip: '037833EC9',
    maturityDate: '2033-05-04',
    couponRate: 3.85,
    yieldToMaturity: 4.62,
    currentYield: 4.09,
    pricePercent: 94.10,
    parValue: 1000,
    priceDollars: 941.00,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'AA+',
    ratingAgency: 'S&P',
    callable: true,
    callDate: '2033-02-04',
    durationYears: 7.45,
    settlementDays: 'T+1',
    accruedInterestPerBond: 15.10,
    riskProfile: 'Low',
    description: 'Senior unsecured obligation of Apple Inc., carrying an institutional tier balance sheet with fortress liquidity and stable cash earnings.',
    priceHistory: generateChart(94.10, 12, 0.004, 0.006, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  },
  {
    id: 'msft27',
    type: 'bond',
    symbol: 'MSFT-27',
    name: 'Microsoft Corp 3.30% Senior Notes Due 2027',
    issuer: 'Microsoft Corporation',
    category: 'corporate',
    cusip: '594918BY9',
    maturityDate: '2027-02-06',
    couponRate: 3.30,
    yieldToMaturity: 4.45,
    currentYield: 3.42,
    pricePercent: 96.60,
    parValue: 1000,
    priceDollars: 966.00,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    callable: true,
    callDate: '2026-11-06',
    durationYears: 2.35,
    settlementDays: 'T+1',
    accruedInterestPerBond: 4.20,
    riskProfile: 'Low',
    description: 'Rare AAA-rated corporate debt issue supported by global enterprise recurring software subscriptions and cloud enterprise contracts.',
    priceHistory: generateChart(96.60, 12, 0.003, 0.003, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  },
  {
    id: 'jpm34',
    type: 'bond',
    symbol: 'JPM-34',
    name: 'JPMorgan Chase & Co. 4.32% Fixed-to-Floating Due 2034',
    issuer: 'JPMorgan Chase & Co.',
    category: 'corporate',
    cusip: '46647PBU2',
    maturityDate: '2034-04-26',
    couponRate: 4.32,
    yieldToMaturity: 5.15,
    currentYield: 4.60,
    pricePercent: 93.80,
    parValue: 1000,
    priceDollars: 938.00,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'A-',
    ratingAgency: 'S&P',
    callable: true,
    callDate: '2033-04-26',
    durationYears: 7.90,
    settlementDays: 'T+1',
    accruedInterestPerBond: 18.20,
    riskProfile: 'Moderate',
    description: 'Tier 1 bank holding company senior debt with enhanced yield premium over US Treasuries reflecting institutional bank credit spreads.',
    priceHistory: generateChart(93.80, 12, 0.005, 0.008, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  },
  {
    id: 'nyctfa38',
    type: 'bond',
    symbol: 'NYCTFA-38',
    name: 'New York City TFA Fiscal 2024 Series B 4.00% 2038',
    issuer: 'New York City Transitional Finance Authority',
    category: 'municipal',
    cusip: '64971P7A1',
    maturityDate: '2038-11-01',
    couponRate: 4.00,
    yieldToMaturity: 3.82,
    currentYield: 3.91,
    pricePercent: 102.30,
    parValue: 1000,
    priceDollars: 1023.00,
    minInvestment: 1000,
    paymentFrequency: 'Semi-Annual',
    creditRating: 'AAA',
    ratingAgency: 'Fitch',
    callable: true,
    callDate: '2033-11-01',
    durationYears: 10.15,
    settlementDays: 'T+1',
    accruedInterestPerBond: 12.00,
    riskProfile: 'Low',
    description: 'High-grade municipal revenue obligation backed by dedicated statutory personal income tax and general sales tax receipts of New York City.',
    priceHistory: generateChart(102.30, 12, 0.003, 0.004, ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  }
];

// Curated Institutional Mutual Funds Registry
export const MUTUAL_FUNDS_REGISTRY: MutualFundAsset[] = [
  {
    id: 'vfiax',
    type: 'mutual_fund',
    symbol: 'VFIAX',
    name: 'Vanguard 500 Index Fund Admiral Shares',
    provider: 'Vanguard Group',
    category: 'Equity - Large Blend',
    nav: 512.45,
    navDate: '2026-09-25 16:00:00 EST',
    change: 3.85,
    changePercent: 0.76,
    expenseRatio: 0.04,
    minInvestment: 3000,
    aum: 1180000000000,
    riskLevel: 'Moderate-High',
    distributionFrequency: 'Quarterly',
    dividendYield: 1.28,
    objective: 'The fund seeks to track the performance of a benchmark index that measures the investment return of large-capitalization stocks.',
    strategy: 'Employs an indexing investment approach designed to track the performance of the S&P 500 Index, representing approximately 85% of US equity market capitalization.',
    inceptionDate: '2000-11-13',
    performance: {
      '1M': 2.15,
      '3M': 5.82,
      '6M': 11.40,
      '1Y': 24.60,
      '3Y': 36.20,
      '5Y': 88.50,
      'Since Inception': 348.00
    },
    topHoldings: [
      { name: 'Apple Inc.', symbol: 'AAPL', weight: 7.15 },
      { name: 'Microsoft Corp.', symbol: 'MSFT', weight: 6.55 },
      { name: 'NVIDIA Corp.', symbol: 'NVDA', weight: 6.22 },
      { name: 'Amazon.com Inc.', symbol: 'AMZN', weight: 3.75 },
      { name: 'Alphabet Inc. Class A', symbol: 'GOOGL', weight: 2.10 },
      { name: 'Meta Platforms Inc.', symbol: 'META', weight: 2.38 },
      { name: 'Berkshire Hathaway Inc. Class B', symbol: 'BRK.B', weight: 1.72 },
      { name: 'Eli Lilly and Co.', symbol: 'LLY', weight: 1.55 },
      { name: 'JPMorgan Chase & Co.', symbol: 'JPM', weight: 1.34 },
      { name: 'Tesla Inc.', symbol: 'TSLA', weight: 1.28 }
    ],
    sectorAllocation: [
      { sector: 'Information Technology', weight: 31.5 },
      { sector: 'Financials', weight: 13.2 },
      { sector: 'Healthcare', weight: 11.8 },
      { sector: 'Consumer Discretionary', weight: 10.4 },
      { sector: 'Communication Services', weight: 9.1 },
      { sector: 'Industrials', weight: 8.4 },
      { sector: 'Consumer Staples', weight: 5.9 },
      { sector: 'Energy', weight: 3.7 },
      { sector: 'Others', weight: 6.0 }
    ],
    geographicAllocation: [
      { region: 'United States', weight: 99.1 },
      { region: 'Developed Global', weight: 0.9 }
    ],
    chartData: {
      '1M': generateChart(512.45, 15, 0.015, 0.02, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(512.45, 15, 0.025, 0.05, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(512.45, 18, 0.035, 0.11, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(512.45, 12, 0.05, 0.24, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '3Y': generateChart(512.45, 12, 0.08, 0.36, ['2023', '2024', '2025', '2026']),
      '5Y': generateChart(512.45, 10, 0.12, 0.88, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(512.45, 10, 0.15, 3.48, ['2000', '2005', '2010', '2015', '2020', '2026'])
    }
  },
  {
    id: 'fcntx',
    type: 'mutual_fund',
    symbol: 'FCNTX',
    name: 'Fidelity Contrafund',
    provider: 'Fidelity Investments',
    category: 'Equity - Large Growth',
    nav: 22.84,
    navDate: '2026-09-25 16:00:00 EST',
    change: 0.22,
    changePercent: 0.97,
    expenseRatio: 0.55,
    minInvestment: 500,
    aum: 135000000000,
    riskLevel: 'High',
    distributionFrequency: 'Annual',
    dividendYield: 0.45,
    objective: 'The fund seeks capital appreciation through active fundamental selection of both growth and value opportunities across leading global enterprises.',
    strategy: 'Invests primarily in common stocks of domestic and foreign issuers whose value the manager believes is not fully recognized by the public.',
    inceptionDate: '1967-05-17',
    performance: {
      '1M': 2.45,
      '3M': 6.90,
      '6M': 14.20,
      '1Y': 32.10,
      '3Y': 42.50,
      '5Y': 98.40,
      'Since Inception': 1240.00
    },
    topHoldings: [
      { name: 'Meta Platforms Inc.', symbol: 'META', weight: 11.2 },
      { name: 'Berkshire Hathaway Inc.', symbol: 'BRK.A', weight: 8.4 },
      { name: 'Microsoft Corp.', symbol: 'MSFT', weight: 7.9 },
      { name: 'NVIDIA Corp.', symbol: 'NVDA', weight: 7.4 },
      { name: 'Amazon.com Inc.', symbol: 'AMZN', weight: 6.8 },
      { name: 'Apple Inc.', symbol: 'AAPL', weight: 5.2 },
      { name: 'Alphabet Inc.', symbol: 'GOOGL', weight: 4.8 },
      { name: 'Eli Lilly and Co.', symbol: 'LLY', weight: 4.1 },
      { name: 'Visa Inc.', symbol: 'V', weight: 3.2 },
      { name: 'Broadcom Inc.', symbol: 'AVGO', weight: 2.9 }
    ],
    sectorAllocation: [
      { sector: 'Technology', weight: 34.0 },
      { sector: 'Communication Services', weight: 18.5 },
      { sector: 'Financials', weight: 14.8 },
      { sector: 'Consumer Discretionary', weight: 12.2 },
      { sector: 'Healthcare', weight: 11.0 },
      { sector: 'Others', weight: 9.5 }
    ],
    geographicAllocation: [
      { region: 'United States', weight: 92.5 },
      { region: 'Europe & Developed Markets', weight: 5.2 },
      { region: 'Emerging Markets', weight: 2.3 }
    ],
    chartData: {
      '1M': generateChart(22.84, 15, 0.018, 0.024, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(22.84, 15, 0.028, 0.069, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(22.84, 18, 0.04, 0.142, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(22.84, 12, 0.06, 0.321, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '3Y': generateChart(22.84, 12, 0.09, 0.425, ['2023', '2024', '2025', '2026']),
      '5Y': generateChart(22.84, 10, 0.13, 0.984, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(22.84, 10, 0.18, 12.4, ['1970', '1980', '1990', '2000', '2010', '2026'])
    }
  },
  {
    id: 'vbtlx',
    type: 'mutual_fund',
    symbol: 'VBTLX',
    name: 'Vanguard Total Bond Market Index Fund Admiral',
    provider: 'Vanguard Group',
    category: 'Fixed Income Core',
    nav: 9.68,
    navDate: '2026-09-25 16:00:00 EST',
    change: 0.03,
    changePercent: 0.31,
    expenseRatio: 0.05,
    minInvestment: 3000,
    aum: 320000000000,
    riskLevel: 'Low',
    distributionFrequency: 'Monthly',
    dividendYield: 4.15,
    objective: 'The fund seeks to track the performance of a broad, market-weighted bond index designed to provide broad exposure to US investment-grade bonds.',
    strategy: 'Invests roughly 67% in US government bonds, 29% in investment-grade corporate bonds, and 4% in international dollar-denominated bonds.',
    inceptionDate: '2001-11-12',
    performance: {
      '1M': 0.85,
      '3M': 2.45,
      '6M': 4.10,
      '1Y': 8.80,
      '3Y': 9.20,
      '5Y': 7.10,
      'Since Inception': 118.00
    },
    topHoldings: [
      { name: 'United States Treasury Notes/Bonds', weight: 66.8 },
      { name: 'Fannie Mae Guaranteed Pass-Through', weight: 11.2 },
      { name: 'Freddie Mac Gold Pool', weight: 8.5 },
      { name: 'Ginnie Mae I & II Pool', weight: 4.3 },
      { name: 'JPMorgan Chase & Co. Debt', weight: 0.8 },
      { name: 'Bank of America Corp. Debt', weight: 0.7 }
    ],
    sectorAllocation: [
      { sector: 'Treasury / Sovereign', weight: 66.8 },
      { sector: 'Mortgage-Backed Securities', weight: 24.0 },
      { sector: 'Industrial Corporate', weight: 6.2 },
      { sector: 'Financial Institution', weight: 3.0 }
    ],
    geographicAllocation: [
      { region: 'United States', weight: 98.5 },
      { region: 'Supranational / Global', weight: 1.5 }
    ],
    chartData: {
      '1M': generateChart(9.68, 15, 0.005, 0.008, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(9.68, 15, 0.008, 0.024, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(9.68, 18, 0.012, 0.041, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(9.68, 12, 0.018, 0.088, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '3Y': generateChart(9.68, 12, 0.025, 0.092, ['2023', '2024', '2025', '2026']),
      '5Y': generateChart(9.68, 10, 0.035, 0.071, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(9.68, 10, 0.045, 1.18, ['2001', '2005', '2010', '2015', '2020', '2026'])
    }
  },
  {
    id: 'cgagx',
    type: 'mutual_fund',
    symbol: 'CGAGX',
    name: 'CGA Institutional Global Multi-Strategy Fund',
    provider: 'CGA Asset Management & Capital Markets',
    category: 'Institutional Liquidity',
    nav: 148.90,
    navDate: '2026-09-25 16:00:00 EST',
    change: 1.25,
    changePercent: 0.85,
    expenseRatio: 0.35,
    minInvestment: 1000,
    aum: 4850000000,
    riskLevel: 'Moderate',
    distributionFrequency: 'Quarterly',
    dividendYield: 3.40,
    objective: 'Institutional capital preservation, high-frequency liquidity management, and absolute multi-asset alpha across sovereign debt, mega-cap equity, and private liquidity nodes.',
    strategy: 'Combines dynamic macro positioning with automated risk parity balancing across US Treasuries, top global equities, and cash equivalents with sub-millisecond execution rules.',
    inceptionDate: '2021-06-01',
    performance: {
      '1M': 1.65,
      '3M': 4.75,
      '6M': 9.80,
      '1Y': 18.50,
      '3Y': 41.20,
      '5Y': 78.40,
      'Since Inception': 96.50
    },
    topHoldings: [
      { name: 'US Treasury Bills 3-Month', weight: 22.5 },
      { name: 'Apple Inc.', symbol: 'AAPL', weight: 8.5 },
      { name: 'Microsoft Corp.', symbol: 'MSFT', weight: 8.0 },
      { name: 'NVIDIA Corp.', symbol: 'NVDA', weight: 7.2 },
      { name: 'US Treasury Notes 10-Year', weight: 15.0 },
      { name: 'JPMorgan Chase & Co.', symbol: 'JPM', weight: 5.5 },
      { name: 'Amazon.com Inc.', symbol: 'AMZN', weight: 5.2 },
      { name: 'CGA Liquidity Clearing Pool', weight: 12.0 },
      { name: 'Gold Bullion ETF Trust', weight: 6.5 },
      { name: 'Alphabet Inc.', symbol: 'GOOGL', weight: 4.8 }
    ],
    sectorAllocation: [
      { sector: 'Sovereign Debt & Cash', weight: 37.5 },
      { sector: 'Information Technology', weight: 28.5 },
      { sector: 'Financials & Capital', weight: 17.5 },
      { sector: 'Hard Commodities & Gold', weight: 6.5 },
      { sector: 'Healthcare & Discretionary', weight: 10.0 }
    ],
    geographicAllocation: [
      { region: 'United States', weight: 85.0 },
      { region: 'United Kingdom & Europe', weight: 8.5 },
      { region: 'Asia-Pacific Core', weight: 6.5 }
    ],
    chartData: {
      '1M': generateChart(148.90, 15, 0.01, 0.016, ['W1', 'W2', 'W3', 'W4']),
      '3M': generateChart(148.90, 15, 0.02, 0.047, ['Jul', 'Aug', 'Sep']),
      '6M': generateChart(148.90, 18, 0.028, 0.098, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
      '1Y': generateChart(148.90, 12, 0.045, 0.185, ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep']),
      '3Y': generateChart(148.90, 12, 0.07, 0.412, ['2023', '2024', '2025', '2026']),
      '5Y': generateChart(148.90, 10, 0.1, 0.784, ['2021', '2022', '2023', '2024', '2025', '2026']),
      'MAX': generateChart(148.90, 10, 0.12, 0.965, ['2021', '2022', '2023', '2024', '2025', '2026'])
    }
  }
];

export function findAsset(symbol: string): StockAsset | BondAsset | MutualFundAsset | undefined {
  const s = symbol.toUpperCase().trim();
  const stock = STOCKS_REGISTRY.find(item => item.symbol.toUpperCase() === s || item.id === symbol.toLowerCase());
  if (stock) return stock;
  const bond = BONDS_REGISTRY.find(item => item.symbol.toUpperCase() === s || item.id === symbol.toLowerCase() || item.cusip.toUpperCase() === s);
  if (bond) return bond;
  const fund = MUTUAL_FUNDS_REGISTRY.find(item => item.symbol.toUpperCase() === s || item.id === symbol.toLowerCase());
  if (fund) return fund;
  return undefined;
}
