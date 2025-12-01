import { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from "@mui/material";
import {
  ExpandMore,
  PlayArrow,
  Refresh,
  ContentCopy,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from "@mui/icons-material";
import { getIdToken } from "../services/cognitoAuth";

interface TestResult {
  endpoint: string;
  method: string;
  status: number | null;
  duration: number;
  error?: string;
  response?: unknown;
}

interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
}

const API_BASE =
  import.meta.env.VITE_ADMIN_API_URL?.replace("/api/admin", "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://clinic.qivr.pro");

const API_ENDPOINTS = [
  {
    name: "Dashboard Stats",
    method: "GET",
    path: "/api/admin/analytics/dashboard",
  },
  { name: "Tenants List", method: "GET", path: "/api/admin/analytics/tenants" },
  { name: "Usage Stats", method: "GET", path: "/api/admin/analytics/usage" },
  {
    name: "Revenue Trend",
    method: "GET",
    path: "/api/admin/analytics/revenue-trend",
  },
  { name: "Health Check", method: "GET", path: "/health" },
  { name: "Feature Flags", method: "GET", path: "/api/admin/feature-flags" },
  {
    name: "Research Partners",
    method: "GET",
    path: "/api/admin/research-partners",
  },
  {
    name: "System Health",
    method: "GET",
    path: "/api/admin/operations/health",
  },
];

export default function Diagnostics() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState("ERR");
  const [logMinutes, setLogMinutes] = useState(5);
  const [copied, setCopied] = useState<string | null>(null);

  const runTest = useCallback(async (endpoint: (typeof API_ENDPOINTS)[0]) => {
    const start = performance.now();
    try {
      const token = await getIdToken();
      const response = await fetch(`${API_BASE}${endpoint.path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json().catch(() => null);
      return {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: response.status,
        duration: Math.round(performance.now() - start),
        response: data,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: null,
        duration: Math.round(performance.now() - start),
        error: error.message,
      };
    }
  }, []);

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);
    const newResults: TestResult[] = [];

    for (const endpoint of API_ENDPOINTS) {
      const result = await runTest(endpoint);
      newResults.push(result);
      setResults([...newResults]);
    }
    setTesting(false);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = await getIdToken();
      const params = new URLSearchParams({
        logGroup: "/ecs/qivr-api",
        filterPattern: logFilter,
        minutes: logMinutes.toString(),
        limit: "50",
      });
      const response = await fetch(
        `${API_BASE}/api/admin/operations/logs?${params}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );
      const data = await response.json();
      setLogs(data.events || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setLogs([]);
    }
    setLoadingLogs(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusColor = (
    status: number | null,
  ): "success" | "warning" | "error" => {
    if (!status) return "error";
    if (status >= 200 && status < 300) return "success";
    if (status >= 400 && status < 500) return "warning";
    return "error";
  };

  const getStatusIcon = (status: number | null) => {
    if (!status) return <ErrorIcon color="error" />;
    if (status >= 200 && status < 300) return <CheckCircle color="success" />;
    if (status >= 400 && status < 500) return <Warning color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const passedCount = results.filter(
    (r) => r.status && r.status >= 200 && r.status < 300,
  ).length;
  const failedCount = results.filter(
    (r) => !r.status || r.status >= 400,
  ).length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        API Diagnostics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Test admin API endpoints and view CloudWatch logs for debugging
      </Typography>

      {/* API Tests Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Endpoint Tests</Typography>
          <Button
            variant="contained"
            startIcon={
              testing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PlayArrow />
              )
            }
            onClick={runAllTests}
            disabled={testing}
          >
            {testing ? "Testing..." : "Run All Tests"}
          </Button>
        </Stack>

        {results.length > 0 && (
          <Alert
            severity={
              failedCount === 0
                ? "success"
                : failedCount === results.length
                  ? "error"
                  : "warning"
            }
            sx={{ mb: 2 }}
          >
            {passedCount}/{results.length} tests passed
            {failedCount > 0 && ` • ${failedCount} failed`}
          </Alert>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Endpoint</TableCell>
              <TableCell>Method</TableCell>
              <TableCell align="right">Duration</TableCell>
              <TableCell>Response</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {API_ENDPOINTS.map((endpoint, idx) => {
              const result = results[idx];
              return (
                <TableRow key={endpoint.path}>
                  <TableCell>
                    {result ? (
                      getStatusIcon(result.status)
                    ) : (
                      <Chip label="—" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {endpoint.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {endpoint.path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {result ? (
                      <Typography variant="body2">
                        {result.duration}ms
                      </Typography>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {result && (
                      <Chip
                        label={result.status || "Error"}
                        size="small"
                        color={getStatusColor(result.status)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Expandable Results */}
        {results.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Response Details
            </Typography>
            {results.map((result, idx) => (
              <Accordion key={idx} sx={{ "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getStatusIcon(result.status)}
                    <Typography variant="body2">{result.endpoint}</Typography>
                    <Chip
                      label={result.status || "Error"}
                      size="small"
                      color={getStatusColor(result.status)}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ position: "relative" }}>
                    <Tooltip
                      title={copied === `result-${idx}` ? "Copied!" : "Copy"}
                    >
                      <IconButton
                        size="small"
                        sx={{ position: "absolute", top: 0, right: 0 }}
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              result.response || result.error,
                              null,
                              2,
                            ),
                            `result-${idx}`,
                          )
                        }
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box
                      component="pre"
                      sx={{
                        bgcolor: "grey.100",
                        p: 2,
                        borderRadius: 1,
                        overflow: "auto",
                        maxHeight: 300,
                        fontSize: "0.75rem",
                      }}
                    >
                      {JSON.stringify(result.response || result.error, null, 2)}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>

      {/* CloudWatch Logs Section */}
      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">CloudWatch Logs</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              label="Filter"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="ERR, Exception, 500..."
              sx={{ width: 150 }}
            />
            <TextField
              size="small"
              label="Minutes"
              type="number"
              value={logMinutes}
              onChange={(e) => setLogMinutes(Number(e.target.value))}
              sx={{ width: 100 }}
            />
            <Button
              variant="outlined"
              startIcon={
                loadingLogs ? <CircularProgress size={20} /> : <Refresh />
              }
              onClick={fetchLogs}
              disabled={loadingLogs}
            >
              Fetch Logs
            </Button>
          </Stack>
        </Stack>

        {logs.length === 0 ? (
          <Alert severity="info">
            Click "Fetch Logs" to retrieve recent CloudWatch logs. Use filters
            like "ERR", "Exception", or "500".
          </Alert>
        ) : (
          <Box sx={{ maxHeight: 500, overflow: "auto" }}>
            {logs.map((log, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: log.message.includes("ERR") ? "error.50" : "grey.50",
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: log.message.includes("ERR")
                    ? "error.main"
                    : "grey.300",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleString()} •{" "}
                      {log.logStreamName.split("/").pop()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {log.message}
                    </Typography>
                  </Box>
                  <Tooltip title={copied === `log-${idx}` ? "Copied!" : "Copy"}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(log.message, `log-${idx}`)}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
