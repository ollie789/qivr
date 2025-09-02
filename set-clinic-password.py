#!/usr/bin/env python3
"""
Script to set password for the clinic user in Cognito
"""

import boto3
import sys

# Configuration
REGION = 'ap-southeast-2'
USER_POOL_ID = 'ap-southeast-2_jbutB4tj1'
USERNAME = 'test.doctor@clinic.com'
NEW_PASSWORD = 'ClinicTest123!'

def main():
    try:
        # Initialize Cognito client
        cognito = boto3.client('cognito-idp', region_name=REGION)
        
        print(f"Setting password for user: {USERNAME}")
        print(f"User Pool: {USER_POOL_ID}")
        print(f"Region: {REGION}")
        print()
        
        # First, get the user's current status
        try:
            user_response = cognito.admin_get_user(
                UserPoolId=USER_POOL_ID,
                Username=USERNAME
            )
            current_status = user_response['UserStatus']
            print(f"Current user status: {current_status}")
            
        except Exception as e:
            print(f"Error getting user status: {e}")
            return 1
        
        # Set permanent password
        try:
            cognito.admin_set_user_password(
                UserPoolId=USER_POOL_ID,
                Username=USERNAME,
                Password=NEW_PASSWORD,
                Permanent=True
            )
            print(f"✅ Password successfully set to: {NEW_PASSWORD}")
            print()
            print("You can now login to the Clinic Portal with:")
            print(f"  Email: {USERNAME}")
            print(f"  Password: {NEW_PASSWORD}")
            print(f"  URL: http://localhost:3001/login")
            return 0
            
        except Exception as e:
            # If permanent password fails, try temporary first
            print(f"Setting permanent password failed: {e}")
            print("Trying to set temporary password first...")
            
            try:
                # Set temporary password
                cognito.admin_set_user_password(
                    UserPoolId=USER_POOL_ID,
                    Username=USERNAME,
                    Password=NEW_PASSWORD,
                    Permanent=False
                )
                print("Temporary password set. Now setting permanent...")
                
                # Now set permanent
                cognito.admin_set_user_password(
                    UserPoolId=USER_POOL_ID,
                    Username=USERNAME,
                    Password=NEW_PASSWORD,
                    Permanent=True
                )
                print(f"✅ Password successfully set to: {NEW_PASSWORD}")
                print()
                print("You can now login to the Clinic Portal with:")
                print(f"  Email: {USERNAME}")
                print(f"  Password: {NEW_PASSWORD}")
                print(f"  URL: http://localhost:3001/login")
                return 0
                
            except Exception as e2:
                print(f"❌ Failed to set password: {e2}")
                return 1
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
