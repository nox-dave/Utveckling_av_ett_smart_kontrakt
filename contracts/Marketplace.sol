// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Marketplace {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }
}
