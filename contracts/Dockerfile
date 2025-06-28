# contracts/Dockerfile
# Use a Node.js base image, as Truffle and Ganache CLI are Node.js packages
FROM node:20-alpine

# Install bash (and netcat for the migrator's wait command)
RUN apk add --no-cache bash netcat-openbsd

# Set the working directory inside the container
WORKDIR /app

# Copy the deployment script
COPY deploy-contracts.sh . 

# Install Truffle and Ganache CLI globally
RUN npm install -g truffle ganache

# Copy the rest of the contracts directory into the container
COPY . .

# Expose the default Ganache port
EXPOSE 8545

# Command to run Ganache when the container starts
# This will be overridden by Docker Compose, but good for standalone testing
CMD ["ganache", "--port", "8545"]
