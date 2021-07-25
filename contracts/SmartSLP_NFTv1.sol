// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "openzeppelin-solidity/contracts/utils/Context.sol";
import "openzeppelin-solidity/contracts/utils/Counters.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract SmartSLP_NFT is Context, ERC721Enumerable, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    string private _documentUri;
    bytes32 private _documentHash;
    Counters.Counter private _tokenIdTracker;

    address[] private  _nftChildren;
    address private _nftParent;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory documentUri_,
        bytes32 documentHash_,
        address nftParent_
    ) ERC721(name_, symbol_) {
        _documentUri = documentUri_;
        _documentHash = documentHash_;
        _nftParent = nftParent_;
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

    function mint(address to) public virtual onlyOwner returns (bool) {
        _mint(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
        return true;
    }

    function mintChild(
        string memory name_,
        string memory symbol_,
        string memory documentUri_,
        bytes32 documentHash_
    ) public virtual onlyOwner returns (bool) {
        SmartSLP_NFT_Supplier supplier = SmartSLP_NFT_Supplier(_nftParent);
        _nftChildren.push(address(supplier.makeNFT(name_, symbol_, documentUri_, documentHash_)));
        return true;
    }

    function isNftParent() public view virtual returns (bool) {
        return _nftParent != 0x0;
    }

    function nftParent() public view virtual returns (address) {
        return _nftParent;
    }

    function nftChildren() public view virtual returns (address[] memory) {
        return _nftChildren;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721, ERC721Enumerable)
    returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

abstract contract SmartSLP_NFT_Supplier {
    function makeNFT(
        string memory name_,
        string memory symbol_,
        string memory documentUri_,
        bytes32 documentHash_
    ) public virtual returns(SmartSLP_NFT);
}

contract SmartSLP_NFT_Maker {
    function makeNFT(
        string memory name_,
        string memory symbol_,
        string memory documentUri_,
        bytes32 documentHash_
    ) public returns(SmartSLP_NFT) {
        return new SmartSLP_NFT(
            name_,
            symbol_,
            documentUri_,
            documentHash_,
            address(this)
        );
    }
}

