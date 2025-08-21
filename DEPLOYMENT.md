# Docker Deployment Guide

This guide explains how to deploy your SvelteKit notes application with both the database server and website server in a single Docker container to your production server.

## Architecture

Your application consists of:
- **tRPC/Database Server**: Runs on port 3000, handles API requests and database operations
- **SvelteKit Website Server**: Runs on port 3001, serves the frontend application
- **SQLite Database**: Persisted as a volume mount for data persistence

## Local Testing

First, test locally to ensure everything works:

```bash
# Build and run locally
docker-compose up --build
```

Your application will be available at:
- Website: http://localhost:3001
- API: http://localhost:3000

## Server Deployment

### Option 1: Deploy with Docker Compose (Recommended)

1. **Transfer files to your server**:
   ```bash
   # Copy your project to the server
   scp -r /path/to/temp_notes user@your-server:/path/to/deployment/
   ```

2. **On your server, navigate to the project directory**:
   ```bash
   cd /path/to/deployment/temp_notes
   ```

3. **Build and run the application**:
   ```bash
   docker-compose up --build -d
   ```

4. **Check the logs**:
   ```bash
   docker-compose logs -f
   ```

### Option 2: Build Image and Deploy

1. **Build the Docker image locally**:
   ```bash
   docker build -t your-registry/notes-app:latest .
   ```

2. **Push to your container registry** (optional):
   ```bash
   docker push your-registry/notes-app:latest
   ```

3. **Run on your server**:
   ```bash
   docker run -d \
     --name notes-app \
     -p 3000:3000 \
     -p 3001:3001 \
     -v /path/to/data/notes.db:/app/notes.db \
     --restart unless-stopped \
     your-registry/notes-app:latest
   ```

## Production Configuration

### Port Mapping

Update your `docker-compose.yml` or Docker run command to map to appropriate ports:

```yaml
ports:
  - "80:3001"   # Map website to port 80
  - "3000:3000" # Keep API on port 3000
```

### Environment Variables

Set production environment variables:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
```

### Database Persistence

**Critical**: Ensure your database is persisted with volume mounts:

```yaml
volumes:
  - ./data/notes.db:/app/notes.db  # Local file
  # OR
  - notes_data:/app/              # Named volume
```

### Reverse Proxy Setup (Recommended)

For production, use a reverse proxy like Nginx:

```nginx
# /etc/nginx/sites-available/notes-app
server {
    listen 80;
    server_name your-domain.com;

    # Website
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Update CORS for HTTPS

Update `src/lib/server/server.ts` CORS settings:

```typescript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-domain.com', 'http://localhost:3001']
  : ['http://localhost:4173', 'http://localhost:5173', 'http://localhost:3001']
```

## Monitoring & Maintenance

### Health Checks

The Docker Compose includes health checks. Monitor with:

```bash
docker-compose ps
docker-compose logs --tail=50
```

### Backup Strategy

**Database Backup**:
```bash
# Create backup
cp /path/to/data/notes.db /path/to/backups/notes-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/data/notes.db /path/to/backups/notes-$DATE.db
find /path/to/backups -name "notes-*.db" -mtime +7 -delete
```

### Container Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

## Troubleshooting

### Container Issues
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs notes-app

# Restart services
docker-compose restart
```

### Database Issues
```bash
# Check database file permissions
ls -la notes.db

# Backup and recreate if corrupted
cp notes.db notes.db.backup
rm notes.db
docker-compose restart
```

### Network Issues
```bash
# Check port availability
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# Test API connectivity
curl http://localhost:3000/noteList
```

## Security Considerations

1. **Firewall**: Only expose necessary ports (80, 443, SSH)
2. **Updates**: Keep Docker and system packages updated
3. **Backups**: Regular database backups
4. **SSL**: Always use HTTPS in production
5. **Access**: Limit server access to authorized users

## Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

### Database Optimization

For high-traffic deployments, consider:
- Moving to PostgreSQL
- Adding connection pooling
- Implementing caching (Redis)

## Quick Reference Commands

```bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# View logs
docker-compose logs -f

# Update application
git pull && docker-compose up --build -d

# Backup database
cp notes.db notes-backup-$(date +%Y%m%d).db

# Check health
curl http://localhost:3001
```