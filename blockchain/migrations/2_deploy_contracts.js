const DrugTracking = artifacts.require("DrugTracking");

module.exports = function (deployer) {
  deployer.deploy(DrugTracking);
};
