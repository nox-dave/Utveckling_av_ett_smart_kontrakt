// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Marketplace {
    error NotOwner();
    error NotAdmin();
    error InvalidPrice();
    error DealNotPending();
    error DealNotShipped();
    error CannotBuyOwnItem();
    error DealNotDisputed();
    error FailedToSendEther();

    address public owner;

    uint256 public nextListingId = 1;
    uint256 public nextDealId = 1;

    bool private locked;

    mapping(address => bool) public admins;
    mapping(address => uint) public balances;
    mapping(uint256 => Deal) public deals;
    mapping(address => uint256[]) public buyerDeals; // För att spåra deals
    mapping(uint256 => uint256[]) public sellerDeals; // För att spåra deals
    mapping(uint256 => uint256) public lockedFunds;
    mapping(uint256 => Listing) public listings;

    // För köparen
    struct Deal {
        /*
        Gas-optimisering: Packeterar variabler in i 'slots'. Originellt 8 storage slots, men blir nu 3 storage slots.
        */
        address seller;
        address buyer;
        uint128 amount; // Gas-optimisering: Ändrar uint256 till uint128
        uint64 createdAt; // Gas-optimisering: Ändrar uint256 till uint64
        uint32 dealId; // Gas-optimisering: Ändrar uint256 till uint32
        uint32 listingId; // Gas-optimisering: Ändrar uint256 till uint32
        uint64 shippedAt; // Gas-optimisering: Ändrar uint256 till uint64
        DealStatus status;
    }

    // För säljaren
    /*
    Gas-optimisering: Packeterar variabler in i 'slots' istället för slumpmässig placering.
    */
    struct Listing {
        address seller;
        bool isActive;
        uint32 listingId;
        uint64 createdAt;
        uint128 price;
        string title;
        string description;
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

    modifier onlyBuyerOrSeller(uint256 dealId) {
        require(
            deals[dealId].buyer == msg.sender ||
                deals[dealId].seller == msg.sender,
            "Only buyer or seller"
        );
        _;
    }

    // Egen Reentrancy Guard (Open-Zeppelin Reentrancy Guard bättre men gjorde min egen som proof of concept)
    modifier lock() {
        require(!locked, "locked");
        locked = true;
        _;
        locked = false;
    }

    function grantAdmin(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        admins[account] = true;
        emit GrantAdmin(account);
    }

    function revokeAdmin(address account) external onlyOwner {
        admins[account] = false;
        emit RevokeAdmin(account);
    }

    /*
        Gas-optimisering: Använder calldata istället för memory
        */
    function listingItem(
        string calldata title,
        string calldata description,
        uint256 price
    ) public {
        if (price == 0) revert InvalidPrice(); // Gas-optimering: Använda Custom Error istället för string sparar gas
        if (bytes(title).length == 0) revert("Empty title not allowed");

        uint256 currentListingId = nextListingId;
        unchecked {
            // Gas-optimisering / säkerhet: Använder 'unchecked' förhindrar overflow
            nextListingId++;
        }

        listings[currentListingId] = Listing(
            msg.sender,
            true,
            uint32(currentListingId),
            uint64(block.timestamp),
            uint128(price),
            title,
            description
        );

        emit ListingCreated();
    }

    function purchaseItem(
        uint256 listingId
    ) public payable validListing(listingId) {
        Listing storage listing = listings[listingId];
        if (msg.value != listing.price) revert InvalidPrice();
        if (msg.sender == listing.seller) revert CannotBuyOwnItem();

        // Uppdatera state innan external interaktioner
        uint256 currentDealId = nextDealId;
        unchecked {
            // Gas-optimisering / säkerhet: Använder 'unchecked' förhindrar overflow
            nextDealId++;
        }

        deals[currentDealId] = Deal({
            seller: listing.seller,
            buyer: msg.sender,
            amount: uint128(msg.value),
            createdAt: uint64(block.timestamp),
            dealId: uint32(currentDealId),
            listingId: uint32(listingId),
            status: DealStatus.PENDING,
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
        if (deals[dealId].status != DealStatus.PENDING) revert DealNotPending();

        deals[dealId].status = DealStatus.SHIPPED;
        deals[dealId].shippedAt = uint64(block.timestamp);

        emit ItemShipped();
    }

    function confirmReceipt(
        uint256 dealId
    ) public validDeal(dealId) onlyBuyer(dealId) lock {
        if (deals[dealId].status != DealStatus.SHIPPED) revert DealNotShipped();

        deals[dealId].status = DealStatus.COMPLETED;

        uint256 amount = lockedFunds[dealId];
        lockedFunds[dealId] = 0;

        balances[deals[dealId].seller] += amount;

        emit DealCompleted();
    }

    function cancelDeal(
        uint256 dealId
    ) public validDeal(dealId) onlyBuyerOrSeller(dealId) lock {
        if (deals[dealId].status != DealStatus.PENDING) revert DealNotPending();

        deals[dealId].status = DealStatus.CANCELLED;

        uint256 amount = lockedFunds[dealId];
        lockedFunds[dealId] = 0;

        balances[deals[dealId].buyer] += amount;

        emit DealCancelled();
    }

    function raiseDispute(
        uint256 dealId
    ) public validDeal(dealId) onlyBuyerOrSeller(dealId) {
        if (
            deals[dealId].status != DealStatus.PENDING &&
            deals[dealId].status != DealStatus.SHIPPED
        ) revert DealNotPending();

        deals[dealId].status = DealStatus.DISPUTED;

        emit DisputeRaised();
    }

    function resolveDispute(
        uint256 dealId,
        bool favorSeller
    ) public validDeal(dealId) onlyAdmin lock {
        if (deals[dealId].status != DealStatus.DISPUTED)
            revert DealNotDisputed();

        deals[dealId].status = DealStatus.RESOLVED;

        uint256 amount = lockedFunds[dealId];
        lockedFunds[dealId] = 0;

        if (favorSeller) {
            balances[deals[dealId].seller] += amount;
        } else {
            balances[deals[dealId].buyer] += amount;
        }

        emit DisputeResolved();
    }

    function withdrawBalance() public lock {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "No balance to withdraw");

        balances[msg.sender] = 0;
        assert(balances[msg.sender] == 0);
        emit FundsWithdrawn();

        (bool sent, ) = payable(msg.sender).call{value: bal}("");
        if (!sent) revert FailedToSendEther();
    }
}
