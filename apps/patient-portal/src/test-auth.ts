import { Amplify } from 'aws-amplify';
import { signIn, fetchAuthSession } from '@aws-amplify/auth';

// Test configuration
const testConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_ZMcriKNGJ',
      userPoolClientId: '4kugfmvk56o3otd0grc4gddi8r',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: false,
      }
    }
  }
};

export async function testAuth(email: string, password: string) {
  try {
    console.log('Configuring Amplify with:', testConfig);
    Amplify.configure(testConfig);
    
    console.log('Attempting sign in with email:', email);
    const signInResult = await signIn({
      username: email,
      password: password,
    });
    
    console.log('Sign in result:', signInResult);
    
    // Try to get session
    const session = await fetchAuthSession();
    console.log('Session tokens present:', !!session.tokens);
    
    return {
      success: true,
      result: signInResult,
      hasTokens: !!session.tokens
    };
  } catch (error: any) {
    console.error('Test auth error:', error);
    return {
      success: false,
      error: error.message || error.toString(),
      errorDetails: error
    };
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuth;
}