import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_XXXXXXXXX',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || 'qivr-clinic.auth.ap-southeast-2.amazoncognito.com',
          scopes: ['openid', 'profile', 'email', 'phone'],
          redirectSignIn: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNIN || 'http://localhost:3001/auth/callback',
          ],
          redirectSignOut: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNOUT || 'http://localhost:3001/',
          ],
          responseType: 'code' as const,
        },
        email: true,
        phone: false,
        username: false,
      },
      signUpVerificationMethod: 'code' as const,
      mfa: {
        status: 'on' as const, // MFA required for clinic staff
        totpEnabled: true,
        smsEnabled: true,
      },
      passwordFormat: {
        minLength: 10, // Stronger password requirements for clinic staff
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    REST: {
      QivrAPI: {
        endpoint: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        region: 'ap-southeast-2',
      },
    },
  },
};

// Only initialize Amplify if we're in the browser
if (typeof window !== 'undefined') {
  try {
    console.log('Configuring Amplify with:', amplifyConfig);
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

export default amplifyConfig;
