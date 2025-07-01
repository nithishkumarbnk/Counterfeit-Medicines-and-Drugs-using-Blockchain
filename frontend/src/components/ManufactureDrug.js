// frontend/src/components/ManufactureDrug.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";

function ManufactureDrug({ API_BASE_URL, authToken }) {
  const [id, setId] = useState("");
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [manufacturerAddress, setManufacturerAddress] = useState("");
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
        `${API_BASE_URL}/api/drug/manufacture`,
        {
          id,
          productId,
          batchId,
          manufacturerAddress,
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
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Manufacture New Drug
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Drug ID (Unique)"
            variant="outlined"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <TextField
            label="Product ID"
            variant="outlined"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
          <TextField
            label="Batch ID"
            variant="outlined"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
          />
          <TextField
            label="Your Ethereum Address (Manufacturer)"
            variant="outlined"
            value={manufacturerAddress}
            onChange={(e) => setManufacturerAddress(e.target.value)}
            required
            helperText="This must be the address associated with the server's private key (deployer address)."
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Manufacturing..." : "Manufacture Drug"}
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

export default ManufactureDrug;
