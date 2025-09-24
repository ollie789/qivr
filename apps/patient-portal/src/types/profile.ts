export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  marketingEmails: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences?: NotificationPreferences;
  photoUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export type UpdateProfilePayload = Partial<UserProfile>;

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
