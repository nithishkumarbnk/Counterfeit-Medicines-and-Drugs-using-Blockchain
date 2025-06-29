// frontend/src/components/DrugVerifier.js
import React, { useState } from "react";
import axios from "axios";

function DrugVerifier() {
  const [drugId, setDrugId] = useState("");
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
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/drug/verify/${drugId}`
      );
      setVerificationResult(response.data);
    } catch (err) {
      console.error(
        "Verification error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error verifying drug: " +
          (err.response ? err.response.data.error : err.message)
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

      {error && <p className="error-message">{error}</p>}

      {verificationResult && (
        <div className="verification-result">
          <h3>Verification Details:</h3>
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
          <ul>
            {verificationResult.history.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DrugVerifier;
