// frontend/src/App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
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
// Import individual forms if still used directly, otherwise remove
// import DrugManufacturer from "./components/DrugManufacturer";
// import DrugTransfer from "./components/DrugTransfer";
// import LogViolation from "./components/LogViolation";
// import RoleManager from "./components/RoleManager";
import DrugList from "./components/DrugList";

// Import the new Dashboard components
import ManufacturerDashboard from "./components/ManufacturerDashboard";
import DistributorPharmacyDashboard from "./components/DistributorPharmacyDashboard";
import RegulatorDashboard from "./components/RegulatorDashboard"; // NEW IMPORT
import AdminDashboard from "./components/AdminDashboard"; // NEW IMPORT

// This variable will be injected by Vercel from your environment variables.
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || null
  );
  const [userRoles, setUserRoles] = useState([]);
  const [loggedInUsername, setLoggedInUsername] = useState(
    localStorage.getItem("loggedInUsername") || ""
  );
  const [currentTab, setCurrentTab] = useState(0);

  const fetchUserRoles = async (username) => {
    // This function is now simplified as roles come directly from login
    // For the purpose of this App.js, we'll simulate roles based on username
    // This part is primarily for initial setup/refresh and could be replaced
    // by a backend call to /api/user/roles if you implement that.
    const TEST_USERS = [
      // Re-define TEST_USERS here or ensure it's imported/accessible
      {
        username: "admin",
        password: "adminPassword",
        roles: [
          "ADMIN_ROLE",
          "MANUFACTURER_ROLE",
          "REGULATOR_ROLE",
          "DISTRIBUTOR_ROLE",
          "PHARMACY_ROLE",
        ],
      },
      {
        username: "manufacturer",
        password: "manuPassword",
        roles: ["MANUFACTURER_ROLE"],
      },
      {
        username: "distributor",
        password: "distPassword",
        roles: ["DISTRIBUTOR_ROLE"],
      },
      {
        username: "pharmacy",
        password: "pharmPassword",
        roles: ["PHARMACY_ROLE"],
      },
      {
        username: "regulator",
        password: "regPassword",
        roles: ["REGULATOR_ROLE"],
      },
      { username: "public", password: "publicPassword", roles: ["PUBLIC"] },
    ];
    const user = TEST_USERS.find((u) => u.username === username);
    if (user) {
      setUserRoles(user.roles);
    } else {
      setUserRoles(["PUBLIC"]);
    }
  };

  useEffect(() => {
    if (authToken && loggedInUsername) {
      const getRolesOnRefresh = async () => {
        try {
          // If you implement /api/user/roles in backend, use this:
          // const response = await axios.get(`${API_BASE_URL}/api/user/roles`, {
          //   headers: { Authorization: `Bearer ${authToken}` }
          // });
          // setUserRoles(response.data.roles);
          fetchUserRoles(loggedInUsername); // Using simulated roles for now
        } catch (err) {
          console.error("Error fetching roles on refresh:", err);
          setUserRoles(["PUBLIC"]);
        }
      };
      getRolesOnRefresh();
    } else {
      setUserRoles(["PUBLIC"]);
    }
  }, [authToken, loggedInUsername]);

  const handleLoginSuccess = (token, username, roles) => {
    setAuthToken(token);
    setLoggedInUsername(username);
    localStorage.setItem("authToken", token);
    localStorage.setItem("loggedInUsername", username);
    setUserRoles(roles); // Directly set roles from login response
  };

  const handleLogout = () => {
    setAuthToken(null);
    setLoggedInUsername("");
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUsername");
    setUserRoles(["PUBLIC"]);
    setCurrentTab(0);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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
      case 0: // Verify Drug (Publicly accessible)
        return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
      case 1: // Manufacturer Dashboard
        return userRoles.includes("MANUFACTURER_ROLE") ? (
          <ManufacturerDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
            loggedInUsername={loggedInUsername}
          />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have MANUFACTURER_ROLE.
          </Typography>
        );
      case 2: // Distributor/Pharmacy Dashboard
        return userRoles.includes("DISTRIBUTOR_ROLE") ||
          userRoles.includes("PHARMACY_ROLE") ? (
          <DistributorPharmacyDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
            loggedInUsername={loggedInUsername}
          />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have DISTRIBUTOR_ROLE or PHARMACY_ROLE.
          </Typography>
        );
      case 3: // Regulator Dashboard
        return userRoles.includes("REGULATOR_ROLE") ? (
          <RegulatorDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
          />
        ) : (
          <Typography variant="h6" color="error" sx={{ mt: 4 }}>
            Access Denied: You do not have REGULATOR_ROLE.
          </Typography>
        );
      case 4: // All Drugs List
        return <DrugList API_BASE_URL={API_BASE_URL} authToken={authToken} />;
      case 5: // Admin Dashboard
        return userRoles.includes("ADMIN_ROLE") ? (
          <AdminDashboard API_BASE_URL={API_BASE_URL} authToken={authToken} />
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
