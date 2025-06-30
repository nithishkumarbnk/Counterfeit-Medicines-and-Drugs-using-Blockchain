// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Ensure this is 0.8.20 or higher

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DrugTracking is AccessControl, Ownable {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    struct Drug {
        string id;
        string productId;
        string batchId;
        address manufacturer;
        address currentOwner;
        string status;
        uint256 lastUpdateTimestamp;
        string[] history;
    }

    mapping(string => Drug) public drugs;

    event DrugManufactured(string id, string productId, string batchId, address manufacturer);
    event DrugTransferred(string id, address from, address to, string newStatus);
    event ColdChainViolation(string id, uint256 timestamp, string details);

constructor() Ownable(msg.sender) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MANUFACTURER_ROLE, msg.sender);
    _grantRole(REGULATOR_ROLE, msg.sender);
}


    function grantRole(bytes32 role, address account) public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account) public virtual override {
        super.renounceRole(role, account);
    }

    function hasRole(bytes32 role, address account) public view virtual override returns (bool) {
        return super.hasRole(role, account);
    }

    modifier onlyCurrentDrugOwner(string memory _drugId) {
        require(bytes(drugs[_drugId].id).length > 0, "Drug not found for owner check.");
        require(msg.sender == drugs[_drugId].currentOwner, "Only the current owner of the drug can perform this action.");
        _;
    }

    function manufactureDrug(string memory _id, string memory _productId, string memory _batchId)
        public
        onlyRole(MANUFACTURER_ROLE)
    {
        require(bytes(drugs[_id].id).length == 0, "Drug with this ID already exists.");

        drugs[_id] = Drug({
            id: _id,
            productId: _productId,
            batchId: _batchId,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            status: "MANUFACTURED",
            lastUpdateTimestamp: block.timestamp,
            history: new string[](0)
        });

        drugs[_id].history.push(string(abi.encodePacked("MANUFACTURED by ", addressToString(msg.sender), " at ", uint256ToString(block.timestamp))));
        emit DrugManufactured(_id, _productId, _batchId, msg.sender);
    }

    function transferDrug(string memory _id, address _newOwner, string memory _newStatus)
        public
        onlyCurrentDrugOwner(_id)
    {
        require(bytes(drugs[_id].id).length > 0, "Drug not found.");
        require(_newOwner != address(0), "New owner cannot be zero address.");

        address oldOwner = drugs[_id].currentOwner;
        drugs[_id].currentOwner = _newOwner;
        drugs[_id].status = _newStatus;
        drugs[_id].lastUpdateTimestamp = block.timestamp;

        drugs[_id].history.push(string(abi.encodePacked("TRANSFERRED from ", addressToString(oldOwner), " to ", addressToString(_newOwner), " as ", _newStatus, " at ", uint256ToString(block.timestamp))));
        emit DrugTransferred(_id, oldOwner, _newOwner, _newStatus);
    }

    function logColdChainViolation(string memory _id, string memory _details)
        public
        onlyRole(REGULATOR_ROLE)
    {
        require(bytes(drugs[_id].id).length > 0, "Drug not found.");
        drugs[_id].history.push(string(abi.encodePacked("COLD_CHAIN_VIOLATION: ", _details, " by ", addressToString(msg.sender), " at ", uint256ToString(block.timestamp))));
        emit ColdChainViolation(_id, block.timestamp, _details);
    }

    function verifyDrug(string memory _id)
        public
        view
        returns (string memory productId, string memory batchId, address manufacturer, address currentOwner, string memory status, string[] memory history)
    {
        require(bytes(drugs[_id].id).length > 0, "Drug not found.");
        return (
            drugs[_id].productId,
            drugs[_id].batchId,
            drugs[_id].manufacturer,
            drugs[_id].currentOwner,
            drugs[_id].status,
            drugs[_id].history
        );
    }

    function addressToString(address _address) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_address)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    function uint256ToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }
}
