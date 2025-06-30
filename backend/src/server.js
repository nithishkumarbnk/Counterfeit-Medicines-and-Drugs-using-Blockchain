// backend/src/server.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Web3 } = require("web3");
const { HttpProvider, WebsocketProvider } = require("web3-providers");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const { MongoClient } = require("mongodb");
const MONGODB_URI = process.env.MONGODB_URI;
let mongoDb;

let web3;
let drugTrackingContract;
let contractAddress;

app.use(cors());
app.use(bodyParser.json());

// Setup Web3 instance
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
  web3 = new Web3("http://127.0.0.1:8545");
}

// MongoDB
async function connectToMongoDb() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    mongoDb = client.db("drug_tracking_db");
    console.log("Backend successfully connected to MongoDB Atlas.");
  } catch (error) {
    console.error("Backend failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Load contract and wallet
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
      throw new Error(`Contract not deployed on network ${networkIdString}`);
    }

    contractAddress = contractArtifact.networks[networkIdString].address;
    drugTrackingContract = new web3.eth.Contract(contractABI, contractAddress);
    console.log(`Connected to DrugTracking contract at: ${contractAddress}`);

    const manufacturerPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY;
    if (manufacturerPrivateKey) {
      const account = web3.eth.accounts.privateKeyToAccount(
        manufacturerPrivateKey
      );
      web3.eth.accounts.wallet.add(account);
      console.log("Manufacturer account added:", account.address);
    } else {
      console.warn("MANUFACTURER_PRIVATE_KEY not set.");
    }
  } catch (error) {
    console.error("Failed to load contract or wallet:", error.message);
    process.exit(1);
  }
};

// API endpoints
app.get("/api/hasRole/:roleName/:address", async (req, res) => {
  const { roleName, address } = req.params;

  if (!web3.utils.isAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address." });
  }

  let roleHash;
  switch (roleName.toUpperCase()) {
    case "DEFAULT_ADMIN_ROLE":
    case "MANUFACTURER_ROLE":
    case "DISTRIBUTOR_ROLE":
    case "PHARMACY_ROLE":
    case "REGULATOR_ROLE":
      roleHash = web3.utils.keccak256(roleName.toUpperCase());
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
      .send({ from: manufacturerAddress, gas: 3000000 });

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
    const violation = `Temperature out of range (${temperature}°C). Expected 2-8°C.`;
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

// Start
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
