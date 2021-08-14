module.exports = {
  contracts_build_directory: "./public/build",
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",
    }
  },
  compilers: {
    solc: {
      version: "0.8.3",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  }
};
