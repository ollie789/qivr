#!/usr/bin/env node

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

class PatientPortalAnalyzer {
  constructor() {
    this.portalPath = '/Users/oliver/Projects/qivr/apps/patient-portal';
  }

  async analyzeFeatures() {
    console.log('🏥 Patient Portal Feature Analysis');
    console.log('==================================\n');

    // Check pages
    const pagesPath = join(this.portalPath, 'src/pages');
    const pages = await readdir(pagesPath);
    
    console.log('📄 Available Pages:');
    const pageFeatures = {
      'Login.tsx': '🔐 Patient Authentication',
      'Register.tsx': '📝 Patient Registration', 
      'Dashboard.tsx': '📊 Patient Dashboard',
      'Appointments.tsx': '📅 Appointment Management',
      'BookAppointment.tsx': '🗓️ Appointment Booking',
      'Messages.tsx': '💬 Patient-Provider Messaging',
      'Profile.tsx': '👤 Profile Management',
      'CompletePROM.tsx': '📋 PROM Questionnaires',
      'Evaluations.tsx': '🔍 Medical Evaluations',
      'MedicalRecordsEnhanced.tsx': '📋 Medical Records',
      'DocumentsEnhanced.tsx': '📄 Document Management',
      'AnalyticsEnhanced.tsx': '📈 Health Analytics',
      'VerifyEmail.tsx': '✉️ Email Verification',
      'ConfirmEmail.tsx': '✅ Email Confirmation'
    };

    pages.forEach(page => {
      const feature = pageFeatures[page] || '❓ Unknown Feature';
      console.log(`  ✓ ${feature} (${page})`);
    });

    // Check services
    console.log('\n🔧 API Services:');
    const servicesPath = join(this.portalPath, 'src/services');
    try {
      const services = await readdir(servicesPath);
      services.forEach(service => {
        console.log(`  ✓ ${service}`);
      });
    } catch (error) {
      console.log('  ⚠️  Services directory not found');
    }

    // Check package.json for dependencies
    console.log('\n📦 Key Dependencies:');
    const packagePath = join(this.portalPath, 'package.json');
    const packageContent = await readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const keyDeps = {
      'react': 'React Framework',
      '@mui/material': 'Material-UI Components',
      '@tanstack/react-query': 'Data Fetching',
      'aws-amplify': 'AWS Authentication',
      'react-router-dom': 'Navigation',
      'recharts': 'Charts & Analytics',
      'notistack': 'Notifications'
    };

    Object.entries(keyDeps).forEach(([dep, desc]) => {
      if (packageJson.dependencies[dep]) {
        console.log(`  ✓ ${desc} (${dep})`);
      }
    });

    return {
      pages: pages.length,
      features: Object.keys(pageFeatures).filter(p => pages.includes(p)).length
    };
  }

  async checkBuildStatus() {
    console.log('\n🔨 Build Configuration:');
    
    // Check if dist exists
    try {
      const distPath = join(this.portalPath, 'dist');
      await readdir(distPath);
      console.log('  ✓ Built assets exist');
    } catch (error) {
      console.log('  ⚠️  No built assets found - run npm run build');
    }

    // Check Vite config
    try {
      const viteConfigPath = join(this.portalPath, 'vite.config.ts');
      await readFile(viteConfigPath);
      console.log('  ✓ Vite configuration present');
    } catch (error) {
      console.log('  ⚠️  Vite config not found');
    }
  }

  async checkDeploymentReadiness() {
    console.log('\n🚀 Deployment Readiness:');
    
    const checks = [
      {
        name: 'Environment Configuration',
        check: async () => {
          try {
            const envPath = join(this.portalPath, '.env');
            await readFile(envPath);
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'AWS Amplify Config',
        check: async () => {
          try {
            const configPath = join(this.portalPath, 'src/config/amplify.config.ts');
            await readFile(configPath);
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'TypeScript Configuration',
        check: async () => {
          try {
            const tsConfigPath = join(this.portalPath, 'tsconfig.json');
            await readFile(tsConfigPath);
            return true;
          } catch {
            return false;
          }
        }
      }
    ];

    for (const check of checks) {
      const result = await check.check();
      console.log(`  ${result ? '✓' : '⚠️'} ${check.name}`);
    }
  }

  async generateRecommendations() {
    console.log('\n💡 Recommendations:');
    console.log('==================');
    
    console.log('1. 🌐 Set up patient.qivr.pro subdomain');
    console.log('   - Add DNS CNAME record pointing to CloudFront');
    console.log('   - Update SSL certificate to include subdomain');
    
    console.log('\n2. 🔧 Complete patient portal deployment');
    console.log('   - Add patient portal build to CI/CD pipeline');
    console.log('   - Deploy to separate S3 bucket or subdirectory');
    
    console.log('\n3. 🔐 Configure patient authentication');
    console.log('   - Set up separate Cognito User Pool for patients');
    console.log('   - Configure patient-specific auth flows');
    
    console.log('\n4. 🧪 Run comprehensive tests');
    console.log('   - Install Playwright: npm install -D playwright');
    console.log('   - Run full UI tests: node scripts/tests/test-patient-portal.mjs');
    
    console.log('\n5. 📱 Mobile optimization');
    console.log('   - Test responsive design on mobile devices');
    console.log('   - Consider PWA features for mobile app-like experience');
  }

  async run() {
    const analysis = await this.analyzeFeatures();
    await this.checkBuildStatus();
    await this.checkDeploymentReadiness();
    await this.generateRecommendations();
    
    console.log('\n📊 Summary:');
    console.log(`   Pages: ${analysis.pages}`);
    console.log(`   Features: ${analysis.features}`);
    console.log('   Status: Ready for deployment setup');
  }
}

// Run analysis
const analyzer = new PatientPortalAnalyzer();
analyzer.run().catch(console.error);
