// src/components/VerifyDrug.js
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

function VerifyDrug({ API_BASE_URL, authToken }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // TODO: adjust endpoint to match your backend route
      const res = await fetch(
        `${API_BASE_URL}/api/verify-drug?drugId=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to verify drug");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to verify drug");
    } finally {
      setLoading(false);
    }
  };

  const openOnEtherscan = () => {
    if (!result || !result.transactionHash) return;
    // Sepolia explorer
    window.open(
      `https://sepolia.etherscan.io/tx/${result.transactionHash}`,
      "_blank"
    );
  };

  const statusColor =
    result?.status === "VALID"
      ? "success"
      : result?.status === "SUSPICIOUS"
      ? "warning"
      : result?.status === "COUNTERFEIT"
      ? "error"
      : "default";

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
        Verify Drug Authenticity
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Enter a Drug ID, QR value, or batch reference to fetch on-chain and
        off-chain details.
      </Typography>

      <Paper
        elevation={4}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: "1px solid rgba(56,189,248,0.4)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            fullWidth
            label="Drug ID / QR Code Value"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  edge="end"
                  sx={{ opacity: 0.7 }}
                  // TODO: hook up your QR scanner here
                  onClick={() => alert("Plug your QR scanner logic here")}
                >
                  <QrCodeScannerIcon />
                </IconButton>
              ),
            }}
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleVerify}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} /> : <SearchIcon />
            }
            sx={{
              minWidth: 160,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </Stack>

        {error && (
          <Typography
            variant="body2"
            sx={{ color: "error.main", mt: 1.5, fontWeight: 500 }}
          >
            {error}
          </Typography>
        )}
      </Paper>

      {result && (
        <Paper
          elevation={4}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: "1px solid rgba(34,197,94,0.4)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                Result
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {result.drugId || query}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={result.status || "UNKNOWN"}
                  color={statusColor}
                  variant="outlined"
                  sx={{ borderRadius: 999 }}
                />
                {result.coldChainViolated && (
                  <Chip
                    label="Cold Chain Violation"
                    color="error"
                    size="small"
                    sx={{ borderRadius: 999 }}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={openOnEtherscan}
                disabled={!result.transactionHash}
                sx={{ textTransform: "none", borderRadius: 999 }}
              >
                View on Etherscan
              </Button>
              {result.contractAddress && (
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  onClick={() =>
                    window.open(
                      `https://sepolia.etherscan.io/address/${result.contractAddress}`,
                      "_blank"
                    )
                  }
                  sx={{ textTransform: "none", borderRadius: 999 }}
                >
                  Contract
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", mb: 0.5 }}
              >
                Product Info
              </Typography>
              <Typography variant="body2">
                Product ID: <b>{result.productId || "N/A"}</b>
              </Typography>
              <Typography variant="body2">
                Batch ID: <b>{result.batchId || "N/A"}</b>
              </Typography>
              <Typography variant="body2">
                Manufacturer:{" "}
                <Box
                  component="span"
                  sx={{ fontFamily: "monospace", fontSize: 13 }}
                >
                  {result.manufacturerAddress || "N/A"}
                </Box>
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", mb: 0.5 }}
              >
                Supply Chain Snapshot
              </Typography>
              <Typography variant="body2">
                Current Owner:{" "}
                <Box
                  component="span"
                  sx={{ fontFamily: "monospace", fontSize: 13 }}
                >
                  {result.currentOwnerAddress || "N/A"}
                </Box>
              </Typography>
              <Typography variant="body2">
                Last Updated:{" "}
                {result.lastUpdateTimestamp
                  ? new Date(result.lastUpdateTimestamp).toLocaleString()
                  : "N/A"}
              </Typography>
              <Typography variant="body2">
                Last Block Synced: {result.lastSyncedBlock || "N/A"}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

export default VerifyDrug;
