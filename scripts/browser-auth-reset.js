// Run this in the browser console to immediately clear all authentication data
(function() {
  console.log('🔄 Clearing all authentication data...');
  
  // Clear mock tokens
  localStorage.removeItem('mockToken');
  localStorage.removeItem('mockUser');
  console.log('✅ Cleared mock tokens');
  
  // Clear Zustand auth store
  localStorage.removeItem('clinic-auth-storage');
  console.log('✅ Cleared auth store');
  
  // Clear any Cognito/Amplify related data
  let clearedCount = 0;
  Object.keys(localStorage).forEach(key => {
    if (key.includes('amplify') || key.includes('cognito') || key.includes('auth') || key.includes('aws')) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  console.log(`✅ Cleared ${clearedCount} Cognito/Amplify keys`);
  
  // Clear sessionStorage as well
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('amplify') || key.includes('cognito') || key.includes('auth') || key.includes('aws')) {
      sessionStorage.removeItem(key);
    }
  });
  console.log('✅ Cleared sessionStorage');
  
  console.log('🎉 Authentication cleanup complete! Refreshing page...');
  
  // Force page refresh
  setTimeout(() => {
    window.location.reload();
  }, 1000);
})();
