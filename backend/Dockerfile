# -------------------------------------------------------------
# Certified Backend Dockerfile
# Experiment 10: Docker and DevOps Deployment
# -------------------------------------------------------------

# Step 1: Base image using official Node.js 20 LTS Alpine (lightweight & secure)
FROM node:20-alpine

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Default environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=5000

# Step 4: Copy dependency declarations first to leverage Docker layer caching
COPY package*.json ./

# Step 5: Install dependencies cleanly for production
RUN npm install --omit=dev --no-audit

# Step 6: Copy application source code (excluded files governed by .dockerignore)
COPY . .

# Step 7: Expose backend port
EXPOSE 5000

# Step 8: Define health check using built-in /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Step 9: Start the production server
CMD ["node", "server.js"]
