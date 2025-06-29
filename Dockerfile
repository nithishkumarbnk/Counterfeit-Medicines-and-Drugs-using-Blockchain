# Dockerfile (now at the root of anti-counterfeit-drug-system/)

# Stage 0: Copy entire repository to get access to all files
# This stage is now simpler because the Dockerfile is at the root,
# so '.' refers directly to the repository root.
FROM alpine/git as repo_cloner
WORKDIR /repo

# Copy the entire repository content into /repo
COPY . /repo/

# Stage 1: Build the Node.js backend
FROM node:18-alpine as backend_builder

# Set working directory for the backend application
WORKDIR /app

# Copy package.json and package-lock.json from the backend directory within /repo
COPY --from=repo_cloner /repo/backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the compiled contract artifacts from the blockchain directory within /repo
COPY --from=repo_cloner /repo/blockchain/build/contracts /app/blockchain_artifacts/contracts

# Copy the rest of the backend application code from the backend directory within /repo
COPY --from=repo_cloner /repo/backend/. .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "src/server.js"]
