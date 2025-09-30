console.log('Testing node-pty import...');

try {
  const pty = await import('node-pty');
  console.log('✓ node-pty imported successfully');
  console.log('Available methods:', Object.keys(pty));
  
  // 测试创建一个简单的 shell
  console.log('\nTesting shell creation...');
  const shell = pty.spawn('cmd.exe', [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env
  });
  console.log('✓ Shell created successfully');
  shell.kill();
  console.log('✓ Shell terminated successfully');
} catch (error) {
  console.error('✗ Failed:', error.message);
  console.error('Stack:', error.stack);
}
