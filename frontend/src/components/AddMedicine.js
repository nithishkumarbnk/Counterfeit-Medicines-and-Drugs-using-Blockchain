// frontend/src/components/AddMedicine.js

import React, { useState } from "react";

// firebaseIdToken and userRole are passed as props from App.js
function AddMedicine({ firebaseIdToken, userRole }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  // Your backend API base URL, which will be http://localhost:5000 when running in Codespaces
  const API_BASE_URL = "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    // Frontend authorization check (for better UX, backend will also verify)
    if (userRole !== "manufacturer" && userRole !== "admin") {
      setMessage("Error: You do not have permission to add medicine.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/medicines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseIdToken}`, // Include Firebase ID Token in Authorization header
        },
        body: JSON.stringify({
          id,
          name,
          manufacturer,
          currentLocation: location,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(
          `Success: ${data.message} Transaction: ${data.transactionHash}`
        );
        // Clear form fields on success
        setId("");
        setName("");
        setManufacturer("");
        setLocation("");
      } else {
        // Display error message from the backend
        setMessage(
          `Error: ${data.error || data.message || "Failed to add medicine"}`
        );
      }
    } catch (error) {
      console.error("Error adding medicine:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>ID:</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Manufacturer:</label>
        <input
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Current Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Medicine</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default AddMedicine;
