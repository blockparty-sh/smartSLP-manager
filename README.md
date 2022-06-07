# smartSLP Token Manager

Token creation and management system for smartBCH, inspired by SLP and fully SEP20 compatible.

## Features

### Token Creation

This token creator makes tokens with similar functionality as SLP, with minting and burning capability and ability to store documentUri and documentHash. They are fully erc20 compliant.

### Token Management

A token created using this manager may be managed using it. It will not be able to manage tokens not created with this tool.

Just enter the contract address and you will be able to mint new tokens, burn your own tokens, pass minting ability to another address, and destroy minting capability.


## Hacking

You will want to install [ganache](https://www.trufflesuite.com/ganache) and configure [metamask](https://www.trufflesuite.com/tutorial#installing-and-configuring-metamask).

### Running locally

You can run this locally easily.

First `git clone` this repo.

Then install necessary deps:

`npm i`

Next run `npx truffle compile` to build the contracts.

Then to start the UI run `npm run dev`

### Custom Tokens

You can modify this for your own custom coded tokens to use it as a starting place for a token dashboard.

Just modify the contract, compile using `truffle compile` then `truffle deploy` and of course edit `public/js/app.js` to provide the additional features necessary for your token. Please share what you come up with in the [Fountainhead](https://t.me/fountainheadcash) development channel.
