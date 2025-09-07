# Deployment Guide - STMADB Portal Backend

## Production Deployment

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- PM2 (for process management)
- Nginx (for reverse proxy)
- SSL Certificate

### 1. Server Setup

#### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MySQL
sudo apt install mysql-server -y
```

#### Database Setup
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE stmadb_portal;
CREATE USER 'stmadb_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON stmadb_portal.* TO 'stmadb_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Application Deployment

#### Clone and Setup
```bash
# Clone repository
git clone <repository-url> /var/www/stmadb-portal-be
cd /var/www/stmadb-portal-be

# Install dependencies
npm ci --only=production

# Copy environment file
cp .env.example .env
```

#### Environment Configuration
```bash
# Edit production environment
nano .env
```

```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="mysql://stmadb_user:secure_password@localhost:3306/stmadb_portal"

# JWT (Generate secure secrets)
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here

# Other configs...
```

#### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

### 3. PM2 Configuration

#### Create PM2 Ecosystem File
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'stmadb-portal-be',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 4. Nginx Configuration

#### Create Nginx Configuration
```nginx
# /etc/nginx/sites-available/stmadb-portal-be
server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads {
        alias /var/www/stmadb-portal-be/uploads;
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stmadb-portal-be /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

### 7. Monitoring Setup

#### Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/stmadb-portal-be
```

```
/var/www/stmadb-portal-be/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop -y

# PM2 monitoring
pm2 monit

# View logs
pm2 logs stmadb-portal-be
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://stmadb_user:password@db:3306/stmadb_portal
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=stmadb_portal
      - MYSQL_USER=stmadb_user
      - MYSQL_PASSWORD=password
      - MYSQL_ROOT_PASSWORD=rootpassword
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
```

## Environment Variables for Production

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="mysql://username:password@localhost:3306/stmadb_portal"

# JWT - Generate secure random strings
JWT_SECRET=64-character-secure-random-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=64-character-different-secure-random-string
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Email (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Security Checklist

- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Use environment variables for sensitive data
- [ ] Regular security updates
- [ ] Database user with minimal privileges
- [ ] Firewall configuration
- [ ] Log monitoring
- [ ] Regular backups

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u stmadb_user -p stmadb_portal > /backups/stmadb_portal_$DATE.sql
gzip /backups/stmadb_portal_$DATE.sql

# Keep only last 30 days
find /backups -name "stmadb_portal_*.sql.gz" -mtime +30 -delete
```

### File Backup
```bash
# Backup uploads and logs
tar -czf /backups/files_$DATE.tar.gz uploads/ logs/
```

### Cron Jobs
```bash
# Edit crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh

# Weekly restart at 3 AM Sunday
0 3 * * 0 pm2 restart stmadb-portal-be
```

## Performance Optimization

### Database Optimization
- Use connection pooling
- Add proper indexes
- Regular ANALYZE TABLE
- Monitor slow queries

### Application Optimization
- Enable gzip compression
- Use PM2 cluster mode
- Implement caching where appropriate
- Monitor memory usage

### Nginx Optimization
```nginx
# Add to nginx configuration
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# Enable client caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   
   # Test connection
   mysql -u stmadb_user -p -h localhost stmadb_portal
   ```

2. **PM2 Process Issues**
   ```bash
   # Restart application
   pm2 restart stmadb-portal-be
   
   # Check logs
   pm2 logs stmadb-portal-be
   
   # Monitor resources
   pm2 monit
   ```

3. **Nginx Issues**
   ```bash
   # Check nginx status
   sudo systemctl status nginx
   
   # Test configuration
   sudo nginx -t
   
   # Check access logs
   sudo tail -f /var/log/nginx/access.log
   ```

### Health Monitoring

```bash
# Check application health
curl -f http://localhost:3000/api/health

# Check response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/health
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```
