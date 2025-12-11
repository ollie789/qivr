import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_vAW6TyxJx';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '6e50fedb7n8hqjm2acnl0jhjch';

const userPool = new CognitoUserPool({
  UserPoolId: POOL_ID,
  ClientId: CLIENT_ID,
});

export interface AuthResult {
  success: boolean;
  session?: CognitoUserSession;
  challengeName?: string;
  cognitoUser?: CognitoUser;
  error?: string;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise((resolve) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve({ success: true, session }),
      onFailure: (err) =>
        resolve({
          success: false,
          error: err.message || 'Authentication failed',
        }),
      newPasswordRequired: () => {
        resolve({
          success: false,
          challengeName: 'NEW_PASSWORD_REQUIRED',
          cognitoUser: user,
        });
      },
    });
  });
}

export async function completeNewPassword(
  user: CognitoUser,
  newPassword: string
): Promise<AuthResult> {
  return new Promise((resolve) => {
    user.completeNewPasswordChallenge(
      newPassword,
      {},
      {
        onSuccess: (session) => resolve({ success: true, session }),
        onFailure: (err) =>
          resolve({ success: false, error: err.message || 'Failed to set password' }),
      }
    );
  });
}

export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      resolve(null);
      return;
    }
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        resolve(null);
      } else {
        resolve(session);
      }
    });
  });
}

export function getIdToken(): Promise<string | null> {
  return getCurrentSession().then((session) => session?.getIdToken().getJwtToken() || null);
}
