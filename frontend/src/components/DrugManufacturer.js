// frontend/src/components/DrugManufacturer.js
import React, { useState } from "react";
import axios from "axios";

function DrugManufacturer() {
  const [id, setId] = useState("");
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [manufacturerAddress, setManufacturerAddress] = useState(""); // Ganache account address
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
        `${process.env.REACT_APP_BACKEND_URL}/api/drug/manufacture`,
        {
          id,
          productId,
          batchId,
          manufacturerAddress,
        }
      );
      setMessage(
        response.data.message + ` Tx Hash: ${response.data.transactionHash}`
      );
      setId("");
      setProductId("");
      setBatchId("");
      // manufacturerAddress might be kept for convenience
    } catch (err) {
      console.error(
        "Manufacturing error:",
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
      <h3>Manufacture New Drug</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Drug ID (Unique):</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Product ID:</label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Batch ID:</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Your Ethereum Address (Manufacturer):</label>
          <input
            type="text"
            value={manufacturerAddress}
            onChange={(e) => setManufacturerAddress(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
          <small>
            Use one of the addresses provided by Ganache CLI (e.g., `0x...`).
            This will be the drug's initial owner.
          </small>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Manufacturing..." : "Manufacture Drug"}
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default DrugManufacturer;
