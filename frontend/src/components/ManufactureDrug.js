// frontend/src/components/ManufactureDrug.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper } from "@mui/material"; // Import MUI components

function ManufactureDrug({ API_BASE_URL, authToken }) {
  const [id, setId] = useState("");
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [manufacturerAddress, setManufacturerAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State for validation errors
  const [idError, setIdError] = useState(false);
  const [productIdError, setProductIdError] = useState(false);
  const [batchIdError, setBatchIdError] = useState(false);
  const [addressError, setAddressError] = useState(false);

  // Basic Ethereum address validation function (can be more robust)
  const isValidAddress = (addr) => {
    // Simple check: starts with 0x and is 42 chars long (basic)
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    // Reset validation errors
    setIdError(false);
    setProductIdError(false);
    setBatchIdError(false);
    setAddressError(false);

    // Client-side validation
    let hasError = false;
    if (!id) {
      setIdError(true);
      hasError = true;
    }
    if (!productId) {
      setProductIdError(true);
      hasError = true;
    }
    if (!batchId) {
      setBatchIdError(true);
      hasError = true;
    }
    if (!manufacturerAddress || !isValidAddress(manufacturerAddress)) {
      setAddressError(true);
      hasError = true;
    }
    if (hasError) {
      setLoading(false);
      setError("Please correct the highlighted fields.");
      return;
    }
    if (!authToken) {
      setLoading(false);
      setError("Authentication token missing. Please log in.");
      return;
    }

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
      setManufacturerAddress(""); // Clear address after successful submission
    } catch (err) {
      console.error(
        "Manufacturing error:",
        err.response ? err.response.data : err.message
      );
      setError(
        err.response && err.response.data
          ? err.response.data.error ||
              err.response.data.message ||
              "An unexpected error occurred."
          : err.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" component="h3" gutterBottom>
        Manufacture New Drug
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <TextField
            label="Drug ID (Unique)"
            variant="outlined"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setIdError(false);
            }}
            error={idError}
            helperText={idError && "Drug ID is required."}
            fullWidth
          />
          <TextField
            label="Product ID"
            variant="outlined"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setProductIdError(false);
            }}
            error={productIdError}
            helperText={productIdError && "Product ID is required."}
            fullWidth
          />
          <TextField
            label="Batch ID"
            variant="outlined"
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setBatchIdError(false);
            }}
            error={batchIdError}
            helperText={batchIdError && "Batch ID is required."}
            fullWidth
          />
          <TextField
            label="Your Ethereum Address (Manufacturer)"
            variant="outlined"
            value={manufacturerAddress}
            onChange={(e) => {
              setManufacturerAddress(e.target.value);
              setAddressError(false);
            }}
            error={addressError}
            helperText={addressError && "Valid Ethereum address is required."}
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">
            This must be the address associated with the server's private key
            (deployer address).
          </Typography>
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? "Manufacturing..." : "Manufacture Drug"}
        </Button>
      </form>
      {message && (
        <Typography color="success.main" sx={{ mt: 2 }}>
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
