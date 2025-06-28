// backend/src/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Web3 = require("web3").default; // Add .default here
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // To parse JSON request bodies

// --- Web3 and Smart Contract Setup ---
const web3 = new Web3(process.env.WEB3_PROVIDER_URL || "http://127.0.0.1:8545"); // Connect to Ganache or other provider

let drugTrackingContract;
let contractAddress;

// Function to load contract ABI and address
const loadContract = async () => {
  try {
    // Path to the compiled contract artifact
    const contractPath = path.resolve(
      __dirname,
      "../blockchain_artifacts/contracts/DrugTracking.json"
    ); // <--- THIS LINE IS CHANGED

    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    const contractABI = contractArtifact.abi;
    // In a real scenario, you'd get this from a config or a deployed address registry
    // For local development, we'll use the address from the deployed artifact
    const networkId = await web3.eth.net.getId(); // Get current network ID
    contractAddress = contractArtifact.networks[networkId].address;

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

    // Call the smart contract function
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

// GET /api/drug/verify/:drugId
app.get("/api/drug/verify/:drugId", async (req, res) => {
  const drugId = req.params.drugId;

  try {
    const result = await drugTrackingContract.methods.verifyDrug(drugId).call();

    // The result from .call() is an array-like object with named properties
    const verificationData = {
      productId: result.productId,
      batchId: result.batchId,
      manufacturer: result.manufacturer,
      currentOwner: result.currentOwner,
      status: result.status,
      history: result.history,
    };

    res.status(200).json(verificationData);
  } catch (error) {
    console.error("Error verifying drug:", error);
    res
      .status(500)
      .json({ error: "Failed to verify drug", details: error.message });
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

  // Example: Check for cold chain violation and log to blockchain
  if (temperature < 2 || temperature > 8) {
    // Example threshold for cold chain
    const violationDetails = `Temperature out of range (${temperature}°C). Expected 2-8°C.`;
    try {
      // This transaction needs to be sent from an account that has permission
      // to call logColdChainViolation. For simplicity, using a default Ganache account.
      // In a real system, this would be a dedicated IoT gateway account.
      const accounts = await web3.eth.getAccounts();
      const defaultSender = senderAddress || accounts[0]; // Use provided sender or first Ganache account

      const receipt = await drugTrackingContract.methods
        .logColdChainViolation(drugId, violationDetails)
        .send({ from: defaultSender, gas: 3000000 });
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

  // In a real application, you would also store this data in an off-chain database
  // for detailed analytics and historical records.

  res.status(200).json({ message: "Sensor data received successfully" });
});

// Start the server after loading the contract
loadContract().then(() => {
  app.listen(PORT, () => {
    console.log(`Node.js Backend listening on port ${PORT}`);
    console.log(`Connect to Ganache at ${web3.currentProvider.host}`);
  });
});
