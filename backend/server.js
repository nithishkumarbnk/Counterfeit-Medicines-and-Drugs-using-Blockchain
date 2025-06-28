// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Web3 = require("web3").default;
const path = require("path");
const admin = require("firebase-admin"); // Import Firebase Admin SDK

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json"); // Path to your downloaded key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let web3;
let medicineTracker;
let contractAddress;
let contractABI;

// --- Middleware for Firebase ID Token Authentication ---
const authenticateFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer ID_TOKEN

  if (token == null)
    return res.status(401).json({ message: "Unauthorized: No token provided" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach decoded token (contains uid, email, etc.)
    // Optionally, fetch user's custom claims/role from Firestore if needed for more granular control
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    if (userDoc.exists) {
      req.user.role = userDoc.data().role; // Attach role to req.user
    } else {
      req.user.role = "consumer"; // Default role if no Firestore doc
    }
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res
      .status(403)
      .json({ message: "Forbidden: Invalid or expired token" });
  }
};

// --- Middleware for Role-Based Access Control (using Firebase role) ---
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

// --- Web3 and Contract Initialization (Same as before, with retries) ---
const loadContractArtifact = () => {
  try {
    return require("/build/contracts/MedicineTracker.json");
  } catch (error) {
    console.error("Failed to load contract artifact:", error);
    throw new Error(
      "Contract artifact not found. Ensure it's compiled and path is correct."
    );
  }
};

const initWeb3AndContract = async () => {
  const MAX_RETRIES = 10;
  const RETRY_DELAY = 5000;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(
        `Attempting to connect to Ganache and load contract (Attempt ${
          i + 1
        }/${MAX_RETRIES})...`
      );
      web3 = new Web3(process.env.GANACHE_URL || "http://127.0.0.1:7545");

      await web3.eth.net.getId(); // Test connection

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
      return;
    } catch (error) {
      console.error(
        `Failed to initialize Web3 or load contract: ${error.message}`
      );
      if (i < MAX_RETRIES - 1) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw error;
      }
    }
  }
};

// --- Blockchain Interaction Routes (Protected by Firebase Token) ---

// Get all medicine IDs
app.get("/api/medicines", authenticateFirebaseToken, async (req, res) => {
  try {
    const ids = await medicineTracker.methods.getAllMedicineIds().call();
    res.json(ids);
  } catch (error) {
    console.error("Error fetching medicine IDs:", error);
    res.status(500).json({ error: "Failed to fetch medicine IDs." });
  }
});

// Get details of a specific medicine
app.get("/api/medicines/:id", authenticateFirebaseToken, async (req, res) => {
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
app.post(
  "/api/medicines",
  authenticateFirebaseToken,
  authorizeRole(["manufacturer", "admin"]),
  async (req, res) => {
    try {
      const { id, name, manufacturer, currentLocation } = req.body;
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0]; // Use the first Ganache account for transactions

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
  }
);

// Update medicine status
app.put(
  "/api/medicines/:id/status",
  authenticateFirebaseToken,
  authorizeRole(["manufacturer", "distributor", "pharmacy", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newStatus, newLocation } = req.body;
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0]; // Use the first Ganache account for transactions

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
  }
);

// Start the server after initializing Web3 and contract
initWeb3AndContract()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal error during backend initialization:", err);
    process.exit(1);
  });
