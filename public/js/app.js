const App = {
    web3Provider: null,
    contracts: {},
    transactionParams: {
        gasPrice: "10000000000", // 10 gwei
    },

    init: async function() {
        if (typeof web3 === 'undefined') {
            this.showModal('Install MetaMask', `
                <p>
                This app requires MetaMask to be installed
                </p>

                <p>
                Download from <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn" target="_blank">Chrome Web Store</a>
                </p>

                <p>
                Download from <a href="https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/" target="_blank">Firefox Add-ons page</a>
                </p>
            `);
            this.web3Provider = new Web3.providers.HttpProvider('https://smartbch.fountainhead.cash/mainnet');
            web3 = new Web3(this.web3Provider);
        } else {
            this.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        }

        const response = await fetch('build/SmartSLP_v1.json');
        const SmartSLP_v1Artifact = await response.json();

        this.contracts.SmartSLP_v1 = TruffleContract(SmartSLP_v1Artifact);
        this.contracts.SmartSLP_v1.setProvider(this.web3Provider);

        // provide live update checking of selected network
        setInterval(async function() {
            const id = await web3.eth.net.getId();

            // smartbch
            if (id === 10000) {
                document.getElementById('incorrect-network').style.display = 'none';
                document.querySelectorAll('button').forEach((el) => el.disabled = false);
                document.querySelectorAll('input').forEach((el) => el.disabled = false);
            } else {
                document.getElementById('incorrect-network').style.display = 'initial';
                document.querySelectorAll('button').forEach((el) => el.disabled = true);
                document.querySelectorAll('input').forEach((el) => el.disabled = true);
            }
        }, 1000);

        return this.bindEvents();
    },

    // set up base page to listen to events
    bindEvents: function() {
        const that = this;

        document.querySelector('#modal-close').addEventListener('click', function() {
            document.querySelector('body').classList.remove('modal-open');
        });

        const createTokenForm = document.querySelector('form#createTokenForm');
        const manageTokenForm = document.querySelector('form#manageTokenForm');

        createTokenForm.addEventListener('submit', async (evt) => {
            evt.preventDefault();

            const tokenName    = createTokenForm.querySelector('#createToken_tokenName').value;
            const tokenSymbol  = createTokenForm.querySelector('#createToken_tokenSymbol').value;
            const documentUri  = createTokenForm.querySelector('#createToken_documentUri').value;
            let   documentHash = createTokenForm.querySelector('#createToken_documentHash').value;
            const decimals     = createTokenForm.querySelector('#createToken_decimals').value;
            const initialQty = new BigNumber(
                    createTokenForm.querySelector('#createToken_initialQty').value
                ).multipliedBy(new BigNumber(`1e${decimals}`))
                .toFixed();


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

            that.reloadManageToken(contract.address);

            return;
        });

        manageTokenForm.addEventListener('submit', async (evt) => {
            evt.preventDefault();
            const contractAddress = manageTokenForm.querySelector('#manageToken_contractAddress').value;
            that.reloadManageToken(contractAddress);
        });
    },

    // this can be used for error or information display
    showModal: function(title, content) {
        document.getElementById('modal-title').innerHTML = title;
        document.getElementById('modal-text').innerHTML = content;

        document.querySelector('body').classList.add('modal-open');
    },

    // this is used to reload/recreate the management panels
    // either called after tx that modifies the token
    // or when the manage token form is submitted with a contract address
    reloadManageToken: async function(contractAddress) {
        const that = this;

        const account = await this.getAccount();

        const tokenStatsData = document.querySelector('#tokenStatsData');
        const manageTokenData = document.querySelector('#manageTokenData');
        tokenStatsData.innerHTML = '';
        manageTokenData.innerHTML = '';

        const contract = await App.contracts.SmartSLP_v1.at(contractAddress)

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
            totalSupply: new BigNumber(totalSupply.toString()).div(`1e${decimals}`).toFixed(),
            owner,
            balance: new BigNumber(balance.toString()).div(`1e${decimals}`).toFixed(),
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


        // this can be used to add additional maintenance panels
        function createManager(formId, html, submitListenerFn) {
            const form = document.createElement('form');
            form.id = formId;
            form.innerHTML = html;
            form.addEventListener('submit', async (evt) => {
                evt.preventDefault();
                return submitListenerFn(evt);
            });

            const section = document.createElement('section');
            section.appendChild(form);
            manageTokenData.appendChild(section);
        }

        {
            const template = `
                <h3>Burn Tokens</h3>

                <div>
                    <label for="burnForm_amount">Amount:</label>
                    <input type="number" id="burnForm_amount" value="0" min="0" max="${balance}">
                </div>

                <button type="submit">Burn</button>
            `;

            createManager('burnForm', template, async (evt) => {
                const amount = new BigNumber(
                        burnForm.querySelector('#burnForm_amount').value
                    ).multipliedBy(new BigNumber(`1e${decimals}`))
                    .toFixed();

                const tx = await contract.burn(amount, {
                    ...that.transactionParams,
                    ...{
                        from: account,
                    },
                });

                console.log(tx);
                that.reloadManageToken(contractAddress);
            });
        }

        {
            const template = `
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

            createManager('mintForm', template, async (evt) => {
                if (isOwner) {
                    const address = mintForm.querySelector('#mintForm_address').value;
                    const amount = new BigNumber(
                        mintForm.querySelector('#mintForm_amount').value
                    ).multipliedBy(new BigNumber(`1e${decimals}`))
                    .toFixed();

                    const tx = await contract.mint(address, amount, {
                        ...that.transactionParams,
                        ...{
                            from: account,
                        },
                    });

                    console.log(tx);
                    that.reloadManageToken(contractAddress);
                }
            });
        }

        {
            const template = `
                <h3>Transfer Ownership</h3>
                
                <div>
                    <label for="transferOwnership_address">Address:</label>
                    <input type="text" id="transferOwnership_address" value="${account}">
                </div>

                ${isOwner ? '<button type="submit">Transfer Ownership</button>' : 'You are not owner'}
            `;

            createManager('transferOwnershipForm', template, async (evt) => {
                if (isOwner) {
                    const address = transferOwnershipForm.querySelector('#transferOwnership_address').value;

                    const tx = await contract.transferOwnership(address, {
                        ...that.transactionParams,
                        ...{
                            from: account,
                        },
                    });

                    console.log(tx);
                    that.reloadManageToken(contractAddress);
                }
            });
        }

        {
            const template = `
                <h3>Renounce Ownership</h3>
                ${isOwner ? '<button type="submit">Renounce Ownership</button>' : 'You are not owner'}
            `;

            createManager('renounceOwnershipForm', template, async (evt) => {
                if (isOwner) {
                    evt.preventDefault();

                    const tx = await contract.renounceOwnership({
                        ...that.transactionParams,
                        ...{
                            from: account,
                        },
                    });

                    console.log(tx);
                    that.reloadManageToken(contractAddress);
                }
            });
        }
    },

    // this will either get the first account or will request wallet to prompt for access
    // this should be used everywhere that getting an account is needed, in case the
    // wallet becomes disconnected during runtime.
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

    // handle the creation of a new token (when form is submitted)
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
    
    // creates transaction using truffle
    // wallet will ask permission to broadcast
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
                ...this.transactionParams,
                ...{
                    from: account,
                },
            }
        );

        return contract;
    },


    // will request wallet to ask user to add asset to track
    requestWalletToTrackAsset: async function(contractAddress, tokenSymbol, decimals, tokenImage) {
        return await ethereum.request({
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
        });
    },

    // continuosly request to add asset to wallet
    forceWatchAsset: async function(contractAddress, tokenSymbol, decimals, tokenImage) {
        while (! await this.requestWalletToTrackAsset(contractAddress, tokenSymbol, decimals, tokenImage));
    },
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
