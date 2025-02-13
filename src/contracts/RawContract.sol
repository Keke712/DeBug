// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

// Contrat d'implémentation (logique)
contract BountyDepositLogic {
    address public companyAddress;
    address public recipientAddress;
    uint public bountyAmount;
    bool public recipientValidated;
    bool private initialized;
    
    event DepositReceived(address sender, uint amount);
    event RecipientValidated(address recipient);
    event BountyReleased(address recipient, uint amount);

    // Prevent multiple initializations
    modifier initializer() {
        require(!initialized, "Already initialized");
        _;
        initialized = true;
    }

    function initialize(address _companyAddress) external payable initializer {
        require(_companyAddress != address(0), "Invalid company address");
        companyAddress = _companyAddress;
        bountyAmount = msg.value;
        recipientValidated = false;
        emit DepositReceived(companyAddress, bountyAmount);
    }

    modifier onlyCompany() {
        require(msg.sender == companyAddress, "Only company can call");
        _;
    }

    modifier fundsDeposited() {
        require(address(this).balance > 0, "No funds deposited");
        _;
    }

    modifier recipientNotValidated() {
        require(!recipientValidated, "Recipient already validated");
        _;
    }

    modifier recipientIsValidated() {
        require(recipientValidated, "Recipient not validated yet");
        _;
    }

    function validateRecipient(address _recipientAddress) 
        external 
        onlyCompany 
        recipientNotValidated 
        fundsDeposited 
    {
        require(_recipientAddress != address(0), "Invalid recipient address");
        recipientAddress = _recipientAddress;
        recipientValidated = true;
        emit RecipientValidated(_recipientAddress);
    }

    function releaseBounty() 
        external 
        onlyCompany 
        recipientIsValidated 
        fundsDeposited 
    {
        require(recipientAddress != address(0), "Invalid recipient address");
        uint amountToRelease = address(this).balance;
        
        (bool success, ) = recipientAddress.call{value: amountToRelease}("");
        require(success, "Transfer failed");
        
        emit BountyReleased(recipientAddress, amountToRelease);
    }

    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }

    function getRecipientAddress() external view returns (address) {
        return recipientAddress;
    }

    function isRecipientValidated() external view returns (bool) {
        return recipientValidated;
    }
}

// Factory pour créer des clones
contract BountyFactory {
    using Clones for address;
    
    address public immutable implementation;
    event BountyCreated(address bountyContract, address company, uint amount);
    
    constructor() {
        implementation = address(new BountyDepositLogic());
    }
    
    function createBounty() external payable returns (address) {
        require(msg.value > 0, "Must send ETH");
        address clone = implementation.clone();
        BountyDepositLogic(payable(clone)).initialize{value: msg.value}(msg.sender);
        emit BountyCreated(clone, msg.sender, msg.value);
        return clone;
    }

    // Optional: Get implementation address
    function getImplementation() external view returns (address) {
        return implementation;
    }
}