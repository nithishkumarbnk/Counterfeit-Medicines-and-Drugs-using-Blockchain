import React, { useState } from "react";
import axios from "axios";

// This variable will be injected by Vercel from your environment variables.
// Make sure REACT_APP_BACKEND_URL is set in your Vercel project settings.
// Example: https://counterfeit-medicines-and-drugs-using.onrender.com
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function DrugVerifier() {
  const [drugId, setDrugId] = useState("");
  const [allDrugsData, setAllDrugsData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkAddress, setCheckAddress] = useState("");
  const [checkRole, setCheckRole] = useState("MANUFACTURER_ROLE");
  const [roleCheckResult, setRoleCheckResult] = useState(null);
  const [adminAccountAddress, setAdminAccountAddress] = useState(""); // For admin operations
  const [adminRoleName, setAdminRoleName] = useState("MANUFACTURER_ROLE"); // Role to grant/revoke
  const [adminResult, setAdminResult] = useState(null); // Result of admin operation

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
        `${API_BASE_URL}/api/hasRole/${checkRole}/${checkAddress}`
      );
      setRoleCheckResult(response.data);
    } catch (err) {
      console.error(
        "Role check error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error checking role: " +
          (err.response &&
            err.response.data &&
            (err.response.data.message || err.response.data.error)) ||
          (err.response && err.response.status
            ? `Status ${err.response.status}: ${err.response.statusText}`
            : err.message) ||
          "Unknown error occurred."
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
      // Calling the backend endpoint that reads from blockchain
      const response = await axios.get(
        `${API_BASE_URL}/api/drug/verify/${drugId}`
      );
      setVerificationResult(response.data);
    } catch (err) {
      console.error(
        "Verification error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error verifying drug: " +
          (err.response &&
            err.response.data &&
            (err.response.data.message || err.response.data.error)) ||
          (err.response && err.response.status
            ? `Status ${err.response.status}: ${err.response.statusText}`
            : err.message) ||
          "Unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRole = async () => {
    setError("");
    setAdminResult(null);
    if (!adminAccountAddress || !adminRoleName) {
      setError("Please enter account address and select a role.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/grantRole`, {
        roleName: adminRoleName,
        accountAddress: adminAccountAddress,
      });
      setAdminResult(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error(
        "Grant role error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error granting role: " +
          (err.response &&
            err.response.data &&
            (err.response.data.message || err.response.data.error)) ||
          (err.response && err.response.status
            ? `Status ${err.response.status}: ${err.response.statusText}`
            : err.message) ||
          "Unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async () => {
    setError("");
    setAdminResult(null);
    if (!adminAccountAddress || !adminRoleName) {
      setError("Please enter account address and select a role.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/revokeRole`,
        {
          roleName: adminRoleName,
          accountAddress: adminAccountAddress,
        }
      );
      setAdminResult(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error(
        "Revoke role error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error revoking role: " +
          (err.response &&
            err.response.data &&
            (err.response.data.message || err.response.data.error)) ||
          (err.response && err.response.status
            ? `Status ${err.response.status}: ${err.response.statusText}`
            : err.message) ||
          "Unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Verify Drug Authenticity</h2>
      <hr style={{ margin: "40px 0" }} /> {/* Separator */}
      <h2>Admin: Manage Roles</h2>
      <p>
        (Requires the server's `MANUFACTURER_PRIVATE_KEY` to have
        `DEFAULT_ADMIN_ROLE`)
      </p>
      <input
        type="text"
        placeholder="Account Address to Manage Role"
        value={adminAccountAddress}
        onChange={(e) => setAdminAccountAddress(e.target.value)}
        style={{
          padding: "8px",
          marginRight: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: "300px",
        }}
      />
      <select
        value={adminRoleName}
        onChange={(e) => setAdminRoleName(e.target.value)}
        style={{
          padding: "8px",
          marginRight: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      >
        <option value="MANUFACTURER_ROLE">MANUFACTURER_ROLE</option>
        <option value="DISTRIBUTOR_ROLE">DISTRIBUTOR_ROLE</option>
        <option value="PHARMACY_ROLE">PHARMACY_ROLE</option>
        <option value="REGULATOR_ROLE">REGULATOR_ROLE</option>
        {/* DEFAULT_ADMIN_ROLE is usually not granted/revoked via UI, but kept for hasRole check */}
      </select>
      <button
        onClick={handleGrantRole}
        disabled={loading}
        style={{
          padding: "8px 15px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginRight: "5px",
        }}
      >
        {loading ? "Granting..." : "Grant Role"}
      </button>
      <button
        onClick={handleRevokeRole}
        disabled={loading}
        style={{
          padding: "8px 15px",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {loading ? "Revoking..." : "Revoke Role"}
      </button>
      {adminResult && (
        <div
          style={{
            border: "1px solid #eee",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>Admin Operation Result:</h3>
          <p>
            <strong>Message:</strong> {adminResult.message}
          </p>
          {adminResult.transactionHash && (
            <p>
              <strong>Transaction Hash:</strong> {adminResult.transactionHash}
            </p>
          )}
        </div>
      )}
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
