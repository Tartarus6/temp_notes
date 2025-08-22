#!/bin/bash

# Script to run temp-notes with Docker (CasaOS compatible)

# Build the image
echo "Building Docker image..."
docker build -t temp-notes .

# Stop and remove existing container if it exists
echo "Stopping existing container..."
docker stop temp-notes-app 2>/dev/null || true
docker rm temp-notes-app 2>/dev/null || true

# Run the new container
echo "Starting new container..."
docker run -d \
  --name temp-notes-app \
  -p 3001:3001 \
  -p 80:80 \
  -v $(pwd)/notes.db:/app/notes.db \
  -e NODE_ENV=production \
  -e PORT=80 \
  --restart unless-stopped \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=40s \
  temp-notes

echo "Container started! Check status with: docker ps"
echo "View logs with: docker logs -f temp-notes-app"
echo "Access the app at: http://localhost"
