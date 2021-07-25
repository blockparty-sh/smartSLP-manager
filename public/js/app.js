const App = {
    web3Provider: null,
    contracts: {},

    init: async function() {
        if (typeof web3 !== 'undefined') {
            this.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            this.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
            web3 = new Web3(this.web3Provider);
        }

        const response = await fetch('SmartSLP_v1.json');
        const SmartSLP_v1Artifact = await response.json();

        this.contracts.SmartSLP_v1 = TruffleContract(SmartSLP_v1Artifact);
        this.contracts.SmartSLP_v1.setProvider(this.web3Provider);

        return this.bindEvents();
    },

    bindEvents: function() {
        const that = this;

        document.querySelector('#modal-close').addEventListener('click', function() {
            document.querySelector('body').classList.remove('modal-open');
        });

        const createTokenForm = document.querySelector('form#createTokenForm');
        const createTokenData = document.querySelector('#createTokenData');
        createTokenForm.addEventListener('submit', async (evt) => {
            evt.preventDefault();

            const tokenName    = createTokenForm.querySelector('#createToken_tokenName').value;
            const tokenSymbol  = createTokenForm.querySelector('#createToken_tokenSymbol').value;
            const documentUri  = createTokenForm.querySelector('#createToken_documentUri').value;
            let   documentHash = createTokenForm.querySelector('#createToken_documentHash').value;
            const decimals     = createTokenForm.querySelector('#createToken_decimals').value;
            const initialQty   = createTokenForm.querySelector('#createToken_initialQty').value;

            const tokenImage = 'http://placekitten.com/200/300';

            if (documentHash.length === 0) {
                documentHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            } else {
                const re = /^[0-9a-f]{64}$/g;
                if (! documentHash.match(re)) {
                    window.alert('documentHash must be 64 hex characters');
                    return false;
                }

                documentHash = '0x' + documentHash;
            }

            const contract = await that.deploy(
                tokenName,
                tokenSymbol,
                documentUri,
                documentHash,
                decimals,
                initialQty,
                tokenImage,
            );

            that.showModal('Token Created', `
                Make sure to save your contract address:
                <br>
                <pre>${contract.address}</pre>
                <br>
                <a href="#${contract.transactionHash}">View on Explorer</a>
            `);

            manageTokenForm.querySelector('#manageToken_contractAddress').value = contract.address;

            that.reloadManageToken();

            return;
        });

        const manageTokenForm = document.querySelector('form#manageTokenForm');
        manageTokenForm.addEventListener('submit', async (evt) => {
            evt.preventDefault();
            that.reloadManageToken();
        });
    },

    showModal: function(title, content) {
        document.getElementById('modal-title').innerHTML = title;
        document.getElementById('modal-text').innerHTML = content;

        document.querySelector('body').classList.add('modal-open');
    },

    reloadManageToken: async function() {
        const that = this;
        const tokenAddress = manageTokenForm.querySelector('#manageToken_contractAddress').value;

        const account = await this.getAccount();

        const tokenStatsData = document.querySelector('#tokenStatsData');
        const manageTokenData = document.querySelector('#manageTokenData');
        tokenStatsData.innerHTML = '';
        manageTokenData.innerHTML = '';

        const contract = await App.contracts.SmartSLP_v1.at(tokenAddress)

        const totalSupply = await contract.totalSupply();
        const owner       = await contract.owner();
        const balance     = await contract.balanceOf(account);

        const tokenName    = await contract.name();
        const tokenSymbol  = await contract.symbol();
        const documentUri  = await contract.documentUri();
        const documentHash = await contract.documentHash();
        const decimals     = await contract.decimals();

        const isOwner = owner === account;

        const tokenStatsTable = document.createElement('table');
        tokenStatsTable.id = 'tokenStatsTable';
        for (const [key, value] of Object.entries({
            totalSupply: totalSupply.toString(),
            owner,
            balance: balance.toString(),
            tokenName,
            tokenSymbol,
            documentUri,
            documentHash,
            decimals: decimals.toString(),
        })) {
            const tr = document.createElement('tr');

            const tdKey = document.createElement('td')
            tdKey.innerHTML = key;
            tr.appendChild(tdKey);

            const tdValue = document.createElement('td')
            tdValue.innerHTML = `<span class="breakable">${value}</span>`;
            tr.appendChild(tdValue);

            tokenStatsTable.appendChild(tr);
        }
        tokenStatsData.append(tokenStatsTable);

        function appendManageForm(form) {
            const section = document.createElement('section');
            section.appendChild(form);
            manageTokenData.appendChild(section);
        }

        {
            const burnForm = document.createElement('form');
            burnForm.id = 'burnForm';
            burnForm.innerHTML = `
                <h3>Burn Tokens</h3>

                <div>
                    <label for="burnForm_amount">Amount:</label>
                    <input type="number" id="burnForm_amount" value="0" min="0" max="${balance}">
                </div>

                <button type="submit">Burn</button>
            `;
            burnForm.addEventListener('submit', async (evt) => {
                evt.preventDefault();

                const amount = burnForm.querySelector('#burnForm_amount').value;

                const tx = await contract.burn(amount, {
                    from: account,
                });

                console.log(tx);

                that.reloadManageToken();
            });

            appendManageForm(burnForm);
        }

        {
            const mintForm = document.createElement('form');
            mintForm.id = 'mintForm';
            mintForm.innerHTML = `
                <h3>Mint Tokens</h3>

                <div>
                    <label for="mintForm_address">Address:</label>
                    <input type="text" id="mintForm_address" value="${account}">
                </div>

                <div>
                    <label for="mintForm_amount">Amount:</label>
                    <input type="number" id="mintForm_amount" value="1">
                </div>

                ${isOwner ? '<button type="submit">Mint</button>' : 'You are not owner'}
            `;
            if (isOwner) {
                mintForm.addEventListener('submit', async (evt) => {
                    evt.preventDefault();

                    const address = mintForm.querySelector('#mintForm_address').value;
                    const amount = mintForm.querySelector('#mintForm_amount').value;

                    const tx = await contract.mint(address, amount, {
                        from: account,
                    });

                    console.log(tx);
                    that.reloadManageToken();
                });
            }

            appendManageForm(mintForm);
        }

        {
            const transferOwnershipForm = document.createElement('form');
            transferOwnershipForm.id = 'transferOwnership';
            transferOwnershipForm.innerHTML = `
                <h3>Transfer Ownership</h3>
                
                <div>
                    <label for="transferOwnership_address">Address:</label>
                    <input type="text" id="transferOwnership_address" value="${account}">
                </div>

                ${isOwner ? '<button type="submit">Transfer Ownership</button>' : 'You are not owner'}
            `;
            if (isOwner) {
                transferOwnershipForm.addEventListener('submit', async (evt) => {
                    evt.preventDefault();

                    const address = transferOwnershipForm.querySelector('#transferOwnership_address').value;

                    const tx = await contract.transferOwnership(address, {
                        from: account,
                    });

                    console.log(tx);
                    that.reloadManageToken();
                });
            }

            appendManageForm(transferOwnershipForm);
        }

        {
            const renounceOwnershipForm = document.createElement('form');
            renounceOwnershipForm.id = 'renounceOwnershipForm';
            renounceOwnershipForm.innerHTML = `
                <h3>Renounce Ownership</h3>
                ${isOwner ? '<button type="submit">Renounce Ownership</button>' : 'You are not owner'}
            `;
            if (isOwner) {
                renounceOwnershipForm.addEventListener('submit', async (evt) => {
                    evt.preventDefault();

                    const tx = await contract.renounceOwnership({
                        from: account,
                    });

                    console.log(tx);
                    that.reloadManageToken();
                });
            }

            appendManageForm(renounceOwnershipForm);
        }
    },

    getAccount: async function() {
        const that = this;

        return new Promise((resolve, reject) => {
            web3.eth.getAccounts(async (error, accounts) => {
                if (error) {
                    reject(error);
                }

                if (accounts.length === 0) {
                    await ethereum.request({ method: 'eth_requestAccounts' });
                    return await that.getAccount();
                }


                resolve(accounts[0]);
            });
        });
    },

    deploy: async function(
        tokenName,
        tokenSymbol, 
        documentUri,
        documentHash,
        decimals,
        initialQty,
        tokenImage,
    ) {
        try {
            const contract = await this.deployContract(
                tokenName,
                tokenSymbol, 
                documentUri,
                documentHash,
                decimals,
                initialQty,
            );

            await this.forceWatchAsset(contract.address, tokenSymbol, decimals, tokenImage);

            return contract;
        } catch (e) {
            console.log(e);
        }
    },
    
    deployContract: async function(
        tokenName,
        tokenSymbol, 
        documentUri,
        documentHash,
        decimals,
        initialQty,
    ) {
        const account = await this.getAccount();

        const contract = await this.contracts.SmartSLP_v1.new(
            tokenName,
            tokenSymbol,
            documentUri,
            documentHash,
            decimals,
            initialQty,
            {
                from: account,
            }
        );

        return contract;
    },

    forceWatchAsset: async function(contractAddress, tokenSymbol, decimals, tokenImage) {
        while (! await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: contractAddress,
                    symbol: tokenSymbol,
                    decimals,
                    image: tokenImage,
                },
            },
        }));
    },
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
