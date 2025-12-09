// frontend/src/components/AdminDashboard.js
import React from "react";
import { Typography, Box, Paper, Stack } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import RoleManager from "./RoleManager";

function AdminDashboard({ API_BASE_URL, authToken }) {
  return (
    <Box sx={{ mt: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.8} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "12px",
            bgcolor: "rgba(59,130,246,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <AdminPanelSettingsIcon
            sx={{ fontSize: 25, color: "primary.main" }}
          />
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Assign blockchain roles and manage trust in supply chain.
          </Typography>
        </Box>
      </Stack>

      {/* Main Admin Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.25)",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.85), rgba(241,245,249,0.9))",
          boxShadow:
            "0px 4px 12px rgba(0,0,0,0.05), inset 0px 1px 0px rgba(255,255,255,0.4)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2.5,
            fontWeight: 600,
            color: "text.primary",
            letterSpacing: 0.3,
          }}
        >
          Blockchain Role Management
        </Typography>

        <RoleManager API_BASE_URL={API_BASE_URL} authToken={authToken} />
      </Paper>
    </Box>
  );
}

export default AdminDashboard;
