// Clear mock tokens from localStorage
console.log('Clearing mock tokens from localStorage...');
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('mockToken');
  localStorage.removeItem('mockUser');
  console.log('Mock tokens cleared!');
} else {
  console.log('Run this in browser console:');
  console.log('localStorage.removeItem("mockToken");');
  console.log('localStorage.removeItem("mockUser");');
}
