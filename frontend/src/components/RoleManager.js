// frontend/src/components/RoleManager.js
import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

function RoleManager({ API_BASE_URL, authToken }) {
  // State for checking roles
  const [checkAddress, setCheckAddress] = useState("");
  const [checkRole, setCheckRole] = useState("MANUFACTURER_ROLE");
  const [roleCheckResult, setRoleCheckResult] = useState(null);

  // State for admin grant/revoke operations
  const [adminAccountAddress, setAdminAccountAddress] = useState("");
  const [adminRoleName, setAdminRoleName] = useState("MANUFACTURER_ROLE");
  const [adminResult, setAdminResult] = useState(null);

  // General loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Define all possible roles
  const roles = [
    "MANUFACTURER_ROLE",
    "DISTRIBUTOR_ROLE",
    "PHARMACY_ROLE",
    "REGULATOR_ROLE",
    "DEFAULT_ADMIN_ROLE", // Included for checking, but not for granting/revoking via UI
  ];

  // Function to handle checking if an address has a role
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

  // Function to handle granting or revoking a role
  const handleGrantRevoke = async (action) => {
    setError("");
    setAdminResult(null);
    if (!authToken) {
      setError("Authentication token missing. Please log in.");
      return;
    }
    if (!adminAccountAddress || !adminRoleName) {
      setError("Please enter account address and select a role.");
      return;
    }
    setLoading(true);
    try {
      const endpoint = action === "grant" ? "grantRole" : "revokeRole";
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/${endpoint}`,
        {
          roleName: adminRoleName,
          accountAddress: adminAccountAddress,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`, // Add Authorization header
          },
        }
      );
      setAdminResult(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error(
        `${action} role error:`,
        err.response ? err.response.data : err.message
      );
      setError(
        `Error ${action}ing role: ` +
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
        Admin: Manage Roles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        (Requires the server's `MANUFACTURER_PRIVATE_KEY` to have
        `DEFAULT_ADMIN_ROLE`)
      </Typography>
      {/* Grant/Revoke Role Section */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
        <TextField
          label="Account Address to Manage Role"
          variant="outlined"
          value={adminAccountAddress}
          onChange={(e) => setAdminAccountAddress(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel>Role to Grant/Revoke</InputLabel>
          <Select
            value={adminRoleName}
            onChange={(e) => setAdminRoleName(e.target.value)}
            label="Role to Grant/Revoke"
          >
            {roles
              .filter((role) => role !== "DEFAULT_ADMIN_ROLE") // Don't allow granting/revoking DEFAULT_ADMIN_ROLE via UI
              .map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => handleGrantRevoke("grant")}
            disabled={loading}
            sx={{ flexGrow: 1 }}
          >
            {loading ? "Granting..." : "Grant Role"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleGrantRevoke("revoke")}
            disabled={loading}
            sx={{ flexGrow: 1 }}
          >
            {loading ? "Revoking..." : "Revoke Role"}
          </Button>
        </Box>
      </Box>
      {/* Admin Operation Result Display */}
      {adminResult && (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 2,
            bgcolor: adminResult.message.includes("successfully")
              ? "success.light"
              : "error.light",
          }}
        >
          <Typography>
            <strong>Message:</strong> {adminResult.message}
          </Typography>
          {adminResult.transactionHash && (
            <Typography>
              <strong>Transaction Hash:</strong> {adminResult.transactionHash}
            </Typography>
          )}
        </Paper>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      <hr style={{ margin: "40px 0" }} /> {/* Separator */}
      {/* Check Role Section */}
      <Typography variant="h6" component="h3" sx={{ mt: 4 }} gutterBottom>
        Check Role
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Address to Check Role"
          variant="outlined"
          value={checkAddress}
          onChange={(e) => setCheckAddress(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel>Role to Check</InputLabel>
          <Select
            value={checkRole}
            onChange={(e) => setCheckRole(e.target.value)}
            label="Role to Check"
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleCheckRole}
          disabled={loading}
        >
          {loading ? "Checking..." : "Check Role"}
        </Button>
      </Box>
      {/* Role Check Result Display */}
      {roleCheckResult && (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 2,
            bgcolor: roleCheckResult.hasRole
              ? "success.light"
              : "warning.light",
          }}
        >
          <Typography>
            <strong>Address:</strong> {roleCheckResult.address}
          </Typography>
          <Typography>
            <strong>Role:</strong> {roleCheckResult.role}
          </Typography>
          <Typography>
            <strong>Has Role:</strong> {roleCheckResult.hasRole ? "Yes" : "No"}
          </Typography>
        </Paper>
      )}
    </Paper>
  );
}

export default RoleManager;
