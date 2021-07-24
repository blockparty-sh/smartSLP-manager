var SmartSLP_V1 = artifacts.require("SmartSLP_V1");

module.exports = function(deployer) {
  deployer.deploy(SmartSLP_V1, "test 2", "t2", "documenturi", Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), 18, 1000);
};
