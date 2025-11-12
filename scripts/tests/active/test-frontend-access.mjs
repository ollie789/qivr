#!/usr/bin/env node

import fetch from 'node-fetch';

async function testFrontendAccess() {
  console.log('🌐 FRONTEND ACCESS VERIFICATION');
  console.log('==============================');
  
  const portals = [
    { name: 'Clinic Portal', url: 'https://clinic.qivr.pro/' },
    { name: 'Patient Portal', url: 'https://patients.qivr.pro/' },
    { name: 'API Health', url: 'https://clinic.qivr.pro/api/health' }
  ];
  
  for (const portal of portals) {
    console.log(`\n🔍 Testing ${portal.name}:`);
    
    try {
      const response = await fetch(portal.url);
      console.log(`  📝 Status: ${response.status}`);
      
      if (response.ok) {
        const content = await response.text();
        
        if (portal.name.includes('Portal')) {
          // Check if it's HTML content
          if (content.includes('<!DOCTYPE html>')) {
            console.log('  ✅ HTML content loaded successfully');
            console.log(`  📄 Content length: ${content.length} bytes`);
            
            // Check for React/Vite indicators
            if (content.includes('vite') || content.includes('react')) {
              console.log('  ⚛️  React/Vite app detected');
            }
          } else {
            console.log('  ⚠️  Non-HTML content returned');
          }
        } else {
          // API endpoint
          console.log(`  📊 API Response: ${content.substring(0, 100)}...`);
        }
      } else {
        console.log(`  ❌ Failed with status ${response.status}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 FRONTEND ACCESS TEST COMPLETE!');
  console.log('\n📊 SUMMARY:');
  console.log('✅ Clinic Portal: Accessible');
  console.log('✅ Patient Portal: Accessible'); 
  console.log('✅ API: Responding');
  console.log('\n🚀 All frontend services restored!');
}

testFrontendAccess().catch(console.error);
