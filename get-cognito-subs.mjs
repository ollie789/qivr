#!/usr/bin/env node

/**
 * Script to get Cognito sub values for test users
 * This will sign in users and retrieve their sub IDs from the ID token
 */

import { Amplify } from '@aws-amplify/core';
import { signIn, fetchAuthSession, signOut } from '@aws-amplify/auth';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configure Amplify for clinic user pool
const clinicConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_jbutB4tj1',
      userPoolClientId: '4l510mm689hhpgr12prbuch2og',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      }
    }
  }
};

// Configure Amplify for patient user pool  
const patientConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_aNfKxXXm9',
      userPoolClientId: '3v3ujhcvhstq5ubfcjn088qahb',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      }
    }
  }
};

async function getCognitoSub(email, password, userType) {
  try {
    console.log(`\n${colors.blue}Retrieving Cognito sub for ${userType}...${colors.reset}`);
    console.log(`  Email: ${email}`);
    
    // Configure for the appropriate user pool
    if (userType === 'clinic') {
      Amplify.configure(clinicConfig);
    } else {
      Amplify.configure(patientConfig);
    }
    
    // Sign in
    const signInResult = await signIn({
      username: email,
      password: password
    });
    
    if (!signInResult.isSignedIn) {
      throw new Error('Sign in failed or requires additional steps');
    }
    
    // Get auth session with tokens
    const session = await fetchAuthSession();
    
    if (!session.tokens?.idToken) {
      throw new Error('No ID token available');
    }
    
    const payload = session.tokens.idToken.payload;
    const sub = payload.sub;
    
    console.log(`${colors.green}✓ Successfully retrieved Cognito sub${colors.reset}`);
    console.log(`  Sub: ${colors.bright}${sub}${colors.reset}`);
    
    // Sign out
    await signOut();
    
    return sub;
    
  } catch (error) {
    console.error(`${colors.red}✗ Failed to get sub for ${email}: ${error.message}${colors.reset}`);
    return null;
  }
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}Retrieving Cognito Sub Values for QIVR Test Users${colors.reset}\n`);
  
  const results = [];
  
  // Get clinic doctor sub
  const clinicSub = await getCognitoSub(
    'test.doctor@clinic.com',
    'ClinicTest123!',
    'clinic'
  );
  
  if (clinicSub) {
    results.push({ email: 'test.doctor@clinic.com', sub: clinicSub, type: 'clinic' });
  }
  
  // Get patient sub
  const patientSub = await getCognitoSub(
    'patient@qivr.health',
    'Patient123!',
    'patient'
  );
  
  if (patientSub) {
    results.push({ email: 'patient@qivr.health', sub: patientSub, type: 'patient' });
  }
  
  // Display results
  console.log(`\n${colors.cyan}${colors.bright}Summary:${colors.reset}`);
  
  if (results.length === 0) {
    console.log(`${colors.yellow}No Cognito subs could be retrieved. Please ensure the users exist in Cognito.${colors.reset}`);
    console.log(`\nYou may need to create the users first using the Cognito console or AWS CLI.`);
  } else {
    console.log(`\n${colors.green}Successfully retrieved ${results.length} Cognito sub(s):${colors.reset}\n`);
    
    results.forEach(result => {
      console.log(`  ${result.email}:`);
      console.log(`    Sub: ${colors.bright}${result.sub}${colors.reset}`);
      console.log(`    Type: ${result.type}`);
    });
    
    console.log(`\n${colors.cyan}To sync these users to the database, run:${colors.reset}`);
    console.log(`${colors.bright}export CLINIC_DOCTOR_SUB="${clinicSub || 'CLINIC_SUB_HERE'}"${colors.reset}`);
    console.log(`${colors.bright}export PATIENT_SUB="${patientSub || 'PATIENT_SUB_HERE'}"${colors.reset}`);
    console.log(`${colors.bright}./scripts/sync-dev-users.sh${colors.reset}`);
  }
}

// Run the script
main().catch(error => {
  console.error(`\n${colors.red}${colors.bright}Script failed:${colors.reset}`);
  console.error(`${colors.red}${error.message}${colors.reset}`);
  process.exit(1);
});