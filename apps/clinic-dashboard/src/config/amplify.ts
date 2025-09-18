import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_jbutB4tj1',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4l510mm689hhpgr12prbuch2og',
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
        'custom:role': {
          required: false,
        },
        'custom:clinic_id': {
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