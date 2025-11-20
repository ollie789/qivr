import { JSX, ReactNode } from 'react';

export interface AccountTab {
  id?: number;
  label: string;
  title: string;
  value: string;
  icon: string;
  panelIcon: string;
  tabPanel: JSX.Element;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  userName: string;
  birthDate: string;
  country: string;
  state: string;
  city: string;
  street: string;
  zip: string;
  phoneNumber: string;
  primaryEmail: string;
  secondaryEmail: string;
}

export interface WorkHistory {
  id?: number;
  companyName: string;
  companyLogo: string | null;
  designation: string;
  location: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
}

export interface EducationHistory {
  id?: number;
  institutionName: string;
  institutionLogo: string | null;
  subject: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface LoggedInDevice {
  id: number;
  name: string;
  icon: string;
  location: string;
  currentlyLoggedIn: boolean;
  firstLoggedTime: Date;
  lastLoggedTime: Date;
  browsersAppsServices?: {
    icon: string;
    name: string;
  }[];
}

export interface ConnectedInDevice {
  id: number;
  securityKey: string;
  deviceName: string;
  connected: boolean;
  used: boolean;
  currentlyUsed: boolean;
  lastUsedDate: Date;
  deviceIcon: string;
}

export interface Language {
  id: number;
  name: string;
  label: string;
}

export interface Notification {
  name: string;
  checked: boolean;
  label: ReactNode;
}

export interface NotificationMethodOptions {
  newNotifications: boolean;
  directNotifications: boolean;
  postsEmailed: boolean;
  notificationFrequency: 'Daily' | 'Weekly' | 'Periodically' | 'Off' | null;
  feedback: boolean;
  deals: boolean;
  personalizedDeals: boolean;
  updates: boolean;
  accountSecurity: boolean;
  packageUpdates: boolean;
}

export interface CardInfo {
  id?: number;
  cardName: string;
  cardNumber: string;
  cardHolder: string;
  expireDate: string;
  subscriptions: number;
  icon: string;
  cvc: string;
}

export interface AddressInfo {
  name: string;
  phoneNumber: string;
  emailAddress: string;
  country: string;
  state: string;
  city: string;
  street: string;
  zip: string;
  addressType: string;
}

export interface Permission {
  name: string;
  checked: boolean;
  label: ReactNode;
}

export interface StorageCategory {
  name: string;
  icon?: string;
  color?: string;
  fileCount: number;
  spaceUsedinKb: number;
}

export interface Storage {
  totalSpaceinKb: number;
  totalSpaceUsedinKb: number;
  categories: StorageCategory[];
}

export interface BackupSyncSettings {
  name: string;
  enabled: boolean;
}
