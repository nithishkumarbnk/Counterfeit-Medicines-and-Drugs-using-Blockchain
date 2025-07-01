// frontend/src/App.js
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Tab,
  Tabs,
} from "@mui/material";
import Login from "./components/Login";
import VerifyDrug from "./components/VerifyDrug";
import ManufactureDrug from "./components/ManufactureDrug";
import DrugTransfer from "./components/DrugTransfer";
import LogViolation from "./components/LogViolation";
import RoleManager from "./components/RoleManager";
import DrugList from "./components/DrugList"; // For displaying all drugs

// This variable will be injected by Vercel from your environment variables.
// Example: https://counterfeit-medicines-and-drugs-using.onrender.com
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || null
  );
  const [userRoles, setUserRoles] = useState([]);
  const [loggedInUsername, setLoggedInUsername] = useState(
    localStorage.getItem("loggedInUsername") || ""
  );
  const [currentTab, setCurrentTab] = useState(0); // For managing tabs in the UI

  // Function to fetch user roles after successful login
  // In a real app, this would call a backend endpoint to get roles for the logged-in user
  const fetchUserRoles = (roles) => {
    // Now directly receives roles
    setUserRoles(roles);
  };

  useEffect(() => {
    if (authToken && loggedInUsername) {
      // If token exists on refresh, re-fetch roles (or assume based on username)
      // For this demo, we'll re-fetch from the backend's /api/user/roles endpoint
      const getRolesOnRefresh = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/user/roles`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setUserRoles(response.data.roles);
        } catch (err) {
          console.error("Error fetching roles on refresh:", err);
          setUserRoles(["PUBLIC"]); // Fallback
        }
      };
      getRolesOnRefresh();
    } else {
      setUserRoles(["PUBLIC"]); // Ensure PUBLIC role if not logged in
    }
  }, [authToken, loggedInUsername]); // Re-run if token/username changes

  const handleLoginSuccess = (token, username, roles) => {
    // Now receives roles
    setAuthToken(token);
    setLoggedInUsername(username);
    localStorage.setItem("authToken", token);
    localStorage.setItem("loggedInUsername", username);
    fetchUserRoles(roles); // Pass roles directly
  };
  const handleLogout = () => {
    setAuthToken(null);
    setLoggedInUsername("");
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUsername");
    setUserRoles(["PUBLIC"]);
    setCurrentTab(0); // Reset tab on logout
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Helper function to render tab content
  const renderTabContent = () => {
    if (!authToken) {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          API_BASE_URL={API_BASE_URL}
        />
      );
    }

    switch (currentTab) {
      case 0: // Home/Verify
        return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
      case 1: // Manufacturer
        return userRoles.includes("MANUFACTURER_ROLE") ? (
          <ManufactureDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have MANUFACTURER_ROLE.
          </Typography>
        );
      case 2: // Transfer
        return userRoles.includes("DISTRIBUTOR_ROLE") ||
          userRoles.includes("PHARMACY_ROLE") ? (
          <DrugTransfer API_BASE_URL={API_BASE_URL} authToken={authToken} />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have DISTRIBUTOR_ROLE or PHARMACY_ROLE.
          </Typography>
        );
      case 3: // Log Violation
        return userRoles.includes("REGULATOR_ROLE") ? (
          <LogViolation API_BASE_URL={API_BASE_URL} authToken={authToken} />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have REGULATOR_ROLE.
          </Typography>
        );
      case 4: // All Drugs List
        return <DrugList API_BASE_URL={API_BASE_URL} authToken={authToken} />;
      case 5: // Admin Roles
        return userRoles.includes("ADMIN_ROLE") ? (
          <RoleManager API_BASE_URL={API_BASE_URL} authToken={authToken} />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have ADMIN_ROLE.
          </Typography>
        );
      default:
        return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Anti-Counterfeit Drug System
          </Typography>
          {authToken ? (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {loggedInUsername}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Typography variant="body1">Please Login</Typography>
          )}
        </Toolbar>
      </AppBar>
      {authToken && ( // Show tabs only when logged in
        <AppBar position="static" color="default">
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            aria-label="main navigation tabs"
          >
            <Tab label="Verify Drug" />
            {userRoles.includes("MANUFACTURER_ROLE") && (
              <Tab label="Manufacture" />
            )}
            {(userRoles.includes("DISTRIBUTOR_ROLE") ||
              userRoles.includes("PHARMACY_ROLE")) && <Tab label="Transfer" />}
            {userRoles.includes("REGULATOR_ROLE") && (
              <Tab label="Log Violation" />
            )}
            <Tab label="All Drugs" />
            {userRoles.includes("ADMIN_ROLE") && <Tab label="Admin Roles" />}
          </Tabs>
        </AppBar>
      )}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {renderTabContent()}
      </Container>
    </Box>
  );
}

export default App;
