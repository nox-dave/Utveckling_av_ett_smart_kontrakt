// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HelloWorld {
    string public message;

    constructor(string memory _initialMessage) {
        message = _initialMessage;
    }

    function setMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}