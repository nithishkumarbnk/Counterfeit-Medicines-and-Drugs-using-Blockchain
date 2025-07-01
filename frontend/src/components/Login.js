// frontend/src/components/Login.js
import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import axios from "axios";

function Login({ onLoginSuccess, API_BASE_URL }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username,
        password,
      });
      onLoginSuccess(response.data.token, username, response.data.roles);
    } catch (err) {
      console.error(
        "Login error:",
        err.response ? err.response.data : err.message
      );
      setError(
        "Error logging in: " +
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 400,
        mx: "auto",
        p: 3,
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Admin Login
      </Typography>
      <TextField
        label="Username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        label="Password"
        variant="outlined"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="contained" onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default Login;
