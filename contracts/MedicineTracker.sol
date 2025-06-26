// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicineTracker {
    struct Medicine {
        string id; // Unique ID for the medicine (e.g., batch number + serial)
        string name;
        string manufacturer;
        uint256 manufactureDate;
        string currentLocation;
        string status; // e.g., "Manufactured", "Distributed", "Sold", "Recalled", "Counterfeit"
        address owner; // Current owner/holder of the medicine (e.g., manufacturer, distributor, pharmacy)
        uint256 timestamp; // Last updated timestamp
    }

    mapping(string => Medicine) public medicines;
    string[] public medicineIds; // To keep track of all medicine IDs

    event MedicineAdded(string id, string name, string manufacturer, address owner);
    event MedicineStatusUpdated(string id, string newStatus, string newLocation, address newOwner);

    // Only allows the owner of the contract to perform certain actions
    modifier onlyOwner() {
        require(msg.sender == owner(), "Only contract owner can call this function.");
        _;
    }

    // Function to get the contract owner (for demonstration, in a real app, you might use Ownable from OpenZeppelin)
    function owner() public view returns (address) {
        return address(this);
    }

    // Add a new medicine to the system
    function addMedicine(
        string memory _id,
        string memory _name,
        string memory _manufacturer,
        string memory _currentLocation
    ) public {
        require(bytes(medicines[_id].id).length == 0, "Medicine with this ID already exists.");

        medicines[_id] = Medicine({
            id: _id,
            name: _name,
            manufacturer: _manufacturer,
            manufactureDate: block.timestamp,
            currentLocation: _currentLocation,
            status: "Manufactured",
            owner: msg.sender,
            timestamp: block.timestamp
        });
        medicineIds.push(_id);
        emit MedicineAdded(_id, _name, _manufacturer, msg.sender);
    }

    // Update the status and location of a medicine
    function updateMedicineStatus(
        string memory _id,
        string memory _newStatus,
        string memory _newLocation
    ) public {
        require(bytes(medicines[_id].id).length > 0, "Medicine not found.");
        
        medicines[_id].status = _newStatus;
        medicines[_id].currentLocation = _newLocation;
        medicines[_id].owner = msg.sender; // Owner changes to the one updating
        medicines[_id].timestamp = block.timestamp;
        emit MedicineStatusUpdated(_id, _newStatus, _newLocation, msg.sender);
    }

    // Get details of a specific medicine
    function getMedicine(string memory _id) public view returns (
        string memory id,
        string memory name,
        string memory manufacturer,
        uint256 manufactureDate,
        string memory currentLocation,
        string memory status,
        address owner,
        uint256 timestamp
    ) {
        Medicine storage medicine = medicines[_id];
        require(bytes(medicine.id).length > 0, "Medicine not found.");
        return (
            medicine.id,
            medicine.name,
            medicine.manufacturer,
            medicine.manufactureDate,
            medicine.currentLocation,
            medicine.status,
            medicine.owner,
            medicine.timestamp
        );
    }

    // Get all medicine IDs (for demonstration, not efficient for large datasets)
    function getAllMedicineIds() public view returns (string[] memory) {
        return medicineIds;
    }
}

