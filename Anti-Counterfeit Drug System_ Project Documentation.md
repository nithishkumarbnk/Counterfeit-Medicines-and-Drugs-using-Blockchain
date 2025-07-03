# Anti-Counterfeit Drug System: Project Documentation

## 1. Introduction

This document provides comprehensive technical documentation for the Anti-Counterfeit Drug System, a full-stack decentralized application designed to combat the pervasive issue of counterfeit pharmaceuticals. Leveraging blockchain technology, the system aims to enhance transparency, traceability, and authenticity within the drug supply chain, from manufacturing to dispensing.

Counterfeit drugs pose a significant global health threat, leading to treatment failures, drug resistance, and even fatalities. The lack of a robust, immutable, and transparent tracking mechanism in traditional supply chains makes it challenging to verify the authenticity of pharmaceutical products and identify points of diversion or adulteration. This project addresses these critical challenges by implementing a secure and verifiable digital ledger for drug provenance.

## 2. Problem Statement

The global pharmaceutical supply chain is complex, involving numerous stakeholders from manufacturers and distributors to pharmacies and patients. This complexity, coupled with insufficient transparency and fragmented data systems, creates fertile ground for the proliferation of counterfeit drugs. The consequences are severe and multifaceted:

* **Public Health Risks:** Counterfeit drugs often contain incorrect dosages, harmful ingredients, or no active pharmaceutical ingredients (APIs) at all. This can lead to ineffective treatments, adverse drug reactions, and the development of drug-resistant pathogens, directly endangering patient lives.
* **Economic Losses:** The illicit trade in counterfeit medicines results in billions of dollars in losses for legitimate pharmaceutical companies annually, impacting research and development, and undermining consumer trust.
* **Erosion of Trust:** The presence of fake drugs erodes public trust in healthcare systems, pharmaceutical products, and regulatory bodies.
* **Lack of Traceability:** Traditional paper-based or siloed electronic record-keeping systems make it exceedingly difficult to trace a drug's journey from its origin to the end-user. This opacity hinders rapid recall efforts and the identification of points of compromise.
* **Inefficient Recalls:** In the event of a contaminated or faulty batch, inefficient traceability mechanisms delay recalls, increasing potential harm to patients.

The existing centralized systems are vulnerable to data manipulation, single points of failure, and lack the inherent immutability required for critical supply chain data. There is a pressing need for a secure, transparent, and immutable system that can provide real-time, verifiable information about a drug's authenticity and journey through the supply chain.

## 3. Solution Overview

To address the challenges posed by counterfeit drugs and the opacity of traditional supply chains, this project proposes and implements a blockchain-based Anti-Counterfeit Drug System. Blockchain technology offers inherent properties that are uniquely suited to solve these problems:

* **Immutability:** Once a transaction (e.g., drug manufacturing, transfer) is recorded on the blockchain, it cannot be altered or deleted. This ensures the integrity and trustworthiness of the drug's history.
* **Transparency:** All authorized participants in the supply chain can view the complete, verifiable history of a drug, enhancing accountability and reducing fraud.
* **Decentralization:** By distributing the ledger across multiple nodes, the system eliminates single points of failure and reduces the risk of data manipulation by any single entity.
* **Traceability:** Each drug is assigned a unique identifier, and its movement through the supply chain is meticulously recorded as a series of transactions, creating an auditable trail from manufacturer to patient.
* **Security:** Cryptographic principles secure transactions and participant identities, protecting against unauthorized access and tampering.

The system leverages a hybrid approach, combining the immutability and transparency of a blockchain (Sepolia Testnet) for critical transaction records with the efficiency and scalability of a centralized database (MongoDB Atlas) for fast data retrieval and complex queries. This ensures that the system can handle large volumes of data while maintaining the integrity of the core supply chain events.

## 4. System Architecture

The Anti-Counterfeit Drug System employs a multi-layered architecture designed for robustness, scalability, and maintainability. It comprises four primary components:

1. **Smart Contracts (Blockchain Layer):** The foundational layer, defining the core business logic and data structures for drug tracking and role management on the Ethereum blockchain.
2. **Backend API (Application Layer):** A Node.js Express server that acts as an intermediary between the frontend and the blockchain/database. It handles user authentication, authorization, and exposes RESTful APIs for interacting with the system.
3. **Blockchain Indexer (Data Synchronization Layer):** A separate Node.js application responsible for listening to blockchain events, processing them, and persisting the immutable transaction history into a centralized database.
4. **Frontend (Presentation Layer):** A React-based web application providing a user-friendly interface for various stakeholders to interact with the system.

### 4.2. Component Breakdown

#### 4.2.1. Smart Contracts

* **Technology:** Solidity, Truffle Framework, OpenZeppelin Contracts.
* **Purpose:** Defines the immutable rules and data structures for the drug supply chain. Key functionalities include:
  * **Drug Lifecycle Management:** Functions to `manufactureDrug`, `transferDrug`, and `logColdChainViolation`.
  * **Role-Based Access Control (RBAC):** Utilizes OpenZeppelin's `AccessControl` contract to manage different roles (`DEFAULT_ADMIN_ROLE`, `MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `REGULATOR_ROLE`) and restrict access to sensitive functions.
  * **Events:** Emits events (`DrugManufactured`, `DrugTransferred`, `ColdChainViolation`, `RoleGranted`, `OwnershipTransferred`) to signal state changes on the blockchain, which are then picked up by the indexer.

#### 4.2.2. Backend API

* **Technology:** Node.js, Express.js, `web3.js` (v1.x), Mongoose (for MongoDB interaction), `jsonwebtoken` (for authentication).
* **Deployment:** Render.
* **Purpose:** Serves as the central hub for application logic, handling requests from the frontend and orchestrating interactions with the blockchain and MongoDB.
  * **Authentication & Authorization:** Implements a basic username/password authentication system for demo purposes, issuing a token. Middleware (`authenticateToken`) protects sensitive routes based on this token.
  * **Blockchain Interaction:** Uses `web3.js` to sign and send transactions to the Sepolia testnet (e.g., manufacturing, transferring drugs, managing roles) using a loaded private key.
  * **Database Interaction:** Provides RESTful endpoints to query drug data and history from MongoDB Atlas, ensuring fast and scalable read operations.
  * **Environment Variables:** Securely manages sensitive information like `WEB3_PROVIDER_URL`, `MANUFACTURER_PRIVATE_KEY`, `DRUG_TRACKING_CONTRACT_ADDRESS`, `MONGO_URI`, and `SECRET_TOKEN`.

#### 4.2.3. Blockchain Indexer

* **Technology:** Node.js, `web3.js` (v1.x), Mongoose.
* **Deployment:** Designed to run as a persistent service (e.g., locally or on a cloud VM).
* **Purpose:** Ensures data consistency between the immutable blockchain ledger and the query-optimized MongoDB database. It performs two main tasks:
  * **Historical Sync:** Fetches past events from the blockchain starting from a specified block number.
  * **Real-time Listening:** Subscribes to new blockchain events as they occur.
  * **Data Transformation & Storage:** Parses event data (e.g., `DrugManufactured`, `DrugTransferred`, `ColdChainViolation`, `RoleGranted`), transforms it into a structured format, and stores it in relevant collections within MongoDB (e.g., `drugs`, `drugHistoryEvents`, `roleManagementEvents`).
  * **State Management:** Tracks the last indexed block number to ensure continuous and non-redundant indexing.

#### 4.2.4. Frontend

* **Technology:** React.js, Material-UI (MUI), Axios.
* **Deployment:** Vercel.
* **Purpose:** Provides an intuitive and responsive user interface for different stakeholders in the drug supply chain.
  * **User Authentication:** Presents a login form and manages authentication tokens in local storage.
  * **Role-Based Dashboards:** Dynamically renders specific tabs and content based on the logged-in user's assigned roles (`MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `REGULATOR_ROLE`, `ADMIN_ROLE`).
  * **Forms:** Provides dedicated forms for manufacturing, transferring, logging violations, and managing roles.
  * **Data Display:** Fetches and displays drug information, transaction history, and violation logs from the Backend API.
  * **Client-Side Validation:** Offers immediate feedback to users on input errors before sending requests to the backend.

## 5. Technical Implementation

This section delves into the specific technical details and key code aspects of each component within the Anti-Counterfeit Drug System.

### 5.1. Smart Contracts (Solidity)

The core logic of the drug tracking system resides in the `DrugTracking.sol` smart contract. It defines the data structures for drugs, manages roles, and records all critical supply chain events.

**Key Features and Implementation Details:**

* **OpenZeppelin `AccessControl`:** The contract inherits from `AccessControl.sol` to implement granular role-based permissions. This is crucial for ensuring that only authorized entities can perform specific actions (e.g., only a `MANUFACTURER_ROLE` can manufacture a drug).

  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.20;

  import "@openzeppelin/contracts/access/AccessControl.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  // ... other imports ...

  contract DrugTracking is AccessControl, Ownable {
      // Define roles as bytes32 constants
      bytes32 public constant DEFAULT_ADMIN_ROLE = keccak256("DEFAULT_ADMIN_ROLE");
      bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
      bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
      bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
      bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

      // ... rest of contract ...

      constructor() {
          _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); // Deployer gets admin role
          _setupRole(DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE); // Admin can manage admin role
          // ... grant other initial roles if needed ...
      }

      // ... functions with onlyRole modifier ...
  }
  ```
* **Drug Structure:** A `struct Drug` is used to store all relevant information about a pharmaceutical product.

  ```solidity
  struct Drug {
      string id;             // Unique Drug ID (e.g., GS1 GTIN)
      string productId;      // Product Identifier
      string batchId;        // Batch Identifier
      address manufacturer;  // Address of the manufacturer
      address currentOwner;  // Current owner of the drug
      string status;         // Current status (e.g., "MANUFACTURED", "IN_TRANSIT")
      uint256 lastUpdateTimestamp; // Timestamp of last status update
      string[] history;      // Array of historical events for the drug
  }
  mapping(string => Drug) public drugs; // Mapping from drug ID to Drug struct
  ```
* **Core Functions:**

  * **`manufactureDrug(string _id, string _productId, string _batchId)`:** Called by a `MANUFACTURER_ROLE` to register a new drug on the blockchain. It initializes the drug's details, sets the manufacturer and current owner, and records the initial status. An `DrugManufactured` event is emitted.
  * **`transferDrug(string _id, address _newOwner, string _newStatus)`:** Called by the `currentOwner` of a drug to transfer its ownership to a `_newOwner` and update its `_newStatus`. An `DrugTransferred` event is emitted.
  * **`logColdChainViolation(string _id, uint256 _timestamp, int256 _temperature, int256 _humidity, string _details)`:** Allows any authorized role (e.g., `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`) to record a cold chain violation for a specific drug. A `ColdChainViolation` event is emitted.
  * **`verifyDrug(string _id)`:** A `view` function that allows anyone to retrieve the current details and history of a drug by its ID.
* **Events:** Crucial for off-chain data processing. Events are emitted for every significant action, allowing the Blockchain Indexer to capture and store this data efficiently.

  ```solidity
  event DrugManufactured(string id, string productId, string batchId, address manufacturer, address initialOwner);
  event DrugTransferred(string id, address from, address to, string newStatus);
  event ColdChainViolation(string id, uint256 timestamp, int256 temperature, int256 humidity, string details);
  // OpenZeppelin AccessControl also emits RoleGranted, RoleRevoked events
  ```
* **Truffle Configuration (`truffle-config.js`):** Configures the compilation and deployment settings, including network details (Sepolia), compiler version, and `HDWalletProvider` for account management.

  ```javascript
  // Example snippet from truffle-config.js
  const HDWalletProvider = require('@truffle/hdwallet-provider');
  require('dotenv').config();

  const MNEMONIC = process.env.MNEMONIC;
  const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL;

  module.exports = {
    networks: {
      sepolia: {
        provider: () => new HDWalletProvider(MNEMONIC, WEB3_PROVIDER_URL),
        network_id: 11155111, // Sepolia's network ID
        confirmations: 2,
        timeoutBlocks: 200,
        skipDryRun: true,
        gas: 5000000, // Example gas limit
        gasPrice: 1000000000, // Example gas price (1 Gwei)
      },
    },
    compilers: {
      solc: {
        version: "0.8.20", // Specify compiler version
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "london"
        }
      }
    },
    db: {
      enabled: false
    }
  };
  ```

### 5.2. Backend API (Node.js/Express)

The backend serves as the bridge between the frontend and the blockchain/database. It handles authentication, authorization, and exposes RESTful APIs.

**Key Implementation Details:**

* **`server.js`:** The main entry point for the Express application.
* **Environment Variables:** Uses `dotenv` to load configuration from a `.env` file, ensuring sensitive data is not hardcoded.

  ```javascript
  // .env example
  PORT=10000
  WEB3_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
  MANUFACTURER_PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_DEPLOYER_ACCOUNT
  DRUG_TRACKING_CONTRACT_ADDRESS=0xYourDeployedContractAddress
  MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority
  SECRET_TOKEN=aVerySecretKeyForAuth
  ```
* **Web3 Initialization:** Connects to the Ethereum network using `web3.js` and loads the private key for transaction signing.

  ```javascript
  const Web3 = require('web3');
  const contractABI = require('./blockchain_artifacts/contracts/DrugTracking.json').abi;
  const contractAddress = process.env.DRUG_TRACKING_CONTRACT_ADDRESS;

  let web3;
  let drugTrackingContract;

  const loadContract = async () => {
      try {
          const providerUrl = process.env.WEB3_PROVIDER_URL;
          if (providerUrl.startsWith('ws')) {
              web3 = new Web3(new Web3.providers.WebsocketProvider(providerUrl));
          } else {
              web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
          }

          // Add private key to wallet for signing transactions
          const privateKey = process.env.MANUFACTURER_PRIVATE_KEY;
          if (!privateKey) {
              throw new Error("MANUFACTURER_PRIVATE_KEY is not set in environment variables.");
          }
          web3.eth.accounts.wallet.add(privateKey);

          drugTrackingContract = new web3.eth.Contract(contractABI, contractAddress);
          console.log(`Connected to contract at: ${contractAddress}`);

          // Verify connection
          const latestBlock = await web3.eth.getBlockNumber();
          console.log(`Connected to Web3, latest block: ${latestBlock}`);

          // Get the address of the loaded private key
          const loadedAddress = web3.eth.accounts.wallet[0].address;
          console.log(`Manufacturer account added: ${loadedAddress}`);

      } catch (error) {
          console.error("Failed to load Web3 or contract:", error);
          process.exit(1);
      }
  };
  ```
* **MongoDB Connection:** Uses Mongoose to connect to MongoDB Atlas.

  ```javascript
  const mongoose = require('mongoose');

  const connectToMongoDb = async () => {
      try {
          await mongoose.connect(process.env.MONGO_URI);
          console.log("Connected to MongoDB Atlas.");
      } catch (error) {
          console.error("MongoDB connection failed:", error);
          process.exit(1);
      }
  };
  ```
* **Authentication Middleware:** A simple JWT-like authentication middleware to protect routes.

  ```javascript
  const jwt = require('jsonwebtoken');
  const SECRET_TOKEN = process.env.SECRET_TOKEN;

  const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token == null) return res.status(401).json({ error: "Authentication token required." });

      jwt.verify(token, SECRET_TOKEN, (err, user) => {
          if (err) return res.status(403).json({ error: "Invalid or expired token." });
          req.user = user; // Contains username and roles
          next();
      });
  };
  ```
* **API Endpoints:** Implements various RESTful endpoints for frontend interaction. Each blockchain write operation includes gas estimation and sending the transaction from the loaded private key.

  ```javascript
  // Example: Manufacture Drug Endpoint
  app.post("/api/drug/manufacture", authenticateToken, async (req, res) => {
      try {
          const { id, productId, batchId, manufacturerAddress } = req.body;
          const loadedAddress = web3.eth.accounts.wallet[0]?.address;

          if (!loadedAddress || loadedAddress.toLowerCase() !== manufacturerAddress.toLowerCase()) {
              return res.status(400).json({ error: "Signing address mismatch. Ensure the provided manufacturer address matches the server's loaded private key address." });
          }

          // Check if the loaded address has MANUFACTURER_ROLE
          const hasRole = await drugTrackingContract.methods.hasRole(drugTrackingContract.methods.MANUFACTURER_ROLE().encodeABI(), loadedAddress).call();
          if (!hasRole) {
              return res.status(403).json({ error: "Unauthorized: Server's address does not have MANUFACTURER_ROLE." });
          }

          const gasEstimate = await drugTrackingContract.methods.manufactureDrug(id, productId, batchId)
              .estimateGas({ from: loadedAddress });

          const receipt = await drugTrackingContract.methods.manufactureDrug(id, productId, batchId)
              .send({
                  from: loadedAddress,
                  gas: gasEstimate + 100000, // Add buffer
                  gasPrice: web3.utils.toWei('1.5', 'gwei') // Example gas price
              });

          res.status(200).json({
              message: "Drug manufactured successfully.",
              transactionHash: receipt.transactionHash,
          });
      } catch (error) {
          console.error("Manufacture error:", error);
          res.status(500).json({ error: error.message || "Failed to manufacture drug." });
      }
  });

  // Example: Get All Drugs Endpoint (reads from MongoDB)
  app.get("/api/getAllDrugs", authenticateToken, async (req, res) => {
      try {
          const drugs = await mongoDb.collection("drugs").find({}).toArray();
          res.json(drugs);
      } catch (error) {
          console.error("Error fetching all drugs:", error);
          res.status(500).json({ message: "Error fetching all drugs." });
      }
  });
  ```

### 5.3. Blockchain Indexer (Node.js)

The indexer is a standalone Node.js application responsible for continuously syncing blockchain events to MongoDB. It ensures that the backend and frontend have fast access to historical and real-time data without directly querying the blockchain for every read.

**Key Implementation Details:**

* **`indexer.js`:** The main script for the indexer.
* **Event Handling:** Listens for specific events emitted by the `DrugTracking` contract.

  ```javascript
  // Example: Event processing logic
  const processEvent = async (event) => {
      console.log(`Processing event: ${event.event} from block ${event.blockNumber}`);
      const eventData = event.returnValues;
      const eventType = event.event;
      const transactionHash = event.transactionHash;
      const blockNumber = event.blockNumber;
      const eventTimestamp = (await web3.eth.getBlock(blockNumber)).timestamp * 1000; // Convert to milliseconds

      try {
          switch (eventType) {
              case "DrugManufactured":
                  // Update or insert drug in 'drugs' collection
                  await mongoDb.collection("drugs").updateOne(
                      { id: eventData.id },
                      { $set: {
                          id: eventData.id,
                          productId: eventData.productId,
                          batchId: eventData.batchId,
                          manufacturer: eventData.manufacturer,
                          currentOwner: eventData.initialOwner,
                          status: "MANUFACTURED",
                          lastUpdateTimestamp: eventTimestamp
                      }},
                      { upsert: true }
                  );
                  // Add to 'drugHistoryEvents' collection
                  await mongoDb.collection("drugHistoryEvents").insertOne({
                      eventType: eventType,
                      drugId: eventData.id,
                      productId: eventData.productId,
                      batchId: eventData.batchId,
                      manufacturer: eventData.manufacturer,
                      initialOwner: eventData.initialOwner,
                      transactionHash: transactionHash,
                      blockNumber: blockNumber,
                      eventTimestamp: eventTimestamp
                  });
                  break;
              case "DrugTransferred":
                  // Update drug owner and status in 'drugs' collection
                  await mongoDb.collection("drugs").updateOne(
                      { id: eventData.id },
                      { $set: {
                          currentOwner: eventData.to,
                          status: eventData.newStatus,
                          lastUpdateTimestamp: eventTimestamp
                      }}
                  );
                  // Add to 'drugHistoryEvents' collection
                  await mongoDb.collection("drugHistoryEvents").insertOne({
                      eventType: eventType,
                      drugId: eventData.id,
                      from: eventData.from,
                      to: eventData.to,
                      newStatus: eventData.newStatus,
                      transactionHash: transactionHash,
                      blockNumber: blockNumber,
                      eventTimestamp: eventTimestamp
                  });
                  break;
              case "ColdChainViolation":
                  // Add to 'drugHistoryEvents' collection
                  await mongoDb.collection("drugHistoryEvents").insertOne({
                      eventType: eventType,
                      drugId: eventData.id,
                      timestamp: eventData.timestamp,
                      temperature: eventData.temperature,
                      humidity: eventData.humidity,
                      details: eventData.details,
                      sender: event.sender, // Assuming sender is available in event or context
                      transactionHash: transactionHash,
                      blockNumber: blockNumber,
                      eventTimestamp: eventTimestamp
                  });
                  break;
              case "RoleGranted":
              case "RoleRevoked":
                  // Store role management events in a separate collection
                  await mongoDb.collection("roleManagementEvents").insertOne({
                      eventType: eventType,
                      role: eventData.role,
                      account: eventData.account,
                      sender: eventData.sender,
                      transactionHash: transactionHash,
                      blockNumber: blockNumber,
                      eventTimestamp: eventTimestamp
                  });
                  break;
              // Add other event types as needed
              default:
                  console.warn(`Unknown event type: ${eventType}`);
          }
      } catch (error) {
          console.error(`Error processing event ${eventType} for drug ${eventData.id}:`, error);
      }
  };
  ```
* **Real-time Listening & Historical Sync:** The indexer combines both historical data fetching and real-time event subscription to ensure comprehensive data synchronization.

  ```javascript
  // Example: Indexer main loop
  const startIndexing = async () => {
      // ... (initialization, connect to MongoDB, Web3, load contract) ...

      // Load last indexed block from DB
      let lastIndexedBlockDoc = await mongoDb.collection("indexerState").findOne({});
      let startBlock = lastIndexedBlockDoc ? lastIndexedBlockDoc.lastBlock + 1 : parseInt(process.env.START_BLOCK_NUMBER || '0');

      // Fetch historical events
      const latestBlock = await web3.eth.getBlockNumber();
      if (latestBlock >= startBlock) {
          console.log(`Fetching historical events from block ${startBlock} to ${latestBlock}`);
          const pastEvents = await drugTrackingContract.getPastEvents('allEvents', {
              fromBlock: startBlock,
              toBlock: latestBlock
          });
          for (let event of pastEvents) {
              await processEvent(event);
          }
          await mongoDb.collection("indexerState").updateOne({}, { $set: { lastBlock: latestBlock } }, { upsert: true });
      }

      // Subscribe to new events
      drugTrackingContract.events.allEvents()
          .on('connected', str => console.log("Websocket connected:", str))
          .on('changed', event => console.log("Event changed:", event))
          .on('error', error => console.error("Websocket error:", error))
          .on('data', async (event) => {
              await processEvent(event);
              await mongoDb.collection("indexerState").updateOne({}, { $set: { lastBlock: event.blockNumber } }, { upsert: true });
          });

      console.log("Indexer started and listening for new events...");
  };
  ```

### 5.4. Frontend (React/Material-UI)

The frontend provides the user interface, built with React and styled using Material-UI. It consumes the RESTful APIs exposed by the backend.

**Key Implementation Details:**

* **`App.js`:** The main application component, handling routing, authentication state, and rendering role-specific dashboards.

  ```javascript
  // Example: Role-based rendering in App.js
  // ... (imports and state) ...

  const renderTabContent = () => {
      if (!authToken) {
          return <Login onLoginSuccess={handleLoginSuccess} API_BASE_URL={API_BASE_URL} />;
      }

      switch (currentTab) {
          case 0: // Verify Drug
              return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
          case 1: // Manufacturer Dashboard
              return userRoles.includes("MANUFACTURER_ROLE") ? (
                  <ManufacturerDashboard API_BASE_URL={API_BASE_URL} authToken={authToken} loggedInUsername={loggedInUsername} />
              ) : (
                  <Typography variant="h6" color="error" sx={{ mt: 4 }}>Access Denied: You do not have MANUFACTURER_ROLE.</Typography>
              );
          // ... other cases for DistributorPharmacyDashboard, RegulatorDashboard, AdminDashboard ...
          default:
              return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
      }
  };

  // ... (JSX for AppBar, Tabs, and Container) ...
  ```
* **Component Structure:** The application is organized into modular components for each functionality and dashboard.

  * `Login.js`: Handles user authentication.
  * `VerifyDrug.js`: Displays drug details and history.
  * `ManufactureDrug.js`: Form for manufacturing new drugs.
  * `DrugTransfer.js`: Form for transferring drug ownership.
  * `LogViolation.js`: Form for logging cold chain violations.
  * `RoleManager.js`: Admin interface for managing roles.
  * `DrugList.js`: Displays a list of all drugs.
  * `ManufacturerDashboard.js`, `DistributorPharmacyDashboard.js`, `RegulatorDashboard.js`, `AdminDashboard.js`: Container components that integrate forms and data displays for specific roles.
* **API Interaction:** Uses `axios` to make HTTP requests to the backend API, including sending authentication tokens.

  ```javascript
  // Example: Axios POST request with authentication
  const response = await axios.post(
      `${API_BASE_URL}/api/drug/manufacture`,
      { id, productId, batchId, manufacturerAddress },
      { headers: { Authorization: `Bearer ${authToken}` } }
  );
  ```
* **Client-Side Validation:** Implements basic input validation using Material-UI's `error` and `helperText` props, providing immediate user feedback.

  ```javascript
  // Example: TextField with validation
  <TextField
      label="Drug ID (Unique)"
      variant="outlined"
      value={id}
      onChange={(e) => { setId(e.target.value); setIdError(false); }}
      error={idError}
      helperText={idError && "Drug ID is required."}
      fullWidth
  />
  ```

## 6. Setup and Deployment

This section provides instructions for setting up the project locally for development and deploying the various components to their respective cloud platforms.

### 6.1. Prerequisites

Before you begin, ensure you have the following installed on your local machine:

* **Node.js and npm:** (v18 or higher recommended)
* **Truffle Suite:** `npm install -g truffle`
* **Git:** For version control.
* **MetaMask:** Browser extension for interacting with the Ethereum network.
* **Code Editor:** Visual Studio Code or any other modern code editor.

### 6.2. Local Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/nithishkumarbnk/Counterfeit-Medicines-and-Drugs-using-Blockchain.git
   cd Counterfeit-Medicines-and-Drugs-using-Blockchain
   ```
2. **Smart Contract Setup:**

   * Navigate to the `blockchain` directory: `cd blockchain`
   * Install dependencies: `npm install`
   * Create a `.env` file in the `blockchain` directory and add the following:

     ```
     MNEMONIC="your twelve word metamask mnemonic phrase"
     WEB3_PROVIDER_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
     ```
   * Compile the contracts: `truffle compile`
   * Deploy to Sepolia testnet: `truffle migrate --network sepolia --reset`
   * Note the deployed `DrugTracking` contract address.
3. **Backend API Setup:**

   * Navigate to the `backend` directory: `cd ../backend`
   * Install dependencies: `npm install`
   * Create a `.env` file in the `backend` directory and add the following:

     ```
     PORT=10000
     WEB3_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
     MANUFACTURER_PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_DEPLOYER_ACCOUNT
     DRUG_TRACKING_CONTRACT_ADDRESS=THE_ADDRESS_FROM_TRUFFLE_MIGRATE
     MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
     SECRET_TOKEN=aVerySecretKeyForAuth
     ```
   * Start the backend server: `node src/server.js`
4. **Blockchain Indexer Setup:**

   * Navigate to the `indexer` directory: `cd ../indexer`
   * Install dependencies: `npm install`
   * Create a `.env` file in the `indexer` directory and add the following:

     ```
     WEB3_PROVIDER_URL_WSS=wss://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
     DRUG_TRACKING_CONTRACT_ADDRESS=THE_ADDRESS_FROM_TRUFFLE_MIGRATE
     MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
     START_BLOCK_NUMBER=THE_BLOCK_NUMBER_FROM_TRUFFLE_MIGRATE
     ```
   * Start the indexer: `node indexer.js`
5. **Frontend Setup:**

   * Navigate to the `frontend` directory: `cd ../frontend`
   * Install dependencies: `npm install`
   * Create a `.env` file in the `frontend` directory and add the following:

     ```
     REACT_APP_BACKEND_URL=http://localhost:10000
     ```
   * Start the React development server: `npm start`
   * The application should now be running locally at `http://localhost:3000`.

### 6.3. Deployment

#### 6.3.1. Backend API (Render)

* **Platform:** Render
* **Service Type:** Web Service
* **Build Command:** `npm install`
* **Start Command:** `node src/server.js`
* **Environment Variables:** Set the same environment variables as in the local backend setup, ensuring `PORT` is set to `10000` (as Render will map its internal port to this).
* **IP Access:** Add Render's outbound IP addresses to your MongoDB Atlas IP Access List to allow the connection.

#### 6.3.2. Frontend (Vercel)

* **Platform:** Vercel
* **Framework Preset:** Create React App
* **Build Command:** `npm run build`
* **Output Directory:** `build`
* **Environment Variables:**
  * `REACT_APP_BACKEND_URL`: Set this to the URL of your deployed Render backend service (e.g., `https://your-backend-service.onrender.com`).

#### 6.3.3. Blockchain Indexer

The indexer is a long-running service. For a production environment, it should be deployed on a platform that supports persistent services, such as a cloud VM (e.g., AWS EC2, Google Compute Engine) or a background worker service on a platform like Render.

* **Deployment:**
  1. Set up a virtual machine or background worker.
  2. Clone the repository.
  3. Navigate to the `indexer` directory.
  4. Install dependencies (`npm install`).
  5. Set up the `.env` file with production credentials.
  6. Use a process manager like `pm2` to run the indexer persistently: `pm2 start indexer.js --name drug-indexer`.

## 7. Usage

This section describes how to use the Anti-Counterfeit Drug System from the perspective of different user roles.

### 7.1. Logging In

All users must first log in to access the system. The login screen requires a username and password. Based on the credentials, the system assigns roles and displays the appropriate dashboard.

**Test Users:**

| Username         | Password           | Roles                                                                                              |
| ---------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `admin`        | `adminPassword`  | `ADMIN_ROLE`, `MANUFACTURER_ROLE`, `REGULATOR_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE` |
| `manufacturer` | `manuPassword`   | `MANUFACTURER_ROLE`                                                                              |
| `distributor`  | `distPassword`   | `DISTRIBUTOR_ROLE`                                                                               |
| `pharmacy`     | `pharmPassword`  | `PHARMACY_ROLE`                                                                                  |
| `regulator`    | `regPassword`    | `REGULATOR_ROLE`                                                                                 |
| `public`       | `publicPassword` | `PUBLIC`                                                                                         |

### 7.2. Role-Specific Dashboards

After logging in, users are presented with a tabbed interface tailored to their roles.

* **Verify Drug (All Roles):**

  * Enter a Drug ID to view its current details, including product ID, batch ID, current owner, status, and full transaction history.
* **Manufacture (Manufacturer Role):**

  * Access the "Manufacture" tab to open the Manufacturer Dashboard.
  * Fill out the "Manufacture New Drug" form with a unique Drug ID, Product ID, and Batch ID.
  * The manufacturer's Ethereum address must match the one loaded on the server.
  * Upon successful submission, a new drug is created on the blockchain.
  * The dashboard also displays a list of all drugs manufactured by the logged-in user.
* **Transfer (Distributor/Pharmacy Roles):**

  * Access the "Transfer" tab to open the Distributor/Pharmacy Dashboard.
  * Fill out the "Transfer Drug Ownership" form with the Drug ID, the new owner's Ethereum address, and the new status (e.g., "IN_TRANSIT", "RECEIVED_DISTRIBUTOR").
  * The current owner's Ethereum address must match the one loaded on the server.
  * The dashboard also displays a list of all drugs currently owned by the logged-in user.
* **Log Violation (Regulator Role):**

  * Access the "Log Violation" tab to open the Regulator Dashboard.
  * Fill out the "Log Cold Chain Violation" form with the Drug ID and details of the violation.
  * The dashboard also displays a list of all cold chain violations logged in the system.
* **Admin Roles (Admin Role):**

  * Access the "Admin Roles" tab to open the Admin Dashboard.
  * Use the "Manage Roles" form to grant or revoke roles (`MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `REGULATOR_ROLE`) for any Ethereum address.
  * Use the "Check Role" section to verify if an address has a specific role.
* **All Drugs (All Roles):**

  * Access the "All Drugs" tab to view a comprehensive list of all drugs tracked by the system, regardless of owner or status.

## 8. Conclusion

The Anti-Counterfeit Drug System successfully demonstrates the transformative potential of blockchain technology in enhancing the transparency, security, and traceability of pharmaceutical supply chains. By leveraging the immutable nature of distributed ledgers, the system provides a robust solution to combat counterfeit drugs, ensuring product authenticity and safeguarding public health.

This project showcases a comprehensive full-stack implementation, from smart contract development and blockchain indexing to a responsive web interface with role-based access control. It serves as a strong proof-of-concept for how decentralized technologies can bring much-needed trust and efficiency to critical industries.

Future enhancements could include integrating with real-world IoT devices for automated cold chain monitoring, implementing more sophisticated drug lifecycle management within the smart contract, and exploring advanced cryptographic techniques for privacy-preserving data sharing.

<style>#mermaid-1751527253770{font-family:sans-serif;font-size:16px;fill:#333;}#mermaid-1751527253770 .error-icon{fill:#552222;}#mermaid-1751527253770 .error-text{fill:#552222;stroke:#552222;}#mermaid-1751527253770 .edge-thickness-normal{stroke-width:2px;}#mermaid-1751527253770 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-1751527253770 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-1751527253770 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-1751527253770 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-1751527253770 .marker{fill:#333333;}#mermaid-1751527253770 .marker.cross{stroke:#333333;}#mermaid-1751527253770 svg{font-family:sans-serif;font-size:16px;}#mermaid-1751527253770 .label{font-family:sans-serif;color:#333;}#mermaid-1751527253770 .label text{fill:#333;}#mermaid-1751527253770 .node rect,#mermaid-1751527253770 .node circle,#mermaid-1751527253770 .node ellipse,#mermaid-1751527253770 .node polygon,#mermaid-1751527253770 .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#mermaid-1751527253770 .node .label{text-align:center;}#mermaid-1751527253770 .node.clickable{cursor:pointer;}#mermaid-1751527253770 .arrowheadPath{fill:#333333;}#mermaid-1751527253770 .edgePath .path{stroke:#333333;stroke-width:1.5px;}#mermaid-1751527253770 .flowchart-link{stroke:#333333;fill:none;}#mermaid-1751527253770 .edgeLabel{background-color:#e8e8e8;text-align:center;}#mermaid-1751527253770 .edgeLabel rect{opacity:0.5;background-color:#e8e8e8;fill:#e8e8e8;}#mermaid-1751527253770 .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#mermaid-1751527253770 .cluster text{fill:#333;}#mermaid-1751527253770 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:sans-serif;font-size:12px;background:hsl(80,100%,96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-1751527253770:root{--mermaid-font-family:sans-serif;}#mermaid-1751527253770:root{--mermaid-alt-font-family:sans-serif;}#mermaid-1751527253770 flowchart{fill:apa;}</style>
