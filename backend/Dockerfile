FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package.json ./
RUN npm install

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Expose port
EXPOSE 3000

# Run as non-root user
USER nodejs

# Start the server
CMD ["node", "dist/index.js"]
