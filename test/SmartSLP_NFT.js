const SmartSLP_v1 = artifacts.require("SmartSLP_v1");
const truffleAssert = require('truffle-assertions');

/// Properties

contract("SmartSLP_v1", async (accounts) => {
    it("should return the name", async () => {
        const instance = await SmartSLP_v1.deployed();
        const v = await instance.name();
        assert.equal(v, 'test token');
    });

    it("should return the symbol", async () => {
        const instance = await SmartSLP_v1.deployed();
        const v = await instance.symbol();
        assert.equal(v, 'tt');
    });

    it("should return the documentUri", async () => {
        const instance = await SmartSLP_v1.deployed();
        const v = await instance.documentUri();
        assert.equal(v, 'http://example.com');
    });

    it("should return the documentHash", async () => {
        const instance = await SmartSLP_v1.deployed();
        const v = await instance.documentHash();
        assert.equal(v, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });

    it("should return the decimals", async () => {
        const instance = await SmartSLP_v1.deployed();
        const v = await instance.decimals();
        assert.equal(v.toString(), 18);
    });
});

/// Mint

contract("SmartSLP_v1", async (accounts) => {
    it("should be successful mint by owner", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];
        const result = await instance.mint(recv, 100, {
            from: accounts[0],
        });
        truffleAssert.eventEmitted(result, 'Transfer', {
            from:   '0x0000000000000000000000000000000000000000',
            to:     recv,
            value:  web3.utils.toBN(100),
        });
    });
});

contract("SmartSLP_v1", async (accounts) => {
    it("should increase totalSupply on successful mint", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];
        const result = await instance.mint(recv, 100, {
            from: accounts[0],
        });
        truffleAssert.eventEmitted(result, 'Transfer', {
            from:   '0x0000000000000000000000000000000000000000',
            to:     recv,
            value:  web3.utils.toBN(100),
        });

        const totalSupply = await instance.totalSupply();
        assert.equal(totalSupply.toString(), '1100');
    });
});

contract("SmartSLP_v1", async (accounts) => {
    it("should increase receivers balance on successful mint", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];
        const result = await instance.mint(recv, 100, {
            from: accounts[0],
        });
        truffleAssert.eventEmitted(result, 'Transfer', {
            from:   '0x0000000000000000000000000000000000000000',
            to:     recv,
            value:  web3.utils.toBN(100),
        });

        const recvBalance = await instance.balanceOf(recv);
        assert.equal(recvBalance.toString(), '100');
    });
});

contract("SmartSLP_v1", async (accounts) => {
    it("should be failed mint by non-owner", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];
        await truffleAssert.reverts(instance.mint(recv, 100, {
            from: accounts[1],
        }));

        const totalSupply = await instance.totalSupply();
        assert.equal(totalSupply.toString(), '1000');

        const recvBalance = await instance.balanceOf(recv);
        assert.equal(recvBalance.toString(), '0');
    });
});

/// Renounce ownership

contract("SmartSLP_v1", async (accounts) => {
    it("should be able to renounce ownership", async () => {
        const instance = await SmartSLP_v1.deployed();
        const result = await instance.renounceOwnership({
            from: accounts[0],
        });

        const owner = await instance.owner();
        assert.equal(owner, '0x0000000000000000000000000000000000000000');
    });
});

contract("SmartSLP_v1", async (accounts) => {
    it("should be unable to renounce ownership twice", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];

        await instance.renounceOwnership({
            from: accounts[0],
        });

        await truffleAssert.reverts(instance.transferOwnership(recv, {
            from: accounts[0],
        }));
    });
});

/// Transfer ownership

contract("SmartSLP_v1", async (accounts) => {
    it("should be able to transfer ownership", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];
        const result = await instance.transferOwnership(recv, {
            from: accounts[0],
        });

        const owner = await instance.owner();
        assert.equal(owner, recv);
    });
});

contract("SmartSLP_v1", async (accounts) => {
    it("should be unable to transfer ownership once renounced", async () => {
        const instance = await SmartSLP_v1.deployed();
        const recv = accounts[2];

        await instance.renounceOwnership({
            from: accounts[0],
        });

        await truffleAssert.reverts(instance.transferOwnership(recv, {
            from: accounts[0],
        }));
    });
});

/// Burn

contract("SmartSLP_v1", async (accounts) => {
    it("should be successful burn by owner", async () => {
        const instance = await SmartSLP_v1.deployed();
        const result = await instance.burn(100, {
            from: accounts[0],
        });
        truffleAssert.eventEmitted(result, 'Transfer', {
            from:  accounts[0],
            to:    '0x0000000000000000000000000000000000000000',
            value: web3.utils.toBN(100),
        });
    });
});

contract("SmartSLP_v1", async (accounts) => {
    it("should be burn due to lack of funds", async () => {
        const instance = await SmartSLP_v1.deployed();
        await truffleAssert.reverts(instance.burn(1100, {
            from: accounts[0],
        }));
    });
});

