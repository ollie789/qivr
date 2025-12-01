/**
 * Export utility functions for CSV and PDF generation
 */

export interface ExportColumn<T> {
  key: keyof T;
  header: string;
  formatter?: (value: any) => string;
}

/**
 * Export data to CSV file
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  columns: Array<ExportColumn<T>>,
  filename: string,
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create header row
  const headers = columns.map((col) => `"${col.header}"`).join(",");

  // Create data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        const formatted = col.formatter
          ? col.formatter(value)
          : String(value ?? "");
        // Escape quotes and wrap in quotes for CSV safety
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  // Combine into CSV content
  const csvContent = [headers, ...rows].join("\n");

  // Create and trigger download
  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Export data to JSON file
 */
export function exportToJson<T>(data: T[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, "application/json");
}

/**
 * Helper to trigger file download
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(
  date: string | Date | null | undefined,
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(
  amount: number,
  currency = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Export tenants data
 */
export function exportTenantsData(tenants: any[]): void {
  const columns: Array<ExportColumn<any>> = [
    { key: "id", header: "Tenant ID" },
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    { key: "status", header: "Status" },
    { key: "plan", header: "Plan" },
    { key: "patient_count", header: "Patients" },
    { key: "staff_count", header: "Staff" },
    { key: "created_at", header: "Created At", formatter: formatDateForExport },
  ];

  const filename = `tenants_export_${new Date().toISOString().split("T")[0]}`;
  exportToCsv(tenants, columns, filename);
}

/**
 * Export billing data
 */
export function exportBillingData(billingData: any): void {
  const planBreakdown = billingData?.planBreakdown ?? [];

  const columns: Array<ExportColumn<any>> = [
    { key: "plan", header: "Plan" },
    { key: "count", header: "Tenant Count" },
    { key: "revenue", header: "Monthly Revenue", formatter: (v) => `$${v}` },
  ];

  const filename = `billing_export_${new Date().toISOString().split("T")[0]}`;
  exportToCsv(planBreakdown, columns, filename);
}

/**
 * Export transactions data
 */
export function exportTransactionsData(transactions: any[]): void {
  const columns: Array<ExportColumn<any>> = [
    { key: "id", header: "Transaction ID" },
    { key: "created", header: "Date", formatter: formatDateForExport },
    { key: "customerEmail", header: "Customer" },
    { key: "description", header: "Description" },
    { key: "amount", header: "Amount", formatter: (v) => `$${v.toFixed(2)}` },
    { key: "currency", header: "Currency" },
    { key: "status", header: "Status" },
    { key: "paid", header: "Paid", formatter: (v) => (v ? "Yes" : "No") },
    {
      key: "refunded",
      header: "Refunded",
      formatter: (v) => (v ? "Yes" : "No"),
    },
  ];

  const filename = `transactions_export_${new Date().toISOString().split("T")[0]}`;
  exportToCsv(transactions, columns, filename);
}

/**
 * Export usage statistics
 */
export function exportUsageData(usageData: any[]): void {
  const columns: Array<ExportColumn<any>> = [
    { key: "tenant_id", header: "Tenant ID" },
    { key: "appointments", header: "Appointments" },
    { key: "documents", header: "Documents" },
    { key: "messages", header: "Messages" },
    { key: "completed_appointments", header: "Completed" },
  ];

  const filename = `usage_export_${new Date().toISOString().split("T")[0]}`;
  exportToCsv(usageData, columns, filename);
}
