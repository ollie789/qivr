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

export interface MedicareInfo {
  number?: string;
  ref?: string;
  expiry?: string;
}

export interface InsuranceInfo {
  provider?: string;
  memberId?: string;
  groupNumber?: string;
  primaryCarePhysician?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  marketingEmails: boolean;
}

export interface CommunicationPreferences {
  preferredMethod: "email" | "sms" | "both" | "phone";
  reminderTiming: "24h" | "2h" | "1h" | "30min";
  marketingConsent: boolean;
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
  country?: string;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  medicare?: MedicareInfo;
  insurance?: InsuranceInfo;
  preferences?: NotificationPreferences;
  communicationPreferences?: CommunicationPreferences;
  photoUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profileCompleted?: boolean;
}

/**
 * Health details wizard form data
 * Used for the onboarding wizard after first login
 */
export interface HealthDetailsFormData {
  // Step 1: Personal Details
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;

  // Step 2: Medicare & Insurance
  medicareNumber?: string;
  medicareRef?: string;
  medicareExpiry?: string;
  insuranceProvider?: string;
  insuranceMemberId?: string;
  insuranceGroupNumber?: string;
  primaryCarePhysician?: string;

  // Step 3: Medical Details
  allergies?: string[];
  medications?: string[];
  conditions?: string[];

  // Step 4: Preferences
  communicationPreference?: "email" | "sms" | "both" | "phone";
  reminderTiming?: "24h" | "2h" | "1h" | "30min";
  appointmentReminders?: boolean;
  marketingConsent?: boolean;
}

export type UpdateProfilePayload = Partial<UserProfile>;

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
