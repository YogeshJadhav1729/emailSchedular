# Setup Guide - Email Scheduler

Complete step-by-step guide to set up and run the Email Scheduler application.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] Git installed
- [ ] Google account (for OAuth setup)
- [ ] Code editor (VS Code recommended)

---

## Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/YogeshJadhav1729/emailSchedular.git
cd emailSchedular

# Verify directory structure
ls -la
# Should see: backend/, frontend/, docker-compose.yml, README.md
```

---

## Step 2: Start Database Services

```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps

# You should see:
# - emailscheduler-postgres (port 5432)
# - emailscheduler-redis (port 6379)
```

---

## Step 3: Setup Ethereal Email (Test SMTP)

1. Go to https://ethereal.email
2. Click **"Create Ethereal Account"**
3. You'll see credentials like:
   ```
   Username: example.user@ethereal.email
   Password: YourPasswordHere
   Host: smtp.ethereal.email
   Port: 587
   ```
4. **Save these credentials** - you'll need them in Step 4

---

## Step 4: Setup Google OAuth

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Configure consent screen if prompted:
   - User Type: External
   - App name: Email Scheduler
   - Support email: your-email@gmail.com
6. For Application type, select **"Web application"**
7. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   ```
8. Add Authorized redirect URIs:
   ```
   http://localhost:3001/auth/google/callback
   ```
9. Click **"Create"**
10. **Copy the Client ID and Client Secret** - you'll need them next

---

## Step 5: Configure Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

### Update `.env` with your credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (default works with docker-compose)
DATABASE_URL="postgresql://user:password@localhost:5432/emailscheduler?schema=public"

# Redis (default works with docker-compose)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# BullMQ Configuration
WORKER_CONCURRENCY=5
DELAY_BETWEEN_EMAILS=1000
EMAILS_PER_HOUR=200

# SMTP Configuration (from Step 3)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-username@ethereal.email
SMTP_PASS=your-ethereal-password
SMTP_FROM=noreply@emailscheduler.com

# Google OAuth (from Step 4)
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

### Generate a secure JWT_SECRET:

```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Setup Database

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

---

## Step 6: Configure Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

### Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**Important**: Use the same Google Client ID from Step 4.

---

## Step 7: Start the Application

### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected
✅ SMTP server is ready to send emails
🚀 Server running on http://localhost:3001
```

### Terminal 2 - Worker Process

```bash
cd backend
npm run worker
```

You should see:
```
✅ Connected to Redis
🚀 Email worker started with concurrency: 5
```

### Terminal 3 - Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

---

## Step 8: Test the Application

### 1. Access the Application
Open your browser and go to: http://localhost:3000

### 2. Login with Google
- Click the **"Sign in with Google"** button
- Choose your Google account
- Grant permissions
- You'll be redirected to the dashboard

### 3. Compose and Schedule Email

1. Click **"Compose New Email"** tab
2. Fill in:
   - **Subject**: Test Email
   - **Body**: This is a test email from Email Scheduler
3. Add recipients:
   - Option A: Upload a CSV file with emails
   - Option B: Paste emails (one per line):
     ```
     test1@example.com
     test2@example.com
     test3@example.com
     ```
4. Configure settings:
   - **Scheduled At**: Leave empty for immediate send, or pick a future time
   - **Delay Between Emails**: 1000 (1 second)
   - **Hourly Limit**: 100
5. Click **"Schedule Email"**

### 4. Monitor Progress

1. Switch to **"Scheduled Emails"** tab
2. You should see your email batch with status: PENDING → PROCESSING → COMPLETED
3. Watch the worker terminal for real-time logs
4. Switch to **"Sent Emails"** tab to see individual sent emails

### 5. Check Ethereal Inbox

1. Go to https://ethereal.email
2. Login with your Ethereal credentials
3. Check the inbox - you should see your test emails
4. Click on an email to view its content

---

## Common Issues & Solutions

### Issue: Database connection error
```
Error: Can't reach database server
```
**Solution**: 
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

### Issue: Redis connection error
```
Error: Redis connection failed
```
**Solution**:
```bash
# Check if Redis is running
docker-compose ps

# Restart if needed
docker-compose restart redis
```

### Issue: JWT_SECRET error
```
Error: JWT_SECRET environment variable is not set
```
**Solution**: Ensure you've set JWT_SECRET in backend/.env

### Issue: Google OAuth not working
**Solution**:
- Verify GOOGLE_CLIENT_ID is set in both backend and frontend .env files
- Check authorized origins and redirect URIs in Google Console
- Ensure frontend URL is exactly `http://localhost:3000`

### Issue: Emails not sending
**Solution**:
- Verify SMTP credentials in backend/.env
- Check worker is running (`npm run worker`)
- Check worker terminal for error messages

### Issue: Worker not processing jobs
**Solution**:
```bash
# Restart worker
# Press Ctrl+C in worker terminal, then:
cd backend
npm run worker
```

---

## Production Deployment

For production deployment, you'll need to:

1. **Update Environment Variables**:
   - Use production database URL
   - Use production Redis URL
   - Use real SMTP service (SendGrid, AWS SES, etc.)
   - Set NODE_ENV=production
   - Use strong JWT_SECRET

2. **Build Applications**:
   ```bash
   # Backend
   cd backend
   npm run build
   npm start

   # Frontend
   cd frontend
   npm run build
   npm start
   ```

3. **Configure Domains**:
   - Update Google OAuth redirect URIs
   - Update CORS settings
   - Setup SSL/TLS certificates
   - Configure environment-specific URLs

4. **Infrastructure**:
   - Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
   - Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
   - Deploy to cloud platform (Vercel, AWS, DigitalOcean, etc.)
   - Setup monitoring and logging

---

## Next Steps

✅ Application is running!

Now you can:
- Test different scheduling scenarios
- Upload CSV files with bulk recipients
- Test rate limiting with many emails
- Explore the codebase
- Read the [README.md](README.md) for architecture details
- Check [SECURITY.md](SECURITY.md) for security information

---

## Support

If you encounter issues:
1. Check this guide again
2. Review error messages in terminal
3. Check Docker logs: `docker-compose logs`
4. Review the [README.md](README.md) troubleshooting section
5. Open an issue on GitHub

---

**Happy Email Scheduling! 📧**
