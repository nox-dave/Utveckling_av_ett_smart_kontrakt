// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Marketplace {
    error NotOwner();
    error NotAdmin();

    address public owner;
    mapping(address => bool) public admins;

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    event GrantAdmin(address indexed account);
    event RevokeAdmin(address indexed account);

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

    function grantAdmin(address account) external onlyOwner {
        admins[account] = true;
        emit GrantAdmin(account);
    }

    function revokeAdmin(address account) external onlyOwner {
        admins[account] = false;
        emit RevokeAdmin(account);
    }
}
