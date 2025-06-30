// backend/src/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Web3 } = require("web3");
const { HttpProvider, WebsocketProvider } = require("web3-providers");
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Variable Declarations (Corrected Order and Scope) ---
const { MongoClient } = require("mongodb");
const MONGODB_URI = process.env.MONGODB_URI;
let mongoDb; // MongoDB client instance

let web3; // Web3 instance
let drugTrackingContract; // Smart contract instance
let contractAddress; // Smart contract address

// --- Middleware (Declared Once, at the Top) ---
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // To parse JSON request bodies

// --- Web3 and Smart Contract Setup ---
if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("wss://")
) {
  web3 = new Web3(new WebsocketProvider(process.env.WEB3_PROVIDER_URL));
} else if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("http")
) {
  web3 = new Web3(new HttpProvider(process.env.WEB3_PROVIDER_URL));
} else {
  web3 = new Web3("http://127.0.0.1:8545"); // Fallback for local Ganache
}

// --- IMPORTANT ADDITION: Add Private Key to Web3 Wallet for Signing ---
const manufacturerPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY;
if (manufacturerPrivateKey) {
  try {
    web3.eth.accounts.wallet.add(manufacturerPrivateKey);
    console.log("Manufacturer account added to web3 wallet for signing.");
  } catch (e) {
    console.error(
      "Error adding manufacturer private key to web3 wallet:",
      e.message
    );
  }
} else {
  console.warn(
    "MANUFACTURER_PRIVATE_KEY environment variable not found. Transactions requiring signing may fail."
  );
}
// --- END IMPORTANT ADDITION ---

// --- MongoDB Connection Function ---
async function connectToMongoDb() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    mongoDb = client.db("drug_tracking_db");
    console.log("Backend successfully connected to MongoDB Atlas.");
  } catch (error) {
    console.error("Backend failed to connect to MongoDB Atlas:", error);
    process.exit(1); // Exit if DB connection fails
  }
}
// --- END MongoDB Connection Function ---

// Function to load contract ABI and address
const loadContract = async () => {
  try {
    const contractPath = path.resolve(
      __dirname,
      "../blockchain_artifacts/contracts/DrugTracking.json"
    );
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    const contractABI = contractArtifact.abi;
    const networkId = await web3.eth.getChainId();
    const networkIdString = networkId.toString();
    console.log(`Detected Network ID: ${networkIdString}`);

    if (!contractArtifact.networks[networkIdString]) {
      throw new Error(
        `Contract not deployed on network with ID ${networkIdString}. Check your truffle-config.js and ensure contract is migrated.`
      );
    }

    contractAddress = contractArtifact.networks[networkIdString].address;
    drugTrackingContract = new web3.eth.Contract(contractABI, contractAddress);
    console.log(`Connected to DrugTracking contract at: ${contractAddress}`);
  } catch (error) {
    console.error("Failed to load smart contract:", error);
    console.warn(
      "Ensure Ganache is running and contract is deployed (truffle migrate)."
    );
    process.exit(1);
  }
};

// --- API Endpoints ---

// GET /api/hasRole/:roleName/:address (Reads from Blockchain)
app.get("/api/hasRole/:roleName/:address", async (req, res) => {
  const { roleName, address } = req.params;

  if (!web3.utils.isAddress(address)) {
    return res
      .status(400)
      .json({ error: "Invalid Ethereum address provided." });
  }

  let roleBytes32;
  switch (roleName.toUpperCase()) {
    case "DEFAULT_ADMIN_ROLE":
      roleBytes32 = web3.utils.keccak256("DEFAULT_ADMIN_ROLE");
      break;
    case "MANUFACTURER_ROLE":
      roleBytes32 = web3.utils.keccak256("MANUFACTURER_ROLE");
      break;
    case "DISTRIBUTOR_ROLE":
      roleBytes32 = web3.utils.keccak256("DISTRIBUTOR_ROLE");
      break;
    case "PHARMACY_ROLE":
      roleBytes32 = web3.utils.keccak256("PHARMACY_ROLE");
      break;
    case "REGULATOR_ROLE":
      roleBytes32 = web3.utils.keccak256("REGULATOR_ROLE");
      break;
    default:
      return res.status(400).json({ error: "Invalid role name provided." });
  }

  try {
    const hasRoleResult = await drugTrackingContract.methods
      .hasRole(roleBytes32, address)
      .call();
    res.status(200).json({
      address: address,
      role: roleName,
      hasRole: hasRoleResult,
    });
  } catch (error) {
    console.error(`Error checking role ${roleName} for ${address}:`, error);
    res
      .status(500)
      .json({ error: "Failed to check role.", details: error.message });
  }
});

// POST /api/drug/manufacture (Writes to Blockchain)
app.post("/api/drug/manufacture", async (req, res) => {
  const { id, productId, batchId, manufacturerAddress } = req.body;

  if (!id || !productId || !batchId || !manufacturerAddress) {
    return res.status(400).json({
      error:
        "Missing required fields: id, productId, batchId, manufacturerAddress",
    });
  }

  try {
    if (!web3.utils.isAddress(manufacturerAddress)) {
      return res.status(400).json({ error: "Invalid manufacturerAddress" });
    }

    const loadedAccountAddress = web3.eth.accounts.wallet[0]
      ? web3.eth.accounts.wallet[0].address
      : null;

    if (
      !loadedAccountAddress ||
      loadedAccountAddress.toLowerCase() !== manufacturerAddress.toLowerCase()
    ) {
      return res.status(400).json({
        error:
          "Manufacturer address provided does not match the configured signing account on the server.",
      });
    }

    const receipt = await drugTrackingContract.methods
      .manufactureDrug(id, productId, batchId)
      .send({ from: manufacturerAddress, gas: 3000000 });

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

// POST /api/drug/transfer (Writes to Blockchain)
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

    const loadedAccountAddress = web3.eth.accounts.wallet[0]
      ? web3.eth.accounts.wallet[0].address
      : null;

    if (
      !loadedAccountAddress ||
      loadedAccountAddress.toLowerCase() !== currentOwnerAddress.toLowerCase()
    ) {
      return res.status(400).json({
        error:
          "Current owner address provided does not match the configured signing account on the server.",
      });
    }

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

// GET /api/drug/verify/:drugId (Reads from MongoDB)
app.get("/api/drug/verify/:drugId", async (req, res) => {
  const drugId = req.params.drugId;

  try {
    const drug = await mongoDb.collection("drugs").findOne({ _id: drugId });

    if (!drug) {
      return res.status(404).json({ message: "Drug not found in database." });
    }

    const history = await mongoDb
      .collection("drugHistoryEvents")
      .find({ drugId: drugId })
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
    res
      .status(500)
      .json({ error: "Failed to verify drug.", details: error.message });
  }
});

// GET /api/getAllDrugs (Reads from MongoDB)
app.get("/api/getAllDrugs", async (req, res) => {
  try {
    const drugs = await mongoDb.collection("drugs").find({}).toArray();
    res.json(drugs);
  } catch (error) {
    console.error("Error fetching all drugs from MongoDB:", error);
    res.status(500).json({ message: "Error fetching all drugs." });
  }
});

// POST /api/sensor-data (Writes to Blockchain)
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
      const loadedAccountAddress = web3.eth.accounts.wallet[0]
        ? web3.eth.accounts.wallet[0].address
        : null;

      let actualSenderAddress;
      if (senderAddress) {
        if (
          loadedAccountAddress &&
          loadedAccountAddress.toLowerCase() === senderAddress.toLowerCase()
        ) {
          actualSenderAddress = senderAddress;
        } else {
          return res.status(400).json({
            error:
              "Sender address provided does not match the configured signing account on the server for sensor data.",
          });
        }
      } else {
        if (loadedAccountAddress) {
          actualSenderAddress = loadedAccountAddress;
        } else {
          return res.status(500).json({
            error:
              "No sender address provided and no signing account configured on the server for sensor data.",
          });
        }
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
    }
  }

  res.status(200).json({ message: "Sensor data received successfully" });
});

// Start the server after loading the contract
loadContract()
  .then(() => {
    app.listen(PORT, async () => {
      await connectToMongoDb(); // Connect to MongoDB on server start

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
