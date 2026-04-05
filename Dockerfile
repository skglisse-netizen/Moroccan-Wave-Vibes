# STAGE 1: Build the frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy configuration and package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the frontend (Vite)
RUN npm run build

# STAGE 2: Final image
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev && \
    npm install -g tsx  # Needed to run server.ts

# Copy the built frontend from stage 1
COPY --from=builder /app/dist ./dist

# Copy the server and related files
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/database ./database
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middlewares ./middlewares

# Create uploads directory
RUN mkdir -p uploads

# Expose the app port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server using tsx
CMD ["tsx", "server.ts"]
