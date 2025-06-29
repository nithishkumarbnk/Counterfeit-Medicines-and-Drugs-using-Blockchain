// backend/src/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Web3 = require("web3").default;
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // To parse JSON request bodies

// --- Web3 and Smart Contract Setup ---
const web3 = new Web3(process.env.WEB3_PROVIDER_URL || "http://127.0.0.1:8545");

let drugTrackingContract;
let contractAddress;

// --- IMPORTANT ADDITION: Add Private Key to Web3 Wallet for Signing ---
const manufacturerPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY;
if (manufacturerPrivateKey) {
  try {
    // Add the private key to the web3 wallet. This allows the server to sign transactions.
    web3.eth.accounts.wallet.add(manufacturerPrivateKey);
    console.log("Manufacturer account added to web3 wallet for signing.");
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

// Function to load contract ABI and address
const loadContract = async () => {
  try {
    // Path to the compiled contract artifact
    const contractPath = path.resolve(
      __dirname,
      "../blockchain_artifacts/contracts/DrugTracking.json"
    );
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    const contractABI = contractArtifact.abi;
    // --- IMPORTANT CHANGE: Use getChainId() for modern Web3.js ---
    const networkId = await web3.eth.getChainId(); // Get current chain ID
    const networkIdString = networkId.toString(); // Convert to string for object lookup
    console.log(`Detected Network ID: ${networkIdString}`);

    // Check if the contract is deployed on the detected network
    if (!contractArtifact.networks[networkIdString]) {
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
      // --- IMPORTANT ADDITION: Use the loaded private key for senderAddress ---
      const loadedAccountAddress = web3.eth.accounts.wallet[0]
        ? web3.eth.accounts.wallet[0].address
        : null;

      // If senderAddress is provided, it must match the loaded account.
      // If not provided, we assume the loaded account is the sender.
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
      // --- END IMPORTANT ADDITION ---

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

  // In a real application, you would also store this data in an off-chain database
  // for detailed analytics and historical records.

  res.status(200).json({ message: "Sensor data received successfully" });
});

// Start the server after loading the contract
loadContract().then(() => {
  app.listen(PORT, () => {
    console.log(`Node.js Backend listening on port ${PORT}`);
    // The web3.currentProvider.host might be undefined if using Infura/Alchemy
    console.log(`Connected to Web3 Provider: ${process.env.WEB3_PROVIDER_URL}`);
  });
});
