# backend/Dockerfile

# Stage 0: Copy entire repository to get access to blockchain artifacts
# We use a simple alpine image with git, though Render's build environment often
# has git pre-installed. This stage ensures we have a clean copy of the whole repo.
FROM alpine/git as repo_cloner
WORKDIR /repo

# Render's "Root Directory" setting means the build context is 'backend/'.
# To get the full repository content, we need to copy from the parent directory (../)
# relative to the Dockerfile's location (which is in 'backend/').
# So, '..' refers to the root of your Git repository.
COPY .. /repo/ 

# Stage 1: Build the Node.js backend
FROM node:18-alpine as backend_builder

# Set working directory for the backend application
WORKDIR /app

# Copy package.json and package-lock.json from the backend directory
# These are now relative to /repo/backend from the previous stage
COPY --from=repo_cloner /repo/backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the compiled contract artifacts from the blockchain directory
# These are now relative to /repo/blockchain from the previous stage
COPY --from=repo_cloner /repo/blockchain/build/contracts /app/blockchain_artifacts/contracts

# Copy the rest of the backend application code
# These are also relative to /repo/backend from the previous stage
COPY --from=repo_cloner /repo/backend/. .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "src/server.js"]
