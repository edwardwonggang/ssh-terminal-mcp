import express from 'express';
import cors from 'cors';

console.log('Starting minimal server...');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/config', (req, res) => {
  console.log('Config request received');
  res.json({ savedSessions: [] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`✓ Minimal server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('✗ Server error:', err);
  process.exit(1);
});

// 等待 5 秒后自动退出
setTimeout(() => {
  console.log('Test completed, shutting down...');
  server.close();
  process.exit(0);
}, 5000);
