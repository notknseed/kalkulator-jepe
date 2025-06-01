#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      const { address, family, internal } = interface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return 'localhost';
}

function startDev() {
  const localIP = getLocalIP();
  
  console.log('\n🚀 Starting Kalkulator Jepe Frontend...\n');
  
  const child = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    
    // Replace the default Next.js output
    if (output.includes('Local:')) {
      console.log(`   ▲ Next.js 14.0.3`);
      console.log(`   - Local:        http://localhost:3000`);
      console.log(`   - Network:      http://${localIP}:3000`);
      console.log(`\n📱 Access from other devices: http://${localIP}:3000`);
      console.log(`🔗 Share this URL with devices on the same WiFi network\n`);
    } else if (!output.includes('Next.js') && !output.includes('- Local:') && !output.includes('ready')) {
      process.stdout.write(output);
    }
  });

  child.on('close', (code) => {
    console.log(`\n👋 Development server stopped with code ${code}`);
  });

  child.on('error', (error) => {
    console.error(`Error starting development server: ${error}`);
  });
}

startDev();