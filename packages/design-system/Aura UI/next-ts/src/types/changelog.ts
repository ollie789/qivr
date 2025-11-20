export interface ChangelogEntry {
  version: string;
  title: string;
  badgeTitle?: string;
  publish: string;
  warning?: React.ReactNode;
  logs: Record<string, ChangelogLogItem[]>;
}

export interface ChangelogLogItem {
  text: string | React.ReactNode;
  link?: string | { href: string; linkText?: string };
}
