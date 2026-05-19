FROM node:22-slim
WORKDIR /app

# Install dependencies
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
COPY package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/email/package.json ./packages/email/

# Install dependencies using npm ci for reliable workspace hoisting
RUN npm ci --legacy-peer-deps

# Copy the rest
COPY . .

# Build everything
RUN npm run build

# Default to running the API (we will override this in Railway settings)
CMD ["npm", "run", "start", "--workspace=@nsfw/api"]
