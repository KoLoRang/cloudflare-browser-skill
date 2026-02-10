#!/usr/bin/env node
/**
 * Configuration Helper Script
 * Helps users create configuration file
 */

import { createConfig, validateConfig } from './config.js';
import { createInterface } from 'readline';

// Create command line interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Cloudflare Browser Rendering API Configuration Helper');
  console.log('='.repeat(60));
  console.log();
  console.log('This helper will guide you through creating a configuration file.');
  console.log();
  console.log('How to get API credentials:');
  console.log('1. Visit https://dash.cloudflare.com/');
  console.log('2. Go to My Profile > API Tokens');
  console.log('3. Create a Token with Browser Rendering permissions');
  console.log();
  console.log('-'.repeat(60));
  console.log();

  try {
    // Get Account ID
    const accountId = await question('Please enter your Cloudflare Account ID: ');
    
    if (!accountId || accountId.trim() === '') {
      console.error('❌ Account ID cannot be empty');
      rl.close();
      return;
    }

    // Get API Token
    const apiToken = await question('Please enter your API Token: ');
    
    if (!apiToken || apiToken.trim() === '') {
      console.error('❌ API Token cannot be empty');
      rl.close();
      return;
    }

    console.log();
    console.log('Creating configuration file...');
    
    // Create configuration
    const config = await createConfig(accountId.trim(), apiToken.trim());
    
    console.log();
    console.log('✅ Configuration complete!');
    console.log();
    console.log('Configuration file saved to: assets/config.json');
    console.log();
    console.log('⚠️  Important reminders:');
    console.log('   - Do not commit config.json to version control');
    console.log('   - This file has been automatically added to .gitignore');
    console.log('   - Keep your API credentials secure');
    console.log();
    console.log('You can now start using the Cloudflare Browser Rendering API!');
    console.log();
    
  } catch (error) {
    console.error();
    console.error('❌ Configuration failed:', error.message);
    console.error();
  } finally {
    rl.close();
  }
}

main();
