// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol"; // Import Ownable for access control

contract DrugTracking is Ownable { // Inherit from Ownable
    // Struct to represent a drug item
    struct Drug {
        string id;             // Unique identifier for the drug item (e.g., serialized GTIN)
        string productId;      // Product identifier (e.g., GTIN)
        string batchId;        // Batch identifier
        address manufacturer;  // Address of the manufacturer
        address currentOwner;  // Current owner of the drug item
        string status;         // Current status (e.g., "MANUFACTURED", "IN_TRANSIT", "RECEIVED_PHARMACY")
        uint256 lastUpdateTimestamp; // Timestamp of the last update
        string[] history;      // Array of historical events for this drug
    }

    // Mapping from drug ID to Drug struct
    mapping(string => Drug) public drugs;

    // Events to log important actions
    event DrugManufactured(string id, string productId, string batchId, address manufacturer);
    event DrugTransferred(string id, address from, address to, string newStatus);
    event ColdChainViolation(string id, uint256 timestamp, string details);

    // --- Constructor ---
    // The constructor is automatically called once when the contract is deployed.
    // The 'Ownable' contract's constructor sets the deployer as the owner.
    constructor() Ownable(msg.sender) {
        // No specific initialization needed here beyond what Ownable does.
    }

    // Modifier to restrict access to the current owner (of the drug, not the contract)
    // This modifier is useful if you want to allow the drug's current owner to perform actions.
    // Note: This is different from onlyOwner (contract owner).
    modifier onlyCurrentDrugOwner(string memory _drugId) {
        require(bytes(drugs[_drugId].id).length > 0, "Drug not found for owner check.");
        require(msg.sender == drugs[_drugId].currentOwner, "Only the current owner of the drug can perform this action.");
        _;
    }

    // Function to register a new drug item (called by manufacturer)
    // Only the contract owner can manufacture drugs (e.g., the system's central authority or a trusted manufacturer's address)
    function manufactureDrug(string memory _id, string memory _productId, string memory _batchId)
        public
        onlyOwner // Only the contract owner can call this function
    {
        require(bytes(drugs[_id].id).length == 0, "Drug with this ID already exists.");

        drugs[_id] = Drug({
            id: _id,
            productId: _productId,
            batchId: _batchId,
            manufacturer: msg.sender, // The contract owner is the manufacturer in this context
            currentOwner: msg.sender, // Initial owner is the manufacturer
            status: "MANUFACTURED",
            lastUpdateTimestamp: block.timestamp,
            history: new string[](0) // Initialize empty history
        });

        drugs[_id].history.push(string(abi.encodePacked("MANUFACTURED by ", addressToString(msg.sender), " at ", uint256ToString(block.timestamp))));
        emit DrugManufactured(_id, _productId, _batchId, msg.sender);
    }

    // Function to transfer ownership of a drug item
    // This function can be called by the current owner of the drug
    function transferDrug(string memory _id, address _newOwner, string memory _newStatus)
        public
        onlyCurrentDrugOwner(_id) // Only the current owner of the drug can transfer it
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

    // Function to log a cold chain violation
    // Only the contract owner can log violations (e.g., a trusted IoT gateway or regulator)
    function logColdChainViolation(string memory _id, string memory _details)
        public
        onlyOwner // Restrict to contract owner
    {
        require(bytes(drugs[_id].id).length > 0, "Drug not found.");
        drugs[_id].history.push(string(abi.encodePacked("COLD_CHAIN_VIOLATION: ", _details, " by ", addressToString(msg.sender), " at ", uint256ToString(block.timestamp))));
        emit ColdChainViolation(_id, block.timestamp, _details);
    }

    // Function to verify a drug's authenticity and retrieve its history
    function verifyDrug(string memory _id)
        public
        view // This remains a view function
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

    // --- Helper functions for string conversion (for history logging) ---
    // These are pure functions, meaning they don't read or modify state.
    function addressToString(address _address) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_address)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42); // "0x" + 20 bytes * 2 chars/byte = 42 chars
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
