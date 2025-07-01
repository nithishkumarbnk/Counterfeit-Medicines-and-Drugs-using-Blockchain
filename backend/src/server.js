// backend/src/server.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const Web3 = require("web3"); // Import Web3 directly for v1.x

const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Variables ---
const { MongoClient } = require("mongodb");
const MONGODB_URI = process.env.MONGODB_URI;
// --- NEW: Hardcoded Admin Credentials (for demo ONLY) ---
const TEST_USERS = [
  {
    username: "admin",
    password: process.env.ADMIN_PASSWORD,
    roles: [
      "ADMIN_ROLE",
      "MANUFACTURER_ROLE",
      "REGULATOR_ROLE",
      "DISTRIBUTOR_ROLE",
      "PHARMACY_ROLE",
    ],
  },
  {
    username: "manufacturer",
    password: "manuPassword",
    roles: ["MANUFACTURER_ROLE"],
  },
  {
    username: "distributor",
    password: "distPassword",
    roles: ["DISTRIBUTOR_ROLE"],
  },
  { username: "pharmacy", password: "pharmPassword", roles: ["PHARMACY_ROLE"] },
  { username: "regulator", password: "regPassword", roles: ["REGULATOR_ROLE"] },
  { username: "public", password: "publicPassword", roles: ["PUBLIC"] }, // For testing public view
];
const SECRET_TOKEN = process.env.SECRET_TOKEN; // Used for simple auth
// --- END NEW ---
let mongoDb;

let web3;
let drugTrackingContract;
let contractAddress;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Web3 Setup ---
// Correctly initialize Web3 with its providers for v1.x
if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("wss://")
) {
  // Access WebsocketProvider as a property of Web3.providers
  web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.WEB3_PROVIDER_URL)
  );
} else if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("http")
) {
  // Access HttpProvider as a property of Web3.providers
  web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL)
  );
} else {
  web3 = new Web3("http://127.0.0.1:8545"); // fallback for local Ganache
}

// --- Test Web3 connection ---
web3.eth
  .getBlockNumber()
  .then((block) => console.log("Connected to Web3, latest block:", block))
  .catch((err) => {
    console.error("Web3 connection failed:", err.message);
    process.exit(1);
  });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: "Authentication token required." });
  }

  if (token !== SECRET_TOKEN) {
    // Simple token validation
    return res.status(403).json({ error: "Invalid authentication token." });
  }

  next(); // Proceed to the next middleware/route handler
};

// --- Add private key to wallet ---
const manufacturerPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY;
if (manufacturerPrivateKey) {
  try {
    // Standardize to adding account object
    const account = web3.eth.accounts.privateKeyToAccount(
      manufacturerPrivateKey
    );
    web3.eth.accounts.wallet.add(account);
    console.log(
      "Manufacturer account added:",
      web3.eth.accounts.wallet[0].address
    );
  } catch (e) {
    console.error("Error adding manufacturer private key:", e.message);
  }
} else {
  console.warn("MANUFACTURER_PRIVATE_KEY not set. Transactions may fail.");
}

// --- Connect to MongoDB ---
async function connectToMongoDb() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      // Add this option to force a specific TLS version if needed,
      // or to bypass strict SSL checks for testing.
      // This is a common workaround for SSL_alert_number_80 errors.
      // Note: tlsAllowInvalidCertificates should be used with caution in production.
      // A better long-term solution is to ensure your Node.js environment's OpenSSL
      // is fully compatible with MongoDB Atlas's preferred TLS settings.
      tlsAllowInvalidCertificates: true, // Temporarily allow invalid certs to bypass handshake issue
      tls: true, // Ensure TLS is explicitly enabled
    });
    await client.connect();
    mongoDb = client.db("drug_tracking_db");
    console.log("Connected to MongoDB Atlas.");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

// --- Load contract ---
const loadContract = async () => {
  try {
    const contractPath = path.resolve(
      __dirname,
      "../blockchain_artifacts/contracts/DrugTracking.json"
    );
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    const contractABI = contractArtifact.abi;
    const networkId = await web3.eth.getChainId(); // Returns string in v1.x
    const networkIdString = networkId.toString();

    console.log(`Detected Network ID: ${networkIdString}`);

    if (!contractArtifact.networks[networkIdString]) {
      throw new Error(`Contract not deployed on network ${networkIdString}`);
    }

    contractAddress = contractArtifact.networks[networkIdString].address;
    drugTrackingContract = new web3.eth.Contract(contractABI, contractAddress);

    console.log(`Connected to contract at: ${contractAddress}`);
  } catch (error) {
    console.error("Contract load failed:", error.message);
    process.exit(1);
  }
};

// --- API Routes ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = TEST_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.json({
      message: "Login successful",
      token: SECRET_TOKEN,
      roles: user.roles,
    });
  } else {
    res.status(401).json({ error: "Invalid username or password." });
  }
});
app.get("/api/user/roles", authenticateToken, (req, res) => {
  // In a real app, you'd get the username from the authenticated token
  // For this demo, we'll assume the token implies admin role for simplicity
  // Or, you could pass the username in the login response and retrieve roles based on that.
  // For now, let's just return the roles of the 'admin' user if authenticated.
  const adminUser = TEST_USERS.find((u) => u.username === "admin"); // Assuming admin is the primary user for this demo
  if (adminUser) {
    res.json({ roles: adminUser.roles });
  } else {
    res.status(500).json({ error: "Admin user not found in test data." });
  }
});

app.get("/api/hasRole/:roleName/:address", async (req, res) => {
  const { roleName, address } = req.params;

  if (!web3.utils.isAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address." });
  }

  let roleHash;
  switch (roleName.toUpperCase()) {
    case "DEFAULT_ADMIN_ROLE":
      // Special case for DEFAULT_ADMIN_ROLE: its bytes32 value is 0x00...00
      roleHash =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      break;
    case "MANUFACTURER_ROLE":
      roleHash = web3.utils.keccak256("MANUFACTURER_ROLE");
      break;
    case "DISTRIBUTOR_ROLE":
      roleHash = web3.utils.keccak256("DISTRIBUTOR_ROLE");
      break;
    case "PHARMACY_ROLE":
      roleHash = web3.utils.keccak256("PHARMACY_ROLE");
      break;
    case "REGULATOR_ROLE":
      roleHash = web3.utils.keccak256("REGULATOR_ROLE");
      break;
    default:
      return res.status(400).json({ error: "Invalid role name." });
  }

  try {
    const result = await drugTrackingContract.methods
      .hasRole(roleHash, address)
      .call();
    res.json({ address, role: roleName, hasRole: result });
  } catch (e) {
    console.error("hasRole error:", e);
    res.status(500).json({ error: "Blockchain role check failed." });
  }
});

app.post("/api/drug/manufacture", async (req, res) => {
  const { id, productId, batchId, manufacturerAddress } = req.body;

  if (!id || !productId || !batchId || !manufacturerAddress) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const loadedAddress = web3.eth.accounts.wallet[0]?.address;
    if (
      !loadedAddress ||
      loadedAddress.toLowerCase() !== manufacturerAddress.toLowerCase()
    ) {
      return res.status(400).json({ error: "Signing address mismatch." });
    }

    const tx = await drugTrackingContract.methods
      .manufactureDrug(id, productId, batchId)
      .send({
        from: manufacturerAddress,
        gas: 5000000,
        gasPrice: web3.utils.toWei("3", "gwei"), // <--- ADD THIS LINE
      });

    res.json({ message: "Manufactured", transactionHash: tx.transactionHash });
  } catch (err) {
    console.error("Manufacture error:", err);
    res.status(500).json({ error: "Failed to manufacture drug." });
  }
});

app.post("/api/drug/transfer", async (req, res) => {
  const { id, newOwnerAddress, newStatus, currentOwnerAddress } = req.body;

  if (!id || !newOwnerAddress || !newStatus || !currentOwnerAddress) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const loadedAddress = web3.eth.accounts.wallet[0]?.address;
    if (
      !loadedAddress ||
      loadedAddress.toLowerCase() !== currentOwnerAddress.toLowerCase()
    ) {
      return res.status(400).json({ error: "Signing address mismatch." });
    }

    const tx = await drugTrackingContract.methods
      .transferDrug(id, newOwnerAddress, newStatus)
      .send({ from: currentOwnerAddress, gas: 3000000 });

    res.json({ message: "Transferred", transactionHash: tx.transactionHash });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ error: "Failed to transfer drug." });
  }
});

app.get("/api/drug/verify/:drugId", async (req, res) => {
  const drugId = req.params.drugId;

  try {
    const drug = await mongoDb.collection("drugs").findOne({ _id: drugId });
    if (!drug) return res.status(404).json({ message: "Drug not found." });

    const history = await mongoDb
      .collection("drugHistoryEvents")
      .find({ drugId })
      .sort({ blockNumber: 1, logIndex: 1 })
      .toArray();

    res.json({
      productId: drug.productId,
      batchId: drug.batchId,
      manufacturer: drug.manufacturerAddress,
      currentOwner: drug.currentOwnerAddress,
      status: drug.status,
      history: history.map((e) => ({
        eventType: e.eventType,
        fromAddress: e.fromAddress,
        toAddress: e.toAddress,
        details: e.details,
        timestamp: e.eventTimestamp,
      })),
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Verify failed." });
  }
});

app.get("/api/getAllDrugs", async (req, res) => {
  try {
    const drugs = await mongoDb.collection("drugs").find({}).toArray();
    res.json(drugs);
  } catch (err) {
    console.error("All drugs fetch error:", err);
    res.status(500).json({ error: "Fetch failed." });
  }
});

app.post("/api/sensor-data", async (req, res) => {
  const { drugId, timestamp, temperature, humidity, senderAddress } = req.body;
  console.log(
    `Sensor for ${drugId} - Temp: ${temperature}°C, Humidity: ${humidity}%`
  );

  if (temperature < 2 || temperature > 8) {
    const violation = `Temperature out of range (${temperature}°C). Expected 2–8°C.`;
    try {
      const loadedAddress = web3.eth.accounts.wallet[0]?.address;
      const actualSender = senderAddress || loadedAddress;

      if (
        !actualSender ||
        actualSender.toLowerCase() !== loadedAddress.toLowerCase()
      ) {
        return res.status(400).json({ error: "Sensor sender mismatch." });
      }

      const tx = await drugTrackingContract.methods
        .logColdChainViolation(drugId, violation)
        .send({ from: actualSender, gas: 3000000 });

      console.log("Violation logged:", tx.transactionHash);
    } catch (err) {
      console.error("Violation log failed:", err.message);
    }
  }

  res.json({ message: "Sensor data received." });
});
app.post("/api/admin/grantRole", async (req, res) => {
  const { roleName, accountAddress } = req.body;

  if (!roleName || !accountAddress) {
    return res
      .status(400)
      .json({ error: "Missing roleName or accountAddress." });
  }
  if (!web3.utils.isAddress(accountAddress)) {
    return res.status(400).json({ error: "Invalid accountAddress." });
  }

  let roleHash;
  switch (roleName.toUpperCase()) {
    case "MANUFACTURER_ROLE":
      roleHash = web3.utils.keccak256("MANUFACTURER_ROLE");
      break;
    case "DISTRIBUTOR_ROLE":
      roleHash = web3.utils.keccak256("DISTRIBUTOR_ROLE");
      break;
    case "PHARMACY_ROLE":
      roleHash = web3.utils.keccak256("PHARMACY_ROLE");
      break;
    case "REGULATOR_ROLE":
      roleHash = web3.utils.keccak256("REGULATOR_ROLE");
      break;
    default:
      return res.status(400).json({ error: "Invalid role name for granting." });
  }

  try {
    const loadedAddress = web3.eth.accounts.wallet[0]?.address;
    if (!loadedAddress) {
      return res
        .status(500)
        .json({ error: "Admin signing account not loaded." });
    }

    // --- CRITICAL FIX HERE ---
    // Use the correct hash for DEFAULT_ADMIN_ROLE when checking admin status
    const DEFAULT_ADMIN_ROLE_HASH =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const isAdmin = await drugTrackingContract.methods
      .hasRole(DEFAULT_ADMIN_ROLE_HASH, loadedAddress)
      .call();
    if (!isAdmin) {
      return res.status(403).json({
        error: "Unauthorized: Only DEFAULT_ADMIN_ROLE can grant roles.",
      });
    }
    // --- END CRITICAL FIX ---

    const tx = await drugTrackingContract.methods
      .grantRole(roleHash, accountAddress)
      .send({ from: loadedAddress, gas: 3000000 });

    res.json({
      message: `Role ${roleName} granted to ${accountAddress} successfully.`,
      transactionHash: tx.transactionHash,
    });
  } catch (e) {
    console.error("Grant role error:", e);
    res
      .status(500)
      .json({ error: "Failed to grant role.", details: e.message });
  }
});

// POST /api/admin/revokeRole
app.post("/api/admin/revokeRole", async (req, res) => {
  const { roleName, accountAddress } = req.body;

  if (!roleName || !accountAddress) {
    return res
      .status(400)
      .json({ error: "Missing roleName or accountAddress." });
  }
  if (!web3.utils.isAddress(accountAddress)) {
    return res.status(400).json({ error: "Invalid accountAddress." });
  }

  let roleHash;
  switch (roleName.toUpperCase()) {
    case "MANUFACTURER_ROLE":
      roleHash = web3.utils.keccak256("MANUFACTURER_ROLE");
      break;
    case "DISTRIBUTOR_ROLE":
      roleHash = web3.utils.keccak256("DISTRIBUTOR_ROLE");
      break;
    case "PHARMACY_ROLE":
      roleHash = web3.utils.keccak256("PHARMACY_ROLE");
      break;
    case "REGULATOR_ROLE":
      roleHash = web3.utils.keccak256("REGULATOR_ROLE");
      break;
    default:
      return res.status(400).json({ error: "Invalid role name for revoking." });
  }

  try {
    const loadedAddress = web3.eth.accounts.wallet[0]?.address;
    if (!loadedAddress) {
      return res
        .status(500)
        .json({ error: "Admin signing account not loaded." });
    }

    // --- CRITICAL FIX HERE ---
    // Use the correct hash for DEFAULT_ADMIN_ROLE when checking admin status
    const DEFAULT_ADMIN_ROLE_HASH =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const isAdmin = await drugTrackingContract.methods
      .hasRole(DEFAULT_ADMIN_ROLE_HASH, loadedAddress)
      .call();
    if (!isAdmin) {
      return res.status(403).json({
        error: "Unauthorized: Only DEFAULT_ADMIN_ROLE can grant roles.",
      });
    }
    // --- END CRITICAL FIX ---

    const tx = await drugTrackingContract.methods
      .revokeRole(roleHash, accountAddress)
      .send({ from: loadedAddress, gas: 3000000 });

    res.json({
      message: `Role ${roleName} revoked from ${accountAddress} successfully.`,
      transactionHash: tx.transactionHash,
    });
  } catch (e) {
    console.error("Revoke role error:", e);
    res
      .status(500)
      .json({ error: "Failed to revoke role.", details: e.message });
  }
});
// --- Start Server ---
loadContract()
  .then(() => {
    app.listen(PORT, async () => {
      await connectToMongoDb();
      console.log(`Server running at port ${PORT}`);
      console.log(`Connected to Web3 at: ${process.env.WEB3_PROVIDER_URL}`);
    });
  })
  .catch((e) => {
    console.error("Startup failed:", e.message);
    process.exit(1);
  });
