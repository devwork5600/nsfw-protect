FROM node:22-slim
WORKDIR /app

# Install dependencies
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/email/package.json ./packages/email/

# Install root dependencies and then link all workspaces
RUN npm install --legacy-peer-deps && npm install --workspaces --legacy-peer-deps

# Copy the rest
COPY . .

# Build everything
RUN npm run build

# Default to running the API (we will override this in Railway settings)
CMD ["npm", "run", "start", "--workspace=@nsfw/api"]
