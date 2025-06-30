// backend/src/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
// --- CHANGE START ---
// Import Web3 and its providers explicitly
const { Web3 } = require("web3");
const { HttpProvider, WebsocketProvider } = require("web3-providers"); // Import providers
// --- CHANGE END ---
const path = require("path");
const { MongoClient } = require("mongodb");
const fs = require("fs");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // To parse JSON request bodies

// --- Web3 and Smart Contract Setup ---
let web3; // Declare web3 here, initialize based on protocol
if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("wss://")
) {
  // --- CHANGE START ---
  web3 = new Web3(
    new WebsocketProvider(process.env.WEB3_PROVIDER_URL) // Use imported WebsocketProvider
  );
  // --- CHANGE END ---
} else if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("http")
) {
  // --- CHANGE START ---
  web3 = new Web3(
    new HttpProvider(process.env.WEB3_PROVIDER_URL) // Use imported HttpProvider
  );
  // --- CHANGE END ---
} else {
  web3 = new Web3("http://127.0.0.1:8545"); // Fallback for local Ganache
}

let drugTrackingContract;
let contractAddress;
let mongoDb;

// --- IMPORTANT ADDITION: Add Private Key to Web3 Wallet for Signing ---
const manufacturerPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY;
let loadedAccountAddress = null; // Declare here to be accessible globally
if (manufacturerPrivateKey) {
  try {
    // Add the private key to the web3 wallet. This allows the server to sign transactions.
    web3.eth.accounts.wallet.add(manufacturerPrivateKey);
    loadedAccountAddress = web3.eth.accounts.wallet[0].address;
    console.log(
      `Manufacturer account ${loadedAccountAddress} added to web3 wallet for signing.`
    );
  } catch (e) {
    console.error(
      "Error adding manufacturer private key to web3 wallet:",
      e.message
    );
    // In a production environment, you might want to exit or log this more severely
  }
} else {
  console.warn(
    "MANUFACTURER_PRIVATE_KEY environment variable not found. Transactions requiring signing may fail."
  );
}
// --- END IMPORTANT ADDITION ---

async function connectToMongoDb() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    mongoDb = client.db("drug_tracking_db"); // Connect to the same DB as indexer
    console.log("Backend successfully connected to MongoDB Atlas.");
  } catch (error) {
    console.error("Backend failed to connect to MongoDB Atlas:", error);
    process.exit(1); // Exit if DB connection fails
  }
}

// Function to load contract ABI and address
const loadContract = async () => {
  try {
    // Path to the compiled contract artifact
    const contractPath = path.resolve(
      __dirname,
      "../blockchain/build/contracts/DrugTracking.json" // Corrected path assuming 'blockchain' is sibling to 'backend'
    );
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    const contractABI = contractArtifact.abi;
    // --- IMPORTANT CHANGE: Use getChainId() for modern Web3.js ---
    const networkId = await web3.eth.getChainId(); // Get current chain ID
    const networkIdString = networkId.toString(); // Convert to string for object lookup
    console.log(`Detected Network ID: ${networkIdString}`);

    // Check if the contract is deployed on the detected network
    if (
      !contractArtifact.networks ||
      !contractArtifact.networks[networkIdString]
    ) {
      throw new Error(
        `Contract not deployed on network with ID ${networkIdString}. Check your truffle-config.js and ensure contract is migrated.`
      );
    }
    // --- END IMPORTANT CHANGE ---

    contractAddress = contractArtifact.networks[networkIdString].address; // Use networkIdString
    drugTrackingContract = new web3.eth.Contract(contractABI, contractAddress);
    console.log(`Connected to DrugTracking contract at: ${contractAddress}`);
  } catch (error) {
    console.error("Failed to load smart contract:", error);
    console.warn(
      "Ensure Ganache is running and contract is deployed (truffle migrate)."
    );
    process.exit(1); // Exit if contract cannot be loaded
  }
};

// --- API Endpoints ---

// POST /api/drug/manufacture
app.post("/api/drug/manufacture", async (req, res) => {
  const { id, productId, batchId, manufacturerAddress } = req.body;

  if (!id || !productId || !batchId || !manufacturerAddress) {
    return res.status(400).json({
      error:
        "Missing required fields: id, productId, batchId, manufacturerAddress",
    });
  }

  try {
    // Ensure the manufacturerAddress is a valid Ethereum address
    if (!web3.utils.isAddress(manufacturerAddress)) {
      return res.status(400).json({ error: "Invalid manufacturerAddress" });
    }

    // --- IMPORTANT ADDITION: Verify manufacturerAddress is the one loaded ---
    // The address provided by the frontend must match the private key loaded on the server
    // loadedAccountAddress is already set globally
    if (
      !loadedAccountAddress ||
      loadedAccountAddress.toLowerCase() !== manufacturerAddress.toLowerCase()
    ) {
      return res.status(400).json({
        error:
          "Manufacturer address provided does not match the configured signing account on the server.",
      });
    }
    // --- END IMPORTANT ADDITION ---

    // Call the smart contract function
    // The .send() method will now use the private key added to web3.eth.accounts.wallet
    const receipt = await drugTrackingContract.methods
      .manufactureDrug(id, productId, batchId)
      .send({ from: manufacturerAddress, gas: 3000000 }); // Specify gas limit

    res.status(200).json({
      message: "Drug manufactured successfully",
      drugId: id,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Error manufacturing drug:", error);
    res
      .status(500)
      .json({ error: "Failed to manufacture drug", details: error.message });
  }
});

// POST /api/drug/transfer
app.post("/api/drug/transfer", async (req, res) => {
  const { id, newOwnerAddress, newStatus, currentOwnerAddress } = req.body;

  if (!id || !newOwnerAddress || !newStatus || !currentOwnerAddress) {
    return res.status(400).json({
      error:
        "Missing required fields: id, newOwnerAddress, newStatus, currentOwnerAddress",
    });
  }

  try {
    if (
      !web3.utils.isAddress(newOwnerAddress) ||
      !web3.utils.isAddress(currentOwnerAddress)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid Ethereum address provided" });
    }

    // --- IMPORTANT ADDITION: Verify currentOwnerAddress for transfer ---
    // loadedAccountAddress is already set globally
    if (
      !loadedAccountAddress ||
      loadedAccountAddress.toLowerCase() !== currentOwnerAddress.toLowerCase()
    ) {
      return res.status(400).json({
        error:
          "Current owner address provided does not match the configured signing account on the server.",
      });
    }
    // --- END IMPORTANT ADDITION ---

    const receipt = await drugTrackingContract.methods
      .transferDrug(id, newOwnerAddress, newStatus)
      .send({ from: currentOwnerAddress, gas: 3000000 });

    res.status(200).json({
      message: "Drug transferred successfully",
      drugId: id,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Error transferring drug:", error);
    res
      .status(500)
      .json({ error: "Failed to transfer drug", details: error.message });
  }
});

// GET /api/verifyDrug/:drugId - Modified to use MongoDB
app.get("/api/verifyDrug/:id", async (req, res) => {
  // Added /api/
  const { id } = req.params;
  try {
    const drug = await mongoDb.collection("drugs").findOne({ _id: id });

    if (!drug) {
      return res.status(404).json({ message: "Drug not found in database." });
    }

    const history = await mongoDb
      .collection("drugHistoryEvents")
      .find({ drugId: id })
      .sort({ blockNumber: 1, logIndex: 1 })
      .toArray();

    res.json({
      productId: drug.productId,
      batchId: drug.batchId,
      manufacturer: drug.manufacturerAddress,
      currentOwner: drug.currentOwnerAddress,
      status: drug.status,
      history: history.map((entry) => ({
        eventType: entry.eventType,
        fromAddress: entry.fromAddress,
        toAddress: entry.toAddress,
        details: entry.details,
        timestamp: entry.eventTimestamp,
      })),
    });
  } catch (error) {
    console.error("Error verifying drug from MongoDB:", error);
    res.status(500).json({ message: "Error verifying drug." });
  }
});

// GET /api/getAllDrugs - Modified to use MongoDB
app.get("/api/getAllDrugs", async (req, res) => {
  // Added /api/
  try {
    const drugs = await mongoDb.collection("drugs").find({}).toArray();
    res.json(drugs);
  } catch (error) {
    console.error("Error fetching all drugs from MongoDB:", error);
    res.status(500).json({ message: "Error fetching all drugs." });
  }
});

// POST /api/sensor-data (for IoT integration)
app.post("/api/sensor-data", async (req, res) => {
  const { drugId, timestamp, temperature, humidity, senderAddress } = req.body;
  console.log(
    `Received sensor data for ${drugId}: Temp=${temperature}°C, Humidity=${humidity}% at ${new Date(
      timestamp * 1000
    )}`
  );

  if (temperature < 2 || temperature > 8) {
    const violationDetails = `Temperature out of range (${temperature}°C). Expected 2-8°C.`;
    try {
      let actualSenderAddress = loadedAccountAddress; // Use the loaded account as default

      if (!actualSenderAddress) {
        return res.status(500).json({
          error: "No signing account configured on the server for sensor data.",
        });
      }

      const receipt = await drugTrackingContract.methods
        .logColdChainViolation(drugId, violationDetails)
        .send({ from: actualSenderAddress, gas: 3000000 });
      console.log(
        `Logged cold chain violation for ${drugId}. Tx: ${receipt.transactionHash}`
      );
    } catch (logError) {
      console.error(
        "Failed to log cold chain violation on blockchain:",
        logError.message
      );
      return res.status(500).json({
        error: "Failed to log cold chain violation",
        details: logError.message,
      });
    }
  }

  res.status(200).json({ message: "Sensor data received successfully" });
});

// Start the server after loading the contract
loadContract()
  .then(() => {
    app.listen(PORT, async () => {
      await connectToMongoDb(); // Connect to MongoDB before starting server

      console.log(`Node.js Backend listening on port ${PORT}`);
      console.log(
        `Connected to Web3 Provider: ${process.env.WEB3_PROVIDER_URL}`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to initialize backend:", error);
    process.exit(1);
  });
