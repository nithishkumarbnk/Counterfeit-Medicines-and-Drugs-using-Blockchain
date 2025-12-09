// frontend/src/components/AdminDashboard.js
import React from "react";
import { Typography, Box, Paper, Stack } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import RoleManager from "./RoleManager"; // Import the existing component

function AdminDashboard({ API_BASE_URL, authToken }) {
  return (
    <Box sx={{ mt: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "rgba(96,165,250,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AdminPanelSettingsIcon
            sx={{ fontSize: 22, color: "primary.main" }}
          />
        </Box>
        <Box>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.3 }}>
            Manage roles and permissions across the drug tracking network.
          </Typography>
        </Box>
      </Stack>

      {/* Role Management Section */}
      <Paper
        elevation={4}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.4)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.03), rgba(59,130,246,0.05))",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 1.5, fontWeight: 600, color: "text.primary" }}
        >
          Role Management
        </Typography>

        <RoleManager API_BASE_URL={API_BASE_URL} authToken={authToken} />

        {/* 
          You could add more admin-specific features here, e.g.,
          - System statistics (total drugs, total transfers)
          - User management (if you implement a user database)
          - Contract upgrade features (advanced)
        */}
      </Paper>
    </Box>
  );
}

export default AdminDashboard;
