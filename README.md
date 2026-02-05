# Tok-Edge Access Backend

NestJS backend API for Tok-Edge Access - a gated referral and scoring experience for crypto investors.

## Tech Stack

- **Framework**: NestJS
- **Database**: Firebase Postgres (PostgreSQL)
- **Firebase**: Firebase Admin SDK
- **Validation**: class-validator, class-transformer

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Install PostgreSQL driver (required for Firebase Postgres):
```bash
yarn add pg
yarn add -D @types/pg
```

**Note**: The dependencies `firebase-admin`, `@nestjs/config`, `class-validator`, and `class-transformer` should already be installed. If not, run:
```bash
yarn add firebase-admin @nestjs/config class-validator class-transformer
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase and database credentials
```

4. Run database migrations:
```bash
# Execute database/schema.sql on your Firebase Postgres instance
```

5. Start development server:
```bash
yarn start:dev
```

## API Endpoints

### POST /api/wallet/analyze
Analyze a wallet address and return scoring results.

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "inviteCode": "ABCDEFGH",
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "kol1"
  },
  "clientMeta": {
    "userAgent": "...",
    "ip": "...",
    "gaClientId": "..."
  }
}
```

**Response:**
```json
{
  "userId": "uuid",
  "rank": "Smart Money",
  "score": 85,
  "eligibility": true,
  "metricsSummary": {
    "holdingConviction": 25,
    "tradingDiscipline": 20,
    "realizedEdge": 28,
    "behaviorQuality": 12,
    "traits": ["Holds winners", "Trades with discipline", "Avoids rugs"]
  },
  "shareCardId": "uuid"
}
```

### GET /api/wallet/portfolio?userId={userId}
Get portfolio snapshot for a user.

**Response:**
```json
{
  "userId": "uuid",
  "portfolio": {...},
  "snapshotDate": "2026-02-05T..."
}
```

### GET /api/invite/{inviteCode}/stats
Get statistics for an invite code (Admin only).

**Response:**
```json
{
  "inviteCode": "ABCDEFGH",
  "totalSubmissions": 150,
  "eligibilityRate": 0.23,
  "rankDistribution": {
    "Smart Money": 5,
    "Diamond Hands": 20,
    "Degenerate": 10,
    "Paper Hands": 80,
    "Jeeter": 35
  },
  "referralDepth": 3,
  "topReferrers": [
    {
      "userId": "uuid",
      "referrals": 15
    }
  ]
}
```

## Project Structure

```
src/
├── config/              # Configuration files
├── common/              # Shared enums and utilities
│   └── enums/
├── database/            # Database module and entities
│   ├── entities/
│   ├── database.module.ts
│   └── database.service.ts
├── wallet/              # Wallet module
│   ├── dto/
│   ├── wallet.controller.ts
│   ├── wallet.service.ts
│   ├── wallet-scoring.service.ts
│   └── wallet.module.ts
├── invite/              # Invite module
│   ├── dto/
│   ├── invite.controller.ts
│   ├── invite-code.service.ts
│   └── invite.module.ts
├── app.module.ts
└── main.ts
```

## Environment Variables

See `.env.example` for required environment variables.

## Database Schema

See `database/schema.sql` for the complete database schema.

## Notes

- Wallet addresses are normalized to lowercase and hashed for privacy
- Invite codes are 8 characters, uppercase, A-Z excluding I and O
- Scoring results are cached permanently for the campaign
- Portfolio data is cached for 1-6 hours (configurable)
