var TutorialToken = artifacts.require("TutorialToken");

module.exports = function(deployer) {
  deployer.deploy(TutorialToken, "test 2", "t2", "documenturi", Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), 18, 1000);
};
