# smartBCH Token Manager

## Features

### Token Creation

This token creator makes tokens with similar functionality as SLP, with minting and burning capability and ability to store documentUri and documentHash. They are fully erc20 compliant.

### Token Management

A token created using this manager may be managed using it :D 

Just enter the contract address and you will be able to mint new tokens, burn your own tokens, pass minting ability to another address, and destroy minting capability.


## Hacking

You can run this locally easily:

First `git clone` this repo.

Then install necessary deps

`npm i`

Next run `npm run dev`

### Custom Tokens

You can modify this for your own custom tokens, as in use it as a starting place for a token dashboard.

You will want to install [ganache](https://www.trufflesuite.com/ganache)

Just modify the contract, compile using `truffle compile` then `truffle deploy`. 
