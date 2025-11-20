export interface Storage {
  label: string;
  value: number;
}

export interface ClientLocation {
  name: string;
  value: number;
}

export interface ComparisonChartData {
  currentYear: number[];
  lastYear: number[];
}

export interface PromoSlideData {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageKey: 'rocket' | 'customer' | 'aiTools';
}
