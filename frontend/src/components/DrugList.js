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
} from "@mui/material";

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

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        All Tracked Drugs
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      ) : allDrugsData && allDrugsData.length > 0 ? (
        <List>
          {allDrugsData.map((drug, index) => (
            <React.Fragment key={drug._id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="h6" component="span">
                      Drug ID: {drug._id}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        sx={{ display: "inline" }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        Product ID: {drug.productId}
                      </Typography>
                      <br />
                      <Typography
                        sx={{ display: "inline" }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        Status: {drug.status}
                      </Typography>
                      <br />
                      <Typography
                        sx={{ display: "inline" }}
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
              {index < allDrugsData.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography>No drugs found in the database.</Typography>
      )}
    </Paper>
  );
}

export default DrugList;
