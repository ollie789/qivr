// Clear all authentication-related localStorage data
console.log('Clearing all authentication data from localStorage...');

// Clear mock tokens
localStorage.removeItem('mockToken');
localStorage.removeItem('mockUser');

// Clear Zustand auth store
localStorage.removeItem('clinic-auth-storage');

// Clear any Cognito/Amplify related data
Object.keys(localStorage).forEach(key => {
  if (key.includes('amplify') || key.includes('cognito') || key.includes('auth')) {
    console.log(`Removing: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log('Authentication data cleared. Please refresh the page and sign in again.');
