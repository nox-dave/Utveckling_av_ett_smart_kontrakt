// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Marketplace {
    error NotOwner();
    error NotAdmin();

    address public owner;

    uint public itemCount;
    uint256 public nextListingId = 1;
    uint256 public nextDealId = 1;

    mapping(address => bool) public admins;
    mapping(address => uint) public balances;
    mapping(uint => Item) public items;

    mapping(uint256 => Deal) public deals;
    mapping(address => uint256[]) public buyerDeals;
    mapping(uint256 => uint256[]) public sellerDeals;
    mapping(uint256 => uint256) public lockedFunds;
    mapping(uint256 => Listing) public listings;

    struct Item {
        uint id;
        address owner;
        string title;
        bool forSale;
    }

    struct Deal {
        uint256 dealId;
        uint256 listingId;
        address seller;
        address buyer;
        uint256 amount;
        bool isActive;
        uint256 createdAt;
        uint256 shippedAt;
    }

    struct Listing {
        uint256 listingId;
        address seller;
        string title;
        string description;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    event GrantAdmin(address indexed account);
    event RevokeAdmin(address indexed account);

    enum DealStatus {
        PENDING,
        SHIPPED,
        COMPLETED,
        CANCELLED,
        DISPUTED, // Tvist pågår
        RESOLVED // Tvist löst av admin
    }

    fallback() external payable {}

    receive() external payable {}

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert NotAdmin();
        _;
    }

    // Är listing aktiv och existerar den?

    modifier validListing(uint256 listingId) {
        require(listingId < nextListingId, "Listing doesn't exist");
        require(listings[listingId].isActive, "Listing not active");
        _;
    }

    modifier validDeal(uint256 dealId) {
        require(dealId < nextDealId, "Deal doesn't exist");
        _;
    }

    modifier onlySeller(uint256 dealId) {
        require(deals[dealId].seller == msg.sender, "Only seller");
        _;
    }

    modifier onlyBuyer(uint256 dealId) {
        require(deals[dealId].buyer == msg.sender, "Only buyer");
        _;
    }

    function grantAdmin(address account) external onlyOwner {
        admins[account] = true;
        emit GrantAdmin(account);
    }

    function revokeAdmin(address account) external onlyOwner {
        admins[account] = false;
        emit RevokeAdmin(account);
    }
}
