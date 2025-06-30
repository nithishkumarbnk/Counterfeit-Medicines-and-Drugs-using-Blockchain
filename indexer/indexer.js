require("dotenv").config();
const Web3 = require("web3");
const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

// --- Configuration ---
const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const DRUG_TRACKING_CONTRACT_ADDRESS =
  process.env.DRUG_TRACKING_CONTRACT_ADDRESS;
const START_BLOCK_NUMBER = parseInt(process.env.START_BLOCK_NUMBER || "0");

// --- Web3 Setup ---
// Initial web3 instance for getPastEvents (can use HTTP or WSS)
const web3 = new Web3(WEB3_PROVIDER_URL);

// --- MongoDB Setup ---
let db;

async function connectToMongo() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    db = client.db("drug_tracking_db");
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("[MONGO_ERROR] Failed to connect to MongoDB:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// --- Load Contract ABI ---
let drugTrackingABI;
try {
  const abiPath = path.resolve(
    __dirname,
    "../blockchain/build/contracts/DrugTracking.json"
  );
  const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  drugTrackingABI = contractJson.abi;
} catch (error) {
  console.error("Error loading DrugTracking ABI:", error);
  process.exit(1);
}

// Contract instance for historical events (can use initial web3 instance)
const drugTrackingContract = new web3.eth.Contract(
  drugTrackingABI,
  DRUG_TRACKING_CONTRACT_ADDRESS
);

// --- Indexer Logic ---

async function getLatestIndexedBlock() {
  try {
    const state = await db
      .collection("indexer_state")
      .findOne({ _id: "last_indexed_block" });
    return state ? state.blockNumber : START_BLOCK_NUMBER;
  } catch (error) {
    console.error("Error getting latest indexed block from DB:", error);
    return START_BLOCK_NUMBER;
  }
}

async function updateLatestIndexedBlock(blockNumber) {
  try {
    const collection = db.collection("indexer_state");
    await collection.updateOne(
      { _id: "last_indexed_block" },
      { $set: { blockNumber: blockNumber, timestamp: new Date() } },
      { upsert: true }
    );
  } catch (error) {
    console.error(
      `[DB_UPDATE_ERROR] Error updating latest indexed block in DB for block ${blockNumber}:`,
      error.message
    );
    console.error(error);
  }
}

async function processEvent(event) {
  const session = db.client.startSession();
  session.startTransaction();
  try {
    const {
      returnValues,
      event: eventName,
      transactionHash,
      blockNumber,
      logIndex,
    } = event;

    console.log(
      `Processing event: ${eventName} (Block: ${blockNumber}, Tx: ${transactionHash})`
    );

    const duplicateCheck = await db
      .collection("drugHistoryEvents")
      .findOne(
        { transactionHash: transactionHash, logIndex: logIndex },
        { session }
      );
    if (duplicateCheck) {
      console.log(
        `  Event already processed: ${eventName} (Tx: ${transactionHash}, Log: ${logIndex})`
      );
      await session.commitTransaction();
      return;
    }

    let drugId;
    let fromAddress = null;
    let toAddress = null;
    let details = null;
    let drugDoc = {};

    switch (eventName) {
      case "DrugManufactured":
        drugId = returnValues.id;
        fromAddress = "0x0000000000000000000000000000000000000000";
        toAddress = returnValues.manufacturer;
        details = `Manufactured by ${returnValues.manufacturer}. Product: ${returnValues.productId}, Batch: ${returnValues.batchId}`;

        drugDoc = {
          _id: drugId,
          productId: returnValues.productId,
          batchId: returnValues.batchId,
          manufacturerAddress: returnValues.manufacturer,
          currentOwnerAddress: returnValues.manufacturer,
          status: "MANUFACTURED",
          manufactureTimestamp: new Date(Number(returnValues.timestamp) * 1000),
          lastUpdateTimestamp: new Date(Number(returnValues.timestamp) * 1000),
          contractAddress: DRUG_TRACKING_CONTRACT_ADDRESS,
          lastSyncedBlock: Number(blockNumber),
        };

        await db
          .collection("drugs")
          .updateOne(
            { _id: drugId },
            { $set: drugDoc },
            { upsert: true, session }
          );
        break;

      case "DrugTransferred":
        drugId = returnValues.id;
        fromAddress = returnValues.from;
        toAddress = returnValues.to;
        details = `Transferred from ${fromAddress} to ${toAddress}. New Status: ${returnValues.newStatus}`;

        await db.collection("drugs").updateOne(
          { _id: drugId },
          {
            $set: {
              currentOwnerAddress: toAddress,
              status: returnValues.newStatus,
              lastUpdateTimestamp: new Date(
                Number(returnValues.timestamp) * 1000
              ),
              lastSyncedBlock: Number(blockNumber),
            },
          },
          { session }
        );
        break;

      case "ColdChainViolation":
        drugId = returnValues.id;
        details = `Cold Chain Violation: ${returnValues.details}`;
        break;

      case "OwnershipTransferred":
        console.log(
          `  Ownership of contract transferred from ${returnValues.previousOwner} to ${returnValues.newOwner}`
        );
        await session.commitTransaction();
        return;

      default:
        console.warn(`  Unknown event type: ${eventName}`);
        await session.abortTransaction();
        return;
    }

    await db.collection("drugHistoryEvents").insertOne(
      {
        drugId: drugId,
        eventType: eventName,
        fromAddress: fromAddress,
        toAddress: toAddress,
        details: details,
        eventTimestamp: new Date(Number(event.timestamp) * 1000),
        transactionHash: transactionHash,
        blockNumber: Number(blockNumber),
        logIndex: logIndex,
      },
      { session }
    );

    await session.commitTransaction();
    console.log(`  Successfully processed ${eventName} for drug ${drugId}`);
  } catch (error) {
    await session.abortTransaction();
    console.error(
      `Error processing event ${event.event} (Tx: ${event.transactionHash}):`,
      error
    );
  } finally {
    session.endSession();
  }
}

async function startListening() {
  console.log("Starting event listener...");
  let fromBlock = await getLatestIndexedBlock();
  console.log(`Listening for events from block ${fromBlock}`);

  const latestBlockBigInt = await web3.eth.getBlockNumber();
  const latestBlock = Number(latestBlockBigInt);
  console.log(`Current latest block on chain: ${latestBlock}`);

  const BATCH_SIZE = 500;

  let currentBlock = Number(fromBlock);

  console.log("Fetching past events in batches...");
  while (currentBlock <= latestBlock) {
    const toBlock = Math.min(currentBlock + BATCH_SIZE - 1, latestBlock);
    console.log(`  Fetching events from block ${currentBlock} to ${toBlock}`);

    try {
      const events = await drugTrackingContract.getPastEvents("allEvents", {
        fromBlock: currentBlock,
        toBlock: toBlock,
      });

      console.log(`  Found ${events.length} events in this batch.`);
      events.sort((a, b) => {
        const blockA = Number(a.blockNumber);
        const blockB = Number(b.blockNumber);

        if (blockA === blockB) {
          return a.logIndex - b.logIndex;
        }
        return blockA - blockB;
      });

      for (const event of events) {
        await processEvent(event);
        await updateLatestIndexedBlock(Number(event.blockNumber));
      }
      currentBlock = toBlock + 1;
    } catch (error) {
      console.error(
        `Error fetching events from block ${currentBlock} to ${toBlock}:`,
        error
      );
      process.exit(1);
    }
  }
  console.log(
    "Finished processing past events. Attempting to start real-time listener."
  );

  try {
    const wsProvider = new Web3.providers.WebsocketProvider(WEB3_PROVIDER_URL);
    const wsWeb3 = new Web3(wsProvider);

    console.log("Waiting for WebSocket provider to connect...");
    await new Promise((resolve, reject) => {
      wsProvider.on("connect", () => {
        console.log("WebSocket provider connected.");
        resolve();
      });
      wsProvider.on("error", (err) => {
        console.error("WebSocket provider error:", err);
        reject(err);
      });
      wsProvider.on("end", (err) => {
        console.error("WebSocket provider ended:", err);
        reject(err);
      });
      setTimeout(
        () => reject(new Error("WebSocket connection timed out")),
        10000
      );
    });

    const subscription = wsWeb3.eth.subscribe("logs", {
      address: DRUG_TRACKING_CONTRACT_ADDRESS,
      topics: [],
    });

    if (!subscription || typeof subscription.on !== "function") {
      throw new Error(
        "Real-time subscription object is invalid or undefined after web3.eth.subscribe. Check provider connection and WSS URL."
      );
    }

    subscription
      .on("connected", (subscriptionId) => {
        console.log(
          "Real-time listener connected. Subscription ID:",
          subscriptionId
        );
      })
      .on("data", async (log) => {
        console.log("New real-time raw log received:", log);

        try {
          const eventAbi = drugTrackingABI.find(
            (abi) =>
              abi.type === "event" &&
              log.topics[0] ===
                wsWeb3.utils.sha3(
                  abi.name +
                    "(" +
                    abi.inputs.map((input) => input.type).join(",") +
                    ")"
                )
          );

          if (eventAbi) {
            const decodedEvent = wsWeb3.eth.abi.decodeLog(
              eventAbi.inputs,
              log.data,
              log.topics.slice(1)
            );

            const eventObject = {
              event: eventAbi.name,
              returnValues: decodedEvent,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
              timestamp: (await wsWeb3.eth.getBlock(log.blockNumber)).timestamp,
            };
            console.log("Decoded real-time event:", eventObject.event);
            await processEvent(eventObject);
            await updateLatestIndexedBlock(Number(eventObject.blockNumber));
          } else {
            console.warn("Could not decode unknown event from log:", log);
          }
        } catch (decodeError) {
          console.error("Error decoding log:", decodeError);
        }
      })
      .on("error", (error) => {
        console.error("Real-time listener error:", error);
      });

    process.on("SIGINT", () => {
      console.log("Caught interrupt signal. Unsubscribing...");
      subscription.unsubscribe((error, success) => {
        if (success) {
          console.log("Successfully unsubscribed from real-time events.");
        } else {
          console.error("Error unsubscribing:", error);
        }
        process.exit();
      });
    });
  } catch (error) {
    console.error("Failed to start real-time listener:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectToMongo();
    await startListening();
  } catch (err) {
    console.error("Failed to connect to database or start listener:", err);
    process.exit(1);
  }
}

main();
