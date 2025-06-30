require("dotenv").config();
const { Web3 } = require("web3"); // Destructure Web3 from the require call
const { MongoClient } = require("mongodb"); // MongoDB client
const path = require("path");
const fs = require("fs");

// --- Configuration ---
const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL;
const MONGODB_URI = process.env.MONGODB_URI; // MongoDB URI
const DRUG_TRACKING_CONTRACT_ADDRESS =
  process.env.DRUG_TRACKING_CONTRACT_ADDRESS;
const START_BLOCK_NUMBER = parseInt(process.env.START_BLOCK_NUMBER || "0"); // Start from 0 if not specified

// --- Web3 Setup ---
// For real-time subscriptions, Web3.js often requires a WebSocket provider (wss://)
// If your WEB3_PROVIDER_URL is http(s  )://, real-time listening might be less reliable
// or not work at all, depending on the provider's support for HTTP long-polling for subscriptions.
// For robust real-time indexing, consider using a WSS endpoint from Alchemy/Infura.
const web3 = new Web3(WEB3_PROVIDER_URL);

// --- MongoDB Setup ---
let db; // Global variable to hold the database connection

async function connectToMongo() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    db = client.db("drug_tracking_db"); // Connect to a specific database (you can name it anything)
    console.log("Successfully connected to MongoDB.");

    // --- DEFINITIVE TEST WRITE ---
    const testCollection = db.collection("connection_test");
    const testDoc = {
      _id: "test_doc_from_indexer", // Fixed _id for upsert
      timestamp: new Date(),
      message: "Connection test successful and write confirmed",
      randomValue: Math.random(), // Add a random value to ensure it's always a change
    };
    const result = await testCollection.updateOne(
      { _id: testDoc._id },
      { $set: testDoc },
      { upsert: true }
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log(
        "[MONGO_TEST] Successfully wrote/updated test document in 'connection_test' collection."
      );
    } else {
      console.warn(
        "[MONGO_TEST] Test document write had no effect (document might be identical)."
      );
    }
    // --- END DEFINITIVE TEST WRITE ---
  } catch (testError) {
    console.error(
      "[MONGO_TEST_ERROR] Failed to connect or write test document:",
      testError.message
    );
    console.error(testError); // Log the full error object
    process.exit(1); // Exit if the basic test write fails
  }
}

// --- Load Contract ABI ---
let drugTrackingABI;
try {
  // Adjust path based on your project structure
  const abiPath = path.resolve(
    __dirname,
    "../blockchain/build/contracts/DrugTracking.json"
  );
  const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  drugTrackingABI = contractJson.abi;
} catch (error) {
  console.error("Error loading DrugTracking ABI:", error);
  process.exit(1); // Exit if ABI cannot be loaded
}

const drugTrackingContract = new web3.eth.Contract(
  drugTrackingABI,
  DRUG_TRACKING_CONTRACT_ADDRESS
);

// --- Indexer Logic ---

async function getLatestIndexedBlock() {
  try {
    const collection = db.collection("indexer_state"); // Collection to store indexer's progress
    const state = await collection.findOne({ _id: "last_indexed_block" });
    return state ? state.blockNumber : START_BLOCK_NUMBER;
  } catch (error) {
    console.error("Error getting latest indexed block from DB:", error);
    return START_BLOCK_NUMBER; // Fallback to start block
  }
}

async function updateLatestIndexedBlock(blockNumber) {
  try {
    console.log(
      `[DB_UPDATE] Attempting to update last_indexed_block to: ${blockNumber}`
    );
    const collection = db.collection("indexer_state");
    const result = await collection.updateOne(
      { _id: "last_indexed_block" },
      { $set: { blockNumber: blockNumber, timestamp: new Date() } },
      { upsert: true } // Create if not exists
    );

    // Check if the update actually modified a document or inserted a new one
    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log(
        `[DB_UPDATE] Successfully updated last_indexed_block to: ${blockNumber}`
      );
    } else {
      // This case might happen if the blockNumber is the same as the one already in DB
      // but given your scenario, it's unlikely to be the only reason.
      console.warn(
        `[DB_UPDATE] Update operation for last_indexed_block to ${blockNumber} had no effect (block number might be same).`
      );
    }
  } catch (error) {
    console.error(
      `[DB_UPDATE_ERROR] Error updating latest indexed block in DB for block ${blockNumber}:`,
      error.message
    );
    console.error(error); // Log the full error object for stack trace and details
  }
}

async function processEvent(event) {
  const session = db.client.startSession(); // Start a session for transaction-like behavior
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

    // Check for duplicate event (important for re-syncs)
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
    let drugDoc = {}; // Document for the 'drugs' collection

    switch (eventName) {
      case "DrugManufactured":
        drugId = returnValues.id;
        fromAddress = "0x0000000000000000000000000000000000000000"; // Placeholder for no 'from'
        toAddress = returnValues.manufacturer;
        details = `Manufactured by ${returnValues.manufacturer}. Product: ${returnValues.productId}, Batch: ${returnValues.batchId}`;

        drugDoc = {
          _id: drugId, // Use drugId as _id for easy lookup
          productId: returnValues.productId,
          batchId: returnValues.batchId,
          manufacturerAddress: returnValues.manufacturer,
          currentOwnerAddress: returnValues.manufacturer, // Initial owner is manufacturer
          status: "MANUFACTURED",
          manufactureTimestamp: new Date(Number(returnValues.timestamp) * 1000), // CONVERT TO DATE
          lastUpdateTimestamp: new Date(Number(returnValues.timestamp) * 1000), // CONVERT TO DATE
          contractAddress: DRUG_TRACKING_CONTRACT_ADDRESS,
          lastSyncedBlock: Number(blockNumber), // Ensure blockNumber is Number
        };

        // Upsert (insert or update) into 'drugs' collection
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

        // Update 'drugs' collection
        await db.collection("drugs").updateOne(
          { _id: drugId },
          {
            $set: {
              currentOwnerAddress: toAddress,
              status: returnValues.newStatus,
              lastUpdateTimestamp: new Date(
                Number(returnValues.timestamp) * 1000
              ), // CONVERT TO DATE
              lastSyncedBlock: Number(blockNumber), // Ensure blockNumber is Number
            },
          },
          { session }
        );
        break;

      case "ColdChainViolation":
        drugId = returnValues.id;
        details = `Cold Chain Violation: ${returnValues.details}`;
        // No update to drug status or owner, just log history
        break;

      case "OwnershipTransferred": // Handle the OwnershipTransferred event from Ownable
        console.log(
          `  Ownership of contract transferred from ${returnValues.previousOwner} to ${returnValues.newOwner}`
        );
        // This event is typically not part of the drug's history, but rather the contract's
        // We log it, but skip inserting into drugHistoryEvents for this specific event.
        await session.commitTransaction(); // Commit this specific event's transaction
        return; // Skip inserting into drugHistoryEvents for this event

      default:
        console.warn(`  Unknown event type: ${eventName}`);
        await session.abortTransaction(); // Abort if unknown event
        return;
    }

    // Insert into 'drugHistoryEvents' collection
    await db.collection("drugHistoryEvents").insertOne(
      {
        drugId: drugId,
        eventType: eventName,
        fromAddress: fromAddress,
        toAddress: toAddress,
        details: details,
        eventTimestamp: new Date(Number(event.timestamp) * 1000), // CONVERT TO DATE
        transactionHash: transactionHash,
        blockNumber: Number(blockNumber), // Ensure blockNumber is Number
        logIndex: logIndex,
      },
      { session }
    );

    await session.commitTransaction(); // Commit transaction
    console.log(`  Successfully processed ${eventName} for drug ${drugId}`);
  } catch (error) {
    await session.abortTransaction(); // Abort on error
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

  // Convert latestBlock to Number if it's a BigInt
  const latestBlockBigInt = await web3.eth.getBlockNumber();
  const latestBlock = Number(latestBlockBigInt); // <--- CONVERT TO NUMBER HERE
  console.log(`Current latest block on chain: ${latestBlock}`);

  const BATCH_SIZE = 500;

  // Ensure currentBlock is also a Number for arithmetic
  let currentBlock = Number(fromBlock); // <--- CONVERT TO NUMBER HERE (if getLatestIndexedBlock returns BigInt)

  console.log("Fetching past events in batches...");
  while (currentBlock <= latestBlock) {
    // Ensure all values passed to Math.min are Numbers
    const toBlock = Math.min(currentBlock + BATCH_SIZE - 1, latestBlock);
    console.log(`  Fetching events from block ${currentBlock} to ${toBlock}`);

    try {
      const events = await drugTrackingContract.getPastEvents("allEvents", {
        fromBlock: currentBlock,
        toBlock: toBlock,
      });

      console.log(`  Found ${events.length} events in this batch.`);
      events.sort((a, b) => {
        // Convert blockNumber to Number for comparison
        const blockA = Number(a.blockNumber);
        const blockB = Number(b.blockNumber);

        if (blockA === blockB) {
          return a.logIndex - b.logIndex;
        }
        return blockA - blockB;
      });

      for (const event of events) {
        await processEvent(event);
        console.log(
          `[DEBUG] Calling updateLatestIndexedBlock for event at block: ${Number(
            event.blockNumber
          )}`
        ); // ADDED DEBUG LOG
        await updateLatestIndexedBlock(Number(event.blockNumber));
      }
      currentBlock = toBlock + 1;
      console.log(
        `[DEBUG] Finished batch up to ${toBlock}. Next batch starts at ${currentBlock}.`
      ); // ADDED DEBUG LOG
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
    // Ensure the provider is ready for subscriptions
    // This is the critical part. web3.currentProvider might not be fully connected yet.
    // For WSS, web3.js manages the connection, but sometimes it needs a moment.
    // Let's try to ensure the provider is active.
    if (!web3.currentProvider || !web3.currentProvider.connected) {
      console.warn(
        "Web3 provider not connected for real-time listener. Attempting to reconnect/wait."
      );
      // If using a WebSocketProvider, it should attempt to connect automatically.
      // We can add a small delay or a more explicit connection check if needed.
      // For now, let's just proceed and see if the error changes.
    }

    // --- REVISED SUBSCRIPTION SETUP ---
    // Instead of directly calling drugTrackingContract.events.allEvents,
    // let's try to explicitly get the subscription from the web3 instance.
    // This often helps with provider issues.

    // First, define the subscription options
    const subscriptionOptions = {
      address: DRUG_TRACKING_CONTRACT_ADDRESS,
      topics: [], // All events
    };

    // Now, create the subscription
    const subscription = web3.eth.subscribe("logs", subscriptionOptions);

    // Crucial check: Ensure 'subscription' is a valid object before chaining .on()
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
        // 'data' event for 'logs' subscription returns a raw log object
        console.log("New real-time raw log received:", log);
        // You need to decode this raw log into an event object that processEvent expects.
        // This is the missing piece for direct web3.eth.subscribe('logs').
        // Let's try to decode it using the contract's ABI.

        try {
          const decodedEvent = web3.eth.abi.decodeLog(
            drugTrackingABI.filter((abi) => abi.type === "event"), // Filter for event ABIs
            log.data,
            log.topics.slice(1) // Remove the event signature topic
          );

          // Find the event ABI definition to get the event name
          const eventAbi = drugTrackingABI.find(
            (abi) =>
              abi.type === "event" &&
              web3.utils.sha3(
                abi.name +
                  "(" +
                  abi.inputs.map((input) => input.type).join(",") +
                  ")"
              ) === log.topics[0]
          );

          if (eventAbi) {
            const eventObject = {
              event: eventAbi.name,
              returnValues: decodedEvent,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
              timestamp: (await web3.eth.getBlock(log.blockNumber)).timestamp, // Fetch timestamp from block
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
        // Consider adding logic to attempt reconnection here
      });

    // Optional: Handle process exit to clean up subscription
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
    // Re-throw the error to be caught by the main function's catch block
    throw error;
  }
}
// --- Main Execution ---
async function main() {
  try {
    await connectToMongo(); // Connect to MongoDB
    await startListening(); // UNCOMMENTED THIS LINE
  } catch (err) {
    console.error("Failed to connect to database or start listener:", err);
    process.exit(1);
  }
}

main();
