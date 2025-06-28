// frontend/src/components/AddMedicine.js

import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase Functions SDK

function AddMedicine({ userRole }) {
  // userRole is passed as a prop from App.js
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  // Get the Firebase Functions instance
  const functions = getFunctions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    // Frontend authorization check (for better UX, backend will also verify)
    if (userRole !== "manufacturer" && userRole !== "admin") {
      setMessage("Error: You do not have permission to add medicine.");
      return;
    }

    try {
      // Get a reference to your 'addMedicine' Cloud Function
      const addMedicineCallable = httpsCallable(functions, "addMedicine");

      // Call the Cloud Function with the form data
      const result = await addMedicineCallable({
        id,
        name,
        manufacturer,
        currentLocation: location,
      });

      // Handle the response from the Cloud Function
      setMessage(
        `Success: ${result.data.message} Transaction: ${result.data.transactionHash}`
      );
      // Clear form fields on success
      setId("");
      setName("");
      setManufacturer("");
      setLocation("");
    } catch (error) {
      console.error("Error calling addMedicine Cloud Function:", error);
      // Display error message from the Cloud Function (error.message)
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
