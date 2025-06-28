# backend/Dockerfile

# Stage 1: Build the Node.js application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Add ARG and ENV for the Firebase Service Account Key
ARG FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
ENV FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=$FIREBASE_SERVICE_ACCOUNT_KEY_BASE64

# Stage 2: Create a smaller production image (optional, but good practice)
# FROM node:20-alpine
# WORKDIR /app
# COPY --from=build /app .
# CMD ["node", "server.js"]
# If you use a multi-stage build, ensure the ENV is passed to the final stage.
# For simplicity, we'll stick to a single stage for now, as it's common in dev.

CMD ["node", "server.js"]
