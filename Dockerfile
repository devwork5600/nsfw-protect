FROM node:18-slim
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/ ./packages/

# Install with legacy-peer-deps to fix your conflict
RUN npm install --legacy-peer-deps

# Copy the rest
COPY . .

# Build
RUN npm run build

# Default to running the API (we will override this in Railway settings)
CMD ["npm", "run", "start", "--workspace=@nsfw/api"]
