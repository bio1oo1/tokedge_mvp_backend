-- Tok-Edge Access Database Schema
-- Firebase Postgres (PostgreSQL)

-- Invite Codes Table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  source_kol VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invite_codes_code ON invite_codes(UPPER(code));
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL,
  wallet_address_hash VARCHAR(64) UNIQUE NOT NULL,
  invite_code_issued VARCHAR(8) REFERENCES invite_codes(code),
  referred_by_invite_code VARCHAR(8) REFERENCES invite_codes(code),
  rank VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  eligibility BOOLEAN NOT NULL DEFAULT false,
  share_completed BOOLEAN NOT NULL DEFAULT false,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  ga_client_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet_hash ON users(wallet_address_hash);
CREATE INDEX idx_users_invite_code ON users(invite_code_issued);
CREATE INDEX idx_users_referred_by ON users(referred_by_invite_code);
CREATE INDEX idx_users_eligibility ON users(eligibility);
CREATE INDEX idx_users_rank ON users(rank);

-- Portfolio Snapshots Table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_snapshots_user ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_created ON portfolio_snapshots(created_at DESC);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at DESC);
