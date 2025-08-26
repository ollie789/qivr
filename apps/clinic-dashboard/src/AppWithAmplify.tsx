import React, { useEffect, useState } from 'react';

function AppWithAmplify() {
  const [amplifyStatus, setAmplifyStatus] = useState('Not loaded');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('AppWithAmplify: Attempting to load Amplify config...');
    setAmplifyStatus('Loading Amplify...');
    
    try {
      // Try to import the Amplify config
      import('./config/amplify.config')
        .then(() => {
          console.log('Amplify config loaded successfully');
          setAmplifyStatus('Amplify loaded successfully!');
        })
        .catch((err) => {
          console.error('Failed to load Amplify config:', err);
          setError(err.toString());
          setAmplifyStatus('Failed to load Amplify');
        });
    } catch (err) {
      console.error('Error importing Amplify:', err);
      setError(err.toString());
      setAmplifyStatus('Error importing Amplify');
    }
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Qivr Clinic Dashboard - Amplify Test</h1>
      <p>Status: {amplifyStatus}</p>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}
      <hr />
      <p>Check the browser console for detailed error messages.</p>
    </div>
  );
}

export default AppWithAmplify;
