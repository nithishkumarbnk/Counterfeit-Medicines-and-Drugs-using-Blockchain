const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const Web3 = require("web3");

const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Variables ---
const { MongoClient } = require("mongodb");
const MONGODB_URI = process.env.MONGODB_URI;
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
    address: "0x02f1C11cc7D5ec6841666B58F030e9Afa668Afb9",
  },
  {
    username: "manufacturer",
    password: "manufacturer",
    roles: ["MANUFACTURER_ROLE"],
    address: "0x02f1C11cc7D5ec6841666B58F030e9Afa668Afb9",
  },
  {
    username: "regulator",
    password: "regulator",
    roles: ["REGULATOR_ROLE"],
    address: "0x02f1C11cc7D5ec6841666B58F030e9Afa668Afb9",
  },
  {
    username: "distributor",
    password: "distributor",
    roles: ["DISTRIBUTOR_ROLE"],
    address: "0x5C69D627209180f88bA7b8Ce243C3384A44F0D0E",
  },
  {
    username: "pharmacy",
    password: "pharmacy",
    roles: ["PHARMACY_ROLE"],
    address: "0x02f1C11cc7D5ec6841666B58F030e9Afa668Afb9",
  },
  { username: "public", password: "public", roles: ["PUBLIC"] },
];

const SECRET_TOKEN = process.env.SECRET_TOKEN;
let mongoDb;
let web3;
let drugTrackingContract;
let contractAddress;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Web3 Setup ---
if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("wss://")
) {
  web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.WEB3_PROVIDER_URL)
  );
} else if (
  process.env.WEB3_PROVIDER_URL &&
  process.env.WEB3_PROVIDER_URL.startsWith("http")
) {
  web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL)
  );
} else {
  web3 = new Web3("http://127.0.0.1:8545");
}

web3.eth
  .getBlockNumber()
  .then((block) => console.log("Connected to Web3, latest block:", block))
  .catch((err) => {
    console.error("Web3 connection failed:", err.message);
    process.exit(1);
  });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null)
    return res.status(401).json({ error: "Authentication token required." });
  if (token !== SECRET_TOKEN)
    return res.status(403).json({ error: "Invalid authentication token." });
  next();
};

// --- Add private key to wallet ---
const loadedPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY; // Using a generic name
if (loadedPrivateKey) {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(loadedPrivateKey);
    web3.eth.accounts.wallet.add(account);
    console.log("Signing account loaded:", web3.eth.accounts.wallet[0].address);
  } catch (e) {
    console.error("Error adding private key:", e.message);
  }
} else {
  console.warn("MANUFACTURER_PRIVATE_KEY not set. Transactions will fail.");
}

// --- Connect to MongoDB ---
async function connectToMongoDb() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      tlsAllowInvalidCertificates: true,
      tls: true,
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
    const networkId = await web3.eth.getChainId();
    const networkIdString = networkId.toString();
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
      userAddress: user.address,
    });
  } else {
    res.status(401).json({ error: "Invalid username or password." });
  }
});

app.get(
  "/api/drugs/byManufacturer/:username",
  authenticateToken,
  async (req, res) => {
    try {
      const { username } = req.params;
      const user = TEST_USERS.find((u) => u.username === username);
      if (!user || !user.address) return res.json([]);
      const drugs = await mongoDb
        .collection("drugs")
        .find({
          manufacturer: { $regex: new RegExp(`^${user.address}$`, "i") },
        })
        .toArray();
      res.json(drugs);
    } catch (error) {
      console.error("Error fetching drugs by manufacturer:", error);
      res
        .status(500)
        .json({ message: "Error fetching drugs by manufacturer." });
    }
  }
);

app.post("/api/drug/manufacture", authenticateToken, async (req, res) => {
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
    const contractMethod = drugTrackingContract.methods.manufactureDrug(
      id,
      productId,
      batchId
    );
    const estimatedGas = await contractMethod.estimateGas({
      from: manufacturerAddress,
    });

    // --- GAS PRICE FIX ---
    const baseGasPrice = await web3.eth.getGasPrice();
    const gasPrice = (BigInt(baseGasPrice) * 120n) / 100n;
    console.log(
      `→ Manufacture Drug | Base Gas: ${baseGasPrice}, Offered Gas: ${gasPrice}`
    );

    const receipt = await contractMethod.send({
      from: manufacturerAddress,
      gas: estimatedGas + 100000,
      gasPrice,
    });
    res.status(200).json({
      message: "Drug manufactured successfully.",
      transactionHash: receipt.transactionHash,
    });
  } catch (err) {
    console.error("Manufacture error:", err.message || err);
    res.status(500).json({
      error: "Failed to manufacture drug.",
      details: err.message || "Unknown error",
    });
  }
});

app.post("/api/drug/transfer", authenticateToken, async (req, res) => {
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
    const contractMethod = drugTrackingContract.methods.transferDrug(
      id,
      newOwnerAddress,
      newStatus
    );
    const estimatedGas = await contractMethod.estimateGas({
      from: currentOwnerAddress,
    });

    // --- GAS PRICE FIX ---
    const baseGasPrice = await web3.eth.getGasPrice();
    const gasPrice = (BigInt(baseGasPrice) * 120n) / 100n;
    console.log(
      `→ Transfer Drug | Base Gas: ${baseGasPrice}, Offered Gas: ${gasPrice}`
    );

    const receipt = await contractMethod.send({
      from: currentOwnerAddress,
      gas: estimatedGas + 100000,
      gasPrice,
    });
    res.status(200).json({
      message: "Drug transferred successfully.",
      transactionHash: receipt.transactionHash,
    });
  } catch (err) {
    console.error("Transfer route failure:", err.message || err);
    res.status(500).json({
      error: "Failed to transfer drug.",
      details: err.message || "Unknown error",
    });
  }
});

app.get("/api/getAllDrugs", authenticateToken, async (req, res) => {
  try {
    const drugs = await mongoDb.collection("drugs").find({}).toArray();
    res.json(drugs);
  } catch (err) {
    console.error("All drugs fetch error:", err);
    res.status(500).json({ error: "Fetch failed." });
  }
});

app.get("/api/violations/all", authenticateToken, async (req, res) => {
  try {
    const violations = await mongoDb
      .collection("drugHistoryEvents")
      .find({ eventType: "ColdChainViolation" })
      .toArray();
    res.json(violations);
  } catch (error) {
    console.error("Error fetching all violations:", error);
    res.status(500).json({ message: "Error fetching violations." });
  }
});

app.get(
  "/api/drugs/byCurrentOwner/:address",
  authenticateToken,
  async (req, res) => {
    try {
      const { address } = req.params;
      if (!web3.utils.isAddress(address)) {
        return res
          .status(400)
          .json({ error: "Invalid Ethereum address provided." });
      }
      const drugs = await mongoDb
        .collection("drugs")
        .find({ currentOwner: { $regex: new RegExp(`^${address}$`, "i") } })
        .toArray();
      res.json(drugs);
    } catch (error) {
      console.error("Error fetching drugs by current owner:", error);
      res
        .status(500)
        .json({ message: "Error fetching drugs by current owner." });
    }
  }
);
// In backend/src/server.js
app.get("/api/drug/verify/:drugId", async (req, res) => {
  const drugId = req.params.drugId;

  try {
    // FIX 1: Query by 'id' field, not '_id'
    const drug = await mongoDb.collection("drugs").findOne({ _id: drugId });
    if (!drug) return res.status(404).json({ message: "Drug not found." });

    const history = await mongoDb
      .collection("drugHistoryEvents")
      .find({ drugId: drug.id })
      .sort({ blockNumber: 1, logIndex: 1 })
      .toArray();

    res.json({
      productId: drug.productId,
      batchId: drug.batchId,
      manufacturer: drug.manufacturer,
      currentOwner: drug.currentOwner,
      status: drug.status,
      history: history.map((e) => ({
        eventType: e.eventType,
        fromAddress: e.from,
        toAddress: e.to,
        details: e.details,
        timestamp: e.eventTimestamp,
        blockNumber: e.blockNumber,
      })),
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Verify failed." });
  }
});

app.post("/api/drug/dispense", authenticateToken, async (req, res) => {
  const { drugId } = req.body;
  if (!drugId) return res.status(400).json({ error: "Drug ID is required." });
  try {
    const loadedAddress = web3.eth.accounts.wallet[0]?.address;
    if (!loadedAddress)
      return res
        .status(500)
        .json({ error: "Signing account not loaded on the server." });

    const PHARMACY_ROLE_HASH = web3.utils.keccak256("PHARMACY_ROLE");
    const hasRole = await drugTrackingContract.methods
      .hasRole(PHARMACY_ROLE_HASH, loadedAddress)
      .call();
    if (!hasRole)
      return res.status(403).json({
        error:
          "Unauthorized: The server's account does not have the PHARMACY_ROLE.",
      });

    const drugDetails = await drugTrackingContract.methods
      .verifyDrug(drugId)
      .call();
    if (
      drugDetails.currentOwner.toLowerCase() !== loadedAddress.toLowerCase()
    ) {
      return res.status(403).json({
        error: "Forbidden: You are not the current owner of this drug.",
      });
    }

    const newOwnerAddress = "0x0000000000000000000000000000000000000000";
    const newStatus = "DISPENSED_TO_PATIENT";
    const contractMethod = drugTrackingContract.methods.transferDrug(
      drugId,
      newOwnerAddress,
      newStatus
    );
    const estimatedGas = await contractMethod.estimateGas({
      from: loadedAddress,
    });

    // --- GAS PRICE FIX ---
    const baseGasPrice = await web3.eth.getGasPrice();
    const gasPrice = (BigInt(baseGasPrice) * 120n) / 100n;
    console.log(
      `→ Dispensing Drug | Base Gas: ${baseGasPrice}, Offered Gas: ${gasPrice}`
    );

    const receipt = await contractMethod.send({
      from: loadedAddress,
      gas: estimatedGas + 100000,
      gasPrice,
    });
    res.status(200).json({
      message: `Drug ${drugId} dispensed successfully.`,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Dispense drug error:", error);
    if (error.message.includes("revert")) {
      const reason = error.message.match(/revert (.*)/);
      return res.status(400).json({
        error: `Transaction failed: ${
          reason ? reason[1] : "Check contract conditions."
        }`,
      });
    }
    res.status(500).json({
      error: "Failed to dispense drug due to a server or blockchain error.",
      details: error.message,
    });
  }
});

// --- Start Server ---
loadContract()
  .then(() => {
    app.listen(PORT, async () => {
      await connectToMongoDb();
      console.log(`Server running at port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error("Startup failed:", e.message);
    process.exit(1);
  });
