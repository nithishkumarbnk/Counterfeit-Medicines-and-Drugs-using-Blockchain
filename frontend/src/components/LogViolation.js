// frontend/src/components/LogViolation.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";

function LogViolation({ API_BASE_URL, authToken }) {
  const [drugId, setDrugId] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      // For simplicity, we'll send a dummy senderAddress or let backend use loaded key
      // The backend will use the loaded MANUFACTURER_PRIVATE_KEY for signing
      const response = await axios.post(
        `${API_BASE_URL}/api/sensor-data`,
        {
          drugId,
          timestamp: Math.floor(Date.now() / 1000), // Current Unix timestamp in seconds
          temperature: parseFloat(temperature),
          humidity: parseFloat(humidity),
          // senderAddress is handled by backend (MANUFACTURER_PRIVATE_KEY)
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`, // Add Authorization header
          },
        }
      );
      setMessage(response.data.message);
      setDrugId("");
      setTemperature("");
      setHumidity("");
    } catch (err) {
      console.error(
        "Logging violation error:",
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
        Log Cold Chain Violation
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Drug ID"
            variant="outlined"
            value={drugId}
            onChange={(e) => setDrugId(e.target.value)}
            required
          />
          <TextField
            label="Temperature (°C)"
            variant="outlined"
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            required
            helperText="Violation if outside 2-8°C"
          />
          <TextField
            label="Humidity (%)"
            variant="outlined"
            type="number"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Logging..." : "Log Violation"}
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

export default LogViolation;
