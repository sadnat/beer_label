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

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
