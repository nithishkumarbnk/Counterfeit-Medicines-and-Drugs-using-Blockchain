// frontend/src/components/ManufacturerDashboard.js
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
import ManufactureDrug from "./ManufactureDrug"; // Import the existing component
import axios from "axios"; // For fetching manufacturer-specific drugs

function ManufacturerDashboard({ API_BASE_URL, authToken, loggedInUsername }) {
  const [manufacturedDrugs, setManufacturedDrugs] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(true);
  const [errorDrugs, setErrorDrugs] = useState("");

  useEffect(() => {
    const fetchManufacturedDrugs = async () => {
      if (!loggedInUsername) {
        setLoadingDrugs(false);
        return;
      }
      setLoadingDrugs(true);
      setErrorDrugs("");
      try {
        // You'll need to implement this endpoint in your backend
        const response = await axios.get(
          `${API_BASE_URL}/api/drugs/byManufacturer/${loggedInUsername}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        setManufacturedDrugs(response.data);
      } catch (err) {
        console.error("Error fetching manufactured drugs:", err);
        setErrorDrugs("Failed to load your manufactured drugs.");
      } finally {
        setLoadingDrugs(false);
      }
    };

    fetchManufacturedDrugs();
  }, [API_BASE_URL, authToken, loggedInUsername]); // Re-fetch when these change

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Manufacturer Dashboard
      </Typography>

      {/* Section for Manufacturing New Drugs */}
      <ManufactureDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />

      <Divider sx={{ my: 4 }} />

      {/* Section for Listing Manufactured Drugs */}
      <Typography variant="h5" component="h3" gutterBottom>
        Your Manufactured Drugs
      </Typography>
      {loadingDrugs ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : errorDrugs ? (
        <Typography color="error">{errorDrugs}</Typography>
      ) : manufacturedDrugs.length > 0 ? (
        <Paper elevation={2} sx={{ p: 2 }}>
          <List>
            {manufacturedDrugs.map((drug, index) => (
              <React.Fragment key={drug._id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={<Typography variant="h6">{drug._id}</Typography>}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Product ID: {drug.productId}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Batch ID: {drug.batchId}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Status: {drug.status}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Current Owner: {drug.currentOwnerAddress}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < manufacturedDrugs.length - 1 && (
                  <Divider component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography>No drugs manufactured by you yet.</Typography>
      )}
    </Box>
  );
}

export default ManufacturerDashboard;
