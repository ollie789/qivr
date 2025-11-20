export interface DealData {
  icon: string;
  count: number;
  label: string;
  percentage: number;
  trend: string;
}

export interface KPIData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: {
    name: string;
    color: string;
  };
}

export interface CRMGeneratedRevenueChartData {
  '75th': number[];
  '50th': number[];
  '25th': number[];
}

export interface SaleFunnelChartData {
  awareness: number;
  research: number;
  intent: number;
  evaluation: number;
  negotiation: number;
  aquisition: number;
}

export interface SaleFunnelTableRowData {
  stageIndicator: string;
  stage: string;
  lostLead: number;
  thisMonth: number;
}

export interface LeadSourceData {
  value: number;
  name: string;
}

export interface AcquisitionCostData {
  allotted: number[];
  used: number[];
}

export interface AvgLifetimeValueData {
  cac: number[];
  ltv: number[];
}

export interface CustomerFeedbackData {
  positive: number[];
  negative: number[];
  '75thPercentile': number[];
}

export interface ActiveUsersData {
  placeholder: number[];
  users: number[];
}
