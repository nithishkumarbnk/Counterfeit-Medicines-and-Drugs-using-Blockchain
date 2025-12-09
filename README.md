# Anti-Counterfeit Drug System

## Introduction

This project presents a comprehensive Anti-Counterfeit Drug System, a full-stack decentralized application meticulously engineered to combat the pervasive and life-threatening issue of counterfeit pharmaceuticals. By harnessing the transformative power of blockchain technology, this system establishes an unprecedented level of transparency, traceability, and authenticity across the entire drug supply chain, from the initial stages of manufacturing to the final act of dispensing.

Counterfeit drugs represent a grave global health crisis, contributing to treatment failures, fostering drug resistance, and, in severe instances, leading to fatalities. The inherent vulnerabilities within traditional supply chains—characterized by a lack of robust, immutable, and transparent tracking mechanisms—render it exceedingly difficult to verify the authenticity of pharmaceutical products and to pinpoint instances of diversion or adulteration. This project directly confronts these critical challenges by instituting a secure and verifiable digital ledger, thereby ensuring the unimpeachable provenance of drugs.

## Problem Statement

The global pharmaceutical supply chain is an intricate web, encompassing a multitude of stakeholders ranging from manufacturers and distributors to pharmacies and, ultimately, patients. This inherent complexity, exacerbated by insufficient transparency and fragmented data systems, creates a fertile breeding ground for the proliferation of counterfeit drugs. The ramifications of this illicit trade are severe and multifaceted:

*   **Public Health Risks**: Counterfeit drugs frequently contain incorrect dosages, harmful inert ingredients, or are entirely devoid of active pharmaceutical ingredients (APIs). Such deficiencies can precipitate ineffective treatments, trigger adverse drug reactions, and contribute to the development of drug-resistant pathogens, thereby directly imperiling patient lives.
*   **Economic Losses**: The illicit trade in counterfeit medicines inflicts billions of dollars in annual losses upon legitimate pharmaceutical companies, stifling investment in research and development and eroding consumer trust.
*   **Erosion of Trust**: The pervasive presence of fake drugs systematically undermines public confidence in healthcare systems, pharmaceutical products, and regulatory bodies.
*   **Lack of Traceability**: Conventional paper-based or disparate electronic record-keeping systems render it extraordinarily challenging to trace a drug's journey from its point of origin to the end-user. This opacity impedes rapid recall efforts and obstructs the identification of compromise points within the supply chain.
*   **Inefficient Recalls**: In the unfortunate event of a contaminated or faulty batch, inefficient traceability mechanisms inevitably delay recall procedures, thereby escalating the potential for patient harm.

The existing centralized systems are inherently susceptible to data manipulation, present single points of failure, and lack the intrinsic immutability requisite for critical supply chain data. Consequently, there exists an urgent and pressing demand for a secure, transparent, and immutable system capable of furnishing real-time, verifiable information regarding a drug's authenticity and its trajectory throughout the supply chain.



## Solution Overview

To effectively address the multifaceted challenges posed by counterfeit drugs and the inherent opacity of traditional supply chains, this project meticulously designs and implements a blockchain-based Anti-Counterfeit Drug System. Blockchain technology, with its foundational principles, offers uniquely suited properties to comprehensively resolve these critical issues:

*   **Immutability**: A cornerstone of blockchain, once a transaction—such as drug manufacturing or transfer—is indelibly recorded on the distributed ledger, it becomes unalterable and undeletable. This fundamental characteristic rigorously ensures the integrity and unimpeachable trustworthiness of the drug's entire historical record.
*   **Transparency**: The decentralized nature of the blockchain grants all authorized participants within the supply chain the ability to view the complete, verifiable history of any given drug. This unparalleled transparency significantly enhances accountability across the ecosystem and substantially mitigates the potential for fraudulent activities.
*   **Decentralization**: By distributing the ledger across a multitude of independent nodes, the system effectively eliminates single points of failure, thereby drastically reducing the risk of data manipulation or unauthorized alterations by any solitary entity.
*   **Traceability**: Each pharmaceutical product within the system is assigned a unique, cryptographically secure identifier. Its entire movement through the supply chain is meticulously documented as a sequential series of transactions, thereby creating an exhaustive and auditable trail from the original manufacturer to the ultimate patient.
*   **Security**: The system is fortified by robust cryptographic principles that secure all transactions and participant identities. This advanced security framework provides formidable protection against unauthorized access, data tampering, and other malicious interventions.

The system strategically employs a hybrid architectural approach, judiciously combining the immutability and transparency inherent to a blockchain (specifically, the Sepolia Testnet is utilized for critical transaction records) with the efficiency and scalability offered by a centralized database (MongoDB Atlas is employed for rapid data retrieval and the execution of complex queries). This synergistic combination ensures that the system is not only capable of handling substantial volumes of data but also rigorously maintains the integrity of all core supply chain events, providing a balanced and highly effective solution.



## System Architecture

The Anti-Counterfeit Drug System is meticulously engineered with a multi-layered architecture, specifically designed to ensure paramount robustness, scalability, and maintainability. This comprehensive system is composed of four principal components, each playing a critical role in the overall functionality and integrity:

1.  **Smart Contracts (Blockchain Layer)**: This constitutes the foundational layer of the system. It is responsible for defining the core business logic and the immutable data structures necessary for drug tracking and role management, all implemented on the Ethereum blockchain.
2.  **Backend API (Application Layer)**: Functioning as an intermediary, this Node.js Express server facilitates seamless communication between the frontend and the underlying blockchain/database infrastructure. Its responsibilities include handling user authentication, managing authorization, and exposing a suite of RESTful APIs for comprehensive system interaction.
3.  **Blockchain Indexer (Data Synchronization Layer)**: This is a dedicated Node.js application. Its primary function is to continuously monitor and listen for events occurring on the blockchain. Upon detecting an event, it processes the data and persistently stores the immutable transaction history within a centralized database, ensuring data consistency and rapid retrieval.
4.  **Frontend (Presentation Layer)**: Built as a React-based web application, this component provides an intuitive and user-friendly interface. It enables various stakeholders within the drug supply chain to interact effectively and efficiently with the system.

### Component Breakdown

#### Smart Contracts

*   **Technology**: Developed using Solidity, the smart contracts leverage the Truffle Framework for development and testing, and integrate OpenZeppelin Contracts for secure and audited functionalities.
*   **Purpose**: The smart contracts define the unchangeable rules and data structures governing the drug supply chain. Key functionalities encapsulated within these contracts include:
    *   **Drug Lifecycle Management**: This encompasses functions such as `manufactureDrug` (to register new drugs), `transferDrug` (to track ownership changes), and `logColdChainViolation` (to record deviations in storage conditions).
    *   **Role-Based Access Control (RBAC)**: Utilizing OpenZeppelin's `AccessControl` contract, the system implements a granular permission model. This ensures that only authorized roles (e.g., `DEFAULT_ADMIN_ROLE`, `MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `REGULATOR_ROLE`) can execute sensitive functions.
    *   **Events**: The smart contracts are designed to emit various events (e.g., `DrugManufactured`, `DrugTransferred`, `ColdChainViolation`, `RoleGranted`, `OwnershipTransferred`). These events signal critical state changes on the blockchain, which are then efficiently captured and processed by the Blockchain Indexer.

#### Backend API

*   **Technology**: The backend is built with Node.js and Express.js, utilizing `web3.js` (v1.x) for blockchain interaction, Mongoose for seamless MongoDB integration, and `jsonwebtoken` for secure authentication.
*   **Deployment**: The Backend API is designed for deployment on platforms such as Render.
*   **Purpose**: This component acts as the central hub for application logic, processing requests from the frontend and orchestrating interactions with both the blockchain and MongoDB.
    *   **Authentication & Authorization**: A foundational username/password authentication system is implemented for demonstration purposes, issuing a token upon successful login. An `authenticateToken` middleware protects sensitive routes, ensuring only authorized access based on this token.
    *   **Blockchain Interaction**: The API uses `web3.js` to securely sign and send transactions to the Sepolia testnet (e.g., manufacturing drugs, transferring ownership, managing roles) by leveraging a pre-loaded private key.
    *   **Database Interaction**: It provides a comprehensive set of RESTful endpoints to query drug data and historical information directly from MongoDB Atlas. This approach ensures fast and scalable read operations, offloading intensive queries from the blockchain.
    *   **Environment Variables**: Sensitive information such as `WEB3_PROVIDER_URL`, `MANUFACTURER_PRIVATE_KEY`, `DRUG_TRACKING_CONTRACT_ADDRESS`, `MONGO_URI`, and `SECRET_TOKEN` are securely managed through environment variables, preventing hardcoding.

#### Blockchain Indexer

*   **Technology**: This component is developed using Node.js and `web3.js` (v1.x), with Mongoose for MongoDB interaction.
*   **Deployment**: The Blockchain Indexer is designed to operate as a persistent service, suitable for deployment on local machines or cloud Virtual Machines (VMs).
*   **Purpose**: Its core function is to maintain data consistency between the immutable blockchain ledger and the query-optimized MongoDB database. This is achieved through two primary mechanisms:
    *   **Historical Sync**: The indexer is capable of fetching all past events from the blockchain, starting from a specified block number, ensuring a complete historical record.
    *   **Real-time Listening**: It actively subscribes to and processes new blockchain events as they occur, providing up-to-the-minute data synchronization.
    *   **Data Transformation & Storage**: The indexer parses raw event data (e.g., `DrugManufactured`, `DrugTransferred`, `ColdChainViolation`, `RoleGranted`), transforms it into a structured format, and stores it in relevant MongoDB collections (e.g., `drugs`, `drugHistoryEvents`, `roleManagementEvents`).
    *   **State Management**: To ensure continuous and non-redundant indexing, the indexer meticulously tracks the last processed block number.

#### Frontend

*   **Technology**: The frontend is built with React.js, styled using Material-UI (MUI) for a modern and responsive design, and uses Axios for efficient HTTP requests.
*   **Deployment**: The Frontend is suitable for deployment on platforms such as Vercel.
*   **Purpose**: It provides an intuitive and responsive user interface, enabling various stakeholders within the drug supply chain to interact seamlessly with the system.
    *   **User Authentication**: The application features a login form and manages authentication tokens, typically stored in local storage for session persistence.
    *   **Role-Based Dashboards**: The interface dynamically renders specific tabs and content, adapting to the logged-in user's assigned roles (e.g., `MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `REGULATOR_ROLE`, `ADMIN_ROLE`).
    *   **Forms**: Dedicated forms are provided for key operations, including manufacturing new drugs, transferring drug ownership, logging cold chain violations, and managing user roles.
    *   **Data Display**: The frontend efficiently fetches and displays comprehensive drug information, detailed transaction histories, and violation logs by interacting with the Backend API.
    *   **Client-Side Validation**: Basic input validation is implemented on the client-side, utilizing Material-UI's error and `helperText` props to provide immediate feedback to users on input errors before data is sent to the backend, enhancing user experience and data integrity.



## Technical Implementation

This section provides an in-depth exploration of the specific technical details and key code aspects pertinent to each component within the Anti-Counterfeit Drug System, offering insights into their design and functionality.

### Smart Contracts (Solidity)

The core operational logic of the drug tracking system is encapsulated within the `DrugTracking.sol` smart contract. This contract is instrumental in defining the data structures for drugs, orchestrating role management, and meticulously recording all critical events that transpire across the supply chain.

**Key Features and Implementation Details:**

*   **OpenZeppelin AccessControl**: The `DrugTracking` contract inherits from `AccessControl.sol`, a robust and audited contract from OpenZeppelin. This inheritance enables the implementation of granular, role-based permissions, which is paramount for ensuring that only authorized entities can perform specific actions (e.g., only an account with `MANUFACTURER_ROLE` can initiate the manufacturing of a drug).

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

*   **Drug Structure**: A `struct Drug` is defined to comprehensively store all pertinent information related to a pharmaceutical product. A `mapping` then associates each unique drug ID with its corresponding `Drug` struct.

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

*   **Core Functions**:
    *   `manufactureDrug(string _id, string _productId, string _batchId)`: This function is invoked by an account possessing the `MANUFACTURER_ROLE` to register a new drug on the blockchain. It meticulously initializes the drug's details, assigns the manufacturer and initial owner, and records the initial status. A `DrugManufactured` event is subsequently emitted.
    *   `transferDrug(string _id, address _newOwner, string _newStatus)`: This function is called by the `currentOwner` of a drug to transfer its ownership to a `_newOwner` and update its `_newStatus`. A `DrugTransferred` event is emitted upon successful transfer.
    *   `logColdChainViolation(string _id, uint256 _timestamp, int256 _temperature, int256 _humidity, string _details)`: This function allows any authorized role (e.g., `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`) to record a cold chain violation for a specific drug. A `ColdChainViolation` event is emitted to signal this occurrence.
    *   `verifyDrug(string _id)`: A `view` function that enables any party to retrieve the current details and complete history of a drug by its unique ID.

*   **Events**: Events are a crucial mechanism for off-chain data processing. They are emitted for every significant action within the smart contract, allowing the Blockchain Indexer to efficiently capture and store this data.

    ```solidity
    event DrugManufactured(string id, string productId, string batchId, address manufacturer, address initialOwner);
    event DrugTransferred(string id, address from, address to, string newStatus);
    event ColdChainViolation(string id, uint256 timestamp, int256 temperature, int256 humidity, string details);
    // OpenZeppelin AccessControl also emits RoleGranted, RoleRevoked events
    ```

*   **Truffle Configuration (`truffle-config.js`)**: This file configures the compilation and deployment settings for the smart contracts. It includes network details (e.g., Sepolia testnet), the Solidity compiler version, and utilizes `HDWalletProvider` for secure account management.

    ```javascript
    // Example snippet from truffle-config.js
    const HDWalletProvider = require(\'@truffle/hdwallet-provider\');
    require(\'dotenv\').config();

    const MNEMONIC = process.env.MNEMONIC;
    const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL;

    module.exports = {
      networks: {
        sepolia: {
          provider: () => new HDWalletProvider(MNEMONIC, WEB3_PROVIDER_URL),
          network_id: 11155111, // Sepolia\'s network ID
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

### Backend API (Node.js/Express)

The backend serves as the crucial bridge between the frontend and the blockchain/database. It is responsible for handling authentication, authorization, and exposing a suite of RESTful APIs.

**Key Implementation Details:**

*   `server.js`: This file serves as the main entry point for the Express application.

*   **Environment Variables**: The application leverages `dotenv` to load configuration from a `.env` file, ensuring that sensitive data is never hardcoded directly into the codebase.

    ```
    // .env example
    PORT=10000
    WEB3_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
    MANUFACTURER_PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_DEPLOYER_ACCOUNT
    DRUG_TRACKING_CONTRACT_ADDRESS=0xYourDeployedContractAddress
    MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority
    SECRET_TOKEN=aVerySecretKeyForAuth
    ```

*   **Web3 Initialization**: The backend establishes a connection to the Ethereum network using `web3.js` and securely loads the private key for signing blockchain transactions.

    ```javascript
    const Web3 = require(\'web3\');
    const contractABI = require(\'./blockchain_artifacts/contracts/DrugTracking.json\').abi;
    const contractAddress = process.env.DRUG_TRACKING_CONTRACT_ADDRESS;

    let web3;
    let drugTrackingContract;

    const loadContract = async () => {
        try {
            const providerUrl = process.env.WEB3_PROVIDER_URL;
            if (providerUrl.startsWith(\'ws\')) {
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

*   **MongoDB Connection**: `Mongoose` is employed to establish and manage the connection to MongoDB Atlas, facilitating seamless database interactions.

    ```javascript
    const mongoose = require(\'mongoose\');

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

*   **Authentication Middleware**: A simplified JWT-like authentication middleware is implemented to protect API routes, ensuring that only authenticated requests can access sensitive resources.

    ```javascript
    const jwt = require(\'jsonwebtoken\');
    const SECRET_TOKEN = process.env.SECRET_TOKEN;

    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers[\'authorization\'];
        const token = authHeader && authHeader.split(\' \')[1];

        if (token == null) return res.status(401).json({ error: "Authentication token required." });

        jwt.verify(token, SECRET_TOKEN, (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid or expired token." });
            req.user = user; // Contains username and roles
            next();
        });
    };
    ```

*   **API Endpoints**: The backend implements various RESTful endpoints to facilitate interaction with the frontend. Each blockchain write operation includes gas estimation and the secure sending of transactions from the loaded private key.

    ```javascript
    // Example: Manufacture Drug Endpoint
    app.post("/api/drug/manufacture", authenticateToken, async (req, res) => {
        try {
            const { id, productId, batchId, manufacturerAddress } = req.body;
            const loadedAddress = web3.eth.accounts.wallet[0]?.address;

            if (!loadedAddress || loadedAddress.toLowerCase() !== manufacturerAddress.toLowerCase()) {
                return res.status(400).json({ error: "Signing address mismatch. Ensure the provided manufacturer address matches the server\'s loaded private key address." });
            }

            // Check if the loaded address has MANUFACTURER_ROLE
            const hasRole = await drugTrackingContract.methods.hasRole(drugTrackingContract.methods.MANUFACTURER_ROLE().encodeABI(), loadedAddress).call();
            if (!hasRole) {
                return res.status(403).json({ error: "Unauthorized: Server\'s address does not have MANUFACTURER_ROLE." });
            }

            const gasEstimate = await drugTrackingContract.methods.manufactureDrug(id, productId, batchId)
                .estimateGas({ from: loadedAddress });

            const receipt = await drugTrackingContract.methods.manufactureDrug(id, productId, batchId)
                .send({
                    from: loadedAddress,
                    gas: gasEstimate + 100000, // Add buffer
                    gasPrice: web3.utils.toWei(\'1.5\', \'gwei\') // Example gas price
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

### Blockchain Indexer (Node.js)

The indexer is a standalone Node.js application specifically designed for the continuous synchronization of blockchain events to MongoDB. This ensures that both the backend and frontend have rapid access to historical and real-time data without the need to directly query the blockchain for every read operation.

**Key Implementation Details:**

*   `indexer.js`: This is the main script responsible for the indexer's operations.

*   **Event Handling**: The indexer is configured to listen for specific events emitted by the `DrugTracking` smart contract. Upon detection, it processes these events and updates the MongoDB database accordingly.

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
                    // Update or insert drug in \'drugs\' collection
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
                    // Add to \'drugHistoryEvents\' collection
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
                    // Update drug owner and status in \'drugs\' collection
                    await mongoDb.collection("drugs").updateOne(
                        { id: eventData.id },
                        { $set: {
                            currentOwner: eventData.to,
                            status: eventData.newStatus,
                            lastUpdateTimestamp: eventTimestamp
                        }}
                    );
                    // Add to \'drugHistoryEvents\' collection
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
                    // Add to \'drugHistoryEvents\' collection
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

*   **Real-time Listening & Historical Sync**: The indexer seamlessly combines both historical data fetching and real-time event subscription to ensure comprehensive and continuous data synchronization.

    ```javascript
    // Example: Indexer main loop
    const startIndexing = async () => {
        // ... (initialization, connect to MongoDB, Web3, load contract) ...

        // Load last indexed block from DB
        let lastIndexedBlockDoc = await mongoDb.collection("indexerState").findOne({});
        let startBlock = lastIndexedBlockDoc ? lastIndexedBlockDoc.lastBlock + 1 : parseInt(process.env.START_BLOCK_NUMBER || \'0\');

        // Fetch historical events
        const latestBlock = await web3.eth.getBlockNumber();
        if (latestBlock >= startBlock) {
            console.log(`Fetching historical events from block ${startBlock} to ${latestBlock}`);
            const pastEvents = await drugTrackingContract.getPastEvents(\'allEvents\', {
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
            .on(\'connected\', str => console.log("Websocket connected:", str))
            .on(\'changed\', event => console.log("Event changed:", event))
            .on(\'error\', error => console.error("Websocket error:", error))
            .on(\'data\', async (event) => {
                await processEvent(event);
                await mongoDb.collection("indexerState").updateOne({}, { $set: { lastBlock: event.blockNumber } }, { upsert: true });
            });

        console.log("Indexer started and listening for new events...");
    };
    ```

### Frontend (React/Material-UI)

The frontend component provides the user interface, meticulously built with React and elegantly styled using Material-UI. It efficiently consumes the RESTful APIs exposed by the backend to deliver a dynamic and responsive user experience.

**Key Implementation Details:**

*   `App.js`: This file serves as the main application component, managing routing, authentication state, and dynamically rendering role-specific dashboards.

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

*   **Component Structure**: The application is organized into a modular component structure, with dedicated components for each specific functionality and dashboard, promoting maintainability and reusability.
    *   `Login.js`: Handles user authentication processes.
    *   `VerifyDrug.js`: Displays detailed drug information and historical data.
    *   `ManufactureDrug.js`: Provides a form for manufacturing new drugs.
    *   `DrugTransfer.js`: Offers a form for transferring drug ownership.
    *   `LogViolation.js`: Presents a form for logging cold chain violations.
    *   `RoleManager.js`: An administrative interface for managing user roles.
    *   `DrugList.js`: Displays a comprehensive list of all drugs within the system.
    *   `ManufacturerDashboard.js`, `DistributorPharmacyDashboard.js`, `RegulatorDashboard.js`, `AdminDashboard.js`: These are container components that integrate various forms and data displays tailored to specific user roles.

*   **API Interaction**: The frontend utilizes `axios` to make efficient HTTP requests to the backend API, ensuring that authentication tokens are securely sent with each request.

    ```javascript
    // Example: Axios POST request with authentication
    const response = await axios.post(
        `${API_BASE_URL}/api/drug/manufacture`,
        { id, productId, batchId, manufacturerAddress },
        { headers: { Authorization: `Bearer ${authToken}` } }
    );
    ```

*   **Client-Side Validation**: Basic input validation is implemented on the client-side using Material-UI's `error` and `helperText` props. This provides immediate feedback to users regarding input errors before data is transmitted to the backend, significantly enhancing user experience and data integrity.

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



## Setup and Deployment

This section provides comprehensive instructions for setting up the Anti-Counterfeit Drug System locally for development purposes and for deploying its various components to their respective cloud platforms.

### Prerequisites

Before commencing with the setup, ensure that the following software and tools are installed on your local machine:

*   **Node.js and npm**: Version 18 or higher is strongly recommended.
*   **Truffle Suite**: Install globally via npm: `npm install -g truffle`.
*   **Git**: Essential for version control and cloning the repository.
*   **MetaMask**: A browser extension required for interacting with the Ethereum network.
*   **Code Editor**: A modern code editor such as Visual Studio Code is recommended.

### Local Setup

Follow these steps to set up the project components on your local development environment:

1.  **Clone the Repository**:

    ```bash
    git clone https://github.com/nithishkumarbnk/Counterfeit-Medicines-and-Drugs-using-Blockchain.git
    cd Counterfeit-Medicines-and-Drugs-using-Blockchain
    ```

2.  **Smart Contract Setup**:

    *   Navigate to the blockchain directory:
        ```bash
        cd blockchain
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file within the `blockchain` directory and populate it with the following environment variables:
        ```
        MNEMONIC="your twelve word metamask mnemonic phrase"
        WEB3_PROVIDER_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
        ```
    *   Compile the smart contracts:
        ```bash
        truffle compile
        ```
    *   Deploy the contracts to the Sepolia testnet. Ensure you note the deployed `DrugTracking` contract address, as it will be required for the backend and indexer configurations:
        ```bash
        truffle migrate --network sepolia --reset
        ```

3.  **Backend API Setup**:

    *   Navigate to the backend directory:
        ```bash
        cd ../backend
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file within the `backend` directory and add the following environment variables. Replace placeholders with your actual values:
        ```
        PORT=10000
        WEB3_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
        MANUFACTURER_PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_DEPLOYER_ACCOUNT
        DRUG_TRACKING_CONTRACT_ADDRESS=THE_ADDRESS_FROM_TRUFFLE_MIGRATE
        MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
        SECRET_TOKEN=aVerySecretKeyForAuth
        ```
    *   Start the backend server:
        ```bash
        node src/server.js
        ```

4.  **Blockchain Indexer Setup**:

    *   Navigate to the indexer directory:
        ```bash
        cd ../indexer
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file within the `indexer` directory and add the following environment variables:
        ```
        WEB3_PROVIDER_URL_WSS=wss://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
        DRUG_TRACKING_CONTRACT_ADDRESS=THE_ADDRESS_FROM_TRUFFLE_MIGRATE
        MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
        START_BLOCK_NUMBER=THE_BLOCK_NUMBER_FROM_TRUFFLE_MIGRATE
        ```
    *   Start the indexer:
        ```bash
        node indexer.js
        ```

5.  **Frontend Setup**:

    *   Navigate to the frontend directory:
        ```bash
        cd ../frontend
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file within the `frontend` directory and add the following environment variable:
        ```
        REACT_APP_BACKEND_URL=http://localhost:10000
        ```
    *   Start the React development server:
        ```bash
        npm start
        ```

    The application should now be running locally and accessible at `http://localhost:3000`.

### Deployment

For production environments, the various components can be deployed to cloud platforms as follows:

#### Backend API (Render)

*   **Platform**: Render
*   **Service Type**: Web Service
*   **Build Command**: `npm install`
*   **Start Command**: `node src/server.js`
*   **Environment Variables**: Configure the same environment variables as used in the local backend setup. Ensure that `PORT` is set to `10000`, as Render will map its internal port to this value.
*   **IP Access**: Add Render's outbound IP addresses to your MongoDB Atlas IP Access List to enable successful database connection.

#### Frontend (Vercel)

*   **Platform**: Vercel
*   **Framework Preset**: Select 

Create React App`.
*   **Build Command**: `npm run build`
*   **Output Directory**: `build`
*   **Environment Variables**:
    *   `REACT_APP_BACKEND_URL`: Set this to the URL of your deployed Render backend service (e.g., `https://your-backend-service.onrender.com`).

#### Blockchain Indexer

The indexer is designed as a long-running service. For a production environment, it is recommended to deploy it on a platform that supports persistent services, such as a cloud Virtual Machine (e.g., AWS EC2, Google Compute Engine) or a background worker service on a platform like Render.

**Deployment Steps**:

1.  Set up a virtual machine or a background worker service.
2.  Clone the repository onto the chosen platform.
3.  Navigate to the `indexer` directory.
4.  Install dependencies using `npm install`.
5.  Configure the `.env` file with production-specific credentials.
6.  Utilize a process manager, such as `pm2`, to run the indexer persistently:
    ```bash
    pm2 start indexer.js --name drug-indexer
    ```

## Usage

This section outlines how to interact with the Anti-Counterfeit Drug System from the perspective of different user roles, detailing the functionalities available to each.

### Logging In

All users are required to log in to gain access to the system. The login interface prompts for a username and password. Upon successful authentication, the system assigns appropriate roles to the user and dynamically displays the corresponding role-specific dashboard.

**Test Users (for demonstration purposes)**:

| Username     | Password        | Roles                                                                                             |
| :----------- | :-------------- | :------------------------------------------------------------------------------------------------ |
| `admin`      | `adminPassword` | `ADMIN_ROLE`, `MANUFACTURER_ROLE`, `REGULATOR_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`        |
| `manufacturer` | `manuPassword`  | `MANUFACTURER_ROLE`                                                                               |
| `distributor`  | `distPassword`  | `DISTRIBUTOR_ROLE`                                                                                |
| `pharmacy`     | `pharmPassword` | `PHARMACY_ROLE`                                                                                   |
| `regulator`    | `regPassword`   | `REGULATOR_ROLE`                                                                                  |
| `public`       | `publicPassword`| `PUBLIC`                                                                                          |

### Role-Specific Dashboards

After logging in, users are presented with a tabbed interface that is meticulously tailored to their assigned roles, providing access to relevant functionalities.

*   **Verify Drug (Available to All Roles)**:
    *   Users can enter a unique Drug ID to retrieve and view its current details, including the product ID, batch ID, current owner, status, and a comprehensive transaction history.

*   **Manufacture (Manufacturer Role)**:
    *   Users with the `MANUFACTURER_ROLE` can access the "Manufacture" tab, which leads to the Manufacturer Dashboard.
    *   A dedicated form allows manufacturers to register new drugs by providing a unique Drug ID, Product ID, and Batch ID.
    *   Crucially, the manufacturer's Ethereum address used for the transaction must precisely match the one loaded on the server.
    *   Upon successful submission, a new drug record is immutably created on the blockchain.
    *   The dashboard also provides a clear list of all drugs previously manufactured by the logged-in user.

*   **Transfer (Distributor/Pharmacy Roles)**:
    *   Users with `DISTRIBUTOR_ROLE` or `PHARMACY_ROLE` can access the "Transfer" tab, which opens the Distributor/Pharmacy Dashboard.
    *   A form is available for transferring drug ownership, requiring the Drug ID, the new owner's Ethereum address, and the updated status (e.g., "IN_TRANSIT", "RECEIVED_DISTRIBUTOR").
    *   The current owner's Ethereum address must match the one loaded on the server for the transaction to be valid.
    *   The dashboard conveniently displays a list of all drugs currently owned by the logged-in user.

*   **Log Violation (Regulator Role)**:
    *   Users with the `REGULATOR_ROLE` can access the "Log Violation" tab, leading to the Regulator Dashboard.
    *   A form allows regulators to record cold chain violations for specific drugs, including details of the incident.
    *   The dashboard also provides a comprehensive list of all cold chain violations that have been logged within the system.

*   **Admin Roles (Admin Role)**:
    *   Users with the `ADMIN_ROLE` can access the "Admin Roles" tab, which opens the Admin Dashboard.
    *   The "Manage Roles" form enables administrators to grant or revoke roles (`MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `REGULATOR_ROLE`) for any specified Ethereum address.
    *   A "Check Role" section is available to verify if a particular address currently holds a specific role.

*   **All Drugs (Available to All Roles)**:
    *   This tab provides a comprehensive and unfiltered list of all drugs currently tracked by the system, irrespective of their current owner or status.

## Conclusion

The Anti-Counterfeit Drug System stands as a compelling testament to the transformative potential of blockchain technology in significantly enhancing the transparency, security, and traceability of pharmaceutical supply chains. By leveraging the immutable and decentralized nature of distributed ledgers, this system delivers a robust and innovative solution to effectively combat the proliferation of counterfeit drugs, thereby rigorously ensuring product authenticity and, most critically, safeguarding public health.

This project showcases a comprehensive full-stack implementation, spanning from the intricate development of smart contracts and efficient blockchain indexing to the creation of a responsive web interface fortified with granular role-based access control. It serves as a powerful proof-of-concept, vividly demonstrating how decentralized technologies can inject much-needed trust, efficiency, and accountability into critical industries.

**Future Enhancements**:

Potential future enhancements and areas for further development could include:

*   **Integration with Real-world IoT Devices**: Implementing seamless integration with IoT sensors for automated, real-time cold chain monitoring, providing continuous data on environmental conditions.
*   **Sophisticated Drug Lifecycle Management**: Expanding the smart contract capabilities to include more advanced and nuanced drug lifecycle management features, such as expiration dates, batch recalls, and product serialization beyond basic tracking.
*   **Advanced Cryptographic Techniques**: Exploring and implementing advanced cryptographic techniques, such as zero-knowledge proofs, to enable privacy-preserving data sharing while maintaining the integrity and verifiability of transactions.



