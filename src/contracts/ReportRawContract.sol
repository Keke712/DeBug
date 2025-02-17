pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract BugReportLogic {
    enum Status { Pending, Confirmed, Canceled }
    
    address public bountyContract;  
    address public reporter;        
    bytes32 public description;    
    Status public status;
    bool private initialized;

    event BugReported(address indexed reporter, address indexed bountyContract, bytes32 description);
    event ReportConfirmed(address indexed reporter, uint amount);
    event ReportCanceled(address indexed reporter);

    function _checkInitializer() internal {
        require(!initialized, "Already initialized");
        initialized = true;
    }

    function _checkOnlyBountyContract() internal view {
        require(msg.sender == bountyContract, "Only bounty contract can call");
    }

    function _checkWhenPending() internal view {
        require(status == Status.Pending, "Report must be pending");
    }

    function initialize(
        address _reporter,
        address _bountyContract,
        bytes32 _description
    ) external {
        _checkInitializer();
        require(_bountyContract != address(0), "Invalid bounty contract");
        require(_reporter != address(0), "Invalid reporter address");
        require(_description != bytes32(0), "Description cannot be empty");
        
        reporter = _reporter;
        bountyContract = _bountyContract;
        description = _description;
        status = Status.Pending;
        
        emit BugReported(reporter, bountyContract, description);
    }

    function confirmReport() external payable {
        _checkOnlyBountyContract();
        _checkWhenPending();
        status = Status.Confirmed;
        
        (bool success, ) = reporter.call{value: msg.value}("");
        require(success, "Transfer to reporter failed");
        
        emit ReportConfirmed(reporter, msg.value);
    }

    function cancelReport() external {
        _checkOnlyBountyContract();
        _checkWhenPending();
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

    function getDescription() external view returns (bytes32) {
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
        bytes32 description
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