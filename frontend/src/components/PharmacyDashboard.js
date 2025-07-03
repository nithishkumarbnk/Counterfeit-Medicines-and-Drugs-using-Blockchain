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
  TextField,
  Button,
  Alert,
} from "@mui/material";
import axios from "axios";

// This form component for dispensing remains unchanged and is correct.
function DispenseDrugForm({ API_BASE_URL, authToken, onDispenseSuccess }) {
  const [drugId, setDrugId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDispense = async () => {
    if (!drugId) {
      setError("Drug ID is required.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/drug/dispense`,
        { drugId: drugId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setSuccess(
        `Drug ${drugId} successfully dispensed. TxHash: ${response.data.transactionHash}`
      );
      setDrugId("");
      if (onDispenseSuccess) {
        onDispenseSuccess();
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "An unknown error occurred.";
      setError(`Failed to dispense drug: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom>
        Dispense Drug to Patient
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This action marks the drug as sold and removes it from the active supply
        chain.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Drug ID to Dispense"
          variant="outlined"
          value={drugId}
          onChange={(e) => setDrugId(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleDispense}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Dispense Drug"}
        </Button>
        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </Paper>
  );
}

// --- Main Dashboard Component ---
// --- FIX: It now accepts 'userAddress' as a prop ---
function PharmacyDashboard({ API_BASE_URL, authToken, userAddress }) {
  const [ownedDrugs, setOwnedDrugs] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(true);
  const [errorDrugs, setErrorDrugs] = useState("");

  const fetchOwnedDrugs = async () => {
    // --- FIX: It now uses the 'userAddress' prop directly ---
    if (!userAddress) {
      setErrorDrugs(
        "Could not find your Ethereum address. Please log in again."
      );
      setLoadingDrugs(false);
      return;
    }

    setLoadingDrugs(true);
    setErrorDrugs("");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/drugs/byCurrentOwner/${userAddress}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setOwnedDrugs(
        response.data.filter((drug) => drug.status !== "DISPENSED_TO_PATIENT")
      );
    } catch (err) {
      console.error("Error fetching owned drugs:", err);
      setErrorDrugs("Failed to load your owned drugs.");
    } finally {
      setLoadingDrugs(false);
    }
  };

  // --- FIX: The useEffect hook now depends on 'userAddress' ---
  useEffect(() => {
    fetchOwnedDrugs();
  }, [API_BASE_URL, authToken, userAddress]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Pharmacy Dashboard
      </Typography>
      <DispenseDrugForm
        API_BASE_URL={API_BASE_URL}
        authToken={authToken}
        onDispenseSuccess={fetchOwnedDrugs}
      />
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" component="h3" gutterBottom>
        Drugs in Your Inventory
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
              <React.Fragment key={drug.id || index}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography variant="h6">Drug ID: {drug.id}</Typography>
                    }
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
        <Typography>You do not have any drugs in your inventory.</Typography>
      )}
    </Box>
  );
}

export default PharmacyDashboard;
