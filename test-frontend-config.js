// Simple test to verify frontend configuration
const config = {
  API_URL: process.env.VITE_API_URL || 'http://54.252.48.47:8080',
  COGNITO_USER_POOL_ID: process.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_jbutB4tj1',
  COGNITO_CLIENT_ID: process.env.VITE_COGNITO_CLIENT_ID || '4l510mm689hhpgr12prbuch2og',
  USE_AUTH_PROXY: process.env.VITE_USE_AUTH_PROXY === 'true',
  ENABLE_DEV_AUTH: process.env.VITE_ENABLE_DEV_AUTH === 'true'
};

console.log('Frontend Configuration:');
console.log(JSON.stringify(config, null, 2));

// Test API connection
const testApi = async () => {
  try {
    const response = await fetch(`${config.API_URL}/health`);
    const data = await response.json();
    console.log('\nAPI Health Check:', response.status, data);
  } catch (error) {
    console.error('\nAPI Connection Error:', error.message);
  }
};

testApi();
