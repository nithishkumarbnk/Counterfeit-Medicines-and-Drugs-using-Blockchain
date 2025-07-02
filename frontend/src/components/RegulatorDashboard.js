// frontend/src/components/RegulatorDashboard.js
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import LogViolation from "./LogViolation"; // Import the existing component
import axios from "axios"; // For fetching violation events

function RegulatorDashboard({ API_BASE_URL, authToken }) {
  const [violations, setViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(true);
  const [errorViolations, setErrorViolations] = useState("");

  useEffect(() => {
    const fetchViolations = async () => {
      setLoadingViolations(true);
      setErrorViolations("");
      try {
        // You'll need to implement this endpoint in your backend
        const response = await axios.get(`${API_BASE_URL}/api/violations/all`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setViolations(response.data);
      } catch (err) {
        console.error("Error fetching violations:", err);
        setErrorViolations("Failed to load cold chain violations.");
      } finally {
        setLoadingViolations(false);
      }
    };

    fetchViolations();
  }, [API_BASE_URL, authToken]); // Re-fetch when these change

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Regulator Dashboard
      </Typography>

      {/* Section for Logging New Violations */}
      <LogViolation API_BASE_URL={API_BASE_URL} authToken={authToken} />

      <Divider sx={{ my: 4 }} />

      {/* Section for Listing All Cold Chain Violations */}
      <Typography variant="h5" component="h3" gutterBottom>
        All Cold Chain Violations
      </Typography>
      {loadingViolations ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : errorViolations ? (
        <Typography color="error">{errorViolations}</Typography>
      ) : violations.length > 0 ? (
        <Paper elevation={2} sx={{ p: 2 }}>
          <List>
            {violations.map((violation, index) => (
              <React.Fragment key={violation._id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography variant="h6">
                        Drug ID: {violation.drugId}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Details: {violation.details}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Logged by: {violation.sender} (Tx:{" "}
                          {violation.transactionHash.substring(0, 10)}...)
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Timestamp:{" "}
                          {new Date(violation.eventTimestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < violations.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography>No cold chain violations logged yet.</Typography>
      )}
    </Box>
  );
}

export default RegulatorDashboard;
