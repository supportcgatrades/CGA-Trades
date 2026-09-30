-- Database Schema for Aura Wealth Investment Platform

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    transaction_pin VARCHAR(255), -- Hashed PIN
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
    tier VARCHAR(50) DEFAULT 'Regular', -- 'Regular', 'Premium', 'Elite'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_investments_user_id ON investments(user_id);

-- 2. Wallets Table (One per user)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(18, 2) DEFAULT 0.00,
    withdrawable_balance DECIMAL(18, 2) DEFAULT 0.00,
    total_invested DECIMAL(18, 2) DEFAULT 0.00,
    total_earned DECIMAL(18, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Investments Table
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL, -- 'reg', 'pre', 'eli'
    amount DECIMAL(18, 2) NOT NULL,
    daily_roi_rate DECIMAL(5, 2) NOT NULL, -- e.g. 2.5
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_roi_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE
);

-- 4. Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id),
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'investment', 'roi_payout'
    amount DECIMAL(18, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'processing'
    reference_id VARCHAR(255), -- Transaction hash or bank ref
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROI Logs (For tracking daily distributions)
CREATE TABLE roi_logs (
    id SERIAL PRIMARY KEY,
    investment_id INTEGER REFERENCES investments(id) ON DELETE CASCADE,
    amount DECIMAL(18, 2) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
