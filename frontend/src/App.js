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
import DrugList from "./components/DrugList";
import ManufacturerDashboard from "./components/ManufacturerDashboard";
import DistributorPharmacyDashboard from "./components/DistributorPharmacyDashboard";
import RegulatorDashboard from "./components/RegulatorDashboard";
import AdminDashboard from "./components/AdminDashboard";

// This variable will be injected by Vercel from your environment variables.
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || null
  );
  const [userRoles, setUserRoles] = useState(
    JSON.parse(localStorage.getItem("userRoles")) || []
  );
  const [loggedInUsername, setLoggedInUsername] = useState(
    localStorage.getItem("loggedInUsername") || ""
  );
  const [currentTab, setCurrentTab] = useState(0);

  // This effect runs only once on component mount to sync state from localStorage
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("loggedInUsername");
    const roles = localStorage.getItem("userRoles");
    if (token && username && roles) {
      setAuthToken(token);
      setLoggedInUsername(username);
      setUserRoles(JSON.parse(roles));
    }
  }, []);

  const handleLoginSuccess = (token, username, roles, userAddress) => {
    // Store all relevant info in state and localStorage
    setAuthToken(token);
    setLoggedInUsername(username);
    setUserRoles(roles);

    localStorage.setItem("authToken", token);
    localStorage.setItem("loggedInUsername", username);
    localStorage.setItem("loggedInUserAddress", userAddress || ""); // Ensure address is stored
    localStorage.setItem("userRoles", JSON.stringify(roles)); // Store roles as a string
  };

  const handleLogout = () => {
    // Clear state
    setAuthToken(null);
    setLoggedInUsername("");
    setUserRoles([]);
    setCurrentTab(0);

    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUsername");
    localStorage.removeItem("loggedInUserAddress");
    localStorage.removeItem("userRoles");
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // --- DYNAMIC TAB CONFIGURATION (THE FIX) ---
  const allTabs = [
    { label: "Verify Drug", requiredRole: null }, // Always visible
    { label: "Manufacture", requiredRole: "MANUFACTURER_ROLE" },
    { label: "Transfer", requiredRole: "DISTRIBUTOR_ROLE" }, // Special case handled below
    { label: "Log Violation", requiredRole: "REGULATOR_ROLE" },
    { label: "All Drugs", requiredRole: null }, // Always visible
    { label: "Admin Roles", requiredRole: "ADMIN_ROLE" },
  ];

  // Filter tabs based on the current user's roles
  const visibleTabs = allTabs.filter((tab) => {
    if (!tab.requiredRole) return true; // Show tabs with no required role
    // Special case for the Transfer tab (visible for both Distributor and Pharmacy)
    if (tab.label === "Transfer") {
      return (
        userRoles.includes("DISTRIBUTOR_ROLE") ||
        userRoles.includes("PHARMACY_ROLE")
      );
    }
    return userRoles.includes(tab.requiredRole);
  });
  // --- END OF DYNAMIC TAB FIX ---

  // --- NEW RENDER FUNCTION (THE FIX) ---
  const renderTabContent = () => {
    if (!authToken) {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          API_BASE_URL={API_BASE_URL}
        />
      );
    }

    // Get the label of the currently selected tab from our dynamic list
    const selectedTabLabel = visibleTabs[currentTab]?.label;

    switch (selectedTabLabel) {
      case "Verify Drug":
        return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;

      case "Manufacture":
        return (
          <ManufacturerDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
            loggedInUsername={loggedInUsername}
          />
        );

      case "Transfer":
        return (
          <DistributorPharmacyDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
          />
        );

      case "Log Violation":
        return (
          <RegulatorDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
          />
        );

      case "All Drugs":
        return <DrugList API_BASE_URL={API_BASE_URL} authToken={authToken} />;

      case "Admin Roles":
        return (
          <AdminDashboard API_BASE_URL={API_BASE_URL} authToken={authToken} />
        );

      default:
        // Fallback to the first visible tab's content if something goes wrong
        return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
    }
  };
  // --- END OF NEW RENDER FUNCTION ---

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
      {authToken && (
        <AppBar position="static" color="default">
          {/* --- NEW TABS RENDERING (THE FIX) --- */}
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            aria-label="main navigation tabs"
          >
            {visibleTabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
          {/* --- END OF NEW TABS RENDERING --- */}
        </AppBar>
      )}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {renderTabContent()}
      </Container>
    </Box>
  );
}

export default App;
