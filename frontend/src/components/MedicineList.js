// frontend/src/components/MedicineList.js

import React, { useState, useEffect } from "react";

// firebaseIdToken and userRole are passed as props from App.js
function MedicineList({ firebaseIdToken, userRole }) {
  const [medicineIds, setMedicineIds] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [message, setMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Your backend API base URL, which will be http://localhost:5000 when running in Codespaces
  const API_BASE_URL = "http://localhost:5000";

  // Function to fetch all medicine IDs from the blockchain via backend API
  const fetchMedicineIds = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/medicines`, {
        headers: { Authorization: `Bearer ${firebaseIdToken}` }, // Include Firebase ID Token
      });
      const data = await response.json();
      if (response.ok) {
        setMedicineIds(data); // data contains the array of IDs
      } else {
        setMessage(
          `Error fetching medicine IDs: ${data.error || data.message}`
        );
      }
    } catch (error) {
      console.error("Error fetching medicine IDs:", error);
      setMessage("Error fetching medicine IDs.");
    }
  };

  // Function to fetch details of a specific medicine via backend API
  const fetchMedicineDetails = async (id) => {
    setMessage(""); // Clear previous messages
    try {
      const response = await fetch(`${API_BASE_URL}/api/medicines/${id}`, {
        headers: { Authorization: `Bearer ${firebaseIdToken}` }, // Include Firebase ID Token
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedMedicine(data); // data contains the medicine object
        setNewStatus(data.status); // Pre-fill update form with current status
        setNewLocation(data.currentLocation); // Pre-fill update form with current location
      } else {
        setMessage(
          `Error fetching medicine details: ${data.error || data.message}`
        );
        setSelectedMedicine(null); // Clear selected medicine on error
      }
    } catch (error) {
      console.error("Error fetching medicine details:", error);
      setMessage("Error fetching medicine details.");
      setSelectedMedicine(null);
    }
  };

  // Function to handle updating medicine status via backend API
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
      const response = await fetch(
        `${API_BASE_URL}/api/medicines/${selectedMedicine.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseIdToken}`, // Include Firebase ID Token
          },
          body: JSON.stringify({ newStatus, newLocation }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage(
          `Success: ${data.message} Transaction: ${data.transactionHash}`
        );
        fetchMedicineDetails(selectedMedicine.id); // Refresh details of the selected medicine
        fetchMedicineIds(); // Refresh the list of IDs
      } else {
        setMessage(
          `Error: ${data.error || data.message || "Failed to update status"}`
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  // Fetch medicine IDs on component mount and set up a refresh interval
  useEffect(() => {
    // Only fetch if authenticated (firebaseIdToken is available)
    if (firebaseIdToken) {
      fetchMedicineIds();
      const interval = setInterval(fetchMedicineIds, 5000); // Refresh IDs every 5 seconds
      return () => clearInterval(interval); // Cleanup interval on unmount
    }
  }, [firebaseIdToken]); // Re-run effect if firebaseIdToken changes

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
