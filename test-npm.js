const { spawn } = require('child_process');
const path = require('path');

console.log('Testing npm installation...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

const npm = spawn('npm', ['install'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

npm.on('error', (error) => {
  console.error('Error:', error);
});

npm.on('exit', (code) => {
  console.log('npm install exited with code:', code);
});