import React, { useState } from "react";
import axios from "axios"; // Add this import

const REACT_APP_BACKEND_URL =
  "https://counterfeit-medicines-and-drugs-using.onrender.com";
function DrugVerifier() {
  const [drugId, setDrugId] = useState("");
  const [allDrugsData, setAllDrugsData] = useState(null); // Renamed to avoid conflict with function
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkAddress, setCheckAddress] = useState("");
  const [checkRole, setCheckRole] = useState("MANUFACTURER_ROLE"); // Default role to check
  const [roleCheckResult, setRoleCheckResult] = useState(null);

  const handleCheckRole = async () => {
    setError("");
    setRoleCheckResult(null);
    if (!checkAddress) {
      setError("Please enter an address to check role.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/hasRole/${checkRole}/${checkAddress}`
      );
      setRoleCheckResult(response.data);
    } catch (err) {
      console.error(
        "Role check error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error checking role: " +
          (err.response
            ? err.response.message || err.response.data.error
            : err.message)
      );
    } finally {
      setLoading(false);
    }
  };
  const handleVerify = async () => {
    setError("");
    setVerificationResult(null);
    if (!drugId) {
      setError("Please enter a Drug ID.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/verifyDrug/${drugId}`
      ); // Corrected API call
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
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/getAllDrugs`); // Corrected API call
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
      <li>
        <h3>Check Role</h3>
        <input
          type="text"
          placeholder="Address to check role"
          value={checkAddress}
          onChange={(e) => setCheckAddress(e.target.value)}
        />
        <select
          value={checkRole}
          onChange={(e) => setCheckRole(e.target.value)}
        >
          <option value="MANUFACTURER_ROLE">Manufacturer</option>
          <option value="DISTRIBUTOR_ROLE">Distributor</option>
          <option value="PHARMACY_ROLE">Pharmacy</option>
          <option value="REGULATOR_ROLE">Regulator</option>
          <option value="DEFAULT_ADMIN_ROLE">Admin</option>
        </select>
        <button onClick={handleCheckRole} disabled={loading}>
          Check Role
        </button>
      </li>

      {roleCheckResult && (
        <div>
          <p>Address: {roleCheckResult.address}</p>
          <p>Role: {roleCheckResult.role}</p>
          <p>Has Role: {roleCheckResult.hasRole ? "Yes" : "No"}</p>
        </div>
      )}
      <br></br>
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
