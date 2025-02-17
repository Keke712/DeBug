pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract BountyDepositLogic {
    address public companyAddress;
    address public recipientAddress;
    uint public bountyAmount;
    bool public recipientValidated;
    bool private initialized;
    
    string public title;
    string public description;
    string[] public tags;
    string public website;
    
    event DepositReceived(address sender, uint amount);
    event RecipientValidated(address recipient);
    event BountyReleased(address recipient, uint amount);
    event MetadataUpdated(string title, string description, string[] tags, string website);

    modifier initializer() {
        require(!initialized, "Already initialized");
        _;
        initialized = true;
    }

    function initialize(
        address _companyAddress,
        string memory _title,
        string memory _description,
        string[] memory _tags,
        string memory _website
    ) external payable initializer {
        require(_companyAddress != address(0), "Invalid company address");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        companyAddress = _companyAddress;
        bountyAmount = msg.value;
        recipientValidated = false;
        
        title = _title;
        description = _description;
        tags = _tags;
        website = _website;
        
        emit DepositReceived(companyAddress, bountyAmount);
        emit MetadataUpdated(title, description, tags, website);
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

    function updateMetadata(
        string memory _title,
        string memory _description,
        string[] memory _tags,
        string memory _website
    ) external onlyCompany {
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        title = _title;
        description = _description;
        tags = _tags;
        website = _website;
        
        emit MetadataUpdated(title, description, tags, website);
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

    function getBountyMetadata() external view returns (
        string memory _title,
        string memory _description,
        string[] memory _tags,
        string memory _website
    ) {
        return (title, description, tags, website);
    }

    function getTagsCount() external view returns (uint) {
        return tags.length;
    }

    function getTag(uint index) external view returns (string memory) {
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
        onlyCompany 
        fundsDeposited 
    {
        uint amountToRelease = address(this).balance;
        (bool success, ) = reportAddress.call(
            abi.encodeWithSignature("confirmReport()")
        );
        require(success, "Report confirmation failed");
    }

    function cancelBugReport(address reportAddress) 
        external 
        onlyCompany 
    {
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
        string title,
        string[] tags
    );
    
    constructor() {
        implementation = address(new BountyDepositLogic());
    }
    
    function createBounty(
        string memory _title,
        string memory _description,
        string[] memory _tags,
        string memory _website
    ) external payable returns (address) {
        require(msg.value > 0, "Must send ETH");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
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