// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Marketplace {
    error NotOwner();
    error NotAdmin();

    address public owner;

    uint256 public nextListingId = 1;
    uint256 public nextDealId = 1;

    mapping(address => bool) public admins;
    mapping(address => uint) public balances;
    mapping(uint256 => Deal) public deals;
    mapping(address => uint256[]) public buyerDeals; // För att spåra deals
    mapping(uint256 => uint256[]) public sellerDeals; // För att spåra deals
    mapping(uint256 => uint256) public lockedFunds;
    mapping(uint256 => Listing) public listings;

    struct Deal {
        uint256 dealId;
        uint256 listingId;
        address seller;
        address buyer;
        uint256 amount;
        DealStatus status;
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
    event ListingCreated();
    event DealCreated(address indexed sender, uint256 amount);
    event ItemShipped();
    event DealCompleted();
    event DealCancelled();
    event DisputeRaised();
    event DisputeResolved();
    event FundsWithdrawn();

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

    function listingItem(
        string calldata title,
        string calldata description,
        uint256 price
    ) public {
        require(price > 0, "Price must be greater than 0");

        uint256 currentListingId = nextListingId;
        nextListingId++;

        listings[currentListingId] = Listing(
            currentListingId,
            msg.sender,
            title,
            description,
            price,
            true,
            block.timestamp
        );

        emit ListingCreated();
    }

    function purchaseItem(
        uint256 listingId
    ) public payable validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(msg.value == listing.price, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy your own item");

        // Uppdatera state innan external interaktioner
        uint256 currentDealId = nextDealId;
        nextDealId++;

        deals[currentDealId] = Deal({
            dealId: currentDealId,
            listingId: listingId,
            seller: listing.seller,
            buyer: msg.sender,
            amount: msg.value,
            status: DealStatus.PENDING,
            createdAt: block.timestamp,
            shippedAt: 0
        });

        // Spåra deal för båda parter
        buyerDeals[msg.sender].push(currentDealId);
        sellerDeals[listingId].push(currentDealId);

        // Lås in pengarna
        lockedFunds[currentDealId] = msg.value;

        // Deaktivera listing (såld)
        listing.isActive = false;

        emit DealCreated(msg.sender, msg.value);
    }

    function markAsShipped(
        uint256 dealId
    ) public validDeal(dealId) onlySeller(dealId) {
        require(
            deals[dealId].status == DealStatus.PENDING,
            "Deal must be pending"
        );

        deals[dealId].status = DealStatus.SHIPPED;
        deals[dealId].shippedAt = block.timestamp;

        emit ItemShipped();
    }
}
