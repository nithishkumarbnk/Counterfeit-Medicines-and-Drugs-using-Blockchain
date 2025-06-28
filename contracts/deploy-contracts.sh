#!/bin/bash

set -e

echo "Waiting for Ganache to be ready..."
# Loop until Ganache's RPC port is open
MAX_WAIT_TIME=60 # seconds
ELAPSED_TIME=0

while ! nc -z blockchain 8545; do
  echo "Ganache not yet ready on blockchain:8545. Waiting 1 second... (Elapsed: ${ELAPSED_TIME}s)"
  sleep 1
  ELAPSED_TIME=$((ELAPSED_TIME+1))
  if [ "$ELAPSED_TIME" -ge "$MAX_WAIT_TIME" ]; then
    echo "Error: Ganache did not become ready within ${MAX_WAIT_TIME} seconds. Exiting."
    exit 1
  fi
done
echo "Ganache is ready. Compiling and migrating contracts..."

# Compile all contracts
truffle compile --all

# Migrate (deploy) contracts to the development network
truffle migrate --network development

echo "Contracts compiled and migrated successfully!"
