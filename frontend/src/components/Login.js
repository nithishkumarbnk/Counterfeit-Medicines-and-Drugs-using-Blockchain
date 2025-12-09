import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
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

      const {
        token,
        username: serverUsername,
        roles,
        userAddress,
      } = response.data;

      onLoginSuccess(token, serverUsername, roles, userAddress);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,0.35)",
          background:
            "radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 60%), rgba(15,23,42,0.98)",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: "primary.light", letterSpacing: 1.5 }}
            >
              Welcome
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Sign in to continue
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Use your registered credentials to access the Anti-Counterfeit
              Drug System.
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                py: 1.2,
                borderRadius: 999,
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Stack>

          {error && (
            <Typography
              variant="body2"
              sx={{ color: "#f97373", mt: 1, textAlign: "center" }}
            >
              {error}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default Login;
