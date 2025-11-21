#!/bin/sh

# Create database file if it doesn't exist
touch notes.db

# Wait a moment for the tRPC server to start
sleep 5

# Start the SvelteKit website server
echo "Starting SvelteKit server on port 80..."
cd build && node index.js

# Keep the container running
wait