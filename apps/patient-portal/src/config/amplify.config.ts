import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_XXXXXXXXX',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || 'qivr-auth.auth.ap-southeast-2.amazoncognito.com',
          scopes: ['openid', 'profile', 'email', 'phone'],
          redirectSignIn: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNIN || 'http://localhost:3002/auth/callback',
          ],
          redirectSignOut: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNOUT || 'http://localhost:3002/',
          ],
          responseType: 'code',
        },
        email: true,
        phone: false,
        username: false,
      },
      signUpVerificationMethod: 'code',
      mfa: {
        status: 'optional',
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
        endpoint: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        region: 'ap-southeast-2',
      },
    },
  },
};

// Initialize Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig;
