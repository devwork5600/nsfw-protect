FROM node:22-slim
WORKDIR /app

# Install dependencies
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install with legacy-peer-deps to fix your conflict
RUN npm install --legacy-peer-deps

# Copy the rest
COPY . .

# Build
RUN npm run build

# Default to running the API (we will override this in Railway settings)
CMD ["npm", "run", "start", "--workspace=@nsfw/api"]
