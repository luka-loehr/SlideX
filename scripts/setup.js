const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// Install Node.js dependencies
if (!fs.existsSync('node_modules')) {
  console.log('Installing Node.js dependencies...');
  run('npm install');
} else {
  console.log('Node dependencies already installed.');
}

const venvDir = path.join(__dirname, '..', '.venv');
if (!fs.existsSync(venvDir)) {
  console.log('Creating Python virtual environment...');
  run('python3 -m venv .venv');
}

console.log('Installing Python packages...');
const pipCmd = process.platform === 'win32'
  ? '.venv\\Scripts\\pip install -r requirements.txt'
  : '.venv/bin/pip install -r requirements.txt';
run(pipCmd);

if (!fs.existsSync('.env')) {
  console.log('\n✔️  Setup complete. Create a .env file with your configuration.');
  console.log('Example:\nOPENAI_API_KEY=your-key');
} else {
  console.log('\n✔️  Setup complete. Edit the existing .env file as needed.');
}
