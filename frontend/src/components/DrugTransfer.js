// frontend/src/components/DrugTransfer.js
import React, { useState } from "react";
import axios from "axios";

function DrugTransfer() {
  const [id, setId] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState(""); // Ganache account address
  const [newStatus, setNewStatus] = useState("");
  const [currentOwnerAddress, setCurrentOwnerAddress] = useState(""); // Ganache account address
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/drug/transfer`,
        {
          id,
          newOwnerAddress,
          newStatus,
          currentOwnerAddress,
        }
      );
      setMessage(
        response.data.message + ` Tx Hash: ${response.data.transactionHash}`
      );
      setId("");
      setNewOwnerAddress("");
      setNewStatus("");
      // currentOwnerAddress might be kept for convenience
    } catch (err) {
      console.error(
        "Transfer error:",
        err.response ? err.response.data : err.message
      );
      setError(
        err.response ? err.response.data.error : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <h3>Transfer Drug Ownership</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Drug ID:</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>New Owner Ethereum Address:</label>
          <input
            type="text"
            value={newOwnerAddress}
            onChange={(e) => setNewOwnerAddress(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
          <small>
            Use one of the addresses provided by Ganache CLI (e.g., `0x...`).
          </small>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>New Status (e.g., IN_TRANSIT, RECEIVED_DISTRIBUTOR):</label>
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Your Ethereum Address (Current Owner):</label>
          <input
            type="text"
            value={currentOwnerAddress}
            onChange={(e) => setCurrentOwnerAddress(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
          <small>
            This must be the current owner's address on the blockchain.
          </small>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Transferring..." : "Transfer Drug"}
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default DrugTransfer;
