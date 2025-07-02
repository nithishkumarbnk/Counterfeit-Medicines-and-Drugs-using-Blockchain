// frontend/src/components/DistributorPharmacyDashboard.js
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
import DrugTransfer from "./DrugTransfer"; // Import the existing component
import axios from "axios"; // For fetching owner-specific drugs

function DistributorPharmacyDashboard({
  API_BASE_URL,
  authToken,
  loggedInUsername,
}) {
  const [ownedDrugs, setOwnedDrugs] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(true);
  const [errorDrugs, setErrorDrugs] = useState("");
  const loggedInUserAddress = localStorage.getItem("loggedInUserAddress"); // NEW: Get address from local storage

  useEffect(() => {
    const fetchOwnedDrugs = async () => {
      if (!loggedInUserAddress) {
        setLoadingDrugs(false);
        return;
      }

      setLoadingDrugs(true);
      setErrorDrugs("");
      try {
        // You'll need to implement this endpoint in your backend
        const response = await axios.get(
          `${API_BASE_URL}/api/drugs/byCurrentOwner/${loggedInUserAddress}`,
          {
            // Use loggedInUserAddress
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        setOwnedDrugs(response.data);
      } catch (err) {
        console.error("Error fetching owned drugs:", err);
        setErrorDrugs("Failed to load your owned drugs.");
      } finally {
        setLoadingDrugs(false);
      }
    };

    fetchOwnedDrugs();
  }, [API_BASE_URL, authToken, loggedInUserAddress]); // Re-fetch when these change

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Distributor / Pharmacy Dashboard
      </Typography>

      {/* Section for Transferring Drugs */}
      <DrugTransfer API_BASE_URL={API_BASE_URL} authToken={authToken} />

      <Divider sx={{ my: 4 }} />

      {/* Section for Listing Owned Drugs */}
      <Typography variant="h5" component="h3" gutterBottom>
        Drugs Currently Under Your Ownership
      </Typography>
      {loadingDrugs ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : errorDrugs ? (
        <Typography color="error">{errorDrugs}</Typography>
      ) : ownedDrugs.length > 0 ? (
        <Paper elevation={2} sx={{ p: 2 }}>
          <List>
            {ownedDrugs.map((drug, index) => (
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
                          Manufacturer: {drug.manufacturerAddress}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < ownedDrugs.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography>No drugs currently under your ownership.</Typography>
      )}
    </Box>
  );
}

export default DistributorPharmacyDashboard;
