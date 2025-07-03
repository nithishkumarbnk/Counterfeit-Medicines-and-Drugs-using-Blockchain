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
import PharmacyDashboard from "./components/PharmacyDashboard";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [authToken, setAuthToken] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [currentTab, setCurrentTab] = useState(0);

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

  // --- THIS IS THE CORRECTED FUNCTION DEFINITION ---
  // It now correctly accepts 'userAddress' as the fourth parameter.
  const handleLoginSuccess = (token, username, roles, userAddress) => {
    setAuthToken(token);
    setLoggedInUsername(username);
    setUserRoles(roles);

    localStorage.setItem("authToken", token);
    localStorage.setItem("loggedInUsername", username);
    // This line will now work correctly because userAddress is defined.
    localStorage.setItem("loggedInUserAddress", userAddress || "");
    localStorage.setItem("userRoles", JSON.stringify(roles));
  };
  // --- END OF FIX ---

  const handleLogout = () => {
    setAuthToken(null);
    setLoggedInUsername("");
    setUserRoles([]);
    setCurrentTab(0);
    localStorage.clear(); // Clears everything from localStorage
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const allTabs = [
    { label: "Verify Drug", requiredRole: null },
    { label: "Manufacture", requiredRole: "MANUFACTURER_ROLE" },
    { label: "Transfer", requiredRole: "DISTRIBUTOR_ROLE" },
    { label: "Dispense", requiredRole: "PHARMACY_ROLE" }, // Changed label for clarity
    { label: "Log Violation", requiredRole: "REGULATOR_ROLE" },
    { label: "All Drugs", requiredRole: null },
    { label: "Admin Roles", requiredRole: "ADMIN_ROLE" },
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (!tab.requiredRole) return true;
    return userRoles.includes(tab.requiredRole);
  });

  const renderTabContent = () => {
    if (!authToken) {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          API_BASE_URL={API_BASE_URL}
        />
      );
    }

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
      case "Dispense": // Matches new label
        return (
          <PharmacyDashboard
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
          <AdminDashboard API_BASE_URL={API_BAsE_URL} authToken={authToken} />
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
      {authToken && (
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
            {visibleTabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
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
