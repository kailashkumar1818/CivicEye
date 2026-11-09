FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source and scripts
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]

