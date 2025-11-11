#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const REGION = 'ap-southeast-2';
const ECS_LOG_GROUP = '/ecs/qivr-api';
const RDS_LOG_GROUP = '/aws/rds/instance/qivr-dev-db/postgresql';

async function getRecentLogs(logGroup, minutes = 10) {
  const startTime = Date.now() - (minutes * 60 * 1000);
  
  try {
    // Get log streams
    const { stdout: streamsOutput } = await execAsync(
      `aws logs describe-log-streams --log-group-name "${logGroup}" --order-by LastEventTime --descending --limit 5 --region ${REGION}`
    );
    
    const streams = JSON.parse(streamsOutput);
    if (!streams.logStreams || streams.logStreams.length === 0) {
      console.log(`  ⚠️  No log streams found in ${logGroup}`);
      return [];
    }
    
    const latestStream = streams.logStreams[0];
    console.log(`  📝 Latest stream: ${latestStream.logStreamName}`);
    
    // Get recent log events
    const { stdout: eventsOutput } = await execAsync(
      `aws logs get-log-events --log-group-name "${logGroup}" --log-stream-name "${latestStream.logStreamName}" --start-time ${startTime} --region ${REGION}`
    );
    
    const events = JSON.parse(eventsOutput);
    return events.events || [];
    
  } catch (error) {
    console.log(`  ❌ Error fetching logs from ${logGroup}: ${error.message}`);
    return [];
  }
}

async function debugLogs() {
  console.log('🔍 CLOUDWATCH LOGS DEBUGGING\n');
  
  // 1. ECS Application Logs
  console.log('📋 1. ECS Application Logs (Last 10 minutes)');
  const ecsLogs = await getRecentLogs(ECS_LOG_GROUP, 10);
  
  if (ecsLogs.length > 0) {
    console.log(`  ✅ Found ${ecsLogs.length} ECS log entries`);
    
    // Show errors and warnings
    const errors = ecsLogs.filter(log => 
      log.message.toLowerCase().includes('error') || 
      log.message.toLowerCase().includes('exception') ||
      log.message.toLowerCase().includes('fail')
    );
    
    if (errors.length > 0) {
      console.log(`  🚨 Found ${errors.length} error/warning entries:`);
      errors.slice(-5).forEach(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        console.log(`    [${timestamp}] ${log.message.substring(0, 100)}...`);
      });
    } else {
      console.log('  ✅ No errors found in recent ECS logs');
    }
    
    // Show recent activity
    console.log('  📝 Recent ECS activity:');
    ecsLogs.slice(-3).forEach(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      console.log(`    [${timestamp}] ${log.message.substring(0, 80)}...`);
    });
    
  } else {
    console.log('  ⚠️  No recent ECS logs found');
  }
  
  // 2. RDS Database Logs
  console.log('\n📋 2. RDS PostgreSQL Logs (Last 10 minutes)');
  const rdsLogs = await getRecentLogs(RDS_LOG_GROUP, 10);
  
  if (rdsLogs.length > 0) {
    console.log(`  ✅ Found ${rdsLogs.length} RDS log entries`);
    
    // Show database errors
    const dbErrors = rdsLogs.filter(log => 
      log.message.toLowerCase().includes('error') || 
      log.message.toLowerCase().includes('fatal') ||
      log.message.toLowerCase().includes('constraint') ||
      log.message.toLowerCase().includes('duplicate')
    );
    
    if (dbErrors.length > 0) {
      console.log(`  🚨 Found ${dbErrors.length} database error entries:`);
      dbErrors.slice(-5).forEach(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        console.log(`    [${timestamp}] ${log.message.substring(0, 100)}...`);
      });
    } else {
      console.log('  ✅ No database errors found in recent RDS logs');
    }
    
    // Show connection activity
    const connections = rdsLogs.filter(log => 
      log.message.includes('connection') || 
      log.message.includes('authentication')
    );
    
    if (connections.length > 0) {
      console.log(`  📝 Recent connection activity (${connections.length} entries):`);
      connections.slice(-3).forEach(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        console.log(`    [${timestamp}] ${log.message.substring(0, 80)}...`);
      });
    }
    
  } else {
    console.log('  ⚠️  No recent RDS logs found');
  }
  
  // 3. CodeBuild Logs (for deployment debugging)
  console.log('\n📋 3. Recent CodeBuild Status');
  try {
    const { stdout: buildsOutput } = await execAsync(
      `aws codebuild list-builds --sort-order DESCENDING --region ${REGION}`
    );
    
    const builds = JSON.parse(buildsOutput);
    if (builds.ids && builds.ids.length > 0) {
      const latestBuildId = builds.ids[0];
      
      const { stdout: buildOutput } = await execAsync(
        `aws codebuild batch-get-builds --ids "${latestBuildId}" --region ${REGION}`
      );
      
      const buildInfo = JSON.parse(buildOutput);
      const build = buildInfo.builds[0];
      
      console.log(`  📝 Latest build: ${build.buildNumber}`);
      console.log(`  📝 Status: ${build.buildStatus}`);
      console.log(`  📝 Phase: ${build.currentPhase}`);
      
      if (build.buildStatus === 'FAILED') {
        console.log('  🚨 Latest build failed!');
        const failedPhase = build.phases.find(p => p.phaseStatus === 'FAILED');
        if (failedPhase) {
          console.log(`  📝 Failed in: ${failedPhase.phaseType}`);
          if (failedPhase.contexts && failedPhase.contexts[0]) {
            console.log(`  📝 Error: ${failedPhase.contexts[0].message}`);
          }
        }
      } else {
        console.log('  ✅ Latest build successful');
      }
    }
  } catch (error) {
    console.log(`  ❌ Error fetching CodeBuild info: ${error.message}`);
  }
  
  console.log('\n🎯 DEBUGGING SUMMARY:');
  console.log('- Check ECS logs for application errors');
  console.log('- Check RDS logs for database constraint issues');
  console.log('- Check CodeBuild status for deployment issues');
  console.log('- Use timestamps to correlate issues across services');
}

debugLogs().catch(error => {
  console.error('💥 Debug failed:', error.message);
  process.exit(1);
});
