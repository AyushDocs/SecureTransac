# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:5000/api
ARG VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ARG VITE_IDENTITY_VAULT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
ARG VITE_VERIFICATION_REGISTRY_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
ARG VITE_AV_TOKEN_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
