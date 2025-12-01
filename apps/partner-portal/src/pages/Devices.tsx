import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search,
  ArrowForward,
  CheckCircle,
  HourglassEmpty,
} from "@mui/icons-material";
import { useState, useMemo } from "react";
import { deviceOutcomesApi } from "../services/api";

export default function Devices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["devices-overview"],
    queryFn: () => deviceOutcomesApi.getDevicesWithOutcomes(),
  });

  const devices = data?.devices || [];

  // Get unique categories and regions for filters
  const categories = useMemo(
    () => [...new Set(devices.map((d) => d.category).filter(Boolean))],
    [devices],
  );
  const regions = useMemo(
    () => [...new Set(devices.map((d) => d.bodyRegion).filter(Boolean))],
    [devices],
  );

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        !search ||
        device.deviceName.toLowerCase().includes(search.toLowerCase()) ||
        device.deviceCode.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !categoryFilter || device.category === categoryFilter;
      const matchesRegion = !regionFilter || device.bodyRegion === regionFilter;
      return matchesSearch && matchesCategory && matchesRegion;
    });
  }, [devices, search, categoryFilter, regionFilter]);

  // Stats
  const totalPatients = devices.reduce((sum, d) => sum + d.patientCount, 0);
  const devicesWithData = devices.filter((d) => d.hasSufficientData).length;

  if (error) {
    return (
      <Alert severity="error">
        Failed to load devices. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Device Catalog
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View and manage your medical device portfolio
      </Typography>

      {/* Summary */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total Devices
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {isLoading ? <Skeleton width={40} /> : devices.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              With Outcome Data
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {isLoading ? <Skeleton width={40} /> : devicesWithData}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total Patients
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {isLoading ? (
                <Skeleton width={40} />
              ) : (
                totalPatients.toLocaleString()
              )}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Body Region</InputLabel>
              <Select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                label="Body Region"
              >
                <MenuItem value="">All</MenuItem>
                {regions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Devices Table */}
      {isLoading ? (
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={400} />
          </CardContent>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Alert severity="info">
          {devices.length === 0
            ? "No devices found. Contact QIVR to set up your device catalog."
            : "No devices match your search criteria."}
        </Alert>
      ) : (
        <Paper sx={{ overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Body Region</TableCell>
                <TableCell align="center">Patients</TableCell>
                <TableCell align="center">Procedures</TableCell>
                <TableCell align="center">Data Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow
                  key={device.deviceId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/devices/${device.deviceId}`)}
                >
                  <TableCell>
                    <Typography fontWeight={600}>
                      {device.deviceName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {device.deviceCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {device.category ? (
                      <Chip
                        label={device.category}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.bodyRegion ? (
                      <Chip
                        label={device.bodyRegion}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600}>
                      {device.patientCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600}>
                      {device.procedureCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {device.hasSufficientData ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Ready"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Box sx={{ maxWidth: 120 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mb: 0.5,
                          }}
                        >
                          <HourglassEmpty fontSize="small" color="warning" />
                          <Typography variant="caption">
                            {device.patientCount}/5 patients
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(device.patientCount / 5) * 100}
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View outcomes">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${device.deviceId}`);
                        }}
                      >
                        <ArrowForward />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
