const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Running AI Summary Test...\n');

// Change to server directory and run the test
const testProcess = spawn('npm', ['test', '--', '--testPathPatterns=aiService.test.ts', '--verbose'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  console.log(`\n✅ Test completed with exit code: ${code}`);
  if (code === 0) {
    console.log('🎉 AI Summary tests passed!');
  } else {
    console.log('❌ AI Summary tests failed');
  }
});

testProcess.on('error', (err) => {
  console.error('❌ Error running AI Summary test:', err);
});
