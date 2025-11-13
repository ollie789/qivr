import { format } from 'date-fns';

// Type for exportable data - any object with string keys
type ExportableData = Record<string, unknown>;

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: ExportableData[], columns?: { key: string; label: string }[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // If no columns specified, use all keys from first object
  if (!columns) {
    const firstItem = data[0];
    if (!firstItem) return '';
    const keys = Object.keys(firstItem);
    columns = keys.map(key => ({ key, label: key }));
  }

  // Create header row
  const header = columns.map(col => `"${col.label}"`).join(',');

  // Create data rows
  const rows = data.map(item => {
    return columns!.map(col => {
      const value = getNestedValue(item, col.key);
      // Escape quotes and wrap in quotes if contains comma, newline, or quotes
      const stringValue = value === null || value === undefined ? '' : String(value);
      const needsQuotes = stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"');
      const escapedValue = stringValue.replace(/"/g, '""');
      return needsQuotes ? `"${escapedValue}"` : escapedValue;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: ExportableData, path: string): string {
  const value = path.split('.').reduce((current: any, key) => current?.[key], obj);
  return String(value ?? '');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: ExportableData[], filename: string, columns?: { key: string; label: string }[]) {
  const csv = arrayToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert array to Excel-compatible HTML table
 */
export function arrayToExcelHTML(data: ExportableData[], columns?: { key: string; label: string }[]): string {
  if (!data || data.length === 0) {
    return '<table></table>';
  }

  // If no columns specified, use all keys from first object
  if (!columns && data.length > 0 && data[0]) {
    const keys = Object.keys(data[0]);
    columns = keys.map(key => ({ key, label: key }));
  }

  let html = '<table border="1">';
  
  // Add header
  html += '<thead><tr>';
  if (columns) {
    columns.forEach(col => {
      html += `<th style="background-color: #f0f0f0; font-weight: bold;">${col.label}</th>`;
    });
  }
  html += '</tr></thead>';

  // Add data rows
  html += '<tbody>';
  data.forEach(item => {
    html += '<tr>';
    columns!.forEach(col => {
      const value = getNestedValue(item, col.key);
      const displayValue = value === null || value === undefined ? '' : String(value);
      html += `<td>${escapeHtml(displayValue)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text || '').replace(/[&<>"']/g, m => map[m] || m);
}

/**
 * Download data as Excel file (using HTML table format)
 */
export function downloadExcel(data: ExportableData[], filename: string, columns?: { key: string; label: string }[]) {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; }
        td, th { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #4CAF50; color: white; }
      </style>
    </head>
    <body>
      ${arrayToExcelHTML(data, columns)}
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export intake queue data
 */
export interface IntakeExportData {
  patientName: string;
  email: string;
  phone?: string;
  conditionType: string;
  severity: string;
  painLevel: number;
  symptoms?: string[];
  status: string;
  submittedAt: string;
  assignedTo?: string;
  aiSummary?: string;
}

export const intakeQueueColumns = [
  { key: 'patientName', label: 'Patient Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'conditionType', label: 'Chief Complaint' },
  { key: 'severity', label: 'Urgency' },
  { key: 'painLevel', label: 'Pain Level (1-10)' },
  { key: 'symptomsString', label: 'Symptoms' },
  { key: 'status', label: 'Status' },
  { key: 'submittedAt', label: 'Submitted Date' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'aiSummary', label: 'AI Analysis' },
];

/**
 * Prepare intake data for export
 */
export function prepareIntakeExportData(intakes: IntakeExportData[]): ExportableData[] {
  return intakes.map(intake => ({
    ...intake,
    symptomsString: intake.symptoms ? intake.symptoms.join(', ') : '',
    submittedAt: format(new Date(intake.submittedAt), 'yyyy-MM-dd HH:mm'),
  }));
}

/**
 * Export patients data
 */
export interface PatientExportData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  medicalRecordNumber?: string;
  status?: string;
  insuranceProvider?: string;
  lastVisit?: string;
  conditions?: string[];
}

export const patientColumns = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'addressString', label: 'Address' },
  { key: 'medicalRecordNumber', label: 'Medical Record #' },
  { key: 'status', label: 'Status' },
  { key: 'insuranceProvider', label: 'Insurance' },
  { key: 'lastVisit', label: 'Last Visit' },
  { key: 'conditionsString', label: 'Conditions' },
];

/**
 * Prepare patient data for export
 */
export function preparePatientExportData(patients: PatientExportData[]): ExportableData[] {
  return patients.map(patient => ({
    ...patient,
    addressString: patient.address 
      ? `${patient.address.street || ''} ${patient.address.city || ''} ${patient.address.state || ''} ${patient.address.postcode || ''}`.trim()
      : '',
    conditionsString: patient.conditions ? patient.conditions.join(', ') : '',
    dateOfBirth: patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'yyyy-MM-dd') : '',
    lastVisit: patient.lastVisit ? format(new Date(patient.lastVisit), 'yyyy-MM-dd') : '',
  }));
}
