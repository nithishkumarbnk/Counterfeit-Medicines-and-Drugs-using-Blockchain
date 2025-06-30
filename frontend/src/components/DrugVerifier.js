import React, { useState } from "react";
import axios from "axios"; // Add this import

// Define your backend API base URL
// If running locally: const API_BASE_URL = "http://localhost:5000/api";
// If deployed on Render: const API_BASE_URL = "YOUR_RENDER_BACKEND_URL/api";
const API_BASE_URL = "http://localhost:5000/api"; // CHANGE THIS TO YOUR ACTUAL BACKEND URL

function DrugVerifier() {
  const [drugId, setDrugId] = useState("");
  const [allDrugsData, setAllDrugsData] = useState(null); // Renamed to avoid conflict with function
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setVerificationResult(null);
    if (!drugId) {
      setError("Please enter a Drug ID.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/verifyDrug/${drugId}`); // Corrected API call
      setVerificationResult(response.data);
    } catch (err) {
      console.error(
        "Verification error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error verifying drug: " +
          (err.response
            ? err.response.message || err.response.data.error
            : err.message) // Improved error message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllDrugs = async () => {
    // Renamed function for clarity
    setAllDrugsData(null);
    setError("");
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/getAllDrugs`); // Corrected API call
      setAllDrugsData(response.data);
    } catch (err) {
      console.error(
        "Error fetching all drugs:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error fetching all drugs: " +
          (err.response
            ? err.response.message || err.response.data.error
            : err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Verify Drug Authenticity</h2>
      <input
        type="text"
        placeholder="Enter Drug ID (e.g., QR scan)"
        value={drugId}
        onChange={(e) => setDrugId(e.target.value)}
        style={{
          padding: "8px",
          marginRight: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />
      <button
        onClick={handleVerify}
        disabled={loading}
        style={{
          padding: "8px 15px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <button
        onClick={handleGetAllDrugs} // Button to trigger fetching all drugs
        disabled={loading}
        style={{
          padding: "8px 15px",
          backgroundColor: "#28a745", // Green color
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginLeft: "10px",
        }}
      >
        {loading ? "Loading All..." : "Get All Drugs"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {verificationResult && (
        <div
          style={{
            border: "1px solid #eee",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>Verification Details for Drug ID: {drugId}</h3>
          <p>
            <strong>Product ID:</strong> {verificationResult.productId}
          </p>
          <p>
            <strong>Batch ID:</strong> {verificationResult.batchId}
          </p>
          <p>
            <strong>Manufacturer:</strong> {verificationResult.manufacturer}
          </p>
          <p>
            <strong>Current Owner:</strong> {verificationResult.currentOwner}
          </p>
          <p>
            <strong>Status:</strong> {verificationResult.status}
          </p>
          <h4>History:</h4>
          {verificationResult.history.length > 0 ? (
            <ul>
              {verificationResult.history.map((event, index) => (
                <li key={index}>
                  <strong>{event.eventType}:</strong> {event.details} (Block:{" "}
                  {event.blockNumber}, Time:{" "}
                  {new Date(event.timestamp).toLocaleString()})
                </li>
              ))}
            </ul>
          ) : (
            <p>No history available.</p>
          )}
        </div>
      )}

      {allDrugsData && (
        <div
          style={{
            border: "1px solid #eee",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>All Tracked Drugs:</h3>
          {allDrugsData.length > 0 ? (
            <ul>
              {allDrugsData.map((drug) => (
                <li
                  key={drug._id}
                  style={{
                    marginBottom: "10px",
                    borderBottom: "1px dashed #ccc",
                    paddingBottom: "5px",
                  }}
                >
                  <strong>Drug ID:</strong> {drug._id} <br />
                  <strong>Product ID:</strong> {drug.productId} <br />
                  <strong>Status:</strong> {drug.status} <br />
                  <strong>Current Owner:</strong> {drug.currentOwnerAddress}
                </li>
              ))}
            </ul>
          ) : (
            <p>No drugs found in the database.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default DrugVerifier;
