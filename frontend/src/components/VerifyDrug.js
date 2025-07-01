// frontend/src/components/VerifyDrug.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";

function VerifyDrug({ API_BASE_URL }) {
  // authToken is not needed for verify/getAll
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

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Verify Drug Authenticity
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Enter Drug ID"
          variant="outlined"
          value={drugId}
          onChange={(e) => setDrugId(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {verificationResult && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Details for Drug ID: {drugId}
          </Typography>
          <Typography>
            <strong>Product ID:</strong> {verificationResult.productId}
          </Typography>
          <Typography>
            <strong>Batch ID:</strong> {verificationResult.batchId}
          </Typography>
          <Typography>
            <strong>Manufacturer:</strong> {verificationResult.manufacturer}
          </Typography>
          <Typography>
            <strong>Current Owner:</strong> {verificationResult.currentOwner}
          </Typography>
          <Typography>
            <strong>Status:</strong> {verificationResult.status}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            History:
          </Typography>
          {verificationResult.history.length > 0 ? (
            <ul>
              {verificationResult.history.map((event, index) => (
                <li key={index}>
                  <Typography variant="body2">
                    <strong>{event.eventType}:</strong> {event.details} (Block:{" "}
                    {event.blockNumber}, Time:{" "}
                    {new Date(event.timestamp).toLocaleString()})
                  </Typography>
                </li>
              ))}
            </ul>
          ) : (
            <Typography>No history available.</Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default VerifyDrug;
