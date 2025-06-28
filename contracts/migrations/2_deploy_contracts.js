// contracts/migrations/2_deploy_contracts.js

const MedicineTracker = artifacts.require("MedicineTracker");

module.exports = function (deployer) {
  deployer.deploy(MedicineTracker);
};

