// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Web3 = require("web3").default; // Corrected from previous steps
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let web3;
let medicineTracker;
let contractAddress; // To store the deployed contract address
let contractABI; // To store the contract ABI

// Helper to load contract artifact
const loadContractArtifact = () => {
  try {
    // Adjust this path based on where your build/contracts directory is mounted in Docker
    // In Docker, the volume mount makes /build/contracts available at the root of the container
    return require("/build/contracts/MedicineTracker.json");
  } catch (error) {
    console.error("Failed to load contract artifact:", error);
    throw new Error(
      "Contract artifact not found. Ensure it's compiled and path is correct."
    );
  }
};

// Function to initialize Web3 and load the contract with retries
const init = async () => {
  const MAX_RETRIES = 10; // Maximum number of retries
  const RETRY_DELAY = 5000; // Delay between retries in milliseconds (5 seconds)

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(
        `Attempting to connect to Ganache and load contract (Attempt ${
          i + 1
        }/${MAX_RETRIES})...`
      );
      web3 = new Web3(process.env.GANACHE_URL || "http://127.0.0.1:7545"); // Use env var from Docker Compose

      // Check if Ganache is actually connected
      await web3.eth.net.getId(); // This will throw if not connected

      const MedicineTrackerArtifact = loadContractArtifact();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = MedicineTrackerArtifact.networks[networkId];

      if (!deployedNetwork) {
        throw new Error(
          `Contract not deployed on network ID ${networkId}. Please ensure Ganache is running and contract is migrated.`
        );
      }

      contractAddress = deployedNetwork.address;
      contractABI = MedicineTrackerArtifact.abi;
      medicineTracker = new web3.eth.Contract(contractABI, contractAddress);

      console.log("MedicineTracker contract loaded successfully.");
      console.log("Contract Address:", contractAddress);
      return; // Success, exit the retry loop
    } catch (error) {
      console.error(
        `Failed to initialize Web3 or load contract: ${error.message}`
      );
      if (i < MAX_RETRIES - 1) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw error; // Re-throw error if max retries reached
      }
    }
  }
};

// API Endpoints (These remain the same as before)

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
    const formattedMedicine = {
      id: medicine.id,
      name: medicine.name,
      manufacturer: medicine.manufacturer,
      manufactureDate: Number(medicine.manufactureDate),
      currentLocation: medicine.currentLocation,
      status: medicine.status,
      owner: medicine.owner,
      timestamp: Number(medicine.timestamp),
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
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    const receipt = await medicineTracker.methods
      .addMedicine(id, name, manufacturer, currentLocation)
      .send({ from: sender, gas: 3000000 });

    res
      .status(201)
      .json({
        message: "Medicine added successfully",
        transactionHash: receipt.transactionHash,
      });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res
      .status(500)
      .json({
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
    const sender = accounts[0];

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
init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal error during backend initialization:", err);
    process.exit(1); // Exit if initialization fails after retries
  });
