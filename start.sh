#!/bin/sh

# Create database file if it doesn't exist
touch notes.db

# Start the tRPC/database server in the background
echo "Starting tRPC server on port 3000..."
npm run start &

# Wait a moment for the tRPC server to start
sleep 5

# Start the SvelteKit website server
echo "Starting SvelteKit server on port 80..."
cd build && node index.js

# Keep the container running
wait