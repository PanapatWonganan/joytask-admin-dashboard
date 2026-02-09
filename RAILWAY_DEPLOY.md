# Railway Deployment Guide - JoyTask Admin Dashboard

## Overview
- **Backend**: Laravel 12 (PHP 8.2) + MySQL
- **Frontend**: Next.js 16

---

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Create new project
3. You'll create 3 services:
   - MySQL Database
   - Backend (Laravel)
   - Frontend (Next.js)

---

## Step 2: Add MySQL Database

1. Click **"+ New"** → **"Database"** → **"MySQL"**
2. Wait for MySQL to provision
3. Railway will auto-generate these variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

---

## Step 3: Deploy Backend (Laravel)

### 3.1 Connect Repository
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Set **Root Directory**: `admin-dashboard/backend`

### 3.2 Add Environment Variables
Go to **Variables** tab and add:

```env
APP_NAME=JoyTask Admin
APP_ENV=production
APP_KEY=base64:YOUR_KEY_HERE
APP_DEBUG=false
APP_URL=${{RAILWAY_PUBLIC_DOMAIN_VALUE}}

# Reference MySQL service variables
DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Google OAuth
GOOGLE_CLIENT_ID=966199365060-avi5q4k9dqq5nukghpscogm1q3dil4d9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

### 3.3 Generate APP_KEY
Run locally:
```bash
php artisan key:generate --show
```
Copy the output and paste into `APP_KEY` variable.

### 3.4 Run Migrations
After first deploy, go to **Settings** → **Deploy** and run:
```bash
php artisan migrate --force
php artisan db:seed --force
```

Or add this to your deploy command in railway.toml.

---

## Step 4: Deploy Frontend (Next.js)

### 4.1 Connect Repository
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Set **Root Directory**: `admin-dashboard/frontend`

### 4.2 Add Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
NEXT_PUBLIC_APP_NAME=JoyTask Admin Dashboard
```

Replace `your-backend.up.railway.app` with your actual backend URL from Step 3.

---

## Step 5: Configure Domains

1. For each service, go to **Settings** → **Networking**
2. Click **"Generate Domain"** or add custom domain
3. Update `FRONTEND_URL` in backend with frontend domain
4. Update `NEXT_PUBLIC_API_URL` in frontend with backend domain

---

## Step 6: Verify Deployment

### Test Backend
```bash
curl https://your-backend.up.railway.app/up
# Should return: {"status": "ok"}

curl https://your-backend.up.railway.app/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Test Frontend
Open `https://your-frontend.up.railway.app` in browser.

---

## Troubleshooting

### Database Connection Error
- Check MySQL service is running
- Verify DB_* variables reference MySQL service correctly
- Check Railway's variable reference syntax: `${{ServiceName.VAR}}`

### 502 Bad Gateway
- Check deploy logs for errors
- Verify Dockerfile builds successfully
- Check health check endpoint `/up` is accessible

### CORS Error
- Verify `FRONTEND_URL` is set in backend
- Check `config/cors.php` includes your frontend domain

---

## Connecting Flutter App

After deployment, update your Flutter app:

1. Edit `lib/core/api/api_config.dart`:
```dart
static const bool demoMode = false;  // Disable demo mode
static const String baseUrl = 'https://your-backend.up.railway.app';
```

2. Rebuild and test the app.

---

## Cost Estimate

Railway pricing (as of 2024):
- **Starter Plan**: $5/month (includes $5 credits)
- **MySQL**: ~$5-10/month depending on usage
- **Backend + Frontend**: ~$5-15/month

Total: **~$15-30/month** for small-medium traffic

---

## Files Created

```
backend/
├── Dockerfile
├── railway.toml
├── .env.production (template)
└── docker/
    ├── nginx.conf
    └── supervisord.conf

frontend/
├── railway.toml
└── .env.production (template)
```
