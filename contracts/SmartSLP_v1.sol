// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";


/**
 * @dev Simple Ledger Protocol inspired implementation of the {IERC20} interface.
 *
 * This implementation is derived from the excellent OpenZepellin contracts
 * with SLP-style supply mechanism.
 *
 * Tokens are created with an initial supply to the token creator. Later, the
 * creator may choose to mint more tokens, pass the ability to mint to another
 * address, and stop the ability to mint additional tokens.
 *
 * Minting is performed using the {mint} function, this may only be performed
 * by the owner of the token.
 *
 * Ability to mint can be controlled using the methods:
 * {transferOwnership} and {renounceOwnership}
 * 
 * Users are also able to burn tokens using the {burn} method. 
 * Burning can also be accomplished with the allowance system using {burnFor}.
 * See {ERC20-_burn} and {ERC20-allowance}
 *
 * Additionally, {documentUri} and {documentHash} may be set during construction 
 * and retrieved later. These may be used to associate additional information
 * with the token.
 *
 * This contract also includes the non-standard {decreaseAllowance}
 * and {increaseAllowance} functions which have been added by the openzeppelin
 * team to mitigate the well-known issues around setting allowances.
 * See {IERC20-approve}.
 */
contract SmartSLP_v1 is ERC20Burnable, Ownable {
    string private _documentUri;
    bytes32 private _documentHash;
    uint8 private _decimals;

   /**
     * @dev Sets the values for {name}, {symbol}, {documentUri},
     * {documentHash} and {decimals} and mints {initialQty}.
     *
     * All of these values are immutable: they can only be set once during
     * construction.

     * You will be able to mint additional tokens using the {mint} function
     * as long as you do not transfer or revoke ownership.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory documentUri_,
        bytes32 documentHash_,
        uint8 decimals_,
        uint256 initialQty_
    ) ERC20(name_, symbol_) {
        require(decimals_ <= 18, "SLP: decimals too large");
        _documentUri = documentUri_;
        _documentHash = documentHash_;
        _decimals = decimals_;
        _mint(msg.sender, initialQty_);
    }

    /**
     * @dev Returns the documentUri of the token.
     */
    function documentUri() public view virtual returns (string memory) {
        return _documentUri;
    }

    /**
     * @dev Returns the documentHash of the token.
     */
    function documentHash() public view virtual returns (bytes32) {
        return _documentHash;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /** @dev Creates `amount` tokens and assigns them to `recipient`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function mint(address recipient, uint256 amount) public virtual onlyOwner returns (bool) {
        _mint(recipient, amount);
        return true;
    }
}
