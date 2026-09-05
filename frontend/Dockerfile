# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:5000/api
ARG VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ARG VITE_IDENTITY_VAULT_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
ARG VITE_VERIFICATION_REGISTRY_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
ARG VITE_AV_TOKEN_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
