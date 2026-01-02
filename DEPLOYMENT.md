# 🚀 Contribly Deployment Guide

Complete instructions for deploying Contribly to production.

## 📋 Pre-Deployment Checklist

- [ ] All code committed to git
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL/HTTPS certificate obtained
- [ ] Domain configured
- [ ] Email service configured
- [ ] Monitoring setup
- [ ] Security audit completed

## 🗄️ Database Deployment

### Option 1: AWS RDS PostgreSQL

```bash
# Create RDS instance
# - Engine: PostgreSQL 13+
# - Instance class: db.t3.micro (for dev/staging)
# - Storage: 20GB with autoscaling
# - Multi-AZ: Yes (production)
# - Backup retention: 30 days
# - Performance Insights: Enabled

# Get connection string from AWS Console
# Format: postgresql://user:password@host:port/database

# Run migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Create Prisma client
npx prisma generate
```

### Option 2: Heroku Postgres

```bash
# Create app
heroku create contribly-api
heroku addons:create heroku-postgresql:standard-0

# Get DATABASE_URL (auto-set)
heroku config:get DATABASE_URL

# Run migrations
heroku run npx prisma migrate deploy
```

### Option 3: Railway.app

```bash
# Create PostgreSQL service from dashboard
# Copy connection string

# Deploy backend (see below)
```

## 🔙 Backend Deployment

### Option 1: Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create contribly-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="$(openssl rand -hex 32)"
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set CORS_ORIGIN=https://yourdomain.com
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASSWORD=your-app-password

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: Railway.app

```bash
# Login and create project
railway login
railway init

# Create backend service
railway add

# Create PostgreSQL service
# Connect database to backend service

# Set environment variables in dashboard
# Deploy automatically on git push
```

### Option 3: Render.com

```bash
# Create Web Service from dashboard
# Connect GitHub repository
# Configure build command: npm install && npx prisma migrate deploy
# Configure start command: npm run start

# Set environment variables in dashboard
# Deploy on push
```

### Option 4: Self-Hosted (VPS)

```bash
# SSH into server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Clone repository
git clone https://github.com/yourusername/contribly.git
cd contribly/apps/api

# Install dependencies
npm install

# Create .env file
cat > .env.local << EOF
DATABASE_URL="postgresql://user:password@localhost/contribly"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EOF

# Run migrations
npx prisma migrate deploy

# Start with PM2
sudo npm install -g pm2
pm2 start npm --name "contribly-api" -- run start
pm2 startup
pm2 save

# Setup reverse proxy (nginx)
```

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
cd apps/web
vercel

# Set environment variables in dashboard
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Automatic deployments on git push
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from project root
cd apps/web
netlify deploy --prod

# Configure netlify.toml
cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# Set environment variables in dashboard
```

### Option 3: AWS Amplify

```bash
# Connect repository via AWS Amplify Console
# Configure build settings:
# Build command: npm run build
# Output directory: .next

# Set environment variables
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Option 4: GitHub Pages (Static Export)

```bash
# Update next.config.ts to enable static export
# (requires disabling dynamic features)

# Build
npm run build

# Deploy .next folder to GitHub Pages
```

## 🔐 Environment Variables

### Backend Production (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-key-here-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="production"
PORT="3001"

# CORS
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"

# Email (Gmail example with app password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
SMTP_FROM="Contribly <noreply@yourdomain.com>"

# Optional: SendGrid
# SENDGRID_API_KEY="your-sendgrid-key"

# Optional: AWS SES
# AWS_SES_REGION="us-east-1"
# AWS_SES_ACCESS_KEY_ID="your-key"
# AWS_SES_SECRET_ACCESS_KEY="your-secret"
```

### Frontend Production (.env.production)

```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"

# Optional: Analytics
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXX"

# Optional: Sentry error tracking
# NEXT_PUBLIC_SENTRY_DSN="https://..."
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Configure auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Point to certificates in nginx config
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Using AWS Certificate Manager

1. Request certificate in ACM console
2. Validate domain via email or DNS
3. Attach to load balancer/CloudFront
4. Auto-renews before expiration

## 🌐 Domain Configuration

### Point Domain to Deployment

**For Vercel:**
```
CNAME: vercel.domain-provider.com
```

**For Netlify:**
```
CNAME: netlify.domain-provider.com
```

**For AWS CloudFront:**
```
CNAME: xxxxx.cloudfront.net
```

**For Self-Hosted (nginx):**
```
A Record: your-server-ip
```

## 🔧 Nginx Configuration (Self-Hosted)

```nginx
# /etc/nginx/sites-available/contribly

upstream contribly_api {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Compression
    gzip on;
    gzip_types text/plain application/json;

    location / {
        proxy_pass http://contribly_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## 📊 Monitoring & Logging

### Backend Monitoring

```bash
# PM2 Monitoring
pm2 monit

# Sentry Error Tracking (add to backend)
npm install @sentry/node

# LogRocket (frontend error tracking)
npm install logrocket
```

### Database Monitoring

- AWS RDS: CloudWatch
- Heroku: Dataclips & Logs
- Self-hosted: pg_stat_statements

### Application Monitoring

- **New Relic**: Add APM agent
- **Datadog**: Infrastructure monitoring
- **CloudWatch**: AWS native monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: git push https://git.heroku.com/contribly-api.git main
        env:
          HEROKU_AUTH_TOKEN: ${{ secrets.HEROKU_AUTH_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🛡️ Security Best Practices

### Before Deploying

- [ ] Rotate all secrets and API keys
- [ ] Enable 2FA on service accounts
- [ ] Set up WAF rules
- [ ] Configure rate limiting
- [ ] Enable DDoS protection
- [ ] Configure CSP headers
- [ ] Set up intrusion detection
- [ ] Regular security audits
- [ ] Penetration testing

### Ongoing Security

- [ ] Automated dependency updates
- [ ] Regular security patches
- [ ] Monitor error logs
- [ ] Track anomalies
- [ ] Regular backups
- [ ] Disaster recovery drills

## 📈 Performance Optimization

### Backend

```bash
# Enable compression
npm install compression

# Connection pooling for database
# Configure in prisma.schema

# Rate limiting
npm install express-rate-limit

# Caching
npm install redis
```

### Frontend

```bash
# Image optimization
# Already built into Next.js

# Bundle analysis
npm run build && npm run analyze

# Web Vitals monitoring
# Already in Next.js
```

## 🚨 Disaster Recovery

### Database Backup Strategy

```bash
# Automated daily backups
# Retention: 30 days (AWS RDS)
# Test restore monthly
```

### Code Backup

- GitHub as primary repository
- Daily export to S3
- Disaster recovery plan documented

## 📞 Support & Monitoring Contacts

- **Uptime Monitoring**: Pingdom, Uptime Robot
- **Error Tracking**: Sentry dashboard
- **Performance Monitoring**: New Relic dashboard
- **Security Alerts**: GitHub Security advisories

## ✅ Post-Deployment Checklist

After deployment to production:

- [ ] Test login flow
- [ ] Test payment recording
- [ ] Test claim approval
- [ ] Test withdrawal request
- [ ] Verify emails are sending
- [ ] Check database backups
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Verify HTTPS works
- [ ] Test on mobile
- [ ] Get SSL A+ rating
- [ ] Setup monitoring alerts
- [ ] Document procedures
- [ ] Train support team

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Homepage loads in < 2s
- ✅ API responds in < 200ms
- ✅ Database connections stable
- ✅ Emails sending reliably
- ✅ Error rate < 0.1%
- ✅ No 5xx errors
- ✅ All features working
- ✅ HTTPS certificate valid
- ✅ Users can login/register
- ✅ Payments can be recorded

## 📞 Troubleshooting

### Deployment Issues

**Error: Database connection failed**
- Verify DATABASE_URL
- Check security groups/firewall
- Test connection locally
- Check database credentials

**Error: CORS issues**
- Verify CORS_ORIGIN matches frontend URL
- Check Accept-Credentials header
- Verify frontend sending cookies

**Error: Emails not sending**
- Check SMTP credentials
- Verify port 587 is open
- Test with telnet
- Check email logs

**Error: 503 Service Unavailable**
- Check backend process running
- Check file descriptor limits
- Check memory usage
- Review logs for crashes

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Heroku Deployment Docs](https://devcenter.heroku.com/)
- [Railway Deployment Docs](https://docs.railway.app/)
- [AWS Deployment Docs](https://docs.aws.amazon.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Deployment Status: Ready for Production** ✅
