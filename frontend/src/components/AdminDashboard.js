// frontend/src/components/AdminDashboard.js
import React from "react";
import { Typography, Box, Stack } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import RoleManager from "./RoleManager";

function AdminDashboard({ API_BASE_URL, authToken }) {
  return (
    <Box sx={{ mt: 4 }}>
      {/* Page Header */}
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
            Manage access and verify role permissions.
          </Typography>
        </Box>
      </Stack>

      {/* Two-Panel Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <RoleManager API_BASE_URL={API_BASE_URL} authToken={authToken} />
      </Box>
    </Box>
  );
}

export default AdminDashboard;
