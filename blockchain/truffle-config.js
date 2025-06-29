const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config(); // Load environment variables from .env file

const mnemonic = process.env.MNEMONIC;
// Use the environment variable for your Web3 provider URL
// Make sure you set INFURA_URL or ALCHEMY_URL in your .env file
const web3ProviderUrl = process.env.INFURA_URL || process.env.ALCHEMY_URL;

module.exports = {
  contracts_build_directory: path.join(__dirname, "build/contracts"),
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ganache port
      network_id: "*", // Any network (default: none)
    },
    sepolia: {
      // New network configuration for Sepolia
      provider: () => {
        if (!mnemonic || !web3ProviderUrl) {
          console.error(
            "MNEMONIC or WEB3_PROVIDER_URL not set in .env file. Cannot deploy to Sepolia."
          );
          process.exit(1);
        }
        return new HDWalletProvider(mnemonic, web3ProviderUrl);
      },
      network_id: 11155111, // Sepolia's network ID
      confirmations: 2, // # of confirmations to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run if it's a public network
    },
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.26", // Ensure this matches your contract's pragma version
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200,
        },
        // evmVersion: "byzantium", // You might want to remove or update this for newer Solidity versions/networks
      },
    },
  },
};
