// frontend/src/components/DrugList.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import MedicationIcon from "@mui/icons-material/Medication";

function DrugList({ API_BASE_URL, authToken }) {
  const [allDrugsData, setAllDrugsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllDrugs = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/api/getAllDrugs`, {
          headers: {
            Authorization: `Bearer ${authToken}`, // Assuming getAllDrugs might be protected
          },
        });
        setAllDrugsData(response.data);
      } catch (err) {
        console.error(
          "Error fetching all drugs:",
          err.response ? err.response.data : err.message
        );
        setError(
          "Error fetching all drugs: " +
            (err.response &&
              err.response.data &&
              (err.response.data.message || err.response.data.error)) ||
            (err.response && err.response.status
              ? `Status ${err.response.status}: ${err.response.statusText}`
              : err.message) ||
            "Unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllDrugs();
  }, [API_BASE_URL, authToken]); // Re-fetch if API_BASE_URL or authToken changes

  const getStatusColor = (status) => {
    if (status === "MANUFACTURED") return "primary";
    if (status === "IN_TRANSIT") return "info";
    if (status === "DISPENSED" || status === "DISPENSED_TO_PATIENT")
      return "success";
    if (status === "FLAGGED") return "error";
    return "default";
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        mt: 3,
        borderRadius: 3,
        border: "1px solid rgba(148,163,184,0.4)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.03), rgba(56,189,248,0.04))",
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(56,189,248,0.12)",
          }}
        >
          <MedicationIcon sx={{ fontSize: 20, color: "primary.main" }} />
        </Box>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            All Tracked Drugs
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.2 }}>
            View every on-chain drug record with status and current owner.
          </Typography>
        </Box>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            mb: 2,
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <CircularProgress />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading drug records…
            </Typography>
          </Stack>
        </Box>
      ) : error ? (
        <Typography
          color="error"
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          {error}
        </Typography>
      ) : allDrugsData && allDrugsData.length > 0 ? (
        <List sx={{ mt: 2 }}>
          {allDrugsData.map((drug, index) => (
            <React.Fragment key={drug._id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "rgba(15,23,42,0.03)",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        variant="subtitle1"
                        component="span"
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
                        sx={{ display: "block" }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        <b>Product ID:</b>{" "}
                        <Box
                          component="span"
                          sx={{ fontFamily: "monospace", fontSize: 13 }}
                        >
                          {drug.productId || "N/A"}
                        </Box>
                      </Typography>
                      <Typography
                        sx={{ display: "block", mt: 0.3 }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        <b>Current Owner:</b>{" "}
                        <Box
                          component="span"
                          sx={{ fontFamily: "monospace", fontSize: 12 }}
                        >
                          {drug.currentOwnerAddress || "N/A"}
                        </Box>
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < allDrugsData.length - 1 && (
                <Divider
                  component="li"
                  sx={{ my: 0.5, opacity: 0.4, borderStyle: "dashed" }}
                />
              )}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography
          sx={{
            mt: 3,
            px: 1,
            color: "text.secondary",
            fontStyle: "italic",
          }}
        >
          No drugs found in the database.
        </Typography>
      )}
    </Paper>
  );
}

export default DrugList;
