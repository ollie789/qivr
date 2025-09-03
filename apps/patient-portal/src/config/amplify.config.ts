import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_ZMcriKNGJ',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4kugfmvk56o3otd0grc4gddi8r',
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || 'qivr-auth.auth.ap-southeast-2.amazoncognito.com',
          scopes: ['openid', 'profile', 'email', 'phone'],
          redirectSignIn: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNIN || 'http://localhost:3000/auth/callback',
          ],
          redirectSignOut: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNOUT || 'http://localhost:3000/',
          ],
      responseType: 'code' as 'code',
        },
        email: true,
        phone: false,
        username: false,
      },
      signUpVerificationMethod: 'code' as const,
      mfa: {
        status: 'optional' as 'optional',
        totpEnabled: true,
        smsEnabled: true,
      },
      passwordFormat: {
        minLength: 8,
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
        endpoint: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
        region: 'ap-southeast-2',
      },
    },
  },
};

// Initialize Amplify only in browser
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully for patient portal on port 3000');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

export default amplifyConfig;
