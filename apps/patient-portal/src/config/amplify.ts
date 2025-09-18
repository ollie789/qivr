import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_ZMcriKNGJ',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4kugfmvk56o3otd0grc4gddi8r',
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: false,
      },
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: false,
        },
        family_name: {
          required: false,
        },
        phone_number: {
          required: false,
        }
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
      mfa: {
        status: 'off' as const,
      }
    }
  }
};

export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig;