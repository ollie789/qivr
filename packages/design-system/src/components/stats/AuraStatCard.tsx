import React from "react";
import { AuraGlassStatCard } from "./AuraGlassStatCard";

export interface AuraStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}

export const AuraStatCard: React.FC<AuraStatCardProps> = ({ iconColor, subtitle, ...props }) => (
  <AuraGlassStatCard {...props} color={iconColor} />
);
