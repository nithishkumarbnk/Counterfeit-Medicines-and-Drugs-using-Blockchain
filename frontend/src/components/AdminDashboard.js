// frontend/src/components/AdminDashboard.js
import React from "react";
import { Typography, Box } from "@mui/material";
import RoleManager from "./RoleManager"; // Import the existing component

function AdminDashboard({ API_BASE_URL, authToken }) {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Section for Role Management */}
      <RoleManager API_BASE_URL={API_BASE_URL} authToken={authToken} />

      {/* You could add more admin-specific features here, e.g.,
          - System statistics (total drugs, total transfers)
          - User management (if you implement a user database)
          - Contract upgrade features (advanced)
      */}
    </Box>
  );
}

export default AdminDashboard;
