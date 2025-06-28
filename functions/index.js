// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(); // Initializes Firebase Admin SDK
const db = admin.firestore(); // Get Firestore instance for admin operations

// ... other imports like web3.js, path, etc.
const Web3 = require("web3").default; // Assuming you've fixed this
const path = require("path");

// Initialize Web3 and contract within the function scope or as a global variable
// for reuse across invocations if possible (though often re-initialized per invocation for safety)
let web3;
let medicineTracker;
let contractAddress;
let contractABI;

// Helper to load contract artifact (adjust path as needed for Cloud Functions environment)
// In Cloud Functions, the functions directory is the root for 'require'
const loadContractArtifact = () => {
  try {
    // Adjust this path based on where your build/contracts directory is relative to functions/
    // If build/ is at the project root, and functions/ is a sibling, then:
    const artifactPath = path.resolve(
      __dirname,
      "../build/contracts/MedicineTracker.json"
    );
    return require(artifactPath);
  } catch (error) {
    console.error("Failed to load contract artifact:", error);
    throw new Error(
      "Contract artifact not found. Ensure it's compiled and path is correct."
    );
  }
};

const initWeb3AndContract = async () => {
  if (!web3 || !medicineTracker) {
    // Only initialize if not already
    web3 = new Web3(functions.config().ganache.url || "http://127.0.0.1:8545"); // Use config or default
    const MedicineTrackerArtifact = loadContractArtifact();

    const networkId = await web3.eth.net.getId();
    const deployedNetwork = MedicineTrackerArtifact.networks[networkId];

    if (!deployedNetwork) {
      throw new Error(
        `Contract not deployed on network ID ${networkId}. Ensure Ganache is running and contract is migrated.`
      );
    }

    contractAddress = deployedNetwork.address;
    contractABI = MedicineTrackerArtifact.abi;
    medicineTracker = new web3.eth.Contract(contractABI, contractAddress);
    console.log(
      "MedicineTracker contract loaded successfully in Cloud Function."
    );
    console.log("Contract Address:", contractAddress);
  }
};

// Ensure your Cloud Functions environment variables are set for GANACHE_URL
// firebase functions:config:set ganache.url="http://127.0.0.1:8545" (for local testing )
// For deployed Ganache, use its public URL.
// functions/index.js (continued)

// Ensure you have your GANACHE_URL set in Firebase Functions config
// firebase functions:config:set ganache.url="http://127.0.0.1:8545"
// For production, this would be a public RPC endpoint or a service like Infura/Alchemy

exports.addMedicine = functions.https.onCall(async (data, context) => {
  // 1. Authenticate User
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const uid = context.auth.uid;

  // 2. Authorize User (Fetch role from Firestore)
  const userDocRef = db.collection("users").doc(uid);
  const userDocSnap = await userDocRef.get();

  if (!userDocSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userRole = userDocSnap.data().role;

  // Only 'manufacturer' or 'admin' can add medicine
  if (userRole !== "manufacturer" && userRole !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only manufacturers or admins can add medicine."
    );
  }

  // 3. Initialize Web3 and Contract
  await initWeb3AndContract();

  // 4. Extract data from request
  const { id, name, manufacturer, currentLocation } = data;

  // 5. Get a blockchain account to send the transaction from
  // In a real dApp, you might have a dedicated "service account" for the backend
  // or use a wallet like MetaMask connected to the frontend (but that's different from this setup)
  // For this example, we'll use the first account from Ganache.
  // In production, this would be a securely managed private key.
  const accounts = await web3.eth.getAccounts();
  const senderAccount = accounts[0]; // Use the first account from Ganache

  try {
    const receipt = await medicineTracker.methods
      .addMedicine(id, name, manufacturer, currentLocation)
      .send({ from: senderAccount, gas: 3000000 });

    return {
      message: "Medicine added successfully",
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error adding medicine to blockchain:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to add medicine to blockchain.",
      error.message
    );
  }
});

// Example for updateMedicineStatus (similar structure)
exports.updateMedicineStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const uid = context.auth.uid;

  const userDocRef = db.collection("users").doc(uid);
  const userDocSnap = await userDocRef.get();

  if (!userDocSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userRole = userDocSnap.data().role;

  // Define roles that can update status
  const allowedRoles = ["manufacturer", "distributor", "pharmacy", "admin"];
  if (!allowedRoles.includes(userRole)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to update medicine status."
    );
  }

  await initWeb3AndContract();

  const { id, newStatus, newLocation } = data;
  const accounts = await web3.eth.getAccounts();
  const senderAccount = accounts[0]; // Or a specific account for this role

  try {
    const receipt = await medicineTracker.methods
      .updateMedicineStatus(id, newStatus, newLocation)
      .send({ from: senderAccount, gas: 3000000 });

    return {
      message: "Medicine status updated successfully",
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error updating medicine status on blockchain:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update medicine status on blockchain.",
      error.message
    );
  }
});

// For read-only functions like getMedicine or getAllMedicineIds, you might not need authentication
// or you might want to restrict them to logged-in users.
exports.getMedicine = functions.https.onCall(async (data, context) => {
  // Optional: if you want to restrict even reads to authenticated users
  // if (!context.auth) {
  //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required for this read operation.' );
  // }

  await initWeb3AndContract();
  const { id } = data;

  try {
    const medicine = await medicineTracker.methods.getMedicine(id).call();
    // Convert BigInt values to Number for JSON serialization if necessary
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
    return formattedMedicine;
  } catch (error) {
    console.error("Error fetching medicine details from blockchain:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch medicine details.",
      error.message
    );
  }
});

exports.getAllMedicineIds = functions.https.onCall(async (data, context) => {
  // Optional: if you want to restrict even reads to authenticated users
  // if (!context.auth) {
  //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required for this read operation.' );
  // }

  await initWeb3AndContract();

  try {
    const ids = await medicineTracker.methods.getAllMedicineIds().call();
    return ids;
  } catch (error) {
    console.error("Error fetching all medicine IDs from blockchain:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch medicine IDs.",
      error.message
    );
  }
});
