import { Tabs, Tab, TabsProps, Badge } from '@mui/material';
import { ReactNode } from 'react';

export interface TabItem {
  label: string;
  icon?: ReactNode;
  badge?: number;
  disabled?: boolean;
}

export interface TabBarProps extends Omit<TabsProps, 'children' | 'onChange'> {
  tabs: TabItem[];
  value: number;
  onChange: (value: number) => void;
}

export const TabBar = ({ tabs, value, onChange, ...props }: TabBarProps) => (
  <Tabs value={value} onChange={(_, v) => onChange(v)} {...props}>
    {tabs.map((tab, index) => (
      <Tab
        key={index}
        label={
          tab.badge ? (
            <Badge badgeContent={tab.badge} color="error" sx={{ '& .MuiBadge-badge': { right: -12 } }}>
              {tab.label}
            </Badge>
          ) : tab.label
        }
        icon={tab.icon as any}
        iconPosition="start"
        disabled={tab.disabled}
      />
    ))}
  </Tabs>
);
