// src/components/AdminDashboard.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Chip,
  MenuItem,
  CircularProgress,
  Divider,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const ROLE_OPTIONS = [
  { value: "MANUFACTURER_ROLE", label: "Manufacturer" },
  { value: "DISTRIBUTOR_ROLE", label: "Distributor" },
  { value: "PHARMACY_ROLE", label: "Pharmacy" },
  { value: "REGULATOR_ROLE", label: "Regulator" },
  { value: "ADMIN_ROLE", label: "Admin" },
];

function AdminDashboard({ API_BASE_URL, authToken }) {
  const [address, setAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("MANUFACTURER_ROLE");
  const [loading, setLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState("");
  const [error, setError] = useState("");
  const [userRoles, setUserRoles] = useState(null);
  const [checkAddress, setCheckAddress] = useState("");
  const [checkingRoles, setCheckingRoles] = useState(false);

  const handleAssignRole = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setAssignMessage("");

    try {
      // TODO: adjust endpoint to match your backend
      const res = await fetch(`${API_BASE_URL}/api/admin/assign-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          address: address.trim(),
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to assign role");
      }

      setAssignMessage("Role successfully assigned on-chain and in backend.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to assign role");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRoles = async () => {
    if (!checkAddress.trim()) return;
    setCheckingRoles(true);
    setError("");
    setUserRoles(null);

    try {
      // TODO: adjust endpoint to match your backend
      const res = await fetch(
        `${API_BASE_URL}/api/admin/user-roles?address=${encodeURIComponent(
          checkAddress.trim()
        )}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to fetch user roles");
      }

      const data = await res.json();
      setUserRoles(data.roles || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch user roles");
    } finally {
      setCheckingRoles(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ShieldIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Admin Role Management
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Grant and inspect roles that control which on-chain operations users can
        perform in the DApp.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Assign roles */}
        <Paper
          elevation={4}
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            border: "1px solid rgba(34,197,94,0.5)",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <AdminPanelSettingsIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Assign Role
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="User Address (0x...)"
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              InputProps={{
                sx: { fontFamily: "monospace", fontSize: 13 },
              }}
            />
            <TextField
              select
              label="Role"
              fullWidth
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              onClick={handleAssignRole}
              disabled={loading}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              {loading ? "Assigning..." : "Assign Role"}
            </Button>

            {assignMessage && (
              <Typography
                variant="body2"
                sx={{ color: "primary.main", mt: 0.5 }}
              >
                {assignMessage}
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* Check roles */}
        <Paper
          elevation={4}
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            border: "1px solid rgba(56,189,248,0.5)",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <PersonSearchIcon sx={{ color: "secondary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Inspect User Roles
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="User Address (0x...)"
              fullWidth
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              InputProps={{
                sx: { fontFamily: "monospace", fontSize: 13 },
              }}
            />

            <Button
              variant="outlined"
              onClick={handleCheckRoles}
              disabled={checkingRoles}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {checkingRoles ? "Checking..." : "Check Roles"}
            </Button>

            {error && (
              <Typography variant="body2" sx={{ color: "error.main", mt: 0.5 }}>
                {error}
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />

            {userRoles && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  Detected roles for this address:
                </Typography>
                {userRoles.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    No roles assigned.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {userRoles.map((r) => (
                      <Chip
                        key={r}
                        label={r.replace("_ROLE", "")}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 999 }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

export default AdminDashboard;
