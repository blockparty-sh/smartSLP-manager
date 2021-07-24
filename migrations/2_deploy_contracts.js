var SmartSLP_V1 = artifacts.require("SmartSLP_v1");

module.exports = function(deployer) {
  deployer.deploy(
      SmartSLP_V1,
      "test token",
      "tt",
      "http://example.com",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      18,
      1000
  );
};
