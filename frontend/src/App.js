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
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper,
  Chip,
  Stack,
  Divider,
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

// ---------- THEME (visuals only, no logic change) ----------
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#22c55e" }, // neon green
    secondary: { main: "#38bdf8" }, // cyan
    background: {
      default: "#020617", // slate-950
      paper: "rgba(15,23,42,0.92)", // slate-900 with glass feel
    },
    text: {
      primary: "#e5e7eb",
      secondary: "#9ca3af",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      '"Fira Sans"',
      '"Droid Sans"',
      '"Helvetica Neue"',
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(18px)",
          backgroundImage:
            "radial-gradient(circle at top left, rgba(56,189,248,0.14), transparent 55%), radial-gradient(circle at bottom right, rgba(168,85,247,0.14), transparent 55%)",
        },
      },
    },
  },
});

function App() {
  // --------- STATE (unchanged logic) ----------
  const [authToken, setAuthToken] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [loggedInUserAddress, setLoggedInUserAddress] = useState("");
  const [currentTab, setCurrentTab] = useState(0);

  // Restore session from localStorage (same idea, just slightly safer)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("loggedInUsername");
    const roles = localStorage.getItem("userRoles");
    const address = localStorage.getItem("loggedInUserAddress");

    if (token && username && roles) {
      setAuthToken(token);
      setLoggedInUsername(username);
      setUserRoles(JSON.parse(roles));
      if (address) setLoggedInUserAddress(address);
    }
  }, []);

  const handleLoginSuccess = (token, username, roles, userAddress) => {
    setAuthToken(token);
    setLoggedInUsername(username);
    setUserRoles(roles || []);
    setLoggedInUserAddress(userAddress || "");

    localStorage.setItem("authToken", token);
    localStorage.setItem("loggedInUsername", username);
    localStorage.setItem("userRoles", JSON.stringify(roles || []));
    localStorage.setItem("loggedInUserAddress", userAddress || "");
    setCurrentTab(0);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setLoggedInUsername("");
    setUserRoles([]);
    setLoggedInUserAddress("");
    setCurrentTab(0);
    localStorage.clear();
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // --------- TABS / ROLE LOGIC (unchanged) ----------
  const allTabs = [
    { label: "Verify Drug", requiredRole: null },
    { label: "Manufacture", requiredRole: "MANUFACTURER_ROLE" },
    { label: "Transfer", requiredRole: "DISTRIBUTOR_ROLE" },
    { label: "Dispense", requiredRole: "PHARMACY_ROLE" },
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
        <Box
          sx={{
            display: "flex",
            minHeight: "60vh",
            alignItems: "stretch",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Left: marketing / info panel */}
          <Paper
            elevation={6}
            sx={{
              flex: 1.1,
              p: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1px solid rgba(129,140,248,0.35)",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "secondary.main",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                On-Chain Integrity
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                  mb: 1.5,
                  background: "linear-gradient(120deg,#a855f7,#22c55e,#38bdf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Anti-Counterfeit Drug Tracking DApp
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 2 }}
              >
                Verify every product’s journey from manufacturer to pharmacy
                using transparent, tamper-proof blockchain records. Designed for
                regulators, manufacturers, distributors, and pharmacies.
              </Typography>
              <Stack spacing={1.2} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  • Real-time tracking of each drug ID on Sepolia.
                </Typography>
                <Typography variant="body2">
                  • Role-based dashboards for supply-chain actors.
                </Typography>
                <Typography variant="body2">
                  • Cold-chain violation logs and audit-ready history.
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2, borderColor: "rgba(148,163,184,0.35)" }} />
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                Powered by Ethereum Sepolia • Backed by MongoDB Atlas • Web3
                enabled backend
              </Typography>
            </Box>
          </Paper>

          {/* Right: login panel */}
          <Paper
            elevation={6}
            sx={{
              flex: 1,
              p: 3,
              border: "1px solid rgba(34,197,94,0.45)",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "primary.light" }}
            >
              Sign in to continue
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Use your registered credentials to access your role-based control
              panel and start interacting with the DrugTracking smart contract.
            </Typography>
            <Login
              onLoginSuccess={handleLoginSuccess}
              API_BASE_URL={API_BASE_URL}
            />
          </Paper>
        </Box>
      );
    }

    // When logged in: render the selected dashboard / view
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
            userAddress={loggedInUserAddress}
          />
        );
      case "Dispense":
        return (
          <PharmacyDashboard
            API_BASE_URL={API_BASE_URL}
            authToken={authToken}
            userAddress={loggedInUserAddress}
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
        return <VerifyDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />;
    }
  };

  const shortAddress =
    loggedInUserAddress && loggedInUserAddress.length > 10
      ? `${loggedInUserAddress.slice(0, 6)}...${loggedInUserAddress.slice(-4)}`
      : loggedInUserAddress || "N/A";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          backgroundImage:
            "radial-gradient(circle at top, rgba(56,189,248,0.19), transparent 60%), radial-gradient(circle at bottom, rgba(168,85,247,0.22), transparent 60%)",
        }}
      >
        {/* TOP NAVBAR */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92))",
            borderBottom: "1px solid rgba(148,163,184,0.35)",
          }}
        >
          <Toolbar sx={{ minHeight: 70 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1.2,
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "30%",
                  background:
                    "conic-gradient(from 180deg, #22c55e, #38bdf8, #a855f7, #22c55e)",
                  boxShadow: "0 0 16px rgba(56,189,248,0.65)",
                }}
              />
              <span>DrugChain Sentinel</span>
            </Typography>

            {authToken ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Logged in as
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, lineHeight: 1.2 }}
                  >
                    {loggedInUsername || "User"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "monospace", color: "secondary.main" }}
                  >
                    {shortAddress}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    px: 2.5,
                    borderColor: "rgba(148,163,184,0.7)",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "rgba(34,197,94,0.1)",
                    },
                  }}
                >
                  Logout
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Connect with your credentials to access the DApp
              </Typography>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: authToken ? 3 : 6 }}>
          {/* SESSION SUMMARY + ROLES (only when logged in) */}
          {authToken && (
            <Paper
              elevation={5}
              sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,0.5)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "secondary.light",
                      letterSpacing: 1.5,
                    }}
                  >
                    Active Session
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {loggedInUsername}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Address:{" "}
                    <Box
                      component="span"
                      sx={{
                        fontFamily: "monospace",
                        color: "secondary.main",
                      }}
                    >
                      {shortAddress}
                    </Box>
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: 1.5,
                      mb: 0.5,
                      display: "block",
                    }}
                  >
                    Roles
                  </Typography>
                  {userRoles && userRoles.length > 0 ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {userRoles.map((role) => (
                        <Chip
                          key={role}
                          label={role.replace("_ROLE", "")}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            borderRadius: 999,
                            borderColor: "rgba(34,197,94,0.75)",
                            background:
                              "radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)",
                          }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontStyle: "italic" }}
                    >
                      No on-chain roles detected for this account.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          )}

          {/* NAV TABS (authenticated only) */}
          {authToken && visibleTabs.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                mb: 3,
                borderRadius: 999,
                px: 1.5,
                border: "1px solid rgba(148,163,184,0.45)",
                background:
                  "linear-gradient(90deg, rgba(15,23,42,0.96), rgba(30,64,175,0.85))",
              }}
            >
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                textColor="inherit"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 500,
                    minHeight: 52,
                    px: 2,
                  },
                  "& .Mui-selected": {
                    color: "#e5e7eb",
                  },
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: 999,
                  },
                }}
              >
                {visibleTabs.map((tab, index) => (
                  <Tab key={index} label={tab.label} />
                ))}
              </Tabs>
            </Paper>
          )}

          {/* MAIN CONTENT */}
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              p: { xs: 2.5, md: 3.5 },
              border: "1px solid rgba(148,163,184,0.45)",
              minHeight: authToken ? "55vh" : "auto",
            }}
          >
            {renderTabContent()}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
