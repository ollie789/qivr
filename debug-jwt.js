// Run this in browser console to inspect JWT token and claims
(async function() {
  console.log('🔍 Debugging JWT Token and Claims...');
  
  // Check localStorage for auth data
  const authStorage = localStorage.getItem('clinic-auth-storage');
  if (authStorage) {
    const authData = JSON.parse(authStorage);
    console.log('📦 Auth Storage:', authData);
  }
  
  // Try to get Cognito session
  try {
    if (window.aws && window.aws.amplify) {
      const session = await window.aws.amplify.Auth.currentSession();
      console.log('🔐 Cognito Session:', session);
      
      const accessToken = session.getAccessToken();
      console.log('🎫 Access Token:', accessToken.getJwtToken());
      
      // Decode JWT payload
      const payload = accessToken.payload;
      console.log('📋 Token Payload:', payload);
      
      // Check for tenant_id claim
      const tenantId = payload['custom:tenant_id'] || payload['custom:custom:tenant_id'] || payload['tenant_id'];
      console.log('🏢 Tenant ID from token:', tenantId);
      
      // Check user attributes
      const user = await window.aws.amplify.Auth.currentUserInfo();
      console.log('👤 User Info:', user);
      
      if (user && user.attributes) {
        console.log('📝 User Attributes:', user.attributes);
        const userTenantId = user.attributes['custom:tenant_id'] || user.attributes['custom:custom:tenant_id'];
        console.log('🏢 Tenant ID from attributes:', userTenantId);
      }
    }
  } catch (error) {
    console.error('❌ Error getting Cognito session:', error);
  }
  
  // Check what's being sent in API requests
  console.log('🌐 Checking current API request headers...');
  
  // Intercept fetch to see what's being sent
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    if (url.includes('qivr-alb')) {
      console.log('📡 API Request:', url);
      console.log('📋 Headers:', options?.headers);
    }
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Debug setup complete. Make an API request to see headers.');
})();
