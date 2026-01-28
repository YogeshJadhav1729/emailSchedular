# 📧 Email Scheduler - Production-Grade Email Scheduling System

A full-stack email scheduling system built with **TypeScript, Express, BullMQ, PostgreSQL, and Next.js**. This is a production-ready application designed for the ReachInbox assignment, featuring persistent job queues, rate limiting, concurrency control, and a modern dashboard.

---

## 🎯 Features

### Backend
- ✅ **Email Scheduling**: Schedule emails for future delivery with delayed jobs
- ✅ **BullMQ Integration**: Persistent job queue with Redis (NO cron jobs)
- ✅ **Rate Limiting**: Redis-based hourly rate limits per user
- ✅ **Concurrency Control**: Configurable worker concurrency
- ✅ **Delay Between Emails**: Configurable delay mechanism
- ✅ **Idempotency**: Prevents duplicate email sends
- ✅ **Persistence**: Jobs survive server restarts
- ✅ **SMTP Integration**: Ethereal Email for testing
- ✅ **Database**: PostgreSQL with Prisma ORM

### Frontend
- ✅ **Google OAuth**: Real Google authentication
- ✅ **Modern Dashboard**: React/Next.js with Tailwind CSS
- ✅ **Scheduled Emails View**: Track all scheduled email batches
- ✅ **Sent Emails View**: Monitor sent email history
- ✅ **Compose Email**: Rich form with CSV upload support
- ✅ **Real-time Updates**: Loading states and error handling
- ✅ **TypeScript**: Fully typed throughout

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Queue**: BullMQ + Redis (delayed jobs only)
- **Database**: PostgreSQL with Prisma ORM
- **SMTP**: Nodemailer + Ethereal Email
- **Authentication**: JWT

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **OAuth**: @react-oauth/google
- **HTTP Client**: Axios
- **UI Libraries**: react-hot-toast, date-fns

### Infrastructure
- **Containerization**: Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

---

## 📁 Project Structure

```
emailSchedular/
├── backend/                  # Express.js backend
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── db.ts            # Prisma client
│   │   ├── redis.ts         # Redis connection
│   │   ├── queue.ts         # BullMQ queue setup
│   │   ├── worker.ts        # BullMQ worker
│   │   ├── emailService.ts  # SMTP service
│   │   ├── rateLimiter.ts   # Redis-based rate limiter
│   │   └── index.ts         # Express server
│   ├── .env.example         # Environment variables template
│   └── package.json
├── frontend/                 # Next.js frontend
│   ├── app/
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── page.tsx         # Login page
│   │   └── layout.tsx       # Root layout
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state management
│   ├── lib/
│   │   └── api.ts           # API client
│   └── package.json
├── docker-compose.yml        # Docker services
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL & Redis)
- Google OAuth Client ID (for authentication)
- Ethereal Email account (for SMTP testing)

### 1. Clone the Repository
```bash
git clone https://github.com/YogeshJadhav1729/emailSchedular.git
cd emailSchedular
```

### 2. Start Docker Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis on port `6379`

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL (default works with docker-compose)
# - SMTP credentials (get from https://ethereal.email)
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# - JWT_SECRET

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start backend server (port 3001)
npm run dev

# In a separate terminal, start the worker
npm run worker
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local and configure:
# - NEXT_PUBLIC_API_URL (default: http://localhost:3001)
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Start frontend (port 3000)
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Login with Google OAuth

---

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/emailscheduler` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `WORKER_CONCURRENCY` | BullMQ worker concurrency | `5` |
| `DELAY_BETWEEN_EMAILS` | Delay between emails (ms) | `1000` |
| `EMAILS_PER_HOUR` | Default hourly rate limit | `200` |
| `SMTP_HOST` | SMTP server hostname | `smtp.ethereal.email` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | (from Ethereal) |
| `SMTP_PASS` | SMTP password | (from Ethereal) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (from Google Console) |
| `JWT_SECRET` | Secret for JWT signing | (generate secure random string) |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## 📧 Setting Up Ethereal Email

1. Go to https://ethereal.email
2. Click "Create Ethereal Account"
3. Copy the credentials (username and password)
4. Update backend `.env`:
   ```
   SMTP_USER=your-ethereal-username@ethereal.email
   SMTP_PASS=your-ethereal-password
   ```
5. Sent emails will appear in your Ethereal inbox

---

## 🔑 Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
6. Copy Client ID and Client Secret
7. Update `.env` files in both backend and frontend

---

## 🏗 Architecture Overview

### Email Scheduling Flow

```
User submits email → Backend API → Create DB record → Add BullMQ job with delay
                                                    ↓
Worker picks job → Check rate limit → Send email → Update DB → Mark complete
         ↓ (if rate limit exceeded)
   Reschedule job to next hour window
```

### Persistence Across Restarts

1. **Database Persistence**: All scheduled emails stored in PostgreSQL
2. **Redis Queue Persistence**: BullMQ uses Redis persistence (AOF/RDB)
3. **Job Recovery**: On restart, BullMQ automatically loads pending jobs from Redis
4. **Idempotency**: Each email tracked in `SentEmail` table to prevent duplicates

### Rate Limiting Strategy

**Implementation**: Redis-based sliding window counter

- **Key Pattern**: `ratelimit:emails:{userId}:{hourTimestamp}`
- **Counter**: Incremented on each email send attempt
- **Expiry**: 2 hours (to handle edge cases)
- **Behavior**: When limit exceeded, job is rescheduled to next hour window
- **Persistence**: Redis-backed, survives restarts

**Why Redis?**
- Atomic operations (INCR)
- Fast lookups
- Automatic expiry
- Shared across multiple workers

### Concurrency Model

- **Worker Concurrency**: Configurable via `WORKER_CONCURRENCY` (default: 5)
- **Queue Limiter**: 10 jobs per second max
- **Delay Mechanism**: Configurable delay between individual emails
- **Parallel Safe**: Multiple workers can run simultaneously

### Delay Between Emails

Two mechanisms available (choose via configuration):

1. **Worker-level delay** (default): Manual delay in worker code
   - Simple and reliable
   - Easy to configure
   - Works well for most cases

2. **BullMQ limiter** (alternative): Queue-level rate limiting
   - More distributed-friendly
   - Requires careful tuning

**Current Implementation**: Worker-level delay (configured via `DELAY_BETWEEN_EMAILS`)

---

## 📊 Database Schema

### User
- `id`: UUID
- `email`: String (unique)
- `name`: String
- `avatar`: String
- `googleId`: String (unique)

### ScheduledEmail
- `id`: UUID
- `userId`: Foreign key
- `subject`: String
- `body`: String (HTML supported)
- `recipients`: String[] (array of emails)
- `scheduledAt`: DateTime
- `delayBetweenEmails`: Integer (ms)
- `hourlyLimit`: Integer
- `status`: Enum (PENDING, PROCESSING, COMPLETED, FAILED)
- `jobId`: String (BullMQ job ID)

### SentEmail
- `id`: UUID
- `scheduledEmailId`: Foreign key
- `recipient`: String
- `subject`: String
- `body`: String
- `status`: Enum (PENDING, SENT, FAILED)
- `sentAt`: DateTime
- `error`: String (if failed)

---

## 🎮 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user

### Emails
- `POST /api/emails/schedule` - Schedule new email batch
- `GET /api/emails/scheduled/:userId` - Get scheduled emails
- `GET /api/emails/sent/:userId` - Get sent emails
- `GET /api/emails/stats/:userId` - Get email statistics
- `DELETE /api/emails/:id` - Cancel scheduled email

---

## ✅ Feature Checklist

### Backend
- [x] BullMQ delayed jobs (NO cron)
- [x] PostgreSQL with Prisma
- [x] Email scheduling API
- [x] SMTP integration (Ethereal)
- [x] Worker concurrency control
- [x] Delay between emails
- [x] Redis-based rate limiting
- [x] Idempotency enforcement
- [x] Restart persistence
- [x] Multiple sender support
- [x] Job status tracking

### Frontend
- [x] Google OAuth login (real)
- [x] User header with avatar
- [x] Scheduled emails view
- [x] Sent emails view
- [x] Compose email form
- [x] CSV file upload
- [x] Email parsing
- [x] Scheduling configuration
- [x] Loading states
- [x] Error handling
- [x] TypeScript typing
- [x] Tailwind CSS styling

---

## 🚧 Known Trade-offs & Assumptions

### Trade-offs

1. **Rate Limiting Granularity**: Implemented per-user hourly limits. Could be extended to per-sender if multiple sender support is needed.

2. **Job Rescheduling**: When rate limit is exceeded, the entire remaining batch is rescheduled. Alternative: Could implement fine-grained per-email rescheduling.

3. **OAuth Implementation**: Currently using simplified JWT approach. Production would benefit from refresh tokens and session management.

4. **Email Validation**: Basic regex validation. Production should use more robust validation.

### Assumptions

1. **Ethereal Email**: Assumed for testing. Production would use SendGrid, AWS SES, or similar.

2. **Single Region**: No geo-distribution considered. Would need Redis Cluster and DB replication for multi-region.

3. **CSV Format**: Assumes emails are extractable via regex. Handles most common formats.

4. **Docker Local**: Docker Compose for local dev. Production would use Kubernetes or managed services.

---

## 🧪 Testing

### Manual Testing Workflow

1. Start services (PostgreSQL, Redis, Backend, Worker, Frontend)
2. Login with Google
3. Navigate to "Compose New Email"
4. Upload CSV or paste emails
5. Set scheduling options
6. Click "Schedule"
7. Check "Scheduled Emails" tab
8. Monitor worker logs for processing
9. Check "Sent Emails" tab
10. Verify emails in Ethereal inbox

### Load Testing

To test with 1000+ emails:
```bash
# Create a CSV with 1000 emails
# Upload via dashboard
# Monitor worker logs
# Check rate limiting behavior
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Ensure PostgreSQL is running
docker-compose ps

# Check DATABASE_URL in .env
# Run migrations
npx prisma migrate dev
```

### Redis Connection Error
```bash
# Ensure Redis is running
docker-compose ps

# Check REDIS_HOST and REDIS_PORT in .env
```

### Worker Not Processing Jobs
```bash
# Ensure worker is running
npm run worker

# Check Redis connection
# Check BullMQ logs
```

### Emails Not Sending
```bash
# Verify SMTP credentials in .env
# Check worker logs for errors
# Test SMTP connection with Ethereal
```

---

## 📚 Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Ethereal Email](https://ethereal.email)

---

## 👨‍💻 Development

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

---

## 📝 License

This project is created for the ReachInbox assignment.

---

## 🙏 Acknowledgments

Built as part of the ReachInbox full-stack assignment. Demonstrates production-grade practices for email scheduling systems.
