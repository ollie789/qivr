#!/usr/bin/env node

const AWS = require('aws-sdk');
const readline = require('readline');

// Configure AWS
AWS.config.update({
  region: 'us-east-1' // Update this to your AWS region
});

const cognito = new AWS.CognitoIdentityServiceProvider();

// Cognito User Pool configuration
const USER_POOL_ID = 'us-east-1_1PHs4pV9s'; // Your User Pool ID
const CLIENT_ID = '6j8tfvvbl9q73iqj2bchjqkvfe'; // Your App Client ID

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createClinicUser() {
  console.log('=== Qivr Clinic Portal - Create User ===\n');
  
  try {
    // Get user details
    const email = await question('Enter email address for the clinic user: ');
    const password = await question('Enter password (min 8 chars, uppercase, lowercase, number): ');
    const clinicName = await question('Enter clinic name: ');
    const firstName = await question('Enter first name: ');
    const lastName = await question('Enter last name: ');
    
    console.log('\nCreating user...');
    
    // Create the user in Cognito
    const signUpParams = {
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:clinic_name', Value: clinicName },
        { Name: 'custom:role', Value: 'ClinicAdmin' }
      ]
    };
    
    try {
      const signUpResult = await cognito.signUp(signUpParams).promise();
      console.log('✓ User created successfully!');
      console.log('  User ID:', signUpResult.UserSub);
      
      // Auto-confirm the user (for testing)
      const confirmChoice = await question('\nAuto-confirm this user? (y/n): ');
      if (confirmChoice.toLowerCase() === 'y') {
        const confirmParams = {
          UserPoolId: USER_POOL_ID,
          Username: email
        };
        
        await cognito.adminConfirmSignUp(confirmParams).promise();
        console.log('✓ User confirmed successfully!');
        
        // Set permanent password
        const setPasswordParams = {
          UserPoolId: USER_POOL_ID,
          Username: email,
          Password: password,
          Permanent: true
        };
        
        await cognito.adminSetUserPassword(setPasswordParams).promise();
        console.log('✓ Password set successfully!');
      }
      
      console.log('\n=== User Created Successfully ===');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Clinic:', clinicName);
      console.log('\nYou can now log in to the Clinic Portal with these credentials.');
      
    } catch (error) {
      if (error.code === 'UsernameExistsException') {
        console.error('✗ User with this email already exists!');
        
        const resetChoice = await question('\nWould you like to reset the password for this user? (y/n): ');
        if (resetChoice.toLowerCase() === 'y') {
          const setPasswordParams = {
            UserPoolId: USER_POOL_ID,
            Username: email,
            Password: password,
            Permanent: true
          };
          
          await cognito.adminSetUserPassword(setPasswordParams).promise();
          console.log('✓ Password reset successfully!');
          console.log('\nYou can now log in with:');
          console.log('Email:', email);
          console.log('Password:', password);
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('\n✗ Error creating user:', error.message);
    if (error.code === 'InvalidParameterException') {
      console.log('\nPassword requirements:');
      console.log('- Minimum 8 characters');
      console.log('- At least one uppercase letter');
      console.log('- At least one lowercase letter');
      console.log('- At least one number');
      console.log('- May include special characters');
    }
  } finally {
    rl.close();
  }
}

// Quick create option for testing
async function quickCreateTestUser() {
  console.log('=== Quick Create Test User ===\n');
  
  const testUser = {
    email: 'admin@qivrclinic.com',
    password: 'TestClinic123!',
    clinicName: 'Qivr Test Clinic',
    firstName: 'Admin',
    lastName: 'User'
  };
  
  console.log('Creating test user with:');
  console.log('Email:', testUser.email);
  console.log('Password:', testUser.password);
  console.log('Clinic:', testUser.clinicName);
  console.log();
  
  const signUpParams = {
    ClientId: CLIENT_ID,
    Username: testUser.email,
    Password: testUser.password,
    UserAttributes: [
      { Name: 'email', Value: testUser.email },
      { Name: 'given_name', Value: testUser.firstName },
      { Name: 'family_name', Value: testUser.lastName },
      { Name: 'custom:clinic_name', Value: testUser.clinicName },
      { Name: 'custom:role', Value: 'ClinicAdmin' }
    ]
  };
  
  try {
    await cognito.signUp(signUpParams).promise();
    console.log('✓ User created!');
    
    // Auto-confirm
    await cognito.adminConfirmSignUp({
      UserPoolId: USER_POOL_ID,
      Username: testUser.email
    }).promise();
    console.log('✓ User confirmed!');
    
    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: testUser.email,
      Password: testUser.password,
      Permanent: true
    }).promise();
    console.log('✓ Password set!');
    
    console.log('\n=== Test User Ready ===');
    console.log('You can now log in with:');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    
  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      console.log('User already exists. Resetting password...');
      await cognito.adminSetUserPassword({
        UserPoolId: USER_POOL_ID,
        Username: testUser.email,
        Password: testUser.password,
        Permanent: true
      }).promise();
      console.log('✓ Password reset!');
      console.log('\nYou can now log in with:');
      console.log('Email:', testUser.email);
      console.log('Password:', testUser.password);
    } else {
      console.error('Error:', error.message);
    }
  }
  
  rl.close();
}

// Main menu
async function main() {
  console.log('Choose an option:');
  console.log('1. Create custom clinic user');
  console.log('2. Quick create test user (admin@qivrclinic.com)');
  console.log('3. Exit');
  
  const choice = await question('\nEnter choice (1-3): ');
  
  switch(choice) {
    case '1':
      await createClinicUser();
      break;
    case '2':
      await quickCreateTestUser();
      break;
    case '3':
      console.log('Goodbye!');
      rl.close();
      break;
    default:
      console.log('Invalid choice');
      rl.close();
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
