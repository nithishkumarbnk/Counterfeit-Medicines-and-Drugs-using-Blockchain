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
  Chip,
  Stack,
} from "@mui/material";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import axios from "axios";
import ManufactureDrug from "./ManufactureDrug";

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
  }, [API_BASE_URL, authToken, loggedInUsername]);

  const getStatusColor = (status) => {
    if (status === "MANUFACTURED") return "primary";
    if (status === "IN_TRANSIT") return "info";
    if (status === "DISPENSED" || status === "DISPENSED_TO_PATIENT")
      return "success";
    if (status === "FLAGGED") return "error";
    return "default";
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Main Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "rgba(56,189,248,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PrecisionManufacturingIcon
            sx={{ fontSize: 22, color: "primary.main" }}
          />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Manufacturer Dashboard
        </Typography>
      </Stack>

      {/* Existing Manufacture Component */}
      <ManufactureDrug API_BASE_URL={API_BASE_URL} authToken={authToken} />

      <Divider sx={{ my: 4 }} />

      {/* Manufactured Drugs Section */}
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Your Manufactured Drugs
      </Typography>

      {loadingDrugs ? (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <CircularProgress />
          <Typography sx={{ mt: 1 }} variant="body2" color="text.secondary">
            Fetching records…
          </Typography>
        </Box>
      ) : errorDrugs ? (
        <Typography
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
          color="error"
        >
          {errorDrugs}
        </Typography>
      ) : manufacturedDrugs.length > 0 ? (
        <Paper
          elevation={4}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.4)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.03), rgba(56,189,248,0.04))",
          }}
        >
          <List>
            {manufacturedDrugs.map((drug, index) => (
              <React.Fragment key={drug._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 1.5,
                    py: 1.2,
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "rgba(15,23,42,0.04)",
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          Drug ID:{" "}
                          <Box
                            component="span"
                            sx={{ fontFamily: "monospace", fontSize: 14 }}
                          >
                            {drug._id}
                          </Box>
                        </Typography>

                        <Chip
                          label={drug.status || "UNKNOWN"}
                          size="small"
                          color={getStatusColor(drug.status)}
                          sx={{ borderRadius: 999 }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ display: "block", mt: 0.3 }}
                        >
                          <b>Product:</b>{" "}
                          <Box
                            component="span"
                            sx={{ fontFamily: "monospace", fontSize: 13 }}
                          >
                            {drug.productId}
                          </Box>
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ display: "block", mt: 0.3 }}
                        >
                          <b>Batch:</b>{" "}
                          <Box
                            component="span"
                            sx={{ fontFamily: "monospace", fontSize: 13 }}
                          >
                            {drug.batchId}
                          </Box>
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ display: "block", mt: 0.3 }}
                          color="text.primary"
                        >
                          <b>Current Owner:</b>{" "}
                          <Box
                            component="span"
                            sx={{ fontFamily: "monospace", fontSize: 12 }}
                          >
                            {drug.currentOwnerAddress}
                          </Box>
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                {index < manufacturedDrugs.length - 1 && (
                  <Divider
                    component="li"
                    sx={{ my: 1, opacity: 0.4, borderStyle: "dashed" }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography
          sx={{
            fontStyle: "italic",
            color: "text.secondary",
            mt: 2,
          }}
        >
          You haven't manufactured any drugs yet.
        </Typography>
      )}
    </Box>
  );
}

export default ManufacturerDashboard;
