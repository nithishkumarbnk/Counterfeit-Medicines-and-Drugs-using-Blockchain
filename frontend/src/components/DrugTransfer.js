// frontend/src/components/DrugTransfer.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";

function DrugTransfer({ API_BASE_URL, authToken }) {
  const [id, setId] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [currentOwnerAddress, setCurrentOwnerAddress] = useState("");
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
        `${API_BASE_URL}/api/drug/transfer`,
        {
          id,
          newOwnerAddress,
          newStatus,
          currentOwnerAddress,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`, // Add Authorization header
          },
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
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Transfer Drug Ownership
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Drug ID"
            variant="outlined"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <TextField
            label="New Owner Ethereum Address"
            variant="outlined"
            value={newOwnerAddress}
            onChange={(e) => setNewOwnerAddress(e.target.value)}
            required
            helperText="Address of the recipient."
          />
          <TextField
            label="New Status (e.g., IN_TRANSIT, RECEIVED_DISTRIBUTOR)"
            variant="outlined"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            required
          />
          <TextField
            label="Your Ethereum Address (Current Owner)"
            variant="outlined"
            value={currentOwnerAddress}
            onChange={(e) => setCurrentOwnerAddress(e.target.value)}
            required
            helperText="This must be the current owner's address on the blockchain (associated with server's private key)."
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Transferring..." : "Transfer Drug"}
          </Button>
        </Box>
      </form>
      {message && (
        <Typography color="success" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
}

export default DrugTransfer;
