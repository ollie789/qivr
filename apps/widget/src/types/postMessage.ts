/**
 * PostMessage contract for secure widget-parent communication
 * This ensures type safety and prevents data leakage
 */

// Parent → Widget messages
export type ParentToWidgetMessage =
  | { type: 'INIT'; clinicId: string; theme?: ThemeConfig; locale?: string }
  | { type: 'OPEN_BOOKING'; providerId?: string }
  | { type: 'RESIZE'; maxHeight?: number }
  | { type: 'CLOSE' }
  | { type: 'SET_PATIENT'; patientId?: string; patientInfo?: PatientBasicInfo };

// Widget → Parent messages  
export type WidgetToParentMessage =
  | { type: 'READY'; version: string }
  | { type: 'HEIGHT_CHANGED'; height: number }
  | { type: 'NAVIGATE'; route: string }
  | { type: 'SUBMISSION_COMPLETE'; intakeId: string; evaluationId: string }
  | { type: 'ERROR'; message: string; code?: string }
  | { type: 'CLOSE_REQUESTED' };

// Theme configuration (no PHI)
export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  logoUrl?: string;
}

// Basic patient info (minimal, no sensitive data in URLs)
export interface PatientBasicInfo {
  firstName?: string;
  lastName?: string;
  // No email, phone, DOB, or other PHI in postMessage
}

// Message validation helper
export class MessageValidator {
  private static allowedOrigins = [
    'https://*.clinic.local',
    'https://*.qivr.health',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ];

  static isValidOrigin(origin: string): boolean {
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      return this.allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const pattern = allowed.replace('*', '.*');
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return allowed === origin;
      });
    }
    // In development, allow localhost
    return origin.startsWith('http://localhost');
  }

  static isValidMessage(data: any): data is ParentToWidgetMessage | WidgetToParentMessage {
    if (!data || typeof data !== 'object' || !data.type) {
      return false;
    }
    
    // Validate message types
    const validTypes = [
      'INIT', 'OPEN_BOOKING', 'RESIZE', 'CLOSE', 'SET_PATIENT',
      'READY', 'HEIGHT_CHANGED', 'NAVIGATE', 'SUBMISSION_COMPLETE', 
      'ERROR', 'CLOSE_REQUESTED'
    ];
    
    return validTypes.includes(data.type);
  }

  static sanitizeMessage(message: any): any {
    // Remove any potentially sensitive fields that shouldn't be in postMessage
    const sensitiveFields = [
      'password', 'token', 'apiKey', 'secret', 
      'ssn', 'dateOfBirth', 'email', 'phone',
      'address', 'medicalHistory', 'medications'
    ];
    
    const cleaned = { ...message };
    sensitiveFields.forEach(field => {
      delete cleaned[field];
    });
    
    return cleaned;
  }
}

// Secure postMessage wrapper
export class SecureMessenger {
  private targetOrigin: string;
  private targetWindow: Window | null;

  constructor(targetWindow: Window | null, targetOrigin: string = '*') {
    this.targetWindow = targetWindow;
    this.targetOrigin = targetOrigin;
  }

  send(message: WidgetToParentMessage | ParentToWidgetMessage): void {
    if (!this.targetWindow) {
      console.warn('No target window available for postMessage');
      return;
    }

    // Sanitize message before sending
    const sanitized = MessageValidator.sanitizeMessage(message);
    
    // Never use '*' as targetOrigin in production
    const origin = process.env.NODE_ENV === 'production' && this.targetOrigin === '*' 
      ? window.location.origin 
      : this.targetOrigin;

    this.targetWindow.postMessage(sanitized, origin);
  }

  listen(
    callback: (message: ParentToWidgetMessage | WidgetToParentMessage, event: MessageEvent) => void
  ): () => void {
    const handler = (event: MessageEvent) => {
      // Validate origin
      if (!MessageValidator.isValidOrigin(event.origin)) {
        console.warn('Received message from unauthorized origin:', event.origin);
        return;
      }

      // Validate message structure
      if (!MessageValidator.isValidMessage(event.data)) {
        console.warn('Invalid message structure:', event.data);
        return;
      }

      callback(event.data, event);
    };

    window.addEventListener('message', handler);
    
    // Return cleanup function
    return () => window.removeEventListener('message', handler);
  }
}
