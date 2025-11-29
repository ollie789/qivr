import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const POOL_ID =
  import.meta.env.VITE_COGNITO_POOL_ID || "ap-southeast-2_BEFWL83lO";
const CLIENT_ID =
  import.meta.env.VITE_COGNITO_CLIENT_ID || "4efd4f62srvf16kd35q85t8pjd";

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

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise((resolve) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve({ success: true, session });
      },
      onFailure: (err) => {
        resolve({
          success: false,
          error: err.message || "Authentication failed",
        });
      },
      mfaSetup: () => {
        // User needs to set up TOTP
        resolve({
          success: false,
          challengeName: "MFA_SETUP",
          cognitoUser: user,
        });
      },
      totpRequired: () => {
        // User needs to enter TOTP code
        resolve({
          success: false,
          challengeName: "SOFTWARE_TOKEN_MFA",
          cognitoUser: user,
        });
      },
      newPasswordRequired: () => {
        resolve({
          success: false,
          challengeName: "NEW_PASSWORD_REQUIRED",
          cognitoUser: user,
        });
      },
    });
  });
}

export async function verifyTotp(
  user: CognitoUser,
  code: string,
): Promise<AuthResult> {
  return new Promise((resolve) => {
    user.sendMFACode(
      code,
      {
        onSuccess: (session) => {
          resolve({ success: true, session });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message || "Invalid code" });
        },
      },
      "SOFTWARE_TOKEN_MFA",
    );
  });
}

export async function setupTotp(
  user: CognitoUser,
): Promise<{ secretCode: string }> {
  return new Promise((resolve, reject) => {
    user.associateSoftwareToken({
      associateSecretCode: (secretCode) => {
        resolve({ secretCode });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

export async function verifyTotpSetup(
  user: CognitoUser,
  code: string,
  friendlyName = "Authenticator",
): Promise<AuthResult> {
  return new Promise((resolve) => {
    user.verifySoftwareToken(code, friendlyName, {
      onSuccess: (session) => {
        resolve({ success: true, session });
      },
      onFailure: (err) => {
        resolve({ success: false, error: err.message || "Invalid code" });
      },
    });
  });
}

export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
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
  return getCurrentSession().then(
    (session) => session?.getIdToken().getJwtToken() || null,
  );
}
