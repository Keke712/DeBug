pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract BountyDepositLogic {
    address public companyAddress;
    address public recipientAddress;
    uint public bountyAmount;
    bool public recipientValidated;
    bool private initialized;
    
    bytes32 public title;
    bytes32 public description;
    bytes32[] public tags;
    bytes32 public website;

    enum BountyStatus { Active, Completed }
    BountyStatus public status;
    
    event DepositReceived(address sender, uint amount);
    event RecipientValidated(address recipient);
    event BountyReleased(address recipient, uint amount);
    event MetadataUpdated(bytes32 title, bytes32 description, bytes32[] tags, bytes32 website);
    event BountyCompleted(address recipient, uint amount);

    function _checkInitializer() internal {
        require(!initialized, "Already initialized");
        initialized = true;
    }

    function _checkOnlyCompany() internal view {
        require(msg.sender == companyAddress, "Only company can call");
    }

    function _checkFundsDeposited() internal view {
        require(address(this).balance > 0, "No funds deposited");
    }

    function _checkRecipientNotValidated() internal view {
        require(!recipientValidated, "Recipient already validated");
    }

    function _checkRecipientIsValidated() internal view {
        require(recipientValidated, "Recipient not validated yet");
    }

    function _checkActive() internal view {
        require(status == BountyStatus.Active, "Bounty is already completed");
    }

    function initialize(
        address _companyAddress,
        bytes32 _title,
        bytes32 _description,
        bytes32[] memory _tags,
        bytes32 _website
    ) external payable {
        _checkInitializer();
        require(_companyAddress != address(0), "Invalid company address");
        require(_title != bytes32(0), "Title cannot be empty");
        
        companyAddress = _companyAddress;
        bountyAmount = msg.value;
        recipientValidated = false;
        
        title = _title;
        description = _description;
        tags = _tags;
        website = _website;
        
        status = BountyStatus.Active;

        emit DepositReceived(companyAddress, bountyAmount);
        emit MetadataUpdated(title, description, tags, website);
    }

    function validateRecipient(address _recipientAddress) 
        external 
    {
        _checkOnlyCompany();
        _checkRecipientNotValidated();
        _checkFundsDeposited();
        require(_recipientAddress != address(0), "Invalid recipient address");
        recipientAddress = _recipientAddress;
        recipientValidated = true;
        emit RecipientValidated(_recipientAddress);
    }

    function releaseBounty() 
        external 
    {
        _checkOnlyCompany();
        _checkRecipientIsValidated();
        _checkFundsDeposited();
        require(recipientAddress != address(0), "Invalid recipient address");
        uint amountToRelease = address(this).balance;
        
        (bool success, ) = recipientAddress.call{value: amountToRelease}("");
        require(success, "Transfer failed");
        
        emit BountyReleased(recipientAddress, amountToRelease);
    }

    function getBountyMetadata() external view returns (
        bytes32 _title,
        bytes32 _description,
        bytes32[] memory _tags,
        bytes32 _website
    ) {
        return (title, description, tags, website);
    }

    function getTagsCount() external view returns (uint) {
        return tags.length;
    }

    function getTag(uint index) external view returns (bytes32) {
        require(index < tags.length, "Tag index out of bounds");
        return tags[index];
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

    function confirmBugReport(address reportAddress) 
        external 
    {
        _checkOnlyCompany();
        _checkFundsDeposited();
        _checkActive();
        
        uint amountToRelease = address(this).balance;
        (bool success, ) = reportAddress.call{value: amountToRelease}(
            abi.encodeWithSignature("confirmReport()")
        );
        require(success, "Report confirmation failed");
        
        status = BountyStatus.Completed;
        emit BountyCompleted(reportAddress, amountToRelease);
    }

    function cancelBugReport(address reportAddress) 
        external 
    {
        _checkOnlyCompany();
        _checkActive();
        (bool success, ) = reportAddress.call(
            abi.encodeWithSignature("cancelReport()")
        );
        require(success, "Report cancellation failed");
    }
}

contract BountyFactory {
    using Clones for address;
    
    address public immutable implementation;
    address[] public allBounties;
    mapping(address => address[]) public bountiesByCompany;
    
    event BountyCreated(
        address indexed bountyContract, 
        address indexed company, 
        uint amount,
        bytes32 title,
        bytes32[] tags
    );
    
    constructor() {
        implementation = address(new BountyDepositLogic());
    }
    
    function createBounty(
        bytes32 _title,
        bytes32 _description,
        bytes32[] memory _tags,
        bytes32 _website
    ) external payable returns (address) {
        require(msg.value > 0, "Must send ETH");
        require(_title != bytes32(0), "Title cannot be empty");
        
        address clone = implementation.clone();
        BountyDepositLogic(payable(clone)).initialize{value: msg.value}(
            msg.sender,
            _title,
            _description,
            _tags,
            _website
        );
        
        allBounties.push(clone);
        bountiesByCompany[msg.sender].push(clone);
        
        emit BountyCreated(clone, msg.sender, msg.value, _title, _tags);
        return clone;
    }

    function getAllBounties() external view returns (address[] memory) {
        return allBounties;
    }
    
    function getBountiesByCompany(address company) external view returns (address[] memory) {
        return bountiesByCompany[company];
    }
    
    function getBountiesCount() external view returns (uint256) {
        return allBounties.length;
    }
    
    function getBountiesByCompanyCount(address company) external view returns (uint256) {
        return bountiesByCompany[company].length;
    }

    function getImplementation() external view returns (address) {
        return implementation;
    }
}