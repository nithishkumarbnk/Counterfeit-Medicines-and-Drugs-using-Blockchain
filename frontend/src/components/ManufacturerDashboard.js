// src/components/ManufacturerDashboard.js
import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

function ManufacturerDashboard({ API_BASE_URL, authToken, loggedInUsername }) {
  const [form, setForm] = useState({
    productId: "",
    batchId: "",
    metadata: "",
  });
  const [loading, setLoading] = useState(false);
  const [createdDrug, setCreatedDrug] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreateDrug = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCreatedDrug(null);

    try {
      // TODO: adjust endpoint to match your backend route
      const res = await fetch(`${API_BASE_URL}/api/manufacture-drug`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to manufacture drug");
      }

      const data = await res.json();
      setCreatedDrug(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to manufacture drug");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ScienceIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Manufacturer Console
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Create new drug records on-chain with immutable product, batch, and
        manufacturer details.
      </Typography>

      <Grid container spacing={3}>
        {/* Left: Creation form */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={4}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid rgba(56,189,248,0.45)",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AddCircleOutlineIcon sx={{ color: "secondary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                New Drug Batch
              </Typography>
            </Stack>

            <form onSubmit={handleCreateDrug}>
              <Stack spacing={2}>
                <TextField
                  label="Product ID"
                  fullWidth
                  required
                  value={form.productId}
                  onChange={handleChange("productId")}
                  helperText="E.g., internal product SKU"
                />
                <TextField
                  label="Batch ID"
                  fullWidth
                  required
                  value={form.batchId}
                  onChange={handleChange("batchId")}
                  helperText="Batch or lot identifier"
                />
                <TextField
                  label="Additional Metadata (optional)"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.metadata}
                  onChange={handleChange("metadata")}
                  helperText="JSON, notes, or descriptive metadata stored off-chain."
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} />
                    ) : (
                      <AddCircleOutlineIcon />
                    )
                  }
                  sx={{
                    mt: 1,
                    alignSelf: "flex-start",
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Submitting..." : "Mint New Drug Record"}
                </Button>

                {error && (
                  <Typography
                    variant="body2"
                    sx={{ color: "error.main", mt: 1 }}
                  >
                    {error}
                  </Typography>
                )}
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Right: Result / Status */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={4}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid rgba(34,197,94,0.45)",
              minHeight: 200,
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", letterSpacing: 1.5 }}
            >
              Latest Minted
            </Typography>

            {!createdDrug ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 1.5 }}
              >
                Once you create a drug record, its ID, status, and on-chain
                metadata will appear here.
              </Typography>
            ) : (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Drug ID: {createdDrug.id || createdDrug.drugId || "N/A"}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label="MANUFACTURED"
                    color="primary"
                    size="small"
                    sx={{
                      borderRadius: 999,
                      background:
                        "radial-gradient(circle, rgba(34,197,94,0.25), transparent 70%)",
                    }}
                  />
                  <Chip
                    label={`By ${loggedInUsername || "Manufacturer"}`}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 999 }}
                  />
                </Stack>

                <Typography variant="body2">
                  Product ID: <b>{createdDrug.productId || form.productId}</b>
                </Typography>
                <Typography variant="body2">
                  Batch ID: <b>{createdDrug.batchId || form.batchId}</b>
                </Typography>
                <Typography variant="body2">
                  Tx Hash:{" "}
                  <Box
                    component="span"
                    sx={{ fontFamily: "monospace", fontSize: 13 }}
                  >
                    {createdDrug.transactionHash || "N/A"}
                  </Box>
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ManufacturerDashboard;
