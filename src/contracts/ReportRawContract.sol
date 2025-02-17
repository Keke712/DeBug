pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract BugReportLogic {
    enum Status { Pending, Confirmed, Canceled }
    
    address public bountyContract;
    address public reporter;
    string public description;
    Status public status;
    bool private initialized;

    event BugReported(address indexed reporter, address indexed bountyContract, string description);
    event ReportConfirmed(address indexed reporter, uint amount);
    event ReportCanceled(address indexed reporter);

    modifier initializer() {
        require(!initialized, "Already initialized");
        _;
        initialized = true;
    }

    modifier onlyBountyContract() {
        require(msg.sender == bountyContract, "Only bounty contract can call");
        _;
    }

    modifier whenPending() {
        require(status == Status.Pending, "Report must be pending");
        _;
    }

    function initialize(
        address _reporter,
        address _bountyContract,
        string memory _description
    ) external initializer {
        require(_bountyContract != address(0), "Invalid bounty contract");
        require(_reporter != address(0), "Invalid reporter address");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        reporter = _reporter;
        bountyContract = _bountyContract;
        description = _description;
        status = Status.Pending;
        
        emit BugReported(reporter, bountyContract, description);
    }

    function confirmReport() external payable onlyBountyContract whenPending {
        status = Status.Confirmed;
        
        (bool success, ) = reporter.call{value: msg.value}("");
        require(success, "Transfer to reporter failed");
        
        emit ReportConfirmed(reporter, msg.value);
    }

    function cancelReport() external onlyBountyContract whenPending {
        status = Status.Canceled;
        emit ReportCanceled(reporter);
    }

    // View functions
    function getStatus() external view returns (Status) {
        return status;
    }

    function getReporter() external view returns (address) {
        return reporter;
    }

    function getDescription() external view returns (string memory) {
        return description;
    }
}

contract ReportFactory {
    using Clones for address;
    
    address public immutable implementation;
    address[] public allReports;
    mapping(address => address[]) public reportsByBounty;
    mapping(address => address[]) public reportsByReporter;
    
    event ReportCreated(
        address indexed reportContract,
        address indexed bountyContract,
        address indexed reporter
    );
    
    constructor() {
        implementation = address(new BugReportLogic());
    }
    
    function createReport(
        address bountyContract,
        string calldata description
    ) external returns (address) {
        address clone = implementation.clone();
        BugReportLogic(clone).initialize(msg.sender, bountyContract, description);
        
        // Track the new report
        allReports.push(clone);
        reportsByBounty[bountyContract].push(clone);
        reportsByReporter[msg.sender].push(clone);
        
        emit ReportCreated(clone, bountyContract, msg.sender);
        return clone;
    }

    // Getter functions
    function getAllReports() external view returns (address[] memory) {
        return allReports;
    }
    
    function getReportsByBounty(address bountyContract) external view returns (address[] memory) {
        return reportsByBounty[bountyContract];
    }
    
    function getReportsByReporter(address reporter) external view returns (address[] memory) {
        return reportsByReporter[reporter];
    }
    
    function getReportsCount() external view returns (uint256) {
        return allReports.length;
    }
    
    function getReportsByBountyCount(address bountyContract) external view returns (uint256) {
        return reportsByBounty[bountyContract].length;
    }
    
    function getReportsByReporterCount(address reporter) external view returns (uint256) {
        return reportsByReporter[reporter].length;
    }

    function getImplementation() external view returns (address) {
        return implementation;
    }
}