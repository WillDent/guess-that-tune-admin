const { spawn } = require('child_process');
const path = require('path');

console.log('=== Starting Guess That Tune Admin Server ===\n');

// Log environment
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Check for .env.local
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  console.log('✓ .env.local found');
} else {
  console.log('✗ .env.local NOT FOUND');
}

// Check node_modules
if (fs.existsSync('node_modules')) {
  console.log('✓ node_modules exists');
} else {
  console.log('✗ node_modules NOT FOUND - run: npm install');
  process.exit(1);
}

console.log('\nStarting Next.js development server...\n');

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('\n❌ Failed to start server:', error.message);
  if (error.code === 'ENOENT') {
    console.error('npm command not found. Check your Node.js installation.');
  }
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
  }
});