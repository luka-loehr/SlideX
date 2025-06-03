const axios = require('axios');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');

async function waitForServer() {
  let retries = 10;
  while (retries--) {
    try {
      await axios.get('http://localhost:3000');
      return;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Server did not start in time');
}

async function run() {
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });
  try {
    await waitForServer();
    console.log('Server started');

    const chatRes = await axios.post('http://localhost:3000/api/chat', {
      messages: [{ role: 'user', content: 'Create a one slide presentation about testing.' }]
    });
    if (!chatRes.data) throw new Error('No response from setup agent');
    console.log('Setup agent responded');

    const outline = [{ title: 'Test Slide', content: 'This is a test', type: 'content' }];
    await axios.post('http://localhost:3000/api/generate', {
      prompt: 'Test slide',
      outline
    });
    console.log('Coding agent started');

    const ws = new WebSocket('ws://localhost:3000');
    const slidePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No slide message received')), 20000);
      ws.on('message', data => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'slide') {
            clearTimeout(timer);
            resolve(msg);
          }
        } catch (e) {}
      });
      ws.on('error', reject);
    });

    await slidePromise;
    console.log('Slide received');
    ws.close();
    server.kill();
    console.log('Test passed');
  } catch (err) {
    console.error('Test failed:', err.message);
    server.kill();
    process.exitCode = 1;
  }
}

run();
