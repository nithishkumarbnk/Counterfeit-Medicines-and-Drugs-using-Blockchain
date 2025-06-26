// contracts/truffle-config.js

const path = require("path");

module.exports = {
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0", // Fetch exact version from solc-bin (or use `pragma`)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200,
        },
        evmVersion: "byzantium",
      },
    },
  },

  // Output compiled contracts to a shared build folder at the project root
  contracts_build_directory: path.resolve(__dirname, "./build/contracts"),

  // Networks configuration
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Ganache default port
      network_id: "*", // Any network (default: none)
    },
    // You can add other networks here (e.g., testnets, mainnet)
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled: false to enabled: true
  //
  // db: {
  //   enabled: false
  // }
};
