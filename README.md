# Anti-Counterfeit Drug System

This project demonstrates a blockchain-based solution to combat counterfeit drugs using Ethereum smart contracts, a Node.js backend, and a React frontend.

## Project Structure

- `blockchain/`: Contains Ethereum smart contracts (Solidity), Truffle configuration, and deployment scripts.
- `backend/`: Node.js (Express.js) API that interacts with the Ethereum blockchain and serves data to the frontend.
- `frontend/`: React application providing the user interface for drug manufacturing, transfer, and verification.

## Setup and Running Locally

### Prerequisites

- Node.js (LTS version) & npm: [nodejs.org](https://nodejs.org/)
- Git: [git-scm.com](https://git-scm.com/downloads)
- Docker Desktop (optional for local dev, but useful for deployment): [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- `ganache-cli` and `truffle` (installed globally via npm):
  ```bash
  npm install -g ganache-cli truffle
  ```

### 1. Blockchain Setup

Navigate to the `blockchain` directory:

```bash
cd blockchain
```
