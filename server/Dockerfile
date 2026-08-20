# Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install native build deps for sqlite3 before npm ci
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]