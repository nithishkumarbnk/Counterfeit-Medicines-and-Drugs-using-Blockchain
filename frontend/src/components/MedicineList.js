// frontend/src/components/MedicineList.js

import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase Functions SDK

function MedicineList({ userRole }) {
  // userRole is passed as a prop from App.js
  const [medicineIds, setMedicineIds] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [message, setMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Get the Firebase Functions instance
  const functions = getFunctions();

  // Function to fetch all medicine IDs from the blockchain via Cloud Function
  const fetchMedicineIds = async () => {
    try {
      const getAllMedicineIdsCallable = httpsCallable(
        functions,
        "getAllMedicineIds"
      );
      const result = await getAllMedicineIdsCallable();
      setMedicineIds(result.data); // result.data contains the array of IDs
    } catch (error) {
      console.error("Error fetching medicine IDs:", error);
      setMessage("Error fetching medicine IDs.");
    }
  };

  // Function to fetch details of a specific medicine via Cloud Function
  const fetchMedicineDetails = async (id) => {
    setMessage(""); // Clear previous messages
    try {
      const getMedicineCallable = httpsCallable(functions, "getMedicine");
      const result = await getMedicineCallable({ id });
      setSelectedMedicine(result.data); // result.data contains the medicine object
      setNewStatus(result.data.status); // Pre-fill update form with current status
      setNewLocation(result.data.currentLocation); // Pre-fill update form with current location
    } catch (error) {
      console.error("Error fetching medicine details:", error);
      setMessage("Error fetching medicine details.");
      setSelectedMedicine(null); // Clear selected medicine on error
    }
  };

  // Function to handle updating medicine status via Cloud Function
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return; // Ensure a medicine is selected
    setMessage(""); // Clear previous messages

    // Frontend authorization check (for better UX, backend will also verify)
    const allowedRoles = ["manufacturer", "distributor", "pharmacy", "admin"];
    if (!allowedRoles.includes(userRole)) {
      setMessage(
        "Error: You do not have permission to update medicine status."
      );
      return;
    }

    try {
      const updateMedicineStatusCallable = httpsCallable(
        functions,
        "updateMedicineStatus"
      );
      const result = await updateMedicineStatusCallable({
        id: selectedMedicine.id,
        newStatus,
        newLocation,
      });

      setMessage(
        `Success: ${result.data.message} Transaction: ${result.data.transactionHash}`
      );
      fetchMedicineDetails(selectedMedicine.id); // Refresh details of the selected medicine
      fetchMedicineIds(); // Refresh the list of IDs (in case owner changed or new ones added)
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  // Fetch medicine IDs on component mount and set up a refresh interval
  useEffect(() => {
    fetchMedicineIds();
    const interval = setInterval(fetchMedicineIds, 5000); // Refresh IDs every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div>
      <h3>Available Medicine IDs:</h3>
      {message && <p style={{ color: "red" }}>{message}</p>}{" "}
      {/* Display messages */}
      <ul>
        {medicineIds.length === 0 ? (
          <p>No medicines tracked yet. Add one above!</p>
        ) : (
          medicineIds.map((id) => (
            <li key={id}>
              <button onClick={() => fetchMedicineDetails(id)}>{id}</button>
            </li>
          ))
        )}
      </ul>
      {selectedMedicine && ( // Only render if a medicine is selected
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <h3>Details for ID: {selectedMedicine.id}</h3>
          <p>
            <strong>Name:</strong> {selectedMedicine.name}
          </p>
          <p>
            <strong>Manufacturer:</strong> {selectedMedicine.manufacturer}
          </p>
          <p>
            <strong>Manufacture Date:</strong>{" "}
            {new Date(
              selectedMedicine.manufactureDate * 1000
            ).toLocaleDateString()}
          </p>
          <p>
            <strong>Current Location:</strong>{" "}
            {selectedMedicine.currentLocation}
          </p>
          <p>
            <strong>Status:</strong> {selectedMedicine.status}
          </p>
          <p>
            <strong>Current Owner:</strong> {selectedMedicine.owner}
          </p>
          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(selectedMedicine.timestamp * 1000).toLocaleString()}
          </p>

          {/* Update Status form, visible only to authorized roles */}
          {(userRole === "manufacturer" ||
            userRole === "distributor" ||
            userRole === "pharmacy" ||
            userRole === "admin") && (
            <>
              <h4>Update Status:</h4>
              <form onSubmit={handleUpdateStatus}>
                <div>
                  <label>New Status:</label>
                  <input
                    type="text"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>New Location:</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    required
                  />
                </div>
                <button type="submit">Update Medicine</button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicineList;
