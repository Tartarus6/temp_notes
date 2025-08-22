# Use Node.js 20 LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for better-sqlite3 and other native modules
RUN apk add --no-cache python3 make g++ sqlite

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed at runtime)
RUN npm ci

# Copy source code
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts
COPY svelte.config.js ./svelte.config.js
COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY tailwind.config.js ./tailwind.config.js
COPY eslint.config.js ./eslint.config.js
COPY static ./static

# Build the application inside Docker
RUN npm run build

# Create an empty database file if it doesn't exist
RUN touch notes.db

# Copy database if it exists (but don't fail if it doesn't)
COPY notes.db* ./

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Expose ports
EXPOSE 3001 80

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Start both servers
CMD ["./start.sh"]