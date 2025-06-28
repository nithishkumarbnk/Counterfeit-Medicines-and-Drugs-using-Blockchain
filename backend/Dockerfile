# backend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the compiled contract artifacts from the blockchain directory
# The build context for this Dockerfile is 'backend/', so '../blockchain/build/contracts'
# refers to the 'blockchain/build/contracts' directory relative to the root of your Git repo.
# We copy it to '/app/blockchain_artifacts/contracts' inside the container.
COPY ../blockchain/build/contracts /app/blockchain_artifacts/contracts

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "src/server.js"]
