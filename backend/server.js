// backend/server.js

require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const Web3 = require("web3").default;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

let web3;
let medicineTracker; // Variable to hold our smart contract instance

// Function to initialize Web3 and load the contract
const init = async () => {
  try {
    // 1. Connect to Ganache (local blockchain)
    web3 = new Web3(process.env.GANACHE_URL || "http://127.0.0.1:7545");
    console.log(
      `Connected to Ganache at ${
        process.env.GANACHE_URL || "http://127.0.0.1:7545"
      }`
    );

    // 2. Load the compiled contract artifact
    // Adjust the path to point to your build/contracts directory at the project root
    const MedicineTrackerArtifact = require(path.join(
      __dirname,
      "../build/contracts/MedicineTracker.json"
    ));

    // 3. Get the network ID
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = MedicineTrackerArtifact.networks[networkId];

    if (!deployedNetwork) {
      throw new Error(
        `Contract not deployed on network ID ${networkId}. Please ensure Ganache is running and contract is migrated.`
      );
    }

    // 4. Create a contract instance
    medicineTracker = new web3.eth.Contract(
      MedicineTrackerArtifact.abi,
      deployedNetwork.address
    );
    console.log("MedicineTracker contract loaded successfully.");
    console.log("Contract Address:", deployedNetwork.address);
  } catch (error) {
    console.error("Failed to initialize Web3 or load contract:", error);
    process.exit(1); // Exit the process if initialization fails
  }
};

// API Endpoints

// Get all medicine IDs
app.get("/api/medicines", async (req, res) => {
  try {
    const ids = await medicineTracker.methods.getAllMedicineIds().call();
    res.json(ids);
  } catch (error) {
    console.error("Error fetching medicine IDs:", error);
    res.status(500).json({ error: "Failed to fetch medicine IDs." });
  }
});

// Get details of a specific medicine
app.get("/api/medicines/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await medicineTracker.methods.getMedicine(id).call();
    // Convert BigInt values to string for JSON serialization if necessary
    const formattedMedicine = {
      id: medicine.id,
      name: medicine.name,
      manufacturer: medicine.manufacturer,
      manufactureDate: Number(medicine.manufactureDate), // Convert BigInt to Number
      currentLocation: medicine.currentLocation,
      status: medicine.status,
      owner: medicine.owner,
      timestamp: Number(medicine.timestamp), // Convert BigInt to Number
    };
    res.json(formattedMedicine);
  } catch (error) {
    console.error("Error fetching medicine details:", error);
    res.status(500).json({ error: "Failed to fetch medicine details." });
  }
});

// Add a new medicine
app.post("/api/medicines", async (req, res) => {
  try {
    const { id, name, manufacturer, currentLocation } = req.body;
    const accounts = await web3.eth.getAccounts(); // Get accounts from Ganache
    const sender = accounts[0]; // Use the first account as the sender

    const receipt = await medicineTracker.methods
      .addMedicine(id, name, manufacturer, currentLocation)
      .send({ from: sender, gas: 3000000 }); // Specify gas limit

    res.status(201).json({
      message: "Medicine added successfully",
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({
      error:
        "Failed to add medicine. Check if ID already exists or Ganache is running.",
    });
  }
});

// Update medicine status
app.put("/api/medicines/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, newLocation } = req.body;
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0]; // Use the first account as the sender

    const receipt = await medicineTracker.methods
      .updateMedicineStatus(id, newStatus, newLocation)
      .send({ from: sender, gas: 3000000 });

    res.json({
      message: "Medicine status updated successfully",
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Error updating medicine status:", error);
    res.status(500).json({ error: "Failed to update medicine status." });
  }
});

// Start the server after initializing Web3 and contract
init().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
});
