// src/components/DrugList.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MedicationIcon from "@mui/icons-material/Medication";

function DrugList({ API_BASE_URL, authToken }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/getAllDrugs`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to load drugs");
        }
        const data = await res.json();

        // Normalize data for DataGrid
        const mapped = (data || []).map((d, index) => ({
          id: d._id || d.drugId || index,
          ...d,
          // handle MongoDB extended JSON: { $date: "..." }
          lastUpdateTimestamp:
            d.lastUpdateTimestamp && d.lastUpdateTimestamp.$date
              ? d.lastUpdateTimestamp.$date
              : d.lastUpdateTimestamp || null,
        }));

        setRows(mapped);
        setFiltered(mapped);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load drugs");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [API_BASE_URL, authToken]);

  useEffect(() => {
    const t = filterText.toLowerCase();
    if (!t) {
      setFiltered(rows);
    } else {
      setFiltered(
        rows.filter(
          (r) =>
            (r.drugId || r._id || "").toString().toLowerCase().includes(t) ||
            (r.productId || "").toString().toLowerCase().includes(t) ||
            (r.batchId || "").toString().toLowerCase().includes(t)
        )
      );
    }
  }, [filterText, rows]);

  const columns = [
    {
      field: "drugId",
      headerName: "Drug ID",
      flex: 1.3,
      valueGetter: (params) => params.row.drugId || params.row._id,
    },
    {
      field: "productId",
      headerName: "Product",
      flex: 1,
    },
    {
      field: "batchId",
      headerName: "Batch",
      flex: 0.8,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.9,
      renderCell: (params) => {
        const status = params.value || "UNKNOWN";
        let color = "default";
        if (status === "MANUFACTURED") color = "primary";
        else if (status === "IN_TRANSIT") color = "info";
        else if (status === "DISPENSED" || status === "DISPENSED_TO_PATIENT")
          color = "success";
        else if (status === "FLAGGED") color = "error";

        return (
          <Chip
            label={status}
            color={color}
            size="small"
            sx={{ borderRadius: 999 }}
          />
        );
      },
    },
    {
      field: "currentOwnerAddress",
      headerName: "Current Owner",
      flex: 1.4,
      renderCell: (params) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {params.value || "N/A"}
        </span>
      ),
    },
    {
      field: "lastUpdateTimestamp",
      headerName: "Last Update",
      flex: 1.1,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : "—",
    },
    {
      field: "lastSyncedBlock",
      headerName: "Last Block",
      flex: 0.7,
    },
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <MedicationIcon sx={{ color: "secondary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          All Tracked Drugs
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Browse all on-chain drug records, filter by ID, product, or batch, and
        inspect their current state.
      </Typography>

      <Paper
        elevation={4}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
          justifyContent="space-between"
        >
          <TextField
            label="Search by drug ID, product or batch"
            variant="outlined"
            size="small"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ maxWidth: 400 }}
          />
          {loading && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ color: "text.secondary" }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2">Loading records…</Typography>
            </Stack>
          )}
        </Stack>

        {error && (
          <Typography variant="body2" sx={{ color: "error.main", mb: 1.5 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ height: 520, width: "100%" }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: {
                sortModel: [{ field: "lastUpdateTimestamp", sort: "desc" }],
              },
            }}
            density="compact"
            disableRowSelectionOnClick
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default DrugList;
