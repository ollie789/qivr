import { useState, useMemo } from "react";
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  MedicalServices,
  History,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { deviceTrackingApi, AvailableDevice } from "../../lib/api";

interface DeviceSelectorProps {
  value: AvailableDevice | null;
  onChange: (device: AvailableDevice | null) => void;
  disabled?: boolean;
  placeholder?: string;
  showRecent?: boolean;
  bodyRegionFilter?: string;
}

export function DeviceSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Search or select device...",
  showRecent = true,
  bodyRegionFilter,
}: DeviceSelectorProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>(
    bodyRegionFilter || "",
  );

  // Fetch available devices
  const {
    data: devicesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["available-devices", categoryFilter, regionFilter],
    queryFn: () =>
      deviceTrackingApi.getAvailableDevices({
        category: categoryFilter || undefined,
        bodyRegion: regionFilter || undefined,
      }),
  });

  // Fetch recent devices
  const { data: recentData } = useQuery({
    queryKey: ["recent-devices"],
    queryFn: () => deviceTrackingApi.getRecentDevices(),
    enabled: showRecent,
  });

  const devices = devicesData?.devices || [];
  const recentDevices = recentData?.devices || [];

  // Filter devices by search
  const filteredDevices = useMemo(() => {
    if (!search) return devices;
    const searchLower = search.toLowerCase();
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(searchLower) ||
        d.deviceCode.toLowerCase().includes(searchLower) ||
        d.partnerName.toLowerCase().includes(searchLower),
    );
  }, [devices, search]);

  // Check if feature is disabled
  if (devicesData?.message) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {devicesData.message}
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Failed to load devices
      </Alert>
    );
  }

  return (
    <Box>
      {/* Recent Devices */}
      {showRecent && recentDevices.length > 0 && !value && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
          >
            <History fontSize="small" /> Recently Used
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {recentDevices.slice(0, 3).map((device) => (
              <Chip
                key={device.id}
                label={device.name}
                size="small"
                onClick={() => onChange(device)}
                icon={<MedicalServices fontSize="small" />}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Filter Toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconButton
          size="small"
          onClick={() => setShowFilters(!showFilters)}
          color={
            showFilters || categoryFilter || regionFilter
              ? "primary"
              : "default"
          }
        >
          <FilterList fontSize="small" />
        </IconButton>
        {(categoryFilter || regionFilter) && (
          <IconButton
            size="small"
            onClick={() => {
              setCategoryFilter("");
              setRegionFilter("");
            }}
          >
            <Clear fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Filters */}
      <Collapse in={showFilters}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Spinal Implant">Spinal Implant</MenuItem>
              <MenuItem value="Bone Graft">Bone Graft</MenuItem>
              <MenuItem value="Disc Replacement">Disc Replacement</MenuItem>
              <MenuItem value="Fixation Device">Fixation Device</MenuItem>
              <MenuItem value="Joint Replacement">Joint Replacement</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Body Region</InputLabel>
            <Select
              value={regionFilter}
              label="Body Region"
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Cervical">Cervical</MenuItem>
              <MenuItem value="Thoracic">Thoracic</MenuItem>
              <MenuItem value="Lumbar">Lumbar</MenuItem>
              <MenuItem value="Sacral">Sacral</MenuItem>
              <MenuItem value="Hip">Hip</MenuItem>
              <MenuItem value="Knee">Knee</MenuItem>
              <MenuItem value="Shoulder">Shoulder</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Collapse>

      {/* Device Selector */}
      <Autocomplete
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        inputValue={search}
        onInputChange={(_, newValue) => setSearch(newValue)}
        options={filteredDevices}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disabled={disabled}
        loading={isLoading}
        groupBy={(option) => option.partnerName}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <MedicalServices color="action" sx={{ mr: 1 }} />
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {isLoading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography fontWeight={500}>{option.name}</Typography>
                {option.category && (
                  <Chip
                    label={option.category}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {option.deviceCode}
                {option.bodyRegion && ` | ${option.bodyRegion}`}
              </Typography>
            </Box>
          </li>
        )}
        renderGroup={(params) => (
          <li key={params.key}>
            <Box
              sx={{
                position: "sticky",
                top: -8,
                bgcolor: "grey.100",
                px: 2,
                py: 1,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {params.group}
              </Typography>
            </Box>
            <ul style={{ padding: 0 }}>{params.children}</ul>
          </li>
        )}
        PaperComponent={(props) => (
          <Paper {...props} elevation={8} sx={{ maxHeight: 400 }} />
        )}
        noOptionsText={
          devices.length === 0
            ? "No devices available for this clinic"
            : "No matching devices"
        }
      />

      {/* Selected Device Display */}
      {value && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "primary.50",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "primary.200",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography fontWeight={600}>{value.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {value.partnerName} | {value.deviceCode}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                {value.category && <Chip label={value.category} size="small" />}
                {value.bodyRegion && (
                  <Chip
                    label={value.bodyRegion}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <IconButton size="small" onClick={() => onChange(null)}>
              <Clear />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default DeviceSelector;
